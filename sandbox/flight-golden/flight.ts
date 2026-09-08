// CS-04, the flight (cutscenes.md §2.6, npcs.md §2.3.4): the path, the schedule, the aircraft with
// its propeller at flight speed and a blur disc, Grandpa Ed in the rear cockpit with the scarf that
// never stops (npcs.md §2.1.4's six frequencies), the bench the four kids ride on, the cloud layer
// the plane climbs through, and the two bounces on landing. Speeds and altitudes: npcs.md §2.2.4.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePlane } from '../_shared/plane';

import { rng } from '../_shared/rng';
import { C } from '../_shared/style';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const ED = { base: '#8B5A2B', dark: '#3B2A1A', collar: '#EDE3CF', green: '#228B22', scarf: '#D84830', scarfEnd: '#A83828', goggle: '#7A4018', lens: '#B8D4E0', skin: '#F2CBA7' };

/** The strip is Frozen's snowfield, (−10, 20) to (50, 20); takeoffs roll toward +x, landings come in from +x. */
const PATH: [number, number, number][] = [
  [-10, 0.75, 20], [0, 0.75, 20], [12, 1.0, 20],           // the roll
  [26, 5, 20.5], [44, 13, 23], [64, 24, 32],               // rotate and climb, the cloud layer at +24
  [86, 32, 56], [92, 34, 88], [72, 32, 116], [36, 28, 128], // the sky leg
  [0, 24, 122], [-30, 18, 100],                            // the descent
  [-52, 20, 68], [-58, 20, 30], [-48, 20, -10], [-24, 20, -38],
  [12, 20, -46], [50, 19, -34], [78, 15, -6],              // the circuit, 20 m over the hub
  [86, 9, 16], [70, 4, 20], [50, 1.8, 20],                 // onto final, from +x
  [34, 0.75, 20], [14, 0.7, 20], [-6, 0.7, 20],            // touchdown, roll-out, park
];
/** Beat boundaries: [time (s), waypoint index]. The whole flight is 18.4 s (npcs.md: 16–18, ≤ 30). */
const BEATS: [number, number][] = [
  [0, 0], [3.0, 2], [6.5, 5], [10.0, 9], [11.6, 11], [14.6, 18], [16.4, 21], [17.4, 23], [18.4, 24],
];
export const FLIGHT_LEN = 18.4;
export const TOUCHDOWN = 16.4;

export interface Flight {
  group: THREE.Group;
  plane: THREE.Group;
  /** Seat world matrices for the four kids (seat.0..3) and Ed's pilot socket. */
  seat: (i: number, out: THREE.Object3D) => void;
  chase: (out: THREE.Object3D, kind: 'CH' | 'WG' | 'ED') => void;
  /** Advance to `t` seconds of the cutscene clock; returns the beat name. */
  set: (t: number, dt: number) => string;
  /** 0 while clear, 1 in the middle of the cloud layer: the streaming curtain's white-out. */
  whiteOut: number;
  /** 0..1 through the stall-drop: all four kids grab the rim. */
  stall: number;
  pos: THREE.Vector3;
  hud: () => string;
}

