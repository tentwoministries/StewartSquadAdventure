// The Crystal Caves, the tiered descent to the heart (T-01..T-04, PHASE_0.75_TWEAKS.md; the board
// docs/design/mockups/boards/caves-cross-section.svg): Lamplight Landing at the mouth (tier 0),
// a stair down the west wall to the gallery ledge (tier 1, −11 m), a second stair to the Depths
// (tier 2, −26 m) where the crystal heart pulses in its pool under the waterfall that falls from
// the Forest's roots. The tiers are columnar rock; the cavern is one faceted shell; the void in
// the middle is the spectacle (a step limit in the walk keeps the kids on their tier).
//
// T-61 (reel fixes round 2). Round 1 made the walked surface and the drawn surface agree by
// *flattening* the drawn one: every tier column topped out at its tier's single height and the
// stair was a swept ramp. Andrew and his son missed the reel-2 look — "the chunky floor" and "the
// blockyness and the colors" of the old stair — so this pass goes the other way. The drawn surface
// gets its relief back and `groundY` reads its height **from the drawn columns and steps**:
//
//   * every tier column's top is `TIER_TOP[t] + relief(cell)`, quantised to 0.18 m and clustered,
//     and `groundY` on a tier is the highest drawn column top whose *top hexagon* covers the point;
//   * the stair's cross-sections are grouped into 0.60 m steps, each a level tread drawn as a box
//     with a real riser, and `stairY` returns that staircase;
//   * `J` (and `?relief=`) cycles flat / chunky / blocks so the family can compare.
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { CAVE as K } from '../_shared/biomes';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos } from '../_shared/material';
import { clamp, lerp, rng, smoothstep } from '../_shared/rng';
import { displace } from '../_shared/rock';
import { makeWaterSheet, type WaterSheet } from '../_shared/water';

export const noise = createNoise2D(rng(89));
export const FLOOR_Y = -26;
export const TIER1_Y = -11;
export const POOL = { x: 10, z: 20, r: 11 };
export const HEART = { x: 10, z: 20 };
export const FALL = { x: -2, z: 9, top: 13 };
export const PLINTH = { x: 26, z: 32 };
export const GALLERY = { x: -36, z: 24 };
export const LANDING = { x0: -18, x1: 20, z0: -44, z1: -26 };
/** The gallery ledge: a crescent along the west wall from the landing's south-west corner round to the south. */
const CRESCENT: [number, number][] = [[-20, -30], [-32, -22], [-40, -8], [-42, 6], [-40, 20], [-34, 30], [-24, 34], [-18, 30], [-22, 20], [-26, 8], [-26, -6], [-22, -16]];
/** Stairs as polylines with a width; y interpolates along each. T-55: the drawn tread and the
 *  walkable band are the same 3.8 m — the width the steps were already drawn at (`w + 0.6`) and the
 *  nearest of the two to `dungeons.md` §2.1.1's 4 m corridor. */
export const STAIRS: { pts: [number, number, number][]; w: number }[] = [
  { pts: [[-14, -36, 0], [-20, -32, -2.5], [-28, -26, -6], [-33, -18, -9.5], [-34, -10, -11]], w: 3.8 },
  { pts: [[-30, 26, -11], [-24, 32, -14.5], [-16, 34, -19], [-8, 34, -23.5], [-2, 32, -26]], w: 3.8 },
];
/** The mouth flares to MOUTH_W over its first MOUTH_RUN m (T-55: reachable from a 90° fan of
 *  bearings); a cross-section is TREAD m of arc; the stair's skirt hangs SKIRT below it; a column
 *  the stair crosses tops out CUT below the tread. */
export const MOUTH_W = 5.0, MOUTH_RUN = 3.0, TREAD = 0.15, SKIRT = 0.6, CUT = 0.3;
/** T-61b: one drawn step is **four cross-sections** — 0.60 m of arc — and is level at the ramp's
 *  height at the step's *end*, so the risers are uniform (0.190 m on the first stair, 0.290 m on the
 *  second, both inside the 0.12–0.30 m band the acceptance check asks for) and the foot of each
 *  stair lands exactly on its polyline's last y. A step is counted in cross-sections, not in metres
 *  of arc, because the cross-sections' own mitre lines are what `onStair` cuts the stair into: a
 *  step boundary drawn anywhere else disagrees with `stairY` by a whole riser at the seam. */
export const STEP_SUB = 4;
/** The nominal arc a step covers; each path's own is `STEP_SUB · len / n`, within 0.2 % of this. */
export const STEP_ARC = 0.60;
/** The level apron the stair keeps on its tier before the first tread drops: at least a column's
 *  reach, so no rock that is left standing behind the mouth can poke through the steps in front. */
export const APRON_BACK = 3.5;
/** The apron: the tier reaches 2 m round its stair's first point, so the mouth is never off it. */
const APRON = 2.0;

// ---- T-61: the relief setting ---------------------------------------------------------------------
export type Relief = 'flat' | 'chunky' | 'blocks';
/** The quantum each setting steps the column tops by (m). `blocks` is `chunky` doubled: its widest
 *  spread is 3 quanta = 1.08 m, still under the walk's 1.1 m `maxStep`. */
export const RELIEF_Q: Record<Relief, number> = { flat: 0, chunky: 0.18, blocks: 0.36 };
/** The six levels, in quanta: −2 … +3. About half the columns land on 0. */
export const RELIEF_LEVELS = [-2, -1, 0, 1, 2, 3];
/** No two columns within NB_R of each other differ by more than MAX_JUMP quanta (0.54 m at chunky,
 *  1.08 at blocks — both inside `maxStep`). NB_R is the reach a 2.2 m sample pair can span: a point
 *  is at most 1.212 m from a lattice centre and at most 1.55 m inside a column's top hexagon, so two
 *  points 2.2 m apart are answered by columns at most 1.55 + 2.2 + 1.212 = 4.96 m apart. */
const NB_R = 5.0, MAX_JUMP = 3;
let relief: Relief = 'chunky';
/** Sets the relief setting and invalidates the column list. Returns the setting in force. */
export function setRelief(m: string | null | undefined): Relief {
  if (m === 'flat' || m === 'chunky' || m === 'blocks') { if (m !== relief) { relief = m; COLS = null; } }
  return relief;
}
export function reliefMode(): Relief { return relief; }
export function nextRelief(): Relief {
  const order: Relief[] = ['flat', 'chunky', 'blocks'];
  return setRelief(order[(order.indexOf(relief) + 1) % order.length]);
}

