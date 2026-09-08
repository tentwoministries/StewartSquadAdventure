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
import { DRIFT, groundY, inside, LAKE, lakeD, POOL, terrainY } from './terrain';

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
  const parkAt = { x: LAKE.x - 18, z: LAKE.z - 8 };
  // T-54: the crossing S2 is composed for used to fire only from key 0, so a player who did not know
  // the key never saw it. The two scripted passes now leave on their own at 20 s and 90 s of scene
  // time (a demo number, not canon: `world-events-weather.md` §2.7.1 owes the herd a schedule), and
  // key 0 still forces the next one immediately.
  const CROSS_AT = [20, 90];
  let crossIdx = 0, lastHold = 0;
  const crossings: number[] = []; // when each pass actually left, for the probe
  const trail: THREE.Vector3[] = []; // the bull's recent positions; followers sample it
  const elkEar = elks.map((_, i) => flicker(30 + i, 3, 4));
  const followers = elks.slice(1).map((e, i) => ({ e, dist: 2.6 * (i + 1), x: LAKE.x - 18 - 2.6 * (i + 1), z: LAKE.z - 8 + (i % 2 ? 1.2 : -1.2), heading: 0, phase: r() * 6 }));
  for (const e of elks) addPuff(() => { e.head.getWorldPosition(tmp); return tmp.clone().add(new THREE.Vector3(0, 0, 0)); });
  // ---- snow hares ----------------------------------------------------------------------------------
  const hareGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.16, 1), F.hare).scale(1.3, 0.9, 1), 0, 0.15), xf(colorize(new THREE.IcosahedronGeometry(0.1, 1), F.hare), 0.18, 0.28), ...[-0.04, 0.04].map((z) => xf(B(0.04, 0.2, 0.03, F.hare), 0.16, 0.42, z)), ...[-0.04, 0.04].map((z) => xf(B(0.045, 0.05, 0.035, F.hareEar), 0.16, 0.53, z)), xf(colorize(new THREE.IcosahedronGeometry(0.04, 0), F.snow), -0.2, 0.18, 0), xf(B(0.02, 0.02, 0.03, '#1A1410'), 0.27, 0.3, 0.04), xf(B(0.02, 0.02, 0.03, '#1A1410'), 0.27, 0.3, -0.04)]);
  // T-53: nothing lives inside the ice-fall's pool. A home (or a ptarmigan's landing spot) that
  // falls on the sheet is marched out along its own bearing until the ground stands at or above the
  // sheet — the shore is found by marching, never by subtracting a radius (LESSONS, Density row 4).
  const poolClear = (x: number, z: number): [number, number] => {
    const dx = x - POOL.x, dz = z - POOL.z, d = Math.hypot(dx, dz);
    if (d > POOL.r + 1.2) return [x, z];
    const ux = d > 0.001 ? dx / d : 0, uz = d > 0.001 ? dz / d : 1;
    for (let m = POOL.r + 1.2; m < POOL.r + 5; m += 0.2) {
      const nx = POOL.x + ux * m, nz = POOL.z + uz * m;
      if (inside(nx, nz) && terrainY(nx, nz) >= POOL.y) return [nx, nz];
    }
    return [POOL.x + ux * (POOL.r + 1.5), POOL.z + uz * (POOL.r + 1.5)];
  };
  const hares: { m: THREE.Mesh; x: number; z: number; hx: number; hz: number; heading: number; hopT: number; hops: number; next: number }[] = [];
  for (const [x0, z0] of [[-6, 14], [12, -6], [-16, -14], [28, 12]] as [number, number][]) {
    const [x, z] = poolClear(x0, z0);
    const m = mesh(hareGeo); group.add(m); hares.push({ m, x, z, hx: x, hz: z, heading: r() * 6, hopT: -10, hops: 0, next: 2 + r() * 3 });
  }
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
  // (−9, −18) is the old (−4, −16) bird moved 5.4 m onto the ice-fall pool's south shore (T-53): the
  // pool had no life on its bank, and this is the nearest home to it on the plate.
  for (const [x0, z0] of [[6, 10], [8, 12], [-9, -18], [30, -4], [-14, 28]] as [number, number][]) {
    const [x, z] = poolClear(x0, z0);
    const m = mesh(ptGeo); m.position.set(x, groundY(x, z), z); m.rotation.y = r() * 6; group.add(m); pts.push({ m, home: m.position.clone(), flyT: -100, to: m.position.clone() });
  }
  // ---- the penguin colony: waddle up the drift, belly-slide down, waddle back --------------------------
  const penguinGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.22, 1), F.penguin).scale(1, 1.5, 0.9), 0, 0.36), xf(colorize(new THREE.IcosahedronGeometry(0.16, 1), F.penguinBelly).scale(0.8, 1.3, 0.5), 0, 0.33, 0.12), xf(colorize(new THREE.IcosahedronGeometry(0.14, 1), F.penguin), 0, 0.7), xf(colorize(new THREE.ConeGeometry(0.03, 0.1, 4), F.penguinBeak).rotateX(Math.PI / 2), 0, 0.68, 0.16), ...[-1, 1].map((s) => xf(B(0.04, 0.26, 0.1, F.penguin), s * 0.22, 0.36, 0, 0, 0, s * 0.25)), ...[-1, 1].map((s) => xf(B(0.1, 0.03, 0.14, F.penguinBeak), s * 0.08, 0.02, 0.04)), xf(B(0.02, 0.02, 0.02, '#1A1410'), 0.05, 0.74, 0.12), xf(B(0.02, 0.02, 0.02, '#1A1410'), -0.05, 0.74, 0.12)]);
  // the drift's axis in world xz: `dDown` runs top → foot, `dPerp` is the lane each bird keeps so the
  // six are not in one line. A lane stays within 1.0 m of the axis, inside the band terrainY replaces
  // wholly, so every lane's own profile falls as steadily as the axis's (T-51).
  const dTop = new THREE.Vector2(DRIFT.x0, DRIFT.z0), dFoot = new THREE.Vector2(DRIFT.x1, DRIFT.z1);
  const dVec = dFoot.clone().sub(dTop), dLen = dVec.length(), dDown = dVec.clone().divideScalar(dLen);
  const dPerp = new THREE.Vector2(-dDown.y, dDown.x);
  const headUp = Math.atan2(-dDown.x, -dDown.y), headDown = Math.atan2(dDown.x, dDown.y); // a penguin's front is local +z
  const MILL_R = 1.0;
  type Penguin = { m: THREE.Mesh; ph: number; lane: number; heading: number; phase: 'up' | 'top' | 'slide' | 'mill' };
  const penguins: Penguin[] = [];
  for (let i = 0; i < 6; i++) { const m = mesh(penguinGeo); m.rotation.order = 'YXZ'; group.add(m); penguins.push({ m, ph: i / 6, lane: (i - 2.5) * 0.4, heading: headUp, phase: 'up' }); }
  // ---- seals on the ice --------------------------------------------------------------------------------
  const sealGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.34, 1), F.seal).scale(2.2, 0.75, 1), 0, 0.26), xf(colorize(new THREE.IcosahedronGeometry(0.2, 1), F.seal), 0.7, 0.42), ...[-1, 1].map((s) => xf(B(0.3, 0.05, 0.16, F.seal), 0.15, 0.08, s * 0.32, 0, 0, 0)), xf(B(0.24, 0.05, 0.3, F.seal), -0.78, 0.12), xf(B(0.03, 0.03, 0.04, '#1A1410'), 0.85, 0.5, 0.08), xf(B(0.03, 0.03, 0.04, '#1A1410'), 0.85, 0.5, -0.08), ...[-0.06, 0.06].map((z) => xf(B(0.015, 0.015, 0.02, '#1A1410'), 0.88, 0.42, z))]);
  // the roll is about the seal's own long axis, so the geometry is centred on that axis (the body's
  // middle, y 0.26) and the mesh is lifted back by the same amount — rotate a part about its own
  // centre, then translate it (LESSONS, Rigs row 6); rolling about the origin at the ice would sweep
  // the body through the ground. Euler order YXZ makes rotation.x that long-axis roll (T-52).
  const SEAL_AXIS = 0.26;
  sealGeo.translate(0, -SEAL_AXIS, 0);
  type Seal = { m: THREE.Mesh; rollT: number; slapT: number; x: number; z: number; heading: number; want: number; crawl: number; roll: number; ph: number };
  const seals: Seal[] = [];
  // a seal turns, it does not flip: the flee bearing is *wanted*, and the drawn heading slews to it
  // at SEAL_TURN rad/s (0.05 rad a frame at 60 Hz), softening onto the last few degrees (Tier-0 rule 3)
  const SEAL_TURN = 3.0;
  ([[LAKE.x + 6, LAKE.z + 4], [LAKE.x - 3, LAKE.z + 9]] as [number, number][]).forEach(([x, z], i) => {
    const m = mesh(sealGeo); m.rotation.order = 'YXZ'; m.position.set(x, groundY(x, z) + SEAL_AXIS, z); m.rotation.y = 1.2 + i * 2.1; group.add(m);
    seals.push({ m, rollT: -3 - i * 5, slapT: -100, x, z, heading: 1.2 + i * 2.1, want: 1.2 + i * 2.1, crawl: 0, roll: 0, ph: i * 2.1 });
  });

  const poiV = new THREE.Vector3(); let poiSet = false;
  const heroV = new THREE.Vector3();
  let now = 0;
  const update = (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => {
    heroV.copy(hero); poiSet = false; now = t;
    // the bull wanders; the two scripted crossings leave on their own (T-54), key 0 forces the next
    // one; the herd walks around a standing kid
    // the herd holds its stand until the next scheduled pass leaves, so a crossing *is* the walk a
    // watcher sees. A one-waypoint route on the spot it already stands on is consumed by the very
    // next wander step (arrive → graze), so it only restarts the wander's own timer: no move, no
    // pop, and — unlike `park` — it does not reset the scripted route counter.
    if (crossIdx < CROSS_AT.length && t < CROSS_AT[crossIdx]! - 0.5 && herd.state !== 'walk' && t - lastHold > 4) { herd.setRoute([[herd.x, herd.z]]); lastHold = t; }
    if (crossIdx < CROSS_AT.length && t >= CROSS_AT[crossIdx]!) { crossIdx++; crossings.push(Math.round(t * 100) / 100); herd.walkNow(); }
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
      else if (t > h.next && h.hops === 0) {
        // a hare that never turns back is a random walk: the old one could hop anywhere on the plate
        // (T-53's unseen hopper). Past 5.5 m from home the next three hops aim back at it.
        const dh = Math.hypot(h.x - h.hx, h.z - h.hz);
        h.heading = dh > 5.5 ? Math.atan2(h.hz - h.z, h.hx - h.x) + (r() - 0.5) * 0.8 : r() * 6.28;
        h.hops = 3; h.hopT = t; h.next = t + 4 + r() * 5;
      }
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
      if (p.flyT < 0 && d < 4) {
        p.flyT = t; const a = Math.atan2(p.m.position.z - hero.z, p.m.position.x - hero.x) + (r() - 0.5);
        // the landing spot is a *new home*, so it takes the pool clearance too (T-53)
        const [lx, lz] = poolClear(p.home.x + Math.cos(a) * 12, p.home.z + Math.sin(a) * 12);
        p.to.set(lx, groundY(lx, lz), lz);
      }
      if (p.flyT >= 0) {
        const u = THREE.MathUtils.clamp((t - p.flyT) / 2.5, 0, 1);
        p.m.position.lerpVectors(p.home, p.to, u); p.m.position.y += Math.sin(u * Math.PI) * 4;
        p.m.rotation.y = Math.atan2(p.to.x - p.home.x, p.to.z - p.home.z) - Math.PI / 2 + Math.PI; p.m.scale.set(1, 1 + 0.4 * Math.abs(Math.sin(t * 30)) * (1 - u), 1.6);
        if (u >= 1) { p.home.copy(p.to); p.flyT = -100; p.m.scale.set(1, 1, 1); }
      }
    }
    // penguins: a 22 s loop on the drift — waddle *up* (0–0.38), flop at the top (0.38–0.45), belly-
    // slide *down* (0.45–0.65), mill at the foot (0.65–1). The lie-down is a pitch about the bird's
    // own side axis (Euler YXZ: rotation.x acts after the yaw), so the belly (local +z) turns to the
    // ground and the head (local +y) points down the slide however the drift is aimed (T-51). The
    // flop finishes before the slide starts, so the slide's height only ever falls.
    for (const pg of penguins) {
      const u = ((t / 22) + pg.ph) % 1;
      const ox = dPerp.x * pg.lane, oz = dPerp.y * pg.lane;
      let px: number, pz: number, want: number;
      if (u < 0.38) { const f = 1 - u / 0.38; px = dTop.x + dVec.x * f + ox; pz = dTop.y + dVec.y * f + oz; want = headUp; pg.phase = 'up'; }
      else if (u < 0.45) { px = dTop.x + ox; pz = dTop.y + oz; want = headDown; pg.phase = 'top'; }
      else if (u < 0.65) { const k = (u - 0.45) / 0.2, f = k * k; px = dTop.x + dVec.x * f + ox; pz = dTop.y + dVec.y * f + oz; want = headDown; pg.phase = 'slide'; }
      else {
        // a slow ring beside the foot that starts and ends *at* the foot, so the loop never jumps
        const th = ((u - 0.65) / 0.35) * 6.283;
        const cx = dFoot.x + dPerp.x * MILL_R + ox, cz = dFoot.y + dPerp.y * MILL_R + oz;
        px = cx + (-dPerp.x * Math.cos(th) + dDown.x * Math.sin(th)) * MILL_R;
        pz = cz + (-dPerp.y * Math.cos(th) + dDown.y * Math.sin(th)) * MILL_R;
        want = Math.atan2(dPerp.x * Math.sin(th) + dDown.x * Math.cos(th), dPerp.y * Math.sin(th) + dDown.y * Math.cos(th));
        pg.phase = 'mill';
      }
      const lie = THREE.MathUtils.smoothstep(u, 0.40, 0.45) * (1 - THREE.MathUtils.smoothstep(u, 0.65, 0.70));
      let diff = want - pg.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const nh = pg.heading + diff * Math.min(1, dt * 3.5);
      pg.heading = Math.atan2(Math.sin(nh), Math.cos(nh)); // wrapped to [−π, π] every step
      pg.m.position.set(px, groundY(px, pz) + 0.02 + 0.17 * lie, pz);
      pg.m.rotation.y = pg.heading;
      pg.m.rotation.x = lie * (Math.PI / 2) + (1 - lie) * 0.12;
      pg.m.rotation.z = (1 - lie) * 0.12 * (1 + 0.25 * Math.sin(t * 0.9)) * Math.sin(t * 6.1 + pg.ph * 20) + lie * 0.05 * Math.sin(t * 3.3 + pg.ph * 12);
    }
    // seals (T-52): a lazy half-roll onto the back about the body's own long axis — the seal is built
    // along +x with Euler order YXZ, so rotation.x turns about that axis and neither the heading nor
    // the pitch moves — 0.8 s over, 1.2 s held, 0.8 s back, eased. A kid inside 5 m makes it hump-
    // crawl away instead of sliding: a 3 Hz bunch of the body with the nose lifting on a second,
    // slower rate, facing its own velocity by the +x convention (rotation.y = 90° − bearing).
    for (const s of seals) {
      const d = Math.hypot(s.x - hero.x, s.z - hero.z);
      s.crawl += ((d < 5 ? 1 : 0) - s.crawl) * Math.min(1, dt * 4);
      if (d < 5) {
        let vx = s.x - hero.x, vz = s.z - hero.z; const vn = Math.hypot(vx, vz) || 1; vx /= vn; vz /= vn;
        // a fleeing animal never runs off a rim (world-events §2.7.1): at the ice's edge the flee
        // bends back toward the middle of the lake rather than climbing the bank
        const back = THREE.MathUtils.smoothstep(lakeD(s.x, s.z), 0.84, 0.97) * 1.8;
        if (back > 0) { const cx = LAKE.x - s.x, cz = LAKE.z - s.z, cn = Math.hypot(cx, cz) || 1; vx += (cx / cn) * back; vz += (cz / cn) * back; }
        const n2 = Math.hypot(vx, vz) || 1; vx /= n2; vz /= n2;
        s.x += vx * 1.5 * dt; s.z += vz * 1.5 * dt;
        s.want = Math.atan2(-vz, vx);
        s.rollT = t; // it does not roll while it is moving
      }
      // the turn itself: the short way round (wrapped to [−π, π]), rate-capped at SEAL_TURN rad/s and
      // easing onto the last ~12°, so a kid crossing 5 m makes the seal swing round over ~0.6 s
      let dh = s.want - s.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      if (dh !== 0) {
        const nh = s.heading + THREE.MathUtils.clamp(dh * Math.min(1, dt * 20), -SEAL_TURN * dt, SEAL_TURN * dt);
        s.heading = Math.atan2(Math.sin(nh), Math.cos(nh)); // wrapped to [−π, π] every step
      }
      if (t - s.rollT > 10 + Math.abs(s.x) % 3) s.rollT = t;
      const rt = t - s.rollT;
      s.roll = Math.PI * (THREE.MathUtils.smoothstep(rt, 0, 0.8) - THREE.MathUtils.smoothstep(rt, 2.0, 2.8)) * (1 - s.crawl);
      if (t - s.slapT > 6 + Math.abs(s.z) % 2) s.slapT = t;
      const su = t - s.slapT, pulse = Math.sin(t * 6.283 * 3 + s.ph);
      s.m.position.set(s.x, groundY(s.x, s.z) + SEAL_AXIS, s.z);
      s.m.rotation.y = s.heading; s.m.rotation.x = s.roll;
      s.m.rotation.z = (0.12 * Math.max(0, -pulse) + 0.025 * Math.sin(t * 1.13 + s.ph)) * s.crawl;
      s.m.scale.x = 1 + 0.098 * pulse * s.crawl;
      s.m.scale.z = 1 - 0.04 * pulse * s.crawl;
      s.m.scale.y = 1 + (su < 0.3 ? 0.15 * Math.sin((su / 0.3) * Math.PI) : 0) * (1 - s.crawl);
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
  // The stepped-probe window (LESSONS §0 row 8: a mechanic is not built until a probe has seen every
  // state). Positions, phases and local-axis world vectors for the penguins and the seals, the herd's
  // state and its schedule, the homes against the pool, and terrain sampling — read from the scene
  // itself, never from the HUD's DOM text.
  const qq = new THREE.Quaternion(), vv = new THREE.Vector3();
  const n3 = (v: THREE.Vector3) => ({ x: Number(v.x.toFixed(4)), y: Number(v.y.toFixed(4)), z: Number(v.z.toFixed(4)) });
  const axis = (o: THREE.Object3D, ax: number, ay: number, az: number) => { o.getWorldQuaternion(qq); return n3(vv.set(ax, ay, az).applyQuaternion(qq)); };
  const dPool = (x: number, z: number) => Number(Math.hypot(x - POOL.x, z - POOL.z).toFixed(2));
  (window as unknown as Record<string, unknown>)['ssProbe'] = {
    terrainY: (x: number, z: number) => terrainY(x, z),
    groundY: (x: number, z: number) => groundY(x, z),
    lakeD: (x: number, z: number) => lakeD(x, z),
    inside: (x: number, z: number) => inside(x, z),
    drift: () => ({ top: [DRIFT.x0, DRIFT.z0], foot: [DRIFT.x1, DRIFT.z1], len: dLen, down: [dDown.x, dDown.y], perp: [dPerp.x, dPerp.y], lanes: penguins.map((p) => p.lane) }),
    pool: () => ({ x: POOL.x, z: POOL.z, r: POOL.r, y: POOL.y }),
    penguins: () => penguins.map((p) => ({ phase: p.phase, x: Number(p.m.position.x.toFixed(3)), y: Number(p.m.position.y.toFixed(4)), z: Number(p.m.position.z.toFixed(3)), heading: Number(p.m.rotation.y.toFixed(4)), pitch: Number(p.m.rotation.x.toFixed(4)), belly: axis(p.m, 0, 0, 1), head: axis(p.m, 0, 1, 0) })),
    seals: () => seals.map((s) => ({ x: Number(s.x.toFixed(3)), y: Number(s.m.position.y.toFixed(3)), z: Number(s.z.toFixed(3)), roll: Number(s.roll.toFixed(4)), crawl: Number(s.crawl.toFixed(3)), heading: Number(s.heading.toFixed(4)), want: Number(s.want.toFixed(4)), scaleX: Number(s.m.scale.x.toFixed(4)), long: axis(s.m, 1, 0, 0), lakeD: Number(lakeD(s.x, s.z).toFixed(3)), inside: inside(s.x, s.z) })),
    herd: () => ({ state: herd.state, x: Number(herd.x.toFixed(2)), z: Number(herd.z.toFixed(2)), speed: Number(herd.speedNow.toFixed(3)), park: parkAt, dPark: Number(Math.hypot(herd.x - parkAt.x, herd.z - parkAt.z).toFixed(2)), crossIdx, crossings: [...crossings], schedule: [...CROSS_AT], bull: n3(elks[0]!.root.position) }),
    hares: () => hares.map((h) => ({ x: Number(h.x.toFixed(2)), z: Number(h.z.toFixed(2)), home: [h.hx, h.hz], dHome: Number(Math.hypot(h.x - h.hx, h.z - h.hz).toFixed(2)), dPool: dPool(h.x, h.z), inside: inside(h.x, h.z) })),
    ptarmigans: () => pts.map((p) => ({ x: Number(p.m.position.x.toFixed(2)), z: Number(p.m.position.z.toFixed(2)), home: [Number(p.home.x.toFixed(2)), Number(p.home.z.toFixed(2))], dPool: dPool(p.home.x, p.home.z), flying: p.flyT >= 0 })),
  };
  return {
    group, update,
    poi: () => (poiSet ? poiV : null),
    herdCross: () => { if (crossIdx < CROSS_AT.length) crossIdx++; crossings.push(Math.round(now * 100) / 100); herd.walkNow(); return 'the herd crosses the lake'; },
    hud: () => [`elk ${herd.state} ${herd.speedNow.toFixed(2)} m/s · crossings ${crossIdx}/${CROSS_AT.length}${crossIdx < CROSS_AT.length ? `, next at ${CROSS_AT[crossIdx]} s` : ''} · hares 4 · goats 2 · owl · ptarmigans 5 · penguins 6 on the drift · seals 2`],
  };
}
