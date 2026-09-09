// The Green Meanie, intact and parked (npcs.md §2.2: a yellow cross with green bars, 6.0 × 7.2 ×
// 2.5 m). The Forest scene has the wreck; the Desert and Frozen strips have this one, with the
// propeller idling slowly and Ed's pennant on the rear outer strut. Built along +x (nose at +x).
//
// Round 2 (T-65, T-66, docs/qa/briefs/reel-fixes-flight-04.md). Two changes, and only two:
//   1. The "red streamer" was a rigid 2.2 m box on the top wing that stuck out ahead of the nose
//      like a bar (Andrew: "the red line coming off of it"). It is now a **pennant**: four hinged
//      quads, 1.12 m of cloth, hung from the top of the rear outer interplane strut on the plane's
//      **left** (z −2.4; the plane flies along +x, so left is −z) and trailing aft. It hangs at
//      −80° with a parked plane's own small sway and lies out at −5° at full wind.
//   2. The fuselage was one solid four-sided cylinder, so the kids' hips sat *inside* the box and
//      their legs came out of the sides ("the kids clip pretty hard through it"). The cylinder is
//      now the **nose** (x +0.70 … +3.10) and the **tail** (x −3.10 … −2.10) cut from the *same*
//      taper — the outline Andrew liked is the same numbers — with an **open cockpit well** between
//      them: floor, two side walls, two bulkheads and a padded rim, a real cockpit you can see into.
// Everything else — footprint, cowl, wings, struts, wheels, tail, colours — is untouched, except
// that the two cabane struts are now mirrored to z −0.45 as well (they stood on one side only).
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos } from './material';
import { C } from './style';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

const LEN = 6.2;
/** The fuselage's four-sided taper, as radii: `CY(0.30, 0.52, LEN, 4)` laid along +x. */
const R_NOSE = 0.30, R_TAIL = 0.52;
/** Radius of the fuselage taper at plane-space x (the nose section and the tail section share it). */
const radiusAt = (x: number): number => R_TAIL + (R_NOSE - R_TAIL) * ((x + LEN / 2) / LEN);
/** A 4-gon turned 45° is an axis-aligned square of half-extent r/√2. */
const HALF = Math.SQRT1_2;

/**
 * The numbers the cockpit well is made of, in **plane space** (x aft−fore, nose at +x; y up from the
 * wheels' ground; z the plane's right positive, so the plane's **left is −z**). The flight scene
 * seats the kids against these, and the bone-in-solid probe tests against `solids` below, so there
 * is exactly one source for "where is the cockpit".
 */
export const WELL = {
  /** The opening, fore and aft. */
  x0: -2.10, x1: 0.70,
  /** The floor slab: it sits on 0.62 m and its deck — what the kids' boots stand on — is 0.80 m,
   *  clear of the lower wing's top (0.765 m) which passes straight through this bay. */
  floorY: 0.62, floorTop: 0.80,
  /** The coaming's height: the walls run from the deck to here and the padded rim caps them. */
  rimY: 1.45,
  /** Half the well's outer width: npcs.md §2.2.1's 0.9 m fuselage, and the width the old cockpit
   *  rim box already had in the frames Andrew liked. */
  halfZ: 0.45,
  /** Wall thickness, so the inside is ±0.35 m. */
  wall: 0.10,
  /** The rim's top face: where a hand goes. */
  rimTop: 1.55,
  /** The rim rails' centre line in z. */
  rimZ: 0.40,
} as const;

/** The two cabane struts, now on both sides (T-66): plane-space x, and z ±0.45. */
export const CABANE = { xs: [0.0, 1.2] as const, z: 0.45, y0: 0.73, y1: 2.03, r: 0.045 } as const;
/** The lower wing, the surface variant B and C seat their riders on. */
export const LOWER_WING = { x0: -0.10, x1: 1.30, top: 0.765, bottom: 0.675, halfZ: 3.0 } as const;
/** Where the pennant is hung: the top of the rear outer interplane strut on the plane's left. */
export const PENNANT_ROOT = { x: 0.1, y: 2.0, z: -2.4 } as const;
export const PENNANT = { segments: 4, segLen: 0.28, w0: 0.16, w1: 0.06 } as const;

/** A solid of the plane, as an axis-aligned box in plane space: what a bone may not be inside. */
export interface PlaneSolid { name: string; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }

