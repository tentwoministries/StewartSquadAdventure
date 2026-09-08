// The one new thing on the west rim: the waterfall where the stream leaves the island
// (OPUS_EXPERIMENT_BRIEF.md §3.5). The fall ribbon uses the Crystal Caves' `fallMat` recipe, copied
// here rather than imported (that scene's props file is not this scene's to touch), with the lesson
// its first version taught: a water ribbon is translucent and coloured toward the sky, and the mist
// and the spray do the rest. Below it, a plunge pool that is not on the island — a rock shelf in the
// void with a 6 m sheet on it, draining off its far edge as a second, thinner ribbon.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePoints, softDisc } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
import { C } from '../_shared/style';
import { makeWaterSheet, type WaterSheet } from '../_shared/water';
import { inside, streamInfo } from '../forest-dusk/terrain';

export const FALL_H = 14;
export const SHELF_Y = -FALL_H;

/**
 * The lip is where the *water* ends, not where the island does. The Forest's stream spline runs to
 * (−58, 44), which is 9 m past the plate's organic edge, so from the rim the sheet hangs in mid-air
 * like a diving board — invisible in the Forest scene because no station looks back at the rim.
 * The fix is to give the overhang something to run over: `edgeAt()` finds where the island stops,
 * and a rock tongue is built from there out to the water's end, which is the lip.
 */
export function edgeAt(): THREE.Vector2 {
  const a = new THREE.Vector2(-46, 38.5), b = new THREE.Vector2(-58, 44);
  let last = a.clone();
  for (let i = 0; i <= 80; i++) {
    const p = a.clone().lerp(b, i / 80);
    if (!inside(p.x, p.y)) break;
    last = p;
  }
  return last;
}
export function findLip(): THREE.Vector3 {
  const s = streamInfo(-57.5, 43.6);
  void s;
  return new THREE.Vector3(-57.5, -0.35, 43.6);
}

export interface Waterfall {
  group: THREE.Group;
  lip: THREE.Vector3;
  pool: WaterSheet;
  update: (t: number, dt: number) => void;
  hud: () => string;
}

