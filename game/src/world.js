// The world: the chef, the stations, the food in hand and on the stoves, the
// plate being built, the orders on the board, the shift clock and the score.
// One fixed-step update per call; the renderer only reads this state.
//
// An ingredient item is { id, chopped, cooked, burnt }. A finished ingredient
// is named by its key: `id`, `id:chopped`, `id:cooked` or `id:chopped:cooked` —
// the same keys the recipes in config.js use, so matching a plate to a ticket
// is a plain list comparison.

import {
  BASE_REWARD,
  BURN_SECONDS,
  CHEF,
  CHOP_SECONDS,
  COOK_SECONDS,
  FIELD,
  FLOOR,
  HEARTS,
  INGREDIENTS,
  LEVEL_SECONDS,
  MAX_LEVEL,
  MAX_ORDERS,
  ORDER_PATIENCE,
  RECIPES,
  SHIFT_SECONDS,
  STATIONS,
  TARGET_COINS,
} from './config.js';
import { createOrder, findMatchingOrder, serveValue, spawnInterval, tickOrders } from './orders.js';
import { playSound } from './audio.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_LEVEL = 8;

const NEAR_DISTANCE = 96;

/** The key a recipe uses for a finished ingredient item. */
export function itemKey(item) {
  let key = item.id;
  if (item.chopped) key += ':chopped';
  if (item.cooked) key += ':cooked';
  return key;
}

/** Can the chopping board work on this item? */
export function isChoppable(item) {
  return !item.chopped && !item.burnt && INGREDIENTS[item.id].chop;
}

/** Can a stove cook this item? */
export function isCookable(item) {
  return !item.cooked && !item.burnt && INGREDIENTS[item.id].cook;
}

function cookTimeFor(item) {
  return INGREDIENTS[item.id].cookSeconds ?? COOK_SECONDS;
}

function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

function clampToFloor(x, y) {
  return {
    x: Math.min(FLOOR.x + FLOOR.w - CHEF.radius, Math.max(FLOOR.x + CHEF.radius, x)),
    y: Math.min(FLOOR.y + FLOOR.h - CHEF.radius, Math.max(FLOOR.y + CHEF.radius, y)),
  };
}

