# The four kids: notes for the demo rigs (Phase 0.75, 2026-09-07)

A Phase 0.75 dialog document, not a design file. `heroes.md` stays the authority for colours, roles, proportions and the kit; nothing here edits it. This is what Andrew's photos (`docs/reference/Kids/`, added 2026-09-07) and his notes say about each kid, read against the bible, and what the demo rigs do with it. Adoption is tweak row T-15; the application step folds the agreed parts into `heroes.md` §2.3.2 (hair) and §2.4 (animation personality). Andrew's words are quoted; everything else is the orchestrator's read.

## 0. What Andrew said (2026-09-07, verbatim where it matters)

- **Collette** "loves fashion, is highly creative and hilarious. She can be a zany goofball at times, and can crack up laughing but would be funny if she was a little bit like the level-headed sister too."
- **Liam** "is a steady emotionally intelligent and highly intelligent guy. He is highly strategic in his game playing."
- **Noah** "is a goofball with ADHD, but also can be chill and is super down to earth and situationally observant."
- **Bella** "is so cute but really likes to control situations … she is brilliant but we also made her a bit of a terror in the last game. She would spin and her arms would damage enemies."
- "All of our kids have great senses of humor."
- The photos are for "a general feel language"; "we don't have to incorporate too much at this point"; iterate later, before the gameplay implementation, "since there will be places their little personalities can shine in the game".

## 1. What the photos show (seven frames)

| Kid | Frames | Hair | Face | The thing you notice |
|---|---|---|---|---|
| Liam | `Liam1.png` | dark brown, straight, wet from swimming, falls forward | a huge, easy, wide-open grin; dark eyes; athletic build | he is *delighted*, not deadpan. The bible's "Cool. Cool cool cool." kid is the canon *voice*; the photo says the face under it is warm |
| Noah | `Noah1.jpg`, `Noah2.jpg` | sandy light brown, a long fringe that falls over the forehead and half-covers one eye | blue eyes, freckles across the nose and cheeks, braces, a head tilted mid-thought; in the second frame he is laughing with his whole face at a birthday present | the fringe and the freckles; and the laugh. A kid who is either thinking sideways or cracking up |
| Collette | `Collette and Daddy1.jpg`, `Collette2.png` | long, dark brown, loose, past the shoulders, often over one shoulder; a sparkly black bow headband | brown eyes, a calm, sure half-smile in one frame and a big grin in the other; a `SHINE` shirt and a Hello Kitty shirt | the headband bow and the composure. Fashion is real: she chose the bow. The "level-headed sister" is already in the first frame |
| Isabella | `Bella1.jpg`, `Bella2.jpg` | blonde, shoulder-length, side-swept bangs | big smile with all her teeth, then tongue out flat on the bed; a stars-and-stripes dress with two bows at the straps, sparkly gold shoes; Rapunzel pyjamas | bows on everything, gold shoes, and a face that has never once been shy |

## 2. Where the bible already agrees, and the three places it does not

`heroes.md` §2.3.2 was written from the v27 drawings without the photos. Read together:

| | Bible (§2.1.1, §2.3.2) | Photo | Demo rig does | Row |
|---|---|---|---|---|
| Liam's hair | three swept spikes, `#8B6914` (golden brown) | dark brown | keeps the three spikes (the silhouette rule) in **dark brown `#4A3220`** | T-15a: hair colour from the photo |
| Liam's face | flat low brows, eyes half-lidded when idle, deadpan | the widest grin of the four | keeps the low brows and the steady idle (that is the *leader* read at distance) and adds a **slow, real smile** every 12 s or so when a sibling is near or something good happens (a 0.06 m mouth curve, eased in over 0.4 s, held 2 s). Deadpan voice, warm face | T-15b |
| Noah's hair | half-cap with the green headband, a short tuft, `#5B3A1A` | sandy light brown, a long fringe over the forehead and one eye | **sandy `#A8865A`**, the green headband kept (canon green survives there), and a **fringe** of three flat wedges falling over the band and one eye | T-15c |
| Noah's face | one brow up, narrower eyes, head tracks points of interest | freckles, braces, blue eyes | **freckles** (five tiny quads across the nose and cheeks, readable only at the close-up) and **blue pupils** `#3A6EA8` for Noah alone; the one-brow-up and the tracking head stay: that is "situationally observant" made into a rule. The laugh becomes a **head-back open-mouth grin** every 9 s or so ("he just thought of something"), 1 s, then back to the brow | T-15d |
| Collette's hair | two high pigtails + two side buns, `#6B3A2A` | long, loose, dark brown, with a bow headband | keeps the **two high lobes** (the distance read the bible chose on purpose) but as **long tails** that fall to the shoulder blades and swing, in **dark brown `#3E2A1E`**, plus an **amber bow headband** (`accent`) in place of the side buns. Fashion shows: she is the only kid with a chosen accessory | T-15e |
| Collette's face | big eyes with a lash stroke, the only kid who smiles by default | calm half-smile / big grin | the default smile stays; the idle adds a **laugh** (both eyes squeezed, mouth wide, shoulders bouncing for 1.2 s) every 14 s or so, and between laughs she is the *composed* one: the smallest idle sway in the party. Goofball and level-headed, in turns | T-15f |
| Isabella's hair | big round volume, two bows, `#D4A03C` | blonde, side bangs, bows | **blonde `#E2C070`** (a touch lighter than the bible), the big round volume kept, the two bows kept in ruby with gold centres, plus **side-swept bangs** as one flat wedge | T-15g |
| Isabella's face | biggest eyes, brows down in combat and round outside it, squeeze-blink | all teeth, tongue out | the squeeze-blink and the round brows stay; the idle adds the **tongue out** (a tiny pink quad, 0.8 s) when she looks up at something, every 11 s or so; the **whirl** is her flourish (below) | T-15h |

