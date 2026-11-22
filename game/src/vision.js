// Vision cones: what a guard sees, and where the player stands in light or shadow.

import { GUARD, TILE } from './config.js';

// Is the point inside a guard's vision cone?
export function inCone(guard, x, y) {
  const dx = x - guard.x, dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.range) return false;
  const ang = Math.atan2(dy, dx);
  let diff = Math.abs(((ang - guard.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  return diff <= guard.fov / 2;
}

// How strongly a guard sees the player right now: 0 hidden, up to 1 fully lit and close.
// Returns { seen: bool, strength } — strength scales suspicion fill speed.
export function guardSees(world, guard, player) {
  if (!inCone(guard, player.x, player.y)) return { seen: false, strength: 0 };
  if (!world.clearLine(guard.x, guard.y, player.x, player.y)) return { seen: false, strength: 0 };
  const lamp = world.lampLight(player.x, player.y);
  // In deep shadow the cone is effectively shorter.
  if (lamp < 0.15 && Math.hypot(player.x - guard.x, player.y - guard.y) > GUARD.rangeDark) {
    return { seen: false, strength: 0 };
  }
  const closeness = 1 - Math.min(1, Math.hypot(player.x - guard.x, player.y - guard.y) / guard.range);
  const strength = Math.min(1, 0.35 + 0.5 * lamp + 0.4 * closeness);
  // Sneaking and standing still make you harder to notice in dim light.
  const dim = lamp < 0.35;
  if (dim && player.sneaking && !player.moving) strength *= 0.35;
  else if (dim && player.sneaking) strength *= 0.6;
  return { seen: true, strength };
}

// Footstep noise: guards within earshot turn toward the sound when you walk (not sneak).
export function hearsNoise(player, guard) {
  const radius = player.moving ? (player.sneaking ? 34 : 110) : 0;
  if (radius === 0) return false;
  return Math.hypot(player.x - guard.x, player.y - guard.y) < radius;
}

// Cone geometry for rendering: fan of points clamped by walls.
export function conePoly(world, guard, quality = 24) {
  const pts = [{ x: guard.x, y: guard.y }];
  const half = guard.fov / 2;
  for (let i = 0; i <= quality; i++) {
    const a = guard.dir - half + (guard.fov * i) / quality;
    let d = guard.range;
    const step = TILE / 4;
    let t = step;
    while (t < d) {
      if (world.blocksSight(guard.x + Math.cos(a) * t, guard.y + Math.sin(a) * t)) { d = t; break; }
      t += step;
    }
    pts.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return pts;
}
