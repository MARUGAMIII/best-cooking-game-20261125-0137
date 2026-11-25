// Keyboard and mouse input. Movement keys give a direction vector; the
// interact key (E / Space) and clicks on stations are delivered as actions
// the world consumes once. Clicking a station also walks the chef there and
// interacts on arrival.

export const ACTION_CONFIRM = 1;
export const ACTION_INTERACT = 2;
export const ACTION_PAUSE = 4;

const MOVE_KEYS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  /** Where a click asked the chef to walk, in logical (game) coordinates, or null. */
  let clickTarget = null;
  /** The station id a click asked to use on arrival, or null. */
  let clickStation = null;
  /** Logical size of the canvas, for mapping clicks onto game coordinates. */
  let logical = { width: 1280, height: 720 };

  function onKeyDown(event) {
    if (MOVE_KEYS[event.code]) {
      held.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      actions |= ACTION_INTERACT;
      event.preventDefault();
    } else if (event.code === 'Enter' || event.code === 'KeyR') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = logical.width / rect.width;
    const scaleY = logical.height / rect.height;
    clickTarget = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    clickStation = null;
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    setLogicalSize(width, height) {
      logical = { width, height };
    },

    /** The movement direction from held keys, normalised. */
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const vector = MOVE_KEYS[code];
        if (vector) {
          x += vector.x;
          y += vector.y;
        }
      }
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const length = Math.hypot(x, y);
      return { x: x / length, y: y / length };
    },

    /** Actions pressed since the last call; each is delivered once. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },

    /** The click target since the last call, or null. */
    takeClick() {
      const taken = clickTarget;
      clickTarget = null;
      return taken;
    },

    /** Ask the chef to walk to a station and use it on arrival. */
    requestStation(stationId) {
      clickStation = stationId;
    },

    /** The station a click asked to use, or null. */
    takeClickStation() {
      const taken = clickStation;
      clickStation = null;
      return taken;
    },

    clearClick() {
      clickTarget = null;
      clickStation = null;
    },
  };
}
