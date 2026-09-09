// Three goblins, reimagined from the lore for the reel's round 2 (T-63, T-64).
//
// `enemies.md` §2.1 row 1: the horde's runt, 0.9 m, hit radius 0.25, "hunched runner, oversized
// head, bone-tooth necklace, crooked rust club", "low bobbing sprint, arms back, head forward;
// 0.2 s skid to stop", cone 1.0 m / 70° / 0.35 s, shatter into 8 shards, and at distance "small,
// rust, running at you in a pack". §2.2's faction language gives it the Forest island's own cloth
// scrap (rot-brown `#4A3524`), bone trinkets and crude iron; §2.3's Runt rig gives it **2 × arm × 3**
// — elbows and hands are the bible's own rig, not an invention, so the arms here are solved, not
// two sticks. §2.1.3's colour reservation is checked on every hex in the report's table.
//
// What round 1 got wrong (Andrew's screenshots, `Crash Meadow - Mob1..5.jpg`): "arms are a bit weird.
// One is short, one is extra long and looks like some type of hammer but not in a good way" — the
// club was a *limb extension* welded to a one-bone arm, so it swung through Isabella's head and
// snapped from pose to pose. Here the club is a **thing the goblin carries**: it is parented to the
// root, solved every frame between its contact point and the grip (`LESSONS.md` Rigs / T-42), and
// the hands are IK'd onto it.
//
// The state machine itself is pure and lives next door, so `tests/unit/sandbox/goblins.test.ts` can
// run the loop at 60 Hz without a renderer; this file keeps the meshes and the side effects.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, WORLD_U, xf } from '../_shared/material';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
import {
  BRAKE_TO, gobStep, HIT_HOLD, HIT_R, HOLD_MAX, REACH, SEP_R, SEP_SPD, SLOT_CLOSE, SLOT_R, slotPoint, SPD,
  WINDUP, smoothstep, type GobState,
} from './goblin-step';

export { SPD, type GobState };

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const CONE = (r: number, h: number, seg: number, hex: string) => colorize(new THREE.ConeGeometry(r, h, seg), hex);

/**
 * Every hex on the body, and where §2.1.3 puts it (Δhue / ΔL against the nearest hero base; the rule
 * passes on Δhue > 20° **or** ΔL > 15 %):
 *   base   `#7E3320` 12°/31 %  — Isabella 25°/19 %   pass   dark `#5A2312` 14°/21 % — 27°/29 % pass
 *   bone   `#E6DCC3` 43°/83 %  — Noah     16°/30 %   pass   iron `#8B3A1E` 15°/33 % — 12°/21 % pass
 *   cloth  `#4A3524` 27°/22 %  — Noah      0°/32 %   pass   pupil `#1C1A22` 255°/12 % — 35°/37 % pass
 *   cord   `#B3AC86` 51°/61 %  — Noah     24°/ 8 %   pass   slate `#4C6C78` 196°/38 % — Liam 23°/10 % pass
 * `C.rope` `#C2A878` (12°/8 % off Noah) and `C.stone` `#6F7D86` (16°/1 % off Liam) both FAIL the
 * reservation, so the belt is bone cord and the stone club head is the bible's slate instead.
 */
const GOB = {
  base: '#7E3320', dark: '#5A2312', bone: '#E6DCC3', pupil: '#1C1A22',
  iron: '#8B3A1E', cloth: '#4A3524', cord: '#B3AC86', slate: '#4C6C78',
};
/** The dust the club kicks up: the Ground Pound's own pale dust, not the goblins' rust. */
const DUST = '#C9B08A';

// ---- the rig's numbers (enemies.md §2.3 Runt: 15 bones, 2 x arm x 3) --------------------------
const HIP_Y = 0.40;            // hip height; the head tops out at about 0.87 m, the ears at 0.9
const SH_Y = 0.16;             // shoulder above the hips, in the torso's own (leaning) space
const SH_Z = 0.155;            // shoulder out from the spine; +z is the goblin's right (see below)
const UA = 0.16, FA = 0.15;    // upper arm, forearm — the brief's numbers
const HAND = 0.06;             // the hand block
const LEG = 0.34;              // hip to ankle
const HEAD_R = 0.19;           // the oversized head
const EAR_L = 0.20;            // the long ears that trail in the run and flick at idle
const LEAN0 = 0.25;            // the hunch at idle, in radians

// The body is built along **+x** (`LESSONS.md` §0 rule 4 / STUDY_NOTES §6.3). With this scene's
// bearing convention (a step is `x += sin b`, `z += cos b`) a +x-built model faces bearing `b` at
// `rotation.y = b − 90°`: local +x maps to (cos θ, 0, −sin θ), and θ = b − π/2 gives (sin b, cos b).
// Facing +x with up +y, the goblin's **right** is forward × up = +z, so the club rests at z = +0.155
// (stated in metres, not in a hand name — T-57 is about the kid rig, but the hazard is the same).
const FACE_OFF = -Math.PI / 2;

// ---- the club (a carried prop, 0.42 m) ---------------------------------------------------------
/** Grip → club-head centre. The butt sits at −0.04 and the spikes reach +0.38: 0.42 m in all. */
const CLUB_HEAD = 0.32;
const CLUB_R = 0.08;           // the knotted head's radius; its lowest point is centre − CLUB_R
/** Where the club head lands: 0.5 m in front of the goblin, its lowest point on the grass. */
const STRIKE_X = 0.5, STRIKE_Y = CLUB_R + 0.005;
/** The two hands sit 0.105 m apart on the shaft when the swing is two-handed. */
const GRIP_2 = 0.105;

