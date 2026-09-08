// CS-04, the flight (cutscenes.md §2.6, npcs.md §2.3.4): the path, the schedule, the aircraft with
// its propeller at flight speed and a blur disc, Grandpa Ed in the rear cockpit with the scarf that
// never stops (npcs.md §2.1.4's six frequencies), the bench the four kids ride on, the cloud layer
// the plane climbs through, and the two bounces on landing. Speeds and altitudes: npcs.md §2.2.4.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePlane } from '../_shared/plane';

import { rng } from '../_shared/rng';
import { C } from '../_shared/style';
import { bounceY, CRUISE_END, CRUISE_SPEED, distanceAt, FLIGHT_LEN, legAt, MAX_BANK_DEG, PATH_LENGTH, speedAt, TOUCHDOWN } from './schedule';

export { FLIGHT_LEN, TOUCHDOWN } from './schedule';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const ED = { base: '#8B5A2B', dark: '#3B2A1A', collar: '#EDE3CF', green: '#228B22', scarf: '#D84830', scarfEnd: '#A83828', goggle: '#7A4018', lens: '#B8D4E0', skin: '#F2CBA7' };

/**
 * The circuit, as waypoints every 8 m along an analytic track: the strip (z = 20, `terrain.ts`
 * STRIP x −12…40, ground 0.15 m), a straight roll east, then one left-hand circuit of the island —
 * two 180° turns of radius 34 m with 14 m clothoid easements at each end, joined by a 16 m leg
 * across the north rim — and back onto the strip heading east for the landing. Sizes: the schedule
 * flies 329.0 m (`schedule.ts` PATH_LENGTH) and `curve.getLength()` of these points is 329.05 m.
 *
 * Radius 34 m at 14 m/s is a 30° coordinated bank, five degrees inside §2.2.4's 35° limit for the
 * repaired plane, and the easements mean the bank ramps rather than snaps. A *full* circuit needs a
 * net 360° of turning, which is why the flight is 28.5 s and not `story-beats.md` §2.10's 14–18 s
 * (T-37: at the bible's 14 m/s the two are simply not both satisfiable).
 *
 * Altitudes: rotate at 12 m/s, climb at about 4 m/s (§2.2.4) to 28.8 m over the north rim — through
 * the +24 m cloud layer on the way up and again on the way down — then the circuit at 20 m
 * (§2.3.4), then 3.4 m/s down the final with a flare, touching at (21, 20).
 */
const PATH: [number, number, number][] = [
  [-9.81, 0.17, 20.02], [-0.81, 0.24, 20.01], [8.19, 0.32, 20.01],            // the roll, rotate at 18 m
  [12.19, 1.51, 20.01], [19.19, 3.6, 19.93], [26.13, 5.7, 19.14],             // rotate and climb, turning left
  [33.47, 8.02, 16.72], [40.04, 10.34, 12.71], [45.57, 12.66, 7.31],
  [49.72, 14.98, 0.8], [52.31, 17.3, -6.48], [53.18, 19.56, -14.13],          // through the cloud layer
  [52.31, 21.7, -21.81], [49.72, 23.83, -29.08], [45.56, 25.87, -35.59],
  [40.05, 26.8, -40.98], [33.46, 27.73, -45], [26.13, 28.33, -47.42],
  [19.18, 28.56, -48.21], [12.18, 28.8, -48.28],                              // the top, over the north rim
  [4.18, 27.9, -48.27], [-3.82, 27, -48.27],                                  // the leg across the rim
  [-10.82, 25.8, -48.19], [-17.77, 24.6, -47.4], [-25.08, 23.31, -44.98],     // down through the cloud layer
  [-31.68, 22.32, -40.96], [-37.2, 21.33, -35.56], [-41.35, 20.34, -29.05],
  [-43.93, 20.15, -21.79], [-44.81, 20.09, -14.12], [-43.93, 20.04, -6.45],   // the circuit, 20 m up the west side
  [-41.35, 19.16, 0.83], [-37.2, 16.9, 7.32], [-31.68, 14.64, 12.72],
  [-25.08, 12.39, 16.74], [-17.77, 10.21, 19.16], [-10.82, 8.24, 19.95],      // rolling out onto final
  [-3.82, 6.28, 20.02], [4.46, 3.7, 20.01], [12.72, 1.35, 20.01],             // the final, 3.4 m/s down
  [16.85, 0.52, 20.0],                                                        // the flare: the gradient halves twice
  [20.98, 0.2, 20], [29.74, 0.2, 19.99], [38.5, 0.2, 19.99],                  // touchdown, roll-out, park
];
/** Arc-length landmarks along PATH, for the HUD's beat name (metres). */
const MARK = { rotate: 18, cloudUp: 86, top: 130, rim: 152, cloudDown: 196 };

