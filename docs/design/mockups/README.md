# The demo scenes, the studies and the scratch branch: how it all fits (start here)

Written 2026-09-07 for Andrew and for any fresh session. One page; the detail is in the files it points at.

## The pieces

| Piece | What it is | Where |
|---|---|---|
| **The Design Bible** | What every system *is*. Not edited during Phase 0.75. | `docs/design/*.md` |
| **Phase 0.75** | The interactive pass over the bible with Andrew (and his son): first the visual studies, then the dialog by cluster, then one application session that applies every agreed row to the bible and tags `p0.75-design-locked`. | `docs/design/PHASE_0.75_BRIEF.md` |
| **The visual studies = the demo scenes** | A throwaway Three.js sandbox, one scene per biome, each carrying one kid (the caves carry all four), that the family can open, walk around in, orbit, tweak with keys and screenshot. All five are built (Forest, Desert, Bog, Frozen Peaks, Crystal Caves); `sandbox/index.html` is the hub and `,` `.` step between them. Together they are the reel to skip through before the full game is built. | `sandbox/<biome>/`, shared helpers in `sandbox/_shared/` (the runtime, the rig, the four kids); the plan in `STUDY_NOTES.md` §3, the rules in §6, the treasures in §7 |
| **The tweak list** | Every decision as one row: `T-nn · system · owning file §section · change · why · status`. The application session works only from this list. | `docs/design/PHASE_0.75_TWEAKS.md` |
| **The numbers** | Every value the current frames use; `approved` entries are the ones a person said yes to. Seeds `src/style/` in Phase 1. | `style-draft.json` |
| **The log** | One row per iteration: what changed, what the frame showed, what Andrew said. Verified library shapes at the top. | `LOG.md` |
| **The frames** | Saved 1600 × 1000 PNGs with the title card, named `forest-<time>-<station>-<variant>-NN.png`. | this folder |
| **The references** | Andrew's 21 frames, his motion-tempo notes, and the seven photos of the kids (`Kids/`, read in `PHASE_0.75_HEROES_NOTES.md`). | `docs/reference/` |
| **The handoff** | Where we are and what is next; the first thing a session reads. | `docs/NEXT_SESSION.md` |

## The branches and tags

- **`phase-0.75-biomes`** (session 2, 2026-09-07): the four new scenes, the shared runtime and the kid rigs, built in the worktree `C:/Documents TEMP/ClaudeCode/StewartSquad-biomes` so Andrew's demo session on the Forest scene was never touched. It is `phase-0.75-visual-studies` plus four commits; fast-forward the studies branch onto it when the working checkout is free (`git checkout phase-0.75-visual-studies && git merge --ff-only phase-0.75-biomes`). Tag `p0.75-demo-reel-1` marks the first full reel.

- **`phase-0.75-visual-studies`**: the one code branch for the sandbox, the frames and these docs. The next scenes are built here; the session with Andrew's son happens here. Merges to `main` at the application step.
- **Tags** mark demo states the family has seen: `p0.75-study1-demo` (the first sample set), `p0.75-demo-forest-1` (the Forest scene after Andrew's quick pass). A tag never moves.
- **`phase-0.75-scratch`**: for throwaway experiments, re-cut from the studies tip when wanted; fast-forwarded in only if everything on it is a keeper, otherwise deleted. Currently identical to the studies branch.
- **`main`**: the Design Bible gate (`p0.5-design-bible`). Untouched by Phase 0.75 until the application step.

## Running a demo without disturbing a working session

The working checkout (`StewartSquad Adventure/`) serves the sandbox at `http://localhost:5173/sandbox/forest-dusk/` with `npm run dev`. A session that is building the next scene edits those files live, so a demo should run from **the demo worktree**, a second checkout of a tag that nothing edits:

```bash
cd "C:/Documents TEMP/ClaudeCode/StewartSquad-demo" && npx vite --port 5180
```

The biomes worktree serves the whole reel the same way on its own port: `cd "C:/Documents TEMP/ClaudeCode/StewartSquad-biomes" && npx vite --port 5181`, then `http://localhost:5181/sandbox/` (the hub).

Then open `http://localhost:5180/sandbox/forest-dusk/?shot=L1&t=dusk&v=B`. The worktree was created with `git worktree add ../StewartSquad-demo p0.75-demo-forest-1`; to move it to a newer tag, `cd` into it and `git checkout <tag>`. Frames saved from the demo worktree land in *its* `docs/design/mockups/`; copy any keepers into the working checkout.

## The keys (every scene, the same)

`O` shows them. WASD walk, shift run · drag orbit, wheel zoom, `R` back to the station · `B` tilt-shift on/off · `X` the kid's flourish · `Tab` swaps the walked kid (caves) · `0` `[` `]` the scene's own keys (Forest: the deer and its speed; Desert: the camel and the wind; Bog: the next lantern and the fog; Frozen: the herd and the aurora; Caves: the next lamp and the heart's pulse) · `1`–`4` the bible's stations, `5`–`9` the study framings · `T` time of day (the caves: lamps dark / half / lit), `V` variant (Forest), `K` curve · `P` post on/off, `F` freeze, `U` card · `,` `.` the previous and next scene, `H` the hub · `Enter` saves a frame. URL: `?shot=&t=&v=&curve=&freeze=1&ui=0`.

## Sharing the reel (a static build for here.now or any static host)

`npm run build:demo` builds the hub and the five scenes into `dist-demo/` (relative paths, no runtime network calls, about 1 MB) and zips it as `dist-demo.zip` (about 300 KB). Upload the **contents** of `dist-demo/` (or the zip, if the host unpacks it) so that `index.html` sits at the site root; it forwards to `sandbox/`, the hub. Verify before sharing: `npx vite preview --mode demo --port 4173` (or the `demo-preview` entry in `.claude/launch.json`) serves the built folder exactly as a host would. The frame-save key says so and does nothing outside the dev server. Nothing under `docs/` (the photos, the frames) is in the build. Viewers need a laptop browser with WebGL2; a scene takes a few seconds to build on first load.

## The lessons ledger

`LESSONS.md` is the list of defects the demo scenes fixed (symptom, cause, the rule, where the fix lives), one row each. Phase 1's inspection checklist step P0-1 reads it before building any system it names. Add a row whenever a demo fixes something a kid could have noticed.
