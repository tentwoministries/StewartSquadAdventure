// Probe: Isabella's whirl ribbon eases in and sweeps instead of popping to full radius on the first
// frame (opus-fixes-meadow check 2; the Tier-0 ease rule, heroes.md §2.5.4's 1.9 m ring).
// Presses X on the active kid, records the ribbon's radius and its swept angle every frame for
// 0.6 s, and saves the two frames the brief names at +0.1 s and +0.4 s.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S3&t=golden&step=1" scripts/probes/meadow-ribbon.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const read = () =>
    h.evaluate(() => {
      const rib = globalThis.ssKids[0].root.getObjectByName('isabella.whirlRibbon');
      const tilt = rib.parent;
      return { r: rib.scale.x, ry: rib.rotation.y, opacity: rib.material.opacity, visible: tilt.visible, tilt: tilt.rotation.z };
    });
  const out = { url: page.url(), active: await h.evaluate(() => globalThis.ssActive().name), samples: [] };
  out.before_x = await read();
  await h.key('x');
  // frame-by-frame for 0.6 s: the ease must span >= 0.15 s (Tier-0 rule 3)
  out.samples = await h.evaluate(() => {
    const rib = globalThis.ssKids[0].root.getObjectByName('isabella.whirlRibbon');
    const rows = [];
    for (let f = 1; f <= 36; f++) {
      globalThis.ssStep(1);
      rows.push({ f, s: Number((f / 60).toFixed(4)), r: Number(rib.scale.x.toFixed(4)), deg: Number(((-rib.rotation.y * 180) / Math.PI).toFixed(1)), a: Number(rib.material.opacity.toFixed(3)), vis: rib.parent.visible });
    }
    return rows;
  });
  out.frames_to_reach_90pct = out.samples.findIndex((s) => s.r >= 0.9 * 1.9) + 1;
  out.ease_seconds_to_90pct = out.frames_to_reach_90pct / 60;
  return out;
};