export interface StairPt { x: number; z: number; y: number; nx: number; nz: number; s: number }
/** A stair resampled by arc length: one cross-section every TREAD m, each with its mitred normal.
 *  Both the drawn steps and `stairY` read this, so what is walked is what is drawn (T-55, T-61b).
 *  `idx` buckets the cross-section pairs by a 2.5 m grid cell so `stairY` — which the ring now calls
 *  98 times per moved kid per frame — scans a handful of candidates instead of all 270. */
export interface StairPath {
  pts: StairPt[]; len: number; w: number; x0: number; x1: number; z0: number; z1: number;
  y0: number; y1: number;
  /** How many cross-sections the apron prepends: `pts[ap]` is the mouth, at arc 0. */
  ap: number;
  /** Cross-sections from the mouth to the foot (so `pts.length === ap + n + 1`). */
  n: number;
  /** One step's arc, `STEP_SUB · len / n`, and how many steps there are. */
  stepArc: number; steps: number;
  idx: Map<number, number[]>;
}

const IDX_CELL = 2.5;
const ikey = (ix: number, iz: number): number => (ix + 256) * 4096 + (iz + 256);

function buildPath(st: { pts: [number, number, number][]; w: number }): StairPath {
  const segs: number[] = [];
  let len = 0;
  for (let i = 0; i + 1 < st.pts.length; i++) { const l = Math.hypot(st.pts[i + 1]![0] - st.pts[i]![0], st.pts[i + 1]![1] - st.pts[i]![1]); segs.push(l); len += l; }
  const at = (arc: number): [number, number, number] => {
    let a = clamp(arc, 0, len);
    for (let i = 0; i < segs.length; i++) {
      if (a <= segs[i]! || i === segs.length - 1) {
        const t = clamp(a / segs[i]!, 0, 1);
        const [ax, az, ay] = st.pts[i]!, [bx, bz, by] = st.pts[i + 1]!;
        return [lerp(ax, bx, t), lerp(az, bz, t), lerp(ay, by, t)];
      }
      a -= segs[i]!;
    }
    return [st.pts[0]![0], st.pts[0]![1], st.pts[0]![2]];
  };
  const n = Math.max(2, Math.round(len / TREAD));
  const y0 = st.pts[0]![2], y1 = st.pts[st.pts.length - 1]![2];
  const px: number[] = [], pz: number[] = [];
  for (let i = 0; i <= n; i++) { const q = at((i / n) * len); px.push(q[0]); pz.push(q[1]); }
  // The corners are rounded before the treads are laid: a stair that turns on a hard joint gives its
  // outer edge a step of its own (the cross-sections fan and cross), and a tread has to be level
  // across its width. Twenty-four binomial passes spread each turn over about 3 m; the straight runs
  // are unmoved by an average of collinear points.
  for (let pass = 0; pass < 24; pass++) {
    const qx = px.slice(), qz = pz.slice();
    for (let i = 2; i + 2 <= n; i++) {
      px[i] = (qx[i - 2]! + 4 * qx[i - 1]! + 6 * qx[i]! + 4 * qx[i + 1]! + qx[i + 2]!) / 16;
      pz[i] = (qz[i - 2]! + 4 * qz[i - 1]! + 6 * qz[i]! + 4 * qz[i + 1]! + qz[i + 2]!) / 16;
    }
  }
  const pts: StairPt[] = [];
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i <= n; i++) {
    // the pitch is uniform along the stair: y is linear in arc length, so no run is steeper than the
    // stair's own average (the continuity a tread's ±1 m edges are checked at depends on it)
    const s = (i / n) * len, x = px[i]!, z = pz[i]!;
    const a = Math.max(0, i - 2), b = Math.min(n, i + 2);
    const tx = px[b]! - px[a]!, tz = pz[b]! - pz[a]!, L = Math.hypot(tx, tz) || 1;
    pts.push({ x, z, y: lerp(y0, y1, s / len), nx: -tz / L, nz: tx / L, s });
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  // the apron: cross-sections back from the mouth, level with the tier (negative arc lengths)
  const t0x = pts[1]!.x - pts[0]!.x, t0z = pts[1]!.z - pts[0]!.z, L0 = Math.hypot(t0x, t0z) || 1;
  const head: StairPt[] = [];
  for (let k = Math.round(APRON_BACK / TREAD); k >= 1; k--) head.push({ x: pts[0]!.x - (t0x / L0) * TREAD * k, z: pts[0]!.z - (t0z / L0) * TREAD * k, y: pts[0]!.y, nx: pts[0]!.nx, nz: pts[0]!.nz, s: -TREAD * k });
  pts.unshift(...head);
  const m = MOUTH_W + APRON_BACK;
  const p: StairPath = {
    pts, len, w: st.w, x0: x0 - m, x1: x1 + m, z0: z0 - m, z1: z1 + m, y0, y1,
    ap: head.length, n, stepArc: (STEP_SUB * len) / n, steps: Math.ceil(n / STEP_SUB), idx: new Map(),
  };
  // the cell index: each cross-section pair goes into every 2.5 m cell its own tread quad touches,
  // grown by 0.35 m so a point exactly on the band's edge is still found (the songbirds rule)
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    const ha = halfAt(p, a.s) + 0.35, hb = halfAt(p, b.s) + 0.35;
    const xs = [a.x + a.nx * ha, a.x - a.nx * ha, b.x + b.nx * hb, b.x - b.nx * hb];
    const zs = [a.z + a.nz * ha, a.z - a.nz * ha, b.z + b.nz * hb, b.z - b.nz * hb];
    const cx0 = Math.floor(Math.min(...xs) / IDX_CELL), cx1 = Math.floor(Math.max(...xs) / IDX_CELL);
    const cz0 = Math.floor(Math.min(...zs) / IDX_CELL), cz1 = Math.floor(Math.max(...zs) / IDX_CELL);
    for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) {
      const k2 = ikey(cx, cz);
      const list = p.idx.get(k2);
      if (list) list.push(i); else p.idx.set(k2, [i]);
    }
  }
  return p;
}
export const PATHS: StairPath[] = STAIRS.map(buildPath);
/** Half the band at arc s: the flare at the mouth, the stair's own width after it. */
export function halfAt(p: StairPath, s: number): number { return lerp(MOUTH_W / 2, p.w / 2, clamp(s / MOUTH_RUN, 0, 1)); }
/** The cross-section at arc s (negative on the apron): where the centreline is and which way across. */
export function ptAt(p: StairPath, s: number): StairPt {
  const pts = p.pts;
  let i = 0;
  while (i + 2 < pts.length && pts[i + 1]!.s < s) i++;
  const a = pts[i]!, b = pts[i + 1]!;
  const u = clamp((s - a.s) / (b.s - a.s || 1), 0, 1);
  return { x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u), y: lerp(a.y, b.y, u), nx: lerp(a.nx, b.nx, u), nz: lerp(a.nz, b.nz, u), s };
}
/**
 * The walking height of the stair at arc s (T-61b). At `flat` it is round 1's ramp, linear in arc
 * length. At `chunky` and `blocks` it is a staircase: 0.60 m of arc per step, the tread level at the
 * ramp's height at the step's **end**, so every riser is the same (`Δy · STEP_ARC / len`) and the
 * foot lands exactly on the polyline's last y. The apron (s ≤ 0) is level with the tier: no lip.
 */