// The bank comes from the path's curvature at the scheduled speed — a coordinated turn,
// `atan(v²κ/g)` — not from the per-frame yaw delta, which made it a function of the frame rate and
// pinned it at the clamp for 39 % of the first pass (VERDICT §3.3). It is then eased (bank lag 4/s,
// npcs.md §2.2.3) and rate-limited, so it ramps in and out of every turn and levels on the straight
// final. YAW_GAIN 1.0 is the true coordinated bank; the clamp is §2.2.4's 35° for `repaired`.
const BANK_LOOK = 3.0;       // metres either side of the plane the curvature is measured over
const YAW_GAIN = 1.0;
const BANK_LAG = 4.0;        // per second (npcs.md §2.2.3)
const ROLL_RATE = 1.0;       // rad/s ceiling on the roll, below the 1.2 rad/s steering limit
const MAX_BANK = (MAX_BANK_DEG * Math.PI) / 180;
/** The cloud layer sits at +24 m over the hub (npcs.md §2.2.4), 21.5–26.5 m thick. */
const CLOUD = { lo: 21.5, hi: 26.5 };
/** The one stall-drop of the flight (npcs.md §2.2.3): 1.2 s, the nose dips, −4 m, the four grab on. */
const STALL = { at: 7.0, dur: 1.2, drop: 4 };

export interface Flight {
  group: THREE.Group;
  plane: THREE.Group;
  /** Seat world matrices for the four kids (seat.0..3) and Ed's pilot socket. */
  seat: (i: number, out: THREE.Object3D) => void;
  chase: (out: THREE.Object3D, kind: 'CH' | 'WG' | 'ED') => void;
  /** Advance to `t` seconds of the cutscene clock; returns the beat name. */
  set: (t: number, dt: number) => string;
  /** 0 while clear, 1 in the middle of the cloud layer: the streaming curtain's white-out. */
  whiteOut: number;
  /** 0..1 through the stall-drop: all four kids grab the rim. */
  stall: number;
  pos: THREE.Vector3;
  /** The path's unit tangent at `pos`: where the nose is pointing (for the kids' look hook). */
  fwd: THREE.Vector3;
  /** Read by the stepped probes (scripts/probes/flight-*.cjs), so no check parses HUD text. */
  speed: number;
  distance: number;
  bankDeg: number;
  bounce: number;
  /** `curve.getLength()`: the path the schedule is sized against. */
  length: number;
  hud: () => string;
}

