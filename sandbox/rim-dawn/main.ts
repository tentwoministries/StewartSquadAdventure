// Demo scene: the west rim at dawn, where the stream leaves the island (OPUS_EXPERIMENT_BRIEF.md
// §3.5, the second spelled-out one). The Forest plate exactly as the Forest scene builds it, minus
// the deer's wandering — plus the waterfall off the rim, the plunge pool that is not on the island,
// the dawn keyframe from the bible's Forest row, and the peaceful layer.
// URL: ?shot=S1&t=dawn   Keys: O shows them.
import * as THREE from 'three';
import { WORLD_U } from '../_shared/material';
import { drifters } from '../_shared/particles';
import { makeLiam } from '../_shared/kid-liam';
import { runScene } from '../_shared/scene';
import type { CloudSpec } from '../_shared/sky';
import type { Station } from '../_shared/shot';
import { C, KEYFRAMES, type Keyframe } from '../_shared/style';
import { makeDeer } from '../forest-dusk/deer';
import { makeFx } from '../forest-dusk/fx';
import { makeProps } from '../forest-dusk/props';
import { makeScatter, makeTrees } from '../forest-dusk/scatter';
import { groundY, makeTerrain, POND } from '../forest-dusk/terrain';
import { makeLife } from './life';
import { makeWaterfall } from './waterfall';

// The bible's Forest dawn row through the T-07 conversion, with the plan's tuned column.
const DAWN: Keyframe = {
  name: 'dawn', p: 0.1,
  key: { color: '#FFB48C', intensity: 1.3, elev: 8, azim: 100 },
  hemi: { sky: '#6E7FB8', ground: '#2E5A3A', intensity: 0.45 },
  fog: { color: '#7A76B0', near: 22, far: 65, max: 0.7, height: 12 },
  sky: { zenith: '#2B3A70', horizon: '#F2A57A', ground: '#3C4C7A', glow: 0.7 },
  cloud: '#F5C9B0', stars: 0.25, moon: { on: true, elev: 20, azim: 280 }, exposure: 0.95,
  lantern: 0.5, fireflies: 0.15, pollen: 0.4, fire: 1,
};

// The two below-rim clouds of the Forest sky are moved, for this scene only, to sit just west of
// the fall; the rest of the shared list is kept so the sky still reads as the Forest's.
const CLOUDS: CloudSpec[] = [
  [-72, -10, 36, 12], [-80, -13, 46, 13],
  [30, 28, -70, 12], [-20, 34, -90, 14], [70, 30, 20, 10], [-60, 26, 60, 11], [10, 38, 90, 13],
];

const STATIONS: Record<string, Station> = {
  S1: { name: 'The fall', target: [-54, -2, 42], yaw: 110, pitch: 22, d: 20, note: 'the fall from the rim’s north side, the plunge pool below, the clouds beyond' },
  S2: { name: 'Below the rim', target: [-56, -8, 42], yaw: 70, pitch: 6, d: 26, note: 'off the island looking back: the fall in full height, the rim over it' },
  S3: { name: 'The pond at dawn', target: [-45, -0.3, -30], yaw: 300, pitch: 45, d: 22, note: 'camp.md §2.11.5 S4 exactly, with the deer drinking at the west bank' },
  S4: { name: "The stream's last bend", target: [-46, 0.6, 36], yaw: 200, pitch: 38, d: 18, note: 'the water speeding toward the lip, the foam, Liam' },
  W1: { name: 'The rim, wide', target: [-48, 0, 30], yaw: 120, pitch: 40, d: 44, note: 'the whole west rim: the stream, the lip, the fall and the void' },
  L1: { name: 'The fall, lower', target: [-54, -2, 42], yaw: 110, pitch: 14, d: 24, note: 'S1 dropped: the sky and the below-rim clouds fill the top of the frame' },
  CU: { name: 'Liam close-up', target: [-48, 0.95, 34], yaw: 70, pitch: 10, d: 4.4, note: 'he faces 250 and watches the fall; the dawn key is behind the camera at azimuth 100' },
};

runScene({
  id: 'rim', eyebrow: 'Enchanted Forest', eyebrowAccent: 'The West Rim', title: 'The West Rim',
  line: 'Where the stream runs out of island.',
  keyframes: { dawn: DAWN, golden: KEYFRAMES['golden']!, noon: KEYFRAMES['noon']! },
  times: ['dawn', 'golden', 'noon'], defaultTime: 'dawn',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU'],
  kids: [makeLiam()],
  place: (kid, _i, _shot, gy) => { kid.root.position.set(-48, gy(-48, 34), 34); kid.face(250); kid.lookAt.set(-54, -1, 42); },
  sky: 'dome', shadowHalf: 28, clouds: CLOUDS,
  prev: 'meadow-golden', next: 'forest-dusk',
  build: (scene) => {
    // the Forest plate, exactly as sandbox/forest-dusk/main.ts builds it
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.water);
    const trees = makeTrees();
    scene.add(trees.group);
    const props = makeProps();
    scene.add(props.group);
    const scatter = makeScatter(props.footprints, trees.trunks);
    scene.add(scatter.group);
    const fx = makeFx();
    fx.group.position.set(0, groundY(0, 0), 0);
    scene.add(fx.group);
    // the deer, drinking at the pond's west bank, not wandering. The plan's (−43, −28) is 3.6 m
    // from the pond's centre, i.e. in the water (POND is r 9); the bank is at about x −49.5, and
    // facing 110 has it looking at the water rather than away from it. Logged, not argued.
    const deer = makeDeer({ x: POND.x + 3, z: POND.z + 2, r: 3, avoid: [] });
    deer.park(-49.5, -28.5, 110);
    scene.add(deer.root);
    const fall = makeWaterfall();
    scene.add(fall.group);
    // the birch nearest the fall carries the songbirds
    const birch = new THREE.Vector3(-45, groundY(-45, 30) + 4.2, 30);
    const life = makeLife(birch);
    scene.add(life.group);
    // mist wisps over the pond and the stream's last 20 m (world-events §2.4.2 `pt.mist`)
    const mist = drifters(30, DAWN.fog.color, 26, 0.5, { x: -44, z: 6, w: 34, d: 76, y0: 0.2, y1: 2.2 }, 0.05, 23);
    scene.add(mist.pts);

    const hemiC = new THREE.Color();
    return {
      groundY, blockers: [...props.footprints, ...trees.trunks], waterY: -0.25,
      update: (t, dt, kf, ctx) => {
        WORLD_U.uCurveCenter.value.set(-48, 34);
        hemiC.set(kf.hemi.sky);
        fx.update(t, dt, kf, hemiC);
        for (const l of props.lanternLights) l.intensity = 14 * kf.lantern;
        props.fireLight.intensity = 90 * kf.fire;
        deer.update(t, dt, groundY);
        fall.update(t, dt);
        life.update(t, dt, ctx.active.root.position);
        mist.update(t, 1);
        // the pond carries the bobber's ring; the Forest's water shader owns the rocks' foam
        void life.bobber;
      },
      poi: () => life.poi() ?? fall.lip,
      hud: () => [fall.hud(), life.hud()],
      keys: {
        '0': { help: 'the birds go up', run: () => life.burstNow() },
        '[': { help: 'the deer walks', run: () => { deer.walkNow(); return 'the deer moves'; } },
      },
    };
  },
});
void C;
