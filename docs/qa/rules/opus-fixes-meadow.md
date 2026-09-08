# Rule sheet — the Crash Meadow beat, the fix pass (`docs/qa/briefs/opus-fixes-meadow.md`)

**First, the never-run rule.** The task's core mechanic (the goblin state machine) is exactly what `OPUS_FIX_PLAN.md` §6 makes a ledger row: "a keyed mechanic is not done until a stepped probe has shown every state reached; the goblins never attacked", and its sibling "a brake that eases to zero at the trigger distance never crosses it; brake past the line or trigger before it". Nothing in this scene counts as done on a still frame. **Missing input, flagged (Working Rule 1):** `LESSONS.md` has **no §0** yet — the always-tier section is written by §6 of this same session and does not exist on disk at the time of writing; the always-tier rules below are quoted from `DEMO_PROGRAM.md` §1 Tier 0 and `OPUS_FIX_PLAN.md` §6 instead of from the ledger.

## Applies

- **Always (`DEMO_PROGRAM.md` §1 Tier 0):** the hidden-pane stall — a hidden pane or background tab gets no animation frames, step with `ssStep`, read `ssWorld.hud()` not the DOM; every probe in the brief runs this way.
- **Always (Tier 0):** a mechanic is not built until it has been seen to run — the goblin probe, the ribbon pair and the shatter pair are the seeing.
- **Always (Tier 0, `MOTION_TEMPO_NOTES.md` ease rule):** nothing pops; every state change eases over ≥ 0.15 s, every recurring motion on two incommensurate rates. Directly governs fix 4 (the ribbon) and the shard fade.
- **Always (Tier 0, `LESSONS.md` Rigs row; `STUDY_NOTES.md` §6.3; T-26):** a kid rig faces `rotation.y = 180° − bearing`, a +x-built creature `90° − bearing` — the goblin stand-ins and Isabella's CU (`facing 150`, camera yaw 330) both depend on it.
- **Always (`STUDY_NOTES.md` §6.8; T-29):** `?t=` passed explicitly on every save, lowercase frame names (`ssSnap` posts a lowercase name) — every `-02` frame in check 5.
- **Always (`LESSONS.md` Process row):** patch TypeScript with a `.cjs` script file, never an inline `node -e` with backticks.
- **Always (`LESSONS.md` Process row; `OPUS_FIX_PLAN.md` §3 standing rule):** a change under `sandbox/_shared/` is checked with one frame per scene — `kid-isabella.ts` forces the four Isabella frames of check 5.
- **`LESSONS.md` Process row (blank saves):** wait for two rendered frames; 10–12 s after a navigation — the brief's "wait 12 s".
- **T-09 (`camp.md` §2.4)** grass ≈ 1.2 tufts/m² in clusters, flowers only in drifts, pebbles 0.3/m² — fix 2, `main.ts:70`, the confetti the scores file counts in every wide frame.
- **T-22 (`camp.md` §2.4, `pt.leaf`)** ground litter in four olive-browns `#5E5A2A` `#6E5326` `#4A5A2A` `#7A6A3A` with `#B03828` at ~8 % — fix 2's litter colours; T-22 was found in scene 1 and re-made here.
- **`LESSONS.md` Density row:** ground scatter is within a step of the ground's own colour — the red/orange/blue flecks in `main.ts`'s scatter.
- **T-30 (`camp.md` §2.11.5 by pattern)** a station's *note* is derived from the render, not written beside the numbers — fix 6, the S1 note; `camp.md` §2.11.5's own "What is in frame" column is the pattern to imitate, and its camera formula (`target − d·cos(pitch)·(sin yaw, 0, −cos yaw) + (0, d·sin pitch, 0)`) is what the scores file used to prove the mirror.
- **T-31 (`heroes.md` §2.5.7)** hit-stop stops the sim `dt`, the camera and every world system, *not* the effect that caused it (the ribbon) nor its debris (the shards) — fix 5, via `ctx.stop()` / `ctx.stopDt` from the runtime task.
- **`heroes.md` §2.5.7 (the number):** hit-stop sites are fixed — Ground Pound impact **0.06**, a third-hit finisher on connect **0.04**; "nothing else may add hit-stop without a §6 line". The whirl connect is not a listed site, so the 0.04 finisher value is the defensible pick and the Ground Pound takes 0.06; log the choice.
- **`heroes.md` §2.5.4 / §2.5.5 (Isabella):** the whirl is an instant 360° at 0.10 s into a 0.40 s clip, reach **1.9 m**, ruby ribbon ring 0.3 m tall at 1.9 m for **0.25 s**; Ground Pound impact at 0.30 s of a 0.35 s hop, ring decal grows over 0.15 s, `screenShake(4, 0.15)`. The eased ribbon must still be a 0.25 s ring at 1.9 m, not a longer one.
- **`enemies.md` §2.4 melee row + roster row 1:** Goblin windup **0.35 s** (runt), cone half-angle 70°, cone length `max(rng, 1.0 m)`, spd 85 px/s = 2.125 m/s, hit radius 0.25 m, `0.2 s skid to stop` — the states fix 1 must reach, and the reason the brake exists at all.
- **`enemies.md` §2.5 shatter:** `ceil(8·mul)` shards, 2.0–5.5 m/s, life **0.5 s**, gravity **3.75 m/s²**, drag — fix 3's flatter fan, faster shrink and "below 0.5 m by +0.8 s" should be reached by moving toward these numbers rather than inventing new ones.
- **`LESSONS.md` Camera row (line of sight):** after placing a landmark, look through every station that faces it; keep an exclusion radius round station subjects — fix 7, the cart's lantern reading as a skull inside Noah's cage at S2.
- **`LESSONS.md` Light row / T-10:** large emissive faces ≤ 0.5 gain, only small quads at 1.6+ — the goblins' cone telegraph and the gold ring are on the bloom layer; `OPUS_FIX_PLAN.md` §6 restates it ("a telegraph seam is a small emissive").
- **T-08 / scores §4 change 3:** the hero station needs a tall thing in frame; S1 at pitch 40 has none, `L1` at pitch 32 d 26 exists. Applies to fix 7's re-shoot list (scores §4 changes 1–8 are the checklist).
- **`STUDY_NOTES.md` §6.10:** don't build the game — no sim, no HP model; if a fix wants more than a scene, log it `needs-render`/deferred (the totem in fix 6).
- **`PRE_BUILD_TODO.md` P-02:** this task *is* the pre-build item; its outputs feed P-04 and P-07, so every decision needs a `DECISIONS.md` line and a `LOG.md` row.

