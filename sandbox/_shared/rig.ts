// One procedural kid rig for the demo scenes (heroes.md §2.3.1 proportions, §2.3.2 face system,
// §2.4.1 shared timings, §2.7.3 bone names), built from a per-kid spec. The Forest scene's
// liam.ts was the prototype; this generalises it so the four kids share one body, one face
// system, one walk and one idle base, and each kid file adds hair, prop, cloth and personality.
import * as THREE from 'three';
import { BLOOM_LAYER } from './post';
import { colorize, makeWorldMaterial, WORLD_U, xf } from './material';

export interface KidColours { base: string; dark: string; accent: string; glow: string; hair: string; skin: string; pupil: string }
export interface KidSpec {
  name: string;
  legs: number; // hips height (m)
  torso: number; // hips → head base (m); Liam 0.54
  shoulder: number; // shoulder offset from the spine (m); Liam 0.24
  headR: number; // Liam 0.20
  stance: number; // foot centres apart (m)
  footFwdL?: number; // left foot forward (Noah)
  toesOut?: number; // rad (Isabella)
  colours: KidColours;
  eye: { w: number; h: number; lid: number }; // lid: idle eye scale.y (Liam half-lidded)
  brow: 'low' | 'oneUp' | 'lash' | 'round';
  smile: boolean;
}
export interface Limb { sh: THREE.Group; ua: THREE.Group; fa: THREE.Group; hand: THREE.Group }
export interface Leg { th: THREE.Group; sh: THREE.Group; foot: THREE.Group }
export interface Bones {
  root: THREE.Group; spin: THREE.Group; hips: THREE.Group; spine: THREE.Group; chest: THREE.Group; neck: THREE.Group; head: THREE.Group;
  L: Limb; R: Limb; LL: Leg; RL: Leg;
  eyes: THREE.Mesh[]; pupils: THREE.Mesh[]; brows: THREE.Mesh[]; mouth: THREE.Mesh; tongue: THREE.Mesh;
  tf: number; lf: number; wf: number; hr: number; // scale factors: torso, legs, width, head
}
export interface Helpers {
  mat: THREE.MeshStandardMaterial; clothMat: THREE.MeshStandardMaterial; emissiveMat: THREE.MeshStandardMaterial;
  node: (name: string, x?: number, y?: number, z?: number) => THREE.Group;
  mesh: (g: THREE.BufferGeometry, m?: THREE.Material) => THREE.Mesh;
  box: (w: number, h: number, d: number, hex: string) => THREE.BufferGeometry;
  prism: (rt: number, rb: number, h: number, hex: string, seg?: number) => THREE.BufferGeometry;
  ball: (r: number, hex: string, detail?: number) => THREE.BufferGeometry;
  glowBall: (r: number, hex: string, gain: number) => THREE.Mesh;
}
export interface KidCtx {
  t: number; dt: number; idle: number; blend: number; w: number; fl: number; look: THREE.Vector3;
  /** The kid's own ground speed (m/s), measured from the root's travel and eased at 6/s. The walk
   *  clip is authored for ≤ 2.0 m/s (heroes.md §2.7.4), so a hook reads this for the speed class —
   *  Isabella's hammer goes from the drag to the shoulder carry above 2.0 (T-45). Measured here so
   *  no scene has to plumb its walker's speed into the rigs. */
  speed: number;
  /** The scene's ground at a point given in the kid's own frame (x right, z forward, metres),
   *  returned *relative to the root's own y* and clamped to ±0.15 m: what a solved prop's contact
   *  point has to sit on when the ground under it is not the ground under her feet. 0 when the
   *  scene has set no sampler. The clamp keeps a prop on the surface she is standing on rather than
   *  letting it fall down the Bog causeway's edge 0.3 m to her right. */
  groundRel: (x: number, z: number) => number;
}
export interface KidHooks { update: (c: KidCtx) => void; flourishLen: number }
export interface Kid {
  name: string; colours: KidColours;
  root: THREE.Group; bones: Bones; ring: THREE.Mesh; ringLight: THREE.PointLight;
  lookAt: THREE.Vector3;
  update: (t: number, dt: number, walking: boolean) => void;
  flourish: () => void;
  /** The runtime hands the rigs the scene's ground so a solved prop (Collette's staff, Isabella's
   *  hammer) can rest on it where it touches down, which is not where her feet are (T-42, T-45). */
  setGround: (fn: (x: number, z: number) => number) => void;
  /** Sets rotation.y from a compass bearing (eyes on local +z: 180° − b). */
  face: (bearing: number) => void;
}

