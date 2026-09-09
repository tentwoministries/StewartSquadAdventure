// Probe: C2 of docs/qa/briefs/reel-fixes-04-fixes.md — **every vertex of every mesh** under each
// kid's root, transformed into plane space, against the plane's solids. The `-04` probe sampled
// eight *bone* points and `clearance()` scores a point below the well's floor as clear, so
// Collette's dress hung through the floor and out under the fuselage with "worst +0.030 m, all ≥ 0".
//
// Three tests per vertex, all in plane space:
//   1. inside any solid box of `plane.solids` (signed clearance < 0);
//   2. below the well's floor while inside the well's xz footprint (the hole the bone test misses);
//   3. inside either wing's box (already covered by 1, reported separately so B and C read).
// It also dumps each kid's own extents — bbox in plane space, and the half-width across the plane
// measured from that kid's socket z — which is what the seating is designed against.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-mesh-04b.cjs
//   SS_VARIANTS=a node scripts/sandbox-drive.cjs ... (one variant only)

const MEASURE = () => {
  const T = globalThis.ssTHREE, f = globalThis.ssFlight, api = globalThis.ssSeatApi;
  const v = api.variant();
  const clr = (s, x, y, z) => {
    const dx = Math.max(s.x0 - x, x - s.x1), dy = Math.max(s.y0 - y, y - s.y1), dz = Math.max(s.z0 - z, z - s.z1);
    if (dx > 0 || dy > 0 || dz > 0) return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
    return Math.max(dx, dy, dz);
  };
  // the well's footprint: the scene's own numbers when it publishes them, else the `well.floor`
  // solid, so the same probe runs against the build it is checking and against the one before it
  const fl = f.solids.find((s) => s.name === 'well.floor');
  const well = f.well || (fl ? { x0: fl.x0, x1: fl.x1, floorY: fl.y0, floorTop: fl.y1, halfZ: fl.z1 } : null);
  const floorAt = f.floorAt || null;         // y of the well's floor deck at a plane-space x
  const p = new T.Vector3(), q = new T.Vector3();
  const out = { variant: v, ct: +globalThis.ssCut.at().toFixed(3), stall: +f.stall.toFixed(3), kids: [] };
  f.group.updateMatrixWorld(true);
  for (let i = 0; i < globalThis.ssKids.length; i++) {
    const k = globalThis.ssKids[i];
    k.root.updateMatrixWorld(true);
    const seatZ = api.seats[v][i][2], seatX = api.seats[v][i][0];
    let verts = 0, meshes = 0;
    let worst = { c: Infinity, solid: null, mesh: null, p: null };
    let underFloor = { d: 0, mesh: null, p: null };     // how far below the floor deck, inside the well
    let inWing = { c: Infinity, mesh: null, p: null };
    const bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
    // every vertex row (y offset from this kid's own hip point) that passes over the lower wing:
    // what a wing rider's seat height has to thread between (fix C2, variant B)
    const wing = f.solids.find((q) => q.name === 'wing.lower');
    const rows = new Set();
    // what would *show*: how far any vertex lies outside the fuselage's own skin while it is beside
    // or under the cockpit. plane.ts AXIS_Y = 0.95, so the surface at x is 0.95 +/- halfWidthAt(x).
    let proud = { side: 0, below: 0, at: null };
    const seatY = api.seats[v][i][1];
    k.root.traverse((n) => {
      if (!n.isMesh || !n.visible || !n.geometry) return;
      let vis = true;
      for (let a = n; a; a = a.parent) { if (!a.visible) { vis = false; break; } if (a === k.root) break; }
      if (!vis) return;
      const pos = n.geometry.getAttribute('position');
      if (!pos) return;
      meshes++;
      for (let j = 0; j < pos.count; j++) {
        p.set(pos.getX(j), pos.getY(j), pos.getZ(j));
        n.localToWorld(p);
        f.toPlane(p, q);
        verts++;
        if (q.x < bb.x0) bb.x0 = q.x; if (q.x > bb.x1) bb.x1 = q.x;
        if (q.y < bb.y0) bb.y0 = q.y; if (q.y > bb.y1) bb.y1 = q.y;
        if (q.z < bb.z0) bb.z0 = q.z; if (q.z > bb.z1) bb.z1 = q.z;
        if (well && q.x > well.x0 && q.x < well.x1 && f.halfWidthAt) {
          const hw = f.halfWidthAt(q.x);
          if (q.y < 0.95 + hw) {
            const sp = Math.abs(q.z) - hw;
            if (sp > proud.side) proud = { side: sp, below: proud.below, at: [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)], mesh: n.name || n.parent?.name || "?" };
            if (Math.abs(q.z) < hw) { const bp = 0.95 - hw - q.y; if (bp > proud.below) proud = { side: proud.side, below: bp, at: [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)], mesh: n.name || n.parent?.name || "?" }; }
          }
        }
        if (wing && q.x > wing.x0 && q.x < wing.x1 && Math.abs(q.z) < wing.z1 && q.y > wing.y0 - 0.4 && q.y < wing.y1 + 0.4) rows.add(Math.round((q.y - seatY) * 1000) / 1000);
        for (const s of f.solids) {
          const c = clr(s, q.x, q.y, q.z);
          if (c < worst.c) worst = { c, solid: s.name, mesh: n.name || n.parent?.name || '?', p: [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)] };
          if (s.name === 'wing.lower' || s.name === 'wing.upper') {
            if (c < inWing.c) inWing = { c, mesh: n.name || n.parent?.name || '?', p: [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)] };
          }
        }
        // below the well's floor while inside its xz footprint
        if (well && q.x > well.x0 && q.x < well.x1) {
          const halfZ = f.halfWidthAt ? f.halfWidthAt(q.x) : well.halfZ;
          if (Math.abs(q.z) < halfZ) {
            const deck = floorAt ? floorAt(q.x) : well.floorTop;
            const d = deck - q.y;
            if (d > underFloor.d) underFloor = { d, mesh: n.name || n.parent?.name || '?', p: [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)] };
          }
        }
      }
    });
    out.kids.push({
      name: k.name, seat: [seatX, +seatZ.toFixed(3)], meshes, verts,
      worstSolid: { c: +worst.c.toFixed(4), solid: worst.solid, mesh: worst.mesh, at: worst.p },
      underFloor: { depth: +underFloor.d.toFixed(4), mesh: underFloor.mesh, at: underFloor.p },
      inWing: { c: +inWing.c.toFixed(4), mesh: inWing.mesh, at: inWing.p },
      bbox: { x: [+bb.x0.toFixed(3), +bb.x1.toFixed(3)], y: [+bb.y0.toFixed(3), +bb.y1.toFixed(3)], z: [+bb.z0.toFixed(3), +bb.z1.toFixed(3)] },
      halfWidthFromSeat: +Math.max(Math.abs(bb.z1 - seatZ), Math.abs(seatZ - bb.z0)).toFixed(3),
      proud: { side: +proud.side.toFixed(4), below: +proud.below.toFixed(4), at: proud.at, mesh: proud.mesh },
      wingRows: [...rows].sort((p, q) => p - q),
      headTopAbove: null,
    });
  }
  return out;
};

