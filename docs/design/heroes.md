# Heroes — Design Bible

**Status:** reviewed by orchestrator 2026-09-06; consistency pass applied 2026-09-07 · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
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

## 2. What it becomes

### 2.0 Hero summary card

Every later design file reads this table first. Hex values are the `src/style/` tokens named in §2.1; roles are the strings the UI prints; heights are model heights in meters (§2.3).

| Hero | base / dark / accent | Role label (UI) | Signature prop | Silhouette one-liner | Signature | Ultimate | Speed class (run m/s) | Height |
|---|---|---|---|---|---|---|---|---|
| **Liam** | `#2A62CF` / `#173A86` / `#D3DDE6` | Tank | Round shield (left arm) + short sword | Broad, planted, a disc on his off-side and three hair spikes; the cape is the only thing that moves | Shield Bash | Excalibur Strike | 4.5 (fastest) | 1.52 m |
| **Noah** | `#EE7F24` / `#1F5E3F` / `#2DB86A` | Ranger | Recurve bow (left hand) + quiver | Narrow and angled, bow-tip above the head, a long green scarf that trails; never fully still | Dodge Roll | Arrow Storm | 4.375 | 1.40 m |
| **Collette** | `#9D4FD8` / `#5B2A8F` / `#E8A838` | Mage | Tall staff with a gold orb (right hand) | Two high pigtails, a flared robe hem, the staff a head taller than she is; the tallest *outline* of the four | Arcane Blink | Arcane Nova | 4.1 | 1.30 m |
| **Isabella** | `#D6294E` / `#8A1538` / `#F0C040` | Whirlwind | Oversized two-handed hammer (as tall as she is) | Smallest body, biggest head, two hair bows, a hammer head wider than her shoulders resting on the ground | Ground Pound | Meteor Drop | 4.0 (slowest) | 1.14 m |

Glow tokens (VFX, rings, damage numbers, emissive trim): Liam `#4A9ED8`, Noah `#FFC46B`, Collette `#E08CF0`, Isabella `#FFD966`. Hair: Liam `#8B6914`, Noah `#5B3A1A`, Collette `#6B3A2A`, Isabella `#D4A03C` (all four hair colours port verbatim from `HDEFS`).

### 2.1 Colour

#### 2.1.1 The tokens

| Token | Hex | Where it lands on the kid (share of surface) |
|---|---|---|
| `hero.liam.base` | `#2A62CF` sapphire | Tunic, sleeves, shield face (55 %) |
| `hero.liam.dark` | `#173A86` deep blue | Cape, trousers, boots, shield rim (30 %) |
| `hero.liam.accent` | `#D3DDE6` steel | Sword blade, shield boss and studs, belt buckle, cape clasp (8 %) |
| `hero.liam.glow` | `#4A9ED8` | Selection ring, Shield Bash trail, Excalibur telegraph, damage numbers, downed ring (emissive only) |
| `hero.noah.base` | `#EE7F24` fox orange | Jerkin, sleeves, bow-limb wrap (50 %) |
| `hero.noah.dark` | `#1F5E3F` pine | Hood (worn down), trousers, boots, quiver (30 %) |
| `hero.noah.accent` | `#2DB86A` leaf green | Scarf, headband, arrow fletching, bow string (12 %) |
| `hero.noah.glow` | `#FFC46B` | Arrow trails, Arrow Storm aura, damage numbers |
| `hero.collette.base` | `#9D4FD8` amethyst | Robe, sleeves (55 %) |
| `hero.collette.dark` | `#5B2A8F` deep violet | Robe hem band, boots, staff shaft wrap, pigtail ties (25 %) |
| `hero.collette.accent` | `#E8A838` amber | Staff orb, belt, robe trim lines, side-bun clips (10 %) |
| `hero.collette.glow` | `#E08CF0` orchid | Spell bolts, Blink streak, Nova rings, point light, damage numbers |
| `hero.isabella.base` | `#D6294E` ruby | Dress, sleeves, cape (55 %) |
| `hero.isabella.dark` | `#8A1538` garnet | Cape lining, leggings, boots, hammer shaft (25 %) |
| `hero.isabella.accent` | `#F0C040` crown gold | Tiara, hammer-head bands, belt, boot buckles (10 %) |
| `hero.isabella.glow` | `#FFD966` | Ground Pound ring, Meteor Drop ring, damage numbers |

Skin (all four): `#F2CBA7` with the per-hero hair tokens above. Eyes: whites `#FFFFFF`, pupils `#2C3E50` (the v27 pupil colour, kept).

#### 2.1.2 Why each colour is right for that kid

