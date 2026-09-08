// Probe: the stepping harness is deterministic and the keys reach the scene (opus-fixes-runtime
// checks 1, 2 and 5). Reads the keyframe the URL loaded, proves the clock moves only under ssStep
// (two idle waits of over a second between reads), then presses T twice and Tab.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/frozen-night/?shot=S1&t=night&step=1" scripts/probes/runtime-step.cjs
module.exports = async (page, h) => {
  const out = { url: page.url() };
  await h.sleep(2000);
  out.kfAtLoad = await h.evaluate(() =>
    globalThis.ssKf ? globalThis.ssKf().name : (globalThis.document.getElementById('hud').textContent.match(/^time (\S+)/m) || [])[1] || null,
  );
  out.hud = await h.hud();
  if (!(await h.evaluate(() => !!globalThis.ssStep))) { out.note = 'no ssStep on this page (the Forest scene has its own main.ts)'; return out; }

  out.t_start = await h.step(0);
  await h.sleep(1500);
  out.t_after_1500ms_idle = await h.step(0);
  out.t_after_step60 = await h.step(60);
  await h.sleep(1000);
  out.t_after_1000ms_idle = await h.step(0);
  out.t_after_step120 = await h.step(120);
  out.advance_of_step60 = out.t_after_step60 - out.t_after_1500ms_idle;
  out.advance_of_step120 = out.t_after_step120 - out.t_after_1000ms_idle;
  out.drift_while_idle = [out.t_after_1500ms_idle - out.t_start, out.t_after_1000ms_idle - out.t_after_step60];

  const times = [];
  await h.key('t'); times.push(await h.evaluate(() => globalThis.ssKf().name));
  await h.key('t'); times.push(await h.evaluate(() => globalThis.ssKf().name));
  out.kf_after_two_T_presses = times;
  out.active_before_Tab = await h.evaluate(() => globalThis.ssActive().name);
  await h.key('Tab');
  out.active_after_Tab = await h.evaluate(() => globalThis.ssActive().name);
  return out;
};
