// Screens and game state machine: title, briefing, play, caught, level clear, victory.

import { VIEW_W, VIEW_H } from './config.js';

export const STATE = { TITLE: 'title', BRIEF: 'brief', PLAY: 'play', CAUGHT: 'caught', CLEAR: 'clear', WIN: 'win' };

export function drawScreen(ctx, game) {
  ctx.fillStyle = '#07080d';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  switch (game.state) {
    case STATE.TITLE: return drawTitle(ctx, game);
    case STATE.BRIEF: return drawBrief(ctx, game);
    case STATE.PLAY: return; // world render handles it
    case STATE.CAUGHT: return drawCaught(ctx, game);
    case STATE.CLEAR: return drawClear(ctx, game);
    case STATE.WIN: return drawWin(ctx, game);
  }
}

function titleArt(ctx, game) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#59d6f2';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('UMBRA', VIEW_W / 2, 170);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('V A U L T', VIEW_W / 2, 212);
  // A little vignette art: two cones and a thief.
  ctx.save();
  ctx.translate(VIEW_W / 2, 330);
  ctx.fillStyle = 'rgba(255,214,110,0.12)';
  ctx.beginPath();
  ctx.moveTo(-140, 20);
  ctx.lineTo(-40, -60); ctx.lineTo(20, -30); ctx.lineTo(40, 60);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0903a';
  ctx.beginPath(); ctx.arc(-140, 20, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#59d6f2';
  ctx.beginPath(); ctx.arc(30, 34, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(89,214,242,0.5)';
  ctx.beginPath(); ctx.arc(30, 34, 15, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#4be07a';
  ctx.fillRect(120, 20, 46, 46);
  ctx.fillStyle = '#08130c';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('EXIT', 143, 44);
  ctx.restore();
}

function drawTitle(ctx, game) {
  titleArt(ctx, game);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cfd6e4';
  ctx.font = '15px monospace';
  ctx.fillText('Sneak past the guards. Stay out of the light.', VIEW_W / 2, 430);
  ctx.fillText('Grab the keycard. Reach the exit unseen.', VIEW_W / 2, 452);
  ctx.fillStyle = '#8a93a6';
  ctx.font = '13px monospace';
  ctx.fillText('WASD / arrows — move     SHIFT — sneak     R — restart level', VIEW_W / 2, 490);
  if (Math.floor(game.time * 2) % 2 === 0) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('PRESS ENTER OR CLICK TO START', VIEW_W / 2, 540);
  }
}

function drawBrief(ctx, game) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#59d6f2';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(`LEVEL ${game.levelIndex + 1}`, VIEW_W / 2, 220);
  ctx.fillStyle = '#cfd6e4';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(game.levelName, VIEW_W / 2, 262);
  ctx.font = '15px monospace';
  ctx.fillStyle = '#8a93a6';
  ctx.fillText(game.brief, VIEW_W / 2, 310);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('PRESS ENTER', VIEW_W / 2, 400);
}

function drawCaught(ctx, game) {
  drawWorldDimmed(ctx, game);
  ctx.fillStyle = 'rgba(120, 10, 5, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd9d4';
  ctx.font = 'bold 52px monospace';
  ctx.fillText('CAUGHT', VIEW_W / 2, 260);
  ctx.font = '15px monospace';
  ctx.fillText('A guard saw you. Press ENTER to try again.', VIEW_W / 2, 320);
}

function drawClear(ctx, game) {
  drawWorldDimmed(ctx, game);
  ctx.fillStyle = 'rgba(10, 40, 20, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c9f7d8';
  ctx.font = 'bold 44px monospace';
  ctx.fillText('LEVEL CLEAR', VIEW_W / 2, 250);
  ctx.font = '15px monospace';
  const t = Math.floor(game.levelTime);
  ctx.fillText(`Time ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}  —  ENTER for next level`, VIEW_W / 2, 300);
}

function drawWin(ctx, game) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4be07a';
  ctx.font = 'bold 56px monospace';
  ctx.fillText('THE VAULT IS YOURS', VIEW_W / 2, 250);
  ctx.fillStyle = '#cfd6e4';
  ctx.font = '15px monospace';
  ctx.fillText('Every floor cleared, every guard fooled.', VIEW_W / 2, 300);
  const total = Math.floor(game.totalTime);
  ctx.fillText(`Total time ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`, VIEW_W / 2, 330);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('ENTER — play again', VIEW_W / 2, 400);
}

function drawWorldDimmed(ctx, game) {
  if (game.lastWorldDraw) game.lastWorldDraw(ctx);
}
