// BARA LANGIT v3 — the instruments. One job: HUD, lit dials, minimap, the
// visible objective checklist, and the title / win / lose screens.
const Hud = (() => {
  const C = CFG, D2R = Math.PI / 180;
  let cv = null, ctx = null;
  function init(canvas) { cv = canvas; ctx = canvas.getContext('2d'); }
  function fmtTime(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  function pill(x, y, w, h, fill) {
    ctx.fillStyle = fill || 'rgba(8,10,18,0.72)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
  }
  function dial(cx, cy, r, label, valueText, frac, tickLabels) {
    // a round, lit instrument: dark face, glowing rim, bright needle
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
    ctx.fillStyle = '#0e1420'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    g.addColorStop(0, '#1a2436'); g.addColorStop(1, '#0a0e18');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3d5a80'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,217,74,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, r - 2, -0.6, 0.6); ctx.stroke();
    ctx.fillStyle = '#e8eef7';
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    for (let i = 0; i < tickLabels.length; i++) {
      const a = (-210 + i * (300 / (tickLabels.length - 1))) * D2R;
      const tx = cx + Math.sin(a) * (r - 12), ty = cy - Math.cos(a) * (r - 12) + 4;
      ctx.fillText(tickLabels[i], tx, ty);
    }
    // needle
    const na = (-210 + frac * 300) * D2R;
    ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(na) * (r - 14), cy - Math.cos(na) * (r - 14)); ctx.stroke();
    ctx.fillStyle = '#ffd94a'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c8d2e0'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + r + 15);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px monospace';
    ctx.fillText(valueText, cx, cy + r + 32);
  }
  function attitude(cx, cy, r, bank, pitch) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(bank * D2R);
    ctx.translate(0, pitch * 1.6);
    ctx.fillStyle = '#3f7fd0'; ctx.fillRect(-r, -r * 2, r * 2, r * 2);
    ctx.fillStyle = '#7a5230'; ctx.fillRect(-r, 0, r * 2, r * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#3d5a80'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    // fixed wings
    ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - r + 8, cy); ctx.lineTo(cx - 8, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + r - 8, cy); ctx.stroke();
    ctx.fillStyle = '#c8d2e0'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ATTITUDE', cx, cy + r + 15);
  }
  function compassStrip(S) {
    const cx = C.W / 2, y = 52;
    pill(cx - 210, y, 420, 30, 'rgba(8,10,18,0.72)');
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - 210, y, 420, 30); ctx.clip();
    ctx.fillStyle = '#e8eef7'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
    for (let d = -60; d <= 60; d += 15) {
      const h = (Math.round(S.hdg / 15) * 15 + d + 360) % 360;
      const x = cx + d * 3;
      const lab = h === 0 ? 'N' : h === 90 ? 'E' : h === 180 ? 'S' : h === 270 ? 'W' : (h % 30 === 0 ? String(h) : '');
      if (lab) ctx.fillText(lab, x, y + 21);
      ctx.fillRect(x, y + 24, 1, 5);
    }
    ctx.restore();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.moveTo(cx, y + 2); ctx.lineTo(cx - 6, y - 6); ctx.lineTo(cx + 6, y - 6); ctx.closePath(); ctx.fill();
  }
  function minimap(S) {
    const mx = C.W - 218, my = C.H - 158, mw = 200, mh = 132;
    pill(mx - 8, my - 8, mw + 16, mh + 16, 'rgba(8,10,18,0.78)');
    ctx.save();
    ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
    ctx.fillStyle = '#274a6e'; ctx.fillRect(mx, my, mw, mh);
    ctx.fillStyle = '#4a7a3f';
    ctx.beginPath(); ctx.ellipse(mx + mw / 2, my + mh / 2, mw * 0.44, mh * 0.44, 0, 0, 7); ctx.fill();
    const px = (x) => mx + mw / 2 + (x / C.islandR) * (mw * 0.44);
    const pz = (z) => my + mh / 2 + (z / C.islandR) * (mh * 0.44);
    // lake + volcano + runway
    ctx.fillStyle = '#4a7fa5';
    ctx.beginPath(); ctx.ellipse(px(C.lake.x), pz(C.lake.z), 14, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#c65a24';
    ctx.beginPath(); ctx.moveTo(px(C.volcano.x), pz(C.volcano.z) - 8);
    ctx.lineTo(px(C.volcano.x) - 8, pz(C.volcano.z) + 6); ctx.lineTo(px(C.volcano.x) + 8, pz(C.volcano.z) + 6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px(C.runway.x - C.runway.len / 2), pz(C.runway.z));
    ctx.lineTo(px(C.runway.x + C.runway.len / 2), pz(C.runway.z)); ctx.stroke();
    // fires
    for (const f of S.fires) {
      if (!f.alive) continue;
      ctx.fillStyle = f.kind === 'town' ? '#ff9a3c' : '#ff3b30';
      ctx.beginPath(); ctx.arc(px(f.x), pz(f.z), 3.5, 0, 7); ctx.fill();
    }
    // plane
    ctx.fillStyle = '#fff';
    ctx.save(); ctx.translate(px(S.x), pz(S.z)); ctx.rotate(S.hdg * D2R);
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function checklist(S) {
    const forestDone = !S.fires.some((f) => f.alive && f.kind === 'forest');
    const townDone = !S.fires.some((f) => f.alive && f.kind === 'town');
    const forestN = S.fires.filter((f) => f.kind === 'forest' && !f.alive).length;
    const forestTotal = S.fires.filter((f) => f.kind === 'forest').length;
    const townN = S.fires.filter((f) => f.kind === 'town' && !f.alive).length;
    const townTotal = S.fires.filter((f) => f.kind === 'town').length;
    const rows = [
      { done: forestDone, text: 'FOREST FIRES  ' + forestN + '/' + forestTotal, on: S.phase === 1 },
      { done: townDone, text: 'TOWN FIRES  ' + townN + '/' + townTotal, on: S.phase === 2 },
      { done: S.mode === 'win', text: 'LAND ON RUNWAY', on: S.phase === 3 },
    ];
    const x = C.W - 218, y = C.H - 300;
    pill(x - 8, y - 8, 216, 118, 'rgba(8,10,18,0.72)');
    ctx.textAlign = 'left'; ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffd94a'; ctx.fillText('SORTIE  ' + S.phase + '/3', x, y + 16);
    rows.forEach((r, i) => {
      const ry = y + 44 + i * 26;
      ctx.fillStyle = r.done ? '#34d17b' : (r.on ? '#ffd94a' : '#8a94a6');
      ctx.fillText((r.done ? '✓ ' : '○ ') + r.text, x, ry);
    });
  }
  function draw(S) {
    if (S.mode === 'title') { drawTitle(S); return; }
    // --- top bar ---
    pill(0, 0, C.W, 46, 'rgba(8,10,18,0.8)');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 21px monospace'; ctx.textAlign = 'left';
    ctx.fillText('ALT ' + Math.round(S.alt) + ' m    SPD ' + Math.round(S.speed) + ' km/h    HDG ' + String(Math.round(S.hdg)).padStart(3, '0') + '°', 18, 31);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 26px monospace';
    ctx.fillText(fmtTime(S.timeLeft), C.W / 2, 27);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace';
    ctx.fillText('SCORE ' + S.score.toLocaleString('en-US'), C.W / 2, 44 - 2);
    const phaseNames = { 1: 'PHASE 1/3 — FOREST', 2: 'PHASE 2/3 — TOWN', 3: 'PHASE 3/3 — LANDING' };
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 17px monospace';
    ctx.fillText(phaseNames[S.phase] || '', C.W - 18, 30);
    compassStrip(S);
    // --- message banner ---
    if (S.messageT > 0 && S.message) {
      ctx.font = 'bold 24px monospace';
      const w = ctx.measureText(S.message).width + 44;
      pill(C.W / 2 - w / 2, C.H * 0.24, w, 44, 'rgba(8,10,18,0.78)');
      ctx.fillStyle = '#ffd94a'; ctx.textAlign = 'center';
      ctx.fillText(S.message, C.W / 2, C.H * 0.24 + 30);
    }
    // --- bottom-left dial panel ---
    pill(14, C.H - 168, 430, 154, 'rgba(8,10,18,0.72)');
    dial(70, C.H - 112, 40, 'ALT', Math.round(S.alt) + ' m', Math.min(1, S.alt / 500), ['0', '125', '250', '375', '500']);
    dial(168, C.H - 112, 40, 'SPD', Math.round(S.speed) + '', Math.min(1, S.speed / 340), ['0', '85', '170', '255', '340']);
    dial(266, C.H - 112, 40, 'HDG', String(Math.round(S.hdg)).padStart(3, '0') + '°', S.hdg / 360, ['N', 'E', 'S', 'W']);
    attitude(366, C.H - 112, 40, S.bank, S.pitch);
    // throttle bar on the panel's right edge
    ctx.fillStyle = '#20242c'; ctx.fillRect(424, C.H - 152, 10, 122);
    ctx.fillStyle = '#34d17b'; ctx.fillRect(424, C.H - 152 + (1 - S.throttle) * 122, 10, S.throttle * 122);
    ctx.fillStyle = '#c8d2e0'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('THR', 429, C.H - 160 + 0);
    // --- bottom-centre: fuel / water / wind ---
    const cx = C.W / 2;
    pill(cx - 220, C.H - 52, 440, 38, 'rgba(8,10,18,0.72)');
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
    ctx.fillText('FUEL', cx - 208, C.H - 27);
    ctx.fillStyle = '#20242c'; ctx.fillRect(cx - 156, C.H - 40, 130, 15);
    ctx.fillStyle = S.fuel < 25 ? '#ff3b30' : '#ff9a1f';
    ctx.fillRect(cx - 156, C.H - 40, 130 * (S.fuel / 100), 15);
    ctx.fillStyle = '#fff'; ctx.fillText('WATER', cx - 14, C.H - 27);
    for (let i = 0; i < C.waterMax; i++) {
      const dx = cx + 62 + i * 22;
      ctx.fillStyle = i < S.water ? '#4db2f2' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(dx, C.H - 33, 7, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(dx, C.H - 44); ctx.lineTo(dx - 5, C.H - 34); ctx.lineTo(dx + 5, C.H - 34); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#c8d2e0';
    ctx.fillText('WIND ' + C.windFrom + '° ' + Math.round(C.windSpeed + S.windGust) + ' kt', cx + 132, C.H - 27);
    // --- bottom-right: checklist + minimap + fires count ---
    checklist(S);
    minimap(S);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 19px monospace';
    const total = S.fires.length;
    ctx.fillText('FIRES OUT ' + S.firesOut + ' / ' + total, C.W - 18, C.H - 168);
    ctx.fillStyle = '#8a94a6'; ctx.font = '13px monospace';
    ctx.fillText('W/S throttle · ←/→ bank · I/K pitch · SPACE drop · P pause', C.W - 18, C.H - 8);
    if (S.mode === 'win' || S.mode === 'lose' || S.mode === 'crash') drawEnd(S);
  }
  function drawTitle(S) {
    ctx.fillStyle = 'rgba(8,10,18,0.45)'; ctx.fillRect(0, 0, C.W, C.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 84px monospace';
    ctx.fillText('BARA LANGIT', C.W / 2, 220);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px monospace';
    ctx.fillText('WILDFIRE AIR TANKER — PULAU ARANG AT DUSK', C.W / 2, 268);
    ctx.font = '19px monospace'; ctx.fillStyle = '#dfe6f2';
    ctx.fillText('PHASE 1 — put out 6 forest fires   ·   PHASE 2 — 2 town fires burn hotter', C.W / 2, 330);
    ctx.fillText('PHASE 3 — precision landing on the runway   ·   scoop water low over sea or lake', C.W / 2, 362);
    ctx.fillText('Fuel runs out: land on the runway to refuel. Fires spread while the clock runs.', C.W / 2, 394);
    ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 24px monospace';
    ctx.fillText('ENTER or CLICK — FLY THE SORTIE', C.W / 2, 470);
    ctx.fillStyle = '#9aa6b8'; ctx.font = '16px monospace';
    ctx.fillText('W/S throttle · ←/→ bank · I/K pitch · SPACE drop water · P pause · M mute', C.W / 2, 512);
  }
  function drawEnd(S) {
    const win = S.mode === 'win';
    ctx.fillStyle = win ? 'rgba(20,26,12,0.45)' : 'rgba(10,8,12,0.62)';
    ctx.fillRect(0, 0, C.W, C.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = win ? '#ffd94a' : '#ff6a4a';
    ctx.font = 'bold 64px monospace';
    ctx.fillText(win ? 'ALL FIRES OUT' : S.endReason, C.W / 2, 300);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px monospace';
    ctx.fillText(win ? 'THE ISLAND IS SAFE — ' + S.endReason : S.endDetail, C.W / 2, 352);
    if (win) {
      ctx.font = 'bold 22px monospace'; ctx.fillStyle = '#dfe6f2';
      ctx.fillText('SCORE ' + S.score.toLocaleString('en-US') + '   ·   time bonus +' + S.timeBonus + '   ·   landing +' + S.landBonus, C.W / 2, 398);
    }
    ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 22px monospace';
    ctx.fillText('ENTER — FLY AGAIN', C.W / 2, 470);
  }
  return { init, draw };
})();
