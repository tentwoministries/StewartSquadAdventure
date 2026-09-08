// Probe: two picture questions. (1) Which object is the small dark hexagon the scores flagged?
// Raycast the pixel it sits on (SS_PX="x,y" in canvas pixels) and walk the hit's ancestry.
// (2) Do the seats face the nose? Compare each kid's and Ed's local +z in world space with the
// plane's local +x (T-26: the rig's eyes are on +z, the plane is built along +x).
//   SS_CT=18 SS_PX=1370,660 node scripts/sandbox-drive.cjs "…?shot=WG&t=golden&step=1&ct=0" scripts/probes/flight-diag.cjs
module.exports = async (page, h) => {
  const ct = Number(process.env.SS_CT || '18');
  const px = (process.env.SS_PX || '1370,660').split(',').map(Number);
  await h.sleep(6000);
  return h.evaluate((target, pixel) => {
    const THREE = globalThis.ssTHREE, f = globalThis.ssFlight, cut = globalThis.ssCut;
    globalThis.ssStep(Math.max(0, Math.round((target - cut.at()) * 60)));
    const cam = globalThis.ssCtx.camera;
    const ndc = new THREE.Vector2((pixel[0] / 1600) * 2 - 1, -((pixel[1] / 1000) * 2 - 1));
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, cam);
    ray.far = 4000;
    const scene = cam.parent;
    const hits = ray.intersectObjects(scene.children, true).slice(0, 4).map((hit) => {
      const chain = [];
      for (let o = hit.object; o; o = o.parent) chain.push(`${o.name || o.type}${o.geometry ? `(${o.geometry.type})` : ''}`);
      return { distance: +hit.distance.toFixed(2), point: [+hit.point.x.toFixed(1), +hit.point.y.toFixed(1), +hit.point.z.toFixed(1)], chain: chain.join(' < ') };
    });
    // facing: local +z of each rig against the plane's local +x
    const w = new THREE.Vector3(), nose = new THREE.Vector3(1, 0, 0).applyQuaternion(f.plane.getWorldQuaternion(new THREE.Quaternion()));
    const facing = globalThis.ssKids.map((k) => {
      k.root.getWorldQuaternion(new THREE.Quaternion());
      w.set(0, 0, 1).applyQuaternion(k.root.getWorldQuaternion(new THREE.Quaternion()));
      return `${k.name}: eyes·nose = ${w.dot(nose).toFixed(3)}`;
    });
    const ed = f.plane.children.find((c) => c.type === 'Group' && c.children.some((g) => g.type === 'Mesh') && Math.abs(c.position.x + 1.35) < 0.01);
    let edFacing = 'not found';
    if (ed) { w.set(0, 0, 1).applyQuaternion(ed.getWorldQuaternion(new THREE.Quaternion())); edFacing = `Ed: goggles·nose = ${w.dot(nose).toFixed(3)}`; }
    return { clock: +cut.at().toFixed(2), pixel, hits, facing, edFacing, note: 'eyes·nose = +1 means facing the nose, −1 the tail' };
  }, ct, px);
};
