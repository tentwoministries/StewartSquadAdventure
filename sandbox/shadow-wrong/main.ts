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
import { deg } from '../_shared/rng';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import type { Keyframe } from '../_shared/style';
import { makeProps as makeForestProps } from '../forest-dusk/props';
import { makeScatter, makeTrees } from '../forest-dusk/scatter';
import { groundY, makeTerrain } from '../forest-dusk/terrain';
import { makeCreatures } from './creatures';
import { clearNear, clearSight, makeProps, thinScatter, voidify } from './props';
import { makeShadowSky, VOID } from './sky';

// The sky clock is locked: one keyframe, with a 40 s breathing on fog density (±15 %) and rift
// light (±25 %). The values are the bible's `shadow.wrongDusk` row through the T-07 conversion.
// Retuned in the fix pass (T-24's numeric column is parked, its floor is not): the key is up and
// the hemisphere down to about a third of it (T-20), which is what lets the low key throw the long
// shadows `shadow-wrong-s1-01` had none of; the fog colour is lifted because at 26–74 m the fog
// *is* the value of most of the frame, and at `#2A1A42` it put 73 % of S1 under the 12 % floor.
const WRONG: Keyframe = {
  name: 'wrongDusk (the clock is locked)', p: 0.65,
  key: { color: '#7A52B4', intensity: 3.0, elev: 12, azim: 300 },
  hemi: { sky: '#4E3486', ground: '#33204F', intensity: 0.44 },
  fog: { color: '#3C2560', near: 16, far: 60, max: 0.72, height: 7 },
  sky: { zenith: VOID.zenith, horizon: VOID.horizon, ground: VOID.ground, glow: 0 },
  cloud: '#241436', stars: 1, moon: { on: false, elev: 40, azim: 160 }, exposure: 1.0,
  lantern: 1, fireflies: 0, pollen: 0, fire: 1,
};

// Every station's note is written from the render, not beside the numbers (T-30).
const STATIONS: Record<string, Station> = {
  S1: { name: 'The mirror fire', target: [0, 0.7, 0], yaw: 315, pitch: 22, d: 12, note: "read off the frame: the cold fire's cyan pool dead centre with the three tongues hanging into the ring, the shadow squad's four seats round it and all four still empty, Collette at the left and Isabella beyond the fire facing the camera, the citadel's ember spill across the top right, the torn tent and the deer at the top left, and the long shadows the low key throws toward the lens. At this pitch the frame's top edge is 4.5° below the horizon, so none of the sky's furniture is in it: the black moon sits at +40° and cannot share a 35° frame with the fire" },
  S2: { name: 'The cabin', target: [-8, 2.2, -11.5], yaw: 325, pitch: 24, d: 21, note: 'from the dooryard: the roof gone black, the windows lit ember, the door a black slot' },
  S3: { name: 'The south rim (a beat, not a station)', target: [-4, -2, 54.5], yaw: 180, pitch: 30, d: 26, note: 'a beat for the hub\'s "Beats" row and not a place you stand: the one warm light in the world, the real camp fire through the void 250 m below the rim at −37°, with two void clouds lit from underneath by it and the lip\'s rift cracks in the near third. The camera has to stand 13 m above the lip or the rim skirt itself eats the sightline (T-25); the sky\'s moon is at +40° and cannot share a 35° frame with a light at −37°' },
  S4: { name: 'The mirror stream', target: [-14, 1.0, 17.5], yaw: 72, pitch: 12, d: 8.5, note: 'across the stream instead of along it: the broken step in silhouette, the sheet of water climbing its face with the bands travelling up, the drops carrying on over the lip, and Collette on the far bank for the scale of it' },
  W1: { name: 'The shard, wide', target: [-2, 0, 2], yaw: 320, pitch: 40, d: 44, note: 'the whole quadrant: the cabin, the fire, the torn tent, the void clouds below drifting in' },
  L1: { name: 'The fire, lower', target: [0, 0.9, 0], yaw: 315, pitch: 26, d: 20, note: 'the gameplay read: the cold pool on the ground, the cabin behind, the black moon over it' },
  CU: { name: 'Isabella by the cold fire', target: [-3.4, 0.98, -5.2], yaw: 330, pitch: 8, d: 3.0, note: 'the ruby dress at portrait distance: she stands a step back from the fire for this one so the camera is 3.3 m from the ring and not inside the falling embers (at 0.8 m one of them is a 138 px bokeh disc), with the citadel\'s ember windows 11 m behind her and the cold fire\'s cyan on her left' },
  SW: { name: 'The swing', target: [4.8, 0.9, -11.5], yaw: 237, pitch: 14, d: 7, note: 'the swing that swings by itself, ±25° on a 3.1 s period: the seat crosses a quarter of the frame in half a second. The citadel\'s ember windows are the back light, a cracked lantern leaking rift cyan is the near one, and Isabella stands at the left for the scale' },
  DE: { name: 'The shadow deer', target: [-9.5, 1.0, 9.5], yaw: 225, pitch: 16, d: 9.5, note: 'the deer at its parked spot with the cold fire behind the camera: press 0 and it dissolves into the mote column over 1.6 s' },
};

