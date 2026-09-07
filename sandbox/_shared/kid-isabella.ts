// Isabella on the shared rig (heroes.md §2.3.2, §2.4.5; PHASE_0.75_HEROES_NOTES.md T-15g/h):
// ruby dress and a hand-me-down cape that drags, the tiara, the hammer head resting by her foot
// with both hands on the shaft, the big blonde volume with side bangs and two bows, the biggest
// eyes, round brows, the squeeze-blink; she looks straight up every 3 s (tongue out sometimes).
// Flourish: the whirl. Two full turns in 0.8 s with arms and the hammer out, a ruby ribbon at
// knee height, a hop, then she looks over to see if Collette saw.
import * as THREE from 'three';
import { BLOOM_LAYER } from './post';
import { colorize, mergeGeos, xf } from './material';
import { makeKid, type Kid } from './rig';

export const ISABELLA = { base: '#D6294E', dark: '#8A1538', accent: '#F0C040', glow: '#FFD966', hair: '#E2C070', skin: '#F2CBA7', pupil: '#2C3E50' };

export function makeIsabella(): Kid {
  return makeKid(
    { name: 'Isabella', legs: 0.46, torso: 0.44, shoulder: 0.18, headR: 0.19, stance: 0.36, toesOut: 0.3, colours: ISABELLA, eye: { w: 0.07, h: 0.065, lid: 1 }, brow: 'round', smile: false },
    (b, h) => {
      const { mesh, box, prism } = h;
      const c = ISABELLA;
      // hair: the big round volume set back, the side-swept bangs, two bows, the tiara
      const vol = colorize(new THREE.SphereGeometry(0.235, 8, 6), c.hair);
      vol.scale(1.0, 0.92, 0.95);
      const volMesh = mesh(vol); volMesh.position.set(0, 0.2, -0.06); b.head.add(volMesh);
      const bangs = mesh(box(0.3, 0.07, 0.03, c.hair)); bangs.position.set(0.02, 0.3, 0.17); bangs.rotation.z = -0.22; bangs.rotation.x = -0.15; b.head.add(bangs);
      for (const s of [-1, 1]) {
        const bow = mesh(mergeGeos([xf(box(0.1, 0.05, 0.035, c.base), -0.055, 0, 0, 0, 0, 0.45), xf(box(0.1, 0.05, 0.035, c.base), 0.055, 0, 0, 0, 0, -0.45), xf(h.ball(0.028, c.accent), 0, 0, 0)]));
        bow.position.set(s * 0.22, 0.27, 0.0); bow.rotation.y = s * Math.PI / 2; b.head.add(bow);
      }
      const tiara = mesh(mergeGeos([
        xf(colorize(new THREE.TorusGeometry(0.2, 0.012, 4, 12, Math.PI), c.accent), 0, 0, 0, 0, 0, 0),
        ...[-0.09, 0, 0.09].map((x, i) => xf(colorize(new THREE.ConeGeometry(0.018, i === 1 ? 0.07 : 0.045, 4), c.accent), x, 0.03, Math.sqrt(Math.max(0, 0.04 - x * x)))),
      ]));
      tiara.position.set(0, 0.34, 0.0); tiara.rotation.x = Math.PI / 2 + 0.25; b.head.add(tiara);
      // the dress: a skirt bell from the hips; the tummy tongue of the belt in gold
      b.hips.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.17, 0.27, 0.26, 8, 1, true), c.base), 0, -0.12)));
      b.hips.add(mesh(xf(colorize(new THREE.TorusGeometry(0.19, 0.022, 4, 10), c.accent), 0, 0.05, 0, 0, Math.PI / 2)));
      // the cape: pinned at both shoulders, 0.12 m too long, lining in dark (two bones)
      const cape0 = h.node('cape.0', 0, 0.2, -0.16), cape1 = h.node('cape.1', 0, -0.36);
      const strip = (hh: number, w: number) => { const g = colorize(new THREE.PlaneGeometry(w, hh, 1, 2), c.base); g.translate(0, -hh / 2, 0); return g; };
      cape0.add(mesh(strip(0.36, 0.34), h.clothMat)); cape1.add(mesh(strip(0.42, 0.36), h.clothMat)); cape0.add(cape1); b.chest.add(cape0);
      for (const s of [-1, 1]) b.chest.add(mesh(xf(h.ball(0.025, c.accent), s * 0.14, 0.2, -0.1)));
      // the hammer: 1.10 m shaft in garnet, a stone head with gold bands; pivot at the hand
      const hammer = h.node('prop.R');
      hammer.add(mesh(xf(prism(0.022, 0.026, 0.92, c.dark, 6), 0, -0.4)));
      hammer.add(mesh(mergeGeos([
        xf(box(0.42, 0.26, 0.24, '#6F7D86'), 0, 0, 0),
        xf(box(0.44, 0.05, 0.26, c.accent), 0, 0.09, 0), xf(box(0.44, 0.05, 0.26, c.accent), 0, -0.09, 0),
      ]).translate(0, -0.8, 0)));
      b.R.hand.add(hammer); hammer.position.set(0.02, -0.06, 0.06);
      // the whirl ribbon: a short cylinder shell in glow, additive, hidden until the flourish
      const ribbon = new THREE.Mesh(
        new THREE.CylinderGeometry(1.9, 1.9, 0.3, 28, 1, true),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(c.glow).multiplyScalar(1.6), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      ribbon.layers.enable(BLOOM_LAYER); ribbon.position.y = 0.45; ribbon.visible = false; b.root.add(ribbon);
      let upT = -100, rockPh = 0;
      return {
        flourishLen: 2.4,
        update: ({ t, dt, idle, blend, fl }) => {
          // idle: leans on the hammer at her right, both hands on the shaft top, rocks it; the cape sways big
          const lean = 0.1 * idle;
          b.spine.rotation.z = -lean;
          rockPh += dt * 3.1;
          const rock = Math.sin(rockPh) * 0.08 * idle;
          b.R.sh.rotation.x += -0.2 * idle; b.R.sh.rotation.z = -0.38 * idle; b.R.fa.rotation.x = -0.15 * idle;
          b.L.sh.rotation.x += -0.45 * idle; b.L.sh.rotation.z = 0.3 * idle; b.L.fa.rotation.x = -1.25 * idle; b.L.sh.rotation.y = -0.95 * idle;
          hammer.rotation.z = 0.8 * idle + rock; hammer.rotation.x = 0.35 * blend;
          // the walk: a stomp on every contact (a deeper hip bob and a squash), the hammer drags behind
          const stomp = Math.abs(Math.sin(t * 6.283));
          b.hips.position.y -= 0.025 * (1 - stomp) * blend;
          b.spin.scale.set(1 + 0.03 * (1 - stomp) * blend, 1 - 0.03 * (1 - stomp) * blend, 1 + 0.03 * (1 - stomp) * blend);
          b.R.sh.rotation.x += 0.7 * blend;
          // looks straight up every 3 s at something no one else saw; tongue out on every third look
          if (t - upT > 3.2) upT = t + 0.8 * Math.sin(t * 0.7) ** 2;
          const up = THREE.MathUtils.smoothstep(t - upT, 0, 0.35) * (1 - THREE.MathUtils.smoothstep(t - upT, 1.0, 1.5));
          b.head.rotation.x -= 0.45 * up * idle;
          b.tongue.visible = up > 0.5 && Math.floor(upT / 3.2) % 3 === 0;
          // the squeeze-blink: brows drop with the lids
          for (const [i, e] of b.eyes.entries()) b.brows[i]!.position.y = 0.2 * b.hr + 0.0325 + 0.03 - 0.03 * (1 - Math.min(1, e.scale.y));
          // cape
          const cs = Math.sin(t * 0.7) * 0.4 + Math.sin(t * 1.9) * 0.15;
          cape0.rotation.x = 0.15 + cs * 0.4 * idle + 0.3 * blend + 0.15 * stomp * blend;
          cape1.rotation.x = -0.1 + cs * 0.25 * idle + 0.15 * Math.sin(t * 6.3 + 1) * blend;
          // flourish: the whirl (two turns in 0.8 s, arms and hammer out, the ribbon), a hop, a look to Collette
          if (fl >= 0) {
            const spinU = THREE.MathUtils.smoothstep(fl, 0, 0.85);
            b.spin.rotation.y = spinU * Math.PI * 4;
            const out = THREE.MathUtils.smoothstep(fl, 0, 0.2) * (1 - THREE.MathUtils.smoothstep(fl, 0.85, 1.15));
            b.L.sh.rotation.z = 1.45 * out; b.R.sh.rotation.z = -1.45 * out; b.L.sh.rotation.x = 0; b.R.sh.rotation.x = 0; b.L.fa.rotation.x = 0; b.R.fa.rotation.x = 0; b.L.sh.rotation.y = 0;
            hammer.rotation.z = 1.6 * out; hammer.rotation.x = 0;
            ribbon.visible = out > 0.02;
            (ribbon.material).opacity = 0.55 * out;
            ribbon.rotation.y = -spinU * Math.PI * 4;
            const hop = Math.sin(THREE.MathUtils.clamp((fl - 1.05) / 0.4, 0, 1) * Math.PI);
            b.spin.position.y = 0.28 * hop;
            const look = THREE.MathUtils.smoothstep(fl, 1.5, 1.9);
            b.head.rotation.y += 0.7 * look; b.head.rotation.x += 0.1 * look;
          } else { b.spin.rotation.y = 0; b.spin.position.y = 0; ribbon.visible = false; }
        },
      };
    },
  );
}