export function makeWaterfall(): Waterfall {
  const group = new THREE.Group();
  const r = rng(701);
  const lip = findLip();
  const fallU = { uTime: { value: 0 } };
  // the ribbon: 4.5 m wide, straight down 14 m, two crossed sheets so it has body from any angle
  const fallGeo = new THREE.PlaneGeometry(4.5, FALL_H, 6, 18);
  const fallMat = new THREE.ShaderMaterial({
    uniforms: fallU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position;
      p.x += 0.12 * sin(uv.y * 20.0 + uTime * 3.0); p.z += 0.08 * sin(uv.y * 14.0 - uTime * 2.2);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){ float bands = vnoise(vec2(vUv.x * 6.0, vUv.y * 30.0 + uTime * 4.0));
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float a = (0.18 + 0.42 * bands) * edge * (0.55 + 0.45 * smoothstep(1.0, 0.7, vUv.y));
        vec3 c = mix(vec3(0.56, 0.83, 0.96), vec3(0.87, 0.96, 0.95), bands);
        gl_FragColor = vec4(c * 0.8, a * 0.45); }`,
  });
  const fall = new THREE.Mesh(fallGeo, fallMat);
  fall.position.set(lip.x, lip.y - FALL_H / 2, lip.z);
  fall.rotation.y = 0.72;
  fall.layers.enable(BLOOM_LAYER);
  const fall2 = fall.clone(); fall2.rotation.y = 0.72 + Math.PI / 2;
  group.add(fall, fall2);

  // the rock tongue the overhanging stream runs out along, from the island's edge to the lip
  {
    const e = edgeAt();
    const dir = new THREE.Vector2(lip.x - e.x, lip.z - e.y);
    const len = dir.length(), bearing = Math.atan2(dir.x, -dir.y);
    const parts: THREE.BufferGeometry[] = [];
    const segs = 7;
    for (let i = 0; i < segs; i++) {
      const u = (i + 0.5) / segs;
      const px = e.x + dir.x * u, pz = e.y + dir.y * u;
      const w = 7.4 - u * 1.6, th = 1.9 - u * 0.9;
      const g = colorize(new THREE.CylinderGeometry(w * 0.5, w * 0.42, th, 7), i % 2 ? C.rock : C.rockDark);
      g.scale(1, 1, 0.7);
      parts.push(xf(g, px, -0.62 - th * 0.5 - u * 0.45, pz, Math.PI / 2 - bearing)); // the sheet sits just above the rock, never through it
    }
    // a mossy top edge, so it reads as ground running out rather than as a girder
    for (let i = 0; i < 5; i++) {
      const u = (i + 0.5) / 5;
      const px = e.x + dir.x * u, pz = e.y + dir.y * u;
      for (const side of [-1, 1]) {
        const g = colorize(new THREE.IcosahedronGeometry(0.7 + r() * 0.4, 0), C.moss);
        g.scale(1.3, 0.5, 1.1);
        parts.push(xf(g, px + Math.cos(bearing) * side * (3.5 - u * 0.7), -0.82 - u * 0.35, pz + Math.sin(bearing) * side * (3.5 - u * 0.7)));
      }
    }
    const tongue = new THREE.Mesh(mergeGeos(parts), makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide }));
    tongue.castShadow = true; tongue.receiveShadow = true;
    group.add(tongue);
    void len;
  }

  // the lip: six white icosahedra in the Forest water's foam colour, and the sill they break over
  const lumps: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const u = (i / 5 - 0.5) * 4.0;
    const s = 0.3 + r() * 0.2;
    const g = colorize(new THREE.IcosahedronGeometry(s, 1), C.foam);
    g.scale(1.3, 0.7, 1.1);
    lumps.push(xf(g, lip.x + Math.cos(0.72) * u, lip.y + 0.16, lip.z - Math.sin(0.72) * u));
  }
  const foam = new THREE.Mesh(mergeGeos(lumps), makeWorldMaterial({ roughness: 0.5 }));
  foam.castShadow = true; group.add(foam);

  // the rock shelf the fall lands on: not on the island, 8 x 6 m in the Forest rim's colours
  {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.283;
      const rad = 3.4 + r() * 1.4;
      const g = colorize(new THREE.IcosahedronGeometry(1.5 + r() * 1.1, 0), i % 3 ? C.rock : C.rockDark);
      g.scale(1.5, 0.55, 1.3);
      parts.push(xf(g, lip.x + Math.cos(a) * rad * 1.15, SHELF_Y - 0.9 + r() * 0.4, lip.z + Math.sin(a) * rad * 0.85));
    }
    parts.push(xf(colorize(new THREE.CylinderGeometry(4.6, 3.0, 3.2, 9), C.rockDark), lip.x, SHELF_Y - 2.4, lip.z));
    const shelf = new THREE.Mesh(mergeGeos(parts), makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide }));
    shelf.receiveShadow = true; group.add(shelf);
  }
  // the plunge pool: a 6 m sheet at y −14
  const pool = makeWaterSheet({
    box: { x0: lip.x - 4, x1: lip.x + 4, z0: lip.z - 4, z1: lip.z + 4 }, y: SHELF_Y, step: 0.5,
    inside: (x, z) => Math.hypot(x - lip.x, z - lip.z) < 3.0,
    edge: (x, z) => (3.0 - Math.hypot(x - lip.x, z - lip.z)) * 1.6,
    colours: { deep: '#2E7A9A', shallow: '#8FD3F4', foam: C.foam },
    wave: 0.05, mirror: 0.45,
    ripples: [[lip.x, lip.z]],
  });
  group.add(pool.mesh);
  // and it drains off the far edge into the void: a second, thinner ribbon 6 m long
  const drainGeo = new THREE.PlaneGeometry(1.7, 6, 3, 8);
  const drain = new THREE.Mesh(drainGeo, fallMat);
  drain.position.set(lip.x - 2.1, SHELF_Y - 3.0, lip.z + 2.1);
  drain.rotation.y = 0.72 + 0.5;
  drain.layers.enable(BLOOM_LAYER);
  const drain2 = drain.clone(); drain2.rotation.y = 0.72 + 0.5 + Math.PI / 2;
  group.add(drain, drain2);

  // eight mist sprites at the base drifting outward, and forty spray points rising 2 m
  const mistMat = new THREE.SpriteMaterial({ map: softDisc(), color: '#DDF6F1', transparent: true, opacity: 0.15, depthWrite: false });
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(mistMat.clone()); s.scale.set(3.2, 2.2, 1); group.add(s); mist.push(s); }
  const spray = makePoints(40, C.foam, 4, 1.3);
  group.add(spray.pts);
  const spraySeed = Array.from({ length: 40 }, () => ({ b: -r() * 1.6, a: r() * 6.28, d: 0.4 + r() * 1.8 }));

  const update = (t: number, dt: number): void => {
    fallU.uTime.value = t;
    mist.forEach((s, i) => {
      const age = (t * 0.28 + i / 8) % 1;
      const a = (i / 8) * 6.283;
      s.position.set(lip.x + Math.cos(a) * (1.0 + age * 3.4), SHELF_Y + 0.4 + age * 2.6, lip.z + Math.sin(a) * (1.0 + age * 3.0));
      s.material.opacity = 0.17 * Math.sin(age * Math.PI);
      const sc = 2.4 + age * 2.4; s.scale.set(sc, sc * 0.7, 1);
    });
    for (let i = 0; i < 40; i++) {
      const s = spraySeed[i]!;
      let age = t - s.b;
      if (age > 1.8) { s.b = t + r() * 0.5; age = 0; }
      const u = age / 1.8;
      spray.pos[i * 3] = lip.x + Math.cos(s.a) * s.d * (0.4 + u);
      spray.pos[i * 3 + 1] = SHELF_Y + 0.2 + u * 2.0 - u * u * 0.9;
      spray.pos[i * 3 + 2] = lip.z + Math.sin(s.a) * s.d * (0.4 + u);
      spray.alpha[i] = age <= 0 ? 0 : (1 - u) * 0.9;
    }
    spray.commit();
    void dt;
  };
  return { group, lip, pool, update, hud: () => `fall lip (${lip.x.toFixed(1)}, ${lip.z.toFixed(1)}) · ${FALL_H} m x 4.5 m, alpha <= 0.35 · plunge pool r 3.0 at y ${SHELF_Y} · spray 40 · mist 8` };
}