export function treadY(p: StairPath, s: number): number {
  const ramp = (a: number): number => p.y0 + (p.y1 - p.y0) * (clamp(a, 0, p.len) / p.len);
  if (relief === 'flat' || s <= 0) return ramp(s);
  const k = Math.min(Math.floor(s / p.stepArc), p.steps - 1);
  return ramp((k + 1) * p.stepArc);
}

function inPoly(x: number, z: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]!, [xj, zj] = poly[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
/** Where a point sits on a stair: the cell it is in (between two cross-sections), how far along it
 *  is, the ramp height there and how far it is off the centreline. A tread is *level across its
 *  width*, so the height comes from the cross-section parameter, never from the nearest point on the
 *  centreline: at a turn the outer edge of a step is the same height as the inner edge.
 *  `all` scans every cross-section (what `cutAt` and `nearStair` need, since they ask about points
 *  well outside the band); the default uses the cell index, which covers the band and 0.35 m past it. */
export function onStair(p: StairPath, x: number, z: number, all = false): { s: number; y: number; off: number; cap: boolean } {
  const pts = p.pts;
  const d0 = (x - pts[0]!.x) * pts[0]!.nz - (z - pts[0]!.z) * pts[0]!.nx;
  if (d0 < -1e-9) return { s: 0, y: pts[0]!.y, off: Math.hypot(x - pts[0]!.x, z - pts[0]!.z), cap: true }; // behind the apron
  const cand = all ? null : (p.idx.get(ikey(Math.floor(x / IDX_CELL), Math.floor(z / IDX_CELL))) ?? []);
  const n = cand ? cand.length : pts.length - 1;
  for (let c = 0; c < n; c++) {
    const i = cand ? cand[c]! : c;
    const a = pts[i]!, b = pts[i + 1]!;
    const da = (x - a.x) * a.nz - (z - a.z) * a.nx;      // ahead of cross-section i
    const db = (x - b.x) * b.nz - (z - b.z) * b.nx;      // ahead of cross-section i + 1
    // `da >= 0` with a nanometre of slack: a point placed *on* the first cross-section's own mitre
    // line lands at ±1e-17 depending only on the sign of its offset, and the strict test dropped
    // half of the mouth's edge off the stair entirely (LESSONS.md's songbirds row, in the small)
    if (da < -1e-9 || db >= 0) continue;
    const u = clamp(da / (da - db), 0, 1);
    const off = lerp((x - a.x) * a.nx + (z - a.z) * a.nz, (x - b.x) * b.nx + (z - b.z) * b.nz, u);
    return { s: lerp(a.s, b.s, u), y: lerp(a.y, b.y, u), off, cap: false };
  }
  // past the foot (or off to the side where the mitre lines fan). `cap` says the point is beyond the
  // last cross-section: the stair is drawn *between* its cross-sections and nowhere else, so a
  // half-disc of "stair" hanging past the foot would be walkable rock nobody drew (T-55, again).
  const e = pts[pts.length - 1]!;
  const dEnd = (x - e.x) * e.nz - (z - e.z) * e.nx;
  return { s: p.len, y: e.y, off: (x - e.x) * e.nx + (z - e.z) * e.nz, cap: dEnd > 1e-9 };
}
/** The stair's walking height, or null off every stair — and null past either end of it, where the
 *  tier or the Depths floor answers instead (both of which are drawn there). The band test is
 *  inclusive: a point exactly on the boundary is on the stair (LESSONS.md's songbirds row). */
export function stairY(x: number, z: number): number | null {
  for (const p of PATHS) {
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    const q = onStair(p, x, z);
    if (!q.cap && Math.abs(q.off) <= halfAt(p, q.s) + 1e-9) return treadY(p, q.s);
  }
  return null;
}
/** The channel a stair cuts through a tier (T-55): the band, the wall at its edge and a shoulder
 *  either side. No tier column stands in it — the stair's own geometry is the floor there — so
 *  nothing pokes through a tread and nothing floats over the shoulder. `off` is signed from the
 *  centreline, `half` the band's own half-width at that point. */
export const SHOULDER = 3.4, COL_R = 1.7;
export function lowTread(x: number, z: number): number | null {
  let low = stairY(x, z);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * 6.2832;
    const q = stairY(x + Math.cos(a) * COL_R, z + Math.sin(a) * COL_R);
    if (q !== null && (low === null || q < low)) low = q;
  }
  return low;
}
export function cutAt(x: number, z: number): { tread: number; off: number; half: number } | null {
  for (const p of PATHS) {
    if (x < p.x0 - SHOULDER || x > p.x1 + SHOULDER || z < p.z0 - SHOULDER || z > p.z1 + SHOULDER) continue;
    const q = onStair(p, x, z, true);
    const half = halfAt(p, q.s);
    if (Math.abs(q.off) <= half + SHOULDER) return { tread: treadY(p, q.s), off: q.off, half };
  }
  return null;
}
/** True within `margin` of a stair's band edge. The relief is held at or above the tier's own height
 *  inside `SHOULDER + COL_R` of a band, because that is exactly how far the stair's drawn shoulder
 *  (level at the tier top, out to at most SHOULDER) can reach under a column's 1.55 m top hexagon: a
 *  *sunken* column there would put `groundY` below the shoulder the raycast sees. Inclusive. */
