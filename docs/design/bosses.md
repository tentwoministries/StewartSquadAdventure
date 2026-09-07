# Bosses — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** BRIEF §0–§11 in full (§4.5, §5.3, §5.4, §7.4 twice); ATMOSPHERE_RECIPES §19, §13, §9.4, §10, §15.3–15.5, §6.2; SYSTEMS_INVENTORY Part 1 §16, §17 (all eight blocks incl. §17.8), §18, §19, §20, §21, §22, §23.9, §26, §29; Part 2 §3.8, §11.5, §13.2, §14; FAMILY_CANON §1.6, §2.1 (boss contexts), §2.3, §2.5, §4.1 (guide boss tips), §6 in full, §9, §10.5, §11.2–11.3; CONTROL_MODEL §3.7–3.8, §7.3–7.4; AUDIO_INVENTORY §9; legacy HTML L3113–3296 (Goblin King), L5063–5324 (`BOSS_BLOCKS`), L7377–7648 (`DungeonBoss`), L8091–8097 (dungeon boss cinematic zoom), L9268 (caged loop) verified by grep · **Depends on:** `heroes.md` (§2.0, §2.5.1, §2.5.5–2.5.8, §2.5.10–2.5.12, §2.6), `enemies.md` (§2.2, §2.3, §2.7, §2.9, §5), `story-beats.md` (§2.1, §2.2, §2.3, §2.5, §2.10, §5), `world-events-weather.md` (§2.2.3, §2.5.3, §2.8), `docs/DECISIONS.md` (all lines incl. the five orchestrator lines) · **Feeds:** `dungeons.md`, `cutscenes.md`, `ui-ux.md`, `audio.md`, `npcs.md`, `camp.md`
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

Twelve fights, one grammar: every boss is built from a data-driven `BOSS_BLOCKS` library whose eight v27 blocks (three of them never shipped) finally run, each with a ground telegraph in the shared shape language, and every intro lands on the same letterboxed, shaking, pushing-in card. The Goblin King's Kid Snatch ports faithfully into Act 1 at Crash Meadow; the Treant, Pharaoh and Queen keep their canon phases; the Hydra Matriarch and Frost Lich get phases in the canon's spirit; the Colossus and Titan get open lairs; the shadow squad becomes the kids' own rigs in the Shadow skin, and the Queen's clones are cut from it.

---

## 1. What v27 does

Compact; the teardown is the record. SI = SYSTEMS_INVENTORY, FC = FAMILY_CANON, AR = ATMOSPHERE_RECIPES, CM = CONTROL_MODEL, AU = AUDIO_INVENTORY. Every metre in this file is v27 px × 0.025 (40 px = 1 m, `heroes.md` §2.5.1).

**The primitives (SI Part 1 §16, Part 2 §14.1).** `addArenaEffect` is a circular ground zone with a telegraph window (default 1.0 s) then an active window, capped at 8, anchored to a world position, calling `onHeroInside(hero, dt)` every frame; over-cap requests are dropped silently. `createPhaseBoss` (L3044) is a data-driven phase machine with HP-gated transitions and a 1.5 s invulnerable freeze per transition. **It is never called**; every shipped boss hand-rolls its phases.

