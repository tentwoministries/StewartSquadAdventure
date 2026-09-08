// Probe: T-41's second half and T-36 — the whirl ribbon takes the world's bend at distance and
// still eases its radius in over ~0.3 s (rule sheet check 3). Walks Isabella away from the station's
// curve centre, fires the whirl, samples the ribbon's radius every frame through the ease, then
// freezes the clock mid-whirl and measures the ribbon's screen position by difference imaging
// against its own geometry projected two ways: unbent, and bent by uCurve · d² as the shader does.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S1&t=night&step=1" scripts/probes/shared-ribbon.cjs
const DIST = Number(process.env.SS_DIST || '26');
const NAME = process.env.SS_NAME || 'frozen-night-whirl';

module.exports = async (page, h) => {
  const out = { url: page.url() };
  await h.sleep(12000);
  await h.step(60);
  const w0 = await h.evaluate(() => globalThis.ssRigProbe.world());
  out.world = w0;
  const cx = w0.center[0], cz = w0.center[1], curve = w0.curve;

  // walk out, steering on the scene's own ground
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: 'Shift', bubbles: true })));
  await h.key('w');
  for (let i = 0; i < 60; i++) {
    const d = await h.evaluate((a, b) => { const r = globalThis.ssActive().root.position; return Math.hypot(r.x - a, r.z - b); }, cx, cz);
    if (d >= DIST) break;
    const bear = await h.evaluate(
      (a, b) => {
        const w = globalThis.ssWorld, wy = (w.waterY ?? -0.25) + 0.14;
        const r = globalThis.ssActive().root.position;
        let bb = 0, bs = -1e9;
        for (let ang = 0; ang < 360; ang += 15) {
          const vx = Math.sin((ang * Math.PI) / 180), vz = -Math.cos((ang * Math.PI) / 180);
          let ok = true;
          for (let s = 1; s <= 5; s++) { const x = r.x + vx * s, z = r.z + vz * s; if (w.groundY(x, z) <= wy || (w.walkable && !w.walkable(x, z))) { ok = false; break; } }
          if (!ok) continue;
          const sc = Math.hypot(r.x + vx * 5 - a, r.z + vz * 5 - b);
          if (sc > bs) { bs = sc; bb = ang; }
        }
        return bb;
      },
      cx, cz,
    );
    await h.evaluate((y) => { globalThis.ssOrbit.current.yaw = y; globalThis.ssOrbit.apply(); }, bear);
    await h.step(30);
  }
  for (const k of ['w', 'Shift']) await page.evaluate((s) => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: s, bubbles: true })), k);
  await h.step(150);
  out.distance_m = Number((await h.evaluate((a, b) => { const r = globalThis.ssActive().root.position; return Math.hypot(r.x - a, r.z - b); }, cx, cz)).toFixed(2));

  // the whirl: the ribbon's radius every 2 frames through the ease-in (T-36: ~0.3 s, over the 0.15 s floor)
  await h.key('x');
  out.radius_ease = [];
  out.strip = [];
  for (let i = 0; i < 18; i++) {
    await h.step(2);
    const r = await h.evaluate(() => {
      const rib = globalThis.ssActive().root.getObjectByName('isabella.whirlRibbon');
      return { r: Number(rib.scale.x.toFixed(3)), o: Number(rib.material.opacity.toFixed(3)), v: rib.parent.visible };
    });
    out.radius_ease.push({ t: Number((i * 2 / 60 + 0.033).toFixed(3)), ...r });
    if (i === 4 || i === 9 || i === 14) out.strip.push(await h.snap(`${NAME}-${out.strip.length}-03`));
  }

  // ... and where it is on screen, frozen mid-whirl, against its own geometry bent and unbent
  out.measure = await page.evaluate(
    (a, b, cv) => {
      const T = globalThis.ssTHREE, cam = globalThis.ssCtx.camera, W = 1600, H = 1000;
      const rib = globalThis.ssActive().root.getObjectByName('isabella.whirlRibbon');
      const proj = (v) => { const q = v.clone().project(cam); return { x: (q.x * 0.5 + 0.5) * W, y: (-q.y * 0.5 + 0.5) * H }; };
      const box = (withCurve) => {
        const g = rib.geometry.getAttribute('position'), v = new T.Vector3();
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (let i = 0; i < g.count; i++) {
          v.fromBufferAttribute(g, i).applyMatrix4(rib.matrixWorld);
          if (withCurve) { const d = Math.hypot(v.x - a, v.z - b); v.y -= cv * d * d; }
          const q = proj(v);
          x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
        }
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      };
      const flat = box(false), bent = box(true);
      const grab = () => {
        const c = globalThis.document.getElementById('c'), c2 = globalThis.document.createElement('canvas');
        c2.width = W; c2.height = H;
        const g = c2.getContext('2d'); g.drawImage(c, 0, 0);
        return g.getImageData(0, 0, W, H).data;
      };
      globalThis.ssKey('f'); // freeze: the only difference between the two grabs is the ribbon
      globalThis.ssStep(1);
      const A = grab();
      rib.visible = false;
      globalThis.ssStep(1);
      const B = grab();
      rib.visible = true;
      globalThis.ssStep(1);
      globalThis.ssKey('f');
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, n = 0;
      for (let i = 0; i < W * H; i++) {
        const o = i * 4;
        const dd = Math.abs(A[o] - B[o]) + Math.abs(A[o + 1] - B[o + 1]) + Math.abs(A[o + 2] - B[o + 2]);
        if (dd > 24) { const px = i % W, py = (i / W) | 0; n++; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
      }
      return {
        flat, bent, pixels: n, bbox: n ? { x0, x1, y0, y1 } : null,
        centre: n ? { x: (x0 + x1) / 2, y: (y0 + y1) / 2 } : null,
        colour_head: Array.from(rib.geometry.getAttribute('color').array.slice(0, 3)).map((v) => Number(v.toFixed(3))),
        blending_additive: rib.material.blending === T.AdditiveBlending,
        opacity: rib.material.opacity,
      };
    },
    cx, cz, curve,
  );
  if (out.measure.centre) {
    out.err_flat_px = Number(Math.hypot(out.measure.centre.x - out.measure.flat.x, out.measure.centre.y - out.measure.flat.y).toFixed(1));
    out.err_bent_px = Number(Math.hypot(out.measure.centre.x - out.measure.bent.x, out.measure.centre.y - out.measure.bent.y).toFixed(1));
  }
  return out;
};
