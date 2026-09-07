// Bog flora: bald cypress giants with flared trunks, knees and hanging moss (14–16 m: the grandeur
// read), medium cypresses, reeds, lily pads with a few flowers, the glow mushrooms by the hundred
// (instanced, emissive; they brighten within 6 m of Collette through the instance colour), three
// landmark violet mushrooms, fallen logs, ferns, swamp grass.
import * as THREE from 'three';
import { BOG as G } from '../_shared/biomes';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { BLOOM_LAYER } from '../_shared/post';
import { hash2, lerp, rng } from '../_shared/rng';
import type { Circle } from '../_shared/walk';
import { HUT, HYDRA, inside, landScore, onBoards, PLATE, POSTS, SNAIL, TEMPLE, terrainY, WATER_Y } from './terrain';

const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

function cypressGeo(h: number, r: () => number): { wood: THREE.BufferGeometry; moss: THREE.BufferGeometry } {
  const k = h / 14;
  const parts: THREE.BufferGeometry[] = [];
  parts.push(xf(CY(0.22 * k, 0.55 * k, h * 0.72, 7, G.cypress), 0, h * 0.36));
  parts.push(xf(CY(0.6 * k, 1.5 * k, 1.6 * k, 7, '#2E2218'), 0, 0.8 * k)); // the flared base
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + r(); const d = (1.4 + r() * 1.4) * k; parts.push(xf(colorize(new THREE.ConeGeometry(0.16 * k, (0.4 + r() * 0.5) * k, 5), '#2E2218'), Math.cos(a) * d, 0.2 * k, Math.sin(a) * d)); } // knees
  // a feathery canopy: three flattened icosahedra stacked, then thin branch bars
  const cols = [G.cypressLeaf, '#3A6A3A', G.cypressLeaf];
  for (let i = 0; i < 3; i++) {
    const g = colorize(new THREE.IcosahedronGeometry((2.6 - i * 0.5) * k, 1), cols[i]!);
    g.scale(1.5, 0.45, 1.5); g.translate((r() - 0.5) * 1.2 * k, h * (0.7 + i * 0.11), (r() - 0.5) * 1.2 * k);
    parts.push(g);
  }
  for (let i = 0; i < 5; i++) { const a = i * 1.25 + r() * 0.5; parts.push(xf(CY(0.05 * k, 0.09 * k, 3.2 * k, 4, G.cypress), Math.cos(a) * 1.4 * k, h * 0.7, Math.sin(a) * 1.4 * k, 0, Math.sin(a) * 1.25, -Math.cos(a) * 1.25)); }
  // hanging moss: thin strips from the canopy's edge, swaying
  const mossParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const a = r() * 6.28, d = (2.0 + r() * 1.6) * k, len = (1.4 + r() * 1.8) * k;
    const strip = colorize(new THREE.PlaneGeometry(0.18 * k, len, 1, 3), i % 2 ? G.hangMoss : '#5A7A4A');
    strip.translate(0, -len / 2, 0); strip.rotateY(a);
    strip.translate(Math.cos(a) * d, h * (0.68 + r() * 0.12), Math.sin(a) * d);
    mossParts.push(strip);
  }
  return { wood: mergeGeos(parts), moss: mergeGeos(mossParts) };
}

export interface Flora {
  group: THREE.Group; trunks: Circle[];
  /** Brighten the glow caps near a point (Collette's orb), eased. */
  glowNear: (x: number, z: number, dt: number) => void;
  caps: number;
}