export function nearStair(x: number, z: number, margin: number): boolean {
  for (const p of PATHS) {
    if (x < p.x0 - margin || x > p.x1 + margin || z < p.z0 - margin || z > p.z1 + margin) continue;
    const q = onStair(p, x, z, true);
    if (Math.abs(q.off) <= halfAt(p, q.s) + margin + 1e-9) return true;
  }
  return false;
}
/** Round-1 deferral (b): a hook-lamp that stands inside a stair's band is moved sideways along its
 *  own cross-section normal to `clear` m outside the band's edge, at the same arc. The side chosen
 *  is the one standing on a tier — a lamp pushed out over the void would hang on nothing; if both
 *  sides or neither is on a tier, the sign of the lamp's own offset decides. A point already clear
 *  of every band comes back unchanged. Mode-independent: only the band's plan geometry is read. */
export function clearOfStair(x: number, z: number, clear: number): [number, number, number] | null {
  for (const p of PATHS) {
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    const q = onStair(p, x, z, true);
    const half = halfAt(p, q.s);
    if (Math.abs(q.off) > half + 1e-9) continue;
    const a = ptAt(p, q.s), d = half + clear;
    const cand: [number, number][] = [[a.x + a.nx * d, a.z + a.nz * d], [a.x - a.nx * d, a.z - a.nz * d]];
    const ok = cand.filter((c) => tierOf(c[0], c[1]) >= 0);
    const pick = ok.length === 1 ? ok[0]! : cand[q.off >= 0 ? 0 : 1]!;
    // the lamp hangs off the stair's own flank, so its hook is hung from the ramp height at that
    // arc (mode-independent: within one riser of whichever tread the setting draws there)
    return [pick[0], pick[1], p.y0 + (p.y1 - p.y0) * (clamp(q.s, 0, p.len) / p.len)];
  }
  return null;
}
const nearMouth = (i: number, x: number, z: number): boolean => Math.hypot(x - PATHS[i]!.pts[0]!.x, z - PATHS[i]!.pts[0]!.z) <= APRON;
export function onLanding(x: number, z: number): boolean { return (x > LANDING.x0 && x < LANDING.x1 && z > LANDING.z0 && z < LANDING.z1 && Math.hypot(x - 1, z + 35) < 24) || nearMouth(0, x, z); }
export function onTier1(x: number, z: number): boolean { return inPoly(x, z, CRESCENT) || Math.hypot(x - GALLERY.x, z - GALLERY.z) < 8 || nearMouth(1, x, z); }
/** The tier a point stands on, or −1 in the void: 0 the Landing, 1 the gallery ledge. */
export function tierOf(x: number, z: number): number { return onLanding(x, z) ? 0 : onTier1(x, z) ? 1 : -1; }
export const TIER_TOP = [0, TIER1_Y];

// ---- T-61a: the columns, and the relief `groundY` reads off their drawn tops --------------------
/** One drawn column: the top hexagon's centre (after the ≤ 0.08 m xz jitter), its rotation, the
 *  y of its top face, its tier, its relief level in quanta, and whether it is a *cut* column under a
 *  stair's band (those hold the steps up and are never what `groundY` answers with). */
export interface Column { x: number; z: number; rot: number; cr: number; sr: number; top: number; tier: number; lvl: number; cut: boolean; light: boolean }
/** The hex grid: 2.1 m pitch, rows √3/2 apart. A column's top radius is 1.55 m (apothem 1.3423 m)
 *  and the worst-covered point of the lattice is 1.212 m from a centre, so with the ≤ 0.113 m jitter
 *  the floor still has no hole to fall through — with 17 mm to spare, which test (a) asserts. */
const DZ = 2.1 * Math.sqrt(3) / 2;
const HEX_R = 1.55, HEX_A = HEX_R * Math.cos(Math.PI / 6);
const C30 = Math.cos(Math.PI / 6);
/** One ring of columns past the tier's edge, so the rock reaches under every walkable point. */
const HALO: [number, number][] = [];
for (let ox = -1.4; ox <= 1.41; ox += 0.35) for (let oz = -1.4; oz <= 1.41; oz += 0.35) if (ox * ox + oz * oz > 1e-6 && Math.hypot(ox, oz) <= 1.4) HALO.push([ox, oz]);

let COLS: Column[] | null = null;
let CELLS: Map<number, Column[]> = new Map();
const CH = 2.1;

