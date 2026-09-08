// Probe (round 2): the T-09 colour control. The `SW` station moved in this pass, so a before/after
// of the same *ground band* cannot be read off the two SW frames. This shoots the new build from the
// old SW camera (yaw 237, pitch 14, d 7, target 4.8/0.9/−11.5) through the runtime's own orbit, so
// `shadow-wrong-t09-02-NN` and `shadow-wrong-sw-02-01` are the same picture and the fleck counts are
// like-for-like.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=SW&t=wrong&step=1" scripts/probes/shadow-t09.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  await h.step(120);
  const cam = await h.evaluate(() => {
    const o = globalThis.ssOrbit;
    o.current.yaw = 237; o.current.pitch = 14; o.current.d = 7;
    o.current.target[0] = 4.8; o.current.target[1] = 0.9; o.current.target[2] = -11.5;
    o.apply();
    return { yaw: o.current.yaw, pitch: o.current.pitch, d: o.current.d, target: [...o.current.target] };
  });
  await h.step(2);
  return { cam, file: await h.snap('shadow-wrong-t09-02') };
};
