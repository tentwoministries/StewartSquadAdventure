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

Overworld guardians (Crystal Golem, Sandworm, Swamp Hydra, Frost Wyrm) are `enemies.md` §2.7's and are not redesigned here. Add names (`Forest Sprite`, `Sapling`, `Sand Soldier`, `Scarab`, `Phantom Wraith`, `Shadow Spawn`) are v27 `nm` strings recorded in SI §19–§20; FAMILY_CANON does not list them, so they are verbatim from the inventory, not from the canon file.

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

### 2.2 `BOSS_BLOCKS` in 3D

One library, `src/content/bosses/blocks/`, one block per file, each a pure function of `(boss, params, sim)` that registers telegraphs, timers and colliders and returns a state object the boss's phase loop ticks. Every block carries: its v27 defaults converted, its telegraph in the §2.1.7 language, windup and recovery, its sound hook (v27 names verbatim where one existed; new names prefixed `boss.` for `audio.md`), and what the camera sees. "Recovery" is the boss's idle after the block ends, before its next timer may fire; v27 had none, and 0.4–0.8 s of it is what lets a kid see cause and effect at the orbit camera (3D change, one §6 line for the set).

#### 2.2.1 The eight ported blocks

| Block | v27 data → 3D (verbatim unless "3D change") | Telegraph | Windup · active · recovery | Sound hook | From the 45–55° camera |
|---|---|---|---|---|---|
| **`radialBlast`** | `chargeTime 1.5 s`, `radius 180 px → 4.5 m`, `pushForce 200 → 5 m/s impulse`, `dmg = boss.dmg`, active `0.5 s`. 3D change: damage **once per hero** per activation (v27 hit every frame inside for 0.5 s) | hatched circle centred on the boss, sweeping to 4.5 m over the charge; at fire, a gold ring (`#E8A838` emissive) expands 0 → 4.5 m in 0.5 s and thins | 1.5 · 0.5 · 0.6 | `magic` 0.3 on cast (v27); `boss.blastFire` **[new cue]** at fire | the boss crouches and gathers (arms in, chest light brightens to 3×), then the ring; heroes inside slide outward on the impulse with a 0.2 s dust skid |
| **`cocoon`** | `waves 2`, `waveInterval 6 s` (later waves hard-coded 6), `stunDuration 5 s`, `dmgMul 1.5` on the **next** hit, invulnerable (`IMMUNE!`) throughout, `spawnFn` per wave. Default banner `The boss retreats into a cocoon!` `#C8983C` stays in the block's data (no roster boss uses it; the Pharaoh overrides it). 3D change: `cocoonHp` dropped (never damaged in v27); the cocoon is a mesh the boss disappears into | no ground shape (nothing hurts); a dashed **benefit ring** `tele.benefit` 3 m under the cocoon marks "adds arrive here" 1.0 s before each wave | 0 · `waves × 6 s` · the 5 s stun is the recovery | `boss.cocoonSeal` **[new]** on seal; `boss.cocoonCrack` **[new]** per wave (v27 silent); `boom` 0.4 on shatter (v27) | a shell 1.6× the boss's height (sarcophagus, husk), cracks that glow brighter each wave, then 20 shards and the boss stumbling out stunned with three stun motes |
| **`tether`** | `maxTime 8 s`, `dotBase 3` DPS ramping ×(1 + 0.5t) (3 → 15), `anchorHp 80`, anchor at boss ± 2 m (`rnd(−80, 80) px`), anchor radius 0.3 m. 3D change: the anchor is a real collider (v27 had none) | beam: a dashed emissive line at 1 m height, boss → hero, in the boss colour at alpha `0.4 + sin(t·6)·0.3` (v27); anchor: a dashed **benefit ring** 1 m under it ("break this") | 0.4 (the beam draws) · ≤ 8 · 0.6 | `boss.tetherOn` **[new]**; `boss.tetherBreak` **[new]** (v27 silent) | a shadow spike 1.2 m tall with a 0.75 m × 0.1 m HP bar (v27 30 × 4 px), the beam pulsing between it and the hero, the hero's rim tinted; the 10 shards on break |
| **`arenaHazard`** | `radius 60 px → 1.5 m` default, `life 8 s`, `dmg 5` DPS, `type fire / poison / ice / sand` (+ new kinds below), position boss ± 2.5 m. 3D change: pool cap 12 (v27 unbounded) | a hatched circle for the zone's whole life (it *is* the hazard), fill alpha `max(0.05, life/maxLife × 0.3)` (v27) | 0.6 (the zone grows in) · life · — | `boss.hazardSpawn.<type>` **[new]** | fire: scorch decal + embers up; poison: bubbling puddle + spore motes; ice: frost decal + glitter; sand: a sinking whirl; **`wall`** kind: an obstacle prop with HP (ice wall 60 HP) that blocks movement and projectiles; **`spike`** kind: floor spikes rising 0.4 m on a 2 s cycle (Outer Ward) |
| **`chargeAttack`** | `speed 500 px/s → 12.5 m/s`, `duration 0.7 s` (8.75 m), telegraph line `400 px → 10 m` for `0.4 s`, hit radius `sz + 15 px → r + 0.375 m`, `wallStunTime 3 s`, `onWallStun`. 3D change: one hit per hero per charge (v27 every frame); a wall is any arena boundary or `wall` hazard | dashed hostile **line** 1.3 m wide from the boss to 10 m along the aim, hatched | 0.4 · ≤ 0.7 · 0.5 (skid) or the 3 s stun | `whirl` 0.2 on telegraph (v27); `boom` 0.3 + shake 6 / 0.2 on end (v27); `boss.wallStun` **[new]** | the boss lowers and paws, then a straight run leaving `drawChargeTrail`'s fading circles as dust puffs at 0.05 s spacing; on a wall: the boss staggers, three stun motes orbit its head, `Stunned!` |
| **`containment`** | `radius 50 px → 1.25 m`, `hp 120`, `maxTime 10 s`, `dotDmg 2` DPS, the hero lerps to the field centre at 2/s, `Field broken!` on `hp ≤ 0` or timeout. 3D change: the field is a collider (v27 never decremented `hp`); the Frost Lich overrides `maxTime` to its 2.5 s stun (§2.10) | a dashed **benefit ring** 1.25 m under the trapped hero (siblings: hit here) with a hostile hatched centre 0.5 m (the hero: you are hurt here) | 0.3 · ≤ maxTime · 0.4 | `boss.fieldOn` **[new]**; shake 6 / 0.3 + 12 shards on break (v27); `boss.fieldBreak` **[new]** | a translucent faceted dome 1.6 m tall (30 % alpha, the elite-shield dome recipe) around the hero, a 1 m × 0.1 m HP bar above (v27 40 × 4), cracks widening as it falls |
| **`summonShield`** | `shieldHp 200`, `addCount 4`, `Shield up! Kill the minions!`. Rebuilt from the stub: the boss takes 0 damage (`IMMUNE!`) while any summoned add lives; each add death removes 25 % of the dome; the dome shatters and the boss is stunned 2 s when all four die; `shieldHp` becomes a soft cap: 200 damage absorbed also drops the dome | dashed **benefit rings** 1 m under each add ("kill these"); no hostile shape (the shield hurts no one) | 0.8 (adds rise) · until the adds die · 2 s stun | `boss.shieldUp` **[new]**; `Shield broken!`-class shatter `destroy_pot` 0.3 | a faceted dome at `r + 0.4 m`, `#4A9ED8` at 30 % (v27 colour, a light on the boss, not a body), with four thin tethers to the four adds that snap one by one |
| **`kidSnatch`** | §2.6.3, faithfully | the King's opening `radialBlast` is the only hostile shape; the snatch itself has none (it cannot be dodged: v27 rule kept) | 1.5 (windup) · 0.6 (the grab) · — | `boom` 0.5 + shake 15 / 0.8 on the roar (v27); `boss.cageShut` **[new]** (v27 silent); `achieve` 0.3 per freed hero; `victory` 0.3 on `ALL HEROES FREE!` (v27) | §2.6.3 |

#### 2.2.2 New blocks (named here; each exists because a boss below needs it)

