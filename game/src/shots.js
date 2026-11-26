// shots.js: staged, deterministic states for the four screenshots.
// Same state + same fixed clock = the same pixels on every render, so the
// cover and the dossier are reproducible, not a lucky frame.

// The clock is frozen for shots: flames, smoke and props never flicker
// between two captures of the same shot.
export const SHOT_TIME = 8.0;

import { CFG } from './config.js';
import { newGame } from './world.js';

export function applyShot(n) {
  const G = newGame();
  const fire = (i) => G.fires[i % G.fires.length];
  if (n === 1) {
    // COVER: mid-sortie chase view — a big forest fire dead ahead, the
    // volcano and the runway in the same frame, full tank, instruments lit.
    // Close enough that the fire and its ring fill the frame ahead.
    const f = fire(0);
    G.state = 'playing';
    G.x = f.x + 380; G.z = f.z + 260;
    G.heading = Math.atan2(f.x - G.x, -(f.z - G.z));
    G.alt = 220; G.speed = 62; G.throttle = 0.7;
    G.pitch = 0.05; G.roll = -0.12;
    G.timeLeft = 142; G.score = 100;
    // Fire 7 sits closer to this approach than fire 0 does: put it out
    // first, so the gold ring marks the fire the nose is on.
    G.fires[7].alive = false;
    G.message = '';
  } else if (n === 2) {
    // ON FINAL: every fire out, the sortie's finale — an approach to the
    // runway with the gold ring over the threshold. A slight angle off the
    // centreline, so the strip reads as a strip and not a sliver.
    const R = CFG.RUNWAY;
    G.state = 'return';
    G.phase = 'return';
    G.x = R.x - 600; G.z = R.z + 110;
    G.heading = Math.atan2(R.x - R.len / 2 + 70 - G.x, -(R.z - G.z));
    G.alt = 70; G.speed = 55; G.throttle = 0.55;
    G.pitch = -0.03; G.roll = 0.04;
    G.timeLeft = 96; G.score = 1100;
    for (const f of G.fires) f.alive = false;
    G.message = 'ON FINAL — RUNWAY AHEAD';
    G.messageT = 99;
  } else if (n === 3) {
    // WATER AWAY: the drop is falling on a fire, tank down to two.
    const f = fire(4);
    G.state = 'playing';
    G.x = f.x + 170; G.z = f.z + 90;
    G.heading = Math.atan2(f.x - G.x, -(f.z - G.z));
    G.alt = 150; G.speed = 55; G.throttle = 0.6;
    G.pitch = -0.05; G.roll = 0.08;
    G.water = 2;
    G.timeLeft = 71; G.score = 500;
    G.fires[0].alive = false; G.fires[1].alive = false;
    G.fires[2].alive = false; G.fires[3].alive = false;
    // Fire 4 is nearly out: the drop is landing on it now, and the ring
    // still marks it as the target.
    G.fires[4].intensity = 0.2;
    G.drops.push({ x: f.x, z: f.z, t: 0.6, alt: 150 });
    G.message = 'FIRE OUT  +100';
    G.messageT = 99;
  } else {
    // MISSION COMPLETE: landed on the runway after the last fire went out,
    // the island safe, the score on the board.
    const R = CFG.RUNWAY;
    G.state = 'win';
    G.phase = 'return';
    G.x = R.x - 60; G.z = R.z;
    G.heading = Math.PI / 2;
    G.alt = 6; G.speed = 0; G.throttle = 0;
    G.pitch = 0; G.roll = 0;
    G.timeLeft = 64; G.score = 2340; G.winBonus = 640; G.landingBonus = 320;
    for (const f of G.fires) f.alive = false;
    G.message = '';
  }
  return G;
}
