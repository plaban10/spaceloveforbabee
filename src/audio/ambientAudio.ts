class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private chordOscs: OscillatorNode[] = [];
  private chimeTimer: number | null = null;

  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master volume with limiter
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Warm resonant low-pass filter for ambient space drone
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);
    filter.connect(this.masterGain);

    // Slow LFO gently moving the filter frequency
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Deep binaural cosmic drone oscillators
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.osc1.connect(osc1Gain);
    osc1Gain.connect(filter);
    this.osc1.start();

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(55.6, this.ctx.currentTime); // Binaural beat ~0.6 Hz
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    this.osc2.start();

    // Sub-bass drone
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'triangle';
    this.subOsc.frequency.setValueAtTime(27.5, this.ctx.currentTime); // A0
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.subOsc.connect(subGain);
    subGain.connect(filter);
    this.subOsc.start();

    // Celestial harmonics (A minor 9th shimmering chord)
    const chordFreqs = [220, 277.18, 329.63, 493.88];
    this.chordOscs = chordFreqs.map((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.04, this.ctx!.currentTime);
      osc.connect(g);
      g.connect(filter);
      osc.start();
      return osc;
    });

    // Start sporadic celestial chime generator
    this.startChimes();
  }

  private startChimes() {
    const celestialNotes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5]; // C5, E5, G5, B5, C6, E6
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 6000;
      this.chimeTimer = window.setTimeout(() => {
        if (!this.isMuted && this.ctx) {
          this.playChime(celestialNotes[Math.floor(Math.random() * celestialNotes.length)]);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  private playChime(freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.6);
  }

  public toggle(): boolean {
    this.initContext();
    if (!this.ctx || !this.masterGain) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;
    if (this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(0, now + 1.2);
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0.5, now + 1.5);
    }
    return !this.isMuted;
  }

  public getIsPlaying(): boolean {
    return !this.isMuted;
  }

  public triggerWarpSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // Deep rumble charge up
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(40, now);
      rumbleOsc.frequency.exponentialRampToValueAtTime(160, now + 1.2);
      rumbleOsc.frequency.exponentialRampToValueAtTime(30, now + 3.2);

      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(80, now);
      rumbleFilter.frequency.linearRampToValueAtTime(450, now + 1.2);
      rumbleFilter.frequency.exponentialRampToValueAtTime(60, now + 3.5);

      rumbleGain.gain.setValueAtTime(0.001, now);
      rumbleGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.6);

      rumbleOsc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.masterGain!);

      rumbleOsc.start(now);
      rumbleOsc.stop(now + 3.7);

      // Hyperspace chime burst
      const warpChime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      warpChime.type = 'sine';
      warpChime.frequency.setValueAtTime(440, now);
      warpChime.frequency.exponentialRampToValueAtTime(1760, now + 1.4);

      chimeGain.gain.setValueAtTime(0.001, now);
      chimeGain.gain.linearRampToValueAtTime(0.12, now + 1.2);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      warpChime.connect(chimeGain);
      chimeGain.connect(this.masterGain!);

      warpChime.start(now);
      warpChime.stop(now + 3.1);
    } catch {
      // Ignored if audio isn't initialized yet
    }
  }

  public destroy() {
    if (this.chimeTimer) clearTimeout(this.chimeTimer);
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export const ambientAudio = new AmbientAudioEngine();
