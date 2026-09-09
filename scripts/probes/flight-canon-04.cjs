// Probe: the canon guards of the round-2 flight rule sheet (docs/qa/rules/reel-fixes-flight-04.md
// checks 9, 10 and 11), in all three seatings.
//   9  facing (T-26): every kid's local +z is the plane's nose direction, in every variant.
//   10 world-space UI and the flourish veto (Misc rows 1 and 4): no selection ring is visible on
//      the plane, no ring light burns, and `X` while seated says so instead of firing a whirl.
//   11 the curve's centre (T-27/T-41): the kids and the plane are not vertically separated — the
//      shared uniform is re-centred on the plane every frame, so its own bend is 0 at the plane.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-canon-04.cjs

const CHECK = () => {
  const T = globalThis.ssTHREE, f = globalThis.ssFlight;
  const nose = f.fwd.clone().normalize();
  const w = globalThis.ssRigProbe && globalThis.ssRigProbe.world ? globalThis.ssRigProbe.world() : null;
  return {
    variant: globalThis.ssSeatApi.variant(),
    kids: globalThis.ssKids.map((k) => {
      const fwd = new T.Vector3(0, 0, 1).applyQuaternion(k.root.getWorldQuaternion(new T.Quaternion()));
      const seat = f.toPlane(k.root.getWorldPosition(new T.Vector3()), new T.Vector3());
      return {
        name: k.name,
        facesNose: +fwd.dot(nose).toFixed(3),
        planeZ: +seat.z.toFixed(3),
        ring: k.ring.visible, ringLight: k.ringLight.intensity,
        prop: ['prop.R', 'prop.L'].map((n) => { const p = k.root.getObjectByName(n); return p ? p.visible : null; }),
      };
    }),
    curve: w,
    curveCentreToPlane: (() => {
      if (!w) return null;
      return +Math.hypot(w.center[0] - f.pos.x, w.center[1] - f.pos.z).toFixed(3);
    })(),
  };
};

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = [];
  for (let n = 0; n < 3; n++) {
    if (n > 0) { await h.key('n'); await h.evaluate(() => globalThis.ssStep(45)); }
    await h.evaluate(() => globalThis.ssStep(Math.max(1, Math.round((18 - globalThis.ssCut.at()) * 60))));
    const row = await h.evaluate(CHECK);
    await h.evaluate(() => { globalThis.document.getElementById('toast').textContent = ''; });
    await h.key('x');
    await h.evaluate(() => globalThis.ssStep(30));
    row.afterX = await h.evaluate(() => ({
      toast: globalThis.document.getElementById('toast').textContent,
      flourishOk: globalThis.ssWorld.flourishOk ? globalThis.ssWorld.flourishOk() : null,
      ribbons: globalThis.ssKids.map((k) => {
        let seen = 0;
        k.root.traverse((o) => { if (o.isMesh && o.material && o.material.type === 'MeshBasicMaterial' && o.visible) seen++; });
        return seen;
      }),
    }));
    out.push(row);
  }
  return { url: page.url(), states: out };
};
