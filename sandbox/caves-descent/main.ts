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
import { columnTopAt, FLOOR_Y, groundY, HEART, insideCave, makeCave, makeRock, MAX_STEP, nextRelief, PATHS, ptAt, reliefMode, reliefStats, setRelief, stairStats, stairY, stepLimit, tierOf, treadY } from './terrain';

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
    // T-61: the relief setting is read before anything is built, so `?relief=flat|chunky|blocks`
    // gives a reproducible frame of each; `J` cycles it live (below).
    setRelief(new URLSearchParams(location.search).get('relief'));
    const cave = makeCave();
    let rock = { tiers: cave.tiers, stairs: cave.stairs };
    scene.add(cave.shell, cave.tiers, cave.floor, cave.stairs, cave.pool.mesh);
    const props = makeProps();
    scene.add(props.group);
    const creatures = makeCreatures();
    creatures.place(rock.stairs, rock.tiers);
    scene.add(creatures.group);
    // cave dust (pt.dust) and crystal sparkle (pt.sparkle) rising short near the heart
    const dust = drifters(160, K.dust, 3, 0.7, { x: 0, z: 0, w: 100, d: 90, y0: FLOOR_Y + 0.5, y1: 12 }, 0, 7);
    const sparkle = drifters(60, K.sparkle, 3.5, 1.4, { x: HEART.x, z: HEART.z, w: 14, d: 14, y0: FLOOR_Y, y1: FLOOR_Y + 9 }, 0.5, 8);
    scene.add(dust.pts, sparkle.pts);
    // a stepped probe's window on to the terrain (the rigs' `ssRigProbe` pattern): read-only, so a
    // probe can ask "is this point on a stair" and "which column tops out here" instead of guessing
    // from `groundY` alone. Never drives the scene.
    (window as unknown as Record<string, unknown>)['ssCaves'] = {
      stairY, tierOf, columnTopAt, relief: reliefMode, stats: reliefStats, stairs: stairStats, stepLimit, stations: STATIONS,
      salamanders: creatures.state,
      /** The centreline of stair `i` at arc `s`: where a probe stands a kid *on* the stair. */
      stairPt: (i: number, s: number) => { const p = PATHS[i]!; const a = ptAt(p, s); return { x: a.x, z: a.z, y: treadY(p, s), nx: a.nx, nz: a.nz, len: p.len }; },
    };
    const kidPos: THREE.Vector3[] = [];
    let lampFraction = 0.55;
    return {
      // A3: the step limit is the relief setting's own — 0.60 m at `flat` and `chunky` (the columns'
      // widest neighbouring pair is 0.54 and the tallest riser 0.435), 1.10 at `blocks` (1.08 and
      // 0.435). Round 1 ran every setting at 1.10 and a fixed-bearing walk stepped *over* the first
      // stair's channel wall into the trench, 0.76 m in one frame: a stair's side wall is a wall.
      // The runtime copies `maxStep` into the walk's options once, when the scene is built, so the
      // value here is the widest setting's — the envelope — and the limit in force is applied in
      // `walkable`, which the walk asks about every candidate step it is about to take and which is
      // therefore read live. `J` changes the relief at run time; this way the two never disagree.
      groundY, blockers: props.footprints, waterY: FLOOR_Y - 5, maxStep: MAX_STEP.blocks,
      walkable: (x, z) => {
        if (!insideCave(x, z) || Math.hypot(x - HEART.x, z - HEART.z) <= 3) return false;
        const hero = (window as unknown as { ssWalk?: { hero: THREE.Object3D } }).ssWalk?.hero;
        if (!hero) return true;
        return Math.abs(groundY(x, z) - groundY(hero.position.x, hero.position.z)) <= stepLimit();
      },
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
      hud: () => {
        const st = reliefStats();
        const pct = st.total ? Math.round((100 * st.hist[2]!) / st.total) : 0;
        return [
          `relief ${reliefMode()} (J cycles flat/chunky/blocks · ?relief=) · ${st.total} tier columns, ${pct} % at the tier's own height, levels [${st.hist.join(', ')}] over −0.36 … +0.54 m × ${reliefMode() === 'blocks' ? 2 : 1} · step limit ${stepLimit().toFixed(2)} m`,
          ...props.hud(), ...creatures.hud(),
          'Tab swaps the walked kid · the others idle where they stand · stand by a dark lamp 1.5 s to light it (bats leave the ledge)',
        ];
      },
      keys: {
        '0': { help: 'light the next lamp', run: () => props.lightNext() },
        j: {
          help: 'relief flat/chunky/blocks',
          run: () => {
            // The rock is rebuilt, not re-scened: the shell, the floor and the pool are untouched.
            // Re-grounding the kids and re-casting the salamanders is a teleport, which Tier-0 rule 3
            // would normally forbid — `J` is a debug comparison key, outside that rule by intent, and
            // nothing in the shipped scene changes the relief at run time.
            const mode = nextRelief();
            scene.remove(rock.tiers, rock.stairs);
            rock.tiers.geometry.dispose(); rock.stairs.geometry.dispose();
            rock = makeRock();
            scene.add(rock.tiers, rock.stairs);
            props.reground();
            creatures.place(rock.stairs, rock.tiers);
            for (const k of (window as unknown as { ssKids: { root: THREE.Object3D }[] }).ssKids) k.root.position.y = groundY(k.root.position.x, k.root.position.z);
            return `relief ${mode}`;
          },
        },
        '[': { help: 'pulse faster', run: () => { props.period.value = Math.max(3, props.period.value - 1); return `heart period ${props.period.value} s`; } },
        ']': { help: 'pulse slower', run: () => { props.period.value = Math.min(14, props.period.value + 1); return `heart period ${props.period.value} s`; } },
      },
    };
  },
});
