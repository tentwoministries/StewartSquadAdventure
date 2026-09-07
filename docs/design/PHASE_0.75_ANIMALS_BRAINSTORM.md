# Animals and creatures: the brainstorm (Phase 0.75, Andrew's ask, 2026-09-07)

Andrew: *"a diverse set of animals, creatures, etc. (not too many that it bogs things down) … a pool of diverse things that can be present in each biome, with each having its own set of behaviors and animations. Keep it low-key but also an engaging part of the experience. Unique to each biome. Not necessarily a fixed number for each. You could make all those decisions."*

This is a Phase 0.75 dialog document, not a design file. It starts from what the bible already has, keeps everything in it that works, and proposes what is missing. Adoption is the tweak row T-14; the application step folds the agreed parts into `world-events-weather.md` §2.7.1 and `camp.md` §2.9.

## 1. What the bible already has (answered from the files)

`world-events-weather.md` §2.7.1 already specifies **26 species across the five islands**, with a shared rule set: at most 24 animals alive per island, one instanced batch per species (≤ 6 draw calls), ≤ 400 triangles each, three clips (idle/graze, walk, flee), seeded placement in habitat volumes, a 4–12 s graze then a 2–5 m walk at 1.0 m/s, flee radii, night sleep, no hitboxes, one idle call per species. Forest: deer, fox, rabbit, songbirds, butterflies, owl. Desert: fennec fox, lizard, beetle, vulture, tortoise. Bog: frog, heron, turtle, dragonfly, giant snail. Frozen: elk, snow hare, mountain goat, snowy owl, ptarmigan. Shadow: shadow deer. `camp.md` §2.9 adds the three pets (the fox `Orange Meanie`, Sugar the slime, the hens) with earned trust and real behaviours (the fox steals an apple each day).

**Honest read:** the roster is good and the budget is right. What it under-delivers is *behaviour*: every species runs the same graze → walk → flee loop, and only the fox and the pets have a moment that a kid would tell someone about. The reference game's UI calls its animal beats "small wonders"; that is the missing layer. And two places have no animals at all: the Crystal Caves (T-01 asks for them) and the Volcanic Rift.

## 2. The design rule (the decision)

**Every species gets one signature behaviour, one reaction to the family, and one clip that only it has.** Not more. Three things is what a ≤ 400-triangle animal with ≤ 4 clips can carry, and three things is enough for a kid to know a creature. The shared loop stays as the floor.

| Layer | What | Budget rule |
|---|---|---|
| **Floor** (bible) | graze/idle, walk, flee; night sleep | 3 clips, unchanged |
| **Signature** | one thing it does on its own that reads at gameplay distance every minute or two | 1 extra clip or a procedural bone motion |
| **Reaction** | one thing it does *because a Stewart is there*: approach, freeze, follow, perform, hide | uses the floor clips plus a look-at; no new clip |
| **Wonder** (a few species only) | one rare beat with a `+` in the scrapbook's Bestiary page: seen once, remembered | ≤ 1 per island per game day; a `memories` entry (`ui-ux.md` §2.3.7) |

Counts are not fixed per island; each island gets what its habitats can carry inside the 24-animal budget, and the caves and the Rift get fewer, stranger creatures. Nothing here is targetable, nothing drops loot, nothing is required by a quest (the peaceful layer stays peaceful: Brief §5.5).

## 3. The pool, island by island (bible species kept; ★ = new)

### Forest (home; the most populated, because the camp is where the family lives)

