# Phase 0.75 — Design Dialog (between the Design Bible and the pilot)

*Added 2026-09-07 at Andrew's direction; reordered the same day to start with the visual studies.* Documents and throwaway visual studies only; no game code. Phase 0.5 produced the Design Bible in one autonomous pass. Phase 0.75 is the **interactive** pass over it: Andrew and the orchestrator first settle what the game looks like with real rendered studies, then talk through the bible system by system, collect every agreed change in one running list, and only then apply the list to the design files systematically, so nothing from Phase 0.5 is lost and nothing is changed twice. Locking the design at a higher level before Phase 1 is cheaper than iterating in code.

## 1. The rules of the phase

1. **Nothing edits a design file during the dialog or the studies.** Every agreed change is appended to `docs/design/PHASE_0.75_TWEAKS.md` with its owning file and section, a status, and the reason. The design files change only in the application step (§4), by the `design-lead` agent, with a `docs/DECISIONS.md` line per significant change, exactly like the Phase 0.5 consistency pass.
2. **Commit the tweaks file and the mockups every few decisions**, not at the end of a session. A session can hit a usage limit mid-thought; the files on disk are the record.
3. **Canon rules stand** (`CLAUDE.md`): names, core personalities and canon text never change; colors and roles may change only in `heroes.md` with a logged rationale.
4. **The orchestrator answers from the files, not from memory.** When Andrew asks what something currently does, the answer cites the file and section. When the two disagree, the file wins until a tweak is logged.
5. **Ideas are cheap; each one gets a home.** An idea that is not adopted is still recorded in the tweaks file with `status: parked` and one line of why, so it is never re-argued.
6. **The sandbox is a sketchbook, not the game** (§3.3). No engine architecture, no sim, no shared modules beyond one small helper folder, no file over about 400 lines, deleted after `p1-style-locked` like `pilot/`. What survives it is screenshots, numbers and decisions.
7. Working Rules 1–7 and the model policy apply unchanged. Rule 2 applies inside the sandbox too: the first study verifies the real `postprocessing` and Three.js shapes it uses and writes them to `docs/design/mockups/LOG.md`.

## 2. The session plan, in order

| # | Cluster | Files | Why here |
|---|---|---|---|
| 1 | **B. Visual identity and mood — the studies** (§3) | `heroes.md` §2.1, `camp.md` §2.11, `world-events-weather.md` §2.1, `ui-ux.md` §2.1 | Andrew wants to see it before talking about it; every later cluster argues over pictures instead of adjectives; the approved numbers seed `src/style/` |
| 2 | A. World and exploration | `story-beats.md`, `world-events-weather.md`, `dungeons.md` §2.7, `bosses.md` §2.11–2.12 | The Crystal Caves and the Volcanic Rift (T-01..T-05 already logged); island footprints and travel rules constrain everything after |
| 3 | C. Heroes and combat feel | `heroes.md`, `enemies.md`, `bosses.md` | Kits, telegraphs, hit-stop, the combo beat |
| 4 | D. Story, cutscenes, NPCs | `story-beats.md`, `cutscenes.md`, `npcs.md` | Beats, shot tables, Ed, the ending |
| 5 | E. Menus, sound, everything else | `ui-ux.md`, `audio.md` | Usually the shortest cluster |
| 6 | The application session (§4) | all | Applies the list, re-issues the Phase 1 handoff, tags the gate |

Each cluster can be one chat or several; several is safer (§5). A dialog session: **open** with the prompt in §6; the orchestrator reads `docs/NEXT_SESSION.md`, this brief, the tweaks file and the cluster's files. **Andrew leads** with what he read and what felt thin, beautiful, missing or wrong; he may paste screenshots (filed under `docs/reference/` with a note in the tweaks file). **The orchestrator answers** with the current state (file and section), an honest read on whether it under-delivers, and numbered options with tradeoffs, so a decision is one word. **Each decision** becomes a row: `T-nn · system · file §x · change · why · status`. **Close** by committing and appending a "next topic" line to `docs/NEXT_SESSION.md`.

## 3. The visual studies (cluster B): what is possible, and what to trust

**Plain statement of capability.** The orchestrator has no image generation. It can (a) draw diagrams and boards as HTML or SVG, and (b) write real Three.js and render it in the desktop app's browser pane, then screenshot it. Only (b) tells the truth about light, fog, materials, bloom and scale. A drawn board is a diagram; a sandbox screenshot is a promise the code can keep, because it is code. Every visual decision that matters ends as a sandbox screenshot Andrew approved.

### 3.1 Tool one: Andrew's screenshots
Frames from v27, from games with the feel he wants, from the Fernwood reference. They go in `docs/reference/` with a note, and the tweak or study they inform cites them. This is the highest-value input in the phase: it says "this" instead of describing it.