- **Liam: sapphire. Kept blue, deepened.** Brief and v27 agree he is blue; both are honoured. v27's `#4A9ED8` is a sky-blue at 57 % lightness and reads as "default engine" under ACES and a warm key; it is demoted to his *glow* so every Liam effect still looks like v27 Liam. The body goes to a saturated sapphire at about 49 % lightness: steady, dependable, the colour of the deep end the oldest kid is allowed in. Cool steel accents (sword, studs) keep him the only *cold* kid in the party, which is the leader's job: he is the one who is "fine, totally fine."
- **Noah: fox orange. The brief's colour over v27's green, with v27's green kept as his accent.** Green fails on the home island: the Forest is emerald and moss (`#0F5132`, `#3A7D44`) and every camp screenshot would swallow him. It is also the anti-palette's "uniform mid-green" waiting to happen. Orange is the fox in the reference diorama: sharp, quick, independent, the animal that "calculated the optimal route." It sings against emerald at golden hour. The cost is the Desert island (ochre `#D9A441`, sienna `#B3541E`), which is why 40 % of Noah is pine and leaf green: on sand he reads as a green-and-orange figure, on grass as an orange one. His v27 green `#2DB86A` survives verbatim on the scarf and headband, so a kid who remembers "green Noah" still finds him.
- **Collette: amethyst. Kept purple, saturated.** Brief and v27 agree. v27's `#A862C4` sits at 45 % saturation and turns dusty in warm light; the base moves to a jewel amethyst. Her amber orb and orchid spell light are the warm and cool notes of a creative kid's paintbox: she is the one who wants curtains and better lighting, so she carries her own light. The orchid glow (not v27's `#e84393` pink) keeps her magic visibly hers now that Isabella owns red.
- **Isabella: ruby. The brief's pink/red over v27's gold, with v27's gold kept as her accent.** Gold fails three ways in the rebuild: golden hour is the hero look and a gold kid merges with the key light; the Desert's ochre is the same hue; and gold is inseparable from Noah's orange for a red-green colorblind player. v27 already leaned red and pink around her: red weapon `#D84830`, pink bows `#e84393`, the Lava and Rainbow skins, Supernova in pink. Ruby is fierce without being angry, and ruby-and-gold is a crown, which is her whole legendary line (Tiny Crown, Crown of Storms). The youngest gets the richest colour in the party; that is deliberate.

#### 2.1.3 Legibility check (one-eighth screen height, golden hour and night, every island)

Base colour of each kid against each island's ground and fog tokens (Brief §4.2), at the gameplay camera, warm key at golden hour and cool fill at night. "Carried by" names what makes the kid unmistakable where colour alone is weak.

| Island (ground / fog) | Liam sapphire | Noah orange | Collette amethyst | Isabella ruby |
|---|---|---|---|---|
| Forest (moss `#3A7D44` / emerald) | Strong | Strong (orange on green) | Strong | Strong |
| Desert (ochre `#D9A441` / dusk violet `#4A2C6B`) | Strong | **Weak on ground**; carried by 40 % pine green, the bow line, dark hair | Weak against the violet sky, strong on the ground; carried by the amber orb | Strong |
| Bog (teal-black `#0B2B2E` / bruise purple `#5A3E78`) | Strong | Strong | **Weak in the fog**; carried by 22 % more lightness than the fog, the orchid point light, the pigtail outline | Strong |
| Frozen (snow `#F2F7FF` / indigo `#1B2A5A`) | Weak against indigo fog at night; carried by steel accents, the cape, the shield disc | Strong | Strong | Strong |
| Shadow (void violet `#120A1F` / ember `#FF6A2A`, rift cyan `#3AF0FF`) | Distinct from rift cyan by value | **Near ember**; carried by the green scarf and the bow (ember is an environment light, never a body colour) | Strong | Distinct from ember by hue (magenta lean) |

Colorblind pairs (protan and deutan by rule: the red channel collapses, the yellow-blue axis survives):

- **Noah vs Isabella:** orange collapses to a strong yellow, ruby to a neutral dark rose; the yellow-axis difference survives. Lightness 54 % vs 50 % is not enough alone, so silhouette carries it: a bow tip above the head vs a hammer head on the ground, a scarf vs bows.
- **Liam vs Collette:** amethyst loses its red and drifts toward blue. Carried by lightness (49 % vs 58 %), by accent temperature (steel vs amber, which sits on the intact yellow-blue axis), and by silhouette (shield disc and spikes vs staff and pigtails).
- **Tritan (rare):** blue vs green is the risk; Noah's green is an accent only, and his body is orange.

Rule for every later file: no enemy or NPC body colour may sit within 20° of hue *and* 15 % of lightness of any hero base above. Enemies draw from the island palettes and desaturated tones; the four hero hues are reserved.

### 2.2 Roles

#### 2.2.1 Role per hero

| Hero | v27 label | Brief | Rebuild label and role | Why |
|---|---|---|---|---|
| Liam | Tank | tank-leader | **Tank**: frontline melee, the party's block, the leader whose Commander branch buffs the team | Kept. The canon tip says "That's why he's the tank." The leader half lives in the Commander branch and in his animation, not in the label. |
| Noah | DPS | ranger-archer | **Ranger** [new text]: fast ranged single-target damage and the party's only long roll | Label changed. "DPS" is a gamer acronym in a family voice; "Ranger" is what a kid who tracks trajectories and hunts for cool bugs *is*. The role is unchanged. |
| Collette | Mage | mage-enchanter | **Mage**: homing magic, crowd control (freeze, slow), the healer branch | Kept. "Collette's magic," "Golden Mage," "Ice Witch" all sit on it. |
| Isabella | AoE | berserker-guardian | **Whirlwind** [new text]: 360° melee bruiser who also carries the Guardian branch | Label changed. "AoE" is jargon and "Berserker" implies rage; her canon is fearless, not furious ("I'M NOT SCARED OF YOU"). "Whirlwind" is her attack (`This requires ISABELLA's whirl!`) and her personality (unstoppable). The kit is unchanged; her Berserker and Guardian branches keep their canon names. |

Nothing structural moves. The four spatial signatures (Liam's cone, Noah's line, Collette's homing bolt, Isabella's circle) are already the cleanest quartet in the design and the 3D camera makes them more readable, not less. The rework is in expression (§2.3–2.4) and in what 3D adds (§2.5).

#### 2.2.2 The Dodge Roll collision, resolved

Brief §5.4 gives everyone a dodge roll with i-frames. Noah's canon signature is `Dodge Roll`. Both survive:

- **Universal verb: "Dodge" [new text].** Every hero has it on the dodge button (§2.5.3): 0.4 s, 2 m, i-frames from 0.05 s to 0.30 s, a 0.5 s recovery before the next one, no other cooldown, no damage, cancels attack recovery. The UI prompt says **Dodge**, never "roll." Each kid dodges in character: Liam tucks behind the shield in a short slide, Noah does a compact tumble, Collette skip-twirls with the staff across her chest, Isabella cartwheels with the hammer as the pivot.
- **Noah's signature stays "Dodge Roll."** It is the big version and it is his: 0.4 s at 7.5 m/s (3 m, one and a half dodges), invulnerable for the whole 0.4 s rather than 0.25 s, an orange afterimage trail, and the part that makes it Noah: he comes up already drawn. For 1.0 s after the roll his next arrow fires instantly, ignores its cooldown, and is a guaranteed crit (the `snapShot` window). "That trajectory was off by at least 15 degrees. ...I've been tracking it." is the roll: he was never dodging, he was lining up the shot. Cooldown 4 s as data; a roll that passes through a hostile projectile or melee swing (a hit negated by the i-frames) refunds 1 s of it, so the kid who dodges well rolls more. Companions never use it (§1.5 rule).

The two never share a name in the HUD: the dodge prompt reads "Dodge" and the signature slot reads "Dodge Roll." A kid who remembers pressing E for Noah's roll still does.

#### 2.2.3 Canon sweep

`grep -n` of `docs/teardown/FAMILY_CANON.md` for `shield|bow|bows|arrow|staff|spell|magic|tank|sword|hammer|hold my hand|big|whirl|precision|smash|crown|blade|aegis|cape|dps|mage|aoe|archer|ranger|berserker|guardian|knight|excalibur|meteor drop|nova|storm|pound|blink|roll|bash|leader` (107 hits) and for every hero name plus `Bella` and `Grambi` (120 hits). Every line that names a weapon, role, or prop, and whether the final kit keeps it true:

| Canon line (FC line) | What it needs | Final kit | Reads true? |
|---|---|---|---|
| `Tip: Liam always volunteers for the hard missions. That's why he's the tank.` (L930) | Liam is the tank, label included | Role label "Tank", 250 HP, shield, block ult | Yes |
| `These cracks look weak... Liam could smash through!` / `Liam smashes through!` / `This requires LIAM's ability!` (L270, L279) | Liam has a smash | Shield Bash is a shoulder-and-shield charge; the cracked-wall room uses it | Yes |
| `⚡ EXCALIBUR STRIKE!` (L288); `Aegis activated!` (L296); `Aegis of Dawn` `+30% HP, auto-shield` (L1050); `Shield Charm`, `Flame Blade` locked to Liam (L1063, L1067) | Liam carries a sword and a shield | Sword in the right hand, round shield on the left arm | Yes |
| `Golden Knight`, `Shadow Liam`, `Flame Knight` (L1138) | Liam is a knight | Tunic, shield, cape | Yes |
| `Fortress`, `Berserker`, `Commander` branches (L1151–1153); `Iron Wall`: `Shield blocks 100% for 3s on ult` | The ult has a shield | Excalibur keeps `shieldOn`; Iron Wall redefined so the text stays true (§2.5.9) | Yes |
| `A distant target... Noah could hit it!` / `Noah hits the target!` / `This requires NOAH's precision!` (L271, L280) | Ranged precision | Bow, the `snapShot` crit, Sharpshooter branch | Yes |
| `⚡ ARROW STORM!` (L289); `Phantom Blades` `+25% spd, chain 2` (L1051); `Rapid Quiver`, `Longbow` locked to Noah (L1064, L1085, L1090); `Golden Archer`, `Frost Archer` (L1139) | Bow, arrows, quiver, speed | Recurve bow, quiver, the second-fastest kid; Phantom Blades is a legendary bow whose arrows chain (name kept; §2.5.10) | Yes |
| `Sharpshooter`, `Volley`, `Trapper` branches (L1154–1156): pierce, twin shot, burst, slow/root/poison arrows | Arrow projectiles | Arrows are projectiles with every modifier defined (§2.5.9) | Yes |
| `Hey do you think there are any cool bugs in here?` (L203) | Nothing mechanical; feeds an emote | "Cool bug" emote (§2.4.6) | Yes |
| `A magic seal... Collette could channel it!` / `Collette channels the seal!` / `This requires COLLETTE's magic!` (L272, L281) | Collette has magic and can channel | Staff, homing bolts, a channel animation for the seal room | Yes |
| `⚡ ARCANE NOVA!` (L290); `Staff of Eternity` (L1052); `Arcane Focus` (staff icon) locked to Collette (L1065, L1086); `Frost Wand` (L1070); `Golden Mage`, `Ice Witch` (L1140); `Arcane Link`: `Heal ally 25% of magic DMG` (L319) | Staff, magic, ice, a healer thread | Staff with orb; Enchanter (frost) and Healer branches kept | Yes |
| `Hold on, I need to fix my hair. ...Okay go.` (L218) | Hair worth fixing | Two high pigtails and side buns; the "Fix my hair" emote | Yes |
| `Gears are jammed... Isabella could break them!` / `Isabella breaks the gears!` / `This requires ISABELLA's whirl!` (L273, L282) | A whirl that breaks things | 360° whirl with an oversized hammer; the gear-lock room needs a whirl hit | Yes |
| `⚡ METEOR DROP!` (L291); `Crown of Storms` `+20% AoE, shockwaves` (L1053); `Tiny Crown` (L1066); `War Hammer` locked to Isabella (L1087); `Berserker`, `Guardian`, `Chaos` branches (L1160–1162); `Blade Dance`: `Whirl attack hits 360°` | Hammer, crowns, a 360° whirl, knockback | Hammer, gold tiara (accent), 360° whirl kept, Chaos branch kept; Blade Dance redefined so "hits 360°" stays literally true (§2.5.9) | Yes |
| `YOU'RE BIG. I'M NOT SCARED OF YOU.` (L229); `I'm not scared. ...Collette, hold my hand though.` (L228); `I'm doing what Collette's doing!` (L232) | The smallest kid, fearless, attached to Collette | Height 1.14 m, the "Not scared" emote, the copycat idle, the hand-hold formation rule (§2.5.11) | Yes |
| `Stay back, Bella.` (L242), Liam | Liam protects the youngest | The "Stay back" emote; Liam's companion AI prefers the enemy nearest Isabella when she is under 40 % HP (§2.5.11) | Yes |
| `Collette get out of our room!` (L194) | Sibling friction; nothing mechanical | Left to story-beats and camp; no prop conflict | Yes |
| `Someone carved: 'L + N were here'` (L945) | Liam and Noah have a history | Feeds the Shield Crash combo pose (§2.5.8) | Yes |
| Shadow skins for all four (L1138–1141); the Shadow Realm's shadow squad (Brief §5.3) | Recolourable kits | Skins are palette swaps (§2.6); bosses.md builds the shadow squad from the same rigs | Yes |
| `Shield Crash`, `Arcane Fortress`, `Earthquake Slam`, `Shadow Barrage`, `Blade Storm`, `Supernova` (L306–311) | Each pair's props combine | The shot list in §2.5.8 uses shield, staff, hammer, bow | Yes |
| `Liam` / `Tank`, `Noah` / `DPS`, `Collette` / `Mage`, `Isabella` / `AoE` (L1202), title-screen showcase labels | v27 UI labels | Two of four change (`DPS` to Ranger, `AoE` to Whirlwind). These are UI labels, not dialogue; the brief licenses renaming abilities and labels. Logged in §6. | Changed, logged |

No canon line is orphaned. The two changed strings are showcase labels on the v27 title screen, not family text.

### 2.3 Silhouette

Four bodies, not one. Every hero must read in solid black against the sky at one-eighth screen height (about 135 px tall at 1080p for Liam, 100 px for Isabella). Silhouette first, colour second, face third.

#### 2.3.1 Proportions

| Measure (m) | Liam | Noah | Collette | Isabella | Rule |
|---|---|---|---|---|---|
| Height (top of head, hair excluded) | 1.52 | 1.40 | 1.30 | 1.14 | Age order by height; steps of 0.12 / 0.10 / 0.16 so the youngest is clearly smallest without being a toddler |
| Head width × height | 0.38 × 0.40 | 0.36 × 0.38 | 0.36 × 0.38 | 0.36 × 0.38 | Heads stay nearly the same size; bodies shrink. That is how real siblings scale, and it makes the younger kids rounder-headed (3.0 heads tall for Isabella, 3.8 for Liam) without a "baby" read |
| Shoulder width | 0.46 | 0.36 | 0.36 | 0.34 | Liam is the only broad one; the tank is a rectangle |
| Stance width (foot centres, idle) | 0.42 | 0.28, left foot 0.10 forward | 0.22, heel-to-toe | 0.36, toes out | Planted / angled / poised / stomped |
| Torso : legs | 1 : 1.0 | 1 : 1.15 | 1 : 1.1 | 1 : 0.9 | Noah is the leggy one; Isabella is all torso and head |
| Hand size | 0.11 | 0.09 | 0.09 | 0.10 | Chunky mitten hands, three fingers implied by facets; Isabella's are slightly big for her (she grips a hammer) |
| Prop length | Shield ⌀ 0.62; sword 0.55 | Bow 1.25 (tip 0.30 above the head when held upright) | Staff 1.55 (orb 0.25 above the head) | Hammer 1.10, head 0.42 wide × 0.26 tall |
| Capsule collider (radius × height) | 0.40 × 1.50 | 0.32 × 1.40 | 0.32 × 1.30 | 0.34 × 1.14 | Sim collision only; the hostile-projectile hitbox is a fixed 0.375 m radius for all four (v27's fixed 15 px, §2.5.1) |

#### 2.3.2 The one shape, the prop, the hair, the cloth, the face

| | Liam | Noah | Collette | Isabella |
|---|---|---|---|---|
| **The one shape that says "that's them" at distance** | A disc off his left side. The round shield is carried outboard, never flat against the body, so from any yaw a half-disc breaks his outline | A line above the head. The bow is held upright in the left hand, its upper tip clearing the hair; at rest the string side faces out | Two lobes and a spike. High pigtails (each a 0.24 m teardrop angled 30° out) plus the staff rising a full head above her; the tallest outline in the party despite the third-shortest body | A block on the ground. The hammer head rests beside her right foot with the shaft up to her shoulder; a small kid beside a big square, plus two bow lobes on the head |
| **Prop, idle** | Shield on the left forearm, face-out, bottom edge at hip height; sword sheathed at the left hip (a 0.55 m bar breaking the leg line) | Bow in the left hand, tip down, angled 15° forward; quiver on the right hip, four fletchings visible above it | Staff planted 0.20 m ahead of the right foot, both hands on it at chest height, orb pulsing (v27: `sin(gt·5)·0.3 + 0.7`) | Hammer head on the ground at her right, both hands on the shaft top, chin nearly resting on her hands |
| **Prop, fighting** | Sword drawn (right), shield raised to chest (left), stance drops 0.06 m | Bow raised horizontal at shoulder, right hand at the cheek; the draw is the attack anticipation | Staff raised, orb forward; bolts leave the orb; the free hand traces a small circle | Hammer up on the shoulder between swings; every basic attack is a full 360° spin around her own axis |
| **Hair** | Three spikes swept back (v27's three 3 × 6 spikes), `#8B6914`, a stiff block hair-cap; the spikes read as a crown of triangles | Half-cap with a green headband (v27's 14 × 4 band), `#5B3A1A`; a short tuft over the band | Two high pigtails + two side buns (v27's four elements exactly), `#6B3A2A`; the buns are 0.09 m spheres, the pigtails are 1-bone tails | A big round volume (v27's r-10 half-disc with two volume lobes), `#D4A03C`, two bows at the sides in ruby base with gold accent centres (v27's pink bows recoloured; §6) |
| **Cloth (the flowing thing; 2-bone chains, procedural sway)** | Knee-length cape in `dark`, clasped at the right shoulder so it hangs over the sword side and leaves the shield free | A long scarf in `accent` looped once at the neck, tail down the back to the knees; the callback to Ed's scarf (AR §11), whose recipe (two segments, six frequencies) it borrows at half amplitude | No cape. The robe hem (a 1-bone skirt bell, flare +0.08 m at the hem) and the two pigtails are her motion | A cape in `base` that is 0.12 m too long for her and drags: a hand-me-down, pinned at both shoulders like a superhero's. Lining in `dark` |
| **Face rule (the one thing only they do)** | Flat, low brows; eyes half-lidded when idle, fully open only in combat and on the ult. The deadpan kid ("Cool. Cool cool cool.") | One brow up, always. Eyes narrower than the others; the head look-at tracks the nearest point of interest (a lantern, a bug, a projectile) even mid-fight | Big eyes with a single lash stroke each; the only kid who smiles by default (a 0.06 m mouth curve) and the only one who *closes* her eyes for her ult | Biggest eyes of the four (0.07 m whites); brows angle down hard in combat and pop up round outside it; she blinks by squeezing both eyes shut, not by lowering lids |
| **Read-at-distance note** | Rectangle with a disc | Narrow triangle with a line | Bell with two lobes and a spike | Small circle-on-circle beside a block |

Shared face system: eyes are two white ellipses with `#2C3E50` pupils on the head mesh's front facet, drawn as vertex-coloured quads; brows are two thin quads; the mouth is a quad shown only for expressions (smile, grit, "o"). The 2-px eye offset toward `face` (AR §16.3) becomes a head look-at: yaw up to ±40°, pitch ±15°, eased at 6/s, target = lock-on target, else movement direction, else the nearest point of interest within 6 m. Blink: 0.15 s every 4 s, staggered `idx × 1.7` s, pupils hidden while closed (v27 rule, kept verbatim).

Ages read through: height and head ratio (above), stance, and hand placement. Liam's hands are at his sides or on the shield; Noah's are always doing something; Collette's rest on the staff; Isabella's are on the hammer or at her hips. No kid is a giant and none is a baby: 1.14 m is a confident small person.

### 2.4 Animation personality

All timings are sim-clock seconds. The bob-amplitude fade (AR §16.3, `bobA` at 5/s) becomes the idle-to-walk blend weight; the breathing (1.5 % chest scale at 1.5 rad/s, phase `idx × 0.9` rad) runs under every idle and every emote.

#### 2.4.1 Shared timings

| Clip | Duration | Notes shared by all four |
|---|---|---|
| Idle | 4.2 s loop | Breathing + a weight shift at 2.1 s; blink on the global timer |
| Walk | 1.0 s loop (two steps) | Used below 2.0 m/s; hip bob 0.02 m at 2× stride, 3 % squash at the contact pose (v27's 6 % halved for 3D), footfall dust puff on each contact (AR §9.2 dust recipe, event-driven) |
| Run | 0.6 s loop | Above 2.0 m/s; lean 8°, bob 0.04 m, arms ±40° |
| Dodge | 0.40 s | I-frames 0.05–0.30 s; recovery 0.5 s; per-kid animation (§2.2.2) |
| Attack combo | 3 clips at the hero's `cd` | Same damage every hit (data); the third clip is the visual finisher and adds `hitStop 0.04` on connect |
| Signature | per hero | §2.4.2–2.4.5 |
| Ultimate | per hero | Includes the v27 VFX lifetimes (§1.2) |
| Hit | 0.20 s | Upper-body flinch only, no control loss (v27 has no hero hit-stun; kept); red flash 0.15 s (v27 `flashT`); `screenShake(4, 0.15)` |
| Knockdown | 0.60 s fall + downed loop + 0.80 s rise | Downed loop: ghosted at alpha `0.3 + sin(gt·3)·0.1`, the 20 s ring in `glow`; rise on revive with the 20-particle burst |
| Victory | 2.0 s | Plays for all four on boss kill and dungeon clear, staggered 0.15 s by index so the party reacts like a family, not a chorus |
| Emote | 2.0–4.0 s | Three per kid; §2.4.6 |

#### 2.4.2 Liam

| Clip | Duration | Personality |
|---|---|---|
| Idle | 4.2 s | Feet planted, shield down, weight shifts once. He is the only kid whose idle has no fidget: steady. Every 3 s the head turns 20° toward the nearest sibling, then back |
| Walk / run | 1.0 / 0.6 s | Heavy contact, short arm swing on the shield side (±12°), full on the sword side. At run the shield comes up to chest height as if he expects something |
| Dodge | 0.40 s | Shield-tuck slide: he drops behind the shield and slides 2 m on the leading foot; no roll. The shield faces the direction he came from |
| Attack 1 / 2 / 3 | 0.35 / 0.35 / 0.35 s (`cd`) | Right slash, left backhand, overhead chop. The chop plants the front foot and adds `hitStop 0.04`. Move speed ×0.3 during each attack state (v27 rule, now 0.20 s on the sim clock) |
| Shield Bash | 0.25 s | Shoulder behind the shield, three quick steps at ramping speed, the shield face flashes white on contact; blue afterimage ghosts at 0.05 s intervals |
| Excalibur Strike | 0.9 s | Sword raised two-handed for 0.5 s (the telegraph circle grows under him, `glow` at 30 %), eyes fully open for the only time; at 0.5 s the sword comes down, the white cross shockwave leaves, the shield bubble appears (a 1.2 m sphere at 12 % `glow`, fresnel rim) |
| Hit | 0.20 s | Absorbs it: the shield arm pulls in, the head barely moves. "That was fine." |
| Knockdown | 0.60 s | Falls to one knee first, then over. The shield lands face-up beside him |
| Victory | 2.0 s | Sheathes the sword, taps the shield twice with a knuckle, one slow nod. That is all. Siblings cheer; Liam nods |

#### 2.4.3 Noah

| Clip | Duration | Personality |
|---|---|---|
| Idle | 4.2 s | Never still: weight shifts every 1.4 s, the bow hand re-grips, the head tracks points of interest. Scarf sway is his largest idle motion |
| Walk / run | 1.0 / 0.6 s | Light, toes-first, a slight forward lean even at walk; at run the bow tucks horizontal against the forearm |
| Dodge | 0.40 s | A compact shoulder tumble, 2 m; the bow stays in hand and comes up on the rise |
| Attack 1 / 2 / 3 | 0.28 s each | Draw-release, draw-release, and a third with a slightly higher arc (a lob); alternate the anchor (cheek, chin, cheek) so the loop does not machine-gun |
| Dodge Roll (signature) | 0.40 s + 1.0 s `snapShot` | A long dive-roll with the orange afterimage trail, then he comes up on one knee with the bow already drawn and holds it for the window; the release is a full-power shot with a bright trail. If the window expires unused he lets the string down with a small "tsk" head-shake |
| Arrow Storm | 1.5 s | Plants a foot, draws once vertically, releases into the sky; the golden aura ring runs under him for 1.5 s while 24 arrows fall in the 10 × 10 m box. He watches them land with the one brow up |
| Hit | 0.20 s | A sharp sidestep flinch; he looks *at* whatever hit him |
| Knockdown | 0.60 s | Sits down hard, then slumps; the bow stays in his hand |
| Victory | 2.0 s | Spins the bow once around the hand, catches it, crosses his arms, one brow up. Told you |

#### 2.4.4 Collette

| Clip | Duration | Personality |
|---|---|---|
| Idle | 4.2 s | Poised, heel-to-toe; the free hand draws a small circle every 2 s that leaves two amber motes (v27's idle sparkles at a lower rate); the orb pulses |
| Walk / run | 1.0 / 0.6 s | The robe hem swings, the pigtails lag by 0.15 s; the staff is carried upright, orb forward, not swung. At run she lifts the hem with the free hand |
| Dodge | 0.40 s | A skip-twirl: one full turn on the ball of the foot, staff across the chest, hem flaring; 2 m |
| Attack 1 / 2 / 3 | 0.60 s each | Cast from the orb, cast from the free hand, a two-hand raise for the third (a taller bolt arc). The hand not casting always keeps the pose |
| Arcane Blink | instant + 0.3 s | She goes up on her toes, eyes closed, and is gone; an orchid streak and the departure ring; she arrives mid-twirl with the hem still flaring. The staff arrives a frame late (a 0.05 s prop lag) |
| Arcane Nova | 1.2 s | Eyes close (her only closed-eye clip), staff raised in both hands, the void collapses at her feet for 0.5 s, then three rings leave; `hitStop 0.15` at the release. She holds the pose a beat too long, on purpose |
| Hit | 0.20 s | A flinch that becomes a hair-check: the free hand goes to a pigtail |
| Knockdown | 0.60 s | Sits, staff across the lap, then lies back; the orb dims to 20 % |
| Victory | 2.0 s | Staff twirl, plant, amber sparkle burst (10 motes), one hand on the hip. "And THAT is how it's done." |

#### 2.4.5 Isabella

| Clip | Duration | Personality |
|---|---|---|
| Idle | 4.2 s | Leans on the hammer, then rocks it; every 3 s she looks straight up at something no one else saw. Her cape is her biggest sway |
| Walk / run | 1.0 / 0.6 s | The hammer drags behind her at walk (a 0.4 m dust trail, 4 %/step) and comes up onto her shoulder at run; big arm swing, a stomp on every contact |
| Dodge | 0.40 s | A cartwheel with the hammer shaft as the pivot; 2 m; lands facing where she started |
| Attack 1 / 2 / 3 | 0.40 s each | Spin, spin, and a 720° double-spin for the third (same damage; a longer trail ribbon). The whirl trail is a ruby ribbon 0.3 m tall at 1.9 m radius, `glow` rim. Move speed is not reduced during whirl (v27 applied the ×0.3 only to `melee`; kept) |
| Ground Pound | 0.35 s | A real hop: 0.10 s crouch, 0.15 s airborne (up 0.5 m, the v27 airborne pose), impact at 0.30 s with the gold ring and both dust recipes; she cannot be knocked back during the hop. v27's 25 ms impact becomes 0.30 s so the hop reads at the camera (§6) |
| Meteor Drop | 2.8 s | She raises the hammer overhead with both hands and *waits* 0.8 s while the shadow grows (the only patient thing she ever does), then brings it down; `hitStop 0.15`, the gold ring, six cracks that now burn (§2.5.9 Rampage) |
| Hit | 0.20 s | She stamps and glares at it; brows down |
| Knockdown | 0.60 s | Sits down with a bump and stays sitting, hugging the hammer, then tips over |
| Victory | 2.0 s | Hammer raised overhead in both hands, a little jump, then she looks over to see if Collette saw |

#### 2.4.6 The idle ladder and the emotes

**Idle ladder (active hero; companions run the 3 s tier always and the 10 s tier at 50 % chance, so camp feels alive):**

| Idle for | Liam | Noah | Collette | Isabella |
|---|---|---|---|---|
| 3 s | Head turn toward the nearest sibling; weight shift | Re-grips the bow, looks at the nearest point of interest | Traces the small circle, two amber motes | Rocks the hammer, looks up |
| 10 s (the v27 `drawHeroIdle` loops, 4 s each, ported as clips) | Kicks a `#7A4018` pebble 0.3 m (1.0 s), then dusts the shield with a forearm (1.0 s) | Adjusts the bow (1.0 s), then flicks a white spark off the string (0.7 s) | Traces a `#A862C4` arc with the staff dropping amber sparkles (0.7 s), then drops a small violet card that flutters down (0.7 s) | Looks left and right (1.0 s), kicks dirt (0.7 s, `#7A4018` puffs), then watches a gold bug orbit her head (1.3 s, the `sin(f·3)·5, cos(f·2)·3` path in metres × 0.025) |
| 30 s | Plants the shield edge-down, leans on it, checks over his shoulder for the others | Crouches and inspects the ground, nose close; if a firefly or spore particle is within 2 m he follows it with his head | Sits on the nearest sittable prop or the ground, fixes each pigtail in turn, then draws in the dirt with the staff tip (a 0.4 m spiral decal that fades in 20 s) | Sits cross-legged, swings her feet; **if Collette is within 4 m, Isabella copies Collette's current idle 0.5 s late** ("I'm doing what Collette's doing!"). Otherwise she nods off against the hammer and jerks awake every 6 s |

**Emotes (player-triggered from the emote wheel; ui-ux.md owns the wheel):** each plays its canon line as a speech bubble in the hero's `glow` colour, at most once per 60 s per line so the lines stay special. The line text is verbatim canon; the emote is new, and the emote names in the table are **[new text]** (labels for the wheel).

| Hero | Emote | Duration | Motion | Canon tie (verbatim line shown) |
|---|---|---|---|---|
| Liam | Cool cool cool | 2.5 s | Three slow nods, a thumbs-up held a beat too long, deadpan | `Cool. Cool cool cool. So we're doing this. Let's go.` (`HERO_REACTIONS.LIAM.quest_intro`) |
| Liam | Shield check | 2.0 s | Dusts the shield, taps it twice, small satisfied nod | The v27 10 s idle (AR §16.3) |
| Liam | Stay back | 2.0 s | Left arm out flat to the side, palm back, head turned over the shoulder; if Isabella is within 3 m she stops behind his arm | `Stay back, Bella.` (FC §2.2) |
| Noah | Fifteen degrees | 3.0 s | Squints, holds up a thumb at arm's length to measure something off-screen, shakes his head | `That trajectory was off by at least 15 degrees. ...I've been tracking it.` (`quest_intro`) |
| Noah | Cool bug | 3.0 s | Crouches, points at the ground, delighted; a small dark beetle particle walks 0.2 m and vanishes | `Hey do you think there are any cool bugs in here?` (`dungeon_enter`) |
| Noah | Told you | 2.0 s | Arms crossed, one brow up, one slow nod | `Tip: Noah calculated the optimal route. Nobody listened. Noah was right.` (`TIPS` 8) |
| Collette | Fix my hair | 3.0 s | Pats both pigtails, adjusts a bun, hands on hips, a firm nod | `Hold on, I need to fix my hair. ...Okay go.` (`mid_boss`) |
| Collette | That is how it's done | 2.5 s | Staff twirl, plant, amber burst, hand on hip (the victory clip, on demand) | `And THAT is how it's done.` (`victory`) |
| Collette | Curtains | 3.0 s | Frames the view with both hands like a designer, staff tucked under the arm, tilts her head | `This place needs curtains. And better lighting. And maybe a rug.` (`dungeon_enter`) |
| Isabella | Not scared | 2.5 s | Stomps, hammer raised overhead, a tiny roar (mouth "o"), brows down | `YOU'RE BIG. I'M NOT SCARED OF YOU.` (`boss_appear`) |
| Isabella | Copycat | matches | Mirrors the most recent emote of the nearest sibling within 4 m, 0.5 s late, at 90 % scale; if no one emoted, she mirrors Collette's idle | `I'm doing what Collette's doing!` (`following_collette`) |
| Isabella | Sugar? | 3.0 s | Scoops a handful of ground, sniffs it hopefully, considers, tosses it over her shoulder | `Tip: Don't let Isabella near the dessert biome. Last time she ate the sand thinking it was sugar.` (`TIPS` 5; the "dessert" typo is canon) |

The orphaned `HERO_REACTIONS` contexts (`dungeon_enter`, `boss_appear`, `mid_boss`, `victory`, `following_collette`, `snack_reward`, `sibling`, `swamp_item`, `crash_landing`) are wired by story-beats.md and cutscenes.md as event triggers; the emotes above are a second, player-driven channel for six of them, never a replacement.

#### 2.4.7 Clips, poses and sockets requested by later files

Added 2026-09-07 in the end-of-phase consistency pass. Every design file written after this one filed its rig requests through the orchestrator; they are answered here so a hero rig is still specified in exactly one place. Nothing below changes an existing clip — each row is an addition. Sockets are bones (§2.7.3); a "pose" is a single-frame additive overlay on the upper body that the locomotion clips play underneath; durations are sim-clock seconds.

| Item | What it is | Duration | Requested by | Phase |
|---|---|---|---|---|
| `carry.L` socket | A free-hand carry socket under `hand.L`. `prop.L` and `prop.R` are the weapon sockets and stay occupied, so anything carried needs its own: the placed lantern, the held fish, the `Rusted Lantern`. While something is in `carry.L` the off-hand arm swing drops to ±8° and the forearm holds at 40° flexion, so the carry reads at the camera | — | `world-events-weather.md` §2.5.2, §2.7.2; `dungeons.md` §5.2 | 3 (lantern) · 4 (fish) |
| `hat` socket | A cosmetic socket under `head` at the brow line, for the aviator goggles worn in flight. Cosmetic only, and only worn seated in the plane, so it never touches the black-silhouette test (§2.3) | — | `npcs.md` §2.3.7, §5.2 | 3 |
| `fish_cast` | Rod back over the shoulder, then forward; the line leaves the tip at 0.8 s | 1.2 s | `world-events-weather.md` §2.7.2 | 4 |
| `fish_reel` | Loop: both hands on the rod, tip dipping at 1.1 Hz, weight back on the heels. Exits into the fish held in `carry.L` | 1.6 s loop | `world-events-weather.md` §2.7.2 | 4 |
| `watch` idle | A companion idle for the bank: stands 1.4 m off, hands behind the back, head tracking the float. Replaces the 3 s idle tier (§2.4.6) for companions while a sibling is fishing | 3.0 s loop | `world-events-weather.md` §2.7.2 | 4 |
| `sit_down` / `sit_idle` / `stand_up` | Per kid, 0.6 s in and 0.6 s out. `sit_idle` is the seated base loop that the seated 30 s idles of `camp.md` §2.7.2 run on top of: Liam checks over his shoulder every 12 s and pokes the fire with a stick every 25 s (1.5 s, 6 sparks); Noah tracks the nearest firefly, ember or moth and flicks the bowstring every 9 s; Collette fixes each pigtail in turn and draws the 0.4 m dirt spiral with the staff tip; Isabella copies Collette 0.5 s late, or nods off against the hammer and jerks awake every 6 s | 0.6 s · 4.2 s loop · 0.6 s | `camp.md` §2.7.2, §5.2 | 2 |
| Four seated flight-bench clips | One per kid on the plane's bench (`npcs.md` §2.3.7): Noah leans out and tracks the ground with one brow up; Collette holds her pigtails down against the wind; Isabella has both arms up like a roller coaster; Liam sits still with one hand on the cockpit rim, looking at the others. On the `hopping` stall-drop all four grab the rim — a 0.4 s additive one-shot over whichever clip is playing | 3.0 s loops · 0.4 s grab | `npcs.md` §2.3.7, §5.2 | 3 |
| `wave` | Arm up at 45°, three sweeps at 1.2 Hz. Isabella waves with both arms and jumps once | 0.8 s | `cutscenes.md` §4.2, §5.2 | 4 |
| `rise` (standalone) | The rise half of the knockdown (§2.4.1) split out so a shot can play it with no fall: downed → one knee (0.8 s) → standing (0.6 s). The knockdown clip is unchanged and now references the same two segments | 0.8 s + 0.6 s | `cutscenes.md` §4.2, §5.2 | 2 |
| Reach-up | Both hands to a lantern post's hook at 1.5 m, hold, back down; used for lighting a post and for any overhead interact. Collette does not use it — she touches the post with the orb for 0.3 s, because the staff already reaches | 1.5 s (Collette 0.3 s) | `npcs.md` §2.9.2; `dungeons.md` §5.2 | 3 |
| `ride` | The standing pose for moving floors, the lift and the sand ride: feet 0.4 m apart, knees soft, arms out at 20°, the body counter-leaning the platform's acceleration by up to 6° | pose | `dungeons.md` §5.2 | 3 |
| `slide` | The skid pose on ice: feet 0.55 m apart and offset, arms out at 45°, torso yawed 15° into the slide, weapon held clear of the ground | pose | `dungeons.md` §5.2 | 3 |
| `ropeHold` | Both hands overhead on a rope or rung, the body hanging with a 4° pendulum at 0.7 Hz, legs trailing | pose | `dungeons.md` §5.2 | 3 |
| Channel loop | Restated, not new: the 1.5 s channel loop this file already promised `dungeons.md` in §5 (staff planted, orb bright, free hand raised). The four ability rooms and the magic seals use it; any hero can channel, and Collette's is the one with the orb | 1.5 s loop | `dungeons.md` §5.2 (already in §5) | 3 |
| First-person head-layer mask | A named bone mask (`head`, `hair`, `pigtail.L/R`, `bow.L/R`) that hides the head layer on whichever rig is carrying the camera, so CS-03 scene 1 can be shot from behind Liam's eyes without his own hair in frame. Body, arms and cloth stay visible | — | `cutscenes.md` §5.2 | 4 |
| Footfall events | Named animation events on the contact poses of the walk (1.0 s loop; contacts at 0.0 and 0.5 s) and run (0.6 s loop; contacts at 0.0 and 0.3 s) clips, carrying `{ foot: 'L' \| 'R', speed }`. The §2.4.1 dust puff already fires on those poses; the events make them addressable so `audio.md`'s `step.*` family and the sim read one source of truth | — | `audio.md` §5.2 | 2 |

### 2.5 The ability kit as data

Everything in this section is data for `src/content/heroes.ts` and rules for `src/sim/`. v27 numbers port verbatim unless a row says "3D change"; every 3D change is in §6.

#### 2.5.1 The scale: 40 px = 1 m

Chosen once, used everywhere: **1 px = 0.025 m**. Reasons: hero run speeds land at 4.0–4.5 m/s, which is a believable sprint for a kid and reads well at the orbit camera; and every ratio in the kit is preserved. The scale was chosen for those two things, not to fix the size of an island. The v27 overworld (`WW = 3200`, L587) is 80 m across at this scale, but that number is only the v27 map's equivalent, not a world-size decision: **islands are authored larger**, at the footprints in `story-beats.md` §2.2 (the Forest island 360 × 300 m, the three destinations about 220 × 200 m, the shard 160 × 140 m), with a per-island uniform `island.layoutScale` (default 1.0; landmark positions in island-local metres scale with it, hero and enemy radii do not) as the Phase 2 density tunable (orchestrator decision, 2026-09-06). All conversions below use it; where a 3D value departs from the strict conversion the row says so.

| Distance | v27 px | 3D m | Note |
|---|---|---|---|
| Run speed Liam / Noah / Collette / Isabella | 180 / 175 / 165 / 160 | 4.5 / 4.375 / 4.125 / 4.0 | Walk (analog stick < 0.5) is 40 % of run; keyboard toggles walk with a modifier |
| Liam melee reach (centre to centre) | 73 | 1.8 | 120° cone kept |
| Isabella whirl reach | 76 | 1.9 | 360° kept |
| Noah auto-attack range · arrow speed · arrow life | 230 · 480/s · 1.5 s | 5.75 · 12 m/s · 1.5 s (18 m) | |
| Collette range · bolt speed · life · homing | 260 · 220/s · 2 s · 3 rad/s | 6.5 · 5.5 m/s · 2 s (11 m) · 3 rad/s | |
| Shield Bash contact radius · travel | 40 · ~30 | 1.0 · **1.5 (3D change)** | 0.75 m does not read as a lunge at the camera |
| Dodge Roll (Noah signature) travel | 80 | **3.0 (3D change)** | The universal Dodge is 2.0; his must be visibly longer |
| Arcane Blink distance · arrival radius | 120 · 40 | 3.0 · 1.0 | |
| Ground Pound radius | 60 | 1.5 | |
| Excalibur / Nova / Meteor radius | 200 / 180 / 160 | 5.0 / 4.5 / 4.0 | |
| Arrow Storm box · spawn height · fall speed | ±200 · 300 · 500/s | ±5 · 7.5 · 12.5 m/s | |
| Combo radii: Shield Crash / Arcane Fortress / Earthquake Slam / Blade Storm / Supernova | 120 / 100 / 150 / 100 / 180 | 3.0 / 2.5 / 3.75 / 2.5 / 4.5 | Shadow Barrage: 16 bolts at 3.75 m/s, life 2 s |
| Combo pairing distance | 100 | 2.5 | Made visible (§2.5.8) |
| Companion threat range melee / ranged · leader gate | 200 / 300 · 300 | 5.0 / 7.5 · 7.5 | |
| Leash teleport | 400 | replaced (§2.5.11) | |
| Revive proximity | 60 | 1.5 | |
| Shockwave / Arcane Explosion radius · Sanctuary · Snare Field · Sniper threshold | 80 / 80 · 150 · 200 · >200 | 2.0 / 2.0 · 3.75 · 5.0 · >5.0 | |
| Knockback impulses: melee / Nova / Bash, Meteor / Vortex | 200 / 200 / 400 / 600 | 5 / 5 / 10 / 15 m/s | Applied as a velocity impulse to the enemy controller, damped by the enemy's own drag |
| Hostile-projectile hero hitbox | 15 | 0.375 | Fixed for all four (v27 rule) |
| Loot magnet potions / gear · pickup | 160 / 110 · 38–42 | 4.0 / 2.75 · 1.0 | `+ magnetStacks × 2.4 / 1.65 m` |

#### 2.5.2 Base stats (port of `HDEFS`)

| Field | Liam | Noah | Collette | Isabella |
|---|---|---|---|---|
| `hp` / `maxHp` | 250 | 140 | 120 | 180 |
| `dmg` | 32 | 16 | 22 | 28 |
| `cd` (s) | 0.35 | 0.28 | 0.60 | 0.40 |
| `run` (m/s) | 4.5 | 4.375 | 4.125 | 4.0 |
| `reach` / `range` (m) | 1.8 | 5.75 | 6.5 | 1.9 |
| `aType` | `melee` | `arrow` | `magic` | `whirl` |
| `sigCd` / `ultCD` (s) | 6 / 25 | 4 / 22 | 8 / 28 | 5 / 20 |
| `sigKey` / `sigNm` | `bash` / Shield Bash | `roll` / Dodge Roll | `blink` / Arcane Blink | `pound` / Ground Pound |
| Level bonus per team level | +12 `maxHp`, +3 `dmg` (§2.5.10) | same | same | same |

Easy ×1.5 `maxHp`, ×0.75 damage taken; Hard ×1.25 damage taken. Only Liam unlocked at start. `HERO_DMG_COLS` becomes the four `glow` tokens (§2.5.12).

#### 2.5.3 Verbs and inputs

| Verb | Keyboard (v27 defaults kept where they existed) | Gamepad (CM §12) | Touch | Rule |
|---|---|---|---|---|
| Move | WASD / arrows | left stick | floating joystick, left half | Camera-relative; diagonal normalised, analog magnitude respected |
| Attack | left click / auto | A / cross | attack button | Auto-attack in range is on by default (assist), off in the settings; aim = lock-on target, else move direction |
| Dodge (new) | Shift, Space when no interaction is in range | B / circle | dodge button | 0.4 s, 2 m, i-frames 0.05–0.30 s, 0.5 s recovery; input-buffered 150 ms |
| Signature | E | X / square | signature button | `sigCd`; companions never use it |
| Ultimate | R (and `0`) | Y / triangle | ultimate button | `ultCD`; companions never use it |
| Combo ultimate | Q (tap = first legal pair in canon order; hold 0.2 s = partner radial) | RB; hold for radial | long-press ultimate | Both charged, partner within 2.5 m |
| Swap | 1–4, portrait click | D-pad direct, LB cycle | portrait tap, swap button | Free, instant, total, no animation; the camera blends 0.15 s |
| Soft lock-on | Tab / middle click | LT | tap enemy | Bounded assist cone 30°, 8 m; reticle in the hero's `glow` |
| Interact | Space | A when a prompt is up | prompt tap | Ult fallback on Space removed; the prompt renders from the live binding |
| Emote wheel | V (hold) | **View / Back (hold 0.3 s)** | HUD button | ui-ux.md owns the wheel; the D-pad is direct hero select (`ui-ux.md` §2.6.2), so a D-pad-down hold would delay Isabella's swap |
| Camera yaw | right-mouse drag; `Z` left / `C` right | right stick X (120°/s at full deflection) | drag on the right half | `Q` and `E` are canon combat binds (combo, signature), so the camera takes the two free keys beside them (`ui-ux.md` §2.6.1–2.6.2); pitch is fixed |

Hero swap keeps v27's exact semantics (CM §12 "KEEP"): the active flag moves, nothing else changes; cooldowns and ult charge keep ticking on everyone; the previous hero becomes a companion mid-animation. The only additions are a 0.15 s eased camera blend and a soft chime (audio.md).

#### 2.5.4 Basic attacks in 3D

| Hero | Resolution | 3D detail |
|---|---|---|
| Liam | Instant hit-scan on the swing's contact frame (0.12 s into the 0.35 s clip), reach 1.8 m, cone ±60° of facing, knockback 5 m/s (+5 × `kbForce`, +2.5 if `knockback`) | Swept ribbon trail (AR §16.4, `MeshLine`-style) in `accent`, 0.2 s; move ×0.3 during the 0.20 s attack state; the third hit adds `hitStop 0.04` |
| Noah | Projectile from the bow at the release frame (0.10 s into 0.28 s), 12 m/s, 0.375 m hit radius vs enemy capsule + arrow radius 0.06 m | Arrow mesh 0.55 m with `accent` fletching, `glow` trail; `multishot` spread 0.15 rad each side, `burst` volleys 0.10 s apart; `pierce N` hits exactly N |
| Collette | Homing bolt from the orb at 0.20 s into the 0.60 s clip, 5.5 m/s, turn rate 3 rad/s, 0.5 s slow (1.5 s with any `slow`) | A 0.18 m orchid sphere with an additive trail and a pooled point light (`glow`, intensity 1.2, range 3 m, ≤ 4 live at once, oldest reclaimed); Spell Echo doubles the cast |
| Isabella | Instant 360° at the whirl's contact frame (0.10 s into 0.40 s), reach 1.9 m, no facing, no base knockback | Ruby ribbon ring 0.3 m tall at 1.9 m for 0.25 s; `shockwave` and `Impact` add the Chaos-branch knockback; no move penalty |

Crit: `0.12 + crit`, ×1.8 or `critMul`, rolled once per swing (all targets crit or none). Lifesteal applies to **every** attack type in the rebuild (v27's melee-only branch is a bug, §1.6). The attack state is 0.20 s on the sim clock, never wall-clock.

#### 2.5.5 Signatures in 3D

| Signature | Data (ported) | 3D shape and telegraph | I-frames | Feedback |
|---|---|---|---|---|
| Shield Bash (Liam) | 6 s cd; 50 % `dmg`; stun 1.5 s; knockback 10 m/s; contact radius 1.0 m | 0.25 s lunge, 1.5 m travel along facing; a ground decal 1.5 × 1.0 m in `glow` at 25 % appears for the lunge and is not a warning (the hit is instant); hits everything the 1.0 m capsule sweeps | 0–0.125 s (v27's first half) | `hitStop 0.06` on first contact (3D change); white shield flash; `snd('boom', 0.2)` at the end (v27) |
| Dodge Roll (Noah) | 4 s cd; no damage | 0.4 s, 3.0 m at 7.5 m/s; orange afterimage ghosts every 0.05 s at 30 % alpha; `snapShot` window 1.0 s after | Whole 0.4 s | 1 s refund per negated hit; the drawn-bow hold pose; a rising two-note cue when the window opens (audio.md) |
| Arcane Blink (Collette) | 8 s cd; 75 % `dmg` within 1.0 m of arrival | Instant 3.0 m along move input (facing if idle); blocked by walls via a capsule sweep, falling back to the farthest clear point (v27 reverted the whole blink; 3D change: partial blink) | None (v27) | 8 departure motes in `base`, 8 arrival motes in `glow`, a 0.3 s streak; `snd('magic', 0.2)` |
| Ground Pound (Isabella) | 5 s cd; 80 % `dmg`; slow 1.5 s; radius 1.5 m; enemy bounce 0.2 s | 0.35 s hop with impact at 0.30 s (3D change from 25 ms); a 1.5 m ring decal in `glow` grows over 0.15 s at impact | None, but knockback-immune during the hop | `screenShake(4, 0.15)`, `hitStop 0.06` (3D change), gold and dirt bursts (AR §9.2), `snd('boom', 0.3)` |

#### 2.5.6 Ultimates in 3D

| Ultimate | Data (ported) | Telegraph shape (ground decal, colorblind-safe by shape) | Timeline | Camera and stop |
|---|---|---|---|---|
| Excalibur Strike | 25 s cd; 5.0 m radius; 1.5× `dmg`, 2× vs boss; `shieldOn` for `shieldDur` (4 s) | A circle growing to 1.5 m under Liam for 0.5 s, then a **cross** of two 10 × 0.75 m bars | 0–0.5 s raise; 0.5 s strike; cross shockwave 0.4 s; shield bubble 4 s | `screenShake(10, 0.5)`, `hitStop 0.1` (v27 sites kept) |
| Arrow Storm | 22 s cd; 24 arrows (40 capstone) every 0.05 s; 2× `dmg` each; 10 × 10 m box | 24 **small circles** (0.4 m) appear where arrows will land, 0.3 s before each impact | 1.5 s aura; arrows fall 0.6 s each | `screenShake(5, 0.3)`; each impact a 4-particle dust puff |
| Arcane Nova | 28 s cd; 4.5 m radius; 1× `dmg`, 2× vs boss; stun `ultFreeze` (2.5 / 4 s); slow +1.5 s; knockback 5 m/s | **Three concentric rings** 4.5 / 3.5 / 2.5 m staggered 0 / 0.2 / 0.4 s in `base` / `glow` / `#C49BF0` | Void collapse 0.5 s; rings 0.8 s each; total 1.2 s | `hitStop 0.15`, no shake (the freeze is the punctuation, AR §9.2) |
| Meteor Drop | 20 s cd; 4.0 m radius; 3× `dmg`, 2× vs boss; knockback 10 m/s; Vortex pulls at 15 m/s first | A **filled circle** 4.0 m whose shadow darkens from 0.25 to 1.0 m over 0.8 s (the growing shadow) | 0.8 s anticipation; impact; ring 0.3 s; cracks burn 3 s (§2.5.9 Rampage) | `screenShake(15, 0.6)` at cast and at impact, `hitStop 0.15` at impact, `snd('boom', 0.5)` twice |

`ultOn` lasts 3 s for all (Liam overrides with `shieldDur`); `ultChargeRate` multiplies recharge exactly as v27. Companions charge but never fire.

#### 2.5.7 Hit-stop and shake

The four v27 hit-stop sites port verbatim (Liam ult 0.1, Collette ult 0.15, combo impact 0.15, dungeon boss death 0.1). Three are added for 3D weight: Shield Bash first contact 0.06, Ground Pound impact 0.06, any hero's third-hit finisher on connect 0.04. Nothing else may add hit-stop without a §6 line. Shake ports the AR §10 table unchanged, plus the ±0.3° roll component AR §10 recommends; hero-taking-damage stays `screenShake(4, 0.15)` with the red vignette, and the shake-intensity slider from Brief §6 scales all of it.

#### 2.5.8 Combo ultimates and the cinematic beat

Data ports verbatim: six pairs, `(dmgA + dmgB) × mult` at the pair's midpoint, both ults consumed, both charged, partner within 2.5 m. The six colours keep their v27 hexes as `combo.shieldCrash #4A9ED8`, `combo.arcaneFortress #A862C4`, `combo.earthquakeSlam #D88030`, `combo.shadowBarrage #3DCC7A`, `combo.bladeStorm #E8A838`, `combo.supernova #e84393`.

**Pair selection (3D change, CM quirk 15):** tap = the first legal pair in `COMBO_ULTS` order (v27 behaviour, kept as the default so nothing changes for a kid mashing Q); hold 0.2 s = a radial of the legal partners' portraits, release to fire. **Visibility (3D change):** when both ults are charged and the partner is within 2.5 m a thin dotted tether in the combo colour runs between the two heroes at 40 % alpha, breathing at 6 rad/s (the v27 pill's pulse, moved into the world).

**The beat (1.4 s, Brief §5.4):**

| t (s) | What happens |
|---|---|
| 0.00 | `hitStop 0.15` (sim frozen). Letterbox bars slide in to 12 % of height over 0.15 s. Camera cuts to a two-shot: 4 m from the pair's midpoint, pitch 30°, yaw 40° off the active hero's facing, both heroes framed |
| 0.15–0.75 | Sim runs at timescale 0.2 (0.12 s of sim). The pair's pose plays (below). The name card `⚡ <name>! ⚡` appears centre-bottom in the combo colour (verbatim announce string, FC §2.5) |
| 0.75 | Impact: `hitStop 0.15`, `screenShake(15, 0.6)`, `snd('boom', 0.5)`, 25 particles in `[col, #fff, #E8A838]` (v27), damage applied |
| 0.90–1.40 | Camera blends back to the gameplay rig; bars slide out |

Reduced-motion: no camera move, no bars; the freeze, the pose, and the card remain. Multiplayer: the beat plays for every client; the host resolves damage.

| Pair | Pose (the two-shot) | Impact VFX |
|---|---|---|
| Shield Crash (Liam + Noah, 3.0×, 3.0 m) | Liam drops to a knee and braces the shield flat; Noah vaults off it, one foot on the rim, and fires straight down into the midpoint. The "L + N" pair | A 3.0 m ring in `combo.shieldCrash` with a steel flash; cross-hatched crack decals |
| Arcane Fortress (Liam + Collette, 2.5×, 2.5 m) | Liam raises the shield; Collette touches the orb to it; the shield glows violet | A 2.5 m bubble grows from the shield and bursts outward; enemies inside take the damage |
| Earthquake Slam (Liam + Isabella, 3.5×, 3.75 m) | Liam's overhead chop and Isabella's hammer land on the same spot, a beat apart (Isabella second, harder) | A 3.75 m crack-ring decal, dirt burst ×2, the longest shake tail |
| Shadow Barrage (Noah + Collette, 2.0×, 16 bolts) | Noah draws; Collette's orb touches the arrow tip; it splits | 16 bolts leave the midpoint radially at 3.75 m/s in `combo.shadowBarrage`, each `baseDmg / 16` |
| Blade Storm (Noah + Isabella, 2.5×, 2.5 m) | Isabella starts a whirl; Noah fires through it; the arrows pick up the spin | A 2.5 m ring of spinning arrow silhouettes in `combo.bladeStorm` for 0.4 s |
| Supernova (Collette + Isabella, 4.0×, 4.5 m) | **Collette takes Isabella's hand.** They raise staff and hammer together with the free hands; Isabella's eyes are shut tight, Collette's are open | A pink-white star bursts to 4.5 m in `combo.supernova`; the strongest combo is the hand-hold |

Combo ultimates become available to every player in multiplayer (CM §12: the host-only gate was an accident), still gated on both ults charged.

#### 2.5.9 XP, level-up cards, skill trees (intended bonuses)

**XP** ports verbatim: team-wide, `need = 30 + teamLv × 15` (45, 60, 75 ... 330 at level 20), multipliers in v27 order (NG+ → blood moon ×3 or night ×1.5 → quest `xpMul` → first Commander `xpBonus`), every fifth level auto-saves, sources as SI §8. Level-up: `+12 maxHp` and `+3 dmg` per team level through the baseline pipeline (§2.5.10), heal 20 as an event, `+1` skill point to all four from team level 3, the 30-particle `levelUpBurst` in `[base, #E8A838, #fff]` and the 0.30 alpha flash (AR §9.2).

**Level-up cards** port verbatim (FC §11.11 names and descriptions, SI §9 effects and gates). Card 3's colour is the hero's `base`. Card picks are recorded as a list and replayed by the baseline pipeline so they survive load, respec, and NG+.

**Skill trees:** twelve branches, points, tiers, capstone forks, `investAllSkills` skipping capstones, the 150-gold Scroll of Respec: all verbatim. Every node below states the *intended* effect; the "3D definition" column is new only where v27's field was dead (§1.6).

| Branch (hero) | T1 | T2 | Capstone A | Capstone B | 3D definitions for previously dead nodes |
|---|---|---|---|---|---|
| Fortress (Liam) | Iron Skin `maxHp ×1.3` | Reflect `reflect 0.15` | Iron Wall `shieldDur 3` | Thorns Aura `thorns 0.25` | **Iron Wall:** the Excalibur shield also covers every hero within 3 m of Liam for 3 s (100 % block, the text stays true). Liam's own shield keeps its 4 s |
| Berserker (Liam) | Fury `dmg ×1.2` | Critical Eye `crit +0.15` | Blood Rage `bloodRage 3` (+40 % speed 3 s per kill) | Execution `execute 0.2` (2× below 20 %) | Working in v27; kept |
| Commander (Liam) | Swift Lead `teamSpd ×1.1` | War Cry `teamAtk ×1.15` | Rally Banner `rallyHeal 0.3` | Field Marshal `xpBonus 0.25` | Kept |
| Sharpshooter (Noah) | Eagle Eye `rng ×1.25` | Pierce `pierce 2` | Headshot `critMul 3` | Sniper `distBonus 0.5` (>5 m) | **Pierce N:** an arrow hits exactly N enemies (v27 pierced everything) |
| Volley (Noah) | Quick Draw `cd ×0.7` | Twin Shot `multishot 2` | Arrow Storm `ultCount 40` | Rapid Fire `burst 3` | Kept; attack cooldown floors at 0.12 s (v27 had no floor) |
| Trapper (Noah) | Slow Arrows `arrowSlow 1` | Root Shot `rootEvery 4` | Snare Field `snareField 8` (5 m zone) | Poison Tips `poisonDot 3` (4 s) | **Root Shot:** every 4th arrow roots 1.5 s (the enemy cannot move but can attack; a vine decal at its feet) |
| Elementalist (Collette) | Arcane Power `dmg ×1.3` | Chain Spell `chain 1` | Arcane Explosion `deathExplode 0.5` (2 m) | Spell Echo `echo 0.2` | **Chain:** on hit the bolt jumps to the nearest other enemy within 3 m, once per `chain`, at 60 % damage |
| Enchanter (Collette) | Permafrost `slowDur ×1.2` | Shatter `frozenDmg 0.25` | Deep Freeze `ultFreeze 4` | Ice Armor `iceArmor 0.2` | **Permafrost:** every slow duration she applies ×1.2. **Shatter:** +25 % damage to targets with `slowT > 0` or `stunT > 0` |
| Healer (Collette) | Rejuvenation `teamRegen 2` | Life Tap `killHeal 10` | Sanctuary `sanctuary 5` (25 HP/s, 3.75 m) | Spirit Link `spiritLink 0.3` | Kept |
| Berserker (Isabella) | Fury `dmg ×1.25` | Extended Reach `rng ×1.2` | Rampage `ultExtend 0.5` | Blade Dance `fullWhirl 1` | **Rampage:** Meteor Drop's six cracks burn for 3 s (10 damage/s inside the 4 m circle); each kill during the burn adds 0.5 s. **Blade Dance:** every whirl hits its full 360° twice: a second tick at 50 % damage 0.15 s after the first |
| Guardian (Isabella) | Thick Skin `maxHp ×1.4` | Stoneskin `dmgReduction 0.15` | Bodyguard `bodyguard 0.3` | Unstoppable `immune 1` | **Unstoppable:** immune to slow, stun, root, and knockback; the tiara gains a steady gold emissive |
| Chaos (Isabella) | Impact `knockback 1` | Tremor `kbForce ×1.3` | Vortex `vortex 1` | Shockwave `shockwave 5` (2 m ring) | Kept; `_shockCount` counts melee and whirl hits only (v27) |

`applySkillDmgMods` (Execution, Sniper), `onKillEffects` (Blood Rage, Life Tap, Arcane Explosion, Rampage), and the Bodyguard / Spirit Link / Thorns gates in `takeDmg` port in v27 order.

#### 2.5.10 Gear, legendaries, mastery, and the stat pipeline

**The pipeline (3D change, fixes §1.6):** hero stats are always recomputed from scratch in this order: `HDEFS` base → team level (+12 `maxHp`, +3 `dmg` per level) → difficulty → recorded level-up card picks → skill-tree picks (tier and capstone from the real `{key, tier, capstone}` branch objects) → legacy `EQ_LIST` effects with v27's diminishing returns → three-slot gear with `GearItem.getStats()` and legendary `fx` → `hp` clamp. Respec clears one hero's branch picks, refunds `sum(tier)` points, and recomputes; it can never grant a stat. Dungeon exit no longer needs the 41-field snapshot.

**`GEAR_DB`, `EQ_LIST`, rarity, drop pools, sell values, stash (20), pickup, magnet:** verbatim from SI §23 as data. Fixes folded in: Sunstone Crest writes `crit`; War Hammer's `aoe 0.1` adds 10 % to whirl and melee reach; `pierce` is a count; lifesteal works for every attack type; the boss drop tier `rollGearDrop(3, …)` is called on boss kills so legendary rarity is reachable; `h.stats` is saved. Weapon visuals (`wVis`) become prop material swaps: `sword #B0B0B0`, `flame #D84830` with an ember tip, `quick #D88030`, `arcane #A862C4`, `heavy #7A8A9A`, `frost #6BCCEE` with a white wash, `shadow #3D2066` with a violet aura; the 60 %-per-frame weapon-trail particles become a per-swing ribbon tint.

**Legendaries (one per hero, names and descriptions verbatim):**

| Item | Effect (ported) | On the model |
|---|---|---|
| Aegis of Dawn (Liam) | `maxHp ×1.3`, `dmg +8`; below 25 % HP with the 10 s internal cooldown ready: `shieldOn` 5 s, `Aegis activated!` | The shield rim gains a dawn-gold emissive band (`#E8A838`), pulsing 2 rad/s; the auto-shield needs a defined `shield` sound (v27's was undefined; audio.md) |
| Phantom Blades (Noah) | `spd ×1.25`, `chain 2`: arrows jump twice (§2.5.9 chain rule) | A dark `shadow`-tier bow with a violet aura; arrows leave a violet ghost |
| Staff of Eternity (Collette) | `dmg ×1.4`, `pierce 99` | The orb turns white-hot with an orchid corona; its point light doubles range to 6 m |
| Crown of Storms (Isabella) | `rng ×1.2`, `shockwave 2` (a 2 m ring every 2nd hit) | The tiara becomes a full crown in `accent` with one storm mote orbiting it (the v27 accessory-orbiter recipe, AR §15.2) |

Collecting all four: `Legendary Hero` (FC §9). Legendary aura: ring 0.55 m at `rgba(232,168,56,0.3)` plus 8 %-per-frame rising motes (AR §15.2) becomes a 2-mote/s emitter and an emissive ground ring.

**Mastery titles** verbatim: Novice 0, Adept 100, Veteran 300, Master 600, Legend 1,000, Mythic 2,000 kills per hero, cosmetic; persisted with `stats`.

**Incoming damage** (`takeDmg`) ports the gate order verbatim: `_sigImmune` (`IMMUNE!`) → `shieldOn` (`BLOCK!`) → `dodge` roll (`DODGE!`) → difficulty → `dmgReduction` → `iceArmor` → Spirit Link → Bodyguard → minimum 1 → flash, shake, vignette, number → Thorns. The universal Dodge's i-frames set `_sigImmune` so the same gate serves both. **New passive, Shield Front [new text] (Liam, 3D change):** a hostile projectile that hits Liam from within ±45° of his facing while he is not attacking or dodging deals 50 % and visibly deflects off the shield (a steel spark, `REFLECT!` is not shown; the number is halved). Companions' AI faces threats, so companion-Liam uses it too.

#### 2.5.11 Companions, formation, downed, caged

**Rules kept whole (CM §12):** one active hero, three AI companions; companions never use signatures, ultimates, or combos; passive skills run on companions; nearest-target selection with three preferences added, in this order: **a sibling's containment field within 5 m outranks any enemy** (the Frost Lich's ice block, `bosses.md` §2.10 — breaking the block ends the sibling's stun early, so getting them out beats hitting anything); then the player's lock-on target; then the enemy attacking a downed ally; the kiting band (`idealDist = range × 0.7`, back off under 0.4×, close over 1.3×, sine strafe `sin(t·2 + idx) × 0.4` in the pocket); melee close-and-brake; threat range 5 / 7.5 m and the 7.5 m leader gate so backing off resets a fight; the Kid Snatch rules (active hero exempt, caged heroes leave the sim, `_rescueGrace` 3 s).

**The fall-through bug: a tuned middle (decision).** The damping branch is removed and the combat multipliers are retuned so companions land near the v27 *feel* (purposeful, not twitchy) but visibly commit: melee close 0.70× run (v27 coded 1.15×, effective ~0.58×); ranged close 0.50× (coded 0.80×, effective ~0.30×); ranged back-off 0.70× (coded 1.0×, effective ~0.44×); strafe amplitude 0.25× (coded 0.30×, effective ~0.09×, which is why v27 companions never visibly strafed; now they do). Follow speeds keep the coded ramp (1.6× beyond 3.75 m from the slot, 1.2× beyond 2 m, 1.0× inside), which the bug never touched. Tunables live in `src/content/companions.ts`.

**Formation slots (3D change):** the conga line becomes three slots relative to the active hero's facing: A at 1.6 m, 135° (behind-right); B at 1.6 m, 225° (behind-left); C at 2.2 m, 180°. Companions take slots in index order. Two family rules: **Isabella's slot is always the one adjacent to Collette's** when both are companions ("hold my hand"), and when they idle together at camp they stand 1.0 m apart, not 1.6. **Liam as a companion prefers the enemy nearest Isabella when her HP is under 40 %** ("Stay back, Bella"). Slot distances keep every companion inside the 2.5 m combo radius, as v27's follow distance did.

**Navigation (3D change):** steering with capsule sweeps against the collision world, a 4 s stuck timer, then a 0.3 s fade-out/fade-in teleport to the slot (never a visible pop). **Telegraph avoidance (minimum viable, Brief §5.4):** a companion standing on a hostile telegraph decal steps to its nearest edge within 0.4 s if a clear path exists; below 25 % HP a companion disengages to its slot and stays there until 40 %.

**Companion facing:** `idx !== activeHero` (fixes CM quirk 3).

**Downed and revive:** verbatim (20 s timer, `hp = 40 %` on revive, teleport to the death spot, the nearest live hero takes control with a 0.15 s camera blend and `Switching to <HERO>!`, Phoenix Feather / Second Wind intercept at 50 %). **3D change:** the ×3 proximity revive (a live hero within 1.5 m) works in single player too, and a companion with no enemy within 5 m walks to a downed sibling and kneels; the family helps each other. Game over only when no hero is `unlocked && !dead && !downed && !banished`; restart is an explicit button.

**Caged:** verbatim, including the four voice lines and the empty index 0 (Liam is silent in the cage). bosses.md owns the cage entity; ui-ux.md owns the captured-hero overlay.

#### 2.5.12 Damage numbers and hero-attached rings

Damage numbers (AR §14) port the size curve, the 1.0 s arc with one bounce, the crit scale-pulse and prefix, the outline, the 30 cap, and the toggle, as screen-space billboards spawned at the hit point. Colours: the four hero `glow` tokens replace `HERO_DMG_COLS`; enemy damage stays `#D84830`; healing `#3DCC7A`. The no-source fallback ladder (white / gold / orange / red by size) becomes white at three weights, because hue now means "who" and Noah and Isabella own orange and red.

Hero-attached effects: the ult aura (`shadowBlur` breathing) becomes an emissive rim in `glow` at `0.4 + sin(t·10)·0.2`; the downed ring (r 0.5 m, `glow`, 20 s sweep) and the revive progress ring (r 0.6 m, `#3DCC7A`) are ground decals; stun stars port as three gold motes orbiting 0.45 m above the head; the armour glow and accessory orbiter port per AR §15.2 at the metre scale. **The selection ring is new** (§2.7.5).

### 2.6 Skins

`HERO_SKINS` stays, all sixteen, names and unlock tokens verbatim (FC §11.9, SI §4). A skin is a **palette swap**: it replaces `base` and `dark` (the cape follows `dark`) by remapping vertex colours at equip time; the hero's `accent`, `glow`, hair, and silhouette never change, so identity survives any skin. Hexes port verbatim from the v27 table (`golden #f1c40f / #C89E28`, `shadow #2c3e50 / #1a252f`, `fire #e74c3c / #A83828`, `frost #6B8EC8 / #4a86c8`, `ice #94C4DC / #6ca0c0`, `rainbow #e84393 / #c23277`). Two notes: the four Shadow skins make the party one colour, which is the point of a reward that mirrors the Shadow Realm (bosses.md builds the shadow squad from these exact swaps plus rift-cyan `#3AF0FF` eyes); Rainbow Isabella keeps her gold tiara, so she reads as pink-and-gold, distinct from the Lava skin's red. Cost: zero draw calls, one vertex-colour rewrite per equip. `Fashionista` (4+ skins) counts as before.

### 2.7 The Phase 1 pilot Liam

Build-ready. This is the Liam the render engineer builds in `pilot/` and the art director scores.

#### 2.7.1 Model source

Brief §4.6 preference order is custom Blender GLB → Kenney Mini Characters (CC0) adapted → procedural blocky rig. **Recommendation for the pilot: the procedural rig, built in code from primitive geometry with vertex colours, using the bone names in §2.7.3 as the contract.** Reasons: it is deterministic and needs no external verification to start the visual loop tomorrow; the loop scores proportions, colour, facets, and motion, all of which a blocky rig exercises fully; and its bone names become the import contract for any later GLB, so nothing is thrown away. **Upgrade path:** at Phase 2 the render engineer runs a Rule 2 gate on Kenney Mini Characters (download the pack, record the real GLB node and bone names, triangle counts, and licence in `assets/LICENSES.md`); if its proportions can be re-scaled to §2.3.1 without stretching facets, swap the body mesh under the same bones; otherwise keep the procedural rig for all four. Custom Blender GLBs only if Andrew supplies a Blender pipeline (a Rule 1 ask, not assumed).

#### 2.7.2 Geometry and material

| Part | Primitive | Tris (approx.) | Colour |
|---|---|---|---|
| Head | 8-sided low-poly sphere, 0.38 × 0.40 m, flattened front facet for the face | 96 | skin |
| Hair cap + 3 spikes | A half-sphere cap plus three 4-sided pyramids swept back 25° | 60 | `hair` |
| Torso | Tapered 6-sided prism 0.46 m at the shoulders, 0.38 m at the hips, 0.48 m tall | 36 | `base`, belt band `dark`, buckle `accent` |
| Upper arms / forearms | 6-sided prisms, 0.20 / 0.19 m | 4 × 36 | `base` (sleeves), forearm `dark` |
| Hands | 6-sided blocks 0.11 m | 2 × 24 | skin |
| Thighs / shins | 6-sided prisms 0.24 / 0.23 m | 4 × 36 | `dark` |
| Boots | 6-sided blocks 0.14 × 0.10 × 0.22 m | 2 × 36 | `dark`, toe cap `accent` |
| Shield | 12-sided disc ⌀ 0.62 m, 0.05 m thick, raised 8-sided boss and four studs | 120 | face `base`, rim `dark`, boss and studs `accent` |
| Sword | 0.55 m: 4-sided blade, 4-sided guard, 6-sided grip | 40 | blade `accent`, guard `#E8A838`, grip `dark` |
| Cape | 2-bone strip 0.30 m wide, 0.70 m long, 4 segments | 24 | `dark` |
| Face | 2 eye quads, 2 pupil quads, 2 brow quads, 1 mouth quad (hidden unless expressive) | 14 | white, `#2C3E50`, `hair`, `#8A1538` |
| **Total** | | **≈ 700** | Budget ≤ 1,200 per hero, ≤ 200 per prop |

One `MeshStandardMaterial` for the whole hero: `flatShading: true`, `vertexColors: true`, `roughness 0.9`, `metalness 0`, no textures. Emissive trims (`accent` on the boss, the ult rim) use a second material with `emissive = glow`, `emissiveIntensity 0.6`, on the bloom layer. Draw calls per hero: 2 (body+props merged, emissive parts), 3 with the cape as a separate skinned strip. Shadows: cast and receive; the shadow map is the §4.3 rig.

#### 2.7.3 Rig

Bone list (Object3D hierarchy for the procedural rig; the same names are the GLB import contract): `root` → `hips` → `spine` → `chest` → `neck` → `head` → `hair`; `chest` → `shoulder.L/R` → `upperArm.L/R` → `forearm.L/R` → `hand.L/R`; `hand.R` → `prop.R` (sword socket); `forearm.L` → `prop.L` (shield socket); `hand.L` → `carry.L` (the free-hand carry socket, §2.4.7); `head` → `hat` (the cosmetic goggles socket, §2.4.7); `hips` → `thigh.L/R` → `shin.L/R` → `foot.L/R`; `chest` → `cape.0` → `cape.1`. Collette adds `pigtail.L/R` under `head`; Isabella adds `bow.L/R` under `head`; Noah adds `scarf.0/1` under `neck` and `quiver` under `hips`. Pivot heights: hips 0.78 m, chest 1.05, neck 1.28, head centre 1.32 (Liam).

#### 2.7.4 Idle and walk (the two pilot clips)

**Idle (4.2 s loop):** chest scale `1 + 0.015·sin(t·1.5 + 0.9·idx)` (v27 breathing, verbatim); shoulders rise 0.4° with the breath; a weight shift at 2.1 s (hips 0.02 m to the right over 0.5 s, back at 3.6 s); head yaw `±8°` toward the look-at target eased at 6/s; shield arm held at 12° abduction, sword sheathed; cape sway `cs = sin(t·0.8)·0.3` rad (v27's cape formula) on `cape.0`, half again on `cape.1`, plus a wind term from the weather system. Blink: eye quads scale Y to 0.3 for 0.15 s every 4.0 s at `(t + 1.7·idx) mod 4 > 3.85`, pupils hidden while closed (verbatim). The 3 s / 10 s / 30 s idle ladder (§2.4.6) runs on top; the 10 s pebble-kick is the Phase 1 emote slot and must be in the pilot because the reference is "cozy, precise, alive."

**Walk (1.0 s loop, 2 steps, ≤ 2.0 m/s):** contact poses at 0.0 and 0.5 s; hips bob 0.02 m at 2 Hz with a 3 % squash at contact; thighs swing ±30°, shins lag 0.08 s; sword-side arm swings ±25°, shield arm ±12°; torso yaw ±4°; head counter-yaw 2°; cape trails with `sin(t·6.3)` at 0.15 rad; a dust puff (AR §9.2 recipe at 0.025 m/px: 3 particles, 0.4 s, `#c4a35a`/`#d4b86a`/`#b8956a`) on each contact. Blend weight from idle follows v27's `bobA`: toward 1 at 5/s when speed > 0.5 m/s, toward 0 at 5/s when idle, so the walk fades in rather than snapping.

#### 2.7.5 The selection ring

A ground decal under the active hero, the Brief §4.1 "soft selection ring": outer diameter **1.6 m**, a soft radial gradient from 35 % alpha at 0.55 m radius to 0 at 0.80 m in `hero.<active>.glow`, plus a crisp inner rim 0.06 m wide at 0.62 m radius at 70 % alpha; additive blend, `depthWrite false`, rendered after the terrain, projected onto the ground (a `DecalGeometry` or a flat ring mesh offset 0.01 m with `polygonOffset`) so it follows slopes without z-fighting. It breathes: radius ±6 % at 1.2 s period. **Golden hour on grass:** Liam's `#4A9ED8` ring is cool light on warm moss; additive blend keeps it a glow rather than a painted circle, and the 35 % alpha stops it from fighting the shadow. **Night:** alpha rises to 55 % and the ring drives one pooled point light (`glow`, intensity 0.6, range 3 m, 0.3 m above the ground) so the active hero's grass is lit; at night the ring is the primary "this is you" cue. On swap the ring cross-fades 0.15 s between the two heroes' glow colours. Companions have no ring; the combo tether (§2.5.8) is the only other hero-to-hero mark.

#### 2.7.6 The two scored poses

1. **Camp idle, golden hour.** Liam in the selection ring beside the campfire, three-quarter front view from the station camera, mid-breath, shield outboard toward the camera, head turned 10° toward the fire, cape catching a light wind. Scores silhouette, colour depth (sapphire against moss and honey wood), lighting drama, facet cleanliness, motion life (breath, blink, cape).
2. **Walk to the stream, dusk and night.** Liam at the walk's contact pose, seen from behind-left at 50° pitch, cape trailing, one dust puff live, the ring on the grass; at the night station the ring's light pool and the cabin windows are the two warm-cool sources on him. Scores silhouette at one-eighth screen height, ring legibility, UI integration with the title card.

## 3. What preserves the magic

Recipe by recipe against `ATMOSPHERE_RECIPES.md`, then the family threads.

### 3.1 The three recipes most responsible (AR §19)

| Recipe | Kept / translated / replaced | How, and why the feeling survives at the gameplay camera |
|---|---|---|
| **§19.1 The shared torch oscillator** (one `sin` drives both the flame's shape and its light pool: "light and fire agree") | **Translated** to the heroes | Collette's orb: one oscillator `sin(gt·5)·0.3 + 0.7` (v27's orb pulse) drives the orb's emissive intensity *and* the radius of its point light *and* the scale of the two amber idle motes. Isabella's tiara and Liam's Aegis rim use the same rule. Nothing on a hero glows without the light agreeing; that is why a lit hero at night looks alive rather than decorated. |
| **§19.2 Simultaneous ambient layering with distinct motion signatures** | **Translated** into the body | Every hero always has at least four independent, incommensurate motion sources running: breathing (1.5 rad/s), blink (4 s, staggered 1.7 s), cloth sway (0.8 rad/s cape or the scarf's six frequencies), head look-at (event-driven), plus the weight shift (2.1 s) and the idle ladder (3 / 10 / 30 s). None is expensive; the *count* is what makes a standing kid read as a person and not a prop, exactly as the overworld's five layers made the ground feel like a toy set. |
| **§19.3 Ed's biplane: four independent noise sources on one sprite** ("give every recurring world object more than one independent motion source and it stops being an object") | **Kept as the method**, applied per kid | Noah's scarf borrows the biplane scarf's two-segment, six-frequency recipe at half amplitude (a deliberate family rhyme: Grandpa's scarf on the grandson). Isabella's dragging hammer, cape, and looking-up tic are three sources on the smallest body. The rule in §2.4.2–2.4.5 is that no idle has fewer than three. |

### 3.2 The hero recipes (AR §16, §9, §10, §14, §15.2)

| AR entry | Verdict | Where it lands |
|---|---|---|
| §16.3 breathing 1.5 % at 1.5 rad/s, phase-offset per hero | Kept verbatim | §2.7.4 idle; all four |
| §16.3 blink 0.15 s / 4 s, staggered 1.7 s, pupils hidden while closed | Kept verbatim | §2.3.2 face system; Isabella's squeeze-blink changes the shape, not the timing |
| §16.3 bob amplitude fading via `bobA` at 5/s | Translated | The idle-to-walk blend weight (§2.7.4) |
| §16.3 squash 6 % at double frequency | Translated, halved | 3 % at contact in 3D; 6 % on a solid mesh reads as jelly |
| §16.3 the 2-px eye offset toward `face` | Translated | Head and eye look-at, ±40° yaw (§2.3.2) |
| §16.3 footfall dust 12 %/frame | Translated | Event-driven puff per contact, same colours and life |
| §16.3 the four 10 s idle loops | Kept verbatim as clips | §2.4.6 ladder, 10 s tier; Liam's is the Phase 1 emote slot |
| §16.3 downed ghost alpha `0.3 + sin(gt·3)·0.1`, 20 s ring, revive ring | Kept | §2.4.1, §2.5.12 |
| §16.3 airborne pose for Ground Pound | Kept, lengthened | A real 0.35 s hop so it reads (§2.5.5) |
| §16.4 attack arcs and weapon trails | Translated | Swept ribbons in `accent` / `glow`; whirl ring; `wVis` tints (§2.5.4, §2.5.10) |
| §16.1 the colour discrepancy | Decided | §2.1: sapphire, fox orange, amethyst, ruby; v27 colours demoted to glows and accents, so every effect still looks like v27's |
| §9.2 hero particle recipes (level-up burst, hit sparks, XP burst, blink out/in, pound gold and dirt, meteor bright and dirt, resurrection) | Kept, scaled 0.025 m/px | Pooled `Points` emitters with the same counts, lives, colours, and gravities; the two-material Meteor burst and the two-material Ground Pound are kept because "the two-material burst is what sells the impact" |
| §9.4 the arena-effect telegraph registry (1.0 s default lead) | Translated | The ground-decal telegraph system every hero ult and boss attack uses (§2.5.6); heroes' own telegraphs are instant-lead because the player is the one acting |
| §10 shake ladder and the four hit-stop sites | Kept verbatim, plus roll | §2.5.7; three new hit-stops, each ≤ 0.06 s, so the ladder's meaning ("every 4 is the same feeling") is not diluted |
| §14 damage numbers: hue = who, size = how much, bounce = crit | Kept, recoloured | §2.5.12; the outline and cap keep four players legible |
| §15.2 hero rings, auras, orbiters | Kept at the metre scale | §2.5.12; the missing selection ring is added (§2.7.5) as the one world-space thing v27 lacked |
| §11 Ed's scarf | Rhymed | Noah's scarf (§3.1) |

### 3.3 Family threads that survive

- **The roles as the family says them:** "That's why he's the tank" prints on the card; Noah's precision, Collette's magic, Isabella's whirl gate the same four dungeon rooms with the same verbatim lines.
- **The sibling order:** height, head ratio, stance, and who looks at whom (Liam checks on the others; Isabella watches Collette; Noah watches everything else).
- **The in-jokes, as motion:** "Cool cool cool" (Liam's nods), "off by 15 degrees" (Noah's thumb), "fix my hair" (Collette's pigtail pat), "not scared" (Isabella's stomp), "ate the sand" (Sugar?), "I'm doing what Collette's doing" (Copycat, and the formation slot), "Stay back, Bella" (Liam's arm, and his companion priority), "L + N were here" (the Shield Crash vault).
- **The names on the buttons:** Shield Bash, Dodge Roll, Arcane Blink, Ground Pound, Excalibur Strike, Arrow Storm, Arcane Nova, Meteor Drop, all six combo names, all twelve branches and their nodes, all four legendaries, all sixteen skins, all six mastery titles.
- **The switching economy** (CM §12): free swap, companions never spend ults, so the reason to switch is still "Isabella's meteor is ready."
- **The caged voice lines**, including the mismatched ones and Liam's silence.

**What a kid will recognise from v27:** Liam is still blue with a shield and the three spikes; Noah still has the green headband and the bow, and still flicks the string; Collette's pigtails, buns, staff orb, and the little violet card she drops; Isabella's bows, the dirt kick, and the bug she watches; the pebble Liam kicks; every ability name; every combo name; the 24 arrows; the three nova rings; the meteor cracks; the numbers that bounce when they crit.

## 4. Build notes for implementers

### 4.1 Assets

| Asset | Source | Budget | Phase |
|---|---|---|---|
| Liam procedural rig (§2.7.2–2.7.3) | Code, `src/render/heroes/rig.ts` (pilot: `pilot/heroRig.ts`, promoted at style lock) | ≈ 700 tris, 2–3 draw calls | 1 |
| Noah, Collette, Isabella rigs | Same builder with per-hero proportion tables (§2.3.1) and extra bones (§2.7.3) | ≤ 1,200 tris each | 2 |
| Props: shield, sword, bow + 1 arrow, quiver, staff, hammer | Code primitives (§2.7.2 style); 7 `wVis` tints as vertex-colour variants | ≤ 200 tris each | 1 (shield, sword), 2 (rest) |
| Cloth: cape (Liam, Isabella), scarf (Noah), hem + pigtails (Collette) | 2-bone / 1-bone procedural chains | 24–48 tris each | 1 (Liam's cape), 2 |
| Skin palettes (16) | Data in `src/content/heroes/skins.ts` | 0 | 2 |
| Selection ring decal, combo tether, downed and revive rings, telegraph decals (circle, cross, ring set, filled circle, small circles, box) | Shader ring on a flat quad / `DecalGeometry`; one material, per-instance colour and radius | 1 draw call each, ≤ 8 live | 1 (ring), 2 |
| Particle recipes (§3.2) | Pooled `Points` per recipe family: sparks, dust, motes, bursts | ≤ 2,000 particles live, zero per-frame allocation | 1 (dust), 2 |
| Damage-number billboards | Pooled SDF text sprites, cap 30 | 1 draw call (instanced) | 2 |
| Kenney Mini Characters evaluation | Rule 2 gate at Phase 2 (§2.7.1); record node names, tri counts, licence | — | 2 |

### 4.2 Materials and lights

- Hero body material: one `MeshStandardMaterial` (`flatShading`, `vertexColors`, roughness 0.9, metalness 0), shared across all four rigs and props; skins rewrite vertex colours, no new material.
- Emissive material: one, `emissive` set per mesh via vertex colour multiply, bloom layer. Used for: Collette's orb, Isabella's tiara (Unstoppable only), Liam's Aegis rim, ult rims, arrow trails.
- Point lights on heroes: Collette's orb (steady, intensity 0.8, range 2.5 m; the ult raises it to 2.0 / 4.5 m for 1.2 s), Collette's bolts (≤ 4 pooled), the active hero's ring light at night (1). Worst case 6 of the global pool; distance-culled; the pool is owned by `src/render/lights.ts` and heroes request, never own.
- Shadows: heroes cast and receive from the single directional light; no per-hero shadow lights.

### 4.3 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| Hero data (`HDEFS` port, skins, legendaries, skill trees, cards, combo table, companion tunables) | `src/content/heroes/`, `src/content/companions.ts` |
| Canon strings (announces, reactions, tips, titles) | `src/content/canon/` (verbatim, from FAMILY_CANON) |
| Stat pipeline, attacks, signatures, ults, combos, dodge, status, downed, caged | `src/sim/heroes/`, `src/sim/combat/`, `src/sim/status/` |
| Companion AI, formation slots, steering, avoidance | `src/sim/ai/companions.ts` |
| Rig builder, animation clips, cloth chains, look-at, blink, idle ladder, emotes | `src/render/heroes/` (pilot: `pilot/`) |
| Selection ring, tethers, telegraph decals, particle pools, damage numbers | `src/render/fx/` |
| Colour tokens (`hero.*`, `combo.*`) | `src/style/tokens.ts` (promoted from `pilot/` at style lock) |
| Combo cinematic camera | `src/engine/camera/cinematic.ts` |
| Emote wheel, role labels, prompts, portraits | `src/ui/` (per ui-ux.md) |
| Dev console hooks below | `src/dev/` |

### 4.4 Test hooks (dev console and Vitest)

- `dev.hero.set(idx)`, `dev.hero.pose(name)`, `dev.hero.idleTimer(seconds)`, `dev.hero.emote(name)`, `dev.hero.skin(id)`: drive the screenshot stations and the two scored poses.
- `dev.time.set(keyframe)` and `dev.station(n)` exist already in the pilot plan; the ring must be visible in station captures at night.
- Vitest: the stat pipeline is pure and deterministic. Tests: baseline recompute equals `HDEFS` at level 1; respec twice yields identical stats; each dead-node definition in §2.5.9 changes exactly the field it names; crit rolls once per swing; lifesteal on all four `aType`s; Dodge i-frame window 0.05–0.30 s; Dodge Roll refund on a negated hit; combo legality at 2.49 m vs 2.51 m; formation adjacency rule for Isabella and Collette; companion never calls `activateSignature` or `actUlt` (assert by call-site spy over a 10 s scripted fight).
- Smoke (headless): swap between all four in one frame with no state loss; a 20 s idle produces the 3 / 10 s ladder events; Kid Snatch exempts the active hero.

### 4.5 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| Four skinned rigs plus cloth every frame | Procedural bones are plain `Object3D`s (no `SkinnedMesh` skinning cost); cloth is 2 bones with a closed-form sway, no simulation |
| Collette's bolts each wanting a light | Pool of 4, oldest reclaimed; bolt trails are additive sprites that fake most of the glow |
| Ribbon trails allocating per swing | Fixed-size ring buffers per hero, updated in place |
| Telegraph decals z-fighting on slopes | One decal material with `polygonOffset` and `depthWrite false`, drawn after terrain, never a second ground plane |
| Damage numbers as DOM | Instanced SDF sprites in the WebGL pass; DOM is for menus only |
| Combo cinematic stalling the sim | The beat is a timescale change plus a camera rig, not a scene switch; sim keeps stepping at 0.2× |

### 4.6 Build order

1. Tokens (`hero.liam.*`, the ring colour) in `pilot/`, then the Liam rig with idle and walk, breathing, blink, cape, the selection ring at three times of day. Capture the two poses. This is the whole Phase 1 hero scope.
2. Phase 2, in this order: the stat pipeline and `HDEFS` port (pure, testable, no rendering) → Dodge and the four basic attacks → signatures → ultimates with telegraph decals → combos with the beat → skill trees with the §2.5.9 definitions → gear, legendaries, mastery → companion AI with formation slots → downed, revive, caged → the other three rigs, clips, faces, emotes, idle ladder → skins → damage numbers and rings.
3. Nothing in step 2 needs Kenney or Blender; the rig builder carries all four to the vertical-slice gate.

## 5. Cross-references and conflicts

**Earlier design files:** none; this is the foundation file. Everything here derives from the brief, the teardown, and `DECISIONS.md`.

**Later files must pick up:**

| File | What it takes from here |
|---|---|
| `enemies.md` | The hue-reservation rule (§2.1.3): no enemy body within 20° hue and 15 % lightness of any hero base. Enemy damage colour stays `#D84830`; note that Isabella's ruby `#D6294E` is 20° away from it by design. Root, chain, pierce-N, Shatter, and knockback-impulse semantics (§2.5.9, §2.5.1) for enemy status handling. Telegraph shape language (§2.5.6) so hero and boss decals share one system. |
| `bosses.md` | Kid Snatch rules (§2.5.11): active hero exempt, caged heroes leave the sim, the four voice lines, `_rescueGrace`. The shadow squad is built from the Shadow-skin palette swap (§2.6) with rift-cyan eyes, on the same rigs and clips. The Goblin King's fireball aims at the active hero (CM §2.2). Boss kills call the legendary drop tier (§2.5.10). |
| `cutscenes.md` | The combo beat's camera rig (§2.5.8) is the smallest cinematic in the game and should share the letterbox and blend code with boss intros. The meteor cutscene opens "Through Liam's eyes" (FC §7.1): the first-person head choreography assumes Liam's head height 1.32 m (§2.7.3). Crash-landing and crater reaction lines are per-hero and colour their bubbles with `glow`. **Taken (2026-09-07):** the combo beat's rig as `comboBeat` (4 m, pitch 30°, yaw 40° off the active hero's facing, the 12 % `bars.punch` letterbox), head centre 1.32 m and hips 0.78 m for the seated first-person height, the §2.4 clips and personalities as puppets, the formation rule for the walk home, and the `glow` tokens for the kids' caption names. Its own requests (`wave`, the standalone `rise`, the first-person head-layer mask) are answered in **§2.4.7**. |
| `camp.md` | Sittable props for the 30 s idle tier (§2.4.6); Collette's dirt-spiral decal fades in 20 s; companions idle at slot distances, Isabella 1.0 m from Collette. The selection ring must read on the camp's ground material at golden hour and night (§2.7.5). Photo mode poses can reuse the victory and emote clips. |
| `npcs.md` | Ed's scarf recipe is rhymed on Noah (§3.1); keep Ed's at full amplitude so the rhyme is a rhyme, not a copy. The merchant's Scroll of Respec uses the baseline recompute (§2.5.10). Escort NPCs use the companion steering (§2.5.11). |
| `dungeons.md` | The four ability rooms need: a Shield Bash hit (cracked wall), an arrow from the `snapShot` window or any arrow (target switch; the room may reward the snap-shot with a faster clear), a Collette channel animation (magic seal; new clip, 1.5 s loop, staff planted, orb bright), a whirl hit (gear lock). Arcane Blink's partial-blink rule against walls (§2.5.5). Companions' telegraph avoidance is minimum viable; dungeon telegraphs should leave a 0.4 s exit path. **Taken (2026-09-07):** the four ability verbs (a Shield Bash hit, an arrow, Collette's channel, a whirl hit) as the four ability rooms, and Arcane Blink's partial-blink rule against walls. Its own requests (`ride`, `slide`, `ropeHold`, the reach-up clip, the restated 1.5 s channel loop, the free-hand carry socket) are answered in **§2.4.7**. |
| `ui-ux.md` | Role labels "Tank / Ranger / Mage / Whirlwind" (§2.2.1); prompts render "Dodge" and "Dodge Roll" (§2.2.2); the emote wheel and its 60 s per-line cap (§2.4.6); the combo hold-radial and the tap default (§2.5.8); portrait light rings in `glow`; damage-number colours and the white fallback ladder (§2.5.12); every prompt from the live binding (§2.5.3); the captured-hero overlay (§2.5.11). The `⚡ ULTIMATE READY — SPACE` string must not hard-code a key. **Taken (2026-09-07):** the role labels, the prompts rendered from the live binding, the emote wheel and its 60 s per-line cap, the combo tap-and-hold, the portrait light rings, the damage-number colours and the captured-hero overlay, plus the full keyboard, pad and touch maps. Two bindings came back the other way and are applied in §2.5.3: the emote wheel is **View / Back held 0.3 s** on pad (the D-pad is direct hero select) and the camera yaws on right-mouse drag plus `Z` / `C` (`Q` and `E` are canon combat binds). |
| `audio.md` | Named cues this file assumes: per-kid dodge whooshes (four), the `snapShot` two-note open cue, a swap chime, an undefined-in-v27 `shield` sound for Aegis, a `questComplete`-style stinger for emotes (optional), the three new hit-stop sites' impact sounds (Bash, Pound, finisher). Ability names in AUDIO_INVENTORY §5 match this file. **Taken (2026-09-07):** all of it — the four dodge whooshes, the `snapShot` two-note open cue, the swap chime as `hero.swap.<hero>` pitched in age order (oldest lowest, replacing v27's `hit` .15 on the portrait strip), `shield` for Aegis, the optional emote stinger, and the three new hit-stop impacts; it also reads §2.4.1's clip timings and §2.3.1's heights. Its own request (footfall events on the walk and run contact poses, for the `step.*` family) is answered in **§2.4.7**. |
| `story-beats.md` | Wiring for the orphaned `HERO_REACTIONS` contexts (§2.4.6 lists them); the emotes are a second channel, never the wiring. Liam is the only unlocked hero at the crash site; rescue order is a story-beats decision. |

**Conflicts found:** none with an earlier design file. Two tensions with teardown recommendations, both resolved here and logged: ATMOSPHERE_RECIPES §14 says `HERO_DMG_COLS` ports verbatim as "family canon colours"; the 2026-09-06 canon decision moved colours into this file, so the numbers now use the `glow` tokens (§2.5.12). CONTROL_MODEL §12 says the signature names must survive the universal dodge; they do (§2.2.2).

## 6. Decisions logged

Merged into `docs/DECISIONS.md` by the orchestrator after review.

- 2026-09-06 · phase-0.5/heroes · Liam stays blue, deepened to sapphire `#2A62CF` / `#173A86` / steel `#D3DDE6`; v27's `#4A9ED8` becomes his glow token · v27's sky blue reads as default-engine under ACES and a warm key; a jewel blue keeps him the one cold kid, which suits the steady leader · rejected: keeping `#4A9ED8` as the body (pastel-adjacent), navy (collides with Frozen indigo).
- 2026-09-06 · phase-0.5/heroes · Noah is fox orange `#EE7F24` / pine `#1F5E3F` / leaf `#2DB86A` (the brief's colour over v27's green), with v27's green kept verbatim as his accent and 40 % of his surface · green vanishes on the home Forest island and is the anti-palette's mid-green; orange is the fox (sharp, quick, independent) and sings at golden hour; the green share carries him on the Desert · rejected: green body (home-island failure), pure orange with no green (Desert failure, loses the v27 memory).
- 2026-09-06 · phase-0.5/heroes · Collette is amethyst `#9D4FD8` / `#5B2A8F` / amber `#E8A838` with an orchid glow `#E08CF0` replacing v27's pink `#e84393` magic · brief and v27 agree on purple; v27's 45 %-saturation lavender goes dusty in warm light; pink magic would confuse with Isabella's new red · rejected: keeping `#A862C4` (dusty), keeping pink spell colour (confusable with Isabella).
- 2026-09-06 · phase-0.5/heroes · Isabella is ruby `#D6294E` / garnet `#8A1538` / crown gold `#F0C040` (the brief's pink/red over v27's gold), with v27's gold kept verbatim as her accent and glow · gold merges with golden-hour light (the hero look), matches Desert ochre, and is inseparable from Noah's orange for red-green colorblind players; v27 already leaned red and pink for her (weapon, bows, skins, Supernova); ruby-and-gold is a crown, her legendary line · rejected: gold body, pure pink (too close to Collette's magic, less fierce).
- 2026-09-06 · phase-0.5/heroes · Role labels: Liam "Tank" (kept), Noah "Ranger" (was `DPS`), Collette "Mage" (kept), Isabella "Whirlwind" (was `AoE`); roles themselves unchanged · "That's why he's the tank" is canon; `DPS` and `AoE` are jargon in a family voice; "Berserker" implies rage and her canon is fearless; "Whirlwind" is her attack and her personality · rejected: "Berserker" as the label (kept as her branch name), "Guardian" for Liam (collides with Isabella's branch).
- 2026-09-06 · phase-0.5/heroes · Universal "Dodge" (0.4 s, 2 m, i-frames 0.05–0.30 s, 0.5 s recovery, per-kid animation) for everyone; Noah's signature keeps the name "Dodge Roll" as the big version (3 m, full 0.4 s i-frames, orange trail, a 1 s `snapShot` window with an instant guaranteed-crit arrow, 1 s cooldown refund per hit negated) · Brief §5.4 requires a dodge roll with i-frames for all; the canon signature name must stay Noah's and feel like Noah (precision) · rejected: renaming his signature (loses 27 versions of muscle memory), giving only Noah a dodge (brief violation).
- 2026-09-06 · phase-0.5/heroes · World scale fixed at 40 px = 1 m (1 px = 0.025 m) for every v27 distance and speed · the 3200 px overworld becomes an 80 m island and hero run speeds land at 4.0–4.5 m/s, both right for the diorama camera; all kit ratios preserved · rejected: 32 px/m (reach and speeds too large), 50 px/m (island too small, speeds sluggish).
- 2026-09-06 · phase-0.5/heroes · Four distinct bodies replace v27's shared body: heights 1.52 / 1.40 / 1.30 / 1.14 m in age order with near-constant head size, shoulder widths 0.46 / 0.36 / 0.36 / 0.34 m, one signature shape each (disc, line, two lobes and a spike, block on the ground) · Brief §4.6 silhouette-first at one-eighth screen height; constant heads carry age without a baby or a giant · rejected: one body with swapped hair and props (fails the black-silhouette test), proportional scaling (Isabella becomes a toddler).
- 2026-09-06 · phase-0.5/heroes · Isabella's hair bows recolour from v27 pink `#e84393` to ruby base with gold centres · the bows are a silhouette device and pink now reads as Collette's magic family · rejected: keeping pink bows.
- 2026-09-06 · phase-0.5/heroes · Cloth per kid: Liam a knee cape in `dark`, Noah a long green scarf borrowing Ed's biplane-scarf recipe at half amplitude, Collette a flared hem plus pigtails and no cape, Isabella a hand-me-down cape 0.12 m too long · each kid gets one distinct flowing thing (a motion-signature layer, AR §19.2); the scarf rhymes grandson with grandfather; the cape is a costume note, not a personality claim · rejected: capes on all four (v27; identical motion), simulated cloth (budget).
- 2026-09-06 · phase-0.5/heroes · Ground Pound becomes a 0.35 s hop with impact at 0.30 s (v27: 25 ms) and knockback immunity during the hop; damage, radius, slow, cooldown unchanged · a 25 ms impact does not read at the orbit camera; v27 already drew her airborne · rejected: instant impact with a longer VFX (the hop is the character).
- 2026-09-06 · phase-0.5/heroes · Shield Bash travel 1.5 m (strict conversion 0.75 m); Arcane Blink stops at the farthest clear point instead of reverting when a wall is in the way; Dodge Roll 3 m (strict 2 m) · lunges and blinks must be visible verbs at the camera; a reverted blink feels like a dropped input · rejected: strict conversions.
- 2026-09-06 · phase-0.5/heroes · Three new hit-stop sites (Shield Bash contact 0.06 s, Ground Pound impact 0.06 s, third-hit finisher 0.04 s) on top of v27's four; nothing else may add hit-stop without a logged line · Brief §5.4 asks for hit-stop on heavy hits; keeping the list short protects the AR §10 ladder's consistency · rejected: hit-stop on every hit (mush), on crits (too frequent).
- 2026-09-06 · phase-0.5/heroes · Combo ultimates get a 1.4 s cinematic beat (freeze, letterbox, two-shot at timescale 0.2, verbatim name card, impact freeze, the v27 shake) with a pose per pair, a dotted pairing tether in the world, and hold-Q partner selection with tap keeping v27's canon-order default · Brief §5.4 asks for the beat; CM quirk 15 and the invisible 100 px rule needed fixing; Supernova's pose is the "hold my hand" line made physical · rejected: no cinematic (brief), always-radial (slower for kids).
- 2026-09-06 · phase-0.5/heroes · Combo ultimates available to every multiplayer client, not host-only · CM §12 calls the gate an accident · rejected: keeping host-only.
- 2026-09-06 · phase-0.5/heroes · Hero stats are always recomputed from a baseline (base → level +12 HP / +3 dmg → difficulty → card picks → tree picks → legacy equips → gear → clamp); respec clears picks and recomputes; the 41-field dungeon snapshot goes away · v27's `recalcHeroStats` wiped skill trees and respec was a free-stat exploit (SI §29); v27 also ran two conflicting per-level rules (+5 in `addXP`, +12/+3 in recalc) and the recalc rule is the one that stuck · rejected: porting the in-place mutation (the bug), +5/+0 per level (weaker than what players experienced after their first equip).
- 2026-09-06 · phase-0.5/heroes · Dead or self-defeating nodes and fields get definitions: Iron Wall extends the ult shield to allies within 3 m for 3 s; Blade Dance makes each whirl hit its 360° twice (second tick 50 %); Rampage makes Meteor Drop's cracks burn 10/s for 3 s, +0.5 s per kill; Chain jumps once within 3 m at 60 %; Root Shot roots 1.5 s; Permafrost ×1.2 slow durations; Shatter +25 % vs slowed or stunned; Unstoppable grants slow/stun/root/knockback immunity; Pierce N hits exactly N; War Hammer `aoe` adds 10 % reach; Sunstone Crest writes `crit`; lifesteal works on all attack types; attack cooldown floors at 0.12 s; boss kills call the legendary drop tier · SI §29 lists each as written-but-never-read, negative, or unreachable; the canon node text stays true under every definition · rejected: porting the dead fields as-is.
- 2026-09-06 · phase-0.5/heroes · New Liam passive "Shield Front": hostile projectiles from within ±45° of his facing deal 50 % while he is not attacking or dodging, and visibly deflect · the shield must be a real object in 3D, not a stat; it is small enough not to move balance · rejected: a hold-to-block verb (no spare input on pad or touch).
- 2026-09-06 · phase-0.5/heroes · Companion fall-through bug (L2290) resolved as a tuned middle: the damping branch is removed and combat multipliers are set to melee close 0.70×, ranged close 0.50×, back-off 0.70×, strafe 0.25×; follow ramp 1.6 / 1.2 / 1.0 kept · a straight fix makes companions twitchy (CM §11); the accidental feel was purposeful drift, and the strafe was effectively dead · rejected: porting the bug (frame-rate-dependent), a straight fix.
- 2026-09-06 · phase-0.5/heroes · Formation slots (1.6 m at 135° and 225°, 2.2 m at 180°) replace the conga line, with two family rules: Isabella's slot is always adjacent to Collette's, and companion-Liam prioritises the enemy nearest Isabella when she is under 40 % HP · three companions stacking read as a blob at the orbit camera (CM §12); the rules make "hold my hand" and "Stay back, Bella" true in the sim · rejected: plain slots with no family rules.
- 2026-09-06 · phase-0.5/heroes · Companion navigation is steering with a 4 s stuck timer and a 0.3 s fade teleport; companions step out of telegraph decals within 0.4 s and disengage under 25 % HP · the 400 px hard teleport is visible in 3D; Brief §5.4 makes telegraphs the boss language · rejected: navmesh in Phase 2 (defer to a later spike if steering fails).
- 2026-09-06 · phase-0.5/heroes · Proximity revive (×3 within 1.5 m) works in single player, and an idle companion walks to and kneels by a downed sibling · v27 only tripled the rate with `playerCount > 1`; the family should help each other on screen · rejected: keeping the multiplayer-only rule.
- 2026-09-06 · phase-0.5/heroes · All sixteen `HERO_SKINS` kept as vertex-colour palette swaps of base and dark; accent, glow, hair, and silhouette never change · zero draw-call cost and identity survives every skin; the Shadow skins double as the shadow squad's palette · rejected: cutting skins, separate meshes per skin.
- 2026-09-06 · phase-0.5/heroes · Damage numbers use the four `glow` tokens instead of `HERO_DMG_COLS`; the no-source fallback ladder becomes white at three weights · the colour decision moved to this file (2026-09-06 canon line); Noah and Isabella now own orange and red, so the old ladder would misattribute hits · rejected: keeping the ladder.
- 2026-09-06 · phase-0.5/heroes · The Phase 1 pilot Liam is a procedural blocky rig (≈ 700 tris, one flat-shaded vertex-colour material, the §2.7.3 bone names as the GLB import contract); Kenney Mini Characters is evaluated at a Phase 2 Rule 2 gate; custom Blender GLBs only if a Blender pipeline is supplied · deterministic, starts the visual loop immediately, nothing thrown away on upgrade · rejected: blocking the pilot on an asset download or on Blender.
- 2026-09-06 · phase-0.5/heroes · A world-space selection ring is added (1.6 m soft additive decal in the active hero's glow, breathing at 1.2 s, 55 % alpha and one pooled point light at night, 0.15 s cross-fade on swap) · v27 had none (AR §15.2) and the brief's reference has one; four similar-scale kids at the orbit camera need it · rejected: a hard MOBA circle, a nameplate only.
- 2026-09-06 · phase-0.5/heroes · Emotes (three per kid) play verbatim canon lines as bubbles at most once per 60 s per line; the idle ladder (3 / 10 / 30 s) ports the four v27 10 s loops as clips and adds the copycat and look-out behaviours; companions run the ladder too · personality lives in emotes; the cap keeps the lines special; camp must feel alive · rejected: stock emotes, unlimited line repeats.
- 2026-09-06 · phase-0.5/heroes · Hue reservation: no enemy or NPC body colour within 20° hue and 15 % lightness of any hero base · four-player legibility at one-eighth screen height · rejected: no rule.
- 2026-09-06 · phase-0.5/heroes · The attack-state timer (0.20 s) and every hero timer run on the sim clock; companion facing uses `idx !== activeHero` · CM quirks 3 and 14 · rejected: wall-clock timers.
- 2026-09-07 · phase-0.5/heroes · Rig addendum §2.4.7, collected from every design file written after this one: a `carry.L` free-hand socket and a cosmetic `hat` socket added to the §2.7.3 bone list; the clips `fish_cast`, `fish_reel`, a `watch` idle, `sit_down` / `sit_idle` / `stand_up` per kid carrying camp's seated 30 s idles, four seated flight-bench clips, `wave`, a standalone `rise`, and the reach-up; the `ride`, `slide` and `ropeHold` poses; a first-person head-layer mask; footfall events on the walk and run contact poses; and one companion targeting preference — a sibling's containment field within 5 m outranks any enemy · world-events, camp, npcs, bosses, cutscenes, dungeons and audio each needed a rig affordance this file did not specify, and a hero rig must be specified in exactly one place · rejected: none — every request was compatible and no existing clip, socket or timing changed.
- 2026-09-07 · phase-0.5/heroes · Two input bindings in §2.5.3 adopt `ui-ux.md`: the emote wheel moves from a D-pad-down hold to **View / Back held 0.3 s** on pad, and a camera-yaw row is added (right-mouse drag plus `Z` left / `C` right on keyboard, right stick X on pad) where this file had none · `ui-ux.md` owns the input maps and its reasons hold: the D-pad is direct hero select, so a D-pad-down hold would delay Isabella's swap, and `Q` / `E` are canon combat binds (combo, signature) · rejected: the D-pad-down hold, `Q` / `E` for the camera (the Brief §4.5 suggestion yields to canon).

## 7. Reconcile when the brainstorm doc lands

- If the brainstorm resolved hero colours or roles differently, the §2.1 rationale stands unless the doc records a reason this file did not consider; log either way.
- The brainstorm's "skill trees" and "gear system" sections may state the intended behaviour of the dead nodes (§2.5.9) and of Iron Wall, Blade Dance, and Rampage; prefer the doc's intent if it exists, keeping the canon node text true.
- The brainstorm's "enemy roles" and "boss designs" may assume specific hero counters (for example, Liam's shield vs a charge); check the Shield Front passive (§2.5.10) against them.
- Any resolved decision about the shadow squad's look supersedes the Shadow-skin assumption in §2.6.
- Any resolved combo-ultimate rework supersedes §2.5.8's data (the beat and the poses stay).

## 8. Open questions for the orchestrator

None. No Rule 1 missing input blocks this file (the brainstorm doc is handled by §7), and no §2 design changes how a family member is portrayed beyond the canon lines: every personality note in §2.3–2.4 is derived from a quoted line, and the costume notes (a hand-me-down cape, a deadpan face, a kid who watches bugs) are expression, not new claims.