// the three club poses, in the root's own frame (x forward, y up, z right). The carry and the
// overhead are authored; the ground pose is **solved** from the contact point (T-42).
const P_CARRY_G = new THREE.Vector3(0.02, 0.30, 0.21);
const P_CARRY_D = new THREE.Vector3(-0.25, 0.95, 0.18).normalize();
const P_OVER_G = new THREE.Vector3(0.16, 0.74, 0.02);
const P_OVER_D = new THREE.Vector3(-0.42, 0.90, 0.00).normalize();
const P_GND_D = new THREE.Vector3(0.62, -0.78, 0.00).normalize();
// The grip poses are interpolated **about the shoulder** — the direction slerped, the radius lerped
// — never in a straight line. A straight line from the waist carry to the overhead passes within
// 0.04 m of the shoulder, and a two-bone arm folded that far doubles over: the hand sits almost on
// its own shoulder, the solved direction is ill-conditioned and the arm span 0.8–1.9 rad in a single
// frame (measured, `scripts/probes/meadow-arm.cjs`). Swept about the shoulder the radius never
// leaves 0.22–0.30 m of a 0.31 m arm, which is also simply what a club lift looks like.

// ---- the timings T-64 asks for -----------------------------------------------------------------
/** The swing's arc, inside the 0.12 s `hit`; it reaches the ground a frame early and holds there. */
const ARC_T = 0.105;
/** The recover's drag back to the shoulder. */
const DRAG_T = 0.45;
/** The half-step back in the recover, and the hop back at the top of the windup. */
const HOP_T = 0.12, HOP_D = 0.15, STEP_T = 0.30, STEP_D = 0.18;
/** The body's hunch per state; eased at 6/s, so every change spans about 0.17 s (§0 rule 3). */
const LEAN_OF: Record<GobState, number> = { idle: LEAN0, chase: 0.42, windup: 0.20, hit: 0.58, recover: 0.34, dead: LEAN0 };

// the shatter (enemies.md §2.5 "Death styles in 3D"): 8 shards, 2.0–5.5 m/s, gravity 3.75 m/s², drag
const SHARD_G = 3.75, SHARD_DRAG = 3.5, SHARD_FLIGHT = 0.5, SHARD_LIFE = 0.9;
/** The club's dust puff: 6 particles per goblin, the meadow's Ground Pound recipe, 0.6 s. */
const PUFF_N = 6, PUFF_LIFE = 0.6;

export interface GobProbe {
  i: number; state: GobState; st: number; d: number; x: number; z: number;
  /** Whether the rig is drawn this frame; a felled goblin's is not, and its pose is frozen. */
  vis: boolean;
  /** The bearing from the hero to this goblin, in degrees — the pack-spread check reads it. */
  bearing: number;
  /** The world +x axis of the root: the facing check compares it with `heading`. */
  fwd: [number, number];
  /** `heading` in radians, wrapped to [−π, π] by construction. */
  heading: number;
  /** The club head's world position, and its lowest point's height above the ground under it. */
  club: [number, number, number];
  clubLow: number;
  /** The right (club) arm's world quaternion: the probe differences it for the no-snap check. */
  armQ: [number, number, number, number];
  /** ... and its *local* quaternion, so a body turn is not read as an arm snap. */
  armL: [number, number, number, number];
  /** The torso's hunch this frame, and the root's yaw: the other two things that can snap. */
  lean: number; rotY: number;
}

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

interface GobLimb {
  arm: THREE.Group; fore: THREE.Group; hand: THREE.Group;
  /** Where the elbow would like to point. */
  pole: THREE.Vector3;
  /**
   * The bend plane's live normal-in-plane vector, carried frame to frame. The arm sweeps most of the
   * shoulder's sphere between the shoulder carry and the ground strike, so **any** fixed pole is
   * crossed somewhere in the arc, and at the crossing the elbow's roll is undetermined and spins
   * (measured: 1.9 rad in one frame). Slewing this vector instead of recomputing it from scratch is
   * the `LESSONS.md` "ease a tracked number, then set the bone from it" rule applied to the one
   * degree of freedom two-bone IK does not pin.
   */
  n: THREE.Vector3;
}
interface GobBody {
  root: THREE.Group; spin: THREE.Group; lean: THREE.Group; head: THREE.Group;
  ears: THREE.Group[]; legs: THREE.Group[]; arms: GobLimb[];
  club: THREE.Group; clubTip: THREE.Object3D; gripL: THREE.Object3D;
}

/** The three individuals: different paint, one nicked ear, three club heads (§2.2 "silhouette"). */
const VARIANTS = [
  { paint: 0, ear: 1.0, club: GOB.iron, ring: 1 },
  { paint: 1, ear: 0.68, club: GOB.slate, ring: -1 },
  { paint: 2, ear: 1.0, club: GOB.bone, ring: 1 },
];

/** The war paint: two or three bone bars on the face and the chest, one layout per goblin. */
function paintGeos(k: number): { face: THREE.BufferGeometry[]; chest: THREE.BufferGeometry[] } {
  const bar = (w: number, h: number, d: number, x: number, y: number, z: number) => B(w, h, d, GOB.bone).translate(x, y, z);
  if (k === 0) {
    return {
      face: [bar(0.014, 0.030, 0.21, 0.183, 0.020, 0), bar(0.014, 0.018, 0.10, 0.180, -0.055, 0)],
      chest: [bar(0.016, 0.026, 0.15, 0.132, 0.170, 0), bar(0.016, 0.026, 0.11, 0.128, 0.115, 0)],
    };
  }
  if (k === 1) {
    return {
      face: [bar(0.014, 0.105, 0.036, 0.180, 0.045, 0.075), bar(0.014, 0.105, 0.036, 0.180, 0.045, -0.075)],
      chest: [bar(0.016, 0.100, 0.030, 0.130, 0.145, 0.045), bar(0.016, 0.100, 0.030, 0.130, 0.145, -0.045)],
    };
  }
  return {
    face: [bar(0.014, 0.024, 0.24, 0.178, 0.075, 0), bar(0.014, 0.024, 0.19, 0.184, 0.010, 0), bar(0.014, 0.024, 0.12, 0.180, -0.055, 0)],
    chest: [bar(0.016, 0.022, 0.18, 0.132, 0.180, 0), bar(0.016, 0.022, 0.13, 0.130, 0.130, 0), bar(0.016, 0.022, 0.08, 0.126, 0.085, 0)],
  };
}

