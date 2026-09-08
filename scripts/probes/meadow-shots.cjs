// The scene's timed frames (opus-fixes-meadow checks 2, 3 and 5). SS_SHOT picks which:
//   beat     — the `?beat=1` connect: step to the frame the hit-stop starts on, save it
//   ribbon   — X, then +0.1 s and +0.4 s (ssStep(6) / ssStep(18); ssSnap renders one more frame)
//   shatter  — send the goblins, close, Ground Pound, then +0.4 s and +0.8 s from the impact
// Every save carries the card and the explicit `?t=` of the URL (T-29).
//   SS_SHOT=beat node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S3&t=golden&step=1&beat=1" scripts/probes/meadow-shots.cjs
module.exports = async (page, h) => {
  const shot = process.env.SS_SHOT;
  await h.sleep(12000);
  const out = { url: page.url(), shot };
  const probe = () => h.evaluate(() => globalThis.ssWorld.probe());

  if (shot === 'beat') {
    out.stepped = await h.evaluate(() => {
      const ctx = globalThis.ssCtx;
      let n = 0, t = 0;
      while (n++ < 120 && !ctx.stopped) t = globalThis.ssStep(1);
      return { frames: n, t: Number(t.toFixed(3)), stopped: ctx.stopped };
    });
    out.probe = await probe();
    out.file = await h.snap('meadow-golden-beat-02');
    return out;
  }

  if (shot === 'ribbon') {
    await h.key('x');
    out.t0 = await h.step(6);
    out.at_0_1s = await probe();
    out.file_0 = await h.snap('meadow-golden-ribbon-0-02');
    out.t1 = await h.step(18);
    out.at_0_4s = await probe();
    out.file_1 = await h.snap('meadow-golden-ribbon-1-02');
    return out;
  }

  if (shot === 'shatter') {
    out.approach = await h.evaluate(() => {
      const w = globalThis.ssWorld;
      globalThis.ssKey('0');
      let t = 0, n = 0;
      while (n++ < 1200) { t = globalThis.ssStep(1); if (w.probe().goblins.some((g) => g.state !== 'dead' && g.d < 2.2)) break; }
      globalThis.ssKey('g');
      let m = 0;
      while (m++ < 60) { t = globalThis.ssStep(1); if (w.probe().shardsLive > 0) break; }
      return { t_at_impact: Number(t.toFixed(3)), frames: n + m };
    });
    // ssSnap renders a frame itself, so step 23 then snap lands on +0.4 s from the impact frame
    await h.step(23);
    out.at_0_4s = await probe();
    out.file_0 = await h.snap('meadow-golden-shatter-0-02');
    await h.step(23);
    out.at_0_8s = await probe();
    out.file_1 = await h.snap('meadow-golden-shatter-1-02');
    return out;
  }
  throw new Error('SS_SHOT must be beat, ribbon or shatter');
};
