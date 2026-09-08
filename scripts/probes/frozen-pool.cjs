// Probe: T-53, the ice-fall's pool lies in a basin (reel fixes round 1, check 3). Samples terrainY
// on 72 bearings at r 7.3 and 8.0 (the shore must hold the water) and at 100 points inside r 6.5
// (the water must lie in a dish), marches the south shore to measure how much walkable ground stands
// behind the waterline (T-38), lists every creature home against the pool, and saves the S4 station
// frame and a low walk-up frame through ssOrbit.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S4&t=night&step=1" scripts/probes/frozen-pool.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(0) };
  out.pool = await h.evaluate(() => globalThis.ssProbe.pool());

  out.shore = await h.evaluate(() => {
    const p = globalThis.ssProbe, P = p.pool(), o = {};
    for (const rad of [7.3, 8.0]) {
      let min = 1e9, minAt = null; const all = [];
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * 6.283185, x = P.x + Math.cos(a) * rad, z = P.z + Math.sin(a) * rad;
        const d = p.terrainY(x, z) - P.y; all.push(Number(d.toFixed(3)));
        if (d < min) { min = d; minAt = [Number(x.toFixed(2)), Number(z.toFixed(2))]; }
      }
      o['r' + rad] = { n: 72, min: Number(min.toFixed(3)), minAt, max: Number(Math.max(...all).toFixed(3)), first12: all.slice(0, 12) };
    }
    return o;
  });

  out.dish = await h.evaluate(() => {
    const p = globalThis.ssProbe, P = p.pool();
    let max = -1e9, maxAt = null, min = 1e9;
    const all = [];
    for (let i = 0; i < 100; i++) {
      const a = i * 2.399963, rad = 6.5 * Math.sqrt((i + 0.5) / 100);
      const x = P.x + Math.cos(a) * rad, z = P.z + Math.sin(a) * rad;
      const d = p.terrainY(x, z) - P.y; all.push(Number(d.toFixed(3)));
      if (d > max) { max = d; maxAt = [Number(x.toFixed(2)), Number(z.toFixed(2)), Number(rad.toFixed(2))]; }
      if (d < min) min = d;
    }
    return { n: 100, max: Number(max.toFixed(3)), maxAt, min: Number(min.toFixed(3)), first12: all.slice(0, 12) };
  });

  // T-38: march out from the waterline on four bearings and report where the ground stops being
  // walkable ground behind the shore (a step of more than 0.4 m per metre, or off the plate)
  out.shore_width = await h.evaluate(() => {
    const p = globalThis.ssProbe, P = p.pool(), o = {};
    for (const [name, a] of [['south', Math.PI / 2], ['west', Math.PI], ['east', 0], ['north', -Math.PI / 2]]) {
      let last = null, width = 0, prof = [];
      for (let rad = 6.9; rad <= 13; rad += 0.25) {
        const x = P.x + Math.cos(a) * rad, z = P.z + Math.sin(a) * rad, y = p.terrainY(x, z);
        prof.push(Number(y.toFixed(2)));
        if (!p.inside(x, z)) break;
        if (last !== null && Math.abs(y - last) / 0.25 > 0.4) break;
        last = y; width = rad - 6.9;
      }
      o[name] = { walkable_m: Number(width.toFixed(2)), profile: prof };
    }
    return o;
  });

  out.homes = await h.evaluate(() => ({ hares: globalThis.ssProbe.hares(), ptarmigans: globalThis.ssProbe.ptarmigans() }));

  // the S4 station frame (the station is unchanged; the pool moved under it)
  await h.step(120);
  out.s4 = { t: Number((await h.step(0)).toFixed(2)), file: await h.snap('frozen-night-s4-03') };
  out.s4_screen = await h.evaluate(() => {
    const scene = globalThis.ssKids[0].root.parent; let cam = null; scene.traverse((o) => { if (o.isPerspectiveCamera) cam = o; });
    const T = globalThis.ssTHREE, p = globalThis.ssProbe, P = p.pool();
    const pts = { pool_centre: [P.x, P.z], north_rim: [P.x, P.z - 7.1], south_rim: [P.x, P.z + 7.1], west_rim: [P.x - 7.1, P.z], ptarmigan: [p.ptarmigans()[2].x, p.ptarmigans()[2].z] };
    const o = {};
    for (const [k, [x, z]] of Object.entries(pts)) { const v = new T.Vector3(x, p.terrainY(x, z) + 0.2, z).project(cam); o[k] = { px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(0)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(0)) }; }
    return o;
  });

  // the walk-up: the camera on the approach, south of the pool, pitch 10, d 12
  out.approach_station = await h.evaluate(() => {
    const P = globalThis.ssProbe.pool(), o = globalThis.ssOrbit;
    o.current.target = [P.x, P.y, P.z]; o.current.yaw = 0; o.current.pitch = 10; o.current.d = 12; o.apply();
    return { target: o.current.target, yaw: o.current.yaw, pitch: o.current.pitch, d: o.current.d };
  });
  out.approach = { t: Number((await h.step(0)).toFixed(2)), file: await h.snap('frozen-night-pool-approach-03') };
  out.approach_screen = await h.evaluate(() => {
    const scene = globalThis.ssKids[0].root.parent; let cam = null; scene.traverse((o) => { if (o.isPerspectiveCamera) cam = o; });
    const T = globalThis.ssTHREE, p = globalThis.ssProbe, b = p.ptarmigans()[2];
    const v = new T.Vector3(b.x, p.terrainY(b.x, b.z) + 0.25, b.z).project(cam);
    return { ptarmigan: { at: [b.x, b.z], px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(0)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(0)), inFrame: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 } };
  });
  out.hud = await h.hud();
  return out;
};
