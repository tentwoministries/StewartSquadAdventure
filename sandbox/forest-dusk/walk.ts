// WASD walking for the demo (Andrew, 2026-09-07): camera-relative movement on the terrain, a smooth
// turn toward the movement direction, a damped camera follow with a little look-ahead (Brief §4.5),
// and a soft push out of prop footprints and trunks. Not the game's controller: no sim, no collision
// mesh, no dodge. Shift runs, double-tap shift locks a sprint (T-44; the shared walk.ts has the same
// lock). Speeds from heroes.md §2.0 (run 4.5 m/s, the sprint 1.2 × it) and §2.7.4 (walk ≤ 2.0 m/s).
import * as THREE from 'three';
import type { Orbit } from '../_shared/orbit';
import type { Circle } from './scatter';

const WALK_TOP = 2.0, RUN_TOP = 4.5, SPRINT_MULT = 1.2, SPRINT_TAP = 0.3, SPRINT_CLEAR = 0.4;

export interface Walk {
  pressed: Set<string>;
  moving: boolean;
  /** True while the double-tap sprint lock holds (T-44). */
  sprint: boolean;
  /** The top speed the walk is asking for this frame (m/s): 2.0 walk, 4.5 run, 5.4 sprint. */
  top: number;
  update: (dt: number) => void;
}

export function makeWalk(hero: THREE.Object3D, orbit: Orbit, groundY: (x: number, z: number) => number, blockers: Circle[], ring?: THREE.Object3D): Walk {
  const pressed = new Set<string>();
  // the sprint lock's two windows are counted on the walk's own clock (the dt this scene hands
  // update), never on performance.now() — the same rule as the shared walk (Tier-0 rule 9)
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
  let heading = hero.rotation.y; // rotation.y; the hero's eyes are on local +z
  const walk: Walk = {
    pressed,
    moving: false,
    sprint: false,
    top: WALK_TOP,
    update(dt) {
      // input in camera space: W is away from the camera, D is to its right
      const fwd = new THREE.Vector3(Math.sin((orbit.current.yaw * Math.PI) / 180), 0, -Math.cos((orbit.current.yaw * Math.PI) / 180));
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const dir = new THREE.Vector3();
      if (pressed.has('w') || pressed.has('arrowup')) dir.add(fwd);
      if (pressed.has('s') || pressed.has('arrowdown')) dir.sub(fwd);
      if (pressed.has('d') || pressed.has('arrowright')) dir.add(right);
      if (pressed.has('a') || pressed.has('arrowleft')) dir.sub(right);
      const wants = dir.lengthSq() > 0;
      simT += dt;
      idleFor = wants ? 0 : idleFor + dt;
      if (idleFor >= SPRINT_CLEAR) walk.sprint = false; // he stops, the lock lets go
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
        // soft push out of footprints and trunks; the water is a wall (the stream cut is below −0.25 m)
        for (const c of blockers) {
          const dx = next.x - c.x, dz = next.z - c.z, d = Math.hypot(dx, dz), r = c.r + 0.35;
          if (d < r && d > 0.001) { next.x = c.x + (dx / d) * r; next.z = c.z + (dz / d) * r; }
        }
        if (groundY(next.x, next.z) > -0.25) { hero.position.x = next.x; hero.position.z = next.z; }
        else vel.multiplyScalar(0.5);
        hero.position.y = groundY(hero.position.x, hero.position.z);
      }
      if (ring) ring.position.y = 0.02;
      // camera: damped follow of the hero with a little look-ahead in the direction of travel
      const ahead = hero.position.clone().addScaledVector(vel, 0.35);
      ahead.y = hero.position.y + 0.9;
      follow.lerp(ahead, Math.min(1, dt * 3.5));
      orbit.current.target = [follow.x, follow.y, follow.z];
      orbit.apply();
    },
  };
  return walk;
}
