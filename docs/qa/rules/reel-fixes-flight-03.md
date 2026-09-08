# Rule sheet — the flight's look-around (`docs/qa/briefs/reel-fixes-flight-03.md`, row T-48)

Written by `rules-librarian`, 2026-09-08. Tier-1 rows fetched per `DEMO_PROGRAM.md` §1.
**Gap (Working Rule 1).** T-48's owning files name "`ui-ux.md` cutscene input", but `ui-ux.md`'s input map carries only one cutscene row — `Cutscene skip | the interact key or Enter (hold 0.8 s for dialogue blocks)` — and `cutscenes.md` §2.6 shoots CS-04 as **eight authored shots** (`hold`, `dolly`, `follow` ×2, `crane`, `hold`, `dolly`), not a chase, with no player camera input of any kind. **There is no bible section for a look during a cutscene.** Build it in the demo as the brief says, leave T-48 `proposed`, edit no design file, and say in your report that the demo's single `flight.chase` is not the bible's CS-04.

## 1. Applies

**Never-run rule first.** `LESSONS.md` §0 rule 8 / `DEMO_PROGRAM.md` §1 Tier 0: "A mechanic is not built until it has been seen to run in a stepped probe, every state reached." The look offset is a mechanic with four states — drag applied, the 2 s hold, the eased return, the `R` reset — so it is done only when a stepped probe has shown all four (brief checks 2–4), never by reading the code.

- **Always · `LESSONS.md` §0 rule 9 + Process row 5** — "The clock stalls on a hidden page: step the runtime, never wait for a screen"; drive with `ssStep`/`ssSnap`/`ssKey` under `?step=1`. Every timing in checks 1–4 (6.0 s, 14.0 s, `ssStep(60)`, `ssStep(120)`) depends on it.
- **Always · `LESSONS.md` §0 rule 3** — "every state change eases over ≥ 0.15 s; nothing pops." The 2 s smoothstep return and the offset's onset are this rule; `R` is the one allowed instant, and it is a reset, not a state ease.
- **Always · `LESSONS.md` §0 rule 10 + brief "Files you may touch"** — a change under `sandbox/_shared/` costs one frame per scene; you may not edit `orbit.ts`. Read `ssOrbit.current` and the orbit's own clamps; add no mouse handler of your own.
- **Always · `LESSONS.md` §0 rules 11–12** — `?t=` explicit on every save, frame names lowercase (`?t=golden`, `flight-golden-{ch,look,return}-03`); patch TypeScript with a `.cjs` file, never an inline `node -e` with backticks.
- **`LESSONS.md` Process row 1** — a save before the first rendered frame is a blank canvas (58,885 bytes); wait 10–12 s after navigation. The brief's "wait 12 s" is this row.
- **`LESSONS.md` Camera row 1 (`_shared/walk.ts` `engaged`)** — "a follow camera engages on the first movement input, never on load; a station is a reproducible frame until then." This is exactly the brief's "no drag, no change": the ride is a reproducible frame until a drag, which is what check 1's md5 pair proves.
- **`LESSONS.md` Camera row 6** — "sample a spline by arc length against a speed schedule; parametric `getPoint` steps at every waypoint" (`flight-golden/schedule.ts`). Do not touch `schedule.ts`; the scene times 6.0 s and 14.0 s are arc-length positions, and any edit there breaks check 1 silently.
- **`LESSONS.md` Misc row 1** — "hide world-space UI for the duration of a cutscene" (the rings on the fuselage, fixed in `flight-golden/`). A 60° yaw look swings the camera to angles the ride never framed; confirm no ring or world-space gizmo reappears there.
- **T-27 (`PHASE_0.75_TWEAKS.md`)** — "the curve's centre is a *camera* property … re-centred on whatever the camera is following, every frame"; a `uCurveCenter` set once sank the plane, Ed and all four kids out of the chase frame. The look moves the camera without changing what it follows: the centre must still track the plane, not the new camera pose.
- **T-23** — `_shared/orbit.ts`'s drag clamp is `18–75°` (T-23 proposes `min(18, station.pitch)`–75 for tilt-up stations). The brief's pitch clamp check quotes 75 as the max: read the clamp from `orbit.ts`, quote it, and do not change it in this pass.
- **T-28** — CS-04's cockpit: the kids seat 0.84 m across and 0.72 m along with the rim cropping them at the waist, and carried props are **stowed** in flight (Collette's 1.7 m staff otherwise stands through the top wing). The look frame is the first thing that sees the bench from off-axis, so the look PNG is also T-28's evidence.
- **T-37 (`story-dependent`)** — §2.10 gives CS-04 "14–18 s" and §2.2 "one circuit of the island"; the demo's honest circuit is **28.5 s**. Not yours to re-decide; it is why the brief's frames sit at 6.0 s and 14.0 s inside the ride.
- **`story-beats.md` §2.10 CS-04 + `cutscenes.md` §2.6 skip** — "Skippable after first per island"; a skip jumps to shot 7's start, on Space / Enter / pad A / tap. The look's mouse handling must not swallow or re-bind the skip input.
- **`npcs.md` §2.3.7** — the kids' in-flight behaviour is **animation only**, no new lines; the look must not make a kid react to the camera.
- **`PRE_BUILD_TODO.md` P-07** — the 0.75 application step waits on "Andrew's pass on the reel", so anything you defer here is written down as a row or a report line, not left implicit.

