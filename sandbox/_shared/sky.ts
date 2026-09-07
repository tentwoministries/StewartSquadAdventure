// Sky dome (3-stop gradient + key lobe), stars, moon, sun disc, low-poly clouds.
// world-events-weather.md §2.6. Dome and stars are drawn with fog off, 500–600 m out.
import * as THREE from 'three';
import { BLOOM_LAYER } from './post';
import { rng } from './rng';
import { C } from './style';
import { colorize, makeWorldMaterial, mergeGeos } from './material';

export interface Sky {
  group: THREE.Group;
  dome: THREE.Mesh;
  uniforms: { uZenith: { value: THREE.Color }; uHorizon: { value: THREE.Color }; uGround: { value: THREE.Color }; uSunDir: { value: THREE.Vector3 }; uSunColor: { value: THREE.Color }; uGlow: { value: number } };
  stars: THREE.Points;
  starU: { uTime: { value: number }; uAlpha: { value: number } };
  moon: THREE.Group;
  sun: THREE.Mesh;
  clouds: { mesh: THREE.Mesh; base: THREE.Vector3; phase: number }[];
  cloudMat: THREE.MeshStandardMaterial;
}

export type CloudSpec = [number, number, number, number];
export function makeSky(cloudSpecs?: CloudSpec[]): Sky {
  const group = new THREE.Group();
  const uniforms = {
    uZenith: { value: new THREE.Color('#22305E') },
    uHorizon: { value: new THREE.Color('#E86A4A') },
    uGround: { value: new THREE.Color('#3A2C5A') },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color('#FF8C5A') },
    uGlow: { value: 0.6 },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 uZenith, uHorizon, uGround, uSunColor; uniform vec3 uSunDir; uniform float uGlow; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 c = mix(uGround, uHorizon, smoothstep(-0.25, 0.02, h));
          c = mix(c, uZenith, pow(smoothstep(0.0, 0.75, h), 0.8));
          float s = max(dot(d, uSunDir), 0.0);
          c += uSunColor * (pow(s, 24.0) * 0.6 + pow(s, 4.0) * 0.18) * uGlow * smoothstep(-0.15, 0.1, uSunDir.y + 0.1);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);

  // Stars: 600 points on the dome at 550 m (world-events §2.6, the v27 cutscene recipe).
  const r = rng(7);
  const n = 600;
  const pos = new Float32Array(n * 3);
  const attr = new Float32Array(n * 3); // size, brightness, twinkle speed
  const phase = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = r() * Math.PI * 2;
    const v = Math.asin(0.05 + r() * 0.95);
    pos[i * 3] = 550 * Math.cos(v) * Math.cos(u);
    pos[i * 3 + 1] = 550 * Math.sin(v);
    pos[i * 3 + 2] = 550 * Math.cos(v) * Math.sin(u);
    attr[i * 3] = 0.4 + r() * 1.8;
    attr[i * 3 + 1] = 0.3 + r() * 0.7;
    attr[i * 3 + 2] = 1 + r() * 4;
    phase[i] = r() * Math.PI * 2;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aStar', new THREE.BufferAttribute(attr, 3));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const starU = { uTime: { value: 0 }, uAlpha: { value: 0 } };
  const stars = new THREE.Points(
    sg,
    new THREE.ShaderMaterial({
      uniforms: starU,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aStar; attribute float aPhase; uniform float uTime; varying float vB;
        void main(){ float tw = 0.55 + 0.45 * sin(uTime * aStar.z + aPhase); vB = aStar.y * tw;
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aStar.x * 2.4; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uAlpha; varying float vB; void main(){ vec2 p = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.15, length(p));
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * vB * 1.6, a * uAlpha); }`,
    }),
  );
  stars.frustumCulled = false;
  group.add(stars);

  // Moon: a flat-shaded low-poly disc with crater facets, halo behind; on the bloom layer.
  const moon = new THREE.Group();
  const mg = colorize(new THREE.CircleGeometry(3, 9), C.moon);
  const mc = mg.getAttribute('color') as THREE.BufferAttribute;
  const mr = rng(3);
  for (let i = 0; i < mc.count; i += 3) { const f = 0.82 + mr() * 0.18; for (let k = 0; k < 3; k++) mc.setXYZ(i + k, mc.getX(i + k) * f, mc.getY(i + k) * f, mc.getZ(i + k) * f); }
  const moonDisc = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(2.0, 2.0, 2.0) }));
  moonDisc.layers.enable(BLOOM_LAYER);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(5.4, 24), new THREE.MeshBasicMaterial({ color: C.moon, transparent: true, opacity: 0.2, depthWrite: false }));
  halo.position.z = -0.5;
  moon.add(halo, moonDisc);
  group.add(moon);

  // Sun disc: 4 m emissive at 500 m in the key colour, bloom (hidden below 0°).
  const sun = new THREE.Mesh(new THREE.CircleGeometry(4, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.6), depthWrite: false }));
  sun.layers.enable(BLOOM_LAYER);
  group.add(sun);

  // Clouds: merged icospheres, white with a cool underside, drift 0.4 m/s with slow bob.
  const cloudMat = makeWorldMaterial({ roughness: 1 });
  const cr = rng(11);
  const clouds: Sky['clouds'] = [];
  const specs: CloudSpec[] = cloudSpecs ?? [
    [-70, -12, -44, 10], [-78, -14, -52, 12], // the two below the rim, off the west rim by the pond (S4)
    [30, 28, -70, 12], [-20, 34, -90, 14], [70, 30, 20, 10], [-60, 26, 60, 11], [10, 38, 90, 13],
  ];
  const under = new THREE.Color(C.cloudUnder);
  for (const [x, y, z, w] of specs) {
    const parts: THREE.BufferGeometry[] = [];
    const k = 3 + Math.floor(cr() * 4);
    for (let i = 0; i < k; i++) {
      const s = w * (0.22 + cr() * 0.2);
      const g = new THREE.IcosahedronGeometry(s, 1);
      g.scale(1.3, 0.75, 1);
      g.translate((i - (k - 1) / 2) * w * 0.28 + (cr() - 0.5) * 2, (cr() - 0.5) * s * 0.4, (cr() - 0.5) * w * 0.25);
      parts.push(colorize(g, '#FFFFFF'));
    }
    const merged = mergeGeos(parts);
    const col = merged.getAttribute('color') as THREE.BufferAttribute;
    const nrm = merged.getAttribute('normal') as THREE.BufferAttribute;
    for (let i = 0; i < col.count; i++) {
      const t = THREE.MathUtils.clamp(0.5 - nrm.getY(i) * 0.5, 0, 1);
      col.setXYZ(i, 1 - (1 - under.r) * t, 1 - (1 - under.g) * t, 1 - (1 - under.b) * t);
    }
    const mesh = new THREE.Mesh(merged, cloudMat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    clouds.push({ mesh, base: new THREE.Vector3(x, y, z), phase: cr() * 6.28 });
  }

  return { group, dome, uniforms, stars, starU, moon, sun, clouds, cloudMat };
}

/** Direction toward a sky body from compass bearing (0 = north = −z, 90 = east = +x) and elevation. */
export function dirFrom(elev: number, azim: number): THREE.Vector3 {
  const e = (elev * Math.PI) / 180, a = (azim * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize();
}
