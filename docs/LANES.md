# Lanes: which branch and worktree a session works in (read this before the handoff)

Written 2026-09-07, rows and phrases added 2026-09-08. This file routes a new session. Andrew opens Claude Code in the primary checkout (`C:/Documents TEMP/ClaudeCode/StewartSquad Adventure/`) and types one line; the session reads this file, picks the lane, moves to that lane's worktree, and only then reads that worktree's `docs/NEXT_SESSION.md`. Every lane's docs carry a copy of this file; the newest copy wins (check the date line in each lane's `NEXT_SESSION.md` routing block).

## 1. The lanes

| Lane | What happens there | Branch | Worktree (checkout) | Handoff | Status |
|---|---|---|---|---|---|
| **0.75 visual studies** (default) | The demo scenes, one per biome, in `sandbox/`: visual design with Andrew and the kids, motion and camera feel, and any quick **gameplay-mechanic demo** the family wants to try before the full build. Tweak rows in `docs/design/PHASE_0.75_TWEAKS.md`; frames in `docs/design/mockups/`. | `phase-0.75-visual-studies` | the primary checkout, `StewartSquad Adventure/` | `docs/NEXT_SESSION.md` there | open; the whole reel built (five scenes, `sandbox/index.html`), awaiting Andrew's pass |
| 0.75 biomes | The other biomes' demo scenes, built in their own worktree while the Forest demo was live. | `phase-0.75-biomes` | (removed) | — | **merged into 0.75 visual studies 2026-09-07 (tag `p0.75-demo-reel-1`); closed**. New demo scenes follow the same recipe: a short-lived branch and worktree off the demo lane's tip, merged back when it reads |
| 0.75 demo | A checkout of a tag that nothing edits, so a demo for the kids survives a working session. `npx vite --port 5180` from inside it. | detached at a demo tag (`p0.75-demo-forest-1`) | `StewartSquad-demo/` | `docs/design/mockups/README.md` | open |
| 0.75 scratch | Throwaway experiments, re-cut from the demo lane's tip when wanted; fast-forwarded in only if all of it is a keeper, otherwise deleted and re-cut. `npx vite --port 5181` from inside it. | `phase-0.75-scratch` | `StewartSquad-scratch/` | the demo lane's | open, idle |
| Opus 5 experiment | Five demo scenes built by an Opus 5 session from `docs/design/mockups/OPUS_EXPERIMENT_BRIEF.md`, judged 2026-09-08 (`OPUS_EXPERIMENT_VERDICT.md`, now also on the demo lane). Four scenes cherry-picked and fixed on the demo lane 2026-09-08 (`OPUS_FIX_PLAN.md`); the Rootways stays on the branch as the record. | `phase-0.75-opus-experiment` | (removed from git; the folder `StewartSquad-opus/` is still on disk because a stray vite on :5182 holds it — close that process and delete the folder) | — | **closed 2026-09-08**; the branch is kept, not merged |
| Fable control | The same brief's Rootways and Crash Meadow built cold by a Fable session, then reviewed blind, for the apples-to-apples comparison (`docs/design/mockups/FABLE_CONTROL_BRIEF.md`). Cut from `8266a7b`, the tip the experiment started from. | `phase-0.75-fable-control` | `StewartSquad-control/` (:5183) | `docs/NEXT_SESSION.md` there | planned; opened by the "control build" session |
| **0.85 story and play** | The read-through walkthrough of the whole game (`docs/story/WALKTHROUGH.md`), the kids' suggestions list, the storyboard. Story, flow, gameplay mechanics, progression. Docs only, no code. | `phase-0.85-story` | `StewartSquad-story/` | `docs/NEXT_SESSION.md` there | open |
| main | The integration branch. Holds the Design Bible gate `p0.5-design-bible`. Receives 0.75 and 0.85 at their application steps, then the build phases start from it. | `main` | never checked out in a lane worktree | `docs/NEXT_SESSION.md` | untouched by the lanes |

