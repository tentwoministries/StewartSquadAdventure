// Demo scene: Home, Wrong — the Forest island's camp quadrant, mirrored and wrong (story-beats.md
// §2.2, world-events-weather.md §2.1.4 `shadow.wrongDusk`, camp.md §2.7.6 and §2.8, dungeons.md
// §2.6.6). Collette and Isabella. The Brief calls this the best lighting in the game, and it earns
// that by contrast: everything warm at home is cold here, and the one warm thing left is far below.
// The camp is the Forest scene's own geometry, drained; the wrong things are added on top.
// URL: ?shot=S1   Keys: O shows them.
import * as THREE from 'three';
import { makeCollette } from '../_shared/kid-collette';
import { makeIsabella } from '../_shared/kid-isabella';
import { WORLD_U } from '../_shared/material';
import { drifters, fallers } from '../_shared/particles';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import type { Keyframe } from '../_shared/style';
import { makeProps as makeForestProps } from '../forest-dusk/props';
import { makeScatter, makeTrees } from '../forest-dusk/scatter';
import { groundY, makeTerrain } from '../forest-dusk/terrain';
import { makeCreatures } from './creatures';
import { clearSight, makeProps, voidify } from './props';
import { makeShadowSky, VOID } from './sky';

// The sky clock is locked: one keyframe, with a 40 s breathing on fog density (±15 %) and rift
// light (±25 %). The values are the bible's `shadow.wrongDusk` row through the T-07 conversion.
const WRONG: Keyframe = {
  name: 'wrongDusk (the clock is locked)', p: 0.65,
  key: { color: '#6A46A0', intensity: 0.95, elev: 12, azim: 300 },
  hemi: { sky: '#3C2668', ground: '#221436', intensity: 0.8 },
  fog: { color: '#2A1A42', near: 26, far: 74, max: 0.70, height: 7 },
  sky: { zenith: VOID.zenith, horizon: VOID.horizon, ground: VOID.ground, glow: 0 },
  cloud: '#241436', stars: 1, moon: { on: false, elev: 40, azim: 160 }, exposure: 0.95,
  lantern: 1, fireflies: 0, pollen: 0, fire: 1,
};

const STATIONS: Record<string, Station> = {
  S1: { name: 'The mirror fire', target: [0, 0.7, 0], yaw: 315, pitch: 30, d: 10, note: "the cold fire draining into its ring, the shadow squad's four empty seats, Ed's stump empty" },
  S2: { name: 'The cabin', target: [-8, 2.2, -11.5], yaw: 325, pitch: 24, d: 21, note: 'from the dooryard: the roof gone black, the windows lit ember, the door a black slot' },
  S3: { name: 'The south rim', target: [-4, -2, 54.5], yaw: 180, pitch: 30, d: 26, note: 'the one warm light in the world: the real camp fire through the void below the rim at −37°. The camera has to stand 15 m up and 13 m back or the rim skirt itself eats the sightline' },
  S4: { name: 'The mirror stream', target: [-14, 1.1, 17.5], yaw: 250, pitch: 14, d: 9, note: 'rift cyan, and climbing its own step: the water goes up' },
  W1: { name: 'The shard, wide', target: [-2, 0, 2], yaw: 320, pitch: 40, d: 44, note: 'the whole quadrant: the cabin, the fire, the torn tent, the void clouds below drifting in' },
  L1: { name: 'The fire, lower', target: [0, 0.9, 0], yaw: 315, pitch: 26, d: 20, note: 'the gameplay read: the cold pool on the ground, the cabin behind, the black moon over it' },
  CU: { name: 'Isabella by the cold fire', target: [1.5, 0.72, 1.4], yaw: 47, pitch: 8, d: 3.2, note: 'the ruby dress under a cyan key: the one frame that says what the shard does to the family' },
};

