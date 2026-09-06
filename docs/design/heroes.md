# Heroes — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** BRIEF §0–§11 (full); ATMOSPHERE_RECIPES §19, §16, §9.1–9.4, §10, §14, §15.2; SYSTEMS_INVENTORY §3, §4, §5, §6, §7, §8, §9, §10, §22, §23, §29; FAMILY_CANON §1.1, §2, §6.1–6.2, §7.1, §8, §9, §10.1–10.2, §11.4–11.5, §11.9–11.11, §12.1–12.2, §13; CONTROL_MODEL §2, §3, §5, §6, §7, §11, §12; AUDIO_INVENTORY §4–§6; DECISIONS.md (all 2026-09-06 lines); legacy HTML L587 (`WW`), L2139–2144 (`HDEFS`), L2534–2542 (`drawHeroIdle`) verified · **Depends on:** none (foundation file) · **Feeds:** enemies, bosses, cutscenes, camp, npcs, dungeons, ui-ux, audio, story-beats
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

Four kids, one moveset: the free, instant hero swap stays exactly as v27 built it, and every number in the kit ports as data. What changes is how each kid is *seen*: four distinct silhouettes instead of one shared body, a deep jewel palette (Liam sapphire, Noah fox-orange, Collette amethyst, Isabella ruby) that separates at one-eighth screen height and under a colorblind eye, and an animation personality per kid built from the canon lines the family already wrote.

## 1. What v27 does

Compact account; the teardown is the record. Cite: SYSTEMS_INVENTORY (SI), FAMILY_CANON (FC), ATMOSPHERE_RECIPES (AR), CONTROL_MODEL (CM).

### 1.1 The data (SI §3, `HDEFS` L2139–2144)

| Field | Liam (0) | Noah (1) | Collette (2) | Isabella (3) |
|---|---|---|---|---|
| Title-card role (FC §12.1, L316–319) | `Tank` | `DPS` | `Mage` | `AoE` |
| `col` / `dk` | `#4A9ED8` / `#2E78A8` | `#2DB86A` / `#1E8A4E` | `#A862C4` / `#844CA0` | `#F0C040` / `#C89E28` |
| `wc` weapon · `hair` · `cape` | `#bdc3c7` · `#8B6914` · `#2B6A94` | `#7A4018` · `#5B3A1A` · `#1E7A44` | `#E8A838` · `#6B3A2A` · `#9648B0` | `#D84830` · `#D4A03C` · `#D88030` |
| `spd` px/s · `hp` | 180 · 250 | 175 · 140 | 165 · 120 | 160 · 180 |
| `rng` px · `dmg` · `cd` s | 48 · 32 · 0.35 | 230 · 16 · 0.28 | 260 · 22 · 0.60 | 58 · 28 · 0.40 |
| `aType` | `melee` (120° cone, reach `rng+25` = 73 px) | `arrow` (480 px/s, life 1.5 s) | `magic` (220 px/s, homing 3 rad/s, life 2 s, 0.5 s slow) | `whirl` (360°, reach `rng+18` = 76 px) |
| Signature · `sigCd` | Shield Bash · 6 s | Dodge Roll · 4 s | Arcane Blink · 8 s | Ground Pound · 5 s |
| Ultimate · `ultCD` | Excalibur Strike · 25 s | Arrow Storm · 22 s | Arcane Nova · 28 s | Meteor Drop · 20 s |
| Damage-number colour (AR §14) | `#4A9ED8` | `#2DB86A` | `#A862C4` | `#D88030` (orange, so gold text survives on sand) |

Only Liam starts unlocked; the other three are rescued from cages (SI §3.1). Easy difficulty multiplies `maxHp` by 1.5 and damage taken by 0.75; Hard multiplies damage taken by 1.25 (SI §22.3).

### 1.2 Signatures, ultimates, combos (SI §5–§7)

- **Shield Bash:** 0.25 s shield-first dash, contact radius 40 px, 50 % `dmg`, 1.5 s stun, 400 knockback, i-frames for the first 0.125 s, blue afterimage trail. Net travel about 30 px (the velocity ramps from 0 to 240 px/s across the dash).
- **Dodge Roll:** 0.4 s roll at 200 px/s (80 px), fully invulnerable, no damage, green afterimage trail. The only full i-frame verb in the game.
- **Arcane Blink:** instant 120 px teleport along facing, 75 % `dmg` to everything within 40 px of arrival, 8 + 8 particles, a 0.3 s `#e84393` streak. No i-frames. Reverted if it lands in a dungeon wall.
- **Ground Pound:** impact 25 ms after press, 60 px radius, 80 % `dmg`, 1.5 s slow, 0.2 s bounce on hit enemies, `screenShake(4, 0.15)`, gold ring to r 60 over 0.15 s; the body is drawn airborne (offset −30 px, scale 0.6) for the ~67 ms.
- **Excalibur Strike:** 200 px radius, 1.5× `dmg` (2× to the overworld boss), full block (`shieldOn`) for 4 s, `screenShake(10, 0.5)`, `hitStop(0.1)`, 0.5 s blue telegraph circle then a white cross shockwave (AR §15.2).
- **Arrow Storm:** 24 arrows (40 with the capstone) 50 ms apart, each spawned 300 px above a random point in a 400 × 400 px box, falling 500 px/s, 2× `dmg` each, `screenShake(5, 0.3)`.
- **Arcane Nova:** 180 px radius, 1× `dmg` (2× to boss), stun 2.5 s (4 s Deep Freeze), slow stun+1.5 s, 200 knockback, `hitStop(0.15)`, three staggered rings (`#A862C4`/`#e84393`/`#C49BF0`) plus a collapsing black void.
- **Meteor Drop:** 160 px radius, 3× `dmg` (2× boss), 400 knockback, `screenShake(15, 0.6)` at cast and again at the 0.8 s impact with `hitStop(0.15)`; six ground cracks fade over 2 s.
- **Combo ultimates:** six pairs, damage `(dmgA + dmgB) × mult` at the pair's midpoint, both ults consumed, both must be charged, pair within 100 px, first matching pair in array order wins, `screenShake(15, 0.6)` and nothing else (CM §6). Shadow Barrage fires 16 radial projectiles instead of a radius.

