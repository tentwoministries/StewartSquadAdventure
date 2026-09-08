// Probe: count the confetti (T-09 / T-22). Loads saved PNGs from the dev server into a canvas and
// reports, over a ground region, the share of pixels that are saturated and *not* green — the red,
// orange, purple and white flecks the review counted in every wide frame — plus the mean ground
// colour, so a fix can be judged as a number and not by eye alone.
//   SS_IMGS=a.png,b.png SS_REGION=380,330,1600,820 node scripts/sandbox-drive.cjs "<any scene url>" scripts/probes/meadow-pixels.cjs
module.exports = async (page, h) => {
  const imgs = (process.env.SS_IMGS || '').split(',').filter(Boolean);
  const region = (process.env.SS_REGION || '380,330,1600,820').split(',').map(Number);
  return h.evaluate(
    async ({ imgs, region }) => {
      const [x0, y0, x1, y1] = region;
      const rows = [];
      for (const src of imgs) {
        const res = await globalThis.fetch(src);
        const bmp = await globalThis.createImageBitmap(await res.blob());
        const c = globalThis.document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        const g = c.getContext('2d');
        g.drawImage(bmp, 0, 0);
        const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data;
        let fleck = 0, n = 0, sr = 0, sg = 0, sb = 0, warmBright = 0, cool = 0, pale = 0, violet = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
          const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), v = mx, s = mx === 0 ? 0 : (mx - mn) / mx;
          let hue = 0;
          if (mx !== mn) {
            if (mx === r) hue = 60 * (((gg - b) / (mx - mn)) % 6);
            else if (mx === gg) hue = 60 * ((b - r) / (mx - mn) + 2);
            else hue = 60 * ((r - gg) / (mx - mn) + 4);
            if (hue < 0) hue += 360;
          }
          const green = hue >= 65 && hue <= 175;
          if (v > 0.25 && ((s > 0.35 && !green) || (s < 0.12 && v > 0.72))) fleck++;
          // the review's three named colours: "red, orange and blue flecks" (plus the white ones)
          if (hue < 50 && s > 0.5 && v > 0.5) warmBright++;
          if (hue >= 195 && hue < 330 && s > 0.22 && v > 0.3) cool++;
          if (hue >= 225 && hue < 300 && s > 0.28 && v > 0.45) violet++;
          if (s < 0.14 && v > 0.7) pale++;
          sr += r; sg += gg; sb += b; n++;
        }
        rows.push({
          img: src.split('/').pop(),
          size: bmp.width + 'x' + bmp.height,
          fleck_per_mille: Number(((fleck / n) * 1000).toFixed(2)),
          warm_bright_per_mille: Number(((warmBright / n) * 1000).toFixed(2)),
          cool_per_mille: Number(((cool / n) * 1000).toFixed(2)),
          violet_per_mille: Number(((violet / n) * 1000).toFixed(2)),
          pale_per_mille: Number(((pale / n) * 1000).toFixed(2)),
          mean_rgb: [sr / n, sg / n, sb / n].map((v) => Math.round(v * 255)),
        });
      }
      return { region, rows };
    },
    { imgs, region },
  );
};
