// The west rim's peaceful layer (OPUS_EXPERIMENT_BRIEF.md §3.5): a fox trotting the rim path with
// its nose down, pausing three seconds at each end to look at the camp; a fishing bobber on the pond
// that dips every 6–9 s; and three songbirds that burst from the nearest birch when Liam passes
// under it and land again 6 s later. The deer is the Forest scene's own, imported.
//
// Fix pass 2026-09-08 (`docs/qa/briefs/opus-fixes-rim.md`):
//   * the route ends are handed in, found by marching with `inside()` (they were hard-coded at
//     x −50, which is off the plate for the whole 40 m — the fox trotted over the void);
//   * the trot/look heading is one eased, wrapped value (the old line multiplied by `foxDir > 0 ? 1
//     : 1`, a no-op, and snapped 180° at every pause);
//   * the burst fires at `≤ 5 m` (Liam stood at exactly 5.00 and the test was `< 5`, so the burst
//     had never run at load);
//   * the bobber floats at the pond's waterline instead of under it, and carries its own ripple
//     rings — the Forest pond is `terrain.ts`'s ribbon mesh, whose shader has no ripple centre
//     (`_shared/water.ts`'s `uRipples` belongs to `makeWaterSheet`, which the pond does not use);
//   * the birch the songbirds burst from is *planted* here. The nearest Forest trunk to the
//     stream's last bend is 16.3 m away at (−29.75, 33.8), so the first pass's perch at (−45, 30)
//     hung three birds in mid-air. The geometry is the Forest's birch recipe copied in (the caves'
//     `fallMat` precedent), not imported: `forest-dusk/scatter.ts` does not export it.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { rng } from '../_shared/rng';
import { C } from '../_shared/style';
import { groundY, POND } from '../forest-dusk/terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** The pond's surface (`terrain.ts` builds the pond disc at y −0.30). */
export const POND_Y = -0.3;

export interface LifeState {
  fox: { u: number; dir: number; pause: number; x: number; z: number; heading: number; speed: number };
  birds: { age: number; airborne: number; out: number[]; heroToBirch: number; pos: [number, number, number][] };
  bobber: { y: number; dip: number; sinceDip: number; nextDip: number; rings: number[] };
}

export interface Life {
  group: THREE.Group;
  /** The ripple centre the pond carries: the bobber's own rings ride on it. */
  bobber: THREE.Vector3;
  /** Both ends of the fox's route, as placed (the caller marched them). */
  route: [THREE.Vector2, THREE.Vector2];
  update: (t: number, dt: number, hero: THREE.Vector3) => void;
  poi: () => THREE.Vector3 | null;
  burstNow: () => string;
  /** Every number a stepped probe needs; nothing here is read from the HUD's DOM text. */
  state: () => LifeState;
  hud: () => string;
}

/** How close Liam has to be to the birch for the burst (m). */
export const BURST_R = 5;

/** The Forest's birch, copied from `forest-dusk/scatter.ts`'s unexported `birchGeo` so this scene
 *  can plant one at the stream's last bend: a peeling trunk and three leaf blobs. */
function birchGeo(h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = colorize(new THREE.CylinderGeometry(0.09, 0.13, h * 0.62, 6), C.cream);
  trunk.translate(0, h * 0.31, 0);
  const p = trunk.getAttribute('position') as THREE.BufferAttribute, c = trunk.getAttribute('color') as THREE.BufferAttribute;
  const bark = new THREE.Color(C.bark);
  for (let k = 0; k < p.count; k++) if (Math.sin(p.getY(k) * 9) > 0.55) c.setXYZ(k, bark.r, bark.g, bark.b);
  parts.push(trunk);
  const cols = [C.moss, C.birchLeaf, C.moss];
  const blobs: [number, number, number, number][] = [[0, h * 0.72, 0, h * 0.22], [h * 0.14, h * 0.6, h * 0.08, h * 0.16], [-h * 0.12, h * 0.85, -h * 0.06, h * 0.15]];
  blobs.forEach(([x, y, z, rr], i) => parts.push(xf(colorize(new THREE.IcosahedronGeometry(rr, 1), cols[i]!), x, y, z)));
  return mergeGeos(parts);
}

