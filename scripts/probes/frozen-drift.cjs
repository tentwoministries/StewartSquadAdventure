// Probe: T-51, the penguins' drift (reel fixes round 1, check 1). Samples groundY along the slide
// path (20 points, top → foot) and along all six lanes, reads lakeD at both ends, then steps one
// whole 22 s colony loop (1320 frames, a sample every 10) and classifies every sample by the phase
// the scene itself reports, so "waddle up" and "belly-slide down" are asserted from the run and not
// from the code reading right. Saves the PG station frame and a mid-slide frame.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=PG&t=night&step=1" scripts/probes/frozen-drift.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), t0: await h.step(0) };
  out.drift = await h.evaluate(() => globalThis.ssProbe.drift());

  out.profile = await h.evaluate(() => {
    const p = globalThis.ssProbe, d = p.drift();
    const [tx, tz] = d.top, [fx, fz] = d.foot;
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const u = i / 19, x = tx + (fx - tx) * u, z = tz + (fz - tz) * u;
      rows.push({ i, x: Number(x.toFixed(2)), z: Number(z.toFixed(2)), y: Number(p.groundY(x, z).toFixed(3)), lakeD: Number(p.lakeD(x, z).toFixed(3)), inside: p.inside(x, z) });
    }
    return rows;
  });
  const ys = out.profile.map((r) => r.y);
  out.profile_drop = Number((ys[0] - ys[ys.length - 1]).toFixed(3));
  out.profile_max_rise = Number(Math.max(...ys.map((y, i) => (i ? y - ys[i - 1] : 0))).toFixed(4));
  out.profile_monotonic = out.profile_max_rise <= 0;
  out.lakeD_top = out.profile[0].lakeD; out.lakeD_foot = out.profile[19].lakeD;

  out.lanes = await h.evaluate(() => {
    const p = globalThis.ssProbe, d = p.drift();
    const [tx, tz] = d.top, [fx, fz] = d.foot;
    return d.lanes.map((lane) => {
      const ys = [];
      for (let i = 0; i < 20; i++) { const u = i / 19; ys.push(Number(p.groundY(tx + (fx - tx) * u + d.perp[0] * lane, tz + (fz - tz) * u + d.perp[1] * lane).toFixed(3))); }
      return { lane, drop: Number((ys[0] - ys[19]).toFixed(3)), maxRise: Number(Math.max(...ys.map((y, i) => (i ? y - ys[i - 1] : 0))).toFixed(4)) };
    });
  });

  // the PG station frame (a bird sliding at t = 4.0 s), then the mid-slide frame at t = 12.1 s
  await h.step(240);
  out.pg_frame = { t: Number((await h.step(0)).toFixed(2)), file: await h.snap('frozen-night-pg-03'), penguins: await h.evaluate(() => globalThis.ssProbe.penguins()) };
  await h.step(485);
  out.slide_frame = { t: Number((await h.step(0)).toFixed(2)), file: await h.snap('frozen-night-slide-03'), penguins: await h.evaluate(() => globalThis.ssProbe.penguins()) };

  // one whole loop: 1320 frames, a sample every 10
  const samples = [];
  for (let i = 0; i < 132; i++) {
    const t = await h.step(10);
    samples.push({ t: Number(t.toFixed(3)), p: await h.evaluate(() => globalThis.ssProbe.penguins()) });
  }
  out.loop_samples = samples.length;
  const dir = { x: out.drift.down[0], z: out.drift.down[1] };
  const per = [];
  for (let k = 0; k < 6; k++) {
    const seq = samples.map((s) => ({ t: s.t, ...s.p[k] }));
    const phases = {};
    for (const ph of ['up', 'top', 'slide', 'mill']) phases[ph] = seq.filter((s) => s.phase === ph).length;
    // the y of consecutive samples inside one unbroken run of a phase
    const runViolations = (ph, cmp) => {
      let worst = 0, prev = null;
      for (const s of seq) {
        if (s.phase !== ph) { prev = null; continue; }
        if (prev !== null) worst = Math.max(worst, cmp(prev, s.y));
        prev = s.y;
      }
      return Number(worst.toFixed(4));
    };
    const mid = seq.filter((s) => s.phase === 'slide');
    const m = mid[Math.floor(mid.length / 2)];
    const headH = m ? Math.hypot(m.head.x, m.head.z) : 0;
    const headAngle = m ? Math.acos(Math.min(1, Math.max(-1, (m.head.x * dir.x + m.head.z * dir.z) / (headH || 1)))) * 180 / Math.PI : null;
    per.push({
      penguin: k, phases,
      up_worst_drop: runViolations('up', (a, b) => a - b),          // > 0.02 fails "non-decreasing"
      slide_worst_rise: runViolations('slide', (a, b) => b - a),    // > 0 fails "non-increasing"
      up_span: [Math.min(...seq.filter((s) => s.phase === 'up').map((s) => s.y)), Math.max(...seq.filter((s) => s.phase === 'up').map((s) => s.y))].map((v) => Number(v.toFixed(3))),
      slide_span: [Math.min(...seq.filter((s) => s.phase === 'slide').map((s) => s.y)), Math.max(...seq.filter((s) => s.phase === 'slide').map((s) => s.y))].map((v) => Number(v.toFixed(3))),
      mid_slide: m ? { t: m.t, bellyY: m.belly.y, headHorizDeg: Number(headAngle.toFixed(2)), pitch: m.pitch } : null,
    });
  }
  out.per_penguin = per;
  out.slide_dir = dir;
  out.hud = await h.hud();
  return out;
};
