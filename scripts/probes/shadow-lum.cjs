// Probe: the T-24 floor, measured on saved frames ("no surface renders below about 12 % luminance";
// the rule sheet's check 3: no region below 12 % over more than a tenth of the frame). `node_modules`
// has neither `sharp` nor `pngjs`, so the PNG is decoded by the browser the driver already owns:
// the dev server serves the repo root, so `docs/design/mockups/*.png` is a URL.
//   SS_PNGS=docs/design/mockups/shadow-wrong-s1-02-01.png,... \
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=S1&t=wrong&step=1" scripts/probes/shadow-lum.cjs
// Luminance is Rec.709 on the *gamma-encoded* bytes (value, not linear light): that is what the
// art-director reads off a PNG, and what T-24's "12 %" means (12 % of 255 = 30.6).
//
// Options (round 2, for T-39's reading "lit surfaces, the sky exempt"):
//   SS_REGIONS="roof:500,130,1100,310;porch:510,480,1120,630"  named sub-rectangles, same stats
//   SS_SKYROW=105     rows above this one are the sky: adds `belowHorizon` over rows >= SS_SKYROW
//                     (the horizon row of a station at pitch p is 500 - 500*tan(p)/tan(17.5) on a
//                     1600x1000 frame at fov 35 — scene.ts's camera)
//   SS_CELLS=1        include the 100 px block map (off by default: it is 160 numbers a frame)
module.exports = async (page, h) => {
  const files = (process.env.SS_PNGS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (files.length === 0) throw new Error('SS_PNGS is required (comma-separated repo-relative png paths)');
  const regions = (process.env.SS_REGIONS || '').split(';').map((s) => s.trim()).filter(Boolean).map((s) => {
    const [name, rect] = s.split(':');
    return { name, rect: (rect || '').split(',').map(Number) };
  });
  const skyRow = Number(process.env.SS_SKYROW || '-1');
  const wantCells = process.env.SS_CELLS === '1';
  const out = {};
  for (const f of files) {
    out[f] = await h.evaluate(async (url, regionsIn, skyRowIn, cellsIn) => {
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
      let dark = 0, black = 0, sum = 0;
      const lum = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const v = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        lum[i] = v; sum += v;
        if (v < 0.12) dark++;
        if (v < 0.05) black++;
      }
      // the stats of an arbitrary rectangle of the frame, in the same encoded domain
      const rect = (x0, y0, x1, y1) => {
        const w = Math.max(0, Math.min(x1, c.width) - Math.max(0, x0)), hh = Math.max(0, Math.min(y1, c.height) - Math.max(0, y0));
        if (w <= 0 || hh <= 0) return { error: 'empty rect' };
        const vals = new Float32Array(w * hh);
        let s = 0, d12 = 0, d5 = 0, k = 0;
        for (let y = Math.max(0, y0); y < Math.min(y1, c.height); y++) {
          for (let x = Math.max(0, x0); x < Math.min(x1, c.width); x++) {
            const v = lum[y * c.width + x];
            vals[k++] = v; s += v;
            if (v < 0.12) d12++;
            if (v < 0.05) d5++;
          }
        }
        const sorted = Float32Array.from(vals.subarray(0, k)).sort();
        const r3 = (v) => Math.round(v * 1000) / 1000;
        return {
          rect: [x0, y0, x1, y1], pixels: k,
          mean: r3(s / k), p05: r3(sorted[Math.floor(k * 0.05)]), p50: r3(sorted[Math.floor(k * 0.5)]), p95: r3(sorted[Math.floor(k * 0.95)]),
          fracBelow12: r3(d12 / k), fracBelow5: r3(d5 / k),
        };
      };
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
      const res2 = {
        w: c.width, h: c.height,
        mean: Math.round((sum / n) * 1000) / 1000,
        p05: Math.round(sorted[Math.floor(n * 0.05)] * 1000) / 1000,
        p50: Math.round(sorted[Math.floor(n * 0.5)] * 1000) / 1000,
        fracBelow12: Math.round((dark / n) * 1000) / 1000,
        fracBelow5: Math.round((black / n) * 1000) / 1000,
        darkCells, cells: cols * rows,
        fracDarkCells: Math.round((darkCells / (cols * rows)) * 1000) / 1000,
      };
      if (cellsIn) res2.cellMeans = cellMeans;
      if (skyRowIn >= 0) res2.belowHorizon = rect(0, skyRowIn, c.width, c.height);
      if (regionsIn.length) {
        res2.regions = {};
        for (const r of regionsIn) res2.regions[r.name] = rect(r.rect[0], r.rect[1], r.rect[2], r.rect[3]);
      }
      return res2;
    }, '/' + f.replace(/^\/+/, ''), regions, skyRow, wantCells);
  }
  return out;
};
