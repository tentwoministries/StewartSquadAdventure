// The six `-04` frames for the Crystal Caves' reel fixes round 2 (docs/qa/briefs/reel-fixes-caves-04.md
// check 5). One browser, six navigations, `?t=half` explicit on every one (T-29), 12 s of wall clock
// after each `goto` before anything is saved (a save before the first rendered frame is a blank
// 58,885-byte canvas), then ssStep(120) and ssSnap.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-frames-04.cjs
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
    out.frames.push({ name, file, note, kf: await h.evaluate(() => globalThis.ssKf().name), relief: (await h.hud())[0] });
  };

  // 1. the Landing at chunky: four kids, four rings on the staggered column tops
  await open('S1', 'chunky');
  await shoot('caves-descent-s1-04', 120, 'S1, chunky');

  // 2. the descent from S2: the blocky stair down the west wall
  await open('S2', 'chunky');
  await shoot('caves-descent-s2-04', 120, 'S2, chunky');

  // 3. round 1's study framing: Liam three steps down the first stair from the mouth
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
    return { liam: [+x.toFixed(2), +w.groundY(x, z).toFixed(3), +z.toFixed(2)], yaw: 236.31, pitch: 30, d: 11 };
  });
  await shoot('caves-descent-stair-04', 90, 'the first stair from three steps in');

  // 4. the round-1 look kept: S1 at flat
  await open('S1', 'flat');
  await shoot('caves-descent-flat-04', 120, 'S1, flat (round 1)');

  // 5. the relief doubled: S1 at blocks
  await open('S1', 'blocks');
  await shoot('caves-descent-blocks-04', 120, 'S1, blocks');

  // 6. the first salamander on the wall, 3 m out along the wall's own normal, at a bright pulse
  await open('S1', 'chunky');
  out.salamander = await h.evaluate(() => {
    const T = globalThis.ssTHREE;
    const scene = globalThis.ssKids[0].root.parent;
    const sal = scene.getObjectByName('salamander0');
    sal.updateMatrixWorld(true);
    const xA = new T.Vector3(), yA = new T.Vector3(), zA = new T.Vector3();
    sal.matrixWorld.extractBasis(xA, yA, zA);
    yA.normalize();
    // placeCamera puts the lens at target − d·cos(pitch)·f with f = (sin yaw, 0, −cos yaw), so f is
    // the direction it *looks*: to stand off the wall the lens looks back along the wall's normal
    const yaw = ((Math.atan2(-yA.x, yA.z) * 180) / Math.PI + 360) % 360;
    const o = globalThis.ssOrbit;
    o.current.target = [sal.position.x, sal.position.y + 0.05, sal.position.z];
    o.current.yaw = yaw; o.current.pitch = 10; o.current.d = 3;
    o.apply();
    return { pos: [+sal.position.x.toFixed(3), +sal.position.y.toFixed(3), +sal.position.z.toFixed(3)], normal: [+yA.x.toFixed(3), +yA.y.toFixed(3), +yA.z.toFixed(3)], yaw: +yaw.toFixed(2), pitch: 10, d: 3 };
  });
  // step to the top of the heart's 8 s pulse so the green spots are at their brightest
  for (let i = 0; i < 40; i++) {
    const p = Number(((await h.hud()).find((l) => l.includes('heart pulse')) || '').split('heart pulse ')[1].slice(0, 4));
    if (p > 0.97) break;
    await h.step(12);
  }
  out.pulseAtShutter = ((await h.hud()).find((l) => l.includes('heart pulse')) || '').split(' · ')[0];
  await shoot('caves-descent-salamander-04', 1, 'the first salamander on the stair wall');
  return out;
};
