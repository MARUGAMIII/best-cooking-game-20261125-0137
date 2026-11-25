# Sizzle Rush — The Ember Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/marugamiii/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/marugamiii/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete top-down 2D cooking game, built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## The game

You run the Ember Kitchen for one 3-minute shift (target: $220). Orders
arrive on the board — grab ingredients from the six crates, chop them,
cook them on the stoves, assemble dishes on the plating counter, and
serve them at the pass before patience runs out. Burnt food goes in the
trash. Five recipes (Nasi Goreng, Mie Ayam, Sate Platter, Veggie Fried
Rice, Chicken Rice Bowl) unlock as the shift heats up: orders come
faster and patience gets shorter every 45 seconds.

## How to play

- **Keyboard:** WASD / arrows to move, E or Space to use a station.
- **Mouse:** click a station and the chef walks there and uses it.
- **Serve** a plate at the pass only when it matches an open ticket —
  coins plus a tip of up to +16, depending on patience left.
- **Lose a heart** when an order expires (3 hearts).

## Run it

Static files under `game/` — no build step, no network requests. Serve
the folder with any static HTTP server and open `game/index.html` in
desktop Chrome:

```sh
npx serve game
# or: python3 -m http.server --directory game
```

`main.ts` hands the game in: it copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json`. All art is drawn on canvas
and all sound is synthesized with WebAudio — no external assets.

## Files

- `game/index.html` + `game/src/` — the game itself (config, seeded
  RNG, audio, input, orders, world, rendering, screenshot scenes)
- `screenshots/` — 4 real renders of the game in headless Chromium
- `main.ts` — the hand-in program (kit scaffolding)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `LICENSE` — MIT

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
