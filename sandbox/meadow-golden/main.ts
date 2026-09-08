// Demo scene: the Crash Meadow fight beat (OPUS_EXPERIMENT_BRIEF.md §3.4, the spelled-out one).
// Isabella with Liam as the companion, three goblins out of camp A, and the two demo keys that are
// her kit: X the whirl (heroes.md §2.4.5) and G the Ground Pound, both with the §2.5.7 hit-stop of
// 0.04 s and screenShake(4, 0.15). The plate is the Forest scene's, centred on the meadow at (44, 0).
// URL: ?shot=S3&t=golden   Keys: O shows them.
import * as THREE from 'three';
import { makeIsabella } from '../_shared/kid-isabella';
import { makeLiam } from '../_shared/kid-liam';
import { WORLD_U } from '../_shared/material';
import { drifters, makePoints } from '../_shared/particles';
import { BLOOM_LAYER } from '../_shared/post';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { C, KEYFRAMES, VARIANT_NOTES, variant } from '../_shared/style';
import { makeScatter, makeTrees } from '../forest-dusk/scatter';
import { groundY, makeTerrain } from '../forest-dusk/terrain';
import { makeGoblins } from './goblins';
import { CAMP, makeProps } from './props';

// `?beat=1` sets the three goblins down inside the meadow beside Isabella and fires the whirl on
// the first frame, so the connect frame is reproducible from a URL instead of from timing a keypress
// (and because a browser pane that is open but not on screen runs the clock about twenty times slow).
const BEAT = new URLSearchParams(location.search).get('beat') === '1';

const STATIONS: Record<string, Station> = {
  S1: { name: 'The meadow', target: [44, 0.8, 0], yaw: 300, pitch: 40, d: 24, note: "the camp's palisade, the totems, Isabella and Liam, the furrow's end" },
  S2: { name: 'Goblin camp A', target: [40, 0.9, -14], yaw: 20, pitch: 38, d: 18, note: 'the gap, the cart and the cage, the cook-fire' },
  S3: { name: 'The beat', target: [44, 0.9, 2], yaw: 330, pitch: 34, d: 14, note: 'the fight at the distance the game plays at' },
  S4: { name: 'The totem', target: [58, 1.2, 18], yaw: 250, pitch: 20, d: 9, note: 'the carved face, the rag streamer, the skull on its spike' },
  W1: { name: 'The meadow, wide', target: [44, 0, 0], yaw: 300, pitch: 44, d: 40, note: 'the whole 45 x 45 m of open grass, ringed by its four totems' },
  L1: { name: 'The meadow, lower', target: [44, 0.8, 0], yaw: 300, pitch: 32, d: 26, note: 'S1 dropped: the trees on the meadow edge enter the frame' },
  CU: { name: 'Isabella close-up', target: [44, 0.75, 2], yaw: 330, pitch: 10, d: 4.2, note: 'she faces bearing 150, so the camera at yaw 330 has her face and the hammer' },
};

