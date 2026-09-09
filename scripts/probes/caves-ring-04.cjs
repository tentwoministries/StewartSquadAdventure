// Probe: the selection ring conforming to stepped ground (T-61c, T-56; brief check 3).
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1&relief=chunky" scripts/probes/caves-ring-04.cjs
//
// Isabella is stood at 20 seeded points on the chunky Landing — at least 8 of them straddling a
// column edge, which is where a flat disc breaks — and at each one the probe reads the ring's own
// `aLift` array *and the world xz each lift was sampled at* (the rig records both, so the check
// compares like with like at the breathed radius) and raycasts the drawn `tiers`/`stairs` under
// them. `|aLift + root.y + 0.04 − top|` must be ≤ 0.06 at every vertex.
//
// Round 2's fix A4 rebuilt the ring on **three** radial rings: 147 vertices, 0..48 at r = 0.45,
// 49..97 at r = **0.62** and 98..146 at r = 0.84 (`RingGeometry(0.45, 0.84, 48, 2)`, verified
// against three r185 as 147 verts / 576 indices, with its evenly-spaced middle ring at 0.645 pulled
// in to 0.62). heroes.md §2.7.5's crisp rim is therefore a real vertex ring now, and this probe
// reads it directly instead of interpolating: round 1's interpolated rim was out by up to 0.2533 m
// where a 0.54 m step fell inside the band, which is the defect A4 exists to close.
//
// Then the cost: 120 frames with all four kids moved every frame, summing the four rigs' own
// `performance.now()` measurement of the lift update. Must be under 0.5 ms per frame for four kids.
const RIM_R = 0.62;

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), relief: await h.evaluate(() => globalThis.ssWorld.hud()[0]), stands: [] };

  // --- part A: 20 stands -------------------------------------------------------------------------
  const A = await h.evaluate(async (rimR) => {
    const T = globalThis.ssTHREE;
    const w = globalThis.ssWorld;
    const izzy = globalThis.ssKids[3];
    const scene = izzy.root.parent;
    const meshes = ['tiers', 'stairs'].map((n) => scene.getObjectByName(n));
    const ray = new T.Raycaster(), down = new T.Vector3(0, -1, 0);
    const topAt = (x, z, from) => {
      ray.set(new T.Vector3(x, from + 3, z), down); ray.far = 80;
      let best = null;
      for (const m of meshes) for (const hit of ray.intersectObject(m, false)) if (best === null || hit.point.y > best) best = hit.point.y;
      return best;
    };
    let seed = 20260908;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const flat = [], edge = [];
    for (let guard = 0; guard < 4000 && (flat.length < 12 || edge.length < 8); guard++) {
      const x = -14 + rnd() * 30, z = -43 + rnd() * 15;
      if (w.groundY(x, z) < -2 || !w.walkable(x, z)) continue;
      izzy.root.position.set(x, w.groundY(x, z), z);
      globalThis.ssStep(2);
      const rig = globalThis.ssRigProbe['isabella.rig']();
      const lift = rig.ring.lift, xz = rig.ring.xz;
      const spread = Math.max(...lift) - Math.min(...lift);
      const rec = { x: +x.toFixed(3), z: +z.toFixed(3), y: +izzy.root.position.y.toFixed(4), spread: +spread.toFixed(4), verts: rig.ring.verts };
      // 147 vertices in three equal radial rings: 0.45, then the rim at 0.62, then 0.84
      let worstV = 0, worstVAt = '', worstRim = 0, holes = 0, rimVerts = 0;
      const n3 = lift.length / 3;                              // 49 vertices per radial ring
      for (let i = 0; i < lift.length; i++) {
        const top = topAt(xz[i * 2], xz[i * 2 + 1], izzy.root.position.y);
        if (top === null) { holes++; continue; }
        const e = Math.abs(lift[i] + izzy.root.position.y + 0.04 - top);
        const r = i < n3 ? 0.45 : i < 2 * n3 ? rimR : 0.84;
        if (e > worstV) { worstV = e; worstVAt = `v${i} r${r}`; }
        if (r === rimR) { rimVerts++; worstRim = Math.max(worstRim, e); }
      }
      rec.worstVertex = +worstV.toFixed(4); rec.worstVertexAt = worstVAt; rec.worstRim062 = +worstRim.toFixed(4); rec.rimVerts = rimVerts; rec.holes = holes;
      rec.kind = spread > 0.05 ? 'edge' : 'flat';
      if (rec.kind === 'edge' && edge.length < 8) edge.push(rec);
      else if (rec.kind === 'flat' && flat.length < 12) flat.push(rec);
    }
    return [...edge, ...flat];
  }, RIM_R);
  out.stands = A;
  out.worstVertex = Math.max(...A.map((s) => s.worstVertex));
  out.worstRim062 = Math.max(...A.map((s) => s.worstRim062));
  out.edgeStands = A.filter((s) => s.kind === 'edge').length;
  out.holes = A.reduce((n, s) => n + s.holes, 0);

  // --- part B: the per-frame cost ----------------------------------------------------------------
  out.cost = await h.evaluate(() => {
    const w = globalThis.ssWorld;
    const kids = globalThis.ssKids;
    const names = kids.map((k) => `${k.name.toLowerCase()}.rig`);
    let total = 0, frames = 0, updates = 0;
    for (let f = 0; f < 120; f++) {
      const d = f % 2 ? -0.03 : 0.03;              // 0.03 m a frame: over the rig's 0.02 m threshold
      for (const k of kids) { k.root.position.x += d; k.root.position.y = w.groundY(k.root.position.x, k.root.position.z); }
      globalThis.ssStep(1);
      let ms = 0;
      for (const n of names) { const r = globalThis.ssRigProbe[n]().ring; ms += r.ms; if (r.ms > 0) updates++; }
      total += ms; frames++;
    }
    // Chrome clamps performance.now() to about 0.1 ms, so a single update reads as 0 or 0.1: the sum
    // above is an upper bound. The wall-clock difference between 120 stepped frames with the kids
    // moving (every ring re-lifted) and 120 with them still (no lift work at all) is the same number
    // measured once instead of 480 times.
    const runFrames = (move) => {
      const t0 = globalThis.performance.now();
      for (let f = 0; f < 120; f++) {
        if (move) for (const k of kids) { k.root.position.x += f % 2 ? -0.03 : 0.03; k.root.position.y = w.groundY(k.root.position.x, k.root.position.z); }
        globalThis.ssStep(1);
      }
      return (globalThis.performance.now() - t0) / 120;
    };
    const still = runFrames(false), moving = runFrames(true);
    return {
      frames, updatesCounted: updates, meanMsForFourKids: +(total / frames).toFixed(4),
      groundCallsPerFrame: 4 * globalThis.ssRigProbe['liam.rig']().ring.verts,
      msPerFrameStill: +still.toFixed(4), msPerFrameMoving: +moving.toFixed(4), deltaMsPerFrame: +(moving - still).toFixed(4),
    };
  });
  out.hud = await h.hud();
  return out;
};