**`BOSS_BLOCKS` (SI §17, L5063–5324).** Eight composable mechanics: Radial Blast (1.5 s charge, 180 px, push 200, 0.5 s active, `magic`), Cocoon (time-gated invulnerability with add waves, a 5 s stun and a one-shot ×1.5 on the next hit; `cocoonHp` stored, never damaged), Tether (ramping DoT from 3 to 15 DPS over 8 s, an 80 HP anchor with **no hit detection**; never invoked), Arena Hazard (60 px, 8 s, 5 DPS zones, unbounded count), Charge (500 px/s for 0.7 s, dashed 400 px line for 0.4 s, wall stun 3 s with `onWallStun`, damage every frame inside `sz + 15`), Containment (a 50 px field that drags a hero back at 2/s with 2 DPS; nothing decrements its 120 HP; never invoked), Summon + Shield (a stub: a banner and nothing else), and Kid Snatch (§17.8: every non-active, living, unlocked hero caged; cage HP `150 + 50n`; boss ×(1 + 0.15n) damage and 5n % damage reduction; the cage is hittable only while `exposed`; one hero freed per 1/n of cage HP; the four caged lines keyed by hero index, fired at 1.5 s + 1.2 s per position in the first captive's colour). Only four blocks make a sound (AU §9.3).

**The Goblin King (SI §18, L3113–3296).** `2200 + teamLv × 140` HP, `dmg 35`, `sz 36`, spawned after all five dungeons at `(WW/2, WH × 0.3)` with `playBossIntro('THE GOBLIN KING', 'Ruler of the Horde — Kid Snatch!')` and `screenShake(12, 1)`. Opening: 1.5 s ramping shake with the King frozen, then `GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"`, `screenShake(15, 0.8)`, a 0.3 s radial blast (200 px, push 150, 15 dmg), and 0.6 s later the snatch with `cageHp 200 + teamLv × 15` and grab radius 9999. Phases at 50 % (`PHASE 2 — THE KING WEAKENS!`: spd 80, cd 1.1, charge unlocked, spin) and 25 % (`PHASE 3 — DEATH OR GLORY!`: spd 105, dmg ×1.3, cd 0.9, sz 38, the cage thrown as a 50 dmg projectile at the active hero, barrels every 2.5 s). Ground Slam (170 px, 200 in P3; 1.3× effDmg; cd 6 / 5 / 3.5; **exposes the cage 2 s**) and wall-stun charges (**expose 3 s**) are the hit windows; the cage-hit test is `src.y < boss.y − 10` (attack from above). Summons `phase + 2` adds (`goblin, orc, archer`; `orc, troll, shielded` in P3) every 10 / 8 / 6 s. Death: free caged, +150 XP, `King Slayer`, `hitStop 0.1`, `GOBLIN KING DEFEATED!`, the portal 5 s later.

**Dungeon bosses (SI §19).** One constructor, one update, branching on biome. HP `base + teamLv × 80` (forest 800, desert 750, cave 900, swamp 850, frozen 800; volcanic `2000 + 500 × (players − 1) + teamLv × 100`), Hard ×1.5. Drop-in intro: 0.8 s eased fall from `y = −80`, `screenShake(15, 0.7)`, `boom`, 25 particles, a 0.5 s hold, with a 5 s canvas cinematic that zooms 1.0 → 1.4 over 1.5 s, holds, releases over 1 s, under **pure black** 60 px bars, captioned `<boss name>` over `Guardian of <dungeon name>` (L8091–8097). A generic layer fires on every dungeon boss: `<nm> enrages!` at 50 % (spd ×1.2, dmg ×1.15, `boss` 0.4) and `FINAL PHASE!` at 25 %, on top of each boss's own phases, so the Treant announces four phase changes. Per boss: **Treant** vine grabs, Forest Sprites; planted at 60 % (spd 0, 30 % DR, root-network hazards, Saplings with a dead `_saplingTimer`, Branch Sweep cone); uproots at 30 % (Leaf Explosion). **Pharaoh** teleports between five fixed anchors (the four corners and the centre), 3-way spreads, Sand Soldiers; sarcophagus cocoon at 50 % with two waves of 12–15 Scarabs; then `_wrPhase = 3` **regardless of HP** when the stun ends: phantom split with two decoys, `_realIdx` and `_scarabOnHit` set but never read. **Colossus** slam, a sweeping beam whose per-frame damage `floor(dmg × 0.4 × dt × 60)` is 0.4× dmg *per frame*, and a reflect shield consumed by the first ranged hit. **Hydra Matriarch** poison pools, 3 simultaneous head strikes with 1.0 s telegraphs, `heads 5, dmg × 0.7` at 50 %. **Frost Lich** Deep Freeze (stun 2.5 s + flat 50), ice walls (60 HP objects), a P3 blizzard (300 px, 6 DPS, broken by any hit over 15). **Magma Titan** the raid boss: phases at 60 / 25 %, four 150 HP plates absorbing 60 % from the facing side (with the compass letter announced from the wrong array), Lava Spray calling the pre-v13 `Proj` signature (fires garbage), Embers, Meltdown (0.6× to everyone every 6 s), enrage at 180 s. Shared `takeDmg` order, milestone banners at 75 / 50 / 25 %, death `hitStop 0.1`, `screenShake(12, 0.5)`, 35 particles, `showDungeonVictory` after 2 s, `DUNGEON_EQUIPS` applied on exit (SI §23.9).

**Citadel Warden (SI §20).** `CITADEL_WARDEN` 2000 HP, dmg 35, spd 45, sz 28, the only NG+-scaled boss. Phases at 66 / 33 %: `Dark Knight` (400 px/s charge), `Shadow Mage` (`The Warden shifts to shadow magic!`, teleport plus an eight-way burst with no telegraph), `VOID FORM` (`VOID FORM UNLEASHED!`, spd ×1.5, melee ×1.25). Shadow Spawn summons. Floors 1 and 2 define `Stone Sentinel` (golem, 400 HP) and `Phantom Warden` (wraith, 350 HP) as mini-bosses that **never spawn** (SI §29, Part 2 §21 #12).

**Shadow Queen (SI §21, L5528–5712).** `2500 + teamLv × 150` HP, dmg 40, spd 80, sz 30, fought the instant the portal is entered. Four phases at 70 / 40 / 15 %: bolts and shadow pools; `The Shadow Queen summons clones!` (two goblin-type clones re-statted from random living siblings, 200 HP, 0.3× dmg, ranged if the source's `rng > 100`); `KIDNAP PHASE - Protect your siblings!` (`kidnap` siren; a 4 s channel on a random sibling, never Liam; 150 damage interrupts; success sets `banished = true, dead = true` permanently); `DESPERATION - She fights for survival!` (all cooldowns halved, three 12-bolt rings 0.4 s apart). Updated with a **fixed dt** (NEXT_SESSION known issues). Death: `THE SHADOW IS VANQUISHED!`, `New Game+ unlocked!`, `Shadow Slayer`, 2 s spin death, victory stats `SHADOW QUEEN VANQUISHED!` / `The darkness has been defeated!`.

**The intro (AR §13.1, SI Part 2 §14.2).** `paused = true` for 4.1 s; `#0B0E1A` bars in 0.5 s; the name card at 0.8 s with a back-out overshoot and `snd('boss', 0.5)`; out at 3.2 s; bars out at 3.6 s. No camera move, but the caller's `screenShake(12, 1)` runs under the frozen frame: "the world trembles while nothing else moves." The mini-boss popup (2.5 s, top centre) is deliberately not letterboxed.

**Oddities that change this design (SI §29, §16.1, §19).**

| Oddity | Consequence |
|---|---|
| `createPhaseBoss` unused; every boss hand-rolls phases; the generic enrage/final-phase layer overlaps the biome phases | The rebuild uses one phase machine (§2.1.2) and folds the generic banners into each boss's own transitions |
| Every per-frame DoT (`takeDmg(floor(N × dt))`) floors to 0 then clamps to 1 per frame: 5–15 DPS zones dealt **60 DPS** at 60 fps | Zone damage accumulates and ticks whole points at 4 Hz (§2.1.4); the stated DPS is finally the felt DPS |
| Radial Blast and Charge hit every frame inside their radius | One hit per hero per activation (§2.2) |
| Colossus beam deals 0.4× dmg per frame | 0.4× dmg per 0.25 s tick (§2.11) |
| Tether, Containment, Summon + Shield never invoked; the first two have no hit detection, the third no body | All three run, with colliders, on the Phantom Warden, the Frost Lich and the Stone Sentinel (§2.2) |
| Two Citadel mini-bosses never spawn; Pharaoh `_realIdx` / `_scarabOnHit` and Sapling `_saplingTimer` never read; Titan Lava Spray broken; plate compass mismatched | Each gets its intended behaviour (§2.17) |
| Kid Snatch lines in the first captive's colour; the greyscale portrait filter never restored; `cageY` computed and unused | Speaker's colour; restored on release; the cage is a real collider (§2.6) |
| The King spawns the portal 5 s after death; the Queen begins the instant the portal is entered | Story-beats moved both: the King ends Act 1; the Queen sits at the corrupted hearth after the Warden |
| Shadow Queen fixed-dt update; boss timers on wall-clock `setTimeout` | Every timer in this file is sim-clock seconds |
| No boss is NG+-scaled except the Warden | All bosses take `NG_SCALE` hp and dmg at construction (§2.1.3) |
| Boss and cage colours sit in hero bands (Queen `#A862C4` = Collette's old base; Pharaoh `#E8A860` and Titan `#D86840` in Noah's orange band; pink `#e84393` in Isabella's ruby band) | Retuned per `heroes.md` §2.1.3; canon card colours survive on the card text only (§2.1.6) |

---

## 2. What it becomes

### 2.0 Boss roster

Every later file reads this table first. "Blocks" are §2.2 keys. Heights are model heights in metres (hero heights 1.52 / 1.40 / 1.30 / 1.14 m for comparison; a hero is one-eighth of screen height at gameplay distance, so a 3 m boss is a quarter and a 6 m boss is half). Card strings are verbatim canon unless marked **[new text]**.

| # | Boss | Where (beat) | Phases | Blocks used | Height m | Arena | Adds (`enemies.md` key · variant) | Drop and rewards | Card name / subtitle |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **The Goblin King** | Crash Meadow, Forest island (B1.10, Act 1 climax) | 3 | `kidSnatch`, `radialBlast`, `groundSlam`, `summon`, `chargeAttack`, `spin`, `projectilePattern` (scatter) | 2.9 (3.4 with crown; cage pole to 4.3) | 28 m palisade ring in the 45 × 45 m meadow | `goblin` / `orc` / `archer` (P1–2); `orc` / `troll` / `shielded` (P3), Forest cloth scrap | 150 XP, tier-3 gear roll, guardian gold, `King Slayer`; unlocks camp C4 and Act 2 | `THE GOBLIN KING` / `Ruler of the Horde — Kid Snatch!` |
| 2 | **Ancient Treant** | The Hollow Grove (B1.8) | 3 | `grab`, `summon` (sprites, saplings), `arenaHazard` (root network), `sweep`, `radialBlast`, `rootKnots` | 5.5 (canopy 7.0) | 20 × 16 m grove hall | `bat` · Forest Sprite ×3; `slime` · Sapling ×2–3 | Hearthroot Seed, tier-3 roll, `Dungeoneer` | `Ancient Treant` / `Guardian of The Hollow Grove` |
| 3 | **Pharaoh Wraith** | The Buried Tomb (B2.13) | 3 | `blink` (sun-marks), `projectilePattern` (fan 3), `summon` (Sand Soldiers), `cocoon` (sarcophagus), `phantomSplit` | 2.6, floats 0.4 | 20 × 16 m tomb hall, five sun-marks | `orc` · Sand Soldier ×2–3; `bat` · Scarab ×12–15 per wave; `wraith` · Phantom Wraith ×2 | Sunstone Crest, tier-3 roll | `Pharaoh Wraith` / `Guardian of The Buried Tomb` |
| 4 | **Hydra Matriarch** | The Sunken Temple (B2.11) | 3 | `multiStrike` (heads), `arenaHazard` (poison pools, the flood), `headSplit` | 3.8 at the tallest head | 20 × 16 m flooded nave with raised stones | none (its heads are the adds) | Marshlight Vial, tier-3 roll | `Hydra Matriarch` / `Guardian of The Sunken Temple` |
| 5 | **Frost Lich** | The Ice Citadel (B2.7) | 3 | `containment` (Deep Freeze), `arenaHazard` (ice walls), `channel` (BLIZZARD), `projectilePattern` (frost bolt) | 2.8, floats 0.3 | 20 × 16 m lens room under the Observatory dome | none | Hearthice Crown, tier-3 roll | `Frost Lich` / `Guardian of The Ice Citadel` |
| 6 | **Crystal Colossus** | The Crystal Depths lair, under the Forest island (B2.14) | 3 | `reflectShield`, `groundSlam`, `beamSweep`, `arenaHazard` (crystal fall) | 4.5 | 40 m cavern, re-enterable | none | Lampstone Core, tier-3 roll; the spark plug on its plinth | `Crystal Colossus` / `Guardian of The Crystal Depths` |
| 7 | **Stone Sentinel** (mini-boss) | Home, Wrong floor 1, Outer Ward (B3.3) | 2 | `groundSlam`, `arenaHazard` (spikes), `summonShield` | 3.2 | 16 m ash-root clearing | shadow-tinted `orc` ×2, `archer` ×2 | tier-2 gear, 60 XP, `Mini-Boss Slayer` | popup `Stone Sentinel` / `Outer Ward` |
| 8 | **Phantom Warden** (mini-boss) | Home, Wrong floor 2, Inner Sanctum (B3.3) | 2 | `blink`, `tether`, `arenaHazard` (poison) | 2.5, floats 0.3 | the mirror stream bend, 14 m | none | tier-2 gear, 60 XP, `Mini-Boss Slayer` | popup `Phantom Warden` / `Inner Sanctum` |
| 9 | **The shadow squad** (set piece) | Throne of Shadows, the mirror fire (B3.3) | 1 | hero basic attacks and signatures only (§2.14) | 1.52 / 1.40 / 1.30 / 1.14 | the mirror camp, 24 m | — | none; the citadel door opens | popup `The Shadow Squad` **[new text]** / `Four of them. Four of you.` **[new text]** |
| 10 | **Citadel Warden** | the citadel door, Throne of Shadows (B3.3) | 3 | `chargeAttack`, `blink` + `projectilePattern` (ring 8), `summon` (Shadow Spawn) | 2.6 | 20 × 16 m dooryard between the mirror fence and the door | shadow-tinted `goblin` · Shadow Spawn ×2–3 | tier-3 roll; the Citadel rewards land on the Queen | `Citadel Warden` / `Guardian of The Shadow Citadel` |
| 11 | **The Shadow Queen** | the corrupted hearth (B3.4, finale) | 4 | `projectilePattern` (fan 6, ring 12 ×3), `arenaHazard` (shadow pools), `summon` (clones from the squad), `kidnap` | 2.4 (crown 3.0; her shadow stands 3.6) | 24 × 20 m hall around the hearth | shadow-clone heroes ×2 (§2.14) | four legendaries, NG+ unlock, `Shadow Slayer`, `Citadel Conqueror`, `Legendary Hero`, `True Final Boss` (NG+5) | `THE SHADOW QUEEN` / `Mistress of Darkness` |
| 12 | **Magma Titan** | The Volcanic Rift lair, under the crater (B3.6, post-game) | 3 | `groundSlam`, `projectilePattern` (lava spray scatter 5), `armorPlates`, `summon` (Embers), `meltdown`, enrage timer | 6.0 | 36 m obsidian ring around a magma lake | `ember_sprite` · Embers ×2+ | Emberforge Heart, tier-3 roll, `Forged in Fire` | `Magma Titan` / `Guardian of The Volcanic Rift` |

Overworld guardians (Crystal Golem, Sandworm, Swamp Hydra, Frost Wyrm) are `enemies.md` §2.7's and are not redesigned here.

### 2.1 Rules that hold for every boss

#### 2.1.1 Scale and reads

All v27 numbers convert at 40 px = 1 m (`heroes.md` §2.5.1). Where a 3D value departs from the strict conversion the row says "3D change" and §6 has the line. Speeds: the King 1.75 / 2.0 / 2.625 m/s by phase; Treant 0.875 (P3 1.375); Pharaoh 1.25; Colossus 0.75; Hydra 1.0; Lich 1.125; Titan 0.8; Warden 1.125 (P3 1.69); Queen 2.0. Heroes run 4.0–4.5 m/s: no boss outruns a kid, so every boss has a reach attack (charge, blink, beam, bolt) and the kit's dodge is the answer to it.

**Silhouette rule.** A boss must read as a boss at one-eighth-screen-height heroes: 2.4 m minimum (the guardian tier's top), one shape no enemy has (a crown and a cage pole; a canopy; a floating death mask; a fan of necks; a hovering crown-and-staff; a crystal heart; a throne-and-crown), and a motion signature at three incommensurate rates (AR §19 lesson 3; `enemies.md` §2.2). **Camera.** On boss-arena entry the gameplay follow distance blends ×1.25 over 1.0 s (pitch unchanged) so a 5.5 m Treant and the party fit one frame; it reverts on the death beat (3D change, §6).

#### 2.1.2 One phase machine

`createPhaseBoss` (SI §16.2) becomes the machine every boss runs, as data in `src/content/bosses/<boss>.ts`:

```
BossDef {
  key, name, cardName, cardSubtitle, cardColour,
  hp: (teamLv, players) => number, dmg, spd, hitRadius, height,
  phases: [{ enterBelow: 1.0 | 0.5 | ..., banner, shake, onEnter: BlockCall[], loop: TimedBlock[] }],
  milestones: { 0.75: '<nm> weakening!' | 'Boss weakening!', 0.5: 'Halfway there!', 0.25: 'Almost defeated!' },
  adds: AddPool, drop, death: DeathVerb
}
```

A **phase transition** is the v27 `createPhaseBoss` beat made visible: 1.5 s during which the boss is invulnerable (`IMMUNE!` on hits), stands still, plays its transition clip (below, per boss), fires the canon banner in the boss colour with the canon shake, and the boss light (§2.1.5) steps to its phase colour. Milestone banners (75 / 50 / 25 %) are separate from phases and fire on any boss that has them in canon. The generic dungeon-boss `<Boss name> enrages!` (with `snd('boss', 0.4)`, shake 10 / 0.6, spd ×1.2, dmg ×1.15) fires on that boss's **own P2 transition**, and `FINAL PHASE!` (shake 12 / 0.5) on its **own P3 transition**, instead of at fixed 50 / 25 % over the top of them (3D change, §6). Banners keep their v27 colours and durations.

#### 2.1.3 Formulas as data (verbatim, with two wrappers)

| Boss | HP | dmg | Hard | NG+ (new) |
|---|---|---|---|---|
| Goblin King | **`1400 + teamLv × 140`** (v27 `2200 + teamLv × 140`; the Act 1 retune, §2.6.1) | **28** (v27 35) | hp ×1.5, dmg ×1.25 | `NG_SCALE.enemyHp`, `.enemyDmg` |
| Ancient Treant / Frost Lich | `800 + teamLv × 80` | 30 / 28 | hp ×1.5 | same |
| Pharaoh Wraith | `750 + teamLv × 80` | 28 | hp ×1.5 | same |
| Hydra Matriarch | `850 + teamLv × 80` | 25 | hp ×1.5 | same |
| Crystal Colossus | `900 + teamLv × 80` | 35 | hp ×1.5 | same |
| Magma Titan | `(2000 + 500 × (players − 1)) + teamLv × 100` | 35 | hp ×1.5 | same |
| Citadel Warden | `2000` | 35 | — (v27) | v27 already scales it |
| Shadow Queen | `2500 + teamLv × 150` | 40 | hp ×1.5, dmg ×1.25 | same |
| Stone Sentinel / Phantom Warden | 400 / 350 | 25 / 30 | — | same |

NG+ wrapper (3D change, §6): every boss multiplies hp by `NG_SCALE[ng].enemyHp` and dmg by `.enemyDmg` at construction, as the Warden already did; spd is not scaled (bosses are slow on purpose). Hero ultimates deal 2× to bosses (SI §22; `heroes.md` §2.5.6) against every entry in the roster including the two mini-bosses. Boss kills call `rollGearDrop(3, …)` (`heroes.md` §2.5.10) so legendary rarity is reachable, pay `rnd(5,10) × goldMul` (the guardian intent of the dead `boss` gold branch, `enemies.md` §2.5), advance the `boss` bounty, and mark `bossDefeated[key]` for the bestiary.

#### 2.1.4 Damage that hurts the party

- **Zones and DoTs** (hazards, tether, containment, grab, sweep, blizzard, pools): per hero per zone, `acc += dps × dt`; every 0.25 s apply `floor(acc)`, minimum 1 if `acc > 0`, then `acc −= applied`. 5 DPS is 5 per second (v27 dealt 60, §1). The `Math.max(1, amt)` clamp in `Hero.takeDmg` still applies per applied tick.
- **One-shot area attacks** (slam, blast, spin, sweep entry, crystal fall): once per hero per activation, resolved against heroes inside the telegraph shape at the end of the windup (the `enemies.md` §2.2 rule). Dodge i-frames negate them (`IMMUNE!`).
- **Projectiles**: `enemies.md` §2.4 hostile-projectile rules (8 m/s default overridden per pattern, blocked by obstacles and ice walls, emissive dart, no light beyond the pool rule). Liam's Shield Front (`heroes.md` §2.5.10) halves frontal ones.
- **Companions** step out of telegraphs within 0.4 s (`heroes.md` §2.5.11); every boss telegraph therefore leaves an exit path at least 1.2 m wide.

#### 2.1.5 Light, fog, weather, events

One pooled point light per fight, `light.boss` (`world-events-weather.md` §2.8.2): `#FFC864` intensity 2.0 range **4 m** (raised from 1.5 m for bosses over 2 m, as that file allows), enraged `#FF5050` 2.6 / 5 m, parented to the boss's core (chest, heart, crown); it takes one of the two world slots. The enraged room grade `#B40000` at 0.06 ports as a grade. Fog per arena is that file's token (`dng.forest`, `dng.desert`, `dng.bog`, `dng.frozen`, `dng.cave` at `dark 0.85`, `dng.volcanic`, `dng.citadel1–3`). `light.heroPool` is 6 m in boss rooms (v27 180 px). No world event during a boss (§2.5.3 there); weather is frozen for the fight except the Queen's `riftstorm` (§2.16). Everything else that glows on a boss is emissive on the bloom layer.

#### 2.1.6 Palette

Bosses draw from the island tokens and the `enemies.md` §2.2 bands, never within 20° hue and 15 % lightness of a hero base (`heroes.md` §2.1.3). New tokens, for `src/style/bosses.ts`:

| Token | Hex | Use |
|---|---|---|
| `boss.king.hide` / `.dark` / `.crown` | `#8B0000` / `#5C0000` / `#E8A838` | the King's v27 red kept: 0° hue, 27 % lightness, 23 points darker than Isabella's ruby |
| `boss.king.eye.p1/p2/p3` | `#8B0000` / `#FF4400` / `#FF0000` | v27 phase glow, now eyes and crown gems (emissive) |
| `boss.treant.bark` / `.moss` / `.sap` | `#4A3524` / `#3A7D44` / `#58B888` | bark from rot-brown, canopy from moss, the v27 green as emissive sap in the cracks |
| `boss.pharaoh.linen` / `.void` / `.mask` / `.sun` | `#EDE3CF` / `#3A2A10` / `#1FA3A0` / `#D9A441` | bone wraps over a dark hollow; oasis-turquoise mask and eyes; ochre only on trim and the sun-marks (v27 `#E8A860` sits in Noah's band) |
| `boss.hydra.scale` / `.deep` / `.belly` / `.eye` | `#1F6F6B` / `#0B2B2E` / `#4A3524` / `#6CE87A` | the Swamp Hydra's family, bigger |
| `boss.lich.robe` / `.ice` / `.bone` | `#1B2A5A` / `#8FD3F4` / `#F2F7FF` | indigo robe, ice crown and staff, a snow-bone face; 26 points darker than Liam's sapphire |
| `boss.colossus.slate` / `.crystal` / `.heart` | `#5E6C7A` / `#CFE9F5` / `#00D2FF` | the Golem's family; the heart is story-beats' pulse colour |
| `boss.titan.glass` / `.ember` / `.magma` | `#1C1A22` / `#FF6A2A` / `#FFB061` | black-glass body, ember seams, magma core (v27 `#D86840` sits in Noah's band) |
| `boss.warden.void` / `.seam` | `#120A1F` / `#4A0080` | void body, the v27 colour as emissive seams |
| `boss.queen.void` / `.violet` / `.rift` | `#120A1F` / `#6C3483` / `#3AF0FF` | void body, the v27 `dk` violet as robe and bolts (22 points darker than Collette's amethyst), rift cyan for P3+ where v27 used pink `#e84393` (Isabella's band) |
| `boss.shadow.skin` / `.dark` / `.eye` | `#2C3E50` / `#1A252F` / `#3AF0FF` | the shadow squad and the clones (`heroes.md` §2.6) |
| `boss.cage.iron` / `.gold` | `#3A3A44` / `#E8A838` | the King's cage; gold is the v27 exposed stroke |

Card text colours keep v27 (`#D84830` King, `#A862C4` Queen, biome colours for the rest) because a name card is UI over a dark plate, not a body.

#### 2.1.7 Telegraph language for bosses

`enemies.md` §2.2 verbatim: **cone** = a swing from the boss; **circle** = a slam or burst centred on the boss, or hatched on you; **line** = a charge, dive or projectile path; **dashed ring** = something arriving or beneficial. Fill sweeps outward over the windup; the last 0.1 s flashes white; `tele.hostile #E0452E` 35 %, `tele.outline #FFFFFF` 90 %, `tele.benefit #3AF0FF` dashed, `tele.hatch` stripes. Boss additions: **every boss area telegraph is hatched** (bosses are the elite tier's top); a **wedge** (a cone with a bright leading edge that moves) is the beam; a **band** (an annulus with a moving inner edge) is the flood and the meltdown; the boss's own colour draws a second thin rim outside the white outline so a kid knows *whose* circle it is (colour is never the only channel). Pool: the 16-decal registry in `enemies.md` §4, of which a boss fight may hold 8; hazards use a separate pool of 12 (v27 unbounded). Reduced motion removes the sweep, never the shape.

