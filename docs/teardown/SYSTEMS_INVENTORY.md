# Systems Inventory — Part 1: Core Gameplay Data & Formulas

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