export function makeFlora(): Flora {
  const group = new THREE.Group();
  const r = rng(31);
  const woodMat = makeWorldMaterial({ sway: 0.006 });
  const mossMat = makeWorldMaterial({ sway: 0.05, side: THREE.DoubleSide, roughness: 1 });
  const swayMat = makeWorldMaterial({ sway: 0.1, side: THREE.DoubleSide });
  const stillMat = makeWorldMaterial({ side: THREE.DoubleSide });
  const glowMat = makeWorldMaterial({ emissive: true, roughness: 0.6 });
  const trunks: Circle[] = [];
  const m = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  // cypress giants and the medium stand; giants where the frames want scale
  const giants: [number, number, number][] = [[-15, -7, 16], [37, 9, 15], [-42, 38, 14], [-5, -30, 15]];
  const mediums: [number, number, number][] = [];
  const isLand = (x: number, z: number) => landScore(x, z) > 0.15 && !onBoards(x, z);
  const clear = (x: number, z: number, minD: number) => {
    if (!inside(x, z) || !isLand(x, z)) return false;
    if (Math.hypot(x - HUT.x, z - HUT.z) < 13 || Math.hypot(x - TEMPLE.x, z - TEMPLE.z) < 7 || Math.hypot(x - SNAIL.x, z - SNAIL.z) < 3) return false;
    if (z > -5 && z < 5 && x > -38 && x < 38) return false;
    for (const p of POSTS) if (Math.hypot(p[0] - x, p[1] - z) < 2.5) return false;
    for (const t of trunks) if (Math.hypot(t.x - x, t.z - z) < minD) return false;
    return true;
  };
  for (const [x, z] of giants) trunks.push({ x, z, r: 1.4 });
  let tries = 0;
  while (mediums.length < 14 && tries++ < 4000) {
    const x = lerp(PLATE.x0 + 6, PLATE.x1 - 6, r()), z = lerp(PLATE.z0 + 6, PLATE.z1 - 6, r());
    if (!clear(x, z, 7)) continue;
    mediums.push([x, z, 7.5 + r() * 3]); trunks.push({ x, z, r: 0.7 });
  }
  const place = (list: [number, number, number][], unit: number) => {
    const geo = cypressGeo(unit, rng(unit));
    const wood = new THREE.InstancedMesh(geo.wood, woodMat, list.length), moss = new THREE.InstancedMesh(geo.moss, mossMat, list.length);
    list.forEach(([x, z, h], i) => {
      m.compose(new THREE.Vector3(x, terrainY(x, z) - 0.3, z), q.setFromAxisAngle(up, r() * 6.28), new THREE.Vector3(h / unit, h / unit, h / unit));
      wood.setMatrixAt(i, m); moss.setMatrixAt(i, m);
      const v = 0.9 + r() * 0.2; wood.setColorAt(i, col.setRGB(v, v, v)); moss.setColorAt(i, col.setRGB(v, v, v));
    });
    wood.castShadow = true; wood.receiveShadow = true; moss.castShadow = true;
    group.add(wood, moss);
  };
  place(giants, 14); place(mediums, 8);
  // the three landmark mushrooms (violet, 1.6–2.4 m) with a faint glow under the cap
  for (const [x, z, s] of [[-21, 31, 2.2], [19, 21, 1.7], [-18, -24, 1.9]] as [number, number, number][]) {
    const cap = colorize(new THREE.SphereGeometry(0.9, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.45), G.mushroomBig);
    const under = colorize(new THREE.CylinderGeometry(0.85, 0.5, 0.25, 8, 1, true), G.phosphor, { color: new THREE.Color(G.phosphor).multiplyScalar(0.6).getStyle(), glow: 1 });
    const big = mergeGeos([xf(CY(0.16, 0.24, 1.3, 7, G.mushroomStalk), 0, 0.65), xf(cap, 0, 1.3), xf(under, 0, 1.2)]);
    for (let i = 0; i < 6; i++) big.attributes['position']!.needsUpdate = true;
    const mesh = new THREE.Mesh(big, glowMat); mesh.position.set(x, terrainY(x, z), z); mesh.scale.setScalar(s); mesh.rotation.y = r() * 6; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.layers.enable(BLOOM_LAYER); group.add(mesh); trunks.push({ x, z, r: 0.5 * s });
    for (let i = 0; i < 5; i++) { const a = r() * 6.28; const sx = x + Math.cos(a) * 0.5 * s, sz = z + Math.sin(a) * 0.5 * s; const spot = new THREE.Mesh(colorize(new THREE.CircleGeometry(0.12 * s, 6), '#E8D8F0'), stillMat); spot.position.set(sx, terrainY(x, z) + 1.55 * s + 0.02, sz); spot.rotation.x = -Math.PI / 2 + 0.4; spot.lookAt(x, terrainY(x, z) + 2.4 * s, z); group.add(spot); }
  }
  // fallen logs with moss caps
  for (const [x, z, yaw, len] of [[-8, 8, 0.4, 4], [24, -6, 1.9, 5], [-30, -12, 0.9, 3.5], [40, 26, 2.6, 4]] as [number, number, number, number][]) {
    if (!isLand(x, z)) continue;
    const g = mergeGeos([CY(0.3, 0.34, len, 7, G.cypress).rotateZ(Math.PI / 2).translate(0, 0.3, 0), colorize(new THREE.BoxGeometry(len * 0.7, 0.06, 0.4, 1, 1, 1), G.hangMoss).translate(0, 0.6, 0.05)]);
    jitterColor(g, r, 0.05);
    const mesh = new THREE.Mesh(g, stillMat); mesh.position.set(x, terrainY(x, z), z); mesh.rotation.y = yaw; mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    trunks.push({ x, z, r: len / 2 });
  }
  // ---- ground scatter: glow caps, reeds, lily pads, ferns, swamp grass, pebbles ---------------
  const capGeo = mergeGeos([xf(CY(0.03, 0.04, 0.16, 5, G.mushroomStalk), 0, 0.08), xf(colorize(new THREE.ConeGeometry(0.11, 0.09, 6), G.mushroomCap, { color: new THREE.Color(G.phosphor).multiplyScalar(0.7).getStyle(), glow: 1 }), 0, 0.2)]);
  const reedGeo = mergeGeos([0, 0.9, 1.8, 2.7, 3.6].map((a) => mergeGeos([xf(colorize(new THREE.BoxGeometry(0.035, 1.9, 0.035), G.reed), Math.cos(a) * 0.12, 0.95, Math.sin(a) * 0.12, 0, 0, (a % 1.8) * 0.08), xf(colorize(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 4), '#5A3A28'), Math.cos(a) * 0.12 + (a % 1.8) * 0.12, 1.95, Math.sin(a) * 0.12)])));
  const padGeo = (() => { const g = colorize(new THREE.CircleGeometry(0.42, 8), G.lily); g.rotateX(-Math.PI / 2); return g; })();
  const flowerGeo = mergeGeos([xf(colorize(new THREE.CircleGeometry(0.42, 8), G.lily).rotateX(-Math.PI / 2), 0, 0, 0), ...[0, 1.26, 2.51, 3.77, 5.03].map((a) => xf(colorize(new THREE.ConeGeometry(0.07, 0.16, 4), G.lilyFlower), Math.cos(a) * 0.08, 0.1, Math.sin(a) * 0.08, 0, 0.6 * Math.sin(a), -0.6 * Math.cos(a))), xf(colorize(new THREE.IcosahedronGeometry(0.04, 0), '#F0C040'), 0, 0.12, 0)]);
  const fernGeo = mergeGeos([0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4].map((a) => { const g = colorize(new THREE.PlaneGeometry(0.16, 0.7, 1, 3), '#3E7A46'); g.translate(0, 0.35, 0); g.rotateX(-0.9); g.rotateY(a); return g; }));
  const grassGeo = mergeGeos([0, 1.05, 2.1].map((a) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.09, 0, 0, 0.09, 0, 0, 0.04, 0.45, 0], 3)); const c = new THREE.Color('#4A7A3A'), tip = new THREE.Color(G.reedTip); g.setAttribute('color', new THREE.Float32BufferAttribute([c.r, c.g, c.b, c.r, c.g, c.b, tip.r, tip.g, tip.b], 3)); return xf(g, 0, 0, 0, a); }));
  const pebbleGeo = colorize(new THREE.IcosahedronGeometry(0.09, 0), '#4A4A48'); pebbleGeo.scale(1.2, 0.6, 0.9);
  type It = { x: number; y: number; z: number; s: number; yaw: number };
  const items: Record<string, It[]> = { cap: [], reed: [], pad: [], flower: [], fern: [], grass: [], pebble: [] };
  const cell = 2;
  for (let gx = Math.floor(PLATE.x0 / cell); gx < PLATE.x1 / cell; gx++) for (let gz = Math.floor(PLATE.z0 / cell); gz < PLATE.z1 / cell; gz++) {
    const cx = gx * cell, cz = gz * cell;
    if (!inside(cx + 1, cz + 1)) continue;
    const ls = landScore(cx + 1, cz + 1);
    const bonus = hash2(gx, gz) < 18;
    let nearTrunk = false; for (const t of trunks) if (Math.hypot(t.x - cx, t.z - cz) < 5) { nearTrunk = true; break; }
    const shore = ls > -0.05 && ls < 0.35;
    const n = { cap: (shore ? 2.2 : ls > 0 ? 0.5 : 0) + (bonus && ls > 0 ? 5 : 0) + (nearTrunk && ls > 0 ? 2 : 0), reed: ls > -0.25 && ls < 0.12 ? 2.4 : 0, pad: ls > -0.5 && ls < -0.08 ? 1.4 : 0, flower: ls > -0.5 && ls < -0.08 ? 0.18 : 0, fern: ls > 0.2 ? (bonus ? 1.2 : 0.25) + (nearTrunk ? 0.8 : 0) : 0, grass: ls > 0.1 ? (bonus ? 3 : 0.6) : 0, pebble: ls > 0.05 ? 0.3 : 0 };
    for (const kind of Object.keys(n)) {
      const want = n[kind as keyof typeof n];
      const count = Math.floor(want) + (r() < want - Math.floor(want) ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const x = cx + r() * cell, z = cz + r() * cell;
        if (onBoards(x, z) || (z > -3.4 && z < 3.4 && x > -35 && x < 35)) continue;
        const ty = terrainY(x, z), water = kind === 'pad' || kind === 'flower';
        if (water ? ty > WATER_Y - 0.06 : ty < WATER_Y + 0.02) continue;
        if (Math.hypot(x - HYDRA.x, z - HYDRA.z) < 6.5) continue;
        let blocked = false; for (const t of trunks) if (Math.hypot(t.x - x, t.z - z) < t.r + 0.2) { blocked = true; break; }
        if (blocked) continue;
        items[kind]!.push({ x, y: water ? WATER_Y + 0.01 : ty, z, s: kind === 'cap' ? lerp(0.6, 1.5, r()) : lerp(0.8, 1.3, r()), yaw: r() * 6.28 });
      }
    }
  }
  const inst = (geo: THREE.BufferGeometry, list: It[], mat: THREE.MeshStandardMaterial, glow = false) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => { m.compose(new THREE.Vector3(it.x, it.y, it.z), q.setFromAxisAngle(up, it.yaw), new THREE.Vector3(it.s, it.s, it.s)); im.setMatrixAt(i, m); const v = glow ? 1 : 0.88 + r() * 0.24; im.setColorAt(i, col.setRGB(v, v, v)); });
    im.receiveShadow = true; im.castShadow = glow; if (glow) im.layers.enable(BLOOM_LAYER);
    group.add(im); return im;
  };
  const caps = inst(capGeo, items['cap']!, glowMat, true);
  inst(reedGeo, items['reed']!, swayMat); inst(padGeo, items['pad']!, stillMat); inst(flowerGeo, items['flower']!, stillMat);
  inst(fernGeo, items['fern']!, swayMat); inst(grassGeo, items['grass']!, swayMat); inst(pebbleGeo, items['pebble']!, stillMat);
  const capList = items['cap']!;
  const glowVals = new Float32Array(capList.length).fill(1);
  const glowNear = (x: number, z: number, dt: number) => {
    if (!caps) return;
    let changed = false;
    for (let i = 0; i < capList.length; i++) {
      const it = capList[i]!;
      const d = Math.hypot(it.x - x, it.z - z);
      const want = 1 + 1.6 * THREE.MathUtils.smoothstep(6 - d, 0, 4);
      const v = glowVals[i]! + (want - glowVals[i]!) * Math.min(1, dt * 3);
      if (Math.abs(v - glowVals[i]!) > 0.002) { glowVals[i] = v; caps.setColorAt(i, col.setRGB(v, v, v)); changed = true; }
    }
    if (changed && caps.instanceColor) caps.instanceColor.needsUpdate = true;
  };
  return { group, trunks, glowNear, caps: capList.length };
}
