// Probe: which trees stand near the stream's last bend (the songbirds' birch must be a real trunk).
module.exports = async (page, h) => {
  await h.sleep(9000);
  return h.evaluate(() => {
    const near = globalThis.ssWorld.blockers
      .map((b) => ({ x: Number(b.x.toFixed(2)), z: Number(b.z.toFixed(2)), r: b.r, d: Number(Math.hypot(b.x + 46, b.z - 33).toFixed(2)) }))
      .filter((b) => b.d < 20)
      .sort((a, b) => a.d - b.d);
    return { count: globalThis.ssWorld.blockers.length, near };
  });
};