runScene({
  id: 'meadow', eyebrow: 'Enchanted Forest', eyebrowAccent: 'Crash Meadow', title: 'Crash Meadow',
  line: 'The flattest, emptiest ground on the island. Not for long.',
  keyframes: KEYFRAMES, times: ['golden', 'noon', 'dusk'], defaultTime: 'golden',
  variants: { ids: ['A', 'B', 'C'], notes: VARIANT_NOTES, apply: variant },
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU'],
  kids: [makeIsabella(), makeLiam()],
  place: (kid, i, _shot, gy) => {
    // Isabella at (44, 2) facing 150; Liam 2.5 m behind her left shoulder, idle
    const [x, z] = i === 0 ? [44, 2] : [42.2, 3.6];
    kid.root.position.set(x, gy(x, z), z); kid.face(150);
    kid.lookAt.set(CAMP.x, 0.7, CAMP.z);
  },
  sky: 'dome', shadowHalf: 26,
  prev: 'flight-golden', next: 'rim-dawn',
  build: (scene) => {
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.water);
    const props = makeProps();
    scene.add(props.group);
    // the Forest's trees, with the meadow emptied of them (a clear circle of radius 22 at (44, 0)):
    // `makeTrees()` takes no clear list, so the instances inside the circle are zeroed instead
    const trees = makeTrees();
    const m4 = new THREE.Matrix4(), tp = new THREE.Vector3(), tq = new THREE.Quaternion(), ts = new THREE.Vector3();
    let cleared = 0;
    trees.group.traverse((o) => {
      const im = o as THREE.InstancedMesh;
      if (!im.isInstancedMesh) return;
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, m4); m4.decompose(tp, tq, ts);
        if (Math.hypot(tp.x - 44, tp.z - 0) < 22) { im.setMatrixAt(i, m4.makeScale(0, 0, 0)); cleared++; }
      }
      im.instanceMatrix.needsUpdate = true;
    });
    scene.add(trees.group);
    const scatter = makeScatter([...props.footprints, { x: 44, z: 0, r: 0 }], trees.trunks);
    scene.add(scatter.group);
    const goblins = makeGoblins(props.gap, groundY, BEAT ? [[42.9, 1.2], [45.3, 2.5], [44.1, 3.4]] : [[CAMP.x - 1.4, CAMP.z + 1.6], [CAMP.x + 1.2, CAMP.z + 1.0], [CAMP.x - 0.2, CAMP.z - 1.8]]);
    scene.add(goblins.group);
    // pollen over the meadow (the Forest fx set, 220 points, alpha x0.7); fireflies are off at golden
    const pollen = drifters(220, C.pollen, 3.4, 1.2, { x: 44, z: 0, w: 46, d: 46, y0: 0.3, y1: 4.5 }, 0.2, 17);
    scene.add(pollen.pts);
    // the Ground Pound's gold ring and its dust puff
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1.0, 40),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFD966').multiplyScalar(2.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2; ring.layers.enable(BLOOM_LAYER); ring.visible = false;
    scene.add(ring);
    const dust = makePoints(12, '#8A6A3E', 5, 0.9, false);
    scene.add(dust.pts);

    let shakeT = -100, stopT = -100, poundT = -100, ringFlash = -100, lastSpin = 0, armed = BEAT;
    const dustAt = new THREE.Vector3(), camBase = new THREE.Vector3();
    const hero = new THREE.Vector3();
    return {
      groundY, blockers: [...props.footprints, ...trees.trunks], waterY: -0.25,
      update: (t, dt, kf, ctx) => {
        WORLD_U.uCurveCenter.value.set(44, 0);
        if (poundT === -1) poundT = t; // the key stamps a marker; the clock is owned here
        if (armed) { armed = false; ctx.active.flourish(); }
        // hit-stop: the scene's dt is zeroed for 0.04 s (heroes.md §2.5.7's third added site).
        // The ribbon and the shards keep their own clock, as the plan asks.
        const stopped = t - stopT < 0.04;
        const sdt = stopped ? 0 : dt;
        props.update(t, sdt, kf);
        const iz = ctx.active;
        hero.copy(iz.root.position);
        goblins.update(t, sdt, hero, () => {
          // the hit: her ring flashes white for 0.15 s and the camera shakes 4 px / 0.15 s
          ringFlash = t; shakeT = t;
        });
        pollen.update(t, kf.pollen);
        // X: the whirl. The connect is the first frame past 180° of the first turn (about 0.2 s in)
        const spin = iz.bones.spin.rotation.y;
        if (spin >= Math.PI && lastSpin < Math.PI) {
          const n = goblins.strike(hero, 1.9);
          if (n > 0) { stopT = t; shakeT = t; ringFlash = t; }
        }
        lastSpin = spin;
        // G: the Ground Pound. 0.10 crouch, 0.15 airborne (0.5 m), impact at 0.30
        const pa = t - poundT;
        if (pa >= 0 && pa < 0.7) {
          const b = iz.bones;
          if (pa < 0.10) b.spin.position.y = -0.16 * (pa / 0.10);
          else if (pa < 0.30) { const u = (pa - 0.10) / 0.20; b.spin.position.y = -0.16 + Math.sin(u * Math.PI) * 0.66; }
          else b.spin.position.y = Math.max(0, 0.12 * (1 - (pa - 0.30) / 0.25));
          b.R.sh.rotation.x = pa < 0.30 ? -2.4 : -0.6; b.L.sh.rotation.x = pa < 0.30 ? -2.4 : -0.6;
          if (pa >= 0.30 && pa < 0.30 + dt) {
            const n = goblins.strike(hero, 2.5);
            stopT = t; shakeT = t; ringFlash = t;
            dustAt.copy(hero); void n;
          }
          const ru = (pa - 0.30) / 0.35;
          ring.visible = ru >= 0 && ru <= 1;
          if (ring.visible) {
            ring.position.set(hero.x, groundY(hero.x, hero.z) + 0.04, hero.z);
            const rr = 0.4 + ru * 2.1;
            ring.scale.set(rr, rr, 1);
            (ring.material).opacity = 0.9 * (1 - ru);
          }
        } else ring.visible = false;
        for (let i = 0; i < 12; i++) {
          const age = t - poundT - 0.30 - i * 0.012;
          const alive = age > 0 && age < 0.9;
          dust.pos[i * 3] = dustAt.x + Math.cos(i * 1.9) * (0.3 + age * 1.6);
          dust.pos[i * 3 + 1] = groundY(dustAt.x, dustAt.z) + 0.1 + age * 0.7 - age * age * 0.6;
          dust.pos[i * 3 + 2] = dustAt.z + Math.sin(i * 1.9) * (0.3 + age * 1.6);
          dust.alpha[i] = alive ? (1 - age / 0.9) * 0.8 : 0;
        }
        dust.commit();
        // the ring flash on her selection ring, and the shake
        const fl = t - ringFlash;
        const u = fl >= 0 && fl < 0.15 ? 1 - fl / 0.15 : 0;
        (iz.ring.material as THREE.ShaderMaterial).uniforms['uAlpha']!.value = 0.35 + 0.9 * u;
        const sa = t - shakeT;
        if (sa >= 0 && sa < 0.15) {
          // 4 px at 1600 px wide is 0.0025 of the frame; at this station that is about 3.5 cm
          if (sa < dt * 1.5) camBase.copy(ctx.camera.position);
          const k = (1 - sa / 0.15) * 0.0025 * 2 * ctx.camera.position.distanceTo(hero) * Math.tan((35 * Math.PI) / 360) * 1.6;
          ctx.camera.position.set(camBase.x + Math.sin(sa * 190) * k, camBase.y + Math.cos(sa * 160) * k, camBase.z + Math.sin(sa * 145 + 1) * k);
        }
      },
      poi: () => goblins.poi(),
      hud: () => [goblins.hud(), `meadow x 22-62, z ±22 · trees cleared inside r 22 of (44, 0): ${cleared} · whirl r 1.9 at 180° of turn 1 · pound r 2.5 at 0.30 s`],
      keys: {
        '0': { help: 'send the goblins', run: () => goblins.sendAll() },
        g: { help: 'Ground Pound', run: () => { poundT = -1; return 'GROUND POUND'; } },
        '[': { help: 'goblins slower', run: () => { goblins.speed.value = Math.max(0.5, Math.round((goblins.speed.value - 0.25) * 1000) / 1000); return `${goblins.speed.value} m/s`; } },
        ']': { help: 'goblins faster', run: () => { goblins.speed.value = Math.min(5, Math.round((goblins.speed.value + 0.25) * 1000) / 1000); return `${goblins.speed.value} m/s`; } },
      },
    };
  },
});
