# Session plan — phases, sessions, and the prompt to paste

Andrew's recurring action is one line per session. The orchestrator (Fable 5.1) does the rest and rewrites `docs/NEXT_SESSION.md` at the end of every session, so the same prompt always resumes the right work.

## The prompt (every session)

```
Continue from docs/NEXT_SESSION.md.
```

That's it. To opt in to multi-agent workflow fan-out for a session (useful for the teardown, the visual loop, and Phase 2/3 parallel builds), add the word **ultracode**:

```
Continue from docs/NEXT_SESSION.md. ultracode
```

## Effort level guidance

- **High** for the orchestrator is the recommended default. The orchestrator plans, delegates, reviews, and gates; the heavy reasoning happens inside the agents, whose effort is set in their own files (`.claude/agents/*.md`: art-director runs at `max`, everyone else at `high`).
- **Medium** is fine for short bookkeeping sessions (merging, tagging, re-running a gate).
- **Max** for the orchestrator only when a §2(d) interrupt happened (a gate failed after the max iterations) and the session is about deciding, not delegating.
- Ultracode / workflows are orthogonal to effort: they change how many agents run in parallel, not how hard each thinks.

## Phase → session map

Sessions are long by design. Each session runs until its phase gate or until the orchestrator judges the handoff is cleaner now than later. Expected counts are estimates; `NEXT_SESSION.md` is the truth.

| Session | Phase | What lands | Gate / tag |
|---|---|---|---|
| 0 (done) | Setup | Repo, tree, tooling, CLAUDE.md, agents, docs, brief copied | `p0-setup` |
| 1 | Phase 0 — Teardown | `docs/teardown/` (7 docs), orchestrator spot-check of ten systems | `p0-teardown` |
| 2–3 | Phase 1 — Pilot & visual loop | `pilot/` Forest scene, capture stations, up to 12 iterations, tokens promoted to `src/style/` | `p1-style-locked` |
| 4–6 | Phase 2 — Forest vertical slice | Full Forest island, all four heroes, Rootways, Treant, Goblin King, menus, save | `p2-vertical-slice` |
| 7–8 | Phase 3 — The world | Desert, Bog, Frozen Peaks, biplane travel, NG+ | `p3-world` |
| 9 | Phase 4 — Lights in the Dark | Shadow Realm, meteor cutscene, ending, photo mode, pets | `p4-finale` |
| 10 | Phase 5 — Multiplayer, audio, polish | Net spike + impl, procedural audio port, accessibility, perf | `p5-polish` |
| 11 | Phase 6 — Release | Single-file archival build, `releases/v1.0/`, README | `v1.0` |

## Inputs Andrew supplies (Brief §3, §10)

Place these before the Phase 0 session so the teardown is complete on the first pass:

- `docs/legacy/stewart-squad-v26-complete-state.md` (the bridge doc)
- `docs/legacy/stewart-squad-gameplay-brainstorm-v2.md` (story spine, resolved decisions — sacred)
- `docs/legacy/stewart-squad-dev-instructions.md`
- `docs/reference/fernwood.jpeg` (visual north star)

The v27 HTML is already in `docs/legacy/`. If any of the four are missing when a session needs them, the orchestrator stops and asks (Working Rule 1).

## When a session ends

You get one summary message: what was done, what was verified, screenshots if any, what's next, and whether anything needs you. If nothing needs you, open the next session with the prompt above.