**Open observations (status `observed`, `DEMO_PROGRAM.md` §1 rule 4; not rules here):** T-41 (rings and ribbons not bent by the curved world) — the same shader family as T-27 but owned by `reel-fixes-shared-03.md`; T-42, T-45, T-47, T-49–T-56 — other briefs' scenes.

## 2. Checks implied

1. Stepped probe of all four states, frames saved: offset applied (`flight-golden-look-03`), the 2 s hold (`ssStep(60)`, offset ≥ 55°), the eased return (`ssStep(120)`, offset < 1°, `flight-golden-return-03`), `ssKey('r')` reset (< 1°). (never-run rule, §0 rule 3)
2. The no-drag ride byte-identical: `flight-golden-ch-03` at 6.0 s and 14.0 s saved **before** the edit and after, md5 compared; name any card clock text that legitimately differs. (Camera row 1, Camera row 6)
3. The return is a smoothstep, not a step: sample the offset at three points inside the 2 s ease and quote them — monotonic, no segment > half the total in one frame. (§0 rule 3)
4. Pitch clamp: `current.pitch = 80` → applied offset clamped; quote the clamp read from `orbit.ts` (expected max 75) and confirm `git diff` shows `_shared/` untouched. (T-23, §0 rule 10)
5. Curve centre at the look frame: read `uCurveCenter` (or the scene's HUD) at 60° yaw and confirm it is the plane's position, and that the kids and the plane are not vertically separated in `flight-golden-look-03`. (T-27)
6. Read `flight-golden-look-03` for the cockpit: four kids readable as four, no staff or hammer through a wing, no selection ring on the fuselage. (T-28, Misc row 1)
7. Every frame lowercase, `-03`, `?t=golden` explicit, saved ≥ 12 s after navigation; none is 58,885 bytes. (§0 rules 11, Process row 1)
8. Skip input intact: `ssKey` the skip binding during a drag and confirm it still registers. (`cutscenes.md` §2.6)
9. `flight.test.ts` (9 tests) green untouched, `npm run check` green; `LOG.md` and `DECISIONS.md` appended once each, re-read first. (brief §Shared docs, Working Rule 7)

## 3. Not applicable, considered

- **T-06 / T-09 / T-22** (tempo numbers, scatter density, litter colour) — no scatter, no ground and no new recurring motion in this change; §0 rule 3's ease is the only part of T-06 that bears.
- **T-24 / T-25 / T-39** (the shard's floor, the one warm light) — a different scene and a locked sky clock; the flight is golden hour.
- **T-30** (a station's `note` derived from the render) — this pass adds no station; `LD` is unchanged by the brief's own words.
- **T-35 / T-36** (hit-stop's clock, the ribbon sweep) — no stop and no combat in the flight; `simT` is already in `_shared/scene.ts` and untouched here.
- **T-13 / T-44** (gameplay pitch range, the sprint lock) — walk and gameplay-camera rows; the ride has neither.
