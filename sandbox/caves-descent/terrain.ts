// The Crystal Caves, the tiered descent to the heart (T-01..T-04, PHASE_0.75_TWEAKS.md; the board
// docs/design/mockups/boards/caves-cross-section.svg): Lamplight Landing at the mouth (tier 0),
// a stair down the west wall to the gallery ledge (tier 1, −11 m), a second stair to the Depths
// (tier 2, −26 m) where the crystal heart pulses in its pool under the waterfall that falls from
// the Forest's roots. The tiers are columnar rock; the cavern is one faceted shell; the void in
// the middle is the spectacle (a step limit in the walk keeps the kids on their tier).
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
 *  bearings); a tread is TREAD m of arc; the stair's skirt hangs SKIRT below it; a column the stair
 *  crosses tops out CUT below the tread. */
export const MOUTH_W = 5.0, MOUTH_RUN = 3.0, TREAD = 0.15, SKIRT = 0.6, CUT = 0.3;
/** The level apron the stair keeps on its tier before the first tread drops: at least a column's
 *  reach, so no rock that is left standing behind the mouth can poke through the steps in front. */
export const APRON_BACK = 3.5;
/** The apron: the tier reaches 2 m round its stair's first point, so the mouth is never off it. */
const APRON = 2.0;

export interface StairPt { x: number; z: number; y: number; nx: number; nz: number; s: number }
/** A stair resampled by arc length: one cross-section every TREAD m, each with its mitred normal.
 *  Both the drawn strip and `stairY` read this, so what is walked is what is drawn (T-55). */
export interface StairPath { pts: StairPt[]; len: number; w: number; x0: number; x1: number; z0: number; z1: number }

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
  return { pts, len, w: st.w, x0: x0 - m, x1: x1 + m, z0: z0 - m, z1: z1 + m };
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
 *  centreline: at a turn the outer edge of a step is the same height as the inner edge. */
export function onStair(p: StairPath, x: number, z: number): { s: number; y: number; off: number } {
  const pts = p.pts;
  const d0 = (x - pts[0]!.x) * pts[0]!.nz - (z - pts[0]!.z) * pts[0]!.nx;
  if (d0 < 0) return { s: 0, y: pts[0]!.y, off: Math.hypot(x - pts[0]!.x, z - pts[0]!.z) }; // the cap before the mouth
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    const da = (x - a.x) * a.nz - (z - a.z) * a.nx;      // ahead of cross-section i
    const db = (x - b.x) * b.nz - (z - b.z) * b.nx;      // ahead of cross-section i + 1
    if (da < 0 || db >= 0) continue;
    const u = clamp(da / (da - db), 0, 1);
    const off = lerp((x - a.x) * a.nx + (z - a.z) * a.nz, (x - b.x) * b.nx + (z - b.z) * b.nz, u);
    return { s: lerp(a.s, b.s, u), y: lerp(a.y, b.y, u), off };
  }
  const e = pts[pts.length - 1]!;                        // the cap past the foot
  return { s: p.len, y: e.y, off: Math.hypot(x - e.x, z - e.z) };
}
/** The stair's walking height, or null off every stair. The band test is inclusive: a point exactly
 *  on the boundary is on the stair (LESSONS.md's songbirds row). */
export function stairY(x: number, z: number): number | null {
  for (const p of PATHS) {
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    const q = onStair(p, x, z);
    if (Math.abs(q.off) <= halfAt(p, q.s) + 1e-9) return q.y;
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
    const q = onStair(p, x, z);
    const half = halfAt(p, q.s);
    if (Math.abs(q.off) <= half + SHOULDER) return { tread: q.y, off: q.off, half };
  }
  return null;
}
const nearMouth = (i: number, x: number, z: number): boolean => Math.hypot(x - PATHS[i]!.pts[0]!.x, z - PATHS[i]!.pts[0]!.z) <= APRON;
export function onLanding(x: number, z: number): boolean { return (x > LANDING.x0 && x < LANDING.x1 && z > LANDING.z0 && z < LANDING.z1 && Math.hypot(x - 1, z + 35) < 24) || nearMouth(0, x, z); }
export function onTier1(x: number, z: number): boolean { return inPoly(x, z, CRESCENT) || Math.hypot(x - GALLERY.x, z - GALLERY.z) < 8 || nearMouth(1, x, z); }
/** The tier a point stands on, or −1 in the void: 0 the Landing, 1 the gallery ledge. */
export function tierOf(x: number, z: number): number { return onLanding(x, z) ? 0 : onTier1(x, z) ? 1 : -1; }
export const TIER_TOP = [0, TIER1_Y];
export function floorY(x: number, z: number): number {
  let h = FLOOR_Y + 0.5 * noise(x / 9, z / 9) + 0.2 * noise(x / 3, z / 3);
  const dp = Math.hypot(x - POOL.x, z - POOL.z) / POOL.r;
  if (dp < 1.3) h = lerp(h, FLOOR_Y - 1.4 * (1 - clamp(dp, 0, 1) ** 2), smoothstep(1.3, 1.0, dp));
  return h;
}
/** Walking height: stairs first, then the ledges, then the floor; the void is the floor (the step
 *  limit blocks it). T-56: a tier is flat at its own height, because a column's top is one number
 *  and the two have to agree to 0.05 m for a ring to lie on the ground and a foot to land on it. */
