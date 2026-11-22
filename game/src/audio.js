// WebAudio sound: footsteps, alarm blips, pickup chime, all synthesised, no assets.

let ctx = null;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type = 'sine', gain = 0.08, slide = 0) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

export const sound = {
  step(sneaking) {
    blip(sneaking ? 90 : 130, 0.05, 'triangle', sneaking ? 0.02 : 0.05, -30);
  },
  pickup() {
    blip(660, 0.1, 'square', 0.05);
    setTimeout(() => blip(880, 0.12, 'square', 0.05), 90);
  },
  spotted() {
    blip(300, 0.25, 'sawtooth', 0.09, 300);
  },
  caught() {
    blip(200, 0.5, 'sawtooth', 0.12, -150);
    setTimeout(() => blip(140, 0.6, 'sawtooth', 0.1, -90), 200);
  },
  win() {
    blip(523, 0.12, 'square', 0.06);
    setTimeout(() => blip(659, 0.12, 'square', 0.06), 110);
    setTimeout(() => blip(784, 0.2, 'square', 0.06), 220);
  },
  click() { blip(440, 0.04, 'square', 0.03); },
};
