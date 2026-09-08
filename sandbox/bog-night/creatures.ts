// Bog creatures (PHASE_0.75_ANIMALS_BRAINSTORM.md §3): frogs on the lily pads that sit, pulse
// their throats and jump pad to pad with a ripple; two herons on one leg in the shallows that lift
// off slowly when a kid comes within 7 m and land again across the water; turtles (a stack of
// three on one log: the wonder) and two on pads that slide off when approached; the giant snail
// whose eye-stalks follow the nearest kid; dragonflies by day; will-o'-wisps at night that drift
// a metre above the water, dim when looked at, and lead a curious kid toward the Witch's porch.
import * as THREE from 'three';
import { BOG as G } from '../_shared/biomes';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { BLOOM_LAYER } from '../_shared/post';
import { clamp, rng } from '../_shared/rng';
import type { Keyframe } from '../_shared/style';
import type { Kid } from '../_shared/rig';
import type { PadSpot } from './flora';
import { CAUSEWAY, HUT, JETTY, SNAIL, terrainY, WATER_Y } from './terrain';

const mat = makeWorldMaterial({ roughness: 0.95 });
const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Creatures {
  group: THREE.Group;
  update: (t: number, dt: number, kf: Keyframe, active: Kid, ripples: THREE.Vector2[]) => void;
  poi: () => THREE.Vector3 | null;
  hud: () => string[];
}

