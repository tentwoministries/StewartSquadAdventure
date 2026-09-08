# Rule sheet — the west rim at dawn, fix pass (`docs/qa/briefs/opus-fixes-rim.md`)

Written 2026-09-08 by `rules-librarian`. Tier 1 sheet per `DEMO_PROGRAM.md` §1.

**Never-run mechanic, first:** the songbird burst has never fired (`OPUS_EXPERIMENT_VERDICT.md` §3.5: "the songbirds never fire at load: Liam stands exactly 5.00 m from the birch and the trigger is `< 5`"). `OPUS_FIX_PLAN.md` §6 makes this a ledger rule: "a keyed mechanic is not done until a stepped probe has shown every state reached". Fix *and* probe it; the same applies to the fox route and the bobber dip.

**Note on a bible section (Working Rule 1):** the brief cites "the dawn row of §2.1.4", but `world-events-weather.md` §2.1.4 carries only Desert/Bog/Frozen/Shadow tables. The **Forest dawn row is in the §2.1.3 master table** (`| dawn | #FFB48C · 1.6 | #6E7FB8 · #2E5A3A · 0.55 | #7A76B0 · 22/65 | ...`). Use that row; do not invent a Forest row in §2.1.4.

## Applies

- **Tier 0 always (`DEMO_PROGRAM.md` §1)** — anti-palette never ships; one clean key with the hemisphere as fill; nothing pops (every state change eases ≥ 0.15 s, recurring motion on two incommensurate rates); facing conventions; a station is a composition, check its line of sight; scatter within a step of the ground; large emissives ≤ 0.5 gain; ~20 point lights; density from props; curve centre follows the camera; a mechanic is not built until seen to run. All bear: this pass touches light (the tongue), motion (birds, fox, bobber) and three stations.
- **Always · hidden-pane stall / stepping harness** (`STUDY_NOTES.md` §6 rule 8: "a hidden browser pane gets no animation frames, so verify motion from the console with a fixed `dt`"; `VERDICT` §4 item 1, `OPUS_FIX_PLAN.md` §2) — every check here is stepped with `ssStep`/`?step=1`, never watched.
- **Always · placement near an edge** (`OPUS_FIX_PLAN.md` §6, Density and scale: "anything placed near the plate's edge asserts `inside()`; a bank is found by marching, not by subtracting a radius") — the deer at (−49.5, −28.5), Liam, the fox's route ends, `findLip()`.
- **Always · the water wall** (`STUDY_NOTES.md` §6 rule 7: "Keep the water a wall for walking (ground below −0.25 m)") — S1 shows Liam apparently standing on the water sheet.
- **Always · `?t=` explicit** (T-29; `VERDICT` §5: adopt) — every save passes `?t=dawn` or is mis-named.
- **Always · lowercase frame names, the card, two rendered frames** (`LESSONS.md` Process: "a saved frame was a blank canvas … wait for two rendered frames … wait 10–12 s after navigation").
- **Always · the `.cjs` patch recipe** (`LESSONS.md` Process: "patch TypeScript with a `.cjs` script file, never an inline string with backticks").
- **Always · no edits outside the scene folder** (`LESSONS.md` Process: "a change to `sandbox/_shared/` is checked with one frame per scene (five)") — brief limits you to `sandbox/rim-dawn/`; you may *set* a water uniform, not edit `_shared/water.ts`.
- **Always · facing** (`LESSONS.md` Rigs; T-26; `STUDY_NOTES.md` §6 rule 3) — deer and fox are built along **+x**: `rotation.y = 90° − bearing`; Liam (+z rig) `180° − bearing`; wrap accumulating headings to [−π, π].
- **T-32 (`PHASE_0.75_TWEAKS.md`, `camp.md` §2.3.2)** — the stream "leaves at the west-rim waterfall"; the spec is a tapering rock tongue ~7 m wide with moss along its edges, the fall leaving its tip, the plunge pool a shelf in the void. The tongue exists as a machined hex block: this row is the acceptance shape for fix 5.
- **T-33 (`world-events-weather.md` §2.1.3 dawn row)** — the dawn key is azimuth 100 (rising east), so every west-rim station looks into it; "a west-side scene at dawn uses the fill, not the key, to carry the ground". Governs S1/W1: keep, do not show, and say so in the station `note`.
- **T-16 (Bog fog) + the fog rule** (`world-events-weather.md` §5.3: fog is "camera-relative and do not scale with the island", far capped at 100 m; T-21 asks for a second pair at wide stations) — W1's violet mass is T-16's failure in another biome; retune W1's pair or mark the station study-only.
- **T-30 (`camp.md` §2.11.5 pattern)** — a station's note must be derived from the render, not written beside the numbers; applies to the S1/W1 notes you write.
- **T-14 / `PHASE_0.75_ANIMALS_BRAINSTORM.md` §3 Forest** — the fox: "trots the forest edge with the nose down; sits and watches the fire"; songbirds: "the 3-bird burst"; the deer's demo tempo is 0.55 m/s in a small patch with ear flicks every 2.5–5.5 s (not the bible's 1.0 m/s). Keeps the fox's 0.9 m/s route and 3 s pauses as authored, and the bird burst as three birds.
- **T-06 / `MOTION_TEMPO_NOTES.md`** — "every value that changes state eases over ≥ 0.15 s; nothing pops"; the bird burst, the bobber's dip (every 6–9 s) and the fox's pauses ease in and out.
- **`LESSONS.md` Light: the waterfall** — "water ribbons are translucent (alpha ≤ 0.35 after edges) and coloured toward the sky, with the mist and spray doing the rest"; keep the fall translucent and the mist while reshaping the tongue.
- **`LESSONS.md` Camera: shadow box / follow** — the key's target and shadow box follow the walked hero; the follow camera engages on the first input, never on load (stations must be reproducible for the re-shoots).
- **`LESSONS.md` Density: T-09 confetti** — the Forest scatter is imported into this scene as it falls; do not thicken it, and keep any new moss lumps within a step of the rock's colour.
- **`PRE_BUILD_TODO.md` P-02** — this task *is* P-02's west-rim item; P-04 (demo candidates) depends on it, so the frames must be readable and the deferrals logged.

