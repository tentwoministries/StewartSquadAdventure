# Audio — Design Bible

**Status:** reviewed by orchestrator 2026-09-07; consistency pass applied 2026-09-07 · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** AUDIO_INVENTORY §1–§26 (all 29 recipes, BGM9, §22 replication, §23 call sites, §24 mix, §25 gaps, §26 port notes) · ATMOSPHERE_RECIPES §19, §8.2, §11, §4, §13 · FAMILY_CANON §12.1, §12.5, §10.1 (the `M: Mute` strip, L866), §12.4 (`Music: OFF` / `Music: ON`, L1405) · SYSTEMS_INVENTORY Part 2 §16.5, §18.1, §19.3 · legacy L538–L577, L695, L2261, L2381, L2402, L3412, L8508–L8541 verified by `grep -n` · **Depends on:** heroes.md, enemies.md, story-beats.md, world-events-weather.md, bosses.md, camp.md, npcs.md · **Reconciled 2026-09-07 with:** dungeons.md, cutscenes.md, ui-ux.md (written in the same wave; they landed first and own their cue names, adopted in §2.2.8 and §2.5.6; §5.3 items 8–10)
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

v27's twenty-nine `snd()` recipes port as data, verbatim, under a real bus and a voice pool, and every hook the other design files asked for becomes a parameter set in one of seventeen recipe families rather than a new sound. The two things v27 never had, ambient beds and a music engine that knows where you are and what is happening, are built the same way: oscillators, filtered noise and note data, no audio files, ever.

## 1. What v27 does

