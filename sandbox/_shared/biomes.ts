// Per-biome colour tokens and keyframe sets for the demo scenes (world-events-weather.md §2.1.4
// through the T-07 physical conversion, then tuned by eye the way the Forest's day columns were).
// The Keyframe fields are the Forest's; `lantern` is the emissive schedule, `pollen` the day
// particle schedule, `fireflies` the night glow schedule, `fire` the point-light multiplier.
import type { Keyframe } from './style';

export const DESERT = {
  sienna: '#B3541E', ochre: '#D9A441', ochreLight: '#E6B95A', sandShadow: '#C08C3A', duskViolet: '#4A2C6B', oasis: '#1FA3A0',
  oasisDeep: '#12706E', bone: '#EDE3CF', rockRed: '#A8542A', rockDark: '#6E3A1E', palmTrunk: '#7A5A3A', palmFrond: '#3F8F4A', palmFrondDark: '#2E6B38',
  cactus: '#4A8A4E', cactusDark: '#356B3A', agave: '#7FA88A', awningA: '#D64B3A', awningB: '#EDE3CF', tentCloth: '#C9B99A', camel: '#C8A472', camelDark: '#9A7A50',
  lizard: '#C89A4A', beetle: '#1FA3A0', vulture: '#2A2418', tumbleweed: '#A08A5A', flag: '#D64B3A', reeds: '#5A8A3A', dateFruit: '#B03828',
  lantern: '#FFB347', pyramid: '#C9A25A', pyramidDark: '#8A6A36', glyph: '#1FA3A0',
} as const;

export const BOG = {
  water: '#0B2B2E', waterLit: '#164A4E', phosphor: '#6CE87A', bruise: '#5A3E78', witchLantern: '#FFB347', rot: '#4A3524', mud: '#3A2E22',
  mossGround: '#2E5A3A', mossDark: '#1E3E2A', reed: '#5A7A3A', reedTip: '#8AA05A', lily: '#3A7A44', lilyFlower: '#F0C8E0', cypress: '#3A2A1E', cypressLeaf: '#2A5A3A',
  hangMoss: '#6A8A5A', mushroomCap: '#6CE87A', mushroomStalk: '#D9CDB3', mushroomBig: '#7A4A9A', hutWood: '#3A2A1E', hutRoof: '#2A2018', witchWindow: '#7DFF7D',
  boards: '#6A4A2E', boardsDark: '#4A3320', post: '#3E2E1E', frog: '#4A9A4A', frogBelly: '#C8E0A0', heron: '#B8C4D0', heronDark: '#4A5A6A', turtle: '#3A5A3A', snail: '#5A3A6A', snailGlow: '#6CE87A',
  wisp: '#7DFF7D', moth: '#D8C8A0', fog: '#5A3E78',
} as const;

export const FROZEN = {
  indigo: '#1B2A5A', ice: '#8FD3F4', iceDeep: '#4A9AC8', snow: '#F2F7FF', snowShadow: '#C8DCF0', snowBlue: '#B8D0EC', auroraGreen: '#5FFFAF', auroraMagenta: '#E56BFF', auroraIndigo: '#6C5CE7',
  pine: '#1E4A3A', pineDark: '#143526', bark: '#4A3628', rock: '#5C6878', rockDark: '#3A4250', hutWood: '#5A3A28', hutRoof: '#F2F7FF', window: '#FFD08A', chimney: '#6A6A72',
  elk: '#5E4630', elkBelly: '#A8907A', antler: '#D9CDB3', hare: '#F2F7FF', hareEar: '#2A2418', goat: '#EDE3CF', goatHorn: '#8A7A66', penguin: '#1A1E2A', penguinBelly: '#F2F7FF', penguinBeak: '#F0A030',
  seal: '#7A7A88', owl: '#F2F7FF', owlEye: '#FFD966', propeller: '#FFD700', propellerDark: '#B89A12', glitter: '#F2F7FF', breath: '#F2F7FF', cairn: '#6A7688',
} as const;

export const CAVE = {
  rock: '#2A2440', rockLight: '#3E3660', rockDark: '#181430', crystal: '#6B8EC8', crystalLight: '#A29BFE', crystalPale: '#DFE6E9', heart: '#00D2FF', heartCore: '#BFF6FF',
  lampIron: '#3E4247', lampFlame: '#FFB347', lampHook: '#5A5A66', root: '#4A3524', rootLight: '#6B4A2A', water: '#1A4A6A', waterLit: '#2E7A9A', foam: '#DDF6F1',
  moth: '#E8DCC4', salamander: '#E8DCC4', salamanderSpot: '#6CE87A', beetle: '#8FD3F4', fish: '#C8D8E8', bat: '#1A1420', dust: '#C8C8DC', sparkle: '#DFE6E9', quartz: '#4A4470',
} as const;

