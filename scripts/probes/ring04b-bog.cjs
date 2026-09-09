// The flat-ground control for round 2's fix A4 (the ring rebuilt on three radial rings): the Bog's
// default station, shot exactly as the round's `<scene>-ring-04` sweep shot it, and diffed against
// that frame pixel by pixel. On flat ground every `aLift` is 0, so the only thing that can move is
// the ring's own tessellation — 98 vertices in two radial rings became 147 in three, and the rim the
// fragment shader draws from `length(position.xy)` is interpolated over smaller triangles.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?t=night&step=1" scripts/probes/ring04b-bog.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), kf: await h.evaluate(() => globalThis.ssKf().name) };
  out.clock = Number((await h.step(120)).toFixed(2));
  out.file = await h.snap('bog-night-ring-04b');
  out.diff = await h.evaluate(async (f) => {
    const load = (u) => new Promise((res, rej) => { const i = new globalThis.Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const a = await load(`/${f}`);
    const b = await load('/docs/design/mockups/bog-night-ring-04-01.png');
    const cv = globalThis.document.createElement('canvas');
    cv.width = a.width; cv.height = a.height;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(a, 0, 0); const A = cx.getImageData(0, 0, a.width, a.height).data;
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.drawImage(b, 0, 0); const B = cx.getImageData(0, 0, a.width, a.height).data;
    let any = 0, big = 0, max = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let p = 0; p < A.length; p += 4) {
      const d = Math.max(Math.abs(A[p] - B[p]), Math.abs(A[p + 1] - B[p + 1]), Math.abs(A[p + 2] - B[p + 2]));
      if (!d) continue;
      any++; if (d > max) max = d;
      if (d > 8) { const i = p / 4, x = i % a.width, y = (i / a.width) | 0; big++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const n = A.length / 4;
    return { size: [a.width, a.height], anyPct: +((100 * any) / n).toFixed(4), bigPct: +((100 * big) / n).toFixed(4), maxChannelDelta: max, bboxOfBig: big ? [x0, y0, x1, y1] : null };
  }, out.file);
  return out;
};
