// Every tuning number, colour and recipe in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full shift: how long the player has to hit the coin target. */
export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 220;
export const HEARTS = 3;

/** How long an order waits before it walks out, at level 1. */
export const ORDER_PATIENCE = 55;
export const ORDER_PATIENCE_MIN = 30;

/** Seconds between new orders arriving, at level 1. Shorter as levels rise. */
export const ORDER_INTERVAL = 13;
export const ORDER_INTERVAL_MIN = 7;
export const MAX_ORDERS = 4;

/** A new level every LEVEL_SECONDS: faster orders, shorter patience, new recipes. */
export const LEVEL_SECONDS = 45;
export const MAX_LEVEL = 5;

export const CHEF = {
  radius: 22,
  speed: 265,
  carryMax: 3,
};

export const COOK_SECONDS = 4;
/** Seconds past done before a dish on the stove burns. */
export const BURN_SECONDS = 5;
export const CHOP_SECONDS = 1.4;

/** Points for serving a dish on time, before the patience tip. */
export const BASE_REWARD = 28;
/** Extra coins for serving with patience left, up to this many. */
export const MAX_TIP = 16;

export const BEST_KEY = 'sizzle-rush.best-coins';

// ---------------------------------------------------------------------------
// Ingredients. `chop` means the chopping board turns it into its chopped form;
// `cook` means a stove turns it into its cooked form. `cookSeconds` overrides
// the default stove time for that ingredient.
// ---------------------------------------------------------------------------
export const INGREDIENTS = {
  rice: { name: 'Rice', short: 'Rice', chop: false, cook: true, colour: '#f5ecd7', accent: '#d9c48f' },
  noodle: { name: 'Noodles', short: 'Noodle', chop: false, cook: true, colour: '#f7c873', accent: '#d99a2b' },
  chicken: { name: 'Chicken', short: 'Chicken', chop: true, cook: true, colour: '#f2a594', accent: '#c96a4e' },
  egg: { name: 'Egg', short: 'Egg', chop: false, cook: true, colour: '#fff3c4', accent: '#e8b93c', cookSeconds: 3 },
  veggie: { name: 'Veggie', short: 'Veggie', chop: true, cook: false, colour: '#8fce6e', accent: '#4d8f3a' },
  sauce: { name: 'Sauce', short: 'Sauce', chop: false, cook: false, colour: '#c65b4e', accent: '#8f3226' },
};

/**
 * A recipe is a dish name plus the finished ingredients it needs. An ingredient
 * is written as `id` (already ready to plate, like sauce) or `id:chopped` /
 * `id:cooked` for the form the board or stove must make first.
 */
export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    needs: ['rice:cooked', 'egg:cooked', 'sauce'],
    reward: 30,
    minLevel: 1,
    blurb: 'Golden fried rice, egg, chilli sauce',
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    needs: ['noodle:cooked', 'chicken:chopped:cooked', 'veggie:chopped'],
    reward: 34,
    minLevel: 1,
    blurb: 'Springy noodles, grilled chicken, greens',
  },
  {
    id: 'sate-platter',
    name: 'Sate Platter',
    needs: ['chicken:chopped:cooked', 'sauce', 'veggie:chopped'],
    reward: 36,
    minLevel: 2,
    blurb: 'Char-grilled satay, peanut sauce, salad',
  },
  {
    id: 'veggie-rice',
    name: 'Veggie Fried Rice',
    needs: ['rice:cooked', 'veggie:chopped', 'egg:cooked'],
    reward: 30,
    minLevel: 2,
    blurb: 'Garden rice, crisp veg, sunny egg',
  },
  {
    id: 'chicken-rice',
    name: 'Chicken Rice Bowl',
    needs: ['rice:cooked', 'chicken:chopped:cooked', 'sauce'],
    reward: 38,
    minLevel: 3,
    blurb: 'Steamy rice, juicy chicken, chilli sauce',
  },
];

// ---------------------------------------------------------------------------
// Kitchen layout. Stations sit on the floor; the chef walks between them.
// `at` is the station rect, `front` is where the chef stands to use it.
// ---------------------------------------------------------------------------
export const STATIONS = [
  // Ingredient crates along the bottom wall.
  { id: 'crate-rice', kind: 'crate', item: 'rice', label: 'RICE', at: { x: 60, y: 600, w: 120, h: 84 }, front: { x: 120, y: 586 } },
  { id: 'crate-noodle', kind: 'crate', item: 'noodle', label: 'NOODLE', at: { x: 220, y: 600, w: 120, h: 84 }, front: { x: 280, y: 586 } },
  { id: 'crate-chicken', kind: 'crate', item: 'chicken', label: 'CHICKEN', at: { x: 380, y: 600, w: 120, h: 84 }, front: { x: 440, y: 586 } },
  { id: 'crate-egg', kind: 'crate', item: 'egg', label: 'EGG', at: { x: 540, y: 600, w: 120, h: 84 }, front: { x: 600, y: 586 } },
  { id: 'crate-veggie', kind: 'crate', item: 'veggie', label: 'VEGGIE', at: { x: 700, y: 600, w: 120, h: 84 }, front: { x: 760, y: 586 } },
  { id: 'crate-sauce', kind: 'crate', item: 'sauce', label: 'SAUCE', at: { x: 860, y: 600, w: 120, h: 84 }, front: { x: 920, y: 586 } },
  // Work stations along the top of the floor.
  { id: 'board', kind: 'board', label: 'CHOP', at: { x: 60, y: 168, w: 150, h: 88 }, front: { x: 135, y: 268 } },
  { id: 'stove-1', kind: 'stove', slot: 0, label: 'STOVE', at: { x: 260, y: 168, w: 150, h: 88 }, front: { x: 335, y: 268 } },
  { id: 'stove-2', kind: 'stove', slot: 1, label: 'STOVE', at: { x: 460, y: 168, w: 150, h: 88 }, front: { x: 535, y: 268 } },
  { id: 'plate', kind: 'plate', label: 'PLATE', at: { x: 660, y: 168, w: 150, h: 88 }, front: { x: 735, y: 268 } },
  { id: 'pass', kind: 'pass', label: 'SERVE', at: { x: 860, y: 148, w: 180, h: 108 }, front: { x: 950, y: 268 } },
  { id: 'trash', kind: 'trash', label: 'TRASH', at: { x: 1090, y: 168, w: 110, h: 88 }, front: { x: 1145, y: 268 } },
];

/** The floor the chef may walk on (inside the walls, below the order board). */
export const FLOOR = { x: 28, y: 116, w: 1224, h: 576 };

export const PALETTE = {
  floor: '#c98f5f',
  floorDark: '#b57d4e',
  wall: '#7a4a2b',
  wallTop: '#8a5636',
  board: '#2e2118',
  boardPanel: '#f7ead2',
  boardPanelEdge: '#d9b98a',
  counter: '#6b4426',
  counterTop: '#a4713f',
  counterEdge: '#5a3820',
  steel: '#c9ccd4',
  steelDark: '#9aa0ab',
  text: '#fff7e8',
  muted: '#d8c3a5',
  dark: '#241708',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#5fb85a',
  cream: '#f7ead2',
  chefHat: '#fdfdfd',
  chefShirt: '#3f7fb5',
  chefApron: '#f2f2f2',
  chefSkin: '#f0c08a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
