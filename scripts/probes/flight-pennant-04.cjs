// Probe: T-65's pennant (docs/qa/briefs/reel-fixes-flight-04.md check 3). Everything is measured in
// **plane space** off the drawn bones — the chain is found by its root position on the rear outer
// strut, not handed over by the scene — so the check never reads the scene's report of itself.
//   * at wind 1 (the cruise) the tip is aft of its root for 240 stepped frames, its swing amplitude
//     is between 0.08 and 0.4 rad, and no segment's absolute pitch moves more than 0.08 rad a frame;
//   * at the roll-out (speed 0) the tip hangs below the root;
//   * parked (wind 0, the call the Bog / Desert / Frozen scenes make) it still moves over 120 frames.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=WG&t=golden&step=1" scripts/probes/flight-pennant-04.cjs

const RUN = (frames) => {
  const T = globalThis.ssTHREE, f = globalThis.ssFlight, p = f.plane;
  const root = p.children.find((c) => c.type === 'Group' && Math.abs(c.position.x - 0.1) < 1e-6 && Math.abs(c.position.z + 2.4) < 1e-6);
  if (!root) throw new Error('no pennant chain on the rear outer strut');
  const chain = [];
  let n = root;
  for (;;) { const kid = n.children.find((c) => c.type === 'Group'); if (!kid) break; chain.push(kid); n = kid; }
  const w = new T.Vector3(), rootP = new T.Vector3(), tipP = new T.Vector3();
  const AFT = new T.Vector3(), UP = new T.Vector3();
  const rows = [];
  for (let i = 0; i < frames; i++) {
    globalThis.ssStep(1);
    p.updateMatrixWorld(true);
    f.toPlane(root.getWorldPosition(w), rootP);
    f.toPlane(chain[chain.length - 1].localToWorld(w.set(0.28, 0, 0)), tipP);
    // each segment's absolute pitch, read from where its own +x axis actually points in plane space
    const pitch = chain.map((b) => {
      f.toPlane(b.getWorldPosition(w), AFT);
      f.toPlane(b.localToWorld(w.set(1, 0, 0)), UP);
      const dx = UP.x - AFT.x, dy = UP.y - AFT.y, dz = UP.z - AFT.z;
      return Math.atan2(dy, Math.hypot(dx, dz)); // + up, − down: the hang is negative
    });
    rows.push({
      ct: +globalThis.ssCut.at().toFixed(3), speed: +f.speed.toFixed(2),
      dx: +(tipP.x - rootP.x).toFixed(4), dy: +(tipP.y - rootP.y).toFixed(4), dz: +(tipP.z - rootP.z).toFixed(4),
      el: Math.atan2(tipP.y - rootP.y, Math.hypot(tipP.x - rootP.x, tipP.z - rootP.z)),
      pitch,
    });
  }
  return rows;
};

const stats = (rows) => {
  const el = rows.map((r) => r.el);
  const lo = Math.min(...el), hi = Math.max(...el);
  let maxStep = 0, maxStepAt = null;
  for (let i = 1; i < rows.length; i++) {
    for (let k = 0; k < rows[i].pitch.length; k++) {
      const d = Math.abs(rows[i].pitch[k] - rows[i - 1].pitch[k]);
      if (d > maxStep) { maxStep = d; maxStepAt = { frame: i, segment: k, ct: rows[i].ct }; }
    }
  }
  return {
    frames: rows.length,
    speed: { min: Math.min(...rows.map((r) => r.speed)), max: Math.max(...rows.map((r) => r.speed)) },
    tipAftEveryFrame: rows.every((r) => r.dx < 0),
    worstDx: +Math.max(...rows.map((r) => r.dx)).toFixed(4),
    tipBelowRootFrames: rows.filter((r) => r.dy < 0).length,
    elevationRad: { min: +lo.toFixed(4), max: +hi.toFixed(4), amplitude: +((hi - lo) / 2).toFixed(4) },
    maxSegmentPitchStepRad: +maxStep.toFixed(4), maxSegmentPitchStepAt: maxStepAt,
    tipTravel: +Math.max(...rows.map((r) => Math.hypot(r.dx - rows[0].dx, r.dy - rows[0].dy, r.dz - rows[0].dz))).toFixed(4),
  };
};

module.exports = async (page, h) => {
  await h.sleep(12000);
  const seek = (t) => h.evaluate((tt) => { globalThis.ssCut.seek(tt); globalThis.ssStep(1); }, t);

  // 1. the cruise: wind 1 for 240 frames
  await seek(12.0);
  const cruise = stats(await h.evaluate(RUN, 240));

  // 2. the roll-out: the wheels are down and the speed is 0, so the flag hangs
  await seek(28.4);
  const rollout = stats(await h.evaluate(RUN, 60));

  // 3. parked: the one-argument call the Bog, the Desert and the Frozen strip make
  await seek(0);
  const parked = stats(await h.evaluate(RUN, 120));

  return {
    url: page.url(),
    cruise, rollout, parked,
    verdict: {
      'tip aft for 240 frames at wind 1': cruise.tipAftEveryFrame,
      'swing amplitude 0.08..0.4 rad': cruise.elevationRad.amplitude >= 0.08 && cruise.elevationRad.amplitude <= 0.4,
      'segment pitch step <= 0.08 rad/frame': cruise.maxSegmentPitchStepRad <= 0.08,
      'tip below root at roll-out': rollout.tipBelowRootFrames === rollout.frames,
      'parked pennant still moves': parked.tipTravel > 0.001,
    },
  };
};
