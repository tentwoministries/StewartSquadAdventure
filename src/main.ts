// Boot entry. Phase 1 (pilot) replaces this stub with the real scene boot.
// See docs/BRIEF.md §7 and docs/NEXT_SESSION.md.
import { GAME_TITLE, GAME_VERSION } from './engine/version';

const root = document.getElementById('app');
if (root) {
  root.textContent = `${GAME_TITLE} — ${GAME_VERSION} (scaffold; Phase 1 pilot not started)`;
  root.style.cssText += 'display:grid;place-items:center;color:#FFD08A;font:16px system-ui;';
}
