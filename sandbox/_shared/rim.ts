// The floating island's cliff rim (the Forest scene's, lifted out): march the plate boundary,
// pull each point inside the organic edge, skirt down in tiers with inset and noise, colour by tier.
import * as THREE from 'three';
import { makeWorldMaterial } from './material';
import { rng } from './rng';

export interface RimOpts {
  plate: { x0: number; x1: number; z0: number; z1: number };
  inside: (x: number, z: number) => boolean;
  groundY: (x: number, z: number) => number;
  noise: (x: number, y: number) => number;
  colours: { top: string; rock: string; dark: string; root?: string };
  tiers?: number[]; insets?: number[]; step?: number; seed?: number;
}

export function makeRim(o: RimOpts): THREE.Mesh {
  const { plate } = o;
  const step = o.step ?? 1.5;
  const rimPos: number[] = [], rimCol: number[] = [];
  const ring: [number, number][] = [];
  const bx0 = plate.x0 + 2, bx1 = plate.x1 - 2, bz0 = plate.z0 + 2, bz1 = plate.z1 - 2;
  for (let x = bx0; x < bx1; x += step) ring.push([x, bz0]);
  for (let z = bz0; z < bz1; z += step) ring.push([bx1, z]);
  for (let x = bx1; x > bx0; x -= step) ring.push([x, bz1]);
  for (let z = bz1; z > bz0; z -= step) ring.push([bx0, z]);
  const cx0 = (plate.x0 + plate.x1) / 2, cz0 = (plate.z0 + plate.z1) / 2;
  const edge = ring.map(([x, z]) => {
    let px = x, pz = z;
    for (let i = 0; i < 12 && !o.inside(px, pz); i++) { px += (cx0 - px) * 0.04; pz += (cz0 - pz) * 0.04; }
    return [px, pz] as [number, number];
  });
  const tiers = o.tiers ?? [0, -3.5, -10.5], insets = o.insets ?? [0, 1.6, 4.5];
  const top = new THREE.Color(o.colours.top), rock = new THREE.Color(o.colours.rock), dark = new THREE.Color(o.colours.dark), root = new THREE.Color(o.colours.root ?? o.colours.dark);
  const tierPt = (i: number, t: number): [number, number, number] => {
    const [x, z] = edge[i % edge.length]!;
    const ins = insets[t]! + o.noise(i * 0.7, t * 3) * 0.8;
    const dx = cx0 - x, dz = cz0 - z, len = Math.hypot(dx, dz);
    const y = t === 0 ? o.groundY(x, z) + 0.05 : tiers[t]! + o.noise(i * 0.4, t) * 1.2;
    return [x + (dx / len) * ins, y, z + (dz / len) * ins];
  };
  const rr = rng(o.seed ?? 55);
  for (let i = 0; i < edge.length; i++) {
    for (let t = 0; t + 1 < tiers.length; t++) {
      const a = tierPt(i, t), b = tierPt(i + 1, t), c = tierPt(i + 1, t + 1), d = tierPt(i, t + 1);
      const base = t === 0 ? top.clone().lerp(rock, 0.55) : rock.clone().lerp(dark, 0.6);
      for (const tri of [[a, b, c], [a, c, d]]) {
        const cc = base.clone();
        if (t === 0 && o.colours.root && rr() < 0.25) cc.lerp(root, 0.6);
        cc.multiplyScalar(1 + (rr() * 2 - 1) * 0.08);
        for (const p of tri) { rimPos.push(p[0], p[1], p[2]); rimCol.push(cc.r, cc.g, cc.b); }
      }
    }
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
  rg.setAttribute('color', new THREE.Float32BufferAttribute(rimCol, 3));
  rg.computeVertexNormals();
  return new THREE.Mesh(rg, makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide }));
}

/** A flat-shaded terrain plate on a 0.5 m grid from a height function and a face colour function. */
export function makePlate(plate: RimOpts['plate'], inside: (x: number, z: number) => boolean, groundY: (x: number, z: number) => number, faceColor: (cx: number, cz: number, hy: number, ny: number, nx: number, nz: number) => THREE.Color, grid = 0.5): THREE.Mesh {
  const pos: number[] = [], col: number[] = [];
  const push = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) => {
    const ay = groundY(ax, az), by = groundY(bx, bz), cy = groundY(cx, cz);
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(bx - ax, by - ay, bz - az), new THREE.Vector3(cx - ax, cy - ay, cz - az)).normalize();
    const c = faceColor((ax + bx + cx) / 3, (az + bz + cz) / 3, (ay + by + cy) / 3, n.y, n.x, n.z);
    pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  };
  const G = grid;
  for (let x = plate.x0; x < plate.x1; x += G) {
    for (let z = plate.z0; z < plate.z1; z += G) {
      if (!inside(x + G / 2, z + G / 2)) continue;
      if (Math.round((x + z) / G) % 2 === 0) { push(x, z, x, z + G, x + G, z + G); push(x, z, x + G, z + G, x + G, z); }
      else { push(x, z, x, z + G, x + G, z); push(x + G, z, x, z + G, x + G, z + G); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, makeWorldMaterial({ roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}
