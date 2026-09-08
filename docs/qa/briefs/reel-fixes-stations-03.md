# Task: stations a kid cannot walk from — the reel fixes, round 1 (`REEL_FIXES_BRIEF.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/reel-fixes-stations-03.md`. Row: **T-47** in `docs/design/PHASE_0.75_TWEAKS.md`. Round suffix: `-03`.

## What and why

Andrew pressed `4` in Home, Wrong and Collette could not move; in the Bog, `2` (S2) and `5` (W1) the same. A station places the kid for the picture; the walk then refuses every step (ground below `waterY`, a blocker ring, `walkable()` false, or the step limit). The rule (T-47): every station's kid placement is walkable — W held for a second moves the kid ≥ 1 m — or the station's `note` marks it a beat.

## Files you may touch

New probe `scripts/probes/runtime-stations.cjs`. Edits confined to the `place:` function and the station `note` strings of `sandbox/shadow-wrong/main.ts`, `sandbox/bog-night/main.ts`, and any other scene's `main.ts` the probe fails (other builders are editing `creatures.ts`/`props.ts`/`terrain.ts`/`flora.ts` in those folders, and the flight's `main.ts` — leave `flight-golden` alone entirely). One `Edit` per file, `old_string` confined to `place` or to one station line, re-read immediately before.

## The work

1. **The probe** runs from one `sandbox-drive` invocation and `page.goto`s every shared-runtime scene (`desert-noon`, `bog-night`, `frozen-night`, `caves-descent`, `shadow-wrong`, `meadow-golden`, `rim-dawn`; skip `flight-golden`, whose stations are ridden; the Forest has its own runtime — skip and say so) × every station and extra (read `def.stations`/`extras` through `ssKf`/the URL: build the list from each `main.ts`'s `STATIONS` and `extras`), with `&step=1` and `?t=` the scene's default. At each: wait for `ssWorld`, `ssStep(30)`, record the active kid's position, `ssKey('w')`, `ssStep(60)`, record again; then keyup `w` (dispatch it), and repeat once with `s`. Report per station: moved-W metres, moved-S metres, pass (either ≥ 1.0 m) or fail, and the reason where you can read it (`groundY` at the spot vs `waterY`, a blocker within 0.35 + r, `walkable` false). Print the table.
2. **Fix every failing non-beat station** by moving the kid's placement the least distance (≤ 2.5 m) to ground the probe passes, keeping the kid in frame and facing the same subject (check the frame); or, where the station is a picture and not a place (Home Wrong S3 already says so), append to its `note`: "a beat, not a place you stand: the kid is placed for the picture" and leave the placement. Home Wrong S4 and the Bog's S2 and W1 are the ones Andrew named; they must end up walkable, not beats.
3. Re-run the probe; every non-beat station passes.

## Acceptance checks (quote the output)

1. The probe's table before and after (two runs), every row.
2. Frames for each changed placement at its station: `<scene>-<shot>-03` (`ssStep(120)` first, card on, `?t=` explicit), read in one line each: the kid is in frame and the composition is the one the `note` describes.
3. `npm run check` green.

## Shared docs

Append only: `LOG.md` (heading `## Reel fixes round 1 — stations`), `DECISIONS.md`, `LESSONS.md` (a Camera row: a station's placement is probed for walkability, or marked a beat). No new tweak rows.

## Definition of done

Both tables quoted, frames read, docs appended, a report with files and lines. Do not commit.
