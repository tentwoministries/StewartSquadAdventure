// Probe: one saved frame at a scene's default station (Tier-0 rule 10 — a change under
// `sandbox/_shared/` is checked with one frame per scene). Waits out the navigation, steps the
// scene a couple of seconds so the rigs settle into their solved poses, and saves under SS_NAME.
// The Forest scene has no stepping harness (its own main.ts), so there it waits on the wall clock
// and posts the canvas itself, the way shot.ts does.
//   SS_NAME=bog-night-shared-03 node scripts/sandbox-drive.cjs "<url>" scripts/probes/shared-frame.cjs
const NAME = process.env.SS_NAME || 'scene-shared-03';

module.exports = async (page, h) => {
  const out = { url: page.url(), name: NAME };
  await h.sleep(12000);
  const stepped = await h.evaluate(() => typeof globalThis.ssStep === 'function');
  if (stepped) {
    await h.step(120);
    out.clock = await h.step(0);
    out.file = await h.snap(NAME);
  } else {
    await h.sleep(3000);
    out.file = await h.evaluate(async (n) => {
      const c = globalThis.document.getElementById('c');
      const res = await globalThis.fetch(`/__sandbox/shot?study=${encodeURIComponent(n)}`, { method: 'POST', body: c.toDataURL('image/png') });
      return (await res.json()).file;
    }, NAME);
  }
  return out;
};
