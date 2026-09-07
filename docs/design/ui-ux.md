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

**Surface inventory.** `page` = a scrapbook page (paper); `HUD` = corner-anchored chips over the world; `world` = anchored in the 3D scene; `prompt` = the live-binding pill; `card` = a title-card family element. "Pauses" is the sim; the render clock never pauses (§2.2.7).

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
