// Study 1: Forest dusk at the C1 camp from station S1 (PHASE_0.75_BRIEF.md §3.3).
// URL: ?shot=S1&t=dusk&v=A&curve=1&post=1&ui=1&freeze=0   Keys: see the HUD.
import * as THREE from 'three';
import { WORLD_U } from '../_shared/material';
import { makePost, POST_DRAFT } from '../_shared/post';
import { makeOrbit } from '../_shared/orbit';
import { placeCamera, readParams, saveShot, STATIONS } from '../_shared/shot';
import { dirFrom, makeSky } from '../_shared/sky';
import { KEYFRAMES, LIGHT, UNITS, VARIANT_NOTES, variant, type Keyframe, type VariantId } from '../_shared/style';
import { deg } from '../_shared/rng';
import { makeDeer } from './deer';
import { makeFx } from './fx';
import { makeLiam } from './liam';
import { makeProps } from './props';
import { makeScatter, makeTrees } from './scatter';
import { groundY, makeTerrain } from './terrain';
import { makeWalk } from './walk';

const W = 1600, H = 1000;
const params = readParams();
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.5, 1500);
scene.add(camera);

// lights: one directional (sun by day, moon by night), one hemisphere, the pooled points
const key = new THREE.DirectionalLight('#FF8C5A', 1.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -24; key.shadow.camera.right = 24; key.shadow.camera.top = 24; key.shadow.camera.bottom = -24;
key.shadow.camera.near = 1; key.shadow.camera.far = 160;
key.shadow.radius = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
scene.add(key, key.target);
const hemi = new THREE.HemisphereLight('#4A4E8E', '#2A4A30', 0.5);
scene.add(hemi);

// world
const terrain = makeTerrain();
scene.add(terrain.mesh, terrain.rim, terrain.water);
const trees = makeTrees();
scene.add(trees.group);
const props = makeProps();
scene.add(props.group);
const scatter = makeScatter(props.footprints, trees.trunks);
scene.add(scatter.group);
const liam = makeLiam();
scene.add(liam.root);
// the camp-meadow deer (camp.md §2.9: habitat x −20..−8, z −14..−6), avoiding the tent, the fire and the boulders
// demo patch on the camp side of the tent so it stays in the S1/L1 frame; avoids the tent, the fire, Liam, the woodpile and the boulders
const deer = makeDeer({ x: -8, z: 4, r: 5.5, avoid: [{ x: -6, z: -3, r: 4 }, { x: 0, z: 0, r: 5 }, { x: -2.4, z: 1, r: 2.2 }, { x: -3.6, z: 2, r: 1.8 }, { x: -9, z: 3.5, r: 2.4 }, { x: -1.2, z: 4.6, r: 1 }] });
deer.park(-9, -1, 135); // parked facing south-east, roughly toward the camp, so the first pass starts without a wheel-round
scene.add(deer.root);
const sky = makeSky();
scene.add(sky.group);
const fx = makeFx();
fx.group.position.set(0, groundY(0, 0), 0);
scene.add(fx.group);

// station and pose
const station = STATIONS[params.shot] ?? STATIONS['S1']!;
placeCamera(camera, station);
const orbit = makeOrbit(camera, canvas, station, () => refreshHud());
// WASD walking (Andrew's demo): blockers are the prop footprints and trunks, minus whatever Liam starts inside
const walking = params.shot === 'S2' || params.walk;
// deer study stations start with the deer parked at the pose being judged
if (params.shot === 'DR') deer.park(-2.7, 3.7, 40);
if (params.shot === 'DW') deer.park(-3.2, 10.0, 180);
// Liam faces local +z (his eyes), so a compass bearing b becomes rotation.y = 180° − b (the deer faces +x: 90° − b)
if (walking) { liam.root.position.set(-2.5, groundY(-2.5, 7.5), 7.5); liam.root.rotation.y = deg(180 - 205); liam.lookAt.set(-5.5, 0.5, 12.4); }
else { liam.root.position.set(-2.4, groundY(-2.4, 1.0), 1.0); liam.root.rotation.y = deg(180 - 150); liam.lookAt.set(0, 0.5, 0); }
const walkCtl = makeWalk(liam.root, orbit, groundY, [...props.footprints, ...trees.trunks].filter((c) => Math.hypot(c.x - liam.root.position.x, c.z - liam.root.position.z) > c.r + 0.6), liam.ring);
key.target.position.set(station.target[0], 0, station.target[2]);
WORLD_U.uCurveCenter.value.set(station.target[0], station.target[2]);
const curveLevels = [0, 0.0006, 0.0012, 0.0022];
WORLD_U.uCurve.value = curveLevels[params.curve] ?? 0.0006;

// keyframe
const times = ['noon', 'golden', 'dusk', 'night'];
let timeIdx = Math.max(0, times.indexOf(params.t));
let variantId = (['A', 'B', 'C'].includes(params.v) ? params.v : 'A') as VariantId;
let kf: Keyframe = KEYFRAMES['dusk']!;
const hemiSky = new THREE.Color();
function applyKeyframe(): void {
  kf = variant(KEYFRAMES[times[timeIdx]!]!, variantId);
  const kd = dirFrom(kf.key.elev, kf.key.azim);
  key.color.set(kf.key.color); key.intensity = kf.key.intensity * UNITS.key;
  key.position.copy(key.target.position).addScaledVector(kd, 70);
  key.shadow.radius = kf.stars > 0.5 ? 5 : kf.key.elev < 20 ? 4 : 3;
  hemi.color.set(kf.hemi.sky); hemi.groundColor.set(kf.hemi.ground); hemi.intensity = kf.hemi.intensity * UNITS.hemi;
  hemiSky.set(kf.hemi.sky);
  WORLD_U.uFogColor.value.set(kf.fog.color); WORLD_U.uFogNear.value = kf.fog.near; WORLD_U.uFogFar.value = kf.fog.far;
  WORLD_U.uFogMax.value = kf.fog.max; WORLD_U.uFogHeight.value = kf.fog.height;
  WORLD_U.uEmissiveGain.value = kf.lantern;
  sky.uniforms.uZenith.value.set(kf.sky.zenith); sky.uniforms.uHorizon.value.set(kf.sky.horizon); sky.uniforms.uGround.value.set(kf.sky.ground);
  sky.uniforms.uSunDir.value.copy(kd); sky.uniforms.uSunColor.value.set(kf.key.color); sky.uniforms.uGlow.value = kf.sky.glow;
  sky.starU.uAlpha.value = kf.stars;
  sky.cloudMat.color.set(kf.cloud);
  const sunIsKey = !(kf.moon.on && kf.key.elev === kf.moon.elev && kf.key.azim === kf.moon.azim);
  sky.sun.visible = sunIsKey && kf.key.elev > 0;
  sky.sun.position.copy(kd).multiplyScalar(500); sky.sun.lookAt(0, 0, 0);
  sky.moon.visible = kf.moon.on;
  const md = dirFrom(kf.moon.elev, kf.moon.azim);
  sky.moon.position.copy(md).multiplyScalar(500); sky.moon.lookAt(0, 0, 0);
  props.fireLight.intensity = LIGHT.campfire.intensity * kf.fire;
  for (const l of props.lanternLights) l.intensity = LIGHT.lantern.intensity * kf.lantern;
  liam.ringLight.intensity = LIGHT.ring.intensity * (kf.stars > 0 ? 1 : 0);
  (terrain.waterU['uSunDir'] as { value: THREE.Vector3 }).value.copy(kd);
  (terrain.waterU['uSunColor'] as { value: THREE.Color }).value.set(kf.key.color).multiplyScalar(kf.key.intensity * 0.5);
  (terrain.waterU['uAmbient'] as { value: THREE.Color }).value.set(kf.hemi.sky).multiplyScalar(0.9);
  (terrain.waterU['uGlint'] as { value: number }).value = kf.key.elev < 25 && kf.key.elev > 0 ? 1.0 : 0.4;
  post.exposure.exposure = kf.exposure;
}
const post = makePost(renderer, scene, camera, 1);
applyKeyframe();

// UI
const hud = document.getElementById('hud')!, toast = document.getElementById('toast')!, card = document.getElementById('card')!;
const keysEl = document.getElementById('keys')!, party = document.getElementById('party')!;
let showHud = params.ui, showCard = true, freeze = params.freeze, usePost = params.post, blur = true;
function refreshHud(): void {
  hud.classList.toggle('hidden', !showHud);
  card.classList.toggle('hidden', !showCard); keysEl.classList.toggle('hidden', !showCard); party.classList.toggle('hidden', !showCard);
  const s = station;
  hud.textContent = [
    `study forest-dusk · ${s.name} (${params.shot}) yaw ${orbit.current.yaw.toFixed(0)} pitch ${orbit.current.pitch.toFixed(0)} d ${orbit.current.d.toFixed(1)} fov 35${orbit.current.pitch !== s.pitch || orbit.current.yaw !== s.yaw || orbit.current.d !== s.d ? ' (orbited; R resets)' : ''}`,
    `time ${kf.name} (p ${kf.p}) · variant ${variantId}: ${VARIANT_NOTES[variantId]}`,
    `key ${kf.key.color} ×${kf.key.intensity} (×${UNITS.key} phys) elev ${kf.key.elev}° az ${kf.key.azim}° · hemi ${kf.hemi.sky}/${kf.hemi.ground} ×${kf.hemi.intensity} (×${UNITS.hemi} phys)`,
    `fog ${kf.fog.color} ${kf.fog.near}/${kf.fog.far} m max ${kf.fog.max} · sky ${kf.sky.zenith} ${kf.sky.horizon} ${kf.sky.ground}`,
    `exposure ${kf.exposure} · bloom thr ${POST_DRAFT.bloom.threshold} int ${POST_DRAFT.bloom.intensity} · tilt ${blur ? `${POST_DRAFT.tilt.focusArea}/${POST_DRAFT.tilt.feather}` : 'off'} · vignette ${POST_DRAFT.vignette.darkness}`,
    `deer ${deer.speed.value.toFixed(2)} m/s · fire ${LIGHT.campfire.intensity * kf.fire} cd ${LIGHT.campfire.range} m · lantern ${LIGHT.lantern.intensity * kf.lantern} cd · curve ${WORLD_U.uCurve.value} · post ${usePost ? 'on' : 'off'}${freeze ? ' · FROZEN' : ''}`,
    `WASD walk · shift run · drag orbit · wheel zoom · R reset · B blur · 0 deer walks · [ ] deer speed · 1-4 stations 5-9 W1/D1/CU/CF/L1 · T time · V variant · K curve · P post · F freeze · U card · O this · , . scenes · H hub · Enter save`,
  ].join('\n');
}
function say(msg: string): void { toast.textContent = msg; toast.style.opacity = '1'; setTimeout(() => (toast.style.opacity = '0'), 2200); }
function go(q: Record<string, string>): void {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
  location.href = u.toString();
}
window.addEventListener('keydown', (e) => {
  const extras = ['W1', 'D1', 'CU', 'CF', 'L1'];
  if (e.key >= '1' && e.key <= '4') go({ shot: `S${e.key}` });
  else if (e.key >= '5' && e.key <= '9') go({ shot: extras[Number(e.key) - 5]! });
  else if (e.key === 't' || e.key === 'T') { timeIdx = (timeIdx + 1) % times.length; applyKeyframe(); refreshHud(); }
  else if (e.key === 'v' || e.key === 'V') { variantId = variantId === 'A' ? 'B' : variantId === 'B' ? 'C' : 'A'; applyKeyframe(); refreshHud(); }
  else if (e.key === 'k' || e.key === 'K') { const i = (curveLevels.indexOf(WORLD_U.uCurve.value) + 1) % curveLevels.length; WORLD_U.uCurve.value = curveLevels[i]!; refreshHud(); }
  else if (e.key === 'p' || e.key === 'P') { usePost = !usePost; refreshHud(); }
  else if (e.key === 'f' || e.key === 'F') { freeze = !freeze; refreshHud(); }
  else if (e.key === 'u' || e.key === 'U') { showCard = !showCard; refreshHud(); }
  else if (e.key === 'o' || e.key === 'O') { showHud = !showHud; refreshHud(); }
  else if (e.key === 'Enter') { void save(); }
  else if (e.key === 'b' || e.key === 'B') { blur = !blur; post.tilt.blendMode.opacity.value = blur ? 1 : 0; say(`tilt-shift ${blur ? 'on' : 'off'}`); refreshHud(); }
  else if (e.key === '0') { deer.walkNow(); say('deer: walking'); }
  else if (e.key === ',') { location.href = '../caves-descent/?shot=S1&t=half'; }
  else if (e.key === '.') { location.href = '../desert-noon/?shot=S1&t=noon'; }
  else if (e.key === 'h' || e.key === 'H') { location.href = '../'; }
  else if (e.key === '[' || e.key === ']') { deer.speed.value = Math.round(Math.max(0.2, Math.min(1.6, deer.speed.value + (e.key === ']' ? 0.05 : -0.05))) * 100) / 100; say(`deer speed ${deer.speed.value.toFixed(2)} m/s`); refreshHud(); }
});
// A save renders a frame itself: right after load the synchronous world build delays the first frame,
// and a hidden browser pane stops requestAnimationFrame entirely.
async function save(): Promise<void> {
  renderOnce(1 / 60);
  const name = `forest-${times[timeIdx]}-${params.shot.toLowerCase()}-${variantId.toLowerCase()}`;
  const file = await saveShot(canvas, name, showCard ? drawOverlay : undefined);
  say(`saved ${file}`);
}
// The DOM card, party strip and key hints, drawn into the saved PNG so a frame is self-contained.
function drawOverlay(ctx: CanvasRenderingContext2D): void {
  const serif = 'Lora, Georgia, "Times New Roman", serif', sans = 'Nunito, "Segoe UI", system-ui, sans-serif';
  const panel = (x: number, y: number, w: number, h: number, a = 0.55) => { ctx.fillStyle = `rgba(11,14,26,${a})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); };
  panel(28, H - 36 - 128, 300, 128);
  ctx.fillStyle = '#D4C4A8'; ctx.font = '600 10px ' + sans; ctx.letterSpacing = '2px'; ctx.fillText('FOREST · ', 52, H - 36 - 128 + 28);
  ctx.fillStyle = '#E8A838'; ctx.font = '800 10px ' + sans; ctx.fillText('HOME', 52 + ctx.measureText('FOREST · ').width, H - 36 - 128 + 28); ctx.letterSpacing = '0px';
  ctx.fillStyle = '#FFF5E6'; ctx.font = '600 36px ' + serif; ctx.fillText('Stewart Camp', 52, H - 36 - 128 + 66);
  ctx.fillStyle = 'rgba(232,168,56,0.85)'; ctx.fillRect(52, H - 36 - 128 + 78, 42, 2);
  ctx.fillStyle = '#D4C4A8'; ctx.font = 'italic 18px ' + serif; ctx.fillText('Tent, fire, one bedroll. For now.', 52, H - 36 - 128 + 106);
  // party strip
  const g = ctx.createRadialGradient(51 + 20, 49 + 18, 2, 51, 49, 26); g.addColorStop(0, '#2A62CF'); g.addColorStop(1, '#173A86');
  ctx.strokeStyle = '#4A9ED8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(51, 49, 25, 0, 6.29); ctx.stroke();
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(51, 49, 23, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#FFF5E6'; ctx.font = '800 15px ' + sans; ctx.fillText('Liam', 86, 46);
  panel(86, 52, 120, 6, 0.55); ctx.fillStyle = '#FFF5E6'; ctx.fillRect(86, 52, 120, 6);
  // key hints
  const hints: [string[], string][] = [[['W', 'A', 'S', 'D'], 'walk'], [['⇧'], 'run'], [['space'], 'dodge'], [['E'], 'interact'], [['Tab'], 'swap']];
  ctx.font = '700 12px ' + sans;
  let tw = 28; for (const [k, l] of hints) { for (const kk of k) tw += ctx.measureText(kk).width + 16; tw += ctx.measureText(l).width + 14; }
  let x = (W - tw) / 2; panel(x, H - 22 - 32, tw, 32);
  x += 14;
  for (const [k, l] of hints) {
    for (const kk of k) { const kw = ctx.measureText(kk).width + 10; ctx.fillStyle = '#FFF5E6'; ctx.beginPath(); ctx.roundRect(x, H - 22 - 24, kw, 17, 5); ctx.fill(); ctx.fillStyle = '#2B2118'; ctx.font = '800 11px ' + sans; ctx.fillText(kk, x + 5, H - 22 - 11); ctx.font = '700 12px ' + sans; x += kw + 6; }
    ctx.fillStyle = '#D4C4A8'; ctx.fillText(l, x, H - 22 - 11); x += ctx.measureText(l).width + 14;
  }
}
(window as unknown as { ssSave: () => Promise<void> }).ssSave = save;
(window as unknown as { ssDeer: typeof deer }).ssDeer = deer;
(window as unknown as { ssWalk: typeof walkCtl }).ssWalk = walkCtl;
(window as unknown as { ssLiam: THREE.Object3D; ssOrbit: typeof orbit }).ssLiam = liam.root;
(window as unknown as { ssOrbit: typeof orbit }).ssOrbit = orbit;
(window as unknown as { ssSet: (q: Record<string, string>) => void }).ssSet = go;
refreshHud();

function fit(): void {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  const f = document.getElementById('frame') as HTMLElement;
  f.style.transform = `scale(${s})`;
  f.style.left = `${(window.innerWidth - W * s) / 2}px`; f.style.top = `${(window.innerHeight - H * s) / 2}px`;
}
window.addEventListener('resize', fit);
fit();

// loop
let t = params.freeze ? 12.3 : 0, last = performance.now();
const shadowTarget = new THREE.Vector3();
function renderOnce(dt: number): void {
  if (!freeze) t += dt;
  WORLD_U.uTime.value = t;
  sky.starU.uTime.value = t;
  const flVal = fx.update(t, dt, kf, hemiSky);
  props.fireLight.intensity = LIGHT.campfire.intensity * kf.fire * (0.8 + 0.15 * flVal);
  props.lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 0.6 + i * 2.1) * 0.05; l.rotation.x = Math.sin(t * 0.45 + i) * 0.03; });
  props.lanternLights.forEach((l, i) => { l.intensity = LIGHT.lantern.intensity * kf.lantern * (0.85 + 0.15 * Math.sin(t * (8.8 + i * 0.4) + i)); });
  if (!freeze) walkCtl.update(dt);
  if (walkCtl.moving) liam.lookAt.set(liam.root.position.x + Math.sin(liam.root.rotation.y) * 6, 0.9, liam.root.position.z + Math.cos(liam.root.rotation.y) * 6);
  liam.update(t, dt, walking || walkCtl.moving);
  if (!freeze) deer.update(t, dt, groundY);
  sky.clouds.forEach((c) => { c.mesh.position.set(c.base.x + t * 0.4 * (c.base.y > 0 ? 1 : 0.5), c.base.y + Math.sin(t * 0.25 + c.phase) * 0.4, c.base.z); });
  sky.group.position.set(camera.position.x, 0, camera.position.z);
  sky.moon.position.copy(dirFrom(kf.moon.elev, kf.moon.azim)).multiplyScalar(500).add(sky.group.position.clone().negate()).add(sky.group.position);
  shadowTarget.set(station.target[0], 0, station.target[2]);
  if (usePost) post.render(dt); else renderer.render(scene, camera);
}
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  renderOnce(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// A hidden tab gets no animation frames; this keeps the world ticking while it is hidden (Chrome
// throttles the timer to about 1 Hz, so it runs slow, not frozen). Logic checks from the console
// call ssDeer.update directly with a fixed dt instead of waiting on real time.
setInterval(() => { if (document.hidden) { const now = performance.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now; renderOnce(dt); } }, 33);