const hashCell = (ix: number, iz: number): number => {
  let h = (Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iz + 0x9e37, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
};
/** The raw relief level of a cell, in quanta. Clustered by `noise(x/6, z/6)` so the floor reads as
 *  plates rather than static, with a per-cell hash for the chunk inside a plate. The thresholds were
 *  set from the histogram: about half the columns land on 0 and every one of the six levels is used. */
function rawLevel(x: number, z: number, ix: number, iz: number): number {
  const v = 0.62 * noise(x / 6, z / 6) + 0.38 * (hashCell(ix, iz) * 2 - 1);
  if (v < -0.55) return -2;
  if (v < -0.22) return -1;
  if (v < 0.20) return 0;
  if (v < 0.42) return 1;
  if (v < 0.56) return 2;
  return 3;
}

function buildColumns(): void {
  const r = rng(2601);
  const q = RELIEF_Q[relief];
  // pass 1: the lattice cells that carry a column, and which of them the stair has cut
  const cells: { ix: number; iz: number; x: number; z: number; t: number; cut: number | null; low: number | null }[] = [];
  for (let iz = 0; -52 + iz * DZ <= 52; iz++) {
    const z = -52 + iz * DZ;
    const xs = -60 + (iz % 2 ? 1.05 : 0);
    for (let ix = 0; xs + ix * 2.1 <= 60; ix++) {
      const x = xs + ix * 2.1;
      if (!insideCave(x, z)) continue;
      let t = tierOf(x, z);
      if (t < 0) for (const [ox, oz] of HALO) { const u = tierOf(x + ox, z + oz); if (u >= 0) { t = u; break; } }
      if (t < 0) continue;
      // T-55: where a stair crosses a tier the tier is cut to the stair. A column under the band
      // tops out CUT below the *lowest* tread its 1.7 m body reaches, so it holds the steps up and
      // never pokes through one; between the band and the shoulder no column stands at all.
      const c = cutAt(x, z);
      const low = c ? lowTread(x, z) : null;
      let cut: number | null = null;
      if (c && low !== null && low < TIER_TOP[t]! - 1e-6) {
        if (Math.abs(c.off) <= c.half) cut = low - CUT;
        else if (Math.abs(c.off) <= c.half + COL_R) continue;   // the shoulder is the floor here
      }
      cells.push({ ix, iz, x, z, t, cut, low });
    }
  }
  // pass 2: the relief levels, relaxed so no two columns within NB_R differ by more than MAX_JUMP
  const at = new Map<number, number>();
  cells.forEach((c, i) => at.set(c.iz * 4096 + c.ix, i));
  const lvl = new Int8Array(cells.length);
  cells.forEach((c, i) => {
    if (c.cut !== null) return;
    // held at or above the tier's own height wherever the stair's shoulder — drawn level with the
    // tier, out to SHOULDER from the band — can reach under this column's 1.55 m top hexagon;
    // and held at or below the lowest tread its own body reaches, so no relieved column tops out
    // through a step where the stair comes down on to its tier (T-55).
    const floorLvl = nearStair(c.x, c.z, SHOULDER + HEX_R) ? 0 : -2;
    const capLvl = q > 0 && c.low !== null ? Math.max(0, Math.floor((c.low - TIER_TOP[c.t]! + 1e-6) / q)) : 3;
    lvl[i] = clamp(rawLevel(c.x, c.z, c.ix, c.iz), floorLvl, Math.min(3, capLvl));
  });
  // neighbours, on the *same tier only*: the Landing stands 11 m over the gallery ledge and that
  // cliff is the scene, not a step to smooth away.
  const nbs: number[][] = cells.map(() => []);
  cells.forEach((c, i) => {
    if (c.cut !== null) return;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -3; dx <= 3; dx++) {
      if (dz === 0 && dx === 0) continue;
      const j = at.get((c.iz + dz) * 4096 + (c.ix + dx));
      if (j === undefined || cells[j]!.cut !== null || cells[j]!.t !== c.t) continue;
      if (Math.hypot(cells[j]!.x - c.x, cells[j]!.z - c.z) <= NB_R) nbs[i]!.push(j);
    }
  });
  // a pure lowering iteration: monotone, so it terminates, and at its fixed point every neighbour
  // pair satisfies |Δ| ≤ MAX_JUMP. The lowest level a cell can be pushed to is min + MAX_JUMP ≥ 1,
  // so the "≥ 0 near a stair" floor is never broken by the relaxation.
  for (let pass = 0; pass < 24; pass++) {
    let changed = false;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]!.cut !== null) continue;
      let mn = 99;
      for (const j of nbs[i]!) if (lvl[j]! < mn) mn = lvl[j]!;
      if (mn < 99 && lvl[i]! > mn + MAX_JUMP) { lvl[i] = mn + MAX_JUMP; changed = true; }
    }
    if (!changed) break;
  }
  // pass 3: the drawn columns. The top carries a 0 to 3 cm sink so overlapping tops of equal level
  // do not z-fight, and that sunk value *is* what `groundY` returns: the walked surface is the drawn
  // surface to the millimetre, not to 3 cm (T-56).
  const tops = new Float64Array(cells.length);
  const rot: number[] = [], jx: number[] = [], jz: number[] = [], light: boolean[] = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]!;
    light.push(r() < 0.5);
    rot.push(r() * 6.28);
    jx.push((r() - 0.5) * 0.16); jz.push((r() - 0.5) * 0.16);
    tops[i] = (c.cut !== null ? c.cut : TIER_TOP[c.t]! + lvl[i]! * q) - r() * 0.03;
  }
  // the sink rides on top of the 3-quantum limit, so one more lowering pass — on the tops themselves
  // this time — brings every neighbouring pair inside MAX_JUMP · q exactly (0.54 m at chunky, 1.08 at
  // blocks, both under the walk's 1.1 m maxStep). It only ever shaves a sink, never a whole quantum.
  const LIMIT = MAX_JUMP * q;
  if (q > 0) for (let pass = 0; pass < 24; pass++) {
    let changed = false;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]!.cut !== null) continue;
      let mn = Infinity;
      for (const j of nbs[i]!) if (tops[j]! < mn) mn = tops[j]!;
      if (mn < Infinity && tops[i]! > mn + LIMIT + 1e-12) { tops[i] = mn + LIMIT; changed = true; }
    }
    if (!changed) break;
  }
  COLS = []; CELLS = new Map();
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]!;
    const col: Column = {
      x: c.x + jx[i]!, z: c.z + jz[i]!, rot: rot[i]!, cr: Math.cos(rot[i]!), sr: Math.sin(rot[i]!),
      top: tops[i]!, tier: c.t, lvl: c.cut !== null ? 0 : lvl[i]!, cut: c.cut !== null, light: light[i]!,
    };
    COLS.push(col);
    const key = ikey(Math.floor(col.x / CH), Math.floor(col.z / CH));
    const list = CELLS.get(key);
    if (list) list.push(col); else CELLS.set(key, [col]);
  }
}
/** The drawn columns for the setting in force (built on demand, rebuilt when `J` changes it). */
export function columns(): Column[] { if (!COLS) buildColumns(); return COLS!; }
/** The histogram of relief levels over the uncut columns: `hist[l + 2]` for level l. */
export function reliefStats(): { hist: number[]; total: number; mode: Relief } {
  const hist = [0, 0, 0, 0, 0, 0];
  let total = 0;
  for (const c of columns()) if (!c.cut) { hist[c.lvl + 2]!++; total++; }
  return { hist, total, mode: relief };
}
/** Is (x, z) inside a column's *top hexagon*? The hexagon has its vertices at 0°, 60° … (verified
 *  against three r185's CylinderGeometry) so its three edge normals are at 30°, 90°, 150°; the test
 *  is inclusive, so a point exactly on an edge is on the column. */
