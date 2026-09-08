# The Opus 5 experiment: what was hard, what was guessed, what I would do differently

Written at the end of the session, 2026-09-08, on `phase-0.75-opus-experiment` in the worktree
`StewartSquad-opus`. The assignment is `OPUS_EXPERIMENT_BRIEF.md`; the iteration record is `LOG.md`
under "The Opus 5 experiment"; the decisions are rows T-20 … T-33 in `docs/design/PHASE_0.75_TWEAKS.md`.
Five scenes, five commits (plus a lane-setup commit and a hub commit), 45 frames, `npm run check`
green at every one. No design file was edited, no existing scene folder was touched, and nothing in
`sandbox/_shared/` was changed.

## The shape of it

| Scene | Folder | Kids | Frames | The one thing it is for |
|---|---|---|---|---|
| 1 · the Rootways and the Hollow Grove's arch | `rootways-golden/` | Liam, Noah | 9 | the Forest's grandeur: 26–34 m trunks, roots you walk over, a threshold that breathes |
| 2 · Home, Wrong | `shadow-wrong/` | Collette, Isabella | 7 | the best lighting in the game, earned by contrast and not by darkness |
| 3 · CS-04, the flight | `flight-golden/` | Ed and all four | 12 | the only moving camera, and the only look at the world from the air |
| 4 · the Crash Meadow beat | `meadow-golden/` | Isabella, Liam | 9 | a fight beat at the distance the game plays at, built to a written plan |
| 5 · the west rim at dawn | `rim-dawn/` | Liam | 8 | the waterfall the island has been promising since `story-beats.md` §2.2 |

## What was hard

**Nothing about the art. Everything about what the camera could actually see.** Four of the five
scenes lost a whole iteration to something *between* the camera and the subject, and none of it was
visible in the code:

- the Rootways: a mid-layer tree standing on the `L1` camera, and a gate pillar 1.4 m in front of the
  close-up. Fixed by excluding trees from a 13 m radius round every station's camera position and a
  7 m radius 8 m along its axis — which is `LESSONS.md`'s line-of-sight rule, generalised.
- Home, Wrong: the one warm light — the thing the game is named for — was hidden three separate
  times, by the island's own rim skirt, then a void cloud, then a pine. Each time the billboard
  itself checked out from the console (dead centre of the frame, facing the camera, NDC z inside the
  frustum). `clearSight()` came out of that: it zeroes the instance matrices of imported instanced
  geometry inside a station's corridor.
- the flight: the aircraft, Ed and all four kids sank 8.4 m out of the chase frame while their
  selection rings stayed exactly where the camera expected them. That is the curved-world shader:
  its centre is set once from the station's target, it bends the world material only, and the drop is
  `uCurve · d²`. **A camera that travels must carry the centre with it** (T-27). This is the one bug
  in the experiment that a static scene could never have found, and it is waiting in Phase 1 for the
  first cutscene.
- the west rim: the stream's sheet hanging 9 m out in mid-air past the plate's edge, which no Forest
  station has ever looked at (T-32).

**The second hard thing was the harness, not the game.** A Browser pane that is open but not on
screen serves no `requestAnimationFrame`, and the runtime's fallback tick only fires when
`document.hidden` is true, which an embedded pane does not set. The clock stalls at about 0.5 s with
no error of any kind. `STUDY_NOTES.md` §6 rule 8 says exactly this, and I met it the hard way on
scene 3 rather than reading it forward. Two things came out of it that are worth keeping:
`?ct=<seconds>` on the flight and `?beat=1` on the meadow, which put a moving moment in the URL. **A
cutscene frame should be addressable by its second, not by timing a keypress**, and that is true for
a person judging the reel as well as for a session automating it.

## What was guessed, and logged

Every one of these is a `LOG.md` row and, where it touches the bible, a `T-nn`:

- **The shard is not mirrored geometrically.** A mirror nobody sees beside the original is a
  transform that reads as nothing; the mirror is carried by the palette, the cold fire, the ember
  windows, the torn tent, the upside-down crest, the swing, the climbing stream and the far light.
- **The flight is a circuit of one island**, because one island is built; the "destination growing
  ahead" is a silhouette on the horizon with a teal roof on it.
