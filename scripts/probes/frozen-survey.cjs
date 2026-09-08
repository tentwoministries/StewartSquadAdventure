// Survey probe (reel fixes round 1, the Hearth): reads the Frozen terrain through ssWorld.groundY
// before any edit, so the drift's move and the ice-fall pool's basin are chosen from sampled ground
// and not from arithmetic. Also projects candidate points through the live station camera (found by
// traversing the scene from a kid's root), which is how "the S4 camera sees it" is decided.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S4&t=night&step=1" scripts/probes/frozen-survey.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(0) };

  out.pool = await h.evaluate(() => {
    const g = globalThis.ssWorld.groundY;
    const cx = -8, cz = -30;
    const poolY = g(-8, -32) + 0.05; // props.ts: base = terrainY(fx, fz + 8), disc at base + 0.05
    const line_x = []; for (let z = -20; z >= -42; z--) line_x.push([z, Number(g(-8, z).toFixed(3))]);
    const line_z = []; for (let x = -20; x <= 4; x++) line_z.push([x, Number(g(x, -30).toFixed(3))]);
    const ring = (rad) => { const o = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283; o.push([Number((cx + Math.cos(a) * rad).toFixed(1)), Number((cz + Math.sin(a) * rad).toFixed(1)), Number(g(cx + Math.cos(a) * rad, cz + Math.sin(a) * rad).toFixed(3))]); } return o; };
    let lo = 1e9, hi = -1e9, loAt = null, hiAt = null;
    for (let i = 0; i < 400; i++) { const a = (i * 2.399), rr = 6.5 * Math.sqrt((i + 0.5) / 400); const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr; const y = g(x, z); if (y < lo) { lo = y; loAt = [x, z]; } if (y > hi) { hi = y; hiAt = [x, z]; } }
    return { poolY: Number(poolY.toFixed(3)), line_x_at_minus8: line_x, line_z_at_minus30: line_z, ring73: ring(7.3), ring80: ring(8.0), ring90: ring(9.0), inside65: { min: Number(lo.toFixed(3)), minAt: loAt.map((v) => Number(v.toFixed(1))), max: Number(hi.toFixed(3)), maxAt: hiAt.map((v) => Number(v.toFixed(1))) } };
  });

  out.drift = await h.evaluate(() => {
    const g = globalThis.ssWorld.groundY;
    const prof = (ax, az, bx, bz) => { const o = []; for (let i = 0; i <= 20; i++) { const u = i / 20, x = ax + (bx - ax) * u, z = az + (bz - az) * u; o.push([Number(x.toFixed(2)), Number(z.toFixed(2)), Number(g(x, z).toFixed(3))]); } return o; };
    return {
      current_axis: prof(-33, 1, -39, -3),
      candidate_axis: prof(-40.5, -3, -35, 1.5),
      around_new_top: [[-40.5, -3], [-42, -4], [-44, -5], [-38, -6], [-36, 2], [-35, 1.5], [-31, 5]].map(([x, z]) => [x, z, Number(g(x, z).toFixed(3))]),
    };
  });

  out.creature_homes = await h.evaluate(() => {
    const hares = [[-6, 14], [12, -6], [-16, -14], [28, 12]], pts = [[6, 10], [8, 12], [-4, -16], [30, -4], [-14, 28]];
    const d = (x, z) => Number(Math.hypot(x + 8, z + 30).toFixed(2));
    return { hares: hares.map(([x, z]) => ({ home: [x, z], dPool: d(x, z) })), ptarmigans: pts.map(([x, z]) => ({ home: [x, z], dPool: d(x, z) })), herdPatch: { at: [-44, 6], dPool: d(-44, 6) } };
  });

  // the live station camera, and where candidate points land in the 1600 x 1000 frame
  out.camera = await h.evaluate(() => {
    const scene = globalThis.ssKids[0].root.parent;
    let cam = null; scene.traverse((o) => { if (o.isPerspectiveCamera) cam = o; });
    if (!cam) return null;
    const T = globalThis.ssTHREE;
    const g = globalThis.ssWorld.groundY;
    const pts = { pool_centre: [-8, -30], pool_south: [-8, -22.5], pool_sw: [-14, -25], pool_w: [-16, -28], pool_n: [-8, -37], hare3_home: [-16, -14], ptarm3_home: [-4, -16], cand_a: [-13, -23], cand_b: [-16, -24], cand_c: [-11, -26] };
    const out = { pos: [cam.position.x, cam.position.y, cam.position.z].map((v) => Number(v.toFixed(2))), fov: cam.fov, aspect: Number(cam.aspect.toFixed(3)), screen: {} };
    for (const [k, [x, z]] of Object.entries(pts)) {
      const v = new T.Vector3(x, g(x, z) + 0.3, z).project(cam);
      out.screen[k] = { px: Number(((v.x * 0.5 + 0.5) * 1600).toFixed(0)), py: Number(((-v.y * 0.5 + 0.5) * 1000).toFixed(0)), inFrame: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1, ground: Number(g(x, z).toFixed(2)) };
    }
    return out;
  });

  out.hud = await h.hud();
  return out;
};
