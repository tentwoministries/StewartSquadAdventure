# Lessons from the sandbox: the defects we fixed, so the game never re-makes them

A review list for Phase 1 and after (Andrew, 2026-09-07: "make sure that we don't take defects that we fixed in the demos when you go implement the full game"). Not rules for the imagination; a checklist of things that went wrong in the demo scenes, what caused them, the rule that came out, and where the working version lives. The inspection checklist's P0 step points here: before building a system this file names, read its rows.

One row per defect: **symptom → cause → the rule → where it lives now.** Add a row whenever a demo fixes something a kid could have noticed.

## Camera

| Symptom | Cause | The rule | Lives now |
|---|---|---|---|
| Every station's frame slid toward the hero before anyone touched a key; a station aimed at a landmark ended up centred on the kid | the follow camera lerped toward the hero every frame from load | a follow camera engages on the first movement input, never on load; a station is a reproducible frame until then | `sandbox/_shared/walk.ts` (`engaged`) |
| Shadows vanished when a kid walked 25 m from the station | the directional light's shadow box was fixed on the station target | the key light's target and its shadow box follow the walked hero (a rounded position if shimmer shows) | `sandbox/_shared/scene.ts` (`key.target` per frame) |
| The aurora never appeared from any gameplay station | at pitch ≥ 18° the frame's top edge is below the horizon; the bible hangs the curtains at 160–200 m | anything hung in the sky needs a camera beat that tilts up, or it is only ever a wash on the ground (T-17) | `sandbox/frozen-night/main.ts` station `L1` at pitch 5°; `aurora.ts` |
| Two cave stations rendered black | the camera sat outside the back-face shell, or inside a tier's rock | a station in an enclosed space is checked against the enclosure's geometry; a back-face shell is invisible from outside (useful on purpose for a cutaway) | `sandbox/caves-descent/main.ts` stations `L1`, `W1` |
| A landmark filled the frame or blocked the station's subject (a mushroom, a cypress, a rock shelf) | props authored without checking the station's line of sight | after placing a landmark, look through every station that faces it; keep an exclusion radius round station subjects (the hut, the snail) | Bog `flora.ts` (`clear()` radius round the hut), Desert `props.ts` |

## Rigs and animation

| Symptom | Cause | The rule | Lives now |
|---|---|---|---|
| Noah's head pitched 118° backwards mid-laugh; the close-up showed his hair | the base eased `head.rotation.x` toward a target and the kid hook subtracted a laugh offset every frame, so the offset accumulated through the easing | ease a tracked number, then **set** the bone from it; hooks add on top of the set value, never on top of an eased bone | `sandbox/_shared/rig.ts` (`lookYaw`, `lookPitch`) |
| Collette's orb sat at her chest; Isabella's hammer lay flat on the ground | props parented to a hand inherit the arm's axis, so a staff "up" the hand points along the arm | a planted or resting prop is parented to the root (or the ground) and the hands are posed to it; a carried prop is parented to the hand | `kid-collette.ts` (the staff on the root), `kid-isabella.ts` (the hammer leaning from the ground to the hand) |
| A close-up showed the back of a kid twice (Liam in session 1, Noah in session 2) | facing conventions mixed up: a rig's eyes are on local +z, creatures are built along +x | a kid faces bearing b with `rotation.y = 180° − b`; a +x-built creature with `90° − b`; check a close-up against the rig's forward axis, not the camera's guess | `rig.ts` (`kid.face`), `creature.ts` (`rotY`) |
| Noah's lowered hair cap became a helmet that hid his eyes | a hemisphere cap lowered to cover the nape covered the face too | hair is two pieces: a cap that stops above the eye line and a nape piece on the back half only | `kid-noah.ts` (cap + nape) |
| The roof of Neve's hut stood up like two wings | slabs translated first and then rotated about the hut's origin | rotate a part about its own centre, then translate it into place (`applyMatrix4(rotation)` before `translate`) | Frozen `props.ts` (the roof) |
| A creature turned the long way round after a few turns (the deer, session 1) | an accumulating heading was never wrapped | wrap every accumulating angle to [−π, π] each step; take the short way | `creature.ts` |

