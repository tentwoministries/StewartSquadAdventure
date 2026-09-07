// Frozen creatures (PHASE_0.75_ANIMALS_BRAINSTORM.md §3): the elk herd (a bull leads, four follow
// in a line) crossing the frozen lake under the aurora with breath fog at night, walking around a
// standing kid; snow hares that hop and scatter; two mountain goats on the shelf's ledges that
// bleat down when a kid is below; the snowy owl on the dead pine with gold eyes that turns its
// head to follow; ptarmigans that explode into flight at 4 m; the penguin colony that waddles up
// the drift, belly-slides down and waddles back; two seals on the ice that roll over and slap.
import * as THREE from 'three';
import { FROZEN as F } from '../_shared/biomes';
import { flicker, makeWander } from '../_shared/creature';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { softDisc } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
import type { Keyframe } from '../_shared/style';
import { DRIFT, groundY, LAKE } from './terrain';

const mat = makeWorldMaterial({ roughness: 0.95, aurora: true });
const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Creatures {
  group: THREE.Group;
  update: (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => void;
  poi: () => THREE.Vector3 | null;
  herdCross: () => string;
  hud: () => string[];
}

/** An elk built facing +x; shoulder 1.5 m, palmate antlers on the bull. */
function makeElk(bull: boolean): { root: THREE.Group; body: THREE.Group; neck: THREE.Group; head: THREE.Group; legs: THREE.Group[]; ears: THREE.Mesh[] } {
  const root = new THREE.Group();
  const s = bull ? 1.15 : 1.0;
  const body = node(0, 1.05 * s, 0);
  const torso = colorize(new THREE.CylinderGeometry(0.3 * s, 0.34 * s, 1.25 * s, 6), F.elk); torso.rotateZ(Math.PI / 2); torso.scale(1, 1, 0.85);
  body.add(mesh(mergeGeos([torso, xf(colorize(new THREE.IcosahedronGeometry(0.34 * s, 1), F.elk).scale(1, 0.8, 0.9), 0.35 * s, 0.2 * s, 0), xf(B(0.9 * s, 0.1, 0.4 * s, F.elkBelly), -0.05, -0.3 * s, 0), xf(B(0.18, 0.1, 0.24, F.elkBelly), -0.6 * s, 0.05, 0)])));
  const neck = node(0.55 * s, 0.35 * s, 0);
  neck.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.11 * s, 0.16 * s, 0.6 * s, 6), F.elk), 0, 0.25 * s)));
  const head = node(0.0, 0.55 * s, 0);
  head.add(mesh(mergeGeos([xf(B(0.42 * s, 0.24 * s, 0.22 * s, F.elk), 0.15 * s, 0), xf(B(0.16 * s, 0.14 * s, 0.14 * s, '#2A2018'), 0.42 * s, -0.02), xf(B(0.03, 0.03, 0.05, '#1A1410'), 0.25 * s, 0.1 * s, 0.11 * s), xf(B(0.03, 0.03, 0.05, '#1A1410'), 0.25 * s, 0.1 * s, -0.11 * s)])));
  const ears: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const ear = mesh(xf(B(0.04, 0.16, 0.09, F.elk), 0, 0.08)); ear.position.set(0.02, 0.1 * s, side * 0.12 * s); ear.rotation.x = side * 0.5; head.add(ear); ears.push(ear);
    if (bull) {
      const beam = mergeGeos([xf(B(0.035, 0.5, 0.035, F.antler), 0, 0.25, 0, 0, 0, side * 0.35), xf(B(0.4, 0.28, 0.05, F.antler), side * 0.14, 0.55, 0.0, 0, 0, side * 0.2), ...[0, 1, 2].map((i) => xf(B(0.03, 0.22, 0.03, F.antler), side * (0.05 + i * 0.14), 0.75, 0, 0, 0, side * (0.3 - i * 0.1)))]);
      const ant = mesh(beam); ant.position.set(0.02, 0.1 * s, side * 0.08 * s); ant.rotation.x = side * 0.4; head.add(ant);
    }
  }
  neck.add(head); body.add(neck);
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[0.42, 0.16], [0.42, -0.16], [-0.42, 0.16], [-0.42, -0.16]] as [number, number][]) {
    const hip = node(x * s, -0.15 * s, z * s);
    hip.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.06, 0.05, 0.5 * s, 5), F.elk), 0, -0.25 * s)));
    const knee = node(0, -0.5 * s, 0);
    knee.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.045, 0.04, 0.42 * s, 5), F.elk), 0, -0.21 * s))); knee.add(mesh(xf(B(0.1, 0.07, 0.1, '#2A2018'), 0, -0.42 * s)));
    hip.add(knee); body.add(hip); legs.push(hip);
  }
  root.add(body);
  return { root, body, neck, head, legs, ears };
}

