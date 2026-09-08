// The west rim's peaceful layer (OPUS_EXPERIMENT_BRIEF.md §3.5): a fox trotting the rim path with
// its nose down, pausing three seconds at each end to look at the camp; a fishing bobber on the pond
// that dips every 6–9 s; and three songbirds that burst from the nearest birch when Liam passes
// under it and land again 6 s later. The deer is the Forest scene's own, imported.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { rng } from '../_shared/rng';
import { C } from '../_shared/style';
import { groundY, POND } from '../forest-dusk/terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

export interface Life {
  group: THREE.Group;
  /** The ripple centre the pond's water sheet should carry. */
  bobber: THREE.Vector3;
  update: (t: number, dt: number, hero: THREE.Vector3) => void;
  poi: () => THREE.Vector3 | null;
  burstNow: () => string;
  hud: () => string;
}

const FOX_A = new THREE.Vector2(-50, 20), FOX_B = new THREE.Vector2(-50, -20);

export function makeLife(birch: THREE.Vector3): Life {
  const group = new THREE.Group();
  const r = rng(809);
  const mat = makeWorldMaterial({ roughness: 0.95 });
  const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- the fox: a 0.6 m ember wedge with a white tail tip, four stub legs, ears (built along +x) --
  const fox = new THREE.Group();
  const foxBody = new THREE.Group();
  foxBody.add(mesh(mergeGeos([
    xf(colorize(new THREE.IcosahedronGeometry(0.15, 0), '#D87828').scale(1.9, 0.9, 0.95), 0, 0.28),
    xf(colorize(new THREE.ConeGeometry(0.10, 0.24, 5), '#D87828').rotateZ(-Math.PI / 2), 0.30, 0.30),
    ...[-1, 1].map((s) => xf(colorize(new THREE.ConeGeometry(0.045, 0.11, 3), '#D87828'), 0.20, 0.42, s * 0.06)),
    ...[-1, 1].map((s) => xf(B(0.03, 0.03, 0.02, '#2C3E50'), 0.28, 0.32, s * 0.05)),
    ...([[0.13, 0.07], [0.13, -0.07], [-0.13, 0.07], [-0.13, -0.07]] as [number, number][]).map(([x, z]) => xf(CY(0.026, 0.022, 0.26, 4, '#8B4513'), x, 0.13, z)),
    xf(colorize(new THREE.ConeGeometry(0.085, 0.36, 5), '#D87828').rotateZ(1.1), -0.30, 0.34),
    xf(colorize(new THREE.IcosahedronGeometry(0.055, 0), C.cream), -0.46, 0.44),
  ])));
  fox.add(foxBody); group.add(fox);
  let foxU = 0, foxDir = 1, foxPause = 0;

  // ---- the bobber on the pond: red and white, dipping 0.05 m every 6–9 s -------------------------
  const bob = new THREE.Group();
  const bobber = new THREE.Vector3(POND.x, -0.42, POND.z);
  bob.position.copy(bobber);
  bob.add(mesh(mergeGeos([
    colorize(new THREE.SphereGeometry(0.06, 7, 5), '#D64B3A').translate(0, 0.06, 0),
    colorize(new THREE.SphereGeometry(0.058, 7, 5), '#EDE3CF').translate(0, 0.0, 0),
    CY(0.008, 0.008, 0.09, 4, C.iron).translate(0, 0.14, 0),
  ])));
  group.add(bob);
  let dipT = 0, dipNext = 6 + r() * 3;

  // ---- three songbirds on the nearest birch ------------------------------------------------------
  const HUES = ['#F0C040', '#8FD3F4', '#38A866'];
  const birds = HUES.map((hex, i) => {
    const root = new THREE.Group();
    root.add(mesh(mergeGeos([
      xf(colorize(new THREE.IcosahedronGeometry(0.06, 0), hex).scale(1.4, 1, 1), 0, 0),
      xf(colorize(new THREE.IcosahedronGeometry(0.04, 0), hex), 0.07, 0.035),
      xf(colorize(new THREE.ConeGeometry(0.015, 0.05, 3), '#E8A838').rotateZ(-Math.PI / 2), 0.11, 0.035),
      xf(B(0.09, 0.012, 0.03, hex), -0.09, 0.01),
    ])));
    const wings = [-1, 1].map((s) => {
      const g = colorize(new THREE.PlaneGeometry(0.10, 0.13), hex);
      g.rotateX(-Math.PI / 2); g.translate(0, 0, 0.065 * s);
      const w = mesh(g); root.add(w); return w;
    });
    const perch = birch.clone().add(new THREE.Vector3((i - 1) * 0.4, 0.1 * (i % 2), 0.7 - i * 0.6));
    root.position.copy(perch);
    group.add(root);
    return { root, wings, perch, target: perch.clone().add(new THREE.Vector3(Math.cos(i * 2.1) * 6, 4 + i, Math.sin(i * 2.1) * 6)), phase: i * 0.41 };
  });
  let burstT = -100, armed = true, pending = false, nowT = 0;

  const poiV = new THREE.Vector3();
  let poiSet = false;

  const update = (t: number, dt: number, hero: THREE.Vector3): void => {
    poiSet = false; nowT = t;
    if (pending) { pending = false; burstT = t; }
    // the fox: 0.9 m/s along the rim path, nose down, 3 s at each end looking at the camp
    if (foxPause > 0) foxPause -= dt;
    else {
      const len = FOX_A.distanceTo(FOX_B);
      foxU += (foxDir * 0.9 * dt) / len;
      if (foxU >= 1) { foxU = 1; foxDir = -1; foxPause = 3; }
      if (foxU <= 0) { foxU = 0; foxDir = 1; foxPause = 3; }
    }
    const fp = FOX_A.clone().lerp(FOX_B, foxU);
    fox.position.set(fp.x, groundY(fp.x, fp.y), fp.y);
    const looking = foxPause > 0;
    // built along +x, so the bearing conversion is 90° − bearing
    const bearing = looking ? Math.atan2(0 - fp.x, -(0 - fp.y)) : Math.atan2(FOX_B.x - FOX_A.x, -(FOX_B.y - FOX_A.y)) * (foxDir > 0 ? 1 : 1) + (foxDir > 0 ? 0 : Math.PI);
    fox.rotation.y = Math.PI / 2 - bearing;
    foxBody.rotation.z = looking ? 0 : 0.16;                      // nose down while it trots
    foxBody.position.y = looking ? 0 : 0.02 * Math.abs(Math.sin(t * 7));
    if (!poiSet && looking) { poiV.set(fp.x, 0.5, fp.y); poiSet = true; }
    // the bobber: a 0.05 m dip every 6–9 s, and it bobs on the water between
    if (t - dipT > dipNext) { dipT = t; dipNext = 6 + r() * 3; }
    const da = t - dipT;
    const dip = da < 0.6 ? Math.sin(da / 0.6 * Math.PI) : 0;
    bob.position.y = bobber.y + 0.02 * Math.sin(t * 1.3) - 0.05 * dip;
    bob.rotation.z = 0.12 * Math.sin(t * 0.9) - 0.2 * dip;
    // the songbirds: a kid within 5 m of the birch sends all three up; back at +6 s
    const under = Math.hypot(hero.x - birch.x, hero.z - birch.z) < 5;
    if (under && armed && t - burstT > 8) { burstT = t; armed = false; }
    if (!under) armed = true;
    const age = t - burstT;
    for (const b of birds) {
      const out = THREE.MathUtils.smoothstep(age, 0, 1.3) * (1 - THREE.MathUtils.smoothstep(age, 4.6, 6.0));
      b.root.position.lerpVectors(b.perch, b.target, out);
      b.root.position.x += Math.sin(t * 1.3 + b.phase * 6) * 0.7 * out;
      b.root.position.z += Math.cos(t * 1.1 + b.phase * 6) * 0.7 * out;
      const flap = out > 0.02 ? Math.sin(t * 24 + b.phase * 9) : Math.sin(t * 2.0 + b.phase * 5) * 0.12;
      b.wings.forEach((w, k) => { w.rotation.x = (k ? -1 : 1) * (0.3 + 0.7 * flap) * (out > 0.02 ? 1 : 0.25); });
      b.root.rotation.y = out > 0.02 ? Math.atan2(b.target.x - b.perch.x, b.target.z - b.perch.z) + t * 0.4 : b.phase * 2;
      if (out > 0.3 && !poiSet) { poiV.copy(b.root.position); poiSet = true; }
    }
  };
  return {
    group, bobber, update,
    poi: () => (poiSet ? poiV : null),
    burstNow: () => { pending = true; return 'the birds go up'; },
    hud: () => `fox ${foxPause > 0 ? 'looking at the camp' : 'trotting'} u ${foxU.toFixed(2)} · bobber dips every 6–9 s · songbirds ${nowT - burstT < 6 ? 'up' : 'perched'}`,
  };
}
