// Probe: CS-04's bank, speed and altitude over the whole flight (opus-fixes-flight check 3).
// Steps the stepping harness 0.1 s at a time from second 0 to the park and reads the numbers off
// `ssFlight` — never off the HUD's DOM text, which only refreshes on a key event. Reports the
// one-second table, the longest stretch pinned at the ±35° clamp, and whether the last 1.5 s before
// touchdown level out monotonically.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1&ct=0" scripts/probes/flight-bank.cjs
module.exports = async (page, h) => {
  await h.sleep(4000);
  return h.evaluate(() => {
    const f = globalThis.ssFlight, cut = globalThis.ssCut;
    const CLAMP = 35, NEAR = 0.5, STEP = 6; // 6 frames = 0.1 s
    const rows = [];
    const len = 28.5;
    for (let t = 0; t <= len + 1e-6; t += 0.1) {
      rows.push({
        t: +cut.at().toFixed(3), v: +f.speed.toFixed(3), bank: +f.bankDeg.toFixed(3),
        alt: +f.pos.y.toFixed(2), s: +f.distance.toFixed(2), bounce: +f.bounce.toFixed(3),
        x: +f.pos.x.toFixed(1), z: +f.pos.z.toFixed(1), beat: f.hud().split(' · ')[0],
      });
      globalThis.ssStep(STEP);
    }
    // the longest run of samples at (or within half a degree of) the clamp
    let pinned = 0, run = 0, pinnedAt = null, runStart = 0;
    for (const r of rows) {
      if (Math.abs(r.bank) >= CLAMP - NEAR) { if (run === 0) runStart = r.t; run += 0.1; if (run > pinned) { pinned = run; pinnedAt = runStart; } }
      else run = 0;
    }
    // the last 1.5 s before touchdown: |bank| must not grow
    const TD = 25.0;
    const tail = rows.filter((r) => r.t >= TD - 1.5 - 1e-6 && r.t <= TD + 1e-6);
    let worstRise = 0;
    for (let i = 1; i < tail.length; i++) worstRise = Math.max(worstRise, Math.abs(tail[i].bank) - Math.abs(tail[i - 1].bank));
    const maxTailBank = tail.reduce((a, r) => Math.max(a, Math.abs(r.bank)), 0);
    // how long the roll-out to level takes: the last time the bank was past 5°, and past 1°
    const lastPast = (deg) => { const r = rows.filter((x) => x.t <= TD && Math.abs(x.bank) > deg).pop(); return r ? +r.t.toFixed(1) : null; };
    const maxBank = rows.reduce((a, r) => Math.max(a, Math.abs(r.bank)), 0);
    return {
      pathLength: +f.length.toFixed(3),
      samples: rows.length,
      maxBankDeg: +maxBank.toFixed(3),
      longestPinnedSeconds: +pinned.toFixed(2), pinnedFrom: pinnedAt,
      levelOutMonotonicWithin0p2Deg: worstRise <= 0.2,
      worstRiseInTailDeg: +worstRise.toFixed(4), maxTailBankDeg: +maxTailBank.toFixed(3),
      lastBankPast5Deg: lastPast(5), lastBankPast1Deg: lastPast(1),
      levelOutSecondsBeforeTouchdown: lastPast(5) === null ? null : +(TD - lastPast(5)).toFixed(1),
      tailBank: tail.map((r) => `${r.t.toFixed(1)}s ${r.bank.toFixed(2)}deg`),
      perSecond: rows.filter((_, i) => i % 10 === 0).map((r) => `t ${r.t.toFixed(1)}  v ${r.v.toFixed(2)}  bank ${r.bank.toFixed(2)}  alt ${r.alt.toFixed(1)}  s ${r.s.toFixed(1)}  (${r.x}, ${r.z})  ${r.beat}`),
      bounceWindow: rows.filter((r) => r.t >= 24.9 && r.t <= 26.4).map((r) => `${r.t.toFixed(1)}s ${r.bounce.toFixed(3)}m`),
      final: rows[rows.length - 1],
    };
  });
};
