# Dungeons — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** BRIEF §0–§11 in full (§5.3 twice, §5.1 curved-world note, §5.4, §4.3, §6, §7.4, §8) · ATMOSPHERE_RECIPES §19, §3.2, §6.2, §7.4, §8, §15.5 · SYSTEMS_INVENTORY Part 2 §11 in full (L4071–4566), §3.9 (L3226–3235), §12 (L4567–4608); Part 1 §23.9 (L2317–2335), §28.3 (L2723–2739), §29 (L2787–2854) · FAMILY_CANON §2.1 (L186–232), §2.4 (L264–283), §4.1 (L455–497), §6.6 (L778–798), §10.1 (L925–937), §10.5 (L975–986), §11.2–11.3 (L1020–1045), §12.8 (L1369–1392), §13 (L1415–1466) · AUDIO_INVENTORY §9.3 (L388–407), §13 (L507–596) · CONTROL_MODEL §3.7 (L365–372), §4.2 (L421–427) · legacy HTML L491 (`⚔️ ENTER`), L6756, L6900–6934 (desert and swamp entrance art), L7169, L8145–8238 (puzzle strings), grep-verified · `docs/DECISIONS.md` in full.
**Depends on:** `heroes.md` (§2.0, §2.5.1, §2.5.5, §2.5.11, §5), `enemies.md` (§2.2, §2.4, §2.5, §2.8, §2.9, §5), `story-beats.md` (§2.1, §2.2, §2.4, §2.5, §2.6, §4, §5), `world-events-weather.md` (§2.1.1, §2.1.4, §2.2.3, §2.2.5, §2.3.4, §2.4.2, §2.8, §5.2), `bosses.md` (§2.0, §2.1.5, §2.3, §2.5, §2.7–2.16, §5.2), `camp.md` (§2.7.3, §2.7.6, §2.8), `npcs.md` (§2.6.3, §2.8.1, §2.9, §5.2).
**Feeds:** `ui-ux.md`, `audio.md`, `cutscenes.md`, `world-builder` (entrances, the Rootways district, the Witch's Lanterns path, the Crystal Caves, the shard), `dungeon-designer` (one dungeon at a time).
**Brainstorm doc:** not available at time of writing — reconcile on arrival (§7).

v27's five dungeons were one procedural room-set in five palettes. They become five hand-authored places with five different rules: the Hollow Grove moves on a beat, the Buried Tomb changes the height of its floor and bends sunlight, the Sunken Temple shows only what you carry light to, the Ice Citadel will not let you stop and takes its power from the sky, and Home, Wrong turns all four of those around with one warm light the kids cannot reach.

---

## 1. What v27 does

SI = SYSTEMS_INVENTORY Part 2 unless marked P1; FC = FAMILY_CANON; AR = ATMOSPHERE_RECIPES; AU = AUDIO_INVENTORY; CM = CONTROL_MODEL. Every metre here is v27 px × 0.025 (40 px = 1 m, `heroes.md` §2.5.1).

**One room grammar, seven skins (SI §11.1, §11.3).** Every room is a fixed 16 × 12 grid of 40 px tiles (`DNG_TW=40`, L4080), which is **16 × 12 m** at the world scale, drawn centred in the canvas with the camera forced to `(0,0)`. Tiles: floor, wall, four two-tile doors, spawn marker, pressure plate, push block, chest, spike trap, lever (no template contains one), cracked wall (written at runtime into an ability room). Three fixed structural templates (`hub`, `treas`, a null `bossv7` that falls back to the generic boss template) and one to two hand-authored combat / puzzle / trap variants per biome (`BIOME_TEMPLATES`, L6764–6820) whose comments name intents ("vine corridor", "sarcophagus blocks", "flooded channels", "ice barrier arena") that the drawing could not deliver. Seven `DUNGEON_NAMES` and descs, seven `DUNGEON_COLORS`, per-biome floor/wall/accent/door tiles, three-tone wall variation, `DNG_AMBIENT` darkness plates (§11.1; AR §6.2), `DNG_ATMO` particle recipes (AR §8.1), three breakable `DNG_DECOR` props (pot, crate, bones) with the game's only data-driven sound lookup (AU §13), and six `DUNGEON_EQUIPS` party-wide rewards (P1 §23.9). Citadel floors reuse `cave` / `swamp` / `frozen` templates; their `rooms`, `hazard` and `miniBoss` fields are declared and never consumed (§11.3).

**Procedural graphs (SI §11.6).** A 4 × 5 slot grid, 7–10 rooms grown by random attachment, quotas (combat ≤ 4, puzzle ≤ 2, treasure ≤ 2, rest 1, ability 1 when ≥ 2 heroes are unlocked), the boss attached beyond the BFS-farthest room behind a `DOOR_LOCKED` door, the key in the treasure room nearest the boss, a linear six-room fallback after ten failed attempts. `DUNGEON_LAYOUTS` (a fixed six-room order per biome) is read only for its first entry's lore string. So every dungeon is the same graph with the same room types; nothing in the graph knows which dungeon it is.

**Run flow (SI §11.4–11.5, §11.10–11.11).** Walk within 1 m of an entrance → a paused DOM overlay (name in the biome colour, `<BIOME> DUNGEON`, the desc, `⚔️ ENTER` / `CANCEL`) → `enterDungeon` snapshots the overworld, resets hero stats (the bug at P1 §29 that wiped skill trees, worked around by a 41-field restore on exit), generates the graph and plays the letterbox card. Rooms load one at a time; a door trigger band starts a 0.6 s slide during which the sim is paused and the room swaps at 0.3 s; heroes appear on the wall opposite the door they used. Combat and ability rooms lock every door (`bars_slam`), spawn waves, and unlock on the last kill (`Room cleared!`, `equip` 0.3). Puzzle rooms lock until every plate is held. A per-room minimap panel (120 × 100 px) draws visited rooms, connections and lock glyphs; the HUD shows the dungeon name, `Room N/M`, `🔑 N` and `🔒 LOCKED`. Walking south out of room 0 is a retreat (`showDungeonFail`, 30 % of the run's XP). Victory: `<name> CLEARED!` with the `DUNGEON_EQUIPS` card, then `exitDungeon(true)` restores the overworld, sets `dungeonProgress[biome]`, awards XP, the equip, `Dungeoneer`, +30 gold, +1 skill point to all four, `Ed's Landing` at exactly 1 HP, and fires the quest and bounty hooks. **A cleared dungeon cannot be re-entered** (the entrance collision requires `dungeonProgress[biome]` false, L9320), which is what made `ground_ed_3` unfinishable when the cave was cleared early (story-beats §2.2). Saving inside writes the overworld snapshot flagged `_dungeonSave` (P1 §28.3): dungeon progress is never saved.

**Waves (SI §11.8).** `count = min(3 + floor(roomIndex/2) + waveNum, 8)`; hp `×(1 + 0.03·teamLv)(1 + 0.3·(players − 1))`, dmg `×(1 + 0.03·teamLv)`, spd `×(1 + 0.01·teamLv)`; Citadel floors add `enemyScale` 1.5 / 2.0 / 2.5 and one more enemy, capped at 10. Pools per biome are reproduced verbatim in `enemies.md` §2.5.

**Keys, locks, puzzles (SI §11.2, §11.9, §11.13).** Four door states, one of which (`DOOR_CLOSED`) is never assigned. Keys from key chests (`Dungeon Key found!`), consumed at a locked door (`Door unlocked!`). Levers retract bars (`Bars retracted!`). Plates are held by any hero or a push block (`plate_click`, `Puzzle solved!`); blocks push cardinally on the grid (`rock_slide`). Spikes cycle on a 2 s period. Biome hazards per room: desert `sand_slow`, cave `crystal_glow`, swamp `poison_patch` 4 dmg, frozen `ice_tile` (a reduced-friction slide), forest `vine_snare` (`Snared!`), volcanic `lava_tile` and `eruption`; Citadel floors get none of these and instead spawn spikes (floor 1) or hurt heroes at the room border (floor 2); floor 3 has no coded hazard. **Ability rooms** (§11.9, FC §2.4): one per dungeon, the hero chosen at random from the unlocked set; a cracked wall for Liam, a target switch for Noah, a three-press magic seal for Collette, a gear lock for Isabella; the hint, success and wrong-hero lines are canon and duplicated in two code paths (FC §13.3). Success drops a bonus chest.

**Light and air (AR §6.2, §8, §19.1).** The one real lighting system in v27 is here: a tinted darkness plate punched through by the hero pool (120 px, 180 in boss rooms), 4–6 wall torches whose flame shape and light pool share one 8.8–10 Hz oscillator, projectile, enemy and boss glows, with the atmosphere particles drawn on top of the darkness so they glow. Desert is the brightest (0.62), frozen the darkest (0.73). The Citadel's three floors get darker while the air thickens and turns red (AR §15.5).

**Entrances (AR §7.4; legacy L6833–7043).** Seven hand-drawn dioramas: a hollow ancient tree with breathing canopy blobs and interior fireflies (forest), a crystal rock mass with orbiting sparkles (cave), a sandstone temple front with tapered pillars, a lintel, an eye emblem and glowing hieroglyphs (desert, L6901–6926), an overgrown sunken ruin with crumbling mossy pillars and a broken lintel (swamp, L6929–6934), an ice arch with the aurora shimmer (frozen, AR §3.2), a jagged obsidian rift (volcanic), and the citadel; six orbiting motes and a pulsing ground ring while uncleared, a `✓` and a flat ring once cleared; a name pill with `Press to Enter` / `✓ CLEARED`.

**Oddities that change this design (SI §11, P1 §29, FC §13).**

| Oddity | Consequence here |
|---|---|
| Every dungeon is the same graph and the same seven tiles; the authored biome templates could not draw their own intents | Hand-authored room graphs and layouts per dungeon (§2.1.2); the intents ("vine corridor", "flooded channels", "ice barrier arena") become real mechanics |
| The 0.6 s room slide pauses the sim and teleports heroes to the opposite wall | Contiguous rooms and real doorways (§2.1.3); no slide |
| Cleared dungeons cannot be re-entered; `ground_ed_3` could dead-end | Cleared dungeons stay open as quiet places (§2.1.6); story-beats already moved the plug to a lair |
| Dungeon progress is never saved; the run is one sitting | Hearth checkpoints inside the run (§2.1.6); the overworld snapshot rule of P1 §28.3 is kept underneath |
| `resetHeroStats` on entry wiped skill trees; a 41-field restore hid it | Gone with `heroes.md`'s baseline recompute; nothing here snapshots stats |
| `DOOR_CLOSED` never assigned; `puz` template never referenced; `CITADEL_FLOORS` fields never consumed | Doors have three states (§2.1.4); the Citadel's floor names, hazards and mini-bosses are finally used, as Home, Wrong's regions |
| The ability room's hero is random; the object is a tile or a pinned sprite | One hero per dungeon, on the critical path, as a room built around that kid (§2.1.9) |
| The Sunstone Crest writes `critRate` and does nothing | `heroes.md` §2.5.10 already writes `crit`; the reward card stays verbatim |
| `Isabella breaks the gears!` announced in two colours | One colour: her `glow` `#FFD966` (§2.1.9) |
| The minimap panel and `Room N/M` HUD | A room strip on the compass with the canon strings (§2.1.10) |
| The clock froze inside dungeons | It runs (`world-events-weather.md` §2.1.1); two dungeons depend on it (§2.3, §2.5) |
| Floor-2 border damage `floor(5·dt)` per frame (the DoT accident of `bosses.md` §1) | Every dungeon DoT uses `bosses.md` §2.1.4's 4 Hz accumulator |

---

## 2. What it becomes

### 2.0 Dungeon roster

Canon card names and descriptions are verbatim (FC §11.2). Districts are the Brief §5.3 names (`story-beats.md` §2.2). Rooms on the critical path count the entry hall and the boss hall. Room and mechanism names marked **[new text]** are new; they are build ids and quiet name cards (§2.1.10), never spoken.

| # | Dungeon (card name · description) | District · island · entrance | Core mechanic | Traversal | Puzzle language (three or four types) | Set piece | Ability room | Boss (`bosses.md`) · reward | Rooms on the critical path (+ optional) | Phase |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **The Hollow Grove** · `Ancient roots twist into a maze of thorns. The Treant awaits.` | the Rootways · Forest · the root arch at (172, 28) | **Root rhythm**: root walls rise and retract on a 12 s heartbeat in three phase groups, reshaping every route | **Canopy tiers**: three terraces (0 / +4 / +8 m) joined by root ramps and lift boughs | rhythm gates · sapling seals · glow-moss paths (Collette's light) · weighted stumps and root-bound boulders | **The Heartwood Well** [new text]: a 14 m shaft climbed on boughs while the roots close below and the canopy opens to the sky | Noah: `A distant target... Noah could hit it!` (the Pod Gallery) | Ancient Treant · Hearthroot Seed | 10 (+2) | 2 |
| 2 | **The Buried Tomb** · `Sand-swept corridors hide cursed chambers. The Pharaoh stirs.` | the Sunken Pyramid · Desert · the hatch at the pyramid's tip, (120, 60) | **Sand-flow**: rooms fill and drain between three levels via levers; the floor's height decides which doors exist | **Sand rides and slides**: the party rides draining sand down between tiers; sandstorm chambers with walking dunes | sand levers · sunbeam mirrors · scarab jars and beam lanes · sandstorm cover | **The Hourglass** [new text]: the pyramid's shaft drains under the party's feet over 20 s while skeletons rise from the pour | Liam: `These cracks look weak... Liam could smash through!` (the Cracked Cistern) | Pharaoh Wraith · Sunstone Crest | 10 (+1) | 3 |
| 3 | **The Sunken Temple** · `Toxic waters flood forgotten halls. The Hydra nests below.` | the Witch's Lanterns · Bog · the drowned steps at (−30, −110) | **Darkness**: `dark 0.85`; only the carried Rusted Lantern, lit sconces and Collette's orb reveal anything | **Sinking lily pads** across black water; the mist tide that smothers flames | sconce chains · wisp following (amber guides, green misleads) · the tide and the pads · the lantern relay | **The Drowned Nave** [new text]: twelve column sconces lit in a chain down a flooded hall while the water rises and Wraiths condense | Collette: `A magic seal... Collette could channel it!` (the Sealed Cistern) | Hydra Matriarch · Marshlight Vial | 10 (+1) | 3 |
| 4 | **The Ice Citadel** · `Ice walls echo with dark magic. A lich commands the frost.` | the Hermit's Observatory · Frozen Peaks · the ice arch at the tower's base, (140, −90) | **Ice momentum**: acceleration ×0.25 and a 6 m slide on ice; enemies slide too | **Rope lines** through open-sky blizzard galleries (`visOverride 4`); an aurora-powered lift | crystal resonance (strike in sequence) · aurora power (night) · sliding blocks and bell plates · rope lines | **The Orrery** [new text]: Isabella frees the jammed drive, the great ring turns and the dome irises open to the aurora | Isabella: `Gears are jammed... Isabella could break them!` (inside the Orrery) | Frost Lich · Hearthice Crown | 11 (+1) | 3 |
| 5 | **Home, Wrong** (regions carry the canon floor cards `Shadow Citadel — Floor 1` / `Outer Ward`, `— Floor 2` / `Inner Sanctum`, `— Floor 3` / `Throne of Shadows`; the shard's card carries `The ultimate darkness awaits within. Three floors stand between you and the Citadel Warden.`) | the whole Shadow shard, 160 × 140 m · entered only by the crater portal | **Composition, turned wrong**: roots that rise at your approach, moss that dies in carried light, sconces that cannot be lit, ash that rises instead of sand, ice on the frozen stream, a dead aurora conduit | one way forward; the mirror bridge, the uphill crossing, the ash basin | the Four Locks [new text] (all four ability objects in canon order) · the composed mechanics of the other four | the shadow squad at the cold mirror fire (`bosses.md` §2.14) | all four, at the Four Locks | Stone Sentinel, Phantom Warden, Citadel Warden, the Shadow Queen · legendaries on the Queen | 4 regions, 11 spaces | 4 |

Previews outside the five (§2.7): the **Crystal Caves** under-region ("only Quartz's lamps and Collette's magic light it") and the **Witch's Lanterns** overworld path (seven posts, `npcs.md` §2.9.2). Lairs (the Depths, the Rift) are `bosses.md` §2.11 and §2.12 and are not redesigned here.

### 2.1 Rules that hold for every dungeon

#### 2.1.1 Scale, rooms and the camera

- **Standard room 16 × 12 m** (v27's 16 × 12 tiles at 40 px, the strict conversion). At the gameplay rig (pitch 45–55°, distance 19–22 m, vertical FOV 35°, `camp.md` §2.11.5) that is one frame: about 22 × 16 m of floor is visible, so a room is seen whole from its doorway, which is the v27 read and the reason rooms stay this size. **Boss halls 20 × 16 m** (`bosses.md` §5.2, with the ×1.25 follow blend). **Set-piece rooms up to 24 × 20 m** with a scripted camera lift (§2.1.3). Corridors 4 m wide, 6–20 m long. Rest rooms 10 × 10 m. Treasure rooms 8 × 8 m. Ability rooms 14 × 12 m. Antechambers 8 × 8 m. Walls 1 m thick and 5 m tall in rooms, 4 m in corridors.
- **The dollhouse rule.** Rooms have no rendered ceiling. At the gameplay pitch the camera sits about 15 m above the floor, above any ceiling a room could have, so a ceiling is a lid on a diorama. In its place, every dungeon hangs its own fringe 1–2 m in from the wall tops at 5 m (roots and moss, sand-spout lintels, dripping vines, icicle rows, ash-root claws) and the fog above is the dark. Walls on the camera's side of the active hero fade to 25 % (dithered, over 0.2 s) when they cross the line from the camera to the hero. Rooms may be stacked vertically (the Ice Citadel is a tower) because only the current room and the rooms visible through its open doorways are rendered (§2.1.3); a room above never occludes the one you are in.
- **Tiers** are terraces: an upper tier is offset in plan from the tier below except in the two vertical shafts (the Heartwood Well, the Hourglass), where the camera rises with the party and the lower tier becomes the view below.
- **The curved-world shader is off in dungeons** (Brief §5.1). Its depth cue is replaced by five things that are already in the recipe: tinted height fog (`dng.*`, near / far from the camera so the far wall of a 16 m room dims and a 24 m hall's end is lost), the terrace steps, the wall-top fringe silhouettes against the fog, the unrendered dark beyond a closed door (a doorway is a black hole in the wall until it opens), and the always-on vignette. Open-sky rooms (flagged per room) blend the island keyframe at `1 − dark` (`world-events-weather.md` §2.8.1) and show the real sky.
- Every number below is metres and seconds; every v27 value is converted at 40 px = 1 m unless a row says "design value" with its reason.

#### 2.1.2 Authored macro, seeded micro

Each dungeon is a **hand-authored room graph and layout**: rooms with fixed sizes, positions, tiers, doors and locks; a fixed critical path; fixed set-piece, ability, rest and boss rooms; fixed puzzle placements. Seeded per save from the world's `noiseSeed`: decor prop placement and which 30 % of jars are scarab jars, torch positions on the eligible wall segments, wave composition and spawn points (always from the reachable set, v27's `dngFloorPos` rule), which of two authored variants each **optional** side room uses, and which of three candidate spots holds each bonus chest and lore plaque. NG+ re-seeds. What never changes is the shape a kid remembers: where the Well is, where the Orrery is, which door the key opens.

#### 2.1.3 Run flow in 3D

| Step | Rule |
|---|---|
| **Approach** | The entrance prop (§2.2–2.6 name theirs) shows the canon pill: the name always, `Press to Enter` within 4 m (v27 160 px), `✓ CLEARED` once cleared. Six orbiting motes and the pulsing ground ring while uncleared, the ring flat at 0.15 once cleared (AR §7.4, kept). |
| **The card** | Interact within 2 m (v27 40 px was 1 m; 2 m so a kid does not have to touch the door): the DOM entry card, sim paused (v27): the name in the dungeon colour, `<BIOME> DUNGEON` (`FOREST DUNGEON`, `DESERT DUNGEON`, `SWAMP DUNGEON`, `FROZEN DUNGEON`; the shard's card is §2.6.1), the desc, `⚔️ ENTER` / `CANCEL`. Cancel sets the v27 2 s cooldown. At the Hollow Grove only, the four-line `dungeon_enter` exchange fires on the walk up, before the card (§2.2.9; story-beats §2.5). |
| **The threshold** | On `⚔️ ENTER`: the intro grammar of `bosses.md` §2.3, verbatim timing (freeze, `#0B0E1A` bars 0.5 s, the card at 0.8 s with the name over `<BIOME> DUNGEON`, `snd('boss', 0.5)`, out at 3.2 s, bars out 3.6 s, resume 4.1 s) on a **threshold rig**: the camera behind the party at pitch 32° looking into the dark doorway, pushing to 0.72× distance over 1.5 s; the party's walk-in clip plays on the presentation clock so at 4.1 s the four are standing in the entry hall. `screenShake(12, 1)` under the frozen frame is kept: the place trembles before it lets you in. Multiplayer guests see `Entering <dungeon name>...`. |
| **Rooms** | Contiguous space: a doorway is a real 2 m gap in a 1 m wall with a 4 m throat; the party walks through. **No transition fade.** A room *activates* when the active hero crosses its threshold plane (any hero in multiplayer, v27); companions inside 6 m are pulled through by formation, and one further away fades to its slot after the 4 s stuck timer (`heroes.md` §2.5.11). Activation: combat and ability rooms drop their bars (`bars_slam` 0.3) and spawn wave 1; puzzle rooms bar their exits; rest rooms heal 30 % and show their plaque; boss antechambers show the `🔒`. |
| **Streaming** | A dungeon's statics load whole at entry (budgets §4.6). Rendering is per room: the current room plus rooms visible through open doorways; everything else is unrendered and its enemies are not simulated (v27 kept only the current room). Enemies never follow through a door that has bars; ordinary doorways they may. |
| **Doors** | Three states (`DOOR_CLOSED` cut): **open**, **locked** (a key), **barred** (a mechanism). A locked door reads as a door with a keyhole plate and a `🔒` glyph on the room strip; a barred door as a portcullis with the mechanism's glyph on its lintel (sap knot, sun disc, lantern eye, snowflake, a black seal). Locked doors take a key from within 1.5 m (v27 60 px) on interact or on walking into them with a key held (`Door unlocked!`, `door_unlock` 0.4). |
| **Set-piece lifts** | Each dungeon's set piece has one scripted **camera lift**: over 3 s the pitch eases to 60° and the distance to ×1.3, holds while the moment plays, and releases over 1.5 s. The sim runs; nothing pauses. Reduced motion holds the gameplay rig. |
| **Exit** | Boss death → `bosses.md` §2.5 (doors unlock at 2.0 s, `<name> CLEARED!` with the `DUNGEON_EQUIPS` card, `Per-hero combat breakdown`). The victory button places the party outside the entrance under a 1 s fade (v27's `exitDungeon`) with every v27 award: XP, the equip, `Dungeoneer`, `clear_dungeon`, the `dungeon` bounty, +30 gold, +1 skill point to all four, `Ed's Landing` at exactly 1 HP, autosave 1 s later. And a **back door** opens in every boss hall (the Grove's canopy slide, the Tomb's drain slide, the Temple's sluice, the Citadel's lens chute): a 10–25 s ride to the entry hall for anyone who stays to look around. |
| **Retreat** | Walking out through the entry hall's outer door, or the pause menu's retreat: the canon `DUNGEON RETREAT` / `DUNGEON FAILED` card with `The Stewart Squad couldn't clear <name>...` and 30 % of the run's XP (v27). |

#### 2.1.4 The vocabulary (v27 tile and object types, kept, changed or cut)

| v27 | Fate | Where | 3D form and rule |
|---|---|---|---|
| Pressure plate (`7`) | kept | Grove, Tomb, Citadel, Home, Wrong | a 1 m stone (or stump, or ice) plate that sinks 0.1 m under any hero or block (`plate_click` 0.3; release 0.2); `Puzzle solved!` when every plate in the room is held; `Plate released!` / `Plate deactivated!` / `Puzzle reset!` verbatim. **Trap plates** (new, the Tomb): a plate with a scarab glyph that triggers a hazard instead |
| Push block (`8`) | kept | Grove (root-bound boulder), Tomb (sarcophagus block), Citadel (ice cube), Home, Wrong | 1 m cube pushed one grid cell per shove along the pushing hero's facing (0.5 s, `rock_slide` 0.25; `ice.slide` on ice, where it slides until it hits something); blocks beams, movement and projectiles; never pushed into a hero (`hero push-back`, v27) |
| Chest (`9`) | kept | one key chest per dungeon; normal chests in treasure and secret rooms; bonus chests from ability rooms | key chest: `Dungeon Key found!` `#E8A838`, `equip` 0.4, 20 gold particles, `🔑 N`; normal: `Treasure! +50 HP all!`, +15 dungeon XP, `chest_open` |
| Spike trap (`10`) | kept | Tomb corridor; Outer Ward (canon hazard) | 1 m strips rising 0.4 m every 2 s for 0.6 s (v27 period 2), 5 DPS via the accumulator, a hatched circle pulsing with the cycle (`bosses.md` §2.2.1 `spike`) |
| Lever (`11`) | kept, given a job | Tomb (sand), Citadel (gates), Home, Wrong (ash) | a 1.4 m iron lever; interact within 1.25 m (v27 50 px), `lever_pull` 0.3; when a room's levers are all set, `Bars retracted!`, `door_unlock` 0.4 |
| Cracked wall (`12`) | kept | Tomb; the Four Locks | Liam's object (§2.1.9) |
| Locked door | kept | the boss door of every room dungeon | §2.1.3 |
| Barred door | kept | Tomb, Citadel, Temple (sconce gates), Home, Wrong | §2.1.3 |
| Decor: pot, crate, bones (`DNG_DECOR`) | kept, skinned | every dungeon, 2–4 per room (v27), seeded | hp 1 / 2 / 1, loot 50 / 60 / 30 %, heal 20 / 15 / 0 %, particles 6 / 8 / 4 in the v27 colours, sounds `destroy_pot` / `destroy_crate` / `destroy_pot`. Skins: Grove seed pod / root-bound crate / bones; Tomb canopic jar / cedar chest / bones; Temple clay urn / rotten crate / bones; Citadel ice-crusted urn / frost crate / bones; the shard the Forest set gone black |
| Biome hazards (§11.7 step 11) | kept as each dungeon's native floor | forest `vine_snare` 0.625 m (`Snared!`, root 1.5 s per `enemies.md`'s rooted rule applied to heroes: velocity zero, attacks continue); desert `sand_slow` 0.875 m (×0.6 speed); swamp `poison_patch` 0.75 m 4 DPS; frozen `ice_tile` (the whole floor, §2.5.1); cave `crystal_glow` 0.7 m (a light, no effect); volcanic is the Rift's (`bosses.md`) | placed by the authored layout, never randomly in a doorway's 3 × 3 (v27 mask kept) |
| Citadel floor hazards | kept as the canon words say | spikes in the Outer Ward, poison in the Inner Sanctum, ice in the Throne of Shadows | §2.6 |
| The 0.6 s room slide | cut | — | §2.1.3 |
| `DOOR_CLOSED`, `V7T.puz`, `bossv7`, the 4 × 5 slot grid, the linear fallback | cut | — | authored layouts |
| The minimap panel | replaced | — | §2.1.10 |
| Wall torches | kept, skinned | 4–6 per room in the Grove (resin torches in root sconces), the Tomb (brazier bowls), the Citadel (iron torches); **none** in the Temple (sconces are the mechanic); 0–2 cold braziers in the shard | the `world-events-weather.md` §2.8.3 recipe; the two nearest lit torches take world light slots when free, the rest run emissive on the oscillator |

#### 2.1.5 Waves

`enemies.md` §2.5 verbatim: `count = min(3 + floor(depth/2) + wave, 8)`, hp `×(1 + 0.03·teamLv)(1 + 0.3·(players − 1))`, dmg `×(1 + 0.03·teamLv)`, spd `×(1 + 0.01·teamLv)`, where **`depth` is the room's index on the critical path** (the entry hall is 0) so an optional room inherits the depth of the room it hangs off. Combat rooms run 2 waves, ability rooms 1 (v27), the next wave 1.2 s after the last kill (`Wave N/M`), then `Room cleared!` and `Combat cleared! Check for bonus...` with `equip` 0.3. Pools are `enemies.md` §2.5's per dungeon (restated in each section). Home, Wrong adds the Citadel `enemyScale` 1.5 / 2.0 / 2.5 per region and `count + 1`, capped at 10 (v27 §11.8). Elites roll as on the overworld. Enemies in dungeons have no home and never leash (`enemies.md` §2.2: boss adds and event enemies; dungeon waves join that list).

#### 2.1.6 Rest rooms, hearths, checkpoints, saves, wipes, re-entry

- **Two rests per dungeon.** The entry hall (`start`: heals 30 %, carries the dungeon's canon plaque, FC §10.5) and one mid-dungeon rest room with a **hearth**: a 0.9 m stone ring the family lights on entering (a 0.6 s kneel clip by the active hero; `light.campfire` at the token values, one pooled light, the shared oscillator). The hearth offers `camp.md` §2.7.3's rest prompt verbatim (`Until dawn` / `Until dusk` / `Sit`), gated on no enemy within 20 m, healing to full and clearing DoTs, advancing the clock with the 3 s sky sweep. Two dungeons need it: the Tomb's sunbeams need day, the Citadel's lift needs night (§2.3, §2.5). The hearth is also the family's mark on the place: on re-entry it is still there, cold.
- **Checkpoints.** Entering a rest room, and stepping into a boss antechamber, writes `dungeonRun` into the save: `{ key, seed, checkpointRoom, roomsCleared[], roomStates{}, keys, xpGained, lanterns{}, sandLevels{}, puzzleFlags{} }`. Saving inside a dungeon still writes the overworld snapshot exactly as P1 §28.3 (flagged `_dungeonSave`), plus this block. On load with a `dungeonRun`, the game asks `Resume <name> from the hearth?` **[new text]**: yes places the party at the checkpoint with the run's state; no discards the run as a retreat (30 % XP). A twenty-minute dungeon no longer has to fit before dinner.
- **A party wipe** shows the canon `DUNGEON FAILED` card with `The Stewart Squad couldn't clear <name>...` and two actions for `ui-ux.md`: `Try again` **[new text]** reloads the checkpoint (rooms cleared stay cleared, the wave that killed you resets, no XP lost) and `Leave` **[new text]** is v27's exit with 30 % XP.
- **Re-entry.** A cleared dungeon stays open as a **quiet place**: its doors open, no waves, no boss, the boss's remains where they fell (the stump, the mask on the dais, the necks in the water, the shattered crown), hazards still live, secrets and unopened chests still there, the back door open, the hearth cold. No `DUNGEON_EQUIPS`, no `Dungeon Diver`, no second clear; NG+ resets everything. The Depths and the Rift keep `bosses.md`'s own re-entry rules.

#### 2.1.7 Light, air and sound per dungeon (from `world-events-weather.md` §2.8)

| Dungeon | Fog token · `dark` | `light.heroPool` | Placed lights | Ambient particles (`DNG_ATMO` translated, §2.8.4) | Open-sky rooms | `visOverride` rooms | Ambient bed (`audio.md`) |
|---|---|---|---|---|---|---|---|
| Hollow Grove | `dng.forest` 0.70 | 4 m · 6 m boss | resin torches 4–6; glow moss (emissive, §2.2.3); sap veins | `pt.pollen` tinted `#B8C858` ×18 drift; `pt.leaf` ×8 falling in the Well and the boss hall | the Heartwood Well's top; the boss hall's canopy gaps at `1 − dark` | none | `amb.dng.grove` (creak, drip, a slow heartbeat under the beat) |
| Buried Tomb | `dng.desert` 0.62 (the brightest, v27 kept) | 4 m · 6 m | brazier bowls 4–6; sunbeams (emissive shafts, no light) | `pt.ember` tinted `#E86820` ×18 up; `pt.sand` from every spout | ceiling slots (beams), the Storm Chamber, the Hourglass's oculus | the Storm Chamber 6 m | `amb.dng.tomb` (sand hiss, deep stone) |
| Sunken Temple | `dng.bog` **0.85** (world-events allows it for the darkness dungeon) | **1.5 m** (world-events' rule at 0.85) · 6 m boss | the Rusted Lantern (carried, 6 m); sconces (placed, 4 m; two nearest lit take world slots, the rest emissive + ground decal); Collette's orb | `pt.spore` lit `#8A6AB0` ×12 up; `pt.bubble` on water; `pt.wisp`-class wisps (§2.4.4); floor mushrooms `#6CE87A` emissive, not lights | none | inside the mist tide 4 m (§2.4.5) | `amb.dng.temple` (drips, distant frogs, a wet hum) |
| Ice Citadel | `dng.frozen` 0.73 (the darkest v27) | 4 m · 6 m | iron torches 4–6; aurora conduits and crystals (emissive with `uAurora`) | `pt.snow` ×22 down; `pt.glitter` on every ice floor; `pt.breath` | the Broken Gallery; the Orrery after the dome opens; the Lens Room | the Broken Gallery 4 m (blizzard) | `amb.dng.citadel` (wind in the tower, gear tick, ice creak) |
| Home, Wrong | `dng.citadel1` 0.72 → `dng.citadel2` 0.74 → `dng.citadel3` 0.76 (the descent, AR §15.5); the hearth interior `dng.citadel3` | 4 m · 6 m in the mini-boss spaces and boss arenas | the Rusted Lantern; Collette's orb; the cold braziers (`#3AF0FF`, 0–2 per space); the far light (§2.6.6) | `pt.ash` tinted `#8850A8` ×20 drift / `#7B3CA0` ×25 up / `#A83828` ×30 drift per region (the v27 escalation); `pt.ember` in the ember zones | the whole shard is open sky under `shadow.wrongDusk` (the locked keyframe, `world-events-weather.md` §2.1.4) | the Dead Sconces under the tide 4 m | `amb.dng.shard.f1` / `.f2` / `.f3`; the hearth `amb.dng.hearth` |

Rules shared: atmosphere particles are on the bloom layer and ignore fog (AR §6.2 step 5); the 8-light pool and its priority order are `world-events-weather.md` §2.8.2's (hero side 6, world 2); the boss light is `bosses.md` §2.1.5's; enemy eyes are emissive; nothing in a dungeon adds a ninth light.

#### 2.1.8 Companions inside

`heroes.md` §2.5.11 whole (formation slots, steering with the 4 s stuck timer and the 0.3 s fade, telegraph avoidance within 0.4 s, disengage under 25 %). Dungeon additions, each a rule the steering reads from the room: every dungeon telegraph and hazard leaves an exit path ≥ 1.2 m wide (`bosses.md` §2.1.4); a rising root wall pushes a companion to the nearer side (§2.2.1) and never seals one away from the party for longer than the 4 s timer; on lily pads companions **follow the leader** (they step only onto pads the active hero has used or stone pads, 0.6 s behind, one per pad); in the mist tide a companion inside the poison band walks to the nearest clean disc within 6 m and its slot is relaxed until the tide falls; on ice companions steer with a 0.4 s look-ahead so they do not overshoot the active hero; on a rope line they hold the rope (their slot collapses onto the rope's line); on a moving floor (the Hourglass, the Orrery ring, a lift) they ride it with the active hero. Companions never solve puzzles (no plates, no levers, no mirrors) and never pick up the key; they do wake glow moss and they can strike resonance crystals (an accident a kid will exploit, and that is fine).

#### 2.1.9 The ability rooms

FC §2.4 verbatim, one hero per dungeon, always on the critical path, each room built around that kid. Rules: the room activates as a combat room with **1 wave** (v27), then the object is live; the hint announces on activation in the hero's `glow` colour (v27 announced in the hero colour; `Isabella breaks the gears!` was printed in two colours in v27 and is one colour here, `#FFD966`); the wrong hero's interact prints the refusal line; the right verb (below) prints the success line, awards +50 dungeon XP (v27) and drops the bonus chest at a seeded reachable spot (`ab9Complete`, 20-particle burst); the object stays solved. If the right hero is downed the object waits (the 20 s downed timer and the kneeling companions of `heroes.md` §2.5.11 make the wait short); nothing else can open it, so no room is ever a soft-lock and no kid is ever skipped.

| Hero · dungeon | Object (build) | Hint (verbatim, on activation) | Verb (`heroes.md` §5) | Success (verbatim) | Wrong hero (verbatim) |
|---|---|---|---|---|---|
| Noah · the Hollow Grove | a seed pod hanging 5 m up across a gap, 0.5 m, with a `tele.benefit` dashed ring on the floor beneath it | `A distant target... Noah could hit it!` | any arrow that hits the pod; a `snapShot` arrow bursts it in one, an ordinary arrow needs two (the room rewards the signature without requiring it) | `Noah hits the target!` (`puzzle_solve` 0.4) | `This requires NOAH's precision!` |
| Liam · the Buried Tomb | a cracked sandstone wall 3 m wide with light leaking through the cracks | `These cracks look weak... Liam could smash through!` | a Shield Bash contact (the 1.0 m capsule sweep) on the wall | `Liam smashes through!` (`boom` 0.4, 15 debris shards, +50 XP) | `This requires LIAM's ability!` |
| Collette · the Sunken Temple | a seal of dark glyphs on a sunken door, 2 m | `A magic seal... Collette could channel it!` | three interacts; each runs the 1.5 s channel loop (staff planted, orb bright) with `Channeling... (N more)` and `magic` 0.2 on presses 1 and 2, `puzzle_solve` 0.4 on the third | `Collette channels the seal!` | `This requires COLLETTE's magic!` |
| Isabella · the Ice Citadel | the Orrery's drive gear, 2 m, jammed solid with ice | `Gears are jammed... Isabella could break them!` | any whirl hit on the gear (her basic attack or Ground Pound) | `Isabella breaks the gears!` (`puzzle_solve` 0.4) | `This requires ISABELLA's whirl!` |
| all four · Home, Wrong | the Four Locks (§2.6.3): the four objects on one ash gate, in canon index order | each hint as its lock becomes live | each verb | each success line; the gate opens on the fourth | each refusal |

Canon check (Working Rules; `grep -n` in FC): the four hint, success and refusal lines (L264–283) name an ability, precision, magic and a whirl; `heroes.md` keeps Liam's shield and Shield Bash, Noah's bow, Collette's staff and magic, Isabella's hammer and whirl (§2.0, §2.5.5), so every line reads true. Quartz's `shield shimmers` (L472) is the Colossus's shield (`bosses.md` §2.11), not Liam's. No role or prop changes here.

#### 2.1.10 The room strip and the dungeon HUD (spec for `ui-ux.md`)

The v27 minimap panel becomes a **room strip** on the compass: the critical path as a row of pips, optional rooms as ticks hanging off their parent, visited pips filled, cleared pips ticked, the current pip pulsing, locked doors as the canon `🔒` glyph between pips, the key count `🔑 N` at the strip's end. The HUD keeps the canon strings verbatim: the dungeon name in its colour (the location title card on entry: name plus the canon desc as its one quiet line), `Room N/M` (N = the current critical-path depth + 1, M = rooms on the path), `🔒 LOCKED` while a room's doors are barred, `Wave N/M`. Quiet **name cards** (name only, no line, 0.8 s in / 2 s hold / 1 s out) for rest rooms and set-piece rooms **[new text, listed per dungeon]**. No lantern meter, no sand gauge, no rope indicator, no aurora meter: each of those is read in the world (a shrinking ground glow, a lit glyph on a wall column, a hand on a rope, a conduit that glows the sky's colour). The clock-phase icon `world-events-weather.md` already gives the compass is the only HUD tell that time matters.

#### 2.1.11 Sound hooks that every dungeon shares (names for `audio.md`)

Kept from v27 at their v27 sites (AU §13): `bars_slam` 0.3, `door_unlock` 0.4, `lever_pull` 0.3, `plate_click` 0.3 / 0.2, `puzzle_solve` 0.4, `rock_slide` 0.25, `destroy_pot` 0.25, `destroy_crate` 0.25, `boom` 0.4 (Liam's wall), `magic` 0.2 (Collette's ticks), `equip` 0.3 (room cleared) and 0.4 (key), `chest_open`, `boss` 0.5 (the entry card), `victory` 0.5 (the clear). New, shared: `dng.enter` (the threshold walk), `dng.hearthLight`, `dng.checkpoint`, `dng.backDoor`, `dng.nameCard`. Per-dungeon cues are in each section; beds in §2.1.7.

### 2.2 The Hollow Grove (the Rootways, Forest island; Phase 2)

**Entrance.** The root arch at (172, 28) in the Rootways district: two trunks the size of towers grown together into a 6 m arch, the hollow between them `#0A1810` and breathing (the canopy blobs of AR §7.4 become a real canopy that scales `1 + 0.02·sin(2t)`; the green mist `rgba(45,140,86)` becomes `pt.mist` in `forest.moss`; the four interior fireflies become four `pt.firefly` on the bloom layer; three moss strands sway). Preview of the rule: three root walls within 20 m of the arch rise and retract on the dungeon's own 12 s beat, blocking nothing that matters, so the beat is heard before it is a problem (world-builder places them). Elm's gate is at (120, 10). Card: `The Hollow Grove` over `FOREST DUNGEON`, desc `Ancient roots twist into a maze of thorns. The Treant awaits.`, colour `#58B888`. Read at distance: a living arch that breathes, and roots around it that move.

#### 2.2.1 The core rule: root rhythm

| Rule | Value |
|---|---|
| The heartbeat | one dungeon-wide clock, period **12 s** (`grove.heartbeat`, a low two-beat thud at 0 s and 6 s, felt not loud) |
| Wall segments | 4 m long × 1.6 m tall × 0.6 m thick root bundles that rise from a floor seam; they block movement and projectiles (`enemies.md` §2.4: projectiles die on obstacles) |
| Phase groups | every segment belongs to group **A, B or C**, offset **0 / 4 / 8 s** on the beat; a group's cycle is **5.0 s open → 1.2 s rising → 5.0 s closed → 0.8 s retracting**, so at any instant at least one group is open and no route is closed longer than 5.8 s |
| Telegraph | for the 1.2 s before a group rises its floor seams glow (sap veins `boss.treant.sap` `#58B888` emissive ×3) and a white dashed line decal draws along the seam (it hurts no one, so it is never hatched); the creak `grove.rootRise` starts at −0.6 s |
| Under a hero | a wall never traps and never damages: a hero or enemy on the seam when it rises is pushed 1.0 m to the nearer side over 0.3 s (knockback-immune heroes too); a companion pushed to the wrong side is a 4 s stuck-timer fade at worst |
| Pinning | a **weighted stump** (§2.2.3) held down by a boulder or a hero pins its linked wall **open** (the roots strain and stay down, sap veins dark) |
| Rooms that use it | the Thorn Run, the Boulder Bough, the Heartwood Well; every other room's roots are still; **during the boss the walls hold still** (`bosses.md` §2.7) |
| Read | a kid sees the floor light up, hears the creak, sees a wall come up, and after two beats knows the room has a pulse |

Motion sources (AR §19 lesson 3): the beat, the sap pulse at 1.2 rad/s, the canopy sway at 0.8 rad/s, and `pt.leaf` always falling somewhere. Nothing in the Grove is still.

#### 2.2.2 Traversal: canopy tiers

Three terraces: T0 the root floor, T1 the bough tier at +4 m, T2 the canopy tier at +8 m. Joined by **root ramps** (2 m wide, 30°) and **lift boughs**: a 2 m bough that bends 0.3 m under a standing hero, holds 0.4 s, then lifts to the next tier over 2.0 s with a creak and a leaf burst (`grove.boughLift`); companions ride with the active hero; it lowers again 3 s after it empties. Falling off a tier edge is not possible (the edges have root rails 0.6 m high, collision), so height is never a hazard here; it is the view. The camera keeps the gameplay rig; the follow target's y is damped over 0.5 s so a lift reads as a rise, not a cut.

#### 2.2.3 Puzzle language

| Type | Rules | Telegraph | How a kid learns it without a line |
|---|---|---|---|
| **Rhythm gates** | reach the far door by crossing the seams while their group is down; the direct route is closed on one group and open on another | the seam glow and the creak 1.2 s ahead; the closed wall itself | the Thorn Run's first wall rises 4 m in front of them, in full view, and comes down again 5.8 s later; standing still teaches it |
| **Sapling seals** | when the room activates, **3 Saplings** (`bosses.md` §2.9 variant, hp 40, rooted) sprout at the exit's frame over 0.8 s; every **5 s** a living sapling sends one root strand across the exit; at **4 strands** the exit is sealed and the room becomes a combat room with **one extra wave** on top of its usual two, the strands rotting away on the clear. Kill all three before the fourth strand and there is no extra wave and the door stays open | a dashed benefit ring under each sapling (kill these); the strands are visible and count themselves; the seal is a slam (`bars_slam`) | the first seal room has one sapling in plain sight beside the door; a kid who hits it sees the strand stop; a kid who does not sees the door close and gets a fight, not a wall |
| **Glow-moss paths** | patches of moss on the floor and the bough tier are invisible (the floor's own `#102820`) until a **Collette light** (her orb within 2.5 m, a bolt impact, Arcane Nova, a Blink arrival) wakes them: they glow `grove.glowMoss` **[token]** `#8FF0A8` emissive for **8 s** after her light leaves, and stay lit while any hero stands on them. Woken moss shows the safe lane across a **thorn floor** (`vine_snare` everywhere else: `Snared!`, 1.5 s root) and, in the Mosslight Hollow, outlines a hidden door. Fallback so she is never a soft-lock: any hero's step wakes the single moss tile under it for 1 s (you can feel your way, slowly) | the moss itself, spreading out from her light at 3 m/s; `grove.mossWake`, a soft chime | Collette walks into the Hollow and the floor lights up around her feet; the thorns everywhere else are visible; she carries her own light (`heroes.md` §2.1.2) and the room shows why |
| **Weighted stumps and root-bound boulders** | v27 plates and push blocks: a **stump** sinks under a hero or a boulder; a stump linked to a wall pins that wall open; two stumps in a room open its barred door (`Puzzle solved!`); boulders are pushed one cell per shove | plates and blocks in the shared language; the linked wall's sap veins go dark when pinned | the Boulder Bough's plaque `Ancient mechanisms block the way.` and one stump beside one boulder beside one wall; pushing is the only verb that fits |

#### 2.2.4 The map

Dungeon-local metres: x east, z south, y up; the arch is at the entry hall's south wall. Doors are on the wall between adjacent rooms unless noted; a corridor throat of 4 m joins non-touching rooms.

| Id | Room [new text] | Type | Centre (x, z, y) | Size (m) | Depth | Doors and locks | What is in it |
|---|---|---|---|---|---|---|---|
| G1 | Rootmouth | start (rest, plaque) | (0, 0, 0) | 12 × 12 | 0 | S: the arch (retreat); N → G2 | plaque `The roots of the Hollow Grove run deep...`; 30 % heal; a still pool; two resin torches |
| G2 | Thorn Run | combat, rhythm | (0, −16, 0) | 16 × 12 | 1 | S ← G1; N → G3 | 2 waves; six wall segments in groups A/B/C crossing the room in two staggered rows; four torches |
| G3 | Sapling Gate | puzzle (sapling seal) + combat | (0, −30, 0) | 16 × 12 | 2 | S ← G2; N → G4 (the sealing exit) | 3 Saplings; 2 waves (3 if sealed); the seal strands |
| G4 | Mosslight Hollow | puzzle (glow moss) | (0, −45, 0 → +4) | 16 × 14 | 3 | S ← G3; N → G5 via a root ramp to +4; W: hidden moss door → G12 | a thorn floor with one moss lane; the ramp's foot is also thorned; the lane outlines the west door |
| G12 | Root Cellar (optional, secret) | treasure | (−14, −45, 0) | 8 × 8 | 3 | E ← G4 (hidden) | a normal chest, plaque `A gleaming chest awaits...`, a firefly hollow |
| G5 | Boulder Bough | puzzle (stumps and boulders) + rhythm | (0, −60, +4) | 18 × 12 | 4 | S ← G4 (ramp); E → G7 (barred until both stumps are held) | plaque `Ancient mechanisms block the way.`; two stumps, two boulders, two rhythm walls that the stumps pin; four torches |
| G7 | Pod Gallery | ability (Noah) | (17, −60, +4) | 14 × 12 | 5 | W ← G5; N → G8 | 1 wave; the seed pod 5 m up across a 3 m gap; the bonus chest |
| G8 | Stump Circle | rest (hearth, checkpoint) | (17, −74, +4) | 10 × 10 | 6 | S ← G7; E → G6; N → G9 | the hearth in a ring of seven stumps (the family sits; `Sit` works here); name card `Stump Circle` |
| G6 | Seed Vault (optional detour, the key) | treasure | (29, −74, +4) | 8 × 8 | 6 | W ← G8 | the **key chest** (a root-wrapped iron key) and 3 seed-pod decor; plaque `A gleaming chest awaits...` |
| G9 | The Heartwood Well | set piece, rhythm, tiers | (17, −90, +4 → +8) | 16 × 16, 14 m tall | 7 | S ← G8 at +4; N → G10 at +8 | §2.2.5 |
| G10 | Canopy Bridge | boss antechamber | (17, −104, +8) | 8 × 8 | 8 | S ← G9; N: **locked** → G11 | a bough bridge over the Well's drop; the `🔒` door in a wall of living bark; the checkpoint |
| G11 | The Treant's Hall | boss | (17, −120, +8) | 20 × 16 | 9 | S ← G10 (locks for the fight) | `bosses.md` §2.7's grove hall under the canopy tier; walls still; glow-moss lanes; the back door (a canopy slide) after the clear |

```
                 [G11 Treant's Hall] +8
                        | locked
                 [G10 Canopy Bridge] +8
                        |
                 [G9 Heartwood Well] +4 -> +8
                        |
   [G6 Seed Vault]--[G8 Stump Circle] +4     <- key, hearth
      (key)             |
   [G7 Pod Gallery]--[G5 Boulder Bough] +4   <- Noah (G5 -> G7 -> G8)
     (Noah)             |  ramp
   [G12 Root Cellar]..[G4 Mosslight Hollow] 0
     (secret)           |
                 [G3 Sapling Gate] 0
                        |
                 [G2 Thorn Run] 0
                        |
                 [G1 Rootmouth] 0  <- the arch
```

Critical path G1 → G2 → G3 → G4 → G5 → G7 → G8 → G9 → G10 → G11 (10 rooms); the key detour G8 ↔ G6; the secret G12. Run length at a first-timer's pace: 18–22 min.

#### 2.2.5 The set piece: the Heartwood Well

The inside of the Grove's oldest trunk: a 16 × 16 m shaft 14 m tall, the party entering on a ledge at +4 m. Three tiers of **boughs** spiral up the inside wall (+4, +6, +8), each bough a rhythm wall lying flat (a group A, B or C bough is *there* only while its group is open; when its group closes the bough curls up into the wall for 5 s and you wait on the one you stand on, which never curls under you: the bough you stand on is pinned by your weight). The floor of the Well at 0 m is a bed of sap veins pulsing on the beat. Enemies: a wave of `bat` ×4 that circle the shaft, the only fliers in the Grove, diving at whoever is on a bough edge. As the party reaches +8 the canopy overhead **opens** (the leaf mass parts over 3 s, open-sky flag on, the island keyframe blends in at `1 − dark`, `pt.pollen` pours in, `pt.leaf` ×20 falls) and the **camera lift** plays: pitch to 60°, distance ×1.3, a 3 s hold looking down the shaft at the pulsing veins with the four kids on the top bough and daylight (or moonlight) on them, then release. Name card `The Heartwood Well`. Shake 4 / 0.3 on the canopy opening; `grove.canopyOpen`. It is the Grove's picture: a living tower seen from inside, breathing.

#### 2.2.6 Enemies

Pool `goblin, orc, bat, healer` (`enemies.md` §2.5 Rootways). Waves per §2.1.5. Room notes: Goblin Healers hang behind rhythm walls (the walls are cover the AI reads as obstacles); Bats only in the Well and the Hollow's dark corners (a roost hangs over the thorn floor); Orcs in the Thorn Run get pushed by walls like everyone else, which a kid will use. No nests (`enemies.md` §2.8: overworld only). Elites roll as on the overworld.

#### 2.2.7 The boss door and the arena

The key from the Seed Vault opens G10's north door (`Door unlocked!`). The Treant's Hall is `bosses.md` §2.7's 20 × 16 m grove hall verbatim: moss and root ridges 0.2 m, no cover, fog `dng.forest`, `light.heroPool` 6 m, `light.boss` on the face; the room's root walls hold still for the fight; the glow-moss lanes across the floor wake under Collette's light as in every other room (they carry no rule in the fight; they are the floor telling you it is the same place). The door locks behind the party at the intro. After the death beat and `Ancient Treant DEFEATED!`, the canopy behind the stump parts and a **canopy slide** (a 25 s root chute, skippable) drops the party to Rootmouth; the victory card's button is the direct exit.

#### 2.2.8 Rest, lore, key, secrets

Rootmouth carries `The roots of the Hollow Grove run deep...` (FC §10.5) as a carved plaque on the arch's inner face, announced in italic on entry (v27) and readable again on interact. The Boulder Bough carries `Ancient mechanisms block the way.`. Both treasure rooms carry `A gleaming chest awaits...`. The hearth at Stump Circle is the checkpoint; the Canopy Bridge is the second. Lore secret 1 is outside at (192, 62) (`story-beats.md`), not in the dungeon.

#### 2.2.9 Entry and exit, with the exchange

On the walk up, when the squad is within 6 m of the arch for the first time (`forest_3` active), the four-line `dungeon_enter` exchange plays in the dialogue box in the order Liam, Noah, Collette, Isabella (story-beats §2.5; each line once per playthrough): `Cool. Cool cool cool. So we're just going in there.` · `Hey do you think there are any cool bugs in here?` · `This place needs curtains. And better lighting. And maybe a rug.` · `I'm not scared. ...Collette, hold my hand though.` Then the pill and the card, then the threshold (§2.1.3). `Dungeoneer` on the first clear; Elm's line 3 (`The forest breathes easier since you walked through. Well fought.`) at the gate on the way out (story-beats B1.9); `forest_3` turns in. **Liam's `boss_appear`** line fires at the Treant's card (`bosses.md` §2.3).

#### 2.2.10 Recognizable from its rules

Drop a kid in blind: things move on a beat, the floor lights up where Collette walks, and up is a direction. Nothing else in the game has a pulse.

### 2.3 The Buried Tomb (the Sunken Pyramid, Desert island; Phase 3)

**Entrance.** The Sunken Pyramid at (120, 60): a 30 m base with only the top 12 m above the dunes; a stair cut into the south face leads to a stone **hatch at the apex** with v27's sandstone front reduced to what a buried tip can carry: two tapered pillars, a lintel with the eye emblem, hieroglyphs that glow `#D9A441` at `0.4 + 0.2·sin(1.5t)` (L6918), sand pouring off the lintel in two `pt.sand` streams, gold mist inside. Card: `The Buried Tomb` over `DESERT DUNGEON`, desc `Sand-swept corridors hide cursed chambers. The Pharaoh stirs.`, colour `#E8A860` (card text only; `bosses.md` §2.1.6). Read at distance: the tip of a pyramid in a sea of dunes with a hole in it. Everything below the hatch is buried: the dungeon descends from +12 m to 0 m through the sand-filled pyramid and the halls under it.

#### 2.3.1 The core rule: sand-flow

| Rule | Value |
|---|---|
| Levels | a **flow room** has three sand levels: **low 0 m, mid +2 m, high +4 m** (its floor is the sand's surface; the stone floor is under "low") |
| Levers | a lever cycles its room's level one step (low → mid → high → low) or, in rooms with two levers, one **fills** and one **drains**; `lever_pull` 0.3; the room's wall column shows three sun glyphs and lights the one for the current level |
| Rates | **fill 1 m per 3 s** from jackal-head spouts high in the walls (`pt.sand` ×200 per spout, `tomb.sandFlow` roar); **drain 1 m per 2 s** through a floor grate (a whirl decal, `tomb.sandDrain`) |
| Standing on it | a hero on the sand rides its surface up or down (the heightfield lifts the controller); while it flows, the whole surface is `sand_slow` (×0.6 speed, the v27 hazard); sand never buries or damages a hero: a hero under a rising surface is lifted, one over a draining surface sinks with it |
| Doors by height | door sills sit at 0, +2 or +4 m; a door above the sand is a ledge you cannot reach (2 m is above the dodge), a door below the sand is buried (sand pours through its frame as a decal, the door glyph dark); only a door within 0.4 m of the current surface is walkable |
| Objects | chests, plates and blocks on the stone floor are buried at mid and high (their tops show as bumps at mid); a block on the sand stays on the surface and rides it; a **sunbeam** (§2.3.3) runs at 1.2 m above the stone floor and is blocked by sand at mid or high |
| Enemies | Skeletons rise out of the sand wherever it flows (`skeleton` sand-rise clip, `enemies.md` §2.3); other enemies ride it like heroes |
| Read | a kid pulls a lever, hears the roar, sees sand pour and the floor come up under them, and sees a door go under while another comes level |

#### 2.3.2 Traversal: rides, slides and storms

- **Sand rides**: every tier change in the Tomb is a drain you stand on (the Spout Stair, the Hourglass): the floor lowers the party 4 m while they fight what rises with it. A short `ride` pose on the rig (feet planted, arms out) is requested of `heroes.md` (§5).
- **Sand slides**: chutes between rooms at 30°, 3 m wide, the party sliding at 6 m/s with no control for 2–3 s (dust, `tomb.slide`); one-way.
- **Sandstorm chambers**: rooms where the pyramid's face has collapsed and the desert pours in: `visOverride 6`, `pt.sand` ×600 streaming (`world-events-weather.md` §2.8.5), a crosswind push of **0.6 m/s** on every hero and enemy (a drift, not a slow: weather never slows heroes), and **walking dunes**: 2 × 1 × 1.2 m sand mounds (cover: they block projectiles and sight) that migrate across the room at **0.4 m/s** on the wind and re-form at the windward wall, so cover is never where it was ten seconds ago. Goblin Archers and Skeletons fire from the storm at the aggro cap (6 m × 1.25 = 7.5 m); the far wall's sun glyph is emissive and reads through the storm as the way out.

#### 2.3.3 Puzzle language

| Type | Rules | Telegraph | How a kid learns it |
|---|---|---|---|
| **Sand levers** | set the sand to the level of the door you need; two-lever rooms fill from one chamber and drain into another so two rooms share one sand budget (fill A drains B) | the wall column's lit glyph; the roar; the doors going under or coming level | the Spout Stair: one lever, one visible door below the sand; pulling it is the only thing to do and the floor drops away under them |
| **Sunbeam mirrors** | a beam enters through a ceiling slot (open-sky, the island keyframe's light colour: cream at noon, gold at golden hour) and runs straight at 1.2 m; **mirrors** are bronze discs on pedestals with **4 orientations**, rotated 90° per interact (0.4 s, `tomb.mirrorTurn`), reflecting the beam at right angles; a beam is blocked by walls, blocks, closed doors and sand at mid or high; a **sun-mark** (a carved disc 1 m) lit for 1.0 s **latches** (`tomb.sunmarkLit`, `puzzle_solve` 0.4) and opens its door or raises its block; a **blinking sun-mark** (the Sun Court) holds only while lit, so two mirrors must hold two beams at once. **Night:** the slot admits moonlight, a silver beam `#C8D2FF` at 40 % that shows the path and keeps scarabs off but **lights no sun-mark**: the mirrors wait for day, and the Scribe's Cell hearth (`Until dawn`) is the answer, ten metres away | the beam is an emissive shaft (an additive stretched billboard 0.3 m wide, bloom, dust motes in it) you can see from anywhere in the room; a mirror's face flashes when a beam hits it; an unlit sun-mark is a dark disc with a faint rim | the Mirror Gallery has one beam, one mirror and one mark in a line that is 90° wrong; one turn fixes it; the door opens; kids know mirrors |
| **Scarab jars and beam lanes** | 30 % of the Tomb's jars are **scarab jars** (a seeded flag; a faint scratching and a scarab glyph tell them apart): breaking one releases **6 Scarabs** (`bosses.md` §2.9's `bat` variant, hp 15, dmg 8, 2.5 m/s); scarabs **never enter a sunbeam's 1 m band** and take 5 DPS if pushed into one; a **trap plate** (a plate with the scarab glyph) opens wall cracks that pour 12 scarabs; the lane under a beam is the safe walk | the scratching within 3 m; the glyph; the cracks' dashed benefit ring 0.8 s before they open (`bosses.md` `summon` telegraph) | the Jackal Corridor: jars line both walls, a beam runs down the middle, and the first plate the corridor makes you step on pours scarabs that stop dead at the light |
| **Sandstorm cover** | fight from dune to dune; dunes walk; the way out is the glowing glyph | the storm itself; the dunes' slow motion; the glyph | the Storm Chamber is a fight, not a puzzle: standing still gets you shot, and the cover moving teaches itself |

#### 2.3.4 The map

The hatch is on the apex; tiers descend. x east, z south, y up.

| Id | Room [new text] | Type | Centre (x, z, y) | Size (m) | Depth | Doors, levels and locks | What is in it |
|---|---|---|---|---|---|---|---|
| T1 | Apex Hatch | start (rest, plaque) | (0, 0, +12) | 10 × 10 | 0 | up: the hatch (retreat); N → T2 | plaque `Sand whispers through the tomb halls...`; 30 % heal; two braziers; the first spouts already trickling |
| T2 | Spout Stair | flow room (intro) | (0, −13, +12 → +8) | 16 × 12 | 1 | S ← T1 at high; W → T3 at low (+8) | starts **high**; one lever (drain only); the west door at the stone floor is under 4 m of sand until it drains; 2 Skeletons rise as it drains |
| T3 | Jackal Corridor | trap corridor (spikes, scarabs, beam lane) | (−15, −13, +8) | 20 × 6 | 2 | E ← T2; W → T4 | 12 jars (30 % scarab); 8 spike strips staggered along the beam lane on the 2 s cycle; 2 trap plates; a beam from a slot the whole length |
| T4 | Mirror Gallery | puzzle (mirrors, 1 beam · 2 mirrors · 1 mark) | (−31, −13, +8) | 16 × 14 | 3 | E ← T3; N → T5 (sun-mark door); S: a scarab-cracked wall → T12 | 2 mirrors, 1 sun-mark on the north lintel; the beam enters mid-room; 4 braziers |
| T12 | Scarab Warren (optional, secret) | treasure | (−31, −27, +8) | 8 × 8 | 3 | N ← T4 (break the cracked wall: any attack, 3 hits) | a normal chest inside a scarab nest (18 scarabs; a slot beam crosses the room so the lane is the only approach); plaque `A gleaming chest awaits...` |
| T5 | Storm Chamber | combat (sandstorm) | (−31, +4, +8) | 20 × 16 | 4 | S ← T4; E → T6 | `visOverride 6`, crosswind, 5 walking dunes; 2 waves of `archer, skeleton, goblin`; the exit glyph on the east wall |
| T6 | Cracked Cistern | ability (Liam) + flow | (−13, +4, +8 → +4) | 14 × 12 | 5 | W ← T5; E: the **cracked wall** → T7; N → T8 (at low) | 1 wave; a lever that drains the room from mid to low, revealing the north door and the cracked east wall's foot; light leaks through the cracks; the bonus chest |
| T7 | Sealed Chamber (the key; behind Liam's wall) | treasure | (0, +4, +4) | 8 × 8 | 5 | W ← T6 (the smashed wall) | the **key chest** (a scarab-shaped iron key) on a plinth in a beam that pours in through the smashed wall; plaque `A gleaming chest awaits...` |
| T8 | Scribe's Cell | rest (hearth, checkpoint) | (−13, +16, +4) | 10 × 10 | 6 | S ← T6; N → T9 | the hearth in a scribe's cell of shelves and jars; name card `Scribe's Cell`; the rest answers night |
| T9 | The Hourglass | set piece, flow, combat | (−13, +34, +4 → 0) | 20 × 20, 16 m tall | 7 | S ← T8 at +4 (a ledge); N → T10 at 0 | §2.3.5 |
| T10 | Sun Court | puzzle (mirrors, 2 beams · 3 mirrors · 2 marks, one blinking) + flow | (−13, +52, 0) | 18 × 14 | 8 | S ← T9; N → T11 **locked**; the antechamber is this room's north bay | the five sun-mark mirrors for the boss hall (below); one lever whose mid level blocks the low beam; the checkpoint |
| T11 | The Pharaoh's Hall | boss | (−13, +68, 0) | 20 × 16 | 9 | S ← T10 (locks for the fight) | `bosses.md` §2.8 verbatim: the dais and sarcophagus at the north wall, five sun-marks, four pillars |

```
                 [T11 Pharaoh's Hall] 0
                        | locked
                 [T10 Sun Court] 0
                        |
                 [T9 Hourglass] +4 -> 0    <- the great drain
                        |
                 [T8 Scribe's Cell] +4     <- hearth
                        |
   [T5 Storm Chamber]--[T6 Cracked Cistern]==[T7 Sealed Chamber] +4   <- Liam's wall, the key
          | +8              (Liam)
   [T4 Mirror Gallery]--[T12 Scarab Warren]  +8
          |               (secret)
   [T3 Jackal Corridor] +8
          |
   [T2 Spout Stair] +12 -> +8
          |
   [T1 Apex Hatch] +12  <- the hatch
```

Critical path T1 → T2 → T3 → T4 → T5 → T6 → T7 → T6 → T8 → T9 → T10 → T11 (10 rooms; T7 is a step through the smashed wall and back); the secret T12. Run length 20–25 min, plus any wait for day.

#### 2.3.5 The set piece: the Hourglass

The pyramid's central shaft, 20 × 20 m and 16 m tall, a sand basin whose surface is at +4 m when the party enters on a ledge; four ceiling slots throw four beams down onto four mirrors on the walls at +8 m; an oculus at the top shows the sky. In the middle of the basin stands the **great lever** (2.4 m, bronze, `tomb.leverGreat`). Pulling it opens the grate: the entire basin **drains 4 m in 20 s** (a design rate for the set piece; 1 m per 5 s so it reads as a fall, not a drop), the party riding the surface down; as it pours, the four wall mirrors are turned by the mechanism so the four beams **swing** across the room in slow arcs (a hazard-free light show), and out of the moving sand rise **Skeletons** in three pulses (4 at 5 s, 4 at 10 s, 4 at 15 s) and scarabs pour from the walls at 12 s (a beam lane is always somewhere on the floor to stand in). The **camera lift** plays from 0 to 20 s: pitch to 60°, distance ×1.3, so the whole shaft, the swinging beams and the falling floor are one frame; shake 8 / 0.6 at the start and a rumble `tomb.drainRumble` throughout. At 20 s the sand is gone, the four beams rest on four sun-marks in the floor that were buried, the north door at 0 m is revealed under a carved sun, and the room is quiet. Name card `The Hourglass`. Reduced motion: no lift; the drain is unchanged.

#### 2.3.6 Enemies

Pool `archer, orc, goblin, brute` + `skeleton` (`enemies.md` §2.5 Sunken Pyramid). Skeletons prefer flow rooms (they rise from the sand); Brutes charge across the Storm Chamber's dunes (a dune stops a charge like a wall: `enemies.md`'s charge ends at an obstacle); Scarabs are `bosses.md`'s variant and count as kills. Elites as on the overworld.

#### 2.3.7 The boss door and the arena

The Sun Court is the antechamber: its north door (`🔒`) takes the Sealed Chamber's key; the door's lintel carries the Pharaoh's sun seal, which is **also** a sun-mark: the door will not open, key or no key, until the centre beam lights it (so the Court's mirror puzzle is the boss gate; the key is the second half). The five sun-marks of `bosses.md` §2.8's hall are lit by five fixed mirrors in the Court's north bay, and **they are player-routable before the fight** (the question `bosses.md` §5.2 asked): the centre mark must be lit to open the door; the other four are optional. Lit marks change nothing in the fight (the Wraith blinks between all five, lit or not, `bosses.md` unchanged); a lit mark casts his hover-shadow when he stands on it, a legibility gift; **lighting all five** before entering drops a bonus chest in the bay with the 20-particle burst. The hall itself is `bosses.md`'s: fog `dng.desert`, `light.heroPool` 6 m, the sand-flow floor idle, the door locked for the fight. After `Pharaoh Wraith DEFEATED!` the hall's floor grate opens and a **drain slide** carries the party to a new hole at the pyramid's foot outside (15 s), the back door; the victory button is the direct exit. Sol's line 3 waits at the Oasis.

#### 2.3.8 Rest, lore, key, secrets

Apex Hatch: `Sand whispers through the tomb halls...`. Treasure rooms: `A gleaming chest awaits...`. The hearth at the Scribe's Cell; the second checkpoint at the Sun Court's bay. Tip 6's `early cave chic` is the Scribe's Cell's look (jars, shelves, a reed mat): Collette's line was about this. Lore secret 3 is outside on the approach (`story-beats.md`).

#### 2.3.9 Recognizable from its rules

The floor changes height, light travels in straight lines and can be bent, and things that bite will not cross the light. No other dungeon has a floor that moves up.

### 2.4 The Sunken Temple (the Witch's Lanterns, Bog island; Phase 3)

**Entrance.** The drowned steps at (−30, −110), where the seventh lantern post of the Witch's Lanterns path ends: v27's overgrown sunken ruin (L6929–6934) as crumbling mossy pillars and a broken lintel standing in black water, the steps going down under the surface, and beside them an **eighth post** whose lantern lights on touch like the seven and **gutters out in 5 s no matter what** (`lantern.gutter`): the hint that inside, light does not stay. Taking that lantern off its hook is the first act of the dungeon (§2.4.7). Card: `The Sunken Temple` over `SWAMP DUNGEON`, desc `Toxic waters flood forgotten halls. The Hydra nests below.`, colour `#70C090`. Read at distance: half-drowned steps under a lantern that will not stay lit (`story-beats.md`).

**How the Temple relates to the overworld path.** The seven posts (`npcs.md` §2.9.2: lit by a hero within 1.5 m for 1.5 s, Collette in 0.3 s; lit 40 s after the last hero leaves; a 3 s gutter; a 3 m ground-glow decal; a dark stretch arms its wisp hollow and Wraiths condense) are the Temple's grammar taught in daylight with a frog to protect. The Temple keeps every number and adds four things: the room is dark (`dark 0.85`, so the lit stretch is all you see), the light you carry matters (the Rusted Lantern), the pads and the mist are timed, and the wisps are two kinds. The escort taught "light the way ahead, then guard"; the Temple's sconce chains are exactly that with a door instead of a jetty.

#### 2.4.1 The core rule: darkness

| Light source | Rule | Token |
|---|---|---|
| **The Rusted Lantern** (carried) | the eighth lantern, taken at the steps; one exists; the active hero carries it in the free-hand socket (`world-events-weather.md` §5.2's requested socket); on a hero swap it passes with a 0.3 s toss; in multiplayer any hero within 1.5 m takes it on interact. Never guttered, never lost; it lights the way back too | `light.lantern` carried: `#FFB347` 1.2 · 6 m, on the torch oscillator (`world-events-weather.md` §2.8.2–2.8.3) |
| **Sconces** (placed) | stone lantern sconces on columns and posts, lit by touch with the overworld numbers (1.5 m for 1.5 s; Collette 0.3 s; 40 s after the last hero leaves 1.5 m; 3 s gutter); a hero standing there keeps it lit; the 3 m ground-glow decal at 0.18 under every lit sconce so a lit stretch reads even when the pool is full | `light.lantern` placed: 1.0 · 4 m; the two nearest lit sconces take the world slots when free, the rest run emissive on the oscillator |
| **Collette's orb** | `heroes.md` §2.5.4: 0.8 · 2.5 m, always on while she is in the scene | `light.spell.collette` |
| **The hero pool** | 1.5 m at `dark 0.85` (world-events' rule): a ring at the feet, not a pool | `light.heroPool` |
| **What glows without lighting** | the floor mushrooms `#6CE87A` (small emissive clusters that mark stone and the water's edge), the wisps (§2.4.4), enemy eyes, the Healer's lantern, the water's faint sheen (`#0B2B2E` with a 0.05 specular) | bloom layer |

Everything else is `dng.bog` at `dark 0.85`: beyond a light's range the room is teal-black and only emissives show. **Dark stretches** (the path between two unlit sconces, or any 8 m of floor with no light) arm Wraiths exactly as the overworld: 1–2 `wraith` condense from a wisp hollow within 8 m after 3 s and blink away (`glow_burst`) the moment a light reaches them (`npcs.md` §2.9.2; `enemies.md` §2.4). Sneaky Shrooms sit dormant among the real mushrooms (their crimson caps read only in lantern light). The read: you see what you carry light to, and what you leave dark comes for you.

#### 2.4.2 Traversal: sinking lily pads, and the mist tide

**Lily pads.** Crossings over black water are pads 1.2 m across, 0.6–1.0 m apart (a walk, never a jump). Two kinds: **leaf pads** with a raised rim, which begin sinking **0.3 s** after a hero steps on and go under (0.4 m) over **1.2 s**, resurfacing **3 s** after they are unweighted; and **stone pads**, flat-topped, which never sink. Two heroes on one leaf pad sink it in 0.6 s. In lantern light (6 m) the rim shows; beyond the light the two kinds look the same, and the wisps tell them apart (§2.4.4). Going under is not death: the water is `Toxic waters` (4 DPS, **poison-typed**, the `poison_patch` value; the DoT accumulator of `bosses.md` §2.1.4) and a hero swims at 40 % speed to the nearest pad or stone edge and climbs out (0.6 s). Companions follow the leader (§2.1.8). `temple.padSink` is a slow gulp.

**The mist tide.** In **tide rooms** (S4, S9, and Home, Wrong's Dead Sconces) a poison mist rises from the water on a **24 s cycle**: **2 s exhale** (the telegraph: bruise fog `#5A3E78` lifts off the water, the sconce flames tinge green at their tips, `temple.mistRise` is a long breath out), **8 s up** (a 1.2 m band over the whole room), **2 s fall** (`temple.mistFall`), **12 s clear**. While it is up: every sconce inside it burns at 30 % (light range ×0.4, the clean-air disc shrinks with it), the carried lantern at 60 %, `visOverride 4` inside the band, dark stretches arm Wraiths in **1 s** instead of 3, and a hero standing in mist **outside clean air** takes **2 DPS, poison-typed**. **Clean air** is 2 m around a lit sconce, 1.5 m around the Rusted Lantern, 1.5 m around Collette's orb: a visible clear disc in the fog. `Poison immunity` (the `swamp_2` reward, `story-beats.md` §2.4) negates the sting and nothing else: the smothering, the vision and the faster Wraiths remain, so the reward is worth having and the tide still means something. Companions crowd into clean air (§2.1.8).

#### 2.4.3 Puzzle language

| Type | Rules | Telegraph | How a kid learns it |
|---|---|---|---|
| **Sconce chains** | a **lantern gate** (a barred door with a lantern-eye glyph) opens while **every sconce in its room is lit at once**; sconces gutter after 40 s, so a room of N sconces is a route to plan and a run to make, and Collette's 0.3 s makes her the runner | the gate's eye glyph fills one segment per lit sconce; the ground glows; the gutter's flare-and-dip in the last 3 s | the Sconce Hall: three sconces around one gate; light one and a third of the eye fills; the rest is obvious and the 40 s is generous |
| **Wisp following** | **amber wisps** guide: each drifts in a straight patient line to the next unlit sconce or the next safe pad on the critical path, pauses 2 m short of it and orbits until a hero is within 3 m, then moves on; **green wisps** mislead: they dart and circle around wisp hollows and leaf pads, and scatter 4 m from any light of 2 m radius or more | colour **and** motion: amber is straight and slow (1.2 m/s), green is jittery (2 m/s, a new heading every 0.6 s); amber holds still near the thing it shows, green never holds still | the first amber wisp in the Sconce Hall leads to the first sconce in plain view; the first green ones circle a wisp hollow with a Wraith visibly asleep in it; the Bog Witch's line 2 (`He only hops toward light, so light the way.`) is already in a kid's head from the escort |
| **The tide and the pads** | the Lily Crossing in a tide room: cross on the clear, wait on stone pads (they are also clean air only if a sconce stands on them: some do) when the mist is up | the exhale; the sconces going green at the tips; the fog rising | the Tide Room has one sconce on one stone pad in the middle of the crossing: the place to wait is lit |
| **The lantern relay** | the **Lantern Gate**'s eye needs a light within 2 m to stay open; the Rusted Lantern must be **placed** on its pedestal (interact; the gate opens, `temple.lanternSet`), and the party goes on through a 12 m dark hall on Collette's orb and the 1.5 m pool alone to the Reliquary and the Sealed Cistern; when Collette channels the seal (§2.1.9) the pedestal slides along a rail through the gate to the far side and the lantern is theirs again | the eye glyph; the pedestal's shape; the rail on the floor, which a kid sees before they understand it | it is the only thing to do at that gate; and Isabella's `...Collette, hold my hand though.` is the rule, said at the arch three dungeons ago |

#### 2.4.4 The wisps

Two pooled swarms per dungeon, ≤ 40 alive, no allocation: amber guides `temple.wispAmber` **[token]** `#FFB347` (≤ 6, one per critical-path leg), green misleads `temple.wispGreen` **[token]** `#6CE87A` (≤ 12 per dark room). A wisp is an emissive point 0.12 m with a 0.6 m soft halo on the bloom layer, `temple.wispHum` at −20 dB within 3 m; neither hurts, neither can be hit, both are `pt.wisp`-class points with a tiny steering rule. The v27 `#7DFF7D` wisp particles of `world-events-weather.md` §2.4.2 stay as ambient on the overworld; inside the Temple every wisp is one of these two. The Bog's mushrooms are the same green as the misleads on purpose: the swamp's own colour is the one not to trust in here, and the lantern's amber is.

#### 2.4.5 The map

Descending: every room is a little lower and a little wetter. x east, z south, y up (negative y is below the entry's waterline).

| Id | Room [new text] | Type | Centre (x, z, y) | Size (m) | Depth | Doors and gates | What is in it |
|---|---|---|---|---|---|---|---|
| S1 | The Drowned Steps | start (rest, plaque) | (0, 0, 0) | 12 × 12 | 0 | S: the steps up (retreat); N → S2 (a lantern gate, 1 sconce) | plaque `Toxic air fills the sunken temple...`; 30 % heal; the eighth lantern's hook; one sconce; the first amber wisp |
| S2 | Sconce Hall | puzzle (sconce chain, 3) + combat | (0, −14, 0) | 16 × 12 | 1 | S ← S1; N → S3 (lantern gate, 3 sconces) | 3 sconces; 1 wave; one wisp hollow with a dormant Wraith in a dark corner; 3 green wisps |
| S3 | Lily Crossing | traversal (pads, wisps) | (0, −30, −1) | 18 × 12 | 2 | S ← S2; N → S4 | black water; 14 pads (8 leaf, 6 stone); 1 amber wisp; 6 green wisps over the leaf pads; a sconce on the far bank |
| S4 | The Tide Room | combat + tide + pads | (0, −46, −1) | 16 × 14 | 3 | S ← S3; N → S5 (lantern gate, 4 sconces); W: a dark culvert → S12 | 2 waves; the mist tide; 4 sconces, one on a stone pad mid-crossing; the culvert has no wisp at all |
| S12 | Wisp Hollow (optional, secret) | treasure | (−16, −46, −1) | 8 × 8 | 3 | E ← S4 (the culvert) | 12 green wisps and 2 Wraiths around a normal chest; no sconce: the lantern is the only light; plaque `A gleaming chest awaits...` |
| S5 | The Lantern Gate | puzzle (relay) | (0, −60, −2) | 16 × 10 | 4 | S ← S4; N → the dark hall → S6 / S7 | the gate, the pedestal on its rail; 2 sconces on the near side |
| S6 | The Reliquary (the key) | treasure | (12, −70, −2) | 8 × 8 | 5 | W ← the dark hall | the **key chest** (a lantern-shaped key of green bronze) in a dry alcove; plaque `A gleaming chest awaits...`; 4 green wisps |
| S7 | Sealed Cistern | ability (Collette) | (0, −74, −2) | 14 × 12 | 5 | S ← the dark hall; N → S8 (the seal); the rail's end | 1 wave; the magic seal; the pedestal arrives here; the bonus chest |
| S8 | Dry Chapel | rest (hearth, checkpoint) | (0, −88, −1) | 10 × 10 | 6 | S ← S7; N → S9 | the only dry room: a raised chapel floor, the hearth, moss on the pews; name card `Dry Chapel` |
| S9 | The Drowned Nave | set piece (sconce chain 12, tide, Wraiths) | (0, −106, −3) | 24 × 18 | 7 | S ← S8; N → S10 (lantern gate, 12 sconces) | §2.4.6 |
| S10 | Hydra Stair | boss antechamber | (0, −122, −4) | 8 × 8 | 8 | S ← S9; N: **locked** portcullis → S11 | a stair down into water; the sunken portcullis with the `🔒`; the checkpoint; 2 sconces |
| S11 | The Matriarch's Pool | boss | (0, −138, −5) | 20 × 16 | 9 | S ← S10 (locks for the fight) | `bosses.md` §2.9's flooded nave: raised stones (stone pads) in a broken grid, the pool at the north end |

```
                 [S11 Matriarch's Pool] -5
                        | locked
                 [S10 Hydra Stair] -4
                        |
                 [S9 Drowned Nave] -3      <- 12 sconces, the tide
                        |
                 [S8 Dry Chapel] -1        <- hearth
                        |
   [S6 Reliquary]..[S7 Sealed Cistern] -2  <- the key; Collette's seal
      (key)         :  the dark hall
                 [S5 Lantern Gate] -2      <- leave the lantern
                        |
   [S12 Wisp Hollow]..[S4 Tide Room] -1
     (secret)           |
                 [S3 Lily Crossing] -1
                        |
                 [S2 Sconce Hall] 0
                        |
                 [S1 Drowned Steps] 0  <- the eighth lantern
```

Critical path S1 → S2 → S3 → S4 → S5 → S7 → S8 → S9 → S10 → S11 (10 rooms); the key S6 off the dark hall; the secret S12. Run length 20–25 min.

#### 2.4.6 The set piece: the Drowned Nave

A flooded hall 24 × 18 m, knee-deep, twelve columns in two rows down its length, a sconce on every column, the far gate needing all twelve. When the first sconce is lit the **tide starts** and the Wraiths come: every dark stretch between columns is a wisp hollow, so with one sconce lit there are eleven dark stretches and the mist is rising. The run: light them in a chain down the nave (Collette's 0.3 s or anyone's 1.5 s), fight the Wraiths that condense behind you (`enemies.md` §2.4 blink and claw; they blink away when the stretch lights), stand in the clean discs when the mist is up, and get to the twelfth inside the first sconce's 40 s or start again from the ones that guttered. A `healer` and two `troll` wade in from the sides at sconce six. At the twelfth: the gate opens, the tide stops for good in this room, the water stills, and the **camera lift** plays: pitch to 60°, ×1.3, 3 s, looking down the nave at twelve amber flames in two lines reflected in black water with the mist pooling low between the columns and the four kids at the far end. It is the Witch's Lanterns path, indoors, and it is the Temple's picture. Name card `The Drowned Nave`; `temple.naveLit`, a chord.

#### 2.4.7 The Rusted Lantern

An inventory item **[new text]**: name `Rusted Lantern`, card line `It won't stay lit outside. Inside, it's the only thing that does.`, icon 🏮. Taken from the eighth post at the Drowned Steps (interact; `equip` 0.4); carried for the run; kept after the Temple as a memory item that does nothing on the overworld (it will not stay lit: the flame gutters in 5 s whenever it is raised outside, a small joke a kid can repeat); carried again through Home, Wrong's Inner Sanctum (§2.6), where it is the only warm light the party owns.

#### 2.4.8 Enemies

Pool `troll, bat, goblin, healer` + `wraith, mushroom` (`enemies.md` §2.5 Witch's Lanterns). Wraiths are the darkness's natives and come from dark stretches, not waves (waves draw from the other five); Sneaky Shrooms are seeded among the floor mushrooms in every dry corner (2–3 per room); Bats roost over the crossings; the Goblin Healer's lantern is emissive only (its teal light gives no clean air: a lantern that is not ours). Elites as on the overworld.

#### 2.4.9 The boss door and the arena

The Reliquary's key raises the Hydra Stair's sunken portcullis (`Door unlocked!`, `door_unlock`). The Matriarch's Pool is `bosses.md` §2.9's flooded nave verbatim: knee-deep water, raised stones 1.5 m in a broken grid (these are stone pads, the language the Lily Crossing taught; none sink), the pool at the north end, fog `dng.bog` at 0.85 with `light.heroPool` 6 m for the fight (the boss-room value; the room is still dark beyond it), `light.boss` in the body, the lantern posts on the columns as `bosses.md` says (cover for nothing). The Rusted Lantern and Collette's orb are the party's light in the fight; the P3 flood band is the tide's cousin (`The water rises!`). After `Hydra Matriarch DEFEATED!` the pool drains through a sluice that carries the party up to the Drowned Steps (20 s), the back door. Fern's line 3 waits at the jetty.

#### 2.4.10 Rest, lore, key, secrets

The Drowned Steps: `Toxic air fills the sunken temple...`. Treasure rooms: `A gleaming chest awaits...`. The hearth at the Dry Chapel; the second checkpoint at the Hydra Stair. Lore secret 4 is outside behind the Witch's hut (`story-beats.md`). Collette's `dungeon_enter` line (`...better lighting...`) is, in hindsight, about this place; nothing new is written for it.

#### 2.4.11 Recognizable from its rules

You see only what you carry light to; the thing you left dark is behind you now; amber tells the truth and green lies. No other dungeon takes the light away.

### 2.5 The Ice Citadel (the Hermit's Observatory, Frozen Peaks; Phase 3)

**Entrance.** The Hermit's Observatory at the summit (140, −90): a 22 m stone tower with a brass-ribbed dome, the only man-made silhouette on the island (`story-beats.md`), its great gears visible turning through the dome's slits from outside at 0.05 rad/s (Ed's `post_quest` line 5: `There's a strange tower to the east... gears turning inside, no one at the controls. Reminds me of my workshop.`). At its foot, the **ice arch** keeps AR §3.2's aurora shimmer as an emissive arc `#8FD3F4` → `#E56BFF` at `0.15 + 0.05·sin(2t)`, always faintly on (`world-events-weather.md` §2.3.3: a permanent hint that the arch answers to the sky). Lore secret 5 at (128, −70). Card: `The Ice Citadel` over `FROZEN DUNGEON`, desc `Ice walls echo with dark magic. A lich commands the frost.`, colour `#A8D0E8`. Read at distance: the dome on the summit; up close, an arch that shimmers with the colours the sky will have tonight. Canon keeps the two citadels distinct (FC §13.3): `The Ice Citadel` here, `The Shadow Citadel` in §2.6.

#### 2.5.1 The core rule: ice momentum

| Rule | Value |
|---|---|
| Ice floors | every floor in the tower is blue ice (`#8FD3F4` over `#1B2A5A`, `pt.glitter` on it) except **stone islands**: dark slate landings, rugs, gravel and the rope lines' posts |
| Friction | on ice, ground **acceleration ×0.25** and per-tick velocity damping **0.988** (60 Hz) against the controller's normal stop; from a run (4.5 m/s) a hero **slides about 6 m** after releasing input (design values, §6); max speed is unchanged, so ice never slows anyone, it only refuses to stop them |
| Turning | steering adds acceleration at the ice rate, so a turn is a wide arc; a kid learns to steer early |
| Dodge | 2.0 m → **3.0 m** on ice (×1.5); Noah's Dodge Roll 3.0 → 4.5 m; i-frames unchanged |
| Enemies | the same damping: a Shieldbearer's bash lunge carries it 2 m past you; a Bomber's straight sprint does not stop at the wall it meant to stop at; Archers plant their feet (root lock) and are the one thing on ice that holds still |
| Holding on | a hero within 1 m of a **rope line** or touching a stone island has stone friction (the `ice.rope` hold read: a hand goes to the rope) |
| Bell plates | a plate with a bronze bell face that triggers only when a hero or block hits it at **≥ 4 m/s** (`ice.bellPlate`, a struck bell): the slide gate |
| Sliding blocks | v27 push blocks as 1 m ice cubes: a shove starts them and they **slide until they hit something** (a wall, a block, a stone island), `ice.slide`; the classic ice-block puzzle, plates under the target spots |
| Read | the first hall is a straight slide into a bell that opens a door; nobody has to be told |

A skid pose (`slide`, feet apart, arms out) and a rope-hold pose are requested of `heroes.md` (§5). Animation rate on ice is unchanged; the feet just do not agree with the ground, which is the joke.

#### 2.5.2 Traversal: rope lines, and the lift

**Rope lines** run through the **Broken Gallery**, where the tower's outer wall has fallen and the summit's weather pours in: an **open-sky** room with `visOverride 4` and the blizzard recipe indoors (`world-events-weather.md` §2.8.5: `pt.snow` ×2000 streaming at (8, −3, 0), the 12 wind-streak billboards, the aggro cap at 5 m). A rope on iron posts every **4 m** is the path. Within 1 m of the rope a hero holds it (stone friction, the hand on the rope); beyond 2 m of the rope the gallery's floor has **gaps** the blizzard hides (a fall is 15 damage and a 1.5 s fade back to the last post; never a death). Bombers sprint out of the white at 4 m; the rope is where you fight them, holding on. Companions collapse their slots onto the rope. The gallery is also where a kid first sees the aurora from inside the tower, if it is night.

**The lift** (I10): a 4 m crystal platform in a shaft, **aurora-powered** (§2.5.3): with `world.aurora.intensity ≥ 0.5` its conduits glow the sky's colours and it rises 8 m in 6 s with the party aboard (`ice.lift`); unpowered, it is a dark slab and the shaft above is black. Companions ride it.

#### 2.5.3 Puzzle language

| Type | Rules | Telegraph | How a kid learns it |
|---|---|---|---|
| **Crystal resonance** | a room holds 3–5 **crystals** (1.6 m ice pillars, `#8FD3F4`, each tuned to one pentatonic tone: C4, E4, G4, A4, C5; `audio.md`) and one **teacher crystal** (2.4 m, `#E56BFF`); when a hero comes within 4 m of the teacher it plays the sequence: each crystal lights and rings in order, 0.6 s apart; strike them in that order (**any hero attack** that hits the collider; a companion's stray hit counts); a wrong strike plays `ice.crystalWrong` (a dull thunk), everything goes dark, and the teacher replays after 1 s; the complete sequence rings all of them together (`puzzle_solve`) and the room's door opens. Lengths **3** (the Chime Gallery), **4** and **5** (the Resonance Vault). Brightness reads `world.aurora.intensity` (`0.4 + 0.6·intensity`) so the crystals breathe with the sky | the lit-in-order replay, as often as you like; each crystal's glow while it rings | it is the memory toy every kid knows; the first one is three notes in a row |
| **Aurora power** | exactly **two** mechanisms are aurora-powered: the **frost gate** between the Orrery and the Resonance Vault, and the **lift**. A mechanism is powered when `world.aurora.intensity ≥ 0.5` (`world-events-weather.md` §2.3.4's default threshold); powered conduits glow `#5FFFAF` → `#E56BFF` on the same noise scroll as the snow. Reaching night is the player's job: wait, or rest at the Hermit's stove (`Until dusk`, ten metres from the gate). The aurora is hidden in island `blizzard` weather (intensity 0); the gallery and the open dome show the sky, so a kid sees the curtains come and go, and the rest re-rolls the weather too | the conduits in the floor run visibly from the dome down to the gate and the lift; dark by day, the sky's colour by night; the gate itself is a sheet of ice with a snowflake glyph that frosts over when unpowered | same colour as the sky, same time as the sky; the Hermit's window in the Quarters frames the dome, and the stove prompt says `Until dusk` |
| **Sliding blocks and bell plates** | ice cubes slide until stopped; get three onto three plates (the Block Cellar); a bell plate wants speed (the Slide Hall) | plates and blocks in the shared language; the bell's face | the Slide Hall is a straight run into a bell; the Block Cellar has one cube, one wall to stop it and one plate at the wall's foot, then two more |
| **Rope lines** | hold the rope; leave it and the floor may not be there | the rope; the white | the first gap is 1 m past the rope in plain view before the storm thickens |

#### 2.5.4 The map

A tower: tiers rise. x east, z south, y up. Rooms may stack (§2.1.1).

| Id | Room [new text] | Type | Centre (x, z, y) | Size (m) | Depth | Doors and gates | What is in it |
|---|---|---|---|---|---|---|---|
| I1 | The Frost Gate | start (rest, plaque) | (0, 0, 0) | 12 × 12 | 0 | S: the ice arch (retreat); N → I2 | plaque `The ice citadel groans with dark magic...`; 30 % heal; a stone landing (the last stone floor for a while); two iron torches |
| I2 | Slide Hall | traversal (ice, bell plate) | (0, −16, 0) | 20 × 12 | 1 | S ← I1; N → I3 (barred: the bell plate) | a 16 m ice run into a bell plate at the north wall; a few Goblins on the ice |
| I3 | The Windings | combat (ice) | (0, −31, 0) | 16 × 14 | 2 | S ← I2; E → I4 | 2 waves; Shieldbearers and Bombers on ice; two stone islands; four torches |
| I4 | Chime Gallery | puzzle (resonance, 3) | (16, −31, 0) | 14 × 12 | 3 | W ← I3; N → a stair up to I5 (opens on the chord) | teacher + 3 crystals; the stair door |
| I5 | Broken Gallery | traversal (rope, blizzard, open sky) | (24, −18, +4), running z −30 → −6 | 24 × 8 | 4 | S ← the stair; N → I6 | the rope on 7 posts; gaps; 2 Bombers and 2 Archers in the white; the aurora overhead at night |
| I6 | Block Cellar | puzzle (sliding blocks) + the key | (24, +2, +4) | 16 × 14 | 5 | S ← I5; W → I7 (barred: three plates) | plaque `Ancient mechanisms block the way.`; 3 ice cubes, 3 plates, 2 stone stops; the **key chest** (a crystal key) in a frost alcove that opens with the plates |
| I7 | The Hermit's Quarters | rest (hearth: the Hermit's stove; checkpoint) | (10, +2, +4) | 10 × 10 | 6 | E ← I6; W → I8 | the stove (the hearth, with a kettle); a bed, charts, a window framing the dome; name card `The Hermit's Quarters` |
| I8 | The Orrery | set piece + ability (Isabella) + combat | (−4, −6, +4 → +8) | 20 × 20, the ring 16 m across | 7 | E ← I7; N → I9 (the **frost gate**, aurora) | §2.5.5 |
| I9 | Resonance Vault | puzzle (resonance, 4 then 5) | (−4, −24, +8) | 16 × 12 | 8 | S ← I8 (the frost gate); N → I10 (opens on the second chord); W: a hidden panel → I12 | teacher + 5 crystals (a 4-note sequence, then a 5-note one); the crystals at aurora brightness |
| I12 | Star Chart Room (optional, secret) | treasure | (−16, −24, +8) | 8 × 8 | 8 | E ← I9 (the panel: a crystal struck out of sequence three times in a row opens it, the one time a wrong note is right) | a normal chest under a ceiling painted with the five family constellations (`world-events-weather.md` §2.6: The Biplane, The Lantern, The Campfire, The Squad, The Meteor); plaque `A gleaming chest awaits...`; a memory-collectible hook for Phase 4 |
| I10 | The Lift | traversal (aurora) + boss antechamber | (−4, −40, +8 → +16) | 8 × 8 | 9 | S ← I9; up: the lift; at the top, N: **locked** → I11 | the crystal platform; at +16 the `🔒` door under a frost lintel; the checkpoint (at the top) |
| I11 | The Lens Room | boss | (−4, −40, +16) | 20 × 16 (round, under the dome) | 10 | S ← the lift (locks for the fight) | `bosses.md` §2.10's lens room: the round ice floor, the great lens overhead, the aurora through it at night |

```
                 [I11 Lens Room] +16          <- under the dome
                        | locked
                 [I10 The Lift] +8 -> +16     <- aurora-powered
                        |
   [I12 Star Chart]..[I9 Resonance Vault] +8
     (secret)           | frost gate (aurora)
                 [I8 The Orrery] +4 -> +8     <- Isabella; the dome opens
                        |
                 [I7 Hermit's Quarters] +4    <- the stove; rest until dusk
                        |
                 [I6 Block Cellar] +4         <- the key
                        |
                 [I5 Broken Gallery] +4       <- rope, blizzard, open sky
                        | stair
   [I3 Windings]--[I4 Chime Gallery] 0
        |
   [I2 Slide Hall] 0
        |
   [I1 Frost Gate] 0  <- the ice arch
```

Critical path I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10 → I11 (11 rooms); the secret I12. Run length 22–28 min plus one wait for night (at most the rest's 3 s).

#### 2.5.5 The set piece: the Orrery, and Isabella's gears

The tower's heart: a round chamber 20 m across whose floor is a **ring of ice segments 16 m across around a still stone hub**, under the closed brass dome; the dome's great gears (the ones Ed saw turning) turn overhead at 0.05 rad/s and always have. The ring is meant to turn too and does not: the **lift's drive gear**, a 2 m brass wheel at the hub's edge, is jammed solid with ice. The room activates as an ability room: **1 wave** (Shieldbearers on the ring, sliding), then the hint `Gears are jammed... Isabella could break them!` in her glow. Her whirl on the gear: `Isabella breaks the gears!`, the ice bursts (20 shards), the drive engages with a clank (`ice.orreryStart`), and the set piece plays: the **ring begins to turn at 0.1 rad/s** (a slow carousel; heroes on it are carried; the ice is still ice), the frost gate's conduits on the north wall thrum, and over 4 s the **dome irises open** (`ice.domeOpen`, shake 6 / 0.5): the open-sky flag flips, the island keyframe blends in at `1 − dark`, snow drifts down onto the ring, and if it is night the aurora pours through and the conduits light from the dome downward in a wave. The **camera lift** plays for those 4 s and holds 2 more: pitch 60°, ×1.3, the whole ring turning under the open dome with the four kids riding it. The gears turned before she came; the tower *works* because she hit it. Name card `The Orrery`. The bonus chest lands on the hub. If it is day, the dome stands open and dark; the Quarters are through the east door, and the stove says `Until dusk`.

#### 2.5.6 Enemies

Pool `shielded, archer, goblin, bomber` (`enemies.md` §2.5 Hermit's Observatory). Shieldbearers are the Citadel's joke (a wall with feet that cannot stop); Bombers on ice are a straight line you step out of; Archers hold the stone islands. Elites as on the overworld. No fliers.

#### 2.5.7 The boss door and the arena

Two gates: the **lift** needs the aurora (§2.5.3), and the door at its top needs the Block Cellar's **key** (`Door unlocked!`). So the Ice Citadel requires **one night** (§6): a rest at the Hermit's stove makes it a choice, not a wait, and the Frozen night is the island's hero look, so the dungeon is arranged to be finished under it. The Lens Room is `bosses.md` §2.10 verbatim: a round floor of blue ice under the dome (ice physics on, this file's rule), the great lens overhead with the aurora through it at night, fog `dng.frozen`, `light.heroPool` 6 m, ice walls as cover; the P3 BLIZZARD's `visOverride 4` is the Broken Gallery's language. After `Frost Lich DEFEATED!` the lens overhead clears and a **lens chute** (the dome's maintenance slide, 20 s) drops the party to the Frost Gate, the back door. Neve's line 3 waits at the Hearth.

#### 2.5.8 Rest, lore, key, secrets

The Frost Gate: `The ice citadel groans with dark magic...`. The Block Cellar: `Ancient mechanisms block the way.` (the frozen puzzle-room lore, FC §10.5). Treasure rooms: `A gleaming chest awaits...`. The hearth is the **Hermit's stove** (the same prompt, the same rules, a kettle on it; the Hermit is not here and nothing is written about him). Checkpoints at the Quarters and the top of the lift. The Star Chart Room is the Citadel's secret and a Phase 4 memory hook.

#### 2.5.9 Recognizable from its rules

You cannot stop, the doors sing, and the sky is a battery. No other dungeon cares what time it is.

### 2.6 Home, Wrong (the Shadow shard; Phase 4)

The whole shard is the dungeon (`story-beats.md` §2.2): 160 × 140 m, the Forest island's camp quadrant mirrored and wrong, entered only through the crater portal after all four island dungeons and Ed's `crater_awareness`. **No free roam:** the way behind seals as each region is entered (ash roots close the gate with the region's banner), so the only direction is forward. The three canon Citadel floors are its regions; the Citadel Warden guards the citadel the cabin has become; the Shadow Queen sits at the corrupted hearth. Every mechanic in it was learned in the other four, and every one is turned: inverted, broken, or with the light gone.

#### 2.6.1 Cards, banners and the descent

| Moment | What shows (verbatim canon unless marked) | Where |
|---|---|---|
| CS-08 ends (8 s; `cutscenes.md`) | `Welcome to the Shadow Realm...` | the mirror crater |
| The Outer Ward gate | the intro grammar (`bosses.md` §2.3) on the threshold rig with the card **`Shadow Citadel — Floor 1`** over **`Outer Ward`** (the v27 L7074 form), and beneath the subtitle, in the desc style, the canon `citadel` description **`The ultimate darkness awaits within. Three floors stand between you and the Citadel Warden.`** (delivered here, `bosses.md` §5.2's choice given to this file); at 4.1 s the announce **`Shadow Citadel — Floor 1: Outer Ward`** `#7B3CA0` 3 s (L7072) | the ash gate between the crater and the Ward |
| While in a region | the on-screen banner **`SHADOW CITADEL — Floor N: <floor name>`** (L8060) as the compass strip's dungeon name; `Room N/M` counts the region's spaces | the HUD |
| Floor 2 | **`The shadows deepen... dark whispers fill the air.`** (L7084), every living hero healed 30 % (v27), the card `Shadow Citadel — Floor 2` / `Inner Sanctum`, the banner updates | the gate from the Ward to the Sanctum |
| Floor 3 | **`The final threshold. No turning back.`**, 30 % heal, the card `Shadow Citadel — Floor 3` / `Throne of Shadows`; the gate seals behind with a `bars_slam` that is the line made literal | the gate from the Sanctum to the Throne |
| The Warden's death | the citadel door opens (`bosses.md` §2.15); a 0.3 s threshold fade into the hearth (§2.6.6) | the door |
| The Queen's death | `★ THE SHADOW CITADEL HAS FALLEN ★` and the rest of `bosses.md` §2.16.1 | the hearth |

The `dng.citadel1` → `2` → `3` fog descent and the `pt.ash` 20 → 25 → 30 escalation (AR §15.5) run region by region: the air itself says how deep you are, and the fourth colour is red.

#### 2.6.2 The composition: which mechanic each region reuses, and how it is wrong

| Region (canon floor) | Mirror of (`story-beats.md`) | Mechanic reused | How it is wrong | Canon floor hazard |
|---|---|---|---|---|
| The mirror crater | the crater | none: arrival | the glow is the wrong way up (a rift-cyan pulse rising instead of the teal core's 8 s breath) | — |
| **Outer Ward** (Floor 1) | the Rootways | the Grove's **root rhythm** and **glow moss**; the four **ability rooms** as the Four Locks | **broken beat:** the ash roots (`#605C66`, seams rift cyan) have no heartbeat; a wall rises 1.2 s after any hero comes within 3 m of its seam (a reflex, telegraphed by the seam's cyan flare and the dashed line) and retracts 12 s later, so the way through is to move together and fast, or to read the moss. **Inverted moss:** `shadow.deadMoss` **[token]** `#3AF0FF` at 0.5 glows *in the dark* along the seam-free path and **dies for 8 s inside any carried light** (Collette's orb, the Rusted Lantern; the hero pool does not count, it is a rendering convention). The party learns to let Collette walk last (her formation slot C is 2.2 m back) so the path ahead stays lit: the wrong world hates her light | **spikes** (`arenaHazard spike`, rows of 1 m strips on the 2 s cycle along the root lines; the Sentinel's clearing has two rows) |
| **Inner Sanctum** (Floor 2) | the stream, the hideout, the cave mouth | the Temple's **darkness, pads, tide, wisps**; the Tomb's **sand-flow** | **the light gone:** every sconce is dead and cannot be lit (touching one leaves a cyan smear, `shard.deadSconce`); the only lights are the Rusted Lantern (6 m), Collette's orb, and the cyan stream, which lights nothing warm. **All wisps are green** (they mislead) except one amber wisp that ignores sconces and drifts toward the far warm light's bearing: the guide here is home's direction. The mist tide runs (poison, the canon hazard) with the same clean-air rule, so the lantern the party carried out of the swamp is what keeps them breathing. The pads on the **uphill** stream sink in **0.8 s** (faster) and resurface in 5 s. **Ash-flow:** the mirror Lamplight Landing is a basin where ash **rises from the floor** like the mist (no spouts) on two levers that read backwards (the fill lever's glyph is a drain glyph); the gate out is at +4 m; the rates are the Tomb's | **poison** (the tide; `poison_patch` pools in the stream's eddies, `bosses.md` §2.13) |
| **Throne of Shadows** (Floor 3) | Stewart Camp at C6 (`camp.md` §2.8, mirrored and inverted) | the Citadel's **ice momentum** and **aurora power** | **ice:** the frozen mirror stream, the black-glass pond and the frosted apron are ice (the 6 m slide) under a sky that never changes; **the battery is dead:** the citadel door's conduit is an aurora conduit with no aurora over it (the crest banner pole is a dead teacher crystal), and no rest, no wait and no night will power it: `bosses.md`'s rule holds, the door opens only on the Warden's death, and the dead conduit is how a kid knows this place does not answer to the sky | **ice** (the canon Throne hazard) |
| The corrupted hearth | the cabin's great room | none: the Queen (`bosses.md` §2.16) | the fire is a throne; the window shows the real fire | — |

And the family's own rooms, mirrored: the shadow squad sits at the cold mirror fire in the kids' seats (`camp.md` §2.7.6; `bosses.md` §2.14), the tent is torn, the washing line is empty, the crest hangs upside down, the swing swings by itself (`camp.md` §2.8 whole; this file adds nothing to that manifest and builds it as written).

#### 2.6.3 The map

Shard-local metres, origin at the mirror fire (the C6 fire mirrored), x east, z south, y the shard's ground (the Throne is at 0; the Ward and the Sanctum are terraces at +6 and +3). Home is **south**, below (§2.6.6). Spaces are open-air clearings walled by ash roots, ruin and rift; "gates" are ash-root gates that seal behind.

| Id | Space [new text] | Region · fog | Type | Centre (x, z, y) | Size (m) | What is in it |
|---|---|---|---|---|---|---|
| H0 | The Mirror Crater | arrival · `dng.shadow` | start (CS-08) | (60, −70, +6) | r 12 | the crater, the glow wrong way up, the portal's three arcs behind the party (the way back is a save-and-leave, §2.6.7); the amber wisp that points home; the first banner gate to the south-west |
| H1a | The Ash Gate | Outer Ward · `dng.citadel1` | threshold (card, banner) | (44, −52, +6) | 8 × 8 | the gate; the card; 30 % of the way it seals behind |
| H1b | Ash Run | Outer Ward | traversal (reflex roots, dead moss) + combat | (30, −36, +6) | 24 × 16 | twelve reflex walls; the cyan moss path; 2 waves (`shielded, orc, archer, troll, wraith` at ×1.5); an Ash Drift nest at each end |
| H1c | The Four Locks | Outer Ward | the composed ability rooms | (30, −18, +6) | 16 × 12 | §2.6.4 |
| H1d | The Sentinel's Clearing | Outer Ward | mini-boss | (30, 0, +6) | r 8 (16 m) | `bosses.md` §2.13's Stone Sentinel, dormant as an ash statue; two spike rows; an Obsidian Plinth (a second statue that does not wake until the Sentinel is at 50 %); the ash roots part on his death; the Floor 2 gate to the west; the checkpoint |
| H2a | The Dead Sconces | Inner Sanctum · `dng.citadel2` | darkness + tide | (−10, −6, +3) | 20 × 14 | twelve dead sconces in the mirror of the Sconce Hall's shape (a kid will try them); the tide; green wisps ×12; two Wisp Hollows; the mirror cave mouth's stair leading down to it is where the Sanctum banner plays |
| H2b | The Uphill Crossing | Inner Sanctum | pads (0.8 s) + mini-boss | (−34, −4, +3) | 14 m along the stream | the cyan stream running uphill, leaf pads only, the hideout's hollow log on the bend as the Phantom Warden's wisp hollow and 2 m cover (`bosses.md` §2.13); Ember Vents on the banks |
| H2c | The Ash Basin | Inner Sanctum | ash-flow | (−52, 10, +3 → +7) | 16 × 14 | the mirror Lamplight Landing: Quartz's hook with no lamp; two backwards levers; the ash rises to the Floor 3 gate at +4 (a terrace step down to the Throne at 0 beyond it); Magma Slimes in the ash; the checkpoint at the gate |
| H3a | The Glass Pond and the Frozen Stream | Throne of Shadows · `dng.citadel3` | ice traversal + combat | (−20, 34, 0) | 30 × 20 | the pond as black glass, the stream frozen, the mirror bridge with every other plank missing (crossable; the cyan shows through), the garden's ash beds; 2 waves (`obsidian_guard, fire_elemental, troll, shielded, bomber, healer` at ×2.5): Bombers on ice again, wrong-coloured |
| H3b | The Mirror Fire | Throne of Shadows | set piece (the shadow squad) | (0, 0, 0) | r 12 (24 m) | `camp.md` §2.7.6's cold fire and the five seats; the shadow squad in the kids' four; `bosses.md` §2.14 whole; the twelve dead lanterns, two still swinging |
| H3c | The Dooryard | Throne of Shadows | boss (Citadel Warden) | (−8, −12, 0), between the fire ring and the citadel door | 20 × 16 | `bosses.md` §2.15 verbatim: the mirror fence and the dead fire ring on the fire's side, the citadel door on the far side, the woodpile and the workbench as cover, the dead conduit on the door; the far light behind the party |
| H4 | The Corrupted Hearth | the citadel · `dng.citadel3` | boss (the Shadow Queen) | its own interior (§2.6.6) | 24 × 20 | `bosses.md` §2.16 verbatim |

```
   [H0 Mirror Crater] +6  <- CS-08, "Welcome to the Shadow Realm..."
            |
   [H1a Ash Gate] ---- card: Shadow Citadel - Floor 1 / Outer Ward
            |
   [H1b Ash Run] +6        reflex roots, dead moss
            |
   [H1c The Four Locks]    Liam . Noah . Collette . Isabella
            |
   [H1d Sentinel's Clearing]   Stone Sentinel, spikes        <- checkpoint
            |  gate: "The shadows deepen... dark whispers fill the air."
   [H2a Dead Sconces] +3   darkness, the tide, the Rusted Lantern
            |
   [H2b Uphill Crossing]   pads 0.8 s, Phantom Warden
            |
   [H2c Ash Basin] +3->+7  ash rises, backwards levers          <- checkpoint
            |  gate: "The final threshold. No turning back."
   [H3a Glass Pond] 0      ice
            |
   [H3b Mirror Fire]       the shadow squad
            |
   [H3c Dooryard]          Citadel Warden                       <- checkpoint
            |  the door opens; 0.3 s fade; the dome yaws
   [H4 Corrupted Hearth]   the Shadow Queen; the far light in the window
```

Eleven spaces, four regions, no side rooms and no key (the shard has no locks a key would fit; the Four Locks are the kids). Run length 60–75 min (`story-beats.md` Act 3). The Dooryard's centre is `bosses.md`'s: the yard lies between the fire ring and the door, whichever compass word the builder ends up using (§5.3).

#### 2.6.4 The Four Locks

An ash gate 8 m wide across the Ward with four seals on it, lit one at a time in canon index order: a **cracked wall** of black bark (Liam), a **seed pod** hung 5 m up on a dead bough (Noah), a **seal of glyphs** (Collette), a **jammed gear** of rusted brass grown into the roots (Isabella). The space activates as an ability room with **one wave** (`shielded, orc, archer, troll, wraith`), then the first lock goes live with its verbatim hint in the hero's glow; each success line opens one quarter of the gate and lights the next lock's hint; every refusal line is reachable by the wrong kid trying. On the fourth, the gate falls apart into ash. Rules as §2.1.9 (a downed kid's lock waits; nothing else opens it). It is the four rooms of the four dungeons in one place, which is what "composes mechanics learned in the other four" means at family scale: the door out of the dark needs all four of them, in the order they were born. No new text; the hint, success and refusal lines are FC §2.4 verbatim, each fired here a second time.

#### 2.6.5 Enemies

The v27 Citadel floor pools verbatim (`enemies.md` §2.5): Floor 1 `shielded, orc, archer, troll, wraith`; Floor 2 `troll, fire_elemental, shielded, obsidian_guard, brute`; Floor 3 `obsidian_guard, fire_elemental, troll, shielded, bomber, healer`; all in the **shadow tint** (`enemies.md` §2.9: `#120A1F` bodies, rift-cyan accents and eyes), `enemyScale` 1.5 / 2.0 / 2.5, count +1 capped at 10 (v27). The fire family's secondary home (`DECISIONS.md`, the orchestrator's line): **ember zones** built from `enemies.md` §2.8's Shadow Realm nests at its counts (4 Ember Vents, 3 Magma Pools, 4 Obsidian Plinths, 3 Ash Drifts), placed as the map says; nests re-arm never (there is no dawn here). The two mini-bosses, the shadow squad, the Warden and the Queen are `bosses.md`'s.

#### 2.6.6 The far warm light (the lighting brief)

`story-beats.md` §2.2: one warm light exists in Home, Wrong that is not the player's, and it is the real camp fire seen from the shard. The shard sits due north of the Forest island, 300 m up and about 400 m out (it fills a hand's width of sky over the crater in Act 3), so from the shard **home is south and below**, at about −37° from the ground plane. That geometry is what makes the light visible at the gameplay pitch: at pitch 45–55° the true horizon is never in frame (`camp.md` §2.11.5), but a glow 37° below the ground plane to the south is in frame from any south-facing rim. The build:

| Element | Value |
|---|---|
| Directional fill | a second `DirectionalLight` (the shard only; the pool is otherwise `world-events-weather.md`'s), colour `#FF9A3C`, intensity **0.03** (4 % of the locked key's 0.7), from azimuth 180° and elevation **−37°**, no shadows: it warms undersides and south-facing facets by a hair and lights no floor. Never enough to see by (`story-beats.md`) |
| The billboard | an additive quad 40 × 12 m on the void plane 400 m south and 300 m down, core `#FF9A3C`, edge `#FF6A2A`, alpha 0.35, with a 6 m warm point-halo at its centre, flickering on the **campfire oscillator** (7–9 Hz ±12 %, `world-events-weather.md` §2.8.2) so every player reads it as the fire; the below-rim cloud layer drifts across it (world-events' void clouds) |
| Where it is seen | every south rim (the crater's south lip in CS-08; the Sanctum's stream bank; the Throne's south fence, which is the shard's edge); the Dooryard, where it is behind the party (`bosses.md` §2.15); and the corrupted hearth's window behind the throne (`bosses.md` §2.16). The hearth is a separate interior: on the 0.3 s threshold fade through the citadel door the sky dome and the void billboard **yaw 180°**, so the room the party walks into "north" ends in a floor-to-ceiling broken window that looks out and down at home. Inside the citadel the world turns you back toward the fire; that is the wrongness, and it reconciles the two `bosses.md` sentences (§5.3) |
| What it must never do | light the ground, cast a shadow, take a pool slot, or go out |

Everything else in the shard is `shadow.wrongDusk` (`world-events-weather.md` §2.1.4: the dusk sun that never sets from the wrong side, the black moon with the ember rim, the mirrored constellations, the cyan lobes) and the cold lights of `camp.md` §2.7.6. "Best lighting in the game" (Brief §5.3) is one warm thing in a cold world, and the kids carrying the only other one.

#### 2.6.7 Save, wipe, re-enter

`story-beats.md` §4: a save inside Home, Wrong writes the Forest-island snapshot exactly as P1 §28.3, so the finale is always re-entered from the portal; this file adds the `dungeonRun` checkpoint block (§2.1.6) with `checkpointRoom` at the last banner gate (H1a, H1d, H2c, H3c) so `Resume <name> from the hearth?` works here too (its name is `Home, Wrong`, the shard's card is the canon Citadel card). A **party wipe** anywhere in the shard shows the canon `GAME OVER` / `The Stewart Squad has fallen...` (`ui-ux.md`) with `Try again` (from the last banner gate; dead mini-bosses stay dead; the shadow squad and the Warden reset if the wipe was theirs) and `Leave` (to the real crater at the portal, the snapshot restored). After the Queen, the shard is done: the portal collapses on the first Forest return (`story-beats.md` B3.6) and the shard is never re-entered in a cycle; NG+ rebuilds it.

#### 2.6.8 Recognizable from its rules

Everything you learned, turned around: roots that come at you, a path that dies in your light, lanterns that will not take a flame, ash where the sand was, a sky that powers nothing, and one warm light below the edge of the world that you cannot reach and that never goes out.

### 2.7 Previews outside the five

**The Crystal Caves** (`world-builder` builds; `story-beats.md` §2.2 places; `bosses.md` §2.11 owns the Depths). The under-region's rule, "only Quartz's lamps and Collette's magic light it", is the Bog's language in its gentlest form: `dng.cave` at `dark 0.72` (not 0.85), `light.heroPool` at its normal 4 m, **no torches**; Quartz's **wall-lamps** on hooks along the stair and the main paths (emissive-only, lit one at a time by his 30 s idle, `npcs.md` §2.6.3, so the caves get brighter the longer the family is around), the rim crystals brightening to 2× emissive within 6 m of any hero (`bosses.md` §2.11's proximity uniform, applied cave-wide), `pt.dust` and `pt.sparkle` (`world-events-weather.md` §2.4.2), and Collette's orb as the only carried light that casts. No wisps, no sconces to light, no tide: a kid learns that carried light matters and that the dark here is only dark, not hostile, before the Temple makes it hostile. The Depths lair keeps `bosses.md`'s `dark 0.85` and pool-off rule as the one place under the island where the caves' rule is strict. Tip 6's `early cave chic` is the caves' look: Collette said it about here.

**The Witch's Lanterns path** (`npcs.md` §2.9.2 is the spec; `world-builder` places the seven posts from (−80, 60) to (−30, −100)). Nothing here changes a number. What this file adds is the eighth post at the drowned steps (§2.4) and the rule that the Temple's sconces are the posts with stone feet: same touch, same 40 s, same gutter, same ground glow, same Wraiths in the dark. A kid who escorted the frog has already cleared the Temple's first room in their head.

### 2.8 Cuts and changes (for `KEEP_CHANGE_DROP.md`)

| v27 thing | Fate | Why |
|---|---|---|
| Procedural room graphs, the 4 × 5 slot grid, the ten-attempt generator, the linear fallback | cut; hand-authored graphs with seeded micro | five dungeons must be recognizable from their rules; a random graph has no set piece, no ability room a kid can find again, no key you remember |
| The seven-tile template grammar and the biome template variants | replaced by authored layouts | their comments' intents are now mechanics |
| The 0.6 s room slide with the sim paused | cut | contiguous rooms and real doorways |
| Heroes teleported to the opposite wall on room entry | cut | they walk in |
| The dungeon minimap panel | replaced by the compass room strip | Brief §6 "a small compass strip instead of a big minimap"; every canon string kept |
| `DOOR_CLOSED`, `V7T.puz`, `V7T.bossv7 = null`, `DUNGEON_LAYOUTS` beyond its lore strings | cut | dead |
| `resetHeroStats` on entry and the 41-field restore on exit | cut | `heroes.md` §2.5.10's baseline recompute |
| "A cleared dungeon cannot be re-entered" | replaced by quiet re-entry | places, not menus; the `ground_ed_3` dead end is gone |
| "Dungeon progress is never saved" | changed: hearth checkpoints and `dungeonRun` | twenty-minute dungeons and kids |
| The random ability-room hero | one hero per dungeon, on the path | every kid gets a room that is theirs |
| `crystal_glow` and `lava_tile` / `eruption` as room hazards | `crystal_glow` to the caves; the lava set to the Rift (`bosses.md` §2.12) | the cave and volcanic dungeons are lairs |
| The Citadel as a separate three-floor dungeon with `cave` / `swamp` / `frozen` skins | folded into Home, Wrong's three regions | `story-beats.md`; the canon floor names, hazards and mini-bosses finally do something |
| Floor 2's per-frame border damage | cut | the accident; the Sanctum's hazard is the tide and the pools |
| The healing spring in rest rooms | replaced by the hearth | the family lights a fire; the heal is the same 30 % |
| `Isabella breaks the gears!` in two colours | one colour | FC §13.3 |
| `Combat cleared! Check for bonus...` after every combat room | kept only where a bonus can exist (ability rooms and the Sun Court) | v27 printed it whether or not a chest dropped |

---

## 3. What preserves the magic

### 3.1 Recipe by recipe (ATMOSPHERE_RECIPES section numbers)

| Recipe | Kept, translated or replaced | How, and why the feeling survives at the gameplay camera |
|---|---|---|
| **§19.1 / §6.2 the dungeon light compositor and the shared torch oscillator** | **Translated**, and made the Temple's whole rule | The tinted-never-black plate is `dng.*` fog plus hemisphere at v27's own alphas (`world-events-weather.md` §2.8.1); the hero pool keeps the 1 / 0.7 / 0.3 / 0 shoulders and the boss-room enlargement; torches 4–6 per room on the 8.8–10 Hz per-torch oscillator with one value driving flame and light. In the Sunken Temple the compositor stops being décor and becomes the game: the carried Rusted Lantern and the touch-lit sconces are the torch recipe with legs, the dark beyond them is the plate at 0.85, and a Wraith condensing in an unlit stretch is what v27's darkness always looked like it was hiding. In Home, Wrong the sconces are dead and the compositor's one warm source is 400 m away and below the rim. Light and fire still agree everywhere: the hearths, the sconces, the cold mirror fire and the far light each run one oscillator for mesh and light |
| **§19.2 simultaneous layering with distinct motion signatures** | **Kept** as a room rule | Every room runs at least five layers: the fog token, the `DNG_ATMO` particles on bloom above the fog (§2.1.7), the torch or lantern pools, the telegraph decals, the wall-top fringe, and one layer that is the dungeon's own signature: sap veins pulsing on the beat, sand streaming from spouts, mist breathing off water, glitter on ice and aurora on the conduits, ash falling past ember seams. Each dungeon's air has a direction (`drift`, `up`, `up`, `down`, `drift → up → drift`), exactly v27's `DNG_ATMO` table, so you can name the dungeon from the motion alone |
| **§19.3 more than one incommensurate motion source per recurring object** | **Kept** as the mechanism rule | Every mechanism carries at least two rates: rhythm walls (the 12 s beat, the 1.2 rad/s sap pulse, falling leaves), sand (the fill rate, the surface ripple, the spout dust), sconces (the torch oscillator, the 40 s gutter curve, the orbiting wisp), crystals (the aurora noise scroll, the ring on strike, the glitter), the Orrery (the 0.05 rad/s dome gears, the 0.1 rad/s ring, the conduit wave), the far light (the campfire flicker, the void clouds crossing it). A mechanism with one rate is a switch; with three it is a place |
| **§8.1 `DNG_ATMO` per dungeon, constant population, recycled at the edge** | **Kept** | Counts, directions and the Citadel escalation 20 / 25 / 30 verbatim (§2.1.7); the recycling rule (a particle leaving the room respawns at the opposite edge) keeps the air a population and never a burst |
| **§8.2 wall torches 4–6 per room on random floor-adjacent wall tiles** | **Kept**, seeded | The same count, chosen by seed from the eligible wall segments; skinned per dungeon; absent from the Temple on purpose, which is how the Temple says what it is before a word is shown |
| **§7.4 the entrance dioramas, the six orbiting motes, the pulsing ground ring, the cleared dimming** | **Kept**, each as a hero prop | The breathing arch, the pyramid's hieroglyphs and sand streams, the drowned ruin and its lantern, the shimmering ice arch, the mirror crater; motes and ring on every one; the ring flat at 0.15 when cleared (free progress feedback, as AR says) |
| **§3.2 the ice-arch aurora shimmer** | **Kept**, promoted to a hint | Always faintly on at the Frost Gate (`world-events-weather.md` §2.3.3); the dungeon behind it is powered by the thing the arch is shimmering with |
| **§15.5 the Citadel's palette descent** | **Kept** as Home, Wrong's three regions | Violet, deeper violet, red; darker each floor; denser air each floor; the descent ends in the family's own camp gone black with ember windows |
| **§13.1 the letterbox and the shaking still frame** | **Kept** for every entry card | The threshold rig (§2.1.3) keeps every value of `bosses.md` §2.3 so a dungeon's door and a boss's arrival share one grammar; the world trembles before it lets you in |
| **§9.4 arena effects with a telegraph window then an active window** | **Translated** | Spikes, poison pools, the flood band, the mist tide, the reflex roots and the trap plates are hazards in the registry of `bosses.md` §2.2 with their two-phase life and their decals; nothing hurts without a shape on the floor first |
| **§10 the shake ladder** | **Kept**, with four dungeon sites | The canopy opening 4 / 0.3, the Hourglass 8 / 0.6, the dome 6 / 0.5, the ash gates' `bars_slam` 6 / 0.2; nothing else in a dungeon shakes the camera, and no dungeon adds hit-stop (`heroes.md` §2.5.7) |
| **§6.1 fog of war** | **Replaced** by `vis.radius` and `visOverride` (`world-events-weather.md` §2.2.5) | The Storm Chamber, the Broken Gallery, the mist band and the Lich's blizzard are the same visibility term the overworld's sand and blizzard use, so a kid who has been in a sandstorm knows a sandstorm chamber |
| **§2.4 warm on cool at night** | **Kept** as every dungeon's colour rule | Warm torches in green-black, warm braziers in brown-black, amber lanterns in teal-black, warm torches against blue ice and cold aurora, and the one warm light in the violet-and-red shard. The cold thing is the place; the warm thing is ours |

### 3.2 Family-canon threads that survive

- **The four `dungeon_enter` lines**, finally fired, at the Hollow Grove's arch in canon index order (§2.2.9): Liam's `Cool. Cool cool cool. So we're just going in there.`, Noah's `Hey do you think there are any cool bugs in here?` (the scarabs are the answer, two islands later), Collette's `This place needs curtains. And better lighting. And maybe a rug.` (the Temple is a dungeon about lighting, and the Scribe's Cell has the rug), Isabella's `I'm not scared. ...Collette, hold my hand though.` (the Lantern Gate makes it a rule: the party walks a dark hall in Collette's light).
- **The ability-room lines**, all twelve verbatim, one room per kid on the critical path, and all twelve again at the Four Locks (§2.1.9, §2.6.4): `Liam always volunteers for the hard missions` (tip 7) and his wall is the one that opens the key room; Noah's `precision` on a pod across a gap; Collette's `magic` on a seal in the dark; Isabella's `whirl` starting a tower.
- **The guides' lines are true**: Elm's `Sever the roots!` (`bosses.md`), Sol's `sun-marks` (the Sun Court lights them), Fern's `Kill it before it splits!`, Neve's `Hit hard to break the channel.`, Quartz's `These halls have waited a long time for lamplight...` (the caves get brighter as he lights them) and `You carry brightness where it matters most.` (the Rusted Lantern, carried into the shard).
- **Ed's `There's a strange tower to the east... gears turning inside, no one at the controls.`** is the Orrery, gears turning, until Isabella is at the controls.
- **The Bog Witch's `He only hops toward light, so light the way.`** is the Temple's rule, said in daylight first.
- **Every dungeon string** (FC §11.2 names and descs, §11.3 rewards, §10.5 lore, §12.8 UI, §6.6 Citadel banners, §9 `Dungeoneer`, `Ed's Landing`, `Citadel Conqueror`, `True Final Boss`) at a trigger this file names; `Tip: Collette says the dungeon decor is 'early cave chic.'` is now a look you can point at.
- **The family's own things in the finale**: the seats at the fire, the tent, the crest, the washing line, the swing, the cabin, all wrong, and the Four Locks in the order the kids were born.

**What a kid will recognise from v27.** The name over `FOREST DUNGEON` sliding in under black bars while the screen shakes; `Room N/M` and the little `🔑`; the bars slamming down when you walk into a room and `Room cleared!` when you finish; pressure plates that click and blocks you shove; a key in a chest and a locked door before the boss; `These cracks look weak...` and `This requires LIAM's ability!` when the wrong kid tries; pots and crates that break; spikes on a rhythm; the torches; the dark past the torches; the healing room's lore line; the `Guardian of` card; the `CLEARED!` card with the Hearthroot Seed on it; and `SHADOW CITADEL — Floor 1: Outer Ward` before things get red. The rooms are the same size. What is in them is not.

---

## 4. Build notes for implementers

### 4.1 Assets

Sources per Brief §4.6 and §7.1: procedural rigs and code primitives first, GLB (custom Blender or CC0 Kenney kits) behind a Rule 2 gate; every file in `assets/LICENSES.md`. Budgets are triangles at High.

| Asset | Source | Budget | Phase |
|---|---|---|---|
| Room kit per dungeon: wall segments (straight, corner, doorway, barred, locked), floor slabs, fringe pieces (root, spout-lintel, vine, icicle, ash-claw), stairs, ramps | modular GLB or merged primitives; one kit per dungeon, ~30 pieces | ≤ 40 k per room merged; ≤ 300 k per dungeon loaded | 2 (Grove), 3, 4 |
| Root wall segment (rising, with the seam decal) | procedural, vertex-animated rise | 600 | 2 |
| Lift bough, root ramp, root rails, the Well's boughs | GLB / procedural | 300 each | 2 |
| Glow-moss decals, sap-vein floor decals | decal shader (shared with telegraphs) | — | 2 |
| Stump plate, root-bound boulder, seed pod, resin torch | procedural | 200 / 300 / 120 / 80 | 2 |
| Sand surface (per flow room): a heightfield mesh 1 m grid with a flowing-sand shader; spouts; the grate whirl decal; the wall gauge column | shader + primitives | 2 k per room | 3 |
| Mirror pedestal (rotating disc), sun-mark decal, the beam (an additive stretched billboard with dust motes), brazier bowl, canopic jar, cedar chest, the great lever | procedural / GLB | 300 / — / — / 100 / 120 / 150 / 400 | 3 |
| Walking dune (instanced), scarab crack | procedural | 200 | 3 |
| Sconce (column and post variants), the Rusted Lantern (carried prop, ≤ 200 tris, in the carry socket), the pedestal and rail, lily pads (leaf and stone, instanced), the lantern gate with its eye glyph | GLB / procedural | 150 / 200 / 300 / 60 / 400 | 3 |
| Wisps (two pooled point systems with a steering rule) | `Points` | — | 3 |
| Ice floor material (glitter, the `uAurora` wash on upward faces), stone islands, rope line (posts instanced, the rope a ribbon), bell plate, ice cube, crystal pillar (5 tones) and teacher crystal, the frost gate (an ice sheet with a melt shader), aurora conduit strips (emissive, `uAurora`), the lift platform | shaders / procedural | 2 k per room; crystals 300 each; the gate 400 | 3 |
| The Orrery: the ice ring (16 segments, rotating), the hub, the drive gear, the dome (iris of 8 brass leaves) and its great gears | GLB preferred | 12 k | 3 |
| Ash-root reflex walls, dead sconces, dead moss decal, the Four Locks gate, the ash basin surface, cold braziers, the far-light billboard and halo | the Grove and Temple assets re-skinned via palette slots plus four new props | ≤ 6 k new | 4 |
| Home, Wrong's mirror camp | `camp.md` §2.8's C6 set with the inversions; no new props beyond that manifest | 0 new | 4 |
| Hearth (dungeon variant of `camp.md`'s ring: the Hermit's stove is the one bespoke) | `camp.md`'s fire prop | 0 new / 600 | 2 |
| Decor sets (pot, crate, bones) × 5 skins | palette slots on three meshes | 0 new | per dungeon |
| Entrance props: the arch, the apex hatch with pillars, the drowned steps and eighth post, the ice arch (with shimmer), the mirror crater | GLB / procedural | 3 k / 2.5 k / 2.5 k / 1.5 k / (story-beats' crater) | 2 / 3 / 3 / 3 / 4 |

### 4.2 Materials and lights

- One flat-shaded vertex-colour material per dungeon kit with the same four palette slots as `enemies.md` §4 (so the shard's skins are data), plus the shared emissive material on the bloom layer for sap, glyphs, crystals, conduits, wisps and flames; the water shader from Brief §4.7 for the Temple; the sand and ice shaders above. Torch flames are the world-events instanced cone pair with the per-instance phase.
- Lights per room: never more than the 8-pool. Typical: hero side 1 (pool) + Collette's orb 1 + up to 4 bolts; world 2 (the two nearest lit torches, or the carried lantern and the nearest sconce, or the hearth, or the boss). The far light is a second directional, not a point. Every other glow is emissive.
- Draw calls per room, worst case (the Drowned Nave with the tide up): merged statics 6, sconces 1 (instanced) + 2 lit, lily pads 1, water 1, wisps 2, mist volume 1, particles 2, decals ≤ 16, enemies ≤ 10 × 2, heroes 12, VFX pools 6 → about 70. The Orrery: statics 8, ring 1, dome 1, conduits 1, crystals 1, snow 1, aurora 4 (world-events' curtains, open sky), enemies, heroes → about 60. Inside the 300.

### 4.3 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| The run kernel: room graph loader, activation, streaming/visibility sets, doors and locks, keys, waves (§2.1.5), checkpoints and `dungeonRun`, the fail/retreat/victory flow, the room strip's data | `src/dungeons/core/` |
| Shared mechanics: plates, blocks (grid and sliding), levers, spikes, decor, hearths, the ability-object runtime, the telegraph/hazard hooks | `src/dungeons/core/objects/` |
| The light language (carried lantern, sconces, wisps, the mist tide, clean air) | `src/dungeons/core/light/` (used by the Temple, the caves' preview via `src/world/islands/cave/`, and the shard) |
| One folder per dungeon: `layout.ts` (the map tables as data: rooms, centres, sizes, tiers, doors, locks, depth, seeds), `mechanics.ts` (root rhythm / sand-flow / darkness / ice), `puzzles.ts`, `setpiece.ts`, `boss.ts` (the arena wiring `bosses.md` §4.3 expects) | `src/dungeons/grove/`, `src/dungeons/tomb/`, `src/dungeons/temple/`, `src/dungeons/citadel/`, `src/dungeons/homeWrong/` |
| Canon strings (names, descs, lore, ability lines, UI strings, Citadel banners) | `src/content/canon/` verbatim; the new strings (`Rusted Lantern` and its line, `Resume <name> from the hearth?`, `Try again`, `Leave`, the room name cards) in `src/content/dungeons/newText.ts`, each tagged `new` |
| Tokens: `grove.glowMoss`, `temple.wispAmber`, `temple.wispGreen`, `shadow.deadMoss`, the dungeon sconce and hearth variants of `light.lantern` / `light.campfire`, the far light | `src/style/dungeons.ts` (serialize with anything touching `src/style/`) |
| Entrances, the Rootways preview walls, the Witch's Lanterns posts, the caves' lamps, the shard's regions and the far light | `src/world/islands/<island>/` (world-builder) |
| Hearth prompt reuse | `camp.md`'s `src/world/camp/rest.ts` called from the dungeon hearth |
| Dev hooks | `src/dev/dungeons.ts` |

### 4.4 Phases (Brief §8)

- **Phase 2 (Forest slice):** the run kernel whole (rooms, doors, keys, waves, checkpoints, the fail and victory flow, the room strip, the threshold rig on the intro grammar, the dollhouse render rule, hearths with the rest prompt); plates, blocks, decor, torches; the Hollow Grove complete (root rhythm, tiers, saplings, glow moss, stumps and boulders, the Heartwood Well with its camera lift, Noah's Pod Gallery, the Seed Vault, the Treant's Hall hook to `bosses.md` §2.7); the arch and the Rootways preview walls; the `dungeon_enter` exchange.
- **Phase 3 (the world):** the light language (lantern, sconces, wisps, tide) and the Crystal Caves preview; the Sunken Temple; sand-flow, mirrors, scarabs, sandstorm rooms and the Buried Tomb; ice momentum, resonance, aurora power, rope rooms, the Orrery and the Ice Citadel; the three entrances and the eighth post; quiet re-entry for all four.
- **Phase 4 (Lights in the Dark):** Home, Wrong: the shard's regions, the ash gates and banners, the composition (reflex roots, dead moss, dead sconces, the amber-to-home wisp, ash-flow, the ice camp, the dead conduit), the Four Locks, the far light with the yawed hearth interior, the GAME OVER retry, CS-08's hand-off, the Star Chart Room's memory hook.
- **Phase 5:** every cue in §2.1.11 and the per-dungeon lists through `audio.md`; the multiplayer room-activation sync (host-authoritative rooms, v27's `roomChange` payload shape kept).

### 4.5 Test hooks

- **Dev console:** `dng enter <key> [room]`, `dng room <id>`, `dng clear`, `dng key`, `dng unlock`, `dng wave <n>`, `dng beat <phase>` (the Grove's clock), `dng sand <room> <level>`, `dng beam show`, `dng lantern give|drop`, `dng sconce all`, `dng tide up|down|off`, `dng wisps show`, `dng ice <mu>`, `dng resonance solve`, `aurora.force <0..1>` (world-events'), `dng rope fall`, `dng lock <n> solve`, `dng banner <n>`, `dng farlight <0..1>`, `dng station <dungeon> <room>` (a screenshot station per set-piece room and per rest room at the gameplay rig, for the art director; rubric stations from Phase 2 on).
- **Vitest (`tests/unit/dungeons/`):** graph tests for every dungeon: every critical-path room reachable from the entry with the doors the layout declares; exactly one key and exactly one locked boss door; no locked door before its key's room on the critical path; `depth` values monotone along the path; every optional room has a parent; the Four Locks in index order. The root rhythm: with groups A/B/C at 0/4/8 s, at no instant are all three closed, and no group is closed longer than 5.8 s. Sapling seals: 3 saplings seal at 20 s if untouched; killing one at 4 s delays the seal by the strand it would have added. Glow moss wakes within 2.5 m of an orb and fades at 8 s; a step wakes one tile for 1 s. Sand: fill 4 m in 12 s, drain in 8 s; a beam at 1.2 m is blocked at mid; a door at +4 is walkable only within 0.4 m; the Hourglass drains 4 m in 20 s. Mirrors: four orientations, right-angle reflection, latch at 1.0 s, no latch under moonlight. Scarabs never enter a beam band. Lantern: passes on swap, one exists, never guttered; sconces 40 s + 3 s; Collette 0.3 s; clean air radii; the tide's 24 s phases; the mist's 2 DPS is poison-typed and negated by `poisonImmune`; pads 0.3 / 1.2 / 3 s and 0.6 s with two heroes; wisps: amber targets the next critical sconce, green never does. Ice: a 4.5 m/s hero stops in 6.0 ± 0.5 m; dodge 3.0 m; a bell plate fires at 4 m/s and not at 3.9; a cube slides to the first obstacle. Resonance: 3/4/5-note sequences, reset on a wrong strike, a companion's hit counts. Aurora: gate and lift powered at 0.5 and not at 0.49; nothing else reads the signal. Rope: a hero > 2 m from the rope over a gap falls for 15 and returns to the last post. Checkpoints: `dungeonRun` written at rest rooms and antechambers; resume restores cleared rooms, keys, sand levels, lantern state; `Try again` keeps cleared rooms and resets the current room's wave. Re-entry: a cleared dungeon spawns no waves and no boss. Home, Wrong: reflex walls fire at 3 m and retract at 12 s; dead moss dies within 1.5 m of the orb and not of the pool; the amber wisp's heading is the far light's bearing; region banners fire once each in order; a wipe reloads the last banner gate. Waves: the count formula at depths 0–9 and waves 1–3; the Citadel scale in the shard. No soft-locks: a scripted party with each single hero downed in turn completes every dungeon (the ability object waits, the moss fallback works, the lantern is never lost). Trim the existing suites first (Working Rule 7).
- **Smoke (`tests/smoke/`):** a scripted party clears each dungeon end to end at its expected team level within its run-length band, asserting every canon string in the dungeon's tables fired exactly once and every damage event was preceded by a telegraph; a second run resumes from each checkpoint; a third re-enters cleared.

### 4.6 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| A whole dungeon loaded at entry (≤ 300 k tris) | rooms outside the visibility set are unrendered and unsimulated; statics merged per room; Low preset drops fringe density and halves decor |
| The sand heightfield deforming every frame | a 1 m grid per flow room (≤ 400 verts), CPU-updated only while flowing (≤ 20 s at a time), GPU-displaced otherwise |
| Beams as volumetrics | additive billboards with a dust `Points` inside; no light; ≤ 4 per room |
| The Temple at `dark 0.85` with many emissives | bloom threshold unchanged; wisps ≤ 40 as two `Points` systems; sconce lights pooled by distance (two live), the rest emissive with the ground decal doing the read |
| The blizzard gallery's 2,000 flakes indoors | the world-events recipe's own camera-locked box; Low ×0.35 |
| The Orrery's rotating ring with heroes on it | the ring is a kinematic platform; heroes inherit its velocity (the same path the lift and the sand ride use); one code path for moving floors |
| Home, Wrong's second directional light | the shard only; shadows off on it; verified in Phase 4's profile that two directionals stay inside the 16.6 ms budget on integrated graphics, else the fill becomes a hemisphere ground tint toward `#FF9A3C` at 4 % |
| Room stacking in the tower | visibility sets; a stacked room's floor is never drawn from the room below |
| Companion steering in tight puzzle rooms | the 4 s fade; puzzles never require a companion's position |

### 4.7 Build order

1. The run kernel with grey-box rooms (doors, keys, waves, checkpoints, the strip, the threshold rig, the dollhouse rule); Vitest green on the graph and wave tests.
2. Plates, blocks, decor, torches, hearths.
3. The Grove's four mechanics as isolated grey-box rooms, then the authored Grove, then the Well's camera lift, then Noah's room, then the Treant hook.
4. The `dng station` screenshot stations after step 3, updated every step.
5. Phase 3: the light language (it is shared by the Temple, the caves and the shard) → the Temple → sand-flow and mirrors → the Tomb → ice, resonance, aurora, rope → the Citadel; quiet re-entry.
6. Phase 4: the shard's regions on the Grove and Temple assets re-skinned → the Four Locks → the far light and the yawed hearth → the wipe flow → CS-08's hand-off.

### 4.8 Rule 2 gates before code

A kinematic moving-floor carry in the chosen physics (Rapier or the custom controller) with a real test scene; a heightfield collider that updates at runtime (the sand); decal projection onto non-flat floors with the wall-fade dither in three 0.185.1; a second `DirectionalLight` without shadows in the shared material chunk; `postprocessing` selective bloom on the emissive layer with fog excluded (the atmosphere-on-top rule); per-room visibility sets with `Object3D.visible` toggles and no per-frame allocation. Record every verified shape in the task notes.

---

## 5. Cross-references and conflicts

### 5.1 Earlier design files: what this file took

| File | Taken |
|---|---|
| `heroes.md` | 40 px = 1 m (§2.5.1) for every number; the four ability verbs (Shield Bash contact, any arrow with the `snapShot` reward, the 1.5 s channel clip, a whirl hit) and Arcane Blink's partial-blink-against-walls rule (§2.5.5, §5); companion steering, the 4 s stuck timer, telegraph avoidance with the 0.4 s exit path (§2.5.11); the hero pool as the indoor light (§4.2 via world-events); the glow tokens for the ability announces; the downed and revive rules that make a waiting ability object safe |
| `enemies.md` | the dungeon pools and the wave formula verbatim (§2.5); the Wraith and Sneaky Shroom as darkness natives and the Obsidian Guard as a statue (§2.4); nests overworld-only, except the shard's ember zones by the orchestrator's decision (§2.8); the shadow tint (§2.9); the telegraph language and the 16-decal registry (§2.2, §4); the wisp-hollow rule (§2.8) |
| `story-beats.md` | canon names as the dungeons, Brief names as the districts (§2.2); every entrance position and landmark (§2.2); the caves' lighting rule and the lantern path (§2.2); the shard's regions, the one far light, the corrupted hearth (§2.2); the `dungeon_enter` exchange at the arch, the `boss_appear` placements (§2.5); the quests that gate and reward each dungeon (§2.4); the flags `world.dungeonCleared.*` and the save rule for Home, Wrong (§2.6, §4); CS-08 (§2.10) |
| `world-events-weather.md` | the clock running in dungeons and the campfire rest (§2.1.1); `visOverride` for sandstorm and blizzard rooms (§2.2.5, §2.8.5); the aurora signal, threshold and conduit colours (§2.3.4); the `dng.*` tokens, `dark`, near/far, the 8-light pool and priorities, `light.heroPool` 4 / 6 m and 1.5 m at 0.85, the torch recipe, `DNG_ATMO` translated, open-sky blending (§2.8); `shadow.wrongDusk` (§2.1.4); `pt.*` tokens (§2.4.2) |
| `bosses.md` | boss halls 20 × 16 m and every arena's contents (§2.7–2.16); the intro grammar for the entry card (§2.3); the death beat and the victory flow (§2.5); the hazard kinds `spike`, `poison`, `wall`, the DoT accumulator (§2.1.4, §2.2); the Depths' lighting rule and re-entry (§2.11); the Rift as a lair (§2.12); the shadow squad and the mini-bosses' spaces (§2.13–2.15); the Queen's hearth and its window (§2.16); the Warden's card composed from the canon `citadel` name (§2.15) |
| `camp.md` | the rest prompt and its rules (§2.7.3) reused on dungeon hearths; the cold mirror fire (§2.7.6); the C6 mirror manifest (§2.8) built as written; the station pitches that prove the horizon is never in frame (§2.11.5) |
| `npcs.md` | the lantern-post numbers verbatim (§2.9.2); Quartz's 30 s idle lighting the caves' lamps (§2.6.3); the Bog Witch's line 2 as the Temple's rule heard first (§2.8.1); the escort as the Temple's tutorial (§2.9.3); the carry-socket request (§5.2) |
| `docs/DECISIONS.md` | the orchestrator's lines: lairs owned by `bosses.md` and the caves' rule specified here as a Bog preview; the fire family's secondary home in the shard's ember zones; island footprints; endless cut |

### 5.2 What later files must pick up from this file

| File | Must pick up |
|---|---|
| **`ui-ux.md`** | the DOM entry card (name in the dungeon colour, `<BIOME> DUNGEON`, desc, `⚔️ ENTER` / `CANCEL`) and the `Entering <dungeon name>...` guest line; the threshold card on the intro grammar; the **room strip** on the compass with `Room N/M`, `🔑 N`, `🔒`, `🔒 LOCKED`, `Wave N/M` (§2.1.10); the persistent `SHADOW CITADEL — Floor N: <floor name>` banner in the shard; the quiet name cards (§2.1.10, listed per dungeon); the interaction prompts `[SPACE] Open` / `[SPACE] Pull` / `[SPACE] Interact` from the live binding; every announce in §2.1.4, §2.1.9 and the ability hints in the hero's glow; `Channeling... (N more)`; the `DUNGEON FAILED` / `DUNGEON RETREAT` cards with `The Stewart Squad couldn't clear <name>...` and the two actions `Try again` / `Leave`; `Resume <name> from the hearth?`; the `<name> CLEARED!` card with `Per-hero combat breakdown` and the `DUNGEON_EQUIPS` item; the `Rusted Lantern` item card; the `GAME OVER` / `The Stewart Squad has fallen...` variant with the retry in Home, Wrong; the entrance pill `Press to Enter` / `✓ CLEARED`; the location title card on entry (name plus the canon desc); no lantern, sand, rope or aurora meters (the world shows them) |
| **`audio.md`** | §2.1.11's kept and new shared cues; per dungeon: `grove.heartbeat`, `grove.rootRise`, `grove.rootFall`, `grove.mossWake`, `grove.saplingSprout`, `grove.boughLift`, `grove.canopyOpen`; `tomb.sandFlow`, `tomb.sandDrain`, `tomb.leverGreat`, `tomb.drainRumble`, `tomb.mirrorTurn`, `tomb.sunmarkLit`, `tomb.scarabSwarm`, `tomb.sandWind`, `tomb.slide`; `temple.sconceLight`, `lantern.gutter` (npcs.md's), `temple.lanternSet`, `temple.padSink`, `temple.mistRise`, `temple.mistFall`, `temple.wispHum`, `temple.wraithCondense`, `temple.naveLit`; `ice.slide` (a skid loop), `ice.bellPlate`, `ice.crystal.<C4|E4|G4|A4|C5>`, `ice.crystalWrong`, `ice.frostGate`, `ice.lift`, `ice.rope`, `ice.orreryStart`, `ice.orrery` (loop), `ice.domeOpen`; `shard.banner`, `shard.lockSeal`, `shard.deadSconce`, `shard.ashRise`; beds `amb.dng.grove`, `amb.dng.tomb`, `amb.dng.temple`, `amb.dng.citadel`, `amb.dng.shard.f1|f2|f3`, `amb.dng.hearth`; the far light has no sound of its own (it is too far); the v27 BGM biome tables are `audio.md`'s and the dungeon key should select the island's table |
| **`cutscenes.md`** | CS-08 (8 s) ends at the mirror crater's south lip with the far light in frame below the rim, before the Outer Ward gate's card and before the Sentinel wakes; the Hollow Grove arch exchange is an in-world dialogue, not a cutscene; the threshold rig on the intro grammar is the cinematic system's `dungeonEntry` mode (the same code path as `bossIntro`); the five set-piece camera lifts (Well, Hourglass, Nave, Orrery, and none in the shard) are in-engine 3 s eases, not cutscenes; the dome opening and the Hourglass drain run under gameplay; the hearth's threshold fade with the 180° dome yaw is a 0.3 s in-engine beat; the back-door rides are skippable in-engine rides |
| **`world-builder`** | the five entrance props with their pills, motes and rings; the Rootways' three preview walls on the Grove's beat; the eighth lantern post at the drowned steps; the ice arch's permanent shimmer; the Crystal Caves' lamp hooks, cave-wide proximity crystals and `dark 0.72` with no torches; the shard's four regions as streamed sub-scenes with the ash gates, the terraces (+6 / +3 / 0), the south rim as the shard's edge, and the far-light billboard 400 m south and 300 m down; the `camp.md` §2.8 mirror set placed in the Throne region |
| **`dungeon-designer`** (Phase 2+) | one dungeon at a time from its section's map table, in the §4.7 order; the kernel first |
| **`heroes.md` (addendum requests, collected by the orchestrator)** | a `ride` pose (moving floors, the lift, the sand ride), a `slide` skid pose on ice, a `ropeHold` pose, the reach-up clip (npcs.md already asked), the 1.5 s channel loop (heroes.md §5 already lists it), the free-hand carry socket (world-events already asked) |
| **`camp.md` (addendum)** | the rest prompt is also offered at dungeon hearths with the same three options and the 20 m enemy gate; the Hermit's stove is a variant prop |
| **`enemies.md` (note)** | Scarabs, Saplings and shadow-tinted waves inside dungeons count as kills for `Monster Slayer` and the `kills` bounty as any enemy does; no new type is needed |
| **`systems-engineer`** | the `dungeonRun` save block and its migration; `poisonImmune` typed against the mist sting; the moving-floor carry; the `depth` field on rooms for the wave formula |

### 5.3 Conflicts found, and how this file designs around them

1. **`bosses.md` §2.15 and §2.16 place the far light in two directions**: behind the party in the Dooryard (over the fence, on the fire's side) and through the window *behind the throne* in the hearth. With one geography both cannot hold. Resolved without changing either sentence's spatial relationship: the far light is south and below (§2.6.6); the Dooryard has it behind the party; the hearth is a separate interior entered under a 0.3 s fade during which the sky dome and the void billboard yaw 180°, so the window behind the throne looks at it. `bosses.md`'s word "north" for that window is a compass label the builder should read as "behind the throne"; a one-word edit in the consistency pass, not a design change.
2. **The task prompt's room size** ("16 × 12 tiles of 60 px, 24 × 18 m") does not match the teardown: SI §11.1 records `DNG_TW=40`, so a v27 room is 16 × 12 m at 40 px = 1 m. This file follows the teardown and keeps 16 × 12 m as the standard room (§2.1.1), which also fits the gameplay frame.
3. **`world-events-weather.md` §2.8.1** allows `dng.bog` at `dark 0.85` "in the lantern rooms"; this file applies 0.85 to the whole Temple and the hero pool's 1.5 m with it (§2.4.1), which that file's own note permits.
4. **`story-beats.md` §2.4's `Poison immunity`** (the `swamp_2` reward) would have made a poison mist toothless. Designed around: the mist's sting is poison-typed and negated; its smothering, its vision cut and its faster Wraiths are not (§2.4.2). No file changes.
5. **`enemies.md` §2.5 names the dungeon pools by the Brief's district names** (Rootways, Sunken Pyramid, Witch's Lanterns, Hermit's Observatory); the dungeons are the canon names (story-beats). The mapping is one-to-one (§2.0); no conflict, a note for the pool keys.
6. **`bosses.md` §2.8 asked whether the Pharaoh's sunbeams are player-routable before the fight.** Answered: yes, the centre mark gates the door, the other four are optional and cosmetic in the fight (§2.3.7). The fight is unchanged.
7. **`camp.md` §2.7.3 owns the rest prompt "and the campfire"**; this file reuses the prompt on dungeon hearths (§2.1.6). An addendum, not a contradiction.
8. **`story-beats.md` §2.2 calls the far light "a far warm glow on the horizon"**; at the gameplay pitch the horizon is never in frame (`camp.md` §2.11.5), so this file puts the glow below the rim at −37° where it is (§2.6.6). Same light, same words, a lower place.
9. **`enemies.md` §2.8: nests are overworld only.** The orchestrator's `DECISIONS.md` line gives the fire family a secondary home in the shard's ember zones; this file places `enemies.md`'s Shadow Realm nests there (§2.6.5). Consistent with the decision; the "overworld only" sentence gets the shard as its one exception in the consistency pass.
10. **v27's `Combat cleared! Check for bonus...`** printed after every combat room whether or not a chest dropped; here it prints only where a bonus can exist (§2.8). A trigger change on a verbatim string, logged.
11. **`ui-ux.md` is in flight at the time of writing**; its scratch draft (seen only because the design agents share one scratchpad) sketches a "dungeon paper minimap" in the bottom-right anchor and keeps the v27 `Minimap` setting as its toggle. This file offers the compass **room strip** (§2.1.10) as the dungeon map and keeps every canon string it needs. Both cannot ship. Recommendation for the orchestrator's consistency pass: the room strip is the Brief §6 reading ("a small compass strip instead of a big minimap"); if `ui-ux.md` keeps a paper minimap, it should be the *map page's* dungeon view (rooms as paper cells inked when visited), with the strip as the HUD element and the canon `Minimap` setting toggling the page's dungeon overlay. Nothing in this file depends on which wins.

---

## 6. Decisions logged

Merged into `docs/DECISIONS.md` by the orchestrator after review.

- 2026-09-06 · phase-0.5/dungeons · Dungeons are hand-authored room graphs and layouts per dungeon, with seeded micro (decor, torch placement, wave composition and spawn points, one of two variants per optional room, bonus-chest and plaque spots) · Brief §5.3 wants five dungeons recognizable from their rules; a random graph cannot place a set piece, an ability room or a key a kid remembers; Brief §5.1's macro/micro rule applied indoors · rejected: v27's procedural graph, a hybrid with authored anchors in a random graph.
- 2026-09-06 · phase-0.5/dungeons · Room sizes: standard 16 × 12 m (v27's 16 × 12 tiles at `DNG_TW=40`, strict), boss halls 20 × 16 m (`bosses.md`), set pieces to 24 × 20 m, corridors 4 m, walls 5 m; a room is one frame at the gameplay rig · the v27 read was one room per screen and the camp stations show 22 × 16 m of floor at pitch 45–55° · rejected: the prompt's 60 px tiles (not what the teardown records), larger rooms (two frames, the read is lost).
- 2026-09-06 · phase-0.5/dungeons · Contiguous rooms with real doorways and no transition fade; a room activates when the active hero crosses its threshold; the v27 0.6 s slide and the opposite-wall teleport are cut; the only fades are entry, exit, the shard's banner gates and the hearth's threshold · a paused slide is a 2D grid device; the diorama is a continuous place · rejected: a 0.3 s fade at every door.
- 2026-09-06 · phase-0.5/dungeons · The dollhouse rule: rooms have no rendered ceiling, a hung fringe 1–2 m in from the wall tops stands in for one, camera-side walls fade to 25 %, and rooms may stack because only the visibility set renders · at pitch 45–55° the camera is above any ceiling; a lid is the anti-diorama · rejected: cut-away ceilings by yaw, a fixed camera-side wall.
- 2026-09-06 · phase-0.5/dungeons · With the curved-world shader off indoors (Brief §5.1), depth is carried by `dng.*` height fog, terraces, fringe silhouettes, unrendered rooms beyond closed doors and the vignette; open-sky rooms blend the island keyframe · the recipe already had every piece · rejected: a reduced curve indoors (the brief says disabled).
- 2026-09-06 · phase-0.5/dungeons · Cleared dungeons stay open as quiet places (doors open, no waves, no boss, remains in place, secrets collectible, the back door open); no re-runs for loot; NG+ resets · a place you can walk back through is the time capsule; v27's lock-out created the `ground_ed_3` dead end · rejected: v27's no re-entry, re-runs that respawn the boss.
- 2026-09-06 · phase-0.5/dungeons · Hearth checkpoints: entering a rest room or a boss antechamber writes a `dungeonRun` block into the save beside P1 §28.3's overworld snapshot; a load offers `Resume <name> from the hearth?`; a wipe shows the canon fail card with `Try again` (from the checkpoint, cleared rooms kept) and `Leave` (30 % XP) · twenty-minute dungeons and kids who have to stop; v27 threw the run away · rejected: v27's one-sitting rule, autosave every room.
- 2026-09-06 · phase-0.5/dungeons · Every mid-dungeon rest room has a hearth the family lights, with `camp.md`'s rest prompt (`Until dawn` / `Until dusk` / `Sit`) gated on no enemy within 20 m; the Tomb's mirrors need day and the Ice Citadel's lift needs night, so the hearth is the guaranteed answer to both · the clock runs indoors (`world-events-weather.md`) and a kid must never wait six minutes for a door · rejected: a fake per-dungeon clock, moonbeams that work at night (the sun puzzle would not be about the sun).
- 2026-09-06 · phase-0.5/dungeons · One ability room per dungeon on the critical path, assigned Noah / the Grove, Liam / the Tomb, Collette / the Temple, Isabella / the Ice Citadel; Home, Wrong composes all four as the Four Locks in canon index order; a downed hero's object waits and nothing else opens it · every kid gets a room that is theirs, and Ed's `gears turning inside` line makes the Orrery Isabella's; the Tomb's key room behind Liam's wall makes tip 7 literal · rejected: v27's random hero, optional ability rooms, a fifth hero-agnostic object.
- 2026-09-06 · phase-0.5/dungeons · The v27 vocabulary kept with jobs: one key per dungeon in a treasure side room and a locked boss door; barred doors and levers only where a mechanism needs them (the Tomb's sand, the Citadel's gates, the Temple's lantern gates, the shard's ash); plates and blocks in the Grove, Tomb and Citadel (sliding on ice); spikes in the Tomb's corridor and the Outer Ward; the three decor props skinned per dungeon; `DOOR_CLOSED` and the unreferenced templates cut · the strings and sounds are canon; the objects needed reasons · rejected: cutting keys (the `🔑` and `Door unlocked!` are canon), levers everywhere.
- 2026-09-06 · phase-0.5/dungeons · The wave formula ports verbatim with `room` read as the room's critical-path depth (entry 0) and optional rooms inheriting their parent's depth; the Citadel scale and +1 cap 10 apply in the shard's regions · authored graphs have no v27 index; depth is the same number by another name · rejected: a per-room hand-tuned count.
- 2026-09-06 · phase-0.5/dungeons · Root rhythm: one 12 s beat, three phase groups at 0 / 4 / 8 s, cycles of 5.0 s open / 1.2 s rise / 5.0 s closed / 0.8 s retract, a 1.2 s seam telegraph, walls that push 1.0 m and never trap or damage, stumps that pin walls open, walls still during the boss · at least one route open at every instant; a wall that traps is a wall that hurts a companion · rejected: random per-wall timers (unreadable), damaging walls.
- 2026-09-06 · phase-0.5/dungeons · Sapling seals: three Saplings at the exit, one strand per living sapling per 5 s, sealed at four strands into a combat room with one extra wave, never a dead end · the Brief's "cleared before roots seal a room" as a soft failure a kid can see coming · rejected: a hard seal with a reset.
- 2026-09-06 · phase-0.5/dungeons · Glow moss wakes within 2.5 m of any Collette light for 8 s and stays lit under a hero's feet; any hero's step wakes one tile for 1 s as the fallback · the Brief's "only visible when Collette's magic lights them" with no soft-lock when she is down · rejected: moss visible to all at low alpha, no fallback.
- 2026-09-06 · phase-0.5/dungeons · Canopy tiers as three terraces (0 / +4 / +8 m) with root ramps, 2 s lift boughs and 0.6 m root rails so height is never a fall; the Heartwood Well is the one vertical shaft · the view is the point; a fall hazard would make companions a liability · rejected: falling damage, a free climb.
- 2026-09-06 · phase-0.5/dungeons · Sand-flow: three levels 0 / +2 / +4 m, fill 1 m per 3 s, drain 1 m per 2 s, `sand_slow` ×0.6 while flowing, doors walkable within 0.4 m of the surface, beams at 1.2 m blocked by sand, the Hourglass draining 4 m in 20 s as a design rate · slow enough to read as a floor changing height, fast enough to be a decision; the Hourglass is a ride · rejected: two levels (no mid door), instant levels.
- 2026-09-06 · phase-0.5/dungeons · Sunbeam mirrors: bronze discs with four orientations, right-angle reflection, a 1.0 s latch on sun-marks, blinking marks that hold only while lit; moonbeams show the path and repel scarabs but power nothing · a mirror puzzle a kid can turn with one button; the sun matters or the day/night rule is decoration · rejected: eight orientations, night-blind beams that do nothing at all.
- 2026-09-06 · phase-0.5/dungeons · The five sun-marks of the Pharaoh's hall are player-routable before the fight: the centre mark gates the boss door with the key, the other four are optional (a shadow under a lit mark, a bonus chest for all five); the fight is `bosses.md`'s unchanged · answers `bosses.md` §5.2 without touching the boss · rejected: lit marks removing blink anchors (changes the fight), no routing.
- 2026-09-06 · phase-0.5/dungeons · Scarabs flee sunbeams (never enter the 1 m band, 5 DPS inside it); 30 % of the Tomb's jars are seeded scarab jars of six; trap plates pour twelve · the Brief's swarms as a light-and-lane hazard, and Noah's `cool bugs` line gets its bugs · rejected: scarabs as a wave type only.
- 2026-09-06 · phase-0.5/dungeons · Sandstorm chambers: `visOverride 6`, `pt.sand` ×600, a 0.6 m/s crosswind drift, walking dunes at 0.4 m/s as cover · world-events' visibility term reused; "shifting cover" made literal; weather never slows heroes · rejected: a slow, static cover.
- 2026-09-06 · phase-0.5/dungeons · The Temple's light language is `npcs.md` §2.9.2's post rule verbatim (1.5 m / 1.5 s, Collette 0.3 s, 40 s, 3 s gutter, the ground decal, wisp hollows) plus the carried `Rusted Lantern` (a new item kept as a memory and carried again in the shard), at `dng.bog` 0.85 with the 1.5 m hero pool · the escort taught it in daylight; the dungeon composes it · rejected: a fuelled lantern with a meter, several carried lanterns.
- 2026-09-06 · phase-0.5/dungeons · Wisps are two harmless pooled swarms: amber guides (straight, patient, `#FFB347`) and green misleads (darting, `#6CE87A`), told apart by colour and motion, ≤ 40 alive · the Brief's guide-or-mislead with a colourblind-safe channel; the swamp's own colour is the one not to trust · rejected: wisps that hurt, one colour with a hidden tell.
- 2026-09-06 · phase-0.5/dungeons · Lily pads: leaf pads sink 0.3 s after weight over 1.2 s and resurface 3 s later (0.6 s with two heroes); stone pads never sink; the water is poison-typed 4 DPS with a 40 % swim to the nearest edge; companions follow the leader · sinking must be a timer a kid can feel, and going under must not be death · rejected: per-kid weights (a claim about real children), instant sinks.
- 2026-09-06 · phase-0.5/dungeons · The mist tide runs a 24 s cycle (2 exhale / 8 up / 2 fall / 12 clear), smothers flames (sconces ×0.4, the lantern ×0.6), sets `visOverride 4` inside, arms Wraiths in 1 s, and stings 2 DPS poison-typed outside clean air (2 m sconce, 1.5 m lantern, 1.5 m orb) · the `Poison immunity` reward stays meaningful and the mechanic stays alive without it · rejected: a plain DoT (immunity would erase it), a mist with no sting.
- 2026-09-06 · phase-0.5/dungeons · The lantern relay: the Lantern Gate keeps the carried lantern on a pedestal and the party crosses a dark hall on Collette's orb until her seal returns it on a rail · Isabella's `...Collette, hold my hand though.` as a mechanic · rejected: a second lantern found in the hall.
- 2026-09-06 · phase-0.5/dungeons · Ice momentum: acceleration ×0.25 and damping 0.988 per 60 Hz tick (about 6 m from a run), dodge ×1.5, enemies slide, stone islands and rope holds restore friction, bell plates fire at ≥ 4 m/s, blocks slide until stopped · v27's `ice_tile` slide made the whole floor; six metres is one room width of consequence · rejected: strict `ice_tile` patches, a speed cut on ice.
- 2026-09-06 · phase-0.5/dungeons · Crystal resonance is a strike-in-order memory puzzle of 3 / 4 / 5 pentatonic notes with a teacher crystal that replays, reset on a wrong strike, any hit counting, brightness on `world.aurora.intensity` · a toy every kid knows; the sky breathes through it · rejected: rhythm-timed strikes (hard on touch), unlimited length.
- 2026-09-06 · phase-0.5/dungeons · Exactly two aurora-powered mechanisms (the Orrery's frost gate and the lift), threshold 0.5, so the Ice Citadel requires one night, made a choice by the Hermit's stove · the Brief's "day/night cycle as a puzzle tool" needs a real gate; more than two would be waiting · rejected: aurora-powered doors everywhere, a night-free route.
- 2026-09-06 · phase-0.5/dungeons · Rope rooms: `visOverride 4` with the blizzard recipe indoors in an open-sky gallery, posts every 4 m, a 1 m hold band, hidden gaps beyond 2 m, a fall of 15 damage with a 1.5 s return to the last post · "follow rope lines" as a hold you can feel; never a death · rejected: fatal falls, a rope that slows.
- 2026-09-06 · phase-0.5/dungeons · The Orrery set piece is Isabella's ability room: her whirl frees the jammed drive, the ring turns, the dome irises open; the dome's great gears turn before she arrives so Ed's `gears turning inside, no one at the controls` stays true · a kid at 25 remembers who started the tower · rejected: a separate gear room, a set piece with no kid at its centre.
- 2026-09-06 · phase-0.5/dungeons · Home, Wrong composes by region: the Outer Ward reuses the Grove (reflex roots with no beat; moss that dies in carried light), the Inner Sanctum the Temple and the Tomb (dead sconces, all-green wisps and one amber wisp that points home, the tide, 0.8 s pads, ash rising on backwards levers), the Throne the Ice Citadel (ice on the frozen stream and pond; a dead aurora conduit on the citadel door); the canon Citadel floor cards, announce, banners and the `citadel` description placed as §2.6.1 · the Brief's "composes mechanics learned in the other four" as inversions a kid can name · rejected: new mechanics in the finale, a region with no reused rule.
- 2026-09-06 · phase-0.5/dungeons · The far warm light: home is south and 37° below the shard's ground plane, so the glow is a void-plane billboard 400 m south and 300 m down on the campfire oscillator plus a second directional at `#FF9A3C` intensity 0.03 from that bearing with no shadows; the hearth interior yaws the dome 180° under its 0.3 s fade so the window behind the throne shows it · story-beats' light must be visible at the gameplay pitch, where the horizon never is; `bosses.md`'s two placements both hold · rejected: a horizon billboard (never in frame), a point light (a pool slot, and it would light the ground).
- 2026-09-06 · phase-0.5/dungeons · A wipe in Home, Wrong shows the canon `GAME OVER` card with `Try again` from the last banner gate and `Leave` to the portal; saves inside write the Forest snapshot plus `dungeonRun`; the shard is never re-entered in a cycle · story-beats' save rule kept; the finale must not end on a hard reset · rejected: v27's game over, mid-region checkpoints.
- 2026-09-06 · phase-0.5/dungeons · The Crystal Caves preview: `dng.cave` at 0.72, the normal 4 m pool, no torches, Quartz's emissive wall-lamps lit by his idle, cave-wide proximity crystals, Collette's orb the only carried light; no wisps, no sconces, no tide · the Bog's language at its gentlest, as the orchestrator asked; the Depths keeps `bosses.md`'s strict rule · rejected: sconces in the caves (the mechanic would be spent before the Temple).
- 2026-09-06 · phase-0.5/dungeons · The minimap panel becomes a room strip on the compass with the canon `Room N/M`, `🔑 N`, `🔒` and `🔒 LOCKED`; no lantern, sand, rope or aurora meters · Brief §6's compass strip; every state is read in the world · rejected: a paper minimap page for dungeons, HUD meters.
- 2026-09-06 · phase-0.5/dungeons · Entry keeps v27's DOM card then the letterbox card on the intro grammar's threshold rig; the `dungeon_enter` exchange plays on the walk up to the Grove's arch only; every boss hall opens a diegetic back door after the clear alongside the victory button's direct exit · one intro grammar (`bosses.md`); the exchange is story-beats' trigger; a place needs a way out you can walk · rejected: a fade-only entry, an exit cutscene.
- 2026-09-06 · phase-0.5/dungeons · Torches skinned per dungeon (resin, brazier, iron, cold), 4–6 per room; none in the Temple; 0–2 cold braziers in the shard · the Temple's absence of torches is how it says what it is · rejected: warm torches in the Temple.
- 2026-09-06 · phase-0.5/dungeons · The Rootways district shows three walls breathing on the Grove's beat near the arch, and the Temple's entrance carries an eighth lantern that gutters in 5 s · each rule is seen outside before it is a problem inside · rejected: no previews.
- 2026-09-06 · phase-0.5/dungeons · `Combat cleared! Check for bonus...` prints only where a bonus can drop (ability rooms, the Sun Court); `Isabella breaks the gears!` prints in one colour (`#FFD966`) · v27 printed the first whether or not a chest existed and the second in two colours · rejected: v27's triggers.
- 2026-09-06 · phase-0.5/dungeons · New text limited to the `Rusted Lantern` item and its line, three prompt strings (`Resume <name> from the hearth?`, `Try again`, `Leave`), and the room and mechanism names as build ids and quiet name cards; no kid says anything new · the canon carries the dungeons; names are labels · rejected: room plaques with new lore, spoken lines in set pieces.

---

## 7. Reconcile when the brainstorm doc lands

- Its dungeon designs, if any are resolved: if it fixes a different core mechanic, boss-room language or ability-room assignment for any of the five, the doc wins with a new §6 line naming what this file's version loses; the run kernel, the light language and the room sizes stay.
- Whether it intended the Citadel as a separate post-game tower after all (story-beats folded it; this file builds the fold).
- Whether it names the carried lantern, the Hermit, or the Observatory's mechanism; this file's `Rusted Lantern` and unnamed Hermit are placeholders that yield to a resolved name.
- Any resolved decision on dungeon saves or re-entry; this file's checkpoints and quiet re-entry yield to it with a line.
- Any intended meaning for the Star Chart Room's constellations beyond `world-events-weather.md` §2.6.

## 8. Open questions for the orchestrator

None. No Rule 1 input blocks this file (the brainstorm doc is §7's). No §2(b) portrayal question arises: every kid's room uses only their canon ability line and prop; the Four Locks' order is the canon index order; the Lantern Gate is Isabella's own canon line made mechanical; no weight, fear, skill or preference is asserted about any real child; the Hermit is never described and Quartz's lamps are `npcs.md`'s; the two new prompt strings and the item line speak in the game's voice, not a family member's.
