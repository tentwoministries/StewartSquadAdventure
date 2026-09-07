# Phase 0.75 — Design Dialog (between the Design Bible and the pilot)

*Added 2026-09-07 at Andrew's direction.* Documents only; no game code. Phase 0.5 produced the Design Bible in one autonomous pass. Phase 0.75 is the **interactive** pass over it: Andrew and the orchestrator talk through the bible system by system, decide what felt thin or wrong, collect every agreed change in one running list, and only then apply the list to the design files systematically, so nothing from Phase 0.5 is lost and nothing is changed twice. Locking the design at a higher level before Phase 1 is cheaper than iterating in code.

## 1. The rules of the phase

1. **Nothing edits a design file during the dialog.** Every agreed change is appended to `docs/design/PHASE_0.75_TWEAKS.md` with its owning file and section, a status, and the reason. The design files change only in the application step (§4), by the `design-lead` agent, with a `docs/DECISIONS.md` line per significant change, exactly like the Phase 0.5 consistency pass.
2. **Commit the tweaks file every few decisions**, not at the end of a session. A session can hit a usage limit mid-thought; the list on disk is the record.
3. **Canon rules stand** (`CLAUDE.md`): names, core personalities and canon text never change; colors and roles may change only in `heroes.md` with a logged rationale.
4. **The orchestrator answers from the files, not from memory.** When Andrew asks what something currently does, the answer cites the file and section. When the two disagree, the file wins until a tweak is logged.
5. **Ideas are cheap; each one gets a home.** An idea that is not adopted is still recorded in the tweaks file with `status: parked` and one line of why, so it is never re-argued.
6. Working Rules 1–7 and the model policy apply unchanged.

## 2. What a dialog session looks like

- **Open** with the prompt in §6. The orchestrator reads `docs/NEXT_SESSION.md`, this brief, the tweaks file, and the design file(s) for the session's topic.
- **Andrew leads** with what he read and what felt thin, beautiful, missing, or wrong. He may paste screenshots of v27, of other games, or of references; the orchestrator files them under `docs/reference/` with a one-line note in the tweaks file.
- **The orchestrator answers** with the current state (file and section), an honest read on whether it under-delivers, and options with tradeoffs. Options are numbered so a decision is one word.
- **Each decision** becomes a row in the tweaks file: `T-nn · <system> · <file> §x · <change> · why · status: agreed | parked | needs-mockup`.
- **Close** by committing the tweaks file and appending a short "next topic" line to `docs/NEXT_SESSION.md`.

Topic clusters, in the order that keeps dependencies clean (each can be one session or several; one session can cover several if the list stays short):

| Cluster | Files | Why this order |
|---|---|---|
| A. World and exploration | `story-beats.md`, `world-events-weather.md`, `dungeons.md` §2.7, `bosses.md` §2.11–2.12 | The Crystal Caves and the Volcanic Rift question lives here; island footprints and travel rules constrain everything after |
| B. Visual identity and mood | `heroes.md` §2.1, `camp.md`, `world-events-weather.md` §2.1, `ui-ux.md` §2.1 | Palette, silhouettes, keyframes, the camp; the mockup sessions (§3) belong here |
| C. Heroes and combat feel | `heroes.md`, `enemies.md`, `bosses.md` | Kits, telegraphs, hit-stop, the combo beat |
| D. Story, cutscenes, NPCs | `story-beats.md`, `cutscenes.md`, `npcs.md` | Beats, shot tables, Ed, the ending |
| E. Menus, sound, everything else | `ui-ux.md`, `audio.md` | Usually the shortest cluster |

## 3. Mockups and screenshots (what is possible before any code exists)

Real rendered screenshots need the pilot, which is Phase 1. Before that, three things are possible and useful:

1. **Andrew's own screenshots.** Frames from v27, from games with the feel he wants, or from the Fernwood reference. They go in `docs/reference/` with a note, and the tweak they support cites them. This is the highest-value input in the phase: it says "this" instead of describing it.
2. **Concept boards the orchestrator draws.** Palette swatches, silhouette line-ups of the four kids, a camp plan view, a cave cross-section with its tiers, a HUD layout over a placeholder frame, a keyframe strip of the day cycle. These are illustrations (HTML, SVG, or a design canvas), not renders, and they are for deciding composition, colour and scale, not for judging lighting. They are saved under `docs/design/mockups/` and cited by the tweak they settle.
3. **A throwaway mood scene** is possible but not recommended in 0.75: a few hundred lines of Three.js can show sky, fog and a camp at the target palette, but it would be built again properly in Phase 1 and would tempt the phase into engineering. If a visual question cannot be settled on paper, log it as `status: needs-render` and let the Phase 1 visual loop answer it at station S1–S4 with the art director scoring.

