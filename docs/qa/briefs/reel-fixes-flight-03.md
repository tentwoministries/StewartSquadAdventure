# Task: the flight's look-around — the reel fixes, round 1 (`REEL_FIXES_BRIEF.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/reel-fixes-flight-03.md`. Row: **T-48** in `docs/design/PHASE_0.75_TWEAKS.md`. Round suffix: `-03`.

## What and why

Andrew, reel 2: "Looks great! … adding the ability to move the view around with the mouse might be helpful, because it looks so cool. But it might be best to just let it be a ride." Decision (orchestrator, Brief §2): an *optional* look that returns on its own — a drag orbits the chase camera round the plane, and 2 s after the drag ends the view eases back to the chase frame. No drag, no change: the ride is byte-for-byte what it was.

## Files you may touch

`sandbox/flight-golden/flight.ts`, `sandbox/flight-golden/main.ts`. Not `_shared/` (the orbit's mouse handlers in `_shared/orbit.ts` keep writing `ssOrbit.current` even while the scene drives the camera; read that offset rather than adding handlers of your own — check what `makeOrbit` exposes and how `main.ts` currently ignores it during the ride).

## The fix

While `ride` is set (`CH`, `WG`, `ED`), `flight.chase(camera, ride)` places the camera. Add a look offset: read the orbit's yaw/pitch delta from the station's yaw/pitch (the mouse handlers already accumulate into `ssOrbit.current`), apply it as a rotation of the chase camera about the plane (yaw free; pitch within the orbit's own clamps), and when no drag is active (`mousedown` … `mouseup` — detect through the orbit's `current` changing, or expose a `dragging` flag if `orbit.ts`'s API already has one; do not edit `orbit.ts`) ease the offset back to zero over 2 s starting 2 s after the last change (Tier-0 rule 3: a smoothstep, nothing pops). `R` resets the offset at once (the orbit's own `reset` already resets `current`; make sure the chase reads it). The `LD` station is unchanged (it is already a real station with the orbit live).

## Acceptance checks (quote the numbers)

Harness on :5173 (already up), `flight-golden/?shot=CH&t=golden&step=1`, wait 12 s.

1. **The ride is unchanged without a drag:** save `flight-golden-ch-03` at scene time 6.0 s and 14.0 s (`ssStep` to the exact frame) before your change (`git stash` is not allowed: save the "before" frames first, then edit) and after; the PNGs' md5 are identical, or differ only in the card's clock text if the card carries one (say which).
2. **The look:** at 6.0 s, set `ssOrbit.current.yaw += 60` (the same thing the mouse does) and `apply()`, `ssStep(1)`: the camera's world yaw about the plane differs from the chase frame's by 60° ± 2°. Save `flight-golden-look-03`. Then leave `current` alone and `ssStep(60)` (1 s): the offset is still ≥ 55° (the 2 s hold). `ssStep(120)` more (3 s total): the offset is < 1°; the frame `flight-golden-return-03` matches the no-drag ride at that second within a small md5-distinct tolerance (quote the offset).
3. **The pitch clamp:** `current.pitch = 80` → the applied pitch offset is clamped to the orbit's max (75); quote.
4. **`R` resets:** after a 60° offset, `ssKey('r')`, `ssStep(1)`: offset < 1°.
5. `flight.test.ts` (9 tests) still green untouched; `npm run check` green.

## Shared docs

Append only, one edit per file, re-read first: `LOG.md` (heading `## Reel fixes round 1 — the flight`), `DECISIONS.md` (the hold and ease durations if you change them). No new tweak rows.

## Definition of done

Checks quoted, frames read, docs appended, a report with files and lines. Do not commit.
