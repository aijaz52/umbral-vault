// Renderer: tiles, lighting, vision cones, actors and HUD, all drawn on one canvas.

import { TILE, VIEW_W, VIEW_H, LIGHT, PLAYER, GUARD } from './config.js';
import { WALL, CRATE } from './world.js';
import { conePoly } from './vision.js';

const COL = {
  wall: '#454e63', wallTop: '#5c6680',
  crate: '#8a6c3f', crateTop: '#a9854e',
  floor: '#191d29', floorLit: '#1c2030',
  cone: 'rgba(255, 214, 110, 0.30)',
  coneAlert: 'rgba(255, 90, 70, 0.34)',
  guard: '#e0903a', guardBody: '#c47a28',
  chase: '#ff5040',
  player: '#59d6f2', playerBody: '#2fa8cc',
  key: '#ffd23e',
  exit: '#4be07a',
  lamp: '#ffe9a8',
  hud: 'rgba(8, 10, 16, 0.72)',
};

export function render(ctx, game) {
  const { world, player, guards, levelIndex } = game;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  drawTiles(ctx, world);
  drawExit(ctx, world);
  if (world.keycard) drawKeycard(ctx, world.keycard, game.time);
  drawLamps(ctx, world);
  drawLighting(ctx, world, guards);

  // Vision cones above the darkness: light is what you must avoid.
  for (const g of guards) {
    const poly = conePoly(world, g, g.isAlert() ? 40 : 24);
    ctx.fillStyle = g.isAlert() ? COL.coneAlert : COL.cone;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (const p of poly) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = g.isAlert() ? 'rgba(255,120,90,0.75)' : 'rgba(255,214,110,0.7)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  drawGuards(ctx, guards, game.time);
  drawPlayer(ctx, player, game.time);

  drawHud(ctx, game);
}

function drawTiles(ctx, world) {
  for (let r = 0; r < world.rows; r++) {
    for (let c = 0; c < world.cols; c++) {
      const t = world.tiles[r * world.cols + c];
      const x = c * TILE, y = r * TILE;
      if (t === WALL) {
        ctx.fillStyle = COL.wall; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COL.wallTop; ctx.fillRect(x, y, TILE, 4);
      } else if (t === CRATE) {
        ctx.fillStyle = COL.floor; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COL.crate; ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = COL.crateTop; ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + TILE - 4, y + TILE - 4);
        ctx.moveTo(x + TILE - 4, y + 4); ctx.lineTo(x + 4, y + TILE - 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = COL.floor; ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
}

function drawLamps(ctx, world) {
  for (const lamp of world.lamps) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, TILE * 3.4);
    glow.addColorStop(0, 'rgba(255,233,168,0.5)');
    glow.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, TILE * 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.lamp;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7c4a';
    ctx.stroke();
  }
}

function drawExit(ctx, world) {
  if (!world.exit) return;
  const { x, y } = world.exit;
  ctx.fillStyle = world.keycard ? COL.exit : 'rgba(75,224,122,0.25)';
  ctx.fillRect(x - TILE / 2 + 4, y - TILE / 2 + 4, TILE - 8, TILE - 8);
  ctx.fillStyle = '#08130c';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(world.keycard ? 'LOCK' : 'EXIT', x, y);
}

function drawKeycard(ctx, key, time) {
  const bob = Math.sin(time * 3) * 3;
  ctx.save();
  ctx.translate(key.x, key.y + bob);
  ctx.rotate(Math.sin(time * 1.4) * 0.25);
  ctx.fillStyle = COL.key;
  ctx.fillRect(-11, -7, 22, 14);
  ctx.fillStyle = '#5a4a10';
  ctx.fillRect(-7, -3, 5, 6);
  ctx.restore();
}

function drawPlayer(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // Soft shadow ring showing your own light level.
  const lit = p.lightLevel;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER.radius + 6 + Math.sin(time * 5) * 1.5 * lit, 0, Math.PI * 2);
  ctx.strokeStyle = lit > 0.5 ? 'rgba(255,120,90,0.6)' : 'rgba(89,214,242,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COL.playerBody;
  ctx.beginPath(); ctx.arc(0, 0, PLAYER.radius + 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COL.player;
  ctx.beginPath(); ctx.arc(0, 0, PLAYER.radius - 1, 0, Math.PI * 2); ctx.fill();
  // Facing nub.
  ctx.fillStyle = '#eaf7ff';
  ctx.beginPath();
  ctx.arc(Math.cos(p.dir) * 6, Math.sin(p.dir) * 6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGuards(ctx, guards, time) {
  for (const g of guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = COL.guardBody;
    ctx.beginPath(); ctx.arc(0, 0, GUARD.radius + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g.state === 'chase' ? COL.chase : COL.guard;
    ctx.beginPath(); ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    // Visor pointing along dir.
    ctx.strokeStyle = '#1a0e02'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(g.dir) * 2, Math.sin(g.dir) * 2);
    ctx.lineTo(Math.cos(g.dir) * (GUARD.radius + 1), Math.sin(g.dir) * (GUARD.radius + 1));
    ctx.stroke();
    // Suspicion arc above the guard.
    if (g.suspicion > 0.02) {
      const pct = Math.min(1, g.suspicion);
      ctx.strokeStyle = g.suspicion >= 1 ? COL.chase : '#ffd23e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -GUARD.radius - 8, 7, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Darkness overlay: lamps punch light back out of the veil.
function drawLighting(ctx, world, guards) {
  ctx.fillStyle = `rgba(4, 6, 12, ${1 - LIGHT.ambient})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const lamp of world.lamps) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, TILE * 3.2);
    glow.addColorStop(0, 'rgba(0,0,0,0.95)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, TILE * 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawHud(ctx, game) {
  const { player, levelIndex, levelName, brief, time } = game;
  ctx.fillStyle = COL.hud;
  ctx.fillRect(8, 8, 470, 58);
  ctx.fillStyle = '#cfd6e4';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`LEVEL ${levelIndex + 1} — ${levelName}`, 16, 14);
  ctx.font = '12px monospace';
  ctx.fillText(brief, 16, 34);
  // Detection meter.
  const danger = player.danger;
  ctx.fillStyle = '#20242f';
  ctx.fillRect(16, 50, 180, 10);
  ctx.fillStyle = danger > 0.66 ? COL.chase : danger > 0.3 ? '#ffd23e' : '#4be07a';
  ctx.fillRect(16, 50, 180 * Math.min(1, danger), 10);
  ctx.fillStyle = '#cfd6e4';
  ctx.fillText(worldKeyLabel(game), 210, 50);
  // Timer top right.
  ctx.textAlign = 'right';
  const t = Math.floor(time);
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, VIEW_W - 16, 14);
}

function worldKeyLabel(game) {
  if (game.world.keycard) return 'KEYCARD ✓  reach the exit';
  return 'find the keycard';
}
