// Mouse orbit for the studies (Andrew's demo request, 2026-09-07): drag to rotate yaw and pitch,
// wheel to zoom, R to return to the station. The station stays the reproducible frame; the orbit
// is for exploring angles live. Pitch is clamped to the range cluster C will decide (Brief §4.5).
import type * as THREE from 'three';
import { deg } from './rng';
import { placeCamera, type Station } from './shot';

export interface Orbit {
  current: Station;
  reset: () => void;
  apply: () => void;
}

export function makeOrbit(cam: THREE.PerspectiveCamera, canvas: HTMLElement, station: Station, onChange: () => void): Orbit {
  const current: Station = { ...station, target: [...station.target] as [number, number, number] };
  let dragging = false, lx = 0, ly = 0;
  const apply = () => { placeCamera(cam, current); onChange(); };
  const reset = () => { Object.assign(current, { yaw: station.yaw, pitch: station.pitch, d: station.d }); apply(); };
  canvas.addEventListener('mousedown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    current.yaw = (current.yaw + dx * 0.35 + 360) % 360;
    current.pitch = Math.min(75, Math.max(18, current.pitch - dy * 0.25));
    apply();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    current.d = Math.min(80, Math.max(3, current.d * (e.deltaY > 0 ? 1.08 : 0.926)));
    apply();
  }, { passive: false });
  window.addEventListener('keydown', (e) => { if (e.key === 'r' || e.key === 'R') reset(); });
  // touch: one finger orbits, pinch zooms
  let pinch = 0;
  canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { lx = e.touches[0]!.clientX; ly = e.touches[0]!.clientY; } if (e.touches.length === 2) pinch = Math.hypot(e.touches[0]!.clientX - e.touches[1]!.clientX, e.touches[0]!.clientY - e.touches[1]!.clientY); }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) { const t = e.touches[0]!; current.yaw = (current.yaw + (t.clientX - lx) * 0.35 + 360) % 360; current.pitch = Math.min(75, Math.max(18, current.pitch - (t.clientY - ly) * 0.25)); lx = t.clientX; ly = t.clientY; apply(); }
    if (e.touches.length === 2) { const p = Math.hypot(e.touches[0]!.clientX - e.touches[1]!.clientX, e.touches[0]!.clientY - e.touches[1]!.clientY); current.d = Math.min(80, Math.max(3, current.d * (pinch / Math.max(1, p)))); pinch = p; apply(); }
  }, { passive: true });
  void deg;
  return { current, reset, apply };
}
