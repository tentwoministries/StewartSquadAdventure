# The Opus fixes: art-director scores of the re-shot frames (2026-09-08)

**Branch** `phase-0.75-visual-studies`, scored at `6cd7506` (the fix passes) with `d820fac` and `6203f22` landing during scoring (the chase frame's rename to `-03-02`; the meadow's round 2 with its `l1`/`w1` frames, read in the addendum) · **frames** 1600 × 1000 PNG, `docs/design/mockups/` · **rubric** Brief §8 Phase 1 (ten criteria, 1–5), applied exactly as in `opus-experiment-scores-2026-09-08.md` · **scored by** art-director (Fable, xhigh), once · **reference** `docs/reference/Fernwood1.jpg`, `Fernwood3.jpg`.

**How to read the numbers.** Criterion 10 (performance) is still n/a (no `perf.json`, no overlay in any capture), so every total is **out of 45**; the excellence mark scales to ≥ 38 with nothing below 4, and the bar this report is asked to rule on is **35**, the Forest baseline (`forest-dusk-s1-b-02`, 35; `frozen-night-s1-01`, 29). The anti-palette rule is applied as written: any of its six looks caps criterion 2 or 3 at 2, and a cap given last time is lifted only when the look is gone from the frame. Criterion 8 (motion) is scored from evidence this time: the Home Wrong filmstrip and swing pair, the meadow's ribbon and shatter pairs and its stepped probe, the flight's sampled schedule (cruise 14.000 m/s, largest per-frame speed change 0.100 m/s, bank never within half a degree of the clamp, bounce peaks 1.00 / 0.50). Predecessor scores: seven come from the last report's table; the rest (marked †) are the `-01` frames scored now on the same rubric so every re-shot has a like-for-like number beside it.