function inHex(dx: number, dz: number, cr: number, sr: number): boolean {
  const lx = dx * cr - dz * sr, lz = dx * sr + dz * cr;
  return Math.abs(lx) <= HEX_A + 1e-9
    && Math.abs(0.5 * lx + C30 * lz) <= HEX_A + 1e-9
    && Math.abs(0.5 * lx - C30 * lz) <= HEX_A + 1e-9;
}
/** T-61a: the highest drawn column top whose hexagon covers the point, or null where none does.
 *  Cut columns are skipped — they sit under a stair's band, where `stairY` answers first, and their
 *  hexagons spill past the band on to the shoulder the stair draws level with the tier. */
export function columnTopAt(x: number, z: number): number | null {
  if (!COLS) buildColumns();
  const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
  let best: number | null = null;
  for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
    const list = CELLS.get(ikey(cx + ox, cz + oz));
    if (!list) continue;
    for (const c of list) {
      if (c.cut || (best !== null && c.top <= best)) continue;
      if (inHex(x - c.x, z - c.z, c.cr, c.sr)) best = c.top;
    }
  }
  return best;
}
export function floorY(x: number, z: number): number {
  let h = FLOOR_Y + 0.5 * noise(x / 9, z / 9) + 0.2 * noise(x / 3, z / 3);
  const dp = Math.hypot(x - POOL.x, z - POOL.z) / POOL.r;
  if (dp < 1.3) h = lerp(h, FLOOR_Y - 1.4 * (1 - clamp(dp, 0, 1) ** 2), smoothstep(1.3, 1.0, dp));
  // Round-1 deferral (e): the second stair's foot met the Depths floor with a lip of up to 0.7 m
  // (the floor's own noise against the stair's fixed −26 m). The floor is blended to the stair's
  // last tread over 3 m out from the band's edge, so the foot is flush and the walk is level off it.
  const p = PATHS[1]!;
  const e = p.pts[p.pts.length - 1]!;
  const d = Math.hypot(x - e.x, z - e.z) - halfAt(p, p.len);
  if (d < 3) h = lerp(treadY(p, p.len), h, smoothstep(0, 3, d));
  return h;
}
/** Walking height: stairs first, then the tiers, then the floor; the void is the floor (the step
 *  limit blocks it). T-61a: on a tier the height is the highest *drawn* column top under the point —
 *  the relief is read off the geometry, never off a separate field. A tier point no column covers
 *  falls back to the tier's own height (the stair's shoulder is the only such place, and it is drawn
 *  level with the tier); test (a) asserts there is no such point out on the open floor. */
export function groundY(x: number, z: number): number {
  const s = stairY(x, z);
  if (s !== null) return s;
  const t = tierOf(x, z);
  if (t >= 0) { const c = columnTopAt(x, z); return c !== null ? c : TIER_TOP[t]!; }
  return floorY(x, z);
}
export function insideCave(x: number, z: number): boolean { return Math.hypot(x / 62, z / 54) < 1; }

const CAVE_TOP = 14;

/** The tiers and the stairs, built from the column list and the step schedule in force. Split out of
 *  `makeCave` so `J` can rebuild just the rock (T-61's relief cycle) without a second pool or shell. */
