// The C1 prop list (camp.md §2.2), procedural, vertex-coloured, merged into an opaque batch,
// an emissive batch (bloom layer), a cloth batch, and three swinging lantern groups.
import * as THREE from 'three';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { deg, rng } from '../_shared/rng';
import { displace } from '../_shared/rock';
import { C, LIGHT } from '../_shared/style';
import type { Circle } from './scatter';
import { groundY, makeStreamRocks } from './terrain';

const yaw = (bearing: number) => deg(90 - bearing);
const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

export interface Props {
  group: THREE.Group;
  lanterns: THREE.Group[];
  footprints: Circle[];
  fireLight: THREE.PointLight;
  lanternLights: THREE.PointLight[];
}

function lantern(): { pivot: THREE.Group; light: THREE.PointLight } {
  const pivot = new THREE.Group();
  const frame = mergeGeos([
    xf(CY(0.008, 0.008, 0.12, 4, C.iron), 0, -0.06),
    xf(B(0.30, 0.03, 0.19, C.iron), 0, -0.135),
    xf(B(0.30, 0.03, 0.19, C.iron), 0, -0.36),
    ...[[-0.14, -0.085], [0.14, -0.085], [-0.14, 0.085], [0.14, 0.085]].map(([x, z]) => xf(B(0.02, 0.22, 0.02, C.iron), x, -0.245, z)),
    xf(CY(0.03, 0.03, 0.02, 6, C.iron), 0, -0.13),
  ]);
  const glass = xf(colorize(new THREE.BoxGeometry(0.24, 0.17, 0.14), C.lantern, emis(C.lantern, LIGHT.lanternGlass)), 0, -0.245);
  const glassMesh = new THREE.Mesh(glass, emissiveMat);
  glassMesh.layers.enable(11);
  const frameMesh = new THREE.Mesh(frame, worldMat);
  frameMesh.castShadow = true;
  const light = new THREE.PointLight(LIGHT.lantern.color, LIGHT.lantern.intensity, LIGHT.lantern.range, LIGHT.lantern.decay);
  light.position.y = -0.245;
  pivot.add(frameMesh, glassMesh, light);
  return { pivot, light };
}

const worldMat = makeWorldMaterial();
const emissiveMat = makeWorldMaterial({ emissive: true });
const clothMat = makeWorldMaterial({ side: THREE.DoubleSide, roughness: 1 });

