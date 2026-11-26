// terrain.js: the island itself — what kind of ground is at (x, z),
// how high it is, and what colour it paints at dusk. One function feeds
// both the physics (world.js) and the 3D mesh (render.js), so the plane
// never disagrees with the ground it sees.

import { CFG } from './config.js';
import { makeRng, valueNoise, hash2 } from './random.js';

// Elliptical distance from the island centre (0, 0). r < 1 is land.
export function islandR(x, z) {
  const ex = x / CFG.ISLAND_RX, ez = z / CFG.ISLAND_RZ;
  return Math.sqrt(ex * ex + ez * ez);
}

export function terrainAt(x, z) {
  const r = islandR(x, z);
  const dv = Math.hypot(x - CFG.VOLCANO.x, z - CFG.VOLCANO.z);
  const dl = Math.hypot(x - CFG.LAKE.x, z - CFG.LAKE.z);
  // Runway strip: a flat rectangle on the south coast, heading east.
  const rx = x - CFG.RUNWAY.x, rz = z - CFG.RUNWAY.z;
  const onRunway = Math.abs(rx) < CFG.RUNWAY.len / 2 && Math.abs(rz) < CFG.RUNWAY.w / 2;
  if (onRunway) return { t: 'runway', h: 4 };
  // Village pad: flat ground for the houses, east of the runway.
  const vx = x - CFG.VILLAGE.x, vz = z - CFG.VILLAGE.z;
  if (Math.abs(vx) < 120 && Math.abs(vz) < 90) return { t: 'village', h: 5 };
  if (dl < CFG.LAKE.r) return { t: 'lake', h: 2 };
  if (r > 1) return { t: 'sea', h: 0 };
  // Rolling hills that rise towards the middle of the island.
  let h = Math.pow(1 - r, 1.3) * 95 + valueNoise(x * 0.004, z * 0.004) * 16;
  if (dv < CFG.VOLCANO.base) {
    h = Math.max(h, CFG.VOLCANO.peak * Math.pow(1 - dv / CFG.VOLCANO.base, 1.15));
  }
  if (dv < 190) return { t: 'ash', h };
  if (dv < CFG.VOLCANO.base) return { t: 'rock', h };
  if (r > 0.93) return { t: 'sand', h: Math.max(h, 3) };
  const forest = valueNoise(x * 0.006 + 7.3, z * 0.006 - 2.1) > 0.58;
  if (forest) return { t: 'forest', h };
  const field = valueNoise(x * 0.004 + 40.7, z * 0.004 - 11.9);
  if (field > 0.40 && field < 0.56) return { t: 'field', h };
  return { t: 'grass', h };
}

// Dusk palette, as plain [r, g, b] triples. The sun and fog do the haze;
// these are the colours the ground is.
export function terrainColor(kind) {
  if (kind === 'sea') return [33, 88, 138];
  if (kind === 'lake') return [46, 127, 180];
  if (kind === 'sand') return [207, 169, 110];
  if (kind === 'grass') return [95, 128, 66];
  if (kind === 'forest') return [52, 102, 48];
  if (kind === 'field') return [168, 137, 78];
  if (kind === 'rock') return [92, 82, 76];
  if (kind === 'ash') return [60, 54, 50];
  if (kind === 'village') return [120, 104, 78];
  return [51, 54, 59]; // runway asphalt
}

// Forest fires start in the forest, away from the runway and the volcano.
export function forestFireSpots(seed) {
  const rng = makeRng(seed);
  const spots = [];
  let guard = 0;
  while (spots.length < CFG.FIRES_FOREST && guard++ < 4000) {
    const a = rng() * Math.PI * 2;
    const rr = 0.25 + rng() * 0.6;
    const x = Math.cos(a) * CFG.ISLAND_RX * rr;
    const z = Math.sin(a) * CFG.ISLAND_RZ * rr;
    const t = terrainAt(x, z).t;
    if (t !== 'forest' && t !== 'grass') continue;
    if (Math.hypot(x - CFG.RUNWAY.x, z - CFG.RUNWAY.z) < 500) continue;
    if (Math.hypot(x - CFG.VOLCANO.x, z - CFG.VOLCANO.z) < 560) continue;
    if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 320)) continue;
    spots.push({ x, z });
  }
  return spots;
}

// The two building fires: two houses in the village, east of the runway.
export function buildingFireSpots() {
  const V = CFG.VILLAGE;
  return [
    { x: V.x - 45, z: V.z - 30 },
    { x: V.x + 55, z: V.z + 25 },
  ];
}

// Pine positions for the instanced tree mesh: only where the ground is
// forest, and never on the runway, the lake, the village or the volcano.
export function treeSpots(count, seed) {
  const rng = makeRng(seed);
  const spots = [];
  let guard = 0;
  while (spots.length < count && guard++ < count * 40) {
    const x = (rng() * 2 - 1) * CFG.ISLAND_RX * 0.95;
    const z = (rng() * 2 - 1) * CFG.ISLAND_RZ * 0.95;
    if (terrainAt(x, z).t !== 'forest') continue;
    const s = 0.7 + rng() * 0.9;
    spots.push({ x, z, h: terrainAt(x, z).h, s, rot: rng() * Math.PI * 2 });
  }
  return spots;
}

// A cheap deterministic speckle so the sea is not one flat colour.
export function seaShade(x, z) {
  return hash2(Math.floor(x / 70), Math.floor(z / 70)) > 0.5 ? 1 : 0.88;
}
