// Probe: T-54, key 0 still forces the next crossing (reel fixes round 1, check 4, second half). On a
// fresh load it steps to 5 s, presses 0, and shows the wander in state 'walk' inside one second —
// well before the scheduled 20 s pass — and that the schedule then holds the second pass only.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S2&t=night&step=1" scripts/probes/frozen-herd-key.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url() };
  out.t_before = await h.step(300); // 5 s
  out.before = await h.evaluate(() => globalThis.ssProbe.herd());
  await h.key('0');
  const after = [];
  for (let i = 0; i < 6; i++) {
    const t = await h.step(10);
    const s = await h.evaluate(() => globalThis.ssProbe.herd());
    after.push({ t: Number(t.toFixed(3)), state: s.state, x: s.x, z: s.z, dPark: s.dPark, crossIdx: s.crossIdx, crossings: s.crossings });
  }
  out.after_key = after;
  out.walk_within_1s = after.some((a) => a.state === 'walk' && a.t - out.t_before <= 1.0);
  // and the schedule keeps its second pass: step past 20 s and read the counter
  await h.step(1200); // to t ≈ 26 s
  out.at_26s = await h.evaluate(() => globalThis.ssProbe.herd());
  out.hud = await h.hud();
  return out;
};
