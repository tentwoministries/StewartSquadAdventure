// The fire (camp.md §2.7.1, the shared torch oscillator of world-events §2.8.3), embers,
// smoke, fireflies and pollen. One flVal drives the main tongue and the fire light.
import * as THREE from 'three';
import { BLOOM_LAYER } from '../_shared/post';
import { colorize, mergeGeos, xf } from '../_shared/material';
import { rng } from '../_shared/rng';
import { C, type Keyframe } from '../_shared/style';

export interface Fx {
  group: THREE.Group;
  update: (t: number, dt: number, kf: Keyframe, hemiSky: THREE.Color) => number;
}

function softDisc(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.35)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function pointsMat(color: string, size: number, hdr: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color).multiplyScalar(hdr) }, uSize: { value: size } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aAlpha; varying float vA; uniform float uSize; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * (18.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.1, d) * vA; gl_FragColor = vec4(uColor, a); }`,
  });
}
function makePoints(n: number, color: string, size: number, hdr: number): { pts: THREE.Points; pos: Float32Array; alpha: Float32Array } {
  const pos = new Float32Array(n * 3), alpha = new Float32Array(n);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const pts = new THREE.Points(g, pointsMat(color, size, hdr));
  pts.frustumCulled = false;
  pts.layers.enable(BLOOM_LAYER);
  return { pts, pos, alpha };
}

export function makeFx(): Fx {
  const group = new THREE.Group();
  const r = rng(3);
  // flames: three two-cone tongues on the bloom layer
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.9, 1.9, 1.9) });
  const tongue = (h: number, w: number) => {
    const g = mergeGeos([
      xf(colorize(new THREE.ConeGeometry(w, h, 6), C.flameOuter), 0, h / 2),
      xf(colorize(new THREE.ConeGeometry(w * 0.5, h * 0.6, 6), C.flameCore), 0, h * 0.3, 0.02),
    ]);
    const m = new THREE.Mesh(g, flameMat);
    m.layers.enable(BLOOM_LAYER);
    return m;
  };
  const main = tongue(0.55, 0.17), s1 = tongue(0.36, 0.11), s2 = tongue(0.3, 0.1);
  main.position.set(0, 0.2, 0); s1.position.set(0.15, 0.18, -0.1); s2.position.set(-0.13, 0.18, 0.12);
  group.add(main, s1, s2);
  const f = 8.8 + 0.37 * 1.2, ph = 2.1;

  // embers
  const N_E = 48;
  const emb = makePoints(N_E, C.embers[1], 5, 2.2);
  const eBorn = new Float32Array(N_E).map(() => -r() * 3), eSeed = new Float32Array(N_E).map(() => r());
  group.add(emb.pts);
  // smoke: 6 stacked sprites
  const tex = softDisc();
  const smoke: THREE.Sprite[] = [];
  const smokeMat = new THREE.SpriteMaterial({ map: tex, color: C.smoke, transparent: true, opacity: 0.25, depthWrite: false });
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(smokeMat.clone()); group.add(s); smoke.push(s); }
  // fireflies and pollen
  const N_F = 140, N_P = 220;
  const ff = makePoints(N_F, C.firefly, 7, 2.0);
  const pl = makePoints(N_P, C.pollen, 3.5, 1.2);
  const fSeed = Array.from({ length: N_F }, () => ({ x: -4 + (r() - 0.5) * 34, z: 6 + (r() - 0.5) * 30, y: 0.3 + r() * 2.0, a: r() * 6.28, s: 1.5 + r() * 1.5, k: 0.3 + r() * 0.5 }));
  const pSeed = Array.from({ length: N_P }, () => ({ x: (r() - 0.5) * 40, z: (r() - 0.5) * 40, y: 0.2 + r() * 3.0, a: r() * 6.28, s: 0.5 + r(), k: 0.2 + r() * 0.3 }));
  group.add(ff.pts, pl.pts);

  const update = (t: number, _dt: number, kf: Keyframe, hemiSky: THREE.Color) => {
    const flVal = Math.sin(t * f + ph), flVal2 = Math.sin(t * f * 1.7 + ph + 2);
    main.scale.y = 1 + 0.11 * flVal; main.scale.x = main.scale.z = 1 + 0.06 * flVal; main.rotation.z = 0.09 * flVal2;
    const v1 = Math.sin(t * f * 1.7 + 0.7), v2 = Math.sin(t * f * 0.6 + 2.9);
    s1.scale.y = 1 + 0.14 * v1; s1.rotation.z = -0.08 * v1; s2.scale.y = 1 + 0.12 * v2; s2.rotation.x = 0.08 * v2;
    const fireScale = kf.fire;
    main.visible = fireScale > 0.5; s1.visible = fireScale > 0.5;
    // embers: life 3 s, rising 2 m, drift ±0.4 m/s, rate ≈ 1.2/s at S2 (raised from 0.3/s for the study; logged)
    for (let i = 0; i < N_E; i++) {
      let age = t - eBorn[i]!;
      if (age > 3) { eBorn[i] = t + r() * (N_E / (1.2 * 3)) * 0.4; age = 0; }
      const u = age / 3;
      const seed = eSeed[i]!;
      emb.pos[i * 3] = Math.sin(seed * 6.28 + age * 2.1) * 0.25 * u + (seed - 0.5) * 0.2;
      emb.pos[i * 3 + 1] = 0.35 + age * 0.7 + Math.sin(age * 3 + seed * 9) * 0.05;
      emb.pos[i * 3 + 2] = Math.cos(seed * 4.1 + age * 1.7) * 0.25 * u + (seed - 0.5) * 0.2;
      emb.alpha[i] = age <= 0 ? 0 : (1 - u) * (u < 0.1 ? u * 10 : 1) * Math.min(1, fireScale * 1.5);
    }
    (emb.pts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (emb.pts.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    // smoke column: 4 m, rising 0.8 m/s, tinted by the hemisphere sky
    const T = 5;
    smoke.forEach((s, i) => {
      const age = ((t + i * (T / 6)) % T);
      const u = age / T;
      s.position.set(0.15 * age + Math.sin(t * 0.7 + i) * 0.12, 0.6 + age * 0.8, Math.cos(t * 0.5 + i * 1.3) * 0.1);
      const sc = 0.6 + u * 1.0;
      s.scale.set(sc, sc, 1);
      const m = s.material;
      m.opacity = 0.35 * (1 - u) * (u < 0.08 ? u / 0.08 : 1) * (0.5 + 0.5 * fireScale);
      m.color.set(C.smoke).multiply(hemiSky.clone().multiplyScalar(1.5).addScalar(0.35));
    });
    // fireflies: blink and wander; pollen: slow drift
    for (let i = 0; i < N_F; i++) {
      const s = fSeed[i]!;
      ff.pos[i * 3] = s.x + Math.sin(t * s.k + s.a) * 1.2;
      ff.pos[i * 3 + 1] = s.y + Math.sin(t * s.k * 1.7 + s.a * 2) * 0.35;
      ff.pos[i * 3 + 2] = s.z + Math.cos(t * s.k * 0.8 + s.a) * 1.2;
      const b = Math.sin(t * s.s + s.a);
      ff.alpha[i] = THREE.MathUtils.smoothstep(b, 0.2, 0.9) * kf.fireflies;
    }
    for (let i = 0; i < N_P; i++) {
      const s = pSeed[i]!;
      pl.pos[i * 3] = s.x + Math.sin(t * s.k + s.a) * 2.0 + t * 0.05;
      pl.pos[i * 3 + 1] = s.y + Math.sin(t * s.k * 1.3 + s.a) * 0.5;
      pl.pos[i * 3 + 2] = s.z + Math.cos(t * s.k * 0.7 + s.a) * 2.0;
      pl.alpha[i] = (0.4 + 0.6 * Math.abs(Math.sin(t * s.s + s.a))) * kf.pollen * 0.7;
    }
    for (const p of [ff, pl]) {
      (p.pts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (p.pts.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    }
    return flVal;
  };
  return { group, update };
}
