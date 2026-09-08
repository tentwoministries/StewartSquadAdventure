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
import { groundY } from '../forest-dusk/terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

export const CAMP = { x: 40, z: -14, r: 6 };          // the 12 m ring
export const GAP = 90;                                 // the palisade's gap faces the meadow
export const TOTEMS: [number, number][] = [[30, -18], [58, -18], [58, 18], [30, 18]];

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
    const h = 1.6 + r() * 0.7;
    const g = CY(0.12, 0.16, h, 6, C.bark);
    const tip = CY(0.11, 0.13, 0.22, 6, '#7E3320'); tip.translate(0, h / 2 + 0.09, 0);
    const stake = mergeGeos([g, tip]);
    stake.rotateZ(deg((r() * 2 - 1) * 8)); stake.rotateX(deg((r() * 2 - 1) * 8));
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
  const tongues = [tongue(0.5, 0.15), tongue(0.33, 0.10), tongue(0.28, 0.09)];
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
    parts.push(CY(0.06, 0.07, 1.5, 5, C.bark).translate(-0.85, 1.7, 0.5)); // the lantern post
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
  lantern.pivot.position.set(cx - Math.sin(cry) * 0.85 + Math.cos(cry) * 0.5, groundY(cx, cz) + 2.4, cz - Math.cos(cry) * 0.85 - Math.sin(cry) * 0.5);
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
    const face = mergeGeos([
      B(0.10, 0.05, 0.03, '#E6DCC3').translate(-0.09, 1.9, 0.16), B(0.10, 0.05, 0.03, '#E6DCC3').translate(0.09, 1.9, 0.16),
      B(0.26, 0.05, 0.03, '#E6DCC3').translate(0, 1.62, 0.16),
    ]);
    const post = mergeGeos([CY(0.15, 0.19, 2.4, 6, C.bark).translate(0, 1.2, 0), face,
      CY(0.02, 0.02, 0.5, 4, C.iron).translate(0, 2.55, 0), colorize(new THREE.IcosahedronGeometry(0.17, 1), '#E6DCC3').translate(0, 2.86, 0)]);
    const ry = Math.atan2(44 - tx, -(0 - tz)) + Math.PI; // the faces look in at the meadow
    opaque.push(at(post, tx, tz, ry));
    fp(tx, tz, 0.32);
    const rag = colorize(new THREE.PlaneGeometry(0.24, 0.7, 1, 3), '#7E3320');
    rag.translate(0, -0.35, 0);
    const m = new THREE.Mesh(rag, swayMat);
    m.position.set(tx + 0.16, groundY(tx, tz) + 2.42, tz); m.rotation.y = ry;
    group.add(m); streamers.push(m);
  }

  // ---- the furrow's last debris (x 22–30), the lookout stump, two mossy boulders -------------------
  for (let i = 0; i < 6; i++) {
    const bx = 22 + r() * 8, bz = (r() - 0.5) * 5;
    opaque.push(at(B(0.24 + r() * 0.36, 0.05, 0.09 + r() * 0.1, i % 2 ? '#8B4513' : '#654321').rotateY(r() * 6).rotateZ((r() - 0.5) * 0.3), bx, bz, 0, 0.03));
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
