// Probe: save one CS-04 study frame at an exact cutscene second. Waits 12 s after the navigation
// (LESSONS.md Process row 1: a save before two rendered frames is a blank 58,885-byte PNG), steps
// the harness to SS_CT and saves the canvas with the title card under SS_SNAP.
//   SS_CT=21 SS_SNAP=flight-golden-wg node scripts/sandbox-drive.cjs "…?shot=WG&t=golden&step=1&ct=0" scripts/probes/flight-frames.cjs
module.exports = async (page, h) => {
  const name = (process.env.SS_SNAP || '').toLowerCase();
  const ct = Number(process.env.SS_CT || '0');
  if (!name) throw new Error('SS_SNAP is required');
  await h.sleep(12000);
  const before = await h.evaluate((target) => {
    globalThis.ssStep(Math.max(0, Math.round((target - globalThis.ssCut.at()) * 60)));
    const f = globalThis.ssFlight;
    return { clock: +globalThis.ssCut.at().toFixed(3), hud: f.hud(), pos: [+f.pos.x.toFixed(2), +f.pos.y.toFixed(2), +f.pos.z.toFixed(2)] };
  }, ct);
  const file = await h.snap(name);
  return { url: page.url(), requestedCt: ct, ...before, file, hudAfter: await h.hud() };
};
