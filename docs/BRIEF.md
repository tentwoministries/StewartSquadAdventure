# Stewart Squad Adventure — Teardown & Rebuild Brief

**Codename:** *Lights in the Dark* (the rebuild)
**Legacy:** `stewart-squad-v26.html` (~10,349 lines, single-file HTML5 Canvas)
**Target:** Three.js + TypeScript low-poly 3D action RPG, multi-file repo, Claude Code build
**Owner:** Andrew Stewart · **Orchestrator:** Claude Fable 5.1 · **Implementers:** Claude Opus 5 subagents
**Andrew's role:** start sessions, read summaries, stay out of the loop otherwise

This one document is the source of truth for two jobs: (1) the **teardown** of the v26 game, and (2) the **implementation** of its successor. Read all of it before writing a line of code. Copy it into the repo at `docs/BRIEF.md` and never let it drift from the build.

---

## 0. Working Rules (apply to every session, every agent, every file)

These are Andrew's standing rules. They go at the top of every handoff document, every subagent system prompt, and `CLAUDE.md`. Subagents do not inherit the parent session's context, so each agent file must carry these verbatim.

1. **Missing inputs → stop and ask.** If a file, data source, or piece of context needed to do a task *properly* is missing, stop and ask Andrew rather than shipping incomplete work wrapped in disclaimers. Never paper over gaps. (Creative decisions are *not* missing inputs — see §2. Decide, log, proceed.)
2. **Pre-build gate for every external interface.** Before writing integration code against any API, package, or data format (Rapier, postprocessing, Colyseus, GLB loaders, save schema, Puppeteer GL flags), hit it with a real call and verify the actual response/shape. Never code against assumed or documented field names. Record the verified shape in the task's notes before proceeding. Non-negotiable.
3. **No assumptions in code.** Verify every field name, handler name, parameter, and format against the real source before writing tests, configs, or integration code. If unsure, grep the codebase first.
4. **Single Pro Inspection Checklist V2 — all 27 steps, every delivery, no tiers.**
   - P0 pre-build: memory/handoff read, design approval on record, API verification done, inherited code audited
   - P1 static: `tsc --noEmit` clean, runtime import check, AST/import trace, duplicate definitions, TODO sweep
   - P2 semantic: call-chain trace, entry points, name collisions, fuzzy/near-duplicate logic, substring hazards, possessive/string hazards in content, router/state-machine transitions
   - P3 infra: priority ordering, data field coverage, async correctness, rate/frame budgets, deferred work listed, exclusions documented
   - P4 delivery: filenames, packaging, regression suite green, version stamp, line/size count
5. **Handoff is the source of truth.** Every session ends by writing `docs/NEXT_SESSION.md` with these Working Rules at the top, current state, what's done, what's next, and known issues. The next session starts by reading it.
6. **Deliverables are files, not chat.** Everything lands in the repo. Andrew never copy-pastes from chat.
7. **Tests: trim before adding.** Before generating new tests, do a trim pass on the existing suite; target ~100 tests per suite; propose specific trims with rationale before writing new ones.

---

## 1. What This Is

Stewart Squad Adventure is a family time capsule you can play. Andrew's four kids — **Liam** (blue, tank/leader, oldest, protective, steady), **Noah** (orange, ranger/archer, sharp, quick, independent), **Collette** (purple, mage/enchanter, creative, imaginative), and **Isabella** (pink/red, berserker/guardian, youngest, fierce, unstoppable) — are the heroes. Grandpa Ed flies a biplane. Every quest, boss, and line of dialogue carries family history. The goal has not changed: when the kids play this at 25, they should smile and say, *"Dad made this for us."*

Over 26 versions the game grew a real design: four biomes (Forest, Desert, Swamp/Bog, Frozen Peaks), five dungeons (one per biome plus the Shadow Realm), sixteen enemy types, three-phase bosses built on a composable `BOSS_BLOCKS` system (Goblin King with Kid Snatch, Ancient Treant, Pharaoh Wraith), a story spine called *Lights in the Dark* with a meteor cutscene and an alien crater, skill trees with capstone forks, equipment, merchants, bounty board, bestiary, quest journal, NG+1–5, day/night with aurora, weather, world events, host/guest multiplayer, procedural audio, a dev console, and save slots.