/** The tapered sections are boxed at their *widest* radius, so "outside the box" is conservative. */
function solidsOf(): PlaneSolid[] {
  const noseH = radiusAt(WELL.x1) * HALF, tailH = radiusAt(-LEN / 2) * HALF;
  const box = (name: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): PlaneSolid => ({ name, x0, x1, y0, y1, z0, z1 });
  return [
    box('nose', WELL.x1, LEN / 2, 0.95 - noseH, 0.95 + noseH, -noseH, noseH),
    box('cowl', LEN / 2 - 0.55, LEN / 2 + 0.15, 0.41, 1.49, -0.54, 0.54),
    box('tail', -LEN / 2, WELL.x0, 0.95 - tailH, 0.95 + tailH, -tailH, tailH),
    box('well.floor', WELL.x0, WELL.x1, WELL.floorY, WELL.floorTop, -WELL.halfZ, WELL.halfZ),
    box('well.wall.R', WELL.x0, WELL.x1, WELL.floorTop, WELL.rimY, WELL.halfZ - WELL.wall, WELL.halfZ),
    box('well.wall.L', WELL.x0, WELL.x1, WELL.floorTop, WELL.rimY, -WELL.halfZ, -WELL.halfZ + WELL.wall),
    box('well.bulkhead.aft', WELL.x0, WELL.x0 + WELL.wall, WELL.floorTop, WELL.rimY, -WELL.halfZ + WELL.wall, WELL.halfZ - WELL.wall),
    box('well.bulkhead.fwd', WELL.x1 - WELL.wall, WELL.x1, WELL.floorTop, WELL.rimY, -WELL.halfZ + WELL.wall, WELL.halfZ - WELL.wall),
    box('wing.lower', LOWER_WING.x0, LOWER_WING.x1, LOWER_WING.bottom, LOWER_WING.top, -LOWER_WING.halfZ, LOWER_WING.halfZ),
    box('wing.upper', -0.10, 1.30, 2.005, 2.095, -3.6, 3.6),
    box('tailplane', -3.0, -2.2, 1.115, 1.185, -1.2, 1.2),
  ];
}

/** Signed clearance of a plane-space point from a box: > 0 outside, < 0 inside (the deepest face). */
export function clearance(s: PlaneSolid, x: number, y: number, z: number): number {
  const dx = Math.max(s.x0 - x, x - s.x1), dy = Math.max(s.y0 - y, y - s.y1), dz = Math.max(s.z0 - z, z - s.z1);
  if (dx > 0 || dy > 0 || dz > 0) return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
  return Math.max(dx, dy, dz); // all negative: the least-deep face is how far in the point is
}

export interface Plane {
  group: THREE.Group;
  prop: THREE.Mesh;
  /** The parked call, unchanged for the Bog, the Desert and the Frozen strip: `plane.update(t)`.
   *  `wind` is 0..1 (the flight passes `speed / CRUISE_SPEED`); at 0 the pennant hangs. */
  update: (t: number, wind?: number) => void;
  /** The pennant alone, for a scene that drives the propeller itself (the flight does). */
  pennant: (t: number, wind: number) => void;
  /** The pennant's four hinged segments, root first: a probe reads their world transforms. */
  pennantBones: THREE.Group[];
  /** The plane's solids in plane space, for the bone-in-solid check. */
  solids: PlaneSolid[];
  footprint: { x: number; z: number; r: number }[];
}

/** One pennant quad: a trapezoid from (0, ±wS/2) to (len, ±wE/2), lying in the segment's xy plane. */
function pennantQuad(len: number, wS: number, wE: number, hex: string): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, wS / 2, 0, 0, -wS / 2, 0, len, wE / 2, 0, len, -wE / 2, 0], 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  return mergeGeos([colorize(g, hex)]);
}

