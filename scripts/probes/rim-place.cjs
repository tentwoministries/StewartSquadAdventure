// Probe: the west rim's placement and its three mechanics (opus-fixes-rim checks 1–4).
// Reads ssWorld.probe() (never the HUD's DOM text), calls ssWorld.inside() at the deer's feet, at
// Liam's and at both ends of the fox's route, samples inside() along the route, steps 60 frames for
// the songbird burst and then 20 x 60 frames for the fox's speed and pauses.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/rim-dawn/?shot=S4&t=dawn&step=1" scripts/probes/rim-place.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), kf: await h.evaluate(() => globalThis.ssKf().name) };
  out.t0 = await h.step(0);
  const p0 = await h.evaluate(() => globalThis.ssWorld.probe());
  out.probe_at_load = p0;

  // check 1: inside() at every placed thing
  out.inside = await h.evaluate((pts) => pts.map((q) => ({ at: q, inside: globalThis.ssWorld.inside(q[0], q[1]), ground: globalThis.ssWorld.groundY(q[0], q[1]) })), [
    [p0.deer.x, p0.deer.z], [p0.liam.x, p0.liam.z], [p0.foxRoute.a.x, p0.foxRoute.a.z], [p0.foxRoute.b.x, p0.foxRoute.b.z], [p0.lip.x, p0.lip.z],
  ]);
  // the whole fox route, every metre
  out.route_scan = await h.evaluate((a, b) => {
    const bad = []; let n = 0;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u;
      n++;
      if (!globalThis.ssWorld.inside(x, z)) bad.push([Number(x.toFixed(2)), Number(z.toFixed(2))]);
    }
    return { sampled: n, outside: bad };
  }, p0.foxRoute.a, p0.foxRoute.b);

  // check 3: the burst at load — one second of stepping
  const birds = [];
  for (let i = 0; i < 6; i++) {
    const t = await h.step(10);
    const s = await h.evaluate(() => globalThis.ssWorld.probe().birds);
    birds.push({ t: Number(t.toFixed(3)), airborne: s.airborne, out: s.out.map((v) => Number(v.toFixed(3))), age: Number(s.age.toFixed(2)) });
  }
  out.birds_first_second = birds;

  // check 5 (ease): the burst's and the bobber's state changes across a two-frame pair
  out.ease_pairs = await h.evaluate(() => {
    const a = globalThis.ssWorld.probe();
    const t0 = globalThis.ssStep(1);
    const b = globalThis.ssWorld.probe();
    const t1 = globalThis.ssStep(1);
    const c = globalThis.ssWorld.probe();
    return {
      dt: [t0, t1],
      birdOutStep: [b.birds.out[0] - a.birds.out[0], c.birds.out[0] - b.birds.out[0]],
      bobberYStep: [b.bobber.y - a.bobber.y, c.bobber.y - b.bobber.y],
      ringStep: [b.bobber.rings[0] - a.bobber.rings[0], c.bobber.rings[0] - b.bobber.rings[0]],
    };
  });

  // check 4: the fox over 20 s
  const fox = [];
  for (let i = 0; i < 20; i++) {
    const t = await h.step(60);
    const s = await h.evaluate(() => globalThis.ssWorld.probe().fox);
    fox.push({ t: Number(t.toFixed(2)), u: Number(s.u.toFixed(4)), dir: s.dir, pause: Number(s.pause.toFixed(2)), speed: Number(s.speed.toFixed(3)), heading: Number(s.heading.toFixed(3)) });
  }
  out.fox_20s = fox;
  const us = fox.map((f) => f.u);
  out.fox_du_per_s = us.map((u, i) => (i ? Number((u - us[i - 1]).toFixed(4)) : null));
  out.fox_route_len = Math.hypot(p0.foxRoute.a.x - p0.foxRoute.b.x, p0.foxRoute.a.z - p0.foxRoute.b.z);
  out.fox_m_per_s = out.fox_du_per_s.map((d) => (d === null ? null : Number((Math.abs(d) * out.fox_route_len).toFixed(3))));
  out.fox_max_heading_jump = Math.max(...fox.map((f, i) => (i ? Math.abs(Math.atan2(Math.sin(f.heading - fox[i - 1].heading), Math.cos(f.heading - fox[i - 1].heading))) : 0)));

  // the deer wanders in its patch after nine seconds parked: it must never leave the plate
  const deer = [];
  for (let i = 0; i < 60; i++) {
    const t = await h.step(60);
    const d = await h.evaluate(() => {
      const p = globalThis.ssWorld.probe();
      return { x: Number(p.deer.x.toFixed(2)), z: Number(p.deer.z.toFixed(2)), inside: globalThis.ssWorld.inside(p.deer.x, p.deer.z), ground: Number(p.deer.ground.toFixed(2)) };
    });
    deer.push({ t: Number(t.toFixed(1)), ...d });
  }
  out.deer_60s = { outside: deer.filter((d) => !d.inside), minGround: Math.min(...deer.map((d) => d.ground)), last: deer[deer.length - 1], samples: deer.length };
  out.hud = await h.hud();
  return out;
};
