# The Opus fixes: one session on the demo lane (brief written 2026-09-08 by the reviewing orchestrator)

The Opus 5 experiment is judged (`docs/design/mockups/OPUS_EXPERIMENT_VERDICT.md` on branch `phase-0.75-opus-experiment`, worktree `StewartSquad-opus/`; read §0, §3 and §8 of it first, and `docs/visual-loop/opus-experiment-scores-2026-09-08.md` for the art-director's per-frame change lists). This session brings the keepers into the reel, fixes what the review found, turns the review's method into code and tests, tags the ledger, re-shoots the hero frames, and retires the experiment lane. Fable 5.1 at **high**; the orchestrator writes the sandbox directly (the logged Phase 0.75 exception). Shared files under `sandbox/_shared/` may be edited in this session, with the standing rule: a change there is checked with one frame per scene.

Expected size: one session, about the cost of the review (≈ $20–30). Commit per numbered step below; `npm run check` green before each.

## 0. Preconditions

1. In the primary checkout on `phase-0.75-visual-studies`: `git cherry-pick a05ab6b 08b5cd7` (the `.cjs` lint parse fix and the `dist-demo/**` ignore). `npm run check` is red on this branch until both are in; every commit before this one was docs-only.
2. The Opus session's vite may still be running on :5182 (a stray `node.exe`); it serves the opus worktree and is harmless. This session serves :5173 as usual.
3. `CLAUDE_CODE_EFFORT_LEVEL` unset.

## 1. Cherry-pick the keepers (one commit each, `-x`)

In order: `0fc90f2` (Home Wrong), `bba2a68` (the Crash Meadow beat), `fff7fee` (the west rim), `434df37` (the flight: its code and its rows are kept; its frames are not shown until §4). **Not** `26e9271` (the Rootways: needs a canopy vocabulary, a build not a fix; it stays on the experiment branch as the record) and **not** `798b08a` (the hub commit lists all five; the cards are re-added by hand in §7).

Each scene commit also appended rows to `docs/design/PHASE_0.75_TWEAKS.md` and a section to `LOG.md`; expect adjacent-line conflicts on the second and later picks and keep both sides. Then bring across by copy, not cherry-pick: the Rootways' rows T-20 … T-23 and its `LOG.md` section (`git show 26e9271:docs/design/PHASE_0.75_TWEAKS.md`), and the review's record (`git checkout phase-0.75-opus-experiment -- docs/design/mockups/OPUS_EXPERIMENT_NOTES.md docs/design/mockups/OPUS_EXPERIMENT_VERDICT.md docs/visual-loop/opus-experiment-scores-2026-09-08.md docs/visual-loop/motion-meadow-2026-09-08.png docs/visual-loop/motion-rootways-2026-09-08.png docs/visual-loop/motion-shadow-2026-09-08.png docs/visual-loop/t20-forest-golden-2026-09-08.png`). Leave the `t20-*` and Rootways frames on the experiment branch.

## 2. The shared runtime (one commit; check every scene with one frame after)

- **`_shared/step.ts`, the stepping harness as code.** What the review did from the console: expose `window.ssStep(n)` (renders exactly `n` frames of 1/60 s through the normal `renderOnce`, no upload), `ssSnap(name)` (POSTs the canvas to the shot plugin under a lowercase name), `ssKey(k)` (dispatches a `keydown`). A `?step=1` query param disables the hidden-tab fallback tick so stepping is deterministic. `scene.ts` gains a `renderOnce` export path for it; nothing else there changes. Verify: on a hidden pane, `ssStep(60)` advances `ssWorld.hud()`'s clocks by exactly one second.
- **A look hook for non-active kids.** `scene.ts` sets every non-active kid's `lookAt` to the active kid before the rig update, so a scene's own writes (the Rootways' Noah on the towers, the flight's Noah on the ground and Liam on the others) are dead. Add `SceneWorld.look?: (kid: Kid) => THREE.Vector3 | null`, consulted before the default; update the flight and (on its branch, for the record) note it for the Rootways.
- **Hit-stop the runtime honours (T-31).** `SceneCtx` gains `stop(seconds)`; while stopped the runtime passes `dt = 0` to the rigs and the walk, and the scene's own systems, except whatever the scene marks as exempt (the ribbon, the shards).
- **`readParams()` default hour (T-29):** honour `defaultTime` unless `t` was actually in the query string.

## 3. The fix pass per scene (one commit each; the art-director's list in the scores file is the checklist, these are the review's additions with file and line)

**Home Wrong** (`sandbox/shadow-wrong/`): `creatures.ts:99–111` the deer pops out on the first dissolving frame; keep it visible through the 1.6 s and fade it (scale the rim shell up and the body down on an ease, or a cloned transparent material), so it dissolves into the motes rather than under them. `props.ts:319` the swing at ±25° on a 3.1 s period so a half-second pair shows it, and a station for it that is not black. S3 (the far warm light) is a beat, not a station: keep it, label it so in the hub, do not put it in front of the family yet; S4's climb per the scores file. Then `?t=` is `wrong` on every save.

**The Crash Meadow beat** (`sandbox/meadow-golden/`): `goblins.ts:150` the skid brake `smoothstep(d, REACH, REACH + spd·0.2)` converges on the reach line and the windup needs `d ≤ REACH`, so no goblin ever attacks; brake toward `REACH − 0.2` or enter windup at `d ≤ REACH + 0.15`, then prove it with the probe in §6. `main.ts:70` thin the meadow's scatter as the plan asked (the T-09 confetti is visible at S1). `goblins.ts:104–110, 185–194` the shards read as a dome; flatten the velocity fan, shrink faster, and make the dust puff visible. The ribbon in `_shared/kid-isabella.ts` eases in over 0.15 s and sweeps rather than popping to full radius. Use §2's hit-stop. Fix the S1 note per T-30.

**The west rim** (`sandbox/rim-dawn/`): `main.ts:76–77` the deer stands over the void (Opus's own `rim-dawn-s3-01`); find the bank by marching from the pond's centre outward until `inside()` fails and stepping back 1.5 m, and assert `inside()` before parking anything near an edge. `waterfall.ts:36–40` `findLip()` returns a constant after a dead call; implement the march the brief asked for. `life.ts:99` the `(foxDir > 0 ? 1 : 1)` no-op; `life.ts:111` the bird burst never fires on load because Liam stands at exactly 5.0 m (`< 5`). The bobber's ripple: the pond is the Forest's water sheet; if its uniforms expose a ripple centre, point it at the bobber, else log deferred. The rock tongue's dark top faces read as a machined block: lighten the up-facing vertices and add moss. S1 and W1 look into the dawn key (T-33): keep, do not show.

**The flight** (`sandbox/flight-golden/`): `flight.ts:165–176` sample the spline by arc length (`getPointAt`/`getTangentAt`, both verified in three r185) against a speed schedule at the bible's numbers (`npcs.md` §2.2.4: 0→12 m/s over 3 s, cruise 14, approach 12, touch 10, roll-out to 0 over 3.5 s), and size the path to fit the time (the bible allows up to 30 s); the review measured 47→89 m/s at 11.6 s and a 90 m/s circuit. `flight.ts:179` the bounce: second bounce half the first, no cut at 1.4 s. The bank should stop pinning at the clamp once the speed is right; if it still does, lower the yaw-rate gain. Stow it under **Lab** in the hub until it is re-shot.

## 4. Frames to re-shoot (with the card, `?t=` explicit, the `-02` suffix)

`shadow-wrong-s1`, `-s2`, `-cu`; `meadow-golden-s1`, `-s2`, `-s3` and the `?beat=1` connect; `rim-dawn-s2`, `-s4`, `-cu`. The flight's `wg`, `ch-03` and `ld` only after §3's speed fix. Then `art-director` (fable, xhigh) once over the nine, one report, `docs/visual-loop/opus-fixes-<date>.md`; the frames that reach 35 go in front of the family.

## 5. Tests (Vitest, `tests/unit/sandbox/`; Working Rule 7: trim first, the suite has one test)

About ten, all pure: the flight's schedule is monotonic and its per-frame speed change stays under a bound; the bounce has two peaks in the 1:0.5 ratio and returns to zero without a step; the goblin state machine reaches `windup` and `hit` from `chase` within ten seconds of contact; the fox route holds 0.9 m/s and pauses 3 s; `edgeAt()` and `findLip()` return points the plate contains; a placement helper rejects a point where `inside()` is false. Each test imports the pure function, never three's renderer.

## 6. The ledger (`LESSONS.md`; the tiers are `DEMO_PROGRAM.md` §1)

Add §0 (the always-tier, under fifteen lines), add the `tags` cell to the thirty existing rows and to these new ones, and write `scripts/rules.cjs` (prints the rows whose tags match its arguments; twenty lines; lint it as the other `.cjs`):

- `process harness` · a hidden pane and a background tab both stall the clock; step the runtime with `ssStep`, never wait for a screen; read `ssWorld.hud()` not the DOM.
- `process fight creature` · a keyed mechanic is not done until a stepped probe has shown every state reached; the goblins never attacked.
- `creature fight` · a brake that eases to zero at the trigger distance never crosses it; brake past the line or trigger before it.
- `rig process` · scene code may not write a non-active kid's `lookAt`; use the `look` hook.
- `cutscene flight` · sample a spline by arc length against a speed schedule; parametric `getPoint` steps at every waypoint.
- `props creature` · anything placed near the plate's edge asserts `inside()`; a bank is found by marching, not by subtracting a radius.
- `light` · a telegraph seam is a small emissive; large or bright ones blow to white under bloom (T-10, again).
- `process` · a lint fix is verified where the failure showed, with the build output present; `a05ab6b` passed in a worktree that had none.

Mark `story-dependent` where a row encodes a coordinate or an Act.

## 7. The hub, then the lanes

- `sandbox/index.html`: cards for Home Wrong, the Crash Meadow beat and the west rim under **Beats** / **Places**; the flight under **Lab**; the category tabs and `data-cat` attributes from `DEMO_PROGRAM.md` §3.
- Show the family (the fixed frames of §4) and take reactions as rows; tag `p0.75-demo-reel-2`; move the demo worktree to it (`git checkout p0.75-demo-reel-2` inside `StewartSquad-demo/`).
- Retire the experiment lane: `git worktree remove "C:/Documents TEMP/ClaudeCode/StewartSquad-opus"`; keep branch `phase-0.75-opus-experiment` as the record (not deleted, not merged); mark its `LANES.md` row closed. Re-cut scratch from the new tip (inside `StewartSquad-scratch/`: `git reset --hard phase-0.75-visual-studies`).
- Cherry-pick the routing commit (`LANES.md`, `CLAUDE.md`, `SESSION_PLAN.md`) onto `phase-0.85-story` from `StewartSquad-story/`.
- Rewrite `docs/NEXT_SESSION.md` for the next session, which is **demo candidates** (`DEMO_PROGRAM.md` §2).
