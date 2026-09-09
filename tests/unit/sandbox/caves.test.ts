// The Crystal Caves' stair and tiers (T-55, T-56, T-61; docs/qa/briefs/reel-fixes-caves-0{3,4}.md).
// Andrew on reel 2: the stair "doesn't connect right to the top … the character has to mysteriously
// find the right entry point, and then they get clipped until they pop out of the rock", and the
// kids' rings "don't appear on the staggered rocks … even when you are technically on one"; and then
// on round 1: "we actually really liked the chunky floor … and the way the stairs looked before, the
// blockyness and the colors".
//
// Everything here is geometry: `makeCave()` builds meshes without a renderer and THREE.Raycaster
// reads them, so the drawn rock and the walked `groundY` are compared against each other rather
// than by eye. The boundary comparisons are inclusive throughout (LESSONS.md's songbirds row: a
// hand-placed point lands exactly on the boundary, so `<=` is the test, never `<`).
//
// Round 2 replaces two of round 1's checks and drops one: "continuous along its centreline" became
// "a staircase along its centreline" (the drawn stair is stacked boxes again, so a riser is the
// point, not a defect), "tops its columns out on groundY" grew to 400 points and now also asserts
// that a column covers every one of them, and "leaves a 1.6 m ring uncut" is gone — the ring
// conforms per vertex now (T-61c) instead of demanding a flat disc, and its check is the stepped
// probe `scripts/probes/caves-ring-04.cjs`, not a geometry test.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { rng } from '../../../sandbox/_shared/rng';
import {
  CUT, HEART, PATHS, RELIEF_Q, RELIEF_LEVELS, TIER_TOP,
  columnTopAt, groundY, halfAt, insideCave, makeCave, ptAt, reliefStats, setRelief, stairY, tierOf,
} from '../../../sandbox/caves-descent/terrain';

const MAX_STEP = 1.1;  // caves-descent/main.ts: the walk's step limit
/** T-61a: three relief quanta is the widest gap the relaxation leaves between two columns that can
 *  answer for points 2.2 m apart — 0.54 m at `chunky`, half of the walk's own step limit. */
const MAX_RELIEF_STEP = 3 * RELIEF_Q.chunky;
let cave: ReturnType<typeof makeCave>;
beforeAll(() => { setRelief('chunky'); cave = makeCave(); });

/** The highest rock under (x, z): a ray dropped from 3 m up, as the brief's checks (a) and (b) ask. */
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

