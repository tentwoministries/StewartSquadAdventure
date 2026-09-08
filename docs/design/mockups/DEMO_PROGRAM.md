# The demo program: how rules, demos and sessions work from here (2026-09-08)

Written after the Opus 5 experiment was judged (`OPUS_EXPERIMENT_VERDICT.md` on `phase-0.75-opus-experiment`). Andrew's brief for this file, in his words: keep the creative mind free while the rules accumulate; get as much right on the first pass as we can, having learned from our mistakes; do not spend a ton of tokens fixing after the fact; triage what must always be known from what a build looks up; use the demos to catch mechanics categorically before the big build; and keep in mind that story facts change, so what we log are build-craft rules, not story.

This is the design. It is small on purpose. §1 is the rules architecture, §2 the demo-candidates session, §3 the hub's categories, §4 the session order with Andrew's opening lines, §5 the model policy he adopted.

## 1. Rules in three tiers, delivered by agents, so the brief stays one page

The thing that bogs a build down is not the number of rules; it is how many of them sit in Fable's context while it is trying to compose. So the rules live in three places by how they are used, a task's brief never pastes the ledger in, and the fetching is done by cheap Opus agents rather than by a tag system (Andrew, 2026-09-08: Opus agent tokens are plentiful, Fable's are a fixed budget per five-hour window and per week; a tag column and a script were designed first and dropped before they were built).

| Tier | What | Where | How it reaches a build |
|---|---|---|---|
| **0 · Always** | The Working Rules plus about a dozen build invariants that apply to every frame and every system: the anti-palette; one clean key and the hemisphere as fill; nothing pops (every state change eases over ≥ 0.15 s, every recurring motion runs on two incommensurate rates); the facing conventions; a station is a composition (check its line of sight); scatter within a step of the ground; large emissives ≤ 0.5 gain; about twenty point lights; density from props; the curved world's centre follows the camera; a mechanic is not built until it has been seen to run. | `LESSONS.md` §0, kept under fifteen lines; `CLAUDE.md` points at it | read every session by Fable and pasted verbatim into every implementer prompt |
| **1 · On request** | Every other ledger row, the tweak rows and the pre-build list, kept one line each under the ledger's section headings (Camera, Rigs, Light, Density, Process, and a **Misc** section for rows that fit nowhere yet) | `LESSONS.md`, `PHASE_0.75_TWEAKS.md`, `PRE_BUILD_TODO.md`, the bible | the **`rules-librarian`** agent (Opus, medium) reads a task's one-page brief and all of the above, and writes `docs/qa/rules/<task>.md`: the rows that apply, one line each with why, and the checks they imply, under forty lines; that sheet goes into the implementer's prompt |
| **2 · At test** | Any rule that can be expressed as a check: unit tests for pure functions (a schedule, a state machine, a placement), stepped-frame probes for motion (a state reached, a speed continuous, nothing pops), the art-director rubric for looks, a pixel check for the anti-palette, the perf overlay for budgets | `tests/unit/`, `sandbox/_shared/step.ts`, `docs/visual-loop/` | the task's brief lists its acceptance checks; the implementer runs them before reporting; after every delivery the **`rules-auditor`** agent (Opus, medium) reads the *whole* ledger against the diff, the frames and the check results and returns suspected misses with file and line, which Fable judges |

Six rules about the rules:

1. **A rule moves down the tiers as soon as it can.** When a ledger row gets a test, the row shrinks to one line that names the test. Prose is for what needs judgment; everything else becomes a check. This is what keeps Tier 1 from growing without bound.
2. **`story-dependent` rows are provisional.** Anything that encodes a story fact (a landmark's coordinates, who is at the camp in Act II, which island the plane crosses) says so in its row and is re-read at the application step, where the bible is the authority. Craft rows are permanent.
3. **Misc is a real section, and it is cleaned up on a schedule.** A lesson that fits no heading goes under Misc rather than being forced somewhere wrong; when three or four Misc rows are about the same thing, the next tidy gives them a heading (Andrew, 2026-09-08). The tidy happens at every application step and at the full-ledger review before Phase 1 (`PRE_BUILD_TODO.md` P-09).
4. **A row has a status, and only `fixed` rows are rules.** Something Andrew notices in a demo (the caves' stairs meeting the tiers at their insertion points, the kids clipping into rock on the way down: T-34) is logged as a tweak row with status `observed`. It becomes a ledger row only when it is fixed, because the rule is the fix, not the symptom. Until then it is a to-do, not a constraint on anyone's first pass.
5. **The whole ledger is read after every build, by an agent, and at gates, by the inspector.** The librarian's sheet is the per-task net; the auditor's pass is the master-list review Andrew asked for, after every delivery, at Opus prices; the `qa-inspector` (Fable) reads the ledger once more against each phase gate. Nothing else is added.
6. **Brief hygiene.** A demo or build task is one page: what, why, constraints, the acceptance checks, the list of files to read. Creative decisions stay the builder's (Brief §2). The rules arrive through the sheet and the checks, not through the prose.

Why this balances the two costs Andrew named: first-pass quality comes from Tier 0 (always present) plus the sheet of rows that actually apply; the token-expensive fix cycles come from silent misses, and executable checks plus the auditor catch those in the build session, which is exactly what the Opus experiment lacked (the goblins that never attack would have failed a five-line test on the first run, and the auditor would have flagged the never-run mechanic against the ledger's rule).

## 2. The demo-candidates session (the next demo-lane session)

A clean-context session on the demo lane, opened with "demo candidates". It reads the bible, the walkthrough (`docs/story/WALKTHROUGH.md` on the story lane, read-only), `STUDY_NOTES.md` §7, `LESSONS.md` and the tweak rows, and writes **`docs/design/mockups/DEMO_CANDIDATES.md`**: a table of the mechanics and looks the game needs that no demo has exercised yet, one row each, with what the demo would prove, the tags it exercises, the new vocabulary it needs (creatures, props, effects, UI), the rules it is likely to generate, a size (S/M/L), a priority, and dependencies. It ends with a proposed next set of three to five demos and their one-page briefs, each with acceptance checks.

Seed list, from what the reel and the experiment have not touched:

- **A true fight**: HP and damage, a dodge, the enemy loop reaching every state (telegraph, hit, recover), hit-stop inside the runtime, the companion's AI, a two-phase boss change. The experiment's meadow is a stand-in that never attacked; this is the real one.
- **A dungeon room**: one puzzle language, one traversal element, a door that reads as a door, the camera in an enclosed space (the caves' lesson).
- **A cutscene camera** on an arc-length spline at the bible's speeds, with the letterbox and a skip (the flight's lesson, done right).
- **UI over a scene**: the title card, a dialogue line, the scrapbook pause menu, the boss bar; the rubric's ninth criterion has only ever been scored on the card.
- **Time and weather in motion**: a keyframe crossfade, rain arriving, fog breathing; tempo of a *transition*, which no still can show.
- **Save and load** of a scene state; **touch and gamepad** on a phone; the **performance overlay** and the budgets (the rubric's tenth criterion has never had data).
- **The peaceful layer as a set**: fishing, a pet, the animals' reactions to a kid.
- **The anti-palette check scene** (already planned, `STUDY_NOTES.md` §3 row 6).

The session ranks these, not this file. Andrew then says "build the next demo set", or asks "is there a new demo you had in mind", and the builds run on short-lived branches off the demo lane's tip as `LANES.md` §1 describes.

## 3. The hub's categories (optional, when the reel is long enough)

`sandbox/index.html` grows a row of tabs above the cards: **Places** (the biome scenes), **Beats** (fights, cutscenes, dungeon rooms), **Systems** (UI, weather, save, perf, the anti-palette check), **Lab** (kept experiments not yet for the family, such as the flight until it is re-shot). Each card carries `data-cat="places beats"`; a card may sit in two. A dozen lines of script filter the cards; the default tab is Places. The fix session adds the attribute and the tabs when it re-adds the experiment's cards (`OPUS_FIX_PLAN.md` §7); nothing else changes.

## 4. Session order, and the line Andrew opens each with

| # | Session | Lane | Opening line | Brief |
|---|---|---|---|---|
| 1 | **The Opus fixes** | 0.75 visual studies (primary checkout) | `Continue from docs/NEXT_SESSION.md. Visuals lane (0.75): the Opus fixes.` | `OPUS_FIX_PLAN.md` |
| 2 | **The control build** (may run before 1, or in parallel; it never touches the demo lane) | new lane `phase-0.75-fable-control`, worktree `StewartSquad-control/`, :5183 | `Continue from docs/NEXT_SESSION.md. Control build.` | `FABLE_CONTROL_BRIEF.md` §1–§4 |
| 3 | **The control review** | the control lane | `Continue from docs/NEXT_SESSION.md. Control review.` | `FABLE_CONTROL_BRIEF.md` §5 |
| 4 | **Demo candidates** | 0.75 visual studies | `Continue from docs/NEXT_SESSION.md. Visuals lane (0.75): demo candidates.` | §2 above |
| 5 | **The next demo set** | short-lived branches off the demo lane | `Continue from docs/NEXT_SESSION.md. Visuals lane (0.75): build the next demo set.` or `… is there a new demo you had in mind?` | `DEMO_CANDIDATES.md` |
| — | The pre-build list (`docs/design/PRE_BUILD_TODO.md`): the experience-balance brainstorm (P-01) and the rest | as each item says | `Continue from docs/NEXT_SESSION.md. Story lane (0.85): experience balance.` for P-01 | `PRE_BUILD_TODO.md` |
| — | Scratch, any time | `StewartSquad-scratch/` | `Continue from docs/NEXT_SESSION.md. Scratch: <the idea>.` | the demo lane's handoff |

Sessions 1 and 2 are independent. Session 3 needs 2. Session 4 needs 1 (it reads the fixed reel and the tagged ledger). Session 5 needs 4.

## 5. The model policy Andrew adopted (2026-09-08, revised the same day for the budget shape)

Recorded in `CLAUDE.md` item 8 and `docs/DECISIONS.md`. The constraint is not dollars: Fable 5.1 has a fixed budget per five-hour window and per week; Opus 5 agent tokens are, for practical purposes, plentiful. So:

- **Fable is the planner, orchestrator, brief author, reviewer and judge**, and the author of the compositions and the light (stations, keyframes, the numbers that read); it writes code only for a piece that has failed twice on Opus. Its turns are few and dense: plan, fan out, review reports, decide, commit.
- **Opus agents do everything that can be described in one page and checked**: the librarian and the auditor at medium; implementers, including sandbox scenes built from Fable-authored briefs, at high; mechanical work at medium; never xhigh (the experiment's session ran xhigh and tripled its API calls).
- **A wrong result goes back to Opus, not to Fable**: a fresh agent with the finding, the file and line, and the check that must pass. Two rounds; on the third failure Fable takes the piece (the existing escalation rule). `SendMessage` is not available in this environment (verified 2026-09-08), so a "resend" is always a new agent with a self-contained prompt.
- The `art-director` stays on Fable at xhigh but scores hero frames only; the mechanical looks (the anti-palette pixel check, a frame that is blank or black) go to an Opus check first.
- The seven Opus agent files carry the batching and acceptance-check line; three new agent files exist for the loop: `rules-librarian`, `rules-auditor`, `sandbox-builder`.

The control build (§4, sessions 2–3) stays Fable-cold by design, because it is the comparison. **The Opus fixes session is the pilot of this loop** (`OPUS_FIX_PLAN.md`, "How this session runs"); the next demo set is the second run of it.

## 6. The delegated loop: the shape of a build session

What the review session's data says about delegation: Opus follows an explicit plan about four lines in five; it drops mechanical lines silently where no check exists; it does not verify motion unless told how; and one-tool-per-turn habits triple its calls. So every Opus task must be self-contained, checkable and batched, and Fable must review results, not files.

1. **Plan (Fable, one or two turns).** Read the handoff. Write the run plan into the session's brief: the tasks, each with the files to read, the files it may touch, its acceptance checks, its agent and effort. Parallel where files do not overlap; serialize anything touching `sandbox/_shared/`, `src/style/` or `src/sim/` core.
2. **Sheets (Opus, medium, all in one message).** One `rules-librarian` per task writes `docs/qa/rules/<task>.md`.
3. **Build (Opus, high, all in one message).** One implementer per task. The prompt is self-contained: the Working Rules and `LESSONS.md` §0 verbatim, the task's page, its rule sheet, its checks, the conventions that bit the experiment (facing, units, lowercase frame names, `?t=` on every save, the stepping harness for anything that moves), and the definition of done: checks green, frames saved, a report that lists every file and line changed and every check's result.
4. **Review (Fable).** Read the reports, the check results and the frames (`Read` the PNGs; hero frames to the `art-director`). Do not re-read the code unless a report is inconsistent. For each miss: a fresh Opus fixer with the finding, the file and line, and the check that must pass. Two rounds.
5. **Audit (Opus, medium).** The `rules-auditor` over the delivery; Fable judges its list; fixers again if needed.
6. **Close (Fable).** `npm run check` green, commit per task, rows to the ledger (an Opus mechanical pass can write them from the reports), the handoff.

Fable's spend per session is then roughly: the plan, a review per task, the judgments, the handoff. Everything that reads whole files, writes code, runs probes or saves frames is Opus.
