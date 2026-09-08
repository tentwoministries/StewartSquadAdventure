// The goblin state machine's pure step (`sandbox/meadow-golden/goblin-step.ts`), run at 60 Hz.
//
// The rule under test is `LESSONS.md` Rigs and animation row 5: "Three goblins converged on 1.00 m
// from their target and never attacked, for sixteen seconds — a brake that eases to zero at the
// trigger distance never crosses it; brake past the line or trigger before it." The bible's numbers
// are `enemies.md` §2.4 (Runt melee windup 0.35 s, the 70° cone at §2.2's 1.0 m reach floor) and
// §2.5 (`goblin` `spd` 85 px/s = 2.125 m/s).
//
// Nothing here imports three or the renderer: the whole point of the extraction is that the loop is
// checkable without a browser. The stepped browser probe (`scripts/probes/meadow-goblins.cjs`) still
// proves the same states on the real scene; these tests are what fails fast when a number moves.
import { describe, expect, it } from 'vitest';
import {
  BRAKE_TO, HIT_HOLD, NOTICE, REACH, RECOVER, RESPAWN, SKID, SPD, WINDUP, brakeAt, gobStep,
  smoothstep, type GobEvent, type GobState,
} from '../../../sandbox/meadow-golden/goblin-step';

const DT = 1 / 60;

interface Run {
  /** Every state the goblin was in, in the order it first entered them. */
  order: GobState[];
  /** Scene time, in seconds, at which each state was first entered. */
  firstAt: Partial<Record<GobState, number>>;
  /** `[event, t]` for each side effect the step asked for. */
  events: [GobEvent, number][];
  /** The smallest `speedScale` seen on a frame where the goblin was still outside `REACH`. */
  minScaleOutsideReach: number;
  /** The distance and time at the end of the run. */
  d: number;
  t: number;
  state: GobState;
  st: number;
}

/**
 * Steps a goblin closing on a stationary hero straight down the line, exactly as `goblins.ts`
 * integrates it: `d -= speed · speedScale · dt` each frame.
 */
function run(opts: { state?: GobState; st?: number; d0: number; seconds: number; speed?: number; deadFor?: number }): Run {
  const speed = opts.speed ?? SPD;
  let state: GobState = opts.state ?? 'chase';
  let st = opts.st ?? 0;
  let d = opts.d0;
  let t = 0;
  let deadFor = opts.deadFor ?? 0;
  const order: GobState[] = [state];
  const firstAt: Partial<Record<GobState, number>> = { [state]: 0 };
  const events: [GobEvent, number][] = [];
  let minScaleOutsideReach = Infinity;
  const frames = Math.round(opts.seconds * 60);
  for (let f = 0; f < frames; f++) {
    t += DT;
    deadFor += DT;
    const out = gobStep(state, st, d, DT, speed, deadFor);
    if (d > REACH) minScaleOutsideReach = Math.min(minScaleOutsideReach, out.speedScale);
    for (const e of out.events) events.push([e, Number(t.toFixed(4))]);
    if (out.state !== state) { state = out.state; if (!(state in firstAt)) firstAt[state] = Number(t.toFixed(4)); order.push(state); }
    st = out.st;
    d -= speed * out.speedScale * DT;
  }
  return { order, firstAt, events, minScaleOutsideReach, d, t, state, st };
}

describe('gobStep — the chase into the attack (enemies.md §2.4)', () => {
  it('reaches windup and hit inside 10 s from 13 m, hit exactly one windup after windup', () => {
    const r = run({ d0: 13, seconds: 10 });
    expect(r.order.slice(0, 4)).toEqual(['chase', 'windup', 'hit', 'recover']);
    expect(r.firstAt.windup).toBeDefined();
    expect(r.firstAt.hit).toBeDefined();
    // 13 m at 2.125 m/s is 6.1 s of running plus the skid: comfortably inside the 10 s window
    expect(r.firstAt.windup!).toBeLessThan(10);
    expect(r.firstAt.hit!).toBeLessThan(10);
    // the bible's windup, to the frame: 0.35 s is exactly 21 frames of 1/60 s
    expect(r.firstAt.hit! - r.firstAt.windup!).toBeCloseTo(WINDUP, 9);
    expect(Math.round((r.firstAt.hit! - r.firstAt.windup!) / DT)).toBe(21);
    // the club connects: the hero is inside the cone at the end of the windup
    expect(r.events[0]).toEqual(['hit', r.firstAt.hit!]);
  });

  it('crosses REACH instead of converging on it — the never-attacks defect', () => {
    const r = run({ d0: 13, seconds: 10 });
    // the brake is still pushing everywhere outside the trigger line, so the line is crossed
    expect(r.minScaleOutsideReach).toBeGreaterThan(0);
    expect(brakeAt(REACH, SPD)).toBeGreaterThan(0);
    expect(brakeAt(REACH + 0.001, SPD)).toBeGreaterThan(0);
    // ... and it is zero only at or inside BRAKE_TO, which is 0.2 m past the line
    expect(BRAKE_TO).toBeCloseTo(0.8, 12);
    expect(brakeAt(BRAKE_TO, SPD)).toBe(0);
    // the defect itself, reproduced: a brake aimed at the trigger line is zero at exactly 1.00 m,
    // so `d` stops falling one hair above it and `chase → windup` never fires
    expect(smoothstep(REACH, REACH, REACH + SPD * SKID)).toBe(0);
    // the skid is a skid, not a stop: it spans one 0.2 s of travel above its target
    expect(brakeAt(BRAKE_TO + SPD * SKID, SPD)).toBe(1);
  });
});

describe('gobStep — the rest of the loop', () => {
  it('runs hit → recover after one tick and recover → chase after the bible’s recover', () => {
    // the goblin is held at 3 m so `chase` cannot immediately re-trigger the windup
    const r = run({ state: 'hit', d0: 3, seconds: 1.2 });
    expect(r.order).toEqual(['hit', 'recover', 'chase']);
    expect(r.firstAt.recover!).toBeGreaterThanOrEqual(HIT_HOLD);
    expect(r.firstAt.recover!).toBeLessThan(HIT_HOLD + DT);
    expect(r.firstAt.chase! - r.firstAt.recover!).toBeCloseTo(RECOVER, 9);
    expect(Math.round((r.firstAt.chase! - r.firstAt.recover!) / DT)).toBe(39);
    expect(r.events).toEqual([]);                       // nothing connects on the way round
  });

  it('idles until the hero is inside perception, and loops a felled goblin back to chase', () => {
    expect(gobStep('idle', 0, NOTICE + 0.1, DT, SPD, 0).state).toBe('idle');
    expect(gobStep('idle', 0, NOTICE - 0.1, DT, SPD, 0)).toMatchObject({ state: 'chase', st: 0, moving: true });
    // dead holds for RESPAWN seconds, then asks the caller to put it back at the gap
    const held = gobStep('dead', 0, 1, DT, SPD, RESPAWN);
    expect(held).toMatchObject({ state: 'dead', speedScale: 0, moving: false, events: [] });
    const back = gobStep('dead', 0, 1, DT, SPD, RESPAWN + DT);
    expect(back).toMatchObject({ state: 'chase', st: 0, events: ['respawn'] });
  });
});
