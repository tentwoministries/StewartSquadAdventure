# Motion tempo notes (Andrew, 2026-09-07)

What the reference frames cannot show and the game must get right: **everything moves at a perfect, unhurried tempo.** Andrew's words, filed here so they bind Phase 1 and every later polish pass. These are reference notes, not a design file; the Design Bible rows that carry them are listed at the end, and a `needs-render` tweak row (T-06) points here.

## The observations

- **The windmill** (Clover Fields) turns at "the warmest, perfect rotation speed": slow enough to be restful, fast enough to be alive. Nothing in the world spins faster than a windmill sail.
- **The clouds** drift. You do not see them move; you notice they have moved.
- **The butterfly** flaps slowly and moves smoothly: the wing beat is slow, the path is a lazy curve, and nothing about it is twitchy.
- **Everything is at a perfect speed and tempo.** The subtleties are the point: smooth gameplay mechanics, no jitter, no pops, motion that eases in and out.

## What this means in numbers (working values for the studies; Phase 1 tunes them on real frames)

| Thing | Tempo | Note |
|---|---|---|
| Cloud drift | 0.4 m/s, bob ±0.4 m over 25 s | `world-events-weather.md` §2.6 already says 0.4 m/s; the sandbox uses it |
| Windmill (if the Forest gets one) | one turn per 14–18 s | about the reference's rate; sails ease, never snap |
| Butterfly wing beat | 1.6–2.2 beats/s, path a Lissajous curve of 4–6 m, 0.6 m/s | slower than a real butterfly on purpose |
| Firefly blink | 0.35–0.7 Hz, smoothstep, no hard on/off | the sandbox's fireflies |
| Grass sway | two incommensurate sines (1.3 and 2.9 rad/s) | never a single sine (reads mechanical) |
| Lantern swing | 0.6 rad/s, ±3° | `camp.md` §2.2 #6 |
| Campfire | 8.8–10 Hz flicker on one shared oscillator (light and flame agree) | `world-events-weather.md` §2.8.3 |
| Smoke | 0.8 m/s rise, 4 m column | `camp.md` §2.7.1 |
| Deer | 1.0 m/s walk, 90 s loop, 12 s grazes | `camp.md` §2.11.6 |
| Idle breath | 1.5 rad/s chest scale ±1.5 % | `heroes.md` §2.7.4 (v27 verbatim) |
| Camera follow | damped, slight look-ahead; no snapping | Brief §4.5 |
| Ease rule | every value that changes state eases over ≥ 0.15 s; nothing pops | new, from this note |

## Where it lands in the bible (for the application step)

- `world-events-weather.md` §2.4.2 (particle recipes and motion signatures), §2.6 (clouds), §2.7.1 (animals): add the tempo column values above where they are missing.
- `camp.md` §2.5 (motion and light rules): add the ease rule.
- `heroes.md` §2.4.1 (shared timings): already carries the breath and blink; add "no pops" as a rule.
- `docs/PHASE_0.75_TWEAKS.md` T-06 (`needs-render`): the Phase 1 visual loop scores motion life against this file.
