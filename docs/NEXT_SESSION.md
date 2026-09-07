## Working Rules (apply to every session, every agent, every file)

These are Andrew's standing rules. They go at the top of every handoff document, every subagent system prompt, and `CLAUDE.md`. Subagents do not inherit the parent session's context, so each agent file must carry these verbatim.

1. **Missing inputs → stop and ask.** If a file, data source, or piece of context needed to do a task *properly* is missing, stop and ask Andrew rather than shipping incomplete work wrapped in disclaimers. Never paper over gaps. (Creative decisions are *not* missing inputs — see docs/BRIEF.md §2. Decide, log, proceed.)
2. **Pre-build gate for every external interface.** Before writing integration code against any API, package, or data format (Rapier, postprocessing, Colyseus, GLB loaders, save schema, Puppeteer GL flags), hit it with a real call and verify the actual response/shape. Never code against assumed or documented field names. Record the verified shape in the task's notes before proceeding. Non-negotiable.
3. **No assumptions in code.** Verify every field name, handler name, parameter, and format against the real source before writing tests, configs, or integration code. If unsure, grep the codebase first.
4. **Single Pro Inspection Checklist V2 — all 27 steps, every delivery, no tiers.** (Full list: docs/INSPECTION_CHECKLIST.md)
   - P0 pre-build: memory/handoff read, design approval on record, API verification done, inherited code audited
   - P1 static: `tsc --noEmit` clean, runtime import check, AST/import trace, duplicate definitions, TODO sweep
   - P2 semantic: call-chain trace, entry points, name collisions, fuzzy/near-duplicate logic, substring hazards, possessive/string hazards in content, router/state-machine transitions
   - P3 infra: priority ordering, data field coverage, async correctness, rate/frame budgets, deferred work listed, exclusions documented
   - P4 delivery: filenames, packaging, regression suite green, version stamp, line/size count
5. **Handoff is the source of truth.** Every session ends by writing `docs/NEXT_SESSION.md` with these Working Rules at the top, current state, what's done, what's next, and known issues. The next session starts by reading it.
6. **Deliverables are files, not chat.** Everything lands in the repo. Andrew never copy-pastes from chat.
7. **Tests: trim before adding.** Before generating new tests, do a trim pass on the existing suite; target ~100 tests per suite; propose specific trims with rationale before writing new ones.

**Family canon is sacred.** The kids' names, core personalities, and canon text never change: **Liam** (oldest, protective, steady — the leader), **Noah** (sharp, quick, independent), **Collette** (creative, imaginative), **Isabella** (youngest, fierce, unstoppable). Grandpa Ed flies the biplane. Each kid's color and role are set in the Design Bible (`docs/design/heroes.md`, Phase 0.5) and may be revised only there, with the rationale logged in `docs/DECISIONS.md`; Brief §1 is the starting point, not the law. Existing dialogue, quest text, in-jokes, cutscene lines, voice lines, achievement names, and loading tips are ported **verbatim** — never paraphrased or "improved". New text may be added. Nothing ships that isn't family-friendly.

## Routing (2026-09-07): read docs/LANES.md first