export function makeRock(): { tiers: THREE.Mesh; stairs: THREE.Mesh } {
  const r = rng(2601);
  const rock = makeWorldMaterial({ roughness: 1 });
  // ---- the tiers: columnar rock from each column's relieved top down to the floor ---------------
  const geos: THREE.BufferGeometry[] = [];
  for (const c of columns()) {
    const bottom = floorY(c.x, c.z) - 1;
    const h = c.top - bottom;
    // straight-sided, not the old 1.55 → 1.65 taper: a downward ray at a point just *outside* a
    // column's top hexagon clipped the flared side up to 0.11 m above `groundY`, and T-56's whole
    // point is that the two agree. A 0.1 m flare over a 27 m column was invisible anyway.
    const g = colorize(new THREE.CylinderGeometry(HEX_R, HEX_R, h, 6), c.light ? K.rockLight : K.rock);
    const gc = g.getAttribute('color') as THREE.BufferAttribute, gp = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < gp.count; i++) if (gp.getY(i) > h / 2 - 0.01) { const cc = new THREE.Color('#4A4270'); gc.setXYZ(i, cc.r, cc.g, cc.b); }
    g.rotateY(c.rot); g.translate(c.x, bottom + h / 2, c.z);
    geos.push(g);
  }
  const tiersGeo = mergeGeos(geos); jitterColor(tiersGeo, r, 0.05);
  const tiers = new THREE.Mesh(tiersGeo, rock); tiers.castShadow = true; tiers.receiveShadow = true; tiers.name = 'tiers';
  // ---- the stairs -------------------------------------------------------------------------------
  const spos: number[] = [], scol: number[] = [];
  const vtx = (p: number[], c: THREE.Color) => { spos.push(p[0]!, p[1]!, p[2]!); scol.push(c.r, c.g, c.b); };
  const quad = (a: number[], b: number[], c2: number[], d: number[], col: THREE.Color) => {
    vtx(a, col); vtx(b, col); vtx(c2, col);
    vtx(a, col); vtx(c2, col); vtx(d, col);
  };
  const drop = (p: number[], dy: number): number[] => [p[0]!, p[1]! + dy, p[2]!];
  const atY = (p: number[], y: number): number[] => [p[0]!, y, p[2]!];
  for (const p of PATHS) {
    if (relief === 'flat') {
      // round 1's swept strip: a level tread per 0.15 m cell with its riser and skirt. Kept as the
      // `flat` variant — the look the family may still want for another layout.
      for (let i = 0; i + 1 < p.pts.length; i++) {
        const a = p.pts[i]!, b = p.pts[i + 1]!;
        const ha = halfAt(p, a.s) + 0.02, hb = halfAt(p, b.s) + 0.02;
        const y = (a.y + b.y) / 2;
        const yn = i + 2 < p.pts.length ? (b.y + p.pts[i + 2]!.y) / 2 : b.y;
        const aL = [a.x + a.nx * ha, y, a.z + a.nz * ha], aR = [a.x - a.nx * ha, y, a.z - a.nz * ha];
        const bL = [b.x + b.nx * hb, y, b.z + b.nz * hb], bR = [b.x - b.nx * hb, y, b.z - b.nz * hb];
        const ka = ha - 0.03, kb = hb - 0.03;
        const kL = [a.x + a.nx * ka, y, a.z + a.nz * ka], kR = [a.x - a.nx * ka, y, a.z - a.nz * ka];
        const jL = [b.x + b.nx * kb, y, b.z + b.nz * kb], jR = [b.x - b.nx * kb, y, b.z - b.nz * kb];
        const cT = new THREE.Color(Math.floor(i / 4) % 2 ? K.rockLight : '#4A4270').multiplyScalar(0.93 + r() * 0.14);
        const cR = cT.clone().multiplyScalar(0.7);
        const cS = new THREE.Color(K.rock).multiplyScalar(0.82 + r() * 0.2);
        quad(aL, bL, bR, aR, cT);
        quad(atY(bL, yn), bL, bR, atY(bR, yn), cR);
        quad(kL, drop(kL, -SKIRT), drop(jL, -SKIRT), jL, cS);
        quad(kR, jR, drop(jR, -SKIRT), drop(kR, -SKIRT), cS);
        quad(drop(kL, -SKIRT), drop(kR, -SKIRT), drop(jR, -SKIRT), drop(jL, -SKIRT), cS);
      }
    } else {
      // T-61b: stacked box steps, the look of the reel-2 build. One box per 0.60 m of arc, its top
      // face exactly at `treadY` (what the kid walks), a real riser down to the next tread, a 0.3 m
      // overhang on any side that is out over the void and none where the stair is cut into a tier.
      // Step −1 is the apron, level with the tier: the mouth is a widening of the floor, not a lip.
      for (let k = -1; k < p.steps; k++) {
        // the step's own cross-sections: [ap + k·SUB, ap + (k+1)·SUB], and [0, ap] for the apron.
        // Its end edges are those cross-sections' mitre lines — the very lines `onStair` cuts the
        // stair into — so the drawn seam and the walked seam are the same line, not one within a
        // cross-section of the other (which cost a whole riser at every step boundary).
        const i0 = k < 0 ? 0 : p.ap + k * STEP_SUB;
        const i1 = k < 0 ? p.ap : Math.min(p.ap + (k + 1) * STEP_SUB, p.pts.length - 1);
        const y = k < 0 ? p.pts[0]!.y : treadY(p, k * p.stepArc + 1e-6);
        const yn = k + 1 < p.steps ? treadY(p, (k + 1) * p.stepArc + 1e-6) : y - 0.5;
        const depth = Math.max(0.5, y - yn + 0.25);
        const lo = y - depth;
        const mid = p.pts[Math.floor((i0 + i1) / 2)]!;
        const lw = lowTread(mid.x, mid.z);
        // the overhang, per side: the stair carries its own 0.3 m lip out over the void, and stops
        // flush with the band where a channel wall stands beside it
        const over: number[] = [0.3, 0.3];
        for (let si = 0; si < 2; si++) {
          const side = si === 0 ? 1 : -1;
          const nx = mid.nx * side, nz = mid.nz * side, hh = halfAt(p, mid.s);
          for (let d = 0.2; d <= SHOULDER + 1e-9; d += 0.2) {
            const t = tierOf(mid.x + nx * (hh + d), mid.z + nz * (hh + d));
            if (t >= 0 && lw !== null && TIER_TOP[t]! > lw + 1e-6) { over[si] = 0.02; break; }
          }
        }
        const cT = new THREE.Color(k % 2 ? K.rockLight : '#4A4270').multiplyScalar(0.95 + r() * 0.10);
        const cR = cT.clone().multiplyScalar(0.62);
        const cS = new THREE.Color(K.rock).multiplyScalar(0.82 + r() * 0.2);
        const L: number[][] = [], R: number[][] = [];
        // 6 cm of pad off each open end of the stair, so a point sampled exactly on the first or
        // last cross-section's mitre line is strictly inside the drawn top face rather than on its
        // edge, where a ray is a coin flip. The pad lies over the tier (level with it) at the mouth
        // and over the Depths floor (blended to this tread) at the foot.
        const pad0 = i0 === 0 ? 0.06 : 0, pad1 = i1 === p.pts.length - 1 ? 0.06 : 0;
        for (let j = i0; j <= i1; j++) {
          const a = p.pts[j]!, hh = halfAt(p, a.s);
          const q = j === i0 ? -pad0 : j === i1 ? pad1 : 0;          // along the path, out of the ends
          const ax = a.x + a.nz * q, az = a.z - a.nx * q;
          L.push([ax + a.nx * (hh + over[0]!), y, az + a.nz * (hh + over[0]!)]);
          R.push([ax - a.nx * (hh + over[1]!), y, az - a.nz * (hh + over[1]!)]);
        }
        for (let j = 0; j + 1 < L.length; j++) {
          quad(L[j]!, L[j + 1]!, R[j + 1]!, R[j]!, cT);                                   // the tread
          quad(L[j]!, drop(L[j]!, -depth), drop(L[j + 1]!, -depth), L[j + 1]!, cS);       // the two sides
          quad(R[j]!, R[j + 1]!, drop(R[j + 1]!, -depth), drop(R[j]!, -depth), cS);
          quad(drop(L[j]!, -depth), drop(R[j]!, -depth), drop(R[j + 1]!, -depth), drop(L[j + 1]!, -depth), cS); // the underside
        }
        const f0 = L[L.length - 1]!, f1 = R[R.length - 1]!;
        quad(f0, atY(f0, lo), atY(f1, lo), f1, cR);                                       // the riser, down-stair
        quad(L[0]!, R[0]!, atY(R[0]!, lo), atY(L[0]!, lo), cR);                            // and the back face
      }
    }
    // where the stair is cut into a tier, the channel's wall and the shoulder either side of it:
    // the tier's floor stops at the band, drops to the trench and carries on at its own height.
    for (let i = 0; i + 1 < p.pts.length; i++) {
      const a = p.pts[i]!, b = p.pts[i + 1]!;
      const ha = halfAt(p, a.s) + 0.02, hb = halfAt(p, b.s) + 0.02;
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      const y = treadY(p, (a.s + b.s) / 2);
      const lw = lowTread(mx, mz);
      if (lw === null) continue;
      const cW = new THREE.Color(K.rock).multiplyScalar(0.7 + r() * 0.16);
      for (const side of [1, -1]) {
        // the wall stands on the band's own edge, so the walkable band is never roofed by a shoulder
        const nx = a.nx * side, nz = a.nz * side, h = side > 0 ? ha - 0.02 : 0.02 - ha, h2 = side > 0 ? hb - 0.02 : 0.02 - hb;
        // Each side answers for itself: the stair's own middle may already be out over the void, and
        // the tier's edge crosses the shoulder at an angle. The reach is marched, never assumed.
        let t = -1, ext = 0;
        for (let d = 0.2; d <= SHOULDER + 1e-9; d += 0.2) {
          const q = tierOf(mx + nx * (Math.abs(h) + d), mz + nz * (Math.abs(h) + d));
          if (q < 0) continue;                       // a ragged edge may leave gaps; keep marching
          if (t < 0) t = q;
          if (q === t) ext = d;
        }
        if (t < 0 || TIER_TOP[t]! - lw <= 1e-6) continue;
        const tt = TIER_TOP[t]!;
        const wA = [a.x + a.nx * h, tt, a.z + a.nz * h];                    // flush with the tread's edge
        const wB = [b.x + b.nx * h2, tt, b.z + b.nz * h2];
        ext = Math.max(ext, COL_R);   // always at least as far as the columns the cut left out
        const low2 = y - SKIRT - 0.1;
        if (side > 0) quad(wA, wB, atY(wB, low2), atY(wA, low2), cW);       // the wall, facing the stair
        else quad(wA, atY(wA, low2), atY(wB, low2), wB, cW);
        if (ext < 0.1) continue;
        const sA = [wA[0]! + nx * ext, tt - 0.02, wA[2]! + nz * ext], sB = [wB[0]! + nx * ext, tt - 0.02, wB[2]! + nz * ext];
        const iA = atY(wA, tt - 0.02), iB = atY(wB, tt - 0.02);
        if (side > 0) quad(sA, sB, iB, iA, cW); else quad(iA, iB, sB, sA, cW); // the shoulder, facing up
      }
    }
  }
  const stairGeo = new THREE.BufferGeometry();
  stairGeo.setAttribute('position', new THREE.Float32BufferAttribute(spos, 3));
  stairGeo.setAttribute('color', new THREE.Float32BufferAttribute(scol, 3));
  jitterColor(stairGeo, r, 0.05);
  stairGeo.computeVertexNormals();
  const stairs = new THREE.Mesh(stairGeo, rock); stairs.castShadow = true; stairs.receiveShadow = true; stairs.name = 'stairs';
  return { tiers, stairs };
}

