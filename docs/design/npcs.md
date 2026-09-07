# NPCs and Grandpa Ed — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** `docs/BRIEF.md` in full (§2, §4.1–4.7, §5.1–5.2, §6, §7.4, §8) · `ATMOSPHERE_RECIPES.md` §19, §11.1–11.6, §12.1–12.4, §9.2 (crate dust), §10 · `SYSTEMS_INVENTORY.md` Part 2 §7.1–7.7, §8.1–8.7, §6.4, §3.3, §21 #1–2; Part 1 §24.1, §25.1–25.2 · `FAMILY_CANON.md` §1.2–1.5, §2.1–2.2, §3.1–3.6, §4.1–4.2, §5.1–5.5, §9 (Ed's four achievements), §10.1, §11.8, §12.3, §13.1–13.5 · `AUDIO_INVENTORY.md` §12, §15 · `CONTROL_MODEL.md` §3, §9 · `docs/DECISIONS.md` in full · legacy HTML L634, L713–715, L727, L809, L8277, L8351–8353, L8455–8463, L9309, L1659–1683 (grep-verified) · **Depends on:** `heroes.md` (§2.0, §2.1.3, §2.3.2, §2.4.6, §2.5.1, §2.5.11, §2.7.3, §5), `story-beats.md` (§2.1–2.10, §5), `world-events-weather.md` (§2.0, §2.2.2, §2.5.1–2.5.3, §2.6, §2.7.3, §2.8.2, §5.2), `enemies.md` (§2.1, §2.2, §2.8, §2.9, §5) · **Feeds:** `camp.md`, `cutscenes.md`, `ui-ux.md`, `audio.md`, `dungeons.md`, `bosses.md`
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

Grandpa Ed becomes a person you can walk up to, and The Green Meanie becomes a character with a body: a Cub-yellow biplane that is visibly broken, then visibly mended one part at a time, and that carries the family island to island. The five guides, the merchant, the Bog Witch, the Sand Nomad and the frog each get one silhouette, one prop, two motion sources and a place to stand; every canon line they own finally has a trigger.

---

## 1. What v27 does

Compact account; the teardown is the record. Cite: SYSTEMS_INVENTORY (SI), FAMILY_CANON (FC), ATMOSPHERE_RECIPES (AR), CONTROL_MODEL (CM), AUDIO_INVENTORY (AI).

### 1.1 Grandpa Ed and the biplane

- **Ed the NPC** (SI Part 2 §8.2, FC §1.2). `FAMILY_NPC_DEFS.grandpaEd` = `{nm:'Grandpa Ed', col:'#228B22', dk:'#165B16', icon:'✈️', dialogueKey:'grandpaEd', questGroup:'ground_ed', portrait:'ed'}`; the table is never read, `spawnEd()` hard-codes the same values at `ED_LANDING` = `(WW×0.35, WH×0.35)` (L8277). Drawn as a green ellipse body, a green circle head, brown `#7A4018` goggle rings with a strap, white eyes with green pupils, a smile arc, and a `#1a5c1a` ground scarf swaying `sin(gt·2 + npc.x)·3` (AR §11.4). Interaction range 70 px; Ed takes priority over every other interactable (SI Part 2 §8.7). `despawnEd()` is never called.
- **The plane** (AR §11.3). A 60 px sprite at 1.4×: amber fuselage `#E8A838`, forest-green wings `#2D8C56`, red tailplane and fin `#D84830`, cowling `#8B6914`, struts `#8B4513`, a blurred propeller disc that becomes a **static blade** on sputter. Mirrored when flying left so Ed is never upside-down. Ground shadow 44.8 × 8 px at `alpha = max(0.03, 0.12 − alt·0.0005)`: the shadow's opacity alone communicates altitude.
- **Four motion sources** (AR §11.1, §19.3): course wander every `rnd(2.5,5)` s by ±0.6 rad, steering rate-limited to 1.2 rad/s; the drawn heading chases the velocity heading at 3.5/s; bank `turnRate` lerps toward `steerDiff × 2.5` at 4/s (the plane banks before it turns and levels after); a 2 rad/s wobble; an engine sputter every 2.5 s that stops the propeller and drops the plane 3 px for 0.15 s. Smoke trail 40 %/frame, life 1.5 decaying at half rate (3 s real), `#b4b4b4`.
- **Choreography** (SI Part 2 §8.4–8.5, AR §11.1). First flyover at 20 s (15 from a save); intervals `25 + rnd(0,15)` for flyovers 1–2, `35 + rnd(0,20)` for 3–5, `50 + rnd(0,25)` after; entry from a random camera edge 80 px off-screen at altitude 150; 100 px/s; 40 % `supply` / 60 % `flyover`; announces `✈️ Supply drop inbound!` / `✈️ A biplane flies overhead!` in `#E8A838`; `biplaneSeen++` per launch, `Frequent Flyer` at 10.
- **Aerobatics** (AR §11.2): first trick at `rnd(4,8)` s then `rnd(7,15)`; 50/50 barrel roll (1.0 s) or loop (1.8 s), ease-in-out quadratic, direction ±1; the loop fakes 3D with `scaleY = cos(angle)` and an alpha dip.
- **The scarf** (AR §11.4): two chained quadratic curves, seven incommensurate frequencies (3, 3.5, 3.8, 4, 4.2, 4.5, 5 rad/s), 1–3 px amplitudes, 14 px long, tapering `#D84830` → `#A83828`. "The scarf is the only part of Ed visible in the plane besides his goggles; it is his silhouette."
- **The crash** (AR §11.5, SI Part 2 §8.4): armed at `90 + rnd(0,30)` s if Ed is unmet; fires on the next flyover if nothing else is happening; at `pathProg > 0.4` the plane homes on `ED_LANDING` at `max(200, d×1.5)` px/s with a `sin(crashT·4)·40` perpendicular corkscrew, descending 25 px/s, heading chase 5/s, bank + `sin(crashT·4)·0.5`; touchdown at `d < 30` or `alt ≤ 0`: `shk.i = 8, t = 0.5`, 15 debris `#8B4513`/`#654321`/`#a0522d` with `grav 200`, `snd('boom', 0.3)`, `spawnEd()`, `Grandpa Ed has crash-landed!` (`#228B22`, 3 s), `edFlightCooldown = 999`.
- **Supply runs** (AR §11.6): after `edQuestComplete`, every `120 + rnd(0,60)` s: `Ed: "Time for a supply run!"`, Ed walks at 80 px/s along a straight line pushed 20 px off any tree or rock, is hidden on takeoff, climbs 2.5 s at 60 px/s to 150, flies a normal supply run, despawns off-screen, and a 2 s `#E8A838` lozenge "lands" with `Ed's back from his supply run!`.
- **Parachute crates** (AR §12, SI Part 2 §8.6): `supply` at `pathProg > 0.2` drops `floor(rnd(3,8))` crates (`floor(rnd(6,11))` with `betterDrops`) staggered `i×0.7 + rnd(0,0.2)` s with `📦 Supply crates incoming!`; `flyover` silently drops `floor(rnd(3,6))` at `pathProg > 0.35`. Each crate inherits 30 % of the plane's velocity, free-falls 0.35 s at 350 px/s², inflates a canopy over 0.36 s, eases to `18 + 15·(1 − chuteSize²)` px/s, drifts `rnd(−5,5)` px/s (`rnd(−20,20)` in storm or sand), spins then un-spins, lands with three decaying hops and 6 dust particles, glows and pulses for 45 s, and pays 60 % heal (30 %, or 60 % with `betterDrops`) or 40 % gold (`rnd(20,40)` / `rnd(40,80)`) within 45 px.
- **`edInteract()`** (SI Part 2 §8.7), first match wins: turn-in (`phaseN_return`, rewards, `+XP` particles, `edQuestPhase = N+1`, phase 3 adds `quest_complete` + `space_hint`, `The Green Meanie lives again!`, `Well-Ed-ucated`, auto-offer of the next quest) → offer (`phaseN_intro` + `quest_intro`, `edQuestPhase = N`) → `crater_awareness` + `ed_crater` → `crater_hint` (**a missing key, silent**) → `post_quest` + `space_hint` → `greetings` + `quest_intro`. Rewards (L713–715, verified): +100 gold and `edGoggles = true`; +100 gold and `edEdibles = 3`; +150 gold, `edQuestComplete`, `betterDrops`. Quest XP is added straight to `totalXP`, bypassing `addXP` and its level-up check. `edGoggles` and `edEdibles` are cosmetic save fields; nothing consumes them.
- **Audio** (AI §15): the biplane is **silent**. No engine, no sputter sound, no doppler. Crates: `equip` at 0.15 on landing and 0.3 on pickup; the crash is `boom` at 0.3.