**A probe of my own.** Because three of the questions this pass raised are about darkness (T-24's floor, T-39, the anti-palette's black row) and one is about a uniform green, every frame below was measured, not only looked at: luminance per pixel in the encoded domain (the same domain as `scripts/probes/shadow-lum.cjs`; my numbers reproduce the builder's, S1 73.2 → 58.7 % and S3 96.7 → 65.7 % under the 12 % line), the fraction under 5 % (what I count as black), and the hue spread of the lit ground. The table is at the end. Nothing in the repo was edited; the probe script lives in the session scratchpad.

## Scores

| Frame | Predecessor | 1 Sil. | 2 Colour | 3 Light | 4 Atmos. | 5 Detail | 6 Facets | 7 Comp. | 8 Motion | 9 UI | 10 | **Total /45** | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `shadow-wrong-s1-02-01` | `s1-01` 33 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | n/a | **36** | +3 |
| `shadow-wrong-s2-02-01` | `s2-01` 25† | 4 | 4 | 2 | 3 | 3 | 3 | 3 | 3 | 4 | n/a | **29** | +4 |
| `shadow-wrong-cu-02-01` | `cu-01` 32† | 4 | 4 | 4 | 2 | 3 | 3 | 4 | 2 | 4 | n/a | **30** | −2 |
| `meadow-golden-s1-02-03` | `s1-a-01` 31 | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 4 | 4 | n/a | **32** | +1 |
| `meadow-golden-s2-02-03` | `s2-a-01` 30† | 4 | 3 | 4 | 3 | 4 | 4 | 3 | 4 | 4 | n/a | **33** | +3 |
| `meadow-golden-s3-02-02` | `s3-a-02` 27† | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 4 | 4 | n/a | **32** | +5 |
| `meadow-golden-beat-02-01` (the connect) | `s3-a-02` 27† | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 4 | 4 | n/a | **32** | +5 |
| `rim-dawn-s2-02-01` | `s2-01` 29 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | n/a | **30** | +1 |
| `rim-dawn-s4-02-01` | `s4-01` 21† | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | n/a | **29** | +8 |
| `rim-dawn-cu-02-01` | `cu-01` 26† | 4 | 3 | 3 | 2 | 4 | 4 | 3 | 2 | 4 | n/a | **29** | +3 |
| `flight-golden-wg-02` | `wg-01` 25 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 4 | 4 | n/a | **27** | +2 |
| `flight-golden-ch-03-02` | `wg-01` 25 (`ch-03` 22†) | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 4 | 4 | n/a | **27** | +2 |
| `flight-golden-ld-02` | `wg-01` 25 (`ld-01` 29†) | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 4 | n/a | **30** | +5 |

Caps applied: `shadow-wrong-s2-02` lighting (pure-black shadow: the cabin roof, 7 % of the frame at p50 0.018), `flight-golden-wg-02` and `ch-03-02` colour and lighting (pastel everything, unchanged). Caps lifted: `rim-dawn-s2-02` (the rock is dark navy now, not lavender) and `flight-golden-ld-02` (deep pines, blue shadows, a directional key). Excellence mark: none of the thirteen. **The 35 bar: `shadow-wrong-s1-02-01` at 36**, and `meadow-golden-l1-02-01` at 35 from the addendum; nothing else.

Supporting frames, scored the same way so the hub can choose its cards: `shadow-wrong-s4-02-01` 31 · `shadow-wrong-sw-02-01` 31 (lighting capped: the pine canopy, 20 % of the frame at p50 0.023) · `shadow-wrong-s3-02-01` 25 (from 19†) · `rim-dawn-w1-02-01` 31 · `rim-dawn-s1-02-01` 30 · **`meadow-golden-l1-02-01` 35** (round 2, addendum) · `meadow-golden-w1-02-01` 30 (round 2).

Shared defects, unchanged and not counted: Noah's HUD disc is still dark teal; the card still repeats its title in the eyebrow; no frame carries a perf number.

---

## 1. Home, Wrong — 36 / 29 / 30 (S1 reaches the bar)

**What reads.** S1 is now the picture the palette argument needed. The wrong-side key at 12° throws the seats, the posts, the tent and both kids as long shadows toward the lens (the "sun that never sets" is finally in evidence); the fire is three cyan tongues on charcoal instead of a black crystal; the pool is a feathered cyan-over-violet disc, not a spotlight; the ground's tufts read as grass; the eight wrong things fill the quadrant that was empty (the toppled stool and rack, the spilled bedroll, the bucket with its cyan puddle, the crate, the ball, the cracked lantern hung on the line and leaking onto the ground under it); the cabin's roof and ember windows anchor the top-right; the shadow deer is a cyan ghost at the far left. Measured, the mid-tones lifted threefold (p50 0.045 → 0.095) while the hot pool came down (p95 0.170 → 0.106): softer, shorter light, the reference's first habit. The dissolve filmstrip is a real ease (the deer smaller and fainter at each of five steps, the mote column carrying on after it), and the swing pair moves the seat 255 px in half a second. S4 is a scene now (the three broken blocks with rift seams, the sheet climbing their faces, the drops carrying on over the lip, sky and pines and a horizon), and the swing station is a good composition.

**What is wrong.**
- Two pure-black masses: the cabin's roof and porch roof at S2 (x 500–1100, y 130–310: p50 0.018, 98 % of it under 5 %) and the pine canopy at SW (x 900–1600, y 0–470: p50 0.023). These are faces that see neither the key nor the hemisphere, so `voidify`'s lifted floor does not reach them. The Rootways' lighting was capped last time for a 1 % black face; these are 7 % and 20 %.
- Isabella's hair cap renders translucent at CU: the gold circlet and the fringe's dashed edge show through a grey dome (`cu-02` x 700–980, y 330–580, confirmed at 3×). A `transparent` material shared with something faded, or a depth-write order; at S1 the same cap is opaque gold.
- CU lost its air. The old close-up had the sky, the tent's torn red and the fire's rim; the new one is a face against a flat wall with the embers hidden on purpose. Nothing moves in it (motion 2) and no layer but the window's bloom is active (atmosphere 2). It scores two points below its predecessor.
- At S1 Isabella stands behind the far seat and her ring's near arc crosses the seat's top face, so she reads as standing on the stump; the bedroll stack beside Collette reads as three white stairs. The seated pose is still owed in `_shared` (LESSONS Misc) and the log says so.
- The sky's furniture (the black moon's ember rim, the mirrored constellations) is in none of the eight frames; the log shows the moon at +40° cannot share S3's frame, but S1 and SW could still be aimed at it.
- S3 is better and still a diagram: from 83 % of pixels under 5 % to 1.5 %, with the spark, its column, the rift-lit lip and a warm-bellied cloud, but the upper 56 % of the frame is one violet gradient at p50 0.103 with nothing in it.
- From SW the dissolving deer's silhouette sits exactly on the cabin's roofline and reads as leaping over it; the fire from the side reads as one tall cyan cone with a white cap.
- The plain's tufts at the low stations (SW, S4) are still an even spread of cones; the thinning halved them but kept them uniform.

