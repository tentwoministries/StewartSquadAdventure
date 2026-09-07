# Story beats — Design Bible

**Status:** reviewed by orchestrator 2026-09-06; consistency pass applied 2026-09-07 · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** `docs/BRIEF.md` in full (§1, §4, §5, §6, §8, §11 closely) · `ATMOSPHERE_RECIPES.md` §2, §3, §11, §13, §15.3–15.5, §19 · `FAMILY_CANON.md` §1–§13 in full (L1–1466) · `SYSTEMS_INVENTORY.md` Part 1 §14, §15, §17.8, §18, §19.5–19.8, §20, §21, §26.2, §27, §28, §29; Part 2 §2, §3, §6, §7, §8, §9, §10, §11.1, §11.4–11.5, §12, §13, §21 · `CONTROL_MODEL.md` §7 · `docs/DECISIONS.md` · legacy HTML L699, L749, L782–802, L819, L4314, L5714–5720, L5934, L8351–8354, L8406 (grep-verified).
**Depends on:** no earlier design file exists at time of writing. Hero colors and roles are referenced only by name; `heroes.md` owns them.
**Feeds:** `npcs.md`, `camp.md`, `bosses.md`, `dungeons.md`, `cutscenes.md`, `ui-ux.md`, `audio.md`, `world-events-weather.md`, `enemies.md`.
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

The family arrives by biplane and crashes; the goblins take three of the kids that night; the story is the four of them getting the plane, the sky, and finally their own home back from the dark. Four islands and a shard, one spine in three acts, every canon line given a real trigger, nothing orphaned.

---

## 1. What v27 does

v27's story is a set of systems that fire whenever their conditions happen to be met, on one 3200 × 3200 px map with five noise-blended biomes (SYSTEMS_INVENTORY Part 2 §2.3). There is no act structure. What exists:

