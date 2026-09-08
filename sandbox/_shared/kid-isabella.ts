// Isabella on the shared rig (heroes.md §2.3.2, §2.4.5; PHASE_0.75_HEROES_NOTES.md T-15g/h):
// ruby dress and a hand-me-down cape that drags, the tiara, the hammer head resting by her foot
// with both hands on the shaft, the big blonde volume with side bangs and two bows, the biggest
// eyes, round brows, the squeeze-blink; she looks straight up every 3 s (tongue out sometimes).
// Flourish: the whirl. Two full turns in 0.8 s with arms and the hammer out, a ruby ribbon at
// knee height, a hop, then she looks over to see if Collette saw.
import * as THREE from 'three';
import { BLOOM_LAYER } from './post';
import { colorize, mergeGeos, WORLD_U, xf } from './material';
import { ikArm, lowestDrop, makeKid, ssProbeReg, type Kid } from './rig';

export const ISABELLA = { base: '#D6294E', dark: '#8A1538', accent: '#F0C040', glow: '#FFD966', hair: '#E2C070', skin: '#F2CBA7', pupil: '#2C3E50' };

/** The whirl's ribbon is the one thing a hit-stop may not hold (heroes.md §2.5.7 / T-31: the stop
 *  freezes the sim, the camera and every world system, never the effect that caused it). The rig is
 *  handed `dt = 0` and a held clock while a stop runs, so a scene that calls `ctx.stop()` writes
 *  `ctx.stopDt` here on every stopped frame and the ribbon keeps sweeping on it. 0 when nothing is
 *  stopped — the ribbon then runs on the rig's own `dt` like everything else. */
export const RIBBON_EXEMPT = { dt: 0 };

