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
