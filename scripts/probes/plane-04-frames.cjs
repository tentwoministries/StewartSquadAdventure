// Probe: the `_shared/` gate for the round-2 plane (Tier-0 rule 10 — a change under sandbox/_shared/
// is checked with one frame per scene). One browser, nine navigations, each scene's own default
// station and its own default time with `?t=` explicit (T-29), 12 s of wall clock after each `goto`,
// then ssStep(120) and ssSnap under `<scene>-plane-04`. Directly comparable with the merged
// `<scene>-round1-03-02.png` set, which was shot the same way.
//
// On the three scenes that *park* the Green Meanie (Bog, Desert, Frozen) it also measures the
// pennant with the plane's own one-argument `plane.update(t)` driving it: the chain is found by
// walking the scene graph for a group hanging off the rear outer strut, and its tip is sampled over
// 120 stepped frames to show a parked flag still lives at wind 0 (rule sheet check 6).
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?t=night&step=1" scripts/probes/plane-04-frames.cjs
const BASE = 'http://localhost:5173/sandbox/';
const SCENES = [
  ['bog-night', 'night'], ['caves-descent', 'half'], ['desert-noon', 'noon'], ['flight-golden', 'golden'],
  ['forest-dusk', 'dusk'], ['frozen-night', 'night'], ['meadow-golden', 'golden'], ['rim-dawn', 'dawn'],
  ['shadow-wrong', 'wrong'],
];
const PARKED = new Set(['bog-night', 'desert-noon', 'frozen-night']);

const PENNANT = () => {
  const T = globalThis.ssTHREE;
  const scene = globalThis.ssCtx.camera.parent;
  let root = null;
  scene.traverse((o) => {
    if (!root && o.type === 'Group' && Math.abs(o.position.x - 0.1) < 1e-6 && Math.abs(o.position.y - 2.0) < 1e-6 && Math.abs(o.position.z + 2.4) < 1e-6) root = o;
  });
  if (!root) return { found: false };
  let tip = root;
  for (;;) { const kid = tip.children.find((c) => c.type === 'Group'); if (!kid) break; tip = kid; }
  const w = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3();
  const samples = [];
  for (let i = 0; i < 120; i++) {
    globalThis.ssStep(1);
    root.updateMatrixWorld(true);
    root.getWorldPosition(a);
    tip.localToWorld(w.set(0.28, 0, 0));
    b.copy(w);
    samples.push([b.x - a.x, b.y - a.y, b.z - a.z]);
  }
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  let travel = 0;
  for (const s of samples) travel = Math.max(travel, d(s, samples[0]));
  const drop = samples.map((s) => s[1]);
  return {
    found: true, frames: samples.length,
    tipTravel: +travel.toFixed(4),
    tipBelowRootEveryFrame: drop.every((y) => y < 0),
    tipDrop: { min: +Math.min(...drop).toFixed(3), max: +Math.max(...drop).toFixed(3) },
  };
};

module.exports = async (page, h) => {
  const out = { frames: [] };
  for (const [scene, t] of SCENES) {
    const url = `${BASE}${scene}/?t=${t}&step=1`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld || !!globalThis.ssSave, { timeout: 60000 });
    await h.sleep(12000);
    const name = `${scene}-plane-04`;
    const row = { scene, t, url };
    if (await h.evaluate(() => !!globalThis.ssStep)) {
      row.kf = await h.evaluate(() => globalThis.ssKf().name);
      row.clock = Number((await h.step(120)).toFixed(2));
      row.file = await h.snap(name);
      if (PARKED.has(scene)) row.pennant = await h.evaluate(PENNANT);
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
