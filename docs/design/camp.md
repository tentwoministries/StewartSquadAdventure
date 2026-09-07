# Stewart Camp — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** BRIEF §0, §2, §4 (§4.1 twice), §5.1–5.2, §5.5, §6, §7.3–7.4, §8 (Phase 1, 2, 4), §11 · ATMOSPHERE_RECIPES §19 first, then §2.4, §5, §7, §9.2, §11.1, §11.5, §12.4, §15.1–15.2, §18 · SYSTEMS_INVENTORY Part 2 §3.1–3.6 (L3069–3235), §8.2–8.3 (L3692–3720), §16.1–16.3 (L5002–5082); Part 1 §25 (L2423–2500) · FAMILY_CANON §1.2 (L90–117), §1.4–1.5 (L131–159), §2.1 (L181–234), §8 (L848–873), §10.1–10.2 (L918–948), §12.1 (L1195–1215), §12.3 (L1236–1279), §13.5 (L1461–1466) · AUDIO_INVENTORY §21 · legacy HTML L693, L1659–1711 (merchant and bounty-board draw), L8315, L9309–9310 (merchant timer), grep-verified · `docs/DECISIONS.md` in full · `docs/qa/phase-0.5-design-review-2026-09-06.md`
**Depends on:** `story-beats.md` §2.1 (B0.1, B1.2, B1.6, B2.1, B2.2, B2.15, B3.2, B3.5), §2.2 (Forest island table), §2.3 (camp milestones, plane states), §2.7 (camp cards), §2.10 (cutscene list), §5 · `world-events-weather.md` §2.1.1, §2.1.3, §2.4.1–2.4.3, §2.5.2, §2.6, §2.7.1–2.7.3, §2.8.2–2.8.3, §5.2 · `heroes.md` §2.0, §2.4.6, §2.5.11, §2.7 (all), §5 · `enemies.md` §2.8, §5
**Feeds:** `npcs.md`, `dungeons.md`, `ui-ux.md`, `cutscenes.md`, `audio.md`, `bosses.md`
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

v27 has no camp: Liam spawns on a bare 5.5 m clearing with a bounty board 3.6 m away and Ed's landing 17 m off. Stewart Camp is a hand-placed diorama at the island's centre that grows in eight stages from a tent beside a wrecked biplane to a lantern-lit cabin, hangar, garden, dock and pets, on ground so dense with small things that nothing is empty, with one fire at its heart that the family sits around, rests by, and, in Home, Wrong, finds burning cold.

---

## 1. What v27 does

### 1.1 There is no camp

ATMOSPHERE_RECIPES §18 states it plainly and the Phase 0 spot-check (`docs/qa/phase-0-spotcheck-2026-09-06.md` item 9) confirmed it by grep: v27 has no campfire, no lantern, no tent, no cabin, no fence, no garden, no dock, no pets (FAMILY_CANON §1.4: the only animal is the escort frog `🐸 Familiar`), no photo mode, and no memory collectibles (§13.5). The word "camp" in every canon string means a **goblin spawner** (`Camp Crusher`, `Camp Raider`, `All siblings found! Destroy the camps!`). Nothing in this file ports a camp; everything in it is new work the Brief asks for (§5.2). What v27 does have is a *place* the player starts, and three objects near it.

### 1.2 What stands at world centre (SYSTEMS_INVENTORY Part 2 §3.1–3.4)

| v27 thing | Where, in px | Where, at 40 px = 1 m | Note |
|---|---|---|---|
| Liam's spawn | `(WW/2, WH/2)` = (1600, 1600) | the origin | `Find and rescue your siblings!` announced; the seven tutorial steps run here (FAMILY_CANON §8) |
| Spawn clearing | trees and rocks rejected within 220 px of centre (§3.2) | a 5.5 m tree-free disc | the only "authored" ground in the overworld |
| Bounty board | `(WW/2 − 120, WH/2 + 80)` (§3.4 step 25) | (−3.0, +2.0): 3.6 m from spawn | the one fixed prop at the start; a post, a plank board, two nailed papers, a pulsing gold `!` when a bounty is claimable, the label `Bounties` (legacy L1689–1711) |
| Ed's landing | `(WW·0.35, WH·0.35)` = (1120, 1120) | (−12, −12): 17 m north-west | Ed crashes here between 90 and 120 s and stands here forever (§8.2; `despawnEd` is never called) |
| Citadel entrance | (1600, 1500) | 2.5 m north of spawn | appears post-game |
| Volcanic rift | (1600, 1700) | 2.5 m south of spawn | appears post-game |
| Portal | (1600, 1120) | 12 m north | after the Goblin King |
| Flavor markers, cages, spawners, mini-bosses | fractions of the map (§3.4 steps 18–21) | 12–56 m away | none within the clearing |

The spawn point is therefore a crossroads of late-game doors and one noticeboard, not a home. The Brief's success line ("the camp glows in golden-hour light, the stream moves, a deer wanders past the tent") describes nothing that exists.

### 1.3 The two objects a kid would recognise (Part 1 §25, legacy L1659–1711)

- **The bounty board** (`drawBountyBoard`, L1689): a `#5D4037` post, a `#4E342E` signboard 36 × 26 px with a `#3E2723` border, two nailed papers in `#d4c5a9` and `#e8dcc8` with `#888` nail dots, a ⚔️ glyph, a gold `#d4a03c` label `Bounties`, and, when a completed bounty is unclaimed, a bold `!` in `#E8A838` at alpha `0.6 + 0.3·sin(4·gt)` with a 6 px glow. Interaction: `SPACE` within 80 px (2 m). Twelve bounties, three rolled at a time (§25.2); `snd('questComplete')` on completion is an undefined sound, so the cue is silent (§29).
- **The merchant** (`drawMerchant`, L1659): a hooded violet figure (`#5b2d8e` / `#7B3CA0` / `#6c3483`) with glowing amber eyes (`#E8A838`, `shadowBlur 4`: one of the nine things that read as a light at night, ATMOSPHERE §2.4), a `#6d4c2a` pack and carpet on the ground, a bobbing 💰, the label `Merchant`, and `[SPACE] Trade` within 80 px. He appears once `teamLv ≥ 3` anywhere in `rnd(500, WW−500)` with `A mysterious merchant has appeared!`, then **relocates every 30–60 s by up to ±400 px** (L9310). Four of eight stock items; `Merchant sold out!` when empty; the Shield Potion does nothing (§29).

### 1.4 The title screen (Part 2 §16.2, FAMILY_CANON §12.1)

A DOM overlay: `⚔️ The Stewart Squad Adventure`, the version label, `The world has stories to tell.`, four hero showcase cards (`Liam` / `Tank`, `Noah` / `DPS`, `Collette` / `Mage`, `Isabella` / `AoE`), thirty feature chips, three difficulty buttons, save slots, multiplayer controls, `START ADVENTURE`, and one random `TIPS[]` line in `#titleTip`. No world is drawn behind it. `story-beats.md` B0.1 replaces the backdrop with the camp at stage C6 at golden hour with the plane crossing the Ridge; §2.12 below specifies that camera.

### 1.5 Oddities that change this design

