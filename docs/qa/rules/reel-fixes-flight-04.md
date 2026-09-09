# Rule sheet — the flight, the pennant and how the kids ride (`docs/qa/briefs/reel-fixes-flight-04.md`, rows T-65, T-66)

Written by `rules-librarian`, 2026-09-08. Tier-1 rows per `DEMO_PROGRAM.md` §1. No bible gap found for this task: `npcs.md` §2.2.1, §2.3.4, §2.3.7 and `heroes.md` §2.4.7 cover the bench, the board and the seated clips.

## 1. Applies

**Never-run rule first.** `LESSONS.md` §0 rule 8: "A mechanic is not built until it has been seen to run in a stepped probe, every state reached." The `N` cycle / `?seats=a|b|c` is a keyed mechanic with three states plus the stall-drop grab: all four are stepped (`?step=1`, `ssKey('n')`), never judged by eye. Its sibling §0 rule 9: "The clock stalls on a hidden page: step the runtime, never wait for a screen."

**Canon the seating variants must keep** (`npcs.md` §2.2.1 front cockpit row, §2.3.4 Board beat, §2.3.7; `heroes.md` §2.4.7):
- "1.1 m long bench, four seat sockets `seat.0`–`seat.3`" and "the kids sit the way they fit in the back of the car: two forward, two behind, **Isabella on the left (she called dibs)**" — every variant seats four in named sockets `seat.0`–`3` with Isabella on the plane's left; B and C may re-place the rows, never re-assign her side.
- Ed keeps the **rear** cockpit, socket `pilot`, and "the scarf streams past the fin" — kids are always *ahead* of Ed (brief fix 2 keeps his socket at x = −1.35); §2.1.4 streams the scarf back along −velocity.
- Boarding is "climb the step into the bench … Ed into the rear; goggles down if `story.edGoggles`"; the step is "on the fuselage's north side at mid-length" (§2.3.1) — the well's side wall may not close over it.
- "`The Green Meanie` hand-lettered in `plane.green` on both sides **under the front cockpit** (canon text painted, not new text)" — replacing the fuselage cylinder must not delete or occlude the lettering; if the demo never drew it, say so, do not invent it.
- In-flight behaviour is **animation only, no new lines**: "Noah leans out and tracks the ground; Collette holds her pigtails down against the wind; Isabella has both arms up like a roller coaster; Liam sits still with one hand on the cockpit rim and looks at the others. On the `hopping` stall-drop all four grab the rim" (`heroes.md` §2.4.7: 3.0 s loops + a 0.4 s additive grab). Variant B has no rim: solve the strut/strap grip as the brief says and keep the four personalities.
- Kept dimensions the well must not break (`npcs.md` §2.2.1): fuselage 6.0 m × 0.9 m wide; upper wing at 2.4 m, lower wings 6.4 m span at 0.7 m (B seats on this surface); "cockpit interior `rgba(30,20,15)`"; "a 0.06 m emissive quad in each cockpit" `#FFB347` at 0.3, night only.

