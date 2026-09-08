// Demo scene: CS-04, the flight (cutscenes.md §2.6, npcs.md §2.3.4, story-beats.md "How the biplane
// approaches and lands"). Everything else in the reel stands on an island; this is the only moving
// camera and the only look at the world from the air. Ed flies, the four kids ride the bench.
// The island is the Frozen Peaks scene's, imported whole and lit at golden hour.
// URL: ?shot=CH   Keys: O shows them. 0 restarts the flight, G skips to the landing.
import * as THREE from 'three';
import { FROZEN_KEYFRAMES } from '../_shared/biomes';
import { makeCollette } from '../_shared/kid-collette';
import { makeIsabella } from '../_shared/kid-isabella';
import { makeLiam } from '../_shared/kid-liam';
import { makeNoah } from '../_shared/kid-noah';
import { WORLD_U } from '../_shared/material';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { lightWater } from '../_shared/water';
import { makeFlora } from '../frozen-night/flora';
import { makeProps } from '../frozen-night/props';
import { groundY, makeTerrain } from '../frozen-night/terrain';
import { FLIGHT_LEN, makeFlight, TOUCHDOWN } from './flight';

// `?ct=8.6` parks the cutscene clock at that second and stops it. A cutscene frame has to be
// reproducible — and a browser pane that is open but not on screen stops serving animation frames
// after about half a second (STUDY_NOTES.md §6 rule 8), so a still of a moving thing needs a clock
// it can be told, not one it has to run to reach.
// With `?step=1` the clock is *seeded* at `ct` and left running, because under the stepping harness
// nothing advances except `ssStep(n)` — so `?step=1&ct=0` then `ssStep(60)` is second 1.0, exactly,
// which is how the bank probe walks the whole flight.
const CT = Number(new URLSearchParams(location.search).get('ct') ?? 'NaN');

// CH, WG and ED are ridden, not stood in: the scene drives the camera from the plane every frame
// and the orbit is off until the wheels are down. LD is a real station — cutscenes.md shot 7, the
// hold at the strip's far end that makes every landing record visible.
const RIDE: Record<string, 'CH' | 'WG' | 'ED'> = { CH: 'CH', S1: 'CH', WG: 'WG', S2: 'WG', ED: 'ED', S3: 'ED' };
// The plane now lands heading east and rolls out to (38.5, 20), so the hold is east of it, looking
// back down the strip: the plane comes at the camera and stops 17 m short of it, both bounces in frame.
const LD: Station = { name: 'The strip', target: [21, 1.2, 20], yaw: 270, pitch: 6, d: 30, note: 'cutscenes.md shot 7: the hold at the far end, the plane coming at the camera, both bounces in frame' };
const STATIONS: Record<string, Station> = {
  CH: { name: 'Chase', target: [0, 6, 20], yaw: 90, pitch: 8, d: 14, note: 'the fixed chase behind and above the plane; the flight starts on load' },
  WG: { name: 'The wing', target: [0, 6, 20], yaw: 90, pitch: 10, d: 9, note: 'off the left wing, the island under it (scores change 5: +4° so four heads separate)' },
  ED: { name: "Ed's shoulder", target: [0, 6, 20], yaw: 90, pitch: 4, d: 4, note: 'over the pilot: the collar, the goggles, the red streak that never stops' },
  LD, S1: { name: 'Chase', target: [0, 6, 20], yaw: 90, pitch: 8, d: 14, note: 'chase' },
  S2: { name: 'The wing', target: [0, 6, 20], yaw: 90, pitch: 6, d: 9, note: 'wing' },
  S3: { name: "Ed's shoulder", target: [0, 6, 20], yaw: 90, pitch: 4, d: 4, note: 'shoulder' },
  S4: LD,
};

