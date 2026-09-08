// Probe: the goblin state machine actually reaches windup and hit (opus-fixes-meadow check 1;
// OPUS_FIX_PLAN.md §6 "a keyed mechanic is not done until a stepped probe has shown every state").
// Sends the goblins with the scene key '0', then steps 16 s one frame at a time so a state that
// lasts 0.08 s cannot be sampled past, and logs every goblin's state and its distance to Isabella
// after each whole second. The stepping runs inside one evaluate: no animation frame interleaves.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S1&t=golden&step=1&beat=1" scripts/probes/meadow-goblins.cjs
module.exports = async (page, h) => {
  const seconds = Number(process.env.SS_SECONDS || '16');
  const send = process.env.SS_SEND !== '0';
  await h.sleep(4000);
  return h.evaluate(
    ({ seconds, send }) => {
      const w = globalThis.ssWorld;
      const ringAlpha = () => globalThis.ssKids[0].ring.material.uniforms.uAlpha.value;
      const out = { url: globalThis.location.href, keys: Object.keys(w.keys || {}), at_load: w.probe(), log: [] };
      if (send) { globalThis.ssKey('0'); out.sent = 'ssKey(0) — send the goblins'; }
      const seen = [new Set(), new Set(), new Set()];
      const firstAt = {};
      let flashFrames = 0, maxAlpha = 0;
      for (let s = 1; s <= seconds; s++) {
        let p = null, t = 0;
        for (let f = 0; f < 60; f++) {
          t = globalThis.ssStep(1);
          p = w.probe();
          for (const g of p.goblins) {
            if (!seen[g.i].has(g.state)) { seen[g.i].add(g.state); firstAt[`g${g.i}.${g.state}`] = Number(t.toFixed(3)); }
          }
          const a = ringAlpha();
          if (a > 0.4) flashFrames++;
          maxAlpha = Math.max(maxAlpha, a);
        }
        out.log.push(
          't=' + t.toFixed(2) + 's  ' +
          p.goblins.map((g) => 'g' + g.i + ' ' + (g.state + '       ').slice(0, 7) + ' d=' + g.d.toFixed(2) + 'm').join(' | ') +
          '  ringAlpha=' + ringAlpha().toFixed(2) + ' felled=' + p.felled + ' shardsLive=' + p.shardsLive,
        );
      }
      const all = new Set();
      for (const s of seen) for (const v of s) all.add(v);
      out.states_reached_per_goblin = seen.map((s) => [...s]);
      out.states_reached = [...all].sort();
      out.windup_reached = all.has('windup');
      out.hit_reached = all.has('hit');
      out.recover_reached = all.has('recover');
      out.first_entry_times = firstAt;
      out.ring_flash_frames = flashFrames;
      out.ring_alpha_max = maxAlpha;
      out.final = w.probe();
      return out;
    },
    { seconds, send },
  );
};
