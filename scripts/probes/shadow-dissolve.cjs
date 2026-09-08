// Probe: the shadow deer's dissolve, stepped (the brief's check 1; Tier-0 "a mechanic is not built
// until it has been seen to run", and a keyed mechanic is not done until a stepped probe has shown
// every state). Opens the deer station, settles, presses the scene key `0`, and saves a filmstrip at
// +0.0 / +0.4 / +0.8 / +1.2 / +1.6 s with the scene's own state read at each frame.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=DE&t=wrong&step=1" scripts/probes/shadow-dissolve.cjs
module.exports = async (page, h) => {
  const out = { url: page.url(), frames: [] };
  await h.sleep(12000);
  out.t_settled = await h.step(120);
  out.before = await h.evaluate(() => globalThis.ssProbe.deer());
  await h.key('0');
  for (let i = 0; i < 5; i++) {
    if (i > 0) await h.step(24); // 24 frames of 1/60 s = 0.4 s
    const file = await h.snap(`shadow-wrong-dissolve-${i}-02`); // ssSnap renders one frame itself
    out.frames.push({
      i, at: Number((await h.step(0)).toFixed(3)), file,
      deer: await h.evaluate(() => globalThis.ssProbe.deer()),
      hud: (await h.hud())[1],
    });
  }
  await h.step(120);
  out.after_2s_more = await h.evaluate(() => globalThis.ssProbe.deer());
  return out;
};
