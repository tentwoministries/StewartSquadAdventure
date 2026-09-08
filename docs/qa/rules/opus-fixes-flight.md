# Rule sheet — CS-04, the flight (`docs/qa/briefs/opus-fixes-flight.md`)

Written 2026-09-08 by `rules-librarian`. Scope: `sandbox/flight-golden/` only.

**Never-run first.** The ledger's hardest row is that a mechanic nobody stepped is a mechanic that has never run: `OPUS_EXPERIMENT_VERDICT.md` §3.4 ("the goblins never attack … the scene's core loop and it has never run") and §3.3's "the landing's two bounces (unscored, unseen)" in the scores file's **Keep** line. This task's bounce, bank and roll-out are exactly that shape: step them and read numbers before claiming any of them.

## Applies

- **Always · hidden-pane stall + stepping harness** — `STUDY_NOTES.md` §6 rule 8: "a hidden browser pane gets no animation frames, so verify motion from the console with a fixed `dt`". Every motion check here (bank probe, bounce, speed) must run through `_shared/step.ts` / `?step=1&ct=0`, not by watching.
- **Always · arc-length sampling** — `OPUS_EXPERIMENT_VERDICT.md` §3.3: "The fix is arc-length sampling with a speed profile … and a bank derived from the path's curvature with a rate limit, not from the per-frame yaw delta." Governs `flight.ts:165–176` and the new `schedule.ts`.
- **Always · the `look` hook** — `LESSONS.md` Rigs row 1: "ease a tracked number, then **set** the bone from it; hooks add on top of the set value, never on top of an eased bone." Scene code may not write a non-active kid's `lookAt`; use `SceneWorld.look(kid, active)` (brief fix 4, `main.ts:103,107`).
- **Always · pure modules for anything a test imports** — brief fix 1 and check 1: `schedule.ts` exports `speedAt`, `distanceAt`, `bounceY` with no three import, so the tests task can call them.
- **Always · `?t=` explicit** — T-27's sibling **T-29** (`PHASE_0.75_TWEAKS.md`): `readParams()` defaults `t` to `'dusk'`, so "the flight's first six frames came out `flight-dusk-*`". Every save passes `?t=golden`; frame names lowercase and hyphenated (`flight-golden-wg-02`).
- **Always · `.cjs` patch recipe** — `LESSONS.md` Process row 2: "patch TypeScript with a `.cjs` script file, never an inline string with backticks." The speed/bounce probe scripts are `.cjs` (or `tsx` if `node_modules/.bin` has it).
- **Always · no edits outside the scene folder** — `LESSONS.md` Process row 3: "a change to `sandbox/_shared/` is checked with one frame per scene (five)". Brief: `_shared/plane.ts` and `_shared/rig.ts` are off-limits; pose through public bones from `flight-golden/` or log deferred.
- **Always · Working Rule 2 re-verification** — `LOG.md` session 1 Rule 2 note: `Curve.getPointAt(u, target)` and `Curve.getTangentAt(u, target)` exist on every curve (`src/extras/core/Curve.js:83, 323`); `CatmullRomCurve3(points, closed=false, curveType='centripetal', tension=0.5)` (`src/extras/curves/CatmullRomCurve3.js:120`). Re-grep `node_modules/three` and quote before use; `getLength()` too — it is *not* in that verified list.
- **T-06 (motion tempo, `needs-render`; the numbers are agreed)** — the ease rule: "nothing pops, every state change eases over ≥ 0.15 s"; `MOTION_TEMPO_NOTES.md`: "Camera follow: damped, slight look-ahead; no snapping." The six step changes in speed and the 194°/s snap roll are this rule broken.
- **`npcs.md` §2.2.4, quoted** — Cruise `hopping 10 · propeller 12 · rudder 13 · repaired 14 m/s`; Max bank `15° · 20° · 30° · 35°`; Takeoff roll `0 → 12 m/s over 3.0 s (18 m), rotate at 12 m/s`; Landing approach `12 m/s at 3.5 m/s descent, flare at 2 m, touch at 10 m/s`; Roll-out `10 → 0 m/s over 28 m (3.5 s); the tail drops at 4 m/s`; Climb rate `2.5 · 3 · 3.5 · 4 m/s`; Taxi `3 m/s`; "Steering rate limit, yaw chase, bank lag: 1.2 rad/s, 3.5/s, 4/s — kept". CS-04 cloud layer `+24 m above the hub ground`.
- **The length conflict is real and must be logged** — `story-beats.md` §2.10 CS-04 "14–18 s"; §2.2 "one circuit of the island (the establishing shot that teaches its layout)". VERDICT §3.3: "The brief's 14–18 s window cannot contain a circuit at the bible's 14 m/s, which is a real conflict Opus should have logged as a row (it did not)." One `DECISIONS.md` line + one tweak row after T-34, status `story-dependent`.
- **`npcs.md` §2.3.7 (landing)** — "Every landing bounces, including the repaired plane's: the landing record is canon"; the bounce is 1 : 0.5 easing out (`OPUS_EXPERIMENT_BRIEF.md` §3.3), not 0.33 with a third bump and a cut (VERDICT §3.3 table, `flight.ts:179`).
- **T-27 (keep)** — the curve's centre is a camera property, re-centred every frame on what the camera follows; the rings are their own shader. Do not regress it while re-writing the sampler; **and** scores §3 change 4: "Hide the rings for the duration of the flight" (world-space UI in a cutscene).
- **T-28 (keep and extend)** — kids 0.84 m across / 0.72 m along, dropped so the rim cuts them at the waist; props stowed. Scores §3: at `WG` "their hips sit on top of the box, not in a cockpit"; change 5 (seated pose, `WG` pitch +4°) is this task's picture item.
- **T-26 / `LESSONS.md` Rigs row 3 (facing)** — the plane is built along +x (`90° − bearing`), the kids on +z (`180° − bearing`). Any re-seating or look change must be read back from a close-up, not assumed.
- **`LESSONS.md` Camera row 2** — the key light's target and shadow box follow the walked hero; scores §3 change 2 asks the same for the plane so its shadow crosses the pines.
- **`LESSONS.md` Process row 1** — "wait for two rendered frames … 10–12 s after navigation" before any save; a blank save is 58,885 bytes.
- **P-02 (`PRE_BUILD_TODO.md`)** — this task is P-02, "The Opus fixes"; it is a prerequisite of P-04 (demo candidates), so `LOG.md` rows and the report are the hand-off, and nothing is committed.

