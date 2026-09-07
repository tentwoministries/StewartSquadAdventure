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

## Lanes (2026-09-07): naming the lane in the first line

Several lanes are open at once, each in its own branch and worktree (`docs/LANES.md`). The plain prompt above lands in the default lane (0.75 visual studies, the primary checkout). To go elsewhere, add the lane to the line; the session reads `docs/LANES.md` and moves to that worktree first:

```
Continue from docs/NEXT_SESSION.md. Visuals lane (0.75): <the scene or study>.
Continue from docs/NEXT_SESSION.md. Story lane (0.85): reading session with the kids on <section or Act>.
Continue from docs/NEXT_SESSION.md. Ready to launch: start Phase 1.
```

The last one only works once both lanes are locked (`p0.75-design-locked`, `p0.85-story-locked`); otherwise the session lists what is still open and asks which to finish.

## Effort level guidance (Andrew's policy, 2026-09-06)

- **Orchestrator: Fable 5.1 at High, every session.** No exceptions; the heavy reasoning happens inside the agents.
- Agent model/effort is fixed in each `.claude/agents/*.md` frontmatter (see `CLAUDE.md`): judgment roles on Fable at xhigh (max only for excellence-mark scoring and phase gates), implementers on Opus at high, mechanical work on Opus at medium.
- Ultracode / workflows are orthogonal to effort: they change how many agents run in parallel, not how hard each thinks. Add the word **ultracode** to the prompt to opt in for a session.
- `CLAUDE_CODE_EFFORT_LEVEL` must stay unset; the orchestrator checks it at session start.

## Phase → session map

Sessions are long by design. Each session runs until its phase gate or until the orchestrator judges the handoff is cleaner now than later. Expected counts are estimates; `NEXT_SESSION.md` is the truth.

| Session | Phase | What lands | Gate / tag |
|---|---|---|---|
| 0 (done) | Setup | Repo, tree, tooling, CLAUDE.md, agents, docs, brief copied | `p0-setup` |
| 1 (part A done) | Phase 0 — Teardown | `docs/teardown/` (7 docs; five delivered, `KEEP_CHANGE_DROP` and `PORT_MAP` wait on the brainstorm doc), orchestrator spot-check of twelve systems | `p0-teardown` |
| 1.5 (done 2026-09-07) | Phase 0.5 — Design Overhaul | `docs/design/` Design Bible (11 files, reviewed and consistency-passed), brief §2/§4–6/§8 revised, `CLAUDE.md` pointer, Phase 1 handoff builds the redesigned Liam and camp | `p0.5-design-bible` |
| 1.75 (several chats) | Phase 0.75 — Design Dialog | Andrew and the orchestrator talk through the bible by cluster (`docs/design/PHASE_0.75_BRIEF.md`); every agreed change logged in `docs/design/PHASE_0.75_TWEAKS.md`; mockups and reference screenshots filed; then one application session applies the list with `design-lead` and re-issues the Phase 1 handoff | `p0.75-design-locked` |
| 1.85 (opened 2026-09-07, several chats) | Phase 0.85 — Story and play pass | `docs/story/WALKTHROUGH.md` (the whole game as a quick read for the family), the kids' suggestions as rows in `docs/story/SUGGESTIONS.md`, the storyboard skeleton, `docs/LANES.md` routing; runs beside 1.75 in its own worktree; one application session applies the agreed rows to the bible | `p0.85-story-locked` |
| 2–3 | Phase 1 — Pilot & visual loop | `pilot/` Forest scene built from the Design Bible (`heroes.md` §2.7 Liam; `camp.md` §2.2 and §2.11 camp and stations; `world-events-weather.md` §2.1.3 and §2.2.6 keyframes and weather), capture stations, up to 12 iterations, tokens promoted to `src/style/` | `p1-style-locked` |
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

The v27 HTML is already in `docs/legacy/`. If any of the four are missing when a session needs them, the orchestrator stops and asks (Working Rule 1). The brainstorm doc also gates Phase 0 part B and the Design Bible's §7 reconciliation in every `docs/design/` file (a `design-lead` pass, not a rewrite).

## When a session ends

You get one summary message: what was done, what was verified, screenshots if any, what's next, and whether anything needs you. If nothing needs you, open the next session with the prompt above.
