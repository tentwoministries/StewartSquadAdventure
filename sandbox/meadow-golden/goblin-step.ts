// The goblin state machine's *pure* step: plain numbers in, plain numbers out, no three import and
// no scene objects, so the loop `enemies.md` §2.4 specifies can be run at 60 Hz in a unit test
// instead of only through a stepped browser probe (`scripts/probes/meadow-goblins.cjs`).
//
// It exists because of the defect in `LESSONS.md` Rigs row 5: "a brake that eases to zero at the
// trigger distance never crosses it" — three goblins parked at 1.00 m for sixteen seconds. That bug
// lived in two numbers (the brake's target and the windup's trigger) that were only ever exercised
// through a renderer. Here they are testable.
//
// `goblins.ts` owns everything this file deliberately does not: the meshes, the heading, the
// separation push, the shards, and the two side effects the step only *names* (`hit`, `respawn`).

export type GobState = 'idle' | 'chase' | 'windup' | 'hit' | 'recover' | 'dead';

/** What the step asks the caller to do this frame; the caller owns the effect. */
export type GobEvent =
  /** The club connects: the hero takes the hit (ring flash, screen shake). */
  | 'hit'
  /** The 6 s loop is up: put the goblin back at the palisade's gap and show it again. */
  | 'respawn';

/** `enemies.md` §2.5: goblin `spd` 85 px/s at §2.2's 40 px per m. */
export const SPD = 2.125;
/** `enemies.md` §2.4 melee row, Runt rig: the windup is 0.35 s (the cone telegraph fills over it). */
export const WINDUP = 0.35;
/**
 * The `hit` tick: the club-down beat before the recover. `enemies.md` §2.4 makes the damage land at
 * the *end of the windup* (one tick, on entering `hit`); this number is only how long the swing has
 * to read as an eased arc, so T-64's 0.12 s arc raised it from 0.08 (the brief allows 0.08 → 0.12).
 */
export const HIT_HOLD = 0.12;
/** The rest of `enemies.md` §2.5's `cd` 1.0 s after the windup and the tick, as the demo plays it. */
export const RECOVER = 0.65;
/** `enemies.md` §2.2: melee reach has a 1.0 m floor (strict conversion of `rng` 30 px is 0.75 m). */
export const REACH = 1.0;
/** `enemies.md` §2.1 row 1: the goblin's hit radius, `sz` 10 px. */
export const HIT_R = 0.25;
/** `enemies.md` §2.2 perception: a goblin notices a hero within 14 m. */
export const NOTICE = 14;
/** The demo's loop: a felled goblin walks back out of the palisade's gap 6 s later. */
export const RESPAWN = 6;
/** The skid's length in seconds; the brake spans one skid's worth of travel. */
export const SKID = 0.2;
/**
 * The skid's target distance. `enemies.md` §2.4 triggers the windup at the cone's line (`REACH`),
 * and a brake that eases to zero *at* that line converges on it and never crosses it — the defect
 * the review found. The skid aims 0.2 m past the line, so the 0.2 s skid ends inside reach and the
 * trigger stays at the bible's number.
 */
export const BRAKE_TO = REACH - 0.2;

// ---- T-64: the pack fans out instead of arriving in a file -----------------------------------
/**
 * The ring, round the hero, that the three goblins aim at. It is deliberately **inside** `REACH`:
 * a slot ring at or outside the trigger line is the `LESSONS.md` never-attacks defect wearing a
 * different hat (the goblin arrives at its slot and `d` stops falling above 1.0 m). At 0.9 m every
 * goblin crosses the trigger on its way in.
 */
export const SLOT_R = 0.9;
/**
 * The slot bearings, relative to a goblin's own approach bearing. Three points on a 0.9 m ring must
 * be ≥ 1.2 m apart pairwise (the brief's check), which needs an adjacent gap of at least
 * 2·asin(0.6 / 0.9) = 83.6°; ±90° is the round number above it and gives 1.273 m adjacent,
 * 1.800 m across. The brief's ±45° would have put adjacent slots 0.689 m apart — a file, not a fan.
 */
export const SLOT_OFF = [-Math.PI / 2, 0, Math.PI / 2];
/** `enemies.md` §2.4 pushes two runts apart below r₁+r₂+0.1 = 0.6 m; T-64 opens the demo's to 0.7. */
export const SEP_R = 0.7;
/** `enemies.md` §2.4: the push runs at 100 px/s = 2.5 m/s. */
export const SEP_SPD = 2.5;
/**
 * `enemies.md` §2.5: `atkT = rnd(0, cd)` at spawn "so a pack never swings in unison". The demo's
 * form is a per-goblin hold: the seconds it must have spent in `chase` before the windup may fire.
 * Capped well under `cd` 1.0 s so a swing is staggered, never cancelled, and under the 0.35 s
 * windup so three goblins that arrive together still share a frame of telegraph.
 */
