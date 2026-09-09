// Probe: the two regression checks the rule sheet asks for at all three relief settings
// (docs/qa/rules/reel-fixes-caves-04.md checks 10 and 11).
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/caves-checks-04.cjs
//
// A. Round-1 deferral (c): no rim crystal grows through a tread. Both stairs are walked at 0.25 m of
//    arc, on the centreline and ±1.0 m and ±1.8 m, and a ray is dropped against the *crystal*
//    instanced mesh alone; anything above the tread there is a crystal through a step.
// B. Camera row 4: the four stations that live in enclosed places — L1, W1, S1, S2 — are checked
//    against the geometry at every setting: the lens must not be inside a tier's rock.
// C. Round-1 deferral (e): the second stair's foot lip, sampled right round the band's edge.
const RELIEFS = ['flat', 'chunky', 'blocks'];
const BASE = 'http://localhost:5173/sandbox/caves-descent/';

module.exports = async (page, h) => {
  const out = { settings: [] };
  for (const relief of RELIEFS) {
    await page.goto(`${BASE}?shot=S1&t=half&step=1&relief=${relief}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep, { timeout: 60000 });
    await h.sleep(12000);
    await h.step(30);
    const r = await h.evaluate(() => {
      const T = globalThis.ssTHREE;
      const w = globalThis.ssWorld;
      const scene = globalThis.ssKids[0].root.parent;
      // the crystals are the one InstancedMesh in the props group
      let crystals = null;
      scene.traverse((o) => { if (o.isInstancedMesh && o.count > 100) crystals = o; });
      const ray = new T.Raycaster(), down = new T.Vector3(0, -1, 0);
      const topOn = (m, x, z, from) => {
        ray.set(new T.Vector3(x, from + 4, z), down); ray.far = 90;
        let best = null;
        for (const hit of ray.intersectObject(m, false)) if (best === null || hit.point.y > best) best = hit.point.y;
        return best;
      };
      // A. crystals over the treads: `ssCaves.stairY` says exactly which points are on a stair
      const C = globalThis.ssCaves;
      let worstCrystal = -99, worstAt = '', samples = 0, worstStep = -99, worstStepAt = '', stepSamples = 0;
      const TT = [0, -11];
      for (let x = -40; x <= 4; x += 0.3) for (let z = -44; z <= 36; z += 0.3) {
        const tread = C.stairY(x, z);
        if (tread === null) continue;
        samples++;
        const c = topOn(crystals, x, z, tread);
        if (c === null) continue;
        if (c - tread > worstCrystal) { worstCrystal = c - tread; worstAt = `${x.toFixed(2)},${z.toFixed(2)} tread ${tread.toFixed(3)} crystal ${c.toFixed(3)}`; }
        // a *cut* step: the apron and the mouth are level with their tier, so a crystal standing on
        // the tier beside them is floor dressing, not a crystal through a step
        const t = C.tierOf(x, z);
        if (t >= 0 && tread > TT[t] - 0.15) continue;
        stepSamples++;
        if (c - tread > worstStep) { worstStep = c - tread; worstStepAt = `${x.toFixed(2)},${z.toFixed(2)} tread ${tread.toFixed(3)} crystal ${c.toFixed(3)}`; }
      }
      // B. the enclosed stations
      const stations = (globalThis.ssCaves && globalThis.ssCaves.stations) ? {
        S1: globalThis.ssCaves.stations.S1, S2: globalThis.ssCaves.stations.S2,
        L1: globalThis.ssCaves.stations.L1, W1: globalThis.ssCaves.stations.W1,
      } : {
        S1: { target: [0, 1.0, -33], yaw: 175, pitch: 26, d: 21 },
        S2: { target: [-27, -5, -22], yaw: 130, pitch: 30, d: 22 },
        L1: { target: [6, -14, 10], yaw: 182, pitch: 22, d: 26 },
        W1: { target: [0, -12, -4], yaw: 270, pitch: 12, d: 92 },
      };
      const rad = (d) => (d * Math.PI) / 180;
      const lenses = {};
      for (const [k, s] of Object.entries(stations)) {
        const f = new T.Vector3(Math.sin(rad(s.yaw)), 0, -Math.cos(rad(s.yaw)));
        const p = new T.Vector3(...s.target).addScaledVector(f, -s.d * Math.cos(rad(s.pitch))).add(new T.Vector3(0, s.d * Math.sin(rad(s.pitch)), 0));
        const g = w.groundY(p.x, p.z);
        lenses[k] = { pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], ground: +g.toFixed(3), aboveRock: +(p.y - g).toFixed(3), insideShell: Math.hypot(p.x / 62, p.z / 54) < 1 };
      }
      // C. the second stair's foot lip
      const foot = { x: -2, z: 32 };
      let lip = 0, lipAt = '', lipSamples = 0, edgeLip = 0, edgeAt = '';
      const footTread = C.stairY(foot.x, foot.z);
      for (let k = 0; k < 96; k++) {
        const a = (k / 96) * 6.2832;
        for (let d = 1.9; d <= 3.2; d += 0.1) {
          const x = foot.x + Math.cos(a) * d, z = foot.z + Math.sin(a) * d;
          if (C.stairY(x, z) !== null || C.tierOf(x, z) >= 0) continue;   // off the stair, on the Depths floor
          lipSamples++;
          const g = w.groundY(x, z);
          if (Math.abs(g - footTread) > lip) { lip = Math.abs(g - footTread); lipAt = `${x.toFixed(2)},${z.toFixed(2)} ${g.toFixed(3)}`; }
          if (d <= 2.15 && Math.abs(g - footTread) > edgeLip) { edgeLip = Math.abs(g - footTread); edgeAt = `${x.toFixed(2)},${z.toFixed(2)} ${g.toFixed(3)}`; }
        }
      }
      return {
        hud: w.hud()[0],
        crystalInstances: crystals ? crystals.count : null,
        stairSamples: samples, cutStepSamples: stepSamples,
        worstCrystalAboveGround: +worstCrystal.toFixed(4), worstCrystalAt: worstAt,
        worstCrystalOverACutStep: +worstStep.toFixed(4), worstCrystalOverACutStepAt: worstStepAt,
        lenses, footTread: +footTread.toFixed(3), footLipAtBandEdge: +edgeLip.toFixed(4), footLipAtBandEdgeAt: edgeAt,
        footMaxOver3mBlend: +lip.toFixed(4), footLipAt: lipAt, footLipSamples: lipSamples,
      };
    });
    out.settings.push({ relief, ...r });
  }
  return out;
};