### 1.2 Dialogue machinery (SI Part 2 §7)

One speaker exists in `DIALOGUE`: `grandpaEd`, 37 canon lines in ten categories, every line tagged with a mood from a 24-word vocabulary (`happy, wink, smirk, wistful, dreamy, nervous, cheerful, sheepish, thinking, serious, worried, relieved, excited, annoyed, overjoyed, triumphant, proud, puzzled, hopeful, resigned, secretive, curious, stunned, distracted`). `openDialogue` queues the whole category in array order (greetings play all six every time), then appends one reaction from the **active hero only** in `HDEFS[i].col` with no portrait. Advance: first press completes the line, second advances; the typewriter runs two characters per frame; `update()` returns immediately while `dialogueActive`, so the **entire sim is frozen**, biplane included (CM §9). The box is a dark panel with an `#E8A838` border, a portrait circle, and a pulsing `▶`. `drawPortrait` implements exactly one portrait (`'ed'`: a green circle with goggles and a swaying scarf); only `happy` and `wink` change anything (two cheek strokes), and the box always calls it with `'happy'`, so **mood is dead at runtime** although every line carries one.

### 1.3 The guides, the merchant, the escort, the waypoints

- **`NPC_DEFS`** (SI Part 2 §8.1, FC §1.5): five guides, one per biome, each `{nm, biome, col, dk, icon, dlg[3]}`: Rootkeeper Elm `#58B888`/`#2E7A58` 🌳, Lamplighter Quartz `#8E98D8`/`#5868A8` 🔮, Dunewalker Sol `#E8A860`/`#987040` 🏜️, Mistweaver Fern `#70C090`/`#386848` 🧪, Hearthkeeper Neve `#A8D0E8`/`#5878A0` ❄️. Placed by 80 random tries in their biome, 200 px clear of dungeons, spawners and cages (SI Part 2 §3.3); if all tries fail the NPC is simply absent. Drawn as a body ellipse, a head, an accent ring, a bobbing emoji, the name, a quest glyph (`✓` green, `!` gold, `...` grey) and a speech bubble within 120 px. Proximity 60 px from **any** unlocked living hero sets `visited`, fires `talk_to`, and shows a bubble for 5 s. `dlgIdx` is reset to 0 on first visit and never incremented, so each guide shows only line 1 forever (SI Part 2 §7.4, §21 #21).
- **Quest bubbles** (FC §4.2): `✅ <title> — Complete! Press SPACE to turn in.`, `❗ <title>: <desc> [SPACE to accept]`, `… <title>: <progress>/<target> — <hint>`, and three all-done lines picked at random.
- **The merchant** (SI Part 1 §25.1): appears once `teamLv ≥ 3` anywhere in the world with `A mysterious merchant has appeared!` (`#E8A838`, 3 s), relocates every `rnd(30,60)` s, stocks 4 of 8 items, never restocks, sells out (`Merchant sold out!`). Drawn in `#E8A838` and `#d4a03c` (L1659–1683). The Shield Potion's buff is never read: it does nothing. `Big Spender` counts buys.
- **The escort** (SI Part 2 §6.4, L8351–8353, L8455–8463): `spawnEscortNPC` searches for an NPC named `'Bog Witch'`, which does not exist, so the frog never spawns (SI Part 2 §21 #1). Had it: `{hp: 50 + teamLv×5, spd: 40, sz: 8}`, walks straight at a point `rnd(300,500)` px away, un-sticks itself by `rnd(−20,20)` after 5 s still, takes `en.dmg × 0.3` from enemies within 80 px at 1 % per frame each; arrival within 30 px announces `🐸 Familiar arrived safely!` (`#3DCC7A`, 3 s); death announces `🐸 Familiar died! Talk to Bog Witch to retry.` (`#D84830`, 4 s) and resets `swamp_2` to `available`.
- **Waypoints**: `spawnQuestWaypoints` looks for a `'Sand Nomad'` who does not exist and falls back to fixed coordinates (SI Part 2 §21 #2). `forest_2` says `Talk to the Crystal Sage` and targets `Lamplighter Quartz` (FC §13.2).

### 1.4 Gran / Grambi (FC §1.3)

Never an entity. Six references: tip 12 `Tip: Gran always said the sky had more in it than stars.`; Ed's `crater_awareness` lines 2–4 (Gran's stories; `'Eddie, the sky has more in it than stars. And some of it is watching.'`, which also fixes Ed's given name as Eddie; `Everyone thought she was telling fairy tales.`); Noah's `ed_crater` `Wait — Gran knew about THIS? How long has this been going on?`; Isabella's `snack_reward` `Is this from Grambi?? It better be from Grambi.`

### 1.5 Oddities that change this design

| Oddity | Consequence |
|---|---|
| `crash_landing` (Ed ×4, kids ×4) never opens; `crater_hint` is called but unwritten (FC §13.1–13.2) | CS-01 delivers the crash lines (story-beats B1.1); `crater_hint` is story-beats §2.7's three new lines, delivered by the handler in §2.5 |
| Greetings play all six every time; guides never advance past line 1 | Story-aware rotation for Ed (§2.1.8); the three-line rule for guides (§2.6.1) |
| Only the active hero reacts | Party lines in fixed order (story-beats §2.3 rule 1; §2.11 here) |
| Mood tags are dead; one portrait exists | A real portrait set rendered from the rigs, Ed's 24 moods mapped to 8 frames (§2.1.7) |
| `Bog Witch` and `Sand Nomad` do not exist | Defined in story-beats §2.7; bodies, posts and behaviour in §2.8 |
| The frog cannot spawn; the escort walks a straight line and un-sticks by teleport | A lit-post escort with companion steering and a fade relocation (§2.9) |
| The plane is silent; the crash is a random event; flyovers precede Ed | Engine sound hooks per state (§2.2.7); the crash is CS-01 only (story-beats §2.9); flyovers resume at C4 |
| 100 px/s and altitude 150 px convert to 2.5 m/s and 3.75 m | Design values (§2.2.4), logged |
| Quest XP bypasses `addXP` | Ported through `addXP` (§2.5) |
| `edGoggles` and `edEdibles` do nothing | Goggles the kids wear in flight; three Ed-ible snacks (§2.5) |
| The Shield Potion does nothing; the merchant never restocks | Both fixed as intent (§2.7) |
| `ED_LANDING` is one point; Ed never moves except to walk to the plane | Ed is wherever the plane is; a spot table and a relocation rule (§2.1.6) |
| The wreck sprite and the lozenge landing | A real wreck prop and a real bounce landing (§2.2.2, §2.3.4) |

---
## 2. What it becomes

### 2.0 Conventions, the roster, and the plane states

**Scale.** 40 px = 1 m (`heroes.md` §2.5.1). Every v27 distance below is converted at 0.025 m/px; where a design value replaces the strict conversion the row says so and §6 has a line. Island positions are `story-beats.md` §2.2's island-local metres (`+x` east, `+z` south, origin at the hub).

**Camera.** Elevated orbit, pitch 45–55°, about 20 m from the hero; a hero is one-eighth of screen height. Two consequences drive this file: an NPC must read as a black silhouette at that size, and **anything airborne is only in frame when it is low and close**, because a 45–55° camera never sees the sky (the far horizon appears only where the curved-world shader rolls the rim into view). Every plane behaviour below is designed for that fact (§2.2.8).

**Tokens.** Named `npc.<who>.<part>`, `plane.<part>`, `crate.<part>`, `beam.<state>`; Brief §4.2 hexes are the roots. Each NPC carries a `ui` token: the colour of its name plate, portrait ring, marker base ring and announces. For Ed and the five guides the `ui` token is the v27 `col` verbatim, so a kid who remembers "green Grandpa" or "the blue lamplighter" still finds them; bodies follow the hue rule below.

**The hue rule** (`heroes.md` §2.1.3): no NPC body colour within 20° of hue *and* 15 % of lightness of a hero base (Liam `#2A62CF` 220° / 49 %, Noah `#EE7F24` 27° / 54 %, Collette `#9D4FD8` 274° / 58 %, Isabella `#D6294E` 347° / 50 %). "Body" means any token covering 25 % or more of the figure; a token at 15 % or less is an accent and may be any hue, as `enemies.md` §2.2 already allows for emissive accents. Every NPC base and dark below passes; the check is in §2.6.1.

**Signals read.** `world.clock.p`, `world.weather.type`, `world.vis.radius` (`world-events-weather.md` §2.0); `story.*`, `world.planeState`, `world.currentIsland`, `camp.stage` (`story-beats.md` §2.6); `events.reserve(slot, seconds)` (`world-events-weather.md` §2.5.1).

#### The roster

| Name | Island and position (m) | Role | Height | base / dark / accent (`ui`) | The one prop | Marker base ring | Portrait frames | Canon lines |
|---|---|---|---|---|---|---|---|---|
| **Grandpa Ed** | wherever the plane is (§2.1.6); Forest strip mark (20, −2.2); the crater rim (111, −111) for CS-06; the campfire from `portalOpen` | family, pilot, quest-giver | 1.78 m (1.74 stooped) | `#8B5A2B` / `#3B2A1A` / scarf `#D84830`→`#A83828`, sweater `#228B22` (`ui` `#228B22`) | cap-and-goggles on the brow; a 0.35 m wrench in the right hand at the plane | `#228B22` | 8 (24 moods mapped) | 37 canon + 6 new (2 hangar, 3 `crater_hint`, 1 weather) |
| **The Green Meanie** | parked at each island's strip mark (§2.3.1) | the travel system, a character | 6.0 m long, 7.2 m span, 2.5 m tall | `#F4D21E` / `#B89A12` / wings `#2D8C56`, fin `#D84830`, rudder `#228B22` | the propeller (whittled pine, then steel) | none; the plane is the marker | none | 0 (its name is painted on: canon text) |
| **Rootkeeper Elm** | Forest, the Rootways gate (120, 10) | guide, forest chain | 1.95 m | `#5E4224` / `#3B2A16` / `#58B888` (`ui` `#58B888`) | root-staff 2.2 m with three mint leaf-buds | `#58B888` | 3 | 3 |
| **Lamplighter Quartz** · *the Crystal Sage* | Forest, Lamplight Landing (0, 125); cave frame (0, 0) | guide, cave chain | 1.45 m (hunched) | `#4A4470` / `#2C2846` / `#8E98D8` (`ui` `#8E98D8`) | pole-lamp 2.6 m, flame `#FFB347` (the tallest prop in the game) | `#8E98D8` | 3 | 3 |
| **Hearthkeeper Neve** | Frozen, the Hearth, her hut door (0, 0) | guide, frozen chain | 1.60 m (round) | `#1B2A5A` / `#0E1838` / fur `#F2F7FF`, frost `#A8D0E8` (`ui` `#A8D0E8`) | iron hearth-pot with embers `#FF9A3C` | `#A8D0E8` | 3 | 3 |
| **Mistweaver Fern** | Swamp, the Long Causeway jetty end (0, 0) | guide, swamp chain | 1.55 m (hunched) | `#7FA68F` / `#4A3524` / `#70C090`, lantern `#FFB347` (`ui` `#70C090`) | hooked staff 1.9 m with a hanging amber lantern | `#70C090` | 3 | 3 |
| **Dunewalker Sol** | Desert, the Oasis shade (0, 0); paces a 4 m line | guide, desert chain | 1.85 m (thin) | `#EDE3CF` / `#4A2C6B` / `#1FA3A0` (`ui` `#E8A860`) | walking staff 2.0 m with a gourd and a streaming cloth strip | `#E8A860` | 3 | 3 |
| **Merchant** | Stewart Camp stall from C2 (`camp.md` places it); every hub while the squad is there | trade | 1.70 m | `#2A1A33` / `#120A1F` / wares `#2EB8A6`, `#E8A838`, `#3DCC7A` (`ui` `#E8A838`) | the pack-stall on his back (walks with it; sets it down) | violet beam `#A57BE8` | none (no dialogue) | 0 canon lines; 11 UI strings verbatim |
| **Bog Witch** | Swamp, the hut on stilts (−90, 70) | the escort's origin and retry point | 1.50 m (crooked) | `#4A2560` / `#2A1438` / `#7B3CA0` hat band (`ui` `#7B3CA0`) | a 1.6 m broom; a tall bent hat | `#7B3CA0` | 3 | 0 canon; 4 new (story-beats §2.7) |
| **Sand Nomad** | Desert, his camp (80, −40), seated | anchors `desert_2` | 1.80 m (1.10 seated) | `#EDE3CF` / `#4A3524` cloak / `#B3541E` wrap and sash (`ui` `#EDE3CF`) | the camel (2.1 m at the hump, dun-grey `#8E8A80`) tethered 3 m away | `#EDE3CF` | 3 | 0 canon; 3 new |
| **🐸 Familiar** (the frog) | Swamp, spawns at the Witch's hut; lives at Fern's jetty after `swamp_2` | escort | 0.40 m long, 0.22 m tall | `#3C8A5C` / `#2A5C3E` / throat `#6CE87A` emissive | none; the glow is the prop | its own light and label | none | 0 spoken; 3 canon strings about it |
| **Gran / Grambi** | never appears | referenced only | — | — | — | — | — | 0 spoken; 6 references (§2.10) |

Read at distance, in one line each: Ed is a tall stooped figure with a wide pale collar, two discs on the brow and a red streak that never stops moving. The Green Meanie is a yellow cross with green bars. Elm is a bark column under a leaf disc. Quartz is a short shape under a very tall lamp. Neve is a dark round bundle with a warm glow at its middle and breath fog. Fern is a hunched fringe with a swinging lantern. Sol is a pale line under a flat disc that never stops walking. The merchant is a dark hood under a violet beam with glints. The Witch is a bent hat and a broom on a porch. The Nomad is a seated shape beside a camel. The frog is a green pulse in the dark.

#### The plane states (`world.planeState`, `story-beats.md` §2.3)

| State | Set when | Propeller | Rudder | Cowling and engine | Other visible damage | Reaches | Flight feel ladder (§2.2.4) |
|---|---|---|---|---|---|---|---|
| `wrecked` | new game (C0–C3) | missing: a splintered wooden hub | missing: a torn fin post | cowling dented and hanging open; ember motes and a thin smoke column until C2 | nose-down in the furrow, tilted 8° left on a collapsed left gear leg; left lower wing tip folded; tarp over the front cockpit; debris planks within 6 m | nowhere | none |
| `hopping` | C4 (`goblinKingDefeated`), Ed's hangar | **whittled pine** `#D9C39A`: uneven blades, rope-wrapped hub | missing | cowling wired shut | gear leg replaced by a mismatched wooden cart wheel `#8B4513`; wing tip splinted with a plank; tarp gone | Frozen only | 10 m/s; sputter every 2.5 s; one stall-drop per flight; no tricks; three-hop landing with a swerve |
| `propeller` | `ground_ed_1` turned in | steel `#888` with brass tips `#FFD700` (the quest item's colours) | missing | as above | the whittled propeller hangs in the hangar (`camp.md` prop) | + Swamp | 12 m/s; sputter every 2.5 s; crabs 5° on approach; no tricks; three hops |
| `rudder` | `ground_ed_2` turned in | steel | green `#228B22` with moss-spot vertex colour ("greener than usual") | as above | — | + Desert | 13 m/s; sputter every 3.5 s; barrel roll allowed; two hops |
| `repaired` | `ground_ed_3` turned in: `The Green Meanie lives again!` | steel | green | cowling closed and polished; exhaust stubs glow ember at 20 % while running | the plank splint stays (Ed never fixes what works) | everything; supply runs; aerobatics | 14 m/s; a light cough every 2.5 s; loops and rolls at canon cadence; two hops |

### 2.1 Grandpa Ed, the character

#### 2.1.1 Silhouette and proportions

| Measure | Value | Why |
|---|---|---|
| Height | 1.78 m model; 1.74 m standing with a 6° stoop | The adult in a party of 1.14–1.52 m kids. He is 4.5 heads tall against the kids' 3.0–3.8, which is what says "grown-up" before colour does |
| Head | 0.40 × 0.42 m | A hair larger than Liam's; the cap and goggles add 0.10 m of lump |
| Shoulders | 0.48 m; 0.56 m over the fleece collar | The broadest shoulders in the family, rounded forward |
| Stance | 0.40 m, right foot 0.06 m forward, weight on the left leg | The knees (§2.1.5) |
| Hands | 0.12 m | Big mitten hands like the kids', one usually holding the wrench |
| Capsule | 0.42 × 1.74 m | Sim collision; Ed is never a combat target |
| Tris | ≈ 900 | Under the hero budget; one material plus the emissive goggle glint |

**The one shape that says "that's Grandpa" at distance:** a lump on the brow (the leather cap's crown with two 0.09 m goggle discs pushed up on it) over a wide pale collar, and a red scarf tail 0.9 m long that is never still. From behind, the scarf and the stoop; from the front, the discs and the collar. Nothing on any kid has a pale collar or a horizontal band of motion at neck height.

**Rig:** the `heroes.md` §2.7.3 bone names, plus `cap` and `goggles` under `head`, `scarf.0` … `scarf.5` under `neck` (six bones; Noah has two), `prop.R` holding the wrench. The same builder as the kids with an adult proportion table: torso : legs 1 : 1.2, hips at 0.92 m, chest 1.28, neck 1.52, head centre 1.60.

#### 2.1.2 Palette

| Token | Hex | Where (share) | Hue / L | Check against hero bases |
|---|---|---|---|---|
| `npc.ed.base` | `#8B5A2B` sheepskin flight jacket | jacket body and sleeves (50 %) | 29° / 36 % | Noah 27° / 54 %: hue within 20°, lightness 18 % apart: passes. Leather at 53 % saturation beside fox orange at 85 % reads as a different material, and Ed is 0.26 m taller than Liam |
| `npc.ed.dark` | `#3B2A1A` | trousers, boots, the leather cap, goggle strap (25 %) | 29° / 17 % | passes (37 % from Noah) |
| `npc.ed.collar` | `#EDE3CF` fleece | the jacket's collar and cuffs (10 %) | — | bone token (Brief §4.2); the pale band that carries him at night |
| `npc.ed.green` | `#228B22` | the wool sweater: a V at the chest, the collar under the fleece, cuffs (8 %) | 120° / 34 % | v27's Ed green, kept where it can be seen without losing him in the moss |
| `npc.ed.scarf` | `#D84830` → `#A83828` along the length | the scarf (7 %) | 9° / 52 % | an accent (< 15 %); the AR §11.4 colours verbatim |
| `npc.ed.goggles` | rims `#7A4018`, lenses `#B8D4E0` at 40 % with a white glint | the goggles | — | v27's `#7A4018` kept |
| `npc.ed.ui` | `#228B22` | name plate, portrait ring, marker base ring, every `#228B22` announce | — | the canon announce colour, unchanged |
| skin | `#F2CBA7`; brows `#D8D3C8` | face, hands | — | the family skin token; grey-white brows are the only age mark on the face |

Why leather and not green: v27's Ed is a green circle because the body colour was the head. In 3D he has skin, so his green has to be clothing, and a `#228B22` jacket at 34 % lightness on moss `#3A7D44` at 36 % vanishes at camp exactly as `heroes.md` §2.1.2 found for a green Noah. The jacket is the aviator's, the sweater keeps the canon green, and the name plate is green for the kid who remembers.

#### 2.1.3 Face rule

Eyes half-lidded and crinkled at the corners by default, brows relaxed and white; the mouth is a quad shown for the smile (his default) and the "o" of surprise. He looks **up** more than anyone else in the game: the head look-at prefers the sky (pitch +20°) whenever no hero is within 6 m and no dialogue is open, easing at 3/s (slower than the kids' 6/s). Blink 0.15 s every 5 s (slower than the kids' 4 s). No facial hair, no glasses under the goggles, no visible hair: the cap covers it. Those three absences are deliberate: they are claims about a real person that the canon does not make (§8).

#### 2.1.4 The scarf

The AR §11.4 recipe, verbatim as a bone chain. Six bones of 0.15 m, width 0.14 m at the neck tapering to 0.09 m, vertex colour `#D84830` at bone 0 to `#A83828` at bone 5. Each bone `k` sways laterally by `A_k · sin(t·f_k + φ)` and vertically by `B_k · cos(t·g_k + φ)` with `f = [4, 5, 3.5, 4.2, 3, 3.8]`, `g = [3, 4, 4.5, 3.8, 4.2, 5]` rad/s (the seven canon frequencies distributed so no two adjacent bones share one), `A` and `B` growing from 0.025 m at bone 0 to 0.075 m at bone 5 (v27's 1–3 px, strict). On the ground the chain hangs down the back under gravity plus the weather system's wind uniform; in the plane it streams straight back along `−velocity` at 1.5× amplitude with the same frequencies. Full amplitude everywhere: Noah's two-bone scarf (`heroes.md` §2.3.2) runs the same recipe at half amplitude, so the rhyme stays a rhyme.

#### 2.1.5 Animation personality

Every idle runs at least four independent sources: breathing (1.5 % at 1.2 rad/s, slower than the kids), the scarf (six frequencies), blink (5 s), and the look-up (every 7 s, 1.2 s hold). The knee is the fifth: canon greeting 2 says `before the knees went`, so the right knee never fully bends. Walk 1.6 m/s (v27 80 px/s is 2.0 m/s strict; design, the knees) with a 0.03 m hitch on the right stride and the scarf lagging 0.2 s. He never runs.

| Idle for | At the plane | Away from the plane (crater rim, fire) |
|---|---|---|
| 3 s | weight shift onto the left leg; the look-up | the look-up; a hand to the small of the back |
| 10 s | wrench on the cowling for 1.5 s (a `#B8B8B8` spark at 20 %/frame), wipes both hands on a rag from the back pocket (1.0 s), pats the fuselage twice (0.7 s); alternate: kicks the near tyre and watches it | takes the goggles off, polishes a lens on the scarf tail (2.0 s), pushes them back up |
| 30 s | sits on the lower wing root, looks at the sky; the scarf settles over the wing | sits on the nearest sittable prop (`camp.md`); at the fire, a tin mug appears in his hands and he stirs it; every 12 s he looks toward the crater (north-east) |
| hero emote within 6 m | turns, thumbs-up held 1.5 s (the kids' `Cool cool cool` gets a matching deadpan from Grandpa) | same |

Tinkering is the character: whenever the plane is not `repaired`, the 10 s tier fires at 6 s instead, so a kid walking up to the hangar always finds him working on her. When it is `repaired`, the tyre kick wins 50 % of the time.

#### 2.1.6 Where Ed stands

**Rule: Ed is wherever the plane is.** While the plane is parked, Ed stands at that island's Ed mark, 2.2 m off the nose on the pilot's left, facing the engine (§2.3.1 has the coordinates). While the plane is airborne (flyover, supply run, travel), the parked prop and Ed are both hidden: he is in it. Story states override the mark:

| Story state | Ed's spot | Facing |
|---|---|---|
| C0–C3, `wrecked` | the wreck's nose, Forest (15, −2.5) | the engine |
| C4 onward, plane on the Forest island | the Forest Ed mark (20, −2.2), beside the hangar's mouth | the engine |
| plane on another island | that island's Ed mark | the engine |
| CS-06 armed (`edQuestComplete && craterVisited && meteorSeen && !edCraterDialogue`) | the crater's south-west rim (111, −111) | into the crater |
| `edCraterDialogue` set, before `portalOpen` | back at the plane | — |
| `portalOpen` onward, on the Forest island | `camp.md`'s Ed seat at the fire ring, the side that looks north-east; the plane stays parked 16 m away | the fire |
| the party in Home, Wrong | the fire (his fire is the one far light, `story-beats.md` §2.2) | — |
| CS-10 | the fire at dawn; the plane's final pass over the Ridge is his (§5) | — |

**Relocation rule (all NPCs).** An NPC moves to a new spot by walking there with companion steering (`heroes.md` §2.5.11) if any hero is within 30 m (`vis.radius × 2.5`) or the NPC is inside the camera's ground footprint; otherwise it is placed at the new spot directly. Nothing ever pops in view. Ed's walk to the crater rim is therefore a real 1.6 m/s walk if the party is nearby, and a kid can follow him there; his walk to the plane for a supply run is always visible because supply runs only fire near the strip (§2.4.3).

#### 2.1.7 Portrait set and moods

Portraits are not drawings: each character's portrait is its own head mesh rendered once per mood into a shared atlas at load (three-quarter view, 15° yaw, a warm key from the upper left, the face system's brow, eye and mouth quads set per mood), so the box always shows the character the player is looking at. Atlas 2048 × 2048 at 192 px tiles (up to 100 tiles; 16 MB) on desktop, 1024 × 1024 at 96 px tiles on the mobile preset. `ui-ux.md` owns the frame, the ring in the speaker's `ui` colour, and the name plate.

Ed's 24 canon moods map to eight frames. Every canon line keeps its mood tag as data; the mapping is a lookup.

| Frame | Brows | Eyes | Mouth | Goggles | Canon moods it serves |
|---|---|---|---|---|---|
| `happy` | up, relaxed | crinkled | wide smile | up on the cap | `happy`, `cheerful`, `relieved`, `overjoyed`, `triumphant`, `proud`, `hopeful`, `excited` |
| `wink` | one up | one closed | half smile | up | `wink`, `smirk`, `secretive`, `sheepish` |
| `wistful` | relaxed | half-lidded, looking up and right | small smile | up | `wistful`, `dreamy` |
| `worried` | inner ends up | wide | flat | up | `nervous`, `worried`, `puzzled` |
| `serious` | flat | steady | flat | up | `serious`, `thinking`, `curious` |
| `stunned` | high | wide | "o" | pushed higher | `stunned`, `distracted` |
| `annoyed` | down | narrowed | pressed | up | `annoyed` |
| `resigned` | asymmetric | half-lidded | slight frown | up | `resigned` |

The two `happy`/`wink` cheek strokes v27 drew become a real cheek rise on those two frames, so the one thing the old portrait did survives.

#### 2.1.8 What Ed says, and when

All of `DIALOGUE.grandpaEd` ports verbatim, keyed as v27 keyed it, with `crater_hint` added from `story-beats.md` §2.7. Delivery follows the handler in §2.5 and the rotation of `story-beats.md` §2.3 rule 4:

| Block | Trigger | Order and rotation | Reaction appended |
|---|---|---|---|
| `greetings` 1–6 | any talk with nothing to offer or turn in | one line per talk from `story.greetingIdx`: at the wreck 6 → 3 → 2; after `squadAssembled` 1 first, then any unheard line, then cycle from 1; hop flights (`hopping`) 5 → 4; repaired flights cycle 1 → 4 → 3 | `quest_intro` once per hero (story-beats rule 2) |
| `crash_landing` 1–4 | CS-01 only | line 1 in the air, impact, line 2 climbing out, the kids' four `crash_landing` lines (Liam, Isabella, Noah, Collette), lines 3 and 4 as he looks up | the kids' lines are the reaction |
| hangar shouts **[new text, story-beats §2.7]** | B2.1, the squad walking up to the hangar | `Got her hopping. She won't fly, mind you. But she'll hop.` (`proud`) as a bubble at 12 m; `Whittled a propeller out of one of those big pines. Don't tell the tree.` (`sheepish`) at 8 m; no freeze; then the box on interact | — |
| `phase1_intro` 1–4 / `phase2_intro` 1–3 / `phase3_intro` 1–3 | offer (§2.5) | whole, in order | `quest_intro` ×4 in the order Liam, Noah, Collette, Isabella (phase 1 only; phases 2–3 auto-offer with no reaction, as v27) |
| `phase1_return` / `phase2_return` / `phase3_return` | turn-in at the plane | whole | phase 3 continues into `quest_complete` 1–4 then `space_hint` ×4 in the order Isabella, Noah, Collette, Liam |
| `crater_hint` 1–3 **[new text]** | `craterDiscovered && meteorSeen && !edQuestComplete && !edCraterHint` | whole; sets `edCraterHint` | none (story-beats §2.7) |
| `post_quest` 1–5 | talk after `edQuestComplete` | whole | `space_hint` for any hero who has not yet said it |
| `crater_awareness` 1–5 | CS-06 at the rim | whole, line by line under the crater's 8 s pulse | `ed_crater`: Noah, then Isabella |
| in flight | CS-04 sky leg | greeting 5 on the first hop, 4 on later hops; repaired flights 1 → 4 → 3; shown as cutscene captions with Ed's portrait (`ui-ux.md`), not the box | none |
| sheltering **[new text]** | a hero sheltering 5 s in `rain` or `storm` with Ed within 8 m (`world-events-weather.md` §2.7.3) | Ed says `Character-building weather.` as a bubble (`happy`), once per storm; without Ed present the canon tip 2 caption plays instead | — |

The `Ed: "Time for a supply run!"`, `Ed's back from his supply run!`, `Grandpa Ed has crash-landed!` and `The Green Meanie lives again!` announces stay announces, in `#228B22`, at their v27 durations (2, 2, 3, 4 s).

### 2.2 The Green Meanie, the character

#### 2.2.1 The body

A two-bay biplane sized for a diorama, not a hangar: big enough that five people climbing out of it is a joke that reads, small enough to park beside a tent.

| Part | Dimension | Colour | Notes |
|---|---|---|---|
| Fuselage | 6.0 m spinner to rudder post, 0.9 m wide, tapering to the tail | `plane.yellow` `#F4D21E`; underside panels and the belly stripe `plane.yellowDark` `#B89A12` | `The Green Meanie` hand-lettered in `plane.green` on both sides under the front cockpit (canon text painted, not new text) |
| Upper wing | 7.2 m span, 1.1 m chord, 2.4 m above the ground | `plane.green` `#2D8C56` top, `plane.greenDark` `#1E6B3E` underside | v27's wing colour verbatim; the rounded tip caps `#268A4E` kept |
| Lower wings | 6.4 m span, 1.0 m chord, at 0.7 m | same | the left tip carries the plank splint from `hopping` on |
| Struts and rigging | eight `plane.strut` `#8B4513` uprights, cross-wires as `LineSegments` `#3B2A1A` at 50 % | — | v27's `#8B4513` kept |
| Cowling | 0.9 m round, five exhaust stubs on the right | `plane.cowl` `#8B6914`, bolts `#7a5c12` | v27 colours verbatim; stubs emissive `#FF6A2A` at 20 % while the engine runs (`repaired` only) |
| Propeller | ⌀ 1.9 m, two blades, separate node `prop` | steel `#888`, brass tips `#FFD700`; whittled `#D9C39A` | blur disc quads shown above 20 rad/s (two ellipse quads at 25 % and 20 % offset 90°, v27's recipe); the blade mesh stands still on a sputter: **the joke is kept** |
| Tail | fin and tailplane 1.6 m span | fin and tailplane `plane.red` `#D84830` with `#922b21` edges; the **rudder** `#228B22` | canon: the rudder is green (`ed_rudder` item, Ed's lines); v27 drew the whole tail red, so the fixed fin stays red and the moving rudder is green |
| Landing gear | two legs, wheels ⌀ 0.6 m, track 1.9 m, tail skid | `#555` legs, `#333` tyres, hubs `plane.red` | the left leg is the cart wheel from `hopping` on |
| Front cockpit | 1.1 m long bench, four seat sockets `seat.0`–`seat.3` | cockpit interior `rgba(30,20,15)` | the kids sit the way they fit in the back of the car: two forward, two behind, Isabella on the left (she called dibs) |
| Rear cockpit | Ed's, socket `pilot` | — | Ed's rig sits here in flight; the scarf streams past the fin |
| Instrument glow | a 0.06 m emissive quad in each cockpit | `#FFB347` at 0.3, night only | the one light on the plane at night; no navigation lights |

Nodes that move: `prop` (spin), `rudder` (yaw ±25° with the steering input), `elevator` (pitch ±15°), `wheel.L/R` (spin on the ground), `gear` (compresses 0.08 m on touchdown). Nodes that swap by state: `prop` ↔ `prop.whittled` ↔ `prop.hub.broken`; `rudder` ↔ `rudder.missing` (a torn post); `gear.L` ↔ `gear.L.cart`. Tris ≈ 1,900 (fuselage 400, wings 480, struts and gear 200, tail 150, cockpits 200, cowl 120, propeller 60, wheels 96, details 150); budget ≤ 2,400. Two materials: the shared flat-shaded vertex-colour material and the emissive material (stubs, instrument glow, the whittled hub's rope is not emissive).

Why Cub yellow and not v27's amber: the canon tip says *yellow* (`Tip: If you see a yellow biplane, wave. That's Grandpa Ed.`). v27's `#E8A838` is an amber that is now Collette's accent and the UI gold; the golden-hour key `#FFD08A` is pale gold; and Isabella's accent is `#F0C040`. `#F4D21E` (50.5° / 54 %) is 23° from Noah's orange, a plane part rather than a body, and unmistakably a yellow aeroplane. Why it is still called The Green Meanie: the canon never explains it, the wings and the rudder are green, and a kid at 25 can argue about it.

#### 2.2.2 What each state looks like

The state table in §2.0 is the contract; the wreck deserves more because CS-01 ends on it and camp C1–C3 lives beside it.

**`wrecked` (C0–C3).** The plane sits at the west end of the furrow at (13, 0), nose down 14°, rolled 8° left onto the collapsed left leg, the tail skid 0.9 m in the air. The propeller hub is a splintered stub; the fin is a bare post; the cowling hangs open on one hinge showing a black engine block; the left lower wing tip is folded under; a canvas tarp `#C9B99A` covers the front cockpit; nine debris planks (0.2–0.5 m, `#8B4513`/`#654321`/`#a0522d`) lie within 6 m along the furrow's axis, and the furrow itself is a 60 × 4 m scorched decal `#2A2418` at 35 % fading to 15 % by C3 (never gone: it is the strip). Ember motes (`pt.ember` recipe, 8 particles, `#FF6A2A`) rise from the cowling and a thin smoke column (a 4 m billboard column at 12 %) stands over it until C2; by C2 it is cold. At night the open cowling shows nothing: the wreck has no light. This is the object Liam wakes up beside.

**`hopping` (C4).** The same body, righted and pushed 3 m east onto the parking mark. The whittled propeller is pale pine with visibly unequal blades and a rope-wrapped hub; the cart wheel is a hand taller than the right wheel so the plane sits 4° off level; the wing tip is splinted with a plank and twine; the fin post is still bare. The tarp is gone; the tools are on the ground (`camp.md` owns the hangar and its bench; the tools are camp props).

**`propeller` → `rudder` → `repaired`.** Each turn-in swaps one node in front of the player: the steel propeller replaces the pine (the pine goes to the hangar wall, `camp.md`), the green rudder appears on the post, and at `repaired` the cowling closes and polishes (its vertex colours brighten 15 %) and the exhaust stubs glow. Nothing else changes. The plank splint and the cart wheel stay for the rest of the game.

#### 2.2.3 The four motion sources, ported as rules

AR §19.3's method is the whole point: four independent, incommensurate motion sources on one object. All four port; two change units.

| Source | Rule (sim clock) | v27 | Change |
|---|---|---|---|
| **Course wander** | every `rnd(2.5, 5)` s a new lateral offset target `rnd(−6, 6)` m from the flight line; the plane's lateral velocity is rate-limited to 3 m/s toward it; the yaw target is the velocity heading; yaw chases it at **3.5/s** | ±0.6 rad heading nudges at 1.2 rad/s | v27's free heading walk would fly the plane off its buzz line; the wander is now a lateral offset on a path, at the same cadence |
| **Bank lag** | `turnRate` lerps toward `steerDiff × 2.5` at **4/s**; roll `rotation.z = turnRate × 0.25 + cos(t·2) × 0.04` | same | kept; the plane banks before it turns and levels after |
| **Wobble** | the `cos(t·2) × 0.04` rad roll term above, plus pitch `sin(t·1.3) × 0.02` rad and an altitude bob of ±0.4 m at `sin(t·0.9)` | `cos(gt·2)` roll | kept, with a pitch and bob added because a 3D plane that only rolls looks pinned |
| **Sputter** | every `sputterInterval` (state table): `sputterOn` for `sputterDur`, the `prop` node freezes and the blur discs hide, altitude drops `sputterDrop`, the engine sound cuts (`plane.sputter`), one black puff; recovery climbs the drop back over 0.3 s | every 2.5 s, 0.15 s, 3 px | 3 px is 0.075 m, invisible on a 6 m plane; the drop is 0.5 m (`repaired` 0.25 m) |
| **Stall-drop** (`hopping` only) | once per flight at a random point in the middle third: 1.2 s engine-out, the nose dips 15°, altitude −4 m, then the engine catches with a backfire puff and the nose comes up | — | new; the "she'll hop" plane must visibly nearly not |
| **Shadow as altitude** | the real PCF shadow from the key light, plus a soft blob decal 5 × 3 m directly beneath the plane at `alpha = clamp(0.12 − alt × 0.0025, 0.03, 0.12)` | `0.12 − alt·0.0005` (px) | the same curve in metres: 0.12 on the ground, 0.10 at the 9 m buzz, 0.05 at 28 m; the blob is what tells a kid the plane is coming down when the sun is high and the real shadow is elsewhere |

Reduced-motion does not touch any of these: they are world motion, not camera motion.

#### 2.2.4 Speeds and altitudes (design values)

v27's 100 px/s is 2.5 m/s at strict conversion, slower than Liam runs; 150 px altitude is 3.75 m, tree height. Both are replaced.

| Value | v27 | Strict | Design | Why |
|---|---|---|---|---|
| Cruise speed | 100 px/s | 2.5 m/s | `hopping` 10 · `propeller` 12 · `rudder` 13 · `repaired` 14 m/s | three times a running kid; a 250 m buzz pass takes about 20 s, the length of a v27 crossing |
| Climb rate | 60 px/s | 1.5 m/s | 2.5 · 3 · 3.5 · 4 m/s | a 16° climb at cruise; the plane gets better as the kids fix it |
| Max bank | — | — | 15° · 20° · 30° · 35° | the rudderless plane cannot hold a bank |
| Flyover entry and exit altitude | 150 px | 3.75 m | 28 m | above the 14 m oaks with room to descend |
| Buzz altitude over the party | — | — | 9 m | the highest altitude that is still inside the gameplay camera's frame during a lateral crossing (§2.2.8) |
| Supply-run circuit altitude | 150 px | 3.75 m | 20 m | crates from 20 m fall for about 12 s (§2.4.4) |
| CS-04 cloud layer | — | — | +24 m above the hub ground | the streaming curtain |
| CS-01 entry altitude | — | — | 60 m over the Ridge | eight turns of corkscrew need the height (§2.4.1) |
| Taxi | — | — | 3 m/s | — |
| Takeoff roll | — | — | 0 → 12 m/s over 3.0 s (18 m), rotate at 12 m/s | every strip is 60 m or longer |
| Landing approach | — | — | 12 m/s at 3.5 m/s descent, flare at 2 m, touch at 10 m/s | — |
| Roll-out | — | — | 10 → 0 m/s over 28 m (3.5 s); the tail drops at 4 m/s | a taildragger's roll-out |
| Steering rate limit, yaw chase, bank lag | 1.2 rad/s, 3.5/s, 4/s | — | kept | the character |
| Wander cadence | `rnd(2.5, 5)` s | — | kept; amplitude ±6 m lateral | §2.2.3 |
| Sputter | 2.5 s / 0.15 s / 3 px | 0.075 m | per state: 2.5 · 2.5 · 3.5 · 2.5 s; 0.15 s (`repaired` 0.10 s); 0.5 m (`repaired` 0.25 m) | §2.2.3 |
| Ed's walk | 80 px/s | 2.0 m/s | 1.6 m/s | the knees |

#### 2.2.5 Aerobatics and the wing-rock wave

The AR §11.2 numbers port whole: first trick at `rnd(4, 8)` s into a flight, then `rnd(7, 15)`; never in the first 2.5 s; 50/50 barrel roll (1.0 s) or loop (1.8 s); direction ±1; ease-in-out quadratic `tp < 0.5 ? 2tp² : 1 − (−2tp + 2)²/2`. Tricks are real rotations now: the barrel roll is `rotation.z = ease · 2π · dir` with a 1.5 m hump; the loop is a vertical circle of radius `v · 1.8 / 2π` (3.4 m at 12 m/s, 4.0 m at 14 m/s), so the plane climbs 7–8 m and comes back down; the `scaleY`/alpha fake is no longer needed. The four wind streaks become four 0.6 m ribbon quads `rgba(255,245,230,0.15)` trailing the wing tips for the trick's length.

Gates by state: `hopping` and `propeller` never; `rudder` barrel rolls only; `repaired` both. Trick timing rule: a trick fires only while the plane's ground position is within 25 m horizontally of the active hero (the camera's ground footprint), so it is seen; a cooldown that expires elsewhere waits. Supply runs allow one trick per circuit.

**The wing-rock wave [new behaviour].** A wing-rock (roll ±15°, twice, over 1.2 s, no altitude change) is the pilot's wave. It fires: in CS-05 after the loop and in CS-10 over the Ridge; and in gameplay whenever any hero performs an emote while the plane is airborne within 25 m horizontally and inside the camera footprint. The canon tip says wave; now Ed waves back. Counted in `stats.wavedAtEd` for a Phase 4 memory collectible that `ui-ux.md` may or may not spend.

#### 2.2.6 Exhaust, prop wash and dust

- **Exhaust trail:** a pooled `Points` emitter at the stubs, 20 puffs/s while the engine runs (v27's 40 %/frame at 60 Hz is 24/s), cap 80, life 3 s (v27's 1.5 decaying at half rate), size 0.15 m growing at 0.08 m/s, colour `#B4B4B4` at alpha `min(life × 0.35, 0.5)`. `hopping` and `propeller` add a black puff `#555` on every sputter; the CS-01 crash trail is `#555`, 25 puffs/s, cap 120, life 4 s, size 0.1–0.25 m.
- **Prop wash on the ground:** during engine start, taxi and the takeoff roll, a dust cone behind the propeller: the `pt.dust` recipe at 12 particles/s inside a 6 m cone, plus the grass sway shader's gust uniform driven locally if the shader exposes a gust point (world-events' gust is global; a local point is an optional `render-engineer` addition; dust alone is acceptable).
- **Touchdown:** each hop of the bounce landing spawns 6 dust particles at each wheel (the crate-landing recipe, `#c8b88a`) and compresses `gear` 0.08 m.
- **Crash:** §2.4.1.

#### 2.2.7 Engine sound hooks (names for `audio.md`)

v27's plane is silent (AI §15). The plane gets a procedural engine whose health follows the state; these are names, not recipes.

| Hook | When | Character |
|---|---|---|
| `plane.engine.hopping` | `hopping` in flight | rough, uneven, drops out on every sputter and for the stall-drop |
| `plane.engine.propeller` | `propeller` | steadier, still misses |
| `plane.engine.rudder` | `rudder` | the miss is rarer (3.5 s) |
| `plane.engine.repaired` | `repaired` | the purr (`the engine won't purr without the spark plug`), with a soft cough every 2.5 s |
| `plane.sputter` | every sputter | the engine cutting and catching |
| `plane.stall` | the `hopping` stall-drop | 1.2 s of silence then a backfire |
| `plane.prop.spinup` / `plane.prop.spindown` | engine start and stop | — |
| `plane.taxi.rumble` | on the ground, moving | wheels on dirt, boards on the Causeway |
| `plane.touchdown` | each landing hop | a thump per hop |
| `plane.wind.trick` | during a trick | the four ribbons' sound |
| `plane.wreck.tick` | the `wrecked` prop, C0–C1 | cooling metal, once every 6–14 s |
| `plane.crash.impact` | CS-01 impact | v27 `boom` at 0.3 plus the debris |
| `crate.chute.open`, `crate.land` (v27 `equip` 0.15), `crate.pickup` (v27 `equip` 0.3) | crates | — |

All flight sounds pan and doppler with the plane's world position relative to the camera; a flyover approaching from beyond the rim is heard before it is seen, which is the reason the low pass works.

#### 2.2.8 Flyovers from C4 (the `edFlyover` slot)

**The camera fact.** At pitch 50° and 20 m the camera is about 15 m above the ground; its frame's top edge is 25° below horizontal. A plane above the camera's height is never in frame, and a plane at 9 m is in frame only while it is within roughly 12 m of the hero along the view axis, but across the **full frame width** (about 33 m) when it crosses the view axis at right angles. So a flyover is a **low lateral pass**: the plane crosses the frame left to right (or right to left) over the party, low, with its shadow racing ahead of it and the engine heard before either. The far-horizon silhouette against the sky is a bonus the curved-world shader may add on some islands and some yaws; nothing depends on it. No camera glance is used (§6).

**Buzz lines.** `world-builder` authors three per island as data: straight segments of 120 m or more over open cells with no prop taller than 6 m within 8 m of the line; one is always the strip's axis; the Forest's others are the north meadow east–west and Crash Meadow north–south.

**Scheduler.** State `biplane.flyover = { timer, count }`, persisted.

| Rule | Value |
|---|---|
| Gate | `planeState ≠ wrecked`; the active hero more than 60 m from the strip (`story-beats.md` §2.2: the plane is never in two places); not in a dungeon, cutscene, dialogue or boss fight; `events.reserve('edFlyover', 10)` succeeds (no world event running or within 10 s, `world-events-weather.md` §2.5.1); if the gate fails, re-check every 2 s without consuming the timer |
| First flyover | 20 s after the gate first holds (15 s when restored from a save): v27 |
| Intervals | flyovers 1–2 `25 + rnd(0,15)` s; 3–5 `35 + rnd(0,20)`; 6+ `50 + rnd(0,25)`: v27 verbatim; the count carries across islands and saves |
| Event roll | 40 % `supply`, 60 % `flyover`: v27 |
| Announce | `✈️ Supply drop inbound!` / `✈️ A biplane flies overhead!`, `#E8A838`, 2 s, at launch: v27 verbatim |
| Path | pick the buzz line nearest the party among those whose direction is 60–120° off the camera's yaw at launch (the crossing rule); if none qualifies, the nearest; direction along the line chosen so the pass point comes after entry. Entry 40 m beyond the rim at 28 m; descend to 9 m by the pass point (the line's closest point to the party, offset `rnd(−8, 8)` m along the line); climb to 28 m by the exit; despawn 40 m past the far rim |
| Duration | about 20 s at 14 m/s |
| Crates | `supply`: `betterDrops ? floor(rnd(6,11)) : floor(rnd(3,8))` crates released one per `0.7 + rnd(0, 0.2)` s starting 3 s before the pass point, with `📦 Supply crates incoming!` (`#E8A838`, 2 s) on the first; `flyover`: `floor(rnd(3,6))` crates at `0.7 + rnd(0, 0.15)` s, no announce: v27 counts and stagger verbatim. At 14 m/s the spray lands along 60 m of the buzz line centred on the party |
| Tricks | §2.2.5, within the footprint only |
| `Frequent Flyer` | `biplaneSeen++` at every flyover and supply-run launch (not travel flights, not cutscenes); achievement at 10: v27 semantics |
| End | the parked plane and Ed reappear at the strip; if the active hero is within 80 m of the strip at that moment, the return is a visible landing on the strip's axis (approach, bounce, roll-out, taxi to the mark, `plane.prop.spindown`) |
| Save | `flyover.timer` and `count` persist; an airborne flyover is not saved (it simply lands) |

