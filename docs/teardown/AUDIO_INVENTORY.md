# AUDIO_INVENTORY — v27 procedural sound

Every sound in `docs/legacy/stewart-squad-v27.html` is synthesised at call time by one function, `snd(type,vol)` (L542-L577), which owns 29 hard-coded recipes built from oscillators and white-noise buffers; there are no audio files, no sample loading, and no audio assets of any kind.
Music is a separate 33-line generative engine (`startBGM9`/`tickMelody9`/`updateBGM9`, L8508-L8541) that plays a two-oscillator biome drone plus randomly-picked scale notes; there is no ambient-loop layer at all, and mute is the only audio control the player has.

**Source of truth:** `docs/legacy/stewart-squad-v27.html` (9,901 lines). Every line number below was verified with `grep -n`/`sed -n` against that file. Where the brief says "v26" the file is v27; the audio system is unchanged since v9 except for the v16-stab multiplayer SFX replication (L541, L545, L8744, L8938-L8941) and the v21 music-volume fix (MT-2) at L8517/L8520.

---

## Contents

1. [Audio bootstrap](#1-audio-bootstrap)
2. [The `snd()` dispatcher](#2-the-snd-dispatcher)
3. [UI and menu feedback](#3-ui-and-menu-feedback)
4. [Hero attacks (per hero)](#4-hero-attacks-per-hero)
5. [Signatures and ultimates](#5-signatures-and-ultimates)
6. [Combo ultimates](#6-combo-ultimates)
7. [Hits, crits, blocks and explosions](#7-hits-crits-blocks-and-explosions)
8. [Enemy sounds](#8-enemy-sounds)
9. [Boss sounds](#9-boss-sounds)
10. [Pickups: gold, heal, gear, chests](#10-pickups-gold-heal-gear-chests)
11. [Level up](#11-level-up)
12. [Quest and world events](#12-quest-and-world-events)
13. [Doors, keys, puzzles, destroyables](#13-doors-keys-puzzles-destroyables)
14. [Weather](#14-weather)
15. [Grandpa Ed's biplane](#15-grandpa-eds-biplane)
16. [Portal](#16-portal)
17. [Alien crater](#17-alien-crater)
18. [Cutscene stingers and ducking](#18-cutscene-stingers-and-ducking)
19. [Victory and game over](#19-victory-and-game-over)
20. [Music: the BGM9 engine](#20-music-the-bgm9-engine)
21. [Ambient loops](#21-ambient-loops)
22. [Multiplayer SFX replication](#22-multiplayer-sfx-replication)
23. [Call-site map: every `snd()` in the file](#23-call-site-map-every-snd-in-the-file)
24. [Volume, mix and ducking](#24-volume-mix-and-ducking)
25. [Gaps, dead code and bugs](#25-gaps-dead-code-and-bugs)
26. [Port notes](#26-port-notes)

---

## 1. Audio bootstrap

Banner `// ===== AUDIO =====` at **L538**. The whole bootstrap is three lines (L539-L541):

```js
const AC=window.AudioContext||window.webkitAudioContext;let ac=null;
function initAudio(){if(!ac)try{ac=new AC();}catch(e){}}
var _netSfxQ=[],_netSfxId=0;
```

**What exists**

| Thing | Value | Line |
|---|---|---|
| Constructor | `window.AudioContext \|\| window.webkitAudioContext` | L539 |
| Context handle | `let ac=null` — a single global, lazily created | L539 |
| Creation | `initAudio()` — creates `ac` once, swallows any throw | L540 |
| Master gain | **none for SFX.** Every `snd()` builds its own `GainNode` and connects it straight to `ac.destination` (L547). Music has its own `bgm.masterGain` (L8514), also straight to `ac.destination`. | L547 / L8514 |
| Compressor / limiter | **none.** No `DynamicsCompressorNode` anywhere in the file. | — |
| Panner / stereo | **none.** No `StereoPannerNode`, no `PannerNode`, no `ChannelMerger`. Everything is mono to `destination`; there is no positional audio. | — |
| Convolver / reverb | **none.** | — |
| `ac.resume()` | **never called.** The unlock relies purely on `initAudio()` being invoked from inside a user-gesture handler. | — |

**Where `initAudio()` is called** (all six are inside user gestures, which is what unlocks the context):

| Line | Gesture |
|---|---|
| L1045 | `mousedown` on canvas while `NET.role==='guest'` |
| L1081 | `mousedown` on canvas (main path, at the end of the handler) |
| L1082 | `touchstart` on canvas |
| L9465 | `loadSlotFromTitle(slot)` — Continue/Load button on the title screen |
| L9473 | `startGame()` guest branch |
| L9484 | `startGame()` normal branch |

**Mute and volume settings**

- The only user-facing audio control is **music mute**, bound to `M` (L938 legacy check, L961 via `keyAction('mute',kl)`; default binding `mute:['m']` in `keyBinds`, L605). The on-screen hint at L3412 reads `M: Mute`.
- `toggleMute9()` (L8540) flips `bgm.muted`, stops or restarts the BGM, and announces `Music: OFF` / `Music: ON`.
- There is **no SFX volume control, no music volume slider, and no master volume**. `bgm.sfxVol:1` is declared at L8509 and never read anywhere in the file.
- **Nothing audio-related is persisted.** `settings` (L594) holds `screenShake, hitStop, particleDensity, autoAim, showTutorial, showDmgNumbers, showMinimap, worldZoom` and is saved to `localStorage['ssq_settings']` (L596) — no audio keys. The save schema (`SAVE_VERSION=10`, L1123 onward) contains no audio fields. Mute therefore resets to `false` on every page load.

---

## 2. The `snd()` dispatcher

**Signature:** `snd(type, vol)` — `type` is a string name, `vol` an optional linear gain, default `0.25`.

```js
function snd(type,vol){
  if(!ac)return;vol=vol||0.25;
  // v16-stab: Queue important sounds for guest replication
  if(NET.role==='host'&&NET.connected&&type!=='hit'){_netSfxQ.push({s:type,v:Math.round(vol*100),id:++_netSfxId});if(_netSfxQ.length>5)_netSfxQ.shift();}
  try{
  const t=ac.currentTime,g=ac.createGain();g.connect(ac.destination);g.gain.setValueAtTime(vol,t);
```

Then 29 branches — `if(type==='sword')` at L548 followed by 28 `else if(type==='NAME'){...}`, **one recipe per source line**, L549-L576 — and the terminating `}catch(e){}}` at L577.

**How names map to recipes:** a flat `if/else if` chain of exact string comparisons. There is no table, no registry, and **no fallback branch** — an unrecognised name silently does nothing (the gain node at L547 is still created and connected, but nothing is ever attached to it, so it is inert).

**Throttling / dedupe: there is none.** `snd()` has no cooldown, no per-name last-played timestamp, no voice cap and no polyphony limit. Every call allocates fresh nodes. The only rate limiting in the whole system is the multiplayer queue cap at L545 (`if(_netSfxQ.length>5)_netSfxQ.shift()`), which only affects what a guest hears, not the host.

**Node lifetime:** sources are given explicit `start(t)`/`stop(t+d)`; the per-call `GainNode` `g` is **never disconnected**. Only `tickMelody9()` (L8526) bothers with an `onended` cleanup. Over a long session this leaks one detached-but-connected `GainNode` per sound.

**The complete list of accepted names (29):**

`sword`, `arrow`, `magic`, `whirl`, `hit`, `pickup`, `levelup`, `ult`, `boss`, `victory`, `boom`, `equip`, `revive`, `miniboss`, `portal`, `shadow_bolt`, `kidnap`, `victory_ext`, `event_start`, `achieve`, `puzzle_solve`, `door_unlock`, `rock_slide`, `chest_open`, `plate_click`, `lever_pull`, `bars_slam`, `destroy_pot`, `destroy_crate`

**Three names are called but never defined** — see [§25](#25-gaps-dead-code-and-bugs): `shield` (L2261), `heal` (L2381, L2402), `questComplete` (L695). All three are silent in v27.

**Shared envelope convention.** Every branch inherits `g.gain.setValueAtTime(vol,t)` from L547, so the "attack" is instantaneous (0 ms) for all 29 sounds. Branches then either ramp `g` linearly to 0 over the duration (single-shot sounds), or re-set `g` to a fraction of `vol` first (e.g. `vol*0.4`) and ramp from there, or build per-note child gains `g2` under `g` (the four arpeggio sounds). Nothing uses `setTargetAtTime`, and only the music melody uses `exponentialRampToValueAtTime` on gain.

---

## 3. UI and menu feedback

v27 has **no dedicated click / open / close / error sounds.** UI feedback is borrowed from gameplay recipes:

- **Hero-switch "click"** (portrait strip, mouse L1070, touch L1090, guest request L1053) → `snd('hit',0.15)`, the combat impact noise burst.
- **Menu confirm** (skill tree tier bought L5447, auto-invest L5474, quest accepted L8364/L8374, room cleared L8236/L8238, player joined L1444) → `snd('equip',0.3)`.
- **Overlay open/close** (pause, inventory, skill tree, bestiary, quest journal) → **silent**. No sound is played when any overlay opens or closes.
- **Error / invalid action** (stash full, wrong hero for a puzzle, not enough gold) → **silent**; these only call `announce()`.

The two recipes that are genuinely UI-first:

### `achieve` — confirmation ping (L567)

```js
  else if(type==='achieve'){let o=ac.createOscillator();o.type='triangle';o.frequency.setValueAtTime(700,t);o.frequency.exponentialRampToValueAtTime(1400,t+0.15);o.connect(g);g.gain.linearRampToValueAtTime(0,t+0.3);o.start(t);o.stop(t+0.35);}
```

A single triangle gliding 700 → 1400 Hz exponentially over 150 ms with a linear fade to zero at 300 ms (oscillator stops at 350 ms) — the game's generic "good thing happened" ping, used for achievements, quest progress, saves, tutorial steps, secrets and freed siblings.

### `puzzle_solve` — solved arpeggio (L568)

```js
  else if(type==='puzzle_solve'){[659,784,988,1319].forEach(function(f,i){var o=ac.createOscillator(),g2=ac.createGain();o.type='triangle';o.frequency.value=f;o.connect(g2);g2.connect(g);g2.gain.setValueAtTime(0,t+i*.08);g2.gain.linearRampToValueAtTime(vol*.7,t+i*.08+.02);g2.gain.linearRampToValueAtTime(0,t+i*.08+.15);o.start(t+i*.08);o.stop(t+i*.08+.2);});}
```

Four triangle voices at E5-G5-B5-E6 (659/784/988/1319 Hz), each on its own child gain under `g`, fired 80 ms apart with a 20 ms attack and 130 ms decay — a fast rising E-minor-ish arpeggio, total ~0.44 s.

---

## 4. Hero attacks (per hero)

Attack sounds are selected by `this.aType` in `Hero.prototype.attack` (L2334-L2337), not by hero name, so the mapping comes from `HDEFS` (L2139-L2144):

| Hero | Colour | `aType` | Sound | Volume | Line |
|---|---|---|---|---|---|
| **LIAM** (tank/leader) | `#4A9ED8` | `melee` | `sword` | `.18` | L2334 |
| **NOAH** (ranger/archer) | `#2DB86A` | `arrow` | `arrow` | `.12` | L2335 |
| **COLLETTE** (mage/enchanter) | `#A862C4` | `magic` | `magic` | `.12` | L2336 |
| **ISABELLA** (berserker/guardian) | `#F0C040` | `whirl` | `whirl` | `.10` | L2337 |

A fifth attack sound layers on top: the Shockwave skill proc on Isabella's whirl adds `snd('boom',0.2)` at L2339.

### `sword` — Liam's melee slash (L548)

```js
  if(type==='sword'){let d=0.13,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++){a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2)*0.7;}let s=ac.createBufferSource();s.buffer=b;let f=ac.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(2200,t);f.frequency.linearRampToValueAtTime(600,t+d);f.Q.value=1.2;s.connect(f);f.connect(g);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d);}
```

130 ms of white noise with a squared decay envelope scaled to 0.7, run through a bandpass whose centre sweeps 2200 → 600 Hz (Q 1.2) while the master gain fades linearly to zero — a bright metallic slash that darkens as it decays.

### `arrow` — Noah's bow shot (L549)

```js
  else if(type==='arrow'){let o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(180,t+0.1);o.connect(g);g.gain.linearRampToValueAtTime(0,t+0.1);o.start(t);o.stop(t+0.12);}
```

One sine gliding 900 → 180 Hz exponentially over 100 ms with a linear gain fade to zero at 100 ms (stops at 120 ms) — a short descending twang/whoosh.

### `magic` — Collette's spell (L550)

```js
  else if(type==='magic'){let o=ac.createOscillator(),o2=ac.createOscillator();o.type='sine';o2.type='triangle';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.2);o2.frequency.setValueAtTime(900,t);o2.frequency.exponentialRampToValueAtTime(400,t+0.2);o.connect(g);o2.connect(g);g.gain.linearRampToValueAtTime(0,t+0.25);o.start(t);o.stop(t+0.25);o2.start(t);o2.stop(t+0.25);}
```

Two voices in contrary motion — a sine rising 600 → 1200 Hz and a triangle falling 900 → 400 Hz, both exponential over 200 ms — under a single gain that fades to zero at 250 ms; the crossing sweeps give the shimmer.

### `whirl` — Isabella's whirlwind (L551)

```js
  else if(type==='whirl'){let o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(150,t);o.frequency.linearRampToValueAtTime(300,t+0.15);o.frequency.linearRampToValueAtTime(100,t+0.3);o.connect(g);g.gain.setValueAtTime(vol*0.4,t);g.gain.linearRampToValueAtTime(0,t+0.3);o.start(t);o.stop(t+0.35);}
```

A sawtooth swept linearly 150 → 300 Hz (150 ms) then back down to 100 Hz (300 ms), gain re-set to `vol*0.4` and ramped to zero over 300 ms, oscillator stopped at 350 ms — a spinning doppler whoosh.

---

## 5. Signatures and ultimates

Both the signature (`E`) and the ultimate (`R`/`0`) share one recipe, at two volumes:

| Trigger | Call | Line |
|---|---|---|
| `actSig(h)` — **any** hero signature | `snd('ult',0.25)` | L2667 |
| `actUlt(h)` — **any** hero ultimate | `snd('ult',.4)` | L2668 |

Per-hero signature names come from `HDEFS`: Liam **Shield Bash** (`bash`, cd 6), Noah **Dodge Roll** (`roll`, cd 4), Collette **Arcane Blink** (`blink`, cd 8), Isabella **Ground Pound** (`pound`, cd 5). Only two of the four get a second, landing-specific sound; Liam and Noah's rolls are otherwise silent after the shared `ult` cue:

| Hero | Signature | Extra sound | Line |
|---|---|---|---|
| LIAM | Shield Bash — end of dash | `snd('boom',0.2)` | L2222 |
| NOAH | Dodge Roll | *(none)* | — |
| COLLETTE | Arcane Blink — arrival | `snd('magic',0.2)` | L2230 |
| ISABELLA | Ground Pound — landing | `snd('boom',0.3)` | L2232 |

Ultimates likewise share `ult` at cast; only Isabella's Meteor Drop adds impact sounds — `snd('boom',.5)` at cast (L2694) and a second `snd('boom',0.5)` when the meteor VFX lands 0.8 s later (L2558, in `updateUltVfx`). Liam's Excalibur, Noah's Storm and Collette's Nova have no impact sound.

Liam's legendary Aegis auto-shield calls `snd('shield',0.2)` (L2261) — **an undefined name, so it is silent.**

### `ult` — power surge (L555)

```js
  else if(type==='ult'){let o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(800,t+0.3);o.connect(g);g.gain.setValueAtTime(vol*0.6,t);g.gain.linearRampToValueAtTime(0,t+0.5);o.start(t);o.stop(t+0.5);}
```

A square wave swept 200 → 800 Hz exponentially over 300 ms, gain re-set to `vol*0.6` and ramped to zero across 500 ms — a rising, buzzy charge-up.

---

## 6. Combo ultimates

`COMBO_ULTS` (L2628-L2635) defines six pairings — Shield Crash [0,1], Arcane Fortress [0,2], Earthquake Slam [0,3], Shadow Barrage [1,2], Blade Storm [1,3], Supernova [2,3]. **All six share one sound**, fired in `trigComboUlt()`:

```js
  screenShake(15,0.6);snd('boom',0.5);
```

That is L2646 — a single `boom` at 0.5, identical for every pair, with a 15-intensity / 0.6 s screen shake. There is no per-combo audio differentiation in v27.

---

## 7. Hits, crits, blocks and explosions

- **Every damage impact** funnels through `hitFx(x,y,col)` at L1742, which plays `snd('hit',.12)`. This is the single most-fired sound in the game — heroes hitting enemies, enemies hitting heroes, spawner damage, and the guest-side death-VFX replication (L8812, L8815).
- **Crits have no separate sound.** `dmgN()` (L1732, crit branch at L1740) draws extra white/gold particles for a crit but plays nothing; crit audio is the same `hit`.
- **Blocks have no sound.** The Crystal Colossus's ranged-reflect shield (L7634) and the Magma Titan's directional armour plates (L7636) both only call `dmgN()`; the plate *breaking* plays `snd('destroy_pot',0.3)`.
- **Explosions** use `boom` at volumes from 0.2 (bomber death) to 0.6 (meteor cutscene, boss drop-in).

### `hit` — impact tick (L552)

```js
  else if(type==='hit'){let d=0.07,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,3);let s=ac.createBufferSource();s.buffer=b;s.connect(g);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d+.01);}
```

70 ms of unfiltered white noise with a cubic (`^3`) decay envelope and a linear gain fade to zero — a dry, very short click/thud with no tonal content.

### `boom` — explosion (L558)

```js
  else if(type==='boom'){let d=0.35,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,1.5);let s=ac.createBufferSource();s.buffer=b;let f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(80,t+d);s.connect(f);f.connect(g);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d+.01);}
```

350 ms of white noise with a 1.5-power decay, pushed through a lowpass sweeping 500 → 80 Hz over the same 350 ms while the gain fades to zero — a muffled, darkening blast. Used for slams, deaths, thunder, crashes and every combo ult.

---

## 8. Enemy sounds

Regular enemies (`ETYPES`, L2733 onward) have **no idle, alert, attack or death sounds of their own** — an enemy is only heard through `hitFx()` (`hit`) when it is damaged. Three exceptions:

| Event | Sound | Line |
|---|---|---|
| Bomber enemy explodes on death (`this._explode`) | `snd('boom',0.2)` | L2802 |
| Enemy spawner camp destroyed | `snd('boom',.35)` | L2856 |
| Mini-boss activates within 500 px | `snd('miniboss',0.4)` | L2891 |

**Mini-bosses** (`MiniBoss`, L2873-L2880: Crystal Golem, Sandworm, Swamp Hydra, Frost Wyrm):

| Event | Sound | Line |
|---|---|---|
| Any mini-boss spawns/activates | `miniboss` @ 0.4 | L2891 |
| Sandworm bursts out of the ground | `boom` @ 0.4 | L2911 |
| Frost Wyrm ice-breath cone (5 projectiles) | `magic` @ 0.2 | L2933 |
| Crystal Golem ground slam | `boom` @ 0.3 | L2939 |
| Any mini-boss dies (drops rarity-2 gear) | `boom` @ .5 | L2979 |

### `miniboss` — mini-boss growl (L561)

```js
  else if(type==='miniboss'){let o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(80,t);o.frequency.linearRampToValueAtTime(50,t+0.8);o.connect(g);g.gain.setValueAtTime(vol*0.5,t);g.gain.linearRampToValueAtTime(0,t+1);o.start(t);o.stop(t+1.1);}
```

A sawtooth falling linearly 80 → 50 Hz over 800 ms at `vol*0.5`, ramping to silence at 1.0 s (stops at 1.1 s) — a short sub-bass menace cue, the higher/shorter sibling of `boss`.

---

## 9. Boss sounds

### 9.1 Boss intro and phase cues

| Event | Sound | Line |
|---|---|---|
| Boss intro card slides in, 800 ms after the letterbox bars | `boss` @ .5 | L5337 |
| Dungeon boss cinematic starts (`spawnDungeonBoss`) | `boss` @ .5 | L7391 |
| Dungeon boss drop-in impact (`introPhase==='drop'` → `'impact'`) | `boom` @ .6 | L7394 |
| Dungeon boss enrages / changes phase | `boss` @ .4 | L7396 |
| Endless-mode boss wave announced | `boss` @ 0.5 | L6664 |

### `boss` — dread growl (L556)

```js
  else if(type==='boss'){let o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(55,t);o.frequency.linearRampToValueAtTime(35,t+1);o.connect(g);g.gain.setValueAtTime(vol*0.5,t);g.gain.linearRampToValueAtTime(0,t+1.2);o.start(t);o.stop(t+1.3);}
```

A sawtooth sliding linearly 55 → 35 Hz over one second at `vol*0.5`, fading to zero at 1.2 s (stops at 1.3 s) — a sub-bass dread swell under the intro card.

### 9.2 Per-boss mechanics

**Ancient Treant** — *The Hollow Grove*, forest (L7430-L7503):

| Mechanic | Sound | Line |
|---|---|---|
| Root Grab (arena effect, stun + DoT) | `magic` @ 0.2 | L7449 |
| Branch Sweep (cone) | `boom` @ 0.3 | L7479 |
| Melee hit | `hit` @ 0.2 | L7497 |
| Planted-form melee hit | `hit` @ 0.2 | L7499 |

**Pharaoh Wraith** — *The Buried Tomb*, desert (L7504-L7589):

| Mechanic | Sound | Line |
|---|---|---|
| Teleport (with telegraph ring) | `portal` @ 0.3 | L7542 |
| Projectile spray | `magic` @ 0.2 | L7548 |
| Second-phase spray | `magic` @ 0.2 | L7583 |
| Melee hit | `hit` @ 0.2 | L7588 |

**Crystal Colossus** — *The Crystal Depths*, cave (L7590-L7598): shockwave special `boom` @ 0.4 (L7590). Its ranged-reflect shield is silent (L7634).

**Hydra Matriarch** — *The Sunken Temple*, swamp (L7599-L7605): multi-head bite `hit` @ 0.2 (L7605). The "The Hydra splits!" phase change is silent.

**Frost Lich** — *The Ice Citadel*, frozen (L7606-L7614): "Frozen solid!" freeze `magic` @ 0.3 (L7606). Blizzard is silent.

**Magma Titan** — *The Volcanic Rift*, volcanic (L7615-L7625): magma slam `boom` @ 0.4 (L7618); armour plate shattered `destroy_pot` @ 0.3 (L7636). "TITAN ENRAGES!" is silent apart from the generic phase `boss` @ .4.

**Generic dungeon-boss lines:** melee hit `hit` @ .2 (L7626); death `boom` @ 0.5 **and** `victory` @ 0.5 on the same line (L7638).

**Citadel Warden** — Shadow Citadel floor 3 (L7400-L7428):

| Mechanic | Sound | Line |
|---|---|---|
| Charge attack ends | `boom` @ 0.3 | L7409 |
| Phase 2+ blink + 8-way bolt burst | `portal` @ 0.3 | L7417 |
| Melee hit | `hit` @ 0.2 | L7419 |
| Phase 2 "shifts to shadow magic" / Phase 3 "VOID FORM UNLEASHED" | *silent* | L7402-L7403 |

**Goblin King** — v26 3-phase Kid Snatch rework (L3113-L3232):

| Mechanic | Sound | Line |
|---|---|---|
| Phase 3 snatch roar + shockwave ("YOUR LITTLE FRIENDS ARE MINE!") | `boom` @ 0.5 | L3144 |
| Ground slam (all phases) | `boom` @ 0.5 | L3178 |
| Phase 2 spinning AoE ("The King spins!") | `whirl` @ 0.3 | L3197 |
| Phase 3 thrown barrels/rocks | `magic` @ 0.2 | L3207 |
| Death | `boom` @ 0.5 | L3228 |
| "GOBLIN KING DEFEATED!" | `victory` @ 0.5 | L3230 |
| 1.5 s snatch wind-up | *silent* (screen shake only, L3140) | L3140 |

**Shadow Queen** — final boss (L5528-L5712):

| Mechanic | Sound | Line |
|---|---|---|
| Phase 3 begins ("KIDNAP PHASE — Protect your siblings!") | `kidnap` @ 0.4 | L5550 |
| Kidnap succeeds — hero banished | `boom` @ 0.5 | L5562 |
| Dark-bolt barrage (6 bolts, every 3 s / 1.5 s in P4) | `shadow_bolt` @ 0.2 | L5578 |
| Kidnap begins on a sibling | `kidnap` @ 0.4 | L5623 |
| Death — NG+ unlocked | `victory_ext` @ 0.5 | L5657 |
| Phase 2 clones, Phase 4 desperation, shadow pools, dark rings | *silent* | L5549, L5551 |

### `shadow_bolt` — Shadow Queen bolt (L563)

```js
  else if(type==='shadow_bolt'){let o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(80,t+0.15);o.connect(g);g.gain.setValueAtTime(vol*0.3,t);g.gain.linearRampToValueAtTime(0,t+0.2);o.start(t);o.stop(t+0.22);}
```

A square dropping 400 → 80 Hz exponentially in 150 ms at `vol*0.3`, gone by 200 ms — a short dark zap.

### `kidnap` — abduction alarm (L564)

```js
  else if(type==='kidnap'){let o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(300,t);o.frequency.linearRampToValueAtTime(600,t+0.3);o.frequency.linearRampToValueAtTime(300,t+0.6);o.connect(g);g.gain.setValueAtTime(vol*0.4,t);g.gain.linearRampToValueAtTime(0,t+0.8);o.start(t);o.stop(t+0.9);}
```

A sawtooth siren sweeping 300 → 600 → 300 Hz linearly over 600 ms at `vol*0.4`, tail fading to 800 ms (stops at 900 ms) — a rising-falling alarm wail.

### 9.3 `BOSS_BLOCKS` — the reusable mechanic library (L5063-L5324)

Only four of the eight blocks make any sound. Each is fired inside the block itself, so **every boss that composes a block inherits its sound automatically**.

| Block | Sound | Where in the block | Line |
|---|---|---|---|
| `radialBlast` (1.5 s charge → outward push) | `magic` @ 0.3 | on cast, with `screenShake(6,0.3)` | L5080 |
| `cocoonPhase` / `updateCocoon` | `boom` @ 0.4 | **only** when the cocoon shatters ("VULNERABLE!"), with `screenShake(12,0.5)` | L5099 |
| `tether` (beam + DoT + breakable anchor) | *silent* | — | L5106-L5158 |
| `chargeAttack` | `whirl` @ 0.2 | on the telegraph line appearing | L5171 |
| `updateCharge` | `boom` @ 0.3 | on charge end or wall hit, with `screenShake(6,0.2)` | L5186 |
| `containment` (traps one hero in a field) | *silent* | — | L5199-L5250 |
| `kidSnatchCage` — capture | *silent* | the cage closing has no sound of its own | L5230-L5254 |
| `freeOneHero` (cage) | `achieve` @ 0.3 | one sibling freed | L5264 |
| `freeAllCaged` (cage) | `victory` @ 0.3 | "ALL HEROES FREE!" | L5274 |

The cocoon *cracking* between add waves (L5096, `announce('The cocoon cracks!')`) is silent; only the final shatter sounds.

---

## 10. Pickups: gold, heal, gear, chests

**There is no gold pickup entity and therefore no gold sound.** Gold is added directly to the `gold` variable at kill/claim/sell sites; the audible cue is whatever else fires there (`pickup` for a bounty claim or a sale, `boom` for the kill).

| Pickup | Sound | Line |
|---|---|---|
| Health loot orb collected (`Loot.prototype.update`) | `pickup` @ .2 | L1767 |
| Bounty reward claimed | `pickup` @ 0.3 | L1714 |
| Merchant purchase | `pickup` @ 0.3 | L1716 |
| Gear sold from the stash | `pickup` @ 0.3 | L1993 |
| Secret discovered in the overworld | `pickup` @ 0.4 | L9312 |
| v27 gear drop picked up into the stash | `equip` @ .4 | L2017 |
| Legacy `EQ_LIST` equipment picked up | `equip` @ .4 | L2022 |
| Gear equipped from the inventory | `equip` @ 0.4 | L1974 |
| Dungeon key found in a chest | `equip` @ .4 | L7321, L7343 |
| Caged sibling rescued (hero unlocked) | `equip` @ .5 | L2865 |
| Parachute supply crate lands | `equip` @ 0.15 | L5992 |
| Parachute supply crate collected | `equip` @ 0.3 | L6001 |
| Chest opened | `chest_open` @ .4 | L7320, L7342 |
| Bonus chest spawned by an ability-room solve | `chest_open` @ .3 | L7316 |
| Downed hero revived by a teammate | `revive` @ 0.35 | L2197 |

**Gear rarity does not change the sound.** `RARITY_NAMES` colours the announce text (L2018) but every rarity — common through legendary — plays the same `snd('equip',.4)`.

### `pickup` — collect blip (L553)

```js
  else if(type==='pickup'){let o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(500,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.12);o.connect(g);g.gain.linearRampToValueAtTime(0,t+0.18);o.start(t);o.stop(t+0.2);}
```

A sine gliding 500 → 1200 Hz exponentially over 120 ms with a linear gain fade to zero at 180 ms — the classic rising collect chirp.

### `equip` — acquisition chime (L559)

```js
  else if(type==='equip'){let o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.2);o.connect(g);g.gain.linearRampToValueAtTime(0,t+0.28);o.start(t);o.stop(t+0.3);}
```

A sine gliding 400 → 1200 Hz exponentially over 200 ms, fading to zero at 280 ms — a longer, brighter cousin of `pickup`; doubles as the game's generic "confirm" sound in menus.

### `chest_open` — treasure reveal (L571)

```js
  else if(type==='chest_open'){let o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(1200,t+.3);o.connect(g);g.gain.setValueAtTime(vol*.5,t);g.gain.linearRampToValueAtTime(0,t+.5);o.start(t);o.stop(t+.5);}
```

A sine gliding 600 → 1200 Hz over 300 ms at `vol*0.5`, fading across 500 ms — a slow, wide-open rise.

### `revive` — revival motif (L560)

```js
  else if(type==='revive'){[392,523,659,784].forEach(function(f,i){let o=ac.createOscillator(),g2=ac.createGain();o.type='sine';o.frequency.value=f;o.connect(g2);g2.connect(g);g2.gain.setValueAtTime(0,t+i*.12);g2.gain.linearRampToValueAtTime(vol*.6,t+i*.12+.03);g2.gain.linearRampToValueAtTime(0,t+i*.12+.25);o.start(t+i*.12);o.stop(t+i*.12+.3);});}
```

Four sine voices at G4-C5-E5-G5 (392/523/659/784 Hz) on child gains, staggered 120 ms apart at `vol*0.6` with a 30 ms attack and 220 ms decay — a soft ascending C-major arpeggio, ~0.66 s total.

---

## 11. Level up

One call: `showLvl=true;paused=true;snd('levelup',.4);` at **L2710**, inside `addXP()` when the party crosses a level threshold and the level-up card overlay opens. Individual skill-point spends use `equip`/`achieve` (L5447, L5474, L5484).

### `levelup` — ascending fanfare (L554)

```js
  else if(type==='levelup'){[523,659,784,1047].forEach(function(f,i){let o=ac.createOscillator(),g2=ac.createGain();o.type='triangle';o.frequency.value=f;o.connect(g2);g2.connect(g);g2.gain.setValueAtTime(0,t+i*.1);g2.gain.linearRampToValueAtTime(vol,t+i*.1+.02);g2.gain.linearRampToValueAtTime(0,t+i*.1+.2);o.start(t+i*.1);o.stop(t+i*.1+.25);});}
```

Four triangle voices at C5-E5-G5-C6 (523/659/784/1047 Hz), each with its own child gain, fired 100 ms apart with a 20 ms attack and 180 ms decay — a C-major arpeggio spanning ~0.55 s.

---

## 12. Quest and world events

| Event | Sound | Line |
|---|---|---|
| Quest item collected | `achieve` @ 0.2 | L734 |
| Quest objective reaches target ("Ready to turn in!") | `achieve` @ 0.2 | L744 |
| Quest turned in to an NPC | `achieve` @ 0.3 | L8360 (host-side variant L8370) |
| Quest accepted from an NPC | `equip` @ 0.3 | L8364 (host-side variant L8374) |
| Quest waypoint visited | `achieve` @ 0.2 | L8469 |
| Bounty completed | `questComplete` @ 0.3 — **undefined name, silent** | L695 |
| Achievement unlocked (`trigAch`) | `achieve` @ 0.3 | L918 |
| Tutorial step completed | `achieve` @ 0.15 | L4326 |
| Flavor marker discovered | `achieve` @ 0.15 | L5799 |
| World event starts (caravan / bloodmoon / treasure / spring / earthquake) | `event_start` @ 0.3 | L5746 |
| Endless Mode begins | `event_start` @ 0.4 | L6637 |
| Manual save to a slot | `achieve` @ 0.2 | L1166 (dungeon), L1168 (normal) |

### `event_start` — two-tone alert (L566)

```js
  else if(type==='event_start'){let o=ac.createOscillator();o.type='triangle';o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(880,t+0.1);o.frequency.exponentialRampToValueAtTime(440,t+0.2);o.frequency.exponentialRampToValueAtTime(880,t+0.3);o.connect(g);g.gain.linearRampToValueAtTime(0,t+0.4);o.start(t);o.stop(t+0.45);}
```

One triangle alternating 440 → 880 → 440 → 880 Hz in four 100 ms exponential steps, fading to zero at 400 ms — an A4/A5 klaxon that reads as "something is happening".

---

## 13. Doors, keys, puzzles, destroyables

| Event | Sound | Line(s) |
|---|---|---|
| Enter an uncleared combat room — bars drop | `bars_slam` @ .3 | L7262 |
| All levers set → bars retract | `door_unlock` @ .4 | L7327, L7348 |
| Locked door opened with a key (interact) | `door_unlock` @ .4 | L7338, L7357 |
| Locked door consumed a key on a N/E/W transition | `door_unlock` @ .4 | L8246, L8248, L8249 |
| Lever pulled | `lever_pull` @ .3 | L7323, L7345 |
| Hero steps onto a pressure plate | `plate_click` @ .3 | L8161, L8210 |
| Plate released (timer expired / block removed / hero stepped off) | `plate_click` @ .2 | L8162, L8163, L8212 |
| Puzzle solved → doors unlock | `puzzle_solve` @ .4 | L8164 |
| LIAM smashes a cracked wall | `boom` @ .4 | L7329, L7349 |
| NOAH shoots a target switch | `puzzle_solve` @ .4 | L7330, L7350 |
| COLLETTE channels a seal (ticks 1-2) | `magic` @ .2 | L7331, L7351 |
| COLLETTE completes the seal (tick 3) | `puzzle_solve` @ .4 | L7331, L7351 |
| ISABELLA breaks a gear lock | `puzzle_solve` @ .4 | L7332, L7352 |
| Pushable block finishes sliding | `rock_slide` @ .25 | L8206 |
| Pushable block destroyed | `destroy_crate` @ .3 | L8197 |
| Dungeon decor destroyed (melee) | `dc.sd \|\| 'destroy_pot'` @ .25 | L8154 |
| Dungeon decor destroyed (projectile) | `dc2.sd \|\| 'destroy_pot'` @ .25 | L8158 |
| Combat / ability room cleared | `equip` @ 0.3 | L8236, L8238 |
| DEV_MODE force room clear | `puzzle_solve` @ .4 | L988 |

**The only data-driven sound lookup in the game** is `DNG_DECOR[].sd` (L845) — the destroyable decor table, whose `sd` field names the sound to play on destruction:

```js
var DNG_DECOR=[{nm:'pot',hp:1,w:16,h:18,col:'#8B6914',dk:'#6a5010',lc:.5,lh:.2,pc:'#8B6914',pn:6,sd:'destroy_pot'},{nm:'crate',hp:2,w:18,h:18,col:'#a0803a',dk:'#806028',lc:.6,lh:.15,pc:'#c4a060',pn:8,sd:'destroy_crate'},{nm:'bones',hp:1,w:16,h:12,col:'#d0c8b0',dk:'#a09880',lc:.3,lh:0,pc:'#e0d8c0',pn:4,sd:'destroy_pot'}];
```

`sd` is copied onto each spawned decor object at L7253 and read at L8154/L8158. Pot and bones share `destroy_pot`; crate uses `destroy_crate`. There are **no overworld destroyables** — pots and crates exist only inside dungeons.

### `door_unlock` — stone rumble (L569)

```js
  else if(type==='door_unlock'){let d=.4,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2)*.5;let s=ac.createBufferSource();s.buffer=b;let f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(80,t+d);s.connect(f);f.connect(g);g.gain.setValueAtTime(vol*.6,t);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d);}
```

400 ms of half-amplitude white noise with a squared decay, through a lowpass sweeping 500 → 80 Hz, at `vol*0.6` — a heavy grinding stone-door rumble.

### `bars_slam` — portcullis (L574)

```js
  else if(type==='bars_slam'){let d=.2,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,1.5)*.6;let s=ac.createBufferSource();s.buffer=b;s.connect(g);g.gain.setValueAtTime(vol*.5,t);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d);}
```

200 ms of 0.6-amplitude noise with a 1.5-power decay, **unfiltered**, at `vol*0.5` — a raw, bright slam.

### `lever_pull` — mechanical clunk (L573)

```js
  else if(type==='lever_pull'){let o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(200,t);o.frequency.linearRampToValueAtTime(100,t+.08);o.connect(g);g.gain.setValueAtTime(vol*.35,t);g.gain.linearRampToValueAtTime(0,t+.1);o.start(t);o.stop(t+.12);}
```

A square falling linearly 200 → 100 Hz over 80 ms at `vol*0.35`, gone by 100 ms — a stubby mechanism thunk.

### `plate_click` — pressure plate (L572)

```js
  else if(type==='plate_click'){let o=ac.createOscillator();o.type='sine';o.frequency.value=300;o.connect(g);g.gain.setValueAtTime(vol*.4,t);g.gain.linearRampToValueAtTime(0,t+.05);o.start(t);o.stop(t+.06);}
```

A steady 300 Hz sine at `vol*0.4` held for 50 ms with a linear fade — a flat, unpitched-sounding click. Pressing is `.3`, releasing is `.2`, which is the only pressed/released differentiation.

### `rock_slide` — gravel (L570)

```js
  else if(type==='rock_slide'){let d=.3,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,1.5)*.4;let s=ac.createBufferSource();s.buffer=b;let f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=300;f.Q.value=1;s.connect(f);f.connect(g);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d);}
```

300 ms of 0.4-amplitude noise with a 1.5-power decay through a **fixed** 300 Hz bandpass (Q 1, no sweep) — a mid-band gravel rush.

### `destroy_pot` — ceramic shatter (L575)

```js
  else if(type==='destroy_pot'){let d=.1,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,3)*.5;let s=ac.createBufferSource();s.buffer=b;let f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=2000;s.connect(f);f.connect(g);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d+.01);}
```

100 ms of 0.5-amplitude noise with a cubic decay through a 2000 Hz highpass — a bright, short crack. Also doubles as the Magma Titan's armour-plate break (L7636).

### `destroy_crate` — wood splinter (L576)

```js
  else if(type==='destroy_crate'){let d=.15,b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2)*.45;let s=ac.createBufferSource();s.buffer=b;let f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;s.connect(f);f.connect(g);g.gain.linearRampToValueAtTime(0,t+d);s.start(t);s.stop(t+d+.01);}
```

150 ms of 0.45-amplitude noise with a squared decay through a 1200 Hz bandpass — woodier and slightly longer than the pot.

---

## 14. Weather

The weather system is `WEATHER_TYPES=['clear','rain','storm','snow','sand','fog']` with per-biome pools in `WEATHER_BIOME` (L1605), driven by `updWeather(dt)` (L1609-L1660).

**Rain, snow, sand and fog are completely silent.** There is no rain loop, no wind bed, no filtered-noise layer — weather is purely a particle and colour-grade effect.

The **only** weather sound in the game is the thunder strike:

```js
  if(weather.strikeWarn<=0&&weather.strikeWarn>-1&&weather.strikeWarn!==-1){weather.strikeWarn=-1;weather.flashT=0.12;snd('boom',0.3);
```

L1615 — when a storm's 1.0 s strike warning expires, the screen flashes for 0.12 s, `boom` plays at 0.3, and enemies near `(strikeX, strikeY)` take damage. Strikes recur every `rnd(10,18)` seconds while `weather.type==='storm'` (L1614). Note this is the **generic explosion recipe**, not a thunder-specific one — no rumble tail, no distance attenuation, no pre-flash rumble.

---

## 15. Grandpa Ed's biplane

Ed's biplane (`biplane` state at L635, `_launchBiplane()` at L5945, update at ~L6040-L6145) has **no engine sound**. `biplane.sputterT` / `biplane.sputterOn` (L5959) drive a *visual* engine sputter only. The flyover itself is silent, and there is no doppler, no pan, no altitude filtering.

| Event | Sound | Line |
|---|---|---|
| Flyover launch (`_launchBiplane`, emits `biplaneFlyover`) | *silent* | L5945-L5964 |
| Engine / sputter | *silent* (visual smoke only) | L5959, L6140 |
| Parachute crate deploys | *silent* | L5975-L5990 |
| Parachute crate touches the ground | `equip` @ 0.15 | L5992 |
| Parachute crate collected (heal or gold) | `equip` @ 0.3 | L6001 |
| **Crash landing** — "Grandpa Ed has crash-landed!" | `boom` @ 0.3 | L6138 |

The crash also fires `shk.i=8; shk.t=0.5` directly (L6136) and emits the `biplaneCrash` event.

---

## 16. Portal

| Event | Sound | Line |
|---|---|---|
| Shadow Realm portal appears ("A mysterious portal appears...") | `portal` @ 0.4 | L5716 |
| Hero enters the portal ("Welcome to the Shadow Realm...") | `portal` @ 0.4 | L9325 |
| Isabella's co-op teleport-to-ally ability | `portal` @ 0.4 | L1403 |
| Pharaoh Wraith teleport | `portal` @ 0.3 | L7542 |
| Citadel Warden blink | `portal` @ 0.3 | L7417 |

The portal has **no idle hum** — it is drawn and animated (`portalT`) but only sounds on open and on entry.

### `portal` — dimensional whoosh (L562)

```js
  else if(type==='portal'){let o=ac.createOscillator(),o2=ac.createOscillator();o.type='sine';o2.type='triangle';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(600,t+0.6);o2.frequency.setValueAtTime(300,t);o2.frequency.exponentialRampToValueAtTime(100,t+0.8);o.connect(g);o2.connect(g);g.gain.setValueAtTime(vol*0.5,t);g.gain.linearRampToValueAtTime(0,t+0.8);o.start(t);o.stop(t+0.8);o2.start(t);o2.stop(t+0.9);}
```

Two contrary-motion voices — a sine rising 200 → 600 Hz over 600 ms and a triangle falling 300 → 100 Hz over 800 ms — under a gain re-set to `vol*0.5` and ramped to zero at 800 ms (triangle stops at 900 ms); the widening interval reads as a tear opening.

---

## 17. Alien crater

`ALIEN_CRATER` is declared at **L724**:

```js
var ALIEN_CRATER={x:0,y:0,radius:100,innerRadius:50,discovered:false,particles:[],hum:null,lastFlavor:0};
```

**The `hum` field is dead code.** `ALIEN_CRATER.hum` is declared as `null` here and is **never assigned to and never read anywhere else in the 9,901 lines** (verified: `grep -n "\.hum" ` returns only L724). There is no crater hum in v27; the intent is visible in the field name but the oscillator was never wired up.

What the crater *does* have is entirely visual: 18 drifting particles in `#A862C4`/`#1abc9c`/`#aaa` (`updateCraterParticles`, L5801), an 8-second pulse ring (L5804-L5807), a proximity vignette (`drawCraterVignette`, L5943) and rotating `CRATER_FLAVOR` announce lines every 30 s (L5942). Discovery (L5934) and the "Something pulses faintly to the northeast..." wave-4 hint (L9265) are both silent.

The crater's only audio moment is the meteor cutscene impact that creates it — see §18.

---

## 18. Cutscene stingers and ducking

The cutscene system is at L4362-L4403; the seven-scene meteor cutscene is built at L4745-L5010.

**One stinger, two ducks.** That is the entire cutscene audio design:

| Scene | Audio | Line |
|---|---|---|
| Scene 1 "First-person calm" — `onStart` | **Duck out:** `bgm.masterGain.gain.linearRampToValueAtTime(0, ac.currentTime+2.5)` | L4751 |
| Scenes 2-5 | *silent* | — |
| Scene 6 "Impact" — `onStart` | `snd('boom',0.6)` + `screenShake(22,0.9)` + `cineShake.intensity=40` + white flash | L4917 |
| Scene 7 "The Return" — `onStart` | **Duck back in:** `bgm.masterGain.gain.linearRampToValueAtTime(bgm.vol, ac.currentTime+2.0)` | L4998 |

The duck is a straight ramp on the music master gain; SFX are **not** ducked (they have no shared bus to duck). Boss intro cards do not duck the music either — they just play `boss` @ .5 on top (L5337).

---

## 19. Victory and game over

| Event | Sound | Line |
|---|---|---|
| Dungeon cleared overlay | `victory` @ 0.5 | L7128 |
| Dungeon boss defeated | `boom` @ 0.5 then `victory` @ 0.5, same line | L7638 |
| Goblin King defeated | `victory` @ 0.5 | L3230 |
| All caged siblings freed | `victory` @ 0.3 | L5274 |
| **Shadow Queen defeated** (final victory, NG+ unlocked) | `victory_ext` @ 0.5 | L5657 |
| `showVictoryHTML()` (L4262) | *silent* — the overlay itself plays nothing | L4262 |
| **Game over** (`showGameOverHTML()`, L4211; party wipe L2410, L8803) | *silent* — only `stopBGM9()` is called | L4211, L2410 |
| Dungeon failed / retreat (`showDungeonFail()`, L7130) | *silent* | L7130 |
| Return to title (L1358) | *silent* — `stopBGM9()` only | L1358 |

**There is no game-over sting in v27.** Death is signalled by the music fading out over 0.5 s and nothing else.

### `victory` — fanfare (L557)

```js
  else if(type==='victory'){[523,587,659,784,880,1047].forEach(function(f,i){let o=ac.createOscillator(),g2=ac.createGain();o.type='triangle';o.frequency.value=f;o.connect(g2);g2.connect(g);g2.gain.setValueAtTime(0,t+i*.15);g2.gain.linearRampToValueAtTime(vol*.7,t+i*.15+.03);g2.gain.linearRampToValueAtTime(0,t+i*.15+.3);o.start(t+i*.15);o.stop(t+i*.15+.35);});}
```

Six triangle voices at C5-D5-E5-G5-A5-C6 (523/587/659/784/880/1047 Hz) on child gains, staggered 150 ms apart at `vol*0.7` with a 30 ms attack and 270 ms decay — a rising C-major-pentatonic run, ~1.1 s.

### `victory_ext` — extended finale (L565)

```js
  else if(type==='victory_ext'){[523,587,659,784,880,1047,1175,1319].forEach(function(f,i){let o=ac.createOscillator(),g2=ac.createGain();o.type='triangle';o.frequency.value=f;o.connect(g2);g2.connect(g);g2.gain.setValueAtTime(0,t+i*.18);g2.gain.linearRampToValueAtTime(vol*.8,t+i*.18+.04);g2.gain.linearRampToValueAtTime(0,t+i*.18+.4);o.start(t+i*.18);o.stop(t+i*.18+.45);});}
```

Eight triangle voices at C5-D5-E5-G5-A5-C6-D6-E6 (523/587/659/784/880/1047/1175/1319 Hz), staggered 180 ms apart at `vol*0.8` with a 40 ms attack and 360 ms decay — the same pentatonic run extended two notes higher and slowed, ~1.7 s. Reserved for the Shadow Queen kill.

---

## 20. Music: the BGM9 engine

Banner `// v9: Procedural Music Engine` at **L8508**. State object at **L8509**:

```js
var bgm={playing:false,biome:null,masterGain:null,layers:[],melodyT:0,muted:false,vol:0.15,sfxVol:1};
```

`vol:0.15` is the music master; `sfxVol:1` is declared and never used.

### 20.1 The biome tables (L8510-L8512)

```js
var BGM_SCALES={forest:[261.6,293.7,329.6,392,440],cave:[220,246.9,261.6,329.6,392],desert:[293.7,311.1,370,392,440],swamp:[233.1,261.6,311.1,349.2,392],frozen:[329.6,370,392,440,493.9],volcanic:[196,233.1,261.6,311.1,370]};
var BGM_WAVES={forest:'sine',cave:'triangle',desert:'sine',swamp:'triangle',frozen:'sine',volcanic:'triangle'}; // v21 fix: volcanic sawtooth→triangle (MT-2)
var BGM_BPM={forest:72,cave:56,desert:68,swamp:48,frozen:60,volcanic:88};
```

| Biome | Scale (Hz) | Note names | Wave | BPM |
|---|---|---|---|---|
| `forest` | 261.6, 293.7, 329.6, 392, 440 | C4 D4 E4 G4 A4 — C major pentatonic | `sine` | 72 |
| `cave` | 220, 246.9, 261.6, 329.6, 392 | A3 B3 C4 E4 G4 — A minor with an added 2nd | `triangle` | 56 |
| `desert` | 293.7, 311.1, 370, 392, 440 | D4 E♭4 F#4 G4 A4 — a "Hijaz"-flavoured set | `sine` | 68 |
| `swamp` | 233.1, 261.6, 311.1, 349.2, 392 | B♭3 C4 E♭4 F4 G4 — the C minor pentatonic, voiced from B♭ | `triangle` | 48 |
| `frozen` | 329.6, 370, 392, 440, 493.9 | E4 F#4 G4 A4 B4 — first five degrees of E natural minor | `sine` | 60 |
| `volcanic` | 196, 233.1, 261.6, 311.1, 370 | G3 B♭3 C4 E♭4 F#4 — G minor with a raised 7th (harmonic-minor colour) | `triangle` | 88 |

The v21 comment on L8511 records that volcanic's wave was changed `sawtooth → triangle` under fix **MT-2**.

The **root** used by `startBGM9` is the first entry of each row: C4 (forest), A3 (cave), D4 (desert), B♭3 (swamp), E4 (frozen), G3 (volcanic). The drone sits an octave below that root and the "fifth" layer at 0.75× the root.

**Only five of these six biomes exist in the overworld** (`getBiome`, L1550, returns forest/cave/desert/swamp/frozen — L1548 `BIOME_NAMES`). `volcanic` is reachable only as a dungeon.

### 20.2 `startBGM9(biome)` — L8513-L8522

```js
function startBGM9(biome){if(!ac||bgm.muted)return;stopBGM9();
try{bgm.masterGain=ac.createGain();bgm.masterGain.gain.value=bgm.vol;bgm.masterGain.connect(ac.destination);
var root=BGM_SCALES[biome]?BGM_SCALES[biome][0]:261.6;var wave=BGM_WAVES[biome]||'sine';
// Drone
var droneGain=0.15; // v21 fix: reduced from 0.3 (MT-2)
var osc1=ac.createOscillator(),g1=ac.createGain();osc1.type=wave;osc1.frequency.value=root/2;g1.gain.setValueAtTime(0,ac.currentTime);g1.gain.linearRampToValueAtTime(droneGain,ac.currentTime+2);osc1.connect(g1);g1.connect(bgm.masterGain);osc1.start();bgm.layers.push({osc:osc1,gain:g1,type:'drone'});
// Fifth
var fifthGain=0.08; // v21 fix: reduced from 0.15 (MT-2)
var osc2=ac.createOscillator(),g2=ac.createGain();osc2.type='sine';osc2.frequency.value=root*0.75;g2.gain.setValueAtTime(0,ac.currentTime);g2.gain.linearRampToValueAtTime(fifthGain,ac.currentTime+2);osc2.connect(g2);g2.connect(bgm.masterGain);osc2.start();bgm.layers.push({osc:osc2,gain:g2,type:'fifth'});
bgm.playing=true;bgm.biome=biome;bgm.melodyT=rnd(1,3);}catch(e){}}
```

- Bails if there is no context or music is muted; always calls `stopBGM9()` first so layers never stack.
- Builds `bgm.masterGain` at `bgm.vol` (0.15) → `ac.destination`. **This is the only master gain in the game, and SFX do not pass through it.**
- `root` is the **first note of the biome scale**, defaulting to 261.6 Hz (C4) for any biome not in the table.
- **Drone layer:** biome wave at `root/2` (one octave down), gain ramped 0 → **0.15** over 2 s (v21 fix MT-2 reduced this from 0.3).
- **Fifth layer:** `sine` at `root*0.75` — note this is a *fourth below* (0.75×), not a fifth above, despite the variable name — gain ramped 0 → **0.08** over 2 s (v21 fix MT-2 reduced this from 0.15).
- Both oscillators run **continuously and forever**; they are never retriggered. `bgm.melodyT` is seeded to `rnd(1,3)` so the first melody note lands 1-3 s in.

### 20.3 `tickMelody9()` — the generative melody, L8524-L8526

```js
function tickMelody9(){if(!ac||!bgm.playing||bgm.muted||!bgm.masterGain)return;
var scale=BGM_SCALES[bgm.biome]||BGM_SCALES.forest;var freq=pick(scale)*(Math.random()>0.5?1:2);
try{var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=freq;var melVol=bgm.biome==='desert'?0.06:0.1;g.gain.setValueAtTime(melVol,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+1.2);o.connect(g);g.connect(bgm.masterGain);o.start();o.stop(ac.currentTime+1.3);o.onended=function(){try{o.disconnect();g.disconnect();}catch(e){}};}catch(e){}}
```

**Note selection:** `pick(scale)` — a uniform random draw from the five-note biome scale — then a coin flip (`Math.random()>0.5`) doubles the frequency, so every note is in one of two octaves. There is no melodic contour, no memory of the previous note, no bar structure, no chord progression and no key change. If `bgm.biome` is not in `BGM_SCALES`, it falls back to the forest scale.

**Instrument:** a bare `sine` oscillator, no filter, no detune.

**Envelope:** instantaneous attack to `melVol`, then an exponential decay to 0.001 over **1.2 s**; the oscillator stops at 1.3 s. `onended` disconnects both nodes — the only cleanup in the audio system.

**Per-biome mix:** `melVol = bgm.biome==='desert' ? 0.06 : 0.1` — the desert melody is 40 % quieter. That is the only per-biome mix difference.

### 20.4 `updateBGM9(dt)` — rhythm and biome tracking, L8527-L8533

```js
function updateBGM9(dt){if(!ac||bgm.muted)return;
// Check biome change
var h0=heroes[activeHero]||heroes[0];if(!h0||h0.dead)return;
var curBiome=inDungeon?currentDungeon:getBiome(h0.x,h0.y);
if(curBiome&&curBiome!==bgm.biome){transitionBGM9(curBiome);}
if(!bgm.playing)return;
bgm.melodyT-=dt;if(bgm.melodyT<=0){tickMelody9();var bpm=BGM_BPM[bgm.biome]||72;bgm.melodyT=rnd(60/bpm*0.5,60/bpm*3);}}
```

Called once per frame from the main loop (**L9235**) and from the guest loop (**L8799**).

**Rhythm:** after each note, the next one is scheduled at `bgm.melodyT = rnd(60/bpm*0.5, 60/bpm*3)` — a uniform random interval between **half a beat and three beats** at the biome BPM. At forest's 72 BPM that is 0.42 s to 2.5 s; at swamp's 48 BPM, 0.63 s to 3.75 s. Notes are therefore free-time, not quantised — there are no bars and no downbeats.

**Biome tracking:** `curBiome = inDungeon ? currentDungeon : getBiome(h0.x, h0.y)`. Any change triggers `transitionBGM9`. The whole function early-returns while the lead hero is dead, so music freezes (drone continues, melody stops) during a party wipe.

### 20.5 `transitionBGM9(newBiome)` — the crossfade, L8534-L8539

```js
function transitionBGM9(newBiome){
if(!ac)return;
// Fade out current
for(var i=0;i<bgm.layers.length;i++){try{var t=ac.currentTime;bgm.layers[i].gain.gain.setValueAtTime(bgm.layers[i].gain.gain.value,t);bgm.layers[i].gain.gain.linearRampToValueAtTime(0,t+2);bgm.layers[i].osc.stop(t+2.1);}catch(e){}}
bgm.layers=[];bgm.playing=false;
setTimeout(function(){startBGM9(newBiome);},500);}
```

Not a true crossfade: the old layers ramp to zero over **2 s** and stop at 2.1 s, but the new biome's `startBGM9` is scheduled by `setTimeout` at **500 ms**, whose own drone/fifth ramp up over 2 s. So there is a 1.5 s window where old and new drones overlap, old descending and new ascending — a fade-through, not a gap.

### 20.6 `stopBGM9()` — L8523

```js
function stopBGM9(){for(var i=0;i<bgm.layers.length;i++){try{bgm.layers[i].gain.gain.setValueAtTime(bgm.layers[i].gain.gain.value,ac.currentTime);bgm.layers[i].gain.gain.linearRampToValueAtTime(0,ac.currentTime+0.5);bgm.layers[i].osc.stop(ac.currentTime+0.6);}catch(e){}}bgm.layers=[];bgm.playing=false;}
```

Ramps every layer to zero over 0.5 s, stops the oscillators at 0.6 s, clears the layer list. **Called from:** `startBGM9` (L8513, self-clearing), `returnToTitle()` (L1358), party wipe → game over (L2410, L8803), and `toggleMute9()` when muting (L8540).

### 20.7 `toggleMute9()` — L8540

```js
function toggleMute9(){bgm.muted=!bgm.muted;if(bgm.muted)stopBGM9();else{var h0=heroes[activeHero]||heroes[0];if(h0)startBGM9(inDungeon?currentDungeon:getBiome(h0.x,h0.y));}announce(bgm.muted?'Music: OFF':'Music: ON','#6B8EC8',1.5);}
```

Toggles `bgm.muted`; on unmute it restarts the BGM for the hero's *current* biome (or the current dungeon). Announces `Music: OFF` / `Music: ON` in `#6B8EC8`. Not persisted.

### 20.8 When music starts and what changes it

| Trigger | Behaviour | Line |
|---|---|---|
| `startGame()` normal | `setTimeout(startBGM9('forest'), 1000)` | L9485 |
| `startGame()` guest | `setTimeout(startBGM9('forest'), 1500)` | L9482 |
| `loadSlotFromTitle(slot)` | `setTimeout(startBGM9(getBiome(hero)), 500)` | L9468 |
| Hero walks into a new biome | `transitionBGM9(newBiome)` | L8531 |
| Enter a dungeon | `currentDungeon` becomes the biome key, `updateBGM9` sees the change and transitions | L8530-L8531, L7074 |
| Leave a dungeon | same mechanism, back to `getBiome()` | L8530 |
| Mute key `M` | stop / restart | L938, L961 |
| Party wipe / game over | `stopBGM9()` | L2410, L8803 |
| Return to title | `stopBGM9()` | L1358 |
| Meteor cutscene | master gain ducked to 0 then back to `bgm.vol` | L4751, L4998 |

**Music does *not* change for:** bosses (no boss track, no intensity layer), night (the day/night cycle at L855 has no audio hook), weather, combat, low health, or the Shadow Realm. **The Shadow Citadel has no music of its own** — `currentDungeon` there is `citadel_f1`/`citadel_f2`/`citadel_f3` (L7073), none of which exists in `BGM_SCALES`/`BGM_WAVES`/`BGM_BPM`, so the Citadel silently falls back to root C4, `sine` wave, the forest scale for melody, and 72 BPM.

---

## 21. Ambient loops

**There are none.** This is the single biggest hole in the v27 audio design, and it is worth stating plainly rather than inferring one:

- No wind, crickets, water, fire, cave drip, storm bed or dungeon room tone.
- No per-biome ambience, no per-weather ambience, no per-dungeon ambience, no night ambience.
- No looping `AudioBufferSourceNode` anywhere (`loop=true` appears nowhere in the file).
- Everything the code calls "ambient" is visual: `// === Ambient particles (always, biome-colored) ===` (L6838), leaf particles (L7706), poison drip (L7849), ambient darkness fill (L8010).

The only continuous sound in the game is the BGM drone + fifth pair (L8518, L8521), which does double duty as ambience.

---

## 22. Multiplayer SFX replication

The host mirrors sounds to guests through the snapshot stream, so the port must keep sound emission on the simulation side, not buried in the renderer.

| Step | Code | Line |
|---|---|---|
| Queue on the host | `if(NET.role==='host'&&NET.connected&&type!=='hit'){_netSfxQ.push({s:type,v:Math.round(vol*100),id:++_netSfxId});if(_netSfxQ.length>5)_netSfxQ.shift();}` | L545 |
| Pack into the snapshot | `sfx:_netSfxQ.length?_netSfxQ.slice():null,` | L8744 |
| Replay on the guest | `if(snap.sfx[_si].id>NET._lastSfxId){NET._lastSfxId=snap.sfx[_si].id;snd(snap.sfx[_si].s,snap.sfx[_si].v/100);}` | L8941 |

Notes: `hit` is deliberately excluded (too frequent); the queue is capped at 5 entries per snapshot and is **never cleared** after being sent, so a guest re-receives the same five ids and relies on the monotonic `id` comparison to dedupe. Volume is transported as an integer percentage. Guests additionally synthesise `snd('hit',.12)` locally on enemy-death VFX (L8812, L8815) to make up for the exclusion.

---

## 23. Call-site map: every `snd()` in the file

151 call sites (152 `snd(` matches minus the definition at L542). Sorted by line.

| Line | Call | Game event that triggers it |
|---|---|---|
| L695 | `snd('questComplete',0.3)` | Bounty completed in `updateBountyProgress()` — **undefined name, silent** |
| L734 | `snd('achieve',0.2)` | Quest item collected (`updateQuestItems`) |
| L744 | `snd('achieve',0.2)` | Quest objective hits its target — "Ready to turn in!" |
| L918 | `snd('achieve',0.3)` | Achievement unlocked (`trigAch`) |
| L988 | `snd('puzzle_solve',.4)` | DEV_MODE backtick cheat force-clears the dungeon room |
| L1053 | `snd('hit',0.15)` | Guest clicks a portrait to request a hero |
| L1070 | `snd('hit',0.15)` | Mouse click on the portrait strip switches the active hero |
| L1090 | `snd('hit',0.15)` | Touch on the portrait strip switches the active hero |
| L1166 | `snd('achieve',0.2)` | Manual save while in a dungeon (overworld snapshot saved) |
| L1168 | `snd('achieve',0.2)` | Manual save to a slot (`saveGame`) |
| L1388 | `snd('achieve',0.4)` | Liam net co-op ability: Rally Cry (+30 % dmg to allies in 200 px) |
| L1392 | `snd('arrow',0.3)` | Noah net co-op ability: mark the nearest enemy |
| L1396 | `snd('magic',0.3)` | Collette net co-op ability: Arcane Link to the nearest ally |
| L1403 | `snd('portal',0.4)` | Isabella net co-op ability: teleport to an ally, shield both |
| L1444 | `snd('equip',0.3)` | Host: another player joins the session |
| L1615 | `snd('boom',0.3)` | Storm lightning strike lands (thunder) |
| L1714 | `snd('pickup',0.3)` | Bounty reward claimed |
| L1716 | `snd('pickup',0.3)` | Item bought from the wandering merchant |
| L1742 | `snd('hit',.12)` | `hitFx()` — **every** damage impact in the game |
| L1767 | `snd('pickup',.2)` | Health loot orb collected |
| L1974 | `snd('equip',0.4)` | Gear equipped from the inventory |
| L1993 | `snd('pickup',0.3)` | Gear sold from the stash |
| L2017 | `snd('equip',.4)` | v27 gear drop picked up into the stash (any rarity) |
| L2022 | `snd('equip',.4)` | Legacy `EQ_LIST` equipment picked up |
| L2197 | `snd('revive',0.35)` | Downed hero revived by a teammate standing over them |
| L2222 | `snd('boom',0.2)` | LIAM Shield Bash — dash ends |
| L2230 | `snd('magic',0.2)` | COLLETTE Arcane Blink — arrival |
| L2232 | `snd('boom',0.3)` | ISABELLA Ground Pound — landing |
| L2261 | `snd('shield',0.2)` | Liam's legendary Aegis auto-shield — **undefined name, silent** |
| L2334 | `snd('sword',.18)` | LIAM melee attack (`aType==='melee'`) |
| L2335 | `snd('arrow',.12)` | NOAH bow shot (`aType==='arrow'`) |
| L2336 | `snd('magic',.12)` | COLLETTE spell cast (`aType==='magic'`) |
| L2337 | `snd('whirl',.1)` | ISABELLA whirlwind attack (`aType==='whirl'`) |
| L2339 | `snd('boom',0.2)` | Shockwave skill proc on a whirl attack |
| L2381 | `snd('heal',0.3)` | Phoenix Feather auto-revive — **undefined name, silent** |
| L2402 | `snd('heal',0.2)` | Auto-switch to another hero after the active one dies — **undefined name, silent** |
| L2558 | `snd('boom',0.5)` | ISABELLA Meteor ult — VFX impact 0.8 s after cast |
| L2646 | `snd('boom',0.5)` | Combo ultimate fired (`trigComboUlt`) — all six pairs |
| L2667 | `snd('ult',0.25)` | Any hero signature activated (`actSig`) |
| L2668 | `snd('ult',.4)` | Any hero ultimate activated (`actUlt`) |
| L2694 | `snd('boom',.5)` | ISABELLA "METEOR DROP!" ult cast |
| L2710 | `snd('levelup',.4)` | Party levels up; level-up card overlay opens |
| L2802 | `snd('boom',0.2)` | Bomber enemy explodes on death |
| L2856 | `snd('boom',.35)` | Enemy spawner camp destroyed |
| L2865 | `snd('equip',.5)` | Caged sibling rescued in the overworld (hero unlocked) |
| L2891 | `snd('miniboss',0.4)` | Mini-boss activates within 500 px (Golem/Sandworm/Hydra/Frost Wyrm) |
| L2911 | `snd('boom',0.4)` | Sandworm bursts out of the ground |
| L2933 | `snd('magic',0.2)` | Frost Wyrm ice-breath cone (5 projectiles) |
| L2939 | `snd('boom',0.3)` | Crystal Golem ground slam |
| L2979 | `snd('boom',.5)` | Mini-boss dies (drops rarity-2 gear) |
| L3144 | `snd('boom',0.5)` | Goblin King P3 snatch roar — "YOUR LITTLE FRIENDS ARE MINE!" |
| L3178 | `snd('boom',0.5)` | Goblin King ground slam (all phases) |
| L3197 | `snd('whirl',0.3)` | Goblin King P2 spinning AoE — "The King spins!" |
| L3207 | `snd('magic',0.2)` | Goblin King P3 thrown barrels/rocks |
| L3228 | `snd('boom',0.5)` | Goblin King dies |
| L3230 | `snd('victory',0.5)` | "GOBLIN KING DEFEATED!" |
| L4326 | `snd('achieve',0.15)` | Tutorial step completed |
| L4917 | `snd('boom',0.6)` | Meteor cutscene Scene 6 — impact |
| L5080 | `snd('magic',0.3)` | `BOSS_BLOCKS.radialBlast` cast (telegraph begins) |
| L5099 | `snd('boom',0.4)` | `BOSS_BLOCKS.updateCocoon` — cocoon shatters, boss vulnerable |
| L5171 | `snd('whirl',0.2)` | `BOSS_BLOCKS.chargeAttack` — telegraph line appears |
| L5186 | `snd('boom',0.3)` | `BOSS_BLOCKS.updateCharge` — charge ends or hits a wall |
| L5264 | `snd('achieve',0.3)` | `BOSS_BLOCKS.freeOneHero` — one caged sibling freed |
| L5274 | `snd('victory',0.3)` | `BOSS_BLOCKS.freeAllCaged` — "ALL HEROES FREE!" |
| L5337 | `snd('boss',.5)` | Boss intro card slides in, 800 ms after the letterbox bars |
| L5447 | `snd('equip',0.3)` | Skill-tree tier purchased |
| L5474 | `snd('equip',0.3)` | Skill-tree auto-invest spends points |
| L5484 | `snd('achieve',0.3)` | Skill-tree capstone chosen |
| L5550 | `snd('kidnap',0.4)` | Shadow Queen enters Phase 3 — "KIDNAP PHASE" |
| L5562 | `snd('boom',0.5)` | Shadow Queen banishes a hero (kidnap succeeded) |
| L5578 | `snd('shadow_bolt',0.2)` | Shadow Queen dark-bolt barrage (6 bolts) |
| L5623 | `snd('kidnap',0.4)` | Shadow Queen begins kidnapping a sibling |
| L5657 | `snd('victory_ext',0.5)` | Shadow Queen defeated — NG+ unlocked |
| L5716 | `snd('portal',0.4)` | Shadow Realm portal appears |
| L5746 | `snd('event_start',0.3)` | World event starts (caravan/bloodmoon/treasure/spring/earthquake) |
| L5799 | `snd('achieve',0.15)` | Flavor marker discovered |
| L5992 | `snd('equip',0.15)` | Parachute supply crate touches the ground |
| L6001 | `snd('equip',0.3)` | Parachute supply crate collected (heal or gold) |
| L6138 | `snd('boom',0.3)` | Grandpa Ed's biplane crash-lands |
| L6637 | `snd('event_start',0.4)` | Endless Mode begins |
| L6664 | `snd('boss',0.5)` | Endless Mode boss wave announced |
| L7128 | `snd('victory',0.5)` | Dungeon cleared overlay |
| L7262 | `snd('bars_slam',.3)` | Entering an uncleared combat room — bars drop |
| L7316 | `snd('chest_open',.3)` | `ab9Complete()` — ability-room solve spawns a bonus chest |
| L7320 | `snd('chest_open',.4)` | Chest opened via SPACE (`heroInteract`) |
| L7321 | `snd('equip',.4)` | Chest contained a Dungeon Key |
| L7323 | `snd('lever_pull',.3)` | Lever pulled |
| L7327 | `snd('door_unlock',.4)` | All levers set — "Bars retracted!" |
| L7329 | `snd('boom',.4)` | LIAM smashes a cracked wall |
| L7330 | `snd('puzzle_solve',.4)` | NOAH hits a target switch |
| L7331 | `snd('puzzle_solve',.4)` | COLLETTE completes a seal (3rd channel tick) |
| L7331 | `snd('magic',.2)` | COLLETTE channels a seal (ticks 1 and 2) |
| L7332 | `snd('puzzle_solve',.4)` | ISABELLA breaks a gear lock |
| L7338 | `snd('door_unlock',.4)` | Locked door opened with a key |
| L7342 | `snd('chest_open',.4)` | Chest opened — guest-side `heroInteractAs()` duplicate |
| L7343 | `snd('equip',.4)` | Dungeon Key found — guest-side duplicate |
| L7345 | `snd('lever_pull',.3)` | Lever pulled — guest-side duplicate |
| L7348 | `snd('door_unlock',.4)` | Bars retracted — guest-side duplicate |
| L7349 | `snd('boom',.4)` | LIAM cracked wall — guest-side duplicate |
| L7350 | `snd('puzzle_solve',.4)` | NOAH target switch — guest-side duplicate |
| L7351 | `snd('puzzle_solve',.4)` | COLLETTE seal complete — guest-side duplicate |
| L7351 | `snd('magic',.2)` | COLLETTE seal channel tick — guest-side duplicate |
| L7352 | `snd('puzzle_solve',.4)` | ISABELLA gear lock — guest-side duplicate |
| L7357 | `snd('door_unlock',.4)` | Locked door opened with a key — guest-side duplicate |
| L7391 | `snd('boss',.5)` | Dungeon boss cinematic begins (`spawnDungeonBoss`) |
| L7394 | `snd('boom',.6)` | Dungeon boss drop-in impact |
| L7396 | `snd('boss',.4)` | Dungeon boss enrages / changes phase |
| L7409 | `snd('boom',0.3)` | Citadel Warden charge attack ends |
| L7417 | `snd('portal',0.3)` | Citadel Warden P2+ blink + 8-way bolt burst |
| L7419 | `snd('hit',0.2)` | Citadel Warden melee hit |
| L7449 | `snd('magic',0.2)` | Ancient Treant "Root Grab!" |
| L7479 | `snd('boom',0.3)` | Ancient Treant "Branch Sweep!" |
| L7497 | `snd('hit',0.2)` | Ancient Treant melee hit |
| L7499 | `snd('hit',0.2)` | Ancient Treant planted-form melee hit |
| L7542 | `snd('portal',0.3)` | Pharaoh Wraith teleport |
| L7548 | `snd('magic',0.2)` | Pharaoh Wraith projectile spray |
| L7583 | `snd('magic',0.2)` | Pharaoh Wraith second-phase spray |
| L7588 | `snd('hit',0.2)` | Pharaoh Wraith melee hit |
| L7590 | `snd('boom',0.4)` | Crystal Colossus shockwave special |
| L7605 | `snd('hit',0.2)` | Hydra Matriarch multi-head bite |
| L7606 | `snd('magic',0.3)` | Frost Lich freeze — "Frozen solid!" |
| L7618 | `snd('boom',0.4)` | Magma Titan magma slam |
| L7626 | `snd('hit',.2)` | Dungeon boss generic melee hit (all non-swamp bosses) |
| L7636 | `snd('destroy_pot',0.3)` | Magma Titan armour plate shattered |
| L7638 | `snd('boom',0.5)` | Dungeon boss dies |
| L7638 | `snd('victory',0.5)` | "<Boss> DEFEATED!" on the same line as the death boom |
| L8154 | `snd(dc.sd||'destroy_pot',.25)` | Dungeon decor destroyed by a melee hero (pot/crate/bones) |
| L8158 | `snd(dc2.sd||'destroy_pot',.25)` | Dungeon decor destroyed by a projectile |
| L8161 | `snd('plate_click',.3)` | Hero steps onto a pressure plate (volcanic timed variant) |
| L8162 | `snd('plate_click',.2)` | Timed pressure plate expires |
| L8163 | `snd('plate_click',.2)` | Block removed from a pressure plate |
| L8164 | `snd('puzzle_solve',.4)` | Dungeon puzzle solved — doors unlock |
| L8197 | `snd('destroy_crate',.3)` | Pushable block destroyed by a melee/whirl hero |
| L8206 | `snd('rock_slide',.25)` | Pushable block finishes sliding into place |
| L8210 | `snd('plate_click',.3)` | Block pushed onto a plate |
| L8212 | `snd('plate_click',.2)` | Block pushed off a plate — "Plate deactivated!" |
| L8236 | `snd('equip',0.3)` | Combat room cleared |
| L8238 | `snd('equip',0.3)` | Ability room combat cleared |
| L8246 | `snd('door_unlock',.4)` | North locked door consumed a key on transition |
| L8248 | `snd('door_unlock',.4)` | East locked door consumed a key on transition |
| L8249 | `snd('door_unlock',.4)` | West locked door consumed a key on transition |
| L8360 | `snd('achieve',0.3)` | Quest turned in to an NPC (`npcQuestInteract`) |
| L8364 | `snd('equip',0.3)` | Quest accepted from an NPC |
| L8370 | `snd('achieve',0.3)` | Quest turned in — host-side `npcQuestInteractAs()` duplicate |
| L8374 | `snd('equip',0.3)` | Quest accepted — host-side duplicate |
| L8469 | `snd('achieve',0.2)` | Quest waypoint visited |
| L8812 | `snd('hit',.12)` | Guest-side: overworld enemy death VFX |
| L8815 | `snd('hit',.12)` | Guest-side: dungeon enemy death VFX |
| L8941 | `snd(snap.sfx[i].s, v/100)` | Guest replays the host's queued SFX from the net snapshot |
| L9312 | `snd('pickup',0.4)` | Secret discovered in the overworld |
| L9325 | `snd('portal',0.4)` | Hero steps into the Shadow Realm portal |

**Distribution by sound** (151 call sites): `boom` 28, `equip` 15, `achieve` 13, `hit` 12, `magic` 12, `puzzle_solve` 8, `door_unlock` 7, `pickup` 5, `plate_click` 5, `portal` 5, `boss` 4, `victory` 4, `chest_open` 3, `whirl` 3, `arrow` 2, destroy_pot / destroy_crate (via DNG_DECOR.sd) 2, `event_start` 2, `heal` 2, `kidnap` 2, `lever_pull` 2, `ult` 2, (net replay dispatcher) 1, `bars_slam` 1, `destroy_crate` 1, `destroy_pot` 1, `levelup` 1, `miniboss` 1, `questComplete` 1, `revive` 1, `rock_slide` 1, `shadow_bolt` 1, `shield` 1, `sword` 1, `victory_ext` 1.

`shield`, `heal` and `questComplete` in that list are the three silent, undefined names.

---

## 24. Volume, mix and ducking

There is no bus structure: every SFX gain connects directly to `ac.destination`, so "mix" means nothing more than the `vol` argument at each call site, optionally scaled again inside the recipe.

**Observed volume bands, by category:**

| Category | Typical `vol` | Notes |
|---|---|---|
| Hero auto-attacks | 0.10 – 0.18 | Deliberately the quietest band — they fire several times a second. `whirl` .1 < `arrow`/`magic` .12 < `sword` .18 |
| Generic impact (`hitFx`) | 0.12 | Fires on every hit from every source |
| UI clicks / hero switch | 0.15 | `hit` @ 0.15 |
| Tutorial / flavor / secret pings | 0.15 – 0.2 | |
| Ability landings, enemy specials | 0.2 – 0.3 | |
| Menu confirms, quest events, pickups | 0.2 – 0.4 | |
| Signature / ultimate | 0.25 / 0.4 | |
| Doors, chests, puzzle solves | 0.25 – 0.4 | |
| Boss specials, deaths, combo ults | 0.4 – 0.5 | |
| Boss intro, dungeon-boss drop, cutscene impact | 0.5 – 0.6 | Loudest sounds in the game |
| Music master (`bgm.vol`) | **0.15** | Drone 0.15 and fifth 0.08 *under* that, so effective 0.0225 / 0.012 |
| Melody note | 0.1 (0.06 in desert) | Also under `bgm.vol` |

Several recipes then scale `vol` again internally — `whirl` ×0.4, `ult` ×0.6, `boss` ×0.5, `miniboss` ×0.5, `victory` ×0.7, `victory_ext` ×0.8, `revive` ×0.6, `portal` ×0.5, `shadow_bolt` ×0.3, `kidnap` ×0.4, `puzzle_solve` ×0.7, `door_unlock` ×0.6, `chest_open` ×0.5, `plate_click` ×0.4, `lever_pull` ×0.35, `bars_slam` ×0.5 — so the effective loudness of a call is `vol × recipeScale`.

**Ducking:** exactly one duck exists, and only on music — the meteor cutscene ramps `bgm.masterGain` to 0 over 2.5 s (L4751) and back to `bgm.vol` over 2.0 s (L4998). Nothing ducks SFX; there is no sidechain, no priority system, and no voice stealing. Simultaneous sounds simply sum at the destination, which is why the loudest moments (boss death = `boom` 0.5 + `victory` 0.5 on one line, L7638) can clip.

---

## 25. Gaps, dead code and bugs

Things the port must know about, stated plainly rather than quietly fixed:

1. **Three undefined sound names.** `shield` (L2261), `heal` (L2381, L2402) and `questComplete` (L695) reach `snd()` but match no branch, so Liam's Aegis proc, Phoenix-Feather revive, forced hero switch on death, and bounty completion are **all silent** in v27. These are almost certainly intended sounds that were never written.
2. **`ALIEN_CRATER.hum` is dead.** Declared `null` at L724, never assigned, never read. There is no crater hum.
3. **`bgm.sfxVol` is dead.** Declared `1` at L8509, never read. There is no SFX volume path.
4. **No ambience at all** — see §21.
5. **The Shadow Citadel has no music entry** — `citadel_f1/f2/f3` are absent from all three BGM tables, so all three floors play the default C4 sine drone and forest melody (§20.8).
6. **`GainNode` leak.** The per-call gain at L547 is never disconnected. One inert node accumulates per `snd()` call, and the four calls that match no branch leave a gain node behind with nothing ever attached to it.
7. **No `ac.resume()`.** Unlock depends entirely on `initAudio()` running inside a gesture handler; if a browser suspends the context later (tab backgrounding on some mobile browsers) nothing resumes it.
8. **The net SFX queue is never drained** (L545/L8744) — it is sliced into every snapshot and only trimmed at length 5; dedupe relies on the monotonic `id`.
9. **The "fifth" is a fourth.** `osc2.frequency.value = root*0.75` (L8521) is a perfect fourth *below* the root, not a fifth above. The interval works musically (it is the fifth of the octave-down drone at `root/2`), but the variable name is misleading.
10. **No crit, block, parry, dodge, footstep, door-close, menu-open or death sound.** Combat texture is `hit` and `boom` and nothing else.
11. **Nothing is spatialised.** A boss slam 2,000 px off-screen is exactly as loud as one under the camera.

---

## 26. Port notes

Twenty-four of the twenty-nine recipes map 1:1 onto Web Audio nodes with no scheduler at all — they are one or two `OscillatorNode`s or a pre-baked noise `AudioBuffer`, an optional `BiquadFilterNode`, and a `GainNode` with two or three ramp calls, so the port is a direct transcription into a typed recipe table (`{ name, build(ctx, when, vol): void }`) rather than a rewrite; the five arpeggio sounds (`levelup`, `victory`, `victory_ext`, `revive`, `puzzle_solve`) already schedule their notes at absolute `currentTime + i*step` offsets and need only the same treatment, and the one thing every recipe should gain in the new engine is the bus it never had — a master gain with a `DynamicsCompressorNode` limiter, an SFX sub-bus and a music sub-bus, so that the boss-death double-hit stops clipping and so a real duck (music under cutscenes, dialogue and boss intros) becomes a one-line ramp instead of a special case. The music engine is the only part that genuinely needs a scheduler: v27's free-time `rnd(60/bpm*0.5, 60/bpm*3)` note spacing driven off frame `dt` should become a lookahead scheduler on `ac.currentTime` (25 ms tick, 100 ms horizon) with a real bar/beat grid so biome crossfades, boss and night layers, and a Citadel track can be added without the per-frame drift, and the biome tables (`BGM_SCALES`/`BGM_WAVES`/`BGM_BPM`) port verbatim as content data. The noise buffers should be generated once at boot and cached rather than rebuilt per call (v27 allocates a fresh `AudioBuffer` for every `hit`, and `hit` fires on every impact in the game), sounds should be emitted as simulation *events* rather than direct calls — the existing `events` bus at L599 and the multiplayer `_netSfxQ` at L545 already show why: the fixed-step sim must own emission so replays and guests stay deterministic — and every recipe gains a `PannerNode` or `StereoPannerNode` fed by world position plus a per-name throttle (min-interval + voice cap), neither of which v27 has. Proposed layout under `src/engine/audio/`: `AudioEngine.ts` (context lifecycle, unlock, resume, master/SFX/music buses, limiter, per-name throttle, master/SFX/music volumes persisted into the settings schema), `recipes/` (one small module per family — `noise.ts`, `sweeps.ts`, `arpeggios.ts` — plus `index.ts` exporting the typed `SoundName` union of all 29 legacy names and the three that v27 left undefined), `music/MusicDirector.ts` + `music/scheduler.ts` (drone/fifth layers, generative melody, biome crossfade, boss/night layers), `ambience/AmbienceBeds.ts` (the layer v27 never had — per-biome, per-weather and per-dungeon filtered-noise beds, which is where rain, wind, crickets, cave drip and storm belong), and `sfx/eventBindings.ts` (the single table mapping sim events to sound names and volumes, seeded directly from §23 so no call site has to be rediscovered).

---

*Written by the archaeologist agent for Phase 0. Every line number verified against `docs/legacy/stewart-squad-v27.html` on 2026-09-06.*
