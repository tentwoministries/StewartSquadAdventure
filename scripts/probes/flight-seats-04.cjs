// Probe: T-66's three seatings, every state stepped (docs/qa/briefs/reel-fixes-flight-04.md check 2;
// LESSONS.md §0 rule 8 — a mechanic is not built until a stepped probe has shown every state).
//
// For each of A, B and C — reached by pressing `N`, so the key itself is exercised — at 18.0 s of
// the ride and at the stall-drop's deepest frame (7.6 s, STALL.at + dur/2):
//   * every sampled bone (hips, both knees, both feet, both hands, head) of all four kids is
//     transformed into **plane space** and tested against the plane's solids as boxes; the worst
//     signed clearance per kid is quoted (negative = inside).
//   * the palm centre of every solved hand is measured against its grip point on real geometry.
// The box test is written out here rather than imported, so the check does not run the same code it
// is checking. `ssSeatApi` supplies only the *data* (which seating, where the sockets and grips are).
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-seats-04.cjs

const MEASURE = (grab) => {
  const T = globalThis.ssTHREE, f = globalThis.ssFlight, api = globalThis.ssSeatApi;
  const v = api.variant();
  const clr = (s, p) => {
    const dx = Math.max(s.x0 - p.x, p.x - s.x1), dy = Math.max(s.y0 - p.y, p.y - s.y1), dz = Math.max(s.z0 - p.z, p.z - s.z1);
    if (dx > 0 || dy > 0 || dz > 0) return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
    return Math.max(dx, dy, dz);
  };
  const local = new T.Vector3();
  const out = { variant: v, blend: +api.blend().toFixed(3), stall: +f.stall.toFixed(3), ct: +globalThis.ssCut.at().toFixed(3), kids: [] };
  for (let i = 0; i < globalThis.ssKids.length; i++) {
    const k = globalThis.ssKids[i], b = k.bones;
    k.root.updateMatrixWorld(true);
    const pts = {
      hips: b.hips, kneeL: b.LL.sh, kneeR: b.RL.sh, footL: b.LL.foot, footR: b.RL.foot,
      handL: b.L.hand, handR: b.R.hand, head: b.head,
    };
    let worst = { bone: null, solid: null, c: Infinity };
    const detail = {};
    for (const name of Object.keys(pts)) {
      pts[name].getWorldPosition(local);
      f.toPlane(local, local);
      let best = { solid: null, c: Infinity };
      for (const s of f.solids) { const c = clr(s, local); if (c < best.c) best = { solid: s.name, c }; }
      detail[name] = { c: +best.c.toFixed(4), in: best.solid, p: [+local.x.toFixed(3), +local.y.toFixed(3), +local.z.toFixed(3)] };
      if (best.c < worst.c) worst = { bone: name, solid: best.solid, c: best.c };
    }
    // the grips: the palm's centre is the hand node plus (0, −0.055·wf, 0) in hand space
    const onWing = api.onWing(v, i), sz = api.seats[v][i][2];
    const outerIsR = sz < 0;
    const grips = {};
    for (const side of ['outer', 'inner']) {
      const g = api.grip(v, i, side, grab);
      if (!g || g.w <= 0.001) { grips[side] = null; continue; }
      const limb = (side === 'outer') === outerIsR ? b.R : b.L;
      const palm = limb.hand.localToWorld(new T.Vector3(0, -0.055 * b.wf, 0));
      const target = f.fromPlane(g.x, g.y, g.z, new T.Vector3());
      grips[side] = { d: +palm.distanceTo(target).toFixed(4), w: +g.w.toFixed(3), at: [+g.x.toFixed(2), +g.y.toFixed(2), +g.z.toFixed(2)] };
    }
    out.kids.push({ name: k.name, onWing, seatZ: sz, worst: { bone: worst.bone, solid: worst.solid, c: +worst.c.toFixed(4) }, grips, detail });
  }
  return out;
};

module.exports = async (page, h) => {
  await h.sleep(12000);
  const log = [];
  const at = async (label, t, grab) => {
    await h.evaluate((tt) => {
      if (tt < globalThis.ssCut.at()) globalThis.ssCut.seek(tt - 0.5);
      globalThis.ssStep(Math.max(1, Math.round((tt - globalThis.ssCut.at()) * 60)));
    }, t);
    const m = await h.evaluate(MEASURE, grab);
    log.push({ label, ...m });
    return m;
  };
  const cycle = [];
  for (let n = 0; n < 3; n++) {
    if (n > 0) { await h.key('n'); await h.evaluate(() => globalThis.ssStep(45)); } // 0.75 s: the 0.5 s ease finishes
    const hud = await h.hud();
    cycle.push({ press: n === 0 ? 'load' : 'N', variant: await h.evaluate(() => globalThis.ssSeatApi.variant()), hud: hud[1] });
    await at(`ride 18.0 s · ${cycle[n].variant}`, 18.0, 0);
    await at(`stall 7.6 s · ${cycle[n].variant}`, 7.6, 1);
  }
  // and back round to A, so the cycle is shown closing (three states plus the wrap)
  await h.key('n');
  await h.evaluate(() => globalThis.ssStep(45));
  cycle.push({ press: 'N', variant: await h.evaluate(() => globalThis.ssSeatApi.variant()), hud: (await h.hud())[1] });

  const summary = log.map((r) => ({
    label: r.label, stall: r.stall,
    worstClearance: Math.min(...r.kids.map((k) => k.worst.c)),
    perKid: r.kids.map((k) => `${k.name} ${k.worst.c.toFixed(3)} (${k.worst.bone} vs ${k.worst.solid})`),
    grips: r.kids.map((k) => `${k.name} out ${k.grips.outer ? k.grips.outer.d.toFixed(3) : '-'} in ${k.grips.inner ? k.grips.inner.d.toFixed(3) : '-'}`),
  }));
  return { url: page.url(), cycle, summary, log };
};
