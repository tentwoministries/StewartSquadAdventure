# World, events and weather — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** BRIEF §0, §2, §4 (twice), §5, §6, §7.3–7.4, §8, §11 · ATMOSPHERE_RECIPES §1–§19 in full (§19 first) · SYSTEMS_INVENTORY Part 2 §1–§2, §3.5–3.9, §4, §5, §9, §10, §15, §18.1–18.2; Part 1 §11 (`ETYPES`), §14.1 (spawner pools), §15 (mini-bosses) · FAMILY_CANON §2.1–2.2, §3.6, §5.5, §10.1, §10.3–10.4, §10.6, §12.9, §13 · AUDIO_INVENTORY §12, §14, §21 · DECISIONS.md · legacy HTML L688, L1611 (verified by grep) · **Depends on:** none earlier (first wave; `heroes.md` and `story-beats.md` are being written concurrently) · **Feeds:** camp.md, npcs.md, dungeons.md, ui-ux.md, audio.md, enemies.md, bosses.md, cutscenes.md, story-beats.md
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

v27's world felt alive because nine cheap layers were stacked in a fixed order every frame; the day/night plate, the weather wash, the fog disc and the biome particles did the work the drawing could not. This file turns those plates into a real sky, a real sun and moon, tinted fog, GPU particles and lights that light things, keeps every gameplay number and every announce string, and adds the living-world layer v27 never had: a moon, stars, aurora curtains that power a dungeon, animals that flee, and a river you can fish.

## 1. What v27 does

Compact, from the teardown. Cited sections are the record; this is the summary.

### 1.1 Day/night (ATMOSPHERE §2, SYSTEMS_INVENTORY Part 2 §5)

- One 240 s loop, `p = (dayTime % 240) / 240`. Day `p < 0.35` and `p ≥ 0.85` (50 %), dusk 0.35–0.45, night 0.45–0.75 (30 %), dawn 0.75–0.85. The clock freezes in dungeons and while paused (L9235).
- There is no sky, no sun, no moon, no stars, no shadows. Night is a flat plate: dusk ramps `rgb(60,20,0)` to alpha 0.18 over 24 s, then **hard-cuts** to `rgba(10,15,50,0.32)` for night, and hard-cuts back to the rust at dawn. The plate is only 32 % opaque, so saturated ground colours survive beneath it; every glowing thing is drawn before the plate at full brightness, so warm points punch through the cool wash (ATMOSPHERE §2.4: "contrast of temperature, not of value").
- Night gameplay: XP ×1.5, enemy speed ×1.15, fog-of-war radius ×0.75, fireflies in every biome at 30 %/frame, Forest ember motes at 5 %/frame, aurora over the frozen biome, HUD `XP +50%` badge, `nightWarrior` counts kills.
- Cutscenes own their own sky (`drawDayNightTint` returns early). The Shadow Realm replaces the tint with `rgb(60,0,80)` at 0.25: no time of day.

### 1.2 Aurora (ATMOSPHERE §3, SYSTEMS_INVENTORY Part 2 §4.6)

Three 10 px screen-space ribbons at the top of the screen, three hue families (teal-green, indigo-lavender, rose-magenta), alpha 0.07–0.17, positions and alphas on incommensurate oscillators so it never loops. Trigger: not in a dungeon, `isNight()`, camera centre over `frozen`. Not gated on weather. A second, tiny aurora shimmers on the frozen dungeon entrance arch (§3.2). It is faint and rare, which is why players remember it.

### 1.3 Weather (ATMOSPHERE §4, SYSTEMS_INVENTORY Part 2 §4, AUDIO_INVENTORY §14)

- Six types: `clear`, `rain`, `storm`, `snow`, `sand`, `fog`. Per-biome pools weighted by repetition: forest `clear ×2, rain, storm, fog`; cave `clear ×3, snow`; desert `clear ×3, sand ×2, storm`; swamp `clear, rain ×2, fog ×2, storm`; frozen `clear ×2, snow ×3`.
- Durations: clear 60–120 s, anything else 20–60 s; `transT = 2` is decremented but never read. Re-rolled from the pool of the biome under the active hero. Skipped in dungeons. Announces `<Weather name>!` in `#94C4DC` or `The weather clears.` in `#dfe6e9`.
- Particles spawn in camera space (constant cost): rain 3/frame (storm 5/frame) as streaks drawn from their own velocity; snow as rotating discs; sand streaming sideways with zero drag. Cap 80.
- Full-screen washes: fog `rgba(200,200,200,0.25)`, sand `rgba(194,154,100,0.2)`, rain `rgba(10,10,30,0.08)`, storm `rgba(10,10,30,0.2)`.
- Lightning (storm only): first strike 4–8 s, then every 10–18 s, at hero ±400 px and never within 200 px of the last strike; a **1.0 s amber telegraph** (two rings r 60 and r 30, `#E8A838`, pulsing at ~2.4 Hz); then a 0.12 s white flash with a double envelope (0.45 cap for 0.06 s, then a 0.12 ripple), `snd('boom', 0.3)` on the same frame, **30 damage to every enemy within 60 px, heroes never hit**, 12 sparks. No thunder delay, no rumble.
- Gameplay: snow hero damage ×1.1; rain and storm enemy speed ×0.9; sand vision ×0.625; fog vision ×0.5625; storm and sand widen parachute-crate drift; any non-clear transition advances the `weather` bounty. No weather changes hero speed.
- Weather is **silent** except the strike. There are no ambient loops of any kind (AUDIO_INVENTORY §21).

### 1.4 Ambient biome particles (ATMOSPHERE §5)

Always on, regardless of weather. Direction is the signature: forest leaves **fall** (25 %/frame, four autumn colours, rotating ellipses) and night embers **rise**; swamp wisps **drift up-slow** (`#7dff7d`, blinking) and marsh bubbles rise; desert sand **streams sideways** (40 %/frame); cave dust drifts and crystal sparkles rise; frozen snow **falls fast** (45 %/frame). Every biome has one always-on and one occasional layer, so none reads as empty. Fireflies (`#ffe066`) blink by shrinking radius to zero, not by fading.

### 1.5 Fog of war and ground (ATMOSPHERE §6.1, §7)

- A navy plate `rgba(10,10,30,0.65)` with a 300 px hole around the controlled hero, feathered over the outer 30 %, radius scaled by `nightFogMul()` (night ×0.75, sand ×0.625, fog ×0.5625, floor 0.5). Entities cull at radius +20 px so nothing pops. The plate is the same navy as the night tint, so at night the two merge into one darkness.
- Ground: seeded value noise scores five biomes (forest centre, cave top-left, desert top-right, swamp bottom, frozen top edge), cached per 60 px tile; a fixed 35 % one-tile blend at boundaries; a deterministic 15 % detail tuft per tile `(gx*73 + gy*137) % 100 < 15`; dark saturated ground colours (`forest #1E4A3A`). An always-on world vignette `rgba(11,14,26,0.25)` frames every frame.

### 1.6 World events (SYSTEMS_INVENTORY Part 2 §9, FAMILY_CANON §10.6)

First event 60 s into a run, then every 90 s; one at a time; never in the Shadow Realm, during the Goblin King, or in a dungeon. Uniform pick from five, `snd('event_start', 0.3)`:

| Event | Duration | What happens | Reward |
|---|---|---|---|
| `caravan` | 20 s | 8 `caravan_goblin` (hp 40, spd 60) walk an edge-to-edge line | 3 gear drops + 50 XP, `Caravan loot secured!` |
| `bloodmoon` | 25 s | red screen tint pulsing 0.15–0.25; no moon is drawn | XP ×3, enemy speed ×1.25, enemy damage ×1.5; `eventSurvivor` |
| `treasure` | 15 s | one fleeing `treasure_goblin` (hp 100, spd 200, gold) | 1 `rollGearDrop(1,1)` + 2 `rollGearDrop(1,0)`; `treasureHunter`; escapes at a world edge |
| `spring` | 20 s | green disc r 80 with a breathing ring, label `Healing Spring` | 25 HP/s inside 80 px |
| `earthquake` | 3 s | `screenShake(12, 3)`, the longest shake in the game | every enemy stunned 2 s |

Oddity: only `bloodmoon`, `spring` and `earthquake` call `updateQuestProgress('survive_event')`, so `desert_1` ("Survive 3 world events") ignores caravans and treasure goblins.

### 1.7 Endless mode (SYSTEMS_INVENTORY Part 2 §10)

Wave survival after victory: enemy count `min(4 + floor(wave·0.8), 15)`, stats ×`(1 + wave·0.05)`, mini-boss every fifth wave, alternating Goblin King and Shadow Queen every tenth, score `wave·100 (+500 boss)`, high score in `localStorage`. World events, weather and the clock keep running underneath it.

### 1.8 The peaceful layer

**None.** v27 has no animals (FAMILY_CANON §1.4: the only animal is the escort frog, `🐸 Familiar`), no fishing, no campfire, no lantern, no stars, no moon, no sky gradient outside the meteor cutscene, and no ambient audio (ATMOSPHERE §18, AUDIO_INVENTORY §21). Everything in §2.7 is new work the brief asks for (§5.5 "Peaceful layer: fishing, pets at camp, photo mode").

### 1.9 Oddities that change design

- The dusk→night hard cut is a felt "night falls" beat, not just a bug to smooth away (ATMOSPHERE §2.1).
- `transT` is never read: v27 weather has no visual cross-fade at all.
- `caravan` and `treasure` do not count as survived events (§1.6).
- SYSTEMS_INVENTORY Part 1 (L2493, L2835) says `updateBountyProgress('weather', …)` is never called and the *Storm Chaser* bounty is uncompletable. **That is wrong.** The call is at legacy L1611 inside `updWeather`, and the bounty's `type` is `'weather'` (L688); both were verified by grep for this file. The bounty works in v27; only `nodmg` is orphaned. Recorded here so no one "fixes" it.
- Two canon strings share the name *Storm Chaser*: the achievement (`Fight through 5 thunderstorms`) and the bounty (`Fight through 3 weather changes`). Both are sacred; ui-ux.md must keep them distinguishable by icon and context (P2 name collision).
- The cave biome's only weather is snow, and it is the one v27 biome the brief's four-island world does not name (see §5.3).
- `dayTime` freezes in dungeons, which makes the brief's "aurora-powered mechanisms that only work at night" impossible without a change (§2.1.1).
- Blood Moon has no moon.

## 2. What it becomes

### 2.0 Conventions used in this file

- **Scale:** 25 v27 px = 1 m. A v27 hero (~40 px) is 1.6 m; the 3200 px world is 128 m across. Every v27 radius below is converted at this scale. If `heroes.md` sets a different hero height, the implementer rescales by the same ratio once, in `src/style/scale.ts`, and nothing else changes.
- **Camera:** elevated orbit, pitch 45–55°, hero at about one-eighth of screen height, roughly 18–22 m from the hero (Brief §4.5). Every "reads at distance" note below is judged there.
- **Tokens** are named `island.thing` or `family.thing` and become `src/style/` constants in Phase 1. Brief §4.2 hexes are the roots.
- **Islands:** `forest`, `desert`, `bog`, `frozen`, `shadow`. v27's `swamp` key becomes `bog`; the v27 `cave` biome is not an island (§5.3).
- **Clock phase `p`** is 0–1 over one full day. See §2.1.1 for the re-anchoring from v27.
- **Signals** are names the sim publishes each fixed step (`world.clock.p`, `world.aurora.intensity`, `world.weather.type`, `world.vis.radius`); every other design file reads them by these names.

### 2.1 The clock and the seven keyframes

#### 2.1.1 Cycle length and phases

| Item | v27 | Now | Why |
|---|---|---|---|
| Cycle length | 240 s | **480 s** (8 min) | Seven keyframes need room: at 240 s golden hour is 24 s and the sun sweeps 0.75°/s, so shadows visibly slide like a time-lapse. At 480 s golden hour is 48 s and shadows move 0.37°/s, calm enough to read as a place. Proportions kept exactly. |
| Proportions | day 50 %, dusk 10 %, night 30 %, dawn 10 % | same | The v27 rhythm; night stays 30 % of play. |
| Anchor | `p = 0` is early day | **`p = 0` is dawn** | Readable keyframe order. Migration: `p_new = (p_v27 − 0.75) mod 1`. Saves store `p_new`. |
| Runs in dungeons | no (frozen) | **yes** | The Hermit's Observatory needs night (Brief §5.3.4). Dungeons read `world.clock`; they may sky-lock their own lighting (§2.8) but the clock keeps time. |
| Runs during cutscenes | no | no | Cutscenes own the sky (cutscenes.md). |
| Runs while paused | no | no | — |
| Dusk→night snap | hard cut | 4 s fast ease at `p = 0.70` | Keeps the felt "night falls" beat without the pop. |
| Rest to skip time | none | **campfire rest** advances the clock to the next dawn (`p = 0.02`) or dusk (`p = 0.65`) over a 3 s sky sweep | Lets a kid reach night for the aurora, or day for the sunbeam mirrors, without waiting; camp.md owns the prompt and the campfire. |

Gameplay phases (new `p`): **dawn** 0.00–0.10 · **day** 0.10–0.60 · **dusk** 0.60–0.70 · **night** 0.70–1.00. `isNight()` is `p ≥ 0.70`. `isDeepNight()` is `p ≥ 0.85` (new; gates the meteor shower).

Night gameplay effects: XP ×1.5, enemy speed ×1.15, `vis.radius` ×0.75, fireflies, `nightWarrior` counts: **all kept**. Blood Moon still overrides XP to ×3 (§2.5). The HUD `XP +50%` badge is kept (ui-ux.md).

#### 2.1.2 Keyframe positions

The lighting rig blends between seven keyframes with smoothstep on `p`; the sun and moon positions are interpolated on a great-circle arc, not lerped in Cartesian space.

| # | Keyframe | `p` | Seconds into the day | Sun elevation / azimuth | Moon elevation / azimuth |
|---|---|---|---|---|---|
| 1 | dawn | 0.02 | 10 | 6° / 80° (E) | set |
| 2 | morning | 0.15 | 72 | 30° / 110° | set |
| 3 | noon | 0.35 | 168 | **58°** / 180° (S) | set |
| 4 | golden hour | 0.54 | 259 | **16°** / 245° | set |
| 5 | dusk | 0.65 | 312 | 4° / 270° (W) | 8° / 95° rising |
| 6 | night | 0.78 | 374 | set | 35° / 130° |
| 7 | deep night | 0.92 | 442 | set | 55° / 200° |

