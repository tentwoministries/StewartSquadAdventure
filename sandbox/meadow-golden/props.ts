// Crash Meadow's set, exactly as the orchestrator's plan lists it (OPUS_EXPERIMENT_BRIEF.md §3.4):
// Goblin camp A at (40, −14) with its crooked palisade, cook-fire, cart and Noah's empty cage; four
// goblin totems ringing the meadow; the furrow's last debris; the lookout stump and two boulders.
// Every colour is the plan's hex. The plate underneath is the Forest scene's, imported.
import * as THREE from 'three';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makeLantern, type Lantern } from '../_shared/lantern';
import { BLOOM_LAYER } from '../_shared/post';
import { deg, rng } from '../_shared/rng';
import { C, type Keyframe } from '../_shared/style';
import type { Circle } from '../_shared/walk';
import { distToWater, groundY, inside } from '../forest-dusk/terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

export const CAMP = { x: 40, z: -14, r: 6 };          // the 12 m ring
export const GAP = 90;                                 // the palisade's gap faces the meadow
// The ring's south-west totem is pulled in from (30, −18) to (37, −7): at S1 (target (44, 0.8, 0),
// yaw 300, pitch 40, d 24 → camera (59.9, 16.2, 9.2)) it stands at bearing 235° and 28 m, which is
// inside the frame's 213°–267° × 22.5°–57.5° cone, where (30, −18) at 40 m sat 2.5° above the top
// edge. It is the only totem S1 can hold without moving the station, and it is the frame's tall
// thing (T-08). The other three keep the plan's ring.
export const TOTEMS: [number, number][] = [[37, -7], [58, -18], [58, 18], [30, 18]];
/** The meadow the scene fights in: the Forest's own scatter is cleared inside this and re-made
 *  thinner and in the T-22 olive-browns by `makeMeadowScatter` (T-09: the confetti). */
export const MEADOW = { x: 44, z: 0, r: 28 };

export interface Props {
  group: THREE.Group;
  footprints: Circle[];
  /** Where a shattered goblin walks back in from. */
  gap: THREE.Vector3;
  update: (t: number, dt: number, kf: Keyframe) => void;
}