What it never got was **visuals worthy of the design**. The Canvas art is functional. The world *feels* magical because of layering — sky, weather, particles, lighting, motion — but the underlying drawing is simple. Dungeons are structurally the same room-set reskinned per biome.

**This project rebuilds the game as a low-poly 3D world with a deliberate, layered, deep-color visual identity and a full UI/UX overhaul — while preserving every ounce of the family canon and the systems depth that already works.**

---

## 2. Creative Freedom Contract

Andrew is explicitly granting wide creative latitude. He does not want to be in the loop for taste decisions. This section defines the edges.

**You have full license to:**
- Change palettes, lighting, atmosphere effects, camera, animation style, UI metaphor, typography, menu structure, HUD design, and sound design.
- Redesign every dungeon's layout, mechanics, puzzle language, and pacing.
- Invent new enemy behaviors, environmental hazards, set pieces, world events, side activities, and secrets.
- Restructure the world (see §5 — floating islands recommended).
- Rename dungeons, locations, items, and abilities where the new name is better.
- Choose libraries, architecture, and tooling within §7.
- Cut legacy features that don't earn their place, **if** logged with rationale.

**You do not have license to:**
- Change the kids' names, colors, roles, or personality framing. Ever.
- Change a resolved decision in `stewart-squad-gameplay-brainstorm-v2.md` or the story spine without a logged rationale in `docs/DECISIONS.md`.
- Alter, paraphrase, or "improve" family-canon text (dialogue, quest text, in-jokes, cutscene lines, voice lines). It is ported verbatim. New text may be *added*; existing text is sacred.
- Add paid assets, paid services, telemetry, ads, accounts, or anything requiring a network at runtime except the optional multiplayer server.
- Ship anything that isn't family-friendly.
- Ship a pastel, washed-out, gray-fogged, empty, or "default engine" look. See §4.

**Interrupt Andrew only when:** (a) a Working Rule §0.1 missing-input situation occurs; (b) a decision would change how a real family member is portrayed beyond what the canon docs establish; (c) something would cost money or add an external dependency at runtime; (d) a gate (§8) has failed after the maximum allowed iterations. Everything else: decide, write it in `docs/DECISIONS.md` (one line: decision, why, alternatives rejected), and keep moving.

---

## 3. Phase 0 — The Teardown

**Inputs** (Andrew places these in `docs/legacy/` before the first session):
- `stewart-squad-v26.html`
- `stewart-squad-v26-complete-state.md` (bridge doc: every system, line-number map, audit, roadmap)
- `stewart-squad-gameplay-brainstorm-v2.md` (story spine, boss designs, skill trees, enemy roles, gear system, resolved decisions)
- `stewart-squad-dev-instructions.md`
- `docs/reference/fernwood.jpeg` — the visual north-star screenshot (see §4.1 for a written description in case the image is unavailable)

Read the complete-state doc first, then the brainstorm doc, then the HTML. Do not skim the HTML — the atmosphere layering lives in the rendering code, not in the docs.

**Outputs** — all in `docs/teardown/`:

| File | Contents |
|---|---|
| `SYSTEMS_INVENTORY.md` | Every system with legacy line ranges; every data table (`HDEFS`, `NPC_DEFS`, `QUEST_DEFS`, `SKILL_BRANCHES`, `BOSS_BLOCKS`, enemy defs, item defs); every formula (damage, crit, cooldowns, XP curve, NG+ scaling, gold economy, drop tables) written out exactly. |
| `FAMILY_CANON.md` | Every named character, relationship, in-joke, quest line, dialogue line, cutscene shot table, voice line, achievement name, loading-screen tip. This is the sacred text. Port to `src/content/` verbatim. |
| `ATMOSPHERE_RECIPES.md` | The layering that made v26 feel magical: day/night keyframes, aurora, each weather type, fog of war, particle recipes (dust on crate landing, spell sparkles, level-up burst), screen shake profiles, Ed's scarf flutter, biplane flyover choreography, parachute crate sprays, boss intro letterbox. For each: what it does, *why it works*, and its 3D equivalent. |
| `AUDIO_INVENTORY.md` | The `snd()` procedural audio system: every sound, its synthesis recipe, music/ambient logic. Port to Web Audio in the new engine (procedural audio stays — no external audio files required). |
| `KEEP_CHANGE_DROP.md` | Every feature classified Keep-as-is / Keep-but-rebuild / Drop, with one-line rationale each. |
| `PORT_MAP.md` | Where each legacy system lands in the new architecture (§7), and what changes shape (e.g. `BOSS_BLOCKS` → `src/content/bosses/blocks/`, arena effects → 3D telegraph decals). |
| `CONTROL_MODEL.md` | Exactly how the party is controlled today (active hero switching, companion AI, combo ultimate pairing, multiplayer host/guest roles). Preserve this model unless the teardown recommends a change — and log it. |