This checkout is lane **0.75 visual studies** (the default lane) on branch `phase-0.75-visual-studies`. If Andrew's first line names another lane, move to that lane's worktree before reading further. Open lanes: 0.75 visual studies (this checkout), 0.75 biomes (`StewartSquad-biomes/`, branch `phase-0.75-biomes`, may be live in another session), 0.75 demo (`StewartSquad-demo/`, a tag), 0.85 story and play (`StewartSquad-story/`, branch `phase-0.85-story`: the walkthrough, the kids' suggestions, the storyboard). Default when unnamed: this lane.

## Model and effort policy (Andrew, 2026-09-06)

- Orchestrator: Fable 5.1 at **high**, every session. At session start, confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset (it silently overrides every agent's frontmatter `effort`).
- `art-director`, `qa-inspector`, `design-lead`: `fable` / `xhigh`. Use `art-director-max` and `qa-inspector-max` (`fable` / `max`) only for Phase 1 excellence-mark scoring and phase-gate reviews.
- Implementers (`render-engineer`, `systems-engineer`, `dungeon-designer`, `world-builder`, `ui-designer`, `net-engineer`): `opus` / `high`.
- `archaeologist` and any mechanical work: `opus` / `medium`.
- Escalate an implementer to Fable only for unusually judgment-heavy work (Phase 1 shader and lighting, the curved-world shader, the `BOSS_BLOCKS` port, the multiplayer spike, anything that failed twice on Opus) by adding a separate agent file such as `render-engineer-fable.md` and one `docs/DECISIONS.md` line. Never Fable on mechanical work; never `max` except scoring or gating; one strong review pass over repeated weak ones.
- Phase 0.75 studies: the orchestrator writes the sandbox directly (logged exception); effort **medium** for the iteration loop, **high** when a study opens or a frame is approved (`PHASE_0.75_BRIEF.md` §5).

---

# Next session — handoff written 2026-09-07 (end of Phase 0.75 session 1: the visual studies, study 1 rendered and awaiting Andrew)

## Systems at a glance (read `docs/design/mockups/README.md` for the one-page map)

| Piece | Where | State |
|---|---|---|
| Design Bible (not edited in 0.75) | `docs/design/*.md` | `p0.5-design-bible` on `main` |
| Phase 0.75 process, sessions, prompts | `docs/design/PHASE_0.75_BRIEF.md` | studies first, then dialog clusters, then the application session |
| The demo scenes (= the visual studies) | `sandbox/<biome>/` + `sandbox/_shared/`; plan `mockups/STUDY_NOTES.md` §3, rules §6 | Forest built (`p0.75-demo-forest-1`); Desert, Bog, Frozen, Caves next |
| Decisions | `docs/design/PHASE_0.75_TWEAKS.md` (T-01..T-14) | Andrew's calls open on T-08, T-09, T-11, T-13, T-14 |
| Numbers / log / frames | `mockups/style-draft.json` (draft) / `mockups/LOG.md` / `mockups/*.png` | nothing approved yet |
| Branches | `phase-0.75-visual-studies` (work), `phase-0.75-scratch` (throwaway, currently identical), tags per demo state | `main` untouched |
| A demo that survives a working session | the worktree `C:/Documents TEMP/ClaudeCode/StewartSquad-demo` at `p0.75-demo-forest-1`, `npx vite --port 5180` there → `http://localhost:5180/sandbox/forest-dusk/?shot=L1&t=dusk&v=B` | the working checkout keeps 5173 |

## Where we are

- **Branch:** `phase-0.75-visual-studies`, off `main` at `fee956e`. Everything from this session is committed there: Andrew's 21 reference frames, the sandbox, the eight sample frames, the logs and tweak rows. `main` is untouched. The branch is also the base for a second AI's independent visual pass if Andrew wants one (`DECISIONS.md` 2026-09-07). It merges to `main` at the Phase 0.75 application step.
- **Study 1 (Forest dusk at the C1 camp, S1) is rendered and waiting for Andrew's verdict.** The sandbox runs: `npm run dev`, then `http://localhost:5173/sandbox/forest-dusk/?shot=S1&t=dusk&v=B` (all params and keys in `docs/design/mockups/LOG.md`). Eight frames are saved under `docs/design/mockups/`; the questions Andrew answers are `docs/design/mockups/STUDY_NOTES.md` §5 (variant A/B/C, S1 pitch, tilt-shift, curve, grass, Liam). Nothing is approved yet: `style-draft.json` is `status: draft`.
- **Findings that became tweak rows** (`docs/design/PHASE_0.75_TWEAKS.md` T-06..T-12): the bible's light intensities need a physical-unit conversion (T-07, agreed); at pitch 48° no tree canopy can enter S1 (T-08, Andrew's call); the scatter densities read as confetti (T-09, Andrew's call); the tent's 1.6 emissive blows out (T-10, agreed); variant B "ember dusk" is the orchestrator's pick (T-11, Andrew's call); ember rate (T-12, agreed); Andrew's motion-tempo observations (T-06, `needs-render`, filed in `docs/reference/MOTION_TEMPO_NOTES.md`).
- **Toolchain:** `npm run check` green with `sandbox/` in `tsconfig.json`; `vite.config.ts` carries the serve-only screenshot plugin; `.claude/launch.json` starts the dev server for the browser pane. `CLAUDE_CODE_EFFORT_LEVEL` verified unset.
- **Design Bible:** unchanged (Phase 0.75 rule 1). `p0.5-design-bible` on `main`.
- **Phase 0 part B** still blocked on the brainstorm doc (Rule 1). Legacy inputs still missing from `docs/legacy/`: `stewart-squad-v26-complete-state.md`, `stewart-squad-gameplay-brainstorm-v2.md`, `stewart-squad-dev-instructions.md`. `docs/reference/fernwood.jpeg` is now the `Fernwood1–3` set.

## Branches after Andrew's first quick pass (2026-09-07, evening): the studies are demo scenes

Andrew's framing, adopted: each study is a **demo scene** (walk around, tweak, screenshot) and the set is a reel to skip through before the full build; one scene per biome, each carrying one kid (`docs/design/mockups/STUDY_NOTES.md` §3). Branch rules from here:

- **`phase-0.75-visual-studies` is the one code branch for the sandbox and its docs.** Everything from the scratch pass earned its keep and was fast-forwarded in. The next demo scenes are built here, one folder per biome under `sandbox/`, and the session with Andrew's son happens here.
- **Tags mark demo states the family has seen:** `p0.75-study1-demo` (the first sample set) and `p0.75-demo-forest-1` (the Forest scene after Andrew's quick pass: day columns re-tuned, tilt-shift softened with the `B` toggle, tent fixed, orbit, WASD walking, the deer's two passes). A tag is where a demo can always be reopened.
- **`phase-0.75-scratch` is re-cut from the studies tip whenever a throwaway experiment is wanted**, and fast-forwarded back only if everything on it is a keeper; otherwise it is deleted and re-cut. It carries no history of its own worth keeping.
- **What gets captured, and where** (so the full implementation inherits the preferences without being over-constrained): decisions as tweak rows (`PHASE_0.75_TWEAKS.md`), numbers in `style-draft.json` once a frame is approved, the iteration record in `mockups/LOG.md`, and the prototyping rules for the next scene in `STUDY_NOTES.md` §6. Nothing in `sandbox/` is a spec; Phase 1 reads the approved frames, the rows and the numbers, not the sketch's code shape (`PHASE_0.75_BRIEF.md` §7).

## Demo state and the scratch branch (Andrew, 2026-09-07, earlier that day; superseded by the section above where they differ)

The study 1 sample set is frozen as tag **`p0.75-study1-demo`** on `phase-0.75-visual-studies`: `git checkout p0.75-study1-demo`, `npm run dev`, open `http://localhost:5173/sandbox/forest-dusk/?shot=L1&t=dusk&v=B` to demo it for Andrew's son. Quick, out-of-order suggestions are tried on **`phase-0.75-scratch`** (branched from the same commit): frames saved there are candidates, not approved; anything worth keeping becomes a tweak row and is cherry-picked onto the study branch. The structured process (this file, `LOG.md`, the tweak rows) continues on `phase-0.75-visual-studies`; the full design pass with his son happens there, with their screenshots filed under `docs/reference/` and a row per reaction. Nothing on the scratch branch is ever merged wholesale. Scratch so far (2026-09-07): day columns re-tuned, tilt-shift softened, tent winding fixed, drag-orbit and wheel-zoom in the sandbox (R resets to the station), the deer wanders and grazes, `docs/design/PHASE_0.75_ANIMALS_BRAINSTORM.md` (T-14) and the camera-pitch row (T-13). The deer wanders unless `freeze=1`, so a station frame taken without it varies slightly.

## What to do next session (in order)

1. Read this file, `CLAUDE.md`, `docs/design/PHASE_0.75_BRIEF.md` §3, `docs/design/mockups/LOG.md`, `STUDY_NOTES.md` and the tweak rows. Confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset. `git checkout phase-0.75-visual-studies`.
2. **Either the session with Andrew's son on the Forest scene** (their reactions as tweak rows, their screenshots under `docs/reference/`, an approved frame's numbers into `style-draft.json`, T-08/T-09/T-11 settled, a `DECISIONS.md` line, a new demo tag), **or the next demo scenes first** if he wants the reel before that session (Andrew's call; both are fine, the scenes do not wait on each other). Andrew's open questions are still `STUDY_NOTES.md` §5.
3. **The next demo scenes** (`STUDY_NOTES.md` §3, one folder each under `sandbox/`, built from `_shared/` by the §6 rules): **Desert at noon and dusk with Noah**, **Bog at night with Collette**, **Frozen Peaks under the aurora with Isabella**, then **the Crystal Caves descent with all four** (T-01..T-04; a board first). Each needs its hero rig built the way `liam.ts` builds Liam (`heroes.md` §2.3.1 proportions, §2.1.1 colours, one file under 400 lines), its keyframe set from `world-events-weather.md` §2.1.4 through the `UNITS` conversion and then tuned by eye, its creatures from `PHASE_0.75_ANIMALS_BRAINSTORM.md`, and its own `?shot=` list. Add `sandbox/index.html` as the reel's hub and a key to step between scenes. Reuse the Forest scene's `walk.ts`, `orbit.ts`, the deer's route pattern and the `B`/`Enter`/`0`/`[`/`]` keys unchanged so the family's hands already know every scene.
4. Then the dialog clusters (A first, the Crystal Caves, T-01..T-05), the application session, and `p0.75-design-locked` per `PHASE_0.75_BRIEF.md` §2 and §4. The Phase 1 plan is preserved at `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md`.

## Known issues and load-bearing findings

- **Saving a frame right after load gives a blank canvas** if the save fires before the first rendered frame (the synchronous world build takes several seconds). `save()` now waits for two rendered frames; when driving the page from the browser pane, wait about 8 s after a navigation before calling `window.ssSave()`. A blank frame is 58,885 bytes (the overlay alone); a real one is about 1.2 MB.
- **The sandbox's curved world does not bend shadows** (the depth material is not patched); harmless at `curve` ≤ 0.0012.
- **Fonts:** the title card uses Georgia/serif and Segoe UI fallbacks; Lora and Nunito are bundled in Phase 1 (`ui-ux.md` §2.0). Judge the card's layout and colour, not its letterforms.
- **Facing conventions in the sandbox:** Liam's eyes are on local +z, so a compass bearing b is `rotation.y = 180° − b`; the deer and any prop built along +x use `90° − b`. Getting this wrong showed Liam's back at the close-up (iteration 4).
- **Shell heredocs in this environment mangled long TypeScript sources twice**; write source files with the Write tool and patch with small `node -e` string replacements.
- From the Phase 0.5 handoff, still true: teardown errata for part B (`ATMOSPHERE_RECIPES.md` §9.3 MiniBoss rate; `SYSTEMS_INVENTORY.md` Part 1 Storm Chaser bounty); historical 2026-09-06 decision lines superseded by the 2026-09-07 ones; a new `.claude/agents/*.md` is not loadable in the turn it is written; never `git add docs/design` wholesale while an unreviewed file sits there.

## Handy paths

`docs/design/PHASE_0.75_BRIEF.md` · `docs/design/PHASE_0.75_TWEAKS.md` · `docs/design/mockups/` (`LOG.md`, `STUDY_NOTES.md`, `style-draft.json`, the frames) · `docs/reference/` (`README.md`, `MOTION_TEMPO_NOTES.md`, the 21 frames) · `sandbox/_shared/` (style, material, sky, post, shot) · `sandbox/forest-dusk/` (terrain, scatter, props, liam, deer, fx, main) · `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md` · `docs/BRIEF.md` · `docs/design/README.md` · `docs/DECISIONS.md` · `docs/PROGRESS.md`
