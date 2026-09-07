// Noah on the shared rig (heroes.md §2.3.2, §2.4.3; PHASE_0.75_HEROES_NOTES.md T-15c/d): fox
// orange over pine, the bow held upright in the left hand (a line above the head), the quiver, the
// long green scarf; sandy hair with a fringe over one eye and the green headband, freckles, blue
// eyes, one brow up; an idle that is never still and a head that snaps to whatever moved.
// Flourish: spins the bow once around the hand, catches it, crosses his arms, one brow up.
import * as THREE from 'three';
import { colorize, mergeGeos, xf } from './material';
import { makeKid, type Kid } from './rig';

export const NOAH = { base: '#EE7F24', dark: '#1F5E3F', accent: '#2DB86A', glow: '#FFC46B', hair: '#A8865A', skin: '#F2CBA7', pupil: '#3A6EA8' };

export function makeNoah(): Kid {
  return makeKid(
    { name: 'Noah', legs: 0.70, torso: 0.48, shoulder: 0.19, headR: 0.19, stance: 0.28, footFwdL: 0.1, colours: NOAH, eye: { w: 0.06, h: 0.04, lid: 1 }, brow: 'oneUp', smile: false },
    (b, h) => {
      const { mesh, box, prism } = h;
      const c = NOAH;
      const hr = b.hr;
      // hair: half-cap, the green headband, a tuft, and the fringe (three flat wedges over the band)
      const cap = colorize(new THREE.SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), c.hair);
      cap.scale(0.98, 0.9, 0.96);
      b.head.add(mesh(xf(cap, 0, 0.215)));
      // the nape: the back half of the head is hair too (a boy with a proper haircut, not a skullcap)
      const nape = colorize(new THREE.SphereGeometry(0.205, 8, 3, Math.PI, Math.PI, Math.PI * 0.42, Math.PI * 0.3), c.hair);
      b.head.add(mesh(xf(nape, 0, 0.2)));
      b.head.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.192, 0.192, 0.035, 10, 1, true), c.accent), 0, 0.28)));
      const tuft = mesh(colorize(new THREE.ConeGeometry(0.05, 0.11, 4), c.hair)); tuft.position.set(0.03, 0.4, 0.05); tuft.rotation.x = 0.5; b.head.add(tuft);
      for (const [x, len, tilt] of [[-0.07, 0.15, 0.25], [0.0, 0.11, 0.1], [0.075, 0.09, -0.1]]) {
        const f = mesh(box(0.075, len!, 0.022, c.hair)); f.position.set(x!, 0.30 - len! / 2 + 0.03, 0.165); f.rotation.z = tilt!; f.rotation.x = -0.12; b.head.add(f);
      }
      // freckles across the nose and cheeks (readable at the close-up only)
      for (const [x, y] of [[-0.05, 0.16], [-0.03, 0.145], [0.0, 0.155], [0.035, 0.145], [0.055, 0.16]]) {
        const fr = mesh(box(0.011, 0.011, 0.006, '#C98E6A')); fr.castShadow = false; fr.position.set(x! * hr, y! * hr, 0.178 * hr); b.head.add(fr);
      }
      // bow in the left hand: two limbs off a grip, the string on the outside; 1.25 m
      const limbLen = 0.55;
      const bowParts = [
        xf(box(0.035, 0.16, 0.035, c.base), 0, 0),
        xf(prism(0.014, 0.02, limbLen, c.dark, 5), 0.06, limbLen / 2 + 0.06, 0, 0, 0, -0.22),
        xf(prism(0.014, 0.02, limbLen, c.dark, 5), 0.06, -(limbLen / 2 + 0.06), 0, 0, 0, 0.22),
        xf(box(0.008, limbLen * 2 + 0.05, 0.008, c.accent), 0.19, 0, 0),
      ];
      const bow = mesh(mergeGeos(bowParts));
      const bowPivot = h.node('prop.L'); bowPivot.add(bow); b.L.hand.add(bowPivot);
      bowPivot.position.set(0, -0.06, 0.02); bowPivot.rotation.y = Math.PI / 2; bowPivot.rotation.x = 0.26;
      // quiver on the right hip with four fletchings
      const quiver = mesh(mergeGeos([
        xf(prism(0.045, 0.04, 0.42, c.dark, 6), 0, 0),
        ...[0, 1, 2, 3].map((i) => xf(colorize(new THREE.ConeGeometry(0.02, 0.06, 3), c.accent), Math.cos(i * 1.6) * 0.02, 0.26, Math.sin(i * 1.6) * 0.02)),
      ]));
      quiver.position.set(0.19, 0.0, -0.12); quiver.rotation.x = 0.35; quiver.rotation.z = 0.2; b.hips.add(quiver);
      // scarf: a loop at the neck and a two-bone tail down the back
      b.neck.add(mesh(xf(colorize(new THREE.TorusGeometry(0.11 * b.wf + 0.02, 0.035, 5, 10), c.accent), 0, 0.02, 0, 0, Math.PI / 2)));
      const s0 = h.node('scarf.0', -0.03, 0.02, -0.12), s1 = h.node('scarf.1', 0, -0.32);
      const strip = (hh: number) => { const g = colorize(new THREE.PlaneGeometry(0.12, hh, 1, 2), c.accent); g.translate(0, -hh / 2, 0); return g; };
      s0.add(mesh(strip(0.32), h.clothMat)); s1.add(mesh(strip(0.30), h.clothMat)); s0.add(s1); b.neck.add(s0);
      let shiftT = 0, shiftSide = 1, gripT = -10, laughT = -100;
      return {
        flourishLen: 2.4,
        update: ({ t, dt, idle, blend, fl }) => {
          // never still: weight shifts every 1.4 s (eased), the bow hand re-grips every ~3 s
          if (t - shiftT > 1.4) { shiftT = t; shiftSide = -shiftSide; }
          const sh = THREE.MathUtils.smoothstep(t - shiftT, 0, 0.5);
          b.hips.position.x += (shiftSide * 0.03 * (2 * sh - 1)) * idle;
          b.hips.rotation.z = shiftSide * 0.03 * (2 * sh - 1) * idle;
          if (t - gripT > 3.1) gripT = t + 0.6 * Math.sin(t);
          const grip = Math.max(0, 1 - Math.abs(t - gripT - 0.2) * 6);
          b.L.hand.rotation.z = 0.25 * grip * idle;
          // idle arms: bow arm hangs, tip down and 15° forward; the right hand rests on the quiver
          b.L.sh.rotation.z = -0.12 * idle; b.L.sh.rotation.x += -0.15 * idle; b.R.sh.rotation.x += -0.35 * idle; b.R.fa.rotation.x = -0.4 * idle;
          // the walk: light, toes first, a small forward lean; at run the bow tucks against the forearm
          b.spine.rotation.x = 0.08 * blend;
          bowPivot.rotation.x = 0.26 + 0.9 * blend;
          // the laugh (T-15d): head back, mouth open, ~1 s every ~9 s
          if (t - laughT > 9.5) laughT = t + 3 * Math.sin(t * 0.53) ** 2;
          const lg = THREE.MathUtils.smoothstep(t - laughT, 0, 0.25) * (1 - THREE.MathUtils.smoothstep(t - laughT, 0.9, 1.3));
          b.head.rotation.x -= 0.32 * lg; b.mouth.visible = lg > 0.02; b.mouth.scale.set(0.9, 1 + 4 * lg, 1); b.mouth.position.y = 0.125 * hr - 0.012 * lg;
          b.chest.position.y = 0.21 * b.tf + 0.008 * Math.sin(t * 22) * lg;
          // scarf: Ed's six-frequency recipe at half amplitude
          s0.rotation.x = 0.2 + 0.18 * Math.sin(t * 1.1) * Math.sin(t * 0.37 + 1) + 0.25 * blend + 0.1 * Math.abs(Math.sin(t * 6.3)) * blend;
          s0.rotation.z = 0.12 * Math.sin(t * 0.8 + 2);
          s1.rotation.x = 0.15 * Math.sin(t * 1.7 + 0.5) + 0.1 * Math.sin(t * 6.3 + 1) * blend;
          // flourish: the bow spins once around the hand (0.7 s), then arms cross, one brow up
          if (fl >= 0) {
            const spinU = THREE.MathUtils.smoothstep(fl, 0.05, 0.75);
            bowPivot.rotation.z = spinU * Math.PI * 2;
            const cross = THREE.MathUtils.smoothstep(fl, 0.8, 1.2);
            b.L.sh.rotation.x = -0.9 * cross; b.R.sh.rotation.x = -0.9 * cross; b.L.fa.rotation.x = -1.4 * cross; b.R.fa.rotation.x = -1.4 * cross;
            b.L.sh.rotation.z = 0.35 * cross; b.R.sh.rotation.z = -0.35 * cross;
            b.brows[0]!.position.y = 0.2 * hr + 0.025 + 0.02 + 0.02 * cross;
            b.head.rotation.z = 0.1 * cross;
          } else { bowPivot.rotation.z = 0; b.head.rotation.z = 0; }
          void dt;
        },
      };
    },
  );
}
