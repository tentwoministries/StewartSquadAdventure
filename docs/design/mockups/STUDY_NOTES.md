# Visual studies: working notes (Phase 0.75 cluster B)

The orchestrator's brainstorm and running judgement for the sandbox studies. `LOG.md` is the record of what was rendered and what Andrew said; this file is the *why*: what the reference does, what we do better, what each study is for, and what the frames taught. Not a design file; nothing here binds until it is a row in `PHASE_0.75_TWEAKS.md`.

## 1. What the reference does (21 frames, `docs/reference/`)

Read closely, the reference is not "low-poly". It is a **toy diorama** with five habits:

1. **One clean key light, no drama.** Shadows are soft and short; the light never hides anything. The mood comes from colour, not from darkness.
2. **Saturated ground, navy sky.** The ground is a bright, saturated field (moss, sand, snow) and the sky is a deep navy at every time of day. That contrast is the whole palette. Nothing is pastel and nothing is grey.
3. **Clean facets, flat colour, one value per face.** No textures, no gradients, no noise on a surface. Variation comes from *props*, not from shading. The ground is nearly flat-coloured with a subtle facet shimmer.
4. **Density from props, not from particles.** The camp reads because of a tent, a fire ring, two logs, a basket, a fox, a deer, a bridge, stepping stones, a stream: about twenty hand-placed things in one frame. Grass tufts and flowers are sparse and clustered.
5. **Quiet UI.** A serif title card, a grey key-hint strip, nothing else. The world is the interface.

And the sixth, which no frame shows: **tempo** (`docs/reference/MOTION_TEMPO_NOTES.md`).

## 2. Where we do better (the brief: "do it better")

| Reference | Ours | How |
|---|---|---|
| Flat daylight, always | **Seven keyframes**; golden hour and dusk are the hero looks (`world-events-weather.md` §2.1) | The first study is *dusk*, the reference's weakest hour, to prove the diorama survives real light |
| One simple character, no face at gameplay distance | **Four kids with silhouettes and faces** (`heroes.md` §2.3), a head look-at, a blink, a cape | The close-up study (station `CU`) is judged at portrait distance |
| A globe: everything is 20 m away | **Floating islands** with a mild curved horizon (Brief §5.1) and a real camp plate 114 × 100 m with fog and depth | Curve is a parameter (`?curve=0..3`); the studies settle how much |
| Emissives only at the lava | **Night is a feature**: fire pool, three lanterns, the tent lit from inside, glow caps, fireflies, the selection ring's light (`world-events-weather.md` §2.1.3) | All present in the first study |
| Sky as a flat navy backdrop | **A 3-stop sky with a key lobe, stars that twinkle, a low-poly moon, clouds with cool bellies** (§2.6) | Seen at `L1`, `W1`, `CU` |
| A single global tilt-shift | **Selective bloom + tilt-shift + vignette + ACES** with the focal band on the hero | Real post stack, verified shapes |

## 3. The study plan (revised 2026-09-07 after Andrew's first pass: the studies are demo scenes)

Andrew's framing: each study is a **demo scene** he and his son can open, walk around in, tweak and screenshot, and the set of scenes is a reel to skip through before the full build. One scene per biome, each carrying one kid, so the four heroes and the five palettes are all seen before anything is locked. The Forest scene is the template; its rules are §6.

| # | Scene | Hero | Questions it answers | Status |
|---|---|---|---|---|
| 1 | Forest: Stewart Camp at dusk (this scene) | Liam | palette, fog, fire and lantern pools, tent glow, unit conversion, station pitch, scatter, tilt-shift, the deer, walking and the camera follow | **built; Andrew's quick pass applied; awaiting the session with his son** |
| 2 | Desert: Sunstone-style oasis at noon and dusk | Noah | the Desert palette (noon is its hero hour), sand and oasis water, the violet dusk, lizards and the beetle, Noah's orange-on-ochre legibility (`heroes.md` §2.1.3 "weak on ground") | next session |
| 3 | Bog: the Witch's lantern shore at night | Collette | phosphor and bruise-purple, the thick fog, glow mushrooms by the hundred, the wisps, Collette's orb as a light source | next session |
| 4 | Frozen Peaks: the valley under the aurora | Isabella | snow facets, ice blue, the aurora curtains lighting the snow, the elk herd, ruby on snow | next session |
| 5 | Crystal Caves: the tiered descent to the heart | all four | T-01..T-04 (verticality, the lamp-lighting mechanic, the pulsing heart), the four-kid line-up at gameplay distance | after 2–4; a board first |
| 6 | The anti-palette check | — | the Forest scene with the forbidden looks, so everyone knows what to avoid | last |

Each scene is one folder under `sandbox/<biome>/` built from the same `_shared/` helpers, with the same keys, stations and save flow, and a `?shot=` list of its own. A hub page (`sandbox/index.html`, next session) lists the scenes so the reel can be skipped through.

