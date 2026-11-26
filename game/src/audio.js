// audio.js: every sound the game makes is synthesised with WebAudio —
// an engine drone, a drop whoosh, a fire-out chime, alarms and a win
// jingle. No audio files, no network, nothing to load.

import { makeRng } from './random.js';

let actx = null;
let engineOsc = null;
let engineGain = null;
export let muted = false;

export function ensureAudio() {
  if (actx) {
    if (actx.state === 'suspended') actx.resume();
    return;
  }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = actx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    engineGain = actx.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(actx.destination);
    engineOsc.start();
  } catch (e) {
    actx = null; // headless or silent: the game plays on without sound
  }
}

// The engine follows the throttle: louder and higher as she spools up.
export function engineSound(throttle, speed) {
  if (!actx || !engineGain) return;
  const target = muted ? 0 : 0.015 + throttle * 0.045 + speed * 0.0002;
  engineGain.gain.setTargetAtTime(target, actx.currentTime, 0.1);
  engineOsc.frequency.setTargetAtTime(48 + throttle * 55 + speed * 0.25, actx.currentTime, 0.1);
}

function blip(freq, dur, type, vol, when) {
  if (!actx || muted) return;
  const t = actx.currentTime + (when || 0);
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(actx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol, freq) {
  if (!actx || muted) return;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const data = buf.getChannelData(0);
  // Seeded noise, not Math.random: the game stays deterministic.
  const rng = makeRng(99);
  for (let i = 0; i < len; i++) data[i] = (rng() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource();
  src.buffer = buf;
  const filter = actx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq || 900;
  const g = actx.createGain();
  g.gain.value = vol || 0.2;
  src.connect(filter);
  filter.connect(g);
  g.connect(actx.destination);
  src.start();
}

export function soundDrop() { noiseBurst(0.5, 0.25, 1400); }
export function soundScoop() { blip(520, 0.25, 'sine', 0.1); blip(780, 0.3, 'sine', 0.1, 0.12); }
export function soundFireOut() { blip(660, 0.18, 'sine', 0.14); blip(990, 0.3, 'sine', 0.14, 0.1); }
export function soundAlarm() { blip(440, 0.16, 'square', 0.06); blip(440, 0.16, 'square', 0.06, 0.22); }
export function soundWin() {
  blip(523, 0.22, 'sine', 0.14);
  blip(659, 0.22, 'sine', 0.14, 0.16);
  blip(784, 0.4, 'sine', 0.16, 0.32);
}
export function soundCrash() { noiseBurst(0.9, 0.35, 500); blip(90, 0.7, 'sawtooth', 0.16); }
