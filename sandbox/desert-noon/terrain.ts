// Scorching Sands, the Oasis quadrant (story-beats.md §2.2 Desert): ridged dunes with the wind
// from the west, the oasis basin with its turquoise pool, Sol's shade, the hard-pan strip, the
// Nomad's camp, the Sunken Pyramid's mound at the south-east edge, the great arch's flat, and the
// island's cliff rim. Colours from world-events-weather.md §2.1.4 (sienna, ochre, bone, oasis).
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { DESERT as D } from '../_shared/biomes';
import { makePlate, makeRim } from '../_shared/rim';
import { clamp, lerp, rng, smoothstep } from '../_shared/rng';
import { makeWaterSheet, type WaterSheet } from '../_shared/water';

export const PLATE = { x0: -56, x1: 60, z0: -52, z1: 52 };
export const noise = createNoise2D(rng(41));
export const OASIS = { x: 0, z: 6, rx: 8.5, rz: 6.2 };
export const STRIP = { z0: 20, z1: 28, x0: -42, x1: 42 };
export const SHADE = { x: -7, z: -6, r: 6.5 };
export const NOMAD = { x: 27, z: -15, r: 6 };
export const PYRAMID = { x: 47, z: 31 };
export const ARCH = { x: -31, z: -23 };
export const WATER_Y = -0.42;

/** Normalised elliptical distance to the oasis centre: 1 at the (wobbly) shore. */
export function oasisD(x: number, z: number): number {
  const d = Math.hypot((x - OASIS.x) / OASIS.rx, (z - OASIS.z) / OASIS.rz);
  return d / (1 + 0.1 * noise(x / 3.5, z / 3.5));
}
export function inside(x: number, z: number): boolean {
  const ex = 3 * noise(z / 14, 100), ez = 3 * noise(x / 14, 200);
  return x > PLATE.x0 + 4 + ex && x < PLATE.x1 - 4 - ex && z > PLATE.z0 + 4 + ez && z < PLATE.z1 - 4 - ez;
}

export function groundY(x: number, z: number): number {
  // ridged dunes: sharp crests running roughly north–south, the wind from the west
  const ridge = 1 - Math.abs(noise(x / 15 + 3, z / 42));
  const broad = noise(x / 28, z / 36);
  let h = 1.5 * ridge * ridge * (0.55 + 0.45 * broad) + 0.3 * noise(x / 9, z / 9) + 0.05;
  // ripples on the lee faces
  h += 0.05 * Math.sin(x * 1.6 + 1.5 * noise(x / 6, z / 6) + z * 0.3);
  // the hard-pan strip
  const strip = smoothstep(2.5, 0, Math.max(STRIP.z0 - z, z - STRIP.z1, STRIP.x0 - x, x - STRIP.x1));
  h = lerp(h, 0.1, strip);
  // Sol's shade and the Nomad's camp are trodden flat
  const ds = Math.hypot(x - SHADE.x, z - SHADE.z);
  h = lerp(h, 0.15, smoothstep(SHADE.r + 3, SHADE.r - 1, ds));
  const dn = Math.hypot(x - NOMAD.x, z - NOMAD.z);
  h = lerp(h, 0.35, smoothstep(NOMAD.r + 3, NOMAD.r - 1, dn));
  // the arch stands on a low flat
  const da = Math.hypot(x - ARCH.x, z - ARCH.z);
  h = lerp(h, 0.6, smoothstep(10, 6, da));
  // the pyramid's dune
  const dp = Math.hypot((x - PYRAMID.x) / 14, (z - PYRAMID.z) / 11);
  h += 3.4 * Math.exp(-dp * dp * 1.6);
  // the oasis basin
  const od = oasisD(x, z);
  if (od < 1.4) {
    const basin = -1.05 * (1 - clamp(od, 0, 1) ** 2);
    h = lerp(h, Math.min(h, 0.05) + basin, smoothstep(1.4, 1.0, od));
  }
  return h;
}
export function distToWater(x: number, z: number): number {
  return (oasisD(x, z) - 1) * 6;
}

