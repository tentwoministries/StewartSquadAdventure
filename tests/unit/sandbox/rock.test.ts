// The torn rocks (T-43, `docs/qa/briefs/reel-fixes-rocks-03.md`): Andrew's son saw daylight through
// the camp boulders, the stream rocks and the Hearth's boulders. `THREE.IcosahedronGeometry` is
// non-indexed in three r185, so a displacement written *by index* — a fresh random per vertex —
// moves the three copies of a shared corner apart and the faces come off each other.
//
// These tests build each site's recipe at its own amounts, prove the defect (the by-index loop) and
// prove the fix (`sandbox/_shared/rock.ts`, one scale per unique position): on a closed surface
// every undirected edge is shared by exactly two faces, so `openEdges` is 0.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { displace, groupByPosition, openEdges, type Amounts } from '../../../sandbox/_shared/rock';
import { rng } from '../../../sandbox/_shared/rng';

/** The four sites, each with the geometry it builds and the amounts it displaces by. */
const RECIPES: { name: string; geo: () => THREE.BufferGeometry; a: Amounts; verts: number; positions: number }[] = [
  {
    name: 'Forest camp boulder (props.ts, camp.md §2.2 row 21)',
    geo: () => new THREE.IcosahedronGeometry(0.65, 1),
    a: { x: [0.85, 1.15], y: [0.7, 0.9], z: [0.85, 1.15] }, verts: 240, positions: 42,
  },
  {
    name: 'Forest stream rock (terrain.ts makeStreamRocks, camp.md §2.3.2)',
    geo: () => { const g = new THREE.IcosahedronGeometry(0.7, 1); g.scale(1.2, 0.7, 1); return g; },
    a: { x: [0.9, 1.1], y: [0.9, 1.1], z: [0.9, 1.1] }, verts: 240, positions: 42,
  },
  {
    name: 'Hearth boulder (frozen-night/flora.ts boulderGeo)',
    geo: () => new THREE.IcosahedronGeometry(1.1, 1),
    a: { x: [0.85, 1.15], y: [0.65, 0.85], z: [0.85, 1.15] }, verts: 240, positions: 42,
  },
  {
    name: "Caves shell (caves-descent/terrain.ts, +/-4 % and +/-2.5 %)",
    geo: () => { const g = new THREE.IcosahedronGeometry(1, 3); g.scale(66, 42, 58); g.translate(0, -24, 0); return g; },
    a: { x: [0.96, 1.04], y: [0.975, 1.025], z: [0.96, 1.04], lockXZ: true }, verts: 960, positions: 162,
  },
];

const pos = (g: THREE.BufferGeometry): THREE.BufferAttribute => g.getAttribute('position') as THREE.BufferAttribute;

/** The bug, reproduced: a fresh random per *index*, which is what all four sites used to do. */
function displaceByIndex(g: THREE.BufferGeometry, r: () => number, a: Amounts): THREE.BufferGeometry {
  const p = pos(g);
  const pick = (q: [number, number]): number => q[0] + r() * (q[1] - q[0]);
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * pick(a.x), p.getY(i) * pick(a.y), p.getZ(i) * pick(a.z));
  g.computeVertexNormals();
  return g;
}

describe('the icosahedron the rocks are built from', () => {
  it('is non-indexed, with three copies of every corner, and closed before anyone touches it', () => {
    const d1 = new THREE.IcosahedronGeometry(1, 1);
    expect(d1.index).toBeNull();                       // verified against three r185, not assumed
    expect(pos(d1).count).toBe(240);                   // 80 faces x 3
    expect(groupByPosition(d1).count).toBe(42);        // ... over 42 unique positions
    expect(openEdges(d1)).toBe(0);                     // V - E + F = 42 - 120 + 80 = 2: a closed shell
    const d3 = new THREE.IcosahedronGeometry(1, 3);
    expect(d3.index).toBeNull();
    expect(pos(d3).count).toBe(960);
    expect(groupByPosition(d3).count).toBe(162);
    expect(openEdges(d3)).toBe(0);
  });

  it('is torn open by a displacement written by index: every edge is left with one face', () => {
    const g = displaceByIndex(new THREE.IcosahedronGeometry(0.65, 1), rng(3), RECIPES[0]!.a);
    expect(groupByPosition(g).count).toBe(240);        // no corner is shared any more
    expect(openEdges(g)).toBe(240);                    // 80 faces x 3 sides, none of them met
  });
});

describe('displace() keeps every rock recipe a closed surface', () => {
  for (const rec of RECIPES) {
    it(`${rec.name}`, () => {
      const g = rec.geo();
      expect(openEdges(g)).toBe(0);                    // before
      displace(g, rng(11), rec.a);
      expect(openEdges(g)).toBe(0);                    // ... and after
      expect(g.index).toBeNull();                      // still non-indexed: still flat-shaded
      expect(pos(g).count).toBe(rec.verts);            // no welding, no vertex count change
      expect(groupByPosition(g).count).toBe(rec.positions);
      expect(g.getAttribute('normal')).toBeDefined();  // displace() recomputes the flat normals
    });
  }
});

describe('displace() holds each site amounts and its seed', () => {
  it('scales every vertex inside its per-axis range, x and z together where the shell locks them', () => {
    for (const rec of RECIPES) {
      const before = rec.geo(), after = rec.geo();
      displace(after, rng(5), rec.a);
      const b = pos(before), t = pos(after);
      let checked = 0;
      for (let i = 0; i < b.count; i++) {
        const axes: [number, number, [number, number]][] = [
          [b.getX(i), t.getX(i), rec.a.x], [b.getY(i), t.getY(i), rec.a.y], [b.getZ(i), t.getZ(i), rec.a.z],
        ];
        for (const [v0, v1, range] of axes) {
          if (Math.abs(v0) < 1e-6) continue;           // a zero coordinate has no ratio to read
          const k = v1 / v0;
          expect(k).toBeGreaterThanOrEqual(range[0] - 1e-5);
          expect(k).toBeLessThanOrEqual(range[1] + 1e-5);
          checked++;
        }
        if (rec.a.lockXZ && Math.abs(b.getX(i)) > 1e-6 && Math.abs(b.getZ(i)) > 1e-6) {
          expect(t.getX(i) / b.getX(i)).toBeCloseTo(t.getZ(i) / b.getZ(i), 4);
        }
      }
      expect(checked).toBeGreaterThan(rec.verts);      // most of three axes per vertex, not a no-op
    }
  });

  it('is deterministic: the same seed and recipe give the same positions', () => {
    const a = RECIPES[0]!.geo(), b = RECIPES[0]!.geo();
    displace(a, rng(27), RECIPES[0]!.a);
    displace(b, rng(27), RECIPES[0]!.a);
    expect(Array.from(pos(a).array)).toEqual(Array.from(pos(b).array));
  });
});
