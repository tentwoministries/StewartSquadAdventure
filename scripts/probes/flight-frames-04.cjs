// Probe: the eight CS-04 study frames of the reel-fixes round-2 flight brief (check 4). One browser,
// eight navigations, 12 s of wall clock after each `goto` (a save before the first rendered frame is
// a blank 58,885-byte PNG), `?t=golden` explicit on every one (T-29), names lowercase.
//   flight-golden-ch-{a,b,c}-04     the chase at 18.0 s, one per seating
//   flight-golden-seats-{a,b,c}-04  a study framing from the front-left quarter, 6 m, pitch 12
//   flight-golden-rollout-04        the roll-out from the rear left: the pennant hanging
//   flight-golden-pennant-04        the wing station at 18.0 s: the pennant trailing off the strut
// The three "seats" framings and the roll-out run on `?shot=LD`, the one station the scene does not
// ride, so the orbit really is the orbit; its target is put on the flying plane and `apply()` places
// the camera. On `?shot=CH` / `WG` the scene drives the camera and nothing here touches it.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-frames-04.cjs
const BASE = 'http://localhost:5173/sandbox/flight-golden/';

const SEEK = (t) => { globalThis.ssCut.seek(t - 0.25); globalThis.ssStep(15); };

/** Put the orbit on the flying plane: `at` is a plane-space look-at, `mix` the [ahead, left] blend. */
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
  // The study framings are per variant, and all of them sit *between the wings*: the top wing is at
  // 2.4 m and the camera's own eye at 6 m / pitch 12 (the brief's numbers) looks straight through it,
  // so the pitch comes down to 6-8° and the eye stands ahead of the leading edge instead.
  const KIDS = {
    a: { at: [-0.4, 1.30, 0], ahead: 0.94, left: 0.34, d: 6.0, pitch: 4 },   // the well, from the nose's left
    b: { at: [1.0, 1.05, 0], ahead: 0.55, left: 0.84, d: 8.0, pitch: 6 },    // the four on the wing, wider
    c: { at: [0.2, 1.15, 0], ahead: 0.70, left: 0.71, d: 7.0, pitch: 7 },    // both, so the split reads
  };
  const only = (process.env.SS_ONLY || '').split(',').filter(Boolean);
  const wanted = (n) => only.length === 0 || only.some((k) => n.includes(k));
  for (const v of ['a', 'b', 'c']) {
    const n = `flight-golden-ch-${v}-04`;
    if (wanted(n)) await shoot(n, `${BASE}?shot=CH&t=golden&step=1&seats=${v}`, 18.0, null);
  }
  for (const v of ['a', 'b', 'c']) {
    const n = `flight-golden-seats-${v}-04`;
    // on the final rather than in the circuit: at 18 s she is banked 30° and the top wing swings
    // straight across a close framing (the seat studies are about the kids, not the beat)
    if (wanted(n)) await shoot(n, `${BASE}?shot=LD&t=golden&step=1&seats=${v}`, 26.0, KIDS[v]);
  }
  if (wanted('rollout')) await shoot('flight-golden-rollout-04', `${BASE}?shot=LD&t=golden&step=1&seats=a`, 28.45, { at: [-1.0, 1.2, 0], ahead: -0.45, left: 0.9, d: 9, pitch: 14 });
  // the wing station's eye is *above* the top wing, which hides a flag hung at 2.0 m on the same
  // side, so the pennant frame is its own orbit framing: beside the strut and under the top wing
  if (wanted('pennant')) await shoot('flight-golden-pennant-04', `${BASE}?shot=LD&t=golden&step=1&seats=a`, 26.0, { at: [-0.45, 1.70, -2.4], ahead: 0.20, left: 0.98, d: 4.5, pitch: 2 });
  return { frames: out };
};
