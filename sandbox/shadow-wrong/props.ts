// Home, Wrong: Stewart Camp at C6, mirrored and wrong (story-beats.md §2.2, camp.md §2.8).
// The camp's own geometry is imported from the Forest scene and pushed through `voidify` — every
// warm colour drained to void violet and ash, every emissive killed — and then the wrong things
// are added on top: the cold mirror-fire (camp.md §2.7.6), the cabin grown into the citadel with
// ember windows, the shadow squad's four empty seats, the torn tent, the empty washing line, the
// upside-down crest, the swing that swings by itself, the stream climbing its own step, and the
// one warm light left in the world, the real camp fire seen through the void below the south rim.
import * as THREE from 'three';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePoints, softDisc } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { deg, rng } from '../_shared/rng';
import { UNITS } from '../_shared/style';

import type { Circle } from '../_shared/walk';
import { groundY } from '../forest-dusk/terrain';
import { VOID } from './sky';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

/** The swing's amplitude (±25°) and the climb's face normal, read by the per-frame update. */
const SWING_A = deg(25);
const CLIMB_NRM = { x: -0.949, y: 0.316 };
const LEDGE_RY = -1.249;

/** Everything warm at home is cold here: drain a mesh tree to the void palette, kill its glow. */
export function voidify(root: THREE.Object3D): void {
  const ash = new THREE.Color(VOID.ash), deep = new THREE.Color('#31204E');
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    const col = m.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (col) {
      for (let i = 0; i < col.count; i++) {
        const r = col.getX(i), g = col.getY(i), b = col.getZ(i);
        const lum = 0.3 * r + 0.59 * g + 0.11 * b;
        // toward ash by luminance, then pushed into the void's violet; nothing keeps its hue
        const k = 0.66 + 0.34 * lum; // a floor: nothing in the shard is #000 (the anti-palette's row 4)
        const c = new THREE.Color(ash.r * k, ash.g * k, ash.b * k).lerp(deep, 0.20).multiplyScalar(1.0 + lum * 0.3);
        col.setXYZ(i, c.r, c.g, c.b);
      }
      col.needsUpdate = true;
    }
    const em = m.geometry.getAttribute('aEmissive') as THREE.BufferAttribute | undefined;
    if (em) { for (let i = 0; i < em.count; i++) em.setXYZ(i, 0, 0, 0); em.needsUpdate = true; }
  });
}

/**
 * Clear a station's line of sight through imported instanced geometry, by zeroing the matrices of
 * the instances inside a corridor. The camp's trees are the Forest scene's and cannot be moved, but
 * a station whose subject is 250 m away through the void cannot have a pine in the way either
 * (LESSONS.md: after placing a landmark, look through every station that faces it).
 */
