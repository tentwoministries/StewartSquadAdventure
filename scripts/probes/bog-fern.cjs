// Probe: Mistweaver Fern reads as a person (T-50, reel-fixes-bog-03 check 2). Measures her bounding
// box (canon 1.55 m) and the staff's (canon 1.9 m), the max sway lean in radians over 200 stepped
// frames and over a full minute (her two rates are 0.40 and 0.53 rad/s, so 200 frames is a third of
// one cycle), her facing bearing from the built mesh, and the hook lantern's colour, candela and
// range. Then saves the frame the URL asks for: `&fern=1` is the ssOrbit close-up on her head,
// otherwise the station's own frame.
//   node scripts/sandbox-drive.cjs "http://localhost:5173/sandbox/bog-night/?shot=S1&t=night&step=1&fern=1" scripts/probes/bog-fern.cjs
module.exports = async (page, h) => {
  await h.sleep(12000);
  const url = page.url();
  const m = /[?&]shot=([^&]+)/.exec(url);
  const shot = (m ? m[1] : 's1').toLowerCase();
  const wantFern = /[?&]fern=1/.test(url);
  const out = { url, shot, kf: await h.evaluate(() => globalThis.ssKf().name) };

  out.fern = await h.evaluate(() => {
    const THREE = globalThis.ssTHREE;
    const scene = globalThis.ssKids[0].root.parent;
    const root = scene.getObjectByName('bog.fern'), lean = scene.getObjectByName('bog.fern.lean');
    const body = scene.getObjectByName('bog.fern.body'), hood = scene.getObjectByName('bog.fern.hood');
    const staff = scene.getObjectByName('bog.fern.staff');
    globalThis.ssStep(1);
    const box = new THREE.Box3().setFromObject(body).union(new THREE.Box3().setFromObject(hood));
    const sbox = new THREE.Box3().setFromObject(staff);
    // her facing, read off the built mesh: local +x through the root's world quaternion
    const f = new THREE.Vector3(1, 0, 0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    const bearing = (Math.atan2(f.x, -f.z) * 180 / Math.PI + 360) % 360;
    // the lean: the angle her local up makes with world up, sampled every frame
    const up = new THREE.Vector3();
    const lean1 = () => {
      up.set(0, 1, 0).applyQuaternion(lean.quaternion);
      return Math.acos(Math.min(1, up.y));
    };
    const scan = (n) => { let m = 0; const s = []; for (let i = 0; i < n; i++) { globalThis.ssStep(1); const l = lean1(); m = Math.max(m, l); if (i % 200 === 0) s.push(Number(l.toFixed(4))); } return { max: Number(m.toFixed(4)), samples: s }; };
    const over200 = scan(200);
    const over3600 = scan(3600);
    const lanterns = [];
    scene.traverse((o) => { if (o.isPointLight) lanterns.push({ colour: '#' + o.color.getHexString().toUpperCase(), cd: Number(o.intensity.toFixed(2)), range: o.distance, at: [Number(o.position.x.toFixed(2)), Number(o.position.y.toFixed(2)), Number(o.position.z.toFixed(2))] }); });
    const hookLight = staff.children.find((c) => c.children.some((k) => k.isPointLight));
    const hl = hookLight && hookLight.children.find((k) => k.isPointLight);
    return {
      height_m: Number((box.max.y - box.min.y).toFixed(3)),
      foot_y: Number(box.min.y.toFixed(3)), head_y: Number(box.max.y.toFixed(3)),
      width_m: Number((box.max.x - box.min.x).toFixed(3)), depth_m: Number((box.max.z - box.min.z).toFixed(3)),
      staff_length_m: Number((sbox.max.y - sbox.min.y).toFixed(3)),
      staff_top_y: Number(sbox.max.y.toFixed(3)),
      at: [Number(root.position.x.toFixed(2)), Number(root.position.y.toFixed(2)), Number(root.position.z.toFixed(2))],
      bearing_deg: Number(bearing.toFixed(1)), rotation_y_deg: Number((root.rotation.y * 180 / Math.PI).toFixed(1)),
      max_lean_rad_200_frames: over200.max, max_lean_rad_3600_frames: over3600.max,
      lean_samples: over200.samples.concat(over3600.samples),
      hook_lantern: hl ? { colour: '#' + hl.color.getHexString().toUpperCase(), cd_now: Number(hl.intensity.toFixed(2)), range_m: hl.distance } : null,
      scene_point_lights: lanterns.length,
      body_triangles: body.geometry.getAttribute('position').count / 3 + hood.geometry.getAttribute('position').count / 3,
      staff_triangles: staff.children[0].geometry.getAttribute('position').count / 3,
    };
  });

  if (wantFern) {
    // the study framing: her head, from in front of her face, pitch 12, d 5 (ssOrbit, not a station)
    out.framing = await h.evaluate((bearing) => {
      const scene = globalThis.ssKids[0].root.parent;
      const head = scene.getObjectByName('bog.fern').position;
      const o = globalThis.ssOrbit;
      o.current.target = [head.x, head.y + 1.30, head.z];
      o.current.yaw = (bearing + 180) % 360;   // look back along her facing: the face, not the back
      o.current.pitch = 12; o.current.d = 5;
      o.apply();
      return { target: o.current.target, yaw: o.current.yaw, pitch: o.current.pitch, d: o.current.d };
    }, out.fern.bearing_deg);
  }
  await h.step(120);
  out.saved = await h.snap(wantFern ? 'bog-night-fern-03' : `bog-night-${shot}-03`);
  out.hud = await h.hud();
  return out;
};
