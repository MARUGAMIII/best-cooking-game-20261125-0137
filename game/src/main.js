// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=cover|rush|serve|title (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, STATIONS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_PAUSE, createInput } from './input.js';
import { unlockAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;
/** How close the chef must get to a click target before it is forgotten. */
const CLICK_ARRIVE = 12;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const input = createInput(canvas);
input.setLogicalSize(1280, 720);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// Exposed for play-testing in a headless browser: the live state, the screen
// and the helpers a test drives. Part of the game, not a cheat: nothing here
// changes the rules.
window.__game = {
  world,
  get screen() {
    return currentScreen;
  },
  state: world.state,
};

let currentScreen = SCREEN_TITLE;
let best = readBest();
let clickTarget = null;
let clickStationId = null;

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  world.reset();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.startShift();
    accumulator = 0;
    clickTarget = null;
    clickStationId = null;
    currentScreen = SCREEN_PLAY;
    announce('Playing. Serve dishes before the tickets walk out.');
  }

  function endGame() {
    currentScreen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(
      world.state.won
        ? `Shift complete! ${world.state.coins} coins, ${world.state.served} dishes served.`
        : `Shift over. ${world.state.coins} coins, ${world.state.served} dishes served.`,
    );
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (currentScreen === SCREEN_TITLE || currentScreen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_INTERACT && currentScreen === SCREEN_TITLE) {
      startGame();
    } else if (actions & ACTION_INTERACT && currentScreen === SCREEN_PLAY) {
      // E / Space uses the nearest station right now.
      world.step(0, { x: 0, y: 0 }, true, null);
    } else if (actions & ACTION_PAUSE && currentScreen === SCREEN_PLAY) {
      currentScreen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM | ACTION_INTERACT) && currentScreen === SCREEN_PAUSED) {
      currentScreen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function handleClicks() {
    const click = input.takeClick();
    if (click) {
      unlockAudio();
      if (currentScreen === SCREEN_TITLE || currentScreen === SCREEN_OVER) {
        startGame();
        return;
      }
      if (currentScreen !== SCREEN_PLAY) return;
      // A click on a station walks there and uses it; anywhere else just walks.
      const hit = stationAtPoint(click.x, click.y);
      if (hit) {
        clickStationId = hit.id;
        clickTarget = { ...hit.front };
      } else {
        clickStationId = null;
        clickTarget = { x: click.x, y: click.y };
      }
    }
  }

  // Which station (if any) covers this logical point.
  function stationAtPoint(x, y) {
    for (const station of STATIONS) {
      const { at } = station;
      if (x >= at.x && x <= at.x + at.w && y >= at.y && y <= at.y + at.h) return station;
    }
    return null;
  }

  function step() {
    const events = world.step(STEP, input.direction(), false, clickTarget);
    if (clickTarget) {
      const distance = Math.hypot(clickTarget.x - world.state.chef.x, clickTarget.y - world.state.chef.y);
      if (distance < CLICK_ARRIVE) {
        clickTarget = null;
        if (clickStationId) {
          const stationId = clickStationId;
          clickStationId = null;
          // Arrived: use the station once, as if E had been pressed.
          world.step(0, { x: 0, y: 0 }, true, null);
          void stationId;
        }
      }
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    if (currentScreen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    const highlight = currentScreen === SCREEN_PLAY ? nearestStationId() : null;
    renderer.draw(world.state, currentScreen, best, highlight);
  }

  function nearestStationId() {
    const station = world.nearestStation();
    return station ? station.id : null;
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentScreen === SCREEN_PLAY) {
      currentScreen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle Rush. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
