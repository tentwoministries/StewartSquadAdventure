// Trees (camp.md §2.2 #24–25 plus the north stand) and the ground scatter recipe (§2.4):
// seeded, cell-hashed, cleared around paths, props, the fire and the water.
import * as THREE from 'three';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { hash2, lerp, rng } from '../_shared/rng';
import { C } from '../_shared/style';
import { distToWater, groundY, inside, PATHS, PLATE } from './terrain';

export interface Circle { x: number; z: number; r: number }

function pineGeo(h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(xf(colorize(new THREE.CylinderGeometry(0.16 * h / 9, 0.28 * h / 9, 0.3 * h, 6), C.bark), 0, 0.15 * h));
  const em = new THREE.Color(C.emerald), mo = new THREE.Color(C.moss);
  for (let i = 0; i < 4; i++) {
    const rad = h * (0.27 - 0.05 * i), ch = h * 0.36, y0 = h * (0.16 + 0.2 * i);
    const g = colorize(new THREE.ConeGeometry(rad, ch, 6), C.moss);
    g.translate(0, y0 + ch / 2, 0);
    const p = g.getAttribute('position') as THREE.BufferAttribute, c = g.getAttribute('color') as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const t = Math.pow(THREE.MathUtils.clamp(p.getY(k) / (h * 1.1), 0, 1), 1.3);
      const cc = em.clone().lerp(mo, t * 0.85 + 0.05);
      c.setXYZ(k, cc.r, cc.g, cc.b);
    }
    parts.push(g);
  }
  return mergeGeos(parts);
}
function birchGeo(h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = colorize(new THREE.CylinderGeometry(0.09, 0.13, h * 0.62, 6), C.cream);
  trunk.translate(0, h * 0.31, 0);
  const p = trunk.getAttribute('position') as THREE.BufferAttribute, c = trunk.getAttribute('color') as THREE.BufferAttribute;
  const bark = new THREE.Color(C.bark);
  for (let k = 0; k < p.count; k++) if (Math.sin(p.getY(k) * 9) > 0.55) c.setXYZ(k, bark.r, bark.g, bark.b);
  parts.push(trunk);
  const cols = [C.moss, C.birchLeaf, C.moss];
  const blobs: [number, number, number, number][] = [[0, h * 0.72, 0, h * 0.22], [h * 0.14, h * 0.6, h * 0.08, h * 0.16], [-h * 0.12, h * 0.85, -h * 0.06, h * 0.15]];
  blobs.forEach(([x, y, z, rr], i) => parts.push(xf(colorize(new THREE.IcosahedronGeometry(rr, 1), cols[i]!), x, y, z)));
  return mergeGeos(parts);
}

export function makeTrees(): { group: THREE.Group; trunks: Circle[]; mat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const mat = makeWorldMaterial({ sway: 0.012 });
  const trunks: Circle[] = [];
  const r = rng(31);
  const pines: [number, number, number][] = [[-12.5, -8.5, 11], [3.5, -13.5, 8.5], [-14, -13, 7], [20, 10, 9], [24, -9, 8]];
  const birches: [number, number, number][] = [[-11, 9, 6], [6, -8, 5.5]];
  const ok = (x: number, z: number, minD: number) => {
    if (!inside(x, z)) return false;
    if (Math.hypot(x, z) < 6) return false;
    if (x > 10 && x < 70 && Math.abs(z) < 7) return false;
    if (distToWater(x, z) < 1.5) return false;
    if (groundY(x, z) < -0.2) return false;
    for (const t of trunks) if (Math.hypot(t.x - x, t.z - z) < minD) return false;
    return true;
  };
  // the north stand and a frame of pines round the plate
  let tries = 0;
  while (pines.length < 5 + 34 && tries++ < 4000) {
    const zone = r();
    const x = zone < 0.6 ? lerp(-50, 60, r()) : lerp(PLATE.x0, PLATE.x1, r());
    const z = zone < 0.6 ? lerp(-46, -14, r()) : (r() < 0.5 ? lerp(-50, -12, r()) : lerp(24, 50, r()));
    if (!ok(x, z, 3.6)) continue;
    if (Math.hypot(x, z) < 16) continue;
    pines.push([x, z, 6.5 + r() * 5]);
    trunks.push({ x, z, r: 0.4 });
  }
  tries = 0;
  while (birches.length < 12 && tries++ < 2000) {
    const x = lerp(-48, 58, r()), z = lerp(-46, 46, r());
    if (!ok(x, z, 3) || Math.hypot(x, z) < 14) continue;
    birches.push([x, z, 4.5 + r() * 2.5]);
    trunks.push({ x, z, r: 0.25 });
  }
  for (const [x, z] of [...pines.slice(0, 5), ...birches.slice(0, 2)]) trunks.push({ x, z, r: 0.4 });
  const unitPine = pineGeo(9);
  const pineMesh = new THREE.InstancedMesh(unitPine, mat, pines.length);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  pines.forEach(([x, z, h], i) => {
    m.compose(new THREE.Vector3(x, groundY(x, z) - 0.1, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), new THREE.Vector3(h / 9, h / 9, h / 9));
    pineMesh.setMatrixAt(i, m);
    const v = 0.9 + r() * 0.18;
    col.setRGB(v * (0.96 + r() * 0.08), v, v * (0.96 + r() * 0.08));
    pineMesh.setColorAt(i, col);
  });
  pineMesh.castShadow = true; pineMesh.receiveShadow = true;
  group.add(pineMesh);
  const unitBirch = birchGeo(6);
  const birchMesh = new THREE.InstancedMesh(unitBirch, mat, birches.length);
  birches.forEach(([x, z, h], i) => {
    m.compose(new THREE.Vector3(x, groundY(x, z) - 0.05, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), new THREE.Vector3(h / 6, h / 6, h / 6));
    birchMesh.setMatrixAt(i, m);
    const v = 0.92 + r() * 0.16;
    col.setRGB(v, v, v);
    birchMesh.setColorAt(i, col);
  });
  birchMesh.castShadow = true; birchMesh.receiveShadow = true;
  group.add(birchMesh);
  return { group, trunks, mat };
}

