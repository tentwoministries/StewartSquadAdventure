// Probe: T-54, the herd crosses on its own (reel fixes round 1, check 4). No key is ever pressed:
// it steps 120 s of scene time, sampling the wander's state, the bull and the schedule every 60
// frames, and saves the S2 frame at 32 s with the bull's position in frame pixels, so "the herd is
// in S2's frame" is measured and not hoped for.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S2&t=night&step=1" scripts/probes/frozen-herd.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(0), keys_pressed: 'none' };
  out.herd_at_load = await h.evaluate(() => globalThis.ssProbe.herd());

  const screen = () => h.evaluate(() => {
    const scene = globalThis.ssKids[0].root.parent; let cam = null; scene.traverse((o) => { if (o.isPerspectiveCamera) cam = o; });
    const T = globalThis.ssTHREE, b = globalThis.ssProbe.herd().bull;
    const v = new T.Vector3(b.x, b.y + 1.4, b.z).project(cam);
    return { bull: [Number(b.x.toFixed(2)), Number(b.z.toFixed(2))], px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(0)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(0)), inFrame: Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.94 && v.z < 1 };
  });
  const rows = [];
  for (let i = 0; i < 120; i++) {
    const t = await h.step(60);
    const s = await h.evaluate(() => globalThis.ssProbe.herd());
    const sc = await screen();
    rows.push({ t: Number(t.toFixed(2)), state: s.state, x: s.x, z: s.z, dPark: s.dPark, speed: s.speed, crossIdx: s.crossIdx, crossings: s.crossings, px: sc.px, inFrame: sc.inFrame });
    if (Math.abs(t - 32) < 0.51 && !out.s2) out.s2 = { t: Number(t.toFixed(2)), file: await h.snap('frozen-night-s2-03'), herd: s, screen: sc };
    // and the frame the crossing is actually composed for: the first second the bull is in S2's lens
    if (!out.s2_crossing && sc.inFrame && s.state === 'walk' && s.crossIdx === 1 && t > 33) out.s2_crossing = { t: Number(t.toFixed(2)), file: await h.snap('frozen-night-s2-03'), herd: s, screen: sc };
  }
  out.timeline = rows.map((r) => [r.t, r.state, r.x, r.z, r.dPark]);
  out.crossings = rows[rows.length - 1].crossings;
  // a walk that *begins*: the first sample of each unbroken run of state 'walk'
  const starts = [];
  rows.forEach((r, i) => { if (r.state === 'walk' && (i === 0 || rows[i - 1].state !== 'walk')) starts.push(r.t); });
  out.walk_starts = starts;
  out.at_45s = rows.find((r) => Math.abs(r.t - 45) < 0.51);
  out.max_dPark = Math.max(...rows.map((r) => r.dPark));
  out.hud = await h.hud();
  return out;
};
