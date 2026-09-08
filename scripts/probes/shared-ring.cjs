// Probe: T-41, the selection ring and the curved world (brief `reel-fixes-shared-03.md` check 1).
// Walks the active kid away from the station's curve centre, stops, then measures the ring's screen
// centre by *difference imaging* (one frame with the ring mesh visible, one with it hidden: the
// pixels that changed are the ring and its bloom) and compares it with two projections of the kid's
// root: the plain one and the one bent by `uCurve · d²`. Before the fix the ring matches the plain
// projection; after, the bent one.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?shot=S1&t=night&step=1" scripts/probes/shared-ring.cjs
// Env: SS_NAME (frame name), SS_DIST (metres from the curve centre), SS_CX/SS_CZ (the centre when
// the page has no ssProbe yet — the pre-fix baseline), SS_KEYS (the keys to try, in order).
const NAME = process.env.SS_NAME || 'bog-night-ring-far-03';
const DIST = Number(process.env.SS_DIST || '30');
const KEYS = (process.env.SS_KEYS || 'w,d,s,a').split(',');

module.exports = async (page, h) => {
  const out = { url: page.url(), name: NAME, target_m: DIST };
  await h.sleep(12000);
  await h.step(60);

  const centre = await h.evaluate(
    (cx, cz) => {
      const p = globalThis.ssRigProbe && globalThis.ssRigProbe.world ? globalThis.ssRigProbe.world() : null;
      return p ? { cx: p.center[0], cz: p.center[1], curve: p.curve, from: 'ssProbe' } : { cx, cz, curve: 0.0006, from: 'env' };
    },
    Number(process.env.SS_CX || '-30'),
    Number(process.env.SS_CZ || '6'),
  );
  out.centre = centre;
  const dist = () =>
    h.evaluate(
      (cx, cz) => {
        const r = globalThis.ssActive().root.position;
        return { d: Math.hypot(r.x - cx, r.z - cz), x: r.x, y: r.y, z: r.z };
      },
      centre.cx,
      centre.cz,
    );

  out.start = await dist();
  out.legs = [];
  // Steer by the camera (the keys are camera-relative): every half second point the camera down the
  // outward bearing from the curve centre and hold `w`; when the ground blocks (the bog is mostly
  // water) fan the bearing out until something moves. The saved frame is a diagnostic of the ring,
  // not the station's composition, so orbiting is fair here.
  await h.key('Shift'); // one tap = the plain run, never the sprint lock
  await h.key(KEYS[0]);
  for (let i = 0; i < 80; i++) {
    const p = await dist();
    out.legs.push(Number(p.d.toFixed(2)));
    if (p.d >= DIST) break;
    // steer with the scene's own ground: sample 24 bearings, keep the walkable ones (the bog is
    // mostly water, the caves have a void), take the one that gains the most distance
    const bear = await h.evaluate(
      (cx, cz) => {
        const w = globalThis.ssWorld;
        const wy = (w.waterY ?? -0.25) + 0.14;
        const r = globalThis.ssActive().root.position;
        let bb = null, bs = -1e9;
        for (let a = 0; a < 360; a += 15) {
          const vx = Math.sin((a * Math.PI) / 180), vz = -Math.cos((a * Math.PI) / 180);
          let ok = true;
          for (let s = 1; s <= 5; s++) {
            const x = r.x + vx * s, z = r.z + vz * s;
            if (w.groundY(x, z) <= wy || (w.walkable && !w.walkable(x, z))) { ok = false; break; }
          }
          if (!ok) continue;
          const sc = Math.hypot(r.x + vx * 5 - cx, r.z + vz * 5 - cz);
          if (sc > bs) { bs = sc; bb = a; }
        }
        return bb;
      },
      centre.cx,
      centre.cz,
    );
    if (bear === null) break;
    await h.evaluate((y) => { globalThis.ssOrbit.current.yaw = ((y % 360) + 360) % 360; globalThis.ssOrbit.apply(); }, bear);
    await h.step(30);
  }
  await page.evaluate((kk) => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: kk, bubbles: true })), KEYS[0]);
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 'Shift', bubbles: true })));
  await h.step(120);
  out.walked = await dist();
  // The bog's land runs out before 30 m from the jetty's curve centre: when walking cannot reach the
  // distance the check asks for, stand her on the farthest walkable ground instead and say so.
  if (out.walked.d < DIST) {
    out.placed = await h.evaluate(
      (cx, cz, want) => {
        const w = globalThis.ssWorld;
        const wy = (w.waterY ?? -0.25) + 0.14;
        const r = globalThis.ssActive().root.position;
        let bx = r.x, bz = r.z, bd = Math.hypot(r.x - cx, r.z - cz);
        for (let a = 0; a < 360; a += 4) {
          for (let s = want; s <= want + 14; s += 0.5) {
            const x = cx + Math.sin((a * Math.PI) / 180) * s, z = cz - Math.cos((a * Math.PI) / 180) * s;
            if (w.groundY(x, z) <= wy || (w.walkable && !w.walkable(x, z))) continue;
            if (bd < want || s < bd) { bd = s; bx = x; bz = z; } // the nearest walkable ground at the asked distance
            break;
          }
        }
        globalThis.ssActive().root.position.set(bx, w.groundY(bx, bz), bz);
        return { x: bx, z: bz, d: bd, note: 'placed: walking could not reach the distance' };
      },
      centre.cx,
      centre.cz,
      DIST,
    );
    await h.step(60);
  }
  out.end = await dist();

  out.file = await h.snap(NAME);
  const m = await page.evaluate(
    (cx, cz, curve) => {
      const T = globalThis.ssTHREE;
      const cam = globalThis.ssCtx.camera;
      const kid = globalThis.ssActive();
      const W = 1600, H = 1000;
      const proj = (v) => { const q = v.clone().project(cam); return { x: (q.x * 0.5 + 0.5) * W, y: (-q.y * 0.5 + 0.5) * H }; };
      const r = kid.root.position;
      const p = new T.Vector3(r.x, r.y + 0.02, r.z);
      const d = Math.hypot(p.x - cx, p.z - cz);
      const flat = proj(p);
      const bent = proj(new T.Vector3(p.x, p.y - curve * d * d, p.z));
      // the ring is a 1.5 m disc, so at 40 m its far edge bends 4 cm more than its near edge: the
      // fair expectation for a *bounding box* centre is the ring's own vertices projected, bent and
      // unbent, not one point
      const ringBox = (withCurve) => {
        const g = kid.ring.geometry.getAttribute('position');
        const v = new T.Vector3();
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (let i = 0; i < g.count; i++) {
          v.fromBufferAttribute(g, i).applyMatrix4(kid.ring.matrixWorld);
          if (withCurve) { const dd = Math.hypot(v.x - cx, v.z - cz); v.y -= curve * dd * dd; }
          const q = proj(v);
          x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
        }
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      };
      const geoFlat = ringBox(false), geoBent = ringBox(true);
      const grab = () => {
        const c = globalThis.document.getElementById('c');
        const c2 = globalThis.document.createElement('canvas'); c2.width = W; c2.height = H;
        const g = c2.getContext('2d'); g.drawImage(c, 0, 0);
        return g.getImageData(0, 0, W, H).data;
      };
      // freeze the scene clock (scene.ts's F) so the only difference between the two grabs is the
      // ring: with the clock running, the wisps, the water and the fog move and the diff is noise
      globalThis.ssKey('f');
      globalThis.ssStep(1);
      const a = grab();
      const was = kid.ring.visible;
      kid.ring.visible = false;
      globalThis.ssStep(1);
      const b = grab();
      kid.ring.visible = was;
      globalThis.ssStep(1);
      globalThis.ssKey('f');
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, n = 0, sx = 0, sy = 0, sw = 0;
      const pts = [];
      for (let i = 0; i < W * H; i++) {
        const o = i * 4;
        const dd = Math.abs(a[o] - b[o]) + Math.abs(a[o + 1] - b[o + 1]) + Math.abs(a[o + 2] - b[o + 2]);
        if (dd > 24) {
          const px = i % W, py = (i / W) | 0;
          n++; sx += px * dd; sy += py * dd; sw += dd;
          pts.push([px, py, dd]);
          if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
        }
      }
      // The kid's own legs cover the middle of the ring at a low pitch, which pulls a bounding box's
      // centre up. An ellipse's leftmost and rightmost points sit at its centre height and are the
      // part of the ring a body never covers, so read the centre from the two sides instead.
      let sides = null;
      if (n) {
        const band = Math.max(3, (x1 - x0) * 0.08);
        const side = (lo, hi) => {
          let s = 0, w2 = 0;
          for (const [px, py, dd] of pts) if (px >= lo && px <= hi) { s += py * dd; w2 += dd; }
          return w2 ? s / w2 : null;
        };
        const l = side(x0, x0 + band), r = side(x1 - band, x1);
        if (l !== null && r !== null) sides = { x: (x0 + x1) / 2, y: (l + r) / 2, left_y: l, right_y: r };
      }
      return {
        d: Number(d.toFixed(2)), curve, flat, bent, geoFlat, geoBent, pixels: n,
        bbox: n ? { x0, x1, y0, y1 } : null,
        ringCentre: n ? { x: (x0 + x1) / 2, y: (y0 + y1) / 2 } : null,
        ringSides: sides,
        ringWeighted: n ? { x: sx / sw, y: sy / sw } : null,
        ringScale: kid.ring.scale.x,
        additive: kid.ring.material.blending === T.AdditiveBlending,
        depthWrite: kid.ring.material.depthWrite,
        ringLight: { intensity: kid.ringLight.intensity, visible: kid.ringLight.visible },
        ringY: kid.ring.position.y,
      };
    },
    centre.cx,
    centre.cz,
    centre.curve,
  );
  out.measure = m;
  if (m.ringCentre) {
    out.err_flat_px = Number(Math.hypot(m.ringCentre.x - m.flat.x, m.ringCentre.y - m.flat.y).toFixed(1));
    out.err_bent_px = Number(Math.hypot(m.ringCentre.x - m.bent.x, m.ringCentre.y - m.bent.y).toFixed(1));
    out.err_flat_py = Number((m.ringCentre.y - m.flat.y).toFixed(1));
    out.err_bent_py = Number((m.ringCentre.y - m.bent.y).toFixed(1));
    out.err_geoflat_px = Number(Math.hypot(m.ringCentre.x - m.geoFlat.x, m.ringCentre.y - m.geoFlat.y).toFixed(1));
    out.err_geobent_px = Number(Math.hypot(m.ringCentre.x - m.geoBent.x, m.ringCentre.y - m.geoBent.y).toFixed(1));
  }
  if (m.ringSides) {
    out.sides_err_flat_px = Number(Math.hypot(m.ringSides.x - m.flat.x, m.ringSides.y - m.flat.y).toFixed(1));
    out.sides_err_bent_px = Number(Math.hypot(m.ringSides.x - m.bent.x, m.ringSides.y - m.bent.y).toFixed(1));
  }
  // the breathe (§2.7.5: ±6 % at 1.2 s) survives the bend: two samples 0.6 s apart
  const s0 = await h.evaluate(() => globalThis.ssActive().ring.scale.x);
  await h.step(36);
  const s1 = await h.evaluate(() => globalThis.ssActive().ring.scale.x);
  out.breathe = { s0: Number(s0.toFixed(4)), s1: Number(s1.toFixed(4)), delta: Number(Math.abs(s1 - s0).toFixed(4)) };
  return out;
};
