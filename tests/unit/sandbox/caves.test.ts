// The Crystal Caves' stair and tiers (T-55, T-56; docs/qa/briefs/reel-fixes-caves-03.md). Andrew on
// reel 2: the stair "doesn't connect right to the top … the character has to mysteriously find the
// right entry point, and then they get clipped until they pop out of the rock", and the kids' rings
// "don't appear on the staggered rocks … even when you are technically on one".
//
// Everything here is geometry: `makeCave()` builds meshes without a renderer and THREE.Raycaster
// reads them, so the drawn rock and the walked `groundY` are compared against each other rather
// than by eye. The boundary comparisons are inclusive throughout (LESSONS.md's songbirds row: a
// hand-placed point lands exactly on the boundary, so `<=` is the test, never `<`).
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { rng } from '../../../sandbox/_shared/rng';
import {
  APRON_BACK, CUT, HEART, PATHS, TIER_TOP, groundY, halfAt, insideCave, makeCave, ptAt, stairY, tierOf,
} from '../../../sandbox/caves-descent/terrain';

const MAX_STEP = 1.1; // caves-descent/main.ts: the walk's step limit
const RING = 0.04;    // T-56: the selection ring's lift over the ground
let cave: ReturnType<typeof makeCave>;
beforeAll(() => { cave = makeCave(); });

/** The highest rock under (x, z): a ray dropped from 3 m up, as the brief's checks (b) and (c) ask. */
const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
function topAt(x: number, z: number, from: number, meshes: THREE.Mesh[]): number | null {
  ray.set(new THREE.Vector3(x, from + 3, z), DOWN);
  ray.far = 80;
  let best: number | null = null;
  for (const m of meshes) for (const h of ray.intersectObject(m, false)) if (best === null || h.point.y > best) best = h.point.y;
  return best;
}
/** A stand on a tier, well clear of its edge and of the cut the stair makes in it. */
function roomOnTier(x: number, z: number, t: number): boolean {
  if (tierOf(x, z) !== t || stairY(x, z) !== null) return false;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    if (tierOf(x + c * 1.4, z + s * 1.4) !== t) return false;
    if (stairY(x + c * 2.0, z + s * 2.0) !== null) return false;
  }
  return true;
}
/** Seeded stands on the Landing and on the gallery ledge. */
function stands(n: number, seed: number): { x: number; z: number; t: number }[] {
  const r = rng(seed), out: { x: number; z: number; t: number }[] = [];
  for (let guard = 0; guard < 400000 && out.length < n; guard++) {
    const x = -46 + r() * 68, z = -48 + r() * 88;
    const t = tierOf(x, z);
    if (t >= 0 && roomOnTier(x, z, t)) out.push({ x, z, t });
  }
  return out;
}

