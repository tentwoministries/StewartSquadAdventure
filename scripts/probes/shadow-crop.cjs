// Probe: a magnified crop of a saved frame, written to disk, so a detail can be *read* and not
// guessed at (the CU's hair cap at 3x, the S2 roof, a tuft in the foreground). The browser the
// driver already owns does the decode and the scaling; the probe writes the PNG with node's fs.
//   SS_PNG=docs/design/mockups/shadow-wrong-cu-02-01.png SS_CROP=700,330,280,250 SS_SCALE=3 \
//   SS_OUT=<abs path>/cu-head.png \
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=CU&t=wrong&step=1" \
//     scripts/probes/shadow-crop.cjs
// The crop is nearest-neighbour (imageSmoothingEnabled = false): a magnified render must not invent
// pixels that the frame does not have.
const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const path = require('node:path');

module.exports = async (page, h) => {
  const file = (process.env.SS_PNG || '').trim();
  const outPath = (process.env.SS_OUT || '').trim();
  if (!file || !outPath) throw new Error('SS_PNG and SS_OUT are required');
  const crop = (process.env.SS_CROP || '').split(',').map(Number);
  if (crop.length !== 4 || crop.some((v) => !Number.isFinite(v))) throw new Error('SS_CROP=x,y,w,h is required');
  const scale = Number(process.env.SS_SCALE || '3');
  const dataUrl = await h.evaluate(async (url, c, k) => {
    const res = await globalThis.fetch(url, { cache: 'no-store' });
    if (!res.ok) return `error ${res.status} ${url}`;
    const bmp = await globalThis.createImageBitmap(await res.blob());
    const src = globalThis.document.createElement('canvas');
    src.width = bmp.width; src.height = bmp.height;
    src.getContext('2d').drawImage(bmp, 0, 0);
    const dst = globalThis.document.createElement('canvas');
    dst.width = Math.round(c[2] * k); dst.height = Math.round(c[3] * k);
    const dc = dst.getContext('2d');
    dc.imageSmoothingEnabled = false;
    dc.drawImage(src, c[0], c[1], c[2], c[3], 0, 0, dst.width, dst.height);
    return dst.toDataURL('image/png');
  }, '/' + file.replace(/^\/+/, ''), crop, scale);
  if (!dataUrl.startsWith('data:image/png;base64,')) throw new Error(dataUrl);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64'));
  return { file, crop, scale, out: outPath, bytes: fs.statSync(outPath).size };
};
