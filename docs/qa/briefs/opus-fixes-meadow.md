# Task: the Crash Meadow beat — the fix pass (`OPUS_FIX_PLAN.md` §3, second scene)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/opus-fixes-meadow.md`. Runs only after the runtime task (`opus-fixes-runtime.md`) has landed: `sandbox/_shared/step.ts` exists and `SceneCtx.stop` / `ctx.stopDt` are available.

## What and why

`sandbox/meadow-golden/` (id `meadow`, the Crash Meadow fight beat, Isabella and Liam against three goblins; `?beat=1` runs the connect) scored 31/45 and is the reel's only fight beat once its core loop runs. The review found the goblins never attack (`OPUS_EXPERIMENT_VERDICT.md` §3.4): the skid brake converges on the reach line and the windup needs `d ≤ REACH`, so no goblin ever crosses it. The art-director's "Changes planned, in order" for `meadow-golden-s1-a-01` (`docs/visual-loop/opus-experiment-scores-2026-09-08.md` §4, plus the addendum's items 9–11) is the checklist. Read both before the code.

## Files you may touch

`sandbox/meadow-golden/` (`goblins.ts`, `main.ts`, `props.ts`) and, for the ribbon only, `sandbox/_shared/kid-isabella.ts`. Nothing else under `_shared/`. A change to `kid-isabella.ts` is checked with one saved frame from every scene that shows Isabella (`frozen-night`, `caves-descent`, `flight-golden`, this scene): her idle and her flourish (`X`) must be unchanged except the ribbon's ease.

## The fixes

1. **The goblins attack** (`goblins.ts:150`): the brake `smoothstep(d, REACH, REACH + spd·0.2)` eases speed to zero at the reach line. Brake toward `REACH − 0.2`, or enter `windup` at `d ≤ REACH + 0.15` (choose one, say which, and why). Then every state runs: `chase → windup → (cone telegraph) → hit → ring flash → shake`, and the soft push and the 0.25 m hit radius behave. Prove it with the probe below.
2. **Thin the meadow scatter** (`main.ts:70`): the plan asked for the meadow at the Forest's core density; the T-09 confetti (red, orange and blue flecks) is in every wide frame. Thin it and bring the litter to T-22's olive-browns.
3. **The shards** (`goblins.ts:104–110, 185–194`) read as a brown dome at +0.8 s: flatten the velocity fan (more horizontal, less up), shrink faster, and make the dust puff's twelve points visible by +0.4 s. Give the shards gravity that has them below 0.5 m by +0.8 s.
4. **The ribbon** (`_shared/kid-isabella.ts`) pops to full radius on the first frame: ease it in over ≥ 0.15 s and sweep it (a radius that grows and an angle that advances), so a +0.1 s frame shows a small ribbon and +0.4 s a full one.
5. **Hit-stop through the runtime (T-31):** replace the scene's partial hit-stop with `ctx.stop(seconds)`; the ribbon and the shards are exempt (they advance on `ctx.stopDt`). The number: read `heroes.md` §2.5.7 for the bible's hit-stop and use it.
6. **The S1 note (T-30):** rewrite the station's `note` from the render (the camp is upper-right, the furrow's end upper-left; no totem in frame). Keep the station's numbers. If a totem can enter S1 without moving the station, place one; else log it as deferred.
7. **The lantern in the cage** (the ledger's line-of-sight row applied to a prop) and the rest of the art-director's list.

## Acceptance checks (run them; quote the output)

Stepping harness (`?step=1`) on :5173; wait 12 s after each navigation.

1. **The goblin probe:** on `?shot=S1&t=golden&step=1&beat=1`, send the goblins (the scene key that starts the charge; `O` lists it), then for 16 s step 60 frames at a time and after each second log every goblin's `state` and its distance to Isabella (expose what you need on `ssWorld` for the probe, e.g. `ssWorld.probe()` returning `{state, d}` per goblin; keep it, it is cheap). The log shows `windup` and `hit` reached for at least one goblin within 10 s of contact, and the ring flash fired. Quote the whole log.
2. **The ribbon:** `ssKey('x')` on Isabella (make her the active kid), `ssSnap` at +0.1 and +0.4 s (`ssStep(6)`, `ssStep(18)`): the ribbon's radius grows between them (read the PNGs; say the approximate radius in pixels in each). Name them `meadow-golden-ribbon-{0,1}-02`.
3. **The shards:** trigger the shatter (the Ground Pound on a shard-bearing target, or the key that fires it), `ssSnap` at +0.4 and +0.8 s: the puff visible at +0.4, the shards below 0.5 m (read `goblins.ts`'s shard positions from a probe, quote the max y) by +0.8. Name them `meadow-golden-shatter-{0,1}-02`.
4. **Hit-stop:** at the first hit, `ssCtx.stopped` is true and Liam's walk does not advance for the stop's duration; the ribbon still advances (a probe: read its radius before and after 3 stopped frames).
5. **The re-shoot frames (§4):** `meadow-golden-s1-02`, `-s2-02`, `-s3-02`, and the `?beat=1` connect as `meadow-golden-beat-02` (the frame at the moment of the first hit), all with the card and `?t=golden`, after `ssStep(120)` at the station. Plus one Isabella frame from `frozen-night`, `caves-descent` and `flight-golden` at their close-up station (`meadow-check-<scene>-02`), read against the existing `-01` close-ups: unchanged.
6. `npm run check` green.
7. `LOG.md` rows under "Scene 4 — the Crash Meadow fight beat" for this pass, one per fix.

## Definition of done

Every check quoted, the probe log in full; the frames saved and read (one line each); `LOG.md` rows; `docs/DECISIONS.md` one line per decision the brief left to you (the brake choice, the hit-stop number, the totem); a report listing every file and line changed, each check's result, and anything deferred. Do not commit.
