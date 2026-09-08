// Probe: can a kid walk away from every station? (T-47, `reel-fixes-stations-03.md` check 1.)
// One `sandbox-drive` invocation walks every shared-runtime scene x every station and extra:
// desert-noon, bog-night, frozen-night, caves-descent, shadow-wrong, meadow-golden, rim-dawn.
// `flight-golden` is skipped (its stations are ridden, and another builder holds its main.ts);
// `forest-dusk` is skipped (it keeps its own main.ts and has no shared station contract).
//
// At each station, with `&step=1` and `?t=` the scene's default:
//   wait for ssWorld/ssStep, ssStep(30) to settle, read the active kid's position and ssOrbit.yaw,
//   read the walkability diagnostic at the placement (groundY vs waterY, walkable(), the blocker
//   set the runtime actually uses, a 36-bearing scan of one 0.6 m step),
//   ssKey('w'), ssStep(60) = one second of sim, read again  -> moved-W,
//   dispatch keyup w, ssStep(30) to let the velocity decay, read the S start,
//   ssKey('s'), ssStep(60), read again -> moved-S, dispatch keyup s.
// Pass = moved-W >= 1.0 m OR moved-S >= 1.0 m (T-47's number: W held for a second moves >= 1 m).
//
//   SS_TAG=before node scripts/sandbox-drive.cjs \
//     "http://localhost:5173/sandbox/desert-noon/?shot=S1&t=noon&step=1" \
//     scripts/probes/runtime-stations.cjs
// SS_TAG names the JSON/markdown dropped beside the probe run (default `run`); SS_OUT is the
// directory for them (default `tmp/`, which is gitignored — writing inside the served tree during a
// sweep makes Vite reload the page and destroys the execution context).
// SS_ONLY=bog-night limits the sweep to one scene (a re-check after an edit).
// Two diagnostic modes, both one station at a time:
//   SS_SCAN="<scene>:<shot>[:reach]"  a 17 x 17 m walkability map round the placement, a four-second
//     hold of W and of S integrated exactly as walk.ts integrates, and a march outward (0.25 m
//     rings x 36 bearings, out to `reach`) for a placement whose one-second W *and* S clear 1 m,
//     each candidate carrying its NDC through the station's own camera (is it still in frame?).
//   SS_TRY="<scene>:<shot>:<x>:<z>:<facing>:<framename>"  nudge the kid in the live page and save
//     the frame, to look through the lens before editing the scene. Leave x/z/facing empty to save
//     the placement as the scene ships it. The frames that ship come from the edit, never from here.
const fs = require('fs');
const path = require('path');

const BASE = process.env.SS_BASE || 'http://localhost:5173';
const PASS = 1.0;

