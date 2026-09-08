// Probe: audit item 6 — does the ice-fall's frozen pool read as a pool? Four low framings on the
// approach (yaw 0, pitch 10-14, d 10-14, the lens on the pool's centre), each saved and each
// measured: the mean RGB of the sheet's own pixels against the mean RGB of the snow shore outside
// the ring of humps. The pixels are found by re-building scene.ts's camera (fov 35, 1600x1000) with
// shot.ts's `placeCamera` maths from the orbit's own station and projecting points on the disc, then
// reading the saved PNG back through the dev server (the trick shadow-lum.cjs uses).
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S4&t=night&step=1" scripts/probes/frozen-pool-read.cjs
const POOL = { x: -8, z: -25.5, r: 7.1, y: -0.1 };
const TRIES = (process.env.SS_TRIES || '10:12,12:12,12:14,14:11').split(',').map((s) => s.split(':').map(Number));
const NAME = process.env.SS_NAME || 'frozen-night-pool-try-03';

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), tries: [] };
  for (const [pitch, d] of TRIES) {
    await h.evaluate((p, dd, pool) => {
      const o = globalThis.ssOrbit;
      o.current.target = [pool.x, pool.y, pool.z]; o.current.yaw = 0; o.current.pitch = p; o.current.d = dd; o.apply();
    }, pitch, d, POOL);
    await h.step(30);
    const file = await h.snap(NAME);
    const px = await h.evaluate(async (url, p, dd, pool) => {
      const THREE = globalThis.ssTHREE;
      const W = 1600, H = 1000, rad = (a) => (a * Math.PI) / 180;
      const cam = new THREE.PerspectiveCamera(35, W / H, 0.5, 1500);
      const f = new THREE.Vector3(Math.sin(rad(0)), 0, -Math.cos(rad(0)));
      const t = new THREE.Vector3(pool.x, pool.y, pool.z);
      cam.position.copy(t.clone().addScaledVector(f, -dd * Math.cos(rad(p))).add(new THREE.Vector3(0, dd * Math.sin(rad(p)), 0)));
      cam.lookAt(t); cam.updateMatrixWorld(true);
      const res = await globalThis.fetch('/' + url, { cache: 'no-store' });
      if (!res.ok) return { error: res.status };
      const bmp = await globalThis.createImageBitmap(await res.blob());
      const c = globalThis.document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
      const im = ctx.getImageData(0, 0, c.width, c.height).data;
      const at = (x, y, yw) => {
        const v = new THREE.Vector3(x, yw, y).project(cam);
        return [Math.round((v.x * 0.5 + 0.5) * c.width), Math.round((-v.y * 0.5 + 0.5) * c.height)];
      };
      const mean = (pts) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (const [px2, py] of pts) {
          if (px2 < 0 || py < 0 || px2 >= c.width || py >= c.height) continue;
          const i = (py * c.width + px2) * 4; r += im[i]; g += im[i + 1]; b += im[i + 2]; n++;
        }
        return n ? { rgb: [Math.round(r / n), Math.round(g / n), Math.round(b / n)], n } : { rgb: null, n: 0 };
      };
      const disc = [], shore = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * 6.283;
        for (const rr of [1.0, 2.5, 4.0, 5.5]) disc.push(at(pool.x + Math.cos(a) * rr, pool.z + Math.sin(a) * rr, pool.y + 0.001));
        for (const rr of [9.6, 10.6]) shore.push(at(pool.x + Math.cos(a) * rr, pool.z + Math.sin(a) * rr, 0.05));
      }
      const md = mean(disc), ms = mean(shore);
      const dist = md.rgb && ms.rgb ? Math.round(Math.hypot(md.rgb[0] - ms.rgb[0], md.rgb[1] - ms.rgb[1], md.rgb[2] - ms.rgb[2])) : null;
      return { disc: md, shore: ms, rgb_distance: dist, disc_centre_px: at(pool.x, pool.z, pool.y) };
    }, file, pitch, d, POOL);
    out.tries.push({ pitch, d, file, ...px });
  }
  return out;
};