const collette = makeCollette();
const isabella = makeIsabella();

/** A station's camera position in the ground plane (the same arithmetic as `shot.ts` placeCamera). */
function camXZ(s: Station): [number, number] {
  const f = [Math.sin(deg(s.yaw)), -Math.cos(deg(s.yaw))];
  return [s.target[0] - f[0]! * s.d * Math.cos(deg(s.pitch)), s.target[2] - f[1]! * s.d * Math.cos(deg(s.pitch))];
}

runScene({
  id: 'shadow', eyebrow: 'Shadow Realm', eyebrowAccent: 'Home, Wrong', title: 'Home, Wrong',
  line: 'Everything is where you left it.',
  // the key is lowercase because it becomes the saved frame's filename (the shot plugin's SAFE regex)
  keyframes: { wrong: WRONG }, times: ['wrong'], defaultTime: 'wrong',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU', 'SW', 'DE'],
  kids: [collette, isabella],
  place: (kid, i, shot, gy) => {
    if (i === 1) {
      // Isabella stood at (1.5, 1.4) with her legs inside the stump behind her and her back to S1.
      // She now stands clear of the seats on the *far* side of the fire, facing it and the camera:
      // the four seats stay empty, which is the whole point of them (camp.md §2.8)
      if (shot === 'SW') { kid.root.position.set(6.5, gy(6.5, -9.5), -9.5); kid.face(355); return; }
      // the close-up moves her a step back from the ring, so the lens is clear of the fire's embers
      const [ix, iz] = shot === 'CU' ? [-3.4, -5.2] : [-1.9, -2.9];
      kid.root.position.set(ix, gy(ix, iz), iz); kid.face(147);
      return;
    }
    const spots: Record<string, [number, number, number]> = {
      S1: [-2.6, 1.9, 54], S2: [-4.6, -7.0, 330], S3: [-7.5, 45.5, 165], S4: [-15.5, 15.5, 157],
      W1: [-1.6, 2.6, 54], L1: [-1.6, 2.6, 54], CU: [-1.0, 1.8, 200],
      SW: [9.0, -8.5, 240], DE: [-6.5, 2.5, 315],
    };
    const [x, z, b] = spots[shot] ?? spots['S1']!;
    kid.root.position.set(x, gy(x, z), z); kid.face(b);
  },
  sky: 'cave', shadowHalf: 24,
  prev: 'rootways-golden', next: 'flight-golden',
  build: (scene, params) => {
    const shot = STATIONS[params.shot] ? params.shot : 'S1';
    // the camp, exactly as the Forest scene builds it, then drained
    const terrain = makeTerrain();
    const trees = makeTrees();
    const forest = makeForestProps();
    const scatter = makeScatter(forest.footprints, trees.trunks);
    for (const g of [terrain.mesh, terrain.rim, trees.group, forest.group, scatter.group]) { voidify(g); scene.add(g); }
    // S3 looks 250 m south through the void at the one warm light; the camp's pines are the Forest
    // scene's and cannot be moved, so the corridor is cleared instead
    const sightCleared = clearSight(trees.group, new THREE.Vector2(-4, 32), 180, 6, 22) + clearSight(scatter.group, new THREE.Vector2(-4, 32), 180, 3, 16);
    // and no station may have a tree standing on its lens (LESSONS.md Camera row 4: `s4` had a
    // lollipop pine in the upper-left corner, 3 m in front of the camera)
    let lensCleared = 0;
    for (const s of Object.values(STATIONS)) {
      // only a low camera can have a tree on its lens; from 28 m up (W1) a trunk below the camera is
      // 50° off the axis and out of frame, and clearing it would be a hole in the canopy for nothing
      if (s.target[1] + s.d * Math.sin(deg(s.pitch)) > 6) continue;
      const [cx, cz] = camXZ(s);
      lensCleared += clearNear(trees.group, cx, cz, 5.5);
    }
    // T-09, the confetti re-made: the Forest's tufts were recoloured and never thinned. Half of
    // them go, in whole cells so what is left is clustered, and none is left inside the fire's pool
    const [tuftsBefore, tuftsAfter] = thinScatter(scatter.group, 0.5, { x: 0, z: 0, r: 5.2 });
    // the lanterns are all out, glass cracked (camp.md §2.8); the campfire burns cold instead
    for (const l of forest.lanternLights) l.intensity = 0;
    forest.fireLight.intensity = 0;
    for (const l of forest.lanterns) l.visible = false;
    // the stream runs rift cyan
    (terrain.waterU['uStream'] as { value: THREE.Color }).value.set('#0A2A34');
    (terrain.waterU['uBed'] as { value: THREE.Color }).value.set('#08131A');
    // the foam term covers most of a 4 m stream at distance; at full rift it is a neon river
    (terrain.waterU['uFoam'] as { value: THREE.Color }).value.set('#1E4A56');
    (terrain.waterU['uAmbient'] as { value: THREE.Color }).value.set('#2A2050');
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
    // the point size scales as 18/z, so a 3.6 px sprite 0.6 m from a close-up's lens is a 100 px
    // disc: `shadow-wrong-cu` had seven of them across the frame. Smaller and fewer.
    const embers = drifters(260, VOID.ember, 2.4, 1.6, { x: -2, z: 2, w: 90, d: 84, y0: 0.2, y1: 16 }, 1.1, 7);
    const ash = fallers(110, VOID.ash, 2.0, 0.55, { x: -2, z: 2, w: 90, d: 84, y0: 0.1, y1: 20 }, 0.55, 0.7, 8);
    scene.add(embers.pts, ash.pts);
    // the point sprites scale as 18/z, so an ambient fleck half a metre from a portrait lens is a
    // 90 px bokeh disc: the close-up drops the weather and keeps the fire's own embers
    ash.pts.visible = shot !== 'CU';
    embers.pts.visible = shot !== 'CU';

    // what each station's heads are for: the runtime owns every kid's lookAt, so this is the hook
    const seat = new THREE.Vector3(), poiV = new THREE.Vector3();
    const stationPoi = (): THREE.Vector3 | null => {
      if (shot === 'SW') return props.seatWorld(seat);
      if (shot === 'S4') return poiV.set(-14, 1.4, 17.5);
      if (shot === 'S3') return props.farFire;
      return null;
    };

    let breathe = 1;
    let lastCam: THREE.PerspectiveCamera | null = null;
    (window as unknown as Record<string, unknown>)['ssProbe'] = {
      deer: () => creatures.probe(),
      swingSeat: () => { const v = props.seatWorld(new THREE.Vector3()); return { x: Number(v.x.toFixed(3)), y: Number(v.y.toFixed(3)), z: Number(v.z.toFixed(3)) }; },
      // the seat in frame pixels (1600 x 1000), so a stepped pair can be measured and not eyeballed
      seatScreen: () => {
        if (!lastCam) return null;
        const v = props.seatWorld(new THREE.Vector3()).project(lastCam);
        return { px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(1)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(1)) };
      },
      tufts: () => ({ before: tuftsBefore, after: tuftsAfter, sightCleared, lensCleared }),
      farFill: () => (props.group.children.find((c) => (c as THREE.DirectionalLight).isDirectionalLight) as THREE.DirectionalLight | undefined)?.intensity ?? null,
    };
    return {
      groundY, blockers: [...forest.footprints, ...props.footprints, ...trees.trunks], waterY: -0.25,
      update: (t, dt, kf, ctx) => {
        // the 40 s breathing: fog density ±15 %, rift light ±25 % (world-events §2.1.4)
        const b = Math.sin((t / 40) * 6.283);
        WORLD_U.uFogMax.value = kf.fog.max * (1 + 0.15 * b);
        breathe = 1 + 0.25 * b;
        lastCam = ctx.camera;
        sky.update(t, ctx.camera, breathe);
        props.update(t, dt, breathe, ctx.active.root.position);
        creatures.update(t, dt, ctx.active.root.position);
        embers.update(t, 1);
        ash.update(t, 1);
      },
      poi: () => stationPoi() ?? creatures.poi() ?? props.fireSeat,
      look: (kid) => (kid !== isabella ? null : shot === 'SW' ? props.seatWorld(seat) : shot === 'CU' ? props.fireSeat : null),
      hud: () => [
        props.hud(),
        ...creatures.hud(),
        `breathing ${breathe.toFixed(2)} on a 40 s cycle (fog ±15 %, rift ±25 %) · one keyframe, no clock`,
        `scatter ${tuftsBefore} → ${tuftsAfter} tufts (T-09, thinned in this folder on the imported instances) · S3 corridor cleared of ${sightCleared} · station lenses cleared of ${lensCleared}`,
      ],
      keys: {
        '0': { help: 'the deer goes', run: () => creatures.dissolveNow() },
        '[': { help: 'fog −', run: () => { WRONG.fog.max = Math.max(0.4, Math.round((WRONG.fog.max - 0.05) * 100) / 100); return `fog max ${WRONG.fog.max}`; } },
        ']': { help: 'fog +', run: () => { WRONG.fog.max = Math.min(0.95, Math.round((WRONG.fog.max + 0.05) * 100) / 100); return `fog max ${WRONG.fog.max}`; } },
      },
    };
  },
});