export function makeProps(): Props {
  const r = rng(311);
  const group = new THREE.Group();
  const worldMat = makeWorldMaterial({ roughness: 1 });
  const glowMat = makeWorldMaterial({ emissive: true, roughness: 0.7 });
  const swayMat = makeWorldMaterial({ sway: 0.08, side: THREE.DoubleSide, roughness: 1 });
  const opaque: THREE.BufferGeometry[] = [], glow: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });
  const at = (g: THREE.BufferGeometry, x: number, z: number, ry = 0, dy = 0) => xf(g, x, groundY(x, z) + dy, z, ry);

  // ---- the crooked palisade: 18 stakes on the 12 m ring, a 2.5 m gap facing the meadow -----------
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * 360;
    const off = ((a - GAP + 540) % 360) - 180;         // signed angle from the gap's bearing
    if (Math.abs(off) < 12) continue;                   // the gap: 2.5 m at r 6
    // heights 1.35–2.55 m and a ±15° lean: at 30 m the plan's ±8° over 1.6–2.3 m read as an even
    // fence (scores §4 change 6), and a crooked palisade is the silhouette the camp is for
    const h = 1.35 + r() * 1.2;
    const g = CY(0.12, 0.16, h, 6, C.bark);
    const tip = CY(0.11, 0.13, 0.22, 6, '#7E3320'); tip.translate(0, h / 2 + 0.09, 0);
    const stake = mergeGeos([g, tip]);
    stake.rotateZ(deg((r() * 2 - 1) * 15)); stake.rotateX(deg((r() * 2 - 1) * 15));
    const x = CAMP.x + Math.sin(deg(a)) * CAMP.r, z = CAMP.z - Math.cos(deg(a)) * CAMP.r;
    opaque.push(at(stake, x, z, r() * 6, h / 2 - 0.15));
    fp(x, z, 0.22);
  }
  const gap = new THREE.Vector3(CAMP.x + Math.sin(deg(GAP)) * (CAMP.r + 1), 0, CAMP.z - Math.cos(deg(GAP)) * (CAMP.r + 1));
  gap.y = groundY(gap.x, gap.z);

  // ---- the cook-fire: 8 stones, a tripod and a pot, and a real flame ------------------------------
  const fx = CAMP.x - 1.2, fz = CAMP.z + 0.6;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, s = 0.17 + r() * 0.05;
    opaque.push(at(colorize(new THREE.IcosahedronGeometry(s, 0), i % 2 ? '#6F7D86' : '#8C7B66'), fx + Math.cos(a) * 0.8, fz + Math.sin(a) * 0.8, 0, s * 0.5));
  }
  opaque.push(at(mergeGeos([
    ...[0, 2.1, 4.2].map((a) => CY(0.035, 0.035, 1.9, 4, C.iron).rotateZ(0.32).rotateY(a).translate(Math.cos(a) * 0.3, 0.9, Math.sin(a) * 0.3)),
    CY(0.30, 0.24, 0.42, 8, '#3E4247').translate(0, 0.62, 0),
    colorize(new THREE.TorusGeometry(0.3, 0.025, 4, 10), '#3E4247').rotateY(Math.PI / 2).translate(0, 0.86, 0),
  ]), fx, fz, 0));
  fp(fx, fz, 1.1);
  // the flame: three two-cone tongues on the Forest's recipe, one oscillator at 8.8–10 Hz
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.9, 1.9, 1.9) });
  const tongue = (h: number, w: number) => {
    const g = mergeGeos([
      xf(colorize(new THREE.ConeGeometry(w, h, 6), C.flameOuter), 0, h / 2),
      xf(colorize(new THREE.ConeGeometry(w * 0.5, h * 0.6, 6), C.flameCore), 0, h * 0.3, 0.02),
    ]);
    const m = new THREE.Mesh(g, flameMat); m.layers.enable(BLOOM_LAYER); return m;
  };
  // the main tongue clears the pot's rim (0.86 m) so the flame reads from S1 (scores §4 change 6)
  const tongues = [tongue(1.05, 0.19), tongue(0.62, 0.12), tongue(0.5, 0.11)];
  const fy = groundY(fx, fz);
  tongues[0]!.position.set(fx, fy + 0.18, fz);
  tongues[1]!.position.set(fx + 0.14, fy + 0.16, fz - 0.09);
  tongues[2]!.position.set(fx - 0.12, fy + 0.16, fz + 0.11);
  group.add(...tongues);
  const fireLight = new THREE.PointLight(C.campfire, 60, 7, 2);
  fireLight.position.set(fx, fy + 0.6, fz);
  group.add(fireLight);

  // ---- the cart, and Noah's cage on it (empty: he is out; the cloth is what is left) --------------
  const cx = CAMP.x + 2.4, cz = CAMP.z - 2.6, cry = deg(200);
  {
    const parts: THREE.BufferGeometry[] = [];
    for (const s of [-1, 1]) {
      const wheel = mergeGeos([
        colorize(new THREE.TorusGeometry(0.55, 0.07, 4, 12), C.bark).rotateY(Math.PI / 2),
        ...[0, 1, 2, 3, 4].map((i) => CY(0.035, 0.035, 1.06, 4, C.bark).rotateZ(Math.PI / 2).rotateX(i * 0.628).rotateY(Math.PI / 2)),
      ]);
      parts.push(xf(wheel, 0, 0.55, s * 0.72));
    }
    parts.push(B(2.0, 0.12, 1.2, '#654321').translate(0, 0.98, 0));
    for (const s of [-1, 1]) parts.push(B(0.09, 0.09, 1.9, '#654321').translate(1.3, 0.92, s * 0.45).applyMatrix4(new THREE.Matrix4().makeRotationY(0)));
    for (const s of [-1, 1]) parts.push(B(1.9, 0.08, 0.08, '#654321').translate(1.6, 0.92, s * 0.45));
    // the lantern post on the cart's *front* corner: on the back one the lamp hung behind the cage
    // and read as a pale skull inside Noah's cage from S2 (the ledger's line-of-sight row, scores
    // §4 change 8). Local (1.02, 0.56) is the corner nearest the shafts.
    parts.push(CY(0.06, 0.07, 1.9, 5, C.bark).translate(1.02, 1.9, 0.56));
    // the cage: a 1.2 × 1.2 × 1.4 box of 0.04 bars
    const bars: THREE.BufferGeometry[] = [];
    for (const [bx, bz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]] as [number, number][]) bars.push(B(0.04, 1.4, 0.04, '#3E4247').translate(bx, 0.7, bz));
    for (let i = 0; i <= 4; i++) { const u = -0.6 + i * 0.3; bars.push(B(0.04, 1.4, 0.04, '#3E4247').translate(u, 0.7, -0.6), B(0.04, 1.4, 0.04, '#3E4247').translate(u, 0.7, 0.6), B(0.04, 1.4, 0.04, '#3E4247').translate(-0.6, 0.7, u), B(0.04, 1.4, 0.04, '#3E4247').translate(0.6, 0.7, u)); }
    for (const y of [0.04, 1.36]) bars.push(B(1.24, 0.05, 0.05, '#3E4247').translate(0, y, -0.6), B(1.24, 0.05, 0.05, '#3E4247').translate(0, y, 0.6), B(0.05, 0.05, 1.24, '#3E4247').translate(-0.6, y, 0), B(0.05, 0.05, 1.24, '#3E4247').translate(0.6, y, 0));
    for (let i = 0; i <= 4; i++) { const u = -0.6 + i * 0.3; bars.push(B(1.24, 0.04, 0.04, '#3E4247').translate(0, 1.36, u)); }
    parts.push(mergeGeos(bars).translate(0, 1.04, 0));
    const cart = mergeGeos(parts); jitterColor(cart, r, 0.05);
    opaque.push(at(cart, cx, cz, cry));
    fp(cx, cz, 1.6);
    // the fox-orange cloth caught in the bars
    const cloth = colorize(new THREE.PlaneGeometry(0.42, 0.6, 1, 3), '#EE7F24');
    cloth.translate(0, -0.3, 0);
    const clothMesh = new THREE.Mesh(cloth, swayMat);
    clothMesh.position.set(cx + Math.sin(cry) * 0.62 + Math.cos(cry) * 0.35, groundY(cx, cz) + 2.1, cz + Math.cos(cry) * 0.62 - Math.sin(cry) * 0.35);
    clothMesh.rotation.y = cry; group.add(clothMesh);
    var cageCloth = clothMesh; // eslint-disable-line
  }
  const lantern: Lantern = makeLantern(C.lantern, 14, 6, 3.0, C.iron, 1, true);
  // the same local (1.02, 0.56) as the post, through xf()'s rotation: (x cos ry + z sin ry, −x sin ry + z cos ry)
  lantern.pivot.position.set(
    cx + 1.02 * Math.cos(cry) + 0.56 * Math.sin(cry),
    groundY(cx, cz) + 2.62,
    cz - 1.02 * Math.sin(cry) + 0.56 * Math.cos(cry),
  );
  group.add(lantern.pivot);

  // ---- the bone pile, three sleeping mats, the club rack -----------------------------------------
  {
    const bones: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) bones.push(CY(0.04, 0.045, 0.4 + r() * 0.2, 5, '#E6DCC3').rotateZ(Math.PI / 2).rotateY(r() * 6).translate((r() - 0.5) * 0.4, 0.05 + i * 0.045, (r() - 0.5) * 0.4));
    bones.push(colorize(new THREE.IcosahedronGeometry(0.16, 1), '#E6DCC3').translate(0.1, 0.4, -0.05));
    opaque.push(at(mergeGeos(bones), CAMP.x - 3.2, CAMP.z - 3.0, r() * 6));
  }
  for (const [mx, mz, mr] of [[CAMP.x + 1.0, CAMP.z + 3.0, 20], [CAMP.x + 2.6, CAMP.z + 2.0, 65], [CAMP.x - 0.6, CAMP.z + 3.6, 340]] as [number, number, number][]) {
    opaque.push(at(B(1.8, 0.08, 0.8, '#4A3524'), mx, mz, deg(mr), 0.04));
  }
  {
    const rack = mergeGeos([
      ...[-0.5, 0.5].map((s) => CY(0.05, 0.06, 1.0, 5, C.bark).translate(s, 0.5, 0)),
      B(1.2, 0.06, 0.06, C.bark).translate(0, 0.98, 0),
      ...[-0.22, 0.22].map((s) => mergeGeos([CY(0.035, 0.04, 0.55, 5, '#8B3A1E'), colorize(new THREE.IcosahedronGeometry(0.11, 0), '#8B3A1E').translate(0, 0.32, 0)]).rotateZ(0.22).translate(s, 0.66, 0.06)),
    ]);
    opaque.push(at(rack, CAMP.x - 2.0, CAMP.z + 2.4, deg(120)));
    fp(CAMP.x - 2.0, CAMP.z + 2.4, 0.6);
  }

  // ---- four goblin totems ringing the meadow ------------------------------------------------------
  const streamers: THREE.Mesh[] = [];
  for (const [tx, tz] of TOTEMS) {
    // face, spike and skull ×1.5 on the plan's sizes so they read at 28 m (scores §4 change 2)
    const face = mergeGeos([
      B(0.15, 0.075, 0.045, '#E6DCC3').translate(-0.13, 1.9, 0.17), B(0.15, 0.075, 0.045, '#E6DCC3').translate(0.13, 1.9, 0.17),
      B(0.39, 0.075, 0.045, '#E6DCC3').translate(0, 1.58, 0.17),
    ]);
    const post = mergeGeos([CY(0.15, 0.19, 2.4, 6, C.bark).translate(0, 1.2, 0), face,
      CY(0.025, 0.025, 0.5, 4, C.iron).translate(0, 2.55, 0), colorize(new THREE.IcosahedronGeometry(0.255, 1), '#E6DCC3').translate(0, 2.92, 0)]);
    const ry = Math.atan2(44 - tx, -(0 - tz)) + Math.PI; // the faces look in at the meadow
    opaque.push(at(post, tx, tz, ry));
    fp(tx, tz, 0.32);
    const rag = colorize(new THREE.PlaneGeometry(0.36, 0.95, 1, 3), '#7E3320');
    rag.translate(0, -0.475, 0);
    const m = new THREE.Mesh(rag, swayMat);
    m.position.set(tx + 0.2, groundY(tx, tz) + 2.44, tz); m.rotation.y = ry;
    group.add(m); streamers.push(m);
  }

  // ---- the furrow's last debris (x 22–30), the lookout stump, two mossy boulders -------------------
  // Six flat boards at 35 m were invisible from S1 (scores §4 change 5). The furrow now ends in one
  // wreck-heap 1.2 m tall at (26.5, −1) — planks, a bent spar, a torn wheel — with the scorch's
  // darker face colour scattered along the last 8 m, so the frame's upper-left has a subject.
  {
    const heap: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const a = r() * 6.28, lean = 0.5 + r() * 0.9, ln = 0.9 + r() * 1.1;
      heap.push(B(ln, 0.09, 0.20 + r() * 0.14, i % 3 === 0 ? '#8B4513' : i % 3 === 1 ? '#654321' : '#7A5A32')
        .rotateZ(lean * (r() < 0.5 ? -1 : 1)).rotateY(a).translate((r() - 0.5) * 0.9, 0.18 + i * 0.11, (r() - 0.5) * 0.9));
    }
    heap.push(CY(0.06, 0.08, 1.9, 5, C.iron).rotateZ(0.85).rotateY(1.1).translate(0.15, 0.72, -0.1));
    heap.push(colorize(new THREE.TorusGeometry(0.46, 0.06, 4, 10), C.bark).rotateY(0.6).rotateX(0.35).translate(-0.55, 0.44, 0.35));
    const heapG = mergeGeos(heap); jitterColor(heapG, r, 0.06);
    opaque.push(at(heapG, 26.5, -1, deg(24)));
    fp(26.5, -1, 1.2);
  }
  for (let i = 0; i < 10; i++) {
    const bx = 22.5 + r() * 8, bz = (r() - 0.5) * 5.5;
    opaque.push(at(B(0.3 + r() * 0.5, 0.05, 0.1 + r() * 0.12, i % 3 ? C.scorch : '#4A3524').rotateY(r() * 6).rotateZ((r() - 0.5) * 0.3), bx, bz, 0, 0.03));
  }
  opaque.push(at(mergeGeos([CY(0.4, 0.44, 0.6, 8, C.bark).translate(0, 0.3, 0), colorize(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 8), '#B8863B').translate(0, 0.62, 0)]), 48, 12, 0));
  fp(48, 12, 0.5);
  for (const [bx, bz, br] of [[52, -6, 0.9], [36, 8, 0.6]] as [number, number, number][]) {
    const rock = colorize(new THREE.IcosahedronGeometry(br, 1), '#5C6068');
    const p = rock.getAttribute('position') as THREE.BufferAttribute, col = rock.getAttribute('color') as THREE.BufferAttribute;
    const moss = new THREE.Color('#3A7D44');
    for (let i = 0; i < p.count; i++) if (p.getZ(i) < -br * 0.2 && p.getY(i) > 0) col.setXYZ(i, moss.r, moss.g, moss.b); // the north faces
    rock.scale(1.2, 0.85, 1.05);
    opaque.push(at(rock, bx, bz, r() * 6, br * 0.55));
    fp(bx, bz, br * 1.05);
  }

  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat);
  opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  group.add(opaqueMesh);
  if (glow.length) { const g = new THREE.Mesh(mergeGeos(glow), glowMat); g.layers.enable(BLOOM_LAYER); group.add(g); }
  void emis;

  const f = 8.8 + 0.37 * 1.2, ph = 2.1;
  const update = (t: number, dt: number, kf: Keyframe): void => {
    const v0 = Math.sin(t * f + ph), v1 = Math.sin(t * f * 1.7 + 0.7), v2 = Math.sin(t * f * 0.6 + 2.9);
    tongues[0]!.scale.y = 1 + 0.11 * v0; tongues[0]!.rotation.z = 0.09 * Math.sin(t * f * 1.7 + ph + 2);
    tongues[1]!.scale.y = 1 + 0.14 * v1; tongues[1]!.rotation.z = -0.08 * v1;
    tongues[2]!.scale.y = 1 + 0.12 * v2; tongues[2]!.rotation.x = 0.08 * v2;
    for (const m of tongues) m.visible = kf.fire > 0.5;
    fireLight.intensity = 60 * kf.fire * (0.88 + 0.12 * v0);
    lantern.update(t, dt, kf.lantern);
    cageCloth.rotation.x = 0.12 * Math.sin(t * 0.9) + 0.06 * Math.sin(t * 2.3 + 1);
    for (const [i, s] of streamers.entries()) s.rotation.x = 0.16 * Math.sin(t * 0.8 + i) + 0.08 * Math.sin(t * 1.9 + i * 2);
  };
  return { group, footprints, gap, update };
}

