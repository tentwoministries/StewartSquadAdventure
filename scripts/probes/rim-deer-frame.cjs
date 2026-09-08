// Probe: is the deer inside the station's frame, and what is under its feet?
module.exports = async (page, h) => {
  await h.sleep(11000);
  await h.step(120);
  return h.evaluate(() => {
    const p = globalThis.ssWorld.probe();
    const cam = globalThis.ssCtx.camera;
    const v = new globalThis.ssTHREE.Vector3(p.deer.x, p.deer.y + 0.9, p.deer.z).project(cam);
    return {
      deer: { x: Number(p.deer.x.toFixed(2)), z: Number(p.deer.z.toFixed(2)), ground: Number(p.deer.ground.toFixed(3)), inside: p.deer.inside },
      ndc: [Number(v.x.toFixed(2)), Number(v.y.toFixed(2))],
      inFrame: Math.abs(v.x) < 1 && Math.abs(v.y) < 1,
      distToPondCentre: Number(Math.hypot(p.deer.x + 40, p.deer.z + 30).toFixed(2)),
      bobberNdc: (() => { const b = new globalThis.ssTHREE.Vector3(-40, -0.3, -30).project(cam); return [Number(b.x.toFixed(2)), Number(b.y.toFixed(2))]; })(),
    };
  });
};
