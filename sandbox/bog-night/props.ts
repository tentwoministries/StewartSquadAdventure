// Bog props: the Long Causeway (planks on piles over the water, rails, a line of amber lanterns),
// Fern's jetty with Mistweaver Fern and her hooked lantern and a tied rowboat, the Green Meanie
// parked on the boards, the Witch's hut on stilts with its one green window, the seven Witch's
// Lanterns posts on the path (a post lights when a hero stands close for 1.5 s: the Bog's core
// mechanic, npcs.md §2.9.2, previewed), the drowned temple steps with the lantern that will not
// stay lit, and the rudder in the black water.
import * as THREE from 'three';
import { BOG as G } from '../_shared/biomes';
import { makeLantern, makePost, type Lantern } from '../_shared/lantern';
import { colorize, jitterColor, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { makePlane } from '../_shared/plane';
import { BLOOM_LAYER } from '../_shared/post';
import { deg, rng } from '../_shared/rng';
import { C, type Keyframe } from '../_shared/style';
import type { Circle } from '../_shared/walk';
import { BOARD_Y, CAUSEWAY, HUT, JETTY, POSTS, RUDDER, TEMPLE, terrainY, WATER_Y } from './terrain';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);
const yaw = (bearing: number) => deg(90 - bearing);

export interface Props {
  group: THREE.Group; footprints: Circle[];
  update: (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => void;
  lightNext: () => string;
  litCount: () => number;
  hutLight: THREE.PointLight;
}

export function makeProps(): Props {
  const r = rng(77);
  const group = new THREE.Group();
  const worldMat = makeWorldMaterial();
  const clothMat = makeWorldMaterial({ side: THREE.DoubleSide, roughness: 1, sway: 0.06 });
  const fernCloth = makeWorldMaterial({ side: THREE.DoubleSide, roughness: 1 }); // her hood is an open shell
  const glowMat = makeWorldMaterial({ emissive: true });
  const opaque: THREE.BufferGeometry[] = [], glow: THREE.BufferGeometry[] = [];
  const footprints: Circle[] = [];
  const fp = (x: number, z: number, rad: number) => footprints.push({ x, z, r: rad });
  const lanterns: Lantern[] = [];

  // ---- the causeway: planks across, piles under, rails, lanterns every 7 m -----------------------
  for (let x = CAUSEWAY.x0; x < CAUSEWAY.x1; x += 0.62) {
    const g = B(0.56, 0.08, CAUSEWAY.z1 - CAUSEWAY.z0 - 0.2, r() < 0.5 ? G.boards : G.boardsDark);
    jitterColor(g, r, 0.05);
    opaque.push(xf(g, x + 0.31, BOARD_Y - 0.04 + (r() - 0.5) * 0.015, 0, 0, 0, (r() - 0.5) * 0.02));
  }
  for (let x = CAUSEWAY.x0 + 1; x < CAUSEWAY.x1; x += 3.2) for (const s of [-1, 1]) {
    const ty = terrainY(x, s * 2.2);
    opaque.push(xf(CY(0.12, 0.14, BOARD_Y - ty + 0.4, 6, G.post), x, (BOARD_Y + ty - 0.4) / 2, s * 2.2));
    opaque.push(xf(B(0.08, 0.9, 0.08, G.post), x, BOARD_Y + 0.45, s * 2.5));
  }
  for (const s of [-1, 1]) opaque.push(xf(B(CAUSEWAY.x1 - CAUSEWAY.x0, 0.06, 0.06, G.boards), 0, BOARD_Y + 0.9, s * 2.5));
  // the jetty's planks along z, its piles, the rail on one side
  for (let z = JETTY.z0; z < JETTY.z1; z += 0.62) {
    const g = B(JETTY.w - 0.2, 0.08, 0.56, r() < 0.5 ? G.boards : G.boardsDark); jitterColor(g, r, 0.05);
    opaque.push(xf(g, JETTY.x, BOARD_Y - 0.04 + (r() - 0.5) * 0.015, z + 0.31));
  }
  for (let z = JETTY.z0 + 1; z < JETTY.z1; z += 3) for (const s of [-1, 1]) { const ty = terrainY(JETTY.x + s, z); opaque.push(xf(CY(0.11, 0.13, BOARD_Y - ty + 0.4, 6, G.post), JETTY.x + s * 1.0, (BOARD_Y + ty - 0.4) / 2, z)); }
  // ten causeway lanterns, alternating sides; three cast light (the light budget), the rest are emissive
  let li = 0;
  for (let x = CAUSEWAY.x0 + 3; x < CAUSEWAY.x1; x += 6.8) {
    const s = li % 2 ? 1 : -1;
    const post = makePost(2.2, G.post, C.iron, G.witchLantern, li % 3 === 1 ? 12 : 0, 6, true, li % 3 === 1 ? 3.0 : 4.2);
    post.group.position.set(x, BOARD_Y, s * 2.45); post.group.rotation.y = s > 0 ? Math.PI : 0;
    group.add(post.group); lanterns.push(post.lantern); li++;
  }
  // a crooked signpost at the west end
  opaque.push(xf(mergeGeos([CY(0.05, 0.06, 2.0, 5, G.post).translate(0, 1, 0), B(0.9, 0.18, 0.04, G.boards).translate(0.3, 1.7, 0).rotateY(0.5), B(0.8, 0.18, 0.04, G.boards).translate(-0.25, 1.4, 0).rotateY(-0.9)]), CAUSEWAY.x0 - 0.6, BOARD_Y, -2.0));
  fp(CAUSEWAY.x0 - 0.6, -2.0, 0.2);
  // ---- Mistweaver Fern at the jetty's end (npcs.md §2.6.5, T-50) ---------------------------------
  // Canon: hunched, 1.55 m, a fringed shawl whose fringes hang to the knee, a 1.9 m hooked staff
  // with the amber lantern swinging from the hook, an old sharp face and a long grey braid. She is
  // built facing local +x (the scene's `yaw()` convention, T-26), so she takes a bearing like any
  // other prop; the staff is *planted* on her root and her right hand is posed onto it (the
  // Collette-orb lesson), and the sway lives on `fernLean`, whose pivot is her hips.
  const fern = new THREE.Group(); fern.name = 'bog.fern';
  const fernLean = new THREE.Group(); fernLean.name = 'bog.fern.lean';
  const FERN_HIP = 0.72;
  {
    const SHAWL = '#7FA68F', HOOD = '#6C8F7C', DRESS = '#4A3524', TIP = '#70C090', SKIN = '#C8926A', GREY = '#B9B4A6', DARK = '#1A1410';
    // a limb between two points: a cylinder aligned to the segment, then moved onto its midpoint
    const limb = (a: [number, number, number], b: [number, number, number], r0: number, r1: number, hex: string): THREE.BufferGeometry => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
      const g = colorize(new THREE.CylinderGeometry(r0, r1, va.distanceTo(vb), 5), hex);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
      g.translate((va.x + vb.x) / 2, (va.y + vb.y) / 2, (va.z + vb.z) / 2);
      return g;
    };
    const parts: THREE.BufferGeometry[] = [
      xf(CY(0.24, 0.35, 0.80, 8, DRESS), 0.01, 0.40),                                  // the rot-brown dress
      xf(CY(0.175, 0.28, 0.48, 8, SHAWL), 0.045, 0.97, 0, 0, 0, -0.28),                // the hunched body under the shawl
      xf(B(0.19, 0.11, 0.44, SHAWL), 0.105, 1.175, 0, 0, 0, -0.15),                    // shoulders, rolled forward
      xf(CY(0.055, 0.062, 0.10, 6, SKIN), 0.128, 1.255),                               // the neck
      xf(colorize(new THREE.SphereGeometry(0.115, 8, 6), SKIN), 0.148, 1.385),         // the head, pushed forward: hunched
      xf(colorize(new THREE.SphereGeometry(0.119, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), GREY), 0.138, 1.418), // grey hair, stopping above the eye line
      xf(colorize(new THREE.SphereGeometry(0.112, 7, 4, 0, Math.PI, 0, Math.PI * 0.9), GREY), 0.128, 1.385, 0, Math.PI / 2), // the nape half
      xf(B(0.034, 0.024, 0.034, DARK), 0.238, 1.393, 0.052), xf(B(0.034, 0.024, 0.034, DARK), 0.238, 1.393, -0.052), // eyes
      xf(B(0.030, 0.013, 0.048, GREY), 0.234, 1.424, 0.055), xf(B(0.030, 0.013, 0.048, GREY), 0.234, 1.424, -0.055), // brows: old, sharp
      xf(colorize(new THREE.ConeGeometry(0.028, 0.08, 4), SKIN).rotateZ(-Math.PI / 2), 0.258, 1.368),  // the nose
      xf(B(0.022, 0.014, 0.055, '#8A5A48'), 0.246, 1.330, 0, 0, 0, 0.25),              // the mouth: amused
      limb([0.02, 1.36, 0.01], [-0.09, 1.06, 0.03], 0.036, 0.028, GREY),               // the long braid of grey
      limb([-0.09, 1.06, 0.03], [-0.125, 0.86, 0.04], 0.028, 0.017, GREY),
      xf(CY(0.026, 0.026, 0.045, 5, TIP), -0.128, 0.855),                              // its binding
      limb([0.07, 1.13, 0.19], [0.09, 0.90, 0.34], 0.058, 0.046, SHAWL),               // the right arm, onto the staff
      limb([0.09, 0.90, 0.34], [0.16, 1.03, 0.40], 0.046, 0.038, SHAWL),
      xf(B(0.085, 0.09, 0.08, SKIN), 0.160, 1.055, 0.400),                             // the right hand on the shaft
      limb([0.07, 1.13, -0.19], [0.16, 0.94, -0.30], 0.058, 0.046, SHAWL),             // the left arm, clutching the shawl
      limb([0.16, 0.94, -0.30], [0.22, 1.06, -0.14], 0.046, 0.038, SHAWL),
      xf(B(0.08, 0.085, 0.075, SKIN), 0.220, 1.060, -0.140),
    ];
    // the shawl's fringe, hanging to the knee with accent tips (the reed fringe becomes her hem)
    for (let i = 0; i < 16; i++) {
      const a = i * 0.3927, fx = 0.03 + Math.cos(a) * 0.28, fz = Math.sin(a) * 0.28;
      const len = 0.21 + 0.09 * ((i * 5) % 7) / 6;   // uneven lengths: a fringe, not a fence
      parts.push(xf(B(0.026, len, 0.018, SHAWL), fx, 0.74 - len / 2, fz, a));
      parts.push(xf(B(0.028, 0.045, 0.020, TIP), fx, 0.74 - len - 0.02, fz, a));
    }
    const bodyGeo = mergeGeos(parts); bodyGeo.translate(0, -FERN_HIP, 0);
    const body = new THREE.Mesh(bodyGeo, worldMat); body.name = 'bog.fern.body';
    body.castShadow = true; body.receiveShadow = true;
    // the hood: an open half shell behind the head (lowered, not over the face)
    const hoodGeo = colorize(new THREE.CylinderGeometry(0.15, 0.245, 0.44, 8, 1, true, Math.PI, Math.PI), HOOD);
    xf(hoodGeo, 0.0, 1.325, 0, 0, 0, 0.42); hoodGeo.translate(0, -FERN_HIP, 0);
    const hood = new THREE.Mesh(hoodGeo, fernCloth); hood.name = 'bog.fern.hood'; hood.castShadow = true;
    fernLean.add(body, hood); fernLean.position.y = FERN_HIP;
    // the hooked staff, planted on the boards beside her right hand
    const staff = new THREE.Group(); staff.name = 'bog.fern.staff';
    staff.add(new THREE.Mesh(mergeGeos([
      xf(CY(0.026, 0.034, 1.9, 5, G.post), 0, 0.95),
      xf(colorize(new THREE.TorusGeometry(0.15, 0.024, 4, 8, Math.PI * 1.25), G.post), 0.14, 1.86),
      xf(CY(0.036, 0.036, 0.07, 6, TIP), 0, 1.045), xf(CY(0.034, 0.034, 0.05, 6, TIP), 0, 1.62), // the staff's binding
    ]), worldMat));
    const hook = makeLantern(G.witchLantern, 14, 7, 3.0, C.iron, 0.9, true);
    hook.pivot.position.set(0.30, 1.88, 0); staff.add(hook.pivot); lanterns.push(hook);
    staff.position.set(0.16, 0, 0.40);
    fern.add(fernLean, staff);
    // bearing 25: down the jetty toward the causeway (the old yaw(160) pointed her at the hut)
    fern.position.set(JETTY.x - 0.3, BOARD_Y, JETTY.z1 - 1.2); fern.rotation.y = yaw(25);
    group.add(fern); fp(JETTY.x - 0.3, JETTY.z1 - 1.2, 0.6);
  }
  // the rowboat tied at the jetty, bobbing
  const boat = new THREE.Mesh(mergeGeos([
    xf(CY(0.9, 0.5, 0.5, 5, G.boardsDark).rotateZ(Math.PI / 2), 0, 0), colorize(new THREE.BoxGeometry(2.6, 0.06, 1.1), G.boards).translate(0, 0.28, 0),
    B(1.0, 0.05, 0.1, G.boards).translate(0.4, 0.32, 0), CY(0.02, 0.02, 1.6, 4, G.boards).rotateZ(Math.PI / 2 + 0.3).translate(-0.2, 0.5, 0.4),
  ]), worldMat);
  boat.position.set(JETTY.x + 2.3, WATER_Y + 0.05, JETTY.z1 - 3); boat.rotation.y = 0.4; boat.castShadow = true; group.add(boat);
  fp(JETTY.x + 2.3, JETTY.z1 - 3, 1.3);
  // ---- the Green Meanie parked on the boards ---------------------------------------------------
  const plane = makePlane(9, BOARD_Y, 0, 270, worldMat);
  group.add(plane.group); footprints.push(...plane.footprint);
  // ---- the Witch's hut on stilts -------------------------------------------------------------
  const hutLight = new THREE.PointLight(G.witchWindow, 7, 7, 2);
  {
    const hx = HUT.x, hz = HUT.z, ry = yaw(225), deck = terrainY(hx, hz) + 1.5;
    const parts: THREE.BufferGeometry[] = [];
    for (const [sx, sz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]] as [number, number][]) { const ty = terrainY(hx + sx, hz + sz) - 0.3; parts.push(CY(0.14, 0.18, deck - ty, 6, G.hutWood).translate(sx, (deck + ty) / 2 - deck, sz).rotateZ((r() - 0.5) * 0.06)); }
    parts.push(B(5.6, 0.14, 5.6, G.boards).translate(0, 0, 0));
    for (let i = 0; i < 9; i++) parts.push(B(5.4, 0.02, 0.5, i % 2 ? G.boardsDark : G.boards).translate(0, 0.08, -2.4 + i * 0.6));
    // the cabin: a leaning box, a steep roof, a bent chimney, the door, the porch rail, the broom
    const cabin = mergeGeos([B(3.6, 2.6, 2.9, G.hutWood).translate(-0.5, 1.37, -0.4), ...[0.4, 1.2, 2.0].map((y) => B(3.62, 0.05, 2.92, '#2E2218').translate(-0.5, y, -0.4))]);
    cabin.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.05)); parts.push(cabin);
    const roofA = colorize(new THREE.BoxGeometry(4.4, 0.12, 2.1), G.hutRoof).translate(0, 0, 1.0).applyMatrix4(new THREE.Matrix4().makeRotationX(-0.95)).translate(-0.6, 3.5, -0.4);
    const roofB = colorize(new THREE.BoxGeometry(4.4, 0.12, 2.1), G.hutRoof).translate(0, 0, -1.0).applyMatrix4(new THREE.Matrix4().makeRotationX(0.95)).translate(-0.6, 3.5, -0.4);
    parts.push(roofA, roofB, B(0.5, 1.1, 0.5, '#4A4A50').translate(0.6, 4.0, -0.9), B(0.5, 0.5, 0.5, '#4A4A50').translate(0.85, 4.55, -0.9).applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.4)));
    parts.push(B(0.8, 1.6, 0.08, '#2E2218').translate(0.3, 0.9, 1.08), B(0.06, 0.06, 0.06, C.iron).translate(0.55, 0.9, 1.14));
    for (const z of [2.6, -2.6]) parts.push(B(5.4, 0.06, 0.06, G.hutWood).translate(0, 0.9, z));
    for (const x of [-2.6, 2.6]) parts.push(B(0.06, 0.06, 5.4, G.hutWood).translate(x, 0.9, 0));
    for (let i = -2; i <= 2; i++) parts.push(B(0.05, 0.9, 0.05, G.hutWood).translate(i * 1.3, 0.45, 2.6), B(0.05, 0.9, 0.05, G.hutWood).translate(2.6, 0.45, i * 1.3));
    parts.push(CY(0.02, 0.025, 1.5, 4, G.hutWood).rotateZ(0.2).translate(1.7, 0.85, 0.9), colorize(new THREE.ConeGeometry(0.14, 0.4, 6), '#B8A060').rotateZ(0.2).translate(1.85, 0.2, 0.9)); // the broom
    parts.push(CY(0.36, 0.3, 0.5, 8, '#2A2A30').translate(1.6, 0.3, -1.6), CY(0.4, 0.4, 0.05, 8, C.iron).translate(1.6, 0.55, -1.6)); // the cauldron
    // the plank walk down to the island
    parts.push(B(1.2, 0.1, 6.5, G.boards).translate(0, -0.7, 5.8).applyMatrix4(new THREE.Matrix4().makeRotationX(0.22)));
    const hut = mergeGeos(parts); jitterColor(hut, r, 0.04);
    xf(hut, hx, deck, hz, ry); opaque.push(hut);
    // the one green window: emissive, with a light behind it
    const win = B(0.7, 0.6, 0.06, G.witchWindow); const wc = win.getAttribute('color') as THREE.BufferAttribute; for (let i = 0; i < wc.count; i++) wc.setXYZ(i, 0.49, 1.0, 0.49);
    const em = new THREE.Color(G.witchWindow).multiplyScalar(1.6); const ea = new Float32Array(wc.count * 3); for (let i = 0; i < wc.count; i++) { ea[i * 3] = em.r; ea[i * 3 + 1] = em.g; ea[i * 3 + 2] = em.b; }
    win.setAttribute('aEmissive', new THREE.BufferAttribute(ea, 3)); win.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(wc.count).fill(1), 1));
    win.translate(-1.2, 1.6, 1.08); win.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.05));
    glow.push(xf(win, hx, deck, hz, ry));
    hutLight.position.set(hx + Math.cos(ry) * -1.2 + Math.sin(ry) * 1.6, deck + 1.6, hz - Math.sin(ry) * -1.2 + Math.cos(ry) * 1.6);
    group.add(hutLight);
    const hang = makeLantern(G.witchLantern, 10, 6, 3.0, C.iron, 0.9, true);
    hang.pivot.position.set(hx + Math.cos(ry) * 1.2 + Math.sin(ry) * 2.4, deck + 2.2, hz - Math.sin(ry) * 1.2 + Math.cos(ry) * 2.4);
    group.add(hang.pivot); lanterns.push(hang);
    fp(hx, hz, 4.2);
  }
  // ---- the Witch's Lanterns: seven posts on the path, the first two lit -----------------------
  const posts: { lantern: Lantern; decal: THREE.Mesh; x: number; z: number; near: number }[] = [];
  const decalMat = new THREE.MeshBasicMaterial({ color: G.witchLantern, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  POSTS.forEach(([x, z], i) => {
    const lit = i < 2;
    const post = makePost(2.6, G.post, C.iron, G.witchLantern, 12, 6, lit);
    post.group.position.set(x, terrainY(x, z), z); post.group.rotation.y = r() * 6.28;
    group.add(post.group);
    const decal = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), decalMat.clone());
    decal.rotation.x = -Math.PI / 2; decal.position.set(x, terrainY(x, z) + 0.04, z); decal.layers.enable(BLOOM_LAYER);
    group.add(decal);
    posts.push({ lantern: post.lantern, decal, x, z, near: 0 });
    fp(x, z, 0.25);
  });
  // ---- the drowned temple steps and the lantern that will not stay lit --------------------------
  const templeLantern = makeLantern(G.witchLantern, 10, 6, 3.0, C.iron, 1, true);
  {
    const tx = TEMPLE.x, tz = TEMPLE.z, ry = yaw(180), ty = terrainY(tx, tz);
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) parts.push(B(9 - i * 0.2, 0.32, 1.3, i % 2 ? '#4A5A56' : '#3E4E4A').translate(0, 0.16 - i * 0.32, 4.5 - i * 1.3));
    for (const s of [-1, 1]) { parts.push(CY(0.5, 0.6, 4.4, 8, '#4A5A56').translate(s * 3.4, 2.2, -2.5)); parts.push(B(1.3, 0.4, 1.3, '#3E4E4A').translate(s * 3.4, 4.5, -2.5)); }
    parts.push(B(8.4, 0.8, 1.4, '#3E4E4A').translate(0, 5.0, -2.5), B(6, 4.6, 0.4, '#141C1A').translate(0, 2.3, -3.6), B(7, 5.2, 4, '#2E3E3A').translate(0, 2.6, -6));
    for (let i = 0; i < 5; i++) parts.push(B(0.9, 0.9, 0.12, '#3E4E4A').translate(-2 + i, 5.0, -1.75).rotateZ(0.785));
    const temple = mergeGeos(parts); jitterColor(temple, r, 0.05);
    const mossy = temple.getAttribute('color') as THREE.BufferAttribute, pos = temple.getAttribute('position') as THREE.BufferAttribute;
    const moss = new THREE.Color(G.hangMoss);
    for (let i = 0; i < mossy.count; i += 3) if (r() < 0.2) for (let k = 0; k < 3; k++) mossy.setXYZ(i + k, moss.r * 0.8, moss.g * 0.8, moss.b * 0.8);
    void pos;
    xf(temple, tx, ty - 0.3, tz, ry); opaque.push(temple);
    const post = makePost(2.4, G.post, C.iron, G.witchLantern, 0, 6, true);
    post.group.position.set(tx + 5.2, terrainY(tx + 5.2, tz + 6), tz + 6); group.add(post.group);
    templeLantern.pivot.position.set(0.32, 2.32, 0); post.group.add(templeLantern.pivot);
    fp(tx, tz - 3, 5); fp(tx + 5.2, tz + 6, 0.25);
  }
  // ---- the rudder in the black water --------------------------------------------------------------
  {
    const fin = mergeGeos([colorize(new THREE.BoxGeometry(0.08, 1.3, 1.0), C.planeRudder).translate(0, 0.5, 0), B(0.1, 1.5, 0.1, C.planeFin).translate(0, 0.5, -0.5)]);
    xf(fin, RUDDER.x, WATER_Y - 0.25, RUDDER.z, 0.4, 0, -0.5);
    opaque.push(fin);
    const rim = colorize(new THREE.BoxGeometry(0.09, 1.2, 0.05), C.planeRudder, { color: new THREE.Color('#6CE87A').multiplyScalar(0.5).getStyle(), glow: 1 });
    xf(rim, RUDDER.x + 0.02, WATER_Y + 0.4, RUDDER.z + 0.5, 0.4, 0, -0.5); glow.push(rim);
  }
  // ---- the Hydra's pool: a ring of dead reeds and stones that is too still ----------------------
  for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283; const x = 31 + Math.cos(a) * 6.8, z = -17 + Math.sin(a) * 6.8; const g = colorize(new THREE.IcosahedronGeometry(0.3 + r() * 0.3, 0), '#3A3A38'); g.scale(1.2, 0.7, 1); opaque.push(xf(g, x, terrainY(x, z) + 0.1, z, r() * 6)); }

  const opaqueMesh = new THREE.Mesh(mergeGeos(opaque), worldMat); opaqueMesh.castShadow = true; opaqueMesh.receiveShadow = true;
  const glowMesh = new THREE.Mesh(mergeGeos(glow), glowMat); glowMesh.layers.enable(BLOOM_LAYER);
  group.add(opaqueMesh, glowMesh);
  void clothMat;

  let flickerNext = 4;
  const update = (t: number, dt: number, kf: Keyframe, hero: THREE.Vector3) => {
    plane.update(t);
    boat.position.y = WATER_Y + 0.05 + 0.03 * Math.sin(t * 0.9); boat.rotation.z = 0.03 * Math.sin(t * 0.7); boat.rotation.x = 0.02 * Math.sin(t * 1.1 + 1);
    // Fern's slow sway: two incommensurate rates (the bible's 0.4 rad/s stool rock and a 0.53 rad/s
    // cross-lean), a 0.04 rad lean in all, over a slow breath. Tier-0 rule 3; npcs.md §3 (v27 §19.2).
    fernLean.rotation.z = 0.030 * Math.sin(t * 0.40);
    fernLean.rotation.x = 0.026 * Math.sin(t * 0.53 + 1.1);
    fernLean.position.y = FERN_HIP + 0.008 * Math.sin(t * 0.9);
    for (const l of lanterns) { l.pivot.rotation.z = Math.sin(t * 0.6 + l.pivot.position.x) * 0.05; l.update(t, dt, kf.lantern); }
    // the mechanic: stand within 2.2 m of a dark post for 1.5 s and it lights; lit posts stay lit
    for (const p of posts) {
      const d = Math.hypot(p.x - hero.x, p.z - hero.z);
      if (p.lantern.target < 1) { p.near = d < 2.2 ? p.near + dt : Math.max(0, p.near - dt * 2); if (p.near >= 1.5) p.lantern.target = 1; }
      p.lantern.update(t, dt, kf.lantern);
      (p.decal.material as THREE.MeshBasicMaterial).opacity = 0.16 * p.lantern.lit * kf.lantern * (0.9 + 0.1 * Math.sin(t * 8.8 + p.x));
    }
    // the temple's lantern gutters: it lights, fails after a few seconds, tries again
    if (t > flickerNext) { templeLantern.target = templeLantern.target > 0.5 ? 0 : 1; flickerNext = t + (templeLantern.target > 0.5 ? 3 + r() * 3 : 1.5 + r() * 2); }
    templeLantern.update(t, dt, kf.lantern);
    hutLight.intensity = 7 * kf.lantern * (0.85 + 0.15 * Math.sin(t * 2.3));
  };
  return {
    group, footprints, update, hutLight,
    lightNext: () => { const p = posts.find((q) => q.lantern.target < 1); if (!p) return 'all seven lanterns are lit'; p.lantern.target = 1; return `lantern ${posts.indexOf(p) + 1} of 7 lights`; },
    litCount: () => posts.filter((p) => p.lantern.target > 0.5).length,
  };
}
