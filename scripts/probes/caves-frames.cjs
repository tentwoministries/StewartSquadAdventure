// The four `-03` frames for the Crystal Caves' reel fixes (docs/qa/briefs/reel-fixes-caves-03.md
// check 3). One browser, four navigations, `?t=half` explicit on every one (T-29), 12 s of wall
// clock after each `goto` before anything is saved (a save before the first rendered frame is a
// blank 58,885-byte canvas), then ssStep to bring the scene to life and ssSnap.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S2&t=half&step=1" scripts/probes/caves-frames.cjs
const BASE = 'http://localhost:5173/sandbox/caves-descent/';

module.exports = async (page, h) => {
  const out = { frames: [] };
  const open = async (shot) => {
    await page.goto(`${BASE}?shot=${shot}&t=half&step=1`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
    await h.sleep(12000);
  };
  const shoot = async (name, steps) => {
    await h.step(steps);
    const file = await h.snap(name);
    out.frames.push({ name, file, kf: await h.evaluate(() => globalThis.ssKf().name) });
  };

  // 1. the descent, from S2
  await open('S2');
  await shoot('caves-descent-s2-03', 120);

  // 2. the study: looking down the first stair from the landing, Liam a few treads in
  await open('S1');
  out.stair = await h.evaluate(() => {
    const w = globalThis.ssWorld, liam = globalThis.ssKids[0];
    // 3 m down the stair from the mouth (-14, -36) on bearing 236.31: the flare's last tread
    const b = (236.31 * Math.PI) / 180, x = -14 + Math.sin(b) * 3, z = -36 - Math.cos(b) * 3;
    liam.root.position.set(x, w.groundY(x, z), z);
    liam.face(236.31);
    const o = globalThis.ssOrbit;
    o.current.target = [x, w.groundY(x, z) + 0.9, z];
    o.current.yaw = 236.31; o.current.pitch = 30; o.current.d = 11;
    o.apply();
    return { liam: [+x.toFixed(2), +w.groundY(x, z).toFixed(3), +z.toFixed(2)], yaw: 236.31, pitch: 30, d: 11 };
  });
  await shoot('caves-descent-stair-03', 90);

  // 3. the landing, from S1 (the station as it stands, after the cut)
  await open('S1');
  await shoot('caves-descent-s1-03', 120);

  // 4. Isabella on tier 1, her ring under her feet
  await open('S4');
  for (let i = 0; i < 3; i++) await h.key('Tab');
  out.ring = await h.evaluate(() => {
    const w = globalThis.ssWorld;
    const izzy = globalThis.ssKids[3];
    const x = -34, z = 20, y = w.groundY(x, z);
    izzy.root.position.set(x, y, z);
    izzy.face(60);                    // she faces the camera, which looks along bearing 240
    const o = globalThis.ssOrbit;
    o.current.target = [x, y + 0.7, z]; o.current.yaw = 240; o.current.pitch = 38; o.current.d = 6;
    o.apply();
    return { active: globalThis.ssActive().name, izzy: [x, +y.toFixed(3), z], ring: izzy.ring.position.y, yaw: 240, pitch: 38, d: 6 };
  });
  await shoot('caves-descent-ring-03', 90);
  out.hud = await h.hud();
  return out;
};
