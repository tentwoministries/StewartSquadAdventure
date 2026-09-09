// A6 (`docs/qa/briefs/reel-fixes-04-fixes.md`): reshoot the salamander read. Round 1's
// `caves-descent-salamander-04-02` is a pale animal on a black plane — it reads as floating, the
// exact complaint T-62 exists to answer — because the lens stood square on to an unlit wall with
// nothing else in shot.
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/caves-descent/?shot=S1&t=half&step=1&relief=chunky" scripts/probes/caves-sala-frame-04b.cjs
//
// This lens stands 2.5 m off at pitch 12°, up-stair of the animal and out from the wall, so the
// frame carries **the lamp-lit wall, the wall's top edge (the tier's rim above it) and at least two
// treads below**, with the animal mid-frame. Quartz's hook-lamps are all lit first (`0` presses):
// a lit hook-lamp is 9 cd over 8 m, so the rock the animal clings to is lit rock, not a black plane.
// Then the clock is stepped to the top of the heart's 8 s pulse so the green spots are brightest.
const SAL = Number(process.env.SS_SAL || 0);
const D = Number(process.env.SS_D || 2.5);
const PITCH = Number(process.env.SS_PITCH || 12);
const UP = Number(process.env.SS_UP || 0.25);
const NAME = process.env.SS_NAME || 'caves-descent-salamander-04b';
const A = Number(process.env.SS_A || 0.82);   // how far off the wall the lens stands
const B = Number(process.env.SS_B || 0.57);   // how far up-stair (negative: down-stair)
const KID = process.env.SS_KID === undefined ? 1 : Number(process.env.SS_KID); // stand a kid on the tread beside it
const KIDARC = process.env.SS_KIDARC === undefined ? -1.4 : Number(process.env.SS_KIDARC);

module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { sal: SAL, d: D, pitch: PITCH, up: UP };
  // light every lamp: 14 hooks plus Quartz's
  for (let i = 0; i < 16; i++) await h.key('0');
  await h.step(90);
  out.lens = await h.evaluate(({ sal, d, pitch, up, a, b, kid, kidArc }) => {
    const T = globalThis.ssTHREE;
    const scene = globalThis.ssKids[0].root.parent;
    const s = scene.getObjectByName(`salamander${sal}`);
    s.updateMatrixWorld(true);
    const xA = new T.Vector3(), yA = new T.Vector3(), zA = new T.Vector3();
    s.matrixWorld.extractBasis(xA, yA, zA);
    xA.normalize(); yA.normalize();
    // stand off the wall (+local y, the wall's outward normal) and up-stair (+local x), and look
    // back down at the animal: the treads then run away below it and the wall fills the far side
    const back = yA.clone().multiplyScalar(a).add(xA.clone().multiplyScalar(b)).normalize();
    const yaw = ((Math.atan2(-back.x, back.z) * 180) / Math.PI + 360) % 360;
    const o = globalThis.ssOrbit;
    o.current.target = [s.position.x, s.position.y + up, s.position.z];
    o.current.yaw = yaw; o.current.pitch = pitch; o.current.d = d;
    o.apply();
    const state = globalThis.ssCaves.salamanders()[sal];
    // a kid on the tread beside the animal: the scale that says how big it is, and the one light
    // the caves actually put on a stair wall (the selection ring carries a 3 cd point light)
    let kidAt = null;
    if (kid) {
      const w = globalThis.ssWorld, liam = globalThis.ssKids[0];
      for (const off of [1.5, 1.2, 1.8, 0.9]) {
        const q = globalThis.ssCaves.stairPt(state.path, state.arc + kidArc);
        const px = q.x + q.nx * off * state.side, pz = q.z + q.nz * off * state.side;   // toward the wall the animal is on
        if (globalThis.ssCaves.stairY(px, pz) === null) continue;
        liam.root.position.set(px, w.groundY(px, pz), pz);
        liam.face((Math.atan2(-yA.x, -yA.z) * 180) / Math.PI);
        kidAt = [+px.toFixed(2), +w.groundY(px, pz).toFixed(3), +pz.toFixed(2)];
        break;
      }
    }
    return {
      sal: [+s.position.x.toFixed(3), +s.position.y.toFixed(3), +s.position.z.toFixed(3)],
      wallNormal: [+yA.x.toFixed(3), +yA.y.toFixed(3), +yA.z.toFixed(3)],
      yaw: +yaw.toFixed(2), pitch, d, state,
      kidAt,
      lens: [+globalThis.ssCtx.camera.position.x.toFixed(2), +globalThis.ssCtx.camera.position.y.toFixed(2), +globalThis.ssCtx.camera.position.z.toFixed(2)],
    };
  }, { sal: SAL, d: D, pitch: PITCH, up: UP, a: A, b: B, kid: KID, kidArc: KIDARC });
  for (let i = 0; i < 40; i++) {
    const p = Number(((await h.hud()).find((l) => l.includes('heart pulse')) || '').split('heart pulse ')[1].slice(0, 4));
    if (p > 0.97) break;
    await h.step(12);
  }
  out.hud = await h.hud();
  out.file = await h.snap(NAME);
  return out;
};