**Open observations (status `observed`, not rules):** T-34 (the caves' stairs and the kids clipping into rock) — different scene, listed only so the auditor sees it was weighed; `DEMO_PROGRAM.md` §1 rule 4: "only `fixed` rows are rules".

## Checks implied

1. `ssWorld.inside(x, z)` true at the deer's feet, Liam's feet and both fox route ends (edge-placement rule) — quote positions and results.
2. `bankPoint()` and `findLip()` are pure (no renderer import) and unit-testable; `findLip()` returns a point with `inside()` true, within 1 m of the water sheet's end (T-32; the tests task imports them).
3. Stepped probe: `?shot=S4&t=dawn&step=1`, `ssStep(60)` — at least one bird airborne within 1 s of load (never-run rule).
4. Stepped probe over 20 s: fox route parameter at 0.9 m/s, 3 s pause at each end; no heading wrap-around jump (facing rule).
5. Ease probe: the burst's and bobber's state changes take ≥ 0.15 s across a two-frame pair (T-06).
6. S1: Liam's feet against the walk's water wall (ground below −0.25 m is not walkable) — quote the ground value under him.
7. Read each re-shot frame: `s3` says what the deer stands on; `s2` says whether the tongue still reads as a machined block (T-32); `w1` says whether the island is one violet mass (T-16) or the station is marked study-only.
8. Every save uses `?t=dawn` and a lowercase `-02` name with the card, after `ssStep(120)`; no frame is 58,885 bytes (blank).
9. `npm run check` green; `LOG.md` one row per fix; a deferred line for the bobber ripple if `_shared/water.ts` exposes no centre uniform.

## Not applicable, considered

- **T-27** (curve centre follows the camera): this scene has no travelling camera; set `uCurveCenter` once from the station target as the other static scenes do.
- **T-31** (hit-stop's reach) and the `look` hook: the brief says this task needs neither.
- **T-20 / T-21** (key–hemi pair, district-scale fog): the pair matters, but retuning the dawn column is Fable's composition call; only W1's fog is in scope, via T-16.
- **T-08 / T-13** (station pitch, gameplay pitch range): the stations here are authored in `OPUS_EXPERIMENT_BRIEF.md` §3.5 and are not being re-aimed in this pass.
- **T-17 / T-23** (aurora altitude, a tilt-up beat): no sky furniture or canopy beat in this scene.
