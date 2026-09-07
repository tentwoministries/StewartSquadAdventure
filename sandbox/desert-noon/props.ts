// Desert props: Sol's shade (the striped awning between two palms, the rug, the water jar, the
// tray of dates, a hanging lantern) with Dunewalker Sol pacing his 4 m line; the Nomad's camp (a
// low dark tent, the cook fire, pots, the tether post) and a waypoint cairn with its flag; the
// hard-pan strip with the Green Meanie parked, fuel drums and a windsock; the Sunken Pyramid's
// tip with its glyph band; bleached bones; the hot rock; the spring shelf feeding the oasis.
import * as THREE from 'three';
import { DESERT as D } from '../_shared/biomes';
import { makeLantern, type Lantern } from '../_shared/lantern';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePlane } from '../_shared/plane';
import { BLOOM_LAYER } from '../_shared/post';
import { deg, rng } from '../_shared/rng';
import { C, type Keyframe } from '../_shared/style';
import type { Circle } from '../_shared/walk';
import { groundY, NOMAD, PYRAMID, SHADE } from './terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const yaw = (bearing: number) => deg(90 - bearing);

export interface Props {
  group: THREE.Group; footprints: Circle[]; lanterns: Lantern[]; fireLight: THREE.PointLight;
  update: (t: number, dt: number, kf: Keyframe) => void;
  sol: THREE.Group; hotRock: THREE.Vector3;
}

