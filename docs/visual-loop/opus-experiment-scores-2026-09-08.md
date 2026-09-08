# Opus 5 experiment: art-director scores (2026-09-08)

**Branch** `phase-0.75-opus-experiment` at `a9c31a5` (worktree `StewartSquad-opus`) · **frames** 1600 × 1000 PNG, `docs/design/mockups/` · **rubric** Brief §8 Phase 1 (10 criteria, 1–5) · **scored by** art-director (Fable, xhigh) · **reference refreshed** `docs/reference/Fernwood1.jpg` and `Fernwood3.jpg` (the `fernwood.jpeg` the brief names is now this set per `docs/reference/README.md`), `STUDY_NOTES.md` §1, `LESSONS.md`.

**How to read the numbers.** Criterion 10 (performance) has no data: no `perf.json`, no overlay in any capture, and `OPUS_EXPERIMENT_NOTES.md` says no frame-time was taken. It is marked n/a and every total is **out of 45**. The excellence mark (≥ 42/50, nothing below 4) scales to ≥ 38/45 with nothing below 4; no frame here reaches it, including the two baselines. Criterion 8 (motion) is scored from still evidence only: **no motion-capture pairs or frame diffs were provided with the task** for scenes 1, 2, 4 and 5 (three contact sheets appeared on disk during scoring and are read in the addendum at the end), and Opus's own notes say the animation in those scenes was never watched running. The flight's `?ct=` frames prove its clock runs, not its tempo; the meadow's `s3-a-02` is a mid-whirl still. The anti-palette rule of the rubric is applied as written: any of its six looks caps criterion 2 or 3 at 2.

