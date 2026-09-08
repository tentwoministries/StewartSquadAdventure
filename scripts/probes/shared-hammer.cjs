// Probe: T-45, Isabella's hammer on the ground instead of under it (brief `reel-fixes-shared-03.md`
// check 3). Three stepped phases — 60 frames idle, 120 walking (`w`), 120 running (`w` + shift) —
// sampling every frame the lowest world vertex of the hammer's head against the ground under her,
// the right hand's distance from the shaft's axis, and the eased run weight, plus the crossing from
// the walk carry to the shoulder carry frame by frame (Tier-0 rule 3: nothing pops).
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S1&t=night&step=1" scripts/probes/shared-hammer.cjs
const NAME = process.env.SS_NAME || 'frozen-night-hammer';

const stat = (a) => ({ min: Number(Math.min(...a).toFixed(4)), max: Number(Math.max(...a).toFixed(4)), last: Number(a[a.length - 1].toFixed(4)) });

module.exports = async (page, h) => {
  const out = { url: page.url() };
  await h.sleep(12000);
  // the measurement only means anything on the *walked* kid: Tab round until Isabella has the keys
  for (let i = 0; i < 8 && (await h.evaluate(() => globalThis.ssActive().name)) !== 'Isabella'; i++) await h.key('Tab');
  out.active = await h.evaluate(() => globalThis.ssActive().name);
  // SS_SPAWN="x,z" moves her to clear ground first, so the run phase is 2 s of running and not 2 s
  // of leaning on a wall (the caves' landing is 38 x 18 m and the kids spawn near its edge)
  if (process.env.SS_SPAWN) {
    const [sx, sz] = process.env.SS_SPAWN.split(',').map(Number);
    out.spawn = await h.evaluate((x, z) => {
      const k = globalThis.ssActive();
      k.root.position.set(x, globalThis.ssWorld.groundY(x, z), z);
      return [x, Number(globalThis.ssWorld.groundY(x, z).toFixed(3)), z];
    }, sx, sz);
  }
  await h.step(60);

  const sample = () =>
    h.evaluate(() => {
      const s = globalThis.ssRigProbe['isabella.hammer']();
      const r = globalThis.ssRigProbe['isabella.rig']();
      const w = globalThis.ssWorld;
      const hc = s.headCentre;
      return {
        // the ground under the head itself, and under her feet (a slope puts them apart)
        aboveHeadGround: s.headLowY - w.groundY(hc[0], hc[2]),
        aboveFootGround: s.headLowY - r.root[1],
        headLowY: s.headLowY, rDist: s.rHandDist, lDist: s.lHandDist,
        runU: s.runU, speed: r.speed, blend: r.blend, root: r.root,
      };
    });

  const phase = async (frames) => {
    const rows = [];
    for (let i = 0; i < frames; i++) { await h.step(1); rows.push(await sample()); }
    return rows;
  };
  const report = (rows) => ({
    frames: rows.length,
    headLowestAboveGroundUnderHead_m: stat(rows.map((r) => r.aboveHeadGround)),
    headLowestAboveGroundUnderHer_m: stat(rows.map((r) => r.aboveFootGround)),
    rightHandToAxis_m: stat(rows.map((r) => r.rDist)),
    leftHandToAxis_m: stat(rows.map((r) => r.lDist)),
    speed_ms: stat(rows.map((r) => r.speed)),
    runU: stat(rows.map((r) => r.runU)),
    root_first: rows[0].root.map((v) => Number(v.toFixed(2))),
    root_last: rows[rows.length - 1].root.map((v) => Number(v.toFixed(2))),
  });

  out.idle = report(await phase(60));
  out.frame_idle = await h.snap(`${NAME}-idle-03`);

  await h.key('w');
  const walk = await phase(120);
  out.walk = report(walk);
  out.frame_walk = await h.snap(`${NAME}-walk-03`);

  await h.key('Shift');
  const run = await phase(120);
  out.run = report(run);
  out.frame_run = await h.snap(`${NAME}-run-03`);
  // the walk → run crossing eases: the biggest single-frame step in the head's height
  const cross = run.slice(0, 60).map((r) => r.aboveFootGround);
  let biggest = 0;
  for (let i = 1; i < cross.length; i++) biggest = Math.max(biggest, Math.abs(cross[i] - cross[i - 1]));
  out.crossing = {
    frames_sampled: cross.length,
    biggest_single_frame_step_m: Number(biggest.toFixed(4)),
    head_height_every_10_frames: cross.filter((_, i) => i % 10 === 0).map((v) => Number(v.toFixed(3))),
  };
  // steady state at the top of the run, then back to the walk carry (the ease is symmetric)
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 'Shift', bubbles: true })));
  const back = await phase(90);
  out.back_to_walk = report(back);
  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 'w', bubbles: true })));
  const stop = await phase(150);
  out.back_to_idle = report(stop);
  out.frame_idle_again = await h.snap(`${NAME}-idle-again-03`);
  return out;
};
