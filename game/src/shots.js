// The screenshot scenes behind ?shot=cover|rush|serve|title. Each one stages a
// real game state with the world's own setters — real orders on the board,
// real food on the stoves and the plate, the chef mid-task — and returns the
// screen to draw over it, so every frame is what a short game really looks
// like and the same seed always gives the same frame.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names stage the cover scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  world.setTimeLeft(151);
  world.setCoins(145);
  world.setServed(5);
  world.setHearts(3);
  world.clearOrders();
  state.spawnTimer = 9999;

  if (name === 'title') {
    world.clearOrders();
    world.addOrder('nasi-goreng', 42);
    world.addOrder('mie-ayam', 30);
    world.placeChef(640, 470, 1);
    world.putOnStove(0, 'rice', 3.2, false);
    world.putOnStove(1, 'chicken', 4, true);
    return { screen: SCREEN_TITLE, best: 145 };
  }

  if (name === 'rush') {
    // Four tickets at once, one about to walk out, both stoves busy.
    world.setTimeLeft(64);
    world.setCoins(188);
    world.setServed(7);
    world.addOrder('nasi-goreng', 8);
    world.addOrder('mie-ayam', 22);
    world.addOrder('sate-platter', 34);
    world.addOrder('veggie-rice', 44);
    world.placeChef(335, 300, 1);
    world.giveCarry('chicken', true, false);
    world.putOnStove(0, 'rice', 4, true);
    world.putOnStove(1, 'noodle', 2.1, false);
    world.setPlate(['veggie:chopped']);
    world.setMessage('Rush hour! Two tickets are running low…', 99);
    return { screen: SCREEN_PLAY, best: 188 };
  }

  if (name === 'serve') {
    // A finished Nasi Goreng on the plate at the pass, coins flying.
    world.setTimeLeft(98);
    world.setCoins(173);
    world.setServed(6);
    world.addOrder('nasi-goreng', 31);
    world.addOrder('mie-ayam', 40);
    world.placeChef(950, 300, 1);
    world.setPlate(['rice:cooked', 'egg:cooked', 'sauce']);
    world.setMessage('Nasi Goreng complete — serve it at the pass!', 99);
    return { screen: SCREEN_PLAY, best: 173 };
  }

  // Cover: the full kitchen at a glance — orders on the board, ingredients on
  // the counter, a dish mid-assembly on the plate, the timer running and a
  // cooked dish ready on the stove.
  world.addOrder('nasi-goreng', 38);
  world.addOrder('mie-ayam', 26);
  world.addOrder('sate-platter', 47);
  world.placeChef(600, 420, -1);
  world.giveCarry('rice', false, true);
  world.giveCarry('egg', false, true);
  world.putOnStove(0, 'chicken', 4, true);
  world.putOnStove(1, 'noodle', 2.6, false);
  world.setPlate(['rice:cooked', 'sauce']);
  world.setMessage('Build the Nasi Goreng, then serve it at the pass!', 99);
  return { screen: SCREEN_PLAY, best: 145 };
}