**Baselines.** `README.md` names no hero frame for either scene, so per the task: `forest-dusk-s1-b-02.png` (variant B, "ember dusk", the variant `STUDY_NOTES.md` §4.6 says works, at the later of its two saves) and `frozen-night-s1-01.png` (the only S1; the log calls `frozen-night-l1-01` the reel's cover, but S1 is the like-for-like station).

## Scores

| Frame | 1 Silhouette | 2 Colour | 3 Lighting | 4 Atmosphere | 5 Detail | 6 Facets | 7 Composition | 8 Motion | 9 UI | 10 Perf | **Total /45** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 `rootways-golden-s3-01` | 3 | 3 | 2 | 2 | 2 | 3 | 3 | 2 | 3 | n/a | **23** |
| 2 `shadow-wrong-s1-01` | 4 | 4 | 4 | 4 | 3 | 3 | 4 | 3 | 4 | n/a | **33** |
| 3 `flight-golden-wg-01` | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | n/a | **25** |
| 4 `meadow-golden-s1-a-01` | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 4 | n/a | **31** |
| 5 `rim-dawn-s2-01` | 4 | 2 | 2 | 4 | 3 | 3 | 4 | 3 | 4 | n/a | **29** |
| B1 `forest-dusk-s1-b-02` (Fable) | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | n/a | **35** |
| B2 `frozen-night-s1-01` (Fable) | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 2 | 4 | n/a | **29** |

Caps applied: frame 1 lighting (pure-black face), frame 3 colour and lighting (pastel everything), frame 5 colour and lighting (pastel everything). Pass/fail against the excellence mark: all seven fail.

**Shared defects, not counted against Opus** (they are in every frame, the baselines included): Noah's HUD portrait reads dark teal because `_shared/scene.ts:128` fills the disc with a radial gradient that is 70 % `colours.dark` (`#1F5E3F` in `kid-noah.ts`), so the one orange kid has a green badge; the card's eyebrow duplicates the title ("THE ROOTWAYS" in gold above "The Rootways") and is a tracked all-caps label with a gold rule under it, which Brief §6 says not to do (the reference does it too; it is a cluster-E question, not a scene defect); the biplane is `_shared/plane.ts` (Fable's, commit 68dbd61).

---

## 1. `rootways-golden-s3-01` — the tilt-up under the tower trunks (23/45)

**What reads.** The idea. Six trunks converge upward, the sky window between them runs peach to lavender, the canopy closes over the top, and the frame says "these trees are very tall" without a kid for scale. This is the only frame in the whole sandbox that looks up, and T-23 (a tilt-up beat for the tall districts) is the right finding. The card ("Where the trees stop being trees.") is good.

**What is wrong.**
- The canopies are icosahedron balls on sticks. The two mid-layer trees at lower-left (x 200–600, y 430–800) and lower-right (x 950–1300, y 660–950) and the tower crowns across the top are the same flat-green sphere at three sizes. Nothing in the reference or in the Forest scene looks like this; it is the "default engine" tree. From the wide frame (`w1`) the whole district is a field of green balls at three sizes; only the pines at the lower-right have a real silhouette.
- A pure-black face on the central trunk: a vertical band (x 780–830, y 400–700) and the notch at (815, 345) render at or near `#000`. Under a hemisphere light with ground `#3E6A36` no lit-world face should reach black; this is either a back-face or a strand whose normal faces away from both lights. It caps lighting at 2.
- Shadow striping on the strand right of the black band (x 850–900, y 400–800): alternating light and dark verticals, the acne of a near-parallel face under a 16° key. Not in the ledger; needs a `normalBias` or a bias on the key's shadow.
- The branches are boxes with square ends: upper-left (x 0–150, y 160–250) and right (x 1270–1500, y 320–480). A box branch reads as a plank nailed to a tree.
- Nothing lives in it: no bird, no butterfly, no pollen against the sky, no vine, no moss strand, no woodpecker. The brief asked for a three-bird burst, butterflies and the knock; the tilt-up is the one frame where all of them would sit against sky and be seen. The only pale fragment, at (640–670, 615–670), is unidentifiable.
- The golden key does no work. The sun at elevation 16° / azimuth 245° should be a warm lobe in the sky behind the canopy with a rim on every trunk edge facing it; instead the trunks are lit flatly on one side and the canopy undersides are one dark green. No navy anywhere: the sky's top stop (`#3B5BA8`) is hidden behind the crown.
- The centre trunk bisects the frame, the two mid-canopies crowd the sky window from below, and the card sits on a trunk.

**The wide and gate frames.** `w1`: the ground is green now (T-20 and T-22 did their job) and the long shadows are the best thing in the scene; but the grass is the T-09 confetti at uniform density over the whole plate, the arch reads as a mouse-hole with a black interior at 60 m, and every canopy is a ball. `s1`: Elm reads as a stump with a saucer, the gate pillars are two bundles of leaning planks with green icosahedra glued on (x 1090–1400, y 300–460) and no lintel, so there is no gate; the root walkway at the top (x 500–1100, y 30–260) reads as a stack of crates, the same failure iteration 5 fixed on the arch; the kid at the gate is Liam (sapphire, shield outboard), where the brief put Noah looking up. The station itself (sunlit side, lantern, path) is well chosen.

**Anti-palette.** Pure-black shadow (the trunk face). The lower half of the sky window is pale peach over pale lavender: pastel, though the greens and browns are saturated so it is not "pastel everything". The ball canopies are the default-engine look in geometry rather than lighting.

**LESSONS re-made.** Confetti scatter (T-09) on `w1` and `s1`; "a lifted hill with a brown stripe does not read as a root" was found and fixed on the arch but shipped on the ridges at `s1`. The black face is T-24's floor rule (a Shadow Realm row) ignored in the Forest. New rows to add: shadow striping on near-parallel faces under a low key; box branches.

**Changes planned, in order.**
1. A canopy vocabulary for the towers and the mid layer: three to five flattened lobes per crown at different heights with ±6 % hue jitter and a darker underside, or the Forest scene's own pine and birch crowns scaled up; no icospheres. (silhouette, colour, detail)
2. Kill the black face: find the strand whose normal faces away (or the back-face) and apply a luminance floor of about 12 % to the Forest's shaded faces as T-24 does for the shard. (lighting)
3. Shadow acne on the strands: `normalBias` 0.02–0.05 on the key, and check the shadow box's near plane at the tilt-up station. (facets)
4. Put the sun in the frame: a warm lobe (`#FFD08A` → `#FFB870`) in the sky dome at azimuth 245 elevation 16, a rim term on trunk edges toward it, and a hint of dapple (a second, softer shadow from the canopy) on the trunks. (lighting)
5. Life against the sky: the three songbirds mid-burst, four butterflies on their curve, 40 pollen motes lit by the key, one moss strand and one vine between the two nearest towers. (detail, motion, atmosphere)
6. Branch geometry: tapered cylinders or prisms with a knuckle at the trunk, ends cut at an angle. (facets)
7. Reframe: centre tower to the left third, sky window to the right, drop the two mid-canopies that crowd the bottom, card clear of geometry; at pitch −20 aim so the sky's navy stop enters the top edge. (composition, colour)

**Keep.** The tilt-up station and T-23; the T-20 key/hemi ratio; the T-22 litter colours; the long shadows at `w1`; the lantern and path at `s1`.

## 2. `shadow-wrong-s1-01` — the cold mirror-fire (33/45)

**What reads.** The argument the Brief wanted: three light colours and no black. The cold fire's cyan pool, Collette's warm orb, the cabin's ember spill across the top-right, Isabella's ruby on a seat looking into the fire, the torn tent at upper-left, the four empty seats, the washing-line posts, the basket, the axe. Deep violet ground, rift cyan, ember: the Shadow Realm palette of Brief §4.2 exactly, and it is the only Opus frame whose palette is jewel-toned end to end. The card line ("Everything is where you left it.") is the best in the sandbox. This frame beats the Frozen baseline and sits two points under the Forest one.

**What is wrong.**
- The fire's light pool is a hard-edged disc about 14 m across (x 400–1250, y 380–860) with a flat pale grey-cyan interior. It reads as a spotlight from a rig above, not as light falling off a fire; the reference's first habit is soft, short light. Inside the disc the ground loses its violet entirely.
- The fire itself is a black inverted tetrahedron with a cyan rim (x 750–850, y 480–580). It reads as a dark crystal on a stone ring, not as a fire that is the wrong colour. The rising motes above it are right.
- Isabella is sunk into her seat: her legs are inside the stump (x 720–880, y 620–860), so she reads as a torso on a block. The hammer is a thin line along her back.
- The grass is the Forest's tufts recoloured, at the Forest's density, everywhere including inside the pool: confetti as thorns. The upper-left quadrant (x 0–500, y 60–380) is violet fog and tufts and nothing else.
- No cast shadows from anything: the wrong-side dusk key at a low elevation should throw the seats, the tent and the posts as long shadows across the pool; the frame has none, so the "sun that never sets" is not in evidence.
- The sky, the black moon with its ember rim, the mirrored constellations and the rift lobes are all out of frame at this pitch; the mood that is in the bible's row is only half in the picture.
- The bench or crate at right (x 1200–1400, y 560–700) is a dark box with a glowing diagonal; ambiguous. The crest post at (580, 470) reads as a cross, not an upside-down crest.

**The other two frames.** `s3` (the one warm light): 85 % of the frame is near-black (`#050310`–`#061418`), the far fire is a 200 px orange halo at horizon height that reads as a setting sun, not a campfire 250 m below, and nothing of the sky's furniture is visible. It is a diagram of an idea, not a picture; T-25's three occluders were beaten, but the frame that came out fails the anti-palette's black row and the composition criterion outright. `s4` (the stream running uphill): a flat teal sky with no violet, a dark trench with a hard cyan rim, the tufts, Collette's back at the bottom edge and a lollipop tree standing on the camera at top-left (x 160–330, y 0–160). Opus's own verdict ("something cyan in the trench") is right; nothing about it says uphill.

**Anti-palette.** None of the six in `s1` strictly; the far corner (x 0–300, y 100–300) drops below T-24's own 12 % floor. `s3` is pure-black shadow across most of the frame.

**LESSONS re-made.** Confetti scatter (T-09), by recolouring the Forest's tufts without thinning them. On `s3`, the Bog's wide-station lesson (T-16: judge the fog and the darkness at every station, not only the hero one). On `s4`, "a landmark on the station's line of sight" (the tree at the camera) and a station that shows the hero's back in the near foreground.

**Changes planned, in order.**
1. The pool: point light decay 2, distance 7 m, intensity down so the lit radius is about 5 m; tint the ground inside toward `#2E4A6A` (cyan over violet), never grey; feather the rim. (lighting, colour)
2. The fire: the Forest `fx.ts` tongue recipe (three two-cone tongues) in `#3AF0FF` / `#BFFAFF` at half rate, on charcoal logs; keep the motes. (silhouette)
3. Isabella seated: raise her 0.35 m, a seated pose with the hammer across her knees; Collette's orb the only warm carried light stays as is. (facets)
4. Enable the wrong-side key's shadow (elevation ~6°) with the T-24 floor, so the seats and the tent throw long shadows across the pool. (lighting)
5. Tufts to 0.6/m² in clusters, one step above the ground's value, none inside the pool; add eight hand-placed wrong things to the empty upper-left (the swing swinging, a toppled chair, the spilled bedroll, the crest as a plank crest on the cabin wall). (detail)
6. Drop S1's pitch to about 34° so the black moon's ember rim enters the top edge; the sky is half the bible's row and none of it is in the hero frame. (atmosphere, composition)
7. For `s3`: the far light as a small hard point (`#FF9A3C`, 12 px) with a faint warm cone on the void below it, the camera 4° lower so the rim's edge and two void clouds lit from below sit in the lower third; the sky's constellations and the moon must be in the frame. (composition)

**Keep.** The three-hue contrast; the T-24 floor; the torn tent; the ember windows and the porch light; the card.

## 3. `flight-golden-wg-01` — the biplane banking over the island (25/45)

**What reads.** A yellow biplane with green wings over snow pines, four kids on the bench, Ed's collar and goggles, the propeller as a disc. The banking angle and the pines under the wing sell flight. The tilt-shift on the near pines (bottom third) is the diorama seal working. The card line ("Don't ask Grandpa Ed about his landing record.") is the family's voice.

**What is wrong.**
- Pastel everything. The sky (60 % of the frame) is pale peach (`#F0C8B0`) to lavender; the clouds are pale pink; the snow is pale lavender. The reference's second habit is a navy sky at every hour and the golden keyframe's top stop is `#3B5BA8`; none of it is in frame. Only the aircraft is saturated. Part of this is inherited (Fable's `frozen-golden-w1-01` is the same lavender snow) but the sky and the hour were Opus's choice for the reel's only air shot. Caps colour and lighting at 2.
- The light is flat: no shadow of the plane on the snow, the fuselage's top and side are one yellow, no rim on the top wing, no warm side to the clouds. Golden hour reads as noon haze.
- Ed's scarf is a rigid red rod (x 420–760, y 350) pointing forward, toward the propeller. It must trail aft, and a still of a six-frequency ribbon should show a wave, not a stick.
- The selection rings are drawn on the fuselage under the kids (x 780–1150, y 520–560), and again in `ch-03` and `ed-01`: gameplay UI in a cutscene.
- The kids are a pile: Liam and Noah overlap into one blue-and-orange shape (x 880–1000, y 250–450), Collette is behind Isabella; their hips sit on top of the box, not in a cockpit (T-28 helped at the chase station, not here). Their props are stowed, so nothing identifies them but colour.
- A stray black hexagon hangs in the air at (1360, 685).
- The island is never shown as an island: the brief's reason for the scene was the Observatory dome and the cloud layer as the diorama's ceiling, and neither the dome nor a rim nor the void is in any golden frame. `ch-03` is 90 % pastel gradient with a small plane; `ed-01` is charming (Isabella's face, Liam's open mouth on the stall-drop) but Collette's torso is cut by the green wing box (y 235–300), her arm passes through it, and Liam's face is clipped by the top edge.

**Anti-palette.** Pastel everything.

**LESSONS re-made.** Props parented to hands (the reason the props were stowed at all); the rings and the kids' interpenetration are new rows ("hide world-space UI in a cutscene"; "seated kids need a seated pose, not a lowered standing one"). The curved-world sink (T-27) is the experiment's best new lesson and was fixed.

**Changes planned, in order.**
1. Navy into the frame: lower the sky's mid stop so `#3B5BA8` occupies the top third at a level camera, deepen the horizon toward `#F08A48`, give the clouds' bellies `#8A7AB8`; the snow keeps its lavender only in shadow and takes a warm `#F2E4D8` in the key. (colour)
2. Light the aircraft: the key at azimuth 245 / elevation 16 puts the undersides in the hemisphere's ground colour and a warm rim on the top wing's leading edge; the shadow box follows the plane (LESSONS) so its shadow crosses the pines. (lighting)
3. The scarf trails aft: rest direction = −velocity, two segments with the six frequencies visible as a bend in every still. (motion, facets)
4. Hide the rings for the duration of the flight; remove the stray hexagon. (UI, facets)
5. Seat the kids: a seated pose, hips inside the cockpit, the rim hiding the laps at the wing station too; raise the wing station's pitch by about 4° so four heads separate; Isabella's arms up and Collette's tails down must be readable from here. (silhouette)
6. Show the island: one frame of the circuit must have the rim and the void under the wing and the dome on the summit ahead; add a cloud below the plane in the lower-right and 40 glitter points over the snow. (composition, atmosphere)

**Keep.** T-27 and the `?ct=` clock; the beat schedule; Ed's collar and goggles; the tilt-shift on the pines; the landing's two bounces (unscored, unseen).

## 4. `meadow-golden-s1-a-01` — the spelled-out fight beat (31/45)

**What reads.** The goblin camp at upper-right (stakes, the cook-fire's warm pool, tripod and pot, three goblins, the cart with the cage and the fox-orange cloth), Isabella and Liam at centre with their rings, the furrow's two ruts crossing the meadow, two boulders, and above all the long golden shadows sweeping the ground from off-frame trees. This is the one Opus frame where golden hour does work: long soft shadows, a warm key, a fire pool that reads at 24 m. Built to plan, and the plan's set is there.

**Line by line against brief §3.4's S1.** The plan: "the camp's palisade upper-left, the totems, Isabella and Liam centre, the furrow's end lower-right." The frame: the palisade is **upper-right** (x 990–1600, y 0–380); Isabella and Liam are centre (correct); the ruts run from the lower-right corner to their far end at the **upper-left** (x 100–400, y 0–150), so the furrow's *end* is far upper-left; and **no totem is in the frame** at all. Opus's T-30 claim is verified from the runtime, not taken on trust: `sandbox/_shared/shot.ts:24–26` places the camera at `target − d·cos(pitch)·(sin yaw, 0, −cos yaw) + (0, d·sin pitch, 0)`, which for target (44, 0.8, 0), yaw 300, pitch 40, d 24 is (59.9, 16.2, 9.2) looking west-north-west; from there the camp at (40, −14) is right of the view axis and the furrow's end at x 22–30 is far ahead-left. The numbers were built as written; the description was written by eye without a render and is mirrored. Verdict: keep the station (it is good, and looking toward the sun's side is what gives the shadows) and rewrite the note from the render. One thing T-30 does not say: the totems are missing from S1 under either reading, and the plan named them.

**What is wrong.**
- The scatter is the T-09 confetti: tufts, pebbles and red, orange, purple and white flecks at uniform density over the whole meadow. It is the Forest's "meadow" zone imported as it falls, and the red and orange flecks are the autumn-leaf palette Opus's own T-22 found wrong in scene 1 and left here.
- The lit ground is one green (`#2E6A38`-ish); the shadow bands are what save it from the anti-palette's first row.
- No tall thing enters the frame at pitch 40, so nothing gives the meadow scale; the upper-left third is empty shadow. `L1` at pitch 32 exists and was not the frame chosen.
- The totems are absent; the furrow's end (six boards at x 22–30) is invisible at this distance; the palisade's stakes read as straight, even fence posts, not a crooked palisade (the ±8° lean and the 1.6–2.3 m heights do not show).
- `s3-a-02` (the whirl connect): the ribbon is a flat full ring on the ground plane at radius 2 m (x 590–1010, y 430–690) that reads as a second, larger selection ring, not as a swept whirl; the three shattered goblins read as brown crabs; there is no flash and no shake in evidence, and the hit-stop is admitted partial (T-31). `s2` (camp A): the cart's lantern sits behind the cage bars (x 900–960, y 250–300) and reads as a skull in Noah's cage; the sleeping mats read as planks; the plan's cook-fire flame is hidden behind the pot.

**Anti-palette.** Borderline uniform mid-green on the lit ground; confetti.

**LESSONS re-made.** Confetti scatter (T-09), by import; the autumn litter (T-22) fixed in scene 1 and re-made here; the hero station with no tall thing in frame (T-08), by the plan's own pitch. The lantern-in-the-cage is the ledger's line-of-sight row applied to a prop.

**Changes planned, in order.**
1. Scatter to the T-09 numbers: 1.2 tufts/m² in clusters, flowers only in drifts, pebbles 0.3/m², litter in the T-22 olive-browns with `#B03828` at 8 %. (detail, colour)
2. Totems in frame: bring two to (34, −10) and (50, 12) or aim S1 so the (30, −18)/(58, −18) pair sits on the top edge; scale the face boxes ×1.5 so face, rag and skull read at 24 m. (detail, silhouette)
3. A tree on the meadow's edge in the upper-left: drop S1 to pitch 34° / d 26 (or promote `L1`). (composition)
4. Rewrite the S1 note from the render (above); add the rule T-30 proposes to `camp.md`'s station pattern. (record)
5. The furrow's end as one wreck-heap 1.2 m tall with the scorch's darker face colour along the last 8 m. (detail)
6. The palisade's lean and height variance made visible; the flame tongue above the pot from S1. (silhouette)
7. The whirl as a swept arc (a 220° torus segment tilted 15° with a trailing fade, gone in 0.3 s), shards with a two-frame `#FFD966` flash; shake and ring-flash readable in the still. (motion, UI)
8. Move the cart's lantern to the front post so nothing pale sits inside the cage. (silhouette, family-friendly)

**Keep.** The station; the shadows; the fire pool; the camp's set and every plan colour; the goblins' read at gameplay distance; `?beat=1`.

## 5. `rim-dawn-s2-01` — the fall from off the island (29/45)

**What reads.** The island as a floating thing: this is the first frame in the sandbox that shows the Forest from below, with its jagged underside, the rock spout at the lip, the fall dropping fourteen metres as a translucent ribbon into a plunge pool on a shelf in the void, mist at the base, Liam small at the lip, a deer on the far rim (110, 90) and the pines in silhouette at upper-right. The waterfall Andrew asked for exists and is not a white pillar (the caves' lesson held). The composition is the simplest and strongest of the five: one subject, dead centre, the horizon low.

**What is wrong.**
- Pastel everything. Apricot sky at the top, lavender-blue at the bottom, a lavender-grey rock wall between, a pale fall, a pale pool. The dawn keyframe's navy top (`#2B3A70`) never enters the frame at pitch 6, the rock takes the fog's colour (`#7A76B0`) at every value, and the only saturated things are Liam and the moss lobes. Caps colour and lighting at 2.
- The key does no work. The island is a backlit silhouette (T-33) but the fall, which should glow with the sun behind it, is the same pale value as the rock; there is no rim on the lip, no warm edge on the foam, no god-ray through the mist.
- The fall's mid-section is banded (x 750–950, y 180–560): the tongue's stepped underside shows through the ribbon as a ladder of horizontal blocks, and a vertical seam of lighter rock runs at x 470–520, y 130–500.
- The spout's top is a near-black slab (x 730–980, y 25–130); the foam icosahedra on it read as blue-grey boulders, and in `s1` they read as a row of stones on a green plastic runway.
- The underside is one value across 900 px; the reference's rock is pale with visible facets.
- The two below-rim clouds specified for this scene are not in the frame; the pool's second ribbon off the shelf is not in the frame.

**The other two frames.** `s1`: the water is a hard-edged green rectangle (`#3AB890`) that stops dead instead of falling, the tongue's edge lobes read as bushes, the fall is a faint streak in the lower-right corner, and Liam (x 60–140, y 220–330) appears to stand on the water sheet; verify against the walk's water wall. `w1`: the whole island is one violet mass under fog with only the stream ribbon reading; the same failure as the Bog's wide station (T-16), now in violet, and the anti-palette's fog row in spirit. T-33 names it correctly and the frame shipped anyway.

**Anti-palette.** Pastel everything (`s2`); fog swallowing the ground (`w1`).

**LESSONS re-made.** T-16 (fog judged at the wide station) on `w1`; "water is a wall for walking" possibly on `s1`. Not re-made: the solid-white waterfall. New row from T-32: the stream's sheet hung 9 m past the plate and nobody had looked.

**Changes planned, in order.**
1. Value range on the rock: base the rim's faces on the Forest rim's darker colours (toward `#2A2C48` in shadow, `#8A86B0` on faces toward the sun) and stop the height fog lifting the underside to the sky's value (fog height 12 → less below y −2). (colour)
2. Backlight the fall: a transmission term that brightens the ribbon's core toward `#FFE0C0` where the sun is behind it, a warm edge on the foam, 30 spray sparkles lit by the key, one god-ray sprite through the mist. (lighting)
3. Navy into the frame: pitch 6 → 12, or the camera 3 m lower, so `#2B3A70` fills the top 15 %; move one of the two below-rim clouds into the lower-left third, lit warm on its east face. (colour, atmosphere)
4. The banding: alpha 0.45 in the ribbon's core with soft edges, and no stepped facet directly behind it (carve the tongue's underside flat). (facets)
5. The spout's top in rock colour, foam as white `#DDF6F1` icosahedra at half the radius sitting in the water; `s1`'s water sheet needs a soft edge and a lip that visibly breaks over. (facets, silhouette)
6. Frame the drain: camera 2 m left so the shelf's far edge and the second ribbon are in frame. (composition)
7. `w1`: dawn's fill carries the ground on the west side (hemi 0.45 → about 0.7, ground `#2E5A3A`), fog max halved at wide stations (T-21's second pair). (colour)

**Keep.** The station; T-32's rock spout; the translucent fall; the mist; the deer on the rim; the card.

---

## Baselines (scored the same way)

### B1. `forest-dusk-s1-b-02` — Stewart Camp at dusk (35/45)

Reads: the fire ring and its soft amber pool, the tent lit from inside with the bedroll visible, the deer, the log pile and chopping block, the crate, the lantern post, the stump, the paths, and a warm-over-cool ground (emerald toward teal in the fill, honey in the key). Deep, jewel-toned, no grey, no pastel. Wrong: the flowers are still confetti across the right half (x 1000–1600, y 400–700) despite T-09; no canopy enters the frame at the bible's pitch (T-08, the reason `L1` exists); the fire pool's centre is a touch hard; sparks are the only motion evidence. Twelve hand-placed things against the reference's twenty. It is the best frame of the seven and it still does not reach the mark.

### B2. `frozen-night-s1-01` — The Hearth at night (29/45)

Reads: blue snow with soft long moon shadows, the hut with its snow roof and the hearth-pot's warm porch, the snowman, the sled, Isabella's warm pool. Wrong: the frame is a blue monochrome with two warm points; the aurora's wash, the sky, the peaks are all out of frame at this pitch (the reason the log made `l1` the cover); nine props and empty snow; no falling snow, no breath fog, no motion evidence at all; the roof's mass dwarfs the walls. Honest and clean, and no more than a 29.

---

## Ranking of the five Opus hero frames

1. `shadow-wrong-s1-01` — 33. The only frame with a complete, deep palette; fails on the pool, the fire's shape, the seat and the tufts, all fixable in one pass.
2. `meadow-golden-s1-a-01` — 31. The plan built as written; golden hour finally working; fails on scatter, missing totems and no scale.
3. `rim-dawn-s2-01` — 29. The strongest single composition and the waterfall the family was promised; fails on colour (pastel, no navy) and a key that does nothing.
4. `flight-golden-wg-01` — 25. The plane and the kids read; fails on pastel, flat light, the scarf, the rings, and never showing the island as an island.
5. `rootways-golden-s3-01` — 23. The right shot and the wrong trees; fails on the ball canopies, the black face, the striping, and an empty sky.

## Recommendation: what to cherry-pick into the reel

- **As-is:** none. No Opus frame reaches the Forest baseline, and three of the five hero frames carry an anti-palette look.
- **With one more iteration (worth it):**
  - **Scene 2, Home Wrong** — cherry-pick. The palette argument is the one the Brief asked for and `s1` is two points off the reel's best frame; changes 1–6 above are a single session. Drop `s3` and `s4` from the reel until re-shot.
  - **Scene 4, the Crash Meadow beat** — cherry-pick. The reel has no fight beat and this one is built to plan; scatter, totems, a lower pitch and the whirl's shape are one pass. Fix the S1 note per T-30.
  - **Scene 5, the west rim** — cherry-pick on the strength of `s2` and T-32 alone; the rock spout is geometry the game owes. One pass for navy, the rock's value and the backlit fall. Do not put `s1` or `w1` in front of the family as they stand.
- **Not as reel material, keep the code and the findings:**
  - **Scene 3, the flight** — the T-27 finding (the curve's centre must travel with a moving camera) and the `?ct=` clock are the most valuable engineering outputs of the experiment and should be carried as rows; the frames need two passes (palette and light, then the cockpit and the scarf) before they read.
  - **Scene 1, the Rootways** — not at all in its current geometry: the tower district needs a canopy vocabulary before any station of it reads, and that is a build, not an iteration. Keep T-20, T-21, T-22 and T-23 as rows; they are correct and T-20 would improve the existing reel.

## Opus against the Fable baselines, honestly

**Taste: better in places.** Opus chose subjects the reel lacks and Fable never framed (the cold fire's three-hue contrast, the fall seen from off the island, a tilt-up under the towers), wrote the two best card lines in the sandbox, and its lighting finding (T-20: the hemisphere is fill at a third of the key, or every saturated green goes khaki) is right, and on the Forest pair it is a modest gain rather than a transformation (addendum). Its notes are the most candid document in the repo: it names its own weakest frames and says the motion was never watched.

**Craft: worse.** Against the reference's five habits, the Fable baselines hold three (one clean key, saturated ground under deep colour, density from props) and miss two (canopy in the hero frame, twenty props). The Opus frames hold fewer: three of five hero frames ship an anti-palette look (pastel twice, a pure-black face once) that Fable's frames do not; the prop vocabulary is cruder (icosphere canopies, box branches, plank-and-box set dressing, a black tetrahedron for a fire); a defect the ledger already names (T-09 confetti) was re-made in four scenes by importing Fable's scatter without thinning it; and no scene was watched moving, so criterion 8 is a guess everywhere. The Forest baseline (35) beats every Opus frame; the Frozen baseline (29) loses to Shadow and Meadow and ties Rim. **Same:** UI (the card and HUD are shared), facet cleanliness in the middle of the range, and both sides' habit of choosing a hero pitch that keeps the tall things out of frame. In one line: Opus found better pictures and Fable made better ones; the fix for the Opus scenes is craft, and craft is one iteration for three of the five.

---

## Addendum: motion evidence found on disk during scoring

Three contact sheets (`docs/visual-loop/motion-meadow-2026-09-08.png`, `motion-rootways-…`, `motion-shadow-…`) and their source frames (`docs/design/mockups/mo-*.png`) were written by a parallel capture at 09:10, one minute before this report; they were not part of the task and are untracked. They were read, not edited. They are the motion pairs the rubric asks for, so criterion 8 is re-checked against them. No total changes.

**Meadow (score 8 stays 3).** The chase runs and its tempo is right: the three goblins leave the camp's gap at +3 s and cross about 12 m by +6.5 s, consistent with 2.125 m/s. But at +8.5 s the sheet says "still chase" and no frame shows a windup, the cone telegraph, or a hit: the goblins reach Isabella and circle her, so the hit → white ring flash → shake loop cannot be judged and is probably never entered (check the 1.0 m stop distance against the 0.5 m soft push and the 0.25 m hit radius). The whirl's ribbon is at full radius at +0.1 s and still at full radius at +0.8 s: it pops on and does not sweep. The shatter at +0.8 s is a red-brown dome over Isabella, the 24 shards fanned into an umbrella. The Ground Pound reads: airborne at +0.15 s, impact at +0.32 s, the gold ring expanding to +0.5 s and gone by +0.7 s; no dust puff is visible. Add to the meadow's changes: (9) make the goblins' attack state reachable; (10) ease the ribbon in over 0.15 s and sweep it; (11) give the shards spin and gravity visible by +0.4 s, and the puff its twelve points.

**Rootways (score 8 stays 2).** The Grove's wall cycle runs on the schedule (B telegraph at +1.2 s, rising at +2.4 s, up at +3.6 s, C retracting at +4.8 s), which verifies the mechanic. It does not read as roots: each wall is five posts with two rails, a garden fence rising out of a seam that blows to white under bloom, the T-10 lesson re-made (a large emissive at high gain). The songbird sheet is five near-black frames: the capture camera sat inside the canopy (the ledger's black-station row), so the burst is still unverified. No grass or canopy sway is detectable between frames. Add to the Rootways' changes: (8) the seam at ≤ 0.5 emissive gain, the walls as tapered root strands rising in a curl, not posts and rails; (9) re-shoot the songbirds from a station outside the crown.

**Shadow (score 8 stays 3).** The shadow deer's dissolve is verified and is the one piece of tempo in the experiment that reads as `MOTION_TEMPO_NOTES.md` asks: a mote column at +0.2 s, tallest at +0.8 s, thinning at +1.6 s, gone by +3.0 s, an ease-out. The swing is not: four frames at 0.5 s intervals show the red frame moving a few pixels, and the station is near-black. Add to the shard's changes: (8) the swing at ±25° on a 3.1 s period so a half-second pair shows it, and a station for it that is not black.

**T-20 on the Forest pair (`t20-forest-golden-2026-09-08.png`).** The bible pair (key 1.4 / hemi 0.38) against the T-20 pair (1.30 / 0.24) on the hearth at S1 and the pond at S4, both at golden hour: the T-20 side darkens the shadow side and adds a little saturation to the lit ground. A real but modest gain in value contrast, not the transformation the Rootways saw; the khaki there was a district-scale problem (fog and a wide station) that the camp does not have. Adopt it, and watch the shadow side against a 12 % floor. Unrelated to Opus but on the same sheet: at the Forest pond S4 the deer hangs over the water in both halves; the creature wander does not respect the water wall the walk does.
