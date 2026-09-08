// CS-04's motion schedule: how fast the Green Meanie is going, how far she has flown, and how she
// bounces. Numbers only — this module imports nothing, so the unit tests can call the same code the
// scene flies (docs/qa/briefs/opus-fixes-flight.md fix 1, check 1).
//
// Why it exists: the first pass sampled the spline parametrically (`getPoint(u)` with `u` lerped
// between waypoint indices per beat), so the speed came from the *waypoint spacing* — 40–96 m/s
// with six step changes at beat boundaries (OPUS_EXPERIMENT_VERDICT.md §3.3). The fix is the other
// way round: a speed schedule in metres per second, integrated to an arc length, and the spline
// sampled by `getPointAt(s / L)`. Speed is then a property of the schedule and the path only says
// where.
//
// The numbers are npcs.md §2.2.4 (design values), for the `repaired` plane:
//   Takeoff roll     0 → 12 m/s over 3.0 s (18 m), rotate at 12 m/s
//   Cruise           14 m/s
//   Landing approach 12 m/s at 3.5 m/s descent, flare at 2 m, touch at 10 m/s
//   Roll-out         10 → 0 m/s over 3.5 s
// Every change of speed runs on a smoothstep, so nothing pops (LESSONS.md §0 rule 3) and the
// per-frame change at 60 Hz stays two orders below the 1.5 m/s the brief allows.

/** `curve.getLength()` of `flight.ts`'s PATH, measured (the scene warns if the two disagree). */
export const PATH_LENGTH = 329.0;
/** npcs.md §2.2.4: cruise `repaired` 14 m/s. */
export const CRUISE_SPEED = 14;
/** npcs.md §2.2.4: rotate at 12 m/s; the approach flies at 12 m/s. */
export const ROTATE_SPEED = 12;
/** npcs.md §2.2.4: touch at 10 m/s. */
export const TOUCH_SPEED = 10;
/** npcs.md §2.2.4: max bank, `repaired`, in degrees. */
export const MAX_BANK_DEG = 35;

export interface Leg {
  /** What the HUD calls it. */
  name: string;
  /** Seconds. */
  dur: number;
  /** Speed at the start and at the end, m/s; the leg eases between them on a smoothstep. */
  v0: number;
  v1: number;
}

const smooth = (u: number): number => u * u * (3 - 2 * u);

// Every leg but the cruise is fixed by §2.2.4. A smoothstep leg covers `dur × (v0 + v1) / 2` metres,
// the same as a linear one, so the fixed distance is exact.
const BEFORE_CRUISE: Leg[] = [
  { name: 'takeoff roll', dur: 3.0, v0: 0, v1: ROTATE_SPEED },
  { name: 'rotate and climb', dur: 3.5, v0: ROTATE_SPEED, v1: CRUISE_SPEED },
];
const AFTER_CRUISE: Leg[] = [
  { name: 'approach', dur: 2.5, v0: CRUISE_SPEED, v1: ROTATE_SPEED },
  { name: 'final', dur: 2.0, v0: ROTATE_SPEED, v1: ROTATE_SPEED },
  { name: 'flare', dur: 1.5, v0: ROTATE_SPEED, v1: TOUCH_SPEED },
  { name: 'roll-out', dur: 3.5, v0: TOUCH_SPEED, v1: 0 },
];
const legDistance = (l: Leg): number => (l.dur * (l.v0 + l.v1)) / 2;
const FIXED_DISTANCE = [...BEFORE_CRUISE, ...AFTER_CRUISE].reduce((a, l) => a + legDistance(l), 0);

/** The cruise leg is whatever length of path the fixed legs leave, flown at 14 m/s. */
export const CRUISE_DUR = Math.round(((PATH_LENGTH - FIXED_DISTANCE) / CRUISE_SPEED) * 1000) / 1000;

export const LEGS: readonly Leg[] = [
  ...BEFORE_CRUISE,
  { name: 'cruise', dur: CRUISE_DUR, v0: CRUISE_SPEED, v1: CRUISE_SPEED },
  ...AFTER_CRUISE,
];

/** The whole cutscene clock, in seconds. */
export const FLIGHT_LEN = LEGS.reduce((a, l) => a + l.dur, 0);
/** The wheels touch at the end of the flare; the roll-out is the last leg. */
export const TOUCHDOWN = FLIGHT_LEN - AFTER_CRUISE[AFTER_CRUISE.length - 1]!.dur;
/** The cruise window, for the "cruise is 14 ± 2 m/s" check. */
export const CRUISE_START = BEFORE_CRUISE.reduce((a, l) => a + l.dur, 0);
export const CRUISE_END = CRUISE_START + CRUISE_DUR;

/** Metres per second at cutscene second `t`. 0 before the roll and after the plane is parked. */
export function speedAt(t: number): number {
  if (!(t > 0)) return 0;
  let t0 = 0;
  for (const l of LEGS) {
    if (t < t0 + l.dur) return l.v0 + (l.v1 - l.v0) * smooth((t - t0) / l.dur);
    t0 += l.dur;
  }
  return 0;
}

/**
 * Metres flown by cutscene second `t`: the exact integral of `speedAt`, so it is monotonic and has
 * no step anywhere. (∫ smoothstep = u³ − u⁴/2 over [0, 1], which is 1/2 at u = 1.)
 */
export function distanceAt(t: number): number {
  let t0 = 0, d = 0;
  for (const l of LEGS) {
    if (t <= t0) return d;
    const dt = Math.min(t - t0, l.dur);
    const u = dt / l.dur;
    d += l.v0 * dt + (l.v1 - l.v0) * l.dur * (u ** 3 - u ** 4 / 2);
    t0 += l.dur;
  }
  return d;
}