// scene id -> the scene's own defaultTime and its stations + extras, read off each main.ts
const SCENES = [
  { scene: 'desert-noon', t: 'noon', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU', 'PY', 'AR'] },
  { scene: 'bog-night', t: 'night', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU', 'TS', 'SN'] },
  { scene: 'frozen-night', t: 'night', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU', 'PG', 'OB'] },
  { scene: 'caves-descent', t: 'half', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU', 'WF', 'HT'] },
  { scene: 'shadow-wrong', t: 'wrong', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU', 'SW', 'DE'] },
  { scene: 'meadow-golden', t: 'golden', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU'] },
  { scene: 'rim-dawn', t: 'dawn', shots: ['S1', 'S2', 'S3', 'S4', 'W1', 'L1', 'CU'] },
];

const SKIPPED = [
  { scene: 'flight-golden', why: 'the stations are ridden (a cutscene spline), and another builder holds its main.ts this round' },
  { scene: 'forest-dusk', why: 'its own main.ts, not the shared runtime: no SceneDef stations/place contract' },
];

/** The active kid's position and the orbit yaw, read from the runtime (never the HUD DOM). */
function readPos() {
  const a = globalThis.ssActive();
  const p = a.root.position;
  return { name: a.name, x: p.x, y: p.y, z: p.z, yaw: globalThis.ssOrbit.current.yaw, rotY: a.root.rotation.y };
}

/** Replica of walk.ts's step test at the placement: why a step is refused, in the runtime's own terms. */
function diagnose(yaw) {
  const W = globalThis.ssWorld;
  const a = globalThis.ssActive();
  const px = a.root.position.x, pz = a.root.position.z;
  const waterY = W.waterY === undefined ? -0.25 : W.waterY;   // walk.ts default
  const maxStep = W.maxStep;
  const walkOk = (x, z) => (W.walkable ? !!W.walkable(x, z) : true);
  const gy = (x, z) => W.groundY(x, z);
  // scene.ts blockersFor(): the blockers the hero already stands inside are dropped at load
  const active = W.blockers.filter((c) => Math.hypot(c.x - px, c.z - pz) > c.r + 0.6);
  const g0 = gy(px, pz);
  const step = (dx, dz, dist) => {
    let nx = px + dx * dist, nz = pz + dz * dist;
    for (const c of active) {
      const ax = nx - c.x, az = nz - c.z, d = Math.hypot(ax, az), r = c.r + 0.35;
      if (d < r && d > 0.001) { nx = c.x + (ax / d) * r; nz = c.z + (az / d) * r; }
    }
    const ny = gy(nx, nz);
    const okWater = ny > waterY, okWalk = walkOk(nx, nz);
    const okStep = maxStep === undefined || Math.abs(ny - g0) <= maxStep;
    return { to: [Number(nx.toFixed(2)), Number(nz.toFixed(2))], groundY: Number(ny.toFixed(3)), okWater, okWalk, okStep, ok: okWater && okWalk && okStep };
  };
  const rad = (yaw * Math.PI) / 180;
  const fx = Math.sin(rad), fz = -Math.cos(rad);           // walk.ts: W is away from the camera
  const open = [];
  for (let i = 0; i < 36; i++) {
    const b = (i * 10 * Math.PI) / 180;
    if (step(Math.sin(b), Math.cos(b), 0.6).ok) open.push(i * 10);
  }
  let nb = null;
  for (const c of W.blockers) {
    const d = Math.hypot(c.x - px, c.z - pz), gap = d - (c.r + 0.35);
    if (!nb || gap < nb.gap) nb = { at: [Number(c.x.toFixed(2)), Number(c.z.toFixed(2))], r: Number(c.r.toFixed(2)), d: Number(d.toFixed(2)), gap: Number(gap.toFixed(2)), droppedAtLoad: d <= c.r + 0.6 };
  }
  return {
    at: [Number(px.toFixed(2)), Number(pz.toFixed(2))],
    groundY: Number(g0.toFixed(3)), waterY, maxStep: maxStep === undefined ? null : maxStep,
    walkableHere: walkOk(px, pz),
    blockers: { total: W.blockers.length, activeAfterLoadFilter: active.length, nearest: nb },
    wStep: step(fx, fz, 0.6), sStep: step(-fx, -fz, 0.6),
    openBearings: open.length, openBearingsSample: open.slice(0, 12),
  };
}

function reasonOf(d) {
  if (!d) return '';
  const bits = [];
  const fail = (s, tag) => { if (!s.okWater) bits.push(tag + ': ground ' + s.groundY + ' <= waterY ' + d.waterY); else if (!s.okWalk) bits.push(tag + ': walkable() false at ' + s.to.join(',')); else if (!s.okStep) bits.push(tag + ': step ' + Math.abs(s.groundY - d.groundY).toFixed(2) + ' m > maxStep ' + d.maxStep); };
  fail(d.wStep, 'W');
  fail(d.sStep, 'S');
  if (d.blockers.nearest && d.blockers.nearest.gap < 0.4 && !d.blockers.nearest.droppedAtLoad) bits.push('blocker ring ' + d.blockers.nearest.gap.toFixed(2) + ' m away (r ' + d.blockers.nearest.r + ')');
  bits.push(d.openBearings + '/36 bearings open');
  return bits.join('; ');
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const f2 = (n) => Number(n.toFixed(2));

/**
 * SS_SCAN mode. Runs in the page at one station: a walkability map round the placement, a long hold
 * of W and of S integrated exactly as walk.ts does, and a march outward for a placement that walks.
 * `a` = { px, pz, yaw, seconds, reach } — the placement is read from the runtime by the caller.
 */
function scanPlacement(a) {
  const W = globalThis.ssWorld;
  const waterY = W.waterY === undefined ? -0.25 : W.waterY;
  const maxStep = W.maxStep;
  const gy = (x, z) => W.groundY(x, z);
  const wk = (x, z) => (W.walkable ? !!W.walkable(x, z) : true);
  const dt = 1 / 60, TOP = 2.0;   // walk.ts: no shift = 2.0 m/s, vel.lerp(target, dt*8)
  // where a candidate lands in the station's own frame: NDC through the live station camera, so a
  // move is judged as a composition and not as arithmetic (LESSONS Camera row 4)
  const cam = globalThis.ssCtx ? globalThis.ssCtx.camera : null;
  const THREE = globalThis.ssTHREE;
  const ndcOf = (x, y, z) => {
    if (!cam || !THREE) return null;
    const v = new THREE.Vector3(x, y, z).project(cam);
    return [Number(v.x.toFixed(3)), Number(v.y.toFixed(3))];
  };
  const blockersAt = (x, z) => W.blockers.filter((c) => Math.hypot(c.x - x, c.z - z) > c.r + 0.6);
  const sim = (px, pz, yaw, sign, seconds) => {
    const bl = blockersAt(px, pz);
    const rad = (yaw * Math.PI) / 180;
    const fx = Math.sin(rad) * sign, fz = -Math.cos(rad) * sign;
    let x = px, z = pz, vx = 0, vz = 0;
    const marks = [];
    const n = Math.round(seconds * 60);
    for (let i = 0; i < n; i++) {
      const k = Math.min(1, dt * 8);
      vx += (fx * TOP - vx) * k; vz += (fz * TOP - vz) * k;
      if (Math.hypot(vx, vz) > 0.05) {
        let nx = x + vx * dt, nz = z + vz * dt;
        for (const c of bl) { const ax = nx - c.x, az = nz - c.z, d = Math.hypot(ax, az), r = c.r + 0.35; if (d < r && d > 0.001) { nx = c.x + (ax / d) * r; nz = c.z + (az / d) * r; } }
        const ny = gy(nx, nz);
        const ok = ny > waterY && wk(nx, nz) && (maxStep === undefined || Math.abs(ny - gy(x, z)) <= maxStep);
        if (ok) { x = nx; z = nz; } else { vx *= 0.5; vz *= 0.5; }
      }
      if ((i + 1) % 60 === 0) marks.push(Number(Math.hypot(x - px, z - pz).toFixed(2)));
    }
    return { end: [Number(x.toFixed(2)), Number(z.toFixed(2))], metresPerSecond: marks };
  };
  // the map: 1 m cells, '~' below waterY (the water wall), 'x' walkable() false, '#' inside a
  // blocker ring, '.' walkable; 'K' the placement itself
  const R = 8, map = [];
  for (let dz = -R; dz <= R; dz++) {
    let line = '';
    for (let dx = -R; dx <= R; dx++) {
      const x = a.px + dx, z = a.pz + dz;
      if (dx === 0 && dz === 0) { line += 'K'; continue; }
      const g = gy(x, z);
      if (g <= waterY) line += '~';
      else if (!wk(x, z)) line += 'x';
      else if (W.blockers.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 0.35)) line += '#';
      else line += '.';
    }
    map.push('z' + String(a.pz + dz).padStart(6) + ' ' + line);
  }
  // march outward for a placement whose one-second W *and* S both clear 1 m
  const cands = [];
  for (let r = 0.5; r <= a.reach + 1e-9; r += 0.25) {
    for (let i = 0; i < 36; i++) {
      const b = (i * 10 * Math.PI) / 180;
      const cx = a.px + r * Math.sin(b), cz = a.pz + r * Math.cos(b);
      const g = gy(cx, cz);
      if (g <= waterY || !wk(cx, cz)) continue;
      if (W.blockers.some((c) => Math.hypot(c.x - cx, c.z - cz) < c.r + 0.35)) continue;
      const w1 = sim(cx, cz, a.yaw, 1, 1);
      const s1 = sim(cx, cz, a.yaw, -1, 1);
      cands.push({ move: Number(r.toFixed(2)), bearing: i * 10, at: [Number(cx.toFixed(2)), Number(cz.toFixed(2))], groundY: Number(g.toFixed(3)), w1: w1.metresPerSecond[0], s1: s1.metresPerSecond[0], ndc: ndcOf(cx, g + 0.9, cz) });
    }
  }
  const good = cands.filter((c) => c.w1 >= 1.0 && c.s1 >= 1.0).sort((p, q) => p.move - q.move || q.w1 - p.w1);
  return {
    at: [Number(a.px.toFixed(2)), Number(a.pz.toFixed(2))], yaw: a.yaw, groundY: Number(gy(a.px, a.pz).toFixed(3)), waterY,
    camera: cam ? [Number(cam.position.x.toFixed(2)), Number(cam.position.y.toFixed(2)), Number(cam.position.z.toFixed(2))] : null,
    ndcHere: ndcOf(a.px, gy(a.px, a.pz) + 0.9, a.pz),
    holdW: sim(a.px, a.pz, a.yaw, 1, a.seconds), holdS: sim(a.px, a.pz, a.yaw, -1, a.seconds),
    map, candidatesTried: cands.length, best: good.slice(0, 900),
  };
}

module.exports = async (page, h) => {
  const tag = (process.env.SS_TAG || 'run').toLowerCase();
  const only = process.env.SS_ONLY || '';
  const scan = process.env.SS_SCAN || '';   // "<scene>:<shot>[:reach]"
  const tryAt = process.env.SS_TRY || '';   // "<scene>:<shot>:<x>:<z>:<facing>:<framename>" — preview
  if (tryAt) {
    // Look through the station's lens at a candidate placement before editing the scene (LESSONS
    // Camera row 4). The kid is nudged in the live page only; the shipped frame comes from the edit.
    const [scene, shot, x, z, face, name] = tryAt.split(':');
    const s = SCENES.find((q) => q.scene === scene);
    if (!s) throw new Error('SS_TRY: unknown scene ' + scene);
    const url = BASE + '/sandbox/' + scene + '/?shot=' + shot + '&t=' + s.t + '&step=1';
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep && !!globalThis.ssActive, { timeout: 60000 });
    await h.sleep(12000);
    const moved = await page.evaluate((q) => {
      const k = globalThis.ssActive();
      if (q.x !== '' && q.x !== undefined) {
        const nx = Number(q.x), nz = Number(q.z);
        k.root.position.set(nx, globalThis.ssWorld.groundY(nx, nz), nz);
        if (q.face !== '' && q.face !== undefined) k.face(Number(q.face));
        globalThis.ssWalk.setHero(k.root);
      }
      const p = k.root.position;
      const v = new globalThis.ssTHREE.Vector3(p.x, p.y + 0.9, p.z).project(globalThis.ssCtx.camera);
      return { kid: k.name, at: [Number(p.x.toFixed(2)), Number(p.y.toFixed(3)), Number(p.z.toFixed(2))], ndc: [Number(v.x.toFixed(3)), Number(v.y.toFixed(3))], groundY: Number(globalThis.ssWorld.groundY(p.x, p.z).toFixed(3)) };
    }, { x, z, face });
    await h.step(120);
    const file = await h.snap(String(name).toLowerCase());
    return { tryAt, moved, file };
  }
  if (scan) {
    const [scene, shot, reach] = scan.split(':');
    const s = SCENES.find((q) => q.scene === scene);
    if (!s) throw new Error('SS_SCAN: unknown scene ' + scene);
    const url = BASE + '/sandbox/' + scene + '/?shot=' + shot + '&t=' + s.t + '&step=1';
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep && !!globalThis.ssActive, { timeout: 60000 });
    await h.sleep(600);
    await h.step(30);
    const p0 = await page.evaluate(readPos);
    const out = await page.evaluate(scanPlacement, { px: p0.x, pz: p0.z, yaw: p0.yaw, seconds: 4, reach: Number(reach || '2.5') });
    console.error('\n' + scene + ' ' + shot + ' — ' + p0.name + ' at ' + out.at.join(', ') + ', yaw ' + out.yaw + ', groundY ' + out.groundY + ' (waterY ' + out.waterY + ')');
    console.error('hold W 4 s: ' + JSON.stringify(out.holdW) + '\nhold S 4 s: ' + JSON.stringify(out.holdS));
    console.error('map (1 m cells, x east ->, z south v; ~ water, x not walkable, # blocker, K the kid):');
    console.error('        x' + String(p0.x - 8).slice(0, 6) + ' .. x' + String(p0.x + 8).slice(0, 6));
    for (const l of out.map) console.error(l);
    return { scan, station: { at: out.at, yaw: out.yaw, groundY: out.groundY, waterY: out.waterY }, holdW: out.holdW, holdS: out.holdS, candidatesTried: out.candidatesTried, best: out.best };
  }
  const rows = [];
  const list = only ? SCENES.filter((s) => s.scene === only) : SCENES;
  for (const s of list) {
    for (const shot of s.shots) {
      const url = BASE + '/sandbox/' + s.scene + '/?shot=' + shot + '&t=' + s.t + '&step=1';
      // Vite's HMR reloads the page when any watched file changes (other builders are editing these
      // scene folders in parallel), which destroys the execution context mid-run: retry the station.
      let row = null, lastErr = null;
      for (let attempt = 1; attempt <= 3 && !row; attempt++) {
        try {
          await page.goto(url, { waitUntil: 'load' });
          await page.waitForFunction(() => !!globalThis.ssWorld && !!globalThis.ssStep && !!globalThis.ssActive, { timeout: 60000 });
          await h.sleep(600);
          await h.step(30);
          const p0 = await page.evaluate(readPos);
          const diag = await page.evaluate(diagnose, p0.yaw);
          await h.key('w');
          await h.step(60);
          const p1 = await page.evaluate(readPos);
          await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 'w' })));
          await h.step(30);
          const p2 = await page.evaluate(readPos);
          await h.key('s');
          await h.step(60);
          const p3 = await page.evaluate(readPos);
          await page.evaluate(() => globalThis.dispatchEvent(new globalThis.KeyboardEvent('keyup', { key: 's' })));
          const movedW = dist(p0, p1), movedS = dist(p2, p3);
          const pass = movedW >= PASS || movedS >= PASS;
          row = {
            scene: s.scene, shot, kid: p0.name, yaw: p0.yaw,
            at: [f2(p0.x), f2(p0.z)], movedW: f2(movedW), movedS: f2(movedS), pass,
            reason: pass ? '' : reasonOf(diag), diag, attempts: attempt,
          };
        } catch (e) {
          lastErr = e;
          console.error('[stations] ' + s.scene + ' ' + shot + ' attempt ' + attempt + ' failed: ' + (e && e.message ? e.message : e));
          await h.sleep(1500);
        }
      }
      if (!row) throw lastErr;
      rows.push(row);
      console.error('[stations] ' + s.scene + ' ' + shot + ' ' + row.kid + ' W ' + row.movedW + ' S ' + row.movedS + ' ' + (row.pass ? 'PASS' : 'FAIL ' + row.reason));
    }
  }
  const header = '| scene | shot | kid | at (x,z) | yaw | moved-W m | moved-S m | pass | reason |';
  const sep = '|---|---|---|---|---|---|---|---|---|';
  const lines = rows.map((r) => '| ' + [r.scene, r.shot, r.kid, r.at.join(', '), r.yaw, r.movedW.toFixed(2), r.movedS.toFixed(2), r.pass ? 'PASS' : '**FAIL**', r.reason || ''].join(' | ') + ' |');
  const skips = SKIPPED.map((s) => '| ' + s.scene + ' | — | — | — | — | — | — | skipped | ' + s.why + ' |');
  const table = [header, sep, ...lines, ...skips].join('\n');
  const dir = process.env.SS_OUT || path.resolve(__dirname, '..', '..', 'tmp', 'probes');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'stations-' + tag + '.md'), table + '\n', 'utf8');
  fs.writeFileSync(path.join(dir, 'stations-' + tag + '.json'), JSON.stringify(rows, null, 2), 'utf8');
  console.error('\n' + table + '\n');
  return {
    tag, pass: PASS, stations: rows.length,
    failing: rows.filter((r) => !r.pass).map((r) => r.scene + ' ' + r.shot + ' — W ' + r.movedW.toFixed(2) + ' S ' + r.movedS.toFixed(2) + ' — ' + r.reason),
    passing: rows.filter((r) => r.pass).length,
    skipped: SKIPPED,
    files: [path.join(dir, 'stations-' + tag + '.md'), path.join(dir, 'stations-' + tag + '.json')],
  };
};
