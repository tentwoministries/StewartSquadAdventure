# UI / UX — Design Bible

**Status:** draft for orchestrator review · **Written:** 2026-09-06 · **Author:** design-lead (Fable, xhigh)
**Sources read:** BRIEF §2, §4.1, §4.2, §6, §7.1–7.4, §8 · ATMOSPHERE_RECIPES §13, §14, §17, §19 · SYSTEMS_INVENTORY Part 1 §9, §10, §23, §25, §27, §28, §29; Part 2 §6.7, §7.5–7.7, §11.4–11.5, §11.11, §12, §16, §17, §20, §21 · FAMILY_CANON §1.4, §2.4, §2.5, §3.6, §4.2, §5.4, §5.5, §6.2, §6.5, §6.6, §8, §9, §10.1–10.6, §11.1, §11.2, §11.8–11.12, §12, §13.3 · CONTROL_MODEL §1, §5.3–5.4, §9, §10, §12 · AUDIO_INVENTORY §3 · legacy L1744, L3416, L3606–3629, L7066, L8493, L8660 (verified) · **Depends on:** heroes.md, enemies.md, story-beats.md, world-events-weather.md, bosses.md, camp.md, npcs.md · **Feeds:** audio.md, cutscenes.md, dungeons.md, KEEP_CHANGE_DROP.md
**Brainstorm doc:** not available at time of writing — reconcile on arrival.

v27's gold-on-navy glass HUD and thirteen canvas-and-DOM overlays become one family scrapbook (ink on paper, one page-turn) under a lantern-light HUD (cream on night glass, four portrait rings, a compass strip, beams in the world). Every canon string is placed verbatim, every prompt renders from the live binding, and keyboard, gamepad and touch each get a full map.

## 1. What v27 does

**Structure (SI Part 2 §16).** DOM overlays over the canvas for the start screen, HUD, level-up, skill trees, inventory, pause, game over, victory, victory stats, dungeon entry/victory/fail, merchant, bounty board, settings, boss letterbox and mini-boss popup; canvas-drawn for the minimap, quest journal, bestiary, dialogue box, compass arrow, tutorial bar, boss bars, announcements, achievements, joystick and touch buttons. Show/hide is a 200 ms fade (L3743–3744). Skill tree, inventory and pause are mutually exclusive and each sets `paused`; the bestiary does not pause (CM §9). Everything refuses to open during game over, victory or a pending level-up.

**Look (AR §17).** One accent (`--gold #E8A838`) over four navy backgrounds (`#0B0E1A` → `#1E1832`), warm off-white text (`#FFF5E6` / `#D4C4A8` / `#998A72`), gold-tinted glass panels with `backdrop-filter`, Trebuchet MS, a `heroBob` title, `btnPulse` on buttons. Two ideas worth keeping: warm accent over cool ground, and the accent retinting per biome every 1 s (`updateBiomeAccent`, L3347).

**HUD (SI §16.3–16.4, AR §17.4).** Top-left: `<FullName> Lv<teamLv>`, a 200 × 22 HP bar, a 200 × 8 XP bar, `👥 Siblings: N/3`, `Wave N`, difficulty chip, day/night glyph, weather chip, `XP +50%`, `⬤ Ng`, `NG+N`, `🔧 DEV`; a 46 × 54 portrait strip at 50 px pitch (locked `?`, HP sliver, initial circle, ult bar, revive countdown); `⚡ ULTIMATE READY — SPACE` hard-coded to a key that is not the bind (CM §5.3); `⚡ <sigNm> [E]`; `HYBRID` mode chip. Top-right: a 120 × 120 minimap and a 130 × 42 quest tracker that cycles on click. The HUD hides while the journal or bestiary is open. Canvas layers in render order: boss bar → cage HP overlay → shadow-queen bar → announce → achievements → joystick → touch buttons → endless HUD → minimap → offscreen ally arrows → mini-boss bars → quest tracker → tutorial bar → tooltip → compass → bestiary → journal → quest notifications → dialogue box.

**Channels (verified against the legacy).** `announce(t, c, d)` (L1744) holds one string, default 2.5 s and `#E8A838`, drawn bold 28 px centred at `H·0.18` with a 15 px glow; a new announce replaces the old. Achievements (L3611) slide in from the right at bottom-right, 250 × 45, 55 px pitch, 3.5 s, `Achievement Unlocked!`. Quest notifications (L8660) stack bottom-centre, three visible, 28 px pitch, bold 10 px. The compass (L8493) is a pulsing edge-of-screen arrow toward `getNextObjective9()`, fading inside 300 px and hidden inside 50 px, toggled with `G`. Damage numbers (AR §14): hue = who, size = how much, bounce = crit, black outline, 30 cap.

**Boss UI (AR §13.1, SI §16.4).** `#0B0E1A` letterbox bars 60 px, name card from the right with a back-out overshoot, 4.1 s timeline, sim frozen while the camera shakes; a 60 %-width HP bar with white phase dividers; the mini-boss popup at `top: 60px` for 2.5 s, never letterboxed. Cage HUD (`drawCagedHUD`, L5303) greys captured portraits and never restores them (SI §29).

**Dialogue (SI §7.5–7.7).** A rounded panel at `y = H − 120`, `rgba(11,14,26,0.94)`, gold border, one drawn portrait (Ed only), two characters per frame, first press completes and second advances, a pulsing `▶`, the whole sim frozen while open. Mood tags carried by every canon line are ignored at runtime.

**Input (SI §17, CM §1).** Nineteen bindable actions with sensible defaults (WASD/arrows, 1–4, Space, R/0, E, Q, B, J, G, Esc/P, T, I, C, M), twelve of them exposed in the rebind UI, a rebind that destroys the secondary key, three control modes on one cycling key, two overlapping touch systems (circular ATK/ULT/ACT at r 30/25/25 plus legacy rectangles, a floating joystick on the left half, a 55 px drawn / 60 px input mismatch), no gamepad, no input buffer, no blur handling, keys stuck across alt-tab.

**Settings (SI §16.5, FC §12.5).** Eight persisted settings (`Screen Shake`, `Hit-Stop`, `Particles`, `Auto-Aim` (dead), `Tutorial`, `Damage Numbers`, `Minimap`, `World Zoom`) plus `CONTROLS` and `Reset to Defaults`.

**Tutorial (SI §12, FC §8).** Seven steps, one pulsing 30 px bar at `H − 65`, each with a completion check, a chime per advance; frame-rate dependent on step 7.

**Save (SI §28).** Three slots plus autosave, `ssq_meta` summaries, `SAVE_VERSION 10` with ten migrations, dungeon saves that write the entry snapshot, no export or import.

**Dev console (SI §20).** `Ctrl+Shift+D`, a 95 %-black panel, quick tools, boss scenarios, teleports, gear tools, all `dev*` functions exported on `window`; `DEV_MODE` on F2 or five taps on the version label.

**Oddities that change this design (SI §21, §29; CM §11).** The ultimate banner names the wrong key; the touch handler does not un-zoom; guests cannot rebind; the bestiary alone does not pause; a rebind kills the second default; portraits stay grey after a cage release; `Auto-Aim` and `goldFloat` are dead; two `Storm Chaser`s; the endless HUD strings belong to a mode story-beats.md cut; there is no gamepad, no focus handling, no export.

## 2. What it becomes

### 2.0 Surface inventory and typefaces

**Surface inventory.** `page` = a scrapbook page (paper); `HUD` = corner-anchored chips over the world; `world` = anchored in the 3D scene; `prompt` = the live-binding pill; `card` = a title-card family element. "Pauses" is the sim; the render clock never pauses (§2.2.5).

| Surface | Type | When shown | Pauses the sim? | Owner file |
|---|---|---|---|---|
| Title screen | page over station S5 | boot, `🏠 TITLE` | n/a | this file, camp.md §2.12 |
| Pause (the index page) | page | `P` / `Esc`, Start, blur | yes | this file |
| Skill trees | page | `T`, tab | yes | this file; data heroes.md §2.5.9 |
| Pack (inventory and gear) | page | `I`, tab | yes | this file; data SI §23 |
| Quest journal | page | `J`, tab | yes | this file; data story-beats §2.4 |
| Map and destination card | page | `N`, tab; the plane's `Fly` prompt | yes | this file; contents npcs.md §2.3.3 |
| Bestiary | page | `B`, tab | **yes** (v27: no) | this file; cards enemies.md §2.10, bosses.md |
| Memories | page | tab | yes | this file; roster camp.md §2.10, story-beats |
| Achievements | page | tab | yes | this file; data FC §9 |
| Fish | page | tab | yes | this file; data world-events §2.7.2 |
| Pets | page | tab | yes | this file; data camp.md §2.9 |
| Dialogue log | page | tab | yes | this file; requested by npcs.md §2.11 |
| Settings and Controls | page | tab, title, pause | yes | this file |
| Saves | page | tab, title | yes | this file; schema SI §28 |
| Level-up | page (three cards) | `teamLv` rises | yes | this file; data SI §9 |
| Merchant | page | `[SPACE] Trade` | yes | this file; strings npcs.md §2.7 |
| Bounty board | page | interact at the board | yes | this file; data FC §5.5 |
| Dungeon entry | page | within 1 m of an uncleared entrance | yes | this file; dungeons.md places it |
| Dungeon cleared / failed / retreat | page | boss death beat 2.0 s; wipe; pause button | yes | this file; bosses.md §2.5 |
| Victory stats | page | after the King, dungeon bosses, the Queen | yes | this file |
| Victory / Game over | page | B3.5; no living hero | yes | this file; story-beats |
| Photo mode | HUD strip over the world | `H`, pause button | yes | this file; poses camp.md §2.10 |
| HUD: party strip, ability icons | HUD | playing | no | this file |
| HUD: compass strip and chips | HUD | playing, overworld and dungeons | no | this file; priority story-beats §4 |
| HUD: quest tracker | HUD | an active quest exists | no | this file |
| Boss bar, cage and kidnap sub-bars | HUD | a boss is up | no | bosses.md §2.4 (spec), this file (render) |
| Captured-hero overlay | HUD | `boss.cage.state.active` | no | this file |
| Mechanic meter | HUD | `dungeon.meter` is set | no | dungeons.md (feeds), this file (render) |
| Dungeon paper minimap | HUD | in a room dungeon | no | this file |
| Announce channel | HUD | any `announce()` | no | this file |
| Quest notifications | HUD | quest progress | no | this file |
| Achievement toasts | HUD | `trigAch` | no | this file |
| Tutorial bar | HUD | tutorial active | no | this file |
| Dialogue box | HUD (bottom) | `openDialogue` | **freezes** (npcs.md §2.11) | npcs.md (data), this file (box) |
| Cutscene captions and letterbox | HUD | cutscenes, boss intros, the combo beat | frozen by the owner | cutscenes.md, bosses.md §2.3; this file styles |
| Prompt pill | prompt | an interaction is in range | no | this file |
| Emote wheel | HUD radial | hold `V` / View / face button | no | this file; content heroes.md §2.4.6 |
| Combo radial | HUD radial | hold `Q` 0.2 s / RB | no | heroes.md §2.5.8 |
| Title card, location card, camp card | card | landings, arrivals, stage changes | no | this file; lines story-beats §2.7 |
| Boss intro name card, mini-boss popup, squad popup | card | intros and wakes | intro: frozen; popup: no | bosses.md §2.3, enemies.md §2.7 |
| Catch card, constellation cards, sheltering caption | card | fishing, stargazing, storms | no | world-events §2.7 |
| Damage numbers | world (billboards) | hits | no | heroes.md §2.5.12 |
| Lantern beams, base rings, world labels, nameplates, HP bars | world | quest state, events, elites, guardians, the frog, multiplayer | no | npcs.md §2.6.1, enemies.md §5 (rules); this file (render) |
| Selection ring, downed and revive rings | world (decals) | always / downed | no | heroes.md §2.7.5, §2.5.12 |
| Dev console | DOM panel | `Ctrl+Shift+D`, five taps | yes | this file |

**Typefaces.** Two families, both SIL Open Font License 1.1, bundled as variable `woff2` in `assets/fonts/` with the licence text in `assets/LICENSES.md`; the render engineer verifies the licence files and the variable-axis shapes at a Rule 2 gate before bundling. No CDN, no system fallback in the archive build.

| Family | Files (Latin subset) | Licence | Role | Why it fits this family's scrapbook |
|---|---|---|---|---|
| **Nunito** (Vernon Adams, Cyreal; variable weight 200–1000, roman + italic) | `Nunito[wght].woff2`, `Nunito-Italic[wght].woff2`, ≈ 110 KB each | SIL OFL 1.1 | Everything the player reads at a glance: HUD, chips, prompts, body text, buttons, settings, damage-number atlas | Rounded terminals with a straight spine: it reads at 12 px on a phone and its roundness rhymes with flat-shaded low-poly edges without going toy-font. It is warm and plain, like a label a parent writes on a lunchbox |
| **Lora** (Cyreal, Olga Karpushina; variable weight 400–700, roman + italic) | `Lora[wght].woff2`, `Lora-Italic[wght].woff2`, ≈ 95 KB each | SIL OFL 1.1 | Title cards, page titles, boss and card names, achievement names; **Lora Italic** is the handwritten-feel caption face | A serif with brushed curves: the roman is a quiet book face for `Stewart Camp` and `The Hollow Grove`; the italic has enough pen in it to read as a caption written under a photo, which is the one place the brief asks for a handwritten feel, without a third "handwriting" family that would read as a template |
| Icon set: **Noto Emoji** (monochrome), subset to the 74 glyphs the canon strings use | `NotoEmoji-Subset.woff2`, ≈ 30 KB | SIL OFL 1.1 | The leading glyph of every canon string that has one (`👥`, `⚡`, `🔴`, `📦` …), tinted to the text colour | Not a text family; it is the icon set delivered as glyphs so the stored strings stay intact (§2.1.5). OS colour emoji would be non-deterministic in 2045 and would look pasted over a flat-shaded world |

