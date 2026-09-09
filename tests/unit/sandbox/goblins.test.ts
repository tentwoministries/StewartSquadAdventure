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
  BRAKE_TO, HERO_BAND, HERO_OUT, HERO_R, HIT_HOLD, HOLD_MAX, NOTICE, REACH, RECOVER, RESPAWN, SKID,
  SLOT_OFF, SLOT_R, SPD, WINDUP, brakeAt, gobStep, heroClear, slotPoint, smoothstep,
  type GobEvent, type GobState,
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
function run(opts: { state?: GobState; st?: number; d0: number; seconds: number; speed?: number; deadFor?: number; hold?: number }): Run {
  const speed = opts.speed ?? SPD;
  const hold = opts.hold ?? 0;
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
    const out = gobStep(state, st, d, DT, speed, deadFor, hold);
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

// T-63 / T-64, round 2: the swing became an eased 0.12 s arc (`HIT_HOLD` 0.08 → 0.12) and the pack
// fans out onto slots instead of arriving in a file. Both are pinned here as well as in the stepped
// probe, because the never-run rule's whole point is that neither may be judged by eye.
describe('gobStep — the round-2 loop (T-63, T-64)', () => {
  it('reaches every state at 60 Hz with the 0.12 s hit, and a stagger only delays the swing', () => {
    const r = run({ state: 'idle', d0: 13, seconds: 12 });
    expect(r.order.slice(0, 5)).toEqual(['idle', 'chase', 'windup', 'hit', 'recover']);
    expect(new Set(r.order)).toEqual(new Set(['idle', 'chase', 'windup', 'hit', 'recover']));
    // 0.12 s is 7.2 frames, so `recover` opens on the 8th
    expect(HIT_HOLD).toBeCloseTo(0.12, 12);
    expect(Math.round((r.firstAt.recover! - r.firstAt.hit!) / DT)).toBe(8);
    // the stagger (enemies.md §2.5 `atkT`, "so a pack never swings in unison") gates on time in
    // `chase`, never on distance, so a swing is only ever later — it can never fail to fire, which
    // is the shape the never-attacks defect had. It bites where a pack re-swings: out of `recover`
    // already inside reach, not on the long run in (13 m takes 5.7 s of chase, past any stagger).
    const back = { state: 'recover' as GobState, st: RECOVER - DT / 2, d0: 0.85, seconds: 2 };
    const quick = run({ ...back, hold: 0 });
    const slow = run({ ...back, hold: HOLD_MAX });
    expect(quick.firstAt.windup!).toBeCloseTo(2 * DT, 4);   // `firstAt` is stamped to 4 dp
    expect(slow.firstAt.windup! - quick.firstAt.windup!).toBeGreaterThan(HOLD_MAX - DT);
    expect(slow.firstAt.windup! - quick.firstAt.windup!).toBeLessThanOrEqual(HOLD_MAX + DT);
    expect(slow.order).toContain('hit');
    expect(r.firstAt.windup!).toBeGreaterThan(HOLD_MAX);
  });

  it('fans the pack out: three slots on one approach bearing are ≥ 1.2 m apart, and inside REACH', () => {
    // three goblins coming in on one bearing (due north-east of the hero at the origin)
    const b = 0.7854;
    const pts = [0, 1, 2].map((i) => slotPoint(0, 0, b, i));
    for (const p of pts) expect(Math.hypot(p.x, p.z)).toBeCloseTo(SLOT_R, 9);
    const gaps: number[] = [];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) gaps.push(Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.z - pts[j]!.z));
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(1.2);
    expect(Math.min(...gaps)).toBeCloseTo(2 * SLOT_R * Math.sin(Math.abs(SLOT_OFF[1]! - SLOT_OFF[0]!) / 2), 9);
    // the ring is strictly inside the trigger line, or a goblin parks on its slot and never swings —
    // the never-attacks defect wearing a different hat
    expect(SLOT_R).toBeLessThan(REACH);
    expect(SLOT_R).toBeGreaterThan(BRAKE_TO);
  });

  // Audit 10 (`meadow-golden-hit-04-02`): a goblin's torso stood inside Isabella's shoulder while
  // the club stayed 0.619 m clear. The floor is hero 0.30 + goblin HIT_R 0.25 = 0.55 m, and it is a
  // property, not an observation: the band damps the *inward* travel to nothing at the floor, so a
  // goblin driven straight at the hero at any speed stops short of it instead of converging on it.
  it('holds the hero’s 0.55 m however hard a goblin is driven at her, and eases out of an overlap', () => {
    // the band is entirely inside the brake's target, so the chase's timing cannot change
    expect(HERO_R + HERO_BAND).toBeLessThan(BRAKE_TO);
    expect(HERO_R + HERO_BAND).toBeLessThan(REACH);
    // driven in at 4 m/s (nearly twice the goblin's own SPD) from 0.9 m for two seconds
    let d = 0.9, worst = Infinity, jump = 0;
    for (let f = 0; f < 120; f++) {
      const raw = d - 4 * DT;                       // where this frame's travel would have put it
      const next = heroClear(d, raw, DT);
      jump = Math.max(jump, Math.abs(next - raw));  // the correction is never bigger than the travel
      d = next;
      worst = Math.min(worst, d);
    }
    expect(worst).toBeGreaterThanOrEqual(HERO_R);
    expect(jump).toBeLessThanOrEqual(4 * DT + 1e-12);
    // outside the band it is inert: the slot steering, the brake and the pack push are untouched
    expect(heroClear(2, 1.9, DT)).toBe(1.9);
    expect(heroClear(BRAKE_TO, BRAKE_TO - 0.01, DT)).toBe(BRAKE_TO - 0.01);
    // and a goblin the hero has walked into eases back out to the floor — bounded per frame, so it
    // does not pop (§0 rule 3), and it arrives rather than converging on it
    let e = 0.2;
    const steps: number[] = [];
    for (let f = 0; f < 60; f++) { const n = heroClear(e, e, DT); steps.push(n - e); e = n; }
    expect(Math.max(...steps)).toBeLessThanOrEqual(HERO_OUT * DT + 1e-12);
    expect(e).toBeCloseTo(HERO_R, 12);
  });
});
