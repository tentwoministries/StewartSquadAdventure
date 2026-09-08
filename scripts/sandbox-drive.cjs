// Headless driver for the sandbox demo scenes (Phase 0.75; the base of the Phase 2 smoke harness).
//   node scripts/sandbox-drive.cjs "<url>" scripts/probes/<probe>.cjs
// Launches the installed Chrome through puppeteer-core, opens the URL, waits for the scene runtime,
// then calls the probe's `module.exports = async (page, helpers) => …` and prints what it returns as
// JSON. Console errors and page errors go to stderr. Run it with the repo as cwd (puppeteer-core is
// resolved from node_modules). SS_CHROME overrides the browser path.
const path = require('path');
const { setTimeout: sleep } = require('node:timers/promises');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.SS_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARGS = ['--use-angle=default', '--enable-unsafe-swiftshader', '--window-size=1600,1000', '--hide-scrollbars'];

async function main() {
  const [url, probePath] = process.argv.slice(2);
  if (!url || !probePath) {
    console.error('usage: node scripts/sandbox-drive.cjs "<url>" <probe.cjs>');
    process.exit(2);
  }
  const probe = require(path.resolve(probePath));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    page.on('console', (m) => { if (m.type() === 'error') console.error('[console] ' + m.text()); });
    page.on('pageerror', (e) => console.error('[pageerror] ' + e.message));
    await page.goto(url, { waitUntil: 'load' });
    // ssWorld is the shared runtime; ssSave alone is the Forest scene, which has its own main.ts
    await page.waitForFunction(() => !!globalThis.ssWorld || !!globalThis.ssSave, { timeout: 60000 });
    const helpers = {
      /** Render n frames of 1/60 s; returns the scene clock after them. */
      step: (n) => page.evaluate((k) => globalThis.ssStep(k), n),
      /** Render one frame and save it under a lowercase name; returns the file. */
      snap: (name) => page.evaluate((s) => globalThis.ssSnap(s), name),
      /** Press a key (scene keys, Tab, Enter). */
      key: (k) => page.evaluate((s) => globalThis.ssKey(s), k),
      /** The scene's own HUD lines (SceneWorld.hud), or [] when it has none. */
      hud: () => page.evaluate(() => (globalThis.ssWorld && globalThis.ssWorld.hud ? globalThis.ssWorld.hud() : [])),
      /** page.evaluate, for anything the four above do not cover. */
      evaluate: (fn, ...args) => page.evaluate(fn, ...args),
      /** Wait real wall-clock milliseconds (the 10–12 s after a navigation, before a save). */
      sleep: (ms) => sleep(ms),
    };
    const out = await probe(page, helpers);
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