/** The whole path, in metres: `distanceAt(FLIGHT_LEN)`, and equal to PATH_LENGTH by construction. */
export const TOTAL_DISTANCE = distanceAt(FLIGHT_LEN);

/**
 * The landing bounces (npcs.md §2.3.7: "Every landing bounces, including the repaired plane's").
 * Two hops 0.6 s apart, the second half the first — 1 : 0.5, easing out, meeting at zero, and back
 * on the ground for good 1.2 s after touchdown. The first pass had three bumps, a ratio of 0.33 and
 * a hard cut to zero at 1.4 s.
 *
 * The hop shape is `sin²(πu)`, not `sin(πu)`: it peaks at the same height but leaves and meets the
 * ground with zero vertical speed, so the two hops join and the bounce ends without a corner. A
 * ballistic hop would land at 5 m/s and the frame after touchdown would be a step.
 */
export const BOUNCES: readonly { at: number; height: number; dur: number }[] = [
  { at: 0.0, height: 1.0, dur: 0.6 },
  { at: 0.6, height: 0.5, dur: 0.6 },
];

/** Metres above the wheels' resting height at cutscene second `t`; 0 outside the two hops. */
export function bounceY(t: number): number {
  const a = t - TOUCHDOWN;
  let y = 0;
  for (const b of BOUNCES) {
    const u = (a - b.at) / b.dur;
    if (u > 0 && u < 1) y += b.height * Math.sin(Math.PI * u) ** 2;
  }
  return y;
}

/** The leg's name at second `t`; 'parked' once the roll-out is over. */
export function legAt(t: number): string {
  let t0 = 0;
  for (const l of LEGS) {
    if (t < t0 + l.dur) return l.name;
    t0 += l.dur;
  }
  return 'parked';
}

export interface ScheduleSample { t: number; speed: number; distance: number; bounce: number }

/** Every frame of the flight at `hz`, inclusive of both ends: what check 1 and the tests sample. */
export function sampleSchedule(hz = 60): ScheduleSample[] {
  const n = Math.round(FLIGHT_LEN * hz);
  const out: ScheduleSample[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / hz;
    out.push({ t, speed: speedAt(t), distance: distanceAt(t), bounce: bounceY(t) });
  }
  return out;
}

export interface ScheduleStats {
  hz: number; frames: number;
  /** Largest change of speed between two consecutive frames, m/s, and when it happens. */
  maxSpeedStep: number; maxSpeedStepAt: number;
  cruiseMin: number; cruiseMax: number;
  finalSpeed: number;
  /** The first second from which the speed is 0 and stays 0. */
  speedZeroFrom: number;
  /** `distanceAt` never decreases, and the smallest step it takes (0 only while parked). */
  distanceMonotonic: boolean; totalDistance: number;
  /** The bounce: its local maxima in order, the second/first ratio, and where it ends. */
  bouncePeaks: number[]; bounceRatio: number; bounceEnd: number;
  /** The largest per-frame change of the bounce, and the largest change *of that change* — the
   *  discontinuity measure: a cut shows up here, a fast but continuous hop does not. */
  maxBounceStep: number; maxBounceJerk: number;
}

/** The check 1 / check 2 numbers, computed from `sampleSchedule` so the test runs the same code. */
export function scheduleStats(hz = 60): ScheduleStats {
  const s = sampleSchedule(hz);
  let maxSpeedStep = 0, maxSpeedStepAt = 0, monotonic = true;
  let cruiseMin = Infinity, cruiseMax = -Infinity;
  let maxBounceStep = 0, maxBounceJerk = 0;
  const peaks: number[] = [];
  for (let i = 1; i < s.length; i++) {
    const dv = Math.abs(s[i]!.speed - s[i - 1]!.speed);
    if (dv > maxSpeedStep) { maxSpeedStep = dv; maxSpeedStepAt = s[i]!.t; }
    if (s[i]!.distance < s[i - 1]!.distance - 1e-12) monotonic = false;
    const db = Math.abs(s[i]!.bounce - s[i - 1]!.bounce);
    if (db > maxBounceStep) maxBounceStep = db;
    if (i > 1) {
      const j = Math.abs((s[i]!.bounce - s[i - 1]!.bounce) - (s[i - 1]!.bounce - s[i - 2]!.bounce));
      if (j > maxBounceJerk) maxBounceJerk = j;
    }
    if (s[i]!.t >= CRUISE_START && s[i]!.t <= CRUISE_END) {
      cruiseMin = Math.min(cruiseMin, s[i]!.speed); cruiseMax = Math.max(cruiseMax, s[i]!.speed);
    }
    if (i + 1 < s.length && s[i]!.bounce > s[i - 1]!.bounce && s[i]!.bounce >= s[i + 1]!.bounce) peaks.push(s[i]!.bounce);
  }
  let zeroFrom = FLIGHT_LEN;
  for (let i = s.length - 1; i >= 0; i--) { if (s[i]!.speed > 1e-9) break; zeroFrom = s[i]!.t; }
  return {
    hz, frames: s.length,
    maxSpeedStep, maxSpeedStepAt,
    cruiseMin, cruiseMax,
    finalSpeed: s[s.length - 1]!.speed,
    speedZeroFrom: zeroFrom,
    distanceMonotonic: monotonic, totalDistance: s[s.length - 1]!.distance,
    bouncePeaks: peaks, bounceRatio: peaks.length > 1 ? peaks[1]! / peaks[0]! : NaN,
    bounceEnd: s[s.length - 1]!.bounce,
    maxBounceStep, maxBounceJerk,
  };
}
