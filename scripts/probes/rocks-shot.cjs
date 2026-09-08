// Reel fixes round 1, the torn rocks (T-43): save a stepped frame from a shared-runtime scene, and
// optionally a second one through an ssOrbit study framing (for a rock that is small in frame).
//   SS_NAME  = the frame name (lowercase, the plugin appends -NN)
//   SS_STUDY = optional JSON {name, target:[x,y,z], yaw, pitch, d}
//   SS_FIND  = optional: 'boulder' picks the study target from the scene itself — the mesh whose
//              geometry has 240 position vertices (the detail-1 icosahedron every boulder is)
//              nearest the camera, so the study framing is aimed at a rock that is really there.
module.exports = async (page, h) => {
  const out = { name: process.env.SS_NAME };
  await h.sleep(12000);
  await h.step(120);
  out.file = await h.snap(process.env.SS_NAME);
  if (process.env.SS_FIND === 'boulder') {
    out.boulder = await h.evaluate(() => {
      const cam = globalThis.ssCtx.camera;
      // SceneCtx has no `scene` field (verified in _shared/scene.ts): walk up from the active kid.
      let scene = globalThis.ssCtx.active.root;
      while (scene.parent) scene = scene.parent;
      // A detail-1 icosahedron is 240 vertices, but so is a kid's head: take only lumps bigger than
      // any rig part (bounding sphere >= 0.45 m), then the one nearest the camera.
      const found = [];
      scene.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.getAttribute) return;
        const p = o.geometry.getAttribute('position');
        if (!p || p.count !== 240) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const rad = o.geometry.boundingSphere.radius;
        if (rad < 0.45) return;
        const w = o.getWorldPosition(new globalThis.ssTHREE.Vector3());
        found.push({ x: +w.x.toFixed(2), y: +w.y.toFixed(2), z: +w.z.toFixed(2), r: +rad.toFixed(2), d: +w.distanceTo(cam.position).toFixed(2) });
      });
      found.sort((a, b) => a.d - b.d);
      return found[0] ? { ...found[0], candidates: found.length } : null;
    });
  }
  if (process.env.SS_STUDY) {
    const s = JSON.parse(process.env.SS_STUDY);
    const target = out.boulder ? [out.boulder.x, out.boulder.y, out.boulder.z] : s.target;
    await h.evaluate((cfg) => {
      const o = globalThis.ssOrbit;
      o.current.target = cfg.target;
      o.current.yaw = cfg.yaw; o.current.pitch = cfg.pitch; o.current.d = cfg.d;
      o.apply();
    }, { target, yaw: s.yaw, pitch: s.pitch, d: s.d });
    await h.step(2);
    out.studyFile = await h.snap(s.name);
    out.studyAt = target;
  }
  return out;
};
