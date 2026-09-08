// Probe: the scene's hit-stop is the runtime's (T-31, opus-fixes-meadow check 4). On `?beat=1` the
// whirl fires on the first frame and connects on the three goblins beside her. Part A walks Isabella
// (W held) into that connect and holds every frame the stop covers: her position, the walker, and
// Liam's t-driven terms (his selection ring is 1 + 0.06·sin(t·5.236), so a frozen scale is proof the
// sim clock is held) must not move, while the ribbon keeps sweeping — it is the effect that caused
// the stop. Part B calls ctx.stop(0.25) mid-ease so the same exemption shows in the ribbon's radius
// across three stopped frames, which the real 0.04 s connect is too late in the ease to show.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S3&t=golden&step=1&beat=1" scripts/probes/meadow-hitstop.cjs
module.exports = async (page, h) => {
  await h.sleep(4000);
  return h.evaluate(() => {
    const ctx = globalThis.ssCtx, w = globalThis.ssWorld, walk = globalThis.ssWalk;
    const isa = globalThis.ssKids[0], liam = globalThis.ssKids[1];
    const rib = isa.root.getObjectByName('isabella.whirlRibbon');
    const p3 = (o) => [Number(o.x.toFixed(6)), Number(o.y.toFixed(6)), Number(o.z.toFixed(6))];
    const snap = () => ({
      stopped: ctx.stopped,
      stopDt: Number(ctx.stopDt.toFixed(6)),
      isabella: p3(isa.root.position),
      walker_moving: walk.moving,
      liam_ring_scale: Number(liam.ring.scale.x.toFixed(9)),
      liam_chest_scale: Number(liam.bones.chest.scale.x.toFixed(9)),
      ribbon_r: Number(rib.scale.x.toFixed(6)),
      ribbon_deg: Number(((-rib.rotation.y * 180) / Math.PI).toFixed(3)),
      fxT: Number(w.probe().fxT.toFixed(6)),
      felled: w.probe().felled,
    });
    const out = { A_the_whirl_connect: {}, B_a_stop_mid_ease: {} };

    // ---- A: the real connect ------------------------------------------------------------------
    const A = out.A_the_whirl_connect;
    globalThis.ssKey('w');
    let guard = 0;
    while (guard++ < 120 && !ctx.stopped) globalThis.ssStep(1);
    A.frames_to_first_stop = guard;
    A.stop_seconds_requested = 0.04;
    A.frames = [snap()];
    let n = 0;
    while (ctx.stopped && n++ < 20) { globalThis.ssStep(1); A.frames.push(snap()); }
    A.after_the_stop = A.frames[A.frames.length - 1];
    const first = A.frames[0], last = A.frames[A.frames.length - 2];   // the last frame still stopped
    A.stopped_frames = A.frames.length - 1;
    A.verdict = {
      stopped_at_the_hit: first.stopped,
      isabella_frozen_through_the_stop: JSON.stringify(first.isabella) === JSON.stringify(last.isabella),
      walker_still_moving: first.walker_moving && last.walker_moving,
      liam_rig_frozen_through_the_stop: first.liam_ring_scale === last.liam_ring_scale && first.liam_chest_scale === last.liam_chest_scale,
      ribbon_swept_deg_through_the_stop: Number((last.ribbon_deg - first.ribbon_deg).toFixed(3)),
      fx_clock_advanced: Number((last.fxT - first.fxT).toFixed(6)),
    };
    globalThis.ssStep(6);
    A.six_frames_later = snap();
    A.verdict.moving_again_after = JSON.stringify(A.six_frames_later.isabella) !== JSON.stringify(last.isabella);

    // ---- B: a 0.25 s stop while the ribbon's radius is still easing in --------------------------
    const B = out.B_a_stop_mid_ease;
    walk.pressed.clear();
    globalThis.ssStep(180);                       // let the beat's flourish finish
    globalThis.ssKey('x');
    globalThis.ssStep(6);                         // 0.1 s in: the radius is a third of the way
    B.before = snap();
    ctx.stop(0.25);
    globalThis.ssStep(1); B.stopped_frame_1 = snap();
    globalThis.ssStep(1); B.stopped_frame_2 = snap();
    globalThis.ssStep(1); B.stopped_frame_3 = snap();
    B.verdict = {
      stopped: B.stopped_frame_3.stopped,
      ribbon_radius_grew: Number((B.stopped_frame_3.ribbon_r - B.before.ribbon_r).toFixed(4)),
      ribbon_swept_deg: Number((B.stopped_frame_3.ribbon_deg - B.before.ribbon_deg).toFixed(3)),
      liam_rig_frozen: B.before.liam_ring_scale === B.stopped_frame_3.liam_ring_scale,
    };
    return out;
  });
};
