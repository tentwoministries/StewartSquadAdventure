// The one new thing on the west rim: the waterfall where the stream leaves the island
// (OPUS_EXPERIMENT_BRIEF.md §3.5). The fall ribbon uses the Crystal Caves' `fallMat` recipe, copied
// here rather than imported (that scene's props file is not this scene's to touch), with the lesson
// its first version taught: a water ribbon is translucent and coloured toward the sky, and the mist
// and the spray do the rest. Below it, a plunge pool that is not on the island — a rock shelf in the
// void with a 6 m sheet on it, draining off its far edge as a second, thinner ribbon.
//
// Fix pass 2026-09-08 (`docs/qa/briefs/opus-fixes-rim.md`):
//   * `findLip()` searches (`place.ts` `findLip`) instead of returning a constant.
//   * The Forest's stream ribbon runs 9 m past the plate's edge, which read at S1 as a hard sheet of
//     water hanging in mid-air with Liam apparently standing on it. `trimOverhang()` cuts the sheet
//     off at the island's edge, so the water ends where the ground ends and the fall starts there.
//   * The rock tongue was seven aligned hexagonal cylinders and read from below as a machined block
//     (T-32). It is now a lumpy spur, lighter on its up-facing rock and mossy along both edges.
import * as THREE from 'three';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePoints, softDisc } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';
import { C } from '../_shared/style';
import { makeWaterSheet, type WaterSheet } from '../_shared/water';
import { inside } from '../forest-dusk/terrain';
import { bearingTo, findLip as findLipPure, STREAM_TAIL, type Pt } from './place';

export const FALL_H = 14;
export const SHELF_Y = -FALL_H;
/** The Forest stream sheet's height (`terrain.ts` builds the ribbon at y −0.35). */
export const SHEET_Y = -0.35;

/**
 * The lip is where the island stops carrying the stream. The Forest's spline runs to (−58, 44),
 * 9 m past the plate's organic edge, so the lip is found by marching the stream's tail with
 * `inside()` (`place.ts` `findLip`) — the search the first pass declared and did not do.
 * The fall starts here and `trimOverhang()` ends the water sheet here.
 */
export function findLip(): THREE.Vector3 {
  const p = findLipPure(inside);
  if (!p) {
    console.error('rim-dawn: the stream tail never crosses the plate edge; check terrain.inside()');
    return new THREE.Vector3(-49.4, SHEET_Y, 40.6);
  }
  return new THREE.Vector3(p.x, SHEET_Y, p.z);
}

/** The stream's flow direction at the lip, from the tail segment the lip sits on (unit, xz). */
export function lipFlow(lip: Pt): THREE.Vector2 {
  let best = Infinity, dir = new THREE.Vector2(-0.8, 0.6);
  for (let i = 0; i + 1 < STREAM_TAIL.length; i++) {
    const a = STREAM_TAIL[i]!, b = STREAM_TAIL[i + 1]!;
    const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((lip.x - a.x) * vx + (lip.z - a.z) * vz) / l2));
    const d = Math.hypot(a.x + vx * t - lip.x, a.z + vz * t - lip.z);
    if (d < best) { best = d; dir = new THREE.Vector2(vx, vz).normalize(); }
  }
  return dir;
}

/**
 * Cut the Forest stream ribbon off at the west rim. Two tests, both only in the rim's quadrant
 * (z > 20, x < −20 — never the pond, never the stream's east end): a triangle is dropped when its
 * centroid lies past the lip along the flow, and when it lies past the plate's organic edge. The
 * first gives the sheet a clean end across the stream at the lip (where the fall starts); the
 * second catches the slivers the wiggly edge leaves beside it. Returns how many triangles went.
 * The mesh is this scene's own copy of `makeTerrain()`'s water; `forest-dusk/` is not edited.
 */
export function trimOverhang(water: THREE.Mesh, lip: Pt, flow: THREE.Vector2): number {
  const g = water.geometry;
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const attrs = ['aEdge', 'aFlow'].filter((k) => g.hasAttribute(k));
  const keepPos: number[] = [];
  const keepOther: Record<string, number[]> = {};
  for (const k of attrs) keepOther[k] = [];
  const lipProj = lip.x * flow.x + lip.z * flow.y;
  let dropped = 0;
  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const rim = cz > 20 && cx < -20;
    if (rim && (cx * flow.x + cz * flow.y > lipProj || !inside(cx, cz))) { dropped++; continue; }
    for (let k = 0; k < 3; k++) {
      keepPos.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
      for (const a of attrs) keepOther[a]!.push((g.getAttribute(a) as THREE.BufferAttribute).getX(i + k));
    }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(keepPos, 3));
  for (const a of attrs) g.setAttribute(a, new THREE.Float32BufferAttribute(keepOther[a]!, 1));
  g.computeBoundingSphere();
  return dropped;
}

