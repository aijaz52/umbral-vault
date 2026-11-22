// Main loop and game orchestration for Umbral Vault.

import { VIEW_W, VIEW_H, PLAYER } from './config.js';
import { Input } from './input.js';
import { World } from './world.js';
import { Guard } from './guards.js';
import { levelCount, levelAt } from './levels.js';
import { render } from './render.js';
import { drawScreen, STATE } from './screens.js';
import { sound } from './audio.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.state = STATE.TITLE;
    this.levelIndex = 0;
    this.time = 0;
    this.totalTime = 0;
    this.stepTimer = 0;
    this.loadLevel(0);
  }

  loadLevel(i) {
    this.levelIndex = i;
    const level = levelAt(i);
    this.levelName = level.name;
    this.brief = level.brief;
    this.world = new World(level);
    this.player = {
      x: this.world.playerStart.x, y: this.world.playerStart.y,
      dir: 0, moving: false, sneaking: false, danger: 0, lightLevel: 0, hasKey: false,
    };
    this.guards = [];
    for (let g = 0; g < 4; g++) {
      const path = this.guardPathFor(g);
      if (path.length) this.guards.push(new Guard(this.world, path, g));
    }
    this.levelTime = 0;
    this.state = STATE.BRIEF;
  }

  // World scans guard waypoint digits in map order; World already collected them,
  // but it consumed them into this.guardPaths — reuse from there.
  guardPathFor(g) {
    return this.world.guardPaths[g] || [];
  }

  onSpotted(guard) {
    sound.spotted();
    this.player.danger = 1;
  }

  onCaught() {
    if (this.state === STATE.PLAY) {
      this.state = STATE.CAUGHT;
      sound.caught();
    }
  }

  startPlay() {
    this.state = STATE.PLAY;
    sound.click();
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
  }

  update(dt) {
    this.time += dt;
    const inp = this.input;

    if (this.state === STATE.TITLE) {
      if (inp.takePress('Enter') || inp.takeClick()) this.startPlay();
      return;
    }
    if (this.state === STATE.BRIEF) {
      if (inp.takePress('Enter') || inp.takeClick()) this.startPlay();
      return;
    }
    if (this.state === STATE.CAUGHT) {
      if (inp.takePress('Enter') || inp.takeClick()) this.restartLevel();
      return;
    }
    if (this.state === STATE.CLEAR) {
      if (inp.takePress('Enter') || inp.takeClick()) {
        if (this.levelIndex + 1 < levelCount()) this.loadLevel(this.levelIndex + 1);
        else { this.state = STATE.WIN; sound.win(); }
      }
      return;
    }
    if (this.state === STATE.WIN) {
      if (inp.takePress('Enter')) { this.levelIndex = 0; this.totalTime = 0; this.loadLevel(0); }
      return;
    }
    if (this.state !== STATE.PLAY) return;

    this.levelTime += dt;
    this.totalTime += dt;

    // Player movement.
    const p = this.player;
    p.sneaking = inp.sneaking();
    const ax = inp.axis();
    p.moving = ax.x !== 0 || ax.y !== 0;
    if (p.moving) {
      const len = Math.hypot(ax.x, ax.y);
      const speed = (p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed) * dt;
      const pos = this.world.moveCircle(p.x, p.y, PLAYER.radius, (ax.x / len) * speed, (ax.y / len) * speed);
      p.x = pos.x; p.y = pos.y;
      p.dir = Math.atan2(ax.y, ax.x);
      // Footstep sounds, slower when sneaking.
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = p.sneaking ? 0.42 : 0.26;
        sound.step(p.sneaking);
      }
    }
    p.lightLevel = this.world.lampLight(p.x, p.y);

    // Guards.
    for (const g of this.guards) g.update(dt, this.world, p, this);

    // Danger meter: the worst any guard suspects, decaying slowly.
    let worst = 0;
    for (const g of this.guards) worst = Math.max(worst, Math.min(1, g.suspicion));
    p.danger = Math.max(worst, Math.max(0, p.danger - 0.4 * dt));

    // Keycard pickup.
    if (this.world.keycard && !p.hasKey) {
      const k = this.world.keycard;
      if (Math.hypot(p.x - k.x, p.y - k.y) < 18) {
        p.hasKey = true;
        this.world.keycard = null;
        sound.pickup();
      }
    }

    // Exit.
    const e = this.world.exit;
    if (p.hasKey && Math.hypot(p.x - e.x, p.y - e.y) < 20) {
      this.state = STATE.CLEAR;
      sound.win();
    }

    if (inp.takePress('KeyR')) this.restartLevel();
  }

  draw() {
    if (this.state === STATE.PLAY) {
      render(this.ctx, this);
      this.lastWorldDraw = (ctx) => render(ctx, this);
    } else {
      drawScreen(this.ctx, this);
    }
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game; // debug hook

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!window.__pause) {
    game.update(dt);
    game.draw();
  }
  game.input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
