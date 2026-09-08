# The demo program: how rules, demos and sessions work from here (2026-09-08)

Written after the Opus 5 experiment was judged (`OPUS_EXPERIMENT_VERDICT.md` on `phase-0.75-opus-experiment`). Andrew's brief for this file, in his words: keep the creative mind free while the rules accumulate; get as much right on the first pass as we can, having learned from our mistakes; do not spend a ton of tokens fixing after the fact; triage what must always be known from what a build looks up; use the demos to catch mechanics categorically before the big build; and keep in mind that story facts change, so what we log are build-craft rules, not story.

This is the design. It is small on purpose. §1 is the rules architecture, §2 the demo-candidates session, §3 the hub's categories, §4 the session order with Andrew's opening lines, §5 the model policy he adopted.

## 1. Rules in three tiers, so the brief stays one page

The thing that bogs a build down is not the number of rules; it is how many of them sit in context while the model is trying to compose. So the rules live in three places by how they are used, and a task's brief never pastes the ledger in.

| Tier | What | Where | How it reaches a build |
|---|---|---|---|
| **0 · Always** | The Working Rules plus a dozen build invariants that apply to every frame and every system: the anti-palette; one clean key and the hemisphere as fill; nothing pops (every state change eases over ≥ 0.15 s, every recurring motion runs on two incommensurate rates); the facing conventions; a station is a composition (check its line of sight); scatter within a step of the ground; large emissives ≤ 0.5 gain; about twenty point lights; density from props; the curved world's centre follows the camera; a mechanic is not built until it has been seen to run. | `LESSONS.md` §0, kept under fifteen lines; `CLAUDE.md` points at it | read every session, like the Working Rules |
| **1 · By tag** | Every other ledger row, tagged from a fixed vocabulary: `camera` `station` `rig` `creature` `fight` `light` `fog` `water` `material` `scatter` `props` `sky` `cutscene` `flight` `ui` `harness` `process` `story-dependent` | `LESSONS.md` rows gain a `tags` cell; `node scripts/rules.cjs <tag> <tag>` prints the matching rows | a task's brief carries one line, `tags: creature, fight, camera`; the pre-build step (checklist P0) runs the script and pastes only those rows into the task's notes |
| **2 · At test** | Any rule that can be expressed as a check: unit tests for pure functions (a schedule, a state machine, a placement), stepped-frame probes for motion (a state reached, a speed continuous, nothing pops), the art-director rubric for looks, a pixel check for the anti-palette (fraction of a frame under 12 % luminance, hue spread), the perf overlay for budgets | `tests/unit/`, `sandbox/_shared/step.ts`, `docs/visual-loop/` | the task's brief lists its acceptance checks; delivery runs them; the checklist's P4 step is "the checks are green", not "the rules were remembered" |

Three rules about the rules:

1. **A rule moves down the tiers as soon as it can.** When a ledger row gets a test, the row shrinks to one line that names the test. Prose is for what needs judgment; everything else becomes a check. This is what keeps Tier 1 from growing without bound.
2. **`story-dependent` rows are provisional.** Anything that encodes a story fact (a landmark's coordinates, who is at the camp in Act II, which island the plane crosses) carries that tag and is re-read at the application step, where the bible is the authority. Craft rows are permanent.
3. **Brief hygiene.** A demo or build task is one page: what, why, constraints, the tag line, the acceptance checks. Creative decisions stay the builder's (Brief §2). The rules arrive through the tags and the checks, not through the prose.

Why this balances the two costs Andrew named: first-pass quality comes from Tier 0 (always present) plus the handful of tagged rows that actually apply; the token-expensive fix cycles come from silent misses, and executable checks catch those in the build session, which is exactly what the Opus experiment lacked (the goblins that never attack would have failed a five-line test on the first run).

What this session did *not* do: tag the thirty existing rows or write the script. The fix session does both when it adds its own rows (`OPUS_FIX_PLAN.md` §6), so the first tagging pass and the first use of it happen together.

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
| — | Scratch, any time | `StewartSquad-scratch/` | `Continue from docs/NEXT_SESSION.md. Scratch: <the idea>.` | the demo lane's handoff |

Sessions 1 and 2 are independent. Session 3 needs 2. Session 4 needs 1 (it reads the fixed reel and the tagged ledger). Session 5 needs 4.

## 5. The model policy Andrew adopted (2026-09-08)

Recorded in `CLAUDE.md` as the addendum to the 2026-09-06 policy and in `docs/DECISIONS.md`:

- Fable 5.1 for the sandbox and every demo, Phase 1, every design and story session, and every gate and review.
- Opus 5 at **high** for Phase 2+ implementers only when the task ships with executable acceptance checks (Tier 2 above); Opus at **medium** for mechanical work.
- Every Opus prompt carries "batch independent tool calls; read everything you need in one turn" (the experiment's session took three times the API calls of the comparable Fable session and cost the same).
- The agent files' frontmatter is unchanged; the seven Opus agents gained the batching line.

The control build (§4, sessions 2–3) can still move this: if the control's meadow and Rootways come out no better than Opus's under the same review, the sandbox goes back to being fair game for Opus with checks.