runScene({
  id: 'shadow', eyebrow: 'Shadow Realm', eyebrowAccent: 'Home, Wrong', title: 'Home, Wrong',
  line: 'Everything is where you left it.',
  // the key is lowercase because it becomes the saved frame's filename (the shot plugin's SAFE regex)
  keyframes: { wrong: WRONG }, times: ['wrong'], defaultTime: 'wrong',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU'],
  kids: [makeCollette(), makeIsabella()],
  place: (kid, i, shot, gy) => {
    if (i === 1) { kid.root.position.set(1.5, gy(1.5, 1.4), 1.4); kid.face(227); kid.lookAt.set(0, 0.9, 0); return; }
    const spots: Record<string, [number, number, number]> = {
      S1: [-2.6, 1.9, 300], S2: [-4.6, -7.0, 330], S3: [-7.5, 45.5, 165], S4: [-11.0, 16.4, 250],
      W1: [-1.6, 2.6, 300], L1: [-1.6, 2.6, 300], CU: [-1.4, 2.2, 100],
    };
    const [x, z, b] = spots[shot] ?? spots['S1']!;
    kid.root.position.set(x, gy(x, z), z); kid.face(b);
    kid.lookAt.set(0, 0.8, 0);
  },
  sky: 'cave', shadowHalf: 24,
  prev: 'rootways-golden', next: 'flight-golden',
  build: (scene) => {
    // the camp, exactly as the Forest scene builds it, then drained
    const terrain = makeTerrain();
    const trees = makeTrees();
    const forest = makeForestProps();
    const scatter = makeScatter(forest.footprints, trees.trunks);
    for (const g of [terrain.mesh, terrain.rim, trees.group, forest.group, scatter.group]) { voidify(g); scene.add(g); }
    // S3 looks 250 m south through the void at the one warm light; the camp's pines are the Forest
    // scene's and cannot be moved, so the corridor is cleared instead
    const sightCleared = clearSight(trees.group, new THREE.Vector2(-4, 32), 180, 6, 22) + clearSight(scatter.group, new THREE.Vector2(-4, 32), 180, 3, 16);
    // the lanterns are all out, glass cracked (camp.md §2.8); the campfire burns cold instead
    for (const l of forest.lanternLights) l.intensity = 0;
    forest.fireLight.intensity = 0;
    for (const l of forest.lanterns) l.visible = false;
    // the stream runs rift cyan
    (terrain.waterU['uStream'] as { value: THREE.Color }).value.set('#0A2A34');
    (terrain.waterU['uBed'] as { value: THREE.Color }).value.set('#08131A');
    // the foam term covers most of a 4 m stream at distance; at full rift it is a neon river
    (terrain.waterU['uFoam'] as { value: THREE.Color }).value.set('#1E4A56');
    (terrain.waterU['uAmbient'] as { value: THREE.Color }).value.set('#241A44');
    (terrain.waterU['uSunColor'] as { value: THREE.Color }).value.set(VOID.rift).multiplyScalar(0.10);
    (terrain.waterU['uGlint'] as { value: number }).value = 0.2;
    scene.add(terrain.water);

    const sky = makeShadowSky();
    scene.add(sky.group);
    const props = makeProps();
    scene.add(props.group);
    const creatures = makeCreatures();
    scene.add(creatures.group);
    // embers rising and ash falling (world-events §2.4.2 `pt.ember` Shadow, `pt.ash`)
    const embers = drifters(300, VOID.ember, 3.2, 1.8, { x: -2, z: 2, w: 90, d: 84, y0: 0.2, y1: 16 }, 1.1, 7);
    const ash = fallers(150, VOID.ash, 3.6, 0.7, { x: -2, z: 2, w: 90, d: 84, y0: 0.1, y1: 20 }, 0.55, 0.7, 8);
    scene.add(embers.pts, ash.pts);

    let breathe = 1;
    return {
      groundY, blockers: [...forest.footprints, ...props.footprints, ...trees.trunks], waterY: -0.25,
      update: (t, dt, kf, ctx) => {
        // the 40 s breathing: fog density ±15 %, rift light ±25 % (world-events §2.1.4)
        const b = Math.sin((t / 40) * 6.283);
        WORLD_U.uFogMax.value = kf.fog.max * (1 + 0.15 * b);
        breathe = 1 + 0.25 * b;
        sky.update(t, ctx.camera, breathe);
        props.update(t, dt, breathe, ctx.active.root.position);
        creatures.update(t, dt, ctx.active.root.position);
        embers.update(t, 1);
        ash.update(t, 1);
      },
      poi: () => creatures.poi() ?? props.fireSeat,
      hud: () => [props.hud(), ...creatures.hud(), `breathing ${breathe.toFixed(2)} on a 40 s cycle (fog ±15 %, rift ±25 %) · one keyframe, no clock · S3 sightline cleared of ${sightCleared} instances`],
      keys: {
        '0': { help: 'the deer goes', run: () => creatures.dissolveNow() },
        '[': { help: 'fog −', run: () => { WRONG.fog.max = Math.max(0.4, Math.round((WRONG.fog.max - 0.05) * 100) / 100); return `fog max ${WRONG.fog.max}`; } },
        ']': { help: 'fog +', run: () => { WRONG.fog.max = Math.min(0.95, Math.round((WRONG.fog.max + 0.05) * 100) / 100); return `fog max ${WRONG.fog.max}`; } },
      },
    };
  },
});
