// terrain.js: the island itself — what kind of ground is at (x, z),
// how high it is, and what colour it paints at dusk.

// Elliptical distance from the island centre (0, 0). r < 1 is land.
function islandR(x, z) {
  const ex = x / CFG.ISLAND_RX, ez = z / CFG.ISLAND_RZ;
  return Math.sqrt(ex * ex + ez * ez);
}

function terrainAt(x, z) {
  const r = islandR(x, z);
  const dv = Math.hypot(x - CFG.VOLCANO.x, z - CFG.VOLCANO.z);
  const dl = Math.hypot(x - CFG.LAKE.x, z - CFG.LAKE.z);
  // Runway strip: a flat rectangle on the south coast, heading east.
  const rx = x - CFG.RUNWAY.x, rz = z - CFG.RUNWAY.z;
  const onRunway = Math.abs(rx) < CFG.RUNWAY.len / 2 && Math.abs(rz) < CFG.RUNWAY.w / 2;
  if (onRunway) return { t: 'runway', h: 4 };
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
  if (field > 0.44 && field < 0.52) return { t: 'field', h };
  return { t: 'grass', h };
}

// Dusk palette. `dist` is the depth of the sample, for the haze.
function terrainColor(kind, x, z, dist) {
  let c;
  if (kind === 'sea') {
    const s = hash2(Math.floor(x / 70), Math.floor(z / 70));
    c = s > 0.5 ? [36, 95, 143] : [30, 84, 128];
  } else if (kind === 'lake') c = [46, 127, 180];
  else if (kind === 'sand') c = [207, 169, 110];
  else if (kind === 'grass') c = [85, 118, 60];
  else if (kind === 'forest') c = [44, 90, 42];
  else if (kind === 'field') c = [168, 137, 78];
  else if (kind === 'rock') c = [107, 93, 80];
  else if (kind === 'ash') c = [69, 63, 58];
  else c = [51, 54, 59]; // runway asphalt
  // Warm haze swallows the far ground at dusk.
  const k = Math.min(0.55, (dist / 2600) * 0.55);
  const r = Math.round(c[0] + (232 - c[0]) * k);
  const g = Math.round(c[1] + (149 - c[1]) * k);
  const b = Math.round(c[2] + (106 - c[2]) * k);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

// The fires start in the forest, away from the runway and the volcano.
function fireSpots(seed) {
  const rng = makeRng(seed);
  const spots = [];
  let guard = 0;
  while (spots.length < CFG.FIRES_START && guard++ < 4000) {
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
