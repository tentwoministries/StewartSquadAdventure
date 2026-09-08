// Probe (round 2): why Isabella's hair cap reads translucent at portrait distance. The report is a
// dump of every mesh in her rig (material flags first: `transparent`, `opacity`, `depthWrite`,
// `side`, `castShadow` — the three causes the brief names) and three stepped frames from CU that
// isolate the cause: as built, with the tiara hidden, and with the rig casting no shadow.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/shadow-wrong/?shot=CU&t=wrong&step=1" \
//     scripts/probes/shadow-hair.cjs
// The three frames are named `shadow-diag-*` and are deleted once they have been read: they are a
// diagnosis, not a delivery.
module.exports = async (page, h) => {
  await h.sleep(12000);
  await h.step(120);
  const dump = await h.evaluate(() => {
    const out = [];
    const kid = globalThis.ssKids[1];
    kid.root.traverse((o) => {
      if (!o.isMesh) return;
      const chain = [];
      for (let p = o; p; p = p.parent) if (p.name) chain.unshift(p.name);
      const m = o.material;
      out.push({
        chain: chain.join('/'),
        pos: [o.position.x, o.position.y, o.position.z].map((v) => Number(v.toFixed(3))),
        rotX: Number(o.rotation.x.toFixed(3)),
        verts: o.geometry.getAttribute('position').count,
        castShadow: o.castShadow,
        mat: { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, side: m.side, type: m.type },
      });
    });
    return out;
  });
  const shots = {};
  shots.asBuilt = await h.snap('shadow-diag-a');
  // (b) the tiara hidden: the ring is at local y 0.34 on the head with rotation.x = PI/2 + 0.25
  const hidden = await h.evaluate(() => {
    let n = 0;
    globalThis.ssKids[1].root.traverse((o) => {
      if (o.isMesh && Math.abs(o.position.y - 0.34) < 0.001 && Math.abs(o.rotation.x - (Math.PI / 2 + 0.25)) < 0.001) { o.visible = false; n++; }
    });
    return n;
  });
  shots.tiaraHidden = await h.snap('shadow-diag-b');
  // (c) the tiara back, the whole rig casting no shadow (shadow acne is the other candidate)
  await h.evaluate(() => {
    globalThis.ssKids[1].root.traverse((o) => {
      if (o.isMesh && Math.abs(o.position.y - 0.34) < 0.001 && Math.abs(o.rotation.x - (Math.PI / 2 + 0.25)) < 0.001) o.visible = true;
      if (o.isMesh) o.castShadow = false;
    });
  });
  shots.noRigShadow = await h.snap('shadow-diag-c');
  await h.evaluate(() => { globalThis.ssKids[1].root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); });
  return { tiarasHidden: hidden, shots, meshes: dump };
};