Skin stays `#F2CBA7` for all four. Eyes stay white with `#2C3E50` pupils except Noah's blue.

## 3. Personality into motion (what the demo can already show)

The bible's idle ladder (§2.4.6) is kept whole; these are the rig-level touches the demo scenes carry so the family can see the kids *be* themselves before there is a game around them. Every one eases; nothing pops (`MOTION_TEMPO_NOTES.md`).

| Kid | Idle (what you see in 10 s) | Walk | The flourish on `X` (a demo key, one per kid) |
|---|---|---|---|
| Liam | feet planted, one weight shift, the head turns toward the nearest sibling or creature every 3 s and comes back; the slow smile | heavy contact, short swing on the shield side | sheathes, **taps the shield twice** with a knuckle, one slow nod. That is all. Strategic kids do not celebrate; they confirm |
| Noah | never still: weight shifts every 1.4 s, the bow hand re-grips, the head snaps to whatever moved last (a lizard, a moth, a fish); the open-mouth laugh; then, for a few seconds, perfectly chill | light, toes first, a small forward lean | **spins the bow once around the hand**, catches it, crosses his arms, one brow up. Told you |
| Collette | poised, heel to toe, the free hand traces a small circle every 2 s and the orb pulses; the long tails lag every turn of the head by 0.15 s; the laugh | the tails swing, the hem swings, the staff is carried upright | **staff twirl, plant, amber sparkle burst, hand on hip.** "And THAT is how it's done." |
| Isabella | leans on the hammer, rocks it, looks straight up every 3 s at something nobody else saw (tongue out), the cape is her biggest sway | a stomp on every contact; the hammer drags | **the whirl**: two full turns in 0.8 s with both arms and the hammer out, a ruby ribbon at knee height, then a little hop and she looks over to see if Collette saw. Andrew: "she would spin and her arms would damage enemies" |

## 4. Where the personalities go later (parked here so they are not lost)

Not for the demo scenes; for the dialog clusters C and D and the gameplay implementation.

- **Liam, strategic:** the bible gives him the shield and the steady idle. A place for "highly strategic" is the *companion AI*: when Liam is a companion he takes the position that blocks the most enemies from the active kid (a real rule, cheap to write), and his `Stay back, Bella.` emote could actually make Isabella hold. His head-turn-to-sibling idle is the emotional intelligence: he is always checking on them.
- **Noah, observant goofball:** the head-tracking rule is already his. Candidate: Noah is the kid who *finds* things: secrets and lore markers within 12 m get a small `!` bubble only when Noah is active (the "calculated the optimal route" tip made mechanical). The ADHD read is the idle that never settles plus the sudden perfect stillness when something is interesting.
- **Collette, fashion and comedy:** the `Curtains` and `Fix my hair` emotes are hers already. Candidates: her skins (§2.6) are the place fashion lives, and she should have the most of them; a "photo mode pose" set only she has; her level-headed side is the companion who heals first.
- **Isabella, control and the whirl:** the whirl is canon (v27 basic attack). "Likes to control situations" is a fair thing to leave *out* of the rig, as Andrew said; but the `Copycat` emote and the "I'm doing what Collette's doing!" idle are affectionate versions of it. The terror is the hammer.

## 5. Tweak rows

- **T-15** (this document): hair colours and styles from the photos (a–h above), the per-kid face touches (Liam's slow smile, Noah's freckles, blue eyes, fringe and laugh, Collette's long tails and bow headband and laugh, Isabella's bangs and tongue), and the four flourishes as the seed of each kid's victory clip. Status `proposed`; Andrew and the kids judge the close-ups in each scene.
- The §4 candidates are logged as ideas only, for clusters C and D.
