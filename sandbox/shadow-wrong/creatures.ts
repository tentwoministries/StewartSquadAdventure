// The shard's two animals (world-events-weather.md §2.7.1, camp.md §2.8): the shadow deer — the
// Forest deer's silhouette in the shadow material, void with a rift rim, which **dissolves** into
// rising cyan motes when a hero comes near and reforms 20 s later somewhere else — and the mirror
// fox, which the Forest's fox is not: it keeps 12 m between you and it, always.
import * as THREE from 'three';
import { flicker, makeWander } from '../_shared/creature';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePoints } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
import { groundY } from '../forest-dusk/terrain';
import { VOID } from './sky';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

export interface Creatures {
  group: THREE.Group;
  update: (t: number, dt: number, hero: THREE.Vector3) => void;
  poi: () => THREE.Vector3 | null;
  dissolveNow: () => string;
  hud: () => string[];
}

/** A body plus an inverted-hull shell in rift cyan: the shadow material's rim, cheaply. */
function shadowBody(parts: THREE.BufferGeometry[], mat: THREE.Material, rimMat: THREE.Material, swell: number): THREE.Group {
  const g = new THREE.Group();
  const merged = mergeGeos(parts);
  const body = new THREE.Mesh(merged, mat);
  const rim = new THREE.Mesh(merged.clone(), rimMat);
  rim.scale.setScalar(1 + swell);
  rim.layers.enable(BLOOM_LAYER);
  g.add(rim, body);
  return g;
}

