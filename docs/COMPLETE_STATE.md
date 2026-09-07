# Complete state — the bridge doc

Updated at each phase gate. Describes every system that exists in the rebuild, where it lives, and its status. Until Phase 1, this is mostly a pointer table.

## Status: Phase 0.5 complete (gate `p0.5-design-bible`, 2026-09-07) — scaffold, Phase 0 part A, the Design Bible

| Area | State | Where |
|---|---|---|
| Brief | Copied verbatim | `docs/BRIEF.md` |
| Legacy source | v27 HTML present; three legacy docs + reference image **pending from Andrew** | `docs/legacy/`, `docs/reference/` |
| Teardown | 5/7 delivered and spot-checked (systems inventory, family canon, atmosphere, audio, control model); KEEP_CHANGE_DROP + PORT_MAP blocked on missing legacy inputs | `docs/teardown/`, `docs/qa/phase-0-spotcheck-2026-09-06.md` |
| Design Bible | 11 system files + README, 8,845 lines; every file reviewed (PASS) and consistency-passed 2026-09-07; authoritative alongside the brief (`CLAUDE.md`, Brief §4–6); hero colors and roles decided in `heroes.md`; revise only via `design-lead` plus a `DECISIONS.md` line | `docs/design/`, `docs/qa/phase-0.5-design-review-2026-09-06.md` |
| Toolchain | Vite 8, TS 5.9 strict, Vitest 5, ESLint 10; `npm run check` green; archive build verified | root configs |
| Engine / render / sim / world / dungeons / content / ui / net / dev | Empty folders with `.gitkeep`; `src/engine/version.ts` only | `src/` |
| Pilot | Not started | `pilot/` |
| Agents | 12 files (10 roles including `design-lead`, plus `art-director-max`, `qa-inspector-max`); model/effort policy in `CLAUDE.md` | `.claude/agents/` |
| Releases | None | `releases/` |

## Phase gates

| Gate | Tag | Date | Notes |
|---|---|---|---|
| Setup | `p0-setup` | 2026-09-06 | This document created |
| Phase 0 teardown | `p0-teardown` | — | part A merged 2026-09-06; part B waits on the brainstorm doc |
| Phase 0.5 Design Bible | `p0.5-design-bible` | 2026-09-07 | eleven files reviewed and consistency-passed; `DECISIONS.md` at 389 lines |
| Phase 1 style lock | `p1-style-locked` | — | |
| Phase 2 vertical slice | `p2-vertical-slice` | — | |
| Phase 3 world | `p3-world` | — | |
| Phase 4 finale | `p4-finale` | — | |
| Phase 5 polish | `p5-polish` | — | |
| Release | `v1.0` | — | |