- **`LESSONS.md` §0 rule 10 + brief "Files you may touch"** — `_shared/plane.ts` is shared: the Bog, Desert and Frozen park it and call `plane.update(t)`, so one frame per scene plus the nine-frame sweep, and `update(t, wind = 0)` must keep the one-argument call working unchanged.
- **`LESSONS.md` §0 rule 4 / T-26 / Rigs row 3** — "a mesh built along `+x` (the plane, animals) takes `90° − bearing`"; a kid rig faces local `+z` with `180° − bearing`. Every socket and pose is expressed in **plane space** and read back from a close-up, never guessed.
- **`LESSONS.md` §0 rule 3 / T-06** — nothing pops; every state change eases ≥ 0.15 s on two incommensurate rates. The pennant's two sine rates and the wind ramp are this rule; so is the `N` swap (ease the pose, do not snap).
- **`LESSONS.md` Misc row 1** — "hide world-space UI for the duration of a cutscene" (the rings on the fuselage). The new orbit/seat framings look at the plane from angles the ride never framed; confirm no ring reappears.
- **`LESSONS.md` Misc row 2** — "seated kids need a seated pose, not a lowered standing one" (the exact defect T-66 names); `_shared/rig.ts` seat pose is listed "owed", so the pose stays in `main.ts` beside the existing one.
- **`LESSONS.md` Misc row 4 / T-60 (already in)** — "an input that fires anywhere is vetoed by a scene that seats, stows or mounts the kids (`SceneWorld.flourishOk`)". Do not regress the veto; B and C mount kids on a wing and still count as seated.
- **`LESSONS.md` Rigs row 2 + T-42** — "a planted or resting prop is parented to the root … and the hands are posed to it"; hands on the rim, the strut and the strap are `ikArm` solves onto real geometry, and carried props stay **stowed** (T-28: Collette's 1.7 m staff otherwise stands through the top wing).
- **`LESSONS.md` Rigs row 1** — "ease a tracked number, then **set** the bone from it; hooks add on top of the set value" — the stall-drop grab is additive over the seated clip, so it must not accumulate.
- **`LESSONS.md` Rigs rows 5 and 8** — rotate a part about its own centre, then translate (the well's walls, bulkheads and rim, the pennant quads); a pitch or roll on a yawed body needs `rotation.order = 'YXZ'` or a heading parent — the pennant chain yaws *and* pitches per segment, so nest the segments and read world axes in a probe.
- **T-28** — kids 0.84 m across and 0.72 m along, "dropped so the cockpit rim cuts them at the waist, which is what makes four kids read as four"; the brief's ±0.34 m z spacing is tighter, so the four-read is proven on a frame, not assumed.
- **T-27 / T-41** — the curve's centre is a *camera* property re-centred every frame on what the camera follows, and anything sitting in the world (rings, ribbons, straps, decals) bends with it on the shared uniform objects. The new lap strap and pennant are world geometry on `makeWorldMaterial`.
- **T-29 + §0 rule 11** — `readParams()` defaults `t` to `'dusk'`; every save passes `?t=golden` explicitly, frame names lowercase.
- **`LESSONS.md` Process rows 1–3** — wait 10–12 s after navigation (a blank save is 58,885 bytes); patch TypeScript with a `.cjs` file, never an inline backtick string; a `_shared/` change is checked with one frame per scene.
- **`STUDY_NOTES.md` §6 rules 1, 8, 9, 10** — build from `_shared/`; every scene keeps the same keys and `O` help (the HUD line names the variant, and `N` must not collide with `T, V, K, P, F, U, O, B, X, H, Tab, Enter, , .`); one `LOG.md` row per iteration; "don't build the game" — three variants for the family to pick, not a seating system.
- **`PRE_BUILD_TODO.md` P-04, P-07** — this is round-2 demo work feeding the demo-candidates set and the 0.75 application step: deferrals are written as report lines, and no design file is edited (T-65 and T-66 stay `observed`).

**Open observations (status `observed`, `DEMO_PROGRAM.md` §1 rule 4; not rules here):** T-65 and T-66 themselves (this brief is their fix; they stay `observed` until Andrew looks); T-57 (the rigs' handedness — `R` sits at local +x, i.e. the kid's left, so "outer hand" must be resolved from the rig's axes, not the bone name); T-58, T-59, T-61–T-64 (other scenes' round-2 rows).

## 2. Checks implied

1. **Stepped probe of every state** (§0 rules 8–9): `?step=1`, cycle `N` through a → b → c → a and reload each `?seats=`, and reach the stall-drop; quote the HUD variant name at each. No state judged by eye.
2. **Bone-in-solid probe** (brief fix 4, Misc row 2, T-28): for each variant at 18 s and at the stall-drop's deepest frame, transform hips/knees/feet/hands/head into plane space against the nose, tail, well floor and walls, wings and cowl; quote the worst signed clearance per kid, all ≥ 0.
3. **Hand-on-geometry** (Rigs row 2): palm centre to rim edge / strut / strap ≤ 0.03 m in A, B and C, at both sample times.
4. **Isabella's side** (`npcs.md` §2.2.1): assert in `flight.test.ts` that `seat(i)` for Isabella has the same sign of z (the plane's left) in all three variants, and that all four sockets differ per variant and lie inside the plane's bounding box.
5. **Pennant continuity and direction** (T-65, §0 rule 3): max segment-angle change ≤ 0.08 rad per 1/60 s at wind 1; pitch ≤ −70° at wind 0; tip aft of root in plane space for 240 frames at wind 1; swing amplitude 0.08–0.4 rad; tip below root at roll-out.
6. **Parked call unchanged** (§0 rule 10): grep the Bog, Desert and Frozen for `plane.update(` and confirm the one-argument call still compiles and still animates (wind 0 sway non-zero over 120 stepped frames).
7. **Shared-file frames** (§0 rule 10): `bog-night-plane-04`, `desert-noon-plane-04`, `frozen-night-plane-04` read against `<scene>-round1-03-02.png` — only the well and the pennant differ — plus the nine-frame sweep.
8. **Canon lettering and the step** (`npcs.md` §2.2.1, §2.3.1): read a side-on frame and state whether `The Green Meanie` lettering and the north-side step survive the well; if the demo never drew the lettering, report it rather than adding text.
9. **Facing** (T-26): read `flight-golden-seats-{a,b,c}-04` and confirm every kid faces forward (+x) and no back-of-head close-up.
10. **World-space UI and the flourish veto** (Misc rows 1 and 4): no selection ring on the fuselage or wing in any seat frame; `ssKey('x')` while seated in each variant produces no ribbon.
11. **Curve centre** (T-27/T-41): at the seat framings the kids, the plane, the strap and the pennant are not vertically separated.
12. **Key collision** (`STUDY_NOTES.md` §6 rule 8): grep `_shared/scene.ts` and `flight-golden/` for the `N` binding before adding it; quote the grep.
13. **Frames and saves** (§0 rule 11, T-29, Process row 1): all nine flight frames lowercase with `-04`, `?t=golden` explicit, saved ≥ 12 s after navigation, none 58,885 bytes.
14. **Suite** (Working Rule 7): trim first (39 total, 9 in `flight.test.ts`), add ≤ 3; `npm run check` green with the suite count stated.

## 3. Not applicable, considered

- **T-37** (`story-dependent`: CS-04's 14–18 s against a circuit) — the schedule is not touched by this brief; the 18 s sample time is inside the existing ride.
- **T-48** (the look-around, built round 1) — the seat frames use `ssOrbit`, not the drag; only confirm the ride is unchanged with no drag.
- **T-09 / T-22 / T-16 / T-19** (scatter density, litter colour, fog ranges) — no ground, scatter or keyframe is authored here; the three parked-plane frames are read against round 1 for exactly this reason.
- **T-43** (non-indexed `IcosahedronGeometry` displaced per index) — the well, rim and pennant are boxes and quads, no displaced rock.
- **T-35 / T-36 / T-44 / T-47** (hit-stop's clock, the ribbon sweep, sprint lock, station walkability) — no combat, no walking and no station placement in the flight.
