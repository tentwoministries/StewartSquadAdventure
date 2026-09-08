// Probe: the kids' per-seat looks through SceneWorld.look / poi (opus-fixes-flight check 4).
// Mid-flight at the chase station, steps 2 s so the eased heads settle, then reads every kid's
// `lookAt` and measures it against what the scene means: Noah's below the plane (the ground he is
// tracking), Liam's at another kid's head. Scene code may not write a non-active kid's `lookAt` —
// the runtime overwrites it — so this is the only place the intent can show up.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/flight-golden/?shot=CH&t=golden&step=1&ct=12" scripts/probes/flight-look.cjs
module.exports = async (page, h) => {
  await h.sleep(4000);
  return h.evaluate(() => {
    const f = globalThis.ssFlight, THREE = globalThis.ssTHREE;
    const v = (o) => [+o.x.toFixed(3), +o.y.toFixed(3), +o.z.toFixed(3)];
    globalThis.ssStep(120);
    const kids = globalThis.ssKids;
    const seats = kids.map((_, i) => { const o = new THREE.Object3D(); f.seat(i, o); return o.position.clone(); });
    const read = {};
    for (const k of kids) read[k.name] = v(k.lookAt);
    const noah = kids.find((k) => k.name === 'Noah'), liam = kids.find((k) => k.name === 'Liam');
    const nearestSeat = (p) => {
      let best = null, bd = Infinity;
      kids.forEach((k, i) => { const d = Math.hypot(p.x - seats[i].x, p.y - (seats[i].y + 0.9), p.z - seats[i].z); if (d < bd) { bd = d; best = k.name; } });
      return { kid: best, distance: +bd.toFixed(3) };
    };
    return {
      hasLookHook: typeof globalThis.ssWorld.look === 'function',
      hasPoiHook: typeof globalThis.ssWorld.poi === 'function',
      active: globalThis.ssActive().name,
      clock: +globalThis.ssCut.at().toFixed(3),
      plane: v(f.pos),
      lookAt: read,
      noah_lookAt_below_plane_by: +(f.pos.y - noah.lookAt.y).toFixed(3),
      noah_head_pitch: +noah.bones.head.rotation.x.toFixed(4),
      liam_lookAt_nearest_kid: nearestSeat(liam.lookAt),
      liam_head_yaw: +liam.bones.head.rotation.y.toFixed(4),
      seats: seats.map((s) => v(s)),
      ringsHidden: kids.map((k) => `${k.name} ring.visible=${k.ring.visible} ringLight=${k.ringLight.intensity}`),
    };
  });
};
