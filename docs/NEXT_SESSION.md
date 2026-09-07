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

## Model and effort policy (Andrew, 2026-09-06)

- Orchestrator: Fable 5.1 at **high**, every session. At session start, confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset (it silently overrides every agent's frontmatter `effort`).
- `art-director`, `qa-inspector`, `design-lead`: `fable` / `xhigh`. Use `art-director-max` and `qa-inspector-max` (`fable` / `max`) only for Phase 1 excellence-mark scoring and phase-gate reviews.
- Implementers (`render-engineer`, `systems-engineer`, `dungeon-designer`, `world-builder`, `ui-designer`, `net-engineer`): `opus` / `high`.
- `archaeologist` and any mechanical work: `opus` / `medium`.
- Escalate an implementer to Fable only for unusually judgment-heavy work (Phase 1 shader and lighting, the curved-world shader, the `BOSS_BLOCKS` port, the multiplayer spike, anything that failed twice on Opus) by adding a separate agent file such as `render-engineer-fable.md` and one `docs/DECISIONS.md` line. Never Fable on mechanical work; never `max` except scoring or gating; one strong review pass over repeated weak ones.
- Phase 0.75 studies: the orchestrator writes the sandbox directly (logged exception); effort **medium** for the iteration loop, **high** when a study opens or a frame is approved (`PHASE_0.75_BRIEF.md` §5).

---

# Next session — handoff written 2026-09-07 (end of Phase 0.75 session 1: the visual studies, study 1 rendered and awaiting Andrew)

## Where we are

- **Branch:** `phase-0.75-visual-studies`, off `main` at `fee956e`. Everything from this session is committed there: Andrew's 21 reference frames, the sandbox, the eight sample frames, the logs and tweak rows. `main` is untouched. The branch is also the base for a second AI's independent visual pass if Andrew wants one (`DECISIONS.md` 2026-09-07). It merges to `main` at the Phase 0.75 application step.
- **Study 1 (Forest dusk at the C1 camp, S1) is rendered and waiting for Andrew's verdict.** The sandbox runs: `npm run dev`, then `http://localhost:5173/sandbox/forest-dusk/?shot=S1&t=dusk&v=B` (all params and keys in `docs/design/mockups/LOG.md`). Eight frames are saved under `docs/design/mockups/`; the questions Andrew answers are `docs/design/mockups/STUDY_NOTES.md` §5 (variant A/B/C, S1 pitch, tilt-shift, curve, grass, Liam). Nothing is approved yet: `style-draft.json` is `status: draft`.
- **Findings that became tweak rows** (`docs/design/PHASE_0.75_TWEAKS.md` T-06..T-12): the bible's light intensities need a physical-unit conversion (T-07, agreed); at pitch 48° no tree canopy can enter S1 (T-08, Andrew's call); the scatter densities read as confetti (T-09, Andrew's call); the tent's 1.6 emissive blows out (T-10, agreed); variant B "ember dusk" is the orchestrator's pick (T-11, Andrew's call); ember rate (T-12, agreed); Andrew's motion-tempo observations (T-06, `needs-render`, filed in `docs/reference/MOTION_TEMPO_NOTES.md`).
- **Toolchain:** `npm run check` green with `sandbox/` in `tsconfig.json`; `vite.config.ts` carries the serve-only screenshot plugin; `.claude/launch.json` starts the dev server for the browser pane. `CLAUDE_CODE_EFFORT_LEVEL` verified unset.
- **Design Bible:** unchanged (Phase 0.75 rule 1). `p0.5-design-bible` on `main`.
- **Phase 0 part B** still blocked on the brainstorm doc (Rule 1). Legacy inputs still missing from `docs/legacy/`: `stewart-squad-v26-complete-state.md`, `stewart-squad-gameplay-brainstorm-v2.md`, `stewart-squad-dev-instructions.md`. `docs/reference/fernwood.jpeg` is now the `Fernwood1–3` set.

## What to do next session (in order)

1. Read this file, `CLAUDE.md`, `docs/design/PHASE_0.75_BRIEF.md` §3, `docs/design/mockups/LOG.md`, `STUDY_NOTES.md` and the tweak rows. Confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset. `git checkout phase-0.75-visual-studies`.
2. **Take Andrew's feedback on study 1** (his answers to `STUDY_NOTES.md` §5, and any marked-up screenshots, which go in `docs/reference/` with a row in the tweaks file). Iterate in `sandbox/forest-dusk/` until a frame is approved; each iteration is a `LOG.md` row and every few are a commit. On approval: copy the winning variant's numbers into `style-draft.json` as `approved` with the frame's filename, set the T-08/T-09/T-11 rows to `agreed`, and add a `DECISIONS.md` line.
3. **Study 2, deep night** (same scene, `?t=night`, station S1 or the approved S1 revision, then S2): stars, fireflies, the lantern pools, the ring's light, the moon band on the water. **Study 3, golden hour on the stream** (`?shot=S2&t=golden&walk=1`): water, rim light, foam, the walk pose. **Study 4, the four kids' line-up** needs Noah, Collette and Isabella rigs built the way `liam.ts` builds Liam (`heroes.md` §2.3.1 proportions, §2.1.1 colours); one file each under 400 lines. Then the Crystal Caves cross-section (T-03, a board first) and the anti-palette check.
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
