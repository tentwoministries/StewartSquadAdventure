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