/**
 * Where the (trimmed) stream sheet ends, measured three ways against the lip: the centre of the end
 * edge (the mean of every vertex within 0.4 m of the furthest point along the flow), the gap along
 * the flow between the lip and that edge, and the distance from the lip to the nearest vertex of
 * it. The edge is ragged — the organic plate edge cuts one side of the ribbon and the flow cut the
 * other — so the centre carries a lateral bias the other two numbers do not.
 */
export function sheetEndInfo(water: THREE.Mesh, flow: THREE.Vector2, lip: Pt): { centre: Pt; alongGap: number; nearest: number } {
  const pos = water.geometry.getAttribute('position') as THREE.BufferAttribute;
  const lipProj = lip.x * flow.x + lip.z * flow.y;
  let best = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (z < 20 || x > -20) continue;
    best = Math.max(best, x * flow.x + z * flow.y);
  }
  let sx = 0, sz = 0, n = 0, nearest = Infinity;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (z < 20 || x > -20) continue;
    if (x * flow.x + z * flow.y < best - 0.4) continue;
    sx += x; sz += z; n++;
    nearest = Math.min(nearest, Math.hypot(x - lip.x, z - lip.z));
  }
  return { centre: n ? { x: sx / n, z: sz / n } : { x: 0, z: 0 }, alongGap: lipProj - best, nearest };
}

/** Lighten a geometry's vertex colours toward `high` with height: the up-facing rock of the tongue
 *  catches the dawn, the underside stays in the rim's dark (the S2 note: "the underside is one
 *  value across 900 px"). */
