// world.js: the sortie itself — physics, wind, fires, water, fuel,
// scoring, and every way a flight ends. No drawing here, no DOM here.
// The mission has two kinds of target and a finale: put out every fire,
// then bring her home with a precision landing on the runway.

import { CFG } from './config.js';
import { terrainAt, islandR, forestFireSpots, buildingFireSpots } from './terrain.js';
import { KEYS } from './input.js';
import {
  soundDrop, soundFireOut, soundAlarm, soundWin, soundCrash, soundScoop,
} from './audio.js';

export function newGame() {
  const spots = forestFireSpots(CFG.SEED);
  const buildings = buildingFireSpots();
  const fires = spots.map((s, i) => ({
    x: s.x, z: s.z, kind: 'forest',
    intensity: 0.7 + (i % 3) * 0.15, alive: true, spreadIn: 30 + (i * 7) % 25,
  }));
  for (const b of buildings) {
    fires.push({
      x: b.x, z: b.z, kind: 'building',
      intensity: 1.1, alive: true, spreadIn: 9999,
    });
  }
  return {
    state: 'title', // title | playing | return | win | lose | crash
    phase: 'fires', // fires | return — what the sortie is asking for now
    time: 0,
    timeLeft: CFG.TIME_LIMIT,
    score: 0,
    // The airtanker, parked on the runway facing east, engine off.
    x: CFG.RUNWAY.x - 250, z: CFG.RUNWAY.z,
    alt: 5, heading: Math.PI / 2, speed: 0,
    pitch: 0, roll: 0, throttle: 0,
    fuel: 100, water: CFG.TANK_DROPS,
    fires,
    drops: [], // water bursts falling to the ground
    message: '', messageT: 0,
    landed: false, scooping: false,
    crashReason: '', winBonus: 0, landingBonus: 0,
    _fuelWarned: false, _lowWarned: false, _scoopSaid: false,
  };
}

export function say(G, text, seconds) {
  G.message = text;
  G.messageT = seconds || 3;
}

export function fireRadius(f) {
  return 16 + f.intensity * 24;
}

// The wind now: steady from the west plus a slow deterministic gust.
export function windNow(t) {
  const gust = Math.sin(t * (Math.PI * 2 / CFG.WIND.gustPeriod)) * CFG.WIND.gust;
  return { x: CFG.WIND.x + gust, z: CFG.WIND.z };
}

// Where a drop lands: ahead of the nose, further the higher she flies.
export function dropPoint(G) {
  const fx = Math.sin(G.heading), fz = -Math.cos(G.heading);
  const ahead = 90 + G.alt * 0.55;
  return { x: G.x + fx * ahead, z: G.z + fz * ahead };
}

export function dropWater(G) {
  if (G.water < 1 || (G.state !== 'playing' && G.state !== 'return')) return false;
  G.water -= 1;
  const p = dropPoint(G);
  G.drops.push({ x: p.x, z: p.z, t: 0, alt: G.alt });
  let hit = false;
  for (const f of G.fires) {
    if (!f.alive) continue;
    const d = Math.hypot(f.x - p.x, f.z - p.z);
    if (d < CFG.DROP_RADIUS) {
      f.intensity -= CFG.DROP_KILL;
      hit = true;
      if (f.intensity <= 0) {
        f.alive = false;
        const pts = f.kind === 'building' ? CFG.BUILDING_POINTS : CFG.FIRE_POINTS;
        G.score += pts;
        say(G, (f.kind === 'building' ? 'HOUSE FIRE OUT  +' : 'FIRE OUT  +') + pts, 2.5);
        soundFireOut();
      }
    }
  }
  if (!hit) say(G, 'DROP MISSED — lead the fire', 2);
  soundDrop();
  return true;
}

