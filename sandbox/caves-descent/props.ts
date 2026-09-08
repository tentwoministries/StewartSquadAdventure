// Crystal Caves props: the crystal heart in its pool (one oscillator drives its pulse, its light,
// every rim crystal and the salamanders' spots), the waterfall from the Forest's roots into the
// pool with its mist, the roots hanging from the ceiling (some reach the floor), stalactites, rim
// crystals in three hues that brighten within 6 m of any kid (T-02 proximity), Quartz's hook-lamps
// along the stairs and ledges (lit one by one: stand by a dark lamp 1.5 s; the caves get brighter
// the longer the family is there, T-02), Lamplighter Quartz under his very tall lamp, the spark
// plug on its plinth at the back of the Depths.
import * as THREE from 'three';
import { CAVE as K } from '../_shared/biomes';
import { makeLantern, type Lantern } from '../_shared/lantern';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { burst, makePoints, softDisc } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { deg, rng } from '../_shared/rng';
import { C, type Keyframe } from '../_shared/style';
import type { Circle } from '../_shared/walk';
import { FALL, FLOOR_Y, floorY, GALLERY, groundY, HEART, PLINTH, stairY, TIER1_Y } from './terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const emis = (hex: string, gain: number) => ({ color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });

export interface Props {
  group: THREE.Group; footprints: Circle[];
  update: (t: number, dt: number, kf: Keyframe, kids: THREE.Vector3[]) => void;
  setLampFraction: (f: number) => void;
  lightNext: () => string;
  litCount: () => number; lampCount: number;
  pulse: () => number;
  period: { value: number };
  onLampLit: (cb: (x: number, y: number, z: number) => void) => void;
  hud: () => string[];
}

export const LAMPS: [number, number, number][] = [ // x, z, y (hung at 2 m over the ground)
  [-8, -40, 0], [-12, -34, 0], [-20, -31, -1.5], [-27, -25, -5], [-33, -17, -9.5], [-36, -6, -11], [-38, 8, -11], [-36, 22, -11], [-26, 30, -12.5], [-16, 34, -19], [-6, 33, -24], [14, 30, -26], [22, 8, -26], [-2, -6, -26],
];