### 1.3 Progression (SI §8–§10, §23)

Team-wide XP, `need = 30 + teamLv × 15`. Every level: `+5 maxHp` and heal 20 for every unlocked hero; from team level 3 every level also grants +1 skill point to all four; `recalcHeroStats` separately applies `+12 maxHp` and `+3 dmg` per level whenever gear changes (two different level rules coexist). Three level-up cards every time: Skill Point, a team buff, a hero specialty (FC §11.11). Twelve skill branches, three per hero, T1 → T2 → capstone A/B fork (FC §11.10). Legendaries one per hero (FC §11.4), mastery titles by kills (FC §11.5), sixteen skins as `col`/`dk`/`cape` overrides (FC §11.9). Crit `0.12 + crit`, ×1.8 (Headshot ×3), rolled once per swing (SI §22.1).

### 1.4 The drawing (AR §16)

All four share **one body**: 11 × 13 ellipse, r 9 head, cape quad, per-hero hair (Liam three spikes; Noah half-disc plus headband; Collette pigtails plus side buns; Isabella a larger volume with two pink `#e84393` bows), 2-px eye shift as the whole aiming read. Walk bob 3 px at `bobT += dt·10`, amplitude fading in and out at 5/s; squash 6 % at double frequency; breathing 1.5 % at 1.5 rad/s phase-offset per hero; blink 0.15 s every 4 s staggered 1.7 s per hero; footfall dust 12 %/frame. After 10 s idle the active hero plays a 4 s loop (`drawHeroIdle`, L2534–2542): Liam kicks a `#7A4018` pebble for 1 s then dusts his shield (a white line across the chest, 1–2 s); Noah adjusts his bow (a `#2D8C56` stroke, 1 s) then flicks a white spark (phase 50–70); Collette traces a `#A862C4` arc dropping `#E8A838` sparkles at 20 %/frame (phase 30–50), then drops a small violet card (50–70); Isabella looks around (phase 0–30), kicks `#7A4018` dirt at 15 %/frame (30–50), then watches an `#E8A838` bug orbit at `sin(f·3)·5, cos(f·2)·3` (50–90). There is **no world-space selection ring** (AR §15.2, CM §2.3).

### 1.5 The control feel (CM §2–§3, §12)

Switching is a bare assignment: free, instant, total, no animation, no cooldown. All four are simulated every frame; cooldowns and ult charge keep ticking on companions, who **never** spend signatures or ultimates. Companions target the nearest enemy, kite (`idealDist = rng × 0.7`, back off under 0.4×, close over 1.3×, sine strafe in the pocket) or charge (1.15× then brake), follow in a conga line at `45 + idx × 10` px, and hard-teleport when more than 400 px from the leader. Combos are legal when the partner is within 100 px, which the follow distance just satisfies.

### 1.6 Oddities that change this design (SI §29, CM §11)

| Oddity | Consequence for the redesign |
|---|---|
| **Companion fall-through `else`** (L2290): combat velocity is damped every frame, so companions move at ~40–45 % of the coded speed in combat | Porting the code "correctly" makes companions twitchy. §2.5.11 decides a tuned middle. |
| **`recalcHeroStats` reads `br.t1/t2/capChosen`** — fields that do not exist — and silently wipes every skill-tree bonus on equip, load, and NG+ | Port the intended bonuses through a recompute-from-baseline pipeline (§2.5.9). |
| **Respec refunds points but not stats** (L1720) | Same fix: respec is a baseline recompute, never a free stat gain. |
| Dead stat fields: `immune`, `critRate`, `chain`, `rootEvery`, `slowDur`, `frozenDmg`, `aoe`; `pierce` is boolean; lifesteal is melee-only; `h.stats` never saved | Each gets a defined behaviour in §2.5.9 and §2.5.10. |
| `Iron Wall` sets `shieldDur 3` when the default is 4 (a capstone that shortens the shield); `Blade Dance` removes a facing check Isabella's whirl never had; `Rampage` extends an `ultDur` Meteor Drop does not use | Three dead capstones redefined in §2.5.9. |
| Per-frame friction, hard-coded `1/60`, `setTimeout(200)` for the attack state | Resolved by the fixed-step sim; every timer in this file is sim-clock seconds. |
| Companion facing uses `idx > 0`, so Liam as a companion never turns toward his target and swings his 120° cone at nothing | Companion facing is `idx !== activeHero` in the rebuild. |
| Colour canon drift: brief says Noah orange and Isabella pink/red; code ships green and gold | Decided in §2.1. |