export const HOLD_MAX = 0.3;

/**
 * The pack slot for goblin `i`, on a ring round the hero, given its approach bearing. `rad` defaults
 * to the 0.9 m ring; the scene passes a **larger** radius while the goblin is still far out, so the
 * three swing onto their own radials on the way in and arrive already spread. Aiming straight at a
 * 0.9 m slot from 15 m away does not fan anything: the chord to a slot 90° round passes close to the
 * hero, `d` crosses the trigger early and the goblin swings from wherever it happened to be
 * (measured: 0.60 m apart, a 65° bearing span).
 */
export function slotPoint(hx: number, hz: number, apprB: number, i: number, rad = SLOT_R): { x: number; z: number } {
  const b = apprB + (SLOT_OFF[((i % SLOT_OFF.length) + SLOT_OFF.length) % SLOT_OFF.length] ?? 0);
  return { x: hx + Math.sin(b) * rad, z: hz + Math.cos(b) * rad };
}
/** How far in the spiral aims each frame: the slot radial at 88 % of the goblin's current distance. */
export const SLOT_CLOSE = 0.88;

/**
 * `THREE.MathUtils.smoothstep`, copied so this file imports nothing (verified against
 * `node_modules/three/src/math/MathUtils.js` L167–176, three r0.185.1: `x <= min → 0`,
 * `x >= max → 1`, else `t = (x - min) / (max - min)`, `t * t * (3 - 2 * t)`).
 */
export function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

/**
 * The skid brake: 1 while the goblin is more than one skid past the line, easing to 0 at `BRAKE_TO`,
 * which is 0.2 m *inside* `REACH`. So it is still strictly positive everywhere the windup has not
 * yet triggered, which is the property `goblins.test.ts` pins.
 */
export function brakeAt(d: number, speed: number): number {
  return smoothstep(d, BRAKE_TO, BRAKE_TO + speed * SKID);
}

export interface GobOut {
  /** The state after this frame's transition. */
  state: GobState;
  /** Time spent in that state, in seconds (0 on the frame it is entered). */
  st: number;
  /** Multiplier on `speed` for this frame's travel; 0 whenever the goblin does not move. */
  speedScale: number;
  /** Whether the run cycle plays this frame (the sprint pose, the leg swing). */
  moving: boolean;
  /** Side effects for the caller, in order. */
  events: GobEvent[];
}

/**
 * One frame of `idle → chase → windup → hit → recover → chase`, plus `dead`'s 6 s loop back to
 * `chase` (`enemies.md` §2.4, the simplified demo loop).
 *
 * @param state    the state at the top of the frame
 * @param st       seconds already spent in that state
 * @param d        distance from the goblin to the hero, in metres, in the ground plane
 * @param dt       the frame's step, in seconds (the held sim clock's `dt`)
 * @param speed    the goblin's current speed in m/s (the scene's `[` / `]` keys move it)
 * @param deadFor  seconds since this goblin was felled; only read while `state` is `dead`
 * @param hold     seconds this goblin must have spent in `chase` before its windup may fire
 *                 (`enemies.md` §2.5's `atkT`: a pack never swings in unison). 0 = no stagger.
 */
export function gobStep(
  state: GobState, st: number, d: number, dt: number, speed: number, deadFor: number, hold = 0,
): GobOut {
  const events: GobEvent[] = [];
  let s = state;
  let t = st + dt;
  if (s === 'dead') {
    if (deadFor > RESPAWN) { s = 'chase'; t = 0; events.push('respawn'); }
  } else if (s === 'idle') {
    if (d < NOTICE) { s = 'chase'; t = 0; }
  } else if (s === 'chase') {
    // the stagger gates on *time in chase*, never on distance, so it cannot re-make the
    // never-attacks defect: `hold` always elapses, and `d` has already crossed the trigger
    if (d <= REACH && t >= hold) { s = 'windup'; t = 0; }
  } else if (s === 'windup') {
    if (t >= WINDUP) { s = 'hit'; t = 0; if (d <= REACH + HIT_R) events.push('hit'); }
  } else if (s === 'hit') {
    if (t >= HIT_HOLD) { s = 'recover'; t = 0; }
  } else if (s === 'recover') {
    if (t >= RECOVER) { s = 'chase'; t = 0; }
  }
  // the low bobbing sprint runs while it is closing, and the 0.2 s skid rides on top of it
  const moving = s === 'chase' && d > BRAKE_TO;
  return { state: s, st: t, speedScale: moving ? brakeAt(d, speed) : 0, moving, events };
}
