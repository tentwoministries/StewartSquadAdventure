// Probe: a close read of the *parked* Green Meanie in the three scenes that stand her on a strip
// (Bog, Desert, Frozen). The nine-frame sweep proves nothing regressed at each scene's own station,
// but none of those stations has the plane in frame — so this one finds her in the scene graph (by
// the pennant chain hanging off her rear outer strut), points the orbit at her from behind and to
// her left, and saves `<scene>-parked-04`: the open well, the mirrored cabane struts and the pennant
// hanging at wind 0, with `plane.update(t)` — the one-argument call — the only thing driving them.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?t=night&step=1" scripts/probes/plane-parked-04.cjs
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
  // behind and to her left: the camera offset 0.75 aft + 0.66 left is yaw = bearing + 41.4°
  o.current.target = [p.x, p.y + 1.3, p.z];
  o.current.yaw = (bearing + 41.4) % 360;
  o.current.pitch = 12; o.current.d = 10;
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
    const file = await h.snap(`${scene}-parked-04`);
    out.push({ scene, t, ...aim, file });
  }
  return { frames: out };
};
