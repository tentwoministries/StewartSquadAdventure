# FAMILY_CANON.md — The Sacred Text

Every player-facing string in `docs/legacy/stewart-squad-v27.html`, copied verbatim with speaker, trigger and legacy line number. Nothing here may be paraphrased, "fixed", or reworded when ported — new text may be added, existing text is sacred.
Source file: `docs/legacy/stewart-squad-v27.html` (9,901 lines). CSS from L7, DOM from L310, script block from L516. Unicode escapes are rendered as the actual character **and** the original escape is noted.

---

## Table of contents

1. [Cast & relationships](#1-cast--relationships)
2. [Hero lines](#2-hero-lines)
3. [Grandpa Ed dialogue](#3-grandpa-ed-dialogue)
4. [NPC dialogue](#4-npc-dialogue)
5. [Quest text](#5-quest-text)
6. [Boss names & voice lines](#6-boss-names--voice-lines)
7. [Cutscene shot tables](#7-cutscene-shot-tables)
8. [Tutorial text](#8-tutorial-text)
9. [Achievements](#9-achievements)
10. [Tips, flavor markers, crater flavor, lore](#10-tips-flavor-markers-crater-flavor-lore)
11. [Items, gear, dungeons, biomes, titles](#11-items-gear-dungeons-biomes-titles)
12. [UI strings](#12-ui-strings)
13. [Notes, gaps and uncertain strings](#13-notes-gaps-and-uncertain-strings)

---

## 1. Cast & relationships

### 1.1 The four kids

Canon colors appear in three places and must agree: the CSS custom properties (L12), the title-screen hero cards (L316–319), and `HDEFS` (L2139–2144). **They do not all agree for Isabella — see the note below.**

CSS variables, L12:

```
--liam:#4A9ED8;--noah:#2DB86A;--collette:#A862C4;--isabella:#F0C040;
```

`HDEFS` (L2139–2144) — verbatim:

```js
var HDEFS=[
  {nm:'LIAM',col:'#4A9ED8',dk:'#2E78A8',wc:'#bdc3c7',spd:180,hp:250,maxHp:250,rng:48,dmg:32,cd:.35,aType:'melee',ultCD:25,hair:'#8B6914',cape:'#2B6A94',sigCd:6,sigNm:'Shield Bash',sigKey:'bash'},
  {nm:'NOAH',col:'#2DB86A',dk:'#1E8A4E',wc:'#7A4018',spd:175,hp:140,maxHp:140,rng:230,dmg:16,cd:.28,aType:'arrow',ultCD:22,hair:'#5B3A1A',cape:'#1E7A44',sigCd:4,sigNm:'Dodge Roll',sigKey:'roll'},
  {nm:'COLLETTE',col:'#A862C4',dk:'#844CA0',wc:'#E8A838',spd:165,hp:120,maxHp:120,rng:260,dmg:22,cd:.6,aType:'magic',ultCD:28,hair:'#6B3A2A',cape:'#9648B0',sigCd:8,sigNm:'Arcane Blink',sigKey:'blink'},
  {nm:'ISABELLA',col:'#F0C040',dk:'#C89E28',wc:'#D84830',spd:160,hp:180,maxHp:180,rng:58,dmg:28,cd:.4,aType:'whirl',ultCD:20,hair:'#D4A03C',cape:'#D88030',sigCd:5,sigNm:'Ground Pound',sigKey:'pound'}
];
```

| Hero | Display name (HDEFS `nm`) | Title-card name (L316–319) | Role as the game labels it (L316–319) | Canon color | Dark shade | Weapon color | Signature (`sigNm`) | Ultimate name | Legendary |
|---|---|---|---|---|---|---|---|---|---|
| 0 | `LIAM` | `Liam` | `Tank` | `#4A9ED8` (`--liam`) | `#2E78A8` | `#bdc3c7` | `Shield Bash` | `⚡ EXCALIBUR STRIKE!` (L2670) | `Aegis of Dawn` |
| 1 | `NOAH` | `Noah` | `DPS` | `#2DB86A` (`--noah`) | `#1E8A4E` | `#7A4018` | `Dodge Roll` | `⚡ ARROW STORM!` (L2677) | `Phantom Blades` |
| 2 | `COLLETTE` | `Collette` | `Mage` | `#A862C4` (`--collette`) | `#844CA0` | `#E8A838` | `Arcane Blink` | `⚡ ARCANE NOVA!` (L2685) | `Staff of Eternity` |
| 3 | `ISABELLA` | `Isabella` | `AoE` | `#F0C040` (`--isabella`, HDEFS) | `#C89E28` | `#D84830` | `Ground Pound` | `⚡ METEOR DROP!` (L2691) | `Crown of Storms` |

> **Isabella color discrepancy — flag for the rebuild.** `docs/BRIEF.md` §1 and the archaeologist role file both state Isabella is **pink/red**. v27's code says `#F0C040` (gold/amber) in `--isabella` (L12), in `HDEFS` (L2143) and on the title card circle (L319). Her *weapon* color `wc` is `#D84830` (red) and her cape is `#D88030` (orange). Her Rainbow skin is `#e84393` (pink, L2161). The HTML is the truth for what shipped; the Brief is the truth for the family canon. **This is a decision for the orchestrator, not the archaeologist** — recorded here, not resolved.
>
> Note also that the Brief calls Noah **orange** while v27 renders him `#2DB86A` (green) everywhere.

**Personality framing, as the game itself expresses it** (quote, don't interpret):

| Hero | Line the game uses to characterize them | Where |
|---|---|---|
| Liam | `Tip: Liam always volunteers for the hard missions. That's why he's the tank.` | `TIPS` L727 |
| Liam | `Cool. Cool cool cool. So we're doing this. Let's go.` | `HERO_REACTIONS.LIAM.quest_intro` L799 |
| Liam | `That was fine. That was totally fine. I'm fine.` | `HERO_REACTIONS.LIAM.boss_appear` L799 |
| Noah | `Tip: Noah calculated the optimal route. Nobody listened. Noah was right.` | `TIPS` L727 |
| Noah | `That trajectory was off by at least 15 degrees. ...I've been tracking it.` | `HERO_REACTIONS.NOAH.quest_intro` L800 |
| Noah | `Hey do you think there are any cool bugs in here?` | `HERO_REACTIONS.NOAH.dungeon_enter` L800 |
| Collette | `Tip: Collette says the dungeon decor is 'early cave chic.'` | `TIPS` L727 |
| Collette | `This place needs curtains. And better lighting. And maybe a rug.` | `HERO_REACTIONS.COLLETTE.dungeon_enter` L801 |
| Collette | `And THAT is how it's done.` | `HERO_REACTIONS.COLLETTE.victory` L801 |
| Isabella | `Tip: Don't let Isabella near the dessert biome. Last time she ate the sand thinking it was sugar.` | `TIPS` L727 (the "dessert"/"desert" pun-typo is canon — do not fix) |
| Isabella | `I'm not scared. ...Collette, hold my hand though.` | `HERO_REACTIONS.ISABELLA.dungeon_enter` L802 |
| Isabella | `YOU'RE BIG. I'M NOT SCARED OF YOU.` | `HERO_REACTIONS.ISABELLA.boss_appear` L802 |

**Sibling relationships the text establishes:**

| Fact | Evidence | Line |
|---|---|---|
| The four are siblings; three must be rescued from cages by the starting hero | `👥 Siblings: 0/3` HUD (L361), `Rescue all 3 siblings` (achievement `squadAssembled`, L883), `All siblings found! Destroy the camps!` (L2865) | L361, L883, L2865 |
| Liam and Collette share a room | `Collette get out of our room!` — `HERO_REACTIONS.LIAM.sibling` | L799 |
| Isabella copies Collette | `I'm doing what Collette's doing!` — `HERO_REACTIONS.ISABELLA.following_collette` | L802 |
| Isabella holds Collette's hand when scared | `I'm not scared. ...Collette, hold my hand though.` | L802 |
| Liam and Noah carved their initials somewhere in the world | `Someone carved: 'L + N were here'` | `FLAVOR_MARKERS` L728 |
| Collette has a secret hideout | `A sign reads: 'Collette's Secret Hideout →'` (`→` = `→`) | `FLAVOR_MARKERS` L728 |
| Isabella claims she got there first | `Scratched into the rock: 'Isabella was here first!!!'` | `FLAVOR_MARKERS` L728 |
| The squad is named after the family | `⚔️ The Stewart Squad Adventure` (title, L312); `The Stewart Squad has fallen...` (L457); `The Stewart Squad saved the realm!` (L469) | L312, L457, L469 |

### 1.2 Grandpa Ed

`FAMILY_NPC_DEFS`, L633 — verbatim:

```js
var FAMILY_NPC_DEFS={grandpaEd:{nm:'Grandpa Ed',col:'#228B22',dk:'#165B16',icon:'✈️',dialogueKey:'grandpaEd',questGroup:'ground_ed',portrait:'ed',drawFn:'drawGrandpaEd'}};
```

| Field | Value | Note |
|---|---|---|
| Name | `Grandpa Ed` | Also the in-world floating label, L8388 |
| Color | `#228B22` (forest green) | Dark shade `#165B16` |
| Icon | `✈️` | escape `✈️` |
| Spawn record | `edNPC={x:ED_LANDING.x,y:ED_LANDING.y,nm:'Grandpa Ed',col:'#228B22',dk:'#165B16',...}` | L8390 |

| Fact the text establishes | Quote | Line |
|---|---|---|
| He flies a biplane and crashes it often | `Grandpa Ed has crash-landed!` | L6138 |
| His plane is named **The Green Meanie** | `The Green Meanie's running like a dream! Well, a slightly bumpy dream.` / `The Green Meanie lives again!` | L788, L8395 |
| The plane's grounded state is the questline pun | `I'm fine, but the old bird is... well, she's 'Ground-Ed.'` | L763 |
| His landing record is a family joke | `Tip: Don't ask Grandpa Ed about his landing record. Just don't.` | `TIPS` L727 |
| He's the yellow biplane you wave at | `Tip: If you see a yellow biplane, wave. That's Grandpa Ed.` | `TIPS` L727 |
| He calls bad weather character-building | `Tip: Grandpa Ed says this kind of rain is 'character-building weather.'` | `TIPS` L727 |
| He makes snacks called **Ed-ibles** | `Tip: Ed-ible snacks heal more than regular potions. Grandpa knows best.` ; quest reward `Ed-ible x3 + 100 Gold` | L727, L714 |
| He wants to go to space | `A pilot's not meant to stay on the ground. Or even in the atmosphere, if you ask me.` | L758 |
| He has a workshop | `There's a strange tower to the east... gears turning inside, no one at the controls. Reminds me of my workshop.` | L792 |
| He wears goggles and a scarf | goggles drawn L8382; scarf `var scarfSway=...` L8387; quest reward `Aviator Goggles + 100 Gold` L713 | L713, L8382, L8387 |

### 1.3 Gran / Grambi

Never appears as an entity; established entirely through dialogue.

| Quote | Speaker | Line |
|---|---|---|
| `Tip: Gran always said the sky had more in it than stars.` | UI (loading tip) | L727 |
| `Gran used to tell stories about lights like these when I was growing up...` | Grandpa Ed | L795 |
| `She'd say: 'Eddie, the sky has more in it than stars. And some of it is watching.'` | Grandpa Ed (quoting Gran; establishes that Ed's given name is **Eddie**) | L796 |
| `Everyone thought she was telling fairy tales. I wasn't so sure.` | Grandpa Ed | L797 |
| `Wait — Gran knew about THIS? How long has this been going on?` | Noah | L800 |
| `Is this from Grambi?? It better be from Grambi.` | Isabella (`snack_reward`) — **Grambi** is Isabella's name for her; kept verbatim | L802 |

### 1.4 Pets / animals

v27 has **no pet entities**. The only animal companion in the game text is the escort-quest frog familiar:

| String | Context | Line |
|---|---|---|
| `Escort the frog familiar to safety.` | Quest `swamp_2` description | L708 |
| `Protect my little friend...` | Quest `swamp_2` hint | L708 |
| `🐸 Familiar` (escape `\u{1F438}`) | In-world label above the escort frog | L8566 |
| `🐸 Familiar arrived safely!` | Escort success | L8457 |
| `🐸 Familiar died! Talk to Bog Witch to retry.` | Escort failure | L8463 |

### 1.5 NPCs

`NPC_DEFS`, L626–631 — one guide per biome.

| Name | Biome | Color / dark | Icon | Line |
|---|---|---|---|---|
| `Rootkeeper Elm` | `forest` | `#58B888` / `#2E7A58` | `🌳` (`🌳`) | L627 |
| `Lamplighter Quartz` | `cave` | `#8E98D8` / `#5868A8` | `🔮` (`🔮`) | L628 |
| `Dunewalker Sol` | `desert` | `#E8A860` / `#987040` | `🏜️` (`🏜️`) | L629 |
| `Mistweaver Fern` | `swamp` | `#70C090` / `#386848` | `🧪` (`🧪`) | L630 |
| `Hearthkeeper Neve` | `frozen` | `#A8D0E8` / `#5878A0` | `❄️` (`❄️`) | L631 |
| `Grandpa Ed` | (none — lands at `ED_LANDING`) | `#228B22` / `#165B16` | `✈️` | L633 |

Older NPC names still referenced in code but with **no matching `NPC_DEFS` entry** (see §13): `Bog Witch` (L8351, L770), `Sand Nomad` (L8354), `Crystal Sage` (L699).

Other named non-hostile entities: `Merchant` (label, L1681), `Bounties` (bounty board label, L1711).

### 1.6 Villains

| Name | Where defined | Line |
|---|---|---|
| `The Goblin King` / `GOBLIN KING` | `BESTIARY_DATA` L8549, boss namecard L3294 | L3294, L8549 |
| `The Shadow Queen` / `THE SHADOW QUEEN` | `BESTIARY_DATA` L8550, namecard L9331 | L9331, L8550 |
| `Ancient Treant` | `DungeonBoss` forest, L7377 | L7377 |
| `Crystal Colossus` | `DungeonBoss` cave, L7377 | L7377 |
| `Pharaoh Wraith` | `DungeonBoss` desert, L7377 | L7377 |
| `Hydra Matriarch` | `DungeonBoss` swamp, L7377 | L7377 |
| `Frost Lich` | `DungeonBoss` frozen, L7377 | L7377 |
| `Magma Titan` | `DungeonBoss` volcanic, L7377 | L7377 |
| `Citadel Warden` | `CITADEL_WARDEN`, L827 | L827 |
| `Stone Sentinel` | Citadel floor 1 mini-boss, L822 | L822 |
| `Phantom Warden` | Citadel floor 2 mini-boss, L824 | L824 |
| `Crystal Golem` / `Sandworm` / `Swamp Hydra` / `Frost Wyrm` | Overworld `MiniBoss`, L2876–2879 | L2876–2879 |

---

## 2. Hero lines

### 2.1 `HERO_REACTIONS` (L799–L802)

Fired by `getHeroReaction(heroName,context)` (L803) and appended to a dialogue queue by `openDialogue(charKey,category,heroReactionCtx)` (L804), or announced directly (L5934). **Only the contexts `quest_intro`, `space_hint`, `ed_crater` and `crater` are actually triggered in v27** — see §13.

#### LIAM (L799)

| Context | Line (verbatim) | Trigger in v27 |
|---|---|---|
| `crash_landing` | `Everyone okay? ...You know this is the third time, right.` | **not wired** (see §13) |
| `quest_intro` | `Cool. Cool cool cool. So we're doing this. Let's go.` | Ed offers a Ground-Ed quest (L8399) or Ed greeting (L8408) |
| `space_hint` | `Grandpa, that's not a plan. That's a dream with duct tape.` | Ed quest complete (L8395) / Ed post-quest chat (L8407) |
| `dungeon_enter` | `Cool. Cool cool cool. So we're just going in there.` | **not wired** |
| `boss_appear` | `That was fine. That was totally fine. I'm fine.` | **not wired** |
| `sibling` | `Collette get out of our room!` | **not wired** |

#### NOAH (L800)

| Context | Line (verbatim) | Trigger in v27 |
|---|---|---|
| `crash_landing` | `...Wait, was that— did he just— that was INCREDIBLE. The spin was like eight rotations.` | **not wired** |
| `quest_intro` | `That trajectory was off by at least 15 degrees. ...I've been tracking it.` | Ed quest offer / greeting |
| `space_hint` | `Wait. Space? Like ACTUAL space? With ACTUAL stars? I'm in. I'm so in.` | Ed quest complete / post-quest |
| `dungeon_enter` | `Hey do you think there are any cool bugs in here?` | **not wired** |
| `swamp_item` | `Okay but what species ARE you though?` | **not wired** |
| `boss_appear` | `That boss has really interesting armor actually. Like the craftsmanship is— OW. Fighting. Right.` | **not wired** |
| `crater` | `This is literally the most insane thing I have ever seen in my entire life and I need to touch it.` | First approach to the alien crater (L5934) |
| `ed_crater` | `Wait — Gran knew about THIS? How long has this been going on?` | Ed's crater-awareness conversation (L8404) |

#### COLLETTE (L801)

| Context | Line (verbatim) | Trigger in v27 |
|---|---|---|
| `crash_landing` | `...Ten out of ten landing, Grandpa. Very dramatic.` | **not wired** |
| `quest_intro` | `I've got a dangerous grandpa and I'm not afraid to use him.` | Ed quest offer / greeting |
| `space_hint` | `Can I design the spaceship uniforms?` | Ed quest complete / post-quest |
| `swamp_item` | `Ew. Ew ew ew. ...Is that moss? Actually that color is kind of cute.` | **not wired** |
| `dungeon_enter` | `This place needs curtains. And better lighting. And maybe a rug.` | **not wired** |
| `mid_boss` | `Hold on, I need to fix my hair. ...Okay go.` | **not wired** |
| `victory` | `And THAT is how it's done.` | **not wired** |

#### ISABELLA (L802)

| Context | Line (verbatim) | Trigger in v27 |
|---|---|---|
| `crash_landing` | `AGAIN?! That's the third time this week! ...Can I ride in it next time?` | **not wired** |
| `quest_intro` | `I call dibs on riding in the plane when it's fixed!` | Ed quest offer / greeting |
| `space_hint` | `Can we go to space too?? PLEASE?? I want to drive the ship!` | Ed quest complete / post-quest |
| `dungeon_enter` | `I'm not scared. ...Collette, hold my hand though.` | **not wired** |
| `boss_appear` | `YOU'RE BIG. I'M NOT SCARED OF YOU.` | **not wired** |
| `crater` | `WHOA. Can we LIVE here??` | First approach to the alien crater (L5934) |
| `snack_reward` | `Is this from Grambi?? It better be from Grambi.` | **not wired** |
| `following_collette` | `I'm doing what Collette's doing!` | **not wired** |
| `ed_crater` | `Grandpa... are you okay?` | Ed's crater-awareness conversation (L8404) |

### 2.2 Crater first-visit reactions after the meteor cutscene (L5938)

Fires once when a hero reaches the crater with `storyFlags.meteorSeen` set and `storyFlags.craterVisited` false; one line is picked at random and announced in that hero's color (L5941).

| Speaker | Line (verbatim) |
|---|---|
| `NOAH` | `This is literally the most insane thing I have ever seen.` |
| `LIAM` | `Stay back, Bella.` |
| `ISABELLA` | `I wanna touch it!` |
| `COLLETTE` | `What IS that?` |

### 2.3 Caged-hero voice lines — Goblin King Kid Snatch (L5235–5236)

`BOSS_BLOCKS.kidSnatch` captures the non-active heroes and, 1.5 s later (staggered 1.2 s apart), announces `<HeroName>: "<line>"`. The pool is keyed by hero index; index 0 is deliberately empty and there is an index-4 entry with no hero.

```js
var lines={0:'',1:"Hey! Let me out!",2:"The structural integrity of this cage is actually pretty— OW.",3:"WHOA! NOT COOL!",4:"HEY! LET ME OUT!"};
```

| Key | Hero at that index | Line (verbatim) |
|---|---|---|
| `0` | LIAM | *(empty string — Liam is silent in the cage)* |
| `1` | NOAH | `Hey! Let me out!` |
| `2` | COLLETTE | `The structural integrity of this cage is actually pretty— OW.` |
| `3` | ISABELLA | `WHOA! NOT COOL!` |
| `4` | *(no hero — unreachable)* | `HEY! LET ME OUT!` |

> Ported as-is. Note in passing that line `2` reads like Noah's voice and `1` like Isabella's; **do not "fix" it** — it is what shipped.

### 2.4 Hero-gated dungeon ability rooms (L7269, L7329–7332 / L7349–7352)

Room-entry hint (announced when an ability room is generated, L7269–7277):

| Hero | Hint (verbatim) |
|---|---|
| LIAM | `These cracks look weak... Liam could smash through!` |
| NOAH | `A distant target... Noah could hit it!` |
| COLLETTE | `A magic seal... Collette could channel it!` |
| ISABELLA | `Gears are jammed... Isabella could break them!` |

Success and refusal lines (duplicated in two code paths, L7329–7332 and L7349–7352):

| Trigger | Success line | Wrong-hero line |
|---|---|---|
| Cracked wall | `Liam smashes through!` | `This requires LIAM's ability!` |
| Target switch | `Noah hits the target!` | `This requires NOAH's precision!` |
| Magic seal | `Collette channels the seal!` (plus progress `Channeling... (N more)`) | `This requires COLLETTE's magic!` |
| Gear lock | `Isabella breaks the gears!` | `This requires ISABELLA's whirl!` |

### 2.5 Hero ultimate & signature call-outs

| Hero | Announce string (verbatim) | Trigger | Line |
|---|---|---|---|
| LIAM | `⚡ EXCALIBUR STRIKE!` (`⚡ EXCALIBUR STRIKE!`) | `actUlt` | L2670 |
| NOAH | `⚡ ARROW STORM!` | `actUlt` | L2677 |
| COLLETTE | `⚡ ARCANE NOVA!` | `actUlt` | L2685 |
| ISABELLA | `⚡ METEOR DROP!` | `actUlt` | L2691 |
| any | `⚡ <combo name>! ⚡` (`'⚡ '+c.nm+'! ⚡'`) | `trigComboUlt` | L2647 |
| any | `<HERO> revived!` | Downed hero revived | L2197 |
| any | `<HERO> revived by Phoenix Feather!` | Phoenix Feather proc | L2381 |
| any | `Switching to <HERO>!` | Hero swap | L2202, L2401 |
| LIAM | `Aegis activated!` | Aegis of Dawn auto-shield | L2261 |
| any | `<HERO> rescued!` | Cage opened | L2865 |
| UI | `All siblings found! Destroy the camps!` | 3/3 siblings rescued and boss not yet up | L2865 |
| UI | `RESCUE!` | Floating label over an unopened sibling cage | L2869 |
| any | `<HERO> skills reset! +N points` | Scroll of Respec used | L1720 |

Combo ultimate names, `COMBO_ULTS` L2628–2635:

| Pair | Name | Color |
|---|---|---|
| Liam + Noah | `Shield Crash` | `#4A9ED8` |
| Liam + Collette | `Arcane Fortress` | `#A862C4` |
| Liam + Isabella | `Earthquake Slam` | `#D88030` |
| Noah + Collette | `Shadow Barrage` | `#3DCC7A` |
| Noah + Isabella | `Blade Storm` | `#E8A838` |
| Collette + Isabella | `Supernova` | `#e84393` |

Co-op abilities, `COOP_ABILITIES` L1378–1382 (announced as `<name>!`, L1405):

| Name | Description | Color |
|---|---|---|
| `Rally Cry` | `Allies +30% DMG` | `#4A9ED8` |
| `Hunter's Mark` | `Enemy +50% DMG taken` | `#3DCC7A` |
| `Arcane Link` | `Heal ally 25% of magic DMG` | `#A862C4` |
| `Shadow Step` | `Teleport to ally + invuln` | `#D88030` |

Floating combat text (`dmgN`, L1732): `IMMUNE!` (L2350, L7629), `BLOCK!` (L2351), `DODGE!` (L2354), `THORNS!` (L2373), `REFLECT!` (L2783), `REFLECTED!` (L2954, L7634), `MISS!` (L2959), `NEW GEAR!` (L5367), `+5g` (L2856), `HIT CAGE!` (L5303).

---

## 3. Grandpa Ed dialogue

All of `DIALOGUE.grandpaEd`, L754–L798. Each entry is `{text:…,mood:…}`; the mood tag drives the portrait (`drawPortrait`, L809) and is preserved here because it is authored intent. Speaker for every line below is **Grandpa Ed**; the name plate reads `Grandpa Ed` in `#228B22` with the `ed` portrait (L804).

### 3.1 Greetings — `DIALOGUE.grandpaEd.greetings` (L754–760)

Trigger: talk to Ed when he has no quest to give or turn in and the questline is not complete (L8408). Hero reaction context appended: `quest_intro`.

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `Well if it isn't the Stewart Squad! Looking sharp.` | `happy` |
| 2 | `You kids remind me of myself... before the knees went.` | `wink` |
| 3 | `Back in my day, we didn't have dungeons. We had character.` | `smirk` |
| 4 | `A pilot's not meant to stay on the ground. Or even in the atmosphere, if you ask me.` | `wistful` |
| 5 | `You know, once I get this old bird flying again, I've got BIGGER plans. Much bigger. ...Don't worry about it.` | `dreamy` |
| 6 | `I wasn't crashing — I was testing re-entry angles! ...For a friend.` | `nervous` |

### 3.2 Ground-Ed questline — `DIALOGUE.grandpaEd.quest_ground_ed` (L761–781)

Trigger: `edInteract()` (L8392–8408). Intros fire when a quest is offered (`quest_intro` hero reaction, L8399); returns fire on turn-in (no hero reaction, L8394).

**Phase 1 intro — `phase1_intro` (L761–765)**

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `Well, hello there! I seem to have had a slight disagreement with gravity.` | `cheerful` |
| 2 | `I'm fine, but the old bird is... well, she's 'Ground-Ed.'` | `sheepish` |
| 3 | `I saw my propeller spin off toward the Frozen Peaks. Makes sense, it loves the wind.` | `thinking` |
| 4 | `Go fetch it, and don't look down!` | `wink` |

**Phase 1 return — `phase1_return` (L766)**

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `You found it! Ha! That propeller's been through worse than this.` | `happy` |

**Phase 2 intro — `phase2_intro` (L767–770)**

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `Now, that propeller is useless without the rudder.` | `serious` |
| 2 | `I was flying low over the Murky Swamp when something tried to take a bite out of my tail.` | `nervous` |
| 3 | `I think the green rudder ended up near the Bog Witch's territory. Nasty critters in that swamp.` | `worried` |

**Phase 2 return — `phase2_return` (L771)**

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `The rudder! And it's still green! ...Well, greener than usual after the swamp.` | `relieved` |

**Phase 3 intro — `phase3_intro` (L772–775)**

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `Almost ready for takeoff! But the engine won't purr without the spark plug.` | `excited` |
| 2 | `I saw a goblin snatch it right as I crashed. He ran into the Crystal Depths.` | `annoyed` |
| 3 | `He probably thinks it's a shiny gem. Go trade him... or, you know, 'persuade' him.` | `wink` |

**Phase 3 return — `phase3_return` (L776)**

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `The Sparky-Thingy! Ha! You're a lifesaver, kid.` | `overjoyed` |

**Quest complete — `quest_complete` (L777–781).** Trigger: turning in phase 3 (L8395). Hero reaction context: `space_hint`. Followed by the announce `The Green Meanie lives again!` and the achievement `Well-Ed-ucated`.

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `That's the sound of freedom!` | `triumphant` |
| 2 | `I'm going to do a reconnaissance loop. Keep your eyes on the sky!` | `excited` |
| 3 | `And between you and me... I've got my eye on something bigger than this atmosphere.` | `wistful` |
| 4 | `But that's a story for another day. Go be heroes!` | `proud` |

### 3.3 Crash landing — `DIALOGUE.grandpaEd.crash_landing` (L782–786)

**Authored but never opened in v27** — no `openDialogue('grandpaEd','crash_landing',…)` call exists (see §13). The crash event only announces `Grandpa Ed has crash-landed!` (L6138).

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `Don't worry! That's a CONTROLLED descent! ...mostly.` | `nervous` |
| 2 | `Any landing you walk away from, am I right?` | `cheerful` |
| 3 | `I swear this never used to happen. The wind's different up here lately.` | `puzzled` |
| 4 | `I was distracted. I thought I saw something... up there. Way up.` | `wistful` |

### 3.4 Post-quest chat — `DIALOGUE.grandpaEd.post_quest` (L787–792)

Trigger: talk to Ed once `storyFlags.edQuestComplete` is set (L8407). Hero reaction context: `space_hint`.

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `The Green Meanie's running like a dream! Well, a slightly bumpy dream.` | `happy` |
| 2 | `You know, instead of fighting through that dungeon, we could just relax and—` | `hopeful` |
| 3 | `Never mind. I can see it in your eyes. You're going the hard way. As usual.` | `resigned` |
| 4 | `I've been doing some research. Star charts. Very important stuff.` | `secretive` |
| 5 | `There's a strange tower to the east... gears turning inside, no one at the controls. Reminds me of my workshop.` | `curious` |

### 3.5 Crater awareness — `DIALOGUE.grandpaEd.crater_awareness` (L793–798)

Trigger: `storyFlags.edQuestComplete && storyFlags.craterVisited && storyFlags.meteorSeen && !storyFlags.edCraterDialogue` (L8403–8404). Hero reaction context: `ed_crater`. This is the emotional payload of the story spine.

| # | Line (verbatim) | mood |
|---|---|---|
| 1 | `Well now... that's not something you see every day.` | `stunned` |
| 2 | `Gran used to tell stories about lights like these when I was growing up...` | `wistful` |
| 3 | `She'd say: 'Eddie, the sky has more in it than stars. And some of it is watching.'` | `wistful` |
| 4 | `Everyone thought she was telling fairy tales. I wasn't so sure.` | `serious` |
| 5 | `I need to think about this. Come back later.` | `distracted` |

### 3.6 Ed's biplane / flyover / supply-drop announces

| String (verbatim) | Trigger | Line |
|---|---|---|
| `✈️ A biplane sputters overhead!` (`✈️`) | Crash-ready flyover begins | L6024 |
| `✈️ Supply drop inbound!` | Flyover with `evt2==='supply'` | L6028 |
| `✈️ A biplane flies overhead!` | Ordinary flyover | L6028 |
| `Ed: "Time for a supply run!"` | Ed takes off from his landing strip | L6040 |
| `📦 Supply crates incoming!` (`\u{1F4E6}`) | Parachute crates released | L6102 |
| `Ed's back from his supply run!` | Ed lands after a supply run | L6121 |
| `Grandpa Ed has crash-landed!` | Biplane crash event; spawns Ed as an NPC | L6138 |
| `Supply crate: Healed!` | Crate pickup, heal roll (60 %) | L5999 |
| `Supply crate: +N Gold!` | Crate pickup, gold roll | L6000 |
| `The Green Meanie lives again!` | Ground-Ed phase 3 turned in | L8395 |
| `Spark Plug recovered from the Crystal Depths!` | Spark plug retrieved inside the cave dungeon | L7110 |
| `Grandpa Ed` | Floating name label under Ed in the world | L8388 |

---

## 4. NPC dialogue

### 4.1 `NPC_DEFS` biome guides — three lines each (L626–631)

Shown in a speech bubble when a hero is within 120 px (L8432, L8449); the line advances through `dlg[dlgIdx % dlg.length]` (L8350). Line 1 is the greeting, line 2 the boss tip, line 3 the post-victory line.

**Rootkeeper Elm** — forest, L627

| # | Line (verbatim) |
|---|---|
| 1 | `The old roots still remember your name, young heroes...` |
| 2 | `The Hollow Grove Treant draws strength from the earth. Sever the roots!` |
| 3 | `The forest breathes easier since you walked through. Well fought.` |

**Lamplighter Quartz** — cave, L628

| # | Line (verbatim) |
|---|---|
| 1 | `These halls have waited a long time for lamplight...` |
| 2 | `Crystal Colossus reflects projectiles. Get in close when the shield shimmers.` |
| 3 | `You carry brightness where it matters most.` |

**Dunewalker Sol** — desert, L629

| # | Line (verbatim) |
|---|---|
| 1 | `Sand remembers every footprint, if you know how to read it...` |
| 2 | `The Pharaoh Wraith blinks between sun-marks. Track the afterimage.` |
| 3 | `The desert respects those who keep walking.` |

**Mistweaver Fern** — swamp, L630

| # | Line (verbatim) |
|---|---|
| 1 | `The mist has moods, child. Today it whispers your name...` |
| 2 | `The Hydra has many heads. Kill it before it splits!` |
| 3 | `Heh, you turned the marsh from a trap into a trail.` |

**Hearthkeeper Neve** — frozen, L631

| # | Line (verbatim) |
|---|---|
| 1 | `Come warm yourself. The ice is patient, but you needn't be...` *(source escapes the apostrophe: `needn\'t`)* |
| 2 | `The Frost Lich summons blizzards. Hit hard to break the channel.` |
| 3 | `Beyond the ice lies the final challenge. You are ready.` |

### 4.2 Quest-state bubble overrides — `getNPCDialogue` (L8345–8350)

The bubble shows a quest line instead of flavor whenever the NPC has quest state:

| State | Bubble template (verbatim) |
|---|---|
| Turn-in ready | `✅ <quest title> — Complete! Press SPACE to turn in.` (`'✅ '+qd.title+' — Complete! Press SPACE to turn in.'`) |
| Offer available | `❗ <quest title>: <quest desc> [SPACE to accept]` (`'❗ '+qd.title+': '+qd.desc+' [SPACE to accept]'`) |
| In progress | `… <quest title>: <progress>/<target> — <hint>` (`'… '+qd.title+': '+qs.progress+'/'+qd.target+' — '+qd.hint`) |
| All quests done | one of three, picked at random (L8349): |
| | `Thank you, hero. The land is safe.` |
| | `You have done everything I asked.` |
| | `Go forth with my blessing!` |
| No NPC def found | `...` |

Quest-marker glyphs drawn over the NPC's head (L8427–8430): `✓` (`✓`, turn-in ready, green), `!` (offer available, gold), `...` (active, grey), `!` (never visited, gold).

---

## 5. Quest text

### 5.1 `QUEST_DEFS` — 15 NPC quests (L697–716)

Every quest carries `title`, `desc`, `hint` and `rewardDesc`; all four are player-facing.

| id | NPC | Title | Description | Hint | Reward text | Chain |
|---|---|---|---|---|---|---|
| `forest_1` | Rootkeeper Elm | `Roots of the Problem` | `Destroy 2 spawners in the forest.` | `Corrupted camps poison the forest...` | `+10% DMG in forest` | 1 |
| `forest_2` | Rootkeeper Elm | `Whispers in the Grove` | `Talk to the Crystal Sage and return.` | `Seek the Crystal Sage in the caves...` | `Compass range upgrade` | 2 |
| `forest_3` | Rootkeeper Elm | `Heart of the Hollow` | `Clear the Hollow Grove dungeon.` | `The dungeon awaits your courage...` | `+2 HP regen/s all biomes` | 3 |
| `cave_1` | Lamplighter Quartz | `Crystal Resonance` | `Kill 20 enemies in the cave biome.` | `The caves swarm with enemies...` | `+10% DMG in cave` | 1 |
| `cave_2` | Lamplighter Quartz | `Shattered Reflections` | `Collect 5 equipment drops.` | `Gather relics from your foes...` | `+5% crit chance` | 2 |
| `cave_3` | Lamplighter Quartz | `Depths of Power` | `Defeat the Crystal Colossus.` | `Face the boss of the caverns...` | `Mini-map enemy dots` | 3 |
| `desert_1` | Dunewalker Sol | `Desert Trials` | `Survive 3 world events.` | `Face the world's trials...` | `+15% speed in desert` | 1 |
| `desert_2` | Dunewalker Sol | `Nomad's Path` | `Visit 3 waypoints in the desert.` | `Seek the markers in the sands...` | `+50 max HP all heroes` | 2 |
| `desert_3` | Dunewalker Sol | `Tomb Raider` | `Clear the Buried Tomb dungeon.` | `Conquer the desert dungeon...` | `+50 max HP all heroes` | 3 |
| `swamp_1` | Mistweaver Fern | `Witch's Errand` | `Kill 15 enemies in the swamp biome.` | `Cleanse the swamp of foes...` | `+10% lifesteal in swamp` | 1 |
| `swamp_2` | Mistweaver Fern | `Toxic Harvest` | `Escort the frog familiar to safety.` | `Protect my little friend...` | `Poison immunity` | 2 |
| `swamp_3` | Mistweaver Fern | `Swamp Sovereign` | `Defeat the Hydra Matriarch.` | `Slay the swamp boss...` | `Potions heal 2x` | 3 |
| `frozen_1` | Hearthkeeper Neve | `Cold Front` | `Destroy 2 spawners in the frozen biome.` | `Destroy the icy camps...` | `+15% attack speed in frozen` | 1 |
| `frozen_2` | Hearthkeeper Neve | `The Hermit's Test` | `Defeat 2 mini-bosses (any biome).` | `Prove yourself against the mighty...` | `+10% damage reduction` | 2 |
| `frozen_3` | Hearthkeeper Neve | `Ice Citadel` | `Clear the Ice Citadel dungeon.` | `Conquer the frozen dungeon...` | `+20% XP from all sources` | 3 |

### 5.2 Ground-Ed questline (L713–715)

| id | NPC | Title | Description | Hint | Reward text | Item biome |
|---|---|---|---|---|---|---|
| `ground_ed_1` | Grandpa Ed | `Ground-Ed: The Propeller` | `Find the propeller in the Frozen Peaks.` | `It spun off toward the ice...` | `Aviator Goggles + 100 Gold` | `frozen` |
| `ground_ed_2` | Grandpa Ed | `Ground-Ed: The Rudder` | `Retrieve the rudder from the Murky Swamp.` | `Something dragged it into the muck...` | `Ed-ible x3 + 100 Gold` | `swamp` |
| `ground_ed_3` | Grandpa Ed | `Ground-Ed: The Spark Plug` | `Clear the Crystal Depths to recover the spark plug.` | `A goblin took it underground...` | `Better supply drops + 150 Gold` | `cave` (dungeon) |

### 5.3 `QUEST_ITEMS` (L722)

| Key | Display name | Color / glow | Biome | Ambush? |
|---|---|---|---|---|
| `ed_propeller` | `Propeller` | `#888` / `#FFD700` | `frozen` | no |
| `ed_rudder` | `Rudder` | `#228B22` / `#228B22` | `swamp` | yes — 4 enemies |
| `ed_sparkplug` | `Spark Plug` | `#C0C0C0` / `#00d2ff` | `cave` (inside the dungeon) | no |

Item pickup / ambush strings: `Ambush!` (L734), `<item name> collected!` (L734).

### 5.4 Quest notification & announce strings

| String (verbatim) | Trigger | Line |
|---|---|---|
| `<quest title> — Ready to turn in!` (`qd.title+' — Ready to turn in!'`) | Objective count reached | L744 |
| `<quest title>: <progress>/<target>` | Objective progress | L745 |
| `✅ <quest title> — Complete! <rewardDesc>` (notification) | Quest turned in | L8360, L8370 |
| `✅ <quest title> complete!` (announce) | Quest turned in | L8360, L8370 |
| `❗ Quest Accepted: <quest title>` (notification, `❗`) | Quest accepted | L8364, L8374 |
| `❗ <quest title> accepted!` (announce) | Quest accepted | L8364, L8374 |
| `Bounty complete: <bounty name>!` | Bounty objective reached | L695 |
| `+<gold>g +<xp> XP!` | Bounty reward claimed | L1714 |
| `🐸 Familiar arrived safely!` | Escort quest success | L8457 |
| `🐸 Familiar died! Talk to Bog Witch to retry.` | Escort quest failure | L8463 |
| `WAYPOINT` | Label under desert quest waypoints | L8577 |

### 5.5 `BOUNTY_POOL` — 12 bounties (L680–692)

| id | Name | Description |
|---|---|---|
| `b_kills50` | `Monster Slayer` | `Kill 50 enemies` |
| `b_kills100` | `Exterminator` | `Kill 100 enemies` |
| `b_camps3` | `Camp Raider` | `Destroy 3 spawner camps` |
| `b_dungeon` | `Dungeon Diver` | `Clear any dungeon` |
| `b_boss` | `Boss Hunter` | `Defeat any boss` |
| `b_secrets3` | `Treasure Seeker` | `Find 3 secrets` |
| `b_nodmg30` | `Untouchable` | `Go 30s without taking damage` |
| `b_weather3` | `Storm Chaser` | `Fight through 3 weather changes` |
| `b_sig10` | `Signature Style` | `Use signature abilities 10 times` |
| `b_merchant` | `Big Spender` | `Buy 3 items from merchant` |
| `b_lvlup` | `Power Surge` | `Gain 3 team levels` |
| `b_gold200` | `Gold Rush` | `Collect 200 gold` |

---

## 6. Boss names & voice lines

### 6.1 The Goblin King (L3113–3296)

Namecard, `playBossIntro('THE GOBLIN KING','Ruler of the Horde — Kid Snatch!','#D84830','#D84830')` (L3294).

| Element | Text (verbatim) | Line |
|---|---|---|
| Boss name card | `THE GOBLIN KING` | L3294 |
| Boss subtitle | `Ruler of the Horde — Kid Snatch!` | L3294 |
| Spawn announce | `THE GOBLIN KING APPEARS!` | L3294 |
| Bestiary name | `The Goblin King` | L8549 |
| Bestiary description | `Ruler of the Horde. Charges, summons minions, and slams the ground.` | L8549 |

| Phase / event | Voice line or announce (verbatim) | Trigger | Line |
|---|---|---|---|
| Opening snatch (fires once, 1.5 s after spawn) | `GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"` | `_snatchWindup >= 1.5` | L3145 |
| Phase 2 | `PHASE 2 — THE KING WEAKENS!` | HP ≤ 50 % | L3159 |
| Phase 3 | `PHASE 3 — DEATH OR GLORY!` | HP ≤ 25 % | L3162 |
| Phase 3, cage still occupied | `The King throws the empty cage!` | on phase-3 entry, after freeing all caged heroes | L3165 |
| Summon | `Minions, attack!` | summon timer | L3190 |
| Spin attack | `The King spins!` | spin timer | L3197 |
| HP threshold | `Boss weakening!` | 66 % | L3221 |
| HP threshold | `Halfway there!` | 50 % | L3222 |
| HP threshold | `Almost defeated!` | 25 % | L3223 |
| Death | `GOBLIN KING DEFEATED!` | HP ≤ 0 | L3230 |
| Phase label above the boss | `PHASE 1` / `WEAKENING` / `ENRAGED` | drawn every frame | L3284 |

Cage HUD strings (`BOSS_BLOCKS` cage, L5233–5303, L9394):

| Text (verbatim) | Trigger | Line |
|---|---|---|
| `Heroes captured!` | `kidSnatch` fires | L5233 |
| `<HERO>: "<caged line>"` | staggered caged voice lines (§2.3) | L5236 |
| `<HERO> freed!` | cage HP broken for one hero | L5264 |
| `ALL HEROES FREE!` | cage destroyed | L5274 |
| `HIT CAGE!` | floating prompt over an exposed cage | L5303 |
| `CAGE — HIT NOW!  [N captured]` / `CAGE  [N captured]` | cage health bar caption | L9394 |

### 6.2 The Shadow Queen (L5528–5665, L9331)

| Element | Text (verbatim) | Line |
|---|---|---|
| Boss name card | `THE SHADOW QUEEN` | L9331 |
| Boss subtitle | `Mistress of Darkness` | L9331 |
| Bestiary name | `The Shadow Queen` | L8550 |
| Bestiary description | `Final boss. Wields darkness itself. Only the bravest survive.` | L8550 |

| Phase / event | Announce (verbatim) | Trigger | Line |
|---|---|---|---|
| Phase 2 | `The Shadow Queen summons clones!` | HP < 70 % | L5549 |
| Phase 3 | `KIDNAP PHASE - Protect your siblings!` | HP < 40 % | L5550 |
| Phase 4 | `DESPERATION - She fights for survival!` | HP < 15 % | L5551 |
| Kidnap start | `⚠ <HERO> is being KIDNAPPED! Deal damage to interrupt!` (`⚠`) | kidnap begins | L5622 |
| Kidnap succeeds | `<HERO> has been BANISHED!` | kidnap timer expires | L5561 |
| Kidnap broken | `Kidnap interrupted!` | enough damage dealt | L5568 |
| Clones | `Shadow clones appear!` | clone timer | L5613 |
| Kidnap progress bar caption | `INTERRUPTING KIDNAP: N%  (<HERO>)` | while interrupting | L5709 |
| Defeat | `THE SHADOW IS VANQUISHED!` | HP ≤ 0 | L5658 |
| Defeat | `New Game+ unlocked!` | HP ≤ 0 | L5655 |
| Victory-stats title | `SHADOW QUEEN VANQUISHED!` | post-fight | L5665 |
| Victory-stats subtitle | `The darkness has been defeated!` | post-fight | L5665 |
| Realm entry | `Welcome to the Shadow Realm...` | portal entered | L9325 |
| Portal label | `ENTER PORTAL` | drawn on the portal | L5738 |
| Portal spawn | `A mysterious portal appears...` | portal opens | L5716 |

### 6.3 Dungeon bosses — `DungeonBoss` (L7377), `spawnDungeonBoss` (L7378)

Boss intro card (L7074): name `DUNGEON_NAMES[biome]`, subtitle `<BIOME> DUNGEON` (uppercased biome key). Cinematic caption `Guardian of <dungeon name>` (L8097).

| Biome | Boss name | Bestiary description | Line |
|---|---|---|---|
| `forest` | `Ancient Treant` | `Guardian of the Hollow Grove. Heals itself and summons root grabs.` | L7377, L8544 |
| `cave` | `Crystal Colossus` | `Reflects ranged attacks with its crystal shield. Fires a sweeping beam.` | L7377, L8545 |
| `desert` | `Pharaoh Wraith` | `Teleports across the arena. Curses heroes and summons mummies.` | L7377, L8546 |
| `swamp` | `Hydra Matriarch` | `Multiple heads attack simultaneously. Splits into more heads at low HP.` | L7377, L8547 |
| `frozen` | `Frost Lich` | `Freezes heroes solid. Summons ice walls and devastating blizzards.` | L7377, L8548 |
| `volcanic` | `Magma Titan` | `Ancient colossus of fire and stone. Armored plates protect its molten core.` | L7377, L8551 |
| citadel floor 3 | `Citadel Warden` | *(no bestiary entry)* | L827, L7385 |

**Ancient Treant (forest) — L7438–7488**

| Phase / attack | Announce (verbatim) | Line |
|---|---|---|
| Phase 2 | `The Treant plants itself!` | L7438 |
| Phase 3 | `The Treant UPROOTS!` | L7439 |
| Attack | `Root Grab!` | L7449 |
| Attack | `Sprites emerge!` | L7456 |
| Attack | `Root network spreads!` | L7464 |
| Attack | `Saplings sprout! Kill them fast!` | L7471 |
| Attack | `Branch Sweep!` | L7479 |
| Attack | `Leaf Explosion!` | L7488 |

**Pharaoh Wraith (desert) — L7513–7574**

| Phase / attack | Announce (verbatim) | Line |
|---|---|---|
| Cocoon phase | `The Wraith retreats into the sarcophagus!` | L7513 |
| Cocoon phase (block text) | `Sarcophagus sealed! Survive the scarabs!` | L7516 |
| Attack | `Scarab swarm!` | L7521 |
| Phantom split | `PHANTOM SPLIT! Find the real Wraith!` | L7523 |
| Attack | `Sand soldiers rise!` | L7555 |
| Attack | `The phantoms shift!` | L7574 |

**Crystal Colossus (cave) — L7598**

| Attack | Announce (verbatim) | Line |
|---|---|---|
| Beam | `Crystal Beam!` | L7598 |

**Hydra Matriarch (swamp) — L7599–7605**

| Attack | Announce (verbatim) | Line |
|---|---|---|
| Pools | `Poison pools!` | L7599 |
| Split | `The Hydra splits!` | L7605 (also L2966 for the overworld Swamp Hydra mini-boss) |

**Frost Lich (frozen) — L7606–7613**

| Attack | Announce (verbatim) | Line |
|---|---|---|
| Freeze | `Frozen solid!` | L7606 |
| Walls | `Ice walls!` | L7606 |
| Ultimate | `BLIZZARD!` | L7613 |

**Magma Titan (volcanic) — L7616–7636**

| Phase / attack | Announce (verbatim) | Line |
|---|---|---|
| Armor up | `Obsidian armor forms!` | L7616 |
| Attack | `Lava Spray!` | L7619 |
| Attack | `Embers swarm!` | L7621 |
| Meltdown | `MELTDOWN!` | L7623 |
| Enrage | `TITAN ENRAGES!` | L7625 |
| Armor plate broken | `<N/S/E/W> armor shattered!` | L7636 |
| All armor down | `All armor destroyed!` | L7636 |

**Shared dungeon-boss lines (all biomes) — L7396–7638**

| Event | Announce (verbatim) | Line |
|---|---|---|
| Enrage | `<Boss name> enrages!` | L7396 |
| Final phase | `FINAL PHASE!` | L7397 |
| HP threshold | `<Boss name> weakening!` | L7637 |
| HP threshold | `Halfway there!` | L7637 |
| HP threshold | `Almost defeated!` | L7637 |
| Death | `<Boss name> DEFEATED!` | L7638 |

**Citadel Warden (citadel floor 3) — L7402–7413**

| Phase / attack | Announce (verbatim) | Line |
|---|---|---|
| Phase shift | `The Warden shifts to shadow magic!` | L7402 |
| Void form | `VOID FORM UNLEASHED!` | L7403 |
| Attack | `Warden charges!` | L7413 |

### 6.4 Shared `BOSS_BLOCKS` announces (L5089–5321)

| Block | Announce (verbatim) | Line |
|---|---|---|
| `cocoon` (default text) | `The boss retreats into a cocoon!` | L5089 |
| `cocoon` | `The cocoon cracks!` | L5096 |
| `cocoon` | `The cocoon shatters! VULNERABLE!` | L5099 |
| `tether` | `Tethered! Destroy the anchor!` | L5111 |
| `tether` | `Tether broken!` | L5117 |
| `wallStun` | `Stunned!` | L5187 |
| `containment` | `<HERO> trapped! Break the field!` | L5202 |
| `containment` | `Field broken!` | L5208 |
| `summonShield` | `Shield up! Kill the minions!` | L5321 |

### 6.5 Overworld mini-bosses (L2873–2980)

Popup: `showMiniBossPopup(this.nm, this.biomeNm || 'Guardian', this.col)` (L2892).

| Type | Name (`nm`) | Subtitle (`biomeNm`) | Line |
|---|---|---|---|
| `golem` | `Crystal Golem` | `Crystal Caverns Guardian` | L2876 |
| `sandworm` | `Sandworm` | `Desert Depths Guardian` | L2877 |
| `hydra` | `Swamp Hydra` | `Toxic Swamp Guardian` | L2878 |
| `frostwyrm` | `Frost Wyrm` | `Frozen Tundra Guardian` | L2879 |

Shared mini-boss announces: `<name> APPEARS!` (L2890), `The ground trembles...` (L2921), `The Hydra splits!` (L2966), `<name> DEFEATED!` (L2980), `<name> — Phase N` (`this.nm+' — Phase '+this.phase`, L3068).

### 6.6 Shadow Citadel (L820–827, L7072–7123)

| Floor | Name | Biome skin | Hazard | Mini-boss |
|---|---|---|---|---|
| 1 | `Outer Ward` | `cave` | `spikes` | `Stone Sentinel` |
| 2 | `Inner Sanctum` | `swamp` | `poison` | `Phantom Warden` |
| 3 | `Throne of Shadows` | `frozen` | `ice` | *(none)* |

| String (verbatim) | Trigger | Line |
|---|---|---|
| `Shadow Citadel — Floor 1: Outer Ward` | Entering the citadel | L7072 |
| `Shadow Citadel — Floor N` (name card) / floor name as subtitle | Boss intro card per floor | L7074 |
| `The shadows deepen... dark whispers fill the air.` | Advancing to floor 2 | L7084 |
| `The final threshold. No turning back.` | Advancing to floor 3 | L7084 |
| `SHADOW CITADEL — Floor N: <floor name>` | On-screen floor banner | L8060 |
| `★ THE SHADOW CITADEL HAS FALLEN ★` (`★`) | Citadel cleared | L7121 |
| `The ultimate darkness has been vanquished!` | Citadel victory subtitle (NG+ < 5) | L7123 |
| `The Stewart Squad has conquered every challenge! The realm is forever at peace.` | Citadel victory subtitle at NG+5 | L7123 |
| `<hero> received <legendary>!` | Legendary awarded on citadel clear | L7099 |
| `The world awaits — explore the Shadow Citadel!` | Post-victory "keep playing" | L9426 |

### 6.7 Enemy types — `ETYPES` (L2733–2744)

`ETYPES` carries **no display names**; enemies are identified in code by their key only and are never named on screen. The 16 keys, in source order:

`goblin`, `orc`, `troll`, `archer`, `bat`, `shielded`, `slime`, `skeleton`, `mushroom`, `fire_elemental`, `lava_slime`, `ember_sprite`, `obsidian_guard`, `wraith`, `brute`, `healer`, `bomber` (17 keys — `obsidian_guard` at L2740 sits between `ember_sprite` and `wraith`).

Special enemy variants created at runtime with their own type strings: `caravan_goblin` (L5759), `treasure_goblin` (L5778).

---

## 7. Cutscene shot tables

### 7.1 The Meteor Cutscene — `triggerMeteorCutscene()` (L4448–5014)

Header comment, L4449: `// 7 scenes: FP Calm → Sky Watch → Crossing → Dive → Impact → Aftermath → Return`. Total run time 24.2 s. Letterbox bars grow at `dt*3` to 60 px top and bottom (L4388–4391). Skip prompt is drawn every frame: `Press SPACE to skip` (L4393). Skipping runs every remaining step's `onEnd` (L4395–4400).

| Shot | Scene name (source comment) | Duration | Camera / staging (as the code describes and implements it) | On-screen text |
|---|---|---|---|---|
| 1 | `SCENE 1: FIRST-PERSON CALM (4.0s)` — `Through Liam's eyes. Head pans right, tilts up. Biome-adaptive landscape.` | `4.0` s | First-person. Head choreography: still (`p<0.30`) → pan right `ease3` to `0.6` (`p<0.65`) → hold `0.6` (`p<0.85`) → pan to `0.7` + tilt up `0.15`. Vignette ramps `easeIn2(p)*0.3`. Music `masterGain` ramps to 0 over 2.5 s. | *(none)* |
| 2 | `SCENE 2: SKY WATCH (4.2s)` — `Tilt up to full sky. Meteor appears as distant light on bezier curve.` | `4.2` s | Tilt `lerp(0.15,1.0,ease3(min(p*1.7,1)))`, pan `lerp(0.7,0.5,ease3(p))`. Sky fill `#040410`. Meteor enters at `p>0.25`, size `lerp(2,6,mp)` along bezier `bez3(cP0,cP1,cP2,cP3, mp*0.3)`. Vignette `0.25`. | `What is that...?` — announced at `mp>0.3` in `#A8D0E8` for 2 s (L4799) |
| 3 | `SCENE 3: THE CROSSING (4.5s)` — `Full sky. Meteor screams across on bezier with 8-layer rendering, trail, smoke, flare.` | `4.5` s | Full sky. `cineShake.intensity=3` on start. Smoke, screen-space embers and meteor trail buffers reset on start. | *(none)* |
| 4 | `SCENE 4: THE DIVE (3.5s)` — `Orbital view: planet surface below, stars above, meteor dives from space` | `3.5` s | Orbital framing, background `#030308`. White flash-out over the last 10 %: `rgba(255,255,240, fP*fP*0.8)`. | *(none)* |
| 5 | `SCENE 5: THE IMPACT (1.5s)` — `Overworld view. White flash, 1200 pooled embers, debris, shockwave rings.` | `1.5` s | Cuts to overworld. `WORLD_ZOOM=_csZoom` (crater-framing zoom, capped 4.5); camera snapped to `crater − half-screen`. `cs.impFlash=1.0`, `cs.freezeTimer=0.06`, `cineShake.intensity=40`, `snd('boom',0.6)`, `screenShake(22,0.9)`. | *(none)* |
| 6 | `SCENE 6: THE AFTERMATH (3.0s)` — `Smoke clears, crater glows, embers rain. Camera settles with smoothDamp.` | `3.0` s | Camera settles via `smoothDamp`; cine-shake decays. `onEnd` sets `storyFlags.meteorSeen=true`, `ALIEN_CRATER.discovered=true`, `storyFlags.craterDiscovered=true`. | `A strange light glows in the distance...` — announced at `p>0.7` in `#8850A8` for 4 s (L4989) |
| 7 | `SCENE 7: THE RETURN (3.5s)` — `Camera eases back to heroes. Music fades in. Zoom returns to normal.` | `3.5` s | `WORLD_ZOOM=lerp(_csZoom,_origZoom,ease3(p))`; camera `lerp` from crater back to the pre-cutscene position, then clamped to world bounds. Embers keep settling. Vignette `lerp(0.4,0,ep)`. Music `masterGain` ramps back to `bgm.vol` over 2.0 s. | *(none)* |

**Crater strings tied to the cutscene:**

| String (verbatim) | Trigger | Line |
|---|---|---|
| `Something fell here. A long time ago.` | First time a hero reaches the crater (also grants the `Ground Control` achievement) | L5934 |
| *(a random `CRATER_FLAVOR` line)* | Re-entering the crater more than 30 s later | L5942 |
| *(a random hero crater line, §2.2)* | First crater visit after the cutscene | L5941 |

### 7.2 Boss intro cinematic (L5328–5346)

Not a shot list — a reusable overlay. `playBossIntro(name, subtitle, color, borderColor)` shows letterbox bars (`letterbox-top show` / `letterbox-bot show`, L5336; hidden with `letterbox-top hide` / `letterbox-bot hide`, L5340) plus the `bossNamecard` DOM element (L511: `boss-nm` + `boss-title`). Grayscale/brightness filter `grayscale(0.6) brightness(0.7)` (L5313). Mini-bosses use `showMiniBossPopup(name, subtitle, color)` into `mbPopup` (L512, L5346–5349).

Call sites:

| Name | Subtitle | Line |
|---|---|---|
| `THE GOBLIN KING` | `Ruler of the Horde — Kid Snatch!` | L3294 |
| `THE SHADOW QUEEN` | `Mistress of Darkness` | L9331 |
| `DUNGEON_NAMES[biome]` / `Shadow Citadel — Floor N` | `<BIOME> DUNGEON` / citadel floor name | L7074 |
| `snap.dng.cinB.nm` or `BOSS` (multiplayer guest) | `<BIOME> DUNGEON` / `DUNGEON` | L8986 |

---

## 8. Tutorial text

`TUTORIAL_STEPS`, L4314–4322. Drawn as a single pulsing line at `H-65` (L4328–4337); suppressed when `settings.showTutorial` is off. Each step advances when its `check()` passes; a chime (`snd('achieve',0.15)`) plays on each advance.

| # | Message (verbatim) | Escape in source | Advance condition |
|---|---|---|---|
| 1 | `🎮 WASD to move (or drag left side on mobile)` | `🎮` | hero 0 has moved more than 100 px from the start point |
| 2 | `⚔️ Click to attack enemies!` | `⚔️` | `gameStats.kills >= 1` |
| 3 | `🔑 Walk to the cage to rescue your sibling!` | `🔑` | `sibs >= 1` |
| 4 | `👥 Press 1-4 to switch heroes` | `👥` | `tutorial._switched` |
| 5 | `⬆️ Choose a card to level up!` | `⬆️` | `teamLv >= 2` |
| 6 | `🌳 Press T to open Skill Trees` | `🌳` | `tutorial._openedTree` |
| 7 | `🗺️ Explore the biomes! Check the minimap.` | `🗺️` | 5-second timer expires |

Related opening strings:

| String (verbatim) | Trigger | Line |
|---|---|---|
| `WASD to move • Heroes auto-attack • R: Ultimate • SPACE: Interact • Q: Compass • J: Quests • M: Mute • B: Bestiary` (`•` = `•`) | Persistent controls hint strip | L3412 |
| `Find and rescue your siblings!` | Game start (normal) | L8328 |
| `Shadow Citadel is ready!` | Game start with `DEV_MODE` | L8328 |
| `💡 Press I to open Inventory and equip your gear!` | First gear pickup | L2019 |
| `[SPACE] Pick up` | Prompt over a dropped gear orb | L2047 |

---

## 9. Achievements

`achievements`, L881–912. Unlock toast: icon + name over the caption `Achievement Unlocked!` (L3625), 3.5 s, with `snd('achieve',0.3)` (L914–919).

| Key | Name (verbatim) | Icon | Icon escape | Description (verbatim) |
|---|---|---|---|---|
| `firstBlood` | `First Blood` | 🗡️ | `\u{1F5E1}️` | `Kill your first enemy` |
| `squadAssembled` | `Squad Assembled` | 👨‍👩‍👧‍👦 | `\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}` | `Rescue all 3 siblings` |
| `campCrusher` | `Camp Crusher` | 🏕️ | `\u{1F3D5}️` | `Destroy your first camp` |
| `miniBossSlayer` | `Mini-Boss Slayer` | 💀 | `\u{1F480}` | `Defeat any mini-boss` |
| `kingSlayer` | `King Slayer` | 👑 | `\u{1F451}` | `Defeat the Goblin King` |
| `ultPower` | `Ultimate Power` | ⚡ | `⚡` | `Use an ultimate ability` |
| `fullyEquipped` | `Fully Equipped` | 🎒 | `\u{1F392}` | `Pick up 5 equipment items` |
| `nightWarrior` | `Night Warrior` | 🌙 | `\u{1F319}` | `Kill 10 enemies at night` |
| `dungeoneer` | `Dungeoneer` | 🏰 | `\u{1F3F0}` | `Clear your first dungeon` |
| `eventSurvivor` | `Event Survivor` | 🌟 | `\u{1F31F}` | `Survive a blood moon event` |
| `shadowSlayer` | `Shadow Slayer` | 👻 | `\u{1F47B}` | `Defeat the Shadow Queen` |
| `forgedInFire` | `Forged in Fire` | 🌋 | `\u{1F30B}` | `Defeat the Magma Titan` |
| `treasureHunter` | `Treasure Hunter` | 💰 | `\u{1F4B0}` | `Catch a treasure goblin` |
| `questMaster` | `Quest Master` | 📜 | `\u{1F4DC}` | `Complete all 15 NPC quests` |
| `sigMaster` | `Signature Style` | 🎯 | `\u{1F3AF}` | `Use all 4 hero signatures in one session` |
| `skinCollector` | `Fashionista` | 👗 | `\u{1F457}` | `Unlock 4+ skins` |
| `mvpStreak` | `MVP` | 👑 | `\u{1F451}` | `Get MVP 3 times` |
| `secretFinder` | `Secret Finder` | 🔍 | `\u{1F50D}` | `Find your first hidden secret` |
| `goldHoarder` | `Gold Hoarder` | 💰 | `\u{1F4B0}` | `Accumulate 500 gold` |
| `stormChaser` | `Storm Chaser` | ⛈️ | `⛈️` | `Fight through 5 thunderstorms` |
| `bountyHunter` | `Bounty Hunter` | 📜 | `\u{1F4DC}` | `Complete all 3 bounties in one session` |
| `citadelConqueror` | `Citadel Conqueror` | 🏯 | `\u{1F3EF}` | `Clear the Shadow Citadel` |
| `comboMaster` | `Combo Master` | ⚡ | `⚡` | `Use 3 different combo ultimates` |
| `ngPlusVeteran` | `NG+ Veteran` | 🔄 | `\u{1F504}` | `Complete NG+3 or higher` |
| `legendaryHero` | `Legendary Hero` | ⭐ | `⭐` | `Obtain all 4 legendary items` |
| `eliteSlayer` | `Elite Slayer` | 💀 | `\u{1F480}` | `Defeat 25 elite enemies` |
| `trueFinalBoss` | `True Final Boss` | 👑 | `\u{1F451}` | `Clear Citadel on NG+5` |
| `wellEducated` | `Well-Ed-ucated` | ✈️ | `✈️` | `Complete the Ground-Ed questline` |
| `groundControl` | `Ground Control` | 🌌 | `\u{1F30C}` | `Discover the alien crater` |
| `edsLanding` | `Ed's Landing` | 💫 | `\u{1F4AB}` | `Survive a dungeon with 1 HP` |
| `frequentFlyer` | `Frequent Flyer` | ✈️ | `✈️` | `Witness 10 biplane flyovers` |

**31 achievements.** Four of them are family in-jokes: `Well-Ed-ucated`, `Ed's Landing`, `Ground Control` and `Frequent Flyer`.

---

## 10. Tips, flavor markers, crater flavor, lore

### 10.1 `TIPS` — loading-screen / title tips (L727)

Shown in `#titleTip` on the title screen, one picked at random per title-screen visit (L1362, L350).

| # | Tip (verbatim) |
|---|---|
| 1 | `Tip: If you see a yellow biplane, wave. That's Grandpa Ed.` |
| 2 | `Tip: Grandpa Ed says this kind of rain is 'character-building weather.'` |
| 3 | `Tip: Ed-ible snacks heal more than regular potions. Grandpa knows best.` |
| 4 | `Tip: Don't ask Grandpa Ed about his landing record. Just don't.` |
| 5 | `Tip: Don't let Isabella near the dessert biome. Last time she ate the sand thinking it was sugar.` |
| 6 | `Tip: Collette says the dungeon decor is 'early cave chic.'` |
| 7 | `Tip: Liam always volunteers for the hard missions. That's why he's the tank.` |
| 8 | `Tip: Noah calculated the optimal route. Nobody listened. Noah was right.` |
| 9 | `Tip: The world gets stranger the further you explore.` |
| 10 | `Tip: Some things in this world can't be explained. Yet.` |
| 11 | `Tip: Something fell from the sky. Grandpa Ed seems worried about it.` |
| 12 | `Tip: Gran always said the sky had more in it than stars.` |

> Tip 5's `dessert` is in the source. It is the joke. Do not correct it.

### 10.2 `FLAVOR_MARKERS` (L728)

Discovered by walking within 40 px; announced in `#E8A838` for 3 s with `snd('achieve',0.15)` (L5799). Drawn in-world as a glowing `?` (L5798).

| # | Text (verbatim) | Escape |
|---|---|---|
| 1 | `Someone carved: 'L + N were here'` | — |
| 2 | `A sign reads: 'Collette's Secret Hideout →'` | `→` = `→` |
| 3 | `Scratched into the rock: 'Isabella was here first!!!'` | — |

### 10.3 `CRATER_FLAVOR` (L726)

Announced in `#8850A8` for 3 s when the player lingers at the alien crater, at most once every 30 s (L5942).

| # | Line (verbatim) |
|---|---|
| 1 | `The air here feels... lighter. Like gravity forgot its job.` |
| 2 | `These particles drift upward. That's not how particles work.` |
| 3 | `Whatever made this crater wasn't from around here.` |
| 4 | `The ground is smooth as glass. And warm.` |
| 5 | `You get the feeling something is waiting. Patiently.` |

### 10.4 Hidden lore secrets — `loreTexts` (L675)

One per biome centre; announced in `#a29bfe` for 4 s when a lore secret is found (L9314).

| Biome centre | Text (verbatim) |
|---|---|
| 1 (top-left) | `The forest remembers when the Shadow Queen first stirred...` |
| 2 (top-right) | `Deep in the crystals, an ancient power sleeps...` |
| 3 (centre) | `The desert sands hide the bones of forgotten heroes...` |
| 4 (bottom-left) | `The swamp feeds on the darkness — and grows stronger...` |
| 5 (bottom-right) | `Ice preserves what fire cannot destroy...` |

Secret-find announces: `Buried treasure found!` (L9313), `Hidden cache found!` (L9315), `★ GOLDEN CHEST! ★` (L9316).

### 10.5 Dungeon room lore — `DUNGEON_LAYOUTS` (L6756–6761) and procedural rooms (L7169)

| Dungeon | Rest-room lore (verbatim) | Other lore |
|---|---|---|
| forest | `The roots of the Hollow Grove run deep...` | puzzle room: `Ancient mechanisms block the way.` |
| cave | `Crystal light flickers in the depths...` | — |
| desert | `Sand whispers through the tomb halls...` | — |
| swamp | `Toxic air fills the sunken temple...` | — |
| frozen | `The ice citadel groans with dark magic...` | — |
| volcanic | `Heat radiates from the obsidian walls...` | puzzle room: `Magma channels block the way.` |
| procedural | — | treasure room: `A gleaming chest awaits...`; puzzle room: `Ancient mechanisms block the way.` (L7169, L7193, L7207) |

### 10.6 World events (L5742–5796)

| Event | Announce (verbatim) | Line |
|---|---|---|
| `caravan` | `💰 GOBLIN CARAVAN! Kill them for loot!` (`\u{1F4B0}`) | L5765 |
| `bloodmoon` | `🔴 BLOOD MOON! 2x enemy speed, 3x XP!` (`\u{1F534}`) | L5770 |
| `treasure` | `💰 TREASURE GOBLIN! Catch it!` | L5782 |
| `spring` | `💚 Healing Spring appeared!` (`\u{1F49A}`) | L5788 |
| `earthquake` | `🌋 EARTHQUAKE! Enemies stunned!` (`\u{1F30B}`) | L5794 |
| event end | `Blood Moon fades...` | L6296 |
| event end | `The spring fades...` | L6306 |
| event end | `The Treasure Goblin escaped!` | L6317 |
| event end | `Caravan loot secured!` | L6328 |
| spring label | `Healing Spring` | L6362, L7975 |
| volcanic rift | `The ground trembles... A volcanic rift opens!` | L5720 |
| merchant arrival | `A mysterious merchant has appeared!` | L9309 |
| citadel hint | `Something pulses faintly to the northeast...` | L9265 |
| weather change | `<Weather name>!` / `The weather clears.` | L1611 |

---

## 11. Items, gear, dungeons, biomes, titles

### 11.1 `BIOME_NAMES` (L1548)

| Key | Display name |
|---|---|
| `forest` | `Enchanted Forest` |
| `cave` | `Crystal Caves` |
| `desert` | `Scorching Sands` |
| `swamp` | `Murky Swamp` |
| `frozen` | `Frozen Peaks` |

### 11.2 `DUNGEON_NAMES` and `DUNGEON_DESCS` (L6730–6731)

| Key | Name | Description |
|---|---|---|
| `forest` | `The Hollow Grove` | `Ancient roots twist into a maze of thorns. The Treant awaits.` |
| `cave` | `The Crystal Depths` | `Crystals pulse with eerie light. A colossus guards the heart.` |
| `desert` | `The Buried Tomb` | `Sand-swept corridors hide cursed chambers. The Pharaoh stirs.` |
| `swamp` | `The Sunken Temple` | `Toxic waters flood forgotten halls. The Hydra nests below.` |
| `frozen` | `The Ice Citadel` | `Ice walls echo with dark magic. A lich commands the frost.` |
| `volcanic` | `The Volcanic Rift` | `Magma churns beneath obsidian halls. The Titan waits in fire.` |
| `citadel` | `The Shadow Citadel` | `The ultimate darkness awaits within. Three floors stand between you and the Citadel Warden.` |
| `citadel_f1` | `Shadow Citadel — Floor 1` | *(none)* |
| `citadel_f2` | `Shadow Citadel — Floor 2` | *(none)* |
| `citadel_f3` | `Shadow Citadel — Floor 3` | *(none)* |

### 11.3 `DUNGEON_EQUIPS` — one guaranteed reward per dungeon (L6737)

| Dungeon | Name | Description | Icon |
|---|---|---|---|
| `forest` | `Hearthroot Seed` | `+3 HP regen/s all` | 🌿 |
| `desert` | `Sunstone Crest` | `+12% crit chance` | 👹 |
| `cave` | `Lampstone Core` | `+80 max HP all` | 💎 |
| `swamp` | `Marshlight Vial` | `+15% lifesteal` | ☠️ |
| `frozen` | `Hearthice Crown` | `Attacks slow +1s` | ❄️ |
| `volcanic` | `Emberforge Heart` | `+12% HP, +8% DMG all` | 🌋 |

### 11.4 `LEGENDARY_EQ` — one per hero (L1774–1779)

| Hero | Name | Icon | Icon escape | Description |
|---|---|---|---|---|
| Liam | `Aegis of Dawn` | 🛡️ | `🛡️` | `+30% HP, auto-shield` |
| Noah | `Phantom Blades` | 🗡️ | `🗡️` | `+25% spd, chain 2` |
| Collette | `Staff of Eternity` | 🔮 | `🔮` | `+40% DMG, pierce all` |
| Isabella | `Crown of Storms` | 👑 | `👑` | `+20% AoE, shockwaves` |

### 11.5 `MASTERY_TITLES` (L1780)

`['Novice','Adept','Veteran','Master','Legend','Mythic']` at kill thresholds `[0,100,300,600,1000,2000]` (L1781). Fallback title in `getHeroMastery` is `'Novice'` (L1782).

### 11.6 `EQ_LIST` — legacy equipment drops (L1783–1790)

| Name | Description | Icon | Hero lock |
|---|---|---|---|
| `Flame Blade` | `+40% DMG` | 🗡️ | Liam |
| `Rapid Quiver` | `+45% spd` | 🏹 | Noah |
| `Arcane Focus` | `+55% DMG` | 🔮 | Collette |
| `Tiny Crown` | `+45% DMG` | 👑 | Isabella |
| `Shield Charm` | `+70 HP` | 🛡️ | Liam |
| `Swift Boots` | `+25% speed` | 👟 | any |
| `Vamp Fang` | `Lifesteal` | 🦇 | Liam |
| `Frost Wand` | `AoE slow` | ❄️ | Collette |
| `Phoenix Feather` | `Auto-revive once` | 🪶 | any |
| `Vampire Fang` | `+10% lifesteal` | 🦇 | any |
| `Wind Boots` | `12% dodge chance` | 💨 | any |
| `War Drum` | `+8% team damage` | 🥁 | any |
| `Crystal Orb` | `+15% ult charge rate` | 🔮 | any |
| `Thorns Mail` | `Reflect 10% melee dmg` | 🛡️ | any |

### 11.7 `GEAR_DB` — v27 gear system (L1793–1825)

| Key | Name | Slot | Icon | Tier | Hero lock |
|---|---|---|---|---|---|
| `w_sword` | `Iron Sword` | weapon | ⚔️ | 1 | — |
| `w_dagger` | `Scout Dagger` | weapon | 🗡️ | 1 | — |
| `w_flame` | `Flame Blade` | weapon | 🗡️ | 2 | Liam |
| `w_quiver` | `Rapid Quiver` | weapon | 🏹 | 2 | Noah |
| `w_staff` | `Arcane Focus` | weapon | 🔮 | 3 | Collette |
| `w_hammer` | `War Hammer` | weapon | 🔨 | 2 | Isabella |
| `w_frost` | `Frost Edge` | weapon | ❄️ | 2 | — |
| `w_shadow` | `Shadow Fang` | weapon | 🌑 | 3 | — |
| `w_longbow` | `Longbow` | weapon | 🏹 | 1 | Noah |
| `a_leather` | `Leather Vest` | armor | 🧥 | 1 | — |
| `a_chain` | `Chain Mail` | armor | ⛓️ | 1 | — |
| `a_shield` | `Shield Charm` | armor | 🛡️ | 2 | — |
| `a_plate` | `Battle Plate` | armor | ⛓️ | 3 | — |
| `a_mage` | `Mage Robe` | armor | 🧙 | 2 | — |
| `x_boots` | `Swift Boots` | accessory | 👟 | 1 | — |
| `x_fang` | `Vampire Fang` | accessory | 🦇 | 2 | — |
| `x_orb` | `Crystal Orb` | accessory | 🔮 | 3 | — |
| `x_drum` | `War Drum` | accessory | 🥁 | 2 | — |
| `x_feather` | `Phoenix Feather` | accessory | 🪶 | 3 | — |
| `x_thorns` | `Thorns Mail` | accessory | 🛡️ | 2 | — |
| `leg_liam` | `Aegis of Dawn` | weapon | 🛡️ | 4 | Liam (legendary) |
| `leg_noah` | `Phantom Blades` | weapon | 🗡️ | 4 | Noah (legendary) |
| `leg_collette` | `Staff of Eternity` | weapon | 🔮 | 4 | Collette (legendary) |
| `leg_isabella` | `Crown of Storms` | weapon | 👑 | 4 | Isabella (legendary) |

**Rarity naming** (L1831–1837):

| Rarity | Display name (`RARITY_NAMES`) | Name prefix (`RARITY_PREFIXES`) | Color |
|---|---|---|---|
| `common` | `Common` | *(empty)* | `#B0B0B0` |
| `uncommon` | `Uncommon` | `Fine ` | `#2DB86A` |
| `rare` | `Rare` | `Superior ` | `#4A9ED8` |
| `epic` | `Epic` | `Masterwork ` | `#A862C4` |
| `legendary` | `Legendary` | *(empty)* | `#E8A838` |

Gear pickup / stash strings: `<icon> <RARITY> <name>!` (L2018), `<icon> <name>! <desc>` (L2022), `Stash full! Sell something first.` (L1981), `Sold <name> for N gold` (L1994), `Stash full! Auto-sold <name> (Ng)` (L2015), `Drag here to sell` (L426), `No compatible items for this hero.` / `No items in stash. Kill enemies to find gear!` (L4079).

### 11.8 `MERCHANT_STOCK` (L658–666)

| id | Name | Description | Cost |
|---|---|---|---|
| `elixir` | `Elixir of Power` | `+25% DMG for 60s` | 80 |
| `shield_pot` | `Shield Potion` | `Absorb 50 DMG` | 60 |
| `speed_brew` | `Speed Brew` | `+30% speed for 45s` | 50 |
| `mega_potion` | `Mega Potion` | `Heal all heroes to full` | 100 |
| `xp_tome` | `Tome of Knowledge` | `+200 team XP` | 120 |
| `respec_scroll` | `Scroll of Respec` | `Reset 1 hero skill tree` | 150 |
| `rare_ring` | `Lucky Charm` | `+5% crit for session` | 200 |
| `beacon` | `Rally Beacon` | `Teleport all allies to you` | 40 |

Merchant strings: `🧙 MERCHANT` (L503), `Rare goods from distant lands` (L503), `Merchant` in-world label (L1681), `[SPACE] Trade` (L1682), `<item> activated!` (L1716), `All heroes healed!` (L1717), `+N XP!` (L1718), `Rally!` (L1719), `Lucky Charm equipped!` (L1721), `Merchant sold out!` (L1722).

### 11.9 Hero skins — `HERO_SKINS` (L2146–2163)

| Hero | Skin names (verbatim) |
|---|---|
| Liam | `Classic`, `Golden Knight`, `Shadow Liam`, `Flame Knight` |
| Noah | `Classic`, `Golden Archer`, `Frost Archer`, `Shadow Noah` |
| Collette | `Classic`, `Golden Mage`, `Ice Witch`, `Shadow Collette` |
| Isabella | `Classic`, `Lava Isabella`, `Rainbow Isabella`, `Shadow Isabella` |

Inventory skins panel header: `SKINS` (L4171); locked tooltip suffix ` (Locked)` (L4173).

### 11.10 Skill branches — `SKILL_BRANCHES_V17` (L5386–5423)

All names and descriptions are player-facing (rendered in the skill-tree viewer, L6469+ / L3830+).

| Branch key | Branch name | Hero | Tier 1 | Tier 2 | Capstone A | Capstone B |
|---|---|---|---|---|---|---|
| `fortress` | `Fortress` | Liam | `Iron Skin` — `+30% max HP` | `Reflect` — `15% damage reflected` | `Iron Wall` — `Shield blocks 100% for 3s on ult` | `Thorns Aura` — `Melee attackers take 25% DMG back` |
| `berserker` | `Berserker` | Liam | `Fury` — `+20% DMG` | `Critical Eye` — `+15% crit chance` | `Blood Rage` — `Kills grant +40% speed for 3s` | `Execution` — `Enemies below 20% HP take 2× DMG` |
| `commander` | `Commander` | Liam | `Swift Lead` — `+10% team speed` | `War Cry` — `+15% team attack` | `Rally Banner` — `Ult also heals allies 30% HP` | `Field Marshal` — `+25% XP gain for whole team` |
| `sharpshooter` | `Sharpshooter` | Noah | `Eagle Eye` — `+25% range` | `Pierce` — `Arrows pierce 2 enemies` | `Headshot` — `3× crit damage (not chance)` | `Sniper` — `+50% DMG to distant enemies (>200px)` |
| `volley` | `Volley` | Noah | `Quick Draw` — `+30% attack speed` | `Twin Shot` — `Fire 2 arrows` | `Arrow Storm` — `Ult fires 40 arrows (up from 25)` | `Rapid Fire` — `3-round burst every attack` |
| `trapper` | `Trapper` | Noah | `Slow Arrows` — `Arrows slow enemies 1s` | `Root Shot` — `Every 4th arrow roots 1.5s` | `Snare Field` — `Ult leaves slow zone for 8s` | `Poison Tips` — `Arrows apply DoT (3 DPS for 4s)` |
| `elementalist` | `Elementalist` | Collette | `Arcane Power` — `+30% magic DMG` | `Chain Spell` — `Magic bounces to 1 nearby enemy` | `Arcane Explosion` — `Kills explode for 50% AOE DMG` | `Spell Echo` — `20% chance to double-cast` |
| `enchanter` | `Enchanter` | Collette | `Permafrost` — `+20% slow duration` | `Shatter` — `Frozen enemies take +25% DMG` | `Deep Freeze` — `Ult freezes all enemies 4s (up from 2.5)` | `Ice Armor` — `Slow attackers; take -20% DMG while slowing` |
| `healer` | `Healer` | Collette | `Rejuvenation` — `+2 HP/s all heroes` | `Life Tap` — `Kills heal all heroes 10 HP` | `Sanctuary` — `Ult creates heal zone (25 HP/s, 5s)` | `Spirit Link` — `30% of damage taken split across team` |
| `berserker_i` | `Berserker` | Isabella | `Fury` — `+25% DMG` | `Extended Reach` — `+20% range` | `Rampage` — `Each kill extends ult by 0.5s` | `Blade Dance` — `Whirl attack hits 360° (removes facing)` |
| `guardian` | `Guardian` | Isabella | `Thick Skin` — `+40% max HP` | `Stoneskin` — `-15% damage taken` | `Bodyguard` — `Take 30% of nearest ally damage` | `Unstoppable` — `Cannot be slowed/stunned/knocked back` |
| `chaos` | `Chaos` | Isabella | `Impact` — `Attacks push enemies` | `Tremor` — `+30% knockback force` | `Vortex` — `Ult pulls all enemies to Isabella` | `Shockwave` — `Every 5th hit creates AOE ring (80px)` |

### 11.11 Level-up cards — `generateLevelUpChoices()` (L6425–6459)

Card slot 1 is always the skill point; slot 2 is a random team buff; slot 3 is a random hero specialty.

| Slot | Name (verbatim) | Description (verbatim) | Icon | Rarity |
|---|---|---|---|---|
| 1 | `Skill Point` | `+1 skill point for all heroes` | ⭐ | `uncommon` |
| 2 | `Vitality` | `+25 HP all` | ❤️ | `common` |
| 2 | `Fleet Foot` | `+8% speed all` | 🏃 | `common` |
| 2 | `Sharp Edge` | `+10% DMG all` | ⚔️ | `uncommon` |
| 2 | `Magnet+` | `Bigger loot range` | 🧲 | `common` |
| 2 | `Tough Skin` | `-5% dmg taken all` | 🛡️ | `uncommon` |
| 2 | `Quick Hands` | `+8% atk speed all` | ⚡ | `uncommon` |
| 2 | `Second Wind` | `Auto-revive in 10s (all)` | 🔄 | `rare` (team level ≥ 8, 30 % chance) |
| 2 | `Vampiric` | `+3% lifesteal all` | 🧙 | `rare` (team level ≥ 8, 30 % chance) |
| 3 | `<HERO> Power` | `+20% DMG` | 💪 | `uncommon` |
| 3 | `<HERO> Vitality` | `+50 HP` | 💚 | `common` |
| 3 | `<HERO> Speed` | `+15% speed` | 🌪️ | `uncommon` |
| 3 | `<HERO> Fury` | `+30% DMG, +15% speed` | 🔥 | `epic` (team level ≥ 10, 25 % chance) |

Card badges (L3526–3528): `⭐ SKILL POINT`, `🛡 TEAM BUFF`, `⚔ HERO SPEC`. `ALL HEROES` portrait label (L3549).

### 11.12 `NG_SCALE` labels (L650–657)

`Normal`, `NG+1`, `NG+2`, `NG+3`, `NG+4`, `NG+5 (Max)`.
NG+ start announce: `NG+N — Enemies grow stronger!` (L4258). Victory button: `⚔️ NEW GAME + N` (L4277).

---

## 12. UI strings

### 12.1 Title / loading screen (L311–351)

| String (verbatim) | Element | Line |
|---|---|---|
| `⚔️ The Stewart Squad Adventure` | `<h1>` | L312 |
| `— V27 — GEAR & UI` | version label `#verLabel` | L313 |
| `The world has stories to tell.` | tagline | L314 |
| `Liam` / `Tank`, `Noah` / `DPS`, `Collette` / `Mage`, `Isabella` / `AoE` | hero showcase cards | L316–319 |
| `☀️ Easy` / `⚔️ Normal` / `💀 Hard` | difficulty buttons | L325–327 |
| `🤝 Multiplayer (LAN Co-op)` | dropdown toggle | L332 |
| `📡 HOST GAME` / `🎮 JOIN GAME` / `JOIN` / `CODE` | multiplayer controls | L335–340 |
| `Server URL (LAN default)` | caption under the server field | L344 |
| `START ADVENTURE` | primary button | L348 |
| `⚙️ Settings` | title settings button | L349 |

Feature chips, L322 (all 30, verbatim, in source order):

`🌍 Organic Biomes` · `👹 Mini-Bosses` · `🌙 Day/Night` · `⚡ Ultimates` · `🌳 Skill Trees` · `👑 Shadow Queen` · `🏰 5 Dungeons` · `♾️ Endless Mode` · `🗺️ Procedural Dungeons` · `🧭 Quest Compass` · `🎵 Ambient Music` · `💾 Save System` · `🤝 4P Co-op` · `🌋 Volcanic Raid` · `⚡ Signature Moves` · `🎨 Hero Skins` · `🌧️ Dynamic Weather` · `🧙 Wandering Merchant` · `🔁 New Game+` · `⚡ Combo Ultimates` · `🏯 Shadow Citadel` · `💀 Elite Enemies` · `⭐ Legendary Gear` · `✈️ Grandpa Ed` · `💬 Dialogue System` · `🌌 Alien Crater` · `☄️ Meteor Event` · `👑 Boss Reworks` · `⚔️ Gear System` · `🎒 Drag & Drop`

Version label swap at runtime (L9442–9443): `— V 27 — DEV MODE 🔧` (dev) / `— V 27 — GEAR & UI` (normal).

### 12.2 HUD (L354–377)

| String (verbatim) | Element | Line |
|---|---|---|
| `Liam Lv1` | hero name plate placeholder | L356 |
| `100 / 100` | HP text placeholder | L357 |
| `Lv1 XP` | XP text placeholder | L359 |
| `👥 Siblings: 0/3` | sibling counter | L361, L3692 |
| `Wave 1` | wave counter | L362, L3693 |
| `Normal` | difficulty chip | L363 |
| `☀️` | day/night chip | L364 |
| `XP +50%` | night XP bonus chip | L366 |
| `⬤ 0g` | gold chip (`⬤` at L3703) | L367, L3703 |
| `🔧 DEV` | dev-mode chip | L369 |
| `⚡ ULTIMATE READY — SPACE` | ultimate-ready banner | L374 |
| `⚡ COMBO — Q` | combo-ready banner | L375 |
| `HYBRID` | control-mode chip | L377 |
| `⚡ <sigNm> [E]` / `<sigNm> [E] (Ns)` | signature readout | L3719 |
| `FPS: N \| Peak: Nms`, `E:N P:N Pr:N`, `Load:N% W:N Ad:N.NN` | debug overlay | L9215–9217 |

### 12.3 Overlays (L380–513)

| String (verbatim) | Overlay | Line |
|---|---|---|
| `LEVEL UP!` | level-up | L383, L3482 |
| `Choose an upgrade (click or press 1/2/3)` | level-up subtitle | L384, L3487, L3775 |
| `Host is choosing — click to vote!` | level-up subtitle (multiplayer guest) | L3815 |
| `⚡ Invest All (N)` | skill-tree button | L3860 |
| `SKILL TREES` / `Press T to close` | skill tree | L394–395, L6474–6475 |
| `⚔️ INVENTORY` / `Press I to close • 💰 0` | inventory | L405–406 |
| `EQUIPMENT` / `Press I to close` | canvas equipment view | L6537–6538 |
| `No equipment` | canvas equipment empty state | L6550 |
| `STASH` / `By Slot` / `By Rarity` / `💰 Drag here to sell` | inventory stash | L417–426 |
| `PAUSED` / `Controls` / `Stats` / `💾 Save & Load` / `Press P or ESC to resume` | pause | L440–446 |
| `Press P to resume` | canvas pause | L6599 |
| `🏠 RETURN TO TITLE` / `🏃 RETREAT FROM DUNGEON` / `⚙️ SETTINGS` | pause buttons | L447–448, L4206 |
| `GAME OVER` / `The Stewart Squad has fallen...` / `TRY AGAIN` / `🏠 TITLE` | game over | L456–460 |
| `VICTORY!` / `The Stewart Squad saved the realm!` | victory | L468–469, L6391–6394, L8802 |
| `⚔️ NEW GAME +` / `🌍 KEEP PLAYING` / `♾️ ENDLESS MODE` / `🔄 PLAY AGAIN` / `🏠 TITLE` | victory buttons | L472–476 |
| `BATTLE COMPLETE!` / `CONTINUE ▶` | victory stats | L484, L487 |
| `Per-hero combat breakdown` | victory-stats subtitle for dungeons | L7127 |
| `DMG Dealt` / `Kills` / `DMG Taken` / `Sig Uses` / `Ult Uses` / `Times Down` | victory-stats rows | L4232–4237 |
| `👑 ` prefix on the MVP column | victory stats | L4231 |
| `⚔️ ENTER` / `CANCEL` | dungeon entry | L491 |
| `DUNGEON CLEARED!` → replaced with `<dungeon name> CLEARED!` | dungeon victory | L494, L7128 |
| `The <biome> dungeon has been conquered!` | dungeon victory subtitle | L7128 |
| `XP Earned` / `Rooms` | dungeon victory stats | L7128 |
| `🌍 RETURN TO OVERWORLD` | dungeon victory / failure | L496, L501 |
| `DUNGEON FAILED` / `The Stewart Squad couldn't clear <dungeon>...` / `Partial XP` | dungeon failure | L499, L7130 |
| `DUNGEON RETREAT` / `The Stewart Squad retreated from <dungeon>...` | retreat from pause | L9451 |
| `🧙 MERCHANT` / `Rare goods from distant lands` / `CLOSE` | merchant | L503 |
| `⚔️ BOUNTY BOARD ⚔️` / `Complete bounties for gold & XP` / `⚔️ CLAIM REWARD` / `✓ Claimed` / `CLOSE` | bounty board | L505, L1713 |
| `⚙️ SETTINGS` / `CLOSE` | settings | L507 |
| `⏸ GAME PAUSED` / `Waiting for host to resume...` | guest pause | L513 |
| `📖 BOSS BESTIARY` / `Press B to close` / `★ DEFEATED` / `⚔ ENCOUNTERED` / `???` / `Not yet encountered` | bestiary | L8581–8608 |
| `📜 QUEST JOURNAL` / `Press J to close  •  N/15 completed` | quest journal | L8613–8614 |
| `🟡 ACTIVE` / `✅ READY TO TURN IN` / `🔵 AVAILABLE` / `✔ COMPLETED` | quest journal sections | L8616 |
| `Achievement Unlocked!` | achievement toast caption | L3625 |
| `Waiting for host to start...` | multiplayer guest | L8778 |
| `Loading dungeon...` | dungeon load | L8820 |
| `Press SPACE to skip` | cutscene | L4393 |
| `PLAY AGAIN` / `ENDLESS MODE` | canvas victory buttons | L6417, L6420, L3638 |
| `ENDLESS` / `Wave: N` / `Score: N` / `Best: N` | endless HUD | L6722–6725 |

### 12.4 Controls list — pause menu (L4180) and canvas pause (L6572–6583)

HTML pause menu (L4180):

| Key | Action |
|---|---|
| `WASD / Arrows` | `Move` |
| `Click / Tap` | `Attack` |
| `Space` | `Interact / Accept Quest` |
| `E` | `Signature Ability` |
| `Q` | `Combo Ultimate` |
| `G` | `Quest Compass` |
| `1-4` | `Switch Hero` |
| `T` | `Skill Tree` |
| `I` | `Inventory` |
| `J` | `Quest Journal` |
| `P / ESC` | `Pause` |
| `C` | `Control Mode` |

Canvas pause list (L6574–6582) uses different labels: `WASD / Arrow Keys / Joystick` → `Move`; `1-4 Keys / Tap Portrait` → `Switch hero`; `I` → `Equipment inventory`; `C` → `Toggle control mode (<mode>)`; `Q` → `Toggle quest compass`. Section headers `Controls` (L6571) and `Game Stats` (L6591); stat line `Time: M:SS   Kills: N   Level: N` (L6595), `Difficulty: X   Active Hero: Y` (L6596), `Endless Wave: N   Score: N` (L6597).

### 12.5 Settings (L4290–4299)

| Label (verbatim) | Type |
|---|---|
| `Screen Shake` | on/off |
| `Hit-Stop` | on/off |
| `Particles` | `LOW` / `MED` / `HIGH` |
| `Auto-Aim` | on/off |
| `Tutorial` | on/off |
| `Damage Numbers` | on/off |
| `Minimap` | on/off |
| `World Zoom` | `1.0` / `1.15` / `1.30` |
| `CONTROLS` | section header |
| `Move Up`, `Move Down`, `Move Left`, `Move Right`, `Interact`, `Ultimate`, `Signature`, `Combo Ult`, `Hero 1`, `Hero 2`, `Hero 3`, `Hero 4` | rebindable actions |
| `Reset to Defaults` | button |
| `Press key...` | rebind prompt | (L4304) |
| `ON` / `OFF` | toggle button labels |

### 12.6 Save / load

| String (verbatim) | Trigger | Line |
|---|---|---|
| `Slot N` / `Empty` | Save slot rows | L4196, L4201 |
| `SAVE` / `LOAD` / `DEL` | Save slot buttons | L4197–4199 |
| `Game saved to Slot N!` | Successful save | L1168 |
| `Overworld saved to Slot N (dungeon progress not saved)` | Save while in a dungeon | L1166 |
| `Save failed!` | Save error | L1166 |
| `Save failed! Storage may be full.` | Save error | L1169 |
| `No save in Slot N` | Load empty slot | L1324 |
| `Incompatible save` | Save version mismatch | L1325 |
| `Loaded Slot N` | Successful load | L1326 |
| `Load failed!` | Load error | L1327, L1330 |
| `Resumed auto-save` | Auto-save resumed | L1329 |
| `Slot N deleted` | Slot deleted | L1332 |
| `Auto-saved` | Auto-save | L1335 |
| `Save before returning to title?` | Confirm dialog | L9430, L9454 |
| `Save before returning to title?\n(OK = Save & Quit, Cancel = Quit without saving)` | Confirm dialog | L9454 |
| `Load Slot N? Unsaved progress will be lost.` | Confirm dialog | L9459 |
| `Enter slot number to delete (1, 2, or 3):` | Prompt | L9461 |

### 12.7 Multiplayer

| String (verbatim) | Trigger | Line |
|---|---|---|
| `Could not connect to server` | Connect failure | L1413 |
| `Disconnected from host` | Host lost | L1420 |
| `Connection error` | Socket error | L1423 |
| `Room created: <code>` | Host room open | L1437 |
| `Connected to game!` | Guest joined | L1442 |
| `Player N joined!` | Guest joins | L1444 |
| `Player N spectating dungeon` | Guest joins mid-dungeon | L1449 |
| `Player disconnected` | Guest leaves | L1454 |
| `PN disconnected — 30s to reconnect` | Guest drop | L1456 |
| `PN reconnected!` | Guest returns | L1457 |
| `PN can't take host's hero` | Hero claim rejected | L1475 |
| `PN: hero taken by another player` | Hero claim rejected | L1476 |
| `<HERO> → PN` | Hero assigned | L1479, L1506 |
| `You control <HERO>!` | Guest assignment | L1482 |
| `Block: host is in dungeon` | Guest blocked | L1491 |
| `Game is in a dungeon` | Join rejected | L1496 |
| `No hero available for Player N` | Assignment failure | L1509 |
| `Requesting <HERO>...` | Guest hero request | L944, L1053 |
| `<HERO> is controlled by another player` | Swap blocked | L1069 |
| `<HERO> is controlled by PN` | Swap blocked | L957 |
| `Enter a 4-character room code` | Join validation | L9503 |
| `PN reviving` | Revive indicator | L2443 |
| `P1 <HERO>` / `PN <HERO>` | Player strip | L9178–9180 |

### 12.8 Dungeon & room UI

| String (verbatim) | Trigger | Line |
|---|---|---|
| `Entering <dungeon name>...` | Dungeon entry (guest) | L8909 |
| `Room N/M` | Minimap + HUD | L8089, L8109 |
| `🔑 N` | Key counter | L8088 |
| `🔒 LOCKED` | Doors barred | L8109 |
| `🔒` | Locked door glyph | L7938–7939, L8087 |
| `⚡ ULT` / `⭐ ACT` | Touch buttons | L8105, L8107 |
| `[SPACE] Open` / `[SPACE] Pull` / `[SPACE] Interact` | Object prompts | L8035–8038 |
| `Guardian of <dungeon name>` | Boss cinematic caption | L8097 |
| `Dungeon Key found!` | Key pickup | L7321, L7343 |
| `Treasure! +50 HP all!` | Chest opened | L7322, L7344 |
| `Bars retracted!` | Room cleared | L7327, L7348 |
| `Door unlocked!` | Key used | L7338, L7357 |
| `Wave N/M` | Combat room wave | L7375 |
| `Room cleared!` | Room cleared | L8236 |
| `Combat cleared! Check for bonus...` | Combat room cleared | L8238 |
| `Snared!` | Snare hazard | L8145 |
| `Plate released!` / `Plate deactivated!` / `Puzzle reset!` / `Puzzle solved!` | Pressure-plate puzzle | L8162–8164, L8212–8213 |
| `Dungeon Cleared!` / `Dungeon ended` | Dungeon exit | L8806–8807 |
| `✓ CLEARED` / `Press to Enter` | Dungeon entrance labels | L7056–7057 |

### 12.9 Miscellaneous gameplay announces

| String (verbatim) | Trigger | Line |
|---|---|---|
| `Level N!` | Team level up | L2719 |
| `Shield broken!` | Shield depleted | L2792 |
| `Wave N` / `Wave N — Stay sharp!` | Overworld wave | L9256 |
| `WAVE N - BOSS!` / `Wave N` | Endless mode wave | L6664, L6667 |
| `ENDLESS MODE - Survive!` | Endless mode start | L6636 |
| `+N points!` | Endless wave cleared | L6707 |
| `Compass: ON` / `Compass: OFF` | Compass toggle | L960 |
| `Controls: <mode>` / `Controls: <mode> (tap/click to aim)` | Control-mode toggle | L937, L958 |
| `Music: OFF` / `Music: ON` | Mute toggle | L8540 |
| `Ambush!` | Quest-item ambush | L734 |
| `A mysterious portal appears...` | Shadow Realm portal | L5716 |

### 12.10 Dev console (not player-facing in normal play)

`DEV MODE — All content unlocked!` (L8325), `Room-clear cheat ON 🔧` / `Room-clear cheat OFF` (L964), `DEV: Room cleared!` (L988), `DEV: N parachute crates dropped!` (L995), `DEV: Supply flyover launched!` (L998), `DEV: Biplane incoming!` (L1011), `DEV: Ed already here (quest phase N/4)` (L1012), `DEV: Weather → <name> (N particles)` (L1016), `DEV: Meteor cutscene triggered!` (L1020), `Diagnostic → console (F12)` (L1032), `DEV: Goblin King Phase N` (L9561), `DEV: <BIOME> Boss Phase N` (L9600), `DEV: Cocoon will trigger at 50% — chip boss down!` (L9610), `DEV: Phantom Split phase!` (L9620), `DEV: Treant will plant at 60% — chip down!` (L9630), `No boss room found!` (L9581), `Boss killed!` / `No active boss!` / `Boss HP → N%` (L9534–9541), `All heroes healed!` (L9531), `Team level → N` (L9532), `Start a game first!` (L9524), `Spawned 5 items (all rarities)!` (L9640), `Added N random gear to stash!` (L9646), `Stash cleared!` (L9649), `Added N <rarity> items!` (L9654), `All 4 legendaries added!` (L9660), `<HERO> equipped <item>!` (L9668), `All heroes fully equipped!` (L9684), `Stash FULL (N/N) + 3 drops nearby!` (L9697), `15 gear drops spawned around you!` (L9706), `Save round-trip PASSED! All gear intact.` (L9726), `Save round-trip FAILED: <msg>` (L9727), `All gear unequipped to stash (N items)` (L9737), `<HERO>: base DMG=N → N (check console for full audit)` (L9756), `All heroes unlocked!` (L9772), `+1000 gold` (L9776), `Target not available` (L9875), `Teleported!` (L9877), `God Mode: ON` / `God Mode: OFF` (L9881), console menu labels `🔥 Flame`, `🌑 Shadow`, `🗡 Sword`, `▶ Full Loadout`, `▶ Stash Overflow`, `▶ Drop Frenzy`, `▶ Save Round-trip`, `▶ Strip All Gear` (L9841–9855), `%c[DEV] Console ready — Ctrl+Shift+D to open` (L9898).

---

## 13. Notes, gaps and uncertain strings

### 13.1 Authored canon text that v27 never shows the player

These lines exist in the data tables but no code path reaches them. **They are still family canon and must be ported** — the rebuild should wire them up.

| Content | Location | Why it never fires |
|---|---|---|
| `DIALOGUE.grandpaEd.crash_landing` — all 4 lines | L782–786 | No `openDialogue('grandpaEd','crash_landing',…)` call exists anywhere in the file. The biplane crash (L6138) only announces `Grandpa Ed has crash-landed!`. |
| `HERO_REACTIONS.*.crash_landing` — all 4 lines | L799–802 | Same: the `crash_landing` context is never passed to `getHeroReaction`. |
| `HERO_REACTIONS.*.dungeon_enter` (Liam, Noah, Collette, Isabella) | L799–802 | Context never passed. |
| `HERO_REACTIONS.*.boss_appear` (Liam, Noah, Isabella) | L799–802 | Context never passed. |
| `HERO_REACTIONS.LIAM.sibling` (`Collette get out of our room!`) | L799 | Context never passed. |
| `HERO_REACTIONS.NOAH.swamp_item`, `HERO_REACTIONS.COLLETTE.swamp_item` | L800–801 | Context never passed. |
| `HERO_REACTIONS.COLLETTE.mid_boss`, `HERO_REACTIONS.COLLETTE.victory` | L801 | Context never passed. |
| `HERO_REACTIONS.ISABELLA.snack_reward`, `HERO_REACTIONS.ISABELLA.following_collette` | L802 | Context never passed. |
| Caged voice line at index `4` (`HEY! LET ME OUT!`) | L5235 | There are only 4 heroes (indices 0–3). |

### 13.2 Referenced but missing

| Reference | Where | Problem |
|---|---|---|
| `DIALOGUE.grandpaEd.crater_hint` | L8406 | `openDialogue` is called with this category but **no `crater_hint` key exists** in `DIALOGUE.grandpaEd` (L754–798). `openDialogue` bails out silently (`if(!lines||!lines.length)return;`). **This is a hole in the canon — Ed has no crater-hint dialogue written.** |
| NPC named `Bog Witch` | L8351 (`spawnEscortNPC`), L770 (Ed's dialogue) | No `NPC_DEFS` entry named `Bog Witch`; the swamp NPC is `Mistweaver Fern`. `spawnEscortNPC` returns early, so the `Toxic Harvest` escort quest cannot spawn its frog. The failure message `🐸 Familiar died! Talk to Bog Witch to retry.` (L8463) also names an NPC that does not exist. |
| NPC named `Sand Nomad` | L8354 (`spawnQuestWaypoints`) | No matching `NPC_DEFS` entry (desert NPC is `Dunewalker Sol`); falls back to fixed world coordinates. |
| NPC named `Crystal Sage` | L699 (`forest_2` desc and hint) | Quest text says `Talk to the Crystal Sage and return.` but the quest's `talkTarget` is `'Lamplighter Quartz'`. The player-facing name and the code target disagree. |

### 13.3 Duplicated / inconsistent strings worth flagging on port

- The ability-room announce block is duplicated verbatim at L7329–7332 and L7349–7352 (two code paths). `Isabella breaks the gears!` is announced in `#F0C040` in the first copy and `#E8A838` in the second.
- `Hydra Matriarch` uses `#58B888` (the Treant's green) at L7377 while its bestiary color is `#70C090` (L8547).
- `EQ_LIST` contains both `Vamp Fang` (`Lifesteal`) and `Vampire Fang` (`+10% lifesteal`) — two distinct items with near-identical names (L1783, L1785). `GEAR_DB` keeps only `Vampire Fang`.
- `Flame Blade`, `Rapid Quiver`, `Arcane Focus`, `Shield Charm`, `Swift Boots`, `Crystal Orb`, `War Drum`, `Phoenix Feather`, `Thorns Mail` and `Vampire Fang` exist in **both** `EQ_LIST` (legacy) and `GEAR_DB` (v27) with different stat text.
- `DUNGEON_EQUIPS.desert` (`Sunstone Crest`) uses the icon `👹` — almost certainly a copy-paste slip, but it is what ships.
- `frozen_3` is titled `Ice Citadel` while the dungeon is `The Ice Citadel` and the *other* citadel is `The Shadow Citadel`; keep them distinct on port.

### 13.4 Strings I was unsure were player-facing — listed rather than dropped

- `Event handler error:` (L602) and `updateDungeon error:` (L8255) — console-only error prefixes, but they are string literals in the shipped build.
- `%c[DEV] Console ready — Ctrl+Shift+D to open` (L9898) — console banner, visible only with devtools open.
- The dev-console strings in §12.10 — reachable by any player who finds `Ctrl+Shift+D`, so recorded in full.
- `Empty` (L4201) and `Press key...` (L4304) — one-word UI states, included for completeness.
- `ws://localhost:3000` (L343) — a default field value the player sees and can edit; recorded as UI, not as canon text.
- `Guardian` (L2892) — the fallback mini-boss subtitle when `biomeNm` is absent; never reached by the four defined mini-boss types.
- `BOSS` and `DUNGEON` (L8986) — multiplayer-guest fallbacks for a boss name card whose real name failed to sync.

### 13.5 What I could not locate

- **Enemy display names.** `ETYPES` (L2733–2744) has no `nm` field and no lookup table maps enemy keys to display names anywhere in the file. Sixteen-plus enemy types are never named on screen in v27. The rebuild will have to author these; there is no legacy text to port.
- **A written credits or dedication string.** Nothing of the kind exists in the file.
- **Pet names or pet entities.** None. The only animal is the escort frog, labelled `🐸 Familiar`.
- **Photo-mode / memory-collectible text.** Neither system exists in v27; the Brief §5.5 lists them as targets for the rebuild, not as legacy content.