Rejected: Fredoka, Baloo (chunky rounded; the "template kids' game" look), Quicksand (too light under 14 px), Fraunces (its wonk is charming but 250 KB per style and it wobbles at caption size), a dedicated handwriting font such as Caveat (a third family, and every kids' app uses one).

### 2.1 Foundations

#### 2.1.1 The two worlds rule

Two surfaces, two palettes, never mixed:

- **Lantern light over the night (HUD, cards, prompts, dialogue).** Cream text on navy glass, warm light rings, the v27 identity (AR §17.1: warm accent over cool ground). Chips are `ui.night` glass with no `backdrop-filter` below the High preset.
- **Ink on paper (every page).** Warm paper, warm near-black ink, photo corners, one island accent. Nothing glows on paper; the accent is ink and stamp colour.

#### 2.1.2 Tokens (for `src/style/ui.ts`)

| Token | Hex / value | Use |
|---|---|---|
| `ui.paper` | `#F3E9D7` | page base |
| `ui.paperShade` | `#E6D8BF` | page edge gradient, photo-corner slot, disabled fills |
| `ui.paperDeep` | `#D9C8A6` | tab backs, the closed cover |
| `ui.ink` | `#2B2118` | body text and lines on paper (never `#000`) |
| `ui.inkSoft` | `#6B5A48` | secondary text on paper |
| `ui.inkFaint` | `#A8977F` | disabled, dividers (structural only), placeholder |
| `ui.pencil` | `#8C8070` | unexplored map outlines, ruled lines under captions |
| `ui.cream` | `#FFF5E6` | HUD primary text (v27 `--text-main`) |
| `ui.creamSoft` | `#D4C4A8` | HUD secondary (v27 `--text-sec`) |
| `ui.creamDim` | `#998A72` | HUD tertiary (v27 `--text-dim`) |
| `ui.night` | `rgba(11,14,26,0.55)` | HUD chip backing (v27 `--bg-0` at alpha) |
| `ui.nightDeep` | `rgba(11,14,26,0.93)` | dialogue box, dim behind pages (v27 `--dark-bg`) |
| `ui.gold` | `#E8A838` | canon-coloured strings, default announce, the crest's gold, rarity legendary |
| `ui.hp.low` | `#E85D5D` | ring and bar colour under 25 % (v27 `--hp-red`) |
| `ui.hp.mid` | `#F0B840` | 25–50 % tint on bars only (v27 `--hp-yellow`) |
| `ui.xp` | `#A07BDC` | XP arcs and bars (v27 `--xp-purple`) |
| `ui.heal` | `#3DCC7A` | heal numbers, turn-in, `✓` |
| `ui.hurt` | `#D84830` | damage taken numbers, danger chips |
| `ui.accent.forest` / `ui.accentGlow.forest` | `#B8863B` / `#E8A838` | ink accent on paper / light accent on the HUD (v27 forest accent kept as the glow) |
| `ui.accent.cave` / glow | `#6A5BA8` / `#8B7BCC` | Crystal Caves under-region (v27 cave accent as glow) |
| `ui.accent.desert` / glow | `#B3541E` / `#D9A441` | Brief sienna / ochre |
| `ui.accent.bog` / glow | `#4E8A4A` / `#6CE87A` | moss ink / Brief phosphor |
| `ui.accent.frozen` / glow | `#3F6E9A` / `#8FD3F4` | slate ink / Brief ice blue |
| `ui.accent.shadow` / glow | `#7B3CA0` / `#3AF0FF` | v27 citadel violet / Brief rift cyan |
| `ui.accent.volcanic` / glow | `#B34A2A` / `#FF6A2A` | the Rift; Brief ember |
| `ui.rarity.*` | `#B0B0B0`, `#2DB86A`, `#4A9ED8`, `#A862C4`, `#E8A838` | `RARITY_COLS` verbatim (SI §23.5); ink variants darken 20 % on paper |
| `ui.player.p1…p4` | `#FFF5E6`, `#2EB8A6`, `#9BB53C`, `#8FD3F4` | multiplayer chips (§2.9.3); identity is the numbered badge, colour is secondary |
| `ui.announce.*` | see §2.4.9 | per-string announce colours |
| `ui.radius` | 10 px (chips 8 px, pages 14 px, key caps 5 px) | the scrapbook radius |
| `ui.shadow` | `0 2px 8px rgba(11,14,26,0.35)` | the only drop shadow; pages and toasts |

**Accent rule (Brief §4.2).** `ui.accent` and `ui.accentGlow` resolve to the active island's pair; the swap happens on landing and on entering the caves or the Rift, cross-fading over 1 s (v27 retinted every 1 s, AR §17.4). Inside a dungeon the accent is the dungeon's `DUNGEON_COLORS` hex as glow and its island ink as accent. In Home, Wrong the accent is `shadow`. Everything that reads "this is where you are" uses the accent: the active portrait ring's outer halo, tab highlights, page-title underlines (structural, one per page), prompt key caps, the compass strip's north tick, the title card's rule.

**Anti-palette check.** No pure black anywhere (`ui.ink`, `#0B0E1A` bars). No neon over the soft world: the brightest HUD colour is a hero `glow` token at ≤ 60 % alpha ring; rift cyan appears only in the Shadow Realm. No grey fog on grey ground: dim behind pages is navy, not grey. No pastel: the paper is warm cream against warm near-black ink at 9.3:1 contrast. No default engine: no system font reaches the archive build. No template: no gradient buttons, no `btnPulse`, no `heroBob`, no tracked eyebrows, no decorative dividers.

#### 2.1.3 Typography scale

Sizes are px at 1920 × 1080 / at 390 × 844; the text-scale setting multiplies both (§2.7). Sentence case everywhere; letter-spacing 0 (boss and title names 0.01 em); line-height 1.4 body, 1.15 titles. All-caps appears only where the canon string is all-caps.

| Role | Face | Size | Colour |
|---|---|---|---|
| Title card name | Lora 600 | 36 / 26 | `ui.cream` |
| Title card line | Lora 400 italic | 18 / 14 | `ui.creamSoft` |
| Page title | Lora 700 | 30 / 22 | `ui.ink` |
| Section head | Nunito 800 | 15 / 13 | `ui.ink` |
| Body | Nunito 500 | 16 / 14 | `ui.ink` |
| Caption (handwritten feel) | Lora 400 italic, rotated −1° on photo captions only | 15 / 13 | `ui.inkSoft` |
| Button | Nunito 700 | 16 / 15 | `ui.ink` on `ui.paperShade`; primary: `ui.paper` on `ui.accent` |
| HUD name | Nunito 800 | 15 / 12 | `ui.cream` |
| HUD number | Nunito 700 tabular | 14 / 11 | `ui.cream` |
| Chip | Nunito 700 | 13 / 11 | `ui.creamSoft` |
| Prompt verb | Nunito 700 | 15 / 14 | `ui.cream` |
| Key cap | Nunito 800 | 12 / 11 | `ui.ink` on `ui.cream` |
| Announce | Nunito 800 | 28 / 20 | per string, glow `0 0 12px` same colour |
| Quest notification | Nunito 700 | 13 / 12 | per string |
| Boss name (card and bar) | Lora 700 | 30 / 20 card, 20 / 15 bar | card colour |
| Dialogue speaker | Nunito 800 | 15 / 13 | speaker colour |
| Dialogue body | Nunito 500 | 17 / 15 | `ui.cream` |
| Damage number | Nunito 900 (atlas) | `clamp(16 + floor(n/20)·2, 16, 32)` world-scaled | heroes.md §2.5.12 |
| Nameplate / world label | Nunito 800 | 13 / 11 (billboard, distance-faded) | per owner |
| Dev console | Nunito 500 monospaced digits | 13 | `#E8A838` on `#0B0E1A` |

#### 2.1.4 Copy voice

Plain verbs. Buttons say what they do (`Save`, `Fly`, `Stay`, `Keep it`). Sentence case except canon. Errors and empty states give direction, in the family's voice, never a shrug: not "No items" but `Nothing in the pack yet. Goblins drop things.` The family's voice is Ed's deflection and the kids' deadpan; new lines borrow it lightly and never claim a fact about a real person (Brief §2(b)). Every new string is in §2.5.3, marked **[new text]**.

#### 2.1.5 The emoji rule (decided once)

The stored string is always the canon string, emoji included. At render, the **leading** emoji of a string is drawn with the bundled monochrome Noto Emoji subset, tinted to the string's colour, at 1.1 em. Emoji inside a string (`⚔️ BOUNTY BOARD ⚔️`, `⚡ <name>! ⚡`) render the same way in place. No string is rewritten and no emoji is stripped; a test asserts every emoji used by `src/content/canon/` is in the subset. Fallback if the subset gate fails at Rule 2: the system colour emoji font, which is what v27 shipped.

### 2.2 The scrapbook

#### 2.2.1 Page anatomy

A book, open, on a dimmed world (`ui.nightDeep` at 55 % plus a 4 px blur on High and Ultra only). At 1920 × 1080 the spread is 1400 × 900, centred, two pages of 680 × 860 with a 40 px gutter; the world stays visible and alive around it (§2.2.7). At 390 × 844 it is a single page filling the safe area, tabs along the bottom.

| Element | Recipe |
|---|---|
| Paper | `ui.paper` base; a **128 × 128 grayscale noise PNG** (`assets/ui/paper-grain.png`, ≈ 2 KB, CC0, generated in-repo) tiled at 8 % opacity in `mix-blend-mode: multiply`; two linear gradients darkening the outer edges 6 % and the gutter 10 %; `ui.shadow`; corners `ui.radius` 14 px. No `feTurbulence`: SVG filters re-render on every transform and cost 4–8 ms on a phone during the page-turn |
| Photo corners | four CSS pseudo-element triangles, 18 px, `ui.ink` at 60 %, on every image-bearing card (bestiary, memories, saves, photos, the destination map) |
| Captions | Lora Italic, `ui.inkSoft`, under a photo, rotated −1°, a `ui.pencil` ruled line beneath at 30 % |
| Stamps | the island accent at 85 % with a 1.5 px rough edge (`border-image` from a 64 × 64 stamp-edge PNG, ≈ 1 KB): home-island stamps on bestiary cards, `✔ COMPLETED` on quests, the crest at its level |
| Tabs | index tabs sticking out of the left page edge (desktop) or a bottom strip (mobile), `ui.paperDeep`, the active tab `ui.accent` with `ui.paper` text; 44 px minimum |
| Title | Lora 700 with a single `ui.accent` underline rule 2 px, the page's only rule |
| Footer | the canon close string for the page (`Press T to close`, `Press I to close • 💰 N`, `Press J to close  •  N/15 completed`, `Press B to close`, `Press P or ESC to resume`) rendered from the live binding; on pad `Press B to close` reads `Press ◯ to close` (glyph, not letter) |
| Crest | the pause page's top-left corner, 96 px, at `crest.level` (§2.10) |

#### 2.2.2 The page set and tab order

| # | Tab | Hotkey | Pad | What is on it |
|---|---|---|---|---|
| 1 | Pause (the index) | `P` / `Esc` | Menu | crest, `PAUSED`, buttons `Resume` **[new text]**, `Controls`, `Stats`, `💾 Save & Load`, `⚙️ SETTINGS`, `Photo mode` **[new text]**, `🏃 RETREAT FROM DUNGEON` (in a dungeon), `🏠 RETURN TO TITLE`; `Controls` and `Stats` expand in place (§2.3.1) |
| 2 | Squad | `T` | — | skill trees, one kid per sub-tab (§2.3.2) |
| 3 | Pack | `I` | — | gear and stash (§2.3.3) |
| 4 | Quests | `J` | — | journal (§2.3.4) |
| 5 | Map | `N` **[new bind]** | View (tap) | the island as paper, the destination card at the plane (§2.3.5) |
| 6 | Bestiary | `B` | — | photo-corner cards (§2.3.6) |
| 7 | Memories | — | — | collectibles, markers, lore, photos (§2.3.7) |
| 8 | Achievements | — | — | 31 + `Gone Fishin'` (§2.3.8) |
| 9 | Fish | — | — | the catch pages (§2.3.9) |
| 10 | Pets | — | — | the fox, Sugar, the hens (§2.3.10) |
| 11 | Log | — | — | the dialogue log (§2.3.11) |
| 12 | Settings | — | — | §2.7, with Controls remap (§2.6.4) |
| 13 | Saves | — | — | §2.9.1 |

Direct hotkeys open the book on that tab (CM §12 "KEEP"); pressing the same key or `Esc` closes it. Inside the book: `LB` / `RB` and `Q` / `E` flip tabs (the combat binds are inert while a page is open), D-pad and arrows move focus, `A` / Enter / Space activate, `B` / `Esc` close, `Y` / `F` is the page's secondary action (sell, equip, track). Focus is a 2 px `ui.accent` ring with 4 px offset; every focusable element is ≥ 44 px; the mouse hovers the same ring. Tab order is document order; the first focusable element on a page is its first interactive card.

#### 2.2.3 The one page-turn

Every tab change, and every transient page that replaces another, uses the same 0.35 s turn: the outgoing right page rotates about the spine (`transform: rotateY(0 → −180deg)`, `perspective: 1600px`, `transform-origin: left center`), its backface is `ui.paperDeep`, and at 50 % the incoming page is already under it; the left page cross-fades its tab highlight in the same 0.35 s; easing `cubic-bezier(0.4, 0, 0.2, 1)`; sound `ui.page` (audio.md). On mobile the single page turns the same way about its left edge. Opening the book is a 0.3 s fade with `scale(0.96 → 1)` (v27 `fadeIn`); closing 0.2 s (v27 `hideOverlayEl`). Reduced motion: 0.2 s cross-fade for all three. Nothing else animates on a page except focus rings, the crest's build (§2.10) and cooldown arcs mirrored from the HUD.

#### 2.2.4 What a page never does

No `backdrop-filter` under High, no pulsing glows, no bobbing cards, no `shimmer` strips, no dividers as decoration, no all-caps section heads, no scroll-jack. Long lists scroll inside the page with a 2 px `ui.pencil` scrollbar.

#### 2.2.5 Sim pause rule

Any full page pauses the sim (CM §12: one rule; v27's bestiary exception goes). The render clock keeps running: tree sway, water, cloth, the torch and fire oscillators, particles already alive (no new emission), the biplane if airborne (its motion is presentation-side; it lands only when the sim resumes). Companions' idle ladder pauses with the sim. Multiplayer: the host's page pauses the sim and every guest sees `⏸ GAME PAUSED` / `Waiting for host to resume...`; a guest's page does not pause anyone and overlays a live sim.

#### 2.2.6 Transient pages

Level-up, merchant, bounty board, dungeon entry, dungeon cleared / failed / retreat, victory stats, victory and game over are pages without a tab: they open with the book-open fade, show no tab strip, and close to the world (or to the next transient page with the page-turn). `Esc` / `B` on a transient page is the page's cancel button where one exists (dungeon entry `CANCEL`, merchant `CLOSE`, bounty `CLOSE`); level-up, victory and game over have no cancel.

#### 2.2.7 The world behind the book

The book never fills the screen on desktop: 26 % of the frame's width stays world on each side, dimmed, alive. It is the reason a kid pauses at golden hour and leaves the menu open: the diorama keeps breathing behind the page.

### 2.3 The pages, one by one

Every page lists its canon strings verbatim (FC §12 unless cited otherwise); text in **[new text]** is this file's.

#### 2.3.1 Pause (the index)

Left page: the crest at `crest.level`, `PAUSED` (Lora 700, canon), a caption under it in Lora Italic: the current island's title-card line. Right page: the buttons in §2.2.2 order, 56 px tall, full width. `Controls` expands into the canon pause list (FC §12.4) rendered from the live bindings: `WASD / Arrows` → `Move`, `Click / Tap` → `Attack`, `Space` → `Interact / Accept Quest`, `E` → `Signature Ability`, `Q` → `Combo Ultimate`, `G` → `Quest Compass`, `1-4` → `Switch Hero`, `T` → `Skill Tree`, `I` → `Inventory`, `J` → `Quest Journal`, `P / ESC` → `Pause`, plus the new rows `Shift` → `Dodge` **[new text]**, `Tab` → `Lock on` **[new text]**, `V` → `Emotes` **[new text]**, `Z / C` → `Turn camera` **[new text]**, `N` → `Map` **[new text]**, `H` → `Photo mode` **[new text]**; the `C` → `Control Mode` row is cut with the modes (§2.6.1). On pad the left column shows button glyphs. `Stats` expands into the canon canvas-pause lines `Time: M:SS   Kills: N   Level: N` and `Difficulty: X   Active Hero: Y`; the `Endless Wave: N   Score: N` line is cut with endless. `🏠 RETURN TO TITLE` opens the canon confirm (§2.9.1). `🏃 RETREAT FROM DUNGEON` opens the `DUNGEON RETREAT` page (§2.3.15).

#### 2.3.2 Squad (skill trees)

`SKILL TREES` (canon) as the page title. Four sub-tabs, one per kid, each a portrait tile in the kid's `base` with the role label from heroes.md §2.2.1 (`Tank`, `Ranger`, `Mage`, `Whirlwind`) and `N points` **[new text]**. The three branches are three columns of paper cards: branch name (Lora 700 in the branch's v27 colour darkened 20 % for ink), Tier 1, Tier 2, then the capstone fork as two side-by-side cards joined by a pencil `Y`; every node name and description is FC §11.10 verbatim. A taken node is stamped (`✔` in the accent); a takeable node has a 44 px `Take` **[new text]** button; a capstone shows `Choose` **[new text]** on both and locks the other once chosen. `⚡ Invest All (N)` (canon) sits under the columns and skips capstones (SI §10.3). `investSkill` and `chooseCapstone` are the heroes.md §2.5.10 baseline recompute. Sound `equip` 0.3 (v27). Footer `Press T to close`.

#### 2.3.3 Pack (inventory and gear)

`⚔️ INVENTORY` (canon) with the footer `Press I to close • 💰 N`. Left page: the active kid's three slots (`weapon`, `armor`, `accessory`) as photo-corner cards with the item's canon icon (Noto subset), display name (`★ ` prefix and `RARITY_PREFIXES` verbatim, SI §23.6), rarity as the card's border in `ui.rarity`, and `getStatDesc()` lines; a portrait row swaps the kid. Right page: `STASH` (canon) as a 4 × 5 grid (20 = `STASH_MAX`), sort chips `By Slot` / `By Rarity` (canon), a `💰 Drag here to sell` (canon) tray at the bottom that shows the sell value on hover, and hero-locked items greyed with `<HERO> only` **[new text]**. Drag-and-drop on mouse and touch; on pad, `A` picks up and `A` again drops, `Y` sells. Empty stash: `Nothing in the pack yet. Goblins drop things.` **[new text]**. `No equipment` (canon) appears in an empty slot card. `SKINS` (canon) is a third sub-page: sixteen `HERO_SKINS` names verbatim, locked ones with the canon ` (Locked)` suffix and the unlock rule in a caption. The `EQUIPMENT` / `Press I to close` canvas variant is superseded by this page (cut, §2.5.2).

#### 2.3.4 Quests

`📜 QUEST JOURNAL` with the footer `Press J to close  •  N/15 completed` (canon, two spaces). Sections in canon order and wording: `🟡 ACTIVE`, `✅ READY TO TURN IN`, `🔵 AVAILABLE`, `✔ COMPLETED`, each a stack of cards: title (Lora 700), description, `progress/target`, the hint in Lora Italic, the reward line, the giver's name in their `ui` colour with the island stamp. The `✓` / `!` / `...` glyphs (FC §4.2) sit on the card's corner as the v27 marker language. A `Track` **[new text]** button pins the quest to the HUD tracker (§2.4.6); the active cap is 4 (story-beats). Bounties from every board show under `🔵 AVAILABLE` as `Bounty:` cards with `progress/target`; claiming still happens at a board. Empty active: `No quests yet. Find someone with a lantern over their head.` **[new text]**.

#### 2.3.5 Map and the destination card

**The map.** The island drawn as paper: a pencil outline of the coast in `ui.pencil` from the start; everywhere the active hero has been within `world.vis.radius` (world-events §2.2.5) is **inked** permanently (a coverage mask, 2 m cells, saved as a bitfield per island); inked ground shows the island's four ground tones at 40 % as flat watercolour patches, roads as ink lines, water in `#2EB8A6` at 50 %, discovered landmarks as small drawn icons with their canon names in Lora Italic (dungeon entrances, the hubs, guide posts, boards, the plane, cairns, the crater, guardian sites once woken, camps A–C once seen). Unexplored paper is unlit: plain `ui.paper` with the pencil coast. The party is a cluster of four dots in `base` colours; the camera yaw is a small wedge. Quest, event and objective markers use the compass-pip icons (§2.4.5). Zoom by wheel or pinch between 1× (whole island) and 3×. `Minimap` (canon setting) toggles only the dungeon paper minimap; the map page is always available.

**The destination card** (npcs.md §2.3.3, contents verbatim from that file). Opens from the plane's `Fly` prompt as the right page over the sky map: `Where to?` **[new text]**; rows in the ladder order `Enchanted Forest`, `Frozen Peaks`, `Murky Swamp`, `Scorching Sands` with the canon name, the island's title-card line, the guide's name, `N open quests` **[new text]**, the current weather glyph; locked rows greyed with `Needs the propeller` / `Needs the rudder` / `Needs the spark plug` **[new text]**; the current row `You are here` **[new text]**; the plane-state note under the header (`She'll hop. Probably.` / `Steadier. Still no rudder.` / `She'll turn now.` **[new text]**, none when repaired); buttons `Fly` (primary) and `Stay` **[new text]**. The sky map draws the islands as the sky-dome silhouettes (world-events §2.6), the current one circled in the accent, the plane icon on it; a dotted pencil arc previews the route on hover. `Press SPACE to skip` (canon, live-binding variant) appears 2 s into CS-04 on repeat flights.

#### 2.3.6 Bestiary

`📖 BOSS BESTIARY` (canon title; it now holds every card) with the footer `Press B to close`. Three sub-tabs: **Enemies** (the 17 types plus the `Goblin camp` place card and the `Elites` rule card, enemies.md §2.10: display name, lore line in Lora Italic, home-island stamp, `Seen N · Beaten N` **[new text]**, the canon names that reference it), **Guardians** (the four, with their canon subtitles), **Bosses** (the v27 set with `bossEncountered` / `bossDefeated`: `★ DEFEATED` / `⚔ ENCOUNTERED` / `???` / `Not yet encountered`, canon). An unseen entry is a photo-corner frame with a pencil silhouette and `???`. The photo is a 256 px render of the rig into the portrait atlas at load (npcs.md §2.1.7's method), so the card shows the thing the kid fought. Boss card text uses the boss's card colour darkened 20 % for ink; the Queen's `#A862C4` question is a HUD question, resolved in §2.4.7.

#### 2.3.7 Memories

The Brief's memory collectibles (Phase 4), the porch shelf's index. Four sub-tabs: **Kept things** (the shelf roster: `Aviator Goggles` (npcs.md), a propeller shaving, a fallen-star shard (`star shard · N` count, world-events), the waterlogged photograph (`memory.shadowPhoto`), the first migration (`memory.migration`), the wave at Ed (`wavedAtEd`, optional), each a photo-corner card with a Lora Italic caption; unfound ones are pencil outlines), **Found writing** (the three `FLAVOR_MARKERS`, the five `loreTexts`, the five `CRATER_FLAVOR` lines, verbatim, each stamped with where), **Photos** (photo mode's saved pictures, §2.11), **Constellations** (the five names with their line drawings once seen from the fire). Empty: `Nothing kept yet. Look for a glowing ? in the grass.` **[new text]**.

#### 2.3.8 Achievements

Thirty-one canon entries plus `Gone Fishin'` — `Catch one of every fish` **[new text]** (world-events). Each is a stamp-style card: icon, name (Lora 700), description; done cards in the accent, undone in `ui.inkFaint` with the description shown (nothing is hidden; kids like knowing what is left). Counter `N/32` in the title. The toast (§2.4.10) is the same card, smaller.

#### 2.3.9 Fish

One photo-corner card per species from world-events §2.7.2's catch table: name, island stamp, best length, count, the tell (`Golden hour only` and so on as captions **[new text]**, one per gated species); the junk row shows its canon-style caption (`Someone's boot. Not Ed's. Probably.`). Uncaught species are pencil fish. The catch card (§2.4.14) is this card at HUD size.

#### 2.3.10 Pets

Three cards from camp.md §2.9: `Orange Meanie` (the fox; trust `N/5` as five paw stamps), `Sugar` (the slime), `The hens` **[new text]** (three unnamed). Each has a Lora Italic caption of where it sleeps and a `Since` date; the fox's card is the scrapbook card camp.md requested. Before any pet: `No pets yet. Something orange has been watching the fire.` **[new text]**.

#### 2.3.11 Dialogue log

Every delivered line (npcs.md §2.11), newest last, grouped by day of play with the speaker's name in their colour and the portrait frame at 40 px; canon lines verbatim, party lines under the beat that fired them; a `Find` field filters by speaker. Skipped blocks are marked `(skipped)` **[new text]** so a skipped `crater_awareness` can be read.

#### 2.3.12 Level-up

`LEVEL UP!` with the subtitle `Choose an upgrade (click or press 1/2/3)` (canon; on pad the live-binding variant reads `Choose an upgrade (◯ ▢ △)`, on touch `Choose an upgrade (tap)`; the keyboard string is the canon one). Three paper cards 280 × 380 px (mobile: stacked, 44 px minimum), each with its canon badge (`⭐ SKILL POINT`, `🛡 TEAM BUFF`, `⚔ HERO SPEC`), icon, name and description verbatim (FC §11.11), the rarity as a stamp, and `ALL HEROES` or the hero's portrait. `1` / `2` / `3` select as v27. Multiplayer guests see `Host is choosing — click to vote!` (canon) and their vote is a stamp on the card. The flash and burst in the world are AR §9's.

#### 2.3.13 Merchant and bounty board

**Merchant:** `🧙 MERCHANT` / `Rare goods from distant lands` / `CLOSE` (canon). Four stock cards (`MERCHANT_STOCK` names, descriptions, costs verbatim), `⬤ Ng` at the top right, `Buy` **[new text]** on each card (greyed with `Not enough gold` **[new text]** in the caption); a `Sell` sub-tab lists the stash with sell values and fish. Purchase strings on the announce channel as v27 (`<item> activated!`, `All heroes healed!`, `+N XP!`, `Rally!`, `Lucky Charm equipped!`, `Merchant sold out!`). **Bounty board:** `⚔️ BOUNTY BOARD ⚔️` / `Complete bounties for gold & XP` (canon), three cards (`BOUNTY_POOL` names and descriptions verbatim) with `progress/target`, `⚔️ CLAIM REWARD` when complete, `✓ Claimed` after, `CLOSE`. Both open on the interact prompt within 2 m and pause.

#### 2.3.14 Dungeon entry

The dungeon name (Lora 700 in `DUNGEON_COLORS[biome]` darkened for ink), the subtitle `<BIOME> DUNGEON` (the v27 template, e.g. `FOREST DUNGEON`, kept), the canon description (`DUNGEON_DESCS`), a pencil sketch of the entrance, the party's four portraits with HP rings, and `⚔️ ENTER` / `CANCEL` (canon). `Esc` cancels with the 2 s re-entry cooldown (SI §11.5). The letterbox entry card that follows `ENTER` is bosses.md §2.3's grammar with `DUNGEON_NAMES[biome]` over `<BIOME> DUNGEON`; dungeons.md places it.

#### 2.3.15 Dungeon cleared, failed, retreat

Cleared: `<dungeon name> CLEARED!` with `The <biome> dungeon has been conquered!` (canon), stats `XP Earned` / `Rooms`, the `DUNGEON_EQUIPS` reward as a photo-corner card (name, icon, description verbatim), `🌍 RETURN TO OVERWORLD`. It follows the victory-stats page (§2.3.16) with a page-turn. Failed: `DUNGEON FAILED` / `The Stewart Squad couldn't clear <dungeon>...` / `Partial XP` / `🌍 RETURN TO OVERWORLD`. Retreat (from pause): `DUNGEON RETREAT` / `The Stewart Squad retreated from <dungeon>...`. `Loading dungeon...` (canon) is the streaming caption under the letterbox if a room set is not ready.

#### 2.3.16 Victory stats, victory, game over

**Victory stats:** `BATTLE COMPLETE!` (or the caller's title: `SHADOW QUEEN VANQUISHED!` / `The darkness has been defeated!`, `<name> CLEARED!` / `Per-hero combat breakdown`), a four-column table with the kids' portraits, rows `DMG Dealt` / `Kills` / `DMG Taken` / `Sig Uses` / `Ult Uses` / `Times Down` (canon), the `👑 ` prefix on the MVP column, `CONTINUE ▶`. Rows reveal top to bottom 0.05 s apart (v27 `cardPop`, the one staggered animation kept because it is a reveal, not decoration). **Victory (B3.5):** `VICTORY!` / `The Stewart Squad saved the realm!`, `★ THE SHADOW CITADEL HAS FALLEN ★` with its subtitle (`The ultimate darkness has been vanquished!`, or at NG+5 `The Stewart Squad has conquered every challenge! The realm is forever at peace.`), the four legendary lines `<hero> received <legendary>!`, then buttons `🌍 KEEP PLAYING`, `⚔️ NEW GAME + N`, `🔄 PLAY AGAIN`, `🏠 TITLE` (canon; `♾️ ENDLESS MODE` cut). `New Game+ unlocked!` is the announce at the Queen's death. **Game over:** `GAME OVER` / `The Stewart Squad has fallen...` / `TRY AGAIN` / `🏠 TITLE`; an explicit button, never "any click" (CM quirk 16). The King's wipe never reaches this page (bosses.md §2.6).

#### 2.3.17 The title screen

Over camp.md's station S5 (C6, golden hour, the plane crossing the Ridge, the 60 s dolly). Bottom-left, a single open page 560 × 640 (mobile: full width, bottom 60 %): the crest small above `⚔️ The Stewart Squad Adventure` (Lora 700 40 / 28 px) and `The world has stories to tell.` (Lora Italic); the version label becomes a build stamp `v1.0` **[new text]** (`— V27 — GEAR & UI` was a version string, not canon; five taps within 2 s still toggle `DEV_MODE` and the stamp reads `v1.0 · DEV MODE 🔧` **[new text]**); the four hero cards as portraits with names and role labels (`Liam` `Tank`, `Noah` `Ranger`, `Collette` `Mage`, `Isabella` `Whirlwind`), still, no bob; difficulty chips `☀️ Easy` / `⚔️ Normal` / `💀 Hard`; `START ADVENTURE` (primary); the three save slots as small cards with `Continue` **[new text]** on the newest; `⚙️ Settings`; `🤝 Multiplayer (LAN Co-op)` as a fold-out (§2.9.3); one tip from the story-aware rotation in Lora Italic at the bottom (`#titleTip`, story-beats: tips 1–8 from the start, 9–11 after `meteor_seen`, 12 after `ed_crater_dialogue`). The thirty feature chips are cut (§2.5.2). Loading (≤ 5 s, Brief §7.4): the same page with a photo-corner render of the camp from station S1 at the save's stage and clock (a cached 640 × 360 JPEG captured at the last save; the first boot uses a bundled C1 render) and a tip beneath; the `shimmer` strip is cut.

### 2.4 The HUD

#### 2.4.1 Layouts and the safe-area rule

All HUD elements are corner-anchored DOM, positioned with `inset` from `env(safe-area-inset-*)` plus a margin; nothing is centred by absolute pixels except the announce channel, the boss bar and the tutorial bar, which centre horizontally. Sizes below are px at 1920 × 1080 / at 390 × 844 portrait; landscape phones (844 × 390) use the desktop anchors at the mobile sizes.

| Anchor | 1920 × 1080 | 390 × 844 | Contents |
|---|---|---|---|
| Top-left | margin 24, cluster 320 × 150 | margin 12, cluster 200 × 96 | party strip (§2.4.2), ability icons (§2.4.3) |
| Top-centre | 768 wide (40 %), top 18 | 300 wide, top 10 | boss bar (§2.4.7); announce channel at 18 % of height (§2.4.9) |
| Top-right | margin 24, 320 × 28 strip, chips below | margin 12, 200 × 22 strip | compass strip (§2.4.5), chips (§2.4.4), quest tracker (§2.4.6), mechanic meter (§2.4.13) |
| Bottom-left | margin 24 | joystick zone | prompts (§2.4.12); on touch, the floating joystick |
| Bottom-centre | 1080 wide max | full width | tutorial bar (`H − 65`), quest notifications (`H − 80` up), dialogue box (§2.4.11) |
| Bottom-right | margin 24 | touch cluster | achievement toasts (§2.4.10); dungeon paper minimap (§2.4.13); on touch, the action cluster; photo prompt |

Safe-area rule: every anchor is `max(margin, env(safe-area-inset-side) + 8px)`; touch controls add 12 px more. The HUD never overlaps the letterbox bars (bars sit at `z` 55, HUD at 40, pages at 60, dialogue 50, announce 45, dev console 99999 as v27).

**Idle fade (Brief §6).** The party strip, ability icons, compass strip, chips and quest tracker fade to 35 % over 0.6 s after 6 s with no damage dealt or taken, no cooldown running, no prompt, no page and no input except movement and camera; any of those restores 100 % in 0.15 s. Never fades: boss bar, cage and kidnap sub-bars, prompts, dialogue, announce, notifications, toasts, the tutorial bar, touch controls (which dim to 60 % only, as v27's 0.3 / 0.6 alpha did).

#### 2.4.2 Portraits and light rings

Four circular portraits from the atlas (npcs.md §2.1.7, the kids' `neutral` frame; `grit` under 25 % HP; `bright` for 1.5 s on a level-up), left to right in hero index order. The active portrait is 80 / 56 px, companions 56 / 40 px, pitch 96 / 64 px. Around each: a **light ring** 6 / 4 px in the kid's `glow` token drawn as a conic arc from 12 o'clock clockwise for `hp / maxHp`, on a `ui.night` track; the ring has a soft outer halo (`box-shadow 0 0 10px glow at 45 %`), and under 25 % HP the ring recolours to `ui.hp.low` and pulses at 0.8 s (v27 `hpPulse`). The active portrait adds a second, outer halo 2 px in `ui.accentGlow` (the v27 biome-accented border). Inside the ring's bottom: an **ult ember**, a 10 / 7 px dot filling from `ui.creamDim` to `ui.xp` as `1 − ultTimer / ultMax`, which flares to a small `⚡` glyph when ready. Under each portrait: the kid's name (Nunito 800, `base`), and under the active one `Lv N` (`teamLv`) and the mastery title (`Novice` … `Mythic`, canon, `ui.creamDim`). States: locked = a `?` on a `ui.night` disc at 40 % (canon glyph); downed = the portrait desaturated with the 20 s revive countdown as a `ui.heal` arc replacing the ring; caged = §2.4.8; multiplayer = the `PN` badge (§2.9.3). Click or tap swaps (guests send a request); `1`–`4` and the pad map do the same.

The v27 name plate `<FullName> Lv<teamLv>`, the 200 px HP bar with `ceil(hp) / maxHp` and the XP bar with `Lv<N> XP` collapse into the rings; the numbers survive on the Squad page and, for the active hero, as a `hp / maxHp` chip that appears under the portrait only while HP is below 50 % or for 2 s after damage (the kid who wants numbers gets them when they matter). XP is a thin `ui.xp` arc inside the active ring's track, 2 px, reset on level-up with the AR §9.2 burst in the world.

#### 2.4.3 Ability icons and cooldown arcs

Three 44 / 40 px icons under the active portrait: **Signature**, **Ultimate**, **Combo**. Each is a `ui.night` disc with a drawn white line icon (a shield arc, a bow, a staff-and-orb, a hammer for signatures; a starburst for ultimates; two linked rings for the combo; one SVG sprite, 12 symbols) and a cooldown sweep: a conic mask in `ui.night` at 70 % that unwinds clockwise as the timer runs, the remaining seconds in Nunito 700 tabular at the centre while cooling (`(Ns)` as v27's suffix). Ready state: the disc's rim lights in the kid's `glow` at 60 % and the label above reads the canon string from the live binding: `⚡ Shield Bash [E]` (the v27 template `⚡ <sigNm> [E]`; cooling: `Shield Bash [E] (Ns)` at 50 % opacity, as v27) and `⚡ ULTIMATE READY — R` (the v27 template with the live key; `SPACE` is never printed unless Space is bound to ultimate). The combo icon appears only when a partner is legal (both charged, within 2.5 m) and pulses at `0.7 + 0.3·sin(6t)` in the pair's combo colour (v27, kept) with `⚡ <comboName> — Q` (the v27 template `⚡ COMBO — Q` with the pair's name, live key). On touch the three icons *are* the buttons (§2.6.3). The Dodge has no icon: its 0.5 s recovery is a thin arc on the active ring's outer edge, and its prompt is the word `Dodge` beside the dodge button on touch only.

#### 2.4.4 Chips

Small `ui.night` pills, Nunito 700 13 / 11 px, in one row under the compass strip (wrapping to two rows at text scale 130 %), left to right: clock glyph (`☀️` day, `🌅` dawn and dusk, `🌙` night; canon glyphs, Noto subset), the weather chip (the v27 label: `Rain`, `Storm`, `Snow`, `Sandstorm`, `Fog`, plus `Blizzard`, `Ashfall`, `Riftstorm` **[new text]** for world-events' new types; hidden when clear), the `XP +50%` badge (canon; night only, `ui.xp`), `⬤ Ng` (canon gold chip, `ui.gold`), `👥 Siblings: N/3` (canon; shown until `squadAssembled`, then folds away with a 0.3 s collapse), `Wave N` (canon; the camp wave tick from enemies.md; shown for 4 s after each tick, then folds), difficulty (`Easy` / `Normal` / `Hard` with the v27 classes; shown for 4 s after load and on the pause page thereafter), `NG+N` (canon, hidden at 0), `🔧 DEV` (canon, dev mode only). The `HYBRID` control-mode chip is cut with the modes.

#### 2.4.5 The compass strip

Replaces the minimap (Brief §6) and the v27 edge arrow. A 320 × 28 / 200 × 22 px `ui.night` band, top-right, showing a 180° window of headings relative to the camera yaw: `N` `E` `S` `W` in Nunito 800 with minor ticks every 15°, the north tick in `ui.accentGlow`. **Pips** sit on the band at their bearing, sized by priority: the primary objective (story-beats §4 order: turn-in → cages → quest items → Ed with an offer → the plane when an unlocked island has an open quest → escort → waypoints → living mini-bosses → uncleared dungeon → the King → the portal → the rift) is 14 px with its distance in metres beneath (`32 m`), the rest 8 px. Pip icons are the same SVG sprite as the map page: a lantern for offers and turn-ins (in `beam.offer` / `beam.turnIn`), a cage, a quest-item diamond, Ed's goggles, the plane, the frog, a cairn, a skull for guardians, an arch for dungeons, a crown for the King, a ring for the portal, a flame for the rift; world events add the cart (gold), the spring (green), the merchant (violet), a fallen star (blue-white), the lantern (amber), the herd (cream), the treasure goblin (gold dot) in their beam colours; `questRewards.mapEnemies` adds red enemy dots within `vis.radius` (enemies.md); multiplayer partners are their `PN` badges. Pips beyond the 180° window clamp to the band's ends at 60 % alpha. Within 3 m of the primary objective the strip's pip and the beam dim to 30 % (the v27 300 px fade and 50 px hide, scaled). `G` toggles the strip with the canon announce `Compass: ON` / `Compass: OFF`. Reveal rule: objective pips are always shown (they are the compass); event and enemy pips only within `vis.radius × 4`; the map page's ink is the `vis.radius` reveal (§2.3.5).

#### 2.4.6 Quest tracker

Under the chips, one line: the tracked quest's title (Lora 700 13 px, `ui.gold`) and `progress/target` or the hint (Lora Italic 12 px), 280 px wide, `ui.night`. Click or tap cycles through active quests (v27 behaviour); the Quests page's `Track` sets it. Hidden in dungeons (v27) and while a boss is up.

#### 2.4.7 Boss bar (bosses.md §2.4, adopted whole)

Rendered exactly as bosses.md §2.4 specifies; restated here only where this file adds a value. One bar, top centre, 40 % of viewport width, 14 / 10 px tall, radius 7 px, fading in over 0.5 s as the intro's bars leave. Name left-aligned above in Lora 700 in the card colour, canon casing; the phase tag after the name (`— Phase N`, the v27 mini-boss shape, Nunito 700 `ui.creamSoft`). Fill in the card colour over `#0B0E1A`; a 0.3 s lagging pale ghost (`ui.cream` at 35 %). Phase pips: 10 px diamonds on the bar at the thresholds, hollow (`ui.cream` 1.5 px) until crossed, then filled and pulsed once (scale 1 → 1.4 → 1 over 0.4 s). Enrage: the rim pulses `#FF5050` at 2 Hz and an ember glyph follows the name. Shield pools: an ice-white `#F2F7FF` overlay segment; the cocoon: a closed-lid state (the trough darkens, `IMMUNE` in Nunito 700 small size, not small caps: 11 px, the one allowed exception to the case rule because the canon float is `IMMUNE!`). Titan plates: four 8 px plate pips under the bar labelled `N S E W`. Milestone announces in their v27 colours. **The Queen's card colour check (bosses.md §5.3 item 9):** at the finale Collette's portrait ring is `#E08CF0` and the Queen's bar and card are `#A862C4`; at 80 px and 768 px apart they do not fight, but the kidnap sub-bar targets a portrait, so when the kidnap target is Collette the Queen's bar text darkens to `#7B3CA0` (her v27 P1 bar colour) for the 4 s. Mini-bosses never use this bar (§2.4.15).

#### 2.4.8 The captured-hero overlay, the cage sub-bar, the kidnap bar

Reads `boss.cage.state { active, exposed, exposeTimer, hp, maxHp, captured: idx[] }` every render frame (bosses.md §2.6.3).

| Element | Rule |
|---|---|
| Captured portraits | `filter: grayscale(0.6) brightness(0.7)` (v27 values) plus a bars overlay (three vertical `boss.cage.iron` lines) and the ring frozen at its last value; a small `🔒` is not used (nothing new); **restored on release** with a 0.3 s cross-fade and a `glow` flash (v27 never restored them) |
| Cage sub-bar | 60 % of the boss bar's width, 8 px, `ui.gold` fill over `#0B0E1A`, centred under the boss bar with a 6 px gap; caption Nunito 700 12 px in `ui.gold`: `CAGE — HIT NOW!  [N captured]` while exposed, `CAGE  [N captured]` otherwise (canon, two spaces); while exposed the sub-bar's rim pulses at 4 Hz and `exposeTimer` drains as a thin `ui.cream` line under it |
| World label | `HIT CAGE!` in `#E8A838` as a billboard 0.6 m over the cage, only while exposed (bosses.md), Nunito 900 |
| Captured strip | the active hero alone at full size; the captured kids' names beneath their portraits in `ui.creamDim`; the caged lines arrive as bubbles from the cage and announces in each speaker's `glow` (bosses.md §2.6.5) |
| Kidnap bar (Shadow Queen) | a red sub-bar in the same slot, `#D94848` fill: `INTERRUPTING KIDNAP: N%  (<HERO>)` (canon, `kpct = kidnapDmg / 150`) for the 4 s; the targeted portrait pulses rift cyan `#3AF0FF` at 3 Hz; `⚠ <HERO> is being KIDNAPPED! Deal damage to interrupt!` on the announce channel |
| Banished | the portrait goes to the locked `?` style with a violet tint until the Queen's death restores it via the canon `<HERO> revived!` shape (bosses.md §2.16.1) |

#### 2.4.9 The announce channel

The v27 single-slot channel becomes a two-slot stack at 18 % of height, centred, Nunito 800 28 / 20 px with `text-shadow 0 0 12px` in the string's colour (v27 `shadowBlur 15`). A new announce takes the top slot; the previous one slides down 36 / 26 px and fades to 50 % over 0.3 s, and a third pushes it out. Each string keeps its own v27 duration (`d`, default 2.5 s), fades over its last 1.0 s (`alpha = min(1, timer)`, v27). The leading emoji renders per §2.1.5. Reduced motion: no slide, no glow. Colours are tokens, one per v27 hex, so a canon-paired colour is kept where v27 fixed it:

| Token | Hex | v27 strings that carry it |
|---|---|---|
| `ui.announce.gold` | `#E8A838` | default; quest accepted/complete announces, bounties, `Level N!`, secrets, `Game saved to Slot N!`, merchant arrival, `Boss weakening!` |
| `ui.announce.hurt` | `#D84830` | `YOUR LITTLE FRIENDS ARE MINE!`, `Heroes captured!`, `Almost defeated!`, `Start a game first!` |
| `ui.announce.heal` | `#3DCC7A` | rescue lines, `<HERO> revived!`, turn-ins |
| `ui.announce.ed` | `#228B22` | Ed's announces (npcs.md) |
| `ui.announce.magic` | `#A862C4` | `<HERO> skills reset! +N points`, portal lines |
| `ui.announce.amber` | `#D88030` | `Halfway there!`, the Earthquake Slam combo colour |
| `ui.announce.weather` | `#94C4DC` / `#dfe6e9` | `<Weather name>!` / `The weather clears.` (world-events) |
| `ui.announce.crater` | `#8850A8` | `CRATER_FLAVOR` |
| `ui.announce.lore` | `#a29bfe` | `loreTexts` |
| `ui.announce.citadel` | `#7B3CA0` | floor banners |
| `ui.announce.treant` | `#58B888` | Treant lines |
| `ui.announce.kidnap` | `#D94848` | kidnap strings |
| `ui.announce.alarm` | `#E8362A` (was `#ff0000`) | `THE GOBLIN KING APPEARS!` — pure red is the anti-palette's neon; the string is unchanged |
| `ui.announce.spark` | `#3AF0FF` (was `#00d2ff`) | `Spark Plug recovered from the Crystal Depths!` — the Brief's rift-cyan token replaces a near-identical off-palette hex |
| combo colours | `combo.*` verbatim (heroes.md §2.5.8) | `⚡ <name>! ⚡` |
| hero glows | `hero.<x>.glow` | `⚡ EXCALIBUR STRIKE!` and the other three, caged lines, reactions |

Quest notifications keep their own bottom-centre stack (three visible, 28 / 24 px pitch, Nunito 700 13 / 12 px on `ui.night` pills, 4 s each) for the FC §5.4 templates (`❗ Quest Accepted: <title>`, `✅ <title> — Complete! <rewardDesc>`, `<title>: <progress>/<target>`, `<title> — Ready to turn in!`).

#### 2.4.10 Achievement toasts

Bottom-right, a 260 × 52 / 220 × 46 px paper chip (the §2.3.8 card at toast size: `ui.paper`, photo corners, `ui.shadow`), icon 22 px, name Lora 700 15 px in `ui.ink`, `Achievement Unlocked!` (canon) Nunito 400 11 px in `ui.inkSoft`; slides in from the right over 0.5 s, holds to 3.5 s total (v27), stacks upward at 56 px pitch; `achieve` 0.3 (v27). The one paper object over the world: an achievement is a page being added to the book.

#### 2.4.11 The dialogue box

Bottom-centre, `W − 48` wide up to 1100 px / full width, 132 / 116 px tall, `ui.nightDeep`, a 1.5 px border in the speaker's colour (v27 gold border becomes the speaker's), radius 12 (v27). Left: the portrait from the atlas at 96 / 72 px inside a ring 3 px in the speaker's `ui` colour (heroes: `glow`), on a `ui.night` disc. Name plate Nunito 800 15 / 13 px in the speaker's colour (heroes: `base`), a second line for Quartz (`the Crystal Sage`, Lora Italic). Body Nunito 500 17 / 15 px in `ui.cream`, word-wrapped, 120 characters per second on the UI clock (npcs.md), one `dlg.blip.<who>` per glyph group (audio.md). The `▶` pulses bottom-right at `0.5 + 0.5·sin(6t)` when the line is complete (v27). Inputs (npcs.md §2.11): Interact, Enter, click, tap on the box advance; hold `Esc` / `B` / a two-finger tap 0.8 s to skip the block, with a `Skip` **[new text]** label and a 0.8 s ring filling around it. Portrait frame by context (npcs.md): kids `bright` for `quest_intro`, `space_hint`, `victory`; `grit` for `boss_appear`, `crash_landing`; else `neutral`; Ed's eight frames by mood tag; guides `warm` / `grave` / `neutral`. The sim freezes; the render clock runs (§2.2.5). The box is the one HUD element that never fades and sits above prompts (`z` 50).

**Speech bubbles** (proximity lines, emotes, caged lines, party lines): world-anchored billboards 0.4 m over the head, `ui.night` at 85 % with a 1.5 px border in the speaker's colour, Nunito 600 14 px, max 34 characters per line, 5 s, fade 0.3 s, never more than three on screen (oldest goes). **Captions** (cutscenes, in-flight lines, the sheltering tip): bottom-centre above the letterbox bar, Nunito 500 18 / 15 px `ui.cream` on a `ui.night` strip, the speaker's portrait 48 px at the left, timed by cutscenes.md; the sheltering caption `Grandpa Ed says this kind of rain is 'character-building weather.'` (canon tip 2) uses the same strip with no portrait (world-events §2.7.3); the `Subtitles` setting (§2.7) gates captions only, never dialogue.

#### 2.4.12 Prompts from the live binding

One prompt pill, bottom-left (desktop) or above the touch cluster (touch): a **key cap** (a 22 px rounded rectangle, `ui.cream` with the key name in `ui.ink` Nunito 800 12 px; on pad the button glyph from the SVG sprite; on touch no cap) and the verb in Nunito 700 15 px `ui.cream` on `ui.night`. The template is `[<KEY>] <verb>`; with the default keyboard binding it prints the canon string exactly: `[SPACE] Pick up`, `[SPACE] Trade`, `[SPACE] Open`, `[SPACE] Pull`, `[SPACE] Interact`; rebinding to `F` prints `[F] Trade`; on pad `[A] Trade` with the glyph; on touch the ACT button reads `Trade`, or the canon `⭐ ACT` when the verb is `Interact`. New verbs, each **[new text]**: `Talk`, `Fly`, `Rest`, `Sit`, `Keep it`, `Fish`, `Light` (a lantern post), `Cast` (fishing recast), `Pick up` (the lantern), `Read` (a flavour marker), `Claim` (the board's `!`), `Enter` (the caves' stair), `Skip` (dialogue hold). Portal: the world label `ENTER PORTAL` stays on the portal (canon placement) and the prompt reads `[SPACE] ENTER PORTAL`, reusing it. Dungeon entrances: `Press to Enter` (canon) stays a world label under the name; the prompt is `[SPACE] Enter`. Cutscenes: `Press SPACE to skip` (canon) is the keyboard variant of `Press <KEY> to skip`; on pad `Press ▢ to skip`; on touch `Tap to skip` **[new text]**. Two-option prompts (`Rest` → `Until dawn` / `Until dusk` / `Sit`) expand the pill into a three-row list with the first row focused; `Esc` / `B` collapses. Prompts appear at 1 m from an interactable or 2 m from NPCs and stalls (npcs.md), fade 0.15 s, and are suppressed while a page, the dialogue box or the letterbox is up. The v27 `interact → trigUlt` fall-through is removed (heroes.md §2.5.3); Space with no prompt is Dodge.

#### 2.4.13 The dungeon HUD (generic; dungeons.md fills the meter)

| Element | Rule |
|---|---|
| Entry card | bosses.md §2.3 grammar: `DUNGEON_NAMES[biome]` over `<BIOME> DUNGEON` in `DUNGEON_COLORS[biome]`, 4.1 s; Home, Wrong's regions use the canon floor banners `SHADOW CITADEL — Floor N: <floor name>` in `ui.announce.citadel` (story-beats places the `citadel` description on the shard's entry card or first banner; dungeons.md's choice) |
| Room transition | a 0.3 s `ui.nightDeep` iris from the door's screen position (v27's room-slide becomes an iris so the paper minimap and the party read as continuous), `Room N/M` (canon) refreshed on the minimap's title |
| Paper minimap | bottom-right, 160 × 120 / 120 × 90 px, a torn paper scrap (`ui.paper`, photo corner top-left only, `ui.shadow`); rooms as 22 × 16 px ink squares as visited (v27 cells), pencil lines for connections, the current room filled in the accent, cleared rooms stamped `✓`, locked doors a small `🔒` (canon glyph) on the connection, the boss room a crown once seen; title `Room N/M` and `🔑 N` (canon) in Nunito 700 11 px; hidden when `Minimap` is off |
| Door state | `🔒 LOCKED` (canon) as a chip at the top-centre under the boss slot while doors are barred; `Door unlocked!`, `Bars retracted!`, `Room cleared!`, `Combat cleared! Check for bonus...`, `Wave N/M`, `Dungeon Key found!`, `Treasure! +50 HP all!`, `Snared!`, the plate strings, `Puzzle solved!` on the announce channel in their v27 colours |
| Ability rooms | the four canon hints on the announce channel at room entry (`These cracks look weak... Liam could smash through!` …); the object's prompt shows the verb (`[SPACE] Smash` **[new text]**, `Shoot`, `Channel`, `Break`) and the wrong-hero line (`This requires LIAM's ability!` …) as a quest-notification pill on a failed press; `Channeling... (N more)` as the meter (below) |
| **Mechanic meter** | one slot, 220 × 10 / 160 × 8 px under the chips, fed by `dungeon.meter { label, value, max, colour, icon, state: 'idle' \| 'rising' \| 'falling' \| 'danger' \| 'done' }`: a `ui.night` trough, a fill in `colour`, a 16 px sprite icon at the left, the label in Nunito 700 12 px, `danger` pulses the rim `ui.hurt` at 2 Hz, `done` stamps a `✓`; dungeons.md names the per-dungeon meters (sand level, lantern light, aurora charge, resonance sequence, root rhythm, `Channeling... (N more)`) and may show a second instance only by writing a §6 line |
| Visibility | `room.visOverride` dims the compass strip's non-objective pips (world-events §2.2.5); the strip stays |
| Guardian caption | `Guardian of <dungeon name>` is the intro card's subtitle (bosses.md), no separate caption |
| Lairs | the Depths and the Rift use the entry card with `The Crystal Depths` / `The Volcanic Rift` and their canon descriptions, no minimap (they are places, not room sets), the meter if bosses.md's fight sets one |

#### 2.4.14 Title, location, camp, catch and constellation cards

**Title card** (Brief §4.1; story-beats §2.7 lines; camp.md §2.11.8): bottom-left above the prompt slot, the name in Lora 600 36 / 26 px `ui.cream` with a 2 px `ui.accentGlow` rule 48 px wide beneath, the line in Lora Italic 18 / 14 px `ui.creamSoft`; fades in 0.8 s, holds 3 s, fades 1 s; no backing, a 1 px `#0B0E1A` text-shadow at 40 % for legibility over snow. Triggers: every island landing (`Enchanted Forest` / `Home, or near enough. Mind the goblins.` and the six others), the caves (`Crystal Caves` / `The island's roots. Quartz keeps the lamps lit.`), Home, Wrong (`Shadow Realm` / `Home. Wrong.`), the Rift (`The Volcanic Rift` / its canon description), Stewart Camp on entering `camp.radius` after 90 s away and on every stage change (`Stewart Camp` / `Tent, fire, one bedroll. For now.` at C1, `Tent, fire, four bedrolls. Home.` from C2), held by `card.hold` for stations. Districts (the Brief's names) are a location card of the same style at 28 / 20 px with no line when the party crosses into the Rootways, the Witch's Lanterns path, the Observatory approach or the Sunken Pyramid (dungeons.md may add district lines by §6). **Catch card** (world-events §2.7.2): a 300 × 120 / 240 × 100 paper card centre-bottom for 1.2 s: fish name Lora 700, `N cm` and the rarity stamp, `New!` **[new text]** on a first catch; `It got away.` / `Nothing bites here.` on the announce channel. **Constellation cards** (camp.md §2.7.4): as each constellation's lines draw in `#8FD3F4`, its name (`The Biplane`, `The Lantern`, `The Campfire`, `The Squad`, `The Meteor`) fades in beside it as a world-anchored Lora 600 24 px label for 3 s; the first sighting adds the Memories entry. **Photo prompt:** a 44 px camera chip bottom-right, `Photo mode · H` **[new text]** (live binding), while a migration, an aurora, a meteor shower or the plane's loop is on screen.

#### 2.4.15 World-anchored elements

| Element | Rule |
|---|---|
| Lantern beams (npcs.md §2.6.1, world-events §2.5.2) | two crossed additive quads, 12 m tall (crate 10 m, merchant 14 m, events per file), 0.8 m wide at the base widening to 1.6 m, alpha 0.12 at the base fading to 0 at the top, colour by state (`beam.offer` `#E8A838`, `beam.turnIn` `#3DCC7A`, `beam.crate` `#E8A838`, `beam.merchant` `#A57BE8`, event colours per world-events), on the bloom layer, no light; a base ring decal 1.2 m in the NPC's `ui` colour at 0.5; both fade in 0.5 s and are culled beyond 120 m; a 0.3 Hz brightness breath ±15 % so they read as lanterns, not laser pointers |
| Nameplates | Nunito 800 13 px billboards 0.3 m over the head, `ui.night` pill, fading between 25 and 40 m: elites `<Modifier> <Display name>` in the modifier colour (enemies.md §2.6); guardians their canon name always; regulars on hover or lock-on only; NPCs their canon name in their `ui` colour (`Grandpa Ed`, `Merchant`, `🐸 Familiar`, guides); multiplayer `PN <HERO>` (§2.9.3) |
| Enemy HP bars | 40 × 4 px billboards under the nameplate, `ui.hurt` on `ui.night`, shown while hurt and for 2 s after; guardians an 80 × 8 bar always (enemies.md §2.7); the frog's always-on bar (npcs.md); the elite shield pool as an ice-white overlay |
| World labels | `RESCUE!` over unopened cages (canon, `ui.gold`, pulsing 0.6–1.0), `WAYPOINT` under cairns, `Healing Spring`, `HIT CAGE!`, `ENTER PORTAL`, `✓ CLEARED` / `Press to Enter` under dungeon names, `Merchant`, the flavour marker `?` (a glowing glyph billboard in `ui.gold`, AR-style), `[SPACE] Pick up` over gear orbs (a prompt, not a label, when within 1 m) |
| Lock-on reticle | four corner ticks 0.3 m around the target in the active hero's `glow`, breathing 1.2 s (heroes.md §2.5.3) |
| Combo tether | heroes.md §2.5.8's dotted line; this file only sizes the dots (0.08 m) |
| Quest-marker glyphs | the canon `✓` `!` `...` stay in the journal; the world uses beams (npcs.md) |

#### 2.4.16 Damage numbers (heroes.md §2.5.12, restated for the renderer)

Instanced screen-facing quads from a **glyph atlas** rendered once at load from Nunito 900 (digits, `+`, `−`, `g`, and the words `CRIT! `, `IMMUNE!`, `BLOCK!`, `DODGE!`, `THORNS!`, `REFLECT!`, `REFLECTED!`, `MISS!`, `NEW GEAR!`, `HIT CAGE!`), one draw call, pool of 30 (the v27 cap; the oldest is reclaimed). Colours: the hitting hero's `glow`; damage taken `#D84830`; healing `+N` `#3DCC7A`; `REFLECT!` `#6B8EC8`; `NEW GEAR!` `#E8A838`; cage hits `#E8A838`; no-source fallback white at three weights (Nunito 600 / 800 / 900 by the v27 size bands). Size `clamp(16 + floor(n/20)·2, 16, 32)` px at reference distance, scaled with distance so a number is the same screen size at 12 m and 25 m; crit ×1.3 with the 30 % settle pulse and six sparks; motion the v27 1.0 s arc with one bounce at 60 % life; a 2 px `rgba(0,0,0,0.5)` outline baked into the atlas. Toggle `Damage Numbers` (canon setting).

#### 2.4.17 The emote wheel and the combo radial

**Emote wheel:** hold `V` (keyboard), hold View 0.3 s (pad), tap the face chip under the portraits (touch). A 200 / 160 px radial around the active portrait's screen position (touch: screen centre-left), `ui.night` at 85 %, three 120° wedges with the kid's emote names from heroes.md §2.4.6 (**[new text]** labels: `Cool cool cool`, `Shield check`, `Stay back` … ), the hovered wedge lifting 4 px with its canon line previewed beneath in Lora Italic; release on a wedge fires it; release in the centre cancels. A wedge whose line fired within 60 s shows a thin sweep arc draining clockwise: the motion still plays, the bubble is withheld (heroes.md's cap). The sim runs; the wheel is not a pause. **Combo radial:** heroes.md §2.5.8: hold `Q` / RB 0.2 s, up to three partner portraits at 56 px around the active portrait in their `base` with the pair's name in the combo colour beneath; release on one; tap fires the canon-order default. On touch, long-press the Ultimate button 0.3 s opens it.

### 2.5 Copy voice and the strings inventory

#### 2.5.1 Every canon UI string, placed (FAMILY_CANON §12)

Every string is ported verbatim into `src/content/canon/ui.ts`, keyed by its FC row; the table says where it renders. "Template" means the v27 string had a variable in it and the variable is substituted exactly as v27 did; "live key" means the key name comes from the binding and the canon string is what prints with the default keyboard binding.

| FC § | Strings | Where |
|---|---|---|
| 12.1 | `⚔️ The Stewart Squad Adventure`, `The world has stories to tell.` | title page and CS-10's closing card |
| 12.1 | `Liam` / `Tank`, `Noah`, `Collette` / `Mage`, `Isabella` | title hero cards (labels `DPS` and `AoE` are replaced by heroes.md's `Ranger` / `Whirlwind`; `Tank` and `Mage` are the canon labels kept) |
| 12.1 | `☀️ Easy` / `⚔️ Normal` / `💀 Hard` | title difficulty chips; the Settings page |
| 12.1 | `🤝 Multiplayer (LAN Co-op)`, `📡 HOST GAME`, `🎮 JOIN GAME`, `JOIN`, `CODE`, `Server URL (LAN default)`, `ws://localhost:3000` | the title's multiplayer fold-out (§2.9.3) |
| 12.1 | `START ADVENTURE`, `⚙️ Settings` | title buttons |
| 12.1 | `— V27 — GEAR & UI`, `— V 27 — DEV MODE 🔧`, the 30 feature chips | cut (§2.5.2) |
| 12.2 | `👥 Siblings: 0/3` (template), `Wave 1` (template), `Normal`, `☀️`, `XP +50%`, `⬤ 0g` (template), `🔧 DEV` | chips (§2.4.4) |
| 12.2 | `Liam Lv1`, `100 / 100`, `Lv1 XP` (placeholders) | the ring cluster: `Lv N` under the active portrait, `hp / maxHp` chip on demand, XP arc (§2.4.2) |
| 12.2 | `⚡ ULTIMATE READY — SPACE`, `⚡ COMBO — Q`, `⚡ <sigNm> [E]` / `<sigNm> [E] (Ns)` | ability labels with the live key (§2.4.3) |
| 12.2 | `HYBRID` | cut with the control modes |
| 12.2 | `FPS: N \| Peak: Nms`, `E:N P:N Pr:N`, `Load:N% W:N Ad:N.NN` | the perf overlay (§2.12), dev only |
| 12.3 | `LEVEL UP!`, `Choose an upgrade (click or press 1/2/3)`, `Host is choosing — click to vote!`, the card badges and `ALL HEROES` (§11.11) | level-up page |
| 12.3 | `⚡ Invest All (N)`, `SKILL TREES`, `Press T to close` | Squad page |
| 12.3 | `⚔️ INVENTORY`, `Press I to close • 💰 0`, `STASH`, `By Slot`, `By Rarity`, `💰 Drag here to sell`, `No equipment`, `SKINS`, ` (Locked)` | Pack page |
| 12.3 | `EQUIPMENT`, `Press I to close` (canvas variant), `Press P to resume` (canvas pause) | cut: superseded by the DOM variants of the same page |
| 12.3 | `PAUSED`, `Controls`, `Stats`, `💾 Save & Load`, `Press P or ESC to resume`, `🏠 RETURN TO TITLE`, `🏃 RETREAT FROM DUNGEON`, `⚙️ SETTINGS` | pause page |
| 12.3 | `GAME OVER`, `The Stewart Squad has fallen...`, `TRY AGAIN`, `🏠 TITLE` | game over page |
| 12.3 | `VICTORY!`, `The Stewart Squad saved the realm!`, `⚔️ NEW GAME +`, `🌍 KEEP PLAYING`, `🔄 PLAY AGAIN`, `🏠 TITLE` | victory page; `♾️ ENDLESS MODE`, `PLAY AGAIN` / `ENDLESS MODE` (canvas) cut |
| 12.3 | `BATTLE COMPLETE!`, `CONTINUE ▶`, `Per-hero combat breakdown`, `DMG Dealt`, `Kills`, `DMG Taken`, `Sig Uses`, `Ult Uses`, `Times Down`, `👑 ` | victory-stats page |
| 12.3 | `⚔️ ENTER`, `CANCEL`, `<name> CLEARED!`, `The <biome> dungeon has been conquered!`, `XP Earned`, `Rooms`, `🌍 RETURN TO OVERWORLD`, `DUNGEON FAILED`, `The Stewart Squad couldn't clear <dungeon>...`, `Partial XP`, `DUNGEON RETREAT`, `The Stewart Squad retreated from <dungeon>...` | dungeon pages; `DUNGEON CLEARED!` (the pre-replacement placeholder) is never shown, as in v27 |
| 12.3 | `🧙 MERCHANT`, `Rare goods from distant lands`, `CLOSE`, `⚔️ BOUNTY BOARD ⚔️`, `Complete bounties for gold & XP`, `⚔️ CLAIM REWARD`, `✓ Claimed` | merchant and bounty pages |
| 12.3 | `⚙️ SETTINGS`, `CLOSE` | Settings page title and close |
| 12.3 | `⏸ GAME PAUSED`, `Waiting for host to resume...`, `Waiting for host to start...` | guest overlays (§2.9.3) |
| 12.3 | `📖 BOSS BESTIARY`, `Press B to close`, `★ DEFEATED`, `⚔ ENCOUNTERED`, `???`, `Not yet encountered` | Bestiary page |
| 12.3 | `📜 QUEST JOURNAL`, `Press J to close  •  N/15 completed`, `🟡 ACTIVE`, `✅ READY TO TURN IN`, `🔵 AVAILABLE`, `✔ COMPLETED` | Quests page |
| 12.3 | `Achievement Unlocked!` | toast |
| 12.3 | `Loading dungeon...`, `Press SPACE to skip` | streaming caption; cutscene prompt (live key) |
| 12.3 | `ENDLESS`, `Wave: N`, `Score: N`, `Best: N` | cut with endless |
| 12.4 | the twelve pause rows; the canvas rows `WASD / Arrow Keys / Joystick`, `1-4 Keys / Tap Portrait`, `Equipment inventory`, `Toggle control mode (<mode>)`, `Toggle quest compass`, `Game Stats`, `Time: M:SS   Kills: N   Level: N`, `Difficulty: X   Active Hero: Y` | pause `Controls` (DOM rows) and `Stats`; the canvas duplicates are superseded except the two stat lines (kept); `Toggle control mode` cut; `Endless Wave: N   Score: N` cut |
| 12.5 | `Screen Shake`, `Hit-Stop`, `Particles`, `Auto-Aim`, `Tutorial`, `Damage Numbers`, `Minimap`, `World Zoom`, `CONTROLS`, the twelve action labels, `Reset to Defaults`, `Press key...`, `ON` / `OFF`, `LOW` / `MED` / `HIGH`, `1.0` / `1.15` / `1.30` | Settings page (§2.7); `CONTROLS` stays as the section's canon head (the one all-caps head) |
| 12.6 | `Slot N`, `Empty`, `SAVE`, `LOAD`, `DEL`, every save/load announce, `Save before returning to title?`, its two-line variant, `Load Slot N? Unsaved progress will be lost.` | Saves page and confirms (§2.9.1); `Enter slot number to delete (1, 2, or 3):` cut (each slot has `DEL`) |
| 12.7 | every multiplayer string | §2.9.3 |
| 12.8 | `Entering <dungeon name>...`, `Room N/M`, `🔑 N`, `🔒 LOCKED`, `🔒`, `⚡ ULT`, `⭐ ACT`, `[SPACE] Open` / `Pull` / `Interact`, `Guardian of <dungeon name>`, the room announces, `✓ CLEARED`, `Press to Enter` | dungeon HUD (§2.4.13), touch labels (§2.6.3), prompts (§2.4.12), world labels (§2.4.15) |
| 12.9 | `Level N!`, `Shield broken!`, `Wave N` / `Wave N — Stay sharp!`, `Compass: ON` / `OFF`, `Music: OFF` / `ON`, `Ambush!`, `A mysterious portal appears...` | announce channel; `WAVE N - BOSS!`, `ENDLESS MODE - Survive!`, `+N points!` cut; `Controls: <mode>` cut |
| 12.10 | every dev string | dev console (§2.12) |
| 8 | the seven tutorial steps, `Find and rescue your siblings!`, `Shadow Citadel is ready!`, `💡 Press I to open Inventory and equip your gear!`, `[SPACE] Pick up`, the persistent controls hint strip | §2.8; the hint strip `WASD to move • Heroes auto-attack • R: Ultimate • SPACE: Interact • Q: Compass • J: Quests • M: Mute • B: Bestiary` renders once, at the first dawn, as the tutorial bar's first 8 s with its keys substituted from the live binding (its `Q: Compass` is a v27 slip; the canon string prints as written on keyboard defaults) |
| 9 | 31 achievements | Achievements page, toasts |
| 10.1 | 12 tips | title and loading, story-aware rotation |
| 2.5, 3.6, 4.2, 5.4, 5.5, 6.x, 10.6, 11.x | announces, bubbles, popups, cards | the channel, bubbles and cards named in §2.4 |

#### 2.5.2 Cut strings, with reasons (for KEEP_CHANGE_DROP.md)

| String(s) | Reason |
|---|---|
| `♾️ ENDLESS MODE`, `ENDLESS MODE - Survive!`, `ENDLESS`, `Wave: N`, `Score: N`, `Best: N`, `WAVE N - BOSS!`, `+N points!`, `Endless Wave: N   Score: N`, `ssq_highscore` | endless mode is cut (story-beats §2.8; orchestrator decision) |
| `The world awaits — explore the Shadow Citadel!` | the Citadel is folded into Home, Wrong and the post-victory world has the Rift instead (story-beats §2.9) |
| `— V27 — GEAR & UI`, `— V 27 — DEV MODE 🔧` | version strings, replaced by the build stamp |
| the 30 feature chips (`🌍 Organic Biomes` …) | marketing copy on a title screen the family already owns; several name cut or renamed systems (`♾️ Endless Mode`, `🏯 Shadow Citadel`, `🌋 Volcanic Raid`) |
| `HYBRID`, `Controls: <mode>`, `Controls: <mode> (tap/click to aim)`, `C` → `Control Mode`, `Toggle control mode (<mode>)` | the three control modes collapse to one camera-relative scheme (CM §12; heroes.md §2.5.3) |
| `EQUIPMENT` / `Press I to close` (canvas), `Press P to resume` (canvas), `PLAY AGAIN` / `ENDLESS MODE` (canvas) | canvas duplicates of DOM pages |
| `Enter slot number to delete (1, 2, or 3):` | a `prompt()`; each slot card has its own `DEL` |
| `Guardian` (the fallback popup subtitle), `BOSS`, `DUNGEON` (guest fallbacks) | unreachable fallbacks; the guest name-card sync is fixed by sending the canon key |
| `Q: Compass` inside the hint strip | not cut: the string prints as written; the actual compass key stays `G` |

#### 2.5.3 New strings (everything the bible has added so far, plus this file's)

Collected once so `src/content/text/new.ts` can hold them all, each marked new in code. Lines from other files are quoted as they wrote them.

| Owner | Strings |
|---|---|
| heroes.md | `Dodge`; role labels `Ranger`, `Whirlwind`; emote names `Cool cool cool`, `Shield check`, `Stay back`, `Fifteen degrees`, `Cool bug`, `Told you`, `Fix my hair`, `That is how it's done`, `Curtains`, `Not scared`, `Copycat`, `Sugar?` |
| enemies.md | 17 display names, the elite prefix names, the guardian and place-card lore lines (§2.10) |
| story-beats.md | Ed's two hangar lines, `crater_hint` ×3, Bog Witch ×4, Sand Nomad ×3, `the Crystal Sage`, the two camp cards, the seven island lines |
| world-events-weather.md | `A meteor shower! Look up.`, `The sky settles.`, `It hums like the crater.`, `A fallen star. Still warm.`, `A lantern flickers somewhere in the dark.`, `Lantern brought home.`, `The lantern went out.`, `The herd is crossing.`, `It got away.`, `Nothing bites here.`, `Someone's boot. Not Ed's. Probably.`, `Gone Fishin'` / `Catch one of every fish`, the five constellation names, fish names, `Blizzard` / `Ashfall` / `Riftstorm` weather labels (this file's chip labels for its types) |
| bosses.md | `The water rises!`, `The Shadow Squad` / `Four of them. Four of you.`, `Guardian of The Shadow Citadel` (composed from canon parts) |
| camp.md | `Rest`, `Until dawn`, `Until dusk`, `Sit`, `Keep it`, pose names `Hearth`, `Porch`, `Dock`, `The plane`, `Squad`, `Not scared`, pet names `Orange Meanie`, `Sugar` |
| npcs.md | `Where to?`, `Needs the propeller`, `Needs the rudder`, `Needs the spark plug`, `You are here`, `She'll hop. Probably.`, `Steadier. Still no rudder.`, `She'll turn now.`, `Fly`, `Stay`, `Talk`, `Character-building weather.`, `Grandpa's snack. Heals every hero.`, `Skip` |
| this file: pages | `Resume`, `Photo mode`, `N points`, `Take`, `Choose`, `<HERO> only`, `Nothing in the pack yet. Goblins drop things.`, `Track`, `No quests yet. Find someone with a lantern over their head.`, `N open quests`, `Seen N · Beaten N`, `Nothing kept yet. Look for a glowing ? in the grass.`, `star shard · N`, `The hens`, `No pets yet. Something orange has been watching the fire.`, `(skipped)`, `Buy`, `Not enough gold`, `Sell`, `Continue`, `v1.0`, `v1.0 · DEV MODE 🔧`, `New!`, `Golden hour only` and the other catch tells |
| this file: prompts and HUD | `Light`, `Cast`, `Pick up`, `Read`, `Claim`, `Enter`, `Smash`, `Shoot`, `Channel`, `Break`, `Tap to skip`, `Photo mode · H`, `Lock on`, `Emotes`, `Turn camera`, `Map`, the district cards |
| this file: settings and accessibility | `Reduced motion`, `Text size` (`Normal` / `Large` / `Larger`), `High-contrast telegraphs`, `Screen shake` (the slider's label; the canon `Screen Shake` head stays), `Hold or toggle` (`Lock on: hold` / `toggle`, `Aim: hold` / `toggle`), `Subtitles`, `Master`, `Music`, `Effects`, `Ambient`, `Dialogue`, `Difficulty`, `Quality` (`Low` / `Medium` / `High` / `Ultra` / `Auto`), `Camera turn speed`, `Invert camera`, `Compass`, `Auto-attack nearby enemies` (the caption under `Auto-Aim`), `Rumble`, `Press a key…` (the pad/touch variant of `Press key...`), `Already used by <action>`, `Swap` |
| this file: onboarding | the pad and touch variants of steps 1, 2, 4 and 6 (§2.8), `Both ultimates are ready. Hold Q to pick a partner.`, `A shape on the ground is an attack. Shift to dodge.`, `Ed's plane can fly you somewhere new.`, `Bounties pay gold. Claim them here.` |
| this file: save, errors, multiplayer | `Export to file`, `Import from file`, `Saved to your downloads.`, `That file isn't a Stewart Squad save.`, `This save is from a newer version. Update the game to load it.`, `Imported into Slot N`, `Autosave`, `Save & Quit`, `Quit without saving`, `Load`, `Cancel`, `Delete Slot N? This can't be undone.`, `Waiting for host…`, `Everyone to the fire.`, `Controller connected`, `Controller disconnected. Paused.`, `Hosting on <url>`, `Joining…`, `Storage is full. Delete a save or export one.` |
| this file: photo mode | `Take photo`, `Pose`, `Filter` (`None`, `Golden hour`, `Aurora`, `Ember`), `Frame` (`None`, `Photo corners`, `Scrapbook`), `Focus`, `Tilt`, `Hide us`, `Save to scrapbook`, `Download`, `Saved to Memories.`, the default caption `<place>, day N` |
| this file: dev | `Console`, `Stations`, `Perf`, `Copy diagnostics` |

Voice check on every new line: plain, short, no jargon, no claim about a real person, Ed's deflection where Ed speaks, the kids' deadpan where the UI is teasing (`Something orange has been watching the fire.`).

#### 2.5.4 The P2 name-collision list

| Collision | Rule |
|---|---|
| `Storm Chaser` the achievement (`Fight through 5 thunderstorms`) vs `Storm Chaser` the bounty (`Fight through 3 weather changes`) | Both kept verbatim (world-events). Different keys (`stormChaser` / `b_weather3`), different pages (Achievements / bounty cards), the bounty card always carries the `Bounty:` prefix in its title slot and the board's `⚔️` stamp; a test asserts the two never share a toast |
| `Berserker` the Liam branch, `Berserker` the Isabella branch, and the retired v27 role framing | Both branch names stay verbatim on the Squad page under their kid's tab; the word never appears as a role label (heroes.md: `Whirlwind`); the `elite.berserker` modifier prints as `Berserker <Display name>` on nameplates, which is a third use, tolerated because it is never on a page beside a branch and the pennant carries its identity |
| `camp` the horde's word (`Camp Crusher`, `Camp Raider`, `Destroy 3 spawner camps`, `All siblings found! Destroy the camps!`, `Corrupted camps poison the forest...`) vs Stewart Camp | Copy never says "camp" alone for the family hub: it is `Stewart Camp` in every card, chip and new line; the horde's places are `camps` in canon and `Goblin camp` on the bestiary card; the compass pip for a goblin camp is the totem icon, the hub's is the tent |
| `Mini-Boss Slayer` vs "guardian" | The achievement, `kill_miniboss` quest text and `<name> APPEARS!` popups keep "mini-boss"/canon wording; "guardian" is the bestiary sub-tab name and the canon subtitles (`Crystal Caverns Guardian`); the achievement counts guardians and the two floor mini-bosses (bosses.md) and is never renamed |
| `Guardian` the Isabella branch vs `Guardian of <dungeon name>` | Branch on the Squad page only; the caption is the intro card's subtitle only |
| `Vamp Fang` vs `Vampire Fang` | only `Vampire Fang` reaches a card (`GEAR_DB`); `Vamp Fang` survives in the migration table, never shown |
| `Ice Citadel` (quest `frozen_3` title) vs `The Ice Citadel` (dungeon) vs `The Shadow Citadel` | printed as their sources give them; the entry card always uses `DUNGEON_NAMES` |
| `Signature Style` the achievement vs `Signature Style` the bounty | as `Storm Chaser` |
| `Sugar` the slime vs Isabella's `Sugar?` emote | the emote label carries the `?`; the pet card never says "emote" |
| `Rest` the prompt vs `Rest` the rest-room lore | the lore line is a full sentence; the prompt is one word on a pill |
| `Fly` the prompt vs `Frequent Flyer` | no overlap in surface |

### 2.6 Input

One input layer (`src/engine/input/`) that turns keyboard, gamepad and touch into the same **intent record** each fixed step: `{ move: vec2, camYaw: number, actions: bitfield(attack, dodge, signature, ultimate, combo, interact, lockOn, swap1–4, swapNext, emote, pause, map …), aim: vec2 | null, pressed/held/released per action }`. Guests send the record (CM §12: no raw keys). A 150 ms **input buffer** per action (attack, dodge, signature, ultimate, combo, interact) replaces the v27 one-slot latch. Control modes are gone: one camera-relative scheme, auto-attack as a setting, click or tap to aim as the fallback when nothing is locked on (heroes.md §2.5.3).

#### 2.6.1 Keyboard and mouse

v27 defaults kept where they existed (CM §1.2); the second default key is kept too (v27's rebind destroyed it).

| Action | Default | Note |
|---|---|---|
| Move | `W A S D`, arrows | camera-relative, normalised |
| Attack | left click, auto | click aims when nothing is locked |
| Dodge | `Shift`; `Space` when no prompt is up | heroes.md §2.5.3 |
| Signature | `E` | canon |
| Ultimate | `R`, `0` | canon |
| Combo | `Q` (tap = canon order, hold 0.2 s = radial) | canon key |
| Swap | `1` `2` `3` `4`, portrait click | canon |
| Lock on | `Tab`, middle click | hold or toggle per setting |
| Interact | `Space` | canon; no ult fall-through |
| Emote wheel | `V` (hold) | new |
| Camera turn | right-mouse drag; `Z` left / `C` right | the Brief's `Q` / `E` are canon combat binds, so the camera takes the two free keys beside them; `C` is free because control modes are cut |
| Camera recentre | `X` | new |
| Zoom | mouse wheel (three steps, the `World Zoom` setting) | CM §12 |
| Pages | `T` skill trees, `I` pack, `J` quests, `B` bestiary, `N` map, `P` / `Esc` pause | `N` new; the rest canon |
| Compass toggle | `G` | canon |
| Mute | `M` | canon (`Music: OFF` / `ON`) |
| Photo mode | `H` | new |
| Level-up pick | `1` `2` `3` | canon, only while the page is up |
| Cutscene skip | the interact key or `Enter` (hold 0.8 s for dialogue blocks) | canon `Space` / `Enter` |
| Dev | `F2`, `F6`–`F10`, `` ` ``, `Ctrl+Shift+D` | kept, dev only |

`preventDefault` on arrows, Space, Tab and the F-keys the game uses. Mouse: hover shows regular enemies' nameplates; click on a portrait swaps; click on the quest tracker cycles; any click unlocks Web Audio (v27). No click-to-move.

#### 2.6.2 Gamepad (full, new; standard mapping)

| Control | Action |
|---|---|
| Left stick | move (analog magnitude respected, dead zone 0.15 radial) |
| Right stick X | camera yaw, 120°/s at full deflection (the `Camera turn speed` setting scales 60–240) |
| Right stick Y | nothing (pitch is fixed); reserved |
| `A` / cross | interact when a prompt is up, else attack |
| `B` / circle | dodge; close a page; cancel; hold 0.8 s skips a dialogue block |
| `X` / square | signature |
| `Y` / triangle | ultimate; secondary action on pages |
| `RB` | combo (tap = canon order, hold = radial); next tab on pages |
| `LB` | swap next; previous tab on pages |
| `RT` | attack (hold = auto-attack cadence) |
| `LT` | lock on (hold or toggle) |
| D-pad up / left / right / down | swap to Liam / Noah / Collette / Isabella (hero index 0–3); on pages, focus movement |
| Menu / Start | pause page |
| View / Back | tap: map page; hold 0.3 s: emote wheel |
| `R3` | camera recentre |
| `L3` | zoom step |

Glyphs: an SVG sprite with Xbox and PlayStation sets, chosen by `gamepad.id` (verified at a Rule 2 gate against real `navigator.getGamepads()` ids); unknown pads use the Xbox set. Rumble: 0.2 s on a fish bite (world-events), 0.1 s on a hit-stop site, off by the `Rumble` setting. The pad becomes the "active device" on its first input and prompts switch glyphs within one frame; the keyboard or mouse switches back the same way.

#### 2.6.3 Touch (390 × 844 portrait; landscape mirrors the anchors)

| Control | Placement (dp, from the safe area) | Size | Rule |
|---|---|---|---|
| Floating joystick | claimed by the first touch in the left half below 45 % of height; origin at the touch | ring r 60 drawn and input (fixing v27's 55 / 60), knob r 22, dead zone 0.15 | idle ghost at (90, H − 130) at 15 % (v27); alpha 0.35 active |
| Attack | bottom-right corner, (−28, −28) from the corner | 72 | hold repeats at the attack cadence; a tap with no target aims at the tap direction |
| Dodge | left of Attack, 88 apart | 56 | `Dodge` label under it |
| Signature | above Attack, 88 apart | 56 | shows the ability's line icon and cooldown sweep (the HUD icon *is* the button) |
| Ultimate | above-left of Attack on the diagonal | 56 | `⚡ ULT` (canon) label; long-press 0.3 s = combo radial when legal |
| Swap | above Signature | 48 | cycles; portraits also tap-swap |
| ACT (the prompt) | above the cluster, centred over it | 48 tall pill | the prompt pill itself: the verb, or `⭐ ACT` (canon) for `Interact` |
| Emote | a 44 face chip under the portraits | 44 | opens the wheel |
| Camera | two-finger horizontal drag anywhere, or one-finger drag in the right half above the cluster | — | 0.35°/px |
| Lock on | tap an enemy (locks) or the reticle (unlocks) | — | — |
| Pause | a 44 chip top-right of the compass strip | 44 | — |

All hit areas are ≥ 44 dp with a +8 dp forgiveness pad (v27's +10). Buttons idle at 30 % alpha and press at 60 % (v27) with a 0.05 s scale to 0.92. Every anchor honours `env(safe-area-inset-*)` + 12. The joystick zone and the button cluster never overlap the dialogue box, which lifts the cluster by its own height while open. Landscape phones: joystick left half, cluster bottom-right, HUD anchors as desktop at mobile sizes. Tablets (≥ 768 dp short edge): the desktop layout with the touch cluster.

#### 2.6.4 Remapping

The Settings page's `CONTROLS` section (canon head) lists every action in §2.6.1 and §2.6.2 (v27 exposed twelve; all are exposed now), with two keyboard slots and one pad slot each. Click a slot → `Press key...` (canon; `Press a key…` **[new text]** on pad) → the next input binds; `Esc` cancels (v27). A bound key already used elsewhere shows `Already used by <action>` **[new text]** with `Swap` **[new text]** to exchange them; no silent overwrite. `Reset to Defaults` (canon) restores the tables including second keys. Bindings persist in `ssq_keybinds` (v27 key kept, shape versioned) and travel with an exported settings file; guests use their own (CM quirk 19 fixed). Reserved and unbindable: `Esc` (cancel), `F2`, `F6`–`F10`, `` ` ``, `Ctrl+Shift+D`, `1`–`3` while the level-up page is up. Touch buttons are not remappable but are **repositionable**: a `Layout` **[new text]** sub-page lets a kid drag the five buttons and the pause chip anywhere in the right half, snapping to a 8 dp grid, with `Reset to Defaults`.

#### 2.6.5 Hold vs toggle

`Hold or toggle` (§2.7): lock on (hold `LT` / `Tab`, or press to toggle), aim (hold `RT` / click to aim, or toggle a persistent aim), emote wheel (hold, or press to open and press to fire), dialogue skip (hold 0.8 s, or a `Skip` button on the box). Default: hold for all four; the toggle set is one switch, not four, so a kid with one hand flips one thing.

#### 2.6.6 Pause, focus, disconnect

| Event | Rule |
|---|---|
| Any page opens | sim paused (§2.2.5); all held actions released; movement intent zeroed |
| Tab blur / `visibilitychange: hidden` | every key, button and touch is released (CM quirk 11); single player and host: the pause page opens; guests: inputs flush only |
| Gamepad disconnect | inputs flushed; toast `Controller disconnected. Paused.` **[new text]** and the pause page (single player and host) or `Controller disconnected` toast only (guest); reconnect: `Controller connected` **[new text]**, the active device switches back |
| Level-up, boss intro, cutscene, dialogue | pause or freeze per their owners (CM §9 kept); `hitStop` freezes the sim but the input layer keeps sampling so buffered presses land |
| Multiplayer host paused | guests see `⏸ GAME PAUSED` / `Waiting for host to resume...` (canon); guest inputs are buffered for 0.5 s then dropped explicitly (CM §12) |
| Photo mode | paused; all combat actions inert; camera and page inputs live |
| Window resize / orientation change | HUD reflows on the next frame; the touch layout re-anchors; the book re-fits |

### 2.7 Accessibility and the Settings page

`⚙️ SETTINGS` (canon title), reachable from the title, the pause page and the tab; `CLOSE` and the footer. Groups in order; every toggle is a 44 px switch with `ON` / `OFF` (canon labels); every change applies immediately and persists to `ssq_settings` (v27 key, versioned shape).

| Group | Setting | Values | What it changes |
|---|---|---|---|
| Play | `Difficulty` | `☀️ Easy` / `⚔️ Normal` / `💀 Hard` (canon) | the canon three (SI §1); changeable outside boss fights and dungeons, applied to the next spawn and to `maxHp` on Easy via the baseline recompute; the title chips are the same control |
| Play | `Tutorial` | ON / OFF (canon) | §2.8 |
| Play | `Auto-Aim` | ON / OFF (canon label; caption `Auto-attack nearby enemies` **[new text]**) | heroes.md §2.5.3's assist: attack in range without a press; default ON |
| Play | `Damage Numbers` | ON / OFF (canon) | §2.4.16 |
| Play | `Compass` **[new text]** | ON / OFF | the strip (`G` toggles the same) |
| Play | `Minimap` | ON / OFF (canon) | the dungeon paper minimap |
| Play | `World Zoom` | `1.0` / `1.15` / `1.30` (canon) | orbit distance steps (CM §12); default `1.30` maps to the nearest boom |
| Play | `Hold or toggle` **[new text]** | `Hold` / `Toggle` | §2.6.5 |
| Feel | `Screen Shake` (canon head) with a slider | 0–100 %, default 70 % | scales every AR §10 profile; 0 disables; the boss-intro shake obeys it |
| Feel | `Hit-Stop` | ON / OFF (canon) | the seven hit-stop sites |
| Feel | `Rumble` **[new text]** | ON / OFF | §2.6.2 |
| Feel | `Camera turn speed` **[new text]** | slider 60–240°/s | RS and drag |
| Feel | `Invert camera` **[new text]** | ON / OFF | RS X and drag |
| See | `Reduced motion` **[new text]** | ON / OFF (default from `prefers-reduced-motion`) | telegraph sweep off with shapes on (fill at 50 % then 100 %, enemies.md §4); no boss push-in, shake or roll (bosses.md §2.3); combo beat without camera move or bars (heroes.md §2.5.8); particle velocity ×0.5 and tree and cloth sway ×0.5 (world-events, heroes.md); page-turn → cross-fade; announce slide and glow off; HUD idle fade instant; the title dolly stops; screen shake slider set to 0 but editable; tilt-shift unchanged |
| See | `Text size` **[new text]** | `Normal` / `Large` / `Larger` (100 / 115 / 130 %) | multiplies every size in §2.1.3; the HUD reflows: chips wrap to two rows, the dialogue box grows to 160 / 140 px, the prompt pill wraps, the compass strip is unchanged, pages scroll |
| See | `High-contrast telegraphs` **[new text]** | ON / OFF | telegraph outlines 3 px with a 1 px `#0B0E1A` underlay, hatching density ×1.5, fill alpha +0.15 (shape + colour are already colourblind-safe; this adds edge contrast for low vision) |
| See | `Particles` | `LOW` / `MED` / `HIGH` (canon) | `particleMul` 0.3 / 0.6 / 1.0 |
| See | `Quality` **[new text]** | `Auto` / `Low` / `Medium` / `High` / `Ultra` | Brief §7.4 presets; `Auto` detected at boot |
| See | `Subtitles` **[new text]** | ON / OFF, default ON | cutscene and in-flight captions and the sheltering caption (§2.4.11); dialogue is always shown |
| Hear | `Master`, `Music`, `Effects`, `Ambient`, `Dialogue` **[new text]** | sliders 0–100 % | the five buses audio.md must expose; `M` mutes `Music` with the canon announce |
| Controls | `CONTROLS` (canon head) | §2.6.4 | rebinding, `Layout` on touch, `Reset to Defaults` |
| Data | `Export settings` / `Import settings` **[new text]** | file | settings and bindings as one JSON, same flow as saves (§2.9.2) |

Screen-reader hooks: every page is a `role="dialog"` with a labelled title; HUD chips carry `aria-live="polite"`, the announce channel `aria-live="assertive"`; buttons are real `<button>`s; focus is never trapped inside the canvas. The `prefers-reduced-motion` and `prefers-contrast` media queries seed the two toggles on first run.

### 2.8 Onboarding

Five minutes, woven into B1.2–B1.4 (story-beats): Liam wakes at the wreck, walks to camp A, frees Noah, walks to camp B, frees Collette. The seven canon steps keep their canon check conditions (SI §12.1) and render on the **tutorial bar**: bottom-centre at `H − 65`, `min(W − 40, 560)` × 34 px, `ui.night` at 60 %, radius 8, Nunito 700 15 / 14 px `ui.cream` pulsing `0.85 + 0.15·sin(3t)` (v27), a `achieve` 0.15 chime on each advance (v27), and a small `ui.accentGlow` tick that draws itself when the step completes (0.3 s) before the next slides up. The step-7 timer runs on the sim clock at 5 s (v27's `1/60` per frame is retired). Each step is dismissed only by its check; there is no close button, because the check is the lesson.

| # | Canon message (keyboard, verbatim) | Pad variant **[new text]** | Touch variant **[new text]** | Fires | Done when |
|---|---|---|---|---|---|
| 1 | `🎮 WASD to move (or drag left side on mobile)` | `🎮 Left stick to move` | (the canon line: it names the drag) | CS-01 ends, Liam stands | Liam 2.5 m from the start (v27 100 px) |
| 2 | `⚔️ Click to attack enemies!` | `⚔️ Press A to attack enemies!` | `⚔️ Tap the sword to attack enemies!` | the first goblin at camp A's edge wakes | `gameStats.kills ≥ 1` |
| 3 | `🔑 Walk to the cage to rescue your sibling!` | same | same | camp A's cage is in `vis.radius` | `sibs ≥ 1` (Noah) |
| 4 | `👥 Press 1-4 to switch heroes` | `👥 Press the D-pad to switch heroes` | `👥 Tap a portrait to switch heroes` | Noah is freed; his portrait ring lights | a swap happens (`tutorial._switched`) |
| 5 | `⬆️ Choose a card to level up!` | same | same | `teamLv` about to reach 2 (the first camp's XP lands here by design) | `teamLv ≥ 2` |
| 6 | `🌳 Press T to open Skill Trees` | `🌳 Open the Squad page to spend your point` | `🌳 Tap the pause chip, then Squad` | the level-up page closes | the Squad page opens (`tutorial._openedTree`) |
| 7 | `🗺️ Explore the biomes! Check the minimap.` | same | same | camp B's cage opens (Collette) | 5 s on the sim clock; the compass strip and the map tab glow `ui.accentGlow` for those 5 s so "minimap" points at the strip's successor |

Around the steps, once each, on the tutorial bar's slot when it is free (all **[new text]** unless canon): `Find and rescue your siblings!` (canon, B1.2, 4 s, the announce channel); the controls hint strip (canon, once, 8 s, live keys); `💡 Press I to open Inventory and equip your gear!` (canon, first gear, 1.5 s late as v27); `A shape on the ground is an attack. Shift to dodge.` (the first telegraph seen; the dodge key live); `Both ultimates are ready. Hold Q to pick a partner.` (the first legal combo; heroes.md asked for it); `Ed's plane can fly you somewhere new.` (B2.4, at the strip); `Bounties pay gold. Claim them here.` (the first board). Each shows for 6 s or until its action happens.

The experienced player: `Tutorial` OFF hides the seven and the seven hints; NG+ starts with the tutorial off (story-beats B4.1); a loaded save with `tutorial.active = false` shows nothing; the `DEV_MODE` start uses `Shadow Citadel is ready!` (canon) and step 7. The five-minute target is measured by the smoke harness: a scripted first-timer at 60 % of hero speed reaches step 7 by 4:40.

### 2.9 Save, load and multiplayer

#### 2.9.1 Slots and the Saves page

Three manual slots plus autosave (v27), the `localStorage` keys kept (`ssq_save_1..3`, `ssq_autosave`, `ssq_meta`, `ssq_settings`, `ssq_keybinds`), `SAVE_VERSION` continuing from 10 with the migrations story-beats and heroes.md add. The page: four photo-corner cards (`Slot 1`–`Slot 3`, `Autosave` **[new text]**; the canon `Slot N` / `Empty` strings), each with a 320 × 180 thumbnail captured from the game canvas at save time (JPEG, ≈ 20 KB, stored in `ssq_meta`), the crest at that save's `crest.level` as a stamp, and a Lora Italic caption: `Lv N · N/3 siblings · N dungeons · N quests · <difficulty> · NG+N · M:SS · <date>` from `ssq_meta`. Buttons `SAVE` / `LOAD` / `DEL` (canon, all-caps kept). Confirms as in-page dialogs: `Load Slot N? Unsaved progress will be lost.` with `Load` / `Cancel` **[new text]**; `Delete Slot N? This can't be undone.` **[new text]** with `DEL` / `Cancel`; `Save before returning to title?` `(OK = Save & Quit, Cancel = Quit without saving)` shown verbatim as the body with the buttons `Save & Quit` / `Quit without saving` **[new text]** (the words the canon line itself uses) and an `×` to stay. Announces verbatim: `Game saved to Slot N!`, `Overworld saved to Slot N (dungeon progress not saved)` (a save inside a dungeon or Home, Wrong writes the entry snapshot, v27 kept), `Save failed!`, `Save failed! Storage may be full.` (plus the direction `Storage is full. Delete a save or export one.` **[new text]** as a second line), `No save in Slot N`, `Incompatible save`, `Loaded Slot N`, `Load failed!`, `Resumed auto-save`, `Slot N deleted`, `Auto-saved`. Autosave points: v27's (cage rescue +500 ms, every fifth team level, King's death, Queen's death +2 s, dungeon exit +1 s, NG+ start +1 s) plus camp rest +500 ms (camp.md), every island landing, and the portal entry; a small `Autosave` **[new text]** chip fades in at the top-right for 1.5 s with a pencil-tick icon.

#### 2.9.2 Export and import (Brief §7.1)

`Export to file` **[new text]** on every slot card downloads `stewart-squad-slot-N-YYYY-MM-DD.json` (the save JSON with `version`, pretty-printed so a kid in 2045 can read it) via a Blob URL; `Saved to your downloads.` **[new text]**. `Import from file` **[new text]** on any card opens a file picker (`<input type=file accept=.json>`; on iOS the Files sheet), validates `version` and the top-level shape, runs `migrateSave`, writes the slot, announces `Imported into Slot N` **[new text]`; errors: `That file isn't a Stewart Squad save.` and `This save is from a newer version. Update the game to load it.` **[new text]**. Both work offline; no network, no account. The archival single-file build has the same buttons.

#### 2.9.3 Multiplayer strings and the lobby

The title's `🤝 Multiplayer (LAN Co-op)` fold-out: `📡 HOST GAME`, `🎮 JOIN GAME`, a `CODE` field (four characters, uppercase, validated with `Enter a 4-character room code`), `JOIN`, the server field defaulting to `ws://localhost:3000` with the caption `Server URL (LAN default)`, a status line (`Hosting on <url>` **[new text]**, `Room created: <code>`, `Joining…` **[new text]**, `Connected to game!`, `Could not connect to server`, `Connection error`). In play, on the announce channel in `ui.announce.gold` unless noted: `Player N joined!`, `Player N spectating dungeon`, `Player disconnected`, `PN disconnected — 30s to reconnect`, `PN reconnected!`, `PN can't take host's hero`, `PN: hero taken by another player`, `<HERO> → PN`, `You control <HERO>!`, `Block: host is in dungeon`, `Game is in a dungeon`, `No hero available for Player N`, `Requesting <HERO>...`, `<HERO> is controlled by another player`, `<HERO> is controlled by PN`, `Disconnected from host` (`ui.announce.hurt`), `Waiting for host to start...` (the guest's title-page status), `PN reviving` (a world label over the reviver). Nameplates `P1 <HERO>` … `P4 <HERO>` as billboards (§2.4.15) with a numbered badge in `ui.player.pN`; the same badge sits on the portrait. Guest-blocked actions show `Waiting for host…` **[new text]** on the prompt pill (the rest, the destination card, the level-up); the rest prompt with a player more than 6 m from the fire shows `Everyone to the fire.` **[new text]** (camp.md). Guests get their own bindings and settings; the host's pause is §2.6.6. Player colours never read as a hero's: cream, turquoise, olive-lime, ice blue (§2.1.2), and the number is the identity.

### 2.10 The crest

What it depicts is only props and places (Brief §2(b)): the fire, the four stars of The Squad constellation, the biplane, the pines. No faces, no initials, no motto. One inline SVG (`src/ui/crest.svg`, ≤ 40 paths) with four `data-level` states; the same shapes are the door plaque's relief (≤ 120 tris, vertex colour, camp.md #53) and the banner's cloth texture (the one texture at camp, camp.md #52).

| `crest.level` | Flag | What appears | How it draws |
|---|---|---|---|
| 1 | new game (C1) | a rope ring (a lasso, the camp's boundary) and a small campfire at the centre: three logs, one flame, pencil-weight lines, no fill | ink on paper; on the banner cream on teal-slate `#2B5F6B` |
| 2 | `squadAssembled` | four stars in a row above the fire (The Squad), the first filled, the rest outlined; the flame gains a second tongue | the stars draw in one by one, 0.3 s apart, when the page or plaque is next seen |
| 3 | `edQuestComplete` (`The Green Meanie lives again!`) | the biplane arcs over the stars from left to right, a dotted smoke line behind it; two pine silhouettes flank the ring; all four stars filled | the plane's arc draws over 0.8 s |
| 4 | `shadowQueenDefeated` | the flame fills gold (`ui.gold`) with a halo, the ring becomes a wreath of pine and the pinpoints of the other four constellations (The Biplane, The Lantern, The Campfire, The Meteor) appear inside it; the stream's turquoise `#2EB8A6` runs as one band under the fire | the halo breathes at 0.2 Hz on the pause page only |

Where it appears: the pause page's top-left corner (96 px), every save-slot card (48 px stamp), the title page above the title (64 px), the Achievements page header, the photo-mode `Scrapbook` frame's corner at 40 % (watermark), the loading page, the banner from C6 and the door plaque from C5 (camp.md). NG+ keeps level 4. The plaque and banner update when the squad next comes within 35 m, on camp.md's build-in rhythm.

### 2.11 Photo mode (UI only; camera rules are cutscenes.md's)

Entry: `H`, the pause page's `Photo mode`, or the migration/aurora/meteor prompt chip. The sim pauses, the HUD hides, the letterbox is off, and a bottom strip (`ui.night`, 72 / 64 px, tabs 44 px) appears with, left to right:

| Control | Behaviour |
|---|---|
| `Pose` **[new text]** | a radial of camp.md §2.10's family poses (`Hearth`, `Porch`, `Dock`, `The plane`, `Squad`, `Not scared`, greyed when their place or stage is absent) and, per kid, their victory clip, three emotes and seated idle; the fox and Sugar sit within 2 m when a pose begins; pose props (swing, hammock, blanket, spot stones) offer a pose when the camera's focus is within 3 m |
| `Filter` **[new text]** | `None`, `Golden hour` (the Forest grade at full strength plus a 0.15 warm lift), `Aurora` (the Frozen grade: cool shadows, a green-to-magenta split in the highlights), `Ember` (the Shadow grade: crushed violet shadows, ember highlights); three, no more; each is one LUT already in the post stack |
| `Frame` **[new text]** | `None`, `Photo corners` (the four corners and a 24 px cream border), `Scrapbook` (a paper border with a Lora Italic caption field, default `<place>, day N` **[new text]**, up to 40 characters, and the crest watermark) |
| `Focus` **[new text]** | tap or click sets the DoF focus distance; a slider sets the aperture within cutscenes.md's limits |
| `Tilt` **[new text]** | tilt-shift strength 0–100 %, default the island's |
| `Hide us` **[new text]** | hides the party (and the prompt strip for the shot) |
| `Take photo` **[new text]** | a 0.15 s white flash at 30 %, `photo.shutter` (audio.md); the frame is composited over the render at the render's resolution on a 2D canvas; a 320 × 180 thumbnail and the full PNG (or JPEG at 0.9 on mobile) go to IndexedDB `ssq_photos` (max 24, oldest replaced with a warning); `Saved to Memories.` **[new text]** |
| `Save to scrapbook` / `Download` **[new text]** | the two "share" actions: the Memories page's Photos tab, and a PNG download named `stewart-squad-<place>-<date>.png`; no network |

Camera: orbit within cutscenes.md's limits by the same inputs as play (RS / drag / `Z` `C`), zoom by wheel or `L3`; `Esc` / `B` leaves photo mode and restores the HUD and sim. Reduced motion changes nothing here except the flash (off).

### 2.12 The dev console

Ships in `dist/` and the archive (Brief §7.1: the smoke harness drives it; v27 shipped it hidden), invisible and inert until `Ctrl+Shift+D` or five taps on the build stamp within 2 s (v27). A fixed centred DOM panel, `#0B0E1A` at 95 %, a 2 px `#E8A838` border, Nunito 13 px, `z-index: 99999`, `max-height: 80vh`, three tabs `Console` / `Stations` / `Perf` **[new text]**. The canon strings of FC §12.10 stay verbatim (`God Mode: ON`, `All heroes healed!`, `DEV: Goblin King Phase N`, `Start a game first!`, `Teleported!` …). `DEV_MODE` (F2 or the taps) shows `🔧 DEV`, `DEV MODE — All content unlocked!` and the perf overlay (`FPS: N | Peak: Nms`, `E:N P:N Pr:N`, `Load:N% W:N Ad:N.NN`, canon, plus draw calls and triangles).

| Group | Commands (every design file's hooks, one API `window.__ssq`) |
|---|---|
| v27 quick tools (SI §20.1) | `god`, `heal`, `killBoss`, `unlockAll`, `lv <5\|10\|20\|n>`, `gold <n>`, `bossHp <pct>` |
| v27 scenarios and teleports (SI §20.2–20.3) | `goblinKing <1\|2\|3>`, `dungeonBoss <biome> <phase>`, `forestPlanted`, `desertCocoon`, `desertPhantoms`, `tp spawn\|crater\|ed\|portal`, `meteor` |
| v27 gear tools (SI §20.4) | `gear random <n>`, `gear clear`, `gear allRarities`, `gear rarity <r> <n>`, `gear legendaries`, `gear equip <key> <rarity>`, `gear loadout`, `gear overflow`, `gear frenzy`, `save roundtrip`, `gear strip`, `stat audit` |
| heroes.md §4.4 | `hero.set`, `hero.pose`, `hero.idleTimer`, `hero.emote`, `hero.skin`, `time.set`, `station <n>` |
| enemies.md §4 | `spawn <key> [n] [elite=<mod>] [tint=shadow]`, `spawn camp`, `spawn nest <key>`, `spawn cage <idx>`, `spawn guardian <key>`, `ai freeze`, `ai perception <m>`, `telegraph outline`, the enemy line-up station |
| bosses.md §4.5 | `boss spawn <key> [phase]`, `boss hp <pct>`, `boss block <name> [json]`, `boss cage expose [s]`, `boss intro <key>`, `boss squad`, `boss kidnap <idx>`, `boss plates <n\|s\|e\|w> break`, `boss station` |
| camp.md §4.4 | `camp.stage <0–7>`, `camp.buildin <n>`, `camp.rest dawn\|dusk`, `camp.sit`, `pet.spawn fox\|sugar\|hens`, `pet.trust <0–5>`, `deer.phase`, `clouds.freeze`, `card.hold`, `station <1–6>`, `scatter.seed`, `scatter.count` |
| npcs.md §4.5 | `ed.state`, `ed.phase`, `ed.fly flyover\|supply` (`DEV: Supply flyover launched!`), `crates <n>` (`DEV: N parachute crates dropped!`), `travel <island>`, `escort.spawn`, `escort.kill`, `npc.mood`, `dialogue.open <key>`, `merchant.restock`, `ed.moveTo rim\|fire\|plane` |
| world-events §4.5 | `clock.set`, `clock.speed`, `weather.set <key> [--now]` (`DEV: Weather → <name>`), `weather.strike`, `event.fire`, `event.list`, `aurora.force`, `animals.count`, `animals.flee`, `fish.bite`, `vis.radius` |
| story-beats §4 | `flag.set <name> [value]`, `flag.list`, `beat.fire <id>`, `quest.state <id> <state>` |
| this file | `ui.page <tab>`, `ui.hud show\|hide\|fade`, `ui.announce "<text>" [colour] [s]`, `ui.toast <achKey>`, `ui.prompt "<verb>"`, `ui.device keyboard\|pad\|touch` (forces glyphs), `ui.textScale <1\|1.15\|1.3>`, `ui.reducedMotion on\|off`, `ui.stringAudit` (lists every canon key never rendered this session), `ui.emojiAudit` (every emoji not in the subset), `photo.take`, `crest.level <1–4>`, `save.export <slot>`, `save.import <json>` |
| harness | `state()` returns a JSON snapshot; `tick(n)` steps the sim n fixed steps while paused; `screenshot(station)` resolves when the frame is captured; every command is a `window.__ssq.<name>` function so Puppeteer calls them directly; `Copy diagnostics` **[new text]** copies the F9 block |

`F9`'s diagnostic block (`Diagnostic → console (F12)`) stays. Every command that changes state announces its canon string where v27 had one. The console is excluded from the tab order and from screen readers until opened.

## 3. What preserves the magic

### 3.1 Recipe by recipe (ATMOSPHERE_RECIPES section numbers)

| AR § | Recipe | Kept, translated or replaced | Why the feeling survives at the gameplay camera |
|---|---|---|---|
| §19.1 | The shared torch oscillator: light and fire agree | **translated** to the HUD | the portrait rings and the ult ember breathe on the same `glow` token the hero's selection ring and spell light use (heroes.md §2.7.5), so the HUD's light and the world's light agree; nothing on the HUD has a colour the world does not have |
| §19.2 | Many simultaneous layers, each with its own motion signature | **kept, and the HUD stays out of its way** | the HUD is corner-anchored and fades to 35 % when idle; the book leaves 26 % of the frame as living world on each side; beams, bubbles and damage numbers are in-scene so the layers stack in depth instead of over a flat overlay |
| §19.3 | Ed's plane: incommensurate motion sources make an object a character | **translated** to the title page and the crest | the title is the live station S5 with the plane crossing on its own cadences, not a still; the crest's plane arcs in on its own 0.8 s while the stars draw on 0.3 s beats |
| §17.1 | Warm gold on cool navy; the three-step warm text ramp | **kept** as the HUD's whole palette (`ui.cream` / `creamSoft` / `creamDim` over `ui.night`) | the world's rule (warm lights on cool night) is the HUD's rule; nothing in the HUD is grey or white |
| §17.4 | The accent retints with the biome | **kept** as `ui.accent` / `ui.accentGlow`, cross-faded on landing | the ring's halo, the tabs and the compass north tick change colour when the island does: the UI belongs to where you stand |
| §17.2 | Gold-tinted glass panels | **replaced** by paper (pages) and night glass without blur (HUD) | glass over a diorama reads as a phone app; paper reads as the family's book; the warm tint survives as the paper's cream |
| §17.3 | `heroBob`, `btnPulse`, `glowTitle`, `pulseGlow`, `shimmer`, `bounceIn` | **replaced** by one page-turn, one reveal stagger and cooldown arcs | scattered animation is the template look; the one turn is the scrapbook's identity |
| §14 | Damage numbers: hue = who, size = how much, bounce = crit, outline | **kept** whole in-scene (heroes.md §2.5.12; colours are the `glow` tokens) | four kids' numbers stay sortable at one-eighth screen height because each is a hue the world already assigned to that kid |
| §13.1 | The letterbox: `#0B0E1A` bars, 0.8 s to the card, the back-out overshoot, the trembling still frame | **kept** (bosses.md §2.3); this file styles the card in Lora with the colour glow | the pause before the name is what makes it land; the serif makes the name a title, not a HUD label |
| §13.1 | The mini-boss popup, never letterboxed | **kept** at top-centre, 2.5 s, paper-less | the game does not stop for a guardian |
| §15.2 | The ult aura and hero-attached glows | **translated** into the HUD ring's ready flare and the ability rim | the ring flares when the aura does |
| §9.2 | The level-up burst and gold float | **kept** in the world; the level-up page is paper over it | the burst is seen through the page's margins |
| §6.1 | Fog of war as a disc | **replaced** by the map page's unlit paper (world-events cut the visual) | the mechanic survives as ink spreading across paper as the family walks, which is a scrapbook thing to watch |
| §16 | Hero drawing style: initial circles, HP slivers | **translated** into portraits from the rig and light rings | the portrait is the kid's own face from the model, so the HUD ages with the art |

### 3.2 Family-canon threads that survive

Every string in FC §12 is placed or explicitly cut with its reason (§2.5); the seven tutorial lines, the twelve tips in their story-aware order, the thirty-one achievements with their four Ed jokes, the sixteen skin names, every skill node, every level-up card, every merchant and bounty line, every save and multiplayer line, `👥 Siblings: N/3`, `⚡ ULTIMATE READY — <key>` with its key finally right, `RESCUE!`, `HIT CAGE!`, `CAGE — HIT NOW!  [N captured]` with its two canon spaces, `Well-Ed-ucated` and `Ed's Landing` as paper stamps, the `dessert` typo on a card a kid can reread. The family's colours are the HUD's colours (heroes.md); the crest is the family's things and nothing about the family's faces; the copy borrows Ed's deflection and never claims a fact the canon does not.

### 3.3 What a kid will recognise from v27

The gold `⬤ 123g`, the sibling counter counting up, the boss bar at the top with its dividers (now pips), the letterbox with the name sliding in, `Achievement Unlocked!` sliding in from the right, the `▶` pulsing in the dialogue box, the three level-up cards with `1/2/3`, `Press T to close` under the skill trees, `💰 Drag here to sell`, the bounty board's `!`, `Press SPACE to skip`, the pulsing `RESCUE!` over a cage, the same keys under the same fingers, and Grandpa Ed's face in the corner of the dialogue box, now the same face that flies the plane.

## 4. Build notes for implementers

### 4.1 Assets

| Asset | Source and size |
|---|---|
| `assets/fonts/Nunito[wght].woff2`, `Nunito-Italic[wght].woff2`, `Lora[wght].woff2`, `Lora-Italic[wght].woff2` | Google Fonts releases of the OFL families, Latin subset via `pyftsubset` (`--layout-features='*' --unicodes=U+0000-00FF,U+2000-206F,U+2190-21FF,U+25A0-25FF,U+2600-27BF`), ≈ 410 KB total; licences copied into `assets/LICENSES.md`; **Rule 2 gate:** the render engineer loads each with `FontFace` in three browsers and confirms the variable axis before bundling |
| `assets/fonts/NotoEmoji-Subset.woff2` | Noto Emoji (monochrome, OFL) subset to the 74 code points listed by `ui.emojiAudit` at build time; ≈ 30 KB; the audit test fails the build if a canon string uses an emoji outside the subset |
| `assets/ui/paper-grain.png` (128 × 128 grey noise, ≈ 2 KB), `assets/ui/stamp-edge.png` (64 × 64, ≈ 1 KB) | generated in-repo by a script (CC0 by construction) |
| `src/ui/icons.svg` | one sprite: 12 ability symbols, 22 compass-pip icons, 6 page icons, Xbox and PlayStation glyph sets (16), the key-cap frame; ≤ 60 KB |
| `src/ui/crest.svg` | ≤ 40 paths, four levels by `data-level` |
| Portrait atlas | rendered at load (npcs.md §2.1.7); bestiary renders 256 px tiles into a second 2048 atlas at first open, cached for the session |
| Damage-number glyph atlas | rendered at load from Nunito 900 into a 1024 × 256 canvas texture, SDF not required at these sizes |
| Loading render | `assets/ui/loading-c1.jpg` (640 × 360, ≈ 40 KB) bundled for the first boot; later boots use the last save's capture |

### 4.2 Materials, lights, draw calls

The UI adds **zero** lights. In-scene UI costs: damage numbers 1 draw call (instanced quads, one atlas); nameplates, HP bars, world labels and bubbles 1 draw call (a second instanced text pass from the same atlas plus a 9-slice pill); beams ≤ 12 visible at 2 quads each on the additive bloom layer, culled at 120 m, 1 draw call via `InstancedMesh`; base rings and the lock-on reticle in the shared decal pool (enemies.md's 16 + 8 for UI); the selection and revive rings are heroes.md's. DOM: the HUD is ≤ 40 elements with `will-change: opacity` on the fading cluster only; pages are built once and toggled with `display`; no `backdrop-filter` below High; the page-turn is a single composited transform. Budget: ≤ 2 ms of main-thread layout per frame with a page open (measured by the perf overlay's `UI` line, new).

### 4.3 Where it lands (Brief §7.3)

| Piece | Folder |
|---|---|
| Tokens (§2.1.2), type scale, the accent map | `src/style/ui.ts` (serialize with anything touching `src/style/`) |
| Canon UI strings, cut list, new strings | `src/content/canon/ui.ts`, `src/content/text/new.ts`, `src/content/text/cut.ts` (kept as data so the orphan test can see them) |
| HUD components | `src/ui/hud/` (`party.ts`, `abilities.ts`, `compass.ts`, `chips.ts`, `tracker.ts`, `bossBar.ts`, `cage.ts`, `announce.ts`, `notify.ts`, `toasts.ts`, `dialogue.ts`, `prompts.ts`, `dungeon.ts`, `cards.ts`, `wheel.ts`, `radial.ts`) |
| Scrapbook | `src/ui/book/` (`book.ts` (spread, turn, tabs, focus), one file per page) |
| In-scene text and beams | `src/render/ui/` (`textAtlas.ts`, `numbers.ts`, `labels.ts`, `beams.ts`) |
| Input | `src/engine/input/` (`intent.ts`, `keyboard.ts`, `gamepad.ts`, `touch.ts`, `bindings.ts`, `buffer.ts`, `device.ts`) |
| Save, export | `src/engine/save/` (`slots.ts`, `meta.ts`, `exportImport.ts`, `photos.ts` (IndexedDB)) |
| Photo mode | `src/ui/photo/` |
| Dev console, stations, perf | `src/dev/` (`console.ts`, `commands/*.ts` one per owner file, `perf.ts`) |
| Fonts, icons, crest | `assets/fonts/`, `src/ui/icons.svg`, `src/ui/crest.svg` |

### 4.4 Phases (Brief §8)

Phase 1 (pilot): `src/style/ui.ts`, the fonts, the title card, a HUD stub (party strip with one portrait, compass strip, chips), the prompt pill, the dev console with stations and perf. Phase 2: everything in §2.2–2.4 and §2.6–2.9 needed for the Forest slice (all pages except Fish, Pets, Photos; the boss bar and cage overlay; onboarding; keyboard, pad, touch; saves with export). Phase 3: the destination card, the sky map, island accents, the dungeon meter for three dungeons. Phase 4: Memories, Photos and photo mode, the crest's levels 3–4, Fish and Pets pages, the constellation and catch cards, the finale's kidnap bar. Phase 5: multiplayer strings and lobby, the audio buses' sliders live, the accessibility pass, text-scale QA on a phone.

### 4.5 Test hooks

- **Vitest (`tests/unit/ui/`):** every FC §12 key is rendered by some component or listed in `cut.ts` (`strings.coverage.test.ts`); every emoji used is in the subset; prompt templates reproduce the canon strings under default keyboard bindings for all ten canon `[SPACE]` / `Press SPACE` forms; `Press key...` rebinding keeps second defaults and refuses collisions; the intent record from a scripted keyboard, pad and touch sequence is identical; the announce stack never exceeds two and honours durations; the boss bar's pips land at the thresholds bosses.md lists; the compass priority order matches story-beats §4; `crest.level` follows its flags; save export → import round-trips a v10 save through every migration; the tutorial steps fire in order with the v27 checks.
- **Smoke (`tests/smoke/`):** open every page and screenshot it at 1920 × 1080 and 390 × 844 at text scale 100 / 130 %; a 20-minute scripted session asserts the HUD fades and restores; the five-minute onboarding run; the photo-mode capture produces a PNG of the render size.
- **Art-director stations:** `station hud` (S1 at golden hour with the full HUD and a prompt), `station book` (the pause page over S1), `station boss` (the King's intro card frame), `station phone` (390 × 844 with the touch cluster), scored on rubric criterion 9 (UI integration) from Phase 1.

### 4.6 Perf risks and mitigations

| Risk | Mitigation |
|---|---|
| `backdrop-filter` on the book's dim layer costs 4–8 ms on integrated GPUs | High and Ultra only; below, a plain `ui.nightDeep` dim |
| Per-frame DOM writes for rings and arcs | `requestAnimationFrame`-batched, only when a value changed by ≥ 1 %; conic arcs via `conic-gradient` on a `mask`, no SVG re-layout |
| Text scale reflow | precomputed layouts for the three scales; switching is a class swap |
| The damage-number atlas on mobile | 512 × 256 at the mobile preset; sizes clamp at 28 px |
| Beams overdraw at the camp (12 lanterns, 3 quests, 2 events) | additive quads are cheap; cull beyond 120 m and merge into one `InstancedMesh`; ≤ 12 visible |
| Portrait atlas render at load | 16 tiles for the kids and Ed on the first frame, the rest deferred to idle time; the bestiary atlas on first open |
| IndexedDB photo writes | off the frame, `requestIdleCallback`; 24-photo cap |
| Fonts blocking first paint | `font-display: block` for Lora and Nunito with a 1 s `FontFace.load()` before the title fades in; the loading page uses the same fonts, so the first frame is never the fallback face |

### 4.7 Build order

1. `src/style/ui.ts` tokens and fonts; the Rule 2 font gate; the emoji subset and audit.
2. The input layer with the intent record and the buffer; keyboard, then pad, then touch; the device switch and prompt glyphs.
3. The prompt pill and the title card (the pilot's two UI pieces), the HUD stub.
4. The party strip, ability icons, chips, compass strip, quest tracker, idle fade.
5. The announce channel, notifications, toasts, the tutorial bar.
6. The dialogue box and bubbles on the atlas.
7. The book: spread, tabs, turn, focus; then pages in the §2.2.2 order, transient pages last.
8. Boss bar, cage overlay, kidnap bar, dungeon HUD and the meter slot.
9. Saves with export and import; settings and accessibility; remapping.
10. In-scene text: damage numbers, nameplates, HP bars, labels, beams.
11. Photo mode, the crest, Memories, Fish, Pets.
12. The dev console's command surface as each owner file's system lands; the harness contract first.

## 5. Cross-references and conflicts

### 5.1 Earlier design files, and exactly what was taken

| File | Taken |
|---|---|
| heroes.md | §2.0 the summary card (names, `base` / `dark` / `accent` / `glow` tokens, heights); §2.1.1 the tokens used for rings, names, bubbles and numbers; §2.2.1 the role labels `Tank` / `Ranger` / `Mage` / `Whirlwind`; §2.2.2 `Dodge` (prompt) vs `Dodge Roll` (signature slot); §2.4.6 the three emotes per kid and the 60 s per-line cap; §2.5.3 the verbs and inputs (kept as the keyboard defaults and the pad face buttons); §2.5.8 the combo tap default, the 0.2 s hold radial, the 1.4 s beat's letterbox and card; §2.5.11 the captured-hero rules and `Switching to <HERO>!`; §2.5.12 the damage-number colours and the white fallback ladder; §2.7.5 the selection ring (not re-specified) |
| enemies.md | §2.6 elite names and pennant tells for nameplates; §2.7 the un-letterboxed popup card, the 80 × 8 guardian bar; §2.10 the bestiary card contents and the "never rename `Mini-Boss Slayer`" rule; §4 the reduced-motion telegraph rule and `particleMul`; §5 floating names for elites and guardians only, HP bars while hurt, `mapEnemies` pips, telegraph accessibility |
| story-beats.md | §2.1 B0.1 the title over C6 with the plane; §2.2 the seven island title-card lines; §2.7 the two camp cards and Quartz's subtitle; §2.8 endless cut, bounties at every hub; §4 the compass priority order; §5 the tips rotation gates, `👥 Siblings: N/3`, the victory flow at B3.5, the active quest cap 4, `Press SPACE to skip` as the keyboard variant |
| world-events-weather.md | §2.2.5 `vis.radius` as the map reveal and pip gate; §2.5.2 the verbatim emoji-led event strings and their beam colours; §2.6 the constellation names; §2.7.2 the catch card, `Fish`, `It got away.`, `Nothing bites here.`, `Gone Fishin'`; §2.7.3 the constellation cards and the sheltering caption; §5.2 the clock and weather glyphs, `XP +50%`, the two `Storm Chaser`s, the `star shard` count, the photo prompt on migrations |
| bosses.md | §2.3 the intro grammar (the card is styled here, not re-timed); §2.4 the boss bar whole; §2.6.3 `boss.cage.state` and the cage sub-bar strings; §5.2 the popup cards for the Sentinel, the Phantom Warden and the squad, the lair cards, the `DUNGEON_EQUIPS` card, the `IMMUNE!` / `REFLECTED!` / `MISS!` floats, the reduced-motion variant; §5.3 item 9 (resolved in §2.4.7) |
| camp.md | §2.7.3–2.7.4 `Rest` / `Until dawn` / `Until dusk` / `Sit` / `Keep it` as live-binding prompts; §2.10 the six family poses, the individual poses, the posable props and photo-spot stones, the memory shelf roster and the loading-screen memory render from S1 (decided here: a cached capture, not a live render); §2.11.8 the title card's timing and placement; §2.12 station S5 as the title scene and what sits over it; §5.2 pet name plates (rendered by §2.4.15's nameplate rule: `Orange Meanie`, `Sugar` in `ui.creamSoft` within 6 m, never in dialogue), the fox's scrapbook card, the crest's banner material slot and door plaque, the constellation cards on the sit, the "camp" collision rule |
| npcs.md | §2.1.7 the portrait atlas (tile sizes, the eight Ed frames, the kids' three and their contexts); §2.3.3 the destination card's contents and its nine new strings; §2.6.1 beams by state with base rings in `ui` colours, the `icon` field kept as data (rendered as the Noto glyph); §2.7 the merchant overlay strings and restock; §2.11 the dialogue data shape, 120 cps, advance and hold-to-skip, the `▶` pulse, bubbles, captions, the log page; §5.2 the `🐸 Familiar` label and bar, the `Fly` / `Talk` / `[SPACE] Trade` prompts, the memory items, the compass pips for the plane, the frog and the cairns |

### 5.2 What later files must pick up from this one

| File | Must pick up |
|---|---|
| **audio.md** | the five buses `Master`, `Music`, `Effects`, `Ambient`, `Dialogue` with the sliders in §2.7 and `M` muting `Music` (`Music: OFF` / `ON`); UI cues by name: `ui.page` (the page-turn), `ui.open` / `ui.close` (the book), `ui.tab`, `ui.focus` (a soft tick on focus moves, pad and keyboard only), `ui.confirm` (= v27 `equip` 0.3), `ui.cancel`, `ui.error` (v27 had none: a short low double-tap for `Not enough gold`, stash full, wrong hero), `ui.toast` (= `achieve` 0.3), `ui.announce.<colourToken>` (optional stingers; `hurt` and `alarm` get one), `ui.prompt.show`, `ui.swap` (heroes.md's chime), `ui.wheel.open` / `.pick`, `ui.radial.open` / `.pick`, `ui.cooldownReady` (once per icon), `ui.lowHp` (the ring's pulse), `ui.tutorial.step` (= `achieve` 0.15), `ui.save`, `ui.load`, `ui.export`, `photo.shutter`, `dlg.blip.<who>`, `dlg.advance`, `dlg.skip`, `card.title` (a soft chord on a title card), `card.catch`, `card.constellation`; the bounty-complete cue camp.md and npcs.md asked for (`questComplete`); silence rules: no sound on idle fade, on chip changes, on compass pips |
| **cutscenes.md** | the caption contract: `{ speaker, portraitFrame, text, t0, t1 }` rendered by §2.4.11's caption strip (bottom-centre above the bar, Nunito 500 18 / 15 px, portrait 48 px), gated by `Subtitles`; the letterbox contract: bars `#0B0E1A`, 60 px at 1080p (5.6 % of height), 0.5 s in ease-out / 0.4 s out ease-in, `z` 55, the card slot at `z` 56, `Press SPACE to skip` (live key) at 12 px `rgba(255,255,255,0.4)` centred above the bottom bar (AR §13.2) from 2 s in on skippable cutscenes and never on the boss intro or the combo beat; photo mode's camera limits (orbit yaw free, pitch and distance ranges, DoF aperture range) which §2.11 assumes and does not set; CS-01's `Tap to skip` on touch; the closing card of CS-10 uses the title's Lora treatment |
| **dungeons.md** | the one **mechanic meter** slot and its `dungeon.meter` shape (§2.4.13), with the per-dungeon meters named there and the rule that a second instance needs a §6 line; the entry card on bosses.md's timeline with `DUNGEON_NAMES` over `<BIOME> DUNGEON`; the room-transition iris and `Room N/M`; the paper minimap's data (`{visited, type, pos, locked, cleared, boss}` per room); the ability-room verbs `Smash` / `Shoot` / `Channel` / `Break` and `Channeling... (N more)` as the meter; district cards for the Rootways, the Witch's Lanterns path, the Observatory approach and the Sunken Pyramid (name only; a line needs a §6 entry); where the canon `citadel` description lands; `room.visOverride` dimming the compass pips; lairs have no minimap |
| **heroes.md** (addendum, collected by the orchestrator) | none new; the pad map moves the emote wheel to View-hold (§5.3 item 1) |
| **KEEP_CHANGE_DROP.md** | §2.5.2's cut list with reasons; the v27 overlays superseded (canvas duplicates, the minimap, the edge-arrow compass, control modes, the touch legacy handler, glassmorphism keyframes) |
| **systems-engineer** | the intent record and buffer (§2.6), guests sending intents; the map coverage bitfield per island in the save; `ssq_meta` thumbnails; `ssq_photos` IndexedDB; the `Difficulty` change rule (§2.7) |

### 5.3 Conflicts found, and how this file designs around them

1. **heroes.md §2.5.3 puts the emote wheel on "D-pad down (hold)" while also using the D-pad for direct hero select.** A held D-pad down would delay or double the swap to Isabella. Designed around: D-pad down stays Isabella's direct select; the wheel is View-hold on pad (§2.6.2). heroes.md said "ui-ux.md owns the wheel," so this is an exercise of that ownership, logged in §6.
2. **Brief §4.5 lists `Q` / `E` for camera yaw; `Q` and `E` are canon combat binds heroes.md kept.** Designed around: right-drag plus `Z` / `C` (§2.6.1), with `C` freed by the control-mode cut. Logged.
3. **enemies.md §5 flags endless mode as unowned and §2.7 says "Endless mode may spawn any of the four."** Resolved by the orchestrator's cut (DECISIONS 2026-09-06); this file lists the endless strings as cut (§2.5.2). No edit needed here.
4. **bosses.md §5.3 item 9 (the Queen's card colour vs Collette's ring).** Resolved in §2.4.7: the bar and card keep `#A862C4`; during a kidnap targeting Collette the bar text darkens to `#7B3CA0`.
5. **camp.md §2.10 leaves "live render versus a cached capture" for the loading memory to this file.** Decided: a cached 640 × 360 capture at the last save (§2.3.17), so loading never waits on a scene.
6. **npcs.md §2.11 requests that the `NPC_DEFS` `icon` field be glyph or drawn at this file's call.** Decided: glyph from the Noto subset, tinted (§2.1.5), so the icon is the emoji a kid saw in v27.
7. **The Brief's "no all-caps labels" against canon all-caps strings (`SAVE` / `LOAD` / `DEL`, `CONTROLS`, `START ADVENTURE`).** Canon wins; §2.1.3 states the exception once. Not a conflict between files, recorded so no implementer "fixes" the case.
8. **`dungeons.md` and `cutscenes.md` had not landed.** Requests this file could not satisfy: the per-dungeon meter list and district lines (generic slot designed, §2.4.13); photo mode's camera limits and the caption timings (assumed, §2.11 and §5.2). Both files must confirm or amend by a §6 line of their own.

## 6. Decisions logged

- 2026-09-06 · phase-0.5/ui-ux · Two-worlds rule: every page is ink on paper (`ui.paper` `#F3E9D7` / `ui.ink` `#2B2118`), every HUD element is cream on navy glass (`ui.cream` `#FFF5E6` on `ui.night`), never mixed; the island accent is ink on pages and light on the HUD (`ui.accent.*` / `ui.accentGlow.*`) · Brief §6's scrapbook and AR §17's warm-on-cool identity are both kept by giving each its own surface · rejected: paper HUD chips (unreadable over snow and sand), glass pages (the app look).
- 2026-09-06 · phase-0.5/ui-ux · Typefaces: Nunito (UI, body) and Lora (titles, names, italic captions), both SIL OFL, bundled variable woff2, Latin subset; a monochrome Noto Emoji subset (OFL, 74 glyphs) as the icon set · warm, rounded, readable at 12 px, a serif with brushed curves for title cards and a pen-like italic for captions without a third family · rejected: Fredoka and Baloo (template kids' look), Quicksand (too light), Fraunces (size and wobble at caption scale), Caveat (a third family).
- 2026-09-06 · phase-0.5/ui-ux · Emoji rule: stored strings keep their emoji; at render the glyph is drawn from the bundled monochrome subset tinted to the text colour; OS colour emoji only as the Rule 2 fallback · deterministic in 2045 and designed rather than pasted; the strings stay verbatim · rejected: a drawn SVG per emoji (74 assets that would drift from what a kid remembers), stripping the emoji (edits canon), OS colour emoji (non-deterministic, template).
- 2026-09-06 · phase-0.5/ui-ux · Paper texture is one 128 × 128 noise PNG at 8 % multiply plus CSS gradients and a 64 × 64 stamp-edge tile; no `feTurbulence`, no `backdrop-filter` below the High preset · SVG filters re-render on every transform and cost 4–8 ms on a phone; the two tiles are 3 KB · rejected: pure CSS noise (impossible without filters), a large scanned paper texture (bitmap, not the flat style).
- 2026-09-06 · phase-0.5/ui-ux · One page-turn: 0.35 s `rotateY` about the spine with a paper backface, `cubic-bezier(0.4, 0, 0.2, 1)`, cross-fade under reduced motion; open 0.3 s fade-scale, close 0.2 s; the victory-stats row stagger is the only other page animation · Brief §6 "one orchestrated page-turn transition; no scattered animations" · rejected: v27's eleven keyframes, a 3D book model in the scene.
- 2026-09-06 · phase-0.5/ui-ux · Every full page pauses the sim, the bestiary included; the render clock (sway, water, cloth, torch and fire oscillators, live particles, an airborne plane) keeps running; guests' pages pause no one · CM §12 one rule; npcs.md §2.11's frozen-sim-live-render precedent · rejected: v27's bestiary exception, a fully frozen frame.
- 2026-09-06 · phase-0.5/ui-ux · Portraits from the rig-rendered atlas with a light ring in the kid's `glow` as the health display, an ult ember at 6 o'clock, an XP arc inside the track and an `hp / maxHp` chip only under 50 % or for 2 s after damage; the 200 px HP and XP bars and the name plate template are retired · Brief §6 "soft light rings for health"; the numbers still exist when they matter · rejected: bars beside the portraits, always-on numbers.
- 2026-09-06 · phase-0.5/ui-ux · The minimap and the edge-arrow compass are replaced by a 320 × 28 compass strip (pips by story-beats §4's priority, sized by rank, distance under the primary) and a map page drawn as unlit paper inked by `vis.radius`; `G` toggles the strip with the canon announce · Brief §6; world-events cut fog of war but kept `vis.radius`, which becomes ink spreading on paper · rejected: a corner minimap (the reference has none), a permanent objective arrow.
- 2026-09-06 · phase-0.5/ui-ux · The announce channel becomes a two-slot stack (newest on top, the previous slides down and fades) with each string's v27 duration and colour kept as `ui.announce.*` tokens; two hexes retuned: `#ff0000` → `#E8362A` for `THE GOBLIN KING APPEARS!` and `#00d2ff` → `#3AF0FF` for the spark plug · v27 dropped every announce that arrived within 2.5 s of another; pure red and pure cyan are the anti-palette's neon · rejected: a single slot (loses lines in boss fights), a scrolling log on the HUD (noise).
- 2026-09-06 · phase-0.5/ui-ux · Prompts render from the template `[<KEY>] <verb>` and the canon `[SPACE] …` / `Press SPACE to …` strings are the keyboard-default output of that template; pad shows glyphs, touch shows the verb on the ACT pill or the canon `⭐ ACT`; `ENTER PORTAL` stays a world label and the prompt reuses it · Brief §6 and heroes.md; no canon string is edited and no key is hard-coded · rejected: hard-coded canon strings (wrong after a rebind, wrong on pad), new "Enter portal" text.
- 2026-09-06 · phase-0.5/ui-ux · Camera yaw on keyboard is right-mouse drag plus `Z` / `C`, recentre `X`; the Brief's `Q` / `E` suggestion is not used · `Q` and `E` are canon combat binds heroes.md kept; `C` is free because control modes are cut · rejected: moving combo or signature off their canon keys, arrow keys for camera (they are movement).
- 2026-09-06 · phase-0.5/ui-ux · The three v27 control modes and their strings (`HYBRID`, `Controls: <mode>`, `C` → `Control Mode`) are cut; one camera-relative scheme with auto-attack as the canon `Auto-Aim` setting (made real) and click or tap to aim as the fallback · CM §12 and heroes.md §2.5.3 · rejected: keeping a mode cycle key.
- 2026-09-06 · phase-0.5/ui-ux · Full gamepad map on the standard mapping (LS move, RS yaw, A interact-or-attack, B dodge, X signature, Y ultimate, RB combo, LB swap, RT attack, LT lock-on, D-pad direct select, Menu pause, View tap map / hold emote wheel, R3 recentre, L3 zoom) with Xbox and PlayStation glyph sets chosen by pad id · Brief §6 full gamepad; CM §12's suggested face buttons kept; the emote wheel moves off D-pad down so Isabella's direct select is never delayed · rejected: heroes.md's D-pad-down hold (swap ambiguity), stick-click for the wheel (hard for small hands).
- 2026-09-06 · phase-0.5/ui-ux · Touch: a floating joystick (r 60 drawn and input, dead zone 0.15) plus Attack, Dodge, Signature, Ultimate and Swap buttons and the prompt pill as the ACT button, ≥ 44 dp with +8 dp forgiveness, safe-area insets, a repositionable `Layout` page; portrait 390 × 844 is the designed phone layout and landscape mirrors it; the legacy second touch handler and duplicate dungeon buttons are dropped · Brief §6; CM §12's verdicts; kids hold phones upright · rejected: landscape-only, a fixed joystick, v27's overlapping handlers.
- 2026-09-06 · phase-0.5/ui-ux · Input becomes an intent record per fixed step with a 150 ms buffer for attack, dodge, signature, ultimate, combo and interact; guests send intents through their own bindings · CM §12: the one-slot latch was the worst of both worlds; quirk 19 · rejected: raw key packets, no buffer.
- 2026-09-06 · phase-0.5/ui-ux · Remapping exposes every action with two keyboard slots and one pad slot, keeps second defaults, refuses collisions with `Already used by <action>` / `Swap`, and persists in `ssq_keybinds` with a versioned shape · v27 exposed twelve actions and destroyed the second key on rebind · rejected: single-slot rebinding.
- 2026-09-06 · phase-0.5/ui-ux · Blur, `visibilitychange` and gamepad disconnect flush every input and open the pause page (single player and host) with `Controller disconnected. Paused.`; guests flush only · CM quirk 11; a kid's hero should never walk off alone while they answer the door · rejected: v27's no handling.
- 2026-09-06 · phase-0.5/ui-ux · Settings keep the eight v27 entries with their canon labels (`Auto-Aim` now real, `Minimap` now the dungeon paper minimap, `World Zoom` as orbit distance, `Screen Shake` as a 0–100 % slider defaulting to 70 %) and add `Compass`, `Hold or toggle`, `Rumble`, `Camera turn speed`, `Invert camera`, `Reduced motion`, `Text size` (100 / 115 / 130 %), `High-contrast telegraphs`, `Quality`, `Subtitles` (default ON), five audio buses, `Difficulty` changeable outside boss fights and dungeons, settings export and import · Brief §6 accessibility list; canon labels stay so a kid's memory of the page holds · rejected: renaming `Auto-Aim` or `Minimap`, difficulty locked at the title (a parent should be able to ease a fight for a small kid).
- 2026-09-06 · phase-0.5/ui-ux · Reduced motion is one switch defined across files: telegraph sweep off with shapes on, no boss push-in / shake / roll, the combo beat without camera move or bars, particle velocity ×0.5, sway ×0.5, page-turn → cross-fade, announce slide and glow off, HUD fade instant, title dolly off, the shake slider set to 0 but editable · one toggle a parent can find; each owner file's rule collected · rejected: per-system toggles.
- 2026-09-06 · phase-0.5/ui-ux · Tutorial: the seven canon lines are the keyboard variants, shown verbatim; pad and touch variants for steps 1, 2, 4 and 6 are new text; step 7 keeps `minimap` verbatim while the compass strip and map tab glow; the step-7 timer runs on the sim clock; seven one-shot contextual hints (dodge, combo, plane, board, gear, the hint strip, `Find and rescue your siblings!`) sit around them; `Tutorial` OFF, NG+ and a finished save show none · Brief §6's five-minute tutorial for the kids' friends; canon text is never paraphrased so device variants are additions · rejected: rewriting the canon lines per device, a separate tutorial level.
- 2026-09-06 · phase-0.5/ui-ux · Saves: three slots plus autosave with 320 × 180 thumbnails and the crest in `ssq_meta`, canon buttons `SAVE` / `LOAD` / `DEL`, canon confirm bodies with buttons labelled from the words inside them (`Save & Quit` / `Quit without saving`), export to a pretty-printed JSON file and import via a file picker with migration, autosave chips at v27's points plus camp rest, landings and the portal; `Enter slot number to delete (1, 2, or 3):` cut · Brief §7.1 export/import; the confirm text is canon and its buttons should say what they do · rejected: `OK` / `Cancel` buttons under a body that explains them, clipboard export.
- 2026-09-06 · phase-0.5/ui-ux · Multiplayer player colours cream `#FFF5E6`, turquoise `#2EB8A6`, olive-lime `#9BB53C`, ice blue `#8FD3F4`, with the numbered `PN` badge as the identity and the colour secondary; every FC §12.7 string kept verbatim; `Waiting for host…` and `Everyone to the fire.` added for guest-blocked prompts · CM §12: `PLAYER_COLORS` collided with hero canon colours; no free hue is far from every hero token, so the number carries identity · rejected: v27's blue / green / orange / pink, hero-adjacent hues.
- 2026-09-06 · phase-0.5/ui-ux · The crest is a rope ring, a campfire, the four stars of The Squad, the biplane and two pines, wordless, in four levels keyed to new game, `squadAssembled`, `edQuestComplete` and `shadowQueenDefeated`, one SVG that is also the plaque's relief and the banner's texture · Brief §6 "a family crest that evolves"; props and places only (Brief §2(b)); the constellation motifs reuse world-events' names · rejected: a heraldic shield with initials, a motto, faces.
- 2026-09-06 · phase-0.5/ui-ux · Photo mode UI: camp.md's poses, three filters named from the island grades (`Golden hour`, `Aurora`, `Ember`), three frames (`None`, `Photo corners`, `Scrapbook` with a 40-character caption and the crest watermark), focus and tilt controls, `Hide us`, capture composited on a 2D canvas, stored in IndexedDB (24 max) as the Memories page's Photos tab, "share" = a PNG download plus the scrapbook page, no network · Brief §4.5 photo mode with family poses; the time-capsule rule · rejected: more than three filters, a free pose editor, any share target that needs a network.
- 2026-09-06 · phase-0.5/ui-ux · The dev console ships hidden in `dist/` and the archive (`Ctrl+Shift+D` or five taps), with every design file's hooks under one `window.__ssq` API that is the smoke-harness contract; its canon strings stay verbatim · Brief §7.1 headless tests driven through the console; v27 shipped it hidden · rejected: stripping it from production (breaks the harness contract in the archive), a visible dev button.
- 2026-09-06 · phase-0.5/ui-ux · Title page: the thirty feature chips and the `— V27 — GEAR & UI` label are cut (a `v1.0` build stamp replaces the label and keeps the five-tap dev toggle); the hero cards stand still; the tip rotation is story-aware; save slots show `Continue` · marketing chips name cut systems and are not canon; a bobbing card is the template look · rejected: keeping the chips as "history".
- 2026-09-06 · phase-0.5/ui-ux · The bestiary keeps its canon title `📖 BOSS BESTIARY` while holding enemies, guardians and bosses as sub-tabs; its photos are rig renders into a second atlas on first open · the title is canon; enemies.md's cards need a home · rejected: renaming the page.
- 2026-09-06 · phase-0.5/ui-ux · The boss name card and bar use Lora 700 at 0.01 em tracking; v27's 3 px letter-spacing is dropped · Brief §6 "no tracked eyebrows"; the serif makes the name a title · rejected: keeping the tracking (a template flourish).
- 2026-09-06 · phase-0.5/ui-ux · The achievement toast is a paper chip with photo corners, the one paper object over the world; quest notifications stay night-glass pills · an achievement is a page being added to the book; a quest tick is not · rejected: paper for every toast (the HUD would go beige), glass for achievements (loses the scrapbook tie).
- 2026-09-06 · phase-0.5/ui-ux · Dungeon HUD: a generic contextual mechanic meter slot (`dungeon.meter { label, value, max, colour, icon, state }`), a room-transition iris in place of v27's room-slide, the cleared-room minimap as a torn paper scrap, `Room N/M` and `🔑 N` verbatim; dungeons.md names the meters and may add a second instance only by a logged line · dungeons.md had not landed; one slot keeps the HUD quiet · rejected: waiting for dungeons.md, a per-dungeon HUD.
- 2026-09-06 · phase-0.5/ui-ux · The dialogue box borders and rings in the speaker's colour (NPC `ui`, hero `base` / `glow`) instead of v27's gold for everyone, with the atlas portraits and the kids' frame picked by context · npcs.md §2.11 and story-beats' colour rule; a kid reads who is talking from the colour before the name · rejected: gold for all.
- 2026-09-06 · phase-0.5/ui-ux · The Queen's boss-bar text darkens to `#7B3CA0` for the 4 s of a kidnap targeting Collette, otherwise stays `#A862C4` · bosses.md §5.3 item 9: the only moment the card colour and Collette's ring sit near each other with meaning · rejected: recolouring the card permanently.
- 2026-09-06 · phase-0.5/ui-ux · v27 canvas duplicates (`EQUIPMENT`, `Press P to resume`, the canvas victory buttons, the canvas controls rows except the two stat lines), the endless strings, `The world awaits — explore the Shadow Citadel!`, the glass keyframes, the legacy touch handler and the 120 px minimap are listed as cut for KEEP_CHANGE_DROP.md with reasons · story-beats' cuts and this file's supersessions, recorded once · rejected: silent omission.

## 7. Reconcile when the brainstorm doc lands

- If the brainstorm doc resolved the UI metaphor beyond "scrapbook" (a specific book, a photo album, a journal), align the page anatomy and the crest's placement with it.
- If it fixed a save-slot count, a difficulty policy (locked at the title vs changeable), or a lobby flow, those override §2.7's difficulty rule and §2.9.3's fold-out.
- If it named pet or memory collectibles beyond camp.md's, the Memories and Pets pages take its roster.
- If it resolved which emoji or icons the HUD uses, §2.1.5 follows it.
- If it set gamepad or touch layouts, §2.6.2–2.6.3 are reconciled to it with a §6 line.

## 8. Open questions for the orchestrator

None. No design here changes how a family member is portrayed beyond the canon: the crest is props and places, the copy claims nothing about a real person, pet names are camp.md's, and every canon line is verbatim. No missing input blocked the file; the two absent files (`dungeons.md`, `cutscenes.md`) are handled by the generic meter slot and stated assumptions in §5.3 item 8.
