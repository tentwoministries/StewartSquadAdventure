// Probe: walking on to the Crystal Caves' first stair from a 90° fan of bearings, and down it
// (T-55, docs/qa/briefs/reel-fixes-caves-03.md check 2; extended for T-61b, reel-fixes-caves-04.md
// check 2). LESSONS.md §0 rule 8: a mechanic is not built until a stepped probe has shown it run,
// so this is what makes the fix done, not the test.
//
// Round 2 adds one column: the largest change in Liam's y in a single frame. The stair is stacked
// boxes again, so he steps rather than glides — and the number says whether that is a step or a
// fall. Round 2's fix pass (`reel-fixes-04-fixes.md` A1/A3) makes a step 1.20 m of arc — a 0.381 m
// riser on the first stair, 0.435 on the second — and sets the caves' own step limit to 0.60 m at
// `flat` and `chunky` (1.10 at `blocks`), so the check is **Δy ≤ 0.40 m**: one riser, never the
// 0.76 m sideways drop over the channel's wall that 1.10 used to allow. The runs are longer too
// (600 frames rather than 240) because 240 frames of walking only buy 8 m of travel, and the first
// flight needs 10.4 to reach −2.0 m.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-stair.cjs
//
// Liam is put 4 m back from the stair's mouth at −40°, 0° and +40° off the stair's direction, the
// orbit's yaw is aimed at the mouth so `w` heads there, and `w` is held for 240 frames of 1/60 s.
// Every frame the probe drops a ray from 3 m over his head against the `tiers` and `stairs` meshes
// and records how far his feet are inside the rock (hit − y) or over it (y − hit).
//
// Run A holds the one bearing for the whole 240 frames (the brief's literal check). Run B re-aims
// the yaw down the stair every 20 frames once he is on a tread — what a player does, and the only
// way a straight-line hold at ±40° can keep descending: walk.ts refuses a step it cannot take and
// does not slide along the wall, so an off-axis hold walks into the channel's side and stops.
const MOUTH = { x: -14, z: -36 };
const STAIR_BEARING = 236.31; // atan2 of the first segment (−6, +4), the direction the stair runs

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = {
    url: page.url(), kf: await h.evaluate(() => globalThis.ssKf().name),
    relief: await h.evaluate(() => globalThis.ssCaves.relief()),
    stepLimit: await h.evaluate(() => globalThis.ssCaves.stepLimit()),
    stairs: await h.evaluate(() => globalThis.ssCaves.stairs().map((r) => ({ len: +r.len.toFixed(3), drop: r.drop, steps: r.steps, stepArc: +r.stepArc.toFixed(4), riserMin: +r.riserMin.toFixed(4), riserMax: +r.riserMax.toFixed(4) }))),
    runs: [],
  };

  const run = async (offDeg, reaim, frames) => {
    const back = (STAIR_BEARING + 180 + offDeg + 360) % 360;      // the bearing from the mouth to the start
    const yaw = (back + 180) % 360;                                // ... so `w` heads at the mouth
    const r = await h.evaluate(async (args) => {
      const { mx, mz, back, yaw, reaim, frames } = args;
      const T = globalThis.ssTHREE;
      const w = globalThis.ssWorld, walk = globalThis.ssWalk, hero = globalThis.ssActive().root;
      const scene = globalThis.ssKids[0].root.parent;
      const meshes = ['tiers', 'stairs'].map((n) => scene.getObjectByName(n));
      const rad = (d) => (d * Math.PI) / 180;
      const sx = mx + Math.sin(rad(back)) * 4, sz = mz - Math.cos(rad(back)) * 4;
      hero.position.set(sx, w.groundY(sx, sz), sz);
      walk.setHero(hero);
      globalThis.ssOrbit.current.yaw = yaw;
      globalThis.ssOrbit.apply();
      const ray = new T.Raycaster();
      const down = new T.Vector3(0, -1, 0);
      const topAt = (x, y, z) => {
        ray.set(new T.Vector3(x, y + 3, z), down); ray.far = 80;
        let best = null;
        for (const m of meshes) for (const hit of ray.intersectObject(m, false)) if (best === null || hit.point.y > best) best = hit.point.y;
        return best;
      };
      globalThis.dispatchEvent(new globalThis.KeyboardEvent('keydown', { key: 'w', bubbles: true }));
      const start = { x: sx, y: hero.position.y, z: sz };
      let inRock = -99, over = -99, noHit = 0, yawNow = yaw, minY = hero.position.y, maxDy = 0, maxDyOn = 0, prevY = hero.position.y;
      const track = [];
      for (let f = 0; f < frames; f++) {
        if (reaim && f % 20 === 0 && hero.position.y < -0.25) {
          // aim at the steepest step the walk will actually take: what a player does on a stair
          let bestB = yawNow, bestY = 9;
          const lim = globalThis.ssCaves && globalThis.ssCaves.stepLimit ? globalThis.ssCaves.stepLimit() : 1.0;
          for (let b = 0; b < 360; b += 10) {
            const nx = hero.position.x + Math.sin(rad(b)) * 1.5, nz = hero.position.z - Math.cos(rad(b)) * 1.5;
            const ny = w.groundY(nx, nz);
            if (Math.abs(ny - hero.position.y) > lim || !w.walkable(nx, nz)) continue;
            if (ny < bestY) { bestY = ny; bestB = b; }
          }
          yawNow = bestB; globalThis.ssOrbit.current.yaw = yawNow; globalThis.ssOrbit.apply();
        }
        globalThis.ssStep(1);
        const p = hero.position;
        const hit = topAt(p.x, p.y, p.z);
        minY = Math.min(minY, p.y);
        // two numbers: every frame, and only the frames he is already on a tread and stays on one
        // (the Landing sits at 0 and the first tread at −0.19, so `< −0.25` is 'on the stair')
        const dy = Math.abs(p.y - prevY);
        maxDy = Math.max(maxDy, dy);
        if (prevY < -0.25 && p.y < -0.25) maxDyOn = Math.max(maxDyOn, dy);
        prevY = p.y;
        if (hit === null) noHit++;
        else { inRock = Math.max(inRock, hit - p.y); over = Math.max(over, p.y - hit); }
        if (f % Math.max(40, Math.round(frames / 6)) === 39) track.push({ f: f + 1, x: +p.x.toFixed(2), y: +p.y.toFixed(3), z: +p.z.toFixed(2), rock: hit === null ? null : +hit.toFixed(3) });
      }
      globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 'w', bubbles: true }));
      const p = hero.position;
      return {
        start: { x: +start.x.toFixed(2), y: +start.y.toFixed(3), z: +start.z.toFixed(2) },
        final: { x: +p.x.toFixed(2), y: +p.y.toFixed(3), z: +p.z.toFixed(2) },
        onStair: w.groundY(p.x, p.z) < -0.2, lowestY: +minY.toFixed(3),
        maxIntoRock: +inRock.toFixed(4), maxOverRock: +over.toFixed(4), framesWithNoRockUnderHim: noHit,
        maxSingleFrameDy: +maxDy.toFixed(4), maxSingleFrameDyOnTheStair: +maxDyOn.toFixed(4),
        yawEnd: +yawNow.toFixed(1), track,
      };
    }, { mx: MOUTH.x, mz: MOUTH.z, back, yaw, reaim, frames });
    out.runs.push({ bearingOffStair: offDeg, yaw: +yaw.toFixed(2), reaim, frames, ...r });
  };

  for (const off of [-40, 0, 40]) await run(off, false, 600);   // A: the brief's literal run, held
  for (const off of [-40, 0, 40]) await run(off, true, 600);    // B: re-aimed down the stair
  for (const off of [-40, 0, 40]) await run(off, true, 900);    // C: 15 s, the whole first flight
  out.hud = await h.hud();
  return out;
};
