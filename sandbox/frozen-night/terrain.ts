// Frozen Peaks, the valley under the aurora (story-beats.md §2.2 Frozen): rolling snow with wind
// drifts, the Hearth's flat, the snowfield strip, the frozen lake (an ice sheet you can walk on),
// the glacier shelf raised above the valley, the north cliff where the ice-fall hangs, and the
// mountain backdrop beyond the rim. Snow is brighter than every other ground (world-events §2.1.4).
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { FROZEN as F } from '../_shared/biomes';
import { colorize, makeWorldMaterial, mergeGeos } from '../_shared/material';
import { makePlate, makeRim } from '../_shared/rim';
import { clamp, lerp, rng, smoothstep } from '../_shared/rng';
import { makeWaterSheet, type WaterSheet } from '../_shared/water';

export const PLATE = { x0: -56, x1: 60, z0: -52, z1: 52 };
export const noise = createNoise2D(rng(67));
export const HEARTH = { x: 0, z: 0, r: 9 };
export const STRIP = { x0: -12, x1: 40, z0: 17, z1: 23 };
export const LAKE = { x: -24, z: 12, r: 14 };
export const ICE_Y = -0.12;
export const SHELF = { x: 31, z: -22, r: 10, h: 2.6 };
export const ICEFALL = { x: -8, z: -40, w: 24 };
export const OBSERVATORY = { x: 48, z: -44 };
// The penguins' slide: top → bottom. The top must sit clear of the lake basin's smoothing (T-51:
// the old top at (−33, 1) had lakeD 1.01, so terrainY pulled it *below* the foot and the colony
// slid uphill); it now sits at lakeD ≈ 1.5 and the foot meets the lake shore at lakeD ≈ 1.05.
// Asserted by sampling in scripts/probes/frozen-drift.cjs, never by arithmetic on a radius.
export const DRIFT = { x0: -40.5, z0: -3, x1: -35, z1: 1.5 };
// The ice-fall's frozen pool (T-53): `y` is the sheet's level, and terrainY digs a bed under it and
// holds a shore at or above it. Moved 4.5 m south of the old disc centre (−8, −30) so the whole
// basin lies on the flat: the cliff's toe climbs ~0.9 m per metre north of z = −31, and a 7 m dish
// centred there would have had to cut a 4.5 m scarp out of it (sampled, docs/design/mockups/LOG.md).
export const POOL = { x: -8, z: -25.5, r: 7.1, y: -0.1 };

export function inside(x: number, z: number): boolean {
  const ex = 3 * noise(z / 14, 100), ez = 3 * noise(x / 14, 200);
  return x > PLATE.x0 + 4 + ex && x < PLATE.x1 - 4 - ex && z > PLATE.z0 + 4 + ez && z < PLATE.z1 - 4 - ez;
}
export function lakeD(x: number, z: number): number {
  return Math.hypot(x - LAKE.x, z - LAKE.z) / (LAKE.r * (1 + 0.08 * noise(x / 4, z / 4)));
}
export function terrainY(x: number, z: number): number {
  let h = 0.9 * noise(x / 24, z / 24) + 0.3 * noise(x / 8, z / 8) + 0.25 * (1 - Math.abs(noise(x / 6 + 9, z / 34))) + 0.2;
  // the north cliff rises to the ice-fall's lip; the whole north edge climbs
  h += 11 * smoothstep(-30, -44, z) * (0.85 + 0.15 * noise(x / 7, 3));
  // the glacier shelf: a plateau with a broken edge
  const ds = Math.hypot(x - SHELF.x, z - SHELF.z) / (1 + 0.1 * noise(x / 5, z / 5));
  h += SHELF.h * smoothstep(SHELF.r + 1.5, SHELF.r - 1.5, ds);
  // the observatory's mound
  h += 6 * Math.exp(-((x - OBSERVATORY.x) ** 2 + (z - OBSERVATORY.z) ** 2) / 220);
  // flats: the Hearth and the strip
  h = lerp(h, 0.25, smoothstep(HEARTH.r + 3, HEARTH.r - 1, Math.hypot(x, z)));
  const strip = smoothstep(2.5, 0, Math.max(STRIP.z0 - z, z - STRIP.z1, STRIP.x0 - x, x - STRIP.x1));
  h = lerp(h, 0.15, strip);
  // the penguins' drift: a smooth slope from the top to the lake shore
  const dx = DRIFT.x1 - DRIFT.x0, dz = DRIFT.z1 - DRIFT.z0;
  const tt = clamp(((x - DRIFT.x0) * dx + (z - DRIFT.z0) * dz) / (dx * dx + dz * dz), 0, 1);
  const dd = Math.hypot(x - DRIFT.x0 - dx * tt, z - DRIFT.z0 - dz * tt);
  h = lerp(h, 2.2 * (1 - tt) + 0.1, smoothstep(3.5, 1.5, dd));
  // the lake basin, ice over it
  const ld = lakeD(x, z);
  if (ld < 1.3) h = lerp(h, Math.min(h, 0) - 0.8 * (1 - clamp(ld, 0, 1) ** 2), smoothstep(1.3, 1.0, ld));
  // the ice-fall's pool lies in a basin (T-53): a bed 0.25 m under the sheet inside 6.5 m, a shore
  // at or above the sheet from 7.05 to 8.8 m, then the natural ground again by 10.4 m. The bed only
  // ever *lowers* the ground and the shore only ever *raises* it, so the cliff's toe behind the
  // pool keeps its own height instead of being quarried into a scarp.
  const pd = Math.hypot(x - POOL.x, z - POOL.z);
  if (pd < 10.4) {
    const bed = Math.min(h, POOL.y - 0.25);
    const shore = Math.max(h, POOL.y + 0.1);
    h = lerp(bed, lerp(shore, h, smoothstep(8.8, 10.4, pd)), smoothstep(6.5, 7.05, pd));
  }
  return h;
}
export function groundY(x: number, z: number): number {
  const ld = lakeD(x, z);
  const t = terrainY(x, z);
  // the ice-fall's pool is frozen too: inside its waterline the sheet is what a kid or a creature
  // stands on, exactly as the lake's ice is (T-53; without this the S4 kid stands in the bed, 0.25 m
  // under the sheet, and reads as sunk to the knees)
  if (t < POOL.y && Math.hypot(x - POOL.x, z - POOL.z) < POOL.r - 0.2) return POOL.y;
  return ld < 1.02 && t < ICE_Y ? ICE_Y : t;
}
export function onIce(x: number, z: number): boolean { return lakeD(x, z) < 1.0 && terrainY(x, z) < ICE_Y; }

