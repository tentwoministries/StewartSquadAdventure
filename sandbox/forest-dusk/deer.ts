// The deer (camp.md §2.2 #29, world-events §2.7.1): procedural, ≤ 400 tris, with a small wander:
// graze → pick a spot in its patch → walk there slowly → graze. Ear flicks, head bob, eased turns.
// Tempo per docs/reference/MOTION_TEMPO_NOTES.md: unhurried; nothing pops.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { rng } from '../_shared/rng';
import { C } from '../_shared/style';

const mat = makeWorldMaterial({ roughness: 0.95 });
const box = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Deer {
  root: THREE.Group;
  /** Advance the wander and the animation; groundY keeps the hooves on the terrain. */
  update: (t: number, dt: number, groundY: (x: number, z: number) => number) => void;
  /** Park at a position and heading (for a station frame), grazing. */
  park: (x: number, z: number, bearing: number) => void;
  /** Start a walk to a new spot now (demo key). */
  walkNow: () => void;
  /** Walking speed in m/s (demo keys nudge it). */
  speed: { value: number };
}

export interface Patch { x: number; z: number; r: number; avoid: { x: number; z: number; r: number }[] }

/** Built facing local +x; shoulder height 1.3 m. */
export function makeDeer(patch: Patch, seed = 5): Deer {
  const root = new THREE.Group();
  const body = node(0, 0.95, 0);
  const torso = colorize(new THREE.CylinderGeometry(0.24, 0.27, 0.95, 6), C.deer);
  torso.rotateZ(Math.PI / 2); torso.scale(1, 1, 0.85);
  body.add(mesh(mergeGeos([
    torso,
    xf(box(0.7, 0.08, 0.34, C.deerBelly), -0.05, -0.24),
    xf(box(0.16, 0.14, 0.08, '#FFFFFF'), -0.5, 0.1),
    xf(box(0.18, 0.1, 0.24, C.deerBelly), -0.45, 0.02),
  ])));
  const neck = node(0.4, 0.2, 0);
  neck.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 6), C.deer), 0, 0.22)));
  const head = node(0.0, 0.46, 0);
  head.add(mesh(mergeGeos([
    xf(box(0.34, 0.2, 0.18, C.deer), 0.12, 0.02),
    xf(box(0.14, 0.12, 0.12, C.deerDark), 0.34, -0.02),
    xf(box(0.03, 0.03, 0.05, '#1A1410'), 0.41, 0.0),
    xf(box(0.03, 0.035, 0.03, '#1A1410'), 0.22, 0.09, 0.09),
    xf(box(0.03, 0.035, 0.03, '#1A1410'), 0.22, 0.09, -0.09),
  ])));
  const ears: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const ear = mesh(xf(box(0.04, 0.16, 0.09, C.deer), 0, 0.08));
    ear.position.set(0.02, 0.1, s * 0.1); ear.rotation.x = s * 0.5; head.add(ear); ears.push(ear);
    const beam = mergeGeos([
      xf(box(0.03, 0.42, 0.03, C.antler), 0, 0.21, 0, 0, 0, s * 0.15),
      xf(box(0.03, 0.2, 0.03, C.antler), 0.09, 0.32, 0, 0, 0, -0.7),
      xf(box(0.03, 0.16, 0.03, C.antler), -0.08, 0.4, 0, 0, 0, 0.6),
    ]);
    const ant = mesh(beam); ant.position.set(0.02, 0.1, s * 0.06); ant.rotation.x = s * 0.35; head.add(ant);
  }
  neck.add(head); body.add(neck);
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[0.32, 0.14], [0.32, -0.14], [-0.32, 0.14], [-0.32, -0.14]]) {
    const hip = node(x, -0.15, z);
    hip.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.05, 0.045, 0.4, 5), C.deer), 0, -0.2)));
    const knee = node(0, -0.4, 0);
    knee.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.04, 0.035, 0.38, 5), C.deer), 0, -0.19)));
    knee.add(mesh(xf(box(0.08, 0.06, 0.08, C.deerDark), 0, -0.38)));
    hip.add(knee); body.add(hip); legs.push(hip);
  }
  root.add(body);

  // ---- behaviour ------------------------------------------------------------------------------
  const r = rng(seed);
  const speed = { value: 0.55 }; // m/s: slower than the bible's 1.0 for the demo (Andrew); [ and ] nudge it
  let state: 'graze' | 'walk' | 'look' = 'graze';
  let stateT = 6 + r() * 5;
  let heading = 0;
  const route: THREE.Vector2[] = []; // waypoints of the current walk; the last is the destination
  let routeIdx = 0;
  let scripted = 0; // how many scripted passes have run (key 0 steps through them, then wanders)
  let walkPhase = 0, graze = 1, stride = 0; // graze: 0 head up → 1 head down (eased)
  let earT = 0, nextEar = 2.5 + r() * 2.5;
  const setRoute = (pts: [number, number][]) => { route.length = 0; for (const [x, z] of pts) route.push(new THREE.Vector2(x, z)); routeIdx = 0; state = 'walk'; stateT = 60; };
  const pickWander = () => {
    for (let i = 0; i < 20; i++) {
      const a = r() * Math.PI * 2, dd = 2 + r() * (patch.r - 2);
      const x = patch.x + Math.cos(a) * dd, z = patch.z + Math.sin(a) * dd;
      if (patch.avoid.some((c) => Math.hypot(c.x - x, c.z - z) < c.r)) continue;
      setRoute([[x, z]]); return;
    }
    setRoute([[patch.x, patch.z]]);
  };
  const update = (t: number, dt: number, groundY: (x: number, z: number) => number) => {
    stateT -= dt;
    if (state === 'graze' && stateT <= 0) { if (r() < 0.3) { state = 'look'; stateT = 2 + r() * 2; } else pickWander(); }
    else if (state === 'look' && stateT <= 0) pickWander();
    if (state === 'walk') {
      const wp = route[routeIdx];
      if (!wp || stateT <= 0) { state = 'graze'; stateT = 8 + r() * 6; }
      else {
        const dx = wp.x - root.position.x, dz = wp.y - root.position.z, dist = Math.hypot(dx, dz);
        const last = routeIdx === route.length - 1;
        if (dist < (last ? 0.35 : 0.9)) { routeIdx++; if (routeIdx >= route.length) { state = 'graze'; stateT = 10 + r() * 6; } }
        else {
          const want = Math.atan2(-dz, dx);
          const turnRate = 1.3; // rad/s: a smooth arc, never a pivot
          let diff = ((want - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          diff = Math.max(-turnRate * dt, Math.min(turnRate * dt, diff));
          heading += diff;
          const sp = speed.value * (last ? Math.min(1, dist / 1.2) : 1);
          root.position.x += Math.cos(heading) * sp * dt;
          root.position.z -= Math.sin(heading) * sp * dt;
          stride = Math.min(1, stride + dt * 2);
        }
      }
    }
    if (state !== 'walk') stride = Math.max(0, stride - dt * 2);
    root.rotation.y = heading;
    root.position.y = groundY(root.position.x, root.position.z);
    // walk cycle: a slow diagonal walk, faded in and out; the cycle rate follows the speed
    walkPhase += dt * 6.283 * (0.95 * speed.value / 0.55) * stride;
    // eating pose (graze → 1): the body drops, the front legs reach forward with bent knees, the
    // rear legs crouch a little, the neck swings down and the muzzle points at the grass with a nibble
    const wantGraze = state === 'graze' ? 1 : 0;
    graze += (wantGraze - graze) * Math.min(1, dt * 1.6);
    legs.forEach((l, i) => {
      const ph = i === 0 || i === 3 ? 0 : Math.PI;
      const front = i < 2;
      const walk = Math.sin(walkPhase + ph) * 0.32 * stride;
      l.rotation.z = walk + (front ? 0.42 : -0.12) * graze;
      const knee = l.children[1] as THREE.Object3D;
      knee.rotation.z = (front ? -0.55 : 0.18) * graze;
    });
    body.position.y = 0.95 - 0.16 * graze + Math.abs(Math.sin(walkPhase)) * 0.02 * stride + 0.006 * Math.sin(t * 1.2);
    body.rotation.z = -0.08 * graze;
    const nibble = state === 'graze' ? 0.06 * Math.sin(t * 2.6) + 0.02 * Math.sin(t * 7.1) : 0;
    neck.rotation.z = -0.7 - 1.75 * graze + 0.05 * Math.sin(walkPhase * 2) * stride + nibble;
    head.rotation.z = 0.6 + 0.8 * graze; // muzzle about 60° below horizontal, forward, at the grass (nose height ≈ 0.25 m)
    head.rotation.y = state === 'look' ? 0.5 * Math.sin(t * 0.9) : 0;
    // ears: a flick every few seconds (Andrew liked the timing); the near ear leads
    if (t - earT > nextEar) { earT = t; nextEar = 2.5 + r() * 3; }
    const flick = Math.max(0, 1 - Math.abs((t - earT) - 0.2) * 8);
    ears.forEach((e, i) => { e.rotation.z = flick * 0.5 * (i === 0 ? 1 : 0.4); });
  };
  const park = (x: number, z: number, bearing: number) => {
    root.position.set(x, 0, z);
    heading = ((90 - bearing) * Math.PI) / 180;
    state = 'graze'; stateT = 9; graze = 1; stride = 0; scripted = 0;
  };
  // The demo's two scripted passes (Andrew, 2026-09-07): first an arc from beside the tent up to the
  // camp, ending between the chopping block (−4.2, 2.3) and the bucket (−1.2, 4.6), left of Liam;
  // then down the stream path to the pool's bank for a drink (the same lowered pose at the water).
  const PASSES: [number, number][][] = [
    [[-9.6, 1.6], [-8.2, 4.4], [-5.6, 5.2], [-3.2, 4.4], [-2.7, 3.7]],
    [[-2.4, 6.0], [-2.9, 8.2], [-3.2, 10.0]], // ends on the pool bank, nose to the water (edge ≈ z 10.7 at x −3)
  ];
  const walkNow = () => { if (scripted < PASSES.length) setRoute(PASSES[scripted++]!); else pickWander(); };
  return { root, update, park, walkNow, speed };
}