describe('the caves: the stair the kids walk down (T-55)', () => {
  it('draws and walks the same 3.8 m band, flared to 5 m at the mouth', () => {
    for (const p of PATHS) {
      expect(p.w).toBe(3.8);
      expect(halfAt(p, 0)).toBeCloseTo(2.5, 9);          // the mouth: 5 m across
      expect(halfAt(p, 3)).toBeCloseTo(1.9, 9);          // and the stair's own width 3 m in
      expect(halfAt(p, p.len)).toBeCloseTo(1.9, 9);
      // the band test is inclusive: a point exactly on the edge of a tread is on the tread
      const m = ptAt(p, 6);
      expect(stairY(m.x + m.nx * 1.9, m.z + m.nz * 1.9)).not.toBeNull();
      expect(stairY(m.x + m.nx * 1.95, m.z + m.nz * 1.95)).toBeNull();
      // the mouth sits on its tier, at the tier's own height (no lip to step over)
      expect(tierOf(p.pts[0]!.x, p.pts[0]!.z)).toBeGreaterThanOrEqual(0);
      expect(p.pts[0]!.y).toBeCloseTo(TIER_TOP[tierOf(p.pts[0]!.x, p.pts[0]!.z)]!, 9);
    }
  });

  it('is continuous along its centreline and both 1 m offsets, and never leaves the cave', () => {
    const worst: number[] = [];
    for (const p of PATHS) {
      for (const off of [-1, 0, 1]) {
        let prev: number | null = null, max = 0;
        for (let s = -APRON_BACK; s <= p.len; s += 0.25) {
          const a = ptAt(p, s), x = a.x + a.nx * off, z = a.z + a.nz * off;
          expect(insideCave(x, z)).toBe(true);
          expect(Math.hypot(x - HEART.x, z - HEART.z)).toBeGreaterThan(3);   // the scene's walkable()
          expect(stairY(x, z)).not.toBeNull();
          const y = groundY(x, z);
          if (prev !== null) max = Math.max(max, Math.abs(y - prev));
          prev = y;
        }
        worst.push(max);
        expect(max).toBeLessThanOrEqual(0.15);
      }
    }
    expect(Math.max(...worst)).toBeLessThanOrEqual(0.15);
  });

  it('has no column poking through it: the highest rock on a tread is the tread (T-55)', () => {
    const meshes = [cave.tiers, cave.stairs];
    let worst = 0, worstAt = '';
    const r = rng(4055);
    for (let i = 0; i < 200; i++) {
      const p = PATHS[i % 2]!;
      const s = -APRON_BACK + (Math.floor(i / 2) / 99) * (p.len + APRON_BACK), a = ptAt(p, s), off = (r() * 2 - 1) * 1.2;
      const x = a.x + a.nx * off, z = a.z + a.nz * off;
      const want = stairY(x, z);
      expect(want).not.toBeNull();
      const hit = topAt(x, z, want!, meshes);
      expect(hit).not.toBeNull();
      const d = Math.abs(hit! - want!);
      if (d > worst) { worst = d; worstAt = `${x.toFixed(2)},${z.toFixed(2)} tread ${want!.toFixed(3)} rock ${hit!.toFixed(3)}`; }
    }
    expect(worst, worstAt).toBeLessThanOrEqual(0.05);
    // and the tier under it is cut to the stair: the rock alone tops out CUT below the tread
    let cutSamples = 0;
    for (const p of PATHS) {
      for (let s = -APRON_BACK; s <= p.len; s += 0.5) {
        const a = ptAt(p, s), tread = stairY(a.x, a.z)!, t = tierOf(a.x, a.z);
        if (t < 0 || tread >= TIER_TOP[t]! - 0.01) continue;         // the stair is not cut in here
        cutSamples++;
        const rock = topAt(a.x, a.z, tread, [cave.tiers]);
        expect(rock, `${a.x.toFixed(2)},${a.z.toFixed(2)}`).not.toBeNull();
        expect(rock!).toBeLessThanOrEqual(tread - CUT + 0.02);        // cut 0.3 m under the tread
        expect(rock!).toBeGreaterThanOrEqual(tread - 2.0);            // a trench under the stair, not a hole
      }
    }
    expect(cutSamples).toBeGreaterThan(10);
  });

  it('lets a kid on to the tread from every bearing in a 90° fan (the mouth flare)', () => {
    const reached: number[] = [];
    for (const p of PATHS) {
      const a0 = ptAt(p, 0), a1 = ptAt(p, 4);                     // the mouth, and the stair's direction
      const dir = Math.atan2(a1.x - a0.x, a1.z - a0.z);
      for (let deg = -45; deg <= 45; deg += 5) {
        const th = dir + (deg * Math.PI) / 180;
        const dx = Math.sin(th), dz = Math.cos(th);
        let x = a0.x - dx * 4, z = a0.z - dz * 4;                  // 4 m back from the mouth
        expect(tierOf(x, z)).toBeGreaterThanOrEqual(0);            // the approach is on the tier
        let y = groundY(x, z), low = y;
        for (let k = 0; k < 240; k++) {                            // march 12 m, the walk's step rule
          const nx = x + dx * 0.05, nz = z + dz * 0.05, ny = groundY(nx, nz);
          if (!insideCave(nx, nz) || Math.abs(ny - y) > MAX_STEP) break;
          x = nx; z = nz; y = ny; low = Math.min(low, y);
        }
        reached.push(low - TIER_TOP[tierOf(a0.x, a0.z)]!);
      }
    }
    // Every bearing in the fan gets on to a tread and at least 0.6 m down before a straight-line
    // hold walks the kid into the channel's wall; aimed down the stair he keeps going (the run at
    // 0° descends 5 m in the 20 m of the march, refused nowhere).
    expect(Math.max(...reached)).toBeLessThanOrEqual(-0.6);
    expect(Math.min(...reached)).toBeLessThanOrEqual(-3.5);   // 12 m of march, aimed down the stair
  });
});

describe('the caves: the tiers a ring is drawn on (T-56)', () => {
  it('tops its columns out on groundY, within 0.05 m, over 300 seeded stands', () => {
    const pts = stands(300, 5601);
    expect(pts.length).toBe(300);
    let worst = 0, worstAt = '';
    for (const q of pts) {
      const want = groundY(q.x, q.z);
      expect(want).toBe(TIER_TOP[q.t]!);                           // the tier is flat at its own height
      const hit = topAt(q.x, q.z, want, [cave.tiers]);
      expect(hit, `no rock under ${q.x.toFixed(2)},${q.z.toFixed(2)}`).not.toBeNull();
      const d = Math.abs(hit! - want);
      if (d > worst) { worst = d; worstAt = `${q.x.toFixed(2)},${q.z.toFixed(2)} ground ${want} rock ${hit!.toFixed(3)}`; }
    }
    expect(worst, worstAt).toBeLessThanOrEqual(0.05);
  });

  it('leaves a 1.6 m ring at ground + 0.04 uncut, all round 40 seeded stands', () => {
    let worst = -9;
    for (const q of stands(40, 771)) {
      const ground = groundY(q.x, q.z);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        for (const rad of [0.45, 0.62, 0.8, 0.9]) {                // heroes.md §2.7.5: rim 0.62, edge 0.80
          const x = q.x + Math.cos(a) * rad, z = q.z + Math.sin(a) * rad;
          const hit = topAt(x, z, ground, [cave.tiers, cave.stairs]);
          expect(hit).not.toBeNull();
          worst = Math.max(worst, hit! - (ground + RING));         // > 0 would cut the ring
          expect(hit!).toBeGreaterThanOrEqual(ground - 0.05);      // and no hole under it
        }
      }
    }
    expect(worst).toBeLessThan(0);
  });
});
