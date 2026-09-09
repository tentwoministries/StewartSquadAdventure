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
import { ikArm, type Limb } from '../_shared/rig';
import { runScene } from '../_shared/scene';
import type { Station } from '../_shared/shot';
import { lightWater } from '../_shared/water';
import { makeFlora } from '../frozen-night/flora';
import { makeProps } from '../frozen-night/props';
import { groundY, makeTerrain } from '../frozen-night/terrain';
import { FLIGHT_LEN, gripFor, makeFlight, onWing, SEAT_NOTE, SEAT_VARIANTS, SEATS, TOUCHDOWN, type SeatVariant } from './flight';

// `?ct=8.6` parks the cutscene clock at that second and stops it. A cutscene frame has to be
// reproducible — and a browser pane that is open but not on screen stops serving animation frames
// after about half a second (STUDY_NOTES.md §6 rule 8), so a still of a moving thing needs a clock
// it can be told, not one it has to run to reach.
// With `?step=1` the clock is *seeded* at `ct` and left running, because under the stepping harness
// nothing advances except `ssStep(n)` — so `?step=1&ct=0` then `ssStep(60)` is second 1.0, exactly,
// which is how the bank probe walks the whole flight.
const CT = Number(new URLSearchParams(location.search).get('ct') ?? 'NaN');
// T-66: `?seats=a|b|c` picks the seating the page opens on; `N` cycles it. `N` is unbound in
// `_shared/scene.ts` (its keys are 1-9, T, V, K, P, F, U, O, B, X, H, Tab, Enter, comma, period)
// and in this scene (0, M, G, [, ]).
const SEATS_PARAM = (new URLSearchParams(location.search).get('seats') ?? 'a').toLowerCase();

// ---- T-66, the three seated poses --------------------------------------------------------------
// One record per kid per variant, in *sides* rather than bone names: the rig's `R` limb sits at
// local +x, which — with the seat turned +90° so the kid faces the nose — is the plane's **left**
// (T-57), so "outer" and "inner" are resolved from the socket's own z, never from the bone's name.
// `shZ` is positive *away from the body*, `spineZ` positive *outboard*: mirrored by the same sign.
interface SeatPose {
  th: number; shin: number; foot: number;         // both legs: thigh, shin and foot, in radians
  spineX: number; spineZ: number; hipsX: number;
  inShX: number; inShZ: number; inFaX: number;    // the inboard arm (the one no grip is solved onto)
  outShX: number; outShZ: number; outFaX: number; // the outboard arm's rest pose, before the solve
}
/** Legs straight out along the deck (or over the wing's leading edge): the only leg pose the
 *  1.205 m between the well's deck and the top wing leaves room for. */
const LEGS_OUT = { th: -1.5338, shin: 0, foot: 1.5338 };
const REST = { inShX: -0.55, inShZ: -0.22, inFaX: -0.75, outShX: -0.55, outShZ: -0.22, outFaX: -0.75 };
/** heroes.md §2.4.7's four in-flight clips, kept whole: only the hand a grip is solved onto moves.
 *  Noah leans out and tracks the ground; Collette holds her pigtails down against the wind;
 *  Isabella has both arms up like a roller coaster; Liam sits still and looks at the others. */
