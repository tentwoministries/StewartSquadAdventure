# Rule sheet — the torn rocks (`docs/qa/briefs/reel-fixes-rocks-03.md`, row T-43)

Written by `rules-librarian`, 2026-09-08. Tier-1 rows fetched per `DEMO_PROGRAM.md` §1. `LESSONS.md` §0 now exists (the twelve Tier-0 invariants) and is quoted below.

## 1. Applies

**Never-run rule first.** `LESSONS.md` §0 rule 8: "A mechanic is not built until it has been seen to run in a stepped probe, every state reached." A rock is geometry, not a mechanic, so no probe is owed for the rock itself — but rule 9 ("The clock stalls on a hidden page: step the runtime, never wait for a screen") still governs every frame in check 2, which is why the brief writes `ssStep(120)` before the camp boulders' save.

- **The task's own row · T-43 (`PHASE_0.75_TWEAKS.md`), status `observed`** — "`IcosahedronGeometry` is **non-indexed** in three r185 (verified: detail 1 has 240 vertices, three per face), so displacing vertices by index tears every shared corner … Rule: displace per **unique position** (a shared helper), and a rock is checked as a closed surface — every edge shared by exactly two faces." This pass is what turns it into a ledger row (`DEMO_PROGRAM.md` §1 rule 4); until the frames are read it stays `observed`.
- **Always · `LESSONS.md` §0 rule 10 + Process row 3** — "a change to `sandbox/_shared/` is checked with one frame per scene (five); a scene-local change needs only its own." `sandbox/_shared/rock.ts` is new shared code, so the brief's check 3 (nine default stations, one `<scene>-rocks-03` per scene) is this rule, not optional.
- **Always · `LESSONS.md` §0 rule 12 + Process row 2** — "patch TypeScript with a `.cjs` script file, never an inline string with backticks." Four scene files are edited; the caves edit must be a single `Edit` with a loop-confined `old_string` because another builder holds the same file (brief, "Files you may touch").
- **Always · `LESSONS.md` §0 rule 11 + T-29** — `?t=` explicit on every save, frame names lowercase. `readParams()` defaults `t` to `'dusk'`, so `frozen-night-rocks-03` and `shadow-wrong-rocks-03` are mis-named unless `?t=night` / `?t=wrong` is passed, as the brief's URLs already do.
- **Always · `LESSONS.md` Process row 1** — "a save before the first rendered frame is a blank canvas"; wait 10–12 s after navigation, and a blank save is **58,885 bytes** (`STUDY_NOTES.md` §6 rule 8). Every `-03` frame.
- **`LESSONS.md` §0 rule 3 (flat colour, one value per face) via `STUDY_NOTES.md` §1 habit 3** — "Clean facets, flat colour, one value per face … Variation comes from *props*, not from shading." The fix must keep the geometry non-indexed and flat-shaded: welding the rock into an indexed, smooth-normalled ball would be a bigger defect than the seams.
- **`camp.md` §2.2 row 21, Boulders** — "(−9.2, 3.0) 1.3 m; (−8.4, 4.1) 0.8 m | low-poly, **12 facets**, moss on the north faces … `camp.stone`, moss `forest.moss` … two grey lumps with green caps." The Forest's two boulders keep their positions, their facet budget and their moss colour rule; §2.3.2 fixes the stream rocks at (14, 15.5), (3, 13.2), (−4, 17.5), (−9, 13.4), (−15, 18.3), (−24, 21) — "foam wakes, sittable", so the displaced surface must stay a solid a kid could sit on.
- **`camp.md` §2.4 (scatter) + T-09** — pebbles are `camp.stone` / `.warm` 50:50 with "value ±10 %, scale 0.6–1.6, 30 % half-buried"; ground scatter stays "within a step of the ground's own colour". The helper changes the `rng` draw order, so confirm the pebbles and rocks did not drift off their colour rule.
- **`STUDY_NOTES.md` §6 rule 7 (Terrain)** — "a 0.5 m grid with per-face 4 % value jitter"; the caves' shell jitter (±4 % / ±2.5 %) is the same idea and must survive the fix at its stated amounts.
- **`STUDY_NOTES.md` §6 rule 9** — "One `LOG.md` row per iteration, a tweak row per decision"; the brief's shared-docs list (LOG, DECISIONS, LESSONS) is this rule, append-only, re-read first.
- **`PRE_BUILD_TODO.md` P-04 / P-07** — the demo-candidates set and the 0.75 application step both read this ledger, so anything deferred here is written down, not left implicit.

