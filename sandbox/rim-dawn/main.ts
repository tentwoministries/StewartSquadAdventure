// Demo scene: the west rim at dawn, where the stream leaves the island (OPUS_EXPERIMENT_BRIEF.md
// §3.5, the second spelled-out one). The Forest plate exactly as the Forest scene builds it, minus
// the deer's wandering — plus the waterfall off the rim, the plunge pool that is not on the island,
// the dawn keyframe from the bible's Forest row, and the peaceful layer.
// URL: ?shot=S1&t=dawn   Keys: O shows them.
//
// Fix pass 2026-09-08 (`docs/qa/briefs/opus-fixes-rim.md`): every position near the plate's organic
// edge is now *marched* with `inside()` (`place.ts`) instead of asserted — the deer, Liam, the fox's
// route and the fall's lip. The stream sheet is cut off at the island's edge so the fall starts
// where the water ends, and the three stations that frame the fall are translated by the lip's
// correction (their yaw, pitch and distance are the authored ones).
import * as THREE from 'three';
import { WORLD_U } from '../_shared/material';
import { drifters } from '../_shared/particles';
import { makeLiam } from '../_shared/kid-liam';
import { runScene, type SceneWorld } from '../_shared/scene';
import type { CloudSpec } from '../_shared/sky';
import type { Station } from '../_shared/shot';
import { KEYFRAMES, type Keyframe } from '../_shared/style';
import { makeDeer } from '../forest-dusk/deer';
import { makeFx } from '../forest-dusk/fx';
import { makeProps } from '../forest-dusk/props';
import { makeScatter, makeTrees } from '../forest-dusk/scatter';
import { groundY, inside, makeTerrain, POND, streamInfo } from '../forest-dusk/terrain';
import { makeLife, POND_Y } from './life';
import { bankPoint, bearingTo, findLip, hasRoom, nearestOk, shorePoint, type Pt } from './place';
import { makeWaterfall, sheetEndInfo, SHEET_Y, trimOverhang } from './waterfall';

const SHOT = (new URLSearchParams(window.location.search).get('shot') ?? '').toUpperCase();
/** W1 is the 44 m study framing: the dawn fog written for the hero stations swallows the whole
 *  island there (T-16, the Bog's failure in violet), so that station gets the second pair T-21 asks
 *  for — the fill carries the ground and the fog starts past the rim. */
const WIDE = SHOT === 'W1';

