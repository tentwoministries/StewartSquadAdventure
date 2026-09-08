// The west rim's placement marches (sandbox/rim-dawn/place.ts), OPUS_FIX_PLAN.md §5: "findLip() and
// edgeAt() return points the plate contains; a placement helper rejects a point where inside() is
// false". Every ground test here is a synthetic `inside()` handed in — a disc, a slab, a disc with a
// pond cut out of it — so nothing in this file touches three, the renderer, or the Forest's terrain.
//
// The rule under test is LESSONS.md's "anything placed near the plate's edge asserts inside(); a
// bank is found by marching, not by subtracting a radius" (OPUS_EXPERIMENT_VERDICT.md §3.5): the
// deer stood over the void because its position was asserted instead of found, and findLip() named a
// search it never ran.
import { describe, expect, it } from 'vitest';
import type { Ground, Pt } from '../../../sandbox/rim-dawn/place';
import {
  STREAM_TAIL, bankPoint, bearingDir, bearingTo, findLip, hasRoom, marchEdge, nearestOk, shorePoint,
} from '../../../sandbox/rim-dawn/place';

/** A round plate of radius `r` about the origin: the simplest ground test that has a real edge. */
const disc = (r: number): Ground => (x, z) => Math.hypot(x, z) <= r;
const plate20 = disc(20);
/** The plate the stream-tail checks use: r 60 holds STREAM_TAIL[0] and neither of the other two. */
const PLATE = disc(60);
const from = (p: Pt): number => Math.hypot(p.x, p.z);

describe('rim-dawn bearings', () => {
  it('points 0 at -z and 90 at +x, and reads the same bearing back out', () => {
    expect(bearingDir(0).x).toBeCloseTo(0, 12);
    expect(bearingDir(0).z).toBeCloseTo(-1, 12);
    expect(bearingDir(90).x).toBeCloseTo(1, 12);
    expect(bearingDir(90).z).toBeCloseTo(0, 12);
    expect(bearingTo(0, 0, 0, -5)).toBeCloseTo(0, 9);    // due north of the origin
    expect(bearingTo(0, 0, 5, 0)).toBeCloseTo(90, 9);
    const d = bearingDir(215);                           // and back, wrapped into [0, 360), not -145
    expect(bearingTo(0, 0, d.x * 7, d.z * 7)).toBeCloseTo(215, 9);
  });
});

describe('marchEdge', () => {
  it('stops at the last point the plate contains and reports that it hit the edge', () => {
    // r 20 disc, marched from the centre due north (0 -> -z) in 0.1 m steps: the grid lands on
    // z = -20.0 exactly, which the plate still contains, and the next step (-20.1) is off it.
    const m = marchEdge(0, 0, 0, -100, plate20, 0.1);
    expect(m).not.toBeNull();
    expect(m!.hitEdge).toBe(true);
    expect(plate20(m!.point.x, m!.point.z)).toBe(true);          // the answer is on the plate
    expect(plate20(m!.point.x, m!.point.z - 0.1)).toBe(false);   // ... and one step on is not
    expect(m!.point.x).toBeCloseTo(0, 12);
    expect(m!.point.z).toBeCloseTo(-20, 6);
    expect(m!.travelled).toBeCloseTo(20, 6);
  });

  it('reports no edge when the whole line stays on the plate, and travels nothing in place', () => {
    const m = marchEdge(0, 0, 5, 5, plate20, 0.1)!;              // |(5, 5)| = 7.07, well inside r 20
    expect(m.hitEdge).toBe(false);
    expect(m.point.x).toBeCloseTo(5, 9);
    expect(m.point.z).toBeCloseTo(5, 9);
    expect(m.travelled).toBeCloseTo(Math.SQRT2 * 5, 9);
    expect(marchEdge(3, 4, 3, 4, plate20)).toEqual({ point: { x: 3, z: 4 }, hitEdge: false, travelled: 0 });
  });

  it('returns null when the march starts off the plate, even heading back on to it', () => {
    expect(marchEdge(100, 0, 0, 0, plate20, 0.1)).toBeNull();
  });
});

