// The wander behaviour the Forest deer taught (docs/design/mockups/LOG.md s2–s5), lifted out so
// every biome's creatures share one tempo: graze → look → walk to a spot in a small patch → graze,
// fast start and slow arrival, a slow-into-tight-turn rule, the heading wrapped to [−π, π] every
// step, optional scripted routes on a key, and an eased "graze" weight the pose reads from.
// A creature owns its mesh and pose; this owns where it is and what it is doing.
import * as THREE from 'three';
import { rng } from './rng';

export interface Patch { x: number; z: number; r: number; avoid: { x: number; z: number; r: number }[] }
export type WanderState = 'graze' | 'walk' | 'look';

export interface WanderOpts {
  patch: Patch;
  speed: number; // m/s
  seed?: number;
  turnRate?: number; // rad/s (default 2.2)
  graze?: [number, number]; // seconds grazing between walks
  look?: [number, number]; // seconds of the look beat
  lookChance?: number; // 0..1 chance a graze ends in a look
  routes?: [number, number][][]; // scripted passes stepped by walkNow(), then wandering
  /** Minimum leg of a wander (m). */
  minLeg?: number;
}

export interface Wander {
  x: number; z: number; heading: number;
  state: WanderState;
  /** 0 head up → 1 head down, eased. */
  graze: number;
  /** 0 standing → 1 walking, eased; strideRate is the true speed over the nominal one. */
  stride: number; strideRate: number; walkPhase: number; speedNow: number;
  speed: { value: number };
  update: (dt: number) => void;
  park: (x: number, z: number, bearing: number) => void;
  walkNow: () => void;
  setRoute: (pts: [number, number][]) => void;
  /** rotation.y for a mesh built facing local +x. */
  rotY: () => number;
}

export function makeWander(o: WanderOpts): Wander {
  const r = rng(o.seed ?? 5);
  const turnRate = o.turnRate ?? 2.2;
  const grazeT = o.graze ?? [8, 14], lookT = o.look ?? [2, 4], lookChance = o.lookChance ?? 0.3, minLeg = o.minLeg ?? 2;
  const route: THREE.Vector2[] = [];
  let routeIdx = 0, scripted = 0, stateT = grazeT[0] + r() * (grazeT[1] - grazeT[0]);
  const w: Wander = {
    x: o.patch.x, z: o.patch.z, heading: 0, state: 'graze', graze: 1, stride: 0, strideRate: 1, walkPhase: 0, speedNow: 0,
    speed: { value: o.speed },
    setRoute(pts) { route.length = 0; for (const [x, z] of pts) route.push(new THREE.Vector2(x, z)); routeIdx = 0; w.state = 'walk'; stateT = 60; },
    walkNow() { if (o.routes && scripted < o.routes.length) w.setRoute(o.routes[scripted++]!); else pickWander(); },
    park(x, z, bearing) {
      w.x = x; w.z = z;
      const h = ((90 - bearing) * Math.PI) / 180;
      w.heading = Math.atan2(Math.sin(h), Math.cos(h));
      w.state = 'graze'; stateT = 9; w.graze = 1; w.stride = 0; scripted = 0;
    },
    rotY: () => w.heading,
    update(dt) {
      stateT -= dt;
      if (w.state === 'graze' && stateT <= 0) { if (r() < lookChance) { w.state = 'look'; stateT = lookT[0] + r() * (lookT[1] - lookT[0]); } else pickWander(); }
      else if (w.state === 'look' && stateT <= 0) pickWander();
      w.speedNow = 0;
      if (w.state === 'walk') {
        const wp = route[routeIdx];
        if (!wp || stateT <= 0) { w.state = 'graze'; stateT = grazeT[0] + r() * (grazeT[1] - grazeT[0]); }
        else {
          const dx = wp.x - w.x, dz = wp.y - w.z, dist = Math.hypot(dx, dz);
          const last = routeIdx === route.length - 1;
          if (dist < (last ? 0.35 : 0.9)) { routeIdx++; if (routeIdx >= route.length) { w.state = 'graze'; stateT = grazeT[0] + r() * (grazeT[1] - grazeT[0]); } }
          else {
            let remaining = dist;
            for (let k = routeIdx; k + 1 < route.length; k++) remaining += route[k]!.distanceTo(route[k + 1]!);
            const pace = 0.6 + 0.9 * THREE.MathUtils.smoothstep(remaining, 1.2, 5.0);
            const want = Math.atan2(-dz, dx);
            let diff = want - w.heading;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            const step = Math.max(-turnRate * dt, Math.min(turnRate * dt, diff));
            w.heading = Math.atan2(Math.sin(w.heading + step), Math.cos(w.heading + step));
            const align = 0.3 + 0.7 * (1 - THREE.MathUtils.smoothstep(Math.abs(diff), 0.35, 1.3));
            const sp = w.speed.value * pace * align * (last ? Math.min(1, dist / 0.9) : 1);
            w.x += Math.cos(w.heading) * sp * dt;
            w.z -= Math.sin(w.heading) * sp * dt;
            w.speedNow = sp;
            w.stride = Math.min(1, w.stride + dt * 2);
            w.strideRate = sp / Math.max(0.05, o.speed);
          }
        }
      }
      if (w.state !== 'walk') w.stride = Math.max(0, w.stride - dt * 2);
      w.walkPhase += dt * 6.283 * 0.95 * w.strideRate * w.stride;
      const wantGraze = w.state === 'graze' ? 1 : 0;
      w.graze += (wantGraze - w.graze) * Math.min(1, dt * 1.6);
    },
  };
  const pickWander = () => {
    for (let i = 0; i < 20; i++) {
      const a = r() * Math.PI * 2, dd = minLeg + r() * Math.max(0.5, o.patch.r - minLeg);
      const x = o.patch.x + Math.cos(a) * dd, z = o.patch.z + Math.sin(a) * dd;
      if (o.patch.avoid.some((c) => Math.hypot(c.x - x, c.z - z) < c.r)) continue;
      w.setRoute([[x, z]]); return;
    }
    w.setRoute([[o.patch.x, o.patch.z]]);
  };
  return w;
}

/** An ear flick / tail flick timer: returns 0..1 for a short beat every few seconds. */
export function flicker(seed: number, min = 2.5, spread = 3, width = 8): (t: number) => number {
  const r = rng(seed);
  let at = 0, next = min + r() * spread;
  return (t) => {
    if (t - at > next) { at = t; next = min + r() * spread; }
    return Math.max(0, 1 - Math.abs((t - at) - 0.2) * width);
  };
}
