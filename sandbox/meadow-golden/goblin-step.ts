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
/** The `hit` tick: one club-down beat before the recover. */
export const HIT_HOLD = 0.08;
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
 */
export function gobStep(
  state: GobState, st: number, d: number, dt: number, speed: number, deadFor: number,
): GobOut {
  const events: GobEvent[] = [];
  let s = state;
  let t = st + dt;
  if (s === 'dead') {
    if (deadFor > RESPAWN) { s = 'chase'; t = 0; events.push('respawn'); }
  } else if (s === 'idle') {
    if (d < NOTICE) { s = 'chase'; t = 0; }
  } else if (s === 'chase') {
    if (d <= REACH) { s = 'windup'; t = 0; }
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
