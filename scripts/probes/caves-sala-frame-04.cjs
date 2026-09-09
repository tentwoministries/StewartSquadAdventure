// Re-frame of `caves-descent-salamander-04`: the first pass put the lens 3 m dead on the wall's
// normal, and the wall behind the salamander was unlit black — the animal read as floating rather
// than clinging (LESSONS.md §0 rule 5: look through the lens before saving it). This lens stands off
// the wall *and* up-stair, so the treads, the channel wall and the nearest hook-lamp are all in
// shot and the cling reads against something.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1&relief=chunky" scripts/probes/caves-sala-frame-04.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = {};
  out.lens = await h.evaluate(() => {
    const T = globalThis.ssTHREE;
    const scene = globalThis.ssKids[0].root.parent;
    const sal = scene.getObjectByName('salamander0');
    sal.updateMatrixWorld(true);
    const xA = new T.Vector3(), yA = new T.Vector3(), zA = new T.Vector3();
    sal.matrixWorld.extractBasis(xA, yA, zA);
    xA.normalize(); yA.normalize();
    // stand off the wall (+local y) and up-stair (+local x), and look back down at the animal
    const back = yA.clone().multiplyScalar(0.72).add(xA.clone().multiplyScalar(0.7)).normalize();
    const yaw = ((Math.atan2(-back.x, back.z) * 180) / Math.PI + 360) % 360;
    const o = globalThis.ssOrbit;
    o.current.target = [sal.position.x, sal.position.y + 0.12, sal.position.z];
    o.current.yaw = yaw; o.current.pitch = 16; o.current.d = 4.2;
    o.apply();
    return { sal: [+sal.position.x.toFixed(3), +sal.position.y.toFixed(3), +sal.position.z.toFixed(3)], yaw: +yaw.toFixed(2), pitch: 16, d: 4.2 };
  });
  // light the two lamps nearest the mouth so the wall the animal clings to is not black, then step
  // to the top of the heart's 8 s pulse so the green spots are at their brightest
  for (let i = 0; i < 4; i++) await h.key('0');
  await h.step(60);
  for (let i = 0; i < 40; i++) {
    const p = Number(((await h.hud()).find((l) => l.includes('heart pulse')) || '').split('heart pulse ')[1].slice(0, 4));
    if (p > 0.97) break;
    await h.step(12);
  }
  out.hud = await h.hud();
  out.file = await h.snap('caves-descent-salamander-04');
  return out;
};
