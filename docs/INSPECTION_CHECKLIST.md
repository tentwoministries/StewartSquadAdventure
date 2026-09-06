# Single Pro Inspection Checklist V2 — 27 steps

Working Rule 4: **all 27 steps, every delivery, no tiers.** The qa-inspector runs this and writes `docs/qa/<phase-or-task>-<date>.md`. Implementers self-run the steps that apply before handing back. A gate with any failed step is blocked.

## P0 — Pre-build (before writing code)

| # | Step | Evidence |
|---|---|---|
| 1 | Memory / handoff read: `docs/NEXT_SESSION.md` and the relevant `docs/teardown/` docs were read in full | Cited in task notes |
| 2 | Design approval on record: the design or creative decision is logged in `docs/DECISIONS.md` (Brief §2: decide, log, proceed) | `DECISIONS.md` line |
| 3 | API verification done (Rule 2): every external interface touched was hit with a real call and the actual shape recorded | Shape recorded in task notes |
| 4 | Inherited code audited: any existing code the change builds on was read, not assumed | Files listed in task notes |

## P1 — Static

| # | Step | Evidence |
|---|---|---|
| 5 | `tsc --noEmit` clean (`npm run typecheck`) | Command output |
| 6 | Runtime import check: every new module is reachable from `src/main.ts` (or the pilot entry) and actually loads in the browser | Trace or console |
| 7 | AST / import trace: no circular imports, no dead exports introduced | `grep`/trace notes |
| 8 | Duplicate definitions: no repeated `export const` / `export function` / type names with different meanings across `src/` | `grep` output |
| 9 | TODO sweep: every `TODO` / `FIXME` / `HACK` added is either resolved or listed under Deferred (step 23) | `grep -rn` output |

## P2 — Semantic

| # | Step | Evidence |
|---|---|---|
| 10 | Call-chain trace: each new feature traced from entry point to effect, with no unreachable branches | Notes |
| 11 | Entry points: every new system is registered in the fixed-step loop / render loop / UI router where it belongs | File:line |
| 12 | Name collisions: identifiers, event names, save keys, and content ids are unique and unambiguous | `grep` output |
| 13 | Fuzzy / near-duplicate logic: no second implementation of something that already exists (formulas, lerps, RNG, easing) | Notes |
| 14 | Substring hazards: no `includes` / `startsWith` / regex matching on ids that prefix one another (`goblin` vs `goblinKing`) | `grep` output |
| 15 | Possessive / string hazards in content: apostrophes, quotes, emoji, `${}` and backticks in canon text survive the port byte-for-byte | Diff vs `FAMILY_CANON.md` |
| 16 | Router / state-machine transitions: every state is enterable and exitable; no orphan states; boss phases advance and terminate | Test or trace |

## P3 — Infra

| # | Step | Evidence |
|---|---|---|
| 17 | Priority ordering: system order in the sim tick is explicit and correct (input → movement → combat → status → loot → quests → events) | File:line |
| 18 | Data field coverage: every field of every ported teardown table is consumed or explicitly excluded with a reason | Coverage note |
| 19 | Async correctness: no floating promises, no `await` inside the sim tick, loaders resolved before use | `grep` + notes |
| 20 | Rate / frame budgets: `perf.json` from the capture run meets Brief §7.4 for the target preset | Numbers |
| 21 | Zero per-frame allocations in the hot loop; pools used for particles, projectiles, damage numbers | Profile or review |
| 22 | Determinism: same seed + same inputs ⇒ identical sim state hash (test present and green) | Test name |
| 23 | Deferred work listed: everything intentionally not done is written down with an owner phase | Task notes / `PROGRESS.md` |
| 24 | Exclusions documented: any legacy feature dropped or changed has a `KEEP_CHANGE_DROP.md` or `DECISIONS.md` line | Line reference |

## P4 — Delivery

| # | Step | Evidence |
|---|---|---|
| 25 | Filenames and packaging: files live where Brief §7.3 says; `npm run build` and `npm run build:archive` succeed; `dist/` has zero runtime network references | Build output + grep |
| 26 | Regression suite green: `npm run check` and the smoke harness pass | Command output |
| 27 | Version stamp and counts: `src/engine/version.ts` + `package.json` bumped; line/size counts recorded in `docs/PROGRESS.md` | Numbers |
