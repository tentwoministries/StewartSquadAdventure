// The five frames the round-2 meadow brief names (`reel-fixes-meadow-04.md` check 4). One phase per
// run, chosen with SS_PHASE, because each wants its own station and its own 12 s after navigation:
//   study  ?shot=S2  an ssOrbit framing at 3.5 m, the three goblins at idle, faces to the lens
//   fight  ?shot=S3  the fight at game distance, the three fanned out, one winding up  (+ the hit)
//   totem  ?shot=S4  the carved face and the brazier
//   wide   ?shot=S1  the meadow: the totem reads at 28 m
module.exports = async (page, h) => {
  const phase = process.env.SS_PHASE || 'study';
  await h.sleep(12000);
  return h.evaluate(
    async ({ phase }) => {
      const w = globalThis.ssWorld;
      const out = { phase, url: globalThis.location.href, saved: [] };
      const step = (n) => globalThis.ssStep(n);
      const snap = async (name) => { const f = await globalThis.ssSnap(name); out.saved.push(f); return f; };

      if (phase === 'study') {
        step(600);                                    // ten seconds of idle life before the look
        const p = w.probe();
        const gs = p.goblins;
        const deg = (rad) => ((-(rad * 180) / Math.PI) % 360 + 360) % 360;   // look back along a heading
        const o = globalThis.ssOrbit;
        // (1) the brief's 3.5 m study: one goblin, its own heading to the lens, so the face reads
        const g = gs[1];
        o.current.target = [g.x, 0.62, g.z];
        o.current.yaw = deg(g.heading); o.current.pitch = 10; o.current.d = 3.5;
        o.apply(); step(2);
        out.framing_close = { target: o.current.target, yaw: +o.current.yaw.toFixed(1), pitch: 10, d: 3.5, goblin: g.i };
        await snap('meadow-golden-goblin-study-04');
        // (2) all three: at 3.5 m the idle mill spreads them past a 53° horizontal frame, so the
        // pack shot is pulled back to 6.5 m on the centroid, still inside the "reads at 4 m" test
        const cx = gs.reduce((a, q) => a + q.x, 0) / gs.length;
        const cz = gs.reduce((a, q) => a + q.z, 0) / gs.length;
        const mh = Math.atan2(gs.reduce((a, q) => a + Math.sin(q.heading), 0), gs.reduce((a, q) => a + Math.cos(q.heading), 0));
        o.current.target = [cx, 0.60, cz];
        o.current.yaw = deg(mh); o.current.pitch = 13; o.current.d = 6.5;
        o.apply(); step(2);
        out.framing_pack = { target: o.current.target, yaw: +o.current.yaw.toFixed(1), pitch: 13, d: 6.5 };
        out.goblins = gs.map((q) => ({ i: q.i, state: q.state, x: +q.x.toFixed(2), z: +q.z.toFixed(2), heading: +q.heading.toFixed(3) }));
        await snap('meadow-golden-goblin-study-04');
      }

      if (phase === 'fight') {
        step(120);
        globalThis.ssKey('0');
        // step until all three are alive, fanned, and at least one is winding up
        let found = null;
        for (let f = 0; f < 3000 && !found; f++) {
          step(1);
          const p = w.probe();
          const gs = p.goblins;
          if (gs.some((g) => g.state === 'windup') && gs.every((g) => g.d < 2.0)) {
            const bs = gs.map((g) => g.bearing);
            let span = 0;
            for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { let d = Math.abs(bs[i] - bs[j]) % 360; if (d > 180) d = 360 - d; span = Math.max(span, d); }
            if (span >= 60) found = { t: f, states: gs.map((g) => g.state), d: gs.map((g) => +g.d.toFixed(2)), bearings: bs.map((b) => +b.toFixed(0)), span: +span.toFixed(1) };
          }
        }
        out.fight_frame = found;
        await snap('meadow-golden-s3-04');
        // ... then the club on the ground: the last frame of a `hit`, ring still flashing
        let hit = null;
        for (let f = 0; f < 3000 && !hit; f++) {
          step(1);
          const p = w.probe();
          const g = p.goblins.find((x) => x.state === 'hit' && x.st >= 0.11);
          if (g) hit = { i: g.i, st: +g.st.toFixed(4), clubLow: +g.clubLow.toFixed(4), ringAlpha: +globalThis.ssKids[0].ring.material.uniforms.uAlpha.value.toFixed(3), dustLive: p.dustLive };
        }
        out.hit_frame = hit;
        out.hit_probe = w.probe();
        await snap('meadow-golden-hit-04');
      }

      if (phase === 'totem') { step(120); await snap('meadow-golden-s4-04'); }
      if (phase === 'wide') { step(120); await snap('meadow-golden-s1-04'); }
      out.hud = w.hud();
      return out;
    },
    { phase },
  );
};