**Definition of Done:** an Opus subagent with no other context can read `docs/teardown/` and correctly answer "how does X work in v26" for any X. The orchestrator spot-checks ten random systems against the HTML.

---

## 4. The Visual North Star

This is the highest-priority section in the brief. Read it twice.

### 4.1 The reference, in words

A small, self-contained low-poly world seen from an elevated angle, like a hand-built diorama on a tabletop. Every object — pines, boulders, cabin, tent, fence, deer, fox — is made of clean, visible facets with flat shading. The palette is **deep and rich, not pastel**: saturated emerald and moss greens, warm honey-wood browns, a teal-slate roof, a turquoise stream cutting through the meadow, a navy night sky behind pale gray-white mountains. One warm key light casts soft shadows. Chunky white clouds drift *below* eye level between the trees. The ground is dense with small things: flowers, pebbles, mushrooms, a lantern, a stone campfire ring, a fruit basket, a log. Nothing is empty. A little character with a red cap stands in a soft selection ring. A quiet title card in the corner: a location name in a serif, one line of description beneath it. It reads as a *toy set you could reach into* — cozy, precise, alive.

The "low-poly" part is the geometry. The "high attention to detail" part is the density, the layering, and the light. Both are required. Most low-poly games nail the first and skip the second; that is the failure mode to avoid.

### 4.2 Palette direction (starting points — the visual loop may revise)

Deep jewel tones. Strong value contrast. Warm key, cool fill. Each island gets 4–6 named base colors; UI pulls accents from the active island.

- **Forest island** — deep emerald `#0F5132`, moss `#3A7D44`, pine-shadow `#123524`, honey wood `#B8863B`, stream turquoise `#2EB8A6`, golden-hour light `#FFD08A`
- **Desert island** — burnt sienna `#B3541E`, ochre `#D9A441`, dusk violet sky `#4A2C6B`, oasis turquoise `#1FA3A0`, bleached bone `#EDE3CF`
- **Bog island** — teal-black water `#0B2B2E`, phosphor green `#6CE87A`, bruise-purple fog `#5A3E78`, witch-lantern amber `#FFB347`, rot-brown `#4A3524`
- **Frozen Peaks island** — indigo night `#1B2A5A`, ice blue `#8FD3F4`, snow `#F2F7FF`, aurora green `#5FFFAF`, aurora magenta `#E56BFF`
- **Shadow Realm** — void violet `#120A1F`, ember `#FF6A2A`, rift cyan `#3AF0FF`, ash `#5C5C66`

Anti-palette (never ship): uniform mid-green, gray fog on gray ground, pastel everything, pure-black shadows, the default Three.js bluish-white lighting, neon UI over a soft world.

### 4.3 Lighting

- One directional **sun/moon** with PCF soft shadows (2048 map desktop, 1024 mobile). Hemisphere ambient tinted sky-color-over-ground-color. That single rig is most of the look.
- **Day/night cycle** as lighting keyframes (dawn, morning, noon, golden hour, dusk, night, deep night). Golden hour is the hero look; tune everything there first, then make the other keyframes as beautiful.
- **Point lights budget**: lanterns, campfire, spell glow, Collette's magic — a small pool, distance-culled, warm colors.
- **Night is a feature**, not a dimmer: fireflies, lantern pools, glowing mushrooms in the Bog, aurora over Frozen Peaks, spell light that actually illuminates geometry, the cabin windows glowing.

### 4.4 Atmosphere layering (the v26 lesson, carried into 3D)

