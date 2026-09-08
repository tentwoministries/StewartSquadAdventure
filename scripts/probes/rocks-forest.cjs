// Reel fixes round 1, the torn rocks (T-43), the Forest scene only: forest-dusk has its own runtime
// (no installStep, no ssSnap) and exposes ssSave, which names the file itself
// (`forest-<time>-<shot>-<variant>`). To save under this round's name the probe wraps `fetch` and
// rewrites the `study=` parameter of the POST to /__sandbox/shot, as the console recipe does.
//   SS_NAME  = the frame name; SS_STUDY = optional JSON {name, target:[x,y,z], yaw, pitch, d}
module.exports = async (page, h) => {
  const out = { name: process.env.SS_NAME };
  await h.sleep(12000);
  await h.evaluate(() => {
    const w = globalThis;
    const orig = w.fetch.bind(w);
    w.__ssFiles = [];
    w.fetch = async (url, init) => {
      const shot = typeof url === 'string' && url.startsWith('/__sandbox/shot');
      const u = shot ? '/__sandbox/shot?study=' + encodeURIComponent(w.__ssName) : url;
      const res = await orig(u, init);
      if (shot) { const c = res.clone(); void c.json().then((j) => w.__ssFiles.push(j.file)); }
      return res;
    };
  });
  const save = async (name) => {
    await h.evaluate((n) => { globalThis.__ssName = n; return globalThis.ssSave(); }, name);
    await h.sleep(400);
    const files = await h.evaluate(() => globalThis.__ssFiles);
    return files[files.length - 1];
  };
  out.file = await save(process.env.SS_NAME);
  if (process.env.SS_STUDY) {
    const s = JSON.parse(process.env.SS_STUDY);
    await h.evaluate((cfg) => {
      const o = globalThis.ssOrbit;
      o.current.target = cfg.target;
      o.current.yaw = cfg.yaw; o.current.pitch = cfg.pitch; o.current.d = cfg.d;
      o.apply();
    }, s);
    out.studyFile = await save(s.name);
  }
  return out;
};
