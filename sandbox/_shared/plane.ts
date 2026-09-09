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
//      their legs came out of the sides ("the kids clip pretty hard through it"). It is now the
//      same taper with an **open cockpit well** cut into its top.
//
// Round 2 fix pass (`docs/qa/briefs/reel-fixes-04-fixes.md` C1, audit item 4). The first well was a
// 0.90 m box with its floor at 0.62 m, so the middle 2.8 m of the fuselage stepped *out and down*
// from the yellow taper and hung a soot trough under the belly — visible in `desert-noon-parked-04`
// and `frozen-night-parked-04`. Andrew: the plane "almost looks perfect already … I don't want to
// break something that is actually already almost there". So the well is now **flush**: it is a slot
// cut in the top of the fuselage's own taper and nothing else. Every piece of it is derived from
// `halfAt(x)` — the taper's own half-width — so
//   * the outer face of each side skin **is** the taper's own surface;
//   * the lip that caps the skin has its top on the taper's own top line, `topAt(x)`;
//   * the belly under the deck fills the taper down to `botAt(x)` and never below it.
// Nothing of the well is outside the plane it would be without one: `tests/unit/sandbox/flight.test`
// rasterises both silhouettes (from the side and from below) and asserts a strict subset.
//
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
/** The fuselage's own axis: every section is a square centred on this height. */
export const AXIS_Y = 0.95;
/** The fuselage's own half-width at plane-space x — the one number the whole cockpit is built from.
 *  0.3426 m at the well's aft end, 0.2724 m at its fore end (the brief's "taper 0.29–0.34 m"). */
export const halfAt = (x: number): number => HALF * radiusAt(x);
/** The fuselage's own top and bottom lines at x. The well's lip sits *on* the top line; the well's
 *  belly never reaches below the bottom line. */
export const topAt = (x: number): number => AXIS_Y + halfAt(x);
export const botAt = (x: number): number => AXIS_Y - halfAt(x);

/**
 * The numbers the cockpit well is made of, in **plane space** (x aft−fore, nose at +x; y up from the
 * wheels' ground; z the plane's right positive, so the plane's **left is −z**). The flight scene
 * seats the kids against these, and the bone/mesh probes test against `solids` below, so there is
 * exactly one source for "where is the cockpit".
 */
export const WELL = {
  /** The opening, fore and aft. */
  x0: -2.10, x1: 0.70,
  /** The deck forward of the lower wing's trailing edge: 0.035 m over the wing's top (0.765 m),
   *  which passes straight through that part of the bay. */
  deck: 0.80,
  /** Aft of the wing there is nothing under the well but the fuselage's own bottom skin, so the
   *  floor drops to this far over `botAt(x)` — a real cockpit floor, deep enough that a robe or a
   *  cape hangs *in* it instead of into a slab of belly. */
  keel: 0.03,
  /** The skin: the coaming's thickness, so the interior half-width is `halfAt(x) − wall`. A real
   *  fabric-over-frame coaming, not a wall — 0.60 m of interior at the aft bench where the first
   *  well had 0.70 m of box sticking out of the fuselage. */
  wall: 0.014,
  /** The padded lip: the top of the skin, in `C.iron`, its top face on `topAt(x)`. */
  lip: 0.055,
  /** How the tapered pieces are cut: one box per 0.2 m of x, each at its *fore* (narrowest) section,
   *  so every slice lies strictly inside the taper and the drawn shape and `solids` are the same
   *  boxes. The worst step between slices is 0.0025 m. */
  slice: 0.1,
} as const;
/** The interior half-width at x: what a kid's hips, thighs and boots have to fit inside. */
export const innerAt = (x: number): number => halfAt(x) - WELL.wall;
/** The cockpit floor at x: the wing-spar deck forward of the wing's trailing edge, the fuselage's
 *  own keel aft of it. One step, at the trailing edge, and it is a slice boundary. */
export const deckAt = (x: number): number => (x > LOWER_WING.x0 ? WELL.deck : botAt(x) + WELL.keel);
/** The two benches in the well, fore and aft: `x` their centre, `top` the pad a hip sits on. The
 *  fore bench is 0.22 m higher so four heads separate from the chase camera (fix C3). */