// Desert: noon is the hero hour (hard cream light), dusk the second (long violet shadows).
export const DESERT_KEYFRAMES: Record<string, Keyframe> = {
  noon: {
    name: 'noon', p: 0.35,
    key: { color: '#FFFBEE', intensity: 1.3, elev: 68, azim: 190 },
    hemi: { sky: '#78B0E8', ground: '#A06A38', intensity: 0.36 },
    fog: { color: '#E8D8BC', near: 50, far: 100, max: 0.4, height: 14 },
    sky: { zenith: '#2C6AC0', horizon: '#D8E4EC', ground: '#5A7CB0', glow: 0.3 },
    cloud: '#FFFFFF', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 1.0,
    lantern: 0, fireflies: 0, pollen: 1, fire: 0.35,
  },
  golden: {
    name: 'golden hour', p: 0.54,
    key: { color: '#FFB86A', intensity: 1.4, elev: 14, azim: 250 },
    hemi: { sky: '#7A6AB0', ground: '#8A4A28', intensity: 0.4 },
    fog: { color: '#D8955A', near: 35, far: 100, max: 0.5, height: 14 },
    sky: { zenith: '#4A3C8A', horizon: '#FF9E5A', ground: '#6B4A6A', glow: 0.6 },
    cloud: '#FFD0A0', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 1.05,
    lantern: 0.3, fireflies: 0, pollen: 1, fire: 0.8,
  },
  dusk: {
    name: 'dusk', p: 0.65,
    key: { color: '#FF8A62', intensity: 1.35, elev: 5, azim: 255 },
    hemi: { sky: '#6E52A8', ground: '#5A3424', intensity: 0.85 },
    fog: { color: '#6A4A80', near: 29, far: 92, max: 0.7, height: 14 },
    sky: { zenith: '#2A1C50', horizon: '#E0604A', ground: '#4A2C6B', glow: 0.8 },
    cloud: '#E0906A', stars: 0.6, moon: { on: true, elev: 10, azim: 100 }, exposure: 1.0,
    lantern: 1, fireflies: 0.3, pollen: 0.5, fire: 1,
  },
  night: {
    name: 'night', p: 0.78,
    key: { color: '#9AB0E8', intensity: 0.6, elev: 40, azim: 130 },
    hemi: { sky: '#1E2A5A', ground: '#3A2418', intensity: 0.6 },
    fog: { color: '#242A58', near: 26, far: 80, max: 0.8, height: 14 },
    sky: { zenith: '#080C2A', horizon: '#2A3068', ground: '#141C40', glow: 0.5 },
    cloud: '#2A3A6E', stars: 1, moon: { on: true, elev: 40, azim: 130 }, exposure: 0.85,
    lantern: 1, fireflies: 1, pollen: 0.2, fire: 1,
  },
};

// Bog: night is the hero look (the ground itself glows); fog is the thickest in the game.
export const BOG_KEYFRAMES: Record<string, Keyframe> = {
  golden: {
    name: 'golden hour', p: 0.54,
    key: { color: '#F0B870', intensity: 1.3, elev: 14, azim: 245 },
    hemi: { sky: '#6A5A98', ground: '#4A5A2A', intensity: 0.4 },
    fog: { color: '#B08A6A', near: 26, far: 70, max: 0.6, height: 8 },
    sky: { zenith: '#3A4A98', horizon: '#E89A6A', ground: '#5A4A6A', glow: 0.6 },
    cloud: '#C8A090', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 1.0,
    lantern: 0.3, fireflies: 0.2, pollen: 1, fire: 0.8,
  },
  dusk: {
    name: 'dusk', p: 0.65,
    key: { color: '#D8705A', intensity: 1.3, elev: 5, azim: 255 },
    hemi: { sky: '#5A4A88', ground: '#243A24', intensity: 0.8 },
    fog: { color: '#5A3E78', near: 22, far: 60, max: 0.7, height: 8 },
    sky: { zenith: '#1A1C48', horizon: '#C05A4A', ground: '#3A2C5A', glow: 0.7 },
    cloud: '#A06A7A', stars: 0.5, moon: { on: true, elev: 10, azim: 100 }, exposure: 0.95,
    lantern: 1, fireflies: 0.6, pollen: 0.6, fire: 1,
  },
  night: {
    name: 'night', p: 0.78,
    key: { color: '#7A90D0', intensity: 0.75, elev: 35, azim: 130 },
    hemi: { sky: '#2A36A0', ground: '#10301E', intensity: 0.8 },
    fog: { color: '#2A2448', near: 20, far: 54, max: 0.75, height: 6 },
    sky: { zenith: '#06081E', horizon: '#1E2050', ground: '#101430', glow: 0.5 },
    cloud: '#242A50', stars: 1, moon: { on: true, elev: 35, azim: 130 }, exposure: 1.0,
    lantern: 1, fireflies: 1, pollen: 0.4, fire: 1,
  },
  deep: {
    name: 'deep night', p: 0.9,
    key: { color: '#6C82C8', intensity: 0.5, elev: 45, azim: 150 },
    hemi: { sky: '#1A2060', ground: '#0B2B2E', intensity: 0.7 },
    fog: { color: '#221C40', near: 17, far: 46, max: 0.8, height: 6 },
    sky: { zenith: '#030512', horizon: '#181A44', ground: '#0C0E28', glow: 0.4 },
    cloud: '#1C2044', stars: 1, moon: { on: true, elev: 45, azim: 150 }, exposure: 0.85,
    lantern: 1, fireflies: 1, pollen: 0.3, fire: 1,
  },
};

