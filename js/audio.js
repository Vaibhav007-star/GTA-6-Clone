/**
 * Procedural Web Audio API Sound Synthesizer
 * 100% Offline, Zero external audio files required.
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
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initEngineSynth();
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
      this.stopSiren();
    }
    return this.isMuted;
  }

  initEngineSynth() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low idle rumble

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

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

    // Modulate pitch from 55Hz (idle) to 280Hz (top speed)
    const targetFreq = 55 + Math.min(speedRatio, 1.2) * 190;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);

    // Target volume
    const targetGain = 0.08 + Math.min(speedRatio, 1.0) * 0.12;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
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
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * Math.min(intensity, 1.2), now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playTireScreech() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playHorn() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    [415, 466].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  playDoor() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  startSiren() {
    if (!this.ctx || this.isMuted || this.isSirenPlaying) return;
    this.resume();
    this.isSirenPlaying = true;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sine';
    this.sirenGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.ctx.destination);
    this.sirenOsc.start();

    let high = true;
    this.sirenInterval = setInterval(() => {
      if (!this.ctx || !this.sirenOsc || this.isMuted) return;
      const freq = high ? 760 : 540;
      this.sirenOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
      high = !high;
    }, 400);
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
    const duration = isHeavy ? 0.22 : 0.14;
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
    filter.frequency.setValueAtTime(2400, now);
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
}

const audio = new SoundEngine();

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.audio = audio;
}

