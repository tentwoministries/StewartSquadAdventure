// The stepping harness for the demo scenes (OPUS_FIX_PLAN.md §2, STUDY_NOTES.md §6 rule 8): a page
// that is not on screen gets no animation frames, so a mechanic is verified by *stepping* the
// runtime from the console or from a headless driver instead of waiting for it. `?step=1` turns off
// the hidden-tab tick and the animation loop's clock advance, so with it these three calls are the
// only things that move the scene. Installed once by scene.ts at the end of runScene.
//
//   ssStep(n)      renders exactly n frames of 1/60 s and returns the scene clock after them
//   ssSnap(name)   renders one frame and saves it under a lowercase name; returns the file
//   ssKey(k)       presses a key (scene keys, Tab, Enter); ssTHREE is three, for building vectors
//
// ssKey dispatches keydown only, so a movement key (WASD, shift) stays held as far as walk.ts is
// concerned: press one and step, do not press one and forget it.
import * as THREE from 'three';
import { saveShot } from './shot';

export interface StepApi {
  /** The scene's canvas: what ssSnap posts to the dev server. */
  canvas: HTMLCanvasElement;
  /** scene.ts's renderOnce: advances the scene clock by dt and draws one frame. */
  render: (dt: number) => void;
  /** The scene clock, in seconds. */
  clock: () => number;
  /** The title-card overlay to composite into a saved frame, or undefined while the card is hidden. */
  overlay: () => ((ctx: CanvasRenderingContext2D) => void) | undefined;
}

const FRAME = 1 / 60;

export function installStep(api: StepApi): void {
  const ssStep = (n: number): number => {
    const frames = Math.max(0, Math.round(n));
    for (let i = 0; i < frames; i++) api.render(FRAME);
    return api.clock();
  };
  const ssSnap = async (name: string): Promise<string> => {
    api.render(FRAME);
    return saveShot(api.canvas, name.toLowerCase(), api.overlay());
  };
  const ssKey = (k: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  };
  const w = window as unknown as Record<string, unknown>;
  w['ssStep'] = ssStep; w['ssSnap'] = ssSnap; w['ssKey'] = ssKey; w['ssTHREE'] = THREE;
}