function faceColor(cx: number, cz: number, hy: number, ny: number, nx: number, nz: number, r: () => number): THREE.Color {
  const out = new THREE.Color(F.snow);
  // north-facing and steep faces take the blue shadow tint; crests stay white
  const steep = 1 - ny;
  if (nz < -0.15) out.lerp(new THREE.Color(F.snowShadow), clamp(-nz * 1.6, 0, 0.6));
  if (nx > 0.2) out.lerp(new THREE.Color(F.snowShadow), clamp(nx * 0.8, 0, 0.35));
  out.lerp(new THREE.Color(F.snowBlue), clamp(steep * 1.5, 0, 0.5));
  // rock shows through on the steepest faces (the cliff, the shelf edge)
  if (ny < 0.62) out.lerp(new THREE.Color(F.rock), clamp((0.62 - ny) * 3, 0, 0.85));
  if (ny < 0.4) out.lerp(new THREE.Color(F.rockDark), 0.4);
  // the lake bed under the ice, the trodden path from the hut to the lake, the packed strip
  if (hy < ICE_Y - 0.02 && lakeD(cx, cz) < 1.05) out.set('#7A9AB8');
  const pd = pathDist(cx, cz);
  if (pd < 1.3) out.lerp(new THREE.Color('#D4DEEC'), 0.5 * (1 - smoothstep(0.6, 1.3, pd)));
  const strip = smoothstep(2.5, 0, Math.max(STRIP.z0 - cz, cz - STRIP.z1, STRIP.x0 - cx, cx - STRIP.x1));
  if (strip > 0) out.lerp(new THREE.Color('#DCE6F2'), 0.7 * strip);
  out.multiplyScalar(1 + (r() * 2 - 1) * 0.035);
  return out;
}
const PATH: [number, number][] = [[0, 2], [-8, 6], [-14, 10]];
function pathDist(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i + 1 < PATH.length; i++) {
    const [ax, az] = PATH[i]!, [bx, bz] = PATH[i + 1]!;
    const vx = bx - ax, vz = bz - az;
    const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return best;
}

export function makeTerrain(): { mesh: THREE.Mesh; rim: THREE.Mesh; ice: WaterSheet; peaks: THREE.Mesh } {
  const r = rng(101);
  const mesh = makePlate(PLATE, inside, terrainY, (cx, cz, hy, ny, nx, nz) => faceColor(cx, cz, hy, ny, nx, nz, r));
  const rim = makeRim({ plate: PLATE, inside, groundY: terrainY, noise, colours: { top: F.snowShadow, rock: F.rock, dark: F.rockDark }, tiers: [0, -4, -13], insets: [0, 1.6, 5] });
  const ice = makeWaterSheet({
    box: { x0: LAKE.x - 18, x1: LAKE.x + 18, z0: LAKE.z - 18, z1: LAKE.z + 18 }, y: ICE_Y, step: 1,
    inside: (x, z) => lakeD(x, z) < 1.03,
    edge: (x, z) => (1 - lakeD(x, z)) * 8,
    colours: { deep: F.iceDeep, shallow: F.ice, foam: F.snow },
    wave: 0, mirror: 0.5, ice: true,
  });
  // the mountain backdrop beyond the rim: three peaks in snow over indigo rock, fogged by distance
  const peakParts: THREE.BufferGeometry[] = [];
  for (const [x, z, h, rad] of [[-70, -125, 52, 44], [45, -135, 62, 50], [135, -70, 46, 40], [-140, 20, 40, 38]] as [number, number, number, number][]) {
    const g = colorize(new THREE.ConeGeometry(rad, h, 7), F.snowBlue);
    const p = g.getAttribute('position') as THREE.BufferAttribute, c = g.getAttribute('color') as THREE.BufferAttribute;
    const snow = new THREE.Color(F.snow), rock = new THREE.Color(F.indigo);
    for (let i = 0; i < p.count; i++) { const t = p.getY(i) / h + 0.5; const cc = rock.clone().lerp(snow, clamp(t * 1.6 - 0.3, 0, 1)); c.setXYZ(i, cc.r, cc.g, cc.b); }
    g.rotateY(r() * 6); g.translate(x, h / 2 - 12, z);
    peakParts.push(g);
  }
  const peaks = new THREE.Mesh(mergeGeos(peakParts), makeWorldMaterial({ roughness: 1 }));
  return { mesh, rim, ice, peaks };
}
