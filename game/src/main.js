// main.js: the loop, the screens, and the self-test. Boots the game,
// steps the world, draws every frame, and answers Enter, Space, P and M.

let G = newGame();
let paused = false;
let animT = 0;
let lastNow = 0;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function startSortie() {
  ensureAudio();
  G = newGame();
  G.state = 'playing';
  paused = false;
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
  if (consumePress('p') && G.state === 'playing') paused = !paused;
  if (consumePress('m')) {
    muted = !muted;
    if (engineGain) engineGain.gain.value = 0;
  }
  if (G.state === 'playing' && !paused) {
    if (consumePress(' ')) dropWater(G);
    updateWorld(G, dt);
    engineSound(G.throttle, G.speed);
  }
  render(ctx, G, animT);
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
    // 3 — a drop on a fire puts it out.
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
    // 5 — the last fire out wins the sortie.
    g = newGame();
    g.state = 'playing';
    for (const ff of g.fires) ff.alive = false;
    step(g, 0.1);
    check('all fires out wins', g.state === 'win');
    // 6 — the ground is not forgiving.
    g = newGame();
    g.state = 'playing';
    g.x = 0; g.z = 0; g.alt = 50;
    step(g, 0.1);
    check('hitting terrain crashes', g.state === 'crash');
    // 7 — the clock runs.
    g = newGame();
    g.state = 'playing';
    const t0 = g.timeLeft;
    step(g, 1);
    check('clock counts down', g.timeLeft < t0);
    // 8 — one frame draws without throwing.
    const gg = newGame();
    gg.state = 'playing';
    render(ctx, gg, 8.0);
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
  const q = new URLSearchParams(location.search);
  if (q.get('selftest') === '1') {
    runSelfTest();
    return;
  }
  const shot = Number(q.get('shot') || 0);
  if (shot >= 1 && shot <= 4) {
    // One frozen frame: the same state, the same clock, every capture.
    G = applyShot(shot);
    render(ctx, G, SHOT_TIME);
    document.title = 'SHOT ' + shot;
    return;
  }
  // Title screen over a live scenic backdrop: the plane circles the island.
  G.x = -900; G.z = 1150; G.alt = 300; G.speed = 55; G.throttle = 0.5;
  G.heading = 0.6;
  requestAnimationFrame(frame);
}

boot();
