// A tiny seeded random source (mulberry32) so a seed always deals the same
// orders and the same screenshot scenes. No Math.random in the world: every
// roll comes from here.

/** Make a random function from a 32-bit seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [min, max] from the given random function. */
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Pick one entry of `list` at random. */
export function randomPick(random, list) {
  return list[Math.floor(random() * list.length)];
}
