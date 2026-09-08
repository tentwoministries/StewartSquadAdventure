// Probe: the SceneWorld.look hook (opus-fixes-runtime check 3). A scene may not write a non-active
// kid's lookAt — the runtime overwrites it every frame — so the hook is the only way. Sets one that
// sends Noah's eyes to (0, 30, 0), steps 120 frames twice (the eased head must settle, not drift),
// reads every kid's lookAt and Noah's head bones, then removes the hook and steps again.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?step=1" scripts/probes/runtime-look.cjs
module.exports = async (page, h) => {
  await h.sleep(2000);
  return h.evaluate(() => {
    const THREE = globalThis.ssTHREE;
    const v = (o) => [Number(o.x.toFixed(4)), Number(o.y.toFixed(4)), Number(o.z.toFixed(4))];
    const readAll = () => {
      const r = {};
      for (const k of globalThis.ssKids) r[k.name] = v(k.lookAt);
      return r;
    };
    const out = { kids: globalThis.ssKids.map((k) => k.name), active: globalThis.ssActive().name };
    out.lookAt_before_hook = readAll();
    globalThis.ssWorld.look = (k) => (k.name === 'Noah' ? new THREE.Vector3(0, 30, 0) : null);
    globalThis.ssStep(120);
    out.lookAt_after_120 = readAll();
    out.noah_head_rotation_after_120 = v(globalThis.ssKids.find((k) => k.name === 'Noah').bones.head.rotation);
    globalThis.ssStep(120);
    out.lookAt_after_240 = readAll();
    out.noah_head_rotation_after_240 = v(globalThis.ssKids.find((k) => k.name === 'Noah').bones.head.rotation);
    const a = globalThis.ssActive();
    out.active_position_plus_1y = [Number(a.root.position.x.toFixed(4)), Number((a.root.position.y + 1).toFixed(4)), Number(a.root.position.z.toFixed(4))];
    const poi = globalThis.ssWorld.poi ? globalThis.ssWorld.poi(a) : null;
    out.active_poi = poi ? v(poi) : null;
    out.active_lookAt = v(a.lookAt);
    globalThis.ssWorld.look = undefined;
    globalThis.ssStep(120);
    out.lookAt_after_hook_removed = readAll();
    return out;
  });
};
