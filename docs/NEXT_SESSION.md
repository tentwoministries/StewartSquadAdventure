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

## Routing (2026-09-07, updated after the reel merge): read docs/LANES.md first

This checkout is lane **0.75 visual studies** (the default lane, the demo lane) on branch `phase-0.75-visual-studies`. If Andrew's first line names another lane, move to that lane's worktree before reading further. Open lanes: 0.75 visual studies (this checkout, :5173), 0.75 demo (`StewartSquad-demo/`, a tag, :5180), 0.75 scratch (`StewartSquad-scratch/`, branch `phase-0.75-scratch`, :5181), 0.85 story and play (`StewartSquad-story/`, branch `phase-0.85-story`), the Opus experiment (`StewartSquad-opus/`, branch `phase-0.75-opus-experiment`, :5182, judged, a record until the fix session retires it), and, once its session cuts it, the Fable control (`StewartSquad-control/`, branch `phase-0.75-fable-control`, :5183). The 0.75 biomes lane is merged and closed. Default when unnamed: this lane. **Opening phrases added 2026-09-08:** "the Opus fixes" → this lane, `docs/design/mockups/OPUS_FIX_PLAN.md`; "control build" / "control review" → the control lane, `FABLE_CONTROL_BRIEF.md`; "demo candidates", "build the next demo set", "a new demo" → this lane, `DEMO_PROGRAM.md` §2.

## Model and effort policy (Andrew, 2026-09-06)

