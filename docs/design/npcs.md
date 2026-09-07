# NPCs and Grandpa Ed — Design Bible

**Status:** reviewed by orchestrator 2026-09-06; consistency pass applied 2026-09-07 · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
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

### 2.3 Travel

#### 2.3.1 The strips

Positions are `story-beats.md` §2.2's. Every strip runs along `+x`; takeoffs roll toward `+x`, landings come in from `+x`. Each strip has two marks on its axis, the plane facing `+x` at both. The **parking mark**, 6 m from the strip's west end, is where the plane lives while it is not `repaired` (on the Forest island that is under the hangar's roof from C4, the nose just inside the mouth at `x` 19.5, `camp.md` §2.2 #44). The **apron mark**, 4 m east of the hangar's mouth on the Forest island and 8 m east of the parking mark elsewhere, is where every landing rolls out and where the plane stands from `repaired` on: turn-ins, CS-05, supply runs and the CS-10 landing (`camp.md` §2.12, `cutscenes.md` §2.11). The Ed mark is 2.2 m north of the nose (the pilot's left) and the cockpit step is on the fuselage's north side at mid-length, wherever the plane stands.

| Island | Strip (m) | Parking mark (plane centre) | Nose | Ed mark | Cockpit step (`Fly` prompt) | Surface and notes |
|---|---|---|---|---|---|---|
| `forest` | Ed's Landing (10, 0)–(70, 0), 60 × 12 m | (16, 0) | (19, 0) | (20, −2.2) | (16, −0.9) | the scorched furrow; the hangar (footprint `x` 8.5–19.5, mouth at 19.5, `camp.md` §2.2 #44) over the west end; the wreck sits at (13, 0) until C4; **apron mark (24, 0)**, nose (27, 0), Ed mark (28, −2.2), step (24, −0.9) |
| `frozen` | the snowfield (−10, 20)–(50, 20) | (−4, 20) | (−1, 20) | (0, 17.8) | (−4, 19.1) | packed snow; ski-tracks decal instead of a furrow; Neve's hut 20 m north |
| `swamp` | the Long Causeway boards (−30, 0)–(30, 0) | (−24, 0) | (−21, 0) | (−20, −2.2) | (−24, −0.9) | the plane lands **on the boardwalk**; wheels rumble on planks (`plane.taxi.rumble` variant); Fern's jetty at the east end |
| `desert` | Sol's hard-pan (−40, 30)–(40, 30) | (−34, 30) | (−31, 30) | (−30, 27.8) | (−34, 29.1) | cracked clay; the Oasis 30 m north |
| `shadow`, `cave`, `volcanic` | no strip | — | — | — | — | never reached by plane (`story-beats.md` §2.2) |

At `wrecked` the Forest strip has no parking: the wreck is at (13, 0) and Ed at (15, −2.5). At C4 the wreck is righted and rolled 3 m east onto the mark in front of the hangar.

#### 2.3.2 The interact-on-the-strip flow

Two prompts, 3 m apart, never one prompt with two meanings:

- **`Talk`** on Ed (range 2.0 m from Ed; v27 70 px is 1.75 m). Ed's handler (§2.5) decides what he says. Ed keeps v27's priority: if both prompts are in range, the nearest wins, and they are placed so that walking up from the hub reaches Ed first.
- **`Fly`** [new text] at the cockpit step (range 2.5 m), shown only when `planeState ≠ wrecked` and at least one other island is unlocked. Pressing it freezes the sim and opens the destination card. On `Stay` the card closes with nothing changed.

Both prompts render from the live binding (`heroes.md` §2.5.3: Space / A / tap). In multiplayer the host chooses; guests see the card with `Waiting for host...` (`ui-ux.md`).

#### 2.3.3 The destination card (contents for `ui-ux.md`)

A scrapbook page: a hand-drawn sky map with the islands as the same low-poly silhouettes the sky dome shows (`world-events-weather.md` §2.6), the current island circled, the plane's little icon on it. The look is `ui-ux.md`'s; the contents are:

| Element | Content | Source |
|---|---|---|
| Header | `Where to?` | **[new text]** |
| One row per island in the travel ladder order `forest`, `frozen`, `swamp`, `desert` | the canon display name (`Enchanted Forest`, `Frozen Peaks`, `Murky Swamp`, `Scorching Sands`); the island's title-card line; the guide's name; the count of open quests there; the island's current weather icon | `story-beats.md` §2.2 (names and lines) |
| Locked rows | greyed, with a lock reason: `Needs the propeller` (`hopping`, for `swamp`), `Needs the rudder` (`propeller`, for `desert`), `Needs the spark plug` (never shown in practice: nothing is gated on it except supply runs) | **[new text]** |
| The current island's row | marked `You are here` | **[new text]** |
| Plane-state note under the header | `hopping`: `She'll hop. Probably.` · `propeller`: `Steadier. Still no rudder.` · `rudder`: `She'll turn now.` · `repaired`: none (the plane is fine) | **[new text]**, Ed's voice, one line each |
| Buttons | `Fly` · `Stay` | **[new text]** |
| Skip | after the first flight to a destination, `Press SPACE to skip` (canon, the keyboard variant) appears 2 s into CS-04 | `story-beats.md` §2.10 |

Nine new strings in total, all short, all in the family's voice.

#### 2.3.4 The flight (the behaviours CS-04 shoots)

CS-04 is `cutscenes.md`'s shot list; this is what the plane does under it. Nominal 18 s; 16 s on a repeat flight (boarding compressed); never longer than 30 s (§2.3.5). All timings are cutscene clock.

| Beat | Duration | What the plane does | `repaired` | `rudder` | `propeller` | `hopping` |
|---|---|---|---|---|---|---|
| Board | 1.2 s | the four kids climb the step into the bench (`seat.0`–`3`, Isabella left), Ed into the rear; goggles down if `story.edGoggles` (§2.5) | — | — | — | — |
| Engine start | overlapped, last 0.8 s of boarding | `plane.prop.spinup`; the blades blur; one exhaust puff | clean | one cough | two coughs | three coughs and a backfire |
| Takeoff roll | 3.0 s | 0 → 12 m/s along the strip; prop-wash dust; the tail lifts at 1.5 s | straight | straight | crabs 5° (no rudder) | swerves ±3 m and corrects |
| Rotate and climb | 3.5 s | rotates at 12 m/s, climbs at the state's rate, enters the cloud layer at +24 m | 4 m/s | 3.5 | 3 | 2.5, with the stall-drop at +12 m (−4 m, nose dip, backfire) |
| Sky leg | 3.0 s minimum, loops while streaming (§2.3.5) | above the cloud layer: the sky dome, the two island silhouettes (departing shrinking behind, destination growing ahead), the clouds; weather en route (§2.3.5); Ed's greeting caption | one trick allowed | a barrel roll allowed | none; sputter every 2.5 s | none; sputter every 2.5 s |
| Descent | 1.2 s | down through the destination's cloud layer; the real island appears below | — | — | — | — |
| Circuit | 2.6 s | a 60° arc at radius 40 m and 20 m altitude around the hub: the establishing shot that teaches the island's layout | bank 35° | 30° | wide and crabbing, 20° | wobbling, 15° |
| Approach and landing | 2.5 s | 12 m/s, 3.5 m/s descent, flare at 2 m | two hops (1.0 m, 0.35 m at 0.6 s intervals) | two hops | three hops (1.2, 0.6, 0.25 m) | three hops and a 3 m swerve |
| Roll-out and park | 1.0 s | decelerates to the apron mark (§2.3.1); the tail drops; `plane.prop.spindown`; the kids climb out; Ed to the Ed mark | — | — | — | — |

Every landing bounces, including the repaired plane's: the landing record is canon (`Tip: Don't ask Grandpa Ed about his landing record. Just don't.`) and the achievement `Ed's Landing` is named for it. The kids are in the plane for the whole flight; the camera may cut to their faces (goggles on, scarf streaming past them). The title card fires at touchdown on every landing (`story-beats.md` §2.1).

#### 2.3.5 The streaming contract

There is no geometry between islands. The sky leg is the sky dome, the cloud layer, and the two island silhouettes from `world-events-weather.md` §2.6, so the origin island can be unloaded and the destination loaded behind the clouds.

1. On `Fly`: freeze the sim; `events.reserve('travel', flightLength + 10)`; the weather for the destination is **rolled now** from the destination's pool and held.
2. During the roll and climb (about 6.5 s): begin loading the destination (layout, scatter, NPCs at their spots, enemies at spawn state, the Ed mark, the parking mark and the apron mark).
3. Sky leg: minimum 3 s; while `!dest.ready`, the leg loops (the silhouettes drift, the clouds pass, no visible seam) up to a total flight of 30 s; a dev warning logs any overrun. Weather shown: the origin's type for the first half of the leg, the held destination type for the second half (`world-events-weather.md` §2.2.2).
4. Inside the destination's cloud layer (the descent's first 0.6 s): swap. Unload the origin, activate the destination.
5. Circuit and landing on the live island. At touchdown: commit the held weather as the island's current weather (this is the "arriving island rolls fresh weather at touchdown" of `world-events-weather.md`, rolled early so the leg can show it), set `world.currentIsland`, fire the title card, place the party beside the step, Ed at the Ed mark, the plane at the mark.
6. Unfreeze.

A save is never written mid-flight; the save's `currentIsland` is the origin until step 5.

#### 2.3.6 Ed is wherever the plane is

Turn-ins happen at the plane, on whichever island it is on (`story-beats.md` §2.3 and §6). The compass strip's "Ed with an offer" and "the plane when an unlocked island has an open quest" entries (`story-beats.md` §4) point at the Ed mark and the cockpit step respectively. If the party leaves the strip's island on foot (they cannot; islands are reached only by plane) the rule never breaks. The one place the party goes without the plane is the Shadow Realm, by the portal; Ed is at the fire.

#### 2.3.7 What the kids do in the plane

No new lines. The kids' in-flight behaviour is animation only: Noah leans out and tracks the ground (one brow up); Collette holds her pigtails down against the wind; Isabella has both arms up like a roller coaster; Liam sits still with one hand on the cockpit rim and looks at the others. On the `hopping` stall-drop all four grab the rim. These are clips for `cutscenes.md` to cut to; `heroes.md`'s idle personalities, seated.

### 2.4 The crash (values for CS-01) and supply drops

#### 2.4.1 The crash, in metres

`story-beats.md` §2.9 cuts the random crash; the sequence survives as CS-01's values, converted so `cutscenes.md` can shoot it. Noah's canon line (`The spin was like eight rotations.`) fixes the count.

| Beat | Value | v27 source |
|---|---|---|
| Entry | over the Ridge at (0, −130), altitude 60 m, heading south-south-east, 14 m/s, `✈️ A biplane sputters overhead!` (`#D94848`, 2 s), the crash smoke trail already on (`#555`, 25 puffs/s, cap 120, life 4 s) | AR §11.5 |
| The spiral | begins at `pathProg > 0.4` of the approach (about 40 m in); the plane homes on the touchdown point (70, 0) with a **4 rad/s corkscrew of 4 m amplitude** perpendicular to the approach (v27 40 px is 1.0 m; 1 m does not read on a 6 m plane), **rolling continuously at 4 rad/s** (eight full rotations over the 12.6 s descent: Noah counted), descending at 4.8 m/s (v27 25 px/s is 0.625 m/s; the design descent fits 60 m into 12.6 s), heading chasing velocity at 5/s, bank = cruise bank + `sin(crashT·4)·0.5` rad, sputter continuous | AR §11.5, FC §2.1 |
| Ed's line 1 | `Don't worry! That's a CONTROLLED descent! ...mostly.` as a caption at rotation four | `story-beats.md` §2.5 |
| Touchdown | at (70, 0) when within 0.75 m of the target or altitude ≤ 0, at 16 m/s; `screenShake(8, 0.5)` direct (v27 `shk.i = 8, t = 0.5`); `plane.crash.impact` (`boom` 0.3); 15 debris pieces 0.1–0.3 m in `#8B4513`/`#654321`/`#a0522d`, velocity ±2.5 m/s lateral, 0.5–2.5 m/s up, life 1 s, gravity 5 m/s² (v27 `grav 200` strict); `events.emit('biplaneCrash')` | AR §11.5 |
| The skid | 60 m west along the furrow over 3.5 s, the furrow decal scorching behind it, the left gear leg collapsing at 20 m, the left wing tip folding at 40 m, the propeller hub splintering at 50 m, stopping nose-down at (13, 0) | new (v27 had no skid) |
| Announce | `Grandpa Ed has crash-landed!` (`#228B22`, 3 s) at the stop | FC §3.6 |
| After | the tarp, the ember motes, the smoke column (§2.2.2); five people climb out; `edCrashCount = 1`; Ed's lines 2–4 and the kids' four lines in `story-beats.md`'s order | — |

The "never interrupts anything" gate (AR §11.5) is no longer needed for the crash, which is the opening; `story-beats.md` §3 keeps it as the arming rule for CS-03 and CS-06.

#### 2.4.2 Supply runs (`Ed: "Time for a supply run!"`)

| Rule | Value |
|---|---|
| Unlocked by | `story.edQuestComplete` (`repaired`) |
| Cooldown | `120 + rnd(0, 60)` s after each run; the first run 120–180 s after CS-05: v27 |
| Gate | Ed on the ground at the plane; the active hero within **80 m** of the strip (so the walk, the takeoff and the drop are seen; v27 had no gate and its drops often landed unseen); not in a dungeon, cutscene, dialogue or boss fight; `events.reserve('supplyDrop', 10)` succeeds |
| Announce | `Ed: "Time for a supply run!"` (`#228B22`, 2 s) at the walk's start |
| The walk | Ed walks from wherever he stands to the cockpit step at 1.6 m/s with companion steering (the v27 straight line pushed off trees becomes real steering); climbs in (1.5 s); `plane.prop.spinup` |
| Takeoff | §2.3.4's roll and climb to 20 m |
| The circuit | one lap around the strip's centre at radius 70 m and 20 m altitude, about 32 s at 14 m/s; one trick allowed on the far half |
| The drop | on the near half of the lap (the 90° of arc nearest the strip): `floor(rnd(6, 11))` crates (`betterDrops` is always set by then) one per `0.7 + rnd(0, 0.2)` s; `📦 Supply crates incoming!` (`#E8A838`, 2 s) on the first; crates land within 60 m of the strip (`story-beats.md` §2.2) |
| Landing | the bounce landing, roll-out, park; `Ed's back from his supply run!` (`#228B22`, 2 s) as the propeller stops; cooldown reset; `biplaneSeen++` |
| Total | about 60 s |

#### 2.4.3 Parachute crates

The AR §12 recipe with its speeds redesigned for a 20 m drop. Shape of every curve kept; the units changed.

| Phase | Value | v27 / strict |
|---|---|---|
| Release | at the plane's position with `rnd(−0.2, 0.2)` m x and `rnd(−0.15, 0.15)` m z jitter; `alt = plane.alt` (20 m on a supply run, 9–28 m on a flyover); `vx, vz = plane velocity × 0.3`; `spin = rnd(−4, 4)` rad/s; `swayPhase = rnd(0, 2π)` | ±8 / ±6 px; 30 % kept |
| Drift target | `rnd(−0.125, 0.125)` m/s; in `storm`, `sand` or `blizzard` `rnd(−0.5, 0.5)` m/s (`world-events-weather.md` §2.5.3) | `rnd(−5,5)` / `rnd(−20,20)` px/s, strict |
| Free fall | first 0.35 s: `vy += 8.75 · dt` (v27 350 px/s², strict); spin wanders `rnd(−2, 2) · dt` | kept |
| Canopy | deploys at 0.35 s; `chuteSize` 0.1 → 1 at 2.5/s (0.36 s); `chuteEffect = chuteSize²` | kept |
| Descent | `targetVy = 1.4 + 1.2 · (1 − chuteEffect)` m/s (2.6 → 1.4); `vy` lerps at 3/s; `vx` lerps to the drift at 1.5/s; spin lerps to 0 at 3/s; drawn rotation `spin · chuteDeploy · max(0, 1 − chuteSize)` (the tumble cancels as the canopy fills) | `18 + 15·(1 − e)` px/s is 0.45–0.83 m/s: a 12 s descent from 20 m instead of a 44 s one |
| Sway | rotation `sin(t·1.8 + φ) · 0.12 · size` rad; translation `sin(t·2 + φ) · 0.125 · size` m | 5 px, strict |
| Canopy mesh | a five-panel low-poly dome, radius 1.1 m, panels alternating `crate.canopyRed` `#C83C32` and `crate.canopyCream` `#FFF5E6`, a `rgba(0,0,0,0.15)` rim, a highlight facet; four shrouds as `LineSegments` `#786450` at 50 % to the crate's top corners | 16 px is 0.4 m; the design canopy is sized to the 0.6 m crate |
| Crate mesh | a 0.6 m cube: body `#8B4513`, bands `#7a3b10`, cross straps `#D4944A`, centre plate `#B37A2E` with a `#8B6914` core, a gold `E` decal `#E8A838` at 30 % on each face (v27's drawn `E`) | 14 px is 0.35 m; 0.6 m reads at the camera |
| Landing | `alt ≤ 0`: three decaying hops `bounceY = |sin(landBounce·π·3)| · 0.2 m · landBounce`, `landBounce` decaying at 3/s (0.33 s); 6 dust particles (AR §9.2: `#c8b88a`, ±0.75 m/s, up 0.125–0.5 m/s, life 0.4 s, size 0.05–0.12 m, drag 0.98); `crate.land` (`equip` 0.15) | kept |
| On the ground | 45 s life then despawn: v27 |
| Marker | a **gold lantern beam** 10 m tall at 0.10 (`beam.crate` `#E8A838`; the event-marker language of `world-events-weather.md` §2.5.3, shorter than the cart's 14 m because a crate is smaller); the attract glow as two emissive ring decals r 0.5 and 0.3 m pulsing `0.5 + 0.5·sin(t·3)` at 0.15 / 0.25; six spokes r 0.25–0.4 m rotating at 0.5 rad/s at 0.15; a floating arrow billboard 0.2 m wide at `0.35 + sin(t·3)·0.075` m above; a pooled `light.event` `#E8A838` 1.0 · 3 m when the pool has room, else emissive only | AR §12.4 in metres |
| Pickup | any hero within **1.5 m** (v27 45 px is 1.125 m; 1.5 m matches `heroes.md`'s revive radius): 60 % heal 30 % of max HP (60 % with `betterDrops`) with `Supply crate: Healed!` (`#3DCC7A`, 2 s); else `floor(rnd(20, 40))` gold (`rnd(40, 80)` with `betterDrops`) with `Supply crate: +N Gold!` (`#E8A838`, 2 s); `crate.pickup` (`equip` 0.3) | kept |
| Multiplayer | crates are host-authoritative; the first hero in range takes it | — |

Dev console: `dev.crates(n)` announces `DEV: N parachute crates dropped!` and `dev.ed.fly('supply')` announces `DEV: Supply flyover launched!` (both v27 dev strings, kept).

### 2.5 The repair chain handler

`edInteract()` ports as a state machine over `story.edQuestPhase` (0 = nothing started, 1–3 = that phase active, 4 = done), evaluated in v27's order on every `Talk`. Story gates from `story-beats.md` §2.4 are added where noted.

| Step | Condition | What happens |
|---|---|---|
| 1 Turn-in | `ground_ed_N` is `completable` for the lowest N | open `phaseN_return`; mark complete; run the reward; XP **through `addXP`** (v27 wrote `totalXP` directly and skipped the level-up check; fixed as intent) with the `+XP` particles; `edQuestPhase = N + 1`; `events.emit('questComplete')`; if N = 3: `quest_complete` 1–4 then `space_hint` ×4, `The Green Meanie lives again!` (`#228B22`, 4 s), `Well-Ed-ucated`, `edQuestPhase = 4`, `planeState = repaired`, camp C5, then CS-05; else auto-offer `ground_ed_{N+1}` (open `phase{N+1}_intro`, set `active`, `spawnQuestItem`) |
| 2 Offer | `ground_ed_N` is `available`, its prereq complete, and for N = 1 `squadAssembled && goblinKingDefeated` (`story-beats.md` §2.4) | open `phaseN_intro` with `quest_intro` ×4 (N = 1); set `active`; `edQuestPhase = N`; `spawnQuestItem`; `❗ Quest Accepted: Ground-Ed: The Propeller` etc. (FC §5.4) |
| 3 Crater awareness | `edQuestComplete && craterVisited && meteorSeen && !edCraterDialogue` | this is CS-06, not a talk: the director moves Ed to the rim (§2.1.6) and the beat fires when the party reaches him; the handler still latches `edCraterDialogue` and opens `crater_awareness` with `ed_crater` (Noah, Isabella) if the party talks to him there |
| 4 Crater hint | `craterDiscovered && meteorSeen && !edQuestComplete && !edCraterHint` | open `crater_hint` 1–3 **[new text]**; latch `edCraterHint`; no reaction |
| 5 Post-quest | `edQuestComplete` | open `post_quest` 1–5 with `space_hint` for heroes who have not said it |
| 6 Default | — | one `greetings` line by the rotation with `quest_intro` for heroes who have not said it |

Turn-ins happen at the plane on whichever island it is on: `phase1_return` on the Frozen strip, `phase2_return` on the Causeway, `phase3_return` at Ed's Landing (`story-beats.md` §2.5). Each turn-in swaps the part on the plane in view (§2.2.2) with a 0.4 s `equip` chime and a small dust puff at the part.

**Rewards, made real.**

| Quest | Canon reward text | Effect |
|---|---|---|
| `ground_ed_1` | `Aviator Goggles + 100 Gold` | +100 gold, 75 XP; `story.edGoggles = true` → a scrapbook memory item `Aviator Goggles` (`ui-ux.md`) **and** the four kids wear aviator goggles on their foreheads during every flight from then on (a `hat` socket on the hero rigs, requested from `heroes.md` in §5; a cosmetic, never worn in combat) |
| `ground_ed_2` | `Ed-ible x3 + 100 Gold` | +100 gold, 100 XP; `story.edEdibles = 3` → three **Ed-ible** consumables in the stash (name from the canon reward text; description `Grandpa's snack. Heals every hero.` **[new text]**): each heals every unlocked, living hero 40 % of max HP; potions heal a flat 15 (SI Part 1 §24.1), so `Tip: Ed-ible snacks heal more than regular potions. Grandpa knows best.` is literally true; never sold, never dropped; Isabella's `snack_reward` fires on the award |
| `ground_ed_3` | `Better supply drops + 150 Gold` | +150 gold, 150 XP; `edQuestComplete`, `betterDrops` (6–10 crates, 60 % heal, 40–80 gold) |

**The hangar from Ed's side.** `camp.md` owns the hangar prop, the bench, the tools and the whittled propeller on the wall. From this file's side the hangar is: the plane's parking mark under its roof at (16, 0) while it is not `repaired`, and the apron mark 4 m east of its mouth at (24, 0) from `repaired` on (§2.3.1); Ed's tinkering mark at the nose; the two hangar shouts at 12 m and 8 m as the squad first approaches with `goblinKingDefeated`; the 6 s tinkering tier while the plane is not `repaired`; and the parts swapping in place. If `camp.md` places the hangar's mouth elsewhere on the strip, both marks follow it and the Ed mark follows the nose.

### 2.6 The five guides

#### 2.6.1 Rules shared by every guide

- **A post, not a random point.** v27 scattered guides by 80 random tries and sometimes failed to place one (SI Part 2 §3.3). Each guide now has a fixed post from `story-beats.md` §2.2 and a post prop it interacts with (`world-builder` builds the hub props from the story-beats landmark tables; this file names only the piece the NPC's idle touches). No guide is ever absent.
- **One prop, two lobes.** Each guide has one silhouette prop and a height step off every kid (1.45–1.95 m against 1.14–1.52 m) with an adult head ratio (4–4.6 heads). Rigs: the hero builder with a proportion table; ≤ 1,000 tris; props ≤ 200.
- **Two independent motion sources minimum** in every idle, at incommensurate rates (AR §19.2's lesson, as `enemies.md` §2.2 applies it); the table below names them. The 3 / 10 / 30 s idle ladder of `heroes.md` §2.4.6 applies with guide-specific tiers.
- **Proximity and bubbles** (v27 numbers kept): a hero within **1.5 m** (60 px) of a guide sets `visited`, fires `updateQuestProgress('talk_to', {npcName})` for any unlocked living hero (companions count, as v27), and shows the bubble for 5 s; the bubble clears when no hero is within **3 m** (120 px); `npcTalkCD` 1 s after any quest interaction. The bubble text follows the precedence: turn-in template → offer template → in-progress template → the flavour line by the three-line rule → the all-done trio (random). Templates are FC §4.2 verbatim; their `SPACE` is the keyboard variant of an input-aware prompt (`ui-ux.md`, the `story-beats.md` precedent).
- **The three-line rule** (`story-beats.md` §2.5): line 1 on the first talk; line 2 while the guide's dungeon (or lair, for Quartz) is uncleared and no quest template applies; line 3 on the first talk after it is cleared, then the all-done trio on later talks while the bubble shows the trio. The dialogue box on `Talk` opens with the same line as the bubble, with the portrait and the typewriter, and the offer or turn-in confirmation follows it.
- **Portraits:** three frames each, `neutral`, `warm` (lines 1 and 3, offers), `grave` (line 2, in-progress), rendered from the rig (§2.1.7).
- **Markers** (Brief §6, lantern beams; `ui-ux.md` renders): a vertical soft beam over the guide, 12 m tall, colour by quest state: `beam.offer` `#E8A838` (v27's gold `!`), `beam.turnIn` `#3DCC7A` (v27's green `✓`), none while a quest is merely in progress (v27's grey `...` becomes the compass pip only); the beam's base ring, 1.2 m, is the guide's `ui` colour so the beam says *who* as well as *what*. The v27 glyphs `✓` / `!` / `...` stay in the journal. Ed's beams stand over the Ed mark; the plane's cockpit step gets `beam.offer` when an unlocked island has an open quest (`story-beats.md` §4).
- **Hue check, all guide bodies:** Elm `#5E4224` 31° / 25 % (Noah 27° / 54 %: 29 % apart, passes); Quartz `#4A4470` 248° / 35 % (28° from Liam, 26° from Collette, passes); Neve `#1B2A5A` 226° / 23 % (Liam hue within 20°, lightness 26 % apart, passes); Fern `#7FA68F` 145° / 57 % (no hero within 60°); Sol `#EDE3CF` 40° / 87 % (Noah hue within 20°, lightness 33 % apart, passes) with sash `#4A2C6B` 269° / 30 % (Collette hue within 20°, lightness 28 % apart, passes). The v27 `col` values that would have failed as bodies (Sol's `#E8A860` at 32° / 64 %, in Noah's band) survive as `ui` tokens only.

#### 2.6.2 Rootkeeper Elm (Forest, the Rootways gate)

| | |
|---|---|
| Silhouette | a bark column 1.95 m tall under a 0.9 m leaf disc (a flat hat that is a canopy), no visible legs: he is rooted; a 2.2 m root-staff rising past the disc |
| Palette | `npc.elm.base` `#5E4224` bark coat (50 %), `npc.elm.dark` `#3B2A16` (25 %), moss shoulder-cape `#3A7D44` (12 %), `npc.elm.accent` `#58B888` leaf-buds on the hat rim and staff, lichen beard `#D9E2C4`; `ui` `#58B888` |
| Face | deep-set eyes under a heavy brow ridge, a lichen beard (fictional; allowed), a slow blink every 8 s |
| Post | between the two root pillars of the Rootways gate at (120, 10), facing west toward camp; his roots run into the gate's roots (a 2 m root decal) |
| Motion sources | breathing at 1.0 rad/s (a tree's); the three leaf-buds and the hat rim on the wind uniform; a slow head turn toward the nearest hero (2/s) |
| Idle ladder | 10 s: taps the staff; a root creeps 0.3 m from his base and retracts (a decal). 30 s: closes his eyes; the buds glow `#58B888` emissive 0.6 for 4 s |
| Lines | 1 `The old roots still remember your name, young heroes...` · 2 `The Hollow Grove Treant draws strength from the earth. Sever the roots!` · 3 `The forest breathes easier since you walked through. Well fought.` (dungeon `forest`) |
| Quests | `forest_1`, `forest_2`, `forest_3` (`story-beats.md` §2.4); `forest_2`'s target is Quartz, whose plate reads `the Crystal Sage` |
| Read at distance | the only tree with a face; a column under a disc |

#### 2.6.3 Lamplighter Quartz, the Crystal Sage (Forest, Lamplight Landing)

| | |
|---|---|
| Silhouette | short and stooped (1.45 m), a hooded coat, under a straight 2.6 m pole with a lamp at the top: the tallest prop in the game over the shortest adult |
| Palette | `npc.quartz.base` `#4A4470` slate-violet coat (55 %), `npc.quartz.dark` `#2C2846` (25 %), `npc.quartz.accent` `#8E98D8` on the crystal pendant, the lamp's glass tint and the hood lining; the lamp flame `#FFB347`; `ui` `#8E98D8` |
| Face | round spectacles (fictional; the Sage), a white moustache is **not** given (keep the family's only moustache question for Ed, §8); eyes that catch the lamp |
| Post | the lantern hook at Lamplight Landing (0, 125) on the south cliff, which is (0, 0) in the cave frame; the pole-lamp hangs on the hook while he idles; a stair down beside him. The name plate's second line `the Crystal Sage` **[new text, story-beats §2.7]** |
| Light | the pole-lamp is a placed `light.lantern` (`#FFB347`, 1.0, 4 m) on the torch oscillator (`world-events-weather.md` §2.8.3) so flame and light agree; warm against violet crystal is the read |
| Motion sources | the lamp's pendulum on its hook (0.9 rad/s); breathing; the pendant's swing (1.4 rad/s) |
| Idle ladder | 10 s: lifts the pole and trims the flame (light ×1.3 for 1 s). 30 s: walks 4 m to the nearest unlit wall-lamp on the cave stair, lights it (emissive on; no pooled light), walks back: he is the lamplighter |
| Lines | 1 `These halls have waited a long time for lamplight...` · 2 `Crystal Colossus reflects projectiles. Get in close when the shield shimmers.` · 3 `You carry brightness where it matters most.` (lair `cave`, the Colossus) |
| Quests | `cave_1`, `cave_2`, `cave_3`; `forest_2` completes by standing near him |
| Read at distance | a warm lamp on a very tall pole under the island's lip, and a small shape at its foot |

#### 2.6.4 Hearthkeeper Neve (Frozen Peaks, the Hearth)

| | |
|---|---|
| Silhouette | a round bundle 1.60 m tall and 0.50 m across the shoulders, a white fur hood rim, an iron hearth-pot held at the middle with a warm glow, breath fog every 4 s |
| Palette | `npc.neve.base` `#1B2A5A` indigo coat (55 %), `npc.neve.dark` `#0E1838` boots and mittens (20 %), fur trim `#F2F7FF` on the hood, cuffs and hem (15 %), frost embroidery `#A8D0E8` (5 %), the pot's embers `#FF9A3C`; `ui` `#A8D0E8` |
| Why indigo | snow-white would vanish on snow; Liam's sapphire is 26 % lighter and carries a shield disc; the pot's warm glow at her centre is the thing no hero has |
| Face | red cheeks (cold), a kind squint, a wool scarf under the chin |
| Post | her hut's door at (0, 0) with a bench beside it; the hut's chimney smokes; the strip 20 m south |
| Light | the hearth-pot: `#FF9A3C`, 0.8, 3 m, flicker ±12 % at 7–9 Hz shared with the ember mesh (the campfire's oscillator rule, `world-events-weather.md` §2.8.2) |
| Motion sources | the ember flicker; breath fog (a 0.3 s puff every 4 s); stamping her feet every 5 s (cold) |
| Idle ladder | 10 s: blows on the embers (light ×1.4 for 0.5 s, sparks). 30 s: sits on the bench with the pot on her lap and looks up at the Observatory |
| Lines | 1 `Come warm yourself. The ice is patient, but you needn't be...` · 2 `The Frost Lich summons blizzards. Hit hard to break the channel.` · 3 `Beyond the ice lies the final challenge. You are ready.` (dungeon `frozen`) |
| Quests | `frozen_1`, `frozen_2`, `frozen_3` |
| Read at distance | a dark round shape with a warm point at its heart, in the snow, breathing |

#### 2.6.5 Mistweaver Fern (Murky Swamp, the Long Causeway)

| | |
|---|---|
| Silhouette | hunched (1.55 m) under a fringed shawl whose fringes hang to the knee and move; a 1.9 m hooked staff with an amber lantern swinging from the hook |
| Palette | `npc.fern.base` `#7FA68F` mist-sage shawl (50 %), `npc.fern.dark` `#4A3524` rot-brown dress (30 %), `npc.fern.accent` `#70C090` on the fringe tips and the staff's binding, the lantern `#FFB347`; `ui` `#70C090` |
| Face | old, sharp, amused; a long braid of grey; eyes that narrow at the mist |
| Post | the jetty's end at (0, 0), a stool, the first lantern post of the causeway chain beside her; the frog's home after `swamp_2` |
| Light | the hook-lantern: a placed `light.lantern` (`#FFB347`, 1.0, 4 m) on a 1-bone pendulum (0.9 rad/s) |
| Motion sources | the lantern pendulum; her weaving hands (two `pt.wisp` particles per second curl between them and fade: she weaves mist); a slow rock on the stool (0.4 rad/s); the fringes on the wind uniform |
| Idle ladder | 10 s: lifts the lantern and peers into the mist (light ×1.3 for 1 s). 30 s: if the frog is home it hops to her and she scratches its head |
| Lines | 1 `The mist has moods, child. Today it whispers your name...` · 2 `The Hydra has many heads. Kill it before it splits!` · 3 `Heh, you turned the marsh from a trap into a trail.` (dungeon `swamp`) |
| Quests | `swamp_1`, `swamp_2` (the escort, §2.9), `swamp_3` |
| Read at distance | a hunched fringe under one swinging amber light at the end of a line of lights |

#### 2.6.6 Dunewalker Sol (Scorching Sands, the Oasis)

| | |
|---|---|
| Silhouette | tall and thin (1.85 m, shoulders 0.40 m) under a flat 0.8 m sun hat; a 2.0 m walking staff with a gourd and a 0.6 m cloth strip streaming from its top; he is never standing still |
| Palette | `npc.sol.base` `#EDE3CF` sun-bleached robes (60 %), `npc.sol.dark` `#4A2C6B` dusk-violet sash and turban wrap (20 %), `npc.sol.accent` `#1FA3A0` beads and the gourd's strap, the hat's underside `#E8A860` (5 %; v27's colour where it can be seen from below, never from the camera); `ui` `#E8A860` |
| Why bone and violet | every warm desert tone (ochre, sienna, v27's `#E8A860`) sits in Noah's band; bone is the Brief's desert token and violet is its sky; a pale figure with a violet sash is the desert's own palette walking |
| Face | sun-lined, calm; eyes shaded by the brim; the head look-at prefers the horizon |
| Post | the Oasis shade at (0, 0): one palm and a low stone wall; he paces a 4 m line between the palm and the water at 0.6 m/s, pausing 2 s at each end; the pace is the post |
| Motion sources | the pacing; the cloth strip on the wind uniform; the hat brim flexing (0.7 rad/s); breathing |
| Idle ladder | 10 s: crouches and reads the sand (draws a line with one finger; a footprint decal appears and fades in 20 s). 30 s: drinks from the gourd and looks at the pyramid's tip |
| Lines | 1 `Sand remembers every footprint, if you know how to read it...` · 2 `The Pharaoh Wraith blinks between sun-marks. Track the afterimage.` · 3 `The desert respects those who keep walking.` (dungeon `desert`) |
| Quests | `desert_1`, `desert_2` (anchored to the Nomad, §2.8), `desert_3` |
| Read at distance | a pale line under a flat disc, walking; in the sandstorm, the only thing still moving in a straight line |

### 2.7 The merchant

| | |
|---|---|
| Silhouette | 1.70 m under a wide hat with a small bell, a hooded cloak that hides the face in shadow (a warm smile is visible; nothing else), and a pack-stall on his back taller than he is when he walks; set down, it unfolds into the stall (`camp.md` owns the stall prop at Stewart Camp and the folding version at each hub) |
| Palette | `npc.merchant.base` `#2A1A33` plum-black cloak (60 %; 278° / 15 %, 43 % darker than Collette, passes), `npc.merchant.dark` `#120A1F` (20 %), wares glinting in `#2EB8A6`, `#E8A838`, `#3DCC7A` (bottles, a scroll, a ring), brass buckles `#B8863B`; `ui` `#E8A838` (v27's merchant colour) |
| Beam | `beam.merchant` `#A57BE8`, 14 m, at 0.12 for 8 s on arrival, then a 4 m stall beam at 0.06 permanently (`world-events-weather.md` §2.5.3: the violet beam over the stall) |
| Motion sources | the bell (0.9 rad/s, a soft chime `merchant.chime` on each swing when a hero is within 6 m); the stall's hanging wares swaying at three rates; a slow hand-rub every 6 s |
| Arrival | at Stewart Camp from C2 **and** `teamLv ≥ 3` (v27's gate, kept, so a first-timer meets him after the first rescues): `A mysterious merchant has appeared!` (`#E8A838`, 3 s), `events.reserve('merchantArrival', 10)`, the beam; thereafter he is at the camp stall whenever the squad is on the Forest island |
| Other hubs | he is **already there** when the party lands on any island (the joke: the mysterious merchant is always first), at the hub's folding stall, from the first landing; no announce on those |
| Stock | `pickMerchantStock()`: 4 distinct of the 8 `MERCHANT_STOCK` items, names, descriptions and costs FC §11.8 verbatim; sold items leave the stall; **restock** to a fresh 4 at every dawn (`world.clock.p` crossing 0) and at every landing (v27 never restocked, so a long game had an empty stall); `Merchant sold out!` when empty between restocks |
| Interact | `[SPACE] Trade` (canon prompt, keyboard variant) within 2.0 m (v27 80 px); the overlay `🧙 MERCHANT` / `Rare goods from distant lands` / `CLOSE` is `ui-ux.md`'s scrapbook page; the sim pauses while it is open (CM §9) |
| Effects | Elixir of Power, Speed Brew, Mega Potion (`All heroes healed!`), Tome of Knowledge (`+N XP!`), Lucky Charm (`Lucky Charm equipped!`, +0.05 crit on the active hero as a session-only modifier layer, matching `+5% crit for session`), Rally Beacon (`Rally!`: companions fade-teleport to their formation slots, `heroes.md` §2.5.11): as v27. **Shield Potion** (`Absorb 50 DMG`): the `shield` buff is read in `takeDmg` and absorbs 50 damage over 30 s (v27 never read it). **Scroll of Respec** (`Reset 1 hero skill tree`): `heroes.md` §2.5.10's baseline recompute, refund `sum(tiers)`, `<HERO> skills reset! +N points` |
| Bounty | `Big Spender` counts each buy (`updateBountyProgress('merchant', 1)`) |
| Dialogue | none; v27 gave him no lines and none are added. He nods |
| Read at distance | a dark hood under a violet beam with three glints |

The bounty board is a prop (`camp.md` at Stewart Camp; `story-beats.md` §2.8 puts one at each hub). This file's only claims on it: its pulsing `!` becomes `beam.turnIn` when a completed bounty is unclaimed, the `⚔️ BOUNTY BOARD ⚔️` strings port verbatim through `ui-ux.md`, and `Bounty complete: <name>!` uses `achieve` at 0.3 because v27's `questComplete` sound was undefined (AI §12; `audio.md` may define one).

### 2.8 The Bog Witch and the Sand Nomad

Both are `story-beats.md` §2.7's definitions with bodies. Their `NPC_DEFS`-style entries port as story-beats wrote them (`Bog Witch`, `swamp`, `#7B3CA0` / `#4A2560`, 🧹; `Sand Nomad`, `desert`, `#EDE3CF` / `#B3541E`, 🐪), with `col` as the `ui` token and the body tokens below (§5 records why).

#### 2.8.1 The Bog Witch

| | |
|---|---|
| Silhouette | 1.50 m, crooked, under a 0.5 m bent hat (the tallest thing on her), a 1.6 m broom in both hands; on the porch of a hut on stilts at (−90, 70) with one green window |
| Palette | `npc.witch.base` `#4A2560` robe (60 %; 278° / 26 %, 32 % darker than Collette, passes), `npc.witch.dark` `#2A1438` hat and boots (20 %), `npc.witch.accent` `#7B3CA0` hat band and broom binding (10 %), skin lichen-grey `#B8C0A8`, the window `#6CE87A`; `ui` `#7B3CA0` |
| Face | a long nose, a wide mouth, bright eyes: gruff and kind (story-beats' brief); no warts, no green skin, no cackle |
| Post | the porch; a pot on the porch rail bubbles (`pt.spore` bubbles, 2/s); the frog spawns under the porch |
| Motion sources | the sweep cycle (1.1 s, the broom); the hat's tip sway (0.6 rad/s); a head shake ("hmph") every 8 s; the pot's bubbles |
| Idle ladder | 10 s: stops sweeping, leans on the broom, looks at the party. 30 s: goes in (the door), the window brightens, comes back out with the pot stirred |
| Lines **[new text, story-beats §2.7, verbatim]** | 1 first talk `Hmph. Visitors. The mist doesn't usually let visitors through.` · 2 `swamp_2` active, frog present `Found this one shivering under a lily pad. He's Fern's. He only hops toward light, so light the way.` · 3 frog lost, quest reset `Back under the lily pad, is he? Go on. I'll fetch him. Lanterns first, this time.` · 4 `swamp_2` complete `Fern's got her frog back. The mist's in a better mood already.` |
| Portraits | 3 (`neutral`, `warm`, `grave`) |
| Markers | no quest of her own; `beam.offer` over the hut while `swamp_2` is active and the frog has not yet left the porch (the party must come here first); `beam.offer` again after a failure (she is the retry point, §2.9) |
| Read at distance | a bent hat and a broom on a crooked porch with one green window |

#### 2.8.2 The Sand Nomad

| | |
|---|---|
| Silhouette | 1.80 m standing, 1.10 m seated cross-legged (his default) beside a low tent, a tea kettle on a small fire, and a camel tethered 3 m away; a sienna head-wrap; a heavy dark cloak |
| Palette | `npc.nomad.base` `#EDE3CF` robes (50 %), `npc.nomad.dark` `#4A3524` cloak (30 %; 31° / 22 %, 32 % darker than Noah, passes), `npc.nomad.accent` `#B3541E` head-wrap and sash (12 %; story-beats' `dark`, kept as the accent because sienna at 22° / 41 % sits inside Noah's band); `ui` `#EDE3CF` |
| The camel | a static-idle animal prop 2.1 m at the hump, dun-grey `#8E8A80` (5 % saturation, so the hue rule is moot), chewing (jaw 0.8 rad/s), a tail flick every 5 s, an ear turn toward the nearest hero; ≤ 600 tris; never targetable; owned here because `world-events-weather.md` §5.2 declined it |
| The awning | a 3 × 2 m cloth on two poles over the sitting spot, `#EDE3CF` with a sienna edge stripe; the desert's shelter for the sheltering caption (`world-events-weather.md` §2.7.3) |
| Motion sources | the kettle's steam (`pt.dust` recolour, 1/s); the awning on the wind uniform; a slow nod every 6 s; the camel's chewing beside him |
| Idle ladder | 10 s: pours tea, offers the cup toward the party (the `Sit, if you like`). 30 s: stands, walks to the camel, checks the tether, sits again |
| Lines **[new text, story-beats §2.7, verbatim]** | 1 first talk `The sand moves, so I move. Sit, if you like. It won't be here tomorrow.` · 2 `desert_2` active `Three cairns mark my old trail. Find them before the wind does.` · 3 `desert_2` complete `You walked it. Not many do. Sol will want to hear about that.` |
| Quest anchor | `spawnQuestWaypoints` anchors to him: the three `WAYPOINT` cairns at `story-beats.md`'s (140, −90), (60, −140), (−90, −110), each with a flag in his sienna; the label `WAYPOINT` verbatim |
| Portraits | 3 |
| Markers | `beam.offer` over his camp while `desert_2` is active and he has not been talked to; the cairns each get a short 6 m `beam.offer` until visited |
| Read at distance | a seated shape beside a camel under a pale awning, smoke rising |

### 2.9 The frog familiar and the escort

#### 2.9.1 The frog

| | |
|---|---|
| Body | 0.40 m long, 0.22 m tall sitting, 0.30 m wide; a low-poly frog of ≤ 250 tris; label `🐸 Familiar` (canon) as a billboard 0.5 m above it (`ui-ux.md` frames it) |
| Palette | `npc.frog.base` `#3C8A5C` moss-green back (145° / 39 %, no hero within 60°), `npc.frog.dark` `#2A5C3E` legs and spots, `npc.frog.glow` `#6CE87A` throat and belly, emissive 1.5 on the bloom layer pulsing `0.6 + 0.4·sin(t·5)` (the bog's phosphor token: it is a bog creature), eyes `#E8A838` with horizontal pupils |
| Findable in the dark | the emissive throat is visible at 30 m in the Bog's fog; plus a pooled `light.event` `#6CE87A` 0.6 · 2.5 m at event-marker priority (`world-events-weather.md` §2.8.2), so it has a light whenever the pool has a slot; plus its label; plus a compass pip in `#3DCC7A` (v27's minimap dot colour, L3401) |
| HP | `50 + 5 × teamLv` (canon); an always-on HP bar in `#6CE87A` (the guardian rule of `enemies.md` §5) |
| Motion | a hop of 0.9 m and 0.35 m high taking 0.45 s, so 2 m/s on the move (`story-beats.md` §2.4); idle: the throat pulse (0.8 Hz), a membrane blink every 3 s, a turn toward the nearest lit post; 10 s: a tongue flick at any `pt.wisp` particle within 1 m; nervous (waiting at an unlit gap): the throat pulse at 1.5 Hz and a shiver |
| Steering | `heroes.md` §2.5.11's companion steering (capsule sweeps against the collision world, a 4 s stuck timer, then a 0.3 s fade to the nearest lit post) with its own target rule below; v27's `rnd(−20, 20)` un-stick teleport is gone |
| Sound | `frog.hop`, `frog.croak` (idle, every 6–10 s), `frog.hurt`; names for `audio.md` |
| Lines | none; v27 gives it none and none are added |

#### 2.9.2 The lantern-post rule (the overworld instance of the Bog's mechanic)

Seven posts from (−80, 60) to (−30, −100), about 24 m apart (`story-beats.md` §2.2), each a 2.2 m post with an amber lantern (`light.lantern` placed, `#FFB347`, 1.0, 4 m, on the torch oscillator). `dungeons.md` owns the mechanic's language for the Sunken Temple; these are its overworld numbers:

| Rule | Value |
|---|---|
| Lighting a post | a hero within 1.5 m for 1.5 s lights it (a reach-up clip); **Collette lights it in 0.3 s** when she is the one in range (her orb touches it: she carries her own light, `heroes.md` §2.1.2) |
| Lit duration | 40 s after the last hero leaves 1.5 m; a hero standing there keeps it lit indefinitely |
| Gutter | the last 3 s: the oscillator's amplitude doubles (the flame flares and dips), then out; `lantern.gutter` |
| Ground read | a 3 m ground-glow decal `#FFB347` at 0.18 under every lit post, so the lit stretch reads even when the light pool is full and the post runs emissive-only |
| A lit stretch | both posts at its ends lit; the frog will cross it |
| A dark stretch | either end unlit; the frog waits at the last lit post; the stretch's **wisp hollows** arm (`enemies.md` §2.8: the Wraith's nest): 1–2 Wraiths emerge within 8 m of the frog after 3 s; they blink away (`glow_burst`) the moment the stretch is lit again. `story-beats.md`'s "wisps" are these Wraiths plus the harmless `pt.wisp` particles, which crowd the frog in the dark and scatter in the light |
| Other natives | Sneaky Shrooms dormant on the path (wake at 3 m); Bats at night; a Goblin Healer camp 20 m off the route at post 5 (`enemies.md` §5: Wraith, Bat, Sneaky Shroom, Goblin Healer) |

#### 2.9.3 The escort, start to end

1. **Accept** `swamp_2` at Fern (`❗ Toxic Harvest: Escort the frog familiar to safety. [SPACE to accept]`). The frog spawns under the Witch's porch at (−90, 70); `beam.offer` over the hut. The compass strip's escort entry points at the frog.
2. **First contact.** When any hero comes within 2 m of the frog: Noah's `swamp_item` fires if he is present (`story-beats.md` §2.5), the Witch's line 2 plays on her next talk (or her bubble shows it), and the frog's target rule begins.
3. **The walk.** Target = the next post in order if lit, else wait. The frog hops between posts along the path, never straying more than 3 m from the post line; it follows the *posts*, not the heroes, so the party's job is to run ahead and light, then come back and guard. Seven posts, about 170 m, roughly 90 s at a good pace.
4. **Threat.** The frog is a valid enemy target: an enemy within 2 m of it and with no hero within 4 m prefers the frog; every enemy hit on the frog deals `enemy.dmg × 0.3` (v27); a telegraphed attack that includes the frog in its shape hits it like a hero. Wraiths from the dark stretches always prefer the frog.
5. **Arrival.** Within 2 m of Fern (v27 30 px of the destination): `🐸 Familiar arrived safely!` (`#3DCC7A`, 3 s), `updateQuestProgress('escort_npc')`, `swamp_2` completable; the frog hops onto the jetty and lives there (§2.6.5's 30 s idle). `Poison immunity` on turn-in.
6. **Failure.** HP 0: `🐸 Familiar died! Talk to Bog Witch to retry.` (`#D84830`, 4 s); the frog dissolves in 0.45 s into a spore puff (it went back under the lily pad); `swamp_2` → `available` and out of `activeQuests` (v27); `beam.offer` over the Witch's hut.
7. **Retry.** Talk to the Witch: her line 3, the frog reappears under the porch, `swamp_2` → `active` again **without walking back to Fern** (the canon string says talk to the Witch, so she is the re-accept point); posts keep whatever state they are in.
8. **After.** The Witch's line 4 on later talks; Fern's line 3 after the Sunken Temple.

The escort is the Bog's language previewed in the overworld (`story-beats.md` §2.2): light is safety, dark is Wraiths, and the smallest character in the game carries the only light that moves.

### 2.10 Gran / Grambi

Gran never appears. Every reference, and where each is delivered:

| Reference | Speaker | Where |
|---|---|---|
| `Tip: Gran always said the sky had more in it than stars.` (tip 12) | UI | the title and loading rotation after `edCraterDialogue` (`story-beats.md` §2.5) |
| `Gran used to tell stories about lights like these when I was growing up...` | Ed, `crater_awareness` 2 | CS-06 |
| `She'd say: 'Eddie, the sky has more in it than stars. And some of it is watching.'` | Ed, `crater_awareness` 3 | CS-06 |
| `Everyone thought she was telling fairy tales. I wasn't so sure.` | Ed, `crater_awareness` 4 | CS-06 |
| `Wait — Gran knew about THIS? How long has this been going on?` | Noah, `ed_crater` | CS-06, after line 5 |
| `Is this from Grambi?? It better be from Grambi.` | Isabella, `snack_reward` | the `Ed-ible x3 + 100 Gold` award (B2.9) |

Rules: no entity, no portrait, no voice, no photograph in the scrapbook, no line about her anywhere new; the Ed-ible's description does not name her (§2.5); `Eddie` appears only inside Gran's quoted line, never on a name plate or a card. `world-events-weather.md` and `story-beats.md` already kept to this; it stays so.

### 2.11 Dialogue delivery

| Element | Rule | v27 |
|---|---|---|
| The queue | `openDialogue(charKey, category)` queues the whole category in order (blocks play whole, `story-beats.md` §2.3 rule 4), then the party lines for the context in their fixed order, each `{text, name, col, portrait, mood}`; a hero absent or downed is skipped and not marked fired | one active-hero reaction |
| Typewriter | 120 characters per second on the UI clock (v27's two per frame at 60 Hz), independent of the sim step | 2/frame |
| Advance | first press completes the line; second advances; past the end the box closes and emits `dialogueClose` | kept |
| Inputs | Interact (Space / A / tap on the box), plus Enter and left click; **hold** Esc / B / a two-finger tap 0.8 s to skip the whole block with a `Skip` label (always available; the block's lines are still marked heard); the `▶` pulses at `0.5 + 0.5·sin(t·6)` when a line is complete | Space only |
| The freeze | the sim does not step while the box is open (CM §9, kept): no enemy AI, no timers, no biplane, no clock. Render-side motion continues (tree sway, particles, the scarf, cloth, the torch oscillators), so the world breathes behind the box instead of dying | everything frozen, including animation |
| Speaker colours | NPC name plate and portrait ring in the NPC's `ui` token; a hero's name in `hero.<x>.base` and ring in `hero.<x>.glow` (`story-beats.md` §2.3 rule 1) | Ed `#228B22`, heroes `HDEFS.col`, no portrait |
| Portraits | the rig-rendered atlas (§2.1.7): Ed 8 frames by mood tag, guides / Witch / Nomad 3, the kids 3 (`neutral`, `bright`, `grit`; `ui-ux.md` picks by context: `bright` for `quest_intro`, `space_hint`, `victory`; `grit` for `boss_appear`, `crash_landing`; else `neutral`) | one drawn portrait |
| Bubbles | proximity speech bubbles (guides, Witch, Nomad, Ed's hangar shouts and weather line) do not freeze the sim; 5 s; word-wrapped; the `icon` field of `NPC_DEFS` is kept as data on each NPC and `ui-ux.md` decides glyph or drawn icon | kept |
| Announces | the `#228B22`, `#E8A838`, `#3DCC7A`, `#D94848`, `#D84830` strings of §3.6 and §5.4 stay announces at their durations, on the announce channel `ui-ux.md` owns | kept |
| Captions | in-flight lines and CS-01's lines are cutscene captions with the speaker's portrait, timed by `cutscenes.md`, skippable with the cutscene | — |
| Log | every delivered line is appended to a dialogue log page in the scrapbook (requested from `ui-ux.md`) so a skipped `crater_awareness` can be read again | — |
| Multiplayer | the host's talk opens the box on every client; any client may advance; the host's advance wins on conflict | host-only |

### 2.12 What is cut or replaced, with the reason

| v27 thing | Fate | Why |
|---|---|---|
| Random-scatter NPC placement (SI Part 2 §3.3) | replaced by posts | a guide could fail to exist; posts anchor the story |
| `dlgIdx` never advancing | replaced by the three-line rule | lines 2 and 3 were never shown |
| All six greetings every talk | replaced by the rotation | `story-beats.md` §2.3 |
| The drawn `'ed'` portrait and dead moods | replaced by the rig atlas and the 8-frame map | mood tags were authored intent |
| The random crash and pre-Ed flyovers | CS-01 and C4 (`story-beats.md` §2.9) | — |
| 100 px/s, 150 px altitude, 3 px sputter, 40 px spiral | design values (§2.2.4) | strict conversion gives a plane slower than a running kid at tree height |
| The lozenge landing and the straight-line walk | a real landing and real steering | — |
| Crate descent 33 → 18 px/s | 2.6 → 1.4 m/s | a 44 s descent from 20 m would empty the sky of meaning |
| `edGoggles`, `edEdibles` as dead flags | goggles in flight; three snacks | the reward text should be true |
| Quest XP bypassing `addXP` | through `addXP` | a level-up could be missed |
| The merchant relocating every 30–60 s and never restocking | fixed stall, always at the hub, restocks at dawn and landing | a wandering merchant on an authored island is a chase, not a shop |
| The Shield Potion doing nothing | absorbs 50 for 30 s | the description is canon |
| The escort's straight line, 1 %/frame damage roll and `rnd(−20,20)` un-stick | posts, hits, steering | it never ran; now it is the Bog's set piece |
| `FAMILY_NPC_DEFS` as an unread table | read: it is `src/content/npcs/ed.ts` | — |
| `ED_LANDING` as one point | strips per island | travel |

---

## 3. What preserves the magic

### 3.1 Recipe by recipe (ATMOSPHERE_RECIPES section numbers)

| Recipe | Kept, translated, or replaced | Where, and why the feeling survives at the gameplay camera |
|---|---|---|
| **§19.3 / §11 the biplane as four independent noise sources** | **kept as the method, then extended** | Course wander (same cadence, now a lateral offset), bank lag (same rates), wobble (same roll term plus pitch and bob), sputter (same interval, a drop that reads in metres) all run on every flight (§2.2.3); the shadow blob's alpha is the same curve in metres; the static blade on a sputter is kept because "it is the joke". Extended: the plane-state ladder makes the sources *diegetic*: the hopping plane stalls, the rudderless plane crabs, and the sputter never fully goes away because `post_quest` line 1 says it is a slightly bumpy dream. A kid feels the plane get better because they fixed it. |
| **§11.1 flyover choreography** | intervals, the 40/60 roll, the announces, the crate counts and the `Frequent Flyer` counter **kept verbatim**; entry, speed and altitude **replaced** | The camera fact (§2.2.8) means a crossing must be low and lateral to be seen at all; 14 m/s over a 250 m buzz line lasts about as long as a v27 screen crossing, and the sound arrives first, which v27 never had. |
| **§11.2 aerobatics** | durations, cadence, the 50/50, the easing **kept**; the `scaleY` fake **replaced** by a real loop | The loop's radius follows from the canon 1.8 s at the design speed (3.4–4.0 m), so it is a toy loop over the party's heads, and the top of it can leave the frame and come back, which reads as *up there*. The wing-rock wave is new and is the canon tip made playable. |
| **§11.3 drawing** | wing green, cowling, struts, red tail, the bolt dots, the tip caps **kept**; fuselage amber → Cub yellow; the rudder green | The tip says yellow; the canon says the rudder is green; both are now literally true on the model. |
| **§11.4 the scarf** | **kept verbatim** as a six-bone chain with the seven frequencies and the colour taper | Full amplitude on Ed, half on Noah (`heroes.md` §3.1): the rhyme is preserved by the difference. In the plane the scarf is still the only part of Ed that moves in the silhouette. |
| **§11.5 the crash** | **replaced by CS-01's values** | 4 rad/s, an amplitude that reads on a 6 m plane, eight rotations for Noah's line, the shake tier 8, the 15-piece debris, `boom` 0.3, the announce: all in §2.4.1. The "never interrupts anything" gate moves to the cutscene arming rules. |
| **§11.6 supply runs** | **kept** with the walk made real | The walk is the character: a grandfather walking to his plane at 1.6 m/s with a hitch, climbing in, and the propeller spinning up in front of the kids. Gated to within 80 m so it is always seen. |
| **§12 parachute crates** | the 0.7 s stagger, the tumble-then-snap-then-sway arc, the squared chute effect, the alternating panels, the three hops, the glow, the 45 s life, the pickup odds **kept**; the descent speed and sizes **redesigned** | The stagger is the whole effect and it is untouched: seven crates 0.7 s apart along 60 m of buzz line keep the sky busy for four seconds and then the ground busy for twelve. |
| **§19.1 the shared torch oscillator** | **translated** to every NPC light | Quartz's pole-lamp, Fern's hook-lantern, Neve's hearth-pot and the seven escort posts each run one oscillator that drives flame shape and light intensity together; the escort's gutter is that oscillator's amplitude rising before it dies. Light and fire agree on every NPC who carries one. |
| **§19.2 simultaneous layering with distinct motion signatures** | **translated** into the people | Every NPC idle has two or more incommensurate sources (§2.6–2.9); Ed has five. A standing guide reads as a person and not a signpost for the same reason the v27 ground read as a toy set: the count. |
| **§9.2 crate landing dust** | **kept**, scaled | Six particles, same colour and life, on every crate and every landing hop. |
| **§10 shake ladder** | **kept** | The crash uses tier 8 for 0.5 s directly, as v27 did. |
| **§15.2 rings and orbiters** | **kept** | The crate's attract ring and spokes are the v27 drawing as decals. |
| **§6.2 the dungeon light compositor** | **translated** to the escort | The lantern path is the darkness dungeon's rule with legs: only placed light reveals the way, and the frog's own glow is the one light that moves. |

### 3.2 Family threads that survive

- **The four tips about Ed become things that happen.** `If you see a yellow biplane, wave.` (the plane is yellow; wave at it and it wing-rocks back). `Grandpa Ed says this kind of rain is 'character-building weather.'` (he says it, in the rain, if he is there). `Ed-ible snacks heal more than regular potions.` (they do: 40 % against 15 HP). `Don't ask Grandpa Ed about his landing record.` (every landing bounces, even the repaired one; the achievement `Ed's Landing` is named for it).
- **The repair chain's text is true on the model.** `she's 'Ground-Ed.'` (nose-down in the furrow); `it loves the wind` (the propeller frozen on the glacier shelf); `the green rudder` and `greener than usual after the swamp` (green with moss spots); `the engine won't purr without the spark plug` (it does not: the purr is `plane.engine.repaired`); `The Sparky-Thingy!`; `The Green Meanie lives again!`.
- **The kids' lines about the plane are true in the plane.** Isabella `I call dibs on riding in the plane when it's fixed!` (she sits on the left of the bench, every flight); Noah `The spin was like eight rotations.` (it is eight); Collette `Ten out of ten landing, Grandpa.`; Liam `You know this is the third time, right.` (`edCrashCount` starts at 1: the count is the family's, not the game's).
- **Ed's four achievements:** `Well-Ed-ucated`, `Ed's Landing`, `Frequent Flyer`, and `Ground Control` (story-beats' B1.5) keep their names and their v27 semantics.
- **The greetings** are still the six; a kid hears `I wasn't crashing — I was testing re-entry angles! ...For a friend.` first, at the wreck, which is the right first thing to hear from him.
- **Gran** is still only a voice in Ed's voice; `Grambi` is still Isabella's word.
- **Every guide's three lines**, the Witch the canon mentions twice (`the Bog Witch's territory`, `Talk to Bog Witch to retry`), the Nomad the code looked for, the `Crystal Sage` the quest names: all real now.

### 3.3 What a kid will recognise from v27

The green name plate that says `Grandpa Ed`; the goggles; the red scarf; the yellow plane with green wings and a red tail; the sputter and the stopped propeller; the barrel rolls and loops; the parachutes with red-and-cream panels drifting down one after another; the gold `E` on the crates and the little arrow bobbing over them; `📦 Supply crates incoming!`; `Ed's back from his supply run!`; the six greetings; the propeller, the rudder, the Sparky-Thingy in that order; the mint-green Rootkeeper's name and the blue Lamplighter's; the `!` and `✓` over a guide's head, now beams; `🐸 Familiar`; the merchant's `Rare goods from distant lands`; the same eight things in the stall.

---

## 4. Build notes for implementers

### 4.1 Assets

| Asset | Source | Budget | Phase |
|---|---|---|---|
| Ed rig (§2.1.1) | the `heroes.md` §2.7.1 procedural builder with an adult proportion table, `cap`, `goggles`, six `scarf` bones, the wrench on `prop.R` | ≈ 900 tris, 2–3 draw calls | 2 |
| The Green Meanie (§2.2.1): body, swappable `prop` ×3, `rudder` ×2, `gear.L` ×2, the wreck variant (folded wing tip, open cowling, tarp, splintered hub) | code primitives; one node hierarchy with state-driven visibility | ≤ 2,400 tris body; parts ≤ 200 each; 3 draw calls (body, emissive, blur discs) | 2 (wreck, `hopping`), 3 (flight) |
| Scarf chain | 6 bones, closed-form sway | 36 tris | 2 |
| Crate + canopy + shrouds | primitives; the `E` decal; the canopy dome 5 panels | 60 + 90 + 8 tris; pooled ×12; 2 draw calls (instanced crates, instanced canopies) | 3 |
| Crate marker: beam, ring decals, spokes, arrow billboard | shared beam material (`world-events-weather.md`'s event markers); one decal material | 1 draw call per marker type, instanced | 3 |
| Exhaust and dust emitters | pooled `Points` (`heroes.md` §4.1's families) | ≤ 200 live | 2 |
| Five guide rigs + props (root-staff, pole-lamp, hearth-pot, hook-lantern, walking staff) | the builder; props as primitives | ≤ 1,000 tris each, props ≤ 200 | 2 (Elm, Quartz), 3 (Neve, Fern, Sol) |
| Merchant rig + pack-stall (folded) | the builder | ≤ 1,000 + 300 | 2 |
| Bog Witch rig + broom; Sand Nomad rig; the camel; the awning | the builder; the camel is a bespoke static-idle animal (world-events' instanced-species convention, one instance) | ≤ 1,000; ≤ 600; ≤ 120 | 3 |
| The frog | bespoke, 3 morph targets (sit, stretch, land) | ≤ 250 | 3 |
| Lantern post (shared with `dungeons.md`) | primitives; the torch oscillator in the shader | ≤ 120, instanced ×7 | 3 |
| Portrait atlas | render-to-texture at load from the rigs | 2048² desktop / 1024² mobile | 2 (Ed, Elm, Quartz, kids), 3 (rest) |
| Buzz lines, strips, marks | data in each island's `layout.ts` | 0 | 2 (Forest), 3 |
| Aviator goggles for the kids | one small prop on a `hat` socket (requested, §5) | ≤ 60 | 3 |

### 4.2 Materials and lights

- **Materials:** the shared flat-shaded vertex-colour `MeshStandardMaterial` (`heroes.md` §2.7.2) for every NPC, the plane, the crates and the props; the shared emissive material for glows (the frog's throat, the plane's stubs and instrument glow, Elm's buds, the goggle glint, the Witch's window); the decal material for the furrow, ground-glows, crate rings, footprints; the beam material from `world-events-weather.md`. No new material types.
- **Lights, all from the 8-slot pool (`world-events-weather.md` §2.8.2):** Quartz's pole-lamp, Fern's hook-lantern, Neve's hearth-pot (placed-lantern tier); the frog (event-marker tier); grounded crates (event-marker tier, at most 2 requested at once, nearest first); the seven escort posts (placed-lantern tier). Worst case on the Bog during the escort with Collette fighting: hero side 6, the frog 1, one post 1; the other posts run emissive with their ground-glow decals, which is why the decals exist. The plane has no light. Ed has no light. The merchant's beam is emissive.
- **Shadows:** NPCs and the plane cast and receive from the key light; the plane's blob decal is additional, never instead.

### 4.3 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| `NPC_DEFS`, `FAMILY_NPC_DEFS` (read this time), the Witch and Nomad entries, `MERCHANT_STOCK`, quest-bubble templates, mood-to-frame map, tokens | `src/content/npcs/`, `src/content/canon/dialogue.ts` (verbatim strings, keyed as v27), `src/style/tokens.ts` (`npc.*`, `plane.*`, `crate.*`, `beam.*`) |
| Ed's handler (`edInteract` state machine), the greeting rotation, the chain rewards, the Ed-ible item | `src/sim/story/edChain.ts`, `src/sim/quests/`, `src/content/items/` |
| Dialogue queue, typewriter state, freeze, party-line ordering | `src/sim/dialogue/` (state), `src/ui/dialogue/` (the box, `ui-ux.md`) |
| NPC posts, proximity, bubbles, the three-line rule, the relocation rule, idle ladders | `src/sim/npcs/` |
| The biplane: state, flight controller (the four sources), flyover scheduler, supply runs, crates, the crash values | `src/world/biplane/` (Brief §7.3 puts the biplane in `world/`) |
| Travel: strips, marks, the destination card's data, the CS-04 driver, the streaming contract | `src/world/travel/` |
| The escort: the frog, the post rule, wisp-hollow arming | `src/sim/escort/`, posts shared with `src/dungeons/bog/` |
| Rigs, the plane mesh, the scarf, the portrait renderer, markers | `src/render/npcs/`, `src/render/biplane/`, `src/render/portraits.ts`, `src/render/fx/` |
| Merchant stall UI, destination card, dialogue box, beams | `src/ui/` (per `ui-ux.md`) |
| Dev hooks | `src/dev/` |

### 4.4 Phase mapping (Brief §8)

- **Phase 2 (Forest vertical slice):** Ed at the wreck with greetings 6 → 3 → 2 and the dialogue system; the `wrecked` plane prop with the furrow, tarp and embers; Elm at the gate with all three quests and the three-line rule; Quartz at Lamplight Landing with the pole-lamp and `the Crystal Sage`; the merchant at camp with stock, restock and the fixed Shield Potion; the bounty board's beam; lantern-beam markers; portraits for Ed, Elm, Quartz and the kids; the C4 hangar shouts, `phase1_intro` and the `hopping` plane parked. The `Fly` prompt is gated on the destination island's content being built, not only on `island_unlocked.frozen`, so in Phase 2 it does not appear; nothing else about travel is stubbed.
- **Phase 3:** travel and CS-04 with all four plane states; flyovers and supply runs; crates; Neve, Fern, Sol, the Witch, the Nomad, the camel; the escort; the Ed chain's turn-ins on three islands; the goggles and the Ed-ibles; engine sounds (names only until Phase 5's audio port; a placeholder loop is acceptable).
- **Phase 4:** CS-01, CS-05, CS-06 and CS-10 consume the values here; Ed's fire seat; the wing-rock in the ending; the dialogue log page; the `wavedAtEd` memory if `ui-ux.md` takes it.
- **Phase 5:** `audio.md`'s recipes for every hook in §2.2.7 and §2.9.1.

### 4.5 Test hooks

- **Dev console:** `dev.ed.state(<planeState>)`, `dev.ed.phase(n)`, `dev.ed.fly('flyover'|'supply')` (announces `DEV: Supply flyover launched!`), `dev.crates(n)` (`DEV: N parachute crates dropped!`), `dev.travel(<island>)`, `dev.escort.spawn()`, `dev.escort.kill()`, `dev.npc.mood(<name>, <mood>)`, `dev.dialogue.open(<key>)`, `dev.merchant.restock()`, `dev.ed.moveTo('rim'|'fire'|'plane')`.
- **Vitest (`tests/unit/npcs/`):** (1) `edChain.test.ts`: the six-step order; every phase's turn-in from every island; XP goes through `addXP`; phase 3 sets `repaired`, `betterDrops`, `edQuestComplete` and fires `Well-Ed-ucated`; the auto-offer. (2) `greetings.test.ts`: the rotation per story state (also owned by `story-beats.md`'s test list). (3) `flyover.test.ts`: the gate (60 m from the strip, no dungeon, reserve), the interval ladder by count, the 40/60 roll over 1,000 draws, crate counts with and without `betterDrops`, the crossing rule picks a line 60–120° off the camera yaw when one exists. (4) `crate.test.ts`: from 20 m the descent lands in 11–14 s in calm, drifts ≤ 6 m in `storm`; pickup at 1.49 m and not 1.51 m; the heal / gold split. (5) `sputter.test.ts`: cadence and drop per state; exactly one stall-drop per `hopping` flight. (6) `escort.test.ts`: the frog reaches Fern with all posts lit; waits at an unlit gap; dies to a scripted Wraith; the Witch retry re-activates `swamp_2` without Fern. (7) `travel.test.ts`: the destination card lists exactly the unlocked islands with the right lock reasons per state; the flight never exceeds 30 s with a stubbed 25 s load; weather pre-rolled at takeoff equals the weather committed at touchdown. (8) `npcPosts.test.ts`: every guide exists on every island load; the three-line rule by dungeon state; `talk_to` fires for a companion. (9) `merchant.test.ts`: 4 distinct of 8; restock at dawn and landing; Shield Potion absorbs 50 then stops.
- **Smoke (headless, Phase 3):** land on every island in ladder order, assert the plane and Ed at the marks and the guide's line 1; run one supply run within 80 m of the strip and assert ≥ 6 grounded crates within 60 m; run the escort to completion.

### 4.6 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| The plane's exhaust and the crate spray allocating per puff | pooled `Points`, fixed caps (80 puffs, 12 crates), zero per-frame allocation |
| Seven lit posts plus the frog plus Collette wanting nine lights | the pool's priority order; ground-glow decals under lit posts so the read survives emissive-only |
| The portrait atlas on mobile | 96 px tiles in a 1024² atlas; rendered on first use, cached per session |
| Streaming the destination during a 3 s sky leg | the leg loops up to 30 s; loading starts at the takeoff roll; nothing between islands is real geometry |
| The flyover path crossing tall props | buzz lines are authored over open cells (≤ 6 m props within 8 m), validated by a build-time check |
| NPC idle ladders on five islands at once | only the current island's NPCs are simulated; off-island NPCs are data |
| The wreck's smoke column and embers at camp for the whole of Act 1 | one billboard and 8 particles; gone at C2 |

### 4.7 Build order

1. Phase 2: tokens → the dialogue queue and freeze → Ed's rig, scarf and idle ladder at the wreck → the wrecked plane prop → `edChain.ts` with greetings and the six-step order → Elm and Quartz with posts, bubbles, beams → the merchant → portraits → the hangar shouts and the `hopping` swap.
2. Phase 3: the plane's flight controller (four sources, state ladder) → strips and marks → the destination card and CS-04 driver with the streaming contract → flyovers → supply runs and crates → Neve, Fern, Sol → the Witch, the Nomad, the camel → the escort → the goggles and Ed-ibles → engine hook names wired to placeholders.
3. Phase 4: the crash values into CS-01; the fire seat; the wing-rock in CS-05 and CS-10; the dialogue log.

---

## 5. Cross-references and conflicts

### 5.1 Earlier design files, and exactly what was taken

- **`heroes.md`:** the scale (§2.5.1); hero bases and the hue rule (§2.1.1, §2.1.3), applied to every NPC body in §2.6.1; the heights 1.52 / 1.40 / 1.30 / 1.14 m that Ed and the guides step off (§2.0); the rig builder and bone names (§2.7.1–2.7.3) that every NPC rig reuses; the idle ladder tiers (§2.4.6) that §2.1.5 and §2.6 mirror; the companion steering, stuck timer and fade teleport (§2.5.11) that the frog, Ed's walks and the relocation rule reuse; the formation slots that the Rally Beacon targets; the baseline recompute for the Scroll of Respec (§2.5.10); Noah's half-amplitude scarf (§2.3.2), which is why Ed's is full; the `prop.R` socket for the wrench; the revive radius 1.5 m that the crate pickup matches; Collette's own light, which is why she lights posts in 0.3 s.
- **`story-beats.md`:** the island tables and every position (§2.2); the biplane approach paragraph (§2.2), which §2.3 makes concrete; the travel ladder and plane states (§2.3), copied into §2.0; the hero-reaction rules and the greeting rotation (§2.3 rule 4, §2.5); the Ed delivery map (§2.5) that §2.1.8 follows line by line; the new text for the hangar, `crater_hint`, the Witch and the Nomad (§2.7), quoted verbatim; the quest graph's gates (§2.4); the flags (§2.6); the merchant and bounty rules (§2.8); the CS list and the 30 s streaming rule (§2.10, §4); the compass priority order (§4); "Ed is wherever the plane is" (§6).
- **`world-events-weather.md`:** the `edFlyover` and `supplyDrop` slots and `events.reserve` (§2.5.1, §2.5.3); crate drift ±0.5 m/s in `storm`, `sand`, `blizzard` (§2.5.3); the event-marker beam language and the merchant's violet beam (§2.5.2–2.5.3); the sky dome, clouds and island silhouettes the flight flies through (§2.6); the arriving island's weather roll (§2.2.2); Ed delivering tip 2 in person (§2.7.3); the 8-slot light pool, its priorities and the `light.lantern` / `light.event` tokens (§2.8.2); the torch oscillator (§2.8.3); `vis.radius` (§2.2.5), whose 2.5× streaming cull is the relocation rule's 30 m.
- **`enemies.md`:** the Bog natives the escort meets (§5: Wraith, Bat, Sneaky Shroom, Goblin Healer); the wisp hollow nest (§2.8); the guardian always-on HP bar convention (§5) for the frog; the accent exemption from the hue rule (§2.2); the caravan cart's lantern-on-a-pole (via world-events) as the beam precedent.
- **`docs/DECISIONS.md`:** the orchestrator's island footprints and `layoutScale` line (the marks in §2.3.1 scale with it; the plane and the frog do not); the lairs line (Quartz's line 2/3 keys off `lairCleared.cave`); the fire-family line (the Rift is not a plane destination); the Phase 0.5 "no appending to DECISIONS" line.

### 5.2 What each later file must pick up from this one

| File | Takes from this file |
|---|---|
| **`camp.md`** | the hangar's mouth on the strip's axis at the west end with the parking mark 4 m east of it and Ed's tinkering mark at the nose (§2.5); the whittled propeller on the hangar wall from `propeller` on; the merchant's stall at Stewart Camp from C2 and a folding stall at each hub; the bounty board's `beam.turnIn` when a claim is pending; Ed's seat at the fire ring on the north-east side from `portalOpen`, sittable for his 30 s idle; the wreck at (13, 0) with its furrow, tarp, ember motes and smoke column as C0–C3 props (this file specifies them; `camp.md` places nothing over them); the tools on the ground at C4; sittable props for Ed's 30 s tier; the kids' goggles as a photo-mode prop |
| **`cutscenes.md`** | CS-01: every value in §2.4.1 (entry, corkscrew, roll count, descent, touchdown, skid, debris, shake, announces, the line-1 caption at rotation four); CS-04: the beat table in §2.3.4 with the per-state variants, the cloud layer at +24 m, the sky-leg loop, the circuit arc, the bounce landings, the kids' seated clips (§2.3.7), Ed's captions (§2.1.8); CS-05: the first `repaired` takeoff, one loop (radius 4.0 m at 14 m/s), the wing-rock, the two-hop landing, the squad waving; CS-06: Ed at (111, −111) facing the crater, the eight-frame portrait by mood, the goggles-polish idle if the player dawdles; CS-10: Ed at the fire for the dawn, then the plane over the Ridge with a wing-rock in the last shot (see conflict 4); the `Press SPACE to skip` timing on CS-04 repeats |
| **`ui-ux.md`** | the dialogue box's data shape (`{text, name, col, portrait, mood}`), the typewriter rate, the advance and hold-to-skip inputs, the `▶` pulse; the portrait atlas (tile sizes, ring in the `ui` token, the kids' three frames and which contexts pick them); the destination card's contents and nine new strings (§2.3.3); lantern beams by state (`beam.offer` `#E8A838`, `beam.turnIn` `#3DCC7A`, `beam.crate` `#E8A838` 10 m, `beam.merchant` `#A57BE8`) with base rings in each NPC's `ui` colour; the `🐸 Familiar` label and its always-on HP bar; the `NPC_DEFS` `icon` field as data (glyph or drawn is `ui-ux.md`'s call); the quest-bubble templates with `SPACE` as the keyboard variant; the `Fly` / `Talk` / `[SPACE] Trade` prompts from the live binding; the `Aviator Goggles` memory item, the Ed-ible item card, the dialogue log page (requested), the `wavedAtEd` memory (optional); the merchant and bounty overlays' verbatim strings; the compass pips for the plane, the frog and the cairns |
| **`audio.md`** | every hook in §2.2.7 (engine per state, sputter, stall, spin-up and spin-down, taxi, touchdown, trick wind, wreck tick, crash impact) and §2.9.1 (`frog.hop`, `frog.croak`, `frog.hurt`), plus `lantern.gutter`, `merchant.chime`, `dlg.blip.<who>` (one typewriter blip per speaker, Ed lowest), `dlg.advance`; doppler and pan for the plane; `crate.chute.open`, `crate.land` (= `equip` 0.15), `crate.pickup` (= `equip` 0.3); a defined bounty-complete cue (v27's `questComplete` was undefined) |
| **`dungeons.md`** | the lantern post and its numbers (§2.9.2: 1.5 m / 1.5 s to light, Collette 0.3 s, 40 s lit, 3 s gutter, the ground-glow decal, the wisp-hollow arming) as the overworld instance the Sunken Temple composes; Quartz's 30 s idle lights the cave stair's wall-lamps (emissive only) as the Crystal Caves' "only Quartz's lamps light it" rule; the spark plug plinth's `Spark Plug recovered from the Crystal Depths!` (`#00d2ff`, 3 s) fires from the lair (`bosses.md`) and completes `ground_ed_3` |
| **`bosses.md`** | the Rift and the Depths are lairs Ed never flies to; the plane is parked and Ed is hidden from no boss fight (bosses happen away from strips); the Kid Snatch's caged heroes still count as "present" for Ed's party lines only when freed |
| **`enemies.md`** | the frog as a valid target with the 2 m / 4 m preference rule and 30 % damage; Wraiths from wisp hollows target the frog first; the camel and the guides are never targets |
| **`world-events-weather.md`** | the weather pre-roll at takeoff (conflict 3); the Nomad's awning as a shelter and the camel as an animal prop, both designed here; `beam.crate` at 10 m as a smaller event marker; the `merchantArrival` reserve is used once, at C2 |
| **`heroes.md` (addendum requests, collected by the orchestrator)** | a `hat` socket on each hero rig for the aviator goggles (cosmetic, flights only); four seated clips for the plane's bench (§2.3.7); the reach-up clip for lighting a post; a `wave` reaction was not requested here (emotes already exist); `cutscenes.md` later asked for one for CS-05, CS-10 and photo mode, and `heroes.md` §2.4.7 carries it |

### 5.3 Conflicts found, and how this file designs around them

1. **Bog Witch and Sand Nomad colours vs the hue rule.** `story-beats.md` §2.7 gives the Witch `#7B3CA0` (278° / 43 %), which sits inside Collette's band by 0.3 % of lightness, and the Nomad `#B3541E` as his dark (22° / 41 %, inside Noah's band). Both files are final. Resolved without changing either: story-beats' hexes are the `NPC_DEFS` entries verbatim and serve as `ui` and accent tokens (≤ 15 % of surface); the bodies use the darker `#4A2560` and a `#4A3524` cloak, both of which pass (§2.8). If the orchestrator prefers the story-beats hexes on the bodies, the rule in `heroes.md` needs a logged exception.
2. **Wisps.** `story-beats.md` §2.2 and §2.4 say wisps attack the frog in unlit stretches and cite `enemies.md`; `enemies.md` has no wisp enemy, only the harmless `pt.wisp` particles and the Wraith's wisp-hollow nest. Resolved: the attackers are Wraiths from wisp hollows, the particles are the visual (§2.9.2). No file changes.
3. **Destination weather.** `world-events-weather.md` §2.2.2 says the arriving island rolls fresh weather at touchdown; `story-beats.md` §2.2 says the flight shows the destination's weather in its second half. Resolved: rolled at takeoff, shown in flight, committed at touchdown (§2.3.5). The roll's source pool and odds are unchanged.
4. **Ed in CS-10.** `story-beats.md` §2.10 lists Ed present at the fire and the plane over the Ridge in the same cutscene. Ed cannot be in both. Resolved: Ed is at the fire for the dawn scene and the last shot's pass over the Ridge is his, with a wing-rock; the cut between them is the time skip to golden hour. `cutscenes.md` shoots it.
5. **Scale in `enemies.md`.** Its metres are px × 0.04 pending reconciliation to px × 0.025; this file used the hero scale for every number and cited enemies' rules, not its metres.
6. **`heroes.md`'s carry socket.** `world-events-weather.md` §5.2 already requested a free-hand carry socket; this file requests a `hat` socket and seated clips. Both are addenda for the orchestrator, not conflicts.
7. **The flight length.** `story-beats.md` §2.2 says 14–18 s; §2.3.4 lands at 16–18 s nominal with the sky leg at its 3 s minimum, and up to 30 s when streaming needs it (story-beats' own cap). Inside the band at its top; no change requested.
8. **CS-06's trigger.** `story-beats.md` says Ed walks to the rim and waits; `edInteract`'s v27 step 3 opened the block on a talk. Both are kept: the director moves Ed, the beat fires on approach, and the handler's step 3 is the fallback if the party talks first (§2.5).

---

## 6. Decisions logged

Merged into `docs/DECISIONS.md` by the orchestrator after review.

- 2026-09-06 · phase-0.5/npcs · Grandpa Ed is 1.78 m (1.74 stooped), a sheepskin flight jacket `#8B5A2B` with a fleece collar `#EDE3CF`, a green sweater `#228B22` as accent, dark trousers and a leather cap `#3B2A1A`, goggles `#7A4018` pushed up on the brow, and `#228B22` kept as his name, portrait-ring and announce colour · v27's green was his head; a green jacket vanishes on moss as `heroes.md` found for Noah; the leather is the aviator and the sweater keeps the canon green where it can be seen · rejected: a green jacket (moss failure), olive coveralls (the Orc's band), a brown-only Ed (loses "green Grandpa").
- 2026-09-06 · phase-0.5/npcs · Ed has one scarf, ember red `#D84830` → `#A83828`, a six-bone chain on AR §11.4's seven frequencies at v27's amplitudes (0.025–0.075 m), full amplitude on the ground and 1.5× streaming in flight · v27 drew a green ground scarf and a red flying one; the flying one is the silhouette the teardown names, and Noah's half-amplitude scarf needs a full-amplitude original to rhyme with · rejected: the green ground scarf, a cloth simulation.
- 2026-09-06 · phase-0.5/npcs · Ed's face makes no claim the canon does not: no facial hair, no glasses, no visible hair (the cap covers it), white brows as the only age mark; his knee (`before the knees went`) is a 0.03 m hitch and a 1.6 m/s walk; he looks up more than anyone · Brief §2(b): portrayal details of a real person are Andrew's, and the knee is a quoted line · rejected: a moustache, a likeness.
- 2026-09-06 · phase-0.5/npcs · Portraits are rendered from each character's own head mesh into an atlas at load (192 px tiles desktop, 96 px mobile); Ed's 24 canon moods map to 8 frames; guides, the Witch and the Nomad get 3; the kids get 3 · v27's mood tags were dead; a drawn portrait would drift from the model; the atlas costs one render per tile per session · rejected: hand-drawn portraits, live render-to-texture per frame.
- 2026-09-06 · phase-0.5/npcs · The Green Meanie is Cub yellow `#F4D21E` with v27's green wings `#2D8C56`, a red fin and tailplane `#D84830`, and a green rudder `#228B22`; 6.0 m long, 7.2 m span, a four-kid bench in the front cockpit, the name painted on the side · the canon tip says yellow; v27's amber `#E8A838` is now Collette's accent and the UI gold; the canon says the rudder is green; five people climb out of it in CS-01 · rejected: keeping amber, a two-seat scale plane, renaming it.
- 2026-09-06 · phase-0.5/npcs · Plane speeds and altitudes are design values: cruise 10 / 12 / 13 / 14 m/s and climb 2.5 / 3 / 3.5 / 4 m/s by state, flyover entry 28 m, buzz 9 m, supply circuit 20 m, CS-01 entry 60 m, sputter drop 0.5 m (0.25 m repaired), crash corkscrew 4 m · strict conversion of 100 px/s and 150 px gives 2.5 m/s at 3.75 m, slower than Liam runs at tree height; 3 px and 40 px do not read on a 6 m plane · rejected: strict conversion, a single cruise speed for all states.
- 2026-09-06 · phase-0.5/npcs · AR §19.3's four motion sources port as rules with v27's cadences (wander every 2.5–5 s, steering 1.2 rad/s, yaw chase 3.5/s, bank lag 4/s, sputter every 2.5 s for 0.15 s); the wander becomes a ±6 m lateral offset on a path; a pitch and altitude bob join the roll wobble; the `hopping` plane adds one stall-drop per flight; the repaired plane keeps a lighter cough · the method is the magic; v27's free heading walk would leave the buzz line; `post_quest` line 1 says the repaired plane is still bumpy · rejected: a smooth repaired plane, a spline with no noise.
- 2026-09-06 · phase-0.5/npcs · Per-state flight feel ladder: max bank 15 / 20 / 30 / 35°, tricks none / none / barrel roll / both, crabbing without the rudder, three-hop landings with a swerve until the rudder, two hops after; every landing bounces · story-beats' ladder made physical; the landing record is canon and `Ed's Landing` is named for it · rejected: a clean landing for the repaired plane.
- 2026-09-06 · phase-0.5/npcs · Flyovers are camera-aware low lateral passes on three authored buzz lines per island: entry 28 m, pass at 9 m over the party, the line chosen 60–120° off the camera yaw at launch; no camera glance; the shadow blob `alpha = clamp(0.12 − alt × 0.0025, 0.03, 0.12)` and the engine's doppler carry the approach · a 45–55° camera never sees the sky, and a plane above the camera's height is never in frame; a lateral crossing at 9 m is in frame across the full width · rejected: a temporary pitch drop to 30–38° (a brief exception with LOD and readability costs for a small gain), high flyovers seen only by shadow.
- 2026-09-06 · phase-0.5/npcs · Flyover gating: only with the active hero more than 60 m from the strip, never in dungeons, cutscenes, dialogue or boss fights, only when `events.reserve('edFlyover', 10)` succeeds; the parked plane and Ed are hidden while airborne; the return is a visible landing if the hero is within 80 m · the plane is never in two places; the exclusion is world-events' · rejected: flyovers with the plane visibly parked (two planes).
- 2026-09-06 · phase-0.5/npcs · v27's flyover intervals (20 s first; 25 + 0–15, 35 + 0–20, 50 + 0–25 by count), the 40 % supply / 60 % flyover roll, the crate counts (3–7 / 6–10 / 3–5 silent), the 0.7 s stagger, the announces and `Frequent Flyer` counting flyovers and supply runs only: all kept verbatim · the choreography table ports unchanged (AR §11.6) · rejected: retuning any of it.
- 2026-09-06 · phase-0.5/npcs · The wing-rock wave: the plane rolls ±15° twice when any hero emotes within 25 m of it in the camera footprint, and in CS-05 and CS-10 · `If you see a yellow biplane, wave.` becomes a thing that answers · rejected: no response, a horn.
- 2026-09-06 · phase-0.5/npcs · Supply runs fire only with the active hero within 80 m of the strip, fly one lap at radius 70 m and 20 m, and drop on the near half so crates land within 60 m of the strip; Ed walks to the plane with real steering · v27's runs often dropped unseen; the walk is the character · rejected: runs anywhere on the island.
- 2026-09-06 · phase-0.5/npcs · Crate physics in metres: 0.35 s free fall at 8.75 m/s², canopy 0.36 s, descent 2.6 → 1.4 m/s (about 12 s from 20 m), drift ±0.125 m/s (±0.5 in bad weather), a 0.6 m crate and a 1.1 m canopy, pickup 1.5 m; the stagger, the squared chute effect, the sway frequencies, the three hops, the glow, the 45 s life and the pickup odds kept · strict speeds give a 44 s descent and a 0.35 m crate · rejected: strict conversion, instant drops.
- 2026-09-06 · phase-0.5/npcs · CS-01 crash values: entry 60 m over the Ridge, a 4 rad/s corkscrew of 4 m with a continuous 4 rad/s roll for eight turns over 12.6 s at 4.8 m/s descent, touchdown at (70, 0) at 16 m/s, shake tier 8 for 0.5 s, 15 debris pieces 0.1–0.3 m at 5 m/s², a 60 m skid to (13, 0) losing the gear leg, wing tip and hub on the way · Noah's canon line counts eight rotations; the skid explains the furrow that is the strip · rejected: v27's 40 px wobble, a crash with no skid.
- 2026-09-06 · phase-0.5/npcs · `edInteract` ports as a six-step state machine in v27's order with `ground_ed_1` gated on `squadAssembled && goblinKingDefeated`, turn-ins at the plane on any island, the auto-offer kept, `crater_hint` real, and quest XP through `addXP` · v27 bypassed the level-up check · rejected: porting the bypass.
- 2026-09-06 · phase-0.5/npcs · Rewards made true: the Aviator Goggles are a scrapbook memory and a cosmetic the four kids wear on every flight (a `hat` socket requested from `heroes.md`); the Ed-ible is a consumable healing every hero 40 % of max HP, three of them, description `Grandpa's snack. Heals every hero.` (new text) · `edGoggles` and `edEdibles` did nothing; the tip says Ed-ibles heal more than potions (15 HP) · rejected: dead flags, selling Ed-ibles, naming Gran on the wrapper.
- 2026-09-06 · phase-0.5/npcs · Ed's spots per story state (the wreck's nose, the hangar mark, each strip's Ed mark, the crater rim at (111, −111), the fire from `portalOpen`) and a relocation rule for every NPC: walk with companion steering if a hero is within 30 m or the NPC is in the camera footprint, else place · nothing ever pops in view; Ed's walk to the crater is a walk a kid can follow · rejected: teleporting Ed, Ed fixed at camp.
- 2026-09-06 · phase-0.5/npcs · Ed says `Character-building weather.` (new text) as a bubble when a hero shelters near him in rain or storm; the canon tip 2 caption plays when he is absent · world-events reserved the slot; the tip is third-person and cannot be his line verbatim · rejected: Ed reading the tip aloud.
- 2026-09-06 · phase-0.5/npcs · Guides stand at fixed posts with one prop each, adult proportions and heights 1.45–1.95 m, bodies recoloured off the hero bands (Elm bark `#5E4224`, Quartz slate-violet `#4A4470`, Neve indigo `#1B2A5A` with white fur, Fern mist-sage `#7FA68F`, Sol bone `#EDE3CF` with a violet sash) and their v27 `col` kept as name, ring and marker colours · random placement could omit a guide; Sol's `#E8A860` and Neve's snow-white fail on their own islands; the kid's memory of the colour lives on the name plate · rejected: v27 hexes on the bodies, random posts.
- 2026-09-06 · phase-0.5/npcs · Quest markers are lantern beams coloured by state (`#E8A838` offer, `#3DCC7A` turn-in, none in progress) over a base ring in the NPC's `ui` colour; the crate beam is 10 m gold; the merchant's is violet `#A57BE8` · Brief §6 diegetic markers; the ring says who, the beam says what · rejected: per-NPC beam colours (state would be unreadable).
- 2026-09-06 · phase-0.5/npcs · The merchant appears at Stewart Camp from C2 and `teamLv ≥ 3` with the canon announce and is already at every other hub on landing; a fixed stall; stock 4 of 8 restocked at every dawn and landing; the Shield Potion absorbs 50 for 30 s; the Rally Beacon fades companions to their slots; no dialogue · a wandering merchant on an authored island is a chase; v27 never restocked and its shield buff was never read · rejected: relocation, a talking merchant.
- 2026-09-06 · phase-0.5/npcs · The Bog Witch (`#4A2560` robe, `#7B3CA0` hat band, a bent hat and a broom, a stilt hut with a green window) and the Sand Nomad (bone robes, a `#4A3524` cloak, a sienna wrap, seated by a tent with a camel) get bodies, posts and idles; story-beats' hexes stay as their `NPC_DEFS` entries and `ui` tokens · both files are final; the hue rule binds bodies · rejected: story-beats' hexes on the bodies (Collette's and Noah's bands).
- 2026-09-06 · phase-0.5/npcs · The frog: 0.40 m, moss `#3C8A5C` with a phosphor `#6CE87A` emissive throat, a pooled event-tier light, an always-on HP bar, hops of 0.9 m at 2 m/s on companion steering toward the next lit post only; enemies prefer it within 2 m when no hero is within 4 m and hit it for 30 %; Wraiths from wisp hollows in dark stretches; Collette lights a post in 0.3 s; the Witch is the retry point and re-activates `swamp_2` without Fern · the escort never ran in v27; it must be findable in the Bog's dark; the canon retry string names the Witch · rejected: the frog following the heroes, a wisp enemy type, retry at Fern.
- 2026-09-06 · phase-0.5/npcs · Gran: no entity, portrait, voice, photograph or new line; `Eddie` only inside her quoted line · story-beats' rule kept · rejected: a photograph in the cabin.
- 2026-09-06 · phase-0.5/npcs · Travel: `Fly` at the cockpit step and `Talk` on Ed as two prompts 3 m apart; a destination card with nine new strings (`Where to?`, four lock and state notes, `You are here`, `Fly`, `Stay`); CS-04 as an 18 s beat table with per-state variants; no geometry between islands; the destination pre-rolled and loaded behind a +24 m cloud layer, the sky leg looping up to a 30 s flight; weather rolled at takeoff and committed at touchdown · Brief §5.1 and §7.4 (islands stream on travel); story-beats' 30 s cap · rejected: a menu teleport, real flight geometry.
- 2026-09-06 · phase-0.5/npcs · Ed sits at the fire from `portalOpen`, and the ending's final pass over the Ridge is his with a wing-rock (story-beats lists him at the fire and the plane over the Ridge in one cutscene) · one Ed · rejected: an unmanned plane.
- 2026-09-06 · phase-0.5/npcs · The plane gets a procedural engine with a hook per state (`plane.engine.hopping` … `.repaired`), sputter, stall, spin-up, taxi, touchdown and trick cues, doppler-panned · v27's plane was silent; the low pass is heard before it is seen · rejected: silence, an audio file.
- 2026-09-06 · phase-0.5/npcs · Dialogue: 120 characters per second, first press completes and second advances (kept), hold 0.8 s to skip any block, the sim frozen (kept) while render-side motion continues, party lines in story-beats' orders, a dialogue log page requested · CM §9's freeze is right; a frozen scarf and dead trees behind the box are not · rejected: a live sim behind dialogue, no skip.
- 2026-09-06 · phase-0.5/npcs · The Nomad's camel (dun-grey `#8E8A80`, static idle, never targetable) and awning are designed here · `world-events-weather.md` §5.2 declined them · rejected: no camel (story-beats' silhouette read needs it).

---
- 2026-09-07 · phase-0.5/npcs · Consistency pass: the plane has two marks per strip, both owned here (§2.3.1): the parking mark (Forest (16, 0), under the hangar roof from C4) while the plane is not `repaired`, and the apron mark (Forest (24, 0), 4 m east of the hangar's mouth) where every landing rolls out and where the plane stands from `repaired` on; CS-04's roll-out and the destination preload name both; the `wave` clip note in §5 now points at `cutscenes.md`'s request and `heroes.md` §2.4.7 · why: `camp.md` §2.12 and `cutscenes.md` CS-10 already parked the plane on an apron at (24, 0) that this file never named, and one file must own Ed's marks · rejected: moving the apron into the hangar, leaving the apron without a coordinate.

## 7. Reconcile when the brainstorm doc lands

- Whether it resolved the plane's look (colour, size, seats) or Ed's appearance; §2.1–2.2 stand unless it records a reason not considered here, and any likeness detail is Andrew's regardless (§8).
- Whether it fixed the escort's design (a resolved "Bog Witch escort set piece" would supersede §2.9's numbers but not the post rule, which `dungeons.md` also needs).
- Whether it named the merchant, gave him lines, or resolved his stock; §2.7 adds no text and can absorb any.
- Whether it decided the travel presentation (a map screen vs the in-flight sequence); Brief §5.1 asks for the sequence and §2.3 assumes it.
- Whether it specified Ed's role in the finale beyond "the one far light"; §2.1.6 keeps him at the fire.
- Whether the Aviator Goggles or the Ed-ibles were meant to have mechanical effects other than §2.5's.

## 8. Open questions for the orchestrator

- **Ed's likeness (Brief §2(b)).** This file ships Ed with no facial hair, no glasses under the goggles and no visible hair, because each would be a claim about a real person that the canon does not make. If Andrew wants a likeness detail (a moustache, glasses, a particular hat), only he can add it; the rig takes any of them as a small prop or a face quad without other changes. Nothing is blocked; the question is optional.
