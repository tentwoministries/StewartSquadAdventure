// Demo scene 3: Murky Swamp, the Witch's lantern shore at night, with Collette (her orb is the only
// carried light that casts; the glow caps brighten as she passes; the seven lantern posts light when
// she stands close). URL: ?shot=S1&t=night   Keys: O shows them. STUDY_NOTES.md §3 row 3; §7.
import * as THREE from 'three';
import { BOG as G, BOG_KEYFRAMES } from '../_shared/biomes';
import { makeCollette } from '../_shared/kid-collette';
import { WORLD_U } from '../_shared/material';
import { blinkers, drifters, softDisc } from '../_shared/particles';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { lightWater } from '../_shared/water';
import { makeCreatures } from './creatures';
import { makeFlora } from './flora';
import { makeProps } from './props';
import { BOARD_Y, groundY, makeTerrain, WATER_Y } from './terrain';

const STATIONS: Record<string, Station> = {
  S1: { name: "Fern's jetty", target: [-30, 0.9, 6], yaw: 195, pitch: 40, d: 22, note: 'the jetty, Fern and her lantern, the rowboat, the hut on its stilts beyond, the giant cypress at left' },
  S2: { name: "The Witch's Lanterns", target: [-19, 0.6, 3], yaw: 350, pitch: 40, d: 21, note: 'the path of seven posts receding north; two lit, five dark' },
  S3: { name: 'The Long Causeway', target: [-3, 0.9, 0], yaw: 272, pitch: 36, d: 26, note: 'the boards, the line of amber lanterns, the plane parked, the water either side' },
  S4: { name: "The Witch's hut", target: [-28, 2.4, 24], yaw: 140, pitch: 27, d: 21, note: 'stilts, the crooked roof, the one green window, the porch and cauldron' },
  W1: { name: 'Swamp, wide', target: [-12, 0.4, 6], yaw: 330, pitch: 44, d: 42, note: 'the whole causeway quadrant in fog: hut, path, temple mound, giants' },
  L1: { name: 'Jetty, lower', target: [-30, 1.2, 6], yaw: 200, pitch: 31, d: 26, note: 'the cypress giant enters the frame; the hut across the water' },
  CU: { name: 'Collette close-up', target: [-28.5, 0.95, 1.2], yaw: 20, pitch: 12, d: 4.4, note: 'the long tails, the bow headband, the lash, the smile, the orb' },
  TS: { name: 'The drowned steps', target: [-10, 1.0, -35], yaw: 15, pitch: 22, d: 20, note: 'the temple steps into the water, the lantern that will not stay lit' },
  SN: { name: 'The giant snail', target: [9, 0.8, 12], yaw: 210, pitch: 24, d: 9, note: 'the landmark snail on its log, the turtle stack beside it' },
};