- Orchestrator: Fable 5.1 at **high**, every session. At session start, confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset (it silently overrides every agent's frontmatter `effort`).
- `art-director`, `qa-inspector`, `design-lead`: `fable` / `xhigh`. Use `art-director-max` and `qa-inspector-max` (`fable` / `max`) only for Phase 1 excellence-mark scoring and phase-gate reviews.
- Implementers (`render-engineer`, `systems-engineer`, `dungeon-designer`, `world-builder`, `ui-designer`, `net-engineer`): `opus` / `high`.
- `archaeologist` and any mechanical work: `opus` / `medium`.
- Escalate an implementer to Fable only for unusually judgment-heavy work (Phase 1 shader and lighting, the curved-world shader, the `BOSS_BLOCKS` port, the multiplayer spike, anything that failed twice on Opus) by adding a separate agent file such as `render-engineer-fable.md` and one `docs/DECISIONS.md` line. Never Fable on mechanical work; never `max` except scoring or gating; one strong review pass over repeated weak ones.
- Phase 0.75 studies: the orchestrator writes the sandbox directly (logged exception); effort **medium** for the iteration loop, **high** when a study opens or a frame is approved (`PHASE_0.75_BRIEF.md` §5).


---

# Update 2026-09-08 (read this block first; the 2026-09-07 handoff below is still the state of the reel itself)

The Opus 5 experiment was judged on its own branch (`phase-0.75-opus-experiment`, worktree `StewartSquad-opus/`: `docs/design/mockups/OPUS_EXPERIMENT_VERDICT.md` there; scores 23–33/45 against this reel's Forest baseline at 35; three scenes worth keeping after one fix pass each, the flight's code and rows kept, the Rootways left). Nothing was merged. Andrew then adopted the program in **`docs/design/mockups/DEMO_PROGRAM.md`**: the rules architecture (§1), the demo-candidates session (§2), the hub categories (§3), the session order (§4) and the model policy (§5, also `CLAUDE.md` item 8).

**The next session on this lane is "the Opus fixes"** (`OPUS_FIX_PLAN.md`): its §0 cherry-picks the two lint fixes first, because `npm run check` is **red on this branch** (a `.cjs` parse error since the `build:demo` commit, plus 2,060 lint errors from `dist-demo/` when the build output exists); the commits on this branch since then, including today's, are docs-only. Independent of it, **"control build"** (`FABLE_CONTROL_BRIEF.md`) cuts a new lane from `8266a7b` and rebuilds the Rootways and the Crash Meadow cold on Fable for the apples-to-apples comparison Andrew asked for; **"control review"** judges it blind. After the fixes: **"demo candidates"** (`DEMO_PROGRAM.md` §2), then "build the next demo set". The story lane has not yet received today's routing docs (`LANES.md`, `CLAUDE.md`, `SESSION_PLAN.md`); the fix session cherry-picks them across (`OPUS_FIX_PLAN.md` §7).

Two review-session facts every sandbox session needs: a hidden Browser pane *and* a background Chrome tab both report `visibilityState: hidden`, so the clock stalls; step the runtime instead (`ssSave()` renders one 1/60 s frame; the fix session turns this into `_shared/step.ts`). And scene code may not write a non-active kid's `lookAt` (the runtime overwrites it each frame before the rig reads it); the fix session adds a `look` hook.

---

# Next session — handoff written 2026-09-07 (end of Phase 0.75 session 2: the demo reel is built; every scene awaits Andrew)

## Systems at a glance (read `docs/design/mockups/README.md` for the one-page map)

| Piece | Where | State |
|---|---|---|
| Design Bible (not edited in 0.75) | `docs/design/*.md` | `p0.5-design-bible` on `main` |
| Phase 0.75 process, sessions, prompts | `docs/design/PHASE_0.75_BRIEF.md` | studies first (done: the reel), then dialog clusters, then the application session |
| **The demo reel: five scenes** | `sandbox/index.html` (hub) · `forest-dusk/` (Liam) · `desert-noon/` (Noah) · `bog-night/` (Collette) · `frozen-night/` (Isabella) · `caves-descent/` (all four) · shared runtime and the four kid rigs in `sandbox/_shared/` | **all built; 56 frames saved (21 Forest from session 1, 35 new); nothing approved yet** |
| The kids | `sandbox/_shared/rig.ts`, `kid-liam.ts`, `kid-noah.ts`, `kid-collette.ts`, `kid-isabella.ts`; the read of the photos in `docs/design/PHASE_0.75_HEROES_NOTES.md` | T-15 proposed; Andrew and the kids judge the four close-ups |
| Decisions | `docs/design/PHASE_0.75_TWEAKS.md` (T-01..T-19) | Andrew's calls open on T-08, T-09, T-11, T-13, T-14, **T-15..T-19** |
| Numbers / log / frames | `mockups/style-draft.json` (`demoScenes` added) / `mockups/LOG.md` (session 2) / `mockups/*.png` (56) | nothing approved yet |
| Branches | **`phase-0.75-visual-studies`** (the demo lane; the reel is merged in, tag `p0.75-demo-reel-1`), `phase-0.75-scratch` (re-cut from the reel tip, throwaway), `phase-0.85-story` (the story lane) | `main` untouched |
| Worktrees | working checkout (`StewartSquad Adventure/`, :5173, the demo lane) · demo (`StewartSquad-demo/`, :5180, pinned at a tag) · scratch (`StewartSquad-scratch/`, :5181) · story (`StewartSquad-story/`) | one worktree per lane (`docs/LANES.md`) |

## Where we are

- **The whole reel exists.** `npm run dev` in this checkout, then `http://localhost:5173/sandbox/` is the hub; each card opens a scene at its best station and hour; `,` and `.` step between scenes from inside any of them, `H` comes back. Every scene has the Forest's keys plus `X` (the kid's flourish), `Tab` (the caves: swap the walked kid) and its own `0` `[` `]` (`O` lists them). `Enter` saves a frame with the card into `docs/design/mockups/` of whichever checkout serves the page.
- **The frames to look at first** (the reel's covers): `frozen-night-l1-01.png` (the aurora over the peaks and the lake), `bog-golden-l1-01.png` (the jetty and the hut across the water), `desert-golden-ar-01.png` (the arch), `caves-half-ht-01.png` (the heart from arm's length with the kids across the void), and the four close-ups `desert-noon-cu-01`, `bog-night-cu-01`, `frozen-morning-cu-01`, `caves-half-cu-01` (Noah, Collette, Isabella, the line-up).
- **What each scene is for and its treasures:** `docs/design/mockups/STUDY_NOTES.md` §7. The mechanics previewed: the Witch's Lanterns (Bog: stand by a dark post 1.5 s), the caves' lamps (T-02: the same rule, the bats leave the ledge), the rim crystals and the glow caps brightening near a kid, the heart's one oscillator.
- **The kids:** one rig, four specs, from the bible's proportions and colours with the hair and face touches from Andrew's photos (T-15). Each has an idle personality and a flourish on `X`: Liam taps the shield and nods; Noah spins the bow and crosses his arms with one brow up; Collette twirls the staff, plants it, sparkles, hand on hip; Isabella whirls (the ribbon), hops, and looks to see if Collette saw. The Forest scene still uses its own `liam.ts` (the same look).
- **Findings that became rows:** T-15 (the kids), T-16 (Bog fog: the bible's ranges bury the island at the wide station), T-17 (the aurora: at 160–200 m altitude no diorama frame ever sees it; lower curtains and a tilt-up beat), T-18 (the caves' layout as the seed for T-01..T-04, with the board `boards/caves-cross-section.svg`), T-19 (the Desert's dusk key). Older calls still open: T-08, T-09, T-11, T-13, T-14.
- **Branch state.** The reel (session 2's four commits) is merged into `phase-0.75-visual-studies` with a merge commit; the biomes branch and worktree are gone; `phase-0.75-scratch` is re-cut from the reel tip in `StewartSquad-scratch/`; `phase-0.85-story` runs in its own worktree. Tag `p0.75-demo-reel-1` marks the reel. `main` untouched.
- **Toolchain:** `npm run check` green (tsc, eslint, vitest) at every commit; `CLAUDE_CODE_EFFORT_LEVEL` verified unset at the session start; `.claude/launch.json` unchanged (the working checkout's :5173).
- **Design Bible:** unchanged (Phase 0.75 rule 1). Phase 0 part B still blocked on the brainstorm doc (Rule 1); the three legacy inputs are still missing from `docs/legacy/`.

## What to do next session (in order)

1. Read `docs/LANES.md`, this file, `CLAUDE.md`, `docs/design/mockups/README.md`, `LOG.md` session 2, `STUDY_NOTES.md` §6–§7, `LESSONS.md` and the tweak rows T-15..T-19. Confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset.
2. **Andrew's pass on the reel, and the kids' pass on the close-ups.** Reactions as tweak rows; his screenshots under `docs/reference/`; an approved frame's numbers marked `approved` in `style-draft.json` (the `demoScenes` block carries every number as rendered); T-08/T-09/T-11/T-13..T-19 settled where he answers; a `DECISIONS.md` line; a new demo tag. Expect the first asks to be tempo and character tweaks (the deer's lessons: slower, nearer, a key to trigger a beat); the creatures all run on `_shared/creature.ts` and every scene's creatures file has a `hud()` line and a `poi()` (what the kid looks at), so a tweak is usually one number.
3. **The anti-palette check** (`STUDY_NOTES.md` §3 row 6): the Forest scene with the forbidden looks, so everyone knows what to avoid. Last of the studies; one short session.
4. Then the dialog clusters (A first, the Crystal Caves with T-01..T-04 and now T-18 as the picture), the application session, and `p0.75-design-locked` per `PHASE_0.75_BRIEF.md` §2 and §4. The Phase 1 plan is preserved at `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md`; the application session points it at `style-draft.json`'s approved entries and the approved frames.

## Known issues and load-bearing findings

- **The camera follow holds the station until the first movement key** (`_shared/walk.ts`, `engaged`). The Forest's own `walk.ts` still follows from the first frame (its stations sit on Liam, so it never showed); if the Forest scene is ever moved onto the shared runtime, that is the one behavioural difference.
- **A kid hook must not add to an eased rotation** (`rig.ts` tracks `lookYaw`/`lookPitch` and sets the head each frame; hooks add on top). The same rule applies to any new eased value: ease a tracked number, then set.
- **Stations must sit inside the caves' shell** (a back-face ellipsoid: from outside it is invisible, which the cross-section station `W1` uses on purpose from outside the east wall). A station buried in a tier's rock renders black.
- **Saving a frame right after load gives a blank canvas** (session 1's finding, still true): wait about 10–12 s after a navigation before `window.ssSave()`; the caves take the longest to build. A blank frame is about 59 KB; real ones are 0.8–1.9 MB.
- **The Bog and the caves each run 15–20 point lights**; only some lanterns cast (`makeLantern` with cd 0 is emissive-only). More lights recompile every world material; add them knowingly.
- **The per-instance glow rides on `instanceColor.g`** (`material.ts`, verified against three r185's `USE_INSTANCING_COLOR`): an instanced emissive mesh whose colours are not grey will glow by its green channel.
- **`props.ts` in the Bog, Frozen and Caves scenes are 300–330 lines** (the §1 rule 6 cap is "about 400"); split one before adding to it.
- **Facing conventions** (unchanged): a kid's eyes are on local +z, `kid.face(bearing)` sets `rotation.y = 180° − bearing`; creatures built along +x use `90° − bearing` (`Wander.rotY()`). Getting this wrong shows a back at a close-up (it did, twice).
- **Shell heredocs and `node -e` strings with backticks mangle in this environment**; patch TypeScript with a `.cjs` script file in the scratchpad (`node patch.cjs`), never inline.
- From the Phase 0.5 handoff, still true: teardown errata for part B; historical 2026-09-06 decision lines superseded by the 2026-09-07 ones; a new `.claude/agents/*.md` is not loadable in the turn it is written; never `git add docs/design` wholesale while an unreviewed file sits there.

## Handy paths

`sandbox/index.html` · `sandbox/_shared/` (scene, rig, kid-*, walk, creature, particles, water, rim, lantern, plane, biomes, style, material, sky, post, shot, orbit) · `sandbox/forest-dusk/` · `sandbox/desert-noon/` · `sandbox/bog-night/` · `sandbox/frozen-night/` · `sandbox/caves-descent/` · `docs/design/PHASE_0.75_BRIEF.md` · `docs/design/PHASE_0.75_TWEAKS.md` · `docs/design/PHASE_0.75_HEROES_NOTES.md` · `docs/design/PHASE_0.75_ANIMALS_BRAINSTORM.md` · `docs/design/mockups/` (`README.md`, `LOG.md`, `STUDY_NOTES.md`, `style-draft.json`, `boards/`, the frames) · `docs/reference/` (`README.md`, `MOTION_TEMPO_NOTES.md`, the 21 frames, `Kids/`) · `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md` · `docs/BRIEF.md` · `docs/design/README.md` · `docs/DECISIONS.md` · `docs/PROGRESS.md`
