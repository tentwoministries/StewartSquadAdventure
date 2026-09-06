# Complete state — the bridge doc

Updated at each phase gate. Describes every system that exists in the rebuild, where it lives, and its status. Until Phase 1, this is mostly a pointer table.

## Status: Session 0 complete — scaffold only

| Area | State | Where |
|---|---|---|
| Brief | Copied verbatim | `docs/BRIEF.md` |
| Legacy source | v27 HTML present; three legacy docs + reference image **pending from Andrew** | `docs/legacy/`, `docs/reference/` |
| Teardown | Not started | `docs/teardown/` |
| Toolchain | Vite 8, TS 5.9 strict, Vitest 5, ESLint 10; `npm run check` green; archive build verified | root configs |
| Engine / render / sim / world / dungeons / content / ui / net / dev | Empty folders with `.gitkeep`; `src/engine/version.ts` only | `src/` |
| Pilot | Not started | `pilot/` |
| Agents | 9 defined | `.claude/agents/` |
| Releases | None | `releases/` |

## Phase gates

| Gate | Tag | Date | Notes |
|---|---|---|---|
| Setup | `p0-setup` | 2026-09-06 | This document created |
| Phase 0 teardown | `p0-teardown` | — | |
| Phase 1 style lock | `p1-style-locked` | — | |
| Phase 2 vertical slice | `p2-vertical-slice` | — | |
| Phase 3 world | `p3-world` | — | |
| Phase 4 finale | `p4-finale` | — | |
| Phase 5 polish | `p5-polish` | — | |
| Release | `v1.0` | — | |
