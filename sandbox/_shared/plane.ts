// The Green Meanie, intact and parked (npcs.md §2.2: a yellow cross with green bars, 6.0 × 7.2 ×
// 2.5 m). The Forest scene has the wreck; the Desert and Frozen strips have this one, with the
// propeller idling slowly and Ed's scarf-red streamer on the strut. Built along +x (nose at +x).
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos } from './material';
import { C } from './style';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

export interface Plane { group: THREE.Group; prop: THREE.Mesh; update: (t: number) => void; footprint: { x: number; z: number; r: number }[] }

export function makePlane(x: number, y: number, z: number, bearing: number, mat = makeWorldMaterial()): Plane {
  const group = new THREE.Group();
  const len = 6.2;
  const parts: THREE.BufferGeometry[] = [];
  const fus = CY(0.30, 0.52, len, 4, C.planeYellow); fus.rotateY(Math.PI / 4); fus.rotateZ(-Math.PI / 2); fus.translate(0, 0.95, 0);
  parts.push(fus);
  parts.push(CY(0.54, 0.54, 0.7, 8, C.planeYellowDark).rotateZ(Math.PI / 2).translate(len / 2 - 0.2, 0.95, 0)); // cowl
  parts.push(CY(0.13, 0.13, 0.25, 6, C.iron).rotateZ(Math.PI / 2).translate(len / 2 + 0.25, 0.95, 0)); // hub
  parts.push(B(1.4, 0.09, 7.2, C.planeGreen).translate(0.6, 2.05, 0)); // upper wing
  parts.push(B(1.4, 0.09, 6.0, C.planeGreen).translate(0.6, 0.72, 0)); // lower wing
  for (const [sx, sz] of [[0.1, 2.4], [1.1, 2.4], [0.1, -2.4], [1.1, -2.4]]) parts.push(CY(0.03, 0.03, 1.3, 5, C.iron).translate(sx!, 1.38, sz!));
  for (const sx of [0.0, 1.2]) parts.push(CY(0.045, 0.045, 1.3, 5, C.planeYellowDark).translate(sx, 1.38, 0.45));
  parts.push(B(0.6, 0.25, 0.9, C.iron).translate(-0.4, 1.45, 0)); // cockpit rim
  parts.push(B(0.8, 0.07, 2.4, C.planeGreen).translate(-len / 2 + 0.5, 1.15, 0)); // tailplane
  parts.push(B(0.09, 1.0, 0.09, C.planeFin).translate(-len / 2 + 0.4, 1.6, 0)); // fin post
  parts.push(B(0.7, 0.9, 0.06, C.planeRudder).translate(-len / 2 + 0.1, 1.55, 0)); // rudder
  for (const sz of [0.8, -0.8]) { parts.push(CY(0.32, 0.32, 0.14, 8, C.iron).rotateX(Math.PI / 2).translate(0.9, 0.32, sz)); parts.push(CY(0.03, 0.03, 0.6, 4, C.iron).translate(0.9, 0.62, sz * 0.75)); }
  parts.push(CY(0.1, 0.1, 0.1, 6, C.iron).rotateX(Math.PI / 2).translate(-len / 2 + 0.6, 0.12, 0)); // tail skid
  parts.push(B(2.2, 0.03, 0.12, C.planeFin).translate(len / 2 - 0.9, 2.12, 0)); // Ed's red streamer on the top wing
  const body = new THREE.Mesh(mergeGeos(parts), mat);
  body.castShadow = true; body.receiveShadow = true;
  const prop = new THREE.Mesh(mergeGeos([B(0.06, 2.3, 0.18, C.iron), B(0.06, 0.18, 2.3, C.iron)]), mat);
  prop.position.set(len / 2 + 0.4, 0.95, 0); prop.castShadow = true;
  group.add(body, prop);
  group.position.set(x, y, z);
  group.rotation.y = ((90 - bearing) * Math.PI) / 180;
  const c = Math.cos(group.rotation.y), s = Math.sin(group.rotation.y);
  const footprint = [{ x: x + c * 1.0, z: z - s * 1.0, r: 3.2 }, { x: x - c * 2.4, z: z + s * 2.4, r: 1.6 }];
  return { group, prop, update: (t) => { prop.rotation.x = t * 1.8; }, footprint };
}
