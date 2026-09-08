// Rocks: displacing a low-poly lump without tearing it open (T-43, reel fixes round 1).
//
// Verified against the installed three r185 (2026-09-08, one `node -e` run): `new
// THREE.IcosahedronGeometry(s, d)` is **non-indexed** — detail 1 is 240 position vertices (80 faces
// x 3), detail 3 is 960 (320 faces) — and the three copies of a shared corner are **bit-identical**
// (240 vertices reduce to 42 exactly-unique positions, 960 to 162, still exact after `scale()` and
// `translate()`, which apply the same arithmetic to every copy). Displacing such a geometry *by
// index*, with a fresh random per index, therefore moves the copies of one corner apart and the
// faces come off each other: the rock shows daylight through the unmet seams (Andrew's son, on the
// camp boulders, the stream rocks and the Hearth's boulders).
//
// `displace()` draws one scale per **unique position** and applies it to every copy of that corner,
// so the surface stays closed. It stays non-indexed and flat-shaded — the same faceting as before,
// the same "one value per face" (LESSONS.md §0 rule 3), just with the corners agreeing.
// `openEdges()` is the check that says so: on a closed surface every undirected edge is shared by
// exactly two faces.
import type * as THREE from 'three';

/** Per-axis multiplier ranges `[lo, hi]`. `lockXZ` draws one scale for x and z together. */
export interface Amounts {
  x: [number, number];
  y: [number, number];
  z: [number, number];
  lockXZ?: boolean;
}

/**
 * Default position quantisation, in metres. The copies of a corner are bit-identical, so any
 * tolerance below the shortest edge groups them and nothing straddles a bucket boundary; 1e-4 suits
 * a metre-scale rock. The caves' shell is scaled to 66 m and passes a coarser one.
 */
export const TOL = 1e-4;

/** Vertex index -> group id, one group per unique (quantised) position. */
export function groupByPosition(geo: THREE.BufferGeometry, tol = TOL): { group: Int32Array; count: number } {
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  const seen = new Map<string, number>();
  const group = new Int32Array(p.count);
  let n = 0;
  const q = (v: number): number => Math.round(v / tol);
  for (let i = 0; i < p.count; i++) {
    const k = `${q(p.getX(i))},${q(p.getY(i))},${q(p.getZ(i))}`;
    let g = seen.get(k);
    if (g === undefined) { g = n++; seen.set(k, g); }
    group[i] = g;
  }
  return { group, count: n };
}

/**
 * Scale every vertex about the geometry's origin by one random factor per unique position, then
 * recompute the (flat) normals. In place; returns the same geometry so it can be chained.
 */
export function displace(geo: THREE.BufferGeometry, r: () => number, a: Amounts, tol = TOL): THREE.BufferGeometry {
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  const { group, count } = groupByPosition(geo, tol);
  const sx = new Float64Array(count), sy = new Float64Array(count), sz = new Float64Array(count);
  const drawn = new Uint8Array(count);
  const pick = (range: [number, number]): number => range[0] + r() * (range[1] - range[0]);
  for (let i = 0; i < p.count; i++) {
    const g = group[i]!;
    if (drawn[g]) continue;
    drawn[g] = 1;
    const x = pick(a.x);           // draw order per group: x (or xz), then y, then z
    sx[g] = x;
    sy[g] = pick(a.y);
    sz[g] = a.lockXZ ? x : pick(a.z);
  }
  for (let i = 0; i < p.count; i++) {
    const g = group[i]!;
    p.setXYZ(i, p.getX(i) * sx[g]!, p.getY(i) * sy[g]!, p.getZ(i) * sz[g]!);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * How many undirected edges are *not* shared by exactly two faces, edges taken between unique
 * positions. Zero on a closed surface; a by-index displacement of an icosahedron separates every
 * corner and reports one open edge per triangle side.
 */
export function openEdges(geo: THREE.BufferGeometry, tol = TOL): number {
  const { group } = groupByPosition(geo, tol);
  const idx = geo.index;
  const vertexAt = (k: number): number => (idx ? idx.getX(k) : k);
  const corners = idx ? idx.count : (geo.getAttribute('position') as THREE.BufferAttribute).count;
  const edges = new Map<string, number>();
  for (let f = 0; f + 2 < corners; f += 3) {
    const v = [group[vertexAt(f)]!, group[vertexAt(f + 1)]!, group[vertexAt(f + 2)]!];
    for (let e = 0; e < 3; e++) {
      const a = v[e]!, b = v[(e + 1) % 3]!;
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      edges.set(k, (edges.get(k) ?? 0) + 1);
    }
  }
  let open = 0;
  for (const n of edges.values()) if (n !== 2) open++;
  return open;
}
