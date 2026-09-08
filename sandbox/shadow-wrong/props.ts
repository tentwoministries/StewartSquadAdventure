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

import type { Circle } from '../_shared/walk';
import { groundY } from '../forest-dusk/terrain';
import { VOID } from './sky';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

/** Everything warm at home is cold here: drain a mesh tree to the void palette, kill its glow. */
export function voidify(root: THREE.Object3D): void {
  const ash = new THREE.Color(VOID.ash), deep = new THREE.Color('#241436');
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    const col = m.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (col) {
      for (let i = 0; i < col.count; i++) {
        const r = col.getX(i), g = col.getY(i), b = col.getZ(i);
        const lum = 0.3 * r + 0.59 * g + 0.11 * b;
        // toward ash by luminance, then pushed into the void's violet; nothing keeps its hue
        const k = 0.44 + 0.56 * lum; // a floor: nothing in the shard is #000 (the anti-palette's row 4)
        const c = new THREE.Color(ash.r * k, ash.g * k, ash.b * k).lerp(deep, 0.30).multiplyScalar(1.0 + lum * 0.3);
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
  update: (t: number, dt: number, breathe: number, hero: THREE.Vector3) => void;
  hud: () => string;
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
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.5, 1.5, 1.5) });
  const tongues: THREE.Mesh[] = [];
  for (const [h, w, x, z] of [[0.62, 0.18, 0, 0], [0.4, 0.12, 0.16, -0.11], [0.34, 0.10, -0.14, 0.13]] as [number, number, number, number][]) {
    const g = mergeGeos([
      xf(colorize(new THREE.ConeGeometry(w, h, 6), VOID.void).rotateX(Math.PI), 0, -h / 2),
      xf(colorize(new THREE.ConeGeometry(w * 0.5, h * 0.6, 6), VOID.rift).rotateX(Math.PI), 0, -h * 0.22, 0.02),
    ]);
    const m = new THREE.Mesh(g, flameMat); m.layers.enable(BLOOM_LAYER);
    m.position.set(x, groundY(x, z) + 0.72, z); // the tongues hang down into the ring, tips in the ashes
    group.add(m); tongues.push(m);
  }
  const fireLight = new THREE.PointLight(VOID.rift, 46, 8, 2);
  fireLight.position.set(0, 0.5, 0);
  group.add(fireLight);
  const fall = makePoints(40, VOID.rift, 5, 2.0);
  group.add(fall.pts);
  const fallSeed = Array.from({ length: 40 }, () => ({ b: -r() * 4, a: r() * 6.28, d: 0.15 + r() * 0.5 }));
  // the smoke sinks and pools as a 0.3 m cyan mist disc r 3 m
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3, 22), new THREE.MeshBasicMaterial({ color: new THREE.Color(VOID.rift).multiplyScalar(0.5), transparent: true, opacity: 0.055, depthWrite: false, blending: THREE.AdditiveBlending }));
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
    const cabinLight = new THREE.PointLight(VOID.ember, 62, 15, 2);
    cabinLight.position.set(cx + Math.sin(ry) * 3.2 + Math.cos(ry) * 1.4, cy + 2.0, cz + Math.cos(ry) * 3.2 - Math.sin(ry) * 1.4);
    const porchLight = new THREE.PointLight(VOID.ember, 26, 9, 2);
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
  // the swing on the big pine P1 (−12.5, −8.5): swinging by itself
  const swing = new THREE.Group();
  swing.position.set(-11.2, groundY(-11.2, -7.4) + 3.4, -7.4);
  {
    const ropes = mergeGeos([CY(0.02, 0.02, 3.0, 4, '#3A3640').translate(-0.35, -1.5, 0), CY(0.02, 0.02, 3.0, 4, '#3A3640').translate(0.35, -1.5, 0)]);
    const seat = B(0.9, 0.07, 0.32, '#2A2632').translate(0, -3.0, 0);
    const m = new THREE.Mesh(mergeGeos([ropes, seat]), worldMat);
    m.castShadow = true; swing.add(m); group.add(swing);
  }

  // ---- the stream climbs its own step: the one thing a still frame can show ----------------------
  // (`world-events-weather.md` §2.1.4: the stream runs rift cyan and uphill)
  const climbU = { uTime: { value: 0 } };
  const climbDrops = makePoints(30, VOID.rift, 4, 1.6);
  let climbSeed: { b: number; x: number; z: number }[] = [];
  {
    const sx = -14, sz = 17.5;
    const geo = new THREE.PlaneGeometry(5.4, 2.8, 1, 8);
    geo.rotateX(-0.55); geo.rotateY(deg(28));
    const climb = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: climbU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){ float bands = 0.5 + 0.5 * sin(vUv.y * 26.0 + uTime * 5.0); // the bands travel UP
          float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
          float a = (0.22 + 0.44 * bands) * edge * (0.45 + 0.55 * vUv.y);
          gl_FragColor = vec4(vec3(0.23, 0.94, 1.0) * 0.9, a * 0.75); }`,
    }));
    climb.position.set(sx, groundY(sx, sz) + 1.25, sz);
    climb.layers.enable(BLOOM_LAYER);
    group.add(climb);
    fp(sx, sz, 1.2);
    group.add(climbDrops.pts);
    climbSeed = Array.from({ length: 30 }, () => ({ b: -r() * 2.5, x: sx + (r() - 0.5) * 4, z: sz + (r() - 0.5) * 1.6 }));
  }

  // ---- the one warm light: the real camp fire, below the south rim at −37° ------------------------
  const farFire = new THREE.Vector3(-4, -142, 236);
  let farHolder: THREE.Group;
  {
    const fill = new THREE.DirectionalLight('#FF9A3C', 0.13);
    fill.position.copy(farFire.clone().normalize().multiplyScalar(-200)); // it comes *from* down there
    fill.position.negate();
    fill.target.position.set(0, 0, 0);
    group.add(fill, fill.target);
    const spark = new THREE.Mesh(new THREE.CircleGeometry(3.0, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FF9A3C').multiplyScalar(2.6), transparent: true, opacity: 0.95, depthWrite: false }));
    spark.layers.enable(BLOOM_LAYER);
    const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(19, 24), new THREE.MeshBasicMaterial({ map: softDisc(), color: '#FF9A3C', transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending }));
    glowDisc.position.z = -0.4;
    const holder = new THREE.Group();
    holder.add(glowDisc, spark);
    holder.position.copy(farFire);
    group.add(holder);
    farHolder = holder;
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
    fireLight.intensity = 46 * breathe * (0.9 + 0.1 * flVal);
    pool.material.opacity = 0.045 * breathe + 0.012;
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
    for (let i = 0; i < 30; i++) {
      const s = climbSeed[i]!;
      let age = t - s.b;
      if (age > 2.5) { s.b = t + r() * 0.9; age = 0; }
      climbDrops.pos[i * 3] = s.x; climbDrops.pos[i * 3 + 1] = groundY(s.x, s.z) + 0.2 + age * 0.85; climbDrops.pos[i * 3 + 2] = s.z;
      climbDrops.alpha[i] = age <= 0 ? 0 : (1 - age / 2.5) * 0.9;
    }
    climbDrops.commit();
    // the swing swings by itself, on two rates so it never repeats
    swing.rotation.x = 0.22 * Math.sin(t * 1.15) + 0.05 * Math.sin(t * 0.41 + 1);
    tornFlap.rotation.x = 0.3 + 0.28 * Math.sin(t * 0.8) * Math.sin(t * 0.31 + 2);
    farHolder.lookAt(hero.x, hero.y + 1.4, hero.z);
    void dt;
  };
  return { group, footprints, farFire, fireSeat: new THREE.Vector3(0, 0.5, 0), update, hud: () => `mirror-fire ${VOID.rift} 46 cd (half-rate oscillator, embers fall) · far fire az 180 elev −37 fill 0.13` };
}
