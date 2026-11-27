// Pulau Arang: the island itself. One job: what is at (x, z) — type and height.
// Types: sea, beach, grass, forest, field, lake, rock, ash, runway, town.
const Terrain = (() => {
  const C = CFG;
  function dist(x, z, cx, cz) { return Math.hypot(x - cx, z - cz); }
  function inLake(x, z) {
    const dx = (x - C.lake.x) / C.lake.rx, dz = (z - C.lake.z) / C.lake.rz;
    return dx * dx + dz * dz < 1;
  }
  function onRunway(x, z) {
    const dx = x - C.runway.x, dz = z - C.runway.z;
    return Math.abs(dx) < C.runway.len / 2 && Math.abs(dz) < C.runway.w / 2;
  }
  function inTown(x, z) {
    return Math.abs(x - C.town.x) < 190 && Math.abs(z - C.town.z) < 150;
  }
  // Height in metres. Sea is 0; the island rises gently; the volcano is a cone.
  function heightAt(x, z) {
    const r = Math.hypot(x, z);
    if (r > C.islandR) return 0;
    const dv = dist(x, z, C.volcano.x, C.volcano.z);
    if (dv < C.volcano.r) {
      const t = 1 - dv / C.volcano.r;
      return 30 + t * t * C.volcano.h;
    }
    const hills = fbm(x * 0.0016 + 40, z * 0.0016 + 9, C.seed);
    const shore = Math.max(0, 1 - r / C.islandR);
    let h = 4 + hills * 46 * shore;
    if (inLake(x, z)) h = 0;
    return h;
  }
  function typeAt(x, z) {
    if (onRunway(x, z)) return 'runway';
    if (inLake(x, z)) return 'lake';
    const r = Math.hypot(x, z);
    if (r > C.islandR) return 'sea';
    const dv = dist(x, z, C.volcano.x, C.volcano.z);
    if (dv < C.volcano.r * 0.32) return 'ash';
    if (dv < C.volcano.r) return 'rock';
    if (r > C.islandR - 130) return 'beach';
    if (inTown(x, z)) return 'town';
    const n = fbm(x * 0.0021 + 3, z * 0.0021 + 17, C.seed + 31);
    if (n > 0.66) return 'forest';
    if (n > 0.55) return 'field';
    return 'grass';
  }
  // Fixed fire spots, picked once from the seeded RNG so every run matches.
  function fireSpots() {
    const rng = mulberry32(C.seed + 5);
    const spots = [];
    const forestPool = [
      [-1500, -900], [-900, -1400], [-300, -1000], [400, -1300], [900, -900],
      [-1600, 300], [-700, -300], [200, -500], [700, 300], [-1200, 1200],
      [300, 900], [1100, 600], [-300, 1500], [900, 1400],
    ];
    for (let i = 0; i < C.forestFires; i++) {
      const p = forestPool[Math.floor(rng() * forestPool.length)];
      if (spots.some((s) => s.x === p[0] && s.z === p[1])) { i--; continue; }
      spots.push({ x: p[0], z: p[1], kind: 'forest', alive: true, heat: 1 });
    }
    const townPool = [
      [C.town.x - 90, C.town.z - 60], [C.town.x + 80, C.town.z + 40],
      [C.town.x - 40, C.town.z + 90], [C.town.x + 120, C.town.z - 80],
    ];
    for (let i = 0; i < C.townFires; i++) {
      const p = townPool[i * 2];
      spots.push({ x: p[0], z: p[1], kind: 'town', alive: true, heat: 1.6 });
    }
    return spots;
  }
  // Spare spots the spread can ignite later (forest only).
  function spreadSpots() {
    return [
      [-1800, -400], [-500, -1600], [1200, -1200], [-1400, 800],
      [600, 1200], [-100, 300], [1500, 200], [-1900, 1400],
    ].map(([x, z]) => ({ x, z, kind: 'forest', alive: false, heat: 1 }));
  }
  return { heightAt, typeAt, inLake, onRunway, inTown, fireSpots, spreadSpots };
})();
