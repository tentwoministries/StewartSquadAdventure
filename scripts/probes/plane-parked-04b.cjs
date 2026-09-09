// Probe: the *side* read of the parked Green Meanie in the three scenes that stand her on a strip
// (Bog, Desert, Frozen) — fix C6: "the flush well from the side: no step, no trough". The `-04`
// frames were shot from behind and to her left at yaw = bearing + 41.4°, which is where the old
// well's 0.90 m box and its soot belly read worst; this one stands square off her left wingtip
// (yaw = bearing + 90°, pitch 6°) so the fuselage's outline is the whole subject.
// The plane is found in the scene graph by the pennant chain hanging off her rear outer strut, and
// `plane.update(t)` — the one-argument parked call — is the only thing driving her.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?t=night&step=1" scripts/probes/plane-parked-04b.cjs
const BASE = 'http://localhost:5173/sandbox/';
const SCENES = [['bog-night', 'night', 270], ['desert-noon', 'noon', 280], ['frozen-night', 'night', 270]];

const AIM = (bearing) => {
  const T = globalThis.ssTHREE, o = globalThis.ssOrbit;
  const scene = globalThis.ssCtx.camera.parent;
  let root = null;
  scene.traverse((n) => {
    if (!root && n.type === 'Group' && Math.abs(n.position.x - 0.1) < 1e-6 && Math.abs(n.position.y - 2.0) < 1e-6 && Math.abs(n.position.z + 2.4) < 1e-6) root = n;
  });
  if (!root) return { found: false };
  const plane = root.parent;
  const p = plane.getWorldPosition(new T.Vector3());
  // square off her left side: the offset (0 aft, 1 left) is yaw = bearing + 90°
  o.current.target = [p.x, p.y + 1.1, p.z];
  o.current.yaw = (bearing + 90) % 360;
  o.current.pitch = 6; o.current.d = 9;
  o.apply();
  return { found: true, plane: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], yaw: +o.current.yaw.toFixed(1), rotY: +((plane.rotation.y * 180) / Math.PI).toFixed(1) };
};

module.exports = async (page, h) => {
  const out = [];
  for (const [scene, t, bearing] of SCENES) {
    await page.goto(`${BASE}${scene}/?t=${t}&step=1`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld, { timeout: 60000 });
    await h.sleep(12000);
    await h.step(120);
    const aim = await h.evaluate(AIM, bearing);
    const file = await h.snap(`${scene}-parked-04b`);
    out.push({ scene, t, ...aim, file });
  }
  return { frames: out };
};