Noon is capped at 58° so shadows keep about 0.6× object height; a 90° sun is the flat "default engine" look the anti-palette bans. Azimuth is world-fixed (the island's north is +Z); the player's yaw rotation changes only where the key falls on screen, which is why the screenshot stations are seeded at fixed yaws.

The **directional light** is a single `DirectionalLight` that is the sun by day and the moon by night; it crosses over during dusk (0.60–0.70) by fading to the dusk floor, snapping its position to the moon at `p = 0.70` under cover of the fast ease, then rising. PCF soft shadows, 2048 desktop / 1024 mobile, shadow radius 3 by day, 4 at golden hour, 5 at night (softer moonlight). The shadow frustum follows the hero (ortho 40 × 40 m).

#### 2.1.3 Forest keyframe table (build-ready for the pilot)

Colours are hex; intensities are three.js `intensity` values with physically-correct lights on (tune the whole column once if the renderer differs). "Hemi" is `HemisphereLight(sky, ground, intensity)`. Fog is height fog in the shared material chunk: `near`/`far` are the distances (m) at which fog reaches 5 % and 90 % of `fog.max` (0.85 default), with a 12 m height falloff so the sky stays clear. The sky dome is a 3-stop vertical gradient (zenith at +90°, horizon at 0°, ground at −20°) plus a sun/moon glow lobe. Exposure is the ACES `toneMappingExposure` multiplier. Ambient sets are §2.4 names.

| Keyframe | Key colour · intensity | Hemi sky · ground · intensity | Fog colour · near / far (m) | Sky zenith · horizon · ground | Cloud tint | Stars · moon | Exposure | Ambient set |
|---|---|---|---|---|---|---|---|---|
| dawn | `#FFB48C` · 1.6 | `#6E7FB8` · `#2E5A3A` · 0.55 | `#7A76B0` · 24 / 95 | `#2B3A70` · `#F2A57A` · `#3C4C7A` | `#F5C9B0` | stars 0.25 fading · none | 0.95 | pollen, mist wisps, birds wake |
| morning | `#FFE9C4` · 2.6 | `#8CB8E8` · `#3A7D44` · 0.6 | `#A9C8DC` · 40 / 130 | `#3F7BC8` · `#C6E2F0` · `#4F8FBF` | `#FFFFFF` | none · none | 1.0 | pollen, leaves, butterflies |
| noon | `#FFF6E6` · 3.0 | `#6FA8E6` · `#3A7D44` · 0.6 | `#9DC3DD` · 45 / 150 | `#2F6BC0` · `#A7D3EE` · `#4A8FC0` | `#FFFFFF` | none · none | 1.0 | pollen, leaves, butterflies |
| **golden hour** | **`#FFD08A` · 2.4** | `#7A8FC8` · `#4A7A3A` · 0.55 | `#D9A66E` · 30 / 110 | `#3B5BA8` · `#FFB870` · `#6B5A8A` | `#FFD9A8` (lit underside) | none · none | 1.05 | pollen (backlit, bloom), leaves, fireflies from `p = 0.58` |
| dusk | `#FF8C5A` · 1.2 | `#4A4E8E` · `#2A4A30` · 0.5 | `#7B5A8C` · 25 / 90 | `#22305E` · `#E86A4A` · `#3A2C5A` | `#C97A6A` | stars 0.4 · rising, `#F2E8C8` | 0.95 | fireflies ramping, leaves, ember motes start |
| night | `#8FA8E0` · 0.55 | `#1B2A5A` · `#123524` · 0.6 | `#1E2B58` · 20 / 80 | `#0B1030` · `#24356E` · `#141C40` | `#2A3A6E` | stars 1.0 · full, halo | 0.85 | fireflies full, ember motes, mist wisps |
| deep night | `#7C94D8` · 0.45 | `#14204A` · `#0F2A1E` · 0.6 | `#161F48` · 18 / 70 | `#060A22` · `#1A2856` · `#101838` | `#1E2C5A` | stars 1.0 + meteors · full | 0.80 | fireflies, embers, mist wisps, owl |

Anti-palette check on this table: no fog colour is neutral (every one leans lavender, honey, or indigo); the darkest shadow colour is the night hemisphere ground `#0F2A1E` (a green-black, never `#000`); the noon key is cream, not the default bluish-white; and the night exposure never drops below 0.80, so night stays a place rather than a dimmer.

Point lights and emissives at the Forest camp per keyframe (the "night is a feature" half of the table; camp.md owns the props, this file owns when they light):

| Light source | On from → off at (`p`) | Colour · intensity · range | Notes |
|---|---|---|---|
| Campfire `forest.campfire` | always (embers only by day) | `#FF9A3C` · 2.5 · 9 m, ±12 % at 7–9 Hz | The one light that is always warm. Smoke column 4 m by day. |
| Camp lanterns `forest.lantern` ×3 | 0.58 → 0.08 | `#FFB347` · 1.2 · 6 m | Lit by an invisible hand at golden hour; a kid will notice. |
| Cabin windows (emissive) | 0.60 → 0.06 | `#FFD08A` emissive 1.6 on the bloom layer | No light; emissive only. The window glow is the reference's cosiest detail. |
| Fireflies (`pt.firefly`) | 0.58 → 0.10, peak 0.78–0.92 | `#FFE066` emissive, bloom | No light. |
| Glow mushrooms (emissive) | 0.62 → 0.06 | `#6CE87A` emissive 0.8 | The Forest gets a few by the stream; the Bog gets hundreds. |
| Stream | always | — | The water shader adds a `#8FD3F4` sparkle band when the moon is up. |

**Pilot stations.** Brief §8 asks for four camera positions × three times of day. The three times are **golden hour (`p = 0.54`), noon (`p = 0.35`) and night (`p = 0.78`)**: the hero look, the hardest look, and the feature. Weather is `clear` at all twelve; the weather toggle is scored separately (§2.2.6).

#### 2.1.4 The other four islands

Same columns, compressed. Key and hemi intensities follow the Forest table unless a cell says otherwise. Fog near/far scale with the island: desert air is clear, bog air is thick.

**Desert** (`#B3541E` sienna, `#D9A441` ochre, `#4A2C6B` dusk violet, `#1FA3A0` oasis, `#EDE3CF` bone). Noon is this island's hero look, not golden hour: hard cream light, then long violet shadows at dusk.

| Keyframe | Key | Hemi sky · ground | Fog · near / far | Sky zenith · horizon | Exposure | Ambient set |
|---|---|---|---|---|---|---|
| dawn | `#FFC9A0` 1.8 | `#8A7BB8` · `#7A4A2A` | `#C9A98A` · 40 / 160 | `#3A3A78` · `#F7B98A` | 0.95 | sand streams (light), beetles |
| morning | `#FFF0D0` 2.8 | `#9CC4EA` · `#8A5A30` | `#E2CBA8` · 60 / 220 | `#3F78C8` · `#E8D8C0` | 1.0 | sand streams, vultures |
| noon | `#FFFBEE` **3.4** | `#78B0E8` · `#A06A38` | `#E8D8BC` · 70 / 260 | `#2C6AC0` · `#D8E4EC` | 1.05 | sand streams, **heat shimmer**, vultures |
| golden hour | `#FFB86A` 2.4 | `#7A6AB0` · `#8A4A28` | `#D8955A` · 45 / 180 | `#4A3C8A` · `#FF9E5A` | 1.05 | sand streams, dust devils |
| dusk | `#FF7A5A` 1.2 | `#4A2C6B` · `#5A3020` | `#6A4A80` · 35 / 140 | `#2A1C50` · `#E0604A` | 0.95 | sand hushes, first stars (the brightest sky in the game) |
| night | `#9AB0E8` 0.6 | `#1E2A5A` · `#3A2418` | `#242A58` · 30 / 120 | `#080C2A` · `#2A3068` | 0.85 | stars 1.0 (dense), fennec foxes |
| deep night | `#8AA0E0` 0.5 | `#141E48` · `#2A1A12` | `#1A2048` · 28 / 110 | `#04061C` · `#1C2454` | 0.8 | stars, meteors, cold sand glitter |

**Bog** (`#0B2B2E` teal-black water, `#6CE87A` phosphor, `#5A3E78` bruise fog, `#FFB347` witch-lantern, `#4A3524` rot-brown). Night is the hero look: the ground itself glows.

| Keyframe | Key | Hemi sky · ground | Fog · near / far | Sky zenith · horizon | Exposure | Ambient set |
|---|---|---|---|---|---|---|
| dawn | `#E8B8A0` 1.3 | `#6A6A98` · `#2A3A28` | `#7A6A98` · 14 / 60 | `#2A2E58` · `#D8A088` | 0.9 | spores, ground fog 0.5, bubbles, frogs |
| morning | `#F2E4C0` 2.0 | `#7A9CC0` · `#3A5A34` | `#8FA898` · 22 / 85 | `#3A6AA8` · `#B8C8B8` | 0.95 | spores, dragonflies, bubbles |
| noon | `#F8F0DA` 2.3 | `#6E9AC8` · `#3E6438` | `#93AB9C` · 26 / 95 | `#2E62A8` · `#A8C0B8` | 1.0 | spores, dragonflies, herons |
| golden hour | `#F0B870` 1.9 | `#6A5A98` · `#4A5A2A` | `#B08A6A` · 18 / 75 | `#3A4A98` · `#E89A6A` | 1.0 | spores backlit, bubbles, first wisps |
| dusk | `#D8705A` 1.0 | `#4A3A70` · `#243A24` | `#5A3E78` · 12 / 55 | `#1A1C48` · `#C05A4A` | 0.9 | wisps rising, mushrooms lighting, ground fog 0.7 |
| **night** | `#7A90D0` 0.45 | `#16204A` · `#0E2A22` | `#2A2448` · 10 / 50 | `#06081E` · `#1E2050` | 0.85 | wisps full, mushrooms full, witch lanterns, bubbles |
| deep night | `#6C82C8` 0.4 | `#101838` · `#0B2B2E` | `#221C40` · 9 / 45 | `#030512` · `#181A44` | 0.8 | wisps, mushrooms, will-o'-wisp paths (dungeons.md) |

The Bog's morning and noon fog (`#8FA898`, `#93AB9C`) is sage, not gray: hue 140°, saturation 12 %. That is the floor for how neutral any fog in the game may get.

**Frozen Peaks** (`#1B2A5A` indigo, `#8FD3F4` ice, `#F2F7FF` snow, `#5FFFAF` / `#E56BFF` aurora). Night is the hero look because of the aurora; morning is second (blue shadows on snow).

| Keyframe | Key | Hemi sky · ground | Fog · near / far | Sky zenith · horizon | Exposure | Ambient set |
|---|---|---|---|---|---|---|
| dawn | `#FFC2B0` 1.7 | `#7A8AC8` · `#8FA8C8` | `#B8C4E0` · 30 / 120 | `#2A3878` · `#F2B0A0` | 0.95 | snowfall (light), ice glitter, breath puffs |
| morning | `#FFF4E4` 2.7 | `#9CC8F0` · `#A8C0DC` | `#CFE0F2` · 45 / 170 | `#3A80D0` · `#D8ECF8` | 1.0 | snowfall, ice glitter, ptarmigan |
| noon | `#FFFFFF` 3.0 | `#84BCEE` · `#B0C8E0` | `#D4E4F4` · 50 / 190 | `#2E70C8` · `#C8E2F4` | 1.0 | snowfall (light), glitter, goats |
| golden hour | `#FFC898` 2.2 | `#7A7AC0` · `#B098A8` | `#D0B0B8` · 35 / 140 | `#3C4AA0` · `#FFB090` | 1.05 | snowfall, pink glitter, elk |
| dusk | `#E87A80` 1.0 | `#3E3C88` · `#5A6898` | `#5A5A98` · 25 / 110 | `#181C50` · `#C86078` | 0.9 | snowfall, stars 0.5, aurora fading in from `p = 0.68` |
| **night** | `#9AB4F0` 0.65 | `#1B2A5A` · `#3A4A78` | `#22305E` · 22 / 95 | `#080C2C` · `#1E2A60` | 0.9 | **aurora**, snowfall, glitter, snowy owl |
| deep night | `#8AA6E8` 0.55 | `#141F4A` · `#2E3C66` | `#1A2650` · 20 / 90 | `#04071E` · `#182452` | 0.85 | aurora peak, snowfall, meteors |

Snow is brighter than every other ground, so the Frozen hemisphere *ground* colour is light: bounce off snow is real fill, and it is what keeps the Frozen night from being a dimmer.

**Shadow Realm** (`#120A1F` void, `#FF6A2A` ember, `#3AF0FF` rift, `#5C5C66` ash). **The sky clock is locked.** The shard has no sun: one keyframe, `shadow.wrongDusk`, with a 40 s breathing oscillation on fog density (±15 %) and rift light (±25 %). The world clock keeps counting underneath for gameplay (`isNight()` still answers) but the sky ignores it: this is v27's "no time of day" rule (ATMOSPHERE §2.3) kept and made deliberate.

| Field | `shadow.wrongDusk` |
|---|---|
| Key | `#5A3A8A` · 0.7 from elevation 12° / azimuth 300°: a dusk sun that never sets, from the wrong side |
| Hemi | sky `#2A1A48` · ground `#120A1F` · 0.5 |
| Fog | `#1E1030` · 16 / 60, height falloff 6 m (fog pools low; the canopy stays clear) |
| Sky | zenith `#06030E` · horizon `#3A1A50` · ground `#120A1F`; a rift-cyan `#3AF0FF` glow lobe at the horizon where the sun should be, and a smaller one opposite |
| Stars | wrong: the Forest constellations (§2.6) mirrored left-right, tinted `#3AF0FF` |
| Moon | a black disc with a thin ember `#FF6A2A` rim, elevation 40°, never moves |
| Exposure | 0.9 |
| Ambient | embers rising, ash falling, rift flicker, inverted tree sway, void clouds *below* the shard, cyan sheet lightning |
| Camp mirror | cabin windows glow `#3AF0FF` instead of `#FFD08A`; the campfire burns cold `#3AF0FF`; the lanterns are out |

The Shadow Realm gets the best lighting in the game (Brief §5.3.5) by *contrast*: everything warm at home is cold here, and the one warm thing left is the ember rain.

### 2.2 Weather

#### 2.2.1 Weather × island matrix

Pools are weighted by repetition exactly as v27 (a type listed twice is twice as likely). `—` means the type never occurs on that island.

| Type | key | Forest | Desert | Bog | Frozen | Shadow | Announce (verbatim unless marked) |
|---|---|---|---|---|---|---|---|
| Clear Skies | `clear` | ×2 | ×3 | ×1 | ×2 | ×3 | `The weather clears.` (only after a non-clear type) |
| Rain | `rain` | ×1 | — | ×2 | — | — | `Rain!` |
| Thunderstorm | `storm` | ×1 | ×1 | ×1 | — | — | `Thunderstorm!` |
| Snowfall | `snow` | — | — | — | ×2 | — | `Snowfall!` |
| Blizzard | `blizzard` | — | — | — | ×1 | — | `Blizzard!` **[new text]** |
| Sandstorm | `sand` | — | ×2 | — | — | — | `Sandstorm!` |
| Dense Fog | `fog` | ×1 | — | ×2 | — | — | `Dense Fog!` |
| Ashfall | `ashfall` | — | — | — | — | ×1 | `Ashfall.` **[new text]** |
| Rift Storm | `riftstorm` | — | — | — | — | ×1 | `The rift crackles.` **[new text]** |

v27 pools are preserved for Forest, Desert and Bog (v27 `swamp`). Frozen's `snow ×3` becomes `snow ×2 + blizzard ×1`, so the snow-family odds are unchanged. The v27 `cave` pool (`clear ×3, snow`) retires with the biome (§5.3). The Shadow Realm's two types are new because v27 never had weather there.

The announce colour stays `#94C4DC` for a new type and `#dfe6e9` for clearing (SYSTEMS_INVENTORY Part 2 §4.2). ui-ux.md may restyle the channel; the strings do not change.

#### 2.2.2 State machine

```
state: { island, type, timer, fade (0..1), next: null | type }
idle(clear) ──timer──▶ roll(pool[island]) ──▶ fadeIn 6 s ──▶ active(type) ──timer──▶ fadeOut 6 s ──▶ idle
```

| Rule | Value | v27 |
|---|---|---|
| Clock ticks | overworld and dungeon *courtyards*; paused inside dungeon rooms (dungeons.md decides which rooms are open-air; the Observatory's blizzard rooms read `world.weather` but run their own local blizzard) | overworld only |
| Initial timer | 90 s | 90 s |
| `clear` duration | 60–120 s | same |
| Non-clear duration | **30–75 s** | 20–60 s |
| Cross-fade | 6 s on sky, fog, key and hemi; particles ramp over 4 s; ambient sound bed over 3 s | `transT = 2`, never read |
| Roll source | the island the **active hero** stands on; one global weather state (v27 rule) | same |
| Same type twice | allowed for `clear`; a non-clear type cannot repeat back-to-back | any |
| Storm side effects | `gameStats.stormsSurvived++`, `stormChaser` at 5; first strike timer 4–8 s | same |
| Bounty | `updateBountyProgress('weather', 1)` on every non-clear transition (verified v27 behaviour, §1.9) | same |
| Biplane travel | the arriving island rolls fresh weather at touchdown; the in-flight sequence shows the departing and arriving types (npcs.md) | n/a |
| Events | `earthquake` never fires during `storm` (too much shaking); `bloodmoon` weight ×3 at night; see §2.5.2 | — |
| Dev console | `weather.set <key>` with an optional `--now` to skip the fade; announces `DEV: Weather → <name>` as v27 did | `DEV: Weather → <name> (N particles)` |

Why the longer non-clear duration: with a 6 s fade in and out, a 20 s v27 storm would be 60 % fade, and a storm with its first strike at 4–8 s and a 10–18 s interval would often end before the second strike. At 30–75 s a storm delivers two to five strikes.

#### 2.2.3 Per-type specification

"Key ×" multiplies the keyframe's directional intensity; "hemi →" lerps the hemisphere colours toward the given colour by the given amount; "fog →" lerps the fog colour and multiplies near/far. Post-stack changes are parameter changes on the composer, never full-screen overlays (v27's washes translate into the fog and the grade). All particle systems are GPU `Points` in a camera-locked spawn box (v27's constant-cost trick kept), preallocated, respawned by modulo on lifetime; counts are the High preset; Low is ×0.35, Medium ×0.6 (the v27 `particleMul` ladder 0.3 / 0.6 / 1.0, rounded).

| Type | Sky / fog / key | Particles (High) | Post stack | Sound hook | Visibility (`vis.radius`) | Gameplay |
|---|---|---|---|---|---|---|
| `clear` | keyframe as authored | island ambient set only | baseline | `amb.<island>.<phase>` bed | ×1.0 | none |
| `rain` | key ×0.55, colour → `#CFD8E8` 40 %; hemi sky → `#4A5A80` 50 %; fog → island fog darkened 20 % and cooled, near ×0.85 far ×0.7; clouds → `#6A7290` | **900** streaks: quad 0.03 × 0.35 m stretched along velocity, vel (wind, −22, 0) m/s where wind = −1.5 m/s x-drift, life 1.2 s, colour `rgba(150,200,255,0.7)`; box 24 × 16 × 24 m around the camera. Plus **60** splash rings on the ground plane (decal quads, 0.25 s, r 0.1→0.3 m) spawned where streaks meet the ground within 8 m of the hero | saturation −8 %; bloom unchanged; DoF unchanged | `amb.rain` loop; `amb.rainLeaves` layered on Forest; `amb.rainWater` near water | ×1.0 | enemy speed ×0.9 (v27); crate drift ±0.8 m/s (v27 `rnd(-20,20)` px/s) |
| `storm` | rain × 1.6 (key ×0.35, hemi sky → `#3A4466` 65 %, fog far ×0.55, clouds → `#3E4460` fast drift ×3) | rain **1,400** at vel (−4, −26, 0); wind gust uniform on the sway shader ×2.2 with 3–5 s gusts; leaves ×2 | saturation −12 %; vignette 0.30 (from 0.25) | `amb.storm` bed (rain + wind); `thunder` per strike; `thunder.far` for sheet lightning | ×1.0 | rain effects **plus lightning** (§2.2.4); crate drift widened |
| `snow` | key ×0.8, colour → `#DCE8F8` 30 %; hemi sky → `#9AB4D8` 30 %; fog → `#C8D8EC` 30 %, far ×0.8 | **700** flakes: flat hex quads 0.04–0.09 m, vel (±0.6 drift, −0.8 to −1.6, ±0.6) m/s, spin ±2 rad/s, life 6 s, `rgba(255,255,255,0.7)` | bloom threshold −0.05 (flakes catch the light); saturation −5 % | `amb.snowHush` (low wind, −6 dB on the island bed) | ×1.0 | hero damage ×1.1 (v27) |
| `blizzard` **[new]** | snow × plus key ×0.5, hemi → `#8AA0C0` 60 %; fog → `#B8C8DC` 70 %, **near ×0.5, far ×0.35** | flakes **2,000** at vel (**8**, −3, 0) m/s streaming across; **12** wind-streak billboards (1.5 × 0.1 m, alpha 0.15, 0.4 s) | saturation −15 %; vignette 0.32; a 1 px chromatic shift at the frame edge (Medium+) | `amb.blizzard` (wind dominates; the island bed ducks −12 dB) | **×0.5** | hero damage ×1.1 (snow rule); enemy aggro range ×0.6 (§2.2.5); hero speed unchanged (v27 rule: weather never slows heroes); crate drift widened |
| `sand` | key ×0.7 warmed → `#E0B070` 50 %; hemi → `#C29A64` 60 %; **fog → `#C29A64`** (v27 `rgba(194,154,100)`) 85 %, **near ×0.4, far ×0.4**; clouds hidden | **1,200** grains: 0.02–0.05 m, vel (**5–9**, ±0.4, ±0.4) m/s, life 2 s, `rgba(210,180,100,0.4)`, zero drag (v27's "crosses the whole screen"); plus **8** large dust billboards 3 × 2 m, alpha 0.12, drifting at 4 m/s, life 5 s (v27's heavy dust) | warm grade (+0.06 toward `#D9A441`); film grain 0.04; bloom radius ×1.3 | `amb.sandstorm` (hiss + low howl) | **×0.625** (v27) | crate drift ±0.8 m/s (v27); ranged enemies (`archer`, `healer`) lose 30 % range (new; enemies.md confirms) |
| `fog` | key ×0.6, diffuse; hemi → island fog colour 40 %; **fog → island `fog.dense` token** (Forest `#A7C4B8` sage-mist, Bog `#7A6A98` bruise) 80 %, **near ×0.3, far ×0.35**; clouds hidden | **40** mist wisps: 4 × 1.5 m soft billboards at 0.3–1 m altitude, alpha 0.10, drifting 0.3 m/s, life 12 s | bloom radius ×1.6 and threshold −0.1 (lantern halos: the reason fog is pretty); saturation −6 % | `amb.fogDrip` (Bog), `amb.fogHush` (Forest) | **×0.5625** (v27) | crate drift unchanged (v27); enemies also lose aggro range ×0.75 |
| `ashfall` **[new]** | key ×0.8; fog density +20 %; the rift lobes dim 30 % | ash **400** falling flakes `#5C5C66` at −0.9 m/s, life 8 s, plus embers ×1.5 | grain 0.05 | `amb.ashfall` (faint crackle) | ×0.85 | none |
| `riftstorm` **[new]** | the rift lobes pulse ×2 at 0.4 Hz; hemi sky → `#1A4A5A` 40 %; no rain | none new; embers ×2 rising faster | bloom +0.2 | `amb.rift` bed; `thunder.rift` (pitched −12 st) | ×0.9 | the storm lightning recipe in rift cyan (§2.2.4), damage to shadow enemies only; bosses.md may key its cadence to Shadow Queen phases |

Rain and storm keep v27's "streak drawn from its own velocity" rule: the quad is oriented along the particle's velocity in the vertex shader, so lean and wind agree for free.

#### 2.2.4 Lightning

The brief requires "lightning flashes that light the scene" (§4.4 item 4). v27's flash was a white plate; here the scene is lit and the plate is almost gone.

| Beat | Value | Source |
|---|---|---|
| First strike after the storm begins | 4–8 s | v27 |
| Interval | 10–18 s | v27 |
| Placement | hero ±16 m on each axis (v27 ±400 px); if within 8 m of the previous strike, pushed a further 8 m away along the same sign (v27 200 px rule) | v27 |
| Telegraph | **1.0 s** ground decal: two rings r **2.4 m** and **1.2 m**, `#E8A838`, line width 0.08 m, alpha `0.3 + sin(t·15)·0.3` (0.0–0.6, ~2.4 Hz); the decal projects onto terrain (no floating discs on slopes) | v27 |
| Bolt | a 5–7 segment jagged polyline from 60 m altitude to the strike point, 0.15 m core `#FFFFFF` emissive 6 on the bloom layer with a `#6B8EC8` outer ribbon, 2 forks of 30 % length; visible **0.12 s**, dying as `(1 − t/0.12)²` | new geometry, v27 timing |
| Scene flash | directional light intensity multiplied by `1 + 4.5·env(t)` and colour lerped to `#E8F0FF` by `env(t)`, where `env` is the **v27 double envelope**: `t < 0.06 s → clamp((0.12 − t)·6, 0, 0.45) / 0.45`, then `sin((0.12 − t)·180)·0.12 / 0.45` ripple; hemisphere sky → `#FFFFFF` at `0.6·env(t)` | v27 envelope, applied to lights |
| Strike light | one pooled `PointLight` at the strike point, `#DDE8FF`, intensity 40, range 12 m, same envelope, 0.12 s | new |
| Screen | fullscreen white at **0.12 × env(t)** maximum (a quarter of v27's 0.45): the lights now do the work | v27 → reduced |
| Bloom | intensity +0.6 × env(t) | new |
| Shake | `shake(6 × clamp(1 − d/30, 0.2, 1), 0.2)` where `d` is metres from the strike to the hero (Thud tier of ATMOSPHERE §10.3, scaled by distance) | v27 had none |
| Sound | `thunder` = v27 `boom` 0.3 plus a 1.2 s low rumble tail (audio.md); played at the flash (distances here are too short for a delay to read) | v27 `boom` only |
| Sparks | 12 particles, speed 2.4–7.2 m/s (v27 60–180 px/s), life 0.3 s, size 0.08–0.2 m, colours `#fff` `#6B8EC8` `#a29bfe`, drag 0.9 | v27 |
| Damage | **30 to every enemy within 2.4 m** (v27 60 px); heroes are never hit | v27; kept because it is the game's one act of weather on the player's side: character-building weather |
| Scorch | a 1.6 m dark decal `#2A2418` at 0.35 alpha fading over 20 s | new |

**Sheet lightning** (new, storm only): every 6–14 s, with no strike, the sky dome's cloud layer flashes at a random azimuth (a 60° lobe, `#DDE8FF` at 0.5 for 0.08 s), the key light spikes to ×1.6 for 0.08 s, and `thunder.far` plays **0.8–2.0 s later**. This is where the distance-thunder beat ATMOSPHERE §18 asked for lives; it costs nothing and it makes the storm feel large.

#### 2.2.5 Visibility as a mechanic (replaces fog of war)

v27's fog-of-war disc is **cut** as a visual (§2.4.4 has the rationale). Its *number* survives as `world.vis.radius`:

```
vis.radius = 12 m × (isNight ? 0.75 : 1) × weatherMul, floored at 6 m
weatherMul: sand 0.625 · fog 0.5625 · blizzard 0.5 · ashfall 0.85 · riftstorm 0.9 · else 1
```

Consumers: the compass strip and minimap reveal (ui-ux.md), enemy aggro range cap (`min(enemy.aggro, vis.radius × 1.25)`, enemies.md), the far-object dimming term in the shared material chunk (objects beyond `vis.radius × 1.5` lerp 25 % toward the fog colour), and the "20 px wider than the visual" entity cull becomes a streaming cull at `vis.radius × 2.5`. Sandstorm and blizzard therefore *are* the visibility mechanic dungeons.md reuses: a dungeon room sets `room.visOverride` in metres and the same shader term and the same aggro cap apply. The blizzard rope-line rooms and the pyramid's sandstorm chambers need nothing new from this file.

#### 2.2.6 The pilot's weather toggle

The Phase 1 pilot ships the Forest pool: `clear`, `rain`, `storm`, `fog`, cycled by a dev-console command and a hotkey, with the 6 s fades live. The art director scores one extra capture per type at the golden-hour station 1 (four captures) on criteria 2, 3, 4 and 10 only. The lightning recipe (§2.2.4) must be in the pilot; it is the single most convincing "lighting drama" event the loop can show.

### 2.3 Aurora

#### 2.3.1 Trigger

| Rule | Value |
|---|---|
| Island | `frozen` only (v27). One story exception: `flag.auroraFinale` (a story-beats placeholder) may raise it over the Forest for the ending; nothing else ever does. Rarity is why it is remembered. |
| Clock | fades in over `p` 0.68 → 0.72, full through night, fades out 0.98 → 0.04 (through dawn's first 20 s) |
| Weather | full in `clear`; ×0.6 in `snow`; **hidden** in `blizzard` (intensity 0) |
| Dungeon | the Hermit's Observatory reads `world.aurora.intensity` directly; open-sky rooms draw the curtains, closed rooms only receive the signal |
| Signal | `world.aurora.intensity` 0–1 published every fixed step; `world.aurora.up = intensity ≥ 0.5`; events `aurora:rise` / `aurora:fall` on the crossing |
| Dev console | `aurora.force <0..1>` (overrides until cleared) |

#### 2.3.2 Geometry: shader curtains, not ribbons

v27's three flat strips win on three counts (screen-space, three hue families, incommensurate phases); 3D keeps all three and adds the dimension v27 could not afford: the curtains *hang*.

| Element | Value |
|---|---|
| Curtains | **4** planes, each 220 m wide × 60 m tall, 48 × 8 segments, hung on the sky dome at 160–200 m altitude across the northern sky (azimuth 330°–30°), staggered 15 m in depth |
| Vertex shader | x-displacement `8·sin(v·2.1 + t·0.30) + 4·sin(v·5.3 − t·0.19)` m along the curtain (the ribbon fold); the bottom edge also droops `2·sin(u·9 + t·0.4)` |
| Fragment | vertical gradient: alpha 1.0 at the bottom edge fading to 0 at 70 % height; horizontal soft ends over the outer 15 %; a scrolling 1-octave noise (`uv.x·3 + t·0.05`) modulates alpha ±30 % so the curtain has "rays" |
| Hues (per curtain) | `#5FFFAF` aurora green · `#6C5CE7` indigo (v27's middle band) · `#E56BFF` aurora magenta · `#5FFFAF`; the bottom 20 % of every curtain shifts toward `#E56BFF` (real aurora fringes) |
| Alpha | per curtain `0.12 + 0.05·sin(t·0.5 + i)` (v27's 0.07–0.17 band) × `world.aurora.intensity` × three incommensurate terms `0.85 + 0.15·sin(t·0.15)·sin(t·0.23 + 1)·sin(t·0.31 + 2)` |
| Material | additive, `depthWrite: false`, `depthTest: true`, on the bloom layer, rendered after the sky dome and before fog (fog ignores it) |
| Cost | 4 draw calls, 1,536 triangles, no lights |

#### 2.3.3 How it lights the snow

No extra light. The shared island material chunk (the same `onBeforeCompile` that carries the curved-world bend) gets one uniform `uAurora` (0–1) and adds, for faces with `dot(normal, up) > 0.6`:

```
tint = mix(#5FFFAF, #E56BFF, noise(worldPos.x·0.02 + t·0.05))
color += tint · 0.18 · uAurora · (0.7 + 0.3·sin(t·0.4 + worldPos.z·0.05))
```

The snow gets a slow green–magenta wash that moves with the curtains. The hemisphere sky colour also lerps 35 % toward `#3FCF9F` at full intensity. Ice glitter (§2.4.2) doubles its count under the aurora, and the frozen dungeon entrance keeps v27's ice-arch shimmer (ATMOSPHERE §3.2) as an emissive arc that is always faintly on: a permanent hint that the arch answers to the sky.

#### 2.3.4 As a puzzle power source

Brief §5.3.4: aurora-powered mechanisms that only work at night. The contract this file offers dungeons.md:

- `world.aurora.intensity` is the power level. A mechanism with `threshold` (default 0.5) is powered when `intensity ≥ threshold`. Mechanisms read the number; they do not read the clock, so the story can power one by force if it must.
- Powered mechanisms glow `#5FFFAF` → `#E56BFF` on the same noise scroll as the snow, so a kid learns "same colour as the sky, same time as the sky" without a tutorial line.
- Reaching night is the player's job: wait, or rest at the camp campfire (§2.1.1), or the Observatory's own time prop if dungeons.md adds one. The rest option is enough on its own.
- Crystal-resonance puzzles (dungeons.md) may read `world.aurora.intensity` for their brightness so the whole dungeon breathes with the sky.

### 2.4 Ambient layers

#### 2.4.1 The always-on list, per island (Brief §4.4 count check)

Each row counts the §4.4 layers visibly active at a *clear golden-hour* frame from the gameplay camera; the minimum is five, and every island clears it before weather or events add anything.

| Island | 1 Sky + clouds | 2 Tinted fog | 3 Ambient particles | 4 Weather (when active) | 5 Shadows + light pools | 6 Post stack | 7 Life motion | 8 Curved world | Count at clear golden hour |
|---|---|---|---|---|---|---|---|---|---|
| Forest | dome + 7 clouds, 2 below the island rim | moss/honey | pollen (always), leaves (occasional), fireflies (night), embers (night), mist (dawn/night) | rain, storm, fog | sun shadows, campfire, lanterns | full | tree sway, grass flutter, stream flow, smoke, deer, biplane | on | **8** |
| Desert | dome + 3 high thin clouds | ochre/violet | sand streams (always), heat shimmer (noon), dust devils (occasional), vultures | sand, storm | hard sun shadows, oasis reflections, night lanterns at the nomad camp | full | palm sway, oasis water, tumbleweed, lizards, biplane | on | **7** |
| Bog | dome + low grey-violet clouds, ground fog plane | bruise/sage | spores (always), bubbles (always near water), wisps (night), dragonflies (day) | rain, fog, storm | soft shadows, witch lanterns, mushroom glow | full | reed sway, water flow, frogs, herons, drips | on | **8** |
| Frozen | dome + 5 clouds at peak height, 1 below the rim | ice-blue/indigo | snowfall (always light), glitter (always), breath puffs, aurora (night) | snow, blizzard | long blue shadows, cabin windows, aurora wash | full | stiff pine sway, snow-drift streamers on ridges, elk, goats | on | **8** |
| Shadow | void dome + void clouds *below* the shard | violet | embers (always), ash (always), rift flicker | ashfall, riftstorm | rift light pools, cold campfire | full | inverted sway, shadow deer, the mirrored stream running backwards | on | **7** |

#### 2.4.2 Particle recipes and motion signatures

ATMOSPHERE §19 recipe 2, kept exactly: *leaves fall, embers rise, sand streams, wisps drift, snow falls.* You can name the island from the motion alone. Every system is a preallocated GPU `Points` (or instanced quad) system with per-particle phase; counts are High preset; sizes are metres; colours are tokens.

| Token | Island · when | Count | Size | Velocity (m/s) | Life | Colour | Signature |
|---|---|---|---|---|---|---|---|
| `pt.pollen` | Forest · always | 120 | 0.03–0.05 | (±0.2, +0.1, ±0.2) drift | 8 s | `#F5E6A8` at 0.5, bloom at golden hour | hangs; catches backlight |
| `pt.leaf` | Forest · always (occasional) | 60 | 0.08 × 0.04 quads | (±1.0, −0.8 to −2.2, ±1.0), tumble ±3 rad/s | 6 s | `#B03828` `#D87828` `#E8A838` `#38A866` (v27) | **falls**, rocking |
| `pt.firefly` | any island (Shadow excepted) · night | 200 Forest · 60 elsewhere | 0.04–0.08 | (±0.6, ±0.6, ±0.6) wander | 6 s | `#FFE066` emissive, bloom | **blinks by shrinking to zero** (v27 `max(0.5, sz·(0.3 + sin(fl)·0.7))`), then size and alpha together |
| `pt.ember` | Forest · night; Shadow · always | 40 Forest · 300 Shadow | 0.03–0.06 | (±0.4, **+0.4 to +0.8**, ±0.4), drag 0.99 | 3 s | `#E8A838` `#F0C878` `#FFF0C8` (Forest) · `#FF6A2A` (Shadow) | **rises** |
| `pt.mist` | Forest · dawn, night; Bog · always | 30 | 4 × 1.5 m billboards | (0.3, 0, 0) | 12 s | island fog colour at 0.10 | drifts low |
| `pt.sand` | Desert · always | 400 | 0.02–0.05 | (**2–4**, ±0.2, ±0.2), zero drag | 4 s | `rgba(210,180,100,0.4)` | **streams** |
| `pt.dustDevil` | Desert · occasional (1–2 alive) | 1 spiral of 80 pts | 0.05 | spiral r 0.6–1.2 m rising 1 m/s | 9 s | `#D9A441` at 0.3 | spins, wanders 1.5 m/s |
| `pt.spore` | Bog · always | 150 | 0.03–0.05 | (±0.3, **+0.1 to +0.5**, ±0.3) | 6 s | `#6CE87A` at 0.4, faint bloom | **drifts up-slow** |
| `pt.wisp` | Bog · night | 24 | 0.08–0.12 | (±0.3, +0.1 to +0.5, ±0.3) | 6 s | `#7DFF7D` emissive (v27), bloom | blinks (v27 `0.5 + sin(fl)·0.5` size) |
| `pt.bubble` | Bog · always, within 6 m of water | 40 | 0.08–0.2 | (0, +0.4 to +0.8, 0) | 0.5–1.5 s | `rgba(100,200,100,0.4)` | rises, pops (a 0.1 s ring decal on the water) |
| `pt.dragonfly` | Bog · day | 16 | 0.06 × 0.12 quads | darting 2 m/s with 0.3 s pauses | ∞ (pooled) | `#8FD3F4` wings, `#0B2B2E` body | darts |
| `pt.snow` | Frozen · always (light) | 300 | 0.04–0.09 | (±0.6, −0.8 to −1.6, ±0.6), spin | 6 s | `rgba(255,255,255,0.7)` | **falls** |
| `pt.glitter` | Frozen · always when sun < 30° or moon up | 200 (×2 under aurora) | 0.02 | static on the snow surface | ∞ | `#F2F7FF`, view-dependent twinkle `pow(max(0, dot(view, half)), 40)` | twinkles as the camera moves |
| `pt.breath` | Frozen · always, every hero and animal | 1 puff / 3 s | 0.15 → 0.4 m | (0, +0.3, 0) from the face | 1.2 s | `#F2F7FF` at 0.25 | the cheapest "it is cold" there is |
| `pt.ash` | Shadow · always | 150 | 0.04–0.08 | (±0.2, −0.6 to −1.0, ±0.2) | 8 s | `#5C5C66` at 0.6 | falls slower than snow |
| `pt.dust` | cave-style dungeon rooms (dungeons.md) | 60 | 0.02–0.05 | (±0.3, ±0.2, ±0.3) | 5 s | `rgba(200,200,220,0.3)` | drifts (v27 cave) |
| `pt.sparkle` | crystal rooms (dungeons.md) | 30 | 0.02–0.04 | (±0.2, +0.1 to +0.4, ±0.2) | 0.5–1 s | `#6B8EC8` `#a29bfe` `#dfe6e9` | rises, short (v27 cave) |

Budgets: ambient particles ≤ **1,500** points per island at High, ≤ 500 at Low; every system is one draw call; weather adds ≤ 2,000 (blizzard) on top. All motion is in the vertex shader from `uTime` and per-particle seeds; the CPU touches nothing per particle per frame (Brief §7.4: zero per-frame allocations).

#### 2.4.3 Tilt-shift, vignette and the post order

The composer, in order (Brief §4.4 item 6): render → selective bloom (bloom layer only: emissives, fireflies, wisps, aurora, torches, spell light, crater core) → **tilt-shift depth of field** → colour grade (per-island LUT, weather and event offsets applied as uniforms) → vignette → SMAA → ACES tone mapping with the keyframe exposure. Full-screen flashes (lightning residue, level-up) are a quad in the same pass as the grade.

| Setting | Value |
|---|---|
| Tilt-shift focal band | centred on the active hero's screen depth; band height 35 % of the frame; blur ramps to a maximum of 2.5 px at 1080p over the top and bottom 20 %; strength halves in cutscenes, off in menus |
| Presets | Ultra and High: on; Medium: on at 1.5 px; Low: off (DoF drops first, Brief §7.4) |
| Vignette | `#0B0E1A` at 0.25 in the corners, radius 0.75 → 0.35 (v27's always-on world vignette, ATMOSPHERE §15.1); storm and blizzard raise it to 0.30–0.32 |
| Grade offsets | weather (§2.2.3), blood moon (§2.5), Shadow Realm (`#3C0050` at 0.12 lift in the shadows: the v27 violet wash as a grade, not a plate) |
| Reduced-motion | particle velocities ×0.5, sway ×0.5, cloud drift ×0.5, tilt-shift unchanged (it is still, not moving) |

#### 2.4.4 The fate of fog of war

**Cut as a visual; kept as a number.** A dark radial plate over a lit diorama would fight the reference's "toy set you could reach into" and cannot coexist with a sun that casts shadows past the disc. What v27 needed the disc for survives in three places: tinted distance and height fog (the world finishes before it disappears, with the same generous feather), the `vis.radius` signal (§2.2.5) for aggro, culling and the far-object dim, and the compass strip and minimap reveal (ui-ux.md draws the unexplored map as unlit paper rather than black). At night the fog colour and the sky ground colour are the same indigo family, which is v27's trick (plate colour = night tint colour) carried over: the darkness is one thing, not two filters.

### 2.5 World events in 3D

#### 2.5.1 Scheduling

| Rule | Value | v27 |
|---|---|---|
| First event | 60 s into a run | same |
| Interval | 90 s after the previous event ends | 90 s |
| Concurrency | one world event at a time; a **10 s exclusion** either side of a biplane flyover or supply drop (npcs.md's timer stays independent; the two schedulers call `events.reserve(slot, seconds)` on each other) | none |
| Blocked while | dungeon rooms, boss fight, cutscene, dialogue, Shadow Realm (except `riftstorm`, which is weather), photo mode | Shadow Realm, Goblin King, dungeon |
| Pick | weighted, never the same event twice in a row, eligibility filters below | uniform |
| Sound | `event_start` at 0.3 on every event start (v27) | same |
| `survive_event` | **every** event that runs to its end counts (fixes v27's caravan/treasure omission to the quest's intent: `desert_1` says "Survive 3 world events") | 3 of 5 |
| Endless mode | events continue (v27); interval tightens to 60 s; `bloodmoon` weight ×2 | continue |
| Dev console | `event.fire <key>`; `event.list` | — |
| Save | an in-progress event is not saved; the timer is | — |

Eligibility and weights:

| Event | Base weight | Filter or modifier |
|---|---|---|
| `caravan` | 3 | needs a road within 40 m of the hero |
| `bloodmoon` | 2 | ×3 at night; never within 120 s of the last blood moon |
| `treasure` | 3 | — |
| `spring` | 2 | ×2 when any unlocked hero is below 50 % HP (a kindness) |
| `earthquake` | 2 | not during `storm`; not on Frozen during `blizzard` |
| `meteorShower` **[new]** | 3 | deep night only (`p ≥ 0.85`); not on Shadow |
| `lostLantern` **[new]** | 2 | night only; Forest or Bog |
| `migration` **[new]** | 2 | dawn (0.00–0.10) or dusk (0.60–0.70); Forest or Frozen |
| `supplyDrop` slot | — | not rolled here; the biplane scheduler owns it (npcs.md) and reserves the channel |
| `edFlyover` slot | — | same |

#### 2.5.2 The events

Every announce string below is verbatim from FAMILY_CANON §10.6 unless marked **[new text]**. The leading emoji is part of the string and is ported as-is; ui-ux.md decides whether to render the glyph or swap it for a drawn icon while the stored string stays intact.

**Goblin Caravan** — kept, changed in form.

| Field | Value |
|---|---|
| Announce | `💰 GOBLIN CARAVAN! Kill them for loot!` · end `Caravan loot secured!` |
| Duration | **45 s** (v27 20 s: v27 goblins crossed a 128 m world; the island road walk is longer and the caravan must be catchable on foot) |
| Cast | 8 × `caravan_goblin` (enemies.md variant of `goblin`: hp 40, spd 2.4 m/s, xp 10, drops nothing individually), plus **one loot cart** (new prop: a two-wheel cart 1.2 m long pulled by the lead goblin, stacked with three crates and **a lantern on a pole**, `#E8A838` point light 1.0 · 5 m, on the pooled budget) |
| Path | spawns 30 m ahead of the hero on the island's main road and walks the road away from the camp toward the far edge; at the edge it "leaves" (walks off the rim onto a plank bridge into fog) and the event ends unrewarded |
| Telegraph | the cart lantern's beam: a 14 m vertical soft cone, `#E8A838` at 0.12, the lantern-beam language of Brief §6 in gold; visible from anywhere on the island above the tree line; the compass strip shows the cart icon |
| Resolution | all 8 dead → the cart tips: 3 × `rollGearDrop(0, 1)` at the cart ±1.2 m, `addXP(50)`, the announce; the cart itself remains as a wreck prop for 45 s then despawns |
| Reads at distance | a gold beam over a moving lantern, and a file of red goblins with one big brown shape |

**Blood Moon** — kept, now with a moon.

| Field | Value |
|---|---|
| Announce | `🔴 BLOOD MOON! 2x enemy speed, 3x XP!` · end `Blood Moon fades...` |
| Duration | **40 s** (v27 25 s; the sky needs 3 s in and 5 s out to read as an event rather than a flicker) |
| Sky | over 3 s: the moon disc (§2.6) turns `#B8302A` with a halo r ×2.5 at 0.35; if it is daytime the sky drops to the **night** keyframe for the event's length (a false night, the reason the event prefers real night); the key light goes `#C43A30` at ×1.6 with shadow radius 3; hemisphere sky `#4A1020` / ground `#2A0A14`; fog `#3A1024`; stars dim to 0.4; clouds `#5A1C1C` |
| Post | grade: shadows lifted toward `#4A0A14` at 0.15, saturation +10 % in reds; the v27 pulse `0.2 + sin(t·3)·0.05` becomes a bloom-intensity pulse on the moon, not a screen plate |
| Particles | `pt.ember` ×2 on every island for the duration, tinted `#FF6A6A` |
| Gameplay | XP ×3 (replaces night ×1.5), enemy speed ×1.25 on top of night, enemy damage ×1.5: **v27 numbers unchanged**; `eventSurvivor` on start (v27) |
| Sound | `event_start`, then `amb.bloodMoon` (a low drone) ducks the island bed −8 dB; enemy idle growls pitch −3 st (enemies.md) |
| Reads at distance | the whole world turns wine-red and the moon is huge |

**Treasure Goblin** — kept, with a trail and an exit.

| Field | Value |
|---|---|
| Announce | `💰 TREASURE GOBLIN! Catch it!` · escape `The Treasure Goblin escaped!` |
| Duration | **20 s** (v27 15 s; islands are larger) |
| Cast | 1 × `treasure_goblin` (enemies.md variant: hp 100, spd **8 m/s**, colour `#E8A838` / `#C89E28`, size 0.4 m, xp 20, `fleeing`) carrying an over-sized sack `#E8A838` emissive 0.6 |
| Spawn | hero ± 8 m (v27 ±200 px), on the far side from the camera so it runs *away* into frame |
| Trail | drops one coin every 0.5 s while fleeing (pickup 1–3 gold, 8 s life): a breadcrumb that also pays the chase **[new behaviour]** |
| Telegraph | the sack's glow plus a jingling loop `treasure.jingle` that pans with it; a gold dot on the compass strip |
| Resolution | killed → `trigAch('treasureHunter')`, 1 × `rollGearDrop(1, 1)` at the corpse + 2 × `rollGearDrop(1, 0)` at ±0.8 m (v27); escape → it reaches the island rim, jumps, and a tiny crate-style parachute (§12 canopy, red and cream) opens as it floats down into the clouds: the announce fires as the canopy disappears |
| Reads at distance | a gold glow sprinting, with coins behind it |

**Healing Spring** — kept, made a place.

| Field | Value |
|---|---|
| Announce | `💚 Healing Spring appeared!` · end `The spring fades...` · world label `Healing Spring` |
| Duration | **30 s** (v27 20 s) |
| Position | hero ± 12 m (v27 ±300 px) clamped inside the island; snapped to the nearest flat ground cell (no springs on slopes or water) |
| Visual | a 3.2 m stone basin rises out of the ground over 1.5 s (3 stacked low-poly rings, `#7A8A8A` with moss), water `#2EB8A6` fills it, a **green lantern beam** (`#3DCC7A` at 0.14, 14 m tall) marks it, white flowers (12 instanced) bloom around it, 20 `pt.pollen` tinted `#3DCC7A` rise from the water, one point light `#3DCC7A` · 1.4 · 6 m; the v27 breathing ring becomes a water-surface ripple ring at `r = 3.2 + 0.2·sin(t·4)` |
| Gameplay | 25 HP/s to every unlocked, living, non-downed hero within 3.2 m (v27 80 px); `updateQuestProgress('survive_event')` on end (v27) |
| Sound | `event_start`, `amb.spring` (trickle) while alive |
| Reads at distance | a green beam and a bright turquoise disc in the ground |

**Earthquake** — kept, now visible.

| Field | Value |
|---|---|
| Announce | `🌋 EARTHQUAKE! Enemies stunned!` |
| Duration | 3 s (v27) |
| Camera | `shake(12, 3.0)` (v27, the longest shake in the game) plus ±0.3° roll on the same envelope (ATMOSPHERE §10 3D note) |
| World | 6 crack decals radiate from a point 6 m from the hero (`#2A2418`, 4–9 m long, 0.15 m wide, fade over 30 s); instanced pebbles within 20 m hop 0.2 m; tree sway amplitude ×4 for 3 s; dust puffs (`pt.dust` 80, brown `#8B7355`) rise along the cracks; every animal within 30 m flees; birds scatter |
| Gameplay | every overworld enemy `stunT = 2` (v27); **[new]** 10 % chance to expose one undiscovered `cache` secret (SYSTEMS_INVENTORY Part 2 §3.5) within 20 m: its ground lid pops off and it glows |
| Sound | `quake.rumble` 3 s low, `rock_slide` at 0.5 s and 2.2 s |
| Reads at distance | the whole frame shakes and dust rises in lines |

**Meteor Shower** **[new]** — deep night only. The *Lights in the Dark* sky, in play.

| Field | Value |
|---|---|
| Announce | `A meteor shower! Look up.` **[new text]** · end `The sky settles.` **[new text]** |
| Duration | 30 s |
| Sky | one streak every 1.5–3 s across the dome: an emissive `#FFF0C8` line 0.4 s long, 20–40° of arc, with a `#8FD3F4` tail, on the bloom layer; the star layer twinkles ×2 |
| World | 3–5 **fallen stars** land on the island over the event: a visible ember falls (2 s), a 0.6 m dust ring on impact, a 0.25 m glowing shard (`#8FD3F4` emissive 1.2, point light 0.8 · 3 m from the pool) remains for 60 s; pickup radius 1.2 m |
| Gameplay | each shard: +25 XP, +15 gold, `star shard` counted in the scrapbook (ui-ux.md); after `flag.meteorSeen` the pickup announce is `It hums like the crater.` **[new text]**, otherwise `A fallen star. Still warm.` **[new text]** |
| Story hook | placeholder `flag.starShards` (count) for story-beats.md to use or ignore |
| Reads at distance | streaks over the whole sky, then blue-white points in the grass |

**The Lost Lantern** **[new]** — night, Forest or Bog. A search, not a fight.

| Field | Value |
|---|---|
| Announce | `A lantern flickers somewhere in the dark.` **[new text]** · end `Lantern brought home.` **[new text]** · timeout `The lantern went out.` **[new text]** |
| Duration | 90 s |
| Setup | one lantern prop (`forest.lantern` model) placed 25–45 m from the camp on a path or clearing, lit `#FFB347` · 1.2 · 6 m, flickering ±20 % at 3 Hz (a dying flame); a **12 m vertical beam** at 0.08 marks it from afar |
| Loop | Interact within 1.5 m picks it up; the carrying hero holds it (a hand-socket prop; heroes.md's rigs need one hand socket per hero) and its light travels with the party (vis.radius ×1.25 while carried); Bog wisps swarm toward it (harmless, pretty); enemies met on the way are ordinary; deliver to the camp's lantern post (within 3 m) |
| Reward | +50 XP; the lantern is **added to the camp** permanently (`camp.lanternCount++`, camp.md decides where the fourth, fifth, sixth lanterns hang); max 3 lanterns from this event per save |
| Reads at distance | a lone warm beam in a dark wood |

**Migration** **[new]** — dawn or dusk, Forest or Frozen. Peaceful; the diorama showing off.

| Field | Value |
|---|---|
| Announce | `The herd is crossing.` **[new text]** |
| Duration | 40 s |
| Cast | Forest: 8–12 deer (§2.7.1 instanced); Frozen: 6–9 elk; the herd follows a pre-authored route across the island (world-builder places two routes per island) at 1.2 m/s, in a loose file with 0.6 s stagger |
| Gameplay | none; animals are not targetable; enemies within 10 m of the herd's route are pushed to flee for the duration (enemies.md: a `fleeing` flag) so the crossing is never a massacre |
| Extras | photo mode prompt on the HUD (ui-ux.md); first migration seen adds a scrapbook memory (`memory.migration`, placeholder for ui-ux/story-beats) |
| Reads at distance | a moving line of antlers against the low sun |

#### 2.5.3 Event slots owned by other files

| Slot | Owner | What this file guarantees |
|---|---|---|
| `edFlyover`, `supplyDrop` | npcs.md (choreography, intervals, crash, aerobatics) | the 10 s exclusion; crate drift widened in `storm`, `sand`, `blizzard`; the crate landing's 6-particle dust (ATMOSPHERE §12.2) uses `pt.dust`; a crate on the ground gets a gold beam like every event marker |
| `merchantArrival` (`A mysterious merchant has appeared!`) | npcs.md | the announce channel and a violet beam over the merchant's stall |
| `miniBossEmerge` (`<name> APPEARS!`) | enemies.md | never within 10 s of a world event start |
| `portal` (`A mysterious portal appears...`) | bosses.md / story-beats.md | the violet point light and three-arc emissive (ATMOSPHERE §15.3) |
| Endless waves | story-beats.md decides if endless survives | if it does: it is an event-driven mode: `events.interval = 60 s`, weather and clock run, and the endless scheduler is a second consumer of `events.reserve` so waves and events interleave |

### 2.6 Sky dome, clouds, moon and stars

v27 had none of these outside the meteor cutscene (ATMOSPHERE §18). They are new, and they are cheap.

| Element | Specification |
|---|---|
| Sky dome | an inverted icosphere r 600 m, 3-stop gradient shader (zenith, horizon, ground) blended between keyframes, plus a sun/moon glow lobe `pow(max(0, dot(dir, lightDir)), 24)` in the key colour at 0.6; `depthWrite: false`, rendered first; 1 draw call |
| Sun disc | a 4 m emissive disc billboard at 500 m in the key colour, bloom; hidden below elevation 0° |
| Moon disc | 3 m disc at 500 m, `#F2E8C8` emissive 2.0 with a **flat-shaded 5-facet crater pattern** in vertex colour (it is a low-poly moon); halo r ×1.8 at 0.2; phase is cosmetic: a soft terminator scrolls one full cycle every 7 game days |
| Stars | 600 `Points` on the dome at 550 m, size 0.4–2.2 (v27 cutscene sizes), brightness 0.3–1.0, twinkle `0.55 + 0.45·sin(t·ts + tp)` with `ts` 1–5 (the v27 cutscene star recipe, ATMOSPHERE §18); alpha × the keyframe star value; the meteor cutscene reuses this layer (cutscenes.md) |
| Constellations | five hand-placed groups of 4–7 brighter stars (size 2.6, brightness 1.0), visible on every island at deep night: **The Biplane**, **The Lantern**, **The Campfire**, **The Squad** (four stars in a row), **The Meteor** (a streak-shaped line that "points" toward the crater's island). Names are **[new text]**; they appear only when a hero sits at the campfire and looks up (camp.md, §2.7.3) |
| Clouds | 5–9 low-poly cloud clusters per island (3–7 merged icospheres each, flat-shaded, vertex-coloured white with a `#B8C8E0` underside), 8–14 m across, drifting 0.4 m/s with slow bob; **two per island sit below the island rim** so the camera sees them between the trees (Brief §4.1); tinted by the keyframe cloud colour; 1 draw call via `InstancedMesh`; cast no shadows, receive the key |
| Void clouds (Shadow) | the same meshes in `#1A1030`, all below the rim, drifting *toward* the shard at 0.2 m/s |

### 2.7 The peaceful layer in the world

Brief §5.5 names it; v27 had none of it. Everything here is new. Pets and the camp's own animals belong to camp.md; wild animals and fishing are here.

#### 2.7.1 Wild animals

Rules shared by every species:

| Rule | Value |
|---|---|
| Budget | ≤ 24 animals alive per island; one `InstancedMesh` (or skinned instanced batch) per species, so ≤ 6 draw calls per island; ≤ 400 triangles per animal; ≤ 3 animation clips (idle/graze, walk, flee) baked to a vertex-animation texture or a 2-bone rig (the implementer chooses; both are within budget) |
| Placement | seeded by the island's scatter seed near authored "habitat" volumes (meadow, stream bank, ridge, reeds); respawn at a habitat out of view when one leaves the island's active area |
| Idle | graze/idle 4–12 s, then walk 2–5 m at 1.0 m/s to a point inside the habitat, repeat; 8 % of walks include a look-around (head turn) beat |
| Flee | from heroes at their `flee radius`, from any enemy at 5 m, from the earthquake at 30 m; flee speed 5 m/s for 4 s away from the threat, then resume idle at the new spot; a fleeing animal never runs off a rim (a rim repulsion at 3 m) |
| Targetability | none: no damage hitbox, not in any target list; hero auto-attack ignores them (CONTROL_MODEL: attacks target enemies only) |
| Sound | one idle call per species at 8–20 s intervals, distance-attenuated (audio.md) |
| Night | most species sleep (idle only, no walks) between `p` 0.75 and 0.02; owls and foxes wake |
| Reduced-motion | unchanged (animals are slow) |

| Island | Species (count) | Silhouette read at one-eighth screen height | Habitat | Flee radius | Notes |
|---|---|---|---|---|---|
| Forest | **deer** (6: one herd of 3, three singles) | antler fork + a white tail flag that lifts when it flees | meadow, stream bank | 8 m | the brief's "a deer wanders past the tent" (§11); one deer's habitat includes the camp meadow |
| Forest | **fox** (2) | ember-orange wedge `#D87828` with a white tail tip, low to the ground | forest edge | 6 m | awake at night; sits and watches the campfire from 12 m |
| Forest | **rabbit** (8) | two ears and a hop arc | meadow | 4 m | hops, never walks |
| Forest | **songbirds** (12) | tiny; read by the *flight*, a 3-bird burst when a hero passes under the tree | canopy | 5 m | billboards with a 2-frame wing flap; land again 6 s later |
| Forest | **butterflies** (20, day) | colour dots: `#F0C040`, `#E56BFF`, `#8FD3F4` | flowers | 1.5 m | `pt.dragonfly`-style quads; not counted against the animal budget |
| Forest | **owl** (1, night) | a round head on a branch; blinks | one authored tree | 6 m | hoots every 15–25 s; the deep-night ambient set's "owl" |
| Desert | **fennec fox** (2, night) | huge ears | dunes near the oasis | 6 m | — |
| Desert | **lizard** (10) | a quick horizontal dart then a freeze | rocks | 3 m | 0.3 m long; freezes for 2 s when approached before fleeing |
| Desert | **beetle** (8) | a `#1FA3A0` metallic dot that catches the sun | sand | 2 m | rolls a pebble; kids notice |
| Desert | **vulture** (3) | a circling V at 40 m altitude | sky over bones | — | never lands; circles the pyramid entrance; a 0.6 m shadow decal crosses the sand |
| Desert | **tortoise** (2) | a dome that barely moves | oasis | 2 m | 0.15 m/s; cannot flee, just withdraws for 6 s |
| Bog | **frog** (12) | the sit-and-jump | reeds, lily pads | 3 m | kin of the `🐸 Familiar`; jumps into water with a `pt.bubble` ring |
| Bog | **heron** (3) | tall S-neck on one leg, then a slow wingbeat lift-off | shallows | 7 m | lands again 40 m away |
| Bog | **turtle** (4) | a log that is not a log | lily pads | 2 m | slides off into the water |
| Bog | **dragonfly** (16, day) | see `pt.dragonfly` | water | — | particles, not animals |
| Bog | **giant snail** (1) | a spiral shell 0.8 m across glowing faintly `#6CE87A` | one authored mossy log | — | never moves; a landmark |
| Frozen | **elk** (5: one herd) | wide antlers and a shoulder hump | valley | 9 m | the Frozen migration herd |
| Frozen | **snow hare** (8) | white, read by the hop and the black ear tips | drifts | 4 m | — |
| Frozen | **mountain goat** (4) | a horn curl on a ledge you cannot reach | ridges | 6 m | climbs; never flees downhill |
| Frozen | **snowy owl** (1, night) | white round head, gold eyes emissive 0.4 | one authored dead pine | 6 m | — |
| Frozen | **ptarmigan** (6) | a plump white bird that explodes into flight | snow | 4 m | — |
| Shadow | **shadow deer** (3) | the deer silhouette in the `shadow` material (`#120A1F` with a `#3AF0FF` rim) | the mirrored meadow | 8 m | **dissolves** when approached (the `dissolve` death style, ATMOSPHERE §9.3, rising cyan motes) and reforms 20 s later elsewhere: home, wrong |

Why animals matter here: the reference image is a *populated* diorama. The brief's definition of success has a deer in its first sentence.

#### 2.7.2 Fishing

One button, timing only, no meters. Brief §5.5 names it; Phase 4 ships it (Brief §8), but the fishing spots and the rod hook are authored in Phase 2 so the Forest stream has its bobber ring from the vertical slice on.

| Field | Value |
|---|---|
| Prerequisite | `flag.fishingRodOwned` (a story-beats placeholder: the rod is a camp item, most naturally from Gran's things or the first supply drop; story-beats.md and camp.md decide who gives it) |
| Spots | authored **fishing spots** (a 1.5 m ring decal on the water, `#2EB8A6` at 0.25, gently pulsing at 0.5 Hz): Forest — the camp stream pool and the lake; Desert — the oasis; Bog — three open-water spots, one only reachable by lily pads; Frozen — an ice hole on the frozen lake (a drilled ring in the ice); Shadow — the mirrored stream, one spot (see the catch table) |
| Approach | within 2 m of a spot with no enemy within 15 m, the Interact prompt reads `Fish` (ui-ux.md); Interact (Space / A / `ACT`) casts |
| Cast | the hero turns to the water, a 1.2 s cast animation (heroes.md: one shared `fish_cast` and `fish_reel` clip per hero, personality allowed), the bobber (0.12 m, red and cream like the parachute) lands 3–5 m out with a splash ring |
| Wait | 2–8 s; the bobber bobs at 0.8 Hz; **two fake nibbles** (a 0.1 m dip with a small ring) at random times before the real bite; a fake nibble rewards patience, not reaction |
| Bite | the bobber plunges 0.4 m, a 0.5 m splash ring, `fish.bite` sound, gamepad rumble 0.2 s; the **window is 0.7 s** (1.0 s on Easy, 0.5 s on Hard); a rare catch shows a double plunge and a 0.5 s window |
| Hit | Interact inside the window → `fish.catch`; the fish arcs out of the water on a 0.6 s spline into the hero's hand; the hero holds it overhead for 1.2 s with a **catch card** (name, length, rarity; ui-ux.md draws it in the scrapbook style); the fish goes to the inventory |
| Miss | Interact outside the window or window expires → `It got away.` **[new text]** in the announce channel, the bobber pops, recast is immediate |
| Interrupt | an enemy within 10 m, taking damage, or moving cancels the cast (no penalty) |
| Value | fish sell at the merchant (npcs.md) at 5 / 12 / 40 gold by rarity; the first catch of each species adds a scrapbook page entry; catching every species awards a new achievement **`Gone Fishin'`** — `Catch one of every fish` **[new text]** (ui-ux.md adds it to the achievements page; existing achievement names are untouched) |
| Companions | the three idle heroes stand at the bank and watch (heroes.md: a `watch` idle); no combat AI while a cast is live and no enemy is near |

Catch table (weights in parentheses; **rare** rows have the double-plunge tell):

| Island | Common | Uncommon | Rare | Junk (5 %) |
|---|---|---|---|---|
| Forest | Brook Trout (50), Stream Minnow (30) | Speckled Perch (15) | **Golden Carp** (5): only at golden hour | an old boot: `Someone's boot. Not Ed's. Probably.` **[new text]** |
| Desert | Oasis Catfish (55) | Sand Dab (30) | **Mirage Fish** (10): only at noon; its body is the `#EDE3CF` bone colour with a heat-shimmer material | a clay pot shard |
| Bog | Mudskipper (45), Bog Eel (25) | **Glowfin** (20): night only, `#6CE87A` emissive, it lights the bank | **Witch's Newt** (5): "Nasty critters in that swamp" (Ed, FAMILY_CANON L368) | a rusted lantern (counts toward `camp.lanternCount`, once) |
| Frozen | Ice Char (50) | Frost Minnow (35) | **Aurora Salmon** (10): only while `world.aurora.up`; scales shift `#5FFFAF` → `#E56BFF` | an icicle |
| Shadow | — | — | **one catch only**: a small waterlogged **photograph** that becomes a memory collectible (`memory.shadowPhoto`, a story-beats/ui-ux placeholder); after that, `Nothing bites here.` **[new text]** | — |

Every fish is a 60–120 triangle flat-shaded model with two vertex colours; the catch card, not the mesh, carries the detail.

#### 2.7.3 Other quiet activities

| Activity | Where | What happens | Owner of the rest |
|---|---|---|---|
| **Stargazing** | the camp campfire, deep night | sitting (camp.md's campfire rest prompt has a `Sit` option) tilts the camera up 25° over 2 s; the five constellations (§2.6) draw their lines in `#8FD3F4` at 0.3 one by one, each with its name card; a meteor shower seen from here counts double in the scrapbook | camp.md (the sit), ui-ux.md (the cards) |
| **Sheltering** | any island, `storm` or `blizzard` | standing under the tent, the cabin porch, or the nomad's awning for 5 s during a storm plays `Grandpa Ed says this kind of rain is 'character-building weather.'` as a tip-style caption once per storm: the canon tip (FAMILY_CANON §10.1 tip 2), delivered in the world instead of only on the title screen | ui-ux.md (caption style); npcs.md if Ed is present and says it himself |
| **Watching the herd** | Forest and Frozen migration | photo-mode prompt | ui-ux.md |
| **Feeding the fox** | Forest camp, night | camp.md decides whether the fox becomes a pet; this file only promises it sits 12 m from the fire | camp.md |

### 2.8 Shared vocabulary for dungeons

dungeons.md builds its interiors on these tokens so a dungeon reads as the same world as the island above it. ATMOSPHERE §19 recipe 1 (the light compositor and the shared torch oscillator) is translated here; dungeons.md owns rooms, mechanics and bosses.

#### 2.8.1 Fog and darkness tokens

Every v27 `DNG_AMBIENT` plate becomes a tinted fog plus a low hemisphere: never neutral, never black. `dark` is the v27 alpha kept as a 0–1 number that scales fog density and hemisphere intensity.

| Token | v27 source | Fog colour | Hemi sky · ground | `dark` | Near / far (m) | Note |
|---|---|---|---|---|---|---|
| `dng.forest` | `rgba(8,20,10,0.70)` | `#0E2412` | `#1A3A22` · `#08140A` | 0.70 | 6 / 22 | green-black |
| `dng.cave` | `rgba(12,10,28,0.72)` | `#16123A` | `#2A2458` · `#0C0A1C` | 0.72 | 5 / 20 | violet-black; crystal rooms add `pt.sparkle` |
| `dng.desert` | `rgba(40,28,8,0.62)` | `#3A2A10` | `#5A4020` · `#281C08` | 0.62 | 8 / 28 | **warm brown, the brightest dungeon** (v27 rule kept) |
| `dng.bog` | `rgba(8,18,8,0.72)` | `#0E1E10` | `#1C3A1E` · `#08120A` | 0.72 → **0.85** in the lantern rooms | 4 / 14 | dungeons.md may push `dark` to 0.85 for the darkness dungeon; the hero pool then shrinks (§2.8.2) |
| `dng.frozen` | `rgba(8,14,35,0.73)` | `#101A3A` | `#1E2C5A` · `#0A0E24` | 0.73 | 6 / 22 | blue-black, the darkest v27 dungeon; aurora rooms add `uAurora` |
| `dng.volcanic` | `rgba(35,8,4,0.65)` | `#2A0C08` | `#4A1A10` · `#1C0806` | 0.65 | 7 / 24 | red-black; embers up |
| `dng.citadel1` | `rgba(18,8,28,0.72)` | `#1A0C2A` | `#2A1840` · `#0E0818` | 0.72 | 6 / 22 | violet |
| `dng.citadel2` | same | `#160A26` | `#281438` · `#0A0410` | 0.74 | 5 / 20 | deeper violet |
| `dng.citadel3` | same | `#1A0A10` | `#381414` · `#08040E` | 0.76 | 5 / 18 | **red**; descent written into the palette (ATMOSPHERE §15.5) |
| `dng.shadow` | `rgb(60,0,80)` wash | `#1E1030` | `#2A1A48` · `#120A1F` | 0.70 | 6 / 20 | the Shadow Realm's island values (§2.1.4), indoors |

Rules: atmosphere particles are on the bloom layer and **ignore fog** (v27 drew them on top of the darkness, ATMOSPHERE §6.2 step 5); the hero light pool is always present; the outdoor keyframe never applies indoors unless a room is flagged open-sky, in which case the island keyframe blends in at `1 − dark`.

#### 2.8.2 Light pools (the dynamic light budget)

One `DirectionalLight`, one `HemisphereLight`, and a pool of **8 `PointLight`s** per scene (Brief §4.3 "small pool, distance-culled"). Priority when more than 8 want to exist: hero pool > carried lantern > boss > spell light (newest first) > event marker > torches by distance > enemy glow. Everything below the cut renders emissive-only; the flame still flickers because the oscillator runs in the shader, not in the light.

| Token | Colour | Intensity | Range | Decay | v27 source | Notes |
|---|---|---|---|---|---|---|
| `light.heroPool` | `#FFDC96` | 1.8 | **4.8 m** (120 px); **7.2 m** in boss rooms (180 px) | 2 | ATMOSPHERE §6.2 hero light | falloff shaped to v27's 1 / 0.7 / 0.3 / 0 shoulders via a custom `distanceAttenuation` in the chunk; in `dng.bog` at `dark 0.85`: 1.5 m |
| `light.torch` | `#FFB450` | 1.2 × (0.8 + 0.15·flVal) | 2.2 m (55 px) | 2 | §8.2 torch | driven by the torch oscillator (§2.8.3) |
| `light.lantern` | `#FFB347` | 1.2 carried · 1.0 placed | 6 m carried · 4 m placed | 2 | new (v27 had none) | the Bog dungeon's only light source; also the camp lanterns and the Lost Lantern |
| `light.campfire` | `#FF9A3C` | 2.5 ± 12 % at 7–9 Hz | 9 m | 2 | new | the shared-oscillator rule applies (flame mesh and light share the value) |
| `light.spell.<hero>` | hero colour from heroes.md | 1.5 | 4 m | 2 | Brief §4.3 | 0.4 s life on cast, pooled; Collette's may persist 3 s (heroes.md) |
| `light.projectile` | projectile colour | 0.6 | 1.4 m (35 px) | 2 | §6.2 | only when the pool has room; else emissive core + bloom |
| `light.enemyGlow` | — | — | — | — | §6.2 enemy 35 px `rgba(255,100,100,0.3)` | **no light**: emissive eyes `#FF6464` 0.8 on the bloom layer |
| `light.boss` | `#FFC864` · enraged `#FF5050` | 2.0 · 2.6 | 2.4 m · 3.2 m (60 / 80 px) | 2 | §6.2 boss | the enraged room tint is a grade (`#B40000` at 0.06), not a light |
| `light.event` | event colour (§2.5.2) | 1.0–1.4 | 3–6 m | 2 | new | springs, carts, shards |
| `light.strike` | `#DDE8FF` | 40 | 12 m | 2 | §2.2.4 | 0.12 s, takes any slot |

#### 2.8.3 The torch recipe (one oscillator drives flame and light)

```
per torch:  f = 8.8 + hash(id)·1.2 Hz     ph = hash(id)·2π
per frame:  flVal  = sin(t·f + ph)
            flVal2 = sin(t·f·1.7 + ph + 2)
flame mesh: height = 0.26 + 0.06·flVal   width = 0.12 + 0.02·flVal   x-lean = 0.05·flVal2   (m)
light:      intensity = base·(0.8 + 0.15·flVal)
```

The flame is a two-cone pair (outer `#E85D04`, core `#FFD166` at 50 % width and 60 % height) on the bloom layer, instanced with a per-instance `phase` attribute; the vertex shader evaluates the same formula, and the CPU evaluates it once per *lit* torch for its light. One value, two consumers (ATMOSPHERE §8.2: "light and fire agree"). Torches per room: 4–6 (v27), placed on wall tiles adjacent to floor.

#### 2.8.4 Particle recipes for dungeons (`DNG_ATMO` translated)

| v27 dungeon | v27 recipe | Token | Count | Direction |
|---|---|---|---|---|
| forest | `#B8C858` 18, drift | `pt.pollen` tinted `#B8C858` | 18 | drift |
| cave | `#7868A8` 12, drift | `pt.dust` tinted `#7868A8` + `pt.sparkle` | 12 + 30 | drift + up |
| desert | `#E86820` 18, up | `pt.ember` tinted `#E86820` | 18 | **up** |
| swamp (bog) | `#280838` 12, up | `pt.spore` lit `#8A6AB0` (v27's near-black motes vanish against fog; the hue is kept, the value is raised so they read) | 12 | **up** |
| frozen | `#E8E8F0` 22, down | `pt.snow` | 22 | **down** |
| volcanic | `#E86820` 20, up | `pt.ember` | 20 | **up** |
| citadel f1 / f2 / f3 | `#8850A8` 20 drift / `#7B3CA0` 25 up / `#A83828` 30 drift | `pt.ash` tinted per floor | 20 / 25 / 30 | the v27 escalation kept: the air tells you how deep you are |

Recycling rule (v27 `updDngAtmo`): a particle leaving the room respawns at the opposite edge; the population is constant, never a burst.

#### 2.8.5 Visibility overrides

A room sets `room.visOverride` in metres (§2.2.5) and gets the sandstorm or blizzard treatment for free: fog near/far scale, aggro cap, far-object dim. Blizzard rope rooms: `visOverride 4`; the pyramid's sandstorm chambers: `visOverride 6` with `pt.sand` at 600. Neither needs anything this file has not already specified.

## 3. What preserves the magic

### 3.1 Recipe by recipe

| ATMOSPHERE_RECIPES entry | Kept / translated / replaced | How, and why the feeling survives at the gameplay camera |
|---|---|---|
| §1 Render pipeline: nine cheap layers in a fixed order | **translated** | The composer order in §2.4.3 is the same idea: sky → geometry → particles → weather → post plates. The count is what mattered, and every island clears five layers at a clear golden hour (§2.4.1). |
| §1 "crater drawn after fog" | translated | The bloom layer ignores fog for every emissive; the crater's teal core is the first citizen of that rule (cutscenes.md / story-beats.md own the crater itself). |
| §2 Day/night proportions 50 / 10 / 30 / 10 | **kept** | Same fractions at twice the length; night is still 30 % of play. |
| §2 The 32 % plate ("contrast of temperature, not of value") | translated | Night exposure never drops below 0.80 and the hemisphere fill stays 0.6, while every warm point is a real light or a bloom emissive. Warm-on-cool at low darkness is the same trick, now with shadows. |
| §2 Dusk→night hard cut | translated | A 4 s fast ease at `p = 0.70`: the beat survives, the pop does not. |
| §2 Night gameplay numbers | **kept** | ×1.5 XP, ×1.15 enemy speed, ×0.75 vision, fireflies, `nightWarrior`. |
| §2.4 Firefly blink by shrinking radius | **kept** | `pt.firefly` shrinks size to zero in the vertex shader; a firefly, not a dot. |
| §3 Aurora: faint, three hues, incommensurate phases, rare | **kept**, geometry replaced | Same alpha band, same three hue families, same trigger; strips become hanging curtains because 3D can afford the dimension. |
| §3.2 Ice-arch shimmer | kept | Always faintly on at the frozen entrance as the puzzle hint. |
| §4.1 Weather pools weighted by repetition | **kept** (Frozen adds blizzard at the same family odds) | The islands still feel like different climates by the same statistics. |
| §4.2 Camera-locked spawn volume, streaks from own velocity, zero-drag sand | **kept** | Constant cost and free wind agreement; the recipes are the v27 recipes in metres. |
| §4.3 Tinted washes, never gray | translated | Washes become fog colour and grade offsets; the sage floor (§2.1.4) is the neutrality limit. |
| §4.4 Lightning: 1 s amber telegraph, double-flash envelope, 30 damage to enemies only | **kept**, flash moved into the lights | The envelope now drives the directional light and a strike point light; the telegraph is a projected decal. The player still learns "the ring means move". |
| §5 Direction signatures (leaves fall, embers rise, sand streams, wisps drift, snow falls) | **kept** | §2.4.2 is the v27 table in 3D with the same one-always-on-one-occasional rule per island. |
| §6.1 Fog of war | **replaced** | Cut as a visual; the radius survives as `vis.radius` and the feather survives as fog. The "world finishes before it disappears" rule survives as the wider streaming cull. |
| §6.2 Tinted darkness, hero pool falloff, particles on top of darkness | **translated** | `dng.*` fog tokens, `light.heroPool` with the 1 / 0.7 / 0.3 / 0 shoulders, bloom-layer particles that ignore fog. |
| §7 Noise biomes, 35 % blend, 15 % deterministic tufts, dark saturated ground | kept (world-builder) | Out of this file's scope but assumed: the island ground is vertex-coloured from the same formulas, and animal habitats and event positions snap to that ground. |
| §7.4 Entrance halo of 6 orbiting motes, cleared state dims | kept (dungeons.md) | Referenced, not redesigned. |
| §8.1 `DNG_ATMO` counts, directions, Citadel escalation | **kept** | §2.8.4. |
| §8.2 Torch: two oscillators, per-torch frequency, shared `_flVal` | **kept exactly** | §2.8.3: one value, two consumers. This is §19 recipe 1 and it is not negotiable. |
| §9.1 Particles shrink as they fade | kept | The vertex shader scales size by `life/maxLife` for every burst recipe; the ambient systems use it for fireflies and wisps. |
| §9.2 Crate landing dust, lightning sparks, crater motes | kept | `pt.dust` ×6 on landing; 12 sparks per strike; crater motes rise (`pt.ember` in `#A862C4` / `#1abc9c`) — cutscenes/story own the crater. |
| §10 Shake ladder | kept | Earthquake 12 / 3.0 and the strike's Thud 6 / 0.2 (scaled by distance) sit on the v27 ladder. |
| §11 Biplane as four noise sources | deferred to npcs.md | This file only reserves the channel and blows the crates in bad weather. |
| §12 Parachute crates blown by weather | **kept** | `storm`, `sand`, `blizzard` widen drift to ±0.8 m/s. |
| §15.1 Always-on world vignette in `--bg-0` navy | **kept** | `#0B0E1A` at 0.25, raised in storms. |
| §15.1 Blood-moon plate | **replaced** | A real red moon, a red key, a lifted-red grade, and a pulse on the moon's bloom: the same 0.5 Hz breath, no plate. |
| §15.5 Shadow Realm violet wash | translated | One locked keyframe plus a shadow-lift grade; the "no time of day" rule kept on purpose. |
| §18 Not found: sky, stars, moon, campfire, lantern, ambient loops | **new** | §2.6, §2.1.3, §2.8.2, and the `amb.*` hooks; the star recipe is the meteor cutscene's, reused. |
| §19 recipe 2 (simultaneous layering) | **kept** | The whole of §2.4. |
| §19 recipe 3 (more than one independent motion source per recurring object) | **applied** | Aurora (three alpha terms plus a noise scroll), torches (two oscillators), clouds (drift plus bob), the treasure goblin (run plus coin trail), the crater's 8 s pulse; every animal has an idle beat and a look-around beat. |

### 3.2 Family-canon threads that survive

- Every world-event announce (FAMILY_CANON §10.6) and every event-end line, verbatim, including the emoji.
- `Healing Spring` as a world label; `The weather clears.` and every `<Weather name>!` in the same colours.
- Tip 2, `Grandpa Ed says this kind of rain is 'character-building weather.'`, now delivered in the world when a kid shelters from a storm (§2.7.3), and the reason lightning still never hits heroes.
- Tip 1, `If you see a yellow biplane, wave. That's Grandpa Ed.`: the 10 s exclusion exists so the biplane is never upstaged by an event.
- Tips 11 and 12 (`Something fell from the sky…`, `Gran always said the sky had more in it than stars.`): the meteor shower and the constellations are those two tips made visible; the `It hums like the crater.` shard line points back at the crater canon (`Something fell here. A long time ago.`).
- Ed's `I think the green rudder ended up near the Bog Witch's territory. Nasty critters in that swamp.`: the Witch's Newt and the frogs.
- `Crown of Storms`, `Storm Chaser` (both of them), `Night Warrior`, `Event Survivor`, `Treasure Hunter`, `Ground Control`, `Frequent Flyer`: every weather-, night- and event-related achievement and bounty keeps its trigger.
- Quest `desert_1` (`Desert Trials`, "Survive 3 world events") now counts every event, which is what the quest text says.
- The `🐸 Familiar` frog is no longer the only animal in the world; it has twelve cousins in the Bog.

### 3.3 What a kid will recognise from v27

Night comes often and it is worth it (XP badge, fireflies everywhere). Rain slows the goblins. The amber rings mean move. Storms in the desert, fog in the swamp, snow in the mountains. The aurora over Frozen Peaks, and only there. The blood moon, the goblin caravan, the treasure goblin you have to chase, the spring that heals, the quake that stuns. The crates still drift in a storm. The world still has a gold-on-navy vignette around it. What is new is that all of it now casts a shadow.

## 4. Build notes for implementers

### 4.1 Asset list

| Asset | Source | Triangles | Notes |
|---|---|---|---|
| Sky dome | procedural (inverted icosphere, 3 subdivisions) | 1,280 | shader in `src/render/sky.ts` |
| Sun / moon discs | procedural billboards | 2 × 24 | moon crater facets as vertex colour |
| Stars | `Points` × 600 | — | positions seeded once; constellation indices in `src/content/sky.ts` |
| Aurora curtains | procedural planes × 4 | 1,536 | `src/render/aurora.ts` |
| Clouds | procedural merged icospheres, 3 variants | ≤ 600 each | `InstancedMesh`, 5–9 per island; 2 below the rim |
| Weather particle systems | `Points` / instanced quads: rain, snow, sand, ash, mist, wind streaks, splash rings | — | `src/render/particles/weather.ts`; one shared shader with a `mode` uniform |
| Ambient particle systems | 16 tokens in §2.4.2 | — | `src/render/particles/ambient.ts`; one system per token per island, pooled at load |
| Lightning bolt | procedural polyline, regenerated per strike | ≤ 200 | `src/world/weather/lightning.ts` |
| Telegraph, scorch, crack, spring-ripple decals | procedural quads projected onto terrain | — | shared decal projector in `src/render/decals.ts` (bosses and elites use the same one) |
| Loot cart, lantern (post + carried), stone basin, fallen-star shard, fishing bobber, fishing rod | GLB, custom Blender or Kenney CC0 adapted with vertex colours | ≤ 300 each | `assets/models/world/`; licences in `assets/LICENSES.md` |
| Animals: deer, fox, rabbit, songbird, owl, fennec, lizard, beetle, vulture, tortoise, frog, heron, turtle, snail, elk, hare, goat, snowy owl, ptarmigan | GLB (Kenney animal packs are CC0 and cover most; the rest custom) | ≤ 400 each, 3 clips | `assets/models/animals/`; instanced per species |
| Fish × 14 | procedural or GLB | 60–120 each | `assets/models/fish/`; only the held-up pose needs to look good |
| Per-island LUTs × 5 | authored in Phase 1 (Forest) and Phase 3 | — | `src/style/lut/` |

### 4.2 Material and light counts

- Materials: the shared island material chunk (flat-shaded, vertex-coloured, fog + curved-world + `uAurora` + far-dim via `onBeforeCompile`) is one material; water shader one; sky one; aurora one; particle shader one (mode uniform); decal one; animal one (vertex-animated) per species batch. Under 15 unique materials for the whole overworld.
- Lights: 1 directional + 1 hemisphere + a pool of 8 points. Nothing in this file needs a ninth.
- Draw calls from this file at High: sky 1, sun/moon 2, stars 1, aurora 4, clouds 1, ambient particles ≤ 8, weather ≤ 4, decals ≤ 6, animals ≤ 6, event props ≤ 6, fishing 2. About 40 of the 300 budget.

### 4.3 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| Clock (`p`, phases, rest-skip, migration from v27), weather state machine, event scheduler, animal AI, fishing loop | `src/world/` (`clock.ts`, `weather/`, `events/`, `animals/`, `fishing/`); all run inside the fixed 60 Hz step with the seeded RNG so multiplayer and replays agree |
| Keyframe tables, fog/light/particle tokens, `dng.*`, presets | `src/style/` (`keyframes.ts` per island, `tokens.ts`, `dungeonTokens.ts`, `scale.ts`) — the law after Phase 1 |
| Sky, aurora, particles, decals, lightning render, post presets | `src/render/` |
| Event text (verbatim + new, tagged), fish table, constellation names, animal roster | `src/content/` (`events.ts`, `fish.ts`, `sky.ts`, `animals.ts`); canon strings in `src/content/canon/` untouched |
| Gameplay hooks: night multipliers, weather multipliers, event effects, `survive_event`, bounty `weather`, `vis.radius` consumers | `src/sim/` |
| Dev-console commands | `src/dev/` |

Update order inside the fixed step (SYSTEMS_INVENTORY Part 2 §18.2 kept): input → heroes → camera → enemies → projectiles → particles (bursts only; ambient is GPU) → **weather** → arena effects → biplane (npcs) → **world events** → endless → NPCs → animals → fishing. The clock advances first, before input, so everything in a step sees one `p`.

### 4.4 Phase mapping (Brief §8)

| Phase | Ships from this file |
|---|---|
| **1 Pilot** | Forest clock with all seven keyframes and the campfire/lantern/window schedule; sky dome, sun, moon, stars, clouds (two below the rim); Forest ambient set (pollen, leaves, fireflies, embers, mist); weather `clear / rain / storm / fog` with fades and the full lightning recipe; tilt-shift and vignette; `vis.radius`; the deer (idle, walk, flee); the four stations × three times; `clock.set`, `weather.set`, `aurora.force` (no-op on Forest) |
| **2 Vertical slice** | all five Forest-eligible events (caravan, blood moon, treasure, spring, earthquake) plus meteor shower, lost lantern and migration; the full Forest animal roster; fishing spots and the bobber ring authored (loop disabled until the rod flag); `survive_event` and bounty wiring; campfire rest |
| **3 The world** | Desert, Bog, Frozen keyframes and ambient sets; snow, blizzard, sand; aurora curtains, snow wash, `world.aurora.*` signal; Desert/Bog/Frozen animals; per-island LUTs; `dng.*` tokens consumed by dungeons |
| **4 Lights in the Dark** | Shadow Realm keyframe, ashfall, riftstorm, shadow deer; fishing loop, catch tables, catch cards, `Gone Fishin'`; stargazing and constellations; `flag.auroraFinale` if story-beats uses it |
| **5 Polish** | `amb.*` loops and every sound hook (audio.md); Low/Medium particle scaling verified on a phone |

### 4.5 Test hooks

- Dev console: `clock.set <p|dawn|morning|noon|golden|dusk|night|deep>`, `clock.speed <mul>`, `weather.set <key> [--now]`, `weather.strike` (forces a lightning strike 6 m ahead), `event.fire <key>`, `event.list`, `aurora.force <0..1|off>`, `animals.count`, `animals.flee`, `fish.bite` (forces the next bite in 1 s), `vis.radius` (prints).
- Vitest (sim, deterministic): phase boundaries at `p` 0.10 / 0.60 / 0.70 / 0.85; v27 migration `p_new = (p_v27 − 0.75) mod 1`; weather pool weights match §2.2.1 over 10,000 seeded rolls ±2 %; non-clear never repeats; strike placement never within 8 m of the previous; `vis.radius` table; event eligibility filters; `survive_event` counts all eight; `bloodmoon` XP ×3 overrides night ×1.5; fishing window by difficulty; catch-table gating by phase and aurora.
- Headless smoke: the twelve stations render non-black PNGs at each of the three clock values; a storm capture shows a mean luminance spike ≥ 40 % on the strike frame versus the frame before (the "lightning lights the scene" check); a frame-time budget test at High with blizzard active.

### 4.6 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| Blizzard's 2,000 flakes plus 1,400 storm streaks on mobile | preset multipliers 0.35 / 0.6 / 1.0; particles are GPU-only; the spawn box shrinks with the preset |
| Point-light pool thrash (8 slots, many wants) | the priority list in §2.8.2; a light that loses its slot fades out over 0.3 s, never pops |
| Shadow map cost at night with soft radius 5 | shadow radius is a uniform, not a map size change; mobile stays at 1024 |
| Height fog + curved world + far-dim + aurora in one chunk | one `onBeforeCompile`, one uniform block, compiled once per material; verify with the shader-compile count in the perf overlay |
| Animals: 24 skinned instances | vertex-animation texture (no bone uploads) or a 2-bone rig; both are one draw call per species |
| Tilt-shift on integrated GPUs | the DoF pass is the first to drop (Brief §7.4); Medium runs it at half resolution |
| Event props leaking | every event prop is pooled and has a hard despawn timer; the scheduler asserts zero live event entities before the next roll |

### 4.7 Build order

1. Clock and keyframe blending with the Forest table, sky dome, sun/moon, stars: the pilot's first capture.
2. Fog and the shared chunk (height fog, far-dim, curved world in one place).
3. Ambient particle shader with the mode uniform; pollen, leaves, fireflies, embers, mist.
4. Weather state machine with fades; rain; storm with the lightning recipe; fog.
5. Post stack presets; vignette; tilt-shift.
6. Deer.
7. Stations, dev commands, the loop.
8. (Phase 2) Events, animals, fishing spots. (Phase 3) Islands, aurora, snow/sand. (Phase 4) Shadow, fishing loop, stargazing.

## 5. Cross-references and conflicts

### 5.1 Earlier design files

None exist yet; this file is in the first wave. It assumes nothing from `heroes.md` or `story-beats.md` except what is listed as a placeholder below.

### 5.2 What later files must pick up from this one

| File | Must pick up |
|---|---|
| **camp.md** | the campfire as `light.campfire` with the shared-oscillator rule; the campfire **rest** prompt (skip to next dawn or dusk) and the **sit** prompt (stargazing camera, §2.7.3); the three camp lanterns and cabin windows lighting on the §2.1.3 schedule; `camp.lanternCount` from the Lost Lantern event (max +3) and the Bog's rusted-lantern catch (+1); the camp stream fishing spot and where the rod lives; the fox that sits 12 m from the fire (pet or not is camp.md's call); pets never count against the 24-animal wild budget |
| **npcs.md** | the `edFlyover` / `supplyDrop` slots and the 10 s exclusion via `events.reserve`; crate drift ±0.8 m/s in `storm`, `sand`, `blizzard`; the flight sequence showing departing and arriving weather; the merchant's violet beam and the `merchantArrival` slot; the Sand Nomad's awning and camel are shelter and animal props that this file does not design; Ed may deliver tip 2 in person during rain |
| **dungeons.md** | everything in §2.8 (fog tokens, light pool and priorities, torch recipe, particle recipes, `visOverride`); the clock runs in dungeons; `world.aurora.intensity` as the power signal with a 0.5 default threshold; `dng.bog` at `dark 0.85` with the 1.5 m hero pool for the darkness dungeon; the frozen entrance's permanent shimmer; open-sky rooms blend the island keyframe at `1 − dark` |
| **ui-ux.md** | the compass-strip icons for clock phase (v27 `hudDayNight` ☀️ 🌅 🌙) and weather (v27 labels); the `XP +50%` night badge; the announce channel with the verbatim emoji-led strings and the colours `#94C4DC` / `#dfe6e9`; the two *Storm Chaser* entries kept distinct; event markers as coloured lantern beams (gold cart, green spring, violet merchant, blue-white shard); the minimap's unexplored area as unlit paper, revealed by `vis.radius`; the catch card, the fish scrapbook page, `Gone Fishin'`, the `Fish` interact prompt, `It got away.`; the photo-mode prompt on migrations; the constellation name cards; the sheltering caption; the `star shard` scrapbook count |
| **audio.md** | hook names: `amb.<island>.<phase>` beds, `amb.rain`, `amb.rainLeaves`, `amb.rainWater`, `amb.storm`, `amb.snowHush`, `amb.blizzard`, `amb.sandstorm`, `amb.fogDrip`, `amb.fogHush`, `amb.ashfall`, `amb.rift`, `amb.bloodMoon`, `amb.spring`, `thunder`, `thunder.far` (0.8–2.0 s late), `thunder.rift`, `quake.rumble`, `treasure.jingle`, `fish.bite`, `fish.catch`, `event_start` (v27, kept), one idle call per animal species, an owl hoot; ducking rules per weather in §2.2.3 |
| **enemies.md** | `caravan_goblin` and `treasure_goblin` as `goblin` variants with the §2.5.2 stats; the `fleeing` flag used by the treasure goblin and the migration push; night ×1.15, rain/storm ×0.9, blood moon ×1.25 speed and ×1.5 damage; the aggro cap `min(aggro, vis.radius × 1.25)`; ranged range ×0.7 in `sand`; emissive eyes instead of enemy lights; growls pitched −3 st under the blood moon; animals are never targets |
| **bosses.md** | `riftstorm` may be keyed to Shadow Queen phases; no world event during a boss; the boss light tokens |
| **cutscenes.md** | cutscenes own the sky; the star layer and the meteor-streak shader are shared with the meteor cutscene; the crater's teal core on the bloom layer |
| **story-beats.md** | the placeholder flags in §5.3; the Crystal Caves question; endless mode's fate and the event-driven hook if it stays; whether `flag.auroraFinale` is used |
| **heroes.md** | hero height sets `scale.ts`; one hand socket per rig for the carried lantern and the held fish; `fish_cast`, `fish_reel` and a `watch` idle; spell light colours per hero for `light.spell.<hero>` |

### 5.3 Placeholder flags and open reconciliations with story-beats.md

| Placeholder | Used by | Meaning |
|---|---|---|
| `flag.fishingRodOwned` | fishing | the rod is in the family's hands |
| `flag.auroraFinale` | aurora trigger | the one non-Frozen aurora, for the ending |
| `flag.starShards` (count) | meteor shower | how many fallen stars have been picked up |
| `flag.meteorSeen` (existing v27 `storyFlags.meteorSeen`) | meteor shower line | picks the crater-hum shard line |
| `memory.migration`, `memory.shadowPhoto` | migration, Shadow fishing | scrapbook memory collectibles |
| `camp.lanternCount` | Lost Lantern, Bog junk catch | camp growth input |
| **The Crystal Caves.** | islands | v27 has a fifth overworld biome (`cave`: dust, sparkles, snow weather, Lamplighter Quartz, the Crystal Golem, the Spark Plug quest) that the brief's four-island map does not name. This file retires `cave` as an *island* and provides `pt.dust`, `pt.sparkle` and `dng.cave` so it can live on as a sub-region under Frozen Peaks or as a dungeon. story-beats.md decides; nothing here breaks either way. |
| **Endless mode.** | events | designed as an event-driven hook only (§2.5.3). |

### 5.4 Conflicts found

- **Teardown internal:** SYSTEMS_INVENTORY Part 1 says the `weather` bounty can never complete; Part 2 and the HTML (L1611, L688) show it does. This file follows the HTML. The teardown is not edited; the orchestrator may want a one-line erratum in the Phase 0 spot-check.
- **Brief §4.3 vs v27 dungeon clock:** the brief's aurora-powered mechanisms require the clock to run in dungeons; v27 froze it. Resolved in favour of the brief (§2.1.1, logged).
- **Brief §4.4 vs v27 fog of war:** a radial darkness plate cannot coexist with a lit diorama. Resolved by cutting the visual and keeping the number (§2.4.4, logged).
- No conflict with `heroes.md` or `story-beats.md` is known; both were unwritten at the time of writing.

## 6. Decisions logged

- 2026-09-06 · phase-0.5/world-events-weather · Day cycle lengthened from 240 s to 480 s with v27's 50/10/30/10 proportions kept; `p = 0` re-anchored to dawn (`p_new = (p_v27 − 0.75) mod 1`) · seven keyframes need ≥ 45 s each to read, and a 240 s sun sweeps shadows like a time-lapse · rejected: 240 s (golden hour 24 s), 20 min (kids rarely see night).
- 2026-09-06 · phase-0.5/world-events-weather · The clock runs inside dungeons; v27 froze it · Brief §5.3.4 aurora-powered mechanisms need night to arrive while underground · rejected: freezing and giving the Observatory its own fake night (two clocks, two truths).
- 2026-09-06 · phase-0.5/world-events-weather · Campfire rest skips to the next dawn or dusk (3 s sky sweep) · the aurora and sunbeam puzzles must be reachable without waiting up to 6 minutes · rejected: a time-of-day menu option (breaks the diorama), no skip (frustration).
- 2026-09-06 · phase-0.5/world-events-weather · Dusk→night hard cut becomes a 4 s fast ease at `p = 0.70` · keeps the "night falls" beat without the frame pop · rejected: fully linear blend (loses the beat), keeping the cut (pops in 3D).
- 2026-09-06 · phase-0.5/world-events-weather · Noon sun capped at 58° elevation · a 90° sun flattens the diorama into the anti-palette "default engine" look · rejected: physically correct noon.
- 2026-09-06 · phase-0.5/world-events-weather · The Shadow Realm sky clock is locked to one keyframe `shadow.wrongDusk` while the gameplay clock keeps counting · v27's "no time of day" wash made deliberate; a sun that never sets is the "home, wrong" tell · rejected: a normal cycle in violet (loses the wrongness).
- 2026-09-06 · phase-0.5/world-events-weather · Fog of war cut as a visual; `vis.radius` kept as the gameplay number driving aggro, minimap reveal and far-object dimming · a dark radial plate cannot coexist with a lit, shadowed diorama (Brief §4.1) · rejected: a 3D vignette disc (still a plate), removing the mechanic entirely (loses sandstorm/fog/night gameplay).
- 2026-09-06 · phase-0.5/world-events-weather · Non-clear weather lasts 30–75 s (v27 20–60 s) with 6 s cross-fades · v27's 2 s `transT` was never read; with fades a 20 s storm is mostly fade and rarely delivers a second strike · rejected: v27 durations with no fade.
- 2026-09-06 · phase-0.5/world-events-weather · `blizzard` added to the Frozen pool (`clear ×2, snow ×2, blizzard ×1`) as the visibility weather dungeons reuse · the Frost Lich's canon description promises blizzards and the Observatory needs rope-line rooms; snow-family odds unchanged · rejected: making `snow` itself a visibility hazard (gentle snow is the island's beauty shot).
- 2026-09-06 · phase-0.5/world-events-weather · Shadow Realm gets two new weather types (`ashfall`, `riftstorm`) · v27 had no weather there; the finale needs a sky that moves · rejected: rain or storm in the Shadow Realm (too much like home).
- 2026-09-06 · phase-0.5/world-events-weather · v27 `cave` retired as an island; its ambient and dungeon tokens (`pt.dust`, `pt.sparkle`, `dng.cave`) kept for a sub-region or dungeon story-beats.md may place · Brief §5.1 names four islands plus the Shadow Realm · rejected: a fifth island (brief), dropping the recipes (canon quests reference the Crystal Depths).
- 2026-09-06 · phase-0.5/world-events-weather · Lightning lights the scene: the v27 double-flash envelope drives the directional light (×5.5 peak) and a strike point light; the fullscreen white plate drops from 0.45 to 0.12 · Brief §4.4 item 4; the telegraph, timing, damage and heroes-never-hit rule are kept verbatim · rejected: plate-only flash (fake), removing damage (loses "character-building weather").
- 2026-09-06 · phase-0.5/world-events-weather · Sheet lightning with 0.8–2.0 s delayed far thunder added to storms · ATMOSPHERE §18 asked for a thunder delay; strike distances (≤ 24 m) are too short to delay, so the beat moves to the sky · rejected: delaying strike thunder (imperceptible).
- 2026-09-06 · phase-0.5/world-events-weather · Aurora is four hanging shader curtains, not ribbons, lit onto the snow by one material uniform (`uAurora`) and no extra light; signal `world.aurora.intensity` published for dungeons · keeps v27's faintness, hues and rarity; a light would cost a pool slot · rejected: a directional aurora fill light, a screen-space ribbon port (parallax breaks in 3D).
- 2026-09-06 · phase-0.5/world-events-weather · All eight world events count toward `survive_event` (v27 counted three of five) · the quest text says "Survive 3 world events" · rejected: preserving the omission.
- 2026-09-06 · phase-0.5/world-events-weather · Event durations: caravan 45 s (was 20), blood moon 40 s (25), treasure 20 s (15), spring 30 s (20); earthquake 3 s unchanged · islands are larger than 128 m and sky transitions need 3 s in / 5 s out · rejected: v27 durations.
- 2026-09-06 · phase-0.5/world-events-weather · Blood Moon gets a real red moon and a false night if it fires by day; weight ×3 at night so the false night is rare · v27 had a red plate and no moon; "night is a feature" · rejected: night-only blood moons (too rare), plate-only (anti-palette).
- 2026-09-06 · phase-0.5/world-events-weather · Three new events, all marked [new text]: Meteor Shower (deep night), The Lost Lantern (night, Forest/Bog), Migration (dawn/dusk, Forest/Frozen) · each showcases a layer v27 could not draw (stars, carried light, herds); count kept modest · rejected: combat-only additions, more than three.
- 2026-09-06 · phase-0.5/world-events-weather · A 10 s exclusion between world events and biplane flyovers/supply drops via `events.reserve` · "if you see a yellow biplane, wave" only works if the plane is never upstaged · rejected: folding the biplane into the event scheduler (npcs.md owns it).
- 2026-09-06 · phase-0.5/world-events-weather · Wild animals: 19 species across five islands, ≤ 24 alive per island, instanced per species, never targetable, flee at 3–9 m · the reference is a populated diorama and the brief's success line has a deer in it · rejected: huntable animals (not this family's game), fewer than three species per island (empty).
- 2026-09-06 · phase-0.5/world-events-weather · Fishing is one button and timing only (0.7 s window, two fake nibbles), with per-island catch tables gated by clock phase and the aurora · Brief §5.5 asks for fishing; a meter minigame would be a second control model · rejected: reel-tension minigame, fishing as a stat system.
- 2026-09-06 · phase-0.5/world-events-weather · Five constellations named for the family's things (The Biplane, The Lantern, The Campfire, The Squad, The Meteor), visible from the campfire at deep night · tips 11 and 12 made visible; names avoid hero props because roles are open in heroes.md · rejected: constellations named after the kids' weapons (role-dependent).
- 2026-09-06 · phase-0.5/world-events-weather · The `weather` bounty is treated as working (v27 L1611 calls it), contradicting SYSTEMS_INVENTORY Part 1 · verified by grep against the HTML · rejected: "fixing" a bug that does not exist.
- 2026-09-06 · phase-0.5/world-events-weather · Dynamic light pool fixed at 8 points with a named priority order; enemy glows become emissive eyes · Brief §7.4 and §4.3; v27 capped implicitly by entity count · rejected: per-enemy lights.

## 7. Reconcile when the brainstorm doc lands

- Cycle length: if the brainstorm resolved a day length or a "night matters" design, re-check 480 s against it.
- Event list: the brainstorm may name events beyond v27's five; add them to §2.5.2 with weights, keep the three new ones unless they duplicate.
- Fishing: if the brainstorm specified a fishing design (a minigame, a rod upgrade path, cooking), reconcile the one-button loop and the catch value with it.
- Endless mode's fate and the Crystal Caves' fate are story-beats.md questions the brainstorm may already answer.
- Gran: the v27 text never states whether Gran is living or remembered (`She'd say: 'Eddie, the sky has more in it than stars…'`). This file designed no memorial or Gran-named feature on purpose; if the brainstorm establishes her status, the constellations and the rod's origin are the places it would touch.
- Weather on other islands: if the brainstorm assigned weather to a fifth region, use the retired `cave` pool.

## 8. Open questions for the orchestrator

None. No Brief §2(b) portrayal question arose (the one candidate, a Gran-named star, was avoided rather than decided; see §7), and no Rule 1 input was missing for this system.
