// Three goblins, to `enemies.md` §2.1 row 1 and the simplified §2.4 loop the plan asks for:
// idle at the camp → chase → windup 0.35 s with the cone telegraph → hit → recover 0.65 s → chase.
// A goblin dies inside Isabella's whirl or her Ground Pound and shatters into eight shards, then
// walks back out of the palisade's gap 6 s later, so the beat loops. Not the Phase 2 rig: a
// stand-in built from primitives at the roster's colours, height and hit radius.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
// The state machine itself is pure and lives next door, so `tests/unit/sandbox/goblins.test.ts` can
// run the loop at 60 Hz without a renderer; this file keeps the meshes and the side effects.
import { BRAKE_TO, gobStep, HIT_R, REACH, SPD, WINDUP, type GobState } from './goblin-step';

export { SPD, type GobState };

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const GOB = { base: '#7E3320', dark: '#5A2312', accent: '#E6DCC3', pupil: '#1C1A22', club: '#8B3A1E' };
// the shatter (enemies.md §2.5 "Death styles in 3D"): 8 shards, 2.0–5.5 m/s, gravity 3.75 m/s², drag
const SHARD_G = 3.75, SHARD_DRAG = 3.5, SHARD_FLIGHT = 0.5, SHARD_LIFE = 0.9;

export interface GobProbe { i: number; state: GobState; d: number; x: number; z: number }

export interface Goblins {
  group: THREE.Group;
  speed: { value: number };
  /** Every goblin alive inside `r` of `p` shatters. Returns how many. */
  strike: (p: THREE.Vector3, r: number) => number;
  sendAll: () => string;
  /** `fxT` is the hit-stop-exempt clock the debris runs on (T-31); `t`/`dt` are the held sim clock. */
  update: (t: number, dt: number, hero: THREE.Vector3, onHit: () => void, fxT: number) => void;
  poi: () => THREE.Vector3 | null;
  hud: () => string;
  /** What a stepped probe reads: every goblin's state and its distance to the hero, and the shards. */
  probe: () => { goblins: GobProbe[]; shardsLive: number; shardMaxY: number; felled: number };
}

function goblinBody(): { root: THREE.Group; spin: THREE.Group; head: THREE.Group; club: THREE.Group; legs: THREE.Group[]; arms: THREE.Group[] } {
  const mat = makeWorldMaterial({ roughness: 0.95 });
  const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const root = new THREE.Group(), spin = new THREE.Group();
  root.add(spin);
  // the hunched body, and the bone-tooth necklace
  spin.add(mesh(mergeGeos([
    xf(CY(0.14, 0.18, 0.42, 6, GOB.base), 0, 0.42),
    xf(CY(0.15, 0.15, 0.05, 6, GOB.dark), 0, 0.60),
    ...[0, 1, 2, 3, 4].map((i) => xf(colorize(new THREE.ConeGeometry(0.022, 0.07, 3), GOB.accent), Math.cos(i * 1.25 - 0.6) * 0.13, 0.575, Math.sin(i * 1.25 - 0.6) * 0.11 + 0.04)),
  ])));
  const head = new THREE.Group();
  head.position.set(0, 0.63, 0.06);
  head.add(mesh(mergeGeos([
    colorize(new THREE.SphereGeometry(0.19, 8, 6), GOB.base),
    ...[-1, 1].map((s) => colorize(new THREE.ConeGeometry(0.055, 0.16, 4), GOB.base).rotateZ(s * -1.25).scale(1, 1, 0.45).translate(s * 0.21, 0.03, -0.02)),
    ...[-1, 1].map((s) => B(0.05, 0.05, 0.02, GOB.accent).translate(s * 0.07, 0.04, 0.175)),
    ...[-1, 1].map((s) => B(0.022, 0.022, 0.02, GOB.pupil).translate(s * 0.07, 0.035, 0.187)),
    ...[0, 1, 2, 3].map((i) => B(0.024, 0.03, 0.02, GOB.accent).translate(-0.045 + i * 0.03, -0.06, 0.172)),
  ])));
  spin.add(head);
  const legs: THREE.Group[] = [], arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.09, 0.28, 0);
    leg.add(mesh(xf(CY(0.045, 0.04, 0.28, 5, GOB.dark), 0, -0.14)));
    spin.add(leg); legs.push(leg);
    const arm = new THREE.Group(); arm.position.set(s * 0.17, 0.56, 0);
    arm.add(mesh(xf(CY(0.04, 0.035, 0.24, 5, GOB.base), 0, -0.12)));
    spin.add(arm); arms.push(arm);
  }
  // the crooked rust club, in the right hand
  const club = new THREE.Group();
  club.position.set(0, -0.24, 0);
  club.add(mesh(mergeGeos([
    xf(CY(0.028, 0.032, 0.34, 5, GOB.club), 0, -0.17),
    xf(CY(0.032, 0.036, 0.24, 5, GOB.club), 0.05, -0.44, 0, 0, 0, 0.28),
    xf(colorize(new THREE.IcosahedronGeometry(0.085, 0), GOB.club), 0.11, -0.56),
  ])));
  arms[1]!.add(club);
  return { root, spin, head, club, legs, arms };
}

