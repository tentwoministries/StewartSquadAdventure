// Reel fixes round 1, the torn rocks (T-43): count the open edges of the rocks *as rendered*, in the
// page, after the scene has been stepped. An independent re-implementation of the check (the unit
// test proves the recipe; this proves what is actually on screen). A closed surface has every
// undirected edge, taken between quantised unique positions, shared by exactly two faces.
// Reports every non-indexed mesh whose geometry is a detail-1 (240) or detail-3 (960) icosahedron
// and whose bounding sphere is at least 0.45 m — the boulders and the cavern shell, not a kid head.
module.exports = async (page, h) => {
  await h.sleep(12000);
  await h.step(120);
  return h.evaluate(() => {
    let scene = globalThis.ssCtx.active.root;
    while (scene.parent) scene = scene.parent;
    const openEdges = (geo) => {
      const p = geo.getAttribute('position');
      const group = new Int32Array(p.count);
      const seen = new Map();
      let n = 0;
      const q = (v) => Math.round(v / 1e-4);
      for (let i = 0; i < p.count; i++) {
        const k = q(p.getX(i)) + ',' + q(p.getY(i)) + ',' + q(p.getZ(i));
        let g = seen.get(k);
        if (g === undefined) { g = n++; seen.set(k, g); }
        group[i] = g;
      }
      const edges = new Map();
      for (let f = 0; f + 2 < p.count; f += 3) {
        const v = [group[f], group[f + 1], group[f + 2]];
        for (let e = 0; e < 3; e++) {
          const a = v[e], b = v[(e + 1) % 3];
          const k = a < b ? a + '-' + b : b + '-' + a;
          edges.set(k, (edges.get(k) ?? 0) + 1);
        }
      }
      let open = 0;
      for (const c of edges.values()) if (c !== 2) open++;
      return { verts: p.count, positions: n, edges: edges.size, open };
    };
    const out = [];
    scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.geometry.index) return;
      const p = o.geometry.getAttribute('position');
      if (!p || (p.count !== 240 && p.count !== 960)) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if (o.geometry.boundingSphere.radius < 0.45) return;
      const w = o.getWorldPosition(new globalThis.ssTHREE.Vector3());
      out.push({
        at: [+w.x.toFixed(2), +w.y.toFixed(2), +w.z.toFixed(2)],
        r: +o.geometry.boundingSphere.radius.toFixed(2),
        side: o.material && o.material.side === 1 ? 'back' : 'front',
        ...openEdges(o.geometry),
      });
    });
    return { meshes: out.length, allClosed: out.every((m) => m.open === 0), rocks: out };
  });
};