| Block | Data | Telegraph | Windup · active · recovery | Sound hook | Used by |
|---|---|---|---|---|---|
| **`groundSlam`** | `radius` (King 4.25 / 5.0 m; Colossus 3 m; Titan 2.5 m; Sentinel 4 m), `dmgMul` (1.3 / 1.3 / 1.4 / 1.5), `cd`, `needHeroWithin` (King 6.25 m) | hatched circle on the boss; 25 impact particles in the boss palette; a 0.3 s dust ring decal | 0.8 · instant · 0.6 | `boom` 0.5 (King) / 0.4 (others) + the v27 shake (12 / 0.5 King; 10 / 0.5 Colossus; 12 / 0.5 Titan; 8 / 0.3 Sentinel) | King, Colossus, Titan, Sentinel |
| **`summon`** | `count`, `pool`, `ring` (King 1.25–2.5 m; Treant ± 2 m sprites, ± 3 m saplings; Pharaoh ± 3.75 m), `interval`; one type rolled per volley (v27) | dashed benefit ring 1 m at each spawn point 0.8 s before the add rises | 0.8 · — · 0.3 | `boss.summon.<boss>` **[new]** | King, Treant, Pharaoh, Warden, Queen (clones), Titan (embers) |
| **`spin`** | `radius 150 px → 3.75 m`, telegraph 0.5 s, active 1.5 s, `dmg 0.8× effDmg`, knockback `120 → 3 m/s`, dizzy stun 1.5 s after. 3D change: one hit on entry then 0.8× per 0.5 s while inside (v27 per frame); the zone follows the King's position for the 1.5 s (v27 anchored where he began, which made walking away trivial) | hatched circle 3.75 m under the King | 0.5 · 1.5 · 1.5 (the dizzy stun is the recovery) | `whirl` 0.3 (v27); `boss.dizzy` **[new]** | King P2 |
| **`projectilePattern`** | `kind fan / ring / scatter`, `count`, `spread`, `speed`, `dmgMul`, `radius`, `life`; per pattern in the boss sections | one hostile **line** per projectile, 0.3–0.5 s, from the boss to `speed × life` capped at 10 m (ring patterns draw 12 short 2 m lines) | 0.3–0.5 · flight · 0.3 | `magic` 0.2 (King throws, Pharaoh spread, v27); `shadow_bolt` 0.2 (Queen, v27); `boss.ring` **[new]** (Queen rings, Warden burst) | King, Pharaoh, Lich, Titan, Warden, Queen |
| **`grab`** | Treant vine grab: `radius 80 px → 2 m` on a hero within `200 px → 5 m`, telegraph 1.0 s, active 2.0 s, target stun 2 s, zone re-stun 0.3 s per tick, 12 DPS (ticked per §2.1.4) | hatched circle 2 m **on the target** (arriving) sweeping in 1.0 s; vines burst up as 8 root props | 1.0 · 2.0 · 0.5 | `magic` 0.2 (v27) | Treant P1 |
| **`sweep`** | Treant Branch Sweep: `radius 180 px → 4.5 m`, ±0.5 rad (57°) cone, telegraph 0.8 s, active 0.8 s, 30 DPS inside (ticked) | hatched **cone** 57° × 4.5 m from the Treant, sweeping | 0.8 · 0.8 · 0.8 | `boom` 0.3 (v27) | Treant P2 |
| **`rootKnots`** | 3 bark nodes, 40 HP each, at 4 m around the planted Treant; each severed removes 10 points of the 30 % planted DR; all three severed stops the root network. Interprets Elm's `Sever the roots!` and the dead planted-DR rule | dashed benefit ring 1 m under each knot | 1.2 (they rise) · until P3 · — | `boss.rootSever` **[new]** | Treant P2 |
| **`blink`** | `anchors[]` (Pharaoh: five sun-marks) or `random` (Warden, Phantom Warden); departure 0.4 s, destination ring 0.8 s (Pharaoh 0.8 s `radius 60 px → 1.5 m`, v27), `portal` 0.3 + 10 particles | dashed **benefit ring** 1.5 m at the destination for the full 0.8 s (arriving) | 0.8 · instant · 0.4 | `portal` 0.3 (v27) | Pharaoh, Warden, Phantom Warden |
| **`phantomSplit`** | 2 decoys + the real boss; shift every 6 s (`The phantoms shift!`, 15 particles); decoy HP 50, spd `60 → 1.5 m/s`. The dead `_realIdx` / `_scarabOnHit` intent: the real Wraith leaves a **sand afterimage** trail for 0.6 s after each shift (Sol: `Track the afterimage.`); a decoy that dies bursts into **3 Scarabs** | on shift: dashed ring 1.5 m at each of the three destinations | 0.6 · 6 s cycle · — | `portal` 0.3 per shift; `boss.phantomPop` **[new]** | Pharaoh P3 |
| **`multiStrike`** | Hydra heads: `min(heads, aliveHeroes)` targets, telegraph 1.0 s, hatched circle `50 px → 1.25 m` on each target, `dmg` on hit + 15 DPS zone for 0.5 s (v27); heads 3 → 5 | hatched circle 1.25 m on each targeted hero, one per head | 1.0 · 0.5 · 0.8 | `hit` 0.2 per bite (v27); `boss.hydraHiss` **[new]** on windup | Hydra |
| **`headSplit`** | at 50 % once: `heads = 5`, `dmg = floor(dmg × 0.7)`, `The Hydra splits!` (silent in v27; now `boss.hydraSplit` **[new]**); heads have stagger meters (§2.9) | — | the 1.5 s transition | — | Hydra P2 |
| **`beamSweep`** | Colossus: wedge ±0.15 rad to `250 px → 6.25 m`, telegraph 1.2 s (v27), then 2 s sweeping at 1.5 rad/s; 3D change: 0.4× dmg per 0.25 s tick inside (v27 per frame) | hatched **wedge** that, once live, rotates with the beam; a bright leading edge | 1.2 · 2.0 · 1.0 | `boss.beamCharge` **[new]**, `boss.beamLoop` **[new]** (v27 silent) | Colossus P2+ |
| **`reflectShield`** | Colossus: the first arrow or magic hit is `REFLECTED!` (0 damage, the projectile reversed at the shooter) and the shield drops; 3D change: it **re-forms after 12 s** in P1 only (v27 consumed it permanently; Quartz's `Get in close when the shield shimmers.` needs a window that recurs) | none (a shield hurts no one); the crystal skin shimmers white 0.2 s on reflect | — | `boss.reflect` **[new]** (v27 silent) | Colossus P1 |
| **`channel`** | an interruptible cast: `duration`, `interruptRule` (Lich blizzard: any single hit > 15; Queen kidnap: 150 accumulated), a bar for `ui-ux.md`, the boss stands still | Lich: hatched circle 7.5 m sweeping over 1.5 s, then a **band** for 4 s; Queen: none (the tether is the read) | per user | `boss.channelStart` **[new]**; `boss.channelBreak` **[new]** | Lich P3, Queen P3+ |
| **`kidnap`** | `channel` 4 s + the `tether` beam in rift cyan + the v27 rules (random living, unbanished sibling, never Liam; 150 damage interrupts; success banishes) | the tether at 1 m height, Queen → sibling, pulsing; a hatched circle 1 m under the sibling | 0.5 · 4.0 · 0.8 | `kidnap` 0.4 on start (v27); `boom` 0.5 + shake 10 / 0.5 on success (v27); `boss.kidnapBreak` **[new]** | Queen P3+ |
| **`armorPlates`** | Titan: four plates N / S / E / W, 150 HP, absorb 60 % of hits from their side; compass letter fixed to match the plate hit; `<N/S/E/W> armor shattered!` with `destroy_pot` 0.3; `All armor destroyed!` | none | 1.2 (plates form) · — · — | `destroy_pot` 0.3 (v27) | Titan P2+ |
| **`meltdown`** | Titan: every 6 s, 0.6× dmg to **every** hero (v27 unavoidable, kept), shake 8 / 0.3, 20 particles; 3D change: a 1.5 s warning band so the player can heal, never a dodge | a **band** from the lake edge outward to the ring's edge over 1.5 s in `boss.titan.ember` | 1.5 · instant · 0.8 | `boss.meltdown` **[new]** (v27 silent) | Titan P3 |

Arena effects (SI Part 2 §14.1) are gone as an object; their two-phase lifetime (telegraph then active, `onHeroInside` per tick, `onEnd`) is the telegraph registry's, and every `drawTelegraph` / `drawActive` pair becomes a decal shape plus a pooled VFX recipe. `clearArenaEffects()` on boss death becomes `telegraphs.clearOwner(boss)`.

### 2.3 The intro grammar

One timeline, one code path (`src/engine/camera/cinematic.ts`, shared with the combo beat of `heroes.md` §2.5.8 and adoptable verbatim by `cutscenes.md`). Built on AR §13.1 (bars, the shaking still frame, the card, the growl), Brief §4.5's slow push-in, and the v27 dungeon-boss cinematic's own zoom curve (L8091–8097: 1.0 → 1.4 over 1.5 s, hold, release), which is the push-in v27 already had for dungeon bosses and never gave the King or the Queen.

| t (s) | Sim | Camera | Screen | Sound |
|---|---|---|---|---|
| 0.00 | **Frozen** (v27 `paused = true`, kept and logged: the freeze is what makes the card land). The boss's *reveal clip* and the camera run on the presentation clock, not the sim clock | Blend 0.3 s from the gameplay rig to the **boss rig**: pitch 32°, yaw = the active hero's facing toward the boss ± 25° (the side that shows the boss's signature shape), distance so the boss fills 45 % of frame height with the active hero in the lower third; then **push in** to 0.72 × distance over 1.5 s (the v27 1.4 zoom), hold | Letterbox bars `#0B0E1A` (never `#000`; the dungeon cinematic's black bars are retired) slide to 60 px at 1080p (5.6 % of height) in 0.5 s ease-out | `screenShake(12, 1.0)` starts: the world trembles while nothing moves (AR §13.1); the ±0.3° roll from AR §10 |
| 0.80 | frozen | hold | Name card slides in from the right, back-out overshoot 0.6 s, `border-left 4px` in the card colour, name glow in the card colour (bloom-tinted DOM `text-shadow`), subtitle `#aaa` | `snd('boss', 0.5)` |
| 1.60 | frozen | hold | **`boss_appear` line** (story-beats §2.5): the hero's verbatim line as a speech bubble over that hero in their `glow` and as an announce in the same colour, 0.8 s after the card. Isabella at the King (`YOU'RE BIG. I'M NOT SCARED OF YOU.`), Liam at the Treant (`That was fine. That was totally fine. I'm fine.`), Noah at the Colossus (`That boss has really interesting armor actually. Like the craftsmanship is— OW. Fighting. Right.`); once per playthrough each | — |
| 3.20 | frozen | hold | Card slides out (0.6 s) | — |
| 3.60 | frozen | release: blend back to the gameplay rig over 0.5 s, arriving at the ×1.25 boss-arena distance (§2.1.1) | Bars out 0.4 s ease-in | — |
| 4.10 | **Resumes** | gameplay | The spawn announce lands now (`THE GOBLIN KING APPEARS!` `#ff0000` 4 s; `Welcome to the Shadow Realm...` belongs to CS-08, not here) | the boss's first timer starts |

**Reveal clips** (per boss, on the presentation clock, 3.2 s, so the frozen frame is a *held pose* not a T-pose): King crashes through the palisade and plants the cage pole; Treant's bark face opens its eyes and the canopy shakes leaves; Pharaoh's sarcophagus lid slides and he rises to hover; Hydra surfaces head by head; Lich descends from the dome's lens on a frost column; Colossus assembles from the rim crystals into the heart; Warden turns from the door with the seams igniting; Queen rises from the throne, her shadow rising first; Titan keeps v27's **drop-in** (0.8 s eased fall, `screenShake(15, 0.7)` and `boom` 0.6 at the landing, 25 particles) as the only boss that lands. Guardians and the two floor mini-bosses use `enemies.md` §2.7's un-letterboxed popup and never this grammar; the shadow squad uses the popup too (§2.14).

**Reduced motion:** no push-in, no shake, no roll; bars, card, freeze, growl and the line remain. **Multiplayer:** plays on every client; the host starts the boss clock at 4.10 s. **Skip:** none (4.1 s; the combo beat is 1.4 s and is not skippable either). **Dungeon entry** keeps its own v27 card (the dungeon name over `<BIOME> DUNGEON`, SI Part 2 §11.5) on the same timeline; that card is `dungeons.md`'s to place.

### 2.4 The boss bar and phase pips (spec for `ui-ux.md`)

One bar, top centre, 40 % of viewport width, 14 px tall at 1080p, corners rounded to the scrapbook's radius, fading in over 0.5 s as the intro's bars leave.

| Element | Rule |
|---|---|
| Name | Left-aligned above the bar in the card colour, sentence case as canon has it (`THE GOBLIN KING` stays capitals; `Ancient Treant` does not) |
| Fill | HP fraction in the card colour over a `#0B0E1A` trough; a 0.3 s lagging pale ghost shows the last chunk lost |
| **Phase pips** | small diamonds sitting **on the bar at each threshold** (King 50 / 25 %; Treant 60 / 30; Pharaoh 50 / 25; Queen 70 / 40 / 15; Titan 60 / 25; Warden 66 / 33), hollow until crossed, then filled and pulsed once; the kid sees where the next phase begins |
| Enrage | when the boss light is `#FF5050` (§2.1.5), the bar's rim pulses that colour at 2 Hz and a small ember glyph appears after the name; `<Boss name> enrages!` is the announce |
| Shield pools | a thin ice-white segment `#F2F7FF` overlaid on the fill for `summonShield`, `reflectShield` (shows for 12 s cycles), the cocoon (a full-width closed-lid state with `IMMUNE` in small caps); the Titan's four plates as four small plate pips under the bar (N S E W) that crack and go dark |
| Cage (Kid Snatch) | a gold sub-bar under the boss bar while the cage is active, captioned verbatim `CAGE — HIT NOW!  [N captured]` while exposed and `CAGE  [N captured]` otherwise (two spaces, canon); the captured heroes' portraits take v27's `grayscale(0.6) brightness(0.7)` and a bars overlay in `boss.cage.iron`, **restored on release** (v27 never restored them); the world label `HIT CAGE!` floats over the cage while exposed |
| Kidnap | a red sub-bar `INTERRUPTING KIDNAP: N%  (<HERO>)` (verbatim, `kpct = kidnapDmg / 150`) for the 4 s; the targeted portrait pulses rift cyan |
| Milestones | `Boss weakening!` / `<Boss name> weakening!`, `Halfway there!`, `Almost defeated!` as announces in their v27 colours (`#E8A838`, `#D88030`, `#D84830`) |
| Damage numbers | `heroes.md` §2.5.12 billboards at the hit point on the boss body (not its centre); cage hits in `#E8A838` (v27 `dmgN` gold) at the cage; `IMMUNE!`, `REFLECTED!`, `BLOCK!`, `DODGE!` as in AR §14; the 30-number cap is shared |
| Mini-bosses | the guardian 80 × 8 world-anchored bar (`enemies.md` §2.7), never the boss bar |

### 2.5 The death beat (shared)

Fires at `hp ≤ 0` for every roster entry 1–6 and 10–12; mini-bosses use `enemies.md` §2.7's guardian death.

| t (s) | What |
|---|---|
| 0.00 | `hitStop 0.1` (the v27 site, kept); `screenShake(12, 0.5)`; every telegraph and hazard owned by the boss clears; every living add dies `glow_burst` (3D change: v27 left adds alive; a kid who just won should not be bitten by a sapling) |
| 0.10 | 35 particles in the boss palette (v27); `boom` 0.5 and `victory` 0.5 on the same beat (v27, both); the boss light fades over 1.0 s; the enraged grade fades over 1.0 s; the ×1.25 camera distance reverts over 1.5 s |
| 0.10–2.00 | the **death verb**, per boss (§2.6–2.16); the four kids play their victory clips staggered 0.15 s by index (`heroes.md` §2.4.1) |
| 0.10 | `<Boss name> DEFEATED!` (dungeon bosses, `#E8A838`) or `GOBLIN KING DEFEATED!` / `THE SHADOW IS VANQUISHED!`; achievements; XP; the tier-3 gear item and the guardian gold drop at the body |
| 2.00 | dungeon bosses: doors unlock, `showDungeonVictory` (`<name> CLEARED!`, the `DUNGEON_EQUIPS` card, `ui-ux.md`); lairs: the lair stays open as a place (§2.11, §2.12); the King: Act 2 (§2.6.6); the Queen: the ending (§2.16.1) |

`Ed's Landing` (any hero finishing a dungeon at exactly 1 HP) is checked at the dungeon exit, as v27 did.

### 2.6 The Goblin King and the Kid Snatch

#### 2.6.1 The Act 1 retune (stated once)

Story-beats moved the King from "after all five dungeons" (team level about 15–18) to the Act 1 climax at Crash Meadow (B1.10, team level about 6–8; the assumption is `boss.goblinKing.expectedTeamLv = 7`, a tunable checked at the Phase 2 playtest). v27's `2200 + teamLv × 140` HP and `dmg 35` at level 7 give 3,180 HP against a solo hero doing about 53 a hit (Liam at level 7): 60 hits, with a three-caged slam (`35 × 1.3 × 1.45 = 66`) taking 32 % of Collette's 204 HP. At v27's own spawn level the same formula gives 55 hits and 20 % per slam. **The rule:** HP `1400 + teamLv × 140`, dmg `28`; every other King number is verbatim. At level 7 that is 2,380 HP (45 hits) and 53 per caged slam (26 %), which is v27's felt fight at Act 1's level. Hard and NG+ wrappers apply on top (§2.1.3). No portal on death (story-beats §2.3).

#### 2.6.2 The King

| | |
|---|---|
| Data (verbatim unless noted) | `hp` §2.6.1 · `dmg 28` (§2.6.1) · `sz 36 px → hit radius 0.9 m` (P3 `38 → 0.95`) · `spd 70 / 80 / 105 px/s → 1.75 / 2.0 / 2.625 m/s` · `rng 50 → 1.25 m` · `cd 1.3 / 1.1 / 0.9` · `xp 150` · timers at spawn `atkT 2, slamT 5, summonT 12, chargeCD 8, spinT 10, throwT 4` · `effDmg = floor(dmg × cageBuff.dmgMul)` · move ×1.1 while any hero is caged |
| Height and silhouette | 2.9 m hunched bulk on short legs, shoulders 1.6 m wide, a crooked rust-iron crown with three spikes and three gem sockets (`#D84830`, `#4A9ED8`, `#3DCC7A`: the v27 gems, emissive, sparking at `0.6 + sin(gt·6)·0.4`), a 1.8 m cleaver-axe, a ragged red cape, and **the cage pole**: a crooked 2.2 m gibbet lashed to his back with the iron cage swinging from its tip 1.4 m over his head (top at 4.3 m). Read at distance: a crown, a cape, and a cage on a stick |
| Palette | `boss.king.hide` / `.dark` / `.crown`; skin the horde's rust `#8B3A1E`; the cape `#5C0000`; eyes `boss.king.eye.p1/p2/p3` at 0.12 m (P3 0.15 m, v27 5 → 6 px) with a bloom halo that grows with the phase (v27 `shadowBlur 8 + phase × 4`) |
| Motion signature | cape on v27's two curves (`sin(gt·1.5)`, `sin(gt·2)`), axe rocking `sin(gt·2)·0.25` rad, gems sparking at 6 rad/s, the cage swaying at 0.7 rad/s with its own captives' idles inside, breathing at 1.5 rad/s. Five rates; nothing on him is still |
| Phase tag | v27's label under the boss (`PHASE 1` / `WEAKENING` / `ENRAGED`) moves onto the boss bar as a small tag after the name (`ui-ux.md`) |
| Arena: **Crash Meadow** | Story-beats' 45 × 45 m meadow centred (60, 0). When the squad enters its 22 m disc with `hollowGroveCleared`, a **28 m palisade ring** of sharpened stakes and four war-totems (the horde raised it overnight) punches up out of the grass in 0.8 s with dust, sealing the fight; the King crashes through the Ridge-side stakes (the reveal clip). The stakes are the charge walls. Ground: flat grass, the crash furrow's east end as a 0.3 m trench (no gameplay), two goblin loot carts at the ring's edge as 1.2 m cover from the P3 barrels. Light: the island keyframe at whatever hour B1.10 falls, the four totem braziers emissive-only (the pool's two world slots go to `light.boss` on the crown and the nearest brazier), `light.boss` range 4 m. After the death beat the stakes topple outward over 2 s and stay as a landmark the player made (like `enemies.md`'s cleared camps) |

#### 2.6.3 The Kid Snatch, faithfully

**What does not change (v27 verbatim):** the active hero is exempt; every other unlocked, living, non-downed hero is taken regardless of distance (`grabRadius 9999`); caged heroes leave the sim (no update, no cooldowns, no regen, no damage, cannot be switched to, including from the portrait and touch paths that v27 forgot to guard); cage HP `200 + teamLv × 15`; the King gains `dmgMul 1 + 0.15n` and `shieldPct 0.05n` (three caged: ×1.45 and 15 % reduction) and moves ×1.1; the cage is hittable **only while exposed**; Ground Slam exposes it 2 s, a wall stun 3 s; one hero is freed per `1/n` of cage HP lost and all at 0; a freed hero lands topped up to at least 50 % HP; the four caged lines at their indices and timings; every string; the P3 throw.

**What changes for 3D (each in §6):**

| v27 | 3D |
|---|---|
| The cage is drawn 15 px above the boss; hit routing is "attack from above the King's centre" (`src.y < boss.y − 10`) | The cage is a **real collider**, a 1.6 × 1.4 × 1.2 m iron cage (`boss.cage.iron`, gold rim `boss.cage.gold` when exposed, the `enemies.md` §2.8 cage's bigger brother) hanging from the pole. **Unexposed:** it swings 1.4 m over his head, out of every hero's reach (1.8 m melee reach vs a 3.6 m cage centre) and projectiles that touch it ring off (`IMMUNE!` in cage gold). **Slam window (2 s):** the pole tips forward on the slam and the cage swings down to 1.2 m in front of him, at chest height. **Wall-stun window (3 s):** he sags against the stakes and the cage drops to the ground at his side. Whichever collider a hit reaches first takes it; the positional puzzle becomes "reach the cage where it swings" |
| Captured heroes drawn as 3 px dots | The three kids crouch inside, faces to the bars in their `hit` poses; Isabella rattles the bars every 2 s; the caged idle runs on the presentation clock so they never freeze |
| Lines in the first captive's colour | Each line in **its speaker's own `glow`** as a bubble from the cage and an announce (`story-beats.md` §2.5) |
| Freed heroes appear 40–80 px below the King | 1.5–2.5 m from him on the side facing the active hero, popping out of the cage door over 0.4 s, `_rescueGrace 3` so the formation slot does not yank them (`heroes.md` §2.5.11) |
| The grab is a teleport | At 2.1 s the cage swings down on its chain and three shadow-hand tethers (0.4 s, the `tether` beam in `boss.king.hide`) pull the companions into it; `boss.cageShut` |
| Portraits greyed and never restored | `ui-ux.md` §2.4 hooks: `boss.cage.state { active, exposed, exposeTimer, hp, maxHp, captured: idx[] }` published every step; portraits restored on release |
| `HIT CAGE!` drawn on canvas | A world-anchored label over the cage, `#E8A838`, only while exposed |

**Opening timeline (sim clock; the intro's 4.1 s has already run):**

| t (s) | v27 | 3D read |
|---|---|---|
| 0.0–1.5 | frozen, `screenShake(windup × 4, 0.1)` ramping 0 → 6 | he plants the pole, throws his head back, crown gems flare; the shake ramps under him; no telegraph (it is not an attack yet) |
| 1.5 | `boom` 0.5, `screenShake(15, 0.8)`, `GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"` `#D84830` 3 s; `radialBlast(chargeTime 0.3, radius 200 px → 5 m, push 150 → 3.75 m/s, dmg 15)` | the roar; a 0.3 s hatched circle 5 m; the party thrown outward |
| 2.1 | `kidSnatch(cageHp 200 + 15 × teamLv, exposeDuration 2, buffPerHero 0.15, grabRadius 9999)`; `Heroes captured!` `#D84830` 2.5 s | the swing-down, the tethers, the cage shuts, the pole snaps back up; the boss bar grows the gold cage sub-bar |
| 3.6 / 4.8 / 6.0 | the caged lines at `1500 + ci × 1200` ms after the snatch, in capture order (hero index order for the three companions) | `NOAH: "Hey! Let me out!"` in Noah's glow; `COLLETTE: "The structural integrity of this cage is actually pretty— OW."` in Collette's; `ISABELLA: "WHOA! NOT COOL!"` in Isabella's; index 0 (Liam) is silent and index 4 (`HEY! LET ME OUT!`) stays in the data table, unreachable (canon, `story-beats.md` §2.5) |

The kid playing the one free hero is alone with a buffed King; that is the single hardest control state in the game (CM §3.8), and it is the point. The two windows are readable at the camera because the cage physically comes down.

#### 2.6.4 Phases

| Phase | Enter | Banner, shake | Stats | Loop (timers verbatim) |
|---|---|---|---|---|
| P1 | spawn | `THE GOBLIN KING APPEARS!` `#ff0000` 4 s (at 4.10 s of the intro) | spd 1.75, cd 1.3 | **Melee**: within 1.25 m, hatched circle 1.875 m, 0.8 s windup, `effDmg`, shake 6 / 0.15 · **Ground Slam** (`groundSlam`): hero within 6.25 m and `slamT ≤ 0` → cd **6**, hatched circle **4.25 m**, `1.3 × effDmg`, 25 particles `#8B0000 / #ff4444 / #E8A838 / #ff6b6b`, **exposes the cage 2 s** · **Summon** (`summon`): every **10** s, **3** adds of one type from `goblin / orc / archer` at 1.25–2.5 m, `Minions, attack!` `#ff4444` 1.5 s |
| P2 | `hp ≤ 50 %` | `PHASE 2 — THE KING WEAKENS!` `#E8A838`, shake 10 / 0.6; transition clip: he staggers, tears a stake from the ring and hurls it aside | spd 2.0, cd 1.1, `chargeCD 0` | as P1 with slam cd **5**, summon **4** every **8** s, plus **Charge** (`chargeAttack`): hero at 2–12.5 m and `chargeCD ≤ 0` → cd **7**, 12.5 m/s for 0.7 s, `effDmg`, on a wall: `Stunned!`, stun 3 s, **cage exposed 3 s** · **Spin** (`spin`): `spinT ≤ 0` → cd **8**, `The King spins!` `#D84830`, `whirl` 0.3, 3.75 m, 1.5 s, `0.8 × effDmg`, knockback 3 m/s, then dizzy 1.5 s (a free window) |
| P3 | `hp ≤ 25 %` | `PHASE 3 — DEATH OR GLORY!` `#ff0000`, shake 15 / 0.8; transition clip: **the cage throw** (below) | spd 2.625, `dmg = floor(dmg × 1.3)`, cd 0.9, radius 0.95 m, eyes 0.15 m | slam cd **3.5**, radius **5.0 m**; summon **5** every **6** s from `orc / troll / shielded`; charge cd **5**; no spin; **Throws** (`projectilePattern scatter`): every **2.5** s, three barrels at ±0.3 rad, `5 ± 0.75 m/s`, `0.6 × effDmg`, radius 0.15 m, life 2 s, `#8B4513` barrels tumbling, `magic` 0.2; each barrel draws a 0.3 s line |

**The cage throw (P3 entry, if the cage is still active):** `freeAllCaged` (`ALL HEROES FREE!` `#E8A838` 3 s, `victory` 0.3, shake 8 / 0.4), then `The King throws the empty cage!` `#D84830` 2 s: he rips the pole off his back and hurls the cage at the active hero (`CONTROL_MODEL` §2.2: the King aims at the active hero): a projectile at `300 px/s → 7.5 m/s`, `dmg 50`, hit radius `12 px → 0.3 m`, life 2 s (15 m), with a 0.3 s hatched line (3D change: v27 had no telegraph, and the telegraph rule has no exceptions). Where it lands it stays for the rest of the fight as a **wrecked cage prop**, 1.4 m of cover against barrels (3D change). If the cage was already emptied, the throw still happens with the empty cage (v27: only if `_cage.active`; 3D change: the pole comes off either way so P3's silhouette changes, but the projectile only flies if the cage was still up).

Milestones: `Boss weakening!` `#E8A838` below 75 %, `Halfway there!` `#D88030` below 50 %, `Almost defeated!` `#D84830` below 25 % (SI §18.3).

#### 2.6.5 Every line, at its trigger

| Line (verbatim) | Colour | Trigger |
|---|---|---|
| `THE GOBLIN KING` / `Ruler of the Horde — Kid Snatch!` | `#D84830` card and border | the intro card at 0.8 s |
| `YOU'RE BIG. I'M NOT SCARED OF YOU.` (Isabella `boss_appear`) | `hero.isabella.glow` | 1.6 s into the intro, once per playthrough; if Isabella is downed at the time the line still fires (she is not in a cage yet) |
| `THE GOBLIN KING APPEARS!` | `#ff0000` 4 s | 4.10 s, sim resume |
| `GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"` | `#D84830` 3 s | 1.5 s after resume |
| `Heroes captured!` | `#D84830` 2.5 s | the snatch, 2.1 s |
| `NOAH: "Hey! Let me out!"` · `COLLETTE: "The structural integrity of this cage is actually pretty— OW."` · `ISABELLA: "WHOA! NOT COOL!"` | each speaker's glow | 1.5 s + 1.2 s × capture position after the snatch; a captive who is the active hero is not caged and says nothing |
| `CAGE — HIT NOW!  [N captured]` / `CAGE  [N captured]` · `HIT CAGE!` | gold / grey · `#E8A838` | the cage sub-bar caption · the world label while exposed |
| `Minions, attack!` | `#ff4444` 1.5 s | every summon |
| `The King spins!` | `#D84830` 1.5 s | every spin (P2) |
| `Stunned!` | `#3DCC7A` 1.5 s | a charge hits the stakes |
| `<HERO> freed!` · `ALL HEROES FREE!` | `#3DCC7A` 2 s · `#E8A838` 3 s | a cage threshold · cage at 0 or the P3 throw |
| `PHASE 2 — THE KING WEAKENS!` · `PHASE 3 — DEATH OR GLORY!` · `The King throws the empty cage!` | `#E8A838` · `#ff0000` · `#D84830` | 50 % · 25 % · P3 entry with a live cage |
| `Boss weakening!` · `Halfway there!` · `Almost defeated!` | `#E8A838` · `#D88030` · `#D84830` | 75 / 50 / 25 % |
| `GOBLIN KING DEFEATED!` | `#E8A838` 4 s | death |
| `And THAT is how it's done.` (Collette `victory`) | `hero.collette.glow` | 1.5 s after `GOBLIN KING DEFEATED!` (story-beats §2.5), once per playthrough, if Collette is alive |
| Bestiary: `The Goblin King` · `Ruler of the Horde. Charges, summons minions, and slams the ground.` | — | `ui-ux.md` bestiary card |

#### 2.6.6 Death, drops, and what follows

The death beat (§2.5) with the King's verb: he drops the axe, sways, and topples backward over 1.2 s; the crown rolls 2 m and settles (a prop that stays: the family's first trophy at Crash Meadow); the gems go dark. Any caged hero is freed first (v27). +150 XP, `King Slayer`, the tier-3 gear roll, guardian gold, `bossDefeated.goblinKing`. Then story-beats B2.1: `goblinKingDefeated`, camp C4, the hangar, `island_unlocked.frozen`, the meteor armed for the next dusk. Nothing spawns a portal. If the party wipes, the palisade stays and the King returns at his current phase on the next meadow entry after a camp rest (3D change: v27 could not wipe to an overworld boss without a game over; the retry keeps Act 1 from ending at a game-over screen).

### 2.7 Ancient Treant (The Hollow Grove, B1.8)

| | |
|---|---|
| Card | `Ancient Treant` / `Guardian of The Hollow Grove`, card colour `#58B888`; Liam's `boss_appear` at 1.6 s: `That was fine. That was totally fine. I'm fine.` |
| Data (verbatim) | `hp 800 + teamLv × 80` · `dmg 30` · `sz 30 → 0.75 m` · `spd 35 → 0.875 m/s` (P2 0; P3 `55 → 1.375`, ×0.4 if slowed) · `rng 50 → 1.25 m` · `cd 1.5` · timers `saplingT 8, sweepT 10, blastT 15 (then 12), vineGrabT 6, spriteT 12, specialT 5` |
| Phases (canon) | **P1** 100–60 % vine grabs and sprites · **P2** 60–30 % planted with root zones and saplings · **P3** 30–0 % uprooted aggression |
| Height and silhouette | 5.5 m trunk-body with a 7 m canopy crown at 7 m, two branch arms 3 m long, a bark face at 3.5 m whose eyes are sap-glow slits, root-bundle feet that lift and plant with a dust ring per step. Read at distance: the only tree in the room that walks |
| Palette | `boss.treant.bark` / `.moss` / `.sap`: bark from rot-brown, canopy from moss, the v27 `#58B888` kept as emissive sap in every crack (the boss light sits behind the face) |
| Motion signature | canopy sway 0.8 rad/s, branch creak 0.5 rad/s (a lag on the arms), sap pulse 1.2 rad/s, leaves falling from the crown always (`pt.leaf` from `world-events-weather.md` at 4/s), breathing 1.5 rad/s |
| Arena | 20 × 16 m grove hall at the Rootways' heart under a canopy tier (`dungeons.md` owns the room's root-wall rhythm; during the boss the walls hold still). Floor: moss and root ridges 0.2 m; no cover needed (P1 is grabs, P2 is zones, P3 is one big blast). Fog `dng.forest`, `light.heroPool` 6 m, `light.boss` on the face, range 4 m; Collette's orb lights the glow-moss paths (Brief §5.3) |

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | spawn | — | spd 0.875 | **Melee** hatched circle 1.875 m, 0.8 s, `dmg`, `hit` 0.2 · **Root Grab** (`grab`): every 6 s with a hero within 5 m: `Root Grab!` `#58B888` 1.5 s, `magic` 0.2, hatched circle 2 m on the target for 1.0 s, target stunned 2 s, zone 2.0 s at 12 DPS with 0.3 s re-stuns, 8 green particles · **Sprites** (`summon`): every 12 s, **3 × Forest Sprite** (`bat` recolour, `enemies.md` §2.9, hp 25) at ±2 m, `Sprites emerge!` |
| P2 | `hp ≤ 60 %` | `The Treant plants itself!` `#58B888`, shake 10 / 0.5; **and** `Ancient Treant enrages!` `#ff4444` 2.5 s with `boss` 0.4 folded in (§2.1.2); transition clip: the feet drive into the floor, three root-knots rise | `_planted`: spd 0, `dmg = floor(dmg × 1.1 × 1.15)`, **30 % damage reduction** (`amt × 0.7`) held by the knots, melee reach `rng + 50 px → 2.5 m` | **Root network** (`arenaHazard`): every 5 s, **3** poison zones r 1.25 m, life 6 s, 10 DPS, at random arena points, `Root network spreads!` (stops when all knots are severed) · **Saplings** (`summon`): every 8 s, **2–3 × Sapling** (`slime` recolour bark/moss, hp 40, spd 0) at ±3 m, `Saplings sprout! Kill them fast!`; a Sapling alive 5 s after sprouting (the dead `_saplingTimer 5`) sends a root line to the Treant and **heals it `floor(maxHp × 0.02)` per second** until it dies (a `tele.benefit` dashed ring under the Treant while any sapling feeds it) · **Branch Sweep** (`sweep`): every 7 s with a hero within 5 m, `Branch Sweep!`, `boom` 0.3, cone 57° × 4.5 m, 0.8 s, 30 DPS for 0.8 s · **Root knots** (`rootKnots`): 3 × 40 HP at 4 m; each severed −10 points of DR (Elm's line 2: `The Hollow Grove Treant draws strength from the earth. Sever the roots!`) |
| P3 | `hp ≤ 30 %` | `The Treant UPROOTS!` `#D84830`, shake 15 / 0.8; **and** `FINAL PHASE!` `#ff0000` 2 s; clip: the roots tear free, the knots die, the canopy drops half its leaves | `_planted` off, spd 1.375, `dmg = floor(dmg × 1.3)`, enraged light, melee reach `rng + 30 → 2.0 m` | **Leaf Explosion** (`radialBlast`): `blastT` 12 s, `Leaf Explosion!`, chargeTime 1.2 s, radius 5 m, push 4.5 m/s, `0.8 × dmg`, plus 20 leaf particles (`grav 20 → 0.5 m/s²`, drag 0.98) in `#D88030 / #D84830 / #E8A838 / #B06020` · melee · the root network and saplings stop; the sprites do not return |

Milestones: `Ancient Treant weakening!` / `Halfway there!` / `Almost defeated!`. Death verb: the canopy sheds every leaf over 3 s (the leaf recipe ×5), the trunk splits down the face and settles into a stump the size of a table, sap glow out; the **Hearthroot Seed** (`+3 HP regen/s all`, `#58B888` 🌿) sits on the stump. `Ancient Treant DEFEATED!`, `Dungeoneer` on the first clear, tier-3 roll. Elm's line 3 on the walk out (story-beats B1.9). Bestiary: `Guardian of the Hollow Grove. Heals itself and summons root grabs.` (the saplings make "heals itself" true). Adds by key: `bat` · Forest Sprite (moss wings `#3A7D44` / `#123524`); `slime` · Sapling (bark crust `#4A3524`, moss dome; kept off the green band per `enemies.md` §2.9).

### 2.8 Pharaoh Wraith (The Buried Tomb, B2.13)

| | |
|---|---|
| Card | `Pharaoh Wraith` / `Guardian of The Buried Tomb`, card colour `#E8A860` (card text only) |
| Data (verbatim) | `hp 750 + teamLv × 80` · `dmg 28` · `sz 28 → 0.7 m` · `spd 50 → 1.25 m/s` · `rng 45 → 1.125 m` · `cd 1.3` · timers `teleT 5, spreadT 4, sumSoldierT 10, phantomTimer 6` |
| Phases (canon) | **P1** 100–50 % teleport and spread shots · **P2** 50–25 % cocoon (sarcophagus) and scarab swarms · **P3** phantom split |
| Height and silhouette | 2.6 m of bone-linen wraps hovering 0.4 m up, no legs, a hollow dark where the body should be, two long wrapped arms, a crook-staff 1.6 m, and a turquoise-and-ochre **death mask with a 0.6 m crown**. Read at distance: a floating mask over a drift of bandages |
| Palette | `boss.pharaoh.linen` / `.void` / `.mask` / `.sun`; eyes emissive oasis turquoise; the boss light behind the mask; the v27 `#E8A860` body colour retired (Noah's band) |
| Motion signature | hover bob 0.9 rad/s, wraps trailing on the floater ribbon shader (0.6 rad/s), the mask tilting 0.4 rad/s, sand streaming off the hem always |
| Arena | 20 × 16 m tomb hall, the sarcophagus on a 0.6 m dais at the north wall (it is the cocoon mesh), **five sun-marks**: ochre sun-glyph decals 1.5 m at the four corners (2.5 m inset, v27 `(100,100)`-style anchors) and the centre, each lit by a sunbeam from a ceiling slot (the beam-and-mirror language of `dungeons.md`, which decides whether the beams are player-routable before the fight). Four 0.8 m pillars at the quarter points block spreads (cover). Fog `dng.desert` (the brightest dungeon), `light.heroPool` 6 m, `light.boss` 4 m on the mask. Sand-flow floor idle only |

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | spawn | — | spd 1.25 | **Melee** hatched circle 1.75 m, 0.8 s, `dmg`, `hit` 0.2 · **Blink** (`blink`): every 6 s to a random other sun-mark: the destination glyph brightens under a dashed ring 1.5 m for 0.8 s, then `portal` 0.3, 10 sand particles, and he is there (Sol's line 2: `The Pharaoh Wraith blinks between sun-marks. Track the afterimage.`) · **Sand spread** (`projectilePattern fan`): every 3 s, three darts at `sa + (i − 1) × 0.3` rad, `180 → 4.5 m/s`, `0.7 × dmg`, radius 0.125 m, life 2 s, `magic` 0.2, ochre emissive; a hero hit is **cursed 4 s** (`src.cursed`: deals 70 % damage; a violet-sand rim; makes the bestiary's `Curses heroes` true, the field v27 read but never set) · **Sand Soldiers** (`summon`): every 10 s, **2–3 × Sand Soldier** (`orc` in bone wraps, hp `floor(40 × (1 + 0.04 × teamLv))`) rising from the floor over 0.8 s at ±3.75 m, `Sand soldiers rise!` (the bestiary's mummies) |
| P2 | `hp ≤ 50 %` | `The Wraith retreats into the sarcophagus!` `#C8983C` 3 s, shake 10 / 0.5; `Pharaoh Wraith enrages!` folded in (spd ×1.2 applies when he re-emerges) | `cocoon(waves 2, waveInterval 6, stunDuration 5, dmgMul 1.5)`, invulnerable | the Wraith flies back into the sarcophagus and the lid slams: `Sarcophagus sealed! Survive the scarabs!` `#C8983C`; at 6 s and 12 s: `Scarab swarm!` `#8B7040`, **12–15 × Scarab** (`bat` in bone shell, hp 15, dmg 8, spd `100 → 2.5 m/s`) pouring from the lid's crack at ±3.75 m, `The cocoon cracks!` `#E8A838`; 3 sand grains/s from the cracks; then `The cocoon shatters! VULNERABLE!` `#3DCC7A` 2.5 s, shake 12 / 0.5, `boom` 0.4, 20 shards `#C8983C / #E8A838 / #fff`: the Wraith is stunned 5 s and the next hit lands ×1.5 |
| P3 | the stun ends, **or** `hp ≤ 25 %`, whichever first (v27 auto-advances when the stun ends; kept) | `PHANTOM SPLIT! Find the real Wraith!` `#C8983C` 3 s, shake 12 / 0.6; `FINAL PHASE!` folded in | `phantomSplit`: 2 × Phantom Wraith (`wraith` in ochre-sand shroud, hp 50, spd 1.5 m/s) + the real one; all three carry the bar tag but only the real one has the boss bar's HP | every 6 s all three blink to fresh sun-marks (`The phantoms shift!`, 15 particles); the real Wraith **leaves a sand afterimage** for 0.6 s (Sol: `Track the afterimage.`); a decoy that dies bursts into **3 Scarabs**; spreads every 2.5 s at `200 → 5 m/s`, `0.6 × dmg`, radius 0.1 m, life 1.8 s from the real one only; melee from all three (decoys at `dmg × 0.5`) |

Milestones: `Pharaoh Wraith weakening!` / `Halfway there!` / `Almost defeated!`. Death verb: the wraps unwind over 2 s and blow away as `pt.sand`, the mask falls and rings once on the dais; the **Sunstone Crest** (`+12% crit chance`, `#E8A860` 👹; writes `crit`, `heroes.md` §2.5.10) on the dais. `Pharaoh Wraith DEFEATED!`, Sol's line 3, `★ GOLDEN CHEST! ★` is the overworld's. Bestiary: `Teleports across the arena. Curses heroes and summons mummies.` Adds by key: `orc` · Sand Soldier; `bat` · Scarab; `wraith` · Phantom Wraith (all `enemies.md` §2.9).

### 2.9 Hydra Matriarch (The Sunken Temple, B2.11)

Canon is a bestiary line (`Multiple heads attack simultaneously. Splits into more heads at low HP.`), Fern's tip (`The Hydra has many heads. Kill it before it splits!`), two announces (`Poison pools!`, `The Hydra splits!`), the quest (`Defeat the Hydra Matriarch.`) and the numbers. The phases below are built from the blocks in that spirit.

| | |
|---|---|
| Card | `Hydra Matriarch` / `Guardian of The Sunken Temple`, card colour `#70C090` (the bestiary colour; v27's `#58B888` body was the Treant's, FC §13) |
| Data (verbatim) | `hp 850 + teamLv × 80` · `dmg 25` (`floor(dmg × 0.7)` after the split) · `sz 28 → 0.7 m` · `spd 40 → 1.0 m/s` · `rng 45 → 1.125 m` · `cd 1.2` · `heads 3 → 5` · pools every 7 s (5 s at P2+), 2 (3 at P2+), r `40 → 1 m`, life 6, 8 DPS · strike telegraph r `50 → 1.25 m`, 1.0 s, active 0.5 s at 15 DPS + `dmg` |
| Phases (new, from the blocks) | **P1** 100–50 % three heads and pools · **P2** 50–25 % `The Hydra splits!`, five heads · **P3** 25–0 % the flood |
| Height and silhouette | a 3 m rot-brown body low in the water with three (then five) necks fanning to 3.8 m, bone fangs, phosphor eyes; each head weaves on its own. Read at distance: a fan of necks over the reeds, bigger than the Swamp Hydra, and it never leaves the water |
| Palette | `boss.hydra.scale` / `.deep` / `.belly` / `.eye` (the Swamp Hydra's family, `enemies.md` §2.1 row 20) |
| Motion signature | each neck weaves at its own rate (0.7 / 0.9 / 1.1 / 1.3 / 1.5 rad/s), the body rolls 0.4 rad/s, ripples from the necks, breathing 1.5 rad/s |
| Arena | 20 × 16 m flooded nave: knee-deep water (`#0B2B2E` teal-black, the water shader) with **raised stones** 1.5 m across in a broken grid (the lily-pad / sinking-stone language `dungeons.md` teaches earlier), the Matriarch's pool at the north end 6 m across. Fog `dng.bog`, `light.heroPool` 6 m, `light.boss` 4 m in the body, the lantern posts on the nave columns are cover for nothing (heads strike from above) |

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | spawn | — | heads 3 | **Head strikes** (`multiStrike`): every `cd` 1.2 s with a hero within `rng + 30 px → 1.875 m` of any head's reach (heads reach 5 m from the body; the body does not chase, it *turns*): `min(3, aliveHeroes)` targets each get a hatched circle 1.25 m for 1.0 s, then `dmg` and a 0.5 s 15 DPS bite zone; `hit` 0.2 · **Poison pools** (`arenaHazard poison`): every 7 s, 2 pools r 1 m, life 6 s, 8 DPS at random floor points, `Poison pools!` · **Heads as targets** (new): each head has a collider and a **stagger meter** (60 damage → the head droops into the water for 4 s and does not strike); damage to a head is damage to the body; the meter is the "many heads" read in 3D |
| P2 | `hp ≤ 50 %` | `The Hydra splits!` `#58B888`, shake 10 / 0.6 (the generic enrage shake), `boss.hydraSplit`; `Hydra Matriarch enrages!` folded in; clip: two necks tear out of the body's back over the 1.5 s | heads 5, `dmg = floor(dmg × 0.7)` (then ×1.15 enrage), spd ×1.2 (the turn rate) | strikes now pick `min(5, aliveHeroes)` targets, so every hero gets a circle and the second and third heads on a target arrive 0.3 s apart (two circles on one kid means move twice); pools every 5 s, 3 at a time. Fern's `Kill it before it splits!` is advice a kid can act on: the P1 → P2 window is where the ultimates go |
| P3 | `hp ≤ 25 %` | `FINAL PHASE!` `#ff0000`; **`The water rises!`** **[new text]** `#6CE87A` 2 s; clip: the body rears and the pool overflows | as P2 | **The flood** (`arenaHazard` band): a poison band advances from the nave's edges inward 0.5 m every 6 s (a hatched **band** with a moving inner edge), so the dry floor shrinks toward the raised stones; standing in the band is 8 DPS; the stones stay dry. Strikes and pools continue; every third strike volley is all five heads on the **active** hero (0.3 s apart) |

Milestones: `Hydra Matriarch weakening!` / `Halfway there!` / `Almost defeated!`. Death verb: the necks fall one by one into the water over 2 s and the body sinks with rings; the flood drains in 3 s; the **Marshlight Vial** (`+15% lifesteal`, `#70C090` ☠️; lifesteal now works on every attack type) floats up on the last ripple. `Hydra Matriarch DEFEATED!`, Fern's line 3. No adds by key: the heads are the crowd.

### 2.10 Frost Lich (The Ice Citadel, B2.7)

Canon: `Freezes heroes solid. Summons ice walls and devastating blizzards.`, Neve's `The Frost Lich summons blizzards. Hit hard to break the channel.`, three announces, the numbers.

| | |
|---|---|
| Card | `Frost Lich` / `Guardian of The Ice Citadel`, card colour `#A8D0E8` |
| Data (verbatim) | `hp 800 + teamLv × 80` · `dmg 28` · `sz 26 → 0.65 m` · `spd 45 → 1.125 m/s` · `rng 50 → 1.25 m` · `cd 1.4` · Deep Freeze every 7 s (5 s at P2+) on a hero within `200 → 5 m`: stun 2.5 s + **flat 50** · ice walls every 10 s (6 s at P2+), 2 (3 at P2+), 60 HP · blizzard (P3) every 12 s: r `300 → 7.5 m`, telegraph 1.5 s, 4 s, 6 DPS, **broken by any single hit over 15** |
| Phases (new, from the blocks) | **P1** 100–50 % freeze and walls · **P2** 50–25 % the walls close in · **P3** 25–0 % BLIZZARD |
| Height and silhouette | 2.8 m hovering 0.3 m up: a long indigo robe with no feet, a snow-bone skull under an ice crown of five spikes (0.5 m), an ice staff 2 m with a lens at its head. Read at distance: a crown and a staff floating in the blue, taller than anything in the Observatory |
| Palette | `boss.lich.robe` / `.ice` / `.bone`; eyes ice `#8FD3F4` emissive; the boss light in the staff lens |
| Motion signature | hover 0.7 rad/s, robe hem on the ribbon shader 0.5 rad/s, the crown's aurora shimmer (`uAurora` from `world-events-weather.md` §2.3.3 at 0.3), frost breath every 3 s |
| Arena | 20 × 16 m **lens room** at the top of the Observatory: a round floor of blue ice (sliding momentum, `dungeons.md`'s ice physics) under the dome, the great lens overhead, the aurora visible through it at night (the Observatory's aurora mechanisms are `dungeons.md`'s; the fight does not need night). Fog `dng.frozen` (the darkest dungeon), `light.heroPool` 6 m, `light.boss` 4 m. Ice walls are the cover and the obstacle: they block movement and projectiles (`arenaHazard wall`, 60 HP, 2 m × 1.6 m, shatter into 8 ice shards) |

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | spawn | — | spd 1.125 | **Melee** hatched circle 1.875 m, 0.8 s (a staff sweep) · **Frost bolt** (`projectilePattern fan 1`, new basic ranged so the Lich is not a melee floater): every 2.5 s at a hero beyond 3 m, `7 m/s`, `0.6 × dmg`, radius 0.16 m, life 1.5 s, `slow 2` (the Wyrm's bolt, `enemies.md` §2.4), `magic` 0.2 · **Deep Freeze** (`containment` ice): every 7 s on a hero within 5 m: `Frozen solid!` `#A8D0E8`, `magic` 0.3, the hero takes 50 and is **encased**: `containment(radius 1.25 m, hp 120, maxTime 2.5 s, dotDmg 2)`; siblings breaking the block end the stun early (`Field broken!`); companions attack a sibling's ice block within 5 m before any enemy (a companion rule for `heroes.md` §2.5.11, §5) · **Ice walls** (`arenaHazard wall`): every 10 s, 2 walls at random floor points, `Ice walls!` |
| P2 | `hp ≤ 50 %` | `Frost Lich enrages!` `#ff4444`, shake 10 / 0.6, `boss` 0.4; clip: the crown flares and the lens overhead frosts | spd ×1.2, dmg ×1.15 | Deep Freeze every 5 s; walls every 6 s, **3**, now placed **between the Lich and the party** (cover for him; Noah must move) and one **behind the active hero** (a wall to get pinned against); frost bolts every 2 s |
| P3 | `hp ≤ 25 %` | `FINAL PHASE!` `#ff0000`, shake 12 / 0.5; clip: he rises to 1 m and the dome's lens goes white | as P2 | **BLIZZARD** (`channel`): every 12 s, `BLIZZARD!` `#ff4444`, a hatched circle sweeping to 7.5 m over 1.5 s, then a 4 s band at 6 DPS to everyone inside with the room's visibility at `visOverride 4` (the blizzard weather recipe indoors, `world-events-weather.md` §2.8.5) and enemy-style aggro cut; **any single hit over 15 breaks it** (Neve: `Hit hard to break the channel.`): the channel bar on the boss bar, `boss.channelBreak`, the Lich staggers 1.0 s. Deep Freeze and walls continue between channels |

Milestones: `Frost Lich weakening!` / `Halfway there!` / `Almost defeated!`. Death verb: the robe collapses and the crown and staff shatter into ice over 1.5 s; every ice wall shatters with him; the lens overhead clears; the **Hearthice Crown** (`Attacks slow +1s`, `#A8D0E8` ❄️) drops where he hovered. `Frost Lich DEFEATED!`, Neve's line 3. No adds.

### 2.11 Crystal Colossus and The Crystal Depths (lair, B2.14)

Canon: `Reflects ranged attacks with its crystal shield. Fires a sweeping beam.`, Quartz's `Crystal Colossus reflects projectiles. Get in close when the shield shimmers.`, `Crystal Beam!`, `Defeat the Crystal Colossus.`, `Clear the Crystal Depths` (the spark plug), the lair card `The Crystal Depths` / `Crystals pulse with eerie light. A colossus guards the heart.`, the lore `Crystal light flickers in the depths...`.

| | |
|---|---|
| Card | `Crystal Colossus` / `Guardian of The Crystal Depths`, card colour `#8E98D8`; Noah's `boss_appear` at 1.6 s: `That boss has really interesting armor actually. Like the craftsmanship is— OW. Fighting. Right.` |
| Data (verbatim) | `hp 900 + teamLv × 80` · `dmg 35` · `sz 32 → 0.8 m` · `spd 30 → 0.75 m/s` · `rng 55 → 1.375 m` · `cd 1.8` · slam every 6 s (4 s at P2+) with a hero within `150 → 3.75 m`: `1.3 × dmg` within `120 → 3 m`, shake 10 / 0.5, `boom` 0.4, 12 crystal particles · beam (P2+) every 5 s: ±0.15 rad to 6.25 m, telegraph 1.2 s, sweep 1.5 rad/s for 2 s · reflect shield |
| Phases (new, from the blocks) | **P1** 100–50 % the shield cycles · **P2** 50–25 % the beam · **P3** 25–0 % the heart open, crystals fall |
| Height and silhouette | 4.5 m upright slate colossus, square shoulders each carrying a 1 m crystal spar, more spars down the back, two ice-white eyes, and a **crystal heart** in the open chest, `boss.colossus.heart` `#00D2FF`, that the whole lair pulses with. Read at distance: a walking boulder with a cyan light in its chest; the Golem's big brother |
| Palette | `boss.colossus.slate` / `.crystal` / `.heart`; the reflect shimmer white |
| Motion signature | heart pulse 0.6 rad/s (shared with every rim crystal in the lair: one oscillator, §3), stomp with a ground ring per step at 0.4 Hz, spar chime flash on reflect, breathing 1.5 rad/s |

**The Crystal Depths (the lair).** At (30, 110) of the Crystal Caves under-region (story-beats §2.2), reached by a 4 m tunnel from the Golem's Gallery side: a **40 m circular cavern** with a slate floor veined by crystal lines that radiate from the centre and light in sequence with the heart's pulse. Twelve rim clusters 2–4 m tall (`boss.colossus.crystal`, emissive on bloom, no lights) and four fallen crystal pillars 1.5 m tall at the rim (cover: they block the beam). **Lighting rule (story-beats):** the Depths is lit only by crystals and Collette's magic. No torches, no lamps, `light.heroPool` off (`dark 0.85`, `dng.cave`); the rim crystals brighten to 2× emissive within 6 m of any hero (a proximity uniform, no light) so the floor under the party always reads; Collette's orb is the only carried light that casts; `light.boss` (4 m) lives in the heart. The Colossus is **dormant scenery** at the centre until a hero is within 12 m: a crystal formation that assembles into the boss during the reveal clip. At the back (north), the **spark-plug plinth**: a 1.2 m crystal plinth with the Sparky-Thingy on it (gold quest-item glow `#FFD700`, story-beats §5.3), pickable only while `ground_ed_3` is active and the Colossus is dead; `Spark Plug recovered from the Crystal Depths!` on pickup. Lore secret 2 is on the tunnel; `Crystal light flickers in the depths...` is a lore plaque at the tunnel mouth. The lair card fades in at the tunnel's end. The Crystal Golem's popup in the Golem's Gallery, on the way here, is where Collette's `mid_boss` line (`Hold on, I need to fix my hair. ...Okay go.`) usually fires for the first time (story-beats §2.5); it is not this fight's.

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | wake | — | `shieldUp` | **Melee** hatched circle 2.0 m, 0.8 s, `dmg` · **Crystal Slam** (`groundSlam`): every 6 s with a hero within 3.75 m, hatched circle 3 m, `1.3 × dmg` · **Reflect shield** (`reflectShield`): the first arrow or magic hit is `REFLECTED!` back at the shooter (0 damage) and the spars go dark for **8 s** (the shimmer window: melee and whirl hit normally throughout, ranged hits land now); the shield re-forms 12 s after it dropped (3D change; v27 consumed it once) |
| P2 | `hp ≤ 50 %` | `Crystal Colossus enrages!` `#ff4444`, shake 10 / 0.6, `boss` 0.4; clip: the spars flare and the chest opens wider | spd ×1.2, dmg ×1.15, slam every 4 s, the shield **does not re-form** | **Crystal Beam** (`beamSweep`): every 5 s, `Crystal Beam!`, a hatched wedge ±0.15 rad to 6.25 m aimed at the nearest hero for 1.2 s, then the beam sweeps at 1.5 rad/s for 2 s (about 170°), `0.4 × dmg` per 0.25 s tick inside; the pillars block it (the wedge stops at a pillar); `boss.beamCharge`, `boss.beamLoop` |
| P3 | `hp ≤ 25 %` | `FINAL PHASE!` `#ff0000`, shake 12 / 0.5; clip: the heart's light doubles and the cavern's veins flash white | as P2, `light.boss` enraged | **Crystal fall** (`arenaHazard crystal`): every 4 s, 3 hatched circles 1.5 m at random floor points, 1.0 s, then a spar drops from the ceiling for `1.0 × dmg` once and stays 4 s as a 1.2 m obstacle (new cover that also blocks the beam) · beam sweeps alternate direction each cast · slam every 4 s |

Milestones: `Crystal Colossus weakening!` / `Halfway there!` / `Almost defeated!`. Death verb: the body crumbles into six slate boulders over 2 s, every spar shatters, and the heart drops to the floor, dims, and **is the Lampstone Core** (`+80 max HP all`, `#8E98D8` 💎). `Crystal Colossus DEFEATED!`, `cave_3` complete, `lairCleared.cave`, Quartz's line 3 at Lamplight Landing. **Re-entry:** the lair stays open as a place; the rim crystals keep pulsing at a slow 8 s (the crater's wrong rhythm, AR §15.4, rhymed on purpose: the island's roots and the thing that fell share a clock); the boulders remain; a narrow crawl (east) opens as a shortcut to Lamplight Landing. The Colossus does not return within a cycle; NG+ resets it with the world. No adds.

### 2.12 Magma Titan and The Volcanic Rift (lair, post-game, B3.6)

Canon: `Ancient colossus of fire and stone. Armored plates protect its molten core.`, the lair card `The Volcanic Rift` / `Magma churns beneath obsidian halls. The Titan waits in fire.`, the lore `Heat radiates from the obsidian walls...` and `Magma channels block the way.`, seven announces, `Forged in Fire`, `Emberforge Heart`, `The ground trembles... A volcanic rift opens!`. Story-beats: the Titan is what fell a long time ago; nothing in the text says so.

| | |
|---|---|
| Card | `Magma Titan` / `Guardian of The Volcanic Rift`, card colour `#D86840` (card text only) |
| Data (verbatim) | `hp (2000 + 500 × (players − 1)) + teamLv × 100` · `dmg 35` · `sz 34 → 0.85 m` · `spd 32 → 0.8 m/s` · `rng 55 → 1.375 m` · `cd 1.6` · phases at **60 / 25 %** · `specialT 5, specialT2 8, summonT 12, meltdownT 6, enrageTimer 180` · plates 4 × 150 HP absorbing 60 % · slam within `rng + 20 → 1.875 m`, `1.4 × dmg` within `100 → 2.5 m`, shake 12 / 0.5 · Lava Spray 5 projectiles at `sa ± 0.4` rad, speed `200–350 → 5–8.75 m/s`, **`dmg` each** (the broken call's intended sixth argument) · Embers `2 + floor(players × 0.5)`, hp `× (1 + 0.04 × teamLv)` · Meltdown `0.6 × dmg` to every hero · enrage at 180 s: `dmg × 1.5`, `spd × 1.3` |
| Phases (canon thresholds) | **P1** 100–60 % slam and spray · **P2** 60–25 % `Obsidian armor forms!`, embers · **P3** 25–0 % MELTDOWN |
| Height and silhouette | 6.0 m of black glass, square, no neck, a magma core seen through the chest seams, ember seams across every facet, fists the size of a kid. Read at distance: the biggest thing in the game, lit from inside |
| Palette | `boss.titan.glass` / `.ember` / `.magma`; the four plates are a lighter obsidian `#2A2632` with one ember rune each (N S E W) |
| Motion signature | core pulse 0.5 rad/s, seam flicker on the torch oscillator (8.8–10 Hz, tied to `light.boss`), a step every 1.6 s with a ground ring and embers, breathing as a slow heave 1.0 rad/s |

**The Volcanic Rift (the lair).** Opens on the first Forest-island return after the ending: the portal collapses, the crater floor cracks (`The ground trembles... A volcanic rift opens!`) and an obsidian stair descends 60 m in three switchbacks into 100 × 80 m of halls (story-beats). Not rooms: one continuous space in three parts. (1) **The Cinder Hall**, 30 m: the fire family's home, five `enemies.md` §2.8 nests (2 Ember Vents, 1 Magma Pool, 1 Obsidian Plinth, 1 Ash Drift), `Heat radiates from the obsidian walls...` on the stair's last landing; heat shimmer (a 0.3 % vertical wobble in the post stack, Medium+). (2) **The Magma Channels**, 25 m: three 3 m lava channels (`arenaHazard fire`, 30 DPS, permanent) crossed by cooling-crust bridges that sink 0.3 m under a standing hero and re-harden in 4 s (cross at a run; no puzzle, a tempo), `Magma channels block the way.` on a plaque at the first channel. (3) **The arena**: a **36 m obsidian ring** around a 12 m magma lake (`arenaHazard fire`, 30 DPS), four 2 m obsidian pillars at N / S / E / W each with a brazier so the plate compass reads on the floor, ember cracks across the ring. Lighting: **magma only**: the lake and channels emissive on bloom, `light.boss` (5 m) in the core, and the two world slots as pooled magma lights at the lake's near edge (`#FFB061` intensity 2.0 range 8 m, flickering on the torch oscillator); fog `dng.volcanic`, `pt.ember` 20 rising, `light.heroPool` 6 m. The lair card fades in at the top of the stair. The Titan rises from the lake in the reveal (the drop-in kept: it lands on the ring).

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | landing | — | spd 0.8 | **Melee** hatched circle 2.0 m, 0.8 s · **Magma Slam** (`groundSlam`): every 5 s within 1.875 m, hatched circle 2.5 m, `1.4 × dmg`, 15 particles · **Lava Spray** (`projectilePattern scatter 5`): every 8 s, `Lava Spray!`, five hostile lines 0.5 s, five magma globs at ±0.4 rad and 5–8.75 m/s, radius 0.15 m, life 2 s, `dmg` each; each leaves a 1 m scorch (`arenaHazard fire`, 3 s, 5 DPS) where it lands |
| P2 | `hp ≤ 60 %` | `Obsidian armor forms!` `#D84830` 2 s; `Magma Titan enrages!` folded in (spd ×1.2, dmg ×1.15, shake 10 / 0.6, `boss` 0.4); clip: four plates slide up out of the ring and lock onto his sides | `armorPlates` up | **Plates**: a hit from the N / S / E / W quadrant (the attacker's bearing, the compass fixed) is absorbed 60 % by that plate until its 150 HP is gone, `<N/S/E/W> armor shattered!` `#E8A838`, `destroy_pot` 0.3; `All armor destroyed!` `#3DCC7A` drops the block; the four plate pips on the boss bar · spray every 5 s · **Embers** (`summon`): every 12 s, `Embers swarm!`, `2 + floor(players × 0.5)` Ember Sprites from the lake |
| P3 | `hp ≤ 25 %` | `FINAL PHASE!` `#ff0000`; clip: the core's light triples and the lake rises 0.3 m | `light.boss` enraged | **MELTDOWN** (`meltdown`): every 6 s, `MELTDOWN!`, a 1.5 s ember band from the lake outward, then `0.6 × dmg` to **every** hero, shake 8 / 0.3, 20 particles (unavoidable, v27; heal through it) · slam every 3 s · embers every 8 s · spray continues · plates if any remain |
| Enrage | `enrageTimer ≤ 0` (180 s) | `TITAN ENRAGES!` `#ff4444`, `boss.titanEnrage` **[new cue]** | `dmg × 1.5`, `spd × 1.3` | a soft timer, not a wipe: a kid can still finish |

Milestones: `Magma Titan weakening!` / `Halfway there!` / `Almost defeated!`. Death verb: the seams go black from the feet up over 2 s (the Obsidian Guard's dissolve at boss scale), the core dies, the body cracks and the **Emberforge Heart** (`+12% HP, +8% DMG all`, `#D86840` 🌋; `titanHeartObtained` grants ×1.08 damage, +12 % max HP and a 12 % heal to every hero) rolls out glowing; **`Forged in Fire`**; `Magma Titan DEFEATED!`, `lairCleared.volcanic`. The lake cools to black glass with ember veins over 10 s; the lair stays as a place with its nests re-arming on the island's dawn; the Titan returns only with NG+. Adds by key: `ember_sprite` · Embers.

### 2.13 Home, Wrong floor mini-bosses (B3.3)

Both finally spawn. Both use `enemies.md` §2.7's un-letterboxed wake beat (dormant until 20 m, 1.2 s wake, one ring, one 0.6 s light, the growl, shake 10 / 0.5, `<name> APPEARS!`, the 2.5 s popup) and the guardian bar and death, and both count for `Mini-Boss Slayer` (they were `MiniBoss` instances in v27 and would have) but **not** for island `kill_miniboss` quests (3D ruling, §6). Their floor's `enemyScale` (1.5, 2.0) applies to their adds, not to them (v27 defined their HP as constants). NG+ hp and dmg wrappers apply.

**Stone Sentinel** (Outer Ward, the mirror Rootways): the Golem rig (`enemies.md` §2.9) in canon slate `#5D6D7E`, no crystals, void seams `boss.warden.seam` emissive; `hp 400, dmg 25, spd 40 → 1.0 m/s, sz 22 → 0.55 m`, 3.2 m tall. Dormant as an ash statue in a 16 m clearing of ash root walls. Popup `Stone Sentinel` / `Outer Ward` (the canon floor name in the guardian subtitle slot). Two beats: **(1)** `groundSlam` (hatched circle 4 m, 0.7 s, `1.5 × dmg`, cd 4, shake 8 / 0.3) and the floor's canon hazard, **spikes** (`arenaHazard spike`: two rows of 1 m spike strips along the clearing's root lines that rise 0.4 m every 2 s for 0.6 s, 5 DPS, hatched circles that pulse with the cycle). **(2)** at 50 %: `Shield up! Kill the minions!` (`summonShield`): four shadow-tinted adds (`orc` ×2, `archer` ×2 at ×1.5), the dome, `IMMUNE!` until they die; the dome shatters, 2 s stun, then slams at cd 3. Death: the guardian crumble into ash boulders; `Stone Sentinel DEFEATED!`, 60 XP, tier-2 gear, `Mini-Boss Slayer`; the ash roots ahead part (`dungeons.md`).

**Phantom Warden** (Inner Sanctum, the mirror stream): the Wraith rig ×1.3 (2.5 m), shadow tint with canon `#7B3CA0` seams; `hp 350, dmg 30, spd 70 → 1.75 m/s, sz 18 → 0.45 m`. Condenses from the mirror hideout's hollow log (a wisp hollow) at 20 m over the cyan, uphill stream's bend, a 14 m space with the log as 2 m cover. Popup `Phantom Warden` / `Inner Sanctum`. Two beats: **(1)** the Wraith's `blink` (random, 0.8 s ring) and claw (cone 1.8 m, 0.45 s), plus the floor's canon hazard, **poison** (`arenaHazard poison` pools r 1 m in the stream's eddies, 8 s, 5 DPS, two at a time). **(2)** at 50 %: `tether` on a random **companion** (never the active hero, so the player has to go): `Tethered! Destroy the anchor!` `#9B59B6`, the anchor 80 HP at ±2 m from it, the ramping 3 → 15 DPS, `Tether broken!`; it re-tethers 8 s after a break and blinks every 3 s between. Death: `glow_burst` in rift cyan; `Phantom Warden DEFEATED!`, 60 XP, tier-2 gear, `Mini-Boss Slayer`; the stream's cyan dims a step and the way to the Throne opens.

### 2.14 The shadow squad (Throne of Shadows, the mirror fire, B3.3)

**What it is.** Four shadow heroes on the kids' own rigs and clips (`heroes.md` §2.7.3 bone contract), wearing the **Shadow skin** (base `#2c3e50`, dark `#1a252f`, the canon `HERO_SKINS` swap, §2.6 there) with **rift-cyan eyes** `#3AF0FF` (two cyan dots; no whites). Because a skin swaps only base and dark, the accents survive: Liam's steel shield boss, Noah's leaf-green scarf, Collette's amber orb, Isabella's gold tiara are the only colour on four black kids, and that is the "you, wrong" read at one-eighth screen height: your silhouettes, your props, your idles, with the colour gone and the eyes lit. Their VFX (trails, rings, bolts) use rift cyan in place of the hero `glow`. They cast no shadow of their own (a shadow that casts a shadow is a person). Nameplates: `Shadow Liam`, `Shadow Noah`, `Shadow Collette`, `Shadow Isabella` (the canon skin names, FC §11.9, new placement).

**Stats (scale with the party by construction: the mirror is always your size).** Per shadow: `hp = floor(original.maxHp × 2)`, `dmg = floor(original.dmg × 0.6)`, run `original.run × 0.9`, reach and cooldowns the original's (`heroes.md` §2.5.2), the hero hitbox rules; Hard and NG+ wrappers as bosses. Kit: the original's **basic attack** (Liam's 120° cone at 1.8 m, Noah's arrow at 12 m/s as a cyan dart, Collette's homing bolt at 5.5 m/s, Isabella's 360° whirl at 1.9 m) and the original's **signature** on its cooldown (Shield Bash 6 s with the 1.5 s stun; Dodge Roll 4 s with the `snapShot` crit arrow; Arcane Blink 8 s to 1 m behind its target; Ground Pound 5 s with the slow). **Never ultimates, never combos.** Every hit telegraphs in the hostile language: Liam's cone 0.35 s, Noah's line 0.5 s, Collette's dashed ring on the target 0.4 s, Isabella's circle 0.4 s, Bash a 1.5 m line, Pound a 1.5 m circle; nothing is hatched (they are not bosses).

**How it plays: a mirror match that becomes a fight.** The Throne of Shadows is Stewart Camp at C6 mirrored (`camp.md` owns the prop set; story-beats §2.2): the four shadows are **sitting at the mirror fire** in the kids' 30 s idles (`heroes.md` §2.4.6: Liam leaning on the shield checking over his shoulder, Noah crouched over the ground, Collette sitting fixing a pigtail, Isabella cross-legged copying Collette 0.5 s late) around a fire that burns cold rift-cyan. No banner, no bars, until the party crosses the mirror fence (16 m): the four stand together, each walks to its **own original** and stops 4 m away mirroring its stance for 0.5 s; the popup card `The Shadow Squad` **[new text]** / `Four of them. Four of you.` **[new text]** (un-letterboxed: they are not a boss; `enemies.md` §2.7's card) with `miniboss` 0.5 and shake 10 / 0.5; the cold fire flares; then they fight. Rules: each shadow weights its original ×1.5 in target selection (so Liam meets Liam unless the player swaps, and swapping changes who the shadows chase: the control model *is* the mechanic); the **active hero's shadow** uses its signature on cooldown, companions' shadows at half rate (the mirror of "companions never spend signatures" would make three of them harmless); at 30 % HP each shadow **shadow-steps** once (0.4 s, 3 m away, `boss.shadowStep` **[new cue]**); a shadow dies `glow_burst` in rift cyan and its bedroll's cold light goes out. When the last falls the cold fire gutters out entirely (the light slot frees), the citadel door's seams ignite across the yard, and the Citadel Warden turns from it (§2.15). Companions fight as usual; a downed real sibling can be revived mid-fight (the shadows do not target the downed). Rejected: a gauntlet one at a time (loses the "four of you" image), a strict mirror match where only your own shadow can hurt you (a rule a kid cannot see). Canon lines: none exist for this moment and none are added; the staging is the line.

**The Queen's clones are cut from the squad.** SI §21.3 verbatim: two per cast, each re-statted from a random living **sibling** (heroes 1–3, never Liam): `hp 200`, `dmg floor(sibling.dmg × 0.3)`, `spd sibling.spd × 0.8`, `xp 15`, ranged with `rng 150 px → 3.75 m` if the sibling's `rng > 100 px` (Noah, Collette) else melee at `35 px → 0.875 m`. In 3D a clone is that sibling's **shadow rig** (the squad's palette and eyes, `enemies.md` §2.9's Runt row is superseded, §5) rising from a shadow pool over 0.8 s, with the basic attack only (no signature: a clone is less than a shadow), dying `glow_burst` cyan. Cap 4 alive (3D change; v27 had no cap and P4 halves the clone timer). `Shadow clones appear!` `#A862C4` on each cast.

### 2.15 Citadel Warden (the citadel door, Throne of Shadows, B3.3)

| | |
|---|---|
| Card | `Citadel Warden` / `Guardian of The Shadow Citadel` (the canon caption template with the `citadel` entry of `DUNGEON_NAMES`), card colour `#4a0080` |
| Data (verbatim; the one boss v27 NG+-scaled, kept exactly) | `hp floor(2000 × NG.enemyHp)` · `dmg floor(35 × NG.enemyDmg)` · `spd 45 × NG.enemySpd → 1.125 m/s` · `sz 28 → 0.7 m` · `_atkT 2, _sumT 12, _specT 6` · phases at **66 / 33 %**, labels `Dark Knight` / `Shadow Mage` / `VOID FORM` (the bar tag) · charge (P1) every 6 s: `400 px/s → 10 m/s` toward the stored point for 0.5 s (5 m), `dmg` (once per hero per charge), `boom` 0.3, shake 6 / 0.2, no wall stun · teleport + burst (P2+) every 5 s: to a random floor point, eight projectiles evenly around at `150 → 3.75 m/s`, `dmg`, radius 0.1 m, life 2 s (7.5 m), `#7B3CA0`, `portal` 0.3, 8 particles · melee every 1.5 s within `sz + 30 → 1.45 m`: `dmg` (`1.25 × dmg` in P3), `hit` 0.2 · Shadow Spawn every 12 s (8 s at P2+): 2 (3) shadow-tinted `goblin`, `hp floor(30 × NG.enemyHp)` · P3 `spd × 1.5`, void motes |
| Height and silhouette | 2.6 m armoured knight in void-black plate, a horned helm, a 1.8 m greatsword, seams `boss.warden.seam` emissive; in P2 the sword is sheathed and the gauntlets glow; in P3 the plate opens on a **hollow** with violet-cyan fire inside. Read at distance: a knight-shaped hole in the room, glowing at the joints |
| Palette | `boss.warden.void` / `.seam`; the boss bar's fill by phase `#7B3CA0` / `#E8A838` / `#D84830` (v27's own bar, kept as a Warden-only rule) |
| Motion signature | cape on the King's two curves in black, seam pulse 1.0 rad/s, helm tracking the active hero, P3 void motes 9/s |
| Arena | the **dooryard**: 20 × 16 m between the mirror fence (south, the dead cold fire ring) and the citadel door (north wall 6 m tall, ember windows `#FF6A2A`); the mirror woodpile and Ed's workbench as 1 m cover against the burst; fog `dng.citadel3` (red), `light.heroPool` 6 m, `light.boss` 4 m at the seams. The far warm light (story-beats) is behind the party here, over the fence |

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 `Dark Knight` | spawn (the squad's last death; the intro grammar plays as he turns from the door) | — | spd 1.125 | melee · **Charge** (`chargeAttack`, `wallStunTime 0`, `duration 0.5`, `speed 10 m/s`): every 6 s, `Warden charges!` `#4a0080`, a 0.4 s hatched line 5 m · **Shadow Spawn** (`summon`): every 12 s, 2 |
| P2 `Shadow Mage` | `hp ≤ 66 %` | `The Warden shifts to shadow magic!` `#7B3CA0` 2 s, shake 8 / 0.3, `boss.wardenShift` **[new cue]** (v27 silent); clip: he sheathes the sword | as P1 | **Blink + burst** (`blink random` + `projectilePattern ring 8`): every 5 s, a 0.8 s dashed ring at the destination, `portal` 0.3, then eight 0.4 s lines and eight bolts (3D change: v27 had no telegraph) · summon every 8 s, 3 · no charge |
| P3 `VOID FORM` | `hp ≤ 33 %` | `VOID FORM UNLEASHED!` `#D84830` 3 s, shake 12 / 0.5, `boss.voidForm` **[new cue]**; clip: the plate opens | `spd × 1.5`, melee `1.25 × dmg`, void motes, `light.boss` enraged | blink + burst every 5 s · summon 3 every 8 s · the charge returns at 10 m/s every 6 s (3D change: P1's verb comes back so the last third is not a bolt-dodging loop; logged) |

No milestones (v27's Warden bypassed them). Death: the suit collapses into a pile of black plates over 1.5 s and the void inside implodes to a point with 12 cyan motes; `Citadel Warden DEFEATED!`; tier-3 roll, guardian gold; the citadel door's seams go dark and it swings open over 2 s; B3.4 begins as the party crosses the threshold (the Queen's intro plays at the hearth). No `Citadel Conqueror` here: story-beats awards the Citadel strings on the Queen. Adds by key: `goblin` · Shadow Spawn (shadow tint).

### 2.16 The Shadow Queen (the corrupted hearth, B3.4, the finale)

| | |
|---|---|
| Card | `THE SHADOW QUEEN` / `Mistress of Darkness`, card colour `#A862C4`, `screenShake(12, 1)` (the canon call) |
| Data (verbatim) | `hp 2500 + teamLv × 150` (Hard ×1.5) · `dmg 40` (Hard ×1.25) · `sz 30 → 0.75 m` · `spd 80 → 2.0 m/s` · `rng 50 → 1.25 m` · `cd 1.2` · `atkT 2, boltT 3, poolT 5, cloneT 12, kidnapT 15, ringT 8` · `phaseMul 0.5` in P4 (every timer halved) · phases at **70 / 40 / 15 %** |
| Phases (canon) | **P1** bolts and pools · **P2** `The Shadow Queen summons clones!` · **P3** `KIDNAP PHASE - Protect your siblings!` · **P4** `DESPERATION - She fights for survival!` |
| Height and silhouette | 2.4 m, a long black gown that never touches the floor, a five-spike crown (v27) in void with cyan gems (3.0 m), long hands, and **her shadow**: a second silhouette 3.6 m tall cast on the wall and floor behind her that moves 0.3 s late and turns to look at the party when she does not. Read at distance: a crown, a gown, and a shadow that is not hers |
| Palette | `boss.queen.void` / `.violet` / `.rift`: v27's `#A862C4` retired from her body (Collette's band), kept on the card; her bolts in the v27 `dk` violet `#6C3483`; P3+ aura, kidnap tether and rings in rift cyan where v27 used `#e84393` (Isabella's band) |
| Motion signature | the gown on the ribbon shader 0.6 rad/s, the 0.3 s lagging shadow, crown gems 1.3 rad/s, a 0.2 m hover bob 0.9 rad/s; during a kidnap channel everything on her stops except the tether and the shadow, which reaches |
| Arena | the **corrupted hearth**: the cabin's great room grown to 24 × 20 m, the hearth in the north wall with a **violet throne where the fire should be** (story-beats), the roof broken open so the shard's locked `shadow.wrongDusk` sky shows, the mirror table and bookcase as 1 m cover, four black beds in the corners. Fog `dng.citadel3`, `light.heroPool` 6 m, `light.boss` 5 m at the crown. Through the north window behind the throne, the **real camp fire** on the far horizon (story-beats' one warm light): the only warm colour in the fight, and what the kids are fighting toward |
| Weather | `riftstorm` (`world-events-weather.md` §2.2.3) is the one weather allowed in a boss fight: it starts at P3, its cyan sheet lightning strikes only shadow enemies (that file's rule; the clones are shadow enemies, so the storm is on the kids' side), and at P4 the rift lobes pulse ×2 |

| Phase | Enter | Banner, shake | Stats | Loop |
|---|---|---|---|---|
| P1 | spawn at the throne | — | spd 2.0 | **Melee** hatched circle 1.875 m, 0.8 s, `dmg`, shake 6 / 0.15 · **Dark bolt barrage** (`projectilePattern fan 6`): every 3 s, six bolts at `ba + (i − 2.5) × 0.2` rad (a ±0.5 rad fan), `280 → 7 m/s`, `0.5 × dmg`, radius 0.125 m, life 2 s (14 m), `shadow_bolt` 0.2, six 0.4 s lines · **Shadow pool** (`arenaHazard shadow`): every 5 s at the nearest hero ±0.75 m, r 1.5 m, 4 s, `0.3 × dmg` per second |
| P2 | `hp < 70 %` | `The Shadow Queen summons clones!` `#A862C4` 3 s, shake 10 / 0.5, `boss.queenClone` **[new cue]** (v27 silent); clip: her shadow splits in two | as P1 | **Clones** (`summon`): every 12 s, two shadow-rig clones (§2.14), `Shadow clones appear!`, cap 4 · bolts · pools |
| P3 | `hp < 40 %` | `KIDNAP PHASE - Protect your siblings!` `#ff0000` 4 s, shake 12 / 0.6, `kidnap` 0.4; `riftstorm` begins; clip: her shadow stands up off the wall | aura to rift cyan | **Kidnap** (`kidnap`): every 15 s on a random living, unbanished **sibling** (never Liam): `⚠ <HERO> is being KIDNAPPED! Deal damage to interrupt!` `#ff0000` 4 s, `kidnap` 0.4, the cyan tether from her hands to the sibling, a hatched circle 1 m under them, the red sub-bar; **150 damage to her** inside 4 s → `Kidnap interrupted!` `#3DCC7A`, `boss.kidnapBreak`, she staggers 0.8 s; else `<HERO> has been BANISHED!` `#ff0000`, `boom` 0.5, shake 10 / 0.5, 20 particles: the sibling is pulled into her shadow and is **out of the fight** (excluded from switching, targeting and the alive check, CM §7.3) until she dies. Cancelled if the target dies, goes down, or is already banished. She does nothing else while channelling · clones, bolts, pools continue between kidnaps |
| P4 | `hp < 15 %` | `DESPERATION - She fights for survival!` `#ff0000` 4 s, shake 15 / 0.8, `boss.queenDesperation` **[new cue]**; the rift lobes pulse ×2; clip: the crown cracks | every timer ×0.5: bolts 1.5 s, pools 2.5 s, clones 6 s, kidnap 7.5 s | **Dark rings** (`projectilePattern ring 12` ×3): every `4 × 0.5 = 2` s, three volleys 0.4 s apart of twelve bolts each at `120 / 136 / 152 px/s → 3.0 / 3.4 / 3.8 m/s`, `0.4 × dmg`, radius 0.15 m, life 3 s, `isRing`, rift cyan, `boss.ring`; twelve 2 m lines per volley (the gaps are the answer) · everything else at double pace |

**Every line at its trigger:** the card and `screenShake(12, 1)` at the hearth; `The Shadow Queen summons clones!` / `Shadow clones appear!` / `KIDNAP PHASE - Protect your siblings!` / `⚠ <HERO> is being KIDNAPPED! Deal damage to interrupt!` / `Kidnap interrupted!` / `<HERO> has been BANISHED!` / `INTERRUPTING KIDNAP: N%  (<HERO>)` / `DESPERATION - She fights for survival!` as above; `Welcome to the Shadow Realm...` belongs to CS-08 at the mirror crater, not here. Bestiary: `The Shadow Queen` · `Final boss. Wields darkness itself. Only the bravest survive.`

#### 2.16.1 Her death and the ending's first light

| t (s) | What |
|---|---|
| 0.0 | `shadowQueenDefeated`; `hitStop 0.1`; `screenShake(15, 1.0)` (v27); `victory_ext` 0.5; `THE SHADOW IS VANQUISHED!` `#E8A838` 5 s; `Shadow Slayer`; 60 particles; every clone dies |
| 0.0–2.0 | the death verb (v27's 2 s spin, twice as slow as any other boss): she rises 4 m turning one full circle and comes apart into rift-cyan motes that leave through the broken roof; her shadow stays on the wall a beat longer, then fades; the `riftstorm` stops |
| 1.0 | **banished siblings return** at the hearth in a cyan flash, each at 40 % HP with the canon revive announce `<HERO> revived!` and the 20-particle resurrection burst (story-beats §2.9: restored on her death; the revive rule is the closest canon shape) |
| 2.0 | `New Game+ unlocked!` `#E8A838` 4 s on the first win; `★ THE SHADOW CITADEL HAS FALLEN ★` with `The ultimate darkness has been vanquished!` (NG+ < 5) or `The Stewart Squad has conquered every challenge! The realm is forever at peace.` (NG+5); `Citadel Conqueror`; `True Final Boss` at NG+5; `<hero> received <legendary>!` for each un-owned legendary, `Legendary Hero` when all four are held (story-beats B3.4) |
| 2.0–5.0 | the violet throne cracks and falls apart, and in the hearth behind it a small warm flame lights (`light.campfire` token, `#FF9A3C`, the first warm light source in Home, Wrong: the title made literal); the ember windows go warm |
| 5.0 | victory stats `SHADOW QUEEN VANQUISHED!` / `The darkness has been defeated!`; then CS-10 (`cutscenes.md`) |

### 2.17 Cuts and fixes (for `KEEP_CHANGE_DROP.md`)

| v27 thing | Fate | Why |
|---|---|---|
| `createPhaseBoss` (defined, never called) | becomes the phase machine every boss runs (§2.1.2) | the intended abstraction; the 1.5 s invulnerable transition is a beat worth seeing |
| Tether, Containment, Summon + Shield (never invoked; two without hit detection, one a stub) | built and used (Phantom Warden, Frost Lich, Stone Sentinel) | eight blocks were promised; three bosses needed exactly these |
| Per-frame DoT flooring to 1 per frame (60 DPS) | 4 Hz whole-point ticks at the stated DPS (§2.1.4) | port the number, not the accident |
| Radial Blast, Charge and Spin hitting every frame; the Colossus beam's 0.4× per frame | one hit per activation; 0.4× per 0.25 s | same |
| The generic 50 / 25 % enrage layer over each boss's own phases | banners kept, fired on each boss's own P2 / P3 | one stat step per phase; the Treant no longer announces four phases |
| The King spawning the portal 5 s after death; `checkVolcanicEntrance` there | cut; the King ends Act 1 | story-beats §2.3 |
| The dungeon-boss 5 s cinematic with pure-black bars and its `Guardian of` caption | folded into the 4.1 s grammar: `#0B0E1A` bars, the caption as the card subtitle, the 1.4 zoom as the push-in | one intro code path; black bars are the anti-palette |
| `cageY` unused; cage hit by "attack from above" | the cage is a collider that comes down in the windows (§2.6.3) | a free-yaw camera has no "above" |
| Kid Snatch lines in the first captive's colour; portraits never restored | speaker's colour; restored | SI §29 |
| Two Citadel mini-bosses that never spawn | spawn on floors 1 and 2 of Home, Wrong | story-beats |
| Pharaoh `_realIdx` / `_scarabOnHit` unread; `_wrPhase` auto-advance | the afterimage tell and the scarab burst; the auto-advance kept | intent, verbatim where it worked |
| Sapling `_saplingTimer` unread | a 5 s root-and-heal | the bestiary's `Heals itself` and Elm's `Sever the roots!` |
| Planted 30 % DR as a flat rule | held by three root knots | gives P2 a goal |
| Colossus reflect consumed forever | re-forms every 12 s in P1 | Quartz's `when the shield shimmers` needs a recurring window |
| Magma Titan Lava Spray (pre-v13 call, garbage angles) and the plate compass mismatch | the modern signature at `dmg` each; the compass fixed and marked by braziers | SI §29 |
| Meltdown, unavoidable and unannounced | unavoidable, announced by a 1.5 s band | the telegraph rule with no exception; a heal window instead of a dodge |
| Shadow Queen fixed-dt update; `setTimeout` boss timers | sim clock | Brief §7.1 |
| `Boss`, `DungeonBoss`, `ShadowQueen` as three classes; the Warden overwriting a `DungeonBoss` | one `BossDef` shape | data, not branches |
| The Warden's private 60 × 5 HP bar | the shared bar with his per-phase fill | one bar |
| Endless-mode boss waves (scaled King and Queen every tenth wave) | cut with Endless mode | orchestrator decision |
| `The world awaits — explore the Shadow Citadel!` | cut | story-beats §2.9 |
| Boss and cage hex colours in hero bands | retuned (§2.1.6) | `heroes.md` §2.1.3 |
| Adds surviving a boss's death | die `glow_burst` on the death beat | the win should be a win |

---

## 3. What preserves the magic

### 3.1 Recipe by recipe (ATMOSPHERE_RECIPES section numbers)

| Recipe | Kept / translated / replaced | How, and why the feeling survives at the gameplay camera |
|---|---|---|
| **§19.1 the shared torch oscillator: light and fire agree** | **Translated** to every boss | The boss light (§2.1.5) and the boss's emissive core share one oscillator: the King's crown gems (6 rad/s) drive the gems' emissive *and* `light.boss` intensity ±10 %; the Colossus heart (0.6 rad/s) drives the heart, the twelve rim crystals, the floor veins and the light, so the whole Depths breathes with the boss; the Titan's seams and the two magma lights flicker on the 8.8–10 Hz torch oscillator; the cocoon's cracks glow with the wave timer. A boss that glows and lights with one signal reads alive; one that glows with two reads decorated |
| **§19.2 simultaneous layering** | **Kept** as an arena rule | Every arena runs at least five layers on top of the fight: the fog token, the dungeon atmo particles (`DNG_ATMO` translated, §2.8.4 of world-events), the telegraph decals, the boss light pool, the hazards' own particles, plus one place layer (the broken roof's riftstorm sky, the aurora through the Lich's lens, the magma lake, the meadow's keyframe sky). Boss fights are the densest scenes in the game, not the emptiest |
| **§19.3 incommensurate motion sources** | **Kept** as the boss rule | §2.1.1: three rates minimum; each boss table names them. The cage alone has three (the pole's sway, the captives' idles, the shake on a hit), which is why it reads as a *thing with people in it* rather than a hitbox |
| **§13.1 the boss intro: bars, the 0.8 s delay, the overshoot, the glow, the growl, and the world trembling under a frozen frame** | **Kept exactly, then given the push-in** | §2.3 keeps every value (`#0B0E1A`, 0.5 / 0.4 s, 0.8 s to the card, `cubic-bezier(0.34, 1.56, 0.64, 1)`, `snd('boss', 0.5)`, `screenShake(12, 1)` under the freeze) and adds the Brief's push-in using v27's own dungeon-boss zoom curve. The pause before the name is still what makes it land |
| **§13.1 the mini-boss popup that does not stop the game** | **Kept** for the tier below | Guardians, the two floor mini-bosses and the shadow squad card the way v27 carded mini-bosses: 2.5 s, no bars, no pause. The tier system stays one UI choice |
| **§10 the shake ladder and the four hit-stop sites** | **Kept verbatim** | Every boss call site keeps its magnitude and duration (12 / 1.0 appear, 15 / 0.8 snatch and P3, 10 / 0.6 King P2, 12 / 0.5 slam and shatter and death, 10 / 0.5 plant and retreat, 12 / 0.6 uproot and split and kidnap, 15 / 0.8 desperation, 15 / 1.0 the Queen's death, 15 / 0.7 the Titan's landing, 8 / 0.3 meltdown and the Warden's shift, 6 / 0.2 charge end, 6 / 0.3 blast and field break, 4 / 0.2 freed, 8 / 0.4 all free). Hit-stop: only v27's boss-death 0.1; this file adds none (`heroes.md` §2.5.7 rule) |
| **§9.4 the arena-effect registry with its 1.0 s default lead** | **Translated** | The telegraph registry with the same two-phase life; every v27 `telegraphTime` is kept per block (0.3, 0.4, 0.5, 0.8, 1.0, 1.2, 1.5) so the fights' rhythms are v27's |
| **§9.3 the four death verbs** | **Kept** for adds; **extended** to bosses | Sprites, saplings, soldiers, scarabs, phantoms, spawn, embers and clones die by their `enemies.md` verb; each boss gets one verb of its own (§2.6–2.16): topple, shed, unwind, sink, shatter, crumble, cool, collapse, rise |
| **§6.2 the light compositor** | **Translated** | Boss light 60 / 80 px → `light.boss` 4 / 5 m; the enraged `rgba(180,0,0,0.06)` tint → a grade; the hero light's 180 px boss-room radius → `light.heroPool` 6 m; atmo particles on bloom over the fog |
| **§15.3 the portal** | **Kept**, elsewhere | B3.2 / CS-07 (`cutscenes.md`); the King no longer spawns it |
| **§15.5 the Citadel's palette descent** | **Kept** as the three Home, Wrong fights | Sentinel in `dng.citadel1` violet, Phantom Warden in `dng.citadel2` deeper violet, the Warden and the Queen in `dng.citadel3` red |
| **§14 damage numbers** | **Kept** | Hue = who, size = how much, bounce = crit, on the boss's body; cage hits in gold |
| **§2.4 warm on cool at night** | **Translated** into the finale | The real camp fire in the Queen's window is the one warm point in a cold red room; the Titan's magma is the same idea with the temperatures reversed |

### 3.2 Family-canon threads that survive

- **Every line in FAMILY_CANON §6**, at a trigger this file names: the King's card and roar, the four caged lines with their index mismatch and Liam's silence, `Minions, attack!`, `The King spins!`, the phase banners, the cage strings, `GOBLIN KING DEFEATED!`; every Treant, Pharaoh, Colossus, Hydra, Lich, Titan, Warden and Queen announce; the shared `BOSS_BLOCKS` announces (`Stunned!`, `Tethered! Destroy the anchor!`, `Tether broken!`, `<HERO> trapped! Break the field!`, `Field broken!`, `Shield up! Kill the minions!`, the three cocoon lines) on blocks that now run; the Citadel strings on the Queen.
- **The guides' boss tips become true** (FC §4.1 line 2): Elm's `Sever the roots!` (the knots), Quartz's `Get in close when the shield shimmers.` (the 8 s window), Sol's `blinks between sun-marks. Track the afterimage.` (the anchors and the tell), Fern's `Kill it before it splits!` (the 50 % split), Neve's `Hit hard to break the channel.` (the > 15 rule).
- **The three `boss_appear` lines and Collette's `victory` finally fire**, at the King, the Treant, the Colossus and the King's death.
- **The kids' relationships in the fights**: the Queen never kidnaps Liam (v27 rule, the oldest stays); the shadows sit in the kids' own idles, Isabella's copying Collette's; the Supernova hand-hold is still the strongest answer to a boss; `Stay back, Bella.` is still Liam's companion rule under the King's slams.
- **Achievements verbatim**: `King Slayer`, `Dungeoneer`, `Mini-Boss Slayer`, `Shadow Slayer`, `Citadel Conqueror`, `True Final Boss`, `Legendary Hero`, `Forged in Fire`, `Ed's Landing`.
- **The rewards verbatim** (`DUNGEON_EQUIPS`): Hearthroot Seed, Sunstone Crest (now working), Lampstone Core, Marshlight Vial (now on every attack), Hearthice Crown, Emberforge Heart.

**What a kid will recognise from v27:** the King's gold crown with the red, blue and green gems and the cage on his back; `YOUR LITTLE FRIENDS ARE MINE!`; the cage coming down when he slams; the King spinning and getting dizzy; barrels in the last phase; the Treant planting itself and the saplings you have to kill fast; the sarcophagus and the scarab swarm; three Wraiths and one of them real; the Hydra splitting; `Frozen solid!`; arrows bouncing off the Colossus; `Crystal Beam!`; the Titan's four plates and `MELTDOWN!`; the Warden's void form; the Queen's kidnap bar and `KIDNAP PHASE - Protect your siblings!`; `New Game+ unlocked!`; and the letterbox with the whole world shaking before the name comes in.

---

## 4. Build notes for implementers

### 4.1 Assets

| Asset | Source | Budget (tris) | Phase |
|---|---|---|---|
| Goblin King rig (crown, cape, axe, cage pole) | procedural rig in the `heroes.md` §2.7 style, `src/render/bosses/king.ts`; GLB later at a Rule 2 gate | 6,000 | 2 |
| The cage (King's), the wrecked-cage prop, the palisade stakes and four totems (instanced) | code primitives; stakes `InstancedMesh` | 400 · 400 · 60 per stake | 2 |
| Ancient Treant rig (trunk, two arm chains, canopy, face), root knots ×3, vine props ×8 | procedural | 5,000 | 2 |
| Pharaoh Wraith (floater ribbon + mask + staff), sarcophagus, sun-mark decals ×5, pillars | procedural / GLB | 3,500 · 600 | 3 |
| Hydra Matriarch (body + 5 neck chains × 5 bones) | GLB preferred (the neck rig) | 6,000 | 3 |
| Frost Lich (floater + crown + staff), ice wall (60 HP prop), ice block (containment dome shared) | procedural | 3,500 · 80 | 3 |
| Crystal Colossus, the Depths' rim clusters ×12 (instanced), fallen pillars ×4, the plinth, crystal-fall spars | procedural / GLB | 5,000 · 200 each | 3 |
| Stone Sentinel, Phantom Warden | `enemies.md` Golem and Wraith rigs, palette slots | 0 new | 4 |
| The shadow squad, the clones | the four hero rigs, Shadow palette swap, eye material variant | 0 new | 4 |
| Citadel Warden (plate suit, helm, greatsword, the hollow) | procedural / GLB | 4,000 | 4 |
| Shadow Queen (gown ribbon, crown, hands), her shadow (a flat black silhouette mesh projected on wall and floor, lagging 0.3 s), the throne | GLB preferred | 4,500 · 500 | 4 |
| Magma Titan (four plates as separate meshes), the Rift statics (stair, halls, channels, ring, pillars, braziers), the lake and channel lava shader | GLB preferred; statics merged | 8,000 · ≤ 40,000 merged | 4 |
| Telegraph shapes: **wedge** and **band** added to the `enemies.md` §4 registry; hazard decals (fire, poison, ice, sand, spike, shadow, crystal) | one decal shader, per-instance params | — | 2 |
| Domes (containment, summonShield, the elite shield), the beam ribbon, the tether ribbon (shared with the Healer's), the cage-hand tethers | shaders | — | 3 / 4 |
| Death-verb VFX per boss | pooled shard / mote / leaf systems (`enemies.md` §4 pools) | 0 alloc | per boss |

### 4.2 Materials and lights

- Bosses use the `enemies.md` §4 palette-slot material (four slots per mesh, flat-shaded, vertex colours) plus the shared emissive material on the bloom layer for cores, seams, gems, eyes; the cage uses the enemy material; the shadow squad uses the hero material with the Shadow swap and an eye variant.
- Lights in a boss fight: `light.boss` (1) + the world's second slot (a brazier, a magma light, or nothing) + the hero side's guaranteed six. Never more than the 8-pool. The Rift's two magma lights are the only case where both world slots belong to the place, and there the `light.boss` is the third; verify at the Phase 4 profile that the hero side really needs six there, else the pool is fine.
- Draw calls, worst case (Queen P4): boss 3 + shadow 1 + clones 4 × 2 + telegraphs 8 + hazards 4 + rings 36 short lines in one instanced call + VFX pools 6 + arena statics merged ~10 + heroes 12 = about 90, inside the 300.

### 4.3 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| `BossDef`s, phase tables, add pools, retune and NG+ wrappers, drop tables | `src/content/bosses/` (`goblinKing.ts`, `treant.ts`, …, `shadowSquad.ts`) |
| The block library | `src/content/bosses/blocks/` (one file per block, data + a pure setup function) |
| Canon strings (cards, banners, caged lines, achievements) | `src/content/canon/` (verbatim, from FAMILY_CANON §6, §2.3, §9) |
| Phase machine, block runtime, cage, kidnap, telegraph ownership, hazard pool, the DoT accumulator | `src/sim/bosses/` |
| Rigs, reveal clips, transition clips, death verbs, cage, domes, beams, tethers, the Queen's shadow | `src/render/bosses/` |
| The intro grammar (shared with the combo beat) | `src/engine/camera/cinematic.ts` |
| Arena wiring per dungeon (doors, the room's statics, the fog token) | `src/dungeons/<dungeon>/boss.ts` (`dungeons.md` owns the rooms) |
| The Depths and the Rift | `src/world/islands/cave/depths.ts`, `src/world/islands/volcanic/rift.ts` |
| Boss bar, cage sub-bar, kidnap bar, cards, bestiary boss entries | `src/ui/boss/` (per `ui-ux.md`) |
| Tokens (`boss.*`, `light.boss` override) | `src/style/bosses.ts` (serialize with anything touching `src/style/`) |
| Dev hooks | `src/dev/boss.ts` |

### 4.4 Phases (Brief §8)

- **Phase 2 (Forest slice):** the phase machine; blocks `radialBlast`, `groundSlam`, `summon`, `chargeAttack`, `spin`, `projectilePattern`, `kidSnatch`, `grab`, `sweep`, `arenaHazard` (poison, fire), `rootKnots`; the intro grammar; the boss bar with the cage sub-bar; the Goblin King at Crash Meadow with the palisade; the Ancient Treant in the grove hall; the death beat.
- **Phase 3 (the world):** `blink`, `cocoon`, `phantomSplit`, `multiStrike`, `headSplit`, `containment`, `channel`, `beamSweep`, `reflectShield`, `arenaHazard` (wall, ice, sand, crystal); Pharaoh Wraith, Hydra Matriarch, Frost Lich, Crystal Colossus and the Depths lair (with the plinth and re-entry).
- **Phase 4 (Lights in the Dark):** `tether`, `summonShield`, `kidnap`, `armorPlates`, `meltdown`, `arenaHazard` (spike, shadow); Stone Sentinel, Phantom Warden, the shadow squad, the Citadel Warden, the Shadow Queen with the riftstorm and the ending hand-off; the Magma Titan and the Rift.
- **Phase 5:** every `boss.*` cue in §2.2 and §5 through `audio.md`; the multiplayer intro sync.

### 4.5 Test hooks

- **Dev console:** `boss spawn <key> [phase]`, `boss hp <pct>`, `boss block <name> [json]`, `boss cage expose [s]`, `boss intro <key>` (replays the grammar), `boss squad`, `boss kidnap <heroIdx>`, `boss plates <n|s|e|w> break`, `telegraph outline`, `boss station` (a screenshot station that stands every built boss at gameplay distance beside Liam for the art director; a rubric station from Phase 2 on).
- **Vitest (`tests/unit/bosses/`):** phase thresholds per `BossDef`; the 1.5 s transition immunity; the DoT accumulator (a 5 DPS zone deals 20 ± 1 over 4 s at 60 Hz); `radialBlast` and `chargeAttack` hit a hero once; cage proportional release (three captives free at 66.7 / 33.3 / 0 %); `kidSnatch` exempts the active hero, the dead and the downed, and caged heroes tick no cooldowns; the King retune formula and the NG+ wrapper at NG+0–5; a wall stun exposes the cage 3 s; Pharaoh P3 fires when the stun ends at 40 % HP; the Colossus shield re-forms at 12 s in P1 and never in P2; the Hydra splits once; the Lich channel breaks on a 16 hit and not on a 15; the Titan plate index equals the attacker's quadrant; the Warden scales by `NG_SCALE`; the Queen's kidnap never targets Liam, interrupts at exactly 150, restores banished heroes on death, and caps clones at 4; the shadow squad never calls `actUlt` or `trigComboUlt` (call-site spy over a 60 s scripted fight); every block's windup is shorter than its cooldown. Trim the enemy suite first (Working Rule 7).
- **Smoke (`tests/smoke/`):** each roster entry killed by a scripted party at its expected team level; assert every hero damage event was preceded by a telegraph of the right shape owned by the boss, the intro ran 4.1 s with the sim frozen, and every canon string in the boss's table fired exactly once.

### 4.6 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| The Hydra's 25 neck bones and five head colliders | bones as plain `Object3D`s (the hero-rig approach), LOD1 at 20 m; colliders are spheres |
| The Titan's 8,000 tris plus a lava shader plus merged Rift statics | post-game and desktop-first; Low preset drops the lava's wave to a scroll and the shimmer |
| Eight hero rigs on screen at the squad | hero rigs are cheap by design (`heroes.md` §4.5); no cloth simulation |
| Ring volleys (36 bolts in 0.8 s) and their telegraphs | bolts pooled (64), the twelve 2 m lines as one instanced call; no light per bolt (emissive core + bloom) |
| Scarab swarms (up to 15 fliers twice) | the Flier rig's 300 tris, blob shadows, `enemies.md`'s 24-visible cap does not apply in a boss room but 15 is under it anyway |
| The riftstorm's strike light mid-fight | takes the oldest bolt slot for 0.12 s (world-events §2.8.2), never a ninth light |
| Telegraph overdraw in the Treant's P2 (3 hazards, a sweep, a grab, knots) | 8-of-16 ownership cap per boss; hazards in their own 12-pool |
| The cage's captives running idle clips while out of the sim | presentation-clock clips only; no sim state |

### 4.7 Build order

1. Phase machine, block runtime, telegraph ownership and the DoT accumulator with capsule stand-ins; Vitest green.
2. The intro grammar on the combo-beat camera rig (`heroes.md` §2.5.8 already needs it).
3. The Goblin King end to end at Crash Meadow: palisade, reveal, snatch, cage windows, phases, throw, death, Act 2 hand-off.
4. The boss bar, cage sub-bar, portraits, `HIT CAGE!`.
5. The Ancient Treant.
6. Phase 3 blocks, then Pharaoh, Hydra, Lich, Colossus in that order; the Depths lair with the plinth.
7. Phase 4: Sentinel, Phantom Warden, the shadow squad, the Warden, the Queen (with the ending hand-off), the Titan and the Rift.
8. The `boss station` screenshot station after step 3, updated at every step.

---

## 5. Cross-references and conflicts

### 5.1 Earlier design files: what this file took

| File | Taken |
|---|---|
| `heroes.md` | 40 px = 1 m (§2.5.1) for every number; hero heights and speeds for the roster's scale claims; the kit numbers the shadow squad mirrors (§2.5.2–2.5.5); the hit-stop rule (no new sites; §2.5.7); the combo beat's camera rig as the intro's code path (§2.5.8); the Kid Snatch rules, `_rescueGrace` and the downed / revive rules (§2.5.11); the legendary drop tier on boss kills and the 2× ult rule (§2.5.6, §2.5.10); the Shadow skin swap and eye rule for the squad (§2.6); the glow tokens for `boss_appear` bubbles and the hue-reservation rule (§2.1.3); companions' telegraph avoidance (§2.5.11) |
| `enemies.md` | the telegraph language and `tele.*` tokens (§2.2); the rig families and the guardian rigs reused for the Sentinel and Phantom Warden (§2.3); the add variants with palettes and stats (§2.9), the King's summon pools (§5); the guardian wake beat for the mini-bosses and the squad (§2.7); the hung cage as the King's cage's little sibling (§2.8); the nests that furnish the Rift's Cinder Hall (§2.8); the shadow tint (§2.9); the 16-decal registry and hazard pooling (§4); the death verbs (§2.5) |
| `story-beats.md` | the King in Act 1 at Crash Meadow with no portal (§2.3); the lairs (§2.2); B1.8, B1.10, B2.7, B2.11, B2.13, B2.14, B3.3–B3.6 as the trigger points; the `boss_appear` placements and 0.8 s rule, the caged lines in speaker colour, Collette's `victory` (§2.5); banished heroes restored (§2.9); the Citadel folded into Home, Wrong with its floor names and the Warden at the door (§2.2); the one far warm light and the corrupted hearth (§2.2); the spark-plug plinth rule (§2.2); the boss cards as this file's (§2.10) |
| `world-events-weather.md` | `light.boss` and the 8-slot pool with its priority (§2.8.2); the fog tokens and `light.heroPool` 6 m in boss rooms (§2.8.1); the torch oscillator (§2.8.3) for the Titan; `riftstorm` keyed to Queen phases (§2.2.3); no world event during a boss (§2.5.3); `visOverride` for the blizzard (§2.8.5); the aurora uniform for the Lich's crown (§2.3.3); `pt.*` particle tokens |
| `docs/DECISIONS.md` | the fire family's home (the Rift primary); lairs owned here; endless cut (its boss waves go with it); cages at camps (the King's cage is a different object); hero colours and roles |

### 5.2 What later files must pick up

| File | Must pick up |
|---|---|
| `dungeons.md` | boss rooms are **20 × 16 m** with doors locked for the fight (§2.7–2.10); the Treant's grove hall (root walls still during the boss; the glow-moss paths); the Pharaoh's five sun-marks, dais and four pillars and whether the sunbeams are player-routable before the fight; the Hydra's raised stones and the P3 flood; the Lich's lens room with ice physics and `visOverride 4` during blizzards; the Depths darkness rule as this file states it (no lamps, proximity crystals, Collette's orb); Home, Wrong's regions sized here: the Outer Ward clearing 16 m, the Inner Sanctum stream bend 14 m, the Throne's mirror camp 24 m, the dooryard 20 × 16 m, the hearth 24 × 20 m; the floor banners; the shard's ember zones (the Rift's halls are this file's); the dungeon entry card on the §2.3 timeline; the canon `citadel` description (`The ultimate darkness awaits within. Three floors stand between you and the Citadel Warden.`) is delivered on Home, Wrong's first floor banner or the shard's entry card, `dungeons.md`'s choice |
| `cutscenes.md` | the intro grammar (§2.3) lifted verbatim as the cinematic system's `bossIntro` mode; the nine reveal clips; CS-08 ends before the Sentinel wakes; CS-10 begins at the Queen's death beat 5.0 s; B3.6's crater stair; the Crash Meadow palisade rising is a 0.8 s in-engine beat, not a cutscene; the combo beat and the intro share the rig |
| `ui-ux.md` | §2.4 whole (bar, pips, tags, enrage, shield pools, plate pips, cage sub-bar strings, portraits, `HIT CAGE!`, kidnap bar, milestones, damage numbers); the captured-hero overlay from `boss.cage.state`; the popup cards for the Sentinel, the Phantom Warden and the squad (`The Shadow Squad` / `Four of them. Four of you.`); the bestiary boss entries with `bossEncountered` / `bossDefeated`; the lair cards; the dungeon victory overlay with the `DUNGEON_EQUIPS` card; the `IMMUNE!` / `REFLECTED!` / `MISS!` floats; the reduced-motion intro variant |
| `audio.md` | every cue by name: v27's `boss`, `boom`, `magic`, `whirl`, `portal`, `hit`, `kidnap`, `shadow_bolt`, `achieve`, `victory`, `victory_ext`, `destroy_pot`, `miniboss` at the call sites above; new: `boss.blastFire`, `boss.cocoonSeal`, `boss.cocoonCrack`, `boss.tetherOn`, `boss.tetherBreak`, `boss.hazardSpawn.<type>`, `boss.wallStun`, `boss.fieldOn`, `boss.fieldBreak`, `boss.shieldUp`, `boss.cageShut`, `boss.summon.<boss>`, `boss.dizzy`, `boss.ring`, `boss.rootSever`, `boss.phantomPop`, `boss.hydraHiss`, `boss.hydraSplit`, `boss.beamCharge`, `boss.beamLoop`, `boss.reflect`, `boss.channelStart`, `boss.channelBreak`, `boss.kidnapBreak`, `boss.meltdown`, `boss.titanEnrage`, `boss.shadowStep`, `boss.wardenShift`, `boss.voidForm`, `boss.queenClone`, `boss.queenDesperation`; the intro's growl timing; the two magma-light flickers share the torch oscillator's audio crackle if one exists |
| `npcs.md` | the five guides' line 2 boss tips are delivered while that island's dungeon is uncleared (story-beats rule) and are now literally true (§3.2); Ed's fire is the far light in the Queen's window; Quartz's line 3 after the Colossus |
| `camp.md` | the Throne of Shadows is Stewart Camp at C6 mirrored (the prop set, the bedrolls or beds, the fence, the woodpile, the workbench, the cabin door); at Crash Meadow after B1.10 the palisade is cleared with the strip at C4 and the King's crown stays as a trophy prop; the wrecked cage is cleared at C4 |
| `systems-engineer` (via `heroes.md` addendum) | one companion targeting preference added: a sibling's containment field (ice block) within 5 m outranks any enemy (§2.10) |

### 5.3 Conflicts found

1. **`enemies.md` §2.9 gives the Shadow Queen's clones the Runt (Goblin) rig re-statted from a sibling.** The spawn prompt and story-beats say the clones are drawn from the shadow squad. Resolved in this file's favour (§2.14): the clones use the sibling's hero rig in the Shadow palette; the v27 stats are unchanged. `enemies.md`'s row needs a one-line edit in the end-of-phase consistency pass.
2. **`enemies.md` §5 recommends the Magma Titan as a Shadow Realm set piece.** The orchestrator's `DECISIONS.md` line already homes the Titan in the Rift; this file follows the decision. No edit needed.
3. **`enemies.md` §5: `Mini-Boss Slayer` counts guardians only "unless bosses.md says otherwise."** This file says otherwise for the two floor mini-bosses (they were `MiniBoss` instances in v27); `kill_miniboss` quests stay island-only. Logged.
4. **`world-events-weather.md` §2.8.2 sets `light.boss` at 1.5 / 2.0 m** and allows bosses.md to raise it; raised to 4 / 5 m (§2.1.5).
5. **`heroes.md` §2.5.11 companion targeting** gains one preference (ice blocks). An addendum, not a contradiction; logged so the heroes file can absorb it.
6. **`world-events-weather.md` §2.5.3 lists the portal as `bosses.md` / story-beats'.** The King no longer spawns it; the portal's build belongs with B3.2 / CS-07 (`cutscenes.md`, `story-beats.md`). Nothing here owns it.
7. **Scale:** `enemies.md` and `world-events-weather.md` are mid-reconciliation to 0.025 m/px; every number here is already at 0.025 and the add stats quoted from `enemies.md` are its px values converted here.
8. **`CONTROL_MODEL` §7.3 records banishment as permanent;** story-beats restores banished heroes on the Queen's death and this file follows story-beats.
9. **The Queen's card colour `#A862C4`** is Collette's v27 base. Kept on the card text (UI over a dark plate) with her body moved off the band; `ui-ux.md` should check the card against Collette's portrait ring (`#E08CF0`) at the finale and may darken the card text to `#7B3CA0` (her v27 P1 bar colour) if they fight. A note, not a conflict.

---

## 6. Decisions logged

Merged into `docs/DECISIONS.md` by the orchestrator after review.

- 2026-09-06 · phase-0.5/bosses · `createPhaseBoss` becomes the one phase machine every boss runs, as data (`BossDef`), with its 1.5 s invulnerable transition made a visible beat (banner, clip, shake, light step) · v27 defined it and never called it; every shipped boss hand-rolled phases with overlapping generic layers · rejected: porting three boss classes.
- 2026-09-06 · phase-0.5/bosses · The generic dungeon-boss `<nm> enrages!` and `FINAL PHASE!` (with their stat and shake) fire on each boss's own P2 and P3 transitions instead of at fixed 50 / 25 % over the top · one stat step per phase; the Treant no longer announces four phase changes; every canon string still lands · rejected: v27's double layer.
- 2026-09-06 · phase-0.5/bosses · Every boss takes `NG_SCALE.enemyHp` and `.enemyDmg` at construction (not spd), as the Warden already did · v27 bosses got easier relative to their adds every NG+ cycle; the Warden shows the intent · rejected: v27's Warden-only scaling.
- 2026-09-06 · phase-0.5/bosses · Goblin King retuned for the Act 1 party: HP `1400 + teamLv × 140` (v27 `2200 + …`), dmg 28 (v27 35), everything else verbatim, `expectedTeamLv 7` as a Phase 2 tunable · story-beats moved him from team level ~18 to ~7; the retune restores v27's felt ratios (≈45 hits, ≈25 % per caged slam) · rejected: v27 numbers (60 hits, 32 % per slam on a solo kid), scaling the cage instead.
- 2026-09-06 · phase-0.5/bosses · Zone and DoT damage accumulates and ticks whole points at 4 Hz at the stated DPS · v27's `floor(N × dt)` then `max(1)` per frame made every 5–15 DPS zone deal 60 DPS · rejected: porting the accident.
- 2026-09-06 · phase-0.5/bosses · Radial Blast, Charge and Spin hit a hero once per activation (Spin then 0.8× per 0.5 s inside, and follows the King); the Colossus beam ticks 0.4× dmg per 0.25 s · v27 hit every frame · rejected: per-frame damage.
- 2026-09-06 · phase-0.5/bosses · Every block has a 0.4–0.8 s recovery after it ends · a boss with no idle between attacks reads as noise at the orbit camera · rejected: v27's zero recovery.
- 2026-09-06 · phase-0.5/bosses · The three dead blocks are built with colliders and assigned: Containment to the Frost Lich's Deep Freeze (the v27 stun 2.5 s and flat 50 kept; siblings can break the ice early), Tether to the Phantom Warden (on a companion), Summon + Shield to the Stone Sentinel · eight blocks were the promise; three fights needed exactly these · rejected: cutting them.
- 2026-09-06 · phase-0.5/bosses · Seventeen block keys added beyond the eight ported ones (`groundSlam`, `summon`, `spin`, `projectilePattern`, `grab`, `sweep`, `blink`, `phantomSplit`, `multiStrike`, `beamSweep`, `reflectShield`, `armorPlates`, `meltdown` name attacks v27 wrote inline per boss; `rootKnots`, `headSplit`, `channel`, `kidnap` are mechanics this file adds or formalises) · v27's bosses did most of their work outside `BOSS_BLOCKS`; a data-driven boss needs every attack to be a block · rejected: leaving per-boss code inline.
- 2026-09-06 · phase-0.5/bosses · Boss arenas blend the follow distance ×1.25 for the fight · a 5.5 m Treant and four kids must fit one frame at pitch 45–55° · rejected: a fixed boss camera, smaller bosses.
- 2026-09-06 · phase-0.5/bosses · The intro grammar: the v27 4.1 s letterbox timeline kept exactly (freeze, `#0B0E1A` bars, 0.8 s to the card, overshoot, growl, `screenShake(12, 1)` under the frozen frame), plus a boss-rig push-in using v27's own dungeon-boss zoom curve (1.0 → 1.4 over 1.5 s, hold, release), the boss's reveal clip on the presentation clock, `boss_appear` lines at 1.6 s, no skip, reduced-motion drops only the motion; the dungeon-boss 5 s black-bar cinematic and its `Guardian of` caption are folded in (the caption becomes the card subtitle) · one code path with the combo beat and `cutscenes.md`; black bars are the anti-palette · rejected: unfreezing the sim (loses the "world trembles while nothing moves" beat), a skip button.
- 2026-09-06 · phase-0.5/bosses · The Kid Snatch cage is a real 1.6 × 1.4 × 1.2 m collider on a pole over the King's head, unreachable until a Ground Slam swings it down in front of him (2 s) or a wall stun drops it beside him (3 s); v27's "attack from above the King's centre" routing is retired · a free-yaw camera has no "above"; the windows become physical · rejected: a screen-space rule, an always-hittable cage.
- 2026-09-06 · phase-0.5/bosses · The P3 cage throw gets a 0.3 s line telegraph and the thrown cage stays as a 1.4 m cover prop; the pole comes off at P3 whether or not the cage was still occupied (the projectile flies only if it was) · the telegraph rule has no exceptions; the silhouette change marks the phase · rejected: an unannounced 50-damage projectile.
- 2026-09-06 · phase-0.5/bosses · Caged lines in each speaker's own glow; captured portraits restored on release; the grab is a visible swing-and-tether, not a teleport; caged kids idle inside on the presentation clock · SI §29 bugs and 3D legibility · rejected: v27's first-captive colour, frozen dots.
- 2026-09-06 · phase-0.5/bosses · A party wipe against the King returns the party to camp and the King waits at Crash Meadow at his current phase; the palisade ring is the arena wall and the King's crown stays as a trophy prop · Act 1 must not end on a game-over screen; the meadow becomes a place the family marked · rejected: v27's overworld game over, a full reset.
- 2026-09-06 · phase-0.5/bosses · Treant: Saplings that live 5 s heal the Treant 2 % per second (the dead `_saplingTimer`); the planted 30 % damage reduction is held by three 40 HP root knots · the bestiary's `Heals itself` and Elm's `Sever the roots!` become true; P2 gets a goal · rejected: a flat DR and a timer that does nothing.
- 2026-09-06 · phase-0.5/bosses · Pharaoh: the five v27 anchors are sun-mark decals; a spread hit curses 4 s (`src.cursed`, ×0.7 outgoing); the real Wraith leaves a sand afterimage after each shift; a dead decoy bursts into 3 Scarabs; the cocoon-stun auto-advance to P3 is kept · the bestiary's `Curses heroes`, Sol's `Track the afterimage.`, and the dead `_realIdx` / `_scarabOnHit` given their intent · rejected: a health-bar-only tell.
- 2026-09-06 · phase-0.5/bosses · Hydra Matriarch phases: P1 three heads and pools, P2 the canon split to five heads, P3 a rising poison flood (`The water rises!`, new text); each head has a collider and a 60-damage stagger meter (droops 4 s) · canon is a bestiary line, Fern's tip and two announces; heads as targets is the 3D reading of "many heads" · rejected: adds, a submerge phase.
- 2026-09-06 · phase-0.5/bosses · Frost Lich phases: P1 Deep Freeze (containment ice) and walls, plus a frost bolt basic; P2 walls placed between the Lich and the party and behind the active hero; P3 BLIZZARD as a `channel` with `visOverride 4`, broken by any single hit over 15; companions attack a sibling's ice block within 5 m first · the canon description and Neve's tip; a melee-only floater would never be at range · rejected: a Wyrm-style breath cone (already the guardian's).
- 2026-09-06 · phase-0.5/bosses · Colossus: the reflect shield re-forms every 12 s in P1 only (v27 consumed it once), P3 adds crystal fall; the Depths is lit only by crystals (proximity-brightening emissives) and Collette's orb with `light.heroPool` off; re-enterable, the rim pulsing at 8 s after the kill; the spark-plug plinth at the back · Quartz's `when the shield shimmers`, story-beats' lighting rule and re-entry, the crater rhythm rhymed · rejected: a permanently consumed shield, torches in the Depths.
- 2026-09-06 · phase-0.5/bosses · Magma Titan: Lava Spray fixed to the modern `Proj` signature at `dmg` per glob (the broken call's intended argument); the plate compass fixed and marked by four braziers; Meltdown announced by a 1.5 s band but still unavoidable; the Rift laid out as Cinder Hall (nests), Magma Channels (crust bridges), and a 36 m ring around a magma lake, lit by magma and the boss light only; the Titan returns only with NG+ · SI §29 bugs; the telegraph rule; story-beats' lair · rejected: a dodgeable meltdown (changes the raid's heal check), rooms.
- 2026-09-06 · phase-0.5/bosses · Stone Sentinel and Phantom Warden get two-beat fights (slam + spikes then Summon + Shield; blink + poison then Tether on a companion), un-letterboxed wake beats, floor names as popup subtitles, and count for `Mini-Boss Slayer` but not `kill_miniboss` · they never spawned in v27 and had no fights; the canon floor hazards and the dead blocks fit them · rejected: boss-tier intros, counting them for island quests.
- 2026-09-06 · phase-0.5/bosses · The shadow squad is the four hero rigs in the Shadow skin with rift-cyan eyes, stats 2× the original's HP and 0.6× its dmg, the original's basic attack and signature (the active hero's shadow at full rate, companions' at half), never ultimates; a mirror match that becomes a fight (they sit at the cold mirror fire in the kids' 30 s idles, walk to their originals, then fight, weighting their originals ×1.5); a shadow-step at 30 %; an un-letterboxed popup `The Shadow Squad` / `Four of them. Four of you.` (new text); no new spoken lines · `heroes.md` §2.6 and Brief §5.3; swapping heroes changes who is chased, so the control model is the mechanic · rejected: a gauntlet, a strict own-shadow-only rule, a goblin-rig squad.
- 2026-09-06 · phase-0.5/bosses · The Shadow Queen's clones are the chosen sibling's shadow rig with the v27 stats, basic attack only, capped at 4 alive · the prompt's "drawn from the squad"; P4 halves the clone timer and v27 had no cap · rejected: `enemies.md`'s Runt rig, no cap.
- 2026-09-06 · phase-0.5/bosses · Citadel Warden: the P2 blink-and-burst gets a 0.8 s destination ring and eight 0.4 s lines; the P1 charge returns in P3; the door opens on his death and the Citadel rewards stay on the Queen · the telegraph rule; a last third that is only bolt-dodging is flat; story-beats' folded Citadel · rejected: v27's untelegraphed burst.
- 2026-09-06 · phase-0.5/bosses · Shadow Queen: body void-black with the v27 `dk` violet `#6C3483` for robe and bolts and rift cyan for P3+ (aura, tether, rings), the card colour `#A862C4` kept on the card only; `riftstorm` starts at P3 and doubles at P4; banished siblings return at her death via the canon `<HERO> revived!` shape at 40 % HP; a warm flame lights in the hearth after the throne falls · v27's `#A862C4` is Collette's old base and `#e84393` is in Isabella's band; story-beats restores banished heroes; the title made literal · rejected: keeping v27's hexes on the body, a new announce string for the return.
- 2026-09-06 · phase-0.5/bosses · Boss palette: the King's `#8B0000` kept (23 points darker than ruby); Pharaoh (`#E8A860`) and Titan (`#D86840`) moved off Noah's orange band to bone-and-turquoise and black-glass-and-ember; Treant, Hydra, Lich, Colossus rebuilt from island tokens; twelve `boss.*` tokens named · `heroes.md` §2.1.3 hue reservation · rejected: v27 hexes on bodies.
- 2026-09-06 · phase-0.5/bosses · The boss bar: phase pips sit on the bar at their thresholds, the v27 phase labels become a tag after the name, enrage pulses the rim, shield pools overlay the fill, the Titan's plates are four pips, the cage and kidnap sub-bars carry the verbatim captions · Brief §6 "a single elegant bar with phase pips" · rejected: a separate cage bar, pips in a row.
- 2026-09-06 · phase-0.5/bosses · Adds die `glow_burst` on the boss's death beat · v27 left them alive; a win should be a win · rejected: v27.
- 2026-09-06 · phase-0.5/bosses · Boss kills roll gear at tier 3, pay `rnd(5,10) × goldMul`, and advance the `boss` bounty · the dead `boss` gold branch's nearest recorded intent (guardian gold) and `heroes.md`'s legendary tier · rejected: inventing a boss gold value, no drop.
- 2026-09-06 · phase-0.5/bosses · `light.boss` range 4 m (enraged 5 m), one per fight, parented to the boss's core, sharing one oscillator with its emissive · world-events allows the raise; light and fire agree · rejected: 1.5 m (invisible on a 5 m boss), a second boss light.
- 2026-09-06 · phase-0.5/bosses · Boss telegraphs: every boss area shape hatched, two new shapes (wedge, band), a thin rim in the boss colour outside the white outline, an 8-of-16 ownership cap and a 12-hazard pool · colourblind-safe by shape and pattern; v27 hazards were unbounded · rejected: per-boss hues, no cap.
- 2026-09-06 · phase-0.5/bosses · The Titan keeps v27's drop-in (0.8 s fall, 15 / 0.7, `boom` 0.6) as its reveal; every other boss gets a reveal clip in place · one boss should land; the others rise, open, assemble or turn · rejected: the drop-in for all (v27).
- 2026-09-06 · phase-0.5/bosses · The Citadel Warden's card subtitle is `Guardian of The Shadow Citadel`, composed from the canon caption template and the canon `citadel` dungeon name · v27 would have printed `Guardian of Shadow Citadel — Floor 3`; the composed form is all canon parts · rejected: new subtitle text.
- 2026-09-06 · phase-0.5/bosses · Thirty-one `boss.*` cue names added for the v27 moments that were silent (cage shut, cocoon crack, tether, field, shield up, beam, reflect, channel, meltdown, shifts) · AU §9 shows most boss mechanics silent; names only, recipes are `audio.md`'s · rejected: reusing `boom` for everything.
- 2026-09-06 · phase-0.5/bosses · Boss arenas: room bosses fight in 20 × 16 m (v27 16 × 12 m), the King in a 28 m ring, the Depths 40 m, the Rift ring 36 m, the Warden's dooryard 20 × 16 m, the hearth 24 × 20 m · 3–6 m bosses, 4.5–5 m blasts and a 10 m charge need the room; the ratios to the hero's reach are kept · rejected: v27's room size.

---

## 7. Reconcile when the brainstorm doc lands

- Its "boss designs" section: if it resolves the Hydra Matriarch or Frost Lich phases, the shadow squad's form, the King's placement, or the Colossus and Titan fates differently, the doc's resolved decision wins with a new §6 line naming what this file's version loses; the blocks and the intro grammar stay.
- If it names the eight blocks' intended uses (which boss was meant to Tether, Contain, or Summon-and-Shield), reassign to match and keep the block specs.
- If it states the King's intended HP curve for his intended level, replace §2.6.1's retune with the doc's curve at the Act 1 level.
- If it defines the Sapling timer, the Pharaoh phantom puzzle, or the Meltdown as something other than §2.7, §2.8 and §2.12 read them, prefer the doc.
- Any resolved decision on whether the shadow squad speaks.

## 8. Open questions for the orchestrator

None. No Rule 1 input blocks this file (the brainstorm doc is §7's). No §2(b) portrayal question arises: the shadow squad is Brief §5.3's own ask, its nameplates are the canon skin names, and nothing in §2.14 claims anything about a kid that a canon line does not; the King's and Queen's threats to the siblings are v27's own mechanics with v27's own words; the two new popup lines describe the shadows, not the family.
