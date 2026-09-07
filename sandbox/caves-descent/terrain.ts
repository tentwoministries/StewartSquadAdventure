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
/** Stairs as polylines with a width; y interpolates along each. */
export const STAIRS: { pts: [number, number, number][]; w: number }[] = [
  { pts: [[-14, -36, 0], [-20, -32, -2.5], [-28, -26, -6], [-33, -18, -9.5], [-34, -10, -11]], w: 3.2 },
  { pts: [[-30, 26, -11], [-24, 32, -14.5], [-16, 34, -19], [-8, 34, -23.5], [-2, 32, -26]], w: 3.2 },
];

function inPoly(x: number, z: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]!, [xj, zj] = poly[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function stairY(x: number, z: number): number | null {
  for (const s of STAIRS) {
    for (let i = 0; i + 1 < s.pts.length; i++) {
      const [ax, az, ay] = s.pts[i]!, [bx, bz, by] = s.pts[i + 1]!;
      const vx = bx - ax, vz = bz - az;
      const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
      const d = Math.hypot(x - ax - vx * t, z - az - vz * t);
      if (d < s.w / 2) return lerp(ay, by, t);
    }
  }
  return null;
}
export function onLanding(x: number, z: number): boolean { return x > LANDING.x0 && x < LANDING.x1 && z > LANDING.z0 && z < LANDING.z1 && Math.hypot(x - 1, z + 35) < 24; }
export function onTier1(x: number, z: number): boolean { return inPoly(x, z, CRESCENT) || Math.hypot(x - GALLERY.x, z - GALLERY.z) < 8; }
export function floorY(x: number, z: number): number {
  let h = FLOOR_Y + 0.5 * noise(x / 9, z / 9) + 0.2 * noise(x / 3, z / 3);
  const dp = Math.hypot(x - POOL.x, z - POOL.z) / POOL.r;
  if (dp < 1.3) h = lerp(h, FLOOR_Y - 1.4 * (1 - clamp(dp, 0, 1) ** 2), smoothstep(1.3, 1.0, dp));
  return h;
}
/** Walking height: stairs first, then the ledges, then the floor; the void is the floor (the step limit blocks it). */
export function groundY(x: number, z: number): number {
  const s = stairY(x, z);
  if (s !== null) return s;
  if (onLanding(x, z)) return 0.15 * noise(x / 4, z / 4);
  if (onTier1(x, z)) return TIER1_Y + 0.15 * noise(x / 4, z / 4);
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
    for (let k = 0; k < 3; k++) { dc.setXYZ(i + k, cc.r, cc.g, cc.b); const jit = 1 + (r() - 0.5) * 0.08; dp.setXYZ(i + k, dp.getX(i + k) * jit, dp.getY(i + k) * (1 + (r() - 0.5) * 0.05), dp.getZ(i + k) * jit); }
  }
  dome.computeVertexNormals();
  const shell = new THREE.Mesh(dome, makeWorldMaterial({ roughness: 1, side: THREE.BackSide }));
  shell.receiveShadow = true;
  // ---- the tiers: columnar rock (2 m columns from the ledge top down to the floor, jittered) -------
  const cols: THREE.BufferGeometry[] = [];
  const colAt = (x: number, z: number, top: number) => {
    const bottom = floorY(x, z) - 1;
    const h = top - bottom;
    const g = colorize(new THREE.CylinderGeometry(1.25, 1.35, h, 6), r() < 0.5 ? K.rock : K.rockLight);
    const gc = g.getAttribute('color') as THREE.BufferAttribute, gp = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < gp.count; i++) if (gp.getY(i) > h / 2 - 0.01) { const c = new THREE.Color('#4A4270'); gc.setXYZ(i, c.r, c.g, c.b); }
    g.rotateY(r() * 6.28); g.translate(x + (r() - 0.5) * 0.3, bottom + h / 2 + (r() - 0.5) * 0.25, z + (r() - 0.5) * 0.3);
    cols.push(g);
  };
  for (let x = -60; x <= 60; x += 2.1) for (let z = -52; z <= 52; z += 2.1) {
    if (!insideCave(x, z)) continue;
    if (onLanding(x, z)) colAt(x, z, 0.15 * noise(x / 4, z / 4));
    else if (onTier1(x, z)) colAt(x, z, TIER1_Y + 0.15 * noise(x / 4, z / 4));
  }
  const tiersGeo = mergeGeos(cols); jitterColor(tiersGeo, r, 0.05);
  const tiers = new THREE.Mesh(tiersGeo, rock); tiers.castShadow = true; tiers.receiveShadow = true;
  // ---- the stairs: steps along each polyline ----------------------------------------------------------
  const steps: THREE.BufferGeometry[] = [];
  for (const s of STAIRS) {
    for (let i = 0; i + 1 < s.pts.length; i++) {
      const [ax, az, ay] = s.pts[i]!, [bx, bz, by] = s.pts[i + 1]!;
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(Math.abs(by - ay) / 0.42));
      const ang = Math.atan2(bx - ax, bz - az);
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const g = colorize(new THREE.BoxGeometry(s.w + 0.6, 0.5, len / n + 0.15), k % 2 ? K.rockLight : '#4A4270');
        g.rotateY(ang); g.translate(lerp(ax, bx, t), lerp(ay, by, t) - 0.25, lerp(az, bz, t));
        steps.push(g);
      }
    }
  }
  const stairGeo = mergeGeos(steps); jitterColor(stairGeo, r, 0.05);
  const stairs = new THREE.Mesh(stairGeo, rock); stairs.castShadow = true; stairs.receiveShadow = true;
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
  const floor = new THREE.Mesh(fg, rock); floor.receiveShadow = true;
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