The magic came from *many simultaneous layers*. Every scene should have at least five of these active at once:
1. Sky gradient dome with time-of-day keyframes and drifting low-poly clouds (some below the camera)
2. Height/distance fog tinted to the island palette (never gray)
3. Ambient particles: pollen and fireflies (Forest), sand streams (Desert), spores and wisps (Bog), snow and ice glitter (Frozen), embers (Shadow)
4. Weather: rain, thunderstorm with lightning flashes that light the scene, sandstorm, snowfall — each with sound, visibility, and gameplay effect
5. Dynamic shadows and light pools
6. Post-processing stack: ACES tone mapping, selective bloom, **tilt-shift depth of field** (the diorama seal), gentle vignette, SMAA, optional color-grade LUT per island
7. Life motion: tree sway, grass/flower flutter, water flow shader, cloud drift, animal idle wander, character breathing and blink, Ed's biplane crossing the sky, smoke from chimneys and campfires
8. Curved-world vertex shader (see §5.1) so the horizon rolls away

### 4.5 Camera

Elevated third-person orbit, pitch fixed around 45–55°, yaw rotatable by the player (Q/E, right stick, or two-finger drag), smooth damped follow with slight look-ahead. Cinematic camera mode for boss intros (letterbox bars, slow push-in, name card) and cutscenes (meteor, crater, biplane landing). Photo mode with family poses.

### 4.6 Characters

Chunky, readable low-poly heroes with strong silhouettes and their canon colors. Signature props: Liam's shield, Noah's bow, Collette's staff, Isabella's oversized weapon. Animation set per hero: idle (breathing), walk, run, dodge, attack combo, signature, ultimate, hit, knockdown, victory, emote. Simple expressive faces with blink. Sources, in order of preference: custom Blender models exported as GLB → Kenney Mini Characters (CC0) adapted with vertex colors → procedural blocky rigs built in code. Enemies get the same treatment; sixteen types must each be recognizable at a glance from the gameplay camera.

### 4.7 Materials & geometry

`flatShading: true` on everything. Vertex colors instead of textures wherever possible (variation via slight hue jitter per instance). `InstancedMesh` for trees, rocks, grass, flowers, pebbles. Water as a custom shader (flat-shaded with a low-frequency wave, foam at edges, refracted tint). No z-fighting, no smoothing artifacts, no stretched UVs — facets stay clean.

---

## 5. World & Game Design Direction

### 5.1 World structure — floating islands, not a globe

Do **not** build a true spherical planet. The reference's mini-globe works for one small level; Stewart Squad has four large regions, dungeons, pathfinding, and procedural placement, and spherical math would tax every one of them for a look that can be faked. Instead:

- Each biome is a **floating diorama island** in the sky. Forest is home. Desert, Bog, and Frozen Peaks are destinations. The Shadow Realm is a dark floating shard.
- The **curved-world vertex shader** bends geometry downward with distance from the camera, so the horizon rolls away and the island feels like a small world (implement via `onBeforeCompile` on a shared material chunk; the amount is tunable per island and disabled in dungeons).
- **Grandpa Ed's biplane is the travel system.** The landing strip at camp, the flyovers, the aerobatics, the crash event, and the supply drops all port over — now the plane is also how you go island to island (a short in-flight sequence with the departing and arriving islands visible in the sky, weather en route, Ed's dialogue).
- **Hand-authored macro layout, procedural micro detail.** Each island's landmarks, roads, camp, dungeon entrance, and quest sites are placed by design. Prop scatter, enemy camps, resource nodes, and secrets are seeded procedurally so replays and NG+ stay fresh. Preserve the noise-based blending and landmark-clearance logic where it still earns its place.

### 5.2 Home base — the Fernwood-style camp

The Forest island's camp is the family hub and it should *grow*: a tent and a campfire at the start; a cabin, a fence, a garden, animals, Ed's hangar, a bounty board, and the merchant's stall as quests complete. This is where the reference image's cozy density belongs most. Pets wander here. The photo mode lives here. Loading-screen memories and family collectibles point back here.

### 5.3 Dungeons — five distinct mechanical identities

Legacy dungeons were the same structure in five skins. Each rebuilt dungeon must be recognizable from its *rules*, not its palette. Proposals (revise freely, but each dungeon must have a unique core mechanic, a unique traversal element, a unique puzzle language, a mid-dungeon set piece, and a three-phase boss built on ported `BOSS_BLOCKS`):