function poseFor(v: SeatVariant, i: number): SeatPose {
  if (onWing(v, i)) {
    // a wing rider: legs over the leading edge, the outer pair propped inboard on one hand
    const outer = v === 'b' && (i === 1 || i === 2);
    return { ...LEGS_OUT, spineX: -0.05, spineZ: outer ? -0.35 : 0.06, hipsX: 0, ...REST };
  }
  const base = { ...LEGS_OUT, spineX: -0.10, spineZ: 0, hipsX: 0, ...REST };
  if (i === 1) return { ...base, spineX: 0.20, spineZ: 0.34 };                                     // Noah leans out
  if (i === 2) return { ...base, inShX: -2.15, inShZ: 0.35, inFaX: -1.25 };                        // Collette holds a pigtail
  if (i === 3) return { ...base, inShX: -0.25, inShZ: 1.85, inFaX: -0.15 };                        // Isabella, an arm up
  return base;                                                                                     // Liam sits still
}
const mix = (a: number, b: number, w: number): number => a + (b - a) * w;

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
    const seatTmp = new THREE.Object3D(), seatTmp2 = new THREE.Object3D();
    const posTmp = new THREE.Vector3(), qTmp = new THREE.Quaternion(), handTmp = new THREE.Vector3();
    // T-66: the seating, and the 0.5 s ease between two of them (Tier-0 rule 3 — nothing pops).
    let seatsTo: SeatVariant = (SEAT_VARIANTS as readonly string[]).includes(SEATS_PARAM) ? (SEATS_PARAM as SeatVariant) : 'a';
    let seatsFrom: SeatVariant = seatsTo, seatBlend = 1;
    const SEAT_EASE = 0.5;
    flight.setSeats(seatsTo);
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
    // T-66's handle for `scripts/probes/flight-seats-04.cjs`: the *data* only — which seating is
    // showing, where each socket and each grip is in plane space. The probe measures the bones and
    // the palms itself off the rigs, so no check reads the scene's own report of where they ended.
    win['ssSeatApi'] = {
      variant: () => seatsTo, from: () => seatsFrom, blend: () => seatBlend,
      seats: SEATS, onWing, grip: (v: SeatVariant, i: number, side: 'outer' | 'inner', grab: number) => gripFor(v, i, side, grab),
    };

    // Where each kid looks (npcs.md §2.3.7, and the scene's own intent). The runtime overwrites a
    // *non-active* kid's `lookAt` every frame before the rig reads it, so a scene may not write it:
    // `poi` covers whoever is active and `look` covers the other three (LESSONS.md Rigs, last row).
    const lookTmp = new THREE.Vector3(), headTmp = new THREE.Object3D();
    // the socket is the hip point now (T-66), so a head sits about 0.6 m over it, not 0.9
    const headOf = (i: number): THREE.Vector3 => { flight.seat(i, headTmp); return lookTmp.copy(headTmp.position).setY(headTmp.position.y + 0.6); };
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
        // T-66: the sockets and the poses come off the flying body, so the plane's matrices have to
        // be this frame's before a socket or a grip target is read off them.
        flight.group.updateMatrixWorld(true);
        if (seatBlend < 1) seatBlend = Math.min(1, seatBlend + (dt > 0 ? dt : 0) / SEAT_EASE);
        const sw = seatBlend * seatBlend * (3 - 2 * seatBlend); // smoothstep between the two seatings
        // the four kids ride: seated legs, then one clip each (heroes.md §2.4.7)
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
          // the socket is the kid's **hip** point: the root is dropped by that kid's own leg length
          // along the seat's own down axis, so all four hips sit at one height on a banked plane
          flight.seatAt(seatsFrom, i, seatTmp);
          flight.seatAt(seatsTo, i, seatTmp2);
          k.root.position.copy(posTmp.copy(seatTmp.position).lerp(seatTmp2.position, sw));
          k.root.quaternion.copy(qTmp.copy(seatTmp.quaternion).slerp(seatTmp2.quaternion, sw));
          k.root.position.add(posTmp.set(0, -k.bones.hips.position.y, 0).applyQuaternion(k.root.quaternion));
          const b = k.bones;
          const grab = flight.stall;                 // 0..1 through the stall-drop: all four grab on
          const pA = poseFor(seatsFrom, i), pB = poseFor(seatsTo, i);
          // which physical limb is outboard: the rig's R sits at local +x, which the +90° socket
          // turns onto the plane's −z (T-57), so a kid on the plane's left grips with R
          const outerIsR = SEATS[seatsTo][i]![2] < 0;
          const out: Limb = outerIsR ? b.R : b.L, inn: Limb = outerIsR ? b.L : b.R;
          const outS = outerIsR ? 1 : -1, innS = -outS;
          b.LL.th.rotation.x = b.RL.th.rotation.x = mix(pA.th, pB.th, sw);
          b.LL.sh.rotation.x = b.RL.sh.rotation.x = mix(pA.shin, pB.shin, sw);
          b.LL.foot.rotation.x = b.RL.foot.rotation.x = mix(pA.foot, pB.foot, sw);
          b.spine.rotation.x = mix(pA.spineX, pB.spineX, sw);
          // on the stall-drop a kid leans toward what she is grabbing: 0.40 rad outboard, which is
          // also what puts the inboard shoulder within an arm's length of the rim (Isabella's is 0.36 m)
          b.spine.rotation.z = (onWing(seatsTo, i) ? mix(pA.spineZ, pB.spineZ, sw) : Math.max(mix(pA.spineZ, pB.spineZ, sw), grab * 0.40)) * (outerIsR ? -1 : 1);
          b.hips.rotation.x = mix(pA.hipsX, pB.hipsX, sw);
          out.sh.rotation.x = mix(pA.outShX, pB.outShX, sw); out.sh.rotation.z = mix(pA.outShZ, pB.outShZ, sw) * outS; out.fa.rotation.x = mix(pA.outFaX, pB.outFaX, sw);
          inn.sh.rotation.x = mix(pA.inShX, pB.inShX, sw); inn.sh.rotation.z = mix(pA.inShZ, pB.inShZ, sw) * innS; inn.fa.rotation.x = mix(pA.inFaX, pB.inFaX, sw);
          // the grips: a hand is *solved* onto real geometry (LESSONS Rigs row 2) — the rim's top
          // edge, the cabane strut, the lap strap or the wing — never posed at it by eye
          k.root.updateMatrixWorld(true);
          for (const [v, w] of [[seatsFrom, 1 - sw], [seatsTo, sw]] as [SeatVariant, number][]) {
            if (w <= 0.001) continue;
            for (const [limb, side] of [[out, 'outer'], [inn, 'inner']] as [Limb, 'outer' | 'inner'][]) {
              const gp = gripFor(v, i, side, grab);
              if (gp.w <= 0.001) continue;
              ikArm(limb, b, flight.fromPlane(gp.x, gp.y, gp.z, handTmp), Math.min(1, gp.w * w));
            }
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
      // T-60: the kids ride the bench at every station of this scene, so X never fires a flourish here
      // (Isabella's whirl put the ribbon across the fuselage and spun her through the cockpit)
      flourishOk: () => false,
      hud: () => [
        flight.hud(),
        `seats ${SEAT_NOTE[seatsTo]}${seatBlend < 1 ? ` (easing from ${seatsFrom.toUpperCase()}, ${(seatBlend * 100).toFixed(0)} %)` : ''} · N cycles · ?seats=a|b|c`,
        `clock ${ct.toFixed(2)} / ${FLIGHT_LEN} s ×${rate.toFixed(2)} · camera ${ride ?? 'LD (a station: the orbit works)'} · touchdown at ${TOUCHDOWN} s${ride ? ` · look ${look.yaw.toFixed(1)}° / ${look.pitch.toFixed(1)}° (drag; ${LOOK_HOLD}s hold, ${LOOK_EASE}s home; R clears)` : ''}`,
      ],
      keys: {
        '0': { help: 'fly again', run: () => { ct = 0; running = true; return 'from the top'; } },
        n: {
          help: 'seating A/B/C',
          run: () => {
            seatsFrom = seatsTo;
            seatsTo = SEAT_VARIANTS[(SEAT_VARIANTS.indexOf(seatsTo) + 1) % SEAT_VARIANTS.length]!;
            seatBlend = 0;
            flight.setSeats(seatsTo);
            return SEAT_NOTE[seatsTo];
          },
        },
        m: { help: 'hold/run the clock', run: () => { running = !running; return running ? 'flying' : `held at ${ct.toFixed(1)} s`; } },
        g: { help: 'skip to the landing', run: () => { ct = TOUCHDOWN - 2.0; return 'short final'; } },
        '[': { help: 'slower', run: () => { rate = Math.max(0.25, Math.round((rate - 0.25) * 100) / 100); return `×${rate}`; } },
        ']': { help: 'faster', run: () => { rate = Math.min(2, Math.round((rate + 0.25) * 100) / 100); return `×${rate}`; } },
      },
    };
  },
});