export function makePlane(x: number, y: number, z: number, bearing: number, mat = makeWorldMaterial()): Plane {
  const group = new THREE.Group();
  const len = LEN;
  const parts: THREE.BufferGeometry[] = [];
  // ---- the fuselage, cut into a nose and a tail off the same taper (T-66) ------------------------
  const section = (x0: number, x1: number): THREE.BufferGeometry => {
    const g = CY(radiusAt(x1), radiusAt(x0), x1 - x0, 4, C.planeYellow);
    g.rotateY(Math.PI / 4); g.rotateZ(-Math.PI / 2); g.translate((x0 + x1) / 2, 0.95, 0);
    return g;
  };
  parts.push(section(WELL.x1, len / 2));   // the nose
  parts.push(section(-len / 2, WELL.x0));  // the tail
  // ---- the open cockpit well: floor, two walls, two bulkheads, and the padded rim round it -------
  const wLen = WELL.x1 - WELL.x0, wMid = (WELL.x0 + WELL.x1) / 2;
  const wallH = WELL.rimY - WELL.floorTop, wallMid = (WELL.rimY + WELL.floorTop) / 2;
  const inner = WELL.halfZ - WELL.wall;
  // the floor slab; its deck is the cockpit interior, which npcs.md §2.2.1 paints `rgba(30,20,15)`
  parts.push(B(wLen, WELL.floorTop - WELL.floorY, WELL.halfZ * 2, C.soot).translate(wMid, (WELL.floorY + WELL.floorTop) / 2, 0));
  for (const s of [1, -1]) parts.push(B(wLen, wallH, WELL.wall, C.planeYellow).translate(wMid, wallMid, s * (WELL.halfZ - WELL.wall / 2))); // the side walls
  for (const bx of [WELL.x0 + WELL.wall / 2, WELL.x1 - WELL.wall / 2]) parts.push(B(WELL.wall, wallH, inner * 2, C.planeYellow).translate(bx, wallMid, 0)); // the bulkheads
  // and the interior liner: 0.02 m panels on the inside faces only, so the well reads dark, not
  // yellow, without ever filling the opening the kids sit in
  for (const s of [1, -1]) parts.push(B(wLen - WELL.wall * 2, wallH, 0.02, C.soot).translate(wMid, wallMid, s * (inner - 0.01)));
  for (const bx of [WELL.x0 + WELL.wall + 0.01, WELL.x1 - WELL.wall - 0.01]) parts.push(B(0.02, wallH, inner * 2 - 0.04, C.soot).translate(bx, wallMid, 0));
  // the padded rim, running right round the opening
  const rimH = WELL.rimTop - WELL.rimY;
  for (const s of [1, -1]) parts.push(B(wLen + 0.20, rimH, 0.14, C.iron).translate(wMid, (WELL.rimY + WELL.rimTop) / 2, s * WELL.rimZ));
  for (const rx of [WELL.x0 - 0.03, WELL.x1 + 0.03]) parts.push(B(0.14, rimH, WELL.rimZ * 2 + 0.14, C.iron).translate(rx, (WELL.rimY + WELL.rimTop) / 2, 0));
  // ---- everything Andrew already liked, unchanged ------------------------------------------------
  parts.push(CY(0.54, 0.54, 0.7, 8, C.planeYellowDark).rotateZ(Math.PI / 2).translate(len / 2 - 0.2, 0.95, 0)); // cowl
  parts.push(CY(0.13, 0.13, 0.25, 6, C.iron).rotateZ(Math.PI / 2).translate(len / 2 + 0.25, 0.95, 0)); // hub
  parts.push(B(1.4, 0.09, 7.2, C.planeGreen).translate(0.6, 2.05, 0)); // upper wing
  parts.push(B(1.4, 0.09, 6.0, C.planeGreen).translate(0.6, 0.72, 0)); // lower wing
  for (const [sx, sz] of [[0.1, 2.4], [1.1, 2.4], [0.1, -2.4], [1.1, -2.4]]) parts.push(CY(0.03, 0.03, 1.3, 5, C.iron).translate(sx!, 1.38, sz!));
  // T-66: the cabane struts stood on the plane's right only; they are mirrored to z −0.45 as well
  for (const sx of CABANE.xs) for (const sz of [CABANE.z, -CABANE.z]) parts.push(CY(CABANE.r, CABANE.r, 1.3, 5, C.planeYellowDark).translate(sx, 1.38, sz));
  parts.push(B(0.8, 0.07, 2.4, C.planeGreen).translate(-len / 2 + 0.5, 1.15, 0)); // tailplane
  parts.push(B(0.09, 1.0, 0.09, C.planeFin).translate(-len / 2 + 0.4, 1.6, 0)); // fin post
  parts.push(B(0.7, 0.9, 0.06, C.planeRudder).translate(-len / 2 + 0.1, 1.55, 0)); // rudder
  for (const sz of [0.8, -0.8]) { parts.push(CY(0.32, 0.32, 0.14, 8, C.iron).rotateX(Math.PI / 2).translate(0.9, 0.32, sz)); parts.push(CY(0.03, 0.03, 0.6, 4, C.iron).translate(0.9, 0.62, sz * 0.75)); }
  parts.push(CY(0.1, 0.1, 0.1, 6, C.iron).rotateX(Math.PI / 2).translate(-len / 2 + 0.6, 0.12, 0)); // tail skid
  const body = new THREE.Mesh(mergeGeos(parts), mat);
  body.castShadow = true; body.receiveShadow = true;
  const prop = new THREE.Mesh(mergeGeos([B(0.06, 2.3, 0.18, C.iron), B(0.06, 0.18, 2.3, C.iron)]), mat);
  prop.position.set(len / 2 + 0.4, 0.95, 0); prop.castShadow = true;
  group.add(body, prop);

  // ---- T-65, the pennant: four hinged quads off the rear outer strut on the left ------------------
  // The chain's root yaws 180° so each segment's local +x is the plane's aft (−x); a segment's
  // *pitch* is then `rotation.z` and its *yaw* `rotation.y` (order YXZ, LESSONS Rigs row 8 — the
  // segments are nested, so a pitch on a yawed segment is about its own axis). The angles below are
  // absolute attitudes; the relative rotation written on each bone is the difference from its
  // parent, so at wind 0 the whole flag hangs straight down instead of curling into a spiral.
  const cloth = makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide });
  const pennantRoot = new THREE.Group();
  pennantRoot.position.set(PENNANT_ROOT.x, PENNANT_ROOT.y, PENNANT_ROOT.z);
  pennantRoot.rotation.y = Math.PI;
  group.add(pennantRoot);
  const pennantBones: THREE.Group[] = [];
  {
    let parent: THREE.Object3D = pennantRoot;
    for (let k = 0; k < PENNANT.segments; k++) {
      const b = new THREE.Group();
      b.rotation.order = 'YXZ';
      if (k > 0) b.position.x = PENNANT.segLen;
      const wS = PENNANT.w0 + ((PENNANT.w1 - PENNANT.w0) * k) / PENNANT.segments;
      const wE = PENNANT.w0 + ((PENNANT.w1 - PENNANT.w0) * (k + 1)) / PENNANT.segments;
      const m = new THREE.Mesh(pennantQuad(PENNANT.segLen, wS, wE, k === PENNANT.segments - 1 ? '#A83828' : C.planeFin), cloth);
      m.castShadow = true;
      b.add(m); parent.add(b); parent = b; pennantBones.push(b);
    }
  }
  const pennant = (t: number, wind: number): void => {
    let pp = 0, py = 0;
    for (let k = 0; k < pennantBones.length; k++) {
      const a = pennantAttitude(k, t, wind);
      pennantBones[k]!.rotation.set(0, a.yaw - py, a.pitch - pp);
      pp = a.pitch; py = a.yaw;
    }
  };
  pennant(0, 0);

  group.position.set(x, y, z);
  group.rotation.y = ((90 - bearing) * Math.PI) / 180;
  const c = Math.cos(group.rotation.y), s = Math.sin(group.rotation.y);
  const footprint = [{ x: x + c * 1.0, z: z - s * 1.0, r: 3.2 }, { x: x - c * 2.4, z: z + s * 2.4, r: 1.6 }];
  return {
    group, prop, pennantBones, solids: solidsOf(), footprint, pennant,
    update: (t, wind = 0) => { prop.rotation.x = t * 1.8; pennant(t, wind); },
  };
}