function goblinBody(v: (typeof VARIANTS)[number]): GobBody {
  const mat = makeWorldMaterial({ roughness: 0.95 });
  const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const root = new THREE.Group(), spin = new THREE.Group(), lean = new THREE.Group();
  root.add(spin); spin.add(lean);
  lean.position.y = HIP_Y;

  const paint = paintGeos(v.paint);

  // ---- the torso: hunched, a round belly under it, the bone-tooth necklace, the Forest scrap ----
  const torso: THREE.BufferGeometry[] = [
    xf(CY(0.125, 0.150, 0.20, 7, GOB.base), 0.008, 0.145),
    xf(colorize(new THREE.SphereGeometry(0.135, 8, 6), GOB.base).scale(1.05, 0.92, 1.0), 0.022, 0.055),
    xf(B(0.105, 0.085, 0.325, GOB.base), 0.000, 0.185),                       // the shoulder line
    xf(CY(0.058, 0.065, 0.07, 6, GOB.dark), 0.030, 0.245),                    // the neck
    // the bone-tooth necklace: five teeth on the front of the chest
    ...[-0.9, -0.45, 0, 0.45, 0.9].map((a) => CONE(0.020, 0.062, 3, GOB.bone).rotateX(Math.PI).translate(Math.cos(a) * 0.125, 0.205 - Math.abs(a) * 0.012, Math.sin(a) * 0.125)),
    // the rope belt (bone cord) and the Forest-cloth loincloth, front flap and back
    colorize(new THREE.TorusGeometry(0.142, 0.014, 4, 10), GOB.cord).rotateX(Math.PI / 2).translate(0.012, 0.005, 0),
    B(0.030, 0.210, 0.170, GOB.cloth).translate(0.128, -0.075, 0),
    B(0.028, 0.175, 0.150, GOB.cloth).translate(-0.122, -0.060, 0),
    ...paint.chest,
  ];
  lean.add(mesh(mergeGeos(torso)));

  // ---- the oversized head: brow, eyes, the jaw wedge and its two bone tusks ---------------------
  const head = new THREE.Group();
  head.position.set(0.06, 0.30, 0);
  const skull: THREE.BufferGeometry[] = [
    colorize(new THREE.SphereGeometry(HEAD_R, 8, 6), GOB.base),
    B(0.070, 0.055, 0.300, GOB.dark).translate(0.155, 0.062, 0),               // the brow ridge, in the dark skin
    B(0.045, 0.030, 0.055, GOB.base).translate(0.190, -0.020, 0),              // the snout
    ...[-1, 1].map((s) => B(0.020, 0.016, 0.018, GOB.dark).translate(0.202, -0.018, s * 0.030)),
    // bone-white eyes with black pupils, set under the ridge
    ...[-1, 1].map((s) => B(0.022, 0.052, 0.058, GOB.bone).translate(0.176, 0.005, s * 0.076)),
    ...[-1, 1].map((s) => B(0.016, 0.026, 0.026, GOB.pupil).translate(0.188, 0.000, s * 0.076)),
    // the jaw: a wedge under the face, the underbite, with a row of small teeth
    xf(CY(0.105, 0.075, 0.170, 5, GOB.base).rotateZ(Math.PI / 2), 0.120, -0.115, 0),
    B(0.150, 0.055, 0.180, GOB.dark).translate(0.120, -0.150, 0),
    ...[-1, 0, 1].map((s) => B(0.024, 0.030, 0.024, GOB.bone).translate(0.184, -0.088, s * 0.042)),
    ...paint.face,
  ];
  // the two bone tusks rising from the lower lip
  for (const s of [-1, 1]) skull.push(CONE(0.024, 0.080, 4, GOB.bone).rotateZ(s * 0.12).translate(0.176, -0.052, s * 0.058));
  head.add(mesh(mergeGeos(skull)));
  lean.add(head);

  // ---- the long ears: out and back, flattened, one of the three nicked ---------------------------
  const ears: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(-0.020, 0.055, s * 0.165);
    const len = EAR_L * (s === -1 ? v.ear : 1);
    const parts = [xf(CONE(0.058, len, 4, GOB.base).scale(1, 1, 0.42), 0, len / 2)];
    if (s === -1 && v.ear < 1) parts.push(B(0.030, 0.040, 0.055, GOB.dark).translate(0.020, len * 0.72, 0));  // the nick
    if (s === v.ring) parts.push(colorize(new THREE.TorusGeometry(0.026, 0.007, 4, 8), GOB.iron).rotateY(Math.PI / 2).translate(0, 0.055, 0));
    ear.add(mesh(mergeGeos(parts)));
    ear.rotation.set(s * 1.15, 0, 0.30);
    head.add(ear); ears.push(ear);
  }

  // ---- the legs: short, wide bare feet with three toes -------------------------------------------
  const legs: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(0, HIP_Y, s * 0.086);
    const foot: THREE.BufferGeometry[] = [
      xf(CY(0.052, 0.042, LEG, 5, GOB.dark), 0, -LEG / 2),
      B(0.130, 0.045, 0.100, GOB.base).translate(0.030, -LEG - 0.020, 0),
      ...[-1, 0, 1].map((k) => B(0.038, 0.032, 0.026, GOB.base).translate(0.106, -LEG - 0.024, k * 0.032)),
      ...[-1, 0, 1].map((k) => B(0.012, 0.016, 0.018, GOB.bone).translate(0.126, -LEG - 0.018, k * 0.032)),
    ];
    leg.add(mesh(mergeGeos(foot)));
    spin.add(leg); legs.push(leg);
  }

  // ---- the arms: shoulder → elbow → hand, the bible's 2 x arm x 3 ---------------------------------
  const arms: GobLimb[] = [];
  for (const s of [1, -1]) {                                    // arms[0] is the right (z = +0.155)
    const arm = new THREE.Group();
    arm.position.set(0, SH_Y, s * SH_Z);
    arm.add(mesh(mergeGeos([
      xf(colorize(new THREE.SphereGeometry(0.052, 6, 4), GOB.base), 0, 0),
      xf(CY(0.044, 0.037, UA, 5, GOB.base), 0, -UA / 2),
    ])));
    const fore = new THREE.Group();
    fore.position.y = -UA;
    fore.add(mesh(xf(CY(0.038, 0.033, FA, 5, GOB.base), 0, -FA / 2)));
    arm.add(fore);
    const hand = new THREE.Group();
    hand.position.y = -FA;
    hand.add(mesh(mergeGeos([
      xf(B(0.062, HAND, 0.055, GOB.dark), 0.004, -HAND / 2),
      xf(B(0.030, 0.028, 0.062, GOB.dark), 0.040, -0.030),      // the thumb-and-knuckles block
    ])));
    arm.add(hand);
    lean.add(arm);
    const pole = new THREE.Vector3(-0.75, -0.25, s * 0.60).normalize();
    arms.push({ arm, fore, hand, pole, n: pole.clone() });
  }

  // ---- the club: a thing it carries. Parented to the *root*, solved between contact and grip ------
  const club = new THREE.Group();
  const spikes: THREE.BufferGeometry[] = [];
  for (const a of [0, 2.094, 4.189]) {
    spikes.push(CONE(0.022, 0.080, 4, GOB.bone).translate(0, 0.040, 0).rotateZ(-Math.PI / 2).rotateY(a)
      .translate(Math.cos(a) * 0.062, CLUB_HEAD, -Math.sin(a) * 0.062));
  }
  club.add(mesh(mergeGeos([
    xf(CY(0.026, 0.033, 0.290, 6, GOB.iron), 0, 0.105),                        // the rust-iron shaft
    xf(CY(0.036, 0.030, 0.030, 6, GOB.iron), 0, -0.036),                       // the butt
    // the grip, wrapped in bone cord
    ...[-0.020, 0.014, 0.048].map((y) => colorize(new THREE.TorusGeometry(0.034, 0.008, 4, 8), GOB.cord).rotateX(Math.PI / 2).translate(0, y, 0)),
    xf(colorize(new THREE.IcosahedronGeometry(CLUB_R, 0), v.club), 0, CLUB_HEAD),
    ...spikes,
  ])));
  const clubTip = new THREE.Object3D(); clubTip.position.y = CLUB_HEAD; club.add(clubTip);
  const gripL = new THREE.Object3D(); gripL.position.y = -GRIP_2; club.add(gripL);
  root.add(club);

  return { root, spin, lean, head, ears, legs, arms, club, clubTip, gripL };
}

