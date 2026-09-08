# Task: the shared runtime for the Opus fixes (`OPUS_FIX_PLAN.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high), one agent; nothing else touches `sandbox/_shared/` until it reports. Rule sheet: `docs/qa/rules/opus-fixes-runtime.md`.

## What and why

The review of the Opus experiment (`docs/design/mockups/OPUS_EXPERIMENT_VERDICT.md` §1, §3) drove every scene from the console with a stepping harness, because a hidden Browser pane and a background Chrome tab both report `visibilityState: hidden` and the clock stalls. It also found two runtime limits that made scene code dead: `scene.ts` overwrites every non-active kid's `lookAt` each frame before the rig reads it, and a scene cannot zero the rigs' clock for a hit-stop (T-31). And `readParams()` defaults `t` to `dusk`, so a scene with no dusk falls back oddly (T-29). This task turns the review's method into code and removes the three limits, changing nothing else.

## Files you may touch

`sandbox/_shared/scene.ts`, a new `sandbox/_shared/step.ts`, `sandbox/_shared/shot.ts`. Nothing else. The Forest scene (`sandbox/forest-dusk/main.ts`) has its own `main.ts` and its own `readParams()` call; do not edit it, but confirm the `readParams` change does not alter its behaviour (it has a dusk keyframe).

## The four changes

1. **`step.ts`, the stepping harness.** Export an `installStep(api)` that `scene.ts` calls once at the end of `runScene`, exposing on `window`: `ssStep(n)` (renders exactly `n` frames of 1/60 s through the normal `renderOnce`, no upload, returns the scene clock `t` after), `ssSnap(name)` (renders one frame then POSTs the canvas to the shot plugin under a lowercase name via `saveShot`, with the card overlay when the card is shown; returns the file name), `ssKey(k)` (dispatches a `keydown` `KeyboardEvent` with `key: k` on `window`, so scene keys and Tab work). A `?step=1` query param (add `step: boolean` to `Params` in `shot.ts`) disables the hidden-tab `setInterval` tick *and* the `requestAnimationFrame` loop's clock advance, so stepping is deterministic: with `step=1` the only thing that advances `t` is `ssStep`. `scene.ts` passes its `renderOnce`, `save`-style snap and the canvas into `installStep`; nothing else in `scene.ts` changes for this item.
2. **The `look` hook.** Add `look?: (kid: Kid, active: Kid) => THREE.Vector3 | null` to `SceneWorld`. In `renderOnce`'s head loop, for a non-active kid consult `world.look?.(k, a)` first; if it returns a vector, copy it into `k.lookAt`, else the default (the active kid). The active kid's rule is unchanged (`poi`). Document both hooks in the interface comment.
3. **Hit-stop the runtime honours (T-31).** Add `stop(seconds: number)` to `SceneCtx` and a `stopped` boolean (true while the stop timer is positive). While stopped, `renderOnce` passes `dt = 0` to `walk.update`, every `k.update`, and `world.update`; `t` still advances (particles a scene marks as exempt read `ctx.stopDt`, the real frame dt, which is always the wall dt). Concretely: `ctx.stopDt = dt` every frame, `ctx.stopped = stopLeft > 0`, and the `dt` handed to walk, rigs and `world.update` is `ctx.stopped ? 0 : dt`. The scene decides what is exempt by reading `ctx.stopDt`. The stop timer decrements by the wall dt.
4. **`readParams()` default hour (T-29).** `t` defaults to `''` when absent from the query string; `scene.ts` treats `''` (or any value not in `def.times`) as "use `def.defaultTime`". Remove the special-case `dusk` line. The Forest scene's own `readParams()` call must still see `dusk` when `t` is absent: check how `forest-dusk/main.ts` uses `params.t` and, if it relied on the `dusk` default, keep the fallback there by passing a default into `readParams(defaultT = 'dusk')` rather than editing the Forest. Say which you did.

## Verification (Working Rules 2 and 3)

- Before writing, grep every name you use: `renderOnce`, `saveShot`, `drawOverlay`, `showCard`, `walk.update`, `k.update`, `params.freeze`. Do not guess the rig's `update` signature; read `rig.ts`.
- `KeyboardEvent` dispatch on `window` reaches the `keydown` listener in `scene.ts`; verify by calling `ssKey('t')` and reading the time from `ssKf().name`.

## Acceptance checks (run them; quote the output)

Serve with the dev server on :5173 (`.claude/launch.json` `sandbox` or `npx vite --port 5173 --strictPort`; check `npx vite --help` for `--strictPort` before using it). Drive the page with Puppeteer or the Browser pane in a hidden state; the point is that nothing depends on the page being visible.

1. On `sandbox/frozen-night/?shot=S1&t=night&step=1`, after load (wait 12 s), read `ssWorld.hud()` and the clock `ssStep(0)`; then `ssStep(60)` and read both again: `t` advanced by exactly 1.000 s (±1e-6) and no more between the two reads; the hidden-tab tick did not add frames. Then `ssStep(120)`: exactly 2 s more.
2. Same page, `ssKey('t')` twice: `ssKf().name` cycles through the scene's times; `ssKey('Tab')` on `sandbox/caves-descent/` changes `ssActive().name`.
3. The `look` hook: on `sandbox/caves-descent/?step=1`, from the console set `ssWorld.look = (k) => k.name === 'Noah' ? new THREE.Vector3(0, 30, 0) : null` (you will need `THREE` in scope: expose it as `window.ssTHREE` from `step.ts`), `ssStep(120)`, then read Noah's `lookAt`: it is `(0, 30, 0)`, and another non-active kid's `lookAt` is at the active kid's position + (0, 1, 0).
4. Hit-stop: on `sandbox/meadow-golden/?step=1&beat=1`, call `ssWorld` … there is no scene hook for stop yet; instead test through `window.ssCtx` (expose the `SceneCtx` as `ssCtx`): `ssCtx.stop(0.25)`, record `ssKids[0].root.position` and the walker's position, `ssStep(10)`, positions unchanged and `ssCtx.stopped === true`; `ssStep(10)` more (0.33 s total), `ssCtx.stopped === false`.
5. `readParams` default: `sandbox/rim-dawn/?shot=S2` (no `t`) loads with `ssKf().name === 'dawn'`; `sandbox/rim-dawn/?shot=S2&t=noon` loads `noon`; `sandbox/forest-dusk/?shot=S1` still loads dusk (read its HUD or `ssKf` if it has one).
6. `ssSnap('runtime-check-frozen')` saves a real frame (> 0.5 MB, not 59 KB) under `docs/design/mockups/`; delete that file after checking its size (it is a probe, not a deliverable).
7. **One frame per existing scene, unchanged to the eye**, saved with `ssSnap` after `ssStep(120)` at each scene's default station and time with `?step=1`: `forest-dusk` is not on the shared runtime, so use its own `ssSave()` there; `desert-noon`, `bog-night`, `frozen-night`, `caves-descent`, and the four cherry-picked scenes `shadow-wrong`, `meadow-golden`, `rim-dawn`, `flight-golden`. Name them `<scene>-runtime-02`. Read each PNG and say in one line each that it matches the `-01` of the same station (or what differs).
8. `npm run check` green.

## Definition of done

Every check above quoted with its output; the nine frames saved and read; `LOG.md` gets a short section "The shared runtime for the Opus fixes (2026-09-08)" listing the four changes and the check results; `docs/DECISIONS.md` one line per decision the brief left to you; a report to the orchestrator listing every file and line changed, each check's result, and anything deferred. Do not commit.