**Fixes asked, and whether the frame shows them.** Plan §3: the deer's dissolve, visible (filmstrip); the swing at ±25°/3.1 s with its own station, visible (pair), though the station's canopy is black; S3 lit as a beat, visible and improved; S4's climb, visible. The last report's list: 1 the pool, done; 2 the fire tongues, done at S1 (not from the side); 3 Isabella seated, cut, she stands; 4 the key's shadow, done, the best change in the pass; 5 the tufts and the eight wrong things, done at S1; 6 the pitch for the moon, not done; 7 S3's far light, done except the moon and constellations, logged as impossible at that station.

**Anti-palette.** S1: none (29 % of pixels under 5 %, down from 54 %, and no slab). S2 and SW: pure-black shadow (the roof, the canopy). S3: none now. S4: none (the stream band is dark teal, p50 0.100, not black).

**LESSONS re-made.** The Rootways' black-face row, twice, in geometry that faces neither light; T-09 at the low stations (thinned, not clustered); the line-of-sight row (the deer on the roofline from SW). Fixed from the ledger: the lollipop on the camera (`clearNear`), T-16 at S3, the pop (the dissolve is the tempo note done right), T-24's floor as a paint rule (T-39).

**Changes planned, in order.**
1. The black faces: a wrap or ambient-floor term in the void material so no face renders under 5 % encoded (target ≥ 8 %, about `#1A1030`); re-shoot S2 and SW. (lighting; lifts two caps)
2. Isabella's hair cap at CU: make it opaque (find the shared transparent material or the draw order). (facets)
3. Turn CU 30° so the window stays as the key and the far plain's fog and the fire's edge enter the left third; let the embers through at CU with a smaller near-camera sprite size rather than hiding them. (atmosphere, motion)
4. Move Isabella 1 m left of the far seat; rotate the bedroll 40° and drop its top slab. (silhouette)
5. Aim one hero station at the moon: S1 pitch −4° or the moon's azimuth into S1's cone, so the bible's row is photographed at least once. (atmosphere, composition)
6. S3's upper half: two more void clouds lit from below and the mirrored constellations at the top edge, since the moon cannot be there. (composition)
7. The fire's tongues staggered 0.15 m at the base and in height so the side view is three flames, not a cone; move the DE spot 3 m or SW's yaw 5° so the deer clears the roofline. (silhouette)
8. The plain's tufts clustered (0.6/m² in clumps, as the plan said), not thinned evenly. (detail)