### 3.2 Tool two: drawn boards (layout only)
HTML or SVG under `docs/design/mockups/boards/`: the camp plan view with stations S1–S4, a cave cross-section with its tiers, the four kids' silhouette line-up at 1.52 / 1.40 / 1.30 / 1.14 m, the HUD over a placeholder frame, the day-cycle keyframe strip as swatches. Use them for composition, proportion and layout. Never use them to judge lighting or mood.

### 3.3 Tool three: the coded sandbox (the truth about light)
- **Where:** `sandbox/<study>/index.html` + `main.ts`, served by the existing Vite dev server (`npm run dev`, then `http://localhost:5173/sandbox/<study>/`). Three.js 0.185.1, `postprocessing` 6.39.4 and `simplex-noise` 4.0.3 are already installed at exact versions; nothing new is added without a logged reason. One tiny `sandbox/_shared/` may hold the camera presets, the post stack, and a screenshot helper (`?shot=S1&t=dusk` selects a station and a keyframe so a URL is a reproducible frame).
- **One study, one question.** Examples in order: *Forest dusk at the C1 camp from station S1* (palette, fog, the fire's pool, the tent glow); *the same at deep night* (stars, fireflies, lantern light); *golden hour on the stream* (water, rim light); *the Crystal Caves tiered cross-section with the heart pulsing below* (the T-03 decision); *Liam's silhouette and colour at gameplay distance* (a blocky stand-in, not the rig); *the anti-palette check* (the same frame with the forbidden looks, to know what to avoid).
- **What it is not:** no ECS, no sim, no save, no real rig, no asset pipeline. Blocky placeholder geometry is fine; the question is light, colour, scale and composition. Rule 6 of §1 sets the size cap and the deletion date.
- **Who writes it:** the orchestrator directly, as an exception to the delegation rule (sketches under 400 lines, fast turns while Andrew watches; logged in `DECISIONS.md`). `render-engineer` only if a study outgrows that. `art-director` scoring only when Andrew wants a second opinion; his eye is the judge in this phase.
- **How a study runs:** write or edit the scene → open it in the browser pane → screenshot → save as `docs/design/mockups/<study>-NN.png` with one line in `docs/design/mockups/LOG.md` (study, iteration, what changed, Andrew's verdict) → iterate. Commit every few iterations. Andrew can paste his own screenshots of the running scene back in with marks on them.
- **What survives:** the approved screenshots (committed; the design record), the `LOG.md`, and `docs/design/mockups/style-draft.json`: every number the approved frames used (sky stops, fog near/far/height, sun and moon colour and intensity, hemisphere colours, exposure, bloom threshold and strength, the fire's light, the hero base/edge/glow hexes, material roughness). That file seeds `src/style/` in Phase 1; the Phase 1 visual loop refines it under the art director's rubric instead of starting from adjectives.
- **What it does not settle:** performance on a phone, the real rig's read at distance, animation feel, and headless capture. Those stay Phase 1's (`needs-render` rows in the tweaks file point at them).

### 3.4 Which tool for which question
| Question | Tool |
|---|---|
| Does the palette feel like Fernwood at dusk? | sandbox |
| Is the camp laid out right, are the stations in the right places? | board first, then sandbox |
| Do the four kids read as four at one-eighth screen height? | sandbox with blocky stand-ins at the bible's heights and hexes |
| Where do the cave tiers go and how deep is the heart? | board (cross-section), then one sandbox frame for the light |
| Is the HUD too loud over the world? | board over a sandbox screenshot |
| Does the water shader look right? | sandbox |
| Is the combo beat's letterbox punch right? | Phase 1 (`needs-render`) |

## 4. The application step (the last session of the phase)

1. Read the tweaks file; group rows by owning file; resolve any two rows that touch the same section.
2. One `design-lead` agent per file (Fable, xhigh), in dependency waves as in Phase 0.5 (`heroes.md` and `story-beats.md` first), each applying only its rows with targeted edits, citing the approved mockup screenshots where a row came from one, adding a §6 line per significant change, and setting the file's Status line to `Phase 0.75 tweaks applied <date>`.
3. The orchestrator reviews each diff against the tweaks file, merges the §6 lines into `docs/DECISIONS.md`, and runs a consistency pass over the files the tweaks touched (Opus with Edit is fine here, as in Phase 0.5: the decisions are already made).
4. Every applied row gets `status: applied <date>`; parked rows stay parked.
5. `docs/design/README.md` statuses, `docs/PROGRESS.md`, `docs/COMPLETE_STATE.md`, the Phase 1 handoff (restore from `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md`, update it for the tweaks and point it at `style-draft.json`), one summary, and the gate tag.

**Definition of Done:** the visual studies produced approved screenshots and `style-draft.json`; every cluster has been discussed or explicitly skipped by Andrew; every agreed row is applied and logged; parked rows are recorded with a reason; mockups are in the repo and cited; the Phase 1 handoff builds the tweaked designs from the approved frames. Gate tag: `p0.75-design-locked`.

## 5. Effort levels for Fable 5.1 in this phase

Effort is set per session in the app's model picker; `CLAUDE_CODE_EFFORT_LEVEL` stays unset so agent frontmatter keeps working.

| Session type | Orchestrator effort | Why |
|---|---|---|
| Visual studies (cluster B): many short turns editing the sandbox, screenshotting, reacting to Andrew's marks | **medium** for the iteration loop; **high** when a study opens (choosing the question and the starting numbers) and when a frame is approved (writing its numbers into `style-draft.json` and the tweak row) | Iteration wants speed and cheap turns; the two decision moments want judgment |
| Dialog sessions (clusters A, C, D, E) | **high** | The value is judgment across an 8,845-line bible; medium tends to answer from the summary card |
| The application session (§4) | **high** orchestrator; `design-lead` agents at **xhigh** (their frontmatter); consistency pass on Opus | Same shape as the Phase 0.5 review and gate |
| A gate review of the whole tweaked bible | **xhigh**, or `qa-inspector-max` / `art-director-max` for a scored pass | Gates are the one place `max`-class effort is allowed by the policy |

One chat or several: several, one per cluster, and for the studies one chat per two or three studies. A long session gets compacted and starts answering from its summary; the tweaks file, `LOG.md` and `style-draft.json` are what make several sessions equivalent to one.

## 6. Prompts to paste

The first session (the studies):

```
Continue from docs/NEXT_SESSION.md. Open Phase 0.75 (docs/design/PHASE_0.75_BRIEF.md) with the visual studies, §3: set up sandbox/ per §3.3 (verify the postprocessing and Three.js shapes you use, log them in docs/design/mockups/LOG.md), then run the first study, Forest dusk at the C1 camp from station S1, and screenshot it for me. Iterate on my feedback; save every approved frame under docs/design/mockups/ and its numbers in style-draft.json; log decisions in docs/design/PHASE_0.75_TWEAKS.md; commit every few iterations. Edit no design file.
```

A later studies session:

```
Continue from docs/NEXT_SESSION.md. Phase 0.75 visual studies, next study from docs/design/mockups/LOG.md. Same rules: sandbox only, screenshots and numbers saved, decisions logged, commits every few iterations, no design file edited.
```

The first dialog session (cluster A):

```
Continue from docs/NEXT_SESSION.md. Open Phase 0.75 cluster A, starting with the Crystal Caves and the Volcanic Rift (T-01..T-05 in docs/design/PHASE_0.75_TWEAKS.md). Answer from the files. Log every decision as a row and commit after every few rows. Do not edit any design file.
```

The application session (last):

```
Continue from docs/NEXT_SESSION.md. Run the Phase 0.75 application step (docs/design/PHASE_0.75_BRIEF.md §4): apply every agreed row of docs/design/PHASE_0.75_TWEAKS.md to the design files with design-lead agents, log decisions, run the consistency pass, restore and update the Phase 1 handoff to build from the approved mockups and style-draft.json, tag p0.75-design-locked.
```

## 7. Templates before coding: what helps and what hinders (Andrew's question, 2026-09-07)

The orchestrator's own answer, from how it works best in code.

**What hinders.** Code templates written before the spikes: scaffolds with assumed module boundaries, class shapes, or API calls. They encode guesses about Rapier, `postprocessing`, the GLB loader and the headless harness that Working Rule 2 exists to prevent, and at implementation time they become something to work around rather than from. The same is true of over-detailed task lists that prescribe *how* to write a system: the first pass is best when it reads the design file, verifies the real interfaces, and builds the simplest thing that satisfies the contract, with the reviews and agents catching what it missed.

**What helps, and is worth pre-generating.**
1. **Decisions, not code:** the bible, the tweaks file, and the approved screenshots. A picture Andrew has said yes to is the strongest constraint there is, and the cheapest.
2. **Numbers:** `style-draft.json` and the bible's tables. Data is a template that never fights the implementation.
3. **Fixed contracts that many parts touch:** the screenshot stations (`camp.md` §2.11.5), the folder layout (Brief §7.3), the style-token schema (`ui-ux.md` §2.1.2), the cue names (`audio.md` §2.2), the test-hook names. These are interfaces between agents, and agreeing them once keeps parallel agents from colliding.
4. **Verified shapes:** the spike notes (`docs/visual-loop/spikes.md`) with the real response shapes of every external interface. This is the one kind of "template" that is pure gain.
5. **Working examples, not scaffolds:** the sandbox studies are real code that ran and produced approved frames. Phase 1 may read them as reference and lift a post-stack setup or a fog formula, but it starts from the spikes and the bible, not from the sandbox's structure.

**The rule, then:** pre-generate contracts, numbers, verified shapes and approved pictures; never pre-generate the code's shape. Keep the first implementation pass free, and spend the saved tokens on one strong review and the gate.
