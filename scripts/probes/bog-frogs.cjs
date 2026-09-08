// Probe: the Bog's frogs live on the rendered lily pads (T-49, reel-fixes-bog-03 check 1).
// Reads globalThis.ssProbe.pads() / .frogs() — never the HUD's DOM text — then steps 120 s in
// 60-frame samples and measures: the closest pair of *seated* frogs, every seated frog's offset
// from its pad centre, each frog's jump count, the longest gap between jumps, the longest hop, and
// the heading range. Part B walks Collette forward (`w` held) and watches for the flee jump inside
// the bible's 3 m radius, with the water's ripple ring landing on the frog's new pad.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?shot=S1&t=night&step=1" scripts/probes/bog-frogs.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const out = { url: page.url(), kf: await h.evaluate(() => globalThis.ssKf().name) };

  // ---- the pad graph -------------------------------------------------------------------------
  const pads = await h.evaluate(() => globalThis.ssProbe.pads());
  const seatPads = pads.seats.map((i) => pads.list[i]);
  const seatPairs = [];
  for (let a = 0; a < seatPads.length; a++) for (let b = a + 1; b < seatPads.length; b++) seatPairs.push(Math.hypot(seatPads[a].x - seatPads[b].x, seatPads[a].z - seatPads[b].z));
  let padPairMin = Infinity;
  for (let a = 0; a < pads.list.length; a++) for (let b = a + 1; b < pads.list.length; b++) padPairMin = Math.min(padPairMin, Math.hypot(pads.list[a].x - pads.list[b].x, pads.list[a].z - pads.list[b].z));
  out.pad_graph = {
    rendered_pads: pads.rendered, usable_pads: pads.usable, seats: pads.seats,
    hop_m: pads.hop, near_walk_m: pads.nearWalk, min_pad_separation_m: Number(padPairMin.toFixed(3)),
    seat_degrees: pads.seats.map((i) => pads.list[i].deg),
    seat_min_degree: Math.min(...pads.seats.map((i) => pads.list[i].deg)),
    seat_walk_dist_m: pads.seats.map((i) => Number(pads.list[i].walk.toFixed(2))),
    seat_max_walk_dist_m: Number(Math.max(...pads.seats.map((i) => pads.list[i].walk)).toFixed(2)),
    seat_flowered: pads.seats.map((i) => pads.list[i].flower),
    closest_two_seats_m: Number(Math.min(...seatPairs).toFixed(2)),
    usable_degree_min: Math.min(...pads.degrees), usable_degree_max: Math.max(...pads.degrees),
    usable_pads_with_fewer_than_2_neighbours: pads.degrees.filter((d) => d < 2).length,
  };

  // ---- 120 s, sampled every 60 frames ----------------------------------------------------------
  const samples = [];
  let t = await h.step(0);
  const first = await h.evaluate(() => globalThis.ssProbe.frogs());
  const jumpAt = first.map(() => 0);       // clock of each frog's last counted jump
  const counts = first.map((f) => f.jumps);
  let maxGap = 0, gapOwner = -1, worstPair = Infinity, worstPairAt = null, worstPadOff = 0, maxHop = 0;
  let headingOut = 0, seatOffOwner = null, minDeg = 99, maxWalk = 0;
  for (let i = 0; i < 120; i++) {
    t = await h.step(60);
    const fs = await h.evaluate(() => globalThis.ssProbe.frogs());
    // jumps: the count only rises; a rise closes a gap
    fs.forEach((f, k) => {
      if (f.jumps > counts[k]) { maxGap = Math.max(maxGap, t - jumpAt[k]); if (maxGap === t - jumpAt[k]) gapOwner = k; jumpAt[k] = t; counts[k] = f.jumps; }
      if (Math.abs(f.heading) > Math.PI + 1e-6) headingOut++;
      maxHop = Math.max(maxHop, f.hop);
      minDeg = Math.min(minDeg, f.deg);
      maxWalk = Math.max(maxWalk, f.walk);
    });
    const seated = fs.filter((f) => !f.airborne);
    for (let a = 0; a < seated.length; a++) {
      const off = Math.hypot(seated[a].x - seated[a].padX, seated[a].z - seated[a].padZ);
      if (off > worstPadOff) { worstPadOff = off; seatOffOwner = { t: Number(t.toFixed(1)), frog: seated[a].i, off: Number(off.toFixed(3)) }; }
      for (let b = a + 1; b < seated.length; b++) {
        const d = Math.hypot(seated[a].x - seated[b].x, seated[a].z - seated[b].z);
        if (d < worstPair) { worstPair = d; worstPairAt = { t: Number(t.toFixed(1)), a: seated[a].i, b: seated[b].i, d: Number(d.toFixed(3)) }; }
      }
    }
    if (i % 20 === 0 || i === 119) samples.push({ t: Number(t.toFixed(1)), seated: seated.length, jumps: fs.map((f) => f.jumps), pads: fs.map((f) => f.pad) });
  }
  const last = await h.evaluate(() => globalThis.ssProbe.frogs());
  // a frog that has not jumped since its last counted one still has an open gap at the end
  last.forEach((f, k) => { maxGap = Math.max(maxGap, t - jumpAt[k]); });
  out.frogs_120s = {
    clock_s: Number(t.toFixed(2)),
    jump_counts: last.map((f) => f.jumps),
    jump_count_min: Math.min(...last.map((f) => f.jumps)), jump_count_max: Math.max(...last.map((f) => f.jumps)),
    longest_gap_between_jumps_s: Number(maxGap.toFixed(2)), longest_gap_frog: gapOwner,
    longest_hop_m: Number(maxHop.toFixed(3)),
    closest_two_seated_frogs_m: Number(worstPair.toFixed(3)), closest_pair_sample: worstPairAt,
    worst_seat_offset_from_pad_centre_m: Number(worstPadOff.toFixed(4)), worst_seat_sample: seatOffOwner,
    headings_outside_pi: headingOut,
    min_live_pad_degree: minDeg, max_distance_from_the_boards_m: Number(maxWalk.toFixed(2)),
    distinct_pads_at_end: new Set(last.map((f) => f.pad)).size,
    samples,
  };

  // ---- the flee jump at the bible's 3 m ---------------------------------------------------------
  const flee = await h.evaluate(() => {
    const w = globalThis.ssWorld, kid = globalThis.ssKids[0];
    const ripples = () => {
      let found = null;
      globalThis.ssKids[0].root.parent.traverse((o) => {
        const u = o.material && o.material.uniforms;
        if (u && u.uRipples && !found) found = u.uRipples.value.map((v) => [Number(v.x.toFixed(2)), Number(v.y.toFixed(2))]);
      });
      return found;
    };
    const log = [];
    let fired = null;
    const before = globalThis.ssProbe.frogs();
    // steer with the scene's own keys: W/A/S/D are camera-relative, so press the pair that best
    // matches the direction of the frog nearest the boards
    const target = before.slice().sort((a, b) => a.walk - b.walk)[0];
    const press = (want) => {
      const yaw = (globalThis.ssOrbit.current.yaw * Math.PI) / 180;
      const fwd = { x: Math.sin(yaw), z: -Math.cos(yaw) };
      const right = { x: -fwd.z, z: fwd.x };
      const keys = { w: fwd, s: { x: -fwd.x, z: -fwd.z }, d: right, a: { x: -right.x, z: -right.z } };
      globalThis.ssWalk.pressed.clear();
      for (const k of Object.keys(keys)) if (keys[k].x * want.x + keys[k].z * want.z > 0.35) globalThis.ssKey(k);
      return [...globalThis.ssWalk.pressed].join('');
    };
    for (let i = 0; i < 200 && !fired; i++) {
      const kx0 = kid.root.position.x, kz0 = kid.root.position.z;
      const goal = globalThis.ssProbe.frogs()[target.i];
      const dx = goal.seatX - kx0, dz = goal.seatZ - kz0, dl = Math.hypot(dx, dz) || 1;
      const held = press({ x: dx / dl, z: dz / dl });
      globalThis.ssStep(6);                       // 0.1 s a step
      const fs = globalThis.ssProbe.frogs();
      const kx = kid.root.position.x, kz = kid.root.position.z;
      const near = fs.map((f) => ({ i: f.i, d: Math.hypot(f.seatX - kx, f.seatZ - kz), jumps: f.jumps, airborne: f.airborne })).sort((a, b) => a.d - b.d)[0];
      if (i % 10 === 0) log.push({ step: i, held, kid: [Number(kx.toFixed(2)), Number(kz.toFixed(2))], nearest_frog: near.i, nearest_d: Number(near.d.toFixed(2)) });
      if (near.d < 3.0) {
        const start = near.i, d0 = near.d, j0 = before[start].jumps;
        // one second: does that frog jump?
        for (let k = 0; k < 10 && !fired; k++) {
          globalThis.ssStep(6);
          const now = globalThis.ssProbe.frogs()[start];
          if (now.jumps > fs[start].jumps) fired = { frog: start, distance_when_seen_m: Number(d0.toFixed(2)), seconds_to_jump: Number(((k + 1) * 0.1).toFixed(2)), jumps_before: j0, jumps_now: now.jumps, hop_m: Number(now.hop.toFixed(2)), airborne: now.airborne };
        }
      }
    }
    globalThis.ssWalk.pressed.clear();
    globalThis.ssStep(60);
    return { fired, log, kid_at: [Number(kid.root.position.x.toFixed(2)), Number(kid.root.position.z.toFixed(2))], ripples: ripples(), frogs_after: globalThis.ssProbe.frogs().map((f) => [Number(f.seatX.toFixed(2)), Number(f.seatZ.toFixed(2))]), hud: w.hud() };
  });
  out.flee = flee;
  return out;
};
