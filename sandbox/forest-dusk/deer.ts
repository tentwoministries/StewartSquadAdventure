// The deer (camp.md §2.2 #29, world-events §2.7.1): procedural, ≤ 400 tris, walk / graze / ear flick.
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from '../_shared/material';
import { C } from '../_shared/style';

const mat = makeWorldMaterial({ roughness: 0.95 });
const box = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const node = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const mesh = (g: THREE.BufferGeometry) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; };

export interface Deer { root: THREE.Group; update: (t: number, dt: number, moving: boolean) => void }

/** Built facing local +x; shoulder height 1.3 m. */
export function makeDeer(): Deer {
  const root = new THREE.Group();
  const body = node(0, 0.95, 0);
  const torso = colorize(new THREE.CylinderGeometry(0.24, 0.27, 0.95, 6), C.deer);
  torso.rotateZ(Math.PI / 2); torso.scale(1, 1, 0.85);
  body.add(mesh(mergeGeos([
    torso,
    xf(box(0.7, 0.08, 0.34, C.deerBelly), -0.05, -0.24),
    xf(box(0.16, 0.14, 0.08, '#FFFFFF'), -0.5, 0.1),
    xf(box(0.18, 0.1, 0.24, C.deerBelly), -0.45, 0.02),
  ])));
  const neck = node(0.4, 0.2, 0);
  neck.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 6), C.deer), 0, 0.22)));
  neck.rotation.z = -0.7;
  const head = node(0.0, 0.46, 0);
  head.add(mesh(mergeGeos([
    xf(box(0.34, 0.2, 0.18, C.deer), 0.12, 0.02),
    xf(box(0.14, 0.12, 0.12, C.deerDark), 0.34, -0.02),
    xf(box(0.03, 0.03, 0.05, '#1A1410'), 0.41, 0.0),
    xf(box(0.03, 0.035, 0.03, '#1A1410'), 0.22, 0.09, 0.09),
    xf(box(0.03, 0.035, 0.03, '#1A1410'), 0.22, 0.09, -0.09),
  ])));
  head.rotation.z = 0.6;
  const ears: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const ear = mesh(xf(box(0.04, 0.16, 0.09, C.deer), 0, 0.08));
    ear.position.set(0.02, 0.1, s * 0.1); ear.rotation.x = s * 0.5; head.add(ear); ears.push(ear);
    const beam = mergeGeos([
      xf(box(0.03, 0.42, 0.03, C.antler), 0, 0.21, 0, 0, 0, s * 0.15),
      xf(box(0.03, 0.2, 0.03, C.antler), 0.09, 0.32, 0, 0, 0, -0.7),
      xf(box(0.03, 0.16, 0.03, C.antler), -0.08, 0.4, 0, 0, 0, 0.6),
    ]);
    const ant = mesh(beam); ant.position.set(0.02, 0.1, s * 0.06); ant.rotation.x = s * 0.35; head.add(ant);
  }
  neck.add(head); body.add(neck);
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[0.32, 0.14], [0.32, -0.14], [-0.32, 0.14], [-0.32, -0.14]]) {
    const hip = node(x, -0.15, z);
    hip.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.05, 0.045, 0.4, 5), C.deer), 0, -0.2)));
    const knee = node(0, -0.4, 0);
    knee.add(mesh(xf(colorize(new THREE.CylinderGeometry(0.04, 0.035, 0.38, 5), C.deer), 0, -0.19)));
    knee.add(mesh(xf(box(0.08, 0.06, 0.08, C.deerDark), 0, -0.38)));
    hip.add(knee); body.add(hip); legs.push(hip);
  }
  root.add(body);
  let earT = 0;
  const update = (t: number, _dt: number, moving: boolean) => {
    const w = t * 6.283 * 1.4;
    legs.forEach((l, i) => { const ph = i === 0 || i === 3 ? 0 : Math.PI; l.rotation.z = moving ? Math.sin(w + ph) * 0.38 : 0; });
    body.position.y = 0.95 + (moving ? Math.abs(Math.sin(w)) * 0.025 : 0.006 * Math.sin(t * 1.2));
    neck.rotation.z = moving ? -0.7 + 0.06 * Math.sin(w * 2) : -0.55 + 0.03 * Math.sin(t * 0.7);
    if (t - earT > 3.2) { earT = t; }
    const flick = Math.max(0, 1 - Math.abs((t - earT) - 0.2) * 8);
    ears.forEach((e, i) => { e.rotation.z = flick * 0.5 * (i === 0 ? 1 : 0.4); });
  };
  return { root, update };
}
