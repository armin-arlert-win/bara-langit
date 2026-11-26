// BARA LANGIT v2 — 3D wildfire air-tanker flight game.
// config.js: every tuned number for the game lives here, one place.

export const CFG = {
  // Canvas the game draws on (screenshots are taken at this size).
  W: 1280, H: 800,
  // One deterministic seed drives the island, the trees and the fires.
  SEED: 1337,
  // World: one volcanic island in the sea, metres.
  ISLAND_RX: 1600, ISLAND_RZ: 1400,
  VOLCANO: { x: 300, z: -200, peak: 430, base: 520 },
  LAKE: { x: -700, z: 500, r: 230 },
  RUNWAY: { x: -100, z: 1150, len: 620, w: 44, heading: Math.PI / 2 },
  // A small coastal village east of the runway: two of its houses burn.
  VILLAGE: { x: 470, z: 1240 },
  // Plane.
  MAX_SPEED: 95,      // m/s at full throttle (~342 km/h)
  MIN_SPEED: 26,      // below this the wing stops flying and she sinks
  TAKEOFF_SPEED: 55,  // rotate speed
  MAX_ROLL: 0.78,     // radians (~45 deg)
  MAX_PITCH_UP: 0.21, // radians (~12 deg)
  MAX_PITCH_DN: -0.14,
  // Wind: steady from the west, plus a slow deterministic gust.
  WIND: { x: 6, z: 1.5, gust: 1.5, gustPeriod: 18 },
  // Mission.
  TIME_LIMIT: 180,    // seconds on the clock
  RETURN_BONUS_TIME: 60, // extra seconds to fly home once the fires are out
  FIRES_FOREST: 8,    // forest fires burning when the sortie starts
  FIRES_BUILDING: 2,  // building fires in the village
  FIRES_MAX: 14,      // lose the island if the fire count reaches this many
  TANK_DROPS: 3,      // water drops carried per tank
  DROP_RADIUS: 105,   // metres of fire a drop soaks
  DROP_KILL: 1.25,    // intensity a direct drop removes
  SCOOP_ALT: 14,      // must be this low over water to scoop
  SCOOP_SPEED: 58,    // and this slow
  FUEL_DRAIN: 0.22,   // per second at full throttle
  // Scoring.
  FIRE_POINTS: 100,
  BUILDING_POINTS: 150,
  WIN_TIME_BONUS: 10, // per second left on the clock
  LANDING_MAX: 400,   // best possible precision-landing bonus
};