export function makeProps(): Props {
  const r = rng(77);
  const group = new THREE.Group();
  const worldMat = makeWorldMaterial({ roughness: 1 });
  const glowMat = makeWorldMaterial({ emissive: true, roughness: 0.3 });
  const opaque: THREE.BufferGeometry[] = [], glow: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });
  const period = { value: 8 };

  // ---- the crystal heart: a cluster of prisms rising 7 m from the pool, its light, its halo -------
  const heartParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const h = i === 0 ? 7.5 : 2.5 + r() * 3.5, rad = i === 0 ? 1.6 : 0.5 + r() * 0.6, a = r() * 6.28, d = i === 0 ? 0 : 1.2 + r() * 1.6;
    const g = colorize(new THREE.CylinderGeometry(rad * 0.25, rad, h, 5), i % 3 === 0 ? K.heart : K.heartCore, emis(K.heart, i === 0 ? 1.4 : 0.9));
    g.translate(0, h / 2 - 0.6, 0); g.rotateX((r() - 0.5) * 0.5); g.rotateZ((r() - 0.5) * 0.5); g.rotateY(a);
    g.translate(HEART.x + Math.cos(a) * d, FLOOR_Y - 0.6, HEART.z + Math.sin(a) * d);
    heartParts.push(g);
  }
  const heartGeo = mergeGeos(heartParts);
  const heartMat = makeWorldMaterial({ emissive: true, roughness: 0.2 });
  const heart = new THREE.Mesh(heartGeo, heartMat); heart.layers.enable(BLOOM_LAYER); heart.castShadow = true; group.add(heart);
  const heartLight = new THREE.PointLight(K.heart, 80, 34, 2); heartLight.position.set(HEART.x, FLOOR_Y + 3, HEART.z); group.add(heartLight);
  const heartHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDisc(), color: K.heart, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
  heartHalo.position.set(HEART.x, FLOOR_Y + 3, HEART.z); heartHalo.scale.set(16, 16, 1); group.add(heartHalo);
  fp(HEART.x, HEART.z, 3.5);
  // the spark plug on its plinth at the back of the Depths (ground_ed_3), a small pale glow
  opaque.push(xf(mergeGeos([CY(0.9, 1.1, 1.4, 6, K.quartz).translate(0, 0.7, 0), CY(0.6, 0.6, 0.1, 6, '#6A6A80').translate(0, 1.45, 0)]), PLINTH.x, floorY(PLINTH.x, PLINTH.z), PLINTH.z));
  glow.push(xf(mergeGeos([CY(0.12, 0.14, 0.5, 6, '#D0D0D8').translate(0, 0.25, 0), CY(0.06, 0.06, 0.3, 6, '#EDE3CF').translate(0, 0.65, 0)]).setAttribute('aEmissive', new THREE.BufferAttribute(new Float32Array(0), 3)), PLINTH.x, floorY(PLINTH.x, PLINTH.z) + 1.5, PLINTH.z));
  fp(PLINTH.x, PLINTH.z, 1.2);
  // ---- roots from the Forest above: columns that reach the floor, hanging ones, and stalactites ----
  for (const [x, z, reach] of [[-30, -2, true], [28, -14, true], [-12, 22, false], [34, 22, false], [8, -20, false], [-44, 14, false], [16, 6, false], [-8, -12, true]] as [number, number, boolean][]) {
    const top = 14;
    const bottom = reach ? floorY(x, z) - 0.5 : top - 6 - r() * 8;
    const parts: THREE.BufferGeometry[] = [];
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + r(), off = 0.4 + r() * 0.6;
      const h = top - bottom;
      const g = CY(0.18 + r() * 0.15, 0.32 + r() * 0.25, h, 5, i % 2 ? K.root : K.rootLight);
      g.translate(0, h / 2, 0);
      const p = g.getAttribute('position') as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) { const t = p.getY(k) / h; p.setX(k, p.getX(k) + Math.sin(t * 6 + a) * 0.5 * off); p.setZ(k, p.getZ(k) + Math.cos(t * 4 + a) * 0.5 * off); }
      g.translate(x + Math.cos(a) * off, bottom, z + Math.sin(a) * off);
      parts.push(g);
    }
    const root = mergeGeos(parts); jitterColor(root, r, 0.06); opaque.push(root);
    if (reach) fp(x, z, 1.4);
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * 6.28, d = r() * 50;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.85;
    const h = 1.5 + r() * 4;
    opaque.push(xf(colorize(new THREE.ConeGeometry(0.35 + r() * 0.4, h, 5), i % 3 ? K.rock : K.rockLight).rotateX(Math.PI), x, 14 - h / 2 - Math.hypot(x / 62, z / 54) * 12, z));
  }
  // ---- the waterfall: a ribbon from the ceiling crack into the pool, mist at the base, spray points ---
  const fallH = FALL.top - (FLOOR_Y - 0.3);
  const fallGeo = new THREE.PlaneGeometry(3.4, fallH, 2, 24);
  const fallU = { uTime: { value: 0 } };
  const fallMat = new THREE.ShaderMaterial({
    uniforms: fallU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.x += 0.12 * sin(uv.y * 20.0 + uTime * 3.0); p.z += 0.08 * sin(uv.y * 14.0 - uTime * 2.2); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){ float bands = vnoise(vec2(vUv.x * 6.0, vUv.y * 30.0 + uTime * 4.0)); float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float a = (0.18 + 0.42 * bands) * edge * (0.55 + 0.45 * smoothstep(1.0, 0.7, vUv.y)); vec3 c = mix(vec3(0.45, 0.7, 0.9), vec3(0.85, 0.97, 1.0), bands); gl_FragColor = vec4(c * 0.7, a * 0.45); }`,
  });
  const fall = new THREE.Mesh(fallGeo, fallMat); fall.position.set(FALL.x, (FALL.top + FLOOR_Y - 0.3) / 2, FALL.z); fall.rotation.y = 0.5; fall.layers.enable(BLOOM_LAYER); group.add(fall);
  const fall2 = fall.clone(); fall2.rotation.y = 0.5 + Math.PI / 2; group.add(fall2);
  const mist: THREE.Sprite[] = [];
  const mistMat = new THREE.SpriteMaterial({ map: softDisc(), color: '#BFD8E8', transparent: true, opacity: 0.16, depthWrite: false });
  for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(mistMat.clone()); s.userData['i'] = i; group.add(s); mist.push(s); }
  const spray = makePoints(60, '#DDF6F1', 4, 1.2);
  group.add(spray.pts);
  // the ceiling crack the light falls through
  glow.push(xf(colorize(new THREE.PlaneGeometry(2.6, 5.0), '#8FD3F4', emis('#8FD3F4', 0.6)).rotateX(Math.PI / 2), FALL.x, FALL.top + 0.4, FALL.z, 0.5));
  // ---- rim crystals: instanced, three hues; each instance's glow = proximity × the heart's pulse -----
  const crystalGeo = mergeGeos([0, 1, 2].map((i) => { const h = 0.6 + i * 0.35, g = colorize(new THREE.CylinderGeometry(0.06, 0.16, h, 5), K.crystal, emis(K.crystalLight, 0.7)); g.translate(0, h / 2, 0); g.rotateX((i - 1) * 0.35); g.rotateY(i * 2.1); g.translate((i - 1) * 0.18, 0, (i % 2) * 0.15); return g; }));
  const crystalSpots: { x: number; y: number; z: number; s: number; nx: number; nz: number }[] = [];
  // nothing grows through a tread: a scattered spot inside a stair's band is dropped, never nudged
  // (`stairY` returns null off the stair) — the same test the tier cut uses (T-55)
  const spot = (x: number, z: number, y: number, s: number, nx = 0, nz = 0) => { if (stairY(x, z) !== null) return; crystalSpots.push({ x, y, z, s, nx, nz }); };
  for (let i = 0; i < 220; i++) { const a = r() * 6.28, d = 8 + r() * 44; const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.85; const y = groundY(x, z); if (Math.hypot(x - HEART.x, z - HEART.z) < 12) continue; if (Math.abs(y - FLOOR_Y) < 2 || Math.abs(y - TIER1_Y) < 1 || Math.abs(y) < 1) spot(x, z, y, 0.5 + r() * 1.2); }
  for (let i = 0; i < 160; i++) { const a = r() * 6.28; const rr = 0.9 + r() * 0.06; const x = Math.cos(a) * 62 * rr, z = Math.sin(a) * 54 * rr; const y = FLOOR_Y + r() * 30; spot(x, z, y, 0.8 + r() * 1.8, -Math.cos(a), -Math.sin(a)); }
  for (let i = 0; i < 24; i++) { const a = r() * 6.28, d = 2 + r() * 5; spot(GALLERY.x + Math.cos(a) * d, GALLERY.z + Math.sin(a) * d, TIER1_Y, 1.0 + r() * 1.3); }
  const crystals = new THREE.InstancedMesh(crystalGeo, glowMat, crystalSpots.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  crystalSpots.forEach((c, i) => {
    const up = new THREE.Vector3(0, 1, 0);
    const n = c.nx || c.nz ? new THREE.Vector3(c.nx, 0.3, c.nz).normalize() : up;
    q.setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * 6.28));
    m.compose(new THREE.Vector3(c.x, c.y, c.z), q, new THREE.Vector3(c.s, c.s, c.s)); crystals.setMatrixAt(i, m);
    const hue = [K.crystal, K.crystalLight, K.crystalPale][i % 3]!; crystals.setColorAt(i, col.set(hue));
  });
  crystals.layers.enable(BLOOM_LAYER); crystals.castShadow = false; group.add(crystals);
  const crystalBase = crystalSpots.map((_, i) => new THREE.Color([K.crystal, K.crystalLight, K.crystalPale][i % 3]));
  const glowVals = new Float32Array(crystalSpots.length).fill(1);
  // ---- Quartz's hook-lamps ----------------------------------------------------------------------------
  const lamps: { l: Lantern; x: number; y: number; z: number; near: number }[] = [];
  const hookGeo: THREE.BufferGeometry[] = [];
  LAMPS.forEach(([x, z, y]) => {
    const l = makeLantern(K.lampFlame, 9, 8, 3.2, K.lampIron, 1.1, false);
    const gy = y + 2.1;
    l.pivot.position.set(x, gy, z);
    group.add(l.pivot);
    hookGeo.push(xf(mergeGeos([CY(0.05, 0.05, 1.6, 5, K.lampHook).translate(0, 0.8, 0), B(0.5, 0.05, 0.05, K.lampHook).translate(0.2, 1.6, 0), colorize(new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI), K.lampHook).translate(0.42, 1.55, 0)]), x - 0.4, gy - 1.6, z));
    lamps.push({ l, x, y: gy, z, near: 0 });
    fp(x - 0.4, z, 0.2);
  });
  opaque.push(...hookGeo);
  // ---- Lamplighter Quartz: a short shape under a very tall lamp, at the landing ------------------------
  const quartz = new THREE.Group();
  {
    const body = new THREE.Mesh(mergeGeos([xf(CY(0.3, 0.42, 1.0, 7, K.quartz), 0, 0.5, 0, 0, 0.25), xf(colorize(new THREE.SphereGeometry(0.2, 7, 5), '#B8A8C8'), 0.05, 1.2, 0.12), xf(colorize(new THREE.ConeGeometry(0.28, 0.5, 6), '#2C2846'), 0.05, 1.5, 0.12), xf(CY(0.03, 0.04, 2.6, 5, K.lampIron), 0.45, 1.3, 0.1)]), worldMat);
    body.castShadow = true;
    const lamp = makeLantern(K.lampFlame, 14, 9, 3.4, K.lampIron, 1.2, true);
    lamp.pivot.position.set(0.45, 2.75, 0.1);
    quartz.add(body, lamp.pivot);
    quartz.position.set(6, groundY(6, -38), -38); quartz.rotation.y = deg(90 - 200);
    group.add(quartz); fp(6, -38, 0.6);
    lamps.push({ l: lamp, x: 6.45, y: 2.75, z: -38, near: 0 });
  }
  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat); opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  const glowMesh = new THREE.Mesh(mergeGeos(glow), glowMat); glowMesh.layers.enable(BLOOM_LAYER);
  group.add(opaqueMesh, glowMesh);
  const bats = burst(30, K.bat, 5, 0.6, 44);
  group.add(bats.pts);
  void C;

  let pulseV = 0;
  const litCbs: ((x: number, y: number, z: number) => void)[] = [];
  const lightLamp = (lp: (typeof lamps)[number]) => { lp.l.target = 1; for (const cb of litCbs) cb(lp.x, lp.y, lp.z); };
  const update = (t: number, dt: number, kf: Keyframe, kids: THREE.Vector3[]) => {
    // one oscillator: the heart's pulse drives its emissive, its light, the halo, every rim crystal
    pulseV = 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin((t / period.value) * 6.283), 2.2);
    heartMat.emissiveIntensity = 1; (heartMat).emissive.set(K.heart);
    heart.scale.setScalar(1 + 0.02 * pulseV);
    heartLight.intensity = 80 * (0.4 + 0.6 * pulseV);
    heartHalo.material.opacity = 0.12 + 0.2 * pulseV;
    // rim crystals: proximity (×2 within 6 m of any kid) × the pulse
    let changed = false;
    for (let i = 0; i < crystalSpots.length; i++) {
      const c = crystalSpots[i]!;
      let near = 0;
      for (const k of kids) { const d = Math.hypot(c.x - k.x, c.z - k.z, (c.y - k.y) * 0.5); near = Math.max(near, THREE.MathUtils.smoothstep(6 - d, 0, 4)); }
      const want = (0.7 + 0.5 * pulseV) * (1 + near);
      const v = glowVals[i]! + (want - glowVals[i]!) * Math.min(1, dt * 4);
      if (Math.abs(v - glowVals[i]!) > 0.004) { glowVals[i] = v; crystals.setColorAt(i, col.copy(crystalBase[i]!).multiplyScalar(v)); changed = true; }
    }
    if (changed && crystals.instanceColor) crystals.instanceColor.needsUpdate = true;
    // the lamps: the T-02 mechanic
    for (const lp of lamps) {
      if (lp.l.target < 1) {
        let d = 99; for (const k of kids) d = Math.min(d, Math.hypot(lp.x - k.x, lp.z - k.z, (lp.y - 2 - k.y) * 0.6));
        lp.near = d < 2.4 ? lp.near + dt : Math.max(0, lp.near - dt * 2);
        if (lp.near >= 1.5) lightLamp(lp);
      }
      lp.l.pivot.rotation.z = 0.04 * Math.sin(t * 0.6 + lp.x);
      lp.l.update(t, dt, kf.lantern);
    }
    // the waterfall
    fallU.uTime.value = t;
    mist.forEach((s, i) => { const age = (t * 0.5 + i * 0.7) % 4, u = age / 4; s.position.set(FALL.x + Math.sin(t * 0.4 + i) * 1.5 + (i - 4) * 0.5, FLOOR_Y + 0.3 + u * 3, FALL.z + Math.cos(t * 0.3 + i) * 1.5); const sc = 2 + u * 3; s.scale.set(sc, sc * 0.7, 1); s.material.opacity = 0.16 * (1 - u); });
    for (let i = 0; i < 60; i++) { const age = (t * 1.5 + i * 0.37) % 1.4, u = age / 1.4; const a = i * 2.4; spray.pos[i * 3] = FALL.x + Math.cos(a) * (0.5 + u * 2.5); spray.pos[i * 3 + 1] = FLOOR_Y + 0.2 + Math.sin(u * Math.PI) * 2.2; spray.pos[i * 3 + 2] = FALL.z + Math.sin(a) * (0.5 + u * 2.5); spray.alpha[i] = (1 - u) * 0.6; }
    spray.commit();
    bats.update(t, 1);
  };
  return {
    group, footprints, update, period,
    pulse: () => pulseV,
    setLampFraction: (f) => { lamps.forEach((lp, i) => { const on = i === lamps.length - 1 || i < Math.round(f * (lamps.length - 1)); lp.l.target = on ? 1 : 0; lp.l.lit = on ? 1 : 0; }); },
    lightNext: () => { const lp = lamps.find((q2) => q2.l.target < 1); if (!lp) return 'every lamp is lit'; lightLamp(lp); return `lamp ${lamps.indexOf(lp) + 1} of ${lamps.length} lights`; },
    litCount: () => lamps.filter((lp) => lp.l.target > 0.5).length, lampCount: lamps.length,
    onLampLit: (cb) => { litCbs.push(cb); litCbs.push((x, y, z) => bats.fire(x, y + 2, z, new THREE.Vector3(HEART.x - x, 4, HEART.z - z).normalize(), 6, 3.5)); },
    hud: () => [`heart pulse ${pulseV.toFixed(2)} (period ${period.value.toFixed(1)} s) · rim crystals ${crystalSpots.length} (×2 within 6 m) · lamps ${lamps.filter((lp) => lp.l.target > 0.5).length}/${lamps.length}`],
  };
}
