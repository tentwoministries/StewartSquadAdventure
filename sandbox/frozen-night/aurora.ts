// The aurora (world-events-weather.md §2.3.2): four shader curtains hung across the northern sky,
// the ribbon fold in the vertex shader, a vertical alpha gradient with rays in the fragment, hues
// green / indigo / magenta / green with magenta fringes, additive, on the bloom layer. The snow
// wash (§2.3.3) is the world material's uAurora uniform, set by the scene from the keyframe.
import * as THREE from 'three';
import { FROZEN as F } from '../_shared/biomes';
import { BLOOM_LAYER } from '../_shared/post';

export interface Aurora { group: THREE.Group; update: (t: number, intensity: number) => void }

export function makeAurora(): Aurora {
  const group = new THREE.Group();
  const hues = [F.auroraGreen, F.auroraIndigo, F.auroraMagenta, F.auroraGreen];
  const mats: THREE.ShaderMaterial[] = [];
  hues.forEach((hex, i) => {
    const geo = new THREE.PlaneGeometry(220, 60, 48, 8);
    const u = { uTime: { value: 0 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color(hex) }, uFringe: { value: new THREE.Color(F.auroraMagenta) }, uIdx: { value: i } };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `uniform float uTime; uniform float uIdx; varying vec2 vUv;
        void main(){ vUv = uv; vec3 p = position;
          float v = uv.x * 6.283;
          p.x += 8.0 * sin(v * 2.1 + uTime * 0.30 + uIdx) + 4.0 * sin(v * 5.3 - uTime * 0.19);
          p.y -= (1.0 - uv.y) * 2.0 * sin(uv.x * 9.0 + uTime * 0.4 + uIdx * 1.3);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float uTime, uAlpha; uniform vec3 uColor, uFringe; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
        void main(){
          float vert = 1.0 - smoothstep(0.0, 0.7, vUv.y);
          float ends = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          float rays = 0.7 + 0.3 * vnoise(vec2(vUv.x * 3.0 + uTime * 0.05, vUv.y * 1.5)) * 2.0 - 0.3;
          vec3 c = mix(uFringe, uColor, smoothstep(0.0, 0.2, vUv.y));
          gl_FragColor = vec4(c * 1.6, vert * ends * rays * uAlpha); }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // hung across the northern sky (azimuth 330°–30°) at 160–200 m, staggered 15 m in depth
    mesh.position.set((i - 1.5) * 26, 62 + i * 6, -175 - i * 14);
    mesh.rotation.y = (i - 1.5) * 0.12;
    mesh.layers.enable(BLOOM_LAYER);
    mesh.frustumCulled = false;
    group.add(mesh); mats.push(mat);
  });
  return {
    group,
    update(t, intensity) {
      mats.forEach((m, i) => {
        (m.uniforms['uTime'] as { value: number }).value = t;
        const base = 0.12 + 0.05 * Math.sin(t * 0.5 + i);
        const breath = 0.85 + 0.15 * Math.sin(t * 0.15) * Math.sin(t * 0.23 + 1) * Math.sin(t * 0.31 + 2);
        (m.uniforms['uAlpha'] as { value: number }).value = base * 2.4 * intensity * breath;
      });
    },
  };
}