function shadeY(g: THREE.BufferGeometry, lowHex: string, highHex: string, y0: number, y1: number): THREE.BufferGeometry {
  const col = g.getAttribute('color') as THREE.BufferAttribute;
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const low = new THREE.Color(lowHex), high = new THREE.Color(highHex), c = new THREE.Color();
  for (let i = 0; i < col.count; i++) {
    const u = Math.max(0, Math.min(1, (pos.getY(i) - y0) / (y1 - y0)));
    c.copy(low).lerp(high, u * u);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
  return g;
}

export interface Waterfall {
  group: THREE.Group;
  lip: THREE.Vector3;
  flow: THREE.Vector2;
  pool: WaterSheet;
  update: (t: number) => void;
  hud: () => string;
}

export function makeWaterfall(): Waterfall {
  const group = new THREE.Group();
  const r = rng(701);
  const lip = findLip();
  const flow = lipFlow(lip);
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
  // the ribbon hangs across the flow, so its normal runs along it
  const faceFlow = Math.atan2(flow.x, flow.y);
  const fall = new THREE.Mesh(fallGeo, fallMat);
  // it leaves the tongue's tip, a metre past the sheet's end, so nothing steps behind the ribbon
  fall.position.set(lip.x + flow.x * 1.1, lip.y - FALL_H / 2, lip.z + flow.y * 1.1);
  fall.rotation.y = faceFlow;
  fall.layers.enable(BLOOM_LAYER);
  const fall2 = fall.clone(); fall2.rotation.y = faceFlow + Math.PI / 2;
  group.add(fall, fall2);

  // The rock tongue the stream runs out on: a lumpy spur from 5 m inside the plate to just past the
  // lip, tapering 7.4 → 3.0 m (T-32), its top just under the sheet, mossy along both edges. Built as
  // jittered lumps rather than aligned cylinders: the first pass read as a machined hex block.
  {
    const inland = 5.0, over = 1.8;
    const rock: THREE.BufferGeometry[] = [];
    const moss: THREE.BufferGeometry[] = [];
    const segs = 9;
    for (let i = 0; i < segs; i++) {
      const u = (i + 0.5) / segs;                       // 0 inland → 1 at the tip
      const s = -inland + (inland + over) * u;          // metres along the flow from the lip
      const px = lip.x + flow.x * s, pz = lip.z + flow.y * s;
      const w = 7.4 - u * 4.4, th = 2.2 - u * 1.3;
      const top = SHEET_Y - 0.22 - u * 0.5;             // the sheet sits just above the rock, never through it
      // the body: two overlapping lumps per segment, each turned and squashed differently
      for (const side of [-1, 0, 1]) {
        const off = side * w * (0.20 + r() * 0.10);
        const g = colorize(new THREE.IcosahedronGeometry(w * (0.20 + r() * 0.07), 0), i % 2 ? C.rock : C.rockDark);
        g.scale(1.1 + r() * 0.5, (th / (w * 0.5)) * (0.7 + r() * 0.4), 0.8 + r() * 0.4);
        rock.push(xf(g, px - flow.y * off, top - th * 0.42 + (r() - 0.5) * 0.3, pz + flow.x * off,
          r() * 3.14, (r() - 0.5) * 0.35, (r() - 0.5) * 0.35));
      }
      // a flatter slab under the water line so the top reads as one surface, not as boulders
      const slab = colorize(new THREE.CylinderGeometry(w * 0.44 * (0.9 + r() * 0.2), w * 0.36, th * 0.55, 6 + (i % 2)), C.rock);
      slab.scale(1, 1, 0.72);
      rock.push(xf(slab, px, top - th * 0.22, pz, r() * 1.2 + i * 0.4, 0, (r() - 0.5) * 0.12));
      // moss along both edges, in a step of the rock's own value (T-09: nothing shouts)
      if (i < segs - 1) {
        for (const side of [-1, 1]) {
          const e = side * (w * 0.5 - 0.35);
          const m = colorize(new THREE.IcosahedronGeometry(0.42 + r() * 0.34, 0), i % 3 ? C.moss : C.emerald);
          m.scale(1.25 + r() * 0.3, 0.45, 1.05 + r() * 0.25);
          moss.push(xf(m, px - flow.y * e, top - 0.06 + (r() - 0.5) * 0.12, pz + flow.x * e, r() * 3.14));
        }
      }
    }
    // warm grey rock, not the rim's violet: at 20 m the art director's '#8A86B0' reads as blue plastic
    const rockGeo = shadeY(mergeGeos(rock), '#33353C', '#7E7468', SHEET_Y - 2.6, SHEET_Y - 0.2);
    jitterColor(rockGeo, r, 0.07);
    const tongue = new THREE.Mesh(mergeGeos([rockGeo, mergeGeos(moss)]), makeWorldMaterial({ roughness: 1 }));
    tongue.castShadow = true; tongue.receiveShadow = true;
    group.add(tongue);
  }

  // the lip: six foam icosahedra sitting in the water at the sheet's end, half the first pass's size
  const lumps: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const u = (i / 5 - 0.5) * 4.6;
    const s = 0.15 + r() * 0.12;
    const g = colorize(new THREE.IcosahedronGeometry(s, 1), C.foam);
    g.scale(1.3, 0.7, 1.1);
    lumps.push(xf(g, lip.x - flow.y * u + flow.x * (r() * 0.5 - 0.1), lip.y - 0.02, lip.z + flow.x * u + flow.y * (r() * 0.5 - 0.1)));
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
  drain.rotation.y = faceFlow + 0.5;
  drain.layers.enable(BLOOM_LAYER);
  const drain2 = drain.clone(); drain2.rotation.y = faceFlow + 0.5 + Math.PI / 2;
  group.add(drain, drain2);

  // eight mist sprites at the base drifting outward, and forty spray points rising 2 m
  const mistMat = new THREE.SpriteMaterial({ map: softDisc(), color: '#DDF6F1', transparent: true, opacity: 0.15, depthWrite: false });
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(mistMat.clone()); s.scale.set(3.2, 2.2, 1); group.add(s); mist.push(s); }
  const spray = makePoints(40, C.foam, 4, 1.3);
  group.add(spray.pts);
  const spraySeed = Array.from({ length: 40 }, () => ({ b: -r() * 1.6, a: r() * 6.28, d: 0.4 + r() * 1.8 }));

  const update = (t: number): void => {
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
  };
  return {
    group, lip, flow, pool, update,
    hud: () => `fall lip (${lip.x.toFixed(1)}, ${lip.z.toFixed(1)}) bearing ${bearingTo(0, 0, flow.x, flow.y).toFixed(0)} · ${FALL_H} m x 4.5 m, alpha <= 0.35 · plunge pool r 3.0 at y ${SHELF_Y} · spray 40 · mist 8`,
  };
}