1. **Forest — The Rootways (Ancient Treant).** A living dungeon: root walls grow and retract on a rhythm, reshaping routes. Vertical canopy tiers. Glow-moss paths only visible when Collette's magic lights them. Saplings that must be cleared before roots seal a room. Boss phases per canon: vine grabs → planted with root zones and saplings → uprooted aggression.
2. **Desert — The Sunken Pyramid (Pharaoh Wraith).** Sand-flow mechanics: rooms fill and drain via levers, raising and lowering the floor to reveal doors. Mirror puzzles that route sunbeams. Sandstorm chambers with reduced visibility and shifting cover. Scarab swarms. Boss phases per canon: teleport and spread shots → cocoon and scarab swarms → phantom split.
3. **Bog — The Witch's Lanterns.** A darkness dungeon: only carried and placed lantern light reveals the way. Will-o'-wisps that guide or mislead. Sinking lily-pad crossings. Poison mist that rises and falls on a timer. The Bog Witch escort quest becomes a real set piece — she must be kept in light. Boss: design one on `BOSS_BLOCKS` in the canon's spirit if none is resolved.
4. **Frozen Peaks — The Hermit's Observatory.** Ice physics (sliding momentum), crystal-resonance puzzles (strike crystals in sequence), aurora-powered mechanisms that only work at night (the day/night cycle becomes a puzzle tool), blizzard rooms where you follow rope lines. Boss: same rule as above.
5. **Shadow Realm — Home, Wrong.** A corrupted mirror of the Forest island and the camp. The cabin, the fence, the tent — all there, all wrong. A shadow squad mirrors the four heroes. It composes mechanics learned in the other four. This is the *Lights in the Dark* finale; treat it as the emotional climax and give it the best lighting in the game.

Plus the **Goblin King Kid Snatch** fight ported faithfully into 3D: cage entity, captured-hero HUD overlay, cage hit-windows during ground slam and wall stun, release, voice lines, Phase 3 enrage with cage throw.

### 5.4 Combat feel

Port the exact ability kit, cooldowns, skill trees, equipment, and formulas from the teardown as data. Then add what 3D makes possible: dodge roll with i-frames, soft lock-on, hit-stop on heavy hits, camera shake profiles, hit flashes, damage numbers as color-coded 3D billboards, and **ground telegraphs** (circles, cones, lines) for every boss and elite attack — readable and colorblind-safe (shape + color). Combo ultimates get a short cinematic beat. Combat must be legible at the gameplay camera distance; test it with screenshots.

### 5.5 Systems to carry forward

Skill trees (3 branches, 2 tiers, capstone forks, team-level allocation), equipment and inventory, respec tokens, merchant and gold, bounty board, bestiary, quest journal with prerequisites, world events, NG+1–5 scaling, save slots, dev console, achievements, memory collectibles, the alien crater and meteor cutscene, all story flags. Peaceful layer: fishing, pets at camp, photo mode. Anything dropped goes in `KEEP_CHANGE_DROP.md` with a reason.

---

## 6. UI/UX Overhaul

The old UI was HTML overlays on a canvas. The new UI is designed, not defaulted.

- **Metaphor:** the family scrapbook. Pause menu, skill trees, inventory, bestiary, quest journal, and memory collectibles are *pages* — paper texture, photo-corner frames for bestiary entries, handwritten-feel captions for family notes, a family crest that evolves. One orchestrated page-turn transition; no scattered animations.
- **HUD:** minimal, corner-anchored, fades when idle. Hero portraits with soft light rings for health; cooldowns as arcs on ability icons; a small compass strip instead of a big minimap; quest markers as lantern beams in the world (diegetic). Boss health as a single elegant bar with phase pips. Captured-hero overlay for Kid Snatch.
- **Typography:** one or two families, bundled locally as `woff2` (no CDN — time capsule). Warm, rounded, readable; not the generic engine default and not a template look. Sentence case. No all-caps labels, no tracked eyebrows, no dividers as decoration. Location title cards like the reference: name plus one quiet line.
- **Copy voice:** plain verbs, sentence case, the family's own voice for flavor. Buttons say what they do. Errors and empty states give direction.
- **Input:** keyboard/mouse, gamepad (full), touch (virtual joystick + three action buttons + swap, 44px minimum, safe-area insets). Remappable.
- **Accessibility:** reduced-motion toggle, text scale, colorblind-safe telegraphs, screen-shake intensity slider, hold-vs-toggle options.
- **Onboarding:** a five-minute tutorial woven into the crash-site opening, for the kids' friends who've never played.