export function makeCreatures(padSpots: PadSpot[]): Creatures {
  const group = new THREE.Group();
  const r = rng(17);
  // ---- frogs on the *rendered* lily pads, near where the kid walks (T-49) -----------------------
  // The pads come from flora.ts (plain and flowered). A frog sits on a pad, hops to a *free* pad
  // within HOP metres, and never shares one: occupancy is claimed the moment it leaves the ground,
  // so a pad another frog is mid-air toward is taken. The bible's Bog row (world-events §2.7.1)
  // gives the silhouette (sit-and-jump), the 3 m flee radius and the landing bubble ring; the 20 s
  // no-jump guarantee is the demo's reading of "idle 4–12 s, then move".
  const FROG_N = 8;          // the demo's count; the bible's Bog row says 12
  const HOP = 4.0;           // m: the longest hop
  const NEAR_WALK = 12;      // m from the causeway/jetty: the frogs stay where the kid walks
  const MIN_SEP = 0.9;       // m: two usable pads are never closer, so two seated frogs never are
  const FLEE_R = 3;          // m (bible)
  const IDLE_MAX = 20;       // s without a jump: the next tick jumps
  const JUMP_T = 0.55;       // s of arc
  const TURN = 7;            // rad/s: the frog turns onto its line during the hop
  const PAD_TOP = 0.02;      // m above the pad's own surface
  const dRect = (x: number, z: number, x0: number, x1: number, z0: number, z1: number) =>
    Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
  const distToWalk = (x: number, z: number) => Math.min(
    dRect(x, z, CAUSEWAY.x0, CAUSEWAY.x1, CAUSEWAY.z0, CAUSEWAY.z1),
    dRect(x, z, JETTY.x - JETTY.w / 2, JETTY.x + JETTY.w / 2, JETTY.z0, JETTY.z1),
  );
  const frogGeo = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.13, 1), G.frog).scale(1.3, 0.8, 1.1), 0, 0.1), xf(B(0.2, 0.06, 0.16, G.frogBelly), 0, 0.03), xf(colorize(new THREE.IcosahedronGeometry(0.035, 0), '#F0D060'), 0.09, 0.19, 0.06), xf(colorize(new THREE.IcosahedronGeometry(0.035, 0), '#F0D060'), 0.09, 0.19, -0.06), xf(B(0.08, 0.04, 0.05, G.frog), -0.12, 0.05, 0.1, 0, 0, 0.6), xf(B(0.08, 0.04, 0.05, G.frog), -0.12, 0.05, -0.1, 0, 0, 0.6)]);
  // the usable pads: near the boards, then thinned so no two sit within MIN_SEP
  const pads: PadSpot[] = [];
  for (const p of padSpots) {
    if (distToWalk(p.x, p.z) > NEAR_WALK) continue;
    if (pads.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < MIN_SEP)) continue;
    pads.push(p);
  }
  // the hop graph: who is within HOP of whom
  const nbr: number[][] = pads.map((p, i) => {
    const list: number[] = [];
    pads.forEach((q, k) => { if (k !== i && Math.hypot(q.x - p.x, q.z - p.z) <= HOP) list.push(k); });
    return list;
  });
  // seats: only pads with two or more neighbours in range (so a seated frog always has somewhere to
  // go), spread as far apart as the graph allows
  const seatOf = (): number[] => {
    // nearest the boards first, so the frogs read from the causeway and the jetty
    const cand = pads.map((_, i) => i).filter((i) => nbr[i]!.length >= 2)
      .sort((a, b) => distToWalk(pads[a]!.x, pads[a]!.z) - distToWalk(pads[b]!.x, pads[b]!.z));
    for (let sep = 10; sep >= 1; sep -= 0.5) {
      const out: number[] = [];
      for (const i of cand) {
        if (out.every((s) => Math.hypot(pads[s]!.x - pads[i]!.x, pads[s]!.z - pads[i]!.z) >= sep)) out.push(i);
        if (out.length === FROG_N) return out;
      }
    }
    return cand.slice(0, FROG_N);
  };
  const seats = seatOf();
  const owner = new Int32Array(pads.length).fill(-1);
  interface Frog { m: THREE.Mesh; pad: number; jumpT: number; from: THREE.Vector2; to: THREE.Vector2; next: number; throat: number; heading: number; jumps: number }
  const frogs: Frog[] = [];
  seats.forEach((padIdx, i) => {
    const p = pads[padIdx]!;
    const m = mesh(frogGeo); m.position.set(p.x, p.y + PAD_TOP, p.z);
    const heading = r() * 6.283 - 3.1415;
    m.rotation.y = heading; group.add(m);
    owner[padIdx] = i;
    frogs.push({ m, pad: padIdx, jumpT: -10, from: new THREE.Vector2(p.x, p.z), to: new THREE.Vector2(p.x, p.z), next: 3 + r() * 6, throat: r() * 6, heading, jumps: 0 });
  });
  // ---- herons in the shallows -----------------------------------------------------------------
  const heronGeo = () => {
    const parts = [xf(colorize(new THREE.IcosahedronGeometry(0.28, 1), G.heron).scale(1.5, 0.8, 0.9), 0, 0.9), xf(CY(0.03, 0.035, 0.85, 4, G.heronDark), 0.05, 0.45, 0.08), xf(B(0.12, 0.09, 0.12, G.heronDark), -0.42, 0.75)];
    return mergeGeos(parts);
  };
  const herons: { root: THREE.Group; neck: THREE.Group; wings: THREE.Mesh[]; state: 'stand' | 'fly'; t0: number; from: THREE.Vector3; to: THREE.Vector3; dip: number }[] = [];
  for (const [x, z, yaw] of [[-20, 24, 0.4], [26, 18, 2.6]] as [number, number, number][]) {
    const root = node(x, terrainY(x, z), z); root.rotation.y = yaw;
    root.add(mesh(heronGeo()));
    const neck = node(0.3, 1.0, 0);
    neck.add(mesh(mergeGeos([xf(CY(0.05, 0.07, 0.55, 5, G.heron), 0.05, 0.28, 0, 0, 0, -0.5), xf(CY(0.04, 0.05, 0.45, 5, G.heron), 0.35, 0.65, 0, 0, 0, 0.6), xf(B(0.2, 0.16, 0.14, G.heron), 0.25, 0.9), xf(colorize(new THREE.ConeGeometry(0.03, 0.4, 4), '#E0B060').rotateZ(-Math.PI / 2), 0.55, 0.88), xf(B(0.03, 0.03, 0.03, '#1A1410'), 0.3, 0.95, 0.07), xf(B(0.03, 0.03, 0.03, '#1A1410'), 0.3, 0.95, -0.07)])));
    root.add(neck);
    const wings: THREE.Mesh[] = [];
    for (const s of [-1, 1]) { const w = mesh(colorize(new THREE.PlaneGeometry(0.9, 0.5, 2, 1), G.heronDark).translate(0, 0, s * 0.25).rotateX(-Math.PI / 2)); w.position.set(0, 1.05, s * 0.2); w.scale.set(0.3, 1, 0.3); root.add(w); wings.push(w); }
    group.add(root);
    herons.push({ root, neck, wings, state: 'stand', t0: 0, from: root.position.clone(), to: root.position.clone(), dip: r() * 8 });
  }
  // ---- turtles: the stack of three on a log by the snail's island, two loners on pads ----------
  const turtleGeo = (s: number) => mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.22 * s, 1), G.turtle).scale(1.25, 0.6, 1), 0, 0.14 * s), xf(B(0.12 * s, 0.08 * s, 0.1 * s, '#6A8A5A'), 0.28 * s, 0.1 * s), ...([[0.14, 0.16], [0.14, -0.16], [-0.14, 0.16], [-0.14, -0.16]] as [number, number][]).map(([x, z]) => xf(B(0.08 * s, 0.06 * s, 0.08 * s, '#6A8A5A'), x * s, 0.04 * s, z * s))]);
  const logX = SNAIL.x - 4.5, logZ = SNAIL.z + 4;
  const log = mesh(mergeGeos([CY(0.28, 0.3, 4, 7, '#3A2A1E').rotateZ(Math.PI / 2).translate(0, 0.1, 0)])); log.position.set(logX, WATER_Y + 0.05, logZ); log.rotation.y = 0.5; group.add(log);
  const stack: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) { const tm = mesh(turtleGeo(1 - i * 0.22)); tm.position.set(logX + Math.cos(0.5) * (0.4 - i * 0.05), WATER_Y + 0.38 + i * 0.26, logZ - Math.sin(0.5) * (0.4 - i * 0.05)); tm.rotation.y = 0.5 + (i - 1) * 0.3; group.add(tm); stack.push(tm); }
  const loners: { m: THREE.Mesh; home: THREE.Vector3; gone: number }[] = [];
  for (const [x, z] of [[-26, 10], [10, -4]] as [number, number][]) { const tm = mesh(turtleGeo(1)); tm.position.set(x, WATER_Y + 0.04, z); tm.rotation.y = r() * 6; group.add(tm); loners.push({ m: tm, home: tm.position.clone(), gone: -100 }); }
  // ---- the giant snail on its mossy log ---------------------------------------------------------
  const snail = node(SNAIL.x, terrainY(SNAIL.x, SNAIL.z) + 0.4, SNAIL.z);
  {
    const shell: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) { const s = 0.42 - i * 0.07; const a = i * 1.9; shell.push(xf(colorize(new THREE.IcosahedronGeometry(s, 1), i % 2 ? G.snail : '#6A4A7A', { color: new THREE.Color(G.snailGlow).multiplyScalar(0.25).getStyle(), glow: 1 }), Math.cos(a) * (0.42 - s) * 1.2, 0.5 + Math.sin(a) * (0.42 - s) * 0.6 + i * 0.03, (0.42 - s) * 0.5)); }
    const body = mergeGeos([xf(colorize(new THREE.IcosahedronGeometry(0.3, 1), '#8A9A6A').scale(2.2, 0.6, 1.1), 0.2, 0.15), xf(colorize(new THREE.IcosahedronGeometry(0.2, 1), '#8A9A6A').scale(1.4, 0.9, 1), 0.85, 0.3)]);
    snail.add(new THREE.Mesh(mergeGeos(shell), makeWorldMaterial({ emissive: true, roughness: 0.6 })), mesh(body));
    snail.children[0]!.layers.enable(BLOOM_LAYER);
    snail.add(mesh(mergeGeos([CY(0.3, 0.34, 3.6, 7, '#3A2A1E').rotateZ(Math.PI / 2).translate(0, -0.35, 0), B(2.6, 0.06, 0.5, G.hangMoss).translate(0, -0.05, 0.05)])));
    snail.rotation.y = 0.8; group.add(snail);
  }
  const stalks: THREE.Group[] = [];
  for (const s of [-1, 1]) { const st = node(1.0, 0.45, s * 0.1); st.add(mesh(xf(CY(0.025, 0.03, 0.4, 4, '#8A9A6A'), 0, 0.2))); st.add(mesh(xf(colorize(new THREE.IcosahedronGeometry(0.05, 0), '#1A1410'), 0, 0.42))); st.rotation.z = -0.5; snail.add(st); stalks.push(st); }
  // ---- dragonflies by day ------------------------------------------------------------------------
  const dfGeo = mergeGeos([xf(B(0.5, 0.03, 0.03, '#0B2B2E'), 0, 0), xf(colorize(new THREE.PlaneGeometry(0.42, 0.11), '#8FD3F4').rotateX(-Math.PI / 2), 0.05, 0.02, 0.22), xf(colorize(new THREE.PlaneGeometry(0.42, 0.11), '#8FD3F4').rotateX(-Math.PI / 2), 0.05, 0.02, -0.22)]);
  const dfMat = makeWorldMaterial({ side: THREE.DoubleSide, roughness: 0.4 });
  const dragonflies: { m: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; t0: number; dur: number; pause: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(dfGeo, dfMat); group.add(m);
    const p = new THREE.Vector3(-30 + r() * 50, WATER_Y + 0.4 + r() * 1.2, -12 + r() * 24);
    dragonflies.push({ m, from: p.clone(), to: p.clone(), t0: -1, dur: 1, pause: r() * 2 });
  }
  // ---- will-o'-wisps at night: three motes on paths toward the Witch's porch --------------------
  const wispMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(G.wisp).multiplyScalar(2.2), transparent: true, opacity: 0.9, depthWrite: false });
  const wisps: { m: THREE.Mesh; halo: THREE.Mesh; path: THREE.Vector3[]; u: number; alpha: number; out: number }[] = [];
  const wispPaths: [number, number][][] = [[[-14, 8], [-18, 14], [-22, 20], [-25, 24]], [[-34, 14], [-33, 20], [-30, 25]], [[-8, 20], [-14, 24], [-20, 27], [-24, 27]]];
  for (const wp of wispPaths) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), wispMat.clone()); m.layers.enable(BLOOM_LAYER);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: G.wisp, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.add(halo); group.add(m);
    wisps.push({ m, halo, path: wp.map(([x, z]) => new THREE.Vector3(x, WATER_Y + 1.0, z)), u: 0, alpha: 1, out: -100 });
  }

  const poiV = new THREE.Vector3(); let poiSet = false;
  const heroV = new THREE.Vector3(), tmp = new THREE.Vector3();
  let now = 0, seeded = false;
  const update = (t: number, dt: number, kf: Keyframe, active: Kid, ripples: THREE.Vector2[]) => {
    heroV.copy(active.root.position);
    now = t;
    poiSet = false;
    // frogs: sit with a throat pulse; hop to a *free* pad within HOP; the landing pad ripples
    // (the ring is permanent per slot, so the eight slots start under the eight frogs, not at the
    // coordinates terrain.ts seeded them with)
    if (!seeded) { frogs.forEach((f, i) => ripples[i]?.set(f.from.x, f.from.y)); seeded = true; }
    frogs.forEach((f, i) => {
      f.m.scale.y = 1 + 0.08 * Math.max(0, Math.sin(t * 2.8 + f.throat));
      const airborne = t - f.jumpT < JUMP_T;
      const dHero = Math.hypot(f.from.x - heroV.x, f.from.y - heroV.z);
      const flee = dHero < FLEE_R && t - f.jumpT > 1;     // the bible's 3 m flee radius
      const overdue = t - f.jumpT >= IDLE_MAX;            // nobody sits for twenty seconds
      if (!airborne && (t > f.next || flee || overdue)) {
        // a free neighbour that is itself connected: a frog never lands somewhere it cannot leave
        const free = nbr[f.pad]!.filter((k) => owner[k]! < 0 && nbr[k]!.length >= 2);
        let pick = -1;
        if (free.length) {
          // fleeing, take the pad that puts the most water between the frog and the kid
          if (flee) pick = free.reduce((best, k) => (Math.hypot(pads[k]!.x - heroV.x, pads[k]!.z - heroV.z) > Math.hypot(pads[best]!.x - heroV.x, pads[best]!.z - heroV.z) ? k : best), free[0]!);
          else pick = free[Math.min(free.length - 1, Math.floor(r() * free.length))]!;
        }
        if (pick >= 0) {
          owner[f.pad] = -1; owner[pick] = i;             // the target is taken while the frog is in the air
          f.pad = pick; f.to.set(pads[pick]!.x, pads[pick]!.z);
          f.jumpT = t; f.jumps++;
          f.next = t + 4 + r() * 8;
        } else f.next = t + 0.4;                          // every neighbour taken: try again shortly
      }
      const u = clamp((t - f.jumpT) / JUMP_T, 0, 1);
      const x = THREE.MathUtils.lerp(f.from.x, f.to.x, u), z = THREE.MathUtils.lerp(f.from.y, f.to.y, u);
      f.m.position.set(x, pads[f.pad]!.y + PAD_TOP + Math.sin(u * Math.PI) * 0.7, z);
      // turn onto the line of the hop, the short way, wrapped to [−π, π] every step
      if (f.from.distanceTo(f.to) > 0.01) {
        const want = Math.atan2(f.to.x - f.from.x, f.to.y - f.from.y) - Math.PI / 2;  // a +x-built creature: 90° − bearing
        let diff = want - f.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        const step = Math.max(-TURN * dt, Math.min(TURN * dt, diff));
        f.heading = Math.atan2(Math.sin(f.heading + step), Math.cos(f.heading + step));
        f.m.rotation.y = f.heading;
      }
      if (u >= 1 && f.from.distanceTo(f.to) > 0.01) { f.from.copy(f.to); const rp = ripples[i]; if (rp) rp.set(f.to.x, f.to.y); }
      if (!poiSet && u > 0 && u < 1 && Math.hypot(x - heroV.x, z - heroV.z) < 9) { poiV.set(x, WATER_Y + 0.4, z); poiSet = true; }
    });
    // herons: one-leg stand with a slow neck dip; a slow lift-off at 7 m, an arc across the water, a landing
    for (const h of herons) {
      const d = Math.hypot(h.root.position.x - heroV.x, h.root.position.z - heroV.z);
      if (h.state === 'stand') {
        const dip = Math.max(0, Math.sin((t + h.dip) * 0.4)) ** 4;
        h.neck.rotation.z = -0.5 * dip; h.root.position.y = terrainY(h.root.position.x, h.root.position.z) + 0.01 * Math.sin(t * 1.3);
        h.wings.forEach((w) => { w.scale.set(0.3, 1, 0.3); w.rotation.z = 0; });
        if (d < 7) { h.state = 'fly'; h.t0 = t; h.from.copy(h.root.position); const a = r() * 6.28; h.to.set(h.from.x + Math.cos(a) * 24, 0, h.from.z + Math.sin(a) * 24); h.to.x = THREE.MathUtils.clamp(h.to.x, -44, 48); h.to.z = THREE.MathUtils.clamp(h.to.z, -40, 40); h.to.y = Math.max(terrainY(h.to.x, h.to.z), WATER_Y - 0.1); }
      } else {
        const u = THREE.MathUtils.clamp((t - h.t0) / 5.0, 0, 1);
        const e = u * u * (3 - 2 * u);
        h.root.position.lerpVectors(h.from, h.to, e); h.root.position.y += Math.sin(u * Math.PI) * 7;
        h.root.rotation.y = Math.atan2(h.to.x - h.from.x, h.to.z - h.from.z) - Math.PI / 2 + Math.PI;
        const flap = Math.sin(t * 5.2) * 0.7 * (1 - THREE.MathUtils.smoothstep(u, 0.85, 1));
        h.wings.forEach((w, k) => { w.scale.set(1.3, 1, 1.3); w.rotation.z = (k === 0 ? 1 : -1) * flap; });
        h.neck.rotation.z = -0.3 * (1 - THREE.MathUtils.smoothstep(u, 0.7, 1));
        if (u >= 1) h.state = 'stand';
      }
      if (!poiSet && h.state === 'fly' && d < 15) { poiV.copy(h.root.position).add(tmp.set(0, 1, 0)); poiSet = true; }
    }
    // the stack of turtles: a slow breathing bob; loners slide off when a kid comes within 3 m
    stack.forEach((s, i) => { s.position.y = WATER_Y + 0.38 + i * 0.26 + 0.01 * Math.sin(t * 0.8 + i); });
    for (const l of loners) {
      const d = Math.hypot(l.m.position.x - heroV.x, l.m.position.z - heroV.z);
      if (l.gone < 0 && d < 3) l.gone = t;
      if (l.gone >= 0) {
        const u = t - l.gone;
        if (u < 1.2) { l.m.position.x = l.home.x + u * 0.5; l.m.position.y = l.home.y - u * 0.45; l.m.rotation.x = u * 0.5; }
        else if (u > 9) { l.gone = -100; l.m.position.copy(l.home); l.m.rotation.x = 0; }
        else l.m.position.y = -3;
      }
    }
    // the snail's eye-stalks follow the nearest kid
    const sa = Math.atan2(heroV.x - snail.position.x, heroV.z - snail.position.z) - snail.rotation.y;
    for (const st of stalks) { const want = THREE.MathUtils.clamp(Math.atan2(Math.sin(sa), Math.cos(sa)) - Math.PI / 2, -0.8, 0.8); st.rotation.y += (want - st.rotation.y) * Math.min(1, dt * 2); }
    // dragonflies by day: dart 2 m/s with 0.3 s pauses; hidden from dusk
    const day = kf.stars < 0.3;
    for (const df of dragonflies) {
      df.m.visible = day;
      if (t > df.t0 + df.dur + df.pause) { df.from.copy(df.to); df.to.set(THREE.MathUtils.clamp(df.from.x + (r() - 0.5) * 6, -32, 24), WATER_Y + 0.3 + r() * 1.4, THREE.MathUtils.clamp(df.from.z + (r() - 0.5) * 6, -14, 14)); df.t0 = t; df.dur = df.from.distanceTo(df.to) / 2; df.pause = 0.3 + r() * 0.4; }
      const u = THREE.MathUtils.clamp((t - df.t0) / df.dur, 0, 1);
      df.m.position.lerpVectors(df.from, df.to, u); df.m.rotation.y = Math.atan2(df.to.x - df.from.x, df.to.z - df.from.z) - Math.PI / 2 + Math.PI;
      df.m.rotation.z = Math.sin(t * 40) * 0.25;
    }
    // wisps: drift on a bob, dim when the kid looks at them, lead toward the porch when a kid is near, go out at the porch
    const fwd = tmp.set(Math.sin(active.root.rotation.y), 0, Math.cos(active.root.rotation.y));
    for (const w of wisps) {
      const n = w.path.length - 1;
      const seg = Math.min(n - 1, Math.floor(w.u)), f = w.u - seg;
      const p = new THREE.Vector3().lerpVectors(w.path[seg]!, w.path[seg + 1]!, f);
      w.m.position.set(p.x + 0.4 * Math.sin(t * 0.7 + seg), p.y + 0.25 * Math.sin(t * 1.1 + w.u), p.z + 0.4 * Math.cos(t * 0.5));
      const d = Math.hypot(w.m.position.x - heroV.x, w.m.position.z - heroV.z);
      if (d < 8 && w.u < n - 0.01) w.u = Math.min(n - 0.001, w.u + dt * 0.12);
      else if (d > 14 && w.u > 0) w.u = Math.max(0, w.u - dt * 0.05);
      const to = new THREE.Vector3(w.m.position.x - heroV.x, 0, w.m.position.z - heroV.z).normalize();
      const looked = fwd.dot(to) > 0.86 && d < 12 ? 0.25 : 1;
      const atPorch = Math.hypot(w.m.position.x - HUT.x, w.m.position.z - HUT.z) < 6;
      if (atPorch && w.out < 0) w.out = t;
      if (w.out >= 0 && t - w.out > 10) { w.out = -100; w.u = 0; }
      const target = (w.out >= 0 ? 0 : looked) * kf.fireflies;
      w.alpha += (target - w.alpha) * Math.min(1, dt * 2);
      (w.m.material as THREE.MeshBasicMaterial).opacity = 0.9 * w.alpha; (w.halo.material as THREE.MeshBasicMaterial).opacity = 0.2 * w.alpha;
      w.m.visible = w.alpha > 0.02;
      w.halo.lookAt(heroV.x, heroV.y + 8, heroV.z);
      if (!poiSet && w.alpha > 0.3 && d < 10) { poiV.copy(w.m.position); poiSet = true; }
    }
  };
  // the stepped probe's window on the frogs (LESSONS §0 rule 8: a mechanic is not built until a
  // probe has shown every state). Merged onto any ssProbe another module already installed.
  const gp = (globalThis as unknown as Record<string, Record<string, unknown>>);
  gp['ssProbe'] ??= {};
  gp['ssProbe']['frogs'] = () => frogs.map((f, i) => ({
    i, x: f.m.position.x, y: f.m.position.y, z: f.m.position.z,
    seatX: f.from.x, seatZ: f.from.y,
    pad: f.pad, padX: pads[f.pad]!.x, padZ: pads[f.pad]!.z, flower: pads[f.pad]!.flower,
    deg: nbr[f.pad]!.length, walk: distToWalk(f.from.x, f.from.y),
    jumps: f.jumps, airborne: now - f.jumpT < JUMP_T, sinceJump: now - f.jumpT,
    hop: Math.hypot(f.to.x - f.from.x, f.to.y - f.from.y), heading: f.heading,
  }));
  gp['ssProbe']['pads'] = () => ({
    rendered: padSpots.length, usable: pads.length, seats,
    minSep: MIN_SEP, hop: HOP, nearWalk: NEAR_WALK, fleeR: FLEE_R, idleMax: IDLE_MAX,
    degrees: nbr.map((n) => n.length),
    list: pads.map((p, i) => ({ i, x: p.x, z: p.z, y: p.y, flower: p.flower, deg: nbr[i]!.length, walk: distToWalk(p.x, p.z) })),
    owner: Array.from(owner),
  });
  return {
    group, update,
    poi: () => (poiSet ? poiV : null),
    hud: () => [`frogs ${frogs.length} on ${pads.length} lily pads (hop ≤ ${HOP} m to a free pad) · herons ${herons.map((h) => h.state).join('/')} · wisps ${wisps.map((w) => w.u.toFixed(1)).join(' ')} · the snail is watching`],
  };
}
