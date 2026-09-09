// The `-04b` frames for round 2's fix pass, section A (`docs/qa/briefs/reel-fixes-04-fixes.md` A7),
// and the A2 measurement that goes with the study framing.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-frames-04b.cjs
//
// One browser, three navigations, `?t=half` explicit on each (T-29), 12 s of wall clock after every
// `goto` before anything is saved (a save before the first rendered frame is a blank 58,885-byte
// canvas), then ssStep and ssSnap.
//
//   1. caves-descent-s2-04b   the chunky stair down the west wall, from S2
//   2. caves-descent-stair-04b  round 1's study framing (the same lens as `-stair-04`, so the step
//      is compared like with like). A2's tread-colour measurement is read out of the saved PNG by
//      `caves-treads-04b.cjs`, which rebuilds this same lens.
//   3. caves-descent-s1-04b   S1 with Isabella stood astride a step edge (the ring rim on a step):
//      the stand is found by reading her ring's own `aLift` spread, not by typing a point.
const BASE = 'http://localhost:5173/sandbox/caves-descent/';

module.exports = async (page, h) => {
  const out = { frames: [] };
  const open = async (shot, relief) => {
    await page.goto(`${BASE}?shot=${shot}&t=half&step=1&relief=${relief}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
    await h.sleep(12000);
  };
  const shoot = async (name, steps, note) => {
    await h.step(steps);
    const file = await h.snap(name);
    const rec = { name, file, note, kf: await h.evaluate(() => globalThis.ssKf().name), relief: (await h.hud())[0] };
    out.frames.push(rec);
    return rec;
  };

  // 1. S2: the blocky stair
  await open('S2', 'chunky');
  await shoot('caves-descent-s2-04b', 120, 'S2, chunky, the 1.20 m step');

  // 2. the study framing, and the tread colours
  await open('S1', 'chunky');
  out.stair = await h.evaluate(() => {
    const w = globalThis.ssWorld, liam = globalThis.ssKids[0];
    const b = (236.31 * Math.PI) / 180, x = -14 + Math.sin(b) * 3, z = -36 - Math.cos(b) * 3;
    liam.root.position.set(x, w.groundY(x, z), z);
    liam.face(236.31);
    const o = globalThis.ssOrbit;
    o.current.target = [x, w.groundY(x, z) + 0.9, z];
    o.current.yaw = 236.31; o.current.pitch = 30; o.current.d = 11;
    o.apply();
    return { liam: [+x.toFixed(2), +w.groundY(x, z).toFixed(3), +z.toFixed(2)], yaw: 236.31, pitch: 30, d: 11, stairs: globalThis.ssCaves.stairs() };
  });
  await shoot('caves-descent-stair-04b', 90, 'the first stair from three steps in');

  // 3. S1 with Isabella astride a step edge
  await open('S1', 'chunky');
  out.s1 = await h.evaluate(() => {
    const w = globalThis.ssWorld;
    const izzy = globalThis.ssKids[3];
    const home = izzy.root.position.clone();
    let best = null;
    for (let dx = -3.2; dx <= 3.21; dx += 0.2) for (let dz = -3.2; dz <= 3.21; dz += 0.2) {
      const x = home.x + dx, z = home.z + dz;
      if (!w.walkable(x, z) || w.groundY(x, z) < -2) continue;
      izzy.root.position.set(x, w.groundY(x, z), z);
      globalThis.ssStep(2);
      const lift = globalThis.ssRigProbe['isabella.rig']().ring.lift;
      const spread = Math.max(...lift) - Math.min(...lift);
      if (!best || spread > best.spread) best = { x, z, y: w.groundY(x, z), spread };
      if (best.spread >= 0.53) break;
    }
    izzy.root.position.set(best.x, best.y, best.z);
    izzy.face(180);
    globalThis.ssStep(2);
    return { stand: [+best.x.toFixed(2), +best.y.toFixed(3), +best.z.toFixed(2)], ringLiftSpread: +best.spread.toFixed(4), home: [+home.x.toFixed(2), +home.z.toFixed(2)] };
  });
  await shoot('caves-descent-s1-04b', 120, 'S1, chunky, Isabella astride a step edge');
  return out;
};
