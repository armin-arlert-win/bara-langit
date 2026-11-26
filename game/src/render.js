// render.js: everything the eye sees — dusk sky, the island in perspective,
// the volcano, the runway, the fires, the airtanker, and the instruments.
// One function draws a frame from the world state; `t` is seconds, and for
// screenshots it is a fixed number, so a shot renders the same every time.

function projectPoint(G, wx, wz, wy) {
  const fx = Math.sin(G.heading), fz = -Math.cos(G.heading);
  const rx = Math.cos(G.heading), rz = Math.sin(G.heading);
  const dx = wx - G.x, dz = wz - G.z;
  const d = dx * fx + dz * fz;
  const l = dx * rx + dz * rz;
  if (d < 8) return null;
  return {
    x: (CFG.FOCAL * l) / d,
    y: (CFG.FOCAL * (G.alt - wy)) / d,
    d, s: CFG.FOCAL / d,
  };
}

function drawSky(ctx, G, t) {
  const W = CFG.W, H = CFG.H;
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  g.addColorStop(0, '#141d38');
  g.addColorStop(0.45, '#3a3a63');
  g.addColorStop(0.8, '#c65f3c');
  g.addColorStop(1, '#ffb35c');
  ctx.fillStyle = g;
  ctx.fillRect(-1400, -1400, W + 2800, H * 0.62 + 1400);
  // Early stars, high up.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i++) {
    const sx = hash2(i, 7) * W;
    const sy = hash2(i, 13) * H * 0.24;
    ctx.globalAlpha = 0.25 + 0.55 * hash2(i, 29);
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Low sun, left of the nose.
  const sg = ctx.createRadialGradient(W * 0.2, H * 0.36, 4, W * 0.2, H * 0.36, 90);
  sg.addColorStop(0, 'rgba(255,214,140,0.95)');
  sg.addColorStop(0.25, 'rgba(255,150,70,0.75)');
  sg.addColorStop(1, 'rgba(255,120,50,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(W * 0.2, H * 0.36, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(W * 0.2, H * 0.36, 22, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx, G) {
  const F = CFG.FOCAL;
  const horizonY = 0; // we draw in a frame translated to the horizon
  // Log-spaced depth slices, near to far.
  const N = 30;
  const dMin = 8, dMax = 2600;
  const depths = [];
  for (let i = 0; i <= N; i++) depths.push(dMin * Math.pow(dMax / dMin, i / N));
  const fx = Math.sin(G.heading), fz = -Math.cos(G.heading);
  const rx = Math.cos(G.heading), rz = Math.sin(G.heading);
  const SEG = 64;
  for (let i = 0; i < N; i++) {
    const d0 = depths[i], d1 = depths[i + 1];
    const dMid = (d0 + d1) / 2;
    const yBot = (F * G.alt) / d0;
    const yTop = (F * G.alt) / d1;
    if (yTop > CFG.H) continue; // slice is below the screen
    const half = 1.05 * dMid;
    for (let j = 0; j < SEG; j++) {
      const l0 = -half + (2 * half * j) / SEG;
      const l1 = -half + (2 * half * (j + 1)) / SEG;
      const lm = (l0 + l1) / 2;
      const wx = G.x + fx * dMid + rx * lm;
      const wz = G.z + fz * dMid + rz * lm;
      const terr = terrainAt(wx, wz);
      ctx.fillStyle = terrainColor(terr.t, wx, wz, dMid);
      const sx0 = (F * l0) / dMid;
      const sx1 = (F * l1) / dMid;
      ctx.fillRect(sx0, yTop, sx1 - sx0 + 1, yBot - yTop + 1);
    }
  }
}

function drawVolcano(ctx, G, t) {
  const V = CFG.VOLCANO;
  const p = projectPoint(G, V.x, V.z, 0);
  if (!p) return;
  const baseW = CFG.FOCAL * V.base / p.d;
  const peak = projectPoint(G, V.x, V.z, V.peak);
  if (!peak) return;
  const g = ctx.createLinearGradient(0, peak.y, 0, p.y);
  g.addColorStop(0, '#5a4a42');
  g.addColorStop(0.55, '#4a3f38');
  g.addColorStop(1, '#33291f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(p.x - baseW, p.y);
  ctx.lineTo(peak.x, peak.y);
  ctx.lineTo(p.x + baseW, p.y);
  ctx.closePath();
  ctx.fill();
  // Crater glow, kept small — a big one reads as a second sun.
  const cg = ctx.createRadialGradient(peak.x, peak.y, 1, peak.x, peak.y, baseW * 0.08);
  cg.addColorStop(0, 'rgba(255,120,30,0.9)');
  cg.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(peak.x, peak.y, baseW * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Shadow on the far slope, so the cone is not one flat triangle.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.moveTo(peak.x, peak.y);
  ctx.lineTo(p.x + baseW, p.y);
  ctx.lineTo(p.x + baseW * 0.25, p.y);
  ctx.closePath();
  ctx.fill();
  // Smoke drifting off the crater.
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.12 + i * 0.25) % 1;
    const sx = peak.x + Math.sin(i * 2.4) * 14 + ph * 46;
    const sy = peak.y - ph * 150 - 10;
    ctx.fillStyle = 'rgba(120,112,106,' + (0.5 * (1 - ph)).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(sx, sy, 10 + ph * 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRunway(ctx, G) {
  const R = CFG.RUNWAY;
  const corners = [
    [R.x - R.len / 2, R.z - R.w / 2], [R.x + R.len / 2, R.z - R.w / 2],
    [R.x + R.len / 2, R.z + R.w / 2], [R.x - R.len / 2, R.z + R.w / 2],
  ];
  const pts = corners.map((c) => projectPoint(G, c[0], c[1], 4));
  if (pts.some((p) => !p)) return;
  ctx.fillStyle = '#33363b';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  // Centreline dashes.
  ctx.fillStyle = '#e8e4d8';
  for (let i = 0; i < 6; i++) {
    const f0 = 0.08 + i * 0.15, f1 = f0 + 0.07;
    const a = projectPoint(G, R.x - R.len / 2 + R.len * f0, R.z - 3, 4.5);
    const b = projectPoint(G, R.x - R.len / 2 + R.len * f1, R.z - 3, 4.5);
    const c = projectPoint(G, R.x - R.len / 2 + R.len * f1, R.z + 3, 4.5);
    const d = projectPoint(G, R.x - R.len / 2 + R.len * f0, R.z + 3, 4.5);
    if (!a || !b || !c || !d) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFires(ctx, G, t) {
  for (const f of G.fires) {
    if (!f.alive) continue;
    const p = projectPoint(G, f.x, f.z, terrainAt(f.x, f.z).h);
    if (!p || p.d > 2600) continue;
    const r = fireRadius(f) * p.s;
    // Glow.
    const gg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r * 2.4);
    gg.addColorStop(0, 'rgba(255,140,40,0.5)');
    gg.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Flames, flickering on a fixed clock.
    const fl = 1 + 0.16 * Math.sin(t * 11 + f.x * 0.13 + f.z * 0.07);
    ctx.fillStyle = '#e8491d';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - r * 0.7 * fl, r * 0.75, r * 1.05 * fl, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59a1b';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - r * 0.55 * fl, r * 0.45, r * 0.7 * fl, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - r * 0.4 * fl, r * 0.22, r * 0.38 * fl, 0, 0, Math.PI * 2);
    ctx.fill();
    // Smoke column. The phase is wrapped into [0, 1): JS % keeps the sign,
    // and a negative phase would make the smoke radius negative.
    for (let i = 0; i < 4; i++) {
      const ph = (((t * 0.25 + i * 0.25 + f.x * 0.01) % 1) + 1) % 1;
      const sx = p.x + Math.sin(i * 1.7 + f.z) * 6 + ph * 22;
      const sy = p.y - r * (1.2 + ph * 3.2);
      ctx.fillStyle = 'rgba(70,66,62,' + (0.42 * (1 - ph)).toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, r * (0.5 + ph * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDrops(ctx, G) {
  for (const d of G.drops) {
    const p = projectPoint(G, d.x, d.z, terrainAt(d.x, d.z).h);
    if (!p) continue;
    const prog = d.t / 1.6;
    const rad = p.s * (22 + prog * 55);
    ctx.fillStyle = 'rgba(190,225,255,' + (0.5 * (1 - prog)).toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rad, rad * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * (1 - prog)).toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - rad * 0.15, rad * 0.55, rad * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The airtanker, rear chase view, fixed in the frame; the world moves.
function drawPlane(ctx, G, t) {
  const cx = CFG.W / 2, cy = CFG.H * 0.60 + Math.sin(t * 2.1) * 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(G.roll * 0.85);
  // Wings.
  ctx.fillStyle = '#a33327';
  ctx.beginPath();
  ctx.moveTo(-92, -6); ctx.lineTo(-14, -18); ctx.lineTo(14, -18); ctx.lineTo(92, -6);
  ctx.lineTo(88, 10); ctx.lineTo(12, 4); ctx.lineTo(-12, 4); ctx.lineTo(-88, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8e4d8';
  ctx.fillRect(-92, -6, 8, 14);
  ctx.fillRect(84, -6, 8, 14);
  // Tailplane + fin.
  ctx.fillStyle = '#8c2b20';
  ctx.beginPath();
  ctx.moveTo(-34, 44); ctx.lineTo(34, 44); ctx.lineTo(22, 56); ctx.lineTo(-22, 56);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a33327';
  ctx.beginPath();
  ctx.moveTo(-4, 40); ctx.lineTo(4, 40); ctx.lineTo(10, 62); ctx.lineTo(-10, 62);
  ctx.closePath();
  ctx.fill();
  // Fuselage.
  const fg = ctx.createLinearGradient(-14, 0, 14, 0);
  fg.addColorStop(0, '#d8d2c4');
  fg.addColorStop(0.5, '#f5f1e6');
  fg.addColorStop(1, '#cfc8b8');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.quadraticCurveTo(13, -30, 14, 10);
  ctx.quadraticCurveTo(14, 44, 8, 54);
  ctx.lineTo(-8, 54);
  ctx.quadraticCurveTo(-14, 44, -14, 10);
  ctx.quadraticCurveTo(-13, -30, 0, -62);
  ctx.fill();
  // Red cheatline + belly tank.
  ctx.fillStyle = '#a33327';
  ctx.fillRect(-14, 16, 28, 5);
  ctx.fillStyle = '#2f6fb2';
  ctx.beginPath();
  ctx.ellipse(0, 34, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cockpit glint.
  ctx.fillStyle = '#1d2f45';
  ctx.beginPath();
  ctx.ellipse(-5, -44, 4, 7, -0.25, 0, Math.PI * 2);
  ctx.ellipse(5, -44, 4, 7, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Props, spinning.
  for (const side of [-1, 1]) {
    const px = side * 56, py = -10;
    ctx.strokeStyle = 'rgba(40,36,32,0.55)';
    ctx.lineWidth = 3;
    const a = t * 34 + (side < 0 ? 1.2 : 0);
    ctx.beginPath();
    ctx.moveTo(px - Math.cos(a) * 17, py - Math.sin(a) * 17);
    ctx.lineTo(px + Math.cos(a) * 17, py + Math.sin(a) * 17);
    ctx.moveTo(px - Math.cos(a + 1.57) * 17, py - Math.sin(a + 1.57) * 17);
    ctx.lineTo(px + Math.cos(a + 1.57) * 17, py + Math.sin(a + 1.57) * 17);
    ctx.stroke();
    ctx.fillStyle = '#3a3630';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Nav lights.
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath(); ctx.arc(-92, 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#34d17b';
  ctx.beginPath(); ctx.arc(92, 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHUD(ctx, G, t) {
  const W = CFG.W, H = CFG.H;
  ctx.textBaseline = 'alphabetic';
  // Top bar.
  ctx.fillStyle = 'rgba(10,14,24,0.72)';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = '#f5f1e6';
  ctx.font = 'bold 21px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ALT ' + Math.max(0, Math.round(G.alt)) + ' m', 16, 34);
  ctx.fillText('SPD ' + Math.round(G.speed * 3.6) + ' km/h', 190, 34);
  const hdg = Math.round(((G.heading * 180) / Math.PI % 360 + 360) % 360);
  ctx.fillText('HDG ' + String(hdg).padStart(3, '0') + '°', 400, 34);
  // Clock + score, centre.
  ctx.textAlign = 'center';
  const mm = Math.max(0, Math.floor(G.timeLeft / 60));
  const ss = Math.max(0, Math.floor(G.timeLeft % 60));
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = G.timeLeft < 30 ? '#ff6b4a' : '#f5f1e6';
  ctx.fillText(String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'), W / 2, 35);
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#ffd23e';
  ctx.fillText('SCORE ' + G.score.toLocaleString('en-US'), W / 2, 52);
  drawMinimap(ctx, G);
  // Compass strip under the bar: a label every 30° is all that fits
  // legibly in 380 px — every 15° blurred into one long number.
  ctx.fillStyle = 'rgba(10,14,24,0.55)';
  ctx.fillRect(W / 2 - 190, 54, 380, 22);
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  for (let off = -180; off <= 180; off += 30) {
    const deg = ((hdg + off) % 360 + 360) % 360;
    const x = W / 2 + off * 1.05;
    if (x < W / 2 - 185 || x > W / 2 + 185) continue;
    const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg);
    ctx.fillStyle = (label === 'N' || label === 'E' || label === 'S' || label === 'W') ? '#ffd23e' : '#cfd6e4';
    ctx.fillText(label, x, 70);
    ctx.fillRect(x - 0.5, 72, 1, 5);
  }
  // Artificial horizon, bottom left.
  const ax = 92, ay = H - 92, ar = 50;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(ax, ay);
  ctx.rotate(-G.roll);
  ctx.translate(0, G.pitch * 260);
  ctx.fillStyle = '#7fb2d9';
  ctx.fillRect(-ar - 10, -ar - 60, ar * 2 + 20, ar + 60);
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(-ar - 10, 0, ar * 2 + 20, ar + 60);
  ctx.fillStyle = '#f5f1e6';
  ctx.fillRect(-ar - 10, -1, ar * 2 + 20, 2);
  ctx.restore();
  ctx.strokeStyle = '#f5f1e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.moveTo(ax - 26, ay); ctx.lineTo(ax - 8, ay); ctx.lineTo(ax - 8, ay + 4); ctx.lineTo(ax + 8, ay + 4);
  ctx.lineTo(ax + 8, ay); ctx.lineTo(ax + 26, ay); ctx.lineTo(ax + 26, ay - 3); ctx.lineTo(ax - 26, ay - 3);
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5f1e6';
  ctx.fillText('ATTITUDE', ax, ay + ar + 16);
  // Throttle bar.
  const tx = 168, ty0 = H - 148, th = 104;
  ctx.fillStyle = 'rgba(10,14,24,0.6)';
  ctx.fillRect(tx, ty0, 16, th);
  ctx.fillStyle = G.throttle > 0.85 ? '#ff6b4a' : '#34d17b';
  ctx.fillRect(tx, ty0 + th * (1 - G.throttle), 16, th * G.throttle);
  ctx.strokeStyle = '#f5f1e6';
  ctx.strokeRect(tx, ty0, 16, th);
  ctx.fillStyle = '#f5f1e6';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('THR', tx + 8, ty0 + th + 16);
  // Fuel + water, bottom centre.
  const fx0 = 240, fy = H - 52;
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#f5f1e6';
  ctx.fillText('FUEL', fx0, fy - 26);
  ctx.fillStyle = 'rgba(10,14,24,0.6)';
  ctx.fillRect(fx0 + 52, fy - 38, 150, 14);
  ctx.fillStyle = G.fuel < 20 ? '#ff6b4a' : '#ffb13e';
  ctx.fillRect(fx0 + 52, fy - 38, 150 * (G.fuel / 100), 14);
  ctx.strokeStyle = '#f5f1e6';
  ctx.strokeRect(fx0 + 52, fy - 38, 150, 14);
  ctx.fillText('WATER', fx0 + 226, fy - 26);
  for (let i = 0; i < CFG.TANK_DROPS; i++) {
    const dx = fx0 + 292 + i * 26, dy = fy - 31;
    ctx.beginPath();
    ctx.moveTo(dx, dy - 10);
    ctx.quadraticCurveTo(dx + 8, dy + 2, dx, dy + 8);
    ctx.quadraticCurveTo(dx - 8, dy + 2, dx, dy - 10);
    if (G.water >= i + 1) {
      ctx.fillStyle = '#4aa3e8';
      ctx.fill();
    } else {
      ctx.strokeStyle = '#7d8aa0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  // Fires count, bottom right.
  const out = G.fires.filter((f) => !f.alive).length;
  ctx.textAlign = 'right';
  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = '#ffb13e';
  ctx.fillText('FIRES OUT ' + out + ' / ' + G.fires.length, W - 18, H - 66);
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#cfd6e4';
  ctx.fillText('W/S throttle · ←/→ bank · ↑/↓ pitch · SPACE drop · P pause', W - 18, H - 44);
  // Target marker: nearest fire ahead.
  let best = null, bestD = 1e9;
  for (const f of G.fires) {
    if (!f.alive) continue;
    const dx = f.x - G.x, dz = f.z - G.z;
    const d = Math.hypot(dx, dz);
    const ang = Math.atan2(Math.sin(Math.atan2(dx, -dz) - G.heading), Math.cos(Math.atan2(dx, -dz) - G.heading));
    if (Math.abs(ang) < 0.55 && d < bestD) { best = f; bestD = d; }
  }
  if (best) {
    const p = projectPoint(G, best.x, best.z, terrainAt(best.x, best.z).h);
    if (p) {
      const sx = CFG.W / 2 + p.x, sy = CFG.H * 0.42 + G.pitch * 300 + p.y;
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 2;
      const s = 12 + 4 * Math.sin(t * 5);
      ctx.beginPath();
      ctx.moveTo(sx, sy - s); ctx.lineTo(sx + s, sy); ctx.lineTo(sx, sy + s); ctx.lineTo(sx - s, sy);
      ctx.closePath();
      ctx.stroke();
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd23e';
      ctx.fillText('FIRE ' + Math.round(bestD) + ' m', sx, sy - s - 8);
      if (bestD < 260 && G.water >= 1 && G.state === 'playing' && Math.floor(t * 2) % 2 === 0) {
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SPACE — DROP WATER', W / 2, H * 0.30);
      }
    }
  }
  // Messages.
  if (G.messageT > 0 && G.message) {
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10,14,24,0.6)';
    const mw = ctx.measureText(G.message).width + 36;
    ctx.fillRect(W / 2 - mw / 2, H * 0.36 - 32, mw, 40);
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(G.message, W / 2, H * 0.36 - 4);
  }
  if (G.scooping) {
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7fd0ff';
    ctx.fillText('SCOOPING WATER…', W / 2, H * 0.24);
  }
}

function drawMinimap(ctx, G) {
  const mx = CFG.W - 178, my = 62, mw = 160, mh = 112;
  ctx.fillStyle = 'rgba(10,14,24,0.72)';
  ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
  const px = (x) => mx + ((x + 1700) / 3400) * mw;
  const py = (z) => my + ((z + 1500) / 3000) * mh;
  ctx.fillStyle = '#123a5c';
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#3f6b34';
  ctx.beginPath();
  ctx.ellipse(px(0), py(0), (CFG.ISLAND_RX / 3400) * mw, (CFG.ISLAND_RZ / 3000) * mh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f7fb8';
  ctx.beginPath();
  ctx.arc(px(CFG.LAKE.x), py(CFG.LAKE.z), 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a7a66';
  ctx.beginPath();
  ctx.moveTo(px(CFG.VOLCANO.x), py(CFG.VOLCANO.z) - 7);
  ctx.lineTo(px(CFG.VOLCANO.x) + 6, py(CFG.VOLCANO.z) + 5);
  ctx.lineTo(px(CFG.VOLCANO.x) - 6, py(CFG.VOLCANO.z) + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px(CFG.RUNWAY.x - CFG.RUNWAY.len / 2), py(CFG.RUNWAY.z));
  ctx.lineTo(px(CFG.RUNWAY.x + CFG.RUNWAY.len / 2), py(CFG.RUNWAY.z));
  ctx.stroke();
  for (const f of G.fires) {
    if (!f.alive) continue;
    ctx.fillStyle = Math.floor(G.time * 3) % 2 === 0 ? '#ff5a2a' : '#ffb13e';
    ctx.beginPath();
    ctx.arc(px(f.x), py(f.z), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // The plane.
  ctx.save();
  ctx.translate(px(G.x), py(G.z));
  ctx.rotate(G.heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawScreens(ctx, G) {
  const W = CFG.W, H = CFG.H;
  ctx.textAlign = 'center';
  if (G.state === 'title') {
    ctx.fillStyle = 'rgba(8,10,20,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 84px monospace';
    ctx.fillText('BARA LANGIT', W / 2, H * 0.30);
    ctx.fillStyle = '#f5f1e6';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('WILDFIRE AIR TANKER — PULAU ARANG AT DUSK', W / 2, H * 0.30 + 44);
    ctx.font = '19px monospace';
    ctx.fillStyle = '#e8e0cc';
    ctx.fillText('Eight fires are burning across the island. Scoop water from the sea,', W / 2, H * 0.46);
    ctx.fillText('drop it on the flames, and put them all out before the clock runs out.', W / 2, H * 0.46 + 26);
    ctx.fillText('Land on the runway to refuel. Mind the volcano.', W / 2, H * 0.46 + 52);
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#7fd0ff';
    ctx.fillText('W / S throttle    ← / → bank    ↑ / ↓ pitch    SPACE drop water    P pause    M mute', W / 2, H * 0.60);
    if (Math.floor(G.time * 1.6) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('ENTER or CLICK — FLY THE SORTIE', W / 2, H * 0.70);
    }
    ctx.font = '14px monospace';
    ctx.fillStyle = '#9aa5b8';
    ctx.fillText('A complete flight game: chase view over a volcanic island, lit instruments,', W / 2, H * 0.82);
    ctx.fillText('runway landings, fuel and water decisions, 180 seconds to save the island.', W / 2, H * 0.82 + 20);
  } else if (G.state === 'win') {
    ctx.fillStyle = 'rgba(8,20,10,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('ALL FIRES OUT', W / 2, H * 0.38);
    ctx.fillStyle = '#f5f1e6';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('THE ISLAND IS SAFE — SCORE ' + G.score.toLocaleString('en-US'), W / 2, H * 0.38 + 44);
    ctx.fillText('time bonus +' + G.winBonus, W / 2, H * 0.38 + 76);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ENTER — FLY AGAIN', W / 2, H * 0.55);
  } else if (G.state === 'lose') {
    ctx.fillStyle = 'rgba(20,8,8,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff6b4a';
    ctx.font = 'bold 64px monospace';
    ctx.fillText(G.crashReason || 'TIME UP', W / 2, H * 0.38);
    ctx.fillStyle = '#f5f1e6';
    ctx.font = 'bold 24px monospace';
    const out = G.fires.filter((f) => !f.alive).length;
    ctx.fillText('Fires out ' + out + ' of ' + G.fires.length + ' — score ' + G.score.toLocaleString('en-US'), W / 2, H * 0.38 + 44);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ENTER — TRY AGAIN', W / 2, H * 0.55);
  } else if (G.state === 'crash') {
    ctx.fillStyle = 'rgba(20,8,8,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff6b4a';
    ctx.font = 'bold 56px monospace';
    ctx.fillText(G.crashReason || 'CRASHED', W / 2, H * 0.38);
    ctx.fillStyle = '#f5f1e6';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('SCORE ' + G.score.toLocaleString('en-US'), W / 2, H * 0.38 + 44);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ENTER — TRY AGAIN', W / 2, H * 0.55);
  }
}

// One frame. The world (sky, ground, volcano, runway, fires, drops) is
// drawn rolled with the bank around the horizon point; the plane and the
// instruments stay level in the frame.
function render(ctx, G, t) {
  const W = CFG.W, H = CFG.H;
  const horizonY = H * 0.42 + G.pitch * 300;
  ctx.save();
  ctx.translate(W / 2, horizonY);
  ctx.rotate(-G.roll * 0.6);
  ctx.translate(-W / 2, -horizonY);
  drawSky(ctx, G, t);
  ctx.save();
  ctx.translate(W / 2, horizonY);
  drawGround(ctx, G);
  drawVolcano(ctx, G, t);
  drawRunway(ctx, G);
  drawFires(ctx, G, t);
  drawDrops(ctx, G);
  ctx.restore();
  ctx.restore();
  drawPlane(ctx, G, t);
  drawHUD(ctx, G, t);
  drawScreens(ctx, G);
}