export const BENCH = {
  fwd: { x: -0.42, top: 1.23 },
  aft: { x: -1.05, top: 1.03 },
  len: 0.46,
  pad: 0.06,
  /** A hip point is this far over the pad it sits on: the deepest kid's hip block (0.07 · torso). */
  hip: 0.07,
} as const;
/** Ed's socket: the rear cockpit (npcs.md §2.2.1). The kids are always ahead of him. */
export const PILOT = { x: -1.35, y: 0.95 } as const;

/** The two cabane struts, now on both sides (T-66): plane-space x, and z ±0.45. */
export const CABANE = { xs: [0.0, 1.2] as const, z: 0.45, y0: 0.73, y1: 2.03, r: 0.045 } as const;
/** The lower wing, the surface variant B and C seat their riders on. */
export const LOWER_WING = { x0: -0.10, x1: 1.30, top: 0.765, bottom: 0.675, halfZ: 3.0 } as const;
/** Where the pennant is hung: the top of the rear outer interplane strut on the plane's left. */
export const PENNANT_ROOT = { x: 0.1, y: 2.0, z: -2.4 } as const;
export const PENNANT = { segments: 4, segLen: 0.28, w0: 0.16, w1: 0.06 } as const;

/** A solid of the plane, as an axis-aligned box in plane space: what a bone may not be inside. */
export interface PlaneSolid { name: string; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }

/** The x of every slice boundary across the well, fore to aft inclusive. */
function sliceEdges(): number[] {
  const n = Math.max(1, Math.round((WELL.x1 - WELL.x0) / WELL.slice));
  const out: number[] = [];
  for (let k = 0; k <= n; k++) out.push(WELL.x0 + ((WELL.x1 - WELL.x0) * k) / n);
  return out;
}

/** The tapered sections are boxed at their *widest* radius, so "outside the box" is conservative;
 *  the well's own pieces are boxed at exactly the boxes they are drawn as. */