- **Opening.** Liam spawns at world centre; three siblings are in cages at fixed fractions of the map (Part 1 §14.2); `Find and rescue your siblings!` is announced (FAMILY_CANON §8); the HUD counts `👥 Siblings: 0/3`. Seven tutorial lines advance on checks (Part 2 §12). Nothing explains why the kids are caged.
- **Grandpa Ed.** A biplane flies over on a timer (Part 2 §8.4, first at 20 s). Between 90 and 120 s a crash is armed; when the next flyover fires and nothing else is happening, the plane spirals into `ED_LANDING` and Ed appears as an NPC (`Grandpa Ed has crash-landed!`). His four `crash_landing` lines and all four hero `crash_landing` reactions are authored but never opened (FAMILY_CANON §13.1). Talking to him offers the three-part Ground-Ed chain immediately: propeller in the Frozen Peaks, rudder in the Murky Swamp (four-goblin ambush), spark plug awarded on clearing the cave dungeon (Part 2 §6.3). On the third turn-in: `The Green Meanie lives again!`, the `space_hint` reactions, the `Well-Ed-ucated` achievement, and scheduled supply runs begin (Part 2 §8.4 Phase B). Greetings play all six lines in order every time (Part 2 §7.4).
- **Biome NPC chains.** Five guides, three quests each, 15 quests in `QUEST_DEFS` (Part 2 §6.1), capped at three active. The swamp escort quest cannot spawn its frog because `spawnEscortNPC` looks for an NPC named `Bog Witch` that does not exist (Part 2 §21 #1). `spawnQuestWaypoints` looks for a `Sand Nomad` that does not exist and falls back to coordinates (#2). `forest_2` says `Talk to the Crystal Sage` but targets `Lamplighter Quartz` (FAMILY_CANON §13.2).
- **Dungeons and bosses.** Six biome dungeons of identical structure (Part 2 §11), each with a boss; a Volcanic Rift appears after all five originals are cleared and the Goblin King is dead; a three-floor Shadow Citadel appears after the Shadow Queen is dead and all five originals are cleared (Part 2 §3.9). Its two floor mini-bosses never spawn (#12).
- **The Goblin King** spawns only after all five biome dungeons are cleared (Part 1 §18), performs the Kid Snatch, and on death spawns the Shadow Realm portal five seconds later (Part 1 §18.6). The Shadow Queen fight begins the instant the portal is entered (Part 2 §3.8). Her death shows `VICTORY!` and unlocks NG+.
- **The meteor.** On the first dungeon clear a 24.2 s seven-shot cutscene plays (Part 2 §13.3); the crater at `(2844,305)` then glows; walking to it fires one of four hero lines and, once the Ground-Ed chain is complete, Ed's `crater_awareness` dialogue with Gran's line (FAMILY_CANON §3.5). `crater_hint` is called but was never written (§13.2). `storyFlags` are partly not reset on restart (#7).
- **Orphaned canon:** nine `HERO_REACTIONS` contexts never fire (Part 2 §7.3); the caged-hero line at index 4 is unreachable (FAMILY_CANON §2.3).
- **Endless mode** (Part 2 §10): wave survival from the victory screen, Goblin King and Shadow Queen alternating as wave bosses.
- **Feel that must survive:** the crater's slow wrong rhythm (ATMOSPHERE §15.4), the biplane as a character (§11, §19.3), the letterboxed name card with the shaking camera (§13.1), Ed's greeting voice, the kids' cage lines, the `Tip:` in-jokes, the Citadel's palette descent (§15.5).

---
## 2. What it becomes

Three acts on four islands and a shard. **Act 1 — Crash site** is the Forest island alone: the wreck, the rescue, the Hollow Grove, the Goblin King. **Act 2 — Ground-Ed** opens the sky: the plane hops, each recovered part reaches one more island, the meteor falls, the crater wakes. **Act 3 — Lights in the dark** is the crater portal, the Shadow shard, Home, Wrong, the shadow squad, the Shadow Queen, and coming home. NG+ replays the spine with the full squad from the first minute.

Beat ids are stable (`B1.1` …); flags in backticks are defined in §2.5. "Canon delivered" cites FAMILY_CANON sections. "CS" = cutscene (the shot list is `cutscenes.md`'s job); "in-world" = no camera takeover.

### 2.1 The beat list

| Act · beat | Name | Location | Trigger | Form | Present | Canon delivered (FAMILY_CANON) |
|---|---|---|---|---|---|---|
| 0 · B0.1 | Title | Stewart Camp at stage C6, golden hour, the plane crossing the ridge | boot | title screen (`ui-ux.md`) | — | `⚔️ The Stewart Squad Adventure`, `The world has stories to tell.`, one random `TIPS` line (§12.1, §10.1) |
| 1 · B1.1 | Third time this week | the sky over the Forest island, then Crash Meadow | `START ADVENTURE` on a new game | **CS-01** (skippable, `Press SPACE to skip`) | Ed, all four kids | Ed `crash_landing` 1–4 (§3.3); hero `crash_landing` ×4 (§2.1); `Grandpa Ed has crash-landed!` and `✈️ A biplane sputters overhead!` (§3.6) |
| 1 · B1.2 | Dawn at the wreck | the wreck, Stewart Camp stage C1 | CS-01 ends | in-world | Liam, Ed | `Find and rescue your siblings!` (§8); tutorial steps 1–2 (§8); Ed greeting 6 on first talk (§3.1) |
| 1 · B1.3 | The Carved Oak | goblin camp A, north meadow | Liam reaches camp A | in-world | Liam, then Noah | tutorial steps 3–4; `RESCUE!`, `NOAH rescued!` (§2.5); `FLAVOR_MARKERS[0]` at the oak (§10.2); `💡 Press I to open Inventory and equip your gear!` on first gear (§8) |
| 1 · B1.4 | The Secret Hideout | goblin camp B, the stream bend | reach camp B | in-world | + Collette | `COLLETTE rescued!`; Liam `sibling` when Collette is freed with Liam active (§2.1); `FLAVOR_MARKERS[1]` at the hollow log; tutorial steps 5–6 land here |
| 1 · B1.5 | Isabella was here first | goblin camp C at the crater approach; the crater rim | reach camp C | in-world | + Isabella | `ISABELLA rescued!`; Isabella `following_collette` (§2.1); `FLAVOR_MARKERS[2]` on the rim; `Something fell here. A long time ago.`, `Ground Control`, hero `crater` lines (§2.1, §7.1); `All siblings found! Destroy the camps!`, `Squad Assembled` (§2.5, §9) |
| 1 · B1.6 | Roots of the problem | Stewart Camp C2, then the Rootways | `squad_assembled` | in-world | squad, Elm, merchant, bounty board | Elm lines 1–2 (§4.1); `forest_1`, `forest_2` text (§5.1); bounty board strings (§5.5); `A mysterious merchant has appeared!` (§10.6); `Camp Crusher`; Ed greeting 1 |
| 1 · B1.7 | Lamplight Landing | the cave mouth on the south cliff | `forest_2` active | in-world | squad, Quartz | Quartz line 1 (§4.1); `forest_2` turn-in; `cave_1` offered (§5.1) |
| 1 · B1.8 | The Hollow Grove | the Rootways, then the dungeon | `forest_3` active, at the entrance | in-world, then boss intro | squad | entry card `The Hollow Grove` + desc (§11.2); hero `dungeon_enter` ×4 exchange (§2.1); `Guardian of The Hollow Grove`, all Treant lines (§6.3); Liam `boss_appear` at the intro card; `Hearthroot Seed` (§11.3); `Dungeoneer`; rest-room lore (§10.5); ability-room lines (§2.4) |
| 1 · B1.9 | The forest breathes | Elm at the Rootways gate | `dungeon_cleared.forest`, turn-in | in-world | squad, Elm | Elm line 3; `forest_3` reward text |
| 1 · B1.10 | Kid Snatch | Crash Meadow | `forest_3` complete, on the walk back toward camp | boss intro (letterbox) and fight | squad | `THE GOBLIN KING` / `Ruler of the Horde — Kid Snatch!` / `THE GOBLIN KING APPEARS!`; Isabella `boss_appear` at the card; `GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"`; caged lines 1–3; every cage and phase string (§6.1); `GOBLIN KING DEFEATED!`, `King Slayer`; Collette `victory` on the kill |
| 2 · B2.1 | Got her hopping | Stewart Camp C4, Ed's hangar | `goblin_king_defeated`, next return to camp | in-world | squad, Ed | Ed hangar lines **[new text]** (§2.6); Ed `phase1_intro` 1–4 (§3.2) with hero `quest_intro` ×4 (§2.1); `❗ Quest Accepted: Ground-Ed: The Propeller` |
| 2 · B2.2 | The meteor | Stewart Camp, the fire, the first dusk after B2.1 | `goblin_king_defeated`, day phase enters dusk, squad on the Forest island, no fight or dialogue running | **CS-03** (24.2 s, skippable) | squad, Ed at the fire | `What is that...?`, `A strange light glows in the distance...` (§7.1); tips 9–11 join the title rotation from here (§10.1) |
| 2 · B2.3 | Don't go poking at it | Ed at the hangar; then the crater | `meteor_seen` and not `ed_quest_complete` | in-world | squad, Ed | Ed `crater_hint` **[new text]**; the four post-meteor crater lines (§2.2) on the walk there (`crater_visited`); `CRATER_FLAVOR` thereafter (§10.3) |
| 2 · B2.4 | First flight | Ed's Landing, then the Frozen Peaks | stand on the strip with `island_unlocked.frozen` | **CS-04** in-flight sequence | squad, Ed | Ed greeting 5 on the first hop, 4 on later hops (§3.1) |
| 2 · B2.5 | The Hearth | Frozen Peaks landing, Neve's hut | landing | in-world | squad, Ed, Neve | title card **[new text]**; Neve lines 1–2 (§4.1); `frozen_1`, `frozen_2` (§5.1); `Frost Wyrm APPEARS!` and its popup (§6.5); Collette `mid_boss` at the first mini-boss popup of the game |
| 2 · B2.6 | The propeller | the glacier shelf below the Observatory | `ground_ed_1` active | in-world | squad | `<item name> collected!` rendered as `Propeller collected!` (§5.3); Ed `phase1_return` at the plane; `Aviator Goggles + 100 Gold`; `phase2_intro` 1–3 auto-offered; `island_unlocked.swamp` |
| 2 · B2.7 | The Ice Citadel | the Observatory tower, the Frozen dungeon | `frozen_3` active | in-world, then boss | squad | entry card `The Ice Citadel` + desc; Frost Lich lines; `Hearthice Crown`; Neve line 3 on turn-in; lore secret 5 at the tower's foot (§10.4) |
| 2 · B2.8 | The Long Causeway | Murky Swamp landing, Fern's lantern jetty | landing | in-world | squad, Ed, Fern | title card **[new text]**; Fern lines 1–2; `swamp_1` |
| 2 · B2.9 | The rudder | the rudder site, deep bog | `ground_ed_2` active | in-world | squad | `Ambush!` (four goblins), `Rudder collected!` (the `<item name> collected!` template); Collette `swamp_item` on pickup; Ed `phase2_return`; `Ed-ible x3 + 100 Gold` with Isabella `snack_reward`; `phase3_intro` 1–3; `island_unlocked.desert` |
| 2 · B2.10 | Toxic Harvest | the Bog Witch's hut, the lantern chain, Fern's jetty | `swamp_2` accepted | in-world set piece | squad, the Bog Witch, the frog | Bog Witch lines **[new text]**; `🐸 Familiar`, `🐸 Familiar arrived safely!` / `🐸 Familiar died! Talk to Bog Witch to retry.` (§1.4); Noah `swamp_item` when the frog is first met; `Poison immunity` |
| 2 · B2.11 | The Sunken Temple | the Witch's Lanterns path, then the dungeon | `swamp_3` active | in-world, then boss | squad | entry card `The Sunken Temple` + desc; Hydra Matriarch lines; `Marshlight Vial`; Fern line 3; lore secret 4 near the hut |
| 2 · B2.12 | The Oasis | Scorching Sands landing | landing | in-world | squad, Ed, Sol | title card **[new text]**; Sol lines 1–2; `desert_1`; Sand Nomad lines **[new text]** at his camp |
| 2 · B2.13 | Nomad's Path and the Tomb | the dune sea; the Buried Tomb | `desert_2`, `desert_3` | in-world, then boss | squad | `WAYPOINT` labels (§5.4); entry card `The Buried Tomb` + desc; Pharaoh Wraith lines; `Sunstone Crest`; `★ GOLDEN CHEST! ★` (§10.4); Sol line 3; lore secret 3 at the tomb approach |
| 2 · B2.14 | The Crystal Depths | under the Forest island | `cave_3` or `ground_ed_3` active | in-world, then lair boss | squad, Quartz | Quartz line 2; `Crystal Golem APPEARS!` (§6.5); lair card `The Crystal Depths` + desc; Noah `boss_appear` at the Colossus intro; `Crystal Beam!`; `Lampstone Core`; `Spark Plug recovered from the Crystal Depths!` (§3.6); Quartz line 3; lore secret 2 |
| 2 · B2.15 | The Green Meanie lives again | Ed's Landing at camp, stage C5 | `ground_ed_3` turn-in | in-world, then **CS-05** (12 s) | squad, Ed | Ed `phase3_return`, `quest_complete` 1–4 with hero `space_hint` ×4; `The Green Meanie lives again!`; `Well-Ed-ucated`; from here `Ed: "Time for a supply run!"`, `📦 Supply crates incoming!`, `Ed's back from his supply run!`, crate strings (§3.6); Ed `post_quest` 1–5 on the next talk |
| 3 · B3.1 | Some of it is watching | the crater rim, dusk | `ed_quest_complete`, `crater_visited`, `meteor_seen`, not `ed_crater_dialogue`; Ed walks to the rim and waits | **CS-06** dialogue scene | squad, Ed | Ed `crater_awareness` 1–5 (§3.5); Noah and Isabella `ed_crater` (§2.1) |
| 3 · B3.2 | Something pulses | Stewart Camp C6, then the crater at night | all four island dungeons cleared and `ed_crater_dialogue` | in-world, then **CS-07** (10 s) | squad | `Something pulses faintly to the northeast...` (§10.6); `A mysterious portal appears...`, `ENTER PORTAL` (§6.2) |
| 3 · B3.3 | Home, wrong | the Shadow shard: mirror crater, Outer Ward, Inner Sanctum, Throne of Shadows | enter the portal | **CS-08** arrival (8 s), then the dungeon | squad only; Ed's fire visible from the real world | `Welcome to the Shadow Realm...`; floor banners, `The shadows deepen... dark whispers fill the air.`, `The final threshold. No turning back.` (§6.6); Stone Sentinel, Phantom Warden; Citadel Warden lines (§6.3); the shadow squad (`bosses.md`) |
| 3 · B3.4 | Mistress of Darkness | the corrupted hearth in the Throne of Shadows | Warden dead, the citadel door opens | boss intro and fight | squad | `THE SHADOW QUEEN` / `Mistress of Darkness`; every Queen phase, kidnap and clone string (§6.2); `THE SHADOW IS VANQUISHED!`, `New Game+ unlocked!`, `Shadow Slayer`; `★ THE SHADOW CITADEL HAS FALLEN ★` with its subtitle (NG+5 variant), `Citadel Conqueror`, `True Final Boss`; `<hero> received <legendary>!`, `Legendary Hero` |
| 3 · B3.5 | Lights in the dark | the real crater, then Stewart Camp C7, dawn to golden hour | Queen dead, victory stats continued | **CS-10** ending (52 s, `cutscenes.md` §2.11) | all four, Ed, the deer | `SHADOW QUEEN VANQUISHED!` / `The darkness has been defeated!` (stats); `VICTORY!` / `The Stewart Squad saved the realm!`; closing card **[new text]**; victory buttons (§12.3) |
| 3+ · B3.6 | The rift | under the crater | `shadow_queen_defeated`, then `KEEP PLAYING` or NG+ | in-world, then lair boss | squad | `The ground trembles... A volcanic rift opens!`; lair card `The Volcanic Rift` + desc; all Magma Titan lines; `Emberforge Heart`; `Forged in Fire` |
| NG+ · B4.1 | Third time this week, again | as B1.1 | `⚔️ NEW GAME + N` | **CS-11** = CS-01 with all four kids climbing out of the wreck; no ambush | all | the same lines as CS-01 (that it is the same is the joke); `NG+N — Enemies grow stronger!` (§11.12); no cages, tutorial off |

Playtime targets: Act 1 about 60–75 min at a first-timer's pace (the tutorial's seven steps land inside the first 5 min, B1.2–B1.4); Act 2 about 2.5–3 h; Act 3 about 60–75 min. Every island's title card is delivered on first landing and on every return (title cards fade in over 0.8 s, hold 3 s, fade 1 s; `ui-ux.md`).

### 2.2 The world map

Five floating diorama islands and one under-region. Keys are the v27 biome keys so quest `biomeReq` values port unchanged. Display names are the canon `BIOME_NAMES` (§11.1) except the shard, which v27 never named as a place. Coordinates below are island-local metres, `+x` east, `+z` south, origin at the island's hub. Sizes are the walkable footprint; the mesh extends about 25 m beyond it as cliff, root and rubble that the curved-world shader rolls away.

| Key | Display name | Size class (footprint) | Sky position from the Forest island | Altitude | Hub and landing | Dungeon or lair | Guide NPC | Mini-boss | Story role | Title card line **[new text]** |
|---|---|---|---|---|---|---|---|---|---|---|
| `forest` | `Enchanted Forest` | L, 360 × 300 m | home | 0 (reference) | Stewart Camp; Ed's Landing is the crash furrow | `The Hollow Grove` (dungeon, in the Rootways district) | `Rootkeeper Elm` | none on the surface | Act 1 entire; the meteor, the crater, the portal, the ending | `Home, or near enough. Mind the goblins.` |
| `cave` | `Crystal Caves` | M, 180 × 120 m, under the Forest island | beneath home, entered from the south cliff | −40 m | Lamplight Landing at the cave mouth; no plane | `The Crystal Depths` (lair, not a room dungeon) | `Lamplighter Quartz` | `Crystal Golem` | Act 1 via `forest_2`; Act 2 spark plug | `The island's roots. Quartz keeps the lamps lit.` |
| `frozen` | `Frozen Peaks` | M, 220 × 200 m | east-north-east, 900 m off | +120 m (highest reachable by plane) | the Hearth, Neve's hut; snowfield strip | `The Ice Citadel` (dungeon, inside the Hermit's Observatory) | `Hearthkeeper Neve` | `Frost Wyrm` | first destination; the propeller; aurora nights | `Where the propeller went. Don't look down.` |
| `swamp` | `Murky Swamp` | M, 220 × 200 m | south-west, 700 m off | −60 m (lowest; mist below) | the Long Causeway, Fern's lantern jetty | `The Sunken Temple` (dungeon, at the end of the Witch's Lanterns path) | `Mistweaver Fern`, plus the `Bog Witch` | `Swamp Hydra` | second destination; the rudder; the escort | `Lanterns first. Then everything else.` |
| `desert` | `Scorching Sands` | M, 240 × 200 m | south-east, 1,000 m off | +30 m | the Oasis, Sol's hard-pan strip | `The Buried Tomb` (dungeon, the Sunken Pyramid) | `Dunewalker Sol`, plus the `Sand Nomad` | `Sandworm` | third destination; free order after the rudder | `Sand, not sugar. Water is further than it looks.` |
| `shadow` | `Shadow Realm` | S, 160 × 140 m shard | due north, high; drifts nearer each act (§2.3) | +300 m | none; entered only by the crater portal | `Home, Wrong` = the whole shard; interior banners keep the canon Citadel floor names | none | `Stone Sentinel`, `Phantom Warden` | Act 3 finale | `Home. Wrong.` |
| `volcanic` | `The Volcanic Rift` (canon dungeon name) | S, 100 × 80 m, under the crater | beneath the Forest island's crater | −60 m | none; a cracked stair in the crater floor | `The Volcanic Rift` (lair) | none | none | post-game raid, NG+ | canon desc: `Magma churns beneath obsidian halls. The Titan waits in fire.` |

Read at distance, from the plane: Forest is the cabin's teal roof and the waterfall off the west rim. Frozen is the Observatory dome on the summit. Swamp is a low island wearing its mist like a skirt, with one line of amber lanterns. Desert is the half-buried pyramid's tip. Shadow is an inverted teardrop with ember cracks on its underside and faint lights on top that are the mirror camp. The Rift is only ever seen from inside.

#### Forest island — `Enchanted Forest` (home)

Macro layout is hand-authored (Brief §5.1). Landmark positions are fixed; prop scatter, enemy spawn points and secret positions are seeded per save.

| Landmark | Position (m) | Size | Story role | Read at distance |
|---|---|---|---|---|
| Stewart Camp (hub; growth stages C0–C7, `camp.md`) | (0, 0) | 30 × 30 m at C1, 60 × 45 m at C6 | every camp beat; Ed, the merchant, the bounty board, the fire | one warm light pool, a smoke column, the tent's triangle |
| Ed's Landing (the crash furrow) | (10, 0) to (70, 0) | 60 × 12 m strip east of camp | CS-01 impact; every takeoff and landing; Ed's hangar at C4 sits at its west end | a scorched double line in the grass with the wreck at one end |
| Crash Meadow | centred (60, 0) | 45 × 45 m open grass | Goblin King arena (B1.10); the CS-01 ambush | the flattest, emptiest ground on the island; goblin totems ring it after B1.1 |
| Goblin camp A (spawner) with Noah's cage | (40, −60) | 12 m ring | B1.3; tutorial step 3 | crooked palisade, cook-fire, a cage on a cart |
| The Carved Oak (`FLAVOR_MARKERS[0]`) | (30, −42) | one 14 m oak | `Someone carved: 'L + N were here'` | the biggest single tree on the north meadow |
| The Pond | (−40, −30) | 18 m across | fishing (peaceful layer, Phase 4); the deer drink here | still water, reflection |
| The stream | from the NE hills (150, −60), past camp, to the west-rim waterfall at (−150, 110) | 3–5 m wide | Collette's hideout on its bend; the mirror stream is Home, Wrong's Inner Sanctum | turquoise `#2EB8A6`, foam at the rocks |
| Goblin camp B with Collette's cage | (−80, 80) | 12 m ring | B1.4 | palisade beside the stream bend |
| Collette's Secret Hideout (`FLAVOR_MARKERS[1]`) | (−60, 60) | a 4 m hollow log with a lantern and a rag rug | `A sign reads: 'Collette's Secret Hideout →'`; the arrow points at the log | a hollow log with a curtain |
| The Rootways (district) | (110, 0) to (190, 60) | 80 × 60 m of root walls and canopy tiers | approach to the Hollow Grove; Elm's gate at (120, 10); `forest_1`'s far camp | trunks the size of towers, roots lifting the ground |
| Goblin camp D (spawner) | (150, 45) | 12 m ring | `forest_1` needs two of A–D; C3 needs all four | — |
| The Hollow Grove entrance | (172, 28) | root arch 6 m tall | B1.8; card `The Hollow Grove` | a living arch that breathes (`dungeons.md`) |
| Lore secret 1 | (192, 62) | marker | `The forest remembers when the Shadow Queen first stirred...` | glowing `?` |
| The crater (`ALIEN_CRATER`) | (120, −120) | radius 12 m, glass basin radius 6 m | B1.5 discovery, CS-03 impact, B2.3, B3.1, CS-07 portal, B3.6 rift | a wrong-coloured glow on the NE cliff; after the meteor it reads from camp as a second, lower moon |
| Goblin camp C with Isabella's cage | (95, −100) | 12 m ring | B1.5 | palisade at the crater approach |
| `FLAVOR_MARKERS[2]` | (110, −108) | scratched rock on the rim | `Scratched into the rock: 'Isabella was here first!!!'` | — |
| Lamplight Landing (cave mouth) | (0, 125) on the south cliff | arch 8 m wide, stair down | B1.7; Quartz's lantern post; the way to the Crystal Caves | a lantern glow under the island's lip |
| The Ridge | the north rim, (−60, −120) to (60, −130) | 6 m rise | CS-01 goblin silhouettes; the plane crosses it in B0.1 and CS-10 | the horizon line from camp |

Enemy camps: four goblin spawners (A–D). The Goblin King has no lair; he comes to Crash Meadow. Seeded scatter (Brief §5.1): 3 buried treasures, 2 caches, pollen and fireflies, deer paths. Secrets never spawn inside the landmark discs above (port v27's `_clearOfLandmarks`, Part 2 §3.1, at 15 m in metres).

#### Crystal Caves — `Crystal Caves` (under the Forest island)

Entered on foot from Lamplight Landing and streamed as its own region. Not a room dungeon: an open cavern of lamp-lit paths with the Depths at its heart as a boss lair. The rule that makes it a cave and not a basement: **only Quartz's lamps and Collette's magic light it**. The Bog's darkness language is previewed here in a gentle form (`dungeons.md` owns that language; `world-builder` builds the region).

| Landmark | Position (m) | Story role | Read at distance |
|---|---|---|---|
| Lamplight Landing | (0, 0) at the mouth | Quartz's post; `forest_2` turn-in; the cave quests | a lantern on a hook, warm against violet crystal |
| Crystal camps (two spawners) | (−50, 40), (60, 50) | `cave_1` kills | bat roosts, shielded-goblin nests |
| The Golem's Gallery | (−70, 90) | `Crystal Golem` (`Crystal Caverns Guardian`); the first mini-boss most players meet | a hall of reflecting facets |
| The Depths (lair) | (30, 110), 40 m arena | `Crystal Colossus`; lair card `The Crystal Depths` + canon desc; `cave_3`; the spark plug on a crystal plinth at the back, pickable only while `ground_ed_3` is active | one huge crystal heart pulsing `#00d2ff` |
| Lore secret 2 | (80, 20) | `Deep in the crystals, an ancient power sleeps...` | glowing `?` |

`Clear the Crystal Depths` (canon, `ground_ed_3`) means the Colossus is dead. If the Colossus was already dead when `ground_ed_3` is accepted, the plug is simply there to pick up on the next visit and the quest still completes with `Spark Plug recovered from the Crystal Depths!`. This closes the v27 dead end where a cave cleared early made the chain unfinishable (Part 2 §11.4: cleared dungeons could not be re-entered).

#### Frozen Peaks — `Frozen Peaks`

| Landmark | Position (m) | Story role | Read at distance |
|---|---|---|---|
| The Hearth (hub): Neve's hut and the snowfield strip | (0, 0); strip (−10, 20) to (50, 20) | landing; Neve; `frozen_1`–`frozen_3`; Ed and the plane wait here | a lit window and a chimney in the snow; the plane's yellow beside it |
| The glacier shelf | (60, −40) | the propeller (`ed_propeller`, gold glow `#FFD700`) frozen into the ice, visible from the strip; light combat on the way | a gold glint in blue ice |
| Frozen camps (two spawners) | (−60, 30), (90, 10) | `frozen_1` | ice-spike palisades |
| The Wyrm's Hollow | (−70, −60) | `Frost Wyrm` (`Frozen Tundra Guardian`); with the Golem, completes `The Hermit's Test` on the first visit | a bowl of frost breath |
| The Hermit's Observatory | summit (140, −90), tower 22 m | the Ice Citadel's entrance at its base; the "strange tower to the east... gears turning inside, no one at the controls" of Ed's `post_quest` line 5; aurora-powered lens (`dungeons.md`) | the dome, the only man-made silhouette on the island |
| Lore secret 5 | (128, −70), the tower's foot | `Ice preserves what fire cannot destroy...` | glowing `?` |

The island is to the east-north-east so that Ed's `post_quest` line 5 ("a strange tower to the east") and the citadel hint ("to the northeast") are both true from the camp fire. Aurora: night only, this island only (ATMOSPHERE §3.1 trigger kept).

#### Murky Swamp — `Murky Swamp` (the Bog island)

| Landmark | Position (m) | Story role | Read at distance |
|---|---|---|---|
| The Long Causeway (hub): Fern's lantern jetty and the one dry strip | (0, 0); strip (−30, 0) to (30, 0) along the causeway | landing (the plane lands on the causeway boards); Fern; `swamp_1`–`swamp_3`; "safety" for the escort | a line of amber `#FFB347` lanterns on a boardwalk |
| The Bog Witch's hut | (−90, 70), on stilts | the `Bog Witch` (§2.7); the frog familiar starts here; retry point | a crooked hut with one green window |
| The Witch's Lanterns (path) | seven unlit posts from (−80, 60) to (−30, −100) | the escort route and the temple approach: posts light when a hero stands close for 1.5 s; the frog only hops between lit posts; wisps only attack in the dark | seven dark posts, then seven lit ones |
| The rudder site | (60, 90) | `ed_rudder` (green glow), four-goblin `Ambush!` (canon) | a green fin sticking out of black water |
| The Hydra's Pool | (90, −50) | `Swamp Hydra` (`Toxic Swamp Guardian`) | a still pool that is too still |
| Swamp camps (two spawners) | (−40, −40), (70, 40) | `swamp_1` | troll dens, healer totems |
| The Sunken Temple entrance | (−30, −110) | card `The Sunken Temple` + desc; the Hydra Matriarch | half-drowned steps under a lantern that will not stay lit |
| Lore secret 4 | (−100, 90), behind the hut | `The swamp feeds on the darkness — and grows stronger...` | glowing `?` |

Glowing mushrooms `#6CE87A` are the island's night light (Brief §4.3). The lantern path is the Bog's core mechanic previewed in the overworld; the Sunken Temple composes it (`dungeons.md`).

#### Scorching Sands — `Scorching Sands` (the Desert island)

| Landmark | Position (m) | Story role | Read at distance |
|---|---|---|---|
| The Oasis (hub): Sol's shade and the hard-pan strip | (0, 0); strip (−40, 30) to (40, 30) | landing; Sol; `desert_1`–`desert_3` | oasis turquoise `#1FA3A0` in ochre; palms |
| The Sand Nomad's camp | (80, −40) | the `Sand Nomad` (§2.7); `Nomad's Path` starts here; the three `WAYPOINT` cairns are his trail markers | a tent and a tethered camel-sized silhouette |
| Waypoint cairns 1–3 | (140, −90), (60, −140), (−90, −110) | `desert_2` (`Visit 3 waypoints in the desert.`) | stacked stones with a flag |
| The Sandworm's Wallow | (−80, 40) | `Sandworm` (`Desert Depths Guardian`) | rippled ground, `The ground trembles...` |
| Desert camps (two spawners) | (−50, −60), (110, 10) | kills, camps bounty | bleached-bone palisades |
| The Sunken Pyramid | (120, 60), pyramid 30 m base, tip at +12 m | the Buried Tomb's entrance is the pyramid's tip; card `The Buried Tomb` + desc; Pharaoh Wraith | the tip of a pyramid in a sea of dunes |
| The golden chest | (−120, −40), a cleft in the west rim | `★ GOLDEN CHEST! ★` (one per world) | — |
| Lore secret 3 | (100, 40), the tomb approach | `The desert sands hide the bones of forgotten heroes...` | glowing `?` |

`desert_1` (`Survive 3 world events.`) counts all five event types here; world events run on every island (§2.8).

#### Shadow Realm — the shard, which is `Home, Wrong`

The shard is the Forest island's camp quadrant, mirrored and wrong, about 160 × 140 m. It is an island by streaming and a dungeon by rules. There is no free roam: arrival is at the mirror crater and the only way is forward.

| Region (canon Citadel floor name) | Mirror of | Story role | Read at distance |
|---|---|---|---|
| The mirror crater | the crater | CS-08 arrival; `Welcome to the Shadow Realm...` | the crater, but the glow is the wrong way up |
| Floor 1 `Outer Ward` | the Rootways | banner `SHADOW CITADEL — Floor 1: Outer Ward`; `Stone Sentinel`; cave-dark, spikes (canon floor hazard) | root walls of ash `#5C5C66` |
| Floor 2 `Inner Sanctum` | the stream, the hideout, the cave mouth | `The shadows deepen... dark whispers fill the air.`; `Phantom Warden`; poison (canon) | the stream runs rift cyan `#3AF0FF` and uphill |
| Floor 3 `Throne of Shadows` | Stewart Camp at stage C6 | `The final threshold. No turning back.`; the shadow squad set piece at the mirror fire; the `Citadel Warden` at the cabin door; the cabin has grown into the citadel; ice (canon) | the cabin's teal roof gone black, windows lit ember `#FF6A2A` |
| The corrupted hearth | the cabin's hearth | the Shadow Queen (B3.4) | one violet throne where the fire should be |

The one light: throughout Home, Wrong, a single warm light source exists that is not the player's — the real camp fire, seen through the void in the direction of the real world. It is **not** on the horizon. The shard sits due north of the Forest island, 300 m up and about 400 m out, so from the shard home is south and *below*: the glow sits under the shard's south rim at about **−37° from the ground plane** (`dungeons.md` §2.6.6). That is what puts it in frame at the gameplay pitch of 45–55°, where the true horizon never is. Build: a directional fill at 4 % intensity, colour `#FF9A3C`, from azimuth 180° and elevation −37°, plus a billboard at the same bearing and depression. It never lights the ground enough to see by. It is the title of the game made literal, and it is the lighting brief for `dungeons.md` and the "best lighting in the game" the Brief §5.3 asks for.

The shard drifts nearer across the acts, visible at night from every island: Act 1 a dark notch among the stars with three faint lights; Act 2 after the meteor, the ember cracks are visible; Act 3 it fills a hand's width of sky over the crater. It is one low-poly mesh on the sky dome with three emissive points, scaled per `story.act`. Cheap, and it is the story's clock.

**The post-game sky rule (from `cutscenes.md` §2.11, 2026-09-07).** From CS-10 on — `story.act` 4 — **the shard's three emissive points go out**. The lights have moved home. The mesh stays where Act 3 left it, a dark notch against the stars for the whole post-game, so a player who looks up after the ending sees what changed rather than nothing. NG+ resets `story.act` and the three lights come back with it.

#### The Volcanic Rift (post-game lair under the crater)

Opens when the Queen is dead and the player keeps playing: the portal collapses, the crater floor cracks (`The ground trembles... A volcanic rift opens!`), and a stair leads down into 100 × 80 m of obsidian halls to the Magma Titan's arena. Home of the four fire-family enemies (`fire_elemental`, `lava_slime`, `ember_sprite`, `obsidian_guard`; `enemies.md` may also use them in the shard's ember zones). `Forged in Fire`, `Emberforge Heart`, and the puzzle-room lore `Magma channels block the way.` live here. It is the answer to `Something fell here. A long time ago.` that the game never states: the ancient colossus of fire and stone is what fell first. Nothing in the text explains it; the lore secrets are the only hints. Tips 9 and 10 stay true.

#### How the biplane approaches and lands

Every island except the shard has one strip (positions above). Travel is a diegetic action: stand on the strip near the plane and press interact; a destination card lists unlocked islands (`ui-ux.md`). The flight is CS-04, 14–18 s: taxi and takeoff from the current strip, climb through the cloud layer, the departing island shrinking below, weather en route (the current island's weather for the first half, the destination's for the second; `world-events-weather.md`), the destination growing, one circuit of the island (the establishing shot that teaches its layout), landing on the strip with Ed's trademark bounce. Skippable after the first flight to each island. While the plane is on an island, Ed is on that island, at the strip: turn-ins happen there. Supply runs (`Ed: "Time for a supply run!"`) fly one loop over the current island and drop crates in a 60 m radius of the strip. Ed's random flyovers with the sputter (the `Frequent Flyer` counter) happen only while the squad is away from the strip on foot, so the plane is never in two places.

### 2.3 The spine, and the rules under it

**Why the family is here.** Grandpa Ed was flying the four kids in The Green Meanie. He was distracted by something "up there, way up" (his own `crash_landing` line 4), and the wind "is different up here lately". He crash-landed on the Forest island for the third time this week. That night the Goblin King's horde raided the wreck and carried off Noah, Collette and Isabella in cages. Liam wakes at dawn with Grandpa, a broken plane, and a job. Nothing here is invented beyond what the canon lines already say; the opening only arranges them in order.

**The travel ladder.** Ed's repair chain is the story's gate, and each part does what a real part does:

| Plane state | How | Reaches | Flight feel (CS-04) |
|---|---|---|---|
| Wrecked | B1.1 to B1.10 | nowhere; Act 1 is on foot | none; the sky belongs to the shard and the meteor |
| Hopping | C4 hangar: Ed whittles a propeller from a Rootways pine (B2.1) | `frozen` only, the nearest island; "don't look down" | sputter every 2.5 s (ATMOSPHERE §11.1), one stall-drop per flight, Ed's greeting 5 then 4, no tricks |
| Real propeller | `ground_ed_1` turned in | + `swamp` | steadier climb; still no rudder, so the plane crabs sideways on approach |
| Rudder | `ground_ed_2` turned in | + `desert` (across the crosswind) | clean turns; barrel roll allowed |
| Spark plug | `ground_ed_3` turned in: `The Green Meanie lives again!` | everything, plus supply runs and aerobatics; the reconnaissance loop of `quest_complete` line 2 circles the shard | loops and rolls at canon cadence (§11.2) |

Gating the islands one at a time costs nothing and buys three arrivals, each with its own title card and its own version of the plane. Rejected: unlocking all three at the hangar (one arrival moment instead of three; the chain would be a fetch list with no consequence).

**The Goblin King moves to Act 1.** In v27 he spawns after all five dungeons (Part 1 §18). The Brief §8 puts the Kid Snatch in the Phase 2 vertical slice, and the story wants it there: the King took the kids in B1.1, and B1.10 is him coming back for them after the squad clears his forest. He therefore does not spawn the portal on death (v27 L3231); he unlocks the hangar and Act 2. The King's canon numbers (`2200 + teamLv*140` HP) will be retuned by `bosses.md` for an Act 1 party; the Kid Snatch itself ports faithfully.

**The meteor moves to the first dusk after the King**, at the camp fire, not on the first dungeon clear. Same seven scenes, same 24.2 s, same two lines, same flags (`cutscenes.md` reshoots scene 1 from Liam sitting at the fire). This puts the meteor after the player has held the whole family and beaten the boss that took them, and lets Ed be in frame when it falls, which is what makes his `crater_hint` and later `crater_awareness` land.

**The finale trigger.** All four island dungeons cleared (`forest`, `frozen`, `swamp`, `desert`) and Ed's `crater_awareness` delivered. Then, at the next night on the Forest island: `Something pulses faintly to the northeast...` and the portal opens in the crater. The Shadow Citadel is not a separate post-game tower; its three canon floors are the structure of Home, Wrong, the Citadel Warden guards the door of the citadel the cabin has become, and the Shadow Queen sits at the hearth. One finale, every string delivered, no second ending.

**Camp milestones (flags `camp.stage`, read by `camp.md`).**

| Stage | Flag set when | What the story needs it to show |
|---|---|---|
| C0 | new game | the wreck, a tarp, embers (seen only in CS-01) |
| C1 | CS-01 ends | Brief §5.2 start: the tent, the stone fire ring; the wreck beside them |
| C2 | `squad_assembled` | four bedrolls; the bounty board Ed nails up; the merchant's first visit; the fence begins |
| C3 | all four forest camps destroyed | the garden; the deer come back to the pond |
| C4 | `goblin_king_defeated` | Ed's hangar over the wreck; the strip cleared; the plane patched and hopping |
| C5 | `ed_quest_complete` | the cabin with the teal-slate roof (the reference's cabin); Ed's workshop bench |
| C6 | all four island dungeons cleared | lanterns everywhere; the family crest banner; the fire at its biggest. Home, Wrong mirrors this stage |
| C7 | `shadow_queen_defeated` | pets, the fishing dock, photo mode props; the crater's glow visible from camp has gone warm |

**Hero reaction rules (a change from v27, Part 2 §7.4).** v27 appended one reaction, from the active hero only, to Ed's dialogue. Here:
1. A reaction is a party line. Every hero who has a line for the context says it, in the fixed order given in §2.5, as consecutive lines in the dialogue box (portrait and name in that hero's colour from `heroes.md`), or as staggered announces 1.2 s apart when there is no box (the Kid Snatch timing, Part 1 §17.8).
2. Each `HERO:context` pair fires once per playthrough (`story.reactionsFired`). The crater flavor lines keep their 30 s timer instead.
3. A hero must be unlocked and present to speak. Contexts at story dialogues are gated so the whole squad is present (`ground_ed_1` waits for `squad_assembled`).
4. Ed's `greetings` rotate one line per talk from a story-aware start index instead of playing all six: at the wreck 6, 3, 2; after `squad_assembled` 1 first; in flight 5 then 4. Blocks (`phase*_intro`, `quest_complete`, `post_quest`, `crater_awareness`) play whole and in order, exactly as authored.

### 2.4 The quest graph

All 18 `QUEST_DEFS` quests are kept with their `title`, `desc`, `hint` and `rewardDesc` verbatim (FAMILY_CANON §5.1–5.2). What changes is where they happen and what gates them. Active-quest cap rises from 3 to 4. Reward effects port from Part 2 §6.1 as data; `systems-engineer` fixes the v27 rewards that did nothing (`forest_2`'s compass range, `desert_3`'s `critRate`, Part 1 §29) so the reward text is true.

| id | Giver, where | Prerequisite (quest) | Story gate (flag) | Objective in the new world | Kept / changed |
|---|---|---|---|---|---|
| `forest_1` | Elm, Rootways gate | — | `squad_assembled` | destroy 2 of goblin camps A–D | kept; Act 1 |
| `forest_2` | Elm | `forest_1` | — | walk to Lamplight Landing and stand near Quartz (`talk_to`, target `Lamplighter Quartz`) | **changed:** Quartz *is* the Crystal Sage; his name plate reads `Lamplighter Quartz` with the subtitle `the Crystal Sage` **[new text]**; the lantern-beam marker points at him |
| `forest_3` | Elm | `forest_2` | — | clear `The Hollow Grove` | kept; gates the Goblin King |
| `cave_1` | Quartz, Lamplight Landing | — | `forest_2` accepted (you have met him) | kill 20 in the Crystal Caves | kept; caves are the Forest under-region |
| `cave_2` | Quartz | `cave_1` | — | collect 5 equipment drops (anywhere) | kept |
| `cave_3` | Quartz | `cave_2` | — | defeat the Crystal Colossus in the Depths | **changed:** lair boss, not a room dungeon; Depths re-enterable |
| `frozen_1` | Neve, the Hearth | — | `island_unlocked.frozen` | destroy the 2 frozen camps | kept |
| `frozen_2` | Neve | `frozen_1` | — | defeat 2 mini-bosses (any) | kept; Golem + Wyrm completes it on the first visit |
| `frozen_3` | Neve | `frozen_2` | — | clear `The Ice Citadel` | kept; entrance at the Observatory's base |
| `swamp_1` | Fern, the Long Causeway | — | `island_unlocked.swamp` | kill 15 in the swamp | kept |
| `swamp_2` | Fern | `swamp_1` | — | escort the frog familiar from the Bog Witch's hut along the lantern path to Fern's jetty | **changed:** finishable (§2.7); a light-and-dark set piece; failure resets to `available` and the Witch re-summons the frog (canon retry line) |
| `swamp_3` | Fern | `swamp_2` | — | defeat the Hydra Matriarch in the Sunken Temple | kept |
| `desert_1` | Sol, the Oasis | — | `island_unlocked.desert` | survive 3 world events | **changed:** all five event types count (v27 counted three, Part 2 §21 #20) |
| `desert_2` | Sol | `desert_1` | — | visit the 3 `WAYPOINT` cairns anchored to the Sand Nomad's camp | **changed:** anchored to a real NPC (§2.7) |
| `desert_3` | Sol | `desert_2` | — | clear `The Buried Tomb` | kept |
| `ground_ed_1` | Ed, the hangar | — | `squad_assembled` and `goblin_king_defeated` | propeller on the Frozen glacier shelf; turn in at the plane | **changed:** gated on the full squad and the King, so `quest_intro` is a four-line exchange and the hop exists |
| `ground_ed_2` | Ed, auto-offered at turn-in | `ground_ed_1` | — | rudder at the Bog rudder site (four-goblin ambush kept) | kept; unlocks `swamp` on `ground_ed_1` turn-in, `desert` on this turn-in |
| `ground_ed_3` | Ed, auto-offered | `ground_ed_2` | — | clear the Crystal Depths (Colossus dead) and take the spark plug from the plinth | **changed:** never unfinishable (§2.2) |

Story-level graph (flags in §2.6):

```
squad_assembled ─► forest_1..3 ─► hollow_grove_cleared ─► goblin_king_defeated ─► camp C4 (hop)
                                                            │                        │
                                                            ▼                        ▼
                                                     meteor_seen ──────────► island_unlocked.frozen ─► ground_ed_1 ─► island_unlocked.swamp
                                                            │                                                             │
                                                            ▼                                                             ▼
                                                     crater_visited                                    ground_ed_2 ─► island_unlocked.desert
                                                            │                                                             │
                                                            ▼                                                             ▼
                              ed_crater_dialogue ◄── ed_quest_complete ◄──────────────────────────── ground_ed_3 (Crystal Depths)
                                      │
                                      ▼
   dungeon_cleared.{forest,frozen,swamp,desert} + ed_crater_dialogue ─► portal_open ─► Home, Wrong ─► shadow_queen_defeated ─► ending ─► rift_open / NG+
```

Bounties (12, kept verbatim, board at camp from C2) and world events (§2.8) hang off this graph but never gate it. `Quest Master` fires at 15 completed NPC quests (canon), which excludes the Ground-Ed chain exactly as v27 did.

Escort in 3D (`swamp_2`): the frog has 50 + 5 × team level HP (canon), hops at 2 m/s, and moves only toward the next *lit* post; a post stays lit for 40 s after a hero leaves it; the route is 7 posts over about 170 m; wisps spawn in unlit stretches (`enemies.md`); the frog says nothing (v27 gives it no lines), but Noah's `swamp_item` line fires when the party first reaches it. Success within 30 px of the jetty in v27 becomes 2 m of Fern.

### 2.5 Where every canon line lives

Every string in `FAMILY_CANON.md` is delivered somewhere below or is owned by a named later file. "Trigger changed" marks lines that stay verbatim but fire differently from v27. Order within a party exchange is fixed and listed.

**Grandpa Ed dialogue (FAMILY_CANON §3)**

| Key | Beat | Trigger | Changed? |
|---|---|---|---|
| `greetings` 1–6 | B1.2, B1.6, B2.4, any idle talk | one per talk, story-aware rotation (§2.3 rule 4): wreck 6 → 3 → 2; after `squad_assembled` 1, then any line not yet heard, then cycle from 1; hop flights 5 → 4; repaired flights cycle 1 → 4 → 3 | trigger changed (v27 played all six every time) |
| `quest_ground_ed.phase1_intro` 1–4 | B2.1 | `ground_ed_1` offered at the hangar; followed by `quest_intro` ×4 in the order Liam, Noah, Collette, Isabella | gate changed |
| `phase1_return` | B2.6 | turn-in at the plane on the Frozen strip | location changed |
| `phase2_intro` 1–3 | B2.6 | auto-offer right after `phase1_return` (v27 order kept) | — |
| `phase2_return` | B2.9 | turn-in at the plane on the Causeway | location changed |
| `phase3_intro` 1–3 | B2.9 | auto-offer | — |
| `phase3_return`, then `quest_complete` 1–4 | B2.15 | turn-in at Ed's Landing at camp; `space_hint` ×4 follows in the order Isabella, Noah, Collette, Liam (Liam's "duct tape" line is the button) | — |
| `crash_landing` 1–4 | B1.1 (CS-01) | line 1 in the air as the plane spirals; impact; line 2 climbing out; the four kids' `crash_landing` lines in the order Liam, Isabella, Noah, Collette; Ed lines 3 and 4 as he looks up; night falls | **new trigger** (never fired in v27) |
| `post_quest` 1–5 | B2.15+ | next talk to Ed at camp after `ed_quest_complete` (lines 2–3 assume an uncleared dungeon exists; if none does, the block still plays, Ed is allowed to be wrong) | — |
| `crater_awareness` 1–5 | B3.1 (CS-06) | Ed at the crater rim; `ed_crater` follows: Noah, then Isabella | location changed (Ed walks there) |
| `crater_hint` | B2.3 | `crater_discovered && meteor_seen && !ed_quest_complete && !ed_crater_hint` | **written new** (§2.7); v27 called a missing key |

**Hero reactions (FAMILY_CANON §2.1), one fire per hero per context**

| Context | Who | Beat and trigger |
|---|---|---|
| `crash_landing` | all four | CS-01, order Liam, Isabella, Noah, Collette |
| `quest_intro` | all four | B2.1 after `phase1_intro`, order Liam, Noah, Collette, Isabella |
| `space_hint` | all four | B2.15 after `quest_complete`, order Isabella, Noah, Collette, Liam |
| `dungeon_enter` | all four | B1.8 at the Hollow Grove arch as a four-line exchange, order Liam, Noah, Collette, Isabella. New trigger. |
| `boss_appear` | Liam, Noah, Isabella | Isabella at the Goblin King card (B1.10); Liam at the Ancient Treant card (B1.8); Noah at the Crystal Colossus card (B2.14). Each is announced in that hero's colour 0.8 s after the card lands. New trigger. |
| `sibling` (Liam) | Liam | B1.4, Collette freed while Liam is active. New trigger. |
| `following_collette` (Isabella) | Isabella | B1.5 if Collette is already unlocked when Isabella is freed; otherwise the first time control switches from Collette to Isabella. New trigger. |
| `swamp_item` | Noah, Collette | Noah when the party first reaches the frog (B2.10); Collette on picking up the rudder (B2.9). New triggers. |
| `mid_boss` (Collette) | Collette | the first mini-boss popup of the playthrough (usually the Crystal Golem, B2.14 or earlier). New trigger. |
| `victory` (Collette) | Collette | `GOBLIN KING DEFEATED!` (B1.10), 1.5 s after. New trigger. |
| `snack_reward` (Isabella) | Isabella | `Ed-ible x3 + 100 Gold` awarded (B2.9). New trigger. |
| `crater` | Noah, Isabella | each hero's first arrival at the crater while unlocked (B1.5 or later), order of arrival. Kept. |
| `ed_crater` | Noah, Isabella | after `crater_awareness` line 5 (B3.1). Kept. |

Also: the four post-meteor crater lines (§2.2) fire once as a set on the first crater approach after `meteor_seen`, in the order Collette, Liam, Isabella, Noah (Noah's "most insane thing" closes it; his `crater` context line, if still unfired, is dropped for that playthrough in favour of this one, so the two "most insane thing" lines never play back to back). The caged lines (§2.3) port as the v27 table including the unreachable index 4, fired by `BOSS_BLOCKS.kidSnatch` at canon timings (`bosses.md`). Ability-room lines (§2.4) are `dungeons.md`'s. Ultimate, signature, combo, revive and swap call-outs (§2.5) are the combat and companion systems' (`heroes.md`, `systems-engineer`).

**Everything else in FAMILY_CANON, by section**

| Canon | Delivered by | Notes |
|---|---|---|
| §1.1 hero names, `Tank` / `DPS` / `Mage` / `AoE` labels, ultimate and combo names, skins | `heroes.md`, `ui-ux.md` | role labels are v27 title-card UI; `heroes.md` decides whether they survive as words |
| §1.2 Ed's facts | this file's beats; `npcs.md` for the character | Ed-ibles are the `ground_ed_2` reward and the healing snack item |
| §1.3 Gran / Grambi | B3.1 (`crater_awareness`), tip 12, Isabella's `snack_reward` | Gran never appears; nothing new is written for her |
| §1.4 the frog familiar strings | B2.10 | `🐸 Familiar` label above the frog |
| §1.5 NPC names, colours, icons | `npcs.md` | Bog Witch and Sand Nomad defined in §2.7 |
| §1.6 villain names | `bosses.md` | Crystal Colossus and Magma Titan are lair bosses; Stone Sentinel and Phantom Warden finally spawn (Home, Wrong floors 1–2) |
| §2.2 post-meteor crater lines | B2.3 | see above |
| §2.3 caged lines | B1.10 | `bosses.md`; announce colour is each speaker's own (v27 used the first captive's colour for all, Part 1 §29) |
| §2.4 ability-room lines | `dungeons.md` | one hero-gated room per dungeon minimum |
| §2.5 call-outs, `RESCUE!`, `<HERO> rescued!`, `All siblings found! Destroy the camps!` | B1.3–B1.5; combat systems | — |
| §3.6 biplane announces | B1.1 (`sputters overhead`, `crash-landed`), B2.15+ (supply run set), `Spark Plug recovered…` B2.14 | `✈️ A biplane flies overhead!` and `✈️ Supply drop inbound!` fire on Ed's random flyovers after C4 (§2.2, approaches) |
| §4.1 guide lines 1–3 | line 1 on first talk; line 2 while that island's dungeon is uncleared and no quest bubble applies; line 3 after the dungeon is cleared | v27 never advanced past line 1 (Part 2 §21 #21); now all three deliver |
| §4.2 bubble templates, markers | `ui-ux.md` | the quest markers become lantern beams (Brief §6); the glyph strings still render in the journal |
| §5.1–5.2 quest text | §2.4 | verbatim |
| §5.3 quest items | B2.6, B2.9, B2.14 | glow colours kept |
| §5.4 notifications | quest system | `WAYPOINT` labels at the cairns |
| §5.5 bounties | §2.8 | all twelve completable |
| §6.1–6.6 boss and citadel strings | `bosses.md`, `dungeons.md` | Citadel floor banners at each Home, Wrong region entry; `★ THE SHADOW CITADEL HAS FALLEN ★` and its subtitle on the Queen's death (NG+5 variant at `ngPlus >= 5`); `The world awaits — explore the Shadow Citadel!` is cut (§2.9) |
| §6.7 enemy keys | `enemies.md` | — |
| §7.1 meteor cutscene lines | CS-03 | `Press SPACE to skip` on every cutscene (`ui-ux.md` renders the input-aware prompt; the canon string is the keyboard variant) |
| §8 tutorial steps 1–7 and opening strings | B1.2–B1.4 | steps keep their canon check conditions (Part 2 §12.1); step 7's `minimap` names the compass strip's predecessor and stays verbatim; `Shadow Citadel is ready!` is the dev-mode start string, kept for the dev console |
| §9 achievements, all 31 | the systems named in Part 1 §27, with these story homes: `Squad Assembled` B1.5, `King Slayer` B1.10, `Dungeoneer` B1.8, `Ground Control` B1.5, `Well-Ed-ucated` B2.15, `Shadow Slayer` and `Citadel Conqueror` B3.4, `True Final Boss` B3.4 at NG+5, `Forged in Fire` B3.6, `Legendary Hero` B3.4, `Frequent Flyer` from C4, `Ed's Landing` any dungeon exit at 1 HP | names and descriptions verbatim |
| §10.1 tips 1–12 | title and loading screens; tips 9–11 join the rotation after `meteor_seen`, tip 12 after `ed_crater_dialogue` | trigger changed (v27 drew from all twelve at random from the start; the story-aware rotation keeps the spoilers for later) |
| §10.2 flavor markers | B1.3, B1.4, B1.5 | homes fixed (§2.2) |
| §10.3 crater flavor | B2.3 onward, 30 s timer | — |
| §10.4 lore secrets and secret announces | §2.2 positions | — |
| §10.5 dungeon room lore | `dungeons.md` | `Crystal light flickers in the depths...` in the Depths lair; `Heat radiates…` and `Magma channels…` in the Rift |
| §10.6 world events | §2.8; `world-events-weather.md` | `Something pulses faintly to the northeast...` is B3.2; `The ground trembles... A volcanic rift opens!` is B3.6; `A mysterious merchant has appeared!` from C2 |
| §11.1 biome names | island display names | — |
| §11.2 dungeon names and descs | entry and lair cards | canon names are the proper names; the Brief's names are the districts (§2.2) |
| §11.3–11.12 items, gear, skins, skills, cards, NG+ labels | `heroes.md`, `ui-ux.md`, systems | `NG+N — Enemies grow stronger!` at B4.1 |
| §12 UI strings | `ui-ux.md` | story-bound ones: title (B0.1), `GAME OVER` / `The Stewart Squad has fallen...`, victory set (B3.5), dungeon entry/victory/fail, portal, save/load, multiplayer, dev console; endless strings cut (§2.9) |
| §13 gaps | all closed here: `crash_landing` (B1.1), nine reaction contexts (above), `crater_hint` (§2.7), `Bog Witch` and `Sand Nomad` (§2.7), `Crystal Sage` (§2.4), index-4 cage line (kept in data, unreachable by design) | — |

### 2.6 Story flags and save data

Flat, typed, saved in the versioned schema (Brief §7.1) under `story`, `camp` and `world`. Names are the v27 `storyFlags` names where one existed so the port is traceable; new ones follow the same style. `edSpaceHints` is dropped (never read in v27, Part 2 §21 #8). Every flag below is reset by a new game and by NG+ (v27 leaked three across restarts, #7).

| Flag | Type | Set when | Gates or is read by |
|---|---|---|---|
| `story.act` | 1 / 2 / 3 / 4 (post) | derived: 2 at `goblinKingDefeated`, 3 at `portalOpen`, 4 at `shadowQueenDefeated` | shard distance on the sky dome; tip rotation; title-card variants |
| `story.crashSeen` | bool | CS-01 ends or is skipped | nothing gates on it; NG+ sets it at start |
| `story.edMet` | bool | first talk to Ed at the wreck | greeting rotation start |
| `story.sibsRescued` | 0–3 | each cage opened | HUD `👥 Siblings: N/3`; tutorial step 3 |
| `story.squadAssembled` | bool | `sibsRescued == 3` | camp C2; `forest_1` offer; `ground_ed_1` gate; greeting rotation |
| `story.forestCampsCleared` | bool | goblin camps A–D all destroyed | camp C3 |
| `story.hollowGroveCleared` | bool | alias of `world.dungeonCleared.forest` | Goblin King spawn on next meadow entry |
| `story.goblinKingDefeated` | bool | King's death | camp C4; `island_unlocked.frozen`; `ground_ed_1` gate; meteor arming; act 2 |
| `story.meteorSeen` | bool | CS-03 scene 6 `onEnd` (or skip) | post-meteor crater branch; `crater_hint`; `crater_awareness`; tips 9–11 |
| `story.craterDiscovered` | bool | first crater approach (any act) | `Ground Control`; `crater_hint` |
| `story.craterVisited` | bool | first crater approach with `meteorSeen` | `crater_awareness` |
| `story.edCraterHint` | bool | `crater_hint` delivered | one-shot |
| `story.edQuestPhase` | 0–4 | Ed chain offers and turn-ins (v27 semantics, Part 2 §8.7) | hangar dialogue variants; save meta |
| `story.edGoggles` | bool | `ground_ed_1` turn-in | scrapbook memory item |
| `story.edEdibles` | int | `ground_ed_2` turn-in sets 3 | inventory: three Ed-ible snacks; `snack_reward` |
| `story.edQuestComplete` | bool | `ground_ed_3` turn-in | camp C5; supply runs; aerobatics; `post_quest`; `crater_awareness`; full-range travel |
| `story.betterDrops` | bool | with `edQuestComplete` | crate count and contents (Part 2 §8.6) |
| `story.edCraterDialogue` | bool | CS-06 ends | portal gate; tip 12 |
| `story.portalOpen` | bool | B3.2 | crater portal entity; `ENTER PORTAL`; act 3 |
| `story.shadowQueenDefeated` | bool | B3.4 | ending; camp C7; NG+ unlock; rift |
| `story.riftOpen` | bool | first Forest-island return after the ending | rift stair in the crater |
| `story.reactionsFired` | set of `HERO:context` | each delivery | §2.3 rule 2 |
| `story.craterFlavorLast` | seconds | each flavor line | 30 s timer |
| `story.greetingIdx` | int | each Ed talk | greeting rotation |
| `world.islandUnlocked.{frozen,swamp,desert,shadow}` | bool each | hangar / `ground_ed_1` / `ground_ed_2` / `portalOpen` | destination card; travel |
| `world.dungeonCleared.{forest,frozen,swamp,desert,citadel}` | bool each | dungeon victory | quests; portal gate; `Dungeoneer` |
| `world.lairCleared.{cave,volcanic}` | bool each | Colossus / Titan death | `cave_3`; `ground_ed_3` plug availability; `Forged in Fire` |
| `world.currentIsland` | key | landing | streaming; Ed's position |
| `world.planeState` | `wrecked` / `hopping` / `propeller` / `rudder` / `repaired` | camp C4, then each Ed turn-in | flight feel; range |
| `camp.stage` | 0–7 | §2.3 table | `camp.md` |
| `meta.ngPlus`, `meta.ngPlusUnlocked` | int, bool | B3.4 / B4.1 | NG_SCALE; `True Final Boss`; `NG+ Veteran` |

Also persisted, unchanged in role from Part 1 §28: `questLog`, `activeQuests`, `questItems` (`spawned`, `collected`, `ambushDone`), `secretsFound`, `flavorMarkersFound`, `achievements`, `bossEncountered` / `bossDefeated` per boss for the bestiary, `biplaneSeen`, `edCrashCount` (starts at 1: the opening counts), `tutorial.{step,active}`.

Branches the Phase 4 flag test must walk (Brief §8): (1) crater discovered before the meteor vs after; (2) Colossus killed before vs after `ground_ed_3` is accepted; (3) Isabella freed before vs after Collette (the `following_collette` trigger); (4) every hero unlocked vs one downed at each party exchange (the exchange skips the missing speaker and still marks nothing fired for them); (5) escort success vs death vs retry; (6) each island's dungeon cleared in every order relative to the Ed chain; (7) skip vs watch for CS-01, CS-03, CS-06, CS-07; (8) NG+1 through NG+5 start state; (9) save and reload between every pair of adjacent beats. The invariant the test asserts: after a full playthrough, `reactionsFired` contains every `HERO:context` pair in FAMILY_CANON §2.1, every `DIALOGUE` block has been opened, and every quest is `complete`.

### 2.7 New text

Everything below is **[new text]**. It is the complete list; nothing else in this file adds a spoken line. Moods use the v27 vocabulary (Part 2 §7.7) so `npcs.md` can drive portraits. Ed rambles and deflects; the Witch is gruff and kind; the Nomad is spare. No line says anything about a kid that the canon has not already said.

**Grandpa Ed — hangar, B2.1.** Shouted as the squad walks up, before the dialogue box opens with the canon `phase1_intro`.

| # | Line | Mood |
|---|---|---|
| 1 | `Got her hopping. She won't fly, mind you. But she'll hop.` | `proud` |
| 2 | `Whittled a propeller out of one of those big pines. Don't tell the tree.` | `sheepish` |

**Grandpa Ed — `DIALOGUE.grandpaEd.crater_hint`, B2.3.** Fills the key v27 called but never wrote. Gate as in §2.5. `ed_crater` reaction is *not* appended here (v27 asked for it; it belongs to `crater_awareness`, and the once-per-context rule would otherwise spend it early).

| # | Line | Mood |
|---|---|---|
| 1 | `Saw it come down. Lit the whole sky up like a runway.` | `stunned` |
| 2 | `Don't go poking at it. ...Yet.` | `worried` |
| 3 | `Let's get the old bird flying first. Then we'll go have a look. From a safe distance. A very safe distance.` | `nervous` |

**Bog Witch** — `NPC_DEFS`-style entry: name `Bog Witch`, biome `swamp`, colour `#7B3CA0` / dark `#4A2560`, icon 🧹. The frog is Fern's familiar; the Witch found it. Lines rotate like the guides' (§2.5, §4.1 rule).

| # | When | Line |
|---|---|---|
| 1 | first talk | `Hmph. Visitors. The mist doesn't usually let visitors through.` |
| 2 | `swamp_2` active, frog present | `Found this one shivering under a lily pad. He's Fern's. He only hops toward light, so light the way.` |
| 3 | frog lost, quest reset | `Back under the lily pad, is he? Go on. I'll fetch him. Lanterns first, this time.` |
| 4 | `swamp_2` complete | `Fern's got her frog back. The mist's in a better mood already.` |

**Sand Nomad** — name `Sand Nomad`, biome `desert`, colour `#EDE3CF` / dark `#B3541E`, icon 🐪. His camp anchors `desert_2`.

| # | When | Line |
|---|---|---|
| 1 | first talk | `The sand moves, so I move. Sit, if you like. It won't be here tomorrow.` |
| 2 | `desert_2` active | `Three cairns mark my old trail. Find them before the wind does.` |
| 3 | `desert_2` complete | `You walked it. Not many do. Sol will want to hear about that.` |

**Labels and cards.**

| Where | Text |
|---|---|
| Lamplighter Quartz's name plate, second line | `the Crystal Sage` |
| Stewart Camp title card, stage C1 | `Stewart Camp` / `Tent, fire, one bedroll. For now.` |
| Stewart Camp title card, C2 and up | `Stewart Camp` / `Tent, fire, four bedrolls. Home.` |
| Island title cards | the seven lines in the §2.2 island table |
| Home, Wrong floor cards | the canon floor banners; no new line |
| Ending card (CS-10) | canon only: `⚔️ The Stewart Squad Adventure` over `The world has stories to tell.` (see §8 for the one optional line) |

The camp's name is `Stewart Camp`. The reference image's "Fernwood" is a style, not a place in this family; `camp.md` may rename the camp only with a §6 line of its own.

### 2.8 Endless mode, bounties, world events, merchant

**Endless mode: cut.** A wave arena spawning enemies in a ring around the hero (Part 2 §10.2) has no place on an authored diorama with landmarks, and its bosses are the two story bosses recycled. Replay lives in NG+1–5, the bounty board, and the Volcanic Rift raid. Its strings are mode UI, not canon (`ENDLESS MODE - Survive!`, `ENDLESS`, `Wave: N`, `Score: N`, `Best: N`, `WAVE N - BOSS!`, `+N points!`, the `♾️ ENDLESS MODE` button, `ssq_highscore`). Logged in §6.

**Bounties: keep all twelve**, board at camp from C2, three rolled at a time, `Bounty Hunter` for all three in a session. `systems-engineer` wires the two v27 never could finish: `Untouchable` (30 s without damage, tracked in the sim) and `Storm Chaser` (3 weather changes, from the weather state machine). The board also stands at each island hub so a bounty can be claimed away from home.

**World events: keep all five** (`caravan`, `bloodmoon`, `treasure`, `spring`, `earthquake`), first at 60 s, then every 90 s, on every island, never during a cutscene, a boss fight, a dungeon, or Home, Wrong (v27's gates, Part 2 §9.1). All five count for `desert_1`. Story hooks offered to `world-events-weather.md`, none required: after `meteorSeen`, the blood moon's tint leans toward the crater's violet rather than plain red; the goblin caravan on the Forest island carries the family's crash luggage, so one of its three drops may be a memory collectible (Phase 4). `Event Survivor` stays on the blood moon.

**Merchant:** `A mysterious merchant has appeared!` at camp from C2 on the v27 timer, and at each island hub while the squad is there. Stock is Part 1 §25.1 verbatim.

### 2.9 What is cut or replaced, with the reason

| v27 thing | Fate | Why |
|---|---|---|
| Endless mode | cut | §2.8 |
| Random biplane crash event (`crashReadyTimer`, `crash` flyovers) | replaced by CS-01 | the crash is the opening; a second random crash would make Ed's plane a hazard instead of a character. The "never interrupts anything" gate (ATMOSPHERE §11.5) survives as the rule for CS-03 and CS-06 |
| Stranger flyovers before Ed is met | cut | Ed is met at minute 0; flyovers resume at C4 as Ed's test hops |
| Goblin King spawning the portal | replaced | §2.3 |
| Shadow Citadel as a post-game overworld entrance; `citadelEntrance`; `checkCitadelEntrance` | folded into Home, Wrong | one finale; all strings delivered |
| `The world awaits — explore the Shadow Citadel!` (keep-playing announce) | cut | false in the new spine; the keep-playing announce is `The ground trembles... A volcanic rift opens!` |
| The Crystal Depths and the Volcanic Rift as room dungeons | lairs (open arenas) | Brief §5.3 fixes five dungeons; the bosses and every string survive as lairs |
| `storyFlags.edSpaceHints` | dropped | never read |
| Active quest cap 3 | 4 | Ed's chain spans three islands and would otherwise squat on a third of the journal |
| Reaction from the active hero only | party lines, once each | §2.3 |
| `crater_hint` silent no-op | written | §2.7 |
| Banished heroes lost for good after the Queen's kidnap | restored on the Queen's death | the finale is the family getting each other back; a permanently missing sibling in the ending shot is not this game. The fight-time threat is unchanged (`CONTROL_MODEL` §7.3) |

### 2.10 Cutscene list (for `cutscenes.md`)

| id | Name | Beat | Length | Skippable | Must show | Flags set on end or skip |
|---|---|---|---|---|---|---|
| CS-01 | Third time this week | B1.1 | 55–70 s | yes | the Green Meanie sputtering over the Ridge at dusk; the spiral (ATMOSPHERE §11.5 values); the furrow; five people climbing out; the eight `crash_landing` lines; night; goblin silhouettes on the Ridge; three cages on carts; Liam down; dawn | `crashSeen`, `edMet` false until talked to, `edCrashCount = 1`, camp C1 |
| CS-03 | The meteor | B2.2 | 24.2 s | yes | seven canon scenes reshot; scene 1 from Liam at the fire, Ed in frame; impact framed on the crater from camp | `meteorSeen`, `craterDiscovered`, `world.clock.p = 0.70` (night has fallen by the time control returns) |
| CS-04 | Flight | B2.4 and every travel | 14–18 s | after first per island | §2.2 approach paragraph; plane state variants | `currentIsland` |
| CS-05 | The Green Meanie lives again | B2.15 | 12 s | yes | first real takeoff, one loop, the bounce landing; the squad waving (`Tip` 1) | `planeState = repaired` |
| CS-06 | Some of it is watching | B3.1 | dialogue length | line-by-line | Ed at the rim at dusk, the crater's 8 s pulse (§15.4) under the lines | `edCraterDialogue` |
| CS-07 | Something pulses | B3.2 | 10 s | yes | from the camp fire, the crater lights; push in; the portal's three arcs (§15.3) | `portalOpen` |
| CS-08 | Home, wrong | B3.3 | 8 s | yes | the mirror crater; the one far light | — |
| CS-10 | Lights in the dark | B3.5 | 52 s (`cutscenes.md` §2.11) | yes | the real crater at dawn, the four walking home, the camp at C7 in golden hour, the deer, the plane over the Ridge, the title over the tagline | camp C7 |
| CS-11 | NG+ opener | B4.1 | 44 s | yes | CS-01 without the ambush | as CS-01 plus `sibsRescued = 3` |

Boss intro cards (Goblin King, Ancient Treant, Crystal Colossus, Pharaoh Wraith, Hydra Matriarch, Frost Lich, Citadel Warden, Shadow Queen, Magma Titan) are `bosses.md`'s, on the canon letterbox timeline (ATMOSPHERE §13.1) plus the Brief's push-in.

**Adjustments from `cutscenes.md` (2026-09-07 consistency pass).** Three, all of them that file's to make: CS-11 lands at **44 s**, not 40 — its eight captions set a 27 s floor on their own and the shot list needs the rest (`cutscenes.md` §2.12). CS-03's `onEnd` also sets **`world.clock.p = 0.70`**, above: the meteor falls at the first dusk and night has fallen by the time the player has control back, so the clock must say so rather than drift back to afternoon. And the two announces in the beat list above — `A strange light glows in the distance...` (CS-03, §7.1) and `A mysterious portal appears...` (CS-07, §6.2) — now fire **on skip as well as on end**, because `cutscenes.md` moved each into its owning shot's `onEnd`. A kid who skips still learns what happened.

---

## 3. What preserves the magic

**Recipe by recipe (ATMOSPHERE_RECIPES section numbers).**

| Recipe | Kept, translated, or replaced | Where in the story, and why the feeling survives |
|---|---|---|
| §19.3 / §11 the biplane as a character | kept, then extended | Ed's plane is now the thing the whole second act is about. The sputter, the bank lag and the stall-drop are not decoration: they are the *hopping* plane, and they go away one part at a time as the kids fix her. The choreography table (intervals, 100 px/s → 12 m/s, altitude, 40 % supply) ports to the flyovers from C4 on. The player feels the plane get better because they made it better. |
| §11.5 the crash | replaced by CS-01 | the spiral (4 rad/s corkscrew, 40 px amplitude), the smoke, the 15-piece debris burst and `snd('boom')` are the shot list's values. The "never interrupts anything" rule becomes the cutscene arming rule for CS-03 and CS-06. |
| §19.2 simultaneous layering | kept on every island | each island's five-plus layers are `world-events-weather.md`'s; the story adds the shard on the sky dome as one more permanent layer that changes with the act. |
| §19.1 the dungeon light compositor and shared torch oscillator | translated | the caves, the Witch's Lanterns path and Home, Wrong all run on "only carried and placed light reveals": the Bog's lantern posts are the torch oscillator with legs. In Home, Wrong the one warm far light is a single oscillator every player will read as the camp fire. |
| §15.4 the crater's wrong rhythm | kept exactly | 8 s pulse, upward motes, teal core; it is the story's clock from B1.5 to B3.6, and CS-06 plays Gran's line over its pulse. |
| §15.3 the portal | kept | three incomplete arcs, violet, at the crater's centre in CS-07. |
| §15.5 the Citadel's palette descent | kept as Home, Wrong's three regions | violet → violet → red, darker each floor; the last floor is the family camp gone black with ember windows, which is the descent's destination made literal. |
| §13.1 letterbox and the shaking still frame | kept | every boss card; the Goblin King's card at B1.10 has Isabella's line under it. |
| §2 day/night with the hard cut to night | kept | CS-03 is armed on the dusk phase; the crash in CS-01 ends at the night cut. |
| §3 aurora, night and Frozen only | kept | the Observatory's aurora-powered mechanism (`dungeons.md`) is why the aurora matters to the story: Ed's "star charts" and the "tower to the east". |
| §12 parachute crates | kept from C4, better from `betterDrops` | `📦 Supply crates incoming!` on every island. |

**Family threads that survive, and where a kid will recognise v27.** The three cages and `👥 Siblings: 0/3`; `RESCUE!`; `Find and rescue your siblings!`; the Kid Snatch with the same cage lines at the same timings; the propeller, the rudder and the Sparky-Thingy in that order; `The Green Meanie lives again!`; the six greetings, now one at a time; Gran's line at the crater; `Collette's Secret Hideout →` as an actual hollow log with a rug in it; `L + N were here` on the biggest oak; `Isabella was here first!!!` on the crater rim, because she was; `Is this from Grambi??`; every `Tip:`; the meteor's `What is that...?`; `Welcome to the Shadow Realm...`; `KIDNAP PHASE - Protect your siblings!`; `The Stewart Squad saved the realm!`. What is new is only the order and the ground under it.

**Why "Lights in the Dark" is now the title of the finale and not just the story.** The camp at C6 is the brightest place in the game. Home, Wrong is that exact place with every light put out except one, far away, that the kids cannot reach and that never goes out. The kids carry the only light in the level. The Queen's clones are their own shadows. The ending is the fire relit with all four of them at it. None of that needs a line of new dialogue.

---

## 4. Build notes for implementers

**Where it lands (Brief §7.3).**

| Piece | Folder | Shape |
|---|---|---|
| Canon text | `src/content/canon/` | one module per FAMILY_CANON section, strings verbatim, keyed exactly as v27 (`DIALOGUE.grandpaEd.crater_hint` added; `HERO_REACTIONS.LIAM.sibling` etc. unchanged); a generated `canon-index.json` listing every key for the orphan test |
| Beats | `src/content/story/beats.ts` | the §2.1 table as data: `{ id, act, trigger: FlagExpr, form, present: HeroMask, delivers: CanonRef[] }` |
| Flags | `src/sim/story/flags.ts`, `src/engine/save/schema.ts` | §2.6 as a typed record; `FlagExpr` is a tiny AND/OR/NOT tree over flag names so triggers are data, not code |
| Story director | `src/sim/story/director.ts` | evaluates beat triggers each fixed step, fires at most one beat per step, owns `reactionsFired`, the greeting rotation, the crater timers, the shard scale |
| Quests | `src/content/quests/defs.ts`, `src/sim/quests/` | §2.4; reward functions as named effects on a stats layer, not in-place mutation (Part 1 §29 respec bug) |
| Islands | `src/world/islands/{forest,cave,frozen,swamp,desert,shadow,volcanic}/layout.ts` | §2.2 landmark tables as data; scatter seeded from the save's `noiseSeed` |
| Travel | `src/world/travel/` | strips, destination card, CS-04 driver, plane state → flight parameters |
| Cutscenes | `src/content/cutscenes/` (`cutscenes.md` owns the shots) | the v27 shot structure (`duration / onStart / draw / onEnd`, skip runs remaining `onEnd`s) is the right shape; keep it |

**Phase by beat (Brief §8).** Phase 2: B0.1 (title stub), B1.1 as a *set* (wreck props, furrow, totems) with CS-01 as a placeholder card until the cinematic camera exists in Phase 4, B1.2–B1.10 complete, Lamplight Landing and Quartz's post (not the caves interior), camp C0–C4, all flags. Phase 3: the caves interior and the Depths lair, Frozen, Swamp, Desert, Ed's chain, travel, CS-04, supply runs, camp C5–C6, the Bog Witch and Sand Nomad, world events on every island. Phase 4: CS-01 proper, CS-03, CS-05–CS-11, the crater's post-meteor states, the portal, Home, Wrong, the Queen, the ending, the rift, NG+, tips rotation, memory collectibles.

**Build order inside Phase 2:** flags and director → tutorial steps → cages and camp stages → Elm's chain → the Hollow Grove hook → the Goblin King trigger → greetings rotation. The director and flags come first because every other agent's work hangs on them.

**Tests (Vitest, `tests/unit/story/`).** (1) `flags.walk.test.ts`: walks every branch listed in §2.6, asserts the invariant. (2) `quests.prereq.test.ts`: every quest reachable from a new game by some path; none reachable before its island unlock. (3) `canon.orphans.test.ts`: every key in `canon-index.json` is referenced by at least one beat, quest, boss, tutorial step, tip rotation, or a named later-file owner list; fails on any new orphan. (4) `escort.test.ts`: the frog reaches the jetty in a headless run with lit posts; dies with unlit posts; the retry resets the quest. (5) `greetings.test.ts`: rotation order per story state. Smoke (Phase 3): a headless run that lands on every island in the ladder order and asserts the title card and the guide's first line.

**Perf risks and their answers.** Island streaming during CS-04: the destination loads during the climb (first 6 s) behind the cloud layer; if not ready, the circuit shot loops until it is, and the flight is never longer than 30 s. The shard on the sky dome: one mesh under 400 triangles, three emissive quads, no light. The crater: the one place `flatShading: false` is allowed (ATMOSPHERE §15.4 3D note), one teal point light, budgeted in the Forest island's pool. Home, Wrong's far light: a directional fill plus one billboard, zero extra point lights. Party exchanges: text only; no extra draw calls. The Kid Snatch cage, cages at camps A–C: three static meshes, one shared material.

**Things an implementer would otherwise guess.** The compass strip's priority order is v27's (Part 2 §6.7) with the plane inserted after Ed: turn-in → cages → quest items → Ed with an offer → the plane when an unlocked island has an open quest → escort → waypoints → living mini-bosses → uncleared dungeon → the King → the portal → the rift. Dialogue freezes the sim (v27, Part 2 §7.5); cutscenes render but do not simulate (Part 2 §13.1); both rules are kept. Skipping CS-01 still sets camp C1 and `edCrashCount = 1`. A save mid-Home, Wrong writes the Forest-island snapshot exactly as v27's dungeon saves did (Part 1 §28.3), so the finale is always re-entered from the portal.

---

## 5. Cross-references and conflicts

**Depends on.** No earlier design file exists. This file assumes only what the canon paragraph fixes: names, core personalities, Ed and the plane. Two places lean on `heroes.md` by name: the cave light rule ("Collette's magic" lights the caves, Brief §5.3) assumes the magic user is Collette; and the caged-line table is keyed by v27 hero index 0–3, which must stay Liam, Noah, Collette, Isabella. If `heroes.md` moves the magic role, the cave rule follows the magic user, whoever it is; the index order must not change.

**What each later file must pick up from here.**

| File | Takes from this file |
|---|---|
| `npcs.md` | Ed is wherever the plane is (§2.2 approaches); Ed walks to the crater for CS-06; the hangar shout and `crater_hint` lines (§2.7); the greeting rotation (§2.3 rule 4, §2.5); Bog Witch and Sand Nomad definitions (§2.7); Quartz's `the Crystal Sage` subtitle; guide line 1/2/3 delivery rule (§2.5); the plane-state table (§2.3) for the plane's look at each stage |
| `camp.md` | stages C0–C7 and their flags (§2.3); the camp at (0, 0) with Ed's Landing to the east and Crash Meadow beyond (§2.2); `Stewart Camp` and its two card lines (§2.7); C6 is the stage Home, Wrong mirrors, so its prop set is also the shard's |
| `bosses.md` | Goblin King in Act 1 at Crash Meadow, retuned for an Act 1 party, no portal on death; Crystal Colossus and Magma Titan as lair bosses; Hydra Matriarch and Frost Lich are the Bog and Frozen dungeon bosses (canon names in quest text: `Defeat the Hydra Matriarch.`, Neve's Frost Lich tip); Citadel Warden at the citadel door in the Throne of Shadows; Stone Sentinel (Outer Ward) and Phantom Warden (Inner Sanctum) as floor mini-bosses; the shadow squad as the Throne's set piece with the Queen's clones drawn from it; `boss_appear` lines at the Goblin King, Treant and Colossus cards; caged lines at canon timings in each speaker's colour; banished heroes restored on the Queen's death |
| `dungeons.md` | canon proper names on the entry cards, Brief names as districts (§2.2); the Crystal Caves' "only lamps and magic light it" rule; the Witch's Lanterns post mechanic (§2.2 swamp) that the Sunken Temple composes; the Observatory's aurora mechanism as the "tower to the east"; Home, Wrong's three regions, the one far light, and the corrupted hearth arena (§2.2 shard); the Rift and the Depths as lairs, not room dungeons; `dungeon_enter` exchange at the Hollow Grove arch. **Taken (2026-09-07):** all of it. Its §2.6.6 worked out the far light's geometry from the shard's position in §2.2 and got −37° below the ground plane; that number is now written back into §2.2 above, so the two files state one placement |
| `cutscenes.md` | the CS list (§2.10) with lengths, skip rules and flags; the line orders in §2.5; CS-03's scene 1 from the fire with Ed in frame. **Taken (2026-09-07):** all of it, plus every position in §2.2, the arming rules in §2.1 and §3, `Press SPACE to skip` as the keyboard variant, and the dedication slot. Three things came back and are applied above: CS-11 at 44 s, CS-03's `world.clock.p = 0.70`, and the two announces firing on skip; the shard's three lights going out from CS-10 on is the post-game sky rule now in §2.2 |
| `ui-ux.md` | title = camp at C6 with the plane; the seven island cards and two camp cards; `Press SPACE to skip` as the keyboard variant of an input-aware prompt; the destination card; `👥 Siblings: N/3`; the tip rotation gates; the victory flow strings at B3.5; endless strings removed; active quest cap 4 |
| `audio.md` | CS ids and beats as cue anchors; the plane-state table for the engine sound's health; the shard as a night ambient source. **Taken (2026-09-07):** the CS ids became the `cs.*` cue anchors, the plane-state ladder drives the engine's health, and the shard is `amb.shard`, gained by `story.act` (Act 1 .02 night only, Act 2 .04, Act 3 .07); §2.3's camp stages gate `music.camp`'s bells and §2.1's act cards are anchors too |
| `world-events-weather.md` | events on every island with the §2.8 gates; the two optional hooks; aurora Frozen-only; the shard's act-scaled silhouette on the sky dome; dusk as the CS-03 arming phase |
| `enemies.md` | camp populations per island (§2.2); the fire family's home is the Rift; wisps on the unlit lantern stretches; the Kid Snatch summons |

**Conflicts found, and how this file designs around them.**

1. Brief §5.3 names the dungeons The Rootways, The Sunken Pyramid, The Witch's Lanterns, The Hermit's Observatory; canon quest text says `Clear the Hollow Grove dungeon.`, `Clear the Buried Tomb dungeon.`, `Clear the Ice Citadel dungeon.` and names the Sunken Temple. Resolved: canon names are the dungeons, Brief names are the districts that hold them. Both appear on screen.
2. Brief §5.3 says to design a Bog and a Frozen boss "if none is resolved". Canon resolves both (Hydra Matriarch, Frost Lich) through quest text and guide lines. `bosses.md` keeps them.
3. Brief §8 lists "Ed's crash" under Phase 3. The crash *event* is the Phase 2 opening (as a set and a placeholder card); the biplane *system* stays Phase 3. Both phase lists in §4 reflect this.
4. Brief §1 counts four biomes and five dungeons; canon has cave and volcanic dungeons with bosses, an achievement (`Forged in Fire`) and Ed's chain depending on the Crystal Depths. Resolved: the caves are the Forest island's under-region, the Depths and the Rift are lairs. No canon string is dropped and the five-dungeon rule holds.
5. `CONTROL_MODEL` §7.3 records banishment as permanent. This file restores banished heroes on the Queen's death (§2.9). Logged in §6; `bosses.md` and `systems-engineer` follow this file.
6. Part 2 §6.6 triggers the meteor on the first dungeon clear; this file moves it to the first dusk after the Goblin King (§2.3). The canon lines and flags are unchanged.

---

## 6. Decisions logged

- 2026-09-06 · phase-0.5/story-beats · The opening is Ed's crash with all four kids aboard; the goblins take three that night; Liam wakes at dawn with the tutorial · every `crash_landing` line (Ed's four, the kids' four) finally fires, and the caged siblings get a reason · rejected: v27's unexplained cages; the kids living at camp while Ed crashes in visiting (loses the "crash-site opening" the Brief asks for).
- 2026-09-06 · phase-0.5/story-beats · Three acts: Crash site (Forest), Ground-Ed (the sky), Lights in the dark (the shard) · v27 had no act structure; the Brief's phases map onto these one-to-one · rejected: an open world with v27's condition-based triggers.
- 2026-09-06 · phase-0.5/story-beats · The Goblin King is the Act 1 climax at Crash Meadow and does not spawn the portal · Brief §8 puts the Kid Snatch in Phase 2; the King took the kids in the opening, so he comes back for them · rejected: after all dungeons (v27).
- 2026-09-06 · phase-0.5/story-beats · The biplane is repaired in stages that unlock islands one at a time: hop (whittled propeller) → Frozen; propeller → Swamp; rudder → Desert; spark plug → full range, supply runs, aerobatics · each part does what a real part does, each island gets an arrival, and the plane's feel improves with the kids' work · rejected: all islands at the hangar; a second aircraft; islands reachable on foot.
- 2026-09-06 · phase-0.5/story-beats · The Crystal Caves are the Forest island's under-region and the Crystal Depths is a lair, not a room dungeon · canon text (`forest_2`, `cave_*`, `ground_ed_3`, Quartz, Colossus) needs the caves to exist; the Brief fixes five dungeons · rejected: a fifth destination island; cutting the caves.
- 2026-09-06 · phase-0.5/story-beats · The Volcanic Rift is a post-game lair under the crater; the Magma Titan is what fell "a long time ago" (never stated in text) · keeps `Forged in Fire`, `Emberforge Heart` and every Titan line; gives the crater's oldest line a payoff · rejected: a desert volcano; cutting the Titan.
- 2026-09-06 · phase-0.5/story-beats · The Shadow Citadel is folded into Home, Wrong: its three canon floors are the shard's regions, the Warden guards the citadel the cabin has become, the Queen is the last fight, legendaries award on the finale · one finale, every string delivered, no post-game tower · rejected: v27's separate post-game citadel; cutting the Warden.
- 2026-09-06 · phase-0.5/story-beats · The meteor falls at the first dusk after the Goblin King, at the camp fire, with Ed in frame · same scenes, lines and flags; lands after the family is whole and lets Ed's crater lines follow naturally · rejected: first dungeon clear (v27).
- 2026-09-06 · phase-0.5/story-beats · The crater is on the Forest island's NE cliff, with Isabella's cage at its approach and `Isabella was here first!!!` on its rim · guarantees the pre-meteor discovery, the `crater` lines, and puts the portal, the rift and the mirror crater on home ground · rejected: v27's far corner on another island.
- 2026-09-06 · phase-0.5/story-beats · The portal opens after all four island dungeons and Ed's `crater_awareness`; the Shadow Realm is entered only by the portal; Ed waits at the fire and his fire is the one far light in Home, Wrong · rejected: flying to the shard; Ed in the finale.
- 2026-09-06 · phase-0.5/story-beats · Hero reactions are party lines fired once per hero per context, in fixed orders; Ed's greetings rotate one per talk from a story-aware index · v27 played one reaction from the active hero and all six greetings every time · rejected: v27 behaviour; random pick.
- 2026-09-06 · phase-0.5/story-beats · The nine unfired reaction contexts get fixed triggers (§2.5): `dungeon_enter` at the Hollow Grove arch, `boss_appear` at the Goblin King / Treant / Colossus cards, `sibling` on Collette's rescue, `following_collette` on Isabella's, `swamp_item` on the frog and the rudder, `mid_boss` at the first mini-boss popup, `victory` on the King's death, `snack_reward` on the Ed-ibles · rejected: leaving them orphaned.
- 2026-09-06 · phase-0.5/story-beats · `crater_hint` is written (three lines), the Bog Witch and the Sand Nomad are defined (four and three lines), Quartz carries the subtitle `the Crystal Sage`; all marked new · closes FAMILY_CANON §13.2 with the minimum text · rejected: renaming Quartz; making Fern the escort's origin.
- 2026-09-06 · phase-0.5/story-beats · Canon dungeon names stay the dungeon names; the Brief's names become districts · quest text names the canon dungeons · rejected: renaming (would make `Clear the Hollow Grove dungeon.` point at a place called The Rootways).
- 2026-09-06 · phase-0.5/story-beats · Endless mode is cut · a ring-spawn wave arena does not fit an authored island; NG+, bounties and the Rift carry replay; its strings are mode UI · rejected: keeping it as a camp activity.
- 2026-09-06 · phase-0.5/story-beats · The random crash event and pre-Ed stranger flyovers are cut; flyovers resume at C4 as Ed's test hops · the crash is the opening · rejected: a second random crash.
- 2026-09-06 · phase-0.5/story-beats · Banished heroes return when the Shadow Queen dies · the ending needs all four at the fire; the in-fight threat is unchanged · rejected: permanent banishment (v27).
- 2026-09-06 · phase-0.5/story-beats · Active quest cap 4 (was 3); `desert_1` counts all five world events; `ground_ed_3` never dead-ends; `Untouchable` and `Storm Chaser` become completable · v27 bugs fixed as intent · rejected: porting the bugs.
- 2026-09-06 · phase-0.5/story-beats · Tips 9–11 enter the title rotation after the meteor and tip 12 after the crater dialogue · keeps the spoilers for when they mean something · rejected: random from the start (v27).
- 2026-09-06 · phase-0.5/story-beats · The shard is visible at night from Act 1 and drifts nearer each act (one sky-dome mesh scaled by `story.act`) · the story's clock for the price of one mesh · rejected: hidden until the portal.
- 2026-09-06 · phase-0.5/story-beats · The camp is `Stewart Camp`; eight growth stages C0–C7 keyed to story flags · the reference's "Fernwood" is a style, not this family's place · rejected: "Fernwood".
- 2026-09-06 · phase-0.5/story-beats · `storyFlags.edSpaceHints` dropped; all flags reset on new game and NG+ · never read; v27 leaked three flags across restarts · rejected: keeping it for fidelity.
- 2026-09-06 · phase-0.5/story-beats · Ed is wherever the plane is; turn-ins happen at the plane; supply runs loop the current island · removes fly-home-to-turn-in tedium and keeps the plane in one place · rejected: Ed fixed at camp.
- 2026-09-07 · phase-0.5/story-beats · Four adjustments from the files that shot these beats: CS-11 is 44 s not 40, CS-03's `onEnd` also sets `world.clock.p = 0.70`, the `A strange light glows in the distance...` and `A mysterious portal appears...` announces fire on skip as well as on end (§2.10), the shard's three emissive lights go out from CS-10 on and stay out through the post-game with NG+ resetting them (§2.2), and the far light is placed at −37° below the ground plane under the shard's south rim rather than "on the horizon" (§2.2) · `cutscenes.md` owns the shots and `dungeons.md` owns the shard's geometry, and both worked from this file's own positions and lengths; a horizon glow would never be in frame at the 45–55° gameplay pitch · rejected: none.

---

## 7. Reconcile when the brainstorm doc lands

- The brainstorm doc's resolved story spine: if it fixes an order for the Goblin King, the meteor or the portal that differs from §2.3, its order wins only with a new §6 line explaining what this file's ordering loses.
- Whether it resolves the Bog and Frozen bosses as something other than the Hydra Matriarch and the Frost Lich (canon text argues they stay).
- Whether it already decided the fate of the Shadow Citadel, the Volcanic Rift and Endless mode; §2.9 assumes it did not.
- What "crash-site opening" meant to its author: this file reads it as Ed's crash with the family aboard.
- Whether the meteor was meant to have an explanation. This file keeps tips 9 and 10 true and leaves it unexplained.
- Any resolved decision on the camp's name.

## 8. Open questions for the orchestrator

- One optional line, Andrew's to write, not mine (Brief §2(b): it would speak as a real family member): a dedication under the ending card, in the voice of "Dad". FAMILY_CANON §13.5 confirms none exists in v27. The ending ships without it; if Andrew supplies one, `cutscenes.md` places it under the tagline in CS-10 and it is marked new. Nothing else in this file is blocked.
