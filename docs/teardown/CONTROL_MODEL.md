# CONTROL_MODEL — how the Stewart Squad is controlled in v27

You drive **one** of four heroes at a time (`activeHero`, L5371); the other three are AI companions that leash to you, pick their own targets and auto-attack, and you hot-swap between them with `1`–`4` or by clicking a portrait — swapping is instant, free, and carries the camera with it.
Attacks fire themselves whenever an enemy is in range (`controlMode` `hybrid`, the default, L5373); the mouse/tap only overrides the *direction*, and the only "aimed" inputs are the click-attack, the four signature moves, the four ultimates, and the six paired combo ultimates.

Source of truth: `docs/legacy/stewart-squad-v27.html` (9,901 lines). Every line number below was verified with `grep -n` / `sed -n` against that file.

---

## Table of contents

1. [Input layer](#1-input-layer)
2. [Active hero model](#2-active-hero-model)
3. [Companion AI](#3-companion-ai)
4. [Movement & camera](#4-movement--camera)
5. [Combat controls](#5-combat-controls)
6. [Combo ultimates](#6-combo-ultimates)
7. [Downed, revive, caged, banished, game over](#7-downed-revive-caged-banished-game-over)
8. [Multiplayer control (host / guest)](#8-multiplayer-control-host--guest)
9. [Menus, pause and focus](#9-menus-pause-and-focus)
10. [Dev console and debug controls](#10-dev-console-and-debug-controls)
11. [Known quirks and bugs in the v27 control model](#11-known-quirks-and-bugs-in-the-v27-control-model)
12. [Recommendation for 3D](#12-recommendation-for-3d)

---

## 1. Input layer

Banner: `// ===== INPUT =====` at **L921**. Everything below lives between L921 and L1121.

### 1.1 Global input state

| Var | Line | Value / shape | Notes |
|---|---|---|---|
| `keys` | L922 | `{}` | `keys[e.key.toLowerCase()] = true/false`. Set on `keydown` (L929), cleared on `keyup` (L1035). Never cleared on blur — a key held while tabbing out stays "down". |
| `mx, my` | L922 | numbers | Raw `clientX/clientY` from `mousemove` (L1036). Screen space, **not** un-zoomed. |
| `mw` | L922 | `{x,y}` | World-space mouse, recomputed per frame in `Hero.prototype.update` only in `classic` mode (L2297). |
| `joy` | L923 | `{on,sx,sy,dx,dy,mag,id}` | Virtual joystick. `dx/dy` normalised to −1..1, `mag` 0..1. |
| `touchState` | L925 | `{joy, atkBtn, ultBtn, interactBtn}` | Virtual button state; each button `{on,x,y,r}`. |
| `W, H` | L519 | `window.innerWidth/Height` | Canvas is full-window; no fixed logical resolution. |
| `isMob` | L614 | `/Android\|iPhone\|iPad\|iPod\|webOS/i.test(navigator.userAgent)` | Gates the v21.5 virtual buttons. |
| `isMobile` | L8102 | `('ontouchstart' in window)` | A *second*, different mobile test used only by the legacy dungeon buttons. |

### 1.2 `keyBinds` and `DEFAULT_KEYBINDS`

`keyBinds` — **L605**. `DEFAULT_KEYBINDS = JSON.parse(JSON.stringify(keyBinds))` — **L606**.

| Action | Default keys | What it does | Handler |
|---|---|---|---|
| `moveUp` | `w`, `arrowup` | −Y | L1119 `getInput()` |
| `moveDown` | `s`, `arrowdown` | +Y | L1119 |
| `moveLeft` | `a`, `arrowleft` | −X | L1119 |
| `moveRight` | `d`, `arrowright` | +X | L1119 |
| `hero1`..`hero4` | `1`,`2`,`3`,`4` | Switch active hero | L956–957 |
| `interact` | `' '` (Space) | Context interact; **falls through to `trigUlt()`** if nothing is nearby | L971 |
| `ultimate` | `r`, `0` | Ultimate | L972 |
| `signature` | `e` | Signature ability | L973 |
| `comboUlt` | `q` | Combo ultimate | L959 |
| `bestiary` | `b` | Toggle bestiary (does **not** pause) | L966 |
| `questJournal` | `j` | Toggle quest journal (pauses) | L967 |
| `compass` | `g` | Toggle quest compass | L960 |
| `pause` | `escape`, `p` | Pause / close settings / cancel dungeon-entry prompt | L949–953 |
| `skillTree` | `t` | Toggle skill tree (pauses) | L947 |
| `inventory` | `i` | Toggle inventory (pauses) | L948 |
| `controlMode` | `c` | Cycle `classic → hybrid → manual → classic` | L958 |
| `mute` | `m` | Toggle music | L961 |

`keyAction(action,k)` (L610) is a simple `indexOf` on the bound array.

**Not remappable, hard-coded keys:**

| Key | Effect | Line |
|---|---|---|
| Space / Enter | Skip cutscene (checked before everything else) | L931 |
| `` ` `` | Toggle `showNetDebug` (guest net overlay) | L932 |
| `` ` `` | DEV: clear current dungeon room (only when `DEV_MODE && inDungeon && !paused`) | L975 |
| `1`/`2`/`3`/`4` | Pick a level-up card when `showLvl` | L1034 |
| `F2` | Toggle `DEV_MODE` | L963 |
| `F6` `F7` `F8` `F9` `F10` | Dev tools (see §10) | L989, L1001, L1014, L1024, L1019 |
| `Ctrl+Shift+D` | Open/close the dev console | L9893 |
| `Escape` | Cancel an in-progress key rebind | L4304 |

**Handler precedence** (top to bottom in the single `keydown` listener, L928): cutscene skip → net-debug backtick → *guest early-return branch* (L934–946) → skill tree → inventory → pause → hero switch → control mode → combo ult → compass → mute → F2 → bestiary → quest journal → `preventDefault` for arrows/space (L968) → host-only block (interact, ultimate, signature, dev keys) → level-up card select. Most handlers `return`, so bindings are mutually exclusive by order.

`preventDefault` is only applied to `arrowup/down/left/right` and space (L935 for guests, L968 for host) — everything else lets the browser default through.

### 1.3 Key remapping UI and storage

- UI: `showSettingsUI()` **L4288**, "CONTROLS" section built at **L4297–4298**.
- Rebindable actions (**L4297**, 12 of them): Move Up, Move Down, Move Left, Move Right, Interact, Ultimate, Signature, Combo Ult, Hero 1, Hero 2, Hero 3, Hero 4. **Bestiary, journal, compass, pause, skill tree, inventory, control mode and mute are shown nowhere and cannot be rebound.**
- Flow (**L4304**): click the button → label becomes `Press key...`, background `#D88030` → a capture-phase `keydown` listener takes the next key → `keyBinds[act]=[nk]` (**single key — the second default binding is destroyed**) → `saveKeyBinds()` → UI rebuilds. `Escape` aborts.
- Reset: `resetKeyBinds()` (L609) via the `Reset to Defaults` button (L4299).
- Storage: `localStorage['ssq_keybinds']` — `saveKeyBinds` L607, `loadKeyBinds` L608. Settings live separately in `localStorage['ssq_settings']` (L595–596).

### 1.4 Settings that affect control/feel

`settings` — **L594**:

```js
var settings={screenShake:true,hitStop:true,particleDensity:'high',autoAim:true,
  showTutorial:true,showDmgNumbers:true,showMinimap:true,worldZoom:'1.30'};
```

Exposed in the settings overlay at **L4290**. `worldZoom` options are `'1.0' | '1.15' | '1.30'` and write `WORLD_ZOOM` (L596).

> `autoAim` is a **dead setting** — it appears at L594 and L4290 and is read nowhere else in the file. Auto-aim is unconditional (see §5.2).

### 1.5 Control modes

`controlMode` — **L5373**, default `'hybrid'`. Cycled with `C` (L958): `classic → hybrid → manual → classic`. Shown in the HUD as `document.getElementById('hudMode')` (L3723, element L378).

| Mode | Facing | Attack trigger |
|---|---|---|
| `classic` | Hero faces the **mouse** every frame (L2297) | Auto-attack only (L2316) |
| `hybrid` (default) | Faces movement direction, or the click angle while `forceAtk` is set (L2299–2301) | Auto-attack **plus** click/tap to attack in a chosen direction (L1074) |
| `manual` | Same as hybrid | **Click/tap only** — auto-attack is disabled for the active hero (`controlMode!=='manual'||idx!==activeHero`, L2316). Companions still auto-attack. |

Guests can only toggle `classic ↔ hybrid` (L937) — they never reach `manual`.

### 1.6 Mouse

| Input | Effect | Line |
|---|---|---|
| Move | Stores `mx,my`; used for `classic` facing | L1036, L2297 |
| Click on quest tracker (`W-140, 142, 130×42`) | Cycle `questTrackerIdx` | L1039 |
| Click on hero portrait strip (`y<55`, `x` in `10+i*50 … +42`) | Switch active hero, `snd('hit',0.15)` | L1065–1072 |
| Click anywhere else (`hybrid`/`manual`) | Set `ah.forceAtkAngle` + `ah.forceAtk=true` | L1074–1081 |
| Click on a level-up card | `selUp(i)` via `clickCard` (card geometry: `cw=185, ch=245, gap=24`, `cardTop=H*0.18+50`) | L1082, L1120 |
| Click after game over / victory | `initGame()` — restart | L9432 |
| Any click | `initAudio()` (Web Audio unlock gesture) | L1082 |

There is **no click-to-move**. World position of a click:

```js
// overworld
var _uz2=unzoomScreenPoint(e.clientX,e.clientY); wx=_uz2.x+cam.x; wy=_uz2.y+cam.y;
// dungeon (room is centred, not camera-scrolled)
var dox9c=Math.floor((W-DNG_COLS*DNG_TW)/2), doy9c=Math.floor((H-DNG_ROWS*DNG_TW)/2);
var _uz=unzoomScreenPoint(e.clientX,e.clientY); wx=_uz.x-dox9c; wy=_uz.y-doy9c;
ah.forceAtkAngle=Math.atan2(wy-ah.y,wx-ah.x); ah.forceAtk=true;   // L1077-1080
```

`unzoomScreenPoint(sx,sy) = {x:(sx-W/2)/WORLD_ZOOM+W/2, y:(sy-H/2)/WORLD_ZOOM+H/2}` — **L592**.

### 1.7 Touch

Two overlapping touch systems exist; both are live.

**A. v21.5 virtual buttons + joystick** (`isMob` only), laid out by `layoutTouchButtons()` — **L926**:

```js
function layoutTouchButtons(){var bx=W-65,by=H-85;
  touchState.atkBtn     ={on:false,x:bx,    y:by,    r:30};
  touchState.ultBtn     ={on:false,x:bx-70, y:by,    r:25};
  touchState.interactBtn={on:false,x:bx,    y:by-70, r:25};}
```

| Button | Centre | Radius | Hit radius | Label / colour | Action |
|---|---|---|---|---|---|
| ATK | `(W-65, H-85)` | 30 | 40 | `ATK` / `#D84830` | `forceAtk` toward the touch point (L1086) |
| ULT | `(W-135, H-85)` | 25 | 35 | `ULT` / `#E8A838` | `trigUlt()` (host only) (L1087) |
| ACT | `(W-65, H-155)` | 25 | 35 | `ACT` / `#4A9ED8` | dialogue advance → Ed → dungeon interact → merchant → bounty board (L1088) |

Hit test `touchInBtn` (**L927**) is `hypot(dx,dy) <= r+10` — i.e. a 10 px forgiveness pad, giving 80 px and 70 px effective diameters. Drawn by `drawTouchButtons()` (**L3632**) at alpha `0.3` idle / `0.6` pressed, white 2 px ring, `bold 11px sans-serif` label. All three release on `touchend` (L1095).

**Virtual joystick** (L1091–1094):

- Claimed by the first touch with `clientX < W*0.5` — the whole left half of the screen, floating origin at the touch point.
- Radius `R = 60` px; `joy.dx/dy = clamped delta / 60`, `joy.mag = min(dist,60)/60`.
- **Dead zone: `joy.mag > .15`** in `getInput()` (L1119) — below that, keyboard input wins and the stick is ignored.
- Drawn by `drawJoystick()` (**L3630**): active → outer ring r55 at the touch origin, knob r22 at `dx*55`, alpha `.35`. Idle on mobile → a ghost stick at `(90, H-110)`, ring r55, knob r20, alpha `.15`. Note the **drawn radius (55) does not match the input radius (60)**.
- Touches on the right half set `mx,my` (L1091), which is what makes `classic` aiming work on a tablet.

**B. Legacy (v7.1) touch handler** — a *second* `touchstart` listener (`tapAttack`, `{passive:true}`) at **L1096–1118**, which runs in addition to A:

- Skips the region `clientX < W*0.35 && clientY > H*0.55` (a different joystick zone from A's `W*0.5`).
- Dungeon interact hot-rect: `x > W-80, H-165 < y < H-120` → `heroInteract()` (L1101).
- Ultimate hot-rect: `x > W-80, H-215 < y < H-170` → `trigUlt()` (L1103).
- Portrait tap `y<55` → switch hero (L1108).
- Otherwise tap-to-attack in `hybrid`/`manual` (L1110–1116).

The matching visuals for B are drawn only inside `renderDungeon` (**L8102–8108**): a `55×40` rounded ULT button at `(W-70, H-210)` and, in a dungeon, a `55×40` ACT button at `(W-70, H-160)`. So on a phone in a dungeon the player sees **two** ult buttons in slightly different places.

Portrait strip tap target: `y < 55`, `x` from `10+i*50` to `+42` — a **42×55 px** target, below the 44 px guideline in one axis.

### 1.8 Gamepad

**None.** There is no `navigator.getGamepads`, no `gamepadconnected` listener, and no gamepad axis/button code anywhere in the file (verified by case-insensitive grep for `gamepad`). Gamepad support is a §6 brief requirement with no legacy behaviour to port.

### 1.9 Hold vs tap, and input buffering

- **Movement is hold-based** and polled: `getInput()` (**L1119**) reads `keys[...]` fresh every frame.
- **Everything else is edge/tap-based**: it fires inside the `keydown` handler. Because there is no auto-repeat guard, holding `E`, `R` or `Q` down *will* refire on the browser's key-repeat — the cooldown checks inside `trigUlt` (L2665), `activateSignature` (L2666) and `getComboUlt` (L2636) are the only thing preventing spam.
- **There is no input buffer.** A click while `atkT > 0` is not queued: `forceAtk` is a single boolean latched on the hero (L1080) and consumed only when `this.atkT<=0` (L2313). Press attack during the recovery of the previous swing and the input is silently dropped unless it happens to still be latched when the cooldown expires — so it behaves as a *one-slot latch*, not a queue, and it also has no expiry.
- Diagonal input is normalised in `getInput()`: `if(m>1){ix/=m;iy/=m;}` — note the guard is `> 1`, so a joystick already inside the unit circle is left alone.

```js
function getInput(){var ix=0,iy=0;
  if(keyBinds.moveUp.some(function(k){return keys[k];}))iy=-1;
  if(keyBinds.moveDown.some(function(k){return keys[k];}))iy=1;
  if(keyBinds.moveLeft.some(function(k){return keys[k];}))ix=-1;
  if(keyBinds.moveRight.some(function(k){return keys[k];}))ix=1;
  if(joy.on&&joy.mag>.15){ix=joy.dx;iy=joy.dy;}
  var m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}return{x:ix,y:iy};}   // L1119
```

---

## 2. Active hero model

`let activeHero=0; // index of player-controlled hero` — **L5371**. Reset to `0` in `initGame()` (L8261).

### 2.1 How the player switches

| Path | Guard | Line |
|---|---|---|
| Keys `1`–`4` | `!showLvl` and target `unlocked && !dead && !downed && !banished && !_caged`; blocked if `NET.role==='host' && isGuestControlled(idx)` | L956–957 |
| Click a portrait (canvas hit-test, `y<55`) | `unlocked && !dead && !banished`, then `!dead && !downed`; blocked if guest-controlled | L1065–1072 |
| Click a portrait (HTML `.hud-port`, the real DOM strip) | `NET.role!=='guest'` and `unlocked && !dead && !downed` | L3666 |
| Tap a portrait (touch, handler A) | `unlocked && !dead` only — **does not check `downed`, `banished` or `_caged`** | L1090 |
| Tap a portrait (touch, handler B) | `unlocked && !dead && !downed && !banished` | L1108 |
| Automatic — active hero goes down | Switch to nearest alive, non-guest-controlled hero + camera snap | L2388–2401 |
| Automatic — a hero revives while the host's current hero is dead/downed/guest-owned | `activeHero=idx` + camera snap | L2198–2204 |
| Load / dungeon snapshot | `activeHero=data.activeHero||0` (L1259), `activeHero=snap.activeHero` (L7064) | — |

**There is no switch cooldown, no switch animation, and no swap VFX.** `activeHero=hi4` is a bare assignment. The only feedback is `snd('hit',0.15)` on the mouse/tap paths (L1071, L1090) — the keyboard path is silent. `tutorial._switched=true` is set on most paths (L957, L1090) to advance tutorial step 4 (L4318).

**What carries over on a switch:** everything. All four heroes are simulated every frame in the same array with the same stats, gear, cooldowns, ult charge and HP (L9267–9269). Switching swaps *only* which hero reads `inp` and which hero the camera follows. Cooldowns keep ticking on the hero you left; ult charge is per-hero (`ultTimer`, L2213) and continues charging while a hero is a companion.

### 2.2 What "active" changes

| System | Effect of being active | Line |
|---|---|---|
| Movement | Only the active hero receives `inp`; all others get `{x:0,y:0}` | L9269, L8123 |
| Facing | Active hero faces mouse (`classic`) or velocity/attack angle (`hybrid`/`manual`); companions face their nearest target (`if(idx>0&&near)this.face=ang(this,near)`) | L2296–2303, L2312 |
| Camera | `cam` lerps toward `heroes[activeHero]` | L9270 |
| Fog of war / visibility | Fog circle and enemy culling are centred on the active hero (`FOG_R=320*nightFogMul()`) | L3331, L9340 |
| Minimap centre | `h0=heroes[activeHero]` | L3298 |
| Ambient music biome | `startBGM9(getBiome(h0.x,h0.y))` from active hero | L8529, L9468 |
| HUD | Big HP bar, XP bar, name, signature button, ultimate-ready banner all read `myHeroIdx()` | L3679–3719 |
| Portrait strip | `.hud-port.active` gets `border-color:var(--gold); box-shadow:0 0 12px var(--gold-glow)` | CSS L83, applied L3657/L3729 |
| Interaction | `heroInteract()`, `npcQuestInteract()`, merchant/bounty/Ed proximity all use `heroes[activeHero]` | L971, L7318, L8357 |
| Ability-gated dungeon rooms | The **active** hero must be the right one — `cracked_wall` needs LIAM, `target_switch` needs NOAH, etc. Otherwise `'This requires LIAM's ability!'` | L7328–7329 |
| Ultimate / signature / combo | All read `heroes[activeHero]` | L2665, L973, L2637 |
| Idle animation | `drawHeroIdle` plays only for the active hero after 10 s idle | L2531 |
| Boss targeting | Goblin King phase-3 fireball aims at `heroes[activeHero]` | L3167 |
| Kid Snatch | The **active** hero is the one who is *never* caged | L5224 |

### 2.3 The selection ring

**There is no world-space selection ring in v27.** The active hero is identified by:

1. The gold border + glow on the HTML portrait (`.hud-port.active`, CSS **L83**) — recoloured per-biome each second by `updateBiomeAccent()` (**L3352**).
2. The camera being centred on them.
3. In multiplayer only, a `P1`/`P2`… text badge floated 38 px above the hero (`drawPlayerBadge`, **L9182**) in `PLAYER_COLORS`.

Every hero draws the same soft drop shadow ellipse (`ellipse(0,12,14,6)`, L2457) and the same `NAME LvN` label 30 px above the head (L2526) — nothing distinguishes the one you are driving in the world layer.

---

## 3. Companion AI

All of it lives in the `else` branch of `Hero.prototype.update` — **L2266–2290** — which runs for any hero that is neither `activeHero` nor guest-controlled. There is no separate AI class, no state machine, no blackboard, and no per-hero personality: all three companions run identical code with `idx` as the only differentiator.

### 3.1 Leash (teleport tether)

```js
var ldr=heroes[activeHero]||heroes[0];var d=dst(this,ldr);
// v16-stab: Grace period after rescue — don't tether-teleport freed kids
if(this._rescueGrace>0){this._rescueGrace-=dt;d=0;}
if(d>400){var ra=rnd(0,TAU);this.x=ldr.x+Math.cos(ra)*50;this.y=ldr.y+Math.sin(ra)*50;this.vx=0;this.vy=0;}
```
— **L2266–2269.** Beyond **400 px** from the active hero a companion is hard-teleported to a random point **50 px** from the leader and its velocity is zeroed. This is the only "pathing" in the game: there is no navmesh, no A*, no steering around obstacles — the teleport is what unsticks a companion that has wedged itself on a tree.

`_rescueGrace` is set to `3` seconds when a sibling is freed from a cage (L2866), forcing `d=0` so a just-rescued hero is not immediately yanked.

### 3.2 Target selection

```js
// Smart AI: find nearest enemy
var nearE=null,nearED=Infinity;
var aiEList=inDungeon?dungeonEnemies:enemies;
for(var ei2=0;ei2<aiEList.length;ei2++){if(!aiEList[ei2].dead){var ed2=dst(this,aiEList[ei2]);
  if(ed2<nearED){nearED=ed2;nearE=aiEList[ei2];}}}
for(var mi2=0;mi2<miniBosses.length;mi2++){if(!miniBosses[mi2].dead){var md2=dst(this,miniBosses[mi2]);
  if(md2<nearED){nearED=md2;nearE=miniBosses[mi2];}}}
if(inDungeon&&dungeonBoss&&!dungeonBoss.dead){var dbd=dst(this,dungeonBoss);
  if(dbd<nearED){nearED=dbd;nearE=dungeonBoss;}}
if(!inDungeon&&boss&&!boss.dead){var bd2=dst(this,boss);
  if(bd2<nearED){nearED=bd2;nearE=boss;}}
if(shadowQueen&&!shadowQueen.dead){var sd2=dst(this,shadowQueen);
  if(sd2<nearED){nearED=sd2;nearE=shadowQueen;}}
```
— **L2271–2276.** Pure nearest-target, no threat, no aggro table, no focus-fire on the player's target, no priority for elites, no "help the hero being hit". Mini-bosses are scanned even inside a dungeon (they only exist in the overworld, so the loop is a no-op there).

### 3.3 Combat movement (kiting vs closing)

```js
var isRanged=this.aType==='arrow'||this.aType==='magic';
var threatRange=isRanged?300:200;
if(nearE&&nearED<threatRange&&d<300){
  var ea=ang(this,nearE);
  if(isRanged){
    var idealDist=this.rng*0.7;
    if(nearED<idealDist*0.4){                        // too close -> back off at full speed
      this.vx=lerp(this.vx,Math.cos(ea+PI)*this.spd,4*dt);
      this.vy=lerp(this.vy,Math.sin(ea+PI)*this.spd,4*dt);}
    else if(nearED>idealDist*1.3){                   // too far -> close at 80% speed
      this.vx=lerp(this.vx,Math.cos(ea)*this.spd*0.8,3*dt);
      this.vy=lerp(this.vy,Math.sin(ea)*this.spd*0.8,3*dt);}
    else{                                            // in the pocket -> sine strafe
      var strafe=Math.sin(gt*2+idx)*0.4;
      this.vx=lerp(this.vx,Math.cos(ea+PI/2)*this.spd*0.3*strafe,2*dt);
      this.vy=lerp(this.vy,Math.sin(ea+PI/2)*this.spd*0.3*strafe,2*dt);}
  } else {
    if(nearED>this.rng*1.1){                         // melee: charge at 115% speed
      this.vx=lerp(this.vx,Math.cos(ea)*this.spd*1.15,5*dt);
      this.vy=lerp(this.vy,Math.sin(ea)*this.spd*1.15,5*dt);}
    else{this.vx*=0.85;this.vy*=0.85;}               // in range: brake hard
  }
} else var fd=45+idx*10;
if(d>fd){var a=ang(this,ldr),sp=this.spd*(d>150?1.6:d>80?1.2:1);
  this.vx=lerp(this.vx,Math.cos(a)*sp,4*dt);this.vy=lerp(this.vy,Math.sin(a)*sp,4*dt);}
else{this.vx=lerp(this.vx,0,5*dt);this.vy=lerp(this.vy,0,5*dt);}
```
— **L2277–2290** (verbatim, reflowed for readability; the original is L2290 on one line).

Derived numbers, per hero (`spd`/`rng` from `HDEFS`, **L2139–2144**):

| Hero | `aType` | `spd` | `rng` | Ranged? | `threatRange` | `idealDist = rng*0.7` | back-off under | close-in over |
|---|---|---|---|---|---|---|---|---|
| LIAM | `melee` | 180 | 48 | no | 200 | — | — | 52.8 (`rng*1.1`) |
| NOAH | `arrow` | 175 | 230 | yes | 300 | 161 | 64.4 | 209.3 |
| COLLETTE | `magic` | 165 | 260 | yes | 300 | 182 | 72.8 | 236.6 |
| ISABELLA | `whirl` | 160 | 58 | no | 200 | — | — | 63.8 (`rng*1.1`) |

**Formation / follow distance:** `fd = 45 + idx*10` → **Noah 55, Collette 65, Isabella 75** px (Liam, `idx 0`, would be 45 but is normally the active hero). Follow speed is stepped: `×1.6` beyond 150 px, `×1.2` beyond 80 px, `×1.0` otherwise, lerped at `4*dt`. Inside `fd`, velocity lerps to zero at `5*dt`. The result is a loose trailing conga line, not a formation — there are no slots, no offsets, no spacing between companions, and they routinely overlap.

> **Important quirk (verified, L2290):** the `else` clause attached to the combat block is only `var fd=45+idx*10;`. The follow `if(d>fd){…}else{…}` that follows it is a **separate statement that runs every frame**, including combat frames. On a combat frame `fd` is `undefined`, `d>undefined` is `false`, so the *else* branch executes and damps the velocity the combat block just set (`lerp(v,0,5*dt)`). Companion combat movement therefore settles at roughly 40–45 % of its nominal speed. This is not a cosmetic bug — it is a large part of why v27 companions feel like they *drift* into combat rather than charge. See §11.

### 3.4 When they attack

Companions use the same target scan the active hero uses (**L2304–2311**, `near` within `this.rng`) and then:

```js
if(NET.role==='host'&&isGuestControlled(idx)){ if(near&&this.atkT<=0)this.attack(near); }   // L2314-2315
else if((controlMode!=='manual'||idx!==activeHero)&&near&&this.atkT<=0)this.attack(near);   // L2316
```

So: **auto-attack the nearest thing inside weapon range, on cooldown, forever.** `atkT` is reset to `this.cd` (Liam .35 s, Noah .28 s, Collette .6 s, Isabella .4 s) at the top of `Hero.prototype.attack` (L2321). Companions also get the facing snap `if(idx>0&&near)this.face=ang(this,near)` (**L2312**) — note this uses `idx>0`, not `idx!==activeHero`, so **Liam never turns to face a target while he is a companion**; he keeps whatever facing the last player input left him with, which for a melee hero also breaks his 120° hit arc (see §5.3).

### 3.5 Ability usage rules

**Companions never use abilities.** Verified by call-site: `trigUlt()` (L2665), `activateSignature(...)` (L973), and `trigComboUlt()` (L959) are only reachable from player input on `heroes[activeHero]`; `actUlt` is additionally called for a guest's hero from `netHostUpdate` (L8681). No AI code path calls any of them.

Consequences the rebuild must be aware of:

- A companion's `ultTimer` ticks down (L2213) and its portrait ult bar fills (L3735) but it will **never** fire — the charge just sits at zero waiting for you to switch to that hero. This is, in practice, the mechanic that makes switching worthwhile.
- Passive/aura skills *do* run on companions, because they live in `update` rather than in an ability: `teamRegen` heals the whole party from any hero (L2258), `bodyguard` redirects 30 % of a teammate's damage (L2367), `spiritLink` splits 30 % across the team (L2366), Liam's legendary auto-shield triggers at `hp < 25%` on a 10 s internal cooldown (L2261–2262), and `regen` ticks (L2260).

### 3.6 Retreat, healing, self-preservation

**There is none.** Companions have no HP check anywhere in the AI branch. A companion at 5 HP kites and closes exactly like one at full HP. There is no flee, no heal-seek, no disengage, no "stay out of the boss telegraph" — arena effects and boss AoE hit them at full value. The only self-preservation in the whole party is the Liam legendary shield (L2261) and equipment `dodge` (L2353).

### 3.7 Behaviour in dungeons and boss fights

- All four heroes exist in the dungeon and run the identical `update` (**L8123**). Companions follow, target and attack exactly as in the overworld; only the enemy list swaps (`dungeonEnemies`) and the boss is added to the target scan (L2273).
- **Different collision** in dungeons: the overworld obstacle push-out (L2291) is skipped (`if(!inDungeon)`), and instead `updateDungeon` runs a 4-corner AABB-vs-wall-tile resolve with radius 10 for every hero (**L8125–8130**). Positions are clamped to `[20, rw-20] × [20, rh-20]` (L8123).
- The 400 px leash teleport still applies inside a dungeon room and will happily place a companion inside a wall; the wall resolver at L8125 pushes it back out the following frame.
- In boss fights companions still use `threatRange` 200/300 and the `d<300` leader-proximity gate, so if you back off from a boss your companions disengage and follow you rather than keep fighting.
- Companions are what make the dungeon *survivable* — they out-DPS the player in a long fight simply by never stopping.

### 3.8 What happens when a companion is caged (Kid Snatch)

`BOSS_BLOCKS.kidSnatch` — **L5222**:

```js
var captured=[];var active=heroes[activeHero];
for(var i=0;i<heroes.length;i++){var h=heroes[i];
  if(!h.unlocked||h.dead||h.downed||h===active)continue;
  if(!opts.skipIfFar||dst(boss,h)<(opts.grabRadius||300)){captured.push(i);h._caged=true;h._cagedBoss=boss;}}
```

- **The active hero is explicitly exempt** (`h===active`). Kid Snatch takes the other three and leaves you alone with the boss. Goblin King phase 1 calls it with `{cageHp:200+teamLv*15, exposeDuration:2, buffPerHero:0.15, grabRadius:9999}` (**L3150**) — the 9999 radius means the whole party is taken regardless of position.
- A caged hero is **removed from simulation entirely**. In `update` (**L9268**): `if(heroes[i]._caged&&heroes[i]._cagedBoss){ x = boss.x+rnd(-2,2); y = boss.y-boss.sz-15; vx=vy=0; continue; }` — the `continue` skips `Hero.prototype.update`, so a caged companion does not move, attack, tick cooldowns, tick regen, or take damage. The `rnd(-2,2)` gives the cage its jitter.
- You **cannot switch to** a caged hero: the `1`–`4` path checks `!heroes[hi4]._caged` (L957). *The mouse and touch portrait paths do not check `_caged`* — see §11.
- The boss gains `dmgMul = 1 + captured.length*0.15` and `shieldPct = captured.length*0.05` (L5232). With three caged that is **+45 % boss damage and 15 % damage reduction**, and you are down to one hero. This is the single hardest control state in the game.
- Freeing: the cage is only damageable while `exposed` (`BOSS_BLOCKS.exposeCage`, L5239; `hitCage`, L5243). One hero is released per `1/N` HP threshold crossed (L5253), each landing at `boss.x+rnd(-60,60), boss.y+rnd(40,80)` with `hp = max(hp, maxHp*0.5)` (L5262). All are freed when cage HP hits 0 (`freeAllCaged`, L5269).
- Canon voice lines fire on capture, staggered `1500 + ci*1200` ms (**L5236**): `1: "Hey! Let me out!"`, `2: "The structural integrity of this cage is actually pretty— OW."`, `3: "WHOA! NOT COOL!"`, `4: "HEY! LET ME OUT!"` (index `0` is empty; the `4` key is unreachable with a 4-hero party).

---

## 4. Movement & camera

### 4.1 Movement model

Active hero (**L2264**):

```js
var s=this.spd;
if(!inDungeon){var bsm=getBiomeBuff('spdMul');if(bsm>1)s*=bsm;if(weather.type==='snow')s*=0.85;}
s*=getBuffMul(this,'spd');
if(this.state==='attacking'&&this.aType==='melee')s*=.3;
this.vx=lerp(this.vx,inp.x*s,6*dt); this.vy=lerp(this.vy,inp.y*s,6*dt);
```

| Parameter | Value | Line |
|---|---|---|
| Base speed | Liam 180, Noah 175, Collette 165, Isabella 160 px/s | L2139–2144 |
| Acceleration | `lerp(v, target, 6*dt)` — exponential, ~10 %/frame at 60 fps; no separate deceleration curve | L2264 |
| Guest-controlled hero accel | same `6*dt`, but `lerp(v,0,5*dt)` when no input packet has arrived | L2265 |
| Companion accel | `3*dt` (approach), `4*dt` (kite/follow), `5*dt` (settle), `×0.85`/frame (melee brake) | L2277–2290 |
| Melee attack slow | `×0.3` while `state==='attacking'` (a 200 ms window, `setTimeout` at L2321) | L2264 |
| Snow | `×0.85` | L2264 |
| Diagonal normalisation | in `getInput()`, `if(m>1)` | L1119 |
| Integration | `this.x+=this.vx*dt` (semi-implicit Euler, variable dt capped at 0.05 s) | L2292, L9223 |
| World clamp | `clamp(x,20,WW-20)`, `WW=WH=3200` | L2292, L587 |

There is **no dodge, dash, or roll as a movement verb** — but the *shape* of one exists as `NOAH`'s signature (`sigNm:'Dodge Roll'`, `sigKey:'roll'`, `sigCd:4`, L2141): 1 / 2.5 ≈ **0.4 s** of `200 px/s` forward motion along `this.face` with `this._sigImmune=true` the whole time — i.e. a full-duration i-frame dash on a 4 s cooldown, bound to `E`, available to exactly one of the four heroes (**L2222**). Collette's `Arcane Blink` (L2224–2230) is an instantaneous 120 px teleport with a dungeon wall check that reverts the move if the destination tile is solid. Liam's `Shield Bash` (L2217–2221) is a 0.25 s forward lunge with i-frames for the first half (`_sigImmune = sigState<0.5`).

### 4.2 Collision

- **Overworld** (**L2291**, all heroes): brute-force loop over every `obstacle`; `flower`, `mush`, `crystal` and `icespike` are pass-through; anything else within `o.r+12` snaps the hero to exactly `o.r+12` along the outward angle. Position-only correction — velocity is not reflected or zeroed, so a hero pinned against a rock keeps trying and jitters.
- **Alien crater rim** (**L2293**): pushes heroes to `radius+35` and applies `vx*=0.3; vy*=0.3`.
- **Dungeon** (**L8125–8130**): 4-corner check against the room tile grid, radius 10, minimum-penetration axis resolve, and it *does* zero the corresponding velocity component.
- Heroes do not collide with each other or with enemies.

### 4.3 Camera

```js
var h0=heroes[activeHero]||heroes[0];
cam.x=lerp(cam.x,h0.x-W/2,5*dt); cam.y=lerp(cam.y,h0.y-H/2,5*dt);
var _cMinX=W/(2*WORLD_ZOOM)-W/2,_cMinY=H/(2*WORLD_ZOOM)-H/2;
var _cMaxX=WW-W+W/2-W/(2*WORLD_ZOOM),_cMaxY=WH-H+H/2-H/(2*WORLD_ZOOM);
cam.x=clamp(cam.x,_cMinX,Math.max(_cMinX,_cMaxX));
cam.y=clamp(cam.y,_cMinY,Math.max(_cMinY,_cMaxY));
if(shk.t>0){shk.t-=dt;var _sd=shk.maxT>0?shk.t/shk.maxT:0;var _si=shk.i*_sd;
  cam.x+=rnd(-_si,_si);cam.y+=rnd(-_si,_si);if(shk.t<=0){shk.i=0;shk.maxT=0;}}
```
— **L9270–9272.**

| Property | Value | Line |
|---|---|---|
| Follow | Single-axis `lerp(cam, target, 5*dt)` — critically damped, ~8 %/frame | L9270 |
| Look-ahead | **None.** The camera targets the hero's position, never velocity | L9270 |
| Zoom | `WORLD_ZOOM = 1.30` default; user-selectable `1.0 / 1.15 / 1.30`; applied as a canvas transform around screen centre, not a camera property | L589, L590, L4290 |
| Clamp | Derived from the zoomed viewport so the world edge never shows | L9271 |
| Shake | `screenShake(i,dur)` clamps intensity to 25 and takes the max duration (L611); applied as a linearly-decaying random offset **after** the clamp, so shake can push past the world edge | L611, L9272 |
| Snap | Hard snap (no lerp) on auto-switch after a hero goes down (L2397), on revive-switch (L2203), on load, and on dungeon exit (L9424) | — |
| Guest camera | Snapped once (`NET._camInited`) then `lerp(cam, target, 0.12)` — a **frame-rate-dependent** constant, not `*dt` | L8874–8880 |
| Dungeon | The camera is **not used**: the room is drawn centred at `((W-DNG_COLS*DNG_TW)/2, (H-DNG_ROWS*DNG_TW)/2)` and the whole room fits on screen | L1078, L8123 |
| Cutscene | `WORLD_ZOOM` is animated to `_csZoom` and lerped back over the exit (L4914, L5002); `cam` is driven directly | L4454–5005 |

### 4.4 Screen space vs world space

- World space: hero/enemy/particle positions, `cam`, obstacle radii, all `dst()` gameplay checks.
- Screen space: HUD (HTML overlay, `#hud`), portrait strip, joystick, touch buttons, minimap, announcements, tutorial banner, boss bar, damage numbers (drawn at `x-cam.x, y-cam.y` inside the zoom transform).
- The bridge is `beginWorldZoom()` / `endWorldZoom()` (**L590–591**) around the world draw, and `unzoomScreenPoint()` (**L592**) for turning a pointer position back into world coordinates. Everything drawn *outside* that pair is at 1:1 pixels.

---

## 5. Combat controls

### 5.1 Attack input → hit resolution

There is **no wind-up and no telegraph on the player side**. `Hero.prototype.attack(tgt)` (**L2320**) resolves damage on the same frame it is called:

```js
this.atkT=this.cd;this.atkAnim=1;this.state='attacking';this.ppulse=1;
var self=this;setTimeout(function(){if(!self.dead&&!self.downed)self.state='idle';},200);
var d=this.dmg,crit=Math.random()<(.12+(this.crit||0));if(crit)d=Math.floor(d*(this.critMul||1.8));
```

| Attack type | Timing | Line |
|---|---|---|
| `melee` (Liam) | Instant hit-scan, same frame. Range `rng+25`, **facing cone `|Δangle| < PI/3`** (120° total) unless `fullWhirl>0`. Knockback `200 + kbForce*200 + (knockback?100:0)` | L2325 |
| `whirl` (Isabella) | Instant, **360°, no facing check**, range `rng+18` | L2328 |
| `arrow` (Noah) | Deferred: `burst` shots at `bn*100` ms, `multishot` spread `±0.15 rad` per extra shot, projectile speed 480 | L2326 |
| `magic` (Collette) | Homing projectile, speed 220, `tgt` locked at fire time | L2327 |
| `shockwave` skill | Every Nth landed hit → 80 px AoE for `d*0.5` | L2330 |

`state='attacking'` is cleared by a **200 ms `setTimeout`** — a wall-clock timer, not a simulation timer. It is what gates the melee `×0.3` move-speed penalty (L2264). This is the only "commitment" in the whole attack.

### 5.2 Aim direction rules

The active hero's `face` is set, in priority order (**L2296–2303**):

1. `classic` → `ang(this, mw)` where `mw` is the mouse in world space, **every frame**.
2. `hybrid`/`manual` → `this.forceAtkAngle` if `forceAtk` is latched, else `atan2(vy,vx)` when speed > 5.

Then, regardless of mode, the auto-attack path calls `this.attack(near)` with `near` = **nearest target inside `this.rng`** (L2304–2311). For ranged heroes the projectile is fired at `ang(self, tgt)` — i.e. **auto-aim is unconditional and perfect**; the player's aim only matters for melee (via the 120° cone) and for the click-attack. This is the "soft lock-on" the brief asks for in §5.4, except it is hard, always on, and invisible.

Click-attack path (**L2313**):

```js
if(this.forceAtk&&this.atkT<=0){this.forceAtk=false;var fa2=this.forceAtkAngle||0;
  this.face=fa2;var fakeTarget={x:this.x+Math.cos(fa2)*100,y:this.y+Math.sin(fa2)*100};
  this.attack(fakeTarget);}
```

The `fakeTarget` 100 px down the aim ray is what makes a directional attack possible at all — for `arrow`/`magic` it becomes the projectile's aim/homing target, so a click into empty space fires a projectile that homes on nothing.

### 5.3 Ability slots

There are exactly **four ability inputs** per hero, and no slot system:

| Slot | Key | Function | Cooldown source |
|---|---|---|---|
| Basic attack | click / tap / automatic | `Hero.prototype.attack` | `cd` (0.28–0.6 s) |
| Signature | `E` | `activateSignature(heroes[activeHero])` — L2666 | `sigCd`: Liam 6, Noah 4, Collette 8, Isabella 5 s |
| Ultimate | `R` / `0` (and Space as a fallback) | `trigUlt()` → `actUlt(h)` — L2665, L2667 | `ultCD`: Liam 25, Noah 22, Collette 28, Isabella 20 s |
| Combo ultimate | `Q` | `trigComboUlt()` — L2642 | Consumes **both** partners' ult charge |
| Co-op ability | guest `Q` only | `activateCoopAbility(hero)` — L1383 | `COOP_ABILITIES[idx].cd`: 30/25/28/20 s |

Signature names (`HDEFS`, L2139–2144): Liam **Shield Bash**, Noah **Dodge Roll**, Collette **Arcane Blink**, Isabella **Ground Pound**. Ultimate names (`actUlt`, L2667+): **EXCALIBUR STRIKE**, **ARROW STORM**, **ARCANE NOVA**, **METEOR DROP**.

`activateSignature` is guarded only by `!dead && !downed && sigTimer<=0 && !sigActive` (L2666) and is *not* gated on `paused` inside the function — the caller does that: `if(!paused&&!showLvl)` (L973).

Signature execution runs as a state machine inside `Hero.prototype.update` (**L2216–2242**) driven by `sigState`, advanced at hero-specific rates: Liam `dt*4` (0.25 s), Noah `dt*2.5` (0.4 s), Isabella `dt*6` with the impact at `sigState>=0.15` (25 ms) and end at `0.4` (~67 ms); Collette's is instantaneous (single frame).

The ultimate-ready HUD banner reads **`⚡ ULTIMATE READY — SPACE`** (element `#hudUlt`, **L375**) even though the bound key is `R`/`0` — Space only works because the interact chain falls through to `trigUlt()` (L971). The rebind UI can move `ultimate` but never updates that string.

### 5.4 Cooldown display

- Portrait ult bar: `port-ult-fill` width `= 1 - ultTimer/ultMax` (L3735), colour `rgba(168,98,196,0.6)` (CSS L91).
- Signature: `#hudSig` shows `⚡ <sigNm> [E]` when ready, or `<sigNm> [E] (Ns)` at 50 % opacity while cooling (**L3716–3719**).
- Ultimate: `#hudUlt` shown/hidden binary (L3710).
- Combo: see §6.

---

## 6. Combo ultimates

`COMBO_ULTS` — **L2628–2634**. Six pairs from four heroes:

| Pair | Heroes | Name | `dmg` mult | `radius` | Colour | Extra |
|---|---|---|---|---|---|---|
| `[0,1]` | Liam + Noah | Shield Crash | 3.0 | 120 | `#4A9ED8` | — |
| `[0,2]` | Liam + Collette | Arcane Fortress | 2.5 | 100 | `#A862C4` | — |
| `[0,3]` | Liam + Isabella | Earthquake Slam | 3.5 | 150 | `#D88030` | — |
| `[1,2]` | Noah + Collette | Shadow Barrage | 2.0 | 0 | `#3DCC7A` | `projCount:16` radial projectiles |
| `[1,3]` | Noah + Isabella | Blade Storm | 2.5 | 100 | `#E8A838` | — |
| `[2,3]` | Collette + Isabella | Supernova | 4.0 | 180 | `#e84393` | — |

### 6.1 Pairing and ready conditions

```js
function getComboUlt(){
  var ah=heroes[activeHero];if(!ah||ah.dead||ah.downed||ah.ultTimer>0)return null;
  for(var ci=0;ci<COMBO_ULTS.length;ci++){var c=COMBO_ULTS[ci];
    var pi=c.pair[0]===activeHero?c.pair[1]:c.pair[1]===activeHero?c.pair[0]:-1;
    if(pi<0)continue;var p=heroes[pi];
    if(!p||!p.unlocked||p.dead||p.downed||p.ultTimer>0)continue;
    if(dst(ah,p)>100)continue;
    return{def:c,partner:pi};}
  return null;}
```
— **L2636–2640.** All of:

1. The **active hero** must be one half of the pair — you cannot fire a combo between two companions.
2. **Both** heroes' `ultTimer` must be `0` (fully charged).
3. The partner must be `unlocked && !dead && !downed`.
4. **`dst(ah, partner) <= 100 px`** — you must physically be standing next to your partner. Because companions leash at `fd = 45 + idx*10` (55/65/75 px), the default follow distance sits *just* inside this window, which is why combos feel available whenever both bars are full.

The loop returns the **first** matching pair in `COMBO_ULTS` order. With three companions all charged and in range, the player has no way to choose *which* combo fires — the array order decides. (E.g. as Liam with everyone charged and close, you always get Shield Crash.)

### 6.2 Trigger and resolution

`trigComboUlt()` — **L2642–2663**, bound to `Q` (L959):

```js
ah.ultTimer=ah.ultMax; p.ultTimer=p.ultMax;      // both ults consumed
screenShake(15,0.6); snd('boom',0.5);
announce('⚡ '+c.nm+'! ⚡',c.col,3);
var baseDmg=Math.floor((ah.dmg+p.dmg)*c.dmg);     // combined base damage
var cx20=(ah.x+p.x)/2, cy20=(ah.y+p.y)/2;         // origin is the MIDPOINT of the pair
```

Damage is applied to enemies, mini-bosses (via the enemy list), `dungeonBoss`, `boss` and `shadowQueen` inside `c.radius` of that midpoint (L2648–2653); `projCount` fires `c.projCount` projectiles radially at speed 150 with `baseDmg/projCount` each (L2654). 25 particles at speed 100–300 (L2656). Tracked in `gameStats.comboUltsUsed` / `gameStats.uniqueCombos`; three unique combos unlock the `comboMaster` achievement (**L2663**, achievement def L903).

There is **no cinematic, no time dilation and no hit-stop** on a combo ultimate — only a `screenShake(15,0.6)`, which is the strongest shake in the game.

### 6.3 What the player sees

`#hudCombo` — element **L375**, driven at **L3711–3712**:

```js
var comboInfo=getComboUlt();var comboEl=document.getElementById('hudCombo');
if(comboEl){if(comboInfo){comboEl.style.display='';
  comboEl.textContent='⚡ '+comboInfo.def.nm+' — Q';
  var _cpulse=0.7+0.3*Math.sin(gt*6);
  comboEl.style.opacity=_cpulse;
  comboEl.style.borderColor=comboInfo.def.col;comboEl.style.color=comboInfo.def.col;}
 else{comboEl.style.display='none';}}
```

A single pill above the ultimate banner (`bottom:88px`) that appears the instant a combo becomes legal, names it, tints itself the combo's colour, and pulses at 6 rad/s between 0.7 and 1.0 opacity. **That pill is the entire discovery mechanism for the combo system** — nothing else in the game tells the player that pairs exist. There is no partner highlight, no line between the two heroes, no proximity ring.

Combo ultimates are **host-only**: the guest's `Q` is mapped to `activateCoopAbility` instead (L8680), and `getComboUlt` reads `activeHero`, which on a guest means their own hero but `trigComboUlt` is never called on the guest side.

---

## 7. Downed, revive, caged, banished, game over

### 7.1 Going down

In `Hero.prototype.takeDmg` when `hp <= 0` (**L2378–2410**):

1. `hp=0; dead=true; deathA=0`.
2. If `autoRevive > 0` (Phoenix Feather): consume one charge, immediately restore to `maxHp*0.5`, `dead=false`, `downed=false` — no downed state at all (L2381–2384).
3. Otherwise `downed=true; reviveTimer=20; reviveX=this.x; reviveY=this.y; _adaptDiff.downs++` (L2385).
4. If the downed hero **was** the active hero, auto-switch to the nearest hero that is `unlocked && !dead && !downed && !banished` and, when host, not guest-controlled; **hard-snap the camera** to them; `announce('Switching to <NAME>!')`; `snd('heal',0.2)` (L2388–2401).
5. If **no** hero is alive → `showDungeonFail()` in a dungeon, else `gameOver=true; showGameOverHTML(); stopBGM9()` (L2404–2409).

### 7.2 While downed

- `Hero.prototype.update` returns early after the revive tick (**L2187–2211**), so a downed hero has no movement, no attacks, no cooldown ticks, and cannot be switched to.
- **Solo revive is passive and automatic**: `reviveTimer -= dt * _rvSpeed` with `_rvSpeed = 1`. A 20-second self-revive.
- **Co-op revive**: only when `NET.playerCount > 1` — any other living hero within **60 px** sets `_rvSpeed = 3`, cutting the wait to ~6.7 s and recording `this._reviver` (L2189). **In single-player, standing next to a downed teammate does nothing.**
- On revive: `hp = floor(maxHp*0.4)`, teleport back to `reviveX/reviveY` (the death position), `snd('revive',0.35)`, 20 particles, `screenShake(4,.15)` (L2193–2209).
- Host-only: if the current `activeHero` is dead, downed or guest-controlled when someone revives, control jumps to the revived hero with a camera snap (L2198–2204).
- Visual (**L2434–2444**): a translucent pulsing ghost, a blue arc ring showing `1 - reviveTimer/20`, the remaining seconds in text, and — when a reviver is present — a green outer arc plus `P<n> reviving`. Portrait shows `.downed` (opacity 0.5) with a `Ns` overlay (L3737–3739).

### 7.3 Banished (Shadow Queen)

Shadow Queen phase 3 kidnaps a hero over a channel; on success `kidnapTarget.banished = true; kidnapTarget.dead = true` (**L5560**) — permanently removed, no revive timer. Interrupt by dealing 150 damage during the channel (`kidnapDmg >= 150`, L5566). `banished` heroes are excluded from switch targets (L957, L1067), from the auto-switch search (L2391), and from the "anyone alive" game-over check (L2405).

### 7.4 Caged

See §3.8. Caged is a *third* incapacitated state, distinct from `dead`/`downed`, handled by a `continue` in the main loop rather than inside `Hero.update`.

### 7.5 Game over / restart

`gameOver` freezes the loop to a background render (**L9233**) and shows `#gameOverOverlay`. Any canvas click restarts via `initGame()` (**L9432–9435**) — including a stray click, with no confirmation.

---

## 8. Multiplayer control (host / guest)

Modules: `// ===== V15: NETWORKING MODULE =====` **L1364**, `// ===== V15: NET HOST/GUEST FUNCTIONS =====` **L8668**.

### 8.1 Topology

Strict **host-authoritative** over a relay WebSocket (default `ws://localhost:3000`, `localStorage['ssq_server_url']`, L1366). Up to 4 players. The host runs the entire simulation; guests run **no game logic at all** — `gameLoop` bails immediately (`if(NET.role==='guest'){guestGameLoop(time);return;}`, **L9229**).

| | Host (`NET.role==='host'`, `playerId 0`) | Guest (`playerId 1..3`) |
|---|---|---|
| Simulates | Everything: heroes, enemies, bosses, projectiles, loot, dungeon, weather, day/night, quests | Nothing |
| Controls | `heroes[activeHero]`, plus all non-assigned heroes as AI | Exactly one hero: `NET.guestHeroes[NET.playerId]` |
| Sends | Full state snapshot at `SEND_RATE = 1/30` (L1367) | Input packet at `1/30` (L9155) |
| Receives | `{type:'input'}` per guest → `NET.guestInputs[playerId]` (L1481) | `{type:'state'}` snapshots into a 4-deep `snapBuf` (L1465) |
| Rendering | Direct from local state | Interpolated at `now - interpDelay(50 ms)` between two snapshots (`getInterpolatedSnapshot`, L8829) |
| Pause | Can pause; the pause is replicated | Cannot pause; sees `#guestPauseOverlay` "⏸ GAME PAUSED / Waiting for host to resume…" (L513, L8915) |

`PLAYER_COLORS = ['#4A9ED8','#2DB86A','#D88030','#e91e63']` — **L1372**. Used for the `P1`…`P4` name list in `drawNetHUD` (L9178–9180) and the floating `drawPlayerBadge` above each controlled hero (L9182, drawn at `y-38`, 20×12 black plate, `bold 10px monospace`).

### 8.2 How a guest's input reaches the host

`guestSendInput(dt)` — **L9153–9163**:

```js
guestInputTimer+=dt;if(guestInputTimer<NET.SEND_RATE)return;guestInputTimer=0;
var input={type:'input',
  keys:{w:keys.w||keys.arrowup, s:keys.s||keys.arrowdown,
        a:keys.a||keys.arrowleft, d:keys.d||keys.arrowright},
  click:pendingClick||null, q:keys.q?true:false, ult:keys.r||keys['0']?true:false,
  interact:keys[' ']?true:false, sig:keys.e?true:false,
  heroIdx:myHero!==undefined?myHero:-1};
NET.ws.send(JSON.stringify(input)); pendingClick=null;
```

Note this bypasses `keyBinds` entirely — **a guest's remapped keys are ignored; the wire format is hard-coded WASD/arrows + `q` `r` `0` `space` `e`.** A ping is sent every 2 s to maintain `NET.rtt` (L9163).

Movement is applied on the host inside `Hero.prototype.update` (**L2265**), which reads `NET.guestInputs[pid].keys` and runs the *same* `lerp(v, dir*s, 6*dt)` the host's own hero uses, so a guest hero accelerates identically. **Guest movement is not normalised for diagonals the same way** — it uses `gm=Math.hypot(gix,giy); if(gm>0){gix/=gm;giy/=gm;}`, i.e. always normalised, whereas the host's `getInput` only normalises when `m>1`. In practice both end up at magnitude 1.

Everything else is drained once per frame in `netHostUpdate(dt)` — **L8668–8696**:

```js
for(var pid in NET.guestInputs){
  var gi=NET.guestInputs[pid];var hIdx=NET.guestHeroes[pid];
  if(hIdx===undefined||hIdx<0)continue;
  var gh=heroes[hIdx];if(!gh||!gh.unlocked||gh.dead||gh.downed)continue;
  if(gi.click&&gh.atkT<=0){var atkAng=gi.click.angle!==undefined?gi.click.angle
       :Math.atan2(gi.click.wy-gh.y,gi.click.wx-gh.x);
     gh.face=atkAng;performAttack(gh,atkAng);}
  if(gi.q&&gh.coopCd<=0&&NET.playerCount>1)activateCoopAbility(gh);
  if(gi.ult&&!gh.dead&&!gh.downed&&gh.ultTimer<=0){actUlt(gh);}
  if(gi.sig&&!gh.dead&&!gh.downed&&gh.sigTimer<=0&&!gh.sigActive){activateSignature(gh);}
  if(gi.interact&&!gh._intProc){gh._intProc=true;
    if(inDungeon&&!dungeonCinematicActive){heroInteractAs(gh);}
    else if(!inDungeon){npcQuestInteractAs(gh);}}
  if(!gi.interact)gh._intProc=false;
  if(gi.lvlVote!==undefined&&showLvl){NET._guestVotes[pid]=gi.lvlVote;delete gi.lvlVote;}
}
```

`gh._intProc` is the only edge-detection anywhere in the input system — it converts the guest's held `interact` boolean into a single trigger.

A guest's hero **auto-attacks like a companion** on top of their manual clicks: `if(NET.role==='host'&&isGuestControlled(idx)){ if(near&&this.atkT<=0)this.attack(near); }` (**L2314–2315**). A guest hero never uses AI *movement* — if no input packet is present its velocity lerps to zero (L2265).

Guest click → angle is computed **locally on the guest**, in its own screen space, and only the angle is sent (**L1059**): `pendingClick={angle:Math.atan2(_uzg.y-hsy,_uzg.x-hsx)}` where `hsx/hsy` are the guest's on-screen hero position. Because the guest sees an interpolated position 50 ms in the past, the angle is inherently 50 ms + RTT/2 stale.

### 8.3 Hero assignment and switching with 2+ players

- `netAssignGuestHero(playerId)` — **L1497**: walks heroes `0..3`, skips `activeHero` and anything already assigned, and takes the first `unlocked && !dead && !downed`. Sends `{type:'event',data:{assign,heroName,playerId}}`. If none is free: `'No hero available for Player N'`.
- Triggered when a player joins mid-game (L1450), on `startGame` for everyone already connected (L9489), and **whenever a sibling is rescued from a cage** (`Cage.prototype.update`, **L2867**) — so freeing Collette hands her to a waiting P3 automatically.
- **Guest-requested switch**: guest presses `1`–`4` (**L943**) or taps a portrait (**L1046–1054**) → sends `{type:'input',switchHero:idx}` and announces `'Requesting <NAME>...'`. The host arbitrates (**L1475–1481**):
  - `'P<n> can't take host's hero'` if `_shi === activeHero`;
  - `'P<n>: hero taken by another player'` if already `isGuestControlled` by someone else;
  - otherwise `NET.guestHeroes[pid] = _shi`, echo `assign`, announce `'<NAME> → P<n>'`.
- **Host-side switch** is blocked onto guest-owned heroes: `announce(nm+' is controlled by P<n>')` (L957) / `'…is controlled by another player'` (L1069).
- The auto-switch on down (L2392) and on revive (L2201) both explicitly refuse to steal a guest's hero.
- On the guest, `activeHero` is force-set to `myHeroIdx()` every snapshot (**L8870**) so the local HUD tracks their own hero, while `NET.hostActiveHero` tracks the host's for badge rendering (L8871, L8821).

### 8.4 `COOP_ABILITIES`

**L1378–1382** — one per hero index, only usable when `NET.playerCount > 1` (**L1384**), and only reachable through a guest's `q` (L8680). The host has no key bound to it: pressing `Q` on the host runs `trigComboUlt()` instead (L959). **So in v27 the host can never use a co-op ability, and a guest can never use a combo ultimate.**

| idx | Hero | Name | `cd` | `dur` | Effect | Line |
|---|---|---|---|---|---|---|
| 0 | LIAM | Rally Cry | 30 s | 8 s | Allies within 200 px get `dmgBuff = 1.3` (+30 % damage) | L1386–1388 |
| 1 | NOAH | Hunter's Mark | 25 s | 6 s | Nearest enemy within 300 px gets `marked = 6` (+50 % damage taken) | L1389–1392 |
| 2 | COLLETTE | Arcane Link | 28 s | 10 s | Links the nearest ally within 250 px; heals them 25 % of her magic damage | L1393–1396 |
| 3 | ISABELLA | Shadow Step | 20 s | 0 | Teleport to the nearest ally, `shieldOn=1.5` on both, particles + `snd('portal',0.4)` | L1397–1403 |

Cooldowns tick in `Hero.prototype.update` (L2255–2257); the buff auto-expires when `coopActive` hits 0. `coopCd` and `coopActive` are replicated in the snapshot (`coopCd`, `coopA`, `dmgB`, L8712-adjacent).

### 8.5 Disconnect behaviour

| Event | Host sees | Guest sees | Line |
|---|---|---|---|
| Guest leaves | `'Player disconnected'`; `delete NET.guestHeroes[pid]`, `delete NET.guestInputs[pid]` — the hero silently reverts to AI companion behaviour on the next frame | — | L1455–1456 |
| Guest drops (server-detected) | `'P<n> disconnected — 30s to reconnect'` | — | L1457 |
| Guest reconnects | `'P<n> reconnected!'` | — | L1458 |
| Host leaves | — | `'Host disconnected'` → `returnToTitle()` | L1493 |
| Socket closes on a guest mid-game | — | `'Disconnected from host'` → `returnToTitle()` (progress lost) | L1421 |
| Local teardown | `netDisconnect()` clears role, room, guest maps, snapshot buffer, entity maps, and hides the guest pause overlay | | L1426–1433 |

The 30 s reconnect window is announced but there is no client-side hero reservation — a hero freed by `'left'` can be reassigned to someone else before the original player returns.

---

## 9. Menus, pause and focus

| Input | Opens / closes | Pauses the sim? | Line |
|---|---|---|---|
| `T` | Skill tree (`#skillTreeOverlay`) | **Yes** — `paused = showSkillTree` | L947, L4340 |
| `I` | Inventory (`#inventoryOverlay`) | **Yes** | L948, L4347 |
| `P` / `Esc` | Pause menu (`#pauseOverlay`) | **Yes** | L949, L4354 |
| `J` | Quest journal | **Yes** — `paused = showQuestJournal||…` | L967 |
| `B` | Bestiary | **No** — the sim keeps running behind it | L966 |
| `G` | Quest compass toggle | No | L960 |
| `M` | Music mute | No | L961 |
| `Esc` (settings open) | `hideSettingsUI()` | Restores `paused` per `settingsOpenedFrom` | L951, L4310 |
| `Esc` (dungeon-entry prompt open) | Cancels the prompt, `paused=false`, `dungeonEntryCooldown=2` | — | L953 |
| Space at a merchant / bounty board | Opens the HTML overlay and sets `paused=true` | Yes | L971 |
| Level-up | `showLvl=true; paused=true`; `1`/`2`/`3` or click a card selects | Yes | L2710, L1034, L1120 |
| Boss intro | `bossIntroActive=true; paused=true` for ~letterbox duration, auto-released | Yes | L5329–5341 |
| Dialogue | `dialogueActive` → `update()` returns after ticking the typewriter; Space advances | Effectively yes | L9249, L971 |
| Cutscene | Replaces update/render entirely; Space or Enter skips | Yes | L9234, L931 |

`togglePause`, `toggleSkillTree` and `toggleInventory` (**L4340–4360**) are mutually exclusive: each sets its own flag, clears the other three, and calls `hideOverlayEl` on the others. All three early-return on `gameOver||gameWon||showLvl`.

The `paused` gate is a single check in the main loop (**L9235**): `if(!paused){ gt+=dt; …; if(inDungeon)updateDungeon(dt); else update(dt); updateBGM9(dt); }`. Rendering continues, so a paused game is a live still frame. **`netHostUpdate(dt)` runs outside the gate (L9236)** — the host keeps streaming snapshots and keeps *draining guest input* while paused, but since nothing simulates, guest actions are consumed and dropped.

`hitStop` is a hard frame skip: `if(window._hitStop>0){window._hitStop-=dt;return;}` (**L9226**) — it freezes input processing too, since `keydown` still fires but `getInput` is not polled.

**Focus handling:** there is none. No `blur`/`visibilitychange` listener, no key-state flush; `keys` is only cleared by an actual `keyup` (L1035). Alt-tab while holding `W` and the hero walks until you come back and release. HTML overlays are real DOM and take focus normally; the rebind capture listener is registered with `capture: true` (L4304) so it beats the game's own keydown handler.

---

## 10. Dev console and debug controls

| Access | Effect | Line |
|---|---|---|
| **`Ctrl+Shift+D`** | Toggle the dev console panel (`devBuildUI()` / `devClose()`) | L9893 |
| **`F2`** | Toggle `DEV_MODE` — announces `Room-clear cheat ON 🔧` / `OFF`; shows the `🔧 DEV` HUD badge (L3706) and the perf overlay (L9243) | L963 |
| **Tap the version label 5× within 2 s** | Toggle `DEV_MODE` from the title screen (mobile-friendly); relabels to `— V 27 — DEV MODE 🔧` in red | L9438–9444 |
| `` ` `` (with `DEV_MODE`, in a dungeon, unpaused) | Kill every enemy + boss, solve puzzles, unlock all doors, mark the room cleared | L975–988 |
| `` ` `` (any time) | Toggle `showNetDebug` — RTT / buffer / tick / entity counts overlay, guest only | L932, L8836 |
| `F6` (DEV, overworld) | Spawn 2–4 parachute crates, or launch a supply flyover | L989–999 |
| `F7` (DEV, overworld) | Force a biplane crash + spawn Ed | L1001–1013 |
| `F8` (DEV, overworld) | Cycle weather `clear→rain→storm→snow→sand→fog` | L1014–1017 |
| `F9` (always) | Dump a diagnostic block to `console.log` (hero, biome, time, biplane/Ed/story flags, enemy count) | L1024–1033 |
| `F10` (DEV, overworld, no cutscene) | Replay the meteor cutscene | L1019–1021 |

Dev console panel (**L9760–9864**) — a fixed, centred DOM panel, `z-index:99999`. Control-relevant buttons: **God Mode** (`devGod`), Heal All, Kill Boss, **Unlock All** (`devUnlockAll` also clears `_caged`/`_cagedBoss`, L9528), Lv 5/10/20, +1000 Gold, Boss HP 75/50/25/10 %, and per-boss phase scenarios including **`P1 Kid Snatch`** (`devGoblinKing(1)`, L9789) — the fastest way to reproduce the caged-party control state.

God mode is installed by monkey-patching the hero damage entry point at the very bottom of the file (**L9895–9897**):

```js
var _origHeroTakeDmg=Hero.prototype.takeDmg;
Hero.prototype.takeDmg=function(amt,src){if(devGod)return 0;return _origHeroTakeDmg.call(this,amt,src);};
```

All `dev*` functions are exported onto `window` (L9880–9890), which is what makes the "Puppeteer smoke tests driven through the dev console" idea in Brief §7.1 feasible — and worth preserving deliberately rather than by accident.

---

## 11. Known quirks and bugs in the v27 control model

These are all verified in the source. They matter because some of them are load-bearing for how the game *feels*, and a "clean" rebuild would silently change the feel.

| # | Issue | Line | Consequence |
|---|---|---|---|
| 1 | **Companion combat movement is damped by a fall-through `else`.** `} else var fd=45+idx*10;` binds only the assignment; the follow `if(d>fd){…}else{lerp(v,0,5*dt)}` runs unconditionally, and on a combat frame `fd` is `undefined` so the damping branch always fires. | L2290 | Companions approach and kite at ~40–45 % of the intended speed. Fixing this makes companions noticeably more aggressive — a deliberate decision, not a free bug fix. |
| 2 | **`classic` aim ignores `WORLD_ZOOM`.** `mw.x=mx+cam.x` uses raw client coords while the world is drawn through a 1.30× transform. Click-to-attack correctly uses `unzoomScreenPoint`. | L2297 vs L1077 | At the default zoom, classic-mode aim is off by up to ~15 % of the screen radius, growing toward the edges. |
| 3 | **Companion facing uses `idx>0`, not `idx!==activeHero`.** | L2312 | Liam, as a companion, never turns toward his target; with a 120° melee cone (L2325) he frequently swings at nothing. |
| 4 | **Portrait tap (touch handler A) doesn't check `downed`/`banished`/`_caged`.** | L1090 vs L957 | On mobile you can make a caged or downed hero "active", stranding control on a hero that cannot move. |
| 5 | **Two overlapping touch button sets.** v21.5 circles at `(W-65,H-85)`/`(W-135,H-85)`/`(W-65,H-155)` plus legacy rects at `(W-70,H-210)` and `(W-70,H-160)`, with two different joystick exclusion zones (`W*0.5` vs `W*0.35 && H*0.55`). | L926, L1101–1103, L8104–8108 | Duplicate ULT buttons in dungeons; a tap near the seam can fire two actions. |
| 6 | **Touch ATK button computes world position without the dungeon offset.** `wxa=t.clientX+cam.x` even when `inDungeon`. | L1086 | Touch attacks aim in a wrong direction inside dungeons. |
| 7 | **Rebinding destroys the secondary binding.** `keyBinds[act]=[nk]` replaces the array. | L4304 | Rebinding "Move Up" to `w` deletes `arrowup`; there is no way to restore it except Reset to Defaults. |
| 8 | **The ultimate HUD banner is hard-coded to `SPACE`** while the bound key is `R`/`0`. | L375 | Misleading after any rebind; works only because Space falls through to `trigUlt()` (L971). |
| 9 | **Guest input bypasses `keyBinds`.** | L9157–9159 | A guest's remapped controls silently do nothing. |
| 10 | **The `autoAim` setting is never read.** | L594, L4290 | A toggle that does nothing; auto-aim is unconditional. |
| 11 | **No blur/visibility handling.** | L1035 | Held keys stick across alt-tab. |
| 12 | **No input buffering; `forceAtk` is a latch with no expiry.** | L1080, L2313 | Attacks pressed during recovery are dropped, or fire late with a stale angle. |
| 13 | **Guest camera lerp is frame-rate dependent** (`lerp(cam,t,0.12)` rather than `*dt`). | L8878 | Camera feel differs between a 60 Hz host and a 144 Hz guest. |
| 14 | **`state='attacking'` uses a wall-clock `setTimeout(200)`**, not the simulation clock. | L2321 | The melee move-speed penalty desyncs from a paused or hit-stopped sim. |
| 15 | **Combo ultimate pair selection is array-order-first.** | L2637–2640 | The player cannot choose which of several available combos fires. |
| 16 | **Any canvas click restarts the game after game over.** | L9432–9435 | Accidental restart. |
| 17 | **Two different mobile detections** (`isMob` UA-sniff, L614; `isMobile` touch-capability, L8102). | — | A touch laptop gets the legacy dungeon buttons but not the v21.5 ones. |

---

## 12. Recommendation for 3D

The orchestrator decides; these are recommendations only, each judged against Brief §4.5 (elevated third-person orbit camera, player-rotatable yaw, damped follow with look-ahead), §5.4 (dodge roll with i-frames, soft lock-on, hit-stop, ground telegraphs), §6 (full gamepad, touch = virtual joystick + three action buttons + swap, 44 px minimum, remappable) and §7.1 (fixed-step 60 Hz sim with interpolated rendering).

### Core model

| Element | Verdict | Reasoning |
|---|---|---|
| One active hero + three AI companions | **KEEP** | It is the game's identity — the whole family is on screen, and switching is the core verb. Nothing in §4–§7 argues against it. |
| Instant, cooldown-free, animation-free switching | **KEEP** | The zero-friction swap is what makes the four-hero kit feel like one moveset. Adding a swap cooldown would make the ability-gated dungeon rooms (L7328) tedious. |
| Ult charge persisting on companions as the reason to swap | **KEEP** | This is the switching economy and it works; §5.5 requires carrying the ability kit forward as data anyway. |
| `1`–`4` direct-select + portrait click | **KEEP**, and **ADAPT** for pad/touch | Add D-pad direct-select and a bumper cycle for gamepad, and the §6 "swap" touch button; keep `1`–`4` on keyboard. |
| No selection ring in the world | **CHANGE** | At an orbit camera distance with four similar-scale low-poly characters, the HUD portrait border is not enough. Add a diegetic ground ring or light pool under the active hero; §6's "soft light rings" HUD language should have a world-space counterpart. |
| Three control modes (`classic`/`hybrid`/`manual`) | **CHANGE** | `classic` (face-the-cursor) is meaningless under a rotatable orbit camera, and three modes on one cycling key is a discoverability failure. Collapse to one camera-relative scheme plus an explicit "hold to aim" modifier, and move any remaining choice into the settings page. |

### Input layer

| Element | Verdict | Reasoning |
|---|---|---|
| `keyBinds` action-name indirection | **KEEP** | Already the right abstraction; §6 requires remappable, and this is a clean base for a per-device binding map. |
| Rebind UI covering only 12 of 20 actions, single-key replacement | **CHANGE** | §6 says remappable, full stop. Every action, primary + secondary slots, per-device (keyboard / pad / touch), conflict detection. |
| `localStorage` binding persistence | **ADAPT** | Fold into the versioned settings schema with migrations (§7.1) rather than its own key. |
| Keyboard/mouse coverage | **KEEP** | Bindings are sensible; port the defaults as-is. |
| Mouse aim (`classic`) | **CHANGE** | See control modes above; replace with camera-relative movement + right-stick/mouse-look yaw (§4.5) and soft lock-on for targeting. |
| Click-to-attack direction (`hybrid`) | **ADAPT** | Keep "attack in the direction I indicate" as the fallback when nothing is locked on; feed it from the lock-on target when one exists. |
| Auto-attack when a target is in range | **ADAPT** | This is why v27 is playable one-handed by a small child and it should survive — but as an accessibility/assist option, defaulted on for the youngest players, with a manual mode that is a real mode rather than the current half-broken `manual`. |
| Unconditional perfect auto-aim on projectiles | **CHANGE → soft lock-on** | §5.4 asks for soft lock-on explicitly. Replace the invisible hard aim with a visible lock-on reticle, a lock-on toggle/hold key, and a bounded aim-assist cone. |
| No gamepad | **CHANGE (new build)** | §6 requires full gamepad. Nothing to port; design fresh: left stick move, right stick camera yaw (§4.5), A/X attack, B/circle dodge, X/square signature, Y/triangle ultimate, RB combo, LB/RB or D-pad swap, LT soft lock-on. |
| Virtual joystick, floating origin, left half, R=60, dead zone 0.15 | **KEEP the feel, ADAPT the numbers** | Floating origin on the left half is correct for kids' thumbs. Fix the 55-vs-60 draw/input mismatch, and re-derive the radius from screen DPI rather than raw pixels. |
| Three touch buttons (ATK/ULT/ACT) at r30/r25/r25 with +10 pad | **ADAPT** | §6 requires 44 px minimum and a **swap** button. Current effective hit areas (80/70 px diameter) already pass; the *drawn* r25 circles (50 px) are borderline. Add the swap button, add signature, and respect safe-area insets — none exist today. |
| Duplicate legacy touch handler + duplicate dungeon buttons | **DROP** | Quirks 5 and 6. One touch system. |
| Hold vs tap: movement polled, actions edge-triggered, no repeat guard | **ADAPT** | Add explicit press/hold/release semantics and the §6 hold-vs-toggle accessibility option (lock-on, sprint, aim). |
| No input buffering | **CHANGE** | With a fixed 60 Hz sim (§7.1) a proper ~150 ms input buffer is cheap and is the single biggest "feels responsive" win available. The v27 one-slot `forceAtk` latch with no expiry is the worst of both worlds. |
| No focus/blur key flush | **CHANGE** | Trivial fix, real bug (quirk 11). |

### Companion AI

| Element | Verdict | Reasoning |
|---|---|---|
| Companions never use ultimates or signatures | **KEEP** | Load-bearing. It is what gives switching a purpose and keeps the player as the source of every big moment. Do not "improve" this into an AI that spends the ult you were saving. |
| Passive/aura skills running on companions | **KEEP** | Already correct, and makes party-wide skill-tree investment meaningful. |
| Nearest-target selection | **ADAPT** | In 3D with ground telegraphs and multi-phase bosses, pure nearest is too dumb — add "prefer the player's lock-on target" and "prefer the thing attacking a downed ally", but keep it simple and readable. |
| `fd = 45 + idx*10` conga-line follow | **CHANGE → formation slots** | At an orbit camera distance three companions stacking on one point reads as a blob. Give each a formation offset relative to the player's facing; keep the stepped speed ramp (×1.6 / ×1.2 / ×1.0), which is what makes them feel eager. |
| The ~45 % combat-speed damping bug | **CHANGE, deliberately** | Fix it, then re-tune the speed multipliers down to land back near the v27 feel. Fixing it silently will make companions feel twitchy. |
| Ranged kite band (`idealDist = rng*0.7`, back off < 0.4×, close > 1.3×, sine strafe in the pocket) | **KEEP** | This is a genuinely good, cheap kiting behaviour and it reads well; port the constants verbatim and re-tune only for the new world scale. |
| Melee charge at 1.15× then hard brake (`×0.85`/frame) | **KEEP** | Same reason. |
| 400 px teleport leash as the only unstick | **CHANGE** | Unacceptable with a 3D camera — you will watch it happen. Replace with real navigation (Rapier/BVH raycast steering or a navmesh, §7.1) plus a *fade-out/fade-in* teleport as a last-resort recovery after N seconds stuck. |
| No retreat, no heal-seek, no telegraph avoidance | **CHANGE** | §5.4 makes ground telegraphs the core boss language. Companions that stand in every AoE will make the new bosses feel unfair. Minimum viable: step out of a telegraph, and disengage below a HP threshold. |
| `threatRange` 200/300 and the `d<300` leader gate | **KEEP as tunables** | The "disengage when the player backs off" behaviour is good design — it lets a player reset a fight. |
| Caged (Kid Snatch) removing companions from the sim | **KEEP** | The mechanic is family canon (§1) and the 1-vs-boss control state is the best fight in the game. §6 already asks for a "captured-hero overlay". |
| Kid Snatch exempting the active hero | **KEEP** | Non-negotiable: it is what makes the phase solvable. |

### Movement, camera and combat

| Element | Verdict | Reasoning |
|---|---|---|
| Per-hero base speeds (180/175/165/160) | **KEEP as data** | §5.4: port the exact kit as data. Re-scale uniformly for world units, keep the ratios. |
| `lerp(v, target, 6*dt)` acceleration | **ADAPT** | Fine feel, but move to a fixed 60 Hz step (§7.1) so the constant is frame-rate independent — the current form is *nearly* correct but the guest camera version (0.12, no `dt`) proves the pattern is being copied wrong. |
| Diagonal normalisation | **KEEP** | Correct behaviour; keep the `>1` guard so analog sticks are not clamped to full speed. |
| Melee `×0.3` speed while attacking, cleared by `setTimeout(200)` | **KEEP the rule, CHANGE the timer** | The attack-commit slowdown is good combat feel. Drive it from the animation/sim clock, never wall-clock. |
| Position-only obstacle push-out | **CHANGE** | Replace with the Rapier (or capsule-vs-heightfield) character controller from §7.1 — the current snap-out jitters against every rock. |
| Dungeon tile collision (4-corner, r10) | **DROP** | Superseded by real 3D collision. |
| No dodge/dash verb | **CHANGE → universal dodge roll** | §5.4 requires it. **But**: Noah's `Dodge Roll` signature (0.4 s, 200 px/s, full i-frames, 4 s cd) and Liam's `Shield Bash` half-i-frame lunge are family canon ability names and must survive as *signatures*, not be absorbed into the new universal dodge. Give everyone a dodge; keep Noah's roll as his distinct, stronger, damage-free reposition. |
| Camera: `lerp(cam, hero, 5*dt)`, no look-ahead, world-edge clamp | **ADAPT** | Keep the damping character. Add the §4.5 look-ahead, fixed 45–55° pitch, player-rotatable yaw (Q/E, right stick, two-finger drag). The world-edge clamp becomes irrelevant on floating islands (§5.1). |
| `WORLD_ZOOM` as a canvas transform | **CHANGE → FOV / boom length** | A 2D artifact. Preserve the *player-facing* idea — a zoom preference with three steps — as an orbit-distance setting. |
| Hard camera snap on auto-switch and on hero-down | **ADAPT** | A cut is right for the down event (it is an emergency), but a 3D cut is more disorienting than a 2D one. Use a fast eased blend (~0.15 s) plus a hit-stop beat, not an instant teleport. |
| `screenShake` clamped to 25, linear decay, applied after the clamp | **KEEP the profile** | Port the intensity/duration pairs verbatim (they are catalogued in ATMOSPHERE_RECIPES) and expose §6's shake-intensity slider. |
| Instant hit-scan melee with a 120° cone | **ADAPT** | Keep the cone and the instant resolution for readability, but add the §5.4 hit-stop and hit-flash so a landed hit has weight. Isabella's 360° `whirl` should stay 360°. |
| Signature and ultimate on `E` and `R`/`0` | **KEEP** | Good defaults; map to face buttons on pad and to touch buttons. |
| Ultimate banner hard-coded to `SPACE` | **CHANGE** | All prompts must render from the live binding for the active device (§6). |

### Combo ultimates

| Element | Verdict | Reasoning |
|---|---|---|
| Six pairs, damage `(ah.dmg + p.dmg) * mult`, origin at the pair midpoint | **KEEP as data** | §5.5 carries the kit forward; the midpoint origin is what makes positioning matter. |
| Both ults consumed, both must be charged | **KEEP** | The cost is what makes it a decision. |
| 100 px proximity requirement | **KEEP, and make it visible** | It is the reason companion follow distance matters. Today it is invisible; in 3D, draw the pairing tether/ring so the player understands the rule. |
| Array-order pair selection | **CHANGE** | Let the player pick — hold `Q` to show the available partners, release on one; on pad, a radial. Quirk 15. |
| A single pulsing HUD pill as the only teaching | **CHANGE** | §6's scrapbook HUD plus §5.4's "combo ultimates get a short cinematic beat". Give it a partner highlight in the world, and a first-time-use prompt in the tutorial. |
| No cinematic, no hit-stop, `screenShake(15,0.6)` only | **CHANGE** | §5.4 explicitly asks for a short cinematic beat. Keep the shake profile as the tail of it. |

### Multiplayer

| Element | Verdict | Reasoning |
|---|---|---|
| Host-authoritative, one hero per player, unassigned heroes fall back to AI | **KEEP** | The right model, and it degrades gracefully — a disconnect turns a player's hero back into a companion with no state change. |
| Host is P1 and cannot have their hero taken | **KEEP** | Simple, and it matches the family reality of Dad hosting. |
| Guest-requested switch arbitrated by the host with clear refusal messages | **KEEP** | Good UX already. |
| Auto-assign on join and on cage rescue | **KEEP** | The rescue hand-off is a lovely touch — a kid joins and gets their own character the moment you free them. |
| `PLAYER_COLORS` = blue / green / orange / pink | **ADAPT** | They collide with hero canon colours (Liam blue, Noah orange). Player identity and hero identity need to be visually separable in 3D; keep four distinct player accents but re-derive them so they never read as a hero colour. |
| `P1`/`P2` text badge above the hero | **ADAPT** | Port to a 3D billboard nameplate that fades with distance. |
| 30 Hz snapshots, 50 ms interpolation delay, 4-deep buffer | **ADAPT** | §7.1's fixed-step deterministic sim supersedes the ad-hoc snapshot format; keep the interpolation-delay idea and the RTT-coloured connection dot. |
| Guest sends raw hard-coded keys | **CHANGE** | Send a normalised intent packet (move vector, action bitfield, aim angle) resolved through the guest's own bindings. Quirk 9. |
| Guest cannot pause; sees a "waiting for host" overlay | **KEEP** | Correct for a host-authoritative family game. |
| `COOP_ABILITIES` reachable only by guests; `COMBO_ULTS` only by the host | **CHANGE** | A design accident, not a design. Both systems should be available to every player, with the co-op abilities gated on `playerCount > 1` as they are today. |
| Guest click angle computed against a 50 ms-stale interpolated position | **ADAPT** | Client-side prediction for the guest's own hero would fix the worst of it; at minimum, predict locally and reconcile. |

### Menus, pause, dev

| Element | Verdict | Reasoning |
|---|---|---|
| Direct hotkeys per screen (`T`/`I`/`J`/`B`) | **KEEP** | Fast and kid-friendly; §6's scrapbook is a page metaphor, and direct page hotkeys fit it. |
| Skill tree / inventory / journal pausing; bestiary not | **CHANGE** | Inconsistent. One rule: any full-screen scrapbook page pauses. |
| `paused` as a single loop gate with rendering continuing | **KEEP** | Simple and correct. |
| `netHostUpdate` running while paused and draining guest input | **CHANGE** | Guest inputs are silently eaten. Buffer or drop explicitly. |
| No focus handling | **CHANGE** | Quirk 11. |
| Dev console on `Ctrl+Shift+D` with `window`-exported commands, and `DEV_MODE` via F2 or 5 title taps | **KEEP** | §5.5 keeps the dev console and §7.1 wants Puppeteer smoke tests driven through it. Port the whole surface, including boss-phase scenarios like `devGoblinKing(1)`, and formalise the `window` API as the test harness contract. |
| God mode via prototype monkey-patch | **ADAPT** | Same capability, but as a proper flag in the damage pipeline rather than a runtime patch, so it survives a TypeScript strict build. |
| Any click restarts after game over | **CHANGE** | Explicit button. Quirk 16. |

---

*Written from `docs/legacy/stewart-squad-v27.html` (9,901 lines). Line numbers verified 2026-09-06.*
