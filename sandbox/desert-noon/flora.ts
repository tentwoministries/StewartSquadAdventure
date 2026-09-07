// Desert flora and rock: date palms (tall ones leaning over the oasis, the grandeur read the
// Forest's pines gave), saguaro and barrel cacti, agave, dry grass, the great arch and three
// hoodoos, the seeded ground scatter (sparse: the desert is empty on purpose, and the emptiness
// is what makes the oasis read).
import * as THREE from 'three';
import { DESERT as D } from '../_shared/biomes';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { hash2, lerp, rng } from '../_shared/rng';
import type { Circle } from '../_shared/walk';
import { ARCH, distToWater, groundY, inside, NOMAD, oasisD, PLATE, PYRAMID, SHADE, STRIP } from './terrain';

const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

function palmGeo(h: number, lean: number, r: () => number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // a trunk of 7 stacked, slightly curved segments with ring ridges
  const n = 7;
  let x = 0, y = 0;
  const seg = h / n;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const g = CY(0.14 - 0.05 * t, 0.17 - 0.05 * t, seg + 0.05, 6, D.palmTrunk);
    const ang = lean * (0.3 + t * 0.9);
    g.rotateZ(-ang); g.translate(x, y + seg / 2, 0);
    parts.push(g);
    const ring = CY(0.19 - 0.05 * t, 0.16 - 0.05 * t, 0.08, 6, '#6A4C30'); ring.rotateZ(-ang); ring.translate(x, y + seg * 0.7, 0); parts.push(ring);
    x += Math.sin(ang) * seg; y += Math.cos(ang) * seg;
  }
  // the crown: 9 fronds fanned, drooping; a date cluster
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.3;
    const droop = 0.45 + r() * 0.35;
    const len = 2.6 + r() * 0.8;
    const frond = colorize(new THREE.PlaneGeometry(0.5, len, 1, 4), i % 3 === 0 ? D.palmFrondDark : D.palmFrond);
    const p = frond.getAttribute('position') as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) { const v = p.getY(k) / len + 0.5; p.setX(k, p.getX(k) * (1 - v * 0.7)); p.setZ(k, -v * v * droop * len * 0.55); }
    frond.translate(0, len / 2, 0); frond.rotateX(-0.9 + droop * 0.3); frond.rotateY(a);
    frond.translate(x, y - 0.1, 0);
    parts.push(frond);
  }
  for (let i = 0; i < 12; i++) parts.push(xf(colorize(new THREE.IcosahedronGeometry(0.06, 0), D.dateFruit), x + 0.25 + (r() - 0.5) * 0.25, y - 0.45 - r() * 0.35, (r() - 0.5) * 0.25));
  return mergeGeos(parts);
}
function saguaroGeo(h: number): THREE.BufferGeometry {
  const parts = [xf(CY(0.22, 0.28, h, 8, D.cactus), 0, h / 2), xf(colorize(new THREE.SphereGeometry(0.22, 8, 4), D.cactus), 0, h)];
  for (const [s, y] of [[-1, h * 0.45], [1, h * 0.6]]) {
    parts.push(xf(CY(0.15, 0.17, 0.9, 7, D.cactusDark), s! * 0.55, y, 0, 0, 0, Math.PI / 2));
    parts.push(xf(CY(0.14, 0.16, h * 0.35, 7, D.cactus), s! * 0.95, y! + h * 0.17, 0));
    parts.push(xf(colorize(new THREE.SphereGeometry(0.15, 7, 4), D.cactus), s! * 0.95, y! + h * 0.35, 0));
  }
  for (let i = 0; i < 8; i++) parts.push(xf(colorize(new THREE.BoxGeometry(0.03, h, 0.03), D.cactusDark), Math.cos(i * 0.785) * 0.25, h / 2, Math.sin(i * 0.785) * 0.25));
  return mergeGeos(parts);
}
function barrelGeo(): THREE.BufferGeometry {
  const g = colorize(new THREE.IcosahedronGeometry(0.42, 1), D.cactus); g.scale(1, 0.75, 1); g.translate(0, 0.3, 0);
  const flower = colorize(new THREE.IcosahedronGeometry(0.1, 0), '#F0C040'); flower.translate(0.05, 0.62, 0.05);
  const ribs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 10; i++) ribs.push(xf(colorize(new THREE.BoxGeometry(0.03, 0.55, 0.03), D.cactusDark), Math.cos(i * 0.628) * 0.4, 0.3, Math.sin(i * 0.628) * 0.4, -i * 0.628));
  return mergeGeos([g, flower, ...ribs]);
}
function agaveGeo(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const g = colorize(new THREE.ConeGeometry(0.12, 0.9, 4), D.agave); g.scale(1, 1, 0.35); g.translate(0, 0.45, 0); g.rotateX(0.55 + (i % 3) * 0.2); g.rotateY(i * 0.698);
    parts.push(g);
  }
  return mergeGeos(parts);
}
function hoodooGeo(h: number, r: () => number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const layers = 6;
  let y = 0;
  const cols = [D.rockRed, D.sienna, D.rockDark, D.ochreLight];
  for (let i = 0; i < layers; i++) {
    const lh = (h / layers) * (0.7 + r() * 0.6);
    const rad = (0.9 + r() * 0.5) * (1.1 - i * 0.08) * (h / 8);
    const g = CY(rad * (0.85 + r() * 0.3), rad, lh, 5 + Math.floor(r() * 3), cols[i % 4]!);
    g.rotateY(r() * 6.28); g.translate((r() - 0.5) * 0.3, y + lh / 2, (r() - 0.5) * 0.3);
    parts.push(g); y += lh;
  }
  const cap = CY(0.4 * h / 8, 1.3 * h / 8, 0.8, 6, D.rockDark); cap.translate(0, y + 0.3, 0); parts.push(cap);
  return mergeGeos(parts);
}
export function archGeo(): THREE.BufferGeometry {
  // two pillars and a low-poly span: a half torus standing on edge, 16 m tall, 14 m across
  const parts: THREE.BufferGeometry[] = [];
  const span = colorize(new THREE.TorusGeometry(6.5, 1.7, 5, 11, Math.PI), D.rockRed);
  span.translate(0, 8.0, 0);
  const p = span.getAttribute('position') as THREE.BufferAttribute;
  for (let k = 0; k < p.count; k++) p.setZ(k, p.getZ(k) * 1.5);
  parts.push(span);
  for (const s of [-1, 1]) parts.push(xf(CY(1.6, 2.4, 8.5, 6, D.sienna), s * 6.5, 4.2, 0, s * 0.3));
  for (const s of [-1, 1]) parts.push(xf(CY(2.8, 3.4, 1.4, 7, D.rockDark), s * 6.6, 0.5, 0));
  const g = mergeGeos(parts);
  jitterColor(g, rng(8), 0.07);
  return g;
}

