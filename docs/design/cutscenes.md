# Cutscenes — Design Bible

**Status:** reviewed by orchestrator 2026-09-06; consistency pass 2026-09-07 (no changes needed) · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** `docs/BRIEF.md` in full (§4.5 twice) · `ATMOSPHERE_RECIPES.md` §19, §2.3, §10.3, §11.5, §13, §15.3–15.5, §18 · `SYSTEMS_INVENTORY.md` Part 2 §13 (L4609–4740), §14.2 (L4807–4843), §16.2 (L5051–5054) · `FAMILY_CANON.md` §2.1–2.2 (L181–245), §3.3 (L399–409), §3.5 (L422–433), §7 (L809–847), §10.1 tips, §12.1 (L1195–1215), §12.3 (L1236–1279), §13.1 (L1417–1432) · `AUDIO_INVENTORY.md` §18–19 (L668–718) · `CONTROL_MODEL.md` L74, L83, L452, L758, L760 · legacy HTML L4626 (bezier), L4747–4908 (scenes 1–4), L5716, L8395, L9265, L9325 (announce colours), grep-verified · `docs/DECISIONS.md` in full.
**Depends on:** `heroes.md` (§2.1.1, §2.3.1, §2.4, §2.5.8, §2.7.3, §5), `enemies.md` (§2.1, §2.7, §2.8), `story-beats.md` (§2.1, §2.2, §2.3, §2.5, §2.6, §2.10, §4, §5, §8), `world-events-weather.md` (§2.1.1–2.1.4, §2.4.3, §2.6, §2.8.2, §5.2), `bosses.md` (§2.3, §2.5, §2.14, §2.16.1, §5.2), `camp.md` (§2.0–2.3, §2.6.1, §2.7, §2.8, §2.9, §2.10, §2.11.5, §2.12, §5.2), `npcs.md` (§2.0, §2.1.6–2.1.8, §2.2, §2.3.4–2.3.7, §2.4.1, §5.2, §5.3). `dungeons.md` was in progress at time of writing (§2.0–2.1 only; its §2.6.6 will own the far light); CS-08 is designed from `story-beats.md` §2.2 and `bosses.md` §2.13–2.16 and handed to it in §5.
**Feeds:** `ui-ux.md`, `audio.md`, `dungeons.md`; consistency items for `camp.md`, `npcs.md`, `bosses.md`, `enemies.md`, `heroes.md`, `story-beats.md`, `world-events-weather.md`.
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

One cinematic rig, shared by boss intros, the combo beat and nine cutscenes, that moves a real camera through the real diorama on the render clock while the sim stands still. Every v27 cutscene beat, line and timing survives; what changes is that the camera can now go where v27 could only paint.

---

## 1. What v27 does

**The shot structure (SI Part 2 §13.1, L4362–4396).** A cutscene is an array of shots `{ duration, onStart, draw(t, duration), onEnd }`. `updateCutscene` advances a timer, fires `onEnd` when a shot expires and `onStart` on the next; `skipCutscene` runs every remaining `onEnd` in order so flags still land. Skip is bound to Space or Enter at the very top of the keydown handler (CM L74, L83). While a cutscene is active the main loop renders the world but never calls `update()`: `gt`, `dayTime` and every timer freeze (L9234). `drawFog()` and `drawDayNightTint()` early-return (AR §2.3): cutscenes own the sky.

**The letterbox (AR §13.2, L4385–4393).** Canvas-drawn bars `60 × cutscene.letterbox` px in **pure `#000`**, growing at `dt × 3` (0.333 s to full), snapping to 0 at the end, with `Press SPACE to skip` in 12 px `rgba(255,255,255,0.4)` centred 8 px above the bottom bar. The boss intro uses a *different* letterbox: DOM bars in `#0B0E1A`, 60 px, 0.5 s ease-out in and 0.4 s ease-in out, a name card with a back-out overshoot at 800 ms, `snd('boss', 0.5)`, and `paused = true` for the full 4.1 s while `screenShake(12, 1)` runs underneath: the world trembles while nothing moves (AR §13.1, SI §14.2). Mini-bosses get a 2.5 s popup card and no bars: the game does not stop (AR §13.1).

**The shared helpers (SI §13.2).** `smoothDamp` (an exponential ease), a pooled ember system drawn `lighter`, and `cineShake`, a second shake channel that decays at 15 units/s and is applied as a screen-space translation.

