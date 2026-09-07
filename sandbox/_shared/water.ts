// A still-water sheet for pools, oases, bog water and frozen lakes: a grid over a box masked by
// an inside() test, with a per-vertex edge distance for the shallows and foam, the shared fog, a
// sky-tinted base, the sun glint and a sparkle band (the Forest stream shader's recipe, at rest).
import * as THREE from 'three';
import { FOG_GLSL, WORLD_U } from './material';

export interface WaterOpts {
  box: { x0: number; x1: number; z0: number; z1: number };
  y: number;
  step?: number;
  inside: (x: number, z: number) => boolean;
  /** Distance to the shore (m), positive inside. */
  edge: (x: number, z: number) => number;
  colours: { deep: string; shallow: string; foam: string };
  /** Wave height (m) and speed; 0 for glass. */
  wave?: number;
  /** Ripple rings from lily pads or drips: up to 8 centres. */
  ripples?: [number, number][];
  /** Mirror strength: how much of the sky colour the surface takes (0.3 bog, 0.5 oasis). */
  mirror?: number;
  ice?: boolean;
}

export interface WaterSheet { mesh: THREE.Mesh; uniforms: Record<string, { value: unknown }> }

export function makeWaterSheet(o: WaterOpts): WaterSheet {
  const step = o.step ?? 1;
  const pos: number[] = [], edge: number[] = [];
  const tri = (a: [number, number], b: [number, number], c: [number, number]) => {
    for (const p of [a, b, c]) { pos.push(p[0], o.y, p[1]); edge.push(Math.max(0, o.edge(p[0], p[1]))); }
  };
  for (let x = o.box.x0; x < o.box.x1; x += step) {
    for (let z = o.box.z0; z < o.box.z1; z += step) {
      const corners: [number, number][] = [[x, z], [x + step, z], [x + step, z + step], [x, z + step]];
      if (!corners.some(([cx, cz]) => o.inside(cx, cz)) && !o.inside(x + step / 2, z + step / 2)) continue;
      tri(corners[0]!, corners[3]!, corners[2]!); tri(corners[0]!, corners[2]!, corners[1]!);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
  const ripples = (o.ripples ?? []).slice(0, 8);
  while (ripples.length < 8) ripples.push([9999, 9999]);
  const uniforms: Record<string, { value: unknown }> = {
    ...WORLD_U,
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color('#FFD08A') },
    uSky: { value: new THREE.Color('#4A4E8E') },
    uDeep: { value: new THREE.Color(o.colours.deep) },
    uShallow: { value: new THREE.Color(o.colours.shallow) },
    uFoam: { value: new THREE.Color(o.colours.foam) },
    uGlint: { value: 1.0 },
    uWave: { value: o.wave ?? 0.02 },
    uMirror: { value: o.mirror ?? 0.4 },
    uRipples: { value: ripples.map(([x, z]) => new THREE.Vector2(x, z)) },
    uIce: { value: o.ice ? 1.0 : 0.0 },
  };
  const mesh = new THREE.Mesh(
    g,
    new THREE.ShaderMaterial({
      uniforms, transparent: true,
      vertexShader: `
        attribute float aEdge; uniform float uTime; uniform float uCurve; uniform vec2 uCurveCenter; uniform float uWave;
        varying vec3 vW; varying float vEdge;
        void main(){
          vec3 p = position;
          p.y += uWave * (sin(p.x * 1.7 + uTime * 0.9) + sin(p.z * 2.3 + uTime * 1.3) * 0.7);
          vW = p; vEdge = aEdge;
          float d = length(p.xz - uCurveCenter);
          p.y -= uCurve * d * d;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        ${FOG_GLSL}
        uniform float uTime; uniform vec3 uSunDir, uSunColor, uSky, uDeep, uShallow, uFoam; uniform float uGlint, uMirror, uIce; uniform vec2 uRipples[8];
        varying vec3 vW; varying float vEdge;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); if (n.y < 0.0) n = -n;
          float depth = smoothstep(0.0, 4.0, vEdge);
          vec3 base = mix(uShallow, uDeep, depth);
          vec3 v = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 2.0);
          base = mix(base, uSky, uMirror * (0.35 + 0.65 * fres));
          float nl = max(dot(n, uSunDir), 0.0);
          vec3 lit = base * (uSky * 0.6 + 0.5 + uSunColor * nl * 0.5);
          float fn = vnoise(vW.xz * 0.8 + uTime * 0.15);
          float foam = smoothstep(0.9, 0.2, vEdge + (fn - 0.5) * 0.4) * (1.0 - uIce);
          for (int i = 0; i < 8; i++) {
            float dr = distance(vW.xz, uRipples[i]);
            float ring = abs(fract(dr * 0.9 - uTime * 0.35) - 0.5);
            foam += (1.0 - smoothstep(0.0, 2.2, dr)) * smoothstep(0.42, 0.5, ring) * 0.35 * (1.0 - uIce);
          }
          lit = mix(lit, uFoam * (0.7 + 0.3 * nl), clamp(foam, 0.0, 0.8));
          vec3 hv = normalize(v + uSunDir);
          float spec = pow(max(dot(n, hv), 0.0), 70.0) * uGlint;
          lit += uSunColor * spec * 1.2;
          float sparkle = pow(vnoise(vW.xz * 5.0 + uTime * 0.6), 14.0) * 0.5 * uGlint;
          lit += uSunColor * sparkle;
          // ice: a pale sheet with crack lines from a cell noise
          if (uIce > 0.5) {
            float c1 = vnoise(vW.xz * 0.35), c2 = vnoise(vW.xz * 0.35 + 7.0);
            float crack = smoothstep(0.035, 0.0, abs(c1 - c2)) * 0.5;
            lit = mix(lit, uFoam, crack);
          }
          gl_FragColor = vec4(ssFog(lit, vW), 0.96);
        }`,
    }),
  );
  mesh.renderOrder = 2;
  return { mesh, uniforms };
}

/** Sets the sun and sky uniforms on a sheet from a keyframe. */
export function lightWater(w: WaterSheet, keyDir: THREE.Vector3, keyColor: string, keyIntensity: number, hemiSky: string, elev: number): void {
  (w.uniforms['uSunDir'] as { value: THREE.Vector3 }).value.copy(keyDir);
  (w.uniforms['uSunColor'] as { value: THREE.Color }).value.set(keyColor).multiplyScalar(keyIntensity * 0.5);
  (w.uniforms['uSky'] as { value: THREE.Color }).value.set(hemiSky);
  (w.uniforms['uGlint'] as { value: number }).value = elev < 30 && elev > 0 ? 1.0 : 0.5;
}