runScene({
  id: 'flight', eyebrow: 'Frozen Peaks', eyebrowAccent: 'CS-04', title: 'The Green Meanie',
  line: "Don't ask Grandpa Ed about his landing record.",
  keyframes: FROZEN_KEYFRAMES, times: ['golden', 'morning', 'dusk'], defaultTime: 'golden',
  stations: STATIONS, defaultShot: 'CH', extras: ['CH', 'WG', 'ED', 'LD'],
  kids: [makeLiam(), makeNoah(), makeCollette(), makeIsabella()],
  place: (kid) => { kid.root.position.set(0, 40, 20); kid.face(90); },
  sky: 'dome', shadowHalf: 34,
  clouds: [[-60, 46, -110, 15], [40, 50, -90, 17], [110, 44, 20, 14], [-90, 42, 60, 15], [30, 48, 120, 13]],
  prev: 'shadow-wrong', next: 'meadow-golden',
  build: (scene, params) => {
    const terrain = makeTerrain();
    scene.add(terrain.mesh, terrain.rim, terrain.ice.mesh, terrain.peaks);
    const flora = makeFlora();
    scene.add(flora.group);
    const props = makeProps();
    scene.add(props.group);
    // the Frozen scene parks the Green Meanie on this strip; there is only one of her
    props.group.children.forEach((c) => { if (c.type === 'Group' && Math.abs(c.position.x - 14) < 0.5 && Math.abs(c.position.z - 20) < 0.5) c.visible = false; });
    const flight = makeFlight();
    scene.add(flight.group);
    // the streaming curtain: a white-out quad carried by the camera through the cloud layer
    const flash = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.6),
      new THREE.MeshBasicMaterial({ color: '#F2F7FF', transparent: true, opacity: 0, depthWrite: false, depthTest: false }),
    );
    flash.position.z = -1; flash.renderOrder = 999; flash.frustumCulled = false;

    const ride = RIDE[params.shot] ?? (params.shot === 'LD' || params.shot === 'S4' ? null : 'CH');
    let ct = Number.isFinite(CT) ? CT : 0, rate = 1, running = params.step || !Number.isFinite(CT), stowed = false;
    const seatTmp = new THREE.Object3D();
    // ---- T-48, the look-around ------------------------------------------------------------------
    // Andrew, reel 2: "adding the ability to move the view around with the mouse might be helpful …
    // but it might be best to just let it be a ride." So the look is optional and temporary: a drag
    // orbits the chase camera round the plane, the view holds where the mouse left it for LOOK_HOLD,
    // then eases back to the chase frame over LOOK_EASE on a smoothstep (LESSONS.md §0 rule 3 —
    // nothing pops). With nobody touching the mouse every number here stays 0 and `flight.chase`
    // runs none of the offset arithmetic, so the untouched ride is the frames it always was.
    //
    // The drag is *read*, not handled. `_shared/orbit.ts`'s own mouse and touch handlers keep
    // writing `ssOrbit.current` even while the scene drives the camera (orbit.ts lines 21–27 and
    // 37–39), and a demo scene may not edit `_shared/`; so this adds no listener and re-binds no
    // key, and nothing here can swallow a skip input. R is the orbit's own key: `reset()` (orbit.ts
    // line 33) puts `current` back on the station exactly, which is what `atStation` reads to clear
    // the look in one frame — the one allowed instant, because it is a reset, not a state change.
    //
    // The offset accumulates from *changes* in `current`, never from its absolute value: after a
    // return the anchor moves to wherever the mouse was left, so the next drag starts from the chase
    // frame again instead of snapping back to the angle the last one ended on.
    const LOOK_HOLD = 2.0, LOOK_EASE = 2.0;        // seconds (DECISIONS.md 2026-09-08 · flight T-48)
    const ORBIT_PITCH = { min: 18, max: 75 };      // `_shared/orbit.ts` line 25's own clamp (T-23)
    const st = STATIONS[params.shot] ?? STATIONS['CH']!;   // the station makeOrbit was built from
    const look = { yaw: 0, pitch: 0 };
    const clampPitch = (p2: number): number => Math.min(ORBIT_PITCH.max, Math.max(ORBIT_PITCH.min, p2));
    const shortest = (d: number): number => ((d + 540) % 360) - 180;
    let anchorYaw = st.yaw, anchorPitch = st.pitch;
    let wantYaw = 0, wantPitch = 0, heldYaw = 0, heldPitch = 0, since = 0;
    const updateLook = (dt: number): void => {
      const cur = (window as unknown as { ssOrbit?: { current: Station } }).ssOrbit?.current;
      if (!cur) return;
      if (cur.yaw === st.yaw && cur.pitch === st.pitch && cur.d === st.d) { // on the station: R, or no drag yet
        anchorYaw = st.yaw; anchorPitch = st.pitch;
        wantYaw = 0; wantPitch = 0; heldYaw = 0; heldPitch = 0; since = 0;
        look.yaw = 0; look.pitch = 0;
        return;
      }
      // the pitch offset is measured between *clamped* pitches, so a station below the orbit's 18°
      // floor (CH is at 8°) still starts at a zero offset instead of jumping to the floor (T-23)
      const ty = shortest(cur.yaw - anchorYaw), tp = clampPitch(cur.pitch) - clampPitch(anchorPitch);
      if (Math.abs(ty - wantYaw) > 1e-6 || Math.abs(tp - wantPitch) > 1e-6) { // the mouse moved: track it 1:1
        wantYaw = ty; wantPitch = tp; heldYaw = ty; heldPitch = tp; since = 0;
        look.yaw = ty; look.pitch = tp;
        return;
      }
      since += dt; // wall seconds, not cutscene seconds: the look is UI, so `[` and `]` do not scale it
      if (since <= LOOK_HOLD) { look.yaw = heldYaw; look.pitch = heldPitch; return; }
      const k = Math.min(1, (since - LOOK_HOLD) / LOOK_EASE);
      const s = 1 - k * k * (3 - 2 * k); // smoothstep home: zero slope at both ends of the return
      look.yaw = heldYaw * s; look.pitch = heldPitch * s;
      if (k >= 1) { // home: re-anchor on where the mouse was left, so the next drag starts at zero
        anchorYaw = cur.yaw; anchorPitch = cur.pitch;
        wantYaw = 0; wantPitch = 0; heldYaw = 0; heldPitch = 0;
        look.yaw = 0; look.pitch = 0;
      }
    };

    const win = window as unknown as Record<string, unknown>;
    win['ssFlight'] = flight;
    win['ssLook'] = look; // the probes' handle on the look offset (scripts/probes/flight-look.cjs)
    // the probes' handle on the cutscene clock (scripts/probes/flight-*.cjs)
    win['ssCut'] = { at: () => ct, seek: (v: number) => { ct = Math.max(0, Math.min(FLIGHT_LEN, v)); }, run: (on: boolean) => { running = on; } };

    // Where each kid looks (npcs.md §2.3.7, and the scene's own intent). The runtime overwrites a
    // *non-active* kid's `lookAt` every frame before the rig reads it, so a scene may not write it:
    // `poi` covers whoever is active and `look` covers the other three (LESSONS.md Rigs, last row).
    const lookTmp = new THREE.Vector3(), headTmp = new THREE.Object3D();
    const headOf = (i: number): THREE.Vector3 => { flight.seat(i, headTmp); return lookTmp.copy(headTmp.position).setY(headTmp.position.y + 0.9); };
    const lookFor = (kid: { name: string }): THREE.Vector3 | null => {
      if (kid.name === 'Noah') return lookTmp.set(flight.pos.x, 0, flight.pos.z);                 // leans out and tracks the ground
      if (kid.name === 'Liam') return headOf(3);                                                  // sits still and looks at the others
      if (kid.name === 'Collette') return headOf(0);                                              // Liam, in the seat ahead of her
      return lookTmp.copy(flight.pos).addScaledVector(flight.fwd, 22).setY(flight.pos.y + 7);     // Isabella, arms up, eyes ahead
    };
    return {
      groundY, blockers: [], waterY: -5, maxStep: 40,
      applyKeyframe: (kf, keyDir) => lightWater(terrain.ice, keyDir, kf.key.color, kf.key.intensity, kf.hemi.sky, kf.key.elev),
      update: (t, dt, kf, ctx) => {
        if (!ctx.camera.children.includes(flash)) ctx.camera.add(flash);
        props.update(t, dt, kf);
        if (running) ct = Math.min(FLIGHT_LEN, ct + dt * rate);
        // dt straight through, never floored: under `?step=1` a frame the probe did not ask for has
        // dt 0, and a floor of 1e-3 would let the bank ease on frames the clock never advanced.
        flight.set(ct, dt * rate);
        // The curved world is centred on the station target, and it bends the *world material* only:
        // at 118 m out with `uCurve` at level 1 that is 8.4 m, so the aircraft, Ed and the four kids
        // sank clean out of a chase frame while their selection rings (their own shader) stayed put.
        // A moving camera has to carry the centre with it.
        WORLD_U.uCurveCenter.value.set(flight.pos.x, flight.pos.z);
        // the four kids ride the bench: seated legs, then one clip each (heroes.md §2.4.7)
        (window as unknown as { ssKids: typeof ctx.active[] }).ssKids.forEach((k, i) => {
          // the carried props are stowed for the flight: Collette's 1.7 m staff is planted on her
          // root, so in a 1.1 m cockpit it stands straight up through the top wing and the frame.
          // The selection rings go with them: world-space gameplay UI has no place in a cutscene
          // (the scores' change 4 — they were drawn on the fuselage under the kids in every frame).
          if (!stowed) {
            for (const n of ['prop.R', 'prop.L']) { const p2 = k.root.getObjectByName(n); if (p2) p2.visible = false; }
            k.ring.visible = false;
          }
          k.ringLight.intensity = 0;
          flight.seat(i, seatTmp);
          k.root.position.copy(seatTmp.position);
          k.root.quaternion.copy(seatTmp.quaternion);
          const b = k.bones;
          // a seated pose, not a lowered standing one: thighs level, shins down, a little recline
          b.LL.th.rotation.x = -1.52; b.RL.th.rotation.x = -1.52;
          b.LL.sh.rotation.x = 1.44; b.RL.sh.rotation.x = 1.44;
          b.LL.foot.rotation.x = 0.28; b.RL.foot.rotation.x = 0.28;
          b.spine.rotation.x = -0.06; b.spine.rotation.z = 0;
          b.hips.rotation.x = 0.10;
          const grab = flight.stall; // on the stall-drop all four grab the rim
          if (i === 0) { // Liam sits still, one hand on the cockpit rim, looking at the others
            b.R.sh.rotation.x = -0.95; b.R.sh.rotation.z = -0.55; b.R.fa.rotation.x = -0.55;
          } else if (i === 1) { // Noah leans out and tracks the ground
            b.spine.rotation.z = -0.34; b.spine.rotation.x = 0.20;
          } else if (i === 2) { // Collette holds her tails down against the wind
            b.L.sh.rotation.x = -2.15; b.R.sh.rotation.x = -2.15; b.L.fa.rotation.x = -1.25; b.R.fa.rotation.x = -1.25;
            b.L.sh.rotation.z = 0.35; b.R.sh.rotation.z = -0.35;
          } else { // Isabella, both arms up like a roller coaster
            b.L.sh.rotation.z = 1.85; b.R.sh.rotation.z = -1.85; b.L.sh.rotation.x = -0.25; b.R.sh.rotation.x = -0.25;
          }
          if (grab > 0.02) {
            b.L.sh.rotation.x = THREE.MathUtils.lerp(b.L.sh.rotation.x, -1.5, grab); b.R.sh.rotation.x = THREE.MathUtils.lerp(b.R.sh.rotation.x, -1.5, grab);
            b.L.sh.rotation.z = THREE.MathUtils.lerp(b.L.sh.rotation.z, 0.2, grab); b.R.sh.rotation.z = THREE.MathUtils.lerp(b.R.sh.rotation.z, -0.2, grab);
            b.L.fa.rotation.x = THREE.MathUtils.lerp(b.L.fa.rotation.x, -0.7, grab); b.R.fa.rotation.x = THREE.MathUtils.lerp(b.R.fa.rotation.x, -0.7, grab);
          }
        });
        stowed = true;
        // the camera rides the plane on CH / WG / ED; on LD the station stands and the plane comes
        // to it (and the orbit is the orbit, untouched by T-48's offset)
        if (ride) { updateLook(dt); flight.chase(ctx.camera, ride, look); }
        flash.material.opacity = ride ? flight.whiteOut * 0.85 : 0;
      },
      poi: (active) => lookFor(active),
      look: (kid) => lookFor(kid),
      hud: () => [flight.hud(), `clock ${ct.toFixed(2)} / ${FLIGHT_LEN} s ×${rate.toFixed(2)} · camera ${ride ?? 'LD (a station: the orbit works)'} · touchdown at ${TOUCHDOWN} s${ride ? ` · look ${look.yaw.toFixed(1)}° / ${look.pitch.toFixed(1)}° (drag; ${LOOK_HOLD}s hold, ${LOOK_EASE}s home; R clears)` : ''}`],
      keys: {
        '0': { help: 'fly again', run: () => { ct = 0; running = true; return 'from the top'; } },
        m: { help: 'hold/run the clock', run: () => { running = !running; return running ? 'flying' : `held at ${ct.toFixed(1)} s`; } },
        g: { help: 'skip to the landing', run: () => { ct = TOUCHDOWN - 2.0; return 'short final'; } },
        '[': { help: 'slower', run: () => { rate = Math.max(0.25, Math.round((rate - 0.25) * 100) / 100); return `×${rate}`; } },
        ']': { help: 'faster', run: () => { rate = Math.min(2, Math.round((rate + 0.25) * 100) / 100); return `×${rate}`; } },
      },
    };
  },
});
