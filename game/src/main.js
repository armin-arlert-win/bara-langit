// BARA LANGIT v3 — boot, loop, input edges, self-test. One job: run the game.
const Main = (() => {
  const C = CFG;
  const cv = document.getElementById('game');
  cv.width = C.W; cv.height = C.H;
  Render.init(cv);
  Hud.init(cv);
  const params = new URLSearchParams(location.search);
  let paused = false;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const S = World.S;
    S.t += dt;
    if (!paused && S.mode === 'fly') {
      World.step(dt);
      World.tryScoop();
      AudioSys.engine(S.throttle, S.speed);
    }
    Render.draw(S);
    Hud.draw(S);
    if (paused) {
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'rgba(8,10,18,0.6)'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center';
      ctx.fillText('PAUSED — P TO RESUME', C.W / 2, C.H / 2);
    }
    requestAnimationFrame(frame);
  }
  function startGame() {
    AudioSys.unlock();
    World.start();
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      const S = World.S;
      if (S.mode !== 'fly') startGame();
    }
    if (e.code === 'Space' && !e.repeat) {
      const S = World.S;
      if (S.mode === 'fly' && !paused) World.dropWater();
    }
    if (e.code === 'KeyP' && !e.repeat) paused = !paused;
    if (e.code === 'KeyM' && !e.repeat) AudioSys.toggleMute();
  });
  cv.addEventListener('click', () => {
    if (World.S.mode !== 'fly') startGame();
  });
  // ---- self-test (?selftest=1): scripted checks, results into the DOM ----
  function selfTest() {
    const out = [];
    function check(name, fn) {
      try {
        const r = fn();
        out.push((r === true ? 'PASS' : 'FAIL') + ' ' + name + (r === true ? '' : ' — ' + r));
      } catch (e) {
        out.push('FAIL ' + name + ' — threw ' + e.message);
      }
    }
    // stub the keyboard: tests drive the world by pretending keys are held
    const held = {};
    for (const k of ['throttleUp', 'throttleDown', 'bankLeft', 'bankRight', 'pitchUp', 'pitchDown']) {
      Object.defineProperty(Input, k, { get: () => !!held[k], configurable: true });
    }
    function resetKeys() { for (const k in held) held[k] = false; }
    check('throttle builds speed', () => {
      World.start(); resetKeys(); held.throttleUp = true;
      for (let i = 0; i < 100; i++) World.step(0.05);
      return World.S.speed > 150 || ('speed ' + World.S.speed.toFixed(0));
    });
    check('bank turns heading', () => {
      World.start(); resetKeys(); held.throttleUp = true; held.bankRight = true;
      const h0 = World.S.hdg;
      for (let i = 0; i < 60; i++) World.step(0.05);
      const dh = Math.abs(World.S.hdg - h0);
      return dh > 8 || ('heading moved ' + dh.toFixed(1) + ' deg');
    });
    check('water drop soaks a fire', () => {
      World.start();
      const f = World.S.fires.find((x) => x.alive && x.kind === 'forest');
      World.S.x = f.x - 60; World.S.z = f.z + 60; World.S.alt = 130;
      World.S.hdg = 45; World.S.speed = 180; World.S.water = 3;
      const before = World.S.score;
      World.dropWater();
      return (!f.alive && World.S.score > before) || 'fire still alive';
    });
    check('sea skim refills tank', () => {
      World.start();
      World.S.x = -2750; World.S.z = 0; World.S.alt = 5; World.S.speed = 120; World.S.water = 0;
      World.tryScoop();
      return World.S.water === 3 || ('water ' + World.S.water);
    });
    check('last forest fire advances the phase', () => {
      World.start();
      const alive = World.S.fires.filter((x) => x.alive && x.kind === 'forest');
      for (const f of alive.slice(0, -1)) f.alive = false;
      const last = alive[alive.length - 1];
      World.S.x = last.x - 60; World.S.z = last.z + 60; World.S.alt = 130;
      World.S.hdg = 45; World.S.speed = 180; World.S.water = 3;
      World.dropWater();
      return World.S.phase === 2 || ('phase ' + World.S.phase);
    });
    check('precision landing wins', () => {
      World.start();
      World.S.phase = 3; World.S.airborne = true;
      World.S.x = CFG.runway.x; World.S.z = CFG.runway.z;
      World.S.alt = Terrain.heightAt(World.S.x, World.S.z);
      World.S.speed = 40; World.S.throttle = 0;
      World.step(0.1);
      return World.S.mode === 'win' || ('mode ' + World.S.mode);
    });
    check('hitting terrain crashes', () => {
      World.start();
      // fly low into the volcano's flank from the west: the cone rises faster
      // than the tanker can climb, so the slope must end the sortie
      World.S.x = 900; World.S.z = -300;
      World.S.alt = Terrain.heightAt(900, -300) + 1;
      World.S.hdg = 90; World.S.airborne = true; World.S.speed = 200;
      World.S.throttle = 0.55;
      for (let i = 0; i < 30 && World.S.mode === 'fly'; i++) World.step(0.1);
      return World.S.mode === 'crash' || ('mode ' + World.S.mode);
    });
    check('clock counts down', () => {
      World.start();
      const t0 = World.S.timeLeft;
      World.step(2);
      return (t0 - World.S.timeLeft) > 1.9 || ('timeLeft ' + World.S.timeLeft.toFixed(1));
    });
    const passed = out.filter((l) => l.startsWith('PASS')).length;
    const pre = document.createElement('pre');
    pre.id = 'selftest';
    pre.textContent = out.join('\n') + '\nSELFTEST ' + passed + '/' + out.length;
    document.body.appendChild(pre);
    document.title = 'SELFTEST ' + passed + '/' + out.length;
  }
  // ---- boot ----
  if (params.has('selftest')) {
    selfTest();
  } else if (params.has('shot')) {
    const n = parseInt(params.get('shot'), 10);
    Shots.apply(n);
    Render.draw(World.S);
    Hud.draw(World.S);
  } else {
    World.reset();
    requestAnimationFrame(frame);
  }
})();
