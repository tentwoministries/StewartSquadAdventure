// The five frames the round-2 meadow brief names (`reel-fixes-meadow-04.md` check 4). One phase per
// run, chosen with SS_PHASE, because each wants its own station and its own 12 s after navigation:
//   study  ?shot=S2  an ssOrbit framing at 3.5 m, the three goblins at idle, faces to the lens
//   fight  ?shot=S3  the fight at game distance, the three fanned out, one winding up  (+ the hit)
//   totem  ?shot=S4  the carved face and the brazier
//   wide   ?shot=S1  the meadow: the totem reads at 28 m
// SS_SUFFIX picks the round's suffix (`-04` first time round, `-04b` for the fix pass), so the same
// framings are re-shot without a second copy of them.
module.exports = async (page, h) => {
  const phase = process.env.SS_PHASE || 'study';
  const suf = process.env.SS_SUFFIX || '-04';
  await h.sleep(12000);
  return h.evaluate(
    async ({ phase, suf }) => {
      const w = globalThis.ssWorld;
      const out = { phase, suffix: suf, url: globalThis.location.href, saved: [] };
      const step = (n) => globalThis.ssStep(n);
      const snap = async (name) => { const f = await globalThis.ssSnap(name); out.saved.push(f); return f; };
      // audit 10 / fix B1: what the frame about to be saved holds — every goblin's centre distance
      // to the hero's, against the 0.55 m floor, read off the same frame that is written to disk
      const bodies = () => {
        const p = w.probe();
        return {
          goblins: p.goblins.map((g) => ({ i: g.i, state: g.state, d: +g.d.toFixed(3), bearing: +g.bearing.toFixed(1), vis: g.vis })),
          min_goblin_to_hero_m: Math.min.apply(null, p.goblins.filter((g) => g.vis).map((g) => +g.d.toFixed(3))),
          hero_push: p.heroPush,
          screen: overlaps(),
        };
      };

      // ... and what the frame *reads* as. The 0.55 m floor is a body-against-body number; audit 10's
      // frame showed a goblin standing 1.4 m behind Isabella and projecting over her shoulder, which
      // is a composition, not a physics (LESSONS §0 rule 5: a station is looked through before it is
      // saved). So the camera the station gives is rebuilt here (placeCamera's own arithmetic, fov 35
      // from scene.ts) and each body's bounding box is projected: the frame the brief asks for is one
      // where no goblin's box touches hers. 12 px of slack covers the shake's camera offset, which is
      // applied to the runtime's camera and not to ssOrbit.current.
      const T = globalThis.ssTHREE;
      const cv = globalThis.document.querySelector('canvas');
      const cam = new T.PerspectiveCamera(35, cv.width / cv.height, 0.5, 1500);
      const setCam = () => {
        const o = globalThis.ssOrbit.current;
        const yaw = (o.yaw * Math.PI) / 180, pitch = (o.pitch * Math.PI) / 180;
        const f = new T.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
        const t = new T.Vector3(o.target[0], o.target[1], o.target[2]);
        cam.position.copy(t).addScaledVector(f, -o.d * Math.cos(pitch)).add(new T.Vector3(0, o.d * Math.sin(pitch), 0));
        cam.lookAt(t); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      };
      const boxOf = (x, z, half, h) => {
        const gy = w.groundY(x, z);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const sx of [-half, half]) for (const sz of [-half, half]) for (const sy of [0, h]) {
          const v = new T.Vector3(x + sx, gy + sy, z + sz).project(cam);
          const px = (v.x * 0.5 + 0.5) * cv.width, py = (1 - (v.y * 0.5 + 0.5)) * cv.height;
          x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
        }
        return [x0 - 6, y0 - 6, x1 + 6, y1 + 6];
      };
      const gap = (a, b) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]);
      // Only a goblin **nearer the camera than the hero** can read as a body *through* her: one
      // standing behind her is drawn behind her and reads as behind her, however much of her box it
      // shares (three goblins on a 1 m ring and a camera looking down one of the radials makes that
      // unavoidable at S3's 14 m / pitch 34 — measured: no frame in 3000 has all three clear). So the
      // frame criterion is: every goblin in **front** of her is clear of her box, and the 0.55 m floor
      // covers the rest.
      const overlaps = () => {
        setCam();
        const p = w.probe();
        const hp = globalThis.ssActive().root.position;
        const hb = boxOf(hp.x, hp.z, 0.26, 1.40);
        const hcam = cam.position.distanceTo(new T.Vector3(hp.x, hp.y, hp.z));
        const gs = p.goblins.filter((g) => g.vis).map((g) => ({
          i: g.i,
          front: cam.position.distanceTo(new T.Vector3(g.x, w.groundY(g.x, g.z), g.z)) < hcam,
          px_gap: +gap(hb, boxOf(g.x, g.z, 0.30, 0.95)).toFixed(1),
        }));
        const front = gs.filter((g) => g.front);
        return {
          hero_box_px: hb.map((v) => +v.toFixed(1)), goblins: gs,
          worst_px_gap: Math.min.apply(null, gs.map((g) => g.px_gap)),
          worst_front_px_gap: front.length ? Math.min.apply(null, front.map((g) => g.px_gap)) : null,
        };
      };

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
        await snap('meadow-golden-goblin-study' + suf);
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
        await snap('meadow-golden-goblin-study' + suf);
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
            const sc = overlaps();
            if (span >= 60 && (sc.worst_front_px_gap === null || sc.worst_front_px_gap > 0)) found = { t: f, states: gs.map((g) => g.state), d: gs.map((g) => +g.d.toFixed(2)), bearings: bs.map((b) => +b.toFixed(0)), span: +span.toFixed(1), screen: sc };
          }
        }
        out.fight_frame = found;
        out.s3_bodies = bodies();
        await snap('meadow-golden-s3' + suf);
        // ... then the club on the ground: the last frame of a `hit`, ring still flashing
        let hit = null;
        for (let f = 0; f < 3000 && !hit; f++) {
          step(1);
          const p = w.probe();
          const g = p.goblins.find((x) => x.state === 'hit' && x.st >= 0.11);
          const sc = g ? overlaps() : null;
          if (g && (sc.worst_front_px_gap === null || sc.worst_front_px_gap > 0)) hit = { i: g.i, st: +g.st.toFixed(4), clubLow: +g.clubLow.toFixed(4), ringAlpha: +globalThis.ssKids[0].ring.material.uniforms.uAlpha.value.toFixed(3), dustLive: p.dustLive, screen: sc };
        }
        out.hit_frame = hit;
        out.hit_bodies = bodies();
        await snap('meadow-golden-hit' + suf);
      }

      if (phase === 'totem') { step(120); await snap('meadow-golden-s4' + suf); }
      if (phase === 'wide') { step(120); await snap('meadow-golden-s1' + suf); }
      out.hud = w.hud();
      return out;
    },
    { phase, suf },
  );
};
