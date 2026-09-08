# Task: Home, Wrong — the fix pass (`OPUS_FIX_PLAN.md` §3, first scene)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/opus-fixes-shadow.md`. Runs only after the runtime task (`opus-fixes-runtime.md`) has landed: `sandbox/_shared/step.ts` exists and `SceneWorld.look` / `SceneCtx.stop` are available.

## What and why

`sandbox/shadow-wrong/` (id `shadow`, the Shadow Realm's mirror of Stewart Camp, Collette and Isabella) is the experiment's best scene (33/45, `docs/visual-loop/opus-experiment-scores-2026-09-08.md` §2) and goes into the reel after one fix pass. The review's findings (`OPUS_EXPERIMENT_VERDICT.md` §3.2) and the art-director's "Changes planned, in order" for `shadow-wrong-s1-01` are the checklist. Read both before the code.

## Files you may touch

`sandbox/shadow-wrong/` only (`creatures.ts`, `props.ts`, `main.ts`, `sky.ts`). Never `sandbox/_shared/` or `sandbox/forest-dusk/` (the scene imports the Forest's terrain, scatter and props through `voidify()`; thinning happens inside this folder, on the imported instances, not in the Forest).

## The fixes (all of them; the scores file's list first, then these)

1. **The shadow deer dissolves instead of popping** (`creatures.ts:99–111`). Today `deer.visible = false` on the first dissolving frame and the motes rise for 3.5 s. Keep the deer visible through the 1.6 s dissolve and fade it: scale the rim shell up and the body down on an ease (or swap to a cloned transparent material and ease its opacity), so it dissolves *into* the motes rather than vanishing under them. The mote column's own ease-out is right; keep it.
2. **The swing reads at a half-second pair** (`props.ts:319`): ±25° on a 3.1 s period (today ±12.6° on 5.5 s). Give it a station that is not black (light the rim of the frame per T-24's floor, nothing below 12 % luminance in the frame's dark corners), with the swing as the subject and a kid in the frame for scale.
3. **S3 (the one warm light) is a beat, not a station.** Keep it; light the rim so the frame is not 85 % black; note in the station's `note` that it is a beat for the hub's "Beats" category and not to be shown to the family yet. The `T-25` occluder findings stand.
4. **S4 (the climbing stream)** per the scores file: remove the lollipop tree standing on the camera (upper-left), get Collette's back out of the near foreground, and make the "uphill" read (the trench's rim, the water's direction).
5. **Thin the scatter** (T-09, the confetti re-made by recolouring the Forest's tufts without thinning them): reduce the imported tufts to the Forest's core density; the art-director's list says where.
6. **The fill for the far fire** is 0.13 (14 % of the key after conversion) against the bible's 4 %: either bring it to the bible's 4 % or keep 0.13 and log why as a T-24 addendum row in `docs/design/PHASE_0.75_TWEAKS.md` (one line, appended, keep the row numbering after T-34).
7. **`?t=wrong` explicit on every save** (the scene has one time; the runtime's default now honours `defaultTime`, but the frame name must carry it).

## Acceptance checks (run them; quote the output)

Use the stepping harness (`?step=1`; `ssStep`, `ssSnap`, `ssKey`) on the dev server :5173; never wait for the screen. Wait 12 s after each navigation before the first call.

1. **The dissolve filmstrip:** at the dissolve's station, trigger the deer's dissolve with its scene key (`O` lists the keys; read `main.ts` for the key), then `ssSnap` at +0.0, +0.4, +0.8, +1.2, +1.6 s (`ssStep(24)` between). The deer is visible and smaller/fainter at +0.4 and +0.8 than at +0.0, and gone by +1.6 with the motes still rising. Read the five PNGs and say so; name them `shadow-wrong-dissolve-{0,1,2,3,4}-02`.
2. **The swing pair:** at the swing's station, `ssSnap` twice 0.5 s apart (`ssStep(30)`): the swing's seat moves visibly between the two (say by how many pixels, from reading the PNGs); no region of either frame below 12 % luminance over more than a tenth of the frame (measure with a script over the PNG, e.g. `sharp` or `pngjs` if present in `node_modules`; check `ls node_modules` first, else read the PNG and judge).
3. **The re-shoot frames (§4):** `shadow-wrong-s1-02`, `shadow-wrong-s2-02`, `shadow-wrong-cu-02`, plus `shadow-wrong-s3-02` and `-s4-02`, all with the card and `?t=wrong`, after `ssStep(120)` at the station.
4. `npm run check` green; `tsc --noEmit` reports nothing for this folder.
5. `LOG.md` rows under "Scene 2 — Home, Wrong" for this pass (iteration 7 onward), one row per fix with what changed and what the frame showed.

## Definition of done

Every check quoted; the frames named above saved and read (each read in one line: what is in it); `LOG.md` rows; `docs/DECISIONS.md` one line per decision the brief left to you; a report listing every file and line changed, each check's result, the deer-dissolve method chosen, and anything deferred. Do not commit.
