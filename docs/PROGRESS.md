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
- [x] **Andrew's quick pass, same day** (on `phase-0.75-scratch`, fast-forwarded into the studies branch, tagged `p0.75-demo-forest-1`): noon and golden-hour columns re-tuned (they blew out to pastel), tilt-shift softened and given a `B` toggle, the tent's inside-out panel fixed, drag-orbit and wheel-zoom, the deer wanders and grazes with two scripted passes (an arc up to the camp between the block and the bucket, then a drink at the pool) with a fast-start slow-arrival pace and a heading-wrap fix, a lowered eating pose, WASD walking with a damped camera follow, `Enter` saves. Andrew: "for a first pass THIS IS INCREDIBLE"; loves the tree scale (recorded on T-08). New rows T-13 (camera pitch range) and T-14 (`PHASE_0.75_ANIMALS_BRAINSTORM.md`). The studies are now framed as demo scenes, one per biome with one kid each (`STUDY_NOTES.md` §3), with the prototyping rules in §6

## 2026-09-07 — Phase 0.75 session 2: the demo scenes (branch `phase-0.75-biomes`, worktree `StewartSquad-biomes`)

Plan: build the four remaining demo scenes on the Forest scene's rules (`STUDY_NOTES.md` §6), one kid each and all four in the caves, with the kids read from Andrew's photos and notes; keep the Forest's keys; a hub; every scene's frames saved; decisions as rows; edit no design file.

