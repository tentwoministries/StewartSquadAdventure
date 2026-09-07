# Phase 0.5 — Design Bible orchestrator review (2026-09-06)

Reviewer: orchestrator (Fable 5.1, high). One entry per design file, written when the file lands. This record is the "orchestrator has reviewed each one" half of the Phase 0.5 Definition of Done (Brief §8).

## Checklist applied to every file

1. Structure: the eight sections of the design-lead skeleton; §1–3 substantive (the contract Andrew set).
2. Canon: quoted strings verbatim against `docs/teardown/FAMILY_CANON.md` (spot-check ≥ 5); names and core personalities intact; all new text marked **[new text]** and family-friendly; no §2(b) portrayal change decided without escalation.
3. Atmosphere: §3 cites `ATMOSPHERE_RECIPES.md` by section; the three §19 recipes honored where the system touches them.
4. Camera: every visual element has a read at one-eighth screen height from the 45–55° camera.
5. Palette: anti-palette absent; new colors as named tokens; hero hue bands respected.
6. Budgets: §4 addresses draw calls, lights, particles, and Brief §7.4.
7. Buildable: meters, seconds, hex, counts; no TBD / TODO; an Opus implementer could build from it.
8. Consistency with earlier design files; conflicts surfaced in §5 rather than silently resolved.
9. §6 decision lines present, in format, merged into `docs/DECISIONS.md` (count recorded).
10. §8 empty or handled by the orchestrator.

## enemies.md — 420 lines — PASS

| # | Result |
|---|---|
| 1 | Pass. |
| 2 | Pass. Spot-checked `The ground trembles...`, `The Hydra splits!`, `All siblings found! Destroy the camps!`, `💰 GOBLIN CARAVAN! Kill them for loot!`, `Crystal Caverns Guardian`, `Mini-Boss Slayer` against FAMILY_CANON — verbatim. Seventeen display names and twenty-one bestiary lines are new text, marked. Two bestiary lines mention Isabella (wants to keep a Slime) and Collette (drew eyes on the real mushrooms); both sit inside the canon personalities (youngest and fierce-but-small; creative) and use no role — accepted as within-canon, not a §2(b) change. |
| 3 | Pass. §3 maps §9.2, §9.3, §13.1, §14, §15.2, §2.4, §5, §10 and all three §19 lessons; the camp brazier and cage lantern use the one-oscillator rule. |
| 4 | Pass. Every roster row has a "read at distance" note; three size tiers; silhouette add-on per type; motion signature per type. |
| 5 | Pass. Hue-band reservation rule stated with a per-outcome reconciliation; v27's hero-band enemy hexes retired; void violet only in the Shadow Realm; tokens named for `src/style/enemies.ts`. |
| 6 | Pass. ≤ 60 enemy draw calls, ≤ 6 enemy-side lights, 16-pool telegraphs, blob shadows on four rigs, LOD1 for guardians, pooled shards/motes. |
| 7 | Pass. px and m side by side in every table; state machine; per-behaviour timings; build order; test hooks; Rule 2 gates named. |
| 8 | Pending `heroes.md`: scale 0.04 m/px, hero height 1.5 m, projectile hit radius 0.6 m, melee hit volume 2.2 m, and the three color proximities (Healer teal vs green Noah; Wraith cyan and Wyrm rim vs Liam blue). Reconciliation is one constant plus ≤ 3 hexes by design. |
| 9 | 22 lines merged into `DECISIONS.md`. |
| 10 | Empty. |

**Orchestrator actions.** (a) Magma Titan and `Forged in Fire`, and the Crystal Colossus fate → `bosses.md` prompt. (b) Endless mode ownership → `story-beats.md` decides its fate; if kept, `world-events-weather.md` owns the event hook and `ui-ux.md` the HUD (stated in the wave 3 prompts). (c) Teardown erratum: `ATMOSPHERE_RECIPES.md` §9.3 quotes the `MiniBoss` death rate (`dt·1.5`) for `Enemy` too; the legacy line L2763 is `dt·4`. Not edited (teardown docs are the record); to be corrected in the Phase 0 part B reconciliation pass. (d) The suggested "warband" world event is optional; passed to `world-events-weather.md` only if that file has room after its own review.