describe('bankPoint', () => {
  it('returns a point the plate contains, a step back from the edge, on every bearing', () => {
    for (const bearing of [0, 90, 215, 337.5]) {
      const p = bankPoint(0, 0, bearing, plate20, 0.1, 1.5, 60);
      expect(p).not.toBeNull();
      expect(plate20(p!.x, p!.z)).toBe(true);
      // the march ends within one 0.1 m step of r 20, so the bank sits between 18.4 m and 18.5 m out
      expect(from(p!)).toBeGreaterThan(18.4 - 1e-9);
      expect(from(p!)).toBeLessThan(18.5 + 1e-9);
      expect(hasRoom(p!.x, p!.z, plate20, 1.4)).toBe(true);      // and has room to stand there
      expect(bearingTo(0, 0, p!.x, p!.z)).toBeCloseTo(bearing, 6);
    }
  });

  it('returns null wherever there is no bank to find', () => {
    expect(bankPoint(100, 100, 90, plate20)).toBeNull();         // the centre is not ground
    expect(bankPoint(0, 0, 90, () => true)).toBeNull();          // the march never leaves the ground
    const slab: Ground = (x) => x >= 0 && x <= 1;                // 1 m of ground, a 1.5 m step back
    expect(bankPoint(0, 0, 90, slab, 0.1, 1.5, 60)).toBeNull();  // ... which lands off it
    const near = bankPoint(0, 0, 90, slab, 0.1, 0.5, 60);        // a shorter step back stays on it
    expect(near).not.toBeNull();
    expect(slab(near!.x, near!.z)).toBe(true);
  });
});

describe('shorePoint, hasRoom and nearestOk', () => {
  /** The composed ground the scene actually uses: on the plate and out of the water. */
  const dry: Ground = (x, z) => plate20(x, z) && Math.hypot(x, z) >= 8;

  it('finds the near edge of the ground from inside the water, where bankPoint cannot start', () => {
    const s = shorePoint(0, 0, 90, dry, 0.1, 20);
    expect(s).not.toBeNull();
    expect(dry(s!.x, s!.z)).toBe(true);
    expect(from(s!)).toBeCloseTo(8, 2);                          // the basin rises out of the pond at r 8
    expect(bankPoint(0, 0, 90, dry)).toBeNull();                 // a march from the water cannot even start
    expect(shorePoint(0, 0, 90, dry, 0.1, 4)).toBeNull();        // nothing within 4 m is land
  });

  it('refuses a spot the plate contains but which cannot hold a 3.6 m wander', () => {
    expect(hasRoom(0, 0, plate20)).toBe(true);
    expect(plate20(19, 0)).toBe(true);                           // one inside() test at the point passes
    expect(hasRoom(19, 0, plate20)).toBe(false);                 // ... and the creature's circle does not
    expect(hasRoom(19, 0, plate20, 0.9)).toBe(true);             // 19 + 0.9 = 19.9, still on the plate
  });

  it('nudges an authored spot on to the nearest ground, and gives up beyond its reach', () => {
    expect(nearestOk(3, 4, plate20)).toEqual({ x: 3, z: 4 });    // already ground: not moved
    const p = nearestOk(21, 0, plate20, 0.25, 6, 24);            // 1 m off the r 20 disc, due +x
    expect(p).not.toBeNull();
    expect(plate20(p!.x, p!.z)).toBe(true);
    expect(Math.hypot(p!.x - 21, p!.z)).toBeCloseTo(1, 6);       // the nearest ground is exactly 1 m in
    expect(nearestOk(100, 100, plate20, 0.25, 6, 24)).toBeNull();
  });
});

describe('findLip', () => {
  it('walks the stream tail to the last point the plate still contains', () => {
    // The tail runs (-40, 31) -> (-52, 40) -> (-58, 44); against an r 60 plate only the first is on
    // it (|p| = 50.60, 65.61, 72.80). The crossing solves |(-40 - 12u, 31 + 9u)| = 60 on the first
    // segment: 225u^2 + 1518u - 1039 = 0, u = (-1518 + sqrt(3239424)) / 450 = 0.62631, i.e.
    // (-47.5157, 36.6368). A 0.05 m march stops on the last grid point before it.
    expect(PLATE(STREAM_TAIL[0]!.x, STREAM_TAIL[0]!.z)).toBe(true);
    expect(PLATE(STREAM_TAIL[1]!.x, STREAM_TAIL[1]!.z)).toBe(false);
    expect(PLATE(STREAM_TAIL[2]!.x, STREAM_TAIL[2]!.z)).toBe(false);
    const lip = findLip(PLATE, 0.05);
    expect(lip).not.toBeNull();
    expect(PLATE(lip!.x, lip!.z)).toBe(true);                    // the lip is on the plate
    expect(from(lip!)).toBeGreaterThan(60 - 0.06);               // ... within one step of its edge
    expect(from(lip!)).toBeLessThanOrEqual(60);
    expect(Math.hypot(lip!.x + 47.5157, lip!.z - 36.6368)).toBeLessThan(0.05);
  });

  it('returns null when the tail never leaves the plate and when it starts off it', () => {
    expect(findLip(() => true, 0.05)).toBeNull();                // no edge anywhere: no lip
    expect(findLip(disc(10), 0.05)).toBeNull();                  // (-40, 31) is 50.6 m out: off the plate
    const inland: Pt[] = [{ x: 0, z: 0 }, { x: 5, z: 0 }];
    expect(findLip(disc(20), 0.05, inland)).toBeNull();
  });
});
