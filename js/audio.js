/**
 * Procedural Web Audio API Sound Synthesizer & Haryanvi Music Radio Engine
 * 100% Offline, Zero external audio files required.
 * Features:
 * - Real-time vehicle engine synthesis (idle to redline)
 * - Police sirens and multi-tier horns (including Tata Truck musical chime & Auto Rickshaw horn)
 * - Haryanvi Desi Music Radio Stations:
 *   1. HR 26 Haryanvi Ragini (Authentic Dholak & Been folk hook)
 *   2. Thar Desi Bass Boost (Heavy sub-bass & 808 trap drops)
 *   3. Yaar Badmaash Radio (Gangster Haryanvi brass & swagger dholak)
 *   4. System Hang DJ Mix (High-tempo desi banger & fast synth arps)
 *   5. Radio Off
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

    // Haryanvi Desi Music Radio stations system
    this.radioStations = [
      { id: 'hr_ragini', name: 'HR 26 Haryanvi Ragini', genre: 'Desi Dholak & Been Hook', color: '#f39c12', icon: '🪕' },
      { id: 'thar_bass', name: 'Thar Desi Bass Boost', genre: 'Sub-Bass Haryanvi Drift', color: '#ff3838', icon: '🔥' },
      { id: 'badmaash', name: 'Yaar Badmaash Radio', genre: 'Gangster Haryanvi Swag', color: '#9b59b6', icon: '👑' },
      { id: 'system_hang', name: 'System Hang DJ Mix', genre: 'High-Tempo Desi Bangers', color: '#00d2d3', icon: '⚡' },
      { id: 'off', name: 'Radio Off', genre: 'Engine Only', color: '#718093', icon: '🔇' }
    ];
    this.currentStationIndex = 0; // Default: HR 26 Haryanvi Ragini
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
        this.radioGain.gain.setValueAtTime(0.11, this.ctx.currentTime);
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

    const targetFreq = 55 + Math.min(speedRatio, 1.4) * 220;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);

    const targetGain = 0.08 + Math.min(speedRatio, 1.0) * 0.12;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  /* =========================================================================
   * PROCEDURAL HARYANVI DESI MUSIC RADIO ENGINE
   * ========================================================================= */

  initRadioGain() {
    if (!this.ctx) return;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.11, this.ctx.currentTime);
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
      if (this.radioGain && !this.isMuted) this.radioGain.gain.setValueAtTime(0.11, this.ctx.currentTime);
      this.playRadioTuningChime();
    }

    return station;
  }

  playRadioTuningChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Tuning static sweep
    const burst = this.ctx.createBufferSource();
    const bSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    burst.buffer = buf;
    burst.connect(this.ctx.destination);
    burst.start(now);

    // Haryanvi Tumba pluck tone
    const tone = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(587.33, now + 0.03); // D5
    g.gain.setValueAtTime(0.12, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    tone.connect(g);
    g.connect(this.ctx.destination);
    tone.start(now + 0.03);
    tone.stop(now + 0.15);
  }

  startRadio() {
    if (this.radioInterval) clearInterval(this.radioInterval);

    // 16th-note syncopated Haryanvi rhythm sequencer (~126 BPM)
    const stepTime = 120; // ms per 16th note
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

    if (station === 'hr_ragini') {
      // 1. HR 26 HARYANVI RAGINI (Authentic Dholak Geh & Chaati with Been/Pungi Hook)
      // Dholak Bass Drum (Dhuma / Geh) on syncopated 0, 3, 6, 8, 10, 14
      if ([0, 3, 6, 8, 10, 14, 16, 19, 22, 24, 26, 30].includes(s)) {
        this.synthDholakBass(now, 115, 42);
      }
      // Dholak Sharp Slap (Chaati / Ta) on 2, 4, 7, 12, 15, 18, 20, 23, 28, 31
      if ([2, 4, 7, 12, 15, 18, 20, 23, 28, 31].includes(s)) {
        this.synthDholakSlap(now);
      }

      // Haryanvi Folk Been / Tumba Lead Hook (D minor / Bhairav scale: D - F# - G - A - C - B - A)
      const raginiNotes = [
        293.66, 293.66, 369.99, 392.00, 440.00, 523.25, 493.88, 440.00,
        392.00, 369.99, 392.00, 440.00, 369.99, 329.63, 293.66, 293.66,
        440.00, 440.00, 523.25, 587.33, 523.25, 493.88, 440.00, 392.00,
        369.99, 392.00, 440.00, 369.99, 329.63, 293.66, 293.66, 293.66
      ];
      const freq = raginiNotes[s % raginiNotes.length];
      this.synthBeenLead(now, freq, 0.11);

    } else if (station === 'thar_bass') {
      // 2. THAR DESI BASS BOOST (Heavy Sub-Bass & 808s for Off-Road Cruising)
      // Low punchy 808 kick on 0, 4, 8, 12, 16, 20, 24, 28
      if (s % 4 === 0) {
        this.synthDholakBass(now, 140, 35);
      }
      // Sharp snare clap on 4, 12, 20, 28
      if (s % 8 === 4) {
        this.synthDholakSlap(now);
      }
      // Dholak roll fills on beat 14-15 and 30-31
      if (s === 14 || s === 15 || s === 30 || s === 31) {
        this.synthDholakSlap(now);
      }

      // Heavy 808 Sub-Bass Line (F - G - D - C progression)
      const subNotes = [87.31, 87.31, 98.00, 73.42, 65.41, 65.41, 73.42, 73.42];
      const subFreq = subNotes[Math.floor(s / 4) % subNotes.length];
      this.synthDesi808(now, subFreq);

      // Synth whistle lead hook
      if (s % 2 === 0) {
        const lead = [587.33, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33];
        this.synthBeenLead(now, lead[(s / 2) % lead.length], 0.08);
      }

    } else if (station === 'badmaash') {
      // 3. YAAR BADMAASH RADIO (Gangster Haryanvi Swag with Brass Stabs & Dholak)
      if ([0, 4, 8, 12, 16, 20, 24, 28].includes(s)) {
        this.synthDholakBass(now, 120, 38);
      }
      if ([4, 12, 20, 28].includes(s)) {
        this.synthDholakSlap(now);
      }
      // Offbeat syncopated dholak taps
      if ([2, 6, 10, 14, 18, 22, 26, 30].includes(s)) {
        this.synthDholakSlap(now);
      }

      // Heavy brass power stabs on offbeats
      if (s % 4 === 2) {
        this.synthBrassStab(now, 146.83); // D3 brass
      }

      // Swagger lead melody (Gangster slow groove)
      const swagNotes = [293.66, 311.13, 369.99, 392.00, 440.00, 392.00, 369.99, 311.13];
      const freq = swagNotes[Math.floor(s / 4) % swagNotes.length];
      this.synthBeenLead(now, freq, 0.18);

    } else if (station === 'system_hang') {
      // 4. SYSTEM HANG DJ MIX (High-Tempo Desi Bangers with Fast Arpeggios & Dhol)
      // Double time dholak kicks
      if (s % 2 === 0) {
        this.synthDholakBass(now, 130, 42);
      }
      if (s % 4 === 2) {
        this.synthDholakSlap(now);
      }

      // High-speed EDM / Desi synth bends
      const djArp = [392.00, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00];
      const freq = djArp[s % djArp.length];
      this.synthBeenLead(now, freq, 0.07);
    }
  }

  /* =========================================================================
   * HARYANVI INSTRUMENT SYNTHESIZERS
   * ========================================================================= */

  synthDholakBass(time, startFreq = 115, endFreq = 40) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.12);

    g.gain.setValueAtTime(0.20, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(g);
    g.connect(this.radioGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  synthDholakSlap(time) {
    if (!this.ctx || !this.radioGain) return;

    // High resonant ping of the Dholak rim
    const ping = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1250, time);
    ping.frequency.exponentialRampToValueAtTime(600, time + 0.05);
    pg.gain.setValueAtTime(0.12, time);
    pg.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    ping.connect(pg);
    pg.connect(this.radioGain);
    ping.start(time);
    ping.stop(time + 0.05);

    // Acoustic skin snap noise
    const bSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.09, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(g);
    g.connect(this.radioGain);
    noise.start(time);
  }

  synthBeenLead(time, freq, dur) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Haryanvi reed/pungi sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    // Subtle Indian microtonal glide / vibrato
    osc.frequency.linearRampToValueAtTime(freq * 1.015, time + dur * 0.5);
    osc.frequency.linearRampToValueAtTime(freq, time + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(3.5, time);

    g.gain.setValueAtTime(0.065, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.radioGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  synthDesi808(time, freq) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.2, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08);

    g.gain.setValueAtTime(0.18, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(g);
    g.connect(this.radioGain);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  synthBrassStab(time, freq) {
    if (!this.ctx || !this.radioGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.498, time);

    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(this.radioGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.16);
    osc2.stop(time + 0.16);
  }

  /* =========================================================================
   * NITRO, STUNT, RESPLAY, HORN & COMBAT SOUND EFFECTS
   * ========================================================================= */

  playNitro() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

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

  playHorn(typeKey = null) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    if (typeKey === 'DESI_TRUCK') {
      [293.66, 369.99, 440.00, 587.33].forEach((f, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(0.14, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.16);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 0.16);
      });
      return;
    }

    if (typeKey === 'AUTO_RICKSHAW') {
      [780, 840].forEach(f => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(now);
        o.stop(now + 0.2);
      });
      return;
    }

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(349.23, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440.00, now);

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
