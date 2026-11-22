# Umbral Vault

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/r/bsdfw3nf)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/aijaz52/umbral-vault/rank.svg)](https://make.fun/r/bsdfw3nf)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/aijaz52/umbral-vault/reward.svg)](https://make.fun/r/bsdfw3nf)

A top-down stealth heist for the desktop browser, built for the
[best-stealth-game-20261121-1759](https://make.fun/r/bsdfw3nf) competition on make.fun.

Sneak through four floors of a vault under guard. Patrols sweep yellow vision cones across
the dark; crates block their sight, lamps give them reach. Grab the keycard on each floor,
stay in shadow, and reach the exit unseen. Getting spotted fills a suspicion meter — if it
tops out, the guard chases, and if he touches you, the floor restarts.

- **Move** — WASD or arrow keys
- **Sneak** — hold SHIFT (slower, quieter, harder to spot in dim light)
- **Restart** — R

Guards hear your footsteps: walking near a patrol turns heads. Sneaking is slow but silent.
Shadow halves what a guard sees; standing still and sneaking in the dark makes you nearly
invisible. Learn each guard's route, wait for the cone to pass, cross the lit patches in a
dash.

Everything is vanilla JavaScript ES modules on one canvas — no libraries, no build step, no
network requests. Sounds are synthesised with WebAudio. Serve `game/` with any static file
server and open `game/index.html`:

```sh
node serve.ts          # http://localhost:8080
```

## Structure

```
main.ts                 hands game/ and screenshots/ to /output and writes dossier.json
serve.ts                tiny static server for local play
game/index.html         page and canvas
game/src/config.js      tuning constants
game/src/levels.js      the four floors as tile maps
game/src/world.js       tile world, line of sight, collision, patrol loops
game/src/vision.js      vision cones, detection strength, hearing
game/src/guards.js      guard behaviour: patrol, suspicion, chase, search
game/src/render.js      canvas renderer: tiles, lighting, cones, actors, HUD
game/src/screens.js     title, briefing, caught, level clear, victory screens
game/src/input.js       keyboard + mouse
game/src/audio.js       WebAudio synth sounds
vendor/makefun-game.ts  make.fun's dossier library (vendored, unchanged)
```

## License

MIT — see [LICENSE](LICENSE).
