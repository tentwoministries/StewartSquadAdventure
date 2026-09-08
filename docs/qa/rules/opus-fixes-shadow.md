# Rule sheet — Home, Wrong, the fix pass (`docs/qa/briefs/opus-fixes-shadow.md`)

Written by `rules-librarian`, 2026-09-08. Tier-1 rows fetched per `DEMO_PROGRAM.md` §1.
**Gap (Working Rule 1):** `LESSONS.md` has **no §0**; the always-tier is created by the parallel §6 ledger task (`OPUS_FIX_PLAN.md` §6). The always-tier below is quoted from `DEMO_PROGRAM.md` §1 Tier 0 instead — say so in your report if the two disagree.

## 1. Applies

**Never-run rule first.** `DEMO_PROGRAM.md` §1 Tier 0: "a mechanic is not built until it has been seen to run", and §6 row "a keyed mechanic is not done until a stepped probe has shown every state reached". Both fixes 1 and 2 (the deer dissolve, the swing) are mechanics: they are done only when a stepped filmstrip shows every state, not when the code reads right.

- **Always · `DEMO_PROGRAM.md` §1 Tier 0 + `OPUS_FIX_PLAN.md` §2, §6** — a hidden pane and a background tab stall the clock; step with `ssStep`/`ssSnap`/`ssKey` under `?step=1`, never wait for a screen. Every probe in this task depends on it.
- **Always · `LESSONS.md` Process row 1** — a save before the first rendered frame is a blank canvas (58,885 bytes); wait 10–12 s after navigation. Applies to every `-02` frame in §4.
- **Always · `LESSONS.md` Process row 2** — patch TypeScript with a `.cjs` script file, never an inline `node -e` with backticks. Applies to any scripted edit of `creatures.ts` / `props.ts`.
- **Always · `LESSONS.md` Process row 3 + brief "Files you may touch"** — a change under `sandbox/_shared/` needs one frame per scene; you may not edit it here. Thin the imported Forest tufts on the *instances* inside `sandbox/shadow-wrong/`, never in `sandbox/forest-dusk/`.
- **Always · `OPUS_FIX_PLAN.md` §4 / T-29** — frame names lowercase with the `-02` suffix and `?t=wrong` explicit on every save; the runtime's `defaultTime` fix is no excuse to drop it (T-29: dusk-listing scenes opened at dusk and every frame was mis-named).
- **T-24 (`PHASE_0.75_TWEAKS.md`), the floor** — "no surface renders below about 12 % luminance", and the anti-palette's fourth row forbids pure-black shadows. Governs fixes 2 and 3 (the swing station, S3's rim). `OPUS_EXPERIMENT_VERDICT.md` §5 **parks T-24's numeric column** (key 0.95, hemi 0.8, fog 26/74) — "keep the floor rule, retune the values on the fixed scene": the numbers are yours to tune, the floor is not.
- **T-25** — the −37° sightline is occluded by the shard's own rim skirt; nothing may sit on that bearing (void clouds and tree scatter both did). §5 **parks the "11 m up, 13 m back" numbers**; keep the exclusion corridor. Fix 3.
- **`dungeons.md` §2.6.6 + `story-beats.md` §2.2 (canon)** — the far warm light is Ed's real camp fire: directional fill `#FF9A3C` intensity **0.03 (4 % of the locked key's 0.7)**, azimuth 180°, elevation −37°, no shadows; billboard 40 × 12 m, alpha 0.35, on the campfire oscillator 7–9 Hz ±12 %; "What it must never do: light the ground, cast a shadow, take a pool slot, or go out." Fix 6 is exactly this row: 0.13 is 14 %, so either 0.03/4 % or a logged T-24-addendum row after T-34. Lighting S3's rim (fix 3) must not make the far light something you can see by.
- **`world-events-weather.md` §2.1.4 `shadow.wrongDusk`** — the sky clock is **locked** (one keyframe, 40 s breathing: fog ±15 %, rift light ±25 %); key `#5A3A8A` 0.7 at elevation 12° / azimuth 300°, fog `#1E1030` 18/44 height falloff 6 m, black moon with ember rim, mirrored constellations, cyan lobes, exposure 0.9. Any retune stays inside this row's identity; do not introduce a second time of day.
- **T-06 + `MOTION_TEMPO_NOTES.md` ease rule** — "every value that changes state eases over ≥ 0.15 s; nothing pops"; recurring motion on two incommensurate rates. Fix 1 is this rule (`deer.visible = false` is the pop); the swing's ±25° / 3.1 s is a tempo number, so ease it, do not step it.
- **T-09 + `LESSONS.md` Density rows** — scatter is sparse and clustered (~1.2 tufts/m² core, none inside the fire pool) and stays within a step of the ground's own colour. Fix 5; the scores file counts this as a re-made defect in four of five scenes.
- **`LESSONS.md` Camera row 4** — after placing a landmark, look through every station that faces it; keep an exclusion radius round the station's subject. Fix 4's lollipop tree standing on the camera, and Collette's back in the near foreground.
- **`LESSONS.md` Camera row 3 / T-16 generalised** — darkness and fog are judged at *every* station, not only the hero one (`scores` §2: this is why `s3` shipped 85 % black). Fixes 2, 3, 4.
- **T-08 / T-23** — a station needs something tall or a figure for scale in frame. The brief's fix 2 asks for "a kid in the frame for scale"; that is this row.
- **T-26 (facing, third time)** — a kid rig's front is local +z: `rotation.y = 180° − bearing`; a +x-built mesh takes `90° − bearing`. Moving Collette out of S4's foreground re-poses a rig; check the frame, not the guess.
- **T-30** — a station's `note` must be derived from the render, not written beside the numbers. Fix 3 adds a `note` to S3 ("a beat, not a station"); read the saved frame before writing it.
- **`LESSONS.md` Light row 8 / T-10** — large emissive faces ≤ 0.5 gain; only small quads at 1.6+. Bears on the dissolve's rim shell and on whatever lights S3's rim.
- **`LESSONS.md` Light row 6** — keep a scene under about twenty point lights; emissive-only props take cd 0. Lighting two extra station rims must not add lights casually.
- **`PRE_BUILD_TODO.md` P-02** — this task is P-02; P-04 (demo candidates) waits on it, so anything deferred is written down, not left implicit.

