# Systems Inventory — Part 1: Core Gameplay Data & Formulas

> **Two parts.** Part 1 (core gameplay data and formulas) starts here; Part 2 (world, structure and meta systems) begins at the heading "SYSTEMS INVENTORY — PART 2: World, Structure & Meta" further down and has its own table of contents.

Every core gameplay system in `docs/legacy/stewart-squad-v27.html` (9,901 lines), with exact line ranges, complete data tables, and formulas copied verbatim from source.
Scope: difficulty, globals, heroes, combo ultimates, XP/leveling, skill trees, enemies, mini-bosses, boss phase system, `BOSS_BLOCKS`, every boss, combat formulas, equipment/gear, loot/gold, NG+, achievements, save schema. World generation, biomes, weather, quests, NPCs, world events, dungeon structure, tutorial/cutscenes, UI overlays, input, main loop, networking and the dev console are Part 2.

## Table of Contents

1. [Difficulty](#1-difficulty)
2. [Global constants and gameplay state](#2-global-constants-and-gameplay-state)
3. [Heroes](#3-heroes)
4. [Hero skins](#4-hero-skins)
5. [Signature abilities](#5-signature-abilities)
6. [Ultimates](#6-ultimates)
7. [Combo ultimates](#7-combo-ultimates)
8. [XP and leveling](#8-xp-and-leveling)
9. [Level-up choices](#9-level-up-choices)
10. [Skill trees](#10-skill-trees)
11. [Enemies](#11-enemies)
12. [Elite modifiers](#12-elite-modifiers)
13. [Enemy AI behaviours](#13-enemy-ai-behaviours)
14. [Spawners and cages](#14-spawners-and-cages)
15. [Mini-bosses](#15-mini-bosses)
16. [Boss phase system and arena effects](#16-boss-phase-system-and-arena-effects)
17. [BOSS_BLOCKS building blocks](#17-boss_blocks-building-blocks)
18. [Boss: Goblin King](#18-boss-goblin-king)
19. [Dungeon bosses](#19-dungeon-bosses)
20. [Boss: Citadel Warden](#20-boss-citadel-warden)
21. [Boss: Shadow Queen](#21-boss-shadow-queen)
22. [Combat formulas](#22-combat-formulas)
23. [Equipment and gear](#23-equipment-and-gear)
24. [Loot, drops and the gold economy](#24-loot-drops-and-the-gold-economy)
25. [Merchant and bounty board](#25-merchant-and-bounty-board)
26. [NG+ and endless scaling](#26-ng-and-endless-scaling)
27. [Achievements](#27-achievements)
28. [Save schema](#28-save-schema)
29. [Oddities, bugs and dead code](#29-oddities-bugs-and-dead-code)

---

## 1. Difficulty

**Lines 522–536.** Three levels, selected on the title screen by `.diff-btn` elements carrying `data-diff`.

```js
let difficulty=1; // 0=easy,1=normal,2=hard
const DIFF_NAMES=['Easy','Normal','Hard'];
```

There is no difficulty table — the modifiers are scattered as inline conditionals. Complete list, verified by grep:

| Effect | Easy (0) | Normal (1) | Hard (2) | Line |
|---|---|---|---|---|
| Hero `maxHp` at construction | `x1.5` (hp refilled) | — | — | 2184–2185 |
| Hero `maxHp` in `recalcHeroStats` | `x1.5` | — | — | 1919 |
| Damage taken by heroes | `x0.75` | — | `x1.25` | 2356–2357 |
| Enemy hp / dmg / spd | — | — | `hp x1.5`, `dmg x1.25`, `spd x1.25` | 2746 |
| Spawner wave scale factor | `x0.8` | `x1` | `x1.2` | 2854 |
| Elite roll modifier | `x0.5` | `x1` | `x1.4` | 2760 |
| MiniBoss hp / dmg | — | — | `hp x1.5`, `dmg x1.25` | 2880 |
| Goblin King hp / dmg | — | — | `hp x1.5`, `dmg x1.25` | 3129 |
| DungeonBoss hp | — | — | `hp x1.5` | 7377 |
| Shadow Queen hp / dmg | — | — | `hp x1.5`, `dmg x1.25` | 5539 |
| Wave timer | `x1.3` (slower) | `x1` | `x0.8` (faster) | 9253 |

Enemy speed is only multiplied on Hard; heroes get no speed change from difficulty.

### 1.1 Adaptive difficulty (v24)

**Line 5381 (state), 9257–9264 (update).** A hidden second difficulty dial that reacts to how often heroes go down.

```js
var _adaptDiff={downs:0,kills:0,ratio:1.0,lastCheck:0};
```

Checked every second wave inside the wave tick:

```js
if(waveNum%2===0){
  var _ak=gameStats.kills-_adaptDiff.kills;_adaptDiff.kills=gameStats.kills;
  var _dr=_adaptDiff.downs/Math.max(1,waveNum);
  // High death rate → ease enemies; low death rate → tighten
  if(_dr>0.5)_adaptDiff.ratio=Math.max(0.8,_adaptDiff.ratio-0.03);
  else if(_dr<0.1&&_ak>10)_adaptDiff.ratio=Math.min(1.15,_adaptDiff.ratio+0.02);
}
```

Downs per wave above 0.5 eases enemies by 3 % per check (floor 0.80); below 0.1 with 10+ kills tightens by 2 % (ceiling 1.15). `_adaptDiff.ratio` multiplies spawner-spawned enemy HP and damage (line 2854); `_adaptDiff.downs` increments whenever a hero enters the downed state (line 2381).

---

## 2. Global constants and gameplay state

**Lines 579–620.**

```js
const PI=Math.PI,TAU=PI*2;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,mn,mx)=>Math.max(mn,Math.min(mx,v));
const dst=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ang=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
```

| Constant | Value | Line | Meaning |
|---|---|---|---|
| `WW`, `WH` | `3200, 3200` | 587 | Overworld size in pixels (square). |
| `WORLD_ZOOM` | `1.30` default | 589 | Canvas scale around screen centre; settable via `settings.worldZoom`. |
| `MAX_PARTICLES` | `250` | 618 | Particle array hard cap. |
| `MAX_WEATHER` | `80` | 618 | Weather particle cap. |
| `MAX_PROJS` | `150` | 618 | Projectile cap. |
| `MAX_ARENA_EFFECTS` | `8` | 5020 | Concurrent boss telegraph/effect cap. |
| `DAY_CYCLE` | `240` | 857 | Seconds per full day/night cycle. |
| `DNG_TW`, `DNG_COLS`, `DNG_ROWS` | `40, 16, 12` | 6745 | Dungeon tile size and room grid → dungeon arena 640x480 px. |
| `STASH_MAX` | `20` | 1903 | Shared party stash slots. |
| `NG_MAX` | `5` | 648 | Maximum NG+ level. |
| `SAVE_VERSION` | `10` | 1123 | Save schema version. |

Camera and zoom helpers (587–592):

```js
let cam={x:0,y:0},shk={t:0,i:0,maxT:0},gt=0,gameOver=false,gameWon=false,paused=false;
function beginWorldZoom(){ctx.save();ctx.translate(W/2,H/2);ctx.scale(WORLD_ZOOM,WORLD_ZOOM);ctx.translate(-W/2,-H/2);}
function unzoomScreenPoint(sx,sy){return{x:(sx-W/2)/WORLD_ZOOM+W/2,y:(sy-H/2)/WORLD_ZOOM+H/2};}
```

Settings that change gameplay feel (line 594):

```js
var settings={screenShake:true,hitStop:true,particleDensity:'high',autoAim:true,showTutorial:true,showDmgNumbers:true,showMinimap:true,worldZoom:'1.30'};
function getParticleMul(){return settings.particleDensity==='low'?0.3:settings.particleDensity==='med'?0.6:1.0;}
```

Screen shake and hit-stop (lines 612–613) are the only two game-feel primitives:

```js
function screenShake(intensity,duration){if(!settings.screenShake)return;shk.i=Math.min(shk.i+intensity,25);shk.t=Math.max(shk.t,duration);shk.maxT=shk.t;}
function hitStop(duration){if(!settings.hitStop)return;window._hitStop=Math.max(window._hitStop,duration);}
```

Shake intensity accumulates but clamps at 25; duration takes the max of current and requested and decays linearly (`_sd=shk.t/shk.maxT`, applied as `cam.x+=rnd(-_si,_si)` at line 9273).

Other gameplay state (615–624, 5369–5383):

```js
let sibs=0;                                  // siblings rescued (0-3)
let totalXP=0,teamLv=1,xpNext=30;            // team-wide level
let waveNum=0,waveTimer=3,bossUp=false,bossDefeated=false,boss=null;
let magnetStacks=0;                          // Magnet+ pickup-range stacks
let activeHero=0;                            // player-controlled hero index
let controlMode='hybrid';                    // 'classic' | 'hybrid'
let endlessMode=false,endlessWave=0,endlessScore=0;
let inShadowRealm=false,shadowQueen=null,shadowQueenDefeated=false;
let gameStats={kills:0,dmgDealt:0,equipCollected:0,miniBossesKilled:0,startTime:0};
var gold=0; var ngPlus=0,NG_MAX=5,ngPlusUnlocked=false;
```

Day/night multipliers that touch combat (855–878):

```js
function isNight(){var dp=getDayPhase();return dp.phase==='night';}
function nightXPMul(){return isNight()?1.5:1;}
function nightEnemySpeedMul(){return isNight()?1.15:1;}
```

Night is `p` in `[0.45, 0.75)` of the 240 s cycle — 72 seconds of every four minutes — during which XP is x1.5 and enemy speed x1.15.

---

## 3. Heroes

**`HDEFS` — line 2139.** Four entries; array index is the hero's permanent identity (`h.idx`, assigned at 8283–8284).

| Field | LIAM (0) | NOAH (1) | COLLETTE (2) | ISABELLA (3) |
|---|---|---|---|---|
| `nm` | `LIAM` | `NOAH` | `COLLETTE` | `ISABELLA` |
| `col` | `#4A9ED8` | `#2DB86A` | `#A862C4` | `#F0C040` |
| `dk` (shade) | `#2E78A8` | `#1E8A4E` | `#844CA0` | `#C89E28` |
| `wc` (weapon colour) | `#bdc3c7` | `#7A4018` | `#E8A838` | `#D84830` |
| `spd` | `180` | `175` | `165` | `160` |
| `hp` / `maxHp` | `250` | `140` | `120` | `180` |
| `rng` | `48` | `230` | `260` | `58` |
| `dmg` | `32` | `16` | `22` | `28` |
| `cd` (attack cooldown, s) | `.35` | `.28` | `.6` | `.4` |
| `aType` | `melee` | `arrow` | `magic` | `whirl` |
| `ultCD` (s) | `25` | `22` | `28` | `20` |
| `hair` | `#8B6914` | `#5B3A1A` | `#6B3A2A` | `#D4A03C` |
| `cape` | `#2B6A94` | `#1E7A44` | `#9648B0` | `#D88030` |
| `sigCd` (s) | `6` | `4` | `8` | `5` |
| `sigNm` | `Shield Bash` | `Dodge Roll` | `Arcane Blink` | `Ground Pound` |
| `sigKey` | `bash` | `roll` | `blink` | `pound` |

Damage-number colours (line 3641): `var HERO_DMG_COLS=['#4A9ED8','#2DB86A','#A862C4','#D88030'];` — enemy damage `#D84830` (`HERO_ENM_DMG`), healing `#3DCC7A` (`HERO_HEAL_COL`).

> **Canon note.** The Brief describes Noah as orange and Isabella as pink/red. In v27 Noah's `col` is green `#2DB86A` and Isabella's is gold `#F0C040` (with a red weapon `#D84830` and orange cape `#D88030`). Per the archaeologist rule "the file is the truth", these are the shipped values; the colour identity is a Brief/HTML disagreement to resolve in the rebuild.

### 3.1 Hero construction and runtime fields

**Line 2166.** `Hero(d,x,y)` copies every `HDEFS` field then adds runtime state. All skill/gear stat fields start undefined and are created on demand; the exhaustive list is in the save schema (§28).

```js
this.ultTimer=this.ultCD;this.ultOn=false;this.ultDur=0;this.shieldOn=false;
this.lifesteal=0;this.slow=0;this.regen=0;
this.downed=false;this.reviveTimer=0;this.reviveX=0;this.reviveY=0;
this.equips=[];                                     // legacy EQ_LIST items
this.gear={weapon:null,armor:null,accessory:null};   // v27 3-slot gear
this.wVis='default';                                 // weapon visual override
this.sigCd=d.sigCd||0;this.sigMax=d.sigCd||0;this.sigTimer=0;this.sigActive=false;this.sigState=0;
this.skin='default';
this.stats={dmgDealt:0,kills:0,healDone:0,sigUses:0,ultUses:0,timesDown:0,dmgTaken:0};
if(difficulty===0)this.maxHp=Math.floor(this.maxHp*1.5);
if(difficulty===0)this.hp=this.maxHp;
```

Only hero 0 (Liam) starts unlocked; heroes 1–3 are locked in cages (§14).

### 3.2 Downed and revive

**Lines 2172–2211, 2375–2410.** Heroes never die permanently unless all four are down.

- HP reaching 0 sets `downed=true`, `reviveTimer=20`, stores `reviveX/reviveY`, increments `_adaptDiff.downs` and `stats.timesDown`.
- Countdown runs at `dt*_rvSpeed`; `_rvSpeed=3` when another live hero is within 60 px **and** `NET.playerCount>1`, otherwise 1. Solo play is therefore always a flat 20 s.
- `this.reviveProg=1-this.reviveTimer/20` drives the HUD ring.
- On revive: `hp=Math.floor(maxHp*0.4)`, teleport back to `reviveX/reviveY`, `snd('revive',0.35)`, 20-particle burst, `screenShake(4,.15)`.
- If the downed hero was `activeHero`, control switches to the nearest alive, unlocked, non-guest-controlled hero and the camera snaps to it.
- Game over only when no hero satisfies `unlocked && !dead && !downed && !banished`: `showDungeonFail()` inside a dungeon, `gameOver=true` outside.
- `autoRevive` (Phoenix Feather, Second Wind) intercepts first: decrements the counter, restores `hp=Math.floor(maxHp*0.5)` and skips the downed state entirely.

### 3.3 Companion AI

**Lines 2250–2274.** Non-active, non-guest heroes run this every frame.

- **Tether:** distance to leader `>400` → teleport to `leader +/- 50 px` at a random angle. Suppressed for 3 s after a cage rescue (`_rescueGrace`).
- **Target acquisition:** nearest of `enemies`/`dungeonEnemies`, `miniBosses`, `boss`, `dungeonBoss`, `shadowQueen`.
- **Threat range:** `300` ranged (`aType==='arrow'||'magic'`), `200` melee. Engages only if `nearED<threatRange && distanceToLeader<300`.
- **Ranged kiting:** `idealDist=this.rng*0.7`. Below `idealDist*0.4` back away at full speed; above `idealDist*1.3` close at `spd*0.8`; otherwise strafe `Math.sin(gt*2+idx)*0.4` at `spd*0.3`.
- **Melee:** close at `spd*1.15` while `nearED>rng*1.1`, else damp velocity `x0.85`.
- **Follow:** formation distance `fd=45+idx*10`; approach speed `spd*(d>150?1.6:d>80?1.2:1)`.
- Companions and guest-controlled heroes auto-attack whenever a target is within `this.rng` and `atkT<=0`. The active hero also auto-attacks unless `controlMode==='manual'`.

### 3.4 Facing

```js
if(controlMode==='classic'){ /* face the mouse in world space */ this.face=ang(this,mw); }
else { // hybrid: face movement, or the forced attack angle
  if(this.forceAtkAngle!==undefined&&this.forceAtk){this.face=this.forceAtkAngle;}
  else if(Math.abs(this.vx)>5||Math.abs(this.vy)>5){this.face=Math.atan2(this.vy,this.vx);}
}
```

Non-active heroes always face their nearest target (`if(idx>0&&near)this.face=ang(this,near);`).

### 3.5 Movement speed modifiers

```js
var s=this.spd;
if(!inDungeon){var bsm=getBiomeBuff('spdMul');if(bsm>1)s*=bsm;if(weather.type==='snow')s*=0.85;}
s*=getBuffMul(this,'spd');
if(this.state==='attacking'&&this.aType==='melee')s*=.3;
this.vx=lerp(this.vx,inp.x*s,6*dt);
```

Melee heroes move at 30 % speed during their 200 ms attack state; snow costs 15 % speed. Acceleration is a `lerp` at rate 6/s for the player, 3–5/s for AI.

Collision: heroes are pushed out of obstacles at radius `o.r+12` (flowers, mushrooms, crystals and ice spikes are non-blocking), clamped to `[20, WW-20]`, and pushed out of the alien crater bowl at `ALIEN_CRATER.radius+35` with velocity damped to 0.3.

---

## 4. Hero skins

**`HERO_SKINS` — line 2146.** Four skins per hero, keyed by hero index. Each skin overrides `col`, `dk` and `cape` only; stats are untouched.

| Hero | id | Name | col | dk | cape | Unlock token |
|---|---|---|---|---|---|---|
| Liam | `default` | Classic | `#4A9ED8` | `#2E78A8` | `#2B6A94` | `default` |
| Liam | `golden` | Golden Knight | `#f1c40f` | `#C89E28` | `#b7950b` | `ach_allDungeons` |
| Liam | `shadow` | Shadow Liam | `#2c3e50` | `#1a252f` | `#17202a` | `ach_shadowQueen` |
| Liam | `fire` | Flame Knight | `#e74c3c` | `#A83828` | `#a93226` | `ach_magmaTitan` |
| Noah | `default` | Classic | `#2DB86A` | `#1E8A4E` | `#1E7A44` | `default` |
| Noah | `golden` | Golden Archer | `#f1c40f` | `#C89E28` | `#b7950b` | `kills_500` |
| Noah | `frost` | Frost Archer | `#6B8EC8` | `#4a86c8` | `#3d6ea1` | `ach_frozenDungeon` |
| Noah | `shadow` | Shadow Noah | `#2c3e50` | `#1a252f` | `#17202a` | `ach_shadowQueen` |
| Collette | `default` | Classic | `#A862C4` | `#844CA0` | `#9648B0` | `default` |
| Collette | `golden` | Golden Mage | `#f1c40f` | `#C89E28` | `#b7950b` | `ach_allQuests` |
| Collette | `ice` | Ice Witch | `#94C4DC` | `#6ca0c0` | `#5090b0` | `ach_frozenDungeon` |
| Collette | `shadow` | Shadow Collette | `#2c3e50` | `#1a252f` | `#17202a` | `ach_shadowQueen` |
| Isabella | `default` | Classic | `#F0C040` | `#C89E28` | `#D88030` | `default` |
| Isabella | `fire` | Lava Isabella | `#e74c3c` | `#A83828` | `#a93226` | `ach_magmaTitan` |
| Isabella | `rainbow` | Rainbow Isabella | `#e84393` | `#c23277` | `#fd79a8` | `kills_1000` |
| Isabella | `shadow` | Shadow Isabella | `#2c3e50` | `#1a252f` | `#17202a` | `ach_shadowQueen` |

Unlock resolution (`isSkinUnlocked`, line 2164):

| Token | Condition |
|---|---|
| `default` | always true |
| `ach_allDungeons` | `['forest','cave','desert','swamp','frozen'].every(b => dungeonProgress[b]===true)` |
| `ach_shadowQueen` | `shadowQueenDefeated` |
| `ach_magmaTitan` | `titanHeartObtained` |
| `ach_frozenDungeon` | `dungeonProgress.frozen===true` |
| `ach_allQuests` | 15 or more quests with `questLog[q].status==='complete'` |
| `kills_500` | `gameStats.kills>=500` |
| `kills_1000` | `gameStats.kills>=1000` |

`getHeroSkin(idx,skinId)` (line 2163) falls back to the first (default) skin when the id is unknown.

---

## 5. Signature abilities

**Activation: line 2667.** One per hero, on its own cooldown, no resource cost.

```js
function activateSignature(h){if(!h||h.dead||h.downed||h.sigTimer>0||h.sigActive)return;
  h.sigTimer=h.sigMax;h.sigActive=true;h.sigState=0;if(h.stats)h.stats.sigUses++;
  snd('ult',0.25);updateBountyProgress('sig',1);}
```

Bound to `keyBinds.signature` = `['e']` (line 973). `sigTimer` ticks down with `dt` every frame in `Hero.update`. Execution runs in `Hero.update` while `sigActive` (lines 2218–2241).

### 5.1 LIAM — Shield Bash (`bash`, 6 s)

```js
this.sigState+=dt*4;var _bD=60*Math.min(this.sigState,1);
this.x+=Math.cos(this.face)*_bD*dt*4;this.y+=Math.sin(this.face)*_bD*dt*4;
this._sigImmune=this.sigState<0.5;
this._rollTrail.push({x:this.x,y:this.y,a:0.5,col:'#4A9ED8'});
// every enemy within 40 px:
_be.takeDmg(Math.floor(this.dmg*0.5),this);
_be.stunT=Math.max(_be.stunT||0,1.5);
var _bka=ang(this,_be);_be.vx+=Math.cos(_bka)*400;_be.vy+=Math.sin(_bka)*400;
if(this.sigState>=1){this.sigActive=false;this._sigImmune=false;hitFx(this.x,this.y,'#4A9ED8');snd('boom',0.2);}
```

Duration 0.25 s (`sigState` advances at 4/s to 1). Dash contact radius 40 px, damage 50 % of `dmg`, stun 1.5 s, knockback impulse 400. **I-frames for the first half** (`sigState<0.5`, i.e. 0.125 s). Blue afterimage trail.

### 5.2 NOAH — Dodge Roll (`roll`, 4 s)

```js
this.sigState+=dt*2.5;var _ra=this.face;
this.x+=Math.cos(_ra)*200*dt;this.y+=Math.sin(_ra)*200*dt;
this._sigImmune=true;this._iframeFlash=(this._iframeFlash||0)+dt;
this._rollTrail.push({x:this.x,y:this.y,a:0.6,col:'#2DB86A'});
if(this.sigState>=1){this.sigActive=false;this._sigImmune=false;this._iframeFlash=0;}
```

Duration 0.4 s (rate 2.5/s), roll speed 200 px/s → 80 px travelled. **Fully invulnerable for the whole roll.** No damage.

### 5.3 COLLETTE — Arcane Blink (`blink`, 8 s)

Instantaneous, single frame. Blink distance `_blD=120` px along `face`, clamped to world/dungeon bounds; in a dungeon the destination tile is tested against the room template and the blink is reverted if it lands in a wall (`_tmpl[_tr*DNG_COLS+_tc]===1`).

```js
this.x+=Math.cos(this.face)*_blD;this.y+=Math.sin(this.face)*_blD;
// after arrival, every enemy within 40 px:
_ble.takeDmg(Math.floor(this.dmg*0.75),this);
this._blinkLine={x1:_bx0,y1:_by0,x2:this.x,y2:this.y,t:0};
hitFx(this.x,this.y,'#A862C4');snd('magic',0.2);this.sigActive=false;
```

8 departure particles `#A862C4`, 8 arrival particles `#e84393`, and a `_blinkLine` streak that lives 0.3 s. No i-frames.

### 5.4 ISABELLA — Ground Pound (`pound`, 5 s)

```js
this.sigState+=dt*6;
if(this.sigState>=0.15&&!this._sigLanded){this._sigLanded=true;screenShake(4,0.15);snd('boom',0.3);
  this._poundRing={t:0};
  // every enemy within 60 px:
  _pe.takeDmg(Math.floor(this.dmg*0.8),this);_pe.slowT=1.5;_pe._bounceT=0.2;
}
if(this.sigState>=0.4){this.sigActive=false;this._sigLanded=false;}
```

Impact at `sigState 0.15` (25 ms after start, rate 6/s), total duration ~67 ms. AoE radius 60 px, 80 % of `dmg`, 1.5 s slow, and a 0.2 s bounce animation on hit enemies. Orange expanding ring VFX (`_poundRing`, drawn to radius 60 over 0.15 s).

---

## 6. Ultimates

**`actUlt(h)` — line 2669.** Triggered by `trigUlt()` (line 2665) from `keyBinds.ultimate` = `['r','0']`, or from `interact` (space) when no other interaction is in range.

```js
function trigUlt(){var h=heroes[activeHero];if(!h||!h.unlocked||h.dead||h.downed||h.ultTimer>0)return;actUlt(h);}
function actUlt(h){h.ultTimer=h.ultMax;h.ultOn=true;h.ultDur=3;snd('ult',.4);trigAch('ultPower');
```

`ultTimer` recharges in `Hero.update` at `dt*(this.ultChargeRate||1)` — gear/skills that grant `ultCharge` multiply that rate. `ultOn` lasts 3 s by default (Liam overrides it with `shieldDur`).

### 6.1 LIAM — Excalibur Strike

```js
h.shieldOn=true;h.ultDur=h.shieldDur||4;announce('⚡ EXCALIBUR STRIKE!','#4A9ED8');
h._ultVfx={type:'excalibur',t:0};screenShake(10,0.5);hitStop(0.1);
// Rally Banner capstone:
if(h.rallyHeal>0){ /* every unlocked living hero: hp += Math.floor(maxHp*h.rallyHeal) */ }
// damage:
if(dst(h,_le)<200) _le.takeDmg(Math.floor(h.dmg*1.5),h);
if(boss&&!boss.dead&&dst(h,boss)<200) boss.takeDmg(Math.floor(h.dmg*2),h);
```

Radius 200 px, 1.5x `dmg` to enemies and 2x to the overworld boss; grants `shieldOn` (blocks all damage, §22) for `shieldDur||4` seconds; `screenShake(10,0.5)` + `hitStop(0.1)`. 30 cross-axis particles.
VFX (`drawUltVfx`, 0.9 s total): 0–0.5 s expanding blue telegraph circle to r=60 plus a rising sword glow; 0.5–0.9 s a white cross shockwave, arm length `200*min(1,p*2)`, width `30*(1-p*0.5)`.

### 6.2 NOAH — Arrow Storm

```js
announce('⚡ ARROW STORM!','#2DB86A');h._ultVfx={type:'storm',t:0};screenShake(5,0.3);
var arrowCount=h.ultCount||24;
for(var i=0;i<arrowCount;i++){ setTimeout(function(){
  var tx=h.x+rnd(-200,200),ty=h.y+rnd(-200,200);
  projs.push(new Proj(tx,ty-300,PI/2,500,{dmg:h.dmg*2,sz:3,col:'#E8A838',life:1}));
},i*50); }
```

24 arrows by default (40 with the Arrow Storm capstone `ultCount:40`), one every 50 ms, each spawned 300 px above a random point in a 400x400 box around Noah, falling at 500 px/s for `2x dmg`.
Snare Field capstone: if `h.snareField>0`, a `snare_zone` of radius 200 lives for `snareField` seconds; inside a dungeon it is pushed to `dungeonObjects`, outside it runs on a 100 ms `setInterval` applying `slowT=max(slowT,0.3)` to enemies and mini-bosses in range.
VFX: golden glow radius `30+sin(t*10)*5` fading over 1.5 s.

### 6.3 COLLETTE — Arcane Nova

```js
announce('⚡ ARCANE NOVA!','#A862C4');h._ultVfx={type:'nova',t:0};hitStop(0.15);
var freezeDur=h.ultFreeze||2.5;var targets=[].concat(enemies,miniBosses);
if(dst(h,e)<180){e.slowT=freezeDur+1.5;e.stunT=freezeDur;e.takeDmg(h.dmg,h);
  var _pa=ang(h,e);e.vx+=Math.cos(_pa)*200;e.vy+=Math.sin(_pa)*200;}
if(boss&&!boss.dead&&dst(h,boss)<180){boss.slowT=freezeDur;boss.takeDmg(h.dmg*2,h);}
```

Radius 180 px. Stun for `ultFreeze||2.5` s (Deep Freeze capstone raises it to 4), slow for stun+1.5 s, 1x `dmg` (2x to the boss, which is slowed but not stunned), knockback 200.
Sanctuary capstone: `Math.floor(h.sanctuary*10)` ticks at 100 ms each, healing every hero within 150 px for 25 HP — with `sanctuary:5` that is 50 ticks over 5 s.
VFX: three staggered rings (start 0/0.2/0.4 s; max radii 180/140/100; colours `#A862C4`, `#e84393`, `#C49BF0`; line widths 4/3/2) plus a shrinking black centre void for the first 0.5 s. Total 1.2 s.

### 6.4 ISABELLA — Meteor Drop

```js
announce('⚡ METEOR DROP!','#E8A838');
h._ultVfx={type:'meteor',t:0,tx:h.x,ty:h.y,impacted:false,cracks:_cracks};
screenShake(15,.6);snd('boom',.5);
if(h.vortex>0){ /* every enemy: vx += cos(ang(e,h))*600, vy += sin(...)*600 when dist>30 */ }
if(dst(h,e2)<160){e2.takeDmg(h.dmg*3,h);var ka=ang(h,e2);e2.vx+=Math.cos(ka)*400;e2.vy+=Math.sin(ka)*400;}
if(boss&&!boss.dead&&dst(h,boss)<160)boss.takeDmg(h.dmg*2,h);
```

Radius 160 px, **3x `dmg`** (the highest single-target ult multiplier; only 2x on the boss), knockback 400, `screenShake(15,.6)`.
Vortex capstone pulls every enemy toward Isabella with impulse 600 first.
VFX (2.8 s): 0–0.8 s a growing squashed shadow at the impact point (radius `10+30*(t/0.8)`); at 0.8 s a second `screenShake(15,0.6)`, `hitStop(0.15)` and `snd('boom',0.5)` from `updateUltVfx`; 0.8–1.1 s an expanding gold ring to r=160; 0.8–2.8 s six ground cracks fading out (each `rnd(60,100)` px long at a random angle).

### 6.5 Ult VFX lifetimes (`updateUltVfx`, line 2548)

| Type | Lifetime | Mid-flight event |
|---|---|---|
| `excalibur` | 0.9 s | — |
| `storm` | 1.5 s | — |
| `nova` | 1.2 s | — |
| `meteor` | 2.8 s | at `t>=0.8`: `screenShake(15,0.6)`, `hitStop(0.15)`, `snd('boom',0.5)` |

---

## 7. Combo ultimates

**`COMBO_ULTS` — line 2628.** Six pairings from four heroes. Bound to `keyBinds.comboUlt` = `['q']` (line 959).

| Pair | Name | `dmg` multiplier | `radius` | `col` | Extra |
|---|---|---|---|---|---|
| `[0,1]` Liam+Noah | Shield Crash | `3.0` | `120` | `#4A9ED8` | — |
| `[0,2]` Liam+Collette | Arcane Fortress | `2.5` | `100` | `#A862C4` | — |
| `[0,3]` Liam+Isabella | Earthquake Slam | `3.5` | `150` | `#D88030` | — |
| `[1,2]` Noah+Collette | Shadow Barrage | `2.0` | `0` | `#3DCC7A` | `projCount:16` |
| `[1,3]` Noah+Isabella | Blade Storm | `2.5` | `100` | `#E8A838` | — |
| `[2,3]` Collette+Isabella | Supernova | `4.0` | `180` | `#e84393` | — |

### 7.1 Trigger conditions (`getComboUlt`, line 2636)

```js
var ah=heroes[activeHero];if(!ah||ah.dead||ah.downed||ah.ultTimer>0)return null;
for(var ci=0;ci<COMBO_ULTS.length;ci++){var c=COMBO_ULTS[ci];
  var pi=c.pair[0]===activeHero?c.pair[1]:c.pair[1]===activeHero?c.pair[0]:-1;
  if(pi<0)continue;var p=heroes[pi];if(!p||!p.unlocked||p.dead||p.downed||p.ultTimer>0)continue;
  if(dst(ah,p)>100)continue;return{def:c,partner:pi};}
return null;
```

Both heroes must be alive, unlocked, off cooldown, and **within 100 px of each other**; the active hero must be one of the pair. The first matching pair in table order wins.

### 7.2 Effect (`trigComboUlt`, line 2642)

```js
ah.ultTimer=ah.ultMax;p.ultTimer=p.ultMax;
screenShake(15,0.6);snd('boom',0.5);
announce('⚡ '+c.nm+'! ⚡',c.col,3);
var baseDmg=Math.floor((ah.dmg+p.dmg)*c.dmg);
var cx20=(ah.x+p.x)/2,cy20=(ah.y+p.y)/2;
```

Damage is `(both heroes' dmg summed) x multiplier`, centred on the midpoint between the pair. Both ultimates go on full cooldown.

- **Radial variants** (`c.radius>0`) hit every enemy, `dungeonBoss`, overworld `boss` and `shadowQueen` inside `c.radius`.
- **Shadow Barrage** (`projCount:16`) fires 16 friendly projectiles evenly around the circle at 150 px/s, each doing `Math.floor(baseDmg/16)`, size 5, life 2 s.
- 25 particles at `rnd(100,300)` speed, colours `[c.col,'#fff','#E8A838']`.
- Tracking: `gameStats.comboUltsUsed++`, and unique pair ids accumulate in `gameStats.uniqueCombos`; three distinct pairs trigger the `comboMaster` achievement.

Damage worked example at base stats: Earthquake Slam = `floor((32+28)*3.5)` = **210** in a 150 px circle; Supernova = `floor((22+28)*4.0)` = **200** in 180 px.

---

## 8. XP and leveling

**`addXP(n)` — line 2700.** Team-wide XP; there is no per-hero XP.

```js
n=Math.floor(n*((NG_SCALE[ngPlus]||NG_SCALE[0]).xpMul));
if(bloodMoonActive)n=Math.floor(n*3); else n=Math.floor(n*nightXPMul());
if(questRewards.xpMul>1)n=Math.floor(n*questRewards.xpMul);
// Commander capstone (first hero found with xpBonus>0 only):
for(var _xbi=0;_xbi<4;_xbi++){if(heroes[_xbi]&&heroes[_xbi].xpBonus>0){n=Math.floor(n*(1+heroes[_xbi].xpBonus));break;}}
totalXP+=n;var need=30+teamLv*15;
while(totalXP>=need){totalXP-=need;teamLv++;updateBountyProgress('lvlup',1);
  showLvl=true;paused=true;snd('levelup',.4);
  lvlChoices=generateLevelUpChoices();
  for(var i=0;i<heroes.length;i++)if(heroes[i].unlocked){heroes[i].lv=teamLv;heroes[i].maxHp+=5;heroes[i].hp=Math.min(heroes[i].hp+20,heroes[i].maxHp);}
  var ah=heroes[activeHero];if(ah&&ah.unlocked)levelUpBurst(ah);
  showLevelUpHTML();levelUpFlash=1;
  need=30+teamLv*15;}
xpNext=30+teamLv*15;
```

**XP curve.** The cost of the next level is `need = 30 + teamLv*15`, and the accumulator is *decremented* by that cost rather than compared to a cumulative total — a linear curve, not exponential.

| Team level | XP to next | Cumulative XP |
|---|---|---|
| 1 → 2 | 45 | 45 |
| 2 → 3 | 60 | 105 |
| 3 → 4 | 75 | 180 |
| 5 → 6 | 105 | 405 |
| 10 → 11 | 180 | 1,230 |
| 20 → 21 | 330 | 4,005 |

`xpNext` is initialised to `30` at line 616 but overwritten to `30+teamLv*15` = 45 on the first XP gain.

**Per-level effects.** Every unlocked hero gains `+5 maxHp` and heals 20 (capped at max); `lv` is synced to `teamLv`. XP multipliers stack multiplicatively in the order shown: NG+, then blood moon (x3, replacing the night bonus) or night (x1.5), then quest reward multiplier, then the first Commander `xpBonus` found (`+25 %`).

**Level-up resolution** (`selUp`, line 2718):

```js
function selUp(i){if(i>=lvlChoices.length)return;lvlChoices[i].fn();showLvl=false;paused=false;lvlChoices=[];NET._guestVotes={};
  announce('Level '+teamLv+'!','#E8A838',2);hideLevelUpHTML();
  if(teamLv>=3)for(var _si=0;_si<4;_si++)if(skillTrees[_si])skillTrees[_si].points++;
  if(teamLv%5===0)setTimeout(autoSave,500);}
```

From team level 3 onward every level-up also grants **+1 skill point to all four heroes**, independent of which card was chosen; every fifth level auto-saves.

**XP sources:** enemy kill `e.xp` (5–20, §11), spawner destroyed `25`, mini-boss `60`, Goblin King `150`, dungeon clear `dungeonXPGained` (accumulates `+100` on dungeon boss kill; 30 % awarded on a failed run), lore secret `25`, bounty `xpR` (50–200), Tome of Knowledge `200`.

---

## 9. Level-up choices

**`generateLevelUpChoices()` — line 6425.** Always exactly three cards: a skill point, a team buff, a hero specialty.

**Card 1 — Skill Point** (fixed, `rarity:'uncommon'`, icon `⭐`, colour `#E8A838`):

```js
fn:function(){for(var i=0;i<4;i++)if(skillTrees[i])skillTrees[i].points++;applySkillEffects();}
```

**Card 2 — Team Buff**, one picked at random from this pool (colour `#4A9ED8`):

| Name | Description | Icon | Rarity | Effect |
|---|---|---|---|---|
| Vitality | +25 HP all | ❤️ | common | `maxHp+=25; hp+=25` for every unlocked hero |
| Fleet Foot | +8% speed all | 🏃 | common | `spd*=1.08` |
| Sharp Edge | +10% DMG all | ⚔️ | uncommon | `dmg=Math.floor(dmg*1.1)` |
| Magnet+ | Bigger loot range | 🧲 | common | `magnetStacks++` |
| Tough Skin | -5% dmg taken all | 🛡️ | uncommon | `dmgReduction+=0.05` |
| Quick Hands | +8% atk speed all | ⚡ | uncommon | `cd*=0.92` |
| Second Wind | Auto-revive in 10s (all) | 🔄 | rare | `autoRevive=Math.max(autoRevive,1)` — only added when `teamLv>=8 && Math.random()<0.3` |
| Vampiric | +3% lifesteal all | 🧙 | rare | `lifesteal+=0.03` — same gate |

**Card 3 — Hero Specialty**, targeting a random living unlocked hero (`specHero`), card colour = that hero's `col`:

| Name | Description | Icon | Rarity | Effect |
|---|---|---|---|---|
| `<hero> Power` | +20% DMG | 💪 | uncommon | `dmg=Math.floor(dmg*1.2)` |
| `<hero> Vitality` | +50 HP | 💚 | common | `maxHp+=50; hp+=50` |
| `<hero> Speed` | +15% speed | 🌪️ | uncommon | `spd*=1.15` |
| `<hero> Fury` | +30% DMG, +15% speed | 🔥 | epic | `dmg*=1.3; spd*=1.15` — only added when `teamLv>=10 && Math.random()<0.25` |

Note: `Magnet+` raises loot magnet range to `160+magnetStacks*96` for potions and `110+magnetStacks*66` for equipment (lines 1765, 2007).

---

## 10. Skill trees

**`SKILL_BRANCHES_V17` — line 5386.** Twelve branches, three per hero. Each branch has two investable tiers and a mutually exclusive capstone fork (`capA`/`capB`). `var SKILL_BRANCHES=SKILL_BRANCHES_V17;` at line 5525 is a compatibility alias.

**`HERO_BRANCHES` — line 5425:**

```js
var HERO_BRANCHES={0:['fortress','berserker','commander'],1:['sharpshooter','volley','trapper'],2:['elementalist','enchanter','healer'],3:['berserker_i','guardian','chaos']};
```

### 10.1 Full branch table

| Branch | Hero | Colour | Tier 1 | Tier 2 | Capstone A | Capstone B |
|---|---|---|---|---|---|---|
| `fortress` "Fortress" | 0 Liam | `#4A9ED8` | **Iron Skin** +30% max HP (`maxHp` mul 1.3) | **Reflect** 15% damage reflected (`reflect` 0.15) | **Iron Wall** Shield blocks 100% for 3s on ult (`shieldDur` 3) | **Thorns Aura** Melee attackers take 25% DMG back (`thorns` 0.25) |
| `berserker` "Berserker" | 0 Liam | `#D84830` | **Fury** +20% DMG (`dmg` mul 1.2) | **Critical Eye** +15% crit chance (`crit` 0.15) | **Blood Rage** Kills grant +40% speed for 3s (`bloodRage` 3) | **Execution** Enemies below 20% HP take 2x DMG (`execute` 0.2) |
| `commander` "Commander" | 0 Liam | `#E8A838` | **Swift Lead** +10% team speed (`teamSpd` mul 1.1) | **War Cry** +15% team attack (`teamAtk` mul 1.15) | **Rally Banner** Ult also heals allies 30% HP (`rallyHeal` 0.3) | **Field Marshal** +25% XP gain for whole team (`xpBonus` 0.25) |
| `sharpshooter` "Sharpshooter" | 1 Noah | `#2DB86A` | **Eagle Eye** +25% range (`rng` mul 1.25) | **Pierce** Arrows pierce 2 enemies (`pierce` 2) | **Headshot** 3x crit damage (`critMul` 3) | **Sniper** +50% DMG to enemies >200px (`distBonus` 0.5) |
| `volley` "Volley" | 1 Noah | `#D88030` | **Quick Draw** +30% attack speed (`cd` mul 0.7) | **Twin Shot** Fire 2 arrows (`multishot` 2) | **Arrow Storm** Ult fires 40 arrows (`ultCount` 40) | **Rapid Fire** 3-round burst every attack (`burst` 3) |
| `trapper` "Trapper" | 1 Noah | `#3DCC7A` | **Slow Arrows** Arrows slow 1s (`arrowSlow` 1) | **Root Shot** Every 4th arrow roots 1.5s (`rootEvery` 4) | **Snare Field** Ult leaves slow zone 8s (`snareField` 8) | **Poison Tips** Arrows apply DoT 3 DPS for 4s (`poisonDot` 3) |
| `elementalist` "Elementalist" | 2 Collette | `#A862C4` | **Arcane Power** +30% magic DMG (`dmg` mul 1.3) | **Chain Spell** Magic bounces to 1 enemy (`chain` 1) | **Arcane Explosion** Kills explode for 50% AOE (`deathExplode` 0.5) | **Spell Echo** 20% chance to double-cast (`echo` 0.2) |
| `enchanter` "Enchanter" | 2 Collette | `#6B8EC8` | **Permafrost** +20% slow duration (`slowDur` mul 1.2) | **Shatter** Frozen enemies take +25% DMG (`frozenDmg` 0.25) | **Deep Freeze** Ult freezes all 4s (`ultFreeze` 4) | **Ice Armor** Slow attackers; -20% DMG while slowing (`iceArmor` 0.2) |
| `healer` "Healer" | 2 Collette | `#3DCC7A` | **Rejuvenation** +2 HP/s all heroes (`teamRegen` 2) | **Life Tap** Kills heal all heroes 10 HP (`killHeal` 10) | **Sanctuary** Ult creates heal zone 25 HP/s for 5s (`sanctuary` 5) | **Spirit Link** 30% of damage taken split across team (`spiritLink` 0.3) |
| `berserker_i` "Berserker" | 3 Isabella | `#D84830` | **Fury** +25% DMG (`dmg` mul 1.25) | **Extended Reach** +20% range (`rng` mul 1.2) | **Rampage** Each kill extends ult by 0.5s (`ultExtend` 0.5) | **Blade Dance** Whirl hits 360° (`fullWhirl` 1) |
| `guardian` "Guardian" | 3 Isabella | `#4A9ED8` | **Thick Skin** +40% max HP (`maxHp` mul 1.4) | **Stoneskin** -15% damage taken (`dmgReduction` 0.15) | **Bodyguard** Take 30% of nearest ally damage (`bodyguard` 0.3) | **Unstoppable** Cannot be slowed/stunned/knocked back (`immune` 1) |
| `chaos` "Chaos" | 3 Isabella | `#E8A838` | **Impact** Attacks push enemies (`knockback` 1) | **Tremor** +30% knockback force (`kbForce` mul 1.3) | **Vortex** Ult pulls all enemies to Isabella (`vortex` 1) | **Shockwave** Every 5th hit creates AOE ring 80px (`shockwave` 5) |

### 10.2 Structure and points

```js
function initSkillTrees(){
  skillTrees={};
  for(var hi=0;hi<4;hi++){skillTrees[hi]={branches:[],points:0};
    for(var bi=0;bi<3;bi++){skillTrees[hi].branches.push({key:HERO_BRANCHES[hi][bi],tier:0,capstone:'a'});}}
}
```

`tier` is `0` (nothing), `1` (T1 taken), `2` (T2 taken, capstone selectable), `3` (capstone taken). Points are **per hero** (`skillTrees[hi].points`) but are always granted to all four heroes simultaneously — from the Skill Point level-up card, from every level-up at `teamLv>=3`, and `+1` per hero on every dungeon clear (line 7114). Maximum meaningful spend is 9 points per hero (3 branches x T1+T2+capstone).

### 10.3 How nodes modify stats

**`investSkill(hi,bi)` — line 5436.** Effects are applied *incrementally and immediately*; there is no recompute-from-scratch pass (`applySkillEffects()` at line 5487 is an empty stub).

```js
var eff=bdef.tiers[br.tier];var h=heroes[hi];if(!h)return;
if(eff.stat==='teamSpd'){for(var _ti=0;_ti<4;_ti++)if(heroes[_ti]&&heroes[_ti].unlocked)heroes[_ti].spd=Math.floor(heroes[_ti].spd*eff.mul);}
else if(eff.stat==='teamAtk'){for(var _ti=0;_ti<4;_ti++)if(heroes[_ti]&&heroes[_ti].unlocked)heroes[_ti].dmg=Math.floor(heroes[_ti].dmg*eff.mul);}
else if(eff.mul)h[eff.stat]=Math.floor(h[eff.stat]*eff.mul);
else h[eff.stat]=(h[eff.stat]||0)+eff.val;
if(eff.stat==='maxHp'){h.hp=Math.min(h.hp+Math.floor(h.maxHp*0.2),h.maxHp);}
br.tier++;st.points--;snd('equip',0.3);showSkillTreeHTML();
```

Rules: `mul` nodes multiply the current stat and floor it; `val` nodes add to the current value (creating the field if absent); `teamSpd`/`teamAtk` apply to every unlocked hero instead of just the owner; a `maxHp` node also heals 20 % of the new maximum.

**`chooseCapstone(hi,bi,cap)` — line 5478.** Requires `br.tier===2` and a spare point; applies `capA` or `capB` the same way, then sets `br.tier=3; br.capstone=cap`. The fork is permanent short of a respec.

**`investAllSkills(hi)` — line 5450.** Round-robins T1/T2 across the three branches until points run out (safety counter 100). It deliberately **skips capstones**, leaving the fork to the player.

**Respec.** The only respec is the merchant's Scroll of Respec (150 gold, line 1720):

```js
var st=skillTrees[activeHero];if(st){var refund=0;
  for(var b=0;b<st.branches.length;b++){refund+=st.branches[b].tier;st.branches[b].tier=0;st.branches[b].capstone='a';}
  st.points+=refund;announce(heroes[activeHero].nm+' skills reset! +'+refund+' points','#A862C4',3);}
```

It refunds the sum of tiers as points and resets branches — but **it does not undo the stat changes**, because stats were mutated in place with no baseline. Respeccing therefore grants free permanent stats (see §29).

**Runtime skill hooks** (lines 5493–5522):

```js
function onKillEffects(src,enemy){ /* bloodRage, killHeal, deathExplode, ultExtend, gold, elite loot, bounty progress */ }
function applySkillDmgMods(d,src,tgt){
  if(src.execute>0&&tgt&&tgt.hp!==undefined&&tgt.maxHp>0&&(tgt.hp/tgt.maxHp)<src.execute)d=Math.floor(d*2);
  if(src.distBonus>0&&tgt&&dst(src,tgt)>200)d=Math.floor(d*(1+src.distBonus));
  return d;
}
```

`bloodRage` stores `_brSpd` and multiplies `spd*=1.4` for `bloodRage` seconds, restored by the `_brTimer` decay in `Hero.update`. `deathExplode` deals `Math.floor(h.dmg*h.deathExplode)` to everything within 80 px of the corpse. `critMul` is read inline in `Hero.attack`, not here.

---

## 11. Enemies

**`ETYPES` — line 2733.** Seventeen types (the Brief says sixteen; the file has seventeen). Fields: `hp`, `spd` (px/s), `dmg`, `sz` (radius, also the hit radius), `col`/`dk` (body/shade), `rng` (attack/approach range), `cd` (attack cooldown s), `xp`, `deathStyle`, plus optional behaviour flags.

| Type | hp | spd | dmg | sz | col | dk | rng | cd | xp | deathStyle | Flags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `goblin` | 22 | 85 | 8 | 10 | `#A83828` | `#922b21` | 30 | 1 | 5 | shatter | — |
| `orc` | 65 | 55 | 15 | 14 | `#6c3483` | `#4a235a` | 35 | 1.2 | 12 | dissolve | — |
| `troll` | 110 | 42 | 22 | 18 | `#2c3e50` | `#1a252f` | 40 | 1.5 | 20 | collapse | — |
| `archer` | 25 | 70 | 10 | 10 | `#B06020` | `#a04000` | 200 | 1.8 | 8 | shatter | `ranged:true` |
| `bat` | 15 | 120 | 6 | 8 | `#4a235a` | `#2c1336` | 25 | .8 | 6 | shatter | `flying:true` |
| `shielded` | 80 | 50 | 12 | 13 | `#5d6d7e` | `#3d4f5f` | 32 | 1.3 | 15 | dissolve | `shieldHp:40` |
| `slime` | 40 | 60 | 10 | 11 | `#38A866` | `#1a9c54` | 28 | 0.9 | 7 | dissolve | — |
| `skeleton` | 35 | 75 | 14 | 11 | `#ecf0f1` | `#bdc3c7` | 34 | 1.1 | 9 | shatter | — |
| `mushroom` | 55 | 45 | 18 | 12 | `#e84393` | `#b83280` | 30 | 1.4 | 11 | dissolve | — |
| `fire_elemental` | 75 | 65 | 20 | 13 | `#D84830` | `#A83828` | 35 | 1.1 | 14 | dissolve | `ranged:true` |
| `lava_slime` | 50 | 55 | 14 | 12 | `#ff6348` | `#A83828` | 28 | 0.9 | 10 | shatter | `split:true` |
| `ember_sprite` | 30 | 110 | 10 | 8 | `#D88030` | `#B06820` | 25 | 0.7 | 8 | shatter | `flying:true` |
| `obsidian_guard` | 120 | 35 | 25 | 16 | `#2c3e50` | `#1a252f` | 40 | 1.6 | 18 | dissolve | `armor:0.3` |
| `wraith` | 30 | 90 | 15 | 9 | `#9B59B6` | `#6C3483` | 35 | 1.0 | 12 | glow_burst | `blink:true` |
| `brute` | 90 | 50 | 28 | 16 | `#8B4513` | `#5C2D0A` | 45 | 2.0 | 16 | collapse | `charge:true` |
| `healer` | 35 | 65 | 6 | 10 | `#2ECC71` | `#1A9C54` | 180 | 2.5 | 14 | dissolve | `ranged:true`, `heals:true` |
| `bomber` | 20 | 100 | 12 | 9 | `#E74C3C` | `#A83828` | 20 | 0.8 | 10 | shatter | `explode:true` |

### 11.1 Construction and scaling order (`Enemy`, line 2745)

```js
var s=ETYPES[this.type]||ETYPES.goblin;  // all base stats copied
this.atkT=rnd(0,this.cd);                 // desynchronised first attack
if(difficulty===2){this.hp=Math.floor(this.hp*1.5);this.maxHp=this.hp;this.dmg=Math.floor(this.dmg*1.25);this.spd*=1.25;}
this._blink=s.blink||false;this._blinkT=rnd(3,6);
this._charge=s.charge||false;this._chargeT=rnd(2,4);
this._heals=s.heals||false;this._healT=rnd(2,4);
this._explode=s.explode||false;
var ngS=NG_SCALE[ngPlus]||NG_SCALE[0];
if(ngS.enemyHp!==1){this.hp=Math.floor(this.hp*ngS.enemyHp);this.maxHp=this.hp;this.dmg=Math.floor(this.dmg*ngS.enemyDmg);this.spd=this.spd*ngS.enemySpd;}
```

Order: base → Hard difficulty → NG+ → elite roll. Spawner-spawned enemies then get a further wave scale (§14).

### 11.2 Death styles

`deathStyle` selects the dissolve animation in `Enemy.draw` (line 2812), running over `deathA` which advances at `dt*4` (so ~250 ms):

| Style | Behaviour |
|---|---|
| `shatter` | Immediate burst of `ceil(8*getParticleMul())` particles at `rnd(80,220)` speed, gravity 150; body vanishes. |
| `dissolve` | Body clipped bottom-up as `deathA` rises, alpha fades, occasional upward `-60` vy motes. |
| `collapse` | Vertical squash `scY=max(0,1-deathA*1.5)` from the feet; at `scY<0.1` bursts `ceil(10*getParticleMul())` particles with halved vertical speed. |
| `glow_burst` | Scales up `1+deathA*2`, alpha `da*da`, flashes white for the first 20 %; at `deathA>0.15` emits 12 evenly-spaced particles in the elite colour. Used by `wraith` and by **every elite** (`this.deathStyle='glow_burst'` on elite roll). |

---

## 12. Elite modifiers

**`ELITE_MODS` — line 2725.** One modifier is rolled per enemy at construction.

| id | Name | Ring colour | Effect function |
|---|---|---|---|
| `swift` | Swift | `#00cec9` | `e.spd*=1.4` |
| `armored` | Armored | `#636e72` | `e.hp=Math.floor(e.hp*2); e.maxHp=e.hp; e.spd*=0.8` |
| `vampiric` | Vampiric | `#d63031` | `e._vampiric=true` — heals `floor(dealtDamage*0.3)` on every melee hit |
| `splitting` | Splitting | `#6c5ce7` | `e.split=true` — spawns two half-HP, `sz-3`, half-damage copies on death |
| `shielded` | Shielded | `#F0C878` | `e._shield=Math.floor(e.maxHp*0.5)` — absorbs damage before HP |
| `berserker` | Berserker | `#e17055` | `e._berserk=true` — below 30 % HP, `_berserkActive` doubles outgoing damage |

**Roll formula (line 2757–2762):**

```js
var eliteBase=ngPlus>0?0.12+ngPlus*0.04:(teamLv>=5?0.03:0);
var eliteWaveBonus=Math.min(0.15,waveNum*0.008);
var eliteDiffMod=difficulty===0?0.5:difficulty===2?1.4:1;
var eliteChance=Math.min(0.5,(eliteBase+eliteWaveBonus)*eliteDiffMod);
if(!this.miniBoss&&!this.boss&&Math.random()<eliteChance){this._elite=pick(ELITE_MODS);this._elite.fx(this);
  this.nm=this._elite.nm+' '+this.type;this.deathStyle='glow_burst';this._eliteCol=this._elite.col;}
```

No elites at all before team level 5 on a first playthrough; from NG+1 the base is 16 % and climbs 4 % per NG level; wave count adds up to +15 %; capped at 50 %. Elites render a pulsing coloured ring at `sz+5` with their name above.

Elites give double gold, a 40 % chance of an extra tier-2 gear drop, and count toward `gameStats.eliteKills` (25 → `eliteSlayer`).

---

## 13. Enemy AI behaviours

**`Enemy.prototype.update` — line 2764.** Order of operations each frame:

1. **Dying/dead:** `deathA+=dt*4`, removed when `deathA>=1`.
2. **Timer decay:** `flashT`, `atkT`, `slowT`, `stunT`, `_bounceT`; `bobT+=dt*6`; `marked` decays.
3. **Poison DoT** (`_dotT`): accumulates `_dotDmg*dt` and applies whole points as damage, with a green `#2D8C56` damage number; kills award XP normally.
4. **Stun gate:** `if(this.stunT>0)return true;` — a stunned enemy does nothing at all.
5. **Special behaviours** (below).
6. **Target:** nearest unlocked, alive, non-downed hero.
7. **Speed modifiers:** `nightSpd=nightEnemySpeedMul()` (x1.15 at night); rain or storm outside a dungeon multiplies by 0.9; blood moon multiplies by 1.25 and sets `_bmDmgMul=1.5`.
8. **Movement/attack** (below).
9. **Berserk check:** `if(this._berserk&&this.hp<this.maxHp*0.3)this._berserkActive=true;`
10. **Separation:** any other enemy closer than `this.sz+e.sz+4` pushes this one away at `100*dt`.
11. **Integrate** position, clamp to `[10, WW-10]`.

### 13.1 Melee behaviour

```js
if(nd>this.rng){this.vx=lerp(this.vx,Math.cos(a)*spd,4*dt);this.vy=lerp(this.vy,Math.sin(a)*spd,4*dt);}
else{this.vx*=.9;this.vy*=.9;
  if(this.atkT<=0){var _eDmg=Math.floor(this.dmg*_bmDmgMul);
    if(this._berserkActive)_eDmg=Math.floor(_eDmg*2);
    near.takeDmg(_eDmg,this);
    if(this._vampiric&&_eDmg>0){this.hp=Math.min(this.hp+Math.floor(_eDmg*0.3),this.maxHp);}
    this.atkT=this.cd;
    if(near.iceArmor>0){this.slowT=Math.max(this.slowT||0,2);}
    if(near.reflect&&near.reflect>0){var rfl=Math.floor(this.dmg*near.reflect); /* damages attacker; can kill */ }
  }}
```

Melee enemies do not need line of sight or facing; contact inside `rng` is enough. `spd` is `this.spd*(this.slowT>0?.4:1)*nightSpd` — slow is a flat 60 % reduction.

### 13.2 Ranged behaviour (`archer`, `fire_elemental`, `healer`)

```js
if(nd<120){ /* back away at full speed */ }
else if(nd>this.rng-20){ /* close in */ }
else{this.vx*=.95;this.vy*=.95;}
if(nd<this.rng&&this.atkT<=0){
  projs.push(new Proj(this.x,this.y,ang(this,near),200,{dmg:this.dmg,sz:3,col:'#D84830',life:2,friendly:false}));
  this.atkT=this.cd;}
```

Hard minimum standoff of 120 px, preferred band `120 .. rng-20`, projectile speed 200 px/s, life 2 s.

### 13.3 Flying (`bat`, `ember_sprite`)

`flying:true` changes rendering only (animated wing triangles at `Math.sin(bobT*2)*.5`); flying enemies use the same ground movement and are not exempt from obstacles or separation.

### 13.4 Shielded (`shielded`, and the `shielded` elite mod)

Two independent absorb pools, both consumed before HP in `takeDmg`:

```js
if(this._shield>0){var absorbed=Math.min(amt,this._shield);this._shield-=absorbed;amt-=absorbed;
  if(this._shield<=0)announce('Shield broken!','#F0C878',1);
  if(amt<=0){this.flashT=0.1;dmgN(this.x,this.y,absorbed,'#F0C878',false);return absorbed;}}
if(this.shieldHp>0){var shAbsorbed=Math.min(amt,this.shieldHp);this.shieldHp-=shAbsorbed;amt-=shAbsorbed;
  dmgN(this.x,this.y,shAbsorbed,'#6B8EC8');hitFx(this.x,this.y,'#6B8EC8');this.flashT=.1;if(amt<=0)return shAbsorbed;}
```

`shieldHp` (base type, 40) draws a blue arc at `sz+6`; `_shield` (elite, 50 % of max HP) is invisible except for the damage numbers.

### 13.5 Wraith blink (`_blink`, line 2770)

```js
this._blinkT-=dt;
if(this._blinkT<=0){this._blinkT=rnd(3,5);
  /* nearest hero within 300 px */
  var _ba=ang(this,_bh)+PI;
  /* 6 departure particles #9B59B6 */
  this.x=_bh.x+Math.cos(_ba)*30;this.y=_bh.y+Math.sin(_ba)*30;
  /* 4 arrival particles #D580FF */ }
```

First blink at `rnd(3,6)` s, then every `rnd(3,5)` s. Teleports 30 px **behind** the nearest hero within 300 px. Draws a flickering ghost ring (`alpha 0.5+sin(gt*8)*0.3`) at `sz+3`.

### 13.6 Brute charge (`_charge`, line 2772)

```js
if(this._charging){this._chargeDur-=dt;
  this.vx=Math.cos(this._chargeDir)*this.spd*4;this.vy=Math.sin(this._chargeDir)*this.spd*4;
  if(this._chargeDur<=0){this._charging=false;this._chargeT=rnd(3,5);screenShake(3,0.1); /* 6 dirt particles */ }}
else{this._chargeT-=dt;
  if(this._chargeT<=0){ /* nearest hero within 250 px */
    if(_ch){this._charging=true;this._chargeDir=ang(this,_ch);this._chargeDur=0.4;this.flashT=0.2;}}}
```

Charge windup is signalled only by `flashT=0.2`; the charge lasts 0.4 s at **4x speed** (200 px/s for a brute) in a fixed direction, then a `rnd(3,5)` s cooldown. Damage is dealt by the ordinary melee contact check, not by the charge itself. Renders horns and an orange ring while charging.

### 13.7 Healer (`_heals`, line 2774)

```js
this._healT-=dt;
if(this._healT<=0){this._healT=rnd(2.5,4);
  /* first ally with hp < maxHp*0.7 within 120 px */
  var _hAmt=Math.floor(_he.maxHp*0.2);_he.hp=Math.min(_he.hp+_hAmt,_he.maxHp);
  dmgN(_he.x,_he.y-15,'+'+_hAmt,'#2ECC71',false); /* 4 rising green particles */ break; }
```

Heals exactly one ally per cycle for 20 % of that ally's max HP, every 2.5–4 s, range 120 px. Draws a white cross and a pulsing green ring. It is also `ranged:true`, so it kites at 180 px and fires weak (6 dmg) projectiles.

### 13.8 Bomber (`_explode`, in `takeDmg`, line 2799)

```js
if(this._explode){screenShake(4,0.1);snd('boom',0.2);
  for(...heroes...){if(dst(this,_ehh)<60)_ehh.takeDmg(Math.floor(this.dmg*1.5),this);}
  /* 10 particles #E74C3C/#F39C12/#fff */ }
```

Death explosion: 60 px radius, 1.5x its damage (18 base). Renders a fuse with sparking particles.

### 13.9 Splitting (`split`, `lava_slime` and the splitting elite)

```js
if(this.split&&!this.splitDone){var splitList=inDungeon?dungeonEnemies:enemies;
  for(var sp14=0;sp14<2;sp14++){var se=new Enemy(this.x+rnd(-15,15),this.y+rnd(-15,15),this.type);
    se.hp=Math.floor(this.maxHp/2);se.maxHp=se.hp;se.sz=Math.max(5,this.sz-3);se.dmg=Math.floor(this.dmg/2);
    se.splitDone=true;splitList.push(se);}}
```

Two children at half max HP, half damage, `sz-3` (floor 5), one generation only.

### 13.10 Aggro, armor and marks

- **Aggro** is purely proximity based: every enemy always targets the *nearest* valid hero every frame; there is no threat table, no leash, and no de-aggro.
- **Armor** (`obsidian_guard`, `armor:0.3`): `amt=Math.max(1,Math.floor(amt*(1-armorFrac)))` where `armorFrac=this.armor>=1?this.armor/100:this.armor` — 30 % flat reduction, minimum 1.
- **Hunter's Mark** (`marked>0`, co-op ability): `amt=Math.floor(amt*1.5)` and a green crosshair ring at `sz+8`.
- **Arcane Link:** if the attacker is Collette (`src.idx===2`) with an active co-op link, `src.coopTarget` heals `Math.floor(amt*0.25)`.

---

## 14. Spawners and cages

### 14.1 Spawners (lines 2540/2849–2858)

```js
function Spawner(x,y){this.x=x;this.y=y;this.hp=130;this.maxHp=130;this.dead=false;this.spT=2;this.spI=3;this.maxE=6;this.cnt=0;this.flashT=0;}
```

| Field | Value | Meaning |
|---|---|---|
| `hp`/`maxHp` | `130` | Destructible camp. |
| `spT` | `2` | Seconds until first spawn. |
| `spI` | `3` | Seconds between spawns. |
| `maxE` | `6` | Live-spawn budget; `cnt` reduced by 3 on every wave tick. |

Six spawners are placed at fixed fractions of the world at `initGame` (line 8293): `(.18,.18) (.82,.18) (.15,.72) (.85,.75) (.5,.12) (.5,.88)`, each jittered by `rnd(-50,50)`.

Type pool by biome, and the weighted pick:

```js
var types=b==='cave'?['goblin','bat','shielded','wraith']
        :b==='desert'?['goblin','archer','orc','brute']
        :b==='swamp'?['goblin','bat','troll','healer']
        :b==='frozen'?['goblin','shielded','archer','bomber']
        :['goblin','orc','troll'];
var tp=Math.random()<.5?types[0]:(Math.random()<.5?types[1]:(Math.random()<.7?types[2]:(types[3]||types[0])));
```

Effective weights: 50 % slot 0, 25 % slot 1, 17.5 % slot 2, 7.5 % slot 3.

**Wave scaling applied to spawner output (line 2854):**

```js
var scale=(1+waveNum*0.04)*(1+Math.log2(Math.max(1,waveNum))*0.03)*(difficulty===0?0.8:difficulty===2?1.2:1)*_adaptDiff.ratio;
e.hp=Math.floor(e.hp*scale);e.maxHp=e.hp;e.dmg=Math.floor(e.dmg*scale);
```

Linear 4 % per wave plus a logarithmic 3 % term, then difficulty, then the adaptive ratio. At wave 20 on Normal with `ratio=1`: `1.8 * 1.13 = 2.03x`.

**Destruction rewards (line 2856):** `addXP(25)`, `gold+=5`, `snd('boom',.35)`, `campCrusher` achievement, quest progress `kill_spawners`, bounty progress `camps` +1 and `gold` +5, 12 particles. Melee and whirl heroes damage spawners for `h.dmg*.5` when within `h.rng+30` and `atkAnim>.5` (line 9298); projectiles hit at radius `30+p.sz`.

### 14.2 Cages (lines 2543/2859–2870)

```js
function Cage(x,y,idx){this.x=x;this.y=y;this.heroIdx=idx;this.opened=false;this.bobT=rnd(0,TAU);}
```

Three cages placed at `(WW*.25,WH*.3) (WW*.75,WH*.6) (WW*.4,WH*.8)` jittered `rnd(-80,80)`, holding heroes 1, 2 and 3 in that order (line 8290).

Opening requires **any** unlocked, living hero within 40 px. On open:

```js
this.opened=true;sibs++;var h=heroes[this.heroIdx];
h.unlocked=true;h.x=this.x;h.y=this.y;h.vx=0;h.vy=0;h.lv=teamLv;h._rescueGrace=3;
snd('equip',.5);applyPendingEquips(this.heroIdx);buildPortraitStrip();
/* 20 multi-colour particles */ screenShake(6,.2);announce(h.nm+' rescued!','#E8A838',3);
if(sibs>=3){trigAch('squadAssembled');if(!bossUp)announce('All siblings found! Destroy the camps!','#3DCC7A',4);}
```

The rescued hero inherits the current team level but keeps its own base stats; `pendingEquips` (items picked up while it was locked) are applied at this moment; a 3 s `_rescueGrace` suppresses the AI tether teleport; in multiplayer any unassigned guest is given a hero. An auto-save fires 500 ms later.

The cage draws a 32x28 barred box with a glowing hero-coloured dot inside and a `RESCUE!` label; it is a purely visual, non-blocking entity.

> The `Cage` class here is unrelated to `BOSS_BLOCKS` Kid Snatch cages (§17.8), which live on the boss.

---

## 15. Mini-bosses

**`MiniBoss` — line 2873.** Four types, placed once at `initGame` near the four non-forest biome camps (line 8296): golem `(WW*.22, WH*.22)`, sandworm `(WW*.78, WH*.22)`, hydra `(WW*.5, WH*.82)`, frostwyrm `(WW*.78, WH*.78)`.

| Field | golem | sandworm | hydra | frostwyrm |
|---|---|---|---|---|
| `nm` | Crystal Golem | Sandworm | Swamp Hydra | Frost Wyrm |
| `biomeNm` | Crystal Caverns Guardian | Desert Depths Guardian | Toxic Swamp Guardian | Frozen Tundra Guardian |
| `hp`/`maxHp` | 500 | 450 | 550 | 480 |
| `spd` | 40 | 70 | 50 | 55 |
| `dmg` | 35 | 30 | 25 | 28 |
| `sz` | 22 | 20 | 20 | 22 |
| `col` | `#8E98D8` | `#E8A860` | `#70C090` | `#A8D0E8` |
| `dk` | `#5868A8` | `#987040` | `#386848` | `#5878A0` |
| `rng` | 45 | 40 | 40 | 45 |
| `cd` | 2 | 1.5 | 1.2 | 1.5 |
| `xp` | 60 | 60 | 60 | 60 |
| Extra state | `slamT:0` | `burrowed:false, burrowT:0, burrowCd:6, emergeT:0` | `hasSplit:false` | `breathT:0, breathCd:5` |

Minimap colours (line 9151): `{golem:'#7A4018',sandworm:'#DAA520',hydra:'#2E8B57',frostwyrm:'#87CEEB'}`.

Hard difficulty applies `hp x1.5`, `dmg x1.25`. Mini-bosses are **not** NG+-scaled at construction.

### 15.1 Activation

```js
this.spawned=false;this.spawnDist=500;
if(h0&&!h0.dead&&dst(this,h0)<this.spawnDist){
  this.spawned=true;announce(this.nm+' APPEARS!',this.col,3);
  snd('miniboss',0.4);screenShake(10,.5);showMiniBossPopup(this.nm,this.biomeNm||'Guardian',this.col);}
```

Dormant and invisible until the active hero comes within 500 px.

### 15.2 Type behaviours (lines 2902–2946)

**Sandworm — burrow/emerge.** `burrowCd` ticks down; when it hits 0 with a hero within 300 px, it burrows for `burrowT=2.5` s and sets `burrowCd=8`, announcing `'The ground trembles...'`. While burrowed it tracks the target underground at a fixed 120 px/s (ignoring `spd`) and is **immune** (`takeDmg` returns 0 with a `MISS!` number). On emerging: `snd('boom',0.4)`, `screenShake(8,.3)`, `this.dmg` to every hero within 100 px, 15 sand particles, `emergeT=0.5`, `burrowCd=6`. While burrowed it renders only five drifting sand blobs.

**Frost Wyrm — frost breath.** Every 5 s with a hero within 250 px, fires **five** projectiles in a cone at `ba+i*0.2` for `i in [-2..2]`, speed 300, `dmg*0.6`, size 4, colour `#6B8EC8`, life 1.5 s, `slow:2`.

**Crystal Golem — slam and reflect.** With a hero within 80 px and `slamT<=0`: `slamT=4`, `screenShake(8,.3)`, `snd('boom',0.3)`, `1.5x dmg` to every hero within 100 px, 10 particles. In `takeDmg` it **reflects all non-melee, non-whirl hero attacks** (returns 0, prints `REFLECTED!`). In the projectile loop (line 9280) a friendly projectile that hits the golem is instead reversed (`vx*=-1; vy*=-1`), turned hostile (`friendly=false`), marked `reflected=true` and recoloured `#6B8EC8` — a reflected projectile can then damage the golem on a second pass.

**Swamp Hydra — split at 50 %.** In `takeDmg`, once `hp<=maxHp*0.5`: announces `'The Hydra splits!'` and spawns two `MiniBoss('hydra')` heads with `hp=floor(maxHp*0.3)`, `sz=14`, `xp=20`, `hasSplit=true` (they cannot split again) and `spawned=true`.

### 15.3 Base movement and death

```js
var a2=ang(this,near),spd=this.spd*(this.slowT>0?.4:1)*nightSpd;
if(nd>this.rng){this.vx=lerp(this.vx,Math.cos(a2)*spd,3*dt);this.vy=lerp(this.vy,Math.sin(a2)*spd,3*dt);}
else{this.vx*=.9;this.vy*=.9;if(this.atkT<=0){near.takeDmg(this.dmg);this.atkT=this.cd;}}
```

On death (line 2973): `miniBossSlayer` achievement, `gameStats.miniBossesKilled++`, quest progress `kill_miniboss`, `addXP(60)`, a **guaranteed tier-2 gear drop** (`rollGearDrop(2,0)`), `snd('boom',.5)`, `screenShake(10,.4)`, 25 particles. Death animation is a spin-and-shrink at `deathA+=dt*1.5`.

---

## 16. Boss phase system and arena effects

### 16.1 Arena effects (line 5018)

The shared telegraph/AoE primitive used by every boss. Cap `MAX_ARENA_EFFECTS=8`; over-cap calls are silently dropped.

```js
function addArenaEffect(opts){
  if(arenaEffects.length>=MAX_ARENA_EFFECTS)return;
  arenaEffects.push({x:opts.x,y:opts.y,radius:opts.radius,
    duration:opts.duration,timer:0,
    telegraphTime:opts.telegraphTime||1.0,
    active:false,
    drawTelegraph:opts.drawTelegraph,drawActive:opts.drawActive,
    onHeroInside:opts.onHeroInside,onEnd:opts.onEnd||function(){}});
}
```

Lifecycle: `timer` accumulates; at `timer>=telegraphTime` the effect becomes `active`; while active, `onHeroInside(hero,dt)` fires every frame for each unlocked, living hero with `dst(h,ae)<ae.radius`; at `timer>=telegraphTime+duration` `onEnd()` runs and the effect is removed. Drawing: `drawTelegraph(sx,sy,radius,timer/telegraphTime)` before activation, `drawActive(sx,sy,radius,timer-telegraphTime)` after. Effects are anchored to a fixed world position (they do not follow the boss). `clearArenaEffects()` empties the list — called on every boss death.

Note that `onHeroInside` receives `dt`, so damage inside an effect is written as `takeDmg(Math.floor(N*dt))` — an effective DPS of N, but floored per frame, which means values below ~60 DPS often floor to 0 at 60 fps and then to 1 via the `Math.max(1,amt)` clamp in `Hero.takeDmg`.

### 16.2 `createPhaseBoss(config)` (line 3044)

A generic data-driven phase machine. Config: `x`, `y`, `maxHp`, `sz`, `col`, `dk`, `nm`, `phases` (an object keyed by phase number).

```js
checkTransition:function(){
  var pct=this.hp/this.maxHp;
  var phaseDef=this.phases[this.phase];
  if(phaseDef.transitionBelow&&pct<=phaseDef.transitionBelow&&this.phases[this.phase+1]){this.transition(this.phase+1);}
},
transition:function(newPhase){
  if(this.phases[this.phase].exit)this.phases[this.phase].exit.call(this);
  this.phase=newPhase;this.phaseTransitioning=true;this.transitionTimer=1.5;
  if(this.phases[this.phase].enter)this.phases[this.phase].enter.call(this);
  announce(this.nm+' — Phase '+this.phase,this.col,2);
},
takeDmg:function(amt){
  if(this.phaseTransitioning||this.dead||this.dying)return 0;
  this.hp=Math.max(0,this.hp-amt);this.flashT=0.15;
  if(this.hp<=0){this.dying=true;this.deathA=0;}
  return amt;
},
telegraph:function(x,y,radius,duration,drawFn){this.telegraphs.push({x:x,y:y,radius:radius,timer:0,duration:duration,draw:drawFn});}
```

Each phase may define `enter`, `exit`, `update(dt)` and `draw`, all called with `this` bound to the boss. Transitions are HP-percentage gated by `transitionBelow`, take **1.5 s during which the boss is invulnerable and frozen**, and phase 1's `enter` runs at construction. The boss also owns a per-boss `telegraphs` array (separate from `arenaEffects`) that is drawn and expired in `update`/`draw`.

> **`createPhaseBoss` is defined but never called anywhere in v27.** Every shipped boss (Goblin King, DungeonBoss, Shadow Queen, Citadel Warden) implements its own phase logic with inline HP checks. It is a v24 scaffold left in place — useful as the intended abstraction for the rebuild, but it carries no shipped content.

---

## 17. BOSS_BLOCKS building blocks

**Line 5063–5324.** `var BOSS_BLOCKS={};` at line 5066. Nine composable mechanics, each written as a `setup` function plus optional `update`/`draw` partners the boss must call itself.

### 17.1 Radial Blast (line 5069)

```js
BOSS_BLOCKS.radialBlast=function(boss,opts){
  opts=opts||{};var chargeTime=opts.chargeTime||1.5,radius=opts.radius||180,pushForce=opts.pushForce||200,dmg=opts.dmg||boss.dmg;
  boss._rbCharging=true;boss._rbTimer=chargeTime;boss._rbRadius=radius;
  addArenaEffect({x:boss.x,y:boss.y,radius:radius,duration:0.5,telegraphTime:chargeTime,
    drawTelegraph:function(sx,sy,r,prog){ /* red ring growing to r, alpha 0.2+prog*0.6, lineWidth 2+prog*3, plus a 12% red fill */ },
    drawActive:function(sx,sy,r,t){ /* gold ring, alpha 0.6-t, lineWidth 4-t*6 */ },
    onHeroInside:function(h){var a=ang(boss,h);h.vx=(h.vx||0)+Math.cos(a)*pushForce;h.vy=(h.vy||0)+Math.sin(a)*pushForce;h.takeDmg(dmg);},
    onEnd:function(){boss._rbCharging=false;}});
  screenShake(6,0.3);snd('magic',0.3);
};
```

| Parameter | Default |
|---|---|
| `chargeTime` (telegraph) | `1.5` s |
| `radius` | `180` px |
| `pushForce` | `200` |
| `dmg` | `boss.dmg` |
| active window | fixed `0.5` s |

Telegraph is a red circle that expands from 0 to full radius over the charge; the explosion is a gold ring that thins to nothing over 0.5 s. Heroes inside are pushed *outward* from the boss and take the damage once per frame while inside the 0.5 s active window.

### 17.2 Cocoon Phase (lines 5084–5104)

```js
BOSS_BLOCKS.cocoonPhase=function(boss,opts){
  boss._cocoon={active:true,hp:opts.cocoonHp||200,maxHp:opts.cocoonHp||200,wavesLeft:opts.waves||2,
    waveTimer:opts.waveInterval||6,spawnFn:opts.spawnFn||null,stunDuration:opts.stunDuration||5,
    dmgMul:opts.dmgMul||1.5,crackPct:1};
  boss._cocoonInvuln=true;
  announce(opts.text||'The boss retreats into a cocoon!',opts.col||'#C8983C',2);
};
BOSS_BLOCKS.updateCocoon=function(boss,dt){
  var c=boss._cocoon;if(!c||!c.active)return false;
  c.waveTimer-=dt;
  if(c.waveTimer<=0&&c.wavesLeft>0){c.wavesLeft--;c.waveTimer=6;if(c.spawnFn)c.spawnFn(boss);
    c.crackPct=c.wavesLeft/(boss._cocoon.maxHp>0?2:1);
    announce('The cocoon cracks!','#E8A838',1.5);}
  if(c.wavesLeft<=0&&c.waveTimer<=0){
    boss._cocoonInvuln=false;c.active=false;boss.stunT=c.stunDuration;boss._cocoonDmgMul=c.dmgMul;
    announce('The cocoon shatters! VULNERABLE!','#3DCC7A',2.5);screenShake(12,0.5);snd('boom',0.4);
    /* 20 particles #C8983C/#E8A838/#fff */ }
  return true;
};
```

| Parameter | Default |
|---|---|
| `cocoonHp` | `200` |
| `waves` | `2` |
| `waveInterval` | `6` s (subsequent waves hard-coded to 6 s) |
| `stunDuration` | `5` s |
| `dmgMul` | `1.5` |
| `text` / `col` | 'The boss retreats into a cocoon!' / `#C8983C` |

The boss is fully invulnerable (`_cocoonInvuln`) for `waves * waveInterval` seconds; each wave calls `spawnFn(boss)`. When the last wave's timer expires, the cocoon shatters, the boss is stunned for `stunDuration`, and the **next** hit taken is multiplied by `dmgMul` (the multiplier is consumed once — see `DungeonBoss.takeDmg`, line 7654). Note `cocoonHp` is stored but never damaged: the cocoon is time-gated, not HP-gated.

### 17.3 Tether (lines 5106–5132)

```js
BOSS_BLOCKS.tether=function(boss,opts){
  boss._tether={active:true,target:opts.target,timer:0,maxTime:opts.maxTime||8,dotBase:opts.dotBase||3,
    anchor:{x:boss.x+rnd(-80,80),y:boss.y+rnd(-80,80),hp:opts.anchorHp||80,maxHp:opts.anchorHp||80,sz:12},
    col:opts.col||'#9B59B6'};
  announce('Tethered! Destroy the anchor!',boss._tether.col,2);
};
BOSS_BLOCKS.updateTether=function(boss,dt){
  var t=boss._tether;if(!t||!t.active)return false;
  t.timer+=dt;var dotScale=1+t.timer*0.5;t.target.takeDmg(Math.floor(t.dotBase*dotScale*dt));
  if(t.anchor.hp<=0||t.timer>=t.maxTime){t.active=false;announce('Tether broken!','#3DCC7A',1.5); /* 10 particles */ }
  return true;
};
```

| Parameter | Default |
|---|---|
| `maxTime` | `8` s |
| `dotBase` | `3` DPS |
| `anchorHp` | `80` |
| `col` | `#9B59B6` |
| anchor position | `boss +/- rnd(-80,80)` on both axes |
| anchor size | `12` px |

DoT ramps: effective DPS is `dotBase*(1+t*0.5)`, so 3 → 15 DPS by second 8. Broken by destroying the anchor or waiting out `maxTime`. Drawn as a pulsing dashed purple beam (`setLineDash([6,4])`, alpha `0.4+sin(gt*6)*0.3`) from boss to target, with the anchor as a glowing circle carrying a 30x4 green HP bar. **Never invoked by any boss in v27** — the anchor also has no hit detection wired up (the source comment says it "is handled via the boss hitbox system", but no such code exists).

### 17.4 Arena Hazard (lines 5134–5159)

```js
BOSS_BLOCKS.arenaHazard=function(boss,opts){
  var hz={x:opts.x||boss.x+rnd(-100,100),y:opts.y||boss.y+rnd(-100,100),radius:opts.radius||60,
    life:opts.life||8,maxLife:opts.life||8,dmg:opts.dmg||5,col:opts.col||'#D84830',type:opts.type||'fire'};
  if(!boss._hazards)boss._hazards=[];
  boss._hazards.push(hz);
};
BOSS_BLOCKS.updateHazards=function(boss,dt){ /* life-=dt; every hero within radius: h.takeDmg(Math.floor(hz.dmg*dt)); splice at life<=0 */ };
```

| Parameter | Default |
|---|---|
| `radius` | `60` px |
| `life` | `8` s |
| `dmg` | `5` DPS |
| `type` | `fire` (also `poison`, `ice`, else sand) |
| `col` | `#D84830` |

Fill colours by type: fire `rgba(216,72,48)`, poison `rgba(45,140,86)`, ice `rgba(148,196,220)`, default `rgba(200,152,60)`. Fill alpha is `max(0.05, life/maxLife*0.3)` so the zone fades as it expires. Unbounded count — no cap. Used by the Ancient Treant phase 2.

### 17.5 Charge Attack (lines 5161–5196)

```js
BOSS_BLOCKS.chargeAttack=function(boss,opts){
  var a=ang(boss,opts.target);
  boss._charge={active:true,dir:{x:Math.cos(a),y:Math.sin(a)},speed:opts.speed||500,timer:opts.duration||0.7,
    dmg:opts.dmg||boss.dmg,trailCol:opts.trailCol||'#D84830',wallStunTime:opts.wallStunTime||3,
    onWallStun:opts.onWallStun||null,trail:[]};
  var endX=boss.x+Math.cos(a)*400,endY=boss.y+Math.sin(a)*400;
  addArenaEffect({x:boss.x,y:boss.y,radius:20,duration:0.1,telegraphTime:0.4,
    drawTelegraph:function(sx,sy,r,prog){ /* dashed red line to (endX,endY), alpha 0.3+prog*0.5 */ }});
  snd('whirl',0.2);
};
BOSS_BLOCKS.updateCharge=function(boss,dt,arenaW,arenaH){
  var c=boss._charge;if(!c||!c.active)return false;
  c.timer-=dt;c.trail.push({x:boss.x,y:boss.y,life:0.4});
  boss.x+=c.dir.x*c.speed*dt;boss.y+=c.dir.y*c.speed*dt;
  for(...heroes...){if(dst(boss,h)<boss.sz+15)h.takeDmg(c.dmg);}
  var hitWall=false;var maxX=arenaW||WW,maxY=arenaH||WH;
  if(boss.x<40||boss.x>maxX-40||boss.y<40||boss.y>maxY-40){hitWall=true;boss.x=clamp(boss.x,40,maxX-40);boss.y=clamp(boss.y,40,maxY-40);}
  if(c.timer<=0||hitWall){
    c.active=false;snd('boom',0.3);screenShake(6,0.2);
    if(hitWall){boss.stunT=c.wallStunTime;announce('Stunned!','#3DCC7A',1.5);if(c.onWallStun)c.onWallStun(boss);}
    /* 10 particles in trailCol */ }
  return c.active;
};
```

| Parameter | Default |
|---|---|
| `speed` | `500` px/s |
| `duration` | `0.7` s |
| `dmg` | `boss.dmg` |
| `wallStunTime` | `3` s |
| `trailCol` | `#D84830` |
| telegraph | dashed red line, 400 px long, `0.4` s |
| hit radius | `boss.sz+15` |

Direction is locked at cast; heroes are hit every frame they are inside the radius (no once-per-charge guard). Hitting an arena wall ends the charge early, stuns the boss for `wallStunTime`, and fires `onWallStun(boss)` — the hook the Goblin King uses to expose its cage. `drawChargeTrail` renders the trail as fading circles at `boss.sz*0.6`.

### 17.6 Containment (lines 5198–5220)

```js
BOSS_BLOCKS.containment=function(boss,opts){
  boss._containment={active:true,target:opts.target,x:opts.target.x,y:opts.target.y,radius:opts.radius||50,
    hp:opts.hp||120,maxHp:opts.hp||120,timer:0,maxTime:opts.maxTime||10,dotDmg:opts.dotDmg||2,col:opts.col||'#9B59B6'};
  announce(target.nm+' trapped! Break the field!',boss._containment.col,2);
};
BOSS_BLOCKS.updateContainment=function(boss,dt){
  var c=boss._containment;if(!c||!c.active)return false;
  c.timer+=dt;c.target.x=lerp(c.target.x,c.x,2*dt);c.target.y=lerp(c.target.y,c.y,2*dt);
  c.target.takeDmg(Math.floor(c.dotDmg*dt));
  if(c.hp<=0||c.timer>=c.maxTime){c.active=false;announce('Field broken!','#3DCC7A',1.5);screenShake(6,0.3); /* 12 particles */ }
  return c.active;
};
```

| Parameter | Default |
|---|---|
| `radius` | `50` px |
| `hp` | `120` |
| `maxTime` | `10` s |
| `dotDmg` | `2` DPS |
| `col` | `#9B59B6` |

The trapped hero is `lerp`ed back to the field centre at rate 2/s — it can still walk but is dragged back. Drawn as a pulsing purple circle with a 40x4 HP bar above. **Never invoked by any boss in v27**, and nothing decrements `c.hp`, so only `maxTime` can end it.

### 17.7 Summon + Shield (line 5318)

```js
BOSS_BLOCKS.summonShield=function(boss,opts){
  opts=opts||{};boss._sumShield={active:true,hp:opts.shieldHp||200,maxHp:opts.shieldHp||200,
    addCount:opts.addCount||4,addsAlive:0,col:opts.col||'#4A9ED8'};
  announce('Shield up! Kill the minions!',boss._sumShield.col,2);
};
```

| Parameter | Default |
|---|---|
| `shieldHp` | `200` |
| `addCount` | `4` |
| `col` | `#4A9ED8` |

**A stub.** There is no `updateSumShield`, no `drawSumShield`, no add spawning, and no `takeDmg` integration; it is never invoked. It sets state and prints a banner and nothing else. The intent — shield holds until the adds die — must be rebuilt from scratch.

### 17.8 Kid Snatch (lines 5222–5300)

The signature mechanic. Grabs every non-active hero into a cage carried by the boss.

```js
BOSS_BLOCKS.kidSnatch=function(boss,opts){
  var captured=[];var active=heroes[activeHero];
  for(var i=0;i<heroes.length;i++){var h=heroes[i];if(!h.unlocked||h.dead||h.downed||h===active)continue;
    if(!opts.skipIfFar||dst(boss,h)<(opts.grabRadius||300)){captured.push(i);h._caged=true;h._cagedBoss=boss;}}
  if(captured.length===0)return;
  boss._cage={active:true,hp:opts.cageHp||(150+captured.length*50),maxHp:opts.cageHp||(150+captured.length*50),
    captured:captured,exposed:false,exposeTimer:0,exposeDuration:opts.exposeDuration||2,
    buffPerHero:opts.buffPerHero||0.15,bobT:0,shakeT:0};
  boss._cageBuff={dmgMul:1+captured.length*boss._cage.buffPerHero,shieldPct:captured.length*0.05};
  announce('Heroes captured!','#D84830',2.5);
```

| Parameter | Default |
|---|---|
| `cageHp` | `150 + capturedCount*50` |
| `exposeDuration` | `2` s |
| `buffPerHero` | `0.15` |
| `grabRadius` | `300` (only honoured when `skipIfFar` is set) |

**Buffs while heroes are caged:** boss damage `x(1 + n*0.15)`; boss damage taken reduced by `n*5 %`. With three caged: `x1.45` damage dealt and 15 % damage reduction.

**Voice-line trigger points** (the text itself is the FAMILY_CANON agent's job; these are the trigger indices and timings):

```js
var lines={0:'',1:"Hey! Let me out!",2:"The structural integrity of this cage is actually pretty— OW.",3:"WHOA! NOT COOL!",4:"HEY! LET ME OUT!"};
for(var ci=0;ci<captured.length;ci++){var idx=captured[ci];if(lines[idx]){ ... setTimeout(..., 1500+ci*1200); }}
```

Keyed by **hero index**: 0 Liam has no line, 1 Noah, 2 Collette, 3 Isabella; index 4 is unreachable. Fired at `1500 ms + 1200 ms per position in the captured list`, announced in the colour of `HDEFS[captured[0]].col` (i.e. all lines use the *first* captured hero's colour — see §29).

**Exposure and hitting the cage:**

```js
BOSS_BLOCKS.exposeCage=function(boss,duration){
  if(!boss._cage||!boss._cage.active)return;
  boss._cage.exposed=true;boss._cage.exposeTimer=duration||2;boss._cage.shakeT=0.3;
};
BOSS_BLOCKS.hitCage=function(boss,amt){
  if(!boss._cage||!boss._cage.active||!boss._cage.exposed)return 0;
  boss._cage.hp-=amt;boss._cage.shakeT=0.15;
  dmgN(boss.x,boss.y-boss.sz-20,amt,'#E8A838',amt>20);
  hitFx(boss.x,boss.y-boss.sz-10,'#E8A838');
  if(boss._cage.hp<=0){BOSS_BLOCKS.freeAllCaged(boss);return amt;}
  var pct=boss._cage.hp/boss._cage.maxHp;
  var shouldFree=boss._cage.captured.length-Math.ceil(pct*boss._cage.captured.length);
  while(shouldFree>0&&boss._cage.captured.length>0){BOSS_BLOCKS.freeOneHero(boss);shouldFree--;}
  return amt;
};
```

Heroes are freed proportionally as cage HP drops: with 3 captured, one is freed below 66.7 % and another below 33.3 %.

```js
BOSS_BLOCKS.freeOneHero=function(boss){
  var idx=boss._cage.captured.shift();var h=heroes[idx];
  h._caged=false;h._cagedBoss=null;h.x=boss.x+rnd(-60,60);h.y=boss.y+rnd(40,80);
  h.hp=Math.max(h.hp,Math.floor(h.maxHp*0.5));
  announce(h.nm+' freed!','#3DCC7A',2);snd('achieve',0.3);screenShake(4,0.2); /* 12 gold particles */
  if(boss._cage.captured.length===0){boss._cage.active=false;boss._cageBuff={dmgMul:1,shieldPct:0};}
  else{boss._cageBuff.dmgMul=1+boss._cage.captured.length*boss._cage.buffPerHero;
       boss._cageBuff.shieldPct=boss._cage.captured.length*0.05;}
};
BOSS_BLOCKS.freeAllCaged=function(boss){
  while(boss._cage.captured.length>0)BOSS_BLOCKS.freeOneHero(boss);
  boss._cage.active=false;boss._cageBuff={dmgMul:1,shieldPct:0};
  announce('ALL HEROES FREE!','#E8A838',3);screenShake(8,0.4);snd('victory',0.3);
};
```

A freed hero appears 40–80 px **below** the boss and is topped up to at least 50 % HP.

**Caged hero state.** In the main update loop (line 9269): `heroes[i].x=cb.x+rnd(-2,2); heroes[i].y=cb.y-cb.sz-15;` and the hero's own `update` is skipped entirely — caged heroes cannot move, attack, or be attacked.

**Rendering (`drawCage`, line 5281).** Cage body 28x24 px, drawn at `boss.y-boss.sz-15+bob` where `bob=sin(bobT)*3` (`bobT+=dt*3`), plus `rnd(-2,2)` shake while `shakeT>0`. Four vertical bars at 5 px pitch. Stroke is `rgba(232,168,56, 0.6+sin(gt*8)*0.3)` when exposed, flat `rgba(100,100,100,0.8)` otherwise. Captured heroes are 3 px dots in their `HDEFS` colours, spaced 6 px, bobbing on `sin(gt*4+ci*2)*2`. A 30x4 HP bar sits above (gold when exposed, grey otherwise) and the text `HIT CAGE!` appears while exposed.

**HUD (`drawCagedHUD`, line 5303):** each captured hero's portrait element `port_<i>` gets `filter: grayscale(0.6) brightness(0.7)` and a grey border. Note it never restores the style on release (§29).

---

## 18. Boss: Goblin King

**Lines 3113–3296.** The overworld boss; `function Boss(x,y)` at 3114. Spawned by `spawnBoss()` (line 3294) at `(WW/2, WH*.3)` once all five biome dungeons are cleared.

```js
function spawnBoss(){bossUp=true;boss=new Boss(WW/2,WH*.3);resetHeroStats();
  playBossIntro('THE GOBLIN KING','Ruler of the Horde — Kid Snatch!','#D84830','#D84830');
  screenShake(12,1);announce('THE GOBLIN KING APPEARS!','#ff0000',4);}
```

### 18.1 Stats and initial timers

| Field | Value |
|---|---|
| `hp`/`maxHp` | `2200 + teamLv*140` (x1.5 on Hard) |
| `sz` | `36` (grows to `38` in phase 3) |
| `spd` | `70` (→ 80 in P2, → 105 in P3) |
| `dmg` | `35` (x1.25 on Hard; x1.3 again at P3) |
| `col` / `dk` | `#8B0000` / `#5c0000` |
| `rng` | `50` |
| `cd` | `1.3` (→ 1.1 in P2, → 0.9 in P3) |
| `xp` | `150` |
| `atkT` | `2` |
| `slamT` | `5` |
| `summonT` | `12` |
| `chargeCD` | `8` |
| `spinT` | `10` |
| `throwT` | `4` |

Kid Snatch state: `_snatchDone=false`, `_snatchWindup=0`, `_snatchActive=false`. Cage state: `_cage=null`, `_cageBuff={dmgMul:1,shieldPct:0}`. Phase flags `_p2`, `_p3`.

### 18.2 Opening Kid Snatch sequence (lines 3138–3155)

Fires once, before any other behaviour, and blocks all other logic while running:

```js
if(!this._snatchDone){
  this._snatchWindup+=dt;
  if(this._snatchWindup<1.5){screenShake(this._snatchWindup*4,0.1);return true;}
  if(this._snatchWindup>=1.5&&!this._snatchActive){
    this._snatchActive=true;this._snatchDone=true;
    snd('boom',0.5);screenShake(15,0.8);
    announce('GOBLIN KING: "YOUR LITTLE FRIENDS ARE MINE!"','#D84830',3);
    BOSS_BLOCKS.radialBlast(this,{chargeTime:0.3,radius:200,pushForce:150,dmg:15});
    var _snatchRef=this;
    setTimeout(function(){if(!_snatchRef||_snatchRef.dead)return;
      BOSS_BLOCKS.kidSnatch(_snatchRef,{cageHp:200+teamLv*15,exposeDuration:2,buffPerHero:0.15,grabRadius:9999});
    },600);
  }
  return true;
}
```

Timeline: 0–1.5 s ramping screen shake (`intensity = windup*4`, so 0 → 6) with the boss frozen; at 1.5 s the roar, `screenShake(15,0.8)`, the voice line, and a radial blast (0.3 s charge, 200 px, push 150, 15 damage); at 2.1 s the snatch itself with `cageHp = 200 + teamLv*15` and an effectively infinite grab radius (9999), so **every** non-active living hero is caged regardless of distance. Captured-hero voice lines then fire at 1.5 s / 2.7 s / 3.9 s after the snatch (§17.8).

### 18.3 Phase transitions (lines 3157–3171)

| Phase | Trigger | Banner | Effects |
|---|---|---|---|
| 1 | start | — | base stats |
| 2 | `hp/maxHp <= 0.50` | `PHASE 2 — THE KING WEAKENS!` `#E8A838`, `screenShake(10,0.6)` | `spd=80`, `cd=1.1`, `chargeCD=0` (charge immediately available) |
| 3 | `hp/maxHp <= 0.25` | `PHASE 3 — DEATH OR GLORY!` `#ff0000`, `screenShake(15,0.8)` | `spd=105`, `dmg=floor(dmg*1.3)`, `cd=0.9`, `sz=38` |

Phase 3 additionally throws the cage:

```js
if(this._cage&&this._cage.active){BOSS_BLOCKS.freeAllCaged(this);
  announce('The King throws the empty cage!','#D84830',2);
  var tgt=heroes[activeHero];if(tgt&&!tgt.dead){var ta=ang(this,tgt);
    projs.push(new Proj(this.x,this.y,ta,300,{dmg:50,sz:12,col:'#8B0000',life:2,friendly:false}));}}
```

All caged heroes are freed, then a single 50-damage, size-12 projectile is fired at the active hero at 300 px/s.

Non-phase HP milestone banners in `takeDmg` (lines 3213–3215): `<75 %` "Boss weakening!" `#E8A838`; `<50 %` "Halfway there!" `#D88030`; `<25 %` "Almost defeated!" `#D84830`.

### 18.4 Attacks

Effective damage each frame is `effDmg = Math.floor(this.dmg * this._cageBuff.dmgMul)`; movement speed gets an extra `x1.1` while any hero is caged.

**Ground Slam** (all phases, lines 3176–3186)

```js
if(this.slamT<=0&&nd<250){this.slamT=this.phase===3?3.5:this.phase===2?5:6;
  screenShake(12,0.5);snd('boom',0.5);
  var slamR=this.phase===3?200:170;
  /* every non-caged hero within slamR: takeDmg(Math.floor(effDmg*1.3)) */
  /* 25 particles #8B0000/#ff4444/#E8A838/#ff6b6b */
  if(this._cage&&this._cage.active)BOSS_BLOCKS.exposeCage(this,2);}
```

Requires a hero within 250 px. Cooldown 6 / 5 / 3.5 s by phase; radius 170 px (200 in P3); damage `1.3x effDmg`. **Exposes the cage for 2 s** — the primary hit window in phases 1–2. No telegraph beyond the screen shake.

**Summon minions** (all phases, lines 3188–3191)

```js
if(this.summonT<=0){this.summonT=this.phase===3?6:this.phase===2?8:10;
  var cnt=this.phase+2;
  var stp=this.phase>=3?pick(['orc','troll','shielded']):pick(['goblin','orc','archer']);
  enemies.push(new Enemy(this.x+Math.cos(sa2)*sr,this.y+Math.sin(sa2)*sr,stp));
  announce('Minions, attack!','#ff4444',1.5);}
```

Count is `phase+2` (3/4/5), spawned at `rnd(50,100)` px around the boss at random angles. Type is rolled **once** per summon volley, so all minions in a wave share a type. Cooldown 10 / 8 / 6 s.

**Charge Attack** (P2+, lines 3193–3195)

```js
if(this.phase>=2&&this.chargeCD<=0&&nd>80&&nd<500){this.chargeCD=this.phase===3?5:7;
  BOSS_BLOCKS.chargeAttack(this,{target:near,speed:500,duration:0.7,dmg:effDmg,wallStunTime:3,
    onWallStun:function(b){if(b._cage&&b._cage.active)BOSS_BLOCKS.exposeCage(b,3);}});}
```

Only at 80–500 px range. 500 px/s for 0.7 s (up to 350 px), dashed red telegraph for 0.4 s. Hitting a wall stuns the King for 3 s **and exposes the cage for 3 s** — the second, longer hit window. Cooldown 7 s (5 s in P3). While the charge is active, `BOSS_BLOCKS.updateCharge(this,dt,WW,WH)` short-circuits the rest of the update.

**Spinning AoE** (P2 only, lines 3197–3205)

```js
if(this.phase===2&&this.spinT<=0){this.spinT=8;
  var spinR=150,_bRef=this;announce('The King spins!','#D84830',1.5);snd('whirl',0.3);
  addArenaEffect({x:this.x,y:this.y,radius:spinR,duration:1.5,telegraphTime:0.5,
    drawTelegraph:function(sx,sy,r,prog){ /* dark red ring expanding, alpha 0.3+prog*0.5 */ },
    drawActive:function(sx,sy,r,t){ /* dark red fill, alpha 0.2-t*0.12 */ },
    onHeroInside:function(h){h.takeDmg(Math.floor(effDmg*0.8));
      var ka=ang(_bRef,h);h.vx=(h.vx||0)+Math.cos(ka)*120;h.vy=(h.vy||0)+Math.sin(ka)*120;},
    onEnd:function(){if(_bRef&&!_bRef.dead)_bRef.stunT=1.5;}});}
```

Telegraph 0.5 s, active 1.5 s, radius 150, `0.8x effDmg` per frame inside plus 120 knockback. **The King is stunned for 1.5 s afterwards** ("dizzy") — a free damage window. Cooldown 8 s. Note the effect is anchored to where the King stood when he started spinning, so walking out of it is trivial once he moves.

**Thrown objects** (P3 only, lines 3207–3210)

```js
if(this.phase===3&&this.throwT<=0){this.throwT=2.5;
  var ta2=ang(this,near);for(var ti=0;ti<3;ti++){var ofs=rnd(-0.3,0.3);
    projs.push(new Proj(this.x,this.y,ta2+ofs,200+rnd(-30,30),{dmg:Math.floor(effDmg*0.6),sz:6,col:'#8B4513',life:2,friendly:false}));}
  snd('magic',0.2);}
```

Three barrels/rocks every 2.5 s, spread `+/-0.3` rad, speed `200 +/- 30`, `0.6x effDmg`, size 6, life 2 s.

**Basic melee.** Outside `rng=50` the King approaches with `lerp(..., 3*dt)`; inside, velocity damps to 0.9 and he hits for `effDmg` on `cd`, with `screenShake(6,0.15)`.

### 18.5 Taking damage (lines 3211–3229)

```js
Boss.prototype.takeDmg=function(amt,src,crit){
  if(this._cageBuff.shieldPct>0)amt=Math.floor(amt*(1-this._cageBuff.shieldPct));
  if(this._cage&&this._cage.active&&this._cage.exposed&&src){
    var cageY=this.y-this.sz-15;if(src.y<this.y-10){BOSS_BLOCKS.hitCage(this,amt);return amt;}}
  this.hp-=amt; ... }
```

**Cage hit routing:** while the cage is exposed, an attack from a source whose `y` is more than 10 px **above** the King's centre hits the cage instead of the boss. This is the whole positional puzzle of the fight — stand above him to free your siblings, below him to damage him. (`cageY` is computed and never used.)

### 18.6 Death (lines 3220–3228)

```js
if(this.hp<=0){this.dead=true;this.dying=true;this.deathA=0;bossDefeated=true;bossUp=false;
  if(this._cage&&this._cage.active)BOSS_BLOCKS.freeAllCaged(this);
  clearArenaEffects();
  addXP(this.xp);snd('boom',0.5);trigAch('kingSlayer');hitStop(0.1);
  /* 40 particles */
  announce('GOBLIN KING DEFEATED!','#E8A838',4);snd('victory',0.5);
  setTimeout(function(){bossDefeated=true;setTimeout(function(){spawnPortal();checkVolcanicEntrance();autoSave();},2000);},3000);}
```

Any remaining caged heroes are freed; +150 XP; the Shadow Realm portal spawns 5 s after death.

### 18.7 Rendering notes (lines 3230–3293)

Phase-coloured glow: `#8B0000` (P1), `#ff4400` (P2), `#ff0000` (P3), `shadowBlur=20+sin(gt*5)*10`. Animated cape via two quadratic curves driven by `sin(gt*1.5)` and `sin(gt*2)`. Gold crown with three spikes and three gem sockets (`#D84830`, `#4A9ED8`, `#3DCC7A`) that spark on `0.6+sin(gt*6)*0.4`. Red eyes, `eyeSize = phase>=3 ? 6 : 5`, `shadowBlur=8+phase*4`. Axe rotates on `sin(gt*2)*.25`. Phase label under the boss: `PHASE 1` / `WEAKENING` / `ENRAGED`. Cage and charge trail are drawn last via the building blocks.

---

## 19. Dungeon bosses

**`DungeonBoss(biome)` — line 7377; `spawnDungeonBoss` — line 7378; update — lines 7391–7648; per-biome draw table `BOSS_DRAW` — line 7666.** One boss per dungeon biome, all sharing a single constructor and update function that branches on `this.biome`. All spawn at `(DNG_COLS*DNG_TW/2, 120)` = `(320, 120)` and are clamped to `[40, 600] x [40, 440]`.

### 19.1 Shared constructor

```js
var baseHP=biome==='cave'?900:biome==='swamp'?850:biome==='desert'?750:800;
this.hp=baseHP+teamLv*80;this.maxHp=this.hp;
if(difficulty===2){this.hp=Math.floor(this.hp*1.5);this.maxHp=this.hp;}
this.phase=1;this.specialT=5;this.specialT2=8;this.specialT3=12;this.atkT=2;
```

| Biome | Name | col | dk | sz | spd | dmg | rng | cd | HP formula | Extra state |
|---|---|---|---|---|---|---|---|---|---|---|
| `forest` | Ancient Treant | `#58B888` | `#2E7A58` | 30 | 35 | 30 | 50 | 1.5 | `800+teamLv*80` | — |
| `desert` | Pharaoh Wraith | `#E8A860` | `#987040` | 28 | 50 | 28 | 45 | 1.3 | `750+teamLv*80` | — |
| `cave` | Crystal Colossus | `#8E98D8` | `#5868A8` | 32 | 30 | 35 | 55 | 1.8 | `900+teamLv*80` | `shieldUp:true, beamT:0, beamAngle:0` |
| `swamp` | Hydra Matriarch | `#58B888` | `#2E7A58` | 28 | 40 | 25 | 45 | 1.2 | `850+teamLv*80` | `heads:3, splitDone:false` |
| `frozen` | Frost Lich | `#A8D0E8` | `#5878A0` | 26 | 45 | 28 | 50 | 1.4 | `800+teamLv*80` | `blizzard:false, blizzardT:0` |
| `volcanic` | Magma Titan | `#D86840` | `#A83828` | 34 | 32 | 35 | 55 | 1.6 | `(2000 + 500*(playerCount-1)) + teamLv*100` | `armorPlates` (n/s/e/w, 150 HP each), `armorUp:false, meltdownT:0, enrageTimer:180, summonT:12` |

### 19.2 Shared intro and generic phases

```js
dungeonBoss.introPhase='drop';dungeonBoss.introT=0;dungeonBoss.introStartY=-80;
dungeonBoss.introTargetY=dungeonBoss.y;dungeonBoss.y=dungeonBoss.introStartY;
dungeonCinematicActive=true;dungeonCinematicTimer=0;dungeonCinematicBoss=dungeonBoss;snd('boss',.5);bossEncountered[biome]=true;
```

Drop-in intro: 0.8 s eased fall (`ease=1-Math.pow(1-prog,3)`) from y=-80, then `screenShake(15,0.7)`, `snd('boom',.6)`, 25 impact particles, and a 0.5 s `impact` hold. `takeDmg` returns 0 for the whole intro.

Generic phase logic applied to **every** dungeon boss on top of its biome-specific phases (line 7393):

```js
if(hpPct<0.5&&this.phase===1&&!this.enraged){this.phase=2;this.enraged=true;this.phaseFlash=1.2;
  this.spd=Math.floor(this.spd*1.2);this.dmg=Math.floor(this.dmg*1.15);
  announce(this.nm+' enrages!','#ff4444',2.5);screenShake(10,.6);snd('boss',.4);}
if(hpPct<0.25&&this.phase===2){this.phase=3;announce('FINAL PHASE!','#ff0000',2);screenShake(12,0.5);}
```

Milestone banners in `takeDmg`: `<75 %` `<nm> weakening!`, `<50 %` "Halfway there!", `<25 %` "Almost defeated!".

Shared `takeDmg` order (line 7647):
1. `introPhase` → return 0.
2. `_cocoonInvuln` → `IMMUNE!`, return 0.
3. `_planted` (Treant P2) → `amt=Math.floor(amt*0.7)`.
4. `_cocoonDmgMul>1 && stunT>0` → `amt*=1.5`, then the multiplier is reset to 1 (one-shot bonus).
5. Cave shield: arrow/magic attack while `shieldUp` → `REFLECTED!`, shield consumed, return 0.
6. Volcanic armour plates (below).
7. `src.cursed` → `amt*=0.7`.

Death: `dungeonXPGained+=100`, `bossDefeated2[biome]=true`, quest progress `defeat_boss`, `hitStop(0.1)`, `screenShake(12,0.5)`, 35 particles, `showDungeonVictory()` after 2 s.

### 19.3 Ancient Treant (forest) — lines 7429–7500

Three phases by HP: **P1 100–60 %, P2 60–30 %, P3 30–0 %** (`tPhase=hpPct>0.6?1:hpPct>0.3?2:3`), tracked separately in `_treantPhase`.

Timers initialised on first frame: `_saplingT=8`, `_sweepT=10`, `_blastT=15`, `_vineGrabT=6`, `_spriteT=12`.

Transition effects:

| To | Banner | Effect |
|---|---|---|
| P2 | `The Treant plants itself!` `#58B888`, `screenShake(10,0.5)` | `_planted=true`, `spd=0`, `dmg=floor(dmg*1.1)` |
| P3 | `The Treant UPROOTS!` `#D84830`, `screenShake(15,0.8)` | `_planted=false`, `spd=floor(55*(slowT>0?0.4:1))`, `dmg=floor(dmg*1.3)`, `enraged=true` |

**Phase 1 — vine grabs and sprites**

*Vine Root Grab* — every 6 s with a hero within 200 px:

```js
addArenaEffect({x:grabTarget.x,y:grabTarget.y,radius:80,duration:2.0,telegraphTime:1.0,
  drawTelegraph: /* dashed green ring #58B888 expanding, alpha 0.3+prog*0.5 */,
  drawActive:    /* green fill, alpha 0.25-t*0.1 */,
  onHeroInside:function(h,dt2){h.stunT=Math.max(h.stunT||0,0.3);h.takeDmg(Math.floor(12*dt2));}});
grabTarget.stunT=2;snd('magic',0.2);announce('Root Grab!','#58B888',1.5);
```

1 s dashed telegraph, 2 s active zone of radius 80; the named target is stunned outright for 2 s, anyone standing in the zone is re-stunned 0.3 s per frame and takes 12 DPS. 8 green particles.

*Forest Sprites* — every 12 s, three `bat`-type enemies recoloured `#3DCC7A`/`#1a8a4a`, named `Forest Sprite`, `hp=25`, spawned within `rnd(-80,80)` of the boss and clamped to the arena. Banner `Sprites emerge!`.

**Phase 2 — planted, armoured, zone denial**

- *Root network* — every 5 s (`specialT`), three `BOSS_BLOCKS.arenaHazard` zones at random arena positions: `radius:50, life:6, dmg:10, col:'#58B888', type:'poison'`. Banner `Root network spreads!`.
- *Saplings* — every 8 s, `2 + floor(random()*2)` (2–3) `slime`-type enemies recoloured `#2D8C56`/`#1a5a38`, named `Sapling`, `hp=40`, `spd=0`, `_saplingTimer=5`, spawned within `rnd(-120,120)`. Banner `Saplings sprout! Kill them fast!`.
- *Branch Sweep* — every 7 s with a hero within 200 px, a **cone** attack: `addArenaEffect` radius 180, telegraph 0.8 s, active 0.8 s, drawn as an arc from `sweepA-0.5` to `sweepA+0.5` (about 57°) in `rgba(90,50,16)`. `onHeroInside` re-checks the angle and applies 30 DPS only inside the cone. Banner `Branch Sweep!`, `snd('boom',0.3)`.
- *Armour*: `_planted` gives a flat 30 % damage reduction in `takeDmg`.

**Phase 3 — uprooted**

- *Leaf Explosion* — `_blastT` reset to **12** s (initial 15): `BOSS_BLOCKS.radialBlast(this,{chargeTime:1.2,radius:200,pushForce:180,dmg:Math.floor(this.dmg*0.8)})`, plus 20 slow-falling leaf particles (`grav:20, fric:0.98`) in `#D88030`/`#D84830`/`#E8A838`/`#B06020`. Banner `Leaf Explosion!`.
- Movement resumes; melee at `rng+30` for full `dmg`. While planted the melee reach is `rng+50`.

`BOSS_BLOCKS.updateHazards(this,dt)` runs every frame for this boss.

### 19.4 Pharaoh Wraith (desert) — lines 7503–7591

Three phases by HP: **P1 100–50 %, P2 50–25 %, P3 25–0 %** (`wPhase`), tracked in `_wrPhase`. Timers: `_teleT=5`, `_spreadT=4`, `_sumSoldierT=10`, `_phantomTimer=6`.

**Phase 1 — teleport, spreads, soldiers**

- *Teleport* — every 6 s (4 s once the generic `phase>=2` enrage has fired) to one of five fixed anchors: `(100,100)`, `(600,100)`, `(320,240)`, `(100,440)`, `(600,440)` — the four corners and the centre. A 0.8 s sand-coloured telegraph circle (radius 60) marks the destination *before* the jump, then `snd('portal',0.3)` and 10 particles.
- *3-way sand spread* — every 3 s: three projectiles at `sa + (i-1)*0.3` rad, speed 180, `0.7x dmg`, size 5, `#C8983C`, life 2 s.
- *Sand Soldiers* — every 10 s: `2 + floor(random()*2)` (2–3) `orc`-type enemies recoloured `#c9a13e`/`#8C7030`, named `Sand Soldier`, `hp=Math.floor(40*(1+teamLv*0.04))`. Banner `Sand soldiers rise!`.

**Phase 2 — cocoon (sarcophagus)**

```js
announce('The Wraith retreats into the sarcophagus!','#C8983C',3);screenShake(10,0.5);
BOSS_BLOCKS.cocoonPhase(this,{cocoonHp:300,waves:2,waveInterval:6,stunDuration:5,dmgMul:1.5,
  col:'#C8983C',text:'Sarcophagus sealed! Survive the scarabs!',
  spawnFn:function(b){var scarabCount=12+Math.floor(Math.random()*4);
    /* bat-type, col #8B7040 / dk #5a4828, nm 'Scarab', hp 15, dmg 8, spd 100, within rnd(-150,150) */
    announce('Scarab swarm!','#8B7040',2);}});
```

Two waves of **12–15 scarabs** six seconds apart while the Wraith is invulnerable; after the second wave the sarcophagus shatters, the Wraith is stunned 5 s and the next hit lands at 1.5x. 5 % chance per frame of a sand particle from the cracking sarcophagus. When the stun ends the code auto-advances `_wrPhase=3` regardless of HP.

**Phase 3 — phantom split**

```js
announce('PHANTOM SPLIT! Find the real Wraith!','#C8983C',3);screenShake(12,0.6);
this._phantoms=[];this._realIdx=Math.floor(Math.random()*3);
/* 2 x wraith-type enemies, col #C8983C / dk #987040, nm 'Phantom Wraith',
   hp 50, spd 60, _isPhantom:true, _scarabOnHit:true */
```

Two decoys plus the real boss. Every 6 s (`_phantomTimer`) all three teleport to fresh random arena positions and `_realIdx` is re-rolled, with banner `The phantoms shift!` and 15 particles. The real Wraith accumulates `_shimmer` for its draw-time tell. Spread shots continue every 2.5 s at speed 200, `0.6x dmg`, size 4, life 1.8 s.

> Note: `_realIdx` and `_scarabOnHit` are set but never read — the "which one is real" puzzle is only implemented visually (the real boss is the one with a health bar).

### 19.5 Crystal Colossus (cave) — line 7592

- *Crystal Slam* — `specialT` every 6 s (4 s at `phase>=2`) with a hero within 150 px: `screenShake(10,0.5)`, `snd('boom',0.4)`, `1.3x dmg` to every hero within 120 px, 12 `#6B8EC8` particles.
- *Crystal Beam* (P2+) — `specialT2` every 5 s: sets `beamT=2`, `beamAngle=ang(this,near)`, and a v25 telegraph `addArenaEffect` (radius 250, telegraph 1.2 s, active 1.0 s) drawing a `+/-0.15` rad wedge. Banner `Crystal Beam!`. While `beamT>0` the beam **sweeps**: `beamAngle+=dt*1.5` and any hero within `+/-0.15` rad and 250 px takes `Math.floor(this.dmg*0.4*dt*60)` per frame (i.e. ~0.4x dmg per 1/60 s tick).
- *Reflect shield* — `shieldUp` starts true; the first arrow or magic hit is reflected (`REFLECTED!`, 0 damage) and consumes the shield permanently.

### 19.6 Hydra Matriarch (swamp) — line 7597

- *Poison Pools* — `specialT` every 7 s (5 s at `phase>=2`): pushes 2 (3 at `phase>=2`) `poison_pool` objects into `dungeonObjects` at random arena positions with `life:6, r:40, dmg:8`. Banner `Poison pools!`.
- *Multi-head strike* — the Hydra ignores the generic melee branch (`this.biome!=='swamp'` guards it). Instead, on `atkT<=0` with a hero within `rng+30`, it attacks `Math.min(this.heads, aliveHeroCount)` heroes at once, each with a v25 telegraph (`addArenaEffect` radius 50, telegraph 1.0 s, active 0.5 s, dashed green ring; `onHeroInside` 15 DPS), then applies `this.dmg` to each target immediately.
- *Split at 50 %* — at `phase>=2 && hpPct<0.5` once: `heads=5`, `dmg=Math.floor(dmg*0.7)`. Banner `The Hydra splits!`. So it goes from 3 strikes at 25 damage to 5 strikes at 17.

### 19.7 Frost Lich (frozen) — line 7605

- *Deep Freeze* — `specialT` every 7 s (5 s at `phase>=2`) with a hero within 200 px: `near.stunT += 2.5` and `near.takeDmg(50)` (a flat 50, not scaled). Banner `Frozen solid!`, `snd('magic',0.3)`.
- *Ice Walls* — `specialT2` every 10 s (6 s at `phase>=2`): 2 (3 at `phase>=2`) `ice_wall` objects into `dungeonObjects` with `hp:60, maxHp:60` at random arena positions. Banner `Ice walls!`.
- *Blizzard* (P3 only) — `specialT3` every 12 s: `blizzard=true`, `blizzardT=4`, plus a 1.5 s expanding frost telegraph of radius 300 and a 4 s active fade. Banner `BLIZZARD!` `#ff4444`. While active every hero takes `Math.floor(6*dt)` per frame — but it is **interrupted** by any single hit over 15 damage (`if(this.biome==='frozen'&&this.blizzard&&amt>15){this.blizzard=false;this.blizzardT=0;}` in `takeDmg`).

### 19.8 Magma Titan (volcanic) — line 7611

The raid boss. HP `(2000 + 500*(NET.playerCount-1)) + teamLv*100`, its own phase thresholds:

```js
this.enrageTimer-=dt;var hpR=this.hp/this.maxHp;
if(hpR>0.6)this.phase=1;else if(hpR>0.25)this.phase=2;else this.phase=3;
if(!this.armorUp&&this.phase>=2){this.armorUp=true; /* all four plates restored to 150 */
  announce('Obsidian armor forms!','#D84830',2);this.phaseFlash=1;}
```

- *Magma Slam* — `specialT` every 5 s (3 s in P3) within `rng+20`: `screenShake(12,0.5)`, `1.4x dmg` to heroes within 100 px, 15 particles.
- *Lava Spray* — `specialT2` every 8 s (5 s at `phase>=2`): five projectiles at `sa+rnd(-0.4,0.4)`, speed `rnd(200,350)`. Banner `Lava Spray!`. **Broken call** — it uses the pre-v13 positional `Proj` signature (`new Proj(x,y,cosLa*ls,sinLa*ls,5,dmg,'#ff6348',false,true)`) against the current `Proj(x,y,angle,speed,opts)` constructor, so these projectiles get a garbage angle/speed and an `opts` of `5` (see §29).
- *Summon Embers* (P2+) — `summonT` every 12 s (8 s in P3): `2 + floor(playerCount*0.5)` `ember_sprite` enemies with `hp*(1+teamLv*0.04)`. Banner `Embers swarm!`.
- *Meltdown* (P3) — `meltdownT` every 6 s: `0.6x dmg` to **every** hero regardless of distance, `screenShake(8,0.3)`, 20 particles. Banner `MELTDOWN!`.
- *Enrage at 3 minutes* — `enrageTimer` starts at 180: `dmg=floor(dmg*1.5)`, `spd*=1.3`. Banner `TITAN ENRAGES!`.
- *Directional armour* — while `armorUp`, damage is routed to the plate facing the attacker:

```js
var sa2=Math.atan2(src.y-this.y,src.x-this.x);var dirs=['e','n','w','s'];
var di2=Math.round(((sa2+PI)/(TAU))*4)%4;var plate=this.armorPlates[di2];
if(plate&&plate.hp>0){var absorbed=Math.floor(amt*0.6);plate.hp-=absorbed;amt=amt-absorbed;
  if(plate.hp<=0){plate.hp=0;announce(plate.dir.toUpperCase()+' armor shattered!','#E8A838',1.5);snd('destroy_pot',0.3);}
  var allBroken=this.armorPlates.every(function(p){return p.hp<=0;});
  if(allBroken){this.armorUp=false;announce('All armor destroyed!','#3DCC7A',2);}}
```

Each plate absorbs 60 % of incoming damage until its 150 HP is gone; break all four to remove armour entirely. (The `dirs` array is indexed but `plate.dir` comes from `armorPlates` order `n,s,e,w` — the two orderings disagree, so the announced compass letter does not match the side you attacked from.)

### 19.9 Shared telegraph and HP bar

Non-swamp bosses telegraph their basic melee: while `0 < atkT < 1` and within range, `telegraphT=atkT` and a red circle of radius `rng+25` is drawn with a pulsing fill `.12+tgProg*.18+Math.sin(gt*12)*.04` plus a dashed outline. The HP bar is 80x8 px above the boss with the name and `P<phase>` above that.

---

## 20. Boss: Citadel Warden

**`CITADEL_WARDEN` — line 827; AI — lines 7412–7428; draw — line 7659.** The final boss of the three-floor Shadow Citadel, spawned as a `DungeonBoss` whose fields are overwritten when `citadelFloor===3`.

```js
var CITADEL_WARDEN={hp:2000,maxHp:2000,dmg:35,spd:45,sz:28,col:'#4a0080',nm:'Citadel Warden',type:'citadelWarden'};
```

```js
var cw=CITADEL_WARDEN;var ngS=NG_SCALE[ngPlus]||NG_SCALE[0];
dungeonBoss=new DungeonBoss(biome);
dungeonBoss.hp=Math.floor(cw.hp*ngS.enemyHp);dungeonBoss.maxHp=dungeonBoss.hp;
dungeonBoss.dmg=Math.floor(cw.dmg*ngS.enemyDmg);dungeonBoss.spd=cw.spd*ngS.enemySpd;
dungeonBoss.sz=cw.sz;dungeonBoss.col=cw.col;dungeonBoss.dk='#2a0050';dungeonBoss.nm=cw.nm;dungeonBoss.type='citadelWarden';
dungeonBoss._phase=1;dungeonBoss._atkT=2;dungeonBoss._sumT=12;dungeonBoss._specT=6;dungeonBoss._charging=0;dungeonBoss._chargeTarget=null;
```

It is the only boss whose base stats are NG+-scaled directly.

**Citadel floors (`CITADEL_FLOORS`, line 820):**

| Floor | Name | Biome skin | Rooms | `enemyScale` | Hazard | Mini-boss |
|---|---|---|---|---|---|---|
| 1 | Outer Ward | cave | 4 | 1.5 | spikes | Stone Sentinel — `golem`, hp 400, dmg 25, spd 40, sz 22, col `#5D6D7E` |
| 2 | Inner Sanctum | swamp | 5 | 2.0 | poison | Phantom Warden — `wraith`, hp 350, dmg 30, spd 70, sz 18, col `#7B3CA0` |
| 3 | Throne of Shadows | frozen | 3 | 2.5 | ice | none (the Warden itself) |

**Phases** — HP thresholds, evaluated fresh each frame:

```js
var cwPhase=this.hp>this.maxHp*0.66?1:this.hp>this.maxHp*0.33?2:3;
if(cwPhase!==this._phase){this._phase=cwPhase;
  if(cwPhase===2){announce('The Warden shifts to shadow magic!','#7B3CA0',2);screenShake(8,0.3);}
  if(cwPhase===3){announce('VOID FORM UNLEASHED!','#D84830',3);screenShake(12,0.5);}}
```

| Phase | HP band | Label (drawn) | Speed | Special |
|---|---|---|---|---|
| 1 | 100–66 % | `Dark Knight` | `spd` | Charge |
| 2 | 66–33 % | `Shadow Mage` | `spd` | Teleport + 8-way burst |
| 3 | <33 % | `VOID FORM` | `spd*1.5` | Teleport + burst, melee `1.25x dmg`, void particles |

**Abilities:**

- *Charge* (P1, `_specT` every 6 s): `_chargeTarget={x:near.x,y:near.y}`, `_charging=0.5`. While charging it moves at a fixed **400 px/s** toward the stored point and hits any hero within `sz+15` for full `dmg` every frame; on completion `screenShake(6,0.2)`, `snd('boom',0.3)`. Banner `Warden charges!` `#4a0080`.
- *Teleport + burst* (P2+, `_specT` every 5 s): jumps to `rnd(50, 590) x rnd(50, 430)`, zeroes velocity, and fires **eight** projectiles evenly around the circle at 150 px/s, full `dmg`, size 4, `#7B3CA0`, life 2 s. `snd('portal',0.3)`, 8 particles. No telegraph.
- *Melee* (`_atkT` every 1.5 s within `sz+30`): `dmg`, or `1.25x dmg` in P3. `snd('hit',0.2)`.
- *Summon Shadow Spawn* (`_sumT` every 12 s in P1, 8 s in P2+): 2 (3 at P2+) `goblin`-type enemies recoloured `#2c3e50`, named `Shadow Spawn`, `hp=Math.floor(30*ngS.enemyHp)`, pushed to `dungeonEnemies`.
- *Void particles* (P3): 15 % chance per frame of a rising `#4a0080` mote within `rnd(-30,30)` of the boss.

The Warden bypasses the generic dungeon-boss phase code entirely (`return true` at the end of its branch) and draws its own 60x5 HP bar coloured by phase (`#7B3CA0` / `#E8A838` / `#D84830`).

Clearing the Citadel triggers `citadelConqueror`; clearing it on NG+5 triggers `trueFinalBoss`.

---

## 21. Boss: Shadow Queen

**Lines 5528–5712.** The Shadow Realm boss, reached through the portal that spawns after the Goblin King dies. Defeating her unlocks NG+.

### 21.1 Stats

| Field | Value |
|---|---|
| `hp`/`maxHp` | `2500 + teamLv*150` (x1.5 on Hard) |
| `sz` | `30` |
| `spd` | `80` |
| `dmg` | `40` (x1.25 on Hard) |
| `col` / `dk` | `#A862C4` / `#6c3483` |
| `rng` | `50` |
| `cd` | `1.2` |
| `atkT` | `2` |
| Ability timers | `boltT:3, poolT:5, cloneT:12, kidnapT:15, ringT:8` |

### 21.2 Four phases

```js
var phaseMul=this.phase>=4?0.5:1; // Phase 4: 50% faster abilities
if(hpPct<0.7&&this.phase===1){this.phase=2;announce('The Shadow Queen summons clones!','#A862C4',3);screenShake(10,.5);}
if(hpPct<0.4&&this.phase===2){this.phase=3;announce('KIDNAP PHASE - Protect your siblings!','#ff0000',4);screenShake(12,.6);snd('kidnap',0.4);}
if(hpPct<0.15&&this.phase===3){this.phase=4;announce('DESPERATION - She fights for survival!','#ff0000',4);screenShake(15,.8);}
```

| Phase | HP threshold | Unlocks | Voice/banner line |
|---|---|---|---|
| 1 | 100–70 % | bolts, shadow pools | — |
| 2 | <70 % | + clones | `The Shadow Queen summons clones!` `#A862C4` |
| 3 | <40 % | + kidnap | `KIDNAP PHASE - Protect your siblings!` `#ff0000`, `snd('kidnap',0.4)` |
| 4 | <15 % | + expanding rings, **all cooldowns halved** | `DESPERATION - She fights for survival!` `#ff0000` |

### 21.3 Abilities

**Dark bolt barrage** (all phases, every `3*phaseMul` s): six projectiles at `ba + (i - numBolts/2 + 0.5)*0.2` for a `+/-0.5` rad fan, speed 280, `0.5x dmg`, size 5, `#A862C4`, life 2 s. `snd('shadow_bolt',0.2)`.

**Shadow pool** (all phases, every `5*phaseMul` s): pushes `{type:'shadow_pool', x:near.x+rnd(-30,30), y:near.y+rnd(-30,30), life:4, r:60, dmg:this.dmg*0.3}` into `eventEntities` — a 60 px damage zone at the target's feet lasting 4 s.

**Clone summoning** (P2+, every `12*phaseMul` s): two shadow clones. Each is a `goblin`-type enemy re-statted from a randomly chosen **living sibling** (heroes 1–3):

```js
ce.hp=200;ce.maxHp=200;ce.dmg=Math.floor(heroes[srcIdx].dmg*0.3);
ce.spd=heroes[srcIdx].spd*0.8;ce.col='#6c3483';ce.dk='#4a235a';
ce.sz=12;ce.xp=15;ce.type='shadow_clone';
ce.rng=heroes[srcIdx].rng>100?150:35;
ce.ranged=heroes[srcIdx].rng>100;
```

Banner `Shadow clones appear!`. Cloning a ranged sibling produces a ranged clone at 150 px.

**Kidnap** (P3+, every `15*phaseMul` s): picks a random living, unbanished sibling (heroes 1–3, never Liam).

```js
this.kidnapping=true;this.kidnapTarget=pick(targets);this.kidnapTimer=4;this.kidnapDmg=0;
announce('⚠ '+this.kidnapTarget.nm+' is being KIDNAPPED! Deal damage to interrupt!','#ff0000',4);
snd('kidnap',0.4);
```

While `kidnapping`, the Queen does nothing else (`return true`). Resolution:

- **Interrupt:** every point of damage dealt to her accrues in `kidnapDmg`; at `>=150` → `Kidnap interrupted!` `#3DCC7A` and the attempt is cancelled.
- **Success** at `kidnapTimer<=0`: `kidnapTarget.banished=true; kidnapTarget.dead=true`, banner `<name> has been BANISHED!` `#ff0000`, `snd('boom',0.5)`, `screenShake(10,.5)`, 20 purple particles. A banished hero is permanently out of the fight (excluded from targeting, alive-checks and control switching).
- Cancelled automatically if the target dies, goes down, or is already banished.

HUD: a red bar under the boss bar showing `INTERRUPTING KIDNAP: <pct>% (<name>)` where `kpct = kidnapDmg/150` (line 5707). A pulsing pink tether is drawn from the Queen to the target.

**Expanding dark rings** (P4, every `4*phaseMul` = 2 s): three staggered volleys 400 ms apart; each fires **12** projectiles evenly around the circle at speed `120 + delay*40` (120 / 136 / 152), `0.4x dmg`, size 6, `#e84393`, life 3 s, `isRing:true`.

**Movement/melee:** approaches at `lerp(...,3*dt)` outside `rng=50`, hits for full `dmg` on `cd=1.2` with `screenShake(6,.15)`.

### 21.4 Death (line 5651)

```js
shadowQueenDefeated=true;
if(!ngPlusUnlocked){ngPlusUnlocked=true;announce('New Game+ unlocked!','#E8A838',4);}
trigAch('shadowSlayer');setTimeout(autoSave,2000);
snd('victory_ext',0.5);screenShake(15,1);
announce('THE SHADOW IS VANQUISHED!','#E8A838',5);
/* 60 particles */
setTimeout(function(){showVictoryStats=true;gameStats.elapsed=gt-gameStats.startTime;
  showVictoryStatsHTML('SHADOW QUEEN VANQUISHED!','The darkness has been defeated!',function(){showVictoryHTML();});},3000);
```

Death animation runs at `deathA+=dt` over 2 s (twice as slow as other bosses), spinning a full `TAU` with a 30 px purple glow.

Rendering: aura colour flips to `#e84393` at `phase>=3`; five-spike pink crown; the boss HP bar colour is `#7B3CA0` (P1), `#A862C4` (P2), `#e84393` (P3+).

---

## 22. Combat formulas

### 22.1 Outgoing hero damage (`Hero.prototype.attack`, line 2317)

The complete pipeline, in source order:

```js
this.atkT=this.cd;this.atkAnim=1;this.state='attacking';this.ppulse=1;
var self=this;setTimeout(function(){if(!self.dead&&!self.downed)self.state='idle';},200);
var d=this.dmg,crit=Math.random()<(.12+(this.crit||0));
if(crit)d=Math.floor(d*(this.critMul||1.8));
if(this.dmgBuff>0)d=Math.floor(d*this.dmgBuff);                       // co-op damage link
if(titanHeartObtained)d=Math.floor(d*1.08);                            // Emberforge Heart, global
if(!inDungeon){var bdm=getBiomeBuff('dmgMul');if(bdm>1)d=Math.floor(d*bdm);}   // quest biome buff
if(!inDungeon&&weather.type==='snow')d=Math.floor(d*1.1);              // snow +10% DMG
d=Math.floor(d*getBuffMul(this,'dmg'));                                // merchant elixir etc.
```

then per-hit, per-target: `var fd=applySkillDmgMods(d,this,e);` which layers

```js
if(src.execute>0 && (tgt.hp/tgt.maxHp) < src.execute) d=Math.floor(d*2);       // Execution capstone
if(src.distBonus>0 && dst(src,tgt)>200) d=Math.floor(d*(1+src.distBonus));      // Sniper capstone
```

**Crit chance is `0.12 + h.crit`** — a flat 12 % base for every hero, plus Critical Eye (+0.15), gear `crit`, and the merchant's Lucky Charm (+0.05).
**Crit multiplier is `h.critMul || 1.8`** — 1.8x by default, replaced outright (not stacked) by the Headshot capstone's `critMul:3`.
The crit roll happens **once per attack**, not per target, so a whirl or melee swing crits on all targets or none.

Attack cooldown is `h.cd` seconds, reduced multiplicatively by Quick Draw (`cd*0.7`), Quick Hands (`cd*0.92`), and gear `cd` values (which are negative additive numbers, e.g. `-0.12`). There is no cooldown floor — stacking can drive `cd` to zero or negative, at which point `atkT<=0` is always true.

### 22.2 Attack types

**Melee** (`aType:'melee'` — Liam):

```js
snd('sword',.18);
// targets: enemies + miniBosses (+ dungeonBoss / boss / shadowQueen)
if(dst(this,e)>this.rng+25)continue;
var a=ang(this,e),df=a-this.face;while(df>PI)df-=TAU;while(df<-PI)df+=TAU;
var facingOk=this.fullWhirl>0?true:(Math.abs(df)<PI/3);
if(facingOk){var fd=applySkillDmgMods(d,this,e);var ad=e.takeDmg(fd,this,crit);
  if(this.lifesteal>0&&ad>0){var _lsAmt=Math.floor(ad*this.lifesteal);
    this.hp=Math.min(this.hp+_lsAmt,this.maxHp);if(_lsAmt>0)dmgN(this.x,this.y-20,'+'+_lsAmt,'#3DCC7A',false);}
  var kbF=200+(this.kbForce?200*this.kbForce:0)+(this.knockback?100:0);
  var ka=ang(this,e);e.vx+=Math.cos(ka)*kbF;e.vy+=Math.sin(ka)*kbF;this._shockCount++;}
```

Reach `rng+25` = **73 px** for Liam; a 120° frontal arc (`|df| < PI/3`), removed entirely by the Blade Dance capstone (`fullWhirl`). Base knockback impulse **200**, `+200*kbForce` (Tremor is a `mul` node so `kbForce` becomes 1.3 → +260) and `+100` if `knockback` is set.

**Arrow** (`aType:'arrow'` — Noah):

```js
snd('arrow',.12);var numShots=this.multishot||1;var burstN=this.burst||1;
for(var _bn=0;_bn<burstN;_bn++){ setTimeout(function(){
  var baseA=ang(self2,tgt);
  for(var _ms=0;_ms<numShots;_ms++){
    var sa=baseA+(numShots>1?(_ms-(numShots-1)/2)*0.15:0);
    var pOpts={dmg:applySkillDmgMods(d,self2,tgt),sz:3,col:'#D88030',life:1.5,pierce:self2.pierce>0,src:self2};
    if(self2.arrowSlow>0)pOpts.slow=self2.arrowSlow;
    if(self2.poisonDot>0)pOpts.dot=self2.poisonDot;
    projs.push(new Proj(self2.x,self2.y-5,sa,480,pOpts));}
},bn*100);}
```

Arrow speed **480 px/s**, life 1.5 s (720 px range). `multishot` spreads shots 0.15 rad apart, centred. `burst` fires whole volleys 100 ms apart. `pierce` is a boolean at the projectile level (any `pierce>0` makes it pierce everything, not just N enemies — see §29).

**Magic** (`aType:'magic'` — Collette):

```js
snd('magic',.12);
var mOpts={dmg:applySkillDmgMods(d,this,tgt),sz:5,col:'#e84393',homing:true,tgt:tgt,life:2,slow:this.slow>0?1.5:.5,src:this};
if(this.chain>0)mOpts.chain=this.chain;
var doFire=this.echo>0&&Math.random()<this.echo?2:1;
for(var _ec=0;_ec<doFire;_ec++){projs.push(new Proj(this.x,this.y-5,ang(this,tgt),220,mOpts));}
```

Speed **220 px/s**, homing, life 2 s. Applies a 0.5 s slow by default, 1.5 s if the hero has any `slow` stat. Spell Echo doubles the cast on a `Math.random()<echo` roll.

**Whirl** (`aType:'whirl'` — Isabella):

```js
snd('whirl',.1);
if(dst(this,e2)<this.rng+18){var wd=applySkillDmgMods(d,this,e2);var wad=e2.takeDmg(wd,this,crit);...}
```

Reach `rng+18` = **76 px**, 360° with no facing check, no knockback. The spin animation advances `spinA+=dt*25` while `atkAnim>0`.

**Shockwave capstone** (all types, line 2338):

```js
if(this.shockwave>0&&this._shockCount>=this.shockwave){this._shockCount=0;
  /* every enemy within 80 px: takeDmg(Math.floor(d*0.5),this,false) */
  /* 8 gold particles */ snd('boom',0.2);}
```

`_shockCount` only increments on melee and whirl hits, so the ring never triggers for Noah or Collette.

### 22.3 Incoming hero damage (`Hero.prototype.takeDmg`, line 2348)

Ordered gate list — the first matching gate returns early and negates the hit entirely:

```js
if(this._sigImmune){dmgN(this.x,this.y-20,'IMMUNE!','#6B8EC8');return;}      // i-frames
if(this.shieldOn){dmgN(this.x,this.y-20,'BLOCK!','#4A9ED8');return;}          // Liam ult shield
if(this.dodge&&this.dodge>0&&Math.random()<this.dodge){dmgN(this.x,this.y-20,'DODGE!','#6B8EC8');return;}
if(difficulty===0)amt=Math.floor(amt*0.75);
if(difficulty===2)amt=Math.floor(amt*1.25);
if(this.dmgReduction&&this.dmgReduction>0)amt=Math.floor(amt*(1-this.dmgReduction));
if(this.iceArmor>0&&attacker&&attacker.slowT>0)amt=Math.floor(amt*(1-this.iceArmor));
if(this.spiritLink>0){ /* split 30% across the other three heroes, each capped so hp never drops below 1 */ }
if(_bgHero){ /* Bodyguard: nearest ally with bodyguard>0 absorbs floor(amt*0.3) */ }
amt=Math.max(1,amt);
this.hp-=amt;this.flashT=.15;screenShake(4,.15);vig.i=.4;vig.t=.3;dmgN(this.x,this.y-20,amt,'#D84830');
if(this.thorns>0&&attacker&&attacker.takeDmg){ /* reflect floor(amt*thorns) directly to attacker.hp */ }
```

**Minimum damage is 1** after every reduction. Every hit costs `screenShake(4,.15)` and a 0.3 s vignette flash.

**I-frames** exist only as `_sigImmune`, set by:
- Liam Shield Bash while `sigState<0.5` (first 0.125 s of the dash).
- Noah Dodge Roll for its entire 0.4 s.

**`shieldOn`** (Liam's ult, and his legendary auto-shield) is a full block — infinite damage negation for its duration, not a damage pool.

**Liam's legendary auto-shield** (line 2296): when `idx===0` and `_legShieldCD` exists, dropping below 25 % max HP with the cooldown ready sets `shieldOn=true`, `shieldDur=5`, `_legShieldCD=10` and announces `Aegis activated!`.

### 22.4 Slow, stun and knockback

| Effect | Field | Magnitude |
|---|---|---|
| Slow (enemy) | `slowT` (seconds) | speed `x0.4` while `>0` — flat 60 % reduction |
| Stun (enemy) | `stunT` (seconds) | `Enemy.update` returns immediately; enemy is inert but still drawn at `globalAlpha .6` with orbiting stun stars |
| Knockback | direct `vx/vy` impulse | melee 200(+), Collette ult 200, Isabella ult 400, Shield Bash 400, Vortex 600, radial blast `pushForce` |
| Freeze (Collette ult) | `stunT=freezeDur`, `slowT=freezeDur+1.5` | 2.5 s default, 4 s with Deep Freeze |

There is no diminishing-returns or immunity timer on stun; the Unstoppable capstone sets `immune:1` but **nothing reads it** (§29).

Knockback is applied as a raw velocity addition with no mass term, and enemy velocity is damped only by the `*.9`/`*.95` factors in their own movement branch, so a 400-impulse knock travels roughly 400*dt px in the first frame and decays over ~10 frames.

### 22.5 Hit detection radii — complete table

| Interaction | Test | Line |
|---|---|---|
| Hero melee → target | `dst(h,e) <= h.rng+25` **and** `|angleDiff| < PI/3` (unless `fullWhirl`) | 2334 |
| Hero whirl → target | `dst(h,e) < h.rng+18`, 360° | 2337 |
| Friendly projectile → enemy | `dst(p,e) < e.sz + p.sz` | 9278 |
| Friendly projectile → mini-boss | `dst(p,mb) < mb.sz + p.sz` | 9280 |
| Friendly projectile → boss / Shadow Queen | `dst(p,boss) < boss.sz + p.sz` | 9289 |
| Friendly projectile → spawner | `dst(p,s) < 30 + p.sz` | 9291 |
| Hostile projectile → hero | `dst(p,h) < 15 + p.sz` | 9292 |
| Hero melee → spawner | `dst(h,s) < h.rng+30` and `h.atkAnim>.5` | 9298 |
| Enemy melee → hero | `dst(e,h) <= e.rng` | 2782 |
| Enemy separation | `dst(e1,e2) < e1.sz + e2.sz + 4` | 2785 |
| Hero ↔ obstacle | `dst(h,o) < o.r + 12` | 2262 |
| Cage open | `dst(cage,h) < 40` | 2862 |
| Loot pickup / magnet | `< 38` / `< 160 + magnetStacks*96` | 1765 |
| Equipment pickup / magnet / tooltip | `< 42` / `< 110 + magnetStacks*66` / `< 80` | 2007–2029 |
| Boss charge → hero | `dst(boss,h) < boss.sz + 15` | 5175 |
| Combo ult pairing | `dst(activeHero, partner) <= 100` | 2640 |
| Secret discovery | `dst(hero, secret) < 40` | 9312 |
| Merchant / bounty board interact | `dst(hero, target) < 80` | 971 |

**The hero hitbox is a fixed 15 px radius** for hostile projectiles — it is not derived from any hero stat.

### 22.6 Projectiles (`Proj`, line 1754)

```js
function Proj(x,y,a,spd,o){this.nid=netId();this.x=x;this.y=y;o=o||{};
  this.vx=Math.cos(a)*spd;this.vy=Math.sin(a)*spd;
  this.life=o.life||2;this.dmg=o.dmg||10;this.sz=o.sz||4;this.col=o.col||'#E8A838';
  this.homing=o.homing||false;this.tgt=o.tgt||null;this.slow=o.slow||0;this.dot=o.dot||0;
  this.chain=o.chain||0;this.trail=[];this.friendly=o.friendly!==false;
  this.pierce=o.pierce||false;this.hits=new Set();this.reflected=o.reflected||false;this.src=o.src||null;}
```

Homing steering: `ca += angleDiff * 3 * dt` — a 3 rad/s turn rate at full error, speed preserved. Trail is the last 8 positions, alpha decaying at `dt*3`. A projectile dies when `life<=0` or it leaves `[-50, WW+50]`. `hits` is a `Set` so a piercing projectile damages each target at most once.

On hit: `p.slow>0` sets `e.slowT=Math.max(e.slowT||0, p.slow)`; `p.dot>0` sets `e._dotDmg=p.dot; e._dotT=4` (a fixed 4-second DoT window regardless of the stat). Non-piercing projectiles set `p.life=0`.

`p.chain` is stored on the projectile but **no chaining code exists** (§29).

### 22.7 Enemy damage taken (`Enemy.prototype.takeDmg`, line 2789)

```js
if(this.marked>0)amt=Math.floor(amt*1.5);                          // Hunter's Mark
if(this._shield>0){ /* elite shield absorb, returns early if fully absorbed */ }
if(this.shieldHp>0){ /* type shield absorb, returns early if fully absorbed */ }
if(this.armor>0){var armorFrac=this.armor>=1?this.armor/100:this.armor;
  amt=Math.max(1,Math.floor(amt*(1-armorFrac)));}
this.hp-=amt;this.flashT=.1;hitFx(this.x,this.y,this.col);dmgN(this.x,this.y,amt,dcol,crit);gameStats.dmgDealt+=amt;
```

`takeDmg` returns the amount actually applied (or the amount absorbed), which callers use for lifesteal and `stats.dmgDealt`.

### 22.8 Lifesteal

`Math.floor(actualDamage * h.lifesteal)`, capped at `maxHp`, with a green `+N` number above the hero. **Melee only** — the lifesteal block lives in the `aType==='melee'` branch, so Noah, Collette and Isabella gain nothing from lifesteal gear or the Vampiric level-up card (§29). Sources: Vamp Fang / Vampire Fang (`+0.1`), gear `x_fang` (`0.08` base), Marshlight Vial dungeon reward (`+0.15`), Vampiric card (`+0.03`).

---

## 23. Equipment and gear

v27 runs **two overlapping systems**: the legacy `EQ_LIST` global-buff pickups (v5–v20) and the new three-slot `GEAR_DB` system (v27). New drops always use `GEAR_DB`; `EQ_LIST` survives for dungeon-clear rewards and save migration.

### 23.1 Legacy `EQ_LIST` (line 1783)

Applied globally and permanently by `applyEq(def)` (line 2043); `h:-1` means all heroes, otherwise the hero index.

| Name | `stat` | Value | Colour | Icon | `h` |
|---|---|---|---|---|---|
| Flame Blade | `dmg` | `mul:1.4` | `#D84830` | 🗡️ | 0 |
| Rapid Quiver | `cd` | `mul:.55` | `#D88030` | 🏹 | 1 |
| Arcane Focus | `dmg` | `mul:1.55` | `#A862C4` | 🔮 | 2 |
| Tiny Crown | `dmg` | `mul:1.45` | `#E8A838` | 👑 | 3 |
| Shield Charm | `maxHp` | `add:70` | `#4A9ED8` | 🛡️ | 0 |
| Swift Boots | `spd` | `mul:1.25` | `#1abc9c` | 👟 | -1 |
| Vamp Fang | `lifesteal` | `add:.1` | `#7B3CA0` | 🦇 | 0 |
| Frost Wand | `slow` | `add:1` | `#6B8EC8` | ❄️ | 2 |
| Phoenix Feather | `revive` | `val:1` | `#D84830` | 🪶 | -1 |
| Vampire Fang | `lifesteal` | `val:0.1` | `#7B3CA0` | 🦇 | -1 |
| Wind Boots | `dodge` | `val:0.12` | `#6B8EC8` | 💨 | -1 |
| War Drum | `teamAtk` | `val:0.08` | `#D88030` | 🥁 | -1 |
| Crystal Orb | `ultCharge` | `val:0.15` | `#A862C4` | 🔮 | -1 |
| Thorns Mail | `reflect` | `val:0.1` | `#3DCC7A` | 🛡️ | -1 |

`applyEq` handles the `val`-style stats team-wide first (`lifesteal`, `regen`, `critRate`, `slow`, `dodge`, `teamAtk`, `ultCharge`, `reflect`, `revive`, `titanHeart`), then applies `mul`/`add` to the targeted hero(es) with **diminishing returns**:

```js
if(def.mul){var mulCnt=0;for(...)if(h.equips[eq8].stat===def.stat&&h.equips[eq8].mul)mulCnt++;
  if(mulCnt<=3){h[def.stat]=Math.round(h[def.stat]*def.mul*10)/10;}
  else{var dimMul=1+(def.mul-1)*0.25;h[def.stat]=Math.round(h[def.stat]*dimMul*10)/10;}}
if(def.add){h[def.stat]=(h[def.stat]||0)+def.add;if(def.stat==='maxHp')h.hp+=def.add;}
```

The first three multiplicative items of a given stat apply in full; the fourth and beyond apply at 25 % of their bonus (`1.4x` becomes `1.1x`).

Items picked up for a still-caged hero are queued in `pendingEquips` and applied on rescue (`applyPendingEquips`, line 2076).

### 23.2 Legendaries (`LEGENDARY_EQ`, line 1774)

One per hero, also mirrored into `GEAR_DB` as tier-4 weapons.

| id | Name | Icon | Colour | Hero | Description | `fx` |
|---|---|---|---|---|---|---|
| `leg_liam` | Aegis of Dawn | 🛡️ | `#4A9ED8` | 0 | +30% HP, auto-shield | `maxHp=floor(maxHp*1.3); hp=maxHp; _legShieldCD=0` |
| `leg_noah` | Phantom Blades | 🗡️ | `#2DB86A` | 1 | +25% spd, chain 2 | `spd=floor(spd*1.25); chain=max(chain,2)` |
| `leg_collette` | Staff of Eternity | 🔮 | `#A862C4` | 2 | +40% DMG, pierce all | `dmg=floor(dmg*1.4); pierce=99` |
| `leg_isabella` | Crown of Storms | 👑 | `#E8A838` | 3 | +20% AoE, shockwaves | `rng=floor(rng*1.2); shockwave=max(shockwave,2)` |

Collecting all four triggers `legendaryHero`.

### 23.3 Mastery titles (line 1780)

```js
var MASTERY_TITLES=['Novice','Adept','Veteran','Master','Legend','Mythic'];
var MASTERY_THRESHOLDS=[0,100,300,600,1000,2000];
function getHeroMastery(h){var kills=h.stats?h.stats.kills:0;
  for(var i=MASTERY_THRESHOLDS.length-1;i>=0;i--){if(kills>=MASTERY_THRESHOLDS[i])return{level:i,title:MASTERY_TITLES[i]};}
  return{level:0,title:'Novice'};}
```

| Title | Kills required |
|---|---|
| Novice | 0 |
| Adept | 100 |
| Veteran | 300 |
| Master | 600 |
| Legend | 1,000 |
| Mythic | 2,000 |

Per-hero, driven by `h.stats.kills` (incremented in `onKillEffects`). Cosmetic/UI only — no stat effect.

### 23.4 v27 `GEAR_DB` (line 1793)

Three slots (`weapon`, `armor`, `accessory`) per hero, four tiers, plus a `hero` field for hero-locked items and `wVis` for the weapon visual.

| Key | Name | Slot | Icon | Tier | Base stats | Colour | `wVis` | Hero lock |
|---|---|---|---|---|---|---|---|---|
| `w_sword` | Iron Sword | weapon | ⚔️ | 1 | `dmg:5` | `#B0B0B0` | sword | — |
| `w_dagger` | Scout Dagger | weapon | 🗡️ | 1 | `dmg:3, cd:-0.05` | `#A0A8B0` | sword | — |
| `w_longbow` | Longbow | weapon | 🏹 | 1 | `dmg:4, rng:20` | `#8B6E4E` | sword | 1 |
| `w_flame` | Flame Blade | weapon | 🗡️ | 2 | `dmg:8, crit:0.05` | `#D84830` | flame | 0 |
| `w_quiver` | Rapid Quiver | weapon | 🏹 | 2 | `cd:-0.12, dmg:3` | `#D88030` | quick | 1 |
| `w_hammer` | War Hammer | weapon | 🔨 | 2 | `dmg:10, aoe:0.1` | `#7A8A9A` | heavy | 3 |
| `w_frost` | Frost Edge | weapon | ❄️ | 2 | `dmg:7, slow:0.5` | `#6BCCEE` | frost | — |
| `w_staff` | Arcane Focus | weapon | 🔮 | 3 | `dmg:12, pierce:1` | `#A862C4` | arcane | 2 |
| `w_shadow` | Shadow Fang | weapon | 🌑 | 3 | `dmg:14, crit:0.08` | `#3D2066` | shadow | — |
| `a_leather` | Leather Vest | armor | 🧥 | 1 | `maxHp:20` | `#8B6E4E` | — | — |
| `a_chain` | Chain Mail | armor | ⛓️ | 1 | `maxHp:35, dodge:-0.02` | `#A0A8B0` | — | — |
| `a_shield` | Shield Charm | armor | 🛡️ | 2 | `maxHp:40, dodge:0.05` | `#4A9ED8` | — | — |
| `a_mage` | Mage Robe | armor | 🧙 | 2 | `maxHp:25, ultCharge:0.08` | `#A862C4` | — | — |
| `a_plate` | Battle Plate | armor | ⛓️ | 3 | `maxHp:70, regen:2` | `#7A8A9A` | — | — |
| `x_boots` | Swift Boots | accessory | 👟 | 1 | `spd:15` | `#1abc9c` | — | — |
| `x_fang` | Vampire Fang | accessory | 🦇 | 2 | `lifesteal:0.08` | `#7B3CA0` | — | — |
| `x_drum` | War Drum | accessory | 🥁 | 2 | `teamAtk:0.06` | `#D88030` | — | — |
| `x_thorns` | Thorns Mail | accessory | 🛡️ | 2 | `reflect:0.08` | `#3DCC7A` | — | — |
| `x_orb` | Crystal Orb | accessory | 🔮 | 3 | `ultCharge:0.15` | `#A862C4` | — | — |
| `x_feather` | Phoenix Feather | accessory | 🪶 | 3 | `revive:1` | `#D84830` | — | — |
| `leg_liam` | Aegis of Dawn | weapon | 🛡️ | 4 | `maxHp:0.3, dmg:8` | `#4A9ED8` | sword | 0, `legendary` |
| `leg_noah` | Phantom Blades | weapon | 🗡️ | 4 | `spd:0.25, chain:2` | `#2DB86A` | shadow | 1, `legendary` |
| `leg_collette` | Staff of Eternity | weapon | 🔮 | 4 | `dmg:0.4, pierce:99` | `#A862C4` | arcane | 2, `legendary` |
| `leg_isabella` | Crown of Storms | weapon | 👑 | 4 | `rng:0.2, shockwave:2` | `#E8A838` | heavy | 3, `legendary` |

Legendary `fx` hooks: `leg_liam` sets `_legShieldCD=0`, `leg_noah` sets `chain=max(chain,2)`, `leg_isabella` sets `shockwave=max(shockwave,2)`. `leg_collette` has no `fx` (its `pierce:99` comes through as a stat).

**Drop pools (line 1827)** — built once at load, excluding legendaries:

```js
var GEAR_POOL_T1=[], GEAR_POOL_T2=[], GEAR_POOL_T3=[];
(function(){for(var k in GEAR_DB){var g=GEAR_DB[k];if(g.legendary)continue;
  if(g.tier===1)GEAR_POOL_T1.push(k);else if(g.tier===2)GEAR_POOL_T2.push(k);else if(g.tier===3)GEAR_POOL_T3.push(k);}})();
```

T1 = `w_sword, w_dagger, w_longbow, a_leather, a_chain, x_boots` (6). T2 = `w_flame, w_quiver, w_hammer, w_frost, a_shield, a_mage, x_fang, x_drum, x_thorns` (9). T3 = `w_staff, w_shadow, a_plate, x_orb, x_feather` (5).

### 23.5 Rarity (lines 1831–1858)

```js
var RARITIES=['common','uncommon','rare','epic','legendary'];
var RARITY_COLS={common:'#B0B0B0',uncommon:'#2DB86A',rare:'#4A9ED8',epic:'#A862C4',legendary:'#E8A838'};
var RARITY_MULS={common:1.0,uncommon:1.25,rare:1.6,epic:2.0,legendary:2.5};
var RARITY_WEIGHTS={common:45,uncommon:30,rare:15,epic:8,legendary:2};
var RARITY_PREFIXES={common:'',uncommon:'Fine ',rare:'Superior ',epic:'Masterwork ',legendary:''};
var RARITY_NAMES={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary'};
var RARITY_BORDERS={common:'1px solid #666',uncommon:'1px solid #2DB86A',rare:'2px solid #4A9ED8',epic:'2px solid #A862C4',legendary:'2px solid #E8A838'};
```

Base weights total 100, so the unbiased distribution is exactly 45 / 30 / 15 / 8 / 2 %.

```js
function rollRarity(bonus){
  var w={common:45,uncommon:30,rare:15,epic:8,legendary:2};  // from RARITY_WEIGHTS
  if(bonus>0){w.common=Math.max(5,w.common-bonus*8);w.uncommon+=bonus*2;w.rare+=bonus*3;w.epic+=bonus*2;w.legendary+=bonus*1;}
  var total=w.common+w.uncommon+w.rare+w.epic+w.legendary;
  var r=Math.random()*total,acc=0;
  for(var i=0;i<RARITIES.length;i++){acc+=w[RARITIES[i]];if(r<acc)return RARITIES[i];}
  return 'common';
}
function rollGearDrop(enemyTier,bonus){
  // enemyTier: 0=regular, 1=elite, 2=miniboss, 3=boss
  var pool=enemyTier>=2?GEAR_POOL_T3:enemyTier>=1?GEAR_POOL_T2:GEAR_POOL_T1;
  if(pool.length===0)pool=GEAR_POOL_T1;
  if(enemyTier>=1&&Math.random()<0.3)pool=GEAR_POOL_T1;
  else if(enemyTier>=2&&Math.random()<0.4)pool=GEAR_POOL_T2;
  var key=pool[Math.floor(Math.random()*pool.length)];
  var rarity=rollRarity((bonus||0)+enemyTier*0.8+(teamLv||1)*0.1+(ngPlus||0)*0.5);
  var maxRar=enemyTier>=3?4:enemyTier>=2?3:enemyTier>=1?2:1;
  var rarIdx=RARITIES.indexOf(rarity);if(rarIdx>maxRar)rarity=RARITIES[maxRar];
  return new GearItem(key,rarity);
}
```

**Rarity bonus** = `explicitBonus + enemyTier*0.8 + teamLv*0.1 + ngPlus*0.5`. At team level 10, NG+2, from a mini-boss: `0 + 1.6 + 1.0 + 1.0 = 3.6` → weights become `common 16.2, uncommon 37.2, rare 25.8, epic 15.2, legendary 5.6` (total 100) — but the mini-boss cap `maxRar=3` demotes any legendary roll to epic.

**Rarity caps by source:** regular enemies max out at *uncommon* (`maxRar=1`), elites at *rare* (2), mini-bosses at *epic* (3), bosses at *legendary* (4). Since nothing calls `rollGearDrop(3,...)`, legendary rarity is unreachable from drops (§29).

### 23.6 `GearItem` (lines 1861–1899)

```js
function GearItem(defKey,rarity){
  this.key=defKey;this.def=GEAR_DB[defKey];this.rarity=rarity||'common';
  this.id=++_gearIdCounter;this.statMul=RARITY_MULS[this.rarity]||1;
}
GearItem.prototype.getStats=function(){
  var base=this.def.stats,out={},mul=this.statMul;
  for(var k in base){
    if(k==='lifesteal'||k==='crit'||k==='dodge'||k==='reflect'||k==='ultCharge'||k==='teamAtk')
      out[k]=Math.round(base[k]*((mul-1)*0.6+1)*1000)/1000;
    else if(k==='revive'||k==='pierce'||k==='chain'||k==='shockwave')
      out[k]=base[k];
    else out[k]=Math.round(base[k]*mul*10)/10;
  }return out;
};
```

Three scaling classes: percentage stats scale at 60 % of the rarity multiplier (a legendary 2.5x becomes 1.9x); binary/count stats (`revive`, `pierce`, `chain`, `shockwave`) never scale; everything else scales fully and rounds to 1 dp.

```js
GearItem.prototype.getDisplayName=function(){
  if(this.def.legendary)return '★ '+this.def.nm;
  return RARITY_PREFIXES[this.rarity]+this.def.nm;
};
GearItem.prototype.getSellValue=function(){
  var tierVal=[0,8,18,35,60];var rarVal={common:1,uncommon:2,rare:4,epic:8,legendary:20};
  return Math.floor((tierVal[this.def.tier]||10)*(rarVal[this.rarity]||1));
};
```

**Sell value matrix (gold):**

| Tier \ Rarity | common | uncommon | rare | epic | legendary |
|---|---|---|---|---|---|
| 1 (8) | 8 | 16 | 32 | 64 | 160 |
| 2 (18) | 18 | 36 | 72 | 144 | 360 |
| 3 (35) | 35 | 70 | 140 | 280 | 700 |
| 4 (60) | 60 | 120 | 240 | 480 | 1200 |

`getStatDesc()` renders the stat list with labels (`dmg`→DMG, `maxHp`→HP, `cd`→ATK SPD, etc.), formatting percentage-class stats and `cd` as `+/-N%` and everything else as `+/-N`.

### 23.7 Stat application (`recalcHeroStats`, line 1907)

The v27 gear system is the only part of the codebase that recomputes from a baseline.

```js
var base=HDEFS[idx];
h.dmg=base.dmg;h.maxHp=base.maxHp;h.spd=base.spd;h.rng=base.rng;h.cd=base.cd;
h.lifesteal=0;h.regen=0;h.slow=0;h.dodge=0;h.reflect=0;h.crit=0;
h.ultChargeRate=1;h.autoRevive=0;
var lv=h.lv||1;
h.maxHp+=lv*12;h.dmg+=lv*3;                       // level bonuses
if(difficulty===0){h.maxHp=Math.floor(h.maxHp*1.5);}
/* skill tree reapplication — see note below */
var slots=['weapon','armor','accessory'];
for(var si=0;si<slots.length;si++){
  var gi=h.gear[slots[si]];if(!gi)continue;
  var gs=gi.getStats();
  for(var gk in gs){var gv=gs[gk];
    if(gi.def.legendary&&(gk==='dmg'||gk==='maxHp'||gk==='spd'||gk==='rng')&&gv<5){h[gk]=Math.floor(h[gk]*(1+gv));}
    else{h[gk]=(h[gk]||0)+gv;}}
  if(gi.def.fx)gi.def.fx(h);
}
h.hp=Math.min(h.hp,h.maxHp);
```

Order: `HDEFS` base → level bonus (`+12 maxHp`, `+3 dmg` per level) → Easy HP → skill trees → gear → HP clamp. Legendary core stats stored as fractions below 5 are treated as multipliers (`0.3` → `x1.3`); everything else is additive.

> The skill-tree reapplication block reads `br.t1`, `br.t2` and `br.capChosen` — **fields that do not exist** on the branch objects created by `initSkillTrees` (which use `tier` and `capstone`). Calling `recalcHeroStats` therefore silently wipes every skill-tree stat bonus. See §29.

**Equip / unequip / sell (lines 1958–1996):**

```js
function equipGear(heroIdx,slotName,gearItem){
  if(gearItem.def.hero!==undefined&&gearItem.def.hero!==heroIdx)return false;   // hero lock
  if(!gearItem.def||gearItem.def.slot!==slotName)return false;                   // slot match
  var current=h.gear[slotName];if(current){stash.push(current);}                 // swap out
  var idx=stash.indexOf(gearItem);if(idx>=0)stash.splice(idx,1);
  h.gear[slotName]=gearItem;
  if(slotName==='weapon'&&gearItem.def.wVis)h.wVis=gearItem.def.wVis;
  recalcHeroStats(h);snd('equip',0.4);return true;
}
```

`unequipGear` refuses when the stash is at `STASH_MAX` (20) and resets `wVis` to `'default'`. `sellGear` removes the item and adds `getSellValue()` gold.

### 23.8 Pickup

Ground drops are `Equip` entities (line 1998). Magnet radius `110 + magnetStacks*66`, pull speed 150 px/s, collect radius 42. On pickup:

- **Stash full** → the cheapest stash item is auto-sold for gold with the banner `Stash full! Auto-sold <name> (<n>g)`.
- Item pushed to `stash`, `snd('equip',.4)`, banner `<icon> <RARITY> <name>!` in the rarity colour for 3 s.
- First-ever gear pickup queues the tip `💡 Press I to open Inventory and equip your gear!` after 1.5 s.
- `equipPickupCount++`, `gameStats.equipCollected++`, quest progress `collect_items`; 5 pickups → `fullyEquipped`.
- Particle burst `8 + rarityIndex*3` particles.

Rendering scales with rarity: orb size `9 + rarIdx*1.5`, glow `12 + rarIdx*4`, name in the rarity colour, and epic/legendary add a pulsing outer ring.

### 23.9 Dungeon clear rewards (`DUNGEON_EQUIPS`, line 6737)

Applied via the **legacy** `applyEq` path on a successful dungeon exit (line 7113), so they are permanent global buffs, not gear.

| Biome | Name | Description | `stat` | Value | Colour | Icon |
|---|---|---|---|---|---|---|
| `forest` | Hearthroot Seed | +3 HP regen/s all | `regen` | `val:3` | `#58B888` | 🌿 |
| `desert` | Sunstone Crest | +12% crit chance | `critRate` | `val:0.12` | `#E8A860` | 👹 |
| `cave` | Lampstone Core | +80 max HP all | `maxHp` | `add:80` | `#8E98D8` | 💎 |
| `swamp` | Marshlight Vial | +15% lifesteal | `lifesteal` | `val:0.15` | `#70C090` | ☠️ |
| `frozen` | Hearthice Crown | Attacks slow +1s | `slow` | `add:1` | `#A8D0E8` | ❄️ |
| `volcanic` | Emberforge Heart | +12% HP, +8% DMG all | `titanHeart` | `val:1` | `#D86840` | 🌋 |

`titanHeart` is special-cased in `applyEq`: sets the global `titanHeartObtained=true` (which grants a permanent `x1.08` to every hero attack, line 2322), raises every unlocked hero's `maxHp` by 12 % and heals 12 %, and triggers `forgedInFire`.

> The Sunstone Crest writes `critRate`, but crit chance is read from `h.crit` — the desert reward has no effect (§29).

---

## 24. Loot, drops and the gold economy

### 24.1 Health potions (`Loot`, line 1758)

```js
function Loot(x,y){this.nid=netId();this.x=x;this.y=y;this.bt=rnd(0,TAU);this.gone=false;this.hp=15;}
// magnet
var magRange=160+magnetStacks*96;var collectRange=38;
if(d<collectRange){this.gone=true;var healAmt=this.hp*(questRewards.potionMul||1);
  l.hp=Math.min(l.hp+healAmt,l.maxHp);dmgN(this.x,this.y,'+'+Math.floor(healAmt),'#3DCC7A',false);
  xpFx(this.x,this.y);snd('pickup',.2);return false;}
if(d<magRange){var a=ang(this,l);this.x+=Math.cos(a)*260*dt;this.y+=Math.sin(a)*260*dt;}
```

Flat 15 HP (multiplied by the quest `potionMul` reward), pulled at 260 px/s toward the nearest living hero within 160 px (+96 per Magnet+ stack).

### 24.2 Drop tables

**Regular enemy death** (line 2806):

```js
if(Math.random()<.4)loots.push(new Loot(this.x,this.y));
var _dropChance=this.type==='troll'?.08:.03;
if(this.elite)_dropChance=0.15;
if(Math.random()<_dropChance){var _gi27=rollGearDrop(this.elite?1:0,0);equips.push(new Equip(this.x,this.y,null,_gi27));}
addXP(this.xp||5);xpFx(this.x,this.y);trigAch('firstBlood');gameStats.kills++;
```

| Source | Potion | Gear |
|---|---|---|
| Any enemy | 40 % | — |
| Regular enemy | — | 3 % (tier-1 pool) |
| Troll | — | 8 % (tier-1 pool) |
| Elite (via `onKillEffects`, line 5509) | — | +40 % chance of a tier-2 drop |
| Spawner | — | none |
| Mini-boss | — | **100 %**, tier-3 pool (`rollGearDrop(2,0)`) |
| Buried treasure secret | — | 100 %, tier-1 pool with `bonus:0.5` |
| Golden chest secret | — | 100 %, tier-1 pool with `bonus:0.5` |
| Hidden cache secret | 3 potions | — |
| Treasure goblin (world event) | — | 3 drops: one `rollGearDrop(1,1)` + two `rollGearDrop(1,0)` |
| Supply crate event | — | 3 x `rollGearDrop(0,1)` |

> The `this.elite` branch is dead — the property is `_elite`, so the 15 % elite drop path never runs and elites use the regular 3 % roll plus the 40 % bonus from `onKillEffects` (§29).

### 24.3 Gold — every source and sink

**Sources:**

| Source | Amount | Line |
|---|---|---|
| Enemy kill | `Math.floor(rnd(1,3) * NG_SCALE[ngPlus].goldMul)` | 5506 |
| Elite kill | double the above (paid twice) | 5508 |
| Spawner camp destroyed | `5` | 2856 |
| Dungeon cleared | `30` | 7114 |
| Buried treasure secret | `Math.floor(rnd(20,50))` | 9313 |
| Golden chest secret | `100` | 9316 |
| Supply crate (biplane) | `rnd(20,40)`, or `rnd(40,80)` with `storyFlags.betterDrops` | 6000 |
| Bounty claimed | `b.def.goldR` (50–120) | 1714 |
| Selling gear | `GearItem.getSellValue()` (8–1200) | 1992 |
| Auto-sell on full stash | cheapest stash item's sell value | 2014 |
| Ground-Ed quest 1 / 2 / 3 | `100` / `100` / `150` | 713–715 |
| Dev console | `+1000` | 9776 |

The kill-gold line reads `enemy.boss?20:enemy.miniBoss?rnd(5,10):rnd(1,3)` but neither flag is ever set, so **every** kill including bosses pays `rnd(1,3)` (§29).

**Sinks:** the merchant is the only one — items cost 40–200 gold (§25). There is no repair, no fast travel cost, no gear purchase.

Achievement `goldHoarder` fires at 500 gold accumulated (checked every frame while outside a dungeon, line 9312).

### 24.4 On-kill effects (`onKillEffects`, line 5493)

```js
if(h.stats)h.stats.kills++;
if(h.bloodRage>0){h._brTimer=h.bloodRage;h._brSpd=h.spd;h.spd*=1.4;}
if(h.killHeal>0){ /* every unlocked living hero: hp = min(hp+killHeal, maxHp) */ }
if(h.deathExplode>0){var aoe=Math.floor(h.dmg*h.deathExplode);
  /* every other enemy within 80 px of the corpse takes aoe */ }
if(h.ultExtend>0&&h.ultOn){h.ultDur+=h.ultExtend;}
var goldAmt=enemy.boss?20:enemy.miniBoss?rnd(5,10):rnd(1,3);
goldAmt=Math.floor(goldAmt*(NG_SCALE[ngPlus]||NG_SCALE[0]).goldMul);gold+=goldAmt;
if(enemy._elite){gold+=goldAmt; if(Math.random()<0.4){ /* tier-2 gear drop */ }
  gameStats.eliteKills=(gameStats.eliteKills||0)+1;if(gameStats.eliteKills>=25)trigAch('eliteSlayer');}
updateBountyProgress('kills',1);updateBountyProgress('gold',goldAmt);if(enemy.boss)updateBountyProgress('boss',1);
```

---

## 25. Merchant and bounty board

### 25.1 `MERCHANT_STOCK` (line 658)

```js
var MERCHANT_STOCK=[
{id:'elixir',nm:'Elixir of Power',desc:'+25% DMG for 60s',cost:80,type:'buff',val:{stat:'dmg',mul:1.25,dur:60}},
{id:'shield_pot',nm:'Shield Potion',desc:'Absorb 50 DMG',cost:60,type:'buff',val:{stat:'shield',amt:50,dur:30}},
{id:'speed_brew',nm:'Speed Brew',desc:'+30% speed for 45s',cost:50,type:'buff',val:{stat:'spd',mul:1.3,dur:45}},
{id:'mega_potion',nm:'Mega Potion',desc:'Heal all heroes to full',cost:100,type:'heal',val:{amt:9999}},
{id:'xp_tome',nm:'Tome of Knowledge',desc:'+200 team XP',cost:120,type:'xp',val:{amt:200}},
{id:'respec_scroll',nm:'Scroll of Respec',desc:'Reset 1 hero skill tree',cost:150,type:'respec',val:{}},
{id:'rare_ring',nm:'Lucky Charm',desc:'+5% crit for session',cost:200,type:'equip',val:{critBonus:0.05}},
{id:'beacon',nm:'Rally Beacon',desc:'Teleport all allies to you',cost:40,type:'teleport',val:{}}];
```

| id | Name | Cost | Type | Effect |
|---|---|---|---|---|
| `elixir` | Elixir of Power | 80 | buff | `dmg x1.25` for 60 s (active hero only) |
| `shield_pot` | Shield Potion | 60 | buff | absorb 50 for 30 s (active hero only) |
| `speed_brew` | Speed Brew | 50 | buff | `spd x1.3` for 45 s (active hero only) |
| `mega_potion` | Mega Potion | 100 | heal | every unlocked living hero to full |
| `xp_tome` | Tome of Knowledge | 120 | xp | `addXP(200)` |
| `respec_scroll` | Scroll of Respec | 150 | respec | reset active hero's tree, refund `sum(tiers)` points |
| `rare_ring` | Lucky Charm | 200 | equip | `h.crit += 0.05` permanently (active hero) |
| `beacon` | Rally Beacon | 40 | teleport | all other heroes to `activeHero +/- rnd(-30,30)` |

**Spawn and stock:** the merchant appears once `teamLv>=3` at `rnd(500, WW-500)` with the banner `A mysterious merchant has appeared!`, then relocates every `rnd(30,60)` s by `rnd(-400,400)` on each axis (clamped to 200..WW-200). `pickMerchantStock()` draws **4 distinct items** from the pool of 8. Sold items are spliced out; when the stock empties the overlay closes with `Merchant sold out!`. Interaction range 80 px on `SPACE`.

**Buff mechanics** (`getBuffMul`, line 674):

```js
function getBuffMul(hero,stat){if(!hero._buffs)return stat==='dmg'||stat==='spd'?1:0;
  var mul=1,amt=0;
  for(var i=0;i<hero._buffs.length;i++){if(hero._buffs[i].stat===stat){mul*=(hero._buffs[i].mul||1);amt+=(hero._buffs[i].amt||0);}}
  return stat==='shield'?amt:mul;}
```

Buffs live in `hero._buffs` and are decremented each frame in `Hero.update`, spliced when `t<=0`. `dmg` and `spd` buffs are read in `attack` and the movement block. **The `shield` buff amount is never read anywhere** — the Shield Potion does nothing (§29).

### 25.2 `BOUNTY_POOL` (line 680)

Twelve bounties; `rollBounties()` picks **3 distinct** at a time.

| id | Name | Description | `type` | Target | Gold | XP |
|---|---|---|---|---|---|---|
| `b_kills50` | Monster Slayer | Kill 50 enemies | `kills` | 50 | 60 | 100 |
| `b_kills100` | Exterminator | Kill 100 enemies | `kills` | 100 | 120 | 200 |
| `b_camps3` | Camp Raider | Destroy 3 spawner camps | `camps` | 3 | 80 | 75 |
| `b_dungeon` | Dungeon Diver | Clear any dungeon | `dungeon` | 1 | 100 | 150 |
| `b_boss` | Boss Hunter | Defeat any boss | `boss` | 1 | 100 | 150 |
| `b_secrets3` | Treasure Seeker | Find 3 secrets | `secrets` | 3 | 80 | 100 |
| `b_nodmg30` | Untouchable | Go 30s without taking damage | `nodmg` | 30 | 100 | 100 |
| `b_weather3` | Storm Chaser | Fight through 3 weather changes | `weather` | 3 | 60 | 75 |
| `b_sig10` | Signature Style | Use signature abilities 10 times | `sig` | 10 | 50 | 50 |
| `b_merchant` | Big Spender | Buy 3 items from merchant | `merchant` | 3 | 80 | 100 |
| `b_lvlup` | Power Surge | Gain 3 team levels | `lvlup` | 3 | 60 | 75 |
| `b_gold200` | Gold Rush | Collect 200 gold | `gold` | 200 | 50 | 100 |

```js
function updateBountyProgress(type,amt){for(var i=0;i<bounties.length;i++){var b=bounties[i];
  if(b.complete)continue;
  if(b.def.type===type){b.progress=Math.min(b.progress+(amt||1),b.def.target);
    if(b.progress>=b.def.target){b.complete=true;announce('Bounty complete: '+b.def.nm+'!','#E8A838',3);snd('questComplete',0.3);}}}}
function claimBounty(idx){var b=bounties[idx];if(!b||!b.complete||b.claimed)return;
  b.claimed=true;gold+=b.def.goldR;addXP(b.def.xpR);
  announce('+'+b.def.goldR+'g +'+b.def.xpR+' XP!','#E8A838',2);snd('pickup',0.3);
  var allClaimed=bounties.every(function(bb){return bb.claimed;});if(allClaimed)trigAch('bountyHunter');}
```

Bounties must be claimed at the board (interaction range 80 px, `SPACE`); the board shows a pulsing `!` when a completed bounty is unclaimed. Progress callers, verified by grep: `kills` and `gold` from `onKillEffects`; `camps` and `gold` from `Spawner.takeDmg`; `boss` from `onKillEffects`; `dungeon` from the dungeon-exit path; `sig` from `activateSignature`; `lvlup` from `addXP`; `merchant` from `buyItem`; `secrets` from secret discovery. **`nodmg` and `weather` are never called** — those two bounties cannot be completed (§29). `snd('questComplete')` is also not a defined sound type, so the completion cue is silent.

---

## 26. NG+ and endless scaling

### 26.1 `NG_SCALE` (line 650)

```js
var ngPlus=0,NG_MAX=5,ngPlusUnlocked=false;
var NG_SCALE=[
{enemyHp:1,enemyDmg:1,enemySpd:1,xpMul:1,goldMul:1,label:'Normal'},
{enemyHp:1.5,enemyDmg:1.3,enemySpd:1.1,xpMul:1.5,goldMul:1.5,label:'NG+1'},
{enemyHp:2.0,enemyDmg:1.6,enemySpd:1.15,xpMul:2.0,goldMul:2.0,label:'NG+2'},
{enemyHp:2.8,enemyDmg:2.0,enemySpd:1.2,xpMul:2.5,goldMul:2.5,label:'NG+3'},
{enemyHp:3.5,enemyDmg:2.5,enemySpd:1.25,xpMul:3.0,goldMul:3.0,label:'NG+4'},
{enemyHp:5.0,enemyDmg:3.0,enemySpd:1.3,xpMul:4.0,goldMul:4.0,label:'NG+5 (Max)'}
];
```

| Level | `enemyHp` | `enemyDmg` | `enemySpd` | `xpMul` | `goldMul` | Label |
|---|---|---|---|---|---|---|
| 0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | Normal |
| 1 | 1.5 | 1.3 | 1.1 | 1.5 | 1.5 | NG+1 |
| 2 | 2.0 | 1.6 | 1.15 | 2.0 | 2.0 | NG+2 |
| 3 | 2.8 | 2.0 | 1.2 | 2.5 | 2.5 | NG+3 |
| 4 | 3.5 | 2.5 | 1.25 | 3.0 | 3.0 | NG+4 |
| 5 | 5.0 | 3.0 | 1.3 | 4.0 | 4.0 | NG+5 (Max) |

**Where each field is read:**

- `enemyHp`/`enemyDmg`/`enemySpd` — `Enemy` constructor (line 2753), Citadel Warden stats (7381–7383), Citadel Shadow Spawn HP (7426). **Not** applied to `MiniBoss`, `Boss` (Goblin King), `DungeonBoss` (except the Warden), or `ShadowQueen`.
- `xpMul` — first line of `addXP` (2703).
- `goldMul` — kill gold in `onKillEffects` (5506).
- `label` — UI only.
- Also feeds the gear rarity bonus (`+ngPlus*0.5`, line 1855) and the elite roll base (`0.12+ngPlus*0.04`, line 2758).

### 26.2 Starting NG+ (`startNGPlus`, line 4245)

Unlocked by defeating the Shadow Queen (`ngPlusUnlocked=true`, line 5654).

```js
var nextNG=Math.min(ngPlus+1,NG_MAX);
var preservedHeroes=heroes.map(function(h){var p={lv:h.lv,equips:h.equips.slice(),skin:h.skin||'default',
  gear:JSON.parse(JSON.stringify(h.gear)),wVis:h.wVis||'default'};
  var sk=['lifesteal','slow','regen','dodge','reflect','crit','dmgReduction','ultChargeRate','autoRevive',
    'bloodRage','execute','thorns','shieldDur','rallyHeal','xpBonus','critMul','distBonus','burst','snareField',
    'poisonDot','deathExplode','echo','ultFreeze','iceArmor','sanctuary','spiritLink','ultExtend','fullWhirl',
    'bodyguard','immune','vortex','shockwave','multishot','arrowSlow','knockback','kbForce','teamRegen','killHeal','pierce','chain'];
  for(var i=0;i<sk.length;i++)p[sk[i]]=h[sk[i]]||0;return p;});
var pGold=gold,pST=JSON.parse(JSON.stringify(skillTrees)),pLv=teamLv,pXP=totalXP,pXPN=xpNext;
initGame();
ngPlus=nextNG;ngPlusUnlocked=true;gold=pGold;teamLv=pLv;totalXP=pXP;xpNext=pXPN;skillTrees=pST;
/* restore each hero's lv, equips, skin, gear (rebuilt as new GearItem), wVis, then recalcHeroStats, then all sk fields */
sibs=3;announce('NG+'+ngPlus+' — Enemies grow stronger!','#D84830',4);
if(ngPlus>=3)trigAch('ngPlusVeteran');
buildPortraitStrip();setTimeout(autoSave,1000);
```

**Carried over:** team level, total XP, `xpNext`, gold, skill trees (structure and points), every hero's `lv`, legacy `equips`, skin, three gear slots, weapon visual, and all 40 derived skill stats. `sibs=3` and all four heroes are set `unlocked=true` — you keep the party.
**Reset:** the world (obstacles, spawners, cages, mini-bosses, dungeon progress, quests, story flags, achievements are all rebuilt by `initGame`), and hero `hp`/base stats are recomputed by `recalcHeroStats`.
`ngPlusVeteran` fires at NG+3; `trueFinalBoss` requires clearing the Citadel at NG+5.

### 26.3 Endless mode scaling (line 6627)

Endless is a separate run mode; its structure is Part 2's remit, but the scaling formulas are:

```js
function nextEndlessWave(){
  endlessWave++;
  var isBoss=endlessWave%10===0;
  endlessBossWave=isBoss;
  // v20-fix: Sane enemy scaling — caps at 15, grows slowly
  var enemyCount=Math.min(4+Math.floor(endlessWave*0.8),15);
  var mul=1+endlessWave*0.05; // gentler scaling multiplier
  ...
  e.hp=Math.floor(e.hp*mul);e.maxHp=e.hp;e.dmg=Math.floor(e.dmg*mul);
  e.spd=Math.min(e.spd*(1+endlessWave*0.01),e.spd*2); // cap speed at 2x
  e.xp=Math.floor((e.xp||5)*(1+endlessWave*0.03)); // gentler XP scaling
}
```

| Quantity | Formula | Cap |
|---|---|---|
| Enemies per wave | `min(4 + floor(wave*0.8), 15)` | 15 |
| HP and damage multiplier | `1 + wave*0.05` | none |
| Speed multiplier | `1 + wave*0.01` | 2x base |
| XP multiplier | `1 + wave*0.03` | none |
| Boss wave | every 10th wave; enemy count `max(2, floor(count*0.4))` | — |
| Mini-boss wave | every 5th non-boss wave, 1 random type, scaled by `mul` | — |

Boss waves alternate: `bossNum=floor(endlessWave/10)`; odd → a scaled `Boss` (Goblin King), even → a scaled `ShadowQueen`, both with `hp` and `dmg` multiplied by `mul` and spawned within `rnd(-300,300)` of the active hero.

Enemy type pool grows with the wave: base `['goblin','orc','bat','slime','skeleton','mushroom']`; `+['shielded','archer','troll']` at wave 10; `+['fire_elemental','obsidian_guard']` at wave 20.

`endlessHighScore` is persisted separately in `localStorage` under `ssq_highscore`.

---

## 27. Achievements

**`achievements` — line 881.** A flat object of `{nm, icon, desc, done}` records; `trigAch(key)` is idempotent.

```js
function trigAch(key){
  if(!achievements[key]||achievements[key].done)return;
  achievements[key].done=true;
  achQueue.push({nm:achievements[key].nm,icon:achievements[key].icon,timer:3.5});
  snd('achieve',0.3);
}
```

Thirty-one achievements. Unlock conditions verified by grepping every `trigAch` call site.

| Key | Name | Icon | Description | Unlock condition (source) |
|---|---|---|---|---|
| `firstBlood` | First Blood | 🗡️ | Kill your first enemy | Any `Enemy` death (2806) |
| `squadAssembled` | Squad Assembled | 👨‍👩‍👧‍👦 | Rescue all 3 siblings | `sibs>=3` on cage open (2864) |
| `campCrusher` | Camp Crusher | 🏕️ | Destroy your first camp | Spawner HP reaches 0 (2856) |
| `miniBossSlayer` | Mini-Boss Slayer | 💀 | Defeat any mini-boss | `MiniBoss.takeDmg` kill (2974) |
| `kingSlayer` | King Slayer | 👑 | Defeat the Goblin King | `Boss.takeDmg` kill (3221) |
| `ultPower` | Ultimate Power | ⚡ | Use an ultimate ability | First line of `actUlt` (2669) |
| `fullyEquipped` | Fully Equipped | 🎒 | Pick up 5 equipment items | `equipPickupCount>=5` (2022) |
| `nightWarrior` | Night Warrior | 🌙 | Kill 10 enemies at night | `nightKills>=10` (2806) |
| `dungeoneer` | Dungeoneer | 🏰 | Clear your first dungeon | Successful dungeon exit (7113) |
| `eventSurvivor` | Event Survivor | 🌟 | Survive a blood moon event | Blood moon world event end |
| `shadowSlayer` | Shadow Slayer | 👻 | Defeat the Shadow Queen | `ShadowQueen.takeDmg` kill (5655) |
| `forgedInFire` | Forged in Fire | 🌋 | Defeat the Magma Titan | `applyEq` with `stat:'titanHeart'` (2062) |
| `treasureHunter` | Treasure Hunter | 💰 | Catch a treasure goblin | Treasure goblin world event |
| `questMaster` | Quest Master | 📜 | Complete all 15 NPC quests | Quest completion counter |
| `sigMaster` | Signature Style | 🎯 | Use all 4 hero signatures in one session | Signature tracking |
| `skinCollector` | Fashionista | 👗 | Unlock 4+ skins | Skin unlock check |
| `mvpStreak` | MVP | 👑 | Get MVP 3 times | Victory-stats MVP counter |
| `secretFinder` | Secret Finder | 🔍 | Find your first hidden secret | Any secret discovered (9317) |
| `goldHoarder` | Gold Hoarder | 💰 | Accumulate 500 gold | `gold>=500`, polled each frame (9312) |
| `stormChaser` | Storm Chaser | ⛈️ | Fight through 5 thunderstorms | Weather change counter |
| `bountyHunter` | Bounty Hunter | 📜 | Complete all 3 bounties in one session | All bounties `claimed` (1714) |
| `citadelConqueror` | Citadel Conqueror | 🏯 | Clear the Shadow Citadel | Citadel completion |
| `comboMaster` | Combo Master | ⚡ | Use 3 different combo ultimates | `gameStats.uniqueCombos.length>=3` (2662) |
| `ngPlusVeteran` | NG+ Veteran | 🔄 | Complete NG+3 or higher | `ngPlus>=3` in `startNGPlus` (4259) |
| `legendaryHero` | Legendary Hero | ⭐ | Obtain all 4 legendary items | Legendary collection check |
| `eliteSlayer` | Elite Slayer | 💀 | Defeat 25 elite enemies | `gameStats.eliteKills>=25` (5510) |
| `trueFinalBoss` | True Final Boss | 👑 | Clear Citadel on NG+5 | Citadel completion at `ngPlus===5` |
| `wellEducated` | Well-Ed-ucated | ✈️ | Complete the Ground-Ed questline | `ground_ed_3` completion |
| `groundControl` | Ground Control | 🌌 | Discover the alien crater | `ALIEN_CRATER.discovered` |
| `edsLanding` | Ed's Landing | 💫 | Survive a dungeon with 1 HP | Any unlocked living hero at `hp===1` on dungeon exit (7114) |
| `frequentFlyer` | Frequent Flyer | ✈️ | Witness 10 biplane flyovers | `biplane.flyoverCount>=10` |

Achievements are saved as a flat `{key: bool}` map and restored on load. There is no reward attached to any achievement other than the hero-skin unlock tokens (§4), which read game state directly rather than the achievement flags.

---

## 28. Save schema

**`SAVE_VERSION=10` — line 1123.**

### 28.1 Storage layout

| localStorage key | Contents |
|---|---|
| `ssq_save_1`, `ssq_save_2`, `ssq_save_3` | Manual save slots (JSON). |
| `ssq_autosave` | Auto-save slot (JSON), same shape. |
| `ssq_meta` | `{slot: {teamLv, sibs, playTime, difficulty, dungeonsClear, questsDone, timestamp, gameWon, endlessMode}}` for slots `1`, `2`, `3` and `auto`. |
| `ssq_settings` | The `settings` object (§2). |
| `ssq_keybinds` | The `keyBinds` map. |
| `ssq_highscore` | Endless high score (integer). |
| `ssq_test` | Written and removed by `storageOK()` to probe availability. |

`autoSave()` refuses to run while `inDungeon || gameOver || showLvl`. Auto-save fires on: cage rescue (+500 ms), every fifth team level (+500 ms), Goblin King death (via the portal chain), Shadow Queen death (+2 s), successful dungeon exit (+1 s), and NG+ start (+1 s).

### 28.2 `buildSaveData()` — every field (line 1127)

**Top-level:**

| Field | Type | Notes |
|---|---|---|
| `version` | int | `SAVE_VERSION` (10) |
| `timestamp` | int | `Date.now()` |
| `playTime` | int | Seconds since `gameStats.startTime` |
| `difficulty` | int | 0/1/2 |
| `heroes` | array[4] | See below |
| `activeHero` | int | |
| `teamLv`, `totalXP`, `xpNext` | int | |
| `skillTrees` | deep copy | `{0..3: {branches:[{key,tier,capstone}x3], points}}` |
| `waveNum`, `sibs` | int | |
| `noiseSeed` | number | World generation seed |
| `cam` | `{x,y}` | |
| `dayTime` | number | |
| `spawners` | array | `{x,y,hp,dead}` |
| `cages` | array | `{x,y,heroIdx,opened}` |
| `npcs` | array | `{nm,x,y,visited}` |
| `miniBosses` | array | `{type,x,y,hp,dead}` |
| `dungeonEntrances` | array | `{x,y,biome}` |
| `obstacles` | array | `{x,y,r,type,biome,color,th}` |
| `bossUp`, `bossDefeated` | bool | |
| `portalOpen`, `portalX`, `portalY` | bool/number | |
| `shadowQueenDefeated` | bool | |
| `dungeonProgress` | object | per-biome bool |
| `titanHeartObtained` | bool | |
| `bossEncountered`, `bossDefeated2` | object | per-biome bool (bestiary) |
| `questLog`, `activeQuests` | object/array | |
| `biomeBuff`, `questRewards` | object | |
| `magnetStacks`, `equipPickupCount` | int | |
| `stash` | array | `{key,rarity,id}` per item (max 20) |
| `_gearIdCounter` | int | |
| `tutorialGearShown` | bool | |
| `achievements` | object | `{key: done}` flattened |
| `nightKills` | int | |
| `gameOver`, `gameWon` | bool | |
| `endlessMode`, `endlessWave`, `endlessScore`, `endlessHighScore` | mixed | |
| `gold` | int | |
| `secretsFound` | array | `{type, x, y}` (floored) for found secrets only |
| `gameStats` | object | kills, dmgDealt, equipCollected, miniBossesKilled, startTime, secretsFound, comboUltsUsed, eliteKills, uniqueCombos |
| `ngPlus`, `ngPlusUnlocked` | int/bool | |
| `citadelProgress`, `citadelFloor` | object/int | `{floor1,floor2,floor3}` |
| `tutorial` | `{step, active}` | |
| `storyFlags` | object | edMet, edGoggles, edEdibles, edQuestComplete, betterDrops, craterDiscovered, edSpaceHints, meteorSeen, craterVisited, edCraterDialogue |
| `edQuestPhase`, `edCrashCount`, `biplaneSeen` | int | |
| `biplaneHasCrashed`, `biplaneCrashReady`, `biplaneFlyoverCount`, `edFlightCooldown` | mixed | |
| `questItemsCollected` | array | item keys |
| `questItems` | object | per key: `{spawned, collected, x, y, ambushDone}` |
| `craterDiscovered` | bool | `ALIEN_CRATER.discovered` |
| `flavorMarkersFound` | array | `{x, y}` for found markers |

**Per-hero record** (`data.heroes[i]`):

`nm, hp, maxHp, dmg, spd, rng, cd, lv, idx, unlocked, dead, downed, banished, x, y, equips, gear{weapon,armor,accessory each as {key,rarity,id}|null}, wVis, lifesteal, slow, regen, dodge, reflect, crit, dmgReduction, ultTimer, ultMax, ultChargeRate, autoRevive, bloodRage, execute, thorns, shieldDur, rallyHeal, xpBonus, critMul, distBonus, ultCount, burst, snareField, poisonDot, deathExplode, echo, ultFreeze, iceArmor, sanctuary, spiritLink, ultExtend, fullWhirl, bodyguard, immune, vortex, shockwave, multishot, arrowSlow, knockback, kbForce, teamRegen, killHeal, pierce, chain, skin, sigTimer`

That is 62 fields per hero. Note `h.stats` (the per-hero kill/damage counters that drive mastery titles) is **not** saved — mastery resets on every load.

### 28.3 Dungeon saves

Saving inside a dungeon is allowed but writes the **overworld snapshot** taken at dungeon entry, flagged `_dungeonSave:true`:

```js
if(inDungeon){if(dungeonEntrySnapshot){var snapData=buildSaveData();var snap=dungeonEntrySnapshot;
  snapData.heroes=snap.heroes;snapData.teamLv=snap.teamLv;snapData.totalXP=snap.totalXP;snapData.xpNext=snap.xpNext;
  snapData.activeHero=snap.activeHero;snapData.cam=snap.cam;snapData.waveNum=snap.waveNum;snapData.bossUp=snap.bossUp;
  snapData.bossDefeated=snap.bossDefeated;snapData.sibs=snap.sibs;snapData.dayTime=snap.dayTime;
  snapData.skillTrees=snap.skillTrees;snapData.dungeonProgress=snap.dungeonProgress;
  if(snap.gold!==undefined)snapData.gold=snap.gold;snapData._dungeonSave=true;
  localStorage.setItem('ssq_save_'+slot,JSON.stringify(snapData));...
  announce('Overworld saved to Slot '+slot+' (dungeon progress not saved)','#E8A838',3);}}
```

`serializeOverworldState()` / `deserializeOverworldState()` (lines 7063–7064) are a separate, in-memory snapshot pair used for dungeon entry/exit — a similar but not identical hero field list (it adds `rootEvery`, `slowDur`, `frozenDmg` and omits `banished` handling differences).

### 28.4 Migrations (`migrateSave`, line 1192)

Runs before `applyLoadData`. Each step is cumulative and bumps `data.version`.

| To version | Game version | Changes |
|---|---|---|
| 1 | v11 | Default `questLog`, `activeQuests`, `biomeBuff` (5 biomes), `questRewards` `{mapEnemies:false,poisonImmune:false,potionMul:1,xpMul:1}`, `bossEncountered`, `bossDefeated2`, and all achievements set false. |
| 2 | v14 | Add `dungeonProgress.volcanic=false`; add `titanHeartObtained=false`. |
| 3 | v17 | **Skill tree restructure.** Old `{b:[keys], t:[tiers]}` becomes `{branches:[{key,tier,capstone:'a'}], points:0}`, using the hardcoded `_bMap` (identical to `HERO_BRANCHES`). Unknown/missing trees are rebuilt from scratch at tier 0. |
| 4 | v18 | Every hero gets `skin='default'` and `sigTimer=0`. |
| 5 | v19 | Add `gold=0`, `secretsFound=[]`, `gameStats` skeleton, `gameStats.secretsFound`. |
| 6 | v20 | Ensure `gameStats`; add `ngPlus`, `ngPlusUnlocked`, `citadelProgress={floor1,floor2,floor3}`, `citadelFloor=0`, `gameStats.comboUltsUsed`, `gameStats.eliteKills`. |
| 7 | v21 | Add `tutorial={step:7,active:false}` (i.e. treat old saves as tutorial-complete). |
| 8 | v22 | Add `storyFlags` skeleton, `edQuestPhase`, `edCrashCount`, `biplaneSeen`, `questItemsCollected`, `flavorMarkersFound`, and the three `ground_ed_*` quest log entries as `available`. |
| 9 | v25 | Add `storyFlags.meteorSeen`, `.craterVisited`, `.edCraterDialogue`. |
| 10 | v27 | **Gear system.** Ensure `stash=[]` and `_gearIdCounter=0`. For each hero, create `gear={weapon,armor,accessory}` and map every legacy `equips` entry into it. |

The v27 legacy→gear mapping (lines 1230–1252):

```js
var _matchKey=null;
for(var _gk in GEAR_DB){if(GEAR_DB[_gk].nm===_old.nm){_matchKey=_gk;break;}}   // exact name match first
if(!_matchKey){                                                                // fuzzy fallback by stat
  if(_old.stat==='dmg')_matchKey='w_sword';
  else if(_old.stat==='maxHp')_matchKey='a_leather';
  else if(_old.stat==='spd')_matchKey='x_boots';
  else if(_old.stat==='lifesteal')_matchKey='x_fang';
  else _matchKey='x_boots';
}
var _newItem={key:_matchKey,rarity:_old.legendary?'legendary':'uncommon',id:++data._gearIdCounter};
var _slot=GEAR_DB[_matchKey].slot;
if(!_mh.gear[_slot])_mh.gear[_slot]=_newItem;else data.stash.push(_newItem);
data.tutorialGearShown=true; // Don't show tutorial for migrated saves
```

Every migrated legacy item becomes at least uncommon; the first item per slot is equipped and the rest go to the stash (which can therefore exceed `STASH_MAX` on migration).

### 28.5 Load (`applyLoadData`, line 1241)

Order: `migrateSave(data)` → `initGame()` (rebuilds the world from `noiseSeed`) → restore difficulty and seed → per-hero restore (including rebuilding `GearItem` objects from `{key,rarity,id}`) → team/skill-tree state → entities (spawners, cages, npcs, mini-bosses — dead mini-bosses are skipped, dungeon entrances, obstacles) → boss/portal state (`if(bossUp&&!bossDefeated)spawnBoss()`) → quests → stash → **`recalcHeroStats` for every unlocked hero** → day/camera/achievements → gold and secrets → NG+/citadel → tutorial → legendary `fx` re-application → story/biplane/quest-item state.

Downed heroes are restored with `reviveTimer=5` rather than 20. `dungeonEntryCooldown=3` after every load to stop instant re-entry.

**There is no export or import of save files in v27** — no file download, no clipboard/base64 blob, no `exportSave`/`importSave` function anywhere in the source. Saves live only in this origin's `localStorage`. `deleteSave(slot)` removes a slot and its meta entry.

---

## 29. Oddities, bugs and dead code

Recorded so the rebuild reproduces intent rather than accident. Each is verified against the source.

**Systems defined but never invoked**

| Item | Line | Note |
|---|---|---|
| `createPhaseBoss` | 3044 | The whole generic phase machine is unused; every boss hand-rolls its phases. |
| `BOSS_BLOCKS.tether` / `updateTether` / `drawTether` | 5106–5132 | Never called by any boss; the anchor also has no hit detection. |
| `BOSS_BLOCKS.containment` / `updateContainment` / `drawContainment` | 5198–5220 | Never called; nothing decrements the field HP, so only `maxTime` ends it. |
| `BOSS_BLOCKS.summonShield` | 5318 | A stub — no update, no draw, no add spawning, no `takeDmg` integration. |
| `applySkillEffects()` | 5487 | Empty function body. |
| `applySkillTier()` | 6464 | Legacy stub, still exported and callable. |

**Stat fields written but never read**

| Field | Where set | Should do |
|---|---|---|
| `immune` (Unstoppable capstone) | `chooseCapstone` | Prevent slow/stun/knockback — no code reads it. |
| `critRate` (Sunstone Crest, desert dungeon reward) | `applyEq` line 2053 | Crit chance reads `h.crit`, not `h.critRate`. The reward does nothing. |
| `p.chain` (Chain Spell, Phantom Blades) | `Hero.attack` line 2336 | Set on the projectile, never consumed — magic never bounces. |
| `rootEvery` (Root Shot) | `investSkill` | No rooting code exists. |
| `slowDur` (Permafrost) | `investSkill` | Slow durations are hard-coded. |
| `frozenDmg` (Shatter) | `investSkill` | No frozen-target damage bonus code. |
| `aoe` (War Hammer gear stat) | `recalcHeroStats` | Additive onto `h.aoe`, read nowhere. |
| `getBuffMul(h,'shield')` | 669 | The Shield Potion's absorb amount is never queried — a 60-gold no-op. |
| `_realIdx`, `_scarabOnHit` (Pharaoh Wraith P3) | 7524–7529 | The phantom puzzle is never resolved in logic. |

**Flags tested but never assigned**

| Test | Line | Consequence |
|---|---|---|
| `this.elite` in `Enemy.takeDmg` | 2806 | The 15 % elite gear drop path is dead (the field is `_elite`). |
| `enemy.boss`, `enemy.miniBoss` in `onKillEffects` | 5506 | Every kill pays `rnd(1,3)` gold, including bosses and mini-bosses; `updateBountyProgress('boss',...)` never fires from a kill. |
| `boss.miniBoss` / `boss.boss` guard in the elite roll | 2762 | Harmless — no boss uses the `Enemy` constructor. |

**Broken calls**

- **Magma Titan Lava Spray** (line 7620) calls `new Proj(x, y, Math.cos(la)*ls, Math.sin(la)*ls, 5, this.dmg, '#ff6348', false, true)` — the pre-v13 nine-argument signature — against the current `Proj(x, y, angle, speed, opts)`. The third argument is treated as an angle in radians and the fourth as a speed, so the spray fires in nonsense directions at nonsense speeds, and `opts` is the number `5`, meaning `dmg` falls back to the default 10.
- **`recalcHeroStats` skill re-application** (lines 1921–1938) reads `br.t1`, `br.t2` and `br.capChosen`, but `initSkillTrees` creates `{key, tier, capstone}`. Every call to `recalcHeroStats` — which happens on equip, unequip, load and NG+ start — therefore resets a hero to `HDEFS` base + level + gear and **silently drops all skill-tree bonuses**. The dungeon-exit code at lines 7108–7120 works around this by snapshotting 41 stat fields before `deserializeOverworldState` and restoring them afterwards.
- **Respec does not revert stats** (line 1720). It zeroes `tier` and refunds points but the stat mutations from `investSkill`/`chooseCapstone` were applied in place with no baseline, so a respec is a permanent free stat gain that can be repeated for 150 gold.
- **Kid Snatch voice-line colour** (line 5236) uses `HDEFS[captured[0]].col` for every line rather than the speaking hero's own colour.
- **`drawCagedHUD`** (line 5303) applies a greyscale filter to captured heroes' portrait elements but never removes it, so portraits stay dimmed after release until the strip is rebuilt.
- **Magma Titan armour direction** (line 7644) computes the plate index from `dirs=['e','n','w','s']` but the plates were built in the order `n, s, e, w`, so the announced compass letter does not match the side attacked.
- **Lifesteal is melee-only** — the lifesteal block sits inside the `aType==='melee'` branch (line 2334), so Noah, Collette and Isabella gain nothing from Vampire Fang, Marshlight Vial or the Vampiric level-up card.
- **`pierce` is boolean at the projectile level** — `pierce: self2.pierce>0`, so the Sharpshooter "pierce 2 enemies" node and `pierce:99` behave identically (pierce everything).
- **`h.stats` is not saved**, so mastery titles reset to Novice on every load.
- **Two bounties are uncompletable:** nothing calls `updateBountyProgress('nodmg',…)` or `('weather',…)`, so *Untouchable* and *Storm Chaser* can never finish. `snd('questComplete')` is also not a defined sound type in `snd()`, so bounty completion is silent.
- **Legendary-rarity drops are unreachable.** `rollGearDrop(3, …)` — the boss tier — is never called; the highest tier used is 2 (mini-boss), which caps rarity at epic.
- **`ETYPES` holds seventeen types**, not the sixteen the Brief cites.
- **Attack cooldown has no floor.** `cd` is only ever multiplied down (`0.7`, `0.92`) and added to by negative gear values, so it can reach zero or below.
- **`cageY`** is computed in `Boss.takeDmg` (line 3218) and never used; the actual cage-hit test is `src.y < this.y-10`.
- **Colour canon drift:** the Brief describes Noah as orange and Isabella as pink/red; `HDEFS` ships Noah green (`#2DB86A`) and Isabella gold (`#F0C040`).


---


> Part 1 above covers core gameplay data and formulas (heroes, skills, enemies, bosses, `BOSS_BLOCKS`, combat, gear, loot, NG+, achievements, save schema). Part 2 below covers world generation, biomes, weather and day/night mechanics, quests, dialogue mechanics, NPCs and Grandpa Ed, world events, endless mode, dungeon structure, tutorial and cutscene mechanics, arena effects, particles, overlays/HUD, input, the main loop, networking, and the dev console. Both parts were extracted from `docs/legacy/stewart-squad-v27.html` on 2026-09-06 and merged into this single file per Brief §3.

# SYSTEMS INVENTORY — PART 2: World, Structure & Meta

Part 2 of the v27 teardown covers everything outside the hero/combat/progression core: the noise-driven world, weather, day/night, quests, dialogue mechanics, NPCs and Grandpa Ed, world events, endless mode, the dungeon engine, tutorial/cutscene/arena/boss-intro systems, particles and projectiles, the HTML overlay + HUD layer, input, the main loop, networking, and the dev console.
Source of truth is `docs/legacy/stewart-squad-v27.html` (9,901 lines). Heroes, abilities, combo ults, XP/leveling, skill trees, enemies, boss phase system, `BOSS_BLOCKS`, individual bosses, combat formulas, gear/equipment, loot, merchant stock, bounties, `NG_SCALE`, achievements and the save schema are **Part 1** — see Part 1 for those.

---

## Table of Contents

1. [Utils, RNG & Seeded Noise](#1-utils-rng--seeded-noise)
2. [World Constants & Biome System](#2-world-constants--biome-system)
3. [World Generation, Landmarks & Init](#3-world-generation-landmarks--init)
4. [Weather System](#4-weather-system)
5. [Day/Night Cycle](#5-daynight-cycle)
6. [Quest System](#6-quest-system)
7. [Dialogue System Mechanics](#7-dialogue-system-mechanics)
8. [NPCs, Grandpa Ed & the Biplane](#8-npcs-grandpa-ed--the-biplane)
9. [World Events](#9-world-events)
10. [Endless Mode](#10-endless-mode)
11. [Dungeon System](#11-dungeon-system)
12. [Tutorial System](#12-tutorial-system)
13. [Cutscene System](#13-cutscene-system)
14. [Arena Effect System & Boss Intro](#14-arena-effect-system--boss-intro)
15. [Particles, VFX & Projectiles](#15-particles-vfx--projectiles)
16. [Overlay / UI Structure & HUD](#16-overlay--ui-structure--hud)
17. [Input](#17-input)
18. [Main Loop & Init Ordering](#18-main-loop--init-ordering)
19. [Networking](#19-networking)
20. [Dev Console & Scenarios](#20-dev-console--scenarios)
21. [Gaps, Oddities & Dead Code](#21-gaps-oddities--dead-code)

---

## 1. Utils, RNG & Seeded Noise

**Legacy lines:** `// ===== UTILS =====` L579–L585; `// ===== NOISE FUNCTIONS (Seeded value noise for organic biomes) =====` L1520–L1544.

### 1.1 Base helpers (L580–L585)

```js
const PI=Math.PI,TAU=PI*2;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,mn,mx)=>Math.max(mn,Math.min(mx,v));
const dst=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ang=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
```

`dst` is Euclidean distance between two objects carrying `.x/.y`; `ang` is the bearing from `a` to `b`; `rnd(a,b)` is a uniform float in `[a,b)`; `pick` chooses a uniform random array element; `rrect` builds a rounded-rectangle path on a 2D context.

**RNG note (load-bearing for the port):** the only random source in v27 is `Math.random()`. Nothing is seeded except the biome noise below. Obstacle scatter, NPC placement, loot rolls, weather picks, bounty rolls and dungeon layout are all unseeded, so a save/reload does **not** reproduce them — they are re-rolled by `initGame()`. Only `noiseSeed` is persisted and synced.

### 1.2 Seeded value noise (L1521–L1544)

```js
var noiseSeed=0;
function initNoiseSeed(){noiseSeed=Math.floor(Math.random()*100000);}
function hashN(x,y){
  var n=noiseSeed+x*374761393+y*668265263;
  n=(n^(n>>13))*1274126177;
  n=n^(n>>16);
  return(n&0x7fffffff)/0x7fffffff;
}
```

`hashN` is an integer-lattice hash: it mixes the seed with two large primes (one per axis), applies two xor-shift/multiply rounds, masks off the sign bit and normalises to `[0,1)`.

```js
function smoothNoise(x,y){
  var ix=Math.floor(x),iy=Math.floor(y);
  var fx=x-ix,fy=y-iy;
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  var v00=hashN(ix,iy),v10=hashN(ix+1,iy),v01=hashN(ix,iy+1),v11=hashN(ix+1,iy+1);
  var a=v00+(v10-v00)*fx,b=v01+(v11-v01)*fx;
  return a+(b-a)*fy;
}
```

`smoothNoise` is classic 2D value noise: four lattice hashes bilinearly interpolated after smoothstep easing `t*t*(3-2t)` on both axes.

```js
function fbmNoise(x,y,octaves){
  var val=0,amp=1,freq=1,maxVal=0;
  for(var i=0;i<octaves;i++){
    val+=smoothNoise(x*freq,y*freq)*amp;
    maxVal+=amp;amp*=0.5;freq*=2;
  }
  return val/maxVal;
}
```

`fbmNoise` sums `octaves` layers of value noise with amplitude halving and frequency doubling per octave, then divides by the total amplitude so the result stays in `[0,1)`.

`noiseSeed` is the one piece of world randomness transmitted to guests — `buildStaticWorldData()` (L8788) sends it, `netApplyWorldInit()` (L1512) assigns it and clears `biomeCache`.

---

## 2. World Constants & Biome System

**Legacy lines:** `// ===== STATE =====` L586–L624; `// ===== BIOME SYSTEM (Noise-based organic boundaries) =====` L1546–L1600.

### 2.1 Constants

| Constant | Line | Value | Meaning |
|---|---|---|---|
| `WW`, `WH` | L587 | `3200`, `3200` | Overworld is a fixed 3200 x 3200 px square. No wrapping. |
| `WORLD_ZOOM` | L590 | `1.30` default | Global canvas zoom about screen centre. Settings offers `1.0 / 1.15 / 1.30`. |
| `MAX_PARTICLES` | L620 | `250` | Cap on `parts[]` after the per-frame filter in `update()`. |
| `MAX_WEATHER` | L620 | `80` | Cap on `weatherP[]` in `updWeather()`. |
| `MAX_PROJS` | L620 | `150` | Cap on `projs[]` after the per-frame filter. |
| `tutorialTimer` | L624 | `15` | Legacy standalone tutorial timer, superseded by the `tutorial` object (§12). |

Zoom helpers (L591–L593):

```js
function beginWorldZoom(){ctx.save();ctx.translate(W/2,H/2);ctx.scale(WORLD_ZOOM,WORLD_ZOOM);ctx.translate(-W/2,-H/2);}
function endWorldZoom(){ctx.restore();}
function unzoomScreenPoint(sx,sy){return{x:(sx-W/2)/WORLD_ZOOM+W/2,y:(sy-H/2)/WORLD_ZOOM+H/2};}
```

`beginWorldZoom` scales the canvas about its centre; `unzoomScreenPoint` is its inverse, used to convert mouse/touch coordinates back to pre-zoom screen space before adding `cam`.

### 2.2 Biome names (L1548)

| Key | Display name |
|---|---|
| `forest` | Enchanted Forest |
| `cave` | Crystal Caves |
| `desert` | Scorching Sands |
| `swamp` | Murky Swamp |
| `frozen` | Frozen Peaks |

There is no sixth *overworld* biome. `volcanic`, `citadel` and `citadel_f1..f3` exist only as dungeon biome keys.

### 2.3 `getBiome(x,y)` — noise-scored organic boundaries (L1550–L1575)

```js
var biomeCache={};
function getBiome(x,y){
  // Cache at tile resolution (60px)
  var tx=Math.floor(x/60),ty=Math.floor(y/60);
  var key=tx+','+ty;
  if(biomeCache[key]!==undefined)return biomeCache[key];
  var nx=x/WW,ny=y/WH;
  // Sample noise at different scales for variety
  var n1=fbmNoise(nx*6+0.5,ny*6+0.5,3);
  var n2=fbmNoise(nx*4+100,ny*4+100,2);
  // Distance from center for forest core
  var dc=Math.hypot(nx-0.5,ny-0.5);
  // Combine noise with position bias for biome placement
  // Forest stays near center, others around edges
  var forestScore=0.6-dc*1.5+n1*0.3;
  var caveScore=-0.1+(1-nx)*(1-ny)*0.8+n2*0.35-dc*0.2;
  var desertScore=-0.1+nx*(1-ny)*0.8+n1*0.3-dc*0.2;
  var swampScore=-0.1+ny*0.7+n2*0.3-dc*0.15;
  var frozenScore=-0.2+(1-ny)*0.5+nx*0.2+n1*0.4-0.15;
  // Forest gets a small bias to ensure center is always forest
  if(dc<0.12)forestScore+=0.5;
  var scores={forest:forestScore,cave:caveScore,desert:desertScore,swamp:swampScore,frozen:frozenScore};
  var best='forest',bestVal=-999;
  for(var b in scores){if(scores[b]>bestVal){bestVal=scores[b];best=b;}}
  biomeCache[key]=best;
  return best;
}
```

Each biome gets a scalar score from normalised position plus a corner/edge bias plus one of two fbm samples; the highest score wins and the answer is memoised per 60 px tile.

| Biome | Positional bias | Noise term |
|---|---|---|
| forest | strong pull to centre `0.6 - dc*1.5`, plus `+0.5` inside `dc < 0.12` | `n1 * 0.3` |
| cave | top-left corner `(1-nx)*(1-ny)*0.8`, `-dc*0.2` | `n2 * 0.35` |
| desert | top-right corner `nx*(1-ny)*0.8`, `-dc*0.2` | `n1 * 0.3` |
| swamp | bottom edge `ny*0.7`, `-dc*0.15` | `n2 * 0.3` |
| frozen | top edge + right lean `(1-ny)*0.5 + nx*0.2`, constant `-0.35` | `n1 * 0.4` |

`biomeCache` is cleared in `genWorld()` (L2093), `initGame()` (L8280) and `netApplyWorldInit()` (L1512). `buildMinimapGrid()` (L3379) bakes a 20 x 20 sample of `getBiome` into `minimapBiomeGrid` using `{forest:'#162E20',cave:'#1C2040',desert:'#604828',swamp:'#143018',frozen:'#384868'}`.

### 2.4 Blending at boundaries (L1577–L1585)

```js
function getBiomeBlend(x,y){
  var b0=getBiome(x,y);
  var step=30;
  var neighbors=[getBiome(x+step,y),getBiome(x-step,y),getBiome(x,y+step),getBiome(x,y-step)];
  for(var i=0;i<neighbors.length;i++){
    if(neighbors[i]!==b0)return{biome:b0,neighbor:neighbors[i],blend:0.35};
  }
  return{biome:b0,neighbor:null,blend:0};
}
```

A point counts as "in transition" if any of its four 30 px-offset neighbours resolves to a different biome; the blend weight is a flat `0.35` toward the first differing neighbour — there is no distance-based falloff.

### 2.5 Ground palettes (L1587–L1600)

```js
function bioCol(b){
  if(b==='forest')return{g:'#1E4A3A',gd:'#163828',tc:'#58B888',td:'#2E7A58'};
  if(b==='desert')return{g:'#6A4E30',gd:'#5A3E28',tc:'#E8A860',td:'#C08040'};
  if(b==='cave')return{g:'#2A3058',gd:'#222848',tc:'#8E98D8',td:'#6870B0'};
  if(b==='swamp')return{g:'#2A4838',gd:'#1E3428',tc:'#70C090',td:'#408868'};
  if(b==='frozen')return{g:'#4A6898',gd:'#3E5478',tc:'#A8D0E8',td:'#78A8D0'};
  return{g:'#1E4A3A',gd:'#163828',tc:'#58B888',td:'#2E7A58'};
}
```

| Biome | `g` ground | `gd` ground dark | `tc` accent | `td` accent dark |
|---|---|---|---|---|
| forest | `#1E4A3A` | `#163828` | `#58B888` | `#2E7A58` |
| desert | `#6A4E30` | `#5A3E28` | `#E8A860` | `#C08040` |
| cave | `#2A3058` | `#222848` | `#8E98D8` | `#6870B0` |
| swamp | `#2A4838` | `#1E3428` | `#70C090` | `#408868` |
| frozen | `#4A6898` | `#3E5478` | `#A8D0E8` | `#78A8D0` |

`lerpColor(c1,c2,t)` (L1596) parses two hex strings to RGB and returns an interpolated `rgb(...)` string — the ground renderer pairs it with `getBiomeBlend().blend` to soften seams.

### 2.6 Biome gameplay buffs

Quest rewards write into `biomeBuff` (L720, `{forest:{},cave:{},desert:{},swamp:{},frozen:{}}`) and `getBiomeBuff(stat)` (L746) reads the **active hero's current biome**, returning the stat or a neutral value (`1` for `dmgMul`/`spdMul`/`atkSpdMul`, `0` otherwise). §6 lists which quest grants which buff.

---
## 3. World Generation, Landmarks & Init

**Legacy lines:** `// ===== OBSTACLES =====` L2090–L2136 (`genWorld`, `drawObs`); `// ===== INIT =====` L8257–L8340 (`initGame`); portal L5713–L5740.

### 3.1 Landmark clearance (L2094–L2097)

`genWorld()` builds a landmark exclusion list first, then rejects any scatter point inside one of those discs:

```js
var _crX=ALIEN_CRATER.x,_crY=ALIEN_CRATER.y,_crR=ALIEN_CRATER.radius+50;
// Known landmark positions to keep clear
var _landmarks=[{x:_crX,y:_crY,r:_crR},{x:WW*.22,y:WH*.22+80,r:80},{x:WW*.78,y:WH*.22+80,r:80},{x:WW*.5,y:WH*.82+80,r:80},{x:WW*.50,y:WH*.08+80,r:80},{x:WW*.5+100,y:WH*.5,r:80},{x:ED_LANDING.x,y:ED_LANDING.y,r:80}];
function _clearOfLandmarks(px,py){for(var li=0;li<_landmarks.length;li++){if(dst({x:px,y:py},_landmarks[li])<_landmarks[li].r)return false;}return true;}
```

Seven discs are protected: the alien crater (radius 150), the five dungeon-entrance sites, and Ed's landing strip (radius 80 each).

| Landmark | Position | Clear radius |
|---|---|---|
| Alien crater | `(2844, 305)` (set in `initGame`, L8281) | `ALIEN_CRATER.radius + 50` = 150 |
| Cave dungeon | `(WW*0.22, WH*0.22+80)` = `(704, 784)` | 80 |
| Desert dungeon | `(WW*0.78, WH*0.22+80)` = `(2496, 784)` | 80 |
| Swamp dungeon | `(WW*0.5, WH*0.82+80)` = `(1600, 2704)` | 80 |
| Frozen dungeon | `(WW*0.50, WH*0.08+80)` = `(1600, 336)` | 80 |
| Forest dungeon | `(WW*0.5+100, WH*0.5)` = `(1700, 1600)` | 80 |
| Ed's landing (`ED_LANDING`) | `(floor(WW*0.35), floor(WH*0.35))` = `(1120, 1120)` | 80 |

After `genWorld()` returns, `initGame()` does a **second** clearance sweep specifically for the landing strip (L8283):

```js
for(var _oi=obstacles.length-1;_oi>=0;_oi--){if(dst(obstacles[_oi],ED_LANDING)<80)obstacles.splice(_oi,1);}
```

### 3.2 Obstacle scatter table (L2098–L2116)

Every scatter loop draws `x,y` from `rnd(100, WW-100)` / `rnd(100, WH-100)`, then rejects the point if `!_clearOfLandmarks(x,y)`. Trees and rocks additionally reject anything within 220 px of world centre (the spawn clearing). Biome-specific props simply `continue` unless `getBiome(x,y)` matches, so the actual placed count is far below the loop count.

| Type | Loop count | Extra gate | Radius `r` | Extra fields |
|---|---|---|---|---|
| `tree` | 70 | `dst(pt, centre) >= 220`, any biome | `22` | `biome`, `th: rnd(15,28)` (trunk height) |
| `rock` | 55 | `dst(pt, centre) >= 220`, any biome | `rnd(18,42)` | `biome`, `color` (biome-picked, below) |
| `flower` | 45 | `getBiome === 'forest'` | `4` | `color` from `['#D86050','#E8A838','#D06888','#9088CC','#D07090','#F0D898']` |
| `mush` | 25 | `getBiome === 'swamp'` | `6` | `color` from `['#D84830','#7B3CA0','#B06020']` |
| `crystal` | 20 | `getBiome === 'cave'` | `8` | `color` from `['#6B8EC8','#a29bfe','#00cec9']` |
| `cactus` | 18 | `getBiome === 'desert'` | `10` | — |
| `icespike` | 18 | `getBiome === 'frozen'` | `8` | `color` from `['#b0d4f1','#d4e6f1','#aed6f1']` |
| `pinetree` | 15 | `getBiome === 'frozen'` | `20` | `th: rnd(20,35)` |

Rock colour by biome (L2103):

| Biome | Palette |
|---|---|
| desert | `['#B88838','#A07830','#C89840']` |
| cave | `['#484870','#505878','#3C4860']` |
| frozen | `['#8098B8','#7088A8','#90A8C8']` |
| swamp | `['#607060','#506858','#687868']` |
| other | `['#707870','#808878','#606858']` |

Obstacles are pure scenery for the hero (no collision in the overworld); the only code that reads their radius is `_getEdWalkPath()` (L6148), which pushes Ed's walk path 20 px away from any `tree`/`pinetree`/`rock` within 30 px.

### 3.3 NPC placement inside `genWorld` (L2117–L2124)

After scatter, `genWorld()` places one NPC per `NPC_DEFS` entry. For each definition it tries up to **80** random points in `rnd(200, WW-200)`:

- reject unless `getBiome(nx,ny) === nd.biome`;
- reject if within **200 px** of any dungeon entrance, spawner, or cage;
- reject if within `(obstacle.r || 20) + 30` of any `tree`/`pinetree`/`rock`/`cactus`/`icespike`.

On success it pushes `{nm,x,y,col,dk,icon,dlg,dlgIdx:0,visited:false,talkT:0,showBubble:false,bubbleT:0}`. If all 80 tries fail the NPC is simply not placed.

### 3.4 `initGame()` ordering (L8258–L8340)

Exact sequence (this is the canonical init order to port):

1. `initSkillTrees()`; `hideAllOverlays()`.
2. Clear all entity arrays: `heroes, enemies, projs, parts, loots, spawners, cages, obstacles, equips, weatherP, miniBosses`.
3. Reset scalars: `sibs=0, gameOver=false, gameWon=false, paused=false, gt=0, totalXP=0, teamLv=1, xpNext=30, showLvl=false, portalOpen=false, inShadowRealm=false, shadowQueen=null, shadowQueenDefeated=false, worldEventTimer=60, activeEvent=null, eventEntities=[], bloodMoonActive=false, activeHero=0, endlessMode=false, endlessWave=0, endlessScore=0`, plus `gameStats` and `_adaptDiff`.
4. `waveNum=0; waveTimer=3; bossUp=false; bossDefeated=false; boss=null; vig={i:0,t:0}`.
5. `magnetStacks=0; pendingEquips=[]; tutorialTimer=15; equipPickupCount=0; dayTime=0; nightKills=0; achQueue=[]`.
6. `initQuestLog()`; `showQuestJournal=false`; reset all achievements' `.done`.
7. Reset `storyFlags` — **note:** the reset literal (L8272) omits `meteorSeen`, `craterVisited` and `edCraterDialogue`, so those three leak across a restart within one page load (see §21).
8. `edQuestPhase=0; edCrashCount=0; biplaneSeen=0; questItemsCollected=[]; edNPC=null; dialogueActive=false; dialogueQueue=[]`.
9. Reset the whole `biplane` object, including `biplane.crashReadyTimer = 90 + rnd(0,30)`.
10. `biomeCache={}`.
11. `ED_LANDING.x = floor(WW*0.35); ED_LANDING.y = floor(WH*0.35)` → `(1120,1120)`.
12. `initNoiseSeed()`.
13. `ALIEN_CRATER.x=2844; ALIEN_CRATER.y=305; discovered=false; particles=[]; lastFlavor=0`.
14. `genWorld()` — scatter + NPCs (needs the crater and landing coordinates already set, which is why 11/13 come first).
15. Landing-strip obstacle purge (radius 80).
16. `buildMinimapGrid()`.
17. Heroes: `heroes.push(new Hero(HDEFS[0], WW/2, WH/2))`, `heroes[0].unlocked=true`; heroes 1–3 created at `(0,0)` and locked.
18. `FLAVOR_MARKERS` positions: `[0] = (WW*0.3, WH*0.3) = (960,960)`, `[1] = (WW*0.6, WH*0.7) = (1920,2240)`, `[2] = (WW*0.1, WH*0.5) = (320,1600)`; all `found=false`.
19. Cages at `[{WW*.25,WH*.3},{WW*.75,WH*.6},{WW*.4,WH*.8}]` each `+rnd(-80,80)`, holding hero index `i+1`.
20. Spawners at `[{.18,.18},{.82,.18},{.15,.72},{.85,.75},{.5,.12},{.5,.88}]` (fractions of WW/WH) each `+rnd(-50,50)`.
21. Mini-bosses: `golem@(WW*.22,WH*.22)`, `sandworm@(WW*.78,WH*.22)`, `hydra@(WW*.5,WH*.82)`, `frostwyrm@(WW*.78,WH*.78)`, each `+rnd(-60,60)`.
22. Reset dungeon state (`dungeonProgress` all false, `titanHeartObtained=false`, all dungeon arrays cleared).
23. Dungeon entrances placed at the five sites in §3.1 with `+rnd(-40,40)` jitter.
24. `gold=0; merchant.active=false; merchant.movT=0; spawnSecrets()`.
25. `bountyBoard = (WW/2-120, WH/2+80) = (1480,1680)`; `rollBounties()`.
26. `citadelEntrance = (WW/2, WH/2-100) = (1600,1500)`; `citadelFloor=0`; `citadelProgress` reset; `citHazardT=8`.
27. If `DEV_MODE`: unlock all 4 heroes, set `lv=10`, triple `dmg`/`maxHp`, `sibs=3`, `teamLv=10`, `shadowQueenDefeated=true`, `bossDefeated=true`, `ngPlusUnlocked=true`, all `dungeonProgress` true except citadel.
28. `checkVolcanicEntrance(); checkCitadelEntrance();`
29. `announce(...)`, `gameStats.startTime=Date.now()`, `buildPortraitStrip()`.
30. `tutorial = {step:0,active:true,timer:5,startX:heroes[0].x,startY:heroes[0].y,_switched:false,_openedTree:false}`; in DEV_MODE `tutorial.active=false; tutorial.step=7`.

### 3.5 Hidden secrets (L672–L679)

`spawnSecrets()` populates `secrets[]`:

| Type | Count | Placement | Pickup effect (L9310–L9317) |
|---|---|---|---|
| `treasure` | 8 | `rnd(200, WW-200)` anywhere | `gold += floor(rnd(20,50))`, one `rollGearDrop(0,0.5)` equip, announce "Buried treasure found!" |
| `lore` | 5 | one per biome centre `[{.2,.2},{.8,.2},{.5,.5},{.2,.8},{.8,.8}]` + `rnd(-200,200)`, carries `text` | `addXP(25)`, announce the lore line (colour `#a29bfe`, 4 s) |
| `cache` | 5 | `rnd(200, WW-200)` anywhere | spawns 3 `Loot` at the site |
| `golden` | 1 | `rnd(400, WW-400)` | `gold += 100`, one `rollGearDrop(0,0.5)`, 20-particle gold burst |

Pickup radius is 40 px from the active hero; each triggers `trigAch('secretFinder')` and `updateBountyProgress('secrets',1)`. The five lore texts are family canon — see FAMILY_CANON.

### 3.6 Flavor markers (L728, L5798–L5799)

`FLAVOR_MARKERS` is a 3-entry array of `{x,y,text,found}`. `updateFlavorMarkers(dt)` (L5799) fires when the active hero is within **40 px**, sets `found=true`, `announce(fm.text,'#E8A838',3)` and plays `snd('achieve',0.15)`. Marker drawing (L5798) is a pulsing `#E8A838` dot with a `?` glyph. Texts are canon (FAMILY_CANON).

### 3.7 Alien crater (L724, L5801–L5944)

```js
var ALIEN_CRATER={x:0,y:0,radius:100,innerRadius:50,discovered:false,particles:[],hum:null,lastFlavor:0};
var METEOR_CUTSCENE_PLAYED=false;
```

- Position is hard-coded to `(2844, 305)` in `initGame()` (L8281) — deep in the north-east desert/frozen corner, deliberately far from spawn.
- `updateCraterParticles(dt)` (L5801) keeps exactly 18 particles alive; each spawns at a random point inside `radius*0.9` with `vy = -rnd(10,20)` (rising), `life rnd(2,4)`, `sz rnd(1,3)`, colour from `['#A862C4','#1abc9c','#aaa']`, and drifts horizontally by `sin(gt + wp) * 0.5` per frame.
- `updateCraterProximity(dt)` (L5934) — three mutually exclusive branches at range `< radius + 20` (120 px):

```js
if(d<ALIEN_CRATER.radius+20&&!ALIEN_CRATER.discovered){ALIEN_CRATER.discovered=true;storyFlags.craterDiscovered=true;announce("Something fell here. A long time ago.","#8850A8",4);trigAch('groundControl');var rLine=getHeroReaction(_h0.nm,'crater');if(rLine)announce(rLine,_h0.col||'#fff',3);}
else if(d<ALIEN_CRATER.radius+20&&storyFlags.meteorSeen&&!storyFlags.craterVisited){ ... }
else if(d<ALIEN_CRATER.radius+20&&ALIEN_CRATER.discovered&&gt-ALIEN_CRATER.lastFlavor>30){ALIEN_CRATER.lastFlavor=gt;announce(CRATER_FLAVOR[Math.floor(rnd(0,CRATER_FLAVOR.length))],"#8850A8",3);}
```

First entry discovers the crater and fires the hero `crater` reaction; the second branch (only after the meteor cutscene) sets `craterVisited` and announces one of four fixed hero lines; otherwise a `CRATER_FLAVOR` line is announced at most once per 30 s of game time.

- `drawCraterVignette()` (L5943) adds a purple radial vignette that ramps to `alpha = 0.08 * (1 - d/(radius+40))` when the hero is within 140 px.
- `METEOR_CUTSCENE_PLAYED` (L725) is **declared and never read or written anywhere else** — the meteor cutscene is actually gated on `storyFlags.meteorSeen` (see §13/§21).

### 3.8 Portal (L5713–L5740)

```js
function spawnPortal(){
  portalOpen=true;portalX=WW/2;portalY=WH*.35;portalT=0;
  announce('A mysterious portal appears...','#A862C4',4);snd('portal',0.4);
}
```

Fixed position `(1600, 1120)`. `drawPortal()` (L5719) advances `portalT` by `1/60` per draw and renders three counter-rotating arcs of radius `30 + sin(portalT*3)*5 + ri*8` in `rgba(168,98,196,α)` with a `#A862C4` shadow blur of `30 + sin(portalT*5)*15`, a dark disc `rgba(26,10,46,0.8)`, an inner glow `rgba(168,98,196,0.3)`, and the label `ENTER PORTAL` in `#e84393`.

Collision is handled in `update()` (L9322): active hero within **40 px** ⇒ `inShadowRealm=true`, `portalOpen=false`, all unlocked living heroes teleported to `(WW/2, WH/2)`, camera snapped, `enemies=[]`, `shadowQueen = new ShadowQueen(WW/2, WH/2-200)`, `playBossIntro('THE SHADOW QUEEN','Mistress of Darkness','#A862C4','#A862C4')`, `screenShake(12,1)`.

### 3.9 Late-unlock entrances (L5717–L5718)

```js
function checkCitadelEntrance(){if(!citadelUnlocked()||dungeonProgress.citadel)return;var hasCit=dungeonEntrances.some(function(d){return d.biome==='citadel';});if(!hasCit){dungeonEntrances.push(new DungeonEntrance(citadelEntrance.x,citadelEntrance.y,'citadel'));}}
function checkVolcanicEntrance(){var allOrig=['forest','cave','desert','swamp','frozen'].every(function(b){return dungeonProgress[b]===true;});if(!allOrig||!bossDefeated)return;var hasVolc=dungeonEntrances.some(function(d){return d.biome==='volcanic';});if(!hasVolc){dungeonEntrances.push(new DungeonEntrance(WW/2,WH/2+100,'volcanic'));announce('The ground trembles... A volcanic rift opens!','#D84830',4);}}
```

Volcanic Rift appears at `(1600,1700)` once all five original dungeons are cleared **and** the Goblin King is dead. The Shadow Citadel appears at `citadelEntrance` `(1600,1500)` once `citadelUnlocked()` (L819) is true — Shadow Queen defeated **and** all five original dungeons cleared. Both checks run in `initGame()`, after `exitDungeon()`, and on the victory "keep playing" button.

---
## 4. Weather System

**Legacy lines:** `// ===== WEATHER =====` L1602–L1660 (`WEATHER_TYPES` L1604, `WEATHER_BIOME` L1605, `weather` L1606, `weatherName` L1607, `updWeather` L1608–L1641, `drawWeather` L1642–L1660).

Visual recipes (rain streaks, snow rotation, fog wash, aurora ribbons, lightning flash curve) belong to **ATMOSPHERE_RECIPES** — this section covers state, timers and mechanics only.

### 4.1 Data

```js
var WEATHER_TYPES=['clear','rain','storm','snow','sand','fog'];
var WEATHER_BIOME={forest:['clear','clear','rain','storm','fog'],cave:['clear','clear','clear','snow'],desert:['clear','clear','clear','sand','sand','storm'],swamp:['clear','rain','rain','fog','fog','storm'],frozen:['clear','clear','snow','snow','snow']};
var weather={type:'clear',timer:90,transT:0,flashT:0,strikeT:rnd(8,12),strikeX:0,strikeY:0,strikeWarn:-1};
```

`WEATHER_BIOME` pools are **weighted by repetition** — `pick()` draws uniformly from the array, so duplicates raise the odds.

| Biome | Pool (weights by count) | clear | rain | storm | snow | sand | fog |
|---|---|---|---|---|---|---|---|
| forest | clear, clear, rain, storm, fog | 2/5 | 1/5 | 1/5 | — | — | 1/5 |
| cave | clear, clear, clear, snow | 3/4 | — | — | 1/4 | — | — |
| desert | clear, clear, clear, sand, sand, storm | 3/6 | — | 1/6 | — | 2/6 | — |
| swamp | clear, rain, rain, fog, fog, storm | 1/6 | 2/6 | 1/6 | — | — | 2/6 |
| frozen | clear, clear, snow, snow, snow | 2/5 | — | — | 3/5 | — | — |

Display names (`weatherName`, L1607):

| Key | Name | HUD label (L3701) |
|---|---|---|
| `clear` | Clear Skies | (hidden) |
| `rain` | Rain | 🌧️ Rain |
| `storm` | Thunderstorm | ⛈️ Storm |
| `snow` | Snowfall | 🌨️ Snow |
| `sand` | Sandstorm | 🏜️ Sandstorm |
| `fog` | Dense Fog | 🌫️ Fog |

### 4.2 Transition timing (L1610)

```js
if(!inDungeon){weather.timer-=dt;if(weather.timer<=0){var hBiome=getBiome(_wh.x,_wh.y);var pool=WEATHER_BIOME[hBiome]||["clear"];var _prevW=weather.type;weather.type=pick(pool);weather.timer=weather.type==="clear"?rnd(60,120):rnd(20,60);weather.transT=2;weather.strikeWarn=-1;weather.flashT=0;if(weather.type==="storm"){weather.strikeT=rnd(4,8);gameStats.stormsSurvived=(gameStats.stormsSurvived||0)+1;if(gameStats.stormsSurvived>=5)trigAch("stormChaser");}if(weather.type!=="clear"){announce(weatherName(weather.type)+"!","#94C4DC",2);updateBountyProgress("weather",1);}else if(_prevW!=="clear"){announce("The weather clears.","#dfe6e9",2);}}
```

The weather clock only ticks in the overworld. On expiry it re-rolls from the pool of the biome under the **active hero** (falling back to `heroes[0]`); a `clear` roll lasts `rnd(60,120)` s, anything else `rnd(20,60)` s. `transT=2` is a two-second cross-fade counter (decremented at L1611, used by the ground/atmosphere renderer). Initial `timer` is `90`. Every non-clear transition announces, advances the `weather` bounty type, and a `storm` roll bumps `gameStats.stormsSurvived` (5 ⇒ `stormChaser` achievement).

### 4.3 Lightning strikes (storm only, L1612–L1614)

```js
if(weather.type==='storm'){weather.strikeT-=dt;if(weather.strikeWarn>0)weather.strikeWarn-=dt;if(weather.strikeT<=0){weather.strikeT=rnd(10,18);weather.strikeWarn=1.0;var _newSX=_wh.x+rnd(-400,400);var _newSY=_wh.y+rnd(-400,400);var _prevD=Math.hypot(_newSX-(weather.strikeX||0),_newSY-(weather.strikeY||0));if(_prevD<200){_newSX+=(_newSX>_wh.x?200:-200);_newSY+=(_newSY>_wh.y?200:-200);}
weather.strikeX=_newSX;weather.strikeY=_newSY;}
if(weather.strikeWarn<=0&&weather.strikeWarn>-1&&weather.strikeWarn!==-1){weather.strikeWarn=-1;weather.flashT=0.12;snd('boom',0.3);var tgts=enemies;for(var si=0;si<tgts.length;si++){if(tgts[si]&&!tgts[si].dead&&typeof tgts[si].takeDmg==='function'&&dst({x:weather.strikeX,y:weather.strikeY},tgts[si])<60)tgts[si].takeDmg(30,null);}for(var li=0;li<12;li++){var la=rnd(0,TAU),ls=rnd(60,180);parts.push(new Part(weather.strikeX,weather.strikeY,{vx:Math.cos(la)*ls,vy:Math.sin(la)*ls,life:0.3,sz:rnd(2,5),col:pick(['#fff','#6B8EC8','#a29bfe']),fric:0.9}));}}}
```

Storms schedule a strike every `rnd(10,18)` s (first one `rnd(4,8)` s after the storm begins). The target lands `rnd(-400,400)` from the hero on each axis, nudged 200 px further out if it would land within 200 px of the previous strike. A **1.0 s telegraph** (`strikeWarn`) draws two pulsing `#E8A838` rings at radius 60 and 30 (L1646). On detonation: `flashT = 0.12` white flash, `snd('boom',0.3)`, **30 flat damage to every non-dead overworld enemy within 60 px** (heroes are never hit), and a 12-particle spark burst.

### 4.4 Gameplay effects

| Weather | Effect | Line |
|---|---|---|
| `snow` | Hero damage `d = floor(d * 1.1)` (+10% DMG, overworld only) | L2329 |
| `rain`, `storm` | Enemy speed multiplier `nightSpd *= 0.9` (-10% enemy speed) | L2776 |
| `storm` | Lightning: 30 damage in a 60 px radius on a 10–18 s cycle with a 1 s telegraph | L1613 |
| `sand` | Fog-of-war radius multiplier `*= 0.625` | L878 |
| `fog` | Fog-of-war radius multiplier `*= 0.5625` | L878 |
| `storm`, `sand` | Parachute crate `driftDir` widens from `rnd(-5,5)` to `rnd(-20,20)` | L5969 |
| `fog`, `sand` | Full-screen wash: `rgba(200,200,200,0.25)` / `rgba(194,154,100,0.2)` | L1643 |
| `rain`, `storm` | Screen darkening: `rgba(10,10,30,0.08)` / `rgba(10,10,30,0.2)` | L1644 |
| any non-clear | `updateBountyProgress('weather',1)` on transition | L1610 |

No weather type changes hero movement speed. The visibility formula is combined with night in `nightFogMul()` — see §5.3.

### 4.5 Particle emission rates (per `updWeather` call, i.e. per frame)

| Condition | Spawn rule | Particle |
|---|---|---|
| `rain` | 3 per frame | `vy rnd(300,450)`, `vx rnd(-30,-10)`, `life rnd(0.8,1.5)`, `ml 1.5`, `tp:'rain'` |
| `storm` | 5 per frame | same shape as rain |
| `snow` (weather) | `Math.random()<0.6` | `vy rnd(30,80)`, `vx rnd(-30,30)`, `life rnd(3,6)`, `ml 6`, `rot`, `rv rnd(-2,2)` |
| `sand` (weather) | `Math.random()<0.5` | spawns at `cam.x-10`, `vx rnd(120,220)`, `life rnd(1,2)`, `ml 2` |
| night, any biome | `Math.random()<0.3` | `tp:'firefly'`, `#ffe066`, `life rnd(3,6)`, flicker phase `fl` |
| `forest` biome | `Math.random()<0.25` | `tp:'leaf'`, colour from `['#B03828','#D87828','#E8A838','#38A866']` |
| `swamp` biome | `Math.random()<0.2` | `tp:'fly'`, `#7dff7d`, rising `vy rnd(-12,-3)` |
| `desert` biome | `Math.random()<0.4` | `tp:'sand'`, `vx rnd(50,110)` |
| `cave` biome | `Math.random()<0.12` | `tp:'dust'`, `rgba(200,200,220,0.3)` |
| `frozen` biome | `Math.random()<0.45` | `tp:'snow'` |

Ambient `parts[]` (not `weatherP[]`) additions: night+forest fireflies at `0.05`/frame; sandstorm dust motes at `0.02`; swamp bubbles at `0.03`; cave sparkles at `0.02` (L1633–L1636).

Caps (L1639–L1641): `weatherP` is truncated to `MAX_WEATHER` (80); there is a redundant second truncation at 500 and a `parts` truncation at 800 in the same block.

### 4.6 Aurora (L1656)

```js
if(!inDungeon&&isNight()&&getBiome(cam.x+W/2,cam.y+H/2)==='frozen'){var auroraT=gt*0.3; ... }
```

Trigger conditions are exactly three, all required: **not in a dungeon**, `isNight()` true (day-phase `night`, i.e. `dayTime%240` in `[108, 180)` s), and the biome at the **camera centre** is `frozen`. It is not gated on weather. Three horizontal ribbons at `y = 30 + i*15 + sin(auroraT + i*1.5)*10`, each a 10 px band with a left-to-right gradient `transparent → colA(0.3) → colB(0.7) → transparent`, alpha `0.12 + sin(auroraT*0.5 + i)*0.05`. Colour pairs: `['#00b894','#00cec9']`, `['#6c5ce7','#a29bfe']`, `['#fd79a8','#e84393']`. Full recipe in ATMOSPHERE_RECIPES.

---

## 5. Day/Night Cycle

**Legacy lines:** `// ===== DAY/NIGHT CYCLE =====` L855–L879.

### 5.1 Phases

```js
let dayTime=0; // 0-240 seconds cycle (4 minutes)
const DAY_CYCLE=240;
function getDayPhase(){
  var t=dayTime%DAY_CYCLE,p=t/DAY_CYCLE;
  // 0-0.35=day, 0.35-0.45=dusk, 0.45-0.75=night, 0.75-0.85=dawn, 0.85-1=day
  if(p<0.35)return{phase:'day',blend:0};
  if(p<0.45)return{phase:'dusk',blend:(p-0.35)/0.1};
  if(p<0.75)return{phase:'night',blend:1};
  if(p<0.85)return{phase:'dawn',blend:1-(p-0.75)/0.1};
  return{phase:'day',blend:0};
}
```

A full cycle is 240 s (4 minutes) of unpaused overworld time. `dayTime` is advanced in `gameLoop` only when `!paused && !inDungeon` (L9235) — dungeons freeze the clock.

| Phase | `p` range | Seconds | `blend` |
|---|---|---|---|
| day | `0.00 – 0.35` | 0 – 84 | `0` |
| dusk | `0.35 – 0.45` | 84 – 108 | ramps `0 → 1` |
| night | `0.45 – 0.75` | 108 – 180 | `1` |
| dawn | `0.75 – 0.85` | 180 – 204 | ramps `1 → 0` |
| day | `0.85 – 1.00` | 204 – 240 | `0` |

### 5.2 Screen tint

```js
function getDayTint(){
  var dp=getDayPhase();
  if(dp.phase==='day')return{r:0,g:0,b:0,a:0};
  if(dp.phase==='dusk')return{r:60,g:20,b:0,a:dp.blend*0.18};
  if(dp.phase==='night')return{r:10,g:15,b:50,a:0.32};
  if(dp.phase==='dawn')return{r:60,g:20,b:0,a:dp.blend*0.18};
  return{r:0,g:0,b:0,a:0};
}
```

Dusk and dawn share the same warm tint `rgb(60,20,0)` fading in/out to `α 0.18`; night is a flat cold `rgba(10,15,50,0.32)`. Applied as a full-screen fill by `drawDayNightTint()` (L3337), which early-returns during cutscenes and is overridden entirely inside the Shadow Realm by `rgb(60,0,80)` at `α 0.25`.

### 5.3 Gameplay effects

```js
function isNight(){var dp=getDayPhase();return dp.phase==='night';}
function nightXPMul(){return isNight()?1.5:1;}
function nightEnemySpeedMul(){return isNight()?1.15:1;}
function nightFogMul(){var m=isNight()?0.75:1;if(!inDungeon){if(weather.type==='sand')m*=0.625;if(weather.type==='fog')m*=0.5625;}return Math.max(m,0.5);}
```

| Effect | Value | Where consumed |
|---|---|---|
| XP | **×1.5 at night** (`bloodMoonActive` overrides with ×3) | `addXP()` L2704 |
| Enemy speed | **×1.15 at night**; further `×0.9` in rain/storm; `×1.25` under Blood Moon | Enemy update L2774–L2778, mini-boss L2901 |
| Fog-of-war radius | `×0.75 at night`, then `×0.625` sandstorm or `×0.5625` fog, floored at `0.5` | `drawFog()` L3332 (`fogR = 300 * nightFogMul()`), `render()` L3340 (`FOG_R = 320 * nightFogMul()` for culling) |
| HUD | `hudDayNight` shows 🌙 / 🌅 / ☀️; `hudNightXP` ("XP +50%") shown only at night | `updateV5Hud` L3698–L3699 |
| Fireflies | spawn at 0.3/frame in every biome at night | `updWeather` L1623 |
| Forest night motes | extra `parts` at 0.05/frame when camera biome is forest | L1633 |
| Aurora | frozen biome at night (§4.6) | L1656 |

Night does **not** change enemy spawn counts, enemy HP or damage; the only stat effect is speed. Blood Moon (§9) is the event that stacks on top of night.

---
## 6. Quest System

**Legacy lines:** `// ===== V11: QUEST SYSTEM =====` L696–L747; quest-item helpers L722–L737; NPC quest handlers L8341–L8389 (`getNPCQuestState`, `getNPCDialogue`, `spawnEscortNPC`, `spawnQuestWaypoints`, `npcQuestInteract`, `npcQuestInteractAs`); Ed's chain handler `edInteract` L8392–L8408.

### 6.1 `QUEST_DEFS` (L697–L719) — all 18 quests

Every entry has `{id, npc, biome, title, desc, hint, type, target, biomeReq, prereq, rewardXP, rewardDesc, chain, rewardFn}`; some add `talkTarget`, `questGroup`, `itemBiome`.

| id | NPC | Title | Objective (`type` / `target`) | `biomeReq` | Prereq | XP | Reward effect (`rewardFn`) |
|---|---|---|---|---|---|---|---|
| `forest_1` | Rootkeeper Elm | Roots of the Problem | `kill_spawners` / 2 | forest | — | 50 | `biomeBuff.forest.dmgMul *= 1.1` |
| `forest_2` | Rootkeeper Elm | Whispers in the Grove | `talk_to` / 1, `talkTarget:'Lamplighter Quartz'` | — | `forest_1` | 75 | none (desc: "Compass range upgrade") |
| `forest_3` | Rootkeeper Elm | Heart of the Hollow | `clear_dungeon` / 1 | forest | `forest_2` | 100 | every hero `regen += 2` |
| `cave_1` | Lamplighter Quartz | Crystal Resonance | `kill_enemies` / 20 | cave | — | 50 | `biomeBuff.cave.dmgMul *= 1.1` |
| `cave_2` | Lamplighter Quartz | Shattered Reflections | `collect_items` / 5 | — | `cave_1` | 75 | every hero `crit += 0.05` |
| `cave_3` | Lamplighter Quartz | Depths of Power | `defeat_boss` / 1 | cave | `cave_2` | 100 | `questRewards.mapEnemies = true` |
| `desert_1` | Dunewalker Sol | Desert Trials | `survive_event` / 3 | — | — | 50 | `biomeBuff.desert.spdMul *= 1.15` |
| `desert_2` | Dunewalker Sol | Nomad's Path | `visit_locations` / 3 | desert | `desert_1` | 75 | every hero `maxHp += 50`, `hp += 50` |
| `desert_3` | Dunewalker Sol | Tomb Raider | `clear_dungeon` / 1 | desert | `desert_2` | 100 | every hero `maxHp += 50`, `hp += 50` |
| `swamp_1` | Mistweaver Fern | Witch's Errand | `kill_enemies` / 15 | swamp | — | 50 | `biomeBuff.swamp.lifesteal += 0.1` |
| `swamp_2` | Mistweaver Fern | Toxic Harvest | `escort_npc` / 1 | swamp | `swamp_1` | 75 | `questRewards.poisonImmune = true` |
| `swamp_3` | Mistweaver Fern | Swamp Sovereign | `defeat_boss` / 1 | swamp | `swamp_2` | 100 | `questRewards.potionMul = 2` |
| `frozen_1` | Hearthkeeper Neve | Cold Front | `kill_spawners` / 2 | frozen | — | 50 | `biomeBuff.frozen.atkSpdMul *= 1.15` |
| `frozen_2` | Hearthkeeper Neve | The Hermit's Test | `kill_miniboss` / 2 | — | `frozen_1` | 75 | every hero `dmgReduction += 0.1` |
| `frozen_3` | Hearthkeeper Neve | Ice Citadel | `clear_dungeon` / 1 | frozen | `frozen_2` | 100 | `questRewards.xpMul *= 1.2` |
| `ground_ed_1` | Grandpa Ed | Ground-Ed: The Propeller | `fetch_item` / 1, `itemBiome:'frozen'` | — | — | 75 | `gold += 100`, `storyFlags.edGoggles = true` |
| `ground_ed_2` | Grandpa Ed | Ground-Ed: The Rudder | `fetch_item` / 1, `itemBiome:'swamp'` | — | `ground_ed_1` | 100 | `gold += 100`, `storyFlags.edEdibles = 3` |
| `ground_ed_3` | Grandpa Ed | Ground-Ed: The Spark Plug | `fetch_item_dungeon` / 1, `itemBiome:'cave'` | — | `ground_ed_2` | 150 | `gold += 150`, `storyFlags.edQuestComplete = true`, `storyFlags.betterDrops = true` |

18 quests total: five three-step chains (forest, cave, desert, swamp, frozen), one per biome NPC, plus Grandpa Ed's three-step `questGroup:'ground_ed'` chain. `rewardDesc` strings (shown on turn-in) are, in order: `+10% DMG in forest`, `Compass range upgrade`, `+2 HP regen/s all biomes`, `+10% DMG in cave`, `+5% crit chance`, `Mini-map enemy dots`, `+15% speed in desert`, `+50 max HP all heroes`, `+50 max HP all heroes`, `+10% lifesteal in swamp`, `Poison immunity`, `Potions heal 2x`, `+15% attack speed in frozen`, `+10% damage reduction`, `+20% XP from all sources`, `Aviator Goggles + 100 Gold`, `Ed-ible x3 + 100 Gold`, `Better supply drops + 150 Gold`. All `desc`/`hint`/`title` strings are family canon — see FAMILY_CANON.

`questRewards` (L721) starts `{mapEnemies:false, poisonImmune:false, potionMul:1, xpMul:1}`.

### 6.2 Quest state machine

`questLog[qid] = {status, progress}` with `status ∈ {'available','active','completable','complete'}`. `initQuestLog()` (L735) sets every quest to `available/0` and resets all `QUEST_ITEMS` flags. `activeQuests[]` holds the ids currently `active` and is **capped at 3** (see acceptance below).

**Progress** — `updateQuestProgress(type, data)` (L738):

```js
for(var i=0;i<activeQuests.length;i++){var qid=activeQuests[i];var qd=QUEST_DEFS[qid];var qs=questLog[qid];
  if(qs.status!=='active')continue;if(qd.type!==type)continue;
  if(qd.biomeReq&&data.biome&&data.biome!==qd.biomeReq)continue;
  if(type==='talk_to'&&qd.talkTarget&&data.npcName!==qd.talkTarget)continue;
  qs.progress++;if(qs.progress>=qd.target){qs.status='completable';
    questNotifs.push({text:qd.title+' — Ready to turn in!',col:'#3DCC7A',timer:4});snd('achieve',0.2);}
  else{questNotifs.push({text:qd.title+': '+qs.progress+'/'+qd.target,col:'#E8A838',timer:3});}}
```

Only *active* quests of the matching `type` advance; a `biomeReq` filters on `data.biome` **only when the caller supplied one**; `talk_to` additionally matches `data.npcName` against `talkTarget`. Progress is always `+1` per call.

Callers of `updateQuestProgress`:

| `type` | Fired from |
|---|---|
| `talk_to` | `updateNPCs9()` when any living hero is within 60 px of an NPC and `npcTalkCD <= 0` (L8448) |
| `escort_npc` | escort NPC reaches its destination (within 30 px), L8460 |
| `visit_locations` | hero within 30 px of a quest waypoint, `{biome:'desert'}` (L8466) |
| `clear_dungeon` | `exitDungeon(true)` with `{biome}` (L7113) |
| `fetch_item` | `updateQuestItems()` on pickup, `{biome: it.biome}` (L734) |
| `fetch_item_dungeon` | `exitDungeon(true)` when `biome==='cave'` and `ground_ed_3` is active (L7113) |
| `survive_event` | blood moon / spring / earthquake ending (L6296, L6306, L6334) |
| `kill_spawners`, `kill_enemies`, `defeat_boss`, `kill_miniboss`, `collect_items` | Part 1 combat/loot code |

**Acceptance & turn-in** — `npcQuestInteract()` (L8357), triggered by the interact key when a hero is within **60 px** of an NPC:

```js
if(st.completable){var qid=st.completable,qd=QUEST_DEFS[qid];questLog[qid].status='complete';var idx=activeQuests.indexOf(qid);if(idx>=0)activeQuests.splice(idx,1);addXP(qd.rewardXP);qd.rewardFn();
  questNotifs.push({text:'✅ '+qd.title+' — Complete! '+qd.rewardDesc,col:'#3DCC7A',timer:4});snd('achieve',0.3);announce('✅ '+qd.title+' complete!','#3DCC7A',3);
  ... if(getCompletedQuestCount()>=15)trigAch('questMaster');npc.bubbleT=4;npc.showBubble=true;npcTalkCD=1;setTimeout(autoSave,500);return true;}
if(st.available&&activeQuests.length<3){var qid=st.available,qd=QUEST_DEFS[qid];questLog[qid].status='active';questLog[qid].progress=0;activeQuests.push(qid);
  ... if(qd.type==='escort_npc')spawnEscortNPC();if(qd.type==='visit_locations')spawnQuestWaypoints();npc.bubbleT=4;npc.showBubble=true;npcTalkCD=1;return true;}
```

Turn-in awards XP, runs `rewardFn`, removes from `activeQuests`, fires a 20-particle burst at the NPC and schedules an autosave 500 ms later; 15 completed quests unlocks `questMaster`. Acceptance only happens when fewer than 3 quests are active, and side-spawns the escort NPC or the three waypoints for those quest types. `npcQuestInteractAs(hero)` (L8367) is the byte-identical host-side variant used for guest-controlled heroes.

**Availability gating** — `getNPCQuestState(npc)` (L8341) scans every `QUEST_DEFS` entry owned by that NPC and returns `{available, active, completable, allDone}`. A quest is offered only when `status === 'available'` **and** (`!prereq` or `questLog[prereq].status === 'complete'`). Only the first matching available quest is returned. `getNPCDialogue(npc)` (L8348) turns that into the bubble text:

| State | Bubble |
|---|---|
| completable | `✅ <title> — Complete! Press SPACE to turn in.` |
| available | `❗ <title>: <desc> [SPACE to accept]` |
| active | `… <title>: <progress>/<target> — <hint>` |
| allDone | one of `'Thank you, hero. The land is safe.'` / `'You have done everything I asked.'` / `'Go forth with my blessing!'` |
| otherwise | `NPC_DEFS[i].dlg[npc.dlgIdx % dlg.length]` |

The floating marker above an NPC (`drawNPC9`, L8425) is `✓` `#3DCC7A` for completable, `!` `#E8A838` for available, `...` grey for active, `!` for never-visited.

### 6.3 Quest items (L722–L737)

```js
var QUEST_ITEMS={ed_propeller:{nm:'Propeller',col:'#888',glowCol:'#FFD700',biome:'frozen',dungeon:false,x:0,y:0,spawned:false,collected:false,ambush:false},ed_rudder:{nm:'Rudder',col:'#228B22',glowCol:'#228B22',biome:'swamp',dungeon:false,x:0,y:0,spawned:false,collected:false,ambush:true,ambushCount:4,ambushDone:false},ed_sparkplug:{nm:'Spark Plug',col:'#C0C0C0',glowCol:'#00d2ff',biome:'cave',dungeon:true,x:0,y:0,spawned:false,collected:false,ambush:false}};
```

| Key | Name | Biome | In dungeon? | Ambush | Glow |
|---|---|---|---|---|---|
| `ed_propeller` | Propeller | frozen | no | no | `#FFD700` |
| `ed_rudder` | Rudder | swamp | no | **yes, 4 enemies** | `#228B22` |
| `ed_sparkplug` | Spark Plug | cave | **yes** (awarded on dungeon clear) | no | `#00d2ff` |

`spawnQuestItem(key)` (L729): dungeon items just flag `spawned=true`; overworld items try up to **100** random points in `rnd(100, WW-100)` until `getBiome` matches, falling back to world centre.

`updateQuestItems(dt)` (L734): within **80 px** an un-triggered ambush spawns `ambushCount` (4) enemies at `rnd(60,120)` around the item with `announce("Ambush!","#D84830",2)`; within **40 px** (and ambush resolved) the item is collected — pushed to `questItemsCollected`, 10-particle burst in `glowCol`, `snd('achieve',0.2)`, and `updateQuestProgress('fetch_item',{biome:it.biome})`.

The spark plug is granted by `exitDungeon(true)` when clearing the cave dungeon with `ground_ed_3` active (L7113):

```js
if(biome==='cave'&&questLog.ground_ed_3&&questLog.ground_ed_3.status==='active'){if(questItemsCollected.indexOf('ed_sparkplug')<0)questItemsCollected.push('ed_sparkplug');QUEST_ITEMS.ed_sparkplug.spawned=true;QUEST_ITEMS.ed_sparkplug.collected=true;updateQuestProgress('fetch_item_dungeon',{biome:'cave'});announce('Spark Plug recovered from the Crystal Depths!','#00d2ff',3);}
```

### 6.4 Escort quest and waypoints

`spawnEscortNPC()` (L8351) looks up an NPC named **`'Bog Witch'`** — which does not exist in `NPC_DEFS` (the swamp NPC is `Mistweaver Fern`), so the function returns immediately and the escort never spawns. See §21.

```js
function spawnEscortNPC(){var witch=npcs.find(function(n){return n.nm==='Bog Witch';});if(!witch)return; ... }
```

Had it spawned, the escort would be `{hp: 50+teamLv*5, spd:40, sz:8}` walking to a point `rnd(300,500)` away, arriving within 30 px, un-sticking itself by `rnd(-20,20)` after 5 s of no movement, and taking `en.dmg*0.3` from enemies within 80 px at `1%*dt*60` probability per enemy per frame. Escort death resets `swamp_2` to `available` and removes it from `activeQuests` (L8462).

`spawnQuestWaypoints()` (L8354) has the same problem in weaker form — it looks for an NPC named **`'Sand Nomad'`** (also absent) but falls back to `(WW*0.78, WH*0.22)`, so waypoints do work: 3 points, each found by up to 30 tries of `centre + rnd(-400,400)` clamped to `[100, WW-100]`, preferring `getBiome === 'desert'`.

### 6.5 Story flags (L749)

```js
var storyFlags={edMet:false,edGoggles:false,edEdibles:0,edQuestComplete:false,betterDrops:false,craterDiscovered:false,edSpaceHints:0,meteorSeen:false,craterVisited:false,edCraterDialogue:false};
```

| Flag | Type | Set by | Read by |
|---|---|---|---|
| `edMet` | bool | `spawnEd()` L8390 | biplane crash gate (`canCrash` L6021) — once Ed exists, no more crash flyovers |
| `edGoggles` | bool | `ground_ed_1.rewardFn` | cosmetic / save only |
| `edEdibles` | number | `ground_ed_2.rewardFn` sets `3` | cosmetic / save only |
| `edQuestComplete` | bool | `ground_ed_3.rewardFn` | unlocks Ed's scheduled supply flights (L6031), `post_quest` dialogue, crater-awareness gate |
| `betterDrops` | bool | `ground_ed_3.rewardFn` | supply drop count `rnd(6,11)` vs `rnd(3,8)` (L6100); crate heal 60% vs 30%, gold `rnd(40,80)` vs `rnd(20,40)` (L6008) |
| `craterDiscovered` | bool | `updateCraterProximity` first entry; cutscene Scene 6 `onEnd` | Ed `crater_hint` branch (L8405) |
| `edSpaceHints` | number | never incremented anywhere | nothing |
| `meteorSeen` | bool | `exitDungeon` on **first** dungeon clear (L7112); cutscene Scene 6 `onEnd` | gates the crater-visit reactions and Ed's crater dialogue |
| `craterVisited` | bool | `updateCraterProximity` second branch | Ed `crater_awareness` gate |
| `edCraterDialogue` | bool | `edInteract` when the awareness scene plays | one-shot guard |

### 6.6 The ALIEN_CRATER / meteor wiring

The chain, end to end:

1. `initGame()` pins the crater at `(2844, 305)` and clears `discovered` (L8281).
2. `genWorld()` keeps a 150 px radius free of props around it (L2095).
3. `exitDungeon(true)` counts cleared dungeons; on the **first** clear it sets `storyFlags.meteorSeen = true` and schedules the cutscene 2.5 s later (L7112):

```js
var _dungCleared=0;for(var _dk in dungeonProgress)if(dungeonProgress[_dk])_dungCleared++;
if(_dungCleared===1&&!storyFlags.meteorSeen){storyFlags.meteorSeen=true;setTimeout(function(){triggerMeteorCutscene();},2500);}
```

4. `triggerMeteorCutscene()` (L4451) plays the 7-shot sequence (§13). Scene 6's `onEnd` sets `storyFlags.meteorSeen`, `ALIEN_CRATER.discovered` and `storyFlags.craterDiscovered` all true (L4991).
5. Walking to the crater afterwards sets `storyFlags.craterVisited` and fires one of four hero lines (L5936–L5941).
6. Talking to Ed with `edQuestComplete && craterVisited && meteorSeen && !edCraterDialogue` opens `DIALOGUE.grandpaEd.crater_awareness` with the `ed_crater` hero reaction and latches `edCraterDialogue` (L8403).
7. `F10` in DEV_MODE replays the cutscene (L1021); the dev console has a `▶ Meteor` button (L9825).

`METEOR_CUTSCENE_PLAYED` (L725) is vestigial — never read, never written.

### 6.7 Quest UI

- `questNotifs[]` — toasts `{text,col,timer}` decremented in `updateNPCs9` (L8470) and drawn by `drawQuestNotifs()` when neither the journal nor bestiary is open.
- `showQuestJournal` toggled by the `questJournal` bind (`j`), which also closes bestiary/skill tree/inventory/pause and sets `paused` accordingly (L960).
- `drawQuestTracker()` renders the tracked quest at `(W-140, 142)`, size 130 x 42; clicking it cycles `questTrackerIdx` through `activeQuests` (L1043).
- `getNextObjective9()` (L8475) drives the compass; priority order is: completable quest turn-in target (Ed first) → unopened cages → uncollected overworld quest items → Ed when he has an available quest and `edQuestPhase < 4` → escort NPC → unvisited waypoints → living mini-bosses → uncleared dungeon entrances → Goblin King → open portal → Volcanic Rift.

---
## 7. Dialogue System Mechanics

**Legacy lines:** `// ===== V22: DIALOGUE SYSTEM =====` L751–L835. All spoken text is family canon and lives in FAMILY_CANON — this section lists **keys, triggers, and the selection/rendering machinery only**.

### 7.1 State (L752–L753)

```js
var dialogueActive=false,dialogueQueue=[],dialogueCharIdx=0,dialogueTyping=true,dialogueLineIdx=0;
var dialoguePortrait=null,dialogueName='',dialogueNameCol='#fff';
```

`dialogueQueue` is an array of `{text,name,col,portrait}`; `dialogueLineIdx` is the current line; `dialogueCharIdx` is the typewriter cursor.

### 7.2 `DIALOGUE` shape (L754–L798) — keys and triggers

Only one speaker exists: `DIALOGUE.grandpaEd`.

| Category key | Lines | Trigger |
|---|---|---|
| `greetings` | 6 | `edInteract()` fallback when no Ed quest is available/completable and `edQuestComplete` is false (L8407); paired with hero reaction `quest_intro` |
| `quest_ground_ed.phase1_intro` | 4 | accepting `ground_ed_1` (L8399); reaction `quest_intro` |
| `quest_ground_ed.phase1_return` | 1 | turning in `ground_ed_1` (L8394); no reaction |
| `quest_ground_ed.phase2_intro` | 3 | accepting `ground_ed_2` |
| `quest_ground_ed.phase2_return` | 1 | turning in `ground_ed_2` |
| `quest_ground_ed.phase3_intro` | 3 | accepting `ground_ed_3` |
| `quest_ground_ed.phase3_return` | 1 | turning in `ground_ed_3` |
| `quest_ground_ed.quest_complete` | 4 | immediately after `phase3_return` (L8396); reaction `space_hint` |
| `crash_landing` | 4 | **declared but never opened by any call site** (see §21) |
| `post_quest` | 5 | `edInteract()` when `storyFlags.edQuestComplete` (L8406); reaction `space_hint` |
| `crater_awareness` | 5 | `edInteract()` when `edQuestComplete && craterVisited && meteorSeen && !edCraterDialogue` (L8403); reaction `ed_crater` |
| `crater_hint` | — | **referenced at L8405 but no such key exists** — the call is a silent no-op |

Nested categories are addressed with a dotted path (`'quest_ground_ed.phase1_intro'`), resolved by `reduce` inside `openDialogue`.

### 7.3 `HERO_REACTIONS` (L799–L802) — contexts per hero

```js
function getHeroReaction(heroName,context){var pool=HERO_REACTIONS[heroName];if(!pool||!pool[context])return null;var lines=pool[context];return lines[Math.floor(Math.random()*lines.length)];}
```

Keyed by the hero's uppercase `nm`. Each context holds an array (all are single-element in v27), and one line is picked uniformly.

| Context | LIAM | NOAH | COLLETTE | ISABELLA | Where used |
|---|---|---|---|---|---|
| `crash_landing` | ✓ | ✓ | ✓ | ✓ | *no call site* |
| `quest_intro` | ✓ | ✓ | ✓ | ✓ | Ed quest accept + greetings |
| `space_hint` | ✓ | ✓ | ✓ | ✓ | `quest_complete`, `post_quest` |
| `dungeon_enter` | ✓ | ✓ | ✓ | ✓ | *no call site* |
| `boss_appear` | ✓ | ✓ | — | ✓ | *no call site* |
| `sibling` | ✓ | — | — | — | *no call site* |
| `swamp_item` | — | ✓ | ✓ | — | *no call site* |
| `crater` | — | ✓ | — | ✓ | `updateCraterProximity` first discovery (L5934) |
| `ed_crater` | — | ✓ | — | ✓ | Ed `crater_awareness` (L8403) |
| `mid_boss` | — | — | ✓ | — | *no call site* |
| `victory` | — | — | ✓ | — | *no call site* |
| `snack_reward` | — | — | — | ✓ | *no call site* |
| `following_collette` | — | — | — | ✓ | *no call site* |

`getHeroReaction` returns `null` when the active hero has no line for that context, and `openDialogue` simply omits the reaction line — so contexts defined for only some heroes degrade gracefully.

### 7.4 `openDialogue` — selection and queue build (L804)

```js
function openDialogue(charKey,category,heroReactionCtx){var dlgData=DIALOGUE[charKey];if(!dlgData)return;var lines=category.indexOf('.')>=0?category.split('.').reduce(function(o,k){return o&&o[k];},dlgData):dlgData[category];if(!lines||!lines.length)return;dialogueQueue=[];for(var i=0;i<lines.length;i++)dialogueQueue.push({text:lines[i].text||lines[i],name:charKey==='grandpaEd'?'Grandpa Ed':charKey,col:charKey==='grandpaEd'?'#228B22':'#fff',portrait:charKey==='grandpaEd'?'ed':null});if(heroReactionCtx){var h0=heroes[activeHero];if(h0){var rLine=getHeroReaction(h0.nm,heroReactionCtx);if(rLine)dialogueQueue.push({text:rLine,name:h0.nm,col:HDEFS[activeHero].col||'#fff',portrait:null});}}dialogueActive=true;dialogueLineIdx=0;dialogueCharIdx=0;dialogueTyping=true;events.emit('dialogueOpen',{charKey:charKey,category:category});}
```

The whole category is queued in array order — **there is no rotation, no random pick, and no "seen" tracking**: `greetings` always plays all six lines from the top, every time. A hero reaction, when requested and available, is appended as the final line in the active hero's colour with no portrait. Opening emits `dialogueOpen` on the event bus.

**"Greeting rotation" caveat:** the biome NPCs (not Ed) do have a rotation field — `npc.dlgIdx` indexes `NPC_DEFS[i].dlg` in `getNPCDialogue` (L8348), but `dlgIdx` is only ever reset to `0` on first visit (L8447) and never incremented, so in practice each biome NPC shows only its first line. Ed's `dlgIdx` is likewise unused.

### 7.5 Advance / typewriter (L805)

```js
function advanceDialogue(){if(dialogueTyping){dialogueCharIdx=9999;dialogueTyping=false;return;}dialogueLineIdx++;if(dialogueLineIdx>=dialogueQueue.length){dialogueActive=false;dialogueQueue=[];dialogueLineIdx=0;dialogueCharIdx=0;events.emit('dialogueClose');return;}dialogueCharIdx=0;dialogueTyping=true;}
```

First press completes the current line instantly; the second advances. Falling off the end closes the box and emits `dialogueClose`. The interact key routes here first (L970) and the mobile interact button does the same (L1006).

Typewriter speed: `update()` short-circuits while dialogue is open and advances two characters per frame (L9248):

```js
if(dialogueActive){dialogueCharIdx+=2;return;}
```

Because this is `return`-before-everything, **the entire overworld simulation is frozen while dialogue is up** (no enemy AI, no timers, no biplane — `updateBiplane` also early-returns on `dialogueActive`, L5973).

### 7.6 Box rendering (L806)

`drawDialogueBox()` draws a rounded panel at `x=20, y=H-120, w=W-40, h=100`, fill `rgba(11,14,26,0.94)`, 1.5 px `#E8A838` border, corner radius 12. Layout inside: portrait/avatar circle radius 22 at `(x+38, y+38)`; speaker name in `bold 13px sans-serif` at `x+70`; body text `12px sans-serif` word-wrapped to `bw-80` px with 16 px line height starting at `y+42`. When the line is fully typed a `▶` marker pulses in the bottom-right at `alpha = 0.5 + 0.5*sin(gt*6)`.

### 7.7 Portrait system (L807)

`drawPortrait(ctx2, cx, cy, charId, mood)` currently implements exactly one portrait, `'ed'`: a `#228B22` head circle (r 18), two white eyes (r 4) with `#228B22` pupils (r 2.2) and white specular dots, brown `#7A4018` goggle rings (r 5) joined by a strap, translucent lens highlights, a smile arc, and a swaying `#1a5c1a` scarf driven by `sin(gt*2)*3`. `mood` is accepted and only `'happy'`/`'wink'` change anything (they add two small `#165B16` cheek strokes) — every other mood string renders identically. `drawDialogueBox` always calls it with `'happy'`, so **mood is effectively unused at runtime** even though every canon line carries one.

Moods present in the canon data (for a future portrait set): `happy, wink, smirk, wistful, dreamy, nervous, cheerful, sheepish, thinking, serious, worried, relieved, excited, annoyed, overjoyed, triumphant, proud, puzzled, hopeful, resigned, secretive, curious, stunned, distracted`.

---

## 8. NPCs, Grandpa Ed & the Biplane

**Legacy lines:** `NPC_DEFS` L626–L632; `FAMILY_NPC_DEFS` L633; `ED_LANDING`/`edNPC` L634; `biplane` L635–L646; NPC update L8443–L8474; Ed draw L8380; `spawnEd`/`despawnEd`/`edInteract` L8390–L8408; biplane logic L5945–L6285.

### 8.1 `NPC_DEFS` (L626–L632)

| Name | Biome | `col` | `dk` | Icon |
|---|---|---|---|---|
| Rootkeeper Elm | forest | `#58B888` | `#2E7A58` | 🌳 |
| Lamplighter Quartz | cave | `#8E98D8` | `#5868A8` | 🔮 |
| Dunewalker Sol | desert | `#E8A860` | `#987040` | 🏜️ |
| Mistweaver Fern | swamp | `#70C090` | `#386848` | 🧪 |
| Hearthkeeper Neve | frozen | `#A8D0E8` | `#5878A0` | ❄️ |

Each carries a 3-line `dlg` array (canon; FAMILY_CANON). Placement rules are in §3.3. Runtime instance fields: `{nm,x,y,col,dk,icon,dlg,dlgIdx,visited,talkT,showBubble,bubbleT}`.

`updateNPCs9(dt)` (L8443) per frame:
- `npcTalkCD = max(0, npcTalkCD - dt)` (a 1 s cooldown set on every quest interaction).
- For each NPC, check **all** unlocked living heroes (not just the active one) for proximity `< 60`. If near and `npcTalkCD <= 0`: `showBubble = true`, `bubbleT = 5`, first visit sets `visited=true, dlgIdx=0`, and `updateQuestProgress('talk_to',{npcName:npc.nm})` fires.
- `bubbleT` decays; the bubble also clears if no hero is within 120 px.
- Escort NPC, quest waypoints, quest-notification timers and Ed proximity (60 px, `bubbleT = 3`) are all updated in the same function.

`drawNPC9` (L8409) renders a body ellipse (`dk` shadow ellipse + `col` body 12x14 + head r 9), eyes, a `rgba(255,255,255,0.4)` accent ring, a bobbing emoji at `sy-30 + sin(gt*2)*3`, the name at `sy+28`, the quest marker at `(sx+18, sy-20)`, and a word-wrapped speech bubble (`min(200, len*7+20)` wide, 40 tall) at `sy-65` with a downward pointer.

### 8.2 `FAMILY_NPC_DEFS` and Ed's NPC form (L633–L634, L8390)

```js
var FAMILY_NPC_DEFS={grandpaEd:{nm:'Grandpa Ed',col:'#228B22',dk:'#165B16',icon:'✈️',dialogueKey:'grandpaEd',questGroup:'ground_ed',portrait:'ed',drawFn:'drawGrandpaEd'}};
var ED_LANDING={x:0,y:0};var edNPC=null;
function spawnEd(){edNPC={x:ED_LANDING.x,y:ED_LANDING.y,nm:'Grandpa Ed',col:'#228B22',dk:'#165B16',showBubble:false,bubbleT:0,visited:false,dlgIdx:0};storyFlags.edMet=true;}
function despawnEd(){edNPC=null;}
```

`FAMILY_NPC_DEFS` is a data table that describes Ed but is **not read by any runtime code** — `spawnEd()` hard-codes the same values. `ED_LANDING` is `(1120, 1120)`, set in `initGame`. `despawnEd()` is never called.

`drawGrandpaEd(npc)` (L8380): shadow ellipse; `#165B16` body 15x16 with `#228B22` overlay 14x15; head circle r 10; brown `#7A4018` goggles (two r-4 rings + strap) with white highlight dots; white eyes r 2.8 with `#228B22` pupils; smile arc; a `#1a5c1a` scarf whose sway is `sin(gt*2 + npc.x)*3`; name label at `sy+30`; and, when the active hero is within 70 px, a `rgba(34,139,34,0.3)` interaction ellipse (20 x 22).

### 8.3 The `biplane` state object (L635–L646)

```js
var biplane={active:false,x:0,y:0,alt:50,vx:0,vy:0,wobbleT:0,sputterT:0,sputterOn:false,smokeTrail:[],crashing:false,crashT:0,timer:20,crate:null,fromEdge:0,event:'none',
  flightTime:0,startX:0,startY:0,
  hasCrashed:false,
  crashReady:false,crashReadyTimer:0,flyoverCount:0,
  edFlying:false,edTakeoff:0,edLanding:0,
  edWalkPath:null,edWalkT:0,edFlightCooldown:0,
  parachuteCrates:[],_dropped:false,
  heading:0,targetHeading:0,turnRate:0,
  trick:null,trickCooldown:0,
  courseTimer:0,courseTarget:{x:0,y:0}
};
```

### 8.4 Ed state machine (`updateBiplane`, L5973–L6146)

`updateBiplane(dt)` early-returns on `inDungeon || paused || dialogueActive || state!=='playing'`. Parachute crates are updated first and unconditionally (they persist after the plane leaves).

**Phase A — pre-crash (while `!biplane.hasCrashed`, L5997–L6027).** With the plane inactive:

```js
biplane.timer-=dt;
if(!biplane.crashReady&&!storyFlags.edMet){
  biplane.crashReadyTimer-=dt;
  if(biplane.crashReadyTimer<=0)biplane.crashReady=true;
}
if(biplane.timer<=0){
  biplane.flyoverCount++;
  var nextInterval;
  if(biplane.flyoverCount<3)nextInterval=25+rnd(0,15);
  else if(biplane.flyoverCount<6)nextInterval=35+rnd(0,20);
  else nextInterval=50+rnd(0,25);
  biplane.timer=nextInterval;
  var canCrash=biplane.crashReady&&!storyFlags.edMet&&!inDungeon&&!bossUp&&!activeEvent&&!dialogueActive;
  if(canCrash){ _launchBiplane('crash',true); announce('✈️ A biplane sputters overhead!','#D94848',2); }
  else { var evt2=Math.random()<0.4?'supply':'flyover'; _launchBiplane(evt2,true); announce(evt2==='supply'?'✈️ Supply drop inbound!':'✈️ A biplane flies overhead!','#E8A838',2); }
}
```

| Timer | Initial | Cadence |
|---|---|---|
| `biplane.timer` (next flyover) | `20` s | flyovers 1–2: `25 + rnd(0,15)`; 3–5: `35 + rnd(0,20)`; 6+: `50 + rnd(0,25)` |
| `biplane.crashReadyTimer` | `90 + rnd(0,30)` s | counts down only while Ed has not been met; hitting 0 arms the crash |

Non-crash launches are 40% `supply`, 60% `flyover`.

**Phase B — post-repair scheduled flights (L6031–L6039).** Once `storyFlags.edQuestComplete` and Ed is on the ground:

```js
biplane.edFlightCooldown-=dt;
if(biplane.edFlightCooldown<=0){
  biplane.edFlying=true;biplane.edWalkT=0;
  biplane.edWalkPath=_getEdWalkPath(edNPC.x,edNPC.y,ED_LANDING.x,ED_LANDING.y);
  announce("Ed: \"Time for a supply run!\"","#228B22",2);
}
```

`edFlightCooldown` is set to `999` at crash-landing (disabling flights) and to `120 + rnd(0,60)` after each completed supply run (L6122).

**Phase C — walk to the plane (L6042–L6058).** Ed walks his path at **80 px/s**; the path comes from `_getEdWalkPath` (L6148), which samples the straight line every 30 px and pushes each sample 20 px away from any `tree`/`pinetree`/`rock` within 30 px. On arrival Ed snaps to `ED_LANDING`, `_launchBiplane('supply', false)` fires, `edNPC._hidden = true`, and if the takeoff is off-screen `edTakeoff` is zeroed so the plane starts at altitude.

**Phase D — active flight (L6061–L6118).**

```js
if(biplane.edTakeoff>0){biplane.edTakeoff-=dt;biplane.alt=Math.min(150,(2.5-biplane.edTakeoff)*60);if(biplane.edTakeoff<=0)biplane.alt=150;}
```

Takeoff is a 2.5 s climb to altitude 150 at 60 px/s.

Steering (non-crash events only):

```js
biplane.courseTimer-=dt;
if(biplane.courseTimer<=0&&!biplane.trick){biplane.courseTimer=rnd(2.5,5);var curA=Math.atan2(biplane.vy,biplane.vx);biplane.targetHeading=curA+rnd(-0.6,0.6);}
...
var velA=Math.atan2(biplane.vy,biplane.vx);var desiredA=biplane.targetHeading||velA;
var steerDiff=_normA(desiredA-velA);var maxSteer=1.2*dt;
var steerAmt=steerDiff>0?Math.min(steerDiff,maxSteer):Math.max(steerDiff,-maxSteer);
var newA=velA+steerAmt;biplane.vx=Math.cos(newA)*nomSpd;biplane.vy=Math.sin(newA)*nomSpd;
var headDiff=_normA(newA-biplane.heading);biplane.heading+=headDiff*Math.min(1,3.5*dt);
biplane.turnRate=lerp(biplane.turnRate,steerDiff*2.5,4*dt);
```

Nominal speed `nomSpd = 100` px/s; heading changes at most `1.2 rad/s`; the visual `heading` chases the velocity angle at `3.5/s`; `turnRate` (used for bank roll) eases toward `steerDiff*2.5` at `4/s`. Course is re-randomised every `rnd(2.5,5)` s by up to ±0.6 rad.

**Aerobatics (L6074–L6081):**

```js
biplane.trickCooldown-=dt;
if(!biplane.trick&&biplane.trickCooldown<=0&&biplane.flightTime>2.5&&biplane.event!=='crash'){
  biplane.trickCooldown=rnd(7,15);var tType=Math.random()<0.5?'barrel_roll':'loop';var tDir=Math.random()<0.5?1:-1;
  biplane.trick={type:tType,t:0,dur:tType==='barrel_roll'?1.0:1.8,dir:tDir};
}
```

| Trick | Duration | Direction |
|---|---|---|
| `barrel_roll` | 1.0 s | ±1, 50/50 |
| `loop` | 1.8 s | ±1, 50/50 |

First trick cooldown is `rnd(4,8)` (set at launch); subsequent `rnd(7,15)`. Tricks are suppressed during crash runs and for the first 2.5 s of any flight, and they freeze course re-randomisation while running.

**Engine sputter (L6091–L6092):** every `2.5` s the engine coughs — `sputterOn=true` and `alt -= 3`; `0.15` s later it recovers and `alt` climbs back by 3 (capped at 150). Smoke: while `smokeTrail.length < 80`, 40% chance per frame to append `{x,y,life:1.5,sz:rnd(2,5)}` at a point 20 px behind the nose, offset upward by `alt`.

**Path progress & event payloads (L6094–L6106):**

```js
var distTraveled=Math.hypot(biplane.x-biplane.startX,biplane.y-biplane.startY);var totalPath=Math.max(W,H)+160;var pathProg=distTraveled/totalPath;
if(biplane.event==='crash'&&pathProg>0.4){biplane.crashing=true;biplane.crashT=0;edCrashCount++;}
```

| Event | Trigger point | Payload |
|---|---|---|
| `crash` | `pathProg > 0.4` | begins the crash spiral |
| `supply` | `pathProg > 0.2` | `numCrates = betterDrops ? floor(rnd(6,11)) : floor(rnd(3,8))`, staggered `delay = i*0.7 + rnd(0,0.2)` s; `announce('📦 Supply crates incoming!','#E8A838',2)`; emits `biplaneSupplyDrop` |
| `flyover` | `pathProg > 0.35` | `floor(rnd(3,6))` crates, same 0.7 s stagger, **no announce** |

**Exit (L6109–L6118).** After `flightTime > 1.5` s, the plane despawns once it is more than 300 px outside the camera rect or 100 px outside the world. If it was one of Ed's flights: `edLanding = 2`, `edFlying = false`, Ed is un-hidden and snapped to `ED_LANDING`, `edFlightCooldown = 120 + rnd(0,60)`, and `announce("Ed's back from his supply run!","#228B22",2)`.

**Crash sequence (L6120–L6134):**

```js
biplane.crashT+=dt;var tx=ED_LANDING.x,ty=ED_LANDING.y;var dToLanding=Math.hypot(biplane.x-tx,biplane.y-ty);
var crashSpd=Math.max(200,dToLanding*1.5);var cAng=Math.atan2(ty-biplane.y,tx-biplane.x);
var spiral=Math.sin(biplane.crashT*4)*40;
biplane.vx=Math.cos(cAng)*crashSpd+Math.cos(cAng+PI/2)*spiral;biplane.vy=Math.sin(cAng)*crashSpd+Math.sin(cAng+PI/2)*spiral;
...
biplane.alt=Math.max(0,biplane.alt-25*dt);
```

The plane homes on `ED_LANDING` at `max(200, distance*1.5)` px/s with a perpendicular sine wobble of amplitude 40 at 4 rad/s, descending 25 px/s, heading chasing velocity at `5/s`, smoke at 70%/frame up to 120 puffs. On touchdown (`dToLanding < 30` **or** `alt <= 0`):

```js
biplane.active=false;biplane.hasCrashed=true;biplane.x=tx;biplane.y=ty;
shk.i=8;shk.t=0.5;shk.maxT=0.5;
for(var di=0;di<15;di++)parts.push(new Part(tx,ty,{vx:rnd(-100,100),vy:rnd(-100,-20),life:1,sz:rnd(2,6),col:pick(['#8B4513','#654321','#a0522d']),grav:200}));
snd('boom',0.3);if(!edNPC)spawnEd();events.emit('biplaneCrash');announce("Grandpa Ed has crash-landed!","#228B22",3);
biplane.edFlightCooldown=999;
```

Screen shake 8 for 0.5 s, a 15-piece wood-debris burst, `snd('boom',0.3)`, Ed spawns at the landing strip (setting `storyFlags.edMet`), and the `biplaneCrash` event fires.

### 8.5 `_launchBiplane(evt, fromCam)` (L5945–L5965)

```js
biplaneSeen++;biplane.event=evt;biplane.fromEdge=Math.floor(rnd(0,4));
var sx,sy,evx,evy;var spd=100;
if(fromCam){
  if(biplane.fromEdge===0){sx=cam.x-80;sy=cam.y+H*0.3+rnd(0,H*0.4);evx=spd;evy=rnd(-15,15);}
  else if(biplane.fromEdge===1){sx=cam.x+W+80;sy=cam.y+H*0.3+rnd(0,H*0.4);evx=-spd;evy=rnd(-15,15);}
  else if(biplane.fromEdge===2){sy=cam.y-80;sx=cam.x+W*0.3+rnd(0,W*0.4);evy=spd;evx=rnd(-15,15);}
  else{sy=cam.y+H+80;sx=cam.x+W*0.3+rnd(0,W*0.4);evy=-spd;evx=rnd(-15,15);}
} else {
  sx=ED_LANDING.x;sy=ED_LANDING.y;
  var ta=rnd(0,TAU);evx=Math.cos(ta)*spd;evy=Math.sin(ta)*spd;
}
```

`fromCam` launches from one of the four camera edges 80 px off-screen at altitude 150; `fromCam=false` (Ed's own flights) launches from the landing strip at altitude 0 with `edTakeoff = 2.5`. `biplaneSeen >= 10` unlocks the `frequentFlyer` achievement; every launch emits `biplaneFlyover`.

### 8.6 Parachute supply drops (L5966–L6015)

```js
function _spawnParachuteCrate(x,y,planeVx,planeVy){
  var crate={x:x,y:y,alt:biplane.alt||60,vy:0,vx:planeVx*0.3,ground:false,glow:0,life:45,
    chuteDeploy:0,chuteOpen:false,chuteSize:0,
    drift:0,driftDir:weather.type==='storm'||weather.type==='sand'?rnd(-20,20):rnd(-5,5),
    spin:rnd(-4,4),swayPhase:rnd(0,TAU),landBounce:0};
  biplane.parachuteCrates.push(crate);
}
```

Descent physics:

```js
pc.chuteDeploy+=dt;
if(!pc.chuteOpen&&pc.chuteDeploy>0.35){pc.chuteOpen=true;pc.chuteSize=0.1;}
if(pc.chuteOpen){
  pc.chuteSize=Math.min(pc.chuteSize+dt*2.5,1);
  var chuteEffect=pc.chuteSize*pc.chuteSize;
  var targetVy=18+15*(1-chuteEffect);
  pc.vy=lerp(pc.vy,targetVy,dt*3);
  pc.vx=lerp(pc.vx,pc.driftDir,dt*1.5);
  pc.spin=lerp(pc.spin,0,dt*3);
} else {
  pc.vy+=350*dt;
  pc.spin+=rnd(-2,2)*dt;
}
pc.alt-=pc.vy*dt;pc.x+=pc.vx*dt;
```

Free-fall for 0.35 s at 350 px/s², then the canopy inflates over 0.4 s (`chuteSize` at 2.5/s) and terminal velocity eases from 33 px/s down to 18 px/s as `chuteSize²` reaches 1. Horizontal velocity eases toward `driftDir` at 1.5/s; spin damps to zero at 3/s.

On landing: `alt=0`, `ground=true`, `landBounce=1`, `snd('equip',0.15)`, six `#c8b88a` dust particles.

Pickup (active hero within **45 px**), L6008:

```js
var heal=storyFlags.betterDrops?0.6:0.3;
if(Math.random()<0.6){_ch.hp=Math.min(_ch.maxHp,_ch.hp+_ch.maxHp*heal);announce("Supply crate: Healed!","#3DCC7A",2);}
else{var gAmt=storyFlags.betterDrops?rnd(40,80):rnd(20,40);gold+=Math.floor(gAmt);announce("Supply crate: +"+Math.floor(gAmt)+" Gold!","#E8A838",2);}
```

60% heal (30% of max HP, or 60% with `betterDrops`), 40% gold (`rnd(20,40)`, or `rnd(40,80)` with `betterDrops`). Crates expire after `life = 45` s on the ground.

### 8.7 `edInteract()` — the repair quest chain handler (L8392–L8408)

Order of checks, first match wins:

1. **Turn-in:** for `qids = ['ground_ed_1','ground_ed_2','ground_ed_3']`, if any is `completable` → open `quest_ground_ed.phase<N>_return`, mark `complete`, remove from `activeQuests`, run `rewardFn`, add `rewardXP` directly to `totalXP` (bypassing `addXP`) with a `+XP` particle per 10 XP, set `edQuestPhase = phase+1`, emit `questComplete`. If phase 3: also open `quest_complete` with the `space_hint` reaction, `announce("The Green Meanie lives again!","#228B22",4)`, `trigAch('wellEducated')`, `edQuestPhase = 4`. Then auto-offer the next quest in the chain (setting it `active` and calling `spawnQuestItem` for the matching item).
2. **Offer:** for the same three ids, the first `available` one whose prereq is complete → open `quest_ground_ed.phase<N>_intro` with the `quest_intro` reaction, set it `active`, push to `activeQuests`, set `edQuestPhase = N`, `spawnQuestItem(...)`.
3. **Crater awareness:** `edQuestComplete && craterVisited && meteorSeen && !edCraterDialogue` → latch `edCraterDialogue`, open `crater_awareness` with the `ed_crater` reaction.
4. **Crater hint:** `craterDiscovered && !edCraterDialogue && meteorSeen && !edQuestComplete` → `openDialogue('grandpaEd','crater_hint','ed_crater')` — **no-op, the key does not exist**.
5. **Post-quest:** `edQuestComplete` → `post_quest` with `space_hint`.
6. **Default:** `greetings` with `quest_intro`.

`edQuestPhase` therefore reads: `0` = nothing started, `1..3` = that phase active, `4` = whole chain done.

Interaction range is **70 px** (checked in the keydown handler at L970 and the mobile interact button at L1006, both before the merchant/bounty/NPC checks) — Ed takes priority over every other overworld interactable.

---
## 9. World Events

**Legacy lines:** `// ===== WORLD EVENTS =====` L5742; `trigWorldEvent` L5743–L5796; `updateWorldEvents` L6286–L6348; `drawWorldEventEffects` L6349–L6376. State declared at L5379: `let worldEventTimer=60,activeEvent=null,eventEntities=[];`

### 9.1 Scheduling (L6286–L6293)

```js
function updateWorldEvents(dt){
  if(inShadowRealm||bossUp||inDungeon)return; // No events during boss fights or dungeons
  worldEventTimer-=dt;
  if(worldEventTimer<=0&&!activeEvent){
    trigWorldEvent();
    worldEventTimer=90;
  }
  if(!activeEvent)return;
  activeEvent.timer-=dt;
```

First event fires 60 s into a run (`worldEventTimer=60` in `initGame`), then every 90 s. The timer does not tick in the Shadow Realm, during the Goblin King fight, or in a dungeon. Only one event runs at a time. `trigWorldEvent()` picks uniformly from `['caravan','bloodmoon','treasure','spring','earthquake']` and plays `snd('event_start',0.3)`.

### 9.2 Event table

| Event | Duration | Setup | Resolution | Rewards |
|---|---|---|---|---|
| **caravan** — 💰 GOBLIN CARAVAN! Kill them for loot! | 20 s | 8 goblins spawned along an edge-to-edge path (start edge picked from 4), each `hp/maxHp = 40`, `spd = 60`, `type = 'caravan_goblin'`, `xp = 10`, `caravanTarget = {ex,ey}`; laid out at `gx + i*25, gy + i*15` | all 8 dead → `lootDropped` | 3 × `rollGearDrop(0,1)` equips at the goblins' centroid ±30, plus `addXP(50)`, `announce('Caravan loot secured!','#E8A838',2)` |
| **bloodmoon** — 🔴 BLOOD MOON! 2x enemy speed, 3x XP! | 25 s | `bloodMoonActive = true`; `trigAch('eventSurvivor')` | timer expiry clears the flag, `announce('Blood Moon fades...')`, `updateQuestProgress('survive_event')` | XP ×3 (replaces the night ×1.5), enemy speed ×1.25 on top of night, enemy damage ×1.5 |
| **treasure** — 💰 TREASURE GOBLIN! Catch it! | 15 s | one goblin at `hero ± rnd(-200,200)`, `hp/maxHp = 100`, `spd = 200`, `col '#E8A838'`, `dk '#C89E28'`, `sz 10`, `type 'treasure_goblin'`, `xp 20`, `fleeing = true` | killed → loot; timer expiry **or** goblin reaching a world edge (`x<10 || x>WW-10 || y<10 || y>WH-10`) → escaped | `trigAch('treasureHunter')`, one `rollGearDrop(1,1)` at the corpse plus two `rollGearDrop(1,0)` at ±20 |
| **spring** — 💚 Healing Spring appeared! | 20 s | pool at `hero ± rnd(-300,300)` clamped to `[100, WW-100]` | timer expiry, `announce('The spring fades...')`, `updateQuestProgress('survive_event')` | heals every unlocked, living, non-downed, non-banished hero inside **80 px** at `25 HP/s` |
| **earthquake** — 🌋 EARTHQUAKE! Enemies stunned! | 3 s | `screenShake(12,3)`; every living enemy gets `stunT = 2` | timer expiry, `updateQuestProgress('survive_event')` | 2 s stun on all overworld enemies |

Note the asymmetry: `caravan` and `treasure` do **not** call `updateQuestProgress('survive_event')`, so the `desert_1` quest ("Survive 3 world events") only counts bloodmoon, spring and earthquake.

### 9.3 Shadow pools (`eventEntities`, L6339–L6347)

```js
eventEntities=eventEntities.filter(function(e){
  e.life-=dt;
  if(e.type==='shadow_pool'){
    for(var i=0;i<heroes.length;i++){
      var h=heroes[i];if(!h.unlocked||h.dead||h.downed||h.banished)continue;
      if(dst(h,e)<e.r)h.takeDmg(Math.floor(e.dmg*dt*60));
    }
  }
  return e.life>0;
});
```

`shadow_pool` entities are spawned by the Shadow Queen (Part 1). They tick `floor(dmg * dt * 60)` per frame to any hero inside `e.r` and expire on `life`. Rendering (L6367) is a `rgba(100,0,150,0.4)` disc with an `rgba(232,67,147,0.6)` rim, alpha `clamp(life/1, 0, 0.5)`.

### 9.4 Event visuals (`drawWorldEventEffects`, L6349)

- **Blood moon:** full-screen `rgba(180,0,0,1)` at `globalAlpha = 0.2 + sin(gt*3)*0.05`.
- **Spring:** `rgba(46,204,113,0.3)` filled disc r 80 plus a breathing `rgba(46,204,113,0.6)` ring at `r = 80 + sin(gt*4)*5`, alpha `0.4 + sin(gt*3)*0.1`, labelled "Healing Spring" at `sy-85`. Also drawn on the minimap as a 3 px `#3DCC7A` dot (L3396).

---

## 10. Endless Mode

**Legacy lines:** `// ===== ENDLESS MODE =====` L6627–L6727.

Entered from the victory overlay (`vicEndless` button, L9428) which calls `startEndlessMode()`.

### 10.1 Entry (L6628–L6639)

```js
function startEndlessMode(){
  endlessMode=true;endlessWave=0;endlessScore=0;endlessWaveTransitioning=false;
  inShadowRealm=false;shadowQueen=null;
  enemies=[];miniBosses=[];boss=null;
  for(var i=0;i<heroes.length;i++){
    if(heroes[i].unlocked){heroes[i].hp=heroes[i].maxHp;heroes[i].dead=false;heroes[i].downed=false;heroes[i].banished=false;}
  }
  announce('ENDLESS MODE - Survive!','#e84393',3);
  snd('event_start',0.4);
  nextEndlessWave();
}
```

All unlocked heroes are fully restored; the Shadow Realm is exited; every combat entity is cleared.

### 10.2 Wave scaling (`nextEndlessWave`, L6640–L6692)

```js
endlessWave++;
var isBoss=endlessWave%10===0;
endlessBossWave=isBoss;
// v20-fix: Sane enemy scaling — caps at 15, grows slowly
var enemyCount=Math.min(4+Math.floor(endlessWave*0.8),15);
var mul=1+endlessWave*0.05; // gentler scaling multiplier
```

| Quantity | Formula | Cap |
|---|---|---|
| Enemy count | `min(4 + floor(wave*0.8), 15)` | 15 (reached at wave 14) |
| Stat multiplier `mul` | `1 + wave*0.05` | none |
| Enemy HP / DMG | `floor(base * mul)` | — |
| Enemy speed | `min(spd*(1 + wave*0.01), spd*2)` | 2× base |
| Enemy XP | `floor((xp||5) * (1 + wave*0.03))` | — |
| Boss wave | every 10th wave; enemy count reduced to `max(2, floor(count*0.4))` | — |
| Mini-boss | every 5th wave that is **not** a boss wave, 1 spawned with `mul` applied | — |

Boss waves alternate: `bossNum = floor(wave/10)`; odd `bossNum` (waves 10, 30, 50 …) spawns a scaled **Goblin King** (`boss`, `bossUp=true`), even (waves 20, 40 …) spawns a scaled **Shadow Queen** (`shadowQueen`). Boss position is `activeHero ± rnd(-300,300)` clamped to `[100, WW-100]`, announced as `'WAVE N - BOSS!'` with `snd('boss',0.5)`.

Enemy type pool grows with the wave:

| Wave | Pool |
|---|---|
| 1–9 | `goblin, orc, bat, slime, skeleton, mushroom` |
| 10–19 | + `shielded, archer, troll` |
| 20+ | + `fire_elemental, obsidian_guard` |

Spawn position is `activeHero ± rnd(-400,400)` clamped to `[50, WW-50]`. Mini-boss types are `['golem','sandworm','hydra','frostwyrm']` spawned at `hero ± rnd(-250,250)` clamped to `[100, WW-100]`.

### 10.3 Wave clear and scoring (`updateEndless`, L6694–L6721)

```js
if(endlessWaveTransitioning||paused||showLvl)return;
var alive=enemies.filter(function(e){return!e.dead;}).length;
var mbAlive=miniBosses.filter(function(m){return!m.dead;}).length;
var bAlive=(boss&&!boss.dead)?1:0;
var sqAlive=(shadowQueen&&!shadowQueen.dead)?1:0;
if(alive===0&&mbAlive===0&&bAlive===0&&sqAlive===0){
  endlessWaveTransitioning=true; // prevent re-entry
  var waveScore=endlessWave*100+(endlessBossWave?500:0);
  endlessScore+=waveScore;
  announce('+'+waveScore+' points!','#E8A838',1.5);
  setTimeout(function(){if(endlessMode&&!gameOver)nextEndlessWave();},2500);
  endlessBossWave=false;
  bossUp=false;
}
if(endlessScore>endlessHighScore){
  endlessHighScore=endlessScore;
  try{localStorage.setItem('ssq_highscore',endlessHighScore+'');}catch(e){}
}
```

Score per wave is `wave × 100`, plus a `+500` bonus on boss waves. Next wave starts 2.5 s after the field is clear. The high score is persisted to `localStorage` under `ssq_highscore`.

`drawEndlessHUD()` (L6722) prints right-aligned at the bottom right: `ENDLESS` (`#e84393`) at `H-50`, `Wave: N` at `H-34`, `Score: N` at `H-18`, and `Best: N` in grey at `H-4` when a high score exists.

Endless mode does not stop world events, weather or the day/night cycle — the normal overworld `update()` continues to run alongside it.

---
## 11. Dungeon System

**Legacy lines:** `// ===== DUNGEON STATE =====` L747; V7 state L836–L852; `CITADEL_FLOORS` L820–L826; `// ===== DUNGEON SYSTEM V6 =====` L6729 through L8256 (data L6730–L6820, entrance L6833–L7061, entry/exit L7062–L7131, generation L7132–L7217, room loading L7218–L7317, interaction L7318–L7357, reachability/waves L7358–L7375, dungeon boss L7376–L7933, renderer L7934–L8114, update L8115–L8256).

Dungeon bosses themselves (Ancient Treant, Pharaoh Wraith, Crystal Colossus, Hydra Matriarch, Frost Lich, Magma Titan, Citadel Warden) and their phase logic are **Part 1**.

### 11.1 Constants and naming tables

```js
var DNG_TW=40,DNG_COLS=16,DNG_ROWS=12;
```

Every room is a fixed **16 × 12 grid of 40 px tiles = 640 × 480 px**, drawn centred in the canvas at `ox = floor((W - 640)/2)`, `oy = floor((H - 480)/2)`. Room coordinates are room-local (0,0 at the top-left tile), not world coordinates; `cam` is forced to `(0,0)` while rendering the room.

**`DUNGEON_NAMES` (L6730)**

| Key | Name |
|---|---|
| `forest` | The Hollow Grove |
| `cave` | The Crystal Depths |
| `desert` | The Buried Tomb |
| `swamp` | The Sunken Temple |
| `frozen` | The Ice Citadel |
| `volcanic` | The Volcanic Rift |
| `citadel` | The Shadow Citadel |
| `citadel_f1` | Shadow Citadel — Floor 1 |
| `citadel_f2` | Shadow Citadel — Floor 2 |
| `citadel_f3` | Shadow Citadel — Floor 3 |

**`DUNGEON_DESCS` (L6731)** — shown on the entry overlay:

| Key | Description |
|---|---|
| `forest` | Ancient roots twist into a maze of thorns. The Treant awaits. |
| `cave` | Crystals pulse with eerie light. A colossus guards the heart. |
| `desert` | Sand-swept corridors hide cursed chambers. The Pharaoh stirs. |
| `swamp` | Toxic waters flood forgotten halls. The Hydra nests below. |
| `frozen` | Ice walls echo with dark magic. A lich commands the frost. |
| `volcanic` | Magma churns beneath obsidian halls. The Titan waits in fire. |
| `citadel` | The ultimate darkness awaits within. Three floors stand between you and the Citadel Warden. |

**`DUNGEON_COLORS` (L6732)**

| Key | Colour |
|---|---|
| `forest` | `#58B888` |
| `cave` | `#8E98D8` |
| `desert` | `#E8A860` |
| `swamp` | `#70C090` |
| `frozen` | `#A8D0E8` |
| `volcanic` | `#D86840` |
| `citadel` | `#8068B0` |
| `citadel_f1` | `#9070B8` |
| `citadel_f2` | `#8068B0` |
| `citadel_f3` | `#A83828` |

**`DUNGEON_TILE_COLORS` (L6733–L6736)**

| Key | floor | wall | accent | door |
|---|---|---|---|---|
| `forest` | `#1A3830` | `#102820` | `#224840` | `#4A9070` |
| `cave` | `#1E2850` | `#161E3C` | `#303868` | `#6880D8` |
| `desert` | `#5C4028` | `#48321E` | `#805438` | `#D89050` |
| `swamp` | `#1C3828` | `#142820` | `#2A5040` | `#489870` |
| `frozen` | `#3C5580` | `#2E4265` | `#5C78A8` | `#98C8E8` |
| `volcanic` | `#2a1a0a` | `#1a0a05` | `#4a2010` | `#ff4400` |
| `citadel_f1` | `#18102a` | `#0e0818` | `#2a1a40` | `#6a3a8a` |
| `citadel_f2` | `#140a20` | `#0a0410` | `#22103a` | `#5a2a7a` |
| `citadel_f3` | `#100818` | `#08040e` | `#1a0830` | `#4a1a6a` |

**`DNG_AMBIENT` (L842)** — the darkness fill colour composited over each room:

| Key | Value |
|---|---|
| `forest` | `rgba(8,20,10,0.70)` |
| `cave` | `rgba(12,10,28,0.72)` |
| `desert` | `rgba(40,28,8,0.62)` |
| `swamp` | `rgba(8,18,8,0.72)` |
| `frozen` | `rgba(8,14,35,0.73)` |
| `volcanic` | `rgba(35,8,4,0.65)` |
| `citadel` | `rgba(18,8,28,0.72)` |

**`DNG_WALL_V` (L843–L844)** — three-tone wall variation palettes:

| Key | Tones |
|---|---|
| `forest` | `#2A4A28`, `#1C3818`, `#382818` |
| `cave` | `#281840`, `#1A2440`, `#362848` |
| `desert` | `#987838`, `#7A5C28`, `#5A4220` |
| `swamp` | `#183810`, `#0E280A`, `#283820` |
| `frozen` | `#506888`, `#405878`, `#6888A8` |
| `volcanic` | `#3D1A0A`, `#2A0E0E`, `#4A2010` |
| `citadel_f1` | `#2A1840`, `#201030`, `#382050` |
| `citadel_f2` | `#281438`, `#1E0C2C`, `#341848` |
| `citadel_f3` | `#381414`, `#2C0E0E`, `#401818` |

**`DNG_DECOR` (L845)** — breakable props:

| `nm` | `hp` | `w` × `h` | `col` | `dk` | `lc` | `lh` | `pc` particle | `pn` count | `sd` sound |
|---|---|---|---|---|---|---|---|---|---|
| `pot` | 1 | 16 × 18 | `#8B6914` | `#6a5010` | 0.5 | 0.2 | `#8B6914` | 6 | `destroy_pot` |
| `crate` | 2 | 18 × 18 | `#a0803a` | `#806028` | 0.6 | 0.15 | `#c4a060` | 8 | `destroy_crate` |
| `bones` | 1 | 16 × 12 | `#d0c8b0` | `#a09880` | 0.3 | 0.0 | `#e0d8c0` | 4 | `destroy_pot` |

(`lc`/`lh` are the loot chance and heal chance used by the Part 1 decor-break handler.)

**`DNG_ATMO` (L846–L849)** — per-biome ambient particle recipe (`cnt` particles kept alive, speed range `sMin..sMax`, lifetime `lMin..lMax`, alpha `aMin..aMax`, `dir ∈ {up, down, drift}`):

| Key | col | cnt | sMin | sMax | lMin | lMax | aMin | aMax | dir |
|---|---|---|---|---|---|---|---|---|---|
| `forest` | `#B8C858` | 18 | 5 | 15 | 4 | 6 | .3 | .5 | drift |
| `cave` | `#7868A8` | 12 | 5 | 10 | 3 | 5 | .3 | .6 | drift |
| `desert` | `#E86820` | 18 | 15 | 25 | 2 | 4 | .5 | .8 | up |
| `swamp` | `#280838` | 12 | 8 | 12 | 3 | 5 | .3 | .5 | up |
| `frozen` | `#E8E8F0` | 22 | 10 | 20 | 3 | 5 | .4 | .7 | down |
| `volcanic` | `#E86820` | 20 | 12 | 22 | 2 | 4 | .4 | .7 | up |
| `citadel_f1` | `#8850A8` | 20 | 8 | 16 | 3 | 5 | .3 | .6 | drift |
| `citadel_f2` | `#7B3CA0` | 25 | 10 | 18 | 3 | 5 | .4 | .7 | up |
| `citadel_f3` | `#A83828` | 30 | 12 | 22 | 2 | 4 | .5 | .8 | drift |

`initDngAtmo(biome)` (L7307) seeds `cnt` particles at random room positions; `dir==='up'` gives `vy = -rnd(sMin,sMax)`, `vx = rnd(-3,3)`; `down` gives `vy = +rnd(sMin,sMax)`, `vx = rnd(-5,5)`; `drift` gives `vx = rnd(-sMax,sMax)`, `vy = rnd(-sMax/2, sMax/2)`. `updDngAtmo(dt)` (L7311) recycles any particle that dies or leaves the room, re-entering from the bottom for `up`, the top for `down`, anywhere for `drift`.

**`DUNGEON_EQUIPS` (L6737)** — the guaranteed clear reward applied by `applyEq()` in `exitDungeon(true)`:

| Biome | Name | Effect | Stat | Colour | Icon |
|---|---|---|---|---|---|
| `forest` | Hearthroot Seed | +3 HP regen/s all | `regen: 3` | `#58B888` | 🌿 |
| `desert` | Sunstone Crest | +12% crit chance | `critRate: 0.12` | `#E8A860` | 👹 |
| `cave` | Lampstone Core | +80 max HP all | `maxHp add 80` | `#8E98D8` | 💎 |
| `swamp` | Marshlight Vial | +15% lifesteal | `lifesteal: 0.15` | `#70C090` | ☠️ |
| `frozen` | Hearthice Crown | Attacks slow +1s | `slow add 1` | `#A8D0E8` | ❄️ |
| `volcanic` | Emberforge Heart | +12% HP, +8% DMG all | `titanHeart: 1` | `#D86840` | 🌋 |

All have `h: -1` (applies to the whole party). There is no `citadel` entry — clearing the Citadel awards the four legendaries instead (§11.9).

### 11.2 Door states (L841)

```js
var DOOR_OPEN=0,DOOR_CLOSED=1,DOOR_LOCKED=2,DOOR_BARRED=3;
```

| Constant | Value | Meaning | How it opens |
|---|---|---|---|
| `DOOR_OPEN` | 0 | passable | — |
| `DOOR_CLOSED` | 1 | declared but **never assigned anywhere** | — |
| `DOOR_LOCKED` | 2 | needs a key | consumes one `dungeonInventory.keys`, either via `heroInteract()` within 60 px of the door centre or automatically when walking into it with a key in hand |
| `DOOR_BARRED` | 3 | lever puzzle | every `lever` object in the room set `active` (L7325) |

Doors are per-room, per-direction: `room.doorStates = {n,s,e,w}`. `dungeonDoorsLocked` is a separate *global* boolean that gates **all** exits during unresolved combat/puzzle/boss rooms.

### 11.3 Tile vocabulary and templates

Room templates are flat 192-element arrays (`16*12`), row-major.

| Tile | Meaning |
|---|---|
| `0` | floor |
| `1` | wall |
| `2` | north door (row 0, cols 7–8) |
| `3` | south door (row 11, cols 7–8) |
| `4` | east door (col 15, rows 5–6) |
| `5` | west door (col 0, rows 5–6) |
| `6` | enemy spawn marker (used by templates only; waves actually use `dngFloorPos()`) |
| `7` | pressure plate |
| `8` | push block |
| `9` | chest |
| `10` | spike trap |
| `11` | lever (no template contains one; only spawned by save-restore paths) |
| `12` | cracked wall (written at runtime into an ability room's wall, L7272) |

**`V7T` (L6739–L6744)** — three fixed "structural" templates used for specific room types:

| Key | Use |
|---|---|
| `hub` | the `start` room — open 14×10 interior with all four doors carved |
| `puz` | declared but **never referenced** by the generator (contains 2 plates and 2 blocks) |
| `treas` | the `treasure` room — open interior with a single chest at row 4, col 7 |
| `bossv7` | `null` — the generator therefore falls back to `ROOM_TEMPLATES.boss` |

**`ROOM_TEMPLATES` (L6747–L6754)** — the generic per-type fallbacks: `rest`, `combat` (4 spawn markers), `puzzle` (1 plate + 1 block + wall clusters), `trap` (16 spikes in a staggered gauntlet), `treasure` (1 chest), `boss` (no doors on row 0 — the boss room has only the south entrance).

**`DUNGEON_LAYOUTS` (L6755–L6763)** — a fixed 6-room ordering per biome. In v27 this is **only used for its first entry's `lore` string** (the start room's flavour line); the actual room graph is procedural. Contents:

| Biome | Sequence | Start-room lore |
|---|---|---|
| forest | rest, combat, puzzle, trap, combat, boss | "The roots of the Hollow Grove run deep..." |
| cave | rest, combat, trap, puzzle, combat, boss | "Crystal light flickers in the depths..." |
| desert | rest, trap, combat, puzzle, combat, boss | "Sand whispers through the tomb halls..." |
| swamp | rest, combat, trap, treasure, combat, boss | "Toxic air fills the sunken temple..." |
| frozen | rest, combat, trap, puzzle, combat, boss | "The ice citadel groans with dark magic..." |
| volcanic | rest, combat, trap, combat, puzzle, boss | "Heat radiates from the obsidian walls..." |

The two mid-dungeon `lore` strings that exist (`'Ancient mechanisms block the way.'` on forest/frozen puzzle rooms and `'Magma channels block the way.'` on volcanic) are shadowed by the generator, which assigns its own lore.

**`BIOME_TEMPLATES` (L6764–L6820)** — hand-authored per-biome variants selected by `getBiomeTemplate(biome, roomType)`:

```js
function getBiomeTemplate(biome,roomType){var bt=BIOME_TEMPLATES[biome];if(bt&&bt[roomType]&&bt[roomType].length>0){return pick(bt[roomType]).slice();}return ROOM_TEMPLATES[roomType]?ROOM_TEMPLATES[roomType].slice():ROOM_TEMPLATES.rest.slice();}
```

| Biome | combat variants | puzzle variants | trap variants | Authored intent (from comments) |
|---|---|---|---|---|
| forest | 2 | 1 | 1 | "pillars of trees with clearings", "vine corridor", "root maze with push blocks", "spike gauntlet through tree barriers" |
| cave | 2 | 1 | 1 | "crystal alcoves", "central pillar arena", "crystal maze" |
| desert | 2 | 1 | 1 | "tomb pillars", "sarcophagus blocks" |
| swamp | 2 | 1 | 1 | "flooded channels" |
| frozen | 2 | 1 | 1 | "ice barrier arena" |
| volcanic | 1 | 1 | 1 | "lava pillars arena", "pressure plates and lava channels", "eruption hazard room" |

There are **no** `rest`, `treasure`, `boss` or `ability` entries in `BIOME_TEMPLATES`; those always come from `V7T`/`ROOM_TEMPLATES`. There is no `citadel_f*` entry either — citadel floors reuse their mapped source biome (`cave`, `swamp`, `frozen`).

**`CITADEL_FLOORS` (L820–L826)**

| Floor | `nm` | Visual/source biome | Rooms (unused) | `enemyScale` | Hazard | Mini-boss |
|---|---|---|---|---|---|---|
| 1 | Outer Ward | `cave` | 4 | 1.5 | `spikes` | `{type:'golem', hp:400, dmg:25, spd:40, sz:22, col:'#5D6D7E', nm:'Stone Sentinel'}` |
| 2 | Inner Sanctum | `swamp` | 5 | 2.0 | `poison` | `{type:'wraith', hp:350, dmg:30, spd:70, sz:18, col:'#7B3CA0', nm:'Phantom Warden'}` |
| 3 | Throne of Shadows | `frozen` | 3 | 2.5 | `ice` | `null` (the Citadel Warden is the floor boss) |

`CITADEL_WARDEN` (L827): `{hp:2000, maxHp:2000, dmg:35, spd:45, sz:28, col:'#4a0080', nm:'Citadel Warden', type:'citadelWarden'}`. The `rooms`, `hazard` and `miniBoss` fields are **declared but not consumed** by the generator — only `biome` and `enemyScale` are read (L7370). Floor hazards are implemented separately (§11.7).

### 11.4 Entrances, labels and cleared state (L6833–L7061)

```js
function DungeonEntrance(x,y,biome){this.x=x;this.y=y;this.biome=biome;this.t=rnd(0,TAU);}
```

`DungeonEntrance.prototype.draw` renders a ground shadow ellipse (48 × 14) with glow alpha `cleared ? 0.15 : 0.25 + p1*0.08`, biome-coloured ambient particles, per-biome portal art, and — when cleared — a dark ellipse plus a `#3DCC7A` `✓` at 32 px with a 14 px glow.

**Label system (L7044–L7059):**

```js
var labelAlpha=isNear?1:Math.max(0,1-(nearDist-160)/120);
```

The name is always drawn above the entrance, fully opaque within 160 px and fading to zero at 280 px. It sits in a rounded pill (`rgba(0,0,0,0.65)` fill, biome-colour 1.5 px stroke at `0.6α`, radius 8) at `sy-76`, text `bold 13px sans-serif` with a 4 px glow. Below it: `✓ CLEARED` in `#3DCC7A` when cleared, or `Press to Enter` in `rgba(255,255,255,0.7)` when near.

Entrance collision (L9320): any unlocked, living hero within **40 px** of an entrance whose `dungeonProgress[biome]` is false calls `showDungeonEntryOverlay(biome)`. Gated by `!inDungeon && !inShadowRealm && !bossUp && !paused && !showLvl && !gameWon && !gameOver && dungeonEntryCooldown<=0`.

### 11.5 Run flow: entrance → boss → exit

**1. Entry overlay** (`showDungeonEntryOverlay`, L7066): fills `dngEntryNm` (name in biome colour), `dngEntryBiome` (`BIOME + ' DUNGEON'`), `dngEntryDesc`, sets `paused = true`, shows `dungeonEntryOverlay`. `dngEnterBtn` → `enterDungeon(pendingDungeonBiome)`; `dngCancelBtn` (and Escape) → hide, `paused=false`, `pendingDungeonBiome=null`, `dungeonEntryCooldown=2`.

**2. `enterDungeon(biome)` (L7070–L7076):**

```js
if(biome==='citadel'){citadelFloor=1;biome=CITADEL_FLOORS[0].biome;announce('Shadow Citadel — Floor 1: Outer Ward','#7B3CA0',3);}
var visualBiome=citadelFloor>0?'citadel_f'+citadelFloor:biome;
dungeonEntrySnapshot=serializeOverworldState();inDungeon=true;currentDungeon=visualBiome;dungeonXPGained=0;resetHeroStats();initDungeon(biome);
var col=DUNGEON_COLORS[biome]||'#7B3CA0';
playBossIntro(citadelFloor>0?'Shadow Citadel — Floor '+citadelFloor:DUNGEON_NAMES[biome],citadelFloor>0?CITADEL_FLOORS[citadelFloor-1].nm:biome.toUpperCase()+' DUNGEON',citadelFloor>0?'#7B3CA0':col,citadelFloor>0?'#7B3CA0':col);
```

`currentDungeon` holds the **visual** key (`citadel_f2`), while `biome` (passed to `initDungeon`) is the **mechanical** source biome. The overworld is snapshotted so a failed run can be rolled back. Entry always plays the letterbox name-card intro.

**3. `initDungeon(biome)` (L7212–L7217):** clears every dungeon array, generates the room graph, builds `dungeonMinimapData` (one `{visited,type,pos}` per room), places all unlocked heroes at `(320, 420)` ± jitter, zeroes `cam`, and calls `loadDungeonRoom(0)`.

**4. Room-to-room traversal** — see §11.6.

**5. Boss room:** `loadDungeonRoom` sets `dungeonDoorsLocked = true` and calls `spawnDungeonBoss(currentDungeon)`, which plays a slam intro (`dungeonCinematicActive`, 5 s, letterbox bars) before combat. Boss defeat unlocks the doors and `showDungeonVictory()` is triggered by the Part 1 boss-death path.

**6. `showDungeonVictory()` (L7125):** `paused = true`, then `showVictoryStatsHTML(name + ' CLEARED!', 'Per-hero combat breakdown', cb)`; the callback fills `dngVicTitle/Sub/Stats` (XP earned, room count), shows the `DUNGEON_EQUIPS` reward card if one exists, opens `dungeonVictoryOverlay` and plays `snd('victory',0.5)`. `dngVicBtn` → `exitDungeon(true)`.

**7. `showDungeonFail()` (L7130):** title `DUNGEON FAILED`, sub `The Stewart Squad couldn't clear <name>...`, stat card showing `floor(dungeonXPGained*0.3)` partial XP. Triggered when no hero is alive (L8252), when walking out the south door of room 0 (L8246), or from the pause menu's Retreat button (which relabels it `DUNGEON RETREAT`, L9445). `dngFailBtn` → `exitDungeon(false)`.

**8. `exitDungeon(success)` (L7077–L7124):**

- Citadel floors 1→2 and 2→3 are intercepted first: mark `citadelProgress['floor'+n]`, increment `citadelFloor`, announce the flavour line (floor 2: `'The shadows deepen... dark whispers fill the air.'`; floor 3: `'The final threshold. No turning back.'`), heal every living hero by **30% of max HP**, tear down dungeon state and immediately `enterDungeon(nextFloor.biome)` — no overworld return.
- Floor 3 success sets `dungeonProgress.citadel`, `citadelFloor = 0`, `trigAch('citadelConqueror')`, unlocks NG+ if not already, and awards every un-owned `LEGENDARY_EQ` item to its hero (achievement `legendaryHero` when all four are held; `trueFinalBoss` at `ngPlus >= 5`).
- Skill trees and 45 per-hero skill-derived stats are snapshotted **before** the overworld deserialize and restored **after**, so dungeon-earned progression survives the rollback (L7108–L7118).
- On failure: restore the snapshot and award `floor(dungeonXPGained * 0.3)`.
- On success: restore the snapshot, set `dungeonProgress[biome] = true`, award full `dungeonXPGained`, `applyEq(DUNGEON_EQUIPS[biome])`, `trigAch('dungeoneer')`, `updateQuestProgress('clear_dungeon',{biome})`, the spark-plug grant (§6.3), `updateBountyProgress('dungeon',1)`, the first-clear meteor cutscene hook (§6.6), `gold += 30`, **+1 skill point for all four heroes**, and `edsLanding` achievement if any hero finished at exactly 1 HP.
- Always: `dungeonEntrySnapshot = null`, `dungeonEntryCooldown = 3`, `paused = false`, `citadelFloor = 0`; if all five original dungeons are now clear and the Goblin King has not appeared, `spawnBoss()` after 2 s; `checkVolcanicEntrance()`, `checkCitadelEntrance()`, `buildPortraitStrip()`, and an autosave 1 s later on success.

### 11.6 Procedural generation (`generateDungeonGraph`, L7152–L7211)

Grid is `GW=4` columns × `GH=5` rows of room slots. Up to **10 attempts**:

1. Start room at column 0, row `1 + floor(random*3)` (rows 1–3), type `start`.
2. Target size `target = floor(rnd(7,11))` (7–10 rooms). Up to 200 growth iterations: pick a random existing room, shuffle `['n','s','e','w']`, and attach a new room in the first direction whose neighbouring grid cell is in-bounds and empty. Both rooms get reciprocal `connections` and `doorStates = DOOR_OPEN`.
3. Reject the attempt if `counts.combat < 2` or `rooms.length < 6`.
4. **Boss placement:** BFS from the start (`bfsPath9`) finds the farthest room; a boss room is attached to it in a free direction. The connecting door from the farthest room is `DOOR_LOCKED`; the reverse door is `DOOR_OPEN`. Reject the attempt if no free direction exists.
5. **Key placement:** BFS from the boss room finds the `treasure` room with the smallest distance to the boss; that room gets `hasKey = true`. If no treasure room exists, the first non-start/non-boss room is converted to one.
6. **Tile assignment:** `start` → `V7T.hub`; `boss` → `ROOM_TEMPLATES.boss` (because `V7T.bossv7` is `null`); `treasure` → `V7T.treas`; everything else → `getBiomeTemplate(biome, type === 'ability' ? 'combat' : type)`. Then `injectDoors9` rewrites the eight door tiles.
7. **Validation:** BFS from room 0 must reach the last room (the boss). Otherwise retry.

Room-type quotas (`pickRoomType9`, L7144):

```js
if(counts.combat<4)pool.push('combat','combat','combat');
if(counts.puzzle<2)pool.push('puzzle');
if(counts.treasure<2)pool.push('treasure');
if(counts.rest<1)pool.push('rest');
if(counts.ability<1&&allUnlocked>=2)pool.push('ability');
if(pool.length===0)pool.push('combat');
```

| Type | Max | Pool weight while under quota |
|---|---|---|
| `combat` | 4 | 3 entries (heavily favoured) |
| `puzzle` | 2 | 1 |
| `treasure` | 2 | 1 |
| `rest` | 1 | 1 |
| `ability` | 1 | 1, and only when ≥ 2 heroes are unlocked |

`injectDoors9` (L7138):

```js
if(conns.n!==undefined){t[0*DNG_COLS+7]=2;t[0*DNG_COLS+8]=2;}else{t[0*DNG_COLS+7]=1;t[0*DNG_COLS+8]=1;}
if(conns.s!==undefined){t[11*DNG_COLS+7]=3;t[11*DNG_COLS+8]=3;}else{t[11*DNG_COLS+7]=1;t[11*DNG_COLS+8]=1;}
if(conns.e!==undefined){t[5*DNG_COLS+15]=4;t[6*DNG_COLS+15]=4;}else{t[5*DNG_COLS+15]=1;t[6*DNG_COLS+15]=1;}
if(conns.w!==undefined){t[5*DNG_COLS+0]=5;t[6*DNG_COLS+0]=5;}else{t[5*DNG_COLS+0]=1;t[6*DNG_COLS+0]=1;}
```

Every door is a two-tile-wide gap; unconnected sides are walled off.

**Linear fallback (L7205–L7211):** if all 10 attempts fail, a six-room chain `start → combat → puzzle → treasure → combat → boss` is built running north, with `doorStates.n` set to `DOOR_LOCKED` for the last link, `DOOR_OPEN` for links 0 and 2, and `DOOR_BARRED` for links 1 and 3; the treasure room carries the key.

### 11.7 Room loading (`loadDungeonRoom(idx, fromDir)`, L7218–L7306)

1. **Persist the previous room** into `dungeonRoomStates[dungeonRoom]`: chest `{x,y,opened,isKeyChest}`, plate `{x,y,active}`, block `{x,y}`, lever `{x,y,active}`, and a `decor[].dead` array.
2. Reset the per-room arrays and flags; mark `dungeonMinimapData[idx].visited = true`.
3. `buildReachable(tmpl)` (L7359): BFS from every door tile across non-wall tiles, then collect all reached interior tiles (excluding the outer ring) into `dngReachable[]` (world-space centres) and `dngReachSet{}`. `dngFloorPos()` (L7363) returns a random reachable tile centre with `rnd(-12,12)` jitter — this is the placement primitive for spawns, ability objects and bonus chests.
4. **Objects from tiles**, restoring saved state where available: `7 → plate`, `8 → block`, `9 → chest` (`isKeyChest = room.hasKey`), `10 → spike {active:false, timer:rnd(0,3), period:2}`, `11 → lever`.
5. **Torches:** collect every wall tile adjacent to a floor tile, then pick `floor(rnd(4,7))` of them: `{x,y,ph:rnd(0,TAU),br:50}`.
6. **Decor** (skipped in boss rooms): build an `occupiedTiles` set from every plate/block/chest/lever **plus its 8 neighbours**, then choose `min(floor(rnd(2,5)), available)` interior floor tiles (rows 2–9, cols 2–13) and place a random `DNG_DECOR` prop. Saved `dead` flags are re-applied.
7. `initDngAtmo(currentDungeon)`.
8. **Puzzle rooms** get `dungeonPuzzleState = {solved:false, checkSolved(){ every plate active }}`.
9. **Room-type activation** (only when the room is not already in `dungeonRoomsCleared`):

| Type | Effect |
|---|---|
| `combat` | `dungeonDoorsLocked = true`, `dungeonCombatWaves = 2`, `snd('bars_slam',0.3)`, spawn wave 1 |
| `puzzle` | `dungeonDoorsLocked = true` (opens when the plates are solved) |
| `boss` | `dungeonDoorsLocked = true`, `spawnDungeonBoss(currentDungeon)` |
| `ability` | `dungeonDoorsLocked = true`, `dungeonCombatWaves = 1`, spawn wave 1, place the hero-specific object, announce the hint |
| `start` / `rest` | heal every living hero by **30% of max HP**; announce `room.lore` if present |

10. **Hero repositioning** by entry direction (L7279–L7284):

```js
var cx2=DNG_COLS*DNG_TW/2,cy2=DNG_ROWS*DNG_TW-60;
if(fromDir==='n'){cy2=DNG_ROWS*DNG_TW-60;}
else if(fromDir==='s'){cy2=40;}
else if(fromDir==='e'){cx2=40;cy2=DNG_ROWS*DNG_TW/2;}
else if(fromDir==='w'){cx2=DNG_COLS*DNG_TW-40;cy2=DNG_ROWS*DNG_TW/2;}
if(room.type==='boss')cy2=DNG_ROWS*DNG_TW-80;
```

Heroes appear on the wall opposite the door they used: north exit → bottom of the new room, east exit → left wall, etc. Applied with `rnd(-20,20)` x-jitter, and only when `idx>0 || fromDir` (so the initial room-0 placement from `initDungeon` is preserved).

11. **Biome hazards** (skipped in `start`/`rest` rooms, L7285–L7299). A door-adjacency mask excludes the 3 × 3 neighbourhood of every door tile; `hzOk9(x,y)` additionally requires a plain floor tile:

| Dungeon | Count | Hazard |
|---|---|---|
| `desert` | `rnd(2,4)` | `sand_slow`, r 35 |
| `cave` | `rnd(2,3)` | `crystal_glow`, r 28 |
| `swamp` | `rnd(2,3)` | `poison_patch`, r 30, `dmg 4` |
| `frozen` | `rnd(3,5)` | `ice_tile`, r 30 |
| `forest` | `rnd(2,3)` | `vine_snare`, r 25, `snareT/coolT` |
| `volcanic` | `rnd(3,5)` + `rnd(1,3)` | `lava_tile` r 32 `dmg 10`; `eruption` r 40 `eruptT rnd(3,6)` `eruptCd rnd(4,7)` |

Note the check is on `currentDungeon` (the *visual* key), so `citadel_f1..f3` rooms generate **no** biome hazards; the Citadel uses its own floor hazards instead.

12. **Citadel floor hazards** (`updateDungeon`, L8165–L8169): floor 1 spawns 3 fresh spikes at random positions every 8 s (`citHazardT`); floor 2 deals `floor(5*dt)` damage per frame to any hero within 40 px of the room border; floor 3 has no coded hazard.

13. If hosting, the full room payload (`tiles, doors, torches, decor, hazards, objects`) is sent to guests as an `event`/`roomChange` message.

### 11.8 Combat waves (`spawnDungeonCombatWave`, L7364–L7375)

```js
var count=Math.min(3+Math.floor(dungeonRoom/2)+dungeonCombatWaveNum,8);var scale=1+teamLv*0.03;var coopScale=1+0.3*((NET.playerCount||1)-1);
if(citadelFloor>0){var cFloor=CITADEL_FLOORS[citadelFloor-1];scale*=cFloor?cFloor.enemyScale:1.5;count=Math.min(count+1,10);}
for(var i=0;i<count;i++){var sp=dngFloorPos();var e=new Enemy(sp.x,sp.y,pick(types));e.hp=Math.floor(e.hp*scale*coopScale);e.maxHp=e.hp;e.dmg=Math.floor(e.dmg*scale);e.spd=e.spd*(1+teamLv*0.01);e.isDungeonEnemy=true;e.stuckT=0;dungeonEnemies.push(e);}
```

Enemy count is `min(3 + floor(roomIndex/2) + waveNumber, 8)`, raised by 1 and capped at 10 in the Citadel. HP scales with team level (3%/level) **and** player count (30% per extra player); damage scales with team level only; speed by 1%/level.

Enemy type pools:

| Dungeon | Pool |
|---|---|
| `forest` | goblin, orc, bat, healer |
| `cave` | bat, shielded, goblin, wraith |
| `desert` | archer, orc, goblin, brute |
| `swamp` | troll, bat, goblin, healer |
| `volcanic` | fire_elemental, lava_slime, ember_sprite, obsidian_guard |
| anything else (incl. `frozen`) | shielded, archer, goblin, bomber |
| Citadel floor 1 | shielded, orc, archer, troll, wraith |
| Citadel floor 2 | troll, fire_elemental, shielded, obsidian_guard, brute |
| Citadel floor 3 | obsidian_guard, fire_elemental, troll, shielded, bomber, healer |

Wave clearing (L8236): when `dungeonDoorsLocked` and the room is `combat`/`ability` and no wave spawn is pending, a zero-alive check either schedules the next wave (`dungeonWaveSpawning = true`, 1200 ms `setTimeout`) or unlocks the doors, pushes the room index into `dungeonRoomsCleared`, announces `'Room cleared!'` and plays `snd('equip',0.3)`.

### 11.9 Keys, locks and interaction (`heroInteract`, L7318–L7338)

Range for every interactable is **50 px** (60 px for ability objects' prompts and for door unlocking).

| Object | Effect |
|---|---|
| `chest` (key chest) | `dungeonInventory.keys++`, `announce('Dungeon Key found!','#E8A838',3)`, `snd('equip',0.4)`, 20-particle gold burst |
| `chest` (normal) | heal every living hero `+50` HP, `announce('Treasure! +50 HP all!')`, `dungeonXPGained += 15` |
| `lever` | toggles `active`; when **all** levers in the room are active, every `DOOR_BARRED` in the room becomes `DOOR_OPEN`, `dungeonDoorsLocked = false`, `snd('door_unlock',0.4)`, `announce('Bars retracted!')` |
| `cracked_wall` | LIAM only — `snd('boom',0.4)`, `dungeonXPGained += 50`, 15 debris particles, `ab9Complete()`; other heroes get `'This requires LIAM's ability!'` |
| `target_switch` | NOAH with `aType==='arrow'` only — `snd('puzzle_solve',0.4)`, `+50` dungeon XP, `ab9Complete()` |
| `magic_seal` | COLLETTE only — requires **3 channel presses**; each intermediate press announces `'Channeling... (N more)'` with `snd('magic',0.2)` |
| `gear_lock` | ISABELLA only — instant, `+50` dungeon XP, `ab9Complete()` |
| Locked door | with `keys > 0` and within 60 px of the door centre: consume a key, set `DOOR_OPEN`, `snd('door_unlock',0.4)`, `announce('Door unlocked!')` |

`ab9Complete()` (L7316) drops a bonus (non-key) chest at a random reachable tile with a 20-particle burst.

`heroInteractAs(hero)` (L7340) is the identical host-side version used for guest-controlled heroes.

**Ability room objects** by hero index (L7268–L7277): `abilityTypes = ['cracked_wall','target_switch','magic_seal','gear_lock']` indexed by the chosen hero (0=Liam … 3=Isabella), chosen once per room from the unlocked heroes and cached on `room.abilityHero`. The cracked wall is written into the template as tile `12` at the first wall found in column 13, rows 3–8; the other three are spawned as objects (`target_switch` pinned to `x = DNG_COLS*DNG_TW - 60`). Hints:

| Hero | Hint |
|---|---|
| LIAM | These cracks look weak... Liam could smash through! |
| NOAH | A distant target... Noah could hit it! |
| COLLETTE | A magic seal... Collette could channel it! |
| ISABELLA | Gears are jammed... Isabella could break them! |

### 11.10 Door transitions and room-slide (L8239–L8249, L8117)

```js
var doorXMin=7*DNG_TW,doorXMax=9*DNG_TW,doorYMin=5*DNG_TW,doorYMax=7*DNG_TW;
```

Trigger bands: north `y < 25` with `280 < x < 360`; south `y > 455` with the same x band; east `x > 615` with `200 < y < 280`; west `x < 25` with the same y band. **Every** unlocked living hero is tested (so a guest can open a door). If the door state is `DOOR_LOCKED` and a key is held, the key is consumed inline and the door opens.

Transition state:

```js
roomTransitionActive=true;roomTransitionTimer=0.6;roomTransitionPhase='out';roomTransitionDir=<dir>;roomTransitionTarget=<idx>;
```

and in `updateDungeon` (L8117):

```js
if(roomTransitionActive){roomTransitionTimer-=dt;if(roomTransitionPhase==='out'&&roomTransitionTimer<=0.3){roomTransitionPhase='in';loadDungeonRoom(roomTransitionTarget,roomTransitionDir);}if(roomTransitionTimer<=0){roomTransitionActive=false;}return;}
```

A 0.6 s transition: the room actually swaps at the 0.3 s midpoint, and the whole simulation is paused for the duration. The overlay (L8114) slides a black rect of alpha `min(0.8, slideAmt)` in from the travelled direction, where `slideAmt = phase==='out' ? 1 - timer/0.6 : timer/0.6`.

Walking south out of room 0 with no south connection is the **retreat** action and calls `showDungeonFail()` (L8246).

### 11.11 Cleared state and the minimap

- `dungeonRoomsCleared[]` — room indices whose combat/ability challenge is resolved. Re-entering a cleared room skips wave spawning and door locking.
- `dungeonRoomStates{}` — per-room object/decor persistence (see §11.7 step 1).
- `dungeonMinimapData[]` — `{visited, type, pos}` per room, drawn at `(W-130, H-110)` in a 120 × 100 panel with 22 × 16 px cells offset by `pos.c`/`pos.r`, connections drawn as lines between cell centres, and lock icons on locked doors (L8069–L8089).
- `dungeonProgress{forest,cave,desert,swamp,frozen,volcanic}` (L836) plus `citadel` added at runtime — the persistent "cleared" record that drives entrance `✓` badges, the Volcanic/Citadel unlock checks and the Goblin King spawn.

### 11.12 Dungeon render pipeline (`renderDungeon`, L7934–L8114)

Draw order per frame:

1. `ctx.clearRect`; `beginWorldZoom()`.
2. Floor/wall tiles from `room.tiles` with `DUNGEON_TILE_COLORS` and `DNG_WALL_V` variation (seeded by `dungeonRoom*137`), including tile 12 cracked walls.
3. Wall torches — teardrop flames with per-torch phase `ph` and frequency `9.4 + (ph%2 - 0.5)*1.2`, a warm halo `rgba(255,140,40,0.06)` at radius `14 + flVal*3`, outer orange flame and `#ffd166` inner core.
4. Decor props (damaged crates get a cracked variant at 1 HP).
5. Objects (plates, blocks, chests, spikes, levers), ability objects, and the healing-spring visual in rest rooms.
6. Biome hazards.
7. The area outside the 640 × 480 room is filled with `rgba(0,0,0,0.95)`.
8. Clip to the room rect; draw arena effects and ability VFX (with `cam` forced to `0,0`), boss block hazards/tether/containment/charge trail, then all entities.
9. **Dynamic lighting**: an offscreen canvas (`window._lightCvs`) is filled with `DNG_AMBIENT[biome]`, then light holes are punched with `globalCompositeOperation='destination-out'` radial gradients — hero glow radius `180` in boss rooms else `120`, torch lights synced to the flame oscillator, projectile lights scaled by type, enemy glows, boss glow. The layer is then composited over the main canvas with `drawImage`.
10. Atmosphere particles drawn **on top** of the darkness so they glow.
11. Interaction prompts (`[SPACE] Open` / `Pull` / `Interact`), room border, citadel visual effects.
12. Minimap, boss cinematic letterbox (`barH = 60 * clamp(...)`), phase flash overlay, mobile action buttons.
13. HUD: dungeon name (biome colour) at `(12, H-35)`, `Room N/M` at `(12, H-18)`, `🔒 LOCKED` in `#D84830` at `(12, H-52)` when doors are locked; rest-room lore in italic below the room.
14. `drawAnnounce()`, `drawAchievements()`, `drawJoystick()`, `drawTouchButtons()`, boss bar, equipment tooltip, room-transition slide.

### 11.13 Dungeon update order (`updateDungeon`, L8115–L8256)

Wrapped in `try/catch` (errors logged as `'updateDungeon error:'`). Order:

1. Room transition (early return if active).
2. `getInput()`.
3. Boss cinematic (early return if active; 5 s, atmosphere still ticks).
4. `updDngAtmo(dt)`.
5. Heroes — movement, then wall-tile collision using the four corners of a `hr9` box, curse timers, biome-hazard effects (reduced-friction slide rather than an additive push), eruption geyser timers.
6. Decor hits; projectile-vs-decor.
7. Puzzle check (co-op plates: any hero standing on a plate activates it in every dungeon).
8. Citadel floor hazards.
9. Dungeon enemies — with wall collision plus a stuck-enemy warp: an enemy standing on an unreachable tile for > 1 s is teleported to a reachable floor tile.
10. Boss.
11. Projectiles (cave crystal reflect bounces projectiles off walls).
12. Particles.
13. Spike damage; melee heroes damaging ice walls; vine collision.
14. Push-block puzzle: cardinal-only grid-snapped pushes with wall and block collision, plate activation and deactivation checks, hero push-back.
15. Combat/ability room clear checks.
16. Door transitions.
17. All-heroes-dead check → `showDungeonFail()`.
18. Screen shake decay.

---
## 12. Tutorial System

**Legacy lines:** `tutorial` state L4313; `TUTORIAL_STEPS` L4314–L4322; `updateTutorial` L4323–L4327; `drawTutorial` L4328–L4337.

```js
var tutorial={step:0,active:true,timer:5,startX:0,startY:0,_switched:false,_openedTree:false};
```

`initGame()` re-creates this with `startX/startY` set to hero 0's spawn (L8338); in DEV_MODE it is disabled with `step = 7`.

### 12.1 Steps — trigger and completion (message text is canon; see FAMILY_CANON)

| # | Message key (emoji + text) | Completion condition |
|---|---|---|
| 0 | 🎮 WASD to move (or drag left side on mobile) | `hypot(heroes[0].x - tutorial.startX, heroes[0].y - tutorial.startY) > 100` |
| 1 | ⚔️ Click to attack enemies! | `gameStats.kills >= 1` |
| 2 | 🔑 Walk to the cage to rescue your sibling! | `sibs >= 1` |
| 3 | 👥 Press 1-4 to switch heroes | `tutorial._switched` |
| 4 | ⬆️ Choose a card to level up! | `teamLv >= 2` |
| 5 | 🌳 Press T to open Skill Trees | `tutorial._openedTree` |
| 6 | 🗺️ Explore the biomes! Check the minimap. | `tutorial.timer -= 1/60; return tutorial.timer <= 0` |

`_switched` is set by the hero-switch keydown path (L942) and the mobile portrait tap (L1002); `_openedTree` is set by the skill-tree keybind (L951). Note step 6's `check()` mutates `tutorial.timer` by a hard-coded `1/60` per call rather than `dt` — it is frame-rate dependent, giving ~5 s at 60 fps.

### 12.2 Update and draw

```js
function updateTutorial(dt){
  if(!tutorial.active||!settings.showTutorial)return;
  if(tutorial.step>=TUTORIAL_STEPS.length){tutorial.active=false;return;}
  if(TUTORIAL_STEPS[tutorial.step].check()){tutorial.step++;tutorial.timer=5;snd('achieve',0.15);if(tutorial.step>=TUTORIAL_STEPS.length)tutorial.active=false;}
}
```

Steps advance strictly in order, one per frame at most, each resetting `timer` to 5 and playing `snd('achieve',0.15)`. `updateTutorial` is the very first call inside `update()` (L9247), so it does not run inside dungeons.

`drawTutorial()` renders a rounded bar `min(W-40, 500)` px wide, 30 px tall, centred at `y = H-65`, fill `rgba(0,0,0,0.6)`, radius 8, with `bold 13px sans-serif` white text pulsing at `alpha = 0.85 + sin(gt*3)*0.15`.

The whole system is gated on the `showTutorial` setting (default `true`, toggled in the settings overlay).

---

## 13. Cutscene System

**Legacy lines:** `// ===== V24: CUTSCENE SYSTEM =====` L4362–L4396; V27 cinematic helpers L4400–L4450; `triggerMeteorCutscene` L4451–L5016.

### 13.1 Shot structure

```js
var cutscene={active:false,steps:[],stepIdx:0,stepTimer:0,letterbox:0};
function startCutscene(steps){
  cutscene.steps=steps;cutscene.stepIdx=0;cutscene.stepTimer=0;
  cutscene.letterbox=0;cutscene.active=true;
  if(steps[0]&&steps[0].onStart)steps[0].onStart();
}
```

A cutscene is an array of **shots**, each a plain object:

| Field | Type | Meaning |
|---|---|---|
| `duration` | number (s) | how long the shot runs |
| `onStart` | `function()` | fired once when the shot begins (including shot 0 at `startCutscene`) |
| `draw` | `function(t, duration)` | called every frame with elapsed time and duration |
| `onEnd` | `function()` | fired once when the shot's time expires (and on skip, for every remaining shot) |

```js
function updateCutscene(dt){
  if(!cutscene.active)return false;
  cutscene.letterbox=Math.min(1,cutscene.letterbox+dt*3);
  cutscene.stepTimer+=dt;
  var step=cutscene.steps[cutscene.stepIdx];
  if(!step){cutscene.active=false;return false;}
  if(cutscene.stepTimer>=step.duration){
    if(step.onEnd)step.onEnd();
    cutscene.stepIdx++;cutscene.stepTimer=0;
    if(cutscene.stepIdx>=cutscene.steps.length){
      cutscene.active=false;cutscene.letterbox=0;return false;
    }
    if(cutscene.steps[cutscene.stepIdx].onStart)cutscene.steps[cutscene.stepIdx].onStart();
  }
  return true;
}
```

Letterbox opens over **1/3 second** (`+dt*3`, clamped to 1) and snaps to 0 when the cutscene finishes.

```js
function drawCutscene(){
  var step=cutscene.steps[cutscene.stepIdx];
  if(step&&step.draw)step.draw(cutscene.stepTimer,step.duration);
  var barH=60*cutscene.letterbox;
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,W,barH);
  ctx.fillRect(0,H-barH,W,barH);
  ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillText('Press SPACE to skip',W/2,H-barH-8);
}
```

Bars are 60 px at full extension; the skip hint sits 8 px above the bottom bar.

```js
function skipCutscene(){
  if(!cutscene.active)return;
  for(var i=cutscene.stepIdx;i<cutscene.steps.length;i++){
    if(cutscene.steps[i].onEnd)cutscene.steps[i].onEnd();
  }
  cutscene.active=false;cutscene.letterbox=0;cutscene.steps=[];cutscene.stepIdx=0;cutscene.stepTimer=0;
}
```

Skipping runs every remaining `onEnd` so state flags still land. Bound to **Space or Enter** at the very top of the keydown handler (L933), before any other key routing.

In the main loop, an active cutscene fully replaces update+render (L9234):

```js
if(cutscene.active){updateCutscene(dt);if(inDungeon)renderDungeon();else render();drawCutscene();if(DEV_MODE)drawPerfOverlay(performance.now()-_frameStart);return;}
```

The world is rendered but **not simulated** — `update()` never runs, so `gt`, `dayTime` and every timer freeze. `drawFog()` and `drawDayNightTint()` both early-return while `cutscene.active` (L3330, L3338).

### 13.2 Shared cinematic helpers (L4400–L4450)

```js
function smoothDamp(current, target, smoothTime, dt) {
    var t = Math.exp(-smoothTime * dt * 10);
    return target + (current - target) * t;
}
```

An exponential ease toward `target`; higher `smoothTime` converges faster (note the sign: `exp(-smoothTime*dt*10)` shrinks the residual).

`emberPool[]` with `spawnEmber(x,y,vx,vy,life,color,sz)` reuses any slot whose `life <= 0`, growing the pool only when none is free. `updateAndDrawEmbers(dt, worldSpace)` runs the whole pool under `globalCompositeOperation='lighter'` with `alpha = (life/maxLife)*0.8`, applying `vy += grav*dt` and `vx *= 0.98` drag; `worldSpace` toggles between camera-relative and screen coordinates.

```js
var cineShake={x:0,y:0,intensity:0};
function updateCineShake(dt){
    if(cineShake.intensity>0){
        cineShake.x=(Math.random()-0.5)*2*cineShake.intensity;
        cineShake.y=(Math.random()-0.5)*2*cineShake.intensity;
        cineShake.intensity-=dt*15;if(cineShake.intensity<0)cineShake.intensity=0;
    } else {cineShake.x=0;cineShake.y=0;}
}
```

An independent shake channel (separate from `shk`) that decays at 15 units/s.

### 13.3 The meteor cutscene — shot list (L4451–L5016)

Setup (L4452–L4457) computes a framing zoom that keeps the world edges off-screen:

```js
var _edgeX=Math.min(_mcrX,WW-_mcrX),_edgeY=Math.min(_mcrY,WH-_mcrY);
var _csZoom=Math.max(WORLD_ZOOM+0.5,W/(2*Math.max(_edgeX-20,1))*1.15,H/(2*Math.max(_edgeY-20,1))*1.15);
_csZoom=Math.min(_csZoom,4.5);
```

The original camera and `WORLD_ZOOM` are captured for restoration in Scene 7.

| # | Name | Duration | Structure (visuals are ATMOSPHERE_RECIPES; text is FAMILY_CANON) |
|---|---|---|---|
| 1 | FIRST-PERSON CALM | 4.0 s | `onStart` resets `_prevT`, `cs.vigA`, and the `_smoke`/`_ssEmbers`/`_mTrail` buffers. Establishing beat before the meteor is visible. |
| 2 | SKY WATCH | 4.2 s | `onStart` clears `_mTrail`. The meteor first appears in the sky. |
| 3 | THE CROSSING | 4.5 s | `onStart` clears smoke, embers and trail. The meteor crosses frame. |
| 4 | THE DIVE | 3.5 s | `onStart` clears buffers. The meteor descends toward the crater site. |
| 5 | THE IMPACT | 1.5 s | `onStart`: `cs.impFlash=1.0`, `cs.freezeTimer=0.06`, `WORLD_ZOOM=_csZoom`, camera snapped to the crater, `cineShake.intensity=40`, `snd('boom',0.6)`, `screenShake(22,0.9)`, three staggered shockwave rings (delays `0 / 0.18 / 0.35`, radii `400 / 320 / 260`), a 40-piece debris burst, and **1200 pooled embers** at `angle = random*TAU`, `power = 200 + random*1300`, upward bias `-(200 + random*600)`, colours `['#1abc9c','#7b2d8e','#ffffff','#e67e22','#ff6b6b','#E8A838']`. |
| 6 | THE AFTERMATH | 3.0 s | Camera settles with `smoothDamp(cam, crater, 0.15, dt)`; background `#0B0E1A`; smoke/debris/rings update; crater particles and `drawCrater()`; settling dust haze `rgba(80,60,40, 0.15*(1-p))`; vignette lerps `0.7 → 0.4`; after `p>0.4` a purple radial glow ramps to `alpha = easeOut2((p-0.4)/0.6)*0.08`; after `p>0.7`, `announce("A strange light glows in the distance...","#8850A8",4)`. **`onEnd` sets `storyFlags.meteorSeen`, `ALIEN_CRATER.discovered` and `storyFlags.craterDiscovered` all true.** |
| 7 | THE RETURN | 3.5 s | `onStart` ramps the BGM master gain back to `bgm.vol` over 2 s. `WORLD_ZOOM` lerps `_csZoom → _origZoom` on `ease3(p)`; camera lerps from the crater back to the pre-cutscene position and is clamped to `[-halfW*0.1, WW-W+halfW*0.1]` (same for Y); embers continue settling; vignette fades `0.4 → 0`. |

Total runtime: **24.2 s**. Trigger: first dungeon clear (§6.6) or `F10` / the dev console's `▶ Meteor` button.

---

## 14. Arena Effect System & Boss Intro

### 14.1 Arena effects (L5018–L5061)

```js
var arenaEffects=[];
var MAX_ARENA_EFFECTS=8;
function addArenaEffect(opts){
  if(arenaEffects.length>=MAX_ARENA_EFFECTS)return;
  arenaEffects.push({
    x:opts.x,y:opts.y,radius:opts.radius,
    duration:opts.duration,timer:0,
    telegraphTime:opts.telegraphTime||1.0,
    active:false,
    drawTelegraph:opts.drawTelegraph,
    drawActive:opts.drawActive,
    onHeroInside:opts.onHeroInside,
    onEnd:opts.onEnd||function(){}
  });
}
```

An arena effect is a **circular ground zone with a two-phase lifetime**: a telegraph window of `telegraphTime` (default 1.0 s) followed by an active window of `duration`. The list is hard-capped at 8; a request over the cap is silently dropped.

```js
function updateArenaEffects(dt){
  for(var i=arenaEffects.length-1;i>=0;i--){
    var ae=arenaEffects[i];
    ae.timer+=dt;
    if(!ae.active&&ae.timer>=ae.telegraphTime)ae.active=true;
    if(ae.active&&ae.onHeroInside){
      for(var hi=0;hi<heroes.length;hi++){
        var h=heroes[hi];
        if(!h.unlocked||h.dead||h.downed)continue;
        if(dst(h,ae)<ae.radius)ae.onHeroInside(h,dt);
      }
    }
    if(ae.timer>=ae.telegraphTime+ae.duration){
      ae.onEnd();arenaEffects.splice(i,1);
    }
  }
}
```

`onHeroInside(hero, dt)` is called **every frame** for every hero inside the radius while active — callers are responsible for scaling by `dt` (a per-frame tick, not a one-shot hit).

```js
function drawArenaEffects(){
  for(var i=0;i<arenaEffects.length;i++){
    var ae=arenaEffects[i];
    if(!ae.active&&ae.drawTelegraph){
      ae.drawTelegraph(ae.x-cam.x,ae.y-cam.y,ae.radius,ae.timer/ae.telegraphTime);
    }else if(ae.active&&ae.drawActive){
      ae.drawActive(ae.x-cam.x,ae.y-cam.y,ae.radius,ae.timer-ae.telegraphTime);
    }
  }
}
function clearArenaEffects(){arenaEffects.length=0;}
```

The telegraph callback receives a **normalised 0→1 progress**; the active callback receives **elapsed seconds since activation**. Both receive screen-space coordinates (in dungeons `cam` is zeroed and the whole call is wrapped in a `translate(ox,oy)`).

`clearArenaEffects()` is called by `enterDungeon` indirectly and explicitly by the dev scenarios to prevent zones leaking between fights.

Representative caller shapes (all Part 1 boss code): radial blast `{radius, duration:0.5, telegraphTime:chargeTime}` (L5073), charge attack `{radius:20, duration:0.1, telegraphTime:0.4}` (L5169), treant vine grab `{radius:80, duration:2.0, telegraphTime:1.0}` (L7445), colossus beam sweep `{radius:250, duration:1.0, telegraphTime:1.2}` (L7592), blizzard ring `{radius:300, duration:4.0, telegraphTime:1.5}` (L7608).

### 14.2 Boss intro (L5326–L5346)

```js
var bossIntroActive=false;
function playBossIntro(name,subtitle,color,borderColor){
  if(bossIntroActive)return;bossIntroActive=true;paused=true;
  var lbT=document.getElementById('lbTop'),lbB=document.getElementById('lbBot');
  var nc=document.getElementById('bossNamecard');
  document.getElementById('bossNm').textContent=name;
  document.getElementById('bossNm').style.color=color;
  document.getElementById('bossTitle').textContent=subtitle;
  nc.style.borderColor=borderColor;
  lbT.className='letterbox-top show';lbB.className='letterbox-bot show';
  setTimeout(function(){nc.classList.add('show');snd('boss',.5);},800);
  setTimeout(function(){
    nc.classList.remove('show');
    setTimeout(function(){lbT.className='letterbox-top hide';lbB.className='letterbox-bot hide';
      setTimeout(function(){lbT.className='letterbox-top';lbB.className='letterbox-bot';bossIntroActive=false;paused=false;},500);
    },400);
  },3200);
}
```

**Timeline (total 4.1 s, game paused throughout):**

| t | Event |
|---|---|
| 0 ms | `paused = true`; letterbox bars start the `letterboxIn` animation (`0 → 60px`, 0.5 s, `ease-out`) |
| 800 ms | name-card slides in from the right (`transform: translate(100%,-50%) → translate(0,-50%)`, 0.6 s, `cubic-bezier(0.34,1.56,0.64,1)` overshoot); `snd('boss',0.5)` |
| 3200 ms | name-card slides back out (same 0.6 s transition) |
| 3600 ms | bars start `letterboxOut` (`60px → 0`, 0.4 s, `ease-in`) |
| 4100 ms | classes reset, `bossIntroActive = false`, `paused = false` |

CSS (L31–L32, L254–L262): bars are `#0B0E1A`, `position:fixed`, `z-index:55`; the name card is `z-index:56`, right-anchored, `padding:16px 40px 16px 24px`, `border-left:4px solid <borderColor>`, `border-radius:8px 0 0 8px`, gradient background `rgba(15,10,30,0.95) → rgba(25,15,40,0.95)` with an 8 px backdrop blur. Boss name is `clamp(20px,3vw,30px)` bold with `letter-spacing:3px` and a 20 px `currentColor` glow; the subtitle is 12 px `#aaa` at `letter-spacing:1px`.

Call sites: `enterDungeon` (dungeon/floor name card, L7074), the Shadow Queen portal transition (L9331), and Part 1's Goblin King spawn. `enterDungeon` clears `bossIntroActive = false` first so a queued intro cannot block the new one.

### 14.3 Mini-boss popup (L5338)

```js
function showMiniBossPopup(name,subtitle,color){
  var p=document.getElementById('mbPopup');
  document.getElementById('mbNm').textContent=name;document.getElementById('mbNm').style.color=color;
  document.getElementById('mbSub').textContent=subtitle;
  p.classList.add('show');
  setTimeout(function(){p.classList.remove('show');},2500);
}
```

A non-blocking 2.5 s banner: `position:fixed; top:60px; left:50%`, `transform: translateX(-50%) translateY(-100%) → translateY(0)` over 0.4 s with an opacity fade, `z-index:15`. It does **not** pause the game.

### 14.4 Small VFX helpers in the same block

- `levelUpBurst(h)` (L5354): 30 particles, `speed rnd(80,250)`, `life rnd(0.6,1.2)`, `sz rnd(2,6)`, colours `[hero.col, '#E8A838', '#fff']`, `grav 150`, `fric 0.93`.
- `equipPickupVFX(h, eqCol)` (L5362): 10 particles converging inward from `r rnd(30,60)` at speed 80, `life 0.5`, plus a floating `'NEW GEAR!'` label in `#E8A838`.

---

## 15. Particles, VFX & Projectiles

**Legacy lines:** `// ===== PARTICLES =====` L1724–L1745; `// ===== V24: ABILITY VFX SYSTEM =====` L1746–L1751; `// ===== PROJECTILES =====` L1752–L1757; `// ===== LOOT =====` L1758.

### 15.1 Particle pool

```js
var parts=[];
function Part(x,y,o){this.x=x;this.y=y;o=o||{};this.vx=o.vx||0;this.vy=o.vy||0;this.life=o.life||.5;this.ml=this.life;this.sz=o.sz||3;this.col=o.col||'#fff';this.grav=o.grav||0;this.fric=o.fric||.98;this.txt=o.txt||null;this.fs=o.fs||16;this.bounce=o.bounce||false;this.bd=false;this.crit=o.crit||false;this.scalePulse=o.scalePulse||0;}
Part.prototype.update=function(dt){this.life-=dt;this.vy+=this.grav*dt;this.vx*=this.fric;this.vy*=this.fric;this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.bounce&&!this.bd&&this.vy>0&&this.life<this.ml*.6){this.vy=-80;this.bd=true;}return this.life>0;};
```

| Field | Default | Meaning |
|---|---|---|
| `vx`,`vy` | 0 | velocity px/s |
| `life`/`ml` | 0.5 | remaining / max lifetime, alpha = `life/ml` |
| `sz` | 3 | radius (drawn as `max(0.1, sz*alpha)` — particles shrink as they fade) |
| `col` | `#fff` | fill |
| `grav` | 0 | px/s² added to `vy` |
| `fric` | 0.98 | per-frame velocity multiplier (frame-rate dependent, not `dt`-scaled) |
| `txt` | null | if set, renders as text instead of a dot |
| `fs` | 16 | font size for text particles |
| `bounce` | false | one-shot upward kick of `-80` once `vy > 0` and 40% of life has elapsed |
| `crit` | false | adds a 10 px `shadowBlur` glow |
| `scalePulse` | 0 | text scales by `1 + scalePulse*(life/ml)` |

`Part.prototype.draw` (L1728) draws text particles with a `bold Npx sans-serif` fill plus a 2 px `rgba(0,0,0,0.5)` stroke outline; dot particles are a simple arc.

**Cap:** `parts` is filtered each frame in `update()` and then truncated: `if(parts.length>MAX_PARTICLES)parts.length=MAX_PARTICLES;` (250). `updWeather` has a second guard truncating `parts` to 800 (L1641). Note truncation keeps the **oldest** entries and drops the newest.

**Density scaling:** `getParticleMul()` (L602) returns `0.3 / 0.6 / 1.0` for the `low / med / high` particle-density setting; call sites multiply their spawn counts by it.

### 15.2 Named particle emitters

| Function | Line | Recipe |
|---|---|---|
| `dust(x,y)` | L1730 | 1 particle, offset `rnd(-5,5)/rnd(-2,2)`, `vx rnd(-20,20)`, `vy rnd(-30,-10)`, `life 0.4`, `sz rnd(2,4)`, colour from `['#c4a35a','#d4b86a','#b8956a']`, `grav 60` |
| `dmgN(x,y,n,col,crit)` | L1731 | damage number — see below |
| `hitFx(x,y,col)` | L1743 | 6 particles, `speed rnd(60,150)`, `life 0.3`, `sz rnd(2,5)`, `fric 0.92`, plus `snd('hit',0.12)` |
| `xpFx(x,y)` | L1744 | 8 particles, `speed rnd(40,100)`, `life 0.6`, `sz rnd(2,4)`, colours `['#3DCC7A','#2D8C56','#E8A838']`, `grav 80`, `fric 0.95` |
| `announce(t,c,d)` | L1745 | sets `annText`, `annTimer = d || 2.5`, `annColor = c || '#E8A838'` |

`dmgN` (L1731) in full:

```js
if(!settings.showDmgNumbers)return;
var dmgCount=0;for(var di=0;di<parts.length;di++)if(parts[di].txt)dmgCount++;
if(dmgCount>=30){for(var di2=0;di2<parts.length;di2++){if(parts[di2].txt){parts.splice(di2,1);break;}}}
var _nv=typeof n==='number'?n:0;var _bfs=clamp(16+Math.floor(_nv/20)*2,16,32);
var _dcol=col||'#fff';if(typeof n==='number'&&!col){_dcol=_nv<10?'#fff':_nv<30?'#E8A838':_nv<60?'#D88030':'#D84830';}
var _cfs=crit?Math.floor(_bfs*1.3):_bfs;var _csp=crit?0.3:0;
parts.push(new Part(x+rnd(-15,15),y-10,{vy:-130,life:1,txt:(crit?'CRIT! ':'')+n,fs:_cfs,col:_dcol,grav:180,bounce:true,crit:crit,vx:rnd(-20,20),scalePulse:_csp}));
if(crit){for(var ci=0;ci<6;ci++){ ... }}
```

At most **30** text particles exist at once (the oldest is evicted). Font size grows 2 px per 20 damage from 16 to 32; crits are 1.3× larger with a 0.3 scale pulse, a `CRIT! ` prefix and a 6-spark burst. Auto-colour by magnitude: `<10` white, `<30` `#E8A838`, `<60` `#D88030`, else `#D84830`.

### 15.3 Ability VFX (L1746–L1751)

```js
var abilityVFX=[];
function addAbilityVFX(opts){abilityVFX.push({x:opts.x,y:opts.y,timer:0,duration:opts.duration||1,data:opts.data||{},update:opts.update||function(){},draw:opts.draw||function(){}});}
function updateAbilityVFX(dt){for(var i=abilityVFX.length-1;i>=0;i--){abilityVFX[i].timer+=dt;if(abilityVFX[i].update)abilityVFX[i].update(abilityVFX[i],dt);if(abilityVFX[i].timer>=abilityVFX[i].duration)abilityVFX.splice(i,1);}}
function drawAbilityVFX(){for(var i=0;i<abilityVFX.length;i++){var v=abilityVFX[i];if(v.draw)v.draw(v,v.x-cam.x,v.y-cam.y,v.timer/v.duration);}}
```

A generic closure-driven effect: `update(self, dt)` each frame, `draw(self, screenX, screenY, progress)` with a normalised progress. **There is no cap** on `abilityVFX` — unlike `arenaEffects` (8) and `parts` (250). Data lives on `self.data`.

### 15.4 Projectiles (L1752–L1757)

```js
var projs=[];
function Proj(x,y,a,spd,o){this.nid=netId();this.x=x;this.y=y;o=o||{};this.vx=Math.cos(a)*spd;this.vy=Math.sin(a)*spd;this.life=o.life||2;this.dmg=o.dmg||10;this.sz=o.sz||4;this.col=o.col||'#E8A838';this.homing=o.homing||false;this.tgt=o.tgt||null;this.slow=o.slow||0;this.dot=o.dot||0;this.chain=o.chain||0;this.trail=[];this.friendly=o.friendly!==false;this.pierce=o.pierce||false;this.hits=new Set();this.reflected=o.reflected||false;this.src=o.src||null;}
```

| Field | Default | Meaning |
|---|---|---|
| `nid` | `netId()` | network identity (rolling 1…2,000,000,000) |
| `life` | 2 s | despawn timer |
| `dmg` | 10 | on-hit damage |
| `sz` | 4 | collision radius and draw radius |
| `col` | `#E8A838` | fill + 12 px shadow glow |
| `homing` | false | steer toward `tgt` |
| `tgt` | null | homing target |
| `slow` | 0 | seconds of `slowT` applied on hit |
| `dot` | 0 | damage-over-time value; sets `_dotDmg` and `_dotT = 4` on the victim |
| `chain` | 0 | chain-lightning counter (consumed by Part 1 hero code) |
| `friendly` | true | true = hits enemies, false = hits heroes |
| `pierce` | false | survives the first hit |
| `hits` | `Set` | per-target hit dedupe |
| `reflected` | false | set when a Crystal Golem bounces it back |
| `src` | null | originating hero, for damage attribution |

```js
Proj.prototype.update=function(dt){this.life-=dt;if(this.homing&&this.tgt&&!this.tgt.dead){var ta=ang(this,this.tgt),ca=Math.atan2(this.vy,this.vx),d=ta-ca;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;ca+=d*3*dt;var sp=Math.hypot(this.vx,this.vy);this.vx=Math.cos(ca)*sp;this.vy=Math.sin(ca)*sp;}this.x+=this.vx*dt;this.y+=this.vy*dt;this.trail.push({x:this.x,y:this.y,a:1});if(this.trail.length>8)this.trail.shift();for(var i=0;i<this.trail.length;i++)this.trail[i].a-=dt*3;return this.life>0&&this.x>-50&&this.x<WW+50&&this.y>-50&&this.y<WH+50;};
```

Homing turns toward the target at `3 rad/s` while preserving speed. The trail is an 8-sample ring buffer whose alphas decay at `3/s`. A projectile dies on `life <= 0` or 50 px outside the world bounds.

**Collision (overworld, `update()` L9261–L9272)** — resolved in this order for friendly projectiles:

1. **Enemies** — `dst(p,e) < e.sz + p.sz`, skipping `p.hits`. Applies damage, attributes it to `p.src.stats.dmgDealt`, runs `onKillEffects` on death, applies `slow` (`slowT = max(slowT, p.slow)`) and `dot` (`_dotDmg = p.dot; _dotT = 4`), adds to `hits`, and sets `life = 0` unless `pierce`.
2. **Mini-bosses** — same radius test. **Crystal Golem special case:** an unreflected projectile is bounced (`vx,vy *= -1`, `friendly = false`, `reflected = true`, colour `#6B8EC8`, `REFLECT!` damage number). A reflected projectile hitting the golem damages it normally.
3. **Goblin King boss** — `dst < boss.sz + p.sz`, `slowT = 1` if slowing, always consumed.
4. **Shadow Queen** — identical.
5. **Spawners** — fixed radius `30 + p.sz`, always consumed.

Hostile projectiles (`friendly === false`) test only heroes at a fixed radius of `15 + p.sz`.

**Cap:** `if(projs.length>MAX_PROJS)projs.length=MAX_PROJS;` (150) after the filter.

`Proj.prototype.draw` (L1756) renders the trail as fading dots of radius `max(0.5, sz*(i/trailLen))` at `alpha = a*0.5`, then the head with a 12 px `shadowBlur` glow and a white `rgba(255,255,255,0.8)` core at 40% radius.

In dungeons, projectiles are updated inside `updateDungeon` with an extra wall-bounce rule for the cave dungeon (crystal reflection, L8182).

### 15.5 Screen shake and hit-stop (L613–L614)

```js
function screenShake(intensity,duration){if(!settings.screenShake)return;shk.i=Math.min(shk.i+intensity,25);shk.t=Math.max(shk.t,duration);shk.maxT=shk.t;}
function hitStop(duration){if(!settings.hitStop)return;window._hitStop=Math.max(window._hitStop,duration);}
```

Shake intensity accumulates but is clamped at **25**; duration takes the max of the current and requested value. Application (L9256):

```js
if(shk.t>0){shk.t-=dt;var _sd=shk.maxT>0?shk.t/shk.maxT:0;var _si=shk.i*_sd;cam.x+=rnd(-_si,_si);cam.y+=rnd(-_si,_si);if(shk.t<=0){shk.i=0;shk.maxT=0;}}
```

Amplitude decays linearly to zero over the remaining duration. Hit-stop freezes the entire frame (`return` before anything else, L9227), so it also stops rendering.

---
## 16. Overlay / UI Structure & HUD

**Legacy lines:** CSS L7–L308 (overlay blocks at L39 start screen, L66 HUD, L97 overlay base, L107 level-up, L134 skill tree, L154 inventory, L221 pause, L232 game over, L240 victory, L254 boss intro, L266 dungeon overlays, L291 responsive); DOM L310–L516; `// ===== V5 OVERLAY SYSTEM =====` L3645–L3742; `// ===== V5 OVERLAY SHOW/HIDE =====` (the HTML builders) L3742–L4279; `hideAllOverlays` + settings L4280–L4312; the canvas-drawn screens (`drawVictoryStats` L6378, level-up choices L6424, skill-tree viewer L6468, inventory screen L6532, pause menu L6563, floating skill icons L6603) L6377–L6626.

The v27 UI is **HTML DOM layered over the canvas**, except the minimap, quest journal, bestiary, dialogue box, compass, tutorial bar, boss bars, announcements and touch controls, which are canvas-drawn.

### 16.1 Overlay inventory

| Element id | Purpose | Shown by | Hidden by | Pauses? |
|---|---|---|---|---|
| `loading` | Start screen | initial page state | `startGame()` / `loadSlotFromTitle()` (adds `.hidden`, `display:none` after 500 ms) | n/a |
| `hud` | In-game HUD | `showV5Hud()` | `hideV5Hud()` | no |
| `levelUpOverlay` | Level-up card picker | `showLevelUpHTML()` (L3746) | card selection | yes (`showLvl`) |
| `skillTreeOverlay` | Skill trees | `toggleSkillTree()` → `showSkillTreeHTML()` (L3819) | `toggleSkillTree()` | yes |
| `inventoryOverlay` | Gear/inventory/stash | `toggleInventory()` → `showInventoryHTML()` (L3991) | `toggleInventory()` | yes |
| `pauseOverlay` | Pause menu | `togglePause()` → `showPauseHTML()` (L4178) | `togglePause()` | yes |
| `gameOverOverlay` | Game over | Part 1 death path | `goBtn` (restart) / `goTitleBtn` | — |
| `victoryOverlay` | Victory | `showVictoryHTML()` | `vicKeepPlaying` / `vicEndless` / `vicNGPlus` / `vicAgain` / `vicTitle` | — |
| `victoryStatsOverlay` | Per-hero stat breakdown | `showVictoryStatsHTML(title, sub, cb)` (L4221) | `vicStatsContinueBtn` → runs `cb` | — |
| `dungeonEntryOverlay` | "Enter this dungeon?" | `showDungeonEntryOverlay(biome)` | `dngEnterBtn` / `dngCancelBtn` / Escape | yes |
| `dungeonVictoryOverlay` | Dungeon cleared | `showDungeonVictory()` | `dngVicBtn` → `exitDungeon(true)` | yes |
| `dungeonFailOverlay` | Dungeon failed / retreat | `showDungeonFail()` | `dngFailBtn` → `exitDungeon(false)` | yes |
| `merchantOverlay` | Merchant shop | `showMerchantHTML()` (L1715) | buying out the stock / Escape path | yes |
| `bountyOverlay` | Bounty board | `showBountyBoardHTML()` (L1713) | its own close control | yes |
| `settingsOverlay` | Settings + rebinding | `showSettingsUI()` (L4287) | `hideSettingsUI()` (L4308) | yes |
| `lbTop` / `lbBot` | Boss-intro letterbox bars | `playBossIntro()` | same, on a timer | yes |
| `bossNamecard` | Boss name card | `playBossIntro()` | same | yes |
| `mbPopup` | Mini-boss banner | `showMiniBossPopup()` | 2.5 s timer | no |
| `guestPauseOverlay` | "Host paused" notice for guests | guest snapshot `pa` flag | same | — |

Show/hide primitives (L3743–L3744):

```js
function showOverlayEl(id){var el=document.getElementById(id);if(!el)return;el.style.display='';el.classList.remove('hiding');el.classList.add('showing');}
function hideOverlayEl(id,cb){var el=document.getElementById(id);if(!el)return;el.classList.remove('showing');el.classList.add('hiding');setTimeout(function(){el.classList.remove('hiding');el.style.display='none';if(cb)cb();},200);}
```

Hide is a **200 ms** CSS-animated fade before `display:none`; an optional callback fires afterwards.

`hideAllOverlays()` (L4280) clears `showing`/`hiding` and resets `style.display` on the 13 overlays listed there — note it sets `display = ''` (the stylesheet default), not `'none'`, so it relies on each overlay's CSS default being hidden.

**Mutual exclusion:** `toggleSkillTree` / `toggleInventory` / `togglePause` (L4339–L4361) each close the other two plus the quest journal, then set `paused` to their own visibility:

```js
function toggleSkillTree(){
  if(gameOver||gameWon||showLvl)return;
  showSkillTree=!showSkillTree;showInventory=false;showPauseMenu=false;showQuestJournal=false;
  paused=showSkillTree;
  if(showSkillTree){showSkillTreeHTML();hideOverlayEl('inventoryOverlay');hideOverlayEl('pauseOverlay');}
  else hideOverlayEl('skillTreeOverlay');
}
```

All three refuse to open during game over, victory, or a pending level-up.

### 16.2 Start screen (`#loading`, L311–L349)

Contents in order: title `⚔️ The Stewart Squad Adventure`; `#verLabel` (`— V27 — GEAR & UI`, click-to-toggle DEV_MODE on 5 taps within 2 s, L9435); tagline `The world has stories to tell.`; a four-card hero showcase (Liam `#4A9ED8` Tank, Noah `#2DB86A` DPS, Collette `#A862C4` Mage, Isabella `#F0C040` AoE); a feature grid; three difficulty buttons (`☀️ Easy` / `⚔️ Normal` selected / `💀 Hard`, `data-diff` 0/1/2); `#titleSaveSlots` (populated by `refreshTitleSaveSlots()`); `#mpSection` (Host / Join / 4-char code input / `#mpStatus` / `#mpServerUrl` defaulting to `ws://localhost:3000`); `#startBtn` (`START ADVENTURE`); `#titleSettingsBtn`; and `#titleTip`, which is filled with a random `TIPS[]` line by `returnToTitle()` (L1362).

### 16.3 HUD (`#hud`, L350–L380)

| Element id | Content | Update source |
|---|---|---|
| `hudHeroNm` | `<FullName> Lv<teamLv>` | `updateV5Hud` L3691 |
| `hudHpBar` / `hudHpText` | width `%` of `hp/maxHp`; colour `--hp-green` > 50%, `--hp-yellow` > 25%, else `--hp-red`; adds `.critical` class below 25%; text `ceil(hp) / maxHp` | L3693–L3696 |
| `hudXpBar` / `hudXpText` | width `totalXP/xpNext`; text `Lv<N> XP` | L3697 |
| `hudSibs` | `👥 Siblings: <sibs>/3` | L3697 |
| `hudWave` | `Wave <waveNum>` | L3697 |
| `hudDiff` | `DIFF_NAMES[difficulty]` with class `diff-easy` / `diff-normal` / `diff-hard` | L3697 |
| `hudDayNight` | 🌙 night, 🌅 dusk/dawn, ☀️ day | L3698 |
| `hudWeather` | weather icon+label, hidden when clear or in a dungeon | L3701 |
| `hudNightXP` | `XP +50%`, shown only at night | L3699 |
| `hudGold` | `⬤ <gold>g` | L3703 |
| `hudNG` | `NG+<n>`, hidden at `ngPlus === 0` | L3704 |
| `hudDev` | `🔧 DEV`, shown only in DEV_MODE | L3705 |
| `hudPorts` | the four hero portraits (built by `buildPortraitStrip`) | L3650 |
| `hudUlt` | `⚡ ULTIMATE READY — SPACE`, shown when *your* hero's `ultTimer <= 0` | L3708 |
| `hudCombo` | `⚡ <comboName> — Q`, pulsing at `0.7 + 0.3*sin(gt*6)` in the combo's colour | L3710 |
| `hudSig` | `⚡ <sigName> [E]` when ready, else `<sigName> [E] (Ns)` at 50% opacity | L3713 |
| `hudMode` | `controlMode.toUpperCase()` | L3719 |

`updateV5Hud()` also hides the whole HUD (`opacity: 0`) while the quest journal or bestiary is open (L3677).

**Portrait strip (`buildPortraitStrip`, L3650):** four `.hud-port` divs at 50 px pitch starting at x = 10, each 42 px wide. Locked heroes render `<div class="port-locked">?</div>`. Unlocked heroes get a HP bar (`#3DCC7A` above 50%, `#D84830` below), a coloured initial circle (`L/N/C/I`, colour from the hero's skin or `HDEFS[i].col`), the full name, an ult-charge bar (`1 - ultTimer/ultMax`), and a revive countdown when downed. Classes: `.active` for `myHeroIdx()`, `.locked`, `.downed`. Clicking a portrait switches heroes (blocked for guests). The strip is rebuilt on hero unlock, save load, guest assignment and dungeon exit; per-frame values are patched in place by `updateV5Hud` (L3721–L3737) rather than rebuilt.

**Biome accent (`updateBiomeAccent`, L3347):** every 1 s (`biomeAccentTimer`, L9235) the active portrait's border/glow and the control-mode label are recoloured to the current biome accent: `{forest:'#E8A838', desert:'#D4944A', cave:'#8B7BCC', swamp:'#6AAF5C', frozen:'#88B8D8', volcanic:'#D86040'}`.

### 16.4 Canvas-drawn HUD layers (render order, L9339–L9414)

`render()` draws, in order: ground → sorted drawables (obstacles, spawners, cages, loot, equips, enemies, mini-bosses, boss, shadow queen, heroes, dungeon entrances, NPCs, Ed, escort, waypoints, merchant, flavor markers, quest items, secrets, bounty board — all sorted by `y`) → projectiles → particles → biplane → weather → world-event effects → portal → fog → day/night tint → crater (drawn *after* fog so it shines through) → `endWorldZoom()` → world vignette → level-up flash → low-HP red pulse → damage vignette → crater vignette → boss bar → cage HP overlay → shadow queen bar, announcement, achievements, joystick, touch buttons, endless HUD, minimap, offscreen ally arrows → mini-boss bars, quest tracker, tutorial bar, equipment tooltip, compass, bestiary, quest journal, quest notifications, dialogue box.

Visibility culling uses `FOG_R = 320 * nightFogMul()`: `vis(e)` is true when the viewing hero is dead or `dst(e, h0) <= FOG_R + 50`.

`drawBossBar(entity,name,barColor,segmentCount,mini)` (L3366): the bar lerps `_displayHp` toward `hp` at `8/60` per frame. Full-size: `w = W*0.6`, `h = 18` at `(W*0.2, 10)`; mini: `w = W*0.24`, `h = 14` at `(W*0.38, 36)`. `segmentCount` white 2 px dividers mark phase thresholds; the label sits below the bar and appends `ceil(hp)/maxHp` in non-mini mode.

`drawFog()` (L3329): a `rgba(10,10,30,0.65)` fill with a circular hole of radius `300 * nightFogMul()` around the viewing hero, plus a radial gradient from transparent at 70% radius to `rgba(10,10,30,0.55)` at the rim. If the viewing hero is dead (and not merely downed) it falls back to the first living hero.

`drawWorldVignette()` (L3355): radial `rgba(0,0,0,0)` at `W*0.35` to `rgba(11,14,26,0.25)` at `W*0.75` — always on.
`drawVignette()` (L3361): the red damage vignette; `vig.t` decays at `1/60` per call, then `vig.i` bleeds off at `0.03` per call.

### 16.5 Settings overlay (L4286–L4312)

Eight settings, all persisted to `localStorage['ssq_settings']`:

| Key | Type | Options | Default |
|---|---|---|---|
| `screenShake` | bool | ON/OFF | `true` |
| `hitStop` | bool | ON/OFF | `true` |
| `particleDensity` | tri | `low` / `med` / `high` | `high` |
| `autoAim` | bool | ON/OFF | `true` |
| `showTutorial` | bool | ON/OFF | `true` |
| `showDmgNumbers` | bool | ON/OFF | `true` |
| `showMinimap` | bool | ON/OFF | `true` |
| `worldZoom` | tri | `1.0` / `1.15` / `1.30` | `1.30` |

Below them, a `CONTROLS` section lists 12 rebindable actions (`moveUp, moveDown, moveLeft, moveRight, interact, ultimate, signature, comboUlt, hero1..hero4`) plus a `Reset to Defaults` button. `settingsOpenedFrom` (`'direct' | 'pause' | 'title'`) determines where `hideSettingsUI()` returns to; a `direct` close sets `paused = false`.

---

## 17. Input

**Legacy lines:** `// ===== INPUT =====` L921–L1121.

### 17.1 Key bindings (L605–L612)

```js
var keyBinds={moveUp:['w','arrowup'],moveDown:['s','arrowdown'],moveLeft:['a','arrowleft'],moveRight:['d','arrowright'],hero1:['1'],hero2:['2'],hero3:['3'],hero4:['4'],interact:[' '],ultimate:['r','0'],signature:['e'],bestiary:['b'],questJournal:['j'],compass:['g'],pause:['escape','p'],skillTree:['t'],inventory:['i'],controlMode:['c'],mute:['m'],comboUlt:['q']};
var DEFAULT_KEYBINDS=JSON.parse(JSON.stringify(keyBinds));
```

| Action | Default keys |
|---|---|
| `moveUp` | `w`, `↑` |
| `moveDown` | `s`, `↓` |
| `moveLeft` | `a`, `←` |
| `moveRight` | `d`, `→` |
| `hero1`–`hero4` | `1`, `2`, `3`, `4` |
| `interact` | `Space` |
| `ultimate` | `r`, `0` |
| `signature` | `e` |
| `bestiary` | `b` |
| `questJournal` | `j` |
| `compass` | `g` |
| `pause` | `Escape`, `p` |
| `skillTree` | `t` |
| `inventory` | `i` |
| `controlMode` | `c` |
| `mute` | `m` |
| `comboUlt` | `q` |

Persistence and remapping (L609–L612):

```js
function saveKeyBinds(){try{localStorage.setItem('ssq_keybinds',JSON.stringify(keyBinds));}catch(e){}}
function loadKeyBinds(){try{var kb=JSON.parse(localStorage.getItem('ssq_keybinds'));if(kb){for(var k in keyBinds)if(kb[k]&&Array.isArray(kb[k]))keyBinds[k]=kb[k];}}catch(e){}}
function resetKeyBinds(){keyBinds=JSON.parse(JSON.stringify(DEFAULT_KEYBINDS));saveKeyBinds();}
function keyAction(action,k){return keyBinds[action]&&keyBinds[action].indexOf(k)>=0;}
```

Rebinding UI (L4305): clicking a `.rebind-btn` swaps its label to `Press key...`, installs a capture-phase `keydown` listener, and on the next key writes `keyBinds[action] = [newKey.toLowerCase()]` — **replacing** the whole array, so a rebind drops the secondary default. `Escape` cancels. `loadSettings(); loadKeyBinds();` run at module load (L615).

**Case sensitivity gotcha:** most checks use `keyAction(action, kl)` with the lowercased key, but `interact`, `ultimate` and the hero-switch checks use the raw `e.key` (L942, L970–L971). Since the defaults for those are `' '`, `'r'`/`'0'` and `'1'`–`'4'`, this only matters if a user rebinds them to a letter and holds Shift.

### 17.2 Non-rebindable / hard-coded keys

| Key | Effect | Line |
|---|---|---|
| `Space` / `Enter` | skip cutscene (checked first, before everything) | L933 |
| `` ` `` | toggle `showNetDebug`; also the DEV_MODE dungeon room-clear cheat | L934, L976 |
| `F2` | toggle `DEV_MODE` (room-clear cheat on/off) | L955 |
| `F6` | DEV: drop `rnd(2,5)` parachute crates, or launch a supply flyover | L983 |
| `F7` | DEV: force a biplane crash approach and spawn Ed | L993 |
| `F8` | DEV: cycle to the next weather type, `timer = rnd(20,40)` | L1014 |
| `F9` | dump a diagnostic block to the console (hero, biome, time, biplane state, story flags, enemy count) | L1023 |
| `F10` | DEV: replay the meteor cutscene | L1020 |
| `1` / `2` / `3` | pick a level-up card when `showLvl` (host only) | L1033 |
| `Ctrl+Shift+D` | toggle the dev console | L9891 |

`preventDefault()` is applied to the four arrows and Space (L965) to stop page scrolling.

### 17.3 Mouse

- `mousemove` tracks `mx,my` (L1035).
- `canvas.click` (L1036) in order: quest-tracker cycling hitbox at `(W-140, 142, 130x42)`; early-return if any HTML overlay is open; guest branch (portrait strip at `y<55`, 50 px pitch, sends a `switchHero` request; hybrid-mode click captured into `pendingClick`); host portrait click (`y<55`, `x` in `[10+i*50, +42]`); click-to-attack in `hybrid`/`manual` mode. World coordinates are computed as:

```js
var wx,wy;if(inDungeon){var rw9c=DNG_COLS*DNG_TW,rh9c=DNG_ROWS*DNG_TW;var dox9c=Math.floor((W-rw9c)/2),doy9c=Math.floor((H-rh9c)/2);var _uz=unzoomScreenPoint(e.clientX,e.clientY);wx=_uz.x-dox9c;wy=_uz.y-doy9c;}else{var _uz2=unzoomScreenPoint(e.clientX,e.clientY);wx=_uz2.x+cam.x;wy=_uz2.y+cam.y;}
ah.forceAtkAngle=Math.atan2(wy-ah.y,wx-ah.x);
ah.forceAtk=true;
```

- A second `click` listener (L9414) restarts the game when `gameOver`/`gameWon` and no overlay is open.

### 17.4 Control modes

`controlMode` cycles `classic → hybrid → manual → classic` on the `controlMode` bind (L946). Guests cycle only `classic ↔ hybrid` (L940). `hybrid` and `manual` enable click/tap-to-attack; `classic` relies on auto-aim. The mode is shown in `#hudMode`.

### 17.5 Touch

```js
var touchState={joy:{on:false,id:-1,sx:0,sy:0,dx:0,dy:0,mag:0},atkBtn:{on:false,x:0,y:0,r:30},ultBtn:{on:false,x:0,y:0,r:25},interactBtn:{on:false,x:0,y:0,r:25}};
function layoutTouchButtons(){var bx=W-65,by=H-85;touchState.atkBtn={on:false,x:bx,y:by,r:30};touchState.ultBtn={on:false,x:bx-70,y:by,r:25};touchState.interactBtn={on:false,x:bx,y:by-70,r:25};}
function touchInBtn(tx,ty,btn){return Math.hypot(tx-btn.x,ty-btn.y)<=btn.r+10;}
```

| Control | Position | Radius (+10 px hit padding) |
|---|---|---|
| Attack | `(W-65, H-85)` | 30 |
| Ultimate | `(W-135, H-85)` | 25 |
| Interact | `(W-65, H-155)` | 25 |

Virtual buttons are only tested when `isMob` is true (`/Android|iPhone|iPad|iPod|webOS/i` on the user agent, L616).

**Virtual joystick** (L1094–L1101): a touch starting in the **left half** (`clientX < W*0.5`) becomes the stick; drag is clamped to a 60 px radius, and `joy.dx/dy` are normalised to `[-1,1]` with `joy.mag` the normalised magnitude. `getInput()` (L1119) overrides keyboard input whenever `joy.on && joy.mag > 0.15`:

```js
function getInput(){var ix=0,iy=0;if(keyBinds.moveUp.some(function(k){return keys[k];}))iy=-1;if(keyBinds.moveDown.some(function(k){return keys[k];}))iy=1;if(keyBinds.moveLeft.some(function(k){return keys[k];}))ix=-1;if(keyBinds.moveRight.some(function(k){return keys[k];}))ix=1;if(joy.on&&joy.mag>.15){ix=joy.dx;iy=joy.dy;}var m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}return{x:ix,y:iy};}
```

A **second** `touchstart` listener (`tapAttack`, L1103) adds legacy v7.1 rectangular buttons that coexist with the circular ones: dungeon interact at `x > W-80, H-165 < y < H-120`; ultimate at `x > W-80, H-215 < y < H-170`; portrait taps at `y < 55`; and tap-to-attack in hybrid/manual mode, skipping the joystick zone (`x < W*0.35 && y > H*0.55`). Note this second handler computes dungeon world coordinates **without** `unzoomScreenPoint`, unlike the mouse path — a latent inconsistency at non-1.0 zoom.

### 17.6 Gamepad

**Not implemented.** There is no `navigator.getGamepads` call, no `gamepadconnected` listener, and no gamepad code anywhere in the file.

---

## 18. Main Loop & Init Ordering

**Legacy lines:** `// ===== MAIN LOOP =====` L9221–L9414; `// ===== START =====` L9415–L9517.

### 18.1 Frame structure (`gameLoop`, L9223–L9244)

```js
var lastTime=0;
function gameLoop(time){requestAnimationFrame(gameLoop);var dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
  var _frameStart=performance.now();
  if(window._hitStop>0){window._hitStop-=dt;return;}
  try{
  if(NET.role==='guest'){guestGameLoop(time);return;}
  updateV5Hud();
  if(showVictoryStats){drawVictoryStats();return;}
  if(gameOver||gameWon){beginWorldZoom();drawGround();drawFog();drawDayNightTint();endWorldZoom();if(boss&&!boss.dead)drawBossBar(boss,"GOBLIN KING","#D84830",4,false);drawAchievements();return;}
  if(cutscene.active){updateCutscene(dt);if(inDungeon)renderDungeon();else render();drawCutscene();if(DEV_MODE)drawPerfOverlay(performance.now()-_frameStart);return;}
  if(!paused){gt+=dt;if(!inDungeon)dayTime+=dt;tutorialTimer=Math.max(0,tutorialTimer-dt);biomeAccentTimer-=dt;if(biomeAccentTimer<=0){biomeAccentTimer=1;updateBiomeAccent();}if(inDungeon)updateDungeon(dt);else update(dt);updateBGM9(dt);}
  if(NET.role==='host')netHostUpdate(dt);
  if(inDungeon)renderDungeon();else render();
  if(NET){ /* player badges + net HUD */ }
  if(DEV_MODE)drawPerfOverlay(performance.now()-_frameStart);
  }catch(e){console.error('gameLoop error:',e);}}
```

**Timestep:** entirely **variable**, driven by `requestAnimationFrame`, with `dt` clamped to a maximum of **0.05 s** (20 fps floor). There is no fixed-step accumulator anywhere — physics, timers and AI all consume the raw `dt`. Several systems nevertheless use hard-coded `1/60` constants (`drawVignette`, `drawWeather`'s `flashT`, `TUTORIAL_STEPS[6]`, the Shadow Queen's `update(1/60)` call at L9333, and `drawBossBar`'s HP lerp), so those are frame-rate dependent.

**Early-return ladder** (each stops the frame):

| Order | Condition | Behaviour |
|---|---|---|
| 1 | `window._hitStop > 0` | decrement and return — nothing updates or draws |
| 2 | `NET.role === 'guest'` | hand off to `guestGameLoop(time)` |
| 3 | `showVictoryStats` | draw the stats screen only |
| 4 | `gameOver \|\| gameWon` | draw ground + fog + tint + boss bar + achievements only |
| 5 | `cutscene.active` | `updateCutscene`, full render, `drawCutscene` — no simulation |

**Pause handling:** `paused` gates exactly one block — the `gt`/`dayTime` advance, `tutorialTimer`, the biome-accent timer, `updateDungeon`/`update`, and `updateBGM9`. **Rendering, the net host update and the HUD update still run while paused**, so overlays sit over a live-looking but frozen world. `render()` skips damage-number particles while paused (L9385) so they do not stack up behind an overlay.

`paused` is set by: level-up (`showLvl`), skill tree, inventory, pause menu, quest journal, dungeon entry/victory/fail overlays, merchant, bounty board, settings, boss intro, and `returnToTitle()`.

### 18.2 `update(dt)` order (L9246–L9337)

1. `eqTooltip.active = false`.
2. `updateTutorial(dt)`.
3. **Dialogue check** — `if(dialogueActive){dialogueCharIdx+=2;return;}` (freezes everything else).
4. `getInput()`.
5. **Wave timer**: `waveTimer -= dt`; on expiry `waveNum++` and

```js
waveTimer=Math.max(15,45-Math.floor(12*Math.log2(waveNum+1)))*(difficulty===0?1.3:difficulty===2?0.8:1);
```

   Logarithmic ramp from 45 s down to a 15 s floor, scaled ×1.3 on Easy and ×0.8 on Hard. Each wave also relieves spawner pressure (`s.cnt -= 3`), announces every 5th wave from wave 5, runs the adaptive-difficulty check on even waves, and at wave 4 hints at the crater if it is undiscovered.
   Adaptive difficulty: `_dr = downs / max(1, waveNum)`; `_dr > 0.5` eases `_adaptDiff.ratio` by `-0.03` (floor 0.8); `_dr < 0.1` with more than 10 kills since the last check tightens it by `+0.02` (ceiling 1.15).
6. **Heroes** — each `hero.update(dt, inp-or-zero, i)`; caged heroes are pinned above the boss and skipped.
7. **Camera**: `cam = lerp(cam, hero - screen/2, 5*dt)`, then clamped:

```js
var _cMinX=W/(2*WORLD_ZOOM)-W/2,_cMinY=H/(2*WORLD_ZOOM)-H/2;var _cMaxX=WW-W+W/2-W/(2*WORLD_ZOOM),_cMaxY=WH-H+H/2-H/(2*WORLD_ZOOM);cam.x=clamp(cam.x,_cMinX,Math.max(_cMinX,_cMaxX));cam.y=clamp(cam.y,_cMinY,Math.max(_cMinY,_cMaxY));
```

8. **Screen shake** applied to `cam` (§15.5).
9. `enemies` filter/update → `miniBosses` → `boss`.
10. **Projectiles** filter + collision (§15.4), then `MAX_PROJS` truncation.
11. Melee/whirl heroes damage spawners within `rng+30` at `dmg*0.5` when `atkAnim > 0.5`.
12. `spawners` → `cages` → `parts` (then `MAX_PARTICLES` truncation) → `loots` → `equips`.
13. `updWeather(dt)`.
14. `updateArenaEffects(dt)`.
15. `updateAbilityVFX(dt)`.
16. **Merchant** — spawns once at `teamLv >= 3` at `rnd(500, WW-500)` with `pickMerchantStock()`; relocates every `rnd(30,60)` s by `rnd(-400,400)` clamped to `[200, WW-200]`.
17. **Secrets** discovery (§3.5) and the `goldHoarder` achievement at 500 gold.
18. `updateBiplane(dt)`, `updateQuestItems(dt)`, crater particles/proximity, `updateFlavorMarkers(dt)` — all overworld-only.
19. `updateWorldEvents(dt)`.
20. `updateEndless(dt)`.
21. `updateNPCs9(dt)`.
22. Dungeon-entrance collision; `dungeonEntryCooldown` decay.
23. Portal collision → Shadow Realm transition.
24. Shadow Queen update (called with a hard-coded `1/60`, not `dt`).

### 18.3 Boot sequence (L9415–L9517)

1. Script parses; module-scope initialisers run: `loadSettings(); loadKeyBinds();` (L615), `state = 'title'` (L528).
2. Button listeners are wired (game-over, victory-stats continue, victory buttons, `startBtn` click + `touchend`, dungeon overlay buttons, pause menu buttons, multiplayer buttons).
3. `refreshTitleSaveSlots()` populates `#titleSaveSlots`; the saved server URL is restored from `localStorage['ssq_server_url']`.
4. The dev-console IIFE installs its keyboard hook and monkey-patches `Hero.prototype.takeDmg` for god mode.
5. Nothing else runs until the user presses **START ADVENTURE** or loads a slot.

`startGame()` (L9469):

```js
state='playing';
// guest branch: hide loading, initAudio, reset overlay flags, initSkillTrees, create 4 Hero objects for rendering, showV5Hud, rAF(gameLoop), BGM after 1.5s, return
el.classList.add('hidden');setTimeout(function(){el.style.display='none';},500);initAudio();initGame();showV5Hud();requestAnimationFrame(gameLoop);
setTimeout(function(){if(ac)startBGM9('forest');},1000);
if(NET.role==='host'&&NET.connected){setTimeout(function(){ NET.ws.send(JSON.stringify(buildStaticWorldData())); for(var gpi=1;gpi<NET.playerCount;gpi++)netAssignGuestHero(gpi); },500);}
```

Order for a host/solo start: `initAudio()` → `initGame()` (§3.4) → `showV5Hud()` → start the rAF loop → BGM at +1 s → world data + hero assignment to guests at +0.5 s.

`loadSlotFromTitle(slot)` (L9464) substitutes `loadGame(slot)` / `loadAutoSave()` for `initGame()` and starts the BGM using the loaded hero's biome.

`returnToTitle()` (L1358): `paused = true`, `hideAllOverlays()`, `stopBGM9()`, `state = 'title'`, and refreshes `#titleTip` with a random `TIPS[]` entry.

---
## 19. Networking

**Legacy lines:** `// ===== V15: NETWORKING MODULE =====` L1364–L1519; `// ===== V15: NET HOST/GUEST FUNCTIONS =====` L8668–L9220.

Transport is a plain **WebSocket** to a relay server (default `ws://localhost:3000`, persisted in `localStorage['ssq_server_url']`). The model is **authoritative host + thin guests**: the host runs the entire simulation and broadcasts snapshots; guests send input and render an interpolated copy.

### 19.1 `NET` object (L1365–L1371)

```js
var NET={ws:null,role:null,room:null,playerId:0,playerCount:1,connected:false,
  serverUrl:localStorage.getItem('ssq_server_url')||'ws://localhost:3000',
  guestHeroes:{},guestInputs:{},hostState:null,sendTimer:0,SEND_RATE:1/30,
  worldInited:false,roomCache:{},_roomRequested:{},
  tick:0,snapBuf:[],interpDelay:50,serverTimeOffset:0,serverTimeInited:false,
  _camInited:false,_lastClientRoom:null,rtt:0,pingTimer:0,lastPingT:0,
  entityMaps:{enemies:{},dungeonEnemies:{},projs:{},miniBosses:{},loots:{},equips:{}}};
```

| Field | Meaning |
|---|---|
| `role` | `null` (offline) / `'host'` / `'guest'` |
| `room` | 4-character room code |
| `playerId` | 0 for the host, 1..3 for guests |
| `playerCount` | current player count reported by the server |
| `SEND_RATE` | `1/30` — both host snapshots and guest input are sent at **30 Hz** |
| `guestHeroes` | `{playerId: heroIndex}` assignment map (host-authoritative, mirrored to guests) |
| `guestInputs` | `{playerId: lastInputMessage}` on the host |
| `hostState` | latest snapshot on the guest |
| `snapBuf` | ring buffer of the last **4** snapshots for interpolation |
| `interpDelay` | **50 ms** render delay behind server time |
| `serverTimeOffset` | `localNow - snap._t` captured from the first snapshot |
| `rtt` | round-trip time from the ping/pong pair |
| `entityMaps` | per-category `{nid: {obj}}` maps so guests can persist entity instances across snapshots |

```js
var PLAYER_COLORS=['#4A9ED8','#2DB86A','#D88030','#e91e63'];
var _nextNetId=1;function netId(){_nextNetId=(_nextNetId+1)%2000000000;return _nextNetId;}
```

| Player | Badge colour |
|---|---|
| P1 (host) | `#4A9ED8` |
| P2 | `#2DB86A` |
| P3 | `#D88030` |
| P4 | `#e91e63` |

`isGuestControlled(heroIdx)` (L1374) and `myHeroIdx()` (L1375) resolve ownership; `myHeroIdx()` returns `NET.guestHeroes[NET.playerId]` for guests and `activeHero` otherwise.

### 19.2 Connection lifecycle (L1409–L1434)

```js
function netConnect(role,code){
  if(NET.ws)NET.ws.close();
  ...
  try{NET.ws=new WebSocket(NET.serverUrl);}catch(e){announce('Could not connect to server','#D84830',3); ... return;}
  NET.ws.onopen=function(){NET.connected=true;
    if(role==='host'){NET.ws.send(JSON.stringify({type:'host'}));}
    else{NET.ws.send(JSON.stringify({type:'join',code:code.toUpperCase()}));}};
  NET.ws.onmessage=function(evt){try{var msg=JSON.parse(evt.data);netHandleMessage(msg);}catch(e){}};
  NET.ws.onclose=function(){NET.connected=false;
    if(NET.role==='guest'&&state==='playing'){announce('Disconnected from host','#D84830',3);returnToTitle();}
    ... NET.role=null;};
  NET.ws.onerror=function(){announce('Connection error','#D84830',3); ... };
}
```

`netDisconnect()` (L1426) closes the socket and resets every `NET` field including `entityMaps` (`clearEntityMaps()`), and hides `guestPauseOverlay`.

### 19.3 Message catalogue

**Client → server**

| `type` | Direction | Shape | Sent when |
|---|---|---|---|
| `host` | host → server | `{type:'host'}` | on socket open |
| `join` | guest → server | `{type:'join', code:'ABCD'}` | on socket open |
| `input` | guest → host | `{type:'input', keys:{w,s,a,d}, click:{angle}|null, q:bool, ult:bool, interact:bool, sig:bool, heroIdx:number}` | every `1/30` s from `guestSendInput` |
| `input` (hero switch) | guest → host | `{type:'input', switchHero:index}` | pressing `1`–`4` or clicking a portrait as a guest |
| `input` (room request) | guest → host | `{type:'input', requestRoom:index}` | guest needs uncached dungeon room geometry |
| `input` (level-up vote) | guest → host | `{type:'input', lvlVote:index}` | guest clicks a level-up card (L3793) |
| `state` | host → guests | `{type:'state', snapshot:{...}}` | every `1/30` s from `netHostUpdate` |
| `event` | host → guests | `{type:'event', data:{...}}` | world init, hero assignment, room change, dungeon-join rejection |
| `ping` | guest → server | `{type:'ping', t:performance.now()}` | every 2 s |

**Server → client**

| `type` | Shape | Handling (`netHandleMessage`, L1435) |
|---|---|---|
| `room` | `{type:'room', code}` | host: sets `role='host'`, `room=code`, `playerId=0`, announces and renders the room code into `#mpStatus` |
| `joined` | `{type:'joined', playerId, playerCount}` | first receipt on an unassigned client makes it a guest; on the host it announces the join, sends `buildStaticWorldData()`, calls `netAssignGuestHero(playerId)`, and warns if a dungeon is in progress |
| `left` | `{type:'left', playerId, playerCount}` | deletes that player's `guestHeroes` and `guestInputs` entries |
| `playerDC` | `{type:'playerDC', playerId}` | announces `P<n> disconnected — 30s to reconnect` |
| `playerRC` | `{type:'playerRC', playerId, playerCount}` | announces reconnection |
| `playerCount` | `{type:'playerCount', playerCount}` | guest-only count refresh |
| `state` | `{type:'state', snapshot}` | guest: establishes `serverTimeOffset` on the first snapshot, stamps `snap._localT`, pushes into `snapBuf` (max 4) |
| `input` | (relayed guest input) | host: routes `requestRoom`, `switchHero` and `lvlVote`, else stores in `guestInputs[playerId]` |
| `event` | `{type:'event', data}` | guest: `assign` (hero assignment), `worldInit`, `roomChange`, `dungeonJoin` |
| `pong` | `{type:'pong', t}` | `NET.rtt = performance.now() - msg.t` |
| `error` | `{type:'error', msg}` | announced; `'Host disconnected'` returns to title, `'Game is in a dungeon'` writes a hint into `#mpStatus` |

### 19.4 Host responsibilities

`netHostUpdate(dt)` (L8669–L8698) runs every frame after the simulation:

```js
for(var pid in NET.guestInputs){
  var gi=NET.guestInputs[pid];var hIdx=NET.guestHeroes[pid];
  if(hIdx===undefined||hIdx<0)continue;
  var gh=heroes[hIdx];if(!gh||!gh.unlocked||gh.dead||gh.downed)continue;
  if(gi.click&&gh.atkT<=0){ var atkAng=gi.click.angle!==undefined?gi.click.angle:Math.atan2(gi.click.wy-gh.y,gi.click.wx-gh.x); gh.face=atkAng;performAttack(gh,atkAng);}
  if(gi.q&&gh.coopCd<=0&&NET.playerCount>1)activateCoopAbility(gh);
  if(gi.ult&&!gh.dead&&!gh.downed&&gh.ultTimer<=0){actUlt(gh);}
  if(gi.sig&&!gh.dead&&!gh.downed&&gh.sigTimer<=0&&!gh.sigActive){activateSignature(gh);}
  if(gi.interact&&!gh._intProc){gh._intProc=true;
    if(inDungeon&&!dungeonCinematicActive){heroInteractAs(gh);}
    else if(!inDungeon){npcQuestInteractAs(gh);}
  }
  if(!gi.interact)gh._intProc=false;
  if(gi.lvlVote!==undefined&&showLvl){if(!NET._guestVotes)NET._guestVotes={};NET._guestVotes[pid]=gi.lvlVote;delete gi.lvlVote;}
}
NET.sendTimer+=dt;
if(NET.sendTimer>=NET.SEND_RATE){NET.sendTimer=0;
  try{NET.ws.send(JSON.stringify({type:'state',snapshot:buildNetSnapshot()}));}catch(e){}}
```

**Movement is not handled here** — `Hero.prototype.update()` reads `NET.guestInputs` directly for guest-controlled heroes (L2265), so guest movement is simulated inside the normal hero update. Interact is edge-triggered via a per-hero `_intProc` latch.

`netAssignGuestHero(playerId)` (L1503) assigns the lowest-index hero that is not `activeHero`, not already claimed, unlocked, alive and not downed, then broadcasts `{type:'event', data:{assign, heroName, playerId}}`. If nothing is free it announces `'No hero available for Player N'`.

Guest hero-switch requests are refereed on the host (L1477): the host's own hero cannot be taken (`"P<n> can't take host's hero"`), nor one already claimed by someone else.

### 19.5 Snapshot format (`buildNetSnapshot`, L8699–L8786)

Top-level fields (all keys are abbreviated to keep the payload small):

| Key | Contents |
|---|---|
| `_tk`, `_t` | tick counter, `performance.now()` timestamp |
| `h[]` | per-hero: `x, y, hp, mhp, u(unlocked), d(dead), dw(downed), f(face, 2dp), atkA, fl(flash), ultOn, shld, nm, col, dk, wc, aType, lv, spnA, ba, bt, st(state), deA(deathAlpha), rng, coopCd, coopA, dmgB, rt(reviveTimer), rvBy(reviver idx), rvProg` |
| `ah`, `gh`, `pc` | `activeHero`, `guestHeroes` map, `playerCount` |
| `en[]` | enemies: `id(nid), x, y, hp, mhp, t(type), dy(dying), fl, mk(marked)` |
| `pr[]` | projectiles: `id, x, y, col, sz, fr(friendly)` |
| `cam` | `{x,y}` rounded |
| `lv, xp, xpN, wv, sb, dt, diff, ns` | teamLv, totalXP, xpNext, waveNum, sibs, dayTime, difficulty, **noiseSeed** |
| `boss` | `{x,y,hp,mhp}` or null |
| `mb[]` | mini-bosses: `id, x, y, hp, mhp, t, nm, col, dk` |
| `lt[]`, `eq[]` | loot `{id,x,y}`, equips `{id,x,y,nm}` |
| `sp[]`, `cg[]` | spawners `{x,y}`, cages `{x,y,hi}` |
| `inD, dngP, go, gw` | inDungeon, pendingDungeonBiome, gameOver, gameWon |
| `em, ew, es, pa` | endlessMode, wave, score, paused |
| `sL`, `lc[]` | showLvl flag and the level-up card list `{nm,desc,col,heroNm,type}` |
| `pO, pX, pY, iSR` | portal open/position, inShadowRealm |
| `sQ` | shadow queen `{x,y,hp,mhp,phase,dying,deA,fl}` |
| `dEnt[]` | dungeon entrances `{x,y,b}` |
| `bM`, `aE` | bloodMoonActive, activeEvent `{t,x,y}` |
| `eN`, `qW[]` | escort NPC `{x,y,hp,mhp}`, quest waypoints `{x,y,v}` |
| `ann`, `shk`, `vigI` | announcement `{t,c,d}`, screen shake `{i,t}`, vignette intensity |
| `sfx[]`, `ach[]`, `qN[]` | queued sound effects, achievement toasts `{nm,ic,t}`, quest notifications `{t,c,d}` |
| `npcB[]` | per-NPC bubble state `{b,d}` or `0` |
| `dng` | present only when `inDungeon` — see below |

Dungeon sub-object `snap.dng`:

| Key | Contents |
|---|---|
| `room`, `bio` | current room index, `currentDungeon` |
| `dl`, `dds`, `dki` | doors locked flag, current room's `doorStates`, key count |
| `de[]` | dungeon enemies `{id,x,y,hp,mhp,t}` |
| `db` | dungeon boss `{x,y,hp,mhp,phase,nm,col,dk}` |
| `xpG`, `trans` | dungeon XP gained, transition flag |
| `cin`, `cinT`, `cinB` | cinematic active/timer/boss `{nm,col}` |
| `dos[]` | dynamic object states `{t, dd?, op?, ac?, x?, y?}` |
| `mm[]` | minimap data `{v,t,p}` |
| `rc[]` | per-room `{cn:connections, ds:doorStates}` |

Room **geometry** (tiles, torches, decor, hazards, full object list) is *not* in the snapshot — it is sent once per room via the `roomChange` event, cached in `NET.roomCache[roomIdx]`, and re-requested on demand with `{type:'input', requestRoom:idx}` (guarded by `NET._roomRequested`).

`buildStaticWorldData()` (L8788) sends the one-time world payload:

```js
return{type:'event',data:{worldInit:true,
  obstacles:obstacles.map(function(o){return{x:o.x,y:o.y,r:o.r,type:o.type,biome:o.biome,color:o.color,th:o.th};}),
  spawners:spawners.map(function(s){return{x:s.x,y:s.y,hp:s.hp,dead:s.dead};}),
  cages:cages.map(function(c){return{x:c.x,y:c.y,heroIdx:c.heroIdx,opened:c.opened};}),
  npcs:npcs.map(function(n){return{nm:n.nm,x:n.x,y:n.y,col:n.col,dk:n.dk,icon:n.icon};}),
  dungeonEntrances:dungeonEntrances.map(function(d){return{x:d.x,y:d.y,biome:d.biome};}),
  noiseSeed:noiseSeed}};
```

`netApplyWorldInit(d)` (L1512) assigns `noiseSeed`, clears `biomeCache`, and rebuilds `obstacles`, `spawners`, `cages`, `npcs` and `dungeonEntrances` as real instances — so guests regenerate identical biome colouring from the seed but receive prop positions verbatim. Guest NPCs get an empty `dlg` array (dialogue is host-side only).

### 19.6 Guest responsibilities

`guestSendInput(dt)` (L9153):

```js
guestInputTimer+=dt;if(guestInputTimer<NET.SEND_RATE)return;guestInputTimer=0;
var myHero=NET.guestHeroes[NET.playerId];
var input={type:'input',
  keys:{w:keys.w||keys.arrowup,s:keys.s||keys.arrowdown,a:keys.a||keys.arrowleft,d:keys.d||keys.arrowright},
  click:pendingClick||null,q:keys.q?true:false,ult:keys.r||keys['0']?true:false,
  interact:keys[' ']?true:false,sig:keys.e?true:false,
  heroIdx:myHero!==undefined?myHero:-1};
try{NET.ws.send(JSON.stringify(input));}catch(e){}
pendingClick=null;
NET.pingTimer+=dt;if(NET.pingTimer>=2){NET.pingTimer=0;NET.lastPingT=performance.now();
  try{NET.ws.send(JSON.stringify({type:'ping',t:NET.lastPingT}));}catch(e){}}
```

Note the guest input payload uses **hard-coded key names**, not `keyBinds` — guest rebinding of movement/ult/interact/signature has no effect.

Guests may locally toggle: control mode (`c`), mute (`m`), bestiary (`b`), skill tree (`t`), quest journal (`j`), inventory (`i`), and request a hero switch with `1`–`4`. Every other key is blocked (L936–L946).

**Interpolation** (`getInterpolatedSnapshot`, L8829):

```js
var renderT=performance.now()-NET.interpDelay;
... find a,b bracketing renderT by _localT ...
var t=range>0?clamp((renderT-a._localT)/range,0,1.2):1;
return{snap:b,t:t,interpA:a,interpB:b};
```

Rendering runs **50 ms behind** server time; hero and entity positions are lerped between the two bracketing snapshots (extrapolating up to `t = 1.2` when the buffer is starved). Only `x`/`y` are interpolated — everything else is taken from the newer snapshot.

`guestGameLoop(time)` (L8797) computes its own `gdt` (clamped to 0.05), advances `gt`, applies the interpolated snapshot, maintains projectile trails locally (6 samples), updates dungeon atmosphere or overworld weather particles client-side, animates dungeon object timers, and finally calls `guestSendInput(gdt)`.

`drawNetHUD()` (L9168) shows `🌐 <room> · <N>P` top-right with a connection dot: green `< 50 ms`, amber `50–150 ms`, red above.

### 19.7 Co-op abilities (L1378–L1408)

```js
var COOP_ABILITIES=[
  {nm:'Rally Cry',cd:30,dur:8,desc:'Allies +30% DMG',col:'#4A9ED8'},
  {nm:"Hunter's Mark",cd:25,dur:6,desc:'Enemy +50% DMG taken',col:'#3DCC7A'},
  {nm:'Arcane Link',cd:28,dur:10,desc:'Heal ally 25% of magic DMG',col:'#A862C4'},
  {nm:'Shadow Step',cd:20,dur:0,desc:'Teleport to ally + invuln',col:'#D88030'}];
```

| Index | Hero | Name | Cooldown | Duration | Effect (`activateCoopAbility`, L1383) |
|---|---|---|---|---|---|
| 0 | Liam | Rally Cry | 30 s | 8 s | every other living hero within **200 px** gets `dmgBuff = 1.3`; `snd('achieve',0.4)`; 12-particle ring at 120 px/s in `#4A9ED8` |
| 1 | Noah | Hunter's Mark | 25 s | 6 s | nearest living enemy within **300 px** gets `marked = 6`; `snd('arrow',0.3)` |
| 2 | Collette | Arcane Link | 28 s | 10 s | nearest other living hero within **250 px** becomes `coopTarget`; `snd('magic',0.3)` |
| 3 | Isabella | Shadow Step | 20 s | 0 | teleports to the nearest living ally (no range limit), granting **both** `shieldOn = 1.5`; 8 smoke particles at each end; `snd('portal',0.4)` |

Gate: `if(NET.playerCount<=1||hero.coopCd>0)return;` — co-op abilities are **multiplayer-only** and are bound to the hero *index*, not to whoever is controlling that hero. Triggered by `q` (which is also the combo-ult key locally; the guest path sends `q` and the host routes it to `activateCoopAbility`).

### 19.8 Guest restrictions summary

| Capability | Host | Guest |
|---|---|---|
| Run simulation | ✔ | ✘ (renders snapshots) |
| Move / attack / ult / signature / interact | ✔ | via `input` messages |
| Switch hero freely | ✔ | request only, host may refuse |
| Enter a dungeon | ✔ | ✘ (joining mid-dungeon is refused: `'Game is in a dungeon'`) |
| Open skill tree / inventory / bestiary / journal | ✔ | ✔ (local UI only) |
| Pause the game | ✔ | ✘ (sees `guestPauseOverlay` when the host pauses) |
| Pick a level-up card | ✔ | votes via `lvlVote`; the host decides |
| Save / load | ✔ | ✘ |

---

## 20. Dev Console & Scenarios

**Legacy lines:** L9518–L9899, wrapped in an IIFE. Opened with **Ctrl+Shift+D**.

```js
var devOpen=false,devGod=false,devEl=null;
function devEnsureReady(){
  if(state!=='playing'){announce('Start a game first!','#D84830',2);return false;}
  return true;
}
```

Every scenario calls `devEnsureReady()` first. The panel is a fixed, centred `rgba(0,0,0,0.95)` box with a 2 px `#E8A838` border, `z-index: 99999`, `max-height: 80vh`, scrollable.

### 20.1 Quick tools

| Button | Function | Effect |
|---|---|---|
| `God Mode ON/OFF` | `devToggleGod()` | toggles `devGod`; `Hero.prototype.takeDmg` is monkey-patched at L9896 to return `0` while on |
| `Heal All` | `devHealAll()` | full HP, clears `dead`/`downed`/`deathA`/`_caged` on all unlocked heroes |
| `Kill Boss` | `devKillBoss()` | kills `dungeonBoss` in a dungeon, else the overworld `boss` (also sets `bossDefeated`, `bossUp=false`) |
| `Unlock All` | `devUnlockAll()` | unlocks and revives all 4 heroes, `sibs = 3`, rebuilds the portrait strip |
| `Lv 5` / `Lv 10` / `Lv 20` | `devSetLv(n)` | `teamLv = n`; per hero `maxHp = HDEFS[i].hp + n*12`, `dmg = HDEFS[i].dmg + n*3`, full heal |
| `+1000 Gold` | inline | `gold += 1000` |
| `Boss 75/50/25/10%` | `devSetBossHP(pct)` | sets the active boss to `max(1, floor(maxHp*pct))` |

### 20.2 v26 boss scenarios

| Button | Function | Setup |
|---|---|---|
| `P1 Kid Snatch` | `devGoblinKing(1)` | unlock all, Lv 10, exit any dungeon, all 5 dungeons marked cleared, clear arena effects/enemies/projs/parts, `bossUp = true`, `boss = new Boss(WW/2, WH*0.3)`, heroes at `(WW/2 ±80, WH*0.6 ±30)`, camera on the boss, `boss.phase = 1`, full HP |
| `P2 Weakened` | `devGoblinKing(2)` | as above but `boss.hp = 45% maxHp`, `phase = 1` (transitions on the next tick) |
| `P3 Berserk` | `devGoblinKing(3)` | `boss.hp = 20% maxHp`, `phase = 2` |
| `P1 Vines` | `devDungeonBoss('forest',1)` | see below |
| `P2 Planted` | `devForestPlanted()` | `devDungeonBoss('forest',2)` then, after 500 ms, `hp = 55% maxHp` and `announce('DEV: Treant will plant at 60% — chip down!','#58B888',3)` |
| `P3 Uprooted` | `devDungeonBoss('forest',3)` | HP set to 25% |
| `P1 Teleport` | `devDungeonBoss('desert',1)` | — |
| `P2 Cocoon` | `devDesertCocoon()` | `devDungeonBoss('desert',2)` then `hp = 48% maxHp` with the hint `'DEV: Cocoon will trigger at 50% — chip boss down!'` |
| `P3 Phantoms` | `devDesertPhantoms()` | `devDungeonBoss('desert',3)` then `hp = 22% maxHp`, `announce('DEV: Phantom Split phase!')` |
| `Cave Boss` | `devDungeonBoss('cave',1)` | — |
| `Swamp Boss` | `devDungeonBoss('swamp',1)` | — |
| `Frozen Boss` | `devDungeonBoss('frozen',1)` | — |

`devDungeonBoss(biome, phase)` (L9566):

```js
devUnlockAll();devSetLv(8);
if(inDungeon){ ...clean exit... }
dungeonEntrySnapshot=serializeOverworldState();
inDungeon=true;currentDungeon=biome;dungeonXPGained=0;resetHeroStats();
clearArenaEffects();enemies.length=0;projs.length=0;parts.length=0;boss=null;bossUp=false;
initDungeon(biome);
// find the boss room, mark every other room cleared, keys=5, loadDungeonRoom(bossIdx)
var hpPcts={1:1.0, 2:0.55, 3:0.22};
if(biome==='forest'){hpPcts={1:1.0, 2:0.55, 3:0.25};}
if(biome==='desert'){hpPcts={1:1.0, 2:0.45, 3:0.20};}
dungeonBoss.hp=Math.max(1,Math.floor(dungeonBoss.maxHp*targetPct));
dungeonBoss.introPhase=null;dungeonBoss.introT=0;dungeonBoss.y=120;dungeonCinematicActive=false;
```

It sets Lv 8, snapshots the overworld so a normal exit still works, marks every non-boss room cleared, grants 5 keys, warps straight into the boss room, and skips the intro cinematic.

Phase HP thresholds used by the scenarios:

| Biome | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| default (cave/swamp/frozen/volcanic) | 100% | 55% | 22% |
| forest | 100% | 55% | 25% |
| desert | 100% | 45% | 20% |

### 20.3 Teleport

| Button | `devTeleport(id)` | Destination |
|---|---|---|
| `Spawn` | 0 | `(WW/2, WH/2)` |
| `Crater` | 1 | `(ALIEN_CRATER.x, ALIEN_CRATER.y - 50)` |
| `Ed` | 2 | Ed's current position `+50 y`, or `ED_LANDING + 50 y` if he has not spawned |
| `Portal` | 3 | `(portalX, portalY - 50)` — only when `portalOpen`, else `'Target not available'` |
| `▶ Meteor` | inline | `devClose(); triggerMeteorCutscene()` |

`devTeleport` force-exits any dungeon first and snaps the camera to the destination.

### 20.4 v27 gear-system tools

| Button | Function | Effect |
|---|---|---|
| `Open Inventory` | `toggleInventory(); devClose()` | — |
| `+5 Random` | `devRandomGear(5)` | 5 random `GEAR_DB` keys at `rollRarity(0)` into the stash |
| `+20 Fill Stash` | `devRandomGear(20)` | same, 20 items |
| `Clear Stash` | `devClearStash()` | `stash.length = 0` |
| `All Rarities` | `devSpawnGear()` | one item per entry in `RARITIES`, cycling `GEAR_DB` keys |
| `5 Common/Rare/Epic` | `devGearByRarity(rar,5)` | 5 random items forced to that rarity |
| `All Legendary` | `devSpawnLegendaries()` | `leg_liam`, `leg_noah`, `leg_collette`, `leg_isabella` at `legendary` |
| `🔥 Flame` … `🗡 Sword` | `devEquipWeapon(key,rar)` | equips the named weapon on the active hero (old weapon to stash), sets `wVis`, `recalcHeroStats`. Keys: `w_flame`(epic), `w_frost`(epic), `w_shadow`(epic), `w_quiver`(rare), `w_staff`(epic), `w_hammer`(rare), `w_sword`(common) |
| `▶ Full Loadout` | `devFullLoadout()` | every unlocked hero gets an epic weapon (`w_flame/w_quiver/w_staff/w_hammer` by index), rare armor (`a_plate/a_chain/a_shield/a_mage`) and rare accessory (`x_boots/x_fang/x_orb/x_drum`); previous gear to stash |
| `▶ Stash Overflow` | `devStashOverflow()` | fills the stash to `STASH_MAX` then drops 3 epic items near the hero to exercise overflow handling |
| `▶ Drop Frenzy` | `devDropFrenzy()` | 15 gear drops at `hero ± rnd(-120,120)` with `rollRarity(2)` |
| `▶ Save Round-trip` | `devSaveRoundTrip()` | snapshots all four heroes' gear keys and stash length, runs `buildSaveData() → JSON → applyLoadData()`, then diffs; announces PASS or the specific mismatch |
| `▶ Strip All Gear` | `devStripAllGear()` | moves every equipped item to the stash, resets `wVis`, recalculates stats |
| `▶ Stat Audit` | `devStatAudit()` | measures `hp/dmg/spd/rng/cd` with and without gear, prints a per-stat delta table to the console and announces the DMG summary |

### 20.5 In-game DEV_MODE hotkeys (separate from the console)

`DEV_MODE` is toggled by **F2** or by tapping `#verLabel` five times within 2 s on the title screen (L9435). While on, the HUD shows `🔧 DEV`, `initGame()` unlocks everything, and:

| Key | Requires | Effect |
|---|---|---|
| `` ` `` | in a dungeon, not paused | kills every dungeon enemy (awarding XP + kill stats), kills the boss, solves the puzzle, unlocks all doors, marks the room cleared, `snd('puzzle_solve',0.4)` |
| `F6` | overworld | if the plane is airborne, drop `rnd(2,5)` crates; else launch a supply flyover from the camera |
| `F7` | overworld, Ed not yet spawned | force a crash approach: `biplane` set active at `(cam.x-60, cam.y+H*0.4)` with `vx=100`, `alt=150`, `event='crash'` |
| `F8` | overworld | advance to the next `WEATHER_TYPES` entry, `timer = rnd(20,40)`, storm re-arms `strikeT = rnd(4,8)` |
| `F10` | overworld, no cutscene | `triggerMeteorCutscene()` |
| `F9` | always (not DEV-gated) | console diagnostic dump: hero/level/HP, biome at camera centre, `dayTime`, `crashReady`, `crashReadyTimer`, `flyoverCount`, `hasCrashed`, `edMet`, `edQuestPhase`, `betterDrops`, crate count, `biplaneActive`, `DEV_MODE`, enemy count |

`drawPerfOverlay(ms)` is drawn every frame while `DEV_MODE` is on (L9243).

---

## 21. Gaps, Oddities & Dead Code

Things a porter must decide about deliberately, all verified against the source:

| # | Finding | Line(s) |
|---|---|---|
| 1 | **`spawnEscortNPC()` never fires.** It searches for an NPC named `'Bog Witch'`, which is not in `NPC_DEFS` (the swamp NPC is `Mistweaver Fern`), so quest `swamp_2` ("Escort the frog familiar to safety") can be accepted but never progressed. | L8351, L626 |
| 2 | **`spawnQuestWaypoints()` looks for `'Sand Nomad'`**, also absent, but falls back to `(WW*0.78, WH*0.22)` so `desert_2` still works. | L8354 |
| 3 | **`DIALOGUE.grandpaEd.crater_hint` does not exist** although `edInteract()` opens it. `openDialogue` returns silently, so that branch is a dead end and the player sees nothing. | L8406, L754 |
| 4 | **`DIALOGUE.grandpaEd.crash_landing` has no call site.** Four canon lines are unreachable. | L783 |
| 5 | **Most `HERO_REACTIONS` contexts are unreachable**: only `quest_intro`, `space_hint`, `crater` and `ed_crater` are ever requested. `crash_landing`, `dungeon_enter`, `boss_appear`, `sibling`, `swamp_item`, `mid_boss`, `victory`, `snack_reward`, `following_collette` are all orphaned canon. | L799–L802 |
| 6 | **`METEOR_CUTSCENE_PLAYED` is never read or written.** The cutscene is gated on `storyFlags.meteorSeen` instead. | L725 |
| 7 | **`storyFlags` reset in `initGame()` omits `meteorSeen`, `craterVisited` and `edCraterDialogue`**, so those persist across a restart within the same page load — a second playthrough will skip the meteor cutscene. | L8272 vs L749 |
| 8 | **`storyFlags.edSpaceHints` is never incremented.** | L749 |
| 9 | **`DOOR_CLOSED` (1) is never assigned.** Only OPEN/LOCKED/BARRED are used. | L841 |
| 10 | **`V7T.puz` is never referenced** and **`V7T.bossv7` is `null`**, so boss rooms always fall back to `ROOM_TEMPLATES.boss`. | L6739–L6744, L7198 |
| 11 | **`DUNGEON_LAYOUTS` is only used for its first entry's `lore` string.** The 6-room sequences are entirely superseded by the procedural generator. | L6755, L7157 |
| 12 | **`CITADEL_FLOORS[].rooms`, `.hazard` and `.miniBoss` are never read.** Only `.biome` and `.enemyScale` are consumed; the Stone Sentinel and Phantom Warden mini-bosses never spawn. | L820–L826, L7370 |
| 13 | **Citadel floors get no biome hazards**, because `loadDungeonRoom` switches on `currentDungeon` (`citadel_f1..3`), which matches none of the hazard branches. The Citadel's own floor hazards (§11.7 step 12) cover floors 1 and 2 only; floor 3 has none. | L7293–L7299, L8165 |
| 14 | **`FAMILY_NPC_DEFS` is data-only** — `spawnEd()` hard-codes the same values and nothing reads the table. `despawnEd()` is never called. | L633, L8390–L8391 |
| 15 | **`abilityVFX` has no cap**, unlike `parts` (250), `projs` (150), `weatherP` (80) and `arenaEffects` (8). | L1747 |
| 16 | **Array truncation keeps the oldest entries.** `parts.length = MAX_PARTICLES` discards the *newest* particles, so under load the visible effects are the stale ones. | L9282, L1639 |
| 17 | **`Part.fric` and several timers are frame-rate dependent** (`fric` is applied per frame, not `dt`-scaled; `drawVignette`, `weather.flashT`, `TUTORIAL_STEPS[6]` and `drawBossBar` use hard-coded `1/60`; the Shadow Queen is updated with `update(1/60)` instead of `dt`). | L1727, L3361, L1645, L4321, L3369, L9333 |
| 18 | **The touch `tapAttack` handler does not un-zoom coordinates** the way the mouse handler does, so tap-to-attack aims incorrectly at `WORLD_ZOOM ≠ 1`. | L1103–L1117 vs L1067 |
| 19 | **Guest input ignores `keyBinds`** — `guestSendInput` reads `keys.w/a/s/d/q/r/0/e/' '` directly, so guests cannot rebind. | L9157 |
| 20 | **Only three of the five world events count toward `survive_event`.** `caravan` and `treasure` never call `updateQuestProgress`, so quest `desert_1` only advances on bloodmoon/spring/earthquake. | L6295–L6334 |
| 21 | **NPC greeting rotation is inert.** `npc.dlgIdx` is set to `0` on first visit and never incremented, so every biome NPC only ever shows `dlg[0]`. | L8447, L8353 |
| 22 | **Portrait `mood` is accepted but effectively ignored** — `drawPortrait` only branches on `happy`/`wink`, and `drawDialogueBox` always passes `'happy'`. Every canon mood tag is currently unused. | L807, L806 |
| 23 | **Nothing but the biome noise is seeded.** Reloading a save re-rolls obstacle scatter, NPC positions, secrets, bounties and dungeon layouts. | L1521, §1.1 |
| 24 | **No gamepad support** anywhere in the file. | — |
| 25 | **`spawnPortal()` is called only from the Goblin King death path** (L3231, 3 s + 2 s after death), so the Shadow Realm is unreachable until the Goblin King is beaten. | L3231, L5714 |
| 26 | **The `puz` and `treas` structural templates carry east/west doors (`4`/`5`) baked in**, but `injectDoors9` rewrites all eight door tiles anyway, so the baked values never matter. | L6740–L6742, L7138 |

---

*End of Part 2. Heroes, abilities, combo ultimates, XP/leveling, skill trees, enemies, boss phase system, `BOSS_BLOCKS`, each boss, combat formulas, equipment/gear, loot, merchant economy, bounty rewards, `NG_SCALE`, achievements and the save schema are covered in Part 1.*
