// input.js: keyboard and mouse. The game is played with both: keys fly
// the plane, a click (or Enter) starts and restarts a sortie.

export const KEYS = {
  w: false, s: false,
  arrowleft: false, arrowright: false, arrowup: false, arrowdown: false,
};

const pressed = {};
let clicked = false;

const KEYMAP = {
  KeyW: 'w', KeyS: 's',
  ArrowLeft: 'arrowleft', ArrowRight: 'arrowright',
  ArrowUp: 'arrowup', ArrowDown: 'arrowdown',
};

export function bindInput() {
  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.code] !== undefined) {
      KEYS[KEYMAP[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'Space') { pressed[' '] = true; e.preventDefault(); }
    if (e.code === 'Enter') pressed.enter = true;
    if (e.code === 'KeyP') pressed.p = true;
    if (e.code === 'KeyM') pressed.m = true;
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code] !== undefined) KEYS[KEYMAP[e.code]] = false;
    if (e.code === 'Space') pressed[' '] = false;
  });
  window.addEventListener('mousedown', () => { clicked = true; });
}

// One-shot presses: true once per physical press, then consumed.
export function consumePress(name) {
  if (!pressed[name]) return false;
  pressed[name] = false;
  return true;
}

export function consumeClick() {
  if (!clicked) return false;
  clicked = false;
  return true;
}
