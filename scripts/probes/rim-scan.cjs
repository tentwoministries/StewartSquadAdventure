// Probe: sample inside() along the stream's tail centreline and across the sheet's end, to see
// where the island actually stops carrying the water (opus-fixes-rim, the lip).
module.exports = async (page, h) => {
  await h.sleep(9000);
  const tail = [[-40.00,31.00],[-41.29,31.85],[-42.54,32.73],[-43.75,33.62],[-44.92,34.51],[-46.06,35.39],[-47.16,36.26],[-47.52,36.54],[-47.87,36.83],[-48.22,37.11],[-48.57,37.38],[-48.91,37.66],[-49.25,37.92],[-49.59,38.19],[-49.92,38.45],[-50.25,38.70],[-50.58,38.95],[-50.90,39.20],[-51.22,39.43],[-51.53,39.66],[-51.85,39.89],[-52.32,40.22],[-52.93,40.65],[-53.51,41.05],[-54.08,41.43],[-54.63,41.79],[-55.16,42.14],[-55.69,42.49],[-56.22,42.83],[-56.74,43.17],[-57.27,43.52],[-57.82,43.88],[-58.00,44.00]];
  const out = {};
  out.centreline = await h.evaluate((pts) => pts.map(([x,z]) => ({ x, z, in: globalThis.ssWorld.inside(x,z), g: Number(globalThis.ssWorld.groundY(x,z).toFixed(2)) })), tail);
  // the plate's west edge at each z along the tail: march east from x −56 until inside() holds
  out.edge_by_z = await h.evaluate((zs) => zs.map((z) => {
    for (let x = -56; x < -40; x += 0.1) if (globalThis.ssWorld.inside(x, z)) return { z, edgeX: Number(x.toFixed(2)) };
    return { z, edgeX: null };
  }), [31,33,35,36,37,38,39,40,41,42,43,44]);
  out.probe = await h.evaluate(() => globalThis.ssWorld.probe());
  return out;
};