// ---- two-bone IK -------------------------------------------------------------------------------
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _up = new THREE.Vector3();
const _fw = new THREE.Vector3(), _w = new THREE.Vector3(), _zx = new THREE.Vector3();
const _nd = new THREE.Vector3(), _np = new THREE.Vector3();
const _sh = new THREE.Vector3(), _ga = new THREE.Vector3(), _gb = new THREE.Vector3();

/**
 * Interpolate two grip points **about the shoulder**: the direction slerped, the radius lerped, so
 * the hand sweeps an arc of the shoulder's own sphere instead of cutting the chord through it.
 */
function sweep(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, u: number, sh: THREE.Vector3): void {
  _ga.copy(a).sub(sh); _gb.copy(b).sub(sh);
  const ra = _ga.length() || 1e-6, rb = _gb.length() || 1e-6;
  _ga.multiplyScalar(1 / ra); _gb.multiplyScalar(1 / rb);
  const ang = Math.acos(clamp(_ga.dot(_gb), -1, 1));
  if (ang < 1e-4) out.copy(_ga);
  else {
    const si = Math.sin(ang);
    out.copy(_ga).multiplyScalar(Math.sin((1 - u) * ang) / si).addScaledVector(_gb, Math.sin(u * ang) / si);
  }
  out.multiplyScalar(ra + (rb - ra) * u).add(sh);
}
/** The most the elbow's bend plane may turn in one frame; the no-snap check is 0.35 rad. */
const POLE_SLEW = 0.09;
/** The hand is never solved nearer its own shoulder than this: a fully folded arm has no direction. */
const REACH_MIN = 0.13;
const _mb = new THREE.Matrix4();
/** Scratch: where the free hand goes for the idle scratch, and the solved ground grip. */
const _scratchAt = new THREE.Vector3(), _gGround = new THREE.Vector3();
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * Put `arm`'s hand on `target` (given in the arm group's **parent** space) with the elbow pushed
 * toward `pole`. `LESSONS.md` Rigs: ease the tracked number — here the grip point — and then SET the
 * bone from it; nothing accumulates, which is why the ≤ 0.35 rad/frame probe can pass at all.
 * Returns the metres by which the target was out of reach (0 when the hand is exactly on it).
 */
