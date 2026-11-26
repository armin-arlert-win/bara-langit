// shots.js: staged, deterministic states for the four screenshots.
// Same state + same fixed clock = the same pixels on every render, so the
// cover and the dossier are reproducible, not a lucky frame.

// The clock is frozen for shots: flames, smoke and props never flicker
// between two captures of the same shot.
const SHOT_TIME = 8.0;

function applyShot(n) {
  const G = newGame();
  const fire = (i) => G.fires[i % G.fires.length];
  if (n === 1) {
    // COVER: mid-sortie chase view — a big fire dead ahead, the volcano and
    // the runway in the same frame, full tank, instruments lit.
    const f = fire(0);
    G.state = 'playing';
    G.x = f.x + 640; G.z = f.z + 320;
    G.heading = Math.atan2(f.x - G.x, -(f.z - G.z));
    G.alt = 245; G.speed = 62; G.throttle = 0.7;
    G.pitch = 0.05; G.roll = -0.12;
    G.timeLeft = 142; G.score = 100;
    G.fires[1].alive = false; // one fire already out: a sortie in progress
    G.message = '';
  } else if (n === 2) {
    // LOW APPROACH: 500 m out from the runway, gear down in spirit — the
    // strip fills the view, hillside fires smoke behind it.
    const R = CFG.RUNWAY;
    G.state = 'playing';
    G.x = R.x - 500; G.z = R.z;
    G.heading = Math.PI / 2;
    G.alt = 30; G.speed = 55; G.throttle = 0.55;
    G.pitch = -0.03; G.roll = 0.04;
    G.timeLeft = 96; G.score = 400;
    G.fires[0].alive = false; G.fires[1].alive = false;
    G.fires[2].alive = false; G.fires[3].alive = false;
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
    G.fires[4].alive = false;
    G.drops.push({ x: f.x, z: f.z, t: 0.7 });
    G.message = 'FIRE OUT  +100';
    G.messageT = 99;
  } else {
    // MISSION COMPLETE: every fire out, flying west into the sunset.
    const R = CFG.RUNWAY;
    G.state = 'win';
    G.x = R.x + 400; G.z = R.z - 600;
    G.heading = -Math.PI / 2;
    G.alt = 310; G.speed = 60; G.throttle = 0.6;
    G.pitch = 0.04; G.roll = 0.1;
    G.timeLeft = 64; G.score = 2340; G.winBonus = 640;
    for (const f of G.fires) f.alive = false;
    G.message = '';
  }
  return G;
}
