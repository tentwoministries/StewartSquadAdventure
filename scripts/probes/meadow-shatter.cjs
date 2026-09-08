// Probe: the shatter reads as debris, not a brown dome (opus-fixes-meadow check 3; enemies.md §2.5
// shatter: 8 shards, 2.0–5.5 m/s, gravity 3.75 m/s²). Sends the goblins, waits (stepped) until one
// is inside the Ground Pound's 2.5 m, fires G, then reports the shards' max height above the ground
// and the dust puff's live points at +0.4 s and +0.8 s from the impact, saving a frame at each.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S3&t=golden&step=1" scripts/probes/meadow-shatter.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url() };
  // step to contact, then fire the pound, all inside the page so nothing interleaves
  out.approach = await h.evaluate(() => {
    const w = globalThis.ssWorld;
    globalThis.ssKey('0');
    let t = 0, guard = 0;
    while (guard++ < 1200) {
      t = globalThis.ssStep(1);
      const p = w.probe();
      if (p.goblins.some((g) => g.state !== 'dead' && g.d < 2.2)) break;
    }
    const p = w.probe();
    return { t_at_contact: Number(t.toFixed(3)), frames: guard, goblins: p.goblins.map((g) => ({ i: g.i, state: g.state, d: Number(g.d.toFixed(2)) })) };
  });
  out.impact = await h.evaluate(() => {
    const w = globalThis.ssWorld;
    globalThis.ssKey('g');
    let t = 0, guard = 0;
    while (guard++ < 60) { t = globalThis.ssStep(1); if (w.probe().shardsLive > 0) break; }
    const p = w.probe();
    return { t_at_impact: Number(t.toFixed(3)), frames_after_G: guard, shardsLive: p.shardsLive, felled: p.felled, shardMaxY: Number(p.shardMaxY.toFixed(3)), dustLive: p.dustLive };
  });
  // the trace of the shards' max height through the flight, one sample every 0.05 s
  out.trace = await h.evaluate(() => {
    const w = globalThis.ssWorld;
    const rows = [];
    for (let k = 0; k < 3; k++) { globalThis.ssStep(1); }
    for (let k = 1; k <= 20; k++) {
      const p = w.probe();
      rows.push({ s: Number((k * 0.05).toFixed(2)), shards: p.shardsLive, maxY: Number(p.shardMaxY.toFixed(3)), dust: p.dustLive, dustA: Number(p.dustMaxAlpha.toFixed(3)), ring: Number(p.ringOpacity.toFixed(3)) });
      globalThis.ssStep(3);
    }
    return rows;
  });
  return out;
};
