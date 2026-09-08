// Probe: T-42, Collette's staff solved into her hands (brief `reel-fixes-shared-03.md` check 2).
// 60 stepped frames at idle, then 60 with `w` held, sampling every frame: the distance from each
// hand's world centre to the shaft's axis, the shaft's foot against the ground under it, and both
// shoulders' swing. Then the flourish, with a three-frame filmstrip of the twirl and the orb's
// position at each, so the baton twirl is measured and not eyeballed.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?shot=S1&t=night&step=1" scripts/probes/shared-staff.cjs
const NAME = process.env.SS_NAME || 'bog-night-staff';

const stat = (a) => ({ min: Number(Math.min(...a).toFixed(4)), max: Number(Math.max(...a).toFixed(4)), last: Number(a[a.length - 1].toFixed(4)) });

module.exports = async (page, h) => {
  const out = { url: page.url() };
  await h.sleep(12000);
  await h.step(60);

  const sample = () =>
    h.evaluate(() => {
      const s = globalThis.ssRigProbe['collette.staff']();
      const w = globalThis.ssWorld;
      const r = globalThis.ssRigProbe['collette.rig']();
      const T = globalThis.ssTHREE;
      const kid = globalThis.ssActive();
      // the surface she is standing on is her own root's y (the Bog's causeway boards stand well
      // above the water bed groundY reports 0.3 m to either side of them)
      const foot = new T.Vector3(...s.foot);
      const local = (p) => kid.root.worldToLocal(new T.Vector3(...p));
      const rl = local(s.rHand), ll = local(s.lHand);
      return {
        r: s.rHandDist, l: s.lHandDist, footY: foot.y, root: r.root[1], footAbove: foot.y - r.root[1],
        footAboveTerrain: foot.y - w.groundY(foot.x, foot.z),
        rlx: rl.x, rly: rl.y, rlz: rl.z, llx: ll.x, lly: ll.y, llz: ll.z,
        armR: s.armR, armL: s.armL, blend: r.blend, speed: r.speed,
      };
    });
  const swing = (rows, k) => Number((Math.max(...rows.map((r) => r[k])) - Math.min(...rows.map((r) => r[k]))).toFixed(4));

  const phase = async (frames) => {
    const rows = [];
    for (let i = 0; i < frames; i++) { await h.step(1); rows.push(await sample()); }
    return rows;
  };

  const idle = await phase(60);
  out.idle = {
    frames: idle.length,
    rightHandToAxis_m: stat(idle.map((r) => r.r)),
    leftHandToAxis_m: stat(idle.map((r) => r.l)),
    footAboveGround_m: stat(idle.map((r) => r.footAbove)),
    footAboveTerrainSample_m: stat(idle.map((r) => r.footAboveTerrain)),
    handTravel_m: { right: swing(idle, 'rlz'), left: swing(idle, 'llz') },
    blend: stat(idle.map((r) => r.blend)),
  };
  out.frame_idle = await h.snap(`${NAME}-idle-03`);

  await h.key('w');
  await h.step(1);
  const walk = await phase(120);
  const steady = walk.slice(60); // the blend ramp is over; this is the walk proper
  out.walk = {
    frames: walk.length,
    rightHandToAxis_m: stat(walk.map((r) => r.r)),
    leftHandToAxis_m: stat(walk.map((r) => r.l)),
    footAboveGround_m: stat(walk.map((r) => r.footAbove)),
    footAboveTerrainSample_m: stat(walk.map((r) => r.footAboveTerrain)),
    blend: stat(walk.map((r) => r.blend)),
    speed: stat(walk.map((r) => r.speed)),
    // the right arm no longer swings with the walk, the left still does (§2.4.4): the hands' travel
    // in the kid's own frame, which is what "swing" means for a hand pinned to a carried shaft
    rightHandTravel_m: { x: swing(steady, 'rlx'), y: swing(steady, 'rly'), z: swing(steady, 'rlz') },
    leftHandTravel_m: { x: swing(steady, 'llx'), y: swing(steady, 'lly'), z: swing(steady, 'llz') },
  };
  out.frame_walk = await h.snap(`${NAME}-walk-03`);
  const both = idle.concat(walk);
  out.every_frame = {
    rightHandToAxis_max_m: Number(Math.max(...both.map((r) => r.r)).toFixed(4)),
    leftHandToAxis_idle_max_m: Number(Math.max(...idle.map((r) => r.l)).toFixed(4)),
  };

  await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 'w', bubbles: true })));
  await h.step(180); // stop, settle back to the planted idle

  // the twirl (§2.4.4 Victory): X, then a filmstrip at +0.3 / +0.6 / +0.9 s with the orb's position
  await h.key('x');
  out.twirl = [];
  for (let i = 0; i < 3; i++) {
    await h.step(i === 0 ? 18 : 18);
    out.twirl.push({
      at_s: 0.3 * (i + 1),
      file: await h.snap(`${NAME}-twirl-${i}-03`),
      ...(await h.evaluate(() => {
        const s = globalThis.ssRigProbe['collette.staff']();
        return { orb: s.orb.map((v) => Number(v.toFixed(3))), origin: s.origin.map((v) => Number(v.toFixed(3))), axisY: Number(s.axis[1].toFixed(3)) };
      })),
    });
  }
  // the orb's distance from the pivot must stay ~0.86 m through the twirl (a circle about the hands)
  out.twirl_radius_m = out.twirl.map((r) => Number(Math.hypot(r.orb[0] - r.origin[0], r.orb[1] - r.origin[1], r.orb[2] - r.origin[2]).toFixed(3)));
  // ... and the angle must sweep two full turns: a second flourish, sampled every 3 frames
  await h.step(220); // let the first flourish finish and the hands come back to the shaft
  await h.key('x');
  out.twirl_sweep = [];
  let prev = null, unwrapped = 0;
  for (let i = 0; i < 24; i++) {
    const s = await h.evaluate(() => {
      const p = globalThis.ssRigProbe['collette.staff']();
      return { ax: p.axis, orb: p.orb, origin: p.origin };
    });
    const a = Math.atan2(s.orb[1] - s.origin[1], s.orb[0] - s.origin[0]);
    if (prev !== null) { let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; unwrapped += d; }
    prev = a;
    out.twirl_sweep.push(Number(((unwrapped * 180) / Math.PI).toFixed(0)));
    await h.step(3);
  }
  out.twirl_total_deg = out.twirl_sweep[out.twirl_sweep.length - 1];
  return out;
};
