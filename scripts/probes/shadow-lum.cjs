// Probe: the T-24 floor, measured on saved frames ("no surface renders below about 12 % luminance";
// the rule sheet's check 3: no region below 12 % over more than a tenth of the frame). `node_modules`
// has neither `sharp` nor `pngjs`, so the PNG is decoded by the browser the driver already owns:
// the dev server serves the repo root, so `docs/design/mockups/*.png` is a URL.
//   SS_PNGS=docs/design/mockups/shadow-wrong-s1-02-01.png,... \
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=S1&t=wrong&step=1" scripts/probes/shadow-lum.cjs
// Luminance is Rec.709 on the *gamma-encoded* bytes (value, not linear light): that is what the
// art-director reads off a PNG, and what T-24's "12 %" means (12 % of 255 = 30.6).
module.exports = async (page, h) => {
  const files = (process.env.SS_PNGS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (files.length === 0) throw new Error('SS_PNGS is required (comma-separated repo-relative png paths)');
  const out = {};
  for (const f of files) {
    out[f] = await h.evaluate(async (url) => {
      const res = await globalThis.fetch(url, { cache: 'no-store' });
      if (!res.ok) return { error: `${res.status} ${url}` };
      const blob = await res.blob();
      const bmp = await globalThis.createImageBitmap(blob);
      const c = globalThis.document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      const n = c.width * c.height;
      let dark = 0, sum = 0;
      const lum = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const v = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        lum[i] = v; sum += v;
        if (v < 0.12) dark++;
      }
      // block map: 100 × 100 px cells, a cell is "dark" when its mean is under 12 %
      const cs = 100, cols = Math.floor(c.width / cs), rows = Math.floor(c.height / cs);
      let darkCells = 0; const cellMeans = [];
      for (let ry = 0; ry < rows; ry++) {
        const line = [];
        for (let rx = 0; rx < cols; rx++) {
          let s = 0;
          for (let y = 0; y < cs; y++) for (let x = 0; x < cs; x++) s += lum[(ry * cs + y) * c.width + rx * cs + x];
          const m = s / (cs * cs);
          line.push(Math.round(m * 1000) / 1000);
          if (m < 0.12) darkCells++;
        }
        cellMeans.push(line);
      }
      const sorted = Float32Array.from(lum).sort();
      return {
        w: c.width, h: c.height,
        mean: Math.round((sum / n) * 1000) / 1000,
        p05: Math.round(sorted[Math.floor(n * 0.05)] * 1000) / 1000,
        p50: Math.round(sorted[Math.floor(n * 0.5)] * 1000) / 1000,
        fracBelow12: Math.round((dark / n) * 1000) / 1000,
        darkCells, cells: cols * rows,
        fracDarkCells: Math.round((darkCells / (cols * rows)) * 1000) / 1000,
        cellMeans,
      };
    }, '/' + f.replace(/^\/+/, ''));
  }
  return out;
};
