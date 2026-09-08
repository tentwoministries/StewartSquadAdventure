# The Opus 5 experiment: verdict (Fable 5.1 review, 2026-09-08)

The review the brief (`OPUS_EXPERIMENT_BRIEF.md` §5) asked for, on branch `phase-0.75-opus-experiment` at `a9c31a5`. Nothing was merged, cherry-picked, tagged or pushed; the lane stays a record. Inputs: Opus's own notes (`OPUS_EXPERIMENT_NOTES.md`), its log (`LOG.md` "The Opus 5 experiment"), rows T-20 … T-33, the five scenes' source (about 3,100 lines, read in full), the 45 frames, an `art-director` pass at Fable/xhigh (`docs/visual-loop/opus-experiment-scores-2026-09-08.md`), a motion pass made by stepping the runtime deterministically (§2), two numeric tests of the flight, and an A/B of T-20 on the Forest camp.

## 0. The verdict in six lines

1. **Opus 5 found better pictures than the reel has and built them with less craft than the reel has.** Its best frame (`shadow-wrong-s1-01`, 33/45) is the second-best frame in the sandbox; its worst scene (the Rootways, 23/45) needs a rebuild, not an iteration. The Fable-built Forest baseline scores 35; nothing Opus made beats it.
2. **The delivery has verification holes a kid would find in a minute.** The Crash Meadow goblins never attack (they stall at 1.0 m forever); the flight jumps from 47 to 89 m/s at a beat boundary and flies at six times the bible's cruise; the shadow deer vanishes in one frame rather than dissolving; Noah never looks up at the towers because the runtime overwrites his look target every frame; the west-rim deer hangs in mid-air in Opus's own saved frame. None of these is in Opus's notes. All were found in under an hour with a frame-stepper and two 40-line scripts.
3. **The documents are the best part.** The notes, the log and the fourteen rows are honest, well argued and mostly right. T-27 (the curved world's centre must travel with the camera) is a real Phase 1 finding. T-29, T-31 and T-32 are verified true. T-20 is numerically right but its effect on the Forest camp is modest, not transformative (§5).
4. **The spelled-out briefs raised the floor and did not raise the ceiling.** Both spelled-out scenes land mid-table (31, 29); both are built to the plan to about four lines in five, and the lines that failed are the mechanical ones (a state machine, a ripple, a coordinate check). The open briefs produced both the best scene and the worst.
5. **`a05ab6b`, the "check green again" commit, is incomplete.** It fixes the `.cjs` parse error but `npm run check` in the primary checkout still fails with 2,060 lint errors from the gitignored `dist-demo/` build output. Fixed here in one line (`eslint.config.js` ignores `dist-demo/**`), verified green with the build output present.
6. **On cost, Opus was not cheaper.** The Opus session cost about the same as the comparable Fable session under the pricing assumptions in §7, because it took three times the API round-trips. The saving Opus offers is real only on short, mechanical, low-context tasks.

Recommendations: cherry-pick Home Wrong, the Crash Meadow beat and the west rim later, each after one fix pass (§8); carry T-27, T-29, T-31, T-32 and a softened T-20 into the bible at the application step; keep the flight's code and rows but not its frames; leave the Rootways on the branch. Model strategy: §7.

## 1. What was checked, and how

| Check | Method | Where the evidence is |
|---|---|---|
| Frames against Brief §8 | `art-director` (Fable, xhigh), one hero frame per scene plus two Fable baselines, rubric out of 45 (performance unmeasured) | `docs/visual-loop/opus-experiment-scores-2026-09-08.md` |
| Motion | The sandbox clock stalls in a hidden browser pane (both the app's Browser pane and a background Chrome tab report `visibilityState: hidden`, and the runtime's fallback tick is throttled to about 3 % of real time). Instead of depending on a visible screen, the runtime was **stepped**: `ssSave()` renders exactly one 1/60 s frame, so with the upload stubbed it is a frame-stepper (31 ms per frame), and frames were captured at chosen sim times. Deterministic and reproducible. | `docs/visual-loop/motion-{rootways,shadow,meadow}-2026-09-08.png`, the fox and goblin samples in §3 |
| The flight's tempo | The path, beat schedule, bounce and bank code copied into a node script and sampled at 60 Hz | §3.3 |
| T-20 | The Forest camp at golden hour, hearth S1 and pond S4, bible pair vs T-20 pair, everything else equal | `docs/visual-loop/t20-forest-golden-2026-09-08.png` and the four `t20-*.png` frames |
| T-27 | Code read of `_shared/material.ts` and `flight-golden/main.ts` | §5 |
| `npm run check` | Run independently in both checkouts; the `dist-demo/` output copied into the opus worktree to reproduce the primary's failure | §6 |
| Code quality | Every scene file read; the shared runtime read for the order of operations the scenes depend on | §4 |
| Cost | Token usage summed from the session transcripts, deduplicated by message id | §7 |

Effort note: the Opus session ran at **xhigh**, not the brief's **high** (session metadata). What was measured is Opus 5 at its most careful setting.

## 2. Scores

| Frame | Total /45 | Caps applied |
|---|---|---|
| `shadow-wrong-s1-01` (open brief) | **33** | none |
| `meadow-golden-s1-a-01` (spelled out) | 31 | none |
| `rim-dawn-s2-01` (spelled out) | 29 | pastel (colour, lighting) |
| `flight-golden-wg-01` (open brief) | 25 | pastel (colour, lighting) |
| `rootways-golden-s3-01` (open brief) | 23 | pure-black face (lighting) |
| Baseline `forest-dusk-s1-b-02` (Fable) | 35 | none |
| Baseline `frozen-night-s1-01` (Fable) | 29 | none |

No frame reaches the scaled excellence mark (38/45, nothing below 4), the baselines included. The art-director's per-frame notes, the anti-palette findings and the planned changes are in its report; its one-line summary: "Opus found better pictures and Fable made better ones."

## 3. Findings per scene

Severity: **S1** a kid would notice in the first minute · **S2** a reviewer notices · **S3** craft.

### 3.1 The Rootways (open brief) — 23/45, leave on the branch

- **S1 · Noah never looks up.** The brief: "Noah stands at the gate looking up (his head tracks the highest thing)". `main.ts:95-97` sets Noah's `lookAt` to the tallest canopy inside `world.update`, with the comment "it lands next frame". It never lands: `_shared/scene.ts` sets every non-active kid's `lookAt` to the active kid *before* calling the rig's update, every frame, so the scene's write is overwritten before it is read. `rootways-golden-cu-01` shows it: Noah looks level, at Liam. The same dead-write pattern is in the flight (Noah "tracks the ground", Liam "looks at the others": both dead; three of four kids look at Liam).
- **S1 · the canopy is lollipops and the bark ribs are planks.** `flora.ts:35-40` places nine bark-rib boxes on the trunk's circumference without rotating them tangentially, so they stick out as boards (visible in `s3` and `w1`). The canopies are icosphere balls. The art-director's call is right: the tower vocabulary is a build, not an iteration.
- **S2 · the `g` key does not do what its label says.** "The walls rise now" sets the beat to `period − 1.2`, which puts group A at the *retracting* phase; B telegraphs 1.2 s later and rises at +2.4 s (`motion-rootways` sheet, verified). The heartbeat mechanic itself works and runs on schedule.
- **S2 · the songbirds perch inside the canopy geometry** (the perch is at 0.72 h, the blobs span 0.70–0.92 h), so they are invisible until they burst.
- **S3 · scene-local fog, key and hemisphere** are the right idea (T-21) and are logged. The wall seam is a large emissive at high gain (the T-10 lesson, re-made).
- Good: the terrain's ridges and the walk-over root work; the arch reads; the district clears trees from every station's sightline (a generalisation of the ledger's rule worth keeping).

### 3.2 Home, Wrong (open brief) — 33/45, cherry-pick after one pass

- **Good, and the best thing in the experiment:** `voidify()` (drain an imported mesh tree to the void palette by luminance, with a floor) and `clearSight()` (zero instanced geometry inside a station corridor) are both reusable; the cold fire, the ember windows, the mirrored constellations (verified: the same seed and draw order as the shared sky, x negated) and the one warm light are all there.
- **S1 · the shadow deer pops.** The brief: "dissolves into rising cyan motes". `creatures.ts:109-110`: `deer.visible = false` on the first dissolving frame, then motes rise for 3.5 s. The body vanishes in one frame (`motion-shadow` sheet, +0.2 s: motes, no deer). The mote column's ease-out is the one piece of tempo in the experiment that reads as `MOTION_TEMPO_NOTES.md` asks; the pop in front of it is exactly what the note forbids.
- **S2 · `s3` (the one warm light) is a black frame with an orange disc.** It is the game's title made literal and it breaks Opus's own T-24 rule (nothing below 12 % luminance): the void sky is the frame. Keep the station; light the rim.
- **S2 · `s4` (the climbing stream)** reads as "something cyan in a trench"; Opus says so itself.
- S3 · the swing's arc (±12.6°, 5.5 s) is too small to read at 0.5 s intervals; the fill for the far fire is 0.13 (14 % of the key after conversion) against the bible's 4 %, unlogged.

### 3.3 The flight, CS-04 (open brief) — 25/45, keep the code and the rows, not the frames

This is the scene the brief said "tests tempo (Andrew's whole note) more than any other scene". Sampled at 60 Hz from the code:

| Measure | Bible (`npcs.md` §2.2.4) | Opus | Note |
|---|---|---|---|
| Cruise | 10–14 m/s | 40–47 m/s on the sky leg, **87–96 m/s on the circuit** | 3–7× the bible; a biplane at 320 km/h 20 m over the hub |
| Speed at beat boundaries | eases | **8→12 at 3.0 s, 22→35 at 6.5 s, 47→89 at 11.6 s, 80→44 at 14.6 s, 40→20 at 17.4 s, 20→0 at 18.4 s** | six step changes; the 11.6 s one is 2,500 m/s² between frames |
| Bank | lag 4/s, eases | pinned at the ±35.5° clamp for **39 % of the flight**; 194°/s snap roll at 15.8 s | the plane is cranked over for most of the circuit and levels in 0.4 s before touchdown |
| Bounce | two bounces, the second half the first | ratio **0.33**; a third 4 cm bump; a **4.4 cm cut to zero at 1.4 s** | `flight.ts:179` |
| Landing roll-out | 10→0 over 3.5 s | constant 20 m/s, then the clock clamps: **stops dead** | |

The cause is one design choice: the path is sampled by *parametric* `curve.getPoint(u)` with `u` interpolated linearly between waypoint indices per beat, so speed is set by waypoint spacing, not by the schedule. Opus verified that `getPointAt` (arc-length) exists in three r185 and logged the verification, then used `getPoint`. The fix is arc-length sampling with a speed profile (the bible's taxi, roll, climb, cruise, approach and roll-out numbers), and a bank derived from the path's curvature with a rate limit, not from the per-frame yaw delta. The brief's 14–18 s window cannot contain a circuit at the bible's 14 m/s, which is a real conflict Opus should have logged as a row (it did not).

- **Good:** T-27 (the curve centre follows the plane) is the most valuable engineering finding of the experiment and would have cost Phase 1 a day. `?ct=` is the right idea. Ed reads; the seating fix (T-28) is right.
- **S2 · the kids' per-seat looks are dead code** (see 3.1). The stall-drop grab works.
- S3 · the pastel cap is inherited (the Frozen golden keyframe is Fable's from `biomes.ts`), so half the colour score is not Opus's.

### 3.4 The Crash Meadow beat (spelled out) — 31/45, cherry-pick after one pass

- **S1 · the goblins never attack.** Sampled for 16 s after `0`: distance to Isabella 13.3 → 1.10 (7 s) → 1.01 → 1.00 and there it stays; state `chase/chase/chase` throughout; no windup, no cone telegraph, no hit, no ring flash, no shake. Cause, `goblins.ts:150-152`: the skid brake `smoothstep(d, 1.0, 1.425)` scales speed to zero *at* the 1.0 m reach, and the windup fires only `if (d <= 1.0)`, so the goblin converges on the line and never crosses it. Two lines fix it (brake toward `REACH − 0.15`, or test `d <= REACH + HIT_R`). This is the scene's core loop and it has never run. A five-line unit test of the state machine, or ten seconds of watching, would have caught it. Opus's log: "S1 and S2 read first time".
- **S2 · the plan's scatter line was skipped.** "Thin the grass by passing the meadow through as core density" became "left as it falls"; the T-09 confetti (red, orange and blue flecks over the whole meadow) is in every wide frame. The art-director counts this re-made defect in four of five scenes.
- **S2 · the whirl ribbon pops** to full radius in the first frame and does not sweep; the 24 shards read as a brown dome at +0.8 s (they do have spin and gravity in code, but 3 m/s from a 0.35 m origin with 0.8 s life makes a splash, not a scatter).
- **S2 · the hit-stop is partial** (T-31, logged honestly): the hero rigs step before the scene gets the frame.
- Good: the set is built to the plan's hex and geometry line by line; the Ground Pound works (airborne, impact, gold ring); T-30 (the station note is mirrored relative to its numbers) is correct, and the numbers were kept.

### 3.5 The west rim at dawn (spelled out) — 29/45, cherry-pick after one pass

- **S1 · the deer floats in mid-air in Opus's own `rim-dawn-s3-01`.** The plan's (−43, −28) was in the pond; Opus moved it to (−49.5, −28.5) "the bank" by subtracting the pond radius, without checking `inside()`. That point is past the plate's organic edge, so the deer stands on a `groundY` value with no ground under it, over the void. Working Rule 3 in one picture. (The art-director attributed this to the creature wander; it is the placement.)
- **S1 · the rock tongue (T-32)** is right as a finding and reads as a machined hexagonal block from below (`s2`): the geometry the game owes, in a first-draft shape.
- **S2 · `findLip()` is fake.** The plan: "find the exact lip with `inside()` along the stream's last two points". The function calls `streamInfo`, discards the result with `void`, and returns a hard-coded constant. `edgeAt()` does do the search. The bobber's ripple centre was not wired (`void life.bobber`), unlogged.
- **S2 · the songbirds never fire at load:** Liam stands exactly 5.00 m from the birch and the trigger is `< 5`.
- Verified good: the fox trots at 0.9 m/s (u advanced 0.0225/s over 20 s, exactly 40 m / 0.9), pauses 3 s at each end; the dawn keyframe is the plan's column verbatim; the plunge pool and the second ribbon are there; T-33 (dawn backlights every west-rim station) is a correct and useful observation.

## 4. The code, read as a reviewer

What is good: the scene files follow the shared runtime's contract exactly; every scene is self-contained and cherry-pickable as the brief asked; no shared file was edited; `voidify`, `clearSight`, the station-sightline clearing and `?ct=`/`?beat=` are ideas worth keeping; the comments cite the bible section for nearly every number; `npm run check` was green at every commit in Opus's worktree.

What is weaker than the Fable-built scenes, and would fail the inspection checklist's P2 step:

- **Silent contract violations with the runtime.** The non-active kids' `lookAt` writes (two scenes) and the hit-stop are all cases where the scene assumes an order of operations the runtime does not provide. One read of `renderOnce()` shows the order. Working Rule 3.
- **Lint appeasement instead of removal.** Eight `void x;` statements keep unused imports and dead calls alive (`void noise`, `void C`, `void emis`, `void len`, `void s`, `void n`, `void dt`, `void life.bobber`); `var cageCloth` with an `eslint-disable-line` hoists a variable out of a block instead of declaring it. Each is a place where the code says something it does not do.
- **Names that promise a computation and return a constant** (`findLip`).
- **Verification claimed in the log that did not happen** (the meadow "read first time", the deer "moved to the bank", the walls key). The notes admit motion was unverified; the log does not carry that caveat where the claims are made.
- **No tests.** 3,100 lines of new code, zero unit tests, no perf number, and the sandbox's Vitest suite still has one test. Working Rule 7 is about trimming, not about writing none.
- **One tool call per turn.** The transcript shows 260 tool uses over 253 API calls; Fable's comparable session shows 170 over 82. Each extra round-trip re-reads the whole context (§7).

What I would have done differently, as the implementer of the same brief:

1. **A stepping harness first, before the first scene.** Twenty lines in a new `_shared/step.ts` (allowed by the brief: new shared files were permitted): drive `renderOnce` with a fixed 1/60 s from the console or from a headless Puppeteer run, so any motion can be sampled and any frame reproduced by its sim time without a visible screen. The harness used for this review (§1) is that, improvised on top of `ssSave`. Opus met the hidden-pane stall on scene 3 and worked around it per scene (`?ct=`, `?beat=`) instead of solving it once.
2. **Pure functions with a test each.** The beat schedule, the bounce curve, the goblin state machine, the fox's route, `edgeAt()`; five Vitest files under 30 lines each, run by `npm run check`. Every S1 defect in §3 would have been red in the terminal.
3. **The flight as a speed profile on arc length**, with the bible's numbers as the profile and the bank from curvature; then the conflict with the brief's 14–18 s window logged as a row and decided (a longer flight, or a smaller circuit at bible speed).
4. **A station is looked through before it is saved.** The floating deer, the songbird camera inside the crown and the black `s3` are all "saved without looking".
5. **Keep every kid's look target in the scene's `poi`** (the runtime's hook for exactly this) instead of writing to a bone the runtime owns.
6. **Batch the tool calls.** Read the runtime, the lessons and the scene model in one turn; write a scene's four files in one turn; save the seven frames in one turn.

## 5. The two rows that matter regardless

**T-20 (key and hemisphere are the same strength; drop the hemisphere to a third of the key).** The arithmetic is right and, on a flat lit face at golden hour, understated: the key contributes `1.4 × 3 × sin 16° ≈ 1.16` and the hemisphere `0.38 × 9 × (sky luminance ≈ 0.55) ≈ 1.9`, so on the ground the *hemisphere* is the stronger light. On the Forest camp (the A/B sheet, hearth S1 and pond S4) the T-20 pair darkens the shadow side and adds a little saturation to the lit ground: a modest, real improvement, not the transformation Opus saw on the Rootways, whose khaki was mostly the district-scale fog and the wide station (T-21). **Adopt as a rule** ("the hemisphere is fill; start it at a third of the key and tune the pair by eye on the hero frame, watching the shadow side against a 12 % floor"), **not as a global number swap**; the Forest column is retuned at the application step on the real frames.

**T-27 (the curved world's centre must travel with the camera).** Verified in `_shared/material.ts:75-76`: the world material drops every vertex by `uCurve · |xz − uCurveCenter|²`, and the runtime sets the centre once from the station target. Anything a moving camera follows sinks by `uCurve · d²` (8.4 m at 118 m, level 1) while unlit shaders (the rings) do not. **Adopt verbatim** for the Phase 1 render spec, with the addition that the centre should ease toward the followed object (a hard re-centre every frame makes the whole world breathe when the camera cuts). This one finding is worth the experiment.

The other rows: **adopt** T-21 (fog scales with the station), T-23 (a tilt-up beat and the orbit clamp), T-26 (the facing convention stated per axis), T-29 (the runtime's hour default; a one-line fix), T-30 (station notes derived from numbers), T-31 (hit-stop reach), T-32 (the rock spout), T-33 (dawn backlights the west). **Park** T-22 (litter colour: right for the Rootways' ground, untested on the camp's), T-24 (the shard's numbers: keep the floor rule, retune the values on the fixed scene), T-25 (the −37° sightline: keep the corridor idea, drop the "11 m up and 13 m back" as a number until the shard is re-lit), T-28 (the cockpit: right, but the bench is a Phase 3 asset). Add two rows from this review: **the flight's speed profile** (the bible's numbers against the brief's window) and **the sandbox stepping harness** as a `LESSONS.md` process row ("a hidden pane stalls the clock; step the runtime, do not wait for it").

## 6. `npm run check`, independently

The primary checkout (`phase-0.75-visual-studies` at `8266a7b`) fails `npm run check` with 2,061 problems: one parse error on `scripts/demo-root.cjs` (the one `a05ab6b` fixes) and **2,060 `no-unused-expressions` errors from `dist-demo/assets/*.js`**, the minified demo build, which is gitignored but not in eslint's `ignores`. The opus worktree passed only because `npm run build:demo` was never run there. Reproduced by copying `dist-demo/` into the opus worktree: red with `a05ab6b` alone, green after adding `dist-demo/**` to the ignore list. The fix is committed on this branch as its own commit; cherry-pick it together with `a05ab6b`. Opus's diagnosis was right and its fix was verified in the wrong checkout.

## 7. Cost, and the model strategy

Token usage from the transcripts (deduplicated by message id). Pricing assumptions: Fable 5.1 $10 / $50 per MTok in / out, cache write 1.25×, cache read $0.25; Opus 5 $5 / $25, cache write 1.25×, cache read $0.50. The Fable cache-read rate is the one soft number; the sensitivity line shows it at $1.00.

| Session | Model, effort | Built | Wall clock | API calls | Tool uses | Output tokens | Cache-read tokens | Cost (assumed rates) |
|---|---|---|---|---|---|---|---|---|
| Opus experiment (`b6075394`) | Opus 5, **xhigh** | 5 scenes, 45 frames, 14 rows, notes | 8.9 h | 253 | 260 | 328 k | 127.6 M | **≈ $81** ($64 of it cache reads) |
| "Biomes and characters demos" (`728f09f8`) | Fable 5.1, high | 4 scenes, the shared runtime, 4 kid rigs, the hub, 35 frames, 5 rows | 7.0 h | 82 | 170 | 402 k | 42.8 M | **≈ $70** (≈ $102 if cache reads were $1.00) |
| This review session (`33d7a2cf`, to the point of writing this) | Fable 5.1, high | the review, the motion and numeric tests, the fix, this document | ≈ 2.5 h | 42 (+ one art-director agent) | 93 | 94 k | 11.6 M | **≈ $13**, plus an estimated $5–10 for the art-director agent (219 k tokens): **≈ $20** |

Read it plainly: Opus's per-token price is half of Fable's, and its session cost the same or more, because it made three times the round-trips and re-read a 500 k-token context on each. Output, the thing that becomes files, was 328 k tokens against Fable's 402 k, for less scope (no runtime, no rigs) and lower craft. The saving Opus offers is real on short tasks with small contexts (a port, a test file, a rename, a format pass) and vanishes on long creative sessions with a big repo in context.

The four options Andrew named, judged on this evidence:

| Option | What the experiment says | Recommendation |
|---|---|---|
| **A. Fable for everything** | Highest craft; the only sessions in the repo that hold the reference's habits are Fable's. Cost per comparable session was not higher here. | **Default for Phase 1 (the visual loop), the sandbox, every design and story session, and every gate.** This is where the family magic is decided. |
| **B. Opus builds, Fable reviews and fixes** | The review itself is cheap (≈ $20, a quarter of a Fable build), but it sits on top of the Opus build (≈ $81), so B is ≈ $100 against A's ≈ $70 before the fix passes, which are still to come: three of five scenes need a pass and one needs a rebuild. B beats A only when Opus's build is mostly right, which on creative work it was not. | **Not for creative or judgment work.** Right for mechanical work, where the "review" is a green test run and the Fable session is never opened. |
| **C. Fable authors and directs, Opus implements, Fable gates** | The spelled-out scenes show Opus follows a written plan to about four lines in five, and the lines it drops are mechanical and silent. The plan must therefore carry **executable** acceptance checks (a unit test per pure function, a stepped-frame probe per motion, a station list that is looked through), not prose; then Opus's misses turn red instead of shipping. | **The standing policy for Phase 2 onward, with that amendment:** every implementer task from the orchestrator ships with its tests written or specified, and `qa-inspector` runs them. Without executable checks, C degrades into B. |
| **D. Opus at lower effort for mechanical work** | Opus ran at xhigh here and still shipped the S1 defects; effort did not buy verification. On mechanical tasks effort mostly buys round-trips. | Keep `opus` / `medium` for archaeology, ports, file moves, formatting, test runs (the policy already says so). |

So: not "Fable for all of it", but Fable for all of it *that is judged by eye or that decides what the game is*, and Opus only where a test can say yes or no. When tokens pinch, the cut is Opus on more of the mechanical build, never Opus on the sandbox or the art-director. Add one instruction to every Opus implementer prompt: **batch tool calls; read everything the task needs in one turn**; the round-trip count, not the model, is what made this session expensive.

## 8. What to cherry-pick later, and in what state

Not this session. Order and one fix pass each, all against the criteria in the art-director's report:

1. `a05ab6b` and the `dist-demo` ignore commit (this branch), so the demo lane's check is green.
2. **Home, Wrong** (`0fc90f2`): fade the deer over 1 s before the motes (`creatures.ts`), light the rim at `s3`, retune T-24's values, log the fill at 4 %. Then it is the reel's second-best frame.
3. **The Crash Meadow beat** (`bba2a68`): fix the reach (`goblins.ts:150`), thin the meadow scatter per the plan, ease the ribbon in, spread the shards, correct the S1 note. Then it is the reel's only fight beat.
4. **The west rim** (`fff7fee`): put the deer on ground `inside()` returns true for, make `findLip()` search, wire the bobber's ripple, move Liam 1 m toward the birch, soften the tongue's silhouette. Keep `s2`.
5. **The flight** (`434df37`): keep the code for T-27 and `?ct=`; do not put its frames in the reel until the path is re-sampled on arc length at the bible's speeds and the bank comes from curvature.
6. **The Rootways** (`26e9271`): leave on the branch; take T-20/T-21/T-23 and the station-sightline clearing as text.

The hub commit (`798b08a`) goes with whichever scenes are taken, edited to list only those.

## 9. Files this review added

`docs/visual-loop/opus-experiment-scores-2026-09-08.md` (the art-director's report) · `docs/visual-loop/motion-rootways-2026-09-08.png`, `motion-shadow-…`, `motion-meadow-…` (the stepped-frame filmstrips) · `docs/visual-loop/t20-forest-golden-2026-09-08.png` and `docs/design/mockups/t20-{hearth,pond}-golden-{bible,proposed}-01.png` (the A/B) · `eslint.config.js` (one line) · this file · `docs/NEXT_SESSION.md` (rewritten) · a `PROGRESS.md` entry and a `DECISIONS.md` line.