/** A stepped probe's window into the rigs (LESSONS §0 rule 8: a mechanic is shown running in a
 *  probe, not reasoned about). `ssRigProbe.world()` reads the shared curved-world uniforms; each kid
 *  registers its own solved prop under `<name>.<prop>`. Read-only: it never drives the scene.
 *  Its own global, not `ssProbe`: a scene owns `globalThis.ssProbe` and several assign it wholesale
 *  after the kids are built (frozen-night does), which would drop the rigs' entries. */
export function ssProbeReg(): Record<string, () => unknown> {
  const w = globalThis as unknown as { ssRigProbe?: Record<string, () => unknown> };
  if (!w.ssRigProbe) w.ssRigProbe = {};
  return w.ssRigProbe;
}

const IK_TMP = { p: new THREE.Vector3(), e: new THREE.Vector3(), q: new THREE.Quaternion() };

/**
 * Two-bone IK for one arm (T-42, T-45: a planted prop is solved and the hands are posed *onto* it —
 * LESSONS Rigs row 2). Poses `limb.sh` and `limb.fa` so the hand's centre — the `hand` node plus
 * (0, −0.055·wf, 0) in hand space, which is where the palm block's middle sits — lands on the world
 * point `target`. The pose is *set* from the solve and blended in with `w` (LESSONS Rigs row 1: set
 * from a tracked number, never add an offset onto an eased bone). Returns how far short of the
 * target the hand ends (m): 0 when the target is in reach.
 * The caller must have refreshed the kid's world matrices this frame (`root.updateMatrixWorld(true)`)
 * — the shoulder's parent transform is read from them.
 */
export function ikArm(limb: Limb, b: Bones, target: THREE.Vector3, w = 1): number {
  const L1 = 0.20 * b.tf;                     // shoulder → elbow
  const L2 = 0.19 * b.tf + 0.055 * b.wf;      // elbow → the hand's centre
  const parent = limb.sh.parent;
  if (!parent || w <= 0) return 0;
  const p = parent.worldToLocal(IK_TMP.p.copy(target)).sub(limb.sh.position);
  const reach = p.length();
  const D = THREE.MathUtils.clamp(reach, Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  // the elbow's interior angle, then the forearm's own bend (negative takes the hand forward)
  const elbow = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
  const bend = -(Math.PI - elbow);
  // where that bend puts the hand in the shoulder's own frame, and the rotation that swings it onto p
  const e = IK_TMP.e.set(0, -L1 - L2 * Math.cos(bend), -L2 * Math.sin(bend));
  if (reach > 1e-4) {
    IK_TMP.q.setFromUnitVectors(e.normalize(), p.divideScalar(reach));
    limb.sh.quaternion.slerp(IK_TMP.q, w);
  }
  limb.ua.rotation.x = 0;
  limb.fa.rotation.x += (bend - limb.fa.rotation.x) * w;
  return Math.max(0, reach - (L1 + L2));
}

/** The lowest point a box of half-extents `h` reaches below its own centre once `q` has turned it:
 *  |m10|·hx + |m11|·hy + |m12|·hz. Used to stand a solved prop's head *on* the ground rather than
 *  through it whatever angle the shaft is at (T-45). */
export function lowestDrop(q: THREE.Quaternion, hx: number, hy: number, hz: number): number {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q).elements;
  // column-major: the world-y row is elements 1, 5, 9
  return Math.abs(m[1]) * hx + Math.abs(m[5]) * hy + Math.abs(m[9]) * hz;
}

