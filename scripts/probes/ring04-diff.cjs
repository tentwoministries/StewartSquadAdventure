// Reads the nine `<scene>-ring-04-01.png` frames against the round-1 baseline `<scene>-round1-03-02.png`
// pixel by pixel in the browser (the dev server serves docs/ as static files), so the `_shared/`
// gate can say *where* a frame differs and by how much rather than only that its bytes differ.
// Reports, per scene: the fraction of pixels that differ at all, the fraction differing by more than
// 8/255 in any channel, the bounding box of those, and the largest single-channel difference.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/ring04-diff.cjs
const SCENES = ['bog-night', 'caves-descent', 'desert-noon', 'flight-golden', 'forest-dusk', 'frozen-night', 'meadow-golden', 'rim-dawn', 'shadow-wrong'];

module.exports = async (page, h) => {
  const out = { scenes: [] };
  for (const scene of SCENES) {
    const r = await h.evaluate(async (s) => {
      const load = (u) => new Promise((res, rej) => { const i = new globalThis.Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
      const a = await load(`/docs/design/mockups/${s}-ring-04-01.png`);
      const b = await load(`/docs/design/mockups/${s}-round1-03-02.png`);
      const cv = globalThis.document.createElement('canvas');
      cv.width = a.width; cv.height = a.height;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(a, 0, 0); const A = cx.getImageData(0, 0, a.width, a.height).data;
      cx.clearRect(0, 0, cv.width, cv.height);
      cx.drawImage(b, 0, 0); const B = cx.getImageData(0, 0, a.width, a.height).data;
      let any = 0, big = 0, max = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let p = 0; p < A.length; p += 4) {
        const d = Math.max(Math.abs(A[p] - B[p]), Math.abs(A[p + 1] - B[p + 1]), Math.abs(A[p + 2] - B[p + 2]));
        if (d === 0) continue;
        any++;
        if (d > max) max = d;
        if (d > 8) {
          big++;
          const i = p / 4, x = i % a.width, y = (i / a.width) | 0;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      const n = A.length / 4;
      return { w: a.width, h: a.height, anyPct: +((100 * any) / n).toFixed(3), bigPct: +((100 * big) / n).toFixed(3), maxChannelDelta: max, bboxOfBig: big ? [x0, y0, x1, y1] : null };
    }, scene);
    out.scenes.push({ scene, ...r });
  }
  return out;
};