// ---- ground scatter --------------------------------------------------------------------------
type Kind = 'grass' | 'flower' | 'pebble' | 'mushroom' | 'leaf' | 'clover' | 'twig';
const DENSITY: Record<Kind, [number, number, number, number]> = {
  // core, meadow, canopy, bank (per m², camp.md §2.4)
  grass: [1.2, 0.8, 0.5, 1.6], flower: [0.06, 0.03, 0.02, 0.1], pebble: [0.3, 0.15, 0.2, 2.0],
  mushroom: [0.08, 0.04, 0.5, 0.4], leaf: [0.3, 0.2, 1.5, 0.3], clover: [0.6, 0.3, 0.2, 0.4], twig: [0.2, 0.1, 0.6, 0.3],
};

function grassGeo(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const a = new THREE.Color(C.grassA).multiplyScalar(1.05), b = new THREE.Color(C.grassB).multiplyScalar(1.1), tip = new THREE.Color(C.grassTip).multiplyScalar(1.12);
  for (let i = 0; i < 3; i++) {
    const g = new THREE.BufferGeometry();
    const w = 0.11, h = 0.24 + i * 0.04, lean = 0.06;
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, lean, h, 0], 3));
    const base = i === 1 ? b : a;
    g.setAttribute('color', new THREE.Float32BufferAttribute([base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b], 3));
    parts.push(xf(g, 0, 0, 0, i * 1.05));
  }
  const m = mergeGeos(parts);
  return m;
}
function flowerGeo(hex: string): THREE.BufferGeometry {
  const stem = xf(colorize(new THREE.BoxGeometry(0.02, 0.26, 0.02), C.grassB), 0, 0.13);
  const head = xf(colorize(new THREE.IcosahedronGeometry(0.05, 0), hex), 0, 0.28, 0, 0, 0, 0, 1);
  head.scale(1.3, 0.7, 1.3);
  return mergeGeos([stem, head]);
}
const pebbleGeo = (hex: string) => { const g = colorize(new THREE.IcosahedronGeometry(0.09, 0), hex); g.scale(1.2, 0.6, 0.9); jitterColor(g, rng(2), 0); (g.getAttribute('color') as THREE.BufferAttribute).array.forEach((_, i, a) => { a[i] = a[i]! * 0.8; }); return g; };
const mushroomGeo = () => mergeGeos([xf(colorize(new THREE.CylinderGeometry(0.02, 0.028, 0.09, 5), C.mushroomStalk), 0, 0.045), xf(colorize(new THREE.ConeGeometry(0.075, 0.06, 6), C.mushroom), 0, 0.11)]);
const leafGeo = () => { const g = colorize(new THREE.PlaneGeometry(0.14, 0.09), '#FFFFFF'); g.rotateX(-Math.PI / 2); return g; };
const cloverGeo = () => mergeGeos([0, 2.1, 4.2].map((a) => { const g = colorize(new THREE.PlaneGeometry(0.07, 0.07), C.moss); g.rotateX(-Math.PI / 2); g.translate(0.04, 0.03, 0); g.rotateY(a); return g; }));
const twigGeo = () => colorize(new THREE.BoxGeometry(0.28, 0.02, 0.02), C.bark);