export function createWorld(random) {
  /** Ids for tickets the screenshot scenes stage (real tickets start at 1). */
  let nextStagedOrderId = 1000;
  const state = {
    random,
    chef: { x: FIELD.width / 2, y: 470, facing: 1, moving: false, walkPhase: 0 },
    carry: [],
    stoves: [
      { item: null, progress: 0, done: false, burnt: false },
      { item: null, progress: 0, done: false, burnt: false },
    ],
    plate: [],
    orders: [],
    coins: 0,
    served: 0,
    hearts: HEARTS,
    level: 1,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnTimer: 4,
    chopping: null,
    sizzleTimer: 0,
    message: '',
    messageTimer: 0,
    floaters: [],
    over: false,
    won: false,
    started: false,
  };

  function showMessage(text, seconds) {
    state.message = text;
    state.messageTimer = seconds || 2;
  }

  function addFloater(x, y, text, colour) {
    state.floaters.push({ x, y, text, colour: colour || '#f2c94c', life: 1.4 });
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const order = createOrder(
      random,
      state.level,
      1,
      state.orders.map((open) => open.recipe.id),
    );
    state.orders.push(order);
    playSound('new-order');
    showMessage(`New order: ${order.recipe.name}!`, 1.6);
  }

  function nearestStation() {
    let best = null;
    let bestDistance = NEAR_DISTANCE;
    for (const station of STATIONS) {
      const dx = state.chef.x - station.front.x;
      const dy = state.chef.y - station.front.y;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = station;
      }
    }
    return best;
  }

  function firstCarried(predicate) {
    for (let index = 0; index < state.carry.length; index += 1) {
      if (predicate(state.carry[index])) return index;
    }
    return -1;
  }

  function interact() {
    const station = nearestStation();
    if (!station) return;
    const chef = state.chef;

    if (station.kind === 'crate') {
      if (state.carry.length >= CHEF.carryMax) {
        showMessage('Hands full! Serve or plate something first.', 1.6);
        playSound('error');
        return;
      }
      state.carry.push({ id: station.item, chopped: false, cooked: false, burnt: false });
      playSound('pickup');
      return;
    }

    if (station.kind === 'board') {
      const index = firstCarried(isChoppable);
      if (index === -1) {
        showMessage('Bring something to chop: chicken or veggie.', 1.8);
        playSound('error');
        return;
      }
      if (state.chopping) return;
      state.chopping = { item: state.carry[index], progress: 0, carryIndex: index };
      playSound('chop');
      return;
    }

    if (station.kind === 'stove') {
      const stove = state.stoves[station.slot];
      if (stove.item) {
        if (stove.done && !stove.burnt) {
          if (state.carry.length >= CHEF.carryMax) {
            showMessage('Hands full! Free a hand first.', 1.6);
            playSound('error');
            return;
          }
          state.carry.push(stove.item);
          state.stoves[station.slot] = { item: null, progress: 0, done: false, burnt: false };
          playSound('pickup');
        } else if (stove.burnt) {
          showMessage('Burnt! Take it to the trash.', 1.8);
          if (state.carry.length < CHEF.carryMax) {
            state.carry.push(stove.item);
            state.stoves[station.slot] = { item: null, progress: 0, done: false, burnt: false };
            playSound('pickup');
          } else {
            playSound('error');
          }
        } else {
          showMessage('Still cooking… watch the ring!', 1.2);
        }
        return;
      }
      const index = firstCarried(isCookable);
      if (index === -1) {
        showMessage('Bring something to cook: rice, noodle, chicken or egg.', 1.8);
        playSound('error');
        return;
      }
      const item = state.carry.splice(index, 1)[0];
      state.stoves[station.slot] = { item, progress: 0, done: false, burnt: false };
      playSound('sizzle');
      return;
    }

    if (station.kind === 'plate') {
      if (state.carry.length === 0) {
        showMessage('Bring an ingredient to add to the plate.', 1.6);
        playSound('error');
        return;
      }
      if (state.plate.length >= 4) {
        showMessage('The plate is full — serve it or trash it.', 1.6);
        playSound('error');
        return;
      }
      const item = state.carry.shift();
      if (item.burnt) {
        showMessage('Burnt food goes in the trash, not on a plate!', 1.8);
        state.carry.unshift(item);
        playSound('error');
        return;
      }
      state.plate.push(itemKey(item));
      playSound('plate');
      return;
    }

    if (station.kind === 'pass') {
      if (state.plate.length === 0) {
        showMessage('The plate is empty — build a dish first.', 1.6);
        playSound('error');
        return;
      }
      const order = findMatchingOrder(state.plate, state.orders);
      if (!order) {
        showMessage('No ticket wants this dish — check the order board!', 2);
        playSound('error');
        return;
      }
      const value = serveValue(order);
      state.coins += value;
      state.served += 1;
      state.orders = state.orders.filter((open) => open.id !== order.id);
      addFloater(station.front.x, station.front.y - 40, `+${value} coins`, '#f2c94c');
      showMessage(`${order.recipe.name} served! +${value} coins`, 2);
      state.plate = [];
      playSound('serve');
      return { served: true };
    }

    if (station.kind === 'trash') {
      if (state.carry.length === 0 && state.plate.length === 0) {
        showMessage('Nothing to throw away.', 1.2);
        return;
      }
      if (state.carry.length > 0) state.carry.pop();
      else state.plate = [];
      playSound('chop');
      showMessage('Tossed.', 1);
    }
  }

  function updateStoves(dt) {
    for (const stove of state.stoves) {
      if (!stove.item || stove.burnt) continue;
      stove.progress += dt;
      const cookTime = cookTimeFor(stove.item);
      if (!stove.done && stove.progress >= cookTime) {
        stove.done = true;
        stove.item.cooked = true;
        playSound('cooked');
      }
      if (stove.done && stove.progress >= cookTime + BURN_SECONDS) {
        stove.burnt = true;
        stove.item.burnt = true;
        showMessage('Something burned on the stove!', 2);
        playSound('expired');
      }
    }
    const anyCooking = state.stoves.some((stove) => stove.item && !stove.done);
    if (anyCooking) {
      state.sizzleTimer -= dt;
      if (state.sizzleTimer <= 0) {
        playSound('sizzle');
        state.sizzleTimer = 0.9;
      }
    }
  }

  function updateChopping(dt) {
    if (!state.chopping) return;
    const chopping = state.chopping;
    chopping.progress += dt / CHOP_SECONDS;
    if (Math.floor(chopping.progress * 6) !== Math.floor((chopping.progress - dt / CHOP_SECONDS) * 6)) {
      playSound('chop');
    }
    if (chopping.progress >= 1) {
      const item = state.carry[chopping.carryIndex];
      if (item) item.chopped = true;
      state.chopping = null;
      playSound('chop-done');
      showMessage('Chopped!', 1);
    }
  }

  function updateOrders(dt) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer = spawnInterval(state.level);
    }
    const expired = tickOrders(state.orders, dt);
    if (expired.length > 0) {
      state.hearts -= expired.length;
      showMessage(`Order walked out! -${expired.length} heart${expired.length > 1 ? 's' : ''}`, 2.2);
      playSound('expired');
      if (state.hearts <= 0) {
        state.hearts = 0;
        state.over = true;
        state.won = false;
        playSound('lose');
        return EVENT_EXPIRED | EVENT_OVER;
      }
      return EVENT_EXPIRED;
    }
    return 0;
  }

  function updateLevel() {
    const level = Math.min(MAX_LEVEL, 1 + Math.floor(state.elapsed / LEVEL_SECONDS));
    if (level !== state.level) {
      state.level = level;
      showMessage(`Rush level ${level}! Orders come faster.`, 2.4);
      playSound('new-order');
      return EVENT_LEVEL;
    }
    return 0;
  }

  const world = {
    state,

    reset() {
      state.chef = { x: FIELD.width / 2, y: 470, facing: 1, moving: false, walkPhase: 0 };
      state.carry = [];
      state.stoves = [
        { item: null, progress: 0, done: false, burnt: false },
        { item: null, progress: 0, done: false, burnt: false },
      ];
      state.plate = [];
      state.orders = [];
      state.coins = 0;
      state.served = 0;
      state.hearts = HEARTS;
      state.level = 1;
      state.timeLeft = SHIFT_SECONDS;
      state.elapsed = 0;
      state.spawnTimer = 4;
      state.chopping = null;
      state.sizzleTimer = 0;
      state.message = '';
      state.messageTimer = 0;
      state.floaters = [];
      state.over = false;
      state.won = false;
      state.started = true;
      spawnOrder();
      spawnOrder();
    },

    startShift() {
      world.reset();
    },

    /**
     * Advance the world one fixed step. `move` is a normalised direction (or
     * a click target the chef walks toward), `interactNow` presses E.
     * Returns an event bitmask (served / expired / level / over).
     */
    step(dt, move, interactNow, clickTarget) {
      if (state.over) return 0;
      let events = 0;
      state.elapsed += dt;
      state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

      if (state.messageTimer > 0) state.messageTimer -= dt;
      for (let index = state.floaters.length - 1; index >= 0; index -= 1) {
        const floater = state.floaters[index];
        floater.life -= dt;
        floater.y -= 28 * dt;
        if (floater.life <= 0) state.floaters.splice(index, 1);
      }

      // Walking: keys steer directly; a click target is walked toward instead.
      let dx = move.x;
      let dy = move.y;
      if (clickTarget) {
        const toX = clickTarget.x - state.chef.x;
        const toY = clickTarget.y - state.chef.y;
        const distance = Math.hypot(toX, toY);
        if (distance > 10) {
          dx = toX / distance;
          dy = toY / distance;
        } else {
          dx = 0;
          dy = 0;
        }
      }
      state.chef.moving = dx !== 0 || dy !== 0;
      if (state.chef.moving) {
        if (dx !== 0) state.chef.facing = dx > 0 ? 1 : -1;
        const next = clampToFloor(
          state.chef.x + dx * CHEF.speed * dt,
          state.chef.y + dy * CHEF.speed * dt,
        );
        state.chef.x = next.x;
        state.chef.y = next.y;
        state.chef.walkPhase += dt * 10;
      }

      if (interactNow) {
        const result = interact();
        if (result && result.served) events |= EVENT_SERVED;
      }

      updateStoves(dt);
      updateChopping(dt);
      events |= updateOrders(dt);
      events |= updateLevel();

      if (state.timeLeft <= 0 && !state.over) {
        state.over = true;
        state.won = state.coins >= TARGET_COINS;
        playSound(state.won ? 'win' : 'lose');
        events |= EVENT_OVER;
      }
      return events;
    },

    /** The station nearest the chef that an interact would use, or null. */
    nearestStation,

    /** Walk the chef to a station's front and use it on arrival. */
    stationFront(stationId) {
      const station = stationById(stationId);
      return station ? { ...station.front } : null;
    },

    // -- Helpers the screenshot scenes use to stage real game states. --------
    setTimeLeft(seconds) {
      state.elapsed = SHIFT_SECONDS - seconds;
      state.timeLeft = seconds;
    },
    setCoins(coins) {
      state.coins = coins;
    },
    setServed(count) {
      state.served = count;
    },
    setHearts(hearts) {
      state.hearts = hearts;
    },
    placeChef(x, y, facing) {
      state.chef.x = x;
      state.chef.y = y;
      if (facing) state.chef.facing = facing;
    },
    giveCarry(id, chopped, cooked) {
      state.carry.push({ id, chopped: !!chopped, cooked: !!cooked, burnt: false });
    },
    addOrder(recipeId, patience) {
      const recipe = RECIPES.find((entry) => entry.id === recipeId);
      if (!recipe) return;
      const order = {
        id: nextStagedOrderId,
        recipe,
        // `patience` is the time left; the full bar is the standard patience,
        // so a staged ticket reads as nearly out of time when it is.
        patience: patience ?? 40,
        maxPatience: ORDER_PATIENCE,
        reward: recipe.reward || BASE_REWARD,
        age: 0,
      };
      nextStagedOrderId += 1;
      state.orders.push(order);
    },
    clearOrders() {
      state.orders = [];
    },
    putOnStove(slot, id, progress, done) {
      state.stoves[slot] = {
        item: { id, chopped: id === 'chicken', cooked: !!done, burnt: false },
        progress: progress ?? 0,
        done: !!done,
        burnt: false,
      };
    },
    burnOnStove(slot, id) {
      state.stoves[slot] = {
        item: { id, chopped: id === 'chicken', cooked: true, burnt: true },
        progress: 99,
        done: true,
        burnt: true,
      };
    },
    setPlate(items) {
      state.plate = [...items];
    },
    setMessage(text, seconds) {
      showMessage(text, seconds);
    },
    addFloaterAt(x, y, text) {
      addFloater(x, y, text, '#f2c94c');
    },
    finishShift(won) {
      state.over = true;
      state.won = won;
    },
  };

  return world;
}