export function makeCreatures(): Creatures {
  const group = new THREE.Group();
  const r = rng(233);
  const voidMat = makeWorldMaterial({ roughness: 1 });
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(VOID.rift).multiplyScalar(0.9), side: THREE.BackSide, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });

  // ---- the shadow deer: built along +x, so rotation.y is 90° − bearing (the facing rule) ---------
  const deerParts = [
    xf(CY(0.24, 0.28, 1.0, 6, VOID.void).rotateZ(Math.PI / 2), 0, 1.0),
    xf(colorize(new THREE.IcosahedronGeometry(0.26, 1), VOID.void).scale(1, 0.85, 0.9), 0.3, 1.15),
    xf(CY(0.09, 0.13, 0.5, 6, VOID.void).rotateZ(-0.7), 0.5, 1.35),
    xf(B(0.34, 0.19, 0.18, VOID.void), 0.76, 1.55),
    xf(B(0.13, 0.11, 0.11, '#080410'), 0.94, 1.5),
    ...[-1, 1].map((s) => xf(B(0.04, 0.14, 0.08, VOID.void), 0.68, 1.66, s * 0.1)),
    ...[-1, 1].flatMap((s) => [0, 1, 2].map((i) => xf(B(0.03, 0.20 - i * 0.04, 0.03, VOID.void), 0.72 + i * 0.06, 1.76 + i * 0.09, s * 0.09))),
    ...([[0.34, 0.12], [0.34, -0.12], [-0.34, 0.12], [-0.34, -0.12]] as [number, number][]).map(([x, z]) => xf(CY(0.045, 0.04, 0.9, 5, VOID.void), x, 0.45, z)),
    xf(B(0.14, 0.2, 0.05, VOID.rift), -0.5, 1.05),
  ];
  const deer = shadowBody(deerParts, voidMat, rimMat, 0.06);
  group.add(deer);
  const wander = makeWander({
    patch: { x: -6, z: 6, r: 8, avoid: [{ x: 0, z: 0, r: 3 }, { x: -6, z: -3, r: 2.6 }, { x: -8, z: -11.5, r: 5 }] },
    speed: 0.5, seed: 41, turnRate: 2.0, graze: [7, 13], lookChance: 0.45,
  });
  wander.park(-7, 7, 220);
  const deerEar = flicker(31, 2.5, 3);
  const motes = makePoints(60, VOID.rift, 5, 2.0);
  group.add(motes.pts);
  const moteSeed = Array.from({ length: 60 }, () => ({ a: r() * 6.28, d: r(), h: r(), s: 0.5 + r() * 0.8 }));
  let state: 'here' | 'dissolving' | 'gone' = 'here';
  let stateT = 0;
  const gonePoint = new THREE.Vector3();
  const spots: [number, number][] = [[-7, 7], [6, 8], [-13, 2], [3, -8], [-15, 12], [9, -2]];
  let spotIdx = 0;

  // ---- the mirror fox: it keeps 12 m ----------------------------------------------------------------
  const foxParts = [
    xf(colorize(new THREE.IcosahedronGeometry(0.19, 0), VOID.void).scale(1.7, 0.85, 0.9), 0, 0.3),
    xf(colorize(new THREE.ConeGeometry(0.12, 0.26, 5), VOID.void).rotateZ(-Math.PI / 2), 0.3, 0.34),
    ...[-1, 1].map((s) => xf(colorize(new THREE.ConeGeometry(0.05, 0.12, 3), VOID.void), 0.24, 0.46, s * 0.07)),
    ...([[0.14, 0.08], [0.14, -0.08], [-0.14, 0.08], [-0.14, -0.08]] as [number, number][]).map(([x, z]) => xf(CY(0.028, 0.024, 0.3, 4, VOID.void), x, 0.15, z)),
    xf(colorize(new THREE.ConeGeometry(0.09, 0.42, 5), VOID.void).rotateZ(1.15), -0.34, 0.38),
    xf(colorize(new THREE.IcosahedronGeometry(0.06, 0), VOID.rift), -0.52, 0.5),
  ];
  const fox = shadowBody(foxParts, voidMat, rimMat, 0.07);
  group.add(fox);
  let foxX = -18, foxZ = -6, foxH = 0.6;

  const poiV = new THREE.Vector3();
  let poiSet = false, dissolvePending = false, nowT = 0;

  const update = (t: number, dt: number, hero: THREE.Vector3): void => {
    poiSet = false; nowT = t;
    const dx = hero.x - wander.x, dz = hero.z - wander.z;
    const near = Math.hypot(dx, dz) < 7;
    if ((near || dissolvePending) && state === 'here') { state = 'dissolving'; stateT = t; dissolvePending = false; gonePoint.set(wander.x, groundY(wander.x, wander.z), wander.z); }
    if (state === 'dissolving' && t - stateT > 1.6) { state = 'gone'; stateT = t; }
    if (state === 'gone' && t - stateT > 20) {
      state = 'here'; stateT = t; spotIdx = (spotIdx + 1) % spots.length;
      const [sx, sz] = spots[spotIdx]!;
      wander.park(sx, sz, 40 + spotIdx * 55);
    }
    if (state === 'here') {
      wander.update(dt);
      deer.visible = true;
      deer.position.set(wander.x, groundY(wander.x, wander.z), wander.z);
      deer.rotation.y = wander.rotY();
      const g = wander.graze;
      deer.children.forEach((c) => { c.rotation.x = -0.34 * g; });
      deer.position.y += 0.02 * Math.sin(t * 1.2) - 0.1 * g;
      deer.scale.setScalar(1 + 0.01 * deerEar(t));
      if (!poiSet) { poiV.set(wander.x, 1.3, wander.z); poiSet = true; }
    } else {
      deer.visible = false;
    }
    // the motes: they rise out of where it stood, for 3.5 s
    const age = t - (state === 'dissolving' ? stateT : stateT - 1.6);
    const alive = state !== 'here' && age < 3.5;
    for (let i = 0; i < 60; i++) {
      const s = moteSeed[i]!;
      const u = THREE.MathUtils.clamp(age * s.s - s.h * 0.6, 0, 3);
      motes.pos[i * 3] = gonePoint.x + Math.cos(s.a) * s.d * 0.5 + Math.sin(t * 0.9 + s.a) * 0.12;
      motes.pos[i * 3 + 1] = gonePoint.y + 0.2 + s.h * 1.4 + u * 0.9;
      motes.pos[i * 3 + 2] = gonePoint.z + Math.sin(s.a) * s.d * 0.5 + Math.cos(t * 0.7 + s.a) * 0.12;
      motes.alpha[i] = alive ? Math.max(0, 1 - u / 2.4) * Math.min(1, u * 4) : 0;
    }
    motes.commit();
    // the fox holds 12 m: it walks away when you close, and drifts back when you do not
    const fdx = foxX - hero.x, fdz = foxZ - hero.z, fd = Math.hypot(fdx, fdz);
    const want = fd < 12 ? 1.4 : fd > 16 ? -0.5 : 0;
    if (Math.abs(want) > 0.01 && fd > 0.5) {
      const step = want * dt * 1.6;
      foxX += (fdx / fd) * step; foxZ += (fdz / fd) * step;
      foxH = Math.atan2(-(hero.z - foxZ), hero.x - foxX) + (want > 0 ? Math.PI : 0);
    }
    fox.position.set(foxX, groundY(foxX, foxZ) + Math.abs(Math.sin(t * 5)) * 0.03 * (want > 0 ? 1 : 0), foxZ);
    fox.rotation.y = foxH;
    void dt;
  };
  return {
    group, update,
    poi: () => (poiSet ? poiV : null),
    dissolveNow: () => { dissolvePending = true; return 'it goes'; },
    hud: () => [`shadow deer ${state}${state === 'gone' ? ` (reforms in ${Math.max(0, 20 - (nowT - stateT)).toFixed(0)} s)` : ''} · mirror fox holds ${Math.hypot(foxX, foxZ) > 0 ? '12' : '12'} m`],
  };
}