## Light, fog and materials

| Symptom | Cause | The rule | Lives now |
|---|---|---|---|
| The bible's dusk rendered as deep night (session 1) | three r155+ lights are physical; the bible's intensities were written for a non-physical renderer | key ×3.0, hemisphere ×9.0, point lights in candela (T-07); then tune the whole column by eye on a real frame | `style.ts` `UNITS`, `style-draft.json` |
| The whole Bog vanished into violet past the jetty at the wide station | the bible's Bog fog (15/41 m) is right for the feel and wrong at the study camera | fog ranges are camera-relative and are judged at the wide station as well as the hero station (T-16) | `biomes.ts` Bog rows |
| The Desert's dusk sand went orange-red instead of taking violet shadows | the dusk key too warm and strong for the hemisphere | when a row promises a shadow colour, the hemisphere carries it and the key is cooled to let it (T-19) | `biomes.ts` Desert dusk |
| Low dune troughs were painted as lake bed | a colour rule keyed on height alone | colour rules for water beds test "inside the basin", not "below a height" | Desert `terrain.ts` (`faceColor`) |
| Frame rate dipped and every material recompiled when lanterns were added | each lantern carried a point light | most lanterns are emissive-only; only a scene's few casting lights are lights (cd 0 = no light object); keep a scene under about twenty point lights | `lantern.ts` (cd 0) |
| Per-instance glow could not vary (the caps near Collette, the crystals near a kid) | the emissive attribute is per vertex, shared by all instances | ride the per-instance gain on `instanceColor` (verified: `USE_INSTANCING_COLOR` is a vertex define in three r185); set grey colours for a pure gain | `material.ts` (`vSsGlow *= instanceColor.g`) |
| The waterfall was a solid white pillar | additive ribbon at full alpha with a bright colour | water ribbons are translucent (alpha ≤ 0.35 after edges) and coloured toward the sky, with the mist and spray doing the rest | Caves `props.ts` (`fallMat`) |
| The tent's canvas blew out to white (session 1) | emissive gain 1.6 on a whole face under bloom | large emissive faces at ≤ 0.5; only small quads (windows, glass) at 1.6+ (T-10) | Forest `props.ts` |

## Density and scale

| Symptom | Cause | The rule | Lives now |
|---|---|---|---|
| Grass, flowers and pebbles read as confetti (session 1) | the bible's per-m² densities at the station camera | density comes from about twenty hand-placed props per frame; scatter is sparse and clustered (T-09) | Forest `scatter.ts`, every scene's flora |
| Red pebbles across the desert read as confetti | a saturated pebble colour on a saturated ground | ground scatter is within a step of the ground's own colour | Desert `flora.ts` |
| At pitch 48° no tree canopy entered the hero frame (session 1) | the bible's station pitch | the hero station sits low enough for the tall things to enter the frame; the tall things are what give scale (T-08) | every scene's `L1` station |

## Process

| Symptom | Cause | The rule | Lives now |
|---|---|---|---|
| A saved frame was a blank canvas | the save ran before the first rendered frame | wait for two rendered frames (the save renders one itself); when driving the page from outside, wait 10–12 s after navigation | `scene.ts` `save()`, `shot.ts` |
| A patch silently did nothing, or bash printed "command not found" | template literals and backticks in an inline `node -e` string were eaten by the shell | patch TypeScript with a `.cjs` script file, never an inline string with backticks | this session's scratchpad recipe |
| A change in `_shared/` broke a scene nobody was looking at | shared code, one scene verified | a change to `sandbox/_shared/` is checked with one frame per scene (five); a scene-local change needs only its own | `LOG.md` habit |