**Open observations (not rules; status `observed`, `DEMO_PROGRAM.md` §1 rule 4):** **T-55** and **T-34** (the caves' stair joins, columns under the stair band, kids clipping into rock) — the parallel edit in `caves-descent/terrain.ts`; do not fix them here, just do not collide with them. **T-56** (decals on stepped ground) and **T-41** (the ring and the curve) — other rounds. **T-53** (a sheet of water lies in a basin) — the stream rocks sit in water but no basin work is owed here.

## 2. Checks implied

1. Closed surfaces: `tests/unit/sandbox/rock.test.ts` asserts every undirected edge (quantised positions, 1e-4) is shared by **exactly two** faces, before and after displacement, for all four recipes at their own amounts (0.85–1.15 / 0.7–0.9, 0.9–1.1, 0.85–1.15 / 0.65–0.85, ±4 % / ±2.5 %) plus the detail-3 shell. (T-43)
2. Defect reproduced: the same icosahedron displaced *by index* reports **> 0** open edges in the same test, so the fix is proved against the bug. (T-43)
3. Flat shading kept: assert the geometry is still non-indexed (`geo.index === null`) and vertex count unchanged (detail 1 = **240**) after the helper. (§0 rule 3, STUDY_NOTES §1.3)
4. Frames read, no light through any rock: `forest-dusk-rocks-03`, `shadow-wrong-rocks-03` (`?shot=S1&t=wrong&step=1`, `ssStep(120)`), `frozen-night-rocks-03` (`?shot=S1&t=night&step=1`), `caves-descent-shell-03` (`?shot=W1&step=1`); an `ssOrbit` study framing where a rock is small in frame. (T-43, §0 rule 9)
5. `_shared/` gate: the nine default stations plus one `<scene>-rocks-03` per scene, each read in one line. (§0 rule 10)
6. Naming and non-blank: every frame lowercase with the `-03` suffix and an explicit `?t=`, saved ≥ 10–12 s after navigation, none 58,885 bytes. (§0 rule 11, T-29, Process row 1)
7. Positions and colours held: diff shows no rock position, count or colour rule changed beyond the forced `rng` draw order; the Hearth's snow caps by normal and the Forest's moss still apply. (`camp.md` §2.2 row 21, §2.3.2)
8. One `Edit` in `caves-descent/terrain.ts`, `old_string` inside the `for (let i = 0; i < dp.count; i += 3)` loop, file re-read immediately first; no column or stair line touched. (T-55/T-34 parallel work)
9. `npm run check` green with the new test, suite count stated; `LOG.md`, `DECISIONS.md`, `LESSONS.md` appended once each, re-read first. (STUDY_NOTES §6 rule 9)

## 3. Not applicable, considered

- **T-24 / T-39** (the shard's 12 % luminance floor and the far fill) — Home, Wrong is only touched through the *imported* Forest rocks; no light or paint value changes here, so no luminance probe is owed.
- **T-06 / T-35** (the ease rule, hit-stop holds the sim clock) — rocks do not move; nothing in this pass changes state over time.
- **T-08 / T-23 / T-30** (station pitch, the tilt-up beat, a station's note) — the brief re-uses existing stations and adds `ssOrbit` study framings only; no station contract is edited.
- **T-27 / T-41** (the curved world's centre, things that must bend with it) — rocks are on `makeWorldMaterial` already and the scenes are static-camera; the shared-file round covers T-41.
- **T-09 / T-22** (scatter density, leaf colour) — quoted above only as the guard that the changed `rng` order did not disturb them; no density retune is in scope.