function solidsOf(): PlaneSolid[] {
  const noseH = halfAt(WELL.x1), tailH = halfAt(-LEN / 2);
  const box = (name: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): PlaneSolid => ({ name, x0, x1, y0, y1, z0, z1 });
  const out: PlaneSolid[] = [
    box('nose', WELL.x1, LEN / 2, AXIS_Y - noseH, AXIS_Y + noseH, -noseH, noseH),
    box('cowl', LEN / 2 - 0.55, LEN / 2 + 0.15, 0.41, 1.49, -0.54, 0.54),
    box('tail', -LEN / 2, WELL.x0, AXIS_Y - tailH, AXIS_Y + tailH, -tailH, tailH),
  ];
  const e = sliceEdges();
  for (let k = 0; k + 1 < e.length; k++) {
    const a = e[k]!, b = e[k + 1]!;          // a is aft of b; the slice is cut at b, its fore section
    const h = halfAt(b), inn = h - WELL.wall, top = AXIS_Y + h, bot = AXIS_Y - h, deck = deckAt(b);
    out.push(box(`well.belly.${k}`, a, b, bot, deck, -h, h));
    out.push(box(`well.skin.R.${k}`, a, b, deck, top, inn, h));
    out.push(box(`well.skin.L.${k}`, a, b, deck, top, -h, -inn));
  }
  const hAft = halfAt(WELL.x0 + WELL.wall), hFwd = halfAt(WELL.x1);
  out.push(box('well.bulkhead.aft', WELL.x0, WELL.x0 + WELL.wall, deckAt(WELL.x0 + WELL.wall), AXIS_Y + hAft, -hAft + WELL.wall, hAft - WELL.wall));
  out.push(box('well.bulkhead.fwd', WELL.x1 - WELL.wall, WELL.x1, WELL.deck, AXIS_Y + hFwd, -hFwd + WELL.wall, hFwd - WELL.wall));
  out.push(box('wing.lower', LOWER_WING.x0, LOWER_WING.x1, LOWER_WING.bottom, LOWER_WING.top, -LOWER_WING.halfZ, LOWER_WING.halfZ));
  out.push(box('wing.upper', -0.10, 1.30, 2.005, 2.095, -3.6, 3.6));
  out.push(box('tailplane', -3.0, -2.2, 1.115, 1.185, -1.2, 1.2));
  return out;
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

/** `well: false` builds the fuselage as the one uncut taper it was — the reference the silhouette
 *  check measures the cockpit against (fix C1). Nothing in the demo scenes passes it. */
export interface PlaneOpts { well?: boolean }

export function makePlane(x: number, y: number, z: number, bearing: number, mat = makeWorldMaterial(), opts: PlaneOpts = {}): Plane {
  const withWell = opts.well !== false;
  const group = new THREE.Group();
  const len = LEN;
  const parts: THREE.BufferGeometry[] = [];
  // ---- the fuselage: one taper, with the cockpit cut out of the top of it (T-66, C1) -------------
  const section = (x0: number, x1: number): THREE.BufferGeometry => {
    const g = CY(radiusAt(x1), radiusAt(x0), x1 - x0, 4, C.planeYellow);
    g.rotateY(Math.PI / 4); g.rotateZ(-Math.PI / 2); g.translate((x0 + x1) / 2, AXIS_Y, 0);
    return g;
  };
  if (!withWell) {
    parts.push(section(-len / 2, len / 2));
  } else {
    parts.push(section(WELL.x1, len / 2));   // the nose
    parts.push(section(-len / 2, WELL.x0));  // the tail
    // the well itself, slice by slice, every number off `halfAt` so nothing leaves the taper
    const e = sliceEdges();
    for (let k = 0; k + 1 < e.length; k++) {
      const a = e[k]!, b = e[k + 1]!, mid = (a + b) / 2, w = b - a;
      const h = halfAt(b), inn = h - WELL.wall, top = AXIS_Y + h, bot = AXIS_Y - h, deck = deckAt(b);
      // the belly: solid taper from the bottom line up to the floor (nothing hangs under the plane)
      parts.push(B(w, deck - bot, h * 2, C.planeYellow).translate(mid, (bot + deck) / 2, 0));
      // the cockpit floor the kids' boots stand on: npcs.md §2.2.1 paints the interior rgba(30,20,15)
      parts.push(B(w, 0.014, inn * 2, C.soot).translate(mid, deck - 0.007, 0));
      for (const s of [1, -1]) {
        // the side skin, its outer face on the taper; the lip caps it, its top on the taper's top
        parts.push(B(w, top - WELL.lip - deck, WELL.wall, C.planeYellow).translate(mid, (deck + top - WELL.lip) / 2, s * (h - WELL.wall / 2)));
        parts.push(B(w, WELL.lip, WELL.wall, C.iron).translate(mid, top - WELL.lip / 2, s * (h - WELL.wall / 2)));
        // the interior liner, so the well reads dark instead of yellow from the inside
        parts.push(B(w, top - WELL.lip - deck, 0.012, C.soot).translate(mid, (deck + top - WELL.lip) / 2, s * (inn - 0.006)));
      }
    }
    // the two bulkheads, and the same lip across them, so the coaming runs right round the opening
    for (const [bx, bw] of [[WELL.x0 + WELL.wall / 2, halfAt(WELL.x0 + WELL.wall)], [WELL.x1 - WELL.wall / 2, halfAt(WELL.x1)]] as [number, number][]) {
      const top = AXIS_Y + bw, inn = bw - WELL.wall, deck = deckAt(bx);
      parts.push(B(WELL.wall, top - WELL.lip - deck, inn * 2, C.soot).translate(bx, (deck + top - WELL.lip) / 2, 0));
      parts.push(B(WELL.wall, WELL.lip, inn * 2, C.iron).translate(bx, top - WELL.lip / 2, 0));
    }
    // the two benches: pads on posts, inside the well, the fore one higher (fix C3)
    for (const bench of [BENCH.fwd, BENCH.aft]) {
      const bh = innerAt(bench.x) - 0.012, floor = deckAt(bench.x);
      parts.push(B(BENCH.len, BENCH.pad, bh * 2, C.iron).translate(bench.x, bench.top - BENCH.pad / 2, 0));
      for (const s of [1, -1]) parts.push(B(0.05, bench.top - BENCH.pad - floor, 0.05, C.planeYellowDark).translate(bench.x, (floor + bench.top - BENCH.pad) / 2, s * (bh - 0.05)));
    }
  }
  // ---- everything Andrew already liked, unchanged ------------------------------------------------
  parts.push(CY(0.54, 0.54, 0.7, 8, C.planeYellowDark).rotateZ(Math.PI / 2).translate(len / 2 - 0.2, AXIS_Y, 0)); // cowl
  parts.push(CY(0.13, 0.13, 0.25, 6, C.iron).rotateZ(Math.PI / 2).translate(len / 2 + 0.25, AXIS_Y, 0)); // hub
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
  prop.position.set(len / 2 + 0.4, AXIS_Y, 0); prop.castShadow = true;
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