// Frozen Peaks: night is the hero look (the aurora); morning is second (blue shadows on snow).
export const FROZEN_KEYFRAMES: Record<string, Keyframe> = {
  morning: {
    name: 'morning', p: 0.15,
    key: { color: '#FFF4E4', intensity: 1.2, elev: 28, azim: 130 },
    hemi: { sky: '#9CC8F0', ground: '#A8C0DC', intensity: 0.3 },
    fog: { color: '#CFE0F2', near: 35, far: 100, max: 0.45, height: 14 },
    sky: { zenith: '#3A80D0', horizon: '#D8ECF8', ground: '#6A9CC8', glow: 0.35 },
    cloud: '#FFFFFF', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 0.95,
    lantern: 0, fireflies: 0, pollen: 1, fire: 0.5, aurora: 0,
  },
  golden: {
    name: 'golden hour', p: 0.54,
    key: { color: '#FFC898', intensity: 1.4, elev: 12, azim: 245 },
    hemi: { sky: '#7A7AC0', ground: '#B098A8', intensity: 0.38 },
    fog: { color: '#D0B0B8', near: 29, far: 92, max: 0.55, height: 14 },
    sky: { zenith: '#3C4AA0', horizon: '#FFB090', ground: '#7A6A9A', glow: 0.6 },
    cloud: '#FFD0B8', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 1.05,
    lantern: 0.3, fireflies: 0, pollen: 1, fire: 0.8, aurora: 0,
  },
  dusk: {
    name: 'dusk', p: 0.65,
    key: { color: '#E87A80', intensity: 1.4, elev: 5, azim: 255 },
    hemi: { sky: '#4E4CA0', ground: '#5A6898', intensity: 0.8 },
    fog: { color: '#5A5A98', near: 23, far: 74, max: 0.7, height: 14 },
    sky: { zenith: '#181C50', horizon: '#C86078', ground: '#3A2C5A', glow: 0.7 },
    cloud: '#B07088', stars: 0.5, moon: { on: true, elev: 10, azim: 100 }, exposure: 0.95,
    lantern: 1, fireflies: 0, pollen: 0.8, fire: 1, aurora: 0.45,
  },
  night: {
    name: 'night', p: 0.78,
    key: { color: '#9AB4F0', intensity: 0.7, elev: 35, azim: 130 },
    hemi: { sky: '#1B2A5A', ground: '#3A4A78', intensity: 0.7 },
    fog: { color: '#22305E', near: 21, far: 65, max: 0.75, height: 14 },
    sky: { zenith: '#080C2C', horizon: '#1E2A60', ground: '#141C40', glow: 0.5 },
    cloud: '#2A3A6E', stars: 1, moon: { on: true, elev: 35, azim: 130 }, exposure: 0.9,
    lantern: 1, fireflies: 0, pollen: 0.8, fire: 1, aurora: 1,
  },
};

// Crystal Caves (T-01: the fifth biome): no sun; the "times" are the lamp-lighting growth stage
// (T-02): how many of Quartz's lamps are lit. `lamps` is the fraction; `key` is the faint cool
// light falling through the roots' crack with the waterfall.
export const CAVE_KEYFRAMES: Record<string, Keyframe> = {
  dark: {
    name: 'lamps: the first', p: 0,
    key: { color: '#8FD3F4', intensity: 0.12, elev: 82, azim: 20 },
    hemi: { sky: '#2A2860', ground: '#0C0A18', intensity: 0.28 },
    fog: { color: '#100E24', near: 14, far: 64, max: 0.8, height: 40 },
    sky: { zenith: '#04030A', horizon: '#04030A', ground: '#04030A', glow: 0 },
    cloud: '#000000', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 0.95,
    lantern: 1, fireflies: 1, pollen: 1, fire: 1, lamps: 0.2,
  },
  half: {
    name: 'lamps: half lit', p: 0,
    key: { color: '#8FD3F4', intensity: 0.14, elev: 82, azim: 20 },
    hemi: { sky: '#34309A', ground: '#100E20', intensity: 0.4 },
    fog: { color: '#141230', near: 16, far: 70, max: 0.78, height: 40 },
    sky: { zenith: '#04030A', horizon: '#04030A', ground: '#04030A', glow: 0 },
    cloud: '#000000', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 0.95,
    lantern: 1, fireflies: 1, pollen: 1, fire: 1, lamps: 0.55,
  },
  lit: {
    name: 'lamps: all lit', p: 0,
    key: { color: '#8FD3F4', intensity: 0.16, elev: 82, azim: 20 },
    hemi: { sky: '#4038B8', ground: '#161228', intensity: 0.42 },
    fog: { color: '#181640', near: 18, far: 76, max: 0.74, height: 40 },
    sky: { zenith: '#04030A', horizon: '#04030A', ground: '#04030A', glow: 0 },
    cloud: '#000000', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 1.0,
    lantern: 1, fireflies: 1, pollen: 1, fire: 1, lamps: 1,
  },
};
