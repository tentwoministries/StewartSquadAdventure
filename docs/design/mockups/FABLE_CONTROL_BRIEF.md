# The Fable control build: two of the experiment's scenes, built cold, judged the same way (brief written 2026-09-08)

**Why.** The Opus 5 experiment (`OPUS_EXPERIMENT_BRIEF.md`) was judged by a Fable 5.1 session, which leaves one question the family cares about unanswered: what would Fable have built from the same brief, cold? Andrew asked for an apples-to-apples comparison. Two scenes are enough to answer it at about 40 % of a full rebuild's cost: the **Crash Meadow beat** (spelled out; a new enemy and a mechanic built to a written plan) and the **Rootways** (open; three new creatures and the hardest vocabulary in the sandbox). Those are where the uncertainty lives; the Forest and Frozen baselines already answer the rest.

**The bias, stated up front.** Fable judges Fable here. The mechanical checks (§5) cannot be gamed; the art-director scores frames under neutral names so it does not know which build it is looking at; the one thing that cannot be removed is that the reviewer and the builder are the same model, and the control verdict says so.

## 1. What the build session may and may not read

**Read:** `docs/LANES.md`, `docs/NEXT_SESSION.md` (the primary checkout's), `CLAUDE.md`; `OPUS_EXPERIMENT_BRIEF.md` **§0, §1 (the rules and the "keep every scene mergeable" paragraph), §2, §3.1, §3.4 and §4 only**; and everything §2 of that brief lists (the sandbox map, `STUDY_NOTES.md`, `LESSONS.md`, `LOG.md`, the shared code, `frozen-night/` as the model, the design files the two scenes cite, `MOTION_TEMPO_NOTES.md`).

**Do not read, so the build is cold:** anything else named `OPUS_*` in `docs/design/mockups/` (the notes, the verdict, the fix plan), `DEMO_PROGRAM.md`, `docs/visual-loop/opus-*` and `motion-*`, the worktree `StewartSquad-opus/`, the branch `phase-0.75-opus-experiment`, and `docs/DECISIONS.md` or `docs/PROGRESS.md` entries dated 2026-09-08. If a file you open turns out to describe the experiment's results, close it and say so in the notes. The tweak rows T-20 and above are also off limits; T-01 … T-19 are fine.

## 2. The lane (cut from the commit the experiment started from, so both builds saw the same tree)

```bash
cd "C:/Documents TEMP/ClaudeCode/StewartSquad Adventure" && git worktree add -b phase-0.75-fable-control "C:/Documents TEMP/ClaudeCode/StewartSquad-control" 8266a7b
cd "C:/Documents TEMP/ClaudeCode/StewartSquad-control" && git cherry-pick a05ab6b 08b5cd7 && npm ci
npx vite --port 5183 --strictPort
```

`8266a7b` is the demo lane's tip when the experiment began. The two cherry-picks are lint fixes (a `.cjs` parse error and the `dist-demo/` ignore) that make `npm run check` green; they are not part of the experiment and Opus fixed the first one itself. Work only inside `StewartSquad-control/`; every shell command uses its absolute path.

## 3. The assignment

Build **§3.1 (the Rootways and the Hollow Grove's arch)** and **§3.4 (the Crash Meadow fight beat)** exactly as `OPUS_EXPERIMENT_BRIEF.md` states them, under the same rules (§0 of that brief: the Working Rules, no design file edited, rows not edits, every iteration a `LOG.md` row, family canon). The only changes:

- Folders and ids are `sandbox/ctl-rootways/` (id `ctl-rootways`) and `sandbox/ctl-meadow/` (id `ctl-meadow`), so frames and folders never collide with the experiment's if both are ever on one branch.
- Effort **high** (the experiment's brief said high; its session ran at xhigh, so this is the fairer setting and the cheaper one).
- The `LOG.md` heading is "The Fable control build"; the notes file is `FABLE_CONTROL_NOTES.md` (one paragraph per scene: what was hard, what was guessed, what you would do differently); the handoff is the control worktree's `docs/NEXT_SESSION.md` with the routing block.
- Budget: about three hours and $50; stop at five hours whatever the state and write the notes. Frames as the brief lists them for each scene.

You may use any process you like: tests, a stepping harness, probes. Nothing in the brief forbids them and nothing requires them; what you choose to verify is part of what is being compared.

## 4. What the build session leaves behind

The two scene commits (one each, plus their rows and log sections), `FABLE_CONTROL_NOTES.md`, the frames under `docs/design/mockups/` with the `ctl-` prefix, the handoff. Nothing tagged, merged or pushed.

## 5. The control review (a separate session, opened with "Control review", on the control lane)

The reviewer may read everything, including the experiment's verdict, because it must apply the same method. The method is `OPUS_EXPERIMENT_VERDICT.md` §1 on the experiment branch, verbatim:

1. **Blind scoring.** Copy four hero frames to neutral names in the scratchpad: the experiment's `rootways-golden-s3-01` and `meadow-golden-s1-a-01` (from the opus branch) and the control's equivalents. Shuffle, name them `blind-a` … `blind-d`, and spawn `art-director` (fable, xhigh) on them with the same instructions the experiment's scoring used (the scores file's header records them), plus the same two baselines. Only after the report is written are the names resolved.
2. **The same probes.** The goblin probe (send the goblins, step sixteen seconds, log the states and the nearest distance each second); the Grove wall filmstrip after `g`; the songbird burst from a station outside the crown; the meadow's whirl and pound filmstrips. If the control build has its own harness or tests, run those too and count them.
3. **The same reading.** Every file of both scenes read in full; the same defect classes looked for (never-run mechanics, dead writes, placements off the plate, faked searches, lint suppressions, plan lines dropped silently).
4. **Cost from the transcripts**, the way the verdict's §7 did it (dedupe usage by message id; state the pricing assumptions).

Write `docs/design/mockups/CONTROL_VERDICT.md` on the control branch: the blind scores resolved, the probe results side by side, the defect list side by side, the cost side by side, and one paragraph on what the comparison changes about `DEMO_PROGRAM.md` §5. Then the same closing as the experiment: nothing merged; the demo lane's next session decides what to cherry-pick.