**Open observations (not rules; status `observed`, `DEMO_PROGRAM.md` §1 rule 4):** T-34 (the caves' stairs and the kids clipping into rock) — a to-do on another scene, no constraint here.

## 2. Checks implied

1. Deer dissolve: stepped filmstrip `shadow-wrong-dissolve-{0..4}-02` at +0.0/0.4/0.8/1.2/1.6 s (`ssStep(24)` between) — deer present and smaller/fainter at +0.4 and +0.8, gone by +1.6, motes still rising. (never-run rule, T-06 ease)
2. Swing pair: two `ssSnap` 0.5 s apart (`ssStep(30)`) — seat displaced by a stated pixel count. (never-run rule, T-06)
3. Luminance probe on both swing frames and on `shadow-wrong-s3-02`: no region below 12 % luminance over more than a tenth of the frame; `ls node_modules` first for `sharp`/`pngjs`, else read the PNG and judge. (T-24 floor, anti-palette)
4. Far-fire fill: grep the value in the scene source and state it as a fraction of the key — 4 % (0.03 against 0.7) or a T-24 addendum row appended after T-34 with the reason. (`dungeons.md` §2.6.6)
5. S3 sightline: after re-lighting, confirm from the frame that nothing sits on the 180° / −37° bearing and that the ground is still not lit by the far light. (T-25, §2.6.6 "never light the ground")
6. Scatter: report the tuft count/density before and after inside this folder only; confirm `sandbox/forest-dusk/` is untouched in the diff. (T-09, scene-folder rule)
7. S4 frame read: no prop within the camera's exclusion radius, no hero back in the near foreground, the trench rim and water direction legible. (Camera row 4)
8. Every §4 frame lowercase, `-02`, carrying the card and `?t=wrong`, saved ≥ 12 s after navigation and `ssStep(120)` at the station; confirm none is 58,885 bytes. (Process rows, T-29)
9. `npm run check` green; `tsc --noEmit` silent for `sandbox/shadow-wrong/`; `LOG.md` rows from iteration 7; a `DECISIONS.md` line per decision the brief left open.

## 3. Not applicable, considered

- **T-27** (curve centre follows the camera) — this scene has no travelling camera; a Phase 1 render-spec row.
- **T-31** (hit-stop's reach) and **T-28** (the cockpit) — no combat and no seated bench here; they belong to the meadow and flight tasks.
- **T-32 / T-33** (the rock spout, dawn backlighting) — west-rim geometry and the dawn keyframe; the shard's sky clock is locked, so dawn cannot occur.
- **T-17 / T-21** (aurora altitude, district-scale fog) — no sky curtains and no wide/landmark station in this pass; if a re-shoot widens a station, T-21's second fog pair comes back into play.
- **T-20** (hemisphere as fill at a third of the key) — Tier 0 states the principle; the numeric swap is parked to the application step and this pass is a fix, not a relight.