---

## 7. Technical Architecture

### 7.1 Stack

- **Vite + TypeScript (strict)**, ES modules, multi-file
- **Three.js** for rendering; **`postprocessing`** (pmndrs) for the FX stack; **`three-mesh-bvh`** for fast raycasts
- **Rapier** (WASM) for collision and character controller — or a custom capsule-vs-heightfield with a spatial hash if Rapier's footprint isn't justified; spike both in Phase 1, decide, log
- **`simplex-noise`** for procedural scatter and blending
- **Web Audio** procedural sound ported from `snd()`; no audio files
- **State:** lightweight ECS (`bitecs`) or plain typed systems; **fixed-step simulation (60 Hz) with interpolated rendering** — mandatory from day one so multiplayer and replays stay deterministic
- **Multiplayer:** evaluate Colyseus (authoritative Node server) vs. host/guest over WebRTC in a Phase 5 spike; the deterministic sim is designed to support either
- **Save/load:** versioned JSON schema with migrations, multiple slots, localStorage plus export/import file
- **Tests:** Vitest for the simulation; Puppeteer (or Playwright) headless smoke tests driven through the dev console (state transitions, dungeon clears, regression list — the v20 harness idea reborn); frame-time budget tests
- **Assets:** GLB models in `assets/models/`; sources are custom Blender or CC0 (Kenney kits); every asset's license recorded in `assets/LICENSES.md`; fonts bundled locally

### 7.2 The time-capsule rule, reinterpreted

The old "one file, no dependencies" principle existed so the game opens in any browser in 2045. Keep the *goal*, change the *form*: every release produces (a) a self-contained `dist/` with zero runtime network calls, and (b) a **single-file archival HTML** (via `vite-plugin-singlefile` or equivalent, assets base64-inlined) committed under `releases/vX.Y/`. Lockfile and Node version are pinned so it can always be rebuilt. The single-file build is the time capsule; the repo is the workshop.

### 7.3 Repo layout

```
/CLAUDE.md                 working rules + pointers (short; links to docs/BRIEF.md)
/.claude/agents/           subagent definitions (see §9)
/docs/BRIEF.md             this file
/docs/legacy/              v26 HTML + docs (read-only inputs)
/docs/reference/           fernwood.jpeg + any mood references
/docs/teardown/            Phase 0 outputs
/docs/visual-loop/         Phase 1 iteration logs + screenshots
/docs/DECISIONS.md         one line per decision
/docs/PROGRESS.md          dated log, one entry per completed task
/docs/NEXT_SESSION.md      handoff (rules at top) — rewritten every session
/docs/COMPLETE_STATE.md    the bridge doc tradition — updated at each phase gate
/src/main.ts               boot
/src/engine/               loop, fixed-step, input, camera, audio, save, events
/src/render/               scene setup, lighting rigs, post stack, curved-world chunk, shaders, instancing
/src/style/                palette tokens, lighting keyframes, post presets (the law after Phase 1)
/src/sim/                  ECS/systems: movement, combat, AI, abilities, status, loot, quests, events
/src/world/                island authoring, procedural scatter, weather, day/night, biplane
/src/dungeons/             one folder per dungeon: layout, mechanics, puzzles, boss
/src/content/              typed data: heroes, enemies, items, quests, dialogue, bosses/blocks, canon text
/src/ui/                   HUD, scrapbook menus, title cards, touch controls, gamepad map
/src/net/                  multiplayer (Phase 5)
/src/dev/                  dev console, screenshot stations, perf overlay
/assets/models, fonts      GLB + woff2; LICENSES.md
/tests/unit, /tests/smoke  Vitest + headless harness
/pilot/                    Phase 1 scene (deleted after style lock, tokens promoted to src/style)
/releases/                 single-file archival builds
```

