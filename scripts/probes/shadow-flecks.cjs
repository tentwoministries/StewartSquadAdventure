// Probe: the scatter's colour half of T-09 ("within a step of the ground's own colour"), measured.
// The thinning half was proved by a count of instances (LOG iter 11); the colour half was not, and
// the audit's item 3 is exactly that: cyan-blue cone tufts and red-orange flecks over violet ground.
// This counts, inside a band of a saved frame, the pixels that are *saturated* and whose hue is not
// the ground's violet — split into hue buckets so a before/after is a number and not an impression.
//   SS_PNGS=docs/design/mockups/shadow-wrong-sw-02-01.png \
//   SS_BAND=300,560,1600,1000 \
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=SW&t=wrong&step=1" \
//     scripts/probes/shadow-flecks.cjs
// Hue/saturation are HSV on the gamma-encoded bytes (what the eye reads off the PNG). "Saturated" is
// SS_SAT (default 0.45) with value >= SS_VAL (default 0.10), so the near-black is not counted as a
// colour. Buckets: cyan 165-215, blue 215-260, violet 260-300 (the ground itself), warm 330-360+0-45.
module.exports = async (page, h) => {
  const files = (process.env.SS_PNGS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (files.length === 0) throw new Error('SS_PNGS is required (comma-separated repo-relative png paths)');
  const band = (process.env.SS_BAND || '').split(',').map(Number);
  const sat = Number(process.env.SS_SAT || '0.45');
  const val = Number(process.env.SS_VAL || '0.10');
  const dh = Number(process.env.SS_DH || '40');
  const out = {};
  for (const f of files) {
    out[f] = await h.evaluate(async (url, bandIn, satMin, valMin, dh) => {
      const res = await globalThis.fetch(url, { cache: 'no-store' });
      if (!res.ok) return { error: `${res.status} ${url}` };
      const bmp = await globalThis.createImageBitmap(await res.blob());
      const c = globalThis.document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      const b = bandIn.length === 4 ? bandIn : [0, 0, c.width, c.height];
      const [x0, y0, x1, y1] = b;
      const { data } = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
      const n = (x1 - x0) * (y1 - y0);
      const bucket = { cyan: 0, blue: 0, violet: 0, warm: 0, other: 0 };
      let saturated = 0;
      for (let i = 0; i < n; i++) {
        const r = data[i * 4] / 255, g = data[i * 4 + 1] / 255, bl = data[i * 4 + 2] / 255;
        const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn;
        if (mx < valMin) continue;
        const s = mx === 0 ? 0 : d / mx;
        if (s < satMin) continue;
        saturated++;
        let hue;
        if (mx === r) hue = 60 * (((g - bl) / d) % 6);
        else if (mx === g) hue = 60 * ((bl - r) / d + 2);
        else hue = 60 * ((r - g) / d + 4);
        if (hue < 0) hue += 360;
        if (hue >= 165 && hue < 215) bucket.cyan++;
        else if (hue >= 215 && hue < 260) bucket.blue++;
        else if (hue >= 260 && hue < 300) bucket.violet++;
        else if (hue >= 330 || hue < 45) bucket.warm++;
        else bucket.other++;
      }
      // "within a step of the ground's own colour" (T-09), as a number: the band's own median hue is
      // the ground, and an off-hue pixel is one more than `dh` degrees from it. That is the measure
      // the buckets cannot give, because the violet ground is itself a saturated blue by hue.
      const hues = [];
      for (let i = 0; i < n; i++) {
        const r = data[i * 4] / 255, g = data[i * 4 + 1] / 255, bl = data[i * 4 + 2] / 255;
        const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn;
        if (mx < valMin || d === 0 || d / mx < satMin) continue;
        let hue = mx === r ? 60 * (((g - bl) / d) % 6) : mx === g ? 60 * ((bl - r) / d + 2) : 60 * ((r - g) / d + 4);
        if (hue < 0) hue += 360;
        hues.push(hue);
      }
      hues.sort((a, b2) => a - b2);
      const medHue = hues.length ? hues[Math.floor(hues.length / 2)] : 0;
      let off = 0;
      for (const hue of hues) {
        let dd = Math.abs(hue - medHue);
        if (dd > 180) dd = 360 - dd;
        if (dd > dh) off++;
      }
      const pm = (k) => Math.round((k / n) * 100000) / 100; // per mille, 2 dp
      return {
        band: b, pixels: n, satMin, valMin, dh,
        medianHue: Math.round(medHue * 10) / 10,
        offHue: off, offHue_pm: pm(off),
        saturated, saturated_pm: pm(saturated),
        cyan: bucket.cyan, cyan_pm: pm(bucket.cyan),
        blue: bucket.blue, blue_pm: pm(bucket.blue),
        violet: bucket.violet, violet_pm: pm(bucket.violet),
        warm: bucket.warm, warm_pm: pm(bucket.warm),
        other: bucket.other, other_pm: pm(bucket.other),
      };
    }, '/' + f.replace(/^\/+/, ''), band, sat, val, dh);
  }
  return out;
};