runScene({
  id: 'bog', eyebrow: 'Murky Swamp', eyebrowAccent: 'The Long Causeway', title: 'The Long Causeway', line: 'Lanterns first. Then everything else.',
  keyframes: BOG_KEYFRAMES, times: ['golden', 'dusk', 'night', 'deep'], defaultTime: 'night',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU', 'TS', 'SN'],
  kids: [makeCollette()],
  place: (kid, _i, shot, gy) => {
    if (shot === 'S2') { kid.root.position.set(-21.5, gy(-21.5, 6.5), 6.5); kid.face(350); kid.lookAt.set(-20.5, 1.2, 9); }
    else if (shot === 'S3') { kid.root.position.set(1, BOARD_Y, 0.8); kid.face(275); kid.lookAt.set(-10, 1.4, 0); }
    else if (shot === 'S4') { kid.root.position.set(-31.5, gy(-31.5, 19.5), 19.5); kid.face(150); kid.lookAt.set(-28, 2.4, 24); }
    else if (shot === 'TS') { kid.root.position.set(-9, gy(-9, -29), -29); kid.face(355); kid.lookAt.set(-10, 1.5, -36); }
    else if (shot === 'SN') { kid.root.position.set(12.5, gy(12.5, 10), 10); kid.face(230); kid.lookAt.set(10, 0.9, 12); }
    else { kid.root.position.set(-28.5, BOARD_Y, 1.2); kid.face(200); kid.lookAt.set(-32, 1.2, 12); }
  },
  sky: 'dome', shadowHalf: 28,
  // low grey-violet clouds (world-events §2.4.1), one below the rim off the west edge by the jetty
  clouds: [[-20, 26, -70, 14], [40, 30, -40, 12], [-50, 24, 50, 13], [30, 28, 70, 12], [-84, -10, 12, 11]],
  prev: 'desert-noon', next: 'frozen-night',
  build: (scene) => {
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.water.mesh);
    const flora = makeFlora();
    scene.add(flora.group);
    const props = makeProps();
    scene.add(props.group);
    const creatures = makeCreatures(flora.pads);
    scene.add(creatures.group);
    // spores always (phosphor, drifting up slowly); wisps handled by the creatures; moths at the lit posts at night
    const spores = drifters(150, G.phosphor, 3.5, 1.1, { x: -8, z: 0, w: 90, d: 80, y0: 0.2, y1: 3.2 }, 0.3, 5);
    const moths = blinkers(36, G.moth, 5, 1.4, { x: -14, z: 4, w: 46, d: 30, y0: 1.4, y1: 3.0 }, 8, 0.9);
    scene.add(spores.pts, moths.pts);
    // ground fog: 30 billboards 4 × 1.5 m at the fog colour, drifting east at 0.3 m/s
    const tex = softDisc();
    const mist: THREE.Sprite[] = [];
    const mistMat = new THREE.SpriteMaterial({ map: tex, color: G.fog, transparent: true, opacity: 0.11, depthWrite: false });
    for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(mistMat.clone()); s.scale.set(5 + (i % 3), 1.6, 1); s.userData['x0'] = -50 + i * 3.4; s.userData['z'] = -40 + ((i * 7.3) % 80); s.userData['ph'] = i; scene.add(s); mist.push(s); }
    const ripples = (terrain.water.uniforms['uRipples'] as { value: THREE.Vector2[] }).value;
    let fogBias = 0;
    return {
      groundY, blockers: [...props.footprints, ...flora.trunks], waterY: WATER_Y + 0.14,
      applyKeyframe: (kf, keyDir) => {
        lightWater(terrain.water, keyDir, kf.key.color, kf.key.intensity, kf.hemi.sky, kf.key.elev);
        WORLD_U.uFogMax.value = Math.min(0.95, Math.max(0.2, kf.fog.max + fogBias));
        mistMat.color.set(kf.fog.color);
        for (const s of mist) (s.material).color.set(kf.fog.color);
      },
      update: (t, dt, kf, ctx) => {
        props.update(t, dt, kf, ctx.active.root.position);
        creatures.update(t, dt, kf, ctx.active, ripples);
        flora.glowNear(ctx.active.root.position.x, ctx.active.root.position.z, dt);
        spores.update(t, kf.pollen * 0.9);
        moths.update(t, kf.fireflies);
        for (const s of mist) { const x = ((s.userData['x0'] as number) + t * 0.3 + 56) % 112 - 56; const z = s.userData['z'] as number; s.position.set(x, Math.max(groundY(x, z), WATER_Y) + 0.5 + 0.15 * Math.sin(t * 0.3 + (s.userData['ph'] as number)), z); (s.material).opacity = 0.11 * (0.6 + 0.4 * Math.sin(t * 0.2 + (s.userData['ph'] as number))) * (0.5 + 0.5 * kf.fog.max); }
      },
      poi: () => creatures.poi(),
      hud: () => [`lanterns lit ${props.litCount()}/7 (stand by a dark post 1.5 s) · glow caps ${flora.caps} (brighter within 6 m of the orb) · fog max ${WORLD_U.uFogMax.value.toFixed(2)}`, ...creatures.hud()],
      keys: {
        '0': { help: 'light the next post', run: () => props.lightNext() },
        '[': { help: 'fog −', run: () => { fogBias -= 0.05; WORLD_U.uFogMax.value = Math.min(0.95, Math.max(0.2, WORLD_U.uFogMax.value - 0.05)); return `fog max ${WORLD_U.uFogMax.value.toFixed(2)}`; } },
        ']': { help: 'fog +', run: () => { fogBias += 0.05; WORLD_U.uFogMax.value = Math.min(0.95, Math.max(0.2, WORLD_U.uFogMax.value + 0.05)); return `fog max ${WORLD_U.uFogMax.value.toFixed(2)}`; } },
      },
    };
  },
});
