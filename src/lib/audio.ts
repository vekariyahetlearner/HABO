'use client';

/**
 * Web Audio API synthesized sound effects & offline focus engine.
 * 100% offline, procedural audio synthesis using native Web Audio API oscillators,
 * noise algorithms, filters, and generative musical sequencing.
 * Zero external network requests, zero mp3 downloads, zero telemetry.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;

  getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getActiveTheme(): string {
    if (typeof window === 'undefined') return 'neo-brutalist';
    try {
      return (
        document.documentElement.getAttribute('data-theme-id') ||
        localStorage.getItem('heatmaps_active_theme') ||
        'neo-brutalist'
      );
    } catch {
      return 'neo-brutalist';
    }
  }

  // Theme-aware tactile interaction click
  playClick(themeOverride?: string) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const themeId = themeOverride || this.getActiveTheme();
      const now = ctx.currentTime;

      if (themeId === 'pixel') {
        // Pixel: Soft organic water droplet bubble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(310, now + 0.045);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      } else if (themeId === 'nordic') {
        // Nordic: Warm acoustic woodblock tap
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        // Neo-Brutalist: Heavy mechanical switch clack
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {}
  }

  // Celebratory theme-bespoke ascending chime
  playSuccess(themeOverride?: string) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const themeId = themeOverride || this.getActiveTheme();
      const now = ctx.currentTime;

      if (themeId === 'pixel') {
        // Pixel: Material 3 warm tri-tone bubble chime
        const notes = [523.25, 659.25, 783.99]; // E, G#, B
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          gain.gain.setValueAtTime(0, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.32);
        });
      } else if (themeId === 'nordic') {
        // Nordic: Meditative Zen singing bowl chord
        const notes = [293.66, 440, 587.33]; // D4, A4, D5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);

          gain.gain.setValueAtTime(0, now + i * 0.09);
          gain.gain.linearRampToValueAtTime(0.16, now + i * 0.09 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.9);
        });
      } else {
        // Neo-Brutalist: High energy 8-bit fanfare
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);

          gain.gain.setValueAtTime(0, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.15, now + i * 0.06 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.22);
        });
      }
    } catch {}
  }

  // Pomodoro / timer completion bell
  playTimerComplete() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Gentle double meditation chime (A5 - 880Hz, E6 - 1318.5Hz)
      const chimes = [880, 1318.51];
      chimes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 1.2);
      });
    } catch {}
  }
}

export type FocusCategory = 'enhancers' | 'nature' | 'instrumental' | 'custom';

export type FocusSoundTrack =
  | 'none'
  | 'custom'
  // Section 1: Scientifically Proven Focus Enhancers
  | 'gamma'
  | 'alpha'
  | 'beta'
  | 'brown'
  | 'pink'
  | 'white'
  // Section 2: Biophilic Nature Soundscapes
  | 'rain'
  | 'ocean'
  | 'campfire'
  | 'wind'
  | 'stream'
  // Section 3: Generative Offline Instrumental
  | 'lofi'
  | 'bowls'
  | 'piano'
  | 'analog_pad'
  | 'cello_drone';

export interface SoundTrackDef {
  id: FocusSoundTrack;
  category: FocusCategory;
  label: string;
  science: string;
  icon: string;
  badge: string;
  desc: string;
}

export const SOUND_TRACKS: SoundTrackDef[] = [
  // Section 1: Scientifically Proven Focus Enhancers
  {
    id: 'gamma',
    category: 'enhancers',
    label: '40Hz Gamma Waves',
    science: 'Peak Cognition & High-Focus Sprint',
    icon: '⚡',
    badge: '40Hz Binaural',
    desc: 'Clinically proven frequency for deep coding flow, high cognitive loads, and problem solving.',
  },
  {
    id: 'alpha',
    category: 'enhancers',
    label: '10Hz Alpha Waves',
    science: 'Flow State & Relaxed Alertness',
    icon: '🧠',
    badge: '10Hz Binaural',
    desc: 'Binaural beat promotes calm sustained concentration without fatigue or nervous tension.',
  },
  {
    id: 'beta',
    category: 'enhancers',
    label: '14Hz Beta Waves',
    science: 'Active Analytical Processing',
    icon: '💡',
    badge: '14Hz Binaural',
    desc: 'Stimulates active thinking, calculation, and task execution.',
  },
  {
    id: 'brown',
    category: 'enhancers',
    label: 'Brown Noise',
    science: 'ADHD Calm & Chatter Dampening',
    icon: '🌊',
    badge: '1/f² Low Spectrum',
    desc: 'Low-frequency acoustic blanket that quiets internal mind wandering and restlessness.',
  },
  {
    id: 'pink',
    category: 'enhancers',
    label: 'Pink Noise',
    science: 'Memory Retention & Steady Focus',
    icon: '🌸',
    badge: '1/f Balanced',
    desc: 'Balanced acoustic energy proven in neuroscience to preserve concentration across long sessions.',
  },
  {
    id: 'white',
    category: 'enhancers',
    label: 'Pure White Noise',
    science: 'Conversational Speech Masking',
    icon: '📻',
    badge: 'Full Spectrum',
    desc: 'Even acoustic energy that eliminates unpredictable office and household background chatter.',
  },

  // Section 2: Biophilic Nature Soundscapes
  {
    id: 'rain',
    category: 'nature',
    label: 'Soft Rain & Droplets',
    science: 'Biophilic Stress Reduction',
    icon: '🌧️',
    badge: 'Hydro-Acoustic',
    desc: 'Gentle raindrops on foliage with soft rhythmic micro-splashes for continuous focus.',
  },
  {
    id: 'ocean',
    category: 'nature',
    label: 'Ocean Surf & Tides',
    science: 'Parasympathetic Nervous Regulation',
    icon: '🌊',
    badge: 'Rhythmic Surf',
    desc: 'Slow rolling ocean breakers with 12-second crest intervals that stabilize breath and heart rate.',
  },
  {
    id: 'campfire',
    category: 'nature',
    label: 'Campfire & Embers',
    science: 'Evolutionary Hearth Grounding',
    icon: '🔥',
    badge: 'Warm Hearth',
    desc: 'Crackling wood embers, stochastic pops, and low warm glow simulating a cozy evening workspace.',
  },
  {
    id: 'wind',
    category: 'nature',
    label: 'Forest Wind & Pines',
    science: 'Nature Immersion Effect',
    icon: '🌲',
    badge: 'Mountain Breeze',
    desc: 'Gentle mountain wind gusts filtering through high pine needles with resonant air swells.',
  },
  {
    id: 'stream',
    category: 'nature',
    label: 'Mountain Stream',
    science: 'Cognitive Renewal Theory',
    icon: '💧',
    badge: 'Babbling Brook',
    desc: 'Clear bubbling stream water cascading smoothly over riverbed stones.',
  },

  // Section 3: Generative Offline Instrumental
  {
    id: 'lofi',
    category: 'instrumental',
    label: 'Lo-Fi Rhodes Chords',
    science: 'Harmonic Flow & Calming Cadence',
    icon: '🎹',
    badge: 'Neo-Soul EP',
    desc: 'Warm generative 7th & 9th electric piano chords with vintage acoustic tremolo and subtle flutter.',
  },
  {
    id: 'bowls',
    category: 'instrumental',
    label: 'Zen Tibetan Bowls',
    science: 'Mindfulness & Deep Resonance',
    icon: '🔔',
    badge: 'Singing Bowls',
    desc: 'Meditative singing bowl overtones and soothing mallet strikes with long harmonic decay.',
  },
  {
    id: 'piano',
    category: 'instrumental',
    label: 'Ambient Ethereal Harp',
    science: 'Peaceful Pentatonic Serenity',
    icon: '🎵',
    badge: 'Generative Harp',
    desc: 'Algorithmic pentatonic harp notes drifting at relaxed intervals like quiet thoughts.',
  },
  {
    id: 'analog_pad',
    category: 'instrumental',
    label: 'Cosmic Analog Synth Pad',
    science: 'Expansive Ambient Immersion',
    icon: '🌌',
    badge: 'Warm Analog Pad',
    desc: 'Detuned multi-oscillator sawtooth/triangle pad with slow sweeping lowpass analog filters.',
  },
  {
    id: 'cello_drone',
    category: 'instrumental',
    label: 'Deep String & Cello Drone',
    science: 'Resonant Low-End Grounding',
    icon: '🎻',
    badge: 'Sustained Strings',
    desc: 'Grounding low D cello fundamentals with natural bow vibrato and rich overtone warmth.',
  },
];

/**
 * Procedural Focus Music & Ambient Soundscape Synthesizer
 * 100% offline procedural audio synthesis using native Web Audio API nodes.
 */
