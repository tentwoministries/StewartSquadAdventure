# The demo scenes, the studies and the scratch branch: how it all fits (start here)

Written 2026-09-07 for Andrew and for any fresh session. One page; the detail is in the files it points at.

## The pieces

| Piece | What it is | Where |
|---|---|---|
| **The Design Bible** | What every system *is*. Not edited during Phase 0.75. | `docs/design/*.md` |
| **Phase 0.75** | The interactive pass over the bible with Andrew (and his son): first the visual studies, then the dialog by cluster, then one application session that applies every agreed row to the bible and tags `p0.75-design-locked`. | `docs/design/PHASE_0.75_BRIEF.md` |
| **The visual studies = the demo scenes** | A throwaway Three.js sandbox, one scene per biome, each carrying one kid, that the family can open, walk around in, orbit, tweak with keys and screenshot. The Forest scene is built; Desert, Bog, Frozen and the Crystal Caves are next. Together they are a reel to skip through before the full game is built. | `sandbox/<biome>/`, shared helpers in `sandbox/_shared/`; the plan in `STUDY_NOTES.md` §3, the prototyping rules in §6 |
| **The tweak list** | Every decision as one row: `T-nn · system · owning file §section · change · why · status`. The application session works only from this list. | `docs/design/PHASE_0.75_TWEAKS.md` |
| **The numbers** | Every value the current frames use; `approved` entries are the ones a person said yes to. Seeds `src/style/` in Phase 1. | `style-draft.json` |
| **The log** | One row per iteration: what changed, what the frame showed, what Andrew said. Verified library shapes at the top. | `LOG.md` |
| **The frames** | Saved 1600 × 1000 PNGs with the title card, named `forest-<time>-<station>-<variant>-NN.png`. | this folder |
| **The references** | Andrew's 21 frames and his motion-tempo notes. | `docs/reference/` |
| **The handoff** | Where we are and what is next; the first thing a session reads. | `docs/NEXT_SESSION.md` |

## The branches and tags

- **`phase-0.75-visual-studies`**: the one code branch for the sandbox, the frames and these docs. The next scenes are built here; the session with Andrew's son happens here. Merges to `main` at the application step.
- **Tags** mark demo states the family has seen: `p0.75-study1-demo` (the first sample set), `p0.75-demo-forest-1` (the Forest scene after Andrew's quick pass). A tag never moves.
- **`phase-0.75-scratch`**: for throwaway experiments, re-cut from the studies tip when wanted; fast-forwarded in only if everything on it is a keeper, otherwise deleted. Currently identical to the studies branch.
- **`main`**: the Design Bible gate (`p0.5-design-bible`). Untouched by Phase 0.75 until the application step.

## Running a demo without disturbing a working session

The working checkout (`StewartSquad Adventure/`) serves the sandbox at `http://localhost:5173/sandbox/forest-dusk/` with `npm run dev`. A session that is building the next scene edits those files live, so a demo should run from **the demo worktree**, a second checkout of a tag that nothing edits:

```bash
cd "C:/Documents TEMP/ClaudeCode/StewartSquad-demo" && npx vite --port 5180
```

Then open `http://localhost:5180/sandbox/forest-dusk/?shot=L1&t=dusk&v=B`. The worktree was created with `git worktree add ../StewartSquad-demo p0.75-demo-forest-1`; to move it to a newer tag, `cd` into it and `git checkout <tag>`. Frames saved from the demo worktree land in *its* `docs/design/mockups/`; copy any keepers into the working checkout.

## The keys (every scene, the same)

`O` shows them. WASD walk, shift run · drag orbit, wheel zoom, `R` back to the station · `B` tilt-shift on/off · `0` the deer walks, `[` `]` its speed · `1`–`4` the bible's stations, `5`–`9` the study framings · `T` time of day, `V` variant, `K` curve · `P` post on/off, `F` freeze, `U` card · `Enter` saves a frame. URL: `?shot=&t=&v=&curve=&freeze=1&ui=0`.
