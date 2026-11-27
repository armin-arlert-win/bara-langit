// BARA LANGIT v3 — the sortie itself. One job: physics, fires, water, fuel,
// three visible phases, scoring, endings. No drawing here; render.js reads this.
const World = (() => {
  const C = CFG;
  const D2R = Math.PI / 180;
  function freshState() {
    return {
      mode: 'title', // title | fly | win | lose | crash
      phase: 1, // 1 forest fires, 2 town fires, 3 precision landing
      t: 0, timeLeft: C.clockStart,
      x: C.runway.x - C.runway.len / 2 + 60, z: C.runway.z,
      alt: 2, hdg: 90, speed: 0, pitch: 0, bank: 0, throttle: 0,
      fuel: C.fuelMax, water: C.waterMax,
      score: 0, firesOut: 0, townOut: 0,
      fires: Terrain.fireSpots(),
      spares: Terrain.spreadSpots(),
      spreadTimer: C.spreadEvery,
      drops: [], splash: null,
      message: '', messageT: 0,
      landBonus: 0, timeBonus: 0,
      endReason: '', endDetail: '',
      airborne: false, landed: false,
      windGust: 0,
      stats: { drops: 0, scoops: 0, refuels: 0 },
    };
  }
  let S = freshState();
  function aliveFires() { return S.fires.filter((f) => f.alive); }
  function phaseFires() {
    return S.fires.filter((f) => f.alive && (S.phase === 1 ? f.kind === 'forest' : f.kind === 'town'));
  }
  function nearestFire() {
    let best = null, bd = 1e12;
    for (const f of phaseFires()) {
      const d = Math.hypot(f.x - S.x, f.z - S.z);
      if (d < bd) { bd = d; best = f; }
    }
    return best ? { fire: best, dist: bd } : null;
  }
  function say(text, secs) { S.message = text; S.messageT = secs || 2.4; }
  function groundH() { return Terrain.heightAt(S.x, S.z); }
  function overWater() {
    return Terrain.typeAt(S.x, S.z) === 'sea' || Terrain.typeAt(S.x, S.z) === 'lake';
  }
  function onStrip() { return Terrain.onRunway(S.x, S.z); }
  function windDrift(dt) {
    // Steady westerly + slow deterministic gust pushes the ground track sideways.
    const g = Math.sin(S.t * 0.11) * 6; // kt, deterministic
    S.windGust = g;
    const w = (C.windSpeed + g) * 0.514; // m/s from the west -> pushes +x
    S.x += w * dt * (S.alt > 2 ? 1 : 0.15);
  }
  function step(dt) {
    if (S.mode !== 'fly') return;
    S.t += dt;
    S.timeLeft -= dt;
    if (S.timeLeft <= 0) { S.timeLeft = 0; return endLose('TIME UP', 'The clock ran out with fires still burning.'); }
    if (S.messageT > 0) S.messageT -= dt;
    // --- throttle / speed ---
    if (Input.throttleUp) S.throttle = Math.min(1, S.throttle + dt * 0.7);
    if (Input.throttleDown) S.throttle = Math.max(0, S.throttle - dt * 0.7);
    const target = S.throttle * C.maxSpeed;
    S.speed += (target - S.speed) * Math.min(1, dt * (S.throttle > 0.05 ? 0.45 : 0.9));
    S.speed -= C.drag * dt * (S.speed / 100);
    if (S.speed < 0) S.speed = 0;
    // --- bank / heading ---
    const bankWant = (Input.bankLeft ? -1 : 0) + (Input.bankRight ? 1 : 0);
    S.bank += (bankWant * C.maxBank - S.bank) * Math.min(1, dt * 4);
    S.hdg = (S.hdg + (-S.bank / C.maxBank) * C.turnRate * dt * (0.35 + S.speed / C.maxSpeed) + 360) % 360;
    // --- pitch / altitude ---
    const pitchWant = (Input.pitchUp ? -1 : 0) + (Input.pitchDown ? 1 : 0);
    S.pitch += (pitchWant * C.maxPitch - S.pitch) * Math.min(1, dt * 3.5);
    const flying = S.speed > C.minFlySpeed;
    if (flying) {
      const vs = -S.pitch * 1.35 + (S.throttle - 0.42) * 9;
      S.alt += vs * dt;
      S.airborne = true;
    } else if (S.alt > groundH() + 0.5) {
      S.alt -= C.sinkRate * dt; // settling
    }
    if (S.alt < groundH()) S.alt = groundH();
    // --- move ---
    const v = (S.speed * 1000 / 3600) * dt;
    const hr = S.hdg * D2R;
    S.x += Math.sin(hr) * v;
    S.z -= Math.cos(hr) * v;
    windDrift(dt);
    // --- fuel ---
    if (S.throttle > 0.05 && S.alt > groundH() + 1) {
      S.fuel -= C.fuelBurn * (0.4 + S.throttle) * dt;
      if (S.fuel <= 0) {
        S.fuel = 0; S.throttle = 0;
        if (S.messageT <= 0) { say('FUEL EMPTY — GLIDE TO THE RUNWAY', 3); AudioSys.alarm(); }
      }
    }
    // --- fire spread ---
    S.spreadTimer -= dt;
    if (S.spreadTimer <= 0) {
      S.spreadTimer = C.spreadEvery;
      spreadFire();
      if (S.mode !== 'fly') return;
    }
    // --- drops ---
    for (const d of S.drops) { d.z2 += d.vy * dt; d.vy += 30 * dt; d.life -= dt; }
    S.drops = S.drops.filter((d) => d.life > 0 && d.z2 < 120);
    if (S.splash) { S.splash.t -= dt; if (S.splash.t <= 0) S.splash = null; }
    // --- scoop / refuel / landing ---
    groundContact(dt);
    // --- crash checks ---
    const gh = groundH();
    if (S.alt <= gh + 0.5 && S.airborne && S.speed > 40 && !onStrip()) {
      const type = Terrain.typeAt(S.x, S.z);
      if (type === 'sea' || type === 'lake') return endCrash('DITCHED IN THE WATER', 'Water at speed is as hard as rock.');
      if (type === 'rock' || type === 'ash') return endCrash('INTO THE VOLCANO', 'The volcano is a wall, not a shortcut.');
      return endCrash('TERRAIN STRIKE', 'The island is higher than the altimeter said.');
    }
    // Touching the strip mid-sortie is a refuel stop, not a crash — groundContact handles it.
  }
  function groundContact(dt) {
    const gh = groundH();
    const onGround = S.alt <= gh + 0.6;
    if (!onGround || !S.airborne) return;
    if (!onStrip()) return;
    // On the runway, slow: refuel + (phase 3) score the landing.
    if (S.speed < 60) {
      if (S.fuel < C.fuelMax) { S.fuel = C.fuelMax; S.stats.refuels++; say('REFUELLED — TANK FULL', 2); }
      if (S.phase === 3 && !S.landed) {
        S.landed = true;
        scoreLanding();
      }
    } else if (S.speed > C.landMaxSpeed && S.phase === 3 && !S.landed) {
      return endCrash('HARD LANDING', 'Touchdown over ' + C.landMaxSpeed + ' km/h breaks the gear.');
    }
  }
  function scoreLanding() {
    const centre = Math.abs(S.z - C.runway.z);
    const centrePts = Math.max(0, 200 - centre * 2.2);
    const speedPts = Math.max(0, 120 - Math.max(0, S.speed - 90) * 1.1);
    const sinkPts = 80; // sink rate is already survivable by construction here
    S.landBonus = Math.round(Math.min(C.landBonusMax, centrePts + speedPts + sinkPts));
    S.timeBonus = Math.round(S.timeLeft * 3);
    S.score += S.landBonus + S.timeBonus;
    endWin('LANDED ON THE RUNWAY', 'Centreline ' + Math.round(centre) + ' m off · touchdown ' + Math.round(S.speed) + ' km/h');
  }
  function spreadFire() {
    if (S.phase !== 1) return; // fires only spread while the forest phase runs
    const alive = aliveFires().length;
    if (alive >= C.maxFires) return endLose('TOO MANY FIRES', alive + ' fires burning — the island is lost.');
    const spare = S.spares.find((s) => !s.alive);
    if (!spare) return;
    spare.alive = true;
    S.fires.push({ x: spare.x, z: spare.z, kind: 'forest', alive: true, heat: 1 });
    say('NEW FIRE SPOTTED — SMOKE ON THE HORIZON', 3);
    AudioSys.alarm();
  }
  function dropWater() {
    if (S.mode !== 'fly' || S.water <= 0 || S.alt <= groundH() + 2) return false;
    S.water--;
    S.stats.drops++;
    AudioSys.drop();
    const hr = S.hdg * D2R;
    const dx = S.x + Math.sin(hr) * 40, dz = S.z - Math.cos(hr) * 40;
    S.drops.push({ x: dx, z: dz, z2: S.alt, vy: 6, life: 3 });
    // Resolve the drop against the nearest fire of the current phase.
    const nf = nearestFire();
    let hit = null;
    if (nf && nf.dist < 420) {
      const d = Math.hypot(nf.fire.x - dx, nf.fire.z - dz);
      if (d < C.dropRadius + 60) hit = nf.fire;
    }
    if (hit) {
      hit.alive = false;
      const pts = hit.kind === 'town' ? C.townScore : C.fireScore;
      S.score += pts;
      S.firesOut++;
      if (hit.kind === 'town') S.townOut++;
      S.splash = { x: hit.x, z: hit.z, t: 1.4 };
      say((hit.kind === 'town' ? 'TOWN FIRE OUT  +' : 'FIRE OUT  +') + pts, 2.2);
      AudioSys.fireOut();
      checkPhase();
    } else {
      say('DROP MISSED — LEAD THE TARGET', 1.6);
    }
    return true;
  }
  function checkPhase() {
    if (S.phase === 1 && !S.fires.some((f) => f.alive && f.kind === 'forest')) {
      S.phase = 2;
      say('PHASE 2/3 — TOWN FIRES BURNING', 3.2);
      AudioSys.alarm();
    } else if (S.phase === 2 && !S.fires.some((f) => f.alive)) {
      S.phase = 3;
      S.timeLeft += 60;
      say('PHASE 3/3 — ALL FIRES OUT · LAND ON THE RUNWAY', 3.4);
      AudioSys.win();
    }
  }
  function tryScoop() {
    if (S.mode !== 'fly') return;
    if (S.water >= C.waterMax) return;
    if (S.alt < C.scoopAlt && overWater() && S.speed < C.scoopMaxSpeed && S.speed > 60) {
      S.water = C.waterMax;
      S.stats.scoops++;
      say('SCOOPED — TANK FULL', 2);
      AudioSys.scoop();
    }
  }
  function endWin(detail, sub) {
    S.mode = 'win'; S.endReason = detail; S.endDetail = sub || '';
    AudioSys.win();
  }
  function endLose(reason, sub) {
    S.mode = 'lose'; S.endReason = reason; S.endDetail = sub || '';
    AudioSys.crash();
  }
  function endCrash(reason, sub) {
    S.mode = 'crash'; S.endReason = reason; S.endDetail = sub || '';
    AudioSys.crash();
  }
  function start() {
    S = freshState();
    S.mode = 'fly';
    S.x = C.runway.x - C.runway.len / 2 + 60; S.z = C.runway.z; S.alt = 2;
    S.hdg = 90; S.speed = 0; S.throttle = 0.55;
    say('PHASE 1/3 — 6 FOREST FIRES · SCOOP OVER WATER', 3.4);
  }
  function reset() { S = freshState(); }
  return {
    get S() { return S; },
    set S(v) { S = v; },
    freshState, start, reset, step, dropWater, tryScoop,
    aliveFires, phaseFires, nearestFire, groundH, overWater, onStrip, say,
    endWin, endLose, endCrash,
  };
})();
