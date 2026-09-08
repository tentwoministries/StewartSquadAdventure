# Rule sheet — the shared sandbox runtime (`docs/qa/briefs/opus-fixes-runtime.md`)

Written by `rules-librarian`, 2026-09-08. This sheet is the implementer's whole Tier-1 rule context.

**First, the never-run rule.** `DEMO_PROGRAM.md` §1 Tier 0 carries "a mechanic is not built until it has been seen to run", and §1 rule 6 / §6 step 3 make the acceptance checks the delivery. All three mechanics in this task (`ssStep`/`ssSnap`/`ssKey`, the `look` hook, the hit-stop) are exactly the class of thing the Opus experiment shipped dead (`OPUS_EXPERIMENT_VERDICT.md` §3.1 "Noah never looks up… the scene's write is overwritten before it is read"; §3.4 "the hit-stop is partial"). Nothing here is done until it has been stepped and read back from the console.

**Missing input (Working Rule 1).** `DEMO_PROGRAM.md` §1 names "`LESSONS.md` §0, kept under fifteen lines" as the Tier-0 always list. `LESSONS.md` has no §0 — it starts at "## Camera". The always-tier lines below are therefore quoted from `DEMO_PROGRAM.md` §1 Tier 0 and `LESSONS.md`'s Process rows; if a Tier-0 line is later written that contradicts this sheet, that file wins.

## 1. Applies

