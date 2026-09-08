# Rule sheet — the Crystal Depths, reel fixes round 1 (`docs/qa/briefs/reel-fixes-caves-03.md`)

Written by `rules-librarian`, 2026-09-08. Tier-1 rows fetched per `DEMO_PROGRAM.md` §1. Rows: **T-55, T-56** (T-34, T-18 upstream).
**Gap (Working Rule 1):** `dungeons.md` §2.7 (the Crystal Caves) is a *preview* — light rule, lamps, crystals, no tiers, no stairs, no geometry. The tier heights, the two west-wall stairs and the void are **T-18 only, status `proposed`**; §2.1.1 ("corridors 4 m wide", terraces offset in plan) is the nearest canon. So the layout is not yours to revise: fix the join, do not move a tier, and say in the report that the numbers came from T-18, not the bible.

## 1. Applies

**Never-run rule first.** `LESSONS.md` §0 rule 8: "a mechanic is not built until it has been seen to run in a stepped probe, every state reached." Walking down the stair is the mechanic both rows are about — the walk probe (check 2), not the test file, is what makes T-55 done.

**Parallel-ownership hazard, second.** **T-43** (`PHASE_0.75_TWEAKS.md`): `IcosahedronGeometry` is non-indexed, so "the caves' shell jitter in `caves-descent/terrain.ts`" is the rocks builder's row in *your* file. The brief bars that `for (let i = 0; i < dp.count; i += 3)` block: every `Edit` re-reads the file first and uses an `old_string` that excludes it.

