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

## Routing (2026-09-08, after the Opus fixes): read docs/LANES.md first

This checkout is lane **0.75 visual studies** (the default lane, the demo lane) on branch `phase-0.75-visual-studies`. If Andrew's first line names another lane, move to that lane's worktree before reading further. Open lanes: 0.75 visual studies (this checkout, :5173), 0.75 demo (`StewartSquad-demo/`, now at tag `p0.75-demo-reel-2`, :5180), 0.75 scratch (`StewartSquad-scratch/`, branch `phase-0.75-scratch`, re-cut at this lane's tip, :5181), 0.85 story and play (`StewartSquad-story/`, branch `phase-0.85-story`; it received the routing docs 2026-09-08), and, once its session cuts it, the Fable control (`StewartSquad-control/`, branch `phase-0.75-fable-control`, :5183). The Opus experiment lane is **closed** (branch kept as the record, worktree deregistered; see Known issues for its folder). Default when unnamed: this lane. Opening phrases: "demo candidates" → this lane, `docs/design/mockups/DEMO_PROGRAM.md` §2; "control build" / "control review" → the control lane, `FABLE_CONTROL_BRIEF.md`; "show the kids" / "open the demo" → the demo worktree on :5180.

## Model and effort policy (Andrew, 2026-09-06; the delegated loop 2026-09-08)

- Orchestrator: Fable 5.1 at **high**, every session. At session start, confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset (verified unset 2026-09-08).
- `art-director`, `qa-inspector`, `design-lead`: `fable` / `xhigh`; the `-max` variants only for Phase 1 excellence-mark scoring and phase-gate reviews.
- Implementers and `sandbox-builder`: `opus` / `high`. `rules-librarian`, `rules-auditor`, `archaeologist` and mechanical work: `opus` / `medium`.
- **The delegated loop is now proven on a full session** (`DEMO_PROGRAM.md` §6; this session was its pilot): Fable plans, writes the briefs, reviews reports and frames, judges, commits. Every Opus prompt is self-contained (brief file + rule sheet file + the checks + the harness); a wrong result goes to a fresh Opus fixer twice, then to Fable. Fable wrote no scene code this session. The sandbox-direct exception for the orchestrator is retired for anything an agent can be briefed on.

---

# Next session — handoff written 2026-09-08 (end of the Opus fixes session; the reel is `p0.75-demo-reel-2`, awaiting Andrew's pass)

## Systems at a glance (the one-page map is `docs/design/mockups/README.md`)

| Piece | Where | State |
|---|---|---|
| Design Bible (not edited in 0.75) | `docs/design/*.md` | `p0.5-design-bible` on `main` |
| **The demo reel: nine scenes** | `sandbox/index.html` (the hub, with tabs **Places / Beats / Systems / Lab**) · Places: `forest-dusk/`, `desert-noon/`, `bog-night/`, `frozen-night/`, `caves-descent/`, `rim-dawn/` · Beats: `shadow-wrong/` (Home, Wrong), `meadow-golden/` (Crash Meadow, card at L1), the caves · Lab: `flight-golden/` (CS-04) | **tag `p0.75-demo-reel-2`**; the demo worktree is on it |
| The shared runtime | `sandbox/_shared/scene.ts` (+ `look` hook, hit-stop `ctx.stop`/`ctx.stopped`/`ctx.stopDt`, `simT`), `step.ts` (`ssStep`/`ssSnap`/`ssKey`, `?step=1`), `shot.ts` (`readParams(defaultT)`, `step`) | landed; one frame per scene checked twice |
| **The headless harness** | `scripts/sandbox-drive.cjs` (puppeteer-core 25.10.0 driving the installed Chrome) + `scripts/probes/*.cjs` (32 probes: runtime-*, shadow-*, meadow-*, rim-*, flight-*) | the way every agent drives a page; `node scripts/sandbox-drive.cjs "<url>" scripts/probes/<probe>.cjs` from the project root with the dev server up |
| Tests | `tests/unit/sandbox/flight.test.ts` (9), `place.test.ts` (11), `goblins.test.ts` (4), `tests/unit/version.test.ts` (1) | 25 pass; `npm run check` green at `5534567` |
| The ledger | `docs/design/mockups/LESSONS.md` | §0 the always-tier (14 lines), Camera, Rigs, Light, Density, Process, Misc; ten rows added this session |
| Rules per task | `docs/qa/briefs/opus-fixes-*.md` (the five briefs) · `docs/qa/rules/opus-fixes-*.md` (the librarian's sheets) · `docs/qa/rules/opus-fixes-audit.md` (the auditor, 15 items) | the pattern for every future build task |
| Scores | `docs/visual-loop/opus-fixes-2026-09-08.md` | Home Wrong S1 **36**, Meadow L1 **35**, Meadow S2 33, Meadow S1/S3/connect 32, Rim S2 30, Flight LD 30, Shadow CU 30 (before round 2), Rim S4/CU 29, Flight WG/CH 27 |
| Tweak rows | `docs/design/PHASE_0.75_TWEAKS.md` T-01..T-40 | new this session: T-35 (hit-stop holds the clock), T-36 (Isabella's ribbon: combat ring vs flourish), T-37 (CS-04's length, `story-dependent`), T-38 (a waterside needs a bank), T-39 (the 12 % floor is a lit-surface rule; ruled as a proposal, `DECISIONS.md`), T-40 (the ribbon's colour: bible ruby, built gold; `observed`) |
| Pre-build list | `docs/design/PRE_BUILD_TODO.md` | P-02 (the Opus fixes) **done**; P-01 (experience balance, story lane) and P-04 (demo candidates) open |
| Branches / worktrees | `phase-0.75-visual-studies` (this; tip `5534567`) · `phase-0.75-scratch` (re-cut at the tip) · `phase-0.85-story` (routing docs copied 2026-09-08, `75647ad`) · `phase-0.75-opus-experiment` (closed, kept) · `main` untouched | |

## Where we are

- **The Opus fixes are done** (`OPUS_FIX_PLAN.md` §0–§7, all steps): the two lint picks (check green with `dist-demo/` present), the four keepers cherry-picked with `-x`, the review's record copied, the shared runtime, four fix passes plus two fix rounds, the tests, the ledger, the audit, the scores, the hub, the lanes. Eleven commits from `d6bc834` to `5534567`; `docs/PROGRESS.md` has the itemised entry.
- **Two frames reach the family bar (≥ 35):** `shadow-wrong-s1-02-02.png` (Home, Wrong at the cold fire; 36 before round 2, round 2 measured S1 unchanged) and `meadow-golden-l1-02-01.png` (Crash Meadow from the lower station: the palisade and the totem give it the scale S1 lacks). The fight's evidence: `meadow-golden-ribbon-1-02-01.png`, `meadow-golden-shatter-0-02-01.png`, `meadow-golden-beat-02-01.png`. The dissolve filmstrip `shadow-wrong-dissolve-0..4-02-01.png` and the swing pair `shadow-wrong-swing-0/1-02-02.png` are the motion evidence.
- **The rim (best 31 at W1, S2 30) and the flight (best 30 at LD)** stay in the reel but are not for the family yet: the rim's lip moved 8.7 m inland when it was found by marching instead of asserted, so S2's fall now hangs against the rim's underside (a composition call: re-aim S2 or move the lip's authored bearing); the flight's pastel cap is the Frozen golden keyframe in `_shared/biomes.ts` and its tail skid is `_shared/plane.ts:30`, both outside a scene folder's remit.
- **What the pilot of the delegated loop measured:** five briefs and five rule sheets took about ten minutes of Opus at medium; the four scene builders ran 45–70 minutes each in parallel at high (about 380–500 k tokens each) and every one delivered its checks with numbers; the auditor found 15 items of which 3 were real misses (two ledger rows, the swing station's luminance), the rest deferrals already reported or wording; the art-director's report matched the builders' claims except where it measured (the meadow's ground hue is unchanged at SD 16°, the rim's picture fixes did not land). Fable's own spend went on the plan, the briefs, one review per report, the audit judgment and this handoff. It works; keep the shape.
- **Toolchain:** `npm run check` green at every commit (tsc, eslint, 25 tests); `puppeteer-core` 25.10.0 is a devDependency (no runtime dependency, no download: it uses the installed Chrome); `CLAUDE_CODE_EFFORT_LEVEL` verified unset.
- **Design Bible:** unchanged (Phase 0.75 rule 1). Phase 0 part B still blocked on the brainstorm doc (Rule 1); the three legacy inputs are still missing from `docs/legacy/`.

## What to do next session (in order)

1. Read `docs/LANES.md`, this file, `CLAUDE.md`, `docs/design/mockups/DEMO_PROGRAM.md` §2 and §6, `LESSONS.md` §0, and `docs/visual-loop/opus-fixes-2026-09-08.md`. Confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset.
2. **Andrew's pass on reel 2** (`npm run dev` here, or the demo worktree on :5180: `http://localhost:5180/sandbox/`; the Beats tab first). Show the two frames at the bar and the fight's evidence; take reactions as tweak rows; his screenshots under `docs/reference/`; approved numbers marked in `style-draft.json` (the four new scenes' `demoScenes` entries are still to be added there: a mechanical Opus task, from each scene's keyframe and station literals).
3. Then **"demo candidates"** (`DEMO_PROGRAM.md` §2: write `DEMO_CANDIDATES.md`), then "build the next demo set", each new scene on a short-lived branch off this tip, built by `sandbox-builder` from a Fable brief with a librarian sheet, per the pattern in `docs/qa/briefs/`.
4. Independent of this lane: **"control build"** (`FABLE_CONTROL_BRIEF.md`; note the brief's Rootways and Crash Meadow are now measured against reel 2's meadow, not reel 1's), then "control review".
5. The rulings owed at the application step: T-39 (the floor's wording), T-40 (the ribbon's colour), T-36 (the combat ring's 0.25 s vs the flourish's 0.92 s ribbon life), T-37 (CS-04's length), and the design-lead line the art-director asked for on a seated pose in `_shared/rig.ts` (`LESSONS.md` Misc).

## Known issues and load-bearing findings

- **The Opus worktree's folder is still on disk.** `git worktree remove` deregistered it from git, but `C:/Documents TEMP/ClaudeCode/StewartSquad-opus/` could not be deleted because the Opus session's vite (pid 15156, listening on :5182) still holds files; the session's permission classifier blocked killing it. Andrew: close that process (or reboot) and delete the folder. The branch `phase-0.75-opus-experiment` stays as the record.
- **Driving a page from an agent:** subagents have no Browser pane; the harness is `scripts/sandbox-drive.cjs` (headless Chrome renders on the real GPU: ANGLE D3D11, `visibilityState: visible`). Always `?step=1` and `ssStep(n)` for anything timed (deterministic to 1e-15; without it the clock drifts with the wall). `ssSnap(name)` saves through the shot plugin, which appends its own `-NN`, so a frame asked for as `x-02` lands as `x-02-01.png`. The dev server must be up first (the orchestrator starts it with `preview_start` `vite-dev`; agents must not start one).
- **Blocking on an agent's output with `TaskOutput` dumps its transcript on timeout** (thousands of lines); wait with a background `sleep` timer and the completion notifications instead.
- **Parallel agents appending to `LOG.md`, `DECISIONS.md` and `PHASE_0.75_TWEAKS.md` worked** when each was told to append last, one edit per file, re-reading first and anchoring to its own section; tweak-row numbers were taken in order (T-35..T-39) without collision.
- **A scripted patch must assert it changed something** (the Home Wrong builder's `str.replace` matched nothing twice and ran three iterations behind); the `.cjs` patch recipe in `LESSONS.md` Process row 2 needs that second half.
- **`voidify()` drains vertex colours but not instance tints** (the Shadow Realm's litter kept its autumn red until round 2 desaturated the tints); any future "recolour an imported scene" pass checks both.
- **A depth seam at portrait distance** (two 240-vertex surfaces at the same depth: Isabella's hair dome through the head sphere) is fixed at the station with `camera.near = 1.8`; the rig-side fix (the dome sitting on the head) is owed in `_shared/kid-isabella.ts`.
- From before, still true: the camera follow engages on the first movement key (`_shared/walk.ts`; the Forest's own `walk.ts` still follows from load, so `forest-dusk-s1-a-04/05` are framed tighter than `-03`); a kid hook must not add to an eased rotation; stations must sit inside the caves' shell; a saved frame right after load is blank (59 KB); the Bog and the caves run 15–20 point lights; facing conventions (`180° − bearing` for kids, `90° − bearing` for +x creatures); shell heredocs with backticks mangle (patch with a `.cjs` file); a new `.claude/agents/*.md` is not loadable in the turn it is written; never `git add docs/design` wholesale while an unreviewed file sits there.

## Handy paths

`sandbox/index.html` · `sandbox/_shared/` (scene, step, shot, rig, kid-*, walk, creature, particles, water, rim, lantern, plane, biomes, style, material, sky, post, orbit) · the nine scene folders · `scripts/sandbox-drive.cjs` · `scripts/probes/` · `tests/unit/sandbox/` · `docs/qa/briefs/` · `docs/qa/rules/` · `docs/visual-loop/opus-fixes-2026-09-08.md` · `docs/design/mockups/` (`README.md`, `LOG.md`, `LESSONS.md`, `STUDY_NOTES.md`, `DEMO_PROGRAM.md`, `OPUS_FIX_PLAN.md`, `OPUS_EXPERIMENT_VERDICT.md`, `FABLE_CONTROL_BRIEF.md`, `style-draft.json`, the frames) · `docs/design/PHASE_0.75_TWEAKS.md` · `docs/design/PRE_BUILD_TODO.md` · `docs/LANES.md` · `docs/DECISIONS.md` · `docs/PROGRESS.md` · `docs/BRIEF.md`