export function groundY(x: number, z: number): number {
  const s = stairY(x, z);
  if (s !== null) return s;
  const t = tierOf(x, z);
  if (t >= 0) return TIER_TOP[t]!;
  return floorY(x, z);
}
export function insideCave(x: number, z: number): boolean { return Math.hypot(x / 62, z / 54) < 1; }

const CAVE_TOP = 14;

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
  // ---- the tiers: columnar rock from the ledge top down to the floor. The tops carry no y jitter
  //      (T-56) — only a 0 to 3 cm sink so overlapping tops do not z-fight — so the rock a kid
  //      stands on is `groundY` to within 0.03 m and a ring at ground + 0.04 lies on it. The grid is
  //      hex-packed at 2.1 m: with a 1.55 m column the worst-covered point is 1.29 m from a centre
  //      and the top radius is 1.34 m across the flats, so the floor has no holes to fall through.
  const cols: THREE.BufferGeometry[] = [];
  const colAt = (x: number, z: number, top: number) => {
    const bottom = floorY(x, z) - 1;
    const h = top - bottom;
    const g = colorize(new THREE.CylinderGeometry(1.55, 1.65, h, 6), r() < 0.5 ? K.rock : K.rockLight);
    const gc = g.getAttribute('color') as THREE.BufferAttribute, gp = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < gp.count; i++) if (gp.getY(i) > h / 2 - 0.01) { const c = new THREE.Color('#4A4270'); gc.setXYZ(i, c.r, c.g, c.b); }
    g.rotateY(r() * 6.28); g.translate(x + (r() - 0.5) * 0.16, bottom + h / 2, z + (r() - 0.5) * 0.16);
    cols.push(g);
  };
  // the halo: a column stands wherever the tier comes within a column's own top radius of the grid
  // point, so the rock reaches under every walkable point, into the crescent's thin north tip too
  const HALO: [number, number][] = [];
  for (let ox = -1.4; ox <= 1.41; ox += 0.35) for (let oz = -1.4; oz <= 1.41; oz += 0.35) if (ox * ox + oz * oz > 1e-6 && Math.hypot(ox, oz) <= 1.4) HALO.push([ox, oz]);
  const DZ = 2.1 * Math.sqrt(3) / 2;
  for (let iz = 0; -52 + iz * DZ <= 52; iz++) {
    const z = -52 + iz * DZ;
    for (let x = -60 + (iz % 2 ? 1.05 : 0); x <= 60; x += 2.1) {
      if (!insideCave(x, z)) continue;
      // one ring of columns past the tier's edge, so the rock reaches under every walkable point
      let t = tierOf(x, z);
      if (t < 0) for (const [ox, oz] of HALO) { const u = tierOf(x + ox, z + oz); if (u >= 0) { t = u; break; } }
      if (t < 0) continue;
      const top = TIER_TOP[t]!;
      // T-55: where a stair crosses a tier the tier is cut to the stair. A column under the band
      // tops out CUT below the *lowest* tread its 1.7 m body reaches, so it holds the steps up and
      // never pokes through one; between the band and the shoulder no column stands at all.
      const c = cutAt(x, z);
      const low = c ? lowTread(x, z) : null;
      if (c && low !== null && low < top - 1e-6) {
        if (Math.abs(c.off) <= c.half) { colAt(x, z, low - CUT); continue; }   // cut to the lowest tread it reaches
        if (Math.abs(c.off) <= c.half + COL_R) continue;                        // the shoulder is the floor here
      }
      colAt(x, z, top - r() * 0.03);
    }
  }
  const tiersGeo = mergeGeos(cols); jitterColor(tiersGeo, r, 0.05);
  const tiers = new THREE.Mesh(tiersGeo, rock); tiers.castShadow = true; tiers.receiveShadow = true; tiers.name = 'tiers';
  // ---- the stairs: one strip swept along each path, a level tread per cell with its riser, the
  //      skirt under it and no gap at a turn (consecutive cells share a cross-section). The tread is
  //      flat at the ramp's height in the middle of the cell, so what is drawn is within half a
  //      rise (≤ 0.05 m) of what `stairY` walks, everywhere (T-55).
  const spos: number[] = [], scol: number[] = [];
  const vtx = (p: number[], c: THREE.Color) => { spos.push(p[0]!, p[1]!, p[2]!); scol.push(c.r, c.g, c.b); };
  const quad = (a: number[], b: number[], c2: number[], d: number[], col: THREE.Color) => {
    vtx(a, col); vtx(b, col); vtx(c2, col);
    vtx(a, col); vtx(c2, col); vtx(d, col);
  };
  const drop = (p: number[], dy: number): number[] => [p[0]!, p[1]! + dy, p[2]!];
  const atY = (p: number[], y: number): number[] => [p[0]!, y, p[2]!];
  for (const p of PATHS) {
    for (let i = 0; i + 1 < p.pts.length; i++) {
      const a = p.pts[i]!, b = p.pts[i + 1]!;
      const ha = halfAt(p, a.s) + 0.02, hb = halfAt(p, b.s) + 0.02;   // the drawn tread covers the whole walkable band
      const y = (a.y + b.y) / 2;                                            // this tread, level
      const yn = i + 2 < p.pts.length ? (b.y + p.pts[i + 2]!.y) / 2 : b.y;   // the next one
      const aL = [a.x + a.nx * ha, y, a.z + a.nz * ha], aR = [a.x - a.nx * ha, y, a.z - a.nz * ha];
      const bL = [b.x + b.nx * hb, y, b.z + b.nz * hb], bR = [b.x - b.nx * hb, y, b.z - b.nz * hb];
      // the skirt hangs a hair inside the tread's edge, so it is never coplanar with the channel wall
      const ka = ha - 0.03, kb = hb - 0.03;
      const kL = [a.x + a.nx * ka, y, a.z + a.nz * ka], kR = [a.x - a.nx * ka, y, a.z - a.nz * ka];
      const jL = [b.x + b.nx * kb, y, b.z + b.nz * kb], jR = [b.x - b.nx * kb, y, b.z - b.nz * kb];
      const cT = new THREE.Color(Math.floor(i / 4) % 2 ? K.rockLight : '#4A4270').multiplyScalar(0.93 + r() * 0.14);
      const cR = cT.clone().multiplyScalar(0.7);
      const cS = new THREE.Color(K.rock).multiplyScalar(0.82 + r() * 0.2);
      quad(aL, bL, bR, aR, cT);                                             // the tread, facing up
      quad(atY(bL, yn), bL, bR, atY(bR, yn), cR);                           // the riser, facing back up the stair
      quad(kL, drop(kL, -SKIRT), drop(jL, -SKIRT), jL, cS);                 // the two skirts
      quad(kR, jR, drop(jR, -SKIRT), drop(kR, -SKIRT), cS);
      quad(drop(kL, -SKIRT), drop(kR, -SKIRT), drop(jR, -SKIRT), drop(jL, -SKIRT), cS);
      // where the stair is cut into a tier, the channel's wall and the shoulder either side of it:
      // the tier's floor stops at the band, drops to the trench and carries on at its own height.
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
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
        const lo = y - SKIRT - 0.1;
        if (side > 0) quad(wA, wB, atY(wB, lo), atY(wA, lo), cW);           // the wall, facing the stair
        else quad(wA, atY(wA, lo), atY(wB, lo), wB, cW);
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
  stairGeo.computeVertexNormals();
  const stairs = new THREE.Mesh(stairGeo, rock); stairs.castShadow = true; stairs.receiveShadow = true; stairs.name = 'stairs';
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
