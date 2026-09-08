// Frozen flora and ice: snow pines heavy with snow (five giants of 13–15 m, the grandeur read),
// the dead pine the owl sits on, ice crystal clusters that carry the aurora's wash, boulders with
// snow caps, a sparse scatter of dry grass and stones where the wind has scoured the snow.
import * as THREE from 'three';
import { FROZEN as F } from '../_shared/biomes';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { BLOOM_LAYER } from '../_shared/post';
import { hash2, lerp, rng } from '../_shared/rng';
import { displace } from '../_shared/rock';
import type { Circle } from '../_shared/walk';
import { HEARTH, ICEFALL, inside, lakeD, OBSERVATORY, PLATE, SHELF, STRIP, terrainY } from './terrain';

const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

function snowPineGeo(h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(xf(CY(0.16 * h / 9, 0.3 * h / 9, 0.3 * h, 6, F.bark), 0, 0.15 * h));
  const dark = new THREE.Color(F.pineDark), pine = new THREE.Color(F.pine);
  for (let i = 0; i < 4; i++) {
    const rad = h * (0.28 - 0.05 * i), ch = h * 0.36, y0 = h * (0.16 + 0.2 * i);
    const g = colorize(new THREE.ConeGeometry(rad, ch, 6), F.pine);
    g.translate(0, y0 + ch / 2, 0);
    const p = g.getAttribute('position') as THREE.BufferAttribute, c = g.getAttribute('color') as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) { const t = Math.pow(THREE.MathUtils.clamp(p.getY(k) / (h * 1.1), 0, 1), 1.3); const cc = dark.clone().lerp(pine, t * 0.85 + 0.05); c.setXYZ(k, cc.r, cc.g, cc.b); }
    parts.push(g);
    // the snow on each tier: a shallow cone sitting on the tier's top, slightly proud
    const snow = colorize(new THREE.ConeGeometry(rad * 0.78, ch * 0.34, 6), F.snow);
    snow.translate(0, y0 + ch * 0.86, 0);
    parts.push(snow);
  }
  return mergeGeos(parts);
}
function deadPineGeo(h: number): THREE.BufferGeometry {
  const parts = [xf(CY(0.12, 0.32, h, 6, '#5A5048'), 0, h / 2)];
  for (let i = 0; i < 5; i++) { const a = i * 1.3; parts.push(xf(CY(0.04, 0.08, 1.6 + i * 0.2, 4, '#5A5048'), Math.cos(a) * 0.6, h * (0.45 + i * 0.1), Math.sin(a) * 0.6, 0, Math.sin(a) * 1.2, -Math.cos(a) * 1.2)); }
  parts.push(xf(colorize(new THREE.BoxGeometry(0.9, 0.08, 0.5), F.snow), 0.6, h * 0.55 + 0.05, 0.2));
  return mergeGeos(parts);
}
function crystalGeo(r: () => number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const hgt = 0.8 + r() * 1.6, rad = 0.12 + r() * 0.12;
    const g = colorize(new THREE.CylinderGeometry(rad * 0.3, rad, hgt, 5), i % 2 ? F.ice : '#C8E8F8', { color: new THREE.Color(F.auroraGreen).lerp(new THREE.Color(F.ice), 0.5).multiplyScalar(0.35).getStyle(), glow: 1 });
    g.translate(0, hgt / 2, 0); g.rotateX((r() - 0.5) * 0.6); g.rotateZ((r() - 0.5) * 0.6); g.rotateY(r() * 6);
    g.translate((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7);
    parts.push(g);
  }
  return mergeGeos(parts);
}
function boulderGeo(s: number, r: () => number): THREE.BufferGeometry {
  const g = colorize(new THREE.IcosahedronGeometry(s, 1), F.rock);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  // T-43: one scale per unique position; by index the corners part and the boulder is see-through.
  displace(g, r, { x: [0.85, 1.15], y: [0.65, 0.85], z: [0.85, 1.15] });
  const n = g.getAttribute('normal') as THREE.BufferAttribute, c = g.getAttribute('color') as THREE.BufferAttribute;
  const snow = new THREE.Color(F.snow);
  for (let i = 0; i < p.count; i += 3) if (n.getY(i) > 0.45) for (let k = 0; k < 3; k++) c.setXYZ(i + k, snow.r, snow.g, snow.b);
  jitterColor(g, r, 0.05);
  return g;
}

