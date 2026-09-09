// A2 (`docs/qa/briefs/reel-fixes-04-fixes.md`): do consecutive treads read apart at the study
// framing? The centre of six consecutive treads is projected through the scene's own camera into
// the saved `caves-descent-stair-04b-01.png` and the pixels are read back.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1&relief=chunky" scripts/probes/caves-treads-04b.cjs
//
// The lens is rebuilt exactly as `caves-frames-04b.cjs` built it (same stand, same yaw/pitch/d, the
// same 90 stepped frames from a cold load, which is deterministic under `?step=1`), so the camera
// this projects through is the camera that frame was shot with. Each sample is 1.2 m to the side of
// the centreline — the kid stands on it — and is only counted when a ray from the lens hits the
// `stairs` mesh at that distance **and at that tread's own height**, which is what makes the pixel a
// tread and not the riser or nosing in front of it.
const FILE = 'docs/design/mockups/caves-descent-stair-04b-01.png';

module.exports = async (page, h) => {
  await h.sleep(12000);
  const lens = await h.evaluate(() => {
    const w = globalThis.ssWorld, liam = globalThis.ssKids[0];
    const b = (236.31 * Math.PI) / 180, x = -14 + Math.sin(b) * 3, z = -36 - Math.cos(b) * 3;
    liam.root.position.set(x, w.groundY(x, z), z);
    liam.face(236.31);
    const o = globalThis.ssOrbit;
    o.current.target = [x, w.groundY(x, z) + 0.9, z];
    o.current.yaw = 236.31; o.current.pitch = 30; o.current.d = 11;
    o.apply();
    return { liam: [+x.toFixed(2), +w.groundY(x, z).toFixed(3), +z.toFixed(2)] };
  });
  await h.step(90);
  const out = await h.evaluate(async (file) => {
    const T = globalThis.ssTHREE;
    const C = globalThis.ssCaves;
    const cam = globalThis.ssCtx.camera;
    const scene = globalThis.ssKids[0].root.parent;
    const stairs = scene.getObjectByName('stairs');
    const occluders = [stairs, scene.getObjectByName('tiers'), scene.getObjectByName('floor'), ...globalThis.ssKids.map((k) => k.root)].filter(Boolean);
    const arc0 = C.stairs()[0].stepArc;
    const img = await new Promise((res, rej) => { const i = new globalThis.Image(); i.onload = () => res(i); i.onerror = rej; i.src = `/${file}`; });
    const cv = globalThis.document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, img.width, img.height).data;
    const ray = new T.Raycaster();
    const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const look = (v) => {
      const dir = v.clone().sub(cam.position), dist = dir.length();
      ray.set(cam.position, dir.normalize()); ray.far = dist + 1;
      const hits = ray.intersectObjects(occluders, true)
        .filter((hh) => hh.object.visible && hh.object.isMesh && !(hh.object.material && (hh.object.material.transparent || hh.object.material.depthWrite === false)));
      const first = hits.length ? hits[0] : null;
      return { first, dist, onTread: !!first && first.object === stairs && Math.abs(first.point.y - v.y) <= 0.05 };
    };
    const rows = [];
    for (let k = 2; k < 8; k++) {
      // walk across the tread, up-stair edge first, until a point on *this* tread is the first thing
      // the lens sees: from behind and above, the near half of each tread is what is visible and the
      // far half is hidden behind the step in front of it (a ray aimed at the middle grazes the
      // previous tread's nosing, which is how round 1's sample landed twice on one step).
      let v = null, seen = null;
      for (const frac of [0.12, 0.22, 0.35, 0.5, 0.7, 0.85]) {
        for (const sd of [1, -1]) {
          const q = C.stairPt(0, (k + frac) * arc0);
          const cand = new T.Vector3(q.x + q.nx * 1.2 * sd, q.y + 0.005, q.z + q.nz * 1.2 * sd);
          const s = look(cand);
          if (!v) { v = cand; seen = s; }
          if (s.onTread) { v = cand; seen = s; break; }
        }
        if (seen && seen.onTread) break;
      }
      const q = C.stairPt(0, (k + 0.5) * arc0);
      // the pixel is read where the ray actually lands, not where it was aimed
      const at = seen.first ? seen.first.point.clone() : v.clone();
      const ndc = at.project(cam);
      const px = Math.round(((ndc.x + 1) / 2) * img.width), py = Math.round(((1 - ndc.y) / 2) * img.height);
      let R = 0, G = 0, B = 0, n = 0;
      for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
        const qx = px + dx, qy = py + dy;
        if (qx < 0 || qy < 0 || qx >= img.width || qy >= img.height) continue;
        const i = (qy * img.width + qx) * 4;
        R += data[i]; G += data[i + 1]; B += data[i + 2]; n++;
      }
      R /= n; G /= n; B /= n;
      rows.push({
        step: k, px, py, treadY: +q.y.toFixed(3),
        hitY: seen.first ? +seen.first.point.y.toFixed(3) : null,
        onTread: seen.onTread, hitObject: seen.first ? (seen.first.object.name || 'unnamed') : null,
        hex: '#' + [R, G, B].map((c) => Math.round(c).toString(16).padStart(2, '0')).join(''),
        rgb: [Math.round(R), Math.round(G), Math.round(B)],
        lumaEncoded: +((0.2126 * R + 0.7152 * G + 0.0722 * B) / 255).toFixed(5),
        lumaLinear: +(0.2126 * lin(R / 255) + 0.7152 * lin(G / 255) + 0.0722 * lin(B / 255)).toFixed(6),
      });
    }
    const ratios = [];
    for (let i = 0; i + 1 < rows.length; i++) {
      const a = rows[i], b = rows[i + 1];
      ratios.push({
        pair: `${a.step}/${b.step}`,
        encoded: +(Math.max(a.lumaEncoded, b.lumaEncoded) / Math.min(a.lumaEncoded, b.lumaEncoded)).toFixed(3),
        linear: +(Math.max(a.lumaLinear, b.lumaLinear) / Math.min(a.lumaLinear, b.lumaLinear)).toFixed(3),
      });
    }
    return {
      image: [img.width, img.height], stepArc: +arc0.toFixed(4), rows, ratios,
      onTreadCount: rows.filter((r) => r.onTread).length,
      worstEncoded: Math.min(...ratios.map((r) => r.encoded)),
      worstLinear: Math.min(...ratios.map((r) => r.linear)),
    };
  }, FILE);
  return { file: FILE, lens, ...out };
};
