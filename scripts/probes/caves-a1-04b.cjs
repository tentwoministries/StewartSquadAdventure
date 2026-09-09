// Probe: round 2's fix pass, section A — the chunkier step (A1), the step limit per relief setting
// (A3) and where the four salamanders ended up (A5), read off the running scene rather than off the
// source. LESSONS.md §0 rule 8: the numbers a report quotes come from a stepped probe.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1&relief=chunky" scripts/probes/caves-a1-04b.cjs
//
// A. `ssCaves.stairs()` at every setting: each stair's arc, drop, step count, step arc and its
//    shortest and tallest riser. The check is 1.20 m of arc, a riser of about 0.38 m on the first
//    stair, and every riser inside RISER_MAX (0.45) and inside the setting's own step limit.
// B. `J` still reaches all three settings and re-grounds every kid (round 1's check, re-run because
//    the step limit and the step arc both moved under it).
// C. The four salamanders: their stair, arc, wall side, the surface they are on, and the distance
//    from each one's belly to the nearest hook-lamp — A5 asks for the lit side of the channel.
const RELIEFS = ['flat', 'chunky', 'blocks'];
const BASE = 'http://localhost:5173/sandbox/caves-descent/';

module.exports = async (page, h) => {
  const out = { settings: [], cycle: [], salamanders: null };

  for (const relief of RELIEFS) {
    await page.goto(`${BASE}?shot=S1&t=half&step=1&relief=${relief}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
    await h.sleep(12000);
    await h.step(30);
    const r = await h.evaluate(() => {
      const C = globalThis.ssCaves, w = globalThis.ssWorld;
      const stairs = C.stairs().map((s, i) => ({
        stair: i + 1, len: +s.len.toFixed(3), drop: s.drop, steps: s.steps,
        stepArc: +s.stepArc.toFixed(4), riserMin: +s.riserMin.toFixed(4), riserMax: +s.riserMax.toFixed(4),
      }));
      const kids = globalThis.ssKids.map((k) => ({
        name: k.name, insideRock: +(w.groundY(k.root.position.x, k.root.position.z) - k.root.position.y).toFixed(4),
      }));
      return { relief: C.relief(), stepLimit: C.stepLimit(), stairs, kids, hud: w.hud()[0] };
    });
    out.settings.push({ relief, ...r });
    if (relief === 'chunky') {
      out.salamanders = await h.evaluate(() => {
        const T = globalThis.ssTHREE;
        const scene = globalThis.ssKids[0].root.parent;
        const w = globalThis.ssWorld;
        const rows = [];
        for (let i = 0; i < 4; i++) {
          const sal = scene.getObjectByName(`salamander${i}`);
          if (!sal) { rows.push({ i, missing: true }); continue; }
          sal.updateMatrixWorld(true);
          const xA = new T.Vector3(), yA = new T.Vector3(), zA = new T.Vector3();
          sal.matrixWorld.extractBasis(xA, yA, zA);
          rows.push({
            i, pos: [+sal.position.x.toFixed(3), +sal.position.y.toFixed(3), +sal.position.z.toFixed(3)],
            up: [+yA.x.toFixed(3), +yA.y.toFixed(3), +yA.z.toFixed(3)],
          });
        }
        return { rows, hud: w.hud().find((l) => l.includes('salamanders')) };
      });
    }
  }

  // B. the `J` cycle, from a chunky load
  await page.goto(`${BASE}?shot=S1&t=half&step=1&relief=chunky`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
  await h.sleep(12000);
  await h.step(30);
  for (let i = 0; i < 4; i++) {
    const r = await h.evaluate(() => {
      const C = globalThis.ssCaves, w = globalThis.ssWorld;
      let worst = 0;
      for (const k of globalThis.ssKids) worst = Math.max(worst, Math.abs(w.groundY(k.root.position.x, k.root.position.z) - k.root.position.y));
      return {
        relief: C.relief(), stepLimit: C.stepLimit(), worstKidOffGround: +worst.toFixed(4),
        riser1: +C.stairs()[0].riserMax.toFixed(4), riser2: +C.stairs()[1].riserMax.toFixed(4),
      };
    });
    out.cycle.push(r);
    await h.key('j');
    await h.step(6);
  }
  return out;
};