- **Always · `LESSONS.md` §0 rule 9 + Process row 5** — a hidden pane and a background tab stall the clock; step with `ssStep`/`ssSnap`/`ssKey` under `?step=1`, never wait for a screen. Every probe and frame in §4 of the brief.
- **Always · `LESSONS.md` §0 rule 12 / Process row 2** — patch TypeScript with a `.cjs` script file, never an inline `node -e` with backticks. Any scripted edit of `terrain.ts` / `props.ts`.
- **Always · `LESSONS.md` §0 rule 10 + brief "Files you may touch"** — a `_shared/` change costs one frame per scene; you may not make one. The ring lift to +0.04 is another builder's; your side is the *column tops*, in `caves-descent/` only.
- **Always · `LESSONS.md` §0 rule 11 / T-29** — `?t=` explicit on every save, names lowercase. The caves open at `half`; a bare URL defaults to dusk and mis-names all four `-03` frames.
- **Always · `LESSONS.md` Process row 1** — a save before the first rendered frame is a blank canvas at **58,885 bytes**; wait 10–12 s after navigation (the brief's own "wait 12 s").
- **`LESSONS.md` Camera row 4 (its example is this scene)** — "Two cave stations rendered black … the camera sat outside the back-face shell, or inside a tier's rock … a station in an enclosed space is checked against the enclosure's geometry" (`caves-descent/main.ts` `L1`, `W1`). Cutting columns to the stair changes that enclosure: re-check S1/S2 after the cut, and derive any proposed station numbers from a frame (**T-30**).
- **`LESSONS.md` Process row "the songbirds never fired"** — a trigger on a distance uses `<=` (or the placement sits clearly inside it); Liam stood at exactly 5.00 m against `< 5`. Your band test `stairY(x, z) !== null`, the chosen 3.2/3.8 m half-width and the ±1.0 m offset sample lines land *exactly* on the boundary: pick the inclusive comparison and say so.
- **`LESSONS.md` Density and scale row "a deer stood in mid-air"** — anything placed near an edge asserts `inside()`; a bank is found by marching, not by subtracting a radius. The flared 5 m mouth and the 2 m apron are found by sampling `groundY`/`stairY`, not by widening a constant.
- **T-18** — the demo layout is the seed for T-01..T-04: three tiers (Landing 0 m, gallery ledge −11 m, Depths −26 m), **two stairs along the west wall**, the void in the middle. The cut may not remove a tier, move a stair off the west wall, or close the sightline down the void.
- **`dungeons.md` §2.7** — "only Quartz's lamps and Collette's magic light it": `dng.cave` `dark 0.72`, `light.heroPool` 4 m, **no torches**, wall-lamps on hooks **along the stair** and the main paths, rim crystals 2× within 6 m. If a lamp footprint blocks the mouth it moves *along the stair*, it does not disappear.
- **`LESSONS.md` Light row 6 / T-10 by reference** — lamps are emissive-only at cd 0; a scene stays under about twenty point lights. Moving a lamp must not add a light.
- **`heroes.md` §2.7.5 (the ring, canon for T-56)** — outer diameter 1.6 m, gradient 35 % alpha at 0.55 m to 0 at 0.80 m, crisp rim at 0.62 m, additive, `depthWrite false`, "projected onto the ground … offset 0.01 m with `polygonOffset` so it follows slopes without z-fighting". Your 0.9 m clearance radius is exactly this 0.80 m outer edge plus margin; T-56's +0.04 m is a *scene* raise over the bible's 0.01 m and belongs in the report.
- **`PRE_BUILD_TODO.md` P-05** — this task is P-05 ("the caves' stairs and the rock", the first worked `misc` example, T-34). P-04 and P-07 read its result, so every deferral is written down, not implicit.
- **Working Rule 7** — the suite is 25 tests; the brief caps you at **≤ 6 new** in `tests/unit/sandbox/caves.test.ts`. Only `tests/unit/version.test.ts` exists on this branch: name where the 25 live and what the trim pass found before adding.

**Open observations (status `observed`, `DEMO_PROGRAM.md` §1 rule 4 — not constraints):** **T-55**, **T-56** (your two fixes; their "Rule" column is the definition of done, not a rule you must also honour elsewhere). **T-34** (their parent). **T-41** (the ring is not bent by the curved-world shader) — a `_shared/` fix in `reel-fixes-shared-03.md`; if your ring check fails at distance from the curve centre, it is T-41, not T-56, and it is reported, not fixed here. **T-47** (every station's kid placement is walkable) — owned by `reel-fixes-stations-03.md`; if the mouth widening moves a station, propose the numbers to it.

## 2. Checks implied

1. **Walk probe before the test is trusted** (never-run rule): three approaches at −40° / 0° / +40°, `w` held 240 frames under `?step=1`, each run's final position and max intrusion quoted; y below −2.0 with no frame more than 0.05 m inside `tiers`/`stairs`.
2. **`caves.test.ts` (a)** centreline and ±1.0 m lines at 0.25 m spacing: `|Δ groundY| ≤ 0.15` per sample, every point inside the cave — with the boundary comparison stated (`<=`, the songbirds row).
3. **`caves.test.ts` (b)** 300 seeded points on the landing and tier 1: raycast top vs `groundY` within **0.05 m** (T-56).
4. **`caves.test.ts` (c)** 200 points along the stairs: highest `tiers`/`stairs` hit within **0.05 m** of `stairY` — no column pokes through (T-55).
5. **Ring clearance:** no column within **0.9 m** of a kid cuts a ring plane at ground + 0.04, sampled over the landing and tier 1 (`heroes.md` §2.7.5's 0.80 m outer edge).
6. **Width decision stated:** 3.2 m or 3.8 m for both drawn tread and walkable band, with the reason and its relation to §2.1.1's 4 m corridor.
7. **Stations re-read after the cut:** `L1`/`W1`/`S1`/`S2` not inside rock and not outside the back-face shell (Camera row 4); any proposed station number derived from a saved frame (T-30).
8. **Lamp budget:** if a lamp moved, quote the count and confirm cd 0, no new point light, lamps still along the stair (`dungeons.md` §2.7).
9. **Frames:** `caves-descent-s2-03`, `caves-descent-stair-03`, `caves-descent-s1-03`, `caves-descent-ring-03` — lowercase, `-03`, explicit `?t=`, saved ≥ 12 s after navigation, none 58,885 bytes; one line read each.
10. **`npm run check` green**, suite count stated, trim pass reported (Working Rule 7); `terrain.ts` diff contains no line of the shell jitter loop (T-43).

## 3. Not applicable, considered

- **T-24 / T-39** (the shard's 12 % luminance floor and the far fill) — a `shadow.wrongDusk` row; the caves' darkness is `dng.cave` 0.72 and this pass is geometry, not light.
- **T-06 / T-35** (the ease rule, hit-stop holds the sim clock) — nothing here changes state or stops time; the stair is static geometry.
- **T-26** (facing per axis) — you place Liam and Isabella but do not re-pose a rig; if a probe leaves a kid facing wrong in `caves-descent-ring-03`, it is this row and a frame settles it.
- **T-02 / T-01** (the lamps as a growth mechanic, the caves as a fifth biome) — design rows for the application step; the demo's fourteen hook-lamps are set dressing here.
- **T-09 / T-22** (scatter density and litter colour) — no scatter in the cut; the caves' floor is columns, not tufts.
