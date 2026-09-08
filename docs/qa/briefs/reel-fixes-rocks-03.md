# Task: the torn rocks — the reel fixes, round 1 (`REEL_FIXES_BRIEF.md` §2)

Written 2026-09-08 by the orchestrator (Fable). Agent: `sandbox-builder` (Opus, high). Rule sheet: `docs/qa/rules/reel-fixes-rocks-03.md`. Row: **T-43** in `docs/design/PHASE_0.75_TWEAKS.md`. Round suffix: `-03`.

## What and why

Andrew's son saw it: the boulders by the camp, the rocks in the stream (in the Forest and in Home, Wrong, which imports them) and the Hearth's boulders are see-through — "the triangles come off and you can see through the unmet seams". The cause (verified, Rule 2): `new THREE.IcosahedronGeometry(s, 1)` in three r185 is **non-indexed** (240 vertices, three per face); every builder displaces vertices *by index* (`p.setXYZ(i, x·k, y·k, z·k)` with a fresh random per i), so the three copies of one corner move apart and the faces separate. The caves' shell does the same to a detail-3 icosahedron (`caves-descent/terrain.ts`, the `dp.setXYZ(i + k, …)` loop with `jit` drawn per k).

## Files you may touch

New: `sandbox/_shared/rock.ts`. Edit: `sandbox/forest-dusk/props.ts` (the two boulders, ~line 224), `sandbox/forest-dusk/terrain.ts` (`makeStreamRocks`), `sandbox/frozen-night/flora.ts` (`boulderGeo`), `sandbox/caves-descent/terrain.ts` — **only the shell's jitter loop** (the `for (let i = 0; i < dp.count; i += 3)` block); another builder is editing the column and stair code in that same file in parallel, so make exactly one `Edit` there with an `old_string` confined to that loop, and re-read the file right before it. New test: `tests/unit/sandbox/rock.test.ts`. Do not touch `_shared/material.ts` or any other scene.

## The fix

1. `rock.ts` exports `displace(geo, r, amounts)` (or a name you prefer): for a non-indexed geometry, group vertices by quantised position (1e-4), draw one random scale per group, apply it to every vertex of the group, then `computeVertexNormals()`. The look stays flat-shaded (non-indexed) — the same faceting as today, just with the corners agreeing. Also export `assertClosed(geo)` (or the test does it): every undirected edge (by quantised positions) is shared by exactly two faces.
2. Replace the per-index loops in the four places with the helper. Keep each site's amounts (the Forest 0.85–1.15 / 0.7–0.9, the stream 0.9–1.1, the Hearth 0.85–1.15 / 0.65–0.85, the shell ±4 % / ±2.5 %) and its colour rules (the Hearth's snow caps by normal, the Forest's moss).
3. Do not change any rock's position, count or seed order more than the helper forces (the `rng` draw order will change; that is fine, say so).

## Acceptance checks (quote the numbers)

1. **Closed surfaces:** `rock.test.ts` builds each rock recipe's geometry (import the helper, reproduce each site's amounts) and asserts zero edges with a face count ≠ 2, before and after displacement; and that a *by-index* displacement of the same icosahedron (the old bug, reproduced in the test) reports > 0 open edges — the test proves the defect and the fix. Also assert the caves' shell jitter leaves the detail-3 icosahedron closed.
2. **Frames:** `forest-dusk-rocks-03` (the Forest's own `ssSave` at S2, the stream rocks in frame; check `forest-dusk/main.ts` for how it saves), `shadow-wrong-rocks-03` (`?shot=S1&t=wrong&step=1`, the boulders by the camp, `ssStep(120)` first), `frozen-night-rocks-03` (`?shot=S1&t=night&step=1`), `caves-descent-shell-03` (`?shot=W1&step=1`, the whole shell). Read each: no light through any rock or the shell. Where a rock is small in frame, add a study framing through `ssOrbit` (set `ssOrbit.current` and `apply()`) and save it too.
3. **One frame per scene (Tier-0 rule 10, a `_shared/` file was added):** the nine default stations, `<scene>-rocks-03`, each read in one line.
4. `npm run check` green (the new test included; state the suite count).

## Shared docs

Append only, one edit per file, re-read first: `LOG.md` (heading `## Reel fixes round 1 — rocks`), `DECISIONS.md`, `LESSONS.md` (a Light/materials or a new Geometry row: non-indexed geometry displaced by index tears; displace per unique position; assert closed). No new tweak rows.

## Definition of done

Checks quoted, frames read, the test in, docs appended, a report with files and lines, results, deferrals. Do not commit.
