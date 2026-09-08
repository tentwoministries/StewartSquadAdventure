// WASD walking for the demo scenes (Andrew, 2026-09-07; lifted from the Forest scene so every
// scene walks the same way): camera-relative movement on the terrain, a smooth turn toward the
// movement direction, a damped camera follow with a little look-ahead (Brief §4.5), and a soft
// push out of prop footprints and trunks. Not the game's controller: no sim, no collision mesh,
// no dodge. Shift runs, double-tap shift locks a sprint (T-44). Speeds from heroes.md §2.0 (run
// 4.5 m/s, the sprint 1.2 × it) and §2.7.4 (walk ≤ 2.0 m/s).
// The walked hero can be swapped (Tab in the Crystal Caves scene): the heading is re-read from it.
import * as THREE from 'three';
import type { Orbit } from './orbit';

export interface Circle { x: number; z: number; r: number }

/** heroes.md §2.7.4: the walk loop is authored for ≤ 2.0 m/s. */
const WALK_TOP = 2.0;
/** heroes.md §2.0 speed table. The demo walks one kid per scene at Liam's 4.5 (the fastest of the
 *  four) rather than plumbing a per-kid speed through every scene; the game's controller reads the
 *  active hero's own row (Liam 4.5, Noah 4.375, Collette 4.125, Isabella 4.0). */
const RUN_TOP = 4.5;
/** T-44: the double-tap lock runs at 1.2 × the run speed — 5.4 m/s here. */
const SPRINT_MULT = 1.2;
const SPRINT_TAP = 0.3;   // two taps inside this window latch the lock
const SPRINT_CLEAR = 0.4; // ... and this long with no movement input lets it go

export interface Walk {
  pressed: Set<string>;
  moving: boolean;
  hero: THREE.Object3D;
  /** True while the double-tap sprint lock holds (T-44). */
  sprint: boolean;
  /** The top speed the walk is asking for this frame (m/s): 2.0 walk, 4.5 run, 5.4 sprint. */
  top: number;
  update: (dt: number) => void;
  setHero: (hero: THREE.Object3D) => void;
  /** Replace the blockers (a scene may drop the ones the hero starts inside). */
  setBlockers: (blockers: Circle[]) => void;
}

export interface WalkOpts {
  hero: THREE.Object3D;
  orbit: Orbit;
  groundY: (x: number, z: number) => number;
  blockers: Circle[];
  /** Ground below this height is water and a wall (the Forest's stream cut is below −0.25 m). */
  waterY?: number;
  /** Optional walkable test for scenes with holes (the caves' void). */
  walkable?: (x: number, z: number) => boolean;
  /** The hero's height above the ground the camera aims at. */
  eye?: number;
  /** The largest ground rise or drop one step may take (the caves' tiers); default unlimited. */
  maxStep?: number;
}

export function makeWalk(opts: WalkOpts): Walk {
  const { orbit, groundY } = opts;
  const waterY = opts.waterY ?? -0.25;
  const eye = opts.eye ?? 0.9;
  let blockers = opts.blockers;
  const pressed = new Set<string>();
  // The sprint lock (T-44): two shift taps within 0.3 s lock the run at 1.2 × the run speed until
  // there has been no movement input for 0.4 s or shift is tapped once more; holding shift alone is
  // the plain run. Both windows are counted on the *walk's own clock* — the seconds the scene hands
  // update() — not on performance.now(), so a stepped probe can latch the lock with six frames of
  // ssStep between the taps and no wall-clock time passing at all (Tier-0 rule 9, T-35).
  let simT = 0, lastTap = -10, idleFor = 0;
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // a held key's auto-repeat is not a second tap
    const k = e.key.toLowerCase();
    if (k === 'shift') {
      if (walk.sprint) walk.sprint = false;              // the next single tap clears the lock
      else if (simT - lastTap <= SPRINT_TAP) { walk.sprint = true; idleFor = 0; } // armed standing still: the
      lastTap = simT;                                    // clear window starts again from the tap
    }
    pressed.add(k);
  });
  window.addEventListener('keyup', (e) => pressed.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { pressed.clear(); walk.sprint = false; });
  const vel = new THREE.Vector3();
  const follow = new THREE.Vector3(...orbit.current.target);
  let heading = opts.hero.rotation.y; // rotation.y; the hero's eyes are on local +z
  let engaged = false; // the station frame holds until the first movement key (a station may not be centred on the hero)
  const walk: Walk = {
    pressed,
    moving: false,
    sprint: false,
    top: WALK_TOP,
    hero: opts.hero,
    setHero(h) { walk.hero = h; heading = h.rotation.y; vel.set(0, 0, 0); },
    setBlockers(b) { blockers = b; },
    update(dt) {
      const hero = walk.hero;
      // input in camera space: W is away from the camera, D is to its right
      const fwd = new THREE.Vector3(Math.sin((orbit.current.yaw * Math.PI) / 180), 0, -Math.cos((orbit.current.yaw * Math.PI) / 180));
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const dir = new THREE.Vector3();
      if (pressed.has('w') || pressed.has('arrowup')) dir.add(fwd);
      if (pressed.has('s') || pressed.has('arrowdown')) dir.sub(fwd);
      if (pressed.has('d') || pressed.has('arrowright')) dir.add(right);
      if (pressed.has('a') || pressed.has('arrowleft')) dir.sub(right);
      const wants = dir.lengthSq() > 0;
      if (wants) engaged = true; // a bare shift never engages the camera (LESSONS Camera row 1)
      simT += dt;
      idleFor = wants ? 0 : idleFor + dt;
      if (idleFor >= SPRINT_CLEAR) walk.sprint = false; // she stops, the lock lets go
      const top = walk.sprint ? RUN_TOP * SPRINT_MULT : pressed.has('shift') ? RUN_TOP : WALK_TOP;
      walk.top = top;
      const target = wants ? dir.normalize().multiplyScalar(top) : new THREE.Vector3();
      // acceleration and braking are eased (nothing pops): 8/s toward the target velocity
      vel.lerp(target, Math.min(1, dt * 8));
      const speed = vel.length();
      walk.moving = speed > 0.3;
      if (speed > 0.05) {
        // face the way we move, the short way round, eased
        const want = Math.atan2(vel.x, vel.z);
        let diff = want - heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        heading += diff * Math.min(1, dt * 10);
        hero.rotation.y = heading;
        const next = hero.position.clone().addScaledVector(vel, dt);
        // soft push out of footprints and trunks; the water is a wall
        for (const c of blockers) {
          const dx = next.x - c.x, dz = next.z - c.z, d = Math.hypot(dx, dz), r = c.r + 0.35;
          if (d < r && d > 0.001) { next.x = c.x + (dx / d) * r; next.z = c.z + (dz / d) * r; }
        }
        const ny = groundY(next.x, next.z);
        const ok = ny > waterY && (!opts.walkable || opts.walkable(next.x, next.z)) && (opts.maxStep === undefined || Math.abs(ny - groundY(hero.position.x, hero.position.z)) <= opts.maxStep);
        if (ok) { hero.position.x = next.x; hero.position.z = next.z; }
        else vel.multiplyScalar(0.5);
        hero.position.y = groundY(hero.position.x, hero.position.z);
      }
      // camera: damped follow of the hero with a little look-ahead in the direction of travel
      if (!engaged) return;
      const ahead = hero.position.clone().addScaledVector(vel, 0.35);
      ahead.y = hero.position.y + eye;
      follow.lerp(ahead, Math.min(1, dt * 3.5));
      orbit.current.target = [follow.x, follow.y, follow.z];
      orbit.apply();
    },
  };
  return walk;
}
