import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

/**
 * Self-contained procedural Web Audio API sound engine + optional Web Speech API
 * corporate-AI voice for "THE ALGORITHM THANKSGIVING DINNER".
 * Zero external audio file dependencies.
 */
export class AudioManager {
  constructor(bus = eventBus) {
    this.bus = bus;

    // Web Audio graph state
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.ambienceGain = null;
    this.sfxGain = null;
    this.compressor = null;

    // Dynamic music layer gain nodes
    this.lowLayerGain = null;
    this.medLayerGain = null;
    this.highLayerGain = null;

    // Persistent ambience/drone nodes to clean up on dispose
    this._persistentNodes = [];
    this._noiseBuffer = null;
    this._distortionCurve = null;

    // Settings
    this.settings = {
      masterVolume: 0.75,
      musicVolume: 0.55,
      sfxVolume: 0.85,
      voiceEnabled: true,
      muted: false,
    };

    // Runtime state
    this.initialized = false;
    this.disposed = false;
    this.paused = false;
    this.inEnding = false;
    this.currentHeat = typeof gameState?.argumentHeat === 'number' ? gameState.argumentHeat : 18;
    this.targetHeat = this.currentHeat;

    // Sequencer state
    this._seqInterval = null;
    this._clinkTimeout = null;
    this._stepIndex = 0;
    this._nextStepTime = 0;
    this._tempoBpm = 92;

    // Speech synthesis state
    this._preferredVoice = null;
    this._voiceListenersBound = false;
    this._lastSpeakTime = 0;

    // Unsubscribe callbacks
    this._unsubs = [];
    this._gestureHandler = null;

    this._bindEvents();
    this._bindGestureUnlock();
    this._initSpeechVoices();
  }

  // ---------------------------------------------------------------------------
  // Initialization & Gesture Unlock
  // ---------------------------------------------------------------------------

  _bindGestureUnlock() {
    if (typeof window === 'undefined') return;
    this._gestureHandler = () => {
      this.init();
    };
    window.addEventListener('pointerdown', this._gestureHandler, { passive: true });
    window.addEventListener('keydown', this._gestureHandler, { passive: true });
  }

  _removeGestureUnlock() {
    if (typeof window === 'undefined' || !this._gestureHandler) return;
    window.removeEventListener('pointerdown', this._gestureHandler);
    window.removeEventListener('keydown', this._gestureHandler);
    this._gestureHandler = null;
  }