All worktree paths are siblings of the primary checkout under `C:/Documents TEMP/ClaudeCode/`. `git worktree list` from any checkout shows what exists and which commit each is on.

## 2. Routing: what Andrew's first line means

| Andrew says (any of) | Lane | First action |
|---|---|---|
| "Continue from docs/NEXT_SESSION.md." with nothing else | the **default** lane above (0.75 visual studies) | read the primary checkout's handoff; say in the first message which lane was taken |
| "visuals", "demo scene", "study", "0.75", "sandbox", "biome demo", "screenshot", "the deer", "camera", "mechanic demo", "try X in the sandbox", "the reel" | 0.75 visual studies | `git status` in the primary checkout, confirm branch `phase-0.75-visual-studies`, read its handoff |
| "demo for the kids", "show the kids", "open the demo" | 0.75 demo | run the demo worktree on port 5180 (`docs/design/mockups/README.md`); do not edit anything there |
| "scratch", "try something throwaway", "quick experiment" | 0.75 scratch | move to `StewartSquad-scratch/`; re-cut the branch from the demo lane's tip first if it is stale |
| "build the demo", "here.now", "a link for Dad", "static build" | 0.75 visual studies | `npm run build:demo` in the primary checkout, verify `dist-demo/` locally, zip it (`docs/design/mockups/README.md` "Sharing the reel") |
| "experience balance", "pre-build brainstorm", "the pre-build list" | 0.85 story and play (P-01) or the lane the item names | `docs/design/PRE_BUILD_TODO.md`; P-01 runs on the story lane after the kids' reading sessions |
| "story", "walkthrough", "0.85", "the acts", "gameplay mechanics pass", "the kids' suggestions", "storyboard", "Liam's ideas" | 0.85 story and play | move to `StewartSquad-story/`, confirm branch `phase-0.85-story`, read its handoff |
| "the Opus fixes", "Opus fixes", "bring the keepers in" | 0.75 visual studies | `docs/design/mockups/OPUS_FIX_PLAN.md`; its §0 cherry-picks the lint fixes first (check is red on the demo lane until then) |
| "control build" | Fable control | cut the lane per `FABLE_CONTROL_BRIEF.md` §2, read only what §1 allows, build §3 |
| "control review" | Fable control | `FABLE_CONTROL_BRIEF.md` §5: the experiment's method, blind scoring, `CONTROL_VERDICT.md` |
| "demo candidates", "the candidates assessment" | 0.75 visual studies | `docs/design/mockups/DEMO_PROGRAM.md` §2: write `DEMO_CANDIDATES.md` |
| "build the next demo set", "is there a new demo you had in mind", "next demos" | 0.75 visual studies | `DEMO_CANDIDATES.md`; short-lived branches off the demo tip per §1 |
| "apply the tweaks", "application session", "lock the design" | 0.75 application step | on `phase-0.75-visual-studies`; `PHASE_0.75_BRIEF.md` §4; ends with a merge to `main` and `p0.75-design-locked` |
| "apply the suggestions", "update the bible from the story", "surgical update" | 0.85 application step | on `phase-0.85-story`; `docs/story/PHASE_0.85_BRIEF.md` §4; ends with a merge to `main` and `p0.85-story-locked` |
| "ready to launch", "start Phase 1", "start the build", "the pilot" | Phase 1 build | see §5 |
| something that fits no lane | ask | one question naming the two closest lanes, then proceed |

If two lanes fit, the more specific wins (a Desert scene question goes to 0.75 biomes, not 0.75 studies). Never guess silently: the session's first message says which lane it took and why in one line.

## 3. Working inside a lane