describe('the caves: the stair the kids walk down (T-55, T-61b)', () => {
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

  it('is a staircase along its centreline and both 1 m offsets, and the drawn tread is the walked one', () => {
    // brief check (b): every rise is 0 or between 0.12 and 0.30 m (inclusive at both ends), never
    // negative going down, and the highest `stairs`/`tiers` hit is within 0.05 m of `stairY`.
    const meshes = [cave.tiers, cave.stairs];
    let riseMin = 9, riseMax = 0, worst = 0, worstAt = '', risers = 0;
    for (const p of PATHS) {
      for (const off of [-1, 0, 1]) {
        let prev: number | null = null;
        for (let s = p.pts[0]!.s; s <= p.len; s += 0.25) {
          const a = ptAt(p, s), x = a.x + a.nx * off, z = a.z + a.nz * off;
          expect(insideCave(x, z)).toBe(true);
          expect(Math.hypot(x - HEART.x, z - HEART.z)).toBeGreaterThan(3);   // the scene's walkable()
          const want = stairY(x, z);
          expect(want, `${s.toFixed(2)} off ${off}`).not.toBeNull();
          const hit = topAt(x, z, want!, meshes);
          expect(hit).not.toBeNull();
          const d = Math.abs(hit! - want!);
          if (d > worst) { worst = d; worstAt = `s ${s.toFixed(2)} off ${off} tread ${want!.toFixed(3)} rock ${hit!.toFixed(3)}`; }
          if (prev !== null) {
            const rise = prev - want!;                        // positive going down
            expect(rise, `a rise back up at s ${s.toFixed(2)} off ${off}`).toBeGreaterThanOrEqual(-1e-9);
            if (Math.abs(rise) > 1e-9) { risers++; riseMin = Math.min(riseMin, rise); riseMax = Math.max(riseMax, rise); }
          }
          prev = want;
        }
      }
    }
    expect(risers).toBeGreaterThan(100);
    expect(riseMin).toBeGreaterThanOrEqual(0.12);
    expect(riseMax).toBeLessThanOrEqual(0.30);
    expect(worst, worstAt).toBeLessThanOrEqual(0.05);
  });

  it('has no column poking through it: the highest rock on a tread is the tread (T-55)', () => {
    const meshes = [cave.tiers, cave.stairs];
    let worst = 0, worstAt = '';
    const r = rng(4055);
    for (let i = 0; i < 200; i++) {
      const p = PATHS[i % 2]!;
      const s0 = p.pts[0]!.s;
      const s = s0 + (Math.floor(i / 2) / 99) * (p.len - s0), a = ptAt(p, s), off = (r() * 2 - 1) * 1.2;
      const x = a.x + a.nx * off, z = a.z + a.nz * off;
      const want = stairY(x, z);
      expect(want).not.toBeNull();
      const hit = topAt(x, z, want!, meshes);
      expect(hit, `no rock at ${x.toFixed(3)},${z.toFixed(3)} (s ${s.toFixed(3)} off ${off.toFixed(3)})`).not.toBeNull();
      const d = Math.abs(hit! - want!);
      if (d > worst) { worst = d; worstAt = `${x.toFixed(2)},${z.toFixed(2)} tread ${want!.toFixed(3)} rock ${hit!.toFixed(3)}`; }
    }
    expect(worst, worstAt).toBeLessThanOrEqual(0.05);
    // and the tier under it is cut to the stair: the rock alone tops out CUT below the tread
    let cutSamples = 0;
    for (const p of PATHS) {
      for (let s = p.pts[0]!.s; s <= p.len; s += 0.5) {
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
    // hold walks the kid into the channel's wall; aimed down the stair he keeps going.
    expect(Math.max(...reached)).toBeLessThanOrEqual(-0.6);
    expect(Math.min(...reached)).toBeLessThanOrEqual(-3.5);   // 12 m of march, aimed down the stair
  });
});

describe('the caves: the chunky floor a ring is drawn on (T-56, T-61a)', () => {
  it('reads groundY off the drawn columns, within 0.05 m, over 400 seeded stands', () => {
    const pts = stands(400, 5601);
    expect(pts.length).toBe(400);
    let worst = 0, worstAt = '', bare = 0;
    for (const q of pts) {
      // brief check (a): every point on a tier is covered by at least one drawn column. A point that
      // is not is a hole to fall through, and the fallback to the tier's flat height would hide it.
      if (columnTopAt(q.x, q.z) === null) bare++;
      const want = groundY(q.x, q.z);
      const hit = topAt(q.x, q.z, want, [cave.tiers]);
      expect(hit, `no rock under ${q.x.toFixed(2)},${q.z.toFixed(2)}`).not.toBeNull();
      const d = Math.abs(hit! - want);
      if (d > worst) { worst = d; worstAt = `${q.x.toFixed(2)},${q.z.toFixed(2)} ground ${want.toFixed(3)} rock ${hit!.toFixed(3)}`; }
    }
    expect(bare, 'points on a tier with no column under them').toBe(0);
    expect(worst, worstAt).toBeLessThanOrEqual(0.05);
    // and the relief is real: the tier is no longer one number
    const heights = new Set(pts.map((q) => groundY(q.x, q.z).toFixed(2)));
    expect(heights.size).toBeGreaterThan(6);
  });

  it('never steps more than 0.54 m between two points 2.2 m apart on one tier', () => {
    // brief check (c). Same tier and off the stair: the 11 m drop from the Landing to the gallery
    // ledge is the scene, and the walk's own step limit is what refuses it.
    const r = rng(9001);
    let worst = 0, worstAt = '', pairs = 0;
    for (const q of stands(300, 4242)) {
      const g = groundY(q.x, q.z);
      for (let k = 0; k < 12; k++) {
        const a = r() * 6.28, d = r() * 2.2;
        const x = q.x + Math.cos(a) * d, z = q.z + Math.sin(a) * d;
        if (tierOf(x, z) !== q.t || stairY(x, z) !== null) continue;
        pairs++;
        const dy = Math.abs(groundY(x, z) - g);
        if (dy > worst) { worst = dy; worstAt = `${q.x.toFixed(2)},${q.z.toFixed(2)} -> ${x.toFixed(2)},${z.toFixed(2)} ${dy.toFixed(4)}`; }
      }
    }
    expect(pairs).toBeGreaterThan(2000);
    expect(worst, worstAt).toBeLessThanOrEqual(MAX_RELIEF_STEP + 1e-9);
    expect(worst).toBeLessThan(MAX_STEP);
  });

  it('quantises the relief with about half the columns at the tier\'s own height', () => {
    // brief check (d): between 35 % and 65 % at level 0 (inclusive), and every one of the six
    // quanta actually used. `blocks` is the same levels on a doubled quantum.
    const st = reliefStats();
    expect(st.mode).toBe('chunky');
    expect(st.total).toBeGreaterThan(300);
    expect(st.hist).toHaveLength(RELIEF_LEVELS.length);
    const pct = (100 * st.hist[2]!) / st.total;
    expect(pct).toBeGreaterThanOrEqual(35);
    expect(pct).toBeLessThanOrEqual(65);
    for (let i = 0; i < st.hist.length; i++) expect(st.hist[i], `level ${RELIEF_LEVELS[i]} unused`).toBeGreaterThan(0);
    expect(3 * RELIEF_Q.blocks).toBeLessThan(MAX_STEP);   // blocks doubles it and still steps
  });
});