export function makeFlora(): { group: THREE.Group; trunks: Circle[] } {
  const group = new THREE.Group();
  const r = rng(31);
  const swayMat = makeWorldMaterial({ sway: 0.02, side: THREE.DoubleSide });
  const stillMat = makeWorldMaterial();
  const trunks: Circle[] = [];
  const m = new THREE.Matrix4(), col = new THREE.Color();
  // palms: three tall ones leaning over the pool, five medium around it, two at the shade
  const palms: [number, number, number, number, number][] = [ // x, z, h, lean, yaw
    [-6.5, 10.5, 12.5, 0.28, 0.9], [7.8, 1.2, 11.5, 0.25, 3.9], [3.5, 12.6, 13.0, 0.22, 2.4],
    [-8.5, 3.5, 7.5, 0.12, 0.5], [9.5, 8.5, 8.0, 0.15, 3.6], [-3.5, 13.5, 7.0, 0.1, 1.8], [8.2, 11.5, 6.5, 0.14, 2.9], [-9.5, 8.0, 6.0, 0.16, 0.2],
    [-11.5, -4.0, 9.0, 0.1, 5.5], [-3.2, -10.5, 8.5, 0.12, 4.2],
  ];
  const tall = palmGeo(12, 0.25, rng(3)), medium = palmGeo(7.5, 0.13, rng(4));
  const tallMesh = new THREE.InstancedMesh(tall, swayMat, 3), medMesh = new THREE.InstancedMesh(medium, swayMat, palms.length - 3);
  palms.forEach(([x, z, h, lean, yaw], i) => {
    const isTall = i < 3;
    const unit = isTall ? 12 : 7.5;
    m.compose(new THREE.Vector3(x, groundY(x, z) - 0.15, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(h / unit, h / unit, h / unit));
    (isTall ? tallMesh : medMesh).setMatrixAt(isTall ? i : i - 3, m);
    const v = 0.92 + r() * 0.16; col.setRGB(v, v, v * 0.97);
    (isTall ? tallMesh : medMesh).setColorAt(isTall ? i : i - 3, col);
    trunks.push({ x, z, r: 0.35 });
    void lean;
  });
  for (const mm of [tallMesh, medMesh]) { mm.castShadow = true; mm.receiveShadow = true; group.add(mm); }
  // the great arch and the hoodoos
  const arch = new THREE.Mesh(archGeo(), stillMat);
  arch.position.set(ARCH.x, groundY(ARCH.x, ARCH.z) - 0.3, ARCH.z); arch.rotation.y = 0.6; arch.castShadow = true; arch.receiveShadow = true;
  group.add(arch);
  for (const s of [-1, 1]) trunks.push({ x: ARCH.x + Math.cos(0.6) * s * 7, z: ARCH.z - Math.sin(0.6) * s * 7, r: 3.6 });
  for (const [x, z, h] of [[-44, -32, 11], [13, -42, 9], [40, -38, 12], [-48, 20, 7]]) {
    const hd = new THREE.Mesh(hoodooGeo(h!, r), stillMat);
    hd.position.set(x!, groundY(x!, z!) - 0.4, z); hd.castShadow = true; hd.receiveShadow = true; group.add(hd);
    trunks.push({ x: x!, z: z!, r: 1.4 * h! / 8 });
  }
  // cacti and agave, seeded, away from the flats and the water
  const ok = (x: number, z: number, minD: number) => {
    if (!inside(x, z) || oasisD(x, z) < 1.25) return false;
    if (Math.hypot(x - SHADE.x, z - SHADE.z) < SHADE.r + 1 || Math.hypot(x - NOMAD.x, z - NOMAD.z) < NOMAD.r + 1) return false;
    if (z > STRIP.z0 - 2 && z < STRIP.z1 + 2 && x > STRIP.x0 - 2 && x < STRIP.x1 + 2) return false;
    if (Math.hypot(x - PYRAMID.x, z - PYRAMID.z) < 13 || Math.hypot(x - ARCH.x, z - ARCH.z) < 9) return false;
    for (const t of trunks) if (Math.hypot(t.x - x, t.z - z) < minD + t.r) return false;
    return true;
  };
  const place = (geo: THREE.BufferGeometry, n: number, minD: number, rad: number, sMin: number, sMax: number, mat = stillMat) => {
    const pts: [number, number, number, number][] = [];
    let tries = 0;
    while (pts.length < n && tries++ < 3000) {
      const x = lerp(PLATE.x0 + 6, PLATE.x1 - 6, r()), z = lerp(PLATE.z0 + 6, PLATE.z1 - 6, r());
      if (!ok(x, z, minD)) continue;
      pts.push([x, z, lerp(sMin, sMax, r()), r() * 6.28]); trunks.push({ x, z, r: rad });
    }
    const im = new THREE.InstancedMesh(geo, mat, pts.length);
    pts.forEach(([x, z, s, yaw], i) => { m.compose(new THREE.Vector3(x, groundY(x, z) - 0.05, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(s, s, s)); im.setMatrixAt(i, m); const v = 0.9 + r() * 0.2; im.setColorAt(i, col.setRGB(v, v, v)); });
    im.castShadow = true; im.receiveShadow = true; group.add(im);
  };
  place(saguaroGeo(3.6), 5, 6, 0.4, 0.8, 1.3);
  place(barrelGeo(), 9, 4, 0.5, 0.7, 1.2);
  place(agaveGeo(), 7, 4, 0.6, 0.8, 1.3, swayMat);
  // ground scatter: dry grass tufts (sparse, clustered), pebbles, a few reeds at the shore
  const grass = mergeGeos([0, 1.05, 2.1].map((a) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.1, 0, 0, 0.1, 0, 0, 0.05, 0.42, 0], 3)); const c = new THREE.Color('#C8A860'), tip = new THREE.Color('#E0C888'); g.setAttribute('color', new THREE.Float32BufferAttribute([c.r, c.g, c.b, c.r, c.g, c.b, tip.r, tip.g, tip.b], 3)); return xf(g, 0, 0, 0, a); }));
  const reed = mergeGeos([0, 0.7, 1.4, 2.1, 2.8].map((a) => xf(colorize(new THREE.BoxGeometry(0.03, 1.4, 0.03), D.reeds), Math.cos(a) * 0.12, 0.7, Math.sin(a) * 0.12, 0, 0, (a % 1.4) * 0.1)));
  const pebble = colorize(new THREE.IcosahedronGeometry(0.1, 0), D.sandShadow); pebble.scale(1.2, 0.6, 0.9);
  const items = { grass: [] as [number, number, number, number][], pebble: [] as [number, number, number, number][], reed: [] as [number, number, number, number][] };
  const cell = 2;
  for (let gx = Math.floor(PLATE.x0 / cell); gx < PLATE.x1 / cell; gx++) for (let gz = Math.floor(PLATE.z0 / cell); gz < PLATE.z1 / cell; gz++) {
    const cx = gx * cell, cz = gz * cell;
    if (!inside(cx + 1, cz + 1)) continue;
    const bonus = hash2(gx, gz) < 12;
    const wd = distToWater(cx + 1, cz + 1);
    const n = { grass: (bonus ? 3.5 : 0.25) * (wd < 6 ? 2 : 1), pebble: 0.5 + (bonus ? 1 : 0), reed: wd > -0.6 && wd < 1.8 ? 2.2 : 0 };
    for (const kind of ['grass', 'pebble', 'reed'] as const) {
      const count = Math.floor(n[kind]) + (r() < n[kind] - Math.floor(n[kind]) ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const x = cx + r() * cell, z = cz + r() * cell;
        const y = groundY(x, z);
        if (kind !== 'reed' && (y < -0.3 || oasisD(x, z) < 1.05)) continue;
        if (kind === 'reed' && (oasisD(x, z) < 0.9 || oasisD(x, z) > 1.25)) continue;
        if (z > STRIP.z0 && z < STRIP.z1 && x > STRIP.x0 && x < STRIP.x1) continue;
        if (Math.hypot(x - SHADE.x, z - SHADE.z) < SHADE.r || Math.hypot(x - NOMAD.x, z - NOMAD.z) < NOMAD.r) continue;
        items[kind].push([x, Math.max(y, kind === 'reed' ? -0.2 : y), z, r() * 6.28]);
      }
    }
  }
  const inst = (geo: THREE.BufferGeometry, list: [number, number, number, number][], mat: THREE.MeshStandardMaterial, sMin: number, sMax: number) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, yaw], i) => { const s = lerp(sMin, sMax, r()); m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(s, s, s)); im.setMatrixAt(i, m); const v = 0.9 + r() * 0.2; im.setColorAt(i, col.setRGB(v, v, v)); });
    im.receiveShadow = true; group.add(im);
  };
  inst(grass, items.grass, swayMat, 0.7, 1.3);
  inst(pebble, items.pebble, stillMat, 0.5, 1.6);
  inst(reed, items.reed, swayMat, 0.8, 1.3);
  return { group, trunks };
}