export function makeFlight(): Flight {
  const group = new THREE.Group();
  const mat = makeWorldMaterial({ roughness: 0.85 });
  const r = rng(509);
  // Working Rule 2, re-verified in three r185 before use (quoted in LOG.md):
  //   CatmullRomCurve3(points, closed = false, curveType = 'centripetal', tension = 0.5)
  //     src/extras/curves/CatmullRomCurve3.js:120
  //   Curve.getPointAt(u, optionalTarget)   src/extras/core/Curve.js:83   — u is *arc length*, 0..1
  //   Curve.getTangentAt(u, optionalTarget) src/extras/core/Curve.js:323  — same mapping
  //   Curve.getLength()                     src/extras/core/Curve.js:140  — "the total arc length"
  const curve = new THREE.CatmullRomCurve3(PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal', 0.5);
  curve.arcLengthDivisions = 2000; // the default 200 is 1.6 m per chord on a 329 m path
  const L = curve.getLength();
  if (Math.abs(L - PATH_LENGTH) > 0.5) console.warn(`flight: PATH is ${L.toFixed(2)} m but schedule.ts is sized for ${PATH_LENGTH} m`);

  const plane = makePlane(0, 0, 0, 90, mat);
  group.add(plane.group);
  // the prop blur: two ellipse quads at 25 % and 20 %, offset 90° (npcs.md §2.2.1, the v27 recipe)
  const blur: THREE.Mesh[] = [];
  for (const [op, rot] of [[0.25, 0], [0.20, Math.PI / 2]] as [number, number][]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), new THREE.MeshBasicMaterial({ color: '#C8C8D0', transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.y = Math.PI / 2; m.rotation.x = rot; m.position.set(3.55, 0.95, 0);
    m.scale.set(1, 0.92, 1);
    plane.group.add(m); blur.push(m);
  }
  // The bench: four seat sockets, two forward and two behind, Isabella on the left (npcs.md §2.2.1).
  // Dropped to 0.74 m so the hips sit *in* the fuselage (its deck is about 1.45 m) and the cockpit
  // rim cuts the four at the waist — T-28 and the scores' change 5 ("their hips sit on top of the
  // box, not in a cockpit"). Spread to 1.10 m along the fuselage and 0.76 m across so four heads
  // separate from the wing station. A seat faces the nose: the rig's eyes are on local +z and the
  // plane is built along +x, so the socket turns +90°, not −90° (LESSONS.md Rigs row 3, T-26).
  const bench = new THREE.Group();
  bench.position.set(-0.30, 0.74, 0);
  plane.group.add(bench);
  const seats: THREE.Group[] = [];
  for (const [sx, sz] of [[0.55, 0.38], [0.55, -0.38], [-0.55, 0.38], [-0.55, -0.38]] as [number, number][]) {
    const s = new THREE.Group(); s.position.set(sx, 0, sz); s.rotation.y = Math.PI / 2; bench.add(s); seats.push(s);
  }

  // ---- Grandpa Ed in the rear cockpit: the lump on the brow, the wide pale collar, the red streak
  // Ed faces the nose: his goggles are on his local +z and the plane is built along +x, so his
  // socket turns +90° (the same T-26 correction as the seats), and he sits at 0.95 m so the wide
  // pale collar reads just above the deck.
  const ed = new THREE.Group();
  ed.position.set(-1.35, 0.95, 0); ed.rotation.y = Math.PI / 2;
  const edBody = new THREE.Mesh(mergeGeos([
    xf(CY(0.21, 0.25, 0.52, 7, ED.base), 0, 0.26),
    xf(colorize(new THREE.TorusGeometry(0.22, 0.075, 5, 12), ED.collar).rotateX(Math.PI / 2), 0, 0.50),
    xf(B(0.16, 0.10, 0.02, ED.green), 0, 0.44, 0.16),
    xf(colorize(new THREE.SphereGeometry(0.20, 8, 6), ED.skin), 0, 0.70),
    xf(colorize(new THREE.SphereGeometry(0.205, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), ED.dark), 0, 0.72),
    ...[-1, 1].map((s) => xf(colorize(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 10), ED.goggle).rotateX(Math.PI / 2), s * 0.085, 0.80, 0.155)),
    ...[-1, 1].map((s) => xf(colorize(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 10), ED.lens).rotateX(Math.PI / 2), s * 0.085, 0.80, 0.175)),
    ...[-1, 1].map((s) => xf(CY(0.055, 0.05, 0.34, 6, ED.base).rotateZ(s * 0.5), s * 0.22, 0.36, 0.05)),
  ]), mat);
  edBody.castShadow = true;
  ed.add(edBody);
  // the scarf: six bones, six frequencies, streaming back along −velocity (npcs.md §2.1.4)
  const scarfBones: THREE.Group[] = [];
  let parent: THREE.Object3D = ed;
  for (let k = 0; k < 6; k++) {
    const b = new THREE.Group();
    b.position.set(0, k === 0 ? 0.52 : -0.15, k === 0 ? -0.1 : 0);
    const w = 0.14 - k * 0.01;
    const strip = colorize(new THREE.PlaneGeometry(w, 0.16, 1, 1), k < 3 ? ED.scarf : ED.scarfEnd);
    strip.translate(0, -0.08, 0);
    const m = new THREE.Mesh(strip, makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide }));
    b.add(m); parent.add(b); parent = b; scarfBones.push(b);
  }
  plane.group.add(ed);
  const F = [4, 5, 3.5, 4.2, 3, 3.8], G = [3, 4, 4.5, 3.8, 4.2, 5];

  // ---- the cloud layer the plane climbs through (+24 m over the hub) --------------------------------
  const cloudMat = makeWorldMaterial({ roughness: 1 });
  const layer: { mesh: THREE.Mesh; base: THREE.Vector3; ph: number }[] = [];
  for (let i = 0; i < 22; i++) {
    const parts: THREE.BufferGeometry[] = [];
    const w = 16 + r() * 14, k = 3 + Math.floor(r() * 3);
    for (let j = 0; j < k; j++) {
      const s = w * (0.24 + r() * 0.18);
      const g = new THREE.IcosahedronGeometry(s, 1);
      g.scale(1.5, 0.5, 1.2);
      g.translate((j - (k - 1) / 2) * w * 0.32, (r() - 0.5) * s * 0.3, (r() - 0.5) * w * 0.22);
      parts.push(colorize(g, '#FFFFFF'));
    }
    const merged = mergeGeos(parts);
    const col = merged.getAttribute('color') as THREE.BufferAttribute, nrm = merged.getAttribute('normal') as THREE.BufferAttribute;
    const under = new THREE.Color('#D8B8C8');
    for (let k2 = 0; k2 < col.count; k2++) {
      const tt = THREE.MathUtils.clamp(0.5 - nrm.getY(k2) * 0.5, 0, 1);
      col.setXYZ(k2, 1 - (1 - under.r) * tt, 1 - (1 - under.g) * tt, 1 - (1 - under.b) * tt);
    }
    const a = r() * 6.283, d = 30 + r() * 150;
    const base = new THREE.Vector3(Math.cos(a) * d, CLOUD.lo + r() * (CLOUD.hi - CLOUD.lo), Math.sin(a) * d);
    const mesh = new THREE.Mesh(merged, cloudMat);
    mesh.position.copy(base);
    group.add(mesh);
    layer.push({ mesh, base, ph: r() * 6.28 });
  }

  // ---- the other island, on the horizon: the destination growing ahead ------------------------------
  {
    const isle = new THREE.Group();
    const top = colorize(new THREE.CylinderGeometry(46, 40, 5, 9), '#2F6B3A');
    const skirt = colorize(new THREE.ConeGeometry(40, 34, 9), '#4A4048');
    skirt.rotateX(Math.PI); skirt.translate(0, -19, 0);
    const trees: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 38, h = 6 + r() * 6;
      trees.push(xf(colorize(new THREE.ConeGeometry(h * 0.24, h, 5), i % 3 ? '#0F5132' : '#3A7D44'), Math.cos(a) * d, 2.5 + h / 2, Math.sin(a) * d));
    }
    const m = new THREE.Mesh(mergeGeos([top, skirt, ...trees]), cloudMat);
    isle.add(m);
    const roof = new THREE.Mesh(colorize(new THREE.BoxGeometry(7, 3, 6), C.tealSlate), cloudMat);
    roof.position.set(6, 4, -4); isle.add(roof);
    isle.position.set(430, 8, -260);
    group.add(isle);
  }

  const pos = new THREE.Vector3(), tan = new THREE.Vector3(), tmp = new THREE.Vector3();
  const tanA = new THREE.Vector3(), tanB = new THREE.Vector3();
  const q = new THREE.Quaternion();
  let bounce = 0, roll = 0, beat = 'on the strip', propAngle = 0, stall = 0;
  const flight: Flight = {
    group, plane: plane.group, whiteOut: 0, stall: 0, pos, fwd: tan,
    speed: 0, distance: 0, bankDeg: 0, bounce: 0, length: L,
    seat: (i, out) => { seats[i]!.getWorldPosition(tmp); out.position.copy(tmp); seats[i]!.getWorldQuaternion(q); out.quaternion.copy(q); },
    // CH / WG / ED are ridden, not stood in: the station's numbers in main.ts describe the framing,
    // these offsets are what the camera actually does. WG is up 0.85 m on the first pass (about +4°
    // over an 11.4 m eye-to-subject line), the scores' change 5, so four heads separate.
    chase: (out, kind) => {
      const p = plane.group;
      if (kind === 'CH') { tmp.set(-13, 3.4, 0); p.localToWorld(tmp); out.position.copy(tmp); tmp.set(2, 1.1, 0); p.localToWorld(tmp); out.lookAt(tmp); }
      else if (kind === 'WG') { tmp.set(-1.8, 3.4, -12.0); p.localToWorld(tmp); out.position.copy(tmp); tmp.set(1.0, 1.0, 1.2); p.localToWorld(tmp); out.lookAt(tmp); }
      // ED backs off 1.9 m from the first pass: the bench dropped 0.26 m and moved 0.13 m aft, which
      // put the old shoulder camera inside Collette's head.
      else { tmp.set(-3.6, 1.75, 0.62); p.localToWorld(tmp); out.position.copy(tmp); tmp.set(1.0, 1.55, 0); p.localToWorld(tmp); out.lookAt(tmp); }
    },
    set: (t, dt) => {
      const tc = THREE.MathUtils.clamp(t, 0, FLIGHT_LEN);
      // ---- arc-length sampling: the schedule says how far, the path says where -------------------
      const s = distanceAt(tc);
      const v = speedAt(tc);
      const u = THREE.MathUtils.clamp(s / L, 0, 1);
      curve.getPointAt(u, pos);
      curve.getTangentAt(u, tan).normalize();
      beat = s < MARK.rotate ? 'takeoff roll'
        : s < MARK.cloudUp ? 'rotate and climb'
          : s < MARK.top ? 'through the cloud layer'
            : s < MARK.rim ? 'the sky leg'
              : s < MARK.cloudDown ? 'the descent'
                : tc < CRUISE_END ? 'the circuit'
                  : tc < TOUCHDOWN ? legAt(tc)
                    : tc < TOUCHDOWN + 1.2 ? 'the bounces' : 'roll-out';
      // the two bounces: the second half the first, easing out (npcs.md §2.3.7, schedule.ts)
      bounce = bounceY(tc);
      const sa = (tc - STALL.at) / STALL.dur;
      stall = sa > 0 && sa < 1 ? Math.sin(sa * Math.PI) : 0;
      plane.group.position.set(pos.x, pos.y + bounce - STALL.drop * stall, pos.z);
      const yaw = Math.atan2(tan.x, tan.z);
      const pitch = Math.asin(THREE.MathUtils.clamp(tan.y, -1, 1));
      // ---- the bank: the path's curvature at the scheduled speed, eased and rate-limited ---------
      const uA = THREE.MathUtils.clamp((s - BANK_LOOK) / L, 0, 1), uB = THREE.MathUtils.clamp((s + BANK_LOOK) / L, 0, 1);
      curve.getTangentAt(uA, tanA); curve.getTangentAt(uB, tanB);
      let dpsi = Math.atan2(tanB.x, tanB.z) - Math.atan2(tanA.x, tanA.z);
      dpsi = Math.atan2(Math.sin(dpsi), Math.cos(dpsi));
      const kappa = dpsi / Math.max((uB - uA) * L, 1e-6); // radians of yaw per metre flown
      const want = THREE.MathUtils.clamp(Math.atan((v * v * kappa * YAW_GAIN) / 9.81), -MAX_BANK, MAX_BANK);
      const eased = roll + (want - roll) * Math.min(1, dt * BANK_LAG); // bank lag 4/s (npcs.md §2.2.3)
      roll += THREE.MathUtils.clamp(eased - roll, -ROLL_RATE * dt, ROLL_RATE * dt);
      // the plane is built along +x, so the yaw offset is −90°; the wobble is the fourth motion source
      plane.group.rotation.set(0, yaw - Math.PI / 2, 0);
      plane.group.rotateZ(pitch - 0.26 * stall + Math.sin(t * 1.3) * 0.02);
      plane.group.rotateX(-roll + Math.cos(t * 2) * 0.04);
      // the propeller at flight speed, with the blur discs above 20 rad/s
      const spin = tc < 0.6 ? tc / 0.6 : tc > TOUCHDOWN + 2.4 ? Math.max(0, 1 - (tc - TOUCHDOWN - 2.4) / 0.8) : 1;
      propAngle += dt * 46 * spin;
      plane.prop.rotation.x = propAngle;
      for (const b of blur) b.visible = spin > 0.45;
      // the cloud layer: a white-out while the plane is inside it
      flight.stall = stall;
      flight.speed = v; flight.distance = s; flight.bounce = bounce; flight.bankDeg = (roll * 180) / Math.PI;
      flight.whiteOut = THREE.MathUtils.smoothstep(pos.y, CLOUD.lo - 2, CLOUD.lo + 1) * (1 - THREE.MathUtils.smoothstep(pos.y, CLOUD.hi - 1, CLOUD.hi + 2));
      for (const c of layer) c.mesh.position.set(c.base.x + Math.sin(t * 0.05 + c.ph) * 3, c.base.y + Math.sin(t * 0.09 + c.ph) * 0.8, c.base.z + t * 0.4);
      // Ed's scarf: six bones, six frequencies, streaming back at 1.5× in the air
      // Aft is Ed's local −z, so the rest bend is about x (a bend about z would stream the scarf out
      // sideways over the wing, which is what the first pass did); the flutter rides on both axes.
      const air = 0.4 + 0.6 * THREE.MathUtils.smoothstep(tc, 2.5, 5);
      scarfBones.forEach((b, k) => {
        b.rotation.x = (k === 0 ? 1.15 : 0.12) * air + 0.075 * Math.sin(t * F[k]!) * air;
        b.rotation.z = 0.075 * Math.cos(t * G[k]!) * air;
      });
      return beat;
    },
    hud: () => `flight ${beat} · ${flight.speed.toFixed(1)} m/s (cruise ${CRUISE_SPEED}) · ${flight.distance.toFixed(1)} / ${L.toFixed(1)} m · alt ${pos.y.toFixed(1)} m · bank ${flight.bankDeg.toFixed(1)}° (max ${MAX_BANK_DEG}) · bounce ${bounce.toFixed(2)} m · cloud ${flight.whiteOut.toFixed(2)}`,
  };
  return flight;
}
