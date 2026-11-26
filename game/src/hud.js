// hud.js: the instruments — a DOM overlay on top of the 3D view, updated
// every frame from the game state. ALT / SPD / HDG, a compass strip, an
// artificial horizon, throttle, fuel, the water tank, the clock, the score,
// a minimap and the target range. Lit, high-contrast and readable at a
// glance when the screenshot is shrunk to a contact sheet.

import { CFG } from './config.js';
import { terrainAt } from './terrain.js';
import { currentTarget, firesOut, windNow } from './world.js';

const $ = (id) => document.getElementById(id);

function fmt(n, digits) {
  return String(Math.round(n)).padStart(digits || 0, '0');
}

function fmtClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return fmt(Math.floor(s / 60), 2) + ':' + fmt(s % 60, 2);
}

function drawCompass(G) {
  const c = $('compass');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(8,10,20,0.72)';
  ctx.fillRect(0, 0, W, H);
  const deg = ((G.heading * 180 / Math.PI) % 360 + 360) % 360;
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  for (let d = -120; d <= 120; d += 15) {
    const a = ((deg + d) % 360 + 360) % 360;
    const x = W / 2 + d * (W / 260);
    const major = d % 30 === 0;
    ctx.fillStyle = major ? '#ffd27a' : '#9aa4c0';
    ctx.fillRect(x, major ? 2 : 8, 1, major ? 10 : 6);
    if (major) {
      // The label is the nearest 30-degree mark, not an exact multiple:
      // the heading itself is rarely a multiple of 15.
      const labelDeg = Math.round(a / 30) * 30 % 360;
      const label = labelDeg === 0 ? 'N' : labelDeg === 90 ? 'E' : labelDeg === 180 ? 'S' : labelDeg === 270 ? 'W' : String(labelDeg);
      ctx.fillStyle = '#e8ecf8';
      ctx.fillText(label, x, H - 4);
    }
  }
  // The lubber line: where the nose points.
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 6, 0);
  ctx.lineTo(W / 2 + 6, 0);
  ctx.lineTo(W / 2, 9);
  ctx.closePath();
  ctx.fill();
}