## 4. What the first study taught (the findings, each with a tweak row)

1. **The bible's light columns are in a unit three no longer has.** three r155+ is always physically based; the keyframe table's key 1.2 / hemi 0.5 at dusk render as deep night. The study found the conversion: key ×3.0, hemi ×9.0, campfire 2.5 → 90 cd, lantern 1.2 → 14 cd (T-07). This is exactly the "tune the whole column once if the renderer differs" note in `world-events-weather.md` §2.1.3, now with numbers.
2. **At pitch 48° the S1 frame never contains a tree canopy.** The bible says so ("a gameplay frame contains ground only"), and the frame proves it is the wrong call for the hero station: the reference's charm is the pines *around* the camp. At pitch 40° / d 22 (station `L1`) the big pine, a birch and the tent's guy lines enter the frame and it reads as Fernwood. Proposed: S1 becomes 40–42° (T-08); the gameplay camera's pitch range (Brief §4.5, 45–55°) is a cluster-C question.
3. **The bible's scatter densities are too high for the look.** 4 grass tufts and 1 flower per m² read as confetti at the station camera. The frame wanted 1.2 tufts/m² in clusters, flowers only in the six drifts, pebbles at 0.3/m² (T-09). The reference's "nothing is empty" is done by props, not by 11,700 instances.
4. **The tent's emissive at 1.6 blows to white under bloom**; 0.5 keeps the canvas teal with an amber glow (T-10).
5. **Ember rate 0.3/s reads as one ember**; the study runs 1.2/s (T-12).
6. **The variant that works is B, "ember dusk"**: key `#FF9A55` ×1.7 at 6° / az 250, hemi `#6A5EA8` / `#3A6A3A` ×0.8, fog `#8A5A7C` 24/70 at 0.75, sky `#1B2B66` / `#FF8A50` / `#4A2C5A`, exposure 1.0. A (the bible) is flatter and greyer; C (blue hour) is a good *later* dusk, worth keeping as the `p = 0.68` feel before the night snap.
7. **Liam** at the close-up reads as the bible's Liam: sapphire, the shield disc outboard, three hair spikes, low brows, the cape. The face system (two white quads, pupils, brows) works at portrait distance. Not yet judged: the walk, the 10 s pebble-kick, four kids side by side.

## 5. Open questions for Andrew (answer with a word each)

1. Variant A, B or C for dusk (or "B but …")?
2. Station S1 at pitch 48° as written, or the lower 40° framing (`L1`)?
3. Tilt-shift: as rendered (focus band 0.5, feather 0.55, small kernel), stronger, or off?
4. Curved world: `curve=0` (flat), `1` (as rendered), `2`, `3`?
5. The grass: as rendered, fewer, or none (reference-style)?
6. Liam: proportions and face as rendered, or notes?

## 6. Rules for the next demo scenes (what the Forest scene taught; keep it short, keep it loose)

These are prototyping rules for whoever builds the next scene (an orchestrator session or another model), not design law. Design preferences live as rows in `PHASE_0.75_TWEAKS.md`; numbers live in `style-draft.json`; this list is the *how*.

1. **Start from `_shared/`.** Tokens and keyframes (`style.ts`), the patched material (`material.ts`: height fog, curved world, sway, per-vertex emissive), the sky, the post stack, the stations and the save flow, the orbit. A new scene adds a biome keyframe set and its own props, terrain and creatures. Nothing in `_shared/` is game code; it is deleted after `p1-style-locked`.
2. **Lights are physical.** Multiply a bible intensity by the `UNITS` factors (key ×3, hemisphere ×9) and then *look*; the day columns needed re-tuning by eye (T-07). Point lights are candela: a campfire is about 90, a lantern about 14.
3. **Facing conventions.** A rig whose eyes are on local +z (the kids) takes `rotation.y = 180° − bearing`; a rig built along +x (the deer) takes `90° − bearing`. Wrap every accumulating heading to [−π, π] or a creature will one day turn the long way round.
4. **Tempo.** Every recurring motion uses two incommensurate rates and eases in and out (`docs/reference/MOTION_TEMPO_NOTES.md`). Creatures: fast start, slow arrival, slow into a tight turn, a slow eat. Nothing pops.
5. **Density is props, not particles.** About 1.2 grass tufts/m² in clusters and flowers only in drifts read right; the bible's 4/m² read as confetti (T-09). Twenty hand-placed things make a frame feel full.
6. **Post.** Tilt-shift focus band 0.62, feather 0.5, smallest kernel at full resolution; bloom threshold 0.8, selective (layer 11); vignette 0.35; ACES. `B` toggles the tilt-shift so it can be judged; keep the toggle in every scene.
7. **Terrain.** A 0.5 m grid with per-face 4 % value jitter; paths and decals baked as face colour; water on a ribbon along a spline with foam by edge distance. Keep the water a wall for walking (ground below −0.25 m).
8. **Every scene has the same keys** (`O` shows them), the same station contract (`?shot=`), `Enter` to save a self-contained 1600 × 1000 PNG with the card, and `?freeze=1` for a reproducible frame. A blank save is 58,885 bytes; a hidden browser pane gets no animation frames, so verify motion from the console with a fixed `dt`.
9. **Log as you go.** One `LOG.md` row per iteration, a tweak row per decision, numbers into `style-draft.json` when a frame is approved, a tag per demo state the family has seen.
10. **Don't build the game.** No sim, no save, no ECS, no asset pipeline. If a scene wants more than a scene, it is a Phase 1 question: write it down as `needs-render`.


