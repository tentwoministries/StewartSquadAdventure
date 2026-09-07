// The post stack (world-events §2.4.3 order): selective bloom → tilt-shift → exposure → vignette →
// ACES tone mapping, then SMAA. Shapes verified against postprocessing 6.39.4 (LOG.md).
import * as THREE from 'three';
import {
  BlendFunction, Effect, EffectComposer, EffectPass, KernelSize, RenderPass, SMAAEffect, SMAAPreset,
  SelectiveBloomEffect, TiltShiftEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from 'postprocessing';

export const BLOOM_LAYER = 11;

class ExposureEffect extends Effect {
  constructor(exposure: number) {
    super(
      'ExposureEffect',
      'uniform float exposure; void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = vec4(inputColor.rgb * exposure, inputColor.a); }',
      { blendFunction: BlendFunction.SRC, uniforms: new Map([['exposure', new THREE.Uniform(exposure)]]) },
    );
  }
  set exposure(v: number) { (this.uniforms.get('exposure') as THREE.Uniform<number>).value = v; }
}

export interface PostStack {
  composer: EffectComposer;
  bloom: SelectiveBloomEffect;
  tilt: TiltShiftEffect;
  vignette: VignetteEffect;
  exposure: ExposureEffect;
  setSize: (w: number, h: number) => void;
  render: (dt: number) => void;
}

export const POST_DRAFT = {
  bloom: { threshold: 0.8, smoothing: 0.3, intensity: 1.0, radius: 0.7, levels: 6 },
  tilt: { offset: 0.0, focusArea: 0.5, feather: 0.55, kernel: 'SMALL' },
  vignette: { offset: 0.4, darkness: 0.35 },
  tone: 'ACES_FILMIC',
};

export function makePost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, exposure: number): PostStack {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new SelectiveBloomEffect(scene, camera, {
    blendFunction: BlendFunction.ADD,
    mipmapBlur: true,
    luminanceThreshold: POST_DRAFT.bloom.threshold,
    luminanceSmoothing: POST_DRAFT.bloom.smoothing,
    intensity: POST_DRAFT.bloom.intensity,
    radius: POST_DRAFT.bloom.radius,
    levels: POST_DRAFT.bloom.levels,
  });
  bloom.ignoreBackground = true;
  bloom.selection.layer = BLOOM_LAYER;
  const tilt = new TiltShiftEffect({
    offset: POST_DRAFT.tilt.offset, rotation: 0, focusArea: POST_DRAFT.tilt.focusArea, feather: POST_DRAFT.tilt.feather,
    kernelSize: KernelSize.SMALL, resolutionScale: 0.75,
  });
  const exposureFx = new ExposureEffect(exposure);
  const vignette = new VignetteEffect({ offset: POST_DRAFT.vignette.offset, darkness: POST_DRAFT.vignette.darkness });
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
  composer.addPass(new EffectPass(camera, bloom, tilt, exposureFx, vignette, tone));
  composer.addPass(new EffectPass(camera, smaa));
  return {
    composer, bloom, tilt, vignette, exposure: exposureFx,
    setSize: (w, h) => composer.setSize(w, h),
    render: (dt) => composer.render(dt),
  };
}
