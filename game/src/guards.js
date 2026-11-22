// Guard behaviour: patrol waypoints, suspicion, alarm chase, return to patrol.

import { GUARD } from './config.js';
import { guardSees, hearsNoise } from './vision.js';

const PATROL = 'patrol', CHASE = 'chase', SEARCH = 'search';

export class Guard {
  constructor(world, path, index) {
    const base = path.length ? path : [{ x: world.playerStart.x + 200, y: world.playerStart.y }];
    this.path = base.length > 1 ? base
      : (world.patrolLoop(base[0].x, base[0].y).length ? world.patrolLoop(base[0].x, base[0].y) : base);
    this.wp = 0;
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.dir = 0;
    this.fov = GUARD.fov;
    this.range = GUARD.range;
    this.rangeDark = GUARD.rangeDark;
    this.state = PATROL;
    this.suspicion = 0;       // 0..1, fills while seeing the player
    this.timer = 0;           // waypoint pause / search countdown
    this.faceTarget = null;   // {x,y} to look at while alerted
    this.index = index;
    this.phase = Math.random() * 0.2;
  }

  update(dt, world, player, game) {
    const sight = guardSees(world, this, player);

    if (sight.seen) {
      this.suspicion = Math.min(1.4, this.suspicion + GUARD.detectRate * sight.strength * dt);
      this.faceTarget = { x: player.x, y: player.y };
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.decayRate * dt);
    }

    if (this.suspicion >= 1) {
      if (this.state !== CHASE) game.onSpotted(this);
      this.state = CHASE;
      this.timer = GUARD.alertHold;
    } else if (this.state === CHASE && this.suspicion < 0.5) {
      this.state = SEARCH;
      this.timer = GUARD.alertHold;
    } else if (this.state === SEARCH && this.timer <= 0) {
      this.state = PATROL;
    }

    // Hearing: walking player nearby wakes a patrolling guard's attention.
    if (this.state === PATROL && hearsNoise(player, this)) {
      this.suspicion = Math.min(0.7, this.suspicion + 0.9 * dt);
      this.faceTarget = { x: player.x, y: player.y };
    }

    switch (this.state) {
      case CHASE: this.chase(dt, world, player); break;
      case SEARCH: this.search(dt, world); break;
      default: this.patrol(dt, world);
    }
  }

  patrol(dt, world) {
    this.timer -= dt;
    const target = this.path[this.wp];
    if (this.stepToward(dt, target.x, target.y, GUARD.speed, world)) {
      if (this.timer <= 0) {
        this.timer = GUARD.pauseAtWaypoint;
        this.wp = (this.wp + 1) % this.path.length;
      }
    }
  }

  chase(dt, world, player) {
    this.timer -= dt;
    this.stepToward(dt, player.x, player.y, GUARD.chaseSpeed, world);
    if (Math.hypot(player.x - this.x, player.y - this.y) < GUARD.catchRadius) {
      game.onCaught(this);
    }
    // Lost the player entirely: hunt the last seen spot, then search.
    if (this.faceTarget && this.timer <= 0) {
      this.state = SEARCH;
      this.timer = GUARD.alertHold;
    }
  }

  search(dt, world) {
    this.timer -= dt;
    if (this.faceTarget) {
      if (this.stepToward(dt, this.faceTarget.x, this.faceTarget.y, GUARD.speed, world)) {
        this.faceTarget = null;
      }
    }
    if (this.timer <= 0) { this.state = PATROL; this.faceTarget = null; }
  }

  // Move one step; returns true when arrived.
  stepToward(dt, tx, ty, speed, world) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) { this.face(tx, ty); return true; }
    const step = Math.min(dist, speed * dt);
    const ux = dx / dist, uy = dy / dist;
    let nx = this.x + ux * step, ny = this.y + uy * step;
    if (world) {
      // Simple unstick: try sliding along an axis when the direct move is blocked.
      const moved = world.moveCircle(this.x, this.y, GUARD.radius, ux * step, uy * step);
      if (Math.hypot(moved.x - this.x, moved.y - this.y) < step * 0.4) {
        const alt = world.moveCircle(this.x, this.y, GUARD.radius, ux * step, 0);
        if (Math.hypot(alt.x - this.x, alt.y - this.y) >= step * 0.4) moved.x = alt.x;
        else {
          const alt2 = world.moveCircle(this.x, this.y, GUARD.radius, 0, uy * step);
          moved.x = alt2.x; moved.y = alt2.y;
        }
      }
      nx = moved.x; ny = moved.y;
    }
    this.face(nx + (nx - this.x), ny + (ny - this.y));
    this.x = nx; this.y = ny;
    return false;
  }

  face(x, y) {
    this.dir = Math.atan2(y - this.y, x - this.x);
  }

  isAlert() { return this.state === CHASE || this.suspicion > 0.25; }
}
