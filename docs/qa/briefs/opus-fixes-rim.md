# Task: the west rim at dawn — the fix pass (`OPUS_FIX_PLAN.md` §3, third scene)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/opus-fixes-rim.md`. Runs only after the runtime task (`opus-fixes-runtime.md`) has landed (`sandbox/_shared/step.ts` exists). Does not need the `look` hook or the hit-stop.

## What and why

`sandbox/rim-dawn/` (id `rim`, the west rim of the Forest island at dawn: the stream's fall off the plate, the plunge pool in the void, the fox, the songbirds, the bobber, Liam) scored 29/45; its S2 (the fall seen from off the island) is the simplest and strongest composition in the experiment. The review found placement and stub defects (`OPUS_EXPERIMENT_VERDICT.md` §3.5): the deer floats over the void in Opus's own frame, `findLip()` returns a constant, a no-op ternary, a bird trigger at exactly the boundary. The art-director's "Changes planned, in order" for `rim-dawn-s2-01` (`docs/visual-loop/opus-experiment-scores-2026-09-08.md` §5) is the checklist. Read both before the code.

## Files you may touch

`sandbox/rim-dawn/` only (`main.ts`, `life.ts`, `waterfall.ts`). Never `sandbox/_shared/` or `sandbox/forest-dusk/` (the pond is the Forest's water sheet; if its uniforms expose a ripple centre you may *set* it from this folder, not edit the sheet).

## The fixes

1. **The deer stands on ground** (`main.ts:76–77`): today at (−49.5, −28.5), past the plate's organic edge. Find the bank by marching from the pond's centre outward along the chosen bearing until `inside()` fails, then step back 1.5 m; assert `inside()` there. Write this as a pure helper `bankPoint(cx, cz, bearing, inside, step)` in `life.ts` (or a new small `place.ts` in this folder) that returns the point or null; the tests task (`tests/unit/sandbox/`) imports it, so it must not import three's renderer (three's math classes are fine; better none). Use it for anything placed near an edge in this scene.
2. **`findLip()` searches** (`waterfall.ts:36–40`): implement the march the brief asked for along the stream's last two points with `inside()`, returning the exact lip; pure, testable, no renderer import. `edgeAt()` already searches; share the helper.
3. **`life.ts:99`** the `(foxDir > 0 ? 1 : 1)` no-op: make it what it meant, or delete it. **`life.ts:111`** the bird burst never fires on load because Liam stands at exactly 5.0 m and the trigger is `< 5`: make the trigger `≤` or move Liam 1 m toward the birch (the scores file says move him); it must fire within 1 s of load at S4.
4. **The bobber's ripple:** the pond is the Forest's water sheet; if its material uniforms expose a ripple centre (grep `_shared/water.ts` for a centre uniform), point it at the bobber; else log it deferred in the report and `LOG.md`, one line.
5. **The rock tongue** (T-32) reads as a machined hexagonal block from below at S2: lighten the up-facing vertices, add moss lumps, break the silhouette's straight edges. Keep the fall translucent and the mist.
6. **S1**: the water sheet stops as a hard green rectangle and Liam appears to stand on it; check him against the walk's water wall and fix the sheet's end (the fall should start where the sheet ends). **W1**: the island is one violet mass (T-16 at the wide station); retune the fog for W1 or mark the station study-only in its `note`. S1 and W1 look into the dawn key (T-33): keep them, do not show them (note it in the station notes).
7. **`?t=dawn` explicit on every save.**

## Acceptance checks (run them; quote the output)

Stepping harness (`?step=1`) on :5173; wait 12 s after each navigation.

1. From the console: `ssWorld.inside(x, z)` at the deer's feet is true (expose `inside` on the world if it is not already); quote the deer's position and the result. Also true at Liam's and the fox's route ends.
2. `findLip()` returns a point the plate contains (`inside()` true) within 1 m of the water sheet's end: quote both points and the distance.
3. The bird burst fires within 1 s of load at S4: load `?shot=S4&t=dawn&step=1`, `ssStep(60)`, and read the birds' state from a probe (`ssWorld.probe()`; expose it): at least one bird airborne.
4. The fox: over 20 s of stepping (`ssStep(60)` ×20), its route parameter advances at 0.9 m/s and it pauses 3 s at each end (the review verified this; quote the numbers to show nothing regressed).
5. **The re-shoot frames (§4):** `rim-dawn-s2-02`, `rim-dawn-s4-02`, `rim-dawn-cu-02`, plus `rim-dawn-s1-02`, `-s3-02` (the deer on the bank) and `-w1-02`, all with the card and `?t=dawn`, after `ssStep(120)` at the station. Read each; say what the deer stands on in `s3`.
6. `npm run check` green.
7. `LOG.md` rows under "Scene 5 — the west rim at dawn" for this pass, one per fix.

## Definition of done

Every check quoted; the frames saved and read (one line each); the pure helpers named in the report with their signatures (the tests task depends on them); `LOG.md` rows; `docs/DECISIONS.md` one line per decision the brief left to you; a report listing every file and line changed, each check's result, and anything deferred. Do not commit.
