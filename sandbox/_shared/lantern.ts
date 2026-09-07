// Lanterns and lamps (camp.md §2.2 #6 recipe, lifted from the Forest props): an iron frame, an
// emissive glass on the bloom layer, one point light. A lamp can be lit or dark, eased (T-02:
// the caves' hook-lamps and the Bog's posts light when a hero stands close).
import * as THREE from 'three';
import { colorize, makeWorldMaterial, mergeGeos, xf } from './material';
import { BLOOM_LAYER } from './post';

const B = (w: number, h: number, d: number, hex: string) => colorize(new THREE.BoxGeometry(w, h, d), hex);
const CY = (rt: number, rb: number, h: number, seg: number, hex: string) => colorize(new THREE.CylinderGeometry(rt, rb, h, seg), hex);

export interface Lantern {
  pivot: THREE.Group; light: THREE.PointLight; glass: THREE.Mesh;
  /** 0 dark → 1 lit; set the target and call update(dt) to ease. */
  lit: number; target: number;
  update: (t: number, dt: number, schedule: number) => void;
}

let worldMat: THREE.MeshStandardMaterial | null = null;
const glassMats = new Map<string, THREE.MeshStandardMaterial>();

export function makeLantern(colour: string, cd: number, range: number, glassGain = 3.0, iron = '#3E4247', scale = 1, litNow = true): Lantern {
  worldMat ??= makeWorldMaterial();
  const pivot = new THREE.Group();
  const frame = mergeGeos([
    xf(CY(0.008, 0.008, 0.12, 4, iron), 0, -0.06),
    xf(B(0.30, 0.03, 0.19, iron), 0, -0.135),
    xf(B(0.30, 0.03, 0.19, iron), 0, -0.36),
    ...[[-0.14, -0.085], [0.14, -0.085], [-0.14, 0.085], [0.14, 0.085]].map(([x, z]) => xf(B(0.02, 0.22, 0.02, iron), x, -0.245, z)),
    xf(CY(0.03, 0.03, 0.02, 6, iron), 0, -0.13),
  ]);
  frame.scale(scale, scale, scale);
  // the glass carries its own material so its emissive gain can be eased per lantern
  const gm = new THREE.MeshStandardMaterial({ flatShading: true, vertexColors: true, roughness: 0.4, emissive: new THREE.Color(colour), emissiveIntensity: litNow ? glassGain : 0.05 });
  const glassGeo = colorize(new THREE.BoxGeometry(0.24 * scale, 0.17 * scale, 0.14 * scale), colour);
  glassGeo.translate(0, -0.245 * scale, 0);
  const glass = new THREE.Mesh(glassGeo, gm);
  glass.layers.enable(BLOOM_LAYER);
  const frameMesh = new THREE.Mesh(frame, worldMat);
  frameMesh.castShadow = true;
  const light = new THREE.PointLight(colour, litNow ? cd : 0, range, 2);
  light.position.y = -0.245 * scale;
  pivot.add(frameMesh, glass, light);
  const l: Lantern = {
    pivot, light, glass, lit: litNow ? 1 : 0, target: litNow ? 1 : 0,
    update(t, dt, schedule) {
      l.lit += (l.target - l.lit) * Math.min(1, dt * 2.2);
      const flick = 0.85 + 0.15 * Math.sin(t * 8.8 + pivot.position.x * 3.1);
      light.intensity = cd * schedule * l.lit * flick;
      gm.emissiveIntensity = 0.05 + glassGain * schedule * l.lit * (0.9 + 0.1 * flick);
    },
  };
  void glassMats;
  return l;
}

/** A post with a lantern hanging from an arm (the Forest's L1, the Bog's seven posts). */
export function makePost(height: number, wood: string, iron: string, colour: string, cd: number, range: number, litNow: boolean): { group: THREE.Group; lantern: Lantern } {
  const group = new THREE.Group();
  worldMat ??= makeWorldMaterial();
  const post = new THREE.Mesh(mergeGeos([xf(CY(0.06, 0.07, height, 6, wood), 0, height / 2), xf(B(0.4, 0.05, 0.05, iron), 0.15, height - 0.05, 0)]), worldMat);
  post.castShadow = true; post.receiveShadow = true;
  const lantern = makeLantern(colour, cd, range, 3.0, iron, 1, litNow);
  lantern.pivot.position.set(0.32, height - 0.08, 0);
  group.add(post, lantern.pivot);
  return { group, lantern };
}
