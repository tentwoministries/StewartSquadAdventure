# Task: CS-04, the flight — the fix pass (`OPUS_FIX_PLAN.md` §3, fourth scene)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/opus-fixes-flight.md`. Runs only after the runtime task (`opus-fixes-runtime.md`) has landed: `sandbox/_shared/step.ts` exists and `SceneWorld.look` is available.

## What and why

`sandbox/flight-golden/` (id `flight`, "The Green Meanie": Grandpa Ed flies the four kids off the Frozen Peaks' hub, CS-04) scored 25/45; its code (T-27, the curved world's centre travelling with the camera; `?ct=` the clock) is kept, its frames are not shown until the tempo is right. The review measured the flight at 60 Hz (`OPUS_EXPERIMENT_VERDICT.md` §3.3, the table): cruise 40–96 m/s against the bible's 10–14, six step changes in speed at beat boundaries (47→89 m/s at 11.6 s), the bank pinned at the clamp for 39 % of the flight, the bounce ratio 0.33 with a cut to zero, the roll-out stopping dead. Cause: the path is sampled by parametric `curve.getPoint(u)` with `u` interpolated per beat. The art-director's "Changes planned, in order" for `flight-golden-wg-01` (`docs/visual-loop/opus-experiment-scores-2026-09-08.md` §3) is the checklist for the picture; this brief is the checklist for the motion. Read both before the code.

## Files you may touch

`sandbox/flight-golden/` only (`flight.ts`, `main.ts`). Never `sandbox/_shared/` (the plane is `_shared/plane.ts`, Fable's; the kids' seated poses are a picture item from the scores file: pose them from this folder through the rig's public bones if possible, else log deferred).

## The fixes

1. **Arc-length sampling against a speed schedule** (`flight.ts:165–176`). Write a pure `flightSchedule` module (a new `sandbox/flight-golden/schedule.ts`, no three import: numbers only) exporting: `speedAt(t)` from the bible's numbers (`docs/design/npcs.md` §2.2.4: 0→12 m/s over 3 s, cruise 14, approach 12, touch 10, roll-out to 0 over 3.5 s; verify the section and quote its line), `distanceAt(t)` (the integral, monotonic), and `bounceY(t)` (below). Then `flight.ts` samples the spline with `getPointAt(s / L)` and `getTangentAt` (both verified in three r185 per `LOG.md`; re-verify against `node_modules/three` and quote) where `s = distanceAt(t)` and `L = curve.getLength()`. Size the path so the schedule's total distance fits its length (the bible allows up to 30 s; the brief's 14–18 s cannot hold a circuit at 14 m/s, which is a real conflict: pick a total time, log it as a decision, and add one tweak row to `docs/design/PHASE_0.75_TWEAKS.md` after T-34 saying so, `story-dependent`).
2. **The bounce** (`flight.ts:179`): two bounces, the second half the first (1 : 0.5), no third bump, no cut at 1.4 s; `bounceY(t)` returns to 0 smoothly. Pure, in `schedule.ts`.
3. **The bank** comes from the path's curvature (the tangent's yaw rate at the sampled speed) with a rate limit, not from the per-frame yaw delta. Once the speed is right it should stop pinning at the ±35.5° clamp; if it still pins for more than 2 s at a stretch, lower the yaw-rate gain. Level before touchdown over ≥ 1.5 s, not 0.4.
4. **The kids' per-seat looks** are dead code (`main.ts:103, 107`): move them into the new `SceneWorld.look(kid, active)` hook (Noah tracks the ground, Liam looks at the others, per the scene's own intent).
5. **The picture items** from the scores file's list that are in this folder's reach: hide the world-space rings during the cutscene; seated poses (or deferred); the rest as the list says.
6. **`?t=golden` explicit on every save.** Frames are `wg`, `ch-03`, `ld` only after the speed fix; they are not for the family until re-scored, so they go to `docs/design/mockups/` like the others and the hub lists the scene under Lab (the hub is not your file).

## Acceptance checks (run them; quote the output)

1. **The speed test, as a script** (`node`, `.cjs` or `tsx` if present: check `ls node_modules/.bin`): sample `speedAt` and `distanceAt` at 60 Hz over the whole flight and assert: per-frame speed change under 1.5 m/s at 60 Hz everywhere (no steps); cruise within 14 ± 2 m/s for the cruise leg; roll-out reaches 0 and stays; `distanceAt` monotonic. Quote the max per-frame change, the cruise min/max, and the final speed. This is the method the tests task turns into Vitest, so keep the sampling in a pure function the test can call.
2. **The bounce:** sample `bounceY` at 60 Hz: exactly two local maxima with the second between 0.45 and 0.55 of the first, no discontinuity larger than 2 cm between frames, ends at 0.
3. **The bank probe** in the page (`?step=1&ct=0`): step the whole flight one second at a time and log the bank angle; no stretch pinned at the clamp for more than 2 s; the last 1.5 s before touchdown level out monotonically.
4. **The look hook:** at a `CH` station mid-flight, read Noah's `lookAt` and Liam's: Noah's is below the plane (the ground), Liam's is at another kid.
5. **Frames:** `flight-golden-wg-02`, `flight-golden-ch-03-02` (or the `ch` station at its best `?ct=`; say which), `flight-golden-ld-02`, with the card and `?t=golden`.
6. `npm run check` green.
7. `LOG.md` rows under "Scene 3 — CS-04, the flight" for this pass, one per fix.

## Definition of done

Every check quoted with numbers; the frames saved and read (one line each); the pure module's exports named in the report with signatures (the tests task depends on them); `LOG.md` rows; the tweak row; `docs/DECISIONS.md` one line per decision the brief left to you (the total time, the yaw-rate gain, deferred poses); a report listing every file and line changed, each check's result, and anything deferred. Do not commit.
