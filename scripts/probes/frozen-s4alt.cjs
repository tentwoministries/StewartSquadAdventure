// Probe: two things the pool's move raises (reel fixes round 1, checks 3 and 9). First, a close
// framing on the moved ptarmigan, so "the creature is on the shore and visible" is a render and not
// a projection number. Second, S4 itself: the station's own numbers now put the pool's centre at
// py 1069 (below the frame), so this tries three candidate framings through ssOrbit, projects the
// pool's centre and the fall's crest through each, and saves the one that holds both.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S4&t=night&step=1" scripts/probes/frozen-s4alt.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(120), candidates: [] };

  // (1) the moved ptarmigan, close
  out.bird_station = await h.evaluate(() => {
    const b = globalThis.ssProbe.ptarmigans()[2], o = globalThis.ssOrbit;
    o.current.target = [b.x, globalThis.ssProbe.terrainY(b.x, b.z) + 0.25, b.z]; o.current.yaw = 20; o.current.pitch = 14; o.current.d = 5; o.apply();
    return { bird: [b.x, b.z], target: o.current.target, yaw: 20, pitch: 14, d: 5, ground: Number(globalThis.ssProbe.terrainY(b.x, b.z).toFixed(3)), dPool: b.dPool };
  });
  await h.step(1);
  out.bird_frame = await h.snap('frozen-night-pool-bird-03');

  // (2) S4 candidates
  const project = (pts) => h.evaluate((list) => {
    const scene = globalThis.ssKids[0].root.parent; let cam = null; scene.traverse((o) => { if (o.isPerspectiveCamera) cam = o; });
    const T = globalThis.ssTHREE, o = {};
    for (const [k, x, y, z] of list) { const v = new T.Vector3(x, y, z).project(cam); o[k] = { px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(0)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(0)) }; }
    return o;
  }, pts);
  const marks = [['pool_centre', -8, -0.1, -25.5], ['pool_north_rim', -8, 0.0, -32.6], ['pool_south_rim', -8, 0.0, -18.4], ['fall_crest', -8, 10.9, -41.2], ['fall_foot', -8, 3.9, -36]];

  for (const c of [
    { name: 'S4 as authored', target: [-8, 5, -36], yaw: 5, pitch: 22, d: 32 },
    { name: 'S4 alt A', target: [-8, 4, -33], yaw: 5, pitch: 20, d: 30 },
    { name: 'S4 alt B', target: [-8, 3.5, -31], yaw: 5, pitch: 18, d: 30 },
  ]) {
    await h.evaluate((s) => { const o = globalThis.ssOrbit; o.current.target = s.target; o.current.yaw = s.yaw; o.current.pitch = s.pitch; o.current.d = s.d; o.apply(); }, c);
    await h.step(1); // a render, so camera.matrixWorldInverse is the one being projected through
    const scr = await project(marks);
    const holds = Object.values(scr).every((p) => p.px > 0 && p.px < 1600 && p.py > 0 && p.py < 1000);
    out.candidates.push({ ...c, screen: scr, all_marks_in_frame: holds, file: c.name === 'S4 alt A' ? await h.snap('frozen-night-s4alt-03') : null });
  }
  return out;
};
