// BARA LANGIT v3 — every tuned number lives here. One job: constants.
// Game: wildfire air tanker over Pulau Arang at dusk, three visible phases.
const CFG = {
  seed: 1337,
  // canvas
  W: 1280, H: 800,
  // island (metres, top-down x east, z south)
  islandR: 2600,
  volcano: { x: 1500, z: -300, r: 520, h: 430 },
  lake: { x: -1250, z: 500, rx: 420, rz: 300 },
  town: { x: -450, z: 1150 },
  runway: { x: -650, z: 620, len: 760, w: 46, hdg: 90 }, // strip along +x
  // plane
  maxSpeed: 340, minFlySpeed: 95, takeoffSpeed: 125,
  accel: 55, drag: 0.12, climbRate: 26, sinkRate: 30,
  turnRate: 26, // deg/s at full bank
  maxBank: 55, maxPitch: 22,
  fuelMax: 100, fuelBurn: 0.55, // per second at full throttle
  waterMax: 3,
  // mission
  clockStart: 210,
  forestFires: 6, townFires: 2,
  spreadEvery: 26, maxFires: 12,
  fireScore: 100, townScore: 150,
  dropRadius: 70, scoopAlt: 9, scoopMaxSpeed: 260,
  // landing (phase 3)
  landBonusMax: 400, landMaxSpeed: 210, landMaxSink: 9,
  // wind
  windFrom: 270, windSpeed: 12, // kt, westerly
  // rendering
  focal: 620, horizonBase: 0.42,
  sliceCount: 42, sliceNear: 26, sliceFar: 4200,
};
