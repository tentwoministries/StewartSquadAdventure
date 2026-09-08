// Probe: scout the cutscene clock for the frames worth saving. Steps to each second in SS_TIMES and
// writes a puppeteer screenshot (not a saved study frame) to SS_DIR, so the mockups folder only ever
// receives the frames that were chosen. Reads the flight's numbers alongside each shot.
//   SS_TIMES=4,11,18 SS_DIR=/tmp/scout node scripts/sandbox-drive.cjs "…?shot=WG&t=golden&step=1&ct=0" scripts/probes/flight-scout.cjs
const path = require('path');
module.exports = async (page, h) => {
  const times = (process.env.SS_TIMES || '').split(',').map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
  const dir = process.env.SS_DIR || '.';
  const tag = process.env.SS_TAG || 'scout';
  await h.sleep(12000);
  const out = [];
  for (const t of times) {
    await h.evaluate((target) => {
      const cut = globalThis.ssCut;
      const need = Math.max(0, Math.round((target - cut.at()) * 60));
      globalThis.ssStep(need);
    }, t);
    const info = await h.evaluate(() => {
      const f = globalThis.ssFlight;
      return { t: +globalThis.ssCut.at().toFixed(2), hud: f.hud(), pos: [+f.pos.x.toFixed(1), +f.pos.y.toFixed(1), +f.pos.z.toFixed(1)] };
    });
    const file = path.join(dir, `${tag}-${t.toFixed(1).replace('.', 'p')}.png`);
    await page.screenshot({ path: file });
    out.push({ ...info, file });
  }
  return out;
};
