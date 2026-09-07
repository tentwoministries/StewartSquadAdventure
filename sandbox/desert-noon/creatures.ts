// Desert creatures (PHASE_0.75_ANIMALS_BRAINSTORM.md §3): the Nomad's camel (sits, chews, blinks,
// ear flicks; key 0 stands it up in the three-stage camel unfold), lizards that dart and freeze
// (one does push-ups on the hot rock at noon), beetles rolling their pebbles, three vultures
// circling the pyramid with shadow decals crossing the sand, a tortoise at the oasis, a fennec
// fox at dusk whose ears turn to the nearest kid, two tumbleweeds, and the dust devil.
import * as THREE from 'three';
import { DESERT as D } from '../_shared/biomes';
import { flicker, makeWander, type Wander } from '../_shared/creature';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePoints } from '../_shared/particles';
import { rng } from '../_shared/rng';
import type { Keyframe } from '../_shared/style';
import { groundY, NOMAD, OASIS, PYRAMID } from './terrain';

const mat = makeWorldMaterial({ roughness: 0.95 });
const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Creatures {
  group: THREE.Group;
  update: (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => void;
  poi: () => THREE.Vector3 | null;
  camelStand: () => string;
  hud: () => string[];
}

export function makeCreatures(hotRock: THREE.Vector3): Creatures {
  const group = new THREE.Group();
  const r = rng(13);
  // ---- the camel: built facing +x, sitting by the tether post ----------------------------------
  const camel = node(NOMAD.x + 3.6, 0, NOMAD.z + 1.6);
  const cBody = node(0, 1.05, 0);
  cBody.add(mesh(mergeGeos([
    xf(CY(0.42, 0.46, 1.5, 7, D.camel).rotateZ(Math.PI / 2), 0, 0), xf(colorize(new THREE.IcosahedronGeometry(0.42, 1), D.camelDark), -0.05, 0.45, 0),
    xf(B(0.35, 0.08, 0.5, D.camelDark), -0.9, -0.1, 0), xf(CY(0.03, 0.04, 0.5, 4, D.camelDark).rotateZ(0.5), -0.95, -0.35, 0),
  ])));
  const cNeck = node(0.7, 0.25, 0);
  cNeck.add(mesh(xf(CY(0.14, 0.2, 1.0, 6, D.camel), 0.1, 0.45, 0, 0, 0, -0.35)));
  const cHead = node(0.35, 0.9, 0);
  cHead.add(mesh(mergeGeos([xf(B(0.5, 0.26, 0.24, D.camel), 0.15, 0), xf(B(0.2, 0.18, 0.2, D.camelDark), 0.45, -0.06), xf(B(0.04, 0.04, 0.05, '#1A1410'), 0.28, 0.1, 0.12), xf(B(0.04, 0.04, 0.05, '#1A1410'), 0.28, 0.1, -0.12)])));
  const cJaw = mesh(xf(B(0.3, 0.08, 0.2, D.camelDark), 0.32, -0.15, 0)); cHead.add(cJaw);
  const cEars: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const e = mesh(xf(B(0.06, 0.12, 0.05, D.camel), 0, 0.06, 0)); e.position.set(0.05, 0.14, s * 0.11); e.rotation.x = s * 0.4; cHead.add(e); cEars.push(e); }
  const cLids: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const l = mesh(xf(B(0.05, 0.03, 0.06, D.camel), 0, 0, 0)); l.position.set(0.28, 0.13, s * 0.12); cHead.add(l); cLids.push(l); }
  cNeck.add(cHead); cBody.add(cNeck);
  const cLegs: { hip: THREE.Group; knee: THREE.Group; front: boolean }[] = [];
  for (const [x, z] of [[0.55, 0.22], [0.55, -0.22], [-0.55, 0.22], [-0.55, -0.22]] as [number, number][]) {
    const hip = node(x, -0.3, z); hip.add(mesh(xf(CY(0.07, 0.06, 0.5, 5, D.camel), 0, -0.25)));
    const knee = node(0, -0.5, 0); knee.add(mesh(xf(CY(0.055, 0.05, 0.5, 5, D.camel), 0, -0.25))); knee.add(mesh(xf(B(0.14, 0.08, 0.14, D.camelDark), 0, -0.5)));
    hip.add(knee); cBody.add(hip); cLegs.push({ hip, knee, front: x > 0 });
  }
  camel.add(cBody); group.add(camel);
  camel.rotation.y = ((90 - 210) * Math.PI) / 180;
  let camelUp = 0, camelTarget = 0; // 0 sitting → 1 standing, eased in three stages
  const camelEar = flicker(3, 2.5, 3);
  // ---- lizards: dart-and-freeze near the rocks; one owns the hot rock -------------------------
  const lizardGeo = mergeGeos([
    xf(B(0.3, 0.07, 0.1, D.lizard), 0, 0.05), xf(colorize(new THREE.ConeGeometry(0.045, 0.32, 4), D.lizard).rotateZ(Math.PI / 2), -0.3, 0.05),
    xf(B(0.12, 0.07, 0.09, D.lizard), 0.2, 0.05), xf(B(0.03, 0.03, 0.03, '#1A1410'), 0.25, 0.09, 0.04), xf(B(0.03, 0.03, 0.03, '#1A1410'), 0.25, 0.09, -0.04),
    ...([[0.1, 0.08], [0.1, -0.08], [-0.1, 0.08], [-0.1, -0.08]] as [number, number][]).map(([x, z]) => xf(B(0.05, 0.03, 0.1, D.lizard), x, 0.02, z)),
    ...[0, 1, 2, 3].map((i) => xf(B(0.05, 0.02, 0.06, '#8A6A2A'), -0.1 + i * 0.09, 0.09, 0)),
  ]);
  const lizards: { m: THREE.Mesh; w: Wander; pushT: number }[] = [];
  const lizardSpots: [number, number][] = [[7.5, -3.6], [-12, -12], [12, -6], [-16, 4], [20, 2], [-26, -8]];
  lizardSpots.forEach(([x, z], i) => {
    const m = mesh(lizardGeo); group.add(m);
    const w = makeWander({ patch: { x, z, r: 2.5, avoid: [] }, speed: 3.2, seed: 40 + i, turnRate: 9, graze: [2.5, 6], look: [0.5, 1], lookChance: 0.5, minLeg: 0.8 });
    w.park(x, z, r() * 360);
    lizards.push({ m, w, pushT: -100 });
  });
  const hotLizard = mesh(lizardGeo); group.add(hotLizard);
  hotLizard.position.copy(hotRock); hotLizard.rotation.y = 0.8;
  // ---- beetles rolling pebbles -----------------------------------------------------------------
  const beetleGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.09, 1), D.beetle).scale(1.3, 0.8, 1), 0, 0.07), xf(B(0.08, 0.05, 0.08, '#0E5A58'), 0.12, 0.05), ...[-0.06, 0, 0.06].map((x) => xf(B(0.02, 0.02, 0.22, '#0E5A58'), x, 0.03, 0))]);
  const ballGeo = colorize(new THREE.IcosahedronGeometry(0.11, 1), D.sandShadow);
  const beetles: { m: THREE.Mesh; ball: THREE.Mesh; w: Wander }[] = [];
  [[-6, -14], [16, 8], [-18, 22]].forEach(([x, z], i) => {
    const m = mesh(beetleGeo), ball = mesh(ballGeo); group.add(m, ball);
    const w = makeWander({ patch: { x: x!, z: z!, r: 4, avoid: [] }, speed: 0.25, seed: 60 + i, turnRate: 1.2, graze: [1, 3], lookChance: 0, minLeg: 1.5 });
    w.park(x!, z!, r() * 360);
    beetles.push({ m, ball, w });
  });
  // ---- vultures over the pyramid, with shadow decals --------------------------------------------
  const vultureGeo = mergeGeos([xf(B(0.5, 0.12, 0.16, D.vulture), 0, 0), xf(B(0.16, 0.08, 0.1, '#C8A080'), 0.3, 0.02), xf(B(0.35, 0.03, 1.4, D.vulture), -0.05, 0.04, 0.75, 0, 0.18), xf(B(0.35, 0.03, 1.4, D.vulture), -0.05, 0.04, -0.75, 0, -0.18)]);
  const vultures: { m: THREE.Mesh; shadow: THREE.Mesh; ph: number; rad: number; h: number }[] = [];
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const m = mesh(vultureGeo); const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 8), shadowMat); shadow.rotation.x = -Math.PI / 2;
    group.add(m, shadow); vultures.push({ m, shadow, ph: i * 2.1, rad: 12 + i * 3, h: 24 + i * 3 });
  }
  // ---- the tortoise at the oasis -------------------------------------------------------------
  const tortoise = mesh(mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.28, 1), '#5A6A3A').scale(1.25, 0.6, 1), 0, 0.2), xf(B(0.18, 0.1, 0.12, '#8A9A5A'), 0.34, 0.14), ...[[0.18, 0.2], [0.18, -0.2], [-0.18, 0.2], [-0.18, -0.2]].map(([x, z]) => xf(B(0.1, 0.1, 0.1, '#8A9A5A'), x, 0.05, z))]));
  group.add(tortoise);
  const tortW = makeWander({ patch: { x: OASIS.x + 9.5, z: OASIS.z + 2, r: 2.5, avoid: [] }, speed: 0.15, seed: 71, turnRate: 0.6, graze: [6, 12], lookChance: 0.2, minLeg: 1 });
  tortW.park(OASIS.x + 10, OASIS.z + 2, 250);
  // ---- the fennec fox at dusk and night: sits and watches, ears turn to sounds ------------------
  const fennec = node(9, 0, -11);
  fennec.add(mesh(mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.2, 1), '#E8D0A8').scale(1, 1.2, 0.9), 0, 0.28), xf(B(0.22, 0.16, 0.18, '#E8D0A8'), 0.02, 0.55, 0.06), xf(B(0.08, 0.06, 0.08, '#2A2418'), 0.02, 0.5, 0.2), xf(colorize(new THREE.ConeGeometry(0.06, 0.5, 5), '#E8D0A8').rotateX(1.2), -0.05, 0.12, -0.3)])));
  const fEars: THREE.Group[] = [];
  for (const s of [-1, 1]) { const e = node(s * 0.09, 0.64, 0.02); e.add(mesh(xf(colorize(new THREE.ConeGeometry(0.07, 0.24, 4), '#E8D0A8'), 0, 0.12))); e.add(mesh(xf(colorize(new THREE.ConeGeometry(0.04, 0.16, 4), '#C8A0A0'), 0, 0.1, 0.02))); fennec.add(e); fEars.push(e); }
  fennec.rotation.y = 0.9; group.add(fennec);
  // ---- tumbleweeds --------------------------------------------------------------------------------
  const tumbleGeo = mergeGeos(Array.from({ length: 16 }, (_, i) => xf(B(0.02, 0.02, 1.0, D.tumbleweed), 0, 0, 0, i * 0.39, i * 0.7, i * 1.1)));
  const tumbles: { m: THREE.Mesh; x0: number; z: number; ph: number }[] = [];
  for (let i = 0; i < 2; i++) { const m = mesh(tumbleGeo); group.add(m); tumbles.push({ m, x0: -50 + i * 25, z: -30 + i * 14, ph: i * 2 }); }
  // ---- the dust devil: an 80-point spiral that wanders ----------------------------------------
  const devil = makePoints(80, D.ochre, 5, 1.3);
  group.add(devil.pts);
  let devilX = -30, devilZ = 34, devilA = 0.4;

  const poiV = new THREE.Vector3();
  const heroV = new THREE.Vector3();
  const update = (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => {
    heroV.copy(hero);
    // camel: sit/stand eased in stages (rear first, then front), chew, blink, ear flick
    camelUp += (camelTarget - camelUp) * Math.min(1, dt * 1.4);
    const rear = THREE.MathUtils.smoothstep(camelUp, 0, 0.55), front = THREE.MathUtils.smoothstep(camelUp, 0.45, 1);
    cLegs.forEach((l) => { const u = l.front ? front : rear; l.hip.rotation.z = (l.front ? -1.5 : 1.35) * (1 - u); l.knee.rotation.z = (l.front ? 2.6 : -2.5) * (1 - u); });
    cBody.position.y = 0.55 + 0.5 * (0.5 * rear + 0.5 * front) + 0.01 * Math.sin(t * 1.1);
    cBody.rotation.z = 0.12 * (rear - front);
    cJaw.rotation.z = 0.12 + 0.1 * Math.sin(t * 3.1) * (0.5 + 0.5 * Math.sin(t * 0.23));
    const ef = camelEar(t); cEars.forEach((e, i) => { e.rotation.z = ef * 0.5 * (i === 0 ? 1 : 0.4); });
    const blink = ((t + 1.3) % 5.5) > 5.3 ? 1 : 0; cLids.forEach((l) => { l.scale.y = 1 + blink * 2.5; });
    cNeck.rotation.z = -0.1 + 0.06 * Math.sin(t * 0.5) - 0.25 * (1 - camelUp);
    camel.position.y = groundY(camel.position.x, camel.position.z);
    // lizards: dart (fast, short) and freeze; scatter from a kid inside 3 m
    for (const lz of lizards) {
      const d = Math.hypot(lz.w.x - hero.x, lz.w.z - hero.z);
      if (d < 3 && lz.w.state !== 'walk') { const away = Math.atan2(lz.w.z - hero.z, lz.w.x - hero.x); lz.w.setRoute([[lz.w.x + Math.cos(away) * 2.5, lz.w.z + Math.sin(away) * 2.5]]); }
      lz.w.update(dt);
      lz.m.position.set(lz.w.x, groundY(lz.w.x, lz.w.z) + 0.02, lz.w.z); lz.m.rotation.y = lz.w.rotY();
      lz.m.scale.set(1, 1 + 0.15 * Math.sin(t * 9) * lz.w.stride, 1);
    }
    // the hot-rock lizard: push-ups at noon (2 Hz for 2 s every 8 s), a freeze otherwise
    const noon = kf.key.elev > 45 ? 1 : 0;
    const pu = ((t % 8) < 2 ? Math.abs(Math.sin(t * 6.283)) : 0) * noon;
    hotLizard.position.y = hotRock.y + 0.06 * pu; hotLizard.rotation.x = -0.12 * pu;
    // beetles: the ball rolls ahead of the beetle
    for (const bt of beetles) {
      bt.w.update(dt);
      bt.m.position.set(bt.w.x, groundY(bt.w.x, bt.w.z) + 0.02, bt.w.z); bt.m.rotation.y = bt.w.rotY();
      const bx = bt.w.x + Math.cos(bt.w.heading) * 0.24, bz = bt.w.z - Math.sin(bt.w.heading) * 0.24;
      bt.ball.position.set(bx, groundY(bx, bz) + 0.1, bz); bt.ball.rotation.z -= bt.w.speedNow * dt / 0.11;
    }
    // vultures circle the pyramid at 24–30 m; the shadow decal crosses the sand under each
    for (const v of vultures) {
      const a = t * 0.11 + v.ph;
      const x = PYRAMID.x + Math.cos(a) * v.rad, z = PYRAMID.z + Math.sin(a) * v.rad;
      v.m.position.set(x, v.h + Math.sin(t * 0.3 + v.ph) * 1.5, z); v.m.rotation.y = -a - Math.PI / 2 + 0.25; v.m.rotation.z = 0.12 + 0.05 * Math.sin(t * 0.7 + v.ph);
      v.shadow.position.set(x - kf.key.elev * 0.02 * 3, groundY(x, z) + 0.03, z); v.shadow.visible = kf.key.elev > 10;
    }
    // the tortoise
    tortW.update(dt); tortoise.position.set(tortW.x, groundY(tortW.x, tortW.z), tortW.z); tortoise.rotation.y = tortW.rotY();
    // the fennec: only from dusk; ears turn to the nearest kid
    fennec.visible = kf.stars > 0.2;
    const fa = Math.atan2(hero.x - fennec.position.x, hero.z - fennec.position.z) - fennec.rotation.y;
    fEars.forEach((e) => { e.rotation.y += (THREE.MathUtils.clamp(Math.atan2(Math.sin(fa), Math.cos(fa)), -0.9, 0.9) - e.rotation.y) * Math.min(1, dt * 3); });
    fennec.position.y = groundY(fennec.position.x, fennec.position.z);
    // tumbleweeds roll east at 1.2 m/s with a bounce, wrapping across the plate
    for (const tw of tumbles) {
      const x = ((tw.x0 + t * 1.2 + 56) % 112) - 56;
      tw.m.position.set(x, groundY(x, tw.z) + 0.5 + 0.25 * Math.abs(Math.sin(t * 2.3 + tw.ph)), tw.z);
      tw.m.rotation.z = -t * 2.4 + tw.ph; tw.m.rotation.x = 0.3 * Math.sin(t * 0.7 + tw.ph);
    }
    // the dust devil wanders at 1.5 m/s and turns slowly; spiral radius 0.6–1.2 m rising 1 m/s
    devilA += (Math.sin(t * 0.21) * 0.5) * dt;
    devilX += Math.cos(devilA) * 1.5 * dt; devilZ += Math.sin(devilA) * 1.5 * dt;
    if (devilX > 50) devilX = -50; if (devilX < -52) devilX = 50; if (devilZ > 46) devilZ = -44; if (devilZ < -46) devilZ = 44;
    const dy = groundY(devilX, devilZ);
    for (let i = 0; i < 80; i++) {
      const u = i / 80, age = (t * 1.0 + u * 9) % 9, hgt = age * 1.0;
      const rad = 0.6 + 0.6 * (hgt / 9) + 0.2 * Math.sin(age * 5);
      const a = age * 6 + u * 12;
      devil.pos[i * 3] = devilX + Math.cos(a) * rad; devil.pos[i * 3 + 1] = dy + hgt; devil.pos[i * 3 + 2] = devilZ + Math.sin(a) * rad;
      devil.alpha[i] = (1 - hgt / 9) * 0.5 * kf.pollen;
    }
    devil.commit();
  };
  return {
    group, update,
    poi: () => {
      // the nearest lizard to the hero is what Noah looks at; the hot-rock lizard if it is doing push-ups
      let best: THREE.Vector3 | null = null, bd = 9;
      for (const lz of lizards) { const d = Math.hypot(lz.w.x - heroV.x, lz.w.z - heroV.z); if (d < bd) { bd = d; best = poiV.set(lz.w.x, groundY(lz.w.x, lz.w.z) + 0.1, lz.w.z); } }
      return best;
    },
    camelStand: () => { camelTarget = camelTarget > 0.5 ? 0 : 1; return camelTarget > 0.5 ? 'camel: up (rear first)' : 'camel: sits'; },
    hud: () => [`camel ${camelUp.toFixed(2)} · dust devil (${devilX.toFixed(0)}, ${devilZ.toFixed(0)}) · vultures circle the pyramid at 24–30 m`],
  };
}
