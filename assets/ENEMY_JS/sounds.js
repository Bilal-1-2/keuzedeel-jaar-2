/**
 * sounds.js  —  Central audio manager
 *
 * HOW IT WORKS
 * ────────────
 * • Every sound has an entry in SOUND_DEFS below.
 * • If you supply a `src` path the manager tries to load that file.
 *   If the file is missing / loading fails it falls back to the
 *   built-in Web Audio API synth so the game is never silent.
 * • Call  SoundManager.play("shotgun")  anywhere; the manager handles
 *   deduplication, cooldowns, and looping automatically.
 *
 * ADDING REAL AUDIO FILES
 * ───────────────────────
 * 1. Drop your .ogg / .mp3 / .wav into  assets/sounds/
 * 2. Set the matching `src` field in SOUND_DEFS to the correct path.
 * 3. Done — the synth fallback disappears automatically once the file loads.
 */

// ─── Sound definitions ────────────────────────────────────────────────────────

const SOUND_DEFS = {
  // ── Player ────────────────────────────────────────────────────────────────
  shoot: {
    // src: "assets/sounds/shoot.ogg",
    loop: false,
    volume: 0.55,
    cooldownMs: 120,       // minimum ms between plays (rapid fire cap)
    synth: (ctx) => synthShoot(ctx),
  },
  reload: {
    // src: "assets/sounds/reload.ogg",
    loop: false,
    volume: 0.5,
    cooldownMs: 600,
    synth: (ctx) => synthReload(ctx),
  },
  footstepRun: {
    // src: "assets/sounds/footstep_run.ogg",
    loop: false,
    volume: 0.3,
    cooldownMs: 220,
    synth: (ctx) => synthFootstep(ctx, true),
  },
  footstepWalk: {
    // src: "assets/sounds/footstep_walk.ogg",
    loop: false,
    volume: 0.25,
    cooldownMs: 360,
    synth: (ctx) => synthFootstep(ctx, false),
  },
  jump: {
    // src: "assets/sounds/jump.ogg",
    loop: false,
    volume: 0.35,
    cooldownMs: 300,
    synth: (ctx) => synthJump(ctx),
  },
  land: {
    // src: "assets/sounds/land.ogg",
    loop: false,
    volume: 0.3,
    cooldownMs: 200,
    synth: (ctx) => synthLand(ctx),
  },
  grenade_throw: {
    // src: "assets/sounds/grenade_throw.ogg",
    loop: false,
    volume: 0.4,
    cooldownMs: 400,
    synth: (ctx) => synthGrenadeThrow(ctx),
  },
  explosion: {
    // src: "assets/sounds/explosion.ogg",
    loop: false,
    volume: 0.7,
    cooldownMs: 300,
    synth: (ctx) => synthExplosion(ctx),
  },
  melee: {
    // src: "assets/sounds/melee.ogg",
    loop: false,
    volume: 0.5,
    cooldownMs: 300,
    synth: (ctx) => synthMelee(ctx),
  },
  player_hit: {
    // src: "assets/sounds/player_hit.ogg",
    loop: false,
    volume: 0.5,
    cooldownMs: 200,
    synth: (ctx) => synthPlayerHit(ctx),
  },
  player_death: {
    // src: "assets/sounds/player_death.ogg",
    loop: false,
    volume: 0.6,
    cooldownMs: 2000,
    synth: (ctx) => synthPlayerDeath(ctx),
  },

  // ── Enemy ─────────────────────────────────────────────────────────────────
  enemy_anticipation: {
    // src: "assets/sounds/enemy_anticipation.ogg",
    loop: false,
    volume: 0.45,
    cooldownMs: 800,
    synth: (ctx) => synthEnemyAnticipation(ctx),
  },
  enemy_charge: {
    // src: "assets/sounds/enemy_charge.ogg",
    loop: false,
    volume: 0.5,
    cooldownMs: 1200,
    synth: (ctx) => synthEnemyCharge(ctx),
  },
  enemy_impact: {
    // src: "assets/sounds/enemy_impact.ogg",
    loop: false,
    volume: 0.55,
    cooldownMs: 400,
    synth: (ctx) => synthEnemyImpact(ctx),
  },
  enemy_hit: {
    // src: "assets/sounds/enemy_hit.ogg",
    loop: false,
    volume: 0.4,
    cooldownMs: 100,
    synth: (ctx) => synthEnemyHit(ctx),
  },
  enemy_death: {
    // src: "assets/sounds/enemy_death.ogg",
    loop: false,
    volume: 0.5,
    cooldownMs: 200,
    synth: (ctx) => synthEnemyDeath(ctx),
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  victory: {
    // src: "assets/sounds/victory.ogg",
    loop: false,
    volume: 0.6,
    cooldownMs: 3000,
    synth: (ctx) => synthVictory(ctx),
  },
};

// ─── Manager ──────────────────────────────────────────────────────────────────

class _SoundManager {
  constructor() {
    this._ctx = null;         // AudioContext, created lazily on first play
    this._buffers = {};       // name → AudioBuffer (loaded files)
    this._lastPlayed = {};    // name → timestamp of last play
    this._muted = false;
    this._masterVolume = 1.0;
  }

  // Call once after the first user interaction (e.g. clicking "Start")
  // to unlock the AudioContext on browsers that require a gesture.
  init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._preloadAll();
  }

  get muted() { return this._muted; }
  set muted(v) { this._muted = v; }

  toggleMute() {
    this._muted = !this._muted;
    return this._muted;
  }

  // ── Main play API ──────────────────────────────────────────────────────────
  play(name) {
    if (this._muted) return;
    if (!this._ctx) this.init();     // auto-init on first play

    const def = SOUND_DEFS[name];
    if (!def) { console.warn(`[Sound] Unknown sound: "${name}"`); return; }

    // Cooldown guard
    const now = performance.now();
    const last = this._lastPlayed[name] ?? 0;
    if (now - last < (def.cooldownMs ?? 0)) return;
    this._lastPlayed[name] = now;

    if (this._buffers[name]) {
      this._playBuffer(this._buffers[name], def.volume ?? 1, def.loop ?? false);
    } else {
      // Fallback: synth
      def.synth?.(this._ctx);
    }
  }

  stop(name) {
    // Stopping looped sounds requires tracking source nodes - simplified here.
    // Extend if you add looping footstep / ambience tracks.
  }

  // ── Internal ───────────────────────────────────────────────────────────────
  _preloadAll() {
    Object.entries(SOUND_DEFS).forEach(([name, def]) => {
      if (!def.src) return;
      fetch(def.src)
        .then((r) => {
          if (!r.ok) return null;        // file not found → use synth
          return r.arrayBuffer();
        })
        .then((ab) => {
          if (!ab) return;
          return this._ctx.decodeAudioData(ab);
        })
        .then((buf) => {
          if (buf) this._buffers[name] = buf;
        })
        .catch(() => { /* silent - synth fallback covers this */ });
    });
  }

  _playBuffer(buffer, volume, loop) {
    const gain = this._ctx.createGain();
    gain.gain.value = (volume ?? 1) * this._masterVolume;
    gain.connect(this._ctx.destination);

    const src = this._ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    src.connect(gain);
    src.start(0);
    return src;
  }
}

