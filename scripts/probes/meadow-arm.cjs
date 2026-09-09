// Diagnostic: where the club arm's biggest per-frame rotation comes from (body yaw, hunch, or IK).
module.exports = async (page, h) => {
  await h.sleep(12000);
  return h.evaluate(() => {
    const w = globalThis.ssWorld;
    globalThis.ssKey('0');
    const last = [null, null, null];
    const qa = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3])));
    const worst = { world: 0, local: 0, yaw: 0, lean: 0 };
    const rows = [];
    for (let f = 0; f < 1500; f++) {
      const t = globalThis.ssStep(1);
      for (const g of w.probe().goblins) {
        const p = last[g.i];
        if (p) {
          const dw = qa(p.armQ, g.armQ), dl = qa(p.armL, g.armL);
          let dy = Math.abs(g.rotY - p.rotY) % (2*Math.PI); if (dy > Math.PI) dy = 2*Math.PI - dy;
          const dln = Math.abs(g.lean - p.lean);
          if (dw > worst.world) worst.world = dw;
          if (dl > worst.local) worst.local = dl;
          if (dy > worst.yaw) worst.yaw = dy;
          if (dln > worst.lean) worst.lean = dln;
          if (dl > 0.30 || dw > 0.35) rows.push({ t: +t.toFixed(3), i: g.i, from: p.state, to: g.state, st: +g.st.toFixed(4), d: +g.d.toFixed(3), dWorld: +dw.toFixed(3), dLocal: +dl.toFixed(3), dYaw: +dy.toFixed(3), dLean: +dln.toFixed(3) });
        }
        last[g.i] = g;
      }
    }
    return { worst, count: rows.length, rows: rows.slice(0, 40) };
  });
};