export function makeHelpers(): Helpers {
  const mat = makeWorldMaterial({ roughness: 0.85 });
  const clothMat = makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide });
  const emissiveMat = makeWorldMaterial({ emissive: true, roughness: 0.6 });
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material = mat) => { const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; return me; };
  return {
    mat, clothMat, emissiveMat, mesh,
    node: (name, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); return g; },
    box: (w, h, d, hex) => colorize(new THREE.BoxGeometry(w, h, d), hex),
    prism: (rt, rb, h, hex, seg = 6) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex),
    ball: (r, hex, detail = 0) => colorize(new THREE.IcosahedronGeometry(r, detail), hex),
    glowBall: (r, hex, gain) => {
      const g = colorize(new THREE.IcosahedronGeometry(r, 1), hex, { color: new THREE.Color(hex).multiplyScalar(gain).getStyle(), glow: 1 });
      const m = new THREE.Mesh(g, emissiveMat); m.layers.enable(BLOOM_LAYER); return m;
    },
  };
}

export function makeKid(spec: KidSpec, extras: (b: Bones, h: Helpers) => KidHooks): Kid {
  const h = makeHelpers();
  const { node, mesh, box, prism } = h;
  const c = spec.colours;
  const tf = spec.torso / 0.54, lf = (spec.legs - 0.04) / 0.74, wf = spec.shoulder / 0.24, hr = spec.headR / 0.2;
  const root = node('root');
  const spin = node('spin');
  const hips = node('hips', 0, spec.legs);
  const spine = node('spine', 0, 0.06 * tf);
  const chest = node('chest', 0, 0.21 * tf);
  const neck = node('neck', 0, 0.23 * tf);
  const head = node('head', 0, 0.04 * tf);
  root.add(spin); spin.add(hips); hips.add(spine); spine.add(chest); chest.add(neck); neck.add(head);
  // torso: tapered hexagonal prism, belt band, buckle; hips block
  hips.add(mesh(xf(prism(0.19 * wf, 0.17 * wf, 0.14 * tf, c.dark), 0, 0)));
  spine.add(mesh(xf(prism(0.23 * wf, 0.19 * wf, 0.42 * tf, c.base), 0, 0.17 * tf)));
  spine.add(mesh(xf(prism(0.20 * wf, 0.20 * wf, 0.06 * tf, c.dark), 0, -0.01)));
  spine.add(mesh(xf(box(0.07, 0.05, 0.02, c.accent), 0, -0.01, 0.2 * wf)));
  // head: 8-sided sphere, the face system (§2.3.2)
  const headGeo = colorize(new THREE.SphereGeometry(spec.headR, 8, 6), c.skin);
  headGeo.scale(0.95, 1.0, 0.9);
  head.add(mesh(xf(headGeo, 0, spec.headR)));
  const eyes: THREE.Mesh[] = [], pupils: THREE.Mesh[] = [], brows: THREE.Mesh[] = [];
  const fz = 0.175 * hr, ey = 0.2 * hr;
  for (const s of [-1, 1]) {
    const eye = mesh(box(spec.eye.w, spec.eye.h, 0.012, '#FFFFFF')); eye.position.set(s * 0.065 * hr, ey, fz); eye.castShadow = false; head.add(eye); eyes.push(eye);
    const pupil = mesh(box(spec.eye.w * 0.5, spec.eye.h * 0.6, 0.014, c.pupil)); pupil.castShadow = false; eye.add(pupil); pupil.position.set(0, -0.004, 0.005); pupils.push(pupil);
    const brow = mesh(box(0.07 * hr, 0.014, 0.012, c.hair)); brow.castShadow = false; head.add(brow); brows.push(brow);
    const by = ey + spec.eye.h / 2 + (spec.brow === 'round' ? 0.03 : spec.brow === 'low' ? 0.012 : 0.02);
    brow.position.set(s * 0.065 * hr, by, fz + 0.002);
    if (spec.brow === 'low') brow.rotation.z = s * 0.08;
    if (spec.brow === 'oneUp' && s < 0) { brow.position.y += 0.02; brow.rotation.z = -0.28; }
    if (spec.brow === 'oneUp' && s > 0) brow.rotation.z = 0.12;
    if (spec.brow === 'round') { brow.rotation.z = s * -0.35; brow.scale.x = 0.8; }
    if (spec.brow === 'lash') {
      brow.scale.set(0.9, 0.7, 1); brow.rotation.z = s * -0.15;
      const lash = mesh(box(0.022, 0.008, 0.012, '#2C3E50')); lash.castShadow = false; lash.position.set(s * (spec.eye.w / 2 + 0.006), spec.eye.h / 2 - 0.004, 0.002); lash.rotation.z = s * -0.7; eye.add(lash);
    }
  }
  const mouth = mesh(box(0.05 * hr, 0.012, 0.01, '#9A5A5A')); mouth.castShadow = false; mouth.position.set(0, 0.13 * hr, fz + 0.004); head.add(mouth); mouth.visible = spec.smile;
  const tongue = mesh(box(0.02, 0.014, 0.012, '#E88AA0')); tongue.castShadow = false; tongue.position.set(0, 0.115 * hr, fz + 0.006); head.add(tongue); tongue.visible = false;
  // arms
  const arm = (side: 1 | -1): Limb => {
    const sh = node(`shoulder.${side < 0 ? 'L' : 'R'}`, side * spec.shoulder, 0.17 * tf);
    const ua = node(`upperArm.${side < 0 ? 'L' : 'R'}`);
    ua.add(mesh(xf(prism(0.055 * wf, 0.05 * wf, 0.20 * tf, c.base), 0, -0.10 * tf)));
    const fa = node(`forearm.${side < 0 ? 'L' : 'R'}`, 0, -0.20 * tf);
    fa.add(mesh(xf(prism(0.05 * wf, 0.045 * wf, 0.19 * tf, c.dark), 0, -0.095 * tf)));
    const hand = node(`hand.${side < 0 ? 'L' : 'R'}`, 0, -0.19 * tf);
    hand.add(mesh(xf(box(0.10 * wf, 0.11 * wf, 0.09 * wf, c.skin), 0, -0.055 * wf)));
    sh.add(ua); ua.add(fa); fa.add(hand); chest.add(sh);
    return { sh, ua, fa, hand };
  };
  const L = arm(-1), R = arm(1);
  // legs
  const leg = (side: 1 | -1): Leg => {
    const th = node(`thigh.${side < 0 ? 'L' : 'R'}`, side * Math.max(0.08, spec.stance / 2 - 0.1), -0.02, side < 0 ? (spec.footFwdL ?? 0) : 0);
    th.add(mesh(xf(prism(0.08 * wf, 0.07 * wf, 0.24 * lf, c.dark), 0, -0.12 * lf)));
    const sh = node(`shin.${side < 0 ? 'L' : 'R'}`, 0, -0.24 * lf);
    sh.add(mesh(xf(prism(0.065 * wf, 0.06 * wf, 0.30 * lf, c.dark), 0, -0.15 * lf)));
    const foot = node(`foot.${side < 0 ? 'L' : 'R'}`, 0, -0.30 * lf);
    foot.add(mesh(xf(box(0.14 * wf, 0.20 * lf, 0.22, c.dark), 0, -0.10 * lf, 0.03)));
    foot.add(mesh(xf(box(0.15 * wf, 0.06 * lf, 0.06, c.accent), 0, -0.17 * lf, 0.12)));
    th.add(sh); sh.add(foot); hips.add(th);
    th.rotation.z = side * -0.12 * (spec.stance / 0.42);
    foot.rotation.y = side * (spec.toesOut ?? 0);
    return { th, sh, foot };
  };
  const LL = leg(-1), RL = leg(1);
  const bones: Bones = { root, spin, hips, spine, chest, neck, head, L, R, LL, RL, eyes, pupils, brows, mouth, tongue, tf, lf, wf, hr };

  // selection ring (§2.7.5): soft gradient + crisp rim, additive, bloom layer.
  // T-41: the ring sits *in* the world, so it takes the world's bend. Its vertex shader repeats
  // material.ts's two lines (world y −= uCurve · d² from uCurveCenter) on the same shared uniform
  // objects — passed by reference, never copied, so the ring follows when a scene re-centres the
  // curve or K steps it. Without this the body bends and the ring does not, and the ring climbs the
  // kid's legs as they walk away from the station (0.54 m at 30 m).
  const ringU = {
    uColor: { value: new THREE.Color(c.glow) }, uAlpha: { value: 0.35 },
    uCurve: WORLD_U.uCurve, uCurveCenter: WORLD_U.uCurveCenter,
  };
  // T-61c: the ring also takes the *ground's* steps. `aLift` is one float per vertex, added to world
  // y **after** the curve term (never folded into it: the curve rides the shared uniform objects by
  // reference and a copy would re-break T-41). On flat ground every lift is 0 and the frame is the
  // one it was; on the caves' relieved tiers the ring drapes over the column tops it lies on instead
  // of demanding a flat one.
  //
  // Round 2, fix A4: the ring is built on **three** radial rings — 0.45, 0.62 and 0.84 — so that
  // heroes.md §2.7.5's crisp rim at 0.62, the edge the eye actually reads, is a real vertex ring
  // whose lift is *sampled* rather than interpolated. With two rings (round 1) the rim ramped
  // straight across a step: measured 0.2533 m of error on 8 of 20 stands over the caves' 0.54 m
  // relief. Verified against three r185 before relying on it: `RingGeometry(0.45, 0.84, 48, 2)` is
  // **147 vertices / 576 indices** in three concentric rings of 49 — but its radii are evenly
  // spaced, so its middle ring lands at 0.645, *not* at 0.62; those 49 vertices are pulled in to
  // exactly 0.62 here. 147 vertices is 147 `groundY` calls per moved kid per frame (588 for four).
  const ringGeo = new THREE.RingGeometry(0.45, 0.84, 48, 2);
  {
    const rp = ringGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < rp.count; i++) {
      const x = rp.getX(i), y = rp.getY(i), r = Math.hypot(x, y);
      if (Math.abs(r - 0.645) < 1e-6) rp.setXY(i, (x / r) * 0.62, (y / r) * 0.62);
    }
    rp.needsUpdate = true;
  }
  const ringPos = ringGeo.getAttribute('position') as THREE.BufferAttribute;
  const ringN = ringPos.count;
  const ringLift = new Float32Array(ringN);
  const ringLiftAttr = new THREE.BufferAttribute(ringLift, 1);
  ringGeo.setAttribute('aLift', ringLiftAttr);
  /** The world xz each lift was sampled at (the *breathed* radius of the frame it was taken on):
   *  what a probe has to raycast if it is to compare like with like. */
  const ringXZ = new Float32Array(ringN * 2);
  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.ShaderMaterial({
      uniforms: ringU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2,
      vertexShader: `varying vec2 vP; uniform float uCurve; uniform vec2 uCurveCenter; attribute float aLift;
        void main(){ vP = position.xy;
          vec4 ssW = modelMatrix * vec4(position, 1.0);
          float ssD = length(ssW.xz - uCurveCenter);
          ssW.y -= uCurve * ssD * ssD;
          ssW.y += aLift;
          gl_Position = projectionMatrix * viewMatrix * ssW; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying vec2 vP; void main(){ float r = length(vP);
        float soft = uAlpha * (1.0 - smoothstep(0.55, 0.80, r)) * smoothstep(0.45, 0.55, r);
        float rim = 0.7 * (1.0 - smoothstep(0.02, 0.035, abs(r - 0.62)));
        gl_FragColor = vec4(uColor * 1.4, max(soft, rim)); }`,
    }),
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.layers.enable(BLOOM_LAYER); // T-56: the ring sits at +0.04, above a stepped tier's column-top tolerance (0.05 m), with the polygon offset
  const ringScale = 0.7 + 0.3 * (spec.legs / 0.78);
  root.add(ring);
  // the per-frame conform: refreshed on any frame the kid has moved more than 0.02 m (and once at
  // the start), timed so a probe can quote the cost. `ring.rotation.x = −90°` maps the ring's own
  // (x, y, 0) to (x, 0, −y); then the root's yaw and position put it in the world.
  let ringMs = 0, ringDone = false;
  const ringLast = new THREE.Vector3(1e9, 0, 1e9);
  const updateRingLift = (): void => {
    if (!ground) return;
    const t0 = performance.now();
    const s = ring.scale.x, cy = Math.cos(root.rotation.y), sy = Math.sin(root.rotation.y);
    const rx = root.position.x, rz = root.position.z, ryy = root.position.y;
    for (let i = 0; i < ringN; i++) {
      const lx = ringPos.getX(i) * s, lz = -ringPos.getY(i) * s;
      const wx = rx + lx * cy + lz * sy, wz = rz - lx * sy + lz * cy;
      ringXZ[i * 2] = wx; ringXZ[i * 2 + 1] = wz;
      ringLift[i] = THREE.MathUtils.clamp(ground(wx, wz) - ryy, -0.6, 0.8);
    }
    ringLiftAttr.needsUpdate = true;
    ringMs = performance.now() - t0;
  };
  const ringLight = new THREE.PointLight(c.glow, 3, 3, 2);
  ringLight.position.y = 0.3;
  root.add(ringLight);

  const hooks = extras(bones, h);
  const lookAt = new THREE.Vector3(0, 0.6, 0);
  let blend = 0, flT = -100, armed = false, lookYaw = 0, lookPitch = 0;
  const tmp = new THREE.Vector3();
  const seedPh = spec.name.length * 0.9;
  // the kid's own ground speed, from the root's travel (T-45 needs the speed class and the rig is
  // only told `walking`); eased at 6/s so the class change is never a pop (Tier-0 rule 3)
  let speed = 0, tracked = false;
  const lastPos = new THREE.Vector3();
  let ground: ((x: number, z: number) => number) | null = null;
  const groundRel = (lx: number, lz: number): number => {
    if (!ground) return 0;
    const s = Math.sin(root.rotation.y), c = Math.cos(root.rotation.y);
    return THREE.MathUtils.clamp(ground(root.position.x + lx * c + lz * s, root.position.z - lx * s + lz * c) - root.position.y, -0.15, 0.15);
  };
  const update = (t: number, dt: number, walking: boolean) => {
    if (armed) { armed = false; flT = t; } // the flourish starts on the scene clock, not wall time
    if (dt > 0) {
      const inst = tracked ? Math.hypot(root.position.x - lastPos.x, root.position.z - lastPos.z) / dt : 0;
      if (inst < 12) speed += (inst - speed) * Math.min(1, dt * 6); // 12 m/s is a station placement, not a step
      lastPos.copy(root.position);
      tracked = true;
    }
    blend += ((walking ? 1 : 0) - blend) * Math.min(1, dt * 5);
    const idle = 1 - blend;
    const breath = Math.sin(t * 1.5 + seedPh);
    chest.scale.setScalar(1 + 0.015 * breath * idle);
    L.sh.position.y = 0.17 * tf + 0.004 * breath * idle; R.sh.position.y = 0.17 * tf + 0.004 * breath * idle;
    const cyc = ((t + seedPh) % 4.2) / 4.2;
    const shift = cyc > 0.5 && cyc < 0.62 ? (cyc - 0.5) / 0.12 : cyc >= 0.62 && cyc < 0.86 ? 1 : cyc >= 0.86 && cyc < 0.98 ? 1 - (cyc - 0.86) / 0.12 : 0;
    hips.position.x = 0.02 * shift * idle;
    // head look-at (yaw ±40°, pitch ±15°), eased
    root.worldToLocal(tmp.copy(lookAt));
    // the look values are tracked here and SET on the head each frame, so a kid hook may add to
    // head.rotation without the addition accumulating through the easing (it did: a 118° pitch)
    const yawT = THREE.MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -0.7, 0.7);
    lookYaw += (yawT - lookYaw) * Math.min(1, dt * 6);
    const pitchT = THREE.MathUtils.clamp(-Math.atan2(tmp.y - (spec.legs + spec.torso), Math.hypot(tmp.x, tmp.z)), -0.26, 0.26) * 0.6;
    lookPitch += (pitchT - lookPitch) * Math.min(1, dt * 6);
    head.rotation.set(lookPitch, lookYaw, 0);
    // blink: 0.15 s every 4 s, staggered; pupils hidden while closed (v27 rule)
    const closed = ((t + seedPh * 1.7) % 4) > 3.85;
    const lid = closed ? 0.1 : spec.eye.lid;
    for (const e of eyes) e.scale.y += (lid - e.scale.y) * Math.min(1, dt * 30);
    for (const p of pupils) p.visible = !closed;
    // walk clip (1.0 s loop, two steps): legs, arms, hip bob, a little spine twist
    const w = t * 6.283;
    const sw = Math.sin(w) * blend;
    LL.th.rotation.x = 0.52 * sw; RL.th.rotation.x = -0.52 * sw;
    LL.sh.rotation.x = Math.max(0, -Math.sin(w - 0.5)) * 0.6 * blend; RL.sh.rotation.x = Math.max(0, Math.sin(w - 0.5)) * 0.6 * blend;
    R.sh.rotation.x = 0.44 * sw; L.sh.rotation.x = -0.3 * sw;
    L.sh.rotation.z = 0; R.sh.rotation.z = 0; L.ua.rotation.x = 0; R.ua.rotation.x = 0; L.fa.rotation.x = 0; R.fa.rotation.x = 0;
    hips.position.y = spec.legs + 0.02 * Math.abs(Math.sin(w)) * blend;
    spine.rotation.y = 0.07 * sw; spine.rotation.x = 0;
    head.rotation.y -= 0.035 * sw;
    const rs = 1 + 0.06 * Math.sin(t * 5.236);
    ring.scale.setScalar(rs * ringScale);
    if (!ringDone || ringLast.distanceToSquared(root.position) > 0.0004) { updateRingLift(); ringLast.copy(root.position); ringDone = true; }
    else ringMs = 0;
    const fl = t - flT;
    hooks.update({ t, dt, idle, blend, w, fl: fl >= 0 && fl < hooks.flourishLen ? fl : -1, look: tmp, speed, groundRel });
  };
  const probe = ssProbeReg();
  probe['world'] = () => ({ curve: WORLD_U.uCurve.value, center: [WORLD_U.uCurveCenter.value.x, WORLD_U.uCurveCenter.value.y] });
  probe[`${spec.name.toLowerCase()}.rig`] = () => ({
    speed, blend,
    ring: { y: ring.position.y, scale: ring.scale.x, visible: ring.visible, verts: ringN, ms: ringMs, lift: Array.from(ringLift), xz: Array.from(ringXZ) },
    root: [root.position.x, root.position.y, root.position.z],
    armSwing: { r: R.sh.rotation.x, l: L.sh.rotation.x },
  });
  return {
    name: spec.name, colours: c, root, bones, ring, ringLight, lookAt, update,
    flourish: () => { armed = true; },
    setGround: (fn) => { ground = fn; },
    face: (bearing) => { root.rotation.y = ((180 - bearing) * Math.PI) / 180; },
  };
}