export function makeCave(): { shell: THREE.Mesh; tiers: THREE.Mesh; floor: THREE.Mesh; pool: WaterSheet; stairs: THREE.Mesh } {
  const r = rng(101);
  const rock = makeWorldMaterial({ roughness: 1 });
  // ---- the shell: one faceted dome, inside out, rock-coloured, darker toward the top -------------
  const dome = colorize(new THREE.IcosahedronGeometry(1, 3), K.rock);
  dome.scale(66, 42, 58); dome.translate(0, -24, 0);
  const dp = dome.getAttribute('position') as THREE.BufferAttribute, dc = dome.getAttribute('color') as THREE.BufferAttribute;
  const cTop = new THREE.Color(K.rockDark), cMid = new THREE.Color(K.rock), cLow = new THREE.Color(K.rockLight);
  for (let i = 0; i < dp.count; i += 3) {
    const y = (dp.getY(i) + dp.getY(i + 1) + dp.getY(i + 2)) / 3;
    const t = clamp((y + 26) / 40, 0, 1);
    const cc = (t < 0.5 ? cLow.clone().lerp(cMid, t * 2) : cMid.clone().lerp(cTop, (t - 0.5) * 2)).multiplyScalar(0.85 + r() * 0.3);
    for (let k = 0; k < 3; k++) dc.setXYZ(i + k, cc.r, cc.g, cc.b);
  }
  // T-43: the same +/-4 % (x and z together) and +/-2.5 % (y) jitter, drawn per *unique position*.
  // By index it tore every shared corner of this detail-3 icosahedron and the cavern leaked light.
  displace(dome, r, { x: [0.96, 1.04], y: [0.975, 1.025], z: [0.96, 1.04], lockXZ: true });
  dome.computeVertexNormals();
  const shell = new THREE.Mesh(dome, makeWorldMaterial({ roughness: 1, side: THREE.BackSide }));
  shell.receiveShadow = true; shell.name = 'shell';
  const { tiers, stairs } = makeRock();
  // ---- the floor of the Depths ---------------------------------------------------------------------------
  const pos: number[] = [], col: number[] = [];
  const G = 1;
  for (let x = -62; x < 62; x += G) for (let z = -56; z < 56; z += G) {
    if (!insideCave(x + 0.5, z + 0.5)) continue;
    const quad = [[x, z], [x, z + G], [x + G, z + G], [x + G, z]] as [number, number][];
    const tri = (a: [number, number], b: [number, number], c: [number, number]) => {
      const cy = (floorY(a[0], a[1]) + floorY(b[0], b[1]) + floorY(c[0], c[1])) / 3;
      const cc = new THREE.Color(cy < FLOOR_Y - 0.4 ? '#101A30' : r() < 0.5 ? K.rock : K.rockLight).multiplyScalar(0.9 + r() * 0.2);
      for (const p of [a, b, c]) { pos.push(p[0], floorY(p[0], p[1]), p[1]); col.push(cc.r, cc.g, cc.b); }
    };
    tri(quad[0]!, quad[1]!, quad[2]!); tri(quad[0]!, quad[2]!, quad[3]!);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); fg.computeVertexNormals();
  const floor = new THREE.Mesh(fg, rock); floor.receiveShadow = true; floor.name = 'floor';
  // ---- the pool under the heart ----------------------------------------------------------------------------
  const pool = makeWaterSheet({
    box: { x0: POOL.x - 16, x1: POOL.x + 16, z0: POOL.z - 16, z1: POOL.z + 16 }, y: FLOOR_Y - 0.3, step: 0.75,
    inside: (x, z) => Math.hypot(x - POOL.x, z - POOL.z) < POOL.r * 1.02,
    edge: (x, z) => (1 - Math.hypot(x - POOL.x, z - POOL.z) / POOL.r) * 6,
    colours: { deep: K.water, shallow: K.waterLit, foam: K.foam }, wave: 0.02, mirror: 0.25,
    ripples: [[FALL.x, FALL.z], [HEART.x + 3, HEART.z - 2]],
  });
  void CAVE_TOP;
  return { shell, tiers, floor, pool, stairs };
}