function drawAttitude(G) {
  const c = $('attitude');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const cx = W / 2, cy = H / 2, r = W / 2 - 4;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // The horizon rolls with the plane and slides with the pitch.
  ctx.translate(cx, cy);
  ctx.rotate(-G.roll);
  const pitchPx = Math.max(-r, Math.min(r, G.pitch * r * 2.4));
  ctx.translate(0, pitchPx);
  ctx.fillStyle = '#3f7ec2';
  ctx.fillRect(-r * 2, -r * 2, r * 4, r * 2);
  ctx.fillStyle = '#6b4a26';
  ctx.fillRect(-r * 2, 0, r * 4, r * 2);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(-r * 2, -1, r * 4, 2);
  ctx.restore();
  // Fixed wings: the aircraft symbol never moves.
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.moveTo(cx + 8, cy);
  ctx.lineTo(cx + 26, cy);
  ctx.moveTo(cx, cy - 2);
  ctx.lineTo(cx, cy + 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,236,248,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMinimap(G) {
  const c = $('minimap');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(8,12,26,0.78)';
  ctx.fillRect(0, 0, W, H);
  const sx = (x) => W / 2 + (x / CFG.ISLAND_RX) * (W / 2 - 8);
  const sz = (z) => H / 2 + (z / CFG.ISLAND_RZ) * (H / 2 - 8);
  // Island, lake, volcano, runway, village.
  ctx.fillStyle = '#4a7a3a';
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, W / 2 - 8, H / 2 - 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7fb4';
  ctx.beginPath();
  ctx.arc(sx(CFG.LAKE.x), sz(CFG.LAKE.z), 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a3a';
  ctx.beginPath();
  ctx.moveTo(sx(CFG.VOLCANO.x), sz(CFG.VOLCANO.z) - 8);
  ctx.lineTo(sx(CFG.VOLCANO.x) + 7, sz(CFG.VOLCANO.z) + 6);
  ctx.lineTo(sx(CFG.VOLCANO.x) - 7, sz(CFG.VOLCANO.z) + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8d8d8';
  ctx.fillRect(sx(CFG.RUNWAY.x) - 16, sz(CFG.RUNWAY.z) - 2, 32, 4);
  ctx.fillStyle = '#d8c9a8';
  ctx.fillRect(sx(CFG.VILLAGE.x) - 3, sz(CFG.VILLAGE.z) - 3, 6, 6);
  // Fires: red for forest, orange for a burning house.
  for (const f of G.fires) {
    if (!f.alive) continue;
    ctx.fillStyle = f.kind === 'building' ? '#ff8a2a' : '#ff3b1f';
    ctx.beginPath();
    ctx.arc(sx(f.x), sz(f.z), 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // The plane: a white arrow that turns with the heading.
  ctx.save();
  ctx.translate(sx(G.x), sz(G.z));
  ctx.rotate(G.heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 5);
  ctx.lineTo(-4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function updateHud(G) {
  const deg = ((G.heading * 180 / Math.PI) % 360 + 360) % 360;
  const alt = $('hud-alt');
  if (alt) alt.textContent = 'ALT ' + Math.round(G.alt * 3.28) + ' ft';
  const spd = $('hud-spd');
  if (spd) spd.textContent = 'SPD ' + Math.round(G.speed * 3.6) + ' km/h';
  const hdg = $('hud-hdg');
  if (hdg) hdg.textContent = 'HDG ' + fmt(deg, 3) + '°';
  const clock = $('hud-clock');
  if (clock) {
    clock.textContent = fmtClock(G.timeLeft);
    clock.style.color = G.timeLeft < 30 ? '#ff5a3c' : '#ffd27a';
  }
  const score = $('hud-score');
  if (score) score.textContent = 'SCORE ' + G.score.toLocaleString('en-US');
  const thr = $('hud-thr');
  if (thr) thr.style.height = Math.round(G.throttle * 100) + '%';
  const fuel = $('hud-fuel');
  if (fuel) {
    fuel.style.width = Math.round(G.fuel) + '%';
    fuel.style.background = G.fuel < 20 ? '#ff5a3c' : '#ffb13c';
  }
  const water = $('hud-water');
  if (water) {
    const drops = water.querySelectorAll('.drop');
    drops.forEach((d, i) => {
      d.style.opacity = i < Math.floor(G.water) ? '1' : '0.18';
    });
  }
  const fires = $('hud-fires');
  if (fires) {
    const fo = firesOut(G);
    fires.textContent = 'FIRES OUT ' + fo.out + ' / ' + fo.total;
    fires.style.color = fo.out === fo.total ? '#7ddc7a' : '#ffb13c';
  }
  const wind = $('hud-wind');
  if (wind) {
    const w = windNow(G.time);
    const wdeg = ((Math.atan2(w.x, -w.z) * 180 / Math.PI) % 360 + 360) % 360;
    wind.textContent = 'WIND ' + fmt(wdeg, 3) + '° ' + Math.round(Math.hypot(w.x, w.z) * 1.94) + ' kt';
  }
  const tgt = $('hud-target');
  if (tgt) {
    if (G.state === 'win') {
      tgt.textContent = '◆ LANDED — SORTIE COMPLETE';
    } else if (G.phase === 'return') {
      const R = CFG.RUNWAY;
      const d = Math.hypot(R.x - G.x, R.z - G.z);
      tgt.textContent = '◈ RUNWAY ' + Math.round(d) + ' m — LAND IT';
    } else {
      const t = currentTarget(G);
      if (t) {
        const d = Math.hypot(t.x - G.x, t.z - G.z);
        tgt.textContent = '◆ ' + (t.kind === 'building' ? 'HOUSE FIRE ' : 'FIRE ') + Math.round(d) + ' m';
      } else {
        tgt.textContent = '';
      }
    }
  }
  const msg = $('hud-message');
  if (msg) {
    msg.textContent = G.messageT > 0 ? G.message : '';
    msg.style.opacity = G.messageT > 0 ? '1' : '0';
  }
  drawCompass(G);
  drawAttitude(G);
  drawMinimap(G);
}

// Overlays for the screens that are not the flying itself.
export function showScreen(name, G) {
  const title = $('screen-title');
  const end = $('screen-end');
  if (title) title.style.display = name === 'title' ? 'flex' : 'none';
  if (end) end.style.display = (name === 'win' || name === 'lose' || name === 'crash') ? 'flex' : 'none';
  if ((name === 'win' || name === 'lose' || name === 'crash') && end) {
    const h = $('end-head');
    const b = $('end-body');
    if (name === 'win') {
      if (h) h.textContent = 'ALL FIRES OUT';
      if (b) {
        b.innerHTML = 'THE ISLAND IS SAFE — LANDED ON THE RUNWAY<br>' +
          'SCORE ' + G.score.toLocaleString('en-US') +
          ' &nbsp;·&nbsp; time bonus +' + G.winBonus +
          ' &nbsp;·&nbsp; landing +' + G.landingBonus +
          '<br><br>ENTER — FLY AGAIN';
      }
    } else if (name === 'lose') {
      if (h) h.textContent = 'SORTIE LOST';
      if (b) b.textContent = (G.crashReason || 'THE CLOCK RAN OUT') + ' — ENTER TO FLY AGAIN';
    } else {
      if (h) h.textContent = 'CRASHED';
      if (b) b.textContent = (G.crashReason || '') + ' — ENTER TO FLY AGAIN';
    }
  }
}
