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
