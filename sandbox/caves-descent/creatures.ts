// Crystal Caves creatures (PHASE_0.75_ANIMALS_BRAINSTORM.md §3, T-14): glow moths that orbit the
// lit lamps (they are the light's motion), **four** cave salamanders on the stair walls — two per
// stair, the brainstorm's own number, where round 1 shipped two — whose green spots
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
import { clamp, rng } from '../_shared/rng';
import { FLOOR_Y, GALLERY, HEART, PATHS, POOL, SHOULDER, TIER1_Y, halfAt, onStair, ptAt, treadY } from './terrain';
import { LAMPS } from './props';

const mat = makeWorldMaterial({ roughness: 0.9 });
const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry, mm: THREE.Material = mat) => { const m = new THREE.Mesh(g, mm); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Creatures {
  group: THREE.Group;
  update: (t: number, dt: number, pulse: number, litFraction: number, kids: THREE.Vector3[], activeMoving: boolean) => void;
  /** T-62: (re-)cast the four salamanders against the rock meshes in the scene. Called once at build
   *  and again whenever `J` rebuilds the tiers and the stair under them. */
  place: (stairs: THREE.Mesh, tiers: THREE.Mesh) => void;
  /** Read-only: where each salamander is in the stair's own coordinates, for a stepped probe. */
  state: () => { path: number; arc: number; h: number; side: number; on: boolean; surf: string; climb: number }[];
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
  // T-62: a clinging creature is placed by a **cast** against the surface it clings to, never by a
  // typed point. Round 1 rebuilt the stair under the two hand-typed points and they were left
  // hanging in the air over the tiers ("are they supposed to float?"). Each salamander now lives in
  // the stair's own coordinates — (path, arc s, height h above the tread) — and every frame a ray is
  // cast from the centreline at that arc and height, across the band, against the drawn `stairs` and
  // `tiers`; the hit is the belly's point and the hit's normal is the body's local +y. It therefore
  // stays on the rock through the whole climb, and through a `J` rebuild.
  const BELLY = 0.02;      // the root sits this far off the wall: a cast down local −y hits at 0.02
  const H_LO = 0.5, H_HI = 0.9;   // the brief's band: 0.5–0.9 m above the tread
  const ray = new THREE.Raycaster();
  const dirV = new THREE.Vector3(), upV = new THREE.Vector3(), xV = new THREE.Vector3(), zV = new THREE.Vector3();
  const basis = new THREE.Matrix4(), wantQ = new THREE.Quaternion();
  let rockMeshes: THREE.Object3D[] = [];
  interface Cling { p: THREE.Vector3; n: THREE.Vector3; on: string; side: number }
  /** Cast across the band at arc `s`, `h` above that step's tread. `prefer` is the side the animal is
   *  already on: it is tried first and kept if it hits, because a stair whose *other* wall happens to
   *  come nearer for a metre would otherwise flip the body through 180° mid-climb (measured: the
   *  belly 1.54 m off the rock for the sixth of a second the eased turn took). Only when the side it
   *  is on runs out does it change wall. */
  const cast = (pi: number, s: number, h: number, prefer = 0): Cling | null => {
    const p = PATHS[pi]!;
    if (!rockMeshes.length) return null;
    const a = ptAt(p, s), y = treadY(p, s) + h;
    let best: Cling | null = null, bestD = Infinity;
    for (const side of prefer > 0 ? [1, -1] : prefer < 0 ? [-1, 1] : [1, -1]) {
      dirV.set(a.nx * side, 0, a.nz * side);
      ray.set(new THREE.Vector3(a.x, y, a.z), dirV);
      ray.far = halfAt(p, s) + SHOULDER;
      for (const hit of ray.intersectObjects(rockMeshes, false)) {
        if (!hit.face) continue;
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        if (Math.abs(n.y) > 0.5) continue;                    // a tread or a shoulder, not a wall
        if (n.dot(dirV) > 0) n.negate();                      // the face that looks back at the stair
        n.y = 0;
        if (n.lengthSq() < 1e-6) continue;
        if (hit.distance < bestD) { bestD = hit.distance; best = { p: hit.point.clone(), n: n.normalize(), on: hit.object.name, side }; }
        break;
      }
      if (best && prefer !== 0) return best;      // the side it is on answered: stay on it
    }
    return best;
  };
  /** The metre of wall a climb spends: an animal is only placed where it has that much rock either
   *  way, or its climb has nothing to walk along and it sits still (measured: 0.06 m of closing over
   *  240 frames for an animal parked on an isolated column face). */
  const SPAN = 1.0;
  /** Which sides of the channel carry wall all along [s − SPAN, s + SPAN] at height h. The cheap
   *  single cast is tried first, so an arc with no rock beside it costs one ray, not ten. */
  const sidesAt = (pi: number, s: number, h: number): number[] => {
    if (!cast(pi, s, h)) return [];
    const p = PATHS[pi]!;
    const out: number[] = [];
    for (const side of [1, -1]) {
      let ok = true;
      for (let d = -SPAN; d <= SPAN + 1e-9 && ok; d += 0.5) {
        const c = cast(pi, clamp(s + d, 1, p.len - 1), h, side);
        ok = !!c && c.side === side;
      }
      if (ok) out.push(side);
    }
    return out;
  };
  /** The arc nearest `want` where a wall stands beside the stair — where it is cut into a tier — and
   *  runs a metre either way. Searched outward from `want` in both directions (A5 asks for arcs 6
   *  and 14 "or the nearest arcs where the channel wall exists"), never by assuming the typed arc
   *  has rock beside it. */
  const findArc = (pi: number, want: number): number | null => {
    const p = PATHS[pi]!;
    const h = (H_LO + H_HI) / 2;
    for (let d = 0; d <= p.len; d += 0.3) {
      for (const s of d === 0 ? [want] : [want + d, want - d]) {
        if (s < 1 + SPAN || s > p.len - 1 - SPAN) continue;
        if (sidesAt(pi, s, h).length) return s;
      }
    }
    return null;
  };
  /** A5: which side of the channel the animal lies on — of the sides that carry wall here, the one
   *  whose rock is nearest a hook-lamp, so what it clings to is lit when Quartz's lamps come on (a
   *  lit hook-lamp is 9 cd over 8 m; `dungeons.md` §2.7's "wall-lamps on hooks along the stair").
   *  Every candidate is **cast**, never guessed. */
  const lampSide = (pi: number, s: number, h: number): number => {
    let bestSide = 0, bestD = Infinity;
    for (const side of sidesAt(pi, s, h)) {
      const c = cast(pi, s, h, side);
      if (!c) continue;
      let d = Infinity;
      for (const [lx, lz, ly] of LAMPS) d = Math.min(d, Math.hypot(c.p.x - lx, c.p.y - (ly + 2.1), c.p.z - lz));
      if (d < bestD) { bestD = d; bestSide = side; }
    }
    return bestSide;
  };
  /** How far toward `want` the wall actually reaches: the climb is marched, never assumed (the
   *  Density row's rule). Without it a salamander walks its target off the end of the wall and
   *  freezes there with nothing under its belly. */
  const reachable = (pi: number, from: number, want: number, h: number, prefer: number): number => {
    const dir = Math.sign(want - from);
    if (dir === 0) return from;
    let best = from;
    for (let s = from + dir * 0.2; dir > 0 ? s <= want : s >= want; s += dir * 0.2) {
      const c = cast(pi, s, h, prefer);
      if (!c || c.side !== prefer) return best;   // the wall it is on stops here
      best = s;
    }
    const c = cast(pi, want, h, prefer);
    return c && c.side === prefer ? want : best;
  };
  interface Sala { root: THREE.Group; spots: THREE.Mesh; path: number; s: number; h: number; s0: number; h0: number; sT: number; hT: number; climb: number; still: number; on: boolean; surf: string; side: number }
  /** A5: two per stair, at arcs 6 and 14 — or at the nearest arc either way where the channel wall
   *  actually exists (`findArc`). Four is `PHASE_0.75_ANIMALS_BRAINSTORM.md` §3's own number for the
   *  Crystal Caves; round 1 shipped two and reported the shortfall. */
  const SALA: { path: number; arc: number }[] = [
    { path: 0, arc: 6 }, { path: 0, arc: 14 }, { path: 1, arc: 6 }, { path: 1, arc: 14 },
  ];
  const salamanders: Sala[] = [];
  for (let i = 0; i < SALA.length; i++) {
    const root = node(0, 0, 0); root.name = `salamander${i}`; root.add(mesh(salaGeo));
    const spots = mesh(spotsGeo, spotMat); spots.layers.enable(BLOOM_LAYER); root.add(spots);
    group.add(root);
    salamanders.push({ root, spots, path: SALA[i]!.path, s: 0, h: 0.7, s0: 0, h0: 0.7, sT: 0, hT: 0.7, climb: 0, still: 0, on: false, surf: '?', side: 0 });
  }
  /** Set the root from a cast: the belly on the wall, local +y the wall's outward normal, local +x
   *  along the wall pointing *up*-stair (the rig is built along +x, head at +x). The basis is built
   *  as a matrix, not as an Euler, so nothing accumulates and nothing needs wrapping (LESSONS Rigs
   *  rows 6 and 8: a full orientation on a non-vertical surface is a basis, checked by reading the
   *  world directions of the local axes in a probe). */
  const settle = (sa: Sala, ease: number): void => {
    const c = cast(sa.path, sa.s, sa.h, sa.side);
    if (!c) { sa.on = false; return; }
    sa.on = true; sa.surf = c.on; sa.side = c.side;
    const a = ptAt(PATHS[sa.path]!, sa.s);
    upV.copy(c.n);
    xV.set(-a.nz, 0, a.nx);                       // the tangent, pointing up-stair (s decreasing)
    xV.addScaledVector(upV, -upV.dot(xV)).normalize();
    zV.copy(xV).cross(upV);
    basis.makeBasis(xV, upV, zV);
    wantQ.setFromRotationMatrix(basis);
    if (ease >= 1) sa.root.quaternion.copy(wantQ); else sa.root.quaternion.slerp(wantQ, ease);
    sa.root.position.copy(c.p).addScaledVector(c.n, BELLY);
  };
  /** Re-cast every salamander against the rock in the scene now (also after `J` rebuilds it). */
  const place = (stairs: THREE.Mesh, tiers: THREE.Mesh): void => {
    rockMeshes = [stairs, tiers];
    salamanders.forEach((sa, i) => {
      // two per stair, at the nearest arc to the wanted one where the channel wall exists; each
      // keeps the arc it had if that arc still has a wall, so `J` does not teleport a climbing
      // salamander back to its start
      const want = SALA[i]!.arc;
      const found = findArc(sa.path, want);
      const s = sa.s > 0 && cast(sa.path, sa.s, sa.h, sa.side) ? sa.s : (found ?? want);
      sa.s0 = found ?? want; sa.h0 = (H_LO + H_HI) / 2;
      sa.s = s; sa.sT = s; sa.h = sa.h || sa.h0; sa.hT = sa.h;
      sa.side = lampSide(sa.path, sa.s, sa.h) || sa.side;
      settle(sa, 1);
    });
  };
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
    // salamanders (T-62): spots pulse on the heart's oscillator; if the active kid stands still
    // within 6 m for 3 s the salamander climbs 1 m closer (up to 3 m) — the same 3 s / 1 m / 0.8 per
    // second numbers as before, and the same slow drift Andrew liked — but the metre is walked along
    // the wall's own surface (arc and height), and the belly is re-cast every frame so it stays on
    // the rock instead of drifting out over the void.
    spotMat.emissiveIntensity = 0.6 + 0.9 * pulse;
    for (const s of salamanders) {
      const p = PATHS[s.path]!;
      const d = Math.hypot(s.root.position.x - active.x, s.root.position.z - active.z);
      s.still = !activeMoving && d < 6 ? s.still + dt : 0;
      if (s.still > 3 && s.climb < 3) {
        s.climb += 1; s.still = 0;
        // one metre of wall: spend it along the arc toward where the kid stands on the stair, and
        // what is left of it on the height that brings the belly up to his
        const q = onStair(p, active.x, active.z, true);
        const want = clamp(s.sT + clamp(clamp(q.s, 1, p.len - 1) - s.sT, -1, 1), 1, p.len - 1);
        const reach = reachable(s.path, s.s, want, s.h, s.side);
        const step = Math.abs(reach - s.sT);
        s.sT = reach;
        const rest = Math.max(0, 1 - step);
        const hWant = clamp(active.y - treadY(p, s.sT) + 0.3, H_LO, H_HI);
        const hNext = clamp(s.hT + clamp(hWant - s.hT, -rest, rest), H_LO, H_HI);
        if (cast(s.path, s.sT, hNext, s.side)) s.hT = hNext;
      }
      if (activeMoving && d < 3) { s.climb = 0; s.sT = s.s0; s.hT = s.h0; }
      const k = Math.min(1, dt * 0.8);
      s.s += (s.sT - s.s) * k; s.h += (s.hT - s.h) * k;
      settle(s, Math.min(1, dt * 6));
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
    group, update, place, poi: () => (poiSet ? poiV : null),
    state: () => salamanders.map((s) => ({ path: s.path, arc: s.s, h: s.h, side: s.side, on: s.on, surf: s.surf, climb: s.climb })),
    hud: () => [`moths ${LAMPS.length} × 6 at the lit lamps · salamanders ${salamanders.length} clinging, two a stair (stand still 3 s): ${salamanders.map((s) => `stair ${s.path + 1} arc ${s.s.toFixed(2)} h ${s.h.toFixed(2)} side ${s.side > 0 ? '+' : '−'} on ${s.surf} climb ${s.climb}${s.on ? '' : ' OFF-WALL'}`).join(' · ')} · the beetle rolls its shard · fish 8 under the heart`],
  };
}