**The bootstrap (AU §1, L538–L541).** Three lines: a lazily created `AudioContext`, `initAudio()` swallowing any throw, and a net queue. `initAudio()` is called from six gesture handlers (canvas `mousedown` and `touchstart`, the title's Continue/Load and Start buttons). `ac.resume()` is never called (AU §25.7), so a context suspended by a backgrounded mobile tab stays silent. There is no master gain for SFX, no compressor, no panner, no convolver: every sound's own `GainNode` connects straight to `ac.destination` (L547), and the music's `bgm.masterGain` does the same (L8514).

**The dispatcher (AU §2, L542–L577).** `snd(type, vol)` with `vol` defaulting to 0.25; a flat `if / else if` chain of 29 exact-string branches, one recipe per source line; no table, no fallback (an unknown name silently does nothing), no throttle, no voice cap, no dedupe, and the per-call `GainNode` is never disconnected (AU §25.6). Every branch inherits an instantaneous attack from `g.gain.setValueAtTime(vol, t)`; most then ramp linearly to zero; several re-set the gain to a fraction first (`whirl` ×0.4, `ult` ×0.6, `boss` ×0.5, `victory` ×0.7, …, AU §24). Three names are called but never defined and are therefore silent in v27: `shield` (Liam's Aegis, L2261), `heal` (Phoenix Feather L2381 and the post-death auto-switch L2402) and `questComplete` (bounty complete, L695). All three verified by `sed -n` against the HTML.

**The 29 recipes, by synthesis (AU §3–§19).** Eight noise bursts: `hit` (70 ms, cubic decay, unfiltered), `sword` (130 ms, bandpass 2200 → 600 Hz Q 1.2), `boom` (350 ms, lowpass 500 → 80 Hz), `door_unlock` (400 ms, lowpass 500 → 80), `bars_slam` (200 ms, unfiltered), `rock_slide` (300 ms, fixed bandpass 300 Hz), `destroy_pot` (100 ms, highpass 2 kHz), `destroy_crate` (150 ms, bandpass 1.2 kHz). Fourteen single-oscillator glides: `arrow` (sine 900 → 180), `pickup` (sine 500 → 1200), `equip` (sine 400 → 1200), `chest_open` (sine 600 → 1200), `achieve` (triangle 700 → 1400), `ult` (square 200 → 800), `shadow_bolt` (square 400 → 80), `lever_pull` (square 200 → 100), `plate_click` (sine 300 held), `boss` (sawtooth 55 → 35 over 1 s), `miniboss` (sawtooth 80 → 50), and three multi-segment sweeps `whirl` (sawtooth 150 → 300 → 100), `kidnap` (sawtooth 300 → 600 → 300) and `event_start` (triangle 440 ⇄ 880 four times). Two contrary-motion pairs: `magic` (sine 600 → 1200 against triangle 900 → 400) and `portal` (sine 200 → 600 against triangle 300 → 100). Five arpeggios on child gains: `levelup` (C5 E5 G5 C6, 100 ms steps), `victory` (C5 D5 E5 G5 A5 C6, 150 ms), `victory_ext` (eight notes to E6, 180 ms), `revive` (G4 C5 E5 G5 sine, 120 ms), `puzzle_solve` (E5 G5 B5 E6, 80 ms). Every value is in AU §3–§19 and ports as data in §2.3 below.

**Where they fire (AU §23).** 151 call sites; `boom` 28, `equip` 15, `achieve` 13, `hit` 12, `magic` 12. `hit` is fired by `hitFx()` on every damage impact in the game (L1742). UI feedback is borrowed: the portrait strip plays `hit` at 0.15, menu confirms play `equip` at 0.3, overlays open and close silently, errors are silent (AU §3). Crits, blocks, footsteps, dodges, door closes and death have no sound (AU §25.10). Enemies have no sound of their own except the bomber's `boom`, the spawner's `boom` and the mini-boss growl (AU §8). Only four of the eight `BOSS_BLOCKS` make a sound (AU §9.3). Weather is silent except the strike's `boom` at 0.3 on the flash frame (AU §14). The biplane is silent (AU §15). `ALIEN_CRATER.hum` is declared `null` and never touched (AU §17). The meteor cutscene is one `boom` at 0.6 between a 2.5 s music duck-out and a 2.0 s duck-in (AU §18). Game over is silence plus `stopBGM9()` (AU §19).

**Music, BGM9 (AU §20, L8508–L8541).** State `bgm = {vol: 0.15, sfxVol: 1 (dead), muted, layers[]}`. Three tables by biome: `BGM_SCALES` (five notes each: forest C major pentatonic, cave A minor with a 2nd, desert a Hijaz-flavoured D set, swamp C minor pentatonic voiced from B♭, frozen E natural minor's first five, volcanic G harmonic-minor colour), `BGM_WAVES` (sine or triangle), `BGM_BPM` (72 / 56 / 68 / 48 / 60 / 88). `startBGM9` builds a drone at `root/2` (gain 0.15, 2 s fade) and a "fifth" that is really a fourth below (`root × 0.75`, gain 0.08). `tickMelody9` picks a uniform random scale note, coin-flips the octave, plays a bare sine with a 1.2 s exponential decay (0.1, desert 0.06). `updateBGM9` runs per frame off `dt`, re-arms the next note at `rnd(0.5, 3)` beats, and transitions on any biome change with a 2 s fade-out and a 500 ms `setTimeout` restart (a 1.5 s overlap, not a gap). Music never changes for bosses, night, weather, combat, low health or the Shadow Realm; the Citadel floors are absent from all three tables and fall back to C4 sine at 72 BPM (AU §25.5). `toggleMute9` (L8540) stops or restarts the BGM and announces `Music: OFF` / `Music: ON` in `#6B8EC8` for 1.5 s; `M` is the key (L938, L961, the hint strip `M: Mute` at L3412). Nothing audio-related is persisted (AU §1).

**Ambient loops (AU §21).** None. No wind, water, crickets, fire, drip, storm bed or room tone anywhere in 9,901 lines; `loop = true` never appears. The drone-plus-fourth pair is the only continuous sound and does double duty as ambience.

**Multiplayer (AU §22).** The host pushes every non-`hit` call as `{s, v: round(vol × 100), id}` into a queue capped at 5 that is sliced into every snapshot and never drained; guests replay by monotonic id and synthesise `hit` locally on death VFX (L8812, L8815).

**Mix (AU §24).** No buses; loudness is `vol × recipeScale` per call. Bands: auto-attacks 0.10–0.18, `hit` 0.12, pickups and confirms 0.2–0.4, signature 0.25 / ultimate 0.4, boss specials and deaths 0.4–0.5, boss intro and cutscene impact 0.5–0.6, music master 0.15. Boss death plays `boom` 0.5 and `victory` 0.5 on one line (L7638) and can clip.

**The oddities that change this design (AU §25).** The three undefined names; the dead crater hum; the dead `sfxVol`; no ambience; no Citadel music; the gain leak; no `resume()`; the un-drained net queue; the fourth called a fifth; no crit / block / dodge / footstep / menu / death sound; nothing spatialised. AU §26's port note (recipes as a typed table, a lookahead scheduler for music, noise buffers cached at boot, sound emitted as simulation events, a `PannerNode` and a per-name throttle) is adopted in full and extended below.

## 2. What it becomes

### 2.0 Conventions

- **Hook names** are dotted, lower camel, namespaced by owner: `hero.*`, `dodge.*`, `alert.*`, `enemy.*`, `death.*`, `horde.*`, `cage.*`, `boss.*`, `amb.*`, `thunder*`, `animal.*`, `fish.*`, `camp.*`, `plane.*`, `crate.*`, `frog.*`, `lantern.*`, `dlg.*`, `ui.*`, `card.*`, `photo.*`, `dng.*`, `grove.*`, `tomb.*`, `temple.*`, `ice.*`, `shard.*`, `cs.*`, `music.*`. The 29 v27 names and the three v27 left undefined keep their exact v27 spelling (`snake_case`) so every canon call site ports unchanged.
- **Volumes** are the v27 linear `vol` argument (0–1). "vol" in a table is the default the map applies when a call passes none; v27 names default to 0.25 exactly as v27 did. Decibel figures describe bus and duck moves only.
- **Pitch** in semitones (st) or Hz; "detune" is `OscillatorNode.detune` in cents, or `playbackRate` for a noise buffer.
- **Positional** means the cue is spatialised from its world position (§2.7); **2D** means it is not.
- **Bus** is one of `music`, `effects`, `ambient`, `dialogue` (§2.8).
- **Priority** P0–P6 is the voice-steal order of §2.7.4; P0 is never dropped.
- **v27** column: `kept` = the v27 recipe as-is; `site` = a v27 name at a v27 call site (the cue is the v27 recipe); `defined` = a v27 name that was undefined, given a recipe here; `new` = a new cue.
- Family parameter shorthand: `d` duration s · `p` decay power · `amp` buffer amplitude · `bp f0→f1 Q` bandpass sweep · `lp f0→f1` lowpass sweep · `hp f` highpass · `×g` the recipe's internal gain scale (v27's `vol*0.4` style) · `→0 t` gain ramps to zero at t · `st` semitones · `noiseMix g` a whoosh layer at gain g · `grains n` n short noise grains 30–40 ms apart at −6 dB · `tone` a tonal layer · `ring d` a held partial for d s · `trem f` amplitude tremolo at f Hz · `chain` a second cue fired at the end.
- **[new text]** marks every new user-facing string. There is one canon audio string pair, `Music: OFF` / `Music: ON`, and one canon hint token, `M: Mute`; both stay verbatim.

### 2.1 The family table

Seventeen families. Each has one base recipe (§2.4) and named parameters; every cue in the map (§2.2) is a member with parameter values. "Read in the mix" is what makes the family unmistakable when thirty voices are live at the orbit camera.

| Family | Base recipe (one line) | Members | v27 recipes reused | Read in the mix | Owner files |
|---|---|---|---|---|---|
| **impact** | one cached white-noise buffer, decay `(1−i/n)^p`, ≤ 0.25 s, optional fixed filter | 35 | `hit`, `destroy_pot`, `destroy_crate`, `bars_slam` | the shortest, driest thing on screen; no pitch, so it never fights the music | heroes, enemies, bosses, camp, npcs, dungeons |
| **whoosh** | the `sword` recipe: noise through a swept bandpass, 0.1–3 s | 31 | `sword`, `rock_slide` | air moving; a rising centre is a lift, a falling centre is a drop | heroes, enemies, bosses, camp, npcs, cutscenes |
| **boom** | the `boom` recipe: noise through a swept lowpass, optional rumble tail and tonal layer | 21 | `boom`, `door_unlock` | the only sub-100 Hz energy outside the music drone | everyone |
| **sweep** | one oscillator, one frequency ramp, one gain ramp | 35 | `arrow`, `pickup`, `equip`, `chest_open`, `achieve`, `ult`, `shadow_bolt`, `lever_pull` | a clean pitch line up or down; the game's "something happened" grammar | heroes, enemies, bosses, world, ui |
| **siren** | one oscillator, a list of (frequency, time) segments | 18 | `whirl`, `kidnap`, `event_start` | a pitch that changes its mind; alarms, wobbles, creaks | heroes, bosses, camp, npcs, cutscenes |
| **growl** | sawtooth sub-bass falling 20–40 %, 0.3–2 s, optional crackle | 14 | `boss`, `miniboss` | the floor shakes and nothing else does; reserved for things with a name card | bosses, enemies |
| **pair** | two oscillators in contrary motion (the `magic` / `portal` recipe), optional ring | 34 | `magic`, `portal` | two lines crossing: magic, doors between places, light appearing or leaving | heroes, enemies, bosses, camp, npcs |
| **arpeggio** | n voices on child gains, staggered, attack 20–40 ms, decay 130–360 ms | 24 | `levelup`, `victory`, `victory_ext`, `revive`, `puzzle_solve` | the only thing that plays a *tune*; always good news | heroes, world, camp, npcs, ui |
| **blip** | one oscillator, 15–80 ms, optional noise click | 29 | `plate_click` | too short to have a colour; text, clicks, ticks | npcs (dialogue), ui, camp, world |
| **step** | an impact per footfall with surface filter and a per-hero rate cap | 11 | — | the ground under the active kid; you notice it when it changes | heroes, dungeons |
| **engine** | two oscillators plus exhaust noise, roughness LFO, miss gate, state parameters, doppler | 8 | — | the one motor in the world; heard before it is seen | npcs, cutscenes |
| **crackle** | granular noise pops with a gain follower on a flame oscillator, plus rare louder pops | 13 | — | fire; the follower makes it *this* fire | camp, world, enemies, bosses, dungeons |
| **hum** | LFO-modulated oscillators attached to an object, start/stop, distance-faded | 12 | — | something that is *on*; beams, rifts, the crater, the shard | world, story, bosses |
| **bed** | looped pink/brown/white noise through 1–2 filters with slow LFOs; the island × phase × weather layers | 46 | — | the room the game is in; five layers minimum, never noticed until it changes | world, camp, dungeons |
| **chirp** | scheduled tonal grains: crickets, birds, frogs, drips, jingles; per-species contour | 28 | — | life; small, irregular, never on the beat | world, camp, npcs |
| **stinger** | musical one-shots on the music bus: chords, swells, the game-over fall | 8 | — | the story leaning in; ducks the music it sits on | cutscenes, story, ui |
| **music** | the BGM9 engine rebuilt: drone, fourth, drift melody, pulse, pad, bells, heartbeat; modes | 24 modes | BGM tables, drone, fourth, melody | the only thing that is never positional and never stops | everyone |

Family count is seventeen rather than twenty because dialogue blips, UI clicks and enemy alerts collapsed into `blip` and `sweep` without losing a parameter; adding families for them would have added code, not character.

### 2.2 The cue map

Every hook name any design file requested, plus every v27 name, with its family, its parameters (deltas from the family base in §2.4), its default `vol`, whether it is v27, whether it is positional, its bus and its priority. A cue written `A + B` is a composite: both members are dispatched on the same event, at the offsets given. A cue written `= X` is an alias of another cue at the stated volume (one recipe, two names, so a call site reads as its owner wrote it).

#### 2.2.1 The v27 port (29 kept verbatim, 3 defined)

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `hit` | impact | d .07 p3 amp 1, no filter, →0 .07 | .12 | kept | yes | effects | P5 | throttle 40 ms, ≤ 6 overlapping (§2.7.4) |
| `sword` | whoosh | d .13 p2 amp .7, bp 2200→600 Q1.2 | .18 | kept | yes | effects | P4 | Liam's basic attack |
| `arrow` | sweep | sine 900→180 exp .10, →0 .10, stop .12 | .12 | kept | yes | effects | P4 | Noah's shot; Noah's co-op mark at .3 |
| `magic` | pair | sine 600→1200 exp .2 · tri 900→400 exp .2, →0 .25 | .12 | kept | yes | effects | P4 | Collette's bolt; blink arrival .2; Arcane Link .3; Wyrm breath .2; boss casts .2–.3 |
| `whirl` | siren | saw [150,0]→[300,.15]→[100,.3], ×.4, →0 .3 | .10 | kept | yes | effects | P4 | Isabella's whirl; King spin .3; charge telegraph .2 |
| `pickup` | sweep | sine 500→1200 exp .12, →0 .18 | .20 | kept | yes | effects | P3 | loot orb .2; bounty claim, sale, purchase .3; secret .4 |
| `levelup` | arpeggio | tri [523,659,784,1047] step .10 atk .02 dec .18 ×1 | .40 | kept | 2D | effects | P1 | the level card |
| `ult` | sweep | square 200→800 exp .3, ×.6, →0 .5 | .25 | kept | 2D active hero, pos companions | effects | P1 | signature .25, ultimate .4 (v27) |
| `boss` | growl | saw 55→35 lin 1.0, ×.5, →0 1.2, stop 1.3 | .50 | kept | 2D | effects | **P0** | intro card at 0.8 s; phase change .4 |
| `victory` | arpeggio | tri [523,587,659,784,880,1047] step .15 atk .03 dec .27 ×.7 | .50 | kept | 2D | effects | P1 | boss death, dungeon clear; `ALL HEROES FREE!` .3 |
| `boom` | boom | d .35 p1.5 amp 1, lp 500→80, →0 .35 | .30 | kept | yes | effects | P2 | 28 v27 sites; the workhorse |
| `equip` | sweep | sine 400→1200 exp .2, →0 .28 | .40 | kept | 2D | effects | P3 | gear .4, cage .5, crate .15/.3, confirm .3, room clear .3, key .4 |
| `revive` | arpeggio | sine [392,523,659,784] step .12 atk .03 dec .22 ×.6 | .35 | kept | yes | effects | P1 | teammate revive |
| `miniboss` | growl | saw 80→50 lin .8, ×.5, →0 1.0, stop 1.1 | .40 | kept | yes (far) | effects | P0 | guardian wake (enemies §2.7) |
| `portal` | pair | sine 200→600 exp .6 · tri 300→100 exp .8, ×.5, →0 .8 | .40 | kept | yes | effects | P2 | portal open/enter .4; boss blinks .3; Isabella co-op teleport .4 |
| `shadow_bolt` | sweep | square 400→80 exp .15, ×.3, →0 .2 | .20 | kept | yes | effects | P4 | Queen fan of 6: one cue per volley, not per bolt |
| `kidnap` | siren | saw [300,0]→[600,.3]→[300,.6], ×.4, →0 .8 | .40 | kept | 2D | effects | **P0** | the alarm; never dropped |
| `victory_ext` | arpeggio | tri [523,587,659,784,880,1047,1175,1319] step .18 atk .04 dec .36 ×.8 | .50 | kept | 2D | effects | **P0** | the Queen's death only |
| `event_start` | siren | tri [440,0]→[880,.1]→[440,.2]→[880,.3] exp, →0 .4 | .30 | kept | 2D | effects | P2 | every world event |
| `achieve` | sweep | tri 700→1400 exp .15, →0 .3 | .30 | kept | 2D | effects | P3 | achievements .3, quest progress .2, save .2, tutorial .15, flavour .15, freed hero .3 |
| `puzzle_solve` | arpeggio | tri [659,784,988,1319] step .08 atk .02 dec .13 ×.7 | .40 | kept | yes | effects | P2 | dungeons |
| `door_unlock` | boom | d .4 p2 amp .5, lp 500→80, ×.6 | .40 | kept | yes | effects | P2 | dungeons |
| `rock_slide` | whoosh | d .3 p1.5 amp .4, bp 300 Q1 fixed | .25 | kept | yes | effects | P4 | block slides; earthquake at .5 s and 2.2 s |
| `chest_open` | sweep | sine 600→1200 exp .3, ×.5, →0 .5 | .40 | kept | yes | effects | P2 | chests .4, bonus chest .3 |
| `plate_click` | blip | sine 300 d .05 ×.4 | .30 | kept | yes | effects | P4 | press .3, release .2 (v27) |
| `lever_pull` | sweep | square 200→100 lin .08, ×.35, →0 .1 | .30 | kept | yes | effects | P3 | dungeons |
| `bars_slam` | impact | d .2 p1.5 amp .6, no filter, ×.5 | .30 | kept | yes | effects | P2 | room entry |
| `destroy_pot` | impact | d .1 p3 amp .5, hp 2000 | .25 | kept | yes | effects | P5 | pots, bones .25; Titan plates .3; Shieldbearer shield, elite shield |
| `destroy_crate` | impact | d .15 p2 amp .45, bp 1200 Q1 | .25 | kept | yes | effects | P5 | crates .25, pushable block .3 |
| `shield` | pair | sine 330→990 exp .25 · tri 495 held, ring .35, ×.5, →0 .5; + `impact` d .04 hp 3000 amp .5 at 0 | .20 | **defined** | 2D | effects | P2 | `Aegis activated!` (heroes §2.5.10); a steel ring opening upward |
| `heal` | arpeggio | sine [523,659,784] step .09 atk .03 dec .30 ×.5 | .30 | **defined** | 2D | effects | P2 | Phoenix Feather / Second Wind (L2381); `revive`'s first three notes, faster. The L2402 auto-switch site now uses `hero.swap.<hero>` at .2 (§2.2.2) |
| `questComplete` | arpeggio | tri [523,659,1047] step .09 atk .02 dec .25 ×.7; + `impact` d .08 bp 1100 Q2 amp .6 at 0 (the board's nail) | .30 | **defined** | 2D | effects | P2 | `Bounty complete: <name>!` (L695); the board's own three-note stamp |

#### 2.2.2 Heroes (heroes.md §5, §2.5.3–§2.5.8)

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `dodge.liam` | whoosh | d .30 p1.5 amp .6, bp 400→150 Q .8 | .14 | new | 2D active / pos companion | effects | P3 | shield and armour rolling: low, heavy |
| `dodge.noah` | whoosh | d .22 p2 amp .5, bp 2600→900 Q1 | .12 | new | same | effects | P3 | quick and bright; his Dodge Roll signature uses this at .18 plus `ult` .25 (v27 site) |
| `dodge.collette` | whoosh | d .35 p1.5 amp .45, bp 1200→2400 Q1.5 | .12 | new | same | effects | P3 | rising: a robe flaring |
| `dodge.isabella` | whoosh | d .28 p2 amp .6, bp 700→300 Q .9; chain `impact` d .06 lp 400 amp .5 at .26 | .14 | new | same | effects | P3 | the hammer drags and thumps at the end |
| `hero.snapShot` | arpeggio | sine [880,1319] step .09 atk .01 dec .18 ×.6 | .25 | new | 2D | effects | P1 | the 1 s window opens: A5 → E6, two notes |
| `hero.swap.liam` / `.noah` / `.collette` / `.isabella` | arpeggio | tri two notes: Liam [392,523] · Noah [523,659] · Collette [659,880] · Isabella [784,1047]; step .07 atk .01 dec .15 ×.5 | .18 | new | 2D | effects | P3 | the pitch says who (oldest lowest); replaces v27's `hit` .15 on the portrait strip; the post-death auto-switch plays it at .2 |
| `hero.bash.impact` | impact | d .12 p2 amp .8, bp 1400 Q4 (a ring) | .30 | new | yes | effects | P2 | Shield Bash first contact (hit-stop 0.06); `boom` .2 at the dash end stays (v27 site) |
| `hero.pound.impact` | boom | d .3 p2 amp 1, lp 400→60 | .35 | new | yes | effects | P2 | Ground Pound *connect* (hit-stop 0.06); layered on the v27 `boom` .3 landing only when an enemy is hit |
| `hero.finisher` | whoosh | d .09 p2.5 amp .9, bp 2400→900 Q1.5 | .20 | new | yes | effects | P3 | third-hit finisher on connect (hit-stop 0.04) |
| `hero.combo.rise` | siren | saw [110,0]→[440,.75], lp 2000, ×.35 | .30 | new | 2D | effects | P1 | the combo beat's 0.75 s riser under the two-shot; the v27 `boom` .5 lands at 0.75 s |
| `hero.excalibur.strike` | boom | d .4 p1.5 amp 1, lp 600→90, tone sine 1760→440 .3 | .40 | new | yes | effects | P2 | Excalibur's cross (v27 silent, AU §5) |
| `hero.storm.arrow` | impact | d .05 p3 amp .4, hp 1500 | .08 | new | yes | effects | P5 | one per Arrow Storm impact; dedupe merges to ≤ 8 voices |
| `hero.nova.burst` | pair | sine 1200→200 exp .5 · tri 600→150 exp .6, ×.5, →0 .6 | .35 | new | yes | effects | P2 | Arcane Nova's collapse and rings |
| `hero.emote.<hero>` | blip | = `dlg.blip.<hero>` × 3 over 0.25 s | .06 | new | 2D | dialogue | P4 | the bubble "types"; no stinger (§6) |
| `step.<surface>` | step | see §2.4.10 | .05–.10 | new | yes | effects | P6 | active hero only; companions at 50 % within 3 m |

v27 sites kept for heroes: `sword` .18, `arrow` .12, `magic` .12, `whirl` .10 (basic attacks); `boom` .2 on Shockwave; `ult` .25 / .4; `boom` .2 (Bash end), `magic` .2 (Blink), `boom` .3 (Pound landing); `boom` .5 twice (Meteor Drop cast and impact); `boom` .5 (every combo pair, at the beat's 0.75 s); `levelup` .4; `revive` .35; `equip` .4 / `pickup`; `achieve` .4 (Rally Cry), `arrow` .3 (Hunter's Mark), `magic` .3 (Arcane Link), `portal` .4 (Isabella's teleport-to-ally).

#### 2.2.3 Enemies (enemies.md §5, §2.4, §2.7, §2.8)

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `alert.runt` | sweep | tri 900→1300 exp .06, →0 .12 | .15 | new | yes | effects | P4 | a goblin yip |
| `alert.hulk` | sweep | square 180→120 lin .12, lp 800, →0 .25 | .18 | new | yes | effects | P4 | a chesty grunt |
| `alert.flier` | sweep | sine 1400→2000 exp .05, →0 .09 | .12 | new | yes | effects | P4 | a squeak |
| `alert.blob` | sweep | sine 300→220 exp .09, →0 .14 | .15 | new | yes | effects | P4 | a blorp |
| `alert.floater` | sweep | tri 500→250 exp .2, noiseMix .3, →0 .3 | .12 | new | yes | effects | P4 | a breath out |
| `alert.guardian` | growl | = `miniboss` .4 | .40 | site | yes (far) | effects | P0 | the wake beat |
| `windup.runt` | whoosh | d .2 p1.5 amp .4, bp 1200→2000 | .12 | new | yes | effects | P4 | a club raised |
| `windup.hulk` | whoosh | d .45 p1 amp .5, bp 300→900 | .16 | new | yes | effects | P4 | the Brute's paw uses this too |
| `windup.flier` | sweep | sine 2000→2600 exp .10, →0 .14 | .10 | new | yes | effects | P4 | the Sprite's touch-burn |
| `windup.blob` | sweep | sine 200→320 exp .30, →0 .35 | .12 | new | yes | effects | P4 | a squash stretching |
| `windup.floater` | siren | tri [400,0]→[700,.25]→[350,.45], noiseMix .4, →0 .45 | .12 | new | yes | effects | P4 | a claw drawn back |
| `enemy.bat.dive` | whoosh | d .3 p2 amp .4, bp 3000→1200 | .12 | new | yes | effects | P4 | the 0.3 s line then the dive |
| `enemy.spark.loop` | crackle | density 12/s, hp 3000, gain .06, no follower; loop while alive; nearest 4 only | .10 | new | yes | effects | P6 | Ember Sprite |
| `enemy.fuse.loop` | crackle | density 25/s, hp 2500, gain .10, d .5 | .20 | new | yes | effects | P3 | the Bomber's 0.5 s fuse; then `boom` .2 (v27) |
| `enemy.wraith.blinkOut` | pair | sine 700→140 exp .35 · tri 900→200 exp .4, ×.4 | .15 | new | yes | effects | P4 | the shroud collapses |
| `enemy.wraith.blinkIn` | pair | sine 140→700 exp .3 · tri 200→900 exp .3, ×.4 | .15 | new | yes (at the ring) | effects | P4 | behind you |
| `enemy.healer.beam` | pair | sine 660→990 exp .6 · tri 330 held .6, trem 8, ×.35 | .15 | new | yes | effects | P4 | the teal beam's 0.6 s |
| `enemy.brute.stomp` | impact | d .12 p2 amp .8, lp 250 | .20 | new | yes | effects | P4 | fired by the sim at each charge footfall (8/s); the "stomp loop" |
| `enemy.guard.wake` | growl | saw 70→45 lin 1.2, ×.5, noiseMix .3 (seams igniting) | .30 | new | yes | effects | P2 | Obsidian Guard's 1.2 s |
| `enemy.shroom.pop` | impact | d .08 p2 amp .5, bp 500 Q3 (hollow) | .20 | new | yes | effects | P4 | the cap lifts |
| `enemy.idle.runt` | growl | saw 140→110 lin .3, ×.2 | .08 | new | yes | effects | P6 | every 6–14 s per enemy, ≤ 3 live; blood moon detune −300 cents (world-events §2.5.2) |
| `enemy.idle.hulk` | growl | saw 60→45 lin .6, ×.25 | .10 | new | yes | effects | P6 | as above |
| `enemy.idle.flier` | sweep | sine 3000→2200 exp .05 | .06 | new | yes | effects | P6 | as above |
| `enemy.idle.blob` | sweep | = `alert.blob` at .07 | .07 | new | yes | effects | P6 | as above |
| `enemy.idle.floater` | whoosh | d .6 p1 amp .2, bp 400→300 Q1 | .08 | new | yes | effects | P6 | a whisper |
| `death.shatter` | impact | d .18 p2 amp .6, hp 1800, grains 3 | .25 | new | yes | effects | P4 | Goblin, Archer, Bomber, Skeleton, Bat, Sprite, Magma Slime |
| `death.dissolve` | pair | sine 500→120 exp .45 · tri 800→200 exp .45, noiseMix .3, ×.4 | .22 | new | yes | effects | P4 | Healer, Orc, Shieldbearer, Guard, Slime, Shroom, Elemental |
| `death.collapse` | boom | d .45 p1.5 amp 1, lp 350→60 | .30 | new | yes | effects | P4 | Troll, Brute |
| `death.glow` | pair | sine 300→1800 exp .5 · tri 450→2400 exp .5, ×.35 | .22 | new | yes | effects | P4 | Wraith, boss adds on the death beat, the shadow deer |
| `death.golem` | boom | d .9 p1 amp 1, lp 400→50, tail 1.2 s; + `destroy_pot` grains 4 at .1–.4 | .45 | new | yes | effects | P2 | crumbles to boulders; the v27 `boom` .5 site is this cue |
| `death.sandworm` | whoosh | d .8 p1 amp .5, bp 200→80; + `boom` d .5 lp 300→60 at .5 | .40 | new | yes | effects | P2 | sinks into the sand |
| `death.hydra` | whoosh | d .7 p1 amp .5, bp 600→200; + `chirp` plop ×3 (sine 900→300 .06) at .2/.35/.55 | .40 | new | yes | effects | P2 | under the water; the split at 50 % uses `boss.hydraSplit` at .3 |
| `death.wyrm` | impact | d .3 p2 amp .7, hp 2500, grains 6 over .4; + `pair` sine 1500→3000 exp .5 · tri 2250→4500 .5 ×.3 | .40 | new | yes | effects | P2 | shatters into ice |
| `horde.totem.crack` | impact | d .15 p2 amp .6, bp 900 Q2 (wood) | .30 | new | yes | effects | P3 | the 0.3 s crack |
| `horde.totem.topple` | boom | d .8 p1.5 amp 1, lp 500→70, tail .6; + `crackle` burst .5 s (the brazier bursts) | .35 | new | yes | effects | P2 | the v27 `boom` .35 site; named `horde.*` not `camp.*` (§5) |
| `cage.lockPop` | impact | d .10 p3 amp .7, bp 2400 Q3 (iron) | .35 | new | yes | effects | P2 | + `equip` .5 (v27 site kept, enemies §2.8) |
| `cage.lanternRelease` | pair | sine 440→1320 exp 1.2 · tri 660→1980 exp 1.2, ×.3, gain follows the lantern's 1.2 s fade | .25 | new | yes | effects | P1 | the light released: the title, once per sibling |
| `plate.absorb` | impact | d .05 p3 amp .4, bp 3000 Q4 | .10 | new | yes | effects | P5 | a shield absorbing a hit (6 sparks) |
| `plate.shatter` | impact | = `destroy_pot` .3, grains 8 | .30 | site | yes | effects | P3 | Shieldbearer's shield, the elite dome, Titan plates |

v27 sites kept for enemies: `boom` .2 (Bomber, after the fuse), `boom` .35 (camp destroyed = `horde.totem.topple`), `miniboss` .4 (wake), `boom` .4 (Sandworm emerge), `magic` .2 (Wyrm breath), `boom` .3 (Golem slam), `boom` .5 (guardian deaths = the four `death.*` cues above), `equip` .5 (cage), `hit` .12 on every impact.

#### 2.2.4 Bosses (bosses.md §2.2, §2.3, §2.5, §5.2: the 31 `boss.*` cues and the v27 names at their sites)

Boss cues are positional at the boss with the `mid` attenuation class (§2.7.2) so the whole 20 × 16 m arena hears them; the growls, the phase banners and the arena-wide hazards are 2D.

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `boss.intro.growl` | growl | = `boss` .5 | .50 | site | 2D | effects | **P0** | at 0.8 s of the intro (§2.8.3) |
| `boss.phase` | growl | = `boss` .4 | .40 | site | 2D | effects | P0 | every phase transition's 1.5 s beat |
| `boss.blastFire` | boom | d .5 p1.5 amp 1, lp 900→100, tone sine 880→220 .4 | .40 | new | yes | effects | P2 | the gold ring; `magic` .3 on cast stays |
| `boss.cocoonSeal` | pair | sine 600→150 exp .8 · tri 450→112 exp .8, lp 1500, ×.5 | .35 | new | yes | effects | P2 | the shell closes |
| `boss.cocoonCrack` | impact | d .2 p2 amp .7, bp 1500 Q2, grains 3 | .30 | new | yes | effects | P2 | per wave; `boom` .4 on shatter stays |
| `boss.tetherOn` | pair + hum | pair sine 220→440 exp .3 · tri 330→660 exp .3 ×.4; then hum `boss.tetherLoop` (saw 110, lp 600, trem 0.95 Hz to match the beam's `sin(t·6)` alpha, gain .10) until `boss.tetherBreak` or timeout | .25 | new | yes | effects | P2 | the beam is audible for its whole life |
| `boss.tetherBreak` | impact | d .15 p2 amp .8, bp 2000 Q2, grains 4; + sweep tri 660→200 exp .2 | .30 | new | yes | effects | P2 | the anchor's 10 shards |
| `boss.hazardSpawn.fire` | crackle | burst .6 s density 30/s hp 1500; + `boom` d .25 lp 500→100 amp .6 | .25 | new | yes | effects | P3 | scorch and embers |
| `boss.hazardSpawn.poison` | chirp | 4 bubble grains sine 180→90 d .12 at 0/.15/.28/.45 | .22 | new | yes | effects | P3 | the puddle bubbles |
| `boss.hazardSpawn.ice` | pair | sine 1200→2400 exp .4 · tri 1800 held .4, ×.35; + impact grains 3 hp 4000 | .25 | new | yes | effects | P3 | frost and glitter |
| `boss.hazardSpawn.sand` | whoosh | d .8 p1 amp .4, bp 400→200 | .22 | new | yes | effects | P3 | the sinking whirl |
| `boss.hazardSpawn.wall` | boom | d .5 p1.5 amp 1, lp 600→90; + impact grains 4 bp 900 | .35 | new | yes | effects | P2 | the ice wall rises |
| `boss.hazardSpawn.spike` | impact | d .1 p3 amp .7, hp 2500, grains 4 at 40 ms | .28 | new | yes | effects | P3 | Outer Ward spikes, each 2 s cycle |
| `boss.hazardSpawn.shadow` | pair | sine 200→60 exp .6 · tri 300→90 exp .6, lp 900, ×.4 | .25 | new | yes | effects | P3 | shadow pools |
| `boss.wallStun` | boom | d .5 p1.5 amp 1, lp 700→80, tail .4; + impact grains 6 bp 700 (the stakes) | .40 | new | yes | effects | P2 | `boom` .3 + shake on charge end stays |
| `boss.fieldOn` | pair | sine 300→900 exp .4 · tri 450 held .8, trem 8, ×.4 | .30 | new | yes | effects | P2 | Deep Freeze closes |
| `boss.fieldBreak` | impact | d .2 p2 amp .8, bp 2200 Q2, grains 8; + sweep sine 900→300 exp .3 | .35 | new | yes | effects | P2 | `Field broken!`; the v27 shake and 12 shards |
| `boss.shieldUp` | pair | sine 220→880 exp .6 · tri 330→1320 exp .6, ring .6, ×.4 | .30 | new | yes | effects | P2 | `Shield up! Kill the minions!`; the dome's shatter is `destroy_pot` .3 |
| `boss.cageShut` | impact + boom | impact d .25 p1.5 amp .9 bp 1200 Q2.5 (iron); boom d .3 lp 300→60 at .05 (the weight) | .45 | new | yes | effects | **P0** | `Heroes captured!`; the intro's 2.1 s |
| `boss.summon.king` | growl + sweep | growl saw 90→60 lin .5 ×.3; sweep square 220→330 exp .3 (a horn) at .2 | .30 | new | yes | effects | P3 | goblins out of the palisade |
| `boss.summon.treant` | pair | sine 150→300 exp 1.0 · tri 100→200 exp 1.0, noiseMix .3 (a creak), ×.4 | .30 | new | yes | effects | P3 | sprites and saplings rise |
| `boss.summon.pharaoh` | whoosh + sweep | whoosh d .9 p1 amp .5 bp 800→300 (sand); sweep tri 660→330 exp .4 at .3 | .30 | new | yes | effects | P3 | Sand Soldiers, Scarabs |
| `boss.summon.warden` | pair | sine 200→50 exp .6 · tri 300→75 exp .6, lp 800, ×.4 | .30 | new | yes | effects | P3 | Shadow Spawn |
| `boss.summon.queen` | pair | sine 400→100 exp .8 · tri 600→150 exp .8, ×.4; + a delayed copy at −12 st 0.25 s later ×.5 (her shadow) | .35 | new | yes | effects | P3 | `Shadow clones appear!` |
| `boss.summon.titan` | crackle + boom | crackle burst .8 s density 40/s; boom d .4 lp 500→90 amp .8 | .30 | new | yes | effects | P3 | Embers out of the lake |
| `boss.dizzy` | siren | tri [880,0]→[660,.3]→[880,.6]→[660,.9]→[880,1.2], ×.3 | .20 | new | yes | effects | P3 | the King's 1.5 s dizzy stun |
| `boss.ring` | sweep | square 300→120 exp .2, ×.3 | .20 | new | yes | effects | P3 | once per volley of 8 or 12 |
| `boss.rootSever` | impact + whoosh | impact d .2 p2 amp .7 bp 700 Q2 (wood); whoosh d .3 bp 2000→600 amp .4 | .30 | new | yes | effects | P2 | `Sever the roots!` made audible |
| `boss.phantomPop` | impact + whoosh | impact d .12 hp 1800 amp .6; whoosh d .4 bp 900→300 amp .4 (sand) | .25 | new | yes | effects | P3 | a decoy bursts into Scarabs |
| `boss.hydraHiss` | whoosh | d .6 p1 amp .5, bp 3500→2500 Q .8 | .20 | new | yes | effects | P3 | per head windup |
| `boss.hydraSplit` | boom + siren | boom d .7 lp 500→70 amp 1; siren saw [120,0]→[240,.4]→[90,.9] ×.4; + 3 water plops | .40 | new | yes | effects | P2 | `The Hydra splits!` (v27 silent) |
| `boss.beamCharge` | siren | sine [200,0]→[1600,1.2], noiseMix .3, ×.4 | .30 | new | yes | effects | P2 | 1.2 s telegraph |
| `boss.beamLoop` | hum | saw 110 + sine 220, lp 900, trem 12, gain .12; loop the 2 s sweep, stop on end | .30 | new | yes | effects | P2 | the beam itself |
| `boss.reflect` | pair | sine 2400→600 exp .2 · tri 3600→900 exp .2, ×.4; + `plate.absorb` | .30 | new | yes | effects | P3 | `REFLECTED!` |
| `boss.channelStart` | growl + hum | growl saw 45→40 lin 1.5 ×.5; hum `boss.channelLoop` (sine 55 + saw 110, lp 500, trem 4, gain .10) until break or end | .35 | new | 2D | effects | P1 | the Lich's BLIZZARD, the Queen's kidnap channel |
| `boss.channelBreak` | impact + sweep | impact d .2 bp 2500 amp .8 grains 6; sweep tri 1200→300 exp .25 | .35 | new | 2D | effects | P1 | the channel bar snaps |
| `boss.kidnapBreak` | sweep + impact | sweep square 600→1200 exp .15 ×.4; impact grains 4 hp 2500 | .35 | new | 2D | effects | **P0** | `Kidnap interrupted!` |
| `boss.meltdown` | boom | d 1.2 p1 amp 1, lp 800→60, tail 1.5; + crackle burst 1.0 s | .50 | new | 2D | effects | P1 | the 1.5 s band; unavoidable, so it is loud |
| `boss.titanEnrage` | growl | saw 60→40 lin 1.4, ×.6, noiseMix .4 | .50 | new | 2D | effects | P0 | `TITAN ENRAGES!` |
| `boss.shadowStep` | pair | sine 500→100 exp .3 · tri 750→150 exp .3, ×.4; chain `enemy.wraith.blinkIn` | .25 | new | yes | effects | P3 | the shadow squad at 30 % |
| `boss.wardenShift` | siren | saw [80,0]→[160,.5]→[60,1.0], lp 700, ×.4 | .40 | new | 2D | effects | P0 | `The Warden shifts to shadow magic!` |
| `boss.voidForm` | growl + pair | growl saw 50→30 lin 1.5 ×.6; pair sine 100→800 exp .8 · tri 150→1200 exp .8 lp 1500 ×.3 | .50 | new | 2D | effects | P0 | `VOID FORM UNLEASHED!` |
| `boss.queenClone` | pair | sine 600→300 exp .6 · tri 900→450 exp .6, ×.4; + the −12 st copy 0.25 s later | .35 | new | 2D | effects | P0 | `The Shadow Queen summons clones!` |
| `boss.queenDesperation` | growl + siren | growl saw 45→28 lin 2.0 ×.6; siren square [220,0]→[440,.3]→[220,.6]→[440,.9] ×.3 | .50 | new | 2D | effects | **P0** | `DESPERATION - She fights for survival!` |

v27 sites kept for bosses (bosses §2.2 and §2.5): `boss` .5 (intro at 0.8 s) and .4 (phase); `boom` .5 (King roar, King slam, kidnap success, every boss death), .4 (cocoon shatter, other slams), .6 (Titan drop-in), .3 (charge end, sweep); `magic` .3 (radialBlast cast), .2 (grab, sprays, King throws); `whirl` .2 (charge telegraph), .3 (spin); `portal` .3 (blinks, phantom shifts); `hit` .2 (melee); `kidnap` .4; `shadow_bolt` .2; `achieve` .3 (a freed hero); `victory` .3 (`ALL HEROES FREE!`) and .5 (death); `victory_ext` .5 (the Queen); `destroy_pot` .3 (plates, domes); `miniboss` .4 (Sentinel and Phantom Warden wake beats, `enemies.md` §2.7 grammar). The boss death beat's `boom` .5 + `victory` .5 on one beat is kept and no longer clips because both pass through the limiter (§2.8).

#### 2.2.5 World, weather, events, animals, fishing (world-events-weather.md §2.2.3, §2.2.4, §2.5.2, §2.7, §5.2; story-beats.md §5)

Beds (`amb.*` with an island or dungeon key) are specified in §2.5 and listed here only by name so the map is complete.

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `amb.forest.dawn` `.day` `.dusk` `.night` · `amb.desert.*` · `amb.bog.*` · `amb.frozen.*` · `amb.shadow.*` | bed | §2.5.2 (20 beds) | — | new | 2D | ambient | bed | the island × phase base layer |
| `amb.rain` | bed | §2.5.3 | — | new | 2D | ambient | bed | + `amb.rainLeaves` on Forest, `amb.rainWater` near water |
| `amb.rainLeaves` · `amb.rainWater` | bed | §2.5.3 | — | new | 2D / near water | ambient | bed | layered on `amb.rain` |
| `amb.storm` | bed | §2.5.3 | — | new | 2D | ambient | bed | rain ×1.6 + wind gusts |
| `amb.snowHush` · `amb.blizzard` · `amb.sandstorm` · `amb.fogDrip` · `amb.fogHush` · `amb.ashfall` · `amb.rift` | bed | §2.5.3 | — | new | 2D | ambient | bed | one per weather type; ducks per §2.5.5 |
| `thunder` | boom | d .35 p1.5 amp 1, lp 500→80 (the v27 `boom` .3 exactly), + tail: brown noise 1.2 s, lp 120, p1, ×.25 | .30 | site + new tail | yes (`far` class, at the strike) | effects | P1 | at the flash (world-events §2.2.4) |
| `thunder.far` | boom | d .6 p1 amp .6, lp 200→60, tail 2.0 s lp 90 ×.3 | .20 | new | pan only (no distance), toward the sheet-lightning azimuth | effects | P2 | 0.8–2.0 s after the sheet flash, scheduled by world-events |
| `thunder.rift` | boom + hum | `thunder` with playbackRate .5 and lp cutoffs ×.5 (−12 st); + hum sine 55 ×.3 for .8 s | .30 | new | yes | effects | P1 | rift cyan lightning |
| `quake.rumble` | boom | d 3.0 p .5 amp 1, lp 90→40, tail .5 | .50 | new | 2D | effects | P1 | the 3 s; `rock_slide` .25 at 0.5 s and 2.2 s (v27 recipe) |
| `event_start` | siren | v27 | .30 | kept | 2D | effects | P2 | every event's announce; caravan and treasure at .3, the three new events at .25 |
| `amb.bloodMoon` | hum | sine 41 + saw 82 lp 200, LFO .1 Hz ±3 dB, gain .12; in 3 s, out 5 s | — | new | 2D | ambient | loop | ducks the island bed −8 dB |
| `amb.spring` | bed | water trickle: white noise bp 1800 Q .7 with two LFO peaks (3 Hz, 5 Hz) ±4 dB, gain .08 | — | new | yes (basin, r 12 m) | ambient | loop | while the spring lives |
| `treasure.jingle` | chirp | tri grains from [1568,1760,2093,2349] d .04 at 9 Hz ± 30 % jitter, gain .08; loop, follows the goblin | .12 | new | yes | effects | P4 | the chase's bell |
| `amb.caravan.cart` | chirp + step | wood creak (siren saw [90,0]→[120,.5] ×.2 every 1.5 s) + wheel impacts d .06 bp 400 at 2/s | .10 | new | yes | effects | P5 | the cart is heard on the road before its beam is seen over the trees |
| `amb.shard` | hum | saw 27.5 + sine 55 + sine 3900 at −40 dB, LFO .07 Hz; Act 1 gain .02 (night only), Act 2 .04, Act 3 .07 with a .4 Hz flicker; panned toward the shard's dome position, no distance | — | new | pan only | ambient | loop | story-beats §5: the shard as a night ambient source |
| `amb.crater` | hum | sine 110 + sine 165 + tri 55 lp 400, **LFO period 8 s** (the crater's pulse ring), gain .10 | — | new | yes (r 25 m) | ambient | loop | `ALIEN_CRATER.hum` (AU §17) finally wired; light and sound pulse together |
| `amb.portal` | hum | sine 200 + tri 100 + four sines 585/595/605/615 at −24 dB, LFO .3 Hz, gain .10 | — | new | yes (r 15 m) | ambient | loop | the tear, idle (v27 had none) |
| `amb.aurora` | hum | sine 2400 + 3600 at −48 dB, shimmer .2 Hz, gain × `world.aurora.intensity` | — | new | 2D | ambient | loop | noticed only when it stops |
| `fish.nibble` | blip | sine 330 d .04 ×.25 | .15 | new | yes | effects | P4 | the two fakes |
| `fish.bite` | blip + chirp | blip sine 220 d .08 ×.5; chirp plop sine 900→300 d .06 | .30 | new | yes | effects | P2 | the 0.7 s window opens |
| `fish.catch` | arpeggio + whoosh | tri [523,659,784,1047,1319] step .07 atk .02 dec .25 ×.6; whoosh d .3 bp 2500→1200 amp .4 (the splash) | .35 | new | yes | effects | P1 | the catch card |
| `fish.miss` | sweep | sine 600→300 exp .15 ×.3; + plop | .15 | new | yes | effects | P4 | `It got away.` **[new text]** (world-events §2.7.2) |
| `animal.deer` | chirp | a soft huff: whoosh d .25 bp 600→300 amp .25 | .10 | new | yes | effects | P6 | every 8–20 s per animal (world-events §2.7.1), ≤ 4 animal voices live |
| `animal.fox` | chirp | = `camp.fox.yip` | .10 | new | yes | effects | P6 | night |
| `animal.rabbit` | chirp | none by default; a 2-grain thump (impact d .04 lp 300 ×2 at 90 ms) on a hop start | .06 | new | yes | effects | P6 | the hop is the call |
| `animal.songbird` | chirp | sine contour: 3 grains from [2400–4800] random walk ±20 %, d .06 each at 12 Hz; dawn and day only | .08 | new | yes | effects | P6 | the 3-bird burst on a pass gets 3 calls at once |
| `animal.owl` | chirp | sine 380→320 d .4 ×2, .5 s apart, lp 1200 | .14 | new | yes | effects | P5 | every 15–25 s; the deep-night bed's owl (also the snowy owl at 420→350) |
| `animal.fennec` | chirp | tri 1500→900 exp .08 ×3 at 6 Hz | .08 | new | yes | effects | P6 | night |
| `animal.lizard` | chirp | a dry rustle: whoosh d .12 bp 4000→2500 amp .3 on the dart | .06 | new | yes | effects | P6 | — |
| `animal.beetle` | blip | square 2800 d .015 ×.2 on each pebble push | .04 | new | yes | effects | P6 | a tiny click |
| `animal.vulture` | chirp | tri 1100→700 exp .4, noiseMix .3, every 12–20 s | .08 | new | pan only (sky) | effects | P6 | never lands |
| `animal.tortoise` | chirp | a slow scrape: whoosh d .5 bp 500→300 amp .2 on a step | .05 | new | yes | effects | P6 | — |
| `animal.frog` | chirp | = `frog.croak` at .12 | .12 | new | yes | effects | P6 | the wild kin of the Familiar |
| `animal.heron` | chirp | square 320→220 exp .3 lp 900 on lift-off, + 3 wingbeat whooshes d .2 bp 300→200 at 2 Hz | .10 | new | yes | effects | P6 | — |
| `animal.turtle` | chirp | a plop: sine 700→250 d .08 on sliding in | .08 | new | yes | effects | P6 | — |
| `animal.snail` | hum | sine 660 + 990 at −42 dB, shimmer .15 Hz, r 6 m | — | new | yes | ambient | loop | it glows, so it hums; a landmark you can hear |
| `animal.elk` | chirp | tri 220→180 exp .6 lp 800, noiseMix .2 (a low bugle), every 12–20 s | .12 | new | yes | effects | P6 | — |
| `animal.snowHare` | chirp | = `animal.rabbit` | .06 | new | yes | effects | P6 | — |
| `animal.goat` | chirp | square 500→380 exp .25 ×2 at 4 Hz, lp 1500 | .08 | new | yes | effects | P6 | — |
| `animal.ptarmigan` | chirp | 5 grains square 900→600 d .05 at 10 Hz on the burst into flight | .10 | new | yes | effects | P6 | — |
| `animal.shadowDeer` | pair | = `death.glow` at .15 on dissolve; no idle call | .15 | new | yes | effects | P5 | home, wrong: it has no voice |
| `sheltering` | (rule) | §2.5.5 | — | new | — | ambient | — | not a cue: the rain bed's lowpass and duck while under a roof |

#### 2.2.6 Camp (camp.md §2.6.1, §2.7.1, §2.7.3–2.7.4, §2.9, §5.2)

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `amb.camp.fire` | crackle | brown + white noise pops, density 8/s, hp 900, **gain = base × (0.8 + 0.15·flVal)** from the main tongue's oscillator, × size class S1 .5 / S2 .8 / S3 1.0 / S4 1.2; a pop (`impact` d .04 hp 3000 amp .6 at −8 dB) every 4–9 s | — | new | yes (`bed` class, r 14 m) | ambient | loop | camp §2.7.1; the flame, the light and the sound share one value (§3) |
| `amb.camp.fire.mirror` | crackle | `amb.camp.fire` at half density, playbackRate .7, follower on the mirror fire's half-rate oscillator; pops replaced by reversed sweeps (sine 300→900 exp .1) | — | new | yes | ambient | loop | the cold fire, wrong (camp §2.7.6) |
| `amb.stream` | bed | white noise bp 900 Q .6 + bp 2400 Q1, LFOs .3 Hz and .7 Hz ±3 dB, gain .10; source = nearest point on the stream polyline | — | new | yes (line source, r 12 m) | ambient | loop | the pilot's second layer |
| `camp.hammer` | impact | d .1 p2 amp .8, bp 1100 Q2 (wood on wood) | .25 | new | yes | effects | P3 | six knocks for the board; `camp.knock` = this at .15 for every prop rising |
| `camp.saw` | whoosh | d .25 p1 amp .5, bp 1800→900; 2/s | .18 | new | yes | effects | P4 | the hangar, the cabin |
| `camp.shingle` | impact | d .05 p3 amp .5, bp 2200 Q2; 8/s | .12 | new | yes | effects | P4 | the roof sweep |
| `camp.rope.creak` | siren | saw [90,0]→[130,.4]→[100,.6], lp 600, noiseMix .3, ×.3 | .15 | new | yes | effects | P4 | the washing line, the hoist |
| `camp.gate.latch` | impact + blip | impact d .08 bp 2600 Q3 amp .6 (metal); blip sine 1800 d .02 at .06 | .20 | new | yes | effects | P4 | the NW gate |
| `camp.sign.creak` | siren | = `camp.rope.creak` detune −300, segments ×1.3 slower | .15 | new | yes | effects | P4 | the sign hoist |
| `camp.halyard` | chirp + siren | six blips sine 900 d .03 at 5 Hz; + `camp.rope.creak` | .15 | new | yes | effects | P4 | the crest banner |
| `camp.lantern.light` | pair | sine 660→1320 exp .3 · tri 990 held .3, ring .4, ×.3 | .15 | new | yes | effects | P4 | twelve, 0.6 s apart at C5 → C6; `lantern.light` (the Bog posts) is the same cue |
| `camp.build.done` | arpeggio | tri [523,659,784,1047,1319] step .09 atk .02 dec .25 ×.6 | .35 | new | 2D | effects | P1 | the chime at the end of every build-in; the title card re-shows |
| `camp.canvas.snap` | impact + whoosh | impact d .12 bp 700 Q1.5 amp .7; whoosh d .2 bp 1500→600 amp .3 | .25 | new | yes | effects | P4 | the tarp becomes the roof |
| `camp.seedling` | blip | sine 1400 d .03 ×.3 | .10 | new | yes | effects | P5 | a soft tick per seedling |
| `camp.rest.sweep` | pair | sine 220→440 exp 3.0 · tri 330→660 exp 3.0, lp opening 400→4000 over 3 s, ×.25 | .30 | new | 2D | effects | P1 | the 3 s sky sweep; the beds crossfade underneath (§2.5.4) |
| `camp.sit` | whoosh + blip | whoosh d .5 bp 500→200 amp .3 (cloth settling); blip sine 400 d .04 ×.2 | .15 | new | 2D | effects | P4 | the squad sits; at deep night the constellation cards use `card.constellation` each (§2.2.8) |
| `camp.hen` | chirp | square 700→500 d .06 ×3 at 8 Hz, lp 2500 | .12 | new | yes | effects | P6 | the run; the flap on a running hero |
| `camp.fox.yip` | sweep | tri 1200→700 exp .12 ×2, .15 s apart | .12 | new | yes | effects | P6 | the fox, from trust 3 |
| `camp.slime.blorp` | sweep | = `alert.blob` .12 | .12 | new | yes | effects | P6 | Sugar |
| `camp.windsock` | bed | white noise bp 400 Q1, gain .04 × wind (world-events' gust uniform), r 8 m | — | new | yes | ambient | loop | the plane's wind reference, audible |
| `amb.camp.chimney` | crackle | = `amb.camp.fire` at .3 density, no pops, from the chimney, r 6 m | — | new | yes | ambient | loop | evening and rainy-day smoke (camp §6) |
| `questComplete` | arpeggio | §2.2.1 | .30 | defined | 2D | effects | P2 | the bounty board (camp §5.2, npcs §5.2) |

#### 2.2.7 NPCs, the plane, crates, the frog, dialogue (npcs.md §2.2.7, §2.3.4, §2.4, §2.9.1, §2.11, §5.2)

| Cue | Family | Parameters | vol | v27 | Pos | Bus | Pri | Note |
|---|---|---|---|---|---|---|---|---|
| `plane.engine.hopping` | engine | f 48 Hz, roughness .35, missEvery 2.5 s depth 1.0, lp 500, exhaust .40; one stall-drop per flight | .30 | new | yes (`far` class) | effects | P1 | rough, drops out on every sputter |
| `plane.engine.propeller` | engine | f 55, roughness .25, missEvery 2.5 s depth .8, lp 650, exhaust .30 | .30 | new | yes | effects | P1 | steadier, still misses |
| `plane.engine.rudder` | engine | f 60, roughness .15, missEvery 3.5 s depth .6, lp 800, exhaust .20 | .30 | new | yes | effects | P1 | the miss is rarer |
| `plane.engine.repaired` | engine | f 66, roughness .08, missEvery 2.5 s depth .3 (a cough), lp 1000, exhaust .15 | .30 | new | yes | effects | P1 | the purr, still bumpy |
| `plane.sputter` | engine (event) + impact | the miss gate (gain → depth × .15 for 60 ms, f −8 %); + impact d .04 lp 300 amp .5 (the cough) | .20 | new | yes | effects | P2 | every sputter; the propeller is a static blade for 0.15 s |
| `plane.stall` | engine (event) + boom | gain → 0 over .1 s, **1.2 s silence**, backfire boom d .18 lp 500→100 amp .8, engine back over .3 s | .35 | new | yes | effects | P1 | the `hopping` stall-drop |
| `plane.prop.spinup` | engine (event) | f 12 → state f exp over 1.6 s, gain 0 → 1 over 1.2 s; coughs per state: repaired 0, rudder 1, propeller 2, hopping 3 + backfire (npcs §2.3.4) | .30 | new | yes | effects | P1 | engine start |
| `plane.prop.spindown` | engine (event) + blip | f → 10 Hz over 2.2 s with roughness ×3, gain → 0 at 2.2 s; blip square 240 d .03 at 2.2 (the last click) | .30 | new | yes | effects | P2 | engine stop |
| `plane.taxi.rumble` | bed + step | brown noise lp 200 gain ∝ ground speed; wheel grains impact d .05 bp 500 at 6/s (dirt) or bp 900 Q2 at 9/s (the Causeway's boards) | .20 | new | yes | effects | P3 | on the ground, moving |
| `plane.touchdown` | impact + whoosh | impact d .18 lp 300 amp .9; whoosh d .3 bp 700→300 amp .4 (the skid) | .35 / .25 / .15 | new | yes | effects | P1 | per hop, loudest first |
| `plane.wind.trick` | whoosh | d = trick length (1.0 barrel, 1.8 loop), bp segs [900,0]→[2200, d/2]→[900, d], amp .4 | .20 | new | yes | effects | P3 | the four ribbons |
| `plane.wreck.tick` | blip | square 2400 d .02 ×.3 + hp click | .12 | new | yes (r 10 m) | effects | P6 | cooling metal, every 6–14 s, C0–C1 |
| `plane.crash.impact` | boom + impact + whoosh | `boom` .3 (v27 L6138); impact grains 8 bp 700 over .5 s (debris); whoosh d 3.0 bp 500→200 amp .5 (the 60 m skid) | .30 | site + new | yes | effects | **P0** | CS-01; the corkscrew before it runs the engine at roughness 1.0, missEvery .6 s |
| `plane.wingRock` | whoosh | d 1.2 bp segs [700,0]→[1100,.3]→[700,.6]→[1100,.9]→[700,1.2] amp .25 | .15 | new | yes | effects | P4 | Ed waves back (npcs §2.2.5) |
| `crate.chute.open` | whoosh + impact | whoosh d .35 bp 1500→700 amp .6; `camp.canvas.snap` at −6 dB | .20 | new | yes | effects | P4 | the canopy |
| `crate.land` | sweep + impact | = `equip` .15 (v27 L5992); + impact d .1 bp 600 amp .6 at .02 (the thud) | .15 | site + new | yes | effects | P3 | — |
| `crate.pickup` | sweep | = `equip` .3 (v27 L6001) | .30 | site | 2D | effects | P3 | — |
| `frog.hop` | whoosh | d .12 bp 900→400 amp .3 | .12 | new | yes | effects | P5 | + a plop if the landing cell is water |
| `frog.croak` | chirp | saw 160→120 d .18, AM 22 Hz (the rattle), lp 1200 | .18 | new | yes | effects | P5 | idle, every 6–10 s; 1.5 Hz throat pulse when nervous raises the rate to every 3–4 s |
| `frog.hurt` | sweep | square 900→400 exp .12 ×.4 | .20 | new | yes | effects | P3 | the escort's HP bar is always on; this is its voice |
| `lantern.light` | pair | = `camp.lantern.light` | .15 | new | yes | effects | P4 | a post lit |
| `lantern.gutter` | crackle + pair | crackle density 8 → 20/s over 3 s then 0, follower on the post's oscillator (amplitude doubled for the gutter); pair sine 660→330 exp 3.0 ×.2 | .15 | new | yes | effects | P3 | the last 3 s; the frog's rate rises with it |
| `merchant.chime` | arpeggio | tri [880,1109,1319] step .10 atk .02 dec .30 ×.5 | .25 | new | 2D | effects | P2 | `A mysterious merchant has appeared!` and `[SPACE] Trade` open |
| `dlg.blip.ed` | blip | sine 180 d .03 ×.5; every 6th character (20/s at 120 cps) | .06 | new | 2D | dialogue | P4 | Ed lowest (npcs §5.2) |
| `dlg.blip.liam` / `.noah` / `.collette` / `.isabella` | blip | tri 300 / 380 / 460 / 560, d .03 | .06 | new | 2D | dialogue | P4 | age order rising, same as `hero.swap` |
| `dlg.blip.elm` / `.quartz` / `.neve` / `.fern` / `.sol` | blip | tri 220 / sine 520 / tri 340 / sine 300 / tri 260, d .03 | .06 | new | 2D | dialogue | P4 | Quartz is glass |
| `dlg.blip.witch` / `.nomad` | blip | tri 240 / tri 280, d .03 | .06 | new | 2D | dialogue | P4 | — |
| `dlg.advance` | sweep | sine 700→1050 exp .05 ×.3 | .12 | new | 2D | dialogue | P3 | a line completes or advances |
| `dlg.skip` | sweep | = `ui.cancel` | .12 | new | 2D | dialogue | P3 | hold-to-skip confirmed |

Guides' proximity bubbles, Ed's hangar shouts and `Character-building weather.` are bubbles: they play `dlg.blip.<who>` × 3 like an emote, never the full typewriter (they do not freeze the sim, npcs §2.11).

#### 2.2.8 The `ui.*`, dungeon and `cs.*` families (names reconciled 2026-09-07 with the files that own them)

`ui-ux.md`, `dungeons.md` and `cutscenes.md` were written in the same wave as this file and landed first; each named its own cues. The rule this file set for itself (§5.3 item 8) is applied here: **their names win**, this file's families and parameters stay, and `cues.ts` carries one name per cue. Where a file named a cue this file had not sketched, the family and sketch below are new.

**`ui.*`, `card.*`, `photo.*` (names from `ui-ux.md` §5.2; the `dlg.*` cues are §2.2.7's).** All 2D on the `effects` bus. `ui-ux.md`'s silence rules stand: no sound on the HUD's idle fade, on chip changes, on compass pips.

| Cue | Family | Parameters | vol | v27 | Pri | Note |
|---|---|---|---|---|---|---|
| `ui.page` | whoosh | d .28 p1.5 amp .5, bp 1500→3500 Q .7, hp 800 | .20 | new | P3 | the one page-turn (`ui-ux.md` §2.2.3); every tab change |
| `ui.open` / `ui.close` | whoosh + impact | `ui.page`, the sweep reversed for close (3500→1500); + impact d .02 hp 4000 amp .3 (the cover) | .20 | new | P3 | the book opens and closes |
| `ui.tab` | blip + impact | blip tri 1200 d .025 ×.5; impact d .02 hp 4000 amp .3 (paper) | .15 | new | P3 | a tab, or any button that is neither a confirm nor a cancel (was `ui.click`) |
| `ui.focus` | blip | sine 1600 d .015 ×.2 | .06 | new | P5 | focus moves on pad and keyboard only; never on mouse hover (was `ui.hover`) |
| `ui.confirm` | sweep | = `equip` .3 | .30 | site | P3 | v27's menu confirm (skill bought, quest accepted, room cleared) |
| `ui.cancel` | sweep | tri 900→600 exp .08 ×.3 | .12 | new | P3 | close, cancel, back (was `ui.back`); `dlg.skip` aliases it |
| `ui.error` | blip | square 220 d .06 ×2 at 90 ms ×.35 | .15 | new | P3 | `Not enough gold`, stash full, wrong hero (v27 silent); also the dev build's unknown-cue tell (§2.3) |
| `ui.toast` | sweep | = `achieve` .3 | .30 | site | P3 | achievement toasts (v27's site) |
| `ui.announce.hurt` / `ui.announce.alarm` | blip / siren | hurt: square 180 d .08 ×.35, ×2 at 90 ms; alarm: tri [660,0]→[880,.1]→[660,.2] ×.3 | .15 / .20 | new | P2 | the two optional announce stingers `ui-ux.md` §5.2 asks for; the channel looks the stinger up by the string's colour token, so the cue is named for the token on purpose; every other announce colour is silent and the channel itself makes no sound (each string's own cue carries it) |
| `ui.prompt.show` | blip | sine 1400 d .02 ×.2 | .06 | new | P5 | once per prompt appearance, never per frame |
| `ui.swap` | arpeggio | = `hero.swap.<hero>` | .18 | new | P3 | the portrait strip (was `hit` .15 in v27; §2.2.2) |
| `ui.wheel.open` / `ui.wheel.pick` | whoosh / blip | open: d .15 bp 1500→3000 amp .3; pick: tri 1000 d .03 ×.4 | .12 | new | P3 | the emote wheel; the pick is followed by `hero.emote.<hero>` |
| `ui.radial.open` / `ui.radial.pick` | whoosh / blip | = the wheel pair at −3 dB | .10 | new | P3 | the combo radial |
| `ui.cooldownReady` | sweep | sine 900→1350 exp .06 ×.3 | .10 | new | P4 | once per icon per cooldown |
| `ui.lowHp` | blip | sine 220 d .06 ×.25 on each ring pulse (1 Hz) | .08 | new | P4 | active hero only, under 25 %, ≤ 1 voice |
| `ui.tutorial.step` | sweep | = `achieve` .15 | .15 | site | P3 | (was `ui.tutorialStep`) |
| `ui.save` / `ui.load` | sweep | = `achieve` .2 | .20 | site | P3 | save and load (v27's save site) |
| `ui.export` | sweep | = `equip` .3 | .30 | site | P3 | the export card |
| `ui.crest.grow` | arpeggio | tri [392,523,659,784,1047] step .12 atk .03 dec .35 ×.6 | .30 | new | P1 | the crest levels (`ui-ux.md` §2.10 names no cue; this name stands until it does) |
| `card.title` | pair | sine 440→880 exp 1.2 · tri 660 held 1.2, ×.15 | .15 | new | P2 | the quiet swell on every location, camp and dungeon-entry card (was `ui.titleCard`); `dng.nameCard` aliases it |
| `card.catch` | arpeggio + whoosh | = `fish.catch` | .35 | new | P1 | the catch card |
| `card.constellation` | pair + arpeggio | `card.title` at −6 dB; + the bells' first three motif notes on the night table, step .3 | .15 | new | P2 | each constellation card at deep night (camp §2.7.3) |
| `photo.shutter` | impact + blip | impact d .03 hp 3500 amp .6; blip sine 2400 d .02 | .20 | new | P3 | photo mode (was `ui.photo.shutter`) |
| (the level card) | arpeggio | = `levelup` .4 | .40 | kept | P1 | the card plays v27's cue; there is no separate `ui.levelCard` |

**Dungeons (names from `dungeons.md` §2.1.11 and §5.2).** The v27 dungeon recipes (AU §13) are in §2.2.1 and stay at their v27 volumes: `bars_slam` .3, `door_unlock` .4, `lever_pull` .3, `plate_click` .3 / .2, `puzzle_solve` .4, `rock_slide` .25, `destroy_pot` / `destroy_crate` .25 (via the `sd` field, which stays the only data-driven lookup and now points into this map), `chest_open` .4 / .3, `equip` .4 (key) and .3 (room cleared: no separate cue), `boom` .4 (Liam's cracked wall), `magic` .2 (Collette's seal ticks), `boss` .5 (the entry card), `victory` .5 (the clear). The beds are §2.5.6. Every cue below is positional at its object in the `mid` class unless marked.

| Cue | Family | Sketch | Where |
|---|---|---|---|
| `dng.enter` | bed + whoosh | the island bed fades over 2 s (§2.5.4 item 5) under a low whoosh d 2.0 bp 300→150 amp .3; the `boss` .5 on the card is v27 | the threshold walk, every dungeon |
| `dng.nameCard` | pair | = `card.title` | every entry card; the quiet name cards of rest and set-piece rooms at −6 dB |
| `dng.hearthLight` | crackle + pair | crackle burst .8 s density 20/s; pair sine 440→880 exp .5 · tri 660 held .5 ×.25 (the flame taking); then `amb.camp.fire` at size class S1 from the hearth's oscillator | the mid-dungeon rest room (`dungeons.md` §2.1.6) |
| `dng.checkpoint` | sweep | = `ui.save` | rest rooms and boss antechambers |
| `dng.backDoor` | boom + whoosh | `door_unlock` .4; + whoosh d .6 bp 400→1200 amp .3 (daylight in); the island bed returns over 2 s | the back door |
| `grove.heartbeat` | hum | sine 55 + saw 110, lp 300, two pulses 0.12 s apart on every beat of the `cave` table's 56 BPM, gain .06 | the Hollow Grove's bed (§2.5.6), rising to .10 in the Well |
| `grove.rootRise` / `grove.rootFall` | siren + whoosh | saw [60,0]→[110,1.2] with a creak ×.3; whoosh bp 300→900 amp .4 (rise) and reversed (fall) | root walls |
| `grove.mossWake` | pair | sine 990→1980 exp .4 · tri 1485 held .4 ×.25 | glow moss lighting |
| `grove.saplingSprout` | chirp + whoosh | 3 blips sine 700→1400 d .05 at 8 Hz ×.3; whoosh d .3 bp 800→2000 amp .3 | saplings |
| `grove.boughLift` | siren + whoosh | saw [50,0]→[80,2.0] creak ×.25; whoosh d 2.0 bp 200→600 amp .3 | the Heartwood Well's lift |
| `grove.canopyOpen` | whoosh + chirp | whoosh d 1.5 bp 400→3000 amp .4 (light in); the birds layer ×3 for 4 s | the canopy opening |
| `tomb.sandFlow` / `tomb.sandDrain` | bed | white bp 1200 Q .5 + brown lp 150, gain ∝ flow rate; the drain is the same bed with playbackRate 1 → .6 over 2 s as the level falls; start and stop with a `lever_pull` | sand rooms |
| `tomb.leverGreat` | sweep + impact | `lever_pull` at playbackRate .75 (−5 st); impact d .2 bp 300 amp .8 | the great lever |
| `tomb.drainRumble` | boom | d 2.5 p .5 amp 1, lp 120→60, tail .8 (the `quake.rumble` shape at half gain) | the drain |
| `tomb.mirrorTurn` | siren + impact | saw [140,0]→[180,.3] creak ×.3; impact d .06 bp 2000 at the detent | mirror pedestals |
| `tomb.sunmarkLit` | pair | sine 880→1760 exp .5 · tri 1320 held .6, ring .8 ×.3 | a sunbeam finds its mark |
| `tomb.scarabSwarm` | chirp | 12 grains square 3200→2400 d .02 at 20 Hz ×.2, looped while the swarm lives, ≤ 2 voices | scarab swarms |
| `tomb.sandWind` | bed | `amb.sandstorm` at .5 through lp 1500 (indoors) | the Storm Chamber |
| `tomb.slide` | bed | white bp 1000 Q .5, gain ∝ hero slide speed, r 4 m at the hero | the sand ride |
| `temple.sconceLight` | pair | = `lantern.light` | sconces |
| `temple.lanternSet` | pair + impact | `lantern.light`; + impact d .08 bp 900 amp .5 (the hook) | the Rusted Lantern set down |
| `temple.padSink` | whoosh + chirp | whoosh d .6 bp 400→150 amp .4; 3 bubble plops | lily pads |
| `temple.mistRise` / `temple.mistFall` | bed | `amb.fogDrip` ramped in over 2 s with a hp 300 hiss; reversed on fall | the mist |
| `temple.wispHum` | hum | sine 1320 + 1980 at −40 dB, shimmer .3 Hz, r 5 m, ≤ 3 | the wisps |
| `temple.wraithCondense` | pair | = `enemy.wraith.blinkIn` .2 through lp 1200 | a wraith forming from mist |
| `temple.naveLit` | arpeggio + pair | `camp.build.done`'s five notes on the `swamp` table; `lantern.light` ×N staggered .15 s | the Nave set piece |
| `ice.slide` | bed | white bp 3000 Q .8, gain ∝ hero slide speed, r 4 m at the hero | ice floors |
| `ice.bellPlate` | blip + arpeggio | `plate_click`; + one `ice.crystal` note | bell plates |
| `ice.crystal.<C4\|E4\|G4\|A4\|C5>` | arpeggio | one note each at 261.6 / 329.6 / 392 / 440 / 523.3 Hz, sine + second harmonic at −12 dB, decay 1.6 s (the bell instrument of §2.6.3); `dungeons.md` names the notes, and over the `frozen` mode's E drone the set reads as E minor's ♭6 colour, so the puzzle stays in tune with the room | the crystal-resonance puzzle |
| `ice.crystalWrong` | pair | sine 400→200 exp .3 · tri 600→300 exp .3, lp 1000 ×.3 (a dull note, never a buzzer) | a wrong strike |
| `ice.frostGate` | pair + impact | `boss.fieldOn` at .25; + impact grains 4 hp 4000 | frost gates |
| `ice.lift` | bed + siren | brown lp 150 gain .06 while moving; `camp.rope.creak` every 1.2 s | the lift |
| `ice.rope` | impact + siren | impact d .08 bp 800 amp .5 on grab and on release; `camp.rope.creak` while held | ropes |
| `ice.orreryStart` | boom + siren | boom d .6 lp 400→80 amp .8; saw [40,0]→[80,2.0] ×.3 (gears taking up) | the Orrery starts |
| `ice.orrery` | hum + blip | saw 55 + sine 110, lp 500, trem .5 Hz, gain .08; a tick (square 1200 d .02 ×.3) every .75 s (the bed's gear tick) | the Orrery running (loop) |
| `ice.domeOpen` | whoosh + hum | whoosh d 3.0 bp 300→2500 amp .5; `amb.aurora` ×4 fading in over 3 s (was `dng.aurora.power`) | the dome opens |
| `shard.banner` | growl | = `boss` .25 | the three floor banners (was `dng.floorBanner`) |
| `shard.lockSeal` | pair + impact | sine 300→75 exp .8 · tri 450→112 exp .8, lp 900 ×.4; impact d .2 bp 1500 amp .7 | an ash gate seals |
| `shard.deadSconce` | crackle + blip | a crackle burst .3 s dying to 0; blip sine 220 d .08 ×.3 | a sconce that will not take a flame |
| `shard.ashRise` | bed + whoosh | `amb.ashfall` ×1.5 for 4 s; whoosh d 2.0 bp 200→400 amp .3 | ash rising |

The far light has no sound of its own (`dungeons.md` §5.2: it is too far); its warmth after the ending is `amb.crater`'s (`cs.ending.dawn`, below).

**`cs.*` (names from `cutscenes.md` §2.0 and §2.14).** Cutscene cues are 2D unless the shot table places them; the listener is where the shot's subject is (§2.7.1). The one music API is `music.duck(level, s)`; the numbers are `cutscenes.md` §2.14's: CS-03 keeps AU §18 verbatim (music to 0 over 2.5 s at scene 1, back over 2.0 s at scene 7), **every other cutscene ducks the music to 0.5 over 1.0 s and restores over 1.5 s**, effects are never ducked, ambience continues.

| Cue | Family | Sketch | Where |
|---|---|---|---|
| `cs.crash.wind` | bed + whoosh | the sky-leg wind layer (§2.5.4 item 4) at the shot's level (low .3 → rising → full 1.0) with a cloth flutter (whoosh d .4 bp 1200→2400 amp .2 every .6–1.1 s: the scarf); it sits under the engine at roughness 1.0 | CS-01 shots 1–4 (the eight rotations) |
| `cs.crash.skid` | whoosh | d 3.5 bp 500→200 amp .5 (the skid `plane.crash.impact` describes, at the shot's length) | CS-01 touchdown |
| `cs.crash.gearSnap` | impact + sweep | impact d .12 bp 1400 Q3 amp .8; sweep square 300→120 exp .1 ×.3 | a strut breaking |
| `cs.crash.wingFold` | impact + whoosh | impact d .3 bp 600 Q1.5 amp .8 grains 3; whoosh d .6 bp 1200→400 amp .4 (canvas and spar) | the wing folds |
| `cs.crash.propSplinter` | impact | d .2 hp 2500 amp .7, grains 6 over .4 s | the propeller |
| `cs.crash.nightFalls` | bed | the `amb.forest.dusk` → `.night` crossfade compressed to the shot: crickets rising, the wind dropping (§2.5.4 item 2, run scripted) | CS-01, the fire at dusk |
| `cs.crash.raidDistant` | growl + impact | `enemy.idle.runt` at −7 st and −18 dB from the north; a drum: impact d .15 lp 200 amp .8 every 1.2 s | the goblins on the ridge |
| `cs.crash.cartWheels` | chirp + step | = `amb.caravan.cart` at each of the three carts, panned, fading with distance | the carts leaving |
| `cs.crash.cageChain` | impact + blip | 4 impacts d .04 bp 2600 Q3 amp .5 at 60 ms; blip sine 1800 d .02 | the cage on the cart |
| `cs.crash.dawn` | bed | the `amb.forest.dawn` birds layer ×1.5 in over 3 s; `amb.camp.fire` under it | CS-01's last shot |
| `cs.meteor.roar` | siren + boom | sine [4000,0]→[400,12.0] with noiseMix .5 (the whistle) over brown lp 200 rising; detune from the meteor's radial velocity (§2.7.3's formula, ×3), pan following the meteor across the frame; hard cut to silence for the last 0.35 s (the flash) | CS-03 scenes 2–5 |
| `cs.meteor.rumble` | boom | d 2.0 p1 amp 1, lp 120→30, tail 2.5 s, after `boom` .6 (v27) | CS-03 scene 6 |
| `cs.meteor.settle` | crackle + hum | a crackle burst 2 s (the ember rain); `amb.crater` fading in over 3 s (the crater's first hum) | CS-03, the settle |
| `cs.flight.cloudHush` | (bus) | every layer through lp 600 and −9 dB for the white-out's 0.6 s, the engine included | CS-04, the cloud curtain |
| `cs.flight.wind` | bed | wind .12 at altitude, nothing else under the engine (§2.5.4 item 4) | CS-04, the sky leg |
| `cs.crater.bed` | hum | = `amb.crater` ×1.5 for the scene | CS-06 |
| `cs.crater.pulse` | pair | sine 110→220 exp .8 · tri 165 held .8 ×.25 on each ring; the "distant" call in CS-07 at −12 dB | CS-06 and CS-07 |
| `cs.portal.pushWind` | whoosh | d 3.0 bp 200→800 amp .4 | CS-07, the camera's push |
| `cs.portal.rise` | siren + stinger | sine [100,0]→[800,4.0] noiseMix .3 ×.3 under `portal` .4 (v27, on spawn); `music.stinger.portal` (§2.6.7) | CS-07 |
| `cs.shard.arrive` | pair | `portal` reversed: tri 100→300 exp .8 · sine 600→200 exp .6 ×.5; then the `amb.rift` bed starts | CS-08 |
| `cs.ending.dawn` | bed + hum | `amb.forest.dawn` in over 3 s with the birds ×1.5; `amb.crater` with its partials a fourth up (110 → 146.8, 165 → 220 Hz): the hum gone warm | CS-10 |
| `music.ending` | music | §2.6.4 | CS-10 |

### 2.3 The port: dispatcher, bootstrap, the rule

**The rule, restated (Brief §7.1).** No audio files, ever. Not for music, not for ambience, not for voice. Every sound in this file is an `OscillatorNode`, a cached noise `AudioBuffer` generated at boot, a `BiquadFilterNode`, a `GainNode` and a scheduler. Music is note data (§2.6.3) rendered by recipes. Ambience is filtered noise and granular chirps (§2.5). "Voice" is dialogue blips (§2.2.7); the kids' lines are bubbles and captions, never spoken (heroes.md §2.4.6). The single-file archive therefore contains no media, and the game sounds the same in 2045.

**`snd(name, vol?, opts?)` keeps its v27 semantics.** `name` is a `CueName` (the typed union of every cue in §2.2); `vol` is the v27 linear argument and, when omitted, the map's default (0.25 for every v27 name, exactly v27's `vol = vol || 0.25`); the recipe's internal scale (`×.4`, `×.6`, …) is applied inside the recipe as v27 did, so `snd('boss', .5)` is as loud as it was. `opts` is new and optional: `{ at?: Vec3 | entityId, detune?: cents, delay?: s, loopUntil?: token }`. `snd()` is a thin wrapper that emits a `sfx` event on the sim's event bus (`{ name, vol, at, seq }`); the audio engine subscribes and schedules at `ac.currentTime + 0.02`. That routing is what makes replication (§2.9) and replays free. Every one of the 151 v27 call sites (AU §23) ports with its name and volume unchanged; the two that change are logged (§6): the portrait strip's `hit` .15 → `hero.swap.<hero>`, and L2402's `heal` .2 → `hero.swap.<hero>` .2.

**Unknown names.** v27 silently did nothing. Now: in dev builds an unknown name logs one `console.warn` per name and plays `ui.error` at −20 dB so silence is never mistaken for intent; in release builds it is silent. `tsc` catches the rest because `CueName` is a union.

**Bootstrap.** One `AudioContext({ latencyHint: 'interactive' })` created on the first `pointerdown`, `keydown` or `touchstart` on the document (the title screen counts), then `ac.resume()` on every subsequent gesture while `ac.state !== 'running'` and on `visibilitychange → visible`; on `hidden`, the master fades −60 dB over 0.5 s and the context suspends (battery, and no music leaking under another tab). The six v27 call sites of `initAudio()` collapse into that one document listener. The bus graph (§2.8) and the three noise buffers (white 2 s, pink 4 s, brown 4 s, each looped from a random offset per use so no two layers phase) are built once at context creation. Nothing else is allocated per call except the one-shot's own nodes, which disconnect on `ended`.

**Recipes as data.** Each family is one small module exporting `build(ctx, bus, when, vol, params)`; each cue is one row of `src/content/audio/cues.ts`: `{ name, family, params, vol, pos: '2d' | 'near' | 'mid' | 'far' | 'bed', bus, pri, replicate }`. The v27 recipes are transcribed value for value (§2.2.1 is the transcription). A cue with `+` in the map is two rows sharing a name with `offset` fields; an alias is a row whose `params` is `{ alias, vol }`.

### 2.4 The seventeen base recipes

Written in the AUDIO_INVENTORY style: what the graph is, then the parameters a member sets. `t` is the scheduled start; `g` is the per-voice gain that connects to the bus through the spatial stage (§2.7).

#### 2.4.1 `impact`

```
src = BufferSource(noise.white, offset rnd)  →  [Biquad filter?]  →  g
envelope baked into the buffer read: a[i] = noise[i] · (1 − i/n)^p · amp   (v27's loop, precomputed per (d, p, amp) and cached)
g: setValueAtTime(vol·scale, t); linearRampToValueAtTime(0, t + d); stop t + d + .01
grains n: n extra copies at t + k·0.035 at −6 dB each
```
Parameters: `d` (0.02–0.25), `p` (1.5–3), `amp`, `filter {type, f, Q}` or none, `scale`, `grains`. v27 members: `hit` (0.07, 3, 1, none), `bars_slam` (0.2, 1.5, 0.6, none, ×.5), `destroy_pot` (0.1, 3, 0.5, hp 2000), `destroy_crate` (0.15, 2, 0.45, bp 1200).

#### 2.4.2 `whoosh`

```
src = BufferSource(noise.white)  →  Biquad(bandpass, Q)  →  g
f.frequency: setValueAtTime(f0, t); linearRampToValueAtTime(f1, t + d)     (or a segment list)
buffer envelope (1 − i/n)^p · amp;  g → 0 at t + d
```
Parameters: `d`, `p`, `amp`, `bp {f0, f1 | segs, Q}`, `scale`, `chain`. v27 members: `sword` (0.13, 2, 0.7, 2200→600 Q1.2), `rock_slide` (0.3, 1.5, 0.4, 300 fixed Q1).

#### 2.4.3 `boom`

```
src = BufferSource(noise.white)  →  Biquad(lowpass)  →  g
lp.frequency: f0 → f1 linear over d;  buffer envelope p;  g → 0 at t + d
tail?: BufferSource(noise.brown) → Biquad(lowpass fTail) → gTail: vol·tailScale → 0 over dTail (exponential to 0.001)
tone?: Oscillator(wave) f0 → f1 exp over dTone → gTone: vol·.3 → 0
```
Parameters: `d`, `p`, `amp`, `lp {f0, f1}`, `scale`, `tail {d, f, scale}`, `tone {wave, f0, f1, d}`. v27 members: `boom` (0.35, 1.5, 1, 500→80), `door_unlock` (0.4, 2, 0.5, 500→80, ×.6).

#### 2.4.4 `sweep`

```
o = Oscillator(wave); o.frequency: setValueAtTime(f0, t); (exponential|linear)RampToValueAtTime(f1, t + dSweep)
[Biquad filter?]  →  g: setValueAtTime(vol·scale, t); linearRampToValueAtTime(0, t + dGain); o.stop(t + dGain + .02)
noiseMix?: a whoosh member at gain noiseMix under the same g
```
Parameters: `wave`, `f0`, `f1`, `curve`, `dSweep`, `dGain`, `scale`, `filter`, `noiseMix`. v27 members: `arrow`, `pickup`, `equip`, `chest_open`, `achieve`, `ult`, `shadow_bolt`, `lever_pull` with the values in §2.2.1.

#### 2.4.5 `siren`

```
o = Oscillator(wave); for each [f, tk] in segs: o.frequency.(exp|lin)RampToValueAtTime(f, t + tk)   (first segment is setValueAtTime)
g: vol·scale at t → 0 at t + dGain
```
Parameters: `wave`, `segs`, `curve`, `dGain`, `scale`, `filter`, `noiseMix`. v27 members: `whirl` (saw, lin), `kidnap` (saw, lin), `event_start` (tri, exp).

#### 2.4.6 `growl`

```
o = Oscillator('sawtooth'); f0 → f1 linear over dSweep;  [Biquad lowpass 400?]  →  g: vol·scale → 0 at dGain; stop dGain + .1
noiseMix?: a crackle burst (§2.4.12) under g for dSweep
```
Parameters: `f0`, `f1`, `dSweep`, `dGain`, `scale`, `noiseMix`. v27 members: `boss` (55→35, 1.0, 1.2, ×.5), `miniboss` (80→50, 0.8, 1.0, ×.5). New members are the same shape with different numbers; the family stays reserved for things with a name card, a wake beat or a phase banner so a growl always means "look up".

#### 2.4.7 `pair`

```
a = Oscillator(a.wave) fa0 → fa1 exp over a.d;  b = Oscillator(b.wave) fb0 → fb1 exp over b.d;  both → g
g: setValueAtTime(vol·scale, t); linearRampToValueAtTime(0, t + dGain)
ring?: a third oscillator at (fa1 + fb1)/2 held for ring s at −12 dB
trem?: a 1-oscillator LFO on g at trem Hz, depth .5
delayCopy?: the whole pair again at +offset s, detune cents, gain ×.5
```
Parameters: `a {wave, f0, f1, d}`, `b {…}`, `dGain`, `scale`, `ring`, `trem`, `delayCopy`, `filter`, `noiseMix`. v27 members: `magic` (sine 600→1200 .2 / tri 900→400 .2, →0 .25), `portal` (sine 200→600 .6 / tri 300→100 .8, ×.5, →0 .8).

#### 2.4.8 `arpeggio`

```
for (f, i) in notes: o = Oscillator(wave, f); g2 = Gain → g
  g2: 0 at t + i·step; → vol·noteScale at + attack; → 0 at + decay;  o.start(t + i·step); o.stop(+ decay + .05)
```
Parameters: `wave`, `notes[]` (Hz), `step`, `attack`, `decay`, `noteScale`. v27 members: `levelup`, `victory`, `victory_ext`, `revive`, `puzzle_solve` (§2.2.1). New members only choose notes from the current island's scale or its octave (§2.6.2), so a chime in the Desert is in the Desert's mode and the game stays in tune with itself; the v27 members keep their fixed C-major notes because a kid knows them.

#### 2.4.9 `blip`

```
o = Oscillator(wave, f) → g: vol·scale at t → 0 at t + d;  click?: impact d .01 hp 4000 at −12 dB
```
Parameters: `wave`, `f`, `d` (0.015–0.08), `scale`, `click`. v27 member: `plate_click` (sine 300, 0.05, ×.4). Dialogue blips are this at the speaker's pitch on the `dialogue` bus, fired by the typewriter every 6th character.

#### 2.4.10 `step`

```
an impact per footfall event from the animation (contact poses of walk 1.0 s / run 0.6 s, heroes §2.4.1)
surface → filter: grass bp 500 Q1 amp .35 · dirt bp 400 amp .45 · stone hp 1200 amp .5 · planks bp 900 Q2 amp .55 · sand lp 600 amp .3 · snow lp 400 amp .25 (with a 20 ms crunch grain hp 3000) · shallow water: + a plop chirp · ash lp 500 amp .3 · ice: bp 2500 amp .3
```
Rules: active hero only at full gain; companions at 50 % and only within 3 m of the listener; per-hero rate cap 1 per 120 ms; never inside dialogue, cutscenes (cutscenes fire their own), or the combo beat; gain scales with speed (walk .6, run 1.0). Nine surface members; `vol` .05–.10.

#### 2.4.11 `engine`

```
oA = Oscillator('sawtooth', f)   oB = Oscillator('square', f/2 at −6 dB)   → Biquad(lowpass, lp) → gEngine
exhaust = BufferSource(noise.brown, loop) → Biquad(bandpass 180 Q .7) → gExhaust (exhaust)
roughness: an LFO Oscillator('sawtooth', 2 Hz) with a 0.37 Hz sine on its frequency → ScaleGain(depth · f · 0.06) → oA.frequency, oB.frequency   (AR §19.3: the 2 Hz wobble)
rpm: f · (0.9 + 0.1 · v/vMax) · (1 + 0.06 · climbing)
miss: every missEvery s (± 10 %): gEngine → depth·0.15 over 15 ms, hold 60 ms, back over 120 ms; f −8 % for the hold; a `plane.sputter` impact
doppler: detune(cents) = clamp(−vRadial / 343 · 3, −0.15, 0.15) · 1200 on oA, oB (§2.7.3)
spinup / spindown / stall: envelopes on f and gEngine (§2.2.7)
```
Parameters per state: `f`, `roughness`, `missEvery`, `depth`, `lp`, `exhaust`. Four incommensurate sources, the AR §19.3 method: the rpm wobble at 2 Hz, the 0.37 Hz drift on it, the 2.5 s (or 3.5 s) miss, and the doppler from the flight path. The plane is never doing nothing, and it says so in sound.

#### 2.4.12 `crackle`

```
scheduler at 25 ms: while density · 0.025 > rnd(): fire a grain = BufferSource(noise.white, offset rnd, d rnd(.004, .018)) → Biquad(highpass hp) → gGrain (rnd(.3, 1)) → gFollower
gFollower.gain = base · (0.8 + 0.15 · flVal)  set every frame from the flame oscillator the render already evaluates (world-events §2.8.3, camp §2.7.1)
bed under the grains: BufferSource(noise.brown, loop) → lowpass 300 → gFollower at −18 dB   (the fire's body)
pop: every popEvery s (range): impact d .04 hp 3000 at −8 dB
burst mode: density ramps to 0 over d (one-shot use)
```
Parameters: `density`, `hp`, `base`, `follower` (which oscillator id, or none), `popEvery`, `burst d`. Members: `amb.camp.fire`, its mirror, `amb.camp.chimney`, torches (§2.7.5: the nearest two per room), the horde brazier, the cage lantern, the Bog posts, the lantern gutter, the Sprite and fuse loops, the Titan's magma lights (bosses §5.2: they share the torch oscillator's crackle), `amb.ashfall`'s faint crackle.

#### 2.4.13 `hum`

```
n oscillators at fixed frequencies (2–6) → [Biquad lowpass] → gHum;  LFO Oscillator(sine, lfoHz) → gLfo(depth) → gHum.gain
start: gHum 0 → gain over attack (1–3 s); stop: → 0 over release (1–2 s); loopUntil token
```
Parameters: `partials[] {wave, f, dB}`, `lp`, `lfoHz`, `depth`, `gain`, `attack`, `release`. Members: the shard, the crater, the portal, the aurora, the snail, `amb.bloodMoon`, `amb.rift`'s tonal core, `boss.tetherLoop`, `boss.beamLoop`, `boss.channelLoop`, `ice.orrery`, `ice.domeOpen`'s aurora swell.

#### 2.4.14 `bed`

```
layer = BufferSource(noise.<kind>, loop, offset rnd) → Biquad A → [Biquad B] → gLayer
LFO1 (0.05–0.3 Hz sine) on A.frequency (±spread) and gLayer (±dB); LFO2 (0.5–3 Hz) optional on B for water
gust: a random-walk value updated every 0.5 s (world-events' gust uniform where one exists) → gLayer for wind layers
```
Parameters: `kind` (white | pink | brown), `A {type, f, Q}`, `B {…}`, `lfo1 {hz, spread, dB}`, `lfo2`, `gain`, `gust`. A bed is a named *set* of layers with gains (§2.5.2); the engine keeps a pool of eight layer slots and crossfades sets by ramping slot gains, never by rebuilding nodes.

#### 2.4.15 `chirp`

```
scheduler: next = t + interval · rnd(.6, 1.4); grain = Oscillator(wave) f0 → f1 (exp|lin) over d, → gGrain: attack 5 ms, decay d;  optional AM Oscillator (amHz) on gGrain
trains: n grains at rate Hz (crickets: n 8–14 at 14 Hz; birds: n 3 at 12 Hz random walk)
```
Parameters: `wave`, `f0`, `f1`, `d`, `interval`, `train {n, hz}`, `am`, `contour` (walk ±%). Members: the crickets and frogs and birds of the beds, the nineteen animal calls, `treasure.jingle`, `amb.fogDrip`'s drips, `camp.hen`, the plops.

#### 2.4.16 `stinger`

```
chord: 2–4 oscillators (wave) at scale-degree frequencies from the current music mode → Biquad lowpass (opening or closing over d) → gChord: attack a, hold, release r
optionally a `boom` or `pair` member layered; routed to the music bus; ducks the music layers by duckDb over 0.3 s for its length
```
Parameters: `degrees[]`, `octave`, `wave`, `d`, `attack`, `release`, `lp {f0, f1}`, `duckDb`, `layer`. Members: §2.6.7.

#### 2.4.17 `music`

The engine of §2.6; its "members" are modes, not one-shots. The drone and the fourth are v27's oscillators (`startBGM9`) transcribed; the melody is `tickMelody9` transcribed with its onsets snapped to a grid.

### 2.5 Ambient beds (new; AU §21 was "none")

#### 2.5.1 The layer vocabulary

Every bed is built from these layer types (family `bed` or `chirp`), each with its cost.

| Layer | Recipe | Cost |
|---|---|---|
| `wind` | pink noise → lowpass 300–900 Hz (LFO1 0.08 Hz ±200 Hz) → gain (gust ±6 dB) | 1 src, 1 filter, 1 LFO |
| `foliage` | white noise → bandpass 1.5–3 kHz Q .6, gain gated by the wind gust (leaves move when the wind does) | 1 src, 1 filter |
| `water` | white noise → bandpass 900 Q .6 + bandpass 2400 Q1 in parallel, LFO2 0.3 Hz and 0.7 Hz ±3 dB | 1 src, 2 filters, 2 LFOs |
| `crickets` | chirp trains: sine 4200→4600, 10 grains at 14 Hz, d .02, interval 0.9–1.6 s, three voices detuned ±3 % | 3 chirp voices |
| `frogs` | chirp: saw 150→110 d .15 AM 22 Hz, interval 3–8 s, two voices | 2 chirp voices |
| `birds` | chirp: sine random walk 2400–4800, 3-grain trains at 12 Hz, interval 4–10 s, two voices | 2 chirp voices |
| `owl` | `animal.owl` from the authored tree | 1 |
| `drip` | chirp: sine 1800→900 d .05, interval 2–6 s; a plop variant sine 700→250 for water | 1 |
| `sandHiss` | white noise → bandpass 4000 Q .5, gust-gated, plus brown → lowpass 120 (the howl) | 2 src, 2 filters |
| `hush` | pink noise → lowpass 250, very slow LFO 0.05 Hz, no gust | 1 src, 1 filter |
| `embers` | crackle at density 3/s, hp 2500, no follower | 1 crackle voice |
| `rift` | hum: saw 27.5 + sine 55 + sine 3900 at −40 dB, LFO 0.07 Hz; plus a white → highpass 6 kHz "static" at −36 dB, gust-gated | 3 osc, 1 src |
| `iceShimmer` | sine 2400 + 3600 at −44 dB, LFO 0.2 Hz (a thin high sheen) | 2 osc |
| `bogMurk` | sine 55 + saw 82 → lowpass 150, LFO 0.1 Hz (a low murky pressure) | 2 osc |
| `heat` | white noise → bandpass 6 kHz Q .4 at −38 dB, LFO 0.15 Hz (the shimmer you hear at noon) | 1 src, 1 filter |

#### 2.5.2 Island × phase (the 20 base beds)

Gains are linear on the `ambient` bus (0–1). Phases follow world-events §2.1.1: dawn `p` 0.00–0.10, day 0.10–0.60, dusk 0.60–0.70, night 0.70–1.00; deep night (`p ≥ 0.85`) is night with the owl and the shard. Each cell lists layers at gain.

| Island | dawn | day | dusk | night |
|---|---|---|---|---|
| **Forest** | wind .05, foliage .04, birds .10 (three voices at dawn), water proximity | wind .06, foliage .06, birds .06, heat 0 | wind .05, foliage .04, crickets .04 (rising through dusk), birds .02 | wind .04, foliage .03, crickets .10, owl (deep night), frogs .03 near the pond |
| **Desert** | wind .07, sandHiss .02, birds .02 (one voice, a lark) | wind .05, sandHiss .04, heat .03 | wind .08, sandHiss .03 | wind .06, sandHiss .02, crickets .05 (a drier, slower train at 10 Hz), fennec |
| **Bog** | wind .03, water .06, frogs .08, birds .03, drip .03 | wind .03, water .06, frogs .04, birds .04, drip .02 | wind .03, water .06, frogs .10, bogMurk .03 | wind .02, water .05, frogs .12, crickets .04, bogMurk .05, drip .04 |
| **Frozen** | wind .09, hush .04, iceShimmer .02 | wind .08, hush .03, birds .02 (a ptarmigan cluck) | wind .10, hush .04, iceShimmer .03 | wind .07, hush .05, iceShimmer .04, snowy owl (deep night), aurora when up |
| **Shadow** | (the sky is locked to `shadow.wrongDusk`; the bed is one set) rift .08, wind .03 reversed-gust (gusts *fall*), embers .04, a `bogMurk` at −6 dB, the far fire: `amb.camp.fire` at −30 dB from the direction of the real camp | same | same | same |

Rules: the Forest's dawn chorus is the loudest bed in the game (.10) because the reference is a meadow at first light and v27's title tagline is a world with stories to tell; the Desert by day is the *quietest* (heat and a thin wind: emptiness is the Desert's beauty shot); the Bog is the wettest and never silent; Frozen is wind first; the Shadow Realm has no animals, no birds, and a fire you cannot reach. Every bed carries at least three layers, and with the weather layer, the water or fire proximity layer and the music drone the AR §19.2 count of five is met at every clear-weather frame.

#### 2.5.3 Weather layers (world-events §2.2.3's sound-hook column)

| Weather | Layers (added on top of the island bed) | Island bed change |
|---|---|---|
| `amb.rain` | white → bandpass 3 kHz Q .5 at .07 + lowpass 5 kHz; drop grains (chirp hp click 40/s at −20 dB); `amb.rainLeaves` on Forest: foliage ×2 with a 2 kHz emphasis; `amb.rainWater` within 8 m of water: water layer +4 dB with a 6 kHz splash band | crickets and birds → 0 over 6 s |
| `amb.storm` | `amb.rain` ×1.6; wind ×2.2 with 3–5 s gusts (world-events' gust uniform); foliage ×2 | bed −3 dB; birds 0 |
| `amb.snowHush` | hush .05, wind ×.8 | bed −6 dB (world-events) |
| `amb.blizzard` | wind ×3 → bandpass 600 with a 1.5 Hz flutter, sandHiss-style hiss at 2.5 kHz .05 | bed −12 dB (world-events); the beds' chirps 0 |
| `amb.sandstorm` | sandHiss .10, wind .12 with gusts ±9 dB, brown lowpass 100 howl .06 | bed −9 dB; birds 0 |
| `amb.fogHush` (Forest) | hush .04, wind ×.5, foliage 0 | bed −4 dB |
| `amb.fogDrip` (Bog) | drip ×3 (interval 0.8–2.5 s), hush .03, water +2 dB | bed −2 dB |
| `amb.ashfall` | embers ×1.5, a faint crackle hp 2500 at density 4/s .03 | rift −3 dB |
| `amb.rift` | rift ×2 with the static gust-gated at −24 dB; the LFO at 0.4 Hz (the lobes' pulse) | embers ×2 |

Weather layers cross-fade on the weather system's own 6 s fade (world-events §2.2.2); the 3 s the task names is the campfire rest sweep (§2.5.4) and the event beds' in-fade (blood moon 3 s in, 5 s out; the spring 1.5 s in with its basin).

#### 2.5.4 Layering rules and crossfades

1. **Stack order:** island bed (2D) + weather layer (2D) + water proximity (`amb.stream` and the `water` layer, positional to the nearest water point, gain by distance within 12 m) + fire proximity (`amb.camp.fire`, torches, braziers, positional within 14 m) + object hums (shard, crater, portal) + the music drone. Never fewer than five sources at a clear-weather frame; never more than eight bed layer slots.
2. **Phase crossfade:** 20 s centred on each keyframe boundary (dawn→day at `p` 0.10, day→dusk 0.60, dusk→night 0.70 with world-events' 4 s fast ease applied to the crickets so they arrive with the dark, night→dawn 0.00).
3. **Rest sweep:** the bed jumps phase under `camp.rest.sweep` over the same 3 s, crickets in or out with the sky.
4. **Island travel (CS-04):** the departing bed fades over the 3 s takeoff roll; the sky leg has wind at 20 m altitude only (wind .12, nothing else, the engine on top); the destination bed fades in over the 1.2 s descent and the circuit.
5. **Dungeons:** the island bed fades to 0 over 2 s at the entry card; the dungeon bed (§2.5.6) fades in; open-sky rooms (world-events §2.8) blend the island bed at `1 − dark`.
6. **Interiors and shelter:** see §2.5.5.
7. **Events:** `amb.bloodMoon` ducks the island bed −8 dB for its 40 s; `amb.spring` is positional and adds; the Lost Lantern adds nothing (the lantern's crackle is the cue); Migration adds herd steps (`step.dirt` at 50 % from the herd's centre, r 20 m) and elk calls.

#### 2.5.5 The sheltering duck

While the active hero stands under the tent, the cabin porch, the hangar or the Nomad's awning (world-events §2.7.3's shelter volumes) in `rain` or `storm`: the rain layer goes through a lowpass at 800 Hz and −6 dB over 1.0 s (rain on a roof, not on you), the wind −3 dB, `thunder` unchanged (it is outside and it is loud), the fire crackle +2 dB if a fire is within 6 m (you are nearer to it than the rain), and the drip layer switches to a roof-edge drip (interval 0.4–0.9 s, hp click). The 5 s caption (`Grandpa Ed says this kind of rain is 'character-building weather.'`, canon tip 2) or Ed's own bubble plays on top. Leaving reverses it over 1.0 s.

#### 2.5.6 Dungeon beds (keys from `dungeons.md` §2.1.7 and §5.2; the layer sets are this file's)

| Bed | Layers | Note |
|---|---|---|
| `amb.dng.grove` | wind .03 through a lowpass 400 (through wood), foliage .02, `drip` .02, root creaks (siren saw [50,0]→[70,2.0] at −24 dB every 6–12 s, positional at the nearest root wall), `grove.heartbeat` .06 (the slow heartbeat under the beat) | the Hollow Grove: the walls breathe |
| `amb.dng.tomb` | hush .05 with a 1.2 s convolution-free "size" (a 90 ms feedback delay on the bed at −18 dB, the cheapest room), sandHiss .02, `tomb.sandFlow` when running | the Buried Tomb: dry and large |
| `amb.dng.temple` | water .06, drip .05, frogs .02 (far), bogMurk .05, the frog's croak when escorted | the Sunken Temple: wet and close |
| `amb.dng.citadel` | wind .04 through a highpass 800 (through cracks), iceShimmer .05, hush .04, `ice.orrery`'s tick once it runs, `ice.slide` at the hero, the aurora hum when `world.aurora.intensity` > 0.5 | the Ice Citadel: brittle |
| `amb.dng.shard.f1` / `.f2` / `.f3` | the Shadow bed (§2.5.2) with the rift layer at .06 / .08 / .10, escalating exactly as the DNG_ATMO counts did (AR §8.1); per region: Outer Ward root creaks reversed (pitch up), Inner Sanctum the mirror stream running *uphill* (the water layer with its LFOs run backwards: rising, not falling, pitch bends), Throne of Shadows the far real fire | Home, Wrong's three floors |
| `amb.dng.hearth` | `amb.dng.shard.f3` plus the mirror fire (`amb.camp.fire.mirror`, §2.2.6) and the far real fire from the window's direction | the hearth interior (`dungeons.md` §2.6.6) |
| `amb.dng.crystalDepths` | drip .04, iceShimmer .03 pitched −5 st (crystal, not ice), a hum sine 165 + 247.5 at −40 dB that brightens within 4 m of a crystal (the proximity-brightening emissives, bosses §2.11); the `cave` music table | the Crystal Depths lair (`bosses.md` §2.11 owns the lair; this key stands until it names one) |
| `amb.dng.volcanicRift` | brown lowpass 80 magma .08 with a 0.2 Hz LFO, embers .06, crackle from the four braziers, a hiss band 3 kHz .03; the `volcanic` music table | the Volcanic Rift lair (`bosses.md` §2.12): the lake is the bed |

#### 2.5.7 Budget

At any moment: ≤ 8 bed layer slots (island + weather + dungeon share the pool), ≤ 4 proximity loops (fire, water, shard/crater/portal, engine), ≤ 6 chirp voices, ≤ 3 hums. That is at most about 20 noise or oscillator sources and 30 filter nodes for the whole ambience, all on the audio thread; the main thread does one gain write per layer per frame. Mobile halves the chirp voices and drops `foliage` and `heat`.

### 2.6 Music

#### 2.6.1 What ports verbatim

The three tables (AU §20.1) port as content data, every number unchanged, with two additions and one renamed field:

| Key | Scale (Hz) | Wave | BPM | Source |
|---|---|---|---|---|
| `forest` | 261.6, 293.7, 329.6, 392, 440 | sine | 72 | v27 |
| `cave` | 220, 246.9, 261.6, 329.6, 392 | triangle | 56 | v27; used by the Crystal Caves and the Depths lair |
| `desert` | 293.7, 311.1, 370, 392, 440 | sine | 68 | v27 |
| `swamp` | 233.1, 261.6, 311.1, 349.2, 392 | triangle | 48 | v27 |
| `frozen` | 329.6, 370, 392, 440, 493.9 | sine | 60 | v27 |
| `volcanic` | 196, 233.1, 261.6, 311.1, 370 | triangle | 88 | v27; the Rift lair |
| `shadow` **[new]** | 261.6, 311.1, 349.2, 392, 466.2 (C4 E♭4 F4 G4 B♭4: the Forest's root, the Forest's tune, in minor) | triangle | 60 | new; Home, Wrong is the Forest, wrong |

The drone at `root/2` (gain 0.15, 2 s fade-in), the layer v27 called the fifth at `root × 0.75` (gain 0.08; renamed `fourth` in code, the interval unchanged, AU §25.9), and the drift melody (`tickMelody9`: uniform pick from the five notes, coin-flip octave, sine, instant attack, exponential decay to 0.001 over 1.2 s, gain 0.1 or 0.06 in the desert) all port exactly. The music master default stays `bgm.vol` 0.15 (now the `music` bus with the `Music` slider at its 60 % default ≈ 0.15, §2.8.2). The 2 s fade-out / 500 ms restart transition (AU §20.5) becomes a true crossfade: new layers ramp in over 2 s while old ramp out over 2 s, starting together.

#### 2.6.2 What changes: a grid, layers, modes

**A scheduler.** The per-frame `dt` countdown becomes a lookahead scheduler (25 ms tick, 100 ms horizon) on `ac.currentTime` with a bar grid: 4/4 at the mode's BPM. The drift melody keeps v27's spacing distribution (`rnd(0.5, 3)` beats after each note) but each onset snaps to the nearest eighth note, and note choice gains a contour: 70 % step ±1 scale degree, 20 % leap ±2, 10 % repeat, octave flip still a coin toss (75 % low at night). It is still v27's wandering tune; it just walks instead of jumping.

**Layers** (each an instrument recipe, all oscillators):

| Layer | Recipe | v27 | Gain | Lives in |
|---|---|---|---|---|
| `drone` | mode wave at `root/2` | v27 | .15 | every mode |
| `fourth` | sine at `root × 0.75` | v27 | .08 | every mode |
| `drift` | sine melody, decay 1.2 s, contour as above | v27 + contour | .10 (.06 desert) | islands, camp, dungeons (density ×0.5), boss P2+ |
| `pulse` | triangle pluck at `root/2` (day) or `root/4` (night), 0.25 s decay, lowpass 600, on beats 1 and 3 | new | .07 | camp, islands by day, travel |
| `heartbeat` | the pulse as two hits 0.12 s apart on every beat, sawtooth at `root/4` through lowpass 200 | new | .09 | boss modes |
| `pad` | two triangles at `root` and `root × 1.5` (a real fifth), detune ±6 cents, attack 4 s, release 6 s, lowpass 900 with LFO 0.05 Hz ±300 Hz | new | .05 | night, dungeons, boss, title, finale, ending, travel |
| `bells` | the motif (§2.6.3) on sine + second harmonic at −12 dB, decay 1.6 s | new | .09 | camp (every 4th bar), title, ending, travel sky leg, boss P3 inverted |
| `shadow` | the `drift` melody again 0.25 s later at −12 st on triangle, gain ×0.6 | new | .06 | shadow, finale |

Every gain above is under the `music` bus; v27's effective drone loudness (0.15 × 0.15) is unchanged.

#### 2.6.3 A theme is note data

`src/content/audio/themes.ts` exports themes as **scale degrees and beats**, never pitches, so one theme sounds like itself on every island and in every mode:

```
// The Squad (the camp motif). Degrees index the mode's 5-note scale; +5 = next octave. [degree, beats]
squad: [[0,1],[2,1],[3,1],[4,1], [3,1],[2,1],[1,1],[0,1], [1,1],[2,1],[3,1],[2,1], [1,2],[0,2]]
```

In the Forest that is C5 E5 G5 A5 | G5 E5 D5 C5 | D5 E5 G5 E5 | D5 – C5 –: sixteen beats, hummable, ending home. In the Desert the same degrees land on the Hijaz set and it sounds like somewhere else with the same shape; in the Shadow mode it is the Forest tune in minor with its own shadow a quarter second behind. **Inverted** (boss P3): degree `d → 4 − d`. The instrument is a recipe (`bells`, `pluck`, `pad`) and the renderer is the scheduler; there is no other authoring format and no file.

#### 2.6.4 Modes

| Mode | Table | BPM | Layers | When |
|---|---|---|---|---|
| `music.<island>.day` | island | table | drone, fourth, drift, pulse | on the island, `p` 0.10–0.70 |
| `music.<island>.night` | island | table × 0.85 | drone ×.7, fourth, drift (75 % low octave), pad | `p` ≥ 0.70 and dawn |
| `music.camp` | forest | 72 | drone, fourth, drift, pulse, bells every 4th bar; at night pad replaces pulse | within `camp.radius` 35 m of the fire on the Forest island |
| `music.title` | forest | 72 | drone, fourth, pad, bells every 2nd bar (no drift: the motif is the point) | the title screen over the C6 camp (camp §2.12) |
| `music.dungeon.<key>` | the dungeon's island table (cave for the Caves and the Depths, volcanic for the Rift, shadow for Home, Wrong) | table × 0.8 | drone (triangle), fourth, drift at half density, pad; the dungeon bed carries the rest | inside a dungeon or lair, not in a boss room |
| `music.boss` | island table, root = last scale note / 2 (the relative-minor trick: forest A3 220, desert A3 220, swamp G3 196, frozen B3 246.9, cave G3 196, volcanic F#3 185, shadow B♭3 233.1) | table × 1.25 | P1 drone, fourth, heartbeat, pad · P2 + drift ×1.5 density · P3 + bells inverted at ×2 density · enrage: heartbeat ×1.5 and a 0.5 Hz ±30 cent wobble on the drone | from the intro's 4.10 s to the death beat |
| `music.finale` | shadow | 88 (volcanic's tempo, the fastest v27 ever went) | boss layers plus `shadow` at −24 st; P3 (kidnap): drift and bells out, heartbeat and the rift hum only; P4 everything | the Shadow Queen |
| `music.travel` | destination island | 60 | takeoff: pad only over 2 s; sky leg: bells motif on the *destination's* scale over the pad; descent: the destination's drift begins; touchdown: `card.title` | CS-04 |
| `music.ending` | forest | 60 | camp mode with bells twice through and the pad held; then `music.title` | CS-10 |
| `music.gameOver` | (stinger) | — | §2.6.7 | party wipe outside the King's arena |

Transitions are 2 s crossfades except: island → camp and back (4 s, the pulse and bells fading in as the fire comes into view), boss start (the intro has already silenced the music; boss mode enters at 4.10 s over 1 s), boss death (§2.6.6).

#### 2.6.5 Where music starts and what changes it (AU §20.8, extended)

| Trigger | Now |
|---|---|
| Title screen | `music.title` after 0.5 s |
| `startGame()` | CS-01 owns its sky and its music: none, then the engine; `music.camp` fades in at dawn when control returns (v27's 1 s `setTimeout` becomes the cutscene's end) |
| Load a slot | the current mode after 0.5 s (v27's 500 ms) |
| Walk into another region | 2 s crossfade (v27 behaviour, done properly) |
| Enter or leave a dungeon | `music.dungeon.<key>` (v27's mechanism; the Citadel finally has a table: `shadow`) |
| Night falls | `.night` variant (new; the 4 s dusk ease) |
| Boss intro | music → −∞ over 0.3 s at 0.0 s; `boss` growl at 0.8 s; `music.boss` P1 at 4.10 s |
| Phase change | the next phase's layers over the 1.5 s transition |
| Boss death | §2.6.6 |
| Mute key `M` | `Music: OFF` / `Music: ON` (§2.8.4) |
| Party wipe (game over) | `music.gameOver` stinger, then silence until Continue |
| Return to title | 1 s fade, `music.title` |
| Cutscenes | `music.duck` per `cutscenes.md` §2.14: to 0.5 over 1.0 s and back over 1.5 s; the meteor's 2.5 s / 2.0 s to 0 verbatim |
| Weather | none (weather is the beds' job; music stays out of the way) |
| Blood moon | drone detune −100 cents over 3 s, back over 5 s (the world goes flat) |

#### 2.6.6 The death beat (bosses §2.5) in music

0.00 s: every music layer but the pad cuts to 0 in 50 ms (the hit-stop is silence, then the boom). 0.10 s: `boom` .5 + `victory` .5 (v27). 2.00 s: the `bells` motif once, straight, in the island's day table (the family's tune returns to the room). 6.00 s: the island or dungeon mode crossfades in over 2 s. For the Queen: no bells at 2.0 s; instead the `pad` alone until the ending's dawn, and `music.ending` begins with CS-10.

#### 2.6.7 Stingers (family `stinger`, music bus)

| Stinger | Recipe | When |
|---|---|---|
| `music.stinger.meteor` | AU §18 verbatim: `music.duck(−∞, 2.5 s)` at scene 1, `boom` .6 at scene 6 (plus `cs.meteor.rumble`), `music.duck(0, 2.0 s)` at scene 7; nothing else musical: the cutscene's music is the silence | CS-03 |
| `music.stinger.portal` | a held tritone pad: degrees [0, 3] of the forest scale and their octaves, C and F#-equivalent (392 → 370 slid over 4 s: the fifth going wrong), triangle, attack 1.5 s, release 3 s, lowpass 1200 → 400; ducks −6 dB | `A mysterious portal appears...` (CS-07) and on stepping in |
| `music.stinger.gameOver` | the drone `root/2 → root/4` over 2.5 s, the fourth to a minor third (`root × 0.6`), the pad's lowpass closing 900 → 120; then nothing | party wipe (v27: silence) |
| `music.stinger.actCard` | bells motif's first four notes, pad under, 3 s | the three act cards (story-beats §2.1) |
| `music.stinger.dungeonClear` | = `victory` .5 (v27) then the bells at 2.0 s (§2.6.6) | `<name> CLEARED!` |
| `music.stinger.rescue` | bells degrees [0, 2, 4] up, pad, 2 s, over `equip` .5 (v27) | each sibling rescued |
| `music.stinger.craterHum` | none: `amb.crater` is the hum (§2.2.5) | — |
| `music.stinger.kingReturn` | heartbeat alone for 2 bars before the intro's 0.0 s freeze | the King re-spawn at Crash Meadow after a wipe (bosses §2.6.6) |

#### 2.6.8 Mute and volume, verbatim

`M` (the v27 `mute` binding, remappable in the same list as v27's twelve actions) toggles music mute and announces **`Music: OFF`** / **`Music: ON`** in `#6B8EC8` for 1.5 s, exactly L8540. The hint strip token **`M: Mute`** (L3412) stays available to `ui-ux.md` if a hint strip exists. Semantics change in one way (logged): mute is persisted, and unmuting restarts the current mode with a fresh 2 s drone fade (v27 restarted from the biome; the effect is identical). Muting music never touches effects, ambience or dialogue (v27 likewise: `snd()` ignored `bgm.muted`).

### 2.7 Spatial rules

#### 2.7.1 The listener

**Position at the active hero, orientation from the camera.** The listener sits 1.0 m above the active hero's feet; its forward vector is the camera's yaw projected onto the ground; up is +Y. Why: the gameplay camera is 19–22 m from the hero at 45–55° (camp §2.11.5), so a listener at the camera would hear everything at the hero's feet as 20 m away and equally distant, and distance would stop meaning "near me". Measured from the hero, a goblin 10 m off is a goblin 10 m off however the player yaws; panned from the camera, left is left on the screen. On the title screen and in cutscenes the listener is where the shot's subject is (the fire on the title; the plane in CS-04; `cutscenes.md` sets it per shot). In photo mode it stays on the hero.

#### 2.7.2 Attenuation classes

`distanceModel: 'inverse'`, `panningModel: 'equalpower'` (HRTF costs 10× and the diorama is not first-person).

| Class | refDistance | rolloff | maxDistance | Used by |
|---|---|---|---|---|
| `near` | 3 m | 1.4 | 25 m | small things: destroyables, pickups near others, steps, animals, blips on objects |
| `mid` | 6 m | 1.0 | 40 m (the leash) | enemies, boss block cues, NPC actions, crates, cages, hazards |
| `far` | 12 m | 0.8 | 120 m | the plane, guardian wakes, `thunder`, the totem topple, guardian deaths |
| `bed` | 6 m | 1.0 | 16 m | fire and water proximity loops |
| `pan` | — | — | — | pan only, no distance: `thunder.far`, the shard, vultures |

One-shots compute gain and pan **once at spawn** on the CPU (the sim publishes the position with the event) and use a `StereoPannerNode`: cheap, and a 0.3 s sound does not move audibly. Loops and anything longer than 1 s (engine, beams, hums, proximity beds, the treasure jingle, the cart) get a `PannerNode` whose `positionX/Y/Z` AudioParams are updated at 20 Hz with `setTargetAtTime` (τ 0.05 s), never per frame.

#### 2.7.3 The plane: doppler and pan

The engine's oscillators are detuned by `clamp(−vRadial / 343 × 3, −0.15, 0.15) × 1200` cents, where `vRadial` is the plane's velocity component toward the listener (Web Audio dropped its own doppler; this is the hand version, exaggerated ×3 so 14 m/s reads as about 2 semitones, which is what a kid expects a low pass to do). Pan follows the `far` class panner; altitude lowers the lowpass (`lp × (1 − alt/120)`), so a plane at 28 m entering is duller than the 9 m pass, and a flyover from beyond the rim is heard 60–90 m out, before the shadow blob shows (npcs §2.2.8: the reason the low pass works). The parked engine is silent; `plane.wreck.tick` is the wreck's only sound.

#### 2.7.4 Voices and priority

| Budget | Desktop | Mobile |
|---|---|---|
| One-shot voices | 32 | 24 |
| Entity loops (engine, beams, hums, jingles, spark loops) | 8 | 6 |
| Bed layer slots | 8 | 6 |
| Chirp voices | 6 | 3 |
| Music voices (layers + live melody notes) | 4 + 6 | 4 + 4 |

Steal order when a pool is full: lowest priority first, then oldest, then quietest. Priorities: **P0** boss and guardian growls, `kidnap`, `victory_ext`, the cage shutting, the Queen's phase cues, the crash impact (never dropped, never throttled); **P1** signatures, ultimates, the combo riser, `levelup`, `victory`, `revive`, thunder, quake, the plane's engine events, `camp.build.done`; **P2** boss block cues, doors, chests, `boom`, `portal`, deaths of guardians, event starts; **P3** pickups, confirms, UI, dialogue advance, NPC actions, alerts of the thing targeting you; **P4** enemy alerts, windups, deaths, dodges, basic attacks; **P5** `hit`, destroyables, steps, absorbs; **P6** idle growls, animal calls, ticks. A boss fight with forty hits in flight therefore drops hits and steps, never the growl.

Per-name throttles: `hit` ≥ 40 ms apart and ≤ 6 live; `sword` / `arrow` / `magic` / `whirl` ≥ 80 ms; `hero.storm.arrow` merges into ≤ 8 voices; `step.*` ≥ 120 ms per hero; `enemy.idle.*` ≤ 3 live; `animal.*` ≤ 4 live; `alert.*` ≥ 150 ms per rig (a pack of eight goblins yips three times, not eight). Dedupe: the same name within 15 ms from within 1 m plays once at +2 dB.

#### 2.7.5 Fire, light and crackle agree

Every crackle voice with a `follower` reads the same `flVal` the render evaluates for that flame (world-events §2.8.3: the CPU evaluates it once per lit torch for its light; the audio engine reads that array). Rule: a fire's sound, flame and light never disagree. Torches: only the two nearest to the listener in a room carry a crackle voice (the rest are silent and still flicker in the shader); the campfire, the brazier, the cage lantern and the lit Bog posts each carry one while within their `bed` range. A fire whose light loses its pool slot (world-events §2.8.2) keeps its crackle; sound is not budgeted by the light pool.

#### 2.7.6 2D or positional, by class

2D: music, stingers, beds and weather layers, UI, dialogue, announces' cues, the active hero's own signature / ultimate / dodge / swap, level-up, victory, every growl with a name card, arena-wide boss cues (`meltdown`, phase banners, `channel*`), the quake, `event_start`. Positional: everything else, including companions' own cues (a companion's dodge is a thing that happened over there).

### 2.8 Mix and ducking

#### 2.8.1 Buses

```
voices → [spatial stage] → bus (effects | ambient | dialogue | music) → master → DynamicsCompressor(limiter) → destination
limiter: threshold −12 dB, knee 6, ratio 4, attack 3 ms, release 250 ms; then a master ceiling gain at −1 dBFS
```
Bus defaults (linear, before the user sliders): effects 1.0, ambient 0.8, dialogue 0.9, music 0.15 (v27's `bgm.vol`). The user sliders multiply these. The limiter is why the boss-death double hit (AU §24) and the `boom` 0.5 + `victory` 0.5 line no longer clip, and why a kid on headphones is safe from any stacking accident: nothing can exceed the ceiling.

#### 2.8.2 Settings (labels are `ui-ux.md` §2.7's, all **[new text]** except the two canon ones; the set of seven and the keys are this file's)

| Setting | Type | Default | Persisted key | Note |
|---|---|---|---|---|
| `Master` | slider 0–100 % | 80 | `audio.master` | sliders are squared (perceptual); each bus's default percentage lands on its §2.8.1 bus default, and 100 % is headroom the limiter absorbs |
| `Music` | slider 0–100 % | 60 | `audio.music` | 60 % ≈ v27's 0.15 |
| `Effects` | slider 0–100 % | 80 | `audio.effects` | — |
| `Ambient` | slider 0–100 % | 70 | `audio.ambience` | the label is `ui-ux.md`'s; the key keeps this file's spelling |
| `Dialogue` | slider 0–100 % | 70 | `audio.dialogue` | — |
| `Dialogue blips` | ON / OFF | ON | `audio.dialogueBlips` | some players find typewriter blips wearing; `dlg.advance` stays |
| `Mute music` (key `M`) | toggle | OFF | `audio.musicMuted` | announces **`Music: OFF`** / **`Music: ON`** (canon) |

Persisted in the settings schema beside v27's eight keys (SI Part 2 §16.5), never in the save slot. v27 persisted nothing audio-related; this is a departure (§6).

#### 2.8.3 Ducks

| Duck | Music | Ambient | Effects | Timing |
|---|---|---|---|---|
| Dialogue box open | −6 dB | −3 dB | — | 0.3 s in, 0.8 s out |
| Boss intro (0.0–4.10 s) | −∞ | −6 dB | — (the growl and the shake are the sound) | 0.3 s in; `music.boss` at 4.10 s over 1 s |
| Combo beat (1.4 s) | −4 dB | −6 dB | — | 0.15 s in, 0.5 s out; `hero.combo.rise` under it |
| Cutscenes | to 0.5 (−6 dB) over 1.0 s, back over 1.5 s (`cutscenes.md` §2.14); CS-03 the verbatim 2.5 s / 2.0 s to silence | none: ambience continues (`cutscenes.md` §2.14) | — | `music.duck(level, s)` from the shot's `onStart` |
| Stingers | −6 dB under a stinger | — | — | the stinger's length |
| Blood moon | detune, no duck | island bed −8 dB | — | 3 s / 5 s |
| Snow / blizzard / sandstorm | — | island bed −6 / −12 / −9 dB | — | the 6 s weather fade |
| Sheltering | — | rain lowpass 800 and −6 dB | fire +2 dB | 1.0 s |
| Level-up card, scrapbook pages | −3 dB, lowpass 2 kHz (heard through paper) | −6 dB | — | 0.3 s |
| Pause menu | −6 dB, lowpass 1.2 kHz | −9 dB, lowpass 1.2 kHz | one-shots stop being scheduled (the sim is frozen); running loops hold their gain (the engine idles where it is; a beam keeps humming) | 0.3 s |
| Tab hidden | master −60 dB then `suspend()` | | | 0.5 s |
| Hit-stop (0.04–0.15 s) | none | none | none | sounds already playing keep playing; the silence is the sim's |
| Game over | the stinger, then music 0 | −6 dB | — | until Continue |

#### 2.8.4 Accessibility interactions

None of Brief §6's toggles changes the sound except where it should: reduced motion removes the combo beat's camera move and bars but the riser, the freeze and the boom stay (heroes §2.5.8); the screen-shake slider does not touch `thunder` or `quake.rumble` (they are the reason the shake exists); text scale and hold-vs-toggle have no audio side. Additions that are accessibility-adjacent: the `Dialogue blips` toggle, the always-on limiter, and the sheltering caption already carries its own cue.

### 2.9 Multiplayer replication (AU §22 kept, drained)

The sim emits `sfx` events; the host's audio engine plays them and, when `NET.role === 'host' && NET.connected`, also packs `{ name, vol, pos?, seq }` into the snapshot's `sfx` array. Changes from v27: the queue is **drained after each snapshot** (AU §25.8; the monotonic `seq` still dedupes a resent snapshot), the cap rises from 5 to **12** per snapshot, positions ride along so guests spatialise from their own listener, and the exclusion list is a `replicate` flag on the cue row rather than a hard-coded `type !== 'hit'`.

| Replicated (host → guests) | Local on every client (derived from replicated state, never sent) |
|---|---|
| every hero signature, ultimate, combo, dodge, swap; pickups, equips, chests, doors, levers, plates, puzzles; enemy alerts, windups, deaths; every `boss.*` one-shot and the v27 boss cues; world event cues, thunder, quake, fish; camp build-ins; crates; NPC actions; `kidnap`, `victory`, `victory_ext`, `levelup`, `revive`, `achieve` | `hit` (v27's exclusion, kept: guests synthesise it on their own death VFX and hits as v27 did at L8812), steps, UI, dialogue blips and advance, beds and weather layers, the plane's engine and the doppler (from `world.planeState` and the plane's replicated position), the crackles (from the replicated fires), hums, `boss.beamLoop` / `tetherLoop` / `channelLoop` (from the block's replicated state), animal calls and idle growls (each client's own scheduler), music (each client runs its own director from the replicated mode) |

The combo beat, the boss intro and the level card play on every client at the same sim tick (heroes §2.5.8, bosses §2.3), which the event ordering guarantees.

### 2.10 Cuts, with reasons (for `KEEP_CHANGE_DROP.md`)

| v27 thing | Fate | Why |
|---|---|---|
| `bgm.sfxVol` (dead) | dropped; the `effects` bus replaces it | never read (AU §25.3) |
| `ALIEN_CRATER.hum` (dead) | **revived** as `amb.crater` | the field name is the intent; the 8 s pulse gives it a period (AU §17) |
| The per-call `GainNode` leak | fixed: nodes disconnect on `ended` | AU §25.6 |
| No `resume()` | fixed: resume on gesture and visibility | AU §25.7 |
| The un-drained net queue | fixed: drained per snapshot | AU §25.8 |
| `snd()`'s `if/else` chain | replaced by the typed cue table | AU §26 |
| Endless mode's `event_start` .4 and `boss` .5 call sites (L6637, L6664) | dead with the mode (story-beats: Endless cut) | the recipes live on |
| `hit` .15 as the portrait-strip click | replaced by `hero.swap.<hero>` | a swap should say who, not sound like damage (§6) |
| `heal` .2 on the post-death auto-switch (L2402) | replaced by `hero.swap.<hero>` .2 | it *is* a swap; `heal` keeps the Phoenix Feather site |
| `toggleMute9` restart-from-biome | kept in effect, persisted, and restarting the current *mode* | v27 forgot mute on every load (AU §1) |
| The 1.5 s overlap "fade-through" transition | replaced by a real 2 s crossfade | AU §20.5's overlap was an accident of `setTimeout`; the crossfade is what it was trying to be |
| `melVol` desert 0.06 | kept | it is the one per-biome mix decision v27 made, and it is right (the Desert is quiet) |
| Silence for crits, blocks, dodges, footsteps, menus, death | replaced (§2.2) | AU §25.10; each is a family member, not a new recipe |
| Nothing spatialised | replaced (§2.7) | AU §25.11 |

## 3. What preserves the magic

### 3.1 Recipe by recipe (ATMOSPHERE_RECIPES and AUDIO_INVENTORY section numbers)

| Recipe | Fate | How the feeling survives at the gameplay camera |
|---|---|---|
| **AR §19.1 the shared torch oscillator** (one `sin` drives flame and light) | **Translated** to a third consumer | The `crackle` family's gain follower reads the same `flVal` the flame shader and the light use (§2.4.12, §2.7.5). Light, fire and sound agree. A kid standing at the campfire hears it flare when it flares; a kid in the Bog hears a post gutter as the lantern dips (`lantern.gutter`). It is the difference between "a crackle near a fire" and "the fire". |
| **AR §19.2 simultaneous layering with distinct motion signatures** | **Kept** as the ambience rule | Every clear-weather frame carries the island bed (three layers with their own LFO rates), the weather layer, a proximity loop and the music drone: five sources with incommensurate periods (0.05, 0.08, 0.3, 0.7 Hz LFOs, 14 Hz cricket trains) so the room never loops audibly (§2.5.4). The Forest at dawn is eight simultaneous things, none of them expensive. |
| **AR §19.3 the biplane's four incommensurate motion sources** | **Kept** as the engine's method | The `engine` family has four: the 2 Hz rpm wobble, the 0.37 Hz drift on it, the 2.5 s miss with its 0.15 s static blade, and the doppler from a path that wanders (§2.4.11, §2.7.3). The plane is never doing nothing, and the plane is heard beyond the rim before the shadow blob shows, which is what makes the low pass a *visit* (npcs §2.2.8). The stall-drop is 1.2 s of silence then a backfire: the engine's sputter joke in sound. |
| **AR §8.2 wall torches** (per-torch 8.8–10 Hz, two oscillators at 1 : 1.7) | **Translated** | Only the two nearest torches carry a crackle voice, each following its own oscillator, so a room of six never crackles in unison (§2.7.5). |
| **AR §4 weather** ("each with sound, visibility, and gameplay effect", Brief §4.4 item 4) | **Replaced** (v27 had the strike's `boom` only) | Every weather type has a bed (§2.5.3); the strike keeps v27's `boom` 0.3 on the flash frame and gains the 1.2 s tail; the far thunder 0.8–2.0 s late lives on the sheet lightning where the delay can be heard; the sandstorm's howl and the blizzard's −12 dB duck make the visibility mechanic audible. |
| **AR §4.4 the double-flash envelope** | **Rhymed** | `thunder` is the v27 `boom` then a rumble tail: a hard hit and a ripple, the same shape as the flash. |
| **AR §11 the biplane choreography, §11.5 the crash** | **Kept** | `plane.crash.impact` is the v27 `boom` 0.3 (L6138) plus debris and a 3 s skid; the corkscrew runs the engine at roughness 1.0 with a miss every 0.6 s, the panicked version of the 2.5 s sputter. |
| **AR §13.1 the boss intro** (bars, a still frame, the card at 800 ms, the growl) | **Kept exactly** | `boss` 0.5 at 0.8 s, P0 so it is never stolen (§2.7.4); music to silence at 0.0 s so the growl is the only sound under the shaking still frame (§2.8.3); `music.boss` at 4.10 s. The pause before the name is what makes it land, and it is now also the pause before the music. |
| **AR §13.1 the mini-boss popup** (not letterboxed, the game does not stop) | **Kept** | `miniboss` at the wake beat, positional from the guardian, no duck. |
| **AU §3 `achieve` and `puzzle_solve`** | **Kept verbatim** | Every "good thing happened" ping is the ping a kid knows. |
| **AU §4 the four attack sounds** | **Kept verbatim** at their v27 volumes | `sword` / `arrow` / `magic` / `whirl` are the four kids' voices in combat; the 0.10–0.18 band (AU §24) stays the quietest band because they fire several times a second. |
| **AU §5 `ult` shared by every signature and ultimate** | **Kept** | The square sweep is the game's "power" word; the new per-ult impacts (§2.2.2) land after it, never instead of it. |
| **AU §7 `hit` on every impact** | **Kept**, throttled | The most-fired sound in the game stays dry and 70 ms; the throttle and the limiter are what let it fire forty times a second in a boss fight without becoming noise. |
| **AU §9 the growls** | **Kept**, extended | Every new growl (§2.2.4) is the `boss` shape with different numbers, reserved for things with a name card, so a growl always means "look up". |
| **AU §10 `pickup`, `equip`, `chest_open`, `revive`** | **Kept verbatim** | The collect chirp and the acquisition chime are the two sounds a kid has heard ten thousand times. |
| **AU §11 `levelup`, AU §19 `victory` and `victory_ext`** | **Kept verbatim** | C major, rising; the family's fanfares. `victory_ext` stays reserved for the Queen. |
| **AU §13 the dungeon set** | **Kept verbatim** | Doors, levers, plates, bars, pots, crates: the dungeon's grammar is unchanged, and the `sd` field stays the only data-driven lookup because it is how v27 said "sound is data". |
| **AU §16 `portal`** | **Kept**, given an idle | The tear opening is v27's; the idle hum (`amb.portal`) is what v27 drew and never sounded. |
| **AU §17 `ALIEN_CRATER.hum`** | **Revived** | An 8 s LFO on a fifth: the crater's pulse ring, audible. |
| **AU §18 the meteor duck** | **Kept verbatim** | 2.5 s out, `boom` 0.6, 2.0 s in. The cutscene's music is silence, and that is right. |
| **AU §20 BGM9** | **Kept as the base layer**, built on | The drone, the fourth and the wandering sine are the sound of the game since v9; every mode still has them underneath. A kid who heard v27's Forest will hear the same C4 drone on the first walk to the stream. |
| **AU §20.5 the transition** | **Made what it meant** | A real crossfade instead of a `setTimeout` overlap. |
| **AU §21 no ambience** | **Replaced** | The single biggest hole in v27, filled with the cheapest possible material. |

### 3.2 Family-canon threads that survive

- `Music: OFF` / `Music: ON` in `#6B8EC8` for 1.5 s on `M` (L8540), verbatim; `M: Mute` (L3412) kept as the hint token; the title's `🎵 Ambient Music` feature chip (FC §12.1) is finally a true statement.
- Every canon announce keeps its v27 cue at its v27 volume: `Bounty complete: <name>!` now has one (`questComplete`), `Aegis activated!` now has one (`shield`), `<name> revived by Phoenix Feather!` now has one (`heal`); nothing that made a sound in v27 makes a different sound unless §6 says so.
- The four caged lines, `GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"`, `KIDNAP PHASE - Protect your siblings!`, `ALL HEROES FREE!`: their v27 cues (`boom` .5, `kidnap` .4, `victory` .3) are P0 and never dropped.
- `If you see a yellow biplane, wave.`: the plane is now heard before it is seen, and `plane.wingRock` answers the wave (npcs §2.2.5).
- `Grandpa Ed says this kind of rain is 'character-building weather.'`: the sheltering duck (§2.5.5) is the sound of being under Ed's roof while it rains.
- `the engine won't purr without the spark plug` (npcs §2.2.7): four engine states, and `repaired` is the only one that purrs.
- Isabella's `Sugar?` emote, the pun names, the hens: `camp.slime.blorp`, `camp.fox.yip`, `camp.hen` are the camp's small voices; none is a line.
- The kids' pitch order in `hero.swap.<hero>` and `dlg.blip.<hero>` is age order, oldest lowest: the family's shape, audible.

### 3.3 What a kid will recognise from v27

The collect chirp, the acquisition chime, the level-up arpeggio, the victory run, the square-wave ultimate, the sub-bass boss growl under the letterbox, the portal's tear, the muffled `boom` of a slam, the C-major drone on the home island, and `Music: ON` when they press M. Everything else is new and built from the same six node types, so it sounds like it belongs to the same game.

## 4. Build notes for implementers

### 4.1 Assets

None. This is the one system whose asset list is empty by design. At context creation the engine generates three noise buffers (white 2 s, pink 4 s via a Paul Kellet 3-pole filter, brown 4 s via a leaky integrator), about 1.2 MB of float32 at 48 kHz, once per session. `assets/LICENSES.md` gains no audio entry. The single-file archive contains no media.

### 4.2 Node budget and where it runs

| Thing | Count | Where |
|---|---|---|
| Buses | 4 + master + limiter | `AudioEngine` |
| Live one-shot voices | ≤ 32 desktop / 24 mobile, each 2–5 nodes | audio thread |
| Loops (engine, hums, crackles, beds, chirps) | ≤ 8 + 3 + 6 + 8 + 6 | audio thread |
| Music | 4 layer chains + ≤ 6 melody voices | audio thread |
| Main-thread work per frame | one gain write per bed layer and per follower crackle; the 25 ms music and chirp schedulers; spatial updates at 20 Hz | ≤ 0.3 ms |

No `AudioWorklet` (nothing here needs sample-accurate DSP, and worklets complicate the single-file build), no `ConvolverNode` (the one "room" is a 90 ms feedback delay in the Tomb's bed), no `ScriptProcessorNode`.

### 4.3 Where it lands (Brief §7.3)

```
src/engine/audio/AudioEngine.ts        context lifecycle, unlock, resume/suspend, buses, limiter, voice pools, throttles, dedupe, settings binding
src/engine/audio/spatial.ts            listener, attenuation classes, one-shot pan/gain at spawn, PannerNode loops at 20 Hz, doppler
src/engine/audio/noise.ts              the three buffers, the cached (d, p, amp) envelope reads
src/engine/audio/recipes/<family>.ts   impact, whoosh, boom, sweep, siren, growl, pair, arpeggio, blip, step, engine, crackle, hum, bed, chirp, stinger
src/engine/audio/music/MusicDirector.ts  modes, transitions, ducks, the M key, the death beat
src/engine/audio/music/scheduler.ts    25 ms tick, 100 ms horizon, bar grid, the drift contour
src/engine/audio/ambience/AmbienceDirector.ts  island × phase × weather sets, the sheltering duck, proximity loops, the eight-slot pool
src/engine/audio/snd.ts                snd(name, vol?, opts?) → events.emit('sfx')
src/content/audio/cues.ts              the cue map of §2.2 as typed rows; exports CueName
src/content/audio/music.ts             the seven tables, the mode table, the layer gains
src/content/audio/themes.ts            note data (degrees and beats)
src/content/audio/beds.ts              the layer sets of §2.5
src/sim/…                              every emitter calls snd(); the sim never touches a node
src/net/…                              the sfx array in the snapshot (replicate flag)
src/ui/settings                        the seven strings of §2.8.2
src/dev/console                        the hooks of §4.5
```

### 4.4 Phase mapping (Brief §8)

| Phase | Ships |
|---|---|
| **1 Pilot** | `AudioEngine`, buses, limiter, unlock; `amb.forest.*` four beds with the phase crossfade; `amb.camp.fire` with the follower; `amb.stream`; `amb.rain` / `amb.storm` / `thunder` for the weather toggle; `ui.tab`, `ui.confirm`, `ui.cancel`. The pilot's stations are silent PNGs, but the pilot's weather and day/night toggles should be heard by whoever runs it, and the follower rule is cheapest to prove while the campfire is being built. Brief §8 puts the audio port in Phase 5; this slice is the engine skeleton the port lands on. |
| **2 Vertical slice** | the 29 + 3 v27 recipes; every `hero.*`, `dodge.*`, `alert.*`, `windup.*`, `death.*`, Forest enemy cues, `horde.*`, `cage.*`; the Goblin King's and Treant's `boss.*` cues; `music` Forest day/night, camp, dungeon, boss, the death beat; `dlg.*`, `ui.*`; `questComplete`, `shield`, `heal`; the Forest animals; `amb.dng.grove`; steps |
| **3 The world** | the other islands' beds and weather layers; the `engine` family and every `plane.*`; `music.travel`; the remaining `boss.*`; `treasure.jingle`, fish, the 19 animals; `merchant.chime`; `frog.*`, `lantern.*` |
| **4 Lights in the Dark** | `amb.shadow.*`, `amb.dng.shard.f1–f3`, `amb.dng.hearth`, `amb.shard` by act, `amb.crater`, `amb.portal`; `music.finale`, `music.ending`, the stingers; the `cs.*` anchors; photo mode's shutter; `ui.crest.grow` |
| **5 Polish** | the mix pass on real speakers and phones; multiplayer replication; the mobile voice caps; the settings persistence; the `Dialogue blips` toggle; `npm run check` coverage tests below; Brief §8's "audio inventory fully ported" gate |

### 4.5 Test hooks

Dev console: `audio.play <cue> [vol] [x z]`, `audio.stop <token>`, `audio.solo <bus>`, `audio.mute <bus>`, `audio.voices` (live counts per pool and the last ten steals), `audio.list [prefix]`, `audio.music <mode>`, `audio.bed <island> <phase> <weather>`, `audio.listener`, `audio.state`. Vitest (all against `OfflineAudioContext`, no output device): every `CueName` row builds without throwing and renders non-silent samples; every v27 recipe's rendered peak and duration match AU §3–§19 within 5 % (the transcription test); every hook name in §2.2 of *every* design file's §5 `audio.md` row appears in `cues.ts` (a grep-driven coverage test with the list checked in); no `snd()` string literal in `src/` is outside `CueName`; the throttle drops the 7th `hit` in 40 ms; the priority table never steals P0; the replicate flag excludes exactly the local list of §2.9; the settings round-trip. Smoke (headless): a scripted boss intro with 40 concurrent hits keeps the growl; a 10-minute idle at camp allocates no nodes after warm-up (heap flat).

### 4.6 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| Per-call buffer allocation (v27 built a fresh `AudioBuffer` per `hit`) | three buffers at boot; envelopes applied by a cached read table per (d, p, amp); `BufferSource` nodes are cheap |
| Node leak | every one-shot chain disconnects on `ended`; loops are pooled and reused; a heap test in §4.5 |
| Forty hits a second | the 40 ms throttle, the 6-voice cap, the dedupe, the limiter |
| `PannerNode` cost | one-shots use `StereoPannerNode` with CPU pan; only loops get panners; `equalpower` |
| Main-thread time | nothing per voice per frame; followers write ≤ 12 gains per frame; schedulers at 25 ms |
| Mobile | caps halved; `foliage` and `heat` layers off; chirps 3; the compressor is the same |
| Safari | `webkitAudioContext` prefix, `positionX` AudioParam absence (fallback to `setPosition`), `suspend()` on hide: all behind Rule 2 gates (§4.7) |
| Determinism | audio randomness uses its own RNG; the sim never reads audio state |

### 4.7 Rule 2 gates before code

Verify with a real call, and record the shape in the task notes: `new AudioContext({ latencyHint })` and `state` transitions on gesture; `AudioContext.resume()` promise on Chrome, Firefox, Safari (desktop and iOS); `StereoPannerNode` availability; `PannerNode.positionX` as an AudioParam vs `setPosition`; `DynamicsCompressorNode` parameter ranges; `OscillatorNode.detune` and `AudioBufferSourceNode.playbackRate` ramps; `OfflineAudioContext.startRendering()` under Vitest's environment (jsdom has no Web Audio: the unit tests run the recipe builders against a typed mock of the node graph, and the rendered-sample tests run in the headless browser harness); `document.visibilityState` on mobile browsers.

### 4.8 Build order

1. `AudioEngine` with buses, limiter, unlock, resume; `noise.ts`; `snd.ts` and the `sfx` event.
2. The seven one-shot families with the 29 v27 rows; the transcription test.
3. `spatial.ts`; the priority pools and throttles.
4. `crackle` with the follower on the pilot campfire; `bed` with `amb.forest.*` and `amb.stream`; the `AmbienceDirector` crossfades.
5. `MusicDirector` and the scheduler with the v27 layers; camp and boss modes; the death beat.
6. The rest of the cue map by phase (§4.4); `themes.ts`; `engine`; `hum`; `chirp`.
7. Replication, settings, mobile caps, the mix pass.

## 5. Cross-references and conflicts

### 5.1 Earlier design files, and exactly what was taken

| File | Taken |
|---|---|
| `heroes.md` | §5's list (four dodge whooshes, the `snapShot` two-note cue, the swap chime, `shield` for Aegis, the optional emote stinger, the three hit-stop impacts) → §2.2.2; §2.5.5–2.5.6 the v27 sites kept at their volumes and the three ults without an impact; §2.5.7 the seven hit-stop sites; §2.5.8 the combo beat's 0.75 s impact (`boom` .5) and its 1.4 s shape; §2.4.6 emotes as bubbles with no voice; §2.4.1 the clip timings that drive `step.*`; §2.3.1 heights and the age order used for the swap and blip pitches; §2.5.3 the M-key-style remappable list |
| `enemies.md` | §5's list (alerts, windups, dive, spark and fuse loops, blink, heal beam, charge stomp, statue wake, cap pop, four death verbs, four guardian deaths, totem crack and topple, lock pop and lantern release) → §2.2.3; §2.4 the FSM states the cues hang on and the 8/s charge footfalls; §2.7 the wake beat with `miniboss`; §2.8 the brazier and cage lantern oscillators (followers), `equip` .5 at the cage; §2.3 the five rigs as the alert and windup parameterisation |
| `world-events-weather.md` | §2.2.3's sound-hook column → §2.5.3 one for one; §2.2.4 `thunder` as `boom` .3 plus a 1.2 s tail and `thunder.far` 0.8–2.0 s late; §2.5.2 the event cues and the blood moon −8 dB, the spring's trickle, `treasure.jingle`, `quake.rumble` with `rock_slide` at 0.5 s and 2.2 s, the −3 st growls; §2.7.1 the 19 species and the 8–20 s call rule; §2.7.2 `fish.bite` / `fish.catch` and the miss; §2.7.3 the sheltering beat; §2.1.1 the phases and the 3 s rest sweep; §2.2.2 the 6 s weather fade; §2.8.3 the torch oscillator the followers read; §2.8.2 the light pool's priority ladder as the model for §2.7.4 |
| `bosses.md` | §2.2's sound-hook columns (the 8 ported blocks and 17 new) and §5.2's 31 names → §2.2.4 with the `hazardSpawn` and `summon` expansions; §2.3 the intro timeline (music out at 0.0, growl at 0.8, boss mode at 4.10); §2.5 the death beat's `boom` + `victory` at 0.10 s; §2.6.3 `boss.cageShut` at 2.1 s and the P0 rule for the Kid Snatch strings; §2.16 the Queen's phase cues and the riftstorm at P3; §5.2 the magma lights sharing the crackle |
| `camp.md` | §5.2's list → §2.2.6; §2.7.1 the fire's oscillator, size classes and the 4–9 s pop; §2.6.1 the build-in sequences and their sounds (six knocks, 2/s saw, 8/s shingles, "no hammer" at C6); §2.7.3–2.7.4 rest and sit; §2.9 the fox, Sugar and the hens; §2.12 the title camp for `music.title`; §2.11.5 the camera distance that decided the listener |
| `npcs.md` | §2.2.7 every engine hook and the doppler-and-pan rule → §2.2.7 and §2.4.11; §2.0 the plane-state table for the engine parameters; §2.3.4 the CS-04 beats (coughs per state, hops per state) → `music.travel` and the plane cues; §2.9.1 `frog.*`; §2.9.2 the post's gutter; §2.11 the 120 cps typewriter → one blip per 6th character; §5.2 `lantern.gutter`, `merchant.chime`, `dlg.blip.<who>` with Ed lowest, `dlg.advance`, the crate cues equal to `equip` .15 / .3; §2.2.5 the wing-rock |
| `story-beats.md` | §5 CS ids as anchors (→ §2.2.8), the plane-state ladder, the shard as a night ambient source (`amb.shard` by act); §2.10 the cutscene list and CS-03's verbatim scenes; §2.3 the camp stages that gate `music.camp`'s bells; §2.1 the act cards |
| `DECISIONS.md` | the 2026-09-06 lines: the plane's procedural engine (npcs), `questComplete` defined (camp), the 31 `boss.*` names (bosses), the fire's shared oscillator (camp, enemies), Endless cut (story-beats; two call sites go dead), colours in `heroes.md` only (no colour is decided here) |

### 5.2 What later files must pick up from this one

| File | Must pick up |
|---|---|
| **`ui-ux.md`** | the four bus names and the seven settings of §2.8.2 under its own labels (`Master`, `Music`, `Effects`, `Ambient`, `Dialogue`, `Dialogue blips`, the `M` mute) as 0–100 % sliders; the `M` key in the remappable list and the announce in `#6B8EC8` for 1.5 s; `M: Mute` if a hint strip exists; the `ui.*` / `card.*` / `photo.shutter` names of §2.2.8 are its own §5.2 names (reconciled 2026-09-07); the level card, scrapbook page and pause ducks (§2.8.3); the announce channel is silent by itself except the two token-keyed stingers; the portrait strip plays `ui.swap` = `hero.swap.<hero>`; the emote wheel plays `hero.emote.<hero>` (three blips); the dialogue log page makes no sound; the catch card plays `card.catch`; the `Dialogue blips` toggle |
| **`cutscenes.md`** | its `cs.*` names (§2.0 and §2.14) are the rows of §2.2.8 (reconciled 2026-09-07); `music.duck(level, s)` as the one API with its §2.14 numbers (CS-03's 2.5 s / 2.0 s verbatim; every other cutscene to 0.5 over 1.0 s and back over 1.5 s; effects never ducked; ambience continues); the listener rule per shot (§2.7.1); `cs.meteor.roar` with doppler and pan across scenes 2–5, `cs.meteor.rumble` after `boom` .6 at scene 6; the crash's engine roughness and `plane.crash.impact`; CS-04 on `music.travel` and the plane cues per state; the plane's engine dopplering in CS-10 shot 11 (§2.7.3); CS-10 on `music.ending`; `dlg.blip.<who>` on captions; boss intros use §2.8.3's intro duck exactly as bosses §2.3 times it |
| **`dungeons.md`** | the v27 dungeon recipes at their volumes and the `sd` field as the lookup; its bed keys (`amb.dng.grove` / `tomb` / `temple` / `citadel` / `shard.f1–f3` / `hearth`) and its shared and per-dungeon cue names (§2.1.11, §5.2) are the rows of §2.2.8 and §2.5.6 (reconciled 2026-09-07; the layer sets and families are this file's); the torch rule (two nearest torches crackle, followers on the room's oscillators); the Bog's `lantern.light` / `lantern.gutter` as the darkness dungeon's sound; the Depths' crystal hum brightening with the emissives; Home, Wrong's three-floor escalation of the rift layer; `music.dungeon.<key>` selecting the island's table and the boss-room hand-off to `music.boss`; `dng.nameCard` = `card.title`; the island bed fading at the arch; `ice.crystal.<C4\|E4\|G4\|A4\|C5>` are its notes (C major pentatonic over the `frozen` drone) |
| **`heroes.md` addendum (collected by the orchestrator)** | footfall events from the walk and run clips' contact poses (the `step` family needs them); the swap chime's four note pairs; the `snapShot` cue at the window's open; `hero.combo.rise` under the two-shot |
| **`world-builder` / `systems-engineer`** | surface tags on ground materials for `step.<surface>`; the stream polyline for `amb.stream`'s nearest point; the shelter volumes; `flVal` arrays published for every lit fire; `world.aurora.intensity` for `amb.aurora`; `story.act` for `amb.shard`; the plane's world velocity for the doppler |
| **`net-engineer`** | the `sfx` array shape `{ name, vol, pos?, seq }[]`, cap 12, drained per snapshot; the `replicate` flag on cue rows |

### 5.3 Conflicts found, and how this file designs around them

1. **Name collision `camp.*`.** `enemies.md` §5 asks for "camp totem crack and topple"; `camp.md` owns the `camp.*` prefix for Stewart Camp and itself flags the P2 collision ("camp" is the horde's word). Resolved here: the horde's cues are `horde.totem.crack` / `horde.totem.topple`; `enemies.md`'s text is unchanged (it named no cue), and the implementer reads the map.
2. **Ground Pound's landing sound.** `heroes.md` §2.5.5 keeps `snd('boom', 0.3)` at the landing *and* asks for a hit-stop impact sound. Both would double on every pound. Resolved: `hero.pound.impact` fires only when the pound connects (hit-stop fires on connect), layered on the v27 `boom`; a pound into empty ground is v27's sound alone.
3. **The portrait strip's `hit` .15** (AU §3) is a v27 call site with a v27 name; replacing it with `hero.swap.<hero>` changes a v27 call site, which this file otherwise never does. Logged (§6) with the reason: a swap that sounds like damage is the one v27 sound a kid never liked.
4. **Weather crossfade length.** The task names 3 s; `world-events-weather.md` §2.2.2 fixes weather cross-fades at 6 s and the rest sweep at 3 s. The beds follow the owning file: 6 s for weather, 3 s for the sweep and the event in-fades (§2.5.3, §2.5.4). No file is changed.
5. **`crate.land` = `equip` .15** (npcs §5.2, the v27 site) gains a thud layer; the v27 call and volume are kept, the layer is additive. Not a conflict once written that way, noted so nobody reads it as a rename.
6. **Brief §8 phases audio in Phase 5** while every other design file ships cues in Phases 2–4. Resolved in §4.4: the engine skeleton and the Forest beds land in Phase 1 with the campfire (the follower is cheapest to prove there), the port lands with the systems that call it, and Phase 5 keeps the mix pass, replication and the gate. The Brief's gate sentence ("audio inventory fully ported") is unchanged.
7. **Endless mode** (story-beats: cut) leaves two v27 call sites (`event_start` .4, `boss` .5) dead; the recipes are shared and lose nothing (§2.10).
8. **Reserved families** for `dungeons.md`, `cutscenes.md` and `ui-ux.md` (§2.2.8) were written before those files landed. **Resolved 2026-09-07:** their names win (`ui-ux.md` §5.2's `ui.*` / `card.*` / `photo.shutter`; `dungeons.md` §2.1.11 and §5.2's shared, per-dungeon and bed keys; `cutscenes.md` §2.0's `cs.*`); the families, parameters and layer sets stay this file's. Renamed here: `ui.titleCard` → `card.title`, `ui.pageTurn` → `ui.page`, `ui.click` → `ui.tab`, `ui.hover` → `ui.focus`, `ui.back` → `ui.cancel`, `ui.tutorialStep` → `ui.tutorial.step`, `ui.heroSwitch` → `ui.swap`, `ui.photo.shutter` → `photo.shutter`, `ui.levelCard` dropped (the card plays v27's `levelup`), the silent `ui.announce` row → the two token-keyed stingers, `dng.entryCard` → `dng.nameCard`, `dng.roomClear` dropped (v27's `equip` .3), `dng.floorBanner` → `shard.banner`, `dng.aurora.power` → `ice.domeOpen`, the `dng.<object>.*` sketches → `grove.*` / `tomb.*` / `temple.*` / `ice.*` / `shard.*`, `amb.dng.hollowGrove` / `buriedTomb` / `sunkenTemple` / `iceCitadel` / `homeWrong` → `amb.dng.grove` / `tomb` / `temple` / `citadel` / `shard.f1–f3` + `hearth`, `cs.meteor.whistle` / `cs.meteor.impact` + `cs.meteor.sub` → `cs.meteor.roar` / `boom` .6 + `cs.meteor.rumble`, `cs.duck.*` → `music.duck(level, s)` with `cutscenes.md` §2.14's numbers. `cues.ts` carries one name per cue; no recipe changed.
9. **Settings labels and ranges.** `ui-ux.md` §2.7 had already written `Master` / `Music` / `Effects` / `Ambient` / `Dialogue` as 0–100 % sliders; this file's `Master volume`, `Ambience` and 0–10 are gone (§2.8.2). The set of seven and the persisted keys are this file's, and `ui-ux.md` picks up `Dialogue blips`.
10. **The `ui.*` prefix** is shared by `ui-ux.md`'s style tokens (`src/style/ui.ts`) and this file's cue names (`CueName`); the tables are different types and never meet in one lookup. The one deliberate overlap is `ui.announce.hurt` / `ui.announce.alarm`: the announce channel looks its stinger up by the string's colour token, so the cue is named for the token. No other full name may appear in both tables.

## 6. Decisions logged

- 2026-09-06 · phase-0.5/audio · The 29 v27 recipes port as data value for value (wave, frequency curve, envelope, filter, noise, duration, internal gain scale) and `snd(name, vol)` keeps v27's semantics including the 0.25 default · every one of the 151 call sites ports unchanged and a kid recognises the sounds · rejected: redesigning the v27 set (it is the game's voice), a new dispatcher signature.
- 2026-09-06 · phase-0.5/audio · `shield`, `heal` and `questComplete` are defined (a steel-ring pair, `revive`'s first three notes, a three-note stamp with a nail) · AU §25.1: the names were called and never written; the silence was a missing key · rejected: keeping them silent, mapping them to existing cues (a kid would hear the wrong thing).
- 2026-09-06 · phase-0.5/audio · Seventeen recipe families with named parameters instead of one recipe per hook; every requested hook is a member row · about 300 cues in seventeen `build()` functions instead of 300 branches; enemies.md's five alerts and bosses.md's 31 cues are parameter sets · rejected: twenty-plus families (the extra four collapsed without losing a parameter), a flat list.
- 2026-09-06 · phase-0.5/audio · No audio files, ever: music is note data (`themes.ts` in scale degrees and beats) rendered by oscillator recipes; ambience is filtered noise and granular chirps; dialogue is blips · Brief §7.1 and the time-capsule rule; the archive carries no media · rejected: a small set of CC0 samples for animals and thunder (a network of licences and a 2045 codec risk for no gain a kid would notice).
- 2026-09-06 · phase-0.5/audio · Ambient beds per island × clock phase × weather (20 base beds, 9 weather layers, 7 dungeon beds) built from 15 layer types, ≤ 8 layer slots, five sources minimum at every clear frame · AU §21 was "none"; AR §19.2's count-and-layer-order lesson applied to sound · rejected: one bed per island, a single wind loop.
- 2026-09-06 · phase-0.5/audio · Fire crackles follow the flame oscillator (`flVal`) that already drives the flame mesh and the light; only the two nearest torches per room carry a voice · AR §19.1: light and fire agree, and now sound does; the torch pool cost stays fixed · rejected: a crackle loop with its own LFO (the flare would not match), a voice per torch.
- 2026-09-06 · phase-0.5/audio · The plane's engine is a two-oscillator recipe with four incommensurate sources (2 Hz wobble, 0.37 Hz drift, the 2.5 / 3.5 s miss, doppler), parameterised by the four plane states, with spin-up, spin-down, sputter, stall and touchdown as envelopes · AR §19.3's method carried into sound; npcs §2.2.7's hooks; heard beyond the rim before the low pass · rejected: one looped engine tone, a file.
- 2026-09-06 · phase-0.5/audio · Doppler is hand-computed (detune = radial velocity / 343 × 3, clamped ±15 %) · Web Audio has no doppler; ×3 makes 14 m/s read as the two semitones a kid expects · rejected: physically correct (inaudible at 14 m/s), none.
- 2026-09-06 · phase-0.5/audio · BGM9 ports as the base layer (drone, the fourth renamed `fourth`, the drift melody with its v27 spacing) on a 25 ms lookahead scheduler with a bar grid; onsets snap to eighths and the melody gains a step-heavy contour · AU §26's scheduler; the free-time feel survives because the interval distribution is v27's · rejected: keeping the per-frame `dt` countdown (drift and no grid for new layers), a fully composed loop.
- 2026-09-06 · phase-0.5/audio · A `shadow` music table (the Forest's root and tune in C minor pentatonic) and modes for camp, title, dungeon, boss, finale, travel and ending, plus five new layers (pulse, heartbeat, pad, bells, shadow) · v27 had no boss, night, Shadow Realm or camp music and the Citadel fell through to C4 sine; Home, Wrong is the Forest, wrong · rejected: a sixth island-style table for the Realm (loses the mirror), per-boss themes (eleven themes for one engine).
- 2026-09-06 · phase-0.5/audio · Boss music roots on the island scale's last note halved (the relative-minor trick) at tempo ×1.25 with a heartbeat layer, adding drift at P2 and the inverted motif at P3 · the same notes, the wrong root: a boss fight sounds like the island turned against you, with one line of code per island · rejected: a separate boss scale table, no phase layering.
- 2026-09-06 · phase-0.5/audio · One family motif ("The Squad", 16 beats in scale degrees) is the camp, title, ending, travel and boss-P3 theme, transposed by mode · one tune a kid can hum that follows them to every island; authored as data so it is never a file · rejected: a theme per kid (four tunes nobody learns), no theme.
- 2026-09-06 · phase-0.5/audio · The boss death beat cuts every music layer but the pad at 0.0 s, keeps v27's `boom` + `victory` at 0.1 s, and plays the motif once at 2.0 s · the hit-stop should be silent; the family's tune returning is the reward · rejected: v27's continuing drone.
- 2026-09-06 · phase-0.5/audio · Listener position at the active hero (1 m up), orientation from the camera yaw · the camera is 19–22 m away at 45–55°, so a camera listener hears the hero's feet as 20 m off; pan must match the screen · rejected: listener at the camera, listener at the hero with hero-relative pan (left would not be left).
- 2026-09-06 · phase-0.5/audio · Five attenuation classes (near 3 m, mid 6 m, far 12 m, bed 6 m / 16 m, pan-only), `equalpower`, one-shots panned on the CPU at spawn with a `StereoPannerNode`, loops on `PannerNode`s at 20 Hz · AU §25.11; HRTF costs 10× for a diorama camera · rejected: HRTF, a panner per one-shot.
- 2026-09-06 · phase-0.5/audio · Voice pools (32 / 24 one-shots, 8 loops, 8 bed slots, 6 chirps) with a P0–P6 priority order; growls with a name card, `kidnap`, `victory_ext`, the cage shutting and the crash are P0 and never stolen; `hit` ≥ 40 ms and ≤ 6 live · a boss fight must never drop the intro growl; v27 summed everything and clipped · rejected: no cap (mobile), age-only stealing.
- 2026-09-06 · phase-0.5/audio · Four buses (effects, ambient, dialogue, music) under a master limiter (−12 dB threshold, 4:1, ceiling −1 dBFS); seven persisted settings; the M key and `Music: OFF` / `Music: ON` verbatim · AU §24 had no bus and v27 persisted nothing; the limiter makes the v27 double-hit safe · rejected: a single SFX volume (the task and ui-ux need dialogue and ambience separately), un-persisted mute (v27).
- 2026-09-06 · phase-0.5/audio · Ducks: dialogue −6 / −3 dB, boss intro music to silence at 0.0 s with the growl at 0.8 s and boss mode at 4.10 s, cutscenes −9 dB default with CS-03's 2.5 / 2.0 s verbatim, pause −6 / −9 dB with a 1.2 kHz lowpass, hit-stop untouched · AU §18 is the only v27 duck and it was right; the intro's still frame needs one sound · rejected: no ducking, ducking effects.
- 2026-09-06 · phase-0.5/audio · The sheltering duck (rain lowpassed 800 Hz and −6 dB, wind −3, fire +2, roof-edge drips) under roofs in rain and storm · world-events §2.7.3's beat made audible; it is the sound of Ed's roof · rejected: no change under shelter.
- 2026-09-06 · phase-0.5/audio · `thunder` = v27 `boom` 0.3 at the flash plus a 1.2 s rumble tail; `thunder.far` 0.8–2.0 s after sheet lightning; `thunder.rift` pitched −12 st · world-events §2.2.4 verbatim; the strike distances are too short to delay · rejected: delaying strike thunder.
- 2026-09-06 · phase-0.5/audio · `ALIEN_CRATER.hum` revived as `amb.crater` with an 8 s LFO matching the pulse ring; `amb.portal` and `amb.shard` (by act) added as object hums · AU §17's dead field was intent; story-beats §5 asks for the shard as a night source · rejected: leaving the crater silent.
- 2026-09-06 · phase-0.5/audio · The portrait strip's `hit` .15 and L2402's post-death `heal` .2 become `hero.swap.<hero>` (two notes in age order, oldest lowest); the two v27 call sites are the only ones renamed · a swap should say who and should not sound like damage · rejected: keeping `hit` (v27), one chime for all four.
- 2026-09-06 · phase-0.5/audio · Emotes make no stinger; the bubble plays three of the hero's dialogue blips · heroes.md offered the stinger as optional; a stinger per emote would wear in ten minutes and the blips already say who · rejected: the `questComplete`-style stinger.
- 2026-09-06 · phase-0.5/audio · Three per-ultimate impacts added (`hero.excalibur.strike`, `hero.storm.arrow` merged to ≤ 8, `hero.nova.burst`) after the shared `ult` · AU §5 records the three silent impacts; the shared `ult` stays the cast · rejected: per-hero cast sounds (the square sweep is the game's "power" word).
- 2026-09-06 · phase-0.5/audio · Footsteps for the active hero only (nine surfaces, ≥ 120 ms, speed-scaled), companions at 50 % within 3 m · AU §25.10; four kids running would be a drum kit · rejected: no steps, steps for all four.
- 2026-09-06 · phase-0.5/audio · Enemy idle growls per rig (every 6–14 s, ≤ 3 live), pitched −3 st under the blood moon · world-events §2.5.2 requires the pitch rule and enemies.md's roster needs an idle voice to read at night · rejected: none.
- 2026-09-06 · phase-0.5/audio · Every animal species gets a call (19), ≤ 4 live, 8–20 s apart; the giant snail hums · world-events §2.7.1's rule; the populated diorama should be heard · rejected: calls for a few species.
- 2026-09-06 · phase-0.5/audio · The horde's totem cues are `horde.*`, not `camp.*` · camp.md owns `camp.*` and flagged the P2 collision · rejected: `camp.totem.*`.
- 2026-09-06 · phase-0.5/audio · Unknown cue names warn once and play `ui.error` at −20 dB in dev builds; `CueName` is a typed union · v27's silent no-op is how three cues stayed undefined for eighteen versions · rejected: silent no-op.
- 2026-09-06 · phase-0.5/audio · Replication keeps AU §22's model (host packs, guests replay by monotonic id, `hit` local) with the queue drained per snapshot, a cap of 12, positions attached and a per-cue `replicate` flag; beds, engine, crackles, hums and music derive locally from replicated state · AU §25.8; positional replay needs the position · rejected: replicating everything, replicating nothing.
- 2026-09-06 · phase-0.5/audio · `music.stinger.gameOver` added (the drone falling an octave, the fourth to a minor third, the pad closing) · AU §19: v27 game over was silence; a party wipe outside the King's arena needs an ending sound · rejected: a fanfare in minor.
- 2026-09-06 · phase-0.5/audio · The engine skeleton, the Forest beds and the campfire crackle ship in Phase 1 with the pilot; the port lands with the systems that call it in Phases 2–4; Phase 5 keeps the mix pass, replication and the "fully ported" gate · the follower is cheapest to prove while the campfire is built; Brief §8's gate sentence is unchanged · rejected: all audio in Phase 5 (three phases of silent systems).
- 2026-09-06 · phase-0.5/audio · No `AudioWorklet`, no `ConvolverNode`; the one room is a 90 ms feedback delay · the single-file archive and the budget; nothing here needs sample-accurate DSP · rejected: a worklet synth.
- 2026-09-06 · phase-0.5/audio · The `sd` field on destroyable decor stays the one data-driven lookup and now indexes the cue map · AU §13: it is how v27 said "sound is data" · rejected: folding it into the enemy or prop type.
- 2026-09-07 · phase-0.5/audio · Consistency pass: the cue names of the three wave-mates that landed first are adopted (ui-ux.md §5.2's `ui.*` / `card.*` / `photo.shutter`; dungeons.md §2.1.11 and §5.2's shared, per-dungeon and bed keys, including `amb.dng.shard.f1–f3` and `amb.dng.hearth`; cutscenes.md §2.0's `cs.*`); the families, parameters and layer sets stay this file's; §5.3 item 8 lists every rename · why: those files own their names and this file promised to follow them · rejected: none (reconciliation).
- 2026-09-07 · phase-0.5/audio · Settings take ui-ux.md §2.7's labels and 0–100 % sliders (`Master` 80, `Music` 60, `Effects` 80, `Ambient` 70, `Dialogue` 70; sliders are squared, and each bus's default percentage lands on its §2.8.1 bus default); the set of seven and the persisted keys stay this file's, and `Dialogue blips` goes to ui-ux.md · why: ui-ux.md owns strings and had already written the row · rejected: this file's 0–10 sliders and the `Ambience` label.
- 2026-09-07 · phase-0.5/audio · Cutscene ducking takes cutscenes.md §2.14's numbers: CS-03 verbatim; every other cutscene ducks music to 0.5 over 1.0 s and restores over 1.5 s; ambience continues; effects never ducked · why: cutscenes.md owns the cinematic contract, and the −9 dB default and −3 dB ambient duck here were written before it landed · rejected: keeping them.
- 2026-09-07 · phase-0.5/audio · The crystal-resonance notes are dungeons.md's C4 E4 G4 A4 C5 (`ice.crystal.<note>`), not the frozen scale; over the `frozen` mode's E drone they read as E minor's ♭6 colour and stay in tune · why: dungeons.md owns the puzzle, and a kid knows C major · rejected: the frozen-scale bells.
- 2026-09-07 · phase-0.5/audio · The `ui.*` prefix is shared by ui-ux.md's style-token table and this file's cue table; the two are different types and never meet in one lookup; the one deliberate overlap is `ui.announce.hurt` / `ui.announce.alarm`, looked up by the announce's colour token; the silent `ui.announce` row is gone · why: ui-ux.md asked for token-keyed stingers, and a shared name is the cheapest lookup · rejected: renaming the stingers, renaming the cue family to `sfx.*`.

## 7. Reconcile when the brainstorm doc lands

- Whether the brainstorm resolved a music direction (a composed theme, per-boss themes, a "no music in the Shadow Realm" rule). If a theme exists as notation, it becomes `themes.ts` data and replaces "The Squad" or joins it; the engine does not change.
- Whether any boss was given a signature sound in the brainstorm's boss designs (a Treant creak, a Pharaoh's sand). Those become parameter changes on the `boss.*` rows.
- Whether the crater was meant to hum (the `hum` field suggests yes); if the brainstorm says otherwise, `amb.crater` is one row to remove.
- Whether the dialogue was ever meant to have voice-like sounds beyond blips; this file assumes not (heroes §2.4.6).

## 8. Open questions for the orchestrator

None. No decision here changes how a family member is portrayed (Brief §2(b)); the only voices in the game are blips, and every canon string keeps its cue or gains one.
