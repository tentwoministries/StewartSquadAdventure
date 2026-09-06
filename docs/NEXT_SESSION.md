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

**Family canon is sacred.** The kids' names, colors, roles, and personality framing never change: **Liam** (blue, tank/leader), **Noah** (ranger/archer), **Collette** (purple, mage/enchanter), **Isabella** (berserker/guardian). Grandpa Ed flies the biplane. Existing dialogue, quest text, in-jokes, cutscene lines, voice lines, achievement names, and loading tips are ported **verbatim** — never paraphrased or "improved". New text may be added. Nothing ships that isn't family-friendly. *(Noah's and Isabella's colors are under an open question to Andrew — see "Needs Andrew" below.)*

## Model and effort policy (Andrew, 2026-09-06)

- Orchestrator: Fable 5.1 at **high**, every session. At session start, confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset (it silently overrides every agent's frontmatter `effort`).
- `art-director`, `qa-inspector`: `fable` / `xhigh`. Use `art-director-max` and `qa-inspector-max` (`fable` / `max`) only for Phase 1 excellence-mark scoring and phase-gate reviews.
- Implementers (`render-engineer`, `systems-engineer`, `dungeon-designer`, `world-builder`, `ui-designer`, `net-engineer`): `opus` / `high`.
- `archaeologist` and any mechanical work: `opus` / `medium`.
- Escalate an implementer to Fable only for unusually judgment-heavy work (Phase 1 shader and lighting, the curved-world shader, the `BOSS_BLOCKS` port, the multiplayer spike, anything that failed twice on Opus) by adding a separate agent file such as `render-engineer-fable.md` and one `docs/DECISIONS.md` line. Never Fable on mechanical work; never `max` except scoring or gating; one strong review pass over repeated weak ones.

---

# Next session — handoff written 2026-09-06 (end of session 0)

## Where we are

- **Repo:** https://github.com/tentwoministries/StewartSquadAdventure. `main` holds the scaffold (tag `p0-setup`) and, once the PR merges, Phase 0 part A. Branch `phase-0-teardown` is the working branch until the `p0-teardown` tag.
- **Toolchain green:** `npm run check` (tsc + eslint + vitest), `npm run build`, `npm run build:archive` (single-file verified). Node 24.16.0 pinned.
- **Phase 0 teardown, part A done and spot-checked** (`docs/qa/phase-0-spotcheck-2026-09-06.md`, 12 systems verified against the HTML):
  - `docs/teardown/SYSTEMS_INVENTORY.md` (5,734 lines; Part 1 core gameplay, Part 2 world/meta)
  - `docs/teardown/FAMILY_CANON.md` (1,466 lines, every string verbatim)
  - `docs/teardown/ATMOSPHERE_RECIPES.md` (1,195 lines, with 3D equivalents)
  - `docs/teardown/AUDIO_INVENTORY.md` (1,098 lines, 29 recipes, 151 call sites)
  - `docs/teardown/CONTROL_MODEL.md` (939 lines, with keep/adapt/change recommendations)
- **Phase 0 part B not done:** `KEEP_CHANGE_DROP.md` and `PORT_MAP.md` need the brainstorm doc's resolved decisions (Rule 1). No `p0-teardown` tag yet.

## Needs Andrew (check these first; they gate specific tasks, not the whole session)

1. **Legacy inputs** into `docs/legacy/`: `stewart-squad-v26-complete-state.md`, `stewart-squad-gameplay-brainstorm-v2.md`, `stewart-squad-dev-instructions.md`; and `docs/reference/fernwood.jpeg`. Without the brainstorm doc, part B stays blocked. Without the image, Brief §4.1 is the binding description for Phase 1.
2. **Hero colors (Brief §2(b) interrupt).** Brief §1: Noah orange, Isabella pink/red. v27 code everywhere: Noah green `#2DB86A`, Isabella gold `#F0C040` (Isabella's cape and damage numbers orange `#D88030`, bows pink). Which does the rebuild use? Until answered: model Liam only, commit no Noah/Isabella color tokens.
3. **Repo visibility.** The remote is public; the brief asks for private. Flip it in GitHub settings if that is still the intent.

## What to do next session (in order)

1. Read this file, `CLAUDE.md`, and `docs/PROGRESS.md`. Confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset. Note the plan in `docs/PROGRESS.md`.
2. **If the legacy inputs are present:** run one `archaeologist` for `KEEP_CHANGE_DROP.md` and one for `PORT_MAP.md` (inputs: the five delivered docs + the brainstorm doc + Brief §5 and §7.3), plus one mechanical reconciliation pass of the five delivered docs against the complete-state and brainstorm docs. Then `qa-inspector-max` runs the Phase 0 gate, tag `p0-teardown`, merge to `main`, update `docs/COMPLETE_STATE.md`.
   **If they are still missing:** say so in the summary (Rule 1) and go straight to step 3; the pilot has no dependency on part B (logged in `DECISIONS.md`).
3. **Phase 1 — pilot.** Branch `phase-1-pilot`. Spikes first (each a Rule 2 gate with the verified shape written to `docs/visual-loop/spikes.md` and the decision in `DECISIONS.md`): Rapier vs custom capsule/heightfield; bitecs vs plain typed systems; Puppeteer vs Playwright headless capture with software GL (must produce a non-black PNG). Then `render-engineer` builds `pilot/` per Brief §8 Phase 1: Forest island, Liam idle/walk, camp props, stream, trees, deer, day/night, weather toggle, curved-world shader, full post stack, HUD stub, title card, dev console with four seeded stations × three times of day. `systems-engineer` in parallel: fixed-step 60 Hz loop with interpolation, seeded RNG, input layer (keyboard first; port the v27 keybind defaults from `CONTROL_MODEL.md` §1). Serialize anything touching `src/style/`.
4. **Visual loop:** capture → `art-director` scores (`art-director-max` once a pass looks like it could hit the excellence mark) → `render-engineer` implements → repeat. Commit every iteration's screenshots and log to `docs/visual-loop/`. Max 12 iterations; Brief §2(d) if unmet.
5. End of session: `PROGRESS.md`, `COMPLETE_STATE.md` if a gate passed, rewrite this file, one summary to Andrew.

## Known issues and load-bearing findings from the teardown

Read `docs/teardown/*` "oddities" sections before porting anything. The ones that change design decisions:

- **Core feel to preserve** (CONTROL_MODEL): hero switching is free, instant and total; the three idle heroes always fight; companions never spend ultimates. Do not add a swap cooldown.
- **Companion fall-through bug** at legacy L2290 damps companion combat movement to ~40–45 %. Porting "correctly" changes the feel; decide and log.
- **v27 has no campfire, lantern, sky gradient, stars, moon, ambient audio loops, biplane engine sound, gamepad support, save export/import, or world-space selection ring.** All are new work the brief asks for, not ports.
- **Orphaned canon to re-wire:** Ed's `crash_landing` lines, nine `HERO_REACTIONS` contexts, `crater_hint` (called but never written). `Bog Witch` and `Sand Nomad` are named but missing from `NPC_DEFS`, making the swamp escort quest unfinishable.
- **Enemies have no display names** in v27 (17 types, not 16). The rebuild must author them.
- **Skill-tree bonuses are silently wiped** by `recalcHeroStats` reading fields that do not exist; respec is a free-stats exploit. Port the intended behavior, not the bug; log it.
- Frame-rate hazards on port: per-frame friction, hard-coded `1/60` constants, Shadow Queen updated with a fixed dt. The fixed-step sim resolves these by design.

## Handy paths

`docs/BRIEF.md` · `docs/SESSION_PLAN.md` · `docs/INSPECTION_CHECKLIST.md` · `docs/DECISIONS.md` · `docs/qa/` · `.claude/agents/` · legacy source `docs/legacy/stewart-squad-v27.html` (script starts L516).