// The bible's Forest dawn row (world-events-weather.md §2.1.3 master table) through the T-07
// conversion, with the plan's tuned column.
const DAWN: Keyframe = {
  name: 'dawn', p: 0.1,
  key: { color: '#FFB48C', intensity: 1.3, elev: 8, azim: 100 },
  hemi: { sky: '#6E7FB8', ground: '#2E5A3A', intensity: WIDE ? 0.7 : 0.45 },
  fog: WIDE
    ? { color: '#7A76B0', near: 46, far: 100, max: 0.42, height: 12 }
    : { color: '#7A76B0', near: 22, far: 65, max: 0.7, height: 12 },
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

// ---- placement: everything near the edge is marched, nothing is subtracted ----------------------
/** `walk.ts`: ground below −0.25 m is water and a wall. */
const WALL = -0.25;
/** On the plate with a step of margin all round: `inside()` at one point is not a footprint. */
const firm = (x: number, z: number): boolean => inside(x, z) && inside(x + 0.9, z) && inside(x - 0.9, z) && inside(x, z + 0.9) && inside(x, z - 0.9);
const dry = (floor: number) => (x: number, z: number): boolean => firm(x, z) && groundY(x, z) > floor;

// The lip: where the island stops carrying the stream (the fall and the sheet's end both sit here).
const LIP = findLip(inside) ?? { x: -49.4, z: 40.6 };
/** The first pass's hard-coded lip: the fall stations are translated by the correction. */
const OLD_LIP = { x: -57.5, z: 43.6 };
const DL = { x: LIP.x - OLD_LIP.x, z: LIP.z - OLD_LIP.z };

// The deer drinks at the pond's west bank. Two marches, not one: `shorePoint` walks out from the
// pond's centre to where the basin rises out of its own water (the waterline), and `hasRoom` asks
// whether the Forest deer's wander — which always picks a spot 2 → r metres away — has 3.6 m of
// plate all round it there. Due west the answer is no: the pond's edge and the plate's edge are
// about 1.9 m apart, which is how the first pass ended with the deer standing over the void at
// (−49.5, −28.5). The first bearing that has both is taken, west first.
// west first (S3 looks west-north-west across the pond), then round to the north shore
const DEER_BEARINGS = [300, 290, 280, 270, 260, 250, 240, 230, 220, 310, 320, 330, 340, 350, 0, 10, 210, 200];
const BANK = (() => {
  for (const b of DEER_BEARINGS) {
    const p = shorePoint(POND.x, POND.z, b, dry(WALL), 0.1, 16);
    if (p && hasRoom(p.x, p.z, dry(-1.2), 3.6)) return { point: p, bearing: b };
  }
  const p = nearestOk(POND.x - 6, POND.z, (x, z) => dry(WALL)(x, z) && hasRoom(x, z, dry(-1.2), 3.6), 0.25, 12);
  return { point: p ?? { x: POND.x, z: POND.z }, bearing: 300 };
})();
const DEER_AT = BANK.point;
/** It drinks, so it faces back at the water it was marched out of. */
const DEER_FACE = (BANK.bearing + 180) % 360;
/**
 * The wander patch: centred on the bank, radius 3 (the deer picks 2 → 3 m), with the pond's own
 * water as an `avoid` circle so it grazes the shore instead of walking in. `hasRoom` above is what
 * guarantees the outward half of that ring is still island.
 */
const DEER_PATCH = { x: DEER_AT.x, z: DEER_AT.z, r: 3, avoid: [{ x: POND.x, z: POND.z, r: 7.6 }] };

// The fox's rim path: x −50 (the first pass) is off the plate for its whole length. Every 2.5 m of
// the route is marched to the edge and the most inland of them becomes the path's x, so the whole
// straight line sits about 3 m inside the rim.
const FOX_Z = [20, 17.5, 15, 12.5, 10, 7.5, 5, 2.5, 0, -2.5, -5, -7.5, -10, -12.5, -15, -17.5, -20];
const FOX_X = Math.max(...FOX_Z.map((z) => bankPoint(-34, z, 270, inside, 0.1, 3)?.x ?? -34));
const FOX_A: Pt = { x: FOX_X, z: 20 }, FOX_B: Pt = { x: FOX_X, z: -20 };

// The stream's last bend has no bank on its west side — the centreline runs within about a metre
// of the rim there — so Liam stands on the east bank, as near the bend as firm dry ground clear of
// the water allows, and the birch the songbirds burst from is planted a body's length behind him.
// It has to be planted: the nearest Forest trunk to the bend is 16.3 m away at (−29.75, 33.8), so
// the first pass's perch at (−45, 30) hung three birds in mid-air. He used to stand in the stream
// at exactly 5.00 m from that perch, which is why the burst had never fired and why S1 read as
// "standing on the water".
const TREES = makeTrees();
const BEND = { x: -44.9, z: 34.5 };                    // the stream's centreline at the last bend
const trunkClear = (x: number, z: number, m: number): boolean => TREES.trunks.every((t) => Math.hypot(t.x - x, t.z - z) > t.r + m);
const streamClear = (x: number, z: number, m: number): boolean => { const s = streamInfo(x, z); return s.d > s.half + m; };
const liamOk = (x: number, z: number): boolean => dry(-0.15)(x, z) && streamClear(x, z, 1.6) && trunkClear(x, z, 1.2);
const LIAM_AT = nearestOk(BEND.x, BEND.z, liamOk, 0.25, 14) ?? { x: -42.4, z: 31.3 };
const LIAM_FACE = bearingTo(LIAM_AT.x, LIAM_AT.z, LIP.x, LIP.z);
const angOff = (a: number, b: number): number => Math.abs((((a - b) % 360) + 540) % 360 - 180);
const birchOk = (x: number, z: number): boolean => {
  if (!dry(-0.1)(x, z) || !streamClear(x, z, 2.0) || !trunkClear(x, z, 3)) return false;
  const d = Math.hypot(x - LIAM_AT.x, z - LIAM_AT.z);
  if (d < 2.4 || d > 4.2) return false;                // he stands under it, inside the burst radius
  // and not on the close-up's axis: a trunk straight behind his head is the sightline rule (Tier 0)
  return angOff(bearingTo(LIAM_AT.x, LIAM_AT.z, x, z), (LIAM_FACE + 180) % 360) >= 30;
};
const BIRCH_AT = nearestOk(LIAM_AT.x, LIAM_AT.z, birchOk, 0.25, 6) ?? { x: LIAM_AT.x + 2.6, z: LIAM_AT.z - 1.4 };
/** The trunk's foot: `makeLife` builds the tree here and perches the birds up it. */
const BIRCH = new THREE.Vector3(BIRCH_AT.x, groundY(BIRCH_AT.x, BIRCH_AT.z), BIRCH_AT.z);

const STATIONS: Record<string, Station> = {
  S1: { name: 'The fall', target: [-54 + DL.x, -2, 42 + DL.z], yaw: 110, pitch: 22, d: 20, note: 'the fall from the rim’s north side, the plunge pool below, the clouds beyond; it looks east into the dawn key (T-33), so the rim is a silhouette and the fill carries the rock — a study framing, not a hero frame' },
  S2: { name: 'Below the rim', target: [-56 + DL.x, -8, 42 + DL.z], yaw: 70, pitch: 6, d: 26, note: 'off the island looking back: the fall in full height, the rim over it' },
  S3: { name: 'The pond at dawn', target: [-45, -0.3, -30], yaw: 300, pitch: 45, d: 22, note: 'camp.md §2.11.5 S4 exactly. Read from the frame: the deer stands at the pond’s north-west shore, right of centre — the west bank proper is a 1.9 m band between the water and the rim, too narrow for it — and the bobber’s rings are on the water below it' },
  S4: { name: "The stream's last bend", target: [(LIAM_AT.x + LIP.x) / 2, 0.6, (LIAM_AT.z + LIP.z) / 2], yaw: 200, pitch: 38, d: 18, note: 'the water speeding toward the lip, the foam, Liam under the birch — the songbirds go up as it loads' },
  W1: { name: 'The rim, wide', target: [-48, 0, 30], yaw: 120, pitch: 40, d: 44, note: 'the whole west rim at 44 m: study-only, and the one station with its own fog pair (T-16/T-21) and a stronger fill, because the hero column’s 22/65 m fog turns the island into one violet mass at this distance' },
  L1: { name: 'The fall, lower', target: [-54 + DL.x, -2, 42 + DL.z], yaw: 110, pitch: 14, d: 24, note: 'S1 dropped: the sky and the below-rim clouds fill the top of the frame' },
  CU: { name: 'Liam close-up', target: [LIAM_AT.x, groundY(LIAM_AT.x, LIAM_AT.z) + 0.95, LIAM_AT.z], yaw: (LIAM_FACE + 180) % 360, pitch: 10, d: 4.4, note: 'he watches the fall, so the camera stands on the far side of that look; the dawn key at azimuth 100 rakes across him' },
};

runScene({
  id: 'rim', eyebrow: 'Enchanted Forest', eyebrowAccent: 'The West Rim', title: 'The West Rim',
  line: 'Where the stream runs out of island.',
  keyframes: { dawn: DAWN, golden: KEYFRAMES['golden']!, noon: KEYFRAMES['noon']! },
  times: ['dawn', 'golden', 'noon'], defaultTime: 'dawn',
  stations: STATIONS, defaultShot: 'S1', extras: ['W1', 'L1', 'CU'],
  kids: [makeLiam()],
  place: (kid, _i, _shot, gy) => {
    kid.root.position.set(LIAM_AT.x, gy(LIAM_AT.x, LIAM_AT.z), LIAM_AT.z);
    kid.face(LIAM_FACE);
    kid.lookAt.set(LIP.x, SHEET_Y - 1, LIP.z);
  },
  sky: 'dome', shadowHalf: 28, clouds: CLOUDS,
  prev: 'meadow-golden', next: 'forest-dusk',
  build: (scene) => {
    // the Forest plate, exactly as sandbox/forest-dusk/main.ts builds it
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.water);
    scene.add(TREES.group);
    const props = makeProps();
    scene.add(props.group);
    const scatter = makeScatter(props.footprints, TREES.trunks);
    scene.add(scatter.group);
    const fx = makeFx();
    fx.group.position.set(0, groundY(0, 0), 0);
    scene.add(fx.group);
    // the deer, drinking at the pond's west bank, not wandering far: its patch is 2.5 m inland of
    // the marched bank so a wander never walks it off the plate
    const deer = makeDeer(DEER_PATCH);
    deer.park(DEER_AT.x, DEER_AT.z, DEER_FACE);
    scene.add(deer.root);
    const fall = makeWaterfall();
    scene.add(fall.group);
    // the stream sheet ran 9 m past the island with nothing under it: cut it off at the lip, so the
    // water ends where the ground ends and the fall carries on from there
    const trimmed = trimOverhang(terrain.water, fall.lip, fall.flow);
    const end = sheetEndInfo(terrain.water, fall.flow, fall.lip);
    // the birch nearest the stream's last bend carries the songbirds; the fox's route was marched
    const life = makeLife(BIRCH, [new THREE.Vector2(FOX_A.x, FOX_A.z), new THREE.Vector2(FOX_B.x, FOX_B.z)]);
    scene.add(life.group);
    // mist wisps over the pond and the stream's last 20 m (world-events §2.4.2 `pt.mist`)
    const mist = drifters(30, DAWN.fog.color, 26, 0.5, { x: -44, z: 6, w: 34, d: 76, y0: 0.2, y1: 2.2 }, 0.05, 23);
    scene.add(mist.pts);

    const hemiC = new THREE.Color();
    const world: SceneWorld & {
      inside: (x: number, z: number) => boolean;
      probe: () => Record<string, unknown>;
    } = {
      groundY, blockers: [...props.footprints, ...TREES.trunks], waterY: WALL,
      inside,
      update: (t, dt, kf, ctx) => {
        WORLD_U.uCurveCenter.value.set(LIAM_AT.x, LIAM_AT.z);
        hemiC.set(kf.hemi.sky);
        fx.update(t, dt, kf, hemiC);
        for (const l of props.lanternLights) l.intensity = 14 * kf.lantern;
        props.fireLight.intensity = 90 * kf.fire;
        deer.update(t, dt, groundY);
        fall.update(t);
        life.update(t, dt, ctx.active.root.position);
        mist.update(t, 1);
      },
      poi: () => life.poi() ?? fall.lip,
      hud: () => [
        fall.hud(),
        life.hud(),
        `deer (${deer.root.position.x.toFixed(1)}, ${deer.root.position.z.toFixed(1)}) inside ${inside(deer.root.position.x, deer.root.position.z)} · Liam (${LIAM_AT.x.toFixed(1)}, ${LIAM_AT.z.toFixed(1)}) ground ${groundY(LIAM_AT.x, LIAM_AT.z).toFixed(2)} m · birch ${Math.hypot(LIAM_AT.x - BIRCH.x, LIAM_AT.z - BIRCH.z).toFixed(2)} m · sheet cut ${trimmed} tris`,
      ],
      keys: {
        '0': { help: 'the birds go up', run: () => life.burstNow() },
        '[': { help: 'the deer walks', run: () => { deer.walkNow(); return 'the deer moves'; } },
      },
      // everything a stepped probe reads (`ssWorld.probe()`); the HUD's DOM text only refreshes on
      // a key event, so no check reads it
      probe: () => {
        const s = life.state();
        const d = deer.root.position;
        return {
          lip: { x: fall.lip.x, y: fall.lip.y, z: fall.lip.z, inside: inside(fall.lip.x, fall.lip.z) },
          sheetEnd: {
            x: end.centre.x, z: end.centre.z, trimmed,
            distToEdgeCentre: Math.hypot(end.centre.x - fall.lip.x, end.centre.z - fall.lip.z),
            gapAlongFlow: end.alongGap, distToNearestVertex: end.nearest,
          },
          flow: { x: fall.flow.x, z: fall.flow.y, bearing: bearingTo(0, 0, fall.flow.x, fall.flow.y) },
          deer: { x: d.x, y: d.y, z: d.z, inside: inside(d.x, d.z), ground: groundY(d.x, d.z), bearing: DEER_FACE, bank: BANK.bearing },
          liam: {
            x: LIAM_AT.x, z: LIAM_AT.z, inside: inside(LIAM_AT.x, LIAM_AT.z), ground: groundY(LIAM_AT.x, LIAM_AT.z),
            face: LIAM_FACE, toBirch: Math.hypot(LIAM_AT.x - BIRCH_AT.x, LIAM_AT.z - BIRCH_AT.z),
            streamClear: streamInfo(LIAM_AT.x, LIAM_AT.z).d - streamInfo(LIAM_AT.x, LIAM_AT.z).half,
          },
          birch: { x: BIRCH.x, y: BIRCH.y, z: BIRCH.z, toLiam: Math.hypot(LIAM_AT.x - BIRCH.x, LIAM_AT.z - BIRCH.z) },
          foxRoute: { a: FOX_A, b: FOX_B, insideA: inside(FOX_A.x, FOX_A.z), insideB: inside(FOX_B.x, FOX_B.z) },
          fox: s.fox, birds: s.birds, bobber: s.bobber, pondY: POND_Y,
        };
      },
    };
    return world;
  },
});
