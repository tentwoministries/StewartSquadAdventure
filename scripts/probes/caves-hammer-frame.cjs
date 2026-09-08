// Probe: audit item 4's study frame — Isabella idle on the caves' Lamplight Landing with her hammer
// head on the ground beside her. Tab until she is the walked kid, hold the idle, frame her through
// ssOrbit (d 5, pitch 12, looking at her front along bearing 240 while she faces 60) and save.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-hammer-frame.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url() };
  for (let i = 0; i < 8 && (await h.evaluate(() => globalThis.ssActive().name)) !== 'Isabella'; i++) await h.key('Tab');
  out.active = await h.evaluate(() => globalThis.ssActive().name);
  out.place = await h.evaluate(() => {
    const w = globalThis.ssWorld, k = globalThis.ssActive();
    const x = 1, z = -33, y = w.groundY(x, z);
    k.root.position.set(x, y, z); k.face(60);
    const o = globalThis.ssOrbit;
    o.current.target = [x, y + 0.7, z]; o.current.yaw = 240; o.current.pitch = 12; o.current.d = 5; o.apply();
    return { izzy: [x, Number(y.toFixed(3)), z], yaw: 240, pitch: 12, d: 5 };
  });
  await h.step(150); // the carry eases back to the idle pose before the shutter
  out.state = await h.evaluate(() => {
    const s = globalThis.ssRigProbe['isabella.hammer'](), r = globalThis.ssRigProbe['isabella.rig'](), w = globalThis.ssWorld;
    return {
      headLowAboveGroundUnderHead: Number((s.headLowY - w.groundY(s.headCentre[0], s.headCentre[2])).toFixed(4)),
      headLowAboveHerGround: Number((s.headLowY - r.root[1]).toFixed(4)), runU: s.runU, speed: r.speed,
    };
  });
  out.file = await h.snap('caves-descent-hammer-idle-03');
  return out;
};
