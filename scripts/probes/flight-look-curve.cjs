// Probe: T-27's guard on the look (rule sheet check 5). A 60° look moves the camera without
// changing what it follows, so the curved world's centre must still be the plane, not the new
// camera pose — a `uCurveCenter` set once sank the plane and all four kids out of the chase frame.
// Reads the live uniform out of the module the scene imported (Vite serves one instance per URL).
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-look-curve.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const read = () => h.evaluate(async () => {
    const m = await import('/sandbox/_shared/material.ts');
    const f = globalThis.ssFlight, c = globalThis.ssCtx.camera, u = m.WORLD_U.uCurveCenter.value;
    const r = (v) => +v.toFixed(4);
    return {
      ct: +globalThis.ssCut.at().toFixed(3),
      curveCenter: [r(u.x), r(u.y)],
      plane: [r(f.pos.x), r(f.pos.z)],
      camera: [r(c.position.x), r(c.position.z)],
      look: { yaw: +globalThis.ssLook.yaw.toFixed(2), pitch: +globalThis.ssLook.pitch.toFixed(2) },
      curve: m.WORLD_U.uCurve.value,
    };
  });
  await h.evaluate(() => globalThis.ssStep(360));
  const noDrag = await read();
  await h.evaluate(() => { const o = globalThis.ssOrbit; o.current.yaw = (o.current.yaw + 60) % 360; o.current.pitch = 40; o.apply(); globalThis.ssStep(1); });
  const dragged = await read();
  return { url: page.url(), noDrag, dragged };
};
