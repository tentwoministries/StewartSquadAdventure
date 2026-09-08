// Probe: T-52, the seals (reel fixes round 1, check 2). Steps one whole roll of seal 1 and measures
// the world direction of its long axis at every sample (it must not move: the roll is about that
// axis), the roll's peak and its return; then walks Isabella to within 5 m and measures the crawl —
// distance in 3 s, the heading against the velocity under the +x convention, and the scale.x pulse;
// then pushes the seal at the ice's edge for 12 s to show the flee never leaves the ice.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S2&t=night&step=1" scripts/probes/frozen-seals.cjs
const ang = (a, b) => (Math.acos(Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z))) * 180) / Math.PI;

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(0) };
  out.seals_at_load = await h.evaluate(() => globalThis.ssProbe.seals());

  // --- the roll (seal 1 rolls at t = 2.0 s: rollT −8, period 10) -------------------------------
  await h.step(108); // t = 1.80 s
  const roll = [];
  for (let i = 0; i < 70; i++) {
    const t = await h.step(5);
    const s = await h.evaluate(() => globalThis.ssProbe.seals()[1]);
    roll.push({ t: Number(t.toFixed(3)), roll: s.roll, heading: s.heading, long: s.long, scaleX: s.scaleX });
  }
  const long0 = roll[0].long;
  out.roll = {
    samples: roll.length,
    max_roll: Math.max(...roll.map((r) => r.roll)),
    end_roll: roll[roll.length - 1].roll,
    max_long_axis_deg: Number(Math.max(...roll.map((r) => ang(long0, r.long))).toFixed(3)),
    max_heading_change: Number(Math.max(...roll.map((r) => Math.abs(r.heading - roll[0].heading))).toFixed(4)),
    curve: roll.filter((_, i) => i % 3 === 0).map((r) => [r.t, Number(r.roll.toFixed(3))]),
  };
  const steps = roll.map((r, i) => (i ? Math.abs(r.roll - roll[i - 1].roll) : 0));
  out.roll.max_step_per_frame5 = Number(Math.max(...steps).toFixed(4)); // eased, not stepped (T-06)

  // --- the study frame, at the next roll's hold (rollT 12 s → held 12.8–14.0 s) ----------------
  await h.step(Math.round((13.4 - roll[roll.length - 1].t) * 60));
  out.frame_state = await h.evaluate(() => globalThis.ssProbe.seals()[1]);
  out.frame_station = await h.evaluate(() => {
    const s = globalThis.ssProbe.seals()[1], o = globalThis.ssOrbit;
    o.current.target = [s.x, 0.35, s.z]; o.current.yaw = 0; o.current.pitch = 16; o.current.d = 7; o.apply();
    return { target: o.current.target, yaw: o.current.yaw, pitch: o.current.pitch, d: o.current.d };
  });
  out.seals_frame = { t: Number((await h.step(0)).toFixed(2)), file: await h.snap('frozen-night-seals-03') };

  // --- the crawl: Isabella 4.5 m from seal 0 ---------------------------------------------------
  out.hero_moved = await h.evaluate(() => {
    const s = globalThis.ssProbe.seals()[0], k = globalThis.ssActive();
    k.root.position.set(s.x + 1.0, globalThis.ssWorld.groundY(s.x + 1.0, s.z), s.z);
    return { hero: [Number(k.root.position.x.toFixed(2)), Number(k.root.position.z.toFixed(2))], seal: [s.x, s.z] };
  });
  const crawl = [];
  for (let i = 0; i < 18; i++) {
    const t = await h.step(10);
    const s = await h.evaluate(() => globalThis.ssProbe.seals()[0]);
    crawl.push({ t: Number(t.toFixed(3)), x: s.x, z: s.z, heading: s.heading, scaleX: s.scaleX, crawl: s.crawl, long: s.long, lakeD: s.lakeD, inside: s.inside });
  }
  const a0 = crawl[0], a3 = crawl[crawl.length - 1];
  const vx = a3.x - a0.x, vz = a3.z - a0.z;
  const vlen = Math.hypot(vx, vz);
  out.crawl = {
    seconds: Number((a3.t - a0.t).toFixed(2)),
    metres: Number(vlen.toFixed(3)),
    scaleX_min: Number(Math.min(...crawl.map((c) => c.scaleX)).toFixed(4)),
    scaleX_max: Number(Math.max(...crawl.map((c) => c.scaleX)).toFixed(4)),
    crawl_weight_end: a3.crawl,
    // the seal is built along +x: its world +x axis must point along the velocity
    heading_vs_velocity_deg: Number(ang({ x: a3.long.x, y: 0, z: a3.long.z }, { x: vx / vlen, y: 0, z: vz / vlen }).toFixed(2)),
    roll_during_crawl: Number(Math.max(...crawl.map((c) => Math.abs(c.roll ?? 0))).toFixed(3)),
    samples: crawl.map((c) => [c.t, Number(c.x.toFixed(2)), Number(c.z.toFixed(2)), Number(c.scaleX.toFixed(3))]),
  };

  // --- the rim rule: a kid keeps chasing it from the lake's middle for 20 s (the hero is stepped to
  // 1 m behind the seal on the lake-centre side each second, which is a kid walking after it); the
  // seal must stay on the ice and on the plate ------------------------------------------------
  const edge = [];
  for (let i = 0; i < 20; i++) {
    await h.evaluate(() => {
      const s = globalThis.ssProbe.seals()[0], k = globalThis.ssActive();
      const cx = -24 - s.x, cz = 12 - s.z, n = Math.hypot(cx, cz) || 1;
      const hx = s.x + (cx / n) * 1.0, hz = s.z + (cz / n) * 1.0;
      k.root.position.set(hx, globalThis.ssWorld.groundY(hx, hz), hz);
    });
    await h.step(60);
    const s = await h.evaluate(() => globalThis.ssProbe.seals()[0]);
    edge.push({ x: Number(s.x.toFixed(2)), z: Number(s.z.toFixed(2)), lakeD: s.lakeD, inside: s.inside, y: s.y });
  }
  // --- the turn (audit item 2), on a fresh load so the seal carries its resting yaw ---------------
  // A kid crosses the 5 m trigger: the yaw must slew to the flee bearing, never jump to it. Every
  // single frame of the first second is sampled.
  await page.goto('http://localhost:5173/sandbox/frozen-night/?shot=S2&t=night&step=1', { waitUntil: 'load' });
  await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
  await h.sleep(12000);
  await h.step(30);
  out.turn_before = await h.evaluate(() => globalThis.ssProbe.seals()[0]);
  out.turn_hero = await h.evaluate(() => {
    const s = globalThis.ssProbe.seals()[0], k = globalThis.ssActive();
    const hx = s.x + 1.2, hz = s.z;                       // due +x of the seal: it flees toward −x
    k.root.position.set(hx, globalThis.ssWorld.groundY(hx, hz), hz);
    return { hero: [Number(hx.toFixed(2)), Number(hz.toFixed(2))], seal: [s.x, s.z], d: 1.2 };
  });
  const turn = [];
  for (let i = 0; i < 60; i++) {
    const t = await h.step(1);
    const s = await h.evaluate(() => globalThis.ssProbe.seals()[0]);
    turn.push({ t: Number(t.toFixed(4)), heading: s.heading, want: s.want, x: s.x, z: s.z, long: s.long });
  }
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const dAll = turn.map((r, i) => (i ? Math.abs(wrap(r.heading - turn[i - 1].heading)) : 0));
  const t0 = turn[0].t;
  const offDeg = turn.map((r, i) => {                      // the +x body axis against the step it took
    const p = i ? turn[i - 1] : turn[0];
    const vx = r.x - p.x, vz = r.z - p.z, n = Math.hypot(vx, vz);
    if (n < 1e-6) return 180;
    return ang({ x: r.long.x, y: 0, z: r.long.z }, { x: vx / n, y: 0, z: vz / n });
  });
  let within10 = null;
  for (let i = 1; i < turn.length; i++) if (offDeg[i] <= 10 && within10 === null) within10 = Number((turn[i].t - t0).toFixed(3));
  out.turn = {
    resting_heading: out.turn_before.heading,
    want: turn[turn.length - 1].want,
    total_turn_rad: Number(Math.abs(wrap(turn[turn.length - 1].heading - out.turn_before.heading)).toFixed(4)),
    max_abs_delta_first20_rad: Number(Math.max(...dAll.slice(1, 21)).toFixed(4)),
    max_abs_delta_all60_rad: Number(Math.max(...dAll.slice(1)).toFixed(4)),
    seconds_to_within_10deg_of_velocity: within10,
    first20_deltas_rad: dAll.slice(1, 21).map((v) => Number(v.toFixed(4))),
    heading_off_velocity_every_5_frames: turn.filter((_, i) => i % 5 === 0).map((r, k) => [Number((r.t - t0).toFixed(3)), Number(r.heading.toFixed(4)), Number(offDeg[k * 5].toFixed(2))]),
  };
  out.edge = { max_lakeD: Math.max(...edge.map((e) => e.lakeD)), all_inside: edge.every((e) => e.inside), last: edge[edge.length - 1], samples: edge.length };
  return out;
};
