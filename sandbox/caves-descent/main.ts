// Demo scene 5: the Crystal Caves, the tiered descent to the heart, with all four kids (Tab swaps the
// walked one; the others idle where they stand). URL: ?shot=S1&t=half   T cycles how many of Quartz's
// lamps start lit (dark / half / lit: the caves' growth stage, T-02). STUDY_NOTES.md §3 row 5; §7.
import type * as THREE from 'three';
import { CAVE as K, CAVE_KEYFRAMES } from '../_shared/biomes';
import { makeCollette } from '../_shared/kid-collette';
import { makeIsabella } from '../_shared/kid-isabella';
import { makeLiam } from '../_shared/kid-liam';
import { makeNoah } from '../_shared/kid-noah';
import { drifters } from '../_shared/particles';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { lightWater } from '../_shared/water';
import { makeCreatures } from './creatures';
import { makeProps } from './props';
import { FLOOR_Y, groundY, HEART, insideCave, makeCave } from './terrain';

const STATIONS: Record<string, Station> = {
  S1: { name: 'Lamplight Landing', target: [0, 1.0, -33], yaw: 175, pitch: 26, d: 21, note: 'the four kids in a line at the mouth, Quartz under his lamp, the void beyond and the heart pulsing 26 m below' },
  S2: { name: 'The descent', target: [-27, -5, -22], yaw: 130, pitch: 30, d: 22, note: 'the stair down the west wall, the hook-lamps lighting one by one, the rim crystals' },
  S3: { name: 'The Depths', target: [8, -23, 16], yaw: 330, pitch: 34, d: 28, note: 'the heart in its pool, the waterfall from the roots, the fish, the spark plug plinth at the back' },
  S4: { name: "The Golem's Gallery", target: [-36, -10, 24], yaw: 80, pitch: 26, d: 15, note: 'the hall of reflecting facets on the gallery ledge' },
  W1: { name: 'The cross-section', target: [0, -12, -4], yaw: 270, pitch: 12, d: 92, note: 'the whole cross-section: landing, ledge, stairs, the Depths and the heart' },
  L1: { name: 'Across the void', target: [6, -14, 10], yaw: 182, pitch: 22, d: 26, note: 'from the landing across the void to the heart and the waterfall' },
  CU: { name: 'The line-up', target: [0, 0.95, -37.5], yaw: 178, pitch: 6, d: 9.5, note: 'the four kids at portrait distance: heights, colours, hair, props' },
  WF: { name: 'The waterfall', target: [-2, -12, 9], yaw: 250, pitch: 12, d: 30, note: 'the fall from the ceiling crack into the pool, its mist' },
  HT: { name: 'The heart', target: [10, -22, 20], yaw: 300, pitch: 22, d: 14, note: 'the crystal heart at arm\'s length, the fish under it' },
};

runScene({
  id: 'caves', eyebrow: 'Crystal Caves', eyebrowAccent: 'Lamplight Landing', title: 'The Crystal Depths', line: "The island's roots. Quartz keeps the lamps lit.",
  keyframes: CAVE_KEYFRAMES, times: ['dark', 'half', 'lit'], defaultTime: 'half',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU', 'WF', 'HT'],
  kids: [makeLiam(), makeNoah(), makeCollette(), makeIsabella()],
  place: (kid, i, shot, gy) => {
    // the line-up at the landing, oldest to youngest, facing the void (south); the walked one is Liam
    const spots: [number, number][] = [[-3.4, -37], [-1.1, -37.4], [1.2, -37.4], [3.5, -37]];
    if (shot === 'S3' || shot === 'HT') { const s: [number, number][] = [[-2, 6], [0, 5], [2, 5.5], [4, 7]]; kid.root.position.set(s[i]![0], gy(s[i]![0], s[i]![1]), s[i]![1]); kid.face(150); kid.lookAt.set(HEART.x, FLOOR_Y + 3, HEART.z); return; }
    if (shot === 'S2') { const s: [number, number][] = [[-16, -35], [-19, -32.5], [-22, -30.5], [-25, -28]]; kid.root.position.set(s[i]![0], gy(s[i]![0], s[i]![1]), s[i]![1]); kid.face(225); kid.lookAt.set(-34, -9, -12); return; }
    if (shot === 'S4') { const s: [number, number][] = [[-33, 18], [-31, 21], [-30, 24], [-31, 27]]; kid.root.position.set(s[i]![0], gy(s[i]![0], s[i]![1]), s[i]![1]); kid.face(270); kid.lookAt.set(-38, -9, 24); return; }
    const [x, z] = spots[i]!;
    kid.root.position.set(x, gy(x, z), z); kid.face(shot === 'CU' ? 358 : 180); kid.lookAt.set(HEART.x, FLOOR_Y + 4, HEART.z);
  },
  sky: 'cave', shadowHalf: 36, curveDefault: 0,
  prev: 'frozen-night', next: 'forest-dusk',
  build: (scene) => {
    const cave = makeCave();
    scene.add(cave.shell, cave.tiers, cave.floor, cave.stairs, cave.pool.mesh);
    const props = makeProps();
    scene.add(props.group);
    const creatures = makeCreatures();
    scene.add(creatures.group);
    // cave dust (pt.dust) and crystal sparkle (pt.sparkle) rising short near the heart
    const dust = drifters(160, K.dust, 3, 0.7, { x: 0, z: 0, w: 100, d: 90, y0: FLOOR_Y + 0.5, y1: 12 }, 0, 7);
    const sparkle = drifters(60, K.sparkle, 3.5, 1.4, { x: HEART.x, z: HEART.z, w: 14, d: 14, y0: FLOOR_Y, y1: FLOOR_Y + 9 }, 0.5, 8);
    scene.add(dust.pts, sparkle.pts);
    const kidPos: THREE.Vector3[] = [];
    let lampFraction = 0.55;
    return {
      groundY, blockers: props.footprints, waterY: FLOOR_Y - 5, maxStep: 1.1,
      walkable: (x, z) => insideCave(x, z) && Math.hypot(x - HEART.x, z - HEART.z) > 3,
      applyKeyframe: (kf, keyDir) => {
        lightWater(cave.pool, keyDir, K.heart, 0.4, kf.hemi.sky, 20);
        lampFraction = kf.lamps ?? 0.5;
        props.setLampFraction(lampFraction);
      },
      update: (t, dt, kf, ctx) => {
        kidPos.length = 0;
        kidPos.push(ctx.active.root.position);
        for (const k of (window as unknown as { ssKids: { root: THREE.Object3D }[] }).ssKids) if (k.root !== ctx.active.root) kidPos.push(k.root.position);
        props.update(t, dt, kf, kidPos);
        creatures.update(t, dt, props.pulse(), props.litCount() / props.lampCount, kidPos, (window as unknown as { ssWalk: { moving: boolean } }).ssWalk.moving);
        dust.update(t, 0.8); sparkle.update(t, 0.6 + 0.6 * props.pulse());
      },
      poi: () => creatures.poi(),
      hud: () => [...props.hud(), ...creatures.hud(), 'Tab swaps the walked kid · the others idle where they stand · stand by a dark lamp 1.5 s to light it (bats leave the ledge)'],
      keys: {
        '0': { help: 'light the next lamp', run: () => props.lightNext() },
        '[': { help: 'pulse faster', run: () => { props.period.value = Math.max(3, props.period.value - 1); return `heart period ${props.period.value} s`; } },
        ']': { help: 'pulse slower', run: () => { props.period.value = Math.min(14, props.period.value + 1); return `heart period ${props.period.value} s`; } },
      },
    };
  },
});
