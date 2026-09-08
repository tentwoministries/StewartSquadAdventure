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
import { clearNear, clearSight, makeProps, SCATTER_TINT, thinScatter, voidify } from './props';
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
  CU: { name: 'Isabella by the cold fire', target: [-3.4, 1.05, -5.2], yaw: 300, pitch: 6, d: 3.4, note: 'read off the frame: the ruby dress at portrait distance with the citadel\'s ember-lit wall in the right third as the key and, in the left two thirds, the far plain going into the fog, the pines on its edge and the void sky over them — the yaw turned 330 → 300 in round 2 because at 330 the wall filled the whole frame and the close-up had no air in it. The falling embers of the cold fire are back at a fifth of the ambient sprite size, and the camera\'s near plane is 1.8 m here (see below)' },
  SW: { name: 'The swing', target: [4.8, 1.9, -11.5], yaw: 245, pitch: 7, d: 7.5, note: 'read off the frame: the swing that swings by itself, ±25° on a 3.1 s period, hung from the bough of a dead pine with the rift open in the ground under it; Isabella at the left for the scale, the citadel\'s ember windows in the right third, the cold fire\'s pool at the left edge, and the mirrored constellations in the top third. Round 2 dropped the pitch 14 → 7 and turned the yaw 237 → 245: at pitch 14 the frame was ground from edge to edge and the living pine\'s canopy skirt (it starts at 1.4 m) was an unlit slab over the right third' },
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
      // round 2: at (6.5, −9.5) she stood 7 m from the lens, in the frame's corner with the title card
      // over her feet and her ring. She now stands two paces from the swing, a third of the way in,
      // her body three-quarters to the lens and her head on the seat through the look hook
      if (shot === 'SW') { kid.root.position.set(4.92, gy(4.92, -9.66), -9.66); kid.face(295); return; }
      // the close-up moves her a step back from the ring, so the lens is clear of the fire's embers
      const [ix, iz] = shot === 'CU' ? [-3.4, -5.2] : [-1.9, -2.9];
      kid.root.position.set(ix, gy(ix, iz), iz); kid.face(147);
      return;
    }
    // T-47: S4 put her at (−15.5, 15.5), which is 3 m inside the mirror stream's cut — ground
    // −0.62 m against the walk's −0.25 m water wall, so 0 of 36 bearings were open and four
    // seconds of W or of S moved her 0.00 m (`scripts/probes/runtime-stations.cjs`). The bank is
    // marched to, not guessed: the nearest walkable ground is 1.75 m north-west but projects to
    // NDC x −1.06, off the left edge of this 8.5 m lens, so the least move that is *both* walkable
    // and in frame is 4.5 m to (−12.61, 12.05) — ground −0.15, W and S both free (1.78 m/s), NDC
    // (−0.82, +0.11). She is still on the far bank, still giving the step its scale; her head is
    // the S4 poi's job, her body faces 194° = the bearing to (−14, 17.5) from the new spot.
    const spots: Record<string, [number, number, number]> = {
      S1: [-2.6, 1.9, 54], S2: [-4.6, -7.0, 330], S3: [-7.5, 45.5, 165], S4: [-12.61, 12.05, 194],
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
    // Round 2 (the audit's item 2): a Forest pine's canopy skirt starts at 1.4 m and is 4.9 m
    // across, so a pine 8 m from a low camera is an unlit slab over a third of the frame however
    // far it is from the lens — 5.5 m of clearance is not enough for a station at pitch 7. The two
    // that stand in `SW`'s cone go, and `props.ts` builds the swing a dead pine in place of the
    // one it hung on. Both are well outside S1's cone (33° and 38° off its axis), so the frame the
    // family is being shown does not move.
    const swCleared = clearNear(trees.group, 3.5, -13.5, 1.2) + clearNear(trees.group, 6, -8, 1.2);
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
    // ... and gets a set of its own instead, at under half the size and inside the fire's reach,
    // because the scores file's change 3 wants the embers *in* the close-up and not hidden from it
    const cuEmbers = shot === 'CU' ? drifters(80, VOID.ember, 1.1, 1.4, { x: -3.4, z: -5.2, w: 12, d: 12, y0: 0.3, y1: 5 }, 0.9, 11) : null;
    if (cuEmbers) scene.add(cuEmbers.pts);

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
      tufts: () => ({
        before: tuftsBefore, after: tuftsAfter, sightCleared, lensCleared, swCleared,
        // the colour half of T-09, measured on the tints themselves
        tintSatBefore: Number((SCATTER_TINT.satBefore / Math.max(1, SCATTER_TINT.n)).toFixed(4)),
        tintSatAfter: Number((SCATTER_TINT.satAfter / Math.max(1, SCATTER_TINT.n)).toFixed(4)),
        tintSatMaxBefore: Number(SCATTER_TINT.maxBefore.toFixed(4)),
        tintSatMaxAfter: Number(SCATTER_TINT.maxAfter.toFixed(4)),
      }),
      // which pines are still standing near a point, with their distance and bearing from it: the
      // way an occluder in a station's frame is *identified* instead of guessed at (round 2, SW)
      treesNear: (x = 0, z = 0, rad = 20) => {
        const out: { x: number; z: number; s: number; d: number; b: number }[] = [];
        const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
        trees.group.traverse((o) => {
          const im = o as THREE.InstancedMesh;
          if (!im.isInstancedMesh) return;
          for (let i = 0; i < im.count; i++) {
            im.getMatrixAt(i, m); m.decompose(p, q, sc);
            if (sc.x === 0) continue;
            const d = Math.hypot(p.x - x, p.z - z);
            if (d > rad) continue;
            out.push({
              x: Number(p.x.toFixed(2)), z: Number(p.z.toFixed(2)), s: Number(sc.x.toFixed(2)), d: Number(d.toFixed(2)),
              b: Number((((Math.atan2(p.x - x, -(p.z - z)) * 180) / Math.PI + 360) % 360).toFixed(1)),
            });
          }
        });
        return out.sort((a, b) => a.d - b.d);
      },
      /** A station's camera in the ground plane, so a probe can ask about its line of sight. */
      camAt: (s: string) => (STATIONS[s] ? camXZ(STATIONS[s]) : null),
      // what is under a pixel of the 1600 x 1000 frame, every hit along the ray and not only the
      // first: the way an artefact in a saved frame is *named* (round 2, the CU's dashed lines)
      pick: (px: number, py: number) => {
        if (!lastCam) return null;
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2((px / 1600) * 2 - 1, -((py / 1000) * 2 - 1)), lastCam);
        const root = scene;
        return ray.intersectObject(root, true).slice(0, 8).map((h) => {
          const chain: string[] = [];
          for (let p: THREE.Object3D | null = h.object; p; p = p.parent) if (p.name) chain.unshift(p.name);
          return {
            d: Number(h.distance.toFixed(3)), type: h.object.type, name: h.object.name || chain.join('/') || '(unnamed)',
            verts: ((h.object as THREE.Mesh).geometry?.getAttribute('position') as THREE.BufferAttribute | undefined)?.count ?? 0,
            at: [h.point.x, h.point.y, h.point.z].map((v) => Number(v.toFixed(2))),
          };
        });
      },
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
        // The close-up's near plane. Isabella's hair volume and her head sphere interpenetrate (a
        // 0.235 m dome centred 0.209 m off a 0.19 m head), and the seam between two opaque meshes
        // is drawn as a dashed line — which at portrait distance reads as the circlet and the
        // fringe showing *through* the cap. It is not a material: every mesh in the rig is opaque,
        // `depthWrite` true, `transparent` false, and the rigs are never voidified (probe
        // `scripts/probes/shadow-hair.cjs`); it is depth precision in the composer's buffer, which
        // goes as `z²·(1/near − 1/far)`. The station is 3.0 m out and nothing is inside 2.6 m of
        // the lens, so the near plane goes 0.5 → 1.8 here and the seam closes. The real fix is the
        // rig's (the dome wants to sit *on* the head, not through it) and is owed in `_shared`.
        if (shot === 'CU' && ctx.camera.near !== 1.8) { ctx.camera.near = 1.8; ctx.camera.updateProjectionMatrix(); }
        sky.update(t, ctx.camera, breathe);
        props.update(t, dt, breathe, ctx.active.root.position);
        creatures.update(t, dt, ctx.active.root.position);
        embers.update(t, 1);
        ash.update(t, 1);
        cuEmbers?.update(t, 1);
      },
      poi: () => stationPoi() ?? creatures.poi() ?? props.fireSeat,
      look: (kid) => (kid !== isabella ? null : shot === 'SW' ? props.seatWorld(seat) : shot === 'CU' ? props.fireSeat : null),
      hud: () => [
        props.hud(),
        ...creatures.hud(),
        `breathing ${breathe.toFixed(2)} on a 40 s cycle (fog ±15 %, rift ±25 %) · one keyframe, no clock`,
        `scatter ${tuftsBefore} → ${tuftsAfter} tufts (T-09: thinned and, round 2, the instance tint desaturated to 15 % — voidify never sees a tint) · S3 corridor cleared of ${sightCleared} · station lenses cleared of ${lensCleared} · SW's two near pines cleared of ${swCleared}`,
      ],
      keys: {
        '0': { help: 'the deer goes', run: () => creatures.dissolveNow() },
        '[': { help: 'fog −', run: () => { WRONG.fog.max = Math.max(0.4, Math.round((WRONG.fog.max - 0.05) * 100) / 100); return `fog max ${WRONG.fog.max}`; } },
        ']': { help: 'fog +', run: () => { WRONG.fog.max = Math.min(0.95, Math.round((WRONG.fog.max + 0.05) * 100) / 100); return `fog max ${WRONG.fog.max}`; } },
      },
    };
  },
});