### 7.4 Performance budgets

- Desktop: 60 fps at 1080p on integrated graphics (≤ 16.6 ms frame, ≤ 8 ms sim)
- Mobile: 30 fps on a mid-tier phone; quality presets Low/Medium/High/Ultra auto-detected, user-overridable
- Draw calls ≤ 300 per frame via instancing and merged static geometry; triangles ≤ ~500k per island at High
- Shadow map 2048 desktop / 1024 mobile; post stack scales per preset (DoF and bloom drop first)
- Load time ≤ 5 s to camp on a mid-tier laptop; islands stream on biplane travel
- Object pooling for particles, projectiles, damage numbers; zero per-frame allocations in the hot loop

---

## 8. Execution Plan & Gates

Every phase ends the same way: inspection checklist (all 27 steps) → tests green → visual gate on any new content → commit + tag → `docs/PROGRESS.md` entry → `docs/COMPLETE_STATE.md` update → `docs/NEXT_SESSION.md` rewritten → one summary message to Andrew with screenshots and what's next. The summary is informational; do not wait on a reply unless a §2 interrupt condition applies.

### Phase 0 — Teardown
Deliver `docs/teardown/` per §3. Gate: orchestrator spot-check of ten systems.

### Phase 1 — Pilot: the Visual Excellence Loop
Build `pilot/`: one Forest island in the Fernwood spirit, Liam walking and idling, camp props, stream, trees, deer, full day/night cycle, weather toggle, curved-world shader, complete post stack, HUD stub, location title card, and the dev console with **fixed screenshot stations** (four camera positions × three times of day, seeded).

