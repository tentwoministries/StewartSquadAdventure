// Ambient particle systems for the demo scenes (world-events-weather.md §2.4.2 recipes, kept
// simple: CPU-updated Points on the bloom layer, one draw call each). "Leaves fall, embers rise,
// sand streams, wisps drift, snow falls": the motion names the island.
import * as THREE from 'three';
import { BLOOM_LAYER } from './post';
import { rng } from './rng';

export function softDisc(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.35)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

export function pointsMat(color: string, size: number, hdr: number, soft = true): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color).multiplyScalar(hdr) }, uSize: { value: size } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aAlpha; varying float vA; uniform float uSize; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * (18.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: soft
      ? `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.1, d) * vA; gl_FragColor = vec4(uColor, a); }`
      : `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.35, d) * vA; gl_FragColor = vec4(uColor, a); }`,
  });
}

export interface PointSet { pts: THREE.Points; pos: Float32Array; alpha: Float32Array; commit: () => void }
export function makePoints(n: number, color: string, size: number, hdr: number, soft = true): PointSet {
  const pos = new Float32Array(n * 3), alpha = new Float32Array(n);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const pts = new THREE.Points(g, pointsMat(color, size, hdr, soft));
  pts.frustumCulled = false;
  pts.layers.enable(BLOOM_LAYER);
  const commit = () => {
    (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (g.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
  };
  return { pts, pos, alpha, commit };
}

export interface Box { x: number; z: number; w: number; d: number; y0: number; y1: number }
export interface Emitter { pts: THREE.Points; update: (t: number, k: number) => void }

const wrap = (v: number, lo: number, hi: number) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));

/** Sand streams (Desert): fast, low, horizontal, zero drag; the wind direction is a bearing. */
export function streamers(n: number, color: string, size: number, hdr: number, box: Box, speed: number, bearing: number, seed = 1): Emitter {
  const r = rng(seed);
  const set = makePoints(n, color, size, hdr);
  const seeds = Array.from({ length: n }, () => ({ x: box.x + (r() - 0.5) * box.w, z: box.z + (r() - 0.5) * box.d, y: box.y0 + r() * (box.y1 - box.y0), ph: r() * 6.28, sp: 0.7 + r() * 0.6 }));
  const dx = Math.sin((bearing * Math.PI) / 180), dz = -Math.cos((bearing * Math.PI) / 180);
  return {
    pts: set.pts,
    update(t, k) {
      for (let i = 0; i < n; i++) {
        const s = seeds[i]!;
        const a = t * speed * s.sp;
        set.pos[i * 3] = wrap(s.x + dx * a, box.x - box.w / 2, box.x + box.w / 2);
        set.pos[i * 3 + 2] = wrap(s.z + dz * a, box.z - box.d / 2, box.z + box.d / 2);
        set.pos[i * 3 + 1] = s.y + Math.sin(t * 1.7 + s.ph) * 0.08;
        set.alpha[i] = (0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + s.ph))) * k;
      }
      set.commit();
    },
  };
}

/** Falling things (snow, ash, leaves): a slow drift down with a sideways wander; wraps at the floor. */
export function fallers(n: number, color: string, size: number, hdr: number, box: Box, speed: number, sway: number, seed = 2): Emitter {
  const r = rng(seed);
  const set = makePoints(n, color, size, hdr);
  const seeds = Array.from({ length: n }, () => ({ x: box.x + (r() - 0.5) * box.w, z: box.z + (r() - 0.5) * box.d, y: box.y0 + r() * (box.y1 - box.y0), ph: r() * 6.28, sp: 0.75 + r() * 0.5, k: 0.4 + r() * 0.5 }));
  return {
    pts: set.pts,
    update(t, k) {
      for (let i = 0; i < n; i++) {
        const s = seeds[i]!;
        set.pos[i * 3] = s.x + Math.sin(t * s.k + s.ph) * sway;
        set.pos[i * 3 + 1] = wrap(s.y - t * speed * s.sp, box.y0, box.y1);
        set.pos[i * 3 + 2] = s.z + Math.cos(t * s.k * 0.8 + s.ph) * sway;
        set.alpha[i] = (0.5 + 0.5 * Math.sin(t * 1.3 + s.ph)) * k;
      }
      set.commit();
    },
  };
}

