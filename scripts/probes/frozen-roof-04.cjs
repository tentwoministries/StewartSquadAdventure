// Probe: T-59, Neve's hut roof. The two slabs were rotated with the wrong sign
// (`makeRotationX(-s * th)`), so each rose toward its outer edge and the hut read as a book left
// open on its spine (Andrew's screenshot `The Hearth - Possibly Upside Down Roof.jpg`). The fix is
// the sign. This probe saves the station frame that shows it and measures the roof from the hut's
// merged geometry: the highest roof-coloured vertices must sit on the ridge line (|z_local| small),
// the lowest at the eaves (|z_local| large).
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S1&t=night&step=1" scripts/probes/frozen-roof-04.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), kf: await h.evaluate(() => globalThis.ssKf().name) };
  await h.evaluate(() => globalThis.ssStep(120));
  // the hut: the mesh whose bounding box straddles (-2.5, -4.5) and rises past 5 m
  out.roof = await h.evaluate(() => {
    const T = globalThis.ssTHREE;
    const scene = globalThis.ssKids[0].root.parent;
    let best = null;
    scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
      const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (b.min.x < -2.5 && b.max.x > -2.5 && b.min.z < -4.5 && b.max.z > -4.5 && b.max.y > 5 && b.max.y < 8 && (b.max.x - b.min.x) < 12) best = o;
    });
    if (!best) return { found: false };
    const p = best.geometry.attributes.position, c = best.geometry.attributes.color;
    const v = new T.Vector3();
    // roof colour F.hutRoof vs snow: take every vertex above 3.0 m in world y, bucket by height
    const pts = [];
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(best.matrixWorld); if (v.y > 3.0 && v.y < 6.4) pts.push([v.x, v.y, v.z, c.getX(i), c.getY(i), c.getZ(i)]); }
    pts.sort((a, b) => b[1] - a[1]);
    const top = pts.slice(0, 40), low = pts.slice(-40);
    const cx = -2.5, cz = -4.5;
    const dist = (q) => Math.hypot(q[0] - cx, q[2] - cz);
    const mean = (arr, f) => arr.reduce((s, q) => s + f(q), 0) / arr.length;
    return { found: true, n: pts.length, topY: top[0][1], topMeanDist: mean(top, dist), lowY: low[low.length - 1][1], lowMeanDist: mean(low, dist) };
  });
  await h.evaluate(() => globalThis.ssSnap('frozen-night-roof-04'));
  return out;
};
