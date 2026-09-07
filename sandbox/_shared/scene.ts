// The shared demo-scene runtime (Phase 0.75, STUDY_NOTES.md §6 rule 8): renderer, camera, the key
// and hemisphere lights, the sky, the post stack, the orbit, WASD walking, the HUD, the title card
// and party strip drawn into saved frames, the keys every scene shares, scene stepping, and the
// hidden-tab tick. A scene supplies a SceneDef: its keyframes, stations, kids, card and a build()
// that returns the world (groundY, blockers, a per-frame update). The Forest scene keeps its own
// main.ts (the family has seen it); the four new scenes run on this.
import * as THREE from 'three';
import { WORLD_U } from './material';
import { makeOrbit } from './orbit';
import { makePost, POST_DRAFT } from './post';
import type { Kid } from './rig';
import { placeCamera, readParams, saveShot, type Params, type Station } from './shot';
import { dirFrom, makeSky, type CloudSpec } from './sky';
import { UNITS, type Keyframe, type VariantId } from './style';
import { makeWalk, type Circle } from './walk';

export interface SceneCtx { hemiSky: THREE.Color; active: Kid; camera: THREE.PerspectiveCamera; keyDir: THREE.Vector3; freeze: boolean }
export interface SceneWorld {
  groundY: (x: number, z: number) => number;
  blockers: Circle[];
  waterY?: number;
  walkable?: (x: number, z: number) => boolean;
  maxStep?: number;
  applyKeyframe?: (kf: Keyframe, keyDir: THREE.Vector3, hemiSky: THREE.Color) => void;
  update: (t: number, dt: number, kf: Keyframe, ctx: SceneCtx) => void;
  hud?: () => string[];
  keys?: Record<string, { help: string; run: () => string | undefined }>;
  /** Where the active kid's head should look when nothing else is happening (a creature, a lamp). */
  poi?: (active: Kid) => THREE.Vector3 | null;
}
export interface SceneDef {
  id: string; eyebrow: string; eyebrowAccent: string; title: string; line: string;
  keyframes: Record<string, Keyframe>; times: string[]; defaultTime: string;
  variants?: { ids: VariantId[]; notes: Record<string, string>; apply: (base: Keyframe, v: VariantId) => Keyframe };
  stations: Record<string, Station>; defaultShot: string; extras: string[];
  kids: Kid[];
  /** Place a kid for a station: position, facing, look-at. */
  place: (kid: Kid, i: number, shot: string, groundY: (x: number, z: number) => number) => void;
  sky: 'dome' | 'cave'; clouds?: CloudSpec[];
  shadowHalf?: number; curveDefault?: number;
  prev: string; next: string;
  build: (scene: THREE.Scene, params: Params) => SceneWorld;
}

const W = 1600, H = 1000;

