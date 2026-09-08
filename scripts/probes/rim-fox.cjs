// Probe: the fox reaches the end of its route, pauses three seconds looking at the camp, and turns
// back with an eased heading (opus-fixes-rim check 4, the tempo half). Steps to the far end (40 m
// at 0.9 m/s is 44.4 s) and then samples every 6 frames (0.1 s) through the turnaround.
module.exports = async (page, h) => {
  await h.sleep(11000);
  const out = { url: page.url() };
  out.coarse = [];
  for (let i = 0; i < 42; i++) {
    const t = await h.step(60);
    const f = await h.evaluate(() => globalThis.ssWorld.probe().fox);
    if (i > 38) out.coarse.push({ t: Number(t.toFixed(2)), u: Number(f.u.toFixed(4)), pause: Number(f.pause.toFixed(2)), speed: Number(f.speed.toFixed(3)) });
  }
  const fine = [];
  for (let i = 0; i < 90; i++) {
    const t = await h.step(6);
    const f = await h.evaluate(() => globalThis.ssWorld.probe().fox);
    fine.push({ t: Number(t.toFixed(2)), u: Number(f.u.toFixed(4)), dir: f.dir, pause: Number(f.pause.toFixed(2)), speed: Number(f.speed.toFixed(3)), heading: Number(f.heading.toFixed(4)) });
  }
  out.fine = fine;
  const d = fine.map((f, i) => (i ? Math.abs(Math.atan2(Math.sin(f.heading - fine[i - 1].heading), Math.cos(f.heading - fine[i - 1].heading))) : 0));
  out.max_heading_step_per_0_1s = Math.max(...d);
  out.turn_samples_over_0_02rad = d.filter((v) => v > 0.02).length;
  out.pause_len_s = fine.filter((f) => f.pause > 0).length * 0.1;
  out.speeds_while_moving = [...new Set(fine.filter((f) => f.pause === 0 && f.speed > 0).map((f) => f.speed))];
  return out;
};
