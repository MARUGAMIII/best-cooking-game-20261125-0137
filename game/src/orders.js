// Orders: the tickets on the order board. Each ticket names a recipe, pays a
// reward plus a patience tip, and walks out when its patience runs out.
// The board spawns tickets on a timer that quickens as levels rise.

import {
  BASE_REWARD,
  MAX_ORDERS,
  MAX_TIP,
  ORDER_INTERVAL,
  ORDER_INTERVAL_MIN,
  ORDER_PATIENCE,
  ORDER_PATIENCE_MIN,
  RECIPES,
} from './config.js';
import { randomPick } from './random.js';

let nextOrderId = 1;

/** The recipes a kitchen of this level may be asked for. */
export function recipesForLevel(level) {
  return RECIPES.filter((recipe) => recipe.minLevel <= level);
}

/** Make one fresh ticket for a random recipe of this level. `avoidIds` are
 * recipes already on the board; a repeat is picked only when nothing else
 * is available at this level. */
export function createOrder(random, level, patienceScale, avoidIds) {
  let available = recipesForLevel(level);
  if (avoidIds && avoidIds.length > 0) {
    const fresh = available.filter((recipe) => !avoidIds.includes(recipe.id));
    if (fresh.length > 0) available = fresh;
  }
  const recipe = randomPick(random, available);
  const patience = Math.max(
    ORDER_PATIENCE_MIN,
    ORDER_PATIENCE * patienceScale * (1 - 0.06 * (level - 1)),
  );
  return {
    id: nextOrderId,
    recipe,
    patience,
    maxPatience: patience,
    reward: recipe.reward || BASE_REWARD,
    age: 0,
  };
}

/** Coins for serving this ticket now: reward plus a tip for patience left. */
export function serveValue(order) {
  const left = Math.max(0, order.patience / order.maxPatience);
  return order.reward + Math.round(MAX_TIP * left);
}

/**
 * Advance every ticket's patience by `dt` seconds. Returns the tickets that
 * just expired, already removed from `orders`.
 */
export function tickOrders(orders, dt) {
  const expired = [];
  for (let index = orders.length - 1; index >= 0; index -= 1) {
    const order = orders[index];
    order.patience -= dt;
    order.age += dt;
    if (order.patience <= 0) {
      expired.push(order);
      orders.splice(index, 1);
    }
  }
  return expired;
}

/** Seconds until the next ticket arrives at this level. */
export function spawnInterval(level) {
  return Math.max(ORDER_INTERVAL_MIN, ORDER_INTERVAL - 1.2 * (level - 1));
}

/** Does this plate (a list of finished ingredient keys) fill this ticket? */
export function plateMatchesOrder(plateItems, order) {
  const wanted = [...order.recipe.needs].sort();
  const served = [...plateItems].sort();
  if (wanted.length !== served.length) return false;
  for (let index = 0; index < wanted.length; index += 1) {
    if (wanted[index] !== served[index]) return false;
  }
  return true;
}

/** The first open ticket this plate fills, or null. */
export function findMatchingOrder(plateItems, orders) {
  for (const order of orders) {
    if (plateMatchesOrder(plateItems, order)) return order;
  }
  return null;
}