- **The shard's fog and key were opened** past the bible's row (T-24) because at the written numbers
  half of every frame is `#000`, which the anti-palette forbids.
- **The Rootways carries its own fog and its own key/hemi balance** (T-20, T-21) because a district
  read at d 26–92 is not a camp read at d 19–30.
- **The meadow's S1 note is the wrong way round for its own numbers** (T-30): at yaw 300 the goblin
  camp is right of centre and the furrow's end left, not the reverse. The numbers were built as
  written; the description is what wants correcting.
- **The rim's lip and the deer's spot** both moved, because the plan's coordinates put the lip 9 m
  short of the water and the deer 3.6 m out into the pond. The plan's values are kept in the comments.

## What I would do differently

1. **Read `LESSONS.md` as a checklist against each station, before building, not after.** Four of
   the five scenes re-made a defect the ledger already names. The ledger's rows are written as
   causes; they would be more use written as *checks you can run*: "for every station, is anything
   within 12 m of the camera on the view axis?", "does the key light reach the subject's front?",
   "is the fog judged at the widest station as well as the hero one?" I would put that list at the
   top of a scene file and tick it.
2. **Frame the station before dressing the set.** The strongest frames here (`rim-dawn-s2-01`,
   `shadow-wrong-s1-01`, `rootways-golden-s3-01`) came from stations chosen for what they would
   contain; the weakest (`shadow-wrong-s4-01`, `meadow-golden-s4-a-01`) came from stations written
   down first and pointed at whatever was there. A station is a composition, not a coordinate.
3. **Light first, colour second.** The single biggest quality change in the whole session was one
   line: golden hour's key 1.4 and hemi 0.38 are the *same strength* through the T-07 factors, so
   every lit ground surface receives two keys and every saturated green renders khaki. Dropping the
   hemisphere to a third of the key (T-20) fixed the Rootways at a stroke and would improve every
   scene in the existing reel. I would test that pair on the Forest camp before anything else.
4. **Say what a frame is for in one sentence, then build only that.** The scenes that read are the
   ones with a single subject (a threshold, a cold fire, a fall). The ones that read least are the
   ones asked to show three things at once.
5. **Verify motion deliberately.** I judged composition and light honestly, from real frames; I did
   *not* verify most of the motion, because the loop was stopped and I did not notice until scene 3.
   The tempos are written to `MOTION_TEMPO_NOTES.md` and the code follows it (two incommensurate
   rates, eased in and out, nothing popping), but **the animation in scenes 1 and 2 has not been
   watched running** — only sampled from the console. That is the honest gap in this delivery and it
   is listed under "What is not done" below.

## What is not done

- **Motion is unverified in scenes 1, 2, 4 and 5.** The frames are stills of the first half-second.
  Anyone judging tempo should open the scenes on a visible screen and watch: the Grove's 12 s
  heartbeat (`g` pulses it), the songbird burst (`0`), the shadow deer's dissolve (`0`), the fox on
  the rim path, the goblins' approach (`0`). Scene 3's flight is the exception — its clock is in the
  URL, so it is watchable and reproducible frame by frame.
- **Hit-stop is partial** (T-31): a scene can zero its own systems, but the hero rigs are stepped by
  the runtime before `world.update`, so their clock keeps running through the 0.04 s. Fixing it means
  touching `sandbox/_shared/scene.ts`, which this lane may not do.
- **No performance measurement.** No frame-time numbers were taken. The shard and the flight both
  carry more point lights and more geometry than the existing scenes; the caves' twenty-light rule
  from `LESSONS.md` is respected by count but not measured.
- **The kids' seated clips in the flight are poses, not clips**, and the four carried props are
  stowed for the flight rather than held (T-28).
- **Nothing here has been scored.** `art-director` has not run on any of these frames, and no member
  of the family has seen them.

## The four frames I would put in front of Andrew first

`shadow-wrong-s1-01` (the cold fire, Collette's orb, the cabin's ember windows: three light colours
and no black), `rim-dawn-s2-01` (the fall in full height from off the island), `rootways-golden-s3-01`
(the tilt-up, and the only canopy in the sandbox), `flight-golden-wg-01` (the biplane banking over
the snow pines). If only one: `shadow-wrong-s1-01`, because the Brief asks for the best lighting in
the game and that frame is an argument that it comes from hue contrast rather than from darkness.