export const SoundManager = new _SoundManager();

// ─── Synth fallback sounds (Web Audio API) ────────────────────────────────────
// Each function returns immediately after scheduling nodes; no blocking.

function synthShoot(ctx) {
  // Sharp crack + short noise burst
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.start(t); osc.stop(t + 0.12);

  // noise layer
  const buf = _whiteNoise(ctx, 0.08);
  const ns = ctx.createBufferSource();
  const ng = ctx.createGain();
  ns.buffer = buf; ns.connect(ng); ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.2, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  ns.start(t);
}

function synthReload(ctx) {
  const t = ctx.currentTime;
  // Click-clack: two short clicks
  [0, 0.18].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = i === 0 ? 700 : 500;
    g.gain.setValueAtTime(0.2, t + offset);
    g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.07);
    osc.start(t + offset); osc.stop(t + offset + 0.09);
  });
}

function synthFootstep(ctx, isRun) {
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.07);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf;
  lp.type = "lowpass";
  lp.frequency.value = isRun ? 400 : 280;
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(isRun ? 0.22 : 0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  ns.start(t);
}

function synthJump(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.15);
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.start(t); osc.stop(t + 0.2);
}

function synthLand(ctx) {
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.12);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 200;
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.28, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  ns.start(t);
}

function synthGrenadeThrow(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.2);
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.start(t); osc.stop(t + 0.25);
}

function synthExplosion(ctx) {
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.9);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 600;
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  ns.start(t);

  // low thud
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "sine"; osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);
  og.gain.setValueAtTime(0.5, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc.start(t); osc.stop(t + 0.5);
}

function synthMelee(ctx) {
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.1);
  const ns = ctx.createBufferSource();
  const hp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf; hp.type = "highpass"; hp.frequency.value = 1200;
  ns.connect(hp); hp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  ns.start(t);
}

function synthPlayerHit(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sawtooth"; osc.frequency.value = 220;
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.start(t); osc.stop(t + 0.2);
}

function synthPlayerDeath(ctx) {
  const t = ctx.currentTime;
  [0, 0.1, 0.22].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300 - i * 60, t + offset);
    osc.frequency.exponentialRampToValueAtTime(60, t + offset + 0.3);
    g.gain.setValueAtTime(0.25, t + offset);
    g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.35);
    osc.start(t + offset); osc.stop(t + offset + 0.4);
  });
}

function synthEnemyAnticipation(ctx) {
  // Low rumble / growl
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.linearRampToValueAtTime(90, t + 0.35);
  g.gain.setValueAtTime(0.0, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.start(t); osc.stop(t + 0.55);
}

function synthEnemyCharge(ctx) {
  // Rising thunder
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.5);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 350;
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  ns.start(t);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(50, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.4);
  og.gain.setValueAtTime(0.25, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc.start(t); osc.stop(t + 0.5);
}

function synthEnemyImpact(ctx) {
  // Heavy thud
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.2);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 280;
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  ns.start(t);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "sine"; osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
  og.gain.setValueAtTime(0.4, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.start(t); osc.stop(t + 0.22);
}

function synthEnemyHit(ctx) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "square"; osc.frequency.value = 340;
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.start(t); osc.stop(t + 0.1);
}

function synthEnemyDeath(ctx) {
  const t = ctx.currentTime;
  const buf = _whiteNoise(ctx, 0.35);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  ns.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 500;
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  ns.start(t);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "sine"; osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
  og.gain.setValueAtTime(0.3, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
  osc.start(t); osc.stop(t + 0.4);
}

function synthVictory(ctx) {
  const t = ctx.currentTime;
  // Simple ascending fanfare arpeggio
  const notes = [261, 329, 392, 523, 659]; // C E G C E
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle"; osc.frequency.value = freq;
    const start = t + i * 0.1;
    g.gain.setValueAtTime(0.0, start);
    g.gain.linearRampToValueAtTime(0.3, start + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.start(start); osc.stop(start + 0.32);
  });
}

// ── Utility: white noise buffer ───────────────────────────────────────────────
function _whiteNoise(ctx, durationSec) {
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.ceil(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