export function makeProps(): Props {
  const r = rng(77);
  const group = new THREE.Group();
  const opaque: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  const cloth: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const at = (g: THREE.BufferGeometry, x: number, z: number, ry = 0, dy = 0) => xf(g, x, groundY(x, z) + dy, z, ry);
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });

  // 1 fire ring S2: 12 stones, 3 logs in a star
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const s = 0.11 + r() * 0.04;
    const g = colorize(new THREE.IcosahedronGeometry(s, 0), i % 2 ? C.stone : C.stoneWarm);
    g.scale(1.3, 0.9, 1.1);
    jitterColor(g, r, 0.06);
    opaque.push(xf(g, Math.cos(a) * 1.2, 0.06 + s * 0.4, Math.sin(a) * 1.2, r() * 6.28));
  }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.094 + 0.4;
    opaque.push(xf(CY(0.08, 0.08, 0.6, 6, C.bark), Math.cos(a) * 0.14, 0.09, Math.sin(a) * 0.14, a, 0, Math.PI / 2 - 0.3));
    opaque.push(xf(colorize(new THREE.CircleGeometry(0.08, 6), C.honey), Math.cos(a) * 0.45, 0.17, Math.sin(a) * 0.45, a + Math.PI / 2));
  }
  fp(0, 0, 1.6);
  // 2 Liam's log, 3 Ed's stump
  opaque.push(at(CY(0.18, 0.18, 1.1, 8, C.bark), -1.85, 0.4, 0, 0.18).rotateX(0));
  opaque.push(at(B(0.32, 0.02, 1.05, C.honey), -1.85, 0.4, 0, 0.355));
  fp(-1.85, 0.4, 0.5);
  opaque.push(at(CY(0.25, 0.28, 0.45, 8, C.bark), 1.9, -0.5, 0, 0.225));
  opaque.push(at(colorize(new THREE.CircleGeometry(0.25, 8), C.honey).rotateX(-Math.PI / 2), 1.9, -0.5, 0, 0.455));
  fp(1.9, -0.5, 0.4);
  // 4 the tent (ridge NW–SE, door SE), 5 bedroll, 6 lantern L2 inside
  {
    const tx = -6.0, tz = -3.0, ty = groundY(tx, tz), ry = yaw(135);
    const L = 2.6, W = 1.1, H = 1.9;
    const win = new THREE.Color(C.window).multiplyScalar(LIGHT.window);
    const panel = (side: number) => {
      const g = new THREE.BufferGeometry();
      // both panels wound outward (the −z side reverses the triangle order) so neither is back-face culled
      const v = side > 0
        ? [-L / 2, 0, W, L / 2, 0, W, L / 2, H, 0, -L / 2, 0, W, L / 2, H, 0, -L / 2, H, 0]
        : [-L / 2, 0, -W, L / 2, H, 0, L / 2, 0, -W, -L / 2, 0, -W, -L / 2, H, 0, L / 2, H, 0];
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      const teal = new THREE.Color(C.tealSlate);
      const col: number[] = [], em: number[] = [], gl: number[] = [];
      for (let i = 0; i < 6; i++) {
        const y = v[i * 3 + 1]!;
        col.push(teal.r, teal.g, teal.b); em.push(win.r, win.g, win.b); gl.push(0.9 * (y / H) ** 1.2);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('aEmissive', new THREE.Float32BufferAttribute(em, 3));
      g.setAttribute('aGlow', new THREE.Float32BufferAttribute(gl, 1));
      return g;
    };
    const tent = mergeGeos([panel(1), panel(-1)]);
    xf(tent, tx, ty, tz, ry);
    glow.push(tent);
    // back wall (closed) and the tied-back door triangle
    const back = new THREE.BufferGeometry();
    back.setAttribute('position', new THREE.Float32BufferAttribute([-L / 2, 0, -W, -L / 2, 0, W, -L / 2, H, 0], 3));
    opaque.push(xf(colorize(back, '#234E58'), tx, ty, tz, ry));
    const flap = new THREE.BufferGeometry();
    flap.setAttribute('position', new THREE.Float32BufferAttribute([L / 2, 0, -W, L / 2, 0.2, -W * 0.15, L / 2, H, 0], 3));
    cloth.push(xf(colorize(flap, C.tealSlate), tx, ty, tz, ry));
    opaque.push(xf(B(L + 0.1, 0.05, 0.05, C.tealSlateLit), tx, ty + H, tz, ry));
    opaque.push(xf(B(0.4, 0.3, 0.02, C.tealSlateLit), tx + 0.3, ty + 1.0, tz - 0.9, ry, -0.5));
    for (const s of [-1, 1]) opaque.push(xf(CY(0.03, 0.035, H, 6, C.bark), tx + Math.cos(ry) * s * L / 2, ty + H / 2, tz - Math.sin(ry) * s * L / 2));
    // guy lines and pegs
    for (const [ex, ez] of [[-L / 2 - 0.9, -W - 0.6], [-L / 2 - 0.9, W + 0.6], [L / 2 + 0.9, -W - 0.6], [L / 2 + 0.9, W + 0.6], [0, -W - 1.0], [0, W + 1.0]]) {
      const from = new THREE.Vector3(Math.sign(ex!) * L / 2, ex === 0 ? H * 0.55 : H, ex === 0 ? Math.sign(ez!) * W * 0.45 : 0);
      if (ex === 0) from.set(0, H, 0);
      const to = new THREE.Vector3(ex, 0.05, ez);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const len = from.distanceTo(to);
      const rope = CY(0.008, 0.008, len, 4, C.rope);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      rope.applyQuaternion(q); rope.translate(mid.x, mid.y, mid.z);
      opaque.push(xf(rope, tx, ty, tz, ry));
      opaque.push(xf(B(0.05, 0.14, 0.05, C.cream).translate(to.x, 0.06, to.z), tx, ty, tz, ry));
    }
    // bedroll (check pattern) and pillow
    opaque.push(xf(B(0.7, 0.12, 1.9, C.cream).translate(-0.3, 0.06, 0.1), tx, ty, tz, ry));
    for (const k of [-0.6, -0.2, 0.2, 0.6]) opaque.push(xf(B(0.72, 0.125, 0.18, k === 0.2 ? C.honey : C.tealSlate).translate(-0.3, 0.06, 0.1 + k), tx, ty, tz, ry));
    opaque.push(xf(B(0.5, 0.14, 0.3, C.cream).translate(-0.3, 0.13, -0.75), tx, ty, tz, ry));
    fp(tx, tz, 2.4);
  }
  // 7 lantern post L1, 9 L3 on the wreck strut (lantern groups placed later)
  opaque.push(at(CY(0.06, 0.06, 2.1, 6, C.bark), 3.0, 2.2, 0, 1.05));
  opaque.push(at(B(0.35, 0.05, 0.05, C.iron).translate(-0.15, 0, 0), 3.0, 2.2, 0, 2.0));
  fp(3.0, 2.2, 0.3);
  // 8 the wreck (The Green Meanie), mound, 10–11 furrow debris
  {
    const nose = new THREE.Vector3(11.5, groundY(11.5, 0.4) - 0.1, 0.4), tail = new THREE.Vector3(17.6, groundY(17.6, -0.4) + 1.3, -0.4);
    const dir = tail.clone().sub(nose);
    const len = dir.length();
    const ry = Math.atan2(-dir.z, dir.x), pitch = Math.asin(dir.y / len);
    const parts: THREE.BufferGeometry[] = [];
    const fus = CY(0.26, 0.48, len, 4, C.planeYellow); fus.rotateY(Math.PI / 4); fus.rotateZ(-Math.PI / 2); fus.translate(len / 2, 0.55, 0);
    parts.push(fus);
    parts.push(B(len * 0.9, 0.06, 0.5, C.planeYellowDark).translate(len / 2, 0.08, 0));
    parts.push(CY(0.5, 0.5, 0.7, 8, C.planeYellowDark).rotateZ(Math.PI / 2).translate(0.3, 0.55, 0));
    parts.push(CY(0.12, 0.12, 0.2, 6, C.iron).rotateZ(Math.PI / 2).translate(-0.12, 0.55, 0));
    for (const cx of [1.8, 2.7]) parts.push(B(0.7, 0.2, 0.6, C.iron).translate(cx, 0.98, 0));
    parts.push(B(1.0, 0.08, 0.9, C.tarp).translate(1.8, 1.05, 0));
    parts.push(B(1.3, 0.08, 7.2, C.planeGreen).translate(1.6, 1.65, 0));
    parts.push(B(1.3, 0.08, 3.6, C.planeGreen).translate(1.6, 0.35, 1.8));
    const brokenWing = B(1.3, 0.08, 3.4, C.planeGreen); brokenWing.translate(0, 0, -1.7); brokenWing.rotateX(-0.6); brokenWing.translate(1.6, 0.35, -0.2);
    parts.push(brokenWing);
    for (const [sx, sz] of [[1.1, 2.4], [2.1, 2.4], [1.1, -1.0], [2.1, -1.0]]) parts.push(CY(0.03, 0.03, 1.3, 5, C.iron).translate(sx!, 1.0, sz!));
    for (const sx of [1.0, 2.2]) parts.push(CY(0.04, 0.04, 1.3, 5, C.planeYellowDark).translate(sx, 1.0, 0.4));
    parts.push(B(0.8, 0.06, 2.2, C.planeGreen).translate(len - 0.5, 0.75, 0));
    parts.push(B(0.08, 0.9, 0.08, C.planeFin).translate(len - 0.6, 1.2, 0));
    parts.push(B(0.5, 0.8, 0.06, C.planeRudder).translate(len - 0.2, 1.15, 0));
    parts.push(CY(0.3, 0.3, 0.12, 8, C.iron).rotateX(Math.PI / 2).translate(1.2, 0.3, 0.7));
    parts.push(CY(0.3, 0.3, 0.12, 8, C.iron).rotateX(Math.PI / 2).rotateZ(1.2).translate(1.4, 0.15, -0.6));
    const plane = mergeGeos(parts);
    plane.applyMatrix4(new THREE.Matrix4().compose(nose, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, pitch)), new THREE.Vector3(1, 1, 1)));
    opaque.push(plane);
    opaque.push(at(CY(0.2, 1.6, 0.7, 9, C.earth), 11.3, 0.4, 0, 0.3));
    fp(14.5, 0, 3.2); fp(11.5, 0.4, 2.0);
    for (let i = 0; i < 15; i++) {
      const x = 14 + r() * 20, z = (r() - 0.5) * 10;
      const g = B(0.2 + r() * 0.35, 0.05, 0.08 + r() * 0.1, C.debris[i % 3]!);
      opaque.push(at(g, x, z, r() * 6.28, 0.03));
    }
  }
  // 12 lean-to tarp and poles
  {
    const q = new THREE.BufferGeometry();
    const A = [12.8, groundY(12.8, -2.9) + 0.95, -2.9], Bp = [15.6, groundY(15.6, -3.1) + 0.95, -3.1], Cp = [15.4, groundY(15.4, -5.8) + 1.75, -5.8], D = [12.6, groundY(12.6, -5.6) + 1.75, -5.6];
    q.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...Bp, ...Cp, ...A, ...Cp, ...D], 3));
    cloth.push(colorize(q, C.canvasOld));
    opaque.push(at(CY(0.03, 0.04, 1.8, 6, C.bark), 12.6, -5.6, 0, 0.9));
    opaque.push(at(CY(0.03, 0.04, 1.8, 6, C.bark), 15.4, -5.8, 0, 0.9));
    fp(14, -4.5, 1.6);
  }
  // 13–14 crates
  const crate = (x: number, z: number, lidOff: boolean) => {
    const g = [B(0.7, 0.6, 0.7, C.crate).translate(0, 0.3, 0)];
    for (const y of [0.12, 0.48]) g.push(B(0.72, 0.06, 0.72, C.crateBand).translate(0, y, 0));
    g.push(B(0.1, 0.62, 0.72, C.crateStrap).translate(0, 0.31, 0), B(0.72, 0.62, 0.1, C.crateStrap).translate(0, 0.31, 0));
    if (lidOff) g.push(B(0.7, 0.04, 0.7, C.crate).translate(0.45, 0.4, 0.2).rotateZ(0.9));
    opaque.push(at(mergeGeos(g), x, z, r() * 0.6));
    fp(x, z, 0.5);
  };
  crate(13.5, -4.6, false); crate(2.9, -1.4, true);
  opaque.push(at(CY(0.06, 0.06, 0.1, 8, C.iron), 3.0, -1.5, 0, 0.65));
  opaque.push(at(B(0.3, 0.01, 0.22, C.cream), 2.8, -1.2, 0.4, 0.61));
  // 15 fruit basket, 16 kettle, 17 bucket
  {
    const g = [CY(0.23, 0.18, 0.18, 8, C.rope).translate(0, 0.09, 0)];
    for (let i = 0; i < 7; i++) g.push(colorize(new THREE.IcosahedronGeometry(0.05, 0), i < 4 ? C.apple : C.pear).translate((r() - 0.5) * 0.3, 0.2 + (i > 4 ? 0.06 : 0), (r() - 0.5) * 0.3));
    opaque.push(at(mergeGeos(g), -4.3, -1.0));
    fp(-4.3, -1.0, 0.35);
  }
  opaque.push(at(mergeGeos([CY(0.1, 0.12, 0.16, 8, C.iron).translate(0, 0.08, 0), B(0.12, 0.03, 0.03, C.iron).translate(0.13, 0.13, 0), colorize(new THREE.TorusGeometry(0.09, 0.01, 4, 8), C.iron).translate(0, 0.16, 0)]), 0.62, -0.58, 0, 0.16));
  opaque.push(at(mergeGeos([CY(0.16, 0.14, 0.3, 8, C.bark).translate(0, 0.15, 0), CY(0.165, 0.165, 0.03, 8, C.iron).translate(0, 0.26, 0), CY(0.165, 0.165, 0.03, 8, C.iron).translate(0, 0.06, 0), colorize(new THREE.CircleGeometry(0.15, 8), C.stream).rotateX(-Math.PI / 2).translate(0, 0.28, 0)]), -1.2, 4.6));
  fp(-1.2, 4.6, 0.3);
  // 18 woodpile, block and hatchet
  {
    const g: THREE.BufferGeometry[] = [];
    const rows = [[-0.3, -0.1, 0.1, 0.3], [-0.2, 0, 0.2], [-0.1, 0.1]];
    rows.forEach((row, ri) => row.forEach((z) => {
      g.push(CY(0.09, 0.09, 0.5, 6, C.bark).rotateZ(Math.PI / 2).translate(0, 0.09 + ri * 0.16, z));
      g.push(colorize(new THREE.CircleGeometry(0.085, 6), C.honey).rotateY(Math.PI / 2).translate(0.251, 0.09 + ri * 0.16, z));
      g.push(colorize(new THREE.CircleGeometry(0.085, 6), C.honey).rotateY(-Math.PI / 2).translate(-0.251, 0.09 + ri * 0.16, z));
    }));
    opaque.push(at(mergeGeos(g), -3.4, 1.6, 0.3));
    fp(-3.4, 1.6, 0.6);
    opaque.push(at(mergeGeos([CY(0.2, 0.22, 0.4, 8, C.bark).translate(0, 0.2, 0), colorize(new THREE.CircleGeometry(0.2, 8), C.honey).rotateX(-Math.PI / 2).translate(0, 0.405, 0), B(0.03, 0.5, 0.03, C.honey).rotateZ(0.5).translate(0.1, 0.62, 0), B(0.12, 0.1, 0.03, C.iron).translate(0.0, 0.46, 0)]), -4.2, 2.3));
    fp(-4.2, 2.3, 0.35);
  }
  // 19 rope coil, 20 suitcase, 21 boulders, 22 fallen log, 23 old stump
  opaque.push(at(colorize(new THREE.TorusGeometry(0.15, 0.05, 6, 12), C.rope).rotateX(-Math.PI / 2), 13.4, 2.6, 0, 0.42));
  opaque.push(at(mergeGeos([B(0.6, 0.2, 0.4, C.bark).translate(0, 0.1, 0), B(0.08, 0.22, 0.42, C.rope).translate(0.1, 0.1, 0)]), 11.2, -3.8, 0.4));
  fp(11.2, -3.8, 0.4);
  for (const [x, z, s] of [[-9.2, 3.0, 0.65], [-8.4, 4.1, 0.4]]) {
    const g = colorize(new THREE.IcosahedronGeometry(s, 1), C.stone);
    const p = g.getAttribute('position') as THREE.BufferAttribute, c = g.getAttribute('color') as THREE.BufferAttribute;
    const moss = new THREE.Color(C.moss);
    // T-43: one scale per unique position, not per index, or the shared corners part and the
    // boulder shows daylight through its seams. `displace` recomputes the flat normals.
    displace(g, r, { x: [0.85, 1.15], y: [0.7, 0.9], z: [0.85, 1.15] });
    const n = g.getAttribute('normal') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i += 3) if (n.getZ(i) < -0.25 && n.getY(i) > 0.15) for (let k = 0; k < 3; k++) c.setXYZ(i + k, moss.r, moss.g, moss.b);
    jitterColor(g, r, 0.05);
    opaque.push(at(g, x!, z!, 0, s! * 0.55));
    fp(x!, z!, s! + 0.2);
  }
  {
    const g = [CY(0.24, 0.26, 3.2, 7, C.bark).rotateZ(Math.PI / 2).translate(0, 0.25, 0)];
    g.push(colorize(new THREE.CircleGeometry(0.24, 7), C.honey).rotateY(Math.PI / 2).translate(1.601, 0.25, 0));
    g.push(B(1.2, 0.05, 0.3, C.moss).translate(-0.3, 0.49, 0.05));
    for (const mx of [-0.9, 0.2, 0.9]) g.push(CY(0.02, 0.025, 0.08, 5, C.mushroomStalk).translate(mx, 0.53, 0.1), colorize(new THREE.ConeGeometry(0.07, 0.06, 6), C.mushroom).translate(mx, 0.59, 0.1));
    opaque.push(at(mergeGeos(g), 7.5, 6.2, yaw(70)));
    fp(7.5, 6.2, 1.7);
  }
  opaque.push(at(mergeGeos([CY(0.33, 0.36, 0.5, 8, C.bark).translate(0, 0.25, 0), colorize(new THREE.CircleGeometry(0.33, 8), C.honey).rotateX(-Math.PI / 2).translate(0, 0.505, 0)]), -10, -1));
  fp(-10, -1, 0.5);
  // 26 glow mushrooms on the bank (emissive)
  for (const [x, z] of [[-9, 13.2], [-7.5, 12.9], [-3.5, 13.0], [-1.8, 13.4], [-10.5, 14.0], [-12, 15.5]]) {
    const s = 0.12 + r() * 0.08;
    opaque.push(at(CY(0.025, 0.03, s * 0.6, 5, C.mushroomStalk), x!, z!, 0, s * 0.3));
    glow.push(at(colorize(new THREE.ConeGeometry(s * 0.6, s * 0.5, 6), C.mushroomGlow, emis(C.mushroomGlow, LIGHT.glowCap)), x!, z!, 0, s * 0.75));
  }
  // stream rocks
  opaque.push(makeStreamRocks());

  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat);
  opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  const glowMesh = new THREE.Mesh(mergeGeos(glow), emissiveMat);
  glowMesh.layers.enable(11); glowMesh.receiveShadow = true;
  const clothMesh = new THREE.Mesh(mergeGeos(cloth), clothMat);
  clothMesh.castShadow = true;
  group.add(opaqueMesh, glowMesh, clothMesh);

  // lanterns: L1 on the post, L2 in the tent from the ridge, L3 on the wreck strut
  const lanterns: THREE.Group[] = [], lanternLights: THREE.PointLight[] = [];
  for (const [x, y, z] of [[2.85, 2.0, 2.2], [-5.6, 1.45 + 0.4, -2.6], [15.2, 1.8, -1.6]]) {
    const l = lantern();
    l.pivot.position.set(x!, groundY(x!, z!) + y!, z);
    group.add(l.pivot);
    lanterns.push(l.pivot); lanternLights.push(l.light);
  }
  const fireLight = new THREE.PointLight(LIGHT.campfire.color, LIGHT.campfire.intensity, LIGHT.campfire.range, LIGHT.campfire.decay);
  fireLight.position.set(0, 0.7, 0);
  group.add(fireLight);
  return { group, lanterns, footprints, fireLight, lanternLights };
}