  /**
   * Safely initializes or resumes the AudioContext on first user gesture.
   */
  init() {
    if (this.disposed) return false;
    if (typeof window === 'undefined') return false;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return false;
      }
      this._buildAudioGraph();
      this._startAmbience();
      this._startMusicScheduler();
      this.initialized = true;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.ctx.state === 'running') {
      this._removeGestureUnlock();
    }

    return true;
  }

  _buildAudioGraph() {
    const ctx = this.ctx;

    // Master dynamics compressor to keep procedural mixes smooth and prevent clipping
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.2;
    this.compressor.connect(ctx.destination);

    this.masterGain = ctx.createGain();
    this.masterGain.connect(this.compressor);

    this.musicGain = ctx.createGain();
    this.musicGain.connect(this.masterGain);

    this.ambienceGain = ctx.createGain();
    this.ambienceGain.connect(this.masterGain);

    this.sfxGain = ctx.createGain();
    this.sfxGain.connect(this.masterGain);

    // 3 Dynamic Music Layers
    this.lowLayerGain = ctx.createGain();
    this.lowLayerGain.gain.value = 1.0;
    this.lowLayerGain.connect(this.musicGain);

    this.medLayerGain = ctx.createGain();
    this.medLayerGain.gain.value = 0.0;
    this.medLayerGain.connect(this.musicGain);

    this.highLayerGain = ctx.createGain();
    this.highLayerGain.gain.value = 0.0;
    this.highLayerGain.connect(this.musicGain);

    // Pre-generate shared noise buffer (2 seconds of pink-ish noise) & distortion curve
    this._noiseBuffer = this._createNoiseBuffer(2.0);
    this._distortionCurve = this._makeDistortionCurve(28);

    this._applyVolumes(true);
    this._applyHeatMix(this.currentHeat, true);
  }

  _createNoiseBuffer(durationSec) {
    const ctx = this.ctx;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise approximation (Paul Kellet's filter)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  _makeDistortionCurve(amount = 25) {
    const samples = 256;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  // ---------------------------------------------------------------------------
  // EventBus Wiring
  // ---------------------------------------------------------------------------

  _bindEvents() {
    if (!this.bus || typeof this.bus.on !== 'function') return;

    const sub = (event, fn) => {
      const unsub = this.bus.on(event, fn);
      if (typeof unsub === 'function') this._unsubs.push(unsub);
    };

    sub('audio:sfx', (payload) => {
      const name = typeof payload === 'string' ? payload : payload?.name;
      if (name) this.playSfx(name, payload);
    });

    sub('ai:speak', (payload) => {
      this._handleAISpeak(payload);
    });

    sub('heat:changed', (payload) => {
      const heat = typeof payload === 'number'
        ? payload
        : (payload?.heat ?? payload?.argumentHeat ?? payload?.value);
      if (typeof heat === 'number' && !Number.isNaN(heat)) {
        this.targetHeat = Math.max(0, Math.min(100, heat));
        this._applyHeatMix(this.targetHeat, false);
      }
    });

    sub('settings:changed', (payload) => {
      if (!payload || typeof payload !== 'object') return;
      this.applySettings(payload);
    });

    sub('game:start', () => {
      this.init();
      this.paused = false;
      this.inEnding = false;
      this.targetHeat = typeof gameState?.argumentHeat === 'number' ? gameState.argumentHeat : 18;
      this._applyVolumes(false);
      this._applyHeatMix(this.targetHeat, false);
    });

    sub('game:restart', () => {
      this.init();
      this.paused = false;
      this.inEnding = false;
      this.targetHeat = typeof gameState?.argumentHeat === 'number' ? gameState.argumentHeat : 18;
      this.stopSpeech();
      this._applyVolumes(false);
      this._applyHeatMix(this.targetHeat, false);
    });

    sub('game:pause', () => {
      this.paused = true;
      this._applyVolumes(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.pause(); } catch {}
      }
    });

    sub('game:resume', () => {
      this.paused = false;
      this.init();
      this._applyVolumes(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.resume(); } catch {}
      }
    });

    sub('game:ending', () => {
      this.inEnding = true;
      this._applyVolumes(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Volume & Settings
  // ---------------------------------------------------------------------------

  _normalizeVol(val, fallback) {
    if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
    const v = val > 1 ? val / 100 : val;
    return Math.max(0, Math.min(1, v));
  }

  applySettings(partial) {
    if ('masterVolume' in partial) {
      this.settings.masterVolume = this._normalizeVol(partial.masterVolume, this.settings.masterVolume);
    }
    if ('musicVolume' in partial) {
      this.settings.musicVolume = this._normalizeVol(partial.musicVolume, this.settings.musicVolume);
    }
    if ('sfxVolume' in partial) {
      this.settings.sfxVolume = this._normalizeVol(partial.sfxVolume, this.settings.sfxVolume);
    }
    if (typeof partial.voiceEnabled === 'boolean') {
      this.settings.voiceEnabled = partial.voiceEnabled;
      if (!partial.voiceEnabled) this.stopSpeech();
    }
    if (typeof partial.muted === 'boolean') {
      this.settings.muted = partial.muted;
      if (partial.muted) this.stopSpeech();
    }
    this._applyVolumes(false);
  }

  _applyVolumes(immediate = false) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const tc = immediate ? 0.001 : 0.08;

    const masterTarget = this.settings.muted ? 0 : this.settings.masterVolume;
    const pauseFactor = this.paused ? 0.15 : 1.0;
    const endingMusicFactor = this.inEnding ? 0.18 : 1.0;

    const musicTarget = this.settings.musicVolume * 0.42 * pauseFactor * endingMusicFactor;
    const ambienceTarget = this.settings.musicVolume * 0.28 * pauseFactor * endingMusicFactor;
    const sfxTarget = this.settings.sfxVolume * 0.75;

    this.masterGain.gain.setTargetAtTime(masterTarget, now, tc);
    this.musicGain.gain.setTargetAtTime(musicTarget, now, tc);
    this.ambienceGain.gain.setTargetAtTime(ambienceTarget, now, tc);
    this.sfxGain.gain.setTargetAtTime(sfxTarget, now, tc);
  }

  // ---------------------------------------------------------------------------
  // Per-frame Update (Optional, also driven by heat:changed)
  // ---------------------------------------------------------------------------

  update(dt = 0.016, heat) {
    if (this.disposed) return;
    if (typeof heat === 'number' && !Number.isNaN(heat)) {
      this.targetHeat = Math.max(0, Math.min(100, heat));
    }

    const diff = this.targetHeat - this.currentHeat;
    if (Math.abs(diff) > 0.05) {
      const step = Math.min(1, Math.max(0.01, dt * 3.0));
      this.currentHeat += diff * step;
      this._applyHeatMix(this.currentHeat, false);
    }
  }

  _applyHeatMix(heat, immediate = false) {
    if (!this.ctx || !this.lowLayerGain) return;
    const h = Math.max(0, Math.min(100, heat));
    const now = this.ctx.currentTime;
    const tc = immediate ? 0.01 : 0.4;

    // Low heat (0–35): full warm chords, gently fades down as tension rises
    let lowG = 1.0;
    if (h > 35) {
      lowG = Math.max(0.1, 1.0 - ((h - 35) / 65) * 0.9);
    }

    // Medium heat (36–70): ramps in smoothly from 24..48, stays active at high heat
    let medG = 0.0;
    if (h > 24) {
      medG = Math.min(1.0, (h - 24) / 24);
      if (h > 75) {
        medG = Math.max(0.6, 1.0 - ((h - 75) / 25) * 0.4);
      }
    }

    // High heat (71–100): ramps in smoothly from 60..88
    let highG = 0.0;
    if (h > 60) {
      highG = Math.min(1.0, (h - 60) / 28);
    }

    this.lowLayerGain.gain.setTargetAtTime(lowG, now, tc);
    this.medLayerGain.gain.setTargetAtTime(medG, now, tc);
    this.highLayerGain.gain.setTargetAtTime(highG, now, tc);

    // Subtle tempo escalation with heat (92 BPM at low -> 118 BPM at max heat)
    this._tempoBpm = 92 + (h / 100) * 26;
  }

  // ---------------------------------------------------------------------------
  // Thanksgiving Dinner Ambience
  // ---------------------------------------------------------------------------

  _startAmbience() {
    const ctx = this.ctx;
    if (!ctx || !this._noiseBuffer) return;

    // 1. Warm room tone (low-pass filtered pink noise)
    const roomSrc = ctx.createBufferSource();
    roomSrc.buffer = this._noiseBuffer;
    roomSrc.loop = true;

    const roomFilter = ctx.createBiquadFilter();
    roomFilter.type = 'lowpass';
    roomFilter.frequency.value = 220;
    roomFilter.Q.value = 0.7;

    const roomGain = ctx.createGain();
    roomGain.gain.value = 0.38;

    roomSrc.connect(roomFilter);
    roomFilter.connect(roomGain);
    roomGain.connect(this.ambienceGain);
    roomSrc.start();

    // 2. Soft dinner murmur / warm dining room hum (slowly modulated bandpass noise)
    const murmurSrc = ctx.createBufferSource();
    murmurSrc.buffer = this._noiseBuffer;
    murmurSrc.loop = true;
    murmurSrc.playbackRate.value = 0.88;

    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 460;
    murmurFilter.Q.value = 1.8;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.14;

    // Slow LFO breathing on murmur filter & volume
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.17;
    const lfoFreqGain = ctx.createGain();
    lfoFreqGain.gain.value = 110;
    lfo.connect(lfoFreqGain);
    lfoFreqGain.connect(murmurFilter.frequency);
    lfo.start();

    murmurSrc.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(this.ambienceGain);
    murmurSrc.start();

    // 3. High-heat distorted tension drone (permanently routed through highLayerGain)
    const droneOsc1 = ctx.createOscillator();
    const droneOsc2 = ctx.createOscillator();
    droneOsc1.type = 'sawtooth';
    droneOsc2.type = 'sawtooth';
    droneOsc1.frequency.value = 55.0; // A1
    droneOsc2.frequency.value = 55.35; // slight detune for tension beating

    const droneShaper = ctx.createWaveShaper();
    droneShaper.curve = this._distortionCurve;

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 240;
    droneFilter.Q.value = 3.2;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.085;

    droneOsc1.connect(droneShaper);
    droneOsc2.connect(droneShaper);
    droneShaper.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.highLayerGain);
    droneOsc1.start();
    droneOsc2.start();

    this._persistentNodes.push(roomSrc, murmurSrc, lfo, droneOsc1, droneOsc2);

    // 4. Periodic procedural silverware / wine glass clinks
    this._scheduleNextClink();
  }

  _scheduleNextClink() {
    if (this.disposed) return;
    const delayMs = 4500 + Math.random() * 8500;
    this._clinkTimeout = setTimeout(() => {
      if (!this.disposed && this.ctx && this.ctx.state === 'running' && !this.paused && !this.inEnding) {
        this._playSilverwareClink();
      }
      this._scheduleNextClink();
    }, delayMs);
  }

  _playSilverwareClink() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const isGlass = Math.random() < 0.35;

    const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = (Math.random() * 1.4) - 0.7;
      panner.connect(this.ambienceGain);
    }
    const dest = panner || this.ambienceGain;

    if (isGlass) {
      // Crystal glass clink: two shimmering high partials
      const base = 2400 + Math.random() * 700;
      [1, 1.503, 2.31].forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base * mult, now);
        const amp = (0.045 / (idx + 1));
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45 / (idx + 1));
        osc.connect(g);
        g.connect(dest);
        osc.start(now);
        osc.stop(now + 0.5);
      });
    } else {
      // Silverware fork/plate clink: brief inharmonic metallic tap
      const base = 3100 + Math.random() * 1100;
      [1, 1.72, 2.86].forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(base * mult, now);
        const amp = 0.032 / (idx + 1);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14 / (idx + 1));
        osc.connect(g);
        g.connect(dest);
        osc.start(now);
        osc.stop(now + 0.18);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Dynamic Music System (3 Heat-Driven Procedural Layers)
  // ---------------------------------------------------------------------------

  _startMusicScheduler() {
    if (!this.ctx || this._seqInterval) return;
    this._stepIndex = 0;
    this._nextStepTime = this.ctx.currentTime + 0.1;

    // 16th-note lookahead scheduler (runs every 80ms, schedules 220ms ahead)
    this._seqInterval = setInterval(() => {
      if (this.disposed || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;

      // Catch up cleanly if tab was backgrounded
      if (this._nextStepTime < now - 0.25) {
        this._nextStepTime = now + 0.05;
      }

      const stepDur = (60 / this._tempoBpm) / 4; // 16th note duration
      while (this._nextStepTime < now + 0.22) {
        this._scheduleMusicStep(this._stepIndex, this._nextStepTime, stepDur);
        this._nextStepTime += stepDur;
        this._stepIndex = (this._stepIndex + 1) % 64; // 4-bar loop (64 sixteenth notes)
      }
    }, 80);
  }

  _scheduleMusicStep(step, time, stepDur) {
    // Bar 0..3 (16 steps each)
    const bar = Math.floor(step / 16);
    const beatStep = step % 16;

    // --- LAYER 1: LOW HEAT — Warm Cozy Thanksgiving Electric-Piano Chords ---
    // Progression: Fmaj7 -> Dm9 -> Bbmaj7 -> C9sus4
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [146.83, 220.00, 261.63, 329.63], // Dm9   (D3, A3, C4, E4)
      [116.54, 174.61, 220.00, 293.66], // Bbmaj7(Bb2, F3, A3, D4)
      [130.81, 174.61, 233.08, 293.66], // C9sus4(C3, F3, Bb3, D4)
    ];

    if (beatStep === 0 || beatStep === 10) {
      const chord = chords[bar];
      const dur = beatStep === 0 ? stepDur * 10.5 : stepDur * 5.8;
      const vel = beatStep === 0 ? 0.12 : 0.07;
      chord.forEach((freq, idx) => {
        this._playWarmEPianoNote(freq, time + idx * 0.022, dur, vel, this.lowLayerGain);
      });
    }

    // Gentle acoustic melody bell pickup on low heat
    const melodyNotes = {
      6: 523.25,  // C5
      14: 440.00, // A4
      22: 587.33, // D5
      30: 523.25, // C5
      38: 440.00, // A4
      46: 392.00, // G4
      54: 440.00, // A4
      60: 523.25, // C5
    };
    if (melodyNotes[step]) {
      this._playWarmEPianoNote(melodyNotes[step], time, stepDur * 3.5, 0.06, this.lowLayerGain);
    }

    // --- LAYER 2: MEDIUM HEAT — Tense Pulsing Synth Bass & Ticking Percussion ---
    const bassRoots = [87.31, 73.42, 58.27, 65.41]; // F2, D2, Bb1, C2
    if (beatStep % 2 === 0) {
      const accent = beatStep % 4 === 0 ? 0.18 : 0.11;
      const octaveBoost = beatStep === 14 ? 1.5 : 1.0;
      this._playPulseBass(bassRoots[bar] * octaveBoost, time, stepDur * 1.7, accent, this.medLayerGain);
    }

    // Crisp clockwork / dinner-timer tick
    if (beatStep % 4 === 0 || beatStep % 4 === 2) {
      const isDown = beatStep % 4 === 0;
      this._playTickPerc(time, isDown ? 0.12 : 0.06, isDown ? 2600 : 3800, this.medLayerGain);
    }

    // --- LAYER 3: HIGH HEAT — Urgent Alarm Arpeggio & Deep Heartbeat Thump ---
    // Heartbeat "lub-dub" on steps 0 & 3, and 8 & 11
    if (beatStep === 0 || beatStep === 8) {
      this._playHeartbeat(time, 0.38, 68, this.highLayerGain);
    } else if (beatStep === 3 || beatStep === 11) {
      this._playHeartbeat(time, 0.25, 56, this.highLayerGain);
    }

    // Urgent cinematic minor/diminished 16th-note arpeggio
    const arpPatterns = [
      [220.00, 261.63, 329.63, 349.23], // Am tension
      [220.00, 261.63, 311.13, 440.00], // Adim tension
      [233.08, 293.66, 349.23, 466.16], // Bb urgency
      [246.94, 293.66, 349.23, 493.88], // Bdim alarm
    ];
    const arpFreq = arpPatterns[bar][step % 4];
    const arpAmp = step % 2 === 0 ? 0.095 : 0.055;
    this._playAlarmArp(arpFreq, time, stepDur * 0.85, arpAmp, this.highLayerGain);
  }

  _playWarmEPianoNote(freq, time, dur, amp, dest) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const tine = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 2, time);

    const tineGain = ctx.createGain();
    tineGain.gain.setValueAtTime(amp * 0.28, time);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(0.28, dur));

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(520, time + dur);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    tine.connect(tineGain);
    tineGain.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    tine.start(time);
    osc.stop(time + dur + 0.04);
    tine.stop(time + dur + 0.04);
  }

  _playPulseBass(freq, time, dur, amp, dest) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, time);
    filter.frequency.exponentialRampToValueAtTime(130, time + dur);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  _playTickPerc(time, amp, centerFreq, dest) {
    if (!this._noiseBuffer) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, time);
    filter.Q.value = 4.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    src.start(time, Math.random() * 1.2, 0.06);
  }

  _playHeartbeat(time, amp, startFreq, dest) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(28, time + 0.19);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  _playAlarmArp(freq, time, dur, amp, dest) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.2, time);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  // ---------------------------------------------------------------------------
  // Procedural Sound Effects
  // ---------------------------------------------------------------------------

  playSfx(name, options = {}) {
    if (this.disposed || this.settings.muted) return;
    if (!this.ctx) {
      if (!this.init()) return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    switch (name) {
      case 'click':
        this._sfxClick(now);
        break;
      case 'hover':
        this._sfxHover(now);
        break;
      case 'ping':
        this._sfxPing(now);
        break;
      case 'chime':
        this._sfxChime(now);
        break;
      case 'success':
        this._sfxSuccess(now);
        break;
      case 'fail':
        this._sfxFail(now);
        break;
      case 'heat_spike':
        this._sfxHeatSpike(now);
        break;
      case 'lock':
        this._sfxLock(now);
        break;
      case 'step':
        this._sfxStep(now);
        break;
      case 'ending_good':
        this._sfxEndingGood(now);
        break;
      case 'ending_bad':
        this._sfxEndingBad(now);
        break;
      default:
        this._sfxClick(now);
        break;
    }
  }

  _sfxClick(now) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  _sfxHover(now) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, now);
    osc.frequency.exponentialRampToValueAtTime(1680, now + 0.025);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  _sfxPing(now) {
    // Smartphone Black Friday notification: crisp dual-tone chime (B5 -> E6)
    const ctx = this.ctx;
    const notes = [
      { freq: 987.77, t: 0, dur: 0.14, amp: 0.24 },
      { freq: 1318.51, t: 0.085, dur: 0.28, amp: 0.28 },
    ];
    notes.forEach(({ freq, t, dur, amp }) => {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      overtone.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + t);
      overtone.frequency.setValueAtTime(freq * 2, now + t);

      const og = ctx.createGain();
      og.gain.value = 0.22;

      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.linearRampToValueAtTime(amp, now + t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(g);
      overtone.connect(og);
      og.connect(g);
      g.connect(this.sfxGain);

      osc.start(now + t);
      overtone.start(now + t);
      osc.stop(now + t + dur + 0.03);
      overtone.stop(now + t + dur + 0.03);
    });
  }

  _sfxChime(now) {
    // Smart speaker wake chime: futuristic corporate glass arpeggio
    const ctx = this.ctx;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const t = now + i * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  _sfxSuccess(now) {
    // Satisfying puzzle solved chord: warm major9 arpeggio + sparkle
    const ctx = this.ctx;
    const notes = [349.23, 440.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  _sfxFail(now) {
    // Comedic descending error buzz ("womp-womp")
    const ctx = this.ctx;
    const tones = [
      { f0: 260, f1: 235, t: 0, dur: 0.18 },
      { f0: 220, f1: 155, t: 0.17, dur: 0.34 },
    ];
    tones.forEach(({ f0, f1, t, dur }) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, now + t);
      osc.frequency.exponentialRampToValueAtTime(f1, now + t + dur);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(780, now + t);
      filter.frequency.exponentialRampToValueAtTime(240, now + t + dur);

      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.linearRampToValueAtTime(0.22, now + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + t);
      osc.stop(now + t + dur + 0.04);
    });
  }

  _sfxHeatSpike(now) {
    // Dramatic tension sting: sub impact + dissonant metallic swell
    const ctx = this.ctx;

    // Sub drop
    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.55);
    subG.gain.setValueAtTime(0.0001, now);
    subG.gain.linearRampToValueAtTime(0.45, now + 0.015);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    sub.connect(subG);
    subG.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.65);

    // Dissonant tritone brassy sting
    [311.13, 440.0, 466.16].forEach((freq) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.04, now + 0.5);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.25);
      filter.Q.value = 2.2;

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.14, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  _sfxLock(now) {
    // Heavy smart-door deadbolt: deep mechanical thud + metallic latch + electronic lock beep
    const ctx = this.ctx;

    // 1. Heavy deadbolt clunk
    const thud = ctx.createOscillator();
    const thudG = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    thudG.gain.setValueAtTime(0.0001, now);
    thudG.gain.linearRampToValueAtTime(0.42, now + 0.006);
    thudG.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    thud.connect(thudG);
    thudG.connect(this.sfxGain);
    thud.start(now);
    thud.stop(now + 0.2);

    // 2. Metallic slide noise burst
    if (this._noiseBuffer) {
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = this._noiseBuffer;
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.setValueAtTime(1400, now + 0.03);
      nf.Q.value = 3.0;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, now + 0.03);
      ng.gain.linearRampToValueAtTime(0.26, now + 0.045);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      nSrc.connect(nf);
      nf.connect(ng);
      ng.connect(this.sfxGain);
      nSrc.start(now + 0.03, 0.2, 0.15);
    }

    // 3. Electronic smart-lock confirmation beep
    const beep = ctx.createOscillator();
    const beepG = ctx.createGain();
    beep.type = 'sine';
    beep.frequency.setValueAtTime(880, now + 0.16);
    beep.frequency.setValueAtTime(660, now + 0.23);
    beepG.gain.setValueAtTime(0.0001, now + 0.16);
    beepG.gain.linearRampToValueAtTime(0.16, now + 0.168);
    beepG.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    beep.connect(beepG);
    beepG.connect(this.sfxGain);
    beep.start(now + 0.16);
    beep.stop(now + 0.36);
  }

  _sfxStep(now) {
    // Soft hardwood footstep with subtle natural randomization
    const ctx = this.ctx;
    const pitchJitter = 0.88 + Math.random() * 0.24;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 * pitchJitter, now);
    osc.frequency.exponentialRampToValueAtTime(45 * pitchJitter, now + 0.075);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);

    if (this._noiseBuffer) {
      const tap = ctx.createBufferSource();
      tap.buffer = this._noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750 * pitchJitter, now);
      filter.Q.value = 1.6;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, now);
      tg.gain.linearRampToValueAtTime(0.09, now + 0.004);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
      tap.connect(filter);
      filter.connect(tg);
      tg.connect(this.sfxGain);
      tap.start(now, Math.random() * 1.0, 0.06);
    }
  }

  _sfxEndingGood(now) {
    // Warm triumphant Thanksgiving resolution chord + gentle cascade
    const ctx = this.ctx;
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = i < 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 2.2);
    });
  }

  _sfxEndingBad(now) {
    // Ominous Black Mirror shutdown / #ThanksgivingCancelled stinger
    const ctx = this.ctx;

    // Power-down sweep
    const sweep = ctx.createOscillator();
    const sweepG = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(420, now);
    sweep.frequency.exponentialRampToValueAtTime(38, now + 1.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 1.4);

    sweepG.gain.setValueAtTime(0.0001, now);
    sweepG.gain.linearRampToValueAtTime(0.26, now + 0.03);
    sweepG.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);

    sweep.connect(filter);
    filter.connect(sweepG);
    sweepG.connect(this.sfxGain);
    sweep.start(now);
    sweep.stop(now + 1.6);

    // Dark minor cluster
    [110.0, 130.81, 155.56, 207.65].forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.15);
      g.gain.setValueAtTime(0.0001, now + 0.15);
      g.gain.linearRampToValueAtTime(0.14, now + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + 0.15);
      osc.stop(now + 2.1);
    });
  }

  // ---------------------------------------------------------------------------
  // Corporate-AI Voice (Web Speech API + Graceful Synth Fallback)
  // ---------------------------------------------------------------------------

  _initSpeechVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const pickVoice = () => {
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        if (!voices.length) return;
        const preferredNames = [
          'Google US English',
          'Microsoft Aria',
          'Microsoft Zira',
          'Microsoft David',
          'Samantha',
          'Alex',
        ];
        for (const name of preferredNames) {
          const found = voices.find((v) => v.name && v.name.includes(name));
          if (found) {
            this._preferredVoice = found;
            return;
          }
        }
        this._preferredVoice =
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];
      } catch {
        // Ignore speech synthesis permission/API quirks
      }
    };

    pickVoice();
    if (!this._voiceListenersBound && 'onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
      this._voiceListenersBound = true;
    }
  }

  _handleAISpeak(payload) {
    if (this.disposed || this.settings.muted || this.paused) return;

    const text = typeof payload === 'string' ? payload : payload?.text;
    if (!text || typeof text !== 'string') return;

    const nowMs = Date.now();
    // Prevent overlapping rapid-fire speech spam within 250ms
    if (nowMs - this._lastSpeakTime < 250) return;
    this._lastSpeakTime = nowMs;

    // Play subtle AI comms wake blip
    this._playAIVoiceCue();

    if (!this.settings.voiceEnabled) return;

    if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        if (this._preferredVoice) {
          utter.voice = this._preferredVoice;
        }
        utter.lang = 'en-US';

        const mood = typeof payload === 'object' ? payload?.mood : null;
        if (mood === 'critical' || mood === 'angry' || this.currentHeat > 70) {
          utter.rate = 1.12;
          utter.pitch = 0.88;
        } else if (mood === 'cheerful' || mood === 'calm') {
          utter.rate = 1.02;
          utter.pitch = 1.05;
        } else {
          utter.rate = 1.06;
          utter.pitch = 0.96;
        }

        utter.volume = Math.max(0, Math.min(1, this.settings.masterVolume * this.settings.sfxVolume));
        window.speechSynthesis.speak(utter);
      } catch {
        // Graceful fallback: comms cue already played
      }
    }
  }

  _playAIVoiceCue() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.06);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    this._removeGestureUnlock();

    for (const unsub of this._unsubs) {
      try { unsub(); } catch {}
    }
    this._unsubs = [];

    if (this._seqInterval) {
      clearInterval(this._seqInterval);
      this._seqInterval = null;
    }

    if (this._clinkTimeout) {
      clearTimeout(this._clinkTimeout);
      this._clinkTimeout = null;
    }

    for (const node of this._persistentNodes) {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    this._persistentNodes = [];

    this.stopSpeech();

    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
  }
}