export function clearSight(root: THREE.Object3D, from: THREE.Vector2, bearing: number, halfWidth: number, length: number): number {
  const dx = Math.sin((bearing * Math.PI) / 180), dz = -Math.cos((bearing * Math.PI) / 180);
  const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let cleared = 0;
  root.traverse((o) => {
    const im = o as THREE.InstancedMesh;
    if (!im.isInstancedMesh) return;
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, m);
      m.decompose(pos, q, sc);
      const ax = pos.x - from.x, az = pos.z - from.y;
      const along = ax * dx + az * dz;
      if (along < -2 || along > length) continue;
      if (Math.abs(ax * dz - az * dx) > halfWidth) continue;
      im.setMatrixAt(i, m.makeScale(0, 0, 0));
      cleared++;
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return cleared;
}

export interface Props {
  group: THREE.Group;
  footprints: Circle[];
  /** The far warm light: the real camp fire, below the south rim at −37°. */
  farFire: THREE.Vector3;
  fireSeat: THREE.Vector3;
  /** The swing's seat in world space, for the stepped pair that proves it moves. */
  seatWorld: (out: THREE.Vector3) => THREE.Vector3;
  update: (t: number, dt: number, breathe: number, hero: THREE.Vector3) => void;
  hud: () => string;
}

/**
 * Zero the matrices of imported instances inside a radius: a station's camera may not have a tree
 * standing on it (`LESSONS.md` Camera row 4; `shadow-wrong-s4-01` had a lollipop pine on the lens).
 * Scene-local, on the *instances* — the Forest scene itself is never touched.
 */
export function clearNear(root: THREE.Object3D, x: number, z: number, radius: number): number {
  const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let cleared = 0;
  root.traverse((o) => {
    const im = o as THREE.InstancedMesh;
    if (!im.isInstancedMesh) return;
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, m);
      m.decompose(pos, q, sc);
      if (Math.hypot(pos.x - x, pos.z - z) > radius) continue;
      im.setMatrixAt(i, m.makeScale(0, 0, 0));
      cleared++;
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return cleared;
}

/**
 * Thin the imported ground scatter to about `keep` of its instances, in clusters, and clear it out
 * of the fire's pool (T-09: the confetti was re-made by recolouring the Forest's tufts without
 * thinning them). Cell-hashed so what survives stays clustered rather than evenly sparse; the
 * survivors are also lifted a step toward the ground's violet so they read as grass, not thorns.
 * Returns [before, after].
 */
export function thinScatter(root: THREE.Object3D, keep: number, poolAt: { x: number; z: number; r: number }): [number, number] {
  const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const rr = rng(917);
  const cellKeep = new Map<string, boolean>();
  // the instance colour is a tint *multiplier* on the vertex colour, so a step toward the ground's
  // own violet is a gain above 1 on r and b, not a lerp toward a violet (which would darken it)
  const lift = new THREE.Color(1.20, 1.06, 1.34);
  const col = new THREE.Color();
  let before = 0, after = 0;
  root.traverse((o) => {
    const im = o as THREE.InstancedMesh;
    if (!im.isInstancedMesh) return;
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, m);
      m.decompose(pos, q, sc);
      if (sc.x === 0) continue;
      before++;
      const key = `${Math.floor(pos.x / 2.5)},${Math.floor(pos.z / 2.5)}`;
      let cell = cellKeep.get(key);
      // the two tests are each about √keep, so together they keep `keep` of the tufts and the
      // survivors sit in clumps instead of being evenly sparse
      if (cell === undefined) { cell = rr() < Math.sqrt(keep) * 1.05; cellKeep.set(key, cell); }
      const inPool = Math.hypot(pos.x - poolAt.x, pos.z - poolAt.z) < poolAt.r;
      // and harder the further out: at 25 m and past it a tuft is one dark pixel, which is the
      // speckle the art-director reads as confetti
      const far = 1 - 0.55 * THREE.MathUtils.smoothstep(Math.hypot(pos.x, pos.z), 16, 34);
      if (inPool || !cell || rr() > Math.sqrt(keep) * 0.95 * far) { im.setMatrixAt(i, m.makeScale(0, 0, 0)); continue; }
      after++;
      if (im.instanceColor) {
        col.fromArray(im.instanceColor.array, i * 3).multiply(lift);
        im.setColorAt(i, col);
      }
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return [before, after];
}

export function makeProps(): Props {
  const r = rng(191);
  const group = new THREE.Group();
  const worldMat = makeWorldMaterial({ roughness: 1 });
  const glowMat = makeWorldMaterial({ emissive: true, roughness: 0.6 });
  const clothMat = makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide });
  const opaque: THREE.BufferGeometry[] = [], glow: THREE.BufferGeometry[] = [], cloth: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });
  const at = (g: THREE.BufferGeometry, x: number, z: number, ry = 0, dy = 0) => xf(g, x, groundY(x, z) + dy, z, ry);

  // ---- the cold mirror-fire (camp.md §2.7.6) ------------------------------------------------------
  // the same ring and logs; the logs charcoal with rift seams; three tongues hanging *down* into the
  // ring like a drain; the shared oscillator at half rate; embers fall; the smoke sinks and pools
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, s = 0.11 + r() * 0.04;
    opaque.push(at(colorize(new THREE.IcosahedronGeometry(s, 0), i % 2 ? '#3A3640' : '#2A2632'), Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0, s * 0.55));
  }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    opaque.push(at(CY(0.07, 0.09, 0.6, 6, VOID.charcoal).rotateZ(Math.PI / 2).rotateY(a), Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0, 0.09));
    glow.push(at(colorize(new THREE.BoxGeometry(0.5, 0.012, 0.03), VOID.rift, emis(VOID.rift, 1.4)).rotateY(a), Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0, 0.155));
  }
  // the Forest's two-cone tongue recipe (`forest-dusk/fx.ts`), in rift cyan and pale rift and hung
  // upside down: `shadow-wrong-s1-01` read the void-coloured cones as a black crystal on a ring
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.05, 1.05, 1.05) });
  const tongues: THREE.Mesh[] = [];
  for (const [h, w, x, z] of [[0.72, 0.13, 0, 0], [0.5, 0.10, 0.19, -0.14], [0.4, 0.085, -0.17, 0.16]] as [number, number, number, number][]) {
    const g = mergeGeos([
      xf(colorize(new THREE.ConeGeometry(w, h, 6), VOID.riftMid).rotateX(Math.PI), 0, -h / 2),
      xf(colorize(new THREE.ConeGeometry(w * 0.52, h * 0.62, 6), VOID.riftPale).rotateX(Math.PI), 0, -h * 0.22, 0.02),
    ]);
    const m = new THREE.Mesh(g, flameMat); m.layers.enable(BLOOM_LAYER);
    m.position.set(x, groundY(x, z) + 0.74, z); // the tongues hang down into the ring, tips in the ashes
    group.add(m); tongues.push(m);
  }
  // the pool: decay 2 with a cutoff well past the lit radius, so the falloff is a feather and not
  // the hard 14 m disc of `shadow-wrong-s1-01`; the colour is cyan-over-violet, never grey
  const fireLight = new THREE.PointLight(VOID.cyanLight, 20, 13, 2);
  fireLight.position.set(0, 0.55, 0);
  group.add(fireLight);
  const fall = makePoints(40, VOID.rift, 5, 2.0);
  group.add(fall.pts);
  const fallSeed = Array.from({ length: 40 }, () => ({ b: -r() * 4, a: r() * 6.28, d: 0.15 + r() * 0.5 }));
  // the smoke sinks and pools as a 0.3 m cyan mist disc r 3.4 m, feathered by the soft disc so the
  // mist has no rim of its own (the art-director's change 1: feather the rim)
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.4, 22), new THREE.MeshBasicMaterial({ map: softDisc(), color: new THREE.Color(VOID.rift).multiplyScalar(0.5), transparent: true, opacity: 0.13, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.3; pool.layers.enable(BLOOM_LAYER);
  group.add(pool);
  fp(0, 0, 1.4);

  // ---- the shadow squad's four seats, and Ed's stump is already there and empty ------------------
  const seatAt: [number, number, number][] = [[-1.85, 1.5, 70], [-1.1, -1.9, 20], [1.5, 1.75, 250], [2.15, -1.6, 300]];
  for (const [x, z, b] of seatAt) {
    opaque.push(at(mergeGeos([
      CY(0.26, 0.30, 0.42, 7, VOID.charcoal).translate(0, 0.21, 0),
      colorize(new THREE.CylinderGeometry(0.27, 0.27, 0.04, 7), '#3A3640').translate(0, 0.44, 0),
    ]), x, z, deg(b)));
    fp(x, z, 0.4);
  }

  // ---- the cabin, grown into the citadel (camp.md §2.8: the footprint kept, the walls three times
  // taller, roof #1C1A22, windows ember #FF6A2A, the porch shelf empty) --------------------------
  {
    const cx = -8, cz = -11.5, ry = deg(180 - 145), cy = groundY(cx, cz); // the porch faces the fire (bearing 145)
    const w = 5.6, dpt = 4.4, wallH = 5.0;
    const parts: THREE.BufferGeometry[] = [
      B(w, wallH, dpt, '#2A2436').translate(0, wallH / 2, 0),
      B(w + 0.5, 0.35, dpt + 0.5, '#1E1A2A').translate(0, 0.18, 0),
    ];
    // the roof: two pitched slabs, rotated about their own centres and then moved (LESSONS.md)
    const th = 0.72, half = 2.0;
    for (const s of [-1, 1]) {
      parts.push(B(w + 1.0, 0.22, half * 2, VOID.cabinRoof).applyMatrix4(new THREE.Matrix4().makeRotationX(-s * th)).translate(0, wallH + half * Math.sin(th), s * half * Math.cos(th)));
    }
    parts.push(B(0.9, 2.4, 0.9, '#231F2E').translate(1.7, wallH + 2.2, -1.0));
    // the door: the Citadel Warden's post, a black slot
    parts.push(B(1.3, 2.6, 0.12, '#0C0812').translate(-0.6, 1.3, dpt / 2 + 0.06));
    for (const [ox, oy] of [[-1.35, 1.3], [0.1, 1.3]] as [number, number][]) parts.push(B(0.1, 2.7, 0.14, '#1A1626').translate(ox, oy, dpt / 2 + 0.1));
    // the porch: posts and a roof, the shelf empty
    parts.push(B(w + 0.8, 0.14, 2.2, '#231F2E').translate(0, 0.1, dpt / 2 + 1.1));
    for (const ox of [-w / 2 - 0.2, w / 2 + 0.2]) parts.push(CY(0.11, 0.13, 2.9, 6, '#1E1A2A').translate(ox, 1.45, dpt / 2 + 1.9));
    parts.push(B(w + 1.0, 0.16, 2.4, VOID.cabinRoof).applyMatrix4(new THREE.Matrix4().makeRotationX(0.26)).translate(0, 3.05, dpt / 2 + 1.1));
    parts.push(B(2.0, 0.1, 0.4, '#231F2E').translate(1.6, 1.0, dpt / 2 + 0.28));
    const cabin = mergeGeos(parts); jitterColor(cabin, r, 0.05);
    opaque.push(xf(cabin, cx, cy, cz, ry));
    // four ember windows, two floors, and the frames
    for (const [ox, oy, oz, rot] of [[1.4, 1.6, dpt / 2 + 0.05, 0], [1.4, 3.6, dpt / 2 + 0.05, 0], [-1.8, 3.6, dpt / 2 + 0.05, 0], [w / 2 + 0.05, 2.6, -0.8, Math.PI / 2]] as [number, number, number, number][]) {
      const win = colorize(new THREE.BoxGeometry(1.1, 1.4, 0.08), VOID.ember, emis(VOID.ember, 1.8));
      win.rotateY(rot); win.translate(ox, oy, oz);
      glow.push(xf(win, cx, cy, cz, ry));
      const frame = mergeGeos([B(0.08, 1.34, 0.12, '#0E0A16'), B(1.04, 0.08, 0.12, '#0E0A16')]);
      frame.rotateY(rot); frame.translate(ox, oy, oz + (rot ? 0 : 0.03));
      opaque.push(xf(frame, cx, cy, cz, ry));
    }
    const cabinLight = new THREE.PointLight(VOID.ember, 40, 12, 2);
    cabinLight.position.set(cx + Math.sin(ry) * 3.2 + Math.cos(ry) * 1.4, cy + 2.0, cz + Math.cos(ry) * 3.2 - Math.sin(ry) * 1.4);
    const porchLight = new THREE.PointLight(VOID.ember, 20, 8, 2);
    porchLight.position.set(cx + Math.sin(ry) * 3.6, cy + 2.4, cz + Math.cos(ry) * 3.6);
    group.add(cabinLight, porchLight);
    fp(cx, cz, 4.6);
  }

  // ---- the torn tent: the Forest tent is imported whole, so the tear is added over it ------------
  let tornFlap: THREE.Mesh;
  {
    const tx = -6.0, tz = -3.0, ry = deg(135), ty = groundY(tx, tz);
    // a black slash through the near canvas and the flap that used to be the door, hanging
    const slash = mergeGeos([
      colorize(new THREE.PlaneGeometry(1.5, 1.1), '#08060E').rotateY(ry + 0.2).translate(0.35, 1.0, 0.55),
      colorize(new THREE.PlaneGeometry(0.9, 0.7), '#08060E').rotateY(ry + 0.2).translate(-0.75, 0.75, 0.15),
    ]);
    cloth.push(xf(slash, tx, ty, tz));
    const flap = colorize(new THREE.PlaneGeometry(0.55, 1.3, 1, 3), VOID.ash);
    flap.translate(0, -0.65, 0);
    const flapMesh = new THREE.Mesh(flap, clothMat);
    flapMesh.position.set(tx + 0.9, ty + 1.5, tz + 0.9); flapMesh.rotation.y = ry;
    group.add(flapMesh);
    tornFlap = flapMesh;
  }

  // ---- the washing line, empty; the crest upside down; the swing on the big pine ------------------
  {
    for (const [x, z] of [[-3.2, -6.4], [2.6, -7.6]] as [number, number][]) { opaque.push(at(CY(0.06, 0.08, 2.2, 5, '#1E1A2A'), x, z, 0, 1.1)); fp(x, z, 0.2); }
    const a = new THREE.Vector3(-3.2, groundY(-3.2, -6.4) + 2.0, -6.4), b = new THREE.Vector3(2.6, groundY(2.6, -7.6) + 2.0, -7.6);
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.35, 0));
    for (let i = 0; i < 8; i++) {
      const t0 = i / 8, t1 = (i + 1) / 8;
      const q = (t: number) => a.clone().lerp(mid, t).lerp(mid.clone().lerp(b, t), t);
      const p0 = q(t0), p1 = q(t1);
      const seg = colorize(new THREE.CylinderGeometry(0.015, 0.015, p0.distanceTo(p1) * 1.2, 4), '#3A3640');
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
      seg.applyMatrix4(new THREE.Matrix4().compose(p0.clone().lerp(p1, 0.5), qq, new THREE.Vector3(1, 1, 1)));
      opaque.push(seg);
      if (i % 2 === 0) opaque.push(xf(B(0.03, 0.11, 0.05, '#4A4452'), q(t0 + 0.06).x, q(t0 + 0.06).y - 0.05, q(t0 + 0.06).z)); // pegs, nothing on them
    }
    // the crest, hung upside down, the pole leaning 8°
    const px = 5.5, pz = -6.5;
    opaque.push(at(CY(0.07, 0.09, 3.2, 5, '#1E1A2A').rotateZ(deg(8)), px, pz, 0, 1.6));
    const crest = mergeGeos([
      colorize(new THREE.PlaneGeometry(1.2, 1.5), '#241436'),
      colorize(new THREE.PlaneGeometry(1.0, 0.06), VOID.ember).translate(0, 0.42, 0.01),
      colorize(new THREE.ConeGeometry(0.34, 0.5, 3), VOID.ember).rotateX(-Math.PI / 2).translate(0, -0.1, 0.02),
    ]);
    crest.rotateZ(Math.PI); crest.rotateY(deg(20)); // upside down
    cloth.push(at(crest, px + 0.4, pz + 0.2, 0, 2.3));
    fp(px, pz, 0.3);
  }
  // ---- eight wrong things for the empty quadrant behind the fire (the scores file's change 5:
  // "the upper-left is violet fog and tufts and nothing else"). Everything is where you left it,
  // and everything has been knocked over. ------------------------------------------------------
  {
    // 1 the toppled stool
    opaque.push(at(mergeGeos([
      CY(0.16, 0.19, 0.34, 7, VOID.charcoal).rotateZ(Math.PI / 2),
      colorize(new THREE.CylinderGeometry(0.20, 0.20, 0.035, 7), '#3A3640').rotateZ(Math.PI / 2).translate(0.19, 0, 0),
    ]), -4.2, -5.6, 0.9, 0.17)); fp(-4.2, -5.6, 0.3);
    // 2 the bedroll, half unrolled
    opaque.push(at(CY(0.15, 0.15, 0.62, 6, '#3E3450').rotateZ(Math.PI / 2), -7.6, -5.0, 2.1, 0.15));
    cloth.push(at(colorize(new THREE.PlaneGeometry(0.7, 1.25), '#463A5A').rotateX(-Math.PI / 2).rotateZ(2.1), -7.95, -5.55, 0, 0.03));
    fp(-7.7, -5.2, 0.4);
    // 3 the tipped bucket, and what ran out of it is cyan
    opaque.push(at(mergeGeos([
      CY(0.17, 0.13, 0.30, 8, '#2A2436').rotateZ(1.9),
      colorize(new THREE.TorusGeometry(0.155, 0.012, 4, 10), '#4A4452').rotateY(Math.PI / 2).rotateZ(1.9).translate(0.12, 0.02, 0),
    ]), -3.4, -2.2, 1.3, 0.15)); fp(-3.4, -2.2, 0.25);
    glow.push(at(colorize(new THREE.CircleGeometry(0.46, 12), VOID.rift, emis(VOID.rift, 0.5)).rotateX(-Math.PI / 2), -3.05, -2.55, 0, 0.02));
    // 4 the plate stack, cracked over
    for (let i = 0; i < 4; i++) opaque.push(at(colorize(new THREE.CylinderGeometry(0.13, 0.13, 0.022, 9), '#4A4452').rotateZ(0.35 + i * 0.12), -5.2 + i * 0.09, -0.9 + i * 0.05, 0, 0.03 + i * 0.03));
    fp(-5.2, -0.9, 0.3);
    // 5 the broom, dropped
    opaque.push(at(mergeGeos([
      CY(0.02, 0.024, 1.15, 5, '#3A3640').rotateZ(Math.PI / 2 - 0.14),
      B(0.16, 0.13, 0.09, '#2A2632').translate(0.56, -0.08, 0),
    ]), -8.4, -3.4, 2.6, 0.07)); fp(-8.4, -3.4, 0.3);
    // 6 the crate, lid off and empty
    opaque.push(at(mergeGeos([
      B(0.62, 0.44, 0.5, '#2A2436').translate(0, 0.22, 0),
      B(0.66, 0.03, 0.54, '#1E1A2A').translate(0, 0.02, 0),
    ]), -9.0, -6.0, 0.6)); fp(-9.0, -6.0, 0.45);
    opaque.push(at(B(0.66, 0.04, 0.54, '#231F2E').rotateX(0.3), -8.35, -6.55, 1.2, 0.03));
    // 6b the second cracked lantern, by the close-up's mark: what leaks out of it is the only cyan
    // key on Isabella there (the mirror-fire is 6 m behind the camera at that station)
    {
      const lx = -4.7, lz = -4.5, ly = groundY(lx, lz);
      opaque.push(xf(mergeGeos([
        B(0.26, 0.03, 0.17, '#1E1A2A').translate(0, 0.015, 0),
        B(0.26, 0.03, 0.17, '#1E1A2A').translate(0, 0.25, 0),
        ...([[-0.12, -0.075], [0.12, -0.075], [-0.12, 0.075], [0.12, 0.075]] as [number, number][]).map(([bx, bz]) => B(0.018, 0.24, 0.018, '#1E1A2A').translate(bx, 0.13, bz)),
      ]), lx, ly + 0.09, lz, 2.2, Math.PI / 2.4));
      glow.push(xf(colorize(new THREE.BoxGeometry(0.2, 0.14, 0.13), VOID.rift, emis(VOID.rift, 1.6)), lx, ly + 0.10, lz, 2.2));
      const l2 = new THREE.PointLight(VOID.cyanLight, 11, 6, 2);
      l2.position.set(lx, ly + 0.28, lz);
      group.add(l2);
      fp(lx, lz, 0.25);
    }
    // 7 the ball nobody came back for
    opaque.push(at(colorize(new THREE.IcosahedronGeometry(0.14, 1), '#5A3A6E'), -3.0, -7.2, 0, 0.14)); fp(-3.0, -7.2, 0.2);
    // 8 the drying rack, on its face
    opaque.push(at(mergeGeos([
      CY(0.025, 0.025, 1.3, 4, '#3A3640').rotateX(Math.PI / 2),
      CY(0.025, 0.025, 1.3, 4, '#3A3640').rotateX(Math.PI / 2).translate(0.42, 0.03, 0),
      ...[0, 1, 2].map((i) => CY(0.018, 0.018, 0.5, 4, '#3A3640').rotateZ(Math.PI / 2).translate(0.21, 0.02, -0.5 + i * 0.5)),
    ]), -6.6, -7.6, 0.5, 0.03)); fp(-6.6, -7.6, 0.5);
  }

  // the swing, on the pine at (3.5, −13.5): swinging by itself, ±25° on a 3.1 s period so a
  // half-second pair shows it move (the scores file's change 8; ±12.6° on 5.5 s did not). It hung
  // on P1 (−12.5, −8.5) until the fix pass, where every camera that could see it was inside the
  // citadel, the torn tent or that pine's own canopy: a station is a composition, and this corner
  // of the camp has no room for one.
  const swing = new THREE.Group();
  const swingAt: [number, number] = [4.8, -11.5];
  swing.position.set(swingAt[0], groundY(swingAt[0], swingAt[1]) + 3.4, swingAt[1]);
  const seatNode = new THREE.Object3D();
  seatNode.position.set(0, -3.0, 0);
  {
    const ropes = mergeGeos([CY(0.022, 0.022, 3.0, 4, '#4A4452').translate(-0.35, -1.5, 0), CY(0.022, 0.022, 3.0, 4, '#4A4452').translate(0.35, -1.5, 0)]);
    const seat = B(0.9, 0.07, 0.32, '#3A3444').translate(0, -3.0, 0);
    const m = new THREE.Mesh(mergeGeos([ropes, seat]), worldMat);
    m.castShadow = true; swing.add(m, seatNode); group.add(swing);
    // the swing's station cannot be a black frame (T-24's floor): one of the camp's lanterns lies
    // cracked in the grass under it, and what leaks out of the crack is rift cyan, not lamp oil
    const lx = swingAt[0] + 0.55, lz = swingAt[1] + 0.55, ly = groundY(lx, lz);
    opaque.push(xf(mergeGeos([
      B(0.26, 0.03, 0.17, '#1E1A2A').translate(0, 0.015, 0),
      B(0.26, 0.03, 0.17, '#1E1A2A').translate(0, 0.25, 0),
      ...([[-0.12, -0.075], [0.12, -0.075], [-0.12, 0.075], [0.12, 0.075]] as [number, number][]).map(([bx, bz]) => B(0.018, 0.24, 0.018, '#1E1A2A').translate(bx, 0.13, bz)),
    ]), lx, ly + 0.09, lz, 0.7, Math.PI / 2.2));
    // small quads may glow at 1.6 (T-10); the broken glass is 0.2 × 0.14 m
    glow.push(xf(colorize(new THREE.BoxGeometry(0.2, 0.14, 0.13), VOID.rift, emis(VOID.rift, 1.6)), lx, ly + 0.10, lz, 0.7));
    const lampLight = new THREE.PointLight(VOID.cyanLight, 13, 7, 2);
    lampLight.position.set(lx, ly + 0.25, lz);
    group.add(lampLight);
    fp(lx, lz, 0.25);
  }

  // ---- the stream climbs its own step: the one thing a still frame can show ----------------------
  // (`world-events-weather.md` §2.1.4: the stream runs rift cyan and uphill)
  const climbU = { uTime: { value: 0 } };
  const climbDrops = makePoints(46, VOID.rift, 4, 1.6);
  let climbSeed: { b: number; x: number; z: number; k: number }[] = [];
  {
    const sx = -14, sz = 17.5;
    // the step the water climbs: a broken stone ledge *across* the stream (its axis (0.32, 0.95),
    // the stream's own direction there is (−0.95, 0.32)), so a still frame has a rim to read the
    // climb against — `shadow-wrong-s4-01` was "something cyan in a trench" for want of one
    const axis = new THREE.Vector2(0.316, 0.949), nrm = new THREE.Vector2(-0.949, 0.316);
    const ly = groundY(sx, sz);
    for (const [along, w, hgt, back] of [[-1.75, 1.6, 1.95, 0.05], [-0.15, 1.7, 2.15, -0.06], [1.5, 1.5, 1.85, 0.08]] as [number, number, number, number][]) {
      const bx = sx + axis.x * along + nrm.x * back, bz = sz + axis.y * along + nrm.y * back;
      const blk = B(w, hgt, 1.15, '#3A3448');
      // broken stone, not a machined slab: each block leans and turns a little of its own
      blk.rotateX((r() - 0.5) * 0.16).rotateZ((r() - 0.5) * 0.2);
      jitterColor(blk, r, 0.07);
      // a rotation about Y sends local +x to (cos, −sin), so the ledge's axis (0.316, 0.949) is
      // ry = −1.249, not atan2(ax, az): at atan2 the blocks lay *along* the stream, not across it
      opaque.push(xf(blk, bx, ly + hgt / 2 - 0.12, bz, LEDGE_RY + (r() - 0.5) * 0.28));
      // the lip's rift seam: a small quad, so 1.6 gain is allowed (T-10)
      glow.push(xf(colorize(new THREE.BoxGeometry(w * 0.92, 0.04, 0.12), VOID.rift, emis(VOID.rift, 1.6)), bx + nrm.x * 0.42, ly + hgt - 0.10, bz + nrm.y * 0.42, LEDGE_RY));
      fp(bx, bz, 0.9);
    }
    const geo = new THREE.PlaneGeometry(4.2, 1.3, 1, 8);
    geo.rotateX(0.3); geo.rotateY(LEDGE_RY); // the sheet stands on the ledge's face, leaning back over it
    const climb = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: climbU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){ float bands = 0.5 + 0.5 * sin(vUv.y * 22.0 + uTime * 5.0); // the bands travel UP
          float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
          float a = (0.10 + 0.62 * bands) * edge * (0.85 - 0.45 * vUv.y); // thinner as it climbs
          gl_FragColor = vec4(vec3(0.23, 0.94, 1.0) * 0.9, a * 0.42); }`,
    }));
    climb.position.set(sx + nrm.x * 0.55, ly + 1.06, sz + nrm.y * 0.55); // the bed is 0.9 m below the water
    climb.layers.enable(BLOOM_LAYER);
    group.add(climb);
    group.add(climbDrops.pts);
    // the drops climb the face and carry on over the lip: the direction is the read, not the speed
    climbSeed = Array.from({ length: 46 }, () => {
      const along = (r() - 0.5) * 4.6;
      return { b: -r() * 2.2, x: sx + axis.x * along + nrm.x * 0.75, z: sz + axis.y * along + nrm.y * 0.75, k: ly };
    });
  }

  // ---- the one warm light: the real camp fire, below the south rim at −37° ------------------------
  // `dungeons.md` §2.6.6: fill `#FF9A3C` at 4 % of the key, azimuth 180, elevation −37, no shadow,
  // and it must never light the ground. The bible's 0.03 is 4 % of its key 0.7 *before* the T-07
  // unit conversion; the runtime renders this scene's key at 0.95 × 3.0 = 2.85, and the fill is
  // authored in physical units, so 4 % of the key here is 0.114 (T-35).
  const farFire = new THREE.Vector3(-4, -142, 236);
  const FAR_FILL = 0.04 * 0.95 * UNITS.key;
  let farHolder: THREE.Group;
  {
    const fill = new THREE.DirectionalLight('#FF9A3C', FAR_FILL);
    fill.position.copy(farFire.clone().normalize().multiplyScalar(-200)); // it comes *from* down there
    fill.position.negate();
    fill.target.position.set(0, 0, 0);
    fill.castShadow = false;
    group.add(fill, fill.target);
    // a small hard point with a soft halo, not a setting sun: at 275 m the 1.1 m disc is ~16 px
    // and the halo ~90 px on a 1600 × 1000 frame (the scores file's change 7)
    const spark = new THREE.Mesh(new THREE.CircleGeometry(2.8, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFC078').multiplyScalar(5.0), transparent: true, opacity: 1, depthWrite: false }));
    spark.layers.enable(BLOOM_LAYER);
    const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(16, 24), new THREE.MeshBasicMaterial({ map: softDisc(), color: '#FF9A3C', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    glowDisc.position.z = -0.4;
    // the smoke column of a fire 250 m below: a tall warm cone above the point, very faint
    const column = new THREE.Mesh(new THREE.PlaneGeometry(11, 26), new THREE.MeshBasicMaterial({ map: softDisc(), color: '#C05A2A', transparent: true, opacity: 0.30, depthWrite: false, blending: THREE.AdditiveBlending }));
    column.position.set(0, 13, -0.6);
    const holder = new THREE.Group();
    holder.add(column, glowDisc, spark);
    holder.position.copy(farFire);
    group.add(holder);
    farHolder = holder;
  }

  // ---- the south lip, so S3 is a picture and not a diagram ---------------------------------------
  // `shadow-wrong-s3-01` is 85 % near-black (T-24's floor, T-16 generalised: the darkness is judged
  // at every station). The lip itself is lit from the ground up: rift cracks running along the edge
  // where the shard tore, and two dim cyan lights on them. Nothing goes on the −37° corridor
  // (|x + 4| < 3.5 m, T-25) and nothing stands tall enough to enter it.
  {
    const rr = rng(53);
    for (let i = 0; i < 18; i++) {
      const x = -17 + rr() * 26, z = 39.5 + rr() * 5.5;
      if (Math.abs(x + 4) < 3.5) continue;
      const len = 0.9 + rr() * 2.6;
      glow.push(at(colorize(new THREE.PlaneGeometry(len, 0.07 + rr() * 0.09), VOID.rift, emis(VOID.rift, 1.6)).rotateX(-Math.PI / 2), x, z, rr() * 3.14, 0.03));
      if (rr() < 0.5) opaque.push(at(colorize(new THREE.IcosahedronGeometry(0.18 + rr() * 0.26, 0), '#3A3448'), x + 0.5, z + 0.4, 0, 0.1));
    }
    for (const [lx, lz] of [[-11.5, 42.5], [3.5, 42.0]] as [number, number][]) {
      const l = new THREE.PointLight(VOID.cyanLight, 14, 16, 2);
      l.position.set(lx, groundY(lx, lz) + 0.55, lz);
      group.add(l);
    }
  }

  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat);
  opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  const glowMesh = new THREE.Mesh(mergeGeos(glow), glowMat);
  glowMesh.layers.enable(BLOOM_LAYER); glowMesh.castShadow = true;
  const clothMesh = new THREE.Mesh(mergeGeos(cloth), clothMat);
  group.add(opaqueMesh, glowMesh, clothMesh);

  const f = 8.8 * 0.5, ph = 2.1; // the shared oscillator at half rate: slow, wrong
  const update = (t: number, dt: number, breathe: number, hero: THREE.Vector3): void => {
    const flVal = Math.sin(t * f + ph), v2 = Math.sin(t * f * 1.7 + 0.7);
    tongues[0]!.scale.y = 1 + 0.11 * flVal; tongues[0]!.rotation.z = 0.09 * Math.sin(t * f * 1.7 + ph + 2);
    tongues[1]!.scale.y = 1 + 0.14 * v2; tongues[1]!.rotation.z = -0.08 * v2;
    tongues[2]!.scale.y = 1 + 0.12 * Math.sin(t * f * 0.6 + 2.9);
    fireLight.intensity = 20 * breathe * (0.9 + 0.1 * flVal);
    pool.material.opacity = 0.11 * breathe + 0.02;
    pool.scale.setScalar(1 + 0.04 * Math.sin(t * 0.35));
    // the embers fall: spawned at 2 m, −0.5 m/s
    for (let i = 0; i < 40; i++) {
      const s = fallSeed[i]!;
      let age = t - s.b;
      if (age > 4) { s.b = t + r() * 1.2; age = 0; }
      fall.pos[i * 3] = Math.sin(s.a + age * 0.9) * s.d;
      fall.pos[i * 3 + 1] = 2.0 - age * 0.5;
      fall.pos[i * 3 + 2] = Math.cos(s.a * 1.3 + age * 0.7) * s.d;
      fall.alpha[i] = age <= 0 || age > 4 ? 0 : Math.min(1, age * 3) * (1 - age / 4) * breathe;
    }
    fall.commit();
    climbU.uTime.value = t;
    for (let i = 0; i < 46; i++) {
      const s = climbSeed[i]!;
      let age = t - s.b;
      if (age > 2.5) { s.b = t + r() * 0.9; age = 0; }
      // up the face at 0.95 m/s and 0.62 m/s over the lip: the water goes up *and* upstream
      const over = Math.max(0, age - 1.4);
      climbDrops.pos[i * 3] = s.x - CLIMB_NRM.x * over * 0.62;
      climbDrops.pos[i * 3 + 1] = s.k + 0.15 + age * 0.95;
      climbDrops.pos[i * 3 + 2] = s.z - CLIMB_NRM.y * over * 0.62;
      climbDrops.alpha[i] = age <= 0 ? 0 : (1 - age / 2.5) * 0.9;
    }
    climbDrops.commit();
    // the swing swings by itself: ±25° on a 3.1 s period, with a second incommensurate rate (T-06)
    swing.rotation.x = SWING_A * Math.sin((t * 6.283) / 3.1) + 0.04 * Math.sin((t * 6.283) / 7.3 + 1);
    tornFlap.rotation.x = 0.3 + 0.28 * Math.sin(t * 0.8) * Math.sin(t * 0.31 + 2);
    farHolder.lookAt(hero.x, hero.y + 1.4, hero.z);
    void dt;
  };
  return {
    group, footprints, farFire, fireSeat: new THREE.Vector3(0, 0.5, 0), update,
    seatWorld: (out: THREE.Vector3) => seatNode.getWorldPosition(out),
    hud: () => `mirror-fire ${VOID.cyanLight} 20 cd d13 (half-rate oscillator, embers fall) · swing ±25° / 3.1 s · far fire az 180 elev −37 fill ${FAR_FILL.toFixed(3)} = 4 % of the key (0.95 × ${UNITS.key})`,
  };
}
