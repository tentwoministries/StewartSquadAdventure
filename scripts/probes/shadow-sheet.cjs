// Probe: shoot a set of Home, Wrong stations in one browser session. Each station is a fresh
// navigation (the station is read once, at build), then the 12 s wait LESSONS.md Process row 1 asks
// for, then SS_STEPS frames of 1/60 s and one ssSnap. `?t=wrong` is explicit on every URL (T-29).
//   SS_SHOTS="S1=shadow-wrong-s1-02,CU=shadow-wrong-cu-02" [SS_STEPS=120] \
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=S1&t=wrong&step=1" scripts/probes/shadow-sheet.cjs
const BASE = 'http://localhost:5173/sandbox/shadow-wrong/';
module.exports = async (page, h) => {
  const pairs = (process.env.SS_SHOTS || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.split('='));
  const steps = Number(process.env.SS_STEPS || '120');
  const out = [];
  for (const [shot, name] of pairs) {
    await page.goto(`${BASE}?shot=${shot}&t=wrong&step=1`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssStep, { timeout: 60000 });
    await h.sleep(12000);
    const row = { shot, name, url: page.url() };
    row.t = await h.step(steps);
    row.file = await h.snap(name.toLowerCase());
    row.hud = (await h.hud())[3] || '';
    out.push(row);
  }
  return out;
};