- **Always tier · `DEMO_PROGRAM.md` §1 Tier 0** — "a mechanic is not built until it has been seen to run"; "nothing pops (every state change eases over ≥ 0.15 s)". The stop timer and the `look` swap are state changes the runtime owns; do not add a pop, and prove each mechanic runs.
- **Always tier · `LESSONS.md` Process row 1** — "the save ran before the first rendered frame → wait for two rendered frames…; when driving the page from outside, wait 10–12 s after navigation". Governs every `ssSnap` in checks 6 and 7 (`scene.ts` `save()`, `shot.ts`).
- **Always tier · `LESSONS.md` Process row 2** — "patch TypeScript with a `.cjs` script file, never an inline string with backticks". Any scripted edit to `scene.ts`/`shot.ts` goes through a `.cjs` file in the scratchpad.
- **Always tier · `LESSONS.md` Process row 3** — "a change to `sandbox/_shared/` is checked with one frame per scene (five); a scene-local change needs only its own". This task is a `_shared/` change: brief check 7's nine frames are this rule, not an extra.
- **Always tier · `STUDY_NOTES.md` §6.8** — "a blank save is 58,885 bytes; a hidden browser pane gets no animation frames, so verify motion from the console with a fixed `dt`". This is the whole reason for `step.ts`; it is also the size test in check 6 (> 0.5 MB, not 59 KB).
- **Always tier · `STUDY_NOTES.md` §6.8** — "every scene has the same keys… `Enter` to save a self-contained 1600 × 1000 PNG with the card, and `?freeze=1` for a reproducible frame". `ssSnap` must produce the same artefact as `Enter` (card overlay when shown), and `?step=1` must not break `?freeze=1`.
- **Always tier (lowercase frame names, `?t=` explicit) · `T-29` + `OPUS_EXPERIMENT_VERDICT.md` §3.3** — "the flight's first six frames came out `flight-dusk-*`; the Rootways only escaped it because every save passed `?t=` explicitly". Frame names stay lowercase (`<scene>-runtime-02`) and every probe save passes `?t=` explicitly even after the default is fixed.
- **`PHASE_0.75_TWEAKS.md` T-29** (`sandbox/_shared/scene.ts`, proposed) — "`readParams()` defaults `t` to `'dusk'`… honour `defaultTime` unless `t` was actually in the query string". This is brief change 4 verbatim; `OPUS_EXPERIMENT_VERDICT.md` §5 marks T-29 "verified true, a one-line fix" and "adopt".
- **`PHASE_0.75_TWEAKS.md` T-31** (`heroes.md` §2.5.7, proposed) — hit-stop "stops the sim's `dt`, the camera, and every world system — but not the effect that caused it… and not the debris it made, which keep their own clock"; "the demo could only zero its own systems, because the hero rigs are stepped by the runtime". Brief change 3 is the runtime half: `ctx.stopDt` is the exemption channel the row demands.
- **`heroes.md` §2.5.7** — "The four v27 hit-stop sites port verbatim (Liam ult 0.1, Collette ult 0.15, combo impact 0.15, dungeon boss death 0.1)… Shield Bash first contact 0.06, Ground Pound impact 0.06, third-hit finisher 0.04. Nothing else may add hit-stop without a §6 line." `stop(seconds)` must take arbitrary seconds and read correctly at 0.04–0.25 s, i.e. at 60 Hz a 0.04 s stop is ~2 frames: do not round or clamp the timer.
- **`LESSONS.md` Rigs row 1** — "ease a tracked number, then **set** the bone from it; hooks add on top of the set value, never on top of an eased bone" (`_shared/rig.ts` `lookYaw`/`lookPitch`). The `look` hook writes `k.lookAt` *before* the rig reads it; it must not touch the eased bone itself.
- **`LESSONS.md` Rigs row 3 / `T-26`** — the facing conventions (`rotation.y = 180° − bearing` for kid rigs). A `look` target is a world position, not a bearing: do not convert it, and read `rig.ts` for the real signature (brief's Verification line) rather than assuming.
- **`OPUS_EXPERIMENT_VERDICT.md` §1** — the review's method: "the runtime was **stepped**: `ssSave()` renders exactly one 1/60 s frame… Deterministic and reproducible", at about 31 ms/frame. `ssStep(n)` must reproduce that determinism: with `step=1` the hidden-tab `setInterval` and the rAF clock advance are the only other sources of `t`, and both must be off.
- **`OPUS_EXPERIMENT_VERDICT.md` §4 line 1** — "silent contract violations with the runtime… One read of `renderOnce()` shows the order. Working Rule 3." Read `renderOnce` end to end before editing; the `look` hook and the `dt` gate both live inside its existing order.
- **`OPUS_EXPERIMENT_VERDICT.md` §4 "lint appeasement"** — no `void x;` to keep an unused symbol alive, no `var` + `eslint-disable-line`, no name that promises a computation and returns a constant (`findLip`). `ssStep`, `ssSnap`, `ssKey` must each do what their names say.
- **`PRE_BUILD_TODO.md` P-02** — this task is the Opus fixes item; **P-04 (demo candidates) depends on it**, and `DEMO_PROGRAM.md` §1 Tier 2 names `sandbox/_shared/step.ts` as the home of every future stepped-frame probe. Build it as the reusable harness, not as a one-off for these checks.

**Open observations (status `observed`, not rules):** `T-34` / `PRE_BUILD_TODO.md` P-05, the caves' stairs joins and the kids clipping into rock on the descent. `caves-descent` is used in checks 2 and 3 — do not "fix" the stairs here, and do not report the clipping as a regression of this change.

## 2. Checks implied

- Determinism: with `?step=1`, `ssStep(0)` twice in a row returns the same `t` (no rAF or interval advance between reads); `ssStep(60)` advances `t` by exactly 1.000 s ±1e-6 (brief check 1).
- Hit-stop timer accuracy: `ssCtx.stop(0.25)` then `ssStep(10)` leaves kid root and walker positions bit-identical and `ssCtx.stopped === true`; after 20 frames total (0.333 s) `ssCtx.stopped === false` (brief check 4). Add one probe at `heroes.md` §2.5.7's shortest site: `stop(0.04)`, `ssStep(1)` stopped, `ssStep(3)` not stopped.
- Exemption channel: while stopped, `ctx.stopDt` equals the wall dt (non-zero) on every frame — read it from the console during the stop.
- `look` hook: `ssWorld.look` returning a vector puts that exact vector in the non-active kid's `lookAt`; returning `null` leaves the default (active kid's position + (0, 1, 0)); the active kid still follows `poi` (brief check 3). Verify the rig's eased head does not accumulate (`LESSONS.md` Rigs row 1): step 120 frames and confirm `lookAt` is unchanged, not drifting.
- Key dispatch: `ssKey('t')` cycles `ssKf().name`; `ssKey('Tab')` changes `ssActive().name` on `caves-descent` (brief check 2).
- `readParams` default: `rim-dawn/?shot=S2` → `dawn`; `&t=noon` → `noon`; `forest-dusk/?shot=S1` → dusk (brief check 5). Say in the report which of the two options in brief item 4 you took.
- Save integrity: `ssSnap` output > 0.5 MB and not 58,885 bytes; name lowercase; probe file deleted after the size read (brief check 6).
- `_shared/` regression: one frame per scene, nine scenes, `<scene>-runtime-02`, each read and compared to its `-01` in one line (brief check 7; `LESSONS.md` Process row 3).
- `npm run check` green (brief check 8). Note `OPUS_EXPERIMENT_VERDICT.md` §6: the primary checkout's check needs `eslint.config.js` to ignore `dist-demo/**` — if the check is red from `dist-demo/assets/*.js`, that is the known cause, not your diff.

## 3. Not applicable, considered

- **T-27** (the curved world's centre must follow the camera) — real and adopted, but it is a `material.ts`/Phase 1 change; `material.ts` is not in the files you may touch, and stepping does not move a camera centre.
- **T-20, T-21, T-24, T-33** (key/hemisphere balance, fog at station scale, the shard's floor, dawn backlighting) — light and colour rows; this task changes no keyframe, and check 7 requires the frames be *unchanged to the eye*.
- **T-09 / T-22** (scatter density and litter colour) — scene content, not runtime; a `_shared/` change must not alter them, which check 7 already tests.
- **T-06 / MOTION_TEMPO_NOTES** (tempos, ease ≥ 0.15 s) — the runtime carries no authored motion of its own; the ease rule is quoted above only as it bears on the stop's start and end.
- **T-30 / T-32 / T-25** (station notes derived from numbers, the rock spout, the warm-light corridor) — scene-authoring rows for the cherry-picked scenes; you render their frames but must not edit them.
