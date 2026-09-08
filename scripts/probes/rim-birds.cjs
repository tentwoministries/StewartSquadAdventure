// Probe: are the songbirds inside the frame at the station? Projects each bird through the live
// camera (ssCtx.camera) after 120 stepped frames and reports normalised device coordinates.
module.exports = async (page, h) => {
  await h.sleep(11000);
  await h.step(120);
  return h.evaluate(() => {
    const s = globalThis.ssWorld.probe();
    const cam = globalThis.ssCtx.camera;
    const V = globalThis.ssTHREE.Vector3;
    return {
      t: globalThis.ssStep(0),
      birds: s.birds.pos.map((p) => {
        const v = new V(p[0], p[1], p[2]).project(cam);
        return { world: p.map((n) => Number(n.toFixed(2))), ndc: [Number(v.x.toFixed(2)), Number(v.y.toFixed(2))], inFrame: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1 };
      }),
      airborne: s.birds.airborne,
      out: s.birds.out.map((n) => Number(n.toFixed(2))),
      birch: s.birch,
    };
  });
};
