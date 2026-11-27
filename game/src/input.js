// Keyboard + mouse. One job: what the pilot is holding right now.
const Input = (() => {
  const keys = {};
  let anyKey = null;
  function onKey(e, down) {
    keys[e.code] = down;
    if (down) anyKey = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  return {
    get throttleUp() { return keys.KeyW || keys.ArrowUp; },
    get throttleDown() { return keys.KeyS || keys.ArrowDown; },
    get bankLeft() { return keys.ArrowLeft || keys.KeyA; },
    get bankRight() { return keys.ArrowRight || keys.KeyD; },
    get pitchUp() { return keys.KeyI; },
    get pitchDown() { return keys.KeyK; },
    get drop() { return keys.Space; },
    get pause() { return keys.KeyP; },
    get mute() { return keys.KeyM; },
    get confirm() { return keys.Enter; },
    takeAnyKey() { const k = anyKey; anyKey = null; return k; },
    consume(code) { keys[code] = false; },
  };
})();
