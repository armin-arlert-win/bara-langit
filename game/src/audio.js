// audio.js: every sound is a WebAudio synth — no audio files, no network.
// The context only starts after a real user gesture, so headless runs and
// screenshot captures stay silent and deterministic.

let actx = null;
let engineOsc = null;
let engineGain = null;
let muted = false;

function ensureAudio() {
  if (actx || muted) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = actx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    const filt = actx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 320;
    engineGain = actx.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(filt).connect(engineGain).connect(actx.destination);
    engineOsc.start();
  } catch (err) {
    actx = null; // no audio device: the game plays on silently.
  }
}

function engineSound(throttle, speed) {
  if (!actx || !engineOsc) return;
  const target = muted ? 0 : 0.015 + throttle * 0.05 + speed * 0.00012;
  engineGain.gain.setTargetAtTime(target, actx.currentTime, 0.1);
  engineOsc.frequency.setTargetAtTime(48 + throttle * 55 + speed * 0.35, actx.currentTime, 0.1);
}

function blip(freq, dur, type, vol) {
  if (!actx || muted) return;
  try {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start();
    o.stop(actx.currentTime + dur);
  } catch (err) { /* silent */ }
}

function noiseBurst(dur, vol) {
  if (!actx || muted) return;
  try {
    const len = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const g = actx.createGain();
    g.gain.value = vol || 0.2;
    src.connect(g).connect(actx.destination);
    src.start();
  } catch (err) { /* silent */ }
}

function soundDrop() { noiseBurst(0.7, 0.25); blip(220, 0.4, 'sine', 0.08); }
function soundFireOut() { blip(660, 0.12, 'sine', 0.14); setTimeout(() => blip(880, 0.18, 'sine', 0.14), 110); }
function soundAlarm() { blip(440, 0.25, 'square', 0.07); }
function soundWin() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle', 0.14), i * 140)); }
function soundCrash() { noiseBurst(0.9, 0.3); blip(90, 0.8, 'sawtooth', 0.15); }