## 7. The four new scenes: what each one is for, and its treasures (session 2, 2026-09-07)

Andrew's ask: keep what the Forest taught, improve where it helps, use the tall-tree grandeur tastefully, give each scene its own treasures, a waterfall somewhere. The rules of §6 held; the shared runtime (`_shared/scene.ts`) makes every scene's hands the same. The kids are on one rig now (`_shared/rig.ts` + `kid-*.ts`), built from the bible and the photos (`PHASE_0.75_HEROES_NOTES.md`).

| Scene | The grandeur | The treasures (what a kid will tell someone about) | The mechanic previewed | The improvement carried to every scene |
|---|---|---|---|---|
| **Desert** (Noah, noon) | the 16 m sandstone arch and four hoodoos; three 12 m date palms leaning over the pool | Sol pacing his 4 m line under the striped awning; the camel standing up in stages; a lizard doing push-ups on the hot rock at noon; vultures' shadows crossing the sand; tumbleweeds; the dust devil wandering; the pyramid tip's glyph band; the plane parked whole on the hard-pan | — (the wind on `[` `]`) | the camera holds the station until the first key; the key light and its shadow box follow the walked kid, so shadows never run out |
| **Bog** (Collette, night) | four 14–16 m bald cypress with flared trunks, knees and hanging moss | glow caps by the hundred that brighten as Collette passes; frogs jumping pad to pad with a ripple; herons lifting off slowly; the turtle stack; the snail's eye-stalks following you; wisps that lead you to the Witch's porch and go out; the lantern that will not stay lit at the drowned steps; the hut's one green window | **the Witch's Lanterns**: stand by a dark post 1.5 s and it lights, and stays lit | lanterns without lights (cd 0) for the light budget; Collette's orb on the world's emissive schedule |
| **Frozen Peaks** (Isabella, night) | five 13–15 m snow pines; the mountain backdrop; the aurora over the north peaks | the **aurora** curtains and the snow's wash; the lake's crack lines you can walk on; the elk herd crossing the lake with breath fog; penguins belly-sliding down their drift; the snowman in Isabella's scarf; the propeller's gold glint in blue ice; the ice-fall; Neve on her porch; the whirl kicking up snow | — (the aurora on `[` `]`, the herd on `0`) | the walk's step limit (for the caves) |
| **Crystal Caves** (all four, half lit) | the void: 26 m from the landing down to the heart; the Forest's roots as the ceiling | the **waterfall** from the roots' crack into the heart's pool (Andrew's waterfall); the heart's pulse on one oscillator running every crystal; the bats leaving the ledge when a lamp lights; salamanders creeping closer when you stand still; the crystal beetle's glowing shard; the four kids in a line at the mouth | **the lamps** (T-02): the caves' growth stage; the rim crystals' proximity glow; Tab swaps the walked kid | `,` `.` step between scenes, `H` is the hub (`sandbox/index.html`) |

**Findings that became rows:** T-15 (the kids from the photos), T-16 (Bog fog ranges), T-17 (the aurora's altitude and the camera), T-18 (the caves' demo layout as the seed for T-01..T-04), T-19 (the Desert's dusk key).

**What the kids look like now, in one line each** (the close-ups: `desert-noon-cu-01`, `bog-night-cu-01`, `frozen-morning-cu-01`, `caves-half-cu-01`): Liam sapphire with the shield outboard and dark-brown spikes; Noah fox-orange with the fringe over one eye, freckles, blue eyes, the bow a line above the head; Collette amethyst with long dark tails, the amber bow headband, the staff planted with the orb a head above her; Isabella ruby with the big blonde hair, bows and tiara, the hammer leaning from the ground to her hand, the cape that drags. Each has a flourish on `X`: the shield taps, the bow spin, the staff twirl with the sparkle burst, the whirl.

**Not judged yet:** four kids side by side under daylight (the caves are dark; the line-up's colours are read by their rings and lamps); the walk and run at speed; the animals' tempo against `MOTION_TEMPO_NOTES.md` (needs-render, T-06).