## heroes.md — 739 lines — PASS (foundation file)

| # | Result |
|---|---|
| 1 | Pass. Summary card at the top of §2 as required. |
| 2 | Pass. Canon sweep in §2.2.3 tabulates 107 prop/role hits and 120 name hits with FC line numbers; spot-checked `Tip: Liam always volunteers for the hard missions. That's why he's the tank.`, `That trajectory was off by at least 15 degrees. ...I've been tracking it.`, `Hold on, I need to fix my hair. ...Okay go.`, `I'm doing what Collette's doing!`, `Stay back, Bella.`, `This requires ISABELLA's whirl!` — verbatim. New text: the role labels "Ranger" and "Whirlwind" (v27 title-screen showcase labels `DPS` / `AoE`, not family text; renaming is licensed by Brief §2 and logged), the verb "Dodge", the passive "Shield Front", and the emote-wheel labels. Every personality note derives from a quoted canon line; the costume notes (hand-me-down cape, deadpan face) are expression. No §2(b) portrayal change. |
| 3 | Pass. §3.1 translates all three §19 recipes (orb oscillator drives light and motes; ≥ 4 incommensurate motion sources per standing kid; Ed's scarf recipe rhymed on Noah at half amplitude); §3.2 disposes of every AR §16 / §9 / §10 / §14 / §15.2 entry. |
| 4 | Pass. Four bodies with one signature shape each (disc, line, two lobes and a spike, block on the ground), a black-silhouette test, and a per-island legibility matrix. |
| 5 | Pass. Colors decided with rationale: Liam sapphire `#2A62CF`, Noah fox orange `#EE7F24` with v27 green `#2DB86A` as accent, Collette amethyst `#9D4FD8`, Isabella ruby `#D6294E` with v27 gold `#F0C040` as accent; v27 body colors demoted to glow tokens so every effect still reads as v27's. Closes session 0's open color question in favor of the brief's colors for Noah and Isabella. Hue-reservation rule for enemies and NPCs (20° hue and 15 % lightness). |
| 6 | Pass. ≈ 700 tris per rig, 2–3 draw calls per hero, ≤ 6 hero-side lights from the pool, pooled particles and ribbons, procedural bones (no skinning cost). |
| 7 | Pass. 40 px = 1 m stated once with reasons; every distance converted; kit as data with the intended (not wiped) skill-tree bonuses; the pilot Liam is build-ready (geometry table, bone contract, idle and walk clips, selection ring, two scored poses). |
| 8 | **Conflict with `enemies.md`, resolved in heroes' favor:** enemies assumed 0.04 m/px, hero speeds 6.4–7.2 m/s, hero projectile hitbox 0.6 m, hero height 1.5 m, and a 2.2 m melee hit volume. Heroes is the foundation file and its scale reasoning (80 m island, 4.0–4.5 m/s runs) is stronger. Enemies is being reconciled by its author (scale, hero facts, flier altitude, the Goblin-base tweak its own §2.2 rule pre-declared for a saturated-red Isabella, cage cloth = hero base, mark rings = hero glow, `rooted` status). Both files agree enemy damage numbers stay `#D84830`; Isabella's ruby sits 20° from it by design. |
| 9 | 29 lines merged into `DECISIONS.md`. |
| 10 | Empty. |

**Orchestrator notes.** The dodge collision is resolved well (universal "Dodge" vs Noah's signature "Dodge Roll" with the `snapShot` window). The companion fall-through bug becomes a tuned middle with two family rules that make canon lines true in the sim (Isabella's slot adjacent to Collette's; companion-Liam guards Isabella under 40 % HP) — accepted. The shadow squad is specified as the Shadow-skin palette swap with rift-cyan eyes; `bosses.md` must build on that. Kid Snatch's cage entity is `bosses.md`'s; the three starting rescue cages are `enemies.md` §2.8's — both files already say so.

## world-events-weather.md — 941 lines — PASS (scale reconciliation in progress)

| # | Result |
|---|---|
| 1 | Pass. Forest keyframe table and the weather × island matrix open §2 as required. |
| 2 | Pass. Spot-checked `💰 GOBLIN CARAVAN! Kill them for loot!`, `🔴 BLOOD MOON! 2x enemy speed, 3x XP!`, `💚 Healing Spring appeared!`, `🌋 EARTHQUAKE! Enemies stunned!`, `The weather clears.`, tip 2 `Grandpa Ed says this kind of rain is 'character-building weather.'` — verbatim with emoji. New text (three events, two weather types, fishing lines, constellation names, `Gone Fishin'`) marked. Gran's status is unknown in canon; the file avoided any Gran-named feature and flagged it for the brainstorm doc — the right call for a §2(b)-adjacent question. |
| 3 | Pass. §3.1 disposes of every ATMOSPHERE section; the torch oscillator (§19 recipe 1) is ported exactly; the layer count per island is tabulated (7–8 at clear golden hour, minimum 5 met). |
| 4 | Pass. Every event, animal, and sky element carries a "reads at distance" note. |
| 5 | Pass. Explicit anti-palette check on the keyframe table: no neutral fog (sage `#8FA898` is the neutrality floor), no black shadow color, cream noon key, night exposure ≥ 0.80. |
| 6 | Pass. Light pool fixed at 8 with a priority order; ≈ 40 draw calls; GPU particle budgets per preset; tilt-shift drops first. |
| 7 | Pass. Build-ready Forest table for the pilot; the pilot's three times of day (golden hour 0.54, noon 0.35, night 0.78) and the weather toggle scope are specified. |
| 8 | **Conflict with `heroes.md`:** the file assumed 25 px = 1 m and a 128 m world; heroes fixed 40 px = 1 m and an 80 m island. Being reconciled by a design-lead pass: px-derived values (lightning placement and rings, spring radius, treasure/caravan speeds, crate drift, dungeon light ranges) recomputed; `vis.radius` 12 m kept as a design value and its interaction with enemies' 14 m perception stated (cap = 15 m by day, so 14 m stands; night, sand, fog, blizzard reduce it); fog far distances re-checked against an 80 m island; spell-light colors set to the hero glow tokens and Collette's light numbers taken from heroes.md. "Ranged enemies lose 30 % range in sand" is marked as a proposal (enemies.md does not include it). |
| 9 | 24 lines merged into `DECISIONS.md` (the reconciliation adds one). |
| 10 | Empty. |

**Orchestrator actions.** (a) **heroes.md addendum list** (applied once at the end of Phase 0.5, one design-lead pass, one DECISIONS line): one hand socket per rig for a carried lantern or held fish; `fish_cast`, `fish_reel`, and a `watch` idle (Phase 4); confirm `light.spell.<hero>` uses the glow tokens. (b) **Teardown erratum:** `SYSTEMS_INVENTORY.md` Part 1 (L2493, L2835) says the `weather` bounty can never complete; the HTML calls `updateBountyProgress('weather', …)` at L1611 and the bounty's type is `'weather'` (L688), so *Storm Chaser* works. Add to the Phase 0 part B reconciliation list with the §9.3 death-rate erratum. (c) Endless mode: this file designs only the event-driven hook; `story-beats.md` decides its fate. (d) The Crystal Caves: retired as an island here and in `enemies.md` (Crystal Golem at a Forest grotto); `story-beats.md` places any remaining cave content.

## story-beats.md — 620 lines — PASS (foundation file for the world)

| # | Result |
|---|---|
| 1 | Pass. Beat list (35 beats) and island table open §2 as required; landmark tables carry metre positions. |
| 2 | Pass. 51 strings grep-verified by the author; orchestrator spot-checked `The Green Meanie lives again`, `Something pulses faintly to the northeast`, `Isabella was here first`, `Nasty critters in that swamp`, `The final threshold. No turning back.` — all present verbatim in FAMILY_CANON. New text (11 items: two Ed hangar lines, the three-line `crater_hint`, four Bog Witch lines, three Sand Nomad lines, Quartz's subtitle, seven island cards, two camp cards) is marked and in the family's voice; no new line characterizes a kid beyond canon. The one §2(b)-adjacent item (a dedication in Dad's voice under the ending card) was correctly left to Andrew and is non-blocking. |
| 3 | Pass. §3 maps the biplane-as-character, the crash values, the crater's 8 s pulse, the portal arcs, the Citadel palette descent, the letterbox card, and the §19 lessons; "Lights in the Dark" is made literal by the one far light in Home, Wrong. |
| 4 | Pass. Every landmark has a read-at-distance note; the islands are described as seen from the plane. |
| 5 | Pass. Colors referenced only by name; NPC hexes for the Bog Witch and Sand Nomad are outside the hero bands (violet `#7B3CA0` is 11° from Collette's amethyst but 22 % darker — passes the 20°/15 % rule on lightness; `npcs.md` should re-check it). |
| 6 | Pass. The shard on the sky dome is one mesh; the far light is a directional fill plus a billboard; cutscenes render without simulating. |
| 7 | Pass. Flags as typed data with a `FlagExpr` trigger tree; the Phase 4 branch list for the flag test; build order inside Phase 2. |
| 8 | Four conflicts with wave 1 files, all resolved by orchestrator decisions in `DECISIONS.md` (2026-09-06 · phase-0.5/orchestrator): island footprints (story-beats wins; `layoutScale` tunable), the fire family's home (Rift primary, shard secondary), cages at camps A–C with dormant totems, endless mode cut. `enemies.md` (fire family column, camp counts, cage siting, endless pool) and `heroes.md` ("80 m island" sentence) get one-line edits in the end-of-phase consistency pass. Guardian placement (Golem in the Crystal Caves, the others at named landmarks) is consistent. |
| 9 | 23 lines merged into `DECISIONS.md`, plus 5 orchestrator reconciliation lines. |
| 10 | One non-blocking item for Andrew: an optional dedication line under the ending card, in Dad's voice (Brief §2(b)). The ending ships without it. Carried into `NEXT_SESSION.md`. |

**Orchestrator notes.** The opening (Ed's crash with the family aboard; the goblins take three kids that night) arranges existing canon rather than inventing it, and finally fires all eight `crash_landing` lines. Moving the Goblin King to the Act 1 climax matches Brief §8 Phase 2. `bosses.md` must retune him for an Act 1 party and keep the Kid Snatch faithful. Bosses to design: Goblin King, Ancient Treant, Pharaoh Wraith, Hydra Matriarch, Frost Lich, Crystal Colossus (lair), Magma Titan (lair, post-game), Citadel Warden, Shadow Queen, plus the shadow squad set piece and the two floor mini-bosses.

### Reconciliation landed: world-events-weather.md (2026-09-06)

Reconciled to 40 px = 1 m: 85 replacements; all 28 island fog columns remapped by a stated camera-relative rule (`near' = 8 + 0.6·near`, `far' = near' + 0.6·(far − near)`, cap 100 m) and the dungeon fog re-anchored to camera distance; lightning rings and damage kept at strict conversion (1.5 m, matching Ground Pound's ring so the decal system has one shape); `light.heroPool` 4 / 6 m, `light.torch` 2 m, and `vis.radius` 12 m kept as logged design values; `light.spell.<hero>` reduced to Collette's lights per heroes.md, with a `light.ring` row and a 6-slot hero-side reserve in the pool priority. Item 8 of the entry above is now resolved. Two flags for the end-of-phase consistency pass: (a) the file's §2.0 still says "80 m island" from the instruction it was given; the orchestrator decision the same day fixed island footprints to `story-beats.md` (Forest 360 × 300 m) — the fog distances are camera-relative and stand, the sentence and the caravan/treasure duration reasoning need one-line edits; (b) heroes.md nit: the §2.0 summary card prints Noah at 4.4 m/s while §2.5.1 says 4.375 — add to the heroes.md addendum list.

**Running heroes.md addendum list:** one free-hand carry socket per rig (`prop.L/R` are weapon sockets); `fish_cast`, `fish_reel`, `watch` clips (Phase 4); Noah 4.4 → 4.375 m/s in the summary card; the "80 m island" sentence in §2.5.1 → "the v27 map's equivalent; islands are authored per story-beats.md".

### Reconciliation landed: enemies.md (2026-09-06)

Reconciled to 40 px = 1 m and the final heroes: 124 replacements; hero facts replaced assumptions; three deliberate departures logged (a 1.0 m melee-reach floor for fodder cones, the Brute charge line widened to its hit swath, the Wyrm breath cone tied to its trigger range); flier rule chosen (hit tests in the ground plane; Bat at 0.9 m and Ember Sprite at 0.9 ± 0.3 m so Isabella's hip-height whirl reaches them); the pre-declared Goblin-base and Skeleton-scarf shifts applied; a full HSL check of 21 bodies plus elites, guardians and variants against heroes.md's 20° / 15 % rule with 11 hexes adjusted and the check tabulated in §2.2; `rooted`, chain, pierce N, Shatter and knockback impulses added; cage cloth = hero base, Hunter's Mark ring = Noah's glow; the shadow-squad vs shadow-tinted-horde distinction handed to `bosses.md`. Item 8 of the enemies entry is now resolved except the story-beats items already listed for the consistency pass (fire family column → the Rift, camp counts per island, cages at camps A–C with dormant totems, the endless pool). 6 new §6 lines merged.

## camp.md — 667 lines — PASS (the Phase 1 pilot's contract)

| # | Result |
|---|---|
| 1 | Pass. Stage table and the C1 prop list open §2 as required. |
| 2 | Pass. Canon strings kept and spot-checked (`A mysterious merchant has appeared!`, `Merchant sold out!`, `Find and rescue your siblings!`, `Is this from Grambi??`); the v27 bounty-board drawing is ported literally. New text marked: `Rest`, `Until dawn` / `Until dusk`, `Sit`, `Keep it`, the pose names, the pet names (`Orange Meanie`, `Sugar`, from the canon's pun voice and tip 5), the four garden stones' initials. §2(b) handled with care: no dog or cat (would invent a family fact), bedrolls never assigned to kids, the cabin has no interior, pet names are one-line data and never spoken. |
| 3 | Pass. The campfire and every lantern run the shared torch oscillator; every prop row lists ≥ 2 motion sources; the v27 tuft hash is kept literally on 1.5 m cells; the layer count at each station is stated. |
| 4 | Pass. Read-at-distance per prop; the four stations are specified with target, yaw, pitch, distance, FOV, and the derived camera position; S4 is sited so the rim and the below-rim clouds enter the frame (a geometry note passed to world-events). |
| 5 | Pass. `camp.*` and `forest.*` tokens with an explicit anti-palette check (teal-slate at 29 % lightness, cream ≤ 5 % of any frame, grass saturation ≥ 35 %, smoke tinted by the hemisphere sky). The washing line uses the kids' base colors by design (the hue rule governs enemies and NPCs). |
| 6 | Pass. ≈ 255,000 tris and ≈ 45 draw calls for the pilot quadrant (scatter 200,000 tris in 7 instanced calls, buffers rebuilt on cell crossing); four camp lights at most; a materials list of six; Rule 2 gates named. |
| 7 | Pass. Build-ready C1 (30 props with positions, sizes, sources, tris, colors, motion, light); stage build-in timelines; seats; rest and sit rules; persistence; test hooks; build order. |
| 8 | Three conflicts surfaced and designed around, none silently resolved: (1) heroes.md's "cabin windows" at the night station vs a C1 pilot with no cabin → the lit tent on the same `forest.window` token and schedule; (2) world-events gives two placed-lantern values (§2.1.3 1.2 · 6 m vs §2.8.2 1.0 · 4 m) → camp uses §2.1.3's; (3) axis convention: story-beats' `+z` south vs world-events' "north is +Z" → read as north = `−z`. Items 2 and 3 go to the consistency pass. Also for the pass: camp §2.4 cites enemies' old 1.2 m flier pass-over (now 0.5 m after reconciliation; the 1.1 m fence simply blocks fliers, which is fine). The plane envelope (≤ 6.5 × 8.0 × 2.6 m) is a stated assumption for npcs.md to confirm. |
| 9 | 30 lines merged into `DECISIONS.md`. |
| 10 | Empty. |

**Running consistency-pass list (end of phase):** world-events §2.0 "80 m island" sentence → story-beats footprints; world-events §2.8.2 `light.lantern` placed value → match §2.1.3 (1.2 · 6 m); world-events §2.1.2 axis sentence → north = `−z`; world-events cloud note (below-rim clouds visible only within ≈ 24 m of a rim at gameplay pitch); enemies fire-family home column → the Rift (shard secondary), camp counts per island, cages at camps A–C with dormant totems, the endless pool marked cut; camp §2.4 flier pass-over 1.2 → 0.5 m; heroes.md addendum (carry socket; `fish_cast` / `fish_reel` / `watch`; `sit_down` / `sit_idle` / `stand_up` per kid with the seated idles of camp §2.7.2 and Liam's fire-poke; Noah 4.4 → 4.375 in the summary card; the "80 m island" sentence). Plus whatever `npcs.md` and `bosses.md` add.

## bosses.md — 755 lines — PASS

| # | Result |
|---|---|
| 1 | Pass. Roster table opens §2 (twelve fights plus the shadow squad set piece). |
| 2 | Pass. 149 canon strings grep-verified by the author; orchestrator spot-checked `YOUR LITTLE FRIENDS ARE MINE!`, `KIDNAP PHASE - Protect your siblings!`, `Ruler of the Horde — Kid Snatch!`, Collette's caged line, `Sever the roots!`, `Hit hard to break the channel.`, `Track the afterimage.` — verbatim. New text: `The Shadow Squad` / `Four of them. Four of you.` (popup) and `The water rises!` — marked. The five guides' boss tips are made literally true by the mechanics. No §2(b) question; the shadow squad is the brief's own ask and its nameplates are the canon skin names. |
| 3 | Pass. The intro keeps the v27 4.1 s letterbox timeline exactly (freeze, `#0B0E1A` bars, 0.8 s card, overshoot, growl, the world trembling under a frozen frame) and adds the push-in from v27's own dungeon-boss zoom curve; boss light and emissive share one oscillator per boss; the shake ladder is kept verbatim and no hit-stop is added. |
| 4 | Pass. Heights 2.4–6 m with one signature shape per boss; a ×1.25 boss-arena follow distance so a 5.5 m Treant and the party fit one frame; read-at-distance per boss. |
| 5 | Pass. Twelve `boss.*` tokens; the King's red kept (23 points darker than ruby); Pharaoh and Titan moved off Noah's band; the Queen's `#A862C4` retired from her body and kept on the card only. |
| 6 | Pass. ≈ 90 draw calls worst case (Queen P4); one boss light plus the pool rules; 8-of-16 telegraph ownership and a 12-hazard pool; tri budgets per boss. |
| 7 | Pass. `BossDef` shape; 8 ported blocks with v27 data and 17 named new blocks, each with telegraph, windup/active/recovery and a sound hook; every line at its trigger per boss; test hooks include a call-site spy that the shadow squad never fires an ultimate. |
| 8 | Nine items surfaced; one real conflict: `enemies.md` §2.9 gave the Queen's clones the Runt rig — resolved in bosses' favor (the sibling's shadow rig) per the prompt; one-line edit in the consistency pass. Rulings logged: the two floor mini-bosses count for `Mini-Boss Slayer` but not island `kill_miniboss` quests; `light.boss` raised to 4 / 5 m (world-events allowed it); a heroes.md addendum (companions attack a sibling's ice block within 5 m before any enemy). Consistent with story-beats (King in Act 1, no portal; lairs; the Citadel folded into Home, Wrong; banished siblings restored) and camp (the Throne of Shadows is C6 mirrored). |
| 9 | 36 lines merged into `DECISIONS.md`. |
| 10 | Empty. |

**Orchestrator notes.** The Act 1 retune (HP `1400 + teamLv × 140`, dmg 28, everything else verbatim, `expectedTeamLv 7` as a Phase 2 tunable) restores v27's felt ratios rather than inventing a curve — accepted. The party-wipe rule (return to camp; the King waits at his phase) is the right call for an Act 1 climax. **Consistency-pass additions:** enemies.md §2.9 clone row → shadow rig; enemies.md §5 `Mini-Boss Slayer` note → per bosses; heroes.md addendum: the ice-block companion preference; ui-ux must check the Queen's card `#A862C4` against Collette's portrait ring.

## npcs.md — 944 lines — PASS

| # | Result |
|---|---|
| 1 | Pass. NPC roster and plane-state tables open §2. |
| 2 | Pass. Spot-checked `I wasn't crashing — I was testing re-entry angles! ...For a friend.`, `before the knees went`, `The spin was like eight rotations.`, `I call dibs on riding in the plane when it's fixed!`, `Rare goods from distant lands`, `🐸 Familiar died! Talk to Bog Witch to retry.` — verbatim. New text limited to the nine destination-card strings, `Fly` / `Talk`, Ed's `Character-building weather.` bubble (the tip is third-person), the Ed-ible description; story-beats' new lines quoted verbatim. Gran stays unseen with no new line. §2(b) handled correctly: Ed ships with no likeness details (no facial hair, glasses, or visible hair) and the file raises it as an optional item for Andrew. |
| 3 | Pass. The four biplane motion sources port as rules at v27 cadences and become diegetic per plane state; the scarf recipe is verbatim at full amplitude (Noah's is the half-amplitude rhyme); every NPC light runs the torch oscillator; the crate stagger and arc are kept with the units redesigned. |
| 4 | Pass. The camera fact (a 45–55° orbit never sees the sky) drives the flyover design: low lateral passes at 9 m chosen 60–120° off the camera yaw, the shadow blob and doppler carrying the approach. Every NPC has a read-at-distance line. |
| 5 | Pass. Every NPC body hue-checked against the four hero bases with the numbers shown; v27 `col` values kept as `ui` tokens (name plate, ring, marker); The Green Meanie is Cub yellow `#F4D21E` (the canon tip says yellow) with green wings and a green rudder; the Bog Witch and Sand Nomad bodies moved off Collette's and Noah's bands with story-beats' hexes kept as `NPC_DEFS`/`ui` tokens. |
| 6 | Pass. Plane ≤ 2,400 tris in 3 draw calls; NPC rigs ≤ 1,000; the portrait atlas rendered once per session; pooled exhaust and crates; the light pool used at placed-lantern and event tiers with ground-glow decals as the emissive fallback. |
| 7 | Pass. Strips, marks, and prompts per island in metres; an 18 s CS-04 beat table with per-state variants; a streaming contract with a 30 s cap; CS-01 values in metres (eight rotations for Noah's line; a 60 m skid that makes the furrow the strip); the `edInteract` state machine; rewards made true (goggles worn in flight, Ed-ibles heal 40 %). |
| 8 | Eight items surfaced, all designed around: the Witch and Nomad hue conflict (bodies darker, story-beats hexes as tokens — accepted; no exception to the hue rule needed); "wisps" resolved as Wraiths from wisp hollows plus `pt.wisp` particles; destination weather rolled at takeoff and committed at touchdown; Ed at the fire and the plane's last pass in CS-10 separated by the time skip. The plane envelope (6.0 × 7.2 × 2.5 m) fits camp.md's assumed ≤ 6.5 × 8.0 × 2.6 m and the hangar's 9 m × 3.6 m opening. Consistency pass: camp.md's Ed spots (§2.3.3) defer to npcs.md §2.1.6 and §2.3.1 (the Ed mark at (20, −2.2), the parking mark at (16, 0)). Heroes addendum: a `hat` socket (aviator goggles), four seated bench clips, a reach-up clip for lighting a post. |
| 9 | 30 lines merged into `DECISIONS.md`. |
| 10 | One optional item for Andrew (Ed's likeness), non-blocking; carried into `NEXT_SESSION.md`. |

## cutscenes.md — 605 lines — PASS

| # | Result |
|---|---|
| 1 | Pass. Cutscene roster opens §2; nine cutscenes plus the four rig modes that share the camera. |
| 2 | Pass. Spot-checked `Any landing you walk away from, am I right?`, `Don't worry! That's a CONTROLLED descent! ...mostly.`, `...Ten out of ten landing, Grandpa. Very dramatic.`, `What is that...?`, `A strange light glows in the distance...`, `Grandpa... are you okay?` — verbatim. No new spoken lines anywhere; the only new strings are the pad/touch skip variants and the ` · N/M` vote suffix. The dedication slot is reserved and empty (Andrew's). Ed is kept off-frame during the raid so nothing is claimed about a real person beyond the canon lines. |
| 3 | Pass. The boss-intro grammar is lifted whole; the meteor keeps its seven scenes, beats, numbers, flags and both ducks; the crater's pulse is phase-aligned to Gran's lines; the shake ladder is verbatim; every shot row lists its active layers (none below five); the shared oscillators run on the presentation clock through every cutscene. |
| 4 | Pass. A lens rule (24–50°, gameplay 35°) with the reasons the diorama needs it; the Ridge silhouettes shot from 34 m because a long lens from camp could not read a 0.9 m goblin. |
| 5 | Pass. Cutscene bars move from v27's pure `#000` to `#0B0E1A`; `cs.*` sky sets named; the portal keeps `#A862C4` as a light, not a body. |
| 6 | Pass. Scene 4's island from 420 m runs with shadows, curved world, fog and scatter off; 1,200 embers and 400 smoke billboards in pooled draws; lights per cutscene counted against the pool. |
| 7 | Pass. Shot tables with camera poses in metres and degrees, moves, eases, actions, captions, sounds and flags; the shot shape as a typed data contract; a screenshot station per shot for the art director. |
| 8 | Six items designed around, none needing a decision: Ed in CS-10 follows npcs.md (four kids and an empty stump in the last frame, which is also the title scene's state); two letterbox heights are two presets; CS-11 lands at 44 s not 40 (the eight captions set the floor); the meteor's "pan right" re-aimed at the crater's bearing; CS-08 designed without dungeons.md and handed to it; CS-06 forced to dusk by sky override. |
| 9 | 30 lines merged into `DECISIONS.md`. |
| 10 | Empty. |

**Consistency-pass additions from cutscenes.md:** heroes.md addendum — a `wave` clip per kid (0.8 s; Isabella both arms), a standalone `rise` segment, a first-person head-layer mask; enemies.md addendum — the goblin cart prop (1.8 × 1.0 m, rust timber) as the way cages travel; story-beats.md — CS-11 at 44 s, CS-03's `onEnd` sets the clock to night, the shard's three lights off from CS-10 on (a post-game sky rule), the two announces now fire on skip; world-events-weather.md — `cs.meteorSky` and `cs.void` sky sets, the crater's `warm` state after the ending, the shared meteor shader; camp.md — CS-10's last frame is S5 with four kids seated and Ed's stump empty.
