# Mockup log (Phase 0.75 visual studies)

One line per iteration: study · iteration · what changed · verdict. Verified library shapes (Rule 2) go at the top of the study that first used them. Working notes and the reasoning behind each change: `STUDY_NOTES.md`. Numbers of the current frames: `style-draft.json`.

**How to run a study:** `npm run dev`, then `http://localhost:5173/sandbox/forest-dusk/?shot=S1&t=dusk&v=B` (`shot` S1–S4 are the bible's stations, `W1` wide, `L1` lower pitch, `D1` diorama, `CU` close-up, `CF` fireside; `t` noon | golden | dusk | night; `v` A | B | C; `curve` 0–3; `post=0` raw; `ui=0` hides the number overlay; `freeze=1` stills motion). Keys are listed in the overlay. `S` (or `window.ssSave()`) posts the 1600 × 1000 canvas with the title card composited to the dev server, which writes `docs/design/mockups/forest-<time>-<shot>-<variant>-NN.png`.

## Study 1 — Forest dusk at the C1 camp, station S1

### Verified shapes (Rule 2, 2026-09-07, Node 24.16.0, real imports)

**`postprocessing` 6.39.4** (`node -e "import('postprocessing')"` and constructor source inspection):

| Export | Verified constructor / API |
|---|---|
| `EffectComposer(renderer, { depthBuffer = true, stencilBuffer = false, multisampling = 0, frameBufferType })` | methods `addPass`, `removePass`, `render(dt)`, `setSize(w, h)`, `dispose` |
| `RenderPass(scene, camera, overrideMaterial = null)` | — |
| `EffectPass(camera, ...effects)` | one convolution effect per pass; SMAA in its own pass |
| `BloomEffect({ blendFunction = SCREEN, luminanceThreshold = 1, luminanceSmoothing = 0.03, mipmapBlur = true, intensity = 1, radius = 0.85, levels = 8, kernelSize = LARGE, resolutionScale = 0.5 })` | setters `intensity`, `kernelSize` |
| `SelectiveBloomEffect(scene, camera, options)` | extends `BloomEffect`; `.selection` (a `Selection`: `layer`, `add`, `delete`, `toggle`, `set`, `clear`), `.inverted`, `.ignoreBackground` |
| `TiltShiftEffect({ blendFunction, offset = 0, rotation = 0, focusArea = 0.4, feather = 0.3, kernelSize = MEDIUM, resolutionScale = 0.5 })` | setters `rotation`, `offset`, `focusArea`, `feather`, `bias` |
| `VignetteEffect({ eskil = false, offset = 0.5, darkness = 0.5 })` | setters `technique`, `eskil`, `offset`, `darkness` |
| `SMAAEffect({ preset = SMAAPreset.MEDIUM, edgeDetectionMode = COLOR, predicationMode = DISABLED })` | `SMAAPreset.HIGH` used |
| `ToneMappingEffect({ mode = AGX by default, adaptive = false, … })` | `ToneMappingMode` = LINEAR 0, REINHARD 1, REINHARD2 2, REINHARD2_ADAPTIVE 3, UNCHARTED2 4, CINEON 5, **ACES_FILMIC 6**, AGX 7, NEUTRAL 8; **no exposure parameter** (the sandbox adds a one-line `Effect` subclass that multiplies by `exposure` before tone mapping) |
| `DepthOfFieldEffect(camera, { worldFocusDistance, worldFocusRange, focalLength, focusDistance, focusRange, bokehScale = 1, resolutionScale = 0.5 })` | not used (tilt-shift is the diorama look) |
| `Effect(name, fragmentShader, { blendFunction, uniforms: Map })` | `mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)` |
| `KernelSize` | VERY_SMALL 0, SMALL 1, MEDIUM 2, LARGE 3, VERY_LARGE 4, HUGE 5 |
| `BlendFunction` | SKIP, SET, ADD, ALPHA, AVERAGE, COLOR, …, SCREEN, SRC, … (35 keys) |

**three 0.185.1** (r185): `ShaderChunk` has `begin_vertex`, `project_vertex`, `worldpos_vertex`, `fog_pars_vertex`, `fog_vertex`, `fog_pars_fragment`, `fog_fragment`, `emissivemap_fragment`, `color_fragment`, `dithering_fragment`, `tonemapping_fragment`, `colorspace_fragment`. `fog_fragment` is `gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor)` under `USE_FOG`; the sandbox does not use `scene.fog` and injects its own camera-relative height fog after `#include <fog_fragment>` (`sandbox/_shared/material.ts`). `project_vertex` is replaced wholesale to apply the curved world in world space (`modelMatrix`, `instanceMatrix` under `USE_INSTANCING`, then `viewMatrix`). Constants: `ACESFilmicToneMapping` 4, `NoToneMapping` 0, `PCFSoftShadowMap` 2, `HalfFloatType` 1016, `SRGBColorSpace` `'srgb'`. Lights are physically based with no opt-out (the `useLegacyLights` flag is gone), which is why the bible's intensities needed the conversion in T-07. `InstancedMesh.setColorAt` multiplies vertex colours (used for hue/value jitter). `simplex-noise` 4.0.3: `createNoise2D(random)` returns `(x, y) => [-1, 1]`.

**Dev-server screenshot save:** a Vite `configureServer` middleware (`sandbox/_shared/vite-shot-plugin.ts`, serve-only) accepts `POST /__sandbox/shot?study=<name>` with a `data:image/png;base64,…` body and writes `docs/design/mockups/<name>-NN.png`. Verified: `canvas.toDataURL('image/png')` on a `preserveDrawingBuffer: true` WebGL2 canvas after the composer's final pass returns the frame (1.6 MB data URL at 1600 × 1000); the first attempt returned a blank canvas because the module had been hot-replaced mid-save (iteration 1a, file deleted).

### Iterations

| Study | Iter | Changed | Verdict |
|---|---|---|---|
| forest-dusk S1 | 1 (`forest-dusk-s1-a-02.png`) | First full frame: bible dusk row as written (key 1.2, hemi 0.5 in physical units), bloom threshold 0.55, tilt 0.36/0.34 MEDIUM, vignette 0.5, scatter at bible densities, 1 m terrain grid, tent emissive 1.6 | Orchestrator: reads as night, not dusk; tilt-shift band too tight and heavy; flowers and pebbles are confetti; 1 m grid makes the paths pixelated; the tent canvas blows to white; smoke invisible. Not shown to Andrew as a candidate; kept as the record of where the bible's numbers land |
| forest-dusk S1 | 2 (pane only) | UNITS key ×2.2 / hemi ×5; bloom threshold 0.8; tilt 0.5/0.55 SMALL at 0.75 res; vignette 0.35; flowers 0.25/m², pebbles 0.6/m², grass 2.5/m² wider blades; 0.5 m grid; tent 0.8; smoke brighter | Orchestrator: still night. Paths now read as curves |
| forest-dusk S1 | 3 (pane only, A/B/C) | UNITS key ×3.0 / hemi ×9.0; campfire 90 cd, lanterns 14 cd | Orchestrator: dusk at last. B (ember dusk) is the frame; A is flatter and greyer; C is a good late dusk. Grass tufts read as bright spikes; flowers still scattered |
| forest-dusk S1/L1/W1/CU | 4 (pane only) | Grass 1.6/m² in clusters, lighter tips; flowers only in six seeded drifts (2.5/m²) plus 0.06/m² singles; pebbles 0.3/m²; tent 0.5; variant B hemi `#6A5EA8`/`#3A6A3A` ×0.8 and key azimuth 250; new station `L1` (pitch 40, d 22) | Orchestrator: `L1` is the Fernwood read (the big pine, a birch and the tent's guy lines enter the frame); at the bible's 48° no canopy can. `CU` showed Liam's back: the facing conversion was wrong for a +z-forward rig |
| forest-dusk all | 5 (**saved**) | Liam faces bearing 150 correctly (rotation.y = 180° − b); `CU` yaw 320; grass 1.2/m², blades wider and shorter, tips only slightly lighter than the ground | **Sample set for Andrew:** `forest-dusk-s1-a-03.png` (A, bible), `forest-dusk-s1-b-01.png` (B, ember dusk), `forest-dusk-s1-c-01.png` (C, blue hour), `forest-dusk-l1-b-01.png` (B at the lower pitch), `forest-dusk-w1-b-01.png` (B, wide: stream and wreck), `forest-dusk-cu-b-01.png` (Liam at portrait distance), `forest-golden-l1-a-01.png` and `forest-night-l1-a-01.png` (the bible's golden hour and night rows through the same conversion, for context). Awaiting Andrew's verdict; the questions are in `STUDY_NOTES.md` §5 |