function faceColor(cx: number, cz: number, hy: number, ny: number, nx: number, r: () => number): THREE.Color {
  const out = new THREE.Color(D.ochre);
  // crests and sunward faces lighter, lee faces (facing east, away from the wind) in shadow ochre
  if (nx < -0.12) out.lerp(new THREE.Color(D.sandShadow), clamp(-nx * 2.2, 0, 0.7));
  if (nx > 0.12) out.lerp(new THREE.Color(D.ochreLight), clamp(nx * 1.6, 0, 0.5));
  out.lerp(new THREE.Color(D.ochreLight), clamp((hy - 0.9) * 0.35, 0, 0.35));
  // the hard pan: dull, flat, two tyre lines
  const strip = smoothstep(2.5, 0, Math.max(STRIP.z0 - cz, cz - STRIP.z1, STRIP.x0 - cx, cx - STRIP.x1));
  if (strip > 0) {
    out.lerp(new THREE.Color('#C6A05A'), 0.8 * strip);
    const rut = Math.min(Math.abs(cz - 23.3), Math.abs(cz + -24.7));
    if (rut < 0.3 && cx > -30 && cx < 20) out.lerp(new THREE.Color(D.sandShadow), 0.35);
  }
  // trodden ground at the shade and the camp
  const ds = Math.hypot(cx - SHADE.x, cz - SHADE.z), dn = Math.hypot(cx - NOMAD.x, cz - NOMAD.z);
  out.lerp(new THREE.Color('#C89A48'), 0.5 * smoothstep(SHADE.r + 1, SHADE.r - 2, ds) + 0.5 * smoothstep(NOMAD.r + 1, NOMAD.r - 2, dn));
  // the oasis: wet sand on the shore, reeds' ground, the bed
  const od = oasisD(cx, cz);
  if (od < 1.05 && hy < WATER_Y + 0.05) out.set(D.oasisDeep).multiplyScalar(0.7 + 0.3 * clamp(1 + hy, 0, 1));
  else if (od < 1.3) out.lerp(new THREE.Color('#A8813A'), 0.6 * (1 - smoothstep(1.0, 1.3, od)));
  // the pyramid's dune is the same sand; the arch's flat is stonier
  const da = Math.hypot(cx - ARCH.x, cz - ARCH.z);
  if (da < 9) out.lerp(new THREE.Color(D.rockRed), 0.25 * smoothstep(9, 4, da));
  if (ny < 0.6) out.lerp(new THREE.Color(D.sienna), 0.3);
  out.multiplyScalar(1 + (r() * 2 - 1) * 0.04);
  return out;
}

export function makeTerrain(): { mesh: THREE.Mesh; rim: THREE.Mesh; water: WaterSheet } {
  const r = rng(101);
  const mesh = makePlate(PLATE, inside, groundY, (cx, cz, hy, ny, nx) => faceColor(cx, cz, hy, ny, nx, r));
  const rim = makeRim({ plate: PLATE, inside, groundY, noise, colours: { top: D.sienna, rock: D.rockRed, dark: D.rockDark }, tiers: [0, -4, -12], insets: [0, 1.8, 5] });
  const water = makeWaterSheet({
    box: { x0: OASIS.x - 12, x1: OASIS.x + 12, z0: OASIS.z - 9, z1: OASIS.z + 9 }, y: WATER_Y, step: 0.75,
    inside: (x, z) => oasisD(x, z) < 1.02,
    edge: (x, z) => (1 - oasisD(x, z)) * 6,
    colours: { deep: D.oasisDeep, shallow: D.oasis, foam: '#E8F6F0' },
    wave: 0.015, mirror: 0.45, ripples: [[-3.6, 0.6], [2.5, 9.5]],
  });
  return { mesh, rim, water };
}
