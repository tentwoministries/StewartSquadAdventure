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
