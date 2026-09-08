// Survey probe 2 (reel fixes round 1, the Hearth): the blockers (props footprints + flora trunks)
// near the ice-fall pool's candidate centres, the natural terrain over each candidate footprint,
// and the S4/S2 projections of the candidates — so the pool is moved onto ground that is free of
// trunks and still inside the station's frame. Read-only; no scene edit yet.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S4&t=night&step=1" scripts/probes/frozen-survey2.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(0) };

  out.blockers_near_pool = await h.evaluate(() => globalThis.ssWorld.blockers
    .map((c) => ({ x: Number(c.x.toFixed(2)), z: Number(c.z.toFixed(2)), r: Number(c.r.toFixed(2)), d: Number(Math.hypot(c.x + 8, c.z + 26).toFixed(2)) }))
    .filter((c) => c.d < 22).sort((a, b) => a.d - b.d));

  out.candidates = await h.evaluate(() => {
    const g = globalThis.ssWorld.groundY;
    const centres = [[-8, -30], [-8, -28], [-8, -26.5], [-8, -25.5], [-8, -24], [-10, -26]];
    return centres.map(([cx, cz]) => {
      let bedMax = -1e9, bedMin = 1e9, bedMaxAt = null;
      for (let i = 0; i < 300; i++) { const a = i * 2.399, rr = 6.5 * Math.sqrt((i + 0.5) / 300); const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr; const y = g(x, z); if (y > bedMax) { bedMax = y; bedMaxAt = [Number(x.toFixed(1)), Number(z.toFixed(1))]; } if (y < bedMin) bedMin = y; }
      const shore = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283; shore.push(Number(g(cx + Math.cos(a) * 7.7, cz + Math.sin(a) * 7.7).toFixed(2))); }
      return { centre: [cx, cz], centreY: Number(g(cx, cz).toFixed(3)), bedMax: Number(bedMax.toFixed(3)), bedMaxAt, bedMin: Number(bedMin.toFixed(3)), shore77: shore };
    });
  });

  out.screen = await h.evaluate(() => {
    const scene = globalThis.ssKids[0].root.parent;
    let cam = null; scene.traverse((o) => { if (o.isPerspectiveCamera) cam = o; });
    const T = globalThis.ssTHREE, g = globalThis.ssWorld.groundY;
    const pts = { c30: [-8, -30], c28: [-8, -28], c265: [-8, -26.5], c255: [-8, -25.5], n_rim_265: [-8, -33.4], s_rim_265: [-8, -19.6], w_rim_265: [-14.9, -26.5], e_rim_265: [-1.1, -26.5], n_rim_255: [-8, -32.4], s_rim_255: [-8, -18.6] };
    const o = {};
    for (const [k, [x, z]] of Object.entries(pts)) { const v = new T.Vector3(x, g(x, z) + 0.2, z).project(cam); o[k] = { px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(0)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(0)) }; }
    return o;
  });

  // the natural terrain 12 m south of each candidate (the walk-up the approach frame uses)
  out.approach = await h.evaluate(() => {
    const g = globalThis.ssWorld.groundY;
    const line = []; for (let z = -14; z >= -36; z--) line.push([z, Number(g(-8, z).toFixed(3))]);
    return line;
  });
  return out;
};