/** Drifting things (spores, pollen, cave dust, glow-cap motes): a slow rise and a lazy wander. */
export function drifters(n: number, color: string, size: number, hdr: number, box: Box, rise: number, seed = 3): Emitter {
  const r = rng(seed);
  const set = makePoints(n, color, size, hdr);
  const seeds = Array.from({ length: n }, () => ({ x: box.x + (r() - 0.5) * box.w, z: box.z + (r() - 0.5) * box.d, y: box.y0 + r() * (box.y1 - box.y0), ph: r() * 6.28, k: 0.2 + r() * 0.3, s: 0.5 + r() }));
  return {
    pts: set.pts,
    update(t, k) {
      for (let i = 0; i < n; i++) {
        const s = seeds[i]!;
        set.pos[i * 3] = s.x + Math.sin(t * s.k + s.ph) * 1.5;
        set.pos[i * 3 + 1] = rise > 0 ? wrap(s.y + t * rise * s.s * 0.3, box.y0, box.y1) : s.y + Math.sin(t * s.k * 1.3 + s.ph) * 0.4;
        set.pos[i * 3 + 2] = s.z + Math.cos(t * s.k * 0.7 + s.ph) * 1.5;
        set.alpha[i] = (0.4 + 0.6 * Math.abs(Math.sin(t * s.s + s.ph))) * k * 0.7;
      }
      set.commit();
    },
  };
}

/** Blinking things (fireflies, wisps, moths): a smoothstep blink and a ±1.2 m wander. */
export function blinkers(n: number, color: string, size: number, hdr: number, box: Box, seed = 4, wander = 1.2): Emitter {
  const r = rng(seed);
  const set = makePoints(n, color, size, hdr);
  const seeds = Array.from({ length: n }, () => ({ x: box.x + (r() - 0.5) * box.w, z: box.z + (r() - 0.5) * box.d, y: box.y0 + r() * (box.y1 - box.y0), a: r() * 6.28, s: 1.5 + r() * 1.5, k: 0.3 + r() * 0.5 }));
  return {
    pts: set.pts,
    update(t, k) {
      for (let i = 0; i < n; i++) {
        const s = seeds[i]!;
        set.pos[i * 3] = s.x + Math.sin(t * s.k + s.a) * wander;
        set.pos[i * 3 + 1] = s.y + Math.sin(t * s.k * 1.7 + s.a * 2) * 0.35;
        set.pos[i * 3 + 2] = s.z + Math.cos(t * s.k * 0.8 + s.a) * wander;
        set.alpha[i] = THREE.MathUtils.smoothstep(Math.sin(t * s.s + s.a), 0.2, 0.9) * k;
      }
      set.commit();
    },
  };
}

/** A one-shot burst (bats leaving a ledge, sparkles from a staff): call fire() to start. */
export function burst(n: number, color: string, size: number, hdr: number, seed = 5): Emitter & { fire: (x: number, y: number, z: number, dir: THREE.Vector3, speed: number, life: number) => void } {
  const r = rng(seed);
  const set = makePoints(n, color, size, hdr, false);
  const vel = Array.from({ length: n }, () => new THREE.Vector3());
  const org = new THREE.Vector3();
  let t0 = -100, life = 1;
  const fire = (x: number, y: number, z: number, dir: THREE.Vector3, speed: number, lf: number) => {
    org.set(x, y, z); life = lf; t0 = -1;
    for (const v of vel) v.set(dir.x + (r() - 0.5) * 0.8, dir.y + (r() - 0.5) * 0.8, dir.z + (r() - 0.5) * 0.8).normalize().multiplyScalar(speed * (0.6 + r() * 0.8));
  };
  return {
    pts: set.pts, fire,
    update(t, k) {
      if (t0 === -1) t0 = t;
      const age = t - t0;
      const u = Math.min(1, age / life);
      for (let i = 0; i < n; i++) {
        const v = vel[i]!;
        set.pos[i * 3] = org.x + v.x * age + Math.sin(age * 5 + i) * 0.15;
        set.pos[i * 3 + 1] = org.y + v.y * age - 0.5 * age * age * 0.3;
        set.pos[i * 3 + 2] = org.z + v.z * age + Math.cos(age * 4 + i) * 0.15;
        set.alpha[i] = age < 0 || u >= 1 ? 0 : (1 - u) * k;
      }
      set.commit();
    },
  };
}