// Two other fixers are editing `sandbox/` while this runs, so Vite full-reloads the page under the
// probe. Every variant is therefore a cold `?seats=` load inside a retry (the `N` cycle itself is
// exercised by `flight-seats-04.cjs`), and a lost execution context just costs one more load.
const BASE = 'http://localhost:5173/sandbox/flight-golden/';

module.exports = async (page, h) => {
  const variants = (process.env.SS_VARIANTS || 'a,b,c').split(',').filter(Boolean);
  const rows = [];
  const once = async (v) => {
    await page.goto(`${BASE}?shot=CH&t=golden&step=1&seats=${v}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld, { timeout: 60000 });
    await h.sleep(12000);
    const got = [];
    for (const [label, t] of [[`ride 18.0 s · ${v}`, 18.0], [`stall 7.6 s · ${v}`, 7.6]]) {
      await h.evaluate((tt) => {
        if (tt < globalThis.ssCut.at()) globalThis.ssCut.seek(tt - 0.5);
        globalThis.ssStep(Math.max(1, Math.round((tt - globalThis.ssCut.at()) * 60)));
      }, t);
      got.push({ label, ...(await h.evaluate(MEASURE)) });
    }
    return got;
  };
  for (const v of variants) {
    let got = null, err = null;
    for (let tryN = 0; tryN < 4 && !got; tryN++) {
      try { got = await once(v); } catch (e) { err = e; await h.sleep(3000); }
    }
    if (!got) throw err;
    rows.push(...got);
  }
  const summary = rows.map((r) => ({
    label: r.label,
    worst: Math.min(...r.kids.map((k) => k.worstSolid.c)),
    underFloor: Math.max(...r.kids.map((k) => k.underFloor.depth)),
    perKid: r.kids.map((k) => `${k.name} solid ${k.worstSolid.c.toFixed(3)} (${k.worstSolid.solid}) · underFloor ${k.underFloor.depth.toFixed(3)} · wing ${k.inWing.c.toFixed(3)} · halfW ${k.halfWidthFromSeat.toFixed(3)} · y ${k.bbox.y[0].toFixed(2)}..${k.bbox.y[1].toFixed(2)}`),
  }));
  return { url: page.url(), summary, rows };
};