| Oddity | Consequence |
|---|---|
| "Camp" is the horde's word in canon (§1.1) | The family hub is always `Stewart Camp` or "the hearth" in UI copy and code identifiers (`hearth.*`, `camp.stage` kept from `story-beats.md` as the one exception); bounty and achievement strings are untouched. P2 name-collision hazard recorded for `ui-ux.md`. |
| The bounty board is 3.6 m from spawn (§1.2) | Kept as the spirit of the thing: the board stands 6.7 m from the fire from C2, the first "civic" object at camp, and it keeps its papers, nails and pulsing `!`. |
| Ed's landing is 17 m from spawn and he never moves | `story-beats.md` fixes Ed's Landing east of camp and Ed wherever the plane is; the camp gives him a stump, a wreck, a hangar and a bench. |
| The merchant teleports every 30–60 s | At camp he does not: he has a stall and stands at it. His arrival and departure are `npcs.md`'s; the wandering is cut here (§6). |
| No campfire, lantern, or emissive prop lights anything (ATMOSPHERE §2.4) | The camp is the first place in the game where light is real: one pooled campfire, three pooled lanterns, and emissive windows and tent canvas on `world-events-weather.md`'s schedule. |
| Three story flags leak across restarts (Part 2 §21 #7) | `camp.stage` and every `camp.*` field reset on new game and NG+ (`story-beats.md` §2.6 rule). |

---

## 2. What it becomes

### 2.0 Conventions

- **Axes and scale.** Island-local metres, origin at the fire, `+x` east, `+z` south, `+y` up (`story-beats.md` §2.2). North is `−z`. Bearings are compass degrees clockwise from north: 0° north, 90° east, 180° south, 270° west. 40 px = 1 m (`heroes.md` §2.5.1). Every `world-events-weather.md` value is read as-is (its reconciliation to 40 px = 1 m landed 2026-09-06); its one axis sentence ("north is +Z") is read in this frame as north = `−z` (§5.3).
- **Camera.** Elevated orbit, pitch 45–55°, vertical FOV **35°**, 19–20 m from the target: Liam's 1.52 m is one-eighth of frame height at 20 m (frame height there is 12.6 m). At pitch 48° the top edge of the frame looks 30.5° below horizontal, so a gameplay frame contains ground only; sky and the clouds below the rim appear only when the camera is within about 24 m of a rim (§2.11.5). Every "read at distance" note is judged at this camera.
- **Tokens.** Brief §4.2 Forest hexes are the roots; new names are `camp.*` and `forest.*` and become `src/style/` constants in Phase 1.

| Token | Hex | Used for |
|---|---|---|
| `forest.emerald` | `#0F5132` | canopy shadow side, ground under trees (Brief) |
| `forest.moss` | `#3A7D44` | meadow ground, grass base (Brief) |
| `forest.pineShadow` | `#123524` | deepest ground shadow colour, never black (Brief) |
| `forest.honey` | `#B8863B` | every cut wood face: logs, planks, rails, the cabin walls (Brief "honey wood") |
| `forest.stream` | `#2EB8A6` | water tint (Brief) |
| `forest.golden` | `#FFD08A` | golden-hour key; also `forest.window` emissive (world-events) |
| `camp.tealSlate` | `#2B5F6B` | the family's cool colour: tent canvas, cabin roof, shutters, the check pattern |
| `camp.tealSlate.lit` | `#3A7A86` | sun-faded ridge lines, roof ridge highlights, the tent patch |
| `camp.cream` | `#EDE3CF` | bedroll blanket, bunting, pegs, papers (the Desert's bone hex reused; small areas only) |
| `camp.bark` | `#5A3A1E` | bark, posts, the board frame, tent poles |
| `camp.earth` | `#6B4A2A` | packed earth under the fire, garden soil, the furrow |
| `camp.pathDust` | `#8A6A3E` | worn paths |
| `camp.stone` | `#6F7D86` | fire-ring stones, pebbles (cool) |
| `camp.stone.warm` | `#8C7B66` | pebbles (warm), the hearth apron |
| `camp.canvasOld` | `#7A6A4E` | the crash tarp, the scarecrow's shirt |
| `camp.rope` | `#C2A878` | rope, guy lines, basket weave |
| `camp.iron` | `#3E4247` | lantern frames, hinges, the kettle, the hatchet head |
| `forest.grass.a` / `.b` / `.tip` | `#3A7D44` / `#2F6B3A` / `#4F9A4A` | grass tuft vertex colours (base, base variant, tip) |
| `forest.flower.*` | `#D86050` `#E8A838` `#D06888` `#9088CC` `#D07090` `#F0D898` | the six v27 forest flower colours, verbatim (SYSTEMS_INVENTORY Part 2 §3.2) |
| `forest.mushroom` / `.stalk` / `.glow` | `#B06020` / `#D9CDB3` / `#6CE87A` | caps, stalks, glow caps (world-events §2.1.3) |
| `forest.leaf.*` | `#B03828` `#D87828` `#E8A838` `#38A866` | fallen leaves, the four v27 autumn colours (ATMOSPHERE §5) |
| `camp.check` | cream + tealSlate + one honey stripe | the family pattern: bedrolls, curtains, bunting, the picnic blanket, the fox's bed |
| `light.campfire` | `#FF9A3C` · 2.5 · 9 m · ±12 % at 7–9 Hz | world-events §2.8.2; the shared-oscillator rule |
| `forest.lantern` | `#FFB347` · 1.2 · 6 m | world-events §2.1.3, the three pooled camp lanterns |
| `forest.window` | `#FFD08A` emissive 1.6, bloom | cabin windows, the lit tent canvas, the bench lamp |
| `shadow.mirrorFire` | `#3AF0FF` · 1.6 · 7 m | the cold fire in Home, Wrong (`dungeons.md` owns the token; §2.7.6 the prop) |

Anti-palette check: teal-slate sits at 29 % lightness, cream never exceeds 5 % of any frame, grass saturation floors at 35 %, the greyest object is a pebble at 14 % saturation on saturated moss, smoke is tinted by the keyframe's hemisphere sky so it is never grey on grey, and the darkest ground colour is `forest.pineShadow`.

- **Stages.** `camp.stage` 0–7 is set by the flags in `story-beats.md` §2.3; this file never sets a flag. A stage is a **prop manifest**: everything from the previous stage plus the additions below, minus the explicit removals in §2.6.
- **The camp radius.** `camp.radius` = 35 m from the fire: the title card, the build-in trigger, the pet leash, and the enemy exclusion (`enemies.md` §5: no nest or camp within 30 m; the 40 m leash keeps strays out) all read it.

### 2.1 The stage table

| Stage | Flag (`story-beats.md` §2.3) | New props (positions in §2.2–2.3) | Lights | What a kid notices |
|---|---|---|---|---|
| **C0** | new game; seen only in CS-01 | the wreck nose-down at the furrow's west end, the tarp over the engine, a 5-stone ember ring, the furrow and 15 pieces of debris, black engine smoke | embers emissive only; the fire S1 `light.campfire` at 1.2 · 5 m | the plane in the dirt, still smoking |
| **C1** | CS-01 ends | the tent with one bedroll and a lantern inside, fire S2 (12 stones, 3 logs), Liam's log, Ed's stump, the lantern post, the wreck lantern, the lean-to under the wing with two crates, the fruit basket, kettle, bucket, woodpile and hatchet, rope coil, suitcase, worn paths; title card `Stewart Camp` / `Tent, fire, one bedroll. For now.` | campfire (pool); lanterns L1–L3 (pool by distance, `forest.lantern`); the tent glowing from inside (emissive `forest.window`) | the tent glows; the fire; the plane's nose in the ground |
| **C2** | `squad_assembled` | Noah's log, the girls' log, four bedrolls, the bounty board Ed nails up, the merchant's stall spot (cart present while he is), the east gate posts and 8 m of fence each side, the washing line with four small garments, the firefly jar; card → `Stewart Camp` / `Tent, fire, four bedrolls. Home.` | + the merchant's violet lantern while he is present (`light.event`); fireflies in the jar (emissive) | four bedrolls; their clothes on the line; the board's `!` |
| **C3** | `forestCampsCleared` | three raised garden beds with seedlings and four painted stones, the watering can, the scarecrow with spare goggles, the fence complete with the north-west gate, the footbridge, the rod holder at the pool, glow mushrooms 6 → 12; the deer returns to the pond and the camp meadow, the owl to the big pine, the fox begins to visit at night | + 6 glow caps (emissive) | the deer inside the fence; a fox at the edge of the firelight |
| **C4** | `goblinKingDefeated` | Ed's hangar over the wreck, the plane patched inside it (`npcs.md` `hopping`), the strip cleared and marked, the windsock, the cot and toolbox, the broken propeller on the wall, the loft, the scrap pile, whittling shavings at the stump; fire S3 | lantern L3 moves from the wreck strut to the hangar door | a wooden propeller; the windsock; a runway |
| **C5** | `edQuestComplete` | the cabin (teal-slate roof, chimney, three windows, porch, bench, curtains), the porch shelf (memory shelf), Ed's workshop bench and lamp in the hangar, the coop with three hens, the `Stewart Camp` sign at the east gate, shingles on the hangar | + cabin windows emissive (`forest.window`, 0.60 → 0.06); chimney smoke; the porch lantern L4 (emissive unless pooled) | the roof; smoke from a chimney; hens |
| **C6** | all four island dungeons cleared | twelve lanterns on posts and hooks, the crest banner on its pole, bunting, the rope swing, fire S4 with the hearth apron and tripod, the garden at full growth. **This is the set Home, Wrong mirrors (§2.8).** | 3 nearest lanterns pooled, 9 emissive; the fire at its biggest | the crest; the whole camp lit at night |
| **C7** | `shadowQueenDefeated` (CS-10 shows it) | the dock with the rod, the pets home (the fox's bed by the woodpile, Sugar in the yard, hens free-range), the picnic blanket, the hammock, five photo-spot stones; the crater's glow gone warm (`story-beats.md`) | dock lantern hook (lantern #13, emissive) | the fox asleep by the fire in daylight; a slime in the yard |

### 2.2 The C1 prop list (the pilot camp)

Positions are `(x, z)` in metres from the fire; `y` is the local ground unless stated. "Facing" is the bearing of the prop's front. Source per Brief §4.6 order: no custom Blender pipeline exists (Rule 1 ask not assumed) and every candidate here is simple enough that **procedural code geometry** is the right first source; the two GLB candidates are marked. Tris are High-preset approximations. Every prop lists its motion sources (ATMOSPHERE §19.3: two or more, incommensurate) and its light.

| # | Prop | Position (x, z) | Size (m) | Facing | Source · tris | Colours | Motion sources | Light | Read at distance |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Fire ring S2 | (0, 0) | 12 stones on a 1.2 m circle, stones 0.22–0.30; packed-earth disc r 1.6; 3 split logs in a star, 0.6 long | — | procedural · 288 + 120 | `camp.stone` / `.warm` alternating, ±6 % value; logs `camp.bark` / `forest.honey`; earth `camp.earth` | flame (3 tongues, §2.7.1), embers 0.3/s rising 2 m, smoke column 4 m, kettle steam | `light.campfire` pooled | a warm point with a smoke column: the camp's one always-on light |
| 2 | Liam's log | (−1.85, 0.4), axis N–S | half-log 1.1 × ⌀0.36, seat height 0.35 | seat faces 90° (the fire, the wreck, the way in) | procedural · 60 | bark `camp.bark`, cut face `forest.honey` | none (a seat; the sitter moves) | — | a pale cut face beside the fire |
| 3 | Ed's stump | (1.9, −0.5) | ⌀0.5 × 0.45, ring lines on top | seat faces 260° | procedural · 80 | `camp.bark` / `forest.honey` | none | — | a round stump on the plane side |
| 4 | The tent | (−6.0, −3.0), ridge NW–SE | 2.6 long × 2.2 wide × 1.9 ridge; two poles; 6 guy lines to 6 pegs; door at the SE end (−5.1, −2.1) tied back | 135° | procedural · 140 (+24 cloth) | canvas `camp.tealSlate`, ridge `camp.tealSlate.lit`, a 0.4 m patch in `.lit` on the NE face, poles `camp.bark`, guys `camp.rope` | door flap (1-bone cloth, 0.8 rad/s, ±4°), a ribbon on the front guy line (0.5 m, 6-frequency scarf recipe at 30 %), canvas ripple (vertex sway ±0.01 m, 1.3 rad/s) | canvas emissive `forest.window` × a baked falloff from the inside lantern (0.9 at the ridge, 0 at the hem), on the window schedule 0.60 → 0.06 | a teal triangle that glows amber at night |
| 5 | Bedroll | inside the tent, (−6.3, −3.3) | 0.7 × 1.9 × 0.12, a folded blanket, a cream pillow | — | procedural · 60 | `camp.check` | none | — | a stripe of pattern through the door |
| 6 | Lantern L2 (tent) | (−5.6, −2.6) at 1.45 m, from the ridge pole | 0.32 × 0.20 iron frame, 4 glass panes, a 0.12 m chain | — | procedural · 90 | `camp.iron`, glass `#FFB347` emissive | chain swing 0.6 rad/s ±3°, flame flicker (the torch oscillator, world-events §2.8.3) | `forest.lantern` when among the 3 nearest, else emissive | the source of the tent's glow |
| 7 | Lantern post L1 | (3.0, 2.2) | post 2.1 × ⌀0.12, an iron hook arm 0.35 at 2.0 m; the lantern as #6 | — | procedural · 40 + 90 | `camp.bark`, `camp.iron` | lantern swing, flicker, 2 moth billboards orbiting at night | `forest.lantern` | a lantern at the path junction |
| 8 | The wreck (The Green Meanie, `wrecked`) | nose at (11.5, 0.4), tail at (17.6, −0.4) | assumed ≤ 6.5 long, 8.0 span, 2.6 tall (§5.3 asks `npcs.md` to confirm); nose 0.6 m into a 1.6 m dirt mound; lower-left wing snapped, tip on the ground at (13.0, 4.2); no propeller; tail up 0.4 on the skid | 262° | `npcs.md` mesh (GLB or procedural) · ≤ 3,500; the mound, mesh damage and dirt are this file's | livery per `npcs.md`; mound `camp.earth` | a loose fabric strip on the broken wing (cloth), a dangling wire (1-bone, 1.1 rad/s), engine smoke wisps 0.1/s (C0: 1.0/s) | — | a biplane on its nose beside the tent |
| 9 | Lantern L3 (wreck) | (15.2, −1.6) on the rear strut at 1.8 m | as #6 | — | procedural · 90 | as #6 | swing, flicker | `forest.lantern` | the plane marked at night |
| 10 | The furrow | ruts from (70, ±0.9) to (13.5, ±0.9) | two 0.35 m rut decals; 5 scorch ovals 3–4 m at x ≈ 20, 27, 33, 42, 55 (±2); grass scale 0.4 in the 12 m strip | — | decals · 0 | ruts `camp.earth` 55 % → 20 % eastward; scorch `#2A2418` 35 % | none | — | a scorched double line pointing at the wreck |
| 11 | Debris ×15 | along x 14–34, z ±5 | 4 wing ribs, 3 fabric scraps, a wheel at (26, 2.5), a strut, 2 crate boards, the tail-skid shoe, 3 metal bits | random | procedural · 15 × 30 | `#8B4513` `#654321` `#a0522d` (ATMOSPHERE §11.5 debris colours) plus the livery | fabric scraps flutter (cloth) | — | a trail of brown pieces along the furrow |
| 12 | The lean-to | the tarp from the wing's rear spar (12.8, −2.9) to poles at (12.6, −5.6) and (15.4, −5.8) | 4 × 3 canvas, 2 poles 1.8, 4 pegs | open to 180° | procedural · 60 + 24 | `camp.canvasOld`, `camp.rope` | tarp ripple (vertex sway), a loose corner flaps (1-bone) | — | a brown wing of cloth off the plane |
| 13 | Crate A | (13.5, −4.6) under the lean-to | 0.7 × 0.7 × 0.6, lid on | — | procedural · 60 | ATMOSPHERE §12.4: body `#8B4513`, bands `#7a3b10`, straps `#D4944A`, a 0.14 m gold `E` at 40 % (emissive 0.2) | none | — | the supply crate every kid knows |
| 14 | Crate B (Ed's table) | (2.9, −1.4) | as #13, lid off and leaning; on it a tin, a cup, a folded map | — | procedural · 60 + 30 | as #13 | none | — | a crate used as a table |
| 15 | Fruit basket | (−4.3, −1.0) by the tent door | ⌀0.45 woven, 7 fruit: 4 apples `#B03828`, 3 pears `#B7A83A` | — | procedural · 120 + 168 | `camp.rope` weave | none (the fox steals from it, §2.9) | — | the reference's fruit basket, by the door |
| 16 | Kettle | (0.62, −0.58) on the NE hearth stone | 0.24, a spout, a wire handle | — | procedural · 80 | `camp.iron` | steam wisp 0.05/s while the fire is S2+ | — | a kettle on the fire |
| 17 | Bucket | (−1.2, 4.6) at the stream path's start | 0.32 × 0.30, staves and two bands, water inside | — | procedural · 70 | `camp.bark`, `camp.iron`, water `forest.stream` | the water surface tilts 0.5 rad/s ±2° | — | — |
| 18 | Woodpile and hatchet | pile (−3.4, 1.6); block (−4.2, 2.3) | 8 split logs stacked 1.0 × 0.5 × 0.45; block ⌀0.4 × 0.4 with the hatchet in it | — | procedural · 160 + 90 | `camp.bark` / `forest.honey`; hatchet `camp.iron` / `forest.honey` | none | — | pale cut faces in a stack |
| 19 | Rope coil | (13.4, 2.6) on the lower wing | ⌀0.4 | — | procedural · 60 | `camp.rope` | none | — | — |
| 20 | Suitcase | (11.2, −3.8) | 0.6 × 0.4 × 0.2, a strap | — | procedural · 40 | `camp.bark`, strap `camp.rope` | none | — | the family's crash luggage |
| 21 | Boulders | (−9.2, 3.0) 1.3 m; (−8.4, 4.1) 0.8 m | low-poly, 12 facets, moss on the north faces | — | procedural · 2 × 60 | `camp.stone`, moss `forest.moss` | none | — | two grey lumps with green caps |
| 22 | Fallen log | (7.5, 6.2), bearing 70° | 3.2 × ⌀0.5, moss, 3 mushrooms; sittable | — | procedural · 90 | `camp.bark`, moss | none | — | a log with mushrooms, south-east of the fire |
| 23 | Old stump | (−10.0, −1.0) | ⌀0.7 × 0.5 | — | procedural · 60 | `camp.bark` / `forest.honey` | none | — | — |
| 24 | Camp pines P1–P5 | P1 "the big pine" (−12.5, −8.5) 11 m; P2 (3.5, −13.5) 8.5 m; P3 (−14, −13) 7 m; P4 (20, 10) 9 m; P5 (24, −9) 8 m | cone stacks: 4 stacked 6-sided cones on a 6-sided trunk | — | procedural, instanced with the island pines · 300 each | canopy `forest.emerald` → `forest.moss` by height, ±4° hue per tree; trunk `camp.bark` | sway (world-events' sway uniform), the owl from C3 | — | the tallest silhouettes around the camp; P1 carries the swing at C6 |
| 25 | Birches B1, B2 | B1 (−11, 9) 6 m; B2 (6, −8) 5.5 m | white trunk, 3 icosphere canopy blobs | — | procedural · 250 each | trunk `camp.cream` with `camp.bark` bands; canopy `forest.moss` / `#38A866` | sway ×1.4 (lighter tree), leaf fall `pt.leaf` under them | — | a white trunk among dark ones |
| 26 | Glow mushrooms ×6 | (−9, 13.2), (−7.5, 12.9), (−3.5, 13.0), (−1.8, 13.4), (−10.5, 14.0), (−12, 15.5) | 0.12–0.2 tall | — | scatter mushroom mesh, glow variant · 14 | cap `forest.mushroom.glow` emissive 0.8 (world-events 0.62 → 0.06) | none | emissive, bloom | six green points on the bank at night |
| 27 | Worn paths | fire → wreck (0, 0) → (11, 0.3); fire → tent door; fire → pool via (−1.2, 5.0) → (−4.5, 12.5) | decals 0.9 m wide | — | decals · 0 | `camp.pathDust` 45 % | none | — | the grass parts where feet go |
| 28 | The stream (camp reach) and the pool | §2.3.2 | 3–5 m wide; pool 8 × 6 at (−6, 15) | — | water shader · 3,000 | `forest.stream` | flow, waves, foam, sparkle (§2.11.7) | — | turquoise with white edges |
| 29 | The deer | the pond → past the tent → the pool loop (§2.11.6) | 1.3 tall at the shoulder | — | GLB (Kenney animal pack, CC0; Rule 2 gate) or procedural · ≤ 400 | `#8A6A44` with a cream belly and a white tail flag | walk, graze, ear flick (3 clips) | — | an antler fork past the tent |
| 30 | Liam | pose 1 at (−2.4, 1.0) facing 150°; pose 2 walking from (−2.5, 7.5) toward (−5.5, 12.4) | `heroes.md` §2.7 | — | procedural rig · ≈ 700 | `hero.liam.*` | breath, blink, cape, the idle ladder | the selection ring; its light at night | — |

C1 totals: about 9,200 tris of authored props (the plane excluded), one static merged batch per material (wood, stone, cloth, iron, emissive), decals in one call, and the scatter of §2.4 on top. The C1 footprint is 30 × 30 m centred on (1, 1): `x` −14 to 16, `z` −14 to 16; the wreck's tail crosses the east edge as the reference diorama's props cross its base.

### 2.3 The place

#### 2.3.1 Terrain around the fire

| Zone | Height and shape |
|---|---|
| The camp plate | `y = 0` within 22 m of the fire, ±0.12 m of 8 m-wavelength noise; a flat packed-earth disc r 3.2 m at the fire |
| The stream cut | banks slope 1.2 m down over 2.0 m each side; the bed 0.7 m below the bank; water surface at −0.35 m; the pool 1.0 m deep |
| North | rises 1.5 m over 20 m into the pine stand at `z` −14 to −20; the Ridge (`story-beats.md`) is the horizon at `z` −125 |
| The strip | flat `y = 0`, `x` 10–70, `z` ±6; 45 × 45 m Crash Meadow flat around (60, 0) |
| The pond | basin at (−40, −30), r 9 m, 0.9 m deep, a reed fringe |
| Vertex colours | `forest.moss` meadow; `forest.emerald` within 3 m of trunks and on the stream cut's north-facing slope; `camp.earth` on the fire disc and the garden beds; a 0.6 m lerp into `camp.pathDust` either side of each path; the strip a 6 % lighter moss from C4 |

Terrain mesh: a 1 m grid within 40 m of the fire, 4 m beyond, vertex-coloured from the v27 biome scoring (ATMOSPHERE §7.2 formulas, `world-builder`), the curved-world chunk on, `flatShading: true`.

#### 2.3.2 The stream's course, the pool, the rocks

The stream enters from the north-east hills and leaves at the west-rim waterfall (`story-beats.md` §2.2). Control points (island-local metres, width in metres) with a Catmull-Rom spline through them; the flow-map UVs advance along the spline at 0.6 m/s (0.9 m/s over the rocks, 0.3 m/s across the pool):

`(150, −60) w3 → (120, −24) w3.5 → (96, 16) w4 → (74, 29) w4 → (48, 24) w4 → (24, 17) w4 → (8, 14.5) w4.5 → (−6, 15) the pool, 8 × 6 → (−18, 19) w4 → (−40, 31) w4.5 → (−70, 62) w5 → (−110, 90) w5 → (−150, 110) the waterfall`

Checks against the fixed landmarks: 1.5–6.5 m south of Crash Meadow's south edge (the Goblin King's arena is bounded by water on one side), never on the strip (`z` ≥ 14.5 for `x` ≤ 24), 8 m from Collette's hideout at (−60, 60) and 8 m from goblin camp B's ring at (−80, 80): "on its bend" and "beside the stream bend" both hold. At the fire the water is 14 m south: the walk to the stream is a 14 m walk, the pilot's second scored pose.

Rocks in the camp reach (foam wakes, sittable): (14, 15.5), (3, 13.2), (−4, 17.5) in the pool, (−9, 13.4), (−15, 18.3), (−24, 21). The stream is the camp's **south boundary**: the fence ends at its banks and the footbridge (C3) crosses it at (−12, 17).

#### 2.3.3 The master plan, C2–C7

Props added after C1, with positions. Facing is the bearing of the front. Motion sources and lights follow the same rule as §2.2.

| # | Prop | Stage | Position (x, z) | Size and construction | Facing | Tris | Colours | Motion sources | Light | Read at distance |
|---|---|---|---|---|---|---|---|---|---|---|
| 31 | Noah's log | C2 | (−0.6, −1.8), axis E–W | half-log 1.1 × ⌀0.36 | seat faces 180° (over the fire to the stream) | 60 | as #2 | — | — | — |
| 32 | The girls' log | C2 | centred (0.75, 1.75), axis bearing 110° | one half-log 2.1 × ⌀0.36 with two seat spots: Collette (1.22, 1.58), Isabella (0.28, 1.92), 1.03 m apart | seats face 300° | 90 | as #2 | — | — | the long log; two kids sit on it |
| 33 | Bedrolls ×3 more | C2 | one more in the tent (−5.7, −2.7); two under the lean-to at (13.2, −4.0) and (14.4, −4.3) | as #5; whose is whose is never stated | — | 3 × 60 | `camp.check` | — | — | four rolls of the same pattern |
| 34 | The bounty board | C2 | (4.8, −4.6) | post 2.2 × ⌀0.14; board 1.2 × 0.9 from 1.0 to 1.9 m; a plank roof cap; 5 nailed papers; ⚔️ carved at the top centre; the `!` billboard 0.25 m above the cap | 200° | 140 | frame `camp.bark`, planks `forest.honey`, cap `camp.tealSlate`, papers `#d4c5a9` and `#e8dcc8`, nails `#888` (all legacy L1689+), `!` `#E8A838` | papers flutter (2 loose corners, cloth), the `!` alpha `0.6 + 0.3·sin(4t)` with a bloom halo (v27 verbatim) | — | a noticeboard with a gold `!` |
| 35 | The merchant's stall | C2, while he is present | cart centred (9.5, −7.5) | a two-wheel cart 2.0 × 1.1, bed at 1.0 m; awning on two poles to 2.3 m; 4 bottles, a rolled carpet, a chest; a violet glass lantern at the awning's front corner; a hitching stone and wheel ruts remain when he is away | 180° | 320 | cart `camp.bark` / `forest.honey`; awning `#4A2560` with `camp.cream` stripes; carpet `#6d4c2a` (v27 pack colour); bottles `#7B3CA0` glass | awning fringe (cloth), bottles swing (1-bone each, 3 rates), the lantern swing | the violet lantern `light.event` `#7B3CA0` 1.0 · 4 m while he is present (his beam is world-events' `merchantArrival`) | a plum awning and a violet light at the camp's north-east corner |
| 36 | The east gate | C2 (posts and 8 m of rail); C5 (the sign) | posts at (26.5, −6.5) and (26.5, 6.5), 2.6 m tall; crossbar at 3.8 m spanning the strip gap (the plane passes under it) | — | 120 | `camp.bark`, `forest.honey` | the sign (C5) | lantern hooks (C6) | two tall posts with a bar: the way in |
| 37 | The fence | C2 (east runs, 8 m each side of the gate); C3 (complete) | posts every 2.5 m, 1.1 m tall, two rails; along `x` = ±28 from `z` = −22 to the stream banks, and `z` = −22 from `x` = −28 to 28; the north-west gate at (−22, −22), 1.2 m, hinged | — | instanced: post 12, rail 8 | `camp.bark` posts, `forest.honey` rails | the NW gate swings ±3° in wind and latches; a songbird lands on a post every 20–40 s | — | a low honey line around the camp |
| 38 | The washing line | C2 | from the tent's rear pole (−7.4, −4.1) to a post at (−11.5, −6.0), 1.7 m high, 4.1 m long, sagging 0.15 m | four garments 0.35 × 0.5 with sleeves; the fourth is a cape 0.6 m long; cream pegs | — | 4 × 24 cloth + 20 | sapphire `hero.liam.base`, fox orange `hero.noah.base`, amethyst `hero.collette.base`, ruby `hero.isabella.base` (their own clothes; the hue-reservation rule is for enemies and NPCs) | four 1-bone cloths at four rates (0.7, 0.9, 1.1, 0.8 rad/s), the line bounces | — | four colours in a row: the family, even when they are away |
| 39 | The firefly jar | C2 | on crate B (2.9, −1.4) | a 0.18 m jar, lid off, 3 fireflies | — | 30 | glass `#DDF6F1` 30 %; fireflies `pt.firefly` | the three blink by shrinking (world-events); by day the jar is empty | emissive, bloom | a small light on the table at night |
| 40 | The garden | C3 (sprouts); C5 (0.3 m plants); C6 (0.5 m with fruit) | three raised beds 2.4 × 1.2 × 0.35 at (−16.5, −4.5), (−14.0, −4.5), (−11.5, −4.5), axes N–S; a woven border 0.3 m; the watering can at (−12.2, −2.6) | 6 seedlings per bed (3 variants, instanced); four painted stones 0.18 m at the beds' south ends at `x` −17, −15, −13, −11: `L`, `N`, `C`, `I` **[new text]** painted in each kid's `base` | — | beds 3 × 60, plants 18 × 20, stones 4 × 14, can 60 | sides `forest.honey`, soil `camp.earth`, plants `forest.moss` / `#38A866`, fruit `#B03828` and `#E8A838` | plants sway ×0.5, 6 butterflies over the beds by day (`pt`-style quads) | — | three brown rectangles with green rows |
| 41 | The scarecrow | C3 | (−14, −7.0) | cross-pole 1.8 m, a shirt, a straw head, a spare pair of aviator goggles (`npcs.md`'s goggle prop) | 160° | 120 | `camp.canvasOld`, straw `#C9A96A`, goggles `#7A4018` | sleeves flap (2 cloths), a songbird lands on it | — | a figure in the garden with goggles |
| 42 | The footbridge | C3 | over the stream at (−12, 17), span 5 m along bearing 175° | plank deck 1.2 wide, two rope handrails on 4 posts | — | 160 | `forest.honey`, `camp.rope`, `camp.bark` | the two ropes sway (1-bone each) | a lantern hook each end (C6) | planks over turquoise |
| 43 | The rod holder | C3 (bank); C7 (dock) | a forked stick at (−7.5, 12.6); the rod 2.0 m leaning in it | Ed's rod: cane `forest.honey`, a red-and-cream bobber (world-events §2.7.2) | — | 40 | — | the line's bobber swings | — | a stick with a red dot at the pool |
| 44 | The hangar | C4 (timber frame, canvas roof); C5 (shingled) | footprint `x` 8.5–19.5 × `z` −4.75–4.75, centred (14, 0); walls 3.2 m; ridge E–W at 5.0 m; open east front 9 m wide, 3.6 m clear; a 0.9 m back door at (8.5, 2.5) | plank walls with battens; roof canvas (the C0 tarp plus new teal canvas) at C4, teal-slate shingles at C5; inside: the plane (`npcs.md` `hopping` then better), the cot (9.5, −3.8) 1.9 × 0.7, the toolbox (9.8, 3.5), the broken propeller leaning at (12, −4.5), a barrel (18, −4.2), a plank loft 2.4 × 3.0 at 2.6 m over the back-left corner with two blanket rolls, a hanging chain from the ridge; the windsock on a 4 m pole at (20.5, 5.5) | 90° | 900 + interior 300 | walls `forest.honey` / `camp.bark`; roof `camp.tealSlate`; windsock `camp.cream` and `camp.tealSlate` stripes | the windsock (cloth, wind-driven, 1.2 m), the chain (1-bone, 0.9 rad/s), the roof canvas ripples (C4 only), the bench lamp flicker (C5) | lantern L3 on the front post at (19.6, −4.6), 2.4 m, `forest.lantern`; the bench lamp emissive `forest.window` (C5) | the biggest honey-wood shape, open toward the runway, a windsock beside it |
| 45 | The strip, cleared | C4 | `x` 15–70, `z` ±6 | the furrow decals fade; a mown-strip vertex tint; 8 marker stones painted cream along each edge every 15 m; two flags at the east end; the scrap pile at (20, −6) (the 15 debris pieces stacked) | — | stones 16 × 14, flags 2 × 30 | `camp.cream`, `camp.stone` | the two flags (cloth) | — | a pale strip with white dots: a runway a kid can name |
| 46 | Shavings | C4 | at Ed's stump | a 0.6 m decal plus 12 curl props | — | 12 × 8 | `forest.honey` | — | — | Ed whittled here |
| 47 | The cabin | C5 | footprint 7.2 × 5.4 centred (−8.0, −11.5): walls `x` −11.6 to −4.4, `z` −14.2 to −8.8 | a stone base course 0.3 m; 8 log courses (⌀0.32) to 2.6 m; the door 0.9 × 2.0 on the south face at `x` −5.4; two south windows 0.8 × 0.9 at `x` −7.6 and −10.2, one east window at (−4.4, −11.5), each 4-pane with shutters; the porch 1.5 m deep along the south face at 0.35 m with one step, 3 posts, a railing, a bench at its west end; the porch shelf on the wall east of the door (§2.10); the chimney 0.8 × 0.8 on the west wall at (−11.9, −11.5) to 5.4 m; roof pitch 40°, ridge E–W at 4.7 m, eaves 0.5 m at 2.6 m; a birdhouse under the east eave; curtains inside each window | 180° | 1,400 | logs `forest.honey` with `camp.bark` ends; base `camp.stone`; roof `camp.tealSlate` shingles with per-row ±5 % value bands, ridge cap `forest.honey`; shutters `camp.tealSlate.lit`; door `forest.honey` with `camp.iron` hinges; curtains `camp.check` | chimney smoke (a 5 m billboard column, `p` 0.55 → 0.10 and whenever it rains by day), curtains (1-bone cloth behind the glass), the birdhouse's bird (lands every 20–40 s), the porch lantern swing | windows emissive `forest.window` 1.6 on the bloom layer, 0.60 → 0.06 (world-events §2.1.3); the porch lantern L4 at the step post (−5.0, −7.2), 2.2 m | the reference's cabin: a teal roof, a chimney, three warm windows |
| 48 | The coop | C5 | (−20, −12) | 1.6 × 1.2 × 1.4 with a ramp and a roost; a run 3 × 3 with 0.6 m posts and rails (no wire mesh; it is a diorama) | 120° | 200 | `forest.honey`, roof `camp.tealSlate` | the coop door swings; hens (§2.9) | a lantern hook (C6) | a small house with white specks around it |
| 49 | The sign | C5 | hung from the east gate's crossbar at (26.5, 0), 3.8 m, on two chains | a plank 1.4 × 0.4: `Stewart Camp` (the camp's name, `story-beats.md` §2.7) carved and painted | 90° (readable from the strip) | 40 | `forest.honey`, letters `camp.tealSlate` | swings ±2° and creaks every 6–11 s (`camp.sign.creak`) | — | a plank over the way in |
| 50 | Lanterns ×12 | C6 | the fence-post hooks either side of both gates (4: (26.5, ±6.5), (−22, −22) ± 1.2 m), the bridge ends (2), the porch (L4, already), the hangar (L3, already), the garden post at (−12.2, −2.0) (1), the pool bank post at (−7.5, 12.0) (1), path posts at (−6, 6) and (12, −7) (2) | as #6 on posts or hooks | — | 12 × 90 | as #6 | swing, flicker | the 3 nearest the camera pooled (`forest.lantern`), the rest emissive with a bloom halo; all on the 0.58 → 0.08 schedule | the camp outlined in warm points |
| 51 | Extra lantern hooks | C6 | four more hooks for `camp.lanternCount` (world-events: the Lost Lantern +3, the Bog's rusted lantern +1): the NW gate's second post, the sign's crossbar, the coop, the dock post (C7) | — | — | — | — | — | — | — |
| 52 | The crest banner | C6 | pole 5 m at (5.5, −6.5), a crossarm at 4.4 m | a gonfalon 1.2 × 1.6 hung from the crossarm, 2-bone cloth; a tealSlate pennant at the top; a rope halyard | 180° | 60 + 40 | pole `camp.bark`; banner shows `ui-ux.md`'s crest material (`crest.level`); pennant `camp.tealSlate` | banner sway (2-bone, 0.6 rad/s plus wind), the pennant (0.9 rad/s), the halyard slaps the pole every 4–9 s (sound) | — | the family's mark, between the hearth and the hangar |
| 53 | The crest plaque | C6 | on the cabin door at 1.5 m | 0.3 m carved plaque, same `crest.level` | — | 20 | `forest.honey` | — | — | — |
| 54 | Bunting | C6 | from the porch post (−4.4, −7.3) to the crest pole (5.5, −6.5) to the hangar's NW corner (8.5, −4.75), 3.2 m high | 18 triangles 0.25 × 0.3 | — | 18 × 4 | `camp.check` | a travelling wave (vertex, 1.2 rad/s) | — | a dotted line of colour across the camp |
| 55 | The rope swing | C6 | on P1's branch at 4.5 m, seat at 0.6 m, ropes 3.9 m, at (−12.5, −6.0) | plank seat 0.5 × 0.2 | — | 40 | `camp.rope`, `forest.honey` | swings ±4° in wind (0.5 rad/s), ±25° when a kid is on it | — | two ropes and a plank under the big pine |
| 56 | Fire S4 | C6 | at #1 | the hearth apron: 8 flat stones r 1.6–2.2; a log tripod 1.4 m with a chain; the kettle moves to the hook; 5 logs; flame 0.9 m | — | +200 | `camp.stone.warm` apron; tripod `camp.bark`; chain `camp.iron` | flame, embers 0.6/s, smoke 5 m, the kettle swings on its chain (1-bone, 0.7 rad/s) | `light.campfire` unchanged (the token is world-events'; the flame geometry grows, the light does not) | the fire at its biggest |
| 57 | The dock | C7 | from the north bank at (−5.5, 12.2) south to (−5.5, 15.8) | 1.2 m wide, deck 0.4 m over the water, 4 posts; a mooring post 1.4 m at the end with a lantern hook and the rod holder; a bucket; a stool; two lily pads; the fishing-spot ring 2.5 m off the end (world-events §2.7.2) | 180° | 180 | `forest.honey`, `camp.bark` | water laps the posts (foam), the bobber bobs, the lantern swings | lantern #13 hook (emissive) | planks over the pool with a red bobber |
| 58 | The fox's bed | C7 | (−3.0, 2.6) by the woodpile | a folded blanket 0.6 × 0.5 | — | 20 | `camp.check` | the fox breathing on it | — | — |
| 59 | The picnic blanket | C7 | (−4.0, 7.5) | 2.5 × 2.0; the fruit basket moves onto it | — | 12 | `camp.check` | corners lift in wind (2 cloth corners) | — | a checked square on the grass |
| 60 | The hammock | C7 | between B1 (−11, 9) and a post at (−7.5, 9.5), 3.5 m | a 0.8 m wide net strip sagging 0.4 m | — | 48 cloth | `camp.rope` | sways (2-bone, 0.4 rad/s); a kid in it rocks | — | — |
| 61 | Photo-spot stones ×5 | C7 | hearth (2.4, 2.4), porch step (−5.4, −7.0), dock end (−5.5, 15.4), the plane's wing (`npcs.md` places it on the apron), the swing (−12.5, −6.0) | flat stones 0.25 m with a cream dot | — | 5 × 12 | `camp.stone.warm`, dot `camp.cream` | — | — | a pale dot on a stone: stand here |

**Ed's and the merchant's spots** (stated here; `npcs.md` fills them): Ed's stump (1.9, −0.5) facing the fire; the wreck's nose (11.0, 1.2) facing the plane while it is wrecked (C1–C3, the `crash_landing`, greetings and B1.2 talk); the hangar's open front (16.5, 2.8) facing the plane (C4, the hangar shout and `phase1_intro`); the workshop bench (9.6, 0.6) facing west (C5+, `post_quest` idle); the strip apron (22, 0) beside the plane (turn-ins, CS-05, supply runs); the crater rim for CS-06 (`story-beats.md`). The merchant stands at (9.5, −6.2) in front of his cart facing the fire. The biome guides never visit; the bounty board also stands at each island hub (`story-beats.md` §2.8) as the same prop.

### 2.4 Ground density: the scatter recipe

The reference's ground is "dense with small things … Nothing is empty." Density is the camp's job more than any building's. Every count below is instances per square metre at High (Low ×0.35, Medium ×0.6, the v27 `particleMul` ladder).

| Type | Camp core (≤ 22 m of the fire) | Camp meadow (22–45 m) | Under canopy (≤ 3 m of a trunk) | Stream bank (≤ 2.5 m of water) | Mesh · tris | Colours |
|---|---|---|---|---|---|---|
| Grass tufts | 4.0 | 2.0 | 1.0 | 3.0 | 3 crossed quads · 6 | `forest.grass.a` / `.b`, tips lerp 0–0.3 to `.tip` |
| Flowers | 1.0, and 2.5 inside six seeded "drifts" 3–5 m across | 0.4 | 0.05 | 0.8 | stem + 5-facet head · 10 | one of the six `forest.flower.*` |
| Pebbles | 1.5 | 0.6 | 0.4 | 4.0 | 8-facet · 8 | `camp.stone` / `.warm` 50:50 |
| Mushrooms | 0.08 | 0.04 | 0.5 | 0.4 | cap + stalk · 14 | `forest.mushroom`, ±10° hue; 8 % glow variants only within 4 m of water or under trees |
| Fallen leaves | 0.3 | 0.2 | 1.5 | 0.3 | one quad · 2 | `forest.leaf.*` |
| Clover and low plants | 0.6 | 0.3 | 0.2 | 0.4 | 3 leaves · 12 | `forest.moss` |
| Twigs | 0.2 | 0.1 | 0.6 | 0.3 | 6-sided stick · 8 | `camp.bark` |

Sum: 7.7 per m² in the core (about 11,700 instances in the r 22 m disc), 3.6 in the meadow ring, 4.3 under canopy, 9.2 on the banks. The pilot's camp quadrant carries about 35,000 instances and 200,000 triangles of scatter at High; that is the single largest triangle line in the pilot and is where the density comes from.

**Determinism (ATMOSPHERE §7.3 kept).** The ground is divided into 1.5 m cells (v27's 60 px tile at 40 px = 1 m). v27's hash `(gx·73 + gy·137) % 100 < 15` marks 15 % of cells; each marked cell gets a **bonus cluster** (a clump of 5 grass tufts and one flower) on top of the density table. Positions inside a cell come from the save's seeded RNG keyed by cell index. The same seed always gives the same ground; the pilot uses seed 27.

**Hero-path clearance.**

| Rule | Value |
|---|---|
| Worn paths | no grass, flowers, clover or mushrooms within 0.45 m of a path centreline; pebbles at half density; grass within 1.2 m scaled 0.6 |
| Prop footprints | no scatter inside a prop's footprint plus 0.25 m; buildings (cabin, hangar, coop) get their own floors |
| The fire | nothing inside r 1.6 m but six hand-placed pebbles; no flowers inside r 2.5 m |
| Seats | r 0.6 m clear behind each seat spot so a sitting kid has no flowers in their lap |
| NPC spots | a 1.2 m clear disc at each spot in §2.3.3 |
| Trees and boulders | none within **6 m** of the fire (v27's 220 px spawn clearing, 5.5 m, rounded up, SYSTEMS_INVENTORY Part 2 §3.2) |
| Secrets and nests | never inside `camp.radius` (the landmark-clearance rule, `story-beats.md` §2.2; `enemies.md` §5's 30 m) |
| Fliers | the fence is 1.1 m, under `enemies.md`'s 1.2 m pass-over height |

**Vertex-colour hue jitter (Brief §4.7), per instance.** Grass: hue ±5°, saturation ±6 %, value ±8 %, scale 0.8–1.25, random yaw. Flowers: hue ±8°, value ±6 %, stems always `forest.grass.b`. Pebbles: value ±10 %, scale 0.6–1.6, 30 % half-buried (`y` −0.03). Mushrooms: cap hue ±10° toward red or ochre. Leaves: value ±8 %, 40 % flipped. Trees: canopy hue ±4° per tree, trunk value ±6 %. Floors: grass saturation never below 35 %, value never above 65 %; no jitter on emissive glow caps.

**Rendering.** One `InstancedMesh` per scatter type per island (seven draw calls), instance buffers rebuilt for the cells within 70 m of the camera whenever the camera crosses a cell boundary (a few thousand matrix copies every few seconds, zero per-frame work), sorted so the nearest cells are first. Grass and flowers use the sway uniform world-events' shared chunk already carries. No per-cell meshes: 200 draw calls of scatter is how a budget dies.

### 2.5 Motion and light, the rules

- **Two sources minimum (ATMOSPHERE §19.3).** Every recurring prop in §2.2–2.3 lists at least two independent motion sources at incommensurate rates; nothing that hangs, flies, burns or grows is still. The cheap ones are cloth strips (1- or 2-bone, closed-form sway from the weather system's wind), swinging lanterns, flickering flames, smoke, steam, birds that land, and the pets.
- **Light and fire agree (ATMOSPHERE §19.1).** The campfire and every lantern run world-events §2.8.3's torch recipe: one `flVal` per flame drives the flame mesh's height and lean *and* the light's intensity. The tent's canvas glow and the cabin windows follow the same schedule as the lanterns but have no light (emissive on the bloom layer, world-events §2.1.3).
- **The pool.** The camp asks for at most four pooled lights at once: the campfire plus the three lanterns nearest the camera (`forest.lantern`). With the whole squad idle the hero side uses two (the ring, Collette's orb), so the world side has six and the camp's four always fit. The campfire's priority sits just below the carried lantern in world-events §2.8.2's list; camp lanterns are "torches by distance". When the merchant's violet lantern (`light.event`) is present it takes a fifth slot if free, else runs emissive.
- **Shadows.** The cabin, hangar, tent, trees and the plane cast; small props receive only. The fire and lanterns cast no shadows (point-light shadow maps are not in the budget); the fire's light pool is the reference's "soft shadows" by omission.

### 2.6 The growth

#### 2.6.1 How a stage arrives

A stage builds in **when the squad next comes within `camp.radius` (35 m) of the fire after its flag is set**, so the change is seen from the way in. If the squad is already inside the radius when the flag sets (C5: `edQuestComplete` fires at Ed's Landing, 13 m from the fire), the build-in waits for any running cutscene or dialogue to end (CS-05 at C5) and starts 1.5 s later. Ed is always at camp when a stage builds (`story-beats.md`: the plane is at camp for every stage flag except C6, where the squad and Ed land together), and he is seen building it: `npcs.md` provides `ed_hammer`, `ed_saw` and `ed_hoist` clips (§5.2). Props rise from the ground with a 0.4 s elastic scale-in (0 → 1.05 → 1.0), a 6-particle dust puff each (ATMOSPHERE §9.2's crate-landing dust) and a wood knock. The title card re-shows at the end of every build-in with the current line. C0 → C1 and C6 → C7 have no in-world build-in: CS-01 ends with C1 in place at dawn (Ed pitched the tent in the night, off screen), and CS-10 shows C7 finished.

| Transition | Duration | Ed is at | Sequence (seconds from the start) | Sound (`audio.md` hooks) | What moves or leaves |
|---|---|---|---|---|---|
| C1 → C2 | 12 s | the board site (4.8, −4.6), hammering | 0 Noah's log; 0.6 the girls' log; 1.2 three bedrolls; 3.0 the board (six knocks over 3 s); 5–9 the east gate posts and rails, one post per 0.5 s; 10 the washing line unfurls (garments over 0.8 s); 11 the jar | `camp.hammer` ×6, `camp.rope.creak`, `camp.build.done` chime at 12 s | nothing leaves |
| C2 → C3 | 14 s | the garden, then he hangs the goggles on the scarecrow | 0–3 the three beds; 3–5 seedlings pop (a soft tick each); 5 the four stones; 6 the scarecrow; 6–12 the fence completes as a running wave from the east gate both ways, a post every 0.5 s; 10–13 the bridge; 13 the rod holder at the pool; 14 the NW gate latches, the deer walks in through it, the owl appears at the next dusk | `camp.hammer` wave, `camp.gate.latch`, the chime | the rod moves from the wreck (visible strapped inside the fuselage at C1) to the pool bank |
| C3 → C4 | 18 s | the wreck's nose, then the hangar frame | 0–4 the debris slides into the scrap pile; 4 the lean-to collapses (the tarp folds); 5–9 six posts then the ridge; 9–13 the walls; 13–15 the tarp flies up and settles as the roof with the new canvas; 14–18 the marker stones pop along the strip from east to west (a line running toward the squad) while the furrow decals fade; 16 the windsock inflates; 17 the propeller appears on the plane (`npcs.md` swaps `wrecked` → `hopping`) | `camp.hammer`, `camp.saw` (2 strokes/s for 4 s), a canvas snap, the chime; Ed's hangar shout lines fire when the squad reaches him (B2.1) | the lean-to, the crates, the suitcase and the two bedrolls move into the hangar (the loft); lantern L3 moves from the strut to the front post; fire S2 → S3 |
| C4 → C5 | 20 s, after CS-05 | the cabin site | 0–2 the base course; 2–10 eight log courses, a knock per log; 10–13 rafters; 13–16 shingles sweep eave to ridge (`camp.shingle` 8 taps/s); 16–18 the chimney, first smoke at 18; 18–19 windows and door; 19–20 the porch. In parallel: 12–16 the coop; 18–20 the sign hoisted with a rope creak; 14–17 the bench; 20 three hens walk out of a crate | `camp.hammer`, `camp.saw`, `camp.shingle`, `camp.sign.creak`, `camp.hen`, the chime | the hangar's canvas roof becomes shingles (a 2 s sweep); the fruit basket moves to the porch step; the tent keeps one bedroll (the loft keeps two blanket rolls; where anyone sleeps is never stated) |
| C5 → C6 | 16 s, on landing | the strip apron; he lights the first lantern and the rest light themselves | 0–8 lanterns light one by one along the paths, 0.6 s apart, each with a 0.3 s flare; 8–10 the crest pole rises; 10–12 the banner unfurls; 12–14 the bunting strings itself; 14–16 the fire grows S3 → S4 (the apron stones settle, the tripod rises, the kettle jumps to the hook); 15 the swing drops from the branch | `camp.lantern.light` ×12, `camp.halyard`, the chime; no hammer: the lights are the build | the kettle moves; if it is day the lanterns still light and go out at the next 0.08 |
| C6 → C7 | none | in CS-10 | CS-10 (`cutscenes.md`) shows the camp at C7 in golden hour; when control returns the dock, blanket, hammock, stones and pets are in place | — | the rod moves to the dock; the fruit basket to the blanket |

#### 2.6.2 Four screenshot-worthy views per stage

Views name a station from §2.11.5 (S1 Hearth, S2 Stream walk, S3 Wreck and strip, S4 Pond and rim, S5 Title, S6 Porch) and a clock phase.

| Stage | View 1 | View 2 | View 3 | View 4 |
|---|---|---|---|---|
| C0 | S3 at the night keyframe: the wreck smoking, the tarp, embers | S1 at night: the ember ring, Liam down (CS-01) | S3 from 20 m east: the furrow's whole length | S4 at dusk: the pond, no deer |
| C1 | S1 golden hour: the pilot's pose 1 | S2 night: the glowing tent, the ring, the stream sparkle | S3 noon: the wreck's facets, the furrow's shadows | S4 golden hour: the deer drinking, clouds below the rim |
| C2 | S1 golden hour: four logs, the washing line behind the tent | S1 at dusk from 3 m higher: the board's `!` and the papers | S3 night: the merchant's violet lantern and the plum awning | S2 golden hour: four bedrolls seen through the tent door and under the wing |
| C3 | S4 dawn: the deer inside the new fence, the garden rows | S1 night: the fox sitting at the firelight's edge | S6 (pre-cabin, target the garden): the scarecrow's goggles catching the sun | S2 golden hour: the bridge and the rod at the pool |
| C4 | S3 golden hour: the hangar's open front, the plane with its wooden propeller, the windsock | S3 noon from the strip's east end looking west: the marked runway pointing at the hangar | S1 night: the hangar lantern and the fire, two warm pools | S6: the loft and the cot through the open front |
| C5 | S1 night: the cabin's three windows behind the fire (the "night is a feature" shot) | S6 golden hour: the porch, the bench, the shelf, the sign at the gate beyond | S4 dawn: smoke from the chimney over the pines | S3 noon: the hangar shingled, the hens in the run |
| C6 | S5 golden hour: the title | S1 deep night: twelve lanterns, the fire S4, the banner | S2 night: the bridge lanterns reflected in the pool | S6 golden hour: the crest on the door and on the pole, bunting between |
| C7 | S5 golden hour (CS-10's last frame): all five at the fire, the deer, the plane over the Ridge | S2 golden hour: the dock, the rod, the bobber, Sugar on the bank | S1 noon: the fox asleep by the woodpile, hens in the yard | S6: the picnic blanket and the hammock from the porch |

### 2.7 The fire

#### 2.7.1 The prop

| Part | Value |
|---|---|
| Ring | 12 stones on a 1.2 m circle (centre to centre), each a 12-facet lump 0.22–0.30 m, `camp.stone` and `camp.stone.warm` alternating with ±6 % value jitter; soot on the inner faces (`#2A2418` vertex colour at 50 % on the two inner facets); the packed-earth disc r 1.6 m |
| Fuel by size | S1 (C0): 5 stones, embers only, a 0.3 m flame licking up. S2 (C1–C3): 3 split logs in a star, flame 0.55 m. S3 (C4–C5): 4 logs stacked, flame 0.7 m. S4 (C6–C7): 5 logs, the hearth apron, the tripod and chain, flame 0.9 m |
| Flame | three tongues, each a two-cone pair (outer `#E85D04`, core `#FFD166` at 50 % width and 60 % height, world-events §2.8.3) on the bloom layer; the main tongue runs the shared oscillator `f = 8.8 + hash·1.2 Hz`; the two small tongues run at `f × 1.7` and `f × 0.6` with their own phases; heights scale with the size class |
| Light | `light.campfire` `#FF9A3C` 2.5 · 9 m, intensity `base·(0.8 + 0.15·flVal)` (±12 % at 7–9 Hz), from the same `flVal` as the main tongue; S1 uses 1.2 · 5 m; S2–S4 the token unchanged (the flame grows, the light does not: the token is world-events') |
| Embers | `pt.ember` colours `#E8A838` `#F0C878` `#FFF0C8`, 0.3/s at S2, 0.45/s at S3, 0.6/s at S4, rising 2 m with ±0.4 m/s drift, life 3 s; by day 0.1/s |
| Smoke | a billboard column of 6 stacked soft quads growing 0.6 → 1.6 m, alpha 0.25 → 0, rising 0.8 m/s, leaning with the wind; 4 m at S2, 5 m at S4; colour `#B4B4B4` (the v27 biplane smoke, ATMOSPHERE §11.1) multiplied by the keyframe's hemisphere sky colour so it is warm at golden hour and indigo at night |
| Heat | none rendered; bloom on the core and the tilt-shift carry it |
| Sound | `amb.camp.fire`: a crackle bed whose gain follows `flVal`'s amplitude, plus a pop every 4–9 s (`audio.md`) |
| Read at distance | a warm point with a smoke column; from the plane, the one warm light on the island |

#### 2.7.2 The seats

Radius about 1.9 m from the fire's centre. Each kid has a seat; the girls share a log because the family rule (`heroes.md` §2.5.11: Isabella's slot is always adjacent to Collette's, 1.0 m apart at camp) is a prop here. Liam faces the way in.

| Seat | Prop | Position | Faces | Sits how | Seated 30 s idle (from `heroes.md` §2.4.6, seated) |
|---|---|---|---|---|---|
| Liam | his log (#2) | (−1.85, 0.4) | 90°: the fire, the wreck and hangar, the strip, the gate | shield planted edge-down beside the log on his left, sword across his knees, feet flat, still | every 12 s checks over his shoulder for the others; every 25 s pokes the fire with a stick (1.5 s, 6 sparks, `hitFx`-class) **[new motion]**; the pebble kick is gone (he is sitting) |
| Noah | his log (#31) | (−0.6, −1.8) | 180°: over the fire to the stream and the south meadow | forward, elbows on knees, bow across his lap, never quite still | tracks the nearest firefly, ember or moth with his head; flicks the bowstring every 9 s |
| Collette | the girls' log (#32), east spot | (1.22, 1.58) | 300° | knees together, staff upright in the crook of her arm, the orb pulsing | fixes each pigtail in turn; draws the 0.4 m spiral in the dirt at her feet with the staff tip (the decal fades in 20 s) |
| Isabella | the girls' log, west spot | (0.28, 1.92) | 300° | cross-legged on the log, the hammer across the ground in front, feet swinging | copies Collette's idle 0.5 s late (she is 1.03 m away); otherwise nods off against the hammer and jerks awake every 6 s |
| Ed | his stump (#3) | (1.9, −0.5) | 260°: the fire, his back to the plane | `npcs.md` (whittling from C4, the scarf) | `npcs.md` |

A hero who is locked has no seat yet (C1: Liam's log and Ed's stump only). A downed or absent hero's seat stays empty. Sitting or standing, companions run the idle ladder (`heroes.md`: the 3 s tier always, the 10 s tier at 50 %), so a camp with the squad in it is never still.

#### 2.7.3 The rest prompt

| Rule | Value |
|---|---|
| Availability | the active hero within 2.2 m of the ring and facing it; no enemy within 20 m; no event, boss, cutscene or dialogue running; not in Home, Wrong (the mirror fire has no prompt) |
| Prompt | `Rest` **[new text]**, then a two-option sub-prompt `Until dawn` / `Until dusk` **[new text]** (`ui-ux.md` renders it from the live binding) |
| Sequence | every present hero walks to their seat (≤ 2 s) and sits; Ed sits if present; the 3 s sky sweep (world-events §2.1.1: to `p` 0.02 or 0.65); on arrival every unlocked hero heals to full and loses every DoT; weather re-rolls for the new phase; nests re-arm at dawn (`enemies.md`); the fox's trust counter ticks if it was present (§2.9); the squad stands |
| Multiplayer | every player-controlled hero must be within 6 m of the fire; any player triggers; guests see `Waiting for host…`-class copy from `ui-ux.md` |
| Cost | time (nests re-arm, the clock moves, a storm may roll in); no gold |
| Save | an autosave 500 ms after the sweep (the v27 rescue-autosave rhythm) |

#### 2.7.4 The sit prompt

`Sit` **[new text]** in the same prompt. The squad sits as above and stays until any move input. The camera eases to 17 m and pitch 42° over 1.5 s (a 15 % lean-in, the same ease the guardian wake uses). At deep night (`p ≥ 0.85`) sitting is **stargazing**: world-events §2.7.3's 25° tilt over 2 s and the five constellations drawing their lines with name cards (`ui-ux.md`). At other hours the kids run their seated idles and Ed his. Sitting counts toward the fox's trust like resting. Sitting at the mirror fire is not offered.

#### 2.7.5 Who sits where when Ed is away

Ed's stump is empty (the plane is elsewhere) and stays empty; nobody takes it. When the plane is on another island, the squad is on that island too, so the camp is never seen with an empty stump except in Home, Wrong, where the empty stump is deliberate (§2.8).

#### 2.7.6 The cold mirror-fire (Home, Wrong, by reference)

`dungeons.md` builds the Throne of Shadows from the C6 set (§2.8); this is the fire's prop specification for it. The same ring and logs, the logs charcoal `#1C1A22` with rift-cyan seams. The three tongues are inverted: they hang **down** into the ring like a drain, core `#3AF0FF`, outer `#120A1F`; the shared oscillator runs at half rate (`f × 0.5`: slow, wrong); embers **fall** (velocity −0.5 m/s, spawned at 2 m); the smoke **sinks** and pools as a 0.3 m cyan mist disc r 3 m. Light `shadow.mirrorFire` `#3AF0FF` 1.6 · 7 m on the same `flVal`. The kettle hangs on the tripod but the chain does not swing. The five seats are present; the shadow squad sits in the kids' four when the set piece begins (`bosses.md`); Ed's stump is empty and the real fire is the one far warm light on the horizon (`story-beats.md` §2.2). No rest, no sit.

### 2.8 Home, Wrong's mirror set (C6, inverted)

The Throne of Shadows mirrors Stewart Camp at C6 (`story-beats.md` §2.2). The left column is the C6 manifest for `dungeons.md` to invert; the right column is the inversion this file recommends, and `dungeons.md` may go further.

| C6 prop (position) | Mirror in the Throne of Shadows |
|---|---|
| Fire S4 (0, 0) | the cold mirror-fire (§2.7.6); the corrupted hearth arena is centred on it |
| Five seats | present; the shadow squad seated in the kids' seats; Ed's stump empty |
| The cabin (−8, −11.5) | grown into the citadel: the footprint kept, the walls three times taller, roof `#1C1A22`, windows ember `#FF6A2A`, the door is the Citadel Warden's post; the porch shelf empty |
| The hangar (14, 0) | roofless ribs, no plane, the windsock hanging dead |
| The tent (−6, −3) | torn open, the flap gone, canvas `#5C5C66` |
| Twelve lanterns | all out, glass cracked; two still swing (the only motion) |
| The crest banner (5.5, −6.5) | hung upside down in void and ember, the pole leaning 8° |
| Bunting | half fallen, dragging |
| The washing line | empty pegs |
| The stream and pool | rift cyan, running uphill (world-events §2.1.4) |
| The bridge (−12, 17) | every other plank missing |
| The garden (−14, −4.5) | ash beds `#5C5C66`; the scarecrow facing away; the four stones blank |
| The fence | ice-crusted (the Throne's canon hazard is ice, `story-beats.md`) |
| The coop | empty, the door swinging |
| The board (4.8, −4.6) | papers black; the `!` cyan and pulsing |
| The sign (26.5, 0) | hangs by one chain, the letters mirrored |
| The strip and apron | the furrow back and glowing cyan; the wreck back at its west end (the crash, again) |
| The swing | swinging by itself |
| The deer's habitat | the shadow deer (world-events §2.7.1) |
| The fox's spot (−8.5, −8.5) | empty |
| The pond | black glass |
| Ed's fire | the one far warm light on the horizon (`story-beats.md`) |

### 2.9 Pets and camp animals

Brief §5.5 asks for pets at camp; v27 has none (FAMILY_CANON §1.4). Rules for all of them: never targetable, no hitbox in any target list, never counted against world-events' 24 wild animals per island, no lights, blob-shadow decals only, leashed to `camp.radius`, and they sit still when a photo pose starts within 2 m. Names are **[new text]** in the canon's own naming voice (Ed's puns: `The Green Meanie`, `Ground-Ed`, `Ed-ibles`, `Sparky-Thingy`); they are one-line data in `src/content/camp/pets.ts` so a name can be changed without a design change, and no name is ever spoken in dialogue. There is no dog and no cat: a family dog would be an invented fact about the real family (Brief §2(b)); the fox takes the dog's place at the fire.

| Pet | Rig | Name plate | Earned (flags and events only; no new dialogue) | Before C7 | At C7 and after | Wander rule | Motion sources | Read at distance | Budget |
|---|---|---|---|---|---|---|---|---|---|
| The fox | one of world-events' two Forest foxes (`#D87828` wedge, white tail tip), instanced with them | `Orange Meanie` **[new text]** | `camp.foxTrust` 0–5: from C3 the fox sits 12 m from the fire at night (world-events' promise) at (−8.5, −8.5) facing it; each rest or sit at night with it present adds 1; at 3 it sits at 6 m; at 5 it is a pet (a card in the scrapbook, `ui-ux.md`) | at trust 5: sleeps by the woodpile by day, trots 3 m behind the active hero inside the fence, sits by whoever is at the fire; leaves at dawn only if trust < 5 | home for good: sleeps on its bed (#58) by day, follows in the yard, curls at Liam's log at night (the leader's dog-that-is-a-fox); steals one apple from the basket every game day and carries it to its bed (the basket refills at dawn) | inside the fence; never past the gates; flees nothing at camp | breathing (1.5 rad/s), tail flick (0.4 rad/s), ear turn toward sounds | an orange wedge with a white tip, asleep or trotting | 0 extra draw calls (shares the fox batch) |
| Sugar the slime | the `enemies.md` Blob rig (Slime, olive `#8FA33A`) as an **animal-class** entity, with a small `camp.check` ribbon tied on | `Sugar` **[new text]** (tip 5, `TIPS` L727: the sand she ate thinking it was sugar; the `Sugar?` emote) | after `hollowGroveCleared`, the Slime Puddle nest nearest the camp (world-builder, ≥ 30 m out) spawns one extra `tame` slime that hops toward the fire when a hero is within 12 m; Interact within 1.5 m → prompt `Keep it` **[new text]**; the `enemies.md` bestiary line ("Isabella has asked to keep one") becomes true | lives on the pool's north bank within 3 m of (−9, 12.5); hops to the water's edge and back | hops around the yard; follows the nearest hero at 2 m when they are inside the fence; sits by Isabella's seat when the squad sits | inside the fence and the pool bank | hop-hop-pause (`enemies.md` Blob), wobble at rest, blink | a bouncing olive jelly with a ribbon | 1 draw call (blob material) |
| Three hens | instanced, ≤ 200 tris, 3 clips (peck, walk, flap) | unnamed | they arrive with the coop at C5 (the cabin build-in's last beat) | in the run by day; roost in the coop from `p` 0.68 to 0.06 | free-range inside the fence by day; roost at night | flee a running hero at 1.5 m with a flap and `camp.hen`; one lays an egg prop at the coop each game day (decoration; a kid will look) | peck (2 Hz), head bob while walking, a wing stretch every 20 s | white specks with red combs moving in the garden | 1 draw call |

Camp animals that are not pets: the deer whose habitat includes the camp meadow (world-events §2.7.1; from C3 it grazes inside the fence between the garden and the pines, habitat volume `x` −20 to −8, `z` −14 to −6, and drinks at the pool and the pond); the owl in P1 (world-events' authored tree; hoots from C3); songbirds on the scarecrow, the fence and the birdhouse; butterflies over the garden by day; frogs are Bog animals and do not appear here.

### 2.10 Photo mode, memories, the crest

`ui-ux.md` owns photo mode's UI, filters and frame. This file owns the poses and the props.

**Family poses (Brief §4.5), each an arrangement of up to five slots (four kids, Ed when present):**

| Pose **[new text names]** | Where | Arrangement |
|---|---|---|
| `Hearth` | the seats | everyone in their seat, all looking at the camera; the fire between |
| `Porch` (C5+) | the porch step | Liam on the porch behind, Noah on the step, Collette and Isabella in front on the grass, Ed on the bench |
| `Dock` (C7) | the dock end | sitting in a row, feet over the water; Isabella's feet swing highest |
| `The plane` (C4+) | the apron | on and around the lower wing; Ed in the cockpit (`npcs.md`) |
| `Squad` | anywhere flat | a row in height order (`heroes.md` §2.3.1), the four stars of The Squad constellation made of people |
| `Not scared` | anywhere | all four in Isabella's `Not scared` emote (the copycat rule as a pose); Ed with his hands up |

Individual poses: every kid's victory clip and three emotes (`heroes.md` §2.4.6) and their seated idle. Props that pose: the swing (a swinging pose, any kid), the hammock (a lying pose), the picnic blanket (sitting), the photo-spot stones (a kid standing on one strikes their victory), the fox and Sugar (sit within 2 m when a pose begins).

**Memories point back here (Brief §5.2).** The **porch shelf** (#47) is the memory shelf: each memory collectible found (Phase 4; the roster is `ui-ux.md`'s and `story-beats.md`'s: Ed's goggles from `ground_ed_1`, a propeller shaving, a fallen-star shard, the waterlogged photograph from the Shadow catch, and so on) adds a ≤ 60-triangle prop to the shelf in the order found, visible from the yard through the porch rail. There is no cabin interior. The loading screen's "memory" is a photo-corner render of the camp from station S1 at the current stage and clock with one of the twelve `TIPS` beneath it (the story-aware rotation from `story-beats.md`); `ui-ux.md` decides live render versus a cached capture. Scrapbook thumbnails for memories are captured at station S6 (the porch).

**The crest.** `ui-ux.md` designs it and its evolution (`crest.level`); it hangs here on the banner (#52) from C6 and is carved on the cabin door (#53). Both read `crest.level`; the banner is the one texture-bearing cloth at camp (a `crest` material slot); the plaque is vertex colour only.

### 2.11 The pilot camp (build-ready, Phase 1)

#### 2.11.1 The pilot island cut

The pilot builds the Forest island's camp quadrant, not the 360 × 300 m island: a plate `x` −52 to 62, `z` −50 to 50 at `layoutScale` 1.0, so every position in this file is final and nothing is rescaled later. Inside it: the C1 camp (§2.2), the strip to `x` 62 (the meadow's far half is off the plate), the pond at (−40, −30) three metres from the west rim, the stream from (62, 22) through the camp reach to (−40, 31) and off the west rim at (−52, 40) as a waterfall (mist 20 billboards, foam), the pine stand north of the camp (P1–P5 plus 30 instanced pines and 10 birches seeded with clearance), a low 4 m ridge along `z` −46 standing in for the Ridge, cliff faces and root rubble 8 m below the rim all round (`story-beats.md`'s "mesh extends about 25 m beyond as cliff"), and seven clouds, two of them below the rim. The camp meadow, the stream cut, the pond basin and the strip are authored heights (§2.3.1); the rest is noise.

#### 2.11.2 Prop sources and triangle budget

Every C1 prop in §2.2 is procedural code geometry in `pilot/props/` (one builder per prop, vertex colours from the tokens, merged into static batches by material), except: **the plane** (`npcs.md`'s asset; the pilot uses a procedural stand-in of the same dimensions if `npcs.md`'s mesh is not ready, ≤ 2,000 tris, livery colours per `npcs.md`) and **the deer** (a Rule 2 gate on Kenney's CC0 animal pack: download, record node names, clip names, triangle count and licence in `assets/LICENSES.md`; fall back to a procedural 380-triangle deer if the pack's proportions cannot be flat-shaded cleanly). Licences: every GLB in `assets/LICENSES.md` before it is committed; procedural geometry needs none.

| Group | Tris (High) | Draw calls |
|---|---|---|
| Terrain plate (1 m grid within 40 m, 4 m beyond) | ≈ 16,000 | 1 |
| Water (stream ribbon, pool, pond, waterfall) | ≈ 3,000 | 1 |
| C1 authored props (§2.2, plane excluded) | ≈ 9,200 | 5 static batches (wood, stone, cloth, iron, emissive) + 1 cloth batch (skinned strips) |
| The plane | ≤ 3,500 | 2 |
| Trees (5 camp pines + 30 pines instanced; 2 + 10 birches instanced) | ≈ 13,500 | 2 |
| Scatter (§2.4) | ≈ 200,000 | 7 |
| Sky, sun, moon, stars, clouds (world-events §4.1) | ≈ 7,000 | 6 |
| Particles: embers, smoke, steam, pollen, fireflies, leaves, mist, footfall dust | — | ≤ 8 |
| Decals (paths, ruts, scorch, the spiral, the ring) | — | 2 |
| The deer | ≤ 400 | 1 |
| Liam and the ring | ≈ 700 | 3 + 1 |
| **Total** | **≈ 255,000** | **≈ 45** (world-events' systems add about 40 more; the pilot sits near 85 of 300) |

#### 2.11.3 Materials

One shared flat-shaded vertex-colour `MeshStandardMaterial` (roughness 0.9, metalness 0) for every opaque prop, with world-events' `onBeforeCompile` chunk (fog, curved world, far-dim, sway uniform); one emissive material (flames, lantern glass, the tent's canvas glow term, glow caps, the crate `E`) on the bloom layer; the water shader; the cloth shader (per-vertex phase, closed-form sway); the particle shader (mode uniform); the decal material. Six materials from this file. Rule 2 gate before writing any of it: verify the chunk injection and per-instance attributes against three 0.185.1 in a real scene and record the shape in the task notes.

#### 2.11.4 The tent's glow (the pilot's stand-in for the cabin windows)

`heroes.md` §2.7.6 scores pose 2 at night with "the cabin windows as a warm source". The pilot camp is C1 and has no cabin (§5.3 conflict 1). The tent lit from inside is the same token on the same schedule: the canvas emissive is `forest.window` × a baked per-vertex falloff from lantern L2's position (0.9 at the ridge, 0 at the hem) × the window schedule (0.60 → 0.06), on the bloom layer, no light. At C5 the cabin's windows are the same term on glass quads. The pose's two sources hold: the ring's cool pool under Liam and the warm tent behind him.

#### 2.11.5 The four screenshot stations (the fixed contract with the art director)

Seeded and fixed: scatter seed 27, cloud drift frozen at capture (`clouds.freeze`), the deer parked at the phase given, weather `clear` (world-events §2.2.6 adds four weather captures at S1 golden hour), the title card held visible (`card.hold`), HUD stub on. Camera position = target − d·cos(pitch)·**f** + (0, d·sin(pitch), 0) with **f** = (sin yaw, 0, −cos yaw); vertical FOV 35°; three clock phases each: golden hour `p` 0.54, noon 0.35, night 0.78 (world-events §2.1.3).

| Station | Name | Target (x, y, z) | Yaw | Pitch | d | Camera (x, y, z) | What is in frame | Liam | Deer |
|---|---|---|---|---|---|---|---|---|---|
| S1 | Hearth | (0, 0.6, 0) | 315° | 48° | 19 | (9.0, 14.7, 9.0) | the fire centre-left, its smoke, Liam left of it, the tent upper-left (glowing at night), Ed's stump and crate table right, the wreck's nose and broken wing at the right edge, the woodpile lower-left, the lantern post lower-right, pollen backlit at golden hour; the title card bottom-left | **pose 1**: at (−2.4, 0, 1.0) by his log, body bearing 150°, head look-at toward the fire (the look-at clamps at 40°), shield arm toward the camera, mid-breath, cape in a light wind | at (−9.0, 0, −1.0) walking south past the tent, 3 m west of it |
| S2 | Stream walk | Liam's chest (−2.5, 0.9, 7.5) | 245° | 50° | 19 | (8.6, 15.5, 2.3) | Liam centre in the walk's contact pose, the ring on the grass, the stream and pool ahead upper-left with foam at the rocks and the moon band at night, the six glow caps on the bank, the tent's glow right of centre, the fire's pool lower-right, the bucket at the path's start | **pose 2**: walking bearing 205° from (−2.5, 7.5) toward the bank at (−5.5, 12.4), seen from behind-left, one dust puff live | none |
| S3 | Wreck and strip | the wreck's nose (12, 0.8, 0.4) | 75° | 46° | 21 | (−2.1, 15.9, 4.2) | the wreck near-centre with its facets, the furrow and debris receding east, the lean-to and crates left, lantern L3 on the strut, the long noon shadows across the ruts | none (Liam at his log, out of frame) | none |
| S4 | Pond and rim | the pond's west bank (−45, −0.3, −30) | 300° | 45° | 22 | (−31.5, 15.6, −22.2) | the pond with the sun's glint at golden hour, the deer drinking at the bank in silhouette, reeds, the west rim 23.7 m from the camera (depression 33°), and the void beyond it in the top 6° of frame with two clouds below the rim | none | at (−43, 0, −28), head down, drinking |

Why S4 is sited 7 m from the rim: at pitch 45° the frame's top edge looks 27.5° below horizontal, so the rim must be nearer than `height / tan(27.5°)` for the void and the below-rim clouds to enter the frame. S1–S3 contain ground only, as every gameplay frame does; S4 and the title (§2.12) are where the island reads as floating. This is a geometry note for world-events' "two clouds below the rim" (§5.3).

Clouds for S4 (island-local, `y` below the plate): cloud A at (−70, −12, −44), 10 m across (44 m from the camera, depression 32°, inside the band between the frame top and the rim line); cloud B at (−78, −14, −52), 12 m across (55 m, depression 28.2°, at the frame's top). At golden hour fog (26 / 74 m) they are 40–65 % fogged, at night (20 / 56 m) 70–90 %: softened, never gone.

Dusk (`p` 0.65) is not a station time; `heroes.md`'s "dusk and night" for pose 2 is captured as an extra unscored frame via `clock.set dusk` at S2.

#### 2.11.6 The deer's path

One deer (world-events §2.7.1, the one whose habitat includes the camp meadow), on a seeded 90 s loop when no hero is within its 8 m flee radius: graze at the pond's east bank (−32, −28) 12 s → walk (1.0 m/s) to (−18, −12) → (−9, −1), passing 3 m west of the tent → (−8, 8) → drink at the pool's bank (−7, 13) for 10 s → walk back via (−16, 4) → (−28, −14) → the pond. Flee to the pines north if approached. For the stations the loop phase is fixed per station (S1: the tent leg; S4: drinking at the pond, which the loop reaches by a 20 s pond-bank drink at its start). At C3 the loop gains the fenced habitat; before C3 the camp meadow is a walk-through.

#### 2.11.7 The water shader's edges

Brief §4.7: flat-shaded with a low-frequency wave, foam at the edges, refracted tint. Two wave octaves (amplitude 0.03 m, wavelengths 1.8 m and 0.7 m, flat normals per facet); tint `forest.stream` over a bed colour `#2E5A56`; foam `#DDF6F1` at 60 % where the water is shallower than 0.15 m (the banks) and within 0.5 m of the six rocks and, at C7, the dock posts, scrolled along the flow at 0.6 m/s with a 1-octave noise breakup; the flow-map from the §2.3.2 spline; the sun's specular glint at golden hour (a lobe on the key direction, sharpness 60) and world-events' `#8FD3F4` moon band at night; the waterfall as a scrolling ribbon with 20 mist billboards. `amb.stream` within 12 m of water (`audio.md`).

#### 2.11.8 The title card

`Stewart Camp` over `Tent, fire, one bedroll. For now.` (verbatim, `story-beats.md` §2.7), bottom-left, serif name and one quiet line (Brief §4.1, §6), fades in 0.8 s, holds 3 s, fades 1 s; shown on entering `camp.radius` after 90 s away, on every stage change, and held for stations by `card.hold`. `ui-ux.md` owns the type; the pilot's HUD stub renders it as DOM.

### 2.12 The title screen (B0.1): the fifth station

`story-beats.md` sets the title at Stewart Camp at stage C6, golden hour, the plane crossing the Ridge. It is a cinematic station, not a gameplay one.

| Field | Value |
|---|---|
| Scene state | `camp.stage` forced to 6 for the title scene (a scene preset, not a save); the four kids in their seats running the idle ladder; Ed's stump empty because Ed is in the plane; hens in the run; the deer at the garden fence; no pets, no dock (they are C7) |
| Clock and weather | golden hour `p` 0.54, `clear`, pollen backlit, the crest banner and bunting moving |
| Camera S5 | target (−1, 1.0, −3), yaw 340°, **pitch 14°**, vertical FOV 34°, d 40 → camera (12.3, 10.7, 33.5): from the south meadow across the stream, the footbridge left, the fire and the family at centre, the cabin behind them with its roof against the pines, the crest pole right of centre, the hangar's front cut by the right edge, the garden cut by the left edge; the Ridge on the horizon (its top at 1.7° below the horizon line; the frame's top edge at 3° above) |
| The plane | `npcs.md`'s repaired plane crossing the Ridge east to west at 18 m altitude (2.6° above the camera's horizon: inside the top of frame), 45 s per crossing with one loop at the canon cadence, its smoke puffs; it is small (about 5 % of frame width at 158 m) and reads as the yellow biplane a kid waves at (tip 1) |
| Motion | the plane, fire smoke, chimney smoke, the banner, bunting, the washing line, the kids' idles, the hens, the deer, the stream, pollen; a 60 s camera dolly 1.5 m to the right with 0.4° of yaw, then `ui-ux.md`'s cross-fade back |
| Post | tilt-shift at half strength (the cutscene rule), the focal band at the fire; vignette 0.25 |
| Over it | `ui-ux.md`'s title: `⚔️ The Stewart Squad Adventure`, `The world has stories to tell.`, one tip from the story-aware rotation, the buttons |
| How it differs from the C1 pilot camp | every C2–C6 prop present; fire S4; the family present and seated; no HUD; pitch 14° and a 40 m distance instead of 48° at 19 m, so the sky, the Ridge and the plane are in frame; a slow dolly; the tilt-shift halved |

CS-10's last shot (`cutscenes.md`) is S5 with C7, all five at the fire, the fox on its bed, and the plane over the Ridge.

### 2.13 Cuts, with reasons (for `KEEP_CHANGE_DROP.md`)

| v27 thing | Fate | Why |
|---|---|---|
| The merchant's 30–60 s relocation by ±400 px (L9310) | cut at camp | a hub needs its merchant findable; his schedule between hubs is `npcs.md`'s |
| The bare 220 px spawn clearing | replaced by the camp | the clearing's tree-free radius survives as the 6 m rule around the fire |
| The citadel and rift entrances 2.5 m from spawn | moved by `story-beats.md` (the crater) | not camp props |
| The `Merchant` and `Bounties` canvas labels and `[SPACE] Trade` | kept as strings, rendered by `ui-ux.md` from the live binding | canon |
| The DOM title screen with no world behind it | replaced by S5 | Brief §6 and `story-beats.md` B0.1; every string kept |

---

## 3. What preserves the magic

**Recipe by recipe (ATMOSPHERE_RECIPES section numbers).**

| Recipe | Kept, translated, or replaced | Where at the camp, and why the feeling survives at the gameplay camera |
|---|---|---|
| §19.1 the shared torch oscillator (light and fire agree) | **kept exactly** | the campfire and every lantern: one `flVal` drives the flame mesh and the light (§2.5, §2.7.1). At the Hearth station the ground under the fire brightens in the same rhythm the flame leans. The mirror fire runs the same oscillator at half rate, which is why it reads as the same fire gone wrong. |
| §19.2 simultaneous layers with distinct motion signatures | **kept** | at S1 golden hour, with no sky in frame: tinted fog, backlit pollen, sun shadows plus the fire's pool, the post stack, six independent life motions (flame, smoke, steam, the tent flap, Liam's cape, the deer), and the curved world: six of Brief §4.4's eight layers with the sky and weather off screen; at S2 night the fireflies and the stream's moon band bring it to eight. |
| §19.3 more than one independent motion source per recurring object | **applied as a rule** | every prop table row has a motion column; nothing that hangs, burns, flies or grows is still (§2.5). The washing line's four garments at four rates are the biplane-scarf lesson on a rope. |
| §2.4 warm on cool at night, "contrast of temperature, not of value" | **translated** | the night camp is cool moonlight and indigo fog with five warm points (the fire, three lanterns, the tent glow) and the ring's one cool point; the tent is the v27 merchant's amber eyes made a building. |
| §5 direction signatures (embers rise) | **kept** | the Forest's night ember motes (5 %/frame in v27) now have a source: they rise from the fire at 0.3–0.6/s; leaves still fall under the birches; the Bog's wisps stay in the Bog. |
| §7.3 the 15 % deterministic tuft and the 60 px tile | **kept literally** | `(gx·73 + gy·137) % 100 < 15` on a 1.5 m cell places bonus clusters; the ground never shimmers and is identical across loads and stations (§2.4). |
| §9.2 crate-landing dust, footfall dust, hit sparks | **kept** | every build-in prop lands with the 6-particle crate dust; Liam's fire-poke uses the 6-spark `hitFx` recipe; footfall dust on the worn paths. |
| §11.5 the crash sequence's values | **translated to a set** | the furrow, the 15 debris pieces in `#8B4513` `#654321` `#a0522d`, the black smoke: the crash is a place you can walk around, and it stays until Ed builds over it (C4). |
| §12.4 the crate drawing | **kept** | the supply crate with its straps and gold `E` is the camp's table, and the first thing a kid recognises. |
| §15.1 the always-on navy vignette | kept (world-events) | every camp station wears it. |
| §15.2 the missing selection ring | **new**, per `heroes.md` | the ring sits on `forest.moss` at golden hour and on the ring's own light pool at night (S2). |
| §7.3's 3D note: the biome watermark becomes the corner title card | **translated** | `Stewart Camp` / `Tent, fire, one bedroll. For now.` |
| §18 not found: campfire, lantern, cabin, fence, garden | **new work** | §2.2–2.3 is the list §18 asked for. |
| The v27 bounty board drawing (L1689–1711) | **kept as the 3D board** | same papers, nails, glyph, gold label and the pulsing `!` at the same alpha formula. |

**Family threads that survive.** Every bounty and merchant string (`Bounties`, `Merchant`, `A mysterious merchant has appeared!`, `Merchant sold out!`, all twelve bounty names). `Find and rescue your siblings!` and tutorial steps 1–2 fire at the C1 fire (`story-beats.md` B1.2). Ed's `crash_landing` lines at the wreck, his hangar shout at the hangar's front, `The Green Meanie lives again!` on the apron, `phase1_intro` at the plane. `Is this from Grambi??` beside the crate table where the Ed-ibles are handed over. The crest of the family the Brief asks for hangs between the hearth and the plane. `Isabella was here first!!!` is a scratched rock elsewhere; here it becomes four painted stones at the garden with four initials, because the family marks its ground. The washing line carries the four canon colours from `heroes.md`. `hold my hand` is a shared log. `L + N were here` has no prop of its own; the boys' side of the camp is unstated on purpose (§6). Tip 1 (the yellow biplane you wave at) is the title screen. Tip 2 (character-building weather) fires on the porch in rain (world-events §2.7.3). Tip 5 names a slime.

**What a kid will recognise from v27.** The bounty board's `!`. The hooded merchant with the amber eyes, now behind a cart. The supply crate. Grandpa Ed at his landing, now with a hangar. The loading tip under the picture. The spawn point, now with a fire on it.

---

## 4. Build notes for implementers

### 4.1 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| Stage manifests (§2.1–2.3 as data: prop id, stage in, stage out, position, facing, scale, material batch), seat table, hook table, NPC spots | `src/content/camp/manifest.ts`, `seats.ts`, `spots.ts` |
| Pet data (names, earn rules, leash) | `src/content/camp/pets.ts` |
| Photo poses and spot stones | `src/content/camp/photo.ts` |
| Prop builders (procedural geometry per prop), material batches, cloth strips, flame and smoke | `src/render/camp/` (pilot: `pilot/props/`, promoted at style lock) |
| Scatter (density table, cell hash, seeded placement, clearance, the InstancedMesh buffers) | `src/world/scatter/` (pilot: `pilot/scatter.ts`) |
| Stream spline, water mesh, flow map | `src/world/water/`, shader in `src/render/water.ts` |
| Growth controller (flag → stage, the 35 m approach trigger, build-in timelines, removals), rest and sit, fox trust, pets' AI | `src/sim/camp/` (fixed step, seeded RNG, deterministic) |
| Camp tokens (§2.0) | `src/style/tokens.ts` (serialize with anything else touching `src/style/`) |
| Stations S1–S6, `card.hold`, `clouds.freeze`, `camp.stage <n>`, `camp.buildin <n>`, `pet.spawn <id>`, `deer.phase <s>` | `src/dev/` (pilot: `pilot/dev.ts`) |
| Strings (`Rest`, `Until dawn`, `Until dusk`, `Sit`, `Keep it`, pose names, pet names, the four stones' letters), all marked new | `src/content/camp/text.ts`; canon strings stay in `src/content/canon/` |

### 4.2 Phase mapping (Brief §8)

| Phase | Ships from this file |
|---|---|
| **1 Pilot** | the C1 manifest (§2.2), the camp quadrant (§2.11.1), scatter with clearance and jitter, the stream and pool shader, the deer path, the tent glow, the four stations and the two poses, the title card, the dev hooks |
| **2 Vertical slice** | the C0 set for CS-01's placeholder card, C1–C4 with their build-ins, the fire's rest and sit (no stargazing), the board and the stall props, the fence, garden, bridge, hangar, strip, the fox visitor and trust counter, Sugar, `camp.stage` persistence, the title stub over the C2 camp |
| **3 The world** | C5 and C6 with their build-ins, the cabin, coop and hens, the sign, twelve lanterns and the `camp.lanternCount` hooks, the crest banner slot, the C6 title scene (S5) |
| **4 Lights in the Dark** | C7, the dock, pets home, photo poses and props, the memory shelf, stargazing at the fire, the C6 mirror hand-off consumed by `dungeons.md`, CS-10's last shot |
| **5 Polish** | every `camp.*` and `amb.camp.*` cue (`audio.md`); Low and Medium scatter verified on a phone |

### 4.3 Build order

1. Tokens, the terrain plate with authored heights, the stream spline and water shader: the first capture has moving water.
2. Scatter with the cell hash, clearance and jitter; the seven `InstancedMesh` buffers; verify the rebuild-on-cell-crossing cost in the perf overlay.
3. The fire (ring, flame, embers, smoke, the pooled light on the oscillator), then the tent with its glow, then lantern L1–L3.
4. The remaining C1 props as static batches; the wreck stand-in; the paths and furrow decals.
5. The deer and its loop; the clouds below the rim.
6. Stations, `card.hold`, the two poses; the loop begins.
7. (Phase 2) the growth controller with C2–C4, rest and sit, pets. (Phase 3) C5–C6, S5. (Phase 4) C7, photo, memories.

### 4.4 Test hooks

- Dev console: `camp.stage <0–7>` (jump, no build-in), `camp.buildin <n>` (play the transition), `camp.rest dawn|dusk`, `camp.sit`, `pet.spawn fox|sugar|hens`, `pet.trust <0–5>`, `deer.phase <s>`, `clouds.freeze`, `card.hold`, `station <1–6>`, `scatter.seed <n>`, `scatter.count` (prints visible instances and draw calls).
- Vitest (`tests/unit/camp/`): flag → stage mapping for every `story-beats.md` flag; each stage's manifest is the previous plus additions minus the §2.6.1 removals (lean-to, furrow decals, the rod's old holder, the tarp roof); scatter determinism (same seed → identical instance hash; different seed → different); no scatter instance inside any prop footprint, path clearance or the fire disc; seat assignment (Liam's and Ed's at C1; Isabella's spot 1.03 m from Collette's); rest heals and moves the clock to 0.02 or 0.65 and is refused with an enemy within 20 m; fox trust increments only at night with the fox present; the three nearest lanterns are the pooled ones; `camp.lanternCount` never exceeds the hook count. Trim before adding (Working Rule 7).
- Smoke (`tests/smoke/`): the twelve station captures are non-black and differ between phases; a build-in completes within its stated duration with zero live particles left after 5 s; the title card is present at S1 and S2 captures.

### 4.5 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| 35,000 scatter instances | GPU instancing, seven draw calls, buffers rebuilt only on cell crossing, the 70 m draw radius, preset multipliers 0.35 / 0.6 / 1.0 |
| Many small cloth strips | one skinned cloth batch with per-vertex phase; closed-form sway, no simulation |
| Lanterns wanting lights at C6 | three pooled by distance, the rest emissive with bloom halos; a lantern that loses its slot fades over 0.3 s (world-events §4.6) |
| The cabin's and hangar's shadow casters | two merged static casters; small props do not cast |
| Smoke overdraw (fire, chimney, wreck) | six quads per column, alpha-tested, no depth write, capped at three columns on screen |
| Build-in dust bursts | the pooled dust emitter; ≤ 60 live |
| Water foam noise | one octave, scrolled in the vertex shader |

### 4.6 Persistence (versioned schema, Brief §7.1)

`camp.stage` (0–7), `camp.lanternCount` (0–4), `camp.foxTrust` (0–5), `camp.pets` `{ fox: bool, sugar: bool, hens: bool }`, `camp.memoryShelf` (ordered ids, Phase 4), `camp.photoSpotsUsed` (set), `camp.lastRest` (`p`). All reset on new game and NG+ (`story-beats.md` §2.6). Live props are never saved; the manifest rebuilds from `camp.stage`.

### 4.7 Rule 2 gates before code

three 0.185.1 `InstancedMesh` with per-instance colour attributes and `instanceCount` rebuilds; `onBeforeCompile` composition of the shared chunk with the emissive material's canvas-glow term; the water shader's foam against the heightfield; Kenney animal-pack GLB node and clip names; DOM title-card layering over the WebGL canvas with the tilt-shift pass. Record every verified shape in the task notes.

---

## 5. Cross-references and conflicts

### 5.1 Earlier design files, and what was taken

| File | Taken |
|---|---|
| `story-beats.md` | the camp's name and both card lines (§2.7); the position (0, 0), Ed's Landing (10, 0)–(70, 0) with the wreck at its west end and the hangar over it, Crash Meadow at (60, 0), the stream's endpoints, the pond, the Ridge, Lamplight Landing, goblin camps A–C, the hideout (§2.2); the eight stages and their flags (§2.3); the plane states; the beats at camp (B0.1, B1.2, B1.6, B2.1, B2.2, B2.15, B3.2, B3.5); the CS list (§2.10); the mirror rule (C6 → the Throne of Shadows); Ed is wherever the plane is |
| `world-events-weather.md` | the Forest keyframes and the camp light schedule (campfire, three lanterns, windows, glow caps, the stream's moon band, §2.1.3); the pilot's three clock phases and the weather toggle; `light.campfire`, `forest.lantern`, the torch oscillator (§2.8.2–2.8.3); the rest skip (§2.1.1); the light pool of 8 and its priority (§2.8.2); clouds two below the rim (§2.6); the deer, the fox at 12 m, the owl, songbirds (§2.7.1); the camp stream fishing spot, the bobber, the rod flag (§2.7.2); stargazing and the sit (§2.7.3); `camp.lanternCount` (§2.5.2); pets outside the 24-animal budget (§5.2); the ambient particle tokens and the sway uniform (§2.4.2) |
| `heroes.md` | the summary card and tokens (§2.0, §2.1.1); the idle ladder and the 30 s sits, Collette's spiral, the copycat, companion distances and Isabella 1.0 m from Collette at camp (§2.4.6, §2.5.11); the pilot Liam, the ring and its night light, the two scored poses (§2.7); the hue-reservation rule's scope (enemies and NPCs) (§2.1.3) |
| `enemies.md` | no nest or camp within 30 m and the 40 m leash (§5); the cage lantern `#FFD08A` 2.0 · 6 m and the brazier `#FF5A2A` 2.0 · 7 m tuned beside the campfire `#FF9A3C` 2.5 · 9 m: the family fire is yellower and larger than the horde's, the freed lantern is the fire's own colour (§2.8); the fence under the 1.2 m flier pass-over (§2.2); the Slime Puddle nest and the Blob rig for Sugar (§2.8, §2.3) |

### 5.2 What later files must pick up from this one

| File | Must pick up |
|---|---|
| **`npcs.md`** | Ed's spots (§2.3.3): the stump (1.9, −0.5), the wreck's nose (11.0, 1.2) C1–C3, the hangar front (16.5, 2.8) C4, the bench (9.6, 0.6) C5+, the apron (22, 0); the merchant's spot (9.5, −6.2) at his cart and the cut relocation; the guides never visit; the plane's assumed envelope ≤ 6.5 × 8.0 × 2.6 m and the hangar's 9 m × 3.6 m clear opening (confirm or the hangar grows); the `wrecked` mesh at the furrow's west end and the `hopping` swap at C4's 17 s; the build clips `ed_hammer`, `ed_saw`, `ed_hoist`, an `ed_sit` on the stump and whittling from C4; the spare goggles prop on the scarecrow; the windsock as the plane's wind reference; supply drops within 60 m of the strip but never inside the C6 footprint except the strip and apron; the plane parked on the apron (24, 0) from C7; the title's plane pass over the Ridge at 18 m; Ed's greetings at the fire |
| **`dungeons.md`** | the C6 mirror table (§2.8) as the Throne of Shadows' set; the mirror-fire prop (§2.7.6) under the `shadow.mirrorFire` token it owns; the corrupted hearth arena centred on the fire; the seats present and the stump empty; no rest or sit prompt there |
| **`bosses.md`** | the shadow squad may open its set piece seated in the kids' four seats at the mirror fire (§2.7.6); the Goblin King's arena is bounded on the south by the stream at `z` 24–29 |
| **`ui-ux.md`** | the title station S5 and the scene preset (§2.12); the two camp cards and their triggers (§2.11.8); the prompts `Rest` (with `Until dawn` / `Until dusk`), `Sit`, `Keep it` rendered from the live binding; `Bounties`, `Merchant`, `[SPACE] Trade` canon strings and the board's `!`; the photo poses, spot stones and posable props (§2.10); the crest's banner material slot and door plaque; the memory shelf and the loading-screen memory render from S1; pet name plates and the fox's scrapbook card; the constellation cards on the sit; the P2 name collision ("camp" is the horde's word; the hub is `Stewart Camp` in copy) |
| **`cutscenes.md`** | CS-01's C0 set (§2.1, §2.2 #8–12): the wreck nose-down at (11.5, 0.4) heading 262°, the furrow from (70, 0), the tarp over the engine, the 5-stone ember ring, Liam down beside it; CS-03's scene 1 from Liam's log at (−1.85, 0.4) looking north-east: the crater at (120, −120) is at bearing 45° from the fire and the sightline is kept clear between bearings 20° and 60° (P2 moved to (3.5, −13.5); the hangar's corner is at 61°); CS-07 from the same seat; CS-05 on the apron; CS-10's last shot is S5 with C7 (§2.12) |
| **`audio.md`** | `amb.camp.fire` (gain follows `flVal`), `amb.stream`, `camp.hammer`, `camp.saw`, `camp.shingle`, `camp.rope.creak`, `camp.gate.latch`, `camp.sign.creak`, `camp.halyard`, `camp.lantern.light`, `camp.build.done`, `camp.rest.sweep`, `camp.sit`, `camp.hen`, `camp.fox.yip`, `camp.slime.blorp`, `camp.windsock`, the fire's pop; the `questComplete` cue the bounty board never had (SYSTEMS_INVENTORY §25.2) needs a defined sound |
| **`heroes.md` addendum (collected by the orchestrator)** | a `sit_down` / `sit_idle` / `stand_up` clip set per kid (0.6 s in and out) with the seated idles of §2.7.2; Liam's fire-poke; the carry socket already requested by world-events; the pose arrangements of §2.10 reuse existing clips |
| **`world-events-weather.md` (consistency pass)** | the below-rim clouds are visible only from a camera within about 24 m of a rim at gameplay pitch (§2.11.5); the two lantern value sets (§5.3 item 2); the axis sentence (§5.3 item 3) |

### 5.3 Conflicts found, and how this file designs around them

1. **`heroes.md` §2.7.6 names the cabin windows at the night station; the pilot camp is C1 and has no cabin (the cabin is C5, `story-beats.md` §2.3, final).** Resolved without touching either: the tent lit from inside uses the same `forest.window` token on the same schedule (§2.11.4), so pose 2's "two warm-cool sources" holds at C1 and the cabin takes the role at C5. Logged in §6.
2. **`world-events-weather.md` gives two values for a placed lantern:** §2.1.3's camp lanterns `#FFB347` · 1.2 · 6 m and §2.8.2's `light.lantern` 1.0 · 4 m placed. This file uses §2.1.3's values for the three pooled camp lanterns (they are the explicit camp schedule) and asks the consistency pass to make §2.8.2 say so.
3. **Axis convention.** `story-beats.md` fixes `+z` south (final); `world-events-weather.md` §2.1.2 says "the island's north is +Z". Its azimuths (dawn 80° east, noon 180° south, golden hour 245°, moon 130° at night) are read here as compass bearings in the `story-beats.md` frame with north = `−z`; every station's sun and moon direction in §2.11.5 assumes that. One-line erratum for the consistency pass.
4. **`enemies.md` §5 asks that the cage and brazier tokens be tuned beside the camp fire.** Done in §5.1's row; no change needed to either file.
5. **The task brief's "four log seats plus Ed's stump."** Delivered as four seats on three logs (the girls share one) plus the stump, because the shared log is `heroes.md`'s adjacency rule as a prop. Logged.
6. No conflict with `story-beats.md`: every fixed position, flag, name and line is used as given; the stream's course inside its endpoints is this file's (the endpoints and the bend near the hideout are honoured, §2.3.2).

---

## 6. Decisions logged

Merged into `docs/DECISIONS.md` by the orchestrator after review.

- 2026-09-06 · phase-0.5/camp · The stream is routed through the camp's south edge, 14 m from the fire, south of the strip and Crash Meadow, and is the camp's south boundary · the reference's stream cuts the meadow and the pilot's second scored pose is the walk to it; a straight line between story-beats' endpoints would pass 25 m out and cross the runway · rejected: the straight course, a course north of the strip.
- 2026-09-06 · phase-0.5/camp · The family's colour story is teal-slate `#2B5F6B` + honey wood + cream, on the tent from C1 so the C5 cabin's teal roof rhymes with the first night · Brief §4.1's teal-slate roof, deep not pastel; rust is the horde's tent colour (enemies.md) · rejected: a cream canvas tent (pastel at scale), a rust or ochre tent (reads as goblin).
- 2026-09-06 · phase-0.5/camp · One family check pattern (cream, teal-slate, one honey stripe) on bedrolls, curtains, bunting, the picnic blanket and the fox's bed · one motif ties every stage; the parachute's red-and-cream would sit in Isabella's ruby band at prop scale · rejected: red-and-cream, no pattern.
- 2026-09-06 · phase-0.5/camp · The tent glows from inside (emissive `forest.window` on the lantern schedule) and is the pilot's warm source in place of heroes.md's "cabin windows" at the night station · the pilot is C1 and the cabin is C5 (story-beats, final); the token and schedule are identical, so the pose holds · rejected: adding the cabin to the pilot scene (breaks the stage logic), changing the pose.
- 2026-09-06 · phase-0.5/camp · Seats: Liam west facing the way in, Noah north facing the stream, Collette and Isabella on one shared 2.1 m log 1.03 m apart, Ed's stump east with his back to the plane · heroes.md's adjacency rule as a prop; the leader watches the entrance; Ed sits by his plane · rejected: five equal logs on a circle.
- 2026-09-06 · phase-0.5/camp · Rest heals to full and clears DoTs, gated on no enemy within 20 m, and costs time (the clock moves, nests re-arm at dawn, weather re-rolls) · a hearth that does not heal is not a hearth; potions keep their field value · rejected: a time-skip only, a gold cost.
- 2026-09-06 · phase-0.5/camp · The rest prompt offers `Until dawn` / `Until dusk` as two options and `Sit` as a third, all new text · world-events' skip needs a choice; sitting is the peaceful verb and the stargazing entry · rejected: a single "Rest" that always goes to dawn.
- 2026-09-06 · phase-0.5/camp · Stages build in over 12–20 s when the squad next comes within 35 m after the flag, with Ed seen building, props rising with crate-dust and wood knocks, hammer/saw/chime sounds, and the title card re-shown · the change must be seen from the way in and remembered; a hub that changes off screen is a menu · rejected: instant swaps, a cutscene per stage.
- 2026-09-06 · phase-0.5/camp · Bedrolls are never assigned to kids (two in the tent, two under the wing at C2; the tent keeps one from C5) · who sleeps where is a household fact the canon does not state (Brief §2(b)); the one canon "room" line is delivered at B1.4 by story-beats and needs no prop · rejected: girls' tent and boys' wing, cabin rooms.
- 2026-09-06 · phase-0.5/camp · The washing line carries four garments in the kids' `base` colours from C2 · the family is visible even when the kids are away; the hue-reservation rule governs enemies and NPCs, not the kids' own clothes · rejected: generic laundry (loses the read), no line.
- 2026-09-06 · phase-0.5/camp · Pets are the fox (trust earned by night rests from C3), Sugar the slime (post-Hollow-Grove, `Keep it`) and three unnamed hens (C5); they come home for good at C7 per story-beats; no dog and no cat · Brief §5.5; a family dog would invent a fact about the real family; the fox stands in; the slime makes enemies.md's bestiary line true · rejected: a dog, pets from minute one, pets only after the ending.
- 2026-09-06 · phase-0.5/camp · Pet names `Orange Meanie` and `Sugar` in the canon's pun voice, stored as one-line data and never spoken in dialogue · the task asks for names this family would pick; canon's naming voice is Ed's puns and tip 5; they assert nothing about real people and are trivially changeable · rejected: unnamed pets (a weaker capsule), names from outside canon.
- 2026-09-06 · phase-0.5/camp · Twelve lanterns at C6: the three nearest the camera pooled at `forest.lantern`, the rest emissive with bloom halos; seven named hooks, four reserved for `camp.lanternCount` · "lanterns everywhere" inside an 8-light pool · rejected: twelve lights, three lanterns.
- 2026-09-06 · phase-0.5/camp · The crest hangs on a 5 m banner pole at (5.5, −6.5) between the hearth and the hangar, plus a carved plaque on the cabin door; both read `crest.level` · visible from the fire, the strip and the title camera · rejected: painted on the hangar, a flag on the cabin roof.
- 2026-09-06 · phase-0.5/camp · The v27 bounty board drawing is kept as the 3D board (post, planks, two paper colours, nail dots, the ⚔️ glyph, the `!` at `0.6 + 0.3·sin(4t)`); the merchant gets a fixed cart and stall and his relocation is cut at camp · the board is the one v27 camp object a kid knows; a hub's merchant must be findable · rejected: a new board design, the wandering merchant.
- 2026-09-06 · phase-0.5/camp · Scatter densities per m² by zone (core 7.7, meadow 3.6, canopy 4.3, bank 9.2) with v27's `(gx·73 + gy·137) % 100 < 15` on 1.5 m cells adding bonus clusters, and a hero-path clearance rule · the reference's "nothing is empty"; the v27 hash keeps placement deterministic and save-compatible · rejected: uniform noise, a single density.
- 2026-09-06 · phase-0.5/camp · One `InstancedMesh` per scatter type per island with buffers rebuilt on camera cell crossing within 70 m · seven draw calls for 35,000 instances · rejected: per-cell meshes (about 200 draw calls).
- 2026-09-06 · phase-0.5/camp · No tree or boulder within 6 m of the fire (v27's 220 px spawn clearing, 5.5 m, rounded up) · keeps the hearth open to the sky and the camera; the v27 clearing's one good idea · rejected: trees closer for cosiness (they block S1 and the crater sightline).
- 2026-09-06 · phase-0.5/camp · The pilot island is the camp quadrant, `x` −52 to 62, `z` −50 to 50, at `layoutScale` 1.0 · positions are final and nothing is rescaled; the full 360 × 300 m island is Phase 2 work · rejected: the full island in Phase 1, a rescaled 80 m island.
- 2026-09-06 · phase-0.5/camp · Four fixed stations (S1 Hearth, S2 Stream walk, S3 Wreck and strip, S4 Pond and rim) at vertical FOV 35°, d 19–22, pitch 45–50°, with S4 sited 7 m from the west rim · a gameplay frame at these pitches contains ground only; only a near rim shows the void and the below-rim clouds · rejected: a sky-showing low-pitch gameplay station (not the gameplay camera), four hearth angles.
- 2026-09-06 · phase-0.5/camp · The title screen is a fifth station at pitch 14°, FOV 34°, 40 m from the fire across the stream, with the plane crossing the Ridge at 18 m altitude and a 60 s dolly · story-beats' B0.1 needs the Ridge and the plane in frame, which no gameplay pitch allows · rejected: a gameplay-pitch title, a fly-in.
- 2026-09-06 · phase-0.5/camp · The mirror fire burns downward with falling embers and sinking smoke on the same oscillator at half rate · a recolour alone is not "wrong"; inverting the fire's three directions is · rejected: a cyan recolour only, no fire.
- 2026-09-06 · phase-0.5/camp · The fire grows S1–S4 (flame 0.3 → 0.9 m, logs, apron, tripod) while `light.campfire` stays at world-events' token · the flame is the camp's prop; the light is the world's budget · rejected: growing the light's range with the stage.
- 2026-09-06 · phase-0.5/camp · The fence is collision at 1.1 m with three openings (the strip gap under the crossbar, the north-west gate, the footbridge) and is under the flier pass-over height · a fence a hero walks through is a decal; three openings keep the camp porous · rejected: no collision, a fully closed ring.
- 2026-09-06 · phase-0.5/camp · The fishing rod is Ed's, visible in the wreck at C1, usable from C3 at the pool bank (`flag.fishingRodOwned`), and moves to the dock at C7 · world-events left the rod's origin open; the wreck's cargo is the least new fact; fishing should not wait for the post-game · rejected: a supply-drop rod, a merchant rod, a Gran-linked rod.
- 2026-09-06 · phase-0.5/camp · The hangar is 11 × 9.5 m with a 9 m × 3.6 m open east front over the wreck's position, and the plane's envelope is assumed ≤ 6.5 × 8.0 × 2.6 m pending npcs.md · story-beats fixes the hangar over the wreck; a stated assumption beats a silent one · rejected: waiting for npcs.md.
- 2026-09-06 · phase-0.5/camp · The memory shelf is on the cabin's porch, and the cabin has no interior · Brief §5.2's "point back here" needs a visible place; an interior is a second scene and a second camera · rejected: an enterable cabin.
- 2026-09-06 · phase-0.5/camp · Photo mode offers six family poses, every victory and emote clip, five photo-spot stones and three posable props · Brief §4.5 family poses with no pose editor · rejected: a free pose editor.
- 2026-09-06 · phase-0.5/camp · The bounty board's undefined `questComplete` sound gets a defined cue via audio.md · v27's silence was a missing key, not a choice · rejected: keeping it silent.
- 2026-09-06 · phase-0.5/camp · The chimney smokes in the evening schedule and whenever it rains by day · smoke is the cabin's motion source and rain is when the family is inside (world-events' sheltering) · rejected: always-on smoke.

---

## 7. Reconcile when the brainstorm doc lands

- If the brainstorm resolved a home-base design (a name, a layout, specific buildings, who builds what), its resolutions win over §2.3's layout with a §6 line naming what this layout loses; positions fixed by `story-beats.md` stay.
- If it named pets or a family animal, replace `Orange Meanie` and `Sugar` with its names (one-line data) and log it.
- If it specified photo mode or memory collectibles, reconcile §2.10's poses and the porch shelf with it.
- If it placed the fishing rod's origin, replace §6's rod decision.
- Any resolved decision about the tent, the cabin's interior, or a cellar or workshop for Ed (canon: "Reminds me of my workshop") supersedes the no-interior rule.

## 8. Open questions for the orchestrator

None. No Brief §2(b) portrayal question arose: the pet names assert nothing about real people and are data; bedrolls are unassigned; the four painted stones carry initials the canon already scratches into rocks; Ed's stump, bench and cot are props, not claims about how he lives. No Rule 1 input was missing for this system (the plane's dimensions are a stated assumption for `npcs.md`, not a blocker).
