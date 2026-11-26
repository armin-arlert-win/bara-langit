// main.js: the loop, the screens, and the self-test. Boots the game,
// steps the world, draws every frame, and answers Enter, Space, P and M.

import { CFG } from './config.js';
import { newGame, updateWorld, dropWater } from './world.js';
import { KEYS, bindInput, consumePress, consumeClick } from './input.js';
import { ensureAudio, engineSound } from './audio.js';
import { initRender, buildWorldVisuals, renderFrame } from './render.js';
import { updateHud, showScreen } from './hud.js';
import { applyShot, SHOT_TIME } from './shots.js';

let G = newGame();
let paused = false;
let animT = 0;
let lastNow = 0;

const canvas = document.getElementById('game');

function startSortie() {
  ensureAudio();
  G = newGame();
  G.state = 'playing';
  paused = false;
  showScreen('none', G);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016);
  lastNow = now;
  animT += dt;

  if (consumePress('enter') || consumeClick()) {
    if (G.state === 'title' || G.state === 'win' || G.state === 'lose' || G.state === 'crash') {
      startSortie();
    }
  }
  if (consumePress('p') && (G.state === 'playing' || G.state === 'return')) paused = !paused;
  if (consumePress('m')) {
    // Mute is handled inside the audio module's own flag; here we just
    // note the press so the key does nothing else.
  }
  if ((G.state === 'playing' || G.state === 'return') && !paused) {
    if (consumePress(' ')) dropWater(G);
    updateWorld(G, dt);
    engineSound(G.throttle, G.speed);
    if (G.state === 'win' || G.state === 'lose' || G.state === 'crash') {
      showScreen(G.state, G);
    }
  }
  renderFrame(G, animT, false);
  updateHud(G);
}

// --- Self-test: ?selftest=1 runs the game headlessly through its paces
// and writes the verdict into the page, where a headless run can read it.
function runSelfTest() {
  const results = [];
  function check(name, ok) {
    results.push([name, !!ok]);
  }
  const step = (g, seconds) => {
    const n = Math.round(seconds * 60);
    for (let i = 0; i < n; i++) updateWorld(g, 1 / 60);
  };
  try {
    // 1 — throttle spools the engine up.
    let g = newGame();
    g.state = 'playing';
    KEYS.w = true;
    step(g, 5);
    KEYS.w = false;
    check('throttle builds speed', g.speed > 40);
    // 2 — banking turns the nose (airborne: a bank on the runway would
    // roll her off the strip into the grass).
    const h0 = g.heading;
    g.alt = 200; g.speed = 60;
    KEYS.arrowleft = true;
    step(g, 2);
    KEYS.arrowleft = false;
    check('bank turns heading', Math.abs(g.heading - h0) > 0.15);
    // 3 — a drop on a forest fire puts it out.
    const f = g.fires[0];
    g.x = f.x; g.z = f.z + 172.5; g.heading = 0; g.alt = 150;
    const before = f.intensity;
    dropWater(g);
    check('water drop soaks a fire', !f.alive || f.intensity < before);
    // 4 — skimming the sea refills the tank.
    g = newGame();
    g.state = 'playing';
    g.x = 0; g.z = -1700; g.alt = 2; g.speed = 40; g.throttle = 0; g.water = 0;
    step(g, 4);
    check('sea skim refills tank', g.water > 1);
    // 5 — the last fire out sends her home.
    g = newGame();
    g.state = 'playing';
    for (const ff of g.fires) ff.alive = false;
    step(g, 0.1);
    check('all fires out starts the return', g.phase === 'return' && g.timeLeft > CFG.TIME_LIMIT);
    // 6 — a precision landing on the runway wins the sortie.
    g = newGame();
    g.state = 'return';
    g.phase = 'return';
    g.x = CFG.RUNWAY.x - 100; g.z = CFG.RUNWAY.z;
    g.alt = 6; g.speed = 40; g.throttle = 0;
    g.heading = Math.PI / 2; g.pitch = 0; g.roll = 0;
    step(g, 0.5);
    check('precision landing wins', g.state === 'win' && g.landingBonus > 0);
    // 7 — a drop on a burning house scores the building points.
    g = newGame();
    g.state = 'playing';
    const b = g.fires.find((ff) => ff.kind === 'building');
    g.x = b.x; g.z = b.z + 172.5; g.heading = 0; g.alt = 150;
    dropWater(g);
    check('building fire scores 150', g.score >= 150);
    // 8 — the ground is not forgiving.
    g = newGame();
    g.state = 'playing';
    g.x = 0; g.z = 0; g.alt = 50;
    step(g, 0.1);
    check('hitting terrain crashes', g.state === 'crash');
    // 9 — the clock runs.
    g = newGame();
    g.state = 'playing';
    const t0 = g.timeLeft;
    step(g, 1);
    check('clock counts down', g.timeLeft < t0);
    // 10 — one frame draws without throwing.
    const gg = newGame();
    gg.state = 'playing';
    renderFrame(gg, SHOT_TIME, true);
    check('frame renders', true);
  } catch (err) {
    results.push(['EXCEPTION: ' + (err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : String(err)), false]);
  }
  const passed = results.filter((r) => r[1]).length;
  const lines = results.map((r) => (r[1] ? 'PASS ' : 'FAIL ') + r[0]);
  const verdict = 'SELFTEST ' + passed + '/' + results.length + ' PASS';
  lines.push(verdict);
  const el = document.getElementById('test-results');
  el.textContent = lines.join('\n');
  el.style.display = 'block';
  document.title = verdict;
}

function boot() {
  bindInput();
  initRender(canvas);
  buildWorldVisuals(G);
  const q = new URLSearchParams(location.search);
  if (q.get('selftest') === '1') {
    runSelfTest();
    return;
  }
  const shot = Number(q.get('shot') || 0);
  if (shot >= 1 && shot <= 4) {
    // One frozen frame: the same state, the same clock, every capture.
    G = applyShot(shot);
    renderFrame(G, SHOT_TIME, true);
    updateHud(G);
    if (shot === 4) showScreen('win', G);
    else showScreen('none', G);
    document.title = 'SHOT ' + shot;
    return;
  }
  // Title screen over a live scenic backdrop: the camera orbits the island.
  G.x = CFG.RUNWAY.x - 250; G.z = CFG.RUNWAY.z;
  G.alt = 5; G.speed = 0; G.throttle = 0;
  G.heading = Math.PI / 2;
  showScreen('title', G);
  requestAnimationFrame(frame);
}

boot();
