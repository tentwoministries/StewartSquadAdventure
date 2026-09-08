// Probe: T-48's look-around on CS-04, every state stepped (docs/qa/briefs/reel-fixes-flight-03.md
// checks 2-4; LESSONS.md §0 rule 8 — a mechanic is not built until a stepped probe has shown every
// state). Drives the *orbit's own* `current` (the same numbers the mouse writes) and measures the
// camera geometrically, from the plane, so nothing here trusts the scene's own report of itself.
// (`flight-look.cjs` is the older probe for the kids' `look`/`poi` hooks — a different check.)
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-t48-look.cjs
const MEAS = () => {
  const T = globalThis.ssTHREE, f = globalThis.ssFlight, c = globalThis.ssCtx.camera, p = f.plane;
  const piv = p.localToWorld(new T.Vector3(2, 1.1, 0));      // what the CH chase looks at
  const base = p.localToWorld(new T.Vector3(-13, 3.4, 0));   // where the CH chase sits with no look
  const arm = (v) => {
    const a = v.clone().sub(piv), r = a.length();
    return { yaw: (Math.atan2(-a.x, a.z) * 180) / Math.PI, el: (Math.asin(a.y / r) * 180) / Math.PI, r };
  };
  const b = arm(base), n = arm(c.position);
  const wrap = (d) => ((d + 540) % 360) - 180;
  const r6 = (v) => +v.toFixed(3);
  return {
    ct: +globalThis.ssCut.at().toFixed(4),
    dYaw: r6(wrap(n.yaw - b.yaw)),        // the camera's world yaw about the plane vs the chase frame
    dEl: r6(n.el - b.el),                 // the same for elevation
    dR: +(n.r - b.r).toFixed(4),          // the arm's length: a look must not dolly
    look: { yaw: r6(globalThis.ssLook.yaw), pitch: r6(globalThis.ssLook.pitch) },
    orbit: { yaw: globalThis.ssOrbit.current.yaw, pitch: globalThis.ssOrbit.current.pitch, d: globalThis.ssOrbit.current.d },
  };
};

module.exports = async (page, h) => {
  await h.sleep(12000);
  const meas = (label) => h.evaluate(MEAS).then((m) => ({ label, ...m }));
  const log = [];

  // ---- 1. the ride, one frame short of 6.0 s: nothing dragged, no offset ------------------------
  await h.evaluate(() => globalThis.ssStep(359));
  log.push(await meas('5.983 s, no drag'));

  // ---- 2. the drag: +60° of yaw into the orbit's `current`, exactly what the mouse writes -------
  await h.evaluate(() => { const o = globalThis.ssOrbit; o.current.yaw = (o.current.yaw + 60) % 360; o.apply(); });
  const lookFile = await h.snap('flight-golden-look-03');  // renders the frame at ct 6.0 with the offset
  log.push(await meas('6.0 s, +60 yaw applied'));

  // ---- 3. the 2 s hold, then the eased return (smoothstep, sampled inside the ease) -------------
  for (const [n, label] of [[60, '+1.0 s (hold)'], [60, '+2.0 s (hold ends)'], [30, '+2.5 s (ease)'], [30, '+3.0 s (ease)'], [30, '+3.5 s (ease)'], [30, '+4.0 s (home)'], [30, '+4.5 s (home)']]) {
    await h.evaluate((k) => globalThis.ssStep(k), n);
    log.push(await meas(label));
  }

  // ---- 4. the returned ride: the frame at scene second 11.0, to md5 against the no-drag run -----
  await h.evaluate(() => globalThis.ssStep(Math.max(0, 660 - Math.round(globalThis.ssCut.at() * 60) - 1)));
  const returnFile = await h.snap('flight-golden-return-03');
  log.push(await meas('11.0 s, returned'));

  // ---- 5. the pitch clamp: `_shared/orbit.ts` line 25 clamps its pitch to 18-75 ------------------
  const clamp = [];
  for (const p of [80, 200, 75, 0]) {
    await h.evaluate((v) => { globalThis.ssOrbit.current.pitch = v; globalThis.ssOrbit.apply(); globalThis.ssStep(1); }, p);
    clamp.push({ set: p, ...(await meas(`current.pitch = ${p}`)) });
  }

  // ---- 6. R: the orbit's own reset puts `current` on the station, the look clears in one frame --
  await h.evaluate(() => { const o = globalThis.ssOrbit; o.current.yaw = (o.current.yaw + 60) % 360; o.current.pitch = 40; o.apply(); globalThis.ssStep(1); });
  const beforeR = await meas('a 60° yaw / 22° pitch offset');
  await h.key('r');
  await h.evaluate(() => globalThis.ssStep(1));
  const afterR = await meas('after ssKey(r)');

  // ---- 7. the scene's own keys still register while a look is live (no handler was added) -------
  await h.evaluate(() => { const o = globalThis.ssOrbit; o.current.yaw = (o.current.yaw + 60) % 360; o.apply(); globalThis.ssStep(1); });
  const beforeG = await h.evaluate(() => ({ ct: +globalThis.ssCut.at().toFixed(3), look: +globalThis.ssLook.yaw.toFixed(3) }));
  await h.key('g');
  await h.evaluate(() => globalThis.ssStep(1));
  const afterG = await h.evaluate(() => ({ ct: +globalThis.ssCut.at().toFixed(3), look: +globalThis.ssLook.yaw.toFixed(3), hud: globalThis.ssWorld.hud() }));

  return { url: page.url(), lookFile, returnFile, log, clamp, reset: { beforeR, afterR }, skipKey: { beforeG, afterG } };
};