1. **Move there first.** Every shell command uses that worktree's absolute path (the shell's working directory resets between calls in this environment). `git status` and `git branch --show-current` before the first edit.
2. **Read that worktree's `docs/NEXT_SESSION.md`**, then `CLAUDE.md`, then the lane's own brief (`docs/design/PHASE_0.75_BRIEF.md` or `docs/story/PHASE_0.85_BRIEF.md`).
3. **Stay in the lane.** Never edit files under another lane's worktree; another session may be working there. If a change is needed on another branch, commit it here and note it in the handoff for that lane to cherry-pick.
4. **Cross-lane docs travel by cherry-pick, not merge.** This file, `CLAUDE.md` and `docs/SESSION_PLAN.md` are the shared routing docs. A change to them is its own small commit, cherry-picked onto every open lane branch from that lane's worktree. `main` receives them at the next application step.
5. **Lanes never edit the Design Bible.** Both 0.75 and 0.85 log rows (`PHASE_0.75_TWEAKS.md`, `docs/story/SUGGESTIONS.md`); only an application step edits `docs/design/`, through the `design-lead` agent, with a `DECISIONS.md` line per change.
6. **End of session:** rewrite that worktree's `docs/NEXT_SESSION.md` (Working Rules at the top, then the routing block from §6 below, then the lane's state), commit, and if a demo state was shown to the family, tag it.

## 4. Opening or closing a lane

**Open a new lane** when work would otherwise disturb a live lane or needs to survive across many sessions on its own (the way 0.85 did). Recipe:

```bash
cd "C:/Documents TEMP/ClaudeCode/StewartSquad Adventure" && git worktree add -b phase-<n>-<slug> "C:/Documents TEMP/ClaudeCode/StewartSquad-<slug>" <base>
```

- Base: a docs-only lane starts from the newest docs tip (today `phase-0.75-visual-studies`, which carries the tweak rows `main` lacks); a code lane starts from `main` or from the lane it extends.
- Create the lane's one-page map (`README.md` in its folder), its brief (rules, sessions, effort, prompts), and its handoff section; add a row to §1 and phrases to §2 of this file; one line in `docs/DECISIONS.md`; a row in `CLAUDE.md` "Where things live".
- Cherry-pick the routing commit onto the other open lanes.

**Close a lane** at its application step: `npm run check` green, merge to `main`, tag the gate, `git worktree remove <path>`, mark the row here as merged. Exception: **0.75 visual studies stays open after its merge** as the sandbox lane for the build phases. Anything the family wants to try or change during Phases 1 to 6 is prototyped there in a demo scene first, and only the approved result is implemented in the game by the implementer agents. That keeps prototypes cheap and the game code clean.

## 5. Ready to launch: when the build phases start

The build starts when both design lanes are locked: `p0.75-design-locked` and `p0.85-story-locked` on `main`, with the Design Bible carrying every agreed row. Then:

1. In the primary checkout, `git checkout main && git pull`, then `git checkout -b phase-1-pilot`.
2. Read `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md` (the preserved Phase 1 plan) and `docs/SESSION_PLAN.md`; the visual numbers come from `docs/design/mockups/style-draft.json` `approved` entries.
3. `docs/story/WALKTHROUGH.md` becomes the implementers' plain-language reference for order and flow; the Design Bible stays the spec.
4. The 0.75 lane remains the sandbox (§4). The 0.85 lane is removed after merge; its docs live on under `docs/story/` on `main`.

If Andrew says "ready to launch" before both locks exist, list what is still open in each lane and ask which to finish first; do not start Phase 1 on an unlocked bible.

## 6. The routing block every handoff carries

Paste this at the top of `docs/NEXT_SESSION.md`, under the Working Rules, in every lane:

```
## Routing (2026-09-07): read docs/LANES.md first
This checkout is lane <name> on branch <branch>. If Andrew's first line names another lane, move to that lane's worktree before reading further. Open lanes: 0.75 visual studies (primary checkout), 0.75 demo (StewartSquad-demo, a tag), 0.75 scratch (StewartSquad-scratch), 0.85 story and play (StewartSquad-story). Default when unnamed: 0.75 visual studies.
```
