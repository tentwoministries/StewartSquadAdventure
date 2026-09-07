# The Design Bible — `docs/design/`

**Authority.** From Phase 0.5 on, these files are the design authority for every implementer, alongside `docs/BRIEF.md`. The brief says what the game must be; the bible says what each system *is*. Where the bible is more specific than the brief, the bible wins; where they conflict, the brief wins and the conflict is logged in `docs/DECISIONS.md` and fixed here. The teardown (`docs/teardown/`) stays the record of what v27 did; nothing here rewrites it.

**Contract (Andrew, 2026-09-06).** One file per system. Each file has three mandatory sections — **What v27 does → What it becomes → What preserves the magic** — followed by build notes, cross-references, the decisions it logged, what to reconcile when the brainstorm doc lands, and open questions. `docs/teardown/ATMOSPHERE_RECIPES.md` is the constraint every redesign honors. Names, core personalities, and canon text never change; colors and roles are decided in `heroes.md` only, with logged rationale.

**Written by** the `design-lead` agent (`.claude/agents/design-lead.md`, Fable at xhigh) and reviewed by the orchestrator. Revise a file only through that agent, with a `docs/DECISIONS.md` line; never edit a design file to match code — edit the code.

## Files and status

| File | System | Depends on | Status |
|---|---|---|---|
| `heroes.md` | The four kids: color, role, silhouette, props, animation personality, kit as data, pilot Liam spec | — | reviewed 2026-09-06 |
| `enemies.md` | All 17 v27 enemy types + elites + overworld mini-bosses, each readable at gameplay distance | heroes (colors) | reviewed 2026-09-06; reconciled to heroes.md |
| `story-beats.md` | The *Lights in the Dark* spine, quest graph, world map across the islands, where every canon line is delivered | — | reviewed 2026-09-06 |
| `world-events-weather.md` | Day/night keyframes, weather, aurora, ambient layers, world events, the peaceful layer | — | reviewed 2026-09-06; reconciled to 40 px = 1 m |
| `bosses.md` | Goblin King (Kid Snatch), Ancient Treant, Pharaoh Wraith, the Bog and Frozen bosses, Citadel Warden, Shadow Queen, the shadow squad; `BOSS_BLOCKS` in 3D | heroes, enemies, story-beats | reviewed 2026-09-06 |
| `npcs.md` | Grandpa Ed (character, biplane as travel system, repair chain, supply drops), Gran, biome guides, merchant, Bog Witch, Sand Nomad | heroes, story-beats | reviewed 2026-09-06 |
| `camp.md` | The Fernwood-style camp and its growth stages | story-beats, world-events-weather | reviewed 2026-09-06 |
| `dungeons.md` | The five dungeons, expanded from Brief §5.3: core mechanic, traversal, puzzle language, set piece, boss arena | bosses, enemies, story-beats, world-events-weather | reviewed 2026-09-06 |
| `cutscenes.md` | Every shot table reshot for the 3D cinematic camera: meteor, crash landing, boss intros, biplane travel, ending | heroes, story-beats, npcs, bosses, camp | reviewed 2026-09-06 |
| `ui-ux.md` | Scrapbook menus, HUD, title cards, boss bar, captured-hero overlay, input, accessibility, onboarding | heroes, camp, bosses, enemies, story-beats | reviewed 2026-09-06 (three edits in the consistency pass) |
| `audio.md` | The procedural `snd()` port, music, ambient loops, per-system cue map | everything above | reviewed 2026-09-07; consistency pass applied 2026-09-07 |

**Decided in `heroes.md` (2026-09-06):** Liam sapphire `#2A62CF` · Noah fox orange `#EE7F24` (v27 green `#2DB86A` as accent) · Collette amethyst `#9D4FD8` · Isabella ruby `#D6294E` (v27 gold `#F0C040` as accent). Role labels: Tank · Ranger · Mage · Whirlwind. World scale: **40 px = 1 m** (1 px = 0.025 m) for every v27 distance. Hero heights 1.52 / 1.40 / 1.30 / 1.14 m.

Status values: `not started` → `draft` (agent delivered) → `reviewed` (orchestrator review passed, see `docs/qa/phase-0.5-design-review-<date>.md`) → `revised` (after a later change, with its DECISIONS line).

## Reading order for implementers

1. `heroes.md` §2 summary card (every other file assumes it)
2. `story-beats.md` §2 world map and beat list
3. The file for your system, then the files it lists under "Depends on"
4. `docs/teardown/` for the v27 detail each file cites

## Phase 0.5 Definition of Done (Brief §8)

Every system above has a design file with the three mandatory sections; the orchestrator has reviewed each one and recorded it; every departure from v27 is logged in `docs/DECISIONS.md`; `docs/BRIEF.md` §2, §4–6, §8 point here; `CLAUDE.md` points here; `docs/NEXT_SESSION.md` hands off a Phase 1 that builds the redesigned Liam and camp.