**The one cutscene: the meteor (SI §13.3, FC §7.1, L4451–5016).** Seven scenes, 24.2 s: First-person calm 4.0 s (Liam's head still, pans, tilts; the three siblings drawn in the background at L4766–4769; music ducked to 0 over 2.5 s) → Sky watch 4.2 s (tilt to full sky `#040410`; the meteor appears on a cubic bezier `cP0 (−0.06, 0.18) … cP3 (1.08, 0.30)` (L4626) at `p > 0.25`; `What is that...?` in `#A8D0E8` for 2 s) → The crossing 4.5 s (the full bezier, 8-layer meteor, trail, smoke, screen embers, flare, star washout, `cineShake` 3 → 12, a warm plate from `p > 0.7`) → The dive 3.5 s (a painted orbital planet with an ocean and three landmasses; the meteor accelerates at `p⁴`; a white flash over the last 10 %) → The impact 1.5 s (cut to the overworld at a crater-framing zoom; white flash, 60 ms freeze, `cineShake 40`, `boom` 0.6, `screenShake(22, 0.9)`, three shockwave rings at 0 / 0.18 / 0.35 s of radius 400 / 320 / 260 px, 40 debris, **1200 pooled embers** in `#1abc9c #7b2d8e #ffffff #e67e22 #ff6b6b #E8A838`) → The aftermath 3.0 s (`smoothDamp` settle, dust haze, purple glow, `A strange light glows in the distance...` in `#8850A8` for 4 s at `p > 0.7`; `onEnd` sets `meteorSeen`, `craterDiscovered`) → The return 3.5 s (zoom and camera lerp back on `ease3`, music back over 2 s). It is the only sky, the only stars and the only planet v27 ever draws (AR §18). Trigger: first dungeon clear, or `F10` in dev mode.

**Authored but never shot.** The four Ed `crash_landing` lines and the four hero `crash_landing` lines exist in data and no code path reaches them (FC §13.1). The crash itself is a random event with no camera (AR §11.5). There is no ending cutscene: the Shadow Queen's death shows `VICTORY!` / `The Stewart Squad saved the realm!` as a DOM overlay (FC §12.3). The title screen is DOM over nothing (SI §16.2). Photo mode does not exist.

**Audio (AI §18).** One stinger and two ducks: the music master gain ramps to 0 over 2.5 s at scene 1, `boom` at the impact, the gain back over 2.0 s at scene 7. SFX are never ducked. Boss cards play `boss` at 0.5 over the music.

**Oddities that matter here.** The two letterbox systems disagree on colour and timing (§13.1 vs §13.2); the cutscene bars are the anti-palette's pure black. `cineShake` is a translation, which is wrong on a first-person or long-lens camera. The `_csZoom` framing math exists only to keep the 3200 px map's edges off screen. The meteor's scene 6 announce lives in `draw`, so a skip loses the line. The tilt-shift and every other post effect are new work (AR §15 3D note).

---

## 2. What it becomes

### 2.0 Cutscene roster

| id | Name | Beat | Length | Skippable | Shots | Flags set on end or skip | New sound hooks (`audio.md`) | The frame a kid remembers |
|---|---|---|---|---|---|---|---|---|
| CS-01 | Third time this week | B1.1 | 68.7 s | yes, armed at 1.0 s | 13 | `story.crashSeen`, `edCrashCount = 1`, `camp.stage = 1`, `world.clock.p = 0.02`, `tutorial.active`; `edMet` stays false | `cs.crash.wind`, `cs.crash.skid`, `cs.crash.gearSnap`, `cs.crash.wingFold`, `cs.crash.propSplinter`, `cs.crash.nightFalls`, `cs.crash.raidDistant`, `cs.crash.cartWheels`, `cs.crash.cageChain`, `cs.crash.dawn` | eight rotations of a yellow biplane seen from inside it, and three lanterns leaving in the dark |
| CS-03 | The meteor | B2.2 | 24.2 s (+ 2.0 s settle) | yes | 7 (+ 1 settle) | `story.meteorSeen`, `story.craterDiscovered`, `world.clock.p = 0.70`, crater state `lit` | `cs.meteor.roar`, `cs.meteor.rumble`, `cs.meteor.settle` | the fire, Ed's face, and a light crossing the sky behind him |
| CS-04 | Flight | B2.4 and every travel | 16–18 s, ≤ 30 s | after the first flight to that island | 8 | `world.currentIsland`, weather committed, `world.flownTo[island]` | `cs.flight.cloudHush`, `cs.flight.wind` | the island shrinking under the wing |
| CS-05 | The Green Meanie lives again | B2.15 | 12 s | yes | 5 | `story.cs05Seen` (`planeState = repaired` is set by the turn-in before it) | none new (`plane.*` hooks are `npcs.md`'s; `victory` 0.3 at the wing-rock) | the loop, then the wing-rock, and four kids waving |
| CS-06 | Some of it is watching | B3.1 | dialogue length (about 40 s) | line by line; hold 0.8 s skips the block | 7 (+ 1 settle) | `story.edCraterDialogue` | `cs.crater.pulse`, `cs.crater.bed` | Gran's line with the shard hanging over the crater |
| CS-07 | Something pulses | B3.2 | 10 s | yes | 4 | `story.portalOpen`, `world.islandUnlocked.shadow` | `cs.portal.rise`, `cs.portal.pushWind` (`portal` 0.4 is v27) | the camera leaving the fire and flying to the crater |
| CS-08 | Home, wrong | B3.3 | 8 s | yes | 3 | none (`currentIsland = shadow` is set on entry) | `cs.shard.arrive` | four kids turning to one warm light on a black horizon |
| CS-10 | Lights in the dark | B3.5 | 52 s | yes | 12 | `camp.stage = 7`, `world.clock.p = 0.54`, `world.currentIsland = forest`, the party seated, the plane on its crossing | `cs.ending.dawn`, `music.ending` | the last frame: the title over the camp |
| CS-11 | Third time this week, again | B4.1 | 44 s | yes | 9 | as CS-01 plus `story.sibsRescued = 3`, `story.squadAssembled` (so `camp.stage = 2`), tutorial off | CS-01's hooks | the same crash, with four kids climbing out |

Not cutscenes but on the same rig: **`bossIntro`** (4.1 s, `bosses.md` §2.3, lifted in §2.3 below), **`comboBeat`** (1.4 s, `heroes.md` §2.5.8), **`nudge`** (the guardian wake's 15 % ease, `enemies.md` §2.7; also the `Sit` lean-in and the ×1.25 boss-arena blend), **`photo`** (§2.8). The mini-boss popup uses no camera at all.

### 2.1 Conventions

- **Scale and axes.** 40 px = 1 m (`heroes.md` §2.5.1). Island-local metres, origin at the camp fire, `+x` east, `+z` south, `+y` up; bearings clockwise from north (`−z`), as `camp.md` §2.0. Positions on other islands are that island's local frame (`story-beats.md` §2.2).
- **Camera notation.** `cam (x, y, z) → aim (x, y, z), FOV n°` for a free pose; `rig { target, d, pitch, yaw }` for a pose derived from the gameplay orbit (`camp.md` §2.11.5's formula). Pitch is positive looking down. The gameplay camera is vertical FOV 35°, pitch 45–55°, 19–20 m; a hero is one-eighth of frame height there.
- **Clocks.** The **sim clock** never runs inside a cutscene. The **presentation clock** (render `dt`, capped at 50 ms) drives everything a cutscene shows. Shot times are presentation seconds from the shot's start; cutscene times (`t =`) are from the cutscene's start.
- **Tokens.** New names are `cs.*`; Brief §4.2 hexes and the tokens of earlier files are the roots. Every hex below that is not new is cited to its source.

### 2.2 The rig

#### 2.2.1 Modes and ownership

One module, `src/engine/camera/cinematic.ts`, owns the camera whenever the gameplay orbit does not. Modes: `cutscene`, `bossIntro`, `comboBeat`, `nudge`, `photo`. Only one mode runs at a time; `bossIntro` and `comboBeat` refuse to start inside a cutscene (a cutscene never contains a boss), and a cutscene queued during either waits for it to end. Every mode ends by **blending back to the gameplay rig** over a stated time (0.5 s unless the shot says otherwise); the gameplay rig's target, yaw and distance are captured at entry and restored, as v27 captured `cam` and `WORLD_ZOOM` for scene 7.

#### 2.2.2 The shot as data (v27's shape, kept)

```ts
interface Cutscene {
  id: 'CS-01' | 'CS-03' | ... ; skip: SkipRule;            // §2.2.7
  shots: Shot[]; skipCard?: ShotId;                          // the frame shown on skip
  saveBefore: boolean; saveAfter: boolean;                    // §2.2.9
  onEnd(): void;                                              // flags that must land even on skip
}
interface Shot {
  id: string; duration: number;                               // seconds, presentation clock
  camera: CamMove;                                            // §2.2.3
  transitionIn: 'cut' | 'blink' | 'flash' | 'fade' | 'none';  // §2.2.4
  action: Action[];                                           // puppets, props, fx, clock, announces
  captions: Caption[];                                        // §2.2.5
  sound: Cue[];                                               // by name; recipes are audio.md's
  sky?: SkyOverride;                                          // §2.2.10
  onStart?(): void; onEnd?(): void;                           // v27 semantics: skip runs every remaining onEnd in order
}
```

`draw` from v27 becomes the player's per-frame evaluation of `camera`, `action` and `captions` against the shot clock; `onStart` / `onEnd` keep their meaning exactly, including the skip rule. Actions are data verbs, not code: `place(actor, pos, facing)`, `play(actor, clip, at, loop?)`, `walk(actor, path, speed)`, `lookAt(actor, target)`, `plane(pathSpec)`, `prop(id, state)`, `fx(recipe, at, count)`, `shake(magnitude, seconds)`, `cineShake(intensity)`, `light(token, at, intensity, range, seconds)`, `announce(text, colour, seconds)`, `clock.set(p)`, `flag.set(name, value)`, `camp.stage(n)`. An `Action` fires at its `at` time once and, if it has a duration, runs to its end or the shot's end.

**Puppets.** A cutscene never moves a sim entity. It hides the real entity (hero, Ed, the plane, an animal) and drives a **puppet**: the same mesh and rig, parented to the cutscene, animated on the presentation clock by the action list. At the cutscene's end the real entity is placed where its puppet stands (or where the shot table says) and the puppet is released. Enemies are never puppets; hostile silhouettes in a cutscene (CS-01's raid) are cutscene props on the Runt rig with a single looped clip.

#### 2.2.3 The move vocabulary (eight moves; nothing else is allowed)

| Move | What it is | Parameters | Used for |
|---|---|---|---|
| `cut` | an instant pose | `to` | every shot start unless another move begins mid-shot |
| `hold` | a fixed pose; the world moves, the camera does not | `to`, optional `aimTrack: actor` (the aim follows a subject; the position does not) | the long lens on the Ridge, the strip end, the cockpit reverse |
| `push` | translate along the aim line toward or away from the aim point | `from`, `to`, `ease` | closing on a face; CS-07's flight to the crater |
| `dolly` | translate on a path with the aim held on a point or subject | `path`, `aim`, `ease` | the skid, the walk home |
| `crane` | rise or fall with a pitch change, optional yaw | `from`, `to`, `ease` | CS-08's reveal; CS-06 line 3 |
| `orbit` | yaw around a target at fixed distance and pitch | `target`, `d`, `pitch`, `yaw₀ → yaw₁`, `ease` | around the fire in CS-10 |
| `follow` | attach to a moving subject with an offset and damping | `subject`, `offset` (subject-local), `damping` (0.15–0.6 s), `aim` | the plane in flight, the cockpit |
| `first` | first person from a head bone; yaw and pitch choreographed | `actor`, `bone`, `yaw(t)`, `pitch(t)` | CS-03 scenes 1–3 |

Eases: `linear`, `ease3` (v27 smoothstep), `easeIn2`, `easeOut2`, `smoothDamp(k)` (v27's `exp(−k·dt·10)`). A move may not change FOV by more than 6° per second; a shot may not contain two moves. Reduced motion (§2.2.8) collapses every move except `cut` and `hold` to a `hold` at `to`.

**Lens rule.** Vertical FOV is never below **24°** or above **50°**; the gameplay lens is 35° and most shots sit within 30–40°. Why: below 24° the diorama flattens (a long lens compresses the facets that carry the look, the tilt-shift band has no depth to separate, and the curved-world roll-off shows as a visible bend across the frame); above 50° the chunky heads stretch at the frame edge and a 1.14 m child three metres away reads as a fisheye. Keeping every cut within a 26° band of the gameplay lens is what makes a cutscene feel like the same world seen closer, not a different renderer.

**Shake.** `screenShake` ports as AR §10.3's ladder applied after the move (translation dominant, ±0.3° roll scaled by the same envelope). `cineShake` becomes **rotational only**: yaw and pitch jitter of `±0.05° × intensity`, decaying at 15/s (v27's rate), because a head-mounted or long-lens camera that translates looks broken while one that trembles looks afraid. Both obey `settings.screenShake`.

**Cinematic DoF.** The tilt-shift (`world-events-weather.md` §2.4.3) runs at **half strength** in every cutscene (max blur 1.25 px at 1080p), its band centred on the shot's `focus` (an actor or a point), not the active hero. It is **off** in `first` shots (an eye has no tilt-shift) and in sky-only shots (CS-03 scenes 2–4), where bloom runs at ×1.5 instead. `photo` mode replaces it with a real focus control (§2.8).

#### 2.2.4 How cuts are hidden

| Transition | What | Colour and timing | Rule |
|---|---|---|---|
| `cut` | a straight cut | 0 s | only **on action**: at a movement's peak or a sound's attack (the impact, a hop, a head turn, a door), or as a **match** (the same subject centred in both shots) |
| `blink` | a dip to dark and back | `cs.blink` `#0B0E1A`, 0.06 s down, 0.06 s up | hides a set swap (C0 → C1 at dawn) or a time skip (CS-10's dawn → golden hour); never pure black |
| `flash` | a white plate | `cs.flash` `#FFF8E8`, 0.1 s in, 0.4 s out | the impact; the stall-drop's backfire; the portal's white-out (violet variant `#A862C4` for CS-07 → CS-08) |
| `fade` | to or from dark | `#0B0E1A`, 0.6–1.5 s | only at a cutscene's outer edges when it joins a DOM overlay (the title into CS-01; the victory stats into CS-10) |
| letterbox in | the bars themselves | §2.2.6 | the transition from gameplay into every other cutscene; there is no fade |

#### 2.2.5 Captions (the contract for `ui-ux.md`)

Two caption styles. Both are DOM in the letterbox layer, never HUD.

| Style | Layout | Type | Timing |
|---|---|---|---|
| **line** (a character speaks) | bottom, 24 px above the bottom bar; portrait 96 px desktop / 64 px mobile at the left (the `npcs.md` §2.1.7 atlas tile for the mood), ring in the speaker's colour; name then text on one baseline | name in the speaker's colour (Ed and NPCs `ui`, kids `hero.<kid>.glow`) 16 px; text `#EDE3CF` (`camp.cream`) 20 px desktop / 17 px mobile, one line, max width 60 % of frame (wraps to two on phones and is still one caption) | typewriter at 120 cps with `dlg.blip.<who>` (the `npcs.md` §2.11 rate); on screen **`clamp(chars × 0.06, 2.2, 5.5)` s** from the first character; 0.3 s fade; captions never overlap; 0.2 s gap minimum |
| **announce** (a world string) | centred, 18 % from the top (under the top bar), a `#0B0E1A` 60 % pill | 22 px in the string's own v27 colour | the string's v27 duration |

Every announce a cutscene shows is a canon string with its v27 colour and seconds (§2.4–2.9 cite each). The HUD announce channel is suppressed during a cutscene; strings the cutscene does not list are queued and fire on control return.

#### 2.2.6 The letterbox

DOM bars, one component, two presets:

| Preset | Height | In | Out | Used by |
|---|---|---|---|---|
| `bars.cinema` | 5.6 % of frame height (60 px at 1080p) | 0.5 s ease-out | 0.4 s ease-in | every cutscene; `bossIntro` |
| `bars.punch` | 12 % | 0.15 s | 0.5 s | `comboBeat` only (`heroes.md` §2.5.8; a punch-in for a 1.4 s beat) |

Colour `cs.bar` = `#0B0E1A` (`--bg-0`, AR §13.1) for both. v27's `#000` cutscene bars and its 0.333 s in-time are retired (§6). Layer order, bottom to top: the WebGL canvas → bars (z 55) → captions and the skip prompt (z 56) → cards (name card, title card, skip card; z 57) → the dialogue box in CS-06 (z 58). Nothing from the HUD is drawn while bars are up.

#### 2.2.7 Skip

- **The prompt.** `Press SPACE to skip` (canon, FC §12.3 L4393) is the keyboard variant; `ui-ux.md` composes the pad and touch variants from the live binding (`Press A to skip`, `Tap to skip` **[new text]**). 13 px `#EDE3CF` at 45 % alpha, centred 8 px above the bottom bar (v27's position).
- **Arming.** The prompt appears and skip is accepted from **1.0 s** after the cutscene starts, and only on a fresh press (a key held from the title's `START ADVENTURE` cannot skip CS-01).
- **What a skip does.** Runs every remaining `onEnd` in order, then the cutscene's `onEnd` (v27 semantics): every flag in the roster lands. Announces that the world state needs (`A strange light glows in the distance...`, `Grandpa Ed has crash-landed!`, `A mysterious portal appears...`) are moved into the owning shot's `onEnd` so they fire on skip too (v27 lost them; §6). Then the **skip card**: the cutscene's named final frame is cut to and held 1.5 s with its card (CS-01: the dawn frame with `Stewart Camp` / `Tent, fire, one bedroll. For now.`; CS-10: station S5 with the title), and the bars go out over it. A skip never shows a black screen.
- **Per-cutscene rules.** CS-04 shows the prompt only after the first flight to that island **and** only while `dest.ready` (a skip cannot outrun streaming; the prompt simply is not there yet). CS-06 has no prompt: the dialogue box's hold-0.8-s skip closes the block (`npcs.md` §2.11). `bossIntro` and `comboBeat` cannot be skipped (`bosses.md` §2.3).
- **Multiplayer.** Any player's press is a vote; the cutscene skips when every connected player has voted, or when the **host** has voted and 5.0 s of the cutscene have elapsed. The prompt shows ` · N/M` after the string while votes are pending **[new text]**. Rationale in §6.

#### 2.2.8 Reduced motion

`settings.reducedMotion` (Brief §6): every move except `cut` and `hold` becomes a `hold` at the move's `to` pose, with the same shot durations, so the cut rhythm is unchanged; `first` shots become three held head poses cut at the choreography's key times; `screenShake` and `cineShake` are off; `flash` runs at half alpha; the bars appear over 0.2 s. World motion (the plane's four sources, cloth, smoke, embers, the crater's pulse) is untouched: it is the world, not the camera. `bossIntro` and `comboBeat` follow their own files' reduced-motion rows.

#### 2.2.9 Autosave and the sim

- **Render, do not simulate.** The fixed step does not run. `world.clock` is frozen (`world-events-weather.md` §2.1.1). What keeps moving, on the presentation clock: cloth (capes, scarves, tent, bunting), every particle system, tree and grass sway, the water shader, cloud drift, the torch, campfire and crater oscillators, the plane's four motion sources (`npcs.md` §2.2.3), puppets' clips, blink and breathing on every rig in frame. Enemies are frozen and hidden if inside the camera footprint. Nothing takes damage, nothing spawns, no timer counts.
- **Saves.** `saveBefore`: CS-03, CS-06, CS-07 (a reload replays the beat from its arming). `saveAfter`: CS-01, CS-03, CS-04 (after park), CS-05, CS-06, CS-07, CS-10, CS-11, written 500 ms after `onEnd` (the v27 rescue-autosave rhythm). CS-08 has neither: the last Forest-island save stands and re-entering the portal replays CS-08 (`story-beats.md` §4). Never a save mid-cutscene (`npcs.md` §2.3.5).
- **Interrupt gate.** A cutscene that is not the opening starts only when no fight, dialogue, boss, event or flyover is running (AR §11.5's rule, kept by `story-beats.md` §3); it calls `events.reserve('cutscene', length + 10)`.

#### 2.2.10 Cutscenes own the sky

`sky.override(spec, blendIn)` sets the dome, key, hemisphere, fog and star alpha to a named keyframe or a custom set for the cutscene's duration; `sky.release(blendOut)` returns to the clock's keyframe. Because the clock is frozen, a cutscene that *should* move time sets the clock in its `onEnd` (`clock.set(p)`) so the release is a no-op: CS-01 ends at dawn (`p = 0.02`), CS-03 at night (`p = 0.70`), CS-10 at golden hour (`p = 0.54`). Per-shot overrides may also change fog (`far` to 220 m for CS-10's view of the camp), shadows (off for CS-03 scene 4), and the curved-world amount (0 for scene 4). The Shadow Realm's locked `shadow.wrongDusk` needs no override (`world-events-weather.md` §2.1.4).

**Named sky sets (new tokens).**

| Token | Zenith · horizon · ground | Stars | Used by |
|---|---|---|---|
| `cs.meteorSky` | `#040410` · `#182040` · `#0E1230` (the v27 scene 3 gradient, L4811–4814) | 1.0 | CS-03 scenes 2–4 |
| `cs.void` | `#030308` flat (L4856) | 1.0 in the upper 60 % → 25 % of frame (v27's shrinking zone) | CS-03 scene 4 |
| `cs.craterDusk` | the Forest `dusk` keyframe held | 0.4 | CS-06 |

Every cutscene frame still carries at least five of Brief §4.4's layers (checked per cutscene in §3).

### 2.3 `bossIntro`, the reveal clips, `nudge`, the popup

**`bossIntro`** is `bosses.md` §2.3, lifted verbatim as this rig's mode; the timeline is that file's contract and is restated here only so an implementer has one place to look:

| t (s) | Sim | Camera | Screen | Sound |
|---|---|---|---|---|
| 0.00 | frozen (v27 `paused`) | blend 0.3 s to the **boss rig**: pitch 32°, yaw = the active hero's facing toward the boss ± 25° (the side that shows the signature shape), distance so the boss fills 45 % of frame height with the active hero in the lower third; then `push` to 0.72 × distance over 1.5 s (v27's 1.4 zoom), hold | `bars.cinema` in | `screenShake(12, 1.0)` under the frozen frame |
| 0.80 | frozen | hold | name card from the right, back-out overshoot 0.6 s, `border-left 4px` in the card colour, glow in the card colour, subtitle `#aaa` | `boss` 0.5 |
| 1.60 | frozen | hold | the `boss_appear` line as a bubble over that hero in their `glow` and an announce in the same colour | — |
| 3.20 | frozen | hold | card out 0.6 s | — |
| 3.60 | frozen | blend back 0.5 s to the gameplay rig at the ×1.25 arena distance | bars out | — |
| 4.10 | resumes | gameplay | the spawn announce | the boss clock starts |

**The camera side of the nine reveal clips** (the clips are `bosses.md`'s; the rig chooses where to stand):

| Boss | Reveal clip (bosses.md) | Boss-rig deviation | Why |
|---|---|---|---|
| Goblin King | crashes through the palisade, plants the cage pole | yaw from the palisade side so the break-through comes toward the camera; the cage pole enters the top third | the pole is the fight's object; it must be seen going up |
| Ancient Treant | eyes open, canopy shakes | pitch 40°, distance so 5.5 m fills 45 % | the eyes are at the top of a tall rig |
| Pharaoh Wraith | lid slides, he rises to hover | yaw so the lid slides toward the camera; the rise fills the push | the push and the rise agree |
| Hydra Matriarch | surfaces head by head | pitch 28° (lower), the pool's surface across the lower third | heads rise into frame instead of appearing in it |
| Frost Lich | descends from the lens on a frost column | pitch 45°, aim 1.5 m above the floor | the lens is above; the descent needs headroom |
| Crystal Colossus | assembles from the rim crystals | distance ×1.3 (the rim shards in frame), then the standard push | the assembly is the room, not the body |
| Citadel Warden | turns from the door, seams ignite | yaw with the door behind him | the door is what opens when he dies |
| Shadow Queen | rises from the throne, her shadow first | yaw so the hearth wall is behind her; the real fire's far glow in the window stays in frame | her shadow needs a wall; the far light is the story |
| Magma Titan | v27's drop-in: 0.8 s fall, `screenShake(15, 0.7)`, `boom` 0.6 | pitch 20° (low), aim 2 m up, no push until he lands | a fall reads vertically only from low |

**`nudge`.** A temporary multiplier on the gameplay rig's distance and pitch with no bars and no freeze: the guardian wake (`enemies.md` §2.7: ×1.15 over 0.4 s, back over 1.5 s), the camp `Sit` (`camp.md` §2.7.4: to 17 m and 42° over 1.5 s), the boss-arena ×1.25 blend (`bosses.md` §2.1.1) and stargazing's 25° tilt (`world-events-weather.md` §2.7.3) are all `nudge`. It is interrupted by any other mode.

**Mini-boss popup.** No camera change, no bars, no freeze (AR §13.1). The `nudge` above is the only motion, and only for guardians.

### 2.4 CS-01 Third time this week (68.7 s)

**What it must do by staging alone (no new lines):** the family in the plane; the crash; five people climbing out; the eight `crash_landing` lines in `story-beats.md` §2.5's order; night; goblins on the Ridge; three cages on carts leaving; Liam down beside the ember ring; dawn. It is also the tutorial's first five minutes' premise: a kid who watches knows who is missing, that carts went three ways, and that Grandpa and the plane are still here.

**Set.** The Forest island at dusk (`p = 0.65`). The plane is `npcs.md`'s full `repaired` body (steel propeller, green rudder, cowling closed): the kid sees the whole aeroplane before it breaks. Ed in the rear cockpit, goggles down, scarf streaming; the four kids on the bench (Isabella left; `npcs.md` §2.2.1). Camp stage **C0** (`camp.md` §2.1) is not yet placed: Crash Meadow is empty grass until the skid scorches it. Values from `npcs.md` §2.4.1: entry over the Ridge at (0, −130), altitude 60 m, heading south-south-east at 14 m/s; the spiral from 40 % of the approach (59 m in, `t = 10.2`), a 4 rad/s corkscrew of 4 m amplitude with a continuous 4 rad/s roll, descending 4.8 m/s for 12.6 s (eight rotations; the along-track ground speed drops to 7 m/s as the corkscrew soaks up the airspeed, diving to 16 m/s in the last 1.5 s), touchdown at (70, 0) at `t = 22.8`, a 60 m skid west over 3.5 s to the wreck pose of `camp.md` #8 (nose at (11.5, 0.4), heading 262°, nose-down 14°, rolled 8° left).

**Actors.** Puppets: the plane, Ed, the four kids. Props: twelve goblin silhouettes and one crowned silhouette (`bosses.md`'s Goblin King rig at its stated height; unnamed here) on the Runt rig's run loop with a torch quad each; three **goblin carts** **[new prop]**: a two-wheel cart 1.8 × 1.0 m in the horde's rust timber (`enemies.md` §2.8 palette) carrying the hung cage of `enemies.md` §2.8 (1.4 × 1.2 m, cloth strip in the caged kid's `base`, the gold lantern on the top bar, pooled light `#FFD08A` 2.0 · 6 m), pulled by two goblins; the ember ring of C0 (5 stones, embers, fire S1 `light.campfire` at 1.2 · 5 m).

| # | t (s) | Shot | Camera | Action | Captions (speaker · start · text) | Sound | Layers (diorama check) |
|---|---|---|---|---|---|---|---|
| 1 | 0.0–6.0 | Five in a plane | `follow` the plane, offset (0, +1.5, +5.0) ahead of the nose looking back at the cockpits, damping 0.3, FOV 40°, DoF focus Ed; `fade` in from `#0B0E1A` 1.0 s | the plane straight and level at 80 m over the north sea of void, the Ridge sliding under at 4.5 s; the kids' seated clips (`npcs.md` §2.3.7): Noah leaning out tracking the ground, Collette holding her pigtails, Isabella both arms up, Liam one hand on the rim looking at the others; sputter at 4.0 s and 5.4 s (`plane.sputter`; the blades freeze, a black puff; all four grab the rim for 0.6 s); Ed looks up and right at 5.5 s toward the shard, a dark notch with three faint lights at the frame's top-left (Act 1 scale, `story-beats.md` §2.2) | — | `plane.engine.repaired` → `plane.sputter` ×2; `cs.crash.wind` low | dusk sky dome with the sun lobe at 270°, clouds below the plane, the Ridge's fog band, the scarf and four kids' cloth, exhaust puffs, the prop blur: 6 |
| 2 | 6.0–13.0 | Over the Ridge | `hold` at cam (−22, 8, −122) on the Ridge's crest, `aimTrack` the plane, FOV 35° | the plane crosses overhead at 60 m at 6.4 s, the crash trail on (`#555`, 25 puffs/s, cap 120, life 4 s); heads south-south-east; the spiral begins at 10.2 s: the first two rotations seen from below and behind, the smoke corkscrewing | announce `✈️ A biplane sputters overhead!` · 6.5 · `#D94848` 2 s (FC §3.6) | `plane.sputter` continuous from 10.2; `cs.crash.wind` rising | as shot 1 plus the Ridge grass in the foreground: 6 |
| 3 | 13.0–17.5 | The spin, from inside | `follow` the plane, offset (−0.9, +0.6, +2.2) over the front cockpit's left rim looking aft at the bench and Ed, damping 0.05 (rigid: the horizon rolls at 4 rad/s around the frame), FOV 42°; `cut` on the third rotation's top | rotations 2–5; all four on the rim clip; Isabella's arms go back up on rotation 3 (she is loving it); Noah's head ticks once per rotation (he is counting); Collette's pigtails straight out; Ed both hands on the stick, scarf wrapping the fin. Reduced motion: replaced by shot 4's pose held from 13.0 | Ed (`nervous`) · 16.5 (rotation four, `npcs.md` §2.4.1) · `Don't worry! That's a CONTROLLED descent! ...mostly.` | `cs.crash.wind` full; the engine cutting in and out | the rolling sky and ground, the trail, cloth ×5, embers from the exhaust: 5 |
| 4 | 17.5–22.8 | The corkscrew from the meadow | `hold` at cam (95, 2.0, 12) → aim the plane, FOV 30°, aim-track with 0.4 s damping; at 22.4 s the aim whips to the touchdown point (reduced motion: cut) | rotations 5–8 coming at the camera, the low sun behind the smoke; the last 1.5 s dive to 16 m/s; touchdown at 22.8 | — | `cs.crash.wind`; `plane.sputter` | the dusk key backlighting the smoke corkscrew, Crash Meadow's grass, the camp's distant lantern-less dark (C0), fireflies starting at `p` 0.58: 5 |
| 5 | 22.8–27.0 | Touchdown and skid | `dolly` alongside from (70, 4, 14) to (13, 4, 14) over 3.5 s, `linear`, aim the plane, FOV 38°; then hold 0.7 s | `cut` on the impact: `screenShake(8, 0.5)` direct (v27 `shk.i = 8`), 15 debris pieces 0.1–0.3 m in `#8B4513 #654321 #a0522d` at ±2.5 m/s, 0.5–2.5 m/s up, gravity 5 m/s², life 1 s; the furrow decal scorching behind (the `camp.md` #10 ruts and scorch ovals draw in as the plane passes); the left gear leg collapses at 20 m (23.9 s), the left lower wing tip folds at 40 m (25.1 s), the propeller hub splinters at 50 m (25.7 s); stop at 26.3 s, the tail dropping 0.5 s; the crate-landing dust recipe ×20 along the skid; the engine-smoke column starts | announce `Grandpa Ed has crash-landed!` · 26.4 · `#228B22` 3 s (FC §3.6); moved to this shot's `onEnd` so a skip still fires it | `plane.crash.impact` (`boom` 0.3), `cs.crash.skid` 3.5 s, `cs.crash.gearSnap`, `cs.crash.wingFold`, `cs.crash.propSplinter` | dust, debris, the scorch decal, the smoke column, the dusk key raking the ruts: 6 |
| 6 | 27.0–33.4 | Any landing | `hold` at cam (4, 2.5, 8) → aim (13, 1.2, 0), FOV 38°, with a `push` of 2 m over the shot, `ease3`; DoF focus the cockpit | Ed climbs out of the rear cockpit onto the lower wing and drops to the ground (his knee hitch); the four kids' heads in the front cockpit; Liam stands on the bench, vaults down, turns and reaches up for Isabella | Ed (`cheerful`) · 27.2 · `Any landing you walk away from, am I right?` — Liam · 30.1 · `Everyone okay? ...You know this is the third time, right.` | `plane.wreck.tick` begins; ember motes | the wreck's facets, the smoke, the trail of debris, the ember motes, cloth (the tarp is not on yet; the scarf), the dusk sky: 6 |
| 7 | 33.4–43.7 | Eight rotations | `hold` at cam (16.5, 1.0, 3.5) (the nose side, low) → aim (13.5, 1.4, 0.2), FOV 35°; DoF focus the wing | Isabella jumps off the lower wing into Liam's arms (her `Not scared`-class hammer-up landing, then both arms up again); Noah standing on the upper wing's root looking straight up, counting on his fingers, then hops down | Isabella · 33.7 · `AGAIN?! That's the third time this week! ...Can I ride in it next time?` — Noah · 38.2 · `...Wait, was that— did he just— that was INCREDIBLE. The spin was like eight rotations.` | ember motes; `plane.wreck.tick` | as shot 6: 6 |
| 8 | 43.7–47.6 | Ten out of ten | `hold` over Ed's shoulder from the south: cam (12, 1.6, 4.5) → aim (13, 1.3, −0.5), FOV 35°, Ed's collar and cap soft at the frame's left edge | Collette steps down the wing like a staircase, pigtails in place, then frames the wreck with both hands (the `Curtains` emote's hands); Ed looks at his plane | Collette · 43.9 · `...Ten out of ten landing, Grandpa. Very dramatic.` | — | as shot 6, the first fireflies: 6 |
| 9 | 47.6–55.8 | Way up | `push` on Ed from cam (7, 1.4, 1.2) → (9.5, 1.5, 1.2), aim Ed's face at (11.0, 1.55, 1.2), FOV 35°, `ease3` over 8.2 s, with the aim tilting up 25° from 52.5 s to follow his gaze; the last 1.5 s frame the sky: the first stars and the shard notch top-left | `sky.override`: a sweep from dusk `p` 0.65 to night `p` 0.72 over the shot (the "night falls" beat of `world-events-weather.md` §2.1.1, seen in one shot); behind Ed the kids walk to (0, 0): Liam kneels and lights the ember ring (the C0 fire S1 flares to 1.2 · 5 m at 54.5 s), the others sit on the ground around it; Ed stands apart at the wreck's nose looking up | Ed (`puzzled`) · 47.8 · `I swear this never used to happen. The wind's different up here lately.` — Ed (`wistful`) · 52.4 · `I was distracted. I thought I saw something... up there. Way up.` | `cs.crash.nightFalls` (crickets rising, the wind dropping); the fire's `amb.camp.fire` from 54.5 s | the dusk→night sky sweep, stars fading in, the fire's light pool, fireflies, the smoke column, the scarf: 6 |
| 10 | 55.8–59.7 | The Ridge | `hold` at cam (10, 1.2, −92) → aim (0, 7, −125), FOV 28°; DoF focus the crest | `cut` on the fire's last flare. The Ridge's crest 34 m away as a silhouette against the night sky's horizon band (`#24356E`); twelve goblins pour over it toward the camera with bobbing torches (emissive `#FF5A2A` quads on the bloom layer, no lights), one taller crowned silhouette last and unhurried; a goblin is 5 % of frame height here, which is enough for "small, running, many"; the north meadow's grass tops in the foreground | — | `cs.crash.raidDistant` (the `goblin` growl pitched low at −18 dB, a drum) | the night dome and stars, the horizon band, fireflies, the torch points, grass sway, the shard: 6 |
| 11 | 59.7–63.2 | Three lanterns | `hold` low at cam (−2, 0.7, 4) → aim bearing 20° at pitch −4°, FOV 42°; DoF focus 25 m | Liam face-down at (−2.4, 0, 1.0) in the lower-left-of-centre foreground, the shield beside him, the ember ring's light dying beside his hand; **Collette's cart** crosses the foreground right-to-left at 6 m, its lantern sweeping over Liam; **Noah's cart** recedes north (toward camp A at (40, −60)) and **Isabella's** north-east (camp C at (95, −100)), their lanterns dwindling to two points; Isabella's cage swings hardest (her stomp inside it, ±8°); the cloth strips (orange, amethyst, ruby) say who is where; no goblin is closer than 5 m to the camera and none looks at it | — | `cs.crash.cartWheels` ×3 with distance, `cs.crash.cageChain`, the fire's pop | three moving light pools, the dying fire, stars, fireflies, the cage cloth and the lantern chains: 6 |
| 12 | 63.2–65.7 | Liam down | `cut` to **station S1's rig** at night: `rig { target (0, 0.6, 0), d 19, pitch 48°, yaw 315° }`, FOV 35° (the gameplay lens: the last frame is the game) | the ember ring (C0), Liam lying on his side at (−2.4, 0, 1.0) beside where his log will be, the shield face-up; the wreck's nose and folded wing at the right edge under its smoke; no tent; the stars | — | `cs.crash.nightFalls` fading | the night dome, the embers, fireflies, the smoke column, the moon band on the far stream, mist wisps: 6 |
| 13 | 65.7–68.7 | Dawn | the same rig, `hold` | `sky.override` sweeps night `p` 0.85 → dawn `p` 0.02 over 2.0 s (stars out, the key rising from azimuth 80° at 6°); at the sweep's darkest instant (66.4 s) a `blink` hides the **C0 → C1 swap** (`camp.md` §2.6.1: no build-in; Ed pitched the tent in the night): the tent glowing at upper-left, fire S2 relit with smoke, Liam's log, Ed's stump, the lantern post, the tarp now the lean-to under the wing; Liam stirs, the `rise` clip (0.8 s) to one knee at 67.5 s; Ed at the wreck's nose (11.0, 1.2) at the right edge turns toward him. Bars out over the last 0.4 s; `onEnd`: `clock.set(0.02)`, `camp.stage(1)`, `crashSeen`, `edCrashCount = 1`, `tutorial.active`; control returns to Liam standing; the title card `Stewart Camp` / `Tent, fire, one bedroll. For now.` and `Find and rescue your siblings!` (FC §8) fire on control return | — | `cs.crash.dawn` (birds), `amb.camp.fire` | the dawn key and long shadows, the tent's glow, the fire's pool, pollen, mist wisps, the smoke column: 6 |

**Ed during the raid.** He is off-frame from shot 10 to shot 12 on purpose. Nothing is shown or implied about what he did while the goblins came; the dawn frame says what matters: he is there, the tent is up, the fire is lit. This makes no claim about a real person beyond what the canon lines already say (he crashed with the kids aboard; he was there when Liam woke).

**Skip card.** Shot 13's final frame held 1.5 s with the camp title card; the HUD and `👥 Siblings: 0/3` fade in over it. A kid who skips still sees where they are and who is missing (the counter).

**What a kid who watches gets that the tutorial does not say:** the plane was fine and then was not (the Sparky-Thingy chain has a "before"); Noah counted eight rotations because there were eight; Isabella called dibs on the left seat; the carts went north, north-east and past the fire toward the stream: the tutorial's `Find and rescue your siblings!` has three directions to try; and the tall crowned silhouette on the Ridge is someone a kid will recognise at Crash Meadow in B1.10.

### 2.5 CS-03 The meteor (24.2 s, seven scenes reshot one for one)

**Arming.** `story-beats.md` B2.2: `goblinKingDefeated`, the clock entering dusk (`p` 0.60–0.70), the squad on the Forest island within `camp.radius` (35 m), nothing running. `saveBefore`. The seven scenes keep v27's durations exactly (4.0 / 4.2 / 4.5 / 3.5 / 1.5 / 3.0 / 3.5 = 24.2 s); a **2.0 s settle** precedes them outside that count (§6).

**Geometry.** Liam's log at (−1.85, 0.4), seat facing 90°; seated, his head centre is **0.90 m** above the ground (standing head centre 1.32 m, hips 0.78 m, `heroes.md` §2.7.3; hips on a 0.35 m log). The fire is at bearing 78° from his log, 1.9 m; Ed's stump (1.9, −0.5) is at bearing 76.5°, 3.9 m, directly behind the fire from Liam's eye; the girls' log at bearing 117° (right), Noah's log at bearing 30° (left). The crater (120, −120) is at **bearing 45.3°**, 171 m, and `camp.md` §5.2 keeps the sightline clear between bearings 20° and 60°. v27's normalised head values map as: pan 1.0 = 50° of yaw from the fire **toward the crater** (to Liam's left; v27's "right" was a canvas direction, the crater's bearing is the 3D one), tilt 1.0 = 55° up. So v27's pan 0.6 / 0.7 land at bearings 48° / 43°: on the crater.

**The meteor object.** A sky-dome billboard at 550 m: an emissive core `cs.meteor.core` `#FFF0C8` on the bloom layer, a flare quad (v27 `_drwFlare` → a bloom-tinted lens flare at the flare's alpha), a trail ribbon (v27 `_pushTrail`: 40 segments, warm `#FF8C32` → `#8FD3F4` `cs.meteor.tail`, the tail colour shared with the Meteor Shower event of `world-events-weather.md` §2.5.2), camera-space smoke billboards (3 per frame at 60 Hz → 180/s, cap 400, `grow` and `hot` per v27, one instanced draw) and screen embers (2 per frame → 120/s, the pooled `Points` system). Angular size follows v27's px at 1080p: 1 px at FOV 40° is 0.36 m at 550 m. The bezier `cP0 (−0.06, 0.18), cP1 (0.28, 0.14), cP2 (0.72, 0.20), cP3 (1.08, 0.30)` (L4626) is kept as screen-space normalised coordinates for the `first` shots and projected onto the dome each frame. The **star washout** (AR §18) becomes an alpha falloff on the star layer within an angular radius that grows from 4° to 12° of the meteor.

| Scene | t (s) | v27 name | Camera | Action | Captions | Sound | Layers |
|---|---|---|---|---|---|---|---|
| 0 (settle) | −2.0–0.0 | — | blend from the gameplay rig to Liam's head over 1.5 s | `bars.cinema` in; every present hero walks to their seat (≤ 1.4 s, companion steering) and `sit_down` (0.6 s; the `camp.md` §5.2 clip request); Ed to his stump; the puppets take over; music ducks to 0 over 2.5 s starting here (AI §18, v27 scene 1) | — | — | — |
| 1 | 0.0–4.0 | First-person calm | `first` from Liam's `head`, FOV 40°, DoF off; his own arms at the frame's bottom (shield rim bottom-left, sword hilt bottom-right; head and hair on a hidden layer); choreography (L4755–4759): still to 1.2 s; pan `ease3` to 0.6 by 2.6 s; hold to 3.4 s; pan to 0.7 and tilt to 0.15 by 4.0 s; vignette `easeIn2(p) × 0.3` | the fire's three tongues centre; **Ed on his stump behind the fire**, face lit from below, whittling, then looking up at 3.0 s (he sees it first: his line 4 in CS-01); Collette and Isabella at right (Isabella copying Collette's pigtail-fix 0.5 s late), Noah at left drifting to centre as the head pans; at `p > 0.4` the sky override adds a faint orange lobe at bearing 45° on the horizon (v27's foreshadow glow); a blue lift `rgba(10,10,40, p × 0.06)` as a grade; Liam's breathing (`heroes.md` §2.4.1) moves the camera 0.01 m | — | music duck; `amb.camp.fire` | the dusk dome, the fire's pool on five faces, smoke, embers, fireflies, the scarf and capes, pollen: 7 |
| 2 | 4.0–8.2 | Sky watch | `first`; tilt `lerp(0.15, 1.0, ease3(min(p × 1.7, 1)))`, pan `lerp(0.7, 0.5, ease3(p))` (L4789–4790); `sky.override(cs.meteorSky)` blended over the first 0.8 s; stars 1.0; vignette 0.25; the plate `rgba(8,8,30, 0.06 → 0)` | the meteor appears at `p > 0.25` at bezier `mp × 0.3`, core 0.7 → 2.2 m at 550 m, flare alpha 0.1 → 0.5; the shard hangs at the frame's top-left, its ember cracks visible (Act 2 scale); the arc passes 20° below it and nothing is implied | announce `What is that...?` · 6.0 (`mp > 0.3`) · `#A8D0E8` 2 s (FC §7.1) | `cs.meteor.roar` from 6.0 s, very low | the dome, 600 stars, the shard, the sun-set horizon lobe, the moon rising, the meteor's flare: 6 |
| 3 | 8.2–12.7 | The crossing | `first` at full tilt (pan 0.5); `cineShake` 3 → 12 (`easeIn2`), rotational; vignette 0.3 → 0.6; a warm grade `#FF8C32` at `easeIn2((p − 0.7) / 0.3) × 0.08` from `p > 0.7`; DoF off, bloom ×1.5 | the meteor runs the full bezier `p` 0 → 1, core 1.4 → 6.2 m (v27 4 → 17 px on `easeIn2`), `warm = easeIn2(p)`; trail width `mSz × 0.5`, alpha `0.4 + warm × 0.3`; smoke from the tail along `−tan` at 30–60 px/s → 11–22 m/s at the dome's scale; screen embers; the star washout; the flare 0.3 → 1.2 | — | `cs.meteor.roar` rising with doppler, its pan crossing the frame with the meteor | as scene 2 plus the trail, smoke and embers: 8 |
| 4 | 12.7–16.2 | The dive | `cut` to cam (60, 420, 40) → aim (120, 0, −120), FOV 45° (the widest allowed), `hold`; `sky.override(cs.void)`; **shadows off, curved-world amount 0, fog `max` 0, scatter culled** for this shot; DoF off | the painted planet (L4864–4884) is replaced by **the real Forest island seen from 420 m** (the 360 × 300 m footprint fills the frame at this lens): the stream's turquoise line, the camp's fire and lanterns as warm points, the crater's rim dark, the other islands as far silhouettes in the void, the below-rim clouds; the atmosphere band (L4869–4877) becomes the island's rim fog band lit `#78B4FF` → `#C8EBFF` at 0.12 → 0.60; the meteor dives from the frame's (0.30, 0.05) toward the crater at `ep = p⁴`, core 2.2 → 8 m of apparent size, the re-entry glow from `ep > 0.3` (`rgba(255,200,100, 0.2 × ep)` → `rgba(255,100,30, 0)` radial), 4 smoke and 3 ember spawns per frame; `cineShake` 2 → 20; the **pre-impact flash** `rgba(255,255,240, fP² × 0.8)` over the last 10 % | — | `cs.meteor.roar` peaking; the last 0.35 s silent (the flash) | the void dome and stars in the shrinking zone (60 % → 25 % of frame), the island, its clouds, the rim band, the meteor's trail and smoke: 6 |
| 5 | 16.2–17.7 | The impact | `cut` under the flash to cam (−10, 6, 10) → aim (120, −2, −120), FOV 24° (the longest allowed; the crater is 17 % of frame width at 184 m and the effects fill the rest), `hold`; DoF focus the crater | the seated family's backs and the fire soft in the bottom-centre foreground; at 0.00 s: `cs.impFlash = 1.0` decaying over 0.25 s, a **60 ms presentation freeze** (v27 `freezeTimer`), `cineShake 40`, `screenShake(22, 0.9)` (the Event tier), `boom` 0.6; three shockwave decals expanding to radius 10 / 8 / 6.5 m over 0.6 s at delays 0 / 0.18 / 0.35 s (v27 400 / 320 / 260 px); 40 debris meshes; **1200 pooled embers** from the crater at `angle = rnd × TAU`, speed 5–37.5 m/s (v27 200 + rnd × 1300 px/s), upward bias 5–20 m/s, gravity 9.8, life 1.5–3 s, the six v27 colours `cs.impact.embers`; a 30 m dust column billboard rising 6 m/s for 3 s; the crater's teal point light (`world-events-weather.md` §5.2: the core on the bloom layer plus one pooled light) kicks in at intensity 6 · 14 m decaying to 1.5 · 8 m over 3 s; the sky override releases toward night over 3 s | — | `boom` 0.6 (v27); `cs.meteor.rumble` 3 s | the flash, the shockwaves, embers, dust, the crater's new light, the fire and lanterns in the foreground, the night dome returning: 7 |
| 6 | 17.7–20.7 | The aftermath | `push` with `smoothDamp(0.15)` (v27's own constant) from the scene-5 pose to cam (70 m from the crater on bearing 225°: (70.5, 30, −70.5)) → aim (120, −2, −120), FOV 30° (the crater is 64 % of frame height there; v27's zoom cap framed it at half); vignette 0.7 → 0.4. Reduced motion: cut to the end pose | smoke and debris settling; embers raining; `drawCrater()` becomes the crater's `lit` state: strata, the vitrified basin, the teal core on the bloom layer, the 18 upward motes, the 8 s pulse ring starting now (AR §15.4, kept whole); the settling dust haze `rgba(80,60,40, 0.15 × (1 − p))`; the purple radial glow ramping to 0.08 from `p > 0.4` (a grade lobe) | announce `A strange light glows in the distance...` · 19.8 (`p > 0.7`) · `#8850A8` 4 s (FC §7.1); also in this shot's `onEnd` if not yet shown, so a skip delivers it. **`onEnd`: `meteorSeen`, `craterDiscovered`, crater state `lit`** (v27 verbatim) | `cs.meteor.settle` (the ember rain and the crater's first hum) | the crater's 14 passes as geometry, its light, motes, smoke, the night dome, stars, fireflies on the meadow: 7 |
| 7 | 20.7–24.2 | The return | `dolly` on `ease3` from the scene-6 pose back to the captured gameplay rig at the fire (FOV 30° → 35° over the move); vignette `lerp(0.4, 0, p)`; bars out over the last 0.4 s | embers keep settling; the family still seated; the sky override fully released; **`onEnd`: `clock.set(0.70)`** (night has fallen; the crater's glow now reads from camp as "a second, lower moon", `story-beats.md` §2.2); the puppets release; heroes `stand_up` on the first move input | — | music back to `bgm.vol` over 2.0 s (AI §18, v27 scene 7) | the night keyframe, the crater's glow on the horizon, the fire, lanterns, fireflies, the shard: 6 |

Nothing in the seven is re-cut: each scene keeps its duration, its beats (the appearance at `p > 0.25`, the line at `mp > 0.3`, the flash over the last 10 %, the announce at `p > 0.7`), its numbers (1200 embers, 40 debris, three rings, `cineShake` 40, `boom` 0.6, `screenShake(22, 0.9)`, the two ducks) and its flags. What is new is only what the camera is looking at.

### 2.6 CS-04 Flight (16–18 s, ≤ 30 s)

The beat table is `npcs.md` §2.3.4; per-state variants (`hopping` / `propeller` / `rudder` / `repaired`) are that file's and are shot as written. Positions are strip-local: `s` metres along the strip from the parking mark toward takeoff, `n` metres to the pilot's left, `h` height. Every island's strip and mark are `story-beats.md` §2.2 and `npcs.md` §2.3.1.

| # | Beat (npcs) | Duration | Camera | Action and variants | Captions | Sound |
|---|---|---|---|---|---|---|
| 1 | Board | 1.2 s (2.0 s on the first flight of the game) | `hold` at (s +9, n +6, h 1.6) → aim the front cockpit, FOV 38° | the four climb the step to the bench (Isabella left), Ed into the rear; goggles down on all five if `story.edGoggles`; the prop spins up in the last 0.8 s with the state's coughs | — | `plane.prop.spinup`, the state's `plane.engine.*` |
| 2 | Takeoff roll | 3.0 s | `dolly` alongside at (n +10, h 2.0) matching the plane's `s`, aim the plane, FOV 35° | 0 → 12 m/s; prop-wash dust; the tail lifts at 1.5 s; `propeller` crabs 5°, `hopping` swerves ±3 m | — | `plane.taxi.rumble` |
| 3 | Rotate and climb | 3.5 s | `cut` on rotation to `follow` behind and above, offset (0, +3, −12), damping 0.4, FOV 40° | the climb at the state's rate; the strip and hub dropping away (the Forest's east gate crossbar passes under); **`hopping` stall-drop at +12 m**: a 1.0 s cut-in to the cockpit (`follow` offset (−0.9, 0.6, 2.2)) as the nose dips 15°, all four grab the rim, the backfire `flash` at half alpha; the cloud layer at +24 m: a 0.6 s white-out `#F2F7FF` at 60 % (the streaming curtain, `npcs.md` §2.3.5) | — | `plane.engine.*`; `plane.stall` on the drop; `cs.flight.cloudHush` |
| 4 | Sky leg | 3.0 s minimum; loops seamlessly while `!dest.ready`, total flight ≤ 30 s | `follow` off the left wing, offset (−14, +1, 0), damping 0.5, FOV 35°; at 1.5 s into the leg a 1.5 s cut-in to the bench (`follow` (−0.9, 0.6, 2.2)) | above the clouds: the sky dome, the departing island's silhouette shrinking behind, the destination's growing ahead (`world-events-weather.md` §2.6 silhouettes), the origin's weather for the first half and the held destination weather for the second; the kids' seated clips; `repaired` one trick, `rudder` a barrel roll, others sputter every 2.5 s | Ed's greeting as a **line caption** with his portrait by mood (`npcs.md` §2.1.8: 5 on the first hop, 4 later; repaired flights 1 → 4 → 3), at 0.5 s into the leg | `cs.flight.wind`; tricks `plane.wind.trick` |
| 5 | Descent | 1.2 s | `follow` front-quarter, offset (+6, +2, +9), damping 0.3, FOV 38° | down through the destination's cloud layer: the white-out's first 0.6 s is the swap; the real island appears below | — | `cs.flight.cloudHush` |
| 6 | Circuit | 2.6 s | `crane` trailing the plane on its 60° arc at radius 40 m and 20 m: cam offset (0, +14, −30) plane-local, aim the hub, FOV 45° (the plane in the lower third, the island's landmarks across the frame: this is the establishing shot) | bank per state; the hub, the strip and the dungeon's silhouette all in frame by construction of the arc | — | — |
| 7 | Approach and landing | 2.5 s | `cut` to `hold` at the strip's far end, (s +62, n −4, h 1.2) → aim up the strip at pitch −3°, FOV 30° | the plane comes at the camera, flares at 2 m, hops per state (two at 1.0 / 0.35 m; three at 1.2 / 0.6 / 0.25 m plus a 3 m swerve when `hopping`), dust at each wheel per hop; **every landing bounces** (the canon landing record) | — | `plane.touchdown` per hop |
| 8 | Roll-out and park | 1.0 s | `dolly` alongside to the mark, then blend 0.5 s to the gameplay rig | decelerates to the mark, the tail drops; the kids climb out, Ed to the Ed mark; **the island title card** (`story-beats.md` §2.2, `ui-ux.md`) fires at touchdown; `onEnd`: `currentIsland`, the weather commit, `flownTo[island]`, then `saveAfter` | — | `plane.prop.spindown` |

**Look.** Key: the origin island's keyframe until the swap and the destination's after it, so the light changes inside the clouds and a kid feels the arrival before seeing it. DoF band on the plane in every shot but the circuit (band on the hub). Layers in the sky leg: the dome, the clouds below the plane, the two island silhouettes, the en-route weather particles, five cloths, the exhaust puffs, the prop blur: 7. The circuit is the frame that must read as the reference diorama seen whole: the island's clouds below its rim, the hub's warm points, the strip's pale line.

Skip (§2.2.7): after the first flight to that island, only while `dest.ready`; a skip jumps to shot 7's start. Multiplayer: the host chooses the destination (the card is host-side, CM's host-only interact); every client flies. The sky leg's loop is invisible because the silhouettes' scale is a function of leg progress that plateaus at 60 % until the swap is allowed.

### 2.7 CS-05 The Green Meanie lives again (12 s)

Fires at Ed's Landing on the Forest island after `phase3_return`, `quest_complete` 1–4 and the four `space_hint` lines close (dialogue, `npcs.md` §2.1.8); `planeState = repaired` is already set, so the plane in frame is the finished one (polished cowling, glowing stubs). `The Green Meanie lives again!` (`#228B22`, 4 s, L8395) is the first thing on screen.

| # | t (s) | Shot | Camera | Action | Captions | Sound |
|---|---|---|---|---|---|---|
| 1 | 0.0–2.0 | Clean start | `hold` at cam (26, 1.5, 6) → aim (22, 1.2, 0), FOV 38° (the apron) | Ed in the rear cockpit pulls the goggles down; the prop spins up with no cough; the stubs glow; the four kids on the apron in a row in height order at (19…22, 3.5), Isabella nearest the plane | announce `The Green Meanie lives again!` · 0.0 · `#228B22` 4 s | `plane.prop.spinup`, `plane.engine.repaired` |
| 2 | 2.0–5.0 | Takeoff | `dolly` alongside at (n +10, h 2.0), FOV 35° | the clean roll east down the strip, rotate at 12 m/s, climb at 4 m/s over the east gate | — | `plane.taxi.rumble` |
| 3 | 5.0–8.3 | The loop and the wave | `cut` to `hold` at cam (20, 1.6, 4) → aim east at pitch −22°, FOV 40° (from the apron, looking up over Crash Meadow) | the plane climbs to 20 m 60 m east and **loops** (radius 4.0 m at 14 m/s, 1.8 s, `npcs.md` §2.2.5) with the four wing ribbons; at the top of the recovery the **wing-rock** (roll ±15° twice, 1.2 s): Ed's wave; the four kids play `wave` (§5 addendum: 0.8 s, arm up) staggered 0.15 s by index, Isabella both arms | — | `plane.wind.trick`; `victory` 0.3 at the wing-rock (the canon fanfare, quieter) |
| 4 | 8.3–11.0 | The landing record | `hold` at the strip's far end (72, 1.2, −4) → aim west up the strip, FOV 30° | the approach from the east, flare, **two hops** (1.0 m, 0.35 m at 0.6 s), dust at each wheel; the kids run alongside inside the marker stones, Isabella first (`I call dibs on riding in the plane when it's fixed!` is canon; she is first to it) | — | `plane.touchdown` ×2 |
| 5 | 11.0–12.0 | Park | `dolly` to the mark, then blend 0.5 s to the gameplay rig | the plane taxis to the parking mark; Ed hops out; `onEnd`: `cs05Seen`; the `Well-Ed-ucated` toast and the camp **C5 build-in** (`camp.md` §2.6.1: 1.5 s after the cutscene) follow on control return | — | `plane.prop.spindown` |

**Look.** No sky override: the turn-in's hour is the hour (the plane's Cub yellow reads at any keyframe). DoF band on the plane; on the apron shots the kids sit at the band's near edge. Layers: the dome, the strip's marker stones and prop-wash dust, the hangar's lantern and the windsock, the scarf and four capes, the exhaust, the trick ribbons, pollen: 7. The loop against the sky over Crash Meadow is the frame that must look like the tip.

### 2.8 CS-06 Some of it is watching (a dialogue scene)

**Mode: dialogue scene.** The letterbox is up and the cinematic rig runs, but the lines are delivered by `ui-ux.md`'s **dialogue box** (typewriter 120 cps, first press completes, second advances, hold 0.8 s skips the block; `npcs.md` §2.11), not by captions. Each line owns a shot; the shot changes when the line advances, on a `cut` at the box's advance. The box shows Ed's portrait by mood (`npcs.md` §2.1.7). The sim is frozen as in any dialogue; the crater's oscillators run on the presentation clock and the **8 s pulse ring is phase-aligned to `t = 0`** so a pulse leaves the core as line 1 reveals and every third line lands on a pulse.

**Arming.** `edQuestComplete && craterVisited && meteorSeen && !edCraterDialogue`; Ed has walked to (111, −111) facing bearing 45° into the crater (`npcs.md` §2.1.6); the beat fires when the active hero is within 6 m of him (or on talk: `npcs.md` §5.3 item 8). `saveBefore`. **Sky:** `sky.override(cs.craterDusk)` blended in over 1.5 s and out over 1.5 s: the scene is at dusk whatever the hour (§6). The crater's floor is **3 m below its rim** (a design value this file fixes for the shots; §5 hands it to world-builder and `dungeons.md`).

**Marks (settle, 2.0 s, companion steering):** Ed (111, −111); Liam (112.5, −109.5) at Ed's right; Noah (109, −113) on one knee at the rim's edge; Collette (109.5, −109) behind; Isabella (110.3, −108.3), 1.03 m from Collette. All face the crater.

| Line | Speaker · mood | Text (verbatim) | Shot | Camera |
|---|---|---|---|---|
| 1 | Ed · `stunned` | `Well now... that's not something you see every day.` | A: five on the rim, lit from below | `hold` in the basin: cam (116, −1.6, −116) → aim Ed's face (111, 1.55, −111), FOV 38°; the family silhouetted against the dusk sky with the teal core's light under their chins; DoF focus Ed |
| 2 | Ed · `wistful` | `Gran used to tell stories about lights like these when I was growing up...` | B: Ed's close | `push` from 5.0 m to 3.0 m on Ed, FOV 32°, `ease3` over the line's reveal; the pulse ring passes under the frame's bottom edge at the line's start |
| 3 | Ed · `wistful` | `She'd say: 'Eddie, the sky has more in it than stars. And some of it is watching.'` | C: the sky over the crater | `crane` from cam (106, 2.0, −106) → aim the core (120, −3, −120) up to cam (106, 4.0, −106) → aim the sky at elevation +15° on bearing 45°, `ease3` over the reveal: the teal core, then the rim, then **the shard** filling a hand's width of sky over the crater (Act 3 scale). "watching" lands with the shard centred |
| 4 | Ed · `serious` | `Everyone thought she was telling fairy tales. I wasn't so sure.` | D: the profile two-shot | `hold` at cam (109.5, 1.4, −115) → aim between Ed and Liam, FOV 35°, 4 m; Noah looks up from the rim at Ed; Isabella looks at Collette |
| 5 | Ed · `distracted` | `I need to think about this. Come back later.` | E: the wide from behind | `hold` at cam (100, 4.0, −100) → aim (114, 0.5, −114), FOV 40°: the five from behind, the crater beyond, a pulse leaving; Ed turns from the crater and starts his goggles-polish idle |
| 6 | Noah (`ed_crater`) | `Wait — Gran knew about THIS? How long has this been going on?` | F: Noah's close | `hold` from the crater side: cam (113, 0.4, −116) → aim Noah's face, FOV 35°, 2.5 m; his portrait and name in `hero.noah.glow` |
| 7 | Isabella (`ed_crater`) | `Grandpa... are you okay?` | G: Isabella looking up | `hold` at Isabella's eye height: cam (108.5, 0.9, −107) → aim up at Ed's half-turned back and face, FOV 35°, 2.2 m; hold 1.5 s after the box closes, then bars out and blend 0.5 s to the gameplay rig |

**Look.** The dusk override gives a warm horizon (`#E86A4A`) behind five faces lit from below by the only cool key in the game, the crater's teal; the tilt-shift band sits on the speaker of each line. Layers: the dusk dome with stars at 0.4, the crater's motes and pulse ring, the lavender dusk fog, the shard, cloth (the scarf, the capes, Collette's hem), fireflies on the meadow behind: 7.

`onEnd` (also on the hold-skip): `edCraterDialogue`, `saveAfter`; Ed walks back to the plane by the relocation rule. Sound: `cs.crater.bed` (the crater's hum, teal) for the scene, `cs.crater.pulse` on each ring, `dlg.blip.ed`. Multiplayer: the host advances; guests watch.

### 2.9 CS-07 Something pulses (10 s)

**Arming.** B3.2: all four island dungeons cleared and `edCraterDialogue`; the next night (`isNight()`) with the squad within `camp.radius`. `saveBefore`. Ed is placed at his stump for the scene (from `portalOpen` he sits there by rule, `npcs.md` §2.1.6; the cutscene puts him there one beat early).

| # | t (s) | Shot | Camera | Action | Captions | Sound |
|---|---|---|---|---|---|---|
| 1 | 0.0–3.0 | The fire | `hold` at `rig { target (0, 0.6, 0), d 19, pitch 48°, yaw 315° }` (S1 at night), FOV 35°; the heroes settle to their seats in the first 1.0 s | the five at the fire; at 1.0 s the crater's glow on the north-east horizon flares: the 8 s pulse now lights the sky as a teal lobe at bearing 45° (a sky-override lobe, `#1abc9c` at 0.35); every head turns to it (Liam's 3 s head-turn, on cue) | announce `Something pulses faintly to the northeast...` · 0.5 · `#A862C4` 3 s (L9265) | `cs.crater.pulse` distant |
| 2 | 3.0–6.5 | The flight to the crater | `push` from the S1 pose along bearing 45° to cam (102.3, 12, −102.3) → aim (120, −2, −120), FOV 32°, `ease3` over 3.5 s (170 m; about 48 m/s at the middle); DoF focus the crater. Reduced motion: `cut` to the end pose at 3.0 | the meadow and camp C's cleared ring pass under; the rim rises; the pulse lobe grows; fireflies streak | — | `cs.portal.pushWind` |
| 3 | 6.5–9.0 | The portal | `hold` | the basin's core brightens ×3; **the portal** rises from the floor over 0.5 s at (120, −2.5, −120) and its **three arcs** spin up (AR §15.3, kept whole at **×2 scale**: base radius `1.5 + sin(t × 3) × 0.25` m, arcs at `r + i × 0.4` m spanning 1.5π each, starting angle `t × 2 + i`, alpha `0.6 − i × 0.15`, widths 3 − i in 0.05 m units, emissive `#A862C4` on the bloom layer (a light, not a body: the hue rule is for bodies); core disc `rgba(26,10,46,0.8)` at `r − 0.25`; inner glow at `r − 0.5`; a violet point light 1.4 · 6 m); no label in the cutscene (`ENTER PORTAL` is gameplay UI) | announce `A mysterious portal appears...` · 7.0 · `#A862C4` 4 s (L5716); in this shot's `onEnd` if not shown | `portal` 0.4 (v27, on spawn); `cs.portal.rise` |
| 4 | 9.0–10.0 | Hold and return | `hold` 0.6 s, then bars out and blend 0.5 s to the gameplay rig at the fire | `onEnd`: `portalOpen`, `islandUnlocked.shadow`; Ed stays at the fire; `saveAfter` | — | — |

**Look.** Night: the fire's honey pool on five faces, then the crater's teal, then the portal's violet: three colours of light in ten seconds and none of them grey. DoF band on the fire, then on the crater. Layers: the night dome and stars, fireflies, the fire and the three pooled lanterns, the crater's pulse and motes, the portal's arcs and light, the mist wisps, cloth: 7.

### 2.10 CS-08 Home, wrong (8 s)

**Entry.** Interacting with the portal: a 0.6 s violet white-out (`flash` variant `#A862C4` → `#120A1F`) covers the streaming swap to the shard (`story-beats.md` §2.2: an island by streaming, a dungeon by rules). No `saveBefore`, no `saveAfter` (§2.2.9). `dungeons.md` had not landed; the mirror crater is designed here from `story-beats.md` (the crater, "but the glow is the wrong way up") and `camp.md` §2.8's inversion vocabulary: the same bowl, black glass, and instead of a teal core on the floor a **rift-cyan cone hanging above it**, its pulse **contracting** every 8 s instead of expanding (`shadow.mirrorFire`'s half-rate oscillator, `camp.md` §2.7.6), ash falling into it. The sky is `shadow.wrongDusk` (no override needed).

| # | t (s) | Shot | Camera | Action | Captions | Sound |
|---|---|---|---|---|---|---|
| 1 | 0.0–3.0 | Arrival | `hold` at the basin's edge: cam (mirror (114, −1.0, −114)) → aim the mirror portal at (120, 0.4, −120), FOV 38°; the white-out clears over 0.6 s | the four step out of the mirror portal one by one 0.4 s apart (Liam first: he goes first into a place like this), onto the glass; heads turn up at the hanging cone; ashfall | announce `Welcome to the Shadow Realm...` · 1.0 · `#A862C4` 3 s (L9325) | `cs.shard.arrive` (a portal played backwards); `amb.rift` bed starts |
| 2 | 3.0–6.5 | The one far light | `crane` + `orbit`: from the shot-1 pose, rise 13 m and swing 180° around the kids at radius 14 m (`ease3`, 3.5 s), ending at cam 12 m up behind them looking out over the shard's rim, pitch 8°, FOV 40° | the reveal: the mirrored Rootways of ash behind them (the Outer Ward), the void beyond the rim with the void clouds below, and on the horizon in the direction of the real world **a single warm point** (`cs.farLight` `#FF9A3C`: the horizon billboard plus the 4 % directional fill of `story-beats.md` §2.2); all four heads turn to it together (look-at, 0.4 s). Reduced motion: `cut` to the end pose at 3.0 | — | the bed; the pulse's contraction |
| 3 | 6.5–8.0 | Forward | bars out; blend 0.5 s to the gameplay rig with the kids at the basin's exit stair | `onEnd`: nothing; the first floor banner `SHADOW CITADEL — Floor 1: Outer Ward` (`dungeons.md`) fires on control return; CS-08 ends before the Stone Sentinel wakes (`bosses.md` §5.2) | — | — |

**Look.** `shadow.wrongDusk`: the key from the wrong side, ash falling, embers rising, the rift flicker; the far light is the only warm thing in the frame, and the DoF band goes off for shot 2 so the horizon is sharp. Layers: the void dome, the void clouds below the shard, ashfall, embers, the rift lobes, the mirrored stream's cyan line, the far light: 7.

### 2.11 CS-10 Lights in the dark (52 s)

**Entry.** Begins at the Queen's death beat **5.0 s** (`bosses.md` §2.16.1): the victory stats overlay `SHADOW QUEEN VANQUISHED!` / `The darkness has been defeated!` → `CONTINUE ▶` → a 1.0 s `fade` from `#0B0E1A` into shot 1. The rift storm has stopped, the banished siblings have returned at 40 % HP, the warm flame is lit in the hearth. The kids' puppets take their real HP into the cutscene as nothing (no bars are shown). No new lines anywhere; the dedication slot is empty (§8).

**Sky.** Shots 1–4: the Forest `dawn` keyframe; shot 5 onward: `golden hour`; `onEnd` sets `clock.set(0.54)`. The shard's three emissive points are **off** from this cutscene on (the lights in the dark have moved to the camp; §5 asks `story-beats.md` and `world-builder` to carry this through the post-game sky).

| # | t (s) | Shot | Camera | Action | Sound |
|---|---|---|---|---|---|
| 1 | 0.0–4.0 | The real crater at dawn | `hold` at the rim's south-west edge: cam (108, 0.6, −108) → aim (120, 0.8, −120), FOV 35°; DoF focus the portal | the real portal flares and the four step out 0.3 s apart, **Liam last** (he checks everyone is out: "Stay back, Bella" as a habit), onto a basin whose core now glows **warm** (`crater.core.warm` `#FF9A3C`, the same pulse; `story-beats.md` C7: the glow "has gone warm"); the dawn key at 6° from azimuth 80° behind-left of them; the portal collapses to nothing behind Liam over 1.0 s | `cs.ending.dawn` (birds, the dawn bed); the crater's hum now warm |
| 2 | 4.0–7.5 | Home from here | `cut` to the north-east rim: cam (129, 2.5, −129) → aim over the kids at the camp: (105, 0, −105) then easing to (0, 2, 0) over the shot, FOV 40°; fog `far` overridden to 220 m; DoF focus the kids | the four stand on the south-west rim looking down the island at the camp 170 m away: the cabin's teal roof taking the first light, the fire a warm point, the stream a line; Isabella taps `FLAVOR_MARKERS[2]`'s rock (`Isabella was here first!!!`) with the hammer once (a motion, no bubble) | — |
| 3 | 7.5–11.0 | The walk home | `dolly` alongside at 9 m to the group's right, 1.5 m up, pitch 5°, FOV 32°, aim the group's centre, damping 0.5 | the four walk south-west out of the basin and down the crater approach at 1.6 m/s in formation (`heroes.md` §2.5.11: Liam front, Noah left-back, Collette and Isabella together 1.0 m apart), past camp C's cleared ring (the fallen totem, the empty gibbet); the dawn mist on the meadow ahead | footfalls; the dawn bed |
| 4 | 11.0–16.0 | The Carved Oak | `cut` (a time ellipsis: they are on the north meadow now) to `hold` at cam (22, 1.6, −34) → aim (30, 2.0, −42), FOV 35°, aim-track the group; DoF focus the trunk | the four walk right to left past **the Carved Oak** (30, −42), the biggest tree on the meadow filling the frame's height; Noah's hand on the trunk as he passes (`L + N were here`); the **deer** at the meadow's edge lifts its head and does not run (a puppet; the flee rule is off); the camp's smoke column beyond | `music.ending` begins low at 11.0 s |
| 5 | 16.0–19.0 | Golden hour | `blink` (the time skip: `npcs.md` §5.3 item 4), then `hold` at `rig { target (0, 0.9, 0), d 22, pitch 46°, yaw 300° }`, FOV 35° | **Stewart Camp at C7 at golden hour**: the kids arrive at the fire and sit (Liam last); **Ed** stands from his stump as they come (`happy`) then sits; the fox asleep on its bed at (−3.0, 2.6) by the woodpile lifts its head; Sugar in the yard; hens free-range; the dock and the hammock beyond; the picnic blanket; the crest banner and bunting moving; pollen backlit | `music.ending` rising; `amb.camp.fire` |
| 6 | 19.0–24.0 | Around the fire | `orbit` target (0, 0.9, 0), d 6, pitch 20°, yaw 250° → 290°, `linear` over 5 s, FOV 35° | all five seated (`camp.md` §2.7.2's seated idles): Liam pokes the fire, Noah tracks a moth, Collette fixes a pigtail, Isabella copies her 0.5 s late, Ed sets the whittling down and just looks at them; the kettle steams; the shield planted by Liam's log | the fire's pop; the kettle |
| 7 | 24.0–27.0 | The fox | `cut` low: cam (−1.8, 0.5, 4.2) → aim (−3.0, 0.25, 2.6), FOV 35°; DoF focus the fox | `Orange Meanie` on its bed, the fire soft behind; it curls tighter, one ear turning to the kettle | — |
| 8 | 27.0–31.0 | The family, in things | `hold` from the porch (station S6-class): cam (−6.5, 1.6, −7.0) → aim (−12, 1.0, −4.5), FOV 35° | the washing line's four garments in the four `base` colours moving; the garden's `L N C I` stones; the **deer** at the garden fence lifting its head; hens; the scarecrow's goggles catching the low sun | the bed |
| 9 | 31.0–36.0 | Ed goes to the plane | `cut` on his stand: `hold` cam (3.5, 1.4, 3.0) → aim Ed, FOV 35°, 2.0 s; then `cut` on his turn to the apron: `hold` cam (26, 1.5, 6) → aim (22, 1.2, 0), FOV 38°, 3.0 s | Ed stands (the knee hitch), says nothing, turns; at the plane on the apron he pulls the goggles down and climbs in; the kids watch from their seats (head look-at) | `plane.prop.spinup` at 35.0 s |
| 10 | 36.0–42.0 | Takeoff | `dolly` alongside at (n +10, h 2.0), FOV 35° | the clean roll east, rotate, the climb over the east gate's crossbar and the `Stewart Camp` sign, a bank north toward the Ridge | `plane.engine.repaired` |
| 11 | 42.0–48.0 | The plane over the Ridge | `cut` to `hold` at cam (−4, 1.6, 12) → aim (−2, 12, −125), FOV 30° | the Ridge line 135 m north, the golden sky; the plane crosses the Ridge east to west at 18 m (the title's crossing, `camp.md` §2.12) and at the crossing's centre **the wing-rock** (roll ±15° twice, 1.2 s): Ed's wave; the four kids in the foreground at 9 m, backs to the camera, **waving** (`wave`, staggered 0.15 s; Isabella both arms, jumping) — `Tip: If you see a yellow biplane, wave. That's Grandpa Ed.` made into a shot | the engine dopplering across; `music.ending` at its top |
| 12 | 48.0–52.0 | The title | `cut` to **station S5 exactly** (`camp.md` §2.12: `rig { target (−1, 1.0, −3), d 40, pitch 14°, yaw 340° }`, FOV 34°, the 60 s dolly 1.5 m right with 0.4° of yaw) | the camp at **C7**: the four kids in their seats, Ed's stump empty because Ed is in the plane on its 45 s crossing with one loop (`npcs.md` §5.3 item 4: the last pass is his), the fox on its bed, the deer at the garden fence, hens, chimney smoke, the dock beyond the stream. Over it, at 49.0 s, the **title card** in `ui-ux.md`'s title type: `⚔️ The Stewart Squad Adventure` over `The world has stories to tell.` (FC §12.1), fading in over 1.2 s; beneath the tagline a reserved third line at 60 % size, **empty** (the dedication slot, §8). At 52.0 s the bars stay, and the victory overlay `VICTORY!` / `The Stewart Squad saved the realm!` with `⚔️ NEW GAME +` / `🌍 KEEP PLAYING` / `🔄 PLAY AGAIN` / `🏠 TITLE` (FC §12.3; `♾️ ENDLESS MODE` is cut, `story-beats.md` §2.8) rises over the **live** scene, which keeps running behind it | `music.ending` resolving |

**Look.** Dawn's `#FFB48C` key at 6° raking the crater and the meadow for shots 1–4, then golden hour's `#FFD08A` at 16° for the rest: the hero look, tuned first (`world-events-weather.md` §2.1.3), for the frame the kid keeps. DoF band on the kids on the walk, on the fire for the orbit, on the fox, on the plane for the crossing, and at S5's fire for the last frame. Layers in shot 5: the golden dome, backlit pollen, two smoke columns, the fire's pool, the banner, bunting, washing line and four capes, the stream, the deer and the pets, chimney smoke: 8. Nothing in the last frame is empty.

**How the last frame becomes the title screen.** Shot 12 *is* station S5: the same target, distance, pitch, yaw, lens and dolly the title uses (`camp.md` §2.12), so pressing `🏠 TITLE` cross-fades the overlay's buttons to the title's buttons and the camera never moves; the title scene then runs its own preset (C6, Ed's stump empty, the plane crossing). While the overlay is up the S5 scene is live: the plane finishes its crossing and **lands** (the visible-landing rule, `npcs.md` §2.2.8: approach, bounce, taxi to the apron mark (24, 0), spindown), because when a kid presses `🌍 KEEP PLAYING` the plane must be parked and Ed at his mark, and a plane is never in two places. `onEnd` (also on skip): `camp.stage(7)`, `clock.set(0.54)`, `currentIsland = forest`, the party at their seats, `saveAfter`. `KEEP PLAYING` blends 0.5 s to the gameplay rig; if the plane is still landing it finishes in the world.

**Skip card:** shot 12 with the title card, held; the overlay rises at once.

### 2.12 CS-11 Third time this week, again (44 s)

CS-01 without the ambush, for NG+ (`story-beats.md` B4.1). Shots 2–9 of CS-01 verbatim (the eight lines fire again: that it is the same is the joke), with shot 1 dropped (the kid has seen the cockpit) and the raid replaced by a dawn cut:

| # | t (s) | From CS-01 | Change |
|---|---|---|---|
| 1–4 | 0.0–20.8 | shots 2–5 | shot 2 starts already sputtering with the trail on (7.0 s → 6.0 s), the cockpit spin 4.5 → 3.5 s, the meadow 5.3 → 4.3 s, the skid 4.2 s |
| 5–8 | 20.8–41.4 | shots 6–9 | the same captions at the same clamps; all four climb out; in shot 9 the sky sweeps to night and all four sit at the ring |
| 9 | 41.4–44.0 | shot 13 | `blink` to dawn at **camp C2** (`sibsRescued = 3` → `squadAssembled` → stage 2, `story-beats.md` §2.6): four logs, four bedrolls, the board; the four kids in their seats stand as one; Ed at the wreck's nose; `NG+N — Enemies grow stronger!` (FC §11.12) fires on control return; tutorial off |

**Look.** As CS-01's shots 2–9 and 13, with the C2 props in the dawn frame.

`story-beats.md` §2.10 targets 40 s; the eight captions alone take 27 s at the reading clamp, so 44 s is the floor without hurrying the lines (§5).

### 2.13 Photo mode (rules for `ui-ux.md` and `camp.md`)

`photo` mode of the rig. Entered from the pause menu anywhere, or from a photo-spot stone's prompt at camp (`camp.md` §2.10). The sim freezes in single player (the render clock runs: cloth, smoke, fire, pets breathing); in multiplayer the sim does **not** freeze (one client's pause cannot stop the host) and only the local camera changes. HUD, name plates, telegraphs, the selection ring and the compass are hidden (name plates and the ring are toggles).

| Control | Range and default | Note |
|---|---|---|
| Target | the active hero by default; cycles heroes, Ed, the fire, any pet or animal within 10 m, the plane | the orbit centre |
| Yaw | free 360° | right stick, mouse drag, one-finger drag |
| Pitch | **5°–80°**, default the gameplay pitch | 5° so the camera never dips under the ground plane; 80° so a straight-down diorama shot exists |
| Distance | **2–30 m**, default 12 m | triggers, wheel, pinch |
| Lens | **24–50°** vertical FOV, default 35° | the lens rule holds here too |
| Height offset | ±1.5 m on the target | — |
| Roll | 0, never | a rolled diorama is a broken toy |
| Collision | a 0.3 m sphere cast; the camera stops at geometry | never inside a tree or a wall |
| Focus | `Auto` (the target's depth) or a slider 1–30 m; aperture 0–1 maps the tilt-shift band height 60 % → 15 % and max blur 0 → 4 px | the only place the tilt-shift becomes a real depth of field |
| Time of day | **allowed**: a seven-stop selector of the keyframes, cosmetic; the sky override blends over 1.0 s and the clock does not move; released on exit | a kid who wants the golden-hour shot at noon can have it |
| Weather | **not allowed** | weather is state, and rain that stops for a photo is a lie the world tells |
| Poses | `camp.md` §2.10: the six family poses (`Hearth`, `Porch`, `Dock`, `The plane`, `Squad`, `Not scared`) and every kid's victory, emotes and seated idle; the swing, the hammock, the blanket, the stones; pets sit within 2 m | a pose is a puppet arrangement on the presentation clock; in multiplayer a family pose needs every player-controlled hero within 6 m (the rest rule's shape) and is a host action |
| Frame and output | `ui-ux.md`'s photo-corner frame; a capture at the render resolution to the scrapbook; cap and format are `ui-ux.md`'s | — |
| Reduced motion | orbit and zoom are direct (no inertia) | — |

Exit blends 0.5 s to the gameplay rig and releases every override.

### 2.14 Announces, ducking, and the sound rule

- **Announces in cutscenes** render as the announce caption (§2.2.5) with the string's v27 colour and seconds; the strings this file shows are exactly: `✈️ A biplane sputters overhead!`, `Grandpa Ed has crash-landed!`, `What is that...?`, `A strange light glows in the distance...`, `The Green Meanie lives again!`, `Something pulses faintly to the northeast...`, `A mysterious portal appears...`, `Welcome to the Shadow Realm...`. Every other announce waits for control return.
- **Ducking.** CS-03 keeps v27's: music to 0 over 2.5 s at its start, back over 2.0 s in scene 7. Every other cutscene ducks the music to 0.5 over 1.0 s and restores over 1.5 s (new). SFX are never ducked (v27). Ambience continues: it is the world.
- **Hooks.** Every `cs.*` name in §2.0 plus `music.ending`; v27 names where they exist (`boom`, `victory`, `victory_ext`, `portal`, `boss`, `miniboss`); the plane's hooks are `npcs.md` §2.2.7's. Recipes are `audio.md`'s.

### 2.15 What is cut or replaced, with the reason

| v27 thing | Fate | Why |
|---|---|---|
| Cutscene bars in pure `#000`, growing over 0.333 s | replaced by `bars.cinema` in `#0B0E1A` at 0.5 / 0.4 s | the anti-palette bans pure black; one letterbox for bosses and cutscenes |
| `cineShake` as a screen translation | rotational jitter | translation on a head-mounted or long-lens camera reads as a bug |
| `_csZoom` and the world-edge clamp | cut | there are no map edges; the curved world rolls the rim away |
| `_drawFPScene`, `_drawFPHero`, `_drawFPLiam` (the painted first-person landscape and sprites) | replaced by the real world from Liam's head bone | the point of the rebuild |
| The painted orbital planet (ocean, three landmasses) | replaced by the real island from 420 m | the floating island is the world's shape now; the "planet" was v27's only way to say "from above" |
| The dungeon-boss 5 s black-bar cinematic | folded into `bossIntro` (`bosses.md`) | one grammar |
| Skip on Enter as well as Space | Space / Enter / pad A / tap, one input-aware prompt | the canon string is the keyboard variant |
| `F10` meteor replay | the dev console's `cutscene.play <id>` for every cutscene | same intent, generalised |
| The DOM title over nothing | the live S5 scene (`camp.md` §2.12) with CS-10's last frame as its twin | the title is the camp |
| No ending, no crash cutscene, no photo mode | CS-10, CS-01, `photo` | the brief asks for each |
| The scene-6 announce lost on skip | delivered from `onEnd` | a world-state line must land |

---

## 3. What preserves the magic

**Recipe by recipe (ATMOSPHERE_RECIPES section numbers).**

| Recipe | Kept, translated, or replaced | Where, and why the feeling survives at the camera |
|---|---|---|
| §13.1 the boss intro: a still, letterboxed frame with a shaking camera, 800 ms before the name | **kept whole** as `bossIntro` (`bosses.md` §2.3 lifted); this file adds only where the camera stands per reveal | the pause before the name is what makes it land; the push-in the brief asked for happens inside the frozen frame, so the stillness is still the beat |
| §13.2 the cutscene letterbox and `Press SPACE to skip` | **translated**: DOM bars in the boss colour, the canon prompt at v27's position | a kid recognises the bars and the words; only the colour changed, and it changed to the colour the boss bars always were |
| §11.5 the crash: the corkscrew, the panicked heading chase, the smoke, the debris, the direct shake 8 / 0.5, `boom` 0.3, `Grandpa Ed has crash-landed!` | **translated** into CS-01 with `npcs.md` §2.4.1's metres; every value has a shot | v27's crash happened off to the side of the screen while you fought goblins; now it happens to you, from inside, with the horizon rolling eight times |
| §19.3 the biplane's four independent motion sources | **kept** on the presentation clock in every shot the plane is in | the plane is never a keyframed prop even in a cutscene: the wander, the bank lag, the wobble and the sputter run under the shot list, which is why the crash spiral looks like Ed and not like an animation |
| §15.4 the crater's 14 passes, the 8 s pulse, the upward motes, the teal core, the rhythm that is wrong on purpose | **kept exactly**, on the bloom layer with one light; CS-06 phase-aligns the pulse to Gran's lines; CS-10 keeps the pulse and only warms its colour | the crater is the story's clock; the ending does not stop it, it changes what colour it is |
| §15.3 the portal's three incomplete arcs at three radii | **kept** at ×2 scale (a portal a 1.5 m kid walks into) | "three incomplete arcs is what makes it swirl"; the rule survives scaling |
| §18 the cutscene-only sky gradient and the 200-star field with washout | **kept and promoted**: the gradient is `cs.meteorSky`; the 600-star layer of `world-events-weather.md` §2.6 is v27's star recipe and the meteor washes it out exactly as before | the meteor scene now shares its stars with every night in the game, so the sky the meteor crosses is the sky the kid sees from the campfire |
| §2.3 cutscenes own the sky | **kept** and made literal (`sky.override`) | the dusk→night sweep inside CS-01 shot 9 and the dawn inside shot 13 are this rule used as a storytelling tool |
| §10.3 the shake ladder: the Event tier for story beats | **kept** verbatim (8 / 0.5 direct for the crash, 22 / 0.9 for the impact, 12 / 1 under boss cards, 15 / 1 at the Queen's death) | "every 15 is the same feeling" |
| §9 the particle recipes: crate-landing dust, the pooled `lighter` embers | **kept**: the dust on every skid and hop; the 1200 impact embers are the same pool | the impact's ember rain is the v27 image at the same count |
| §16.3 idle bob, breathing, blink | **kept** on every rig in frame, including the first-person camera (Liam's breathing moves the eye 0.01 m) | a cutscene face that does not blink is a doll |
| §19.2 five layers minimum, always | **kept and checked**: every shot row above lists its active layers and none is below five | the one thing v27 never had was a camera that could look at the layers from the side; the shot tables are that camera |
| §19.1 light and fire agree (the shared oscillator) | **kept**: the campfire, the cage lanterns, the crater's core and light, the mirror fire all run their oscillators on the presentation clock through every cutscene | a frozen flame under a moving camera would give the freeze away |

**Family-canon threads that survive, and where.** The eight `crash_landing` lines, in `story-beats.md`'s order, finally spoken (CS-01 shots 3, 6–9); Noah's "eight rotations" counted on screen because there are eight; "Can I ride in it next time?" answered by Isabella being first to the plane in CS-05 and taking the left seat in every flight ("I call dibs"); "Collette, hold my hand though" as Isabella's 1.03 m adjacency in every group shot and her copycat 0.5 s late at the fire; "Stay back, Bella" as Liam last out of the portal and first into the shard; Gran's line under the crater's pulse with the shard centred on "watching" (CS-06 line 3); "the sky has more in it than stars" as the reason the stars are always there now; `Tip: If you see a yellow biplane, wave.` as a shot (CS-05 shot 3, CS-10 shot 11) with the wing-rock as the answer; `Tip: Don't ask Grandpa Ed about his landing record.` as every landing in every cutscene bouncing; `Isabella was here first!!!` under her hammer at dawn (CS-10 shot 2); `L + N were here` under Noah's hand on the walk home; the title over the tagline as the last frame; the two meteor lines at their exact moments and colours; `Welcome to the Shadow Realm...` at the arrival; the Kid Snatch's cage lanterns as the three lights that leave in the dark (CS-01 shot 11), which is the title said backwards.

**What a kid will recognise from v27.** The seven meteor scenes in order with the same two lines (the first-person calm, the light in the sky, the crossing, the dive, the white flash, the crater, the return); `Press SPACE to skip` above a bottom bar; the boss card sliding in from the right while the world shakes; the crater's slow pulse; the three cages; `The Green Meanie lives again!`; `VICTORY!` / `The Stewart Squad saved the realm!` and the same buttons minus one; a yellow biplane crossing a ridge.

---

## 4. Build notes for implementers

### 4.1 Where it lands (Brief §7.3)

| Piece | Folder | Shape |
|---|---|---|
| The rig: modes, the eight moves, eases, blends, `cineShake`, DoF focus, lens clamp | `src/engine/camera/cinematic.ts` | one class with a mode enum; `bossIntro` and `comboBeat` timelines as data tables imported from `bosses.md`'s and `heroes.md`'s content modules |
| The player: shot clock, `onStart` / `onEnd`, skip (votes), the presentation-clock loop mode, puppets, the interrupt gate, saves | `src/engine/cutscene/player.ts`, `src/engine/cutscene/puppets.ts` | the loop's `if (cutscene.active) { render only }` branch lives in `src/engine/loop.ts` exactly as v27 L9234 |
| Shot data | `src/content/cutscenes/cs01.ts` … `cs11.ts`, `src/content/cutscenes/index.ts` | §2.2.2's types; every string imported from `src/content/canon/` by key, never inlined |
| Sky and post overrides | `src/render/sky/override.ts`, `src/render/post/cinematic.ts` | `sky.override / release`; DoF focus and strength; fog, shadow and curved-world overrides per shot |
| The meteor: core, flare, trail, smoke, screen embers, washout | `src/render/fx/meteor.ts` (shared with `world-events-weather.md`'s Meteor Shower streak) | one shader with a `mode` uniform |
| Letterbox, captions, the skip prompt, cards, the dialogue-scene bridge | `src/ui/cinematic/` | DOM; two bar presets; `ui-ux.md` owns type and frames |
| Photo mode | `src/engine/camera/photo.ts`, `src/ui/photo/` | the §2.13 table as a settings object |
| Dev hooks | `src/dev/console.ts` | `cutscene.play <id>`, `cutscene.shot <id> <n>` (jump and hold at the shot's midpoint), `cutscene.reduced on|off`, `photo.pose <name>` |

### 4.2 Assets

| Asset | Source · tris | Materials | Owner |
|---|---|---|---|
| The goblin cart (×3 in CS-01) | procedural · ≤ 300 each; the cage is `enemies.md` §2.8's | the shared flat vertex-colour material; the lantern's emissive | this file (new prop; §5 to `enemies.md`) |
| Torch quads for the raid (×12) | 2-tri billboards on the bloom layer | emissive `#FF5A2A` | this file |
| The meteor core, flare, trail (40 segments), smoke (cap 400), screen embers (pooled) | procedural | `src/render/fx/meteor.ts` shader; one additive material | shared with world-events' shower |
| The impact: 3 ring decals, 40 debris, the dust column | decal quads; 40 instanced rocks ≤ 20 tris; a 6-quad column | decal material; the ember pool | this file |
| The portal (three torus arcs, core, glow) | procedural · ≤ 600 | emissive `#A862C4`; one violet point light | this file; `dungeons.md` reuses for the mirror portal |
| The far-light billboard (Home, Wrong) | 1 quad at the horizon + the 4 % directional | emissive `cs.farLight` | `story-beats.md` §2.2 defines it; this file frames it |
| The crater's `lit` and `warm` states | `world-events-weather.md` §5.2's crater; a colour switch on the core and light | — | world-builder |
| The plane (`repaired`, `wrecked`), Ed, the kids, the deer, the fox, hens, Sugar | `npcs.md`, `heroes.md`, `world-events-weather.md`, `camp.md` | theirs | as puppets only |
| Clips this file needs that do not yet exist | `sit_down` / `sit_idle` / `stand_up` per kid (`camp.md` request), the four seated flight clips (`npcs.md` request), `rise` (the downed-to-knee, `heroes.md` knockdown's rise segment), **`wave`** (0.8 s, arm up; new request, §5), Ed's `ed_sit`, goggles down, cockpit climb-in and out, the knee-hitch stand | — | `heroes.md` / `npcs.md` addenda |

### 4.3 Materials and lights

No new material families: the shared flat vertex-colour material, the emissive/bloom material, decals, the meteor's additive shader. Point lights per cutscene never exceed the 8-slot pool (`world-events-weather.md` §2.8.2): CS-01's worst frame (shot 11) uses the fire and three cage lanterns (4); CS-03 scene 5 uses the fire, three camp lanterns and the crater (5); CS-07 shot 3 the crater, the portal and the fire (3); CS-10 shot 5 the fire and the three nearest lanterns (4). Torches, the shard's points and the far light are emissive only.

### 4.4 Phase mapping (Brief §8)

| Phase | Ships |
|---|---|
| **1 Pilot** | nothing from this file; station S5 (`camp.md`) is a camera preset, not a cutscene |
| **2 Vertical slice** | the rig with `bossIntro`, `comboBeat`, `nudge`; the player with `cut` / `hold` / `push` / `dolly`, the letterbox, captions, skip, saves, puppets; **CS-01 reduced**: shots 12–13 only (the night ember ring, the dawn wake, the C0 → C1 blink, the announce, the title card), about 6 s, no lines (the eight lines wait for the full crash in Phase 4; `story-beats.md` §4) |
| **3 The world** | CS-04 with every state variant and the streaming loop; CS-05; the remaining moves (`crane`, `orbit`, `follow`) |
| **4 Lights in the Dark** | CS-01 full, CS-03, CS-06, CS-07, CS-08, CS-10, CS-11, `first`, the meteor fx, the sky overrides, photo mode |
| **5 Multiplayer, audio, polish** | the vote skip, `cutscene.start` sync, every `cs.*` recipe, the reduced-motion pass, the mobile caption sizes |

### 4.5 Build order

1. The rig's modes and the `bossIntro` timeline (the Goblin King needs it first).
2. The player with v27's `onStart` / `onEnd` / skip semantics and a two-shot test cutscene.
3. Letterbox, captions, the skip prompt.
4. Puppets and the sky override.
5. CS-01 reduced → CS-04 → CS-05 → CS-01 full → CS-03 → CS-07 → CS-08 → CS-06 → CS-10 → CS-11 → photo.

### 4.6 Test hooks

- **Vitest, `tests/unit/cutscene/`:** `player.test.ts` (skip runs every remaining `onEnd` in order and then the cutscene's; flags land on skip and on watch; a skip before 1.0 s is ignored; the vote rule); `data.test.ts` (every shot's FOV within 24–50; no shot has two moves; CS-03's seven durations sum to exactly 24.2; every caption's text resolves to a canon key and its speaker exists; every announce's colour and seconds match the canon record; every cutscene ends with the bars out and the sky released); `moves.test.ts` (each ease hits its `to` at `duration`; FOV never changes faster than 6°/s; reduced motion collapses moves to holds without changing shot times).
- **Smoke (headless):** `cutscene.play CS-01 --reduced=false` runs to the end and asserts the roster's flags; `cutscene.shot CS-10 12` matches station S5's camera to 1 cm and 0.1°; every cutscene has a **screenshot station per shot at its midpoint** (`cutscene.shot`), committed under `docs/visual-loop/cutscenes/` so the art director scores the frames like any other station.

### 4.7 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| CS-03 scene 4: the island from 420 m | shadows off, curved-world 0, fog off, scatter buffers not built (nothing within 70 m), the island's static merged geometry only; one 3.5 s shot inside the ≤ 500k tri budget by construction |
| 1200 impact embers, 400 smoke billboards, 40 debris | the pooled `Points` system (one draw), one instanced billboard draw, one instanced rock draw |
| CS-01's twelve running goblins and a King rig | twelve skinned Runt draws for 3.9 s; acceptable; if the mobile preset stalls, the far six become 2-frame billboards |
| DoF focus changing per shot | a uniform; no pipeline change |
| The DOM letterbox and captions | zero GPU cost; `will-change: transform` on the bars |
| CS-10 shot 2's 220 m fog `far` | the full island is already resident; only the fog uniform changes |
| Streaming behind CS-04 | `npcs.md` §2.3.5's contract; the skip prompt waits for `dest.ready` |
| Presentation-clock puppets alongside a frozen sim | puppets are a separate list ticked by the player; the sim's entity list is untouched, so nothing can double-tick |

---

## 5. Cross-references and conflicts

**Earlier design files, and exactly what was taken.**

| File | Taken |
|---|---|
| `heroes.md` | the combo beat's camera (4 m, pitch 30°, yaw 40° off, `bars.punch` 12 %) as `comboBeat`; head centre 1.32 m and hips 0.78 m (§2.7.3) for the seated first-person height; the clips and personalities (§2.4) every shot casts; the formation rule (§2.5.11) for the walk home; the `glow` tokens for the kids' caption names; the Shadow skin (§2.6) is not used here (CS-08 shows no shadows) |
| `enemies.md` | the Runt rig for the raid's silhouettes; the hung cage with its `base`-coloured cloth and gold lantern (§2.8) on the carts; the guardian wake's 15 % ease (§2.7) as `nudge`; the un-letterboxed popup |
| `story-beats.md` | the CS list with lengths, skip rules and flags (§2.10); the line orders (§2.5); every position (§2.2); the arming rules (§2.1, §3); `Press SPACE to skip` as the keyboard variant; the dedication slot (§8) |
| `world-events-weather.md` | the clock and keyframes (§2.1); cutscenes own the sky (§2.1.1); tilt-shift halved and the post order (§2.4.3); the star layer, the meteor-streak tail colour, the dome and clouds (§2.6); the light pool (§2.8.2); `shadow.wrongDusk` (§2.1.4) |
| `bosses.md` | the intro grammar (§2.3) lifted as `bossIntro`; the nine reveal clips; the Queen's death beat and CS-10's 5.0 s start (§2.16.1); the shadow squad's popup (§2.14) confirming CS-08 ends before any wake |
| `camp.md` | the C0 set and the wreck pose (§2.1, §2.2 #8–12); Liam's log and every seat (§2.7.2); the C7 manifest and the mirror set (§2.3.3, §2.8); the pets (§2.9); photo poses (§2.10); station S1's rig (§2.11.5) for CS-01's last frames and CS-07's first; station S5 (§2.12) as CS-10's last frame; the build-in rule (§2.6.1) for CS-05 → C5 and the C0 → C1 and C6 → C7 exceptions |
| `npcs.md` | every CS-01 crash value (§2.4.1); the CS-04 beat table and variants (§2.3.4), the streaming contract (§2.3.5), the kids' seated clips (§2.3.7); Ed's captions in flight and his portrait moods (§2.1.7–2.1.8); Ed's spots (§2.1.6); the plane's body, states and motion sources (§2.2); the wing-rock (§2.2.5); the visible-landing rule (§2.2.8); conflict 4's resolution for CS-10 |

**What each later file must pick up from this one.**

| File | Must pick up |
|---|---|
| **`ui-ux.md`** | the caption contract (§2.2.5: two styles, sizes, the 120 cps reveal, the `clamp(chars × 0.06, 2.2, 5.5)` hold, colours); the letterbox component with `bars.cinema` and `bars.punch` and the layer order (§2.2.6); the skip prompt (canon string, the pad and touch variants, the ` · N/M` vote suffix, 1.0 s arming, hidden until `dest.ready` in CS-04); the skip card; the dialogue box as CS-06's line channel and its shot-advance hook; the announce channel's suppression during cutscenes and its queue on return; the title card over CS-10 shot 12 with the reserved empty third line; the victory overlay rising over the live S5 scene and `🏠 TITLE` as a button cross-fade with no camera move; the island title card at CS-04 touchdown; photo mode's controls, frame, capture cap and the HUD hide list (§2.13); the reduced-motion toggle's cutscene rows |
| **`audio.md`** | every hook in §2.0 and §2.14 (`cs.crash.*` ×10, `cs.meteor.*` ×3, `cs.flight.*` ×2, `cs.crater.*` ×2, `cs.portal.*` ×2, `cs.shard.arrive`, `cs.ending.dawn`, `music.ending`); the ducking rule (CS-03 v27's 2.5 s / 2.0 s to 0; every other cutscene to 0.5 over 1.0 s and back over 1.5 s; SFX never ducked; ambience continues); the v27 cues at their sites (`boom` 0.3 / 0.6, `victory` 0.3, `portal` 0.4, `boss` 0.5); the meteor's roar with doppler and pan following the meteor across the frame; the plane's engine dopplering in CS-10 shot 11; `dlg.blip.<who>` on captions |
| **`dungeons.md`** | the mirror crater as designed in §2.10 (the inverted cone, the contracting pulse, black glass, the arrival marks and exit stair); the mirror portal reusing the portal asset; the first floor banner firing on CS-08's control return; the crater floor 3 m below the rim (the rift stair's start, `bosses.md` §2.12); the dungeon entry card on the `bossIntro` timeline as `bosses.md` §2.3 states |
| **`camp.md`** (consistency) | CS-10's last frame is S5 with the **four kids** seated and Ed's stump empty, because Ed flies the last pass (`npcs.md` §5.3 item 4 supersedes `camp.md` §2.12's "all five at the fire"; all five are at the fire in shots 5–6); the plane lands on the apron behind the victory overlay; Liam wakes at (−2.4, 1.0), the pilot's pose-1 spot; the C0 ember ring lights at CS-01 shot 9 (54.5 s), before the raid |
| **`npcs.md`** (consistency) | the pre-crash plane in CS-01 is the `repaired` body; Ed is off-frame during the raid (shots 10–12) and at the wreck's nose at dawn; Ed sits at the stump one beat early for CS-07; in CS-10 Ed walks to the plane at shot 9 and is airborne from shot 10; the `wave` wing-rock fires at CS-05 shot 3 and CS-10 shot 11; the goblin cart is a new prop that carries `enemies.md`'s cage |
| **`bosses.md`** (consistency) | the camera side of the nine reveal clips (§2.3 table) is this file's; `bossIntro` refuses to start inside a cutscene; CS-10 begins from the stats overlay's `CONTINUE ▶`, so the 5.0 s beat ends on the overlay, not on a cut |
| **`enemies.md`** (addendum) | the goblin cart prop (1.8 × 1.0 m, rust timber, two wheels, pulled by two goblins) as the way cages travel; the cage's gibbet at each camp is where the cart's cage ends up |
| **`heroes.md`** (addendum, collected by the orchestrator) | a `wave` clip per kid (0.8 s, arm up, Isabella both arms) for CS-05, CS-10 and photo mode; a `rise` clip segment usable standalone (downed → one knee → standing, 0.8 s + 0.6 s); the first-person head layer mask (head, hair, pigtails, bows hidden for the camera's own rig); the `sit_down` / `stand_up` set `camp.md` already requested |
| **`story-beats.md`** (consistency) | CS-11 lands at 44 s, not 40 (the eight captions set the floor); CS-03's `onEnd` sets the clock to night (`p = 0.70`); the shard's three lights are off from CS-10 on and the post-game sky needs a rule for it (this file only stages the ending); the `A strange light glows in the distance...` and `A mysterious portal appears...` announces now fire on skip too |
| **`world-events-weather.md`** (consistency) | `cs.meteorSky` and `cs.void` as two more named sky sets; the crater's `warm` state (`crater.core.warm` `#FF9A3C`) after the ending; the Meteor Shower streak shader shares `src/render/fx/meteor.ts`; per-shot fog `far` and shadow overrides exist and are released at the cutscene's end |

**Conflicts found, and how this file designs around them.**

1. **Ed in CS-10** (`story-beats.md` §2.10 has Ed at the fire and the plane over the Ridge in one cutscene; `camp.md` §2.12 says the last shot has "all five at the fire" and the plane over the Ridge; `npcs.md` §5.3 item 4 resolves it: Ed flies the last pass). Followed `npcs.md`: all five are at the fire in shots 5–9, Ed leaves at shot 9, and the last frame has four kids and an empty stump under the plane, which is also exactly the title scene's state (`camp.md` §2.12 "Ed's stump empty because Ed is in the plane"). Listed for `camp.md` above.
2. **Two bar heights** (`heroes.md` §2.5.8 uses 12 %; `bosses.md` §2.3 and AR §13.1 use 60 px = 5.6 %). Not a conflict: two presets of one component, `bars.punch` for the 1.4 s combo beat and `bars.cinema` for everything else.
3. **CS-11's length** (`story-beats.md` §2.10: 40 s). The eight verbatim captions at a readable clamp take 27 s; 44 s is the floor. Listed for `story-beats.md`.
4. **The meteor's first-person "pan right"** (FC §7.1, L4755–4759) points away from the crater in the 3D layout. The pan's *direction* is a canvas artefact; its magnitudes and easing are kept and aimed at the crater's bearing (§2.5).
5. **`dungeons.md` absent.** CS-08 is designed from `story-beats.md` and `bosses.md`; the mirror crater's specifics are handed to `dungeons.md` above rather than assumed to exist there.
6. **CS-06's hour.** `story-beats.md` says "at dusk"; the beat fires on approach at any hour. Resolved by the sky override (§2.8), logged in §6.

---

## 6. Decisions logged

- 2026-09-06 · phase-0.5/cutscenes · One cinematic rig (`src/engine/camera/cinematic.ts`) with five modes (`cutscene`, `bossIntro`, `comboBeat`, `nudge`, `photo`), `bossIntro` lifted verbatim from bosses.md §2.3 and `comboBeat` from heroes.md §2.5.8 · one code path for every camera takeover, as both files asked · rejected: a separate cutscene camera class.
- 2026-09-06 · phase-0.5/cutscenes · v27's shot shape (`duration / onStart / draw / onEnd`, skip runs every remaining `onEnd`) kept as the data contract, with `draw` becoming the player's evaluation of a data `camera` / `action` / `captions` list · the shape is right and story-beats.md §4 asked for it; data shots are testable · rejected: code-per-shot.
- 2026-09-06 · phase-0.5/cutscenes · Cutscene bars are `#0B0E1A` at 5.6 % with the boss timing (0.5 s in, 0.4 s out), replacing v27's pure `#000` bars and 0.333 s in-time · the anti-palette bans pure black; one letterbox component with two presets (`bars.cinema`, `bars.punch` 12 % for the combo beat) · rejected: keeping two systems, keeping `#000`.
- 2026-09-06 · phase-0.5/cutscenes · Eight camera moves only (`cut`, `hold`, `push`, `dolly`, `crane`, `orbit`, `follow`, `first`), one move per shot, FOV change ≤ 6°/s · a small vocabulary keeps every cutscene in one voice and makes reduced motion a mechanical collapse · rejected: free camera paths.
- 2026-09-06 · phase-0.5/cutscenes · Lens rule: vertical FOV 24–50°, gameplay 35° · below 24° the facets and the tilt-shift flatten and the curved world shows its bend; above 50° the chunky heads stretch; a 26° band keeps every cut in the same world · rejected: an unrestricted lens, a fixed 35°.
- 2026-09-06 · phase-0.5/cutscenes · Cuts are hidden on action, on a match, on a `blink` (`#0B0E1A`, 0.12 s), or under a `flash` (`#FFF8E8`); `fade` only where a cutscene meets a DOM overlay; the letterbox-in is the transition from gameplay · a cut a kid notices is a cut that failed; a black dip is the anti-palette · rejected: fades between shots.
- 2026-09-06 · phase-0.5/cutscenes · Captions: two styles (line with portrait and name in the speaker's colour; announce centred in the string's v27 colour), typewriter 120 cps, on screen `clamp(chars × 0.06, 2.2, 5.5)` s, one line · matches the dialogue box's rate (npcs.md) and gives a kid time to read Noah's 88-character line · rejected: fixed 3 s captions, canvas text.
- 2026-09-06 · phase-0.5/cutscenes · Skip: armed at 1.0 s on a fresh press; runs remaining `onEnd`s (v27); world-state announces (`A strange light…`, `Grandpa Ed has crash-landed!`, `A mysterious portal appears...`) moved into `onEnd` so they fire on skip; a skip ends on a held final-frame card, never black; CS-04's prompt appears only when `dest.ready` · v27 lost the aftermath line on skip and a held key from the title could skip the opening · rejected: v27's instant skip, a skip that races streaming.
- 2026-09-06 · phase-0.5/cutscenes · Multiplayer: the host's cutscene plays on every client from a `cutscene.start {id, seed, tick}` message on the presentation clock; a skip needs every player's vote, or the host's vote after 5.0 s; the host chooses CS-04's destination and advances CS-06's lines · nobody loses a scene to another player's twitch, and nobody is held hostage by an idle guest; dialogue and interact are host-side in v27 · rejected: host-only skip, any-player skip.
- 2026-09-06 · phase-0.5/cutscenes · Autosave before CS-03, CS-06, CS-07 and 500 ms after CS-01, CS-03, CS-04, CS-05, CS-06, CS-07, CS-10, CS-11; never mid-cutscene; none around CS-08 · the v27 rescue-autosave rhythm; a reload replays the beat; story-beats' Home, Wrong is always re-entered from the portal · rejected: a save mid-flight, a save inside the shard's arrival.
- 2026-09-06 · phase-0.5/cutscenes · "Render, do not simulate" kept: the fixed step and the clock stop; cloth, particles, sway, water, clouds, the shared oscillators, the plane's motion sources and puppet clips run on the presentation clock; cutscenes drive puppets, never sim entities · v27's rule (SI §13.1) plus the 3D fact that a frozen flame or scarf gives the freeze away · rejected: running the sim at timescale 0.
- 2026-09-06 · phase-0.5/cutscenes · Cutscenes own the sky through `sky.override / release`; a cutscene that moves time sets the clock in `onEnd` (CS-01 → dawn 0.02, CS-03 → night 0.70, CS-10 → golden hour 0.54); CS-06 overrides to dusk whatever the hour; per-shot fog, shadow and curved-world overrides exist · AR §2.3 made literal; the meteor is seen against night and must not snap back to dusk; story-beats places CS-06 at dusk · rejected: leaving the clock where the cutscene found it, gating CS-06 on dusk (a kid could wait six minutes).
- 2026-09-06 · phase-0.5/cutscenes · Tilt-shift at half strength in cutscenes with the band on the shot's focus, off in first-person and sky-only shots (bloom ×1.5 there); photo mode turns it into a real focus control · world-events §2.4.3's rule, extended where a tilt-shift is a lie (an eye, a sky) · rejected: full strength everywhere, off everywhere.
- 2026-09-06 · phase-0.5/cutscenes · `cineShake` becomes rotational (±0.05° × intensity, decaying at 15/s); `screenShake` keeps AR §10.3's ladder with the ±0.3° roll · a head-mounted or long-lens camera that translates looks broken · rejected: porting the screen-space translation.
- 2026-09-06 · phase-0.5/cutscenes · CS-01 is 13 shots, 68.7 s: the cockpit, the Ridge, the spin from inside (a rigid plane-mounted camera so the horizon rolls eight times), the meadow, the skid, four line shots, the night sweep under Ed's last two lines, the Ridge silhouettes from 34 m (a long lens from the camp could not read a 0.9 m goblin at 130 m), the three carts with Liam down, and dawn on station S1's rig · the eight lines are 27 s of the budget; every other beat has one shot; the last frame is the gameplay frame so control returns without a cut · rejected: a montage under the lines, a shorter crash without the cockpit.
- 2026-09-06 · phase-0.5/cutscenes · The pre-crash plane is npcs.md's full `repaired` body; the raid's crowned silhouette is the Goblin King's rig, unnamed; the cages' cloth strips tell who is on which cart and the carts leave toward camps A, C and B; Ed is off-frame from the raid's first shot to dawn · a kid sees what they will rebuild, who took the kids, and where; nothing is shown or implied about what Ed did during the raid, so no claim is made about a real person beyond the canon lines · rejected: Ed asleep on screen, Ed fighting, no King on the Ridge.
- 2026-09-06 · phase-0.5/cutscenes · CS-01's skip card is the dawn frame held 1.5 s with the camp title card and the `👥 Siblings: 0/3` counter fading in · a kid who skips still knows where they are and who is missing · rejected: a text summary card (new text for nothing).
- 2026-09-06 · phase-0.5/cutscenes · CS-03 keeps all seven scenes at v27's exact durations, beats, numbers and flags, and adds a 2.0 s settle before them; scene 1 is first person from Liam's seated head at 0.90 m with the pan aimed at the crater's bearing (45°, to his left; v27's "right" was a canvas direction) and Ed on his stump behind the fire; scene 4's painted planet becomes the real island from 420 m (shadows, curved world and fog off for the shot); scene 5 frames the crater from the camp with the family in the foreground at FOV 24°; scene 6 pushes with v27's own `smoothDamp(0.15)` to a 70 m rig; a `cs.meteor.roar` cue is added · the seven scenes are sacred, so nothing was re-cut; the sky and the world are now real; v27's scenes 2–5 were silent only because it had no sounds · rejected: re-timing any scene, keeping the painted planet, a settle inside the 24.2 s.
- 2026-09-06 · phase-0.5/cutscenes · CS-04 is npcs.md §2.3.4's beat table shot in eight positions (board, dolly, rear chase with a 1.0 s cockpit cut-in on the `hopping` stall-drop, the wing-side sky leg with Ed's caption and a bench cut-in, the front-quarter descent, a trailing crane for the circuit, the strip-end hold for every bounce, the park) · the circuit is the island's establishing shot and the strip-end hold makes every landing record visible · rejected: a single follow camera.
- 2026-09-06 · phase-0.5/cutscenes · CS-05 (12 s): the clean start, the takeoff, the loop and the wing-rock seen from the apron with the four kids waving, the two-hop landing with Isabella first to the plane, the park; a `wave` clip per kid is requested · the canon tip says wave, npcs.md gave the plane a wave back, and "I call dibs" is a line · rejected: reusing a victory clip as a wave.
- 2026-09-06 · phase-0.5/cutscenes · CS-06 is a dialogue-scene mode: the dialogue box under the letterbox, one shot per line cut on the advance, Ed's portrait by mood, the 8 s pulse phase-aligned so line 1 starts on a pulse, the shard centred on "watching" · line-by-line skipping is the box's own hold rule; the crater's rhythm under Gran's line is AR §15.4's point · rejected: captions with auto-advance, a single hold.
- 2026-09-06 · phase-0.5/cutscenes · CS-07 flies the camera 170 m from the fire to the crater in 3.5 s on `ease3`; the portal is AR §15.3 at ×2 scale (base radius 1.5 m) as an emissive light object with `#A862C4` kept; Ed is seated at the stump one beat early · v27's 0.75 m portal is smaller than a kid; `#A862C4` is a light, not a body, so the hue rule does not bind it · rejected: a cut to the crater, the v27 size, recolouring the portal.
- 2026-09-06 · phase-0.5/cutscenes · CS-08 (8 s): arrival at a mirror crater whose glow hangs above the floor and pulses inward, then a 180° crane-orbit to the one far warm light with all four heads turning to it; no save around it · the far light is story-beats' title made literal and needs a reveal, not a cut; dungeons.md had not landed so the mirror crater is specified here and handed over · rejected: a first-person arrival, a static wide.
- 2026-09-06 · phase-0.5/cutscenes · CS-10 (52 s, 12 shots): the warm crater at dawn with Liam last out of the portal, the rim view of the camp with fog `far` at 220 m, the walk home past the Carved Oak with the deer, a `blink` as the time skip to golden hour, all five at the C7 fire, an orbit, the fox, the family in things, Ed to the plane, the takeoff, the Ridge crossing with the wing-rock and four kids waving, and station S5 as the last frame with the title over the tagline, an empty dedication line, and the victory overlay over the live scene; the plane lands behind the overlay; the shard's lights go out · the last frame is the title's camera so `🏠 TITLE` is a button cross-fade; a plane is never in two places; no new lines anywhere · rejected: a fade to the title, a static ending card, a new closing line.
- 2026-09-06 · phase-0.5/cutscenes · CS-11 is CS-01 shots 2–9 verbatim plus a dawn cut to camp C2, 44 s · the eight captions set a 27 s floor; story-beats' 40 s is a target · rejected: hurrying the captions, dropping lines.
- 2026-09-06 · phase-0.5/cutscenes · The camera side of bosses.md's nine reveal clips is fixed per boss (yaw side, pitch, distance multiplier); the guardian wake, the camp `Sit`, the boss-arena ×1.25 and stargazing are one `nudge` primitive · one place decides where the camera stands for every reveal; four files' small camera eases become one · rejected: per-boss camera code, four ease implementations.
- 2026-09-06 · phase-0.5/cutscenes · Photo mode: free yaw, pitch 5–80°, distance 2–30 m, FOV 24–50°, no roll, sphere-cast collision, a focus slider that makes the tilt-shift a real DoF, time-of-day override allowed (cosmetic), weather override not allowed, HUD hidden, camp.md's poses; single player freezes the sim, multiplayer does not and poses are host actions · Brief §4.5 photo mode with family poses; a weather that stops for a photo is a lie; a paused sim on one client desyncs · rejected: a pose editor, a weather override, a free-roll camera.
- 2026-09-06 · phase-0.5/cutscenes · Every cutscene ducks the music to 0.5 over 1.0 s and back over 1.5 s except CS-03, which keeps v27's 2.5 s to 0 and 2.0 s back; SFX never ducked · v27's meteor duck is the recipe; the rest need a lighter touch under captions · rejected: no ducking, ducking SFX.
- 2026-09-06 · phase-0.5/cutscenes · The goblin cart is a new prop that carries enemies.md's hung cage in CS-01 · three cages have to leave somehow, and a cart is a silhouette a kid reads from behind · rejected: goblins carrying cages by hand (unreadable at the lens).
- 2026-09-06 · phase-0.5/cutscenes · Cut: `_csZoom` and the edge clamp, the painted first-person scene and sprites, the painted planet, the 5 s black-bar dungeon cinematic (folded by bosses.md), `F10` (now `cutscene.play`), the DOM-only title · each is a v27 workaround for not having a world or a camera · rejected: porting any as-is.

---

## 7. Reconcile when the brainstorm doc lands

- Whether it resolved an explanation for the meteor; scene 4's framing (the arc passing under the shard, nothing implied) would follow it.
- Whether it has a shot list or beats for the crash, the ending or the flight; this file's tables would absorb any resolved beat with a §6 line for what changes.
- Whether photo mode had resolved features (filters, stickers, a family-crest stamp); §2.13 leaves filters to `ui-ux.md`.
- CS-11's length if the doc fixed 40 s as a hard number.
- Any resolved rule on multiplayer skips.

## 8. Open questions for the orchestrator

None from this file. The one optional line under the ending's tagline (a dedication in "Dad's" voice) is `story-beats.md` §8's open item, Andrew's to write; CS-10 shot 12 reserves its place as an empty third line at 60 % size and ships without it. Nothing here is blocked on it.