**Keep.** Everything in S1: the key's elevation and its shadows, the pool's feather, the tongues, the eight wrong things, the lifted albedo (T-39's paint numbers), the `thinScatter()` cells; the dissolve's ease; the swing's rates and its lantern; S4's blocks and climbing sheet; the card.

**Verdict.** **S1 goes in front of the family** (36), with the dissolve filmstrip as its motion evidence. S2 (29, capped) and CU (30) do not; SW (31) is the swing's evidence and not a card until its canopy is lit. S3 and S4 stay study-only as the ruling says.

## 2. The Crash Meadow beat — 32 / 33 / 32, the connect 32 (L1 from round 2 reaches the bar)

**What reads.** The meadow is a meadow now: clustered tufts, pebbles a step off the green, litter in the olive-browns, the red and orange flecks gone (the pixel probe agrees: warm flecks 1.14 → 0.01 per mille). The camp reads better from every angle: the palisade leans and varies, the cook-fire's tongue clears the pot, the lantern hangs on the cart's front corner and the cage is empty, the furrow ends in a wreck-heap whose wheel and boards read at 24 m, and a totem stands between the camp and the heap. The whirl is a swept 220° arc with a trailing fade, eased in over 0.27 s (the pair shows r 0.59 m then 1.90 m), and it no longer reads as a second selection ring; the shatter is a flat fan of shards with a pale dust puff at +0.2 s and clean ground at +0.8 s; the probe proves what no still can, that the goblins now reach `windup` and `hit`. The long golden shadows are as good as before.

**What is wrong.**
- The lit ground is one green, by the numbers: on the lit band (x 900–1500, y 380–700) hue SD 16° and p05–p95 0.033–0.115, and these are the same numbers as `s1-a-01` (17°, 0.032–0.115). The scatter pass changed the flecks and did not touch the ground. The Forest baseline's lit band spans hue SD 64° and 0.016–0.274. This is the uniform mid-green row, still held off the cap only by the shadow bands.
- No tall thing enters S1, S2 or S3; the station note now says so ("no tree at pitch 40") and the pitch was kept. The totem's post is the only vertical in S1.
- The totem reads as a white ball on a post (a golf ball on a tee at 24 m); the face, rag and skull were scaled ×1.5 but the skull is a plain icosphere with no sockets or jaw.
- The ribbon's head is `hero.isabella.glow` `#FFD966` × 1.6 with the ruby `base` only at the tail (`_shared/kid-isabella.ts:73`), so the arc reads pale gold; `heroes.md` §2.5.4 says a ruby ribbon and §2.1.1 reserves `glow` for the Ground Pound ring and damage numbers. The Ground Pound's gold ring and the whirl's arc are now the same colour.
- No saved frame shows a goblin's windup, cone telegraph, hit or ring flash; the probe has their timestamps (first windup 13.43 s, first hit 13.78 s) and the readability of the telegraph is unjudged.
- In the connect frame the two goblins are red lumps at Isabella's feet; `shatter-0` (+0.2 s) is the better connect picture. In `shatter-0` the hammer lies flat on the ground beside her, which reads as dropped.
- S1's lower-left quadrant (x 0–600, y 550–1000) is grass, tufts and pebbles only.

**Fixes asked, and whether the frame shows them.** Plan §3: the goblins attack, proven by the probe, not by a frame; the scatter, visible; the shards, visible (`shatter-0/1`); the ribbon's ease and sweep, visible (`ribbon-0/1`, the connect); the hit-stop, proven, invisible by nature; the S1 note, rewritten. The last report's list: 1 scatter, done; 2 totems in frame, done (reads as a ball); 3 a tree at S1, not done in the pass (done by round 2's L1, addendum); 4 the note, done; 5 the wreck-heap, done; 6 the palisade's lean and the flame above the pot, done; 7 the whirl as a swept arc, done, the flash and shake still not in evidence; 8 the lantern, done. Addendum items 9–11 (attack state, ribbon ease, shards' gravity and the puff), done.

**Anti-palette.** Uniform mid-green on the lit ground, unchanged in number; the shadow bands keep it off the cap.

**LESSONS re-made.** T-08 (no tall thing in the hero frame), kept by the plan's own pitch. New: a token used for what the bible reserves another token for (the ribbon in `glow`). Fixed: T-09, T-22, the lantern in the cage, the pop (the ribbon), the goblins' brake, the hit-stop's clock (T-35).

**Changes planned, in order.**
1. The ground's hue: give the meadow's terrain the per-face jitter the Forest has (±6 % hue, ±10 % value), a warmer olive toward the camp and along the ruts, and make the trodden 15 % visible at S2 (it is not). (colour)
2. Promote L1 (pitch 32) to the hero card, or drop S1 to pitch 34 / d 26 so the edge trees enter the top-left. (composition; round 2 did the first, addendum)
3. The whirl ribbon's head to `base` ruby with `glow` as a thin rim, or a design-lead line amending §2.5.4; one or the other, logged. (colour, record)
4. Save the fight's telegraph: one frame at first `windup` and one at the ring flash's peak, from S3, so the cone and the flash can be judged. (motion, UI)
5. The totem's skull: two dark sockets and a jaw notch, the rag as a flat quad in the goblins' rust. (silhouette)
6. Use `shatter-0` as the connect's card; keep the hammer's head on the ground with the handle to her hand through the recovery. (silhouette, facets)
7. Twenty things in S1's lower-left: two wreck pieces from the furrow, a scorched patch, one more boulder. (detail)

**Keep.** The station numbers and the rewritten note; the shadows and the fire pool; `makeMeadowScatter` and its densities; the camp's set; the arc, its ease and its fade; the flat shard fan and the puff; the brake to `REACH − 0.2` and the probe; `ctx.stop` through the runtime and the held sim clock.

**Verdict.** S1, S2, S3 and the connect do not reach 35 (S2 at 33 is the nearest). **`meadow-golden-l1-02-01` from round 2 reaches 35 exactly** (addendum) and can go in front of the family as the meadow's frame, with `ribbon-1` and `shatter-0` as the fight's evidence; the spelled-out station S1 stays a study until changes 1 and 2 are in.

## 3. The west rim at dawn — 30 / 29 / 29 (not yet)

**What reads.** Every mechanical finding of the review is fixed and shows: the deer drinks on grass at the pond's north-west shore (`s3`), the sheet ends on the rock at the lip and the fall carries on from it (`s1`, `w1`), Liam stands on the stream's east bank with a planted birch behind him, three songbirds are in the air at `s4`, the bobber floats with its two rings, the fox is on the plate at `w1`, and `w1` now shows the island as an island (plate, stream, tongue, fall, plunge pool) instead of one violet mass. At `s2` the rock is dark slate instead of lavender, the plunge pool sits at the bottom edge and the foam is white and half-size. Navy sky fills `s4` and `w1`, and with the emerald plate and the teal stream those two frames are the first jewel-toned pictures this scene has produced.

**What is wrong.**
- The pastel cap on `s2` lifts, but what replaced the lavender is one dark navy: the rock face (x 0–700, y 60–600) went from p50 0.385 to p50 0.121 with 49 % of it under the 12 % line, and its facets are lost in the darkest third. The target was a range (shadow faces toward `#2A2C48`, sun-facing toward `#8A86B0`); the frame got a shift.
- The fall's ladder is still there, and the crop shows why: the horizontal blocks are the ribbon's own map (a block grid at about 0.7 m pitch), not the tongue behind it, which is flat now. Change 4 was aimed at the wrong thing.
- The key still does no work on the fall: no transmission glow, no warm edge on the foam, no god-ray through the mist (last report's change 2, not attempted). The sky at `s2` is still apricot to lavender with no navy (change 3, not attempted at this station).
- The planted birch is a green icosphere on a white stick, the default-engine tree the Rootways was sent back for, in the hero close-up and at `s4`; at CU only its bare white trunk is in frame (x 1195–1255, y 0–590) and it reads as a pipe.
- The sheet's trimmed end at the lip is a ragged stair of triangle edges (`s1` x 700–1000, y 420–500; `s4` x 1100–1250, y 480–520).
- The rim plate's flowers are the Forest's confetti untouched in this quadrant (`s4`, `cu`, `s3`, `w1`): pink, red and blue flecks at uniform density.
- CU has no air (atmosphere 2: a sky gradient and nothing else) and nothing moving.
- The two below-rim clouds specified for the scene are still in no frame, and neither is the second ribbon off the shelf.

**Fixes asked, and whether the frame shows them.** Plan §3: the deer on ground, visible (`s3`); `findLip()`, visible (`s1`); the fox, visible (`w1`); the birds, visible (`s4`); the bobber's rings, visible (`s3`); the tongue as rock with moss, visible at `s1` (at `s2` it is at the top edge and mostly out of frame); S1/W1's fog, visible (`w1`). The last report's list: 1 the rock's value range, half done (dark, not ranged); 2 the backlit fall, not done; 3 navy at S2, not done (present at S4/W1 by station choice); 4 the banding, not done (the cause is the ribbon's map); 5 the spout top and foam, done; 6 the drain framed, half done (the pool is in, the second ribbon is not); 7 W1's fill and fog, done.

**Anti-palette.** `s2`: pastel lifted (33 % under 12 %, 2.5 % under 5 %: dark, not black); the sky is still pastel. `s4`, `cu`, `w1`: none. `s3`: the pond is a near-black sheet over 40 % of the frame, read as the navy sky's reflection at dawn; watch it.

**LESSONS re-made.** The Rootways' first row (the icosphere-on-a-stick tree) in the planted birch; T-09 on the rim plate; the previous report's "a hard-edged water sheet", now as a stair. Fixed: T-16 (`w1`), the floating deer (T-38's rule), `findLip`, the sheet's overhang, the boundary trigger at 5.00 m.

**Changes planned, in order.**
1. Backlight the fall: a transmission term toward `#FFE0C0` where the sun is behind the ribbon, a warm edge on the foam, spray sparkles lit by the key. (lighting)
2. Soften the ribbon's map to long vertical streaks at ≤ 30 % contrast; the ladder is in the texture. (facets)
3. The rock face as a range, not a shift: shadow faces `#2A2C48`, sun-facing `#8A86B0`, the vertex jitter visible; at `s2` the rock should read as facets in shadow, not a slab. (colour)
4. Navy into `s2`: pitch 6 → 12 or the camera 3 m lower; `s4` and `w1` prove it reads when it is in frame. (colour)
5. The birch from the Forest scene's own recipe (a lobed crown), or a pine; no icosphere; at CU its crown must be in frame or the trunk out of it. (silhouette)
6. The sheet's end cut along the lip's line with a 0.3 m curl over it, not triangle edges. (facets)
7. Thin and cluster the rim plate's flowers as the meadow did. (detail)
8. The hub card from `w1-02` (31) or `s1-02` (30) rather than `s2` (30): they show the tongue, the fall and the pool in one picture, and `s2`'s one virtue, the underside, has lost its facets. (composition)
9. The two below-rim clouds, lit warm on their east faces, in `s2`'s lower-left third. (atmosphere)

**Keep.** `place.ts` and every march; the deer's shore and the fox's route; T-32's spur with its moss and lightened tops; the trimmed sheet's principle; `w1`'s own fog pair and fill; the birds' trigger; the bobber's two periods; the dawn column.

**Verdict.** Not yet. The pass fixed everything a probe could check and none of the four picture changes the last report ranked first (the backlit fall, the rock's range, navy at S2, the banding). One more pass on those four takes `s2` past 35; `w1` at 31 is the frame to show if one must be shown now.

## 4. The flight, CS-04 — 27 / 27 / 30 (not yet; the tempo is right)

**What reads.** The tempo Andrew's note was about is fixed and proven: arc-length sampling against the bible's schedule, cruise 14.000 m/s, no per-frame speed change over 0.100 m/s, the bank from curvature with 0.00 s within half a degree of the clamp, two bounces at exactly 1.00 and 0.50 m, a 2.4 s level-off before touchdown, and T-37 logs the conflict the bible has to settle. In the frames: no selection rings on the fuselage; every seat faces forward (the kids' backs at the chase, which is right); the wing station shows a real 24° bank over the shore with pines in the near corner; the landing frame catches the plane at its first hop's peak with **its shadow on the snow**, long blue pine shadows across the strip, cream snow in the key and lavender in the shade, a snowman and a hut to land beside. `ld-02` is the first flight frame with a lit aircraft and a directional key, and it is the one frame where the pastel cap lifts.

**What is wrong.**
- Pastel everything at `wg` and `ch`: the sky band at `wg-02` (y 80–300) sits at mean 0.57 encoded with hue SD 35°, the clouds are pink-lavender, the snow lavender, and the aircraft is the only saturated object. The Frozen golden keyframe is `biomes.ts`, outside the flight folder's reach, so last report's change 1 (navy top stop, deeper horizon, cloud bellies `#8A7AB8`) was never in this pass.
- At `wg-02` Liam's head sits on the upper wing's surface with the wing through his neck, and his nape piece lies on the wing beside it as a second brown lump (crop at 3×); Noah's head is under the wing and unseen; Isabella and Collette overlap into one shape. The log's "four heads separate" is true at the chase and not at the wing.
- The red rod forward of the cockpit is still there (`wg-02` x 460–720, y 400–500), pointing at the propeller. The scarf is aft per the numbers (the thin red line behind Ed at x 1050–1130, y 375), so the rod is something else in `_shared/plane.ts`; it reads as a spear either way. And no still shows a bend in the scarf.
- The tail skid hexagon floats detached from the fuselage at `wg` (1245, 505) and `ch` (920, 700); knowing it is a skid does not make it read as one.
- The island is still never shown as an island: no rim, no void, no dome in any of the three frames (last report's change 6). `ch-03-02` is the plane, a frozen lake and pines; `wg-02` is the plane over cloud.
- Motion is scored 4 on the numbers, not on the stills: nothing in a wing or chase still moves but the bank.

**Fixes asked, and whether the frame shows them.** Plan §3: arc-length sampling and the schedule, proven by the test and the probe; the bounce 1 : 0.5, proven, and `ld-02` is the peak; the bank never pinned, proven, `wg-02` at 24.3°; the look hook, proven by the probe, invisible in stills; stowed under Lab, done. The last report's list: 1 navy, not done (out of reach); 2 light the aircraft, half done (`ld-02` has the shadow); 3 the scarf aft, done by the numbers, the rod and the wave not; 4 rings, done; the hexagon, deferred; 5 seat the kids, half done (the bench lowered, the heads not clear at the wing); 6 the island as an island, not done.

**Anti-palette.** `wg-02`, `ch-03-02`: pastel everything (cap). `ld-02`: lifted.

**LESSONS re-made.** The Misc row "seated kids need a seated pose" (the bench moved, the pose did not; a head through a wing is the same interpenetration as last time). Fixed: the rings during a cutscene, the spline sampled by arc length, the non-active `lookAt` writes, the T-26 facing.

**Changes planned, in order.**
1. A `_shared`/`biomes.ts` task for the Frozen golden keyframe (navy top stop in the top third at a level camera, horizon toward `#F08A48`, cloud bellies `#8A7AB8`), checked with one frame per scene; nothing in the flight folder can lift its cap. (colour, lighting)
2. The wing station 3° higher and 1 m further out, or the seats staggered fore-aft (four kids on a 1.10 m bench) and the bench 0.1 m lower again, so Liam's head clears the wing and Noah's is seen. (silhouette)
3. Name the red rod in `_shared/plane.ts`; shorten it or colour it with the airframe. (facets)
4. The tail skid on a strut to the fuselage or dropped to the tail's underside. (facets)
5. One station on the 16 m north-rim leg (ct ≈ 10 s) with the rim and the void under the wing and the dome ahead. (composition, atmosphere)
6. A rim on the top wing's leading edge and the undersides in the hemisphere's ground colour; lower `wg` so the plane's shadow crosses the pines as it crosses the strip at `ld`. (lighting)
7. A visible bend in the scarf in every still (two segments, the six frequencies). (motion)

**Keep.** `schedule.ts` and `flight.test.ts`; the clothoid path; the bank from curvature; the bounce's `sin²`; `?ct=`; the look hook use; the landing station and its shadow; T-27, T-37.

**Verdict.** Not yet. `ld-02` at 30 is the nearest and the one to show if the flight must be seen; `wg` and `ch` stay under Lab until the shared keyframe task lifts the cap.

---

## T-39, from the scorer's side

The ruling (`DECISIONS.md`, `d820fac`) is right and I would add two riders for the application step. (a) The exemption is for the sky's *value*, not for its emptiness: `shadow-wrong-s3-02`'s upper 56 % sits at p50 0.103, exactly at the floor, and is a gradient with nothing in it; an exempt sky has to carry the row's furniture (moon, constellations, void clouds) or it is a study, not a frame. (b) The floor as reworded ("nothing renders below 12 % that a surface colour can carry") must still bind geometry, and this pass shows where it does not yet: the cabin roof (p50 0.018) and the pine canopy (p50 0.023) are surfaces a colour can carry, and they render at 2 % because they face neither light. A wrap or ambient-floor term is the fix, and the anti-palette's black row is the reason. The 4 % arithmetic in (b) of the tweak is the builder's measurement; nothing in the frames contradicts it.

## Ranking (the thirteen frames of the task, plus round 2's L1 for the record)

1. `shadow-wrong-s1-02-01` — 36. Cast shadows, a soft pool, a fire that is a fire, twenty things; the only frame past the bar.
2. `meadow-golden-l1-02-01` — 35 (addendum). Depth, the warm haze, trunks at the top edge; the lit ground's one hue keeps it at the line.
3. `meadow-golden-s2-02-03` — 33. The camp built and now readable; no tall thing.
4. `meadow-golden-s1-02-03`, `-s3-02-02`, `-beat-02-01` — 32. Scatter fixed, sweep fixed, ground unchanged.
7. `rim-dawn-s2-02-01`, `shadow-wrong-cu-02-01`, `flight-golden-ld-02` — 30.
10. `shadow-wrong-s2-02-01`, `rim-dawn-s4-02-01`, `rim-dawn-cu-02-01` — 29.
13. `flight-golden-wg-02`, `flight-golden-ch-03-02` — 27.

## Verdicts against the bar (35)

| Scene | Reaches 35 | Show the family | Not yet |
|---|---|---|---|
| Home, Wrong | **yes**, `s1-02` (36) | `s1-02` with the dissolve filmstrip | `s2`, `cu`, `sw`, `s3`, `s4` |
| The Crash Meadow beat | **yes**, `l1-02` (35, round 2) | `l1-02` with `ribbon-1` and `shatter-0` as the fight's evidence | `s1`, `s2`, `s3`, the connect |
| The west rim | no (best 31, `w1-02`) | nothing yet; `w1-02` if one must | all; one pass on the four picture changes |
| The flight | no (best 30, `ld-02`) | nothing yet; `ld-02` if one must | all; the shared keyframe task first |

In one line: the pass fixed what a probe can check in all four scenes and what an eye must judge in one and a half of them; Home Wrong is done, the meadow is done at one station, the rim and the flight each need the picture pass they were owed before this one.

---

## Addendum: round 2's meadow frames (`6203f22`, landed during scoring)

`meadow-golden-l1-02-01` (pitch 32): the same meadow with depth. A pine's corner and a birch trunk enter the top edge, the far ground takes the golden haze so the frame runs warm at the top and cool at the bottom, the wreck-heap's wheel and boards read, the boulders anchor the near corners, the shadows run the width of the frame. Scored 4 / 4 / 4 / 4 / 3 / 4 / 4 / 4 / 4 = **35**: colour 4 on the haze gradient S1 does not have, detail 3 for the same empty lower half, composition 4. It is what change 2 of the last report asked for and it reaches the bar by a point. `meadow-golden-w1-02-01` (the wide): the shore and turquoise water enter at the left, the camp and the haze read, but a flat purple void plane shows through the plate's stepped edge at the lower-right (x 1050–1600, y 720–1000) as a hard-edged slab; facets 2, total **30**. Neither changes the numbers above; L1 changes the meadow's verdict.

## The probe (encoded luminance, step 2; "black" is under 5 %, the floor is under 12 %)

| Frame or region | mean | p05 | p50 | under 5 % | under 12 % |
|---|---|---|---|---|---|
| `shadow-wrong-s1-01` | 0.106 | 0.008 | 0.045 | 54.4 % | 73.2 % |
| `shadow-wrong-s1-02-01` | 0.130 | 0.023 | 0.095 | 29.1 % | 58.7 % |
| `shadow-wrong-s2-02-01` | 0.090 | 0.002 | 0.058 | 44.9 % | 78.5 % |
| — its cabin roof (500,130)–(1100,310) | 0.018 | 0.001 | 0.018 | 98.1 % | 99.9 % |
| `shadow-wrong-cu-02-01` | 0.175 | 0.011 | 0.117 | 29.9 % | 51.0 % |
| `shadow-wrong-sw-02-01` | 0.181 | 0.021 | 0.099 | 24.3 % | 61.0 % |
| — its pine canopy (900,0)–(1600,470) | 0.086 | 0.016 | 0.023 | 82.4 % | 91.3 % |
| `shadow-wrong-s4-02-01` | 0.161 | 0.005 | 0.110 | 24.2 % | 53.9 % |
| `shadow-wrong-s3-01` → `-02-01` | 0.035 → 0.129 | | 0.013 → 0.103 | 83.2 → 1.5 % | 96.7 → 65.7 % |
| — `s3-02` sky (0,0)–(1600,560) | 0.118 | 0.093 | 0.103 | 0.0 % | 66.8 % |
| `rim-dawn-s2-01` → `-02-01` | 0.426 → 0.278 | | 0.385 → 0.202 | 1.4 → 2.5 % | 3.5 → 33.0 % |
| — `s2-02` rock face (0,60)–(700,600) | 0.132 | 0.076 | 0.121 | 1.2 % | 49.0 % |
| `rim-dawn-w1-02-01` / `s4-02-01` / `cu-02-01` | 0.275 / 0.287 / 0.351 | | | 0.1 / 0.1 / 2.0 % | 8.4 / 9.2 / 10.3 % |
| `meadow-golden-s1-02-03` | 0.291 | 0.157 | 0.297 | 0.3 % | 1.1 % |
| `flight-golden-wg-02` / `ld-02` | 0.574 / 0.568 | | | 0.6 / 5.5 % | 2.8 / 8.4 % |
| Baselines `forest-dusk-s1-b-02` / `frozen-night-s1-01` | 0.260 / 0.372 | | | 0.0 / 5.1 % | 3.8 / 12.8 % |
| For scale: `bog-night-s1-01` / `caves-half-s1-01` | 0.093 / 0.059 | | | 18.9 / 75.2 % | 86.5 / 91.2 % |

Lit-ground hue (linear, saturated pixels only, the band x 900–1500, y 380–700): `meadow-golden-s1-a-01` hue 136° SD 17°, value p05–p95 0.032–0.115; `meadow-golden-s1-02-03` 135° SD 16°, 0.033–0.115; `forest-dusk-s1-b-02` (y 400–700) 126° SD 64°, 0.016–0.274.

Frame-time table: none; no capture carries a perf number and no `perf.json` was provided (criterion 10 n/a throughout).
