// Frozen props: Neve's log hut at the Hearth (a lit window, a chimney with smoke, the hearth-pot
// with embers on the porch, the woodpile, a sled, the kids' snowman in Isabella's scarf), the
// Green Meanie on the snowfield strip with a lantern post, the glacier shelf with the propeller
// frozen into blue ice (the gold glint seen from the strip), the ice-fall on the north cliff (a
// frozen waterfall of ice columns and icicles over a frozen pool), a cairn, and the Hermit's
// Observatory dome on its summit far off (the only man-made silhouette on the island).
import * as THREE from 'three';
import { FROZEN as F } from '../_shared/biomes';
import { makePost, type Lantern } from '../_shared/lantern';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { softDisc } from '../_shared/particles';
import { makePlane } from '../_shared/plane';
import { BLOOM_LAYER } from '../_shared/post';
import { deg, rng } from '../_shared/rng';
import { C, type Keyframe } from '../_shared/style';
import type { Circle } from '../_shared/walk';
import { ICEFALL, OBSERVATORY, SHELF, terrainY } from './terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const yaw = (bearing: number) => deg(90 - bearing);

export interface Props {
  group: THREE.Group; footprints: Circle[];
  update: (t: number, dt: number, kf: Keyframe) => void;
  goatLedges: THREE.Vector3[];
}

