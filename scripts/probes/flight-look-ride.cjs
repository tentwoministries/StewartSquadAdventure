// Probe: the CS-04 ride with nobody touching the mouse — the before/after pair for T-48's
// "no drag, no change" (docs/qa/briefs/reel-fixes-flight-03.md check 1). Saves
// `flight-golden-ch-03` at scene seconds 6.0, 11.0 and 14.0 and reports the cutscene clock, the
// camera pose and the flight HUD at each, so the md5 comparison has numbers behind it.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-look-ride.cjs
// `ssSnap` renders one frame itself, so each leg steps (target − now) × 60 − 1 frames.
module.exports = async (page, h) => {
  await h.sleep(12000);
  const frames = [];
  for (const at of [6.0, 11.0, 14.0]) {
    await h.evaluate((target) => {
      const need = Math.round(target * 60) - Math.round(globalThis.ssCut.at() * 60) - 1;
      globalThis.ssStep(Math.max(0, need));
      return need;
    }, at);
    const file = await h.snap('flight-golden-ch-03');
    const state = await h.evaluate(() => {
      const c = globalThis.ssCtx.camera, f = globalThis.ssFlight;
      const r = (v) => +v.toFixed(6);
      return {
        ct: r(globalThis.ssCut.at()),
        cam: [r(c.position.x), r(c.position.y), r(c.position.z)],
        quat: [r(c.quaternion.x), r(c.quaternion.y), r(c.quaternion.z), r(c.quaternion.w)],
        plane: [r(f.pos.x), r(f.pos.y), r(f.pos.z)],
        orbit: { yaw: globalThis.ssOrbit.current.yaw, pitch: globalThis.ssOrbit.current.pitch, d: globalThis.ssOrbit.current.d },
        hud: f.hud(),
      };
    });
    frames.push({ at, file, ...state });
  }
  return { url: page.url(), frames };
};
