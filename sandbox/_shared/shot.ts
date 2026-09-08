// Screenshot stations (camp.md §2.11.5, the fixed contract) plus study-only extras, URL params,
// and the save helper that posts the canvas to the dev server (vite-shot-plugin.ts).
import * as THREE from 'three';
import { deg } from './rng';

export interface Station { name: string; target: [number, number, number]; yaw: number; pitch: number; d: number; note: string }

export const STATIONS: Record<string, Station> = {
  S1: { name: 'Hearth', target: [0, 0.6, 0], yaw: 315, pitch: 48, d: 19, note: 'camp.md §2.11.5 S1' },
  S2: { name: 'Stream walk', target: [-2.5, 0.9, 7.5], yaw: 245, pitch: 50, d: 19, note: 'camp.md §2.11.5 S2' },
  S3: { name: 'Wreck and strip', target: [12, 0.8, 0.4], yaw: 75, pitch: 46, d: 21, note: 'camp.md §2.11.5 S3' },
  S4: { name: 'Pond and rim', target: [-45, -0.3, -30], yaw: 300, pitch: 45, d: 22, note: 'camp.md §2.11.5 S4' },
  // study-only framings (not scored stations)
  W1: { name: 'Hearth, wide', target: [0, 0.6, 0], yaw: 315, pitch: 44, d: 30, note: 'study: the diorama read from S1 pulled back' },
  L1: { name: 'Hearth, lower', target: [0, 0.9, 0], yaw: 315, pitch: 40, d: 22, note: 'study: S1 at the reference pitch so the pines enter the frame' },
  D1: { name: 'Diorama', target: [-6, 0, 2], yaw: 320, pitch: 40, d: 62, note: 'study: whole camp quadrant, rim and below-rim clouds' },
  CU: { name: 'Liam close-up', target: [-2.4, 0.95, 1.0], yaw: 320, pitch: 14, d: 4.6, note: 'study: the character at portrait distance (he faces bearing 150; camera looks along 320 so the face and the shield both read)' },
  DR: { name: 'Deer at the camp', target: [-2.7, 0.7, 3.7], yaw: 250, pitch: 16, d: 5.5, note: 'study: the eating pose at the first pass end' },
  DW: { name: 'Deer at the water', target: [-3.2, 0.3, 10.4], yaw: 215, pitch: 20, d: 6, note: 'study: the drink at the pool bank' },
  CF: { name: 'Fireside', target: [-1.0, 0.7, 0.4], yaw: 250, pitch: 22, d: 7.5, note: 'study: low fireside angle, tent behind' },
};

export function placeCamera(cam: THREE.PerspectiveCamera, s: Station): void {
  const f = new THREE.Vector3(Math.sin(deg(s.yaw)), 0, -Math.cos(deg(s.yaw)));
  const t = new THREE.Vector3(...s.target);
  const pos = t.clone().addScaledVector(f, -s.d * Math.cos(deg(s.pitch))).add(new THREE.Vector3(0, s.d * Math.sin(deg(s.pitch)), 0));
  cam.position.copy(pos);
  cam.lookAt(t);
}

export interface Params { shot: string; t: string; v: string; curve: number; post: boolean; ui: boolean; freeze: boolean; walk: boolean; step: boolean }
/**
 * `defaultT` is what `t` reads when the query string has none. The shared runtime passes `''` and
 * falls back to the scene's own `defaultTime` (T-29: a scene with no dusk used to get one); the
 * Forest scene calls this with no argument and keeps its dusk.
 */
export function readParams(defaultT = 'dusk'): Params {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') ?? 'S1',
    t: q.get('t') ?? defaultT,
    v: q.get('v') ?? 'A',
    curve: Number(q.get('curve') ?? '1'),
    post: q.get('post') !== '0',
    ui: q.get('ui') !== '0',
    freeze: q.get('freeze') === '1',
    walk: q.get('walk') === '1',
    step: q.get('step') === '1',
  };
}

export async function saveShot(canvas: HTMLCanvasElement, study: string, overlay?: (ctx: CanvasRenderingContext2D) => void): Promise<string> {
  let src: HTMLCanvasElement = canvas;
  if (overlay) {
    src = document.createElement('canvas'); src.width = canvas.width; src.height = canvas.height;
    const ctx = src.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
    overlay(ctx);
  }
  const data = src.toDataURL('image/png');
  const res = await fetch(`/__sandbox/shot?study=${encodeURIComponent(study)}`, { method: 'POST', body: data });
  const json = (await res.json()) as { file: string };
  return json.file;
}
