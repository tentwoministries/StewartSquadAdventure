// The pilot Liam (heroes.md §2.7): procedural rig with the §2.7.3 bone names, §2.3.1 proportions,
// §2.1.1 colours, the idle and walk clips of §2.7.4, and the selection ring of §2.7.5.
import * as THREE from 'three';
import { BLOOM_LAYER } from '../_shared/post';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { C, LIGHT } from '../_shared/style';

const mat = makeWorldMaterial({ roughness: 0.85 });
const clothMat = makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide });

const node = (name: string, x = 0, y = 0, z = 0): THREE.Group => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material = mat): THREE.Mesh => { const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; return me; };
const box = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const prism = (rt: number, rb: number, h: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, 6), hex);

export interface Liam {
  root: THREE.Group;
  ring: THREE.Mesh;
  ringLight: THREE.PointLight;
  lookAt: THREE.Vector3;
  update: (t: number, dt: number, walking: boolean) => void;
}

export function makeLiam(): Liam {
  const root = node('root');
  const hips = node('hips', 0, 0.78);
  const spine = node('spine', 0, 0.06);
  const chest = node('chest', 0, 0.21);
  const neck = node('neck', 0, 0.23);
  const head = node('head', 0, 0.04);
  root.add(hips); hips.add(spine); spine.add(chest); chest.add(neck); neck.add(head);

  // torso: tapered hexagonal prism, belt band, buckle; hips block
  hips.add(mesh(xf(prism(0.19, 0.17, 0.14, C.liamDark), 0, 0.0)));
  spine.add(mesh(xf(prism(0.23, 0.19, 0.42, C.liamBase), 0, 0.17)));
  spine.add(mesh(xf(prism(0.20, 0.20, 0.06, C.liamDark), 0, -0.01)));
  spine.add(mesh(xf(box(0.07, 0.05, 0.02, C.liamAccent), 0, -0.01, 0.2)));
  // head: 8-sided sphere, face quads, hair cap and three swept spikes
  const headGeo = colorize(new THREE.SphereGeometry(0.2, 8, 6), C.skin);
  headGeo.scale(0.95, 1.0, 0.9);
  head.add(mesh(xf(headGeo, 0, 0.2)));
  const eyes: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = mesh(box(0.06, 0.05, 0.012, '#FFFFFF')); eye.position.set(s * 0.065, 0.2, 0.175); eye.castShadow = false; head.add(eye); eyes.push(eye);
    const pupil = mesh(box(0.03, 0.03, 0.014, C.pupil)); pupil.position.set(s * 0.065, 0.195, 0.18); pupil.castShadow = false; eye.add(pupil); pupil.position.set(0, -0.005, 0.005);
    const brow = mesh(box(0.07, 0.014, 0.012, C.liamHair)); brow.position.set(s * 0.065, 0.245, 0.176); brow.rotation.z = s * 0.08; head.add(brow);
  }
  const cap = colorize(new THREE.SphereGeometry(0.21, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), C.liamHair);
  cap.scale(0.97, 0.9, 0.95);
  head.add(mesh(xf(cap, 0, 0.23)));
  for (const [x, back, sc] of [[-0.09, -0.02, 0.9], [0, 0.0, 1.0], [0.09, -0.02, 0.9]]) {
    const spike = mesh(colorize(new THREE.ConeGeometry(0.055 * sc!, 0.24 * sc!, 4), C.liamHair));
    spike.position.set(x!, 0.4, -0.02 + back!);
    spike.rotation.x = -0.45;
    head.add(spike);
  }
  // arms
  const arm = (side: 1 | -1) => {
    const sh = node(`shoulder.${side < 0 ? 'L' : 'R'}`, side * 0.24, 0.17);
    const ua = node(`upperArm.${side < 0 ? 'L' : 'R'}`);
    ua.add(mesh(xf(prism(0.055, 0.05, 0.20, C.liamBase), 0, -0.10)));
    const fa = node(`forearm.${side < 0 ? 'L' : 'R'}`, 0, -0.20);
    fa.add(mesh(xf(prism(0.05, 0.045, 0.19, C.liamDark), 0, -0.095)));
    const hand = node(`hand.${side < 0 ? 'L' : 'R'}`, 0, -0.19);
    hand.add(mesh(xf(box(0.10, 0.11, 0.09, C.skin), 0, -0.055)));
    sh.add(ua); ua.add(fa); fa.add(hand);
    chest.add(sh);
    return { sh, ua, fa, hand };
  };
  const L = arm(-1), R = arm(1);
  // shield outboard on the left forearm (disc, rim, boss, four studs), face out (−x)
  const shieldParts = [
    xf(colorize(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 12), C.liamBase), 0, 0),
    xf(colorize(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 12), C.liamDark), 0, 0.025),
    xf(colorize(new THREE.ConeGeometry(0.07, 0.06, 8), C.liamAccent), 0, -0.05),
    ...[0, 1, 2, 3].map((i) => xf(colorize(new THREE.IcosahedronGeometry(0.025, 0), C.liamAccent), Math.cos(i * 1.57) * 0.2, -0.03, Math.sin(i * 1.57) * 0.2)),
  ];
  const shield = mesh(mergeGeos(shieldParts));
  shield.rotation.z = -Math.PI / 2; // disc normal along −x (outboard)
  shield.position.set(-0.10, -0.08, 0.02);
  const propL = node('prop.L'); propL.add(shield); L.fa.add(propL);
  // sword sheathed at the left hip
  const sword = mesh(mergeGeos([
    xf(box(0.03, 0.42, 0.015, C.liamAccent), 0, -0.24),
    xf(box(0.12, 0.03, 0.03, C.swordGuard), 0, -0.02),
    xf(prism(0.016, 0.016, 0.10, C.liamDark), 0, 0.05),
  ]));
  sword.position.set(-0.2, 0.02, -0.04); sword.rotation.z = 0.25; sword.rotation.x = 0.2;
  hips.add(sword);
  // legs
  const leg = (side: 1 | -1) => {
    const th = node(`thigh.${side < 0 ? 'L' : 'R'}`, side * 0.11, -0.02);
    th.add(mesh(xf(prism(0.08, 0.07, 0.24, C.liamDark), 0, -0.12)));
    const sh = node(`shin.${side < 0 ? 'L' : 'R'}`, 0, -0.24);
    sh.add(mesh(xf(prism(0.065, 0.06, 0.30, C.liamDark), 0, -0.15)));
    const foot = node(`foot.${side < 0 ? 'L' : 'R'}`, 0, -0.30);
    foot.add(mesh(xf(box(0.14, 0.20, 0.22, C.liamDark), 0, -0.10, 0.03)));
    foot.add(mesh(xf(box(0.15, 0.06, 0.06, C.liamAccent), 0, -0.17, 0.12)));
    th.add(sh); sh.add(foot); hips.add(th);
    th.rotation.z = side * -0.12;
    return { th, sh, foot };
  };
  const LL = leg(-1), RL = leg(1);
  // cape: two bones, 2-segment strip 0.30 × 0.70
  const cape0 = node('cape.0', 0.06, 0.2, -0.17);
  const cape1 = node('cape.1', 0, -0.35);
  const strip = (h: number) => { const g = colorize(new THREE.PlaneGeometry(0.30, h, 1, 2), C.liamDark); g.translate(0, -h / 2, 0); return g; };
  cape0.add(mesh(strip(0.35), clothMat)); cape1.add(mesh(strip(0.35), clothMat));
  cape0.add(cape1); chest.add(cape0);
  cape0.add(mesh(xf(colorize(new THREE.IcosahedronGeometry(0.03, 0), C.liamAccent), 0.14, 0, 0.02)));

  // selection ring (§2.7.5): soft gradient + crisp rim, additive, on the bloom layer
  const ringU = { uColor: { value: new THREE.Color(C.liamGlow) }, uAlpha: { value: 0.35 } };
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.84, 48),
    new THREE.ShaderMaterial({
      uniforms: ringU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying vec2 vP; void main(){ float r = length(vP);
        float soft = uAlpha * (1.0 - smoothstep(0.55, 0.80, r)) * smoothstep(0.45, 0.55, r);
        float rim = 0.7 * (1.0 - smoothstep(0.02, 0.035, abs(r - 0.62)));
        gl_FragColor = vec4(uColor * 1.4, max(soft, rim)); }`,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.layers.enable(BLOOM_LAYER);
  root.add(ring);
  const ringLight = new THREE.PointLight(LIGHT.ring.color, LIGHT.ring.intensity, LIGHT.ring.range, LIGHT.ring.decay);
  ringLight.position.y = 0.3;
  root.add(ringLight);

  const lookAt = new THREE.Vector3(0, 0.6, 0);
  let blend = 0;
  const tmp = new THREE.Vector3();
  const update = (t: number, dt: number, walking: boolean) => {
    blend += ((walking ? 1 : 0) - blend) * Math.min(1, dt * 5);
    const idle = 1 - blend;
    // breath, shoulders, weight shift (idle)
    const breath = Math.sin(t * 1.5);
    chest.scale.setScalar(1 + 0.015 * breath * idle);
    L.sh.position.y = 0.17 + 0.004 * breath * idle; R.sh.position.y = 0.17 + 0.004 * breath * idle;
    const cyc = (t % 4.2) / 4.2;
    const shift = cyc > 0.5 && cyc < 0.62 ? (cyc - 0.5) / 0.12 : cyc >= 0.62 && cyc < 0.86 ? 1 : cyc >= 0.86 && cyc < 0.98 ? 1 - (cyc - 0.86) / 0.12 : 0;
    hips.position.x = 0.02 * shift * idle;
    // head look-at (yaw ±40°, pitch ±15°), eased
    root.worldToLocal(tmp.copy(lookAt));
    const yawT = THREE.MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -0.7, 0.7);
    head.rotation.y += (yawT - head.rotation.y) * Math.min(1, dt * 6);
    head.rotation.x = THREE.MathUtils.clamp(-Math.atan2(tmp.y - 1.3, Math.hypot(tmp.x, tmp.z)), -0.26, 0.26) * 0.6;
    // idle arms: shield arm 12° abduction; blink
    L.sh.rotation.z = -0.21 * idle + 0.0; L.ua.rotation.x = 0.15 * idle;
    R.sh.rotation.z = 0.06 * idle;
    const blink = ((t + 1.7) % 4) > 3.85 ? 0.3 : 1;
    for (const e of eyes) e.scale.y = blink;
    // walk clip
    const w = t * 6.283; // 1.0 s loop, 2 steps
    const sw = Math.sin(w) * blend;
    LL.th.rotation.x = 0.52 * sw; RL.th.rotation.x = -0.52 * sw;
    LL.sh.rotation.x = Math.max(0, -Math.sin(w - 0.5)) * 0.6 * blend; RL.sh.rotation.x = Math.max(0, Math.sin(w - 0.5)) * 0.6 * blend;
    R.sh.rotation.x = 0.44 * sw; L.sh.rotation.x = -0.2 * sw;
    hips.position.y = 0.78 + 0.02 * Math.abs(Math.sin(w)) * blend;
    spine.rotation.y = 0.07 * sw;
    head.rotation.y -= 0.035 * sw;
    // cape: v27's sway plus the walk trail
    const cs = Math.sin(t * 0.8) * 0.3;
    cape0.rotation.x = 0.12 + cs * 0.35 * idle + 0.15 * Math.abs(Math.sin(t * 6.3)) * blend + 0.25 * blend;
    cape1.rotation.x = cs * 0.2 * idle + 0.1 * Math.sin(t * 6.3 + 1) * blend;
    // ring breathes
    const rs = 1 + 0.06 * Math.sin(t * 5.236);
    ring.scale.setScalar(rs);
  };
  return { root, ring, ringLight, lookAt, update };
}