export function makeProps(): Props {
  const r = rng(77);
  const group = new THREE.Group();
  const worldMat = makeWorldMaterial({ aurora: true });
  const glowMat = makeWorldMaterial({ emissive: true, aurora: true });
  const iceMat = makeWorldMaterial({ transparent: true, opacity: 0.82, roughness: 0.25, aurora: true });
  const opaque: THREE.BufferGeometry[] = [], glow: THREE.BufferGeometry[] = [], ice: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const at = (g: THREE.BufferGeometry, x: number, z: number, ry = 0, dy = 0) => xf(g, x, terrainY(x, z) + dy, z, ry);
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });
  const lanterns: Lantern[] = [];
  const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

  // ---- Neve's hut: stacked logs, a deep snowy roof, the window, the chimney, the porch ------------
  const hutLight = new THREE.PointLight(F.window, 16, 8, 2);
  const smoke: THREE.Sprite[] = [];
  {
    const hx = -2.5, hz = -4.5, ry = yaw(160), hy = terrainY(hx, hz);
    const parts: THREE.BufferGeometry[] = [];
    const L = 5.2, W = 4.0;
    for (let i = 0; i < 8; i++) {
      const y = 0.22 + i * 0.36;
      parts.push(CY(0.18, 0.18, L + 0.3, 6, i % 2 ? F.hutWood : '#6A4630').rotateZ(Math.PI / 2).translate(0, y, W / 2 * (i % 2 ? 1 : 1)));
      parts.push(CY(0.18, 0.18, L + 0.3, 6, i % 2 ? '#6A4630' : F.hutWood).rotateZ(Math.PI / 2).translate(0, y, -W / 2));
      parts.push(CY(0.18, 0.18, W + 0.3, 6, i % 2 ? '#6A4630' : F.hutWood).rotateX(Math.PI / 2).translate(L / 2, y, 0));
      parts.push(CY(0.18, 0.18, W + 0.3, 6, i % 2 ? F.hutWood : '#6A4630').rotateX(Math.PI / 2).translate(-L / 2, y, 0));
    }
    parts.push(B(L - 0.2, 2.9, W - 0.2, '#4A3020').translate(0, 1.5, 0));
    const th = 0.72, half = 1.5;
    for (const s of [-1, 1]) {
      parts.push(B(L + 1.4, 0.16, half * 2, F.hutRoof).applyMatrix4(new THREE.Matrix4().makeRotationX(-s * th)).translate(0, 3.1 + half * Math.sin(th), s * half * Math.cos(th)));
      parts.push(B(L + 1.6, 0.36, half * 2 + 0.2, F.snow).applyMatrix4(new THREE.Matrix4().makeRotationX(-s * th)).translate(0, 3.1 + half * Math.sin(th) + 0.22, s * half * Math.cos(th)));
    }
    parts.push(B(L + 1.7, 0.3, 0.5, F.snow).translate(0, 3.1 + 2 * half * Math.sin(th) + 0.1, 0));
    parts.push(B(0.7, 2.2, 0.7, F.chimney).translate(1.6, 4.4, -0.6), B(0.9, 0.2, 0.9, F.snow).translate(1.6, 5.55, -0.6));
    parts.push(B(0.9, 1.8, 0.1, '#2E2218').translate(-1.2, 0.9, W / 2 + 0.12), B(0.08, 0.08, 0.08, C.iron).translate(-0.9, 0.9, W / 2 + 0.2));
    parts.push(B(L + 0.6, 0.12, 1.8, '#6A4630').translate(0, 0.08, W / 2 + 1.0));
    for (const x of [-L / 2 - 0.1, L / 2 + 0.1]) parts.push(CY(0.09, 0.1, 2.4, 6, F.hutWood).translate(x, 1.2, W / 2 + 1.8));
    parts.push(B(L + 0.8, 0.12, 2.2, F.hutRoof).applyMatrix4(new THREE.Matrix4().makeRotationX(0.28)).translate(0, 2.5, W / 2 + 1.0), B(L + 0.9, 0.24, 2.3, F.snow).applyMatrix4(new THREE.Matrix4().makeRotationX(0.28)).translate(0, 2.68, W / 2 + 1.0));
    const hut = mergeGeos(parts); jitterColor(hut, r, 0.04);
    xf(hut, hx, hy, hz, ry); opaque.push(hut);
    // the lit window (emissive, a light behind it) on the porch face
    const win = colorize(new THREE.BoxGeometry(0.9, 0.7, 0.08), F.window, emis(F.window, 1.6));
    win.translate(1.1, 1.7, W / 2 + 0.06); const cross = mergeGeos([B(0.06, 0.74, 0.1, F.hutWood).translate(1.1, 1.7, W / 2 + 0.1), B(0.94, 0.06, 0.1, F.hutWood).translate(1.1, 1.7, W / 2 + 0.1)]);
    glow.push(xf(win, hx, hy, hz, ry)); opaque.push(xf(cross, hx, hy, hz, ry));
    hutLight.position.set(hx + Math.cos(ry) * 1.1 + Math.sin(ry) * (W / 2 + 0.5), hy + 1.7, hz - Math.sin(ry) * 1.1 + Math.cos(ry) * (W / 2 + 0.5));
    group.add(hutLight);
    // the hearth-pot on the porch (Neve's): iron pot, embers glowing, a small light
    const px = hx + Math.cos(ry) * -0.4 + Math.sin(ry) * (W / 2 + 1.0), pz = hz - Math.sin(ry) * -0.4 + Math.cos(ry) * (W / 2 + 1.0);
    opaque.push(at(mergeGeos([CY(0.3, 0.24, 0.42, 8, C.iron).translate(0, 0.33, 0), ...[0, 2.1, 4.2].map((a) => CY(0.03, 0.03, 0.5, 4, C.iron).rotateZ(0.3).rotateY(a).translate(Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2))]), px, pz, 0, 0.12));
    glow.push(at(colorize(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 8), C.campfire, emis(C.campfire, 2.2)), px, pz, 0, 0.62));
    const potLight = new THREE.PointLight(C.campfire, 20, 5, 2); potLight.position.set(px, terrainY(px, pz) + 0.9, pz); group.add(potLight);
    lanternsFire.push(potLight);
    fp(hx, hz, 3.6); fp(px, pz, 0.4);
    // Neve: a dark round bundle with a warm glow at her middle, on the porch
    const nx = hx + Math.cos(ry) * 1.4 + Math.sin(ry) * (W / 2 + 1.0), nz = hz - Math.sin(ry) * 1.4 + Math.cos(ry) * (W / 2 + 1.0);
    const neve = mergeGeos([colorize(new THREE.IcosahedronGeometry(0.55, 1), F.indigo).scale(1, 1.3, 1).translate(0, 0.75, 0), colorize(new THREE.TorusGeometry(0.5, 0.1, 5, 10), F.snow).rotateX(Math.PI / 2).translate(0, 1.2, 0), colorize(new THREE.SphereGeometry(0.2, 7, 5), '#E8C8B0').translate(0, 1.45, 0.1), colorize(new THREE.TorusGeometry(0.22, 0.09, 5, 10), F.snow).rotateX(Math.PI / 2).translate(0, 1.6, 0.05)]);
    opaque.push(at(neve, nx, nz, ry + 0.3, 0.12));
    glow.push(at(colorize(new THREE.IcosahedronGeometry(0.12, 0), C.campfire, emis(C.campfire, 1.8)), nx, nz, 0, 0.9));
    fp(nx, nz, 0.6);
    // chimney smoke
    const tex = softDisc();
    const sm = new THREE.SpriteMaterial({ map: tex, color: '#DDE4F0', transparent: true, opacity: 0.3, depthWrite: false });
    for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(sm.clone()); s.userData['i'] = i; group.add(s); smoke.push(s); }
    smokeBase.set(hx + Math.cos(ry) * 1.6 + Math.sin(ry) * -0.6, hy + 5.6, hz - Math.sin(ry) * 1.6 + Math.cos(ry) * -0.6);
  }
  // the woodpile, the sled, the snowman
  {
    const g: THREE.BufferGeometry[] = [];
    [[-0.3, -0.1, 0.1, 0.3], [-0.2, 0, 0.2], [-0.1, 0.1]].forEach((row, ri) => row.forEach((z) => { g.push(CY(0.1, 0.1, 0.6, 6, F.bark).rotateZ(Math.PI / 2).translate(0, 0.1 + ri * 0.18, z)); }));
    g.push(B(0.7, 0.12, 0.85, F.snow).translate(0, 0.62, 0));
    opaque.push(at(mergeGeos(g), 3.2, -3.0, 0.4)); fp(3.2, -3.0, 0.6);
    const sled = mergeGeos([B(1.6, 0.06, 0.9, '#8A5A38').translate(0, 0.3, 0), ...[-0.4, 0.4].map((z) => B(1.9, 0.06, 0.06, C.iron).translate(0, 0.06, z)), ...[-0.4, 0.4].map((z) => B(0.06, 0.3, 0.06, F.hutWood).translate(0.6, 0.18, z)), ...[-0.4, 0.4].map((z) => B(0.06, 0.3, 0.06, F.hutWood).translate(-0.6, 0.18, z)), B(0.6, 0.5, 0.6, '#8B4513').translate(-0.2, 0.58, 0), B(0.62, 0.06, 0.62, '#7a3b10').translate(-0.2, 0.86, 0)]);
    opaque.push(at(sled, 5.5, 1.5, 0.9)); fp(5.5, 1.5, 0.9);
    const sx = -6.5, sz = 3.0;
    const snowman = mergeGeos([colorize(new THREE.IcosahedronGeometry(0.55, 1), F.snow).translate(0, 0.5, 0), colorize(new THREE.IcosahedronGeometry(0.4, 1), F.snow).translate(0, 1.3, 0), colorize(new THREE.IcosahedronGeometry(0.28, 1), F.snow).translate(0, 1.88, 0),
      colorize(new THREE.ConeGeometry(0.05, 0.3, 5), '#E8801A').rotateX(Math.PI / 2).translate(0, 1.9, 0.38), ...[[-0.08, 1.98, 0.25], [0.08, 1.98, 0.25]].map(([x, y, z]) => colorize(new THREE.IcosahedronGeometry(0.03, 0), '#2A2418').translate(x!, y!, z!)),
      ...[0, 1, 2].map((i) => colorize(new THREE.IcosahedronGeometry(0.03, 0), '#2A2418').translate(0, 1.2 + i * 0.16, 0.38)),
      CY(0.02, 0.03, 0.9, 4, F.bark).rotateZ(1.2).translate(0.5, 1.5, 0), CY(0.02, 0.03, 0.9, 4, F.bark).rotateZ(-1.9).translate(-0.5, 1.45, 0),
      colorize(new THREE.TorusGeometry(0.3, 0.06, 5, 10), '#D6294E').rotateX(Math.PI / 2).translate(0, 1.62, 0), B(0.12, 0.5, 0.04, '#D6294E').translate(0.22, 1.35, 0.26),
      CY(0.26, 0.28, 0.06, 8, '#2A2418').translate(0, 2.12, 0), CY(0.18, 0.2, 0.3, 8, '#2A2418').translate(0, 2.3, 0)]);
    opaque.push(at(snowman, sx, sz, 0.4)); fp(sx, sz, 0.7);
  }
  // ---- the strip: the Green Meanie, a lantern post, a fuel crate -------------------------------
  const plane = makePlane(14, terrainY(14, 20) + 0.05, 20, 270, worldMat);
  group.add(plane.group); footprints.push(...plane.footprint);
  const post = makePost(2.4, F.hutWood, C.iron, C.lantern, 14, 6, true);
  post.group.position.set(-8, terrainY(-8, 17.5), 17.5); group.add(post.group); lanterns.push(post.lantern); fp(-8, 17.5, 0.25);
  opaque.push(at(mergeGeos([B(0.7, 0.6, 0.7, '#8B4513').translate(0, 0.3, 0), B(0.72, 0.06, 0.72, '#7a3b10').translate(0, 0.48, 0), B(0.74, 0.1, 0.74, F.snow).translate(0, 0.64, 0)]), 6, 22.5, 0.3)); fp(6, 22.5, 0.5);
  // ---- the glacier shelf: broken ice blocks, the propeller frozen in, the goats' ledges ----------
  const goatLedges: THREE.Vector3[] = [];
  const propLight = new THREE.PointLight(F.propeller, 6, 6, 2);
  {
    const sx = SHELF.x, sz = SHELF.z, sy = terrainY(sx, sz);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.283 + 0.4, d = 4.5 + r() * 3.5;
      const bx = sx + Math.cos(a) * d, bz = sz + Math.sin(a) * d;
      const g = colorize(new THREE.BoxGeometry(2.0 + r() * 2.4, 0.6 + r() * 1.2, 1.2 + r() * 1.4), i % 3 ? F.ice : '#C8E8F8');
      g.rotateY(r() * 6); g.rotateZ((r() - 0.5) * 0.5); g.rotateX((r() - 0.5) * 0.3);
      ice.push(xf(g, bx, terrainY(bx, bz) + 0.3, bz));
    }
    // the big block with the propeller inside
    ice.push(xf(colorize(new THREE.BoxGeometry(3.2, 2.6, 2.2), F.ice), sx, sy + 1.2, sz, 0.4, 0, 0.08));
    const prop = mergeGeos([B(0.08, 2.4, 0.3, F.propeller).translate(0, 0, 0), CY(0.18, 0.18, 0.2, 8, F.propellerDark).rotateX(Math.PI / 2)]);
    const pe = new THREE.Color(F.propeller).multiplyScalar(0.9); const pa = prop.getAttribute('position') as THREE.BufferAttribute; const em = new Float32Array(pa.count * 3); for (let i = 0; i < pa.count; i++) { em[i * 3] = pe.r; em[i * 3 + 1] = pe.g; em[i * 3 + 2] = pe.b; }
    prop.setAttribute('aEmissive', new THREE.BufferAttribute(em, 3)); prop.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(pa.count).fill(1), 1));
    glow.push(xf(prop, sx, sy + 1.3, sz, 0.4, 0.2, 0.55));
    propLight.position.set(sx, sy + 1.5, sz); group.add(propLight);
    goatLedges.push(new THREE.Vector3(sx - 6, terrainY(sx - 6, sz + 3) + 0.3, sz + 3), new THREE.Vector3(sx + 5, terrainY(sx + 5, sz - 5) + 0.4, sz - 5));
    fp(sx, sz, 2.4);
  }
  // ---- the ice-fall: a frozen waterfall on the north cliff over a frozen pool --------------------
  {
    const fx = ICEFALL.x, fz = ICEFALL.z;
    const top = terrainY(fx, fz - 6), base = terrainY(fx, fz + 8);
    const hgt = top - base + 1.5;
    for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++) {
      const u = ((i + row * 0.5) / 15.5 - 0.5) * ICEFALL.w * 0.9;
      const w = 1.2 + r() * 1.3, h = hgt * (row ? 0.55 + r() * 0.3 : 0.85 + r() * 0.25);
      const g = colorize(new THREE.CylinderGeometry(w * 0.4, w * 0.75, h, 5), F.ice, emis(F.ice, 0.14));
      const gp = g.getAttribute('position') as THREE.BufferAttribute, gc = g.getAttribute('color') as THREE.BufferAttribute;
      const deep = new THREE.Color(F.iceDeep), pale = new THREE.Color('#E4F6FF');
      for (let k = 0; k < gp.count; k++) { const tt = THREE.MathUtils.clamp(gp.getY(k) / h + 0.5, 0, 1); const cc = deep.clone().lerp(pale, tt * tt); gc.setXYZ(k, cc.r, cc.g, cc.b); }
      g.translate(0, h / 2, 0); g.rotateY(r() * 6);
      const zz = fz + 1 + row * 1.6 + Math.abs(u) * 0.1 + r() * 0.6;
      glow.push(xf(g, fx + u, base - 0.6, zz, 0, (r() - 0.5) * 0.05, 0));
    }
    glow.push(xf(colorize(new THREE.BoxGeometry(ICEFALL.w * 0.95, 1.2, 3.2), '#E4F6FF', emis(F.ice, 0.1)), fx, top + 0.3, fz - 3.2, 0, 0.12, 0));
    for (let i = 0; i < 8; i++) { const g = colorize(new THREE.IcosahedronGeometry(1.0 + r() * 1.2, 1), '#DCEFFB'); g.scale(1.4, 0.7, 1.2); opaque.push(xf(g, fx + (r() - 0.5) * ICEFALL.w * 0.8, base + 0.2, fz + 3.5 + r() * 2.5, r() * 6)); }
    for (let i = 0; i < 22; i++) { const u = (r() - 0.5) * ICEFALL.w; const h = 0.8 + r() * 2.4; ice.push(xf(colorize(new THREE.ConeGeometry(0.16 + r() * 0.12, h, 5), '#E0F4FF').rotateX(Math.PI), fx + u, top + 0.6 - h / 2, fz - 4 + r() * 2)); }
    // the frozen pool at the base: a pale disc with a rim of snow humps
    opaque.push(xf(colorize(new THREE.CircleGeometry(7, 12), '#C8E4F4').rotateX(-Math.PI / 2), fx, base + 0.05, fz + 10));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; const g = colorize(new THREE.IcosahedronGeometry(0.6 + r() * 0.5, 1), F.snow); g.scale(1.3, 0.6, 1.1); opaque.push(xf(g, fx + Math.cos(a) * 7.2, base + 0.1, fz + 10 + Math.sin(a) * 7.2 * 0.8)); }
    fp(fx, fz + 4, 12);
  }
  // ---- a cairn with a flag, the Observatory on its summit ----------------------------------------
  {
    const stones: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) { const s = 0.5 - i * 0.06; const g = colorize(new THREE.IcosahedronGeometry(s, 0), i % 2 ? F.rock : F.rockDark); g.scale(1.3, 0.55, 1.1); g.rotateY(r() * 6); g.translate(0, 0.15 + i * 0.28, 0); stones.push(g); }
    stones.push(CY(0.025, 0.03, 2.2, 5, F.hutWood).translate(0, 2.2, 0), colorize(new THREE.PlaneGeometry(0.6, 0.36, 3, 1), '#D6294E').translate(0.3, 3.1, 0));
    opaque.push(at(mergeGeos(stones), 22, 8, 0)); fp(22, 8, 0.6);
    const ox = OBSERVATORY.x, oz = OBSERVATORY.z, oy = terrainY(ox, oz);
    const tower = mergeGeos([CY(3.0, 3.6, 16, 8, '#5C6878').translate(0, 8, 0), CY(3.4, 3.2, 1.2, 8, '#3A4250').translate(0, 16.4, 0), colorize(new THREE.SphereGeometry(3.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#8A96A8').translate(0, 17, 0), B(0.6, 6, 0.4, '#3A4250').translate(0, 19.5, 1.5).applyMatrix4(new THREE.Matrix4().makeRotationX(-0.9)), ...[0, 1.57, 3.14, 4.71].map((a) => B(0.9, 1.4, 0.3, '#2A3040').translate(Math.cos(a) * 3.2, 9, Math.sin(a) * 3.2).applyMatrix4(new THREE.Matrix4().makeRotationY(-a)))]);
    jitterColor(tower, r, 0.05);
    opaque.push(xf(tower, ox, oy - 0.5, oz));
    glow.push(xf(colorize(new THREE.BoxGeometry(0.9, 1.0, 0.2), F.window, emis(F.window, 1.4)), ox, oy + 12, oz + 3.5));
    glow.push(xf(colorize(new THREE.BoxGeometry(0.3, 0.3, 0.3), F.auroraGreen, emis(F.auroraGreen, 1.2)), ox, oy + 20.6, oz - 0.1));
  }

  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat); opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  const glowMesh = new THREE.Mesh(mergeGeos(glow), glowMat); glowMesh.layers.enable(BLOOM_LAYER); glowMesh.castShadow = true;
  const iceMesh = new THREE.Mesh(mergeGeos(ice), iceMat); iceMesh.castShadow = true; iceMesh.receiveShadow = true; iceMesh.renderOrder = 1;
  group.add(opaqueMesh, glowMesh, iceMesh);

  const update = (t: number, dt: number, kf: Keyframe) => {
    plane.update(t);
    for (const l of lanterns) l.update(t, dt, kf.lantern);
    hutLight.intensity = 16 * (0.3 + 0.7 * kf.lantern);
    for (const l of lanternsFire) l.intensity = 20 * kf.fire * (0.85 + 0.15 * Math.sin(t * 9.3));
    propLight.intensity = 6 * (0.5 + 0.5 * Math.sin(t * 1.3)) * (0.4 + 0.6 * kf.lantern);
    const T = 6;
    smoke.forEach((s, i) => {
      const age = ((t + i * (T / 5)) % T), u = age / T;
      s.position.set(smokeBase.x + 0.4 * age + Math.sin(t * 0.6 + i) * 0.15, smokeBase.y + age * 0.7, smokeBase.z + Math.cos(t * 0.5 + i) * 0.15);
      const sc = 0.7 + u * 1.4; s.scale.set(sc, sc, 1);
      s.material.opacity = 0.3 * (1 - u) * (u < 0.1 ? u * 10 : 1);
    });
  };
  return { group, footprints, update, goatLedges };
}
const lanternsFire: THREE.PointLight[] = [];
const smokeBase = new THREE.Vector3();