export function makeGoblins(gap: THREE.Vector3, groundY: (x: number, z: number) => number, home: [number, number][]): Goblins {
  const group = new THREE.Group();
  const r = rng(613);
  const speed = { value: SPD };
  // the shatter: eight real shards per goblin (IcosahedronGeometry 0.08), not points — additive
  // points in the goblin's own rust brown are invisible over sunlit grass
  const shardMat = makeWorldMaterial({ roughness: 0.9, transparent: true });
  const shards = new THREE.InstancedMesh(colorize(new THREE.IcosahedronGeometry(0.08, 0), GOB.base), shardMat, 24);
  shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shards.frustumCulled = false; shards.castShadow = true;
  group.add(shards);
  const shardM = new THREE.Matrix4(), shardQ = new THREE.Quaternion(), shardP = new THREE.Vector3(), shardS = new THREE.Vector3();
  // the fan is flat, not an umbrella: the old seed took y in [0.5, 1.5] before normalising, so every
  // shard went up together and read as a brown dome. Now the rise is 0.14–0.42 of a mostly
  // horizontal direction, at the bible's 2.0–5.5 m/s.
  const shardSeed = Array.from({ length: 24 }, () => {
    const a = r() * Math.PI * 2, up = 0.14 + r() * 0.28;
    return {
      v: new THREE.Vector3(Math.cos(a), up, Math.sin(a)).normalize().multiplyScalar(2.0 + r() * 3.5),
      spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      b: -100, gy: 0, o: new THREE.Vector3(),
    };
  });
  for (let i = 0; i < 24; i++) shards.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
  // per-instance colour, so the first 0.08 s of a shatter flashes gold (scores §4 change 7).
  // shardMat is not the emissive variant, so instanceColor here is a plain diffuse multiplier.
  const shardCol = new THREE.Color();
  for (let i = 0; i < 24; i++) shards.setColorAt(i, shardCol.setRGB(1, 1, 1));
  let shardNext = 0, shardsLive = 0, shardMaxY = 0;

  // the cone telegraph: a 70° half-angle sector 1.0 m long that fills from the goblin outward
  const coneGeo = new THREE.CircleGeometry(REACH, 16, -1.2217, 2.4435); // ±70°
  coneGeo.rotateX(-Math.PI / 2);

  // `state` starts at `idle` and must infer as the whole `GobState` union, not as the literal
  // (a `const` annotated with a union is still narrowed to its initialiser at the use site), so it
  // is spread in from a typed holder
  const start: { state: GobState } = { state: 'idle' };
  const mobs = home.map(([hx, hz], i) => {
    const body = goblinBody();
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(GOB.base).multiplyScalar(2.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    cone.position.y = 0.05; cone.layers.enable(BLOOM_LAYER); cone.visible = false;
    body.root.add(cone);
    group.add(body.root);
    return { ...body, cone, x: hx, z: hz, heading: r() * 6.28, ...start, st: 0, home: [hx, hz] as [number, number], phase: i * 0.7, deadAt: -100, flash: 0 };
  });

  const poiV = new THREE.Vector3(), heroAt = new THREE.Vector3();
  let poiSet = false, killed = 0;

  const shatter = (x: number, y: number, z: number, fxT: number): void => {
    for (let k = 0; k < 8; k++) {
      const s = shardSeed[shardNext % 24]!;
      s.b = fxT; s.gy = y; s.o.set(x, y + 0.35, z);
      shardNext++;
    }
  };

  const strike = (p: THREE.Vector3, rad: number): number => {
    let n = 0;
    for (const m of mobs) {
      if (m.state === 'dead') continue;
      if (Math.hypot(m.x - p.x, m.z - p.z) > rad + HIT_R) continue;
      m.state = 'dead'; m.st = 0; m.root.visible = false; m.cone.visible = false;
      m.deadAt = -1; // stamped on the next update, which owns the clock
      n++; killed++;
    }
    return n;
  };

  const update = (t: number, dt: number, hero: THREE.Vector3, onHit: () => void, fxT: number): void => {
    poiSet = false;
    heroAt.copy(hero);
    for (const m of mobs) {
      if (m.state === 'dead' && m.deadAt === -1) { m.deadAt = t; shatter(m.x, groundY(m.x, m.z), m.z, fxT); }
      const d = Math.hypot(hero.x - m.x, hero.z - m.z);
      // the transitions and the skid brake, from `goblin-step.ts`; the two side effects it can ask
      // for are the club's connect and the 6 s walk back out of the palisade's gap
      const step = gobStep(m.state, m.st, d, dt, speed.value, t - m.deadAt);
      m.state = step.state; m.st = step.st;
      for (const e of step.events) {
        if (e === 'hit') onHit();
        else { m.x = gap.x + (r() - 0.5); m.z = gap.z + (r() - 0.5); m.root.visible = true; }
      }
      // the low bobbing sprint: arms back, head forward, a 0.2 s skid into the stop
      const moving = step.moving;
      if (moving) {
        const want = Math.atan2(hero.x - m.x, hero.z - m.z);
        let diff = want - m.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        m.heading += diff * Math.min(1, dt * 7);
        m.x += Math.sin(m.heading) * speed.value * step.speedScale * dt;
        m.z += Math.cos(m.heading) * speed.value * step.speedScale * dt;
      } else if (m.state !== 'dead') {
        const want = Math.atan2(hero.x - m.x, hero.z - m.z);
        let diff = want - m.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        m.heading += diff * Math.min(1, dt * 5);
      }
      // goblins never overlap: a soft push at 0.5 m
      for (const o of mobs) {
        if (o === m || o.state === 'dead' || m.state === 'dead') continue;
        const dx = m.x - o.x, dz = m.z - o.z, dd = Math.hypot(dx, dz);
        if (dd < 0.5 && dd > 1e-3) { m.x = o.x + (dx / dd) * 0.5; m.z = o.z + (dz / dd) * 0.5; }
      }
      m.root.position.set(m.x, groundY(m.x, m.z), m.z);
      m.root.rotation.y = m.heading;
      const run = moving ? 1 : 0;
      const w = t * 11 + m.phase;
      m.spin.position.y = 0.02 * Math.abs(Math.sin(w)) * run - 0.05 * run;
      m.spin.rotation.x = 0.30 * run + 0.05 * Math.sin(t * 1.7 + m.phase) * (1 - run);
      m.head.rotation.x = -0.28 * run;
      m.legs[0]!.rotation.x = 0.85 * Math.sin(w) * run; m.legs[1]!.rotation.x = -0.85 * Math.sin(w) * run;
      m.arms[0]!.rotation.x = 1.0 * run + 0.25 * Math.sin(w) * run;
      // the windup lifts the club; the hit is one frame of it coming down
      const wu = m.state === 'windup' ? m.st / WINDUP : m.state === 'hit' ? 1 : 0;
      const swing = m.state === 'hit' ? 1 : 0;
      m.arms[1]!.rotation.x = 1.0 * run + 0.25 * Math.sin(w + 3) * run - 2.2 * wu * (1 - swing) + 0.9 * swing;
      // the telegraph: the cone fills from the goblin outward over the windup
      const showCone = m.state === 'windup';
      m.cone.visible = showCone;
      if (showCone) { const u = m.st / WINDUP; m.cone.scale.set(u, 1, u); (m.cone.material).opacity = 0.22 + 0.5 * u; }
      if (!poiSet && m.state !== 'dead') { poiV.set(m.x, 0.7, m.z); poiSet = true; }
    }
    // The shards (enemies.md §2.5): a flat fan at 2.0–5.5 m/s with drag, gravity 3.75 m/s²; they are
    // on the ground inside SHARD_FLIGHT and then lie there shrinking away, so a +0.8 s frame shows
    // debris in the grass instead of an umbrella over the kill. They run on the exempt clock (T-31).
    shardsLive = 0; shardMaxY = 0;
    for (let i = 0; i < 24; i++) {
      const s = shardSeed[i]!;
      const age = fxT - s.b;
      if (age < 0 || age > SHARD_LIFE) { shards.setMatrixAt(i, shardM.makeScale(0, 0, 0)); continue; }
      // drag damps the throw to an asymptote; gravity keeps pulling until the shard lies on the grass
      const trav = (1 - Math.exp(-SHARD_DRAG * age)) / SHARD_DRAG;
      const rest = s.gy + 0.06;                                          // where a shard comes to lie
      shardP.set(
        s.o.x + s.v.x * trav,
        Math.max(rest, s.o.y + s.v.y * trav - 0.5 * SHARD_G * age * age),
        s.o.z + s.v.z * trav,
      );
      shardQ.setFromAxisAngle(s.spin, Math.min(age, SHARD_FLIGHT + 0.1) * 11);
      // full size through the flight, then gone by SHARD_LIFE (nothing pops: an eased shrink)
      shardS.setScalar(1 - 0.85 * THREE.MathUtils.smoothstep(age, SHARD_FLIGHT * 0.6, SHARD_LIFE));
      shards.setMatrixAt(i, shardM.compose(shardP, shardQ, shardS));
      // the two-frame gold flash on a fresh shatter
      const flash = 1 - THREE.MathUtils.smoothstep(age, 0, 0.08);
      shards.setColorAt(i, shardCol.setRGB(1 + 1.6 * flash, 1 + 1.4 * flash, 1 + 0.7 * flash));
      shardsLive++;
      shardMaxY = Math.max(shardMaxY, shardP.y - s.gy);
    }
    shards.instanceMatrix.needsUpdate = true;
    if (shards.instanceColor) shards.instanceColor.needsUpdate = true;
  };

  return {
    group, speed, strike, update,
    sendAll: () => { for (const m of mobs) if (m.state === 'idle') { m.state = 'chase'; m.st = 0; } return 'they come'; },
    poi: () => (poiSet ? poiV : null),
    hud: () => `goblins ${mobs.map((m) => m.state).join('/')} · brake to ${BRAKE_TO} m, windup at ${REACH} m · shake 4/0.15 · spd ${speed.value.toFixed(3)} m/s · felled ${killed}`,
    probe: () => ({
      goblins: mobs.map((m, i) => ({ i, state: m.state, d: Math.hypot(heroAt.x - m.x, heroAt.z - m.z), x: m.x, z: m.z })),
      shardsLive, shardMaxY, felled: killed,
    }),
  };
}