export function makeFlight(): Flight {
  const group = new THREE.Group();
  const mat = makeWorldMaterial({ roughness: 0.85 });
  const r = rng(509);
  const curve = new THREE.CatmullRomCurve3(PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal', 0.5);
  const SEGS = PATH.length - 1;

  const plane = makePlane(0, 0, 0, 90, mat);
  group.add(plane.group);
  // the prop blur: two ellipse quads at 25 % and 20 %, offset 90° (npcs.md §2.2.1, the v27 recipe)
  const blur: THREE.Mesh[] = [];
  for (const [op, rot] of [[0.25, 0], [0.20, Math.PI / 2]] as [number, number][]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), new THREE.MeshBasicMaterial({ color: '#C8C8D0', transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.y = Math.PI / 2; m.rotation.x = rot; m.position.set(3.55, 0.95, 0);
    m.scale.set(1, 0.92, 1);
    plane.group.add(m); blur.push(m);
  }
  // the bench: four seat sockets, two forward and two behind, Isabella on the left (npcs.md §2.2.1)
  const bench = new THREE.Group();
  bench.position.set(-0.30, 1.00, 0);
  plane.group.add(bench);
  const seats: THREE.Group[] = [];
  for (const [sx, sz] of [[0.42, 0.36], [0.42, -0.36], [-0.42, 0.36], [-0.42, -0.36]] as [number, number][]) {
    const s = new THREE.Group(); s.position.set(sx, 0, sz); s.rotation.y = -Math.PI / 2; bench.add(s); seats.push(s);
  }

  // ---- Grandpa Ed in the rear cockpit: the lump on the brow, the wide pale collar, the red streak
  const ed = new THREE.Group();
  ed.position.set(-1.35, 1.06, 0); ed.rotation.y = -Math.PI / 2;
  const edBody = new THREE.Mesh(mergeGeos([
    xf(CY(0.21, 0.25, 0.52, 7, ED.base), 0, 0.26),
    xf(colorize(new THREE.TorusGeometry(0.22, 0.075, 5, 12), ED.collar).rotateX(Math.PI / 2), 0, 0.50),
    xf(B(0.16, 0.10, 0.02, ED.green), 0, 0.44, 0.16),
    xf(colorize(new THREE.SphereGeometry(0.20, 8, 6), ED.skin), 0, 0.70),
    xf(colorize(new THREE.SphereGeometry(0.205, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), ED.dark), 0, 0.72),
    ...[-1, 1].map((s) => xf(colorize(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 10), ED.goggle).rotateX(Math.PI / 2), s * 0.085, 0.80, 0.155)),
    ...[-1, 1].map((s) => xf(colorize(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 10), ED.lens).rotateX(Math.PI / 2), s * 0.085, 0.80, 0.175)),
    ...[-1, 1].map((s) => xf(CY(0.055, 0.05, 0.34, 6, ED.base).rotateZ(s * 0.5), s * 0.22, 0.36, 0.05)),
  ]), mat);
  edBody.castShadow = true;
  ed.add(edBody);
  // the scarf: six bones, six frequencies, streaming back along −velocity (npcs.md §2.1.4)
  const scarfBones: THREE.Group[] = [];
  let parent: THREE.Object3D = ed;
  for (let k = 0; k < 6; k++) {
    const b = new THREE.Group();
    b.position.set(0, k === 0 ? 0.52 : -0.15, k === 0 ? -0.1 : 0);
    const w = 0.14 - k * 0.01;
    const strip = colorize(new THREE.PlaneGeometry(w, 0.16, 1, 1), k < 3 ? ED.scarf : ED.scarfEnd);
    strip.translate(0, -0.08, 0);
    const m = new THREE.Mesh(strip, makeWorldMaterial({ roughness: 1, side: THREE.DoubleSide }));
    b.add(m); parent.add(b); parent = b; scarfBones.push(b);
  }
  plane.group.add(ed);
  const F = [4, 5, 3.5, 4.2, 3, 3.8], G = [3, 4, 4.5, 3.8, 4.2, 5];

  // ---- the cloud layer the plane climbs through (+24 m over the hub) --------------------------------
  const cloudMat = makeWorldMaterial({ roughness: 1 });
  const layer: { mesh: THREE.Mesh; base: THREE.Vector3; ph: number }[] = [];
  for (let i = 0; i < 22; i++) {
    const parts: THREE.BufferGeometry[] = [];
    const w = 16 + r() * 14, k = 3 + Math.floor(r() * 3);
    for (let j = 0; j < k; j++) {
      const s = w * (0.24 + r() * 0.18);
      const g = new THREE.IcosahedronGeometry(s, 1);
      g.scale(1.5, 0.5, 1.2);
      g.translate((j - (k - 1) / 2) * w * 0.32, (r() - 0.5) * s * 0.3, (r() - 0.5) * w * 0.22);
      parts.push(colorize(g, '#FFFFFF'));
    }
    const merged = mergeGeos(parts);
    const col = merged.getAttribute('color') as THREE.BufferAttribute, nrm = merged.getAttribute('normal') as THREE.BufferAttribute;
    const under = new THREE.Color('#D8B8C8');
    for (let k2 = 0; k2 < col.count; k2++) {
      const tt = THREE.MathUtils.clamp(0.5 - nrm.getY(k2) * 0.5, 0, 1);
      col.setXYZ(k2, 1 - (1 - under.r) * tt, 1 - (1 - under.g) * tt, 1 - (1 - under.b) * tt);
    }
    const a = r() * 6.283, d = 30 + r() * 150;
    const base = new THREE.Vector3(Math.cos(a) * d, 22 + r() * 5, Math.sin(a) * d);
    const mesh = new THREE.Mesh(merged, cloudMat);
    mesh.position.copy(base);
    group.add(mesh);
    layer.push({ mesh, base, ph: r() * 6.28 });
  }

  // ---- the other island, on the horizon: the destination growing ahead ------------------------------
  {
    const isle = new THREE.Group();
    const top = colorize(new THREE.CylinderGeometry(46, 40, 5, 9), '#2F6B3A');
    const skirt = colorize(new THREE.ConeGeometry(40, 34, 9), '#4A4048');
    skirt.rotateX(Math.PI); skirt.translate(0, -19, 0);
    const trees: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 38, h = 6 + r() * 6;
      trees.push(xf(colorize(new THREE.ConeGeometry(h * 0.24, h, 5), i % 3 ? '#0F5132' : '#3A7D44'), Math.cos(a) * d, 2.5 + h / 2, Math.sin(a) * d));
    }
    const m = new THREE.Mesh(mergeGeos([top, skirt, ...trees]), cloudMat);
    isle.add(m);
    const roof = new THREE.Mesh(colorize(new THREE.BoxGeometry(7, 3, 6), C.tealSlate), cloudMat);
    roof.position.set(6, 4, -4); isle.add(roof);
    isle.position.set(430, 8, -260);
    group.add(isle);
  }

  const pos = new THREE.Vector3(), tan = new THREE.Vector3(), tmp = new THREE.Vector3();
  const q = new THREE.Quaternion();
  let bounce = 0, roll = 0, lastYaw = 0, beat = 'on the strip', propAngle = 0, stall = 0;
  const flight: Flight = {
    group, plane: plane.group, whiteOut: 0, stall: 0, pos,
    seat: (i, out) => { seats[i]!.getWorldPosition(tmp); out.position.copy(tmp); seats[i]!.getWorldQuaternion(q); out.quaternion.copy(q); },
    chase: (out, kind) => {
      const p = plane.group;
      if (kind === 'CH') { tmp.set(-13, 3.4, 0); p.localToWorld(tmp); out.position.copy(tmp); tmp.set(2, 1.1, 0); p.localToWorld(tmp); out.lookAt(tmp); }
      else if (kind === 'WG') { tmp.set(-1.2, 2.4, -9.5); p.localToWorld(tmp); out.position.copy(tmp); tmp.set(1.2, 1.0, 1.6); p.localToWorld(tmp); out.lookAt(tmp); }
      else { tmp.set(-2.95, 2.05, 0.72); p.localToWorld(tmp); out.position.copy(tmp); tmp.set(1.9, 1.35, -0.05); p.localToWorld(tmp); out.lookAt(tmp); }
    },
    set: (t, dt) => {
      const tc = THREE.MathUtils.clamp(t, 0, FLIGHT_LEN);
      let seg = 0;
      for (let i = 0; i + 1 < BEATS.length; i++) {
        const [t0, i0] = BEATS[i]!, [t1, i1] = BEATS[i + 1]!;
        if (tc >= t0 && tc <= t1) { seg = i0 + ((tc - t0) / (t1 - t0)) * (i1 - i0); break; }
        if (tc > t1) seg = i1;
      }
      beat = tc < 3 ? 'takeoff roll' : tc < 6.5 ? 'rotate and climb' : tc < 10 ? 'sky leg' : tc < 11.6 ? 'descent' : tc < 14.6 ? 'the circuit' : tc < TOUCHDOWN ? 'approach' : tc < 17.4 ? 'the bounce' : 'roll-out';
      const u = THREE.MathUtils.clamp(seg / SEGS, 0, 1);
      curve.getPoint(u, pos);
      curve.getTangent(u, tan).normalize();
      // the two bounces: the second half the first, easing out (npcs.md §2.3.4)
      const ba = tc - TOUCHDOWN;
      bounce = ba > 0 && ba < 1.4 ? Math.max(0, Math.sin(ba * 5.2) * 1.0 * Math.exp(-ba * 2.1)) + Math.max(0, Math.sin((ba - 0.6) * 5.2) * 0.35 * Math.exp(-(ba - 0.6) * 2.4)) : 0;
      const sa = (tc - 5.2) / 1.2;
      stall = sa > 0 && sa < 1 ? Math.sin(sa * Math.PI) : 0;
      plane.group.position.set(pos.x, pos.y + Math.max(0, bounce) - 4 * stall, pos.z);
      const yaw = Math.atan2(tan.x, tan.z);
      const pitch = Math.asin(THREE.MathUtils.clamp(tan.y, -1, 1));
      let dy = yaw - lastYaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      lastYaw = yaw;
      const wantRoll = THREE.MathUtils.clamp((dy / Math.max(dt, 1e-3)) * 1.1, -0.62, 0.62);
      roll += (wantRoll - roll) * Math.min(1, dt * 4); // bank lag 4/s (npcs.md §2.2.3)
      // the plane is built along +x, so the yaw offset is −90°; the wobble is the fourth motion source
      plane.group.rotation.set(0, yaw - Math.PI / 2, 0);
      plane.group.rotateZ(pitch - 0.26 * stall + Math.sin(t * 1.3) * 0.02);
      plane.group.rotateX(-roll + Math.cos(t * 2) * 0.04);
      // the propeller at flight speed, with the blur discs above 20 rad/s
      const spin = tc < 0.6 ? tc / 0.6 : tc > 17.6 ? Math.max(0, 1 - (tc - 17.6) / 0.8) : 1;
      propAngle += dt * 46 * spin;
      plane.prop.rotation.x = propAngle;
      for (const b of blur) b.visible = spin > 0.45;
      // the cloud layer: a white-out while the plane is inside it
      flight.stall = stall;
      flight.whiteOut = THREE.MathUtils.smoothstep(pos.y, 20, 24) * (1 - THREE.MathUtils.smoothstep(pos.y, 27, 31));
      for (const c of layer) c.mesh.position.set(c.base.x + Math.sin(t * 0.05 + c.ph) * 3, c.base.y + Math.sin(t * 0.09 + c.ph) * 0.8, c.base.z + t * 0.4);
      // Ed's scarf: six bones, six frequencies, streaming back at 1.5× in the air
      const air = 0.4 + 0.6 * THREE.MathUtils.smoothstep(tc, 2.5, 5);
      scarfBones.forEach((b, k) => {
        b.rotation.z = (k === 0 ? -1.15 : -0.12) * air + 0.075 * Math.sin(t * F[k]!) * air;
        b.rotation.x = 0.075 * Math.cos(t * G[k]!) * air;
      });
      return beat;
    },
    hud: () => `flight ${beat} · alt ${pos.y.toFixed(1)} m · bank ${((roll * 180) / Math.PI).toFixed(0)}° · bounce ${bounce.toFixed(2)} m · cloud ${flight.whiteOut.toFixed(2)}`,
  };
  return flight;
}
