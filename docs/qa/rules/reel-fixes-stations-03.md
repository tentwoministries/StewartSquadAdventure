# Rule sheet — stations a kid cannot walk from (`docs/qa/briefs/reel-fixes-stations-03.md`)

Written by `rules-librarian`, 2026-09-08. Row: **T-47**. Tier-1 rows fetched per `DEMO_PROGRAM.md` §1.
**Gap (Working Rule 1):** `camp.md` §2.11.5 is "the four screenshot stations (the fixed contract with the art director)" — seed, clock, camera formula, target/yaw/pitch/d, "What is in frame", Liam's pose. It contains **no walkability clause and no `note` field**; the closest it has is the per-station pose column ("at (−2.4, 0, 1.0) by his log"). So T-47's "or the station's note marks it a beat" has no bible home yet: write the probe against T-47's wording, and do not invent a §2.11.5 sentence — that is the application step's job (P-07).

## 1. Applies

**Never-run rule first.** `LESSONS.md` §0 row 8, "A mechanic is not built until it has been seen to run in a stepped probe, every state reached", and §0 row 9, "The clock stalls on a hidden page: step the runtime, never wait for a screen." Walkability *is* the mechanic here: no station is declared fixed until `scripts/probes/runtime-stations.cjs` has stepped it and printed its metres. LESSONS Process row 5 is the same failure ("the sim ran at about 3 % of real time"): use `ssStep`/`ssKey`, read `ssWorld.hud()`, never the DOM, never a wait.

- **T-47 (`PHASE_0.75_TWEAKS.md`), the task's own row** — "every station's kid placement is walkable — W held for a second moves the kid ≥ 1 m — or the station's note marks it a beat (like Home Wrong S3). The demo gets a probe over every scene × station." Owning file `camp.md` §2.11.5 + every scene's station list. Status `observed` → this fix pass; the ≥ 1 m in one second is the acceptance number, so the probe's `ssStep(60)` must be one second of sim, not 60 unspecified frames.
- **`LESSONS.md` Density and scale row 4 + `STUDY_NOTES.md` §6 rule 7** — "anything placed near the plate's edge asserts `inside()`; a bank is found by marching, not by subtracting a radius", and "keep the water a wall for walking (ground below −0.25 m)". These are the two failure causes the brief asks the probe to name: Home Wrong S4 is on the far bank of the mirror stream, the Bog's S2/W1 are over water; the fix marches to walkable ground, it does not nudge a radius.
- **`LESSONS.md` Camera row 1** — "a follow camera engages on the first movement input, never on load; a station is a reproducible frame until then" (`_shared/walk.ts` `engaged`). Pressing `w` in the probe engages the follow camera, so the after-frames must be taken at a fresh `page.goto` of the station, not after the probe's walk.
- **`LESSONS.md` Camera row 4 + §0 row 5** — "a station is a composition: look through its lens before saving it, and keep its line of sight clear." Moving a placement ≤ 2.5 m re-composes the frame; the brief's acceptance check 2 is this rule.
- **T-30** — "where a station's *note* describes what is in the frame, the note has to be derived from the numbers, not written beside them … checked against a rendered frame." Any `note` you append (the beat wording) or any note invalidated by a moved placement is read off the saved `-03` frame first.
- **T-26 (facing, third time) + `STUDY_NOTES.md` §6 rule 3** — a kid rig faces bearing b with `rotation.y = 180° − b`. Moving a placement changes the bearing to the same subject; re-solve it, and check the close frame rather than the arithmetic.
- **T-41 (selection ring and the curved world)** — the ring is not bent by the world shader and drifts up the body with distance from the curve centre; it is being fixed in `reel-fixes-shared-03.md`. Do **not** read a ring at the knees in your `-03` frames as a placement error, and do not touch `_shared/rig.ts`.
- **`LESSONS.md` §0 row 10 / Process row 3** — a change under `sandbox/_shared/` needs one frame per scene. Your edits are confined to each scene's `main.ts` `place:` and `note` strings, so no shared frame sweep is owed; keep it that way.
- **`LESSONS.md` §0 rows 11–12 + T-29** — `?t=` explicit on every save, frame names lowercase (`readParams()` defaults `t` to `'dusk'`, so a bare URL mis-names the file); patch TypeScript with a `.cjs` script, never an inline `node -e`. Both bear on the probe file and the `-03` frames.
- **`LESSONS.md` Process row 1** — a save before the first rendered frame is a blank canvas at **58,885 bytes**; wait 10–12 s after navigation. Every `-03` frame.
- **`LESSONS.md` Process row 7** — "a trigger on a distance uses `<=` (or the placement sits clearly inside it)": a placement that lands exactly on a `walkable()` boundary passes by luck. Move to ground clearly inside, not to the first metre that reads true.
- **`PRE_BUILD_TODO.md` P-07** — the 0.75 application step re-reads this ledger; anything you cannot fix inside 2.5 m goes into the report as deferred, not left implicit. **P-05 / T-34 / T-55** — the caves' stair joins and the 3.2 m walkable band vs 3.8 m drawn steps are a *known* open defect: a caves station that fails for that reason is reported, not fixed here (it belongs to `reel-fixes-caves-03.md`).

