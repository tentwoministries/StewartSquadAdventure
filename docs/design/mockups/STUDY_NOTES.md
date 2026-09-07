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

## 3. The study plan

| # | Study | Question | Status |
|---|---|---|---|
| 1 | Forest dusk at the C1 camp, S1 | palette, fog, the fire's pool, the tent glow, the unit conversion, the station pitch | **rendered; sample set saved; awaiting Andrew** |
| 2 | The same at deep night | stars, fireflies, lantern pools, the ring's light | next (a `?t=night` frame exists as a preview) |
| 3 | Golden hour on the stream, S2 | water, rim light, foam, the walk pose | next (`?t=golden` preview exists) |
| 4 | The four kids' line-up at gameplay distance | silhouette and colour at one-eighth screen height | after Andrew's read on Liam |
| 5 | The Crystal Caves cross-section with the heart | T-03 | cluster A |
| 6 | The anti-palette check | the same frame with the forbidden looks | last |

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
