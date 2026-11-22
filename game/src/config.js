// Tuning constants for Umbral Vault.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 600

export const PLAYER = {
  radius: 9,
  walkSpeed: 130,   // px/s
  sneakSpeed: 62,
  noiseWalk: 110,   // hearing radius while walking
  noiseSneak: 34,
};

export const GUARD = {
  radius: 10,
  speed: 88,
  chaseSpeed: 148,
  fov: Math.PI / 3,       // 60 degree cone
  range: 200,
  rangeDark: 110,         // guards see less far in shadow
  detectRate: 1.7,        // suspicion per second in full light
  decayRate: 0.8,
  catchRadius: 16,
  alertHold: 6,           // seconds a guard stays alerted after losing you
  pauseAtWaypoint: 0.8,
};

export const DETECT = {
  spottedAt: 1.0,         // suspicion that triggers the alarm
};

export const LIGHT = {
  ambient: 0.30,          // base darkness of the floor
};
