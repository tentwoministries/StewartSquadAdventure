// Probe: T-44, the double-tap sprint lock (brief `reel-fixes-shared-03.md` check 4), on a stepped
// scene. Every window the lock uses is counted on the scene's own clock, so the two taps are six
// stepped frames apart with no wall-clock time passing at all — which is the check that the window
// reads the sim clock and not globalThis.performance.now() (Tier-0 rule 9, T-35).
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S1&t=golden&step=1" scripts/probes/shared-sprint.cjs
module.exports = async (page, h) => {
  const out = { url: page.url() };
  await h.sleep(12000);
  await h.step(30);

  const down = (k, repeat = false) => page.evaluate((s, r) => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: s, repeat: r, bubbles: true })), k, repeat);
  const up = (k) => page.evaluate((s) => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: s, bubbles: true })), k);
  const state = () => h.evaluate(() => ({ sprint: globalThis.ssWalk.sprint, top: globalThis.ssWalk.top, moving: globalThis.ssWalk.moving }));
  const pos = () => h.evaluate(() => { const p = globalThis.ssWalk.hero.position; return [p.x, p.y, p.z]; });
  // speed straight from the walker's travel: the position delta per stepped frame × 60
  const run = async (frames) => {
    const speeds = [];
    let last = await pos();
    for (let i = 0; i < frames; i++) {
      await h.step(1);
      const p = await pos();
      speeds.push(Math.hypot(p[0] - last[0], p[2] - last[2]) * 60);
      last = p;
    }
    const tail = speeds.slice(-20);
    return {
      frames, max: Number(Math.max(...speeds).toFixed(3)),
      settled: Number((tail.reduce((a, b) => a + b, 0) / tail.length).toFixed(3)),
      ...(await state()),
    };
  };

  // Every phase starts from the same spot facing the same open lane, so a speed is the walk's own
  // top speed and not a kid pushing into a prop (the walk halves her velocity when the next step is
  // blocked). The lane is chosen once by marching the scene's own ground and blockers.
  const home = await pos();
  out.lane = await h.evaluate(
    (hx, hz) => {
      const w = globalThis.ssWorld;
      const wy = (w.waterY ?? -0.25) + 0.14;
      let best = 0, bear = 0;
      for (let a = 0; a < 360; a += 10) {
        const vx = Math.sin((a * Math.PI) / 180), vz = -Math.cos((a * Math.PI) / 180);
        let s = 0;
        for (; s < 45; s++) {
          const x = hx + vx * s, z = hz + vz * s;
          if (w.groundY(x, z) <= wy || (w.walkable && !w.walkable(x, z))) break;
          if (w.blockers.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 1.2)) break;
        }
        if (s > best) { best = s; bear = a; }
      }
      return { bearing: bear, clear_m: best };
    },
    home[0],
    home[2],
  );
  const reset = async () => {
    await h.evaluate(
      (x, y, z, b) => {
        globalThis.ssWalk.hero.position.set(x, y, z);
        globalThis.ssOrbit.current.yaw = b;
        globalThis.ssOrbit.apply();
      },
      home[0], home[1], home[2], out.lane.bearing,
    );
    await h.step(30);
  };
  await reset();

  // 1. the double tap: two shift keydowns six stepped frames (0.1 s of scene clock) apart
  await down('Shift');
  out.after_first_tap = await state();
  await h.step(6);
  await down('Shift');
  out.after_second_tap = await state();
  await up('Shift'); // the lock holds with shift released — that is what "lock" means
  await down('w');
  out.sprint_run = await run(180);
  await up('w');

  // 2. the idle clear: no movement input for 0.4 s (30 stepped frames is 0.5 s)
  const idle = await run(30);
  out.after_idle_release = { sprint: idle.sprint, top: idle.top };
  await down('w');
  out.after_clear_walk = await run(120);
  await up('w');
  await run(60);
  await reset();

  // 3. shift held, no double tap: the plain run
  await down('Shift');
  await down('w');
  out.held_shift_run = await run(180);
  await up('w');
  await up('Shift');
  await run(60);

  // 4. e.repeat is not a second tap
  await down('Shift');
  await h.step(6);
  await down('Shift', true); // a held key's auto-repeat
  out.after_repeat_keydown = await state();
  await up('Shift');
  await run(40);
  await reset();

  // 5. the tap-to-clear path, exercised while she is still moving (so the idle timeout cannot be
  //    what cleared it)
  await down('w');
  await run(30);
  await down('Shift');
  await h.step(6);
  await down('Shift');
  out.relatched = await state();
  await run(60);
  await down('Shift'); // the third, single tap
  out.after_third_tap = await state();
  out.after_third_tap_run = await run(120);
  await up('Shift');
  await up('w');
  out.frame = await h.snap(process.env.SS_NAME || 'meadow-golden-sprint-03');
  return out;
};
