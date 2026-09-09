// Probe: the four flight frames of the fix pass (docs/qa/briefs/reel-fixes-04-fixes.md C6, and C4's
// pennant frame at the station the brief names). One browser, four navigations, 12 s of wall clock
// after each `goto` (a save before the first rendered frame is a blank 58,885-byte PNG), `?t=golden`
// explicit on every one (T-29), names lowercase.
//   flight-golden-ch-a-04b       the chase at 18.0 s, variant A: the four-read
//   flight-golden-seats-a-04b    a front-left quarter study: the flush well, nothing under the belly
//   flight-golden-rollout-04b    the roll-out from the rear left: the pennant hanging
//   flight-golden-pennant-04b    **WG at 18.0 s** (C4): the pennant trailing aft off the strut
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-frames-04b.cjs
const BASE = 'http://localhost:5173/sandbox/flight-golden/';

const SEEK = (t) => { globalThis.ssCut.seek(t - 0.25); globalThis.ssStep(15); };

/** Put the orbit on the flying plane: `at` is a plane-space look-at, `ahead`/`left` the blend. */
const FRAME = ({ at, ahead, left, d, pitch }) => {
  const T = globalThis.ssTHREE, f = globalThis.ssFlight, o = globalThis.ssOrbit;
  f.group.updateMatrixWorld(true);
  const target = f.fromPlane(at[0], at[1], at[2], new T.Vector3());
  const fwd = f.fwd.clone().setY(0).normalize();
  const lt = new T.Vector3(0, 1, 0).cross(fwd).normalize();     // up × forward is the plane's left
  const off = fwd.clone().multiplyScalar(ahead).add(lt.clone().multiplyScalar(left)).normalize();
  o.current.target = [target.x, target.y, target.z];
  o.current.yaw = ((Math.atan2(-off.x, off.z) * 180) / Math.PI + 360) % 360;
  o.current.pitch = pitch; o.current.d = d;
  o.apply();
  return { yaw: +o.current.yaw.toFixed(1), pitch, d, target: [+target.x.toFixed(2), +target.y.toFixed(2), +target.z.toFixed(2)] };
};

module.exports = async (page, h) => {
  const out = [];
  const shoot = async (name, url, ct, framing) => {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld, { timeout: 60000 });
    await h.sleep(12000);
    await h.evaluate(SEEK, ct);
    const row = { name, url, ct: await h.evaluate(() => +globalThis.ssCut.at().toFixed(3)) };
    row.seats = await h.evaluate(() => globalThis.ssSeatApi.variant());
    row.speed = await h.evaluate(() => +globalThis.ssFlight.speed.toFixed(2));
    if (framing) row.framing = await h.evaluate(FRAME, framing);
    row.file = await h.snap(name);
    row.hud = (await h.hud())[0];
    out.push(row);
    return row;
  };
  const only = (process.env.SS_ONLY || '').split(',').filter(Boolean);
  const want = (n) => only.length === 0 || only.some((k) => n.includes(k));
  if (want('ch-a')) await shoot('flight-golden-ch-a-04b', `${BASE}?shot=CH&t=golden&step=1&seats=a`, 18.0, null);
  // the study framing sits *between* the wings (the top wing is at 2.4 m), so the eye is low and
  // ahead of the leading edge rather than the brief's 6 m / pitch 12
  if (want('seats-a')) await shoot('flight-golden-seats-a-04b', `${BASE}?shot=LD&t=golden&step=1&seats=a`, 26.0, { at: [-0.75, 1.45, 0], ahead: -0.50, left: 0.87, d: 6.5, pitch: 5 });
  if (want('rollout')) await shoot('flight-golden-rollout-04b', `${BASE}?shot=LD&t=golden&step=1&seats=a`, 28.45, { at: [-1.0, 1.2, 0], ahead: -0.45, left: 0.9, d: 9, pitch: 14 });
  // C4: the brief's own station and time — the wing station at 18 s, the pennant trailing at wind 1
  if (want('pennant')) await shoot('flight-golden-pennant-04b', `${BASE}?shot=WG&t=golden&step=1&seats=a`, 18.0, null);
  // and the same beat from beside the strut and *under* the top wing: the WG eye is 3.4 m up in
  // plane space and the upper wing at 2.005 m hides a flag hung at 2.0 m on the same side, so the
  // station's own frame proves the flag is there and this one is the one you can read it in
  if (want('pennant')) await shoot('flight-golden-pennant-04b', `${BASE}?shot=LD&t=golden&step=1&seats=a`, 18.0, { at: [-0.55, 1.95, -2.4], ahead: -0.25, left: 0.97, d: 3.5, pitch: 1 });
  return { frames: out };
};