export function makeScatter(clear: Circle[], trunks: Circle[]): { group: THREE.Group; mats: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const swayMat = makeWorldMaterial({ sway: 0.14, side: THREE.DoubleSide });
  const stillMat = makeWorldMaterial({ side: THREE.DoubleSide });
  const r = rng(27);
  const pathD = (x: number, z: number) => {
    let best = Infinity;
    for (const path of PATHS) for (let i = 0; i + 1 < path.length; i++) {
      const [ax, az] = path[i]!, [bx, bz] = path[i + 1]!;
      const vx = bx - ax, vz = bz - az;
      const t = THREE.MathUtils.clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
      best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t));
    }
    return best;
  };
  const items: Record<Kind, { x: number; z: number; y: number; s: number; yaw: number; v: number; variant: number }[]> = {
    grass: [], flower: [], pebble: [], mushroom: [], leaf: [], clover: [], twig: [],
  };
  // six seeded flower drifts 3–5 m across (camp.md §2.4), off the paths
  const drifts: { x: number; z: number; r: number }[] = [];
  while (drifts.length < 6) { const x = (r() - 0.5) * 40, z = (r() - 0.5) * 40; if (Math.hypot(x, z) < 4 || Math.hypot(x, z) > 21 || pathD(x, z) < 2.5 || distToWater(x, z) < 1) continue; drifts.push({ x, z, r: 1.5 + r() * 1.0 }); }
  const inDrift = (x: number, z: number) => drifts.some((d) => Math.hypot(d.x - x, d.z - z) < d.r);
  const cell = 1.5;
  for (let gx = Math.floor(PLATE.x0 / cell); gx < PLATE.x1 / cell; gx++) {
    for (let gz = Math.floor(PLATE.z0 / cell); gz < PLATE.z1 / cell; gz++) {
      const cx = gx * cell, cz = gz * cell;
      if (!inside(cx + cell / 2, cz + cell / 2)) continue;
      const dFire = Math.hypot(cx, cz);
      const wd = distToWater(cx + cell / 2, cz + cell / 2);
      let zone = dFire < 22 ? 0 : 1;
      for (const t of trunks) if (Math.hypot(t.x - cx, t.z - cz) < 3) { zone = 2; break; }
      if (wd < 2.5 && wd > -0.5) zone = 3;
      const bonus = hash2(gx, gz) < 15;
      for (const kind of Object.keys(DENSITY) as Kind[]) {
        let n = DENSITY[kind][zone]! * cell * cell;
        if (bonus && kind === 'grass') n += 5;
        if (bonus && kind === 'flower') n += 1;
        if (kind === 'flower' && inDrift(cx + cell / 2, cz + cell / 2)) n += 2.5 * cell * cell;
        if (kind === 'grass' && !bonus) n *= 0.7;
        const count = Math.floor(n) + (r() < n - Math.floor(n) ? 1 : 0);
        for (let i = 0; i < count; i++) {
          const x = cx + r() * cell, z = cz + r() * cell;
          const y = groundY(x, z);
          if (y < -0.3) continue;
          const pd = pathD(x, z);
          if (kind !== 'pebble' && pd < 0.45) continue;
          if (kind === 'pebble' && pd < 0.45 && r() < 0.5) continue;
          const df = Math.hypot(x, z);
          if (df < 1.6) continue;
          if (kind === 'flower' && df < 2.5) continue;
          let blocked = false;
          for (const c of clear) if (Math.hypot(c.x - x, c.z - z) < c.r + 0.25) { blocked = true; break; }
          if (blocked) continue;
          for (const t of trunks) if (Math.hypot(t.x - x, t.z - z) < t.r + 0.3) { blocked = true; break; }
          if (blocked) continue;
          let s = kind === 'grass' ? lerp(0.8, 1.25, r()) : kind === 'pebble' ? lerp(0.6, 1.6, r()) : lerp(0.85, 1.15, r());
          if (kind === 'grass' && pd < 1.2) s *= 0.6;
          const v = 1 + (r() * 2 - 1) * (kind === 'pebble' ? 0.1 : 0.08);
          items[kind].push({ x, z, y: y + (kind === 'pebble' && r() < 0.3 ? -0.03 : 0), s, yaw: r() * 6.28, v, variant: Math.floor(r() * 6) });
        }
      }
    }
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const place = (geo: THREE.BufferGeometry, mat: THREE.MeshStandardMaterial, list: typeof items.grass, tint?: (it: typeof items.grass[number]) => THREE.Color) => {
    if (list.length === 0) return;
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => {
      m.compose(new THREE.Vector3(it.x, it.y, it.z), q.setFromAxisAngle(up, it.yaw), new THREE.Vector3(it.s, it.s, it.s));
      mesh.setMatrixAt(i, m);
      const c = tint ? tint(it) : col.setRGB(1, 1, 1);
      mesh.setColorAt(i, c.multiplyScalar(it.v));
    });
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  place(grassGeo(), swayMat, items.grass, (it) => col.setRGB(1 + (it.variant - 3) * 0.015, 1, 1 - (it.variant - 3) * 0.01));
  C.flowers.forEach((hex, k) => place(flowerGeo(hex), swayMat, items.flower.filter((it) => it.variant === k)));
  place(pebbleGeo(C.stone), stillMat, items.pebble.filter((it) => it.variant % 2 === 0));
  place(pebbleGeo(C.stoneWarm), stillMat, items.pebble.filter((it) => it.variant % 2 === 1));
  const mush = mushroomGeo(); jitterColor(mush, rng(5), 0.06);
  place(mush, stillMat, items.mushroom);
  place(leafGeo(), stillMat, items.leaf, (it) => col.set(C.leaves[it.variant % 4]!));
  place(cloverGeo(), swayMat, items.clover);
  place(twigGeo(), stillMat, items.twig);
  return { group, mats: [swayMat, stillMat] };
}
