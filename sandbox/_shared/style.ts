// Draft style numbers for the Phase 0.75 studies. Roots: docs/BRIEF.md §4.2, camp.md §2.0,
// world-events-weather.md §2.1.3, heroes.md §2.1.1. Approved values are copied to
// docs/design/mockups/style-draft.json; this file is the sketchbook's working copy.

export const C = {
  // forest
  emerald: '#0F5132', moss: '#3A7D44', pineShadow: '#123524', honey: '#B8863B', stream: '#2EB8A6',
  golden: '#FFD08A', grassA: '#3A7D44', grassB: '#2F6B3A', grassTip: '#4F9A4A',
  flowers: ['#D86050', '#E8A838', '#D06888', '#9088CC', '#D07090', '#F0D898'],
  mushroom: '#B06020', mushroomStalk: '#D9CDB3', mushroomGlow: '#6CE87A',
  leaves: ['#B03828', '#D87828', '#E8A838', '#38A866'], birchLeaf: '#38A866',
  // camp
  tealSlate: '#2B5F6B', tealSlateLit: '#3A7A86', cream: '#EDE3CF', bark: '#5A3A1E', earth: '#6B4A2A',
  pathDust: '#8A6A3E', stone: '#6F7D86', stoneWarm: '#8C7B66', canvasOld: '#7A6A4E', rope: '#C2A878',
  iron: '#3E4247', soot: '#2A2418', scorch: '#2A2418', bed: '#2E5A56', foam: '#DDF6F1',
  crate: '#8B4513', crateBand: '#7a3b10', crateStrap: '#D4944A', apple: '#B03828', pear: '#B7A83A',
  debris: ['#8B4513', '#654321', '#a0522d'], tarp: '#C9B99A', rock: '#5C6068', rockDark: '#3E4149', root: '#4A3524',
  // plane (npcs.md §2.2)
  planeYellow: '#F4D21E', planeYellowDark: '#B89A12', planeGreen: '#2D8C56', planeFin: '#D84830', planeRudder: '#228B22',
  // lights
  campfire: '#FF9A3C', lantern: '#FFB347', window: '#FFD08A', flameOuter: '#E85D04', flameCore: '#FFD166',
  embers: ['#E8A838', '#F0C878', '#FFF0C8'], firefly: '#FFE066', pollen: '#FFE8B0', smoke: '#B4B4B4',
  moon: '#F2E8C8', moonBand: '#8FD3F4', cloudUnder: '#B8C8E0',
  // liam (heroes.md §2.1.1)
  liamBase: '#2A62CF', liamDark: '#173A86', liamAccent: '#D3DDE6', liamGlow: '#4A9ED8', liamHair: '#8B6914',
  skin: '#F2CBA7', pupil: '#2C3E50', swordGuard: '#E8A838',
  deer: '#8A6A44', deerBelly: '#E8DCC4', deerDark: '#5E4630', antler: '#D9CDB3',
} as const;

export interface Keyframe {
  name: string;
  p: number;
  key: { color: string; intensity: number; elev: number; azim: number };
  hemi: { sky: string; ground: string; intensity: number };
  fog: { color: string; near: number; far: number; max: number; height: number };
  sky: { zenith: string; horizon: string; ground: string; glow: number };
  cloud: string;
  stars: number;
  moon: { on: boolean; elev: number; azim: number };
  exposure: number;
  lantern: number; // 0..1 schedule for camp lanterns + tent glow + glow caps
  fireflies: number; // 0..1
  pollen: number; // 0..1
  fire: number; // multiplier on the campfire light (embers only by day)
}

