// The pilot island cut (camp.md §2.11.1): the terrain plate, the stream and pool, the pond,
// the cliff rim, with vertex colours from §2.3.1 and the paths/furrow baked in as colour.
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { colorize, FOG_GLSL, WORLD_U, makeWorldMaterial, mergeGeos } from '../_shared/material';
import { clamp, lerp, rng, smoothstep } from '../_shared/rng';
import { displace } from '../_shared/rock';
import { C } from '../_shared/style';

export const PLATE = { x0: -52, x1: 62, z0: -50, z1: 50 };
const noise = createNoise2D(rng(27));

// Stream control points inside the plate (camp.md §2.3.2), width per point; the pool is the wide one.
const STREAM: [number, number, number][] = [
  [62, 22, 4], [48, 24, 4], [24, 17, 4], [8, 14.5, 4.5], [-6, 15, 8], [-18, 19, 4], [-40, 31, 4.5], [-52, 40, 5], [-58, 44, 5],
];
const curve = new THREE.CatmullRomCurve3(STREAM.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal', 0.5);
const SAMPLES = 260;
const sPts = curve.getPoints(SAMPLES);
const sWidth = sPts.map((_, i) => {
  const u = (i / SAMPLES) * (STREAM.length - 1);
  const k = Math.min(Math.floor(u), STREAM.length - 2);
  const a = STREAM[k]!, b = STREAM[k + 1]!;
  return lerp(a[2], b[2], u - k);
});
export const ROCKS: [number, number][] = [[14, 15.5], [3, 13.2], [-4, 17.5], [-9, 13.4], [-15, 18.3], [-24, 21]];
export const PATHS: [number, number][][] = [
  [[0, 0], [11, 0.3]],
  [[0, 0], [-5.1, -2.1]],
  [[0, 0], [-1.2, 5.0], [-4.5, 12.5]],
];

/** Distance to the stream centreline and the half-width there. */
export function streamInfo(x: number, z: number): { d: number; half: number; along: number } {
  let best = Infinity, bi = 0;
  for (let i = 0; i < sPts.length; i++) {
    const p = sPts[i]!;
    const dx = p.x - x, dz = p.z - z;
    const dd = dx * dx + dz * dz;
    if (dd < best) { best = dd; bi = i; }
  }
  return { d: Math.sqrt(best), half: sWidth[bi]! / 2, along: bi };
}
function pathDist(x: number, z: number): number {
  let best = Infinity;
  for (const path of PATHS) {
    for (let i = 0; i + 1 < path.length; i++) {
      const [ax, az] = path[i]!, [bx, bz] = path[i + 1]!;
      const vx = bx - ax, vz = bz - az;
      const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
      const dx = x - (ax + vx * t), dz = z - (az + vz * t);
      best = Math.min(best, Math.sqrt(dx * dx + dz * dz));
    }
  }
  return best;
}
export const POND = { x: -40, z: -30, r: 9 };

export function groundY(x: number, z: number): number {
  const dFire = Math.hypot(x, z);
  const n1 = noise(x / 8, z / 8) * 0.12;
  const n2 = noise(x / 20, z / 20) * 0.5 + noise(x / 6, z / 6) * 0.15;
  let h = lerp(n1, n2, smoothstep(22, 36, dFire));
  h += 1.5 * smoothstep(-10, -30, z);
  h += 4 * Math.exp(-(((z + 46) / 4) ** 2)) * (0.8 + 0.2 * noise(x / 5, 0));
  // the strip (x 10–70, z ±6) is flat
  const strip = smoothstep(8, 5, Math.abs(z)) * smoothstep(8, 12, x);
  h = lerp(h, 0, strip);
  // fire disc
  h = lerp(h, 0, smoothstep(3.2, 1.6, dFire));
  // stream cut
  const s = streamInfo(x, z);
  if (s.d < s.half + 2.0) {
    const bank = -0.55 * (1 - smoothstep(s.half, s.half + 2.0, s.d));
    const bed = s.d < s.half ? -0.35 * (1 - (s.d / s.half) ** 2) : 0;
    const pool = s.half > 3.5 ? -0.3 * (1 - clamp(s.d / s.half, 0, 1)) : 0;
    h = Math.min(h, 0) + bank + bed + pool;
  }
  // pond basin
  const dp = Math.hypot(x - POND.x, z - POND.z);
  if (dp < POND.r + 2) {
    const basin = -0.9 * (1 - (clamp(dp / POND.r, 0, 1)) ** 2);
    h = lerp(h, basin, smoothstep(POND.r + 2, POND.r, dp));
  }
  return h;
}
export function distToWater(x: number, z: number): number {
  const s = streamInfo(x, z);
  const dp = Math.hypot(x - POND.x, z - POND.z) - POND.r;
  return Math.min(s.d - s.half - 0.6, dp);
}
/** The plate has an organic edge: inset noise so the rim reads as a cliff, not a cut. */
export function inside(x: number, z: number): boolean {
  const ex = 3 * noise(z / 14, 100), ez = 3 * noise(x / 14, 200);
  return x > PLATE.x0 + 4 + ex && x < PLATE.x1 - 4 - ex && z > PLATE.z0 + 4 + ez && z < PLATE.z1 - 4 - ez;
}

function faceColor(cx: number, cz: number, hy: number, ny: number, nz: number, r: () => number): THREE.Color {
  const out = new THREE.Color(C.moss);
  const em = new THREE.Color(C.emerald);
  const m = noise(cx / 7, cz / 7);
  if (m > 0.2) out.lerp(em, clamp((m - 0.2) * 1.4, 0, 0.8));
  if (ny < 0.85 && nz > 0.2) out.lerp(em, 0.5); // north-facing slopes (north is −z, so normal.z > 0 faces south... invert)
  const dFire = Math.hypot(cx, cz);
  if (dFire < 3.2) out.lerp(new THREE.Color(C.earth), 1 - smoothstep(1.6, 3.2, dFire));
  const pd = pathDist(cx, cz);
  if (pd < 1.05) out.lerp(new THREE.Color(C.pathDust), 0.45 * (1 - smoothstep(0.45, 1.05, pd)));
  // furrow ruts and scorch
  if (cx > 13.5 && cx < 70) {
    const rut = Math.min(Math.abs(cz - 0.9), Math.abs(cz + 0.9));
    if (rut < 0.45) out.lerp(new THREE.Color(C.earth), lerp(0.55, 0.2, (cx - 13.5) / 56));
    for (const sx of [20, 27, 33, 42, 55]) {
      const d = Math.hypot((cx - sx) / 1.9, cz / 1.4);
      if (d < 1) out.lerp(new THREE.Color(C.scorch), 0.35 * (1 - d));
    }
  }
  // water bed and banks
  if (hy < -0.3) out.set(C.bed).multiplyScalar(0.75 + 0.25 * clamp(1 + hy, 0, 1));
  else if (hy < -0.05) out.lerp(new THREE.Color(C.earth), 0.4 * (1 - smoothstep(-0.3, -0.05, hy)));
  // per-face value jitter: the facet read
  out.multiplyScalar(1 + (r() * 2 - 1) * 0.04);
  return out;
}

export function makeTerrain(): { mesh: THREE.Mesh; rim: THREE.Mesh; water: THREE.Mesh; waterU: Record<string, { value: unknown }> } {
  const r = rng(101);
  const pos: number[] = [], col: number[] = [];
  const push = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) => {
    const ay = groundY(ax, az), by = groundY(bx, bz), cy = groundY(cx, cz);
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(bx - ax, by - ay, bz - az), new THREE.Vector3(cx - ax, cy - ay, cz - az)).normalize();
    const c = faceColor((ax + bx + cx) / 3, (az + bz + cz) / 3, (ay + by + cy) / 3, n.y, -n.z, r);
    pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  };
  const G = 0.5; // 0.5 m grid: paths and the fire disc need it to read as curves, not pixels
  for (let x = PLATE.x0; x < PLATE.x1; x += G) {
    for (let z = PLATE.z0; z < PLATE.z1; z += G) {
      if (!inside(x + G / 2, z + G / 2)) continue;
      // alternate the diagonal so facets do not stripe
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
  mesh.castShadow = false;

  // Cliff rim: march the plate boundary, skirt down 10 m with inset and noise.
  const rimPos: number[] = [], rimCol: number[] = [];
  const ring: [number, number][] = [];
  const step = 1.5;
  const bx0 = PLATE.x0 + 2, bx1 = PLATE.x1 - 2, bz0 = PLATE.z0 + 2, bz1 = PLATE.z1 - 2;
  for (let x = bx0; x < bx1; x += step) ring.push([x, bz0]);
  for (let z = bz0; z < bz1; z += step) ring.push([bx1, z]);
  for (let x = bx1; x > bx0; x -= step) ring.push([x, bz1]);
  for (let z = bz1; z > bz0; z -= step) ring.push([bx0, z]);
  // pull each ring point inward until it is inside the organic boundary
  const cx0 = (PLATE.x0 + PLATE.x1) / 2, cz0 = (PLATE.z0 + PLATE.z1) / 2;
  const edge = ring.map(([x, z]) => {
    let px = x, pz = z;
    for (let i = 0; i < 12 && !inside(px, pz); i++) { px += (cx0 - px) * 0.04; pz += (cz0 - pz) * 0.04; }
    return [px, pz] as [number, number];
  });
  const tiers = [0, -3.5, -10.5];
  const insets = [0, 1.6, 4.5];
  const rock = new THREE.Color(C.rock), rockDark = new THREE.Color(C.rockDark), earth = new THREE.Color(C.earth), root = new THREE.Color(C.root);
  const tierPt = (i: number, t: number): [number, number, number] => {
    const [x, z] = edge[i % edge.length]!;
    const ins = insets[t]! + noise(i * 0.7, t * 3) * 0.8;
    const dx = cx0 - x, dz = cz0 - z, len = Math.hypot(dx, dz);
    const y = t === 0 ? groundY(x, z) + 0.05 : tiers[t]! + noise(i * 0.4, t) * 1.2;
    return [x + (dx / len) * ins, y, z + (dz / len) * ins];
  };
  const rr = rng(55);
  for (let i = 0; i < edge.length; i++) {
    for (let t = 0; t < 2; t++) {
      const a = tierPt(i, t), b = tierPt(i + 1, t), c = tierPt(i + 1, t + 1), d = tierPt(i, t + 1);
      const base = t === 0 ? earth.clone().lerp(rock, 0.55) : rock.clone().lerp(rockDark, 0.6);
      for (const tri of [[a, b, c], [a, c, d]]) {
        const cc = base.clone();
        if (t === 0 && rr() < 0.25) cc.lerp(root, 0.6);
        cc.multiplyScalar(1 + (rr() * 2 - 1) * 0.08);
        for (const p of tri) { rimPos.push(p[0], p[1], p[2]); rimCol.push(cc.r, cc.g, cc.b); }
      }
    }
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
  rg.setAttribute('color', new THREE.Float32BufferAttribute(rimCol, 3));
  rg.computeVertexNormals();
  const rim = new THREE.Mesh(rg, makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide }));

  // Water: a ribbon along the spline plus the pond disc.
  const wPos: number[] = [], wEdge: number[] = [], wFlow: number[] = [];
  const across = 3;
  const ribbon: number[][] = [];
  for (let i = 0; i < sPts.length; i++) {
    const p = sPts[i]!, q = sPts[Math.min(i + 1, sPts.length - 1)]!;
    const tx = q.x - p.x, tz = q.z - p.z, tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    const half = sWidth[i]! / 2 + 0.9;
    const row: number[] = [];
    for (let k = -across; k <= across; k++) {
      const f = k / across;
      row.push(p.x + nx * half * f, -0.35, p.z + nz * half * f, Math.abs(f), i * 0.6);
    }
    ribbon.push(row);
  }
  const quad = (a: number[], b: number[], c: number[], d: number[]) => {
    for (const v of [a, b, c, a, c, d]) { wPos.push(v[0]!, v[1]!, v[2]!); wEdge.push(v[3]!); wFlow.push(v[4]!); }
  };
  for (let i = 0; i + 1 < ribbon.length; i++) {
    for (let k = 0; k < across * 2; k++) {
      const r0 = ribbon[i]!, r1 = ribbon[i + 1]!;
      quad(r0.slice(k * 5, k * 5 + 5), r0.slice(k * 5 + 5, k * 5 + 10), r1.slice(k * 5 + 5, k * 5 + 10), r1.slice(k * 5, k * 5 + 5));
    }
  }
  const rings = 4, segs = 28;
  const pondV = (ri: number, si: number) => {
    const rad = (POND.r + 0.8) * (ri / rings), a = (si / segs) * Math.PI * 2;
    return [POND.x + Math.cos(a) * rad, -0.3, POND.z + Math.sin(a) * rad, ri / rings, si * 0.5];
  };
  for (let ri = 0; ri < rings; ri++) for (let si = 0; si < segs; si++) quad(pondV(ri, si), pondV(ri + 1, si), pondV(ri + 1, si + 1), pondV(ri, si + 1));
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
  wg.setAttribute('aEdge', new THREE.Float32BufferAttribute(wEdge, 1));
  wg.setAttribute('aFlow', new THREE.Float32BufferAttribute(wFlow, 1));
  const waterU: Record<string, { value: unknown }> = {
    ...WORLD_U,
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color('#FFD08A') },
    uAmbient: { value: new THREE.Color('#4A4E8E') },
    uStream: { value: new THREE.Color(C.stream) },
    uBed: { value: new THREE.Color(C.bed) },
    uFoam: { value: new THREE.Color(C.foam) },
    uGlint: { value: 1.0 },
    uRocks: { value: ROCKS.map(([x, z]) => new THREE.Vector2(x, z)) },
  };
  const water = new THREE.Mesh(
    wg,
    new THREE.ShaderMaterial({
      uniforms: waterU,
      transparent: true,
      vertexShader: `
        attribute float aEdge; attribute float aFlow;
        uniform float uTime; uniform float uCurve; uniform vec2 uCurveCenter;
        varying vec3 vW; varying float vEdge; varying float vFlow;
        void main(){
          vec3 p = position;
          p.y += 0.03 * (sin(p.x * 3.5 + uTime * 1.2) + sin(p.z * 9.0 + uTime * 2.1) * 0.6);
          vW = p; vEdge = aEdge; vFlow = aFlow;
          float d = length(p.xz - uCurveCenter);
          p.y -= uCurve * d * d;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        ${FOG_GLSL}
        uniform float uTime; uniform vec3 uSunDir, uSunColor, uAmbient, uStream, uBed, uFoam; uniform float uGlint; uniform vec2 uRocks[6];
        varying vec3 vW; varying float vEdge; varying float vFlow;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
          if (n.y < 0.0) n = -n;
          float shallow = smoothstep(0.55, 1.0, vEdge);
          vec3 base = mix(uStream, uBed, 0.25 * (1.0 - vEdge));
          base = mix(base, uFoam, shallow * 0.25);
          float nl = max(dot(n, uSunDir), 0.0);
          vec3 lit = base * (uAmbient * 0.9 + uSunColor * nl * 0.9);
          float fn = vnoise(vec2(vFlow * 0.9 - uTime * 0.7, vW.x * 0.8 + vW.z * 0.6));
          float foam = smoothstep(0.78, 0.95, vEdge + (fn - 0.5) * 0.25);
          for (int i = 0; i < 6; i++) { float dr = distance(vW.xz, uRocks[i]); foam += smoothstep(1.4, 0.55, dr) * (0.4 + 0.6 * fn); }
          lit = mix(lit, uFoam * (0.6 + 0.4 * uAmbient.g + 0.4 * nl), clamp(foam, 0.0, 0.85));
          vec3 v = normalize(cameraPosition - vW);
          vec3 hv = normalize(v + uSunDir);
          float spec = pow(max(dot(n, hv), 0.0), 60.0) * uGlint;
          lit += uSunColor * spec * 1.4;
          float sparkle = pow(vnoise(vW.xz * 6.0 + uTime * 0.8), 12.0) * 0.6 * uGlint;
          lit += uSunColor * sparkle;
          gl_FragColor = vec4(ssFog(lit, vW), 0.96);
        }`,
    }),
  );
  water.renderOrder = 2;
  return { mesh, rim, water, waterU };
}

/** Rocks in the camp reach: sittable lumps with foam wakes (camp.md §2.3.2). */
export function makeStreamRocks(): THREE.BufferGeometry {
  const rr = rng(9);
  const parts: THREE.BufferGeometry[] = [];
  for (const [x, z] of ROCKS) {
    const g = new THREE.IcosahedronGeometry(0.55 + rr() * 0.3, 1);
    g.scale(1.2, 0.7, 1);
    // T-43: per unique position, so the rock stays a solid a kid could sit on (camp.md §2.3.2)
    displace(g, rr, { x: [0.9, 1.1], y: [0.9, 1.1], z: [0.9, 1.1] });
    g.translate(x, -0.45, z);
    parts.push(colorize(g, C.stone));
  }
  return mergeGeos(parts);
}
