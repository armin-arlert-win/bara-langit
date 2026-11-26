// input.js: keyboard and mouse, one place. Keys are read by name so the
// world never touches the DOM event itself.

const KEYS = {};
const MOUSE = { clicked: false, x: 0, y: 0 };

function bindInput() {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    KEYS[e.key.toLowerCase()] = true;
    if (e.key === 'Enter') KEYS.enter = true;
  });
  window.addEventListener('keyup', (e) => {
    KEYS[e.key.toLowerCase()] = false;
  });
  window.addEventListener('mousedown', (e) => {
    MOUSE.clicked = true;
    MOUSE.x = e.clientX;
    MOUSE.y = e.clientY;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(KEYS)) KEYS[k] = false;
  });
}

// Read once per frame, then cleared — a press is one action, not a hold.
function consumePress(name) {
  if (KEYS[name]) {
    KEYS[name] = false;
    return true;
  }
  return false;
}
function consumeClick() {
  if (MOUSE.clicked) {
    MOUSE.clicked = false;
    return true;
  }
  return false;
}
