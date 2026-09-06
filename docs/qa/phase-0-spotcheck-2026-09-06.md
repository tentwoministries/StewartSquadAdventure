# Phase 0 spot-check — orchestrator gate (partial)

**GATE: NOT YET CLOSED.** Five of seven teardown documents are delivered and spot-checked; `KEEP_CHANGE_DROP.md` and `PORT_MAP.md` are blocked on the missing legacy inputs (Working Rule 1). The `p0-teardown` tag waits for them. Everything below passed.

Definition of Done (Brief §3): an implementer with no other context can answer "how does X work in v27" from `docs/teardown/` alone; the orchestrator spot-checks ten systems against the HTML. Twelve were checked. Method: `grep -n` / `sed -n` on `docs/legacy/stewart-squad-v27.html` versus the claim in the doc.

| # | System | Doc | Claim checked | Source evidence | Result |
|---|---|---|---|---|---|
| 1 | Procedural audio | AUDIO_INVENTORY | 29 `snd()` recipes; `sword` recipe reproduced verbatim | 29 unique `if(type==='…')` branches in L538–578; L548 matches byte-for-byte | pass |
| 2 | Audio call sites | AUDIO_INVENTORY | `shield`, `heal`, `questComplete` are called but never defined | called at L2261, L2381/2402, L695; zero definitions in the `snd()` body | pass |
| 3 | Key bindings | CONTROL_MODEL | `keyBinds` default table (20 actions) | L605 matches every key listed | pass |
| 4 | Companion AI | CONTROL_MODEL | `} else var fd=45+idx*10;` fall-through bug at L2290 | exact string present at L2290 | pass |
| 5 | Gamepad / auto-aim | CONTROL_MODEL | no gamepad code; `settings.autoAim` declared but never read | 0 hits for `getGamepads`/`gamepadconnected`; `autoAim` only at L594 and L4290 | pass |
| 6 | Hero identity | FAMILY_CANON, SYSTEMS_INVENTORY | code colors Liam `#4A9ED8`, Noah `#2DB86A`, Collette `#A862C4`, Isabella `#F0C040` | CSS L12, `HDEFS` L2139–2145, title cards L316–319 all agree | pass (conflict with Brief §1 escalated to Andrew) |
| 7 | Achievements | FAMILY_CANON, SYSTEMS_INVENTORY | 31 achievements | 31 keys in `achievements` (L881); all 31 present in the canon doc | pass |
| 8 | Day/night keyframes | ATMOSPHERE_RECIPES | phase boundaries 0.35 / 0.45 / 0.75 / 0.85 of `DAY_CYCLE=240` | L857–866 | pass |
| 9 | Light sources | ATMOSPHERE_RECIPES | no campfire or lantern exists in v27 | 0 hits for `campfire` / `lantern` (case-insensitive) | pass |
| 10 | XP curve and NG+ | SYSTEMS_INVENTORY | `need=30+teamLv*15`; NG+1 row `{enemyHp:1.5,enemyDmg:1.3,enemySpd:1.1,xpMul:1.5,goldMul:1.5}` | L2700–2722, L652 | pass |
| 11 | Quest graph | SYSTEMS_INVENTORY (Part 2) | all 18 `QUEST_DEFS` keys documented; `swamp_2` escort unfinishable because `Bog Witch` is not in `NPC_DEFS` | 18 keys at L697–721 all present in doc; 0 hits for `Bog Witch` in L626–633 | pass |
| 12 | Networking and story flags | SYSTEMS_INVENTORY (Part 2) | message types `join/host/input/state/event/ping`; 10 story flags | L1364–1520, L8668–8700, L9150–9170; `storyFlags` at L749 | pass |

Also verified: `ETYPES` has 17 enemy types (Brief §1 says sixteen); v27 has no save export/import; `addAbilityVFX` is defined once and never called.

## Findings that need Andrew (Brief §2 interrupts)

1. **Hero colors (§2(b)).** Brief §1 and the Working Rules say Noah is orange and Isabella pink/red. Every v27 source says Noah green `#2DB86A` and Isabella gold `#F0C040` (Isabella's damage numbers and cape are orange `#D88030`, her bows pink). Which is canon for the rebuild?
2. **Missing inputs (§0.1).** `stewart-squad-v26-complete-state.md`, `stewart-squad-gameplay-brainstorm-v2.md`, `stewart-squad-dev-instructions.md`, `docs/reference/fernwood.jpeg`.

## Deferred / excluded

- `KEEP_CHANGE_DROP.md`, `PORT_MAP.md`: blocked on the brainstorm doc's resolved decisions.
- The five delivered docs should get a one-pass reconciliation against the complete-state and brainstorm docs when those arrive (a mechanical archaeologist task).
