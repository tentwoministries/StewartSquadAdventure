// Crystal Caves creatures (PHASE_0.75_ANIMALS_BRAINSTORM.md §3, T-14): glow moths that orbit the
// lit lamps (they are the light's motion), two cave salamanders on the stair wall whose green spots
// pulse on the heart's oscillator and who climb a metre closer when a kid stands still 3 s, the
// crystal beetle rolling its glowing shard along the gallery ledge, blind cave fish flickering
// silver in the pool under the heart's pulse and scattering from the ring's light. The bats are
// the props' burst when a lamp is lit.
import * as THREE from 'three';
import { CAVE as K } from '../_shared/biomes';
import { makeWander } from '../_shared/creature';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { blinkers } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
import { FLOOR_Y, GALLERY, HEART, POOL, TIER1_Y } from './terrain';
import { LAMPS } from './props';

const mat = makeWorldMaterial({ roughness: 0.9 });
const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry, mm: THREE.Material = mat) => { const m = new THREE.Mesh(g, mm); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Creatures {
  group: THREE.Group;
  update: (t: number, dt: number, pulse: number, litFraction: number, kids: THREE.Vector3[], activeMoving: boolean) => void;
  poi: () => THREE.Vector3 | null;
  hud: () => string[];
}

export function makeCreatures(): Creatures {
  const group = new THREE.Group();
  const r = rng(29);
  // glow moths: one blinker set per lamp neighbourhood, alpha by the lit fraction
  const moths = LAMPS.map(([x, z, y], i) => blinkers(6, K.moth, 4.5, 1.6, { x, z, w: 3, d: 3, y0: y + 1.2, y1: y + 3.0 }, 50 + i, 0.8));
  for (const m of moths) group.add(m.pts);
  // salamanders: pale, green spots (emissive, pulsed), clinging to the stair wall
  const spotMat = makeWorldMaterial({ emissive: true, roughness: 0.5 });
  const salaGeo = mergeGeos([xf(B(0.5, 0.08, 0.14, K.salamander), 0, 0.04), xf(colorize(new THREE.ConeGeometry(0.06, 0.45, 4), K.salamander).rotateZ(Math.PI / 2), -0.45, 0.04), xf(B(0.16, 0.08, 0.14, K.salamander), 0.3, 0.04), ...([[0.15, 0.1], [0.15, -0.1], [-0.12, 0.1], [-0.12, -0.1]] as [number, number][]).map(([x, z]) => xf(B(0.06, 0.03, 0.12, K.salamander), x, 0.02, z)), xf(B(0.03, 0.03, 0.03, '#1A1410'), 0.36, 0.09, 0.05), xf(B(0.03, 0.03, 0.03, '#1A1410'), 0.36, 0.09, -0.05)]);
  const spotsGeo = mergeGeos([-0.15, 0.0, 0.15].map((x, i) => xf(colorize(new THREE.IcosahedronGeometry(0.03, 0), K.salamanderSpot, { color: new THREE.Color(K.salamanderSpot).multiplyScalar(1.4).getStyle(), glow: 1 }), x, 0.09, (i % 2 ? 0.04 : -0.04))));
  const salamanders: { root: THREE.Group; spots: THREE.Mesh; base: THREE.Vector3; toward: THREE.Vector3; climb: number; still: number }[] = [];
  for (const [x, y, z, ry] of [[-24.5, -3.5, -30, 0.6], [-35, -9, -14, 1.1]] as [number, number, number, number][]) {
    const root = node(x, y, z); root.rotation.y = ry; root.add(mesh(salaGeo));
    const spots = mesh(spotsGeo, spotMat); spots.layers.enable(BLOOM_LAYER); root.add(spots);
    group.add(root);
    salamanders.push({ root, spots, base: new THREE.Vector3(x, y, z), toward: new THREE.Vector3(x, y, z), climb: 0, still: 0 });
  }
  // the crystal beetle on the gallery ledge, rolling a glowing shard
  const beetle = mesh(mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.1, 1), K.beetle).scale(1.3, 0.8, 1), 0, 0.08), xf(B(0.08, 0.05, 0.08, '#5A8AA8'), 0.13, 0.05), ...[-0.06, 0, 0.06].map((x) => xf(B(0.02, 0.02, 0.24, '#5A8AA8'), x, 0.03, 0))]));
  const shard = mesh(colorize(new THREE.OctahedronGeometry(0.12, 0), K.crystalLight, { color: new THREE.Color(K.crystalLight).multiplyScalar(1.2).getStyle(), glow: 1 }), spotMat); shard.layers.enable(BLOOM_LAYER);
  group.add(beetle, shard);
  const beetleW = makeWander({ patch: { x: GALLERY.x + 2, z: GALLERY.z - 6, r: 5, avoid: [] }, speed: 0.22, seed: 61, turnRate: 1.0, graze: [1, 3], lookChance: 0, minLeg: 1.5 });
  beetleW.park(GALLERY.x + 2, GALLERY.z - 6, 90);
  // blind cave fish in the pool
  const fishGeo = mergeGeos([xf(B(0.28, 0.06, 0.04, K.fish), 0, 0), xf(colorize(new THREE.ConeGeometry(0.05, 0.12, 3).rotateZ(Math.PI / 2), K.fish), -0.19, 0)]);
  const fish: { m: THREE.Mesh; a: number; rad: number; sp: number; ph: number; y: number }[] = [];
  for (let i = 0; i < 8; i++) { const m = mesh(fishGeo); group.add(m); fish.push({ m, a: r() * 6.28, rad: 3 + r() * 6, sp: 0.25 + r() * 0.3, ph: r() * 6, y: FLOOR_Y - 0.9 - r() * 0.6 }); }

  const poiV = new THREE.Vector3(); let poiSet = false;
  const update = (t: number, dt: number, pulse: number, litFraction: number, kids: THREE.Vector3[], activeMoving: boolean) => {
    poiSet = false;
    const active = kids[0]!;
    moths.forEach((m, i) => { m.update(t, i < Math.round(litFraction * LAMPS.length) || i === LAMPS.length - 1 ? 0.9 : 0.05); });
    // salamanders: spots pulse; if the active kid stands still within 6 m for 3 s, climb 1 m closer (up to 3 m)
    for (const s of salamanders) {
      spotMat.emissiveIntensity = 0.6 + 0.9 * pulse;
      const d = Math.hypot(s.root.position.x - active.x, s.root.position.z - active.z);
      s.still = !activeMoving && d < 6 ? s.still + dt : 0;
      if (s.still > 3 && s.climb < 3) { s.climb += 1; s.still = 0; s.toward.set(active.x, active.y + 0.5, active.z); }
      if (activeMoving && d < 3) { s.climb = 0; }
      const target = s.base.clone().lerp(s.toward, Math.min(1, s.climb / Math.max(1, s.base.distanceTo(s.toward)) * 1));
      s.root.position.lerp(target, Math.min(1, dt * 0.8));
      s.root.position.y = Math.max(s.root.position.y, s.base.y - 0.5);
      if (s.climb > 0 && d < 8) { poiV.copy(s.root.position); poiSet = true; }
    }
    // the beetle and its shard
    beetleW.update(dt);
    beetle.position.set(beetleW.x, TIER1_Y + 0.05, beetleW.z); beetle.rotation.y = beetleW.rotY();
    const sx = beetleW.x + Math.cos(beetleW.heading) * 0.26, sz = beetleW.z - Math.sin(beetleW.heading) * 0.26;
    shard.position.set(sx, TIER1_Y + 0.12, sz); shard.rotation.z -= beetleW.speedNow * dt / 0.12; shard.rotation.x = 0.4;
    // fish: circle under the heart, quicken on the pulse, scatter from a kid's ring within 4 m
    for (const f of fish) {
      f.a += dt * f.sp * (0.6 + 0.8 * pulse);
      let x = POOL.x + Math.cos(f.a) * f.rad, z = POOL.z + Math.sin(f.a) * f.rad;
      for (const k of kids) { const d = Math.hypot(x - k.x, z - k.z); if (d < 4) { const push = (4 - d) * 1.2; x += ((x - k.x) / d) * push; z += ((z - k.z) / d) * push; } }
      f.m.position.set(x, f.y + 0.15 * Math.sin(t * 1.7 + f.ph), z); f.m.rotation.y = -f.a - Math.PI / 2 + Math.PI;
      f.m.rotation.z = 0.15 * Math.sin(t * 9 + f.ph);
      (f.m.material as THREE.MeshStandardMaterial).emissive.set('#8090A0'); (f.m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + 0.9 * pulse * Math.max(0, Math.sin(t * 6 + f.ph));
    }
    void HEART;
  };
  return {
    group, update, poi: () => (poiSet ? poiV : null),
    hud: () => [`moths ${LAMPS.length} × 6 at the lit lamps · salamanders 2 (stand still 3 s) · the beetle rolls its shard · fish 8 under the heart`],
  };
}
