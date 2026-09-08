# Task: The Long Causeway — the reel fixes, round 1 (`REEL_FIXES_BRIEF.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/reel-fixes-bog-03.md`. Rows: **T-49, T-50** in `docs/design/PHASE_0.75_TWEAKS.md`. Round suffix: `-03`.

## What and why

Andrew, reel 2: the frogs "just land in the water and sometimes overlap another frog, who seems to never move"; and the figure at the end of the pier "looks odd — a person or a lamp stand?" It is Mistweaver Fern, a canon NPC, and she does not read as one.

## Files you may touch

`sandbox/bog-night/creatures.ts`, `sandbox/bog-night/flora.ts`, `sandbox/bog-night/props.ts`. **Not** `main.ts` (another builder owns its `place` and stations this round) — if you need a station for Fern's close-up, frame it through `ssOrbit` in the probe and propose the numbers in your report. Not `terrain.ts`, not `_shared/`.

## The fixes

1. **T-49, frogs on real pads.** `flora.ts` scatters lily pads (`items['pad']`, `items['flower']`) and `creatures.ts` sits eight frogs on eight hard-coded coordinates that are not pads. Export the pad positions (with a `flower` flag) from `makeFlora()`; `makeCreatures` takes them and (a) seats each frog on a distinct pad within 12 m of the causeway/jetty so the frogs stay near where the kid walks, (b) chooses a jump target among **free** pads within 4.0 m (occupancy tracked, including pads a frog is mid-air toward), flowered pads allowed, (c) guarantees every seated frog's pad has ≥ 2 other pads within 4.0 m (choose seats from the connected part of the pad graph; if flora gives too few, add pads in `flora.ts` near the causeway, in the same scatter style, not a grid), (d) gives any frog that has not jumped for 20 s a jump on its next tick. Jump arc and landing ripple stay. `main.ts` passes nothing new if you thread the pads through `makeFlora()`'s return and `makeCreatures(pads)` — check the call site in `main.ts` (read only) and if the signature change needs a `main.ts` edit, make exactly that one-line edit to the `makeCreatures(...)` call and nothing else there.
2. **T-50, Fern reads as a person.** Rebuild her in `props.ts` at the same spot and facing: hunched, about 1.5 m tall, a hooded head with a visible face (skin sphere, two dark eye boxes, the hood as an open cone or a bent cylinder behind the head, not over it), a robe body, two arms — the right on the hooked staff (the lantern keeps hanging from the hook, swinging as now), the left holding the robe or raised a little — and a slow sway (a 0.04 rad lean on two incommensurate rates, Tier-0 rule 3). The reed fringe can stay as her skirt's hem. She faces the causeway as now (`yaw(160)`). Keep her footprint (`fp(...)`) and the lantern's light budget unchanged.

## Acceptance checks (quote the numbers)

Harness on :5173 (already up), `?step=1`, wait 12 s, expose `ssProbe.frogs()` returning each frog's position, pad index, jump count and whether airborne.

1. **Frogs:** `bog-night/?shot=S1&t=night&step=1`, `ssStep(7200)` (120 s) sampling every 60 frames: (a) at no sample are two *seated* frogs within 0.5 m of each other; (b) every seated frog is within 0.25 m of a real pad centre; (c) every frog's jump count ≥ 4 at 120 s and no gap between jumps exceeds 20 s; (d) the longest jump ≤ 4.0 m. Quote min/max/counts. Then walk Collette to within 3 m of a frog (`w`, step) and confirm the flee-jump fires within 1 s.
2. **Fern:** `bog-night-fern-03` from a study framing through `ssOrbit` (target her head, d ≈ 5, pitch 12) and `bog-night-s4-03` at the jetty station with `ssStep(120)`. Read both in one line each: head, face, hood, two arms, the staff in a hand, the lantern on the hook. Report her height (bounding box) and the sway amplitude measured over 200 frames (max lean in rad).
3. Frames `bog-night-s1-03` and `bog-night-l1-03` (`?t=night`, card on) for Andrew's pass.
4. `npm run check` green.

## Shared docs

Append only, one edit per file, re-read first: `LOG.md` (heading `## Reel fixes round 1 — the Bog`), `DECISIONS.md`, `LESSONS.md` (a Rigs or Misc row for the frogs: a creature's hop targets are the rendered props, occupancy tracked). No new tweak rows.

## Definition of done

Checks quoted, frames read, docs appended, a report with files and lines, results, deferrals, and the proposed Fern close-up station numbers. Do not commit.
