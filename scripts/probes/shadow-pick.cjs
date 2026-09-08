// Probe (round 2): name what is under a list of frame pixels at a station (SS_PIX="x,y;x,y"),
// every hit along the ray. Used to identify the dashed lines over Isabella's head at CU.
//   SS_SHOT=CU SS_PIX="780,370;830,440;900,470" node scripts/sandbox-drive.cjs \
//     "http://localhost:5173/sandbox/shadow-wrong/?shot=CU&t=wrong&step=1" scripts/probes/shadow-pick.cjs
module.exports = async (page, h) => {
  const pix = (process.env.SS_PIX || '').split(';').map((s) => s.split(',').map(Number)).filter((a) => a.length === 2);
  await h.sleep(11000);
  await h.step(120);
  const out = {};
  for (const [x, y] of pix) out[`${x},${y}`] = await h.evaluate((p) => globalThis.ssProbe.pick(p[0], p[1]), [x, y]);
  return out;
};
