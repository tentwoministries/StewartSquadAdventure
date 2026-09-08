// Placement marches for the west rim, kept pure on purpose: no three, no renderer, no DOM, plain
// numbers in and out, every ground test injected. `tests/unit/sandbox/` imports this file directly.
//
// Why it exists (OPUS_EXPERIMENT_VERDICT.md §3.5, LESSONS.md "Density and scale"): the deer was put
// on "the bank" by subtracting the pond's radius and ended up standing over the void, and
// `findLip()` promised a search and returned a constant. Both are the same mistake — a position
// asserted instead of found — so both are one march here, and anything this scene places near the
// plate's organic edge goes through it.
//
// Bearings are the runtime's: degrees, 0 → −z, 90 → +x (`_shared/shot.ts` placeCamera,
// `_shared/rig.ts` face). Distances are metres.

export interface Pt { x: number; z: number }

/** A ground test: the plate's organic edge (`forest-dusk/terrain.ts` `inside`), or a composed
 *  "on the plate and dry enough to stand on". True means "this square metre is ground". */
export type Ground = (x: number, z: number) => boolean;

const RAD = Math.PI / 180;

/** The unit direction of a compass bearing in degrees (0 → −z, 90 → +x). */
export function bearingDir(bearing: number): Pt {
  return { x: Math.sin(bearing * RAD), z: -Math.cos(bearing * RAD) };
}

/** The bearing in degrees [0, 360) from (ax, az) to (bx, bz), the same convention. */
export function bearingTo(ax: number, az: number, bx: number, bz: number): number {
  return ((Math.atan2(bx - ax, -(bz - az)) / RAD) + 360) % 360;
}

export interface March {
  /** The last point at which `ok` still held. */
  point: Pt;
  /** True when the march ran off the edge (`ok` failed), false when it simply reached the end. */
  hitEdge: boolean;
  /** Distance from the start to `point`, in metres. */
  travelled: number;
}

/**
 * March from (ax, az) toward (bx, bz) in `step` metre steps and report the last point at which
 * `ok` held. Null when the start itself is not ground — a caller that gets null has asked for a
 * bank from somewhere off the island, which is worth failing loudly rather than guessing.
 */
export function marchEdge(ax: number, az: number, bx: number, bz: number, ok: Ground, step = 0.1): March | null {
  if (!ok(ax, az)) return null;
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 1e-9) return { point: { x: ax, z: az }, hitEdge: false, travelled: 0 };
  const n = Math.max(1, Math.ceil(len / Math.max(1e-3, step)));
  let last: Pt = { x: ax, z: az };
  let travelled = 0;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const p = { x: ax + dx * u, z: az + dz * u };
    if (!ok(p.x, p.z)) return { point: last, hitEdge: true, travelled };
    last = p;
    travelled = len * u;
  }
  return { point: last, hitEdge: false, travelled };
}

/**
 * The bank on `bearing` from (cx, cz): march outward until `ok` stops holding, then step `back`
 * metres in from the edge. Null when the centre is not ground, when the march never leaves the
 * ground inside `max` (there is no bank that way), or when the stepped-back point is not ground.
 */
export function bankPoint(cx: number, cz: number, bearing: number, ok: Ground, step = 0.1, back = 1.5, max = 60): Pt | null {
  const d = bearingDir(bearing);
  const m = marchEdge(cx, cz, cx + d.x * max, cz + d.z * max, ok, step);
  if (!m || !m.hitEdge) return null;
  const p = { x: m.point.x - d.x * back, z: m.point.z - d.z * back };
  return ok(p.x, p.z) ? p : null;
}

/**
 * The shore: march *outward* from (cx, cz) and return the first point at which `land` holds — where
 * a pond's basin rises out of its own water. `bankPoint` finds the far edge of the ground; this
 * finds the near edge of it, which is what an animal at a waterside stands on. Null when nothing
 * within `max` is land.
 */
export function shorePoint(cx: number, cz: number, bearing: number, land: Ground, step = 0.1, max = 20): Pt | null {
  const d = bearingDir(bearing);
  const n = Math.max(1, Math.ceil(max / Math.max(1e-3, step)));
  for (let i = 0; i <= n; i++) {
    const r = (i / n) * max;
    const p = { x: cx + d.x * r, z: cz + d.z * r };
    if (land(p.x, p.z)) return p;
  }
  return null;
}

/** True when `ok` holds all round (cx, cz) at `radius`, sampled on `spokes` bearings: the room a
 *  creature's wander needs, which one `inside()` test at a point does not give. */
export function hasRoom(cx: number, cz: number, ok: Ground, radius = 3.6, spokes = 12): boolean {
  for (let s = 0; s < spokes; s++) {
    const a = (s / spokes) * Math.PI * 2;
    if (!ok(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius)) return false;
  }
  return true;
}

/** The Forest stream's tail (`forest-dusk/terrain.ts` STREAM's last three control points). The last
 *  two are both past the plate's organic edge, which is the whole problem: the water ribbon runs on
 *  to (−58, 44) with nothing under it. The march starts at (−40, 31), which is on the island. */
export const STREAM_TAIL: readonly Pt[] = [{ x: -40, z: 31 }, { x: -52, z: 40 }, { x: -58, z: 44 }];

/**
 * The lip: the last point along the stream's tail that the plate still contains. This is the
 * search `findLip()` used to claim and not do — walk the polyline outward and stop where `ok`
 * fails. Null when the line starts off the plate or never leaves it.
 */
export function findLip(ok: Ground, step = 0.05, line: readonly Pt[] = STREAM_TAIL): Pt | null {
  let start = line[0];
  if (!start || !ok(start.x, start.z)) return null;
  for (let i = 1; i < line.length; i++) {
    const b = line[i]!;
    const m = marchEdge(start.x, start.z, b.x, b.z, ok, step);
    if (!m) return null;
    if (m.hitEdge) return m.point;
    start = m.point;
  }
  return null;
}

/**
 * The point nearest (cx, cz) that satisfies `ok`, searched on rings of `step` metres out to `max`
 * (the centre itself first). Used where a spot is authored by eye and has to be nudged on to real
 * ground without moving far: Liam's stand at the stream's last bend.
 */
export function nearestOk(cx: number, cz: number, ok: Ground, step = 0.25, max = 6, spokes = 24): Pt | null {
  if (ok(cx, cz)) return { x: cx, z: cz };
  const rings = Math.max(1, Math.round(max / step));
  for (let i = 1; i <= rings; i++) {
    const r = i * step;
    for (let s = 0; s < spokes; s++) {
      const a = (s / spokes) * Math.PI * 2;
      const p = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r };
      if (ok(p.x, p.z)) return p;
    }
  }
  return null;
}