**Open observations (status `observed`, not rules):** T-34 / P-05 (the caves' stairs and the kids clipping into rock) — a different scene, listed only so it is not mistaken for a constraint here (`DEMO_PROGRAM.md` §1 rule 4: only `fixed` rows are rules).

## Checks implied

- Goblin probe on `?shot=S1&t=golden&step=1&beat=1`: step 60 frames at a time for 16 s, log `{state, d}` per goblin each second; `windup` **and** `hit` reached within 10 s of contact, ring flash fired. Quote the whole log. (never-run rule, brake rule, `enemies.md` §2.4)
- A pure Vitest check of the state machine reaching `windup`/`hit` from `chase` (`OPUS_FIX_PLAN.md` §5 names it) — cheap, and it is what would have caught this the first time.
- Ribbon: `ssSnap` at `ssStep(6)` and `ssStep(18)`; radius grows between them and the ease spans ≥ 0.15 s; the ring is still 0.3 m tall at 1.9 m and gone by 0.25 s. (ease rule, `heroes.md` §2.5.4)
- Shatter: probe the shards' max y at +0.8 s (< 0.5 m) and the puff's twelve points visible at +0.4 s; fan flatter, life toward 0.5 s. (`enemies.md` §2.5)
- Hit-stop: `ssCtx.stopped` true at the first hit, Liam's walk does not advance for the duration, the ribbon's radius still advances across 3 stopped frames. (T-31)
- Scatter: a wide frame (`W1` or `S1`) shows no red/orange/blue flecks; litter reads olive-brown. (T-09, T-22)
- S1 note: recompute the camera from §2.11.5's formula for target (44, 0.8, 0) yaw 300 pitch 40 d 24 and describe what the render actually contains. (T-30)
- `_shared/` blast radius: one Isabella frame each from `frozen-night`, `caves-descent`, `flight-golden` at their close-up station, read against the `-01`s — idle and `X` unchanged but for the ribbon's ease.
- Every save with `?t=golden` explicit, lowercase name, `-02` suffix; 12 s after each navigation; two rendered frames before reading a PNG.
- `npm run check` green; `LOG.md` row per fix; a `DECISIONS.md` line for the brake choice, the hit-stop number and the totem.

## Not applicable, considered

- T-16, T-19, T-24, T-33 (Bog/Desert/Shadow/dawn light rows): other biomes and hours; this scene is Forest golden.
- T-27 (the curve centre follows the camera): the meadow's `uCurveCenter` is static at (44, 0) and no camera travels here.
- T-17 / T-23 (sky and tilt-up beats): no aurora, no 26–34 m canopy; the composition fix here is a tree at the edge, not a tilt-up station.
- T-20 / T-21 (key–hemi pair, district fog): the golden keyframe is inherited from `style.ts` and out of the files this task may touch.
- T-06's needs-render status: the tempo numbers bind only through the always-tier ease rule, which is listed above; the rest is Phase 1 scoring.
