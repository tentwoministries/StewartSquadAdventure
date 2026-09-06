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
