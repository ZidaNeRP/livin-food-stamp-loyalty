/* Celebration sounds, synthesised with Web Audio so no audio files are needed. */
(function () {
  'use strict';
  let ctx = null;
  let master = null;

  function audio() {
    if (!Sound.enabled) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, start, dur, type, peak) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

  const Sound = {
    enabled: true,

    /** Call from a click handler so browsers allow audio later on. */
    unlock() {
      audio();
    },

    /** Rubber stamp hitting the card. */
    thud() {
      if (!audio()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.3);

      const len = Math.floor(ctx.sampleRate * 0.07);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = ctx.createBufferSource();
      const f = ctx.createBiquadFilter();
      const ng = ctx.createGain();
      src.buffer = buf;
      f.type = 'lowpass';
      f.frequency.value = 1400;
      ng.gain.value = 0.45;
      src.connect(f).connect(ng).connect(master);
      src.start(t);
    },

    /** Rising chime, one note higher per stamp in the same order. */
    chime(step) {
      if (!audio()) return;
      const t = ctx.currentTime + 0.04;
      const f = NOTES[Math.min(step + 2, NOTES.length - 1)];
      tone(f, t, 0.45, 'triangle', 0.35);
      tone(f * 2, t, 0.3, 'sine', 0.08);
    },

    /** Gift box opening. */
    fanfare() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.02;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.11, 0.3, 'triangle', 0.35));
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(f, t + 0.5, 1.1, 'triangle', 0.18));
      [2093, 2637, 3136].forEach((f, i) => tone(f, t + 0.55 + i * 0.07, 0.25, 'sine', 0.05));
    },
  };

  window.LFS = window.LFS || {};
  window.LFS.sound = Sound;
})();
