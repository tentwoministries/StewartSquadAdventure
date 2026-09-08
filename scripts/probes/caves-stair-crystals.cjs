// Probe: audit item 9 — a rim crystal grew up through the stair's tread. Re-saves the study frame
// the caves builder used (`caves-frames.cjs` step 2: Liam 3 m down the first stair from the mouth
// at (−14, −36) on bearing 236.31, lens yaw 236.31 pitch 30 d 11) and reports the rim-crystal count
// from the scene's HUD, so the spots dropped by the `stairY(x, z) !== null` test can be counted.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-stair-crystals.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), hud: await h.hud() };
  out.stair = await h.evaluate(() => {
    const w = globalThis.ssWorld, liam = globalThis.ssKids[0];
    const b = (236.31 * Math.PI) / 180, x = -14 + Math.sin(b) * 3, z = -36 - Math.cos(b) * 3;
    liam.root.position.set(x, w.groundY(x, z), z);
    liam.face(236.31);
    const o = globalThis.ssOrbit;
    o.current.target = [x, w.groundY(x, z) + 0.9, z];
    o.current.yaw = 236.31; o.current.pitch = 30; o.current.d = 11;
    o.apply();
    return { liam: [+x.toFixed(2), +w.groundY(x, z).toFixed(3), +z.toFixed(2)], yaw: 236.31, pitch: 30, d: 11 };
  });
  await h.step(90);
  out.file = await h.snap('caves-descent-stair-03');
  out.t = await h.step(0);
  return out;
};