/** The hang: −80° at wind 0 (a parked plane's flag), −5° at wind 1 (streaming aft). */
const HANG = (-80 * Math.PI) / 180, OUT = (-5 * Math.PI) / 180;

/**
 * Pennant segment `k`'s **absolute** attitude at scene second `t` and wind `w` (0..1), in radians.
 * Absolute, not relative: `makePlane` writes the difference from the parent onto each bone, so at
 * wind 0 the four segments all sit at −80° and the flag hangs straight instead of curling.
 * The flutter is the brief's two incommensurate rates (7.3 and 11.7 rad/s), so the largest change
 * per 1/60 s is 0.30·7.3 + 0.18·11.7 = 4.30 rad/s ÷ 60 = 0.0716 rad; and at wind 0 a 0.04 rad sway
 * on two more rates keeps a parked plane's pennant alive (Tier-0 rule 3: nothing is ever still).
 * Exported so `tests/unit/sandbox/flight.test.ts` samples the same arithmetic the scene runs.
 */
export function pennantAttitude(k: number, t: number, w: number): { pitch: number; yaw: number } {
  const ww = Math.min(1, Math.max(0, w));
  return {
    pitch: HANG + (OUT - HANG) * ww
      + ww * (0.30 * Math.sin(t * 7.3 + k * 1.1) + 0.18 * Math.sin(t * 11.7 + k * 0.7))
      + (1 - ww) * 0.04 * (0.6 * Math.sin(t * 1.7 + k * 0.9) + 0.4 * Math.sin(t * 2.6 + k * 1.3)),
    yaw: ww * 0.12 * Math.sin(t * 5.1 + k)
      + (1 - ww) * 0.025 * (0.6 * Math.sin(t * 2.2 + k * 0.8) + 0.4 * Math.sin(t * 3.1 + k * 1.5)),
  };
}
