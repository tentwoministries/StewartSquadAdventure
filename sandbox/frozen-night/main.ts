// Demo scene 4: Frozen Peaks, the valley under the aurora, with Isabella (her whirl kicks up the
// snow). URL: ?shot=S1&t=night   Keys: O shows them. STUDY_NOTES.md §3 row 4; §7 for the treasures.
import * as THREE from 'three';
import { FROZEN as F, FROZEN_KEYFRAMES } from '../_shared/biomes';
import { makeIsabella } from '../_shared/kid-isabella';
import { WORLD_U } from '../_shared/material';
import { burst, fallers, makePoints } from '../_shared/particles';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { lightWater } from '../_shared/water';
import { makeAurora } from './aurora';
import { makeCreatures } from './creatures';
import { makeFlora } from './flora';
import { makeProps } from './props';
import { groundY, ICE_Y, lakeD, makeTerrain, onIce, terrainY } from './terrain';

const STATIONS: Record<string, Station> = {
  S1: { name: 'The Hearth', target: [-1, 0.9, -1], yaw: 335, pitch: 40, d: 22, note: "Neve's hut with the lit window and smoke, the woodpile, the snowman, Isabella by the hearth-pot, the giants behind" },
  S2: { name: 'The frozen lake', target: [-22, 0.3, 10], yaw: 15, pitch: 30, d: 28, note: 'the ice with its cracks, the elk herd crossing, the aurora over the north peaks at night' },
  S3: { name: 'The glacier shelf', target: [30, 2.2, -22], yaw: 300, pitch: 34, d: 20, note: 'the propeller frozen in blue ice, the goats on the ledges' },
  S4: { name: 'The ice-fall', target: [-8, 5, -36], yaw: 5, pitch: 22, d: 32, note: 'the frozen waterfall on the north cliff over its pool, icicles, the peaks behind' },
  W1: { name: 'Valley, wide', target: [-4, 0, 2], yaw: 340, pitch: 44, d: 46, note: 'the whole valley: the Hearth, the strip and the plane, the lake, the shelf, the giants' },
  L1: { name: 'Lake, lower', target: [-22, 2.0, 10], yaw: 10, pitch: 5, d: 34, note: 'the aurora curtains fill the top of the frame over the lake and the peaks' },
  CU: { name: 'Isabella close-up', target: [1.6, 0.85, 2.2], yaw: 330, pitch: 12, d: 4.0, note: 'the big blonde hair with the bows and tiara, the biggest eyes, the hammer, the cape' },
  PG: { name: 'The penguins', target: [-35, 0.8, 0], yaw: 250, pitch: 22, d: 13, note: 'the colony on its drift: waddle up, belly-slide down' },
  OB: { name: 'The Observatory', target: [48, 16, -44], yaw: 25, pitch: 12, d: 44, note: 'the dome on the summit, the only man-made silhouette on the island' },
};

