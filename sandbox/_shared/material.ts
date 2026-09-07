// The shared flat-shaded vertex-colour material with the world chunk injected:
// height fog (camera-relative, world-events §2.1.3), curved world, sway, per-vertex emissive.
// Verified against three 0.185.1 chunk names (docs/design/mockups/LOG.md).
import * as THREE from 'three';

export const WORLD_U = {
  uFogColor: { value: new THREE.Color('#7B5A8C') },
  uFogNear: { value: 23 },
  uFogFar: { value: 62 },
  uFogMax: { value: 0.85 },
  uFogHeight: { value: 12 },
  uFogBase: { value: 0 },
  uCurve: { value: 0.0006 },
  uCurveCenter: { value: new THREE.Vector2(0, 0) },
  uTime: { value: 0 },
  uEmissiveGain: { value: 1 },
};

export interface WorldMatOpts {
  sway?: number; // per-material sway strength (m per m of height)
  emissive?: boolean; // reads aEmissive (vec3) and aGlow (float) attributes
  roughness?: number;
  side?: THREE.Side;
  transparent?: boolean;
  opacity?: number;
}

export function makeWorldMaterial(opts: WorldMatOpts = {}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    flatShading: true,
    vertexColors: true,
    roughness: opts.roughness ?? 0.9,
    metalness: 0,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
  const sway = opts.sway ?? 0;
  const emissive = opts.emissive ?? false;
  mat.customProgramCacheKey = () => `ss-world-${sway}-${emissive ? 'e' : 'o'}`;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, WORLD_U, { uSway: { value: sway } });
    const defines: Record<string, string> = {};
    if (sway > 0) defines['SS_SWAY'] = '';
    if (emissive) defines['SS_EMISSIVE'] = '';
    shader.defines = { ...(shader.defines ?? {}), ...defines };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uCurve; uniform vec2 uCurveCenter; uniform float uTime; uniform float uSway;
        varying vec3 vSsWorld;
        #ifdef SS_EMISSIVE
        attribute vec3 aEmissive; attribute float aGlow; varying vec3 vSsEmissive; varying float vSsGlow;
        #endif`,
      )
      .replace(
        '#include <project_vertex>',
        `vec4 ssW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        ssW = instanceMatrix * ssW;
        #endif
        ssW = modelMatrix * ssW;
        #ifdef SS_SWAY
        float ssPh = ssW.x * 0.35 + ssW.z * 0.27;
        float ssA = uSway * max(transformed.y, 0.0);
        ssW.x += ssA * (sin(uTime * 1.3 + ssPh) * 0.6 + sin(uTime * 2.9 + ssPh * 1.7) * 0.4);
        ssW.z += ssA * 0.5 * sin(uTime * 1.1 + ssPh * 0.8);
        #endif
        vSsWorld = ssW.xyz;
        float ssD = length(ssW.xz - uCurveCenter);
        ssW.y -= uCurve * ssD * ssD;
        vec4 mvPosition = viewMatrix * ssW;
        gl_Position = projectionMatrix * mvPosition;
        #ifdef SS_EMISSIVE
        vSsEmissive = aEmissive; vSsGlow = aGlow;
        #ifdef USE_INSTANCING_COLOR
        vSsGlow *= instanceColor.g; // per-instance glow (the Bog's mushrooms brighten near Collette): setColorAt(i, (g, g, g))
        #endif
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFogMax;
        uniform float uFogHeight; uniform float uFogBase; uniform float uEmissiveGain;
        varying vec3 vSsWorld;
        #ifdef SS_EMISSIVE
        varying vec3 vSsEmissive; varying float vSsGlow;
        #endif`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        #ifdef SS_EMISSIVE
        totalEmissiveRadiance = vSsEmissive * uEmissiveGain * vSsGlow;
        #endif`,
      )
      .replace(
        '#include <fog_fragment>',
        `#include <fog_fragment>
        {
          float ssDist = distance(vSsWorld, cameraPosition);
          float ssF = smoothstep(uFogNear, uFogFar, ssDist) * uFogMax;
          float ssH = exp(-max(vSsWorld.y - uFogBase, 0.0) / uFogHeight);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, ssF * ssH);
        }`,
      );
  };
  return mat;
}

/** Fog mix for custom ShaderMaterials (water) so every surface fogs the same way. */
export const FOG_GLSL = `
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar; uniform float uFogMax; uniform float uFogHeight; uniform float uFogBase;
vec3 ssFog(vec3 rgb, vec3 world) {
  float d = distance(world, cameraPosition);
  float f = smoothstep(uFogNear, uFogFar, d) * uFogMax * exp(-max(world.y - uFogBase, 0.0) / uFogHeight);
  return mix(rgb, uFogColor, f);
}`;

/** Build a non-indexed BufferGeometry with a flat vertex colour (and optional emissive attrs). */
export function colorize(geo: THREE.BufferGeometry, hex: string, emissive?: { color: string; glow?: number }): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const n = g.getAttribute('position').count;
  const c = new THREE.Color(hex);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const e = new THREE.Color(emissive?.color ?? '#000000');
  const em = new Float32Array(n * 3);
  const gl = new Float32Array(n).fill(emissive?.glow ?? 1);
  for (let i = 0; i < n; i++) { em[i * 3] = e.r; em[i * 3 + 1] = e.g; em[i * 3 + 2] = e.b; }
  g.setAttribute('aEmissive', new THREE.BufferAttribute(em, 3));
  g.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
  for (const k of ['uv', 'uv1', 'uv2']) if (g.hasAttribute(k)) g.deleteAttribute(k);
  return g;
}

/** Per-face value jitter on a non-indexed geometry's colour attribute. */
export function jitterColor(g: THREE.BufferGeometry, r: () => number, amount: number): void {
  const a = g.getAttribute('color') as THREE.BufferAttribute;
  for (let i = 0; i < a.count; i += 3) {
    const f = 1 + (r() * 2 - 1) * amount;
    for (let k = 0; k < 3; k++) a.setXYZ(i + k, a.getX(i + k) * f, a.getY(i + k) * f, a.getZ(i + k) * f);
  }
  a.needsUpdate = true;
}

/** Concatenate non-indexed geometries that carry position + color (+ aEmissive/aGlow). */
export function mergeGeos(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let n = 0;
  for (const g of list) n += g.getAttribute('position').count;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), em = new Float32Array(n * 3), gl = new Float32Array(n);
  let o = 0;
  for (const g of list) {
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    pos.set(p.array, o * 3);
    const c = g.getAttribute('color') as THREE.BufferAttribute;
    col.set(c.array, o * 3);
    if (g.hasAttribute('aEmissive')) em.set((g.getAttribute('aEmissive') as THREE.BufferAttribute).array, o * 3);
    if (g.hasAttribute('aGlow')) gl.set((g.getAttribute('aGlow') as THREE.BufferAttribute).array, o);
    else gl.fill(1, o, o + p.count);
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('aEmissive', new THREE.BufferAttribute(em, 3));
  out.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
  out.computeVertexNormals();
  return out;
}

/** Apply a transform to a geometry in place (position + normal safe since normals are recomputed later). */
export function xf(g: THREE.BufferGeometry, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1): THREE.BufferGeometry {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
  g.applyMatrix4(m);
  return g;
}