// The nearest burning fire, or null when the island is safe.
export function currentTarget(G) {
  let best = null, bd = Infinity;
  for (const f of G.fires) {
    if (!f.alive) continue;
    const d = Math.hypot(f.x - G.x, f.z - G.z);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

export function firesOut(G) {
  let out = 0, total = 0;
  for (const f of G.fires) { total++; if (!f.alive) out++; }
  return { out, total };
}

// A gentle touchdown on the runway: slow, level, near the centreline and
// inside the first half of the strip. Returns the landing bonus, 0 to
// CFG.LANDING_MAX. A touchdown that is fast or hard is a crash instead.
export function landingBonus(G, sinkRate) {
  const R = CFG.RUNWAY;
  const lateral = Math.abs(G.z - R.z);
  const along = G.x - (R.x - R.len / 2); // metres past the threshold
  let bonus = CFG.LANDING_MAX;
  bonus -= lateral * 2.2; // off the centreline
  bonus -= Math.max(0, along - 300) * 0.5; // long past the aiming point
  bonus -= Math.max(0, G.speed - 45) * 4; // too fast at touchdown
  bonus -= Math.max(0, sinkRate - 4) * 12; // too steep a sink
  return Math.max(0, Math.round(bonus));
}

function crash(G, reason) {
  if (G.state !== 'playing' && G.state !== 'return') return;
  G.state = 'crash';
  G.crashReason = reason;
  soundCrash();
}

export function updateWorld(G, dt) {
  if (G.state !== 'playing' && G.state !== 'return') return;
  G.time += dt;
  G.timeLeft -= dt;
  if (G.messageT > 0) G.messageT -= dt;

  // --- Controls: roll banks, pitch climbs, throttle sets speed. ---
  const rollTarget = (KEYS.arrowleft ? -CFG.MAX_ROLL : 0) + (KEYS.arrowright ? CFG.MAX_ROLL : 0);
  const pitchTarget = (KEYS.arrowup ? CFG.MAX_PITCH_UP : 0) + (KEYS.arrowdown ? CFG.MAX_PITCH_DN : 0);
  G.roll += (rollTarget - G.roll) * Math.min(1, 3.2 * dt);
  G.pitch += (pitchTarget - G.pitch) * Math.min(1, 2.6 * dt);
  if (KEYS.w) G.throttle = Math.min(1, G.throttle + dt * 0.5);
  if (KEYS.s) G.throttle = Math.max(0, G.throttle - dt * 0.7);

  const targetSpeed = G.throttle * CFG.MAX_SPEED;
  G.speed += (targetSpeed - G.speed) * Math.min(1, 0.55 * dt);
  // A slow wing stops flying.
  const stalling = G.speed < CFG.MIN_SPEED && G.alt > 6;
  // Turn rate grows with bank and speed; pitch sets the climb.
  G.heading += G.roll * 0.85 * (G.speed / 60) * dt;
  let climb = Math.sin(G.pitch) * G.speed;
  if (stalling) climb -= 7;
  G.alt += climb * dt;
  if (G.alt > 900) G.alt = 900;
  const fx = Math.sin(G.heading), fz = -Math.cos(G.heading);
  G.x += fx * G.speed * dt;
  G.z += fz * G.speed * dt;
  // The wind pushes the ground track, not the nose: hold the heading and
  // the island slides sideways under you.
  const w = windNow(G.time);
  G.x += w.x * dt;
  G.z += w.z * dt;
  // Soft world edge: the island is the map, the sea goes on, but turn back.
  const rr = islandR(G.x, G.z);
  if (rr > 2.2) {
    G.heading += Math.PI; // fly back over the island
    say(G, 'TURN BACK — open sea ahead', 2);
  }

  // --- Fuel: throttle burns it, the runway gives it back. ---
  G.fuel -= (0.05 + G.throttle * CFG.FUEL_DRAIN) * dt;
  if (G.fuel <= 0) {
    G.fuel = 0;
    G.throttle = 0; // dead stick: glide her in or ditch her
    if (!G._fuelWarned) {
      G._fuelWarned = true;
      say(G, 'FUEL EMPTY — glide to the runway', 4);
      soundAlarm();
    }
  } else if (G.fuel < 20 && !G._lowWarned) {
    G._lowWarned = true;
    say(G, 'LOW FUEL — land on the runway to refuel', 4);
    soundAlarm();
  }

  // --- Ground: land, scoop, or crash. ---
  const ground = terrainAt(G.x, G.z);
  G.scooping = false;
  // A fast touchdown only counts as a crash if she was airborne just
  // before — rolling down the runway at takeoff speed is normal.
  const wasAir = G.alt > ground.h + 15;
  const sinkRate = -climb;
  if (G.alt <= ground.h + 2) {
    if (ground.t === 'runway') {
      if (climb < -9 || (G.speed > 72 && wasAir)) {
        crash(G, 'HARD LANDING ON THE RUNWAY');
      } else {
        G.alt = ground.h + 2;
        G.landed = true;
        G.fuel = 100;
        G._fuelWarned = false;
        G._lowWarned = false;
        if (G.phase === 'return' && G.speed < 60) {
          // The finale: a precision landing ends the sortie.
          G.landingBonus = landingBonus(G, Math.max(0, sinkRate));
          G.score += G.landingBonus;
          G.winBonus = Math.round(Math.max(0, G.timeLeft)) * CFG.WIN_TIME_BONUS;
          G.score += G.winBonus;
          G.state = 'win';
          soundWin();
        } else if (G.speed < 4) {
          say(G, 'REFUELLED — throttle up to take off', 2.5);
        }
      }
    } else if ((ground.t === 'sea' || ground.t === 'lake') && G.speed < CFG.SCOOP_SPEED) {
      // Skim low and slow: the tank fills, one drop at a time.
      G.alt = ground.h + 2;
      G.scooping = true;
      G.water = Math.min(CFG.TANK_DROPS, G.water + dt * 0.55);
      if (G.water >= CFG.TANK_DROPS && !G._scoopSaid) {
        G._scoopSaid = true;
        say(G, 'TANK FULL — back to the fires', 2);
        soundScoop();
      }
    } else if (ground.t === 'sea' || ground.t === 'lake') {
      crash(G, 'DITCHED IN THE WATER AT SPEED');
    } else {
      crash(G, 'CRASHED INTO THE GROUND');
    }
  } else {
    G.landed = false;
  }
  // The volcano is a wall, not a hill.
  const dv = Math.hypot(G.x - CFG.VOLCANO.x, G.z - CFG.VOLCANO.z);
  if (dv < 130 && G.alt < CFG.VOLCANO.peak + 25) crash(G, 'FLEW INTO THE VOLCANO');

  // --- Water drops fall and fade. ---
  for (const d of G.drops) d.t += dt;
  G.drops = G.drops.filter((d) => d.t < 1.6);

  // --- Fires grow, and a hot forest fire throws a new one nearby. ---
  let alive = 0;
  for (const f of G.fires) {
    if (!f.alive) continue;
    alive++;
    const growth = f.kind === 'building' ? 0.02 : 0.012;
    f.intensity = Math.min(1.6, f.intensity + dt * growth);
    f.spreadIn -= dt;
    if (f.kind === 'forest' && f.spreadIn <= 0) {
      f.spreadIn = 34; // deterministic re-arm: no Math.random in the game
      const total = G.fires.length;
      if (total < CFG.FIRES_MAX) {
        const a = (f.x * 0.37 + f.z * 0.91) % (Math.PI * 2);
        const nx = f.x + Math.cos(a) * 150;
        const nz = f.z + Math.sin(a) * 150;
        const tt = terrainAt(nx, nz).t;
        if ((tt === 'forest' || tt === 'grass') && !G.fires.some((o) => o.alive && Math.hypot(o.x - nx, o.z - nz) < 120)) {
          G.fires.push({ x: nx, z: nz, kind: 'forest', intensity: 0.5, alive: true, spreadIn: 34 });
          say(G, 'NEW FIRE — the wind is spreading it', 3);
          soundAlarm();
        }
      }
    }
  }

  // --- Endings. ---
  if (G.phase === 'fires' && alive === 0) {
    // Every fire is out: the island is safe. Now bring her home.
    G.phase = 'return';
    G.timeLeft += CFG.RETURN_BONUS_TIME;
    say(G, 'ALL FIRES OUT — LAND ON THE RUNWAY', 5);
    soundWin();
  } else if (G.timeLeft <= 0) {
    G.state = 'lose';
    G.crashReason = G.phase === 'return'
      ? 'OUT OF TIME ON THE WAY HOME'
      : 'THE CLOCK RAN OUT';
  } else if (alive >= CFG.FIRES_MAX) {
    G.state = 'lose';
    G.crashReason = 'THE FIRE TOOK THE ISLAND';
  }
}