**Open observations (status `observed`, `DEMO_PROGRAM.md` §1 rule 4 — context, not rules):** T-43 (non-indexed rock displacement), T-49 (Bog frogs on real pads), T-51/T-52/T-53 (Frozen drift, seals, ice-fall pool), T-56 (decals on stepped ground — a ring missing on a column top is T-56, not a walkability fail).

## 2. Checks implied

1. The probe table, before and after, every scene × station × extra, with moved-W and moved-S metres to 2 dp and pass/fail at ≥ 1.0 m. (T-47)
2. For every fail, the named cause: `groundY` at the spot vs `waterY`, nearest blocker distance vs `0.35 + r`, or `walkable()` false. (LESSONS Density row 4, §6 rule 7)
3. Skipped scenes stated in the table with the reason: `flight-golden` (stations are ridden, and another builder holds its `main.ts`), `forest-dusk` (its own runtime). (brief "Files you may touch")
4. Each changed placement's move distance quoted, ≤ 2.5 m, and the new bearing to the same subject shown in the frame. (T-47, T-26)
5. `-03` frame per changed placement: lowercase, `?t=` explicit, card on, `ssStep(120)`, saved ≥ 10–12 s after navigation, **not** 58,885 bytes; read in one line against the station's `note`. (Process row 1, §0 rows 11–12, T-29, T-30)
6. Any `note` appended is quoted verbatim, and confirmed written after reading the frame. (T-30)
7. Home Wrong S4 and the Bog's S2 and W1 end the pass **walkable**, not beats — assert this explicitly against the after-table. (brief §2)
8. The probe is a `.cjs` file under `scripts/probes/`, run from one `sandbox-drive` invocation; the `w` keyup is dispatched before the `s` pass so the two do not compound. (§0 row 12, brief §1)
9. `npm run check` green; the diff touches only `place:` and `note` in the named `main.ts` files, nothing under `sandbox/_shared/` and nothing in `flight-golden/`. (§0 row 10)

## 3. Not applicable, considered

- **T-08 / T-13 / T-23** (station pitch, camera range, a tilt-up beat) — this pass changes where the *kid* stands, never the camera; a station's yaw/pitch/d are the art director's contract.
- **T-24 / T-39** (the shard's 12 % floor, the far fill) — settled in the shadow fix pass; re-lighting is out of scope even though Home Wrong is one of the scenes touched.
- **T-16 / T-21** (Bog and district fog) — a station failing to walk is not a fog failure; do not retune the Bog's fog to make a frame readable.
- **T-44 / T-48** (sprint lock, CS-04 look-around) — built in other round-1 briefs; the probe uses plain `w`/`s`, no shift.
- **T-38** (a waterside needs 3–4 m of walkable bank) — the right *layout* rule for the Bog's S2/W1 and the mirror stream, but it is a bible proposal for the application step; here it is the reason a fix works, not a licence to re-site the water.
