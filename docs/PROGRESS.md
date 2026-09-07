# Progress

Dated log, one entry per completed task. Newest at the bottom. Each phase gate gets a tag.

## Session 0 — Setup (2026-09-06)

- [x] `git init` on `main`, remote `origin` = https://github.com/tentwoministries/StewartSquadAdventure.git
- [x] Repo layout per Brief §7.3 (`src/*`, `docs/*`, `assets/*`, `tests/*`, `pilot/`, `releases/`)
- [x] Brief copied verbatim to `docs/BRIEF.md`; v27 HTML moved to `docs/legacy/`
- [x] Toolchain: Vite 8 + TypeScript 5.9 (strict) + Vitest 5 + ESLint 10 (type-checked); `npm run check` green; `npm run build` and `npm run build:archive` verified (single-file output confirmed)
- [x] `.nvmrc` = 24.16.0, `.npmrc` exact + engine-strict, lockfile committed
- [x] `CLAUDE.md` (working rules + pointers), `docs/WORKING_RULES.md` (the verbatim block), `docs/INSPECTION_CHECKLIST.md` (27 steps)
- [x] Nine agents in `.claude/agents/` per Brief §9.2, rules block appended verbatim to each
- [x] `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/SESSION_PLAN.md`, `docs/COMPLETE_STATE.md`, `docs/NEXT_SESSION.md`
- Size: scaffold `src/` 2 files; legacy HTML 9,901 lines / 821 KB

## Session 0 (continued) — Phase 0 teardown, part A (2026-09-06)

Branch `phase-0-teardown`. Six archaeologist agents (Opus) ran in parallel on the v27 HTML; the orchestrator spot-checked twelve systems (`docs/qa/phase-0-spotcheck-2026-09-06.md`).

- [x] `docs/teardown/AUDIO_INVENTORY.md` — 1,098 lines; 29 recipes, 3 music voices, 151 call sites
- [x] `docs/teardown/CONTROL_MODEL.md` — 939 lines; input, hero switching, companion AI, combo ults, multiplayer roles, keep/adapt/change table
- [x] `docs/teardown/FAMILY_CANON.md` — 1,466 lines; every player-facing string verbatim with trigger and line
- [x] `docs/teardown/ATMOSPHERE_RECIPES.md` — 1,195 lines; 19 recipe families with 3D equivalents
- [x] `docs/teardown/SYSTEMS_INVENTORY.md` — 5743 lines (Part 1 core gameplay 2,838 + Part 2 world/meta 2,896)
- [ ] `docs/teardown/KEEP_CHANGE_DROP.md` — blocked on `stewart-squad-gameplay-brainstorm-v2.md`
- [ ] `docs/teardown/PORT_MAP.md` — blocked on the same
- [ ] Phase 0 gate + `p0-teardown` tag — after the two above
- Policy: model/effort policy applied to all agents (`CLAUDE.md`); `-max` variants added for art-director and qa-inspector
- Size: teardown total 10,432 lines; legacy HTML 9,901 lines

## Session 1 — Phase 0.5 Design Overhaul, the Design Bible (2026-09-06 → 2026-09-07)

Branch `phase-0.5-design`, merged to `main` at the gate. Documents only. Eleven `design-lead` files (Fable, xhigh) written in three dependency waves; the orchestrator reviewed each against a ten-item checklist (`docs/qa/phase-0.5-design-review-2026-09-06.md`, all PASS) and merged every file's §6 into `docs/DECISIONS.md`; an end-of-phase consistency pass (2026-09-07) reconciled the files against each other.

