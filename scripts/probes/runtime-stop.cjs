// Probe: the runtime's hit-stop (opus-fixes-runtime check 4, T-31, heroes.md §2.5.7). Everything
// runs inside one synchronous evaluate so no animation frame can interleave between the reads.
// The hero is walking (W held) before the stop, so a frozen position proves the dt gate, not idleness.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?step=1&beat=1" scripts/probes/runtime-stop.cjs
module.exports = async (page, h) => {
  await h.sleep(2000);
  return h.evaluate(() => {
    const p = (o) => [Number(o.x.toFixed(6)), Number(o.y.toFixed(6)), Number(o.z.toFixed(6))];
    const ctx = globalThis.ssCtx, kid = globalThis.ssKids[0], walk = globalThis.ssWalk;
    const snap = () => ({ kid: p(kid.root.position), walker: p(walk.hero.position), moving: walk.moving, stopped: ctx.stopped, stopDt: ctx.stopDt, t: Number(globalThis.ssStep(0).toFixed(6)) });
    const out = { kid: kid.name, walker_is_kid0: walk.hero === kid.root };
    globalThis.ssKey('w');
    globalThis.ssStep(30);
    out.walking_after_30 = snap();
    ctx.stop(0.25);
    out.at_stop = snap();
    globalThis.ssStep(10);
    out.after_10_frames = snap();
    globalThis.ssStep(10);
    out.after_20_frames = snap();
    globalThis.ssStep(10);
    out.after_30_frames = snap();
    walk.pressed.clear();
    globalThis.ssStep(30);
    // the shortest hit-stop site in heroes.md §2.5.7 is 0.04 s: about two frames, not rounded away
    ctx.stop(0.04);
    globalThis.ssStep(1);
    out.short_stop_after_1_frame = { stopped: ctx.stopped, stopDt: ctx.stopDt };
    globalThis.ssStep(3);
    out.short_stop_after_4_frames = { stopped: ctx.stopped, stopDt: ctx.stopDt };
    return out;
  });
};
