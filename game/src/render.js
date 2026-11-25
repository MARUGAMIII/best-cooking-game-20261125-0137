// Every pixel of the kitchen: the floor, the counters, the order board, the
// chef, the food and the HUD. All art is drawn with canvas paths — no image
// files — so the game loads nothing over the network.

import {
  FIELD,
  FLOOR,
  FONT,
  HEARTS,
  INGREDIENTS,
  PALETTE,
  SHIFT_SECONDS,
  STATIONS,
  TARGET_COINS,
} from './config.js';
import { itemKey } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align, weight) {
  ctx.fillStyle = colour;
  ctx.font = `${weight || 700} ${size}px ${FONT}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Ingredient pictograms. Each is drawn at (x, y) inside a `size` box and
// shows its state: chopped food is diced, cooked food steams, burnt food is
// blackened. These are the game's own drawings, used on tickets, in the
// chef's hands, on the stoves and on the plate.
// ---------------------------------------------------------------------------
export function drawIngredientIcon(ctx, id, x, y, size, state) {
  const def = INGREDIENTS[id];
  const s = size;
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.save();
  ctx.translate(cx, cy);

  if (id === 'rice') {
    // A bowl of steamed rice.
    ctx.fillStyle = '#e8e2d2';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.34, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = state && state.cooked ? '#fff8e0' : def.colour;
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.3, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.12, -s * 0.16, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'noodle') {
    // A nest of noodles in a bowl.
    ctx.strokeStyle = '#e8a83e';
    ctx.lineWidth = s * 0.07;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, s * 0.04, s * (0.3 - i * 0.07), Math.PI * (0.15 + i * 0.2), Math.PI * (0.85 - i * 0.1));
      ctx.stroke();
    }
    ctx.fillStyle = '#c65b4e';
    ctx.beginPath();
    ctx.arc(s * 0.2, -s * 0.12, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chicken') {
    // A drumstick.
    ctx.rotate(-0.6);
    ctx.fillStyle = state && state.cooked ? '#d98a4a' : def.colour;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.3, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f7ead2';
    ctx.lineWidth = s * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.24, s * 0.08);
    ctx.lineTo(s * 0.42, s * 0.28);
    ctx.stroke();
    ctx.fillStyle = '#f7ead2';
    ctx.beginPath();
    ctx.arc(s * 0.44, s * 0.3, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'egg') {
    // A fried egg, sunny side up.
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.36, s * 0.3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = state && state.cooked ? '#f2a91e' : '#f7c948';
    ctx.beginPath();
    ctx.arc(s * 0.04, 0, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(s * 0.0, -s * 0.05, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'veggie') {
    // Leafy greens.
    ctx.fillStyle = def.accent;
    ctx.beginPath();
    ctx.ellipse(-s * 0.14, s * 0.08, s * 0.22, s * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.colour;
    ctx.beginPath();
    ctx.ellipse(s * 0.08, -s * 0.06, s * 0.26, s * 0.14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.14, s * 0.12, s * 0.2, s * 0.1, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a6e2a';
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.02);
    ctx.lineTo(s * 0.28, -s * 0.16);
    ctx.stroke();
  } else if (id === 'sauce') {
    // A chilli sauce bottle.
    ctx.fillStyle = '#8f3226';
    ctx.fillRect(-s * 0.1, -s * 0.05, s * 0.2, s * 0.38);
    roundRect(ctx, -s * 0.16, -s * 0.02, s * 0.32, s * 0.36, s * 0.06);
    ctx.fill();
    ctx.fillStyle = '#f7ead2';
    ctx.fillRect(-s * 0.08, -s * 0.32, s * 0.16, s * 0.28);
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(0, s * 0.14, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state && state.chopped) {
    // Diced: a few small squares over the food.
    ctx.fillStyle = 'rgba(60,40,20,0.55)';
    ctx.fillRect(-s * 0.2, -s * 0.08, s * 0.09, s * 0.09);
    ctx.fillRect(s * 0.06, s * 0.08, s * 0.09, s * 0.09);
    ctx.fillRect(s * 0.14, -s * 0.2, s * 0.09, s * 0.09);
  }
  if (state && state.burnt) {
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state && state.cooked && id !== 'rice') {
    // Steam curls above hot food.
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = s * 0.04;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.16, -s * 0.34);
      ctx.quadraticCurveTo(i * s * 0.16 + s * 0.08, -s * 0.46, i * s * 0.16, -s * 0.56);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** The chip a ticket shows for one finished ingredient it needs. */
function drawNeedChip(ctx, key, x, y, size) {
  const [id, ...forms] = key.split(':');
  const state = {
    chopped: forms.includes('chopped'),
    cooked: forms.includes('cooked'),
    burnt: false,
  };
  ctx.fillStyle = '#fff8e8';
  roundRect(ctx, x, y, size, size, 7);
  ctx.fill();
  ctx.strokeStyle = '#d9b98a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawIngredientIcon(ctx, id, x, y, size, state);
  const label = INGREDIENTS[id].short + (state.cooked ? ' ✓' : state.chopped ? ' ✂' : '');
  text(ctx, label, x + size / 2, y + size + 11, 11, '#5a3a1a', 'center', 600);
}

// ---------------------------------------------------------------------------
// The order board across the top of the screen.
// ---------------------------------------------------------------------------
function drawOrderBoard(ctx, state) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, FIELD.width, 112);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 108, FIELD.width, 6);

  text(ctx, 'ORDERS', 18, 20, 15, PALETTE.gold, 'left', 800);
  const ticketW = 196;
  const ticketH = 82;
  const gap = 10;
  for (let index = 0; index < 4; index += 1) {
    const x = 18 + index * (ticketW + gap);
    const y = 30;
    const order = state.orders[index];
    ctx.fillStyle = order ? PALETTE.boardPanel : 'rgba(247,234,210,0.16)';
    roundRect(ctx, x, y, ticketW, ticketH, 8);
    ctx.fill();
    if (!order) {
      ctx.strokeStyle = 'rgba(247,234,210,0.35)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting…', x + ticketW / 2, y + ticketH / 2, 13, 'rgba(247,234,210,0.6)');
      continue;
    }
    const ratio = Math.max(0, order.patience / order.maxPatience);
    const barColour = ratio > 0.5 ? '#5fb85a' : ratio > 0.25 ? '#f2a91e' : '#e5534b';
    text(ctx, order.recipe.name, x + 10, y + 14, 15, '#3a2410', 'left', 800);
    text(ctx, `$${order.reward}`, x + ticketW - 10, y + 14, 14, '#8a5a12', 'right', 800);
    order.recipe.needs.forEach((need, needIndex) => {
      drawNeedChip(ctx, need, x + 10 + needIndex * 62, y + 24, 30);
    });
    // Patience bar.
    ctx.fillStyle = '#e0cba6';
    roundRect(ctx, x + 10, y + ticketH - 12, ticketW - 20, 6, 3);
    ctx.fill();
    ctx.fillStyle = barColour;
    roundRect(ctx, x + 10, y + ticketH - 12, (ticketW - 20) * ratio, 6, 3);
    ctx.fill();
  }

  // Shift clock, coins, hearts and target on the right.
  const hudX = 18 + 4 * (ticketW + gap) + 8;
  const timeRatio = state.timeLeft / SHIFT_SECONDS;
  const timeColour = timeRatio > 0.33 ? PALETTE.text : timeRatio > 0.15 ? '#f2a91e' : '#ff7a6e';
  text(ctx, '⏱ SHIFT', hudX, 18, 12, PALETTE.muted, 'left', 800);
  text(ctx, formatTime(state.timeLeft), hudX, 48, 34, timeColour, 'left', 800);
  text(ctx, `★ target $${TARGET_COINS}`, hudX, 82, 12, PALETTE.gold, 'left', 700);

  const coinX = hudX + 150;
  text(ctx, 'COINS', coinX, 18, 12, PALETTE.muted, 'left', 800);
  text(ctx, `$${state.coins}`, coinX, 48, 30, PALETTE.gold, 'left', 800);
  text(ctx, `served ${state.served}`, coinX, 82, 12, PALETTE.muted, 'left', 700);

  const heartX = coinX + 130;
  text(ctx, 'HEARTS', heartX, 18, 12, PALETTE.muted, 'left', 800);
  for (let i = 0; i < HEARTS; i += 1) {
    ctx.font = '26px ' + FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = i < state.hearts ? '#ff6b81' : 'rgba(255,255,255,0.25)';
    ctx.fillText('♥', heartX + i * 30, 48);
  }
  text(ctx, `LVL ${state.level}`, heartX, 82, 12, PALETTE.muted, 'left', 700);
}

// ---------------------------------------------------------------------------
// The kitchen floor and stations.
// ---------------------------------------------------------------------------
function drawFloor(ctx, time) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 112, FIELD.width, FIELD.height - 112);
  // Checker tiles.
  ctx.fillStyle = PALETTE.floorDark;
  const tile = 64;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      if ((row + col) % 2 === 0) continue;
      ctx.fillRect(col * tile, 114 + row * tile, tile, tile);
    }
  }
  // Wall trim at the top of the floor.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 112, FIELD.width, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 122, FIELD.width, 3);
  void time;
}

function drawStation(ctx, station, state, highlight) {
  const { x, y, w, h } = station.at;
  ctx.save();
  if (highlight) {
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 18;
  }
  // Counter body.
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, x + 4, y + 4, w - 8, 22, 7);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = highlight ? '#ffd76a' : PALETTE.counterEdge;
  ctx.lineWidth = highlight ? 3 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();

  if (station.kind === 'crate') {
    drawIngredientIcon(ctx, station.item, x + w / 2 - 26, y + 26, 52, null);
    text(ctx, station.label, x + w / 2, y + h - 12, 13, PALETTE.text, 'center', 800);
  } else if (station.kind === 'board') {
    // Chopping board with a knife.
    ctx.fillStyle = '#e8d5ae';
    roundRect(ctx, x + 22, y + 30, w - 44, 34, 6);
    ctx.fill();
    ctx.strokeStyle = '#9aa0ab';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w - 52, y + 34);
    ctx.lineTo(x + w - 26, y + 58);
    ctx.stroke();
    if (state.chopping) {
      const progress = state.chopping.progress;
      ctx.fillStyle = '#e0cba6';
      roundRect(ctx, x + 22, y + 68, w - 44, 7, 3);
      ctx.fill();
      ctx.fillStyle = '#5fb85a';
      roundRect(ctx, x + 22, y + 68, (w - 44) * progress, 7, 3);
      ctx.fill();
      drawIngredientIcon(ctx, state.chopping.item.id, x + w / 2 - 20, y + 28, 40, { chopped: false });
    } else {
      text(ctx, 'CHOP', x + w / 2, y + h - 12, 13, PALETTE.text, 'center', 800);
    }
  } else if (station.kind === 'stove') {
    const stove = state.stoves[station.slot];
    // Burner rings.
    ctx.fillStyle = '#3a3f47';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 42, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#565d68';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 42, 22, 0, Math.PI * 2);
    ctx.stroke();
    if (stove.item) {
      // Pot with the cooking food.
      ctx.fillStyle = '#2f333a';
      roundRect(ctx, x + w / 2 - 30, y + 16, 60, 44, 8);
      ctx.fill();
      ctx.fillStyle = stove.burnt ? '#1c130a' : '#e8e2d2';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 22, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientIcon(ctx, stove.item.id, x + w / 2 - 16, y + 2, 32, stove.item);
      // Progress ring.
      const cookTime = INGREDIENTS[stove.item.id].cookSeconds ?? 4;
      const ratio = Math.min(1, stove.progress / cookTime);
      ctx.strokeStyle = stove.burnt ? '#e5534b' : stove.done ? '#5fb85a' : '#f2c94c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 42, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      if (stove.done && !stove.burnt) {
        text(ctx, 'READY!', x + w / 2, y + h - 12, 13, '#7ee787', 'center', 800);
      } else if (stove.burnt) {
        text(ctx, 'BURNT!', x + w / 2, y + h - 12, 13, '#ff7a6e', 'center', 800);
      } else {
        text(ctx, 'COOKING…', x + w / 2, y + h - 12, 12, PALETTE.muted, 'center', 700);
      }
    } else {
      text(ctx, 'STOVE', x + w / 2, y + h - 12, 13, PALETTE.text, 'center', 800);
    }
  } else if (station.kind === 'plate') {
    // The plate being built, with its ingredients arranged on it.
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 44, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9cdb4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 44, 40, 21, 0, 0, Math.PI * 2);
    ctx.stroke();
    state.plate.forEach((key, index) => {
      const [id, ...forms] = key.split(':');
      const angle = (index / Math.max(1, state.plate.length)) * Math.PI * 2 - Math.PI / 2;
      const px = x + w / 2 + Math.cos(angle) * 24 - 14;
      const py = y + 44 + Math.sin(angle) * 13 - 14;
      drawIngredientIcon(ctx, id, px, py, 28, { chopped: forms.includes('chopped'), cooked: forms.includes('cooked') });
    });
    if (state.plate.length === 0) {
      text(ctx, 'PLATE', x + w / 2, y + h - 12, 13, PALETTE.text, 'center', 800);
    } else {
      text(ctx, `${state.plate.length} on plate`, x + w / 2, y + h - 12, 12, PALETTE.gold, 'center', 800);
    }
  } else if (station.kind === 'pass') {
    // The serving window with a bell.
    ctx.fillStyle = '#3a2a1a';
    roundRect(ctx, x + 12, y + 12, w - 24, 52, 6);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 34, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + w / 2 - 18, y + 34, 36, 4);
    ctx.fillStyle = '#f7ead2';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 42, 3, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'SERVE →', x + w / 2, y + h - 12, 14, PALETTE.gold, 'center', 800);
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#4a4f57';
    roundRect(ctx, x + w / 2 - 22, y + 26, 44, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#33373d';
    ctx.fillRect(x + w / 2 - 26, y + 20, 52, 8);
    text(ctx, 'TRASH', x + w / 2, y + h - 12, 13, PALETTE.text, 'center', 800);
  }

  if (highlight) {
    text(ctx, '[ E ]', x + w / 2, y - 12, 13, '#ffd76a', 'center', 800);
  }
}

// ---------------------------------------------------------------------------
// The chef.
// ---------------------------------------------------------------------------
function drawChef(ctx, chef, carry) {
  const { x, y } = chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob * 0.4);

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: shirt and apron.
  ctx.fillStyle = PALETTE.chefShirt;
  roundRect(ctx, -18, -6, 36, 26, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefApron;
  roundRect(ctx, -13, 2, 26, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(-13, 2, 26, 3);

  // Head and chef hat.
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -16, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefHat;
  roundRect(ctx, -15, -34, 30, 14, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -32, 8, 0, Math.PI * 2);
  ctx.arc(0, -36, 9, 0, Math.PI * 2);
  ctx.arc(9, -32, 8, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#241708';
  ctx.beginPath();
  ctx.arc(chef.facing * 4 - 4, -16, 2, 0, Math.PI * 2);
  ctx.arc(chef.facing * 4 + 5, -16, 2, 0, Math.PI * 2);
  ctx.fill();
  // Smile.
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(chef.facing * 3, -11, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Carried food floats above the chef's head on a little tray.
  if (carry.length > 0) {
    const trayW = carry.length * 34 + 10;
    ctx.fillStyle = 'rgba(46,33,24,0.85)';
    roundRect(ctx, -trayW / 2, -72, trayW, 38, 8);
    ctx.fill();
    carry.forEach((item, index) => {
      drawIngredientIcon(ctx, item.id, -trayW / 2 + 5 + index * 34, -72, 34, item);
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Overlays: message bar, floaters, title / pause / game-over screens.
// ---------------------------------------------------------------------------
function drawMessage(ctx, state) {
  if (state.messageTimer <= 0 || !state.message) return;
  const alpha = Math.min(1, state.messageTimer);
  ctx.save();
  ctx.globalAlpha = alpha;
  // Floats over the open floor, clear of the crates and the stations.
  const barY = 548;
  ctx.fillStyle = 'rgba(30,20,12,0.88)';
  roundRect(ctx, FIELD.width / 2 - 360, barY, 720, 36, 18);
  ctx.fill();
  text(ctx, state.message, FIELD.width / 2, barY + 19, 16, '#ffe9b8', 'center', 700);
  ctx.restore();
}

function drawFloaters(ctx, state) {
  for (const floater of state.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, floater.life);
    text(ctx, floater.text, floater.x, floater.y, 22, floater.colour, 'center', 800);
    ctx.restore();
  }
}

function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.fillStyle = 'rgba(30,20,12,0.92)';
  roundRect(ctx, 290, 120, 700, 470, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, '🍳 SIZZLE RUSH', 640, 185, 56, PALETTE.gold, 'center', 900);
  text(ctx, '— The Ember Kitchen —', 640, 232, 22, PALETTE.text, 'center', 600);
  text(ctx, 'A tiny kitchen. A flood of hungry tickets. One very fast chef.', 640, 268, 16, PALETTE.muted);

  const lines = [
    'WASD / arrows — run around the kitchen',
    'Click a station — walk there and use it',
    'E / Space — pick up, chop, cook, plate, serve',
    'Chop chicken & veggie · cook rice, noodle, chicken & egg',
    'Match the plate to a ticket, then serve it at the pass',
    'Watch the stove: food left too long burns!',
  ];
  lines.forEach((line, index) => {
    text(ctx, line, 640, 312 + index * 26, 16, PALETTE.text, 'center', 500);
  });

  text(ctx, `Shift: 3 minutes · Target: $${TARGET_COINS} · Keep all 3 hearts`, 640, 492, 15, PALETTE.gold, 'center', 700);
  if (best > 0) text(ctx, `Best shift so far: $${best}`, 640, 520, 15, PALETTE.muted, 'center', 600);
  text(ctx, '▶  Press SPACE or click to start cooking', 640, 556, 20, '#7ee787', 'center', 800);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'PAUSED', 640, 330, 52, PALETTE.text, 'center', 900);
  text(ctx, 'Press P or Space to keep cooking', 640, 380, 18, PALETTE.muted);
}

function drawGameOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.fillStyle = 'rgba(30,20,12,0.94)';
  roundRect(ctx, 340, 150, 600, 420, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (state.won) {
    text(ctx, '🏆 SHIFT COMPLETE!', 640, 210, 40, PALETTE.gold, 'center', 900);
    text(ctx, 'You hit the target — the kitchen is yours!', 640, 252, 17, PALETTE.text);
  } else {
    text(ctx, '⏰ SHIFT OVER', 640, 210, 40, '#ff9a8a', 'center', 900);
    text(ctx, state.hearts <= 0 ? 'Too many orders walked out…' : 'The target slipped away this time.', 640, 252, 17, PALETTE.text);
  }
  const stars = state.coins >= TARGET_COINS ? 3 : state.coins >= TARGET_COINS * 0.66 ? 2 : state.coins >= TARGET_COINS * 0.33 ? 1 : 0;
  ctx.font = '44px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < stars ? PALETTE.gold : 'rgba(255,255,255,0.22)';
    ctx.fillText('★', 560 + i * 80, 310);
  }
  text(ctx, `Coins earned: $${state.coins}  (target $${TARGET_COINS})`, 640, 372, 20, PALETTE.text, 'center', 700);
  text(ctx, `Dishes served: ${state.served}   ·   Best shift: $${Math.max(best, state.coins)}`, 640, 406, 17, PALETTE.muted);
  text(ctx, 'Press R or click to cook another shift', 640, 500, 19, '#7ee787', 'center', 800);
}

// ---------------------------------------------------------------------------
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    draw(state, screen, best, highlightStationId) {
      const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
      const offsetX = (canvas.width - FIELD.width * scale) / 2;
      const offsetY = (canvas.height - FIELD.height * scale) / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#241708';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

      drawFloor(ctx, state.elapsed);
      for (const station of STATIONS) {
        drawStation(ctx, station, state, highlightStationId === station.id);
      }
      // The chef walks behind the top counters and in front of the floor.
      drawChef(ctx, state.chef, state.carry);
      drawOrderBoard(ctx, state);
      drawFloaters(ctx, state);
      drawMessage(ctx, state);

      if (screen === SCREEN_TITLE) drawTitle(ctx, best);
      else if (screen === SCREEN_PAUSED) drawPaused(ctx);
      else if (screen === SCREEN_OVER) drawGameOver(ctx, state, best);
    },
  };
}
