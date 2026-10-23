/**
 * Procedural Web Audio API Sound Synthesizer & Vice City Radio Engine
 * 100% Offline, Zero external audio files required.
 * Features:
 * - Real-time vehicle engine synthesis (idle to redline)
 * - Police sirens and multi-tier horns
 * - Vice City 80s procedural radio stations: Flash FM, Wave 103, V-Rock
 * - Nitro turbo spool & exhaust pops
 * - Pay 'n' Spray aerosol can hiss
 * - Insane Stunt Jump fanfare
 * - Gunfire, bullet impacts, punches, and crash collisions
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenInterval = null;
    this.isSirenPlaying = false;

    // Radio stations system
    this.radioStations = [
      { id: 'flash', name: 'Flash FM', genre: '80s Synth-Pop', color: '#ff7675' },
      { id: 'wave', name: 'Wave 103', genre: 'Dark Wave & Electro', color: '#00d2d3' },
      { id: 'vrock', name: 'V-Rock', genre: 'Hard Rock & Heavy Metal', color: '#f39c12' },
      { id: 'off', name: 'Radio Off', genre: 'Engine Only', color: '#718093' }
    ];
    this.currentStationIndex = 0; // Default: Flash FM
    this.radioInterval = null;
    this.radioGain = null;
    this.radioStep = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initEngineSynth();
      this.initRadioGain();
    } catch (e) {
      console.warn('Web Audio API not supported on this browser:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.radioGain) this.radioGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.stopSiren();
    } else {
      if (this.radioGain && this.currentStation.id !== 'off') {
        this.radioGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }

  /* =========================================================================
   * VEHICLE ENGINE SYNTHESIZER
   * ========================================================================= */

  initEngineSynth() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, this.ctx.currentTime);

    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
  }

  updateEngine(speedRatio, isDriving) {
    if (!this.ctx || this.isMuted || !this.engineGain) return;
    const now = this.ctx.currentTime;

    if (!isDriving) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.1);
      return;
    }

    // Modulate pitch from 55Hz (idle) to 320Hz (top speed)
    const targetFreq = 55 + Math.min(speedRatio, 1.4) * 220;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);

    const targetGain = 0.08 + Math.min(speedRatio, 1.0) * 0.12;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  /* =========================================================================
   * PROCEDURAL 80s VICE CITY RADIO STATIONS
   * ========================================================================= */

  initRadioGain() {
    if (!this.ctx) return;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    this.radioGain.connect(this.ctx.destination);
    this.startRadio();
  }

  get currentStation() {
    return this.radioStations[this.currentStationIndex];
  }

  nextStation() {
    this.init();
    this.resume();
    this.currentStationIndex = (this.currentStationIndex + 1) % this.radioStations.length;
    const station = this.currentStation;

    if (station.id === 'off') {
      if (this.radioGain) this.radioGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.radioGain && !this.isMuted) this.radioGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      this.playRadioTuningChime();
    }

    return station;
  }

  playRadioTuningChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Static burst followed by radio tone
    const burst = this.ctx.createBufferSource();
    const bSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
    burst.buffer = buf;
    burst.connect(this.ctx.destination);
    burst.start(now);

    const tone = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(880, now + 0.04);
    g.gain.setValueAtTime(0.08, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    tone.connect(g);
    g.connect(this.ctx.destination);
    tone.start(now + 0.04);
    tone.stop(now + 0.14);
  }

  startRadio() {
    if (this.radioInterval) clearInterval(this.radioInterval);

    // 16th-note procedural rhythm sequencer (~124 BPM)
    const stepTime = 125; // ms per 16th note
    this.radioInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || this.currentStation.id === 'off') return;
      this.tickRadioStep();
      this.radioStep = (this.radioStep + 1) % 32;
    }, stepTime);
  }

  tickRadioStep() {
    const station = this.currentStation.id;
    const now = this.ctx.currentTime;
    const s = this.radioStep;

    if (station === 'flash') {
      // FLASH FM: Upbeat 80s synth-pop arpeggios & kick/snare
      // 1. Kick on 0, 4, 8, 12, 16, 20, 24, 28
      if (s % 4 === 0) this.synthDrumKick(now);
      // 2. Snare on 4, 12, 20, 28
      if (s % 8 === 4) this.synthDrumSnare(now);
      // 3. Synth arpeggio (F#m - D - A - E progression)
      const flashNotes = [370, 440, 554, 440, 293, 370, 440, 370, 220, 277, 330, 277, 330, 392, 493, 392];
      const freq = flashNotes[s % flashNotes.length];
      this.synthPopLead(now, freq, 0.08, 'sawtooth');
    } else if (station === 'wave') {
      // WAVE 103: Dark new wave electro pulsing octave bassline
      if (s % 4 === 0) this.synthDrumKick(now);
      if (s % 8 === 4) this.synthDrumSnare(now);

      // Pumping bassline
      const bassRoots = [110, 110, 220, 110, 130.8, 130.8, 261.6, 130.8];
      const freq = bassRoots[s % bassRoots.length];
      this.synthPopLead(now, freq, 0.1, 'square');
    } else if (station === 'vrock') {
      // V-ROCK: Heavy power chord riffs & fast drums
      if (s % 2 === 0) this.synthDrumKick(now);
      if (s % 4 === 2) this.synthDrumSnare(now);

      // Distorted power chord chugs (E5 - G5 - A5 - D5)
      const chords = [82.4, 82.4, 98.0, 82.4, 110.0, 110.0, 73.4, 82.4];
      const freq = chords[Math.floor(s / 4) % chords.length];
      this.synthRockChug(now, freq);
    }
  }

  synthPopLead(time, freq, dur, type = 'sawtooth') {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + dur);

    g.gain.setValueAtTime(0.045, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.radioGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  synthRockChug(time, freq) {
    if (!this.ctx || !this.radioGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.498, time); // Fifth for power chord

    g.gain.setValueAtTime(0.04, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(this.radioGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.18);
    osc2.stop(time + 0.18);
  }

  synthDrumKick(time) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(g);
    g.connect(this.radioGain);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  synthDrumSnare(time) {
    if (!this.ctx || !this.radioGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.12;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.06, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    noise.connect(g);
    g.connect(this.radioGain);

    noise.start(time);
  }

  /* =========================================================================
   * NITRO, STUNT, RESPLAY & COMBAT SOUND EFFECTS
   * ========================================================================= */

  playNitro() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // High turbo spool whistle
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(3200, now + 0.35);

    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playStuntFanfare() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Glorious fanfare notes (C5 -> E5 -> G5 -> C6)
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      g.gain.setValueAtTime(0.15, now + idx * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);

      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.3);
    });
  }

  playPayAndSpray() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Spray can rattle ball
    const rattleOsc = this.ctx.createOscillator();
    const rg = this.ctx.createGain();
    rattleOsc.type = 'square';
    rattleOsc.frequency.setValueAtTime(600, now);
    rg.gain.setValueAtTime(0.08, now);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    rattleOsc.connect(rg);
    rg.connect(this.ctx.destination);
    rattleOsc.start(now);
    rattleOsc.stop(now + 0.1);

    // Aerosol paint hiss
    const dur = 0.55;
    const bSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) data[i] = (Math.random() * 2 - 1) * 0.18;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now + 0.1);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);

    noise.start(now + 0.1);
  }

  playHorn() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(349.23, now); // F4
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440.00, now); // A4

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);
  }

  startSiren() {
    if (!this.ctx || this.isMuted || this.isSirenPlaying) return;
    this.resume();
    this.isSirenPlaying = true;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sine';
    this.sirenOsc.frequency.setValueAtTime(560, this.ctx.currentTime);
    this.sirenGain.gain.setValueAtTime(0.11, this.ctx.currentTime);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.ctx.destination);
    this.sirenOsc.start();

    let high = true;
    this.sirenInterval = setInterval(() => {
      if (!this.ctx || !this.sirenOsc || this.isMuted) return;
      const freq = high ? 780 : 560;
      this.sirenOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
      high = !high;
    }, 380);
  }

  stopSiren() {
    this.isSirenPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
    }
  }

  playCash() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  }

  playGunshot(isHeavy = false) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = isHeavy ? 0.24 : 0.15;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playPunch() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCrash(intensity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = 0.35 * Math.min(intensity, 1.5);
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28 * Math.min(intensity, 1.4), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }
}

const audio = new SoundEngine();

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.audio = audio;
}
