// WebAudio synth. One job: every sound is made in code — engine, drop, chime, alarms.
const AudioSys = (() => {
  let ctx = null, engineOsc = null, engineGain = null, muted = false;
  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420;
      engineOsc.connect(lp); lp.connect(engineGain); engineGain.connect(ctx.destination);
      engineOsc.start();
      return true;
    } catch (e) { return false; }
  }
  function blip(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  return {
    unlock() { ensure(); },
    engine(throttle, speed) {
      if (!ensure() || muted) { if (engineGain) engineGain.gain.value = 0; return; }
      engineOsc.frequency.value = 52 + throttle * 55 + speed * 0.12;
      engineGain.gain.value = 0.015 + throttle * 0.035;
    },
    drop() { blip(900, 0.35, 'sine', 0.14, 180); },
    scoop() { blip(300, 0.3, 'sine', 0.12, 620); },
    fireOut() { blip(660, 0.12, 'triangle', 0.14); setTimeout(() => blip(990, 0.2, 'triangle', 0.14), 110); },
    alarm() { blip(440, 0.16, 'square', 0.07, 330); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle', 0.13), i * 130)); },
    crash() { blip(160, 0.5, 'sawtooth', 0.16, 40); },
    toggleMute() { muted = !muted; return muted; },
  };
})();
