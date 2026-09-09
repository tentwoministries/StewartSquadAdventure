// Probe: audit item 7 — one frame per scene from the *merged* tree. Every builder in "the reel fixes,
// round 1" shot its sweep against a tree that later changed under it, so the nine scenes have never
// been rendered as one set. One browser, nine navigations, each scene's own default station and its
// own default time with `?t=` explicit (T-29), 12 s of wall clock after each `goto` (a save before
// the first rendered frame is a blank 59 KB canvas), then ssStep(120) and ssSnap.
// The Forest has its own main.ts and no ssStep: its `ssSave()` names the file itself, so `fetch` is
// stubbed round the call to rewrite the `study=` query the shot endpoint reads.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?t=night&step=1" scripts/probes/round2-frames.cjs
const BASE = 'http://localhost:5173/sandbox/';
const SCENES = [
  ['bog-night', 'night'], ['caves-descent', 'half'], ['desert-noon', 'noon'], ['flight-golden', 'golden'],
  ['forest-dusk', 'dusk'], ['frozen-night', 'night'], ['meadow-golden', 'golden'], ['rim-dawn', 'dawn'],
  ['shadow-wrong', 'wrong'],
];

module.exports = async (page, h) => {
  const out = { frames: [] };
  for (const [scene, t] of SCENES) {
    const url = `${BASE}${scene}/?t=${t}&step=1`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld || !!globalThis.ssSave, { timeout: 60000 });
    await h.sleep(12000);
    const name = `${scene}-round2-04b`;
    const row = { scene, t, url };
    if (await h.evaluate(() => !!globalThis.ssStep)) {
      row.kf = await h.evaluate(() => globalThis.ssKf().name);
      row.station = await h.evaluate(() => {
        const o = globalThis.ssOrbit.current;
        return { yaw: o.yaw, pitch: o.pitch, d: o.d, target: o.target.map((v) => Number(v.toFixed(2))) };
      });
      row.clock = Number((await h.step(120)).toFixed(2));
      row.file = await h.snap(name);
      row.active = await h.evaluate(() => globalThis.ssActive().name);
    } else {
      row.file = await h.evaluate(async (n) => {
        const real = globalThis.fetch.bind(globalThis);
        globalThis.fetch = (u, o) => real(typeof u === 'string' && u.includes('/__sandbox/shot') ? `/__sandbox/shot?study=${encodeURIComponent(n)}` : u, o);
        try { await globalThis.ssSave(); } finally { globalThis.fetch = real; }
        return globalThis.document.getElementById('toast').textContent;
      }, name);
      row.note = 'the Forest has its own main.ts: ssSave() on the wall clock, the name rewritten through fetch';
    }
    out.frames.push(row);
  }
  return out;
};