runScene({
  id: 'frozen', eyebrow: 'Frozen Peaks', eyebrowAccent: 'The Hearth', title: 'The Hearth', line: "Where the propeller went. Don't look down.",
  keyframes: FROZEN_KEYFRAMES, times: ['morning', 'golden', 'dusk', 'night'], defaultTime: 'night',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU', 'PG', 'OB'],
  kids: [makeIsabella()],
  place: (kid, _i, shot, gy) => {
    if (shot === 'S2' || shot === 'L1') { kid.root.position.set(-14, gy(-14, 6), 6); kid.face(300); kid.lookAt.set(-24, 1.2, 8); }
    else if (shot === 'S3') { kid.root.position.set(26, gy(26, -15), -15); kid.face(340); kid.lookAt.set(31, 2.5, -22); }
    else if (shot === 'S4') { kid.root.position.set(-6, gy(-6, -24), -24); kid.face(0); kid.lookAt.set(-8, 8, -38); }
    else if (shot === 'PG') { kid.root.position.set(-31, gy(-31, 5), 5); kid.face(250); kid.lookAt.set(-36, 0.5, 0); }
    else { kid.root.position.set(1.6, gy(1.6, 2.2), 2.2); kid.face(150); kid.lookAt.set(-2, 1.4, -1); }
  },
  sky: 'dome', shadowHalf: 30,
  // five clouds at peak height and one below the rim off the east edge by the shelf (world-events §2.4.1)
  clouds: [[-40, 48, -90, 14], [30, 52, -70, 16], [80, 46, 10, 13], [-70, 44, 40, 14], [20, 50, 95, 12], [88, -16, -20, 11]],
  prev: 'bog-night', next: 'caves-descent',
  build: (scene) => {
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.ice.mesh, terrain.peaks);
    const flora = makeFlora();
    scene.add(flora.group);
    const props = makeProps();
    scene.add(props.group);
    const creatures = makeCreatures(flora.owlPerch, props.goatLedges);
    scene.add(creatures.group);
    const aurora = makeAurora();
    scene.add(aurora.group);
    // snowfall (light, always), ice glitter on the snow and the lake (view-independent twinkle here), the whirl's snow burst
    const snow = fallers(300, '#FFFFFF', 3.4, 0.9, { x: -6, z: 0, w: 100, d: 90, y0: 0.2, y1: 14 }, 1.1, 0.5, 6);
    scene.add(snow.pts);
    const N_G = 260;
    const glitter = makePoints(N_G, F.glitter, 3.0, 1.6, false);
    const gSeed = Array.from({ length: N_G }, (_, i) => { const x = -52 + ((i * 37.3) % 108), z = -46 + ((i * 53.7) % 94); return { x, z, y: groundY(x, z) + 0.03, s: 3 + (i % 7) * 0.8, a: i * 1.7 }; });
    scene.add(glitter.pts);
    const kick = burst(40, '#FFFFFF', 4.5, 1.3, 33);
    scene.add(kick.pts);
    let lastSpin = 0, auroraLevel = 0;
    return {
      groundY, blockers: [...props.footprints, ...flora.trunks], waterY: -5,
      applyKeyframe: (kf, keyDir) => {
        lightWater(terrain.ice, keyDir, kf.key.color, kf.key.intensity, kf.hemi.sky, kf.key.elev);
        auroraLevel = kf.aurora ?? 0;
      },
      update: (t, dt, kf, ctx) => {
        props.update(t, dt, kf);
        creatures.update(t, dt, kf, ctx.active.root.position);
        aurora.update(t, auroraLevel);
        WORLD_U.uAurora.value = auroraLevel;
        snow.update(t, kf.pollen * 0.8);
        const glitK = (kf.key.elev < 30 ? 1 : 0.35) * (1 + auroraLevel);
        for (let i = 0; i < N_G; i++) { const g = gSeed[i]!; glitter.pos[i * 3] = g.x; glitter.pos[i * 3 + 1] = g.y; glitter.pos[i * 3 + 2] = g.z; glitter.alpha[i] = Math.pow(Math.max(0, Math.sin(t * g.s + g.a)), 24) * 0.9 * glitK; }
        glitter.commit();
        // the whirl kicks up snow: a burst at her feet when the spin starts
        const spin = ctx.active.bones.spin.rotation.y;
        if (spin > 0.2 && lastSpin <= 0.2) { const p = ctx.active.root.position; kick.fire(p.x, p.y + 0.1, p.z, new THREE.Vector3(0, 1, 0), 2.2, 1.2); }
        lastSpin = spin;
        kick.update(t, 1);
      },
      poi: () => creatures.poi(),
      hud: () => [`aurora ${auroraLevel.toFixed(2)} (4 curtains + the snow wash) · glitter ${N_G} · snow 300 · ice at y ${ICE_Y} (walkable)`, ...creatures.hud()],
      keys: {
        '0': { help: 'the herd crosses', run: () => creatures.herdCross() },
        '[': { help: 'aurora −', run: () => { auroraLevel = Math.max(0, Math.round((auroraLevel - 0.1) * 100) / 100); return `aurora ${auroraLevel.toFixed(2)}`; } },
        ']': { help: 'aurora +', run: () => { auroraLevel = Math.min(1.5, Math.round((auroraLevel + 0.1) * 100) / 100); return `aurora ${auroraLevel.toFixed(2)}`; } },
      },
    };
  },
});
void lakeD; void onIce; void terrainY;