// world-events-weather.md §2.1.3; variant A = the bible as written.
export const KEYFRAMES: Record<string, Keyframe> = {
  noon: {
    name: 'noon', p: 0.35,
    // day columns re-tuned under the physical conversion (T-07): the bible's 3.0 / 0.6 blow out to pastel
    key: { color: '#FFF6E6', intensity: 1.15, elev: 58, azim: 180 },
    hemi: { sky: '#6FA8E6', ground: '#2E6A38', intensity: 0.32 },
    fog: { color: '#9DC3DD', near: 38, far: 98, max: 0.45, height: 12 },
    sky: { zenith: '#2F6BC0', horizon: '#A7D3EE', ground: '#4A8FC0', glow: 0.35 },
    cloud: '#FFFFFF', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 0.92,
    lantern: 0, fireflies: 0, pollen: 0.6, fire: 0.35,
  },
  golden: {
    name: 'golden hour', p: 0.54,
    key: { color: '#FFD08A', intensity: 1.4, elev: 16, azim: 245 },
    hemi: { sky: '#7A8FC8', ground: '#3E6A36', intensity: 0.38 },
    fog: { color: '#D9A66E', near: 28, far: 78, max: 0.6, height: 12 },
    sky: { zenith: '#3B5BA8', horizon: '#FFB870', ground: '#6B5A8A', glow: 0.6 },
    cloud: '#FFD9A8', stars: 0, moon: { on: false, elev: 0, azim: 0 }, exposure: 1.05,
    lantern: 0.3, fireflies: 0.15, pollen: 1.0, fire: 0.8,
  },
  dusk: {
    name: 'dusk', p: 0.65,
    key: { color: '#FF8C5A', intensity: 1.2, elev: 4, azim: 270 },
    hemi: { sky: '#4A4E8E', ground: '#2A4A30', intensity: 0.5 },
    fog: { color: '#7B5A8C', near: 23, far: 62, max: 0.85, height: 12 },
    sky: { zenith: '#22305E', horizon: '#E86A4A', ground: '#3A2C5A', glow: 0.6 },
    cloud: '#C97A6A', stars: 0.4, moon: { on: true, elev: 8, azim: 95 }, exposure: 0.95,
    lantern: 1, fireflies: 0.6, pollen: 0.2, fire: 1,
  },
  night: {
    name: 'night', p: 0.78,
    key: { color: '#8FA8E0', intensity: 0.55, elev: 35, azim: 130 },
    hemi: { sky: '#1B2A5A', ground: '#123524', intensity: 0.6 },
    fog: { color: '#1E2B58', near: 20, far: 56, max: 0.85, height: 12 },
    sky: { zenith: '#0B1030', horizon: '#24356E', ground: '#141C40', glow: 0.5 },
    cloud: '#2A3A6E', stars: 1, moon: { on: true, elev: 35, azim: 130 }, exposure: 0.85,
    lantern: 1, fireflies: 1, pollen: 0, fire: 1,
  },
};

// Variants for the dusk study: what to choose between. B and C are the orchestrator's pushes
// past the bible's row (logged in PHASE_0.75_TWEAKS.md when one is chosen).
export type VariantId = 'A' | 'B' | 'C';
export const VARIANT_NOTES: Record<VariantId, string> = {
  A: 'Bible row as written (world-events §2.1.3 dusk)',
  B: 'Ember dusk: hotter horizon, deeper indigo zenith, stronger fire pool, lit cloud bellies',
  C: 'Blue hour: sun gone, lanterns own the frame, cooler fog, more stars',
};
export function variant(base: Keyframe, v: VariantId): Keyframe {
  if (base.name !== 'dusk' || v === 'A') return base;
  if (v === 'B') {
    return {
      ...base, name: 'dusk B',
      key: { color: '#FF9A55', intensity: 1.7, elev: 6, azim: 250 },
      hemi: { sky: '#6A5EA8', ground: '#3A6A3A', intensity: 0.8 },
      fog: { color: '#8A5A7C', near: 24, far: 70, max: 0.75, height: 12 },
      sky: { zenith: '#1B2B66', horizon: '#FF8A50', ground: '#4A2C5A', glow: 0.8 },
      cloud: '#E89A7A', stars: 0.5, exposure: 1.0, fire: 1.3,
    };
  }
  return {
    ...base, name: 'dusk C',
    key: { color: '#C08AA0', intensity: 0.7, elev: 2, azim: 272 },
    hemi: { sky: '#3A4A9E', ground: '#20402A', intensity: 0.6 },
    fog: { color: '#5A4E8C', near: 22, far: 60, max: 0.85, height: 12 },
    sky: { zenith: '#101C4A', horizon: '#D8705A', ground: '#2E2A58', glow: 0.5 },
    cloud: '#8A6A8A', stars: 0.7, moon: { on: true, elev: 12, azim: 95 }, exposure: 0.9, fire: 1.15, fireflies: 0.85,
  };
}

// Point lights: three r155+ is always physically based, so the bible's non-physical
// intensities (2.5 campfire, 1.2 lantern) are scaled here. The scale is a study result
// (world-events §2.1.3: "tune the whole column once if the renderer differs").
// Unit conversion from the bible's non-physical intensities to three r185 physical lights
// (a study result: the columns were written for a renderer where 1.0 = full).
export const UNITS = { key: 3.0, hemi: 9.0 };
export const LIGHT = {
  campfire: { color: C.campfire, intensity: 90, range: 9, decay: 2 },
  lantern: { color: C.lantern, intensity: 14, range: 6, decay: 2 },
  ring: { color: C.liamGlow, intensity: 3, range: 3, decay: 2 },
  window: 0.5, // tent canvas emissive gain at full schedule (bible 1.6 blows to white under bloom; logged)
  lanternGlass: 3.0,
  glowCap: 0.8,
};