export function makeCreatures(owlPerch: THREE.Vector3, goatLedges: THREE.Vector3[]): Creatures {
  const group = new THREE.Group();
  const r = rng(19);
  const tex = softDisc();
  // breath puffs: one sprite per warm creature, a puff every ~3 s at night
  const breathMat = new THREE.SpriteMaterial({ map: tex, color: F.breath, transparent: true, opacity: 0, depthWrite: false });
  const puffs: { s: THREE.Sprite; at: () => THREE.Vector3; ph: number }[] = [];
  const addPuff = (at: () => THREE.Vector3) => { const s = new THREE.Sprite(breathMat.clone()); group.add(s); puffs.push({ s, at, ph: r() * 3 }); };
  const tmp = new THREE.Vector3();
  // ---- the elk herd: a bull leads across the lake, four follow the one ahead --------------------
  const elks = [makeElk(true), makeElk(false), makeElk(false), makeElk(false), makeElk(false)];
  for (const e of elks) group.add(e.root);
  const avoidKid = { x: 0, z: 0, r: 3 }; // the herd walks around a standing kid (mutated each frame)
  const herd = makeWander({
    patch: { x: LAKE.x - 20, z: LAKE.z - 6, r: 6, avoid: [avoidKid] }, speed: 0.75, seed: 23, turnRate: 1.4, graze: [10, 18], lookChance: 0.35, minLeg: 3,
    routes: [[[LAKE.x - 17, LAKE.z - 8], [LAKE.x - 8, LAKE.z - 3], [LAKE.x + 2, LAKE.z + 2], [LAKE.x + 11, LAKE.z + 8], [LAKE.x + 20, LAKE.z + 11]], [[LAKE.x + 12, LAKE.z + 4], [LAKE.x, LAKE.z - 4], [LAKE.x - 12, LAKE.z - 9], [LAKE.x - 20, LAKE.z - 7]]],
  });
  herd.park(LAKE.x - 18, LAKE.z - 8, 110);
  const trail: THREE.Vector3[] = []; // the bull's recent positions; followers sample it
  const elkEar = elks.map((_, i) => flicker(30 + i, 3, 4));
  const followers = elks.slice(1).map((e, i) => ({ e, dist: 2.6 * (i + 1), x: LAKE.x - 18 - 2.6 * (i + 1), z: LAKE.z - 8 + (i % 2 ? 1.2 : -1.2), heading: 0, phase: r() * 6 }));
  for (const e of elks) addPuff(() => { e.head.getWorldPosition(tmp); return tmp.clone().add(new THREE.Vector3(0, 0, 0)); });
  // ---- snow hares ----------------------------------------------------------------------------------
  const hareGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.16, 1), F.hare).scale(1.3, 0.9, 1), 0, 0.15), xf(colorize(new THREE.IcosahedronGeometry(0.1, 1), F.hare), 0.18, 0.28), ...[-0.04, 0.04].map((z) => xf(B(0.04, 0.2, 0.03, F.hare), 0.16, 0.42, z)), ...[-0.04, 0.04].map((z) => xf(B(0.045, 0.05, 0.035, F.hareEar), 0.16, 0.53, z)), xf(colorize(new THREE.IcosahedronGeometry(0.04, 0), F.snow), -0.2, 0.18, 0), xf(B(0.02, 0.02, 0.03, '#1A1410'), 0.27, 0.3, 0.04), xf(B(0.02, 0.02, 0.03, '#1A1410'), 0.27, 0.3, -0.04)]);
  const hares: { m: THREE.Mesh; x: number; z: number; heading: number; hopT: number; hops: number; next: number }[] = [];
  for (const [x, z] of [[-6, 14], [12, -6], [-16, -14], [28, 12]] as [number, number][]) { const m = mesh(hareGeo); group.add(m); hares.push({ m, x, z, heading: r() * 6, hopT: -10, hops: 0, next: 2 + r() * 3 }); }
  // ---- goats on the shelf's ledges -------------------------------------------------------------------
  const goatGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.3, 1), F.goat).scale(1.5, 0.9, 0.9), 0, 0.62), xf(B(0.34, 0.2, 0.2, F.goat), 0.5, 0.75), ...([[0.25, 0.12], [0.25, -0.12], [-0.25, 0.12], [-0.25, -0.12]] as [number, number][]).map(([x, z]) => xf(CY(0.04, 0.035, 0.5, 5, F.goat), x, 0.25, z)), xf(B(0.12, 0.14, 0.14, F.goat), -0.35, 0.65), ...[-1, 1].map((s) => xf(colorize(new THREE.TorusGeometry(0.12, 0.025, 4, 8, Math.PI * 0.9), F.goatHorn).rotateY(Math.PI / 2), 0.5, 0.92, s * 0.07)), xf(B(0.03, 0.03, 0.04, '#1A1410'), 0.66, 0.8, 0.07), xf(B(0.03, 0.03, 0.04, '#1A1410'), 0.66, 0.8, -0.07)]);
  const goats: { root: THREE.Group; jaw: THREE.Mesh; bleatT: number }[] = [];
  goatLedges.forEach((p, i) => { const root = node(p.x, p.y, p.z); root.rotation.y = i * 2.4; root.add(mesh(goatGeo)); const jaw = mesh(xf(B(0.2, 0.06, 0.14, F.goat), 0.55, 0.62)); root.add(jaw); group.add(root); goats.push({ root, jaw, bleatT: -100 }); addPuff(() => root.position.clone().add(new THREE.Vector3(0.6, 0.8, 0))); });
  // ---- the snowy owl on the dead pine --------------------------------------------------------------
  const owl = node(owlPerch.x, owlPerch.y, owlPerch.z);
  owl.add(mesh(mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.2, 1), F.owl).scale(1, 1.4, 1), 0, 0.28), xf(B(0.12, 0.06, 0.08, '#3A3A40'), 0, 0.02)])));
  const owlHead = node(0, 0.55, 0);
  owlHead.add(mesh(colorize(new THREE.IcosahedronGeometry(0.17, 1), F.owl)));
  const owlEyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(F.owlEye).multiplyScalar(1.4) });
  const owlEyes: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), owlEyeMat); e.position.set(s * 0.06, 0.03, 0.15); e.layers.enable(BLOOM_LAYER); owlHead.add(e); owlEyes.push(e); }
  owlHead.add(mesh(xf(colorize(new THREE.ConeGeometry(0.025, 0.06, 4), '#3A3A40').rotateX(Math.PI / 2), 0, -0.02, 0.17)));
  owl.add(owlHead); group.add(owl);
  // ---- ptarmigans: plump white birds that explode into flight ----------------------------------------
  const ptGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.16, 1), F.snow).scale(1.3, 0.9, 1), 0, 0.14), xf(colorize(new THREE.IcosahedronGeometry(0.09, 1), F.snow), 0.16, 0.26), xf(B(0.05, 0.03, 0.03, '#E8801A'), 0.25, 0.26), xf(B(0.02, 0.02, 0.02, '#1A1410'), 0.2, 0.3, 0.05), xf(B(0.02, 0.02, 0.02, '#1A1410'), 0.2, 0.3, -0.05)]);
  const pts: { m: THREE.Mesh; home: THREE.Vector3; flyT: number; to: THREE.Vector3 }[] = [];
  for (const [x, z] of [[6, 10], [8, 12], [-4, -16], [30, -4], [-14, 28]] as [number, number][]) { const m = mesh(ptGeo); m.position.set(x, groundY(x, z), z); m.rotation.y = r() * 6; group.add(m); pts.push({ m, home: m.position.clone(), flyT: -100, to: m.position.clone() }); }
  // ---- the penguin colony: waddle up the drift, belly-slide down, waddle back --------------------------
  const penguinGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.22, 1), F.penguin).scale(1, 1.5, 0.9), 0, 0.36), xf(colorize(new THREE.IcosahedronGeometry(0.16, 1), F.penguinBelly).scale(0.8, 1.3, 0.5), 0, 0.33, 0.12), xf(colorize(new THREE.IcosahedronGeometry(0.14, 1), F.penguin), 0, 0.7), xf(colorize(new THREE.ConeGeometry(0.03, 0.1, 4), F.penguinBeak).rotateX(Math.PI / 2), 0, 0.68, 0.16), ...[-1, 1].map((s) => xf(B(0.04, 0.26, 0.1, F.penguin), s * 0.22, 0.36, 0, 0, 0, s * 0.25)), ...[-1, 1].map((s) => xf(B(0.1, 0.03, 0.14, F.penguinBeak), s * 0.08, 0.02, 0.04)), xf(B(0.02, 0.02, 0.02, '#1A1410'), 0.05, 0.74, 0.12), xf(B(0.02, 0.02, 0.02, '#1A1410'), -0.05, 0.74, 0.12)]);
  const penguins: { m: THREE.Mesh; ph: number }[] = [];
  for (let i = 0; i < 6; i++) { const m = mesh(penguinGeo); group.add(m); penguins.push({ m, ph: i / 6 }); }
  // ---- seals on the ice --------------------------------------------------------------------------------
  const sealGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.34, 1), F.seal).scale(2.2, 0.75, 1), 0, 0.26), xf(colorize(new THREE.IcosahedronGeometry(0.2, 1), F.seal), 0.7, 0.42), ...[-1, 1].map((s) => xf(B(0.3, 0.05, 0.16, F.seal), 0.15, 0.08, s * 0.32, 0, 0, 0)), xf(B(0.24, 0.05, 0.3, F.seal), -0.78, 0.12), xf(B(0.03, 0.03, 0.04, '#1A1410'), 0.85, 0.5, 0.08), xf(B(0.03, 0.03, 0.04, '#1A1410'), 0.85, 0.5, -0.08), ...[-0.06, 0.06].map((z) => xf(B(0.015, 0.015, 0.02, '#1A1410'), 0.88, 0.42, z))]);
  const seals: { m: THREE.Mesh; rollT: number; slapT: number; x: number; z: number }[] = [];
  for (const [x, z, y] of [[LAKE.x + 6, LAKE.z + 4, 0], [LAKE.x - 3, LAKE.z + 9, 0]] as [number, number, number][]) { const m = mesh(sealGeo); m.position.set(x, groundY(x, z), z); m.rotation.y = 1.2 + y; group.add(m); seals.push({ m, rollT: -100, slapT: -100, x, z }); }

  const poiV = new THREE.Vector3(); let poiSet = false;
  const heroV = new THREE.Vector3();
  const update = (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => {
    heroV.copy(hero); poiSet = false;
    // the bull wanders (or crosses on key 0); the herd walks around a standing kid
    avoidKid.x = hero.x; avoidKid.z = hero.z;
    herd.update(dt);
    const bull = elks[0]!;
    bull.root.position.set(herd.x, groundY(herd.x, herd.z), herd.z); bull.root.rotation.y = herd.rotY();
    const poseElk = (e: typeof bull, walkPhase: number, stride: number, graze: number, i: number) => {
      e.legs.forEach((l, k) => { const ph = k === 0 || k === 3 ? 0 : Math.PI; const front = k < 2; l.rotation.z = Math.sin(walkPhase + ph) * 0.3 * stride + (front ? 0.3 : -0.1) * graze; (l.children[1] as THREE.Object3D).rotation.z = (front ? -0.4 : 0.15) * graze; });
      e.body.position.y = (i === 0 ? 1.05 * 1.15 : 1.05) - 0.12 * graze + Math.abs(Math.sin(walkPhase)) * 0.02 * stride;
      e.neck.rotation.z = -0.5 - 1.5 * graze + 0.04 * Math.sin(walkPhase * 2) * stride + (graze > 0.5 ? 0.05 * Math.sin(t * 2.4 + i) : 0);
      e.head.rotation.z = 0.5 + 0.7 * graze;
      const ef = elkEar[i]!(t); e.ears.forEach((ear, k) => { ear.rotation.z = ef * 0.5 * (k === 0 ? 1 : 0.4); });
    };
    poseElk(bull, herd.walkPhase, herd.stride, herd.graze, 0);
    if (trail.length === 0 || trail[trail.length - 1]!.distanceTo(bull.root.position) > 0.35) { trail.push(bull.root.position.clone()); if (trail.length > 80) trail.shift(); }
    followers.forEach((f, i) => {
      // follow the trail at a fixed distance behind the one ahead; ease into place
      let acc = 0, target: THREE.Vector3 | null = null;
      for (let k = trail.length - 1; k > 0; k--) { acc += trail[k]!.distanceTo(trail[k - 1]!); if (acc >= f.dist) { target = trail[k - 1]!; break; } }
      if (target) {
        const dx = target.x - f.x, dz = target.z - f.z, d = Math.hypot(dx, dz);
        if (d > 0.05) { const sp = Math.min(d, herd.speedNow * 1.1 + 0.2) * dt; f.x += (dx / d) * sp; f.z += (dz / d) * sp; const want = Math.atan2(-dz, dx); let diff = want - f.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); f.heading += diff * Math.min(1, dt * 3); }
      }
      f.e.root.position.set(f.x, groundY(f.x, f.z), f.z); f.e.root.rotation.y = f.heading;
      const moving = herd.state === 'walk' && !!target;
      poseElk(f.e, herd.walkPhase + f.phase, moving ? herd.stride : 0, moving ? 0 : herd.graze, i + 1);
    });
    if (herd.state === 'walk' && Math.hypot(herd.x - hero.x, herd.z - hero.z) < 18) { poiV.copy(bull.root.position).add(new THREE.Vector3(0, 1.4, 0)); poiSet = true; }
    // hares: sit, then three hops; scatter from a kid at 4 m
    for (const h of hares) {
      const d = Math.hypot(h.x - hero.x, h.z - hero.z);
      if (d < 4 && h.hops === 0 && t - h.hopT > 0.5) { h.heading = Math.atan2(h.z - hero.z, h.x - hero.x); h.hops = 5; h.hopT = t; }
      else if (t > h.next && h.hops === 0) { h.heading = r() * 6.28; h.hops = 3; h.hopT = t; h.next = t + 4 + r() * 5; }
      if (h.hops > 0) {
        const u = (t - h.hopT) / 0.42;
        if (u >= 1) { h.hops--; h.hopT = t; h.x += Math.cos(h.heading) * 0.8; h.z += Math.sin(h.heading) * 0.8; }
        const uu = THREE.MathUtils.clamp(u, 0, 1);
        h.m.position.set(h.x + Math.cos(h.heading) * 0.8 * uu, groundY(h.x, h.z) + Math.sin(uu * Math.PI) * 0.35, h.z + Math.sin(h.heading) * 0.8 * uu);
        h.m.scale.set(1, 1 - 0.15 * Math.sin(uu * Math.PI), 1);
      } else { h.m.position.set(h.x, groundY(h.x, h.z), h.z); h.m.scale.set(1, 1 + 0.03 * Math.sin(t * 3 + h.x), 1); }
      h.m.rotation.y = -h.heading;
    }
    // goats: bleat down at a kid within 8 m (head down, jaw open, 1 s)
    for (const g of goats) {
      const d = Math.hypot(g.root.position.x - hero.x, g.root.position.z - hero.z);
      if (d < 8 && t - g.bleatT > 5) g.bleatT = t;
      const b = THREE.MathUtils.smoothstep(t - g.bleatT, 0, 0.3) * (1 - THREE.MathUtils.smoothstep(t - g.bleatT, 0.9, 1.3));
      g.root.rotation.x = -0.25 * b; g.jaw.rotation.z = 0.5 * b * (0.6 + 0.4 * Math.sin(t * 22));
      g.root.position.y += 0;
    }
    // the owl turns its head to follow the kid; blinks
    const oa = Math.atan2(hero.x - owl.position.x, hero.z - owl.position.z);
    owlHead.rotation.y += (THREE.MathUtils.clamp(Math.atan2(Math.sin(oa), Math.cos(oa)), -1.4, 1.4) - owlHead.rotation.y) * Math.min(1, dt * 2.5);
    const blink = ((t + 2.2) % 6) > 5.8 ? 0.1 : 1; owlEyes.forEach((e) => { e.scale.y = blink; });
    owlEyeMat.color.set(F.owlEye).multiplyScalar(0.6 + 0.8 * kf.stars);
    // ptarmigans: explode into flight at 4 m, land 12 m away after 2.5 s
    for (const p of pts) {
      const d = Math.hypot(p.m.position.x - hero.x, p.m.position.z - hero.z);
      if (p.flyT < 0 && d < 4) { p.flyT = t; const a = Math.atan2(p.m.position.z - hero.z, p.m.position.x - hero.x) + (r() - 0.5); p.to.set(p.home.x + Math.cos(a) * 12, 0, p.home.z + Math.sin(a) * 12); p.to.y = groundY(p.to.x, p.to.z); }
      if (p.flyT >= 0) {
        const u = THREE.MathUtils.clamp((t - p.flyT) / 2.5, 0, 1);
        p.m.position.lerpVectors(p.home, p.to, u); p.m.position.y += Math.sin(u * Math.PI) * 4;
        p.m.rotation.y = Math.atan2(p.to.x - p.home.x, p.to.z - p.home.z) - Math.PI / 2 + Math.PI; p.m.scale.set(1, 1 + 0.4 * Math.abs(Math.sin(t * 30)) * (1 - u), 1.6);
        if (u >= 1) { p.home.copy(p.to); p.flyT = -100; p.m.scale.set(1, 1, 1); }
      }
    }
    // penguins: a 22 s loop on the drift: waddle up (0–0.45), slide down (0.45–0.65), waddle back to the foot (0.65–1)
    for (const pg of penguins) {
      const u = ((t / 22) + pg.ph) % 1;
      const top = new THREE.Vector2(DRIFT.x0, DRIFT.z0), bottom = new THREE.Vector2(DRIFT.x1, DRIFT.z1);
      let px: number, pz: number, lie = 0, heading: number;
      if (u < 0.45) { const k = u / 0.45; px = THREE.MathUtils.lerp(bottom.x, top.x, k) + 1.2; pz = THREE.MathUtils.lerp(bottom.y, top.y, k) + 1.2; heading = Math.atan2(top.x - bottom.x, top.y - bottom.y); }
      else if (u < 0.65) { const k = (u - 0.45) / 0.2; const e = k * k; px = THREE.MathUtils.lerp(top.x, bottom.x, e); pz = THREE.MathUtils.lerp(top.y, bottom.y, e); lie = THREE.MathUtils.smoothstep(k, 0, 0.15) * (1 - THREE.MathUtils.smoothstep(k, 0.85, 1)); heading = Math.atan2(bottom.x - top.x, bottom.y - top.y); }
      else { const k = (u - 0.65) / 0.35; px = bottom.x + Math.sin(k * 6.28) * 1.4 + 1.2 * k; pz = bottom.y + 1.4 * k - 0.3; heading = k * 6.28; }
      pg.m.position.set(px, groundY(px, pz) + 0.02, pz);
      pg.m.rotation.y = heading; pg.m.rotation.x = 1.35 * lie; pg.m.rotation.z = lie === 0 ? 0.12 * Math.sin(t * 6 + pg.ph * 20) : 0;
    }
    // seals: roll over every ~10 s, slap a flipper every ~6 s, slide 4 m off if a kid comes within 5 m
    for (const s of seals) {
      if (t - s.rollT > 10 + s.x % 3) s.rollT = t;
      const ru = THREE.MathUtils.clamp((t - s.rollT) / 1.5, 0, 1); s.m.rotation.x = ru * Math.PI * 2 * (ru < 1 ? 1 : 0);
      if (t - s.slapT > 6 + s.z % 2) s.slapT = t;
      const su = t - s.slapT; s.m.scale.y = 1 + (su < 0.3 ? 0.15 * Math.sin(su / 0.3 * Math.PI) : 0);
      const d = Math.hypot(s.m.position.x - hero.x, s.m.position.z - hero.z);
      if (d < 5) { const a = Math.atan2(s.m.position.z - hero.z, s.m.position.x - hero.x); s.m.position.x += Math.cos(a) * 1.5 * dt; s.m.position.z += Math.sin(a) * 1.5 * dt; s.m.position.y = groundY(s.m.position.x, s.m.position.z); }
    }
    // breath puffs at night: every ~3 s per creature
    for (const p of puffs) {
      const age = (t + p.ph) % 3.2;
      const u = age / 1.2;
      const at = p.at();
      p.s.position.set(at.x, at.y + 0.1 + u * 0.35, at.z); const sc = 0.15 + u * 0.25; p.s.scale.set(sc, sc, 1);
      p.s.material.opacity = u < 1 ? 0.25 * (1 - u) * kf.stars : 0;
    }
  };
  return {
    group, update,
    poi: () => (poiSet ? poiV : null),
    herdCross: () => { herd.walkNow(); return 'the herd crosses the lake'; },
    hud: () => [`elk ${herd.state} ${herd.speedNow.toFixed(2)} m/s · hares 4 · goats 2 · owl · ptarmigans 5 · penguins 6 on the drift · seals 2`],
  };
}
