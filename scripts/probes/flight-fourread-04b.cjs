// Probe: C3 of docs/qa/briefs/reel-fixes-04-fixes.md — the four-read at the ride's station.
// At CH at 18.0 s in variant A, project the four heads' centres to the screen and measure
//   * every pairwise distance in pixels against each head's own projected width (≥ 0.6 of it);
//   * occlusion: a ray from the camera to each head centre must hit that kid's own meshes first.
// Both are measured off the rigs and the live camera, never off the scene's report of itself.
// It also prints the same numbers for B and C, so the three seatings can be compared.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1" scripts/probes/flight-fourread-04b.cjs
const BASE = 'http://localhost:5173/sandbox/flight-golden/';

const MEASURE = () => {
  const T = globalThis.ssTHREE, ctx = globalThis.ssCtx, cam = ctx.camera;
  const W = globalThis.innerWidth, H = globalThis.innerHeight;
  cam.updateMatrixWorld(true);
  const right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).normalize();
  const toPx = (v) => { const p = v.clone().project(cam); return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H]; };
  const kids = globalThis.ssKids;
  const heads = kids.map((k) => {
    k.root.updateMatrixWorld(true);
    // the head bone plus the head ball's own centre (rig.ts: the ball sits at +headR on the bone)
    const c = k.bones.head.localToWorld(new T.Vector3(0, k.bones.hr * 0.2, 0));
    const r = k.bones.hr * 0.2 * 0.95;                    // the ball is scaled 0.95 across
    const a = toPx(c.clone().addScaledVector(right, -r)), b = toPx(c.clone().addScaledVector(right, r));
    return { name: k.name, world: c, px: toPx(c), width: Math.hypot(b[0] - a[0], b[1] - a[1]), dist: c.distanceTo(cam.position) };
  });
  // occlusion: does the ray to each head centre hit that kid first?
  const ray = new T.Raycaster();
  const owner = (o) => { for (let n = o; n; n = n.parent) { const i = kids.findIndex((k) => k.root === n); if (i >= 0) return kids[i].name; } return null; };
  const roots = kids.map((k) => k.root);
  const occ = heads.map((h) => {
    const dir = h.world.clone().sub(cam.position).normalize();
    ray.set(cam.position, dir);
    ray.far = h.dist + 0.5;
    const hit = ray.intersectObjects(roots, true).filter((x) => x.object.visible)[0];
    return { name: h.name, firstHit: hit ? owner(hit.object) : null, ok: hit ? owner(hit.object) === h.name : true, at: hit ? +hit.distance.toFixed(3) : null };
  });
  const pairs = [];
  for (let i = 0; i < heads.length; i++) {
    for (let j = i + 1; j < heads.length; j++) {
      const d = Math.hypot(heads[i].px[0] - heads[j].px[0], heads[i].px[1] - heads[j].px[1]);
      const w = Math.max(heads[i].width, heads[j].width);   // against the *larger* head: the strict read
      pairs.push({ pair: `${heads[i].name}–${heads[j].name}`, px: +d.toFixed(1), width: +w.toFixed(1), ratio: +(d / w).toFixed(3) });
    }
  }
  return {
    variant: globalThis.ssSeatApi.variant(), ct: +globalThis.ssCut.at().toFixed(2),
    bankDeg: +globalThis.ssFlight.bankDeg.toFixed(1), viewport: [W, H],
    heads: heads.map((h) => ({ name: h.name, px: [+h.px[0].toFixed(1), +h.px[1].toFixed(1)], width: +h.width.toFixed(1), dist: +h.dist.toFixed(2) })),
    pairs, worstRatio: Math.min(...pairs.map((p) => p.ratio)), occlusion: occ, allVisible: occ.every((o) => o.ok),
  };
};

module.exports = async (page, h) => {
  const out = [];
  for (const v of (process.env.SS_VARIANTS || 'a,b,c').split(',').filter(Boolean)) {
    let got = null, err = null;
    for (let tryN = 0; tryN < 4 && !got; tryN++) {
      try {
        await page.goto(`${BASE}?shot=CH&t=golden&step=1&seats=${v}`, { waitUntil: 'load' });
        await page.waitForFunction(() => !!globalThis.ssWorld, { timeout: 60000 });
        await h.sleep(12000);
        await h.evaluate(() => globalThis.ssStep(Math.round((18.0 - globalThis.ssCut.at()) * 60)));
        got = await h.evaluate(MEASURE);
      } catch (e) { err = e; await h.sleep(3000); }
    }
    if (!got) throw err;
    out.push(got);
  }
  return { reads: out };
};
