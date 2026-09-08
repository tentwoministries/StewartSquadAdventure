// Probe: save one stepped frame (opus-fixes-runtime checks 6 and 7). Waits 12 s after the
// navigation (LESSONS.md Process row 1), steps SS_STEPS frames (default 120 = 2.0 s) and saves the
// canvas under SS_SNAP with the title card. The Forest scene has its own main.ts and no ssStep, so
// there it just calls that scene's ssSave() and reads the file out of the toast.
//   SS_SNAP=frozen-runtime-02 node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S1&t=night&step=1" scripts/probes/runtime-frames.cjs
module.exports = async (page, h) => {
  const name = (process.env.SS_SNAP || '').toLowerCase();
  const steps = Number(process.env.SS_STEPS || '120');
  const out = { url: page.url(), name };
  await h.sleep(12000);
  if (await h.evaluate(() => !!globalThis.ssStep)) {
    if (!name) throw new Error('SS_SNAP is required');
    out.kf = await h.evaluate(() => globalThis.ssKf().name);
    out.t_after_steps = await h.step(steps);
    out.file = await h.snap(name);
    out.hud = await h.hud();
  } else {
    await h.evaluate(() => globalThis.ssSave());
    await h.sleep(1000);
    out.file = await h.evaluate(() => globalThis.document.getElementById('toast').textContent);
    out.note = 'the Forest scene saves under its own name (scene id, time, shot, variant)';
  }
  return out;
};
