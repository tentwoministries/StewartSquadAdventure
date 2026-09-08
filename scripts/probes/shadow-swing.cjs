// Probe: the swing moves at a half-second pair (the brief's check 2). Opens the swing station,
// settles, saves one frame, steps 30 frames (0.5 s) and saves the second, reading the seat's world
// position and its position in frame pixels at each so the displacement is measured, not eyeballed.
// It also samples the seat's screen x every 5 frames over one 3.1 s period, which is the evidence
// that the ±25° swing is a real arc and not a jitter.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=SW&t=wrong&step=1" scripts/probes/shadow-swing.cjs
module.exports = async (page, h) => {
  const out = { url: page.url(), pair: [], sweep: [] };
  await h.sleep(12000);
  // 78 frames = 1.30 s, so the pair straddles the swing's centre (it crosses zero at 1.55 s on a
  // 3.1 s period) and shows the arc's fastest half-second rather than its slowest
  out.t_settled = await h.step(78);
  for (let i = 0; i < 2; i++) {
    if (i > 0) await h.step(30); // 30 frames of 1/60 s = 0.5 s
    out.pair.push({
      i, at: Number((await h.step(0)).toFixed(3)),
      file: await h.snap(`shadow-wrong-swing-${i}-02`),
      seat: await h.evaluate(() => globalThis.ssProbe.swingSeat()),
      screen: await h.evaluate(() => globalThis.ssProbe.seatScreen()),
    });
  }
  const a = out.pair[0].screen, b = out.pair[1].screen;
  out.pixels_moved = Number(Math.hypot(b.px - a.px, b.py - a.py).toFixed(1));
  out.metres_moved = Number(Math.hypot(out.pair[1].seat.x - out.pair[0].seat.x, out.pair[1].seat.z - out.pair[0].seat.z).toFixed(3));
  for (let i = 0; i < 40; i++) {
    await h.step(5);
    out.sweep.push({
      t: Number((await h.step(0)).toFixed(2)),
      z: (await h.evaluate(() => globalThis.ssProbe.swingSeat())).z,
      px: (await h.evaluate(() => globalThis.ssProbe.seatScreen())).px,
    });
  }
  const zs = out.sweep.map((s) => s.z);
  out.sweep_z_min = Math.min(...zs); out.sweep_z_max = Math.max(...zs);
  out.sweep_arc_m = Number((out.sweep_z_max - out.sweep_z_min).toFixed(3));
  return out;
};