export function makeFlora(): { group: THREE.Group; trunks: Circle[]; owlPerch: THREE.Vector3 } {
  const group = new THREE.Group();
  const r = rng(31);
  const treeMat = makeWorldMaterial({ sway: 0.006, aurora: true });
  const stillMat = makeWorldMaterial({ aurora: true });
  const glowMat = makeWorldMaterial({ emissive: true, roughness: 0.3, aurora: true });
  const trunks: Circle[] = [];
  const m = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const ok = (x: number, z: number, minD: number) => {
    if (!inside(x, z) || lakeD(x, z) < 1.25 || terrainY(x, z) > 6) return false;
    if (Math.hypot(x, z) < HEARTH.r + 1.5) return false;
    if (z > STRIP.z0 - 3 && z < STRIP.z1 + 3 && x > STRIP.x0 - 3 && x < STRIP.x1 + 3) return false;
    if (Math.hypot(x - SHELF.x, z - SHELF.z) < SHELF.r + 2 || Math.hypot(x - OBSERVATORY.x, z - OBSERVATORY.z) < 14) return false;
    if (Math.abs(x - ICEFALL.x) < ICEFALL.w / 2 + 4 && z < -28) return false;
    if (Math.hypot(x + 36, z - 2) < 7) return false; // the penguins' drift
    for (const t of trunks) if (Math.hypot(t.x - x, t.z - z) < minD) return false;
    return true;
  };
  // giants first (authored: they frame the Hearth and the lake), then a seeded stand
  const giants: [number, number, number][] = [[-12, -9, 15], [9, -12, 14], [-38, 24, 13], [16, 6, 13.5], [-8, 30, 14]];
  for (const [x, z] of giants) trunks.push({ x, z, r: 0.6 });
  const stand: [number, number, number][] = [];
  let tries = 0;
  while (stand.length < 26 && tries++ < 5000) {
    const x = lerp(PLATE.x0 + 6, PLATE.x1 - 6, r()), z = lerp(PLATE.z0 + 8, PLATE.z1 - 6, r());
    if (!ok(x, z, 4.5)) continue;
    stand.push([x, z, 6 + r() * 5]); trunks.push({ x, z, r: 0.4 });
  }
  const unit = snowPineGeo(9);
  const all = [...giants, ...stand];
  const pines = new THREE.InstancedMesh(unit, treeMat, all.length);
  all.forEach(([x, z, h], i) => {
    m.compose(new THREE.Vector3(x, terrainY(x, z) - 0.1, z), q.setFromAxisAngle(up, r() * 6.28), new THREE.Vector3(h / 9, h / 9, h / 9));
    pines.setMatrixAt(i, m);
    const v = 0.9 + r() * 0.18; pines.setColorAt(i, col.setRGB(v * (0.97 + r() * 0.06), v, v));
  });
  pines.castShadow = true; pines.receiveShadow = true; group.add(pines);
  // the dead pine for the owl, by the lake's north shore
  const dead = new THREE.Mesh(deadPineGeo(7), stillMat);
  dead.position.set(-30, terrainY(-30, -4), -4); dead.castShadow = true; group.add(dead); trunks.push({ x: -30, z: -4, r: 0.4 });
  const owlPerch = new THREE.Vector3(-30 + 0.6, dead.position.y + 7 * 0.55 + 0.12, -4 + 0.2);
  // ice crystal clusters (they glow faintly and take the aurora's wash)
  for (const [x, z] of [[-6, 12], [22, -8], [-40, -14], [12, 30], [36, 2], [-20, -20]] as [number, number][]) {
    if (!inside(x, z)) continue;
    const cm = new THREE.Mesh(crystalGeo(r), glowMat); cm.position.set(x, terrainY(x, z), z); cm.layers.enable(BLOOM_LAYER); cm.castShadow = true; group.add(cm);
    trunks.push({ x, z, r: 0.7 });
  }
  // boulders with snow caps
  for (let i = 0; i < 12; i++) {
    const x = lerp(PLATE.x0 + 8, PLATE.x1 - 8, r()), z = lerp(PLATE.z0 + 10, PLATE.z1 - 8, r());
    if (!ok(x, z, 2.5)) continue;
    const s = 0.5 + r() * 0.9;
    const bm = new THREE.Mesh(boulderGeo(s, r), stillMat); bm.position.set(x, terrainY(x, z) + s * 0.3, z); bm.rotation.y = r() * 6; bm.castShadow = true; bm.receiveShadow = true; group.add(bm);
    trunks.push({ x, z, r: s });
  }
  // scoured patches: dry grass and stones in the wind's lee of the trees
  const grass = mergeGeos([0, 1.05, 2.1].map((a) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.08, 0, 0, 0.08, 0, 0, 0.03, 0.34, 0], 3)); const c = new THREE.Color('#A89A70'), tip = new THREE.Color('#D8C890'); g.setAttribute('color', new THREE.Float32BufferAttribute([c.r, c.g, c.b, c.r, c.g, c.b, tip.r, tip.g, tip.b], 3)); return xf(g, 0, 0, 0, a); }));
  const stone = colorize(new THREE.IcosahedronGeometry(0.09, 0), F.rock); stone.scale(1.2, 0.6, 0.9);
  const items = { grass: [] as [number, number, number][], stone: [] as [number, number, number][] };
  const cell = 2;
  for (let gx = Math.floor(PLATE.x0 / cell); gx < PLATE.x1 / cell; gx++) for (let gz = Math.floor(PLATE.z0 / cell); gz < PLATE.z1 / cell; gz++) {
    const cx = gx * cell, cz = gz * cell;
    if (!inside(cx + 1, cz + 1) || lakeD(cx, cz) < 1.1 || terrainY(cx, cz) > 5) continue;
    const bonus = hash2(gx, gz) < 10;
    let nearTrunk = false; for (const t of trunks) if (Math.hypot(t.x - cx, t.z - cz) < 3.5) { nearTrunk = true; break; }
    const n = { grass: (bonus ? 3 : 0) + (nearTrunk ? 1.2 : 0.05), stone: (bonus ? 0.8 : 0.12) };
    for (const kind of ['grass', 'stone'] as const) {
      const count = Math.floor(n[kind]) + (r() < n[kind] - Math.floor(n[kind]) ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const x = cx + r() * cell, z = cz + r() * cell;
        if (Math.hypot(x, z) < HEARTH.r - 2 || (z > STRIP.z0 && z < STRIP.z1 && x > STRIP.x0 && x < STRIP.x1)) continue;
        items[kind].push([x, terrainY(x, z), z]);
      }
    }
  }
  const inst = (geo: THREE.BufferGeometry, list: [number, number, number][], mat: THREE.MeshStandardMaterial, sMin: number, sMax: number) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z], i) => { const s = lerp(sMin, sMax, r()); m.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, r() * 6.28), new THREE.Vector3(s, s, s)); im.setMatrixAt(i, m); const v = 0.9 + r() * 0.2; im.setColorAt(i, col.setRGB(v, v, v)); });
    im.receiveShadow = true; group.add(im);
  };
  inst(grass, items.grass, makeWorldMaterial({ sway: 0.12, side: THREE.DoubleSide, aurora: true }), 0.7, 1.3);
  inst(stone, items.stone, stillMat, 0.6, 1.6);
  return { group, trunks, owlPerch };
}
