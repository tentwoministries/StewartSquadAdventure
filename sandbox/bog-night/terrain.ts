// Murky Swamp, the Long Causeway quadrant (story-beats.md §2.2 Swamp): teal-black water nearly
// everywhere, hummocks of moss and mud, the causeway boardwalk over the water with Fern's jetty,
// the Witch's island, the lantern path's chain of hummocks north to the drowned temple steps, the
// Hydra's ring, the snail's island. Land is a score; the water sheet covers everything below it.
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { BOG as G } from '../_shared/biomes';
import { makePlate, makeRim } from '../_shared/rim';
import { clamp, lerp, rng, smoothstep } from '../_shared/rng';
import { makeWaterSheet, type WaterSheet } from '../_shared/water';

export const PLATE = { x0: -56, x1: 60, z0: -52, z1: 52 };
export const noise = createNoise2D(rng(53));
export const WATER_Y = -0.28;
export const BOARD_Y = 0.38;
export const HUT = { x: -28, z: 26 };
export const TEMPLE = { x: -10, z: -37 };
export const SNAIL = { x: 10, z: 12 };
export const HYDRA = { x: 31, z: -17 };
export const RUDDER = { x: 22, z: 28 };
export const EAST = { x: 37, z: 6 };
export const CAUSEWAY = { x0: -34, x1: 34, z0: -2.7, z1: 2.7 };
export const JETTY = { x: -32, z0: 2.7, z1: 13.5, w: 2.4 };
/** The Witch's Lanterns path from the hut's island north to the temple; the seven posts sit on it. */
export const PATH: [number, number][] = [[-26, 19], [-22, 12], [-18.5, 5], [-17.5, -3], [-16, -11], [-14.5, -19], [-12.5, -27], [-10.5, -34]];
export const POSTS: [number, number][] = [[-24.5, 15.5], [-20.5, 9], [-19.2, -1.5], [-16.8, -8], [-15.2, -15.5], [-13.6, -23], [-11.6, -30.5]];

const ISLANDS: [number, number, number][] = [[HUT.x, HUT.z, 10], [TEMPLE.x, TEMPLE.z, 9], [SNAIL.x, SNAIL.z, 7.5], [EAST.x, EAST.z, 9], [-44, -18, 8], [4, -22, 6], [-6, 30, 6], [46, 30, 7], [-42, 40, 7]];

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
export function inside(x: number, z: number): boolean {
  const ex = 3 * noise(z / 14, 100), ez = 3 * noise(x / 14, 200);
  return x > PLATE.x0 + 4 + ex && x < PLATE.x1 - 4 - ex && z > PLATE.z0 + 4 + ez && z < PLATE.z1 - 4 - ez;
}
/** Land score: > 0 is land (1 is solid ground), ≤ 0 is water. */
export function landScore(x: number, z: number): number {
  let s = (noise(x / 16, z / 16) + 0.5 * noise(x / 7, z / 7) - 0.45) * 1.6;
  for (const [ix, iz, ir] of ISLANDS) s = Math.max(s, (ir - Math.hypot(x - ix, z - iz)) / ir * 1.4);
  s = Math.max(s, (4.5 - pathDist(x, z)) / 4.5);
  const edge = Math.min(x - PLATE.x0, PLATE.x1 - x, z - PLATE.z0, PLATE.z1 - z);
  s = Math.max(s, (9 - edge) / 9);
  // the Hydra's pool: a ring of land with still water inside
  const dh = Math.hypot(x - HYDRA.x, z - HYDRA.z);
  s = Math.max(s, 1 - Math.abs(dh - 9.5) / 3.8);
  if (dh < 6) s = Math.min(s, -0.3);
  return s;
}
export function onBoards(x: number, z: number): boolean {
  if (x > CAUSEWAY.x0 && x < CAUSEWAY.x1 && z > CAUSEWAY.z0 && z < CAUSEWAY.z1) return true;
  return Math.abs(x - JETTY.x) < JETTY.w / 2 && z > JETTY.z0 - 0.3 && z < JETTY.z1;
}
export function terrainY(x: number, z: number): number {
  const s = landScore(x, z);
  const land = 0.15 + 0.3 * clamp(s, 0, 1) + 0.12 * noise(x / 5, z / 5);
  // the temple's mound and the hut's island are a little higher; the causeway's line is mud flats
  const dt = Math.hypot(x - TEMPLE.x, z - TEMPLE.z), dh = Math.hypot(x - HUT.x, z - HUT.z);
  const lift = 0.5 * smoothstep(9, 3, dt) + 0.3 * smoothstep(10, 4, dh);
  return lerp(WATER_Y - 1.0, land + lift, smoothstep(-0.25, 0.25, s));
}
export function groundY(x: number, z: number): number {
  return onBoards(x, z) ? BOARD_Y : terrainY(x, z);
}
export function distToWater(x: number, z: number): number {
  return landScore(x, z) * 5;
}

function faceColor(cx: number, cz: number, hy: number, ny: number, r: () => number): THREE.Color {
  const out = new THREE.Color(G.mossGround);
  const m = noise(cx / 6, cz / 6);
  if (m > 0.1) out.lerp(new THREE.Color(G.mossDark), clamp((m - 0.1) * 1.5, 0, 0.7));
  if (m < -0.3) out.lerp(new THREE.Color('#4A6A3A'), 0.4);
  // mud at the water's edge, the bed under it
  if (hy < WATER_Y - 0.05) out.set('#0E1E1C').multiplyScalar(0.8 + 0.2 * clamp(1 + hy, 0, 1));
  else if (hy < 0.12) out.lerp(new THREE.Color(G.mud), 1 - smoothstep(WATER_Y - 0.05, 0.12, hy));
  // the lantern path is trodden; the temple mound is stone
  const pd = pathDist(cx, cz);
  if (pd < 1.4) out.lerp(new THREE.Color('#4A3A2A'), 0.45 * (1 - smoothstep(0.6, 1.4, pd)));
  const dt = Math.hypot(cx - TEMPLE.x, cz - TEMPLE.z);
  if (dt < 7) out.lerp(new THREE.Color('#4A5A56'), 0.5 * smoothstep(7, 3, dt));
  if (ny < 0.7) out.lerp(new THREE.Color(G.rot), 0.3);
  out.multiplyScalar(1 + (r() * 2 - 1) * 0.04);
  return out;
}

export function makeTerrain(): { mesh: THREE.Mesh; rim: THREE.Mesh; water: WaterSheet } {
  const r = rng(101);
  const mesh = makePlate(PLATE, inside, terrainY, (cx, cz, hy, ny) => faceColor(cx, cz, hy, ny, r));
  const rim = makeRim({ plate: PLATE, inside, groundY: terrainY, noise, colours: { top: G.mud, rock: '#3A3428', dark: '#221E16', root: G.rot }, tiers: [0, -3, -9], insets: [0, 1.4, 4] });
  const water = makeWaterSheet({
    box: PLATE, y: WATER_Y, step: 1.5,
    inside: (x, z) => inside(x, z) && terrainY(x, z) < WATER_Y + 0.08,
    edge: (x, z) => clamp((WATER_Y - terrainY(x, z)) * 5, 0, 6),
    colours: { deep: G.water, shallow: G.waterLit, foam: '#6E9A80' },
    wave: 0.008, mirror: 0.42,
    ripples: [[-29, 8], [-24, 5], [-8, 6], [6, 5], [-30, 16], [2, -6], [14, 8], [-36, -6]],
  });
  return { mesh, rim, water };
}
