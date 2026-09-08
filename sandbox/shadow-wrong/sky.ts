// The shard has its own sky, so it does not use `_shared/sky.ts` (one glow lobe, one white star
// field, a sun): `world-events-weather.md` §2.1.4 wants a dusk that never sets from the wrong side,
// two rift-cyan lobes, the Forest's constellations mirrored left-right and tinted `#3AF0FF`, a
// black moon with a thin ember rim, and void clouds *below* the shard drifting toward it.
// The scene runs with `sky: 'cave'` (no shared dome) and adds this instead.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos } from '../_shared/material';
import { BLOOM_LAYER } from '../_shared/post';
import { rng } from '../_shared/rng';

// The palette. The three sky stops and the fog were lifted in the fix pass: at the shipped values
// `shadow-wrong-s3-01` was 96.7 % of its pixels under T-24's 12 % floor and `-s1-01` 73 %, because
// the void below the horizon is what most of those frames *are*. The mood is contrast, not black.
export const VOID = {
  void: '#1A1030', ember: '#FF6A2A', rift: '#3AF0FF', riftMid: '#2ABDD8', riftPale: '#BFFAFF', ash: '#86829A',
  zenith: '#1C1235', horizon: '#5A3480', ground: '#382156', fog: '#1E1030',
  // the roof's paint went `#241F30` → `#3A3348` in round 2: at the old value the two roof slabs
  // rendered at p50 0.018 (98 % of them under 5 %), because a face that sees neither the key nor
  // the hemisphere's sky is dark whatever its albedo. The paint is half the fix; the other half is
  // the ambient floor `roofFloor` below, a small emissive at 0.2 gain (T-39 (b))
  charcoal: '#241F30', cabinRoof: '#3A3348', roofFloor: '#A99BD0', cyanDim: '#1A4A58', cyanLight: '#2FA6D8',
} as const;

export interface ShadowSky {
  group: THREE.Group;
  /** Called every frame: `breathe` is the 40 s ±25 % rift oscillation. */
  update: (t: number, camera: THREE.Camera, breathe: number) => void;
}

