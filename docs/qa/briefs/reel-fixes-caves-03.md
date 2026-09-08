# Task: The Crystal Depths — the reel fixes, round 1 (`REEL_FIXES_BRIEF.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/reel-fixes-caves-03.md`. Rows: **T-55, T-56** in `docs/design/PHASE_0.75_TWEAKS.md` (T-34 is the earlier observation). Round suffix: `-03`.

## What and why

Andrew, reel 2: the staircase "doesn't connect right to the top … you have to be a few distances back and the character has to mysteriously find the right entry point, and then they get clipped until they pop out of the rock"; and the kids' rings "don't appear on the staggered rocks … even when you are technically on one", with clipping walking between them.

## Files you may touch

`sandbox/caves-descent/terrain.ts` — **everything except the shell's jitter loop** (the `for (let i = 0; i < dp.count; i += 3)` block in `makeCave`, which the rocks builder is editing in parallel; make your `Edit`s with `old_string`s that do not include it, and re-read the file right before each edit), `sandbox/caves-descent/props.ts` (only if a lamp or prop footprint blocks the stair mouth), new test `tests/unit/sandbox/caves.test.ts`. Not `main.ts` (another builder may edit its `place`; if a station must move, propose numbers), not `_shared/`.

## The fixes

1. **T-55, cut the tiers to the stair.** In the column loop (`colAt` over the grid), a column whose centre lies inside a stair's band (`stairY(x, z) !== null`) must top out **0.30 m below the tread** at that point (so it supports the step and never pokes through), or be skipped where the tread itself is the surface; do the same on tier 1 for the second stair. Make the drawn step width and the walkable band agree (both 3.2 m, or both 3.8 m — pick one and say why). Widen the mouth: where the stair starts on a tier, let the band's first 3 m flare to 5 m and make the tier's `onLanding`/`onTier1` region include a 2 m apron round the stair's first point so a kid approaching from any bearing in a 90° fan centred on the stair's direction reaches the tread without a step-limit refusal.
2. **T-56, the tops agree with `groundY`.** Remove the y jitter on the column tops (`(r() − 0.5) * 0.25` in `colAt`'s translate) or fold the same jitter into `groundY` so the two agree within 0.05 m; keep the xz jitter and the rotation. The ring itself is `_shared` (another builder lifts it to +0.04); your check is that a ring at ground + 0.04 is not cut by any column within 0.9 m of a kid standing anywhere on the landing or tier 1.

## Acceptance checks (quote the numbers)

1. **`caves.test.ts`** (Vitest, no renderer): (a) along each stair's centreline and the two lines offset ±1.0 m, at 0.25 m spacing, `groundY` is continuous (|Δ| ≤ 0.15 m per sample) and every point is `walkable`-equivalent (inside the cave); (b) for 300 seeded random points on the landing and tier 1, the column geometry's top under the point (raycast down from y + 3 against `makeCave().tiers`, `THREE.Raycaster` works headless) agrees with `groundY` within 0.05 m; (c) for 200 points along the stairs, the highest hit among `tiers` and `stairs` is within 0.05 m of `stairY` (no column pokes through). Trim first (Working Rule 7): the suite has 25 tests; add ≤ 6.
2. **Walk probe** (`caves-descent/?shot=S1&step=1`, harness on :5173, `?step=1`, wait 12 s): place Liam (through `ssActive().root.position`, then `ssWalk.setHero` is not needed) at three approach points 4 m from the first stair's mouth at bearings −40°, 0°, +40° off the stair's direction, set `ssOrbit.current.yaw` so `w` heads at the mouth, hold `w` 240 frames: in every run Liam's y falls below −2.0 (he is on the stair) with no frame where his `groundY` exceeds the highest `tiers`/`stairs` hit under him by more than 0.05 m (never inside rock). Quote each run's final position and the max intrusion.
3. **Frames:** `caves-descent-s2-03` (the descent, `ssStep(120)`), `caves-descent-stair-03` (a study framing through `ssOrbit` looking down the first stair from the landing with a kid on the third step), `caves-descent-s1-03`, and a frame with Isabella (`Tab` ×3) standing on tier 1 with her ring fully visible: `caves-descent-ring-03`. Read each in one line.
4. `npm run check` green (suite count stated).

## Shared docs

Append only, one edit per file, re-read first: `LOG.md` (heading `## Reel fixes round 1 — the caves`), `DECISIONS.md`, `LESSONS.md` (a Density/scale or Camera row: a stair crossing a tier cuts the tier; the tier's tops agree with `groundY`). No new tweak rows.

## Definition of done

Checks quoted, test in, frames read, docs appended, a report with files and lines, results, deferrals, any station numbers proposed. Do not commit.
