# Phase 0.75 — the running tweak list

The single record of the design dialog (`PHASE_0.75_BRIEF.md`). Rows are appended during dialog sessions and applied to the design files only in the application step. Never edit a design file from this list by hand.

**Row format:** `T-nn · system · owning file §section · the change · why · status`. Statuses: `proposed` (raised, not yet decided), `agreed`, `parked` (not adopted; keep the reason so it is never re-argued), `needs-mockup`, `needs-render` (only the Phase 1 visual loop can settle it), `applied <date>`.

## Rows

| # | System | Owning file · section | Change | Why | Status |
|---|---|---|---|---|---|
| T-01 | Crystal Caves | `world-events-weather.md` §2.1 (new keyframe row), §2.7; `story-beats.md` §2.2; `ui-ux.md` §2.4.14 | Treat the caves as the fifth biome in everything but the plane: a full keyframe row instead of borrowed dungeon fog, its own animals and a peaceful-layer activity, its own title card; the "under-region" label becomes a travel rule, not a size rule. (`audio.md` already has its bed and music table.) | The v27 caves were one of the most beautiful and engaging parts of the game; the bible demoted them to a quarter-island detour with about five landmarks | proposed (2026-09-07) |
| T-02 | Crystal Caves | `dungeons.md` §2.7; `npcs.md` (Quartz); `camp.md` §2.3 (growth-stage pattern, by reference) | Make the darkness a mechanic: the family carries lamps to hooks, so lighting the caves is the caves' own growth stage, the way the camp grows; lit paths stay lit as the region's memory. Quartz's idle-lit lamps become the seed, not the whole system. | Idle-lit lamps are charming but passive; the caves' identity is light in the dark | proposed (2026-09-07) |
| T-03 | Crystal Caves | `dungeons.md` §2.7; `story-beats.md` §2.2; `bosses.md` §2.11 | Verticality: two or three tiers with the Depths at the bottom, sightlines across the void to the crystal heart pulsing far below, the Forest's roots as the ceiling; the descent is the spectacle | A cave under an island is the one place the diorama can go down; v27's caves felt deep | proposed (2026-09-07) |
| T-04 | Crystal Caves | `story-beats.md` §2.2 (`island.layoutScale`, footprint) | Grow the footprint from 180 × 120 m toward about 260 × 200 m, roughly a destination island | Content and layout decision, not an engine one; the current size is a detour, not a destination | proposed (2026-09-07) |
| T-05 | Volcanic Rift | `bosses.md` §2.12; `dungeons.md`; `world-events-weather.md` | Give the Rift the same treatment as T-01 to T-04 once the caves prove the pattern | The Rift went the same way as the caves (a small post-game lair under the crater) | proposed (2026-09-07); depends on T-01–T-04 |

## Mockups and references filed

| Date | File | Supports | Note |
|---|---|---|---|
| — | — | — | none yet |

## Dialog log (verbatim, newest last)

### Dialog 1 — the Crystal Caves and "under-region" (2026-09-07, end of the Phase 0.5 session)

**Andrew asked:** reading the docs, he noticed the Crystal Caves were done away with (along with one other), was sad because in the previous game the caves were one of the most beautifully stunning and engaging parts, and asked what "under-region" beneath the Forest island means, whether such regions will be robust with their own biome-like feel, deep, extensive and fun, more than just a dungeon to explore. He asked for the current state and ideas, nothing implemented, and proposed a Phase 0.75 dialog pass with a comprehensive list of tweaks applied systematically afterward, possibly with generated screenshots to iterate at a higher level before development.

**The orchestrator answered (verbatim):**