function ikArm(limb: GobLimb, target: THREE.Vector3): number {
  _v.copy(target).sub(limb.arm.position);
  const raw = _v.length();
  if (raw < 1e-5) return 0;
  const d = clamp(raw, REACH_MIN, UA + FA - 0.004);
  _v.multiplyScalar(1 / raw);
  const phi = Math.acos(clamp((d * d - UA * UA - FA * FA) / (2 * UA * FA), -1, 1));
  const a = Math.acos(clamp((UA * UA + d * d - FA * FA) / (2 * UA * d), -1, 1));
  // the bend plane: the pole projected off the arm's line, slewed from last frame's so that the
  // frame the arm sweeps through the pole cannot spin the elbow
  _nd.copy(limb.pole).addScaledVector(_v, -limb.pole.dot(_v));
  if (_nd.lengthSq() < 1e-6) _nd.copy(limb.n).addScaledVector(_v, -limb.n.dot(_v));
  if (_nd.lengthSq() < 1e-6) _nd.set(-_v.y, _v.x, 0);
  _nd.normalize();
  _np.copy(limb.n).addScaledVector(_v, -limb.n.dot(_v));
  if (_np.lengthSq() < 1e-6) _np.copy(_nd);
  _np.normalize();
  const turn = Math.acos(clamp(_np.dot(_nd), -1, 1));
  const k = turn > 1e-5 ? Math.min(1, POLE_SLEW / turn) : 1;
  _n.copy(_np).lerp(_nd, k);
  if (_n.lengthSq() < 1e-4) _n.copy(_nd);
  _n.normalize();
  limb.n.copy(_n);
  _up.copy(_v).multiplyScalar(Math.cos(a)).addScaledVector(_n, Math.sin(a));    // the upper arm's direction
  _fw.copy(_v).multiplyScalar(d).addScaledVector(_up, -UA).normalize();          // the forearm's direction
  _w.copy(_fw).addScaledVector(_up, -_fw.dot(_up));
  if (_w.lengthSq() < 1e-8) _w.copy(_n);
  _w.normalize();
  _up.negate();                                                                  // local +y maps to −upper
  _zx.crossVectors(_w, _up);
  _mb.makeBasis(_w, _up, _zx);
  limb.arm.quaternion.setFromRotationMatrix(_mb);
  limb.fore.rotation.set(0, 0, phi);
  return Math.abs(raw - d);
}