export function makeProps(): Props {
  const r = rng(77);
  const group = new THREE.Group();
  const worldMat = makeWorldMaterial();
  const clothMat = makeWorldMaterial({ side: THREE.DoubleSide, roughness: 1 });
  const swayCloth = makeWorldMaterial({ side: THREE.DoubleSide, roughness: 1, sway: 0.08 });
  const opaque: THREE.BufferGeometry[] = [], cloth: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const at = (g: THREE.BufferGeometry, x: number, z: number, ry = 0, dy = 0) => xf(g, x, groundY(x, z) + dy, z, ry);
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });
  const lanterns: Lantern[] = [];

  // ---- Sol's shade ----------------------------------------------------------------------------
  {
    const sx = SHADE.x, sz = SHADE.z, ry = yaw(20);
    const poles: [number, number][] = [[-2.6, -2.2], [2.6, -2.2], [-2.6, 2.2], [2.6, 2.2]];
    for (const [px, pz] of poles) opaque.push(xf(CY(0.05, 0.06, 2.6, 6, D.palmTrunk).translate(px, 1.3, pz), sx, groundY(sx, sz), sz, ry));
    // the awning: 6 stripes, sagging in the middle
    for (let i = 0; i < 6; i++) {
      const g = colorize(new THREE.PlaneGeometry(0.95, 4.6, 1, 4), i % 2 ? D.awningB : D.awningA);
      const p = g.getAttribute('position') as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) { const v = p.getY(k) / 4.6; p.setZ(k, -0.28 * (1 - 4 * v * v)); }
      g.rotateX(-Math.PI / 2); g.translate(-2.4 + i * 0.95 + 0.02, 2.6, 0);
      cloth.push(xf(g, sx, groundY(sx, sz), sz, ry));
    }
    // frame rails
    opaque.push(xf(B(5.4, 0.05, 0.05, D.palmTrunk).translate(0, 2.6, -2.2), sx, groundY(sx, sz), sz, ry));
    opaque.push(xf(B(5.4, 0.05, 0.05, D.palmTrunk).translate(0, 2.6, 2.2), sx, groundY(sx, sz), sz, ry));
    // rug (striped), cushions, the water jar, the brass tray with dates, a tea pot
    const rug = [B(2.6, 0.03, 1.8, '#8A3A3A').translate(0, 0.015, 0)];
    for (const k of [-0.6, -0.2, 0.2, 0.6]) rug.push(B(2.62, 0.032, 0.12, k === 0.2 ? D.ochreLight : '#4A2C6B').translate(0, 0.016, k));
    opaque.push(at(mergeGeos(rug), sx - 0.3, sz + 0.2, ry, 0.02));
    for (const [cx, cz, hex] of [[-1.1, 0.5, '#4A2C6B'], [1.0, -0.4, D.awningA], [0.6, 0.7, D.ochreLight]] as [number, number, string][]) {
      const g = colorize(new THREE.IcosahedronGeometry(0.32, 1), hex); g.scale(1.2, 0.55, 1.2);
      opaque.push(at(g, sx + cx, sz + cz, r() * 3, 0.16));
    }
    opaque.push(at(mergeGeos([CY(0.22, 0.16, 0.5, 8, '#A8542A').translate(0, 0.25, 0), CY(0.14, 0.2, 0.15, 8, '#8A3A1A').translate(0, 0.55, 0), CY(0.17, 0.17, 0.03, 8, '#6A2A10').translate(0, 0.35, 0)]), sx + 2.0, sz + 1.5, 0, 0.03));
    fp(sx + 2.0, sz + 1.5, 0.3);
    const tray = [CY(0.32, 0.3, 0.03, 10, '#C8A048').translate(0, 0.015, 0)];
    for (let i = 0; i < 9; i++) tray.push(colorize(new THREE.IcosahedronGeometry(0.045, 0), D.dateFruit).translate((r() - 0.5) * 0.36, 0.06, (r() - 0.5) * 0.36));
    tray.push(CY(0.09, 0.11, 0.16, 8, '#C8A048').translate(0.5, 0.08, 0.1), CY(0.03, 0.03, 0.12, 5, '#C8A048').rotateZ(0.8).translate(0.62, 0.14, 0.1));
    opaque.push(at(mergeGeos(tray), sx - 0.4, sz - 0.6, 0.3, 0.04));
    // the lantern on the rear rail
    const l = makeLantern(D.lantern, 14, 6, 3.0, C.iron, 1, true);
    const lx = sx + Math.cos(ry) * 1.6 + Math.sin(ry) * 2.15, lz = sz - Math.sin(ry) * 1.6 + Math.cos(ry) * 2.15;
    l.pivot.position.set(lx, groundY(sx, sz) + 2.58, lz);
    group.add(l.pivot); lanterns.push(l);
    fp(sx - 2.6, sz - 2.2, 0.2); fp(sx + 2.6, sz - 2.2, 0.2); fp(sx - 2.6, sz + 2.2, 0.2); fp(sx + 2.6, sz + 2.2, 0.2);
  }
  // ---- Dunewalker Sol: a pale line under a flat disc that never stops walking ------------------
  const sol = new THREE.Group();
  {
    const body = new THREE.Mesh(mergeGeos([
      xf(CY(0.16, 0.2, 1.35, 6, D.bone), 0, 0.95), xf(B(0.12, 0.9, 0.36, D.duskViolet), 0.08, 1.05, 0, 0, 0, 0.35),
      xf(colorize(new THREE.SphereGeometry(0.16, 7, 5), '#C8926A'), 0, 1.8), xf(CY(0.5, 0.5, 0.04, 9, D.bone), 0, 1.98), xf(CY(0.17, 0.19, 0.12, 9, D.rockDark), 0, 2.02),
      xf(CY(0.04, 0.05, 0.6, 5, D.bone), -0.2, 1.25, 0, 0, 0, 0.2), xf(CY(0.04, 0.05, 0.6, 5, D.bone), 0.2, 1.25, 0.06, 0, 0, -0.2),
      xf(CY(0.06, 0.05, 0.3, 5, D.bone), -0.08, 0.15), xf(CY(0.06, 0.05, 0.3, 5, D.bone), 0.08, 0.15),
    ]), worldMat);
    body.castShadow = true;
    const staff = new THREE.Mesh(mergeGeos([xf(CY(0.025, 0.03, 2.0, 5, D.palmTrunk), 0, 1.0), xf(colorize(new THREE.IcosahedronGeometry(0.11, 1), '#B08A48'), 0, 1.55, 0.06)]), worldMat);
    staff.position.set(0.32, 0, 0.1); staff.castShadow = true;
    const strip = colorize(new THREE.PlaneGeometry(0.1, 0.8, 1, 3), D.oasis); strip.translate(0, 0.4, 0);
    const streamer = new THREE.Mesh(strip, swayCloth); streamer.position.set(0.32, 1.85, 0.1); streamer.rotation.x = 1.3;
    sol.add(body, staff, streamer);
    sol.position.set(SHADE.x + 3.4, groundY(SHADE.x + 3.4, SHADE.z + 2.6), SHADE.z + 2.6);
    group.add(sol);
  }
  // ---- the Nomad's camp ------------------------------------------------------------------------
  {
    const nx = NOMAD.x, nz = NOMAD.z, ry = yaw(300), ny = groundY(nx, nz);
    // a low, wide goat-hair tent: two dark panels on a ridge, striped
    const L = 4.6, W = 2.4, H = 1.7;
    for (const side of [1, -1]) {
      const g = new THREE.BufferGeometry();
      const v = side > 0
        ? [-L / 2, 0, W, L / 2, 0, W, L / 2, H, 0, -L / 2, 0, W, L / 2, H, 0, -L / 2, H, 0]
        : [-L / 2, 0, -W, L / 2, H, 0, L / 2, 0, -W, -L / 2, 0, -W, -L / 2, H, 0, L / 2, H, 0];
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      cloth.push(xf(colorize(g, '#3E3024'), nx, ny, nz, ry));
    }
    for (const k of [-1.4, -0.2, 1.0]) cloth.push(xf(B(0.5, 0.01, W * 2.05, '#4A3524').rotateX(0).translate(k, 0.02, 0), nx, ny + H * 0.001, nz, ry));
    opaque.push(xf(B(L + 0.2, 0.06, 0.06, D.palmTrunk).translate(0, H, 0), nx, ny, nz, ry));
    for (const s of [-1, 1]) opaque.push(xf(CY(0.04, 0.05, H, 5, D.palmTrunk).translate(s * L / 2, H / 2, 0), nx, ny, nz, ry));
    fp(nx, nz, 3.0);
    // the cook fire: stones, a tripod, a pot; embers by day, flames at dusk
    const fx = nx - 3.6, fz = nz + 2.4, fy = groundY(fx, fz);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; const g = colorize(new THREE.IcosahedronGeometry(0.12, 0), i % 2 ? D.rockRed : D.rockDark); g.scale(1.3, 0.8, 1.1); opaque.push(xf(g, fx + Math.cos(a) * 0.55, fy + 0.06, fz + Math.sin(a) * 0.55, r() * 6)); }
    for (let i = 0; i < 3; i++) { const a = i * 2.094; opaque.push(xf(CY(0.02, 0.025, 1.4, 4, D.palmTrunk), fx + Math.cos(a) * 0.4, fy + 0.65, fz + Math.sin(a) * 0.4, 0, Math.sin(a) * 0.3, -Math.cos(a) * 0.3)); }
    opaque.push(xf(mergeGeos([CY(0.16, 0.12, 0.22, 8, C.iron).translate(0, 0, 0), colorize(new THREE.TorusGeometry(0.12, 0.012, 4, 8), C.iron).translate(0, 0.12, 0)]), fx, fy + 0.7, fz));
    fp(fx, fz, 0.7);
    // pots, a rug, the tether post
    opaque.push(at(mergeGeos([CY(0.2, 0.14, 0.4, 7, '#A8542A').translate(0, 0.2, 0), CY(0.16, 0.12, 0.34, 7, '#B8643A').translate(0.35, 0.17, 0.1), CY(0.12, 0.1, 0.26, 7, '#8A3A1A').translate(0.1, 0.13, 0.4)]), nx + 1.5, nz + 3.2, 0.2, 0.02));
    fp(nx + 1.5, nz + 3.2, 0.5);
    opaque.push(at(B(2.0, 0.03, 1.4, '#6A3A5A').translate(0, 0.015, 0), nx - 0.8, nz + 3.0, ry + 0.2, 0.02));
    opaque.push(at(CY(0.06, 0.07, 1.1, 5, D.palmTrunk).translate(0, 0.55, 0), nx + 4.5, nz + 1.2, 0, 0));
    fp(nx + 4.5, nz + 1.2, 0.2);
    // the waypoint cairn with its flag (desert_2)
    const cx = 35, cz = -23, cy = groundY(cx, cz);
    const stones: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) { const s = 0.5 - i * 0.06; const g = colorize(new THREE.IcosahedronGeometry(s, 0), i % 2 ? D.rockRed : D.sienna); g.scale(1.3, 0.55, 1.1); g.rotateY(r() * 6); g.translate((r() - 0.5) * 0.1, 0.15 + i * 0.28, (r() - 0.5) * 0.1); stones.push(g); }
    stones.push(CY(0.025, 0.03, 2.4, 5, D.palmTrunk).translate(0, 2.4, 0));
    opaque.push(xf(mergeGeos(stones), cx, cy, cz));
    const flag = colorize(new THREE.PlaneGeometry(0.7, 0.4, 3, 1), D.flag); flag.translate(0.35, 0, 0);
    const flagMesh = new THREE.Mesh(flag, swayCloth); flagMesh.position.set(cx, cy + 3.35, cz); group.add(flagMesh);
    fp(cx, cz, 0.6);
  }
  // ---- the strip: the Green Meanie parked, fuel drums, the windsock -----------------------------
  const plane = makePlane(14, groundY(14, 24) + 0.05, 24, 280, worldMat);
  group.add(plane.group); footprints.push(...plane.footprint);
  for (const [dx, dz, hex] of [[6.5, 27.2, D.awningA], [7.4, 27.4, D.bone], [7.0, 26.4, D.awningA]] as [number, number, string][]) { opaque.push(at(CY(0.32, 0.32, 0.9, 9, hex).translate(0, 0.45, 0), dx, dz, 0)); }
  fp(7, 27, 1.0);
  opaque.push(at(CY(0.04, 0.05, 4.0, 5, C.iron).translate(0, 2.0, 0), -20, 19.2));
  const sock = colorize(new THREE.CylinderGeometry(0.12, 0.34, 1.8, 7, 3, true), D.awningA);
  sock.rotateZ(-Math.PI / 2); sock.translate(0.9, 0, 0);
  const sockMesh = new THREE.Mesh(sock, clothMat); sockMesh.position.set(-20, groundY(-20, 19.2) + 3.9, 19.2); sockMesh.castShadow = true; group.add(sockMesh);
  fp(-20, 19.2, 0.2);
  // ---- the Sunken Pyramid's tip ----------------------------------------------------------------
  {
    const py = groundY(PYRAMID.x, PYRAMID.z);
    const pyr = colorize(new THREE.ConeGeometry(10, 10, 4), D.pyramid);
    pyr.rotateY(Math.PI / 4); pyr.translate(0, 5 - 3.2, 0);
    // the glyph band sits on the faces (a frustum matched to the cone's slope), glyphs on the four faces, the door on the south face
    const faceDist = (y: number) => 0.707 * 10 * (1 - (y + 3.2) / 10);
    const band = colorize(new THREE.CylinderGeometry(10 * (1 - 7.05 / 10) * 1.03, 10 * (1 - 6.15 / 10) * 1.03, 0.9, 4, 1, true), D.pyramidDark); band.rotateY(Math.PI / 4); band.translate(0, 3.4, 0);
    const glyphs: THREE.BufferGeometry[] = [];
    for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
      for (const off of [-1.4, 0, 1.4]) {
        const dist = faceDist(3.4) + 0.06;
        glyphs.push(xf(colorize(new THREE.BoxGeometry(0.42, 0.42, 0.08), D.glyph, { color: new THREE.Color(D.glyph).multiplyScalar(0.9).getStyle(), glow: 1 }), fx * dist - fz * off, 3.4, fz * dist + fx * off, fx !== 0 ? Math.PI / 2 : 0));
      }
    }
    const door = colorize(new THREE.ConeGeometry(0.8, 1.2, 3), D.rockDark); door.rotateY(Math.PI); door.translate(0, 5.0, faceDist(5.0) + 0.1);
    const body = mergeGeos([pyr, band, door]); jitterColor(body, r, 0.03);
    const mesh = new THREE.Mesh(body, worldMat); mesh.position.set(PYRAMID.x, py, PYRAMID.z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    const glyphMesh = new THREE.Mesh(mergeGeos(glyphs), makeWorldMaterial({ emissive: true })); glyphMesh.position.copy(mesh.position); glyphMesh.layers.enable(BLOOM_LAYER); group.add(glyphMesh);
    fp(PYRAMID.x, PYRAMID.z, 8);
  }
  // ---- bones, the hot rock, the spring shelf -----------------------------------------------------
  {
    const ribs: THREE.BufferGeometry[] = [CY(0.08, 0.1, 3.2, 6, D.bone).rotateZ(Math.PI / 2).translate(0, 0.25, 0)];
    for (let i = 0; i < 6; i++) ribs.push(colorize(new THREE.TorusGeometry(0.55 + i * 0.05, 0.035, 4, 10, Math.PI), D.bone).rotateY(Math.PI / 2).translate(-1.2 + i * 0.45, 0.25, 0));
    ribs.push(colorize(new THREE.SphereGeometry(0.34, 7, 5), D.bone).translate(2.0, 0.35, 0), B(0.3, 0.14, 0.34, D.bone).translate(2.2, 0.16, 0));
    opaque.push(at(mergeGeos(ribs), -20, 14, yaw(120), 0));
    fp(-20, 14, 1.8);
    const hot = colorize(new THREE.IcosahedronGeometry(0.75, 1), D.sienna); hot.scale(1.4, 0.5, 1.1); jitterColor(hot, r, 0.06);
    opaque.push(at(hot, 6.5, -2.0, 0.4, 0.2)); fp(6.5, -2.0, 1.0);
    const shelf = mergeGeos([colorize(new THREE.IcosahedronGeometry(1.0, 1), D.sienna).translate(0, 0.1, 0), colorize(new THREE.IcosahedronGeometry(0.7, 1), D.rockDark).translate(0.6, 0.75, -0.3)]);
    jitterColor(shelf, r, 0.06);
    opaque.push(at(shelf, -3.6, -0.6, 0, -0.35)); fp(-3.6, -0.6, 1.2);
  }
  const trickle = new THREE.Mesh(mergeGeos([B(0.16, 0.9, 0.06, '#E8F6F0').translate(0, 0.45, 0), B(0.3, 0.05, 0.3, '#E8F6F0').translate(0, 0.0, 0.1)]), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 }));
  trickle.position.set(-3.6, groundY(-3.6, 0.2) + 0.1, 0.35); group.add(trickle);

  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat); opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  const clothMesh = new THREE.Mesh(mergeGeos(cloth), clothMat); clothMesh.castShadow = true; clothMesh.receiveShadow = true;
  group.add(opaqueMesh, clothMesh);
  const fireLight = new THREE.PointLight(C.campfire, 40, 7, 2);
  fireLight.position.set(NOMAD.x - 3.6, groundY(NOMAD.x - 3.6, NOMAD.z + 2.4) + 0.6, NOMAD.z + 2.4);
  group.add(fireLight);

  // Sol paces a 4 m line at 0.5 m/s, easing into each turn
  const solLine: [number, number, number, number] = [SHADE.x + 3.4, SHADE.z + 2.6, SHADE.x + 3.4 + 3.6, SHADE.z + 2.6 + 1.6];
  let solHeading = 0;
  const update = (t: number, dt: number, kf: Keyframe) => {
    plane.update(t);
    sockMesh.rotation.z = -0.15 + 0.1 * Math.sin(t * 1.7) + 0.05 * Math.sin(t * 4.3); sockMesh.rotation.y = 0.12 * Math.sin(t * 0.9);
    const u = 0.5 + 0.5 * Math.sin(t * 0.39);
    const eased = u * u * (3 - 2 * u);
    const nx = solLine[0] + (solLine[2] - solLine[0]) * eased, nz = solLine[1] + (solLine[3] - solLine[1]) * eased;
    const dir = Math.cos(t * 0.39) >= 0 ? 1 : -1;
    const want = Math.atan2((solLine[2] - solLine[0]) * dir, (solLine[3] - solLine[1]) * dir);
    let diff = want - solHeading; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); solHeading += diff * Math.min(1, dt * 3);
    sol.position.set(nx, groundY(nx, nz), nz); sol.rotation.y = solHeading;
    sol.position.y += 0.03 * Math.abs(Math.sin(t * 4.2));
    for (const l of lanterns) l.update(t, dt, kf.lantern);
    fireLight.intensity = 40 * kf.fire * (0.8 + 0.2 * Math.sin(t * 9.1));
    trickle.position.y = groundY(-3.6, 0.2) + 0.1 + 0.02 * Math.sin(t * 7);
  };
  return { group, footprints, lanterns, fireLight, update, sol, hotRock: new THREE.Vector3(6.5, groundY(6.5, -2.0) + 0.58, -2.0) };
}