> Here is what the bible currently says, then my honest read on it, then the 0.75 idea. Nothing changed.
>
> **What "under-region" means right now**
>
> The Crystal Caves were not cut. They were demoted from a full island to a region hanging beneath the Forest island. The bible's reasoning was that the Brief fixes five room dungeons and the plane only flies to four islands, but the canon text (Quartz, the Golem, the Spark Plug quest, the Colossus lines) needs the caves to exist. So they became:
>
> - **A streamed open cavern, 180 × 120 m**, entered on foot down a stair at Lamplight Landing on the Forest island's south cliff, about 40 m below home. Not a room dungeon: lamp-lit paths, two crystal camps, the Golem's Gallery (the first mini-boss most players meet), a lore secret, and the Depths at the back.
> - **Its own light rule**, which is the one thing the bible protects hard: only Quartz's wall-lamps and Collette's magic light it. The lamps are lit one at a time by Quartz's idle, so the caves get brighter the longer the family is around. Every rim crystal brightens to double when a hero comes within 6 m. Dust and sparkle particles stay. No torches, no sconces.
> - **The Depths is a "lair"**, which is the bible's word for an open, re-enterable boss arena rather than a room dungeon: a 40 m cavern with one huge crystal heart whose pulse drives every rim crystal in the lair off one oscillator. The Colossus fights there, and the spark plug sits on its plinth.
> - The other thing you noticed is the **Volcanic Rift**, which went the same way: a small post-game lair under the crater, kept for the Magma Titan and the *Forged in Fire* lines.
>
> So the honest answer to "will it be robust?" is: as written, the caves are a real place with a real identity, but they are **mid-sized**, about a quarter of the Forest island, and they carry about five landmarks. That is a beautiful detour, not the destination the v27 caves were. Your instinct is right that the design under-sells them.
>
> **Ideas to make it better, all deferred**
>
> 1. **Treat it as the fifth biome in everything but the plane.** Give it a full keyframe row in `world-events-weather.md` (it currently borrows dungeon fog), its own ambient bed and music table already exist in `audio.md`, and its own animals, a peaceful-layer activity and a title card. The under-region label would then be a travel rule, not a size rule.
> 2. **Make the darkness a mechanic you play with, not just walk through.** Quartz's lamps lit by idle are charming but passive. Let the family carry lamps to hooks, so lighting the caves is the caves' own growth stage, the way the camp grows. Lit paths could stay lit as the region's memory.
> 3. **Verticality.** A cave under an island is the one place the diorama can go down. Two or three tiers with the Depths at the bottom, sightlines across the void to the heart pulsing far below, and the Forest's roots as the ceiling would make the descent the spectacle the v27 caves were.
> 4. **Grow it toward 260 × 200 m**, roughly a destination island's footprint. That is a `layoutScale` and content decision, not an engine one.
> 5. **Give the Rift the same treatment later**, once the caves prove the pattern.
>
> **On Phase 0.75**
>
> Yes to all of it, and yes to a new chat. The pattern I would suggest: we talk system by system, you say what felt thin, I answer from the files, and every agreed tweak goes into a running `docs/design/PHASE_0.75_TWEAKS.md` with the owning file and section. Nothing gets edited during the dialog. At the end, the `design-lead` agent applies the list file by file with logged decisions, exactly like the consistency pass. Concept screenshots are possible in that phase too: the pilot's screenshot stations can render mood studies before any real system exists, and the art director can score them. Start the new session with "Continue from docs/NEXT_SESSION.md, then open Phase 0.75 design dialog, starting with the Crystal Caves." I'll note the 0.75 plan in the handoff only when you tell me to, since you asked me not to change anything now.

**Andrew's reply:** loved the changes so far; asked for this to be committed to the handoff with the ideas saved in full, for effort-level suggestions per part of the 0.75 process (`PHASE_0.75_BRIEF.md` §5), and for a copyable prompt (`PHASE_0.75_BRIEF.md` §6). One correction to the answer above, made while filing it: the "pilot's screenshot stations" do not exist until Phase 1, so real rendered mood studies are a Phase 1 tool; before that the phase uses Andrew's screenshots and drawn concept boards (`PHASE_0.75_BRIEF.md` §3).