class FocusMusicEngine {
  private currentTrack: FocusSoundTrack = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: { disconnect: () => void; stop?: () => void }[] = [];
  private activeTimers: NodeJS.Timeout[] = [];
  private volume: number = 0.5;
  private customAudioElem: HTMLAudioElement | null = null;
  private currentCustomTrackId: string | null = null;
  private currentCustomBlobUrl: string | null = null;

  private cleanupCurrentNodes() {
    // Clear all interval and timeout loops
    this.activeTimers.forEach((t) => clearInterval(t));
    this.activeTimers = [];

    // Disconnect and stop all Web Audio nodes
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }

  getTrack(): FocusSoundTrack {
    return this.currentTrack;
  }

  getCustomTrackId(): string | null {
    return this.currentCustomTrackId;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.customAudioElem) {
      this.customAudioElem.volume = this.volume;
    }
    if (this.masterGain && sounds.getContext()) {
      const ctx = sounds.getContext()!;
      this.masterGain.gain.setTargetAtTime(this.volume * 0.35, ctx.currentTime, 0.05);
    }
  }

  stop() {
    if (this.customAudioElem) {
      try {
        this.customAudioElem.pause();
        this.customAudioElem.currentTime = 0;
      } catch {}
    }
    if (this.currentCustomBlobUrl) {
      try {
        URL.revokeObjectURL(this.currentCustomBlobUrl);
      } catch {}
      this.currentCustomBlobUrl = null;
    }
    this.currentCustomTrackId = null;

    if (this.masterGain && sounds.getContext()) {
      const ctx = sounds.getContext()!;
      // Gentle fade out over 0.15s
      this.masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
      setTimeout(() => {
        this.cleanupCurrentNodes();
        this.currentTrack = 'none';
      }, 160);
    } else {
      this.cleanupCurrentNodes();
      this.currentTrack = 'none';
    }
  }

  /**
   * Play an offline user-uploaded custom track
   */
  playCustom(blob: Blob, trackId: string) {
    this.stop();

    setTimeout(() => {
      this.cleanupCurrentNodes();
      this.currentTrack = 'custom';
      this.currentCustomTrackId = trackId;

      try {
        this.currentCustomBlobUrl = URL.createObjectURL(blob);
        if (!this.customAudioElem) {
          this.customAudioElem = new Audio();
        }
        this.customAudioElem.src = this.currentCustomBlobUrl;
        this.customAudioElem.loop = true;
        this.customAudioElem.volume = this.volume;
        this.customAudioElem.play().catch(() => {});
      } catch {}
    }, 180);
  }

  play(track: FocusSoundTrack) {
    if (track === 'none') {
      this.stop();
      return;
    }

    const ctx = sounds.getContext();
    if (!ctx) return;

    this.stop();

    setTimeout(() => {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(this.volume * 0.35, ctx.currentTime + 0.25);
      this.masterGain.connect(ctx.destination);

      this.currentTrack = track;

      switch (track) {
        // Section 1: Scientifically Proven Focus Enhancers
        case 'gamma':
          this.startBinaural(ctx, this.masterGain, 200, 40); // 40Hz Gamma
          break;
        case 'alpha':
          this.startBinaural(ctx, this.masterGain, 216, 10); // 10Hz Alpha
          break;
        case 'beta':
          this.startBinaural(ctx, this.masterGain, 220, 14); // 14Hz Beta
          break;
        case 'brown':
          this.startBrownNoise(ctx, this.masterGain);
          break;
        case 'pink':
          this.startPinkNoise(ctx, this.masterGain);
          break;
        case 'white':
          this.startWhiteNoise(ctx, this.masterGain);
          break;

        // Section 2: Biophilic Nature Soundscapes
        case 'rain':
          this.startRainAtmosphere(ctx, this.masterGain);
          break;
        case 'ocean':
          this.startOceanSurf(ctx, this.masterGain);
          break;
        case 'campfire':
          this.startCampfire(ctx, this.masterGain);
          break;
        case 'wind':
          this.startForestWind(ctx, this.masterGain);
          break;
        case 'stream':
          this.startMountainStream(ctx, this.masterGain);
          break;

        // Section 3: Generative Offline Instrumental
        case 'lofi':
          this.startLofiRhodes(ctx, this.masterGain);
          break;
        case 'bowls':
          this.startTibetanBowls(ctx, this.masterGain);
          break;
        case 'piano':
          this.startEtherealHarp(ctx, this.masterGain);
          break;
        case 'analog_pad':
          this.startAnalogPad(ctx, this.masterGain);
          break;
        case 'cello_drone':
          this.startCelloDrone(ctx, this.masterGain);
          break;
      }
    }, 180);
  }

  // =========================================================================
  // Section 1 Implementations: Focus Enhancers
  // =========================================================================

  /**
   * Binaural Beats with comfortable low-level organic undertone
   */
  private startBinaural(ctx: AudioContext, destination: AudioNode, carrierFreq: number, beatFreq: number) {
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();

    oscLeft.type = 'sine';
    oscRight.type = 'sine';

    oscLeft.frequency.setValueAtTime(carrierFreq, ctx.currentTime);
    oscRight.frequency.setValueAtTime(carrierFreq + beatFreq, ctx.currentTime);

    const gainLeft = ctx.createGain();
    const gainRight = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.4, ctx.currentTime);
    gainRight.gain.setValueAtTime(0.4, ctx.currentTime);

    const panLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (panLeft && panRight) {
      panLeft.pan.setValueAtTime(-0.85, ctx.currentTime);
      panRight.pan.setValueAtTime(0.85, ctx.currentTime);

      oscLeft.connect(gainLeft);
      gainLeft.connect(panLeft);
      panLeft.connect(destination);

      oscRight.connect(gainRight);
      gainRight.connect(panRight);
      panRight.connect(destination);

      this.activeNodes.push(panLeft, panRight);
    } else {
      oscLeft.connect(gainLeft);
      gainLeft.connect(destination);
      oscRight.connect(gainRight);
      gainRight.connect(destination);
    }

    // Add a very subtle pink noise cushion under the binaural beat so it feels warm and natural
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < noiseData.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555;
      b1 = 0.99332 * b1 + white * 0.075;
      b2 = 0.969 * b2 + white * 0.153;
      noiseData[i] = (b0 + b1 + b2) * 0.03;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, ctx.currentTime);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(destination);
    noiseSource.start(0);

    oscLeft.start(0);
    oscRight.start(0);

    this.activeNodes.push(oscLeft, oscRight, gainLeft, gainRight, noiseSource, noiseFilter);
  }

  /**
   * Brown Noise (1/f² integrated Brownian acoustic walk)
   */
  private startBrownNoise(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, ctx.currentTime);

    source.connect(filter);
    filter.connect(destination);

    source.start(0);
    this.activeNodes.push(source, filter);
  }

  /**
   * Pink Noise (1/f balanced Voss-McCartney algorithm)
   */
  private startPinkNoise(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);

    source.connect(filter);
    filter.connect(destination);

    source.start(0);
    this.activeNodes.push(source, filter);
  }

  /**
   * Pure White Noise (Speech masking with gentle softening)
   */
  private startWhiteNoise(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Soft bandpass to avoid harsh piercing highs while retaining speech masking efficiency
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);
    filter.Q.setValueAtTime(0.4, ctx.currentTime);

    source.connect(filter);
    filter.connect(destination);

    source.start(0);
    this.activeNodes.push(source, filter);
  }

  // =========================================================================
  // Section 2 Implementations: Biophilic Nature Soundscapes
  // =========================================================================

  /**
   * Soft Rain with gentle droplet micro-splashes
   */
  private startRainAtmosphere(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555;
      b1 = 0.99332 * b1 + white * 0.075;
      b2 = 0.969 * b2 + white * 0.153;
      b3 = 0.8665 * b3 + white * 0.31;
      b4 = 0.55 * b4 + white * 0.53;
      let rainSample = (b0 + b1 + b2 + b3 + b4) * 0.08;

      // Occasional gentle raindrop impact spike (Poisson micro-droplets)
      if (Math.random() < 0.003) {
        rainSample += (Math.random() * 2 - 1) * 0.45;
      }
      data[i] = rainSample;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(780, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    source.connect(filter);
    filter.connect(destination);

    source.start(0);
    this.activeNodes.push(source, filter);
  }

  /**
   * Ocean Surf & Tides (12s period rhythmic swell and ebb)
   */
  private startOceanSurf(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter that sweeps with wave crests
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    // Wave swell gain
    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.2, ctx.currentTime);

    // 0.08 Hz LFO for natural 12.5s ocean tidal surge
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime);

    const lfoFilterGain = ctx.createGain();
    lfoFilterGain.gain.setValueAtTime(380, ctx.currentTime); // Filter sweep depth

    const lfoAmpGain = ctx.createGain();
    lfoAmpGain.gain.setValueAtTime(0.35, ctx.currentTime); // Amplitude swell depth

    lfo.connect(lfoFilterGain);
    lfoFilterGain.connect(filter.frequency);

    lfo.connect(lfoAmpGain);
    lfoAmpGain.connect(waveGain.gain);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destination);

    lfo.start(0);
    source.start(0);

    this.activeNodes.push(source, filter, waveGain, lfo, lfoFilterGain, lfoAmpGain);
  }

  /**
   * Campfire & Embers (Warm low hearth + random crackles & pops)
   */
  private startCampfire(ctx: AudioContext, destination: AudioNode) {
    // 1. Warm background low rumble
    const rumbleBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const rumbleData = rumbleBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < rumbleData.length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.015 * white) / 1.015;
      rumbleData[i] = lastOut * 2.8;
    }

    const rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;
    rumbleSource.loop = true;

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(260, ctx.currentTime);

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(destination);
    rumbleSource.start(0);

    // 2. Crackling sparks and wood snaps buffer
    const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleData.length; i++) {
      // Stochastic ember bursts (Poisson distribution)
      if (Math.random() < 0.0018) {
        crackleData[i] = (Math.random() * 2 - 1) * 0.9;
        // Fast decay tail
        if (i + 1 < crackleData.length) crackleData[i + 1] = crackleData[i] * 0.5;
        if (i + 2 < crackleData.length) crackleData[i + 2] = crackleData[i] * 0.2;
      } else {
        crackleData[i] = 0;
      }
    }

    const crackleSource = ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.setValueAtTime(800, ctx.currentTime);

    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.45, ctx.currentTime);

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(destination);
    crackleSource.start(0);

    this.activeNodes.push(rumbleSource, rumbleFilter, crackleSource, crackleFilter, crackleGain);
  }

  /**
   * Forest Wind & Pines (Dynamic atmospheric gusts with resonance)
   */
  private startForestWind(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555;
      b1 = 0.99332 * b1 + white * 0.075;
      b2 = 0.969 * b2 + white * 0.153;
      data[i] = (b0 + b1 + b2) * 0.12;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    // LFO for slow wind gusts
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8s cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(320, ctx.currentTime); // Sweep between 230Hz and 870Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(destination);

    lfo.start(0);
    source.start(0);

    this.activeNodes.push(source, filter, lfo, lfoGain);
  }

  /**
   * Mountain Stream (Multi-resonant water trickles over stones)
   */
  private startMountainStream(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Dual resonant bandpass filters imitating babbling water bubbles
    const filterLow = ctx.createBiquadFilter();
    filterLow.type = 'bandpass';
    filterLow.frequency.setValueAtTime(750, ctx.currentTime);
    filterLow.Q.setValueAtTime(2.2, ctx.currentTime);

    const filterHigh = ctx.createBiquadFilter();
    filterHigh.type = 'bandpass';
    filterHigh.frequency.setValueAtTime(1600, ctx.currentTime);
    filterHigh.Q.setValueAtTime(3.5, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(180, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filterLow.frequency);

    source.connect(filterLow);
    source.connect(filterHigh);

    filterLow.connect(destination);
    filterHigh.connect(destination);

    lfo.start(0);
    source.start(0);

    this.activeNodes.push(source, filterLow, filterHigh, lfo, lfoGain);
  }

  // =========================================================================
  // Section 3 Implementations: Generative Offline Instrumental
  // =========================================================================

  /**
   * Generative Lo-Fi Rhodes Chords (Warm 7th & 9th Jazz chords progression)
   */
  private startLofiRhodes(ctx: AudioContext, destination: AudioNode) {
    // Neo-Soul Chord Progression:
    // 1. Cmaj9 [261.63, 329.63, 392.00, 493.88, 587.33] (C4, E4, G4, B4, D5)
    // 2. Am9   [220.00, 261.63, 329.63, 392.00, 493.88] (A3, C4, E4, G4, B4)
    // 3. Dm9   [146.83, 220.00, 261.63, 349.23, 440.00] (D3, A3, C4, F4, A4)
    // 4. G13   [196.00, 246.94, 293.66, 349.23, 440.00] (G3, B3, D4, F4, A4)
    const chords = [
      [261.63, 329.63, 392.00, 493.88],
      [220.00, 261.63, 329.63, 392.00],
      [146.83, 220.00, 261.63, 349.23],
      [196.00, 246.94, 293.66, 349.23],
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (this.currentTrack !== 'lofi') return;
      const now = ctx.currentTime;
      const currentNotes = chords[chordIndex % chords.length];
      chordIndex++;

      currentNotes.forEach((freq, noteIdx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warm electric piano tone: triangle with soft harmonics
        osc.type = noteIdx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + noteIdx * 0.04);

        // Soft ADSR envelope
        gain.gain.setValueAtTime(0, now + noteIdx * 0.04);
        gain.gain.linearRampToValueAtTime(0.08 / currentNotes.length, now + noteIdx * 0.04 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + noteIdx * 0.04 + 3.4);

        // Warm lowpass filter for that vintage Lo-Fi Rhodes warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(destination);

        osc.start(now + noteIdx * 0.04);
        osc.stop(now + noteIdx * 0.04 + 3.5);

        this.activeNodes.push(osc, gain, filter);
      });
    };

    // Play first chord immediately, then every 3.8 seconds
    playChord();
    const interval = setInterval(playChord, 3800);
    this.activeTimers.push(interval);
  }

  /**
   * Zen Tibetan Singing Bowls (Acoustic additive overtone synthesis)
   */
  private startTibetanBowls(ctx: AudioContext, destination: AudioNode) {
    const bowlFundamentals = [216, 288, 324, 432]; // A3, D4, E4, A4
    let bowlIdx = 0;

    const strikeBowl = () => {
      if (this.currentTrack !== 'bowls') return;
      const now = ctx.currentTime;
      const fundamental = bowlFundamentals[bowlIdx % bowlFundamentals.length];
      bowlIdx++;

      // Singing bowl partial ratios: 1.0 (fundamental), 2.76, 5.4, 8.9 (natural bell ratios)
      const partials = [
        { mult: 1.0, gain: 0.14, decay: 4.8 },
        { mult: 2.76, gain: 0.06, decay: 3.6 },
        { mult: 5.4, gain: 0.03, decay: 2.4 },
      ];

      partials.forEach((partial) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Add subtle 1.2Hz frequency beat for authentic singing bowl warble
        osc.frequency.setValueAtTime(fundamental * partial.mult, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(partial.gain, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + partial.decay);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + partial.decay + 0.1);

        this.activeNodes.push(osc, gain);
      });
    };

    strikeBowl();
    const interval = setInterval(strikeBowl, 4200);
    this.activeTimers.push(interval);
  }

  /**
   * Ambient Ethereal Harp (Generative peaceful pentatonic notes)
   */
  private startEtherealHarp(ctx: AudioContext, destination: AudioNode) {
    // C Major Pentatonic: C4, D4, E4, G4, A4, C5, D5, E5, G5
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];

    const playHarpNote = () => {
      if (this.currentTrack !== 'piano') return;
      const now = ctx.currentTime;
      const noteFreq = scale[Math.floor(Math.random() * scale.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(destination);

      osc.start(now);
      osc.stop(now + 2.9);

      this.activeNodes.push(osc, gain, filter);
    };

    playHarpNote();
    const interval = setInterval(playHarpNote, 1400);
    this.activeTimers.push(interval);
  }

  /**
   * Cosmic Analog Synth Pad (Detuned polyphonic analog pad with filter sweep)
   */
  private startAnalogPad(ctx: AudioContext, destination: AudioNode) {
    // D Minor 9 Atmospheric Pad: D3 (146.8), A3 (220.0), C4 (261.6), F4 (349.2), E5 (659.3)
    const padPitches = [146.83, 220.0, 261.63, 349.23];

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(650, ctx.currentTime);
    padFilter.Q.setValueAtTime(2.0, ctx.currentTime);

    // Filter LFO for slow harmonic breathing
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12s cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(280, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    lfo.start(0);

    padPitches.forEach((pitch, i) => {
      // 2 detuned oscillators per note for lush chorusing
      [-4, 4].forEach((cents) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.detune.setValueAtTime(cents, ctx.currentTime);

        gain.gain.setValueAtTime(0.04 / padPitches.length, ctx.currentTime);

        osc.connect(gain);
        gain.connect(padFilter);

        osc.start(0);
        this.activeNodes.push(osc, gain);
      });
    });

    padFilter.connect(destination);
    this.activeNodes.push(padFilter, lfo, lfoGain);
  }

  /**
   * Deep String & Cello Drone (Rich low fundamental with bowing vibrato)
   */
  private startCelloDrone(ctx: AudioContext, destination: AudioNode) {
    // Low D fundamentals: D2 (73.42Hz), D3 (146.83Hz), A3 (220.0Hz)
    const celloFreqs = [73.42, 146.83, 220.0];

    const celloFilter = ctx.createBiquadFilter();
    celloFilter.type = 'lowpass';
    celloFilter.frequency.setValueAtTime(450, ctx.currentTime);
    celloFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    // Natural finger vibrato LFO (4.8 Hz)
    const vibrato = ctx.createOscillator();
    vibrato.frequency.setValueAtTime(4.8, ctx.currentTime);
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(1.6, ctx.currentTime);
    vibrato.connect(vibratoGain);
    vibrato.start(0);

    celloFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      vibratoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.09 / celloFreqs.length, ctx.currentTime);

      osc.connect(gain);
      gain.connect(celloFilter);

      osc.start(0);
      this.activeNodes.push(osc, gain);
    });

    celloFilter.connect(destination);
    this.activeNodes.push(celloFilter, vibrato, vibratoGain);
  }
}

export const sounds = new SoundEffects();
export const focusMusic = new FocusMusicEngine();