- [x] Own worktree and branch (Andrew's demo session on the Forest scene untouched); `npm ci` there; dev server on :5181
- [x] `docs/design/PHASE_0.75_HEROES_NOTES.md` (the photos and Andrew's notes against the bible; T-15) and `docs/reference/Kids/` filed
- [x] `sandbox/_shared/`: the scene runtime, the rig and the four kids, the walk (shared, swappable, step limit), creature wander, particles, water sheets and ice, the plate and rim, lanterns, the intact plane, biome tokens and keyframes, the per-instance glow and the aurora wash in the world material
- [x] `sandbox/desert-noon/` (Noah), `sandbox/bog-night/` (Collette), `sandbox/frozen-night/` (Isabella), `sandbox/caves-descent/` (all four; the board `boards/caves-cross-section.svg` first); `sandbox/index.html` the hub; `,` `.` `H` in every scene including the Forest
- [x] 35 frames under `docs/design/mockups/` (8 desert, 9 bog, 9 frozen, 9 caves); `LOG.md` session 2; `STUDY_NOTES.md` §7 (the treasures); rows T-15..T-19; `style-draft.json` `demoScenes`; `npm run check` green throughout; 21 new files, none over 400 lines except `props.ts` in the Bog, Frozen and Caves (≈ 300–330 lines each)
- [ ] Andrew's pass on the reel (and the kids' pass on the four close-ups): reactions as rows, approved frames' numbers marked in `style-draft.json`, T-15..T-19 settled
- [ ] The anti-palette check scene (`STUDY_NOTES.md` §3 row 6), still last
- Findings: the camera follow must hold the station until the first key (every station in the new scenes is off the hero); a kid hook may not add to an eased head rotation (the 118° pitch); the bible's Bog fog and aurora altitude do not survive the diorama camera (T-16, T-17); the Desert's dusk key wants cooling (T-19); the caves' layout is a picture now (T-18)

## Demo lane — the program after the Opus experiment (2026-09-08, Fable 5.1, docs only)

- [x] `docs/design/mockups/DEMO_PROGRAM.md` (rule tiers, demo-candidates session, hub categories, session order, adopted policy), `OPUS_FIX_PLAN.md`, `FABLE_CONTROL_BRIEF.md`; `LANES.md` rows and phrases; `SESSION_PLAN.md` opening lines; `CLAUDE.md` item 8 and the program's row; the seven Opus agent files gained the batching and acceptance-check line; `NEXT_SESSION.md` update block
- [x] The Opus fixes session, done 2026-09-08 (see the section below)
- [ ] (was:) The Opus fixes session (`OPUS_FIX_PLAN.md` §0–§7): lint cherry-picks first (check is red on this branch until then), keepers in, shared-runtime hooks, `_shared/step.ts`, ten tests, the tagged ledger and `scripts/rules.cjs`, re-shot frames, hub tabs, lane retirement, routing docs to the story lane
- [ ] The control build and review (`FABLE_CONTROL_BRIEF.md`); then demo candidates (`DEMO_PROGRAM.md` §2); then the next demo set
- Note: `git cherry-pick` was blocked by the session's permission classifier, so the lint fixes were not brought across here; every commit on this branch since `a8945ab` is docs-only
- [x] Same day, revised for the budget shape: `DEMO_PROGRAM.md` §1 (librarian and auditor instead of tags), §5 and new §6 (the delegated loop); `OPUS_FIX_PLAN.md` gains its run table (the pilot); `CLAUDE.md` item 8 rewritten; three agent files added (`rules-librarian`, `rules-auditor`, `sandbox-builder`); `SendMessage` verified absent

## Demo lane — the Opus fixes, the pilot of the delegated loop (2026-09-08, Fable 5.1 at high as planner and judge; Opus agents built)

- [x] §0 the two lint picks (`d6bc834`, `1868c92`); `npm run check` green on this branch again, verified with `dist-demo/` present
- [x] §1 the four keepers cherry-picked with `-x` (Home Wrong, the Crash Meadow beat, the west rim, the flight); the review's record copied across; the Rootways left on `phase-0.75-opus-experiment`
- [x] The task briefs (`docs/qa/briefs/opus-fixes-*.md`) and one `rules-librarian` sheet per task (`docs/qa/rules/opus-fixes-*.md`); `puppeteer-core` 25.10.0 pinned so agents can drive the sandbox headless (Rule 2 probe: ANGLE D3D11 on the real GPU, a 1.17 MB frame)
- [x] §2 the shared runtime (`sandbox-builder`): `_shared/step.ts` (`ssStep`/`ssSnap`/`ssKey`, `?step=1` deterministic to 1e-15), the `look` hook, the runtime hit-stop holding `dt` and the sim clock (T-31, T-35), `readParams` honours `defaultTime` (T-29); `scripts/sandbox-drive.cjs` and `scripts/probes/` (32 probes by the end); one frame per scene unchanged
- [x] §3 the four fix passes, one `sandbox-builder` each in parallel, every acceptance check quoted with numbers: Home Wrong (the deer dissolves over 1.6 s, the swing ±25°/3.1 s, S3 lit, the far fire at 4 %), the meadow (all five goblin states in a stepped probe, windup 0.38 s after contact; the ribbon eases in over 0.27 s; shards under 0.5 m by +0.8 s), the rim (`place.ts` marches; the deer on `inside()` ground; the lip found 0.14 m from the sheet's end; the birds fire at 0.67 s), the flight (`schedule.ts`: cruise exactly 14 m/s, max speed step 0.10 m/s per frame, bounce 1 : 0.500, bank never pinned; every seat had faced the tail, T-26)
- [x] §5 tests: `flight.test.ts` (9), `place.test.ts` (11), `goblins.test.ts` (4, after `goblin-step.ts` was extracted with a byte-identical probe); 25 tests, no trim needed
- [x] §6 the ledger: §0 (14 lines), Misc, eight rows from the review plus two the auditor found missing
- [x] The `rules-auditor` (`docs/qa/rules/opus-fixes-audit.md`, 15 items; 3 mechanical fixes applied, 2 fix rounds spawned, the rest in the handoff) and the `art-director` (`docs/visual-loop/opus-fixes-2026-09-08.md`): Home Wrong S1 33 → **36**, Meadow L1 **35**, Meadow S2 33, Rim S2 30, Flight LD 30; the two at or above 35 go in front of the family
- [x] §7 the hub (tabs Places / Beats / Systems / Lab, nine cards; the meadow's card at L1), the Opus lane closed in `LANES.md` (the worktree deregistered; its folder still on disk, held by a stray vite on :5182), scratch re-cut, the routing docs copied onto `phase-0.85-story`
- [ ] Not done this session: showing the family (Andrew's pass, then the `p0.75-demo-reel-2` tag moves the demo worktree); the rim's picture fixes (backlit fall, S2's composition now that the lip moved 8.7 m inland); the flight's pastel cap (`_shared/biomes.ts`) and the tail skid (`_shared/plane.ts`); T-39/T-40 rulings at the application step