export function makeShadowSky(): ShadowSky {
  const group = new THREE.Group();
  const r = rng(313);

  // the dome: three stops, plus two rift lobes — one where the sun should be (az 300, elev 12,
  // the wrong side) and a smaller one opposite
  const uniforms = {
    uZenith: { value: new THREE.Color(VOID.zenith) },
    uHorizon: { value: new THREE.Color(VOID.horizon) },
    uGround: { value: new THREE.Color(VOID.ground) },
    uRift: { value: new THREE.Color(VOID.rift) },
    uSun: { value: new THREE.Vector3(-0.847, 0.208, 0.489) },   // az 300, elev 12
    uAnti: { value: new THREE.Vector3(0.847, 0.104, -0.522) },  // opposite, a little lower
    uGlow: { value: 1 },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      uniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 uZenith, uHorizon, uGround, uRift, uSun, uAnti; uniform float uGlow; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          vec3 c = mix(uGround, uHorizon, smoothstep(-0.30, 0.02, d.y));
          c = mix(c, uZenith, pow(smoothstep(0.0, 0.8, d.y), 0.75));
          float s = max(dot(d, uSun), 0.0), a = max(dot(d, uAnti), 0.0);
          c += uRift * (pow(s, 26.0) * 0.55 + pow(s, 5.0) * 0.16) * uGlow;
          c += uRift * (pow(a, 40.0) * 0.22 + pow(a, 8.0) * 0.06) * uGlow;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  dome.renderOrder = -10; dome.frustumCulled = false;
  group.add(dome);

  // the constellations, mirrored left-right (x negated against the Forest's seed 7) and tinted rift
  const n = 520;
  const pos = new Float32Array(n * 3), attr = new Float32Array(n * 3), phase = new Float32Array(n);
  const rf = rng(7); // the Forest's star seed, so these are the same stars — the wrong way round
  for (let i = 0; i < n; i++) {
    const u = rf() * Math.PI * 2, v = Math.asin(0.05 + rf() * 0.95);
    pos[i * 3] = -550 * Math.cos(v) * Math.cos(u); // the mirror
    pos[i * 3 + 1] = 550 * Math.sin(v);
    pos[i * 3 + 2] = 550 * Math.cos(v) * Math.sin(u);
    attr[i * 3] = 0.4 + rf() * 1.7; attr[i * 3 + 1] = 0.3 + rf() * 0.7; attr[i * 3 + 2] = 0.6 + rf() * 2.4;
    phase[i] = rf() * Math.PI * 2;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aStar', new THREE.BufferAttribute(attr, 3));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const starU = { uTime: { value: 0 }, uAlpha: { value: 0.9 } };
  const stars = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: starU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 aStar; attribute float aPhase; uniform float uTime; varying float vB;
      void main(){ vB = aStar.y * (0.5 + 0.5 * sin(uTime * aStar.z + aPhase));
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aStar.x * 2.2; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uAlpha; varying float vB; void main(){ float a = smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5));
      gl_FragColor = vec4(vec3(0.23, 0.94, 1.0) * vB * 1.5, a * uAlpha); }`,
  }));
  stars.frustumCulled = false;
  group.add(stars);

  // the black moon: a disc of void with a thin ember rim, elevation 40°, never moves
  const moon = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 11), new THREE.MeshBasicMaterial({ color: '#050308' }));
  const rim = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.72, 11), new THREE.MeshBasicMaterial({ color: new THREE.Color(VOID.ember).multiplyScalar(2.2), side: THREE.DoubleSide }));
  rim.layers.enable(BLOOM_LAYER);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(6.4, 20), new THREE.MeshBasicMaterial({ color: VOID.ember, transparent: true, opacity: 0.10, depthWrite: false }));
  halo.position.z = -0.6; rim.position.z = 0.01;
  moon.add(halo, disc, rim);
  const moonDir = new THREE.Vector3(Math.sin(2.79) * Math.cos(0.698), Math.sin(0.698), -Math.cos(2.79) * Math.cos(0.698)).normalize(); // az 160, elev 40
  group.add(moon);

  // void clouds *below* the shard, drifting toward it (world-events §2.1.4)
  const cloudMat = makeWorldMaterial({ roughness: 1 });
  const clouds: { mesh: THREE.Mesh; base: THREE.Vector3; ph: number; in: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const parts: THREE.BufferGeometry[] = [];
    const w = 12 + r() * 8, k = 3 + Math.floor(r() * 3);
    for (let j = 0; j < k; j++) {
      const s = w * (0.24 + r() * 0.2);
      const g = new THREE.IcosahedronGeometry(s, 1);
      g.scale(1.4, 0.6, 1.05);
      g.translate((j - (k - 1) / 2) * w * 0.3, (r() - 0.5) * s * 0.4, (r() - 0.5) * w * 0.24);
      parts.push(colorize(g, '#241436'));
    }
    const merged = mergeGeos(parts);
    const col = merged.getAttribute('color') as THREE.BufferAttribute, nrm = merged.getAttribute('normal') as THREE.BufferAttribute;
    const lit = new THREE.Color('#4A2A6A');
    for (let k2 = 0; k2 < col.count; k2++) {
      const t = THREE.MathUtils.clamp(0.5 + nrm.getY(k2) * 0.5, 0, 1); // the *underside* is dark: the light is below
      col.setXYZ(k2, THREE.MathUtils.lerp(lit.r, 0.06, t), THREE.MathUtils.lerp(lit.g, 0.03, t), THREE.MathUtils.lerp(lit.b, 0.11, t));
    }
    // the clouds leave the south alone: that sightline belongs to the one warm light (S3)
    const a = 1.9 + (i / 7) * 4.5 + r() * 0.3;
    const dist = 46 + r() * 40;
    const mesh = new THREE.Mesh(merged, cloudMat);
    const base = new THREE.Vector3(Math.cos(a) * dist, -16 - r() * 22, Math.sin(a) * dist);
    mesh.position.copy(base);
    group.add(mesh);
    clouds.push({ mesh, base, ph: r() * 6.28, in: 0.35 + r() * 0.4 });
  }
  // two more on the *south* flank, well off the −37° corridor (T-25) and low enough to sit in S3's
  // lower third: the far fire is a directional light from below, so these are the one thing in the
  // scene it lights, and they give the void under the rim a shape instead of a black field
  // −32° and ±24° from S3's camera: lower than that is behind the rim's own silhouette (the lip's
  // edge is at −42° from there) and nearer the centre is in front of the one warm light itself
  for (const [cx, cy, cz, s] of [[-40, -42, 78, 0.55], [38, -45, 82, 0.5]] as [number, number, number, number][]) {
    const parts: THREE.BufferGeometry[] = [];
    for (let j = 0; j < 4; j++) {
      const g = new THREE.IcosahedronGeometry((5 + r() * 4) * s, 1);
      g.scale(1.5, 0.55, 1.1);
      g.translate((j - 1.5) * 9 * s, (r() - 0.5) * 2.4, (r() - 0.5) * 5);
      parts.push(colorize(g, '#2E1A48'));
    }
    const merged2 = mergeGeos(parts);
    // baked warm on the underside: these are the two the far camp fire reaches
    const c2 = merged2.getAttribute('color') as THREE.BufferAttribute, n2 = merged2.getAttribute('normal') as THREE.BufferAttribute;
    const warm = new THREE.Color('#8A4A32'), dark = new THREE.Color('#2A1840');
    for (let k2 = 0; k2 < c2.count; k2++) {
      const t = THREE.MathUtils.clamp(0.5 + n2.getY(k2) * 0.5, 0, 1);
      const c = warm.clone().lerp(dark, t);
      c2.setXYZ(k2, c.r, c.g, c.b);
    }
    // unlit: the only light down there is the camp fire 250 m below, and the bible forbids raising
    // its fill to light anything (dungeons.md §2.6.6), so the glow on their bellies is painted on
    const mesh = new THREE.Mesh(merged2, new THREE.MeshBasicMaterial({ vertexColors: true }));
    const base = new THREE.Vector3(cx, cy, cz);
    mesh.position.copy(base);
    group.add(mesh);
    clouds.push({ mesh, base, ph: r() * 6.28, in: 0.2 + r() * 0.2 });
  }

  const update = (t: number, camera: THREE.Camera, breathe: number): void => {
    group.position.set(camera.position.x, 0, camera.position.z);
    starU.uTime.value = t;
    uniforms.uGlow.value = breathe;
    starU.uAlpha.value = 0.75 + 0.25 * breathe;
    moon.position.copy(moonDir).multiplyScalar(500);
    moon.lookAt(group.position.x, 0, group.position.z);
    for (const c of clouds) {
      // they drift *toward* the shard and sink back, on two incommensurate rates
      const u = (t * 0.012 * c.in + c.ph) % 1;
      const k = 1 - Math.abs(u * 2 - 1);
      c.mesh.position.set(c.base.x * (1 - 0.35 * k), c.base.y + Math.sin(t * 0.07 + c.ph) * 1.6 + 6 * k, c.base.z * (1 - 0.35 * k));
    }
  };
  return { group, update };
}