**Open observations (status `observed`, not rules):** T-34 (the caves' stairs and rock clipping; `misc`/`props`/`walk`) — a `misc` row awaiting its fix, and the row the new tweak row is appended *after*.

## Checks implied

1. `.cjs`/`tsx` probe over `speedAt`/`distanceAt` at 60 Hz: max per-frame Δspeed < 1.5 m/s, cruise 14 ± 2 m/s on the cruise leg, `distanceAt` strictly monotonic, final speed 0 and held. Quote max Δ, cruise min/max, final.
2. `bounceY` at 60 Hz: exactly two local maxima, second/first in 0.45–0.55, no frame-to-frame step > 0.02 m, ends 0.
3. `?step=1&ct=0` bank probe, one second at a time over the whole flight: no stretch at the ±clamp longer than 2 s; the last 1.5 s before touchdown level monotonically. Compare the clamp against §2.2.4's per-state max bank.
4. Look hook at a mid-flight `CH` station: Noah's `lookAt` below the plane, Liam's at another kid; assert no scene code writes a non-active kid's bone directly (grep `flight-golden/` for `lookAt`).
5. Three-API re-verification: grep `node_modules/three` for `getPointAt`, `getTangentAt`, `getLength` on `Curve` and quote file:line in `LOG.md` before the sampler is written.
6. Frames `flight-golden-wg-02`, `flight-golden-ch-03-02`, `flight-golden-ld-02` saved with `?t=golden`, read back one line each (rings hidden, no stray hexagon, four heads separate); file names lowercase, size ≠ 58,885 bytes.
7. `npm run check` green; `LOG.md` row per fix; the tweak row after T-34 (`story-dependent`); `DECISIONS.md` lines for total time, yaw-rate gain, deferred poses.

## Not applicable, considered

- **T-07 / T-20 / T-11 (light units and key-hemi balance)** — the scores' colour and lighting changes 1–2 are `biomes.ts`/`_shared` territory (the pastel cap is "inherited … Fable's", VERDICT §3.3), outside "files you may touch"; only the plane's own key target is in reach.
- **T-09 / T-22 (confetti scatter, leaf litter)** — the flight imports `frozen-night/` unedited; no scatter is authored here.
- **T-17 / T-23 (aurora altitude, a station that looks up)** — golden hour, no aurora; the flight's stations are already airborne and free of the 18° pitch trap.
- **T-31 (hit-stop's reach)** — no combat in CS-04.
- **T-13 / `_shared/orbit.ts` clamp** — the orbit is disabled during the flight by the scene's own brief (`OPUS_EXPERIMENT_BRIEF.md` §3.3), and the clamp lives in `_shared/`.
