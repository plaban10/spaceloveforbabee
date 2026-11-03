class PlanetRotationAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isInitialized: boolean = false;
  private decayTimeout: number | null = null;
  private currentVolume: number = 0;

  private init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain for planet rotation hum
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Warm, physical lowpass filter to produce a deep gyroscopic planetary hum
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(4.2, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Subtle slow wobble LFO to give organic rotational rumble
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoGain = this.ctx.createGain();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(3.5, this.ctx.currentTime);
      this.lfoGain.gain.setValueAtTime(18, this.ctx.currentTime);
      this.lfoOsc.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);
      this.lfoOsc.start();

      // Sub oscillator (Fundamental ~48 Hz low hum)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(48, this.ctx.currentTime);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.subOsc.connect(subGain);
      subGain.connect(this.filter);
      this.subOsc.start();

      // Second harmonic oscillator (warm triangle for physical gear/mass texture ~96 Hz)
      this.harmonicOsc = this.ctx.createOscillator();
      this.harmonicOsc.type = 'triangle';
      this.harmonicOsc.frequency.setValueAtTime(96.4, this.ctx.currentTime);

      const harmonicGain = this.ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(this.filter);
      this.harmonicOsc.start();

      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  /**
   * Called during active pointer drag when manually orbiting the planet.
   * @param speed Pixel delta speed of the manual rotation gesture
   */
  public updateHum(speed: number) {
    this.init();
    if (!this.ctx || !this.masterGain || !this.filter || !this.subOsc || !this.harmonicOsc) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.decayTimeout) {
      window.clearTimeout(this.decayTimeout);
      this.decayTimeout = null;
    }

    const now = this.ctx.currentTime;

    // Map gesture speed to volume: subtle hum peaking around 0.18 max volume
    const normalizedSpeed = Math.min(1.0, Math.max(0.05, speed / 24));
    const targetGain = 0.04 + normalizedSpeed * 0.16;

    // Pitch rises slightly with rotation velocity (48 Hz -> 68 Hz)
    const targetSubFreq = 48 + normalizedSpeed * 20;
    const targetHarmonicFreq = 96 + normalizedSpeed * 40;
    const targetFilterCutoff = 120 + normalizedSpeed * 90;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.04);

    this.subOsc.frequency.cancelScheduledValues(now);
    this.subOsc.frequency.linearRampToValueAtTime(targetSubFreq, now + 0.05);

    this.harmonicOsc.frequency.cancelScheduledValues(now);
    this.harmonicOsc.frequency.linearRampToValueAtTime(targetHarmonicFreq, now + 0.05);

    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.linearRampToValueAtTime(targetFilterCutoff, now + 0.05);

    this.currentVolume = targetGain;

    // Schedule auto-decay if no further movements happen within 90ms
    this.decayTimeout = window.setTimeout(() => {
      this.stop();
    }, 90);
  }

  /**
   * Smoothly fades out the low-frequency rotation hum when rotation halts.
   */
  public stop() {
    if (!this.ctx || !this.masterGain) return;
    if (this.decayTimeout) {
      window.clearTimeout(this.decayTimeout);
      this.decayTimeout = null;
    }

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.12);
    this.currentVolume = 0;
  }

  public destroy() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Ignored
      }
    }
  }
}

export const planetRotationAudio = new PlanetRotationAudioEngine();
