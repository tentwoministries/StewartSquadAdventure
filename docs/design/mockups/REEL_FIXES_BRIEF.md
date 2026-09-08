# The reel fixes: Andrew's reactions become fixes, on the demo lane, run by Opus (written 2026-09-08)

Andrew looks at the reel and says what is wrong or what he wants; each reaction becomes a tweak row and a checkable fix; Opus agents build them; Andrew judges the result by looking. This is the standing session type for the backlog that every reel produces. It runs on the demo lane (`phase-0.75-visual-studies`), never on scratch (scratch is deleted; reactions are the design record).

## 1. Who runs it

- **The orchestrator is Opus 5 at high** (`claude --model opus`, or the app's model picker). It reads `docs/NEXT_SESSION.md`, this brief, `LESSONS.md` §0 and `DEMO_PROGRAM.md` §6, and runs the delegated loop the Opus-fixes session proved: brief files, librarian sheets, builders with checks, one auditor pass, commits per scene. It writes no scene code itself unless a builder has failed twice on the same item.
- **Andrew is the judge.** No art-director pass, no rubric: he opens the reel after each round and says yes or no per item. A "no" goes back to a fresh builder with what he saw.
- **Fable is called only** when an item has failed twice on Opus, or when a round touched `sandbox/_shared/` or a kid rig and Andrew wants a judgment on whether the whole reel still reads. That is one short Fable session every few rounds, opened with "reel review".

## 2. The round

1. **Intake.** Andrew's reactions arrive as a list in chat, one line each, with the scene and station ("Meadow L1: the goblins should hesitate before charging"; "Home Wrong: the swing is too fast"). The orchestrator writes each as a row in `docs/design/PHASE_0.75_TWEAKS.md` (next number, status `observed`, `story-dependent` where a coordinate or an Act is encoded), then groups them by scene.
2. **Briefs.** One `docs/qa/briefs/reel-fixes-<scene>-<round>.md` per scene, one page: the rows it covers, the files it may touch (its own folder; a `_shared/` file only when named, with the one-frame-per-scene check), and an acceptance check per row that a stepped probe or a saved frame can answer (a pixel distance, a state reached, a luminance fraction, a frame read against its predecessor). A reaction that cannot be made checkable is turned into a question back to Andrew, not a brief.
3. **Sheets.** One `rules-librarian` per brief, all in one message.
4. **Build.** One `sandbox-builder` per scene, all in one message, each prompt self-contained: the brief path, the sheet path, the harness (`scripts/sandbox-drive.cjs` with `?step=1`, the dev server the orchestrator started, the plugin's `-NN` naming), the parallel-agents rule for shared docs (append last, one edit per file, re-read first), the definition of done from the agent file. Frames carry the round's suffix (`-03`, `-04`, …).
5. **Audit.** One `rules-auditor` over the round; the orchestrator fixes the mechanical items itself and sends real misses to fresh builders (twice, then Fable).
6. **Close.** `npm run check` green, one commit per scene, a `LOG.md` row per fix, a `LESSONS.md` row for every fix a kid could have noticed (same commit), `docs/PROGRESS.md` entry, a tag `p0.75-demo-reel-<n>` when Andrew says the round reads, the demo worktree moved to it, `docs/NEXT_SESSION.md` rewritten.

## 3. What a round must not do

- Edit the Design Bible (`docs/design/*.md`): rows only; the application step applies them.
- Rebuild a scene from taste. A reaction that amounts to "build it differently" is a new demo, and goes to the demo-candidates session.
- Paste the ledger into a prompt; the librarian fetches it.
- Wait for a visible screen; step the runtime.
- Commit with the check red, or `git add` a folder wholesale.

## 4. Where things are

`docs/NEXT_SESSION.md` (the state) · `docs/qa/briefs/opus-fixes-*.md` and `docs/qa/rules/opus-fixes-*.md` (the pattern to copy) · `scripts/sandbox-drive.cjs`, `scripts/probes/` (the harness and the probes each scene already has) · `docs/visual-loop/opus-fixes-2026-09-08.md` (the last scores, with each scene's "changes planned, in order": a free backlog to draw from when Andrew's list is short) · `docs/design/mockups/LESSONS.md` §0 (the always-tier) · `docs/design/mockups/DEMO_PROGRAM.md` §6 (the loop).

## 5. Round 1 as run (2026-09-08, Fable orchestrating by Andrew's call; the experiment he asked for)

Andrew gave the reactions to reel 2 as a list spanning six scenes and four cross-scene defects, and asked that this round be run by Fable with Opus agents, as a measured test of whether delegation adds work over Fable fixing directly. What happened, with numbers:

| Step | Who | Wall clock | Tokens | Notes |
|---|---|---|---|---|
| Diagnosis and intake | Fable | ~45 min | ~110 k of source read | Read `_shared/` (walk, rig, the two kid files, scene, step, shot, orbit, creature) and the relevant parts of six scene folders; found the cause of every cross-scene item before briefing (the ring's un-curved shader, the non-indexed icosahedron torn by per-index displacement, `park`'s third argument being a bearing, the drift's top inside the lake basin, the Euler-order tilts). Rows T-41..T-56 |
| Seven briefs | Fable | ~25 min | — | One page each with a diagnosis, the files each may touch, and checks a probe can answer |
| Seven rule sheets | `rules-librarian` ×7, parallel | 70–130 s each | 55–122 k each, ~600 k | Every sheet added canon the brief lacked (Fern's 1.55 m and 1.9 m staff; per-kid run speeds; the sprint window must run on the stepped `dt`) and named a Working Rule 1 gap where the bible has no row |
| Seven builds | `sandbox-builder` ×7, parallel | 14 / 21 / 29 / 38 / 46 / 60 / 71 min | 150 k – 391 k each, ~1.92 M | Flight, rocks, stations, Bog, Hearth, shared rigs, caves. Every check quoted with numbers; 26 files, +1,373/−181 lines, 25 probes, 14 new tests (25 → 39), ~90 frames |
| Audit | `rules-auditor` | 10 min | 231 k | 10 items: 2 sure (the ring lift fell between two briefs; row statuses), 2 likely (a seal yaw snap; no frame of the merged tree), 6 worth a look |
| Fix pass | `sandbox-builder` | see `LOG.md` | — | The audit's real misses plus a nine-frame sweep of the merged tree |
| Review, mechanical fixes, records | Fable | ~40 min | ~60 k of reports read | Three orchestrator edits (the Forest's ring shader, the ring lift, the statuses), the LOG/DECISIONS/PROGRESS/handoff |

**What delegation cost Fable.** The reports are long (seven builders plus the audit ≈ 60 k tokens to read), the seams between briefs produced two misses the audit had to catch (a one-line lift that both briefs assigned to the other; nobody rendered the merged tree), and two agents on one file (`caves-descent/terrain.ts`) needed explicit region ownership. Fable still had to do the diagnosis itself — a brief without a cause is a brief the builder spends an hour re-deriving — and that was the largest single Fable spend.

**What delegation bought.** Roughly 3 M Opus tokens did the work that would have been 1.5–2 M *Fable* tokens and five to seven hours serial; the round's build phase ran in 71 minutes because seven scenes were built at once. The builders found things the diagnosis missed (Fern faced the Witch's hut, not the causeway; the unseen pool hopper was a hare with an unbounded random walk; the rigs' `R` limb is the kid's left, T-57), and every claim came with a number a probe produced. The audit found the seams.

**The call for future rounds.** Keep this shape when a round spans three or more scenes or touches `_shared/`: Fable diagnoses and writes the briefs (the part that needs judgment), Opus builds and audits. For a round of one to three scene-local reactions, the Opus-run default in §1 is right and Fable is not needed. Fable editing code directly is worth it only when the brief would be longer than the diff (the Forest's two-line ring shader was one). Two additions to §2 from this round: **(5b)** after the fix pass, one builder shoots one frame per scene *from the merged tree* — every builder's sweep ran against a tree that changed under it; and **(2b)** when two briefs touch the same object (a ring's height, a shared file's region), name one owner in both briefs.
