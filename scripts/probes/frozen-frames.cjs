// Probe: the record frames for Andrew's pass (reel fixes round 1, check 5). Loads a station, settles
// 12 s, steps 8 s of scene time so the scene is in motion (the aurora, the snow, the creatures) and
// saves one frame. The station is passed in the URL, the name on the command line's URL hash.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S1&t=night&step=1#frozen-night-s1-03" scripts/probes/frozen-frames.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const name = (page.url().split('#')[1] || 'frozen-night-frame-03').toLowerCase();
  const out = { url: page.url(), name };
  out.t = await h.step(480);
  out.file = await h.snap(name);
  out.hud = await h.hud();
  out.probe = await h.evaluate(() => ({ herd: globalThis.ssProbe.herd(), seals: globalThis.ssProbe.seals(), penguins: globalThis.ssProbe.penguins().map((p) => p.phase) }));
  return out;
};
