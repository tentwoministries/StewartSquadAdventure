// Probe: the `J` relief cycle in the Crystal Caves (T-61, docs/qa/briefs/reel-fixes-caves-04.md
// fix 7; rule sheet check 1, the never-run rule — a mechanic is not built until a stepped probe has
// shown every state reached).
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-relief-04.cjs
//
// Part A cycles J from the default (chunky) through blocks -> flat -> chunky and back, quoting the
// HUD's relief line at every state, the four kids' `root.y - groundY` after each rebuild (nobody
// left inside rock), and the salamanders' arc/height (they are re-cast on the new stair).
// Part B navigates to `?relief=flat`, `?relief=chunky` and `?relief=blocks` and reads the same line,
// so the URL form is shown to work on a fresh load, not only through the key.
const BASE = 'http://localhost:5173/sandbox/caves-descent/';

const read = async (h) => h.evaluate(() => {
  const w = globalThis.ssWorld;
  const lines = w.hud();
  const kids = globalThis.ssKids.map((k) => ({
    name: k.name,
    y: +k.root.position.y.toFixed(4),
    g: +w.groundY(k.root.position.x, k.root.position.z).toFixed(4),
    insideRock: +(w.groundY(k.root.position.x, k.root.position.z) - k.root.position.y).toFixed(4),
  }));
  const scene = globalThis.ssKids[0].root.parent;
  const rock = ['tiers', 'stairs'].map((n) => {
    const m = scene.getObjectByName(n);
    return { name: n, verts: m ? m.geometry.getAttribute('position').count : null };
  });
  return { relief: lines[0], salamanders: lines.find((l) => l.includes('salamanders')), kids, rock };
});

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), states: [], urlForm: [] };
  out.states.push({ step: 'load (default)', ...(await read(h)) });
  for (let i = 0; i < 4; i++) {
    await h.key('j');
    await h.step(12);            // 0.2 s: the rebuild is one frame, the step proves it still draws
    out.states.push({ step: `J #${i + 1}`, toast: await h.evaluate(() => globalThis.document.getElementById('toast').textContent), ...(await read(h)) });
  }
  for (const r of ['flat', 'chunky', 'blocks']) {
    await page.goto(`${BASE}?shot=S1&t=half&step=1&relief=${r}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
    await h.sleep(12000);
    await h.step(60);
    out.urlForm.push({ param: r, ...(await read(h)) });
  }
  return out;
};