/** The club's dust: Points that take the curved world's bend from the shared uniforms (T-41). */
function dustPoints(n: number): { pts: THREE.Points; pos: Float32Array; alpha: Float32Array; commit: () => void } {
  const pos = new Float32Array(n * 3), alpha = new Float32Array(n);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    // uCurve and uCurveCenter are the *same objects* `material.ts` hands every world material, by
    // reference, so the puff follows when the scene re-centres the curve each frame.
    uniforms: {
      uColor: { value: new THREE.Color(DUST).multiplyScalar(1.5) }, uSize: { value: 24 },
      uCurve: WORLD_U.uCurve, uCurveCenter: WORLD_U.uCurveCenter,
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aAlpha; varying float vA; uniform float uSize; uniform float uCurve; uniform vec2 uCurveCenter;
      void main(){ vA = aAlpha; vec4 w = modelMatrix * vec4(position, 1.0);
        float d = length(w.xz - uCurveCenter); w.y -= uCurve * d * d;
        vec4 mv = viewMatrix * w; gl_PointSize = uSize * (18.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.1, d) * vA; gl_FragColor = vec4(uColor, a); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.layers.enable(BLOOM_LAYER);
  return {
    pts, pos, alpha,
    commit: () => {
      (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (g.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    },
  };
}

const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

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

  // the club's dust puff: six particles per goblin (the Ground Pound's recipe, half the count)
  const puff = dustPoints(PUFF_N * home.length);

  // the cone telegraph: a 70° half-angle sector 1.0 m long that fills from the goblin outward.
  // CircleGeometry's sector runs about +x in its own XY plane; after rotateX(−π/2) that is the
  // goblin's own forward axis, which is now the axis the body is built along.
  const coneGeo = new THREE.CircleGeometry(REACH, 16, -1.2217, 2.4435); // ±70°
  coneGeo.rotateX(-Math.PI / 2);

  // `state` starts at `idle` and must infer as the whole `GobState` union, not as the literal
  // (a `const` annotated with a union is still narrowed to its initialiser at the use site), so it
  // is spread in from a typed holder
  const start: { state: GobState } = { state: 'idle' };
  const mobs = home.map(([hx, hz], i) => {
    const v = VARIANTS[i % VARIANTS.length]!;
    const body = goblinBody(v);
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(GOB.base).multiplyScalar(2.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    cone.position.y = 0.05; cone.layers.enable(BLOOM_LAYER); cone.visible = false;
    body.root.add(cone);
    group.add(body.root);
    // the idle heading looks out of the camp at the meadow, so the three read as a camp watch
    const outB = Math.atan2(44 - hx, 0 - hz);
    return {
      ...body, cone, x: hx, z: hz, heading: outB, ...start, st: 0,
      home: [hx, hz] as [number, number], homeB: outB, phase: i * 0.7, deadAt: -100,
      slot: i, apprB: outB, hold: 0.05 + r() * (HOLD_MAX - 0.05),
      leanNow: LEAN0, twoHand: 0, back: 0,
      millX: hx, millZ: hz, millAt: 1.5 + r() * 4, millSpd: 0,
      scratchAt: 2.5 + r() * 4, lookAt: 1.0 + r() * 3, earFlickAt: 1.2 + r() * 4,
      puffT: -100, puffX: 0, puffY: 0, puffZ: 0,
    };
  });
  group.add(puff.pts);

  const poiV = new THREE.Vector3(), heroAt = new THREE.Vector3();
  const gripW = new THREE.Vector3(), gripLW = new THREE.Vector3(), tgt = new THREE.Vector3();
  const gDir = new THREE.Vector3(), gPos = new THREE.Vector3(), gEnd = new THREE.Vector3();
  const clubQ = new THREE.Quaternion(), tipW = new THREE.Vector3(), armW = new THREE.Quaternion();
  const UPY = new THREE.Vector3(0, 1, 0);
  let poiSet = false, killed = 0, ikMiss = 0;

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
    ikMiss = 0;
    for (const m of mobs) {
      if (m.state === 'dead' && m.deadAt === -1) { m.deadAt = t; shatter(m.x, groundY(m.x, m.z), m.z, fxT); }
      const d = Math.hypot(hero.x - m.x, hero.z - m.z);
      const was = m.state;
      // the transitions and the skid brake, from `goblin-step.ts`; the two side effects it can ask
      // for are the club's connect and the 6 s walk back out of the palisade's gap
      const step = gobStep(m.state, m.st, d, dt, speed.value, t - m.deadAt, m.hold);
      m.state = step.state; m.st = step.st;
      if (m.state === 'chase' && was !== 'chase') m.apprB = Math.atan2(m.x - hero.x, m.z - hero.z);
      for (const e of step.events) {
        if (e === 'hit') onHit();
        else { m.x = gap.x + (r() - 0.5); m.z = gap.z + (r() - 0.5); m.root.visible = true; m.apprB = Math.atan2(m.x - hero.x, m.z - hero.z); }
      }

      // ---- steering ------------------------------------------------------------------------------
      const moving = step.moving;
      if (moving) {
        // T-64: each goblin runs at its **own slot** on the 0.9 m ring, so the three fan out and
        // arrive abreast. The approach bearing is stamped when the chase starts and only tracks the
        // hero while the goblin is still far out, so a flanker cannot spiral round its own target.
        // the approach bearing is stamped once, when the chase opens, and never tracked: a slot that
        // follows the goblin's *current* bearing runs away from it as it flanks, and the goblin
        // spirals right round the hero (measured: 180° of travel and a 13 s approach from 18 m)
        // the spiral: aim at the slot's own radial at 88 % of the current distance, so the goblin
        // swings onto its side of the hero while it closes instead of cutting the chord
        const slot = slotPoint(hero.x, hero.z, m.apprB, m.slot, Math.max(SLOT_R, d * SLOT_CLOSE));
        const toSlot = Math.atan2(slot.x - m.x, slot.z - m.z);
        const toHero = Math.atan2(hero.x - m.x, hero.z - m.z);
        // only in the last 0.3 m does it stop steering at the slot and square up on the hero
        const kHero = 1 - smoothstep(d, 0.85, 1.15);
        const want = wrapPi(toSlot + wrapPi(toHero - toSlot) * kHero);
        m.heading = wrapPi(m.heading + wrapPi(want - m.heading) * Math.min(1, dt * 7));
        m.x += Math.sin(m.heading) * speed.value * step.speedScale * dt;
        m.z += Math.cos(m.heading) * speed.value * step.speedScale * dt;
      } else if (m.state === 'idle') {
        // T-64's idle: a mill inside 1.5 m of home, on a schedule of its own, then a stop
        if (t > m.millAt) {
          const a = r() * 6.283, rr = 0.5 + r() * 1.0;
          m.millX = m.home[0] + Math.cos(a) * rr; m.millZ = m.home[1] + Math.sin(a) * rr;
          m.millAt = t + 4 + r() * 4;
        }
        const md = Math.hypot(m.millX - m.x, m.millZ - m.z);
        // an eased start and an eased stop: nothing pops (§0 rule 3)
        const wantSpd = md > 0.12 ? 0.55 * smoothstep(md, 0.12, 0.45) : 0;
        m.millSpd += (wantSpd - m.millSpd) * Math.min(1, dt * 3.0);
        const wantB = md > 0.12 ? Math.atan2(m.millX - m.x, m.millZ - m.z) : m.homeB + 0.28 * Math.sin(t * 0.37 + m.phase);
        m.heading = wrapPi(m.heading + wrapPi(wantB - m.heading) * Math.min(1, dt * 2.2));
        m.x += Math.sin(m.heading) * m.millSpd * dt;
        m.z += Math.cos(m.heading) * m.millSpd * dt;
      } else if (m.state !== 'dead') {
        const want = Math.atan2(hero.x - m.x, hero.z - m.z);
        m.heading = wrapPi(m.heading + wrapPi(want - m.heading) * Math.min(1, dt * 5));
      }

      // the hop back at the top of the windup and the half step back in the recover, both on a sine
      // envelope so they start and end at zero speed and integrate to exactly HOP_D / STEP_D
      let backV = 0;
      if (m.state === 'windup' && m.st < HOP_T) backV = (HOP_D * Math.PI) / (2 * HOP_T) * Math.sin((Math.PI * m.st) / HOP_T);
      else if (m.state === 'recover' && m.st < STEP_T) backV = (STEP_D * Math.PI) / (2 * STEP_T) * Math.sin((Math.PI * m.st) / STEP_T);
      if (backV > 0) { m.x -= Math.sin(m.heading) * backV * dt; m.z -= Math.cos(m.heading) * backV * dt; }
      m.back = backV;

      // goblins never overlap: the bible's 2.5 m/s push, opened from 0.6 m to T-64's 0.7 m
      for (const o of mobs) {
        if (o === m || o.state === 'dead' || m.state === 'dead') continue;
        const dx = m.x - o.x, dz = m.z - o.z, dd = Math.hypot(dx, dz);
        if (dd < SEP_R && dd > 1e-3) {
          const push = SEP_SPD * 0.5 * dt * smoothstep(SEP_R - dd, 0, 0.12);
          m.x += (dx / dd) * push; m.z += (dz / dd) * push;
        }
      }

      // ---- the body pose --------------------------------------------------------------------------
      // a felled goblin is `visible = false` for its whole 6 s: freeze the rig rather than pose a
      // thing nobody draws (and rather than let the probe read a hidden rig's snap as a pop)
      if (m.state === 'dead') continue;
      m.root.position.set(m.x, groundY(m.x, m.z), m.z);
      m.root.rotation.y = m.heading + FACE_OFF;
      const run = moving ? 1 : 0;
      const w = t * 11 + m.phase;                                   // the sprint's own rate
      const breath = Math.sin(t * 1.5 + m.phase);                   // idle rate 1 — 1.5 rad/s
      const idleSway = Math.sin(t * 0.83 + m.phase * 2);            // idle rate 2 — 0.83 rad/s
      m.leanNow += (LEAN_OF[m.state] - m.leanNow) * Math.min(1, dt * 6);
      m.lean.rotation.z = -(m.leanNow + 0.03 * breath * (1 - run));
      m.spin.position.y = 0.025 * Math.abs(Math.sin(w)) * run - 0.05 * run - (m.state === 'hit' ? 0.06 * smoothstep(m.st, 0, ARC_T) : 0);
      m.legs[0]!.rotation.z = 0.85 * Math.sin(w) * run + 0.05 * idleSway * (1 - run);
      m.legs[1]!.rotation.z = -0.85 * Math.sin(w) * run - 0.05 * idleSway * (1 - run);

      // the ears trail in the run and flick at idle; the flick is a 0.35 s eased envelope that rises
      // and falls to zero (sin πu), so the reschedule can never show as a snap
      if (t > m.earFlickAt) m.earFlickAt = t + 3 + r() * 3;
      const flickU = clamp(m.earFlickAt - t > 0.35 ? 0 : 1 - (m.earFlickAt - t) / 0.35, 0, 1);
      const flick = Math.sin(Math.PI * flickU) * 0.45 * (1 - run);
      for (const [k, ear] of m.ears.entries()) {
        const s = k === 0 ? -1 : 1;
        ear.rotation.z = 0.30 + 0.55 * run + 0.10 * idleSway * (1 - run);
        ear.rotation.x = s * (1.15 + 0.18 * Math.sin(w * 0.6 + k) * run) + s * flick * (k === 0 ? 1 : 0.7);
      }

      // the head: forward in the sprint, a look at the hero every 3–6 s at idle, a shake in recover
      if (t > m.lookAt) m.lookAt = t + 3 + r() * 3;
      const lookU = clamp((m.lookAt - t) > 1.4 ? 0 : 1 - (m.lookAt - t) / 1.4, 0, 1);
      const lookYaw = m.state === 'idle'
        ? wrapPi(Math.atan2(hero.x - m.x, hero.z - m.z) - m.heading) * clamp(Math.sin(Math.PI * lookU) * 1.2, 0, 1) * 0.7
        : 0;
      const shakeU = m.state === 'recover' ? clamp(m.st / 0.35, 0, 1) : 1;
      const shake = m.state === 'recover' ? 0.30 * Math.sin(shakeU * Math.PI * 3) * Math.sin(Math.PI * shakeU) : 0;
      m.head.rotation.set(0, clamp(lookYaw, -0.7, 0.7) + shake, -0.22 * run + 0.035 * breath * (1 - run));

      // ---- the club: solved between its contact point and the grip (T-42) --------------------------
      const gy0 = groundY(m.x, m.z);
      const ahead = groundY(m.x + Math.sin(m.heading) * STRIKE_X, m.z + Math.cos(m.heading) * STRIKE_X);
      // the ground pose, solved: put the head where it has to land, then back off along the shaft
      gEnd.set(STRIKE_X, ahead - gy0 + STRIKE_Y, 0);
      // the shoulder, this frame, in the root's own frame (the lean and the bob both move it)
      _sh.set(SH_Y * Math.sin(m.leanNow), HIP_Y + m.spin.position.y + SH_Y * Math.cos(m.leanNow), SH_Z);
      _gGround.copy(gEnd).addScaledVector(P_GND_D, -CLUB_HEAD);       // the solved ground grip
      if (m.state === 'windup') {
        const u = smoothstep(m.st, 0, WINDUP);
        sweep(gPos, P_CARRY_G, P_OVER_G, u, _sh);
        gDir.copy(P_CARRY_D).lerp(P_OVER_D, u).normalize();
      } else if (m.state === 'hit') {
        // the arc: eased, but with enough linear in it that no frame turns the arm more than 0.35 rad
        const x = clamp(m.st / ARC_T, 0, 1);
        const u = 0.5 * x + 0.5 * (x * x * (3 - 2 * x));
        gDir.copy(P_OVER_D).lerp(P_GND_D, u).normalize();
        sweep(gPos, P_OVER_G, _gGround, u, _sh);
      } else if (m.state === 'recover') {
        const u = smoothstep(m.st, 0, DRAG_T);
        gDir.copy(P_GND_D).lerp(P_CARRY_D, u).normalize();
        sweep(gPos, _gGround, P_CARRY_G, u, _sh);
      } else {
        // the carry: on the right shoulder, with a slow sway on its own rate (2.1 rad/s)
        gPos.copy(P_CARRY_G);
        gDir.copy(P_CARRY_D).addScaledVector(UPY, 0.02 * Math.sin(t * 2.1 + m.phase)).normalize();
      }
      m.club.position.copy(gPos);
      m.club.quaternion.copy(clubQ.setFromUnitVectors(UPY, gDir));
      m.root.updateMatrixWorld(true);

      // ---- the hands onto the club ----------------------------------------------------------------
      const wantTwo = m.state === 'windup' || m.state === 'hit' || (m.state === 'recover' && m.st < 0.35) ? 1 : 0;
      m.twoHand += (wantTwo - m.twoHand) * Math.min(1, dt * 6);
      m.club.getWorldPosition(gripW);
      m.gripL.getWorldPosition(gripLW);
      ikMiss = Math.max(ikMiss, ikArm(m.arms[0]!, m.lean.worldToLocal(tgt.copy(gripW))));
      // the left arm: on the club when the swing is two-handed, otherwise back in the sprint, at the
      // side at idle, and up at the head for the scratch — one eased target point, never a pose
      if (t > m.scratchAt) m.scratchAt = t + 4 + r() * 3;
      const scr = m.state === 'idle' ? clamp((m.scratchAt - t) > 0.9 ? 0 : 1 - (m.scratchAt - t) / 0.9, 0, 1) : 0;
      const scratch = Math.sin(Math.PI * scr);
      const swing = -0.95 * run + 0.30 * Math.sin(w + 3) * run + 0.10 * idleSway * (1 - run);
      tgt.set(
        Math.sin(swing) * 0.29,
        SH_Y - Math.cos(swing) * 0.29,
        -SH_Z - 0.02,
      );
      // the scratch: the free hand eases up beside the head
      tgt.lerp(_scratchAt.set(0.10, 0.36, -0.12), scratch * 0.9);
      m.lean.localToWorld(tgt);
      tgt.lerp(gripLW, m.twoHand);
      ikMiss = Math.max(ikMiss, ikArm(m.arms[1]!, m.lean.worldToLocal(tgt)));

      // ---- the telegraph, the dust and the point of interest ---------------------------------------
      const showCone = m.state === 'windup';
      m.cone.visible = showCone;
      if (showCone) { const u = m.st / WINDUP; m.cone.scale.set(u, 1, u); (m.cone.material).opacity = 0.22 + 0.5 * u; }
      // the strike's dust puff, at the club head, on the exempt clock (T-31)
      if (m.state === 'hit' && m.puffT < fxT - PUFF_LIFE && m.st >= ARC_T - dt) {
        m.clubTip.getWorldPosition(tipW);
        m.puffT = fxT; m.puffX = tipW.x; m.puffY = groundY(tipW.x, tipW.z); m.puffZ = tipW.z;
      }
      if (!poiSet) { poiV.set(m.x, 0.7, m.z); poiSet = true; }   // dead goblins `continue` above
    }

    // the six-particle puffs, out fast and settling (the meadow's Ground Pound recipe)
    for (const [gi, m] of mobs.entries()) {
      for (let i = 0; i < PUFF_N; i++) {
        const k = gi * PUFF_N + i;
        const age = fxT - m.puffT - i * 0.004;
        const alive = m.puffT > 0 && age > 0 && age < PUFF_LIFE;
        const spread = 0.10 + (1 - Math.exp(-age * 4.2)) * 0.62;
        const a = i * 1.9 + gi;
        puff.pos[k * 3] = m.puffX + Math.cos(a) * spread;
        puff.pos[k * 3 + 1] = m.puffY + 0.08 + age * 0.72 - age * age * 0.9;
        puff.pos[k * 3 + 2] = m.puffZ + Math.sin(a) * spread;
        puff.alpha[k] = alive ? Math.min(1, age / 0.015) * (1 - age / PUFF_LIFE) * 0.9 : 0;
      }
    }
    puff.commit();

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

  const fwdOf = (m: (typeof mobs)[number]): [number, number] => {
    const e = new THREE.Vector3(1, 0, 0).applyQuaternion(m.root.getWorldQuaternion(new THREE.Quaternion()));
    return [Number(e.x.toFixed(5)), Number(e.z.toFixed(5))];
  };

  return {
    group, speed, strike, update,
    sendAll: () => { for (const m of mobs) if (m.state === 'idle') { m.state = 'chase'; m.st = 0; } return 'they come'; },
    poi: () => (poiSet ? poiV : null),
    hud: () => `goblins ${mobs.map((m) => m.state).join('/')} · brake to ${BRAKE_TO} m, windup at ${REACH} m · slots r ${SLOT_R} m at ±90° · sep ${SEP_R} m · hit ${HIT_HOLD} s arc · shake 4/0.15 · spd ${speed.value.toFixed(3)} m/s · felled ${killed} · ik miss ${ikMiss.toFixed(3)} m`,
    probe: () => ({
      goblins: mobs.map((m, i) => {
        m.clubTip.getWorldPosition(tipW);
        m.arms[0]!.arm.getWorldQuaternion(armW);
        return {
          i, state: m.state, st: m.st, vis: m.root.visible,
          d: Math.hypot(heroAt.x - m.x, heroAt.z - m.z),
          x: m.x, z: m.z,
          bearing: (Math.atan2(m.x - heroAt.x, m.z - heroAt.z) * 180) / Math.PI,
          fwd: fwdOf(m), heading: m.heading,
          club: [tipW.x, tipW.y, tipW.z] as [number, number, number],
          clubLow: tipW.y - CLUB_R - groundY(tipW.x, tipW.z),
          armQ: [armW.x, armW.y, armW.z, armW.w] as [number, number, number, number],
          armL: [m.arms[0]!.arm.quaternion.x, m.arms[0]!.arm.quaternion.y, m.arms[0]!.arm.quaternion.z, m.arms[0]!.arm.quaternion.w] as [number, number, number, number],
          lean: m.lean.rotation.z, rotY: m.root.rotation.y,
        };
      }),
      shardsLive, shardMaxY, felled: killed,
    }),
  };
}
