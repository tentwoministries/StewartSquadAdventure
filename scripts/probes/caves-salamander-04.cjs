// Probe: the cave salamanders clinging to the stair wall and climbing along it (T-62, brief check 4;
// LESSONS.md §0 rule 8 and Rigs rows 6/8 — a full orientation on a non-vertical surface is read as
// the *world* directions of the body's local axes in a probe, never judged from a frame).
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1&relief=chunky" scripts/probes/caves-salamander-04.cjs
//
// For each of the two: at rest, and then with Liam parked still 4 m away up-stair, a cast from the
// belly along the body's own local −y must hit `stairs` or `tiers` within 0.06 m — at rest, at the
// first climb trigger, and at every 10 frames of the 240 that follow it. The run is timed from the
// trigger because the trigger itself costs 3 s of standing still (the bible's number, unchanged) and
// the lerp is 0.8/s (Andrew liked the slow drift): 240 frames of climbing, not 240 frames of waiting.
// The whole-run figure from a standing start is quoted too.
const SAMPLE = 10, RUN = 240, ARM = 400;

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), relief: await h.evaluate(() => globalThis.ssWorld.hud()[0]), salamanders: [] };

  for (const idx of [0, 1]) {
    const r = await h.evaluate(async (args) => {
      const { idx, SAMPLE, RUN, ARM } = args;
      const T = globalThis.ssTHREE;
      const w = globalThis.ssWorld;
      const liam = globalThis.ssKids[0];
      const scene = liam.root.parent;
      const meshes = ['tiers', 'stairs'].map((n) => scene.getObjectByName(n));
      const sal = scene.getObjectByName(`salamander${idx}`);
      const ray = new T.Raycaster();
      const xA = new T.Vector3(), yA = new T.Vector3(), zA = new T.Vector3();
      const climbOf = () => {
        const line = w.hud().find((l) => l.includes('salamanders'));
        return Number((line.match(/climb (\d)/g) || [])[idx].slice(6));
      };
      const readAxes = () => {
        sal.updateMatrixWorld(true);
        sal.matrixWorld.extractBasis(xA, yA, zA);
        xA.normalize(); yA.normalize(); zA.normalize();
        return { x: [+xA.x.toFixed(3), +xA.y.toFixed(3), +xA.z.toFixed(3)], y: [+yA.x.toFixed(3), +yA.y.toFixed(3), +yA.z.toFixed(3)], z: [+zA.x.toFixed(3), +zA.y.toFixed(3), +zA.z.toFixed(3)] };
      };
      const bellyCast = () => {
        sal.updateMatrixWorld(true);
        sal.matrixWorld.extractBasis(xA, yA, zA);
        const down = yA.clone().normalize().negate();                  // the body's own local −y
        ray.set(sal.getWorldPosition(new T.Vector3()), down); ray.far = 5;
        let best = null;
        for (const m of meshes) for (const hit of ray.intersectObject(m, false)) if (best === null || hit.distance < best) best = hit.distance;
        return best;
      };
      const dist = () => sal.position.distanceTo(liam.root.position);

      // park Liam 4 m up-stair of the salamander and 1.5 m in from the wall, on the ground there
      sal.updateMatrixWorld(true);
      sal.matrixWorld.extractBasis(xA, yA, zA);
      const stand = sal.position.clone().addScaledVector(xA.normalize(), 4).addScaledVector(yA.normalize(), 1.5);
      liam.root.position.set(stand.x, w.groundY(stand.x, stand.z), stand.z);
      globalThis.ssStep(2);

      const rest = { belly: bellyCast(), axes: readAxes(), pos: [+sal.position.x.toFixed(3), +sal.position.y.toFixed(3), +sal.position.z.toFixed(3)], d: dist(), climb: climbOf() };
      const startAll = dist();
      // arm: step until the 3 s stillness fires the first climb
      let armed = 0;
      while (armed < ARM && climbOf() === 0) { globalThis.ssStep(1); armed++; }
      const startClimb = dist();
      const samples = [];
      let worstBelly = 0, offWall = 0;
      for (let f = 0; f < RUN; f++) {
        globalThis.ssStep(1);
        if (f % SAMPLE !== SAMPLE - 1) continue;
        const b = bellyCast();
        if (b === null) { offWall++; continue; }
        worstBelly = Math.max(worstBelly, b);
        if (samples.length < 3 || f > RUN - 20) samples.push({ f: f + 1, belly: +b.toFixed(4), d: +dist().toFixed(3), climb: climbOf(), axes: readAxes() });
      }
      return {
        idx, restBelly: +rest.belly.toFixed(4), restAxes: rest.axes, restPos: rest.pos, restDistance: +rest.d.toFixed(3),
        liam: [+liam.root.position.x.toFixed(2), +liam.root.position.y.toFixed(3), +liam.root.position.z.toFixed(2)],
        framesToFirstClimb: armed, distanceAtFirstClimb: +startClimb.toFixed(3),
        distanceAfterRun: +dist().toFixed(3),
        closedOverRun: +(startClimb - dist()).toFixed(3),
        closedFromStanding: +(startAll - dist()).toFixed(3),
        worstBellyGap: +worstBelly.toFixed(4), samplesOffWall: offWall,
        climbEnd: climbOf(), samples, hud: w.hud().find((l) => l.includes('salamanders')),
      };
    }, { idx, SAMPLE, RUN, ARM });
    out.salamanders.push(r);
  }
  return out;
};