export function runScene(def: SceneDef): void {
  const params = readParams();
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.5, 1500);
  scene.add(camera);
  const half = def.shadowHalf ?? 26;
  const key = new THREE.DirectionalLight('#FFFFFF', 1);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -half; key.shadow.camera.right = half; key.shadow.camera.top = half; key.shadow.camera.bottom = -half;
  key.shadow.camera.near = 1; key.shadow.camera.far = 200; key.shadow.radius = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#4A4E8E', '#2A4A30', 0.5);
  scene.add(hemi);

  const winEarly = window as unknown as Record<string, unknown>;
  winEarly['ssKids'] = def.kids;
  const world = def.build(scene, params);
  const sky = def.sky === 'dome' ? makeSky(def.clouds) : null;
  if (sky) scene.add(sky.group);
  else scene.background = new THREE.Color('#04030A');
  for (const k of def.kids) scene.add(k.root);

  const station = def.stations[params.shot] ?? def.stations[def.defaultShot]!;
  const shot = def.stations[params.shot] ? params.shot : def.defaultShot;
  placeCamera(camera, station);
  const orbit = makeOrbit(camera, canvas, station, () => refreshHud());
  def.kids.forEach((k, i) => def.place(k, i, shot, world.groundY));
  let activeIdx = 0;
  const active = () => def.kids[activeIdx]!;
  const blockersFor = (k: Kid) => world.blockers.filter((c) => Math.hypot(c.x - k.root.position.x, c.z - k.root.position.z) > c.r + 0.6);
  const walkOpts = { hero: active().root, orbit, groundY: world.groundY, blockers: blockersFor(active()), ...(world.waterY !== undefined ? { waterY: world.waterY } : {}), ...(world.walkable ? { walkable: world.walkable } : {}), ...(world.maxStep !== undefined ? { maxStep: world.maxStep } : {}) };
  const walk = makeWalk(walkOpts);
  winEarly['ssWalk'] = walk;
  WORLD_U.uCurveCenter.value.set(station.target[0], station.target[2]);
  const curveLevels = [0, 0.0006, 0.0012, 0.0022];
  WORLD_U.uCurve.value = curveLevels[params.curve] ?? curveLevels[def.curveDefault ?? 1]!;

  // keyframe
  let timeIdx = Math.max(0, def.times.indexOf(params.t === 'dusk' && !def.times.includes('dusk') ? def.defaultTime : params.t));
  if (!def.times.includes(params.t)) timeIdx = Math.max(0, def.times.indexOf(def.defaultTime));
  let variantId: VariantId = (def.variants && def.variants.ids.includes(params.v as VariantId) ? params.v : def.variants?.ids[0] ?? 'A') as VariantId;
  let kf: Keyframe = def.keyframes[def.times[timeIdx]!]!;
  const hemiSky = new THREE.Color();
  const keyDir = new THREE.Vector3(0, 1, 0);
  function applyKeyframe(): void {
    const base = def.keyframes[def.times[timeIdx]!]!;
    kf = def.variants ? def.variants.apply(base, variantId) : base;
    keyDir.copy(dirFrom(kf.key.elev, kf.key.azim));
    key.color.set(kf.key.color); key.intensity = kf.key.intensity * UNITS.key;
    key.shadow.radius = kf.stars > 0.5 ? 5 : kf.key.elev < 20 ? 4 : 3;
    hemi.color.set(kf.hemi.sky); hemi.groundColor.set(kf.hemi.ground); hemi.intensity = kf.hemi.intensity * UNITS.hemi;
    hemiSky.set(kf.hemi.sky);
    WORLD_U.uFogColor.value.set(kf.fog.color); WORLD_U.uFogNear.value = kf.fog.near; WORLD_U.uFogFar.value = kf.fog.far;
    WORLD_U.uFogMax.value = kf.fog.max; WORLD_U.uFogHeight.value = kf.fog.height;
    WORLD_U.uEmissiveGain.value = kf.lantern;
    if (sky) {
      sky.uniforms.uZenith.value.set(kf.sky.zenith); sky.uniforms.uHorizon.value.set(kf.sky.horizon); sky.uniforms.uGround.value.set(kf.sky.ground);
      sky.uniforms.uSunDir.value.copy(keyDir); sky.uniforms.uSunColor.value.set(kf.key.color); sky.uniforms.uGlow.value = kf.sky.glow;
      sky.starU.uAlpha.value = kf.stars; sky.cloudMat.color.set(kf.cloud);
      const sunIsKey = !(kf.moon.on && kf.key.elev === kf.moon.elev && kf.key.azim === kf.moon.azim);
      sky.sun.visible = sunIsKey && kf.key.elev > 0;
      sky.sun.position.copy(keyDir).multiplyScalar(500); sky.sun.lookAt(0, 0, 0);
      sky.moon.visible = kf.moon.on;
    }
    for (const k of def.kids) k.ringLight.intensity = 3 * (kf.stars > 0 || def.sky === 'cave' ? 1 : 0);
    world.applyKeyframe?.(kf, keyDir, hemiSky);
    post.exposure.exposure = kf.exposure;
  }
  const post = makePost(renderer, scene, camera, 1);
  applyKeyframe();

  // UI
  const hud = document.getElementById('hud')!, toast = document.getElementById('toast')!, card = document.getElementById('card')!;
  const keysEl = document.getElementById('keys')!, party = document.getElementById('party')!;
  card.innerHTML = `<div class="eyebrow">${def.eyebrow} · <b>${def.eyebrowAccent}</b></div><div class="name">${def.title}</div><div class="rule"></div><div class="line">${def.line}</div>`;
  function renderParty(): void {
    party.innerHTML = def.kids.map((k, i) => `<div class="member${i === activeIdx ? ' active' : ''}"><div class="portrait" style="background: radial-gradient(circle at 45% 40%, ${k.colours.base}, ${k.colours.dark} 70%); box-shadow: 0 0 0 2px rgba(11,14,26,0.55), 0 0 0 4px ${i === activeIdx ? k.colours.glow : 'rgba(11,14,26,0.35)'}"></div><div><div class="name">${k.name}</div><div class="hp"><i></i></div></div></div>`).join('');
  }
  renderParty();
  let showHud = params.ui, showCard = true, freeze = params.freeze, usePost = params.post, blur = true;
  const sceneKeys = world.keys ?? {};
  function refreshHud(): void {
    hud.classList.toggle('hidden', !showHud);
    card.classList.toggle('hidden', !showCard); keysEl.classList.toggle('hidden', !showCard); party.classList.toggle('hidden', !showCard);
    const s = station;
    const extra = Object.entries(sceneKeys).map(([k, v]) => `${k} ${v.help}`).join(' · ');
    hud.textContent = [
      `scene ${def.id} · ${s.name} (${shot}) yaw ${orbit.current.yaw.toFixed(0)} pitch ${orbit.current.pitch.toFixed(0)} d ${orbit.current.d.toFixed(1)} fov 35${orbit.current.pitch !== s.pitch || orbit.current.yaw !== s.yaw || orbit.current.d !== s.d ? ' (orbited; R resets)' : ''}`,
      `time ${kf.name}${def.variants ? ` · variant ${variantId}: ${def.variants.notes[variantId] ?? ''}` : ''} · hero ${active().name}`,
      `key ${kf.key.color} ×${kf.key.intensity} (×${UNITS.key} phys) elev ${kf.key.elev}° az ${kf.key.azim}° · hemi ${kf.hemi.sky}/${kf.hemi.ground} ×${kf.hemi.intensity} (×${UNITS.hemi} phys)`,
      `fog ${kf.fog.color} ${kf.fog.near}/${kf.fog.far} m max ${kf.fog.max} h ${kf.fog.height} · sky ${kf.sky.zenith} ${kf.sky.horizon} ${kf.sky.ground}`,
      `exposure ${kf.exposure} · bloom thr ${POST_DRAFT.bloom.threshold} int ${POST_DRAFT.bloom.intensity} · tilt ${blur ? `${POST_DRAFT.tilt.focusArea}/${POST_DRAFT.tilt.feather}` : 'off'} · vignette ${POST_DRAFT.vignette.darkness} · curve ${WORLD_U.uCurve.value} · post ${usePost ? 'on' : 'off'}${freeze ? ' · FROZEN' : ''}`,
      ...(world.hud?.() ?? []),
      `WASD walk · shift run · drag orbit · wheel zoom · R reset · B blur · X flourish${def.kids.length > 1 ? ' · Tab swap kid' : ''} · ${extra ? extra + ' · ' : ''}1-4 stations 5-9 ${def.extras.join('/')} · T time${def.variants ? ' · V variant' : ''} · K curve · P post · F freeze · U card · O this · , . scenes · H hub · Enter save`,
    ].join('\n');
  }
  function say(msg: string): void { toast.textContent = msg; toast.style.opacity = '1'; setTimeout(() => (toast.style.opacity = '0'), 2200); }
  function go(q: Record<string, string>, path?: string): void {
    const u = new URL(path ?? location.href, location.href);
    if (!path) for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
    else for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
    location.href = u.toString();
  }
  window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '4') { if (def.stations[`S${e.key}`]) go({ shot: `S${e.key}` }); }
    else if (e.key >= '5' && e.key <= '9') { const x = def.extras[Number(e.key) - 5]; if (x) go({ shot: x }); }
    else if (e.key === 't' || e.key === 'T') { timeIdx = (timeIdx + 1) % def.times.length; applyKeyframe(); refreshHud(); }
    else if ((e.key === 'v' || e.key === 'V') && def.variants) { const ids = def.variants.ids; variantId = ids[(ids.indexOf(variantId) + 1) % ids.length]!; applyKeyframe(); refreshHud(); }
    else if (e.key === 'k' || e.key === 'K') { const i = (curveLevels.indexOf(WORLD_U.uCurve.value) + 1) % curveLevels.length; WORLD_U.uCurve.value = curveLevels[i]!; refreshHud(); }
    else if (e.key === 'p' || e.key === 'P') { usePost = !usePost; refreshHud(); }
    else if (e.key === 'f' || e.key === 'F') { freeze = !freeze; refreshHud(); }
    else if (e.key === 'u' || e.key === 'U') { showCard = !showCard; refreshHud(); }
    else if (e.key === 'o' || e.key === 'O') { showHud = !showHud; refreshHud(); }
    else if (e.key === 'Enter') { void save(); }
    else if (e.key === 'b' || e.key === 'B') { blur = !blur; post.tilt.blendMode.opacity.value = blur ? 1 : 0; say(`tilt-shift ${blur ? 'on' : 'off'}`); refreshHud(); }
    else if (e.key === 'x' || e.key === 'X') { active().flourish(); say(`${active().name}!`); }
    else if (e.key === 'Tab') { e.preventDefault(); if (def.kids.length > 1) { activeIdx = (activeIdx + 1) % def.kids.length; walk.setHero(active().root); walk.setBlockers(blockersFor(active())); renderParty(); say(`${active().name}`); refreshHud(); } }
    else if (e.key === ',') go({ t: def.times[timeIdx]! }, `../${def.prev}/`);
    else if (e.key === '.') go({ t: def.times[timeIdx]! }, `../${def.next}/`);
    else if (e.key === 'h' || e.key === 'H') { location.href = '../'; }
    else if (sceneKeys[e.key]) { const m = sceneKeys[e.key]!.run(); if (m) say(m); refreshHud(); }
  });
  async function save(): Promise<void> {
    renderOnce(1 / 60);
    const name = `${def.id}-${def.times[timeIdx]}-${shot.toLowerCase()}${def.variants ? `-${variantId.toLowerCase()}` : ''}`;
    const file = await saveShot(canvas, name, showCard ? drawOverlay : undefined);
    say(`saved ${file}`);
  }
  function drawOverlay(ctx: CanvasRenderingContext2D): void {
    const serif = 'Lora, Georgia, "Times New Roman", serif', sans = 'Nunito, "Segoe UI", system-ui, sans-serif';
    const panel = (x: number, y: number, w: number, h: number, a = 0.55) => { ctx.fillStyle = `rgba(11,14,26,${a})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); };
    ctx.font = '600 36px ' + serif;
    const cw = Math.max(300, ctx.measureText(def.title).width + 52);
    panel(28, H - 36 - 128, cw, 128);
    ctx.fillStyle = '#D4C4A8'; ctx.font = '600 10px ' + sans; ctx.letterSpacing = '2px'; ctx.fillText(`${def.eyebrow.toUpperCase()} · `, 52, H - 36 - 128 + 28);
    ctx.fillStyle = '#E8A838'; ctx.font = '800 10px ' + sans; ctx.fillText(def.eyebrowAccent.toUpperCase(), 52 + ctx.measureText(`${def.eyebrow.toUpperCase()} · `).width, H - 36 - 128 + 28); ctx.letterSpacing = '0px';
    ctx.fillStyle = '#FFF5E6'; ctx.font = '600 36px ' + serif; ctx.fillText(def.title, 52, H - 36 - 128 + 66);
    ctx.fillStyle = 'rgba(232,168,56,0.85)'; ctx.fillRect(52, H - 36 - 128 + 78, 42, 2);
    ctx.fillStyle = '#D4C4A8'; ctx.font = 'italic 18px ' + serif; ctx.fillText(def.line, 52, H - 36 - 128 + 106);
    def.kids.forEach((k, i) => {
      const x = 51 + i * 150, y = 49;
      const g = ctx.createRadialGradient(x + 20, y + 18, 2, x, y, 26); g.addColorStop(0, k.colours.base); g.addColorStop(1, k.colours.dark);
      ctx.strokeStyle = i === activeIdx ? k.colours.glow : 'rgba(11,14,26,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 25, 0, 6.29); ctx.stroke();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 23, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#FFF5E6'; ctx.font = '800 15px ' + sans; ctx.fillText(k.name, x + 35, 46);
      panel(x + 35, 52, 100, 6, 0.55); ctx.fillStyle = '#FFF5E6'; ctx.fillRect(x + 35, 52, 100, 6);
    });
    const hints: [string[], string][] = [[['W', 'A', 'S', 'D'], 'walk'], [['⇧'], 'run'], [['space'], 'dodge'], [['E'], 'interact'], [['Tab'], 'swap']];
    ctx.font = '700 12px ' + sans;
    let tw = 28; for (const [k, l] of hints) { for (const kk of k) tw += ctx.measureText(kk).width + 16; tw += ctx.measureText(l).width + 14; }
    let x = (W - tw) / 2; panel(x, H - 22 - 32, tw, 32); x += 14;
    for (const [k, l] of hints) {
      for (const kk of k) { const kw = ctx.measureText(kk).width + 10; ctx.fillStyle = '#FFF5E6'; ctx.beginPath(); ctx.roundRect(x, H - 22 - 24, kw, 17, 5); ctx.fill(); ctx.fillStyle = '#2B2118'; ctx.font = '800 11px ' + sans; ctx.fillText(kk, x + 5, H - 22 - 11); ctx.font = '700 12px ' + sans; x += kw + 6; }
      ctx.fillStyle = '#D4C4A8'; ctx.fillText(l, x, H - 22 - 11); x += ctx.measureText(l).width + 14;
    }
  }
  const win = window as unknown as Record<string, unknown>;
  win['ssSave'] = save; win['ssSet'] = go; win['ssOrbit'] = orbit; win['ssWalk'] = walk; win['ssKids'] = def.kids; win['ssWorld'] = world; win['ssActive'] = active; win['ssKf'] = () => kf;
  refreshHud();
  function fit(): void {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const f = document.getElementById('frame') as HTMLElement;
    f.style.transform = `scale(${s})`; f.style.left = `${(window.innerWidth - W * s) / 2}px`; f.style.top = `${(window.innerHeight - H * s) / 2}px`;
  }
  window.addEventListener('resize', fit); fit();

  // loop
  let t = params.freeze ? 12.3 : 0, last = performance.now();
  const ctx: SceneCtx = { hemiSky, active: active(), camera, keyDir, freeze };
  function renderOnce(dt: number): void {
    if (!freeze) t += dt;
    WORLD_U.uTime.value = t;
    if (sky) sky.starU.uTime.value = t;
    const a = active();
    ctx.active = a; ctx.freeze = freeze;
    if (!freeze) walk.update(dt);
    // heads: the walker looks ahead; idle kids look at the scene's point of interest, else at the active kid
    const poi = world.poi?.(a);
    for (const k of def.kids) {
      if (k === a && walk.moving) k.lookAt.set(k.root.position.x + Math.sin(k.root.rotation.y) * 6, 0.9, k.root.position.z + Math.cos(k.root.rotation.y) * 6);
      else if (k === a && poi) k.lookAt.copy(poi);
      else if (k !== a) k.lookAt.set(a.root.position.x, a.root.position.y + 1.0, a.root.position.z);
      k.update(t, dt, k === a && walk.moving);
    }
    // the key light and its shadow box follow the active kid, so shadows never run out when walking
    key.target.position.set(a.root.position.x, 0, a.root.position.z);
    key.position.copy(key.target.position).addScaledVector(keyDir, 70);
    world.update(t, dt, kf, ctx);
    if (sky) {
      sky.clouds.forEach((c) => { c.mesh.position.set(c.base.x + t * 0.4 * (c.base.y > 0 ? 1 : 0.5), c.base.y + Math.sin(t * 0.25 + c.phase) * 0.4, c.base.z); });
      sky.group.position.set(camera.position.x, 0, camera.position.z);
      sky.moon.position.copy(dirFrom(kf.moon.elev, kf.moon.azim)).multiplyScalar(500); sky.moon.lookAt(sky.group.position.x, 0, sky.group.position.z); sky.moon.lookAt(0, 0, 0);
    }
    if (usePost) post.render(dt); else renderer.render(scene, camera);
  }
  function frame(now: number): void {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    renderOnce(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setInterval(() => { if (document.hidden) { const now = performance.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now; renderOnce(dt); } }, 33);
}

/** The page every scene uses (index.html keeps only the frame, canvas and the empty UI nodes). */
export const SCENE_CSS = '';
