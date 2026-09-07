## Working Rules (apply to every session, every agent, every file)

These are Andrew's standing rules. They go at the top of every handoff document, every subagent system prompt, and `CLAUDE.md`. Subagents do not inherit the parent session's context, so each agent file must carry these verbatim.

1. **Missing inputs → stop and ask.** If a file, data source, or piece of context needed to do a task *properly* is missing, stop and ask Andrew rather than shipping incomplete work wrapped in disclaimers. Never paper over gaps. (Creative decisions are *not* missing inputs — see docs/BRIEF.md §2. Decide, log, proceed.)
2. **Pre-build gate for every external interface.** Before writing integration code against any API, package, or data format (Rapier, postprocessing, Colyseus, GLB loaders, save schema, Puppeteer GL flags), hit it with a real call and verify the actual response/shape. Never code against assumed or documented field names. Record the verified shape in the task's notes before proceeding. Non-negotiable.
3. **No assumptions in code.** Verify every field name, handler name, parameter, and format against the real source before writing tests, configs, or integration code. If unsure, grep the codebase first.
4. **Single Pro Inspection Checklist V2 — all 27 steps, every delivery, no tiers.** (Full list: docs/INSPECTION_CHECKLIST.md)
   - P0 pre-build: memory/handoff read, design approval on record, API verification done, inherited code audited
   - P1 static: `tsc --noEmit` clean, runtime import check, AST/import trace, duplicate definitions, TODO sweep
   - P2 semantic: call-chain trace, entry points, name collisions, fuzzy/near-duplicate logic, substring hazards, possessive/string hazards in content, router/state-machine transitions
   - P3 infra: priority ordering, data field coverage, async correctness, rate/frame budgets, deferred work listed, exclusions documented
   - P4 delivery: filenames, packaging, regression suite green, version stamp, line/size count
5. **Handoff is the source of truth.** Every session ends by writing `docs/NEXT_SESSION.md` with these Working Rules at the top, current state, what's done, what's next, and known issues. The next session starts by reading it.
6. **Deliverables are files, not chat.** Everything lands in the repo. Andrew never copy-pastes from chat.
7. **Tests: trim before adding.** Before generating new tests, do a trim pass on the existing suite; target ~100 tests per suite; propose specific trims with rationale before writing new ones.

**Family canon is sacred.** The kids' names, core personalities, and canon text never change: **Liam** (oldest, protective, steady — the leader), **Noah** (sharp, quick, independent), **Collette** (creative, imaginative), **Isabella** (youngest, fierce, unstoppable). Grandpa Ed flies the biplane. Each kid's color and role are set in the Design Bible (`docs/design/heroes.md`, Phase 0.5) and may be revised only there, with the rationale logged in `docs/DECISIONS.md`; Brief §1 is the starting point, not the law. Existing dialogue, quest text, in-jokes, cutscene lines, voice lines, achievement names, and loading tips are ported **verbatim** — never paraphrased or "improved". New text may be added. Nothing ships that isn't family-friendly.

## Model and effort policy (Andrew, 2026-09-06)

