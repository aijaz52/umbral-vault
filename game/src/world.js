// Builds the tile world from a level string map and answers line-of-sight.

import { TILE, COLS, ROWS } from './config.js';

export const WALL = 1, FLOOR = 0, CRATE = 2;

export class World {
  constructor(level) {
    this.cols = COLS;
    this.rows = ROWS;
    this.tiles = new Uint8Array(COLS * ROWS);
    this.lamps = [];
    this.playerStart = { x: 0, y: 0 };
    this.keycard = null;
    this.exit = null;
    this.guardPaths = [[], [], [], []];

    for (let r = 0; r < ROWS; r++) {
      const line = level.map[r] || '';
      for (let c = 0; c < COLS; c++) {
        const ch = line[c] || '#';
        const cx = c * TILE + TILE / 2, cy = r * TILE + TILE / 2;
        if (ch === '#') this.tiles[r * COLS + c] = WALL;
        else if (ch === 'c') this.tiles[r * COLS + c] = CRATE;
        else {
          this.tiles[r * COLS + c] = FLOOR;
          if (ch === 'L') this.lamps.push({ x: cx, y: cy });
          else if (ch === '@') this.playerStart = { x: cx, y: cy };
          else if (ch === 'k') this.keycard = { x: cx, y: cy };
          else if (ch === 'E') this.exit = { x: cx, y: cy, c, r };
          else if (ch >= '1' && ch <= '4') this.guardPaths[ch.charCodeAt(0) - 49].push({ x: cx, y: cy });
        }
      }
    }
  }

  tileAt(px, py) {
    const c = Math.floor(px / TILE), r = Math.floor(py / TILE);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return WALL;
    return this.tiles[r * this.cols + c];
  }

  blocksSight(px, py) {
    const t = this.tileAt(px, py);
    return t === WALL || t === CRATE;
  }

  // Grid walkability for guards and simple movement clamping.
  walkable(px, py) {
    return this.tileAt(px, py) === FLOOR;
  }

  // A small patrol loop around a lone waypoint: reachable floor tiles a couple of
  // steps out, ordered by angle, so a guard with one marker still walks a beat.
  patrolLoop(px, py) {
    const c0 = Math.floor(px / TILE), r0 = Math.floor(py / TILE);
    const seen = new Set([r0 * this.cols + c0]);
    const queue = [[c0, r0, 0]];
    const found = [];
    while (queue.length) {
      const [c, r, d] = queue.shift();
      if (d >= 3) continue;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr, ni = nr * this.cols + nc;
        if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
        if (seen.has(ni) || this.tiles[ni] !== FLOOR) continue;
        seen.add(ni);
        queue.push([nc, nr, d + 1]);
        if (d + 1 >= 2) found.push({ x: nc * TILE + TILE / 2, y: nr * TILE + TILE / 2, d: d + 1 });
      }
    }
    if (found.length < 3) return [];
    found.sort((a, b) =>
      Math.atan2(a.y - py, a.x - px) - Math.atan2(b.y - py, b.x - px));
    return found.filter((_, i) => i % 2 === 0).slice(0, 4);
  }

  // Straight ray from (x0,y0) to (x1,y1); true when nothing blocks sight between them.
  clearLine(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / (TILE / 3));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.blocksSight(x0 + dx * t, y0 + dy * t)) return false;
    }
    return true;
  }

  // Circle-vs-tile collision: push a moving body out of walls and crates.
  moveCircle(x, y, r, dx, dy) {
    let nx = x + dx, ny = y + dy;
    const solid = (px, py) => this.tileAt(px, py) !== FLOOR;
    // X axis
    if (solid(nx + Math.sign(dx) * r, y - r * 0.7) || solid(nx + Math.sign(dx) * r, y + r * 0.7)) nx = x;
    // Y axis
    if (solid(x - r * 0.7, ny + Math.sign(dy) * r) || solid(x + r * 0.7, ny + Math.sign(dy) * r)) ny = y;
    return { x: nx, y: ny };
  }

  // Raw light level at a point: lamp glow only (no shadow casting, lamps are open floor).
  lampLight(x, y) {
    let l = 0;
    for (const lamp of this.lamps) {
      const d = Math.hypot(x - lamp.x, y - lamp.y);
      l = Math.max(l, Math.max(0, 1 - d / (TILE * 3.4)));
    }
    return l;
  }
}