// ---- the meadow's own ground scatter (T-09, T-22) -------------------------------------------------
// The Forest's `makeScatter` is cleared inside MEADOW and re-made here, because the imported version
// put the camp's six flower colours and the autumn-leaf palette (`C.leaves`: #B03828 red, #D87828
// orange, #38A866 green) over the whole meadow at a uniform density, and the review counted the
// result as confetti in every wide frame. This version is T-09's numbers in clusters (about
// 1.2 tufts/m², all of it in clumps rather than spread), pebbles at 0.3/m², litter in T-22's four
// olive-browns with #B03828 at 8 %, and flowers only in four drifts at the meadow's rim.
const LITTER = ['#5E5A2A', '#6E5326', '#4A5A2A', '#7A6A3A'] as const;   // T-22
const LITTER_RED = '#B03828';                                          // ... at about 8 %
const DRIFT_FLOWERS = ['#E8A838', '#F0D898'] as const;                 // within a step of golden grass

function tuftGeo(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const a = new THREE.Color(C.grassA).multiplyScalar(1.05), b = new THREE.Color(C.grassB).multiplyScalar(1.1), tip = new THREE.Color(C.grassTip).multiplyScalar(1.12);
  for (let i = 0; i < 3; i++) {
    const g = new THREE.BufferGeometry();
    const w = 0.11, h = 0.24 + i * 0.04, lean = 0.06;
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, lean, h, 0], 3));
    const base = i === 1 ? b : a;
    g.setAttribute('color', new THREE.Float32BufferAttribute([base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b], 3));
    parts.push(xf(g, 0, 0, 0, i * 1.05));
  }
  return mergeGeos(parts);
}
const litterGeo = (hex: string) => { const g = colorize(new THREE.PlaneGeometry(0.15, 0.1), hex); g.rotateX(-Math.PI / 2); return g; };
const stoneGeo = (hex: string) => { const g = colorize(new THREE.IcosahedronGeometry(0.09, 0), hex); g.scale(1.2, 0.55, 0.9); (g.getAttribute('color') as THREE.BufferAttribute).array.forEach((_, i, arr) => { arr[i] = arr[i]! * 0.78; }); return g; };
const bloomGeo = (hex: string) => mergeGeos([xf(colorize(new THREE.BoxGeometry(0.02, 0.26, 0.02), C.grassB), 0, 0.13), xf(colorize(new THREE.IcosahedronGeometry(0.05, 0), hex).scale(1.3, 0.7, 1.3), 0, 0.28)]);