- Orchestrator: Fable 5.1 at **high**, every session. At session start, confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset (it silently overrides every agent's frontmatter `effort`).
- `art-director`, `qa-inspector`, `design-lead`: `fable` / `xhigh`. Use `art-director-max` and `qa-inspector-max` (`fable` / `max`) only for Phase 1 excellence-mark scoring and phase-gate reviews.
- Implementers (`render-engineer`, `systems-engineer`, `dungeon-designer`, `world-builder`, `ui-designer`, `net-engineer`): `opus` / `high`.
- `archaeologist` and any mechanical work: `opus` / `medium`.
- Escalate an implementer to Fable only for unusually judgment-heavy work (Phase 1 shader and lighting, the curved-world shader, the `BOSS_BLOCKS` port, the multiplayer spike, anything that failed twice on Opus) by adding a separate agent file such as `render-engineer-fable.md` and one `docs/DECISIONS.md` line. Never Fable on mechanical work; never `max` except scoring or gating; one strong review pass over repeated weak ones.

---

# Next session — handoff written 2026-09-07 (end of session 1: Phase 0.5, the Design Bible; Phase 0.75 inserted before Phase 1)

## Read this first: Phase 0.75 comes before Phase 1

Andrew inserted **Phase 0.75 — Design Dialog** (2026-09-07) between the Design Bible and the pilot: an interactive pass over `docs/design/` where he and the orchestrator talk through each system, collect every agreed change in `docs/design/PHASE_0.75_TWEAKS.md`, and only then apply the list to the design files systematically. The process, the session plan, the effort levels per session type and the prompts to paste are in `docs/design/PHASE_0.75_BRIEF.md`. **The phase starts with the visual studies** (brief §3): a throwaway Three.js sandbox under `sandbox/`, rendered in the app's browser pane and screenshotted, so the palette, fog, light and scale are decided on real frames before any dialog; approved frames land under `docs/design/mockups/` and their numbers in `docs/design/mockups/style-draft.json`, which seeds `src/style/` in Phase 1. Then the dialog clusters, starting with the Crystal Caves (five ideas already logged as T-01 to T-05 in the tweaks file, with the dialog verbatim).

Rules for the dialog and study sessions: answer from the files, log every decision as a row, commit the tweaks file and mockups every few rows, edit no design file, write no game code (the sandbox is a sketchbook, deleted after `p1-style-locked`). The Phase 1 plan below still stands and is also saved as `docs/handoffs/phase-1-pilot-handoff-2026-09-07.md`; the 0.75 application session restores it, updates it for the tweaks, and tags `p0.75-design-locked`.

## Fresh machine setup (Andrew's laptop, first session there)

Clone, or pull on an existing clone:

```bash
git clone https://github.com/tentwoministries/StewartSquadAdventure.git
```

Then, inside the repo, in this order:

```bash
nvm use
```

(`.nvmrc` pins 24.16.0; `nvm install 24.16.0` first if it is missing.)

```bash
npm ci
```

```bash
npm run check
```

`npm run check` must be green before any work. `CLAUDE_CODE_EFFORT_LEVEL` must be unset in the shell (`echo $CLAUDE_CODE_EFFORT_LEVEL` prints nothing; if it prints a level, unset it, because it silently overrides every agent's frontmatter effort). `.claude/agents/` and `.claude/settings.json` are tracked, so every agent travels with the repo; Claude Code's auto-memory does **not** travel between machines, which is why this file is complete on its own. Run `gh auth login` once so the end-of-phase PR step works. Sanity check: `git tag` lists `p0-setup` and `p0.5-design-bible`, and `git log --oneline -1` on `main` is the Phase 0.5 gate merge.

## Where we are

- **Repo:** https://github.com/tentwoministries/StewartSquadAdventure. `main` holds the scaffold (`p0-setup`), Phase 0 part A (five of seven teardown docs), and Phase 0.5 (`p0.5-design-bible`, 2026-09-07). Both working branches so far (`phase-0-teardown`, `phase-0.5-design`) are merged. The next branch is `phase-1-pilot`.
- **The Design Bible is done and authoritative:** `docs/design/`, eleven system files plus the README, 8,845 lines. Every file has *What v27 does → What it becomes → What preserves the magic*, was reviewed by the orchestrator (`docs/qa/phase-0.5-design-review-2026-09-06.md`, all PASS), and went through the 2026-09-07 consistency pass. `docs/DECISIONS.md` holds 389 dated lines. `CLAUDE.md` and Brief §2, §4–6 and §8 point at it. Revise a design file only through the `design-lead` agent plus a `DECISIONS.md` line; never edit one to match code.
- **Decided in the bible, no longer open questions:** hero colors and roles — Liam sapphire `#2A62CF` / `#173A86`, glow `#4A9ED8`, **Tank**; Noah fox-orange `#EE7F24` / `#1F5E3F`, glow `#FFC46B`, **Ranger**; Collette amethyst `#9D4FD8` / `#5B2A8F`, glow `#E08CF0`, **Mage**; Isabella ruby `#D6294E` / `#8A1538`, glow `#FFD966`, **Whirlwind** (`heroes.md` §2.1–2.2; the Brief §1 versus v27-code conflict is closed). World scale 40 px = 1 m (0.025 m/px) in every file; island footprints per `story-beats.md` §2.2 (Forest 360 × 300 m, per-island `island.layoutScale`); north is `−z` (`+x` east, `+z` south); endless mode cut; 17 enemy types on five rigs; the plane is the travel system with four states; no audio files, ever.
- **Toolchain green:** `npm run check` (tsc + eslint + vitest), `npm run build`, `npm run build:archive` (single-file verified). Node 24.16.0 pinned.
- **Phase 0 part B is still not done** (`KEEP_CHANGE_DROP.md`, `PORT_MAP.md`, the `p0-teardown` tag): blocked on the brainstorm doc (Rule 1). The pilot does not depend on it (logged in `DECISIONS.md`). When the brainstorm doc lands, each design file's §7 lists exactly what to reconcile.

## Needs Andrew (these gate specific tasks, not the session)

1. **Legacy inputs** still missing from `docs/legacy/`: `stewart-squad-v26-complete-state.md`, `stewart-squad-gameplay-brainstorm-v2.md`, `stewart-squad-dev-instructions.md`; and `docs/reference/fernwood.jpeg`. Without the image, Brief §4.1's written description binds Phase 1. Without the brainstorm doc, part B and the bible's §7 reconciliations wait.
2. **Repo visibility.** The remote is public; the brief asks for private. Flip it in GitHub settings if that is still the intent.
3. **Optional, non-blocking, in Dad's voice:** a dedication line under the ending card (`story-beats.md` §8) and Grandpa Ed's likeness details (`npcs.md` §8). Both files ship without them.

## What to do next session (in order)

0. **Phase 0.75 first** (`docs/design/PHASE_0.75_BRIEF.md`): dialog sessions by cluster, then the application session and the `p0.75-design-locked` tag. Steps 1–5 below are the Phase 1 plan that follows it.
1. Read this file, `CLAUDE.md`, `docs/PROGRESS.md`, then `docs/design/README.md` (the reading order), `heroes.md` §2 summary card, `camp.md` §2.2 and §2.11, `world-events-weather.md` §2.1.3 and §2.2.6. Confirm `CLAUDE_CODE_EFFORT_LEVEL` is unset. Note the plan in `docs/PROGRESS.md`.
2. **If the legacy inputs are present:** one `archaeologist` each for `KEEP_CHANGE_DROP.md` and `PORT_MAP.md` (inputs: the five teardown docs, the brainstorm doc, Brief §5 and §7.3, and the bible's per-file cut lists in `ui-ux.md` §2.5.2, `audio.md` §2.10, `enemies.md` §5, `world-events-weather.md` §5, `dungeons.md` §2.8); one `design-lead` reconciliation pass over the eleven §7 sections; `qa-inspector-max` runs the Phase 0 gate; tag `p0-teardown`; update `docs/COMPLETE_STATE.md`. **If they are still missing:** say so in the summary (Rule 1) and go straight to step 3.
3. **Phase 1 — the pilot, built from the bible, not from v27.** Branch `phase-1-pilot`. Spikes first, each a Rule 2 gate with the verified shape written to `docs/visual-loop/spikes.md` and the decision in `DECISIONS.md`: Rapier vs a custom capsule/heightfield; bitecs vs plain typed systems; Puppeteer vs Playwright headless capture with software GL (it must produce a non-black PNG). Then, in parallel where files do not overlap:
   - `render-engineer` builds `pilot/`: the Forest island cut (`camp.md` §2.11.1); the C1 camp from the §2.2 prop list with §2.11.2's sources and triangle budget, §2.11.3's materials and the tent glow (§2.11.4); the four screenshot stations (§2.11.5, the fixed contract with the art director), the deer's path (§2.11.6), the water shader's edges (§2.11.7), the title card (§2.11.8); the Forest keyframe table (`world-events-weather.md` §2.1.3) and the pilot's weather toggle (§2.2.6); the 8-slot light pool and the shared fire oscillator (§2.8.2–2.8.3, `camp.md` §2.7.1); the curved-world shader and the full post stack per Brief §8 Phase 1; the HUD stub and dev console per `ui-ux.md` §4.4 Phase 1 (`src/style/ui.ts` tokens, the fonts, the title card, a party strip with one portrait, the compass strip, the prompt pill, the console with stations and perf).
   - **The pilot Liam is `heroes.md` §2.7**: model source (§2.7.1), geometry and material (§2.7.2), rig (§2.7.3, including the `carry.L` and `hat` sockets from §2.4.7), the idle and walk clips (§2.7.4), the selection ring (§2.7.5), the two scored poses (§2.7.6); sapphire `#2A62CF` / `#173A86` with the `#4A9ED8` glow, 1.52 m tall. Not the v27 sprite's proportions or palette.
   - `systems-engineer`: the fixed-step 60 Hz loop with interpolation, the seeded RNG, the event bus that `snd()` rides (`audio.md` §2.3), Liam's kit as content data (`heroes.md` §2.5). No combat yet.
   - Audio in the pilot is optional and late: `audio.md` §4.4 asks for the engine skeleton, the four Forest beds, the campfire crackle on the shared oscillator and `amb.stream`, so the day/night and weather toggles can be heard. Do it only after the visual loop has a passing iteration.
4. **Visual loop:** capture → `art-director` scores (`art-director-max` once a pass looks like it could hit the excellence mark) → `render-engineer` implements → repeat. Commit every iteration's screenshots and log to `docs/visual-loop/`. Max 12 iterations; Brief §2(d) if unmet. Promote the winning tokens to `src/style/` and tag `p1-style-locked`.
5. End of session: `PROGRESS.md`, `COMPLETE_STATE.md` if a gate passed, rewrite this file, one summary to Andrew.

## Known issues and load-bearing findings

- **Teardown errata to fix in Phase 0 part B** (found while writing the bible): `ATMOSPHERE_RECIPES.md` §9.3 quotes the MiniBoss death-particle rate for the Enemy; `SYSTEMS_INVENTORY.md` Part 1 says the Storm Chaser `weather` bounty can never complete, but HTML L1611 calls it.
- **Historical decision lines** dated 2026-09-06 inside the design files still say "80 m island", "Shadow Realm source", "Endless-only" or "the dungeon paper minimap"; the 2026-09-07 lines supersede them (the log is append-only).
- **From the teardown, still true:** hero switching is free, instant and total (no swap cooldown); the companion fall-through bug at legacy L2290 damps companion combat movement to about 40–45 %, decide and log before porting; v27 has no campfire, lantern, sky gradient, stars, moon, ambient loops, engine sound, gamepad, save export or selection ring (all new work, now specified in the bible); orphaned canon to re-wire (Ed's `crash_landing` lines, nine `HERO_REACTIONS` contexts, `crater_hint`); `Bog Witch` and `Sand Nomad` are missing from `NPC_DEFS`; enemies have no display names in v27 (the bible authors them); skill-tree bonuses are silently wiped by `recalcHeroStats`, port the intent; frame-rate hazards are resolved by the fixed-step sim.
- **Session mechanics learned (also in `docs/DECISIONS.md`):** a new `.claude/agents/*.md` is not loadable in the turn it is written; `SendMessage` may be unavailable, so follow-ups are fresh agents with self-contained prompts; long Fable agents can hit the session limit, so split big passes and use Opus with Edit for pure application work; never `git add docs/design` wholesale while an unreviewed file sits there.

## Handy paths

`docs/BRIEF.md` · `docs/design/README.md` · `docs/SESSION_PLAN.md` · `docs/INSPECTION_CHECKLIST.md` · `docs/DECISIONS.md` · `docs/qa/` · `.claude/agents/` · teardown `docs/teardown/` · legacy source `docs/legacy/stewart-squad-v27.html` (script starts L516).