/** The name the ribbon mesh carries, so a probe can read its radius: `kid.root.getObjectByName(RIBBON_NAME).scale.x`. */
export const RIBBON_NAME = 'isabella.whirlRibbon';
const RIBBON_R = 1.9;        // heroes.md §2.5.4: the ring is at 1.9 m
const RIBBON_H = 0.3;        // ... and 0.3 m tall
const RIBBON_ARC = 220;      // degrees of the swept arc (scores §4 change 7)
const RIBBON_GROW = 0.30;    // the ease-in, well over the 0.15 s floor (Tier-0 rule 3)

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
      // The hammer: a 0.92 m shaft in garnet, a stone head with gold bands. It used to hang from the
      // right hand, which put the head 0.19–0.45 m *under* the ground (T-45). It now hangs off the
      // body (`spin`, so the whirl and the hop carry it) and is **solved** each frame from where its
      // head belongs — on the ground at her right at idle, skimming the ground behind her at walk,
      // up on her shoulder at run — with the hands posed onto the shaft by IK (LESSONS Rigs row 2).
      const hammer = h.node('prop.R');
      hammer.add(mesh(xf(prism(0.022, 0.026, 0.92, c.dark, 6), 0, -0.4)));
      const headMesh = mesh(mergeGeos([
        xf(box(0.42, 0.26, 0.24, '#6F7D86'), 0, 0, 0),
        xf(box(0.44, 0.05, 0.26, c.accent), 0, 0.09, 0), xf(box(0.44, 0.05, 0.26, c.accent), 0, -0.09, 0),
      ]).translate(0, -0.8, 0));
      headMesh.name = 'prop.R.head';
      hammer.add(headMesh);
      b.spin.add(hammer);
      const HEAD_OFF = 0.80;      // the head's centre below the hammer's origin
      const HEAD_HX = 0.22, HEAD_HY = 0.13, HEAD_HZ = 0.13; // the head's half-extents (bands included)
      // Each carry is (head x, the head's lowest point above the ground, head z), the shaft's
      // direction from the head toward its top, and where the two hands grip along it — measured in
      // metres from the head's centre. heroes.md §2.3.2 (idle: head on the ground at her right, both
      // hands on the shaft top), §2.4.5 (walk: it drags behind her; run: it comes up on her shoulder).
      const CARRY = {
        idle: { p: new THREE.Vector3(0.42, 0.015, 0.12), d: new THREE.Vector3(-0.35, 0.94, 0.03), r: 0.76, l: 0.84, lw: 1 },
        walk: { p: new THREE.Vector3(0.30, 0.05, -0.55), d: new THREE.Vector3(-0.05, 0.62, 0.78), r: 0.62, l: 0.86, lw: 0 },
        run: { p: new THREE.Vector3(0.20, 1.12, -0.34), d: new THREE.Vector3(0.06, -0.75, 0.66), r: 0.70, l: 0.86, lw: 0 },
        whirl: { p: new THREE.Vector3(0.85, 0.55, 0.0), d: new THREE.Vector3(-0.93, 0.36, 0.0), r: 0.62, l: 0.86, lw: 0 },
      };
      const UP = new THREE.Vector3(0, 1, 0);
      const cp = new THREE.Vector3(), cd = new THREE.Vector3(), headAt = new THREE.Vector3(), gw = new THREE.Vector3();
      let runU = 0;
      const probe = ssProbeReg();
      probe['isabella.hammer'] = () => {
        headMesh.geometry.computeBoundingBox();
        const bb = headMesh.geometry.boundingBox!;
        let lo = 1e9; const v = new THREE.Vector3();
        for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
          lo = Math.min(lo, v.set(x, y, z).applyMatrix4(headMesh.matrixWorld).y);
        }
        const q = hammer.getWorldQuaternion(new THREE.Quaternion());
        const o = hammer.getWorldPosition(new THREE.Vector3());
        const ax = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
        const centre = (limb: { hand: THREE.Object3D }) => limb.hand.localToWorld(new THREE.Vector3(0, -0.055 * b.wf, 0));
        const off = (p: THREE.Vector3) => { const u = p.clone().sub(o); return u.sub(ax.clone().multiplyScalar(u.dot(ax))).length(); };
        const hc = o.clone().addScaledVector(ax, -HEAD_OFF);
        const rh = centre(b.R), lh = centre(b.L);
        return {
          headLowY: lo, headCentre: [hc.x, hc.y, hc.z], axis: [ax.x, ax.y, ax.z],
          rHandDist: off(rh), lHandDist: off(lh), rHandY: rh.y, runU, root: [b.root.position.x, b.root.position.y, b.root.position.z],
        };
      };
      // The whirl ribbon (heroes.md §2.5.4: a ruby ring 0.3 m tall at 1.9 m). It is built at unit
      // radius as a 220° open cylinder arc so the *radius* can be eased in with `scale` and the arc
      // swept with `rotation.y`; the old full ring at 1.9 m on the first frame read as a second,
      // larger selection ring (scores §4). The trailing fade is per-vertex: under additive blending
      // a vertex that fades to black adds nothing, so the tail dissolves without a second material.
      const ribGeo = new THREE.CylinderGeometry(1, 1, RIBBON_H, 30, 1, true, 0, (RIBBON_ARC * Math.PI) / 180);
      {
        const pos = ribGeo.getAttribute('position') as THREE.BufferAttribute;
        const col = new Float32Array(pos.count * 3);
        const head = new THREE.Color(c.glow).multiplyScalar(1.6), tail = new THREE.Color(c.base).multiplyScalar(0.9), tmpC = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          // the arc runs from thetaStart (the leading edge) round to thetaStart + arc (the tail)
          const a = ((Math.atan2(pos.getX(i), pos.getZ(i)) + Math.PI * 2) % (Math.PI * 2)) / ((RIBBON_ARC * Math.PI) / 180);
          const k = THREE.MathUtils.clamp(1 - a, 0, 1);           // 1 at the head, 0 at the tail
          tmpC.copy(tail).lerp(head, k).multiplyScalar(k * k);     // ... and to black at the tail
          col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
        }
        ribGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      const ribMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      // T-41: the ribbon sweeps at knee height *in the world*, so it takes the world's bend like the
      // ground under it. makeWorldMaterial is a lit MeshStandardMaterial and this ribbon must stay
      // unlit, additive and vertex-coloured, so the same two lines from material.ts:75–76 are
      // injected here, on the same shared uniform objects (by reference, never copied values).
      ribMat.customProgramCacheKey = () => 'ss-curve-basic';
      ribMat.onBeforeCompile = (shader) => {
        shader.uniforms['uCurve'] = WORLD_U.uCurve;
        shader.uniforms['uCurveCenter'] = WORLD_U.uCurveCenter;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nuniform float uCurve; uniform vec2 uCurveCenter;')
          .replace(
            '#include <project_vertex>',
            `vec4 ssW = modelMatrix * vec4(transformed, 1.0);
            float ssD = length(ssW.xz - uCurveCenter);
            ssW.y -= uCurve * ssD * ssD;
            vec4 mvPosition = viewMatrix * ssW;
            gl_Position = projectionMatrix * mvPosition;`,
          );
      };
      const ribbon = new THREE.Mesh(ribGeo, ribMat);
      ribbon.name = RIBBON_NAME;
      // a 15° tilt (scores §4 change 7) lives on a parent so the sweep stays a clean rotation.y
      const ribTilt = new THREE.Group(); ribTilt.rotation.z = 0.26; ribTilt.position.y = 0.45;
      ribTilt.add(ribbon);
      ribbon.layers.enable(BLOOM_LAYER); ribTilt.visible = false; b.root.add(ribTilt);
      let upT = -100, rockPh = 0, ribT = -1;
      return {
        flourishLen: 2.4,
        update: ({ t, dt, idle, blend, fl, speed, groundRel }) => {
          // idle: leans on the hammer at her right, both hands on the shaft top, rocks it; the cape sways big
          const lean = 0.1 * idle;
          b.spine.rotation.z = -lean;
          b.spine.rotation.y += 0.30 * idle; // turned a little into the hammer so the far hand reaches it
          rockPh += dt * 3.1;
          const rock = Math.sin(rockPh) * 0.08 * idle;
          // the walk: a stomp on every contact (a deeper hip bob and a squash), the hammer drags behind
          const stomp = Math.abs(Math.sin(t * 6.283));
          b.hips.position.y -= 0.025 * (1 - stomp) * blend;
          b.spin.scale.set(1 + 0.03 * (1 - stomp) * blend, 1 - 0.03 * (1 - stomp) * blend, 1 + 0.03 * (1 - stomp) * blend);
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
          let whirl = 0;
          if (fl >= 0) {
            const spinU = THREE.MathUtils.smoothstep(fl, 0, 0.85);
            b.spin.rotation.y = spinU * Math.PI * 4;
            const out = THREE.MathUtils.smoothstep(fl, 0, 0.2) * (1 - THREE.MathUtils.smoothstep(fl, 0.85, 1.15));
            whirl = out;
            b.L.sh.rotation.z = 1.45 * out; b.R.sh.rotation.z = -1.45 * out; b.L.sh.rotation.x = 0; b.R.sh.rotation.x = 0; b.L.fa.rotation.x = 0; b.R.fa.rotation.x = 0; b.L.sh.rotation.y = 0;
            // the ribbon runs on its own clock: `dt` normally, `ctx.stopDt` while a hit-stop holds
            // the rig (T-31 — the stop may not freeze the effect that caused it)
            ribT = ribT < 0 ? fl : ribT + (dt > 0 ? dt : RIBBON_EXEMPT.dt);
            const grow = THREE.MathUtils.smoothstep(ribT, 0, RIBBON_GROW);
            const ribOut = THREE.MathUtils.smoothstep(ribT, 0, 0.12) * (1 - THREE.MathUtils.smoothstep(ribT, 0.62, 0.92));
            const rad = 0.28 + (RIBBON_R - 0.28) * grow;
            ribTilt.visible = ribOut > 0.02;
            ribbon.scale.set(rad, 1, rad);
            // the arc sweeps ahead of the body and keeps turning after the radius is full
            ribbon.rotation.y = -(spinU * Math.PI * 4 + ribT * 2.2);
            (ribbon.material).opacity = 0.6 * ribOut;
            const hop = Math.sin(THREE.MathUtils.clamp((fl - 1.05) / 0.4, 0, 1) * Math.PI);
            b.spin.position.y = 0.28 * hop;
            const look = THREE.MathUtils.smoothstep(fl, 1.5, 1.9);
            b.head.rotation.y += 0.7 * look; b.head.rotation.x += 0.1 * look;
          } else { b.spin.rotation.y = 0; b.spin.position.y = 0; ribTilt.visible = false; ribbon.scale.set(0.28, 1, 0.28); ribT = -1; }
          // --- the hammer, solved (T-45) ----------------------------------------------------------
          // the speed class: the walk clip is authored for ≤ 2.0 m/s (§2.7.4), and above it the
          // hammer comes up onto her shoulder (§2.4.5). Eased at 5/s over a 1 m/s band so the carry
          // changes over ~0.3 s and never snaps (Tier-0 rule 3).
          runU += (THREE.MathUtils.smoothstep(speed, 2.0, 3.0) - runU) * Math.min(1, dt * 5);
          cp.copy(CARRY.idle.p).lerp(CARRY.walk.p, blend).lerp(CARRY.run.p, runU).lerp(CARRY.whirl.p, whirl);
          cd.copy(CARRY.idle.d).lerp(CARRY.walk.d, blend).lerp(CARRY.run.d, runU).lerp(CARRY.whirl.d, whirl);
          cd.x += rock; // the idle rock, now a rock of the whole shaft about its head
          cd.normalize();
          const rG = THREE.MathUtils.lerp(THREE.MathUtils.lerp(THREE.MathUtils.lerp(CARRY.idle.r, CARRY.walk.r, blend), CARRY.run.r, runU), CARRY.whirl.r, whirl);
          const lWeight = (1 - blend) * (1 - whirl);
          hammer.quaternion.setFromUnitVectors(UP, cd);
          // stand the head *on* the ground whatever angle the shaft is at: the box's lowest corner,
          // not its centre, is what the ground has to clear (the old carry buried it 0.19–0.45 m)
          const drop = lowestDrop(hammer.quaternion, HEAD_HX, HEAD_HY, HEAD_HZ);
          // ... and on the ground *under the head*, which on a slope is not the ground under her feet
          headAt.set(cp.x, cp.y + drop + groundRel(cp.x, cp.z), cp.z);
          hammer.position.copy(headAt).addScaledVector(cd, HEAD_OFF);
          b.root.updateMatrixWorld(true);
          ikArm(b.R, b, b.spin.localToWorld(gw.copy(headAt).addScaledVector(cd, rG)), 1 - whirl);
          ikArm(b.L, b, b.spin.localToWorld(gw.copy(headAt).addScaledVector(cd, CARRY.idle.l)), lWeight); // the far hand only at idle: the bible's "both hands on the shaft top"
        },
      };
    },
  );
}