interface Item { x: number; z: number; y: number; s: number; yaw: number }

/** The thinned meadow ground, in clumps. `clear` is the prop footprints to keep bare. */
export function makeMeadowScatter(clear: Circle[]): { group: THREE.Group } {
  const group = new THREE.Group();
  const r = rng(1907);
  const swayMat = makeWorldMaterial({ sway: 0.14, side: THREE.DoubleSide });
  const stillMat = makeWorldMaterial({ side: THREE.DoubleSide });
  const tufts: Item[] = [], stones: Item[] = [], litter: Item[][] = [[], [], [], [], []], blooms: Item[][] = [[], []];
  // four flower drifts at the meadow's rim, well away from the fight and the camp
  const drifts: [number, number, number][] = [[30, 12, 2.2], [56, -8, 2.0], [52, 15, 1.8], [33, -3, 1.6]];
  const blocked = (x: number, z: number): boolean => {
    if (!inside(x, z)) return true;
    if (groundY(x, z) < -0.3 || distToWater(x, z) < 1.2) return true;
    for (const c of clear) if (Math.hypot(c.x - x, c.z - z) < c.r + 0.3) return true;
    return false;
  };
  const push = (list: Item[], x: number, z: number, s: number): void => {
    if (blocked(x, z)) return;
    list.push({ x, z, y: groundY(x, z), s, yaw: r() * 6.28 });
  };
  const cell = 3;
  // the goblins have lived here: inside the palisade the ground is trodden, not meadow
  const trodden = (x: number, z: number): number => (Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP.r + 1 ? 0.15 : 1);
  for (let gx = Math.floor((MEADOW.x - MEADOW.r) / cell); gx <= (MEADOW.x + MEADOW.r) / cell; gx++) {
    for (let gz = Math.floor((MEADOW.z - MEADOW.r) / cell); gz <= (MEADOW.z + MEADOW.r) / cell; gz++) {
      const cx = gx * cell, cz = gz * cell;
      if (Math.hypot(cx + cell / 2 - MEADOW.x, cz + cell / 2 - MEADOW.z) > MEADOW.r) continue;
      const th = trodden(cx + cell / 2, cz + cell / 2);
      // grass: half the 3 m cells carry a clump of sixteen inside 1.3 m, the rest a single blade —
      // 0.94 tufts per square metre, all of it in clusters with bare ground between (T-09)
      if (r() < 0.5 * th) {
        const bx = cx + r() * cell, bz = cz + r() * cell;
        for (let i = 0; i < 16; i++) { const a = r() * 6.28, rr = Math.sqrt(r()) * 1.3; push(tufts, bx + Math.cos(a) * rr, bz + Math.sin(a) * rr, 0.8 + r() * 0.45); }
      } else if (r() < th) push(tufts, cx + r() * cell, cz + r() * cell, 0.8 + r() * 0.45);
      // pebbles at T-09's 0.3 per square metre; litter at 0.18; both within a step of the ground
      for (let i = 0; i < 3; i++) if (r() < 0.9 * th) push(stones, cx + r() * cell, cz + r() * cell, 0.6 + r() * 0.9);
      for (let i = 0; i < 2; i++) {
        if (r() > 0.8 * th) continue;
        const k = r() < 0.08 ? 4 : Math.floor(r() * 4);   // #B03828 at 8 %
        push(litter[k]!, cx + r() * cell, cz + r() * cell, 0.85 + r() * 0.45);
      }
      // flowers only in drifts
      for (const [dx, dz, dr] of drifts) {
        if (Math.hypot(cx + cell / 2 - dx, cz + cell / 2 - dz) > dr) continue;
        for (let i = 0; i < 9; i++) push(blooms[r() < 0.6 ? 0 : 1]!, cx + r() * cell, cz + r() * cell, 0.85 + r() * 0.3);
      }
    }
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const place = (geo: THREE.BufferGeometry, mat: THREE.MeshStandardMaterial, list: Item[]): void => {
    if (list.length === 0) return;
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => { m.compose(new THREE.Vector3(it.x, it.y, it.z), q.setFromAxisAngle(up, it.yaw), new THREE.Vector3(it.s, it.s, it.s)); mesh.setMatrixAt(i, m); });
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  place(tuftGeo(), swayMat, tufts);
  place(stoneGeo(C.stone), stillMat, stones.filter((_, i) => i % 2 === 0));
  place(stoneGeo(C.stoneWarm), stillMat, stones.filter((_, i) => i % 2 === 1));
  [...LITTER, LITTER_RED].forEach((hex, k) => place(litterGeo(hex), stillMat, litter[k]!));
  DRIFT_FLOWERS.forEach((hex, k) => place(bloomGeo(hex), swayMat, blooms[k]!));
  return { group };
}
