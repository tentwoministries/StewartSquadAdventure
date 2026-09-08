// Probe (round 2): the occluder in a station's frame, identified instead of guessed at. Prints the
// station's camera position in the ground plane and every pine still standing within SS_R metres of
// it, with distance and bearing, so "an unlit canopy slab fills the right third" becomes a named
// instance the scene can clear (a Forest pine's canopy skirt starts at 1.4 m and is 4.9 m across,
// so any pine inside about 12 m of a low camera is a slab).
//   SS_SHOT=SW SS_R=22 node scripts/sandbox-drive.cjs \
//     "http://localhost:5173/sandbox/shadow-wrong/?shot=SW&t=wrong&step=1" scripts/probes/shadow-trees.cjs
module.exports = async (page, h) => {
  const shot = process.env.SS_SHOT || 'SW';
  const rad = Number(process.env.SS_R || '22');
  await h.sleep(9000);
  const cam = await h.evaluate((s) => globalThis.ssProbe.camAt(s), shot);
  if (!cam) throw new Error(`no station ${shot}`);
  const trees = await h.evaluate((a) => globalThis.ssProbe.treesNear(a[0], a[1], a[2]), [cam[0], cam[1], rad]);
  return { shot, camXZ: cam, radius: rad, trees };
};
