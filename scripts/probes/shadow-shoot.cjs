// Probe: save one stepped frame of Home, Wrong with the card, and report what the scene says about
// itself while it does (`ssProbe`, the scene's own hook). 12 s after the navigation before the first
// call (LESSONS.md Process row 1: a save before the first rendered frame is a blank 58,885-byte PNG),
// then SS_STEPS frames of 1/60 s (default 120 = 2.0 s) and one ssSnap under SS_SNAP.
//   SS_SNAP=shadow-wrong-s1-02 node scripts/sandbox-drive.cjs \
//     "http://localhost:5173/sandbox/shadow-wrong/?shot=S1&t=wrong&step=1" scripts/probes/shadow-shoot.cjs
module.exports = async (page, h) => {
  const name = (process.env.SS_SNAP || '').toLowerCase();
  const steps = Number(process.env.SS_STEPS || '120');
  if (!name) throw new Error('SS_SNAP is required');
  const out = { url: page.url(), name };
  await h.sleep(12000);
  out.kf = await h.evaluate(() => globalThis.ssKf().name);
  out.t_after_steps = await h.step(steps);
  out.file = await h.snap(name);
  out.hud = await h.hud();
  out.probe = await h.evaluate(() => ({
    deer: globalThis.ssProbe.deer(),
    swingSeat: globalThis.ssProbe.swingSeat(),
    tufts: globalThis.ssProbe.tufts(),
    farFill: globalThis.ssProbe.farFill(),
  }));
  return out;
};
