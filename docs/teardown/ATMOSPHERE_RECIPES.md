# ATMOSPHERE_RECIPES — the layering that made v27 feel magical

Every atmosphere, particle, shake, lighting and choreography recipe in `docs/legacy/stewart-squad-v27.html` (9,901 lines), with exact values, legacy line citations, the perceptual reason each one works, and its Three.js equivalent per `docs/BRIEF.md` §4.3–4.4.
Source of truth is the HTML, not the legacy docs; where the brief says "v26" and the file says v27, the file wins, and v27-only additions are marked.

---

## Table of contents

1. [Render pipeline & layer order](#1-render-pipeline--layer-order) — the frame recipe everything else plugs into
2. [Day/night cycle](#2-daynight-cycle)
3. [Aurora](#3-aurora)
4. [Weather](#4-weather)
5. [Ambient biome particles (overworld, always on)](#5-ambient-biome-particles-overworld-always-on)
6. [Fog of war & dungeon ambient darkness](#6-fog-of-war--dungeon-ambient-darkness)
7. [Ground & biome rendering](#7-ground--biome-rendering)
8. [Dungeon atmosphere particles & torches](#8-dungeon-atmosphere-particles--torches)
9. [Particle system & every recipe](#9-particle-system--every-recipe)
10. [Screen shake & hit-stop](#10-screen-shake--hit-stop)
11. [Grandpa Ed & the biplane](#11-grandpa-ed--the-biplane)
12. [Parachute crates](#12-parachute-crates)
13. [Boss intro letterbox & cutscene letterbox](#13-boss-intro-letterbox--cutscene-letterbox)
14. [Damage numbers](#14-damage-numbers)
15. [Lighting, glow & full-screen tints](#15-lighting-glow--full-screen-tints)
16. [Hero drawing style (for the 3D character brief)](#16-hero-drawing-style-for-the-3d-character-brief)
17. [UI atmosphere — the look being replaced](#17-ui-atmosphere--the-look-being-replaced)
18. [Not found in the source](#18-not-found-in-the-source)
19. [The three recipes most responsible for the magic](#19-the-three-recipes-most-responsible-for-the-magic)

---

## 1. Render pipeline & layer order

`render()` at **L9339–9410**. The whole "magic" is this stack; nothing here is one clever effect, it is nine cheap ones composited in a fixed order every frame at a fixed `WORLD_ZOOM=1.30` (L590–592).

| # | Layer | Call | Line |
|---|---|---|---|
| 0 | clear + `beginWorldZoom()` (scale 1.30 about screen centre) | `beginWorldZoom()` | L9339, L591 |
| 1 | Ground tiles + biome blend + detail tufts + biome watermark | `drawGround()` | L3297 |
| 2 | Y-sorted world entities (obstacles, spawners, cages, loot, equips, enemies, mini-bosses, boss, Shadow Queen, heroes, dungeon entrances, NPCs, Ed, escort, waypoints, merchant, flavor markers, quest items, secrets, bounty board) | `drawables.sort(a.y-b.y)` | L9341–9377 |
| 3 | Arena telegraphs, ability VFX | `drawArenaEffects()`, `drawAbilityVFX()` | L5050, L1750 |
| 4 | Projectiles (with 8-sample trails) | `Proj.draw` | L1755 |
| 5 | Particles | `Part.draw` | L1728 |
| 6 | Biplane + parachute crates + smoke trail | `drawBiplane()` | L6152 |
| 7 | Weather overlay + weather particles + **aurora** | `drawWeather()` | L1642 |
| 8 | World-event effects (blood-moon tint, healing spring, shadow pools) | `drawWorldEventEffects()` | L6348 |
| 9 | Portal | `drawPortal()` | L5721 |
| 10 | **Fog of war** (radial hole punched in a dark plate) | `drawFog()` | L3329 |
| 11 | **Day/night tint** (flat colour wash) | `drawDayNightTint()` | L3337 |
| 12 | Alien crater — deliberately drawn *after* fog so it glows through the darkness | `drawCrater()` | L5809, called L9383 |
| 13 | `endWorldZoom()`, then **world vignette** (always on) | `drawWorldVignette()` | L3355 |
| 14 | Level-up flash, low-HP pulse, damage vignette, crater vignette | inline + `drawVignette()` | L9385, L3361 |
| 15 | HUD, boss bars, minimap, announcements, dialogue | various | L9386–9409 |

**Why it works.** Fog of war and the day tint are applied *after* everything world-space but *inside* the world zoom, so they read as air between the camera and the scene rather than as a UI filter. The crater breaking that rule (drawn after fog) is the single "this thing is not of this world" cue in the game.

**3D equivalent.** Layers 1–6 become scene geometry + `InstancedMesh` + `Points` systems. Layers 7–14 become the post stack (§4.4 item 6): exponential-squared height fog tinted to the island palette (fog of war), a sky-dome/hemisphere keyframe blend (day tint), selective bloom (crater/portal/torch glow), a vignette pass (world vignette), and short-lived screen-space flashes as a fullscreen quad in the composer. The "crater drawn after fog" trick becomes a bloom-only emissive layer that ignores fog — a `Layers`-masked selective-bloom pass.

---

## 2. Day/night cycle

**Lines:** `dayTime` L856, `DAY_CYCLE=240` L857, `getDayPhase()` L858–866, `getDayTint()` L867–874, `isNight()` L875, `nightXPMul()` L876, `nightEnemySpeedMul()` L877, `nightFogMul()` L878, applied at `drawDayNightTint()` L3337–3344.

### 2.1 Keyframes

One 240-second (4-minute) loop. `p = (dayTime % 240) / 240`.

| Phase | `p` range | Wall-clock in cycle | `blend` | Overlay colour | Overlay alpha |
|---|---|---|---|---|---|
| day | `p < 0.35` | 0–84 s | 0 | `rgb(0,0,0)` | **0** (no overlay drawn; `getDayTint` returns early at `a<=0`) |
| dusk | `0.35 ≤ p < 0.45` | 84–108 s | `(p-0.35)/0.1` → 0→1 | `rgb(60,20,0)` warm rust | `blend * 0.18` → 0 → **0.18** |
| night | `0.45 ≤ p < 0.75` | 108–180 s | 1 | `rgb(10,15,50)` deep navy | **0.32**, constant |
| dawn | `0.75 ≤ p < 0.85` | 180–204 s | `1-(p-0.75)/0.1` → 1→0 | `rgb(60,20,0)` warm rust | `blend * 0.18` → 0.18 → **0** |
| day | `p ≥ 0.85` | 204–240 s | 0 | — | 0 |

Night is 72 s of the 240 s loop (30%); day is 50%; the two twilights are 10% each.

**Transitions are not smooth.** Dusk ramps the warm rust in linearly over 24 s and then *hard-cuts* at `p=0.45` to the cool navy at 0.32. Dawn hard-cuts back to the warm rust at 0.18 at `p=0.75` and ramps out. The cut is a deliberate-feeling "night falls" beat rather than a bug you would notice in play.

### 2.2 What changes at night besides colour

| Effect | Value | Line |
|---|---|---|
| XP multiplier | ×1.5 | L876 |
| Enemy speed multiplier | ×1.15 | L877 |
| Fog-of-war radius multiplier | ×0.75 (300 → 225 px) | L878, L3332 |
| Sandstorm stacks on top | ×0.625 | L878 |
| Dense fog weather stacks | ×0.5625 | L878 |
| Floor | `Math.max(m, 0.5)` — never below 150 px | L878 |
| Fireflies spawn (all biomes) | 30 %/frame | L1623 |
| Forest ember motes spawn | 5 %/frame | L1633 |
| Aurora enabled (frozen biome only) | — | L1656 |
| HUD "night XP" badge shown | `hudNightXP` display toggled | L3699 |
| `nightWarrior` achievement counts kills | 10 kills at night | L2806 |

### 2.3 Overrides

- **Cutscene:** `drawDayNightTint()` returns immediately if `cutscene.active` (L3338) — cutscenes own their own sky.
- **Shadow Realm:** replaces the tint entirely with `globalAlpha 0.25` over `rgb(60,0,80)` (L3339) — a flat violet wash, no time of day.

### 2.4 Light sources at night

There is **no lightmap in the overworld.** Night is a flat coloured plate, and everything that "lights" is a `shadowBlur` glow on the object itself, drawn before the plate — so lights are *not* occluded by darkness and never brighten neighbours. The dungeon is the exception and has a real light-punch compositor (§6.2). Campfires, lanterns and spell light as *illuminators* do not exist outside the dungeon; the glow objects that read as lights at night are:

| Source | Look | Line |
|---|---|---|
| Fireflies | `#ffe066` disc, `shadowBlur 10 + sin(fl)*5`, radius `max(0.5, sz*(0.3+sin(fl)*0.7))` — the radius pulses to zero, so they *blink* | L1651 |
| Forest ember motes | `#E8A838` / `#F0C878` / `#FFF0C8`, negative gravity −5, `fric 0.99` | L1633 |
| Swamp will-o-wisps | `#7dff7d`, `shadowBlur 6 + sin(fl)*3` | L1650 |
| Projectiles | `shadowBlur 12` in projectile colour + white 40 % core | L1756 |
| Hero ultimate ring | `shadowBlur 25 + sin(gt*10)*10`, r `28 + sin(gt*8)*3` | L2519 |
| Merchant eyes | `#E8A838`, `shadowBlur 4` | L1670 |
| Dungeon-entrance glow ring + 6 orbiting motes | biome colour, alpha `0.25 + sin(t*2)*0.08` | L6835–6838 |
| Portal | `shadowBlur 30 + sin(portalT*5)*15` | L5726 |
| Alien crater teal/purple cores | radial gradients, §15.4 | L5895–5899 |

**Why it works.** The night plate is *cool and only 32 % opaque*, so the saturated ground colours survive underneath — nothing greys out. Then every emissive thing is drawn *before* the plate at full brightness with a soft blur, so the warm points punch through the cool wash. Warm-on-cool at low overlay opacity is the entire trick: contrast of temperature, not of value.

**3D equivalent.** This becomes §4.3's lighting keyframe rig, not an overlay:
- Seven keyframes (dawn / morning / noon / golden hour / dusk / night / deep night) driving `DirectionalLight` colour + intensity + elevation, `HemisphereLight` sky/ground colours, sky-dome shader uniforms, and fog colour. Tune golden hour first (Brief §4.3).
- The v27 dusk `rgb(60,20,0)` is the seed for golden-hour key `#FFD08A`; the night `rgb(10,15,50)` is the seed for a night hemisphere sky of indigo `#1B2A5A` over pine-shadow ground.
- Keep the *proportions* (50 % day, 30 % night, 10 % each twilight) and the 4-minute loop; make the transitions continuous (they are not in v27) but preserve the felt "snap" by putting a fast ease at the dusk→night boundary.
- Fireflies, embers and wisps become GPU `Points` systems with an additive emissive material on the bloom layer; the blink is a per-particle `sin` in the vertex shader driving both size and alpha (v27 shrinks radius to zero — keep that, it reads as a firefly not a dot).
- Night gameplay modifiers (×1.5 XP, ×1.15 enemy speed, shrunken vision) port unchanged.

---

## 3. Aurora

**Line:** `drawWeather()` tail, **L1655–1656** (v19 feature). A second, smaller aurora lives on the frozen dungeon entrance arch, **L6974–6978**.

### 3.1 Sky aurora — trigger and math

Trigger (all three must hold): `!inDungeon && isNight() && getBiome(cam.x + W/2, cam.y + H/2) === 'frozen'`.

`auroraT = gt * 0.3` (gt is elapsed seconds).

Three horizontal bands, `ai19 = 0..2`:

| Band | `ay` (screen y, px) | Gradient stop 0.3 | Gradient stop 0.7 |
|---|---|---|---|
| 0 | `30 + sin(auroraT)*10` → 20–40 | `#00b894` teal-green | `#00cec9` cyan |
| 1 | `45 + sin(auroraT+1.5)*10` → 35–55 | `#6c5ce7` indigo | `#a29bfe` lavender |
| 2 | `60 + sin(auroraT+3.0)*10` → 50–70 | `#fd79a8` rose | `#e84393` magenta |

Each band: `createLinearGradient(0, ay, W, ay)` — **horizontal**, with stops `0: transparent`, `0.3: colA`, `0.7: colB`, `1: transparent`; `globalAlpha = 0.12 + sin(auroraT*0.5 + ai19)*0.05` (range **0.07–0.17**); filled as `fillRect(0, ay-5, W, 10)` — a flat 10-px-tall screen-space strip.

So: three 10-px ribbons at the top of the screen, drifting ±10 px vertically at 0.3 rad/s with a 1.5-rad phase offset each, each fading in and out independently at a slightly different phase.

**Why it works.** It is geometrically trivial — three rectangles — but it wins on three counts: (1) *screen-space*, so it never parallaxes away and always reads as "sky, very far"; (2) the three bands use **three different hue families** (green, violet, magenta) which is what real aurora photography looks like and what a single-hue ribbon never achieves; (3) the per-band alpha and position oscillators are at incommensurate phases, so the pattern never visibly loops. It is also *rare* — night, frozen biome only — which is why players remember it.

### 3.2 Ice-arch aurora shimmer (dungeon entrance, frozen)

`globalAlpha = 0.15 + sin(t*2)*0.05`; `createLinearGradient(sx-30, sy-74, sx+30, sy-64)` with stops `0 rgba(100,200,255,0)`, `0.3 rgba(100,200,255,0.5)`, `0.5 rgba(160,100,255,0.4)`, `0.7 rgba(100,200,255,0.5)`, `1 rgba(100,200,255,0)`; filled as `fillRect(sx-40, sy-78 + sin(t*3)*2, 80, 14)`.

**3D equivalent.** A large curved aurora plane (or a ring of camera-facing quads) high on the sky dome, with an additive shader: 3–5 vertical curtain bands, each a `sin`-warped ribbon with per-band hue from the Frozen palette (`#5FFFAF` aurora green, `#E56BFF` aurora magenta, plus an indigo `#6c5ce7`), alpha animated by three incommensurate `sin` terms, depth-write off, on the bloom layer. Curtains should *hang* (vertical falloff) rather than be flat strips — 3D can afford the extra dimension v27 could not. Keep the trigger (Frozen island, night) and the 0.07–0.17 alpha band: the v27 aurora is faint, and faint is why it reads as sky rather than as decal.

---

## 4. Weather

**Lines:** banner **L1602**, tables L1604–1606, `updWeather()` **L1608–1641**, `drawWeather()` **L1642–1656**.

### 4.1 State machine

```
var WEATHER_TYPES=['clear','rain','storm','snow','sand','fog'];
var WEATHER_BIOME={forest:['clear','clear','rain','storm','fog'],
                   cave:['clear','clear','clear','snow'],
                   desert:['clear','clear','clear','sand','sand','storm'],
                   swamp:['clear','rain','rain','fog','fog','storm'],
                   frozen:['clear','clear','snow','snow','snow']};
var weather={type:'clear',timer:90,transT:0,flashT:0,strikeT:rnd(8,12),
             strikeX:0,strikeY:0,strikeWarn:-1};
```
Pools are weighted by repetition (desert is 3/6 clear and 2/6 sand; frozen is 3/5 snow). Duration: `clear` → `rnd(60,120)` s, anything else → `rnd(20,60)` s; `transT = 2` s cross-fade counter (decremented but not actually read by the draw code). Skipped entirely in dungeons. On change: `announce(weatherName+'!', '#94C4DC', 2)`, or `announce('The weather clears.', '#dfe6e9', 2)`.

### 4.2 Particle recipes

All spawn into `weatherP`; draw alpha is `clamp(life/ml,0,1) * 0.7` (L1648). Caps: `MAX_WEATHER = 80` (L618), plus hard trims at 500 `weatherP` and 800 `parts` (L1640–1641).

| Type | Spawn rate | Spawn box | Velocity px/s | Life / `ml` | Size | Colour | Draw |
|---|---|---|---|---|---|---|---|
| **rain** | 3 per frame | `x: cam.x+rnd(-20,W+20)`, `y: cam.y+rnd(-40,H*0.3)` | `vx rnd(-30,-10)`, `vy rnd(300,450)` | `rnd(0.8,1.5)` / 1.5 | `rnd(1,2)` | `rgba(116,185,255,0.5)` | streak: `stroke rgba(150,200,255,0.7)`, lw 1.5, from `(sx,sy)` to `(sx+vx*0.02, sy+12)` |
| **storm** rain | **5** per frame | same | same | same | same | same | same |
| **snow** | 60 %/frame | `y: cam.y-10` | `vx rnd(-30,30)`, `vy rnd(30,80)` | `rnd(3,6)` / 6 | `rnd(2,4)` | `rgba(255,255,255,0.7)` | rotated disc, `rot rnd(0,TAU)`, `rv rnd(-2,2)` rad/s |
| **sand** (weather) | 50 %/frame | `x: cam.x-10`, `y: cam.y+rnd(0,H)` | `vx rnd(120,220)`, `vy rnd(-10,10)` | `rnd(1,2)` / 2 | `rnd(1,3)` | `rgba(210,180,100,0.4)` | disc |
| **sand** heavy dust (into `parts`, L1636) | 2 %/frame | `x: cam.x-20` | `vx rnd(100,200)`, `vy rnd(-10,10)` | `rnd(3,5)` | `rnd(4,8)` | `#8B7355` | disc, `grav 0`, `fric 1.0` (no drag — it crosses the whole screen) |

Rain streaks are drawn from the particle's *own velocity* (`vx*0.02` horizontal, fixed 12 px vertical), so the lean of the rain and the wind direction agree for free.

### 4.3 Full-screen weather overlays (`drawWeather`, L1643–1644)

| Weather | Fill | Applied |
|---|---|---|
| fog | `rgba(200,200,200,0.25)` | overworld only |
| sand | `rgba(194,154,100,0.2)` | overworld only |
| rain | `rgba(10,10,30,0.08)` | overworld only |
| storm | `rgba(10,10,30,0.2)` | overworld only |

Note both fog and sand are *tinted*, not grey-on-grey — sand is a warm ochre haze, fog is only 25 % and cool. This is exactly the anti-pattern the Brief's anti-palette forbids, avoided.

### 4.4 Lightning (storm only)

`updWeather` L1611–1613.

| Beat | Value |
|---|---|
| First strike after storm begins | `strikeT = rnd(4,8)` s |
| Subsequent interval | `strikeT = rnd(10,18)` s |
| Strike position | `hero.x + rnd(-400,400)`, `hero.y + rnd(-400,400)`; if within 200 px of the previous strike, pushed a further ±200 px away — so strikes never cluster |
| Telegraph (`strikeWarn`) | **1.0 s** |
| Telegraph draw (L1647) | two rings, r **60** and r **30**, `stroke #E8A838`, lw 2, `globalAlpha = 0.3 + sin(strikeWarn*15)*0.3` → 0.0–0.6, pulsing at ~2.4 Hz |
| Strike | `flashT = 0.12` s, `snd('boom', 0.3)` |
| Damage | **30** to every enemy within **60 px** |
| Sparks | 12 particles, angle `rnd(0,TAU)`, speed `rnd(60,180)`, life **0.3**, size `rnd(2,5)`, colour `pick(['#fff','#6B8EC8','#a29bfe'])`, `fric 0.9` |

**Screen flash envelope** (L1646) — the best-tuned three lines in the file:

```js
var fA = weather.flashT > 0.06
       ? clamp(weather.flashT*6, 0, 0.45)              // 0.12→0.06 s: 0.72 clamped to 0.45, falling to 0.36
       : clamp(Math.sin(weather.flashT*180)*0.12, 0, 0.12);  // 0.06→0: a second, tiny ~0.06 s ripple
ctx.fillStyle='rgba(255,255,255,'+fA+')'; ctx.fillRect(0,0,W,H);
weather.flashT -= 1/60;
```

A hard white hit capped at **0.45** for the first ~3.6 frames, then a second sub-flash peaking at **0.12** — a double-strike. Total 0.12 s. Thunder is not delayed: `snd('boom',0.3)` fires on the same frame as the flash (L1613).

**Why it works.** The 1-second amber telegraph converts a random screen flash into a *readable threat* — the player learns the ring means "move" — and the double-flash envelope is what real lightning does. Because the flash is a white plate over the already-darkened storm overlay (`rgba(10,10,30,0.2)`), the contrast swing per strike is enormous relative to the baseline, which is why a 0.12-second effect feels like weather rather than a UI blink.

**3D equivalent.**
- Rain/snow/sand → three `Points` systems with a camera-locked spawn volume (v27 spawns in camera space; keep that — it is why the cost is constant). Rain as stretched billboards oriented along velocity; snow as flat-shaded rotating quads; sand as a long-lived streaming volume with zero drag.
- Overlay tints → the fog colour and density, animated per weather type (`FogExp2` colour lerp to `rgba(194,154,100)` for sandstorm, cool for rain), *plus* a low-opacity fullscreen colour grade in the composer. Never grey (Brief §4.2 anti-palette).
- Lightning → an actual `DirectionalLight`/`PointLight` flash that lights geometry (Brief §4.4 item 4 requires "lightning flashes that light the scene"): key intensity spike with the same double-envelope (0.45-equivalent for 0.06 s, then a 0.12-equivalent ripple), plus a bloom spike and a bolt mesh. Keep the amber 1-second ground telegraph decal — it is a gameplay affordance, not decoration.
- Weather must keep sound, visibility and gameplay effect (Brief §4.4 item 4): the `nightFogMul` visibility multipliers below are the gameplay effect.

---

## 5. Ambient biome particles (overworld, always on)

**Lines:** L1622–1638 inside `updWeather()`. These run *regardless of weather* and are the "nothing is empty" layer.

| Biome / condition | Rate | List | Velocity px/s | Life / `ml` | Size | Colour | Special |
|---|---|---|---|---|---|---|---|
| **Any, night** — fireflies | 30 %/frame | `weatherP` | `vx,vy rnd(-15,15)` | `rnd(3,6)` / 6 | `rnd(2,4)` | `#ffe066` | `shadowBlur 10 + sin(fl)*5`; radius `max(0.5, sz*(0.3 + sin(fl)*0.7))`; `fl += dt*4` → blinks off completely |
| **Forest** — falling leaves | 25 %/frame | `weatherP` | `vx rnd(-25,25)`, `vy rnd(20,55)` | `rnd(3,6)` / 6 | `rnd(2,4)` | `pick(['#B03828','#D87828','#E8A838','#38A866'])` | drawn as an ellipse `(sz*2, sz)` rotating at `rv rnd(-3,3)` rad/s |
| **Forest, night** — ember motes | 5 %/frame | `parts` | `vx rnd(-10,10)`, `vy rnd(-15,-5)` | `rnd(2,4)` | `rnd(1.5,3)` | `pick(['#E8A838','#F0C878','#FFF0C8'])` | `grav -5` (rises), `fric 0.99` |
| **Swamp** — wisps | 20 %/frame | `weatherP` | `vx rnd(-8,8)`, `vy rnd(-12,-3)` | `rnd(3,6)` / 6 | `rnd(2,3)` | `#7dff7d` | `shadowBlur 6 + sin(fl)*3`; radius `max(0.5, sz*(0.5+sin(fl)*0.5))` |
| **Swamp** — marsh bubbles | 3 %/frame | `parts` | `vx 0`, `vy rnd(-20,-10)` | `rnd(0.5,1.5)` | `rnd(2,5)` | `rgba(100,200,100,0.4)` | `grav -15` |
| **Desert** — sand stream | 40 %/frame | `weatherP` | `vx rnd(50,110)`, `vy rnd(-5,5)` | `rnd(2,4)` / 4 | `rnd(1,2)` | `rgba(210,180,100,0.4)` | — |
| **Cave** — dust | 12 %/frame | `weatherP` | `vx rnd(-8,8)`, `vy rnd(-12,5)` | `rnd(3,5)` / 5 | `rnd(1,3)` | `rgba(200,200,220,0.3)` | — |
| **Cave** — crystal sparkles | 2 %/frame | `parts` | `vx rnd(-5,5)`, `vy rnd(-10,-3)` | `rnd(0.5,1)` | `rnd(1,2.5)` | `pick(['#6B8EC8','#a29bfe','#dfe6e9'])` | `grav 0`, `fric 0.99` |
| **Frozen** — snowfall | 45 %/frame | `weatherP` | `vx rnd(-30,30)`, `vy rnd(30,70)` | `rnd(3,6)` / 6 | `rnd(2,4)` | `rgba(255,255,255,0.7)` | rotating |

Note the deliberate asymmetry: forest gets *two* systems (leaves + night embers), swamp gets two (wisps + bubbles), cave gets two (dust + sparkles). Each biome therefore has at least one always-on and one occasional layer, which is what stops any biome from reading as empty.

**Why it works.** Direction is the signature. Leaves fall, embers rise, sand streams sideways, wisps drift up-slow, snow falls fast. You can identify the biome from the motion alone with the colours removed — that is why the world feels like five places rather than one recoloured place.

**3D equivalent.** Brief §4.4 item 3 names these exactly: pollen and fireflies (Forest), sand streams (Desert), spores and wisps (Bog), snow and ice glitter (Frozen), embers (Shadow). One `Points` system per biome, spawned in a camera-following box, with the *same* direction signature and the same two-layer rule (one always-on, one occasional). Fireflies and wisps go on the bloom layer with the size-to-zero blink preserved.

---

## 6. Fog of war & dungeon ambient darkness

### 6.1 Overworld fog of war — `drawFog()` **L3329–3335**

```js
var fogR = 300 * nightFogMul();
ctx.save();
ctx.fillStyle='rgba(10,10,30,0.65)';
ctx.beginPath(); ctx.rect(0,0,W,H); ctx.arc(sx,sy,fogR,0,TAU,true); ctx.fill();   // hard hole
var grd=ctx.createRadialGradient(sx,sy,fogR*0.7,sx,sy,fogR);
grd.addColorStop(0,'rgba(10,10,30,0)'); grd.addColorStop(1,'rgba(10,10,30,0.55)');
ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx,sy,fogR,0,TAU); ctx.fill();        // soft edge
ctx.restore();
```

| Value | |
|---|---|
| Base radius | **300 px** (world units, inside the 1.30 zoom) |
| Night radius | 225 px |
| Night + sandstorm | 187.5 px |
| Night + dense fog | 168.75 px |
| Hard floor | 150 px (`Math.max(m,0.5)`) |
| Plate colour | `rgba(10,10,30,0.65)` — the same deep navy as the night tint |
| Feather | inner 70 % clear, gradient `0 → 0.55` alpha over the outer 30 % (90 px at day radius) |
| Entity cull radius | `FOG_R = 320 * nightFogMul()`, `vis(e) = dst(e,h0) <= FOG_R + 50` (L9340) — culling is 20 px *wider* than the visual fog so nothing pops in at the edge |
| Suppressed | during cutscenes (L3330) |
| Follows | the *locally controlled* hero (guest gets `NET.guestHeroes[playerId]`), falling back to the first living hero if downed |

**Why it works.** The plate colour is identical to the night tint colour, so at night the fog edge and the sky wash merge into a single believable darkness rather than reading as two stacked filters. The 30 % feather is generous enough that the circle is never a hard vignette, and the cull radius being wider than the visible radius means the world always *finishes* before it disappears.

### 6.2 Dungeon ambient darkness — offscreen light compositor, **L8007–8029**

This is the only real lighting system in v27, and it is a **destination-out light punch** on a second canvas.

```
DNG_AMBIENT (L842):
  forest    rgba(8,20,10,0.70)     cave      rgba(12,10,28,0.72)
  desert    rgba(40,28,8,0.62)     swamp     rgba(8,18,8,0.72)
  frozen    rgba(8,14,35,0.73)     volcanic  rgba(35,8,4,0.65)
  citadel   rgba(18,8,28,0.72)     default   rgba(10,10,30,0.75)
```

Every ambient is a **tinted** darkness, never neutral black: forest darkness is green-black, desert darkness is *warm brown* at only 0.62 (the brightest dungeon), volcanic is red-black at 0.65, frozen is blue-black at 0.73 (the darkest).

Procedure per frame (`_lightCvs`, a full-size offscreen canvas, L8008–8009):

1. Fill room rect with `DNG_AMBIENT[currentDungeon]`.
2. `globalCompositeOperation = 'destination-out'` — everything below *erases* darkness.

| Light | Radius | Gradient stops (erase strength) |
|---|---|---|
| **Hero** | 120 px, **180 px in boss rooms** | `0: rgba(255,220,150,1)`, `0.4: 0.7`, `0.7: 0.3`, `1: 0` |
| **Torch** | `br(50) + flVal*8` → 42–58 px, flickering | `0: rgba(255,180,80, fop)` where `fop = 0.8 + flVal*0.15` (0.65–0.95), `0.5: rgba(255,150,50, fop*0.4)`, `1: rgba(255,120,30,0)` |
| **Projectile** | 25 px (`sz<4`), 35 px (`sz<8`), else 45 px | `0: rgba(255,255,200,0.7)`, `1: 0` |
| **Enemy** | 35 px | `0: rgba(255,100,100,0.3)`, `1: 0` |
| **Boss** | 60 px, **80 px enraged** | `0: rgba(255,200,100,0.5)` or `rgba(255,80,80,0.6)` enraged, `1: 0` |

3. Back to `source-over`; if the boss is enraged, add `rgba(180,0,0,0.06)` over the room.
4. `ctx.drawImage(_lightCvs, 0, 0)` onto the main canvas.
5. **Atmosphere particles are drawn last, on top of the darkness** (L8031) at `alpha = al * (life/ml) * 0.7` — so motes glow through the dark instead of being dimmed by it.

The hero light's four-stop falloff (1 / 0.7 / 0.3 / 0) is a soft-shouldered curve, not linear — the pool has a bright centre, a long mid, and a gentle rim. Torch light is *synced to the flame oscillator* (`trc._flVal` is written by the flame drawing code at L7947 and read by the light code at L8018), so the flicker of the flame and the flicker of its pool are the same signal. That single shared variable is why dungeon torchlight feels alive.

**3D equivalent.**
- The ambient plate becomes **fog colour + hemisphere ambient** per dungeon, keeping the *tinted* darkness rule exactly (Brief §4.2 anti-palette bans gray fog and pure-black shadows).
- Hero light → a warm `PointLight` (`#FFDC96`, distance 120 world units, 180 in boss rooms) with `decay 2`. Torch → `PointLight` `#FFB450`, distance ~55, intensity driven by *the same* flicker oscillator that drives the flame billboard/mesh — keep one shared value per torch, do not re-randomise.
- Projectile / enemy / boss glows → small pooled point lights taken from the Brief §4.3 "small pool, distance-culled, warm colours" budget; cull by distance to camera and cap the pool (v27 caps implicitly by entity count — the 3D build should cap explicitly, e.g. 8 dynamic points).
- Enraged room tint → a boss-phase colour-grade LUT blend, not an added light.
- Atmo particles staying on top of darkness → put them on the bloom layer so fog does not eat them.

---

## 7. Ground & biome rendering

**Lines:** noise **L1520–1543**, biome scoring **L1546–1584**, `bioCol()` **L1586–1594**, `lerpColor()` L1595–1601, `drawGround()` **L3297–3327**, `BIOME_NAMES` L1548, minimap colours L3394.

### 7.1 Palette

```js
function bioCol(b){
  if(b==='forest')return{g:'#1E4A3A',gd:'#163828',tc:'#58B888',td:'#2E7A58'};
  if(b==='desert')return{g:'#6A4E30',gd:'#5A3E28',tc:'#E8A860',td:'#C08040'};
  if(b==='cave')  return{g:'#2A3058',gd:'#222848',tc:'#8E98D8',td:'#6870B0'};
  if(b==='swamp') return{g:'#2A4838',gd:'#1E3428',tc:'#70C090',td:'#408868'};
  if(b==='frozen')return{g:'#4A6898',gd:'#3E5478',tc:'#A8D0E8',td:'#78A8D0'};
}
```
`g` = ground fill, `gd` = ground dark (grid lines + detail tufts), `tc` = tree/feature colour, `td` = tree dark. Every ground colour is **dark and saturated** (forest `#1E4A3A` is a deep pine, not a mid-green) with a light complement at `tc` — the value contrast between `g` and `tc` is what makes trees pop off the ground. This is already the Brief §4.2 direction; the 3D palette deepens it further.

Dungeon tile palettes are separate (`DUNGEON_TILE_COLORS` L6733–6736), dungeon accent colours at `DUNGEON_COLORS` L6732, dungeon wall variants at `DNG_WALL_V` L843–844.

### 7.2 Noise-driven biome boundaries

Seeded value noise (`hashN` L1523, `smoothNoise` with Hermite smoothstep `f*f*(3-2f)` L1528, `fbmNoise` L1536 halving amplitude and doubling frequency per octave).

```js
var n1 = fbmNoise(nx*6+0.5, ny*6+0.5, 3);   // 3 octaves, high frequency
var n2 = fbmNoise(nx*4+100, ny*4+100, 2);   // 2 octaves, offset domain
var dc = Math.hypot(nx-0.5, ny-0.5);        // normalised distance from world centre
forestScore = 0.6 - dc*1.5 + n1*0.3;
caveScore   = -0.1 + (1-nx)*(1-ny)*0.8 + n2*0.35 - dc*0.2;
desertScore = -0.1 + nx*(1-ny)*0.8 + n1*0.3 - dc*0.2;
swampScore  = -0.1 + ny*0.7 + n2*0.3 - dc*0.15;
frozenScore = -0.2 + (1-ny)*0.5 + nx*0.2 + n1*0.4 - 0.15;
if(dc < 0.12) forestScore += 0.5;           // centre is always forest (home)
```
Highest score wins; cached per 60-px tile in `biomeCache`.

### 7.3 Tile draw

| Element | Value |
|---|---|
| Tile size | 60 × 60 px; filled 61 × 61 to avoid seams |
| Blend | `getBiomeBlend()` (L1577) samples 30 px in the four cardinal directions; if any neighbour differs, `lerpColor(c.g, c2.g, 0.35)` — a fixed 35 % blend, one tile deep |
| Grid line | `strokeStyle = c.gd`, `globalAlpha 0.2`, lw 1, 60 × 60 |
| Detail tuft | `hash = (gx*73 + gy*137) % 100`; if `hash < 15` (**15 % of tiles**) draw a 6-wide × 8-tall triangle in `c.gd` at `((hash*7)%40, (hash*13)%40)` inside the tile — deterministic per world position, so it never shimmers |
| World boundary | `rgba(0,0,0,0.3)`, lw 4, hidden during cutscenes |
| Biome watermark | `globalAlpha 0.15`, `bold 60px sans-serif`, white, `BIOME_NAMES[biome]` at `(heroX, heroY-100)`, only when biome ≠ forest |
| Cutscene padding | `pad = 600` px of extra ground so world edges are off-camera during the meteor cutscene |

**Why it works.** The 15 % deterministic tuft density plus the one-tile 35 % blend is the whole "hand-made" feel: boundaries are organic (noise) but never mushy (fixed blend depth), and the ground has texture that does not crawl when the camera moves.

**3D equivalent.** Ground becomes a heightfield/plane with **vertex colours** (Brief §4.7) sampled from the same fbm biome scores — keep the seeded noise and the scoring formulas verbatim so the world layout survives the port. The 15 % tuft becomes `InstancedMesh` scatter (grass, flowers, pebbles, mushrooms) driven by the *same* `(gx*73 + gy*137) % 100` hash so placement is reproducible and save-compatible. The 35 % single-tile blend becomes vertex-colour interpolation across the biome boundary. The biome watermark becomes the Brief §4.1 corner title card: location name in a serif with one line of description.

### 7.4 Dungeon-entrance biome art & always-on ambient particles

`DungeonEntrance.prototype.draw` **L6832–7000+**. Each of the seven entrances is a hand-drawn diorama: forest is a hollow ancient tree (8 canopy blobs at `#1e4d10`/`#2d6a1e`/`#245818` breathing at `1 + sin(T*2)*0.02`, a `rgba(0,0,0,0.92)` hollow, animated green mist `rgba(45,140,86, 0.12 + sin(T*1.5)*0.06)`, 4 interior fireflies at `rgba(180,255,130, 0.4+sin(T*3+i)*0.3)`, 3 hanging moss strands); cave is a rock mass with `#5dade2`/`#85c1e9`/`#aed6f1` crystal spikes under `shadowBlur 10 + sin(T*3)*5` and **8 orbiting sparkles**; frozen has the aurora shimmer of §3.2.

Always-on ambient orbiters (**L6838**, drawn when the dungeon is not yet cleared):

| Value | |
|---|---|
| Count | **6** |
| Angle | `T*0.6 + ap*1.047` (60° apart, orbiting at 0.6 rad/s) |
| Radius | `35 + sin(T*2)*5 + ap*4` → 35–74 px, staggered per mote |
| Y | `sy - 10 + sin(angle*0.7)*20 - ap*3` — a flattened, tilted orbit |
| Size | `1.2 + sin(T*2+ap)*0.6` |
| Alpha | `0.3 + sin(T*1.8 + ap*1.2)*0.15` → 0.15–0.45 |
| Colour | `DUNGEON_COLORS[biome]` |
| Ground ring | ellipse `52 + sin(T*3)*3` × `16 + sin(T*3)`, alpha `0.25 + sin(T*2)*0.08` (cleared: flat 0.15) |
| Ground shadow | `rgba(0,0,0,0.35)` ellipse 48 × 14 at `+22` |

**3D equivalent.** Each dungeon entrance becomes a hero prop with its own emissive palette, an orbiting `Points` halo of 6–8 motes on the bloom layer, a pulsing ground decal ring, and a warm/cold point light matching `DUNGEON_COLORS`. Keep the "cleared" state visibly dimming the ring to a flat low alpha — it is free progress feedback.

---

## 8. Dungeon atmosphere particles & torches

### 8.1 `DNG_ATMO` — **L846–849**

| Dungeon | Colour | Count | Speed min/max | Life min/max | Alpha min/max | Direction |
|---|---|---|---|---|---|---|
| forest | `#B8C858` pollen-yellow | 18 | 5 / 15 | 4 / 6 | 0.30 / 0.50 | drift |
| cave | `#7868A8` violet | 12 | 5 / 10 | 3 / 5 | 0.30 / 0.60 | drift |
| desert | `#E86820` ember-orange | 18 | 15 / 25 | 2 / 4 | 0.50 / 0.80 | **up** |
| swamp | `#280838` bruise-purple | 12 | 8 / 12 | 3 / 5 | 0.30 / 0.50 | **up** |
| frozen | `#E8E8F0` snow-white | 22 | 10 / 20 | 3 / 5 | 0.40 / 0.70 | **down** |
| volcanic | `#E86820` ember-orange | 20 | 12 / 22 | 2 / 4 | 0.40 / 0.70 | **up** |
| citadel_f1 | `#8850A8` | 20 | 8 / 16 | 3 / 5 | 0.30 / 0.60 | drift |
| citadel_f2 | `#7B3CA0` | 25 | 10 / 18 | 3 / 5 | 0.40 / 0.70 | **up** |
| citadel_f3 | `#A83828` | 30 | 12 / 22 | 2 / 4 | 0.50 / 0.80 | drift |

Spawn/respawn (`initDngAtmo` **L7307**, `updDngAtmo` **L7311**): size `rnd(1.5,3.5)`; `up` → `vy = -rnd(sMin,sMax)`, `vx = rnd(-3,3)`; `down` → `vy = rnd(sMin,sMax)`, `vx = rnd(-5,5)`; `drift` → `vx = rnd(-sMax,sMax)`, `vy = rnd(-sMax/2, sMax/2)`. On death or leaving the room, the particle is recycled to the opposite edge — a constant population, never a burst.

The Citadel escalates across its three floors: 20 → 25 → 30 particles, violet → deeper violet → **red**, and the alpha floor rises 0.30 → 0.40 → 0.50. The air itself tells you how deep you are.

### 8.2 Wall torches — **L7244** (placement), **L7945–7960** (draw)

| Value | |
|---|---|
| Count per room | `Math.min(wallTiles, Math.floor(rnd(4,7)))` → **4–6** |
| Placement | random wall tiles (`t===1`) adjacent to a floor tile |
| Phase | `ph = rnd(0,TAU)`; base light radius `br = 50` |
| Flicker frequency | `tFreqV = 9.4 + (ph % 2 - 0.5) * 1.2` → **8.8–10.0 Hz**, per-torch |
| Primary oscillator | `flVal = sin(gt*tFreqV + ph)` — stored on the torch as `_flVal` and reused by the light pass |
| Secondary | `flVal2 = sin(gt*tFreqV*1.7 + ph + 2)` → horizontal wobble |
| Warm halo | `rgba(255,140,40,0.06)` disc, r `14 + flVal*3` |
| Stick | `#4a2a08`, 3 × 8 px |
| Dish | `#6b3a10` 8 × 3, highlight `#7d4a18` 6 × 2 |
| Flame outer | `#e85d04` teardrop, width `3 + flVal*0.5`, height `6.5 + flVal*1.5`, offset `flVal2*1.2` |
| Flame core | `#ffd166`, 50 % width, 60 % height of the outer |

**Why it works.** Two oscillators at an irrational-ish ratio (1 : 1.7) mean the flame never repeats visibly; the per-torch base frequency (8.8–10 Hz) means a room of six torches never flickers in unison; and the *shared* `_flVal` between the flame shape and the light pool means the light and the fire agree exactly. That agreement is the difference between "a flame sprite next to a light" and "a fire".

**3D equivalent.** Flame as a small flat-shaded cone/billboard pair (outer `#e85d04`, core `#ffd166`) on the bloom layer, driven by a per-instance 8.8–10 Hz `sin` uniform; the *same* uniform scales a `PointLight` (`#FFB450`, distance ~55). Halo → bloom. Do not use a light-only flicker or a texture-only flicker; the shared signal is the recipe.

---

## 9. Particle system & every recipe

### 9.1 The `Part` class — **L1725–1730**

```js
function Part(x,y,o){this.x=x;this.y=y;this.vx=o.vx||0;this.vy=o.vy||0;
  this.life=o.life||.5;this.ml=this.life;this.sz=o.sz||3;this.col=o.col||'#fff';
  this.grav=o.grav||0;this.fric=o.fric||.98;this.txt=o.txt||null;this.fs=o.fs||16;
  this.bounce=o.bounce||false;this.bd=false;this.crit=o.crit||false;this.scalePulse=o.scalePulse||0;}
Part.prototype.update=function(dt){this.life-=dt;this.vy+=this.grav*dt;
  this.vx*=this.fric;this.vy*=this.fric;this.x+=this.vx*dt;this.y+=this.vy*dt;
  if(this.bounce&&!this.bd&&this.vy>0&&this.life<this.ml*.6){this.vy=-80;this.bd=true;}
  return this.life>0;};
```

Draw (**L1728**): `a = clamp(life/ml, 0, 1)`; **radius = `max(0.1, sz * a)`**. Alpha and radius fall together, linearly — particles *shrink as they fade*. That single choice is why v27 particles feel like sparks and dust rather than like fading circles.

Friction is applied per frame as a raw multiply (`vx *= fric`), so it is frame-rate dependent; at 60 fps `fric 0.9` is a very fast stop and `0.98` is a slow drift.

Budgets: `MAX_PARTICLES = 250`, `MAX_WEATHER = 80`, `MAX_PROJS = 150` (**L618**); `parts.length` truncated to 250 at L8188, L8819, L9302, and hard-trimmed to 800 in `updWeather` (L1641). Quality scaling: `getParticleMul()` (**L599**) returns **0.3 / 0.6 / 1.0** for low / med / high, applied to death bursts.

### 9.2 Recipe catalogue

Every value is exact. "Speed" is the polar magnitude before the angle is applied.

| Recipe | Line | Count | Angle / spawn | Speed px/s | Life s | Size | Colours | Grav | Fric | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **Footfall dust** `dust()` | L1731, called L2295 | 1, at **12 %/frame while moving** | offset `rnd(-5,5)`, `rnd(-2,2)`, at `y+10` | `vx rnd(-20,20)`, `vy rnd(-30,-10)` | 0.4 | `rnd(2,4)` | `#c4a35a` `#d4b86a` `#b8956a` | 60 | .98 | Only when `hypot(vx,vy) > 20` |
| **Crate landing dust** | L6003 | 6 | at crate | `vx rnd(-30,30)`, `vy rnd(-20,-5)` | 0.4 | `rnd(1,3)` | `#c8b88a` | 40 | .98 | + `snd('equip', 0.15)` |
| **Hit sparks** `hitFx()` | L1742 | 6 | `rnd(0,TAU)` | `rnd(60,150)` | 0.3 | `rnd(2,5)` | param, default `#fff` | 0 | **.92** | + `snd('hit', 0.12)` |
| **XP burst** `xpFx()` | L1743 | 8 | `rnd(0,TAU)` | `rnd(40,100)` | 0.6 | `rnd(2,4)` | `#3DCC7A` `#2D8C56` `#E8A838` | 80 | .95 | Also fires on health pickup |
| **Level-up burst** `levelUpBurst()` | **L5355** | **30** | `rnd(0,TAU)` | `rnd(80,250)` | `rnd(0.6,1.2)` | `rnd(2,6)` | `[hero.col, '#E8A838', '#fff']` | 150 | **.93** | Paired with `levelUpFlash = 1` |
| **Level-up screen flash** | L2714 set, L9385 draw | — | fullscreen | — | ~6 frames | — | `rgba(255,245,230, flash*0.3)` | — | — | `flash -= 0.16` per frame; peak alpha **0.30** |
| **Equip pickup ring** `equipPickupVFX()` | **L5363** | 10 | spawned **on a ring** `r rnd(30,60)`, moving **inward** | 80 | 0.5 | `rnd(2,4)` | equip colour, default `#E8A838` | 0 | .90 | + `dmgN('NEW GEAR!', '#E8A838')` |
| **Equip pickup burst** (v27, rarity-scaled) | L2027 | `8 + rarityIndex*3` (legacy items: 15) | `rnd(0,TAU)` | `rnd(60,160)` | 0.7 | `rnd(3,6)` | gear colour | 80 | .94 | Sets `hero._eqGlowT = 0.8` |
| **Equip pickup hero glow** | L2025, drawn L2454 | — | on hero | — | 0.8 s | — | `shadowColor '#E8A838'`, `shadowBlur 20 + sin(t*15)*8` | — | — | |
| **Crit sparks** | L1739 | 6 | `rnd(0,TAU)` | `rnd(40,100)` | 0.4 | `rnd(1,3)` | `#fff` `#E8A838` + damage colour | 0 | .90 | |
| **Weapon trail** (v27) | L2510 | 1 at **60 %/frame** while `atkAnim > 0.5` | `face ± 0.5` rad, dist `rnd(12,28)` | `vx rnd(-20,20)`, `vy rnd(-30,-10)` | 0.35 | `rnd(1.5,3.5)` | flame `#D84830`, frost `#6BCCEE`, arcane `#A862C4`, shadow `#3D2066`, quick `#D88030` | 30 | .98 | Only for non-default weapon visuals |
| **Legendary aura motes** | L2530 | 1 at **8 %/frame** | `rnd(-15,15)` around hero | `vx rnd(-10,10)`, `vy rnd(-30,-10)` | 0.6 | `rnd(1,3)` | `#E8A838` | **−5** (rises) | .98 | + ring r `22 + sin(gt*2)*2` at `rgba(232,168,56,0.3)` |
| **Resurrection** | L2207 | 20 | `rnd(0,TAU)` | `rnd(50,150)` | 0.8 | `rnd(3,7)` | `#4A9ED8` `#6B8EC8` `#fff` `#a29bfe` | 60 | .94 | + `screenShake(4, 0.15)` |
| **Lightning sparks** | L1613 | 12 | `rnd(0,TAU)` | `rnd(60,180)` | 0.3 | `rnd(2,5)` | `#fff` `#6B8EC8` `#a29bfe` | 0 | .90 | |
| **Liam ULT — Excalibur Strike** | L2673 | 30 | **snapped to cardinals** `pick([0, π/2, π, 3π/2]) + rnd(-0.3,0.3)` | `rnd(150,250)` | 0.5 | `rnd(2,4)` | `#fff` `#4A9ED8` | 0 | .90 | + `screenShake(10, 0.5)`, `hitStop(0.1)` |
| **Noah ULT — Arrow Storm** | L2676–2680 | 24 arrows staggered **50 ms** apart; 3 spawn-wisps each; 4 impact-dust each after 300 ms | random `±200` around Noah, spawned 300 px above | wisps `vy rnd(80,150)`; dust `vx rnd(-30,30)`, `vy rnd(-30,10)` | wisp 0.3 / dust 0.2 | wisp `rnd(1,3)` / dust `rnd(2,3)` | wisp `#E8A838` `#fff`; dust `#C8B080` | 0 | .95 / .90 | + `screenShake(5, 0.3)` |
| **Collette ULT — Arcane Nova** | L2686 | 20 | spawned **on a ring** `r rnd(20,60)`, moving **outward** | `rnd(80,160)` | 0.6 | `rnd(2,3)` | `#A862C4` `#e84393` `#C49BF0` | 0 | .95 | + `hitStop(0.15)` (no shake — the freeze *is* the punctuation) |
| **Isabella ULT — Meteor Drop** (bright) | L2697 | 25 | `rnd(0,TAU)` | `rnd(200,300)` | 0.6 | `rnd(3,6)` | `#F0C040` `#E8A838` `#fff` | 0 | **.88** | + `screenShake(15, 0.6)` |
| **Isabella ULT — Meteor Drop** (dirt) | L2698 | 15 | `rnd(0,TAU)` | `rnd(50,100)` | 0.8 | `rnd(3,5)` | `#8B7355` `#6B5B3A` | **150** | .92 | The two-material burst is what sells the impact |
| **Collette SIG — Arcane Blink** (out) | L2227 | 8 | evenly spaced `i/8 * TAU` | `rnd(60,120)` | 0.4 | 3 | `#A862C4` | 0 | .92 | at the origin |
| **Collette SIG — Arcane Blink** (in) | L2230 | 8 | evenly spaced, **inverted** direction, half speed | `rnd(60,120) * 0.5` | 0.4 | 3 | `#e84393` | 0 | .92 | at the destination; + `_blinkLine` (see §15.2) |
| **Isabella SIG — Ground Pound** (gold) | L2236 | 8 | `rnd(0,TAU)` | `rnd(60,150)` | 0.4 | `rnd(2,4)` | `#F0C040` `#E8A838` | 0 | .90 | + `screenShake(4, 0.15)`, `snd('boom', 0.3)`, `_poundRing` |
| **Isabella SIG — Ground Pound** (dirt) | L2237 | 6 | `rnd(0,TAU)` | `rnd(30,80)` | 0.5 | `rnd(2,4)` | `#8B7355` `#6B5B3A` | 120 | .90 | |
| **Ability-room / chest burst** | L7315 | 20 | `rnd(0,TAU)` | `rnd(60,180)` | 1.0 | `rnd(3,7)` | `#E8A838` `#fff` `#A862C4` | 80 | .93 | |
| **Dungeon boss death** | L7638 | 35 | `rnd(0,TAU)` | `rnd(80,280)` | — | — | — | — | — | + `screenShake(12, 0.5)`, `hitStop(0.1)` |
| **Biplane crash debris** | L6141 | 15 | `rnd(0,TAU)` | `vx rnd(-100,100)`, `vy rnd(-100,-20)` | 1.0 | `rnd(2,6)` | `#8B4513` `#654321` `#a0522d` | **200** | .98 | + `shk.i = 8, shk.t = 0.5` set directly |
| **Alien crater motes** | L5801 | 18 sustained | inside `r < radius*0.9` | `vy -rnd(10,20)` (**upward**), `x += sin(gt+wp)*0.5` | `rnd(2,4)` (max 4) | `rnd(1,3)` | `#A862C4` `#1abc9c` `#aaa` | — | — | Drawn at `alpha = life/maxLife * 0.7` |
| **Quest XP text** (Ed turn-in) | L8391 | `ceil(rewardXP/10)` | `rnd(-20,20)` around Ed | `vx rnd(-30,30)`, `vy rnd(-80,-30)` | 1.2 | 0 | `#E8A838`, text `'+XP'` | 40 | .98 | |

### 9.3 Enemy death styles — **L2809–2814**

`ETYPES` (L2733–2744) assigns each of the 16 enemy types a `deathStyle`; elites are forced to `glow_burst` (L2762). `deathA` advances at `dt * 1.5` (dying lasts ~0.67 s); `da = 1 - deathA`.

| Style | Enemies | Recipe |
|---|---|---|
| **shatter** | goblin, skeleton, lava_slime, ember_sprite, bomber | Body vanishes instantly. `ceil(8 * particleMul)` shards: angle `rnd(0,TAU)`, speed `rnd(80,220)`, life 0.5, size `rnd(2,5)`, colour = enemy colour, `grav 150`, `fric 0.9` |
| **dissolve** | slime, mushroom, fire_elemental, obsidian_guard, healer | Body clipped to a rect that slides *down* the body as `deathA` grows (bottom-up erasure), `globalAlpha = da`; plus 40 %·`particleMul`/frame rising motes: `vy -60`, life 0.4, size `rnd(1,3)`, enemy colour, `grav 0`, `fric 0.95` |
| **collapse** | brute | `scaleY = max(0, 1 - deathA*1.5)` — squashes flat while sinking (`translate y + sz*(1-scaleY)`); when `scaleY < 0.1`, one burst of `ceil(10 * particleMul)`: speed `rnd(60,180)`, **vertical speed halved** (`sin(a)*s*0.5`), life 0.5, size `rnd(2,6)`, `grav 120`, `fric 0.9` |
| **glow_burst** | wraith, all elites | Body scales up `1 + deathA*2` while alpha `da²` (fast fade), flashing to `#fff` in the final 20 %; at `deathA > 0.15`, **12** particles on an even `TAU*i/12` ring, speed `rnd(100,250)`, life 0.6, size `rnd(3,6)`, colour `_eliteCol` or enemy colour, `grav 0`, `fric 0.92` |
| **default** (no style) | — | Body spins `deathA * 3π` while scaling to zero at `alpha = da` |

**Why it works.** Four different *verbs* — break, melt, crumple, ascend — mean a wave of mixed enemies dies in four different rhythms. `grav 150` on shatter shards vs `grav 0` on glow-burst motes is the whole difference between debris and spirit.

**3D equivalent.** shatter → pre-fractured low-poly shards as a small instanced rigid-body burst (or a vertex-shader explode with gravity); dissolve → a dissolve shader with a rising clip plane and an emissive edge, plus rising `Points`; collapse → a squash animation on the skinned mesh with a ground dust ring decal; glow_burst → scale-up + emissive-to-white with an additive ring of 12 motes on the bloom layer. Keep `particleMul` as a quality setting (0.3 / 0.6 / 1.0).

### 9.4 Ability VFX system (v24) — **L1746–1750**

```js
var abilityVFX=[];
function addAbilityVFX(opts){abilityVFX.push({x,y,timer:0,duration:opts.duration||1,
  data:opts.data||{},update:opts.update||noop,draw:opts.draw||noop});}
function updateAbilityVFX(dt){/* timer += dt; splice when timer >= duration */}
function drawAbilityVFX(){/* v.draw(v, v.x-cam.x, v.y-cam.y, v.timer/v.duration) */}
```
A generic timed closure holder: each effect gets its own `update` and `draw`, and `draw` receives normalised progress `t/duration`. **No call site in v27 actually registers one** — `addAbilityVFX(` appears only at its own definition (L1748). It is scaffolding that the hero ultimates never used; they use `h._ultVfx` and `drawUltVfx()` instead (§15.2). Worth porting as the *pattern* (a pooled, closure-driven, normalised-progress VFX registry) because it is the right shape for the 3D build's telegraph and impact effects.

The parallel **arena effect system** (v24, **L5018–5061**) *is* used: `addArenaEffect({x, y, radius, duration, telegraphTime = 1.0, drawTelegraph, drawActive, onHeroInside, onEnd})`, capped at `MAX_ARENA_EFFECTS = 8`. Telegraph draws for `telegraphTime`, then the effect flips `active` and starts damaging heroes inside `radius` every frame. **3D equivalent:** projected decal telegraphs on the ground (Brief PORT_MAP calls these "3D telegraph decals"), with the same 1.0-second default lead time.

---

## 10. Screen shake & hit-stop

### 10.1 The math — **L611–612, L9272**

```js
function screenShake(intensity,duration){ if(!settings.screenShake)return;
  shk.i = Math.min(shk.i + intensity, 25);      // ACCUMULATES, hard cap 25
  shk.t = Math.max(shk.t, duration);
  shk.maxT = shk.t; }

// main loop, after camera follow:
if(shk.t>0){ shk.t -= dt;
  var _sd = shk.maxT>0 ? shk.t/shk.maxT : 0;    // linear envelope 1 → 0
  var _si = shk.i * _sd;
  cam.x += rnd(-_si,_si); cam.y += rnd(-_si,_si);
  if(shk.t<=0){ shk.i=0; shk.maxT=0; } }
```

- **Uniform random offset** in both axes, not a decaying sine — v27 shake is noise, not oscillation.
- **Linear** decay envelope over the shake's own duration.
- Intensities **add** (cap 25), durations **max**. Two 15-magnitude hits inside one window give 25, not 30.
- `shk.maxT` is reassigned every call, so a new shake **restarts the envelope** for the whole accumulated intensity.
- Applied *after* camera clamping, so shake can push the view slightly past world bounds — which is why big hits feel like the world moved rather than the camera.
- Fully disableable via `settings.screenShake` (accessibility).

`hitStop(duration)` (**L612**) sets `window._hitStop`; the main loop at **L9226** returns early while it is positive — the entire simulation freezes, including particles and animation. Used at exactly four places: Liam ult 0.1 s, Collette ult 0.15 s, combo-ult impact 0.15 s, dungeon boss death 0.1 s.

### 10.2 Every `screenShake()` call site

| Magnitude | Duration | Trigger | Line |
|---|---|---|---|
| 3 | 0.1 | Enemy charge attack ends | L2770 |
| 4 | 0.1 | Bomber self-destructs | L2802 |
| 4 | 0.15 | Hero revived (with 20-particle resurrection burst) | L2208 |
| 4 | 0.15 | Isabella Ground Pound lands | L2232 |
| 4 | **0.15** | **Hero takes damage** (+ `vig.i = 0.4`, `vig.t = 0.3` red vignette) | L2369 |
| 4 | 0.2 | A caged hero is freed | L5264 |
| `windup*4` | 0.1 | Goblin King kid-snatch wind-up — **ramps up** over 1.5 s | L3140 |
| 5 | 0.3 | Noah Arrow Storm | L2678 |
| 6 | 0.15 | Boss melee connects | L3210 |
| 6 | 0.15 | Shadow Queen melee connects | L5642 |
| 6 | 0.2 | Enemy charge impact (dungeon) | L7409 |
| 6 | 0.2 | Boss block deactivates | L5186 |
| 6 | 0.3 | Arena effect fires | L5080 |
| 6 | 0.3 | Force field broken | L5208 |
| 8 | 0.3 | Mini-boss emerges from burrow | L2911 |
| 8 | 0.3 | Mini-boss slam | L2939 |
| 8 | 0.3 | Crypt Warden → phase 2 | L7402 |
| 8 | 0.3 | Magma Titan meltdown | L7623 |
| 8 | 0.4 | All heroes freed | L5274 |
| **8** | **0.5** | **Biplane crash-lands** (set directly on `shk`, bypassing the accumulator) | L6141 |
| 8 | 0.5 | Endless-mode boss wave | L9562 |
| 10 | 0.4 | Mini-boss dies | L2979 |
| 10 | 0.5 | Mini-boss spawns | L2891 |
| 10 | 0.5 | Liam Excalibur Strike (+ `hitStop 0.1`) | L2671 |
| 10 | 0.5 | Shadow Queen → phase 2 | L5549 |
| 10 | 0.5 | Cave dungeon boss special | L7590 |
| 10 | 0.5 | Wraith retreats to sarcophagus | L7513 |
| 10 | 0.5 | Treant plants itself (phase 2) | L7438 |
| 10 | 0.6 | Goblin King → phase 2 | L3159 |
| 12 | 0.5 | Cocoon shatters (VULNERABLE) | L5099 |
| 12 | 0.5 | Goblin King special | L3178 |
| 12 | 0.5 | Crypt Warden → VOID FORM | L7403 |
| 12 | 0.5 | Dungeon boss final phase | L7397 |
| 12 | 0.5 | Volcanic boss special | L7618 |
| 12 | 0.5 | Dungeon boss dies (+ `hitStop 0.1`) | L7638 |
| 12 | 0.6 | Shadow Queen → phase 3 (KIDNAP) | L5550 |
| 12 | 0.6 | Wraith phantom split | L7523 |
| **12** | **1.0** | **Goblin King appears** (with boss intro) | L3294 |
| **12** | **1.0** | **Shadow Queen appears** (with boss intro) | L9331 |
| **12** | **3.0** | **Earthquake world event** — the longest shake in the game | L5792 |
| 15 | 0.6 | Combo-ultimate impact (+ `hitStop 0.15`) | L2558 |
| 15 | 0.6 | Combo ultimate | L2646 |
| 15 | 0.6 | Isabella Meteor Drop | L2694 |
| 15 | 0.8 | Goblin King → phase 3 (DEATH OR GLORY) | L3162 |
| 15 | 0.8 | Kid snatch succeeds | L3144 |
| 15 | 0.8 | Shadow Queen → phase 4 (DESPERATION) | L5551 |
| 15 | 1.0 | Shadow Queen dies | L5657 |
| **22** | **0.9** | **Meteor impact (cutscene)** — the largest single shake | L4917 |

### 10.3 The profile ladder

| Tier | Magnitude | Duration | Meaning |
|---|---|---|---|
| Tap | 3–4 | 0.10–0.20 | Something touched you or you touched something |
| Thud | 5–6 | 0.15–0.30 | A real hit landed |
| Slam | 8–10 | 0.30–0.50 | A mini-boss or an ultimate |
| Quake | 12–15 | 0.50–0.80 | A phase change or a boss death |
| Event | 12–22 | 0.90–3.00 | A story beat |

**Why it works.** The ladder is *consistent*: every 4 is the same feeling, every 15 is the same feeling. Because intensity accumulates but duration takes the max, a flurry of small hits compounds into one strong shake instead of stuttering — combat "builds". And the two boss-appearance shakes (12/1.0) run *underneath* the letterboxed intro while the game is paused, so the world trembles while nothing else moves.

**3D equivalent.** Apply as an additive offset on the camera rig *after* the smooth-damped follow (Brief §4.5), keeping the same table verbatim — it is tuned. In 3D, add a small rotational component (±0.3° roll/pitch scaled by the same envelope) because a purely translational shake reads flatter in perspective than it does in 2D; keep the translation dominant. Preserve the accumulate/cap-25 and max-duration rules, and the `settings.screenShake` off switch. Hit-stop ports as a global timescale freeze (`delta = 0` for the fixed step) — including physics — at exactly the four sites listed.

---

## 11. Grandpa Ed & the biplane

**Lines:** state **L635–642**, `_launchBiplane()` **L5945–5965**, `_spawnParachuteCrate()` **L5966–5972**, `updateBiplane()` **L5973–6146**, `_getEdWalkPath()` **L6147–6151**, `drawBiplane()` **L6152–6281**, `drawGrandpaEd()` **L8377–8389**, `spawnEd()` L8390.

### 11.1 Flyover choreography

| Beat | Value |
|---|---|
| First flyover | `biplane.timer = 20` s from start (`15` when restored from a save, L1323) |
| Interval, flyovers 1–2 | `25 + rnd(0,15)` s |
| Interval, flyovers 3–5 | `35 + rnd(0,20)` s |
| Interval, flyovers 6+ | `50 + rnd(0,25)` s |
| Entry edge | `fromEdge = floor(rnd(0,4))` — left / right / top / bottom, 80 px outside the camera |
| Entry position | left/right: `y = cam.y + H*0.3 + rnd(0, H*0.4)` (the middle 40 % band); top/bottom: `x = cam.x + W*0.3 + rnd(0, W*0.4)` |
| Speed | **100 px/s** nominal, constant; cross-axis drift `rnd(-15,15)` |
| Altitude | **150** when entering from the camera edge; **0** when taking off from Ed's Landing, climbing at 60/s over 2.5 s |
| Event roll | 40 % `'supply'`, 60 % `'flyover'` (unless crash conditions are met) |
| Announcement | `'✈️ Supply drop inbound!'` / `'✈️ A biplane flies overhead!'`, `#E8A838`, 2 s; crash run: `'✈️ A biplane sputters overhead!'`, `#D94848` |
| Despawn | `flightTime > 1.5` and more than 300 px offscreen, or 100 px outside the world |
| Achievement | `frequentFlyer` at `biplaneSeen >= 10` (L5964) |

Course wandering (L6071): every `rnd(2.5,5)` s the target heading is nudged by `rnd(-0.6, 0.6)` rad. Steering is rate-limited to **1.2 rad/s**; the drawn heading chases the velocity heading at **3.5/s**; `turnRate` lerps toward `steerDiff * 2.5` at **4/s**. The plane therefore banks *before* it turns and levels *after* — the lag is the character.

Engine sputter (L6089): every **2.5 s** the engine coughs — `sputterOn = true`, `alt -= 3`, the propeller disc is replaced by a **static vertical blade** — recovering **0.15 s** later with `alt += 3` (clamped to 150). Grandpa Ed's plane is never quite healthy, and it says so once every two and a half seconds without a line of dialogue.

Smoke trail (L6090): 40 %/frame while `trail.length < 80`, emitted 20 px behind the heading at `y - alt + wobbleY`, `life 1.5`, `sz rnd(2,5)`. Trail update: `life -= dt*0.5` (so real lifetime is 3 s), `sz += dt*3` (puffs expand). Draw: `alpha = min(life*0.35, 0.5)`, colour `#b4b4b4` (`#555` while crashing).

### 11.2 Aerobatics

| Value | |
|---|---|
| First trick cooldown | `rnd(4,8)` s; thereafter `rnd(7,15)` s |
| Gate | `flightTime > 2.5` and `event !== 'crash'` |
| Type | 50 / 50 `barrel_roll` (duration **1.0 s**) or `loop` (duration **1.8 s**), direction ±1 |
| Easing | `ease = tp<0.5 ? 2·tp² : 1-(-2tp+2)²/2` (ease-in-out quadratic) |
| Barrel roll | `roll = ease·TAU·dir`; `yOffset = -sin(tp·π)·12` — rises 12 px through the middle |
| Loop | `loopAngle = ease·TAU·dir`; `yOffset = -sin(loopAngle)·40`; `scaleY = max(0.15, cos(loopAngle))` (the plane flattens edge-on at the top); `alpha = 0.5 + 0.5·|cos(loopAngle)|` (it thins out when edge-on) |
| Wind streaks | during any trick, 4 lines `rgba(255,245,230,0.15)`, lw 0.5, at `x = -18 - i*5 + rnd(-2,2)`, `y rnd(-8,8)`, length `6 + rnd(0,4)` |

Faking a 3D loop with `scaleY = cos(angle)` plus an alpha dip is the cleverest single line in the drawing code.

### 11.3 Drawing — the plane

Scale **1.4×**. When `cos(heading) < 0` the canvas is mirrored (`scale(-1,1); rotate(π - hd)`) so Ed is never upside-down flying left; bank roll is sign-flipped to match.

| Part | Colours / geometry |
|---|---|
| Fuselage | `#E8A838` amber polygon, 22 px nose to −22 tail, outline `#B37A2E` lw 0.7, two rib lines `rgba(179,122,46,0.25)` lw 0.4 |
| Engine cowling | `#8B6914`, outline `#6B5210`; two `#7a5c12` bolt dots |
| Cockpit | `rgba(30,20,15,0.5)` with a `rgba(139,105,20,0.6)` lip |
| Top wing | `#2D8C56` forest green, `#1E6B3E` outline, `rgba(255,255,255,0.15)` highlight discs at each tip, `#268A4E` rounded tip caps |
| Bottom wing | `#2D8C56` |
| Struts / rigging | `#8B4513` lw 1 verticals + `rgba(139,69,19,0.25)` lw 0.4 diagonal cross-bracing |
| Tail boom | `#D4944A`, 6 × 3 |
| Tailplane / fin | `#D84830` ember red, fin `#C03828` with `#922b21` outline and a `rgba(255,255,255,0.15)` highlight |
| Landing gear | `#555` lw 1 legs, `#333` wheels r 2.2, `#444` axle |
| Exhaust | `#555`, 3 × 1.5 |
| **Propeller (running)** | two blurred ellipses `2 × 12` at `rgba(100,80,60,0.35)` rotated `gt*30` and `rgba(150,130,100,0.2)` rotated `gt*30 + π/2`, plus a `#666` hub r 1.5 |
| **Propeller (sputtering)** | a single static `#555` lw 2 line from `(26,−9)` to `(26,9)` — a stopped blade |
| Crash smoke | 4 discs `rgba(60,60,60,0.4)`, r `rnd(3,9)`, at `rnd(-12,12)`, `rnd(-6,12)` |

**Ground shadow** (L6237): ellipse at the plane's *ground* position (`y + alt`), **44.8 × 8** px (32 × 1.4 wide), `alpha = max(0.03, 0.12 - alt*0.0005)` — at cruise altitude 150 that is **0.045**, at ground level 0.12. The shadow is the only thing that communicates altitude in a top-down game, and its opacity doing the work is the reason a flat sprite reads as *up there*.

### 11.4 Ed's scarf flutter

Two chained quadratic curves, six independent frequencies:

```js
// Segment 1 — ember red, thick
ctx.strokeStyle='#D84830'; ctx.lineWidth=2.2; ctx.lineCap='round';
ctx.moveTo(-2,-4);
ctx.quadraticCurveTo(-6 + Math.sin(gt*4)*2,  -3 - Math.cos(gt*3),
                     -10 + Math.sin(gt*5)*3, -4 + Math.cos(gt*4)*2);
// Segment 2 — darker, thinner, continues from segment 1's endpoint
ctx.strokeStyle='#A83828'; ctx.lineWidth=1.5;
ctx.moveTo(-10 + Math.sin(gt*5)*3, -4 + Math.cos(gt*4)*2);
ctx.quadraticCurveTo(-13 + Math.sin(gt*3.5)*2, -5 + Math.cos(gt*4.5)*2,
                     -16 + Math.sin(gt*4.2)*2, -3 + Math.cos(gt*3.8)*3);
ctx.lineCap='butt';
```

| Property | Value |
|---|---|
| Length | 14 px (from −2 to −16), tapering 2.2 → 1.5 lw |
| Colours | `#D84830` → `#A83828` (the tail is in its own shadow) |
| Frequencies | 3, 3.5, 3.8, 4, 4.2, 4.5, 5 rad/s across the control and end points |
| Amplitudes | 1–3 px |
| Cap | `round` on the near segment (a cloth edge), `butt` restored after |

**Why it works.** Seven incommensurate frequencies at tiny amplitudes on a two-segment chain produce a whip that never repeats and never looks like a sine wave. The taper in both width and colour makes 14 pixels read as fabric. The scarf is also the *only* part of Ed visible in the plane besides his goggles — it is his silhouette.

**Ed on the ground** (`drawGrandpaEd`, **L8377–8389**): shadow ellipse `rgba(0,0,0,0.2)` 16 × 7; body `#165B16` ellipse 15 × 16 under `#228B22` ellipse 14 × 15; head `#228B22` r 10; **flight goggles** — two `#7A4018` lw 1.5 circles r 4 at `±4, −22` joined by a strap, with `rgba(255,255,255,0.3)` glints; eyes `#fff` r 2.8 with `#228B22` pupils r 1.5; a `#fff` lw 1 smile arc r 4 from 0.2 to `π−0.2`; **ground scarf** `#1a5c1a`, a filled quad swaying `sin(gt*2 + npc.x)*3` (phase seeded by his world position, so no two NPCs bob in sync); name label `bold 9px`; proximity ring `rgba(34,139,34,0.3)` ellipse 20 × 22 within 70 px.

### 11.5 Crash sequence

| Condition (all required) | |
|---|---|
| `biplane.crashReady` | set when `crashReadyTimer` expires and Ed has not been met |
| `!storyFlags.edMet && !inDungeon && !bossUp && !activeEvent && !dialogueActive` | the crash never interrupts anything |

Crash begins at `pathProg > 0.4` where `pathProg = dist(start) / (max(W,H) + 160)` — i.e. after the plane has crossed ~40 % of the screen, so the player sees it come in *before* it goes wrong.

| Beat | Value |
|---|---|
| Target | `ED_LANDING` (a fixed world position) |
| Speed | `max(200, distanceToLanding * 1.5)` — accelerates the further out it is, so the descent always takes about the same time |
| Spiral | `sin(crashT * 4) * 40` px **perpendicular** to the approach vector — a 4 rad/s corkscrew |
| Heading chase | 5/s (faster than the 3.5/s cruise chase — panicked) |
| Bank | cruise bank **plus** `sin(crashT*4)*0.5` rad |
| Altitude | `-25` px/s |
| Smoke | 70 %/frame, cap **120**, emitted 15 px behind with ±5 jitter, `life 2`, `sz rnd(3,8)`, colour `#555` |
| Touchdown | `distance < 30` **or** `alt <= 0` |
| Impact | `shk.i = 8; shk.t = 0.5; shk.maxT = 0.5` (direct, bypasses the accumulator); 15 debris particles `#8B4513`/`#654321`/`#a0522d` with `grav 200`; `snd('boom', 0.3)`; `spawnEd()`; `events.emit('biplaneCrash')`; `announce("Grandpa Ed has crash-landed!", '#228B22', 3)`; `edFlightCooldown = 999` |

### 11.6 Post-repair supply runs

Once `storyFlags.edQuestComplete`: every `120 + rnd(0,60)` s Ed announces `Ed: "Time for a supply run!"` and **walks** to the plane along `_getEdWalkPath()` (**L6147**) — a straight line sampled every 30 px, with each sample pushed 20 px away from any tree/pinetree/rock within 30 px. Walk speed 80 px/s. He is hidden on takeoff (`edNPC._hidden = true`), climbs for 2.5 s, flies a normal supply run, and on despawn gets a 2-second landing animation (`edLanding`): a `#E8A838` lozenge (a stylised plane silhouette, 30 × 8 with rounded ends) descending 20 px at `alpha = min(edLanding,1) * 0.6`, followed by `announce("Ed's back from his supply run!", '#228B22', 2)`.

**Why the whole biplane works.** It is a *character* built from four independent noise sources — course wander, wobble, bank lag, sputter — none of which is a game system. The plane is never doing nothing. Add the shadow selling altitude, the scarf selling wind, the sputter selling age, and the aerobatics selling personality, and a 60-pixel sprite becomes a grandfather.

**3D equivalent.**
- Biplane as a low-poly GLB with a separate spinning propeller node (blur disc → an alpha-blended quad or a high-speed rotation with motion-blur-ish transparency; keep the *static blade* on sputter, it is the joke).
- Real 3D banking (`rotation.z = turnRate * 0.25 + cos(t*2)*0.04`), real 3D loops and barrel rolls (the `scaleY`/alpha fakery is no longer needed — but keep the 1.0 s / 1.8 s durations and the ease-in-out-quad).
- Scarf as a 6–8 segment bone chain or a cloth-ish vertex shader driven by the **same six frequencies** (3, 3.5, 3.8, 4, 4.2, 4.5, 5) at small amplitudes, tapering `#D84830` → `#A83828`.
- Shadow becomes a real shadow from the directional light (Brief §4.3 PCF soft shadows) — but keep an additional soft blob decal so altitude reads even when the sun is high.
- Smoke trail as a `Points` system with the same 3 s lifetime and expanding size; crash smoke darker.
- Choreography table (intervals, entry edges, 100 px/s, altitude 150, 40 % supply) ports unchanged. The crash's "never interrupts anything" gate is a design rule worth keeping verbatim.

---

## 12. Parachute crates

**Lines:** `_spawnParachuteCrate()` **L5966–5972**, physics **L5975–6002**, drawing **L6155–6218**.

### 12.1 The spray

| Value | |
|---|---|
| Trigger (supply run) | `pathProg > 0.2` |
| Count | `floor(rnd(3,8))` → **3–7**; with `storyFlags.betterDrops`: `floor(rnd(6,11))` → **6–10** |
| Stagger | `delay = i * 0.7 + rnd(0, 0.2)` s — 0.7 s apart with jitter, so a full 7-crate spray takes ~4.4 s |
| Spawn jitter | `±8` px x, `±6` px y around the plane |
| Trigger (flyover gift) | `pathProg > 0.35`, `floor(rnd(3,6))` crates, `delay = i*0.7 + rnd(0,0.15)` |
| Announcement | `'📦 Supply crates incoming!'`, `#E8A838`, 2 s |

### 12.2 Fall physics

| Phase | Value |
|---|---|
| Initial | `alt = biplane.alt` (150), `vx = planeVx * 0.3` (inherits 30 % of the plane's momentum), `vy = 0`, `spin rnd(-4,4)` rad/s, `swayPhase rnd(0,TAU)` |
| Drift target | `rnd(-20,20)` px/s in **storm or sandstorm**, else `rnd(-5,5)` — weather blows the crates |
| Free fall (first 0.35 s) | `vy += 350·dt`; `spin += rnd(-2,2)·dt` (tumbling) |
| Chute deploy | at `chuteDeploy > 0.35` s; `chuteSize` grows `0.1 → 1` at **2.5/s** (0.36 s) |
| Chute drag | `chuteEffect = chuteSize²`; `targetVy = 18 + 15·(1 - chuteEffect)` → **33 → 18** px/s; `vy` lerps at **3/s** |
| Horizontal | `vx` lerps to `driftDir` at **1.5/s** |
| Spin | lerps to 0 at **3/s**; the drawn rotation is `spin · chuteDeploy · max(0, 1 - chuteSize)` — the tumble is *cancelled* as the canopy fills |
| Landing | `alt <= 0` → `ground = true`, `landBounce = 1`, `snd('equip', 0.15)`, **6 dust particles** `#c8b88a` (see §9.2) |
| Ground life | 45 s, then despawn |

The squared `chuteEffect` means the deceleration is slow at first and then sharp — the "snap" of a canopy filling.

### 12.3 Canopy drawing

| Element | Value |
|---|---|
| Radius | `16 · chuteSize`; centre at `y = -16·chuteSize - 6` |
| Panels | **5** wedges spanning π, alternating `rgba(200,60,50,0.7)` red and `rgba(255,245,230,0.75)` cream |
| Rim | `rgba(0,0,0,0.15)` lw 0.6 arc |
| Highlight | `rgba(255,255,255,0.15)` disc at 40 % radius, offset up-left |
| Sway | rotation `sin(gt·1.8 + phase)·0.12·size` rad, translation `sin(gt·2 + phase)·5·size` px — two different frequencies for rotation and translation |
| Shrouds | 4 lines `rgba(120,100,80,0.5)` lw 0.5 from the canopy edge (rotated by the sway transform via a manual 2D rotation helper `_swayPt`) to the crate corners `(±5,0)` and `(±2,−4)` |

### 12.4 Crate drawing

| State | Geometry |
|---|---|
| Falling | 14 × 14; body `#8B4513`; top/bottom bands `#7a3b10` 14 × 2; cross straps `#D4944A` 1.6 wide; centre `#B37A2E` 4 × 4 with `#8B6914` 2 × 2; top highlight `rgba(255,255,255,0.1)`, bottom shade `rgba(0,0,0,0.15)`; gold `E` at `rgba(232,168,56,0.3)`, `bold 6px` |
| Grounded | 16 × 16, same construction scaled up, `E` at 0.4 alpha `bold 7px`, brighter core `#E8A838` |
| Bounce | `landBounce` decays at 3/s from 1; `bounceY = -|sin(landBounce·π·3)| · 8 · landBounce` — **three decaying hops** over ~0.33 s |
| Ground shadow | `rgba(0,0,0,0.12)` ellipse 10 × 3, offset `+2, +7` |
| Attract glow | `cGlow = 0.5 + 0.5·sin(glow·3)`; gold disc r 20 at `0.15·cGlow`, gold disc r 12 at `0.25·cGlow` |
| Radiating ticks | 6 spokes from r 10 to r 16, rotating at `gt·0.5`, `rgba(232,168,56, 0.15·cGlow)` lw 1 |
| Floating arrow | triangle 8 wide × 6 tall at `y = -14 - sin(gt·3)·3`, `rgba(232,168,56, 0.5 + cGlow·0.3)` |
| Pickup | radius **45 px**; 60 % heal (**30 %** of max HP, **60 %** with `betterDrops`), else gold `rnd(20,40)` (`rnd(40,80)` with `betterDrops`) |

**Why it works.** The 0.7-second stagger is the entire effect. A simultaneous spray of seven crates is confetti; seven crates 0.7 s apart is a *supply drop* — the eye tracks each one, and the sky stays busy for four seconds. The tumble-then-snap-then-sway sequence gives each crate a three-act arc in under two seconds, and the alternating red/cream panels make a 32-pixel canopy read instantly as a parachute.

**3D equivalent.** Crate as a small flat-shaded box with vertex-coloured straps; canopy as a 5-segment low-poly dome with alternating vertex colours (the panel alternation is the readable part — keep it), driven by a two-frequency sway on the parent node. Shrouds as 4 thin cylinders or a `LineSegments`. Ground bounce as the same three-hop decay. The attract glow becomes a pulsing emissive ring decal plus a small warm point light; the floating arrow becomes a billboarded marker. Keep the 0.7 s stagger, the 350 → 33 → 18 speed profile, the weather-driven drift, and the 45-second despawn.

---

## 13. Boss intro letterbox & cutscene letterbox

### 13.1 Boss intro — `playBossIntro()` **L5326–5345**, CSS **L254–262**

```css
.letterbox-top,.letterbox-bot{position:fixed;left:0;right:0;background:#0B0E1A;
  z-index:55;height:0;overflow:hidden;}
.letterbox-top.show,.letterbox-bot.show{animation:letterboxIn 0.5s ease-out forwards;}
.letterbox-top.hide,.letterbox-bot.hide{animation:letterboxOut 0.4s ease-in forwards;}
@keyframes letterboxIn{from{height:0}to{height:60px}}     /* L32 */
@keyframes letterboxOut{from{height:60px}to{height:0}}    /* L33 */
```

| Element | Value |
|---|---|
| Bar height | **60 px** top and bottom |
| Bar colour | `#0B0E1A` (`--bg-0`, the game's deepest background — **not** pure black) |
| In | 0.5 s ease-out |
| Out | 0.4 s ease-in |
| z-index | 55 (bars) / 56 (namecard) |

**Name card** (`.boss-namecard`, L257–260): anchored `top: 50%; right: 0`, entering from `translate(100%, -50%)` to `translate(0, -50%)` with `transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)` — a **back-out overshoot**; padding `16px 40px 16px 24px`; `border-left: 4px solid <boss colour>`; `border-radius: 8px 0 0 8px`; background `linear-gradient(135deg, rgba(15,10,30,0.95), rgba(25,15,40,0.95))`; `backdrop-filter: blur(8px)`. Boss name: `clamp(20px, 3vw, 30px)`, bold, `letter-spacing: 3px`, `text-shadow: 0 0 20px currentColor` (glows in the boss's own colour). Subtitle: 12 px, `#aaa`, `letter-spacing: 1px`.

**Timeline:**

| t | Event |
|---|---|
| 0 ms | `paused = true`; bars animate in (0.5 s) |
| 800 ms | Name card slides in with overshoot; `snd('boss', 0.5)` |
| 3200 ms | Name card slides out |
| 3600 ms | Bars animate out (0.4 s) |
| 4100 ms | Classes reset; `bossIntroActive = false`; `paused = false` |

**Camera behaviour:** none. `paused = true` for the full 4.1 s, so the camera does *not* push in — but the caller fires `screenShake(12, 1)` on the same frame (L3294 Goblin King, L9331 Shadow Queen), and shake is applied in the main loop's camera code, so **the world trembles for the first second while everything else is frozen**. That contrast — a still, letterboxed frame with a shaking camera — is the whole beat.

Named bosses: `playBossIntro('THE GOBLIN KING', 'Ruler of the Horde — Kid Snatch!', '#D84830', '#D84830')` (L3294); `playBossIntro('THE SHADOW QUEEN', 'Mistress of Darkness', '#A862C4', '#A862C4')` (L9331).

**Mini-boss popup** (`showMiniBossPopup()` L5347–5353, CSS L261–262): a small card at `top: 60px`, centred, sliding down from `translateY(-100%)` with `transition: transform 0.4s ease-out, opacity 0.4s`, `backdrop-filter: blur(8px)`, visible for **2.5 s**. Name 16 px bold `letter-spacing 1px`; sub 10 px `#888`. Deliberately *not* letterboxed — the game does not stop for a mini-boss.

### 13.2 Cutscene letterbox — `drawCutscene()` **L4385–4393**

A separate, canvas-drawn system: `barH = 60 * cutscene.letterbox` where `cutscene.letterbox` grows at `dt * 3` (0.333 s to full), filled **pure `#000`** (unlike the boss bars), with `'Press SPACE to skip'` in 12 px `rgba(255,255,255,0.4)` centred just above the bottom bar. While `cutscene.active`, `drawFog()`, `drawDayNightTint()` and the world boundary all suppress themselves (L3330, L3338, L3323).

**3D equivalent.** Letterbox stays a DOM/CSS overlay (60 px bars, `#0B0E1A`, 0.5 s / 0.4 s) — cheap and pixel-perfect. Add the Brief §4.5 cinematic camera that v27 could not do: on `playBossIntro`, blend the follow camera to a boss-framing rig and **slow push-in** over the 3.2 s the card is up, with the same 12/1.0 shake layered on top, then blend back over 0.5 s. Keep the 800 ms delay before the card (the pause before the name is what makes it land), the back-out overshoot easing, and the `text-shadow` glow in the boss's colour — in 3D that becomes a bloom-tinted card or an emissive name plate.

---

## 14. Damage numbers

**Lines:** `HERO_DMG_COLS` **L3641**, `dmgN()` **L1732–1741**, `Part.draw` text branch **L1728**.

```js
var HERO_DMG_COLS=['#4A9ED8','#2DB86A','#A862C4','#D88030'];
```

| Index | Hero | Damage-number colour | Hero body colour |
|---|---|---|---|
| 0 | Liam | `#4A9ED8` | `#4A9ED8` |
| 1 | Noah | `#2DB86A` | `#2DB86A` |
| 2 | Collette | `#A862C4` | `#A862C4` |
| 3 | Isabella | **`#D88030`** (orange) | `#F0C040` (gold) |

Isabella's number is deliberately a shade darker/oranger than her body so gold text does not vanish against the desert ground.

Fallback colours when no source hero is known (L1736):

| Damage | Colour |
|---|---|
| `< 10` | `#fff` |
| `< 30` | `#E8A838` gold |
| `< 60` | `#D88030` orange |
| `≥ 60` | `#D84830` ember red |

Other fixed colours: hero taking damage `#D84830` (L2369); healing `+N` `#3DCC7A` (L1765); enemy-projectile reflect `REFLECT!` `#6B8EC8` (L9285); `'NEW GEAR!'` `#E8A838` (L5367).

### 14.1 Motion and type

| Property | Value |
|---|---|
| Spawn | `x + rnd(-15,15)`, `y - 10` |
| Launch | `vy = -130`, `vx = rnd(-20,20)` |
| Gravity | **180** |
| Friction | 0.98 (default) |
| Lifetime | **1.0 s** |
| **Bounce** | `bounce: true` — at `life < ml*0.6` and `vy > 0`, `vy` is set to **−80** once. The number rises, falls, and *hops* |
| Base font | `clamp(16 + floor(n/20)*2, 16, 32)` px bold — bigger numbers are literally bigger, capped at 32 |
| Crit font | `floor(base * 1.3)` |
| Crit scale pulse | `scalePulse 0.3` → drawn size `round(fs * (1 + 0.3·(life/ml)))`, so a crit **starts 30 % oversized and settles** |
| Crit prefix | `'CRIT! '` |
| Crit glow | `shadowColor = colour`, `shadowBlur = 10` |
| Crit sparks | 6 particles (§9.2) |
| Outline | `strokeStyle 'rgba(0,0,0,0.5)'`, `lineWidth 2`, stroked after the fill — readable over any ground |
| Cap | 30 text particles on screen; the oldest is spliced out when a 31st spawns |
| Toggle | `settings.showDmgNumbers` |

**Why it works.** Three independent channels encode three facts at once: **hue** = who dealt it, **size** = how much, **motion (the bounce + scale pulse)** = whether it crit. A four-player screen stays legible because each player's numbers are their own colour, and the black outline means no ground colour can swallow them.

**3D equivalent.** Billboarded `Sprite`s or an instanced SDF-text pass in screen space, with the same colour table, the same `16 + floor(n/20)*2` size curve, the same 1.0 s arc with a single bounce, and the same crit scale-pulse and outline. Spawn in world space and project so numbers sort with depth; keep the 30-number cap and the settings toggle. `HERO_DMG_COLS` ports to `src/content/` verbatim (family canon colours are sacred).

---

## 15. Lighting, glow & full-screen tints

### 15.1 Full-screen plates, in draw order

| Effect | Colour / alpha | Condition | Line |
|---|---|---|---|
| Weather overlay | fog `rgba(200,200,200,0.25)`, sand `rgba(194,154,100,0.2)`, rain `rgba(10,10,30,0.08)`, storm `rgba(10,10,30,0.2)` | weather type | L1643–1644 |
| Lightning flash | white, `0.45` peak then a `0.12` ripple over 0.12 s | storm strike | L1646 |
| Blood-moon tint | `rgba(180,0,0, 0.2 + sin(gt*3)*0.05)` → **0.15–0.25**, pulsing at ~0.5 Hz | `bloodMoonActive` (25 s world event) | L6350–6351 |
| Fog of war | `rgba(10,10,30,0.65)` + feather | always (not in cutscene) | L3332–3334 |
| Day/night tint | §2.1 table | by phase | L3340–3343 |
| Shadow Realm | `rgb(60,0,80)` at `globalAlpha 0.25` | `inShadowRealm` — *replaces* the day tint | L3339 |
| World vignette | radial `W*0.35 → W*0.75`, `rgba(0,0,0,0)` → **`rgba(11,14,26,0.25)`** | **always on** | L3355–3360 |
| Level-up flash | `rgba(255,245,230, flash*0.3)`, `flash` 1 → 0 at 0.16/frame (~6 frames), peak **0.30** | on level-up | L9385 |
| Low-HP pulse | `rgba(217,72,72, 0.04 + 0.03·sin(gt*4))` → 0.01–0.07 | active hero below **25 %** HP | L9385 |
| Damage vignette | radial `W*0.3 → W*0.7`, `rgba(255,0,0, vig.i)`; `vig.i = 0.4`, `vig.t = 0.3`, then `i -= 0.03`/frame | on hero damage | L3361–3364, set L2369 |
| Crater vignette | radial `W*0.3 → W*0.7`, `rgba(123,45,142, up to 0.08)`, scaled by `1 - d/(radius+40)` | within 140 px of the crater | L5943 |

The **always-on world vignette** at `rgba(11,14,26,0.25)` (the `--bg-0` navy, not black) is the quiet workhorse: it darkens the screen corners toward the UI background colour, which frames the action, unifies the palette, and hides the fog-of-war edge. It costs one gradient per frame.

### 15.2 Hero-attached lights and rings

| Effect | Recipe | Line |
|---|---|---|
| **Active-hero indicator** | **There is no world-space selection ring.** The active hero is shown only by the HUD portrait: `.hud-port.active{border-color: var(--gold); box-shadow: 0 0 12px var(--gold-glow)}` | CSS L83 |
| Ultimate aura | `shadowColor = heroColour`, `shadowBlur = 25 + sin(gt*10)*10`; ring r `28 + sin(gt*8)*3`, lw 2 | L2519 |
| Liam shield | `shadowBlur 20`, `stroke rgba(74,158,216,0.6)` lw 3, r 25 | L2455 |
| Equip-pickup glow | `shadowColor '#E8A838'`, `shadowBlur 20 + sin(_eqGlowT*15)*8`, 0.8 s | L2454 |
| Legendary aura | ring r `22 + sin(gt*2)*2`, `rgba(232,168,56,0.3)` lw 2, + 8 %/frame rising gold motes | L2530 |
| Armour glow (v27) | `shadowBlur 4 + sin(gt*2)*2`, ellipse 14 × 16 at `globalAlpha 0.25` in the armour's colour | L2524 |
| Accessory orbiter (v27) | a mote at `x = 18·cos(gt·2.5 + idx·π/2)`, `y = 10·sin(...) − 8 + bob`; r 3 at alpha 0.7 plus an r 5 halo at 0.3 | L2526 |
| Gear underglow | ellipse 18 × 8 at `y+10` in the weapon colour with `'20'` hex alpha (12.5 %) | L2458 |
| Phoenix Feather | `shadowBlur 12`, ring r 18 `rgba(232,168,56,0.25)` | L2534 |
| Downed timer ring | `#4A9ED8` lw 3, r 20, arc from `−π/2` sweeping `pct·TAU` over a 20 s revive window; revive progress ring `#3DCC7A` lw 3 r 24 | L2438–2441 |
| **Ultimate VFX** `drawUltVfx()` | see below | **L2563–2617** |
| Ground-pound ring | `#F0C040` lw `3·(1−p)`, r `p·60` over **0.15 s**, alpha `1−p` | L2418 |
| Blink line | `#e84393` lw 1 from origin to destination, alpha `0.4·(1 − t/0.3)` over 0.3 s | L2420 |
| Roll / bash afterimage trail | ellipses 11 × 13 at `alpha·0.3` in `#4A9ED8` (Liam) or `#2DB86A` (Noah) | L2424, L2222 |
| Stun stars | 3 gold r-1.5 dots orbiting at `t·3 + i·(TAU/3)`, x radius 6, y radius 3, 18 px above the head | L2621–2625 |

**`drawUltVfx()` — four hero ultimates, L2563:**

| Ult | Phase | Recipe |
|---|---|---|
| **excalibur** (Liam) | charge, `t < 0.5` | Expanding telegraph circle r `t/0.5 · 60`, `rgba(74,158,216,0.3)` lw 2; raised sword glow `rgba(255,255,255, 0.3 + sin(t*20)*0.2)` as a 4 × 20 bar rising `t·20` px |
| | strike, `t ≥ 0.5` | A **cross shockwave**: `len = 200·min(1, p·2)`, `wid = 30·(1 − p·0.5)`, `alpha = 1 − p`; two white bars (horizontal and vertical) with `shadowColor '#4A9ED8'`, `shadowBlur 8`, outlined in `#4A9ED8` lw 2 |
| **storm** (Noah) | whole 1.5 s | Golden aura disc r `30 + sin(t*10)*5` at `rgba(232,168,56, max(0, 1 − t/1.5)·0.3)` |
| **nova** (Collette) | staggered | **Three rings** — `{start 0, maxR 180, #A862C4, a 0.6, lw 4}`, `{start 0.2, maxR 140, #e84393, a 0.4, lw 3}`, `{start 0.4, maxR 100, #C49BF0, a 0.3, lw 2}`; each expands over 0.8 s with `alpha = a·(1−p)`. Plus a **collapsing black void** r `30·(1 − t/0.5)` at `rgba(0,0,0,0.7)` for the first 0.5 s |
| **meteor** (Isabella) | anticipation, `t < 0.8` | Growing ground shadow r `10 + 30·(t/0.8)`, `rgba(0,0,0,0.4)`, squashed `scale(1, 0.4)` |
| | impact, `0.8 ≤ t < 1.1` | Shockwave ring r `p·160`, `#F0C040`, lw `max(1, 6·(1−p))`, alpha `1−p` |
| | aftermath, `0.8 ≤ t < 2.8` | **6 ground cracks** persisting **2 s**, each a line of length `rnd(60,100)` at a random angle, `rgba(100,80,60, (1 − (t−0.8)/2)·0.5)` lw 2 |

The nova's three rings at three radii, three colours, three start times and three line widths is the "many simultaneous layers" lesson in miniature: one ring is a circle, three staggered rings is a shockwave.

### 15.3 Portal — **L5721–5740**

| Element | Value |
|---|---|
| Base size | `s = 30 + sin(portalT·3)·5` → 25–35 |
| Glow | `shadowColor '#A862C4'`, `shadowBlur = 30 + sin(portalT·5)·15` → **15–45** |
| Rings | 3 arcs, radius `s + i·8`, `rgba(168,98,196, 0.6 − i·0.15)`, lw `3 − i`, each spanning **1.5π** starting at `portalT·2 + i` — three offset crescents rotating at 2 rad/s |
| Core | `rgba(26,10,46,0.8)` disc r `s − 5` |
| Inner glow | `rgba(168,98,196,0.3)` disc r `s − 10` |
| Label | `'ENTER PORTAL'`, `bold 12px`, `#e84393`, at `y = s + 20` |
| Sound | `snd('portal', 0.4)` on spawn |

Three *incomplete* arcs at different radii and speeds is what makes it swirl; a full circle would just spin.

### 15.4 Alien crater — **L5809–5942**, particles L5800–5808, vignette L5943

The most layered single object in the game — 14 stacked passes:

| Pass | Recipe |
|---|---|
| Raised earth rim | 24 ellipses at r `+12 + sin(i·4.3+seed)·10`, size `(4 + sin(i·3.1+seed)·2.5)` × 1.6 / × 0.8, `rgba(70,58,48, 0.35 + sin(i·5.7)·0.1)` |
| Scattered debris | 28 pieces at r `+6 + sin(i·5.1+seed)·18`; every 4th is a **glass shard** (`rgba(20,15,40, 0.3 + …)`, a rotated triangle), the rest are rock ellipses `rgba(60,50,45, 0.3 + …)` |
| Scorched earth | radial `r·0.6 → r+25`: `rgba(50,40,35,0.6)` → `0.35` → `0.12` → `0`, clipped to a wobbly path |
| **7 strata layers** | `#3d3228` (1.00), `#362a1f` (0.88), `#2e2218` (0.76), `#261c14` (0.64), `#1e1618` (0.52), `#18101e` (0.42), `#120a1a` (0.34) — burnt umber shading to **purple-black** at the bottom |
| Strata edges | `rgba(80,65,50, 0.1 + i·0.02)` lw 0.6 hairlines between layers |
| Vitrified basin | `#0a0614` filled to `innerRadius` (50) |
| Glass depth | offset radial `rgba(40,28,60,0.4)` → `rgba(20,14,35,0.2)` → transparent, origin shifted up-left for a bowl illusion |
| Impact ripples | 4 concentric wobbly strokes at r `ir·(0.3 + i·0.18)`, `rgba(140,120,180, 0.04 + 0.02·sin(gt·0.4 + i·1.8))` lw 0.4 — frozen shockwaves that breathe |
| Veins | pulsing `0.15 + 0.12·sin(gt·1.2 + i·1.1)` strokes, lw `0.5 + sin(i·1.9)·0.2` |
| **Teal core** | radial to `ir·0.7` (35 px): `rgba(26,188,156, tealPulse·1.5)` → `rgba(26,188,156, tealPulse)` at 0.4 → transparent, where `tealPulse = 0.12 + 0.08·sin(gt·0.7)` |
| Purple secondary | radial `ir·0.2 → ir`: `rgba(123,45,142, 0.06 + 0.04·sin(gt·0.5 + 1.5))` → transparent |
| Rim highlight / shadow | top edge `rgba(90,75,60,0.2)` lw 1.8 arc `−0.9…0.9` at `y−3`; bottom edge `rgba(10,5,15,0.15)` lw 1.2 at `y+3` |
| **Energy pulse ring** | every **8 s**, a ring expands from `r·0.3` to `r·1.5` over **1.25 s** (`_pulseRing += dt·0.8`), `rgba(26,188,156, (1−p)·0.25)`, lw `2 − p·1.5` |
| **Upward particles** | 18 sustained, `vy = −rnd(10,20)` (they rise — "these particles drift upward, that's not how particles work"), `x += sin(gt + wp)·0.5` sway, life `rnd(2,4)`, size `rnd(1,3)`, `#A862C4` / `#1abc9c` / `#aaa`, drawn at `alpha = life/maxLife · 0.7` |
| Screen vignette | within `radius + 40` px: radial `rgba(123,45,142, 0.08·(1 − d/140))` |

Three oscillator speeds (0.4, 0.5, 0.7, 1.2 rad/s) and an 8-second pulse cycle that is *slower than anything else in the game* — the crater's rhythm is wrong on purpose.

### 15.5 Citadel and Shadow Realm

| Look | Value | Line |
|---|---|---|
| Shadow Realm wash | `rgb(60,0,80)` at `globalAlpha 0.25`, replacing the day/night tint entirely | L3339 |
| Citadel floor 1 | ambient `rgba(18,8,28,0.72)`; walls `#2A1840`/`#201030`/`#382050`; tiles floor `#18102a`, wall `#0e0818`, accent `#2a1a40`, door `#6a3a8a`; atmo 20 × `#8850A8` drifting | L842–847, L6734 |
| Citadel floor 2 | walls `#281438`/`#1E0C2C`/`#341848`; tiles floor `#140a20`, wall `#0a0410`, door `#5a2a7a`; atmo 25 × `#7B3CA0` rising | L844, L848, L6735 |
| Citadel floor 3 | walls `#381414`/`#2C0E0E`/`#401818` — **red**; tiles floor `#100818`, wall `#08040e`, door `#4a1a6a`; atmo 30 × `#A83828` drifting | L844, L849, L6736 |

The Citadel's three floors get darker (`#0e0818` → `#0a0410` → `#08040e`) while the air gets denser and shifts violet → violet → **red**. Descent is written into the palette.

**3D equivalent for §15 as a whole.** Full-screen plates → the post stack: fog colour animation (weather/night), a fullscreen colour-grade quad for blood moon / shadow realm / low HP, a vignette pass (always on, `#0B0E1A` at 0.25 at the corners), and short flash quads. `shadowBlur` glows → **selective bloom** on an emissive layer (this is the single biggest visual upgrade available: v27's glows are fake and cannot light anything). Ult rings, pound rings, meteor shockwaves and crater pulses → ground-projected decals with animated radius/alpha, plus a matching short-lived point light. Meteor cracks → a decal that fades over 2 s. The crater becomes a genuinely lit set piece: strata as vertex-coloured geometry, obsidian basin as a smooth-shaded dark material (the one place `flatShading: false` is allowed), teal core as an emissive disc on the bloom layer with a teal point light, upward motes as a `Points` system with negative gravity, and the 8-second pulse as an expanding emissive ring. Portal → three rotating incomplete torus arcs with an emissive violet material, a dark core disc, and a violet point light.

---

## 16. Hero drawing style (for the 3D character brief)

**Lines:** `HDEFS` **L2139–2144**, `HERO_SKINS` L2146+, `Hero.prototype.draw` **L2414–2537**, `drawHeroIdle` **L2538–2543**.

### 16.1 Canon definitions

```js
var HDEFS=[
 {nm:'LIAM',    col:'#4A9ED8',dk:'#2E78A8',wc:'#bdc3c7',spd:180,hp:250,rng:48, dmg:32,cd:.35,aType:'melee',ultCD:25,hair:'#8B6914',cape:'#2B6A94',sigCd:6,sigNm:'Shield Bash'},
 {nm:'NOAH',    col:'#2DB86A',dk:'#1E8A4E',wc:'#7A4018',spd:175,hp:140,rng:230,dmg:16,cd:.28,aType:'arrow',ultCD:22,hair:'#5B3A1A',cape:'#1E7A44',sigCd:4,sigNm:'Dodge Roll'},
 {nm:'COLLETTE',col:'#A862C4',dk:'#844CA0',wc:'#E8A838',spd:165,hp:120,rng:260,dmg:22,cd:.6, aType:'magic',ultCD:28,hair:'#6B3A2A',cape:'#9648B0',sigCd:8,sigNm:'Arcane Blink'},
 {nm:'ISABELLA',col:'#F0C040',dk:'#C89E28',wc:'#D84830',spd:160,hp:180,rng:58, dmg:28,cd:.4, aType:'whirl',ultCD:20,hair:'#D4A03C',cape:'#D88030',sigCd:5,sigNm:'Ground Pound'}
];
```

> **Discrepancy to resolve before the 3D character pass.** The Working Rules and Brief §2 state the canon colours as Liam blue, **Noah orange**, Collette purple, **Isabella pink/red**. v27 renders **Noah green `#2DB86A`** (also `--noah` in CSS, L11, and his default skin, L2151) and **Isabella gold `#F0C040`** (`--isabella`, L11). Isabella's *damage-number* colour is orange `#D88030` and her *cape* is orange `#D88030`, and her hair bows are pink `#e84393`; Noah's cape is green. The file is the truth for what v27 looked like; the canon statement is the truth for what may not change. This needs a decision logged in `docs/DECISIONS.md` before any hero model is authored — it is a canon question, not a taste question.

### 16.2 Silhouette (all four heroes share one body)

| Part | Geometry |
|---|---|
| Ground shadow | `rgba(0,0,0,0.2)` ellipse **14 × 6** at `y+12` |
| Cape | quad from `(-8, bob-5)` via `(-12 + cs·5, bob+10)` to `(-6 + cs·3, bob+18)` and mirrored, in `cape` colour; `cs = sin(bobT·0.8)·0.3` |
| Body (dark) | ellipse **12 × 14** at `y+2` in `dk` |
| Body | ellipse **11 × 13** in `col` |
| Head | circle **r 9** at `bob − 16` in `col` |
| Hair | per hero, in `hair` colour (below) |
| Eyes | white ellipses **2.5 × 2.5·eyeH** at `±3 + cos(face)·2`, pupils `#2c3e50` r 1.3 at `±3·1.3` |
| Weapon | drawn in a nested transform at `(0, bob−4)` |
| Name plate | `bold 10px`, white, `globalAlpha 0.85`, `'<NAME> Lv<n>'` at `bob − 30` |

Hair, per hero: **Liam** a half-disc r 8 plus three 3 × 6 spikes; **Noah** a half-disc from `π+0.3` to `TAU−0.3` plus a 14 × 4 headband; **Collette** a half-disc plus two 4 × 14 pigtails and two r-3 side buns; **Isabella** a larger r-10 half-disc, two r-5 volume lobes, and two **pink `#e84393` r-3 bows**.

### 16.3 Idle bob, breathing and blink

| Motion | Formula |
|---|---|
| Walk bob | `bob = sin(bobT)·3·bobA`; `bobT += dt·10` while `hypot(vx,vy) > 20` |
| Bob amplitude | `bobA` lerps to 1 at 5/s when moving, to 0 at 5/s when idle — the bob *fades out*, it does not stop |
| Squash | `sY = 1 + sin(bobT·2)·0.06·bobA` — vertical squash at double the bob frequency |
| **Breathing** | when `state === 'idle'`: `sY *= 1 + sin(gt·1.5 + idx)·0.015` — a **1.5 %** amplitude at 1.5 rad/s, phase-offset per hero by `idx` |
| **Blink** | `blinkPhase = (gt + idx·1.7) % 4`; `eyeH = blinkPhase > 3.85 ? 0.3 : 1` — a **0.15 s blink every 4 s**, staggered **1.7 s** per hero; pupils are hidden entirely while `eyeH ≤ 0.5` |
| Face direction | eyes and weapon offset by `(cos(face)·2, sin(face))` — a 2-pixel eye shift is the entire aiming read |
| Footfall dust | 12 %/frame while moving (§9.2) |
| Downed | `alpha = 0.3 + sin(gt·3)·0.1`, blue 20 s timer ring r 20, green revive ring r 24 |
| Death | spins `deathA·TAU` while scaling to zero, `deathA += dt·3` |
| Airborne (Isabella sig) | body offset `−30` px, scaled `0.6`, with a separate ground shadow 16 × 6 left behind |

**Idle animations** after **10 seconds** idle (`drawHeroIdle`, L2538, active hero only): a 120-frame (4 s) loop per hero — **Liam** kicks a `#7A4018` pebble for the first second, then dusts his shield; **Noah** adjusts his bow, then flicks a white spark; **Collette** traces a `#A862C4` arc and drops gold sparkles at 20 %/frame, then drops a small violet card; **Isabella** looks around, kicks dirt at 15 %/frame, then watches a gold bug circling at `x + sin(f·3)·5, y − 20 + cos(f·2)·3`.

### 16.4 Weapons and attack arcs

| `aType` | Hero | Idle | Attack |
|---|---|---|---|
| `melee` | Liam | 24 × 4 blade in `wc` with a gold `#E8A838` 4 × 6 guard and an `#ecf0f1` triangular tip | Rotates `face + sin(atkAnim·π)·1.2`; slash arc r `rng+5` across `±π/3` at `alpha·0.6` in the weapon colour, plus a white lw-8 inner arc r `rng−5` across `±π/4` at `alpha·0.2` |
| `arrow` | Noah | bow arc r 10 from `−0.8` to `0.8` in `wc` lw 2 | Nocked arrow (14 × 2) drawn while `atkAnim < 0.5` |
| `magic` | Collette | `#7A4018` staff 18 × 3 + orb r 5 in `wc`, white core r 2.5 pulsing `sin(gt·5)·0.3 + 0.7`; the whole staff wobbles `sin(gt·3)·0.2` rad | — |
| `whirl` | Isabella | two 14 × 4 arms with r-3 white heads, rotating at `spinA` | Full gold circle r `rng` at `rgba(232,168,56, atkAnim·0.5)` lw 3 |

v27 weapon-visual tiers (v27 gear system): `WVIS_COLS = {sword '#B0B0B0', flame '#D84830', quick '#D88030', arcane '#A862C4', heavy '#7A8A9A', frost '#6BCCEE', shadow '#3D2066'}` (L2476), each with its own tip decoration (flame gets an `#E85020`/`#FF8040` tip block, frost a translucent white blade wash, shadow a violet aura) and its own trail-particle colour.

**3D equivalent (Brief §4.6).** Chunky low-poly heroes, strong silhouettes, canon colours, signature props (Liam's shield, Noah's bow, Collette's staff, Isabella's oversized weapon — all four already present in v27's `aType`). Port these exactly:
- The **breathing** amplitude (1.5 %) and rate (1.5 rad/s), phase-offset per hero.
- The **blink**: 0.15 s every 4 s, staggered 1.7 s per hero — Brief §4.6 explicitly asks for "simple expressive faces with blink"; v27 already has the timing.
- The bob **fading in and out** via `bobA` rather than snapping — in 3D this becomes the idle↔walk animation blend weight.
- Footfall dust at 12 %/frame becomes a footstep-event-driven dust puff.
- The 2-pixel eye offset toward `face` becomes head/eye look-at.
- Idle animations after 10 s become the "emote" slot in the Brief's animation set — and they are *characterisation*, not filler; keep all four verbatim.
- Attack arcs become swept trail meshes (`MeshLine`-style ribbon along the swing) plus the existing weapon-trail particles.

---

## 17. UI atmosphere — the look being replaced

**Lines:** design tokens **L8–L20**, keyframes **L19–L35**, HUD **L67–L89**, overlays L240–L308.

### 17.1 Design tokens (`:root`, L8–20)

```css
:root{
--gold:#E8A838; --gold-glow:rgba(232,168,56,0.45);
--dark-bg:rgba(11,14,26,0.93);
--glass-bg:rgba(232,168,56,0.06); --glass-border:rgba(232,168,56,0.14);
--liam:#4A9ED8; --noah:#2DB86A; --collette:#A862C4; --isabella:#F0C040;
--hp-green:#2ECC71; --hp-yellow:#F0B840; --hp-red:#E85D5D; --xp-purple:#A07BDC;
--bg-0:#0B0E1A; --bg-1:#101428; --bg-2:#1A1E30; --bg-3:#1E1832;
--text-main:#FFF5E6; --text-sec:#D4C4A8; --text-dim:#998A72;
--font:'Trebuchet MS','Segoe UI',system-ui,-apple-system,sans-serif;
}
```

The whole UI is **one accent** (`--gold #E8A838`) over **four navy backgrounds** (`#0B0E1A` → `#1E1832`, the last shifted violet) with **warm off-white text** (`#FFF5E6` / `#D4C4A8` / `#998A72` — a warm three-step text ramp, never pure white or grey). The "glass" is not a neutral frost: `--glass-bg` is gold at 6 % and `--glass-border` is gold at 14 %, so every panel is faintly warm against the navy. That warm-gold-on-cool-navy pairing is the game's entire UI identity and it matches the world's warm-lights-on-cool-night rule exactly.

### 17.2 Glass panel recipe

`background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8–16px; backdrop-filter: blur(6–10px)` — used on `.hero-card` (L52), `.ft` (L57), `.vic-stat` (L245), `.dng-entry-card` (L269), `.dng-result-card` (L277), `.save-dropdown` (L42), `.miniboss-popup` (L261). Overlay backdrops use `--dark-bg` `rgba(11,14,26,0.93)`, and the victory overlay uses a warmer `rgba(14,12,8,0.93)` (L241).

### 17.3 Keyframes (L19–35)

| Name | Recipe | Used on |
|---|---|---|
| `fadeIn` / `fadeOut` | opacity + `scale(0.95↔1)` / `scale(1→0.97)` | overlays |
| `pulseGlow` | `box-shadow 0 0 15px var(--gold-glow)` ↔ `0 0 30px + 0 0 60px rgba(232,168,56,0.2)` — a **two-layer** glow at the peak | attention panels |
| `glowTitle` | `text-shadow 0 0 20px` ↔ `0 0 40px + 0 0 80px rgba(232,168,56,0.3)`, 3 s ease-in-out infinite | `#loading h1` |
| `btnPulse` | `box-shadow 0 4px 25px rgba(232,168,56,0.5)` ↔ `0 6px 40px rgba(232,168,56,0.8)`, 2 s infinite | `.dng-btn.enter`, `.bounty-claim-btn` |
| `heroBob` | `translateY(0 ↔ -6px)`, **3 s** ease-in-out infinite, staggered `0 / 0.3 / 0.6 / 0.9 s` across the four hero cards | `.hero-card` (title screen) |
| `bounceIn` | `scale 0.3 → 1.05 → 0.95 → 1` with opacity, 0.4–0.6 s ease-out | victory title, dungeon cards |
| `cardPop` | `translateY(40px) scale(0.9)` → `0 / 1`, staggered `0.05 s` per stat tile up to 0.35 s | `.vic-stat` grid |
| `slideInRight` / `slideInUp` / `slideDown` | 100 % / 40 px / 100 % offsets with opacity | notifications, HUD elements |
| `letterboxIn` / `letterboxOut` | `height 0 ↔ 60px` | boss intro (§13) |
| `shake` | `translateX ±4px` at 10/20/…/90 % | error states |
| `hpPulse` | `opacity 1 ↔ 0.6`, 0.8 s infinite | `.hud-hp-bar.critical` |
| `countUp` | `translateY(10px)` + fade | stat reveals |
| `shimmer` | `background-position -200px → 200px` | loading strips |
| `goldFloat` | `translateY(0 → -60px) scale(1 → 0)`, `opacity 0.8 → 0` | **defined at L34 but never referenced anywhere in the file** — dead code. The gold-pickup float that exists in play is the canvas-space `dmgN`/`xpFx` pair (§9.2, §14), not this. |

### 17.4 HUD

Top-left cluster (L69–89): hero name 13 px bold with `text-shadow 0 1px 4px rgba(0,0,0,0.6)`; a **200 × 22** HP bar on `rgba(0,0,0,0.5)` with a 6 px radius and a centred overlaid value; a **200 × 8** XP bar filled `linear-gradient(90deg, var(--xp-purple), #C49BF0)`; a stat row; then a row of **46 × 54** portrait tiles with a 3 px HP sliver on top, the active one bordered `var(--gold)` with `box-shadow 0 0 12px var(--gold-glow)`, locked at 40 % opacity, downed at 50 %.

**Biome-reactive accent** (`updateBiomeAccent()`, L3347–3354): as the player crosses biomes, the active portrait's border colour and glow, and the mode label colour, retint to `{forest '#E8A838', desert '#D4944A', cave '#8B7BCC', swamp '#6AAF5C', frozen '#88B8D8', volcanic '#D86040'}`. The UI changes colour with the world — exactly the Brief §4.2 rule "UI pulls accents from the active island", already implemented in v27.

Minimap (L3366+): **120 × 120**, background `#101428`, border `rgba(232,168,56,0.20)`, a pre-computed 20 × 20 biome grid at `globalAlpha 0.45` using `{forest '#162E20', cave '#1C2040', desert '#604828', swamp '#143018', frozen '#384868'}`, with hero dots r 3, spawner squares 4 × 4 `#D84830`, cage dots `#E8A838`, boss dot r 5 `#ff0000`, portal `#A862C4`, biplane `#FFD700` r 2, crater `#7b2d8e` r 3, and pulsing quest markers.

**What the redesign replaces (Brief §6).** A single-accent gold-on-navy glassmorphic HUD in Trebuchet MS, built from `backdrop-filter` panels, gold glow keyframes, a 200-px bar stack top-left, a 46 × 54 portrait strip, and a 120-px corner minimap. The two ideas worth carrying forward regardless of the new metaphor: (1) **warm accent over cool ground**, matching the world's lighting logic; (2) **the accent retints per biome**, so the UI belongs to wherever you are standing.

---

## 18. Not found in the source

Stated plainly, per Working Rule 1 — these are items the task named that do not exist in `stewart-squad-v27.html`, not gaps in the search:

| Item | Finding |
|---|---|
| **Sky gradient per day phase** | There is **no sky** in the overworld — it is a top-down view. Day/night is a flat full-screen colour plate (§2.1), not a gradient. The only sky gradient in the file is inside the meteor cutscene's first-person scene (**L4644–4649**): `#040410` → `#080820`/`#081828` → `#0E1230`/`#102038` → `#1A2545`/`#152820` → `#2A3050`/`#283848`/`#1E3828`, biome-tinted for frozen and swamp, with a horizon glow band `rgba(80,120,170,0.08)` (frozen) or `rgba(60,90,40,0.06)`. |
| **Stars** | No stars in the overworld at any hour. A 200-star field exists **only** in the meteor cutscene (**L4537–4547**): position `rnd(0,1)` normalised, size `rnd(0.4,2.2)`, brightness `rnd(0.3,1)`, twinkle speed `rnd(1,5)`, phase `rnd(0,TAU)`; drawn as `rgba(255,255,240, bright·(0.55 + 0.45·sin(gt·ts + tp)))`, with a "washout" radius that dims stars near the meteor (`a *= max(0.05, d/washR)`). |
| **Moon** | **No moon is drawn anywhere.** "Blood moon" (L5767–5770, L6350) is a world event that applies a red screen tint and stat multipliers; no lunar disc is ever rendered. |
| **Campfire** | **No campfire exists.** The only fire in the game is the dungeon wall torch (§8.2). There is no camp/home-base fire object; the Brief's Fernwood-style camp with a stone campfire ring is new work for the 3D build. |
| **Lantern** | **No lantern object exists.** `DNG_DECOR` (L845) contains only pot / crate / bones. The "Lamplighter Quartz" NPC (L702) is a quest-giver, not a light source. |
| **`addAbilityVFX` call sites** | The v24 ability-VFX registry (L1746–1750) is defined but **never called**. Hero ultimates use `h._ultVfx` + `drawUltVfx()` instead (§15.2). The arena-effect system next to it *is* used. |
| **`goldFloat` keyframe** | Defined at L34, **never referenced**. Gold and heal floats in play are canvas `dmgN` text particles. |
| **World-space hero selection ring** | None. The active hero is indicated only by the HUD portrait border (§15.2). The Brief §4.1 reference image's "soft selection ring" is new work. |
| **Boss intro camera push-in** | The game is `paused` for the whole 4.1 s intro; the camera does not move except for the `screenShake(12,1)` that runs underneath. Cinematic push-in is new work (Brief §4.5). |
| **Thunder delay** | There is none — `snd('boom', 0.3)` fires on the same frame as the flash (L1613). A distance-based delay would be a 3D improvement, not a port. |

---

## 19. The three recipes most responsible for the magic

**1. The dungeon light compositor (§6.2, L8007–8029) — and specifically the shared torch oscillator.**
A tinted (never black) ambient plate on an offscreen canvas, punched through with `destination-out` radial gradients whose falloff curves are hand-tuned (1 / 0.7 / 0.3 / 0), with atmosphere particles drawn *on top* of the darkness so they glow rather than dim. The detail that makes it feel alive rather than technical is that `trc._flVal` — one `sin` value per torch at a per-torch frequency of 8.8–10 Hz — drives *both* the flame's shape and its light pool. Light and fire agree. Everything else in the room is lit by that agreement.

**2. Simultaneous ambient layering with distinct motion signatures (§2, §4, §5, §7).**
At any moment in the overworld the screen carries, at minimum: ground colour + noise-blended biome boundary + 15 % deterministic detail tufts, one or two biome-specific ambient particle systems with a *direction signature* (leaves fall, embers rise, sand streams, wisps drift, snow falls), weather particles and a tinted weather plate, the fog-of-war disc with a 30 % feather, the day/night tint, and the always-on world vignette in `--bg-0` navy. None of these is expensive and none is clever. It is the count and the layer order that produce the "toy set you could reach into" feeling, and it is exactly the lesson the Brief §4.4 names: *five layers minimum, always*.

**3. Grandpa Ed's biplane (§11) — four independent noise sources on one 60-pixel sprite.**
Course wander every 2.5–5 s, a 2 Hz wobble, a lagging bank that leads the turn and levels after it, and an engine sputter every 2.5 s that stops the propeller dead and drops the plane 3 px. Then the shadow whose opacity alone communicates altitude, the six-frequency two-segment scarf, occasional barrel rolls and loops, and a 0.7-second-staggered parachute spray. None of it is a game system, and all of it is characterisation — which is why "if you see a yellow biplane, wave; that's Grandpa Ed" (`TIPS`, L727) works as a line. Carry the *method*, not just the values: give every recurring world object more than one independent, incommensurate motion source, and it stops being an object.

---

*Every value in this document was read from `docs/legacy/stewart-squad-v27.html` and its cited line verified before writing. Line numbers are from the 9,901-line file as committed.*
