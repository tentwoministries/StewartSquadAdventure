# Task: The Hearth — the reel fixes, round 1 (`REEL_FIXES_BRIEF.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/reel-fixes-frozen-03.md`. Rows: **T-51, T-52, T-53, T-54** in `docs/design/PHASE_0.75_TWEAKS.md` (read them; each carries its diagnosis). Round suffix: `-03`.

## What and why

Andrew, reel 2: the penguins "walk down the snow bank and then slide up the snow bank on their sides"; the seals "just do a back flip, rotating in place on an axle"; the pond in the corner "is a plane floating in the air, you can see under it", with a creature hopping in it you cannot see; and the reindeer only came through after he pressed `0`.

## Files you may touch

`sandbox/frozen-night/creatures.ts`, `sandbox/frozen-night/terrain.ts` (the `DRIFT` constant and its slope term in `terrainY`), `sandbox/frozen-night/props.ts` (the ice-fall pool block). **Not** `flora.ts` (the rocks builder owns it this round), **not** `main.ts` beyond a one-line change if the herd needs a constructor argument (another builder may edit its `place`), not `_shared/`.

## The fixes

1. **T-51, the drift runs downhill to the lake and the slide is on the belly.** `terrainY` pulls the drift's authored top (−33, 1) into the lake basin's smoothing (`lakeD` ≈ 1.01), so the "top" is lower than the "bottom". Move the drift so its top is clear of the basin (`lakeD` > 1.35 at the top) and its bottom meets the lake shore, keeping the `PG` station's subject in frame (`PG` targets (−35, 0.8, 0); read `main.ts`, do not edit it — if the drift must move so far that PG no longer frames it, report the new station numbers instead). Penguins waddle *up* it, slide *down* it: sample `groundY` along the slide path at 20 points — strictly non-increasing, total drop ≥ 1.5 m. The slide pose: give each penguin a heading parent (or Euler order `YXZ`) so the lie-down is a pitch about its own side axis: belly (local +z, the belly is at +0.12 z) toward the ground, head (local +y) pointing along the slide direction.
2. **T-52, the seals.** Roll about the body's own long axis (the seal is built along +x): a lazy half-roll onto the back over 0.8 s, held 1.2 s, back over 0.8 s, eased; no yaw or pitch change during it. When fleeing a kid (within 5 m), hump-crawl: a 3 Hz pulse of `scale.x` (0.9–1.1) with the nose lifting (a small pitch, local), facing the flee velocity (`rotation.y` from the velocity with the +x convention `90° − bearing`), speed unchanged.
3. **T-53, the pool lies in a basin.** The ice-fall pool is a 7 m disc at `base + 0.05` over terrain that dips toward the approach. Either sink the disc to the terrain's minimum inside its footprint and raise a shore, or give `terrainY` a shallow basin under it (a 7.5 m radius dish 0.25 m deep with a lip at the disc's level) — the terrain edit is the honest one (T-38's pattern). Check by sampling: 72 bearings at radii 7.3 and 8.0 m: `terrainY ≥ poolY − 0.02` (the shore holds the water); 100 points inside r < 6.5: `terrainY ≤ poolY − 0.05` (the water lies in a dish). The 10 snow-hump rim boulders stay on the shore. Then find the creature whose home is inside the pool footprint (`creatures.ts` hares at `[-6, 14], [12, -6], [-16, -14], [28, 12]`, ptarmigans at `[6, 10], [8, 12], [-4, -16], [30, -4], [-14, 28]`, or a wander patch — compute which lies within 7.5 m of (−8, −30)) and move its home 4–6 m onto the south shore where the S4 camera sees it; report which it was.
4. **T-54, the herd crosses on its own.** `herd.park(LAKE.x − 18, LAKE.z − 8, 110)`: the 110 is a bearing and `park` resets `scripted`; the crossing routes fire only from `walkNow()` on key 0. Add a schedule in `creatures.ts`: the first route at 20 s of scene time, the second at 90 s, then the wander as today; key 0 still forces the next route immediately. The herd's walk speed and the follow-the-trail followers are unchanged.

## Acceptance checks (quote the numbers)

Harness on :5173 (already up), `?step=1`, wait 12 s; expose `ssProbe` for the penguins (positions, rotations, local-axis world vectors), the seals (heading vector, roll angle, position), the herd (state, bull position), and `terrainY`/`groundY` sampling.

1. **Drift:** the 20-point `groundY` profile along the slide path (top → bottom), quoted; non-increasing, drop ≥ 1.5 m. Over one 22 s penguin loop (`ssStep(1320)`, sampling every 10 frames), per phase: waddle-up y is non-decreasing (tolerance 0.02), slide y non-increasing; at mid-slide the belly vector's y ≤ −0.85 and the head vector's horizontal component points within 20° of the slide direction. Frames `frozen-night-pg-03` (the `PG` station, `?t=night`) and a mid-slide `frozen-night-slide-03`.
2. **Seals:** over one roll, the long axis's world direction changes < 10°, roll angle reaches π ± 0.1 and returns to 0 ± 0.05; with Isabella walked to within 5 m, the seal moves ≥ 3 m in 3 s with its heading within 15° of its velocity and `scale.x` oscillating in [0.9, 1.1]. Frame `frozen-night-seals-03` (a study framing through `ssOrbit`).
3. **Pool:** the shore and dish samples (min shore `terrainY − poolY`, max dish `terrainY − poolY`), quoted. Frame `frozen-night-s4-03` and a low walk-up frame `frozen-night-pool-approach-03` (camera on the approach, pitch 10, d 12): no sheet edge or underside visible. The moved creature named, its new home and the frame it is visible in.
4. **Herd:** no key pressed, sample `herd.state` and the bull's position every 60 frames to 120 s: state `walk` begins between 18 and 24 s; at 45 s the bull is ≥ 15 m from the park point; a second `walk` begins between 85 and 95 s. Then on a fresh load `ssKey('0')` at 5 s starts a `walk` within 1 s. Frame `frozen-night-s2-03` at 32 s (`?t=night`, the herd on the ice in frame; if the route does not cross S2's frame, say so and propose the route or station change).
5. Frames `frozen-night-s1-03`, `frozen-night-l1-03` for Andrew's pass. `npm run check` green.

## Shared docs

Append only, one edit per file, re-read first: `LOG.md` (heading `## Reel fixes round 1 — the Hearth`), `DECISIONS.md`, `LESSONS.md` (Rigs rows: local pitch/roll via a heading parent or `YXZ`; a slope asserted by sampling; a scripted pass fires on its own). No new tweak rows.

## Definition of done

Checks quoted, frames read, docs appended, a report with files and lines, results, deferrals and any station numbers proposed. Do not commit.
