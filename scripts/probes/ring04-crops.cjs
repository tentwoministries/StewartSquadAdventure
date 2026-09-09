// A contact sheet for the `_shared/` gate: for each scene whose `-ring-04` frame differs from the
// round-1 baseline, the changed region is cropped from both and drawn side by side (baseline left,
// this round right) so the difference can be *attributed* rather than guessed at.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1" scripts/probes/ring04-crops.cjs
const ROWS = [
  ['desert-noon', 1075, 370, 180, 140],
  ['rim-dawn', 760, 230, 190, 140],
  ['shadow-wrong', 300, 395, 640, 210],
  ['frozen-night', 460, 0, 540, 360],
];

module.exports = async (page, h) => {
  await h.sleep(2000);
  const file = await h.evaluate(async (rows) => {
    const load = (u) => new Promise((res, rej) => { const i = new globalThis.Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const SC = 1.6, PAD = 8;
    let w = 0, hh = PAD;
    const imgs = [];
    for (const [s, x, y, cw, ch] of rows) {
      const a = await load(`/docs/design/mockups/${s}-round1-03-02.png`);
      const b = await load(`/docs/design/mockups/${s}-ring-04-01.png`);
      imgs.push({ s, a, b, x, y, cw, ch });
      w = Math.max(w, cw * 2 * SC + PAD * 3);
      hh += ch * SC + PAD + 18;
    }
    const cv = globalThis.document.createElement('canvas');
    cv.width = Math.ceil(w); cv.height = Math.ceil(hh);
    const cx = cv.getContext('2d');
    cx.fillStyle = '#0B0E1A'; cx.fillRect(0, 0, cv.width, cv.height);
    let ty = PAD;
    for (const q of imgs) {
      cx.fillStyle = '#FFF5E6'; cx.font = '12px monospace';
      cx.fillText(`${q.s}  (left: round1-03-02   right: ring-04)`, PAD, ty + 12);
      ty += 18;
      cx.drawImage(q.a, q.x, q.y, q.cw, q.ch, PAD, ty, q.cw * SC, q.ch * SC);
      cx.drawImage(q.b, q.x, q.y, q.cw, q.ch, PAD * 2 + q.cw * SC, ty, q.cw * SC, q.ch * SC);
      ty += q.ch * SC + PAD;
    }
    const data = cv.toDataURL('image/png');
    const res = await globalThis.fetch('/__sandbox/shot?study=ring04-crops', { method: 'POST', body: data });
    return (await res.json()).file;
  }, ROWS);
  return { file };
};