| Species | Signature | Reaction to the family | Wonder |
|---|---|---|---|
| deer (6) | grazes with an ear flick every 3–5 s; a slow 0.55 m/s wander inside a small patch (the demo's tempo, not the bible's 1.0 m/s: T-14) | freezes and looks up at 12 m; at 8 m bounds away with the tail flag up; **from C3, the camp deer stops fleeing Liam** (trust, like the fox) | at dawn, two deer cross the strip in silhouette against the sun (once per game day, from S3's camera) |
| fox (2) | trots the forest edge with the nose down; sits and watches the fire | the `Orange Meanie` trust ladder (`camp.md` §2.9) | steals an apple (bible); ★ a kit follows it in spring weather |
| rabbit (8) | hop, sit up, nose twitch (a scaled ear-bone wiggle) | scatters at 4 m; ★ one stays and sits up if the hero stands still 3 s | — |
| songbirds (12) | the 3-bird burst; ★ land on the scarecrow, the fence and the washing line | ★ perch on Liam's shield rim while he idles 10 s (the idle ladder's 30 s slot) | — |
| butterflies (20) | the slow flap on a lazy curve (`MOTION_TEMPO_NOTES.md`) | ★ one lands on Collette's staff orb and rides it until she casts | — |
| owl (1) | blinks; hoots at night | ★ turns its head to follow the lantern carrier | ★ the deep-night meteor shower: it looks up too |
| ★ **hedgehog** (2, dusk) | trundles along the path edge at 0.3 m/s; curls into a ball for 4 s when a hero runs past | uncurls if the hero crouches (sits) nearby | — |
| ★ **woodpecker** (1) | a 4-tap knock every 12–20 s on the big pine, with the sound (audio.md's Forest bed already has "birds") | — | — |

### Crystal Caves (T-01: the fifth biome needs its own life; dark, so every creature carries or catches light)

| Species | Signature | Reaction | Wonder |
|---|---|---|---|
| ★ **glow moths** (16) | orbit the lit lamps in slow loops; they *are* the light's motion | follow Collette's orb for 8 m, then return | — |
| ★ **cave salamander** (4) | pale `#E8DCC4` with `#6CE87A` spots that pulse on the crystal heart's oscillator; clings to walls; slides into pools | freezes; if a hero stands still 3 s it climbs 1 m closer | — |
| ★ **crystal beetle** (6) | a rim-lit dot that walks the crystal ridges; rolls a glowing shard | — | ★ once: a beetle rolls a shard to the family's feet (a Bestiary line) |
| ★ **blind cave fish** (8, the Depths pools) | silver flickers under the heart's pulse | scatter from the ring's light | — |
| ★ **bats** (1 colony, a particle burst) | hang under the tier ledges; a burst when a lamp is lit | the burst is the reaction | ★ lighting the last lamp on a tier sends the colony up across the void toward the heart |

### Desert

| Species | Signature | Reaction | Wonder |
|---|---|---|---|
| fennec fox (2, night) | huge ears turn to sounds (a 2-bone ear rig) | sits and watches from 10 m; approaches the campfire at the Nomad's camp | — |
| lizard (10) | dart-and-freeze | freezes 2 s, then flees (bible) | ★ does push-ups on a hot rock at noon |
| beetle (8) | rolls a pebble | — | ★ the pebble is the oasis flower's seed: where a beetle stops, a flower opens next dawn |
| vulture (3) | circles at 40 m with a shadow decal (bible) | ★ lands on the pyramid's lintel when the family enters; watches | — |
| tortoise (2) | 0.15 m/s; withdraws (bible) | ★ Isabella can stand on it (the Whirlwind's smallest ride) | — |
| ★ **camel** (1, the Nomad's) | sits, chews, blinks slowly; stands with the three-stage camel unfold | spits a sand puff if a hero sprints past twice | — |
| ★ **sand skink** (3, dunes) | swims under the sand: a moving ripple, then a head | — | — |

### Bog

| Species | Signature | Reaction | Wonder |
|---|---|---|---|
| frog (12) | sit-and-jump with a bubble ring (bible) | ★ one croaks back when the `Sugar?` emote plays | — |
| heron (3) | one-leg stance, slow lift-off (bible) | — | ★ spears a fish at dawn (a 0.4 s beat) |
| turtle (4) | the log that is not a log (bible) | slides off when approached | ★ a stack of three on one log |
| dragonfly (16) | particles (bible) | — | — |
| giant snail (1) | the landmark (bible) | ★ its eye-stalks follow the nearest hero | — |
| ★ **will-o'-wisp** (3, night) | a `#6CE87A` mote that drifts 1 m above the water and dims when looked at | leads a curious hero 20 m toward the Witch's porch, then goes out | the Bog's one creature that is a *little* spooky; family-friendly by being shy |
| ★ **swamp moth** (8, night) | slow flap around the witch-lanterns | — | — |

### Frozen Peaks

| Species | Signature | Reaction | Wonder |
|---|---|---|---|
| elk (5) | the migration herd (bible) with breath fog at night | the herd walks *around* a standing hero, never through | ★ crosses the frozen lake under the aurora once per game night |
| snow hare (8) | the hop; black ear tips (bible) | — | — |
| mountain goat (4) | climbs ledges (bible) | ★ bleats down at a hero below | — |
| snowy owl (1) | gold emissive eyes (bible) | — | — |
| ptarmigan (6) | explodes into flight (bible) | — | — |
| ★ **penguin colony** (6, the shore) | waddle, belly-slide down the same drift, waddle back up | one slides to a hero's feet and looks up | ★ they huddle when the blizzard hits |
| ★ **seal** (2) | lies on the ice; rolls over; slaps once | slides into the water at 5 m | — |

### Shadow Realm and the Rift (fewer, wrong)

| Species | Signature | Reaction | Wonder |
|---|---|---|---|
| shadow deer (3) | dissolves and reforms (bible) | — | — |
| ★ **ash sparrows** (8, Rift) | grey birds that perch on cold lava, wings edged `#FF6A2A` | flare and scatter when the crater pulses | ★ one is *not* grey: a real Forest songbird that followed the family (a Bestiary line for a kid who notices) |
| ★ **ember mites** (particles, Rift) | crawl the cooled crust as `#FF6A2A` dots | — | — |
| ★ **the mirror fox** (1, Home, Wrong) | the fox's silhouette in the `shadow` material, sitting where `Orange Meanie` sits | walks away when approached, always 12 m off | the cold camp's one "living" thing; it never comes to the fire |

## 4. Budget check

Forest 8 species (52 individuals, of which 32 are billboards/particles, 20 real animals → under 24); Caves 5 (moths and bats are particle-class; 18 real); Desert 7 (≈ 29, of which 10 lizards can be instanced 2-clip; real animals 19); Bog 7 (≈ 47, of which dragonflies, wisps and moths are particles; real 20); Frozen 7 (≈ 32; real 26 → trim the hare to 4); Shadow/Rift 4 (small). Draw calls stay at one batch per species (≤ 8 per island; the bible said 6, so this is a row). Clips: floor 3 + signature 1 = 4 per species; reactions reuse them.

## 5. Tweak rows

- **T-14** (this document): adopt the three-layer rule (floor / signature / reaction, wonders for a few); add the ★ species; give the Crystal Caves and the Rift their creatures; the deer's demo tempo (0.55 m/s wander in a small patch, a graze with a small head sway, ear flicks every 2.5–5.5 s) replaces the bible's 1.0 m/s; per-island batch cap 6 → 8.
- Open for Andrew and his son: which wonders to keep (they are the expensive ones: each is a short scripted beat), and whether the will-o'-wisp is too spooky for the youngest.