- [x] `docs/design/heroes.md` — 765 lines; colors and roles decided (Liam sapphire Tank, Noah fox-orange Ranger, Collette amethyst Mage, Isabella ruby Whirlwind), 40 px = 1 m, the kit as data, the pilot Liam spec (§2.7), the rig addendum (§2.4.7)
- [x] `docs/design/enemies.md` — 472 lines; 17 types on five rigs, the telegraph language, hordes, cages at camps A–C
- [x] `docs/design/story-beats.md` — 624 lines; the *Lights in the Dark* spine, island footprints, the quest graph, the cutscene roster
- [x] `docs/design/world-events-weather.md` — 963 lines; keyframes, weather, aurora, events, the peaceful layer; the Forest keyframe table is build-ready (§2.1.3)
- [x] `docs/design/bosses.md` — 755 lines; `BOSS_BLOCKS` in 3D, twelve fights, Kid Snatch, the lairs, the intro grammar
- [x] `docs/design/npcs.md` — 944 lines; Grandpa Ed, The Green Meanie as the travel system, guides, merchant, Bog Witch, Sand Nomad, the escort
- [x] `docs/design/camp.md` — 670 lines; Stewart Camp C0–C7, the pilot C1 prop list (§2.2), the four screenshot stations (§2.11.5)
- [x] `docs/design/dungeons.md` — 914 lines; five authored dungeons, the run kernel, Home, Wrong composed
- [x] `docs/design/cutscenes.md` — 604 lines; one cinematic rig, nine shot tables, the meteor reshot one for one, photo mode
- [x] `docs/design/ui-ux.md` — 954 lines; scrapbook menus, HUD, input, accessibility, onboarding, saves, the crest, the dev console
- [x] `docs/design/audio.md` — 1,142 lines; 29 recipes as data, 17 families, ambient beds, the music engine, spatial rules, the cue map
- [x] `docs/design/README.md` — index, contract, statuses, reading order
- [x] Orchestrator review of all eleven (PASS); consistency pass 2026-09-07 (0.025 m/px everywhere, island footprints, the fire family's home, cages at camps A–C, endless cut, cue names, the apron mark); `DECISIONS.md` at 389 dated lines
- [x] `docs/BRIEF.md` §2 (colors and roles revisable with logged rationale), §4–6 (Design Bible pointers), §8 (Phase 0.5 with its Definition of Done); `CLAUDE.md` canon paragraph and `docs/design/` pointer; `.claude/agents/design-lead.md`
- [x] Gate `p0.5-design-bible` (2026-09-07), merged to `main`
- Process: the two Fable consistency agents died on the session limit and the pass re-ran on Opus with Edit (logged); `audio.md` slipped into the ui-ux commit unreviewed and was reviewed the next day (logged)
- Size: Design Bible 8,845 lines / 12 files; teardown 10,432 lines; legacy HTML 9,901 lines
- Still blocked (Rule 1): Phase 0 part B (`KEEP_CHANGE_DROP.md`, `PORT_MAP.md`, the `p0-teardown` tag) on the brainstorm doc; each design file's §7 lists what to reconcile when it lands

## 2026-09-07 — Phase 0.75 session 1: the visual studies, study 1 (branch `phase-0.75-visual-studies`)

Plan: set up `sandbox/` per `PHASE_0.75_BRIEF.md` §3.3 with verified library shapes, run study 1 (Forest dusk at the C1 camp from S1), produce a sample set for Andrew, log everything, edit no design file.

- [x] Branch `phase-0.75-visual-studies`; Andrew's 21 reference frames filed with `docs/reference/README.md`; `docs/reference/MOTION_TEMPO_NOTES.md` (Andrew's tempo observations, T-06)
- [x] Rule 2 verification of `postprocessing` 6.39.4 and three 0.185.1 shapes by real import (`docs/design/mockups/LOG.md`)
- [x] `sandbox/_shared/` (tokens and keyframes, patched world material with height fog + curved world + sway + per-vertex emissive, sky dome/stars/moon/clouds, post stack, stations and the PNG save) and `sandbox/forest-dusk/` (terrain plate + stream + pond + cliff rim, trees and the seeded scatter, the C1 prop list, the pilot Liam rig with idle/walk/ring, the deer, fire/embers/smoke/fireflies/pollen, the page with the title card, party strip and key hints); `npm run check` green with `sandbox/` included; 2,300 lines across 16 files, none over 400
- [x] Five iterations on the first frame; eight sample frames saved under `docs/design/mockups/`; `style-draft.json` (status draft) with every number; T-06..T-12 logged in `PHASE_0.75_TWEAKS.md`; `STUDY_NOTES.md` with the findings and the six questions for Andrew
- [ ] Andrew's verdict on study 1 (variant, station pitch, tilt-shift, curve, grass, Liam) → approved frame(s) marked in `style-draft.json` and `LOG.md`; then study 2 (deep night) and study 3 (golden hour on the stream, S2)
- Findings: the bible's light columns render as night under three's physical units (T-07); at pitch 48° no canopy enters S1 (T-08); the scatter densities read as confetti (T-09); the tent's 1.6 emissive blows out (T-10); variant B is the orchestrator's pick (T-11)