/** `birchBase` is the trunk's foot on the ground; the birds perch 3.9 m up it. */
export function makeLife(birchBase: THREE.Vector3, route: [THREE.Vector2, THREE.Vector2]): Life {
  const group = new THREE.Group();
  const r = rng(809);
  const mat = makeWorldMaterial({ roughness: 0.95 });
  const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const [FOX_A, FOX_B] = route;
  const BIRCH_H = 5.4;   // the Forest's birches are 4.5–7 m; a taller crown fills the close-up
  const tree = new THREE.Mesh(birchGeo(BIRCH_H), makeWorldMaterial({ sway: 0.012 }));
  tree.position.copy(birchBase); tree.castShadow = true; tree.receiveShadow = true;
  group.add(tree);
  const birch = birchBase.clone().add(new THREE.Vector3(0, BIRCH_H * 0.61, 0));

  // ---- the fox: a 0.6 m ember wedge with a white tail tip, four stub legs, ears (built along +x) --
  const fox = new THREE.Group();
  const foxBody = new THREE.Group();
  foxBody.add(mesh(mergeGeos([
    xf(colorize(new THREE.IcosahedronGeometry(0.15, 0), '#D87828').scale(1.9, 0.9, 0.95), 0, 0.28),
    xf(colorize(new THREE.ConeGeometry(0.10, 0.24, 5), '#D87828').rotateZ(-Math.PI / 2), 0.30, 0.30),
    ...[-1, 1].map((s) => xf(colorize(new THREE.ConeGeometry(0.045, 0.11, 3), '#D87828'), 0.20, 0.42, s * 0.06)),
    ...[-1, 1].map((s) => xf(B(0.03, 0.03, 0.02, '#2C3E50'), 0.28, 0.32, s * 0.05)),
    ...([[0.13, 0.07], [0.13, -0.07], [-0.13, 0.07], [-0.13, -0.07]] as [number, number][]).map(([x, z]) => xf(CY(0.026, 0.022, 0.26, 4, '#8B4513'), x, 0.13, z)),
    xf(colorize(new THREE.ConeGeometry(0.085, 0.36, 5), '#D87828').rotateZ(1.1), -0.30, 0.34),
    xf(colorize(new THREE.IcosahedronGeometry(0.055, 0), C.cream), -0.46, 0.44),
  ])));
  fox.add(foxBody); group.add(fox);
  const ROUTE_LEN = FOX_A.distanceTo(FOX_B);
  const TRAVEL = Math.atan2(FOX_B.x - FOX_A.x, -(FOX_B.y - FOX_A.y)); // the route's bearing, A → B
  let foxU = 0, foxDir = 1, foxPause = 0, foxSpeed = 0;
  let foxHeading = TRAVEL, foxLean = 0.16;

  // ---- the bobber on the pond: red and white, dipping 0.05 m every 6–9 s -------------------------
  const bob = new THREE.Group();
  // the waterline sits between the white ball and the red one (local y 0.03), so the group rides
  // 0.03 m below the pond's surface and the red half shows: the first pass sat 0.09 m under it
  const bobber = new THREE.Vector3(POND.x, POND_Y - 0.03, POND.z);
  bob.position.copy(bobber);
  bob.add(mesh(mergeGeos([
    colorize(new THREE.SphereGeometry(0.06, 7, 5), '#D64B3A').translate(0, 0.06, 0),
    colorize(new THREE.SphereGeometry(0.058, 7, 5), '#EDE3CF').translate(0, 0.0, 0),
    CY(0.008, 0.008, 0.09, 4, C.iron).translate(0, 0.14, 0),
  ])));
  group.add(bob);
  let dipT = 0, dipNext = 6 + r() * 3;

  // the bobber's rings: two thin discs on the water, one on the dip and one idling on its own rate
  // (T-06 asks for two incommensurate rates and no pop; both fade in and out over ≥ 0.5 s)
  const RING_PERIOD = [2.4, 3.7];
  const rings = RING_PERIOD.map(() => {
    const g = colorize(new THREE.RingGeometry(0.86, 1.0, 20), C.foam);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, makeWorldMaterial({ roughness: 0.4, transparent: true, opacity: 0 }));
    m.renderOrder = 3;
    m.position.set(bobber.x, POND_Y + 0.06, bobber.z);
    group.add(m);
    return m;
  });

  // ---- three songbirds on the nearest birch ------------------------------------------------------
  const HUES = ['#F0C040', '#8FD3F4', '#38A866'];
  const birds = HUES.map((hex, i) => {
    const root = new THREE.Group();
    root.add(mesh(mergeGeos([
      xf(colorize(new THREE.IcosahedronGeometry(0.06, 0), hex).scale(1.4, 1, 1), 0, 0),
      xf(colorize(new THREE.IcosahedronGeometry(0.04, 0), hex), 0.07, 0.035),
      xf(colorize(new THREE.ConeGeometry(0.015, 0.05, 3), '#E8A838').rotateZ(-Math.PI / 2), 0.11, 0.035),
      xf(B(0.09, 0.012, 0.03, hex), -0.09, 0.01),
    ])));
    const wings = [-1, 1].map((s) => {
      const g = colorize(new THREE.PlaneGeometry(0.10, 0.13), hex);
      g.rotateX(-Math.PI / 2); g.translate(0, 0, 0.065 * s);
      const w = mesh(g); root.add(w); return w;
    });
    const perch = birch.clone().add(new THREE.Vector3((i - 1) * 0.4, 0.1 * (i % 2), 0.7 - i * 0.6));
    root.position.copy(perch);
    group.add(root);
    return { root, wings, perch, // they break upward and outward, but stay inside a station that looks down at 38°
      target: perch.clone().add(new THREE.Vector3(Math.cos(i * 2.1 + 1.4) * 2.8, 1.5 + i * 0.45, Math.sin(i * 2.1 + 1.4) * 2.8)), phase: i * 0.41 };
  });
  let burstT = -100, armed = true, pending = false, nowT = 0;
  const birdOut = [0, 0, 0];
  let airborne = 0, heroToBirch = Infinity;
  const ringAlpha = [0, 0];

  const poiV = new THREE.Vector3();
  let poiSet = false;

  const update = (t: number, dt: number, hero: THREE.Vector3): void => {
    poiSet = false; nowT = t;
    if (pending) { pending = false; burstT = t; }
    // the fox: 0.9 m/s along the rim path, nose down, 3 s at each end looking at the camp
    const u0 = foxU;
    if (foxPause > 0) foxPause -= dt;
    else if (dt > 0) {                            // a zero-dt frame must not trip the end test
      foxU += (foxDir * 0.9 * dt) / ROUTE_LEN;
      if (foxU >= 1) { foxU = 1; foxDir = -1; foxPause = 3; }
      if (foxU <= 0) { foxU = 0; foxDir = 1; foxPause = 3; }
    }
    if (dt > 0) foxSpeed = (Math.abs(foxU - u0) * ROUTE_LEN) / dt;
    const fp = FOX_A.clone().lerp(FOX_B, foxU);
    fox.position.set(fp.x, groundY(fp.x, fp.y), fp.y);
    const looking = foxPause > 0;
    // built along +x, so the bearing conversion is 90° − bearing; the heading is eased the short way
    // round and kept in [−π, π] so a turn never goes the long way (LESSONS.md Rigs)
    const want = looking ? Math.atan2(-fp.x, fp.y) : wrapPi(TRAVEL + (foxDir > 0 ? 0 : Math.PI));
    foxHeading = wrapPi(foxHeading + wrapPi(want - foxHeading) * Math.min(1, dt * 4));
    fox.rotation.y = Math.PI / 2 - foxHeading;
    foxLean += ((looking ? 0 : 0.16) - foxLean) * Math.min(1, dt * 4); // nose down while it trots
    foxBody.rotation.z = foxLean;
    foxBody.position.y = 0.02 * Math.abs(Math.sin(t * 7)) * (foxLean / 0.16);
    if (!poiSet && looking) { poiV.set(fp.x, 0.5, fp.y); poiSet = true; }
    // the bobber: a 0.05 m dip every 6–9 s, and it bobs on the water between
    if (t - dipT > dipNext) { dipT = t; dipNext = 6 + r() * 3; }
    const da = t - dipT;
    const dip = da < 0.6 ? Math.sin((da / 0.6) * Math.PI) : 0;
    bob.position.y = bobber.y + 0.02 * Math.sin(t * 1.3) - 0.05 * dip;
    bob.rotation.z = 0.12 * Math.sin(t * 0.9) - 0.2 * dip;
    // the rings: one rides the dip, one idles on its own period; both ease in and out
    rings.forEach((ring, i) => {
      const period = RING_PERIOD[i]!;
      const age = i === 0 ? da : (t + period * 0.37) % period;
      const u = Math.min(1, age / period);
      const rad = 0.14 + u * (i === 0 ? 1.7 : 0.9);
      ring.scale.set(rad, 1, rad);
      const a = (i === 0 ? 0.5 : 0.22) * THREE.MathUtils.smoothstep(u, 0, 0.18) * (1 - THREE.MathUtils.smoothstep(u, 0.35, 1));
      ringAlpha[i] = a;
      ring.material.opacity = a;
      ring.visible = a > 0.002;
    });
    // the songbirds: a kid within 5 m of the birch sends all three up; back at +6 s
    heroToBirch = Math.hypot(hero.x - birch.x, hero.z - birch.z);
    const under = heroToBirch <= BURST_R;
    if (under && armed && t - burstT > 8) { burstT = t; armed = false; }
    if (!under) armed = true;
    const age = t - burstT;
    airborne = 0;
    birds.forEach((b, i) => {
      const out = THREE.MathUtils.smoothstep(age, 0, 1.3) * (1 - THREE.MathUtils.smoothstep(age, 4.6, 6.0));
      birdOut[i] = out;
      b.root.position.lerpVectors(b.perch, b.target, out);
      b.root.position.x += Math.sin(t * 1.3 + b.phase * 6) * 0.7 * out;
      b.root.position.z += Math.cos(t * 1.1 + b.phase * 6) * 0.7 * out;
      if (b.root.position.y - b.perch.y > 0.5) airborne++;
      const flap = out > 0.02 ? Math.sin(t * 24 + b.phase * 9) : Math.sin(t * 2.0 + b.phase * 5) * 0.12;
      b.wings.forEach((w, k) => { w.rotation.x = (k ? -1 : 1) * (0.3 + 0.7 * flap) * (out > 0.02 ? 1 : 0.25); });
      b.root.rotation.y = out > 0.02 ? Math.atan2(b.target.x - b.perch.x, b.target.z - b.perch.z) + t * 0.4 : b.phase * 2;
      if (out > 0.3 && !poiSet) { poiV.copy(b.root.position); poiSet = true; }
    });
  };
  return {
    group, bobber, route, update,
    poi: () => (poiSet ? poiV : null),
    burstNow: () => { pending = true; return 'the birds go up'; },
    state: () => ({
      fox: { u: foxU, dir: foxDir, pause: Math.max(0, foxPause), x: fox.position.x, z: fox.position.z, heading: foxHeading, speed: foxSpeed },
      birds: { age: nowT - burstT, airborne, out: [...birdOut], heroToBirch, pos: birds.map((b) => [b.root.position.x, b.root.position.y, b.root.position.z] as [number, number, number]) },
      bobber: { y: bob.position.y, dip: bobber.y - bob.position.y, sinceDip: nowT - dipT, nextDip: dipNext, rings: [...ringAlpha] },
    }),
    hud: () => `fox ${foxPause > 0 ? 'looking at the camp' : 'trotting'} u ${foxU.toFixed(2)} at (${fox.position.x.toFixed(1)}, ${fox.position.z.toFixed(1)}) · bobber dips every 6–9 s · songbirds ${nowT - burstT < 6 ? `up (${airborne} airborne)` : 'perched'}`,
  };
}
