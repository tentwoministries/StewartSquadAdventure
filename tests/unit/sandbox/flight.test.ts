// CS-04's motion schedule (sandbox/flight-golden/schedule.ts), checks 1 and 2 of
// docs/qa/briefs/opus-fixes-flight.md. The scene flies these numbers; nothing here touches three,
// so the check the sandbox-builder ran and the check CI runs are the same code.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makePlane, PENNANT, pennantAttitude } from '../../../sandbox/_shared/plane';
import { SEAT_VARIANTS, SEATS } from '../../../sandbox/flight-golden/flight';
import {
  CRUISE_END, CRUISE_SPEED, CRUISE_START, FLIGHT_LEN, MAX_BANK_DEG, PATH_LENGTH, TOTAL_DISTANCE, TOUCHDOWN,
  bounceY, distanceAt, sampleSchedule, scheduleStats, speedAt,
} from '../../../sandbox/flight-golden/schedule';

const stats = scheduleStats(60);

describe('CS-04 speed schedule', () => {
  it('samples the whole flight at 60 Hz', () => {
    expect(stats.frames).toBe(Math.round(FLIGHT_LEN * 60) + 1);
    expect(sampleSchedule(60)[0]).toEqual({ t: 0, speed: 0, distance: 0, bounce: 0 });
  });

  it('never steps: the speed changes by under 1.5 m/s between frames', () => {
    expect(stats.maxSpeedStep).toBeLessThan(1.5);
  });

  it('cruises at 14 ± 2 m/s for the whole cruise leg', () => {
    expect(CRUISE_END).toBeGreaterThan(CRUISE_START);
    expect(stats.cruiseMin).toBeGreaterThanOrEqual(CRUISE_SPEED - 2);
    expect(stats.cruiseMax).toBeLessThanOrEqual(CRUISE_SPEED + 2);
  });

  // trimmed 2026-09-08 (Working Rule 7): the roll-out case was four more point assertions on
  // `speedAt`, so it is folded into the beats case rather than kept as a second test of one function.
  it('flies npcs.md §2.2.4 numbers at the beats they belong to, and rolls out to zero for good', () => {
    expect(speedAt(3.0)).toBeCloseTo(12, 6); // takeoff roll: 0 → 12 m/s over 3.0 s
    expect(distanceAt(3.0)).toBeCloseTo(18, 6); // ... which is 18 m
    expect(speedAt(6.5)).toBeCloseTo(CRUISE_SPEED, 6);
    expect(speedAt(TOUCHDOWN)).toBeCloseTo(10, 6); // touch at 10 m/s
    expect(MAX_BANK_DEG).toBe(35); // `repaired` max bank
    expect(stats.finalSpeed).toBe(0);
    expect(speedAt(FLIGHT_LEN)).toBe(0);
    expect(speedAt(FLIGHT_LEN + 5)).toBe(0);
    expect(stats.speedZeroFrom).toBeLessThanOrEqual(FLIGHT_LEN);
  });

  it('measures distance monotonically and lands exactly at the end of the path', () => {
    expect(stats.distanceMonotonic).toBe(true);
    expect(TOTAL_DISTANCE).toBeCloseTo(PATH_LENGTH, 6);
    expect(distanceAt(FLIGHT_LEN) - distanceAt(TOUCHDOWN)).toBeCloseTo(17.5, 6); // the roll-out
  });
});

describe('CS-04 landing bounce', () => {
  it('has exactly two hops, the second half the first', () => {
    expect(stats.bouncePeaks.length).toBe(2);
    expect(stats.bounceRatio).toBeGreaterThan(0.45);
    expect(stats.bounceRatio).toBeLessThan(0.55);
    expect(stats.bouncePeaks[0]).toBeGreaterThan(0.98);
  });

  it('is on the ground before touchdown and back on it for good 1.2 s after', () => {
    expect(bounceY(TOUCHDOWN - 0.01)).toBe(0);
    expect(bounceY(TOUCHDOWN)).toBe(0);
    expect(bounceY(TOUCHDOWN + 1.2)).toBeCloseTo(0, 10);
    expect(bounceY(TOUCHDOWN + 3)).toBe(0);
    expect(stats.bounceEnd).toBe(0);
  });

  it('has no discontinuity: the per-frame change itself never jumps', () => {
    // A 1.0 m hop over 0.6 s moves at 5.24 m/s at its steepest, so the raw per-frame change at
    // 60 Hz is 8.7 cm and cannot be smaller without making the bounce invisible — the brief's
    // "2 cm between frames" is arithmetically out of reach for a bounce this size and is read as
    // what it is for: a *cut*, like the first pass's hard drop to zero at 1.4 s. The measure of a
    // cut is the change in the per-frame change, and `sin²` hops keep it under 2 cm.
    expect(stats.maxBounceJerk).toBeLessThan(0.02);
    expect(stats.maxBounceStep).toBeLessThan(0.09);
  });
});

// ---- reel fixes round 2 (docs/qa/briefs/reel-fixes-flight-04.md check 1) --------------------------

describe('T-65 the pennant', () => {
  it('is continuous in t at full wind and hangs when she is parked', () => {
    let maxStep = 0;
    for (let k = 0; k < PENNANT.segments; k++) {
      for (let i = 1; i <= 30 * 60; i++) {
        const d = Math.abs(pennantAttitude(k, i / 60, 1).pitch - pennantAttitude(k, (i - 1) / 60, 1).pitch);
        if (d > maxStep) maxStep = d;
      }
      // wind 0: every segment hangs at or below −70°, on both an even and an odd phase of the sway
      for (const t of [0, 0.37, 1.9, 5.5, 11.1, 23.7]) {
        expect(pennantAttitude(k, t, 0).pitch).toBeLessThanOrEqual((-70 * Math.PI) / 180);
      }
    }
    expect(maxStep).toBeLessThanOrEqual(0.08);
    expect(maxStep).toBeGreaterThan(0.01); // it does flutter: a still flag would also pass a step test
    expect(PENNANT.segments * PENNANT.segLen).toBeCloseTo(1.12, 6); // a flag, not a line
  });
});

describe('T-66 the three seatings', () => {
  const plane = makePlane(0, 0, 0, 90);
  const box = new THREE.Box3().setFromObject(plane.group);

  it('are three distinct sets of four sockets, every one inside the plane', () => {
    const keys = SEAT_VARIANTS.map((v) => SEATS[v].map((s) => s.join(',')).join(' | '));
    expect(new Set(keys).size).toBe(3);
    for (const v of SEAT_VARIANTS) {
      expect(new Set(SEATS[v].map((s) => s.join(','))).size).toBe(4);
      for (const [x, y, z] of SEATS[v]) expect(box.containsPoint(new THREE.Vector3(x, y, z))).toBe(true);
    }
  });

  it("keeps Isabella on the plane's left in all three (npcs.md §2.2.1: she called dibs)", () => {
    for (const v of SEAT_VARIANTS) {
      expect(SEATS[v][3]![2]).toBeLessThan(0);          // the plane flies along +x, so left is −z
      expect(SEATS[v][3]![0]).toBeGreaterThan(-1.35);   // and every kid is ahead of Ed's socket
      for (const s of SEATS[v]) expect(s[0]).toBeGreaterThan(-1.35);
    }
  });
});
