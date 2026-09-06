# Stewart Squad Adventure — Lights in the Dark

A family time capsule you can play: Andrew Stewart's four kids are the heroes. This repo rebuilds the v27 single-file Canvas game as a Three.js + TypeScript low-poly 3D action RPG. **The full brief is `docs/BRIEF.md`. Read it in full before writing a line of code.** This file is short on purpose; it points, it does not duplicate.

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

**Family canon is sacred.** The kids' names, colors, roles, and personality framing never change: **Liam** (blue, tank/leader), **Noah** (orange, ranger/archer), **Collette** (purple, mage/enchanter), **Isabella** (pink/red, berserker/guardian). Grandpa Ed flies the biplane. Existing dialogue, quest text, in-jokes, cutscene lines, voice lines, achievement names, and loading tips are ported **verbatim** — never paraphrased or "improved". New text may be added. Nothing ships that isn't family-friendly.

## Session rhythm (docs/BRIEF.md §9.3)

1. Read `docs/NEXT_SESSION.md` (handoff, rules at top). It is the source of truth for where we are.
2. Confirm the session plan in `docs/PROGRESS.md`.
3. Delegate to the agents in `.claude/agents/` (orchestrator plans, reviews diffs, runs gates; it does not write large implementations itself).
4. Review → gate if reached → commit + tag → rewrite `docs/NEXT_SESSION.md` → one summary message to Andrew.
5. Andrew's only recurring action: open the next session and say **"Continue from docs/NEXT_SESSION.md."**

Interrupt Andrew only for the four conditions in `docs/BRIEF.md` §2. Everything else: decide, add one line to `docs/DECISIONS.md`, keep moving.

## Where things live

| Path | What |
|---|---|
| `docs/BRIEF.md` | The brief. Source of truth. Never edit it to match the build; edit the build. |
| `docs/NEXT_SESSION.md` | Handoff. Rewritten at the end of every session. |
| `docs/SESSION_PLAN.md` | Phase → session map with the exact prompt Andrew pastes to start each one. |
| `docs/PROGRESS.md` / `docs/DECISIONS.md` / `docs/COMPLETE_STATE.md` | Dated task log / one line per decision / bridge doc updated at each phase gate. |
| `docs/INSPECTION_CHECKLIST.md` | The 27-step checklist (Working Rule 4), expanded. |
| `docs/legacy/` | v27 HTML + legacy docs. Read-only inputs. |
| `docs/reference/` | `fernwood.jpeg` visual north star (+ §4.1 written description). |
| `docs/teardown/` | Phase 0 outputs. `docs/visual-loop/` — Phase 1 iteration logs + screenshots. |
| `src/` | `engine/ render/ style/ sim/ world/ dungeons/ content/ ui/ net/ dev/` per §7.3. `src/style/` is the law after Phase 1. |
| `pilot/` | Phase 1 scene. Deleted after style lock. |
| `assets/` | GLB + woff2, every license in `assets/LICENSES.md`. No CDN, no paid assets, no runtime network. |
| `tests/unit` (Vitest) / `tests/smoke` (headless harness) | Sim tests / dev-console-driven smoke tests. |
| `releases/vX.Y/` | Single-file archival HTML builds (the time capsule). |

## Commands

```bash
npm run check          # tsc --noEmit + eslint + vitest — must pass before any commit
npm run dev            # Vite dev server on :5173
npm run build          # dist/ (self-contained, zero runtime network calls)
npm run build:archive  # dist-archive/index.html single-file time capsule
```

Node is pinned in `.nvmrc` (24.16.0); `.npmrc` enforces exact versions and engine-strict.

## Git

- `main` is protected by convention: no force-push, never rewrite history. A bad direction is reverted with a new commit plus a `DECISIONS.md` line.
- One branch per phase (`phase-0-teardown`, `phase-1-pilot`, …). Merge to `main` at each gate; tag the gate (`p0-teardown`, `p1-style-locked`, `p2-vertical-slice`, …).
- Commit per completed task; the message names the task from `docs/PROGRESS.md`. `npm run check` green first.
- Visual-loop screenshots are committed; they are the design record.

## Agents (`.claude/agents/`)

`archaeologist` (Phase 0) · `art-director` (scores screenshots; never edits code) · `render-engineer` · `world-builder` · `systems-engineer` · `dungeon-designer` · `ui-designer` · `net-engineer` · `qa-inspector` (runs the checklist; blocks the gate). Implementers run on Claude Opus 5; art-director and qa-inspector inherit the orchestrator's model (Fable 5.1). Parallelize agents whose files don't overlap; serialize anything touching `src/style/` or `src/sim/` core.

## Hard constraints (repeat of docs/BRIEF.md §2, §4.2, §7.2)

- No paid assets, paid services, telemetry, ads, accounts, or runtime network calls (optional multiplayer server excepted).
- Anti-palette never ships: uniform mid-green, gray fog on gray ground, pastel everything, pure-black shadows, default Three.js lighting, neon UI over a soft world.
- Every release: `dist/` + a single-file archival HTML under `releases/`. Lockfile and Node version pinned.