Then loop:
1. Render → capture all twelve station screenshots headless (software GL flags verified per Working Rule 2; Claude Code can view PNGs)
2. The **art-director** agent scores each screenshot against the rubric below and writes `docs/visual-loop/iteration-NN.md` (scores, what's wrong, exact changes planned)
3. Implement the changes → next iteration

**Rubric** (1–5 each, 10 criteria, 50 max): silhouette readability · color depth and harmony (deep, rich, no pastel, no default look) · lighting drama (warm key, soft shadows, golden hour sings) · atmosphere layering (≥ 5 layers visibly active) · detail density (no empty ground) · facet cleanliness · composition (tilt-shift focal band, framing) · motion life (sway, flow, drift, breathing) · UI integration (legible, not fighting the scene) · performance (budgets met)

**Excellence mark:** ≥ 42/50 with no criterion below 4, on **two consecutive iterations**, with budgets met. Maximum 12 iterations; if unmet, present the best three iterations to Andrew side by side and ask (this is a §2(d) interrupt). On pass: promote tokens, lighting rigs, and post presets to `src/style/` — they are now the law for every island — and delete `pilot/`.

### Phase 2 — Vertical slice: the Forest island
Full Forest island: crash-site opening and tutorial, camp with growth stages, all four heroes with full kits and skill trees, companion control model, Forest quest chain and NPCs, Forest enemies, world events and weather, The Rootways dungeon, Ancient Treant, Goblin King Kid Snatch, inventory, merchant, bounty board, bestiary, journal, save/load, complete HUD and scrapbook menus, keyboard/gamepad/touch. Gate: playable from title to first boss with no placeholder art; a scripted 20-minute headless play session passes; visual rubric ≥ 40 on new stations; perf budgets met on desktop and mobile presets.

### Phase 3 — The world
Desert, Bog, and Frozen Peaks islands with their dungeons and bosses, biplane travel with in-flight sequence, Ed's crash and repair chain and supply drops, remaining NPC chains, NG+1–5, aurora, all weather. Gate: each new island passes the rubric ≥ 40; full quest graph validated by a test that walks every prerequisite chain.

### Phase 4 — Lights in the Dark
Shadow Realm, shadow squad, meteor cutscene and crater wiring, cinematic camera system, ending, achievements, memory collectibles, family crest, loading-screen memories, photo mode, fishing and pets. Gate: story flags test covers every branch; the finale's stations score ≥ 44.

### Phase 5 — Multiplayer, audio, polish
Multiplayer spike and implementation, procedural audio port and music, controller polish, accessibility pass, performance pass across presets, bug bash. Gate: two-client headless smoke test passes; audio inventory fully ported.

### Phase 6 — Release
Single-file archival build, `releases/v1.0/`, README with a kid-facing "How to play," final `docs/COMPLETE_STATE.md`, tagged `v1.0`.

---

## 9. Orchestration & Git

### 9.1 Git — required
A long autonomous build without version control is a build without an undo button. Before the first session: `git init`, a **private GitHub remote**, `main` protected by convention (no force-push). Then:
- One branch per phase (`phase-1-pilot`, …); merge to `main` at each gate; tag each gate (`p1-style-locked`, `p2-vertical-slice`, …)
- Commit per completed task with a message that names the task from `docs/PROGRESS.md`; `npm run check` (tsc + lint + unit tests) must pass before any commit
- Screenshots from the visual loop are committed (they are the design record)
- Never rewrite history; a bad direction is reverted with a new commit and a `DECISIONS.md` line

### 9.2 Models and agents
- **Orchestrator: Claude Fable 5.1** in the main Claude Code session. Plans, delegates, reviews diffs, runs gates, writes handoffs. Does not write large implementations itself.
- **Art director and QA inspector: Fable 5.1** (`model: inherit`) — the judgment-heavy roles get the strongest model.
- **Implementers: Claude Opus 5** subagents in `.claude/agents/` (set the `model` field to the Opus 5 model string; verify the exact field and accepted values against the official subagent docs before relying on them — Working Rule 2).

Suggested agents (each file carries §0 verbatim in its body, because subagents receive only their own system prompt):

| Agent | Role | Tools |
|---|---|---|
| `archaeologist` | Phase 0 teardown; reads legacy, writes `docs/teardown/` | Read, Grep, Glob, Write |
| `art-director` | Scores screenshots against the rubric; writes iteration logs; never edits code | Read, Write |
| `render-engineer` | Scene, lighting, shaders, post stack, instancing, perf | Read, Edit, Write, Bash |
| `world-builder` | Islands, scatter, weather, day/night, biplane, camp growth | Read, Edit, Write, Bash |
| `systems-engineer` | Sim, ECS, combat, abilities, AI, quests, save, content port | Read, Edit, Write, Bash |
| `dungeon-designer` | One dungeon at a time: layout, mechanics, puzzles, boss | Read, Edit, Write, Bash |
| `ui-designer` | HUD, scrapbook menus, title cards, touch, gamepad | Read, Edit, Write, Bash |
| `net-engineer` | Phase 5 multiplayer | Read, Edit, Write, Bash |
| `qa-inspector` | Runs the 27-step checklist, tests, budgets; blocks the gate | Read, Bash |

Parallelize where files don't overlap (e.g. `ui-designer` and `world-builder` in Phase 2). Serialize anything touching `src/style/` or `src/sim/` core.

### 9.3 Session rhythm
Each session: read `docs/NEXT_SESSION.md` → confirm the plan for the session in `docs/PROGRESS.md` → delegate → review → gate if reached → rewrite `docs/NEXT_SESSION.md` → summary to Andrew. Andrew's only recurring action is to open the next session with: *"Continue from docs/NEXT_SESSION.md."*

---

## 10. Andrew's Setup Checklist (before session one)

1. Create the private GitHub repo and push the current Claude Code repo to it.
2. Place the four legacy files in `docs/legacy/` and the reference screenshot at `docs/reference/fernwood.jpeg`.
3. Copy this brief to `docs/BRIEF.md`.
4. Confirm Node LTS is installed and pinned (`.nvmrc`).
5. Start Claude Code in the repo on Fable 5.1 and say: *"Read docs/BRIEF.md in full. Set up CLAUDE.md and .claude/agents/ per §9, then begin Phase 0."*

Optional, whenever you like: a short list of new family memories, jokes, or traditions you'd want woven in. Not required to start — the canon already carries plenty.

---

## 11. Definition of Success

A kid opens the game. The camp glows in golden-hour light, the stream moves, a deer wanders past the tent, Ed's biplane rolls over the ridge, and their own name is on the hero standing in the selection ring. Every dungeon feels like a different place with different rules. The menus feel like a family scrapbook. It runs on the family laptop and on a phone. The single-file build opens in 2045. And nothing in it is generic — every choice was made *for this family*.
