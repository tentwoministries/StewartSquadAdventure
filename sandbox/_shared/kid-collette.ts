// Collette on the shared rig (heroes.md §2.3.2, §2.4.4; PHASE_0.75_HEROES_NOTES.md T-15e/f):
// amethyst robe with the hem bell and amber trim, the staff a full head above her with the amber
// orb (and her orchid carried light: the Bog's and the caves' only carried light that casts), the
// two high lobes as long dark tails that lag her head, the amber bow headband, big eyes with a
// lash, the default smile; the composed idle broken by a laugh. Flourish: staff twirl, plant,
// amber sparkle burst, hand on the hip. "And THAT is how it's done."
import * as THREE from 'three';
import { colorize, mergeGeos, WORLD_U, xf } from './material';
import { burst } from './particles';
import { makeKid, type Kid } from './rig';

export const COLLETTE = { base: '#9D4FD8', dark: '#5B2A8F', accent: '#E8A838', glow: '#E08CF0', hair: '#3E2A1E', skin: '#F2CBA7', pupil: '#2C3E50' };

export function makeCollette(): Kid & { sparkle: ReturnType<typeof burst> } {
  const sparkle = burst(14, COLLETTE.accent, 6, 2.2, 21);
  const kid = makeKid(
    { name: 'Collette', legs: 0.62, torso: 0.48, shoulder: 0.19, headR: 0.19, stance: 0.22, colours: COLLETTE, eye: { w: 0.066, h: 0.06, lid: 1 }, brow: 'lash', smile: true },
    (b, h) => {
      const { mesh, box, prism } = h;
      const c = COLLETTE;
      // hair: cap, the amber bow headband, two high ties with long tails (two bones each)
      const cap = colorize(new THREE.SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), c.hair);
      cap.scale(0.98, 0.9, 0.96);
      b.head.add(mesh(xf(cap, 0, 0.215)));
      const band = mesh(colorize(new THREE.TorusGeometry(0.196, 0.018, 5, 14, Math.PI * 1.1), c.accent)); band.position.y = 0.24; band.rotation.z = -Math.PI * 0.05; b.head.add(band);
      const bowAt = (x: number, y: number, z: number, s: number, parent: THREE.Object3D, ry = 0) => {
        const g = mergeGeos([xf(box(0.09 * s, 0.045 * s, 0.03 * s, c.accent), -0.05 * s, 0, 0, 0, 0, 0.4), xf(box(0.09 * s, 0.045 * s, 0.03 * s, c.accent), 0.05 * s, 0, 0, 0, 0, -0.4), xf(h.ball(0.022 * s, c.dark), 0, 0, 0)]);
        const m = mesh(g); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m);
      };
      bowAt(0.14, 0.31, 0.1, 1, b.head, -0.9);
      const fringe = mesh(box(0.16, 0.05, 0.02, c.hair)); fringe.position.set(-0.03, 0.29, 0.17); fringe.rotation.z = 0.1; b.head.add(fringe);
      const tails: { t0: THREE.Group; t1: THREE.Group; side: number }[] = [];
      for (const s of [-1, 1]) {
        const t0 = h.node(`pigtail.${s < 0 ? 'L' : 'R'}`, s * 0.13, 0.34, -0.05), t1 = h.node('tail.1', 0, -0.18);
        t0.add(mesh(xf(h.ball(0.06, c.hair), 0, 0)));
        t0.add(mesh(xf(prism(0.05, 0.035, 0.2, c.hair, 5), 0, -0.1)));
        t1.add(mesh(xf(prism(0.035, 0.015, 0.2, c.hair, 5), 0, -0.1)));
        bowAt(0, 0.02, 0.05, 0.8, t0);
        t0.add(t1); b.head.add(t0); t0.rotation.z = s * 0.5; tails.push({ t0, t1, side: s });
      }
      // the robe: a hem bell from the hips with the dark band and amber trim; belt
      const bell = colorize(new THREE.CylinderGeometry(0.19, 0.31, 0.42, 8, 1, true), c.base);
      const bellMesh = mesh(xf(bell, 0, -0.2)); b.hips.add(bellMesh);
      b.hips.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.305, 0.315, 0.05, 8, 1, true), c.dark), 0, -0.39)));
      b.hips.add(mesh(xf(colorize(new THREE.TorusGeometry(0.2, 0.02, 4, 10), c.accent), 0, 0.05, 0, 0, Math.PI / 2)));
      for (const s of [-1, 1]) b.spine.add(mesh(xf(box(0.012, 0.36, 0.012, c.accent), s * 0.05, 0.18, 0.2 * b.wf)));
      // the staff in the right hand: 1.55 m, the orb a head above her, planted ahead of the foot at idle
      // the staff stands on its own (planted 0.2 m ahead of the right foot, carried upright when she walks);
      // its pivot is at the hands' height so the flourish twirl is a baton twirl
      const staff = h.node('prop.R', 0.24, 0.9, 0.22);
      staff.add(mesh(xf(prism(0.018, 0.022, 1.7, c.dark, 6), 0, -0.05)));
      staff.add(mesh(xf(prism(0.03, 0.03, 0.12, c.accent, 6), 0, 0.74)));
      const orb = h.glowBall(0.075, c.accent, 2.4); orb.position.y = 0.86; staff.add(orb);
      const orbLight = kidLight();
      orbLight.position.y = 0.86;
      staff.add(orbLight);
      b.root.add(staff);
      let circleT = -10, laughT = -100;
      function kidLight() { return new THREE.PointLight(c.glow, 9, 7, 2); }
      const tailLag = [0, 0];
      let lastYaw = 0;
      return {
        flourishLen: 2.6,
        update: ({ t, dt, idle, blend, fl }) => {
          // idle pose: heel to toe, both hands toward the staff at chest height, the staff planted ahead
          b.R.sh.rotation.x += -0.75 * idle; b.R.fa.rotation.x = -0.55 * idle; b.R.sh.rotation.z = -0.2 * idle;
          b.L.sh.rotation.x += -0.6 * idle; b.L.fa.rotation.x = -1.0 * idle; b.L.sh.rotation.z = 0.3 * idle; b.L.sh.rotation.y = -0.5 * idle;
          staff.rotation.x = -0.06 * idle + 0.1 * blend; staff.rotation.z = 0.03; staff.position.y = 0.9 + 0.03 * Math.abs(Math.sin(t * 6.283)) * blend;
          // the free hand traces a small circle every 2 s (the amber-mote idle) : a little wrist circle
          if (t - circleT > 2.0) circleT = t;
          const cu = THREE.MathUtils.smoothstep(t - circleT, 0, 0.8) * (1 - THREE.MathUtils.smoothstep(t - circleT, 0.6, 0.9));
          b.L.hand.rotation.x = 0.4 * Math.sin((t - circleT) * 8) * cu * idle; b.L.hand.rotation.z = 0.4 * Math.cos((t - circleT) * 8) * cu * idle;
          // the orb pulses (v27: sin(gt·5)·0.3 + 0.7)
          const pulse = Math.sin(t * 5) * 0.3 + 0.7;
          orb.scale.setScalar(0.85 + 0.25 * pulse);
          orbLight.intensity = 9 * (0.7 + 0.3 * pulse) * (0.15 + 0.85 * WORLD_U.uEmissiveGain.value);
          // the walk: the hem swings, the staff is carried upright
          bellMesh.rotation.x = 0.12 * Math.sin(t * 6.283) * blend; bellMesh.rotation.z = 0.06 * Math.sin(t * 6.283 * 0.5) * blend;
          // the tails lag the head by ~0.15 s
          const yaw = b.head.rotation.y;
          const dy = (yaw - lastYaw) / Math.max(dt, 1e-3); lastYaw = yaw;
          tails.forEach((tl, i) => {
            tailLag[i] = tailLag[i]! + (THREE.MathUtils.clamp(-dy * 0.12, -0.5, 0.5) - tailLag[i]!) * Math.min(1, dt * 7);
            tl.t0.rotation.z = tl.side * 0.5 + 0.08 * Math.sin(t * 1.3 + i) * idle + 0.18 * Math.sin(t * 6.283 + i) * blend;
            tl.t0.rotation.x = tailLag[i] + 0.15 * blend; tl.t1.rotation.x = 0.1 * Math.sin(t * 1.7 + i) + 0.12 * Math.sin(t * 6.283 + 1 + i) * blend;
          });
          // the laugh (T-15f): eyes squeezed, mouth wide, shoulders bounce, 1.2 s every ~14 s
          if (t - laughT > 14) laughT = t + 4 * Math.sin(t * 0.29) ** 2;
          const lg = THREE.MathUtils.smoothstep(t - laughT, 0, 0.2) * (1 - THREE.MathUtils.smoothstep(t - laughT, 1.0, 1.4));
          for (const e of b.eyes) e.scale.y = Math.min(e.scale.y, 1 - 0.85 * lg);
          b.mouth.scale.set(1 + 0.3 * lg, 1 + 3.5 * lg, 1); b.mouth.position.y = 0.13 * b.hr - 0.012 * lg;
          b.chest.position.y = 0.21 * b.tf + 0.01 * Math.sin(t * 20) * lg; b.head.rotation.x -= 0.15 * lg;
          // flourish: twirl (0.9 s), plant, burst, hand on the hip
          if (fl >= 0) {
            const tw = THREE.MathUtils.smoothstep(fl, 0.05, 0.95);
            staff.rotation.z = 0.03 + tw * Math.PI * 4; staff.rotation.x = -0.06 * (1 - tw); staff.position.y = 0.9 + 0.5 * Math.sin(Math.min(1, fl / 0.95) * Math.PI);
            b.R.sh.rotation.x = -1.2 * (1 - THREE.MathUtils.smoothstep(fl, 0.9, 1.2)) * THREE.MathUtils.smoothstep(fl, 0, 0.2);
            const hip = THREE.MathUtils.smoothstep(fl, 1.0, 1.4);
            b.L.sh.rotation.z = 0.9 * hip; b.L.fa.rotation.x = -1.3 * hip; b.L.sh.rotation.x = -0.2 * hip;
            b.head.rotation.z = -0.12 * hip;
            if (fl > 0.95 && fl < 0.95 + dt * 1.5) { const p = new THREE.Vector3(); orb.getWorldPosition(p); sparkle.fire(p.x, p.y, p.z, new THREE.Vector3(0, 1, 0), 1.6, 1.1); }
          } else b.head.rotation.z = 0;
        },
      };
    },
  );
  return Object.assign(kid, { sparkle });
}
