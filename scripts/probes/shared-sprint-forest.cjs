// Probe: T-44 in the Forest scene, which keeps its own main.ts and its own walk.ts and has no
// stepping harness (it exposes ssSave, ssWalk, ssLiam, ssOrbit — not ssWorld/ssStep). So this one
// drives it on the wall clock: it dispatches the keys, samples Liam's position from inside the page
// over a window, and returns the speed. The lock's windows are counted on the walk's own dt, which
// here is the real frame dt.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/forest-dusk/?shot=S1" scripts/probes/shared-sprint-forest.cjs
module.exports = async (page, h) => {
  const out = { url: page.url() };
  await h.sleep(12000);

  const down = (k, repeat = false) => page.evaluate((s, r) => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: s, repeat: r, bubbles: true })), k, repeat);
  const up = (k) => page.evaluate((s) => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: s, bubbles: true })), k);
  const state = () => h.evaluate(() => ({ sprint: globalThis.ssWalk.sprint, top: globalThis.ssWalk.top, moving: globalThis.ssWalk.moving }));
  // sample inside the page on animation frames, so the speed is the walker's own travel per second
  const measure = (ms) =>
    page.evaluate(
      (t) =>
        new Promise((res) => {
          const p0 = globalThis.ssLiam.position.clone();
          let last = p0.clone(), lastT = globalThis.performance.now(), peak = 0;
          const tick = () => {
            const now = globalThis.performance.now();
            const p = globalThis.ssLiam.position;
            const dt = (now - lastT) / 1000;
            if (dt > 0.008) {
              const v = Math.hypot(p.x - last.x, p.z - last.z) / dt;
              if (v > peak) peak = v;
              last = p.clone(); lastT = now;
            }
            if (now - t0 < t) globalThis.requestAnimationFrame(tick);
            else res({ peak: Number(peak.toFixed(3)), mean: Number((Math.hypot(p.x - p0.x, p.z - p0.z) / ((now - t0) / 1000)).toFixed(3)), ms: Math.round(now - t0) });
          };
          const t0 = globalThis.performance.now();
          globalThis.requestAnimationFrame(tick);
        }),
      ms,
    );
  const home = await h.evaluate(() => { const p = globalThis.ssLiam.position; return [p.x, p.y, p.z]; });
  const reset = async () => {
    await h.evaluate((x, y, z) => { globalThis.ssLiam.position.set(x, y, z); }, home[0], home[1], home[2]);
    await h.sleep(600);
  };
  // (the lane is chosen just below, once the page is known to be animating)

  const face = (b) => h.evaluate((y) => { globalThis.ssOrbit.current.yaw = y; globalThis.ssOrbit.apply(); }, b);

  // is the page actually animating? (a stalled clock would make every number below zero) — and while
  // we are here, pick the lane: the camp is full of trunks and the walk deflects off them, so try the
  // four cardinals at a plain walk and keep the one that travels furthest
  out.lanes = [];
  for (const b of [0, 90, 180, 270]) {
    await reset();
    await face(b);
    await down('w');
    await h.sleep(400);
    out.lanes.push({ bearing: b, ...(await measure(900)) });
    await up('w');
    await h.sleep(500);
  }
  out.alive = out.lanes.reduce((a, b) => (b.mean > a.mean ? b : a));
  const lane = out.alive.bearing;
  await reset();
  await face(lane);

  // 1. the double tap, 100 ms apart on the wall clock
  await down('Shift');
  out.after_first_tap = await state();
  await h.sleep(100);
  await down('Shift');
  out.after_second_tap = await state();
  await up('Shift');
  await down('w');
  await h.sleep(1500); // let the 8/s ease reach the top speed
  out.sprint_run = { ...(await measure(1500)), ...(await state()) };
  await up('w');

  // 2. the idle clear (0.5 s with no movement input), then the plain walk
  await h.sleep(600);
  out.after_idle_release = await state();
  await reset();
  await face(lane);
  await down('w');
  await h.sleep(1200);
  out.after_clear_walk = { ...(await measure(1200)), ...(await state()) };
  await up('w');
  await h.sleep(600);
  await reset();
  await face(lane);

  // 3. shift held, no double tap
  await down('Shift');
  await down('w');
  await h.sleep(1500);
  out.held_shift_run = { ...(await measure(1500)), ...(await state()) };
  await up('w');
  await up('Shift');
  await h.sleep(600);

  // 4. e.repeat is not a second tap
  await down('Shift');
  await h.sleep(100);
  await down('Shift', true);
  out.after_repeat_keydown = await state();
  await up('Shift');
  return out;
};
