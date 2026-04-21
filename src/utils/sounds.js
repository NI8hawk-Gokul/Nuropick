/**
 * NeuroPick Sound Effects — Web Audio API (no external files needed)
 */

class SoundEngine {
  constructor() {
    this._ctx = null;
    this._enabled = localStorage.getItem('np_sound') !== 'off';
  }

  get enabled() { return this._enabled; }
  set enabled(val) {
    this._enabled = val;
    localStorage.setItem('np_sound', val ? 'on' : 'off');
  }

  _ctx_get() {
    if (!this._ctx) {
      try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    return this._ctx;
  }

  _play(notes, type = 'sine', vol = 0.18) {
    if (!this._enabled) return;
    const ctx = this._ctx_get();
    if (!ctx) return;
    let t = ctx.currentTime;
    notes.forEach(([freq, dur, start = 0]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(vol, t + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.start(t + start);
      osc.stop(t + start + dur + 0.05);
    });
  }

  /** Soft blip — button click / nav */
  click() { this._play([[660, 0.08]], 'sine', 0.12); }

  /** Ascending 2-note chime — product selected */
  select() { this._play([[520, 0.12, 0], [780, 0.18, 0.1]], 'sine', 0.15); }

  /** Pulsing hum — while analyzing / loading */
  analyzing() { this._play([[220, 0.35, 0], [260, 0.35, 0.3]], 'triangle', 0.08); }

  /** 3-note celebration — success / review submitted */
  success() { this._play([[523, 0.1, 0], [659, 0.1, 0.12], [784, 0.22, 0.24]], 'sine', 0.18); }

  /** Low descending buzz — error */
  error() { this._play([[300, 0.08, 0], [200, 0.15, 0.08]], 'sawtooth', 0.1); }

  /** Star rating hover — tiny tick */
  tick() { this._play([[880, 0.04]], 'square', 0.06); }

  /** Theme switch */
  themeSwitch() { this._play([[440, 0.07, 0], [550, 0.07, 0.07]], 'sine', 0.1); }
}

const sounds = new SoundEngine();
export default sounds;
