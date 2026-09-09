// Probe: the goblin loop, round 2 (T-63, T-64; brief `reel-fixes-meadow-04.md` check 2).
//
// The never-run rule (`LESSONS.md` Process row, this file's own scene): "a keyed mechanic is not
// done until a stepped probe has shown every state reached". So this steps the runtime one frame at
// a time — never waits for a screen — and records, for all three goblins:
//   · every state entered, and the time and distance at which each was first entered
//   · the brake rule: the distance at the frame `windup` opens (must be < REACH, not asymptotic)
//   · T-64's fan: at the frame the three are first all in `windup`, their pairwise distances and
//     the span of their bearings from the hero
//   · the club never enters the kid: through every `hit`, |club head − hero `bones.head`| (world)
//   · the arc lands: the club head's lowest point above the ground at the end of the arc
//   · nothing pops: the largest per-frame rotation of the club arm, per state
//   · facing: the root's world +x axis against `heading` at `bearing − 90°`, and headings wrapped
//
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/meadow-golden/?shot=S3&t=golden&step=1" scripts/probes/meadow-goblins.cjs
module.exports = async (page, h) => {
  const seconds = Number(process.env.SS_SECONDS || '34');
  const send = process.env.SS_SEND !== '0';
  await h.sleep(12000);
  return h.evaluate(
    ({ seconds, send }) => {
      const w = globalThis.ssWorld;
      const T = globalThis.ssTHREE;
      const hv = new T.Vector3();
      const ringAlpha = () => globalThis.ssKids[0].ring.material.uniforms.uAlpha.value;
      const heroHead = () => { globalThis.ssActive().bones.head.getWorldPosition(hv); return hv; };
      const out = { url: globalThis.location.href, at_load: w.probe(), log: [] };

      const N = 3;
      const seen = [new Set(), new Set(), new Set()];
      const firstAt = {}, firstD = {};
      const maxArm = {};                       // largest per-frame arm rotation, by state
      const lastQ = [null, null, null];
      let minClubToHead = Infinity, clubHits = 0, clubHitFrame = null;
      let landLow = [];                        // club-head clearance at the end of each arc
      let fan = null, fanLast = null;
      // the *sustained* fan: over every frame of the fight (all three alive, at least one winding
      // up), the worst pairwise separation and the worst bearing span the pack ever shows
      let fightMinPair = Infinity, fightMinSpan = Infinity, fightFrames = 0, unisonWindup = 0, unisonHit = 0;
      let maxHeading = 0, maxFaceErr = 0;
      let ringFlashFrames = 0, maxAlpha = 0;
      const windupSeenAt = [null, null, null];

      const qAngle = (a, b) => {
        const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
        return 2 * Math.acos(Math.min(1, d));
      };

      // phase A: 4 s untouched, so `idle` (the mill, the scratch, the look) is a state the log has
      // seen and not a state the probe assumed. Phase B: `0` sends them. Phase C: `g` (the Ground
      // Pound) fells them, so `dead` and the 6 s walk back out of the gap are seen too.
      const SEND_AT = 4, POUND_AT = seconds - 8;
      for (let s = 1; s <= seconds; s++) {
        if (send && s === SEND_AT + 1) { globalThis.ssKey('0'); out.sent = 'ssKey(0) at t=' + SEND_AT + 's'; }
        if (send && s === POUND_AT + 1) { globalThis.ssKey('g'); out.pounded = 'ssKey(g) at t=' + POUND_AT + 's'; }
        let p = null, t = 0;
        for (let f = 0; f < 60; f++) {
          t = globalThis.ssStep(1);
          p = w.probe();
          const hd = heroHead();
          for (const g of p.goblins) {
            if (!seen[g.i].has(g.state)) {
              seen[g.i].add(g.state);
              firstAt['g' + g.i + '.' + g.state] = Number(t.toFixed(3));
              firstD['g' + g.i + '.' + g.state] = Number(g.d.toFixed(3));
              if (g.state === 'windup' && windupSeenAt[g.i] === null) windupSeenAt[g.i] = Number(t.toFixed(3));
            }
            // nothing pops: the club arm's world rotation, frame to frame, per state. A felled
            // goblin is not drawn and its rig is frozen, so its frames are skipped and the tracker
            // is dropped: the spawn frame (on which it also teleports 15 m to the gap) is not a pop.
            if (!g.vis) { lastQ[g.i] = null; }
            else {
              if (lastQ[g.i]) {
                const a = qAngle(lastQ[g.i], g.armQ);
                if (!(g.state in maxArm) || a > maxArm[g.state]) maxArm[g.state] = a;
              }
              lastQ[g.i] = g.armQ;
            }
            // the heading stays wrapped to [−π, π], and the built-along-+x facing holds
            maxHeading = Math.max(maxHeading, Math.abs(g.heading));
            const wantX = Math.sin(g.heading), wantZ = Math.cos(g.heading);
            maxFaceErr = Math.max(maxFaceErr, Math.hypot(g.fwd[0] - wantX, g.fwd[1] - wantZ));
            if (g.state === 'hit') {
              clubHits++;
              const dd = Math.hypot(g.club[0] - hd.x, g.club[1] - hd.y, g.club[2] - hd.z);
              if (dd < minClubToHead) { minClubToHead = dd; clubHitFrame = { t: Number(t.toFixed(3)), i: g.i, d: Number(dd.toFixed(3)), st: Number(g.st.toFixed(4)) }; }
              if (g.st >= 0.1) landLow.push(Number(g.clubLow.toFixed(4)));
            }
          }
          // T-64: the frame the three are first all in windup at once
          const all = p.goblins.filter((g) => g.state === 'windup').length === N;
          if (all && !fan) fan = snap(p, t);
          // ... and the frame the last of them has first reached windup (the looser reading)
          if (!fanLast && windupSeenAt.every((v) => v !== null)) fanLast = snap(p, t);
          const alive = p.goblins.filter((g) => g.vis).length === N;
          const winding = p.goblins.filter((g) => g.state === 'windup').length;
          if (alive && winding > 0) {
            const sn = snap(p, t);
            fightFrames++;
            if (sn.min_pair_m < fightMinPair) fightMinPair = sn.min_pair_m;
            if (sn.bearing_span_deg < fightMinSpan) fightMinSpan = sn.bearing_span_deg;
          }
          if (alive && winding === N) unisonWindup++;
          if (alive && p.goblins.filter((g) => g.state === 'hit').length > 1) unisonHit++;
          const a = ringAlpha();
          if (a > 0.4) ringFlashFrames++;
          maxAlpha = Math.max(maxAlpha, a);
        }
        out.log.push(
          't=' + t.toFixed(2) + 's  ' +
          p.goblins.map((g) => 'g' + g.i + ' ' + (g.state + '       ').slice(0, 7) + ' d=' + g.d.toFixed(2) + 'm b=' + g.bearing.toFixed(0) + '°').join(' | ') +
          '  ringAlpha=' + ringAlpha().toFixed(2) + ' felled=' + p.felled,
        );
      }

      function snap(p, t) {
        const gs = p.goblins;
        const pairs = [];
        for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) pairs.push(Number(Math.hypot(gs[i].x - gs[j].x, gs[i].z - gs[j].z).toFixed(3)));
        const bs = gs.map((g) => g.bearing).sort((a, b) => a - b);
        let span = 0;
        for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
          let dd = Math.abs(bs[i] - bs[j]) % 360; if (dd > 180) dd = 360 - dd;
          span = Math.max(span, dd);
        }
        return {
          t: Number(t.toFixed(3)),
          states: gs.map((g) => g.state),
          d: gs.map((g) => Number(g.d.toFixed(3))),
          bearings: gs.map((g) => Number(g.bearing.toFixed(1))),
          pairwise_m: pairs, min_pair_m: Math.min.apply(null, pairs), bearing_span_deg: Number(span.toFixed(1)),
        };
      }

      const all = new Set();
      for (const s of seen) for (const v of s) all.add(v);
      out.states_reached_per_goblin = seen.map((s) => [...s]);
      out.states_reached = [...all].sort();
      out.every_state_all_three = seen.every((s) => ['idle', 'chase', 'windup', 'hit', 'recover', 'dead'].every((k) => s.has(k)));
      out.note_no_alert_state = 'the demo machine has no `alert` state: idle to chase is the bible notice at 14 m';
      out.first_entry_times = firstAt;
      out.distance_at_first_entry = firstD;
      out.brake_crosses_trigger = [0, 1, 2].map((i) => firstD['g' + i + '.windup']);
      out.fan_all_three_in_windup = fan;
      out.fan_last_reaches_windup = fanLast;
      out.fan_sustained = {
        frames_with_a_windup: fightFrames,
        worst_pairwise_m: fightFrames ? fightMinPair : null,
        worst_bearing_span_deg: fightFrames ? fightMinSpan : null,
        frames_all_three_winding_up: unisonWindup,
        frames_two_or_more_hitting: unisonHit,
      };
      out.club_hit_frames = clubHits;
      out.min_club_to_hero_head_m = Number(minClubToHead.toFixed(3));
      out.min_club_frame = clubHitFrame;
      out.club_low_at_arc_end_m = landLow.slice(0, 24);
      out.club_low_max_m = landLow.length ? Math.max.apply(null, landLow) : null;
      out.max_arm_rot_per_frame_rad = maxArm;
      out.max_abs_heading_rad = Number(maxHeading.toFixed(4));
      out.max_facing_error = Number(maxFaceErr.toFixed(5));
      out.ring_flash_frames = ringFlashFrames;
      out.ring_alpha_max = maxAlpha;
      out.hud = w.hud();
      out.final = w.probe();
      return out;
    },
    { seconds, send },
  );
};