## 4. The application step (the last session of the phase)

1. Read the tweaks file; group rows by owning file; resolve any two rows that touch the same section.
2. One `design-lead` agent per file (Fable, xhigh), in dependency waves as in Phase 0.5 (`heroes.md` and `story-beats.md` first), each applying only its rows with targeted edits, adding a §6 line per significant change, and setting the file's Status line to `Phase 0.75 tweaks applied <date>`.
3. The orchestrator reviews each diff against the tweaks file, merges the §6 lines into `docs/DECISIONS.md`, and runs a consistency pass over the files the tweaks touched (Opus with Edit is fine here, as in Phase 0.5: the decisions are already made).
4. Every applied row gets `status: applied <date>`; parked rows stay parked.
5. `docs/design/README.md` statuses, `docs/PROGRESS.md`, `docs/COMPLETE_STATE.md`, the Phase 1 handoff (restore from `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md` and update it for the tweaks), one summary, and the gate tag.

**Definition of Done:** every topic cluster has been discussed or explicitly skipped by Andrew; every agreed row is applied and logged; parked rows are recorded with a reason; mockups are in the repo and cited; the Phase 1 handoff builds the tweaked designs. Gate tag: `p0.75-design-locked`.

## 5. Effort levels for Fable 5.1 in this phase (Andrew's question, 2026-09-07)

Effort is set per session in the app's model picker; `CLAUDE_CODE_EFFORT_LEVEL` stays unset so agent frontmatter keeps working. Suggested levels:

| Session type | Orchestrator effort | Why |
|---|---|---|
| Dialog sessions (clusters A, C, D, E): reading the files, answering "what does it do now", weighing options | **high** | The value is judgment across an 8,845-line bible; medium tends to answer from the summary card instead of the section |
| Mockup and visual sessions (cluster B): many short turns, drawing boards, reacting to pasted screenshots | **medium** for the iteration loop, **high** for the moment of decision (which palette, which composition) | Iteration wants speed and cheap turns; the decision wants the same judgment as a dialog session |
| The application session (§4) | **high** orchestrator; `design-lead` agents at **xhigh** (their frontmatter); consistency pass on Opus | Same shape as the Phase 0.5 review and gate |
| A gate review of the whole tweaked bible | **xhigh**, or `qa-inspector-max` / `art-director-max` if a scored pass is wanted | Gates are the one place `max`-class effort is allowed by the policy |

One chat or several: several, one per cluster, is the safer shape. A dialog session that runs long gets compacted and starts answering from its summary; a fresh session re-reads the files. The tweaks file is what makes several sessions equivalent to one.

## 6. Prompts to paste

First 0.75 session (cluster A, the Crystal Caves first):

```
Continue from docs/NEXT_SESSION.md. Open Phase 0.75 (docs/design/PHASE_0.75_BRIEF.md), cluster A, starting with the Crystal Caves and the Volcanic Rift. Answer from the files. Log every decision in docs/design/PHASE_0.75_TWEAKS.md and commit after every few rows. Do not edit any design file.
```

A visual or mockup session (cluster B):

```
Continue from docs/NEXT_SESSION.md. Open Phase 0.75 cluster B (visual identity and mood). I will paste screenshots; file them under docs/reference/ and draw concept boards under docs/design/mockups/ for what I ask. Log decisions in docs/design/PHASE_0.75_TWEAKS.md. Do not edit any design file and write no game code.
```

The application session (last):

```
Continue from docs/NEXT_SESSION.md. Run the Phase 0.75 application step (docs/design/PHASE_0.75_BRIEF.md §4): apply every agreed row of docs/design/PHASE_0.75_TWEAKS.md to the design files with design-lead agents, log decisions, run the consistency pass, restore and update the Phase 1 handoff, tag p0.75-design-locked.
```
