// Liam on the shared rig (heroes.md §2.3.2, §2.4.2; the Forest scene's liam.ts was the prototype):
// sapphire, the shield outboard, three swept spikes now dark brown from the photo (T-15a), the
// low brows and the steady idle, and the slow real smile (T-15b). Flourish: two shield taps, a nod.
import * as THREE from 'three';
import { colorize, mergeGeos, xf } from './material';
import { makeKid, type Kid } from './rig';

export const LIAM = { base: '#2A62CF', dark: '#173A86', accent: '#D3DDE6', glow: '#4A9ED8', hair: '#4A3220', skin: '#F2CBA7', pupil: '#2C3E50' };

export function makeLiam(): Kid {
  return makeKid(
    { name: 'Liam', legs: 0.78, torso: 0.54, shoulder: 0.24, headR: 0.2, stance: 0.42, colours: LIAM, eye: { w: 0.06, h: 0.05, lid: 0.72 }, brow: 'low', smile: false },
    (b, h) => {
      const { mesh, box, prism } = h;
      const c = LIAM;
      // hair cap and three swept spikes (a crown of triangles)
      const cap = colorize(new THREE.SphereGeometry(0.21, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), c.hair);
      cap.scale(0.97, 0.9, 0.95);
      b.head.add(mesh(xf(cap, 0, 0.23)));
      for (const [x, back, sc] of [[-0.09, -0.02, 0.9], [0, 0.0, 1.0], [0.09, -0.02, 0.9]]) {
        const spike = mesh(colorize(new THREE.ConeGeometry(0.055 * sc!, 0.24 * sc!, 4), c.hair));
        spike.position.set(x!, 0.4, -0.02 + back!); spike.rotation.x = -0.45; b.head.add(spike);
      }
      // shield outboard on the left forearm, face out (−x)
      const shield = mesh(mergeGeos([
        xf(colorize(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 12), c.base), 0, 0),
        xf(colorize(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 12), c.dark), 0, 0.025),
        xf(colorize(new THREE.ConeGeometry(0.07, 0.06, 8), c.accent), 0, -0.05),
        ...[0, 1, 2, 3].map((i) => xf(colorize(new THREE.IcosahedronGeometry(0.025, 0), c.accent), Math.cos(i * 1.57) * 0.2, -0.03, Math.sin(i * 1.57) * 0.2)),
      ]));
      shield.rotation.z = -Math.PI / 2; shield.position.set(-0.10, -0.08, 0.02);
      b.L.fa.add(shield);
      // sword sheathed at the left hip
      const sword = mesh(mergeGeos([xf(box(0.03, 0.42, 0.015, c.accent), 0, -0.24), xf(box(0.12, 0.03, 0.03, '#E8A838'), 0, -0.02), xf(prism(0.016, 0.016, 0.10, c.dark), 0, 0.05)]));
      sword.position.set(-0.2, 0.02, -0.04); sword.rotation.z = 0.25; sword.rotation.x = 0.2;
      b.hips.add(sword);
      // cape: two bones, clasped at the right shoulder over the sword side
      const cape0 = h.node('cape.0', 0.06, 0.2, -0.17), cape1 = h.node('cape.1', 0, -0.35);
      const strip = (hh: number) => { const g = colorize(new THREE.PlaneGeometry(0.30, hh, 1, 2), c.dark); g.translate(0, -hh / 2, 0); return g; };
      cape0.add(mesh(strip(0.35), h.clothMat)); cape1.add(mesh(strip(0.35), h.clothMat));
      cape0.add(cape1); b.chest.add(cape0);
      cape0.add(mesh(xf(colorize(new THREE.IcosahedronGeometry(0.03, 0), c.accent), 0.14, 0, 0.02)));
      let smileT = -100;
      return {
        flourishLen: 2.2,
        update: ({ t, dt, idle, blend, fl }) => {
          // idle arms: shield arm 12° abduction; the sword arm rests
          b.L.sh.rotation.z = -0.21 * idle; b.L.ua.rotation.x = 0.15 * idle; b.R.sh.rotation.z = 0.06 * idle;
          // at run the shield comes up as if he expects something
          b.L.fa.rotation.x = -0.6 * blend;
          // the slow real smile (T-15b): every ~12 s, eased in over 0.4 s, held 2 s
          if (t - smileT > 12.5) smileT = t + 2.5 * Math.sin(t * 0.37) ** 2;
          const sm = THREE.MathUtils.smoothstep(t - smileT, 0, 0.4) * (1 - THREE.MathUtils.smoothstep(t - smileT, 2.0, 2.6));
          b.mouth.visible = sm > 0.02; b.mouth.scale.set(0.6 + 0.6 * sm, 1, 1); b.mouth.position.y = 0.13 - 0.004 * sm;
          // cape: sway plus the walk trail
          const cs = Math.sin(t * 0.8) * 0.3;
          cape0.rotation.x = 0.12 + cs * 0.35 * idle + 0.15 * Math.abs(Math.sin(t * 6.3)) * blend + 0.25 * blend;
          cape1.rotation.x = cs * 0.2 * idle + 0.1 * Math.sin(t * 6.3 + 1) * blend;
          // flourish: the right hand comes across and taps the shield twice, then one slow nod
          if (fl >= 0) {
            const reach = THREE.MathUtils.smoothstep(fl, 0, 0.35) * (1 - THREE.MathUtils.smoothstep(fl, 1.1, 1.4));
            b.R.sh.rotation.x = -1.1 * reach; b.R.sh.rotation.z = -0.9 * reach; b.R.fa.rotation.x = -0.9 * reach;
            const tap = (a: number) => Math.max(0, 1 - Math.abs(fl - a) * 12);
            b.R.fa.rotation.x -= 0.25 * (tap(0.5) + tap(0.8));
            const nod = THREE.MathUtils.smoothstep(fl, 1.3, 1.6) * (1 - THREE.MathUtils.smoothstep(fl, 1.9, 2.2));
            b.head.rotation.x += 0.28 * nod;
          }
          void dt;
        },
      };
    },
  );
}
