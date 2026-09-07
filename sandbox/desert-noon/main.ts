// Demo scene 2: Scorching Sands, the Oasis at noon (its hero hour) and the violet dusk, with Noah.
// URL: ?shot=S1&t=noon&curve=1   Keys: O shows them. STUDY_NOTES.md §3 row 2; §7 for the treasures.
import * as THREE from 'three';
import { DESERT as D, DESERT_KEYFRAMES } from '../_shared/biomes';
import { makeNoah } from '../_shared/kid-noah';
import { streamers } from '../_shared/particles';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { lightWater } from '../_shared/water';
import { makeCreatures } from './creatures';
import { makeFlora } from './flora';
import { makeProps } from './props';
import { groundY, makeTerrain, WATER_Y } from './terrain';

const STATIONS: Record<string, Station> = {
  S1: { name: 'The Oasis', target: [-1, 0.6, 2], yaw: 300, pitch: 42, d: 22, note: 'the pool, the leaning palms, the shade at left, the arch behind' },
  S2: { name: "Sol's shade", target: [-6.5, 0.9, -5.5], yaw: 200, pitch: 40, d: 15, note: 'the awning, the rug, Sol pacing, Noah under the stripes' },
  S3: { name: 'The strip', target: [12, 0.8, 23], yaw: 250, pitch: 42, d: 24, note: 'the Green Meanie parked, the drums, the windsock' },
  S4: { name: "The Nomad's camp", target: [26, 0.6, -14], yaw: 330, pitch: 40, d: 20, note: 'the dark tent, the camel, the cook fire, the cairn' },
  W1: { name: 'Oasis, wide', target: [4, 0.6, 4], yaw: 300, pitch: 44, d: 36, note: 'the whole oasis quadrant with the pyramid tip and the hoodoos' },
  L1: { name: 'Oasis, lower', target: [-1, 0.9, 2], yaw: 305, pitch: 34, d: 24, note: 'the palms reach the top of the frame, the arch fills the back' },
  CU: { name: 'Noah close-up', target: [0.4, 0.95, -3.2], yaw: 320, pitch: 12, d: 4.4, note: 'the fringe, the freckles, the brow; he is watching the lizard' },
  PY: { name: 'The Sunken Pyramid', target: [47, 5, 31], yaw: 15, pitch: 19, d: 44, note: 'the tip and the glyph band, vultures overhead' },
  AR: { name: 'The arch', target: [-28, 5, -20], yaw: 135, pitch: 14, d: 58, note: 'the grandeur read: 16 m of sandstone against the sky' },
};

runScene({
  id: 'desert', eyebrow: 'Scorching Sands', eyebrowAccent: 'The Oasis', title: 'The Oasis', line: 'Sand, not sugar. Water is further than it looks.',
  keyframes: DESERT_KEYFRAMES, times: ['noon', 'golden', 'dusk', 'night'], defaultTime: 'noon',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU', 'PY', 'AR'],
  kids: [makeNoah()],
  place: (kid, _i, shot, gy) => {
    if (shot === 'S2') { kid.root.position.set(-6.2, gy(-6.2, -4.6), -4.6); kid.face(160); kid.lookAt.set(-3.4, 1.0, 2.4); }
    else if (shot === 'S3') { kid.root.position.set(9.5, gy(9.5, 21.5), 21.5); kid.face(80); kid.lookAt.set(14, 1.5, 24); }
    else if (shot === 'S4') { kid.root.position.set(23.5, gy(23.5, -11.5), -11.5); kid.face(60); kid.lookAt.set(30, 1.2, -13); }
    else { kid.root.position.set(0.4, gy(0.4, -3.2), -3.2); kid.face(145); kid.lookAt.set(6.5, 0.8, -2); }
  },
  sky: 'dome', shadowHalf: 30,
  // three high thin clouds (world-events §2.4.1) plus one below the rim off the west edge
  clouds: [[-40, 42, -80, 16], [60, 46, -30, 18], [10, 50, 90, 14], [-82, -14, 10, 11]],
  prev: 'forest-dusk', next: 'bog-night',
  build: (scene) => {
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.water.mesh);
    const flora = makeFlora();
    scene.add(flora.group);
    const props = makeProps();
    scene.add(props.group);
    const creatures = makeCreatures(props.hotRock);
    scene.add(creatures.group);
    // sand streams: 400 points low over the dunes, blown east at 2–4 m/s; strongest at noon
    const sand = streamers(400, '#E8D0A0', 3.2, 0.9, { x: 0, z: 0, w: 110, d: 100, y0: 0.05, y1: 0.9 }, 2.8, 90, 9);
    scene.add(sand.pts);
    // the Nomad's cook-fire embers rise at dusk
    let wind = 1.0;
    return {
      groundY, blockers: [...props.footprints, ...flora.trunks], waterY: WATER_Y + 0.12,
      applyKeyframe: (kf, keyDir) => { lightWater(terrain.water, keyDir, kf.key.color, kf.key.intensity, kf.hemi.sky, kf.key.elev); },
      update: (t, dt, kf, ctx) => {
        props.update(t * wind, dt * wind, kf);
        creatures.update(t, dt, kf, ctx.active.root.position);
        sand.update(t * wind, kf.pollen * 0.8);
      },
      poi: () => creatures.poi(),
      hud: () => [...creatures.hud(), `wind ×${wind.toFixed(2)} · sand 400 pts east at 2.8 m/s · Noah is looking at the nearest lizard`],
      keys: {
        '0': { help: 'camel up/down', run: () => creatures.camelStand() },
        '[': { help: 'wind −', run: () => { wind = Math.max(0.2, Math.round((wind - 0.1) * 100) / 100); return `wind ×${wind.toFixed(2)}`; } },
        ']': { help: 'wind +', run: () => { wind = Math.min(2.5, Math.round((wind + 0.1) * 100) / 100); return `wind ×${wind.toFixed(2)}`; } },
      },
    };
  },
});
void THREE; void D;
