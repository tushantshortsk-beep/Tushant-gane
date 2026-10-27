/**
 * Web Audio API Procedural Sound Synthesizer & Tactile Haptics for HD Battle Arena
 * Zero external audio files, ultra-responsive, zero latency, rich multi-layer synthesis.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazily initialized on first user interaction to comply with browser autoplay policies
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Web Audio might not be supported in some environments
    }
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Haptic feedback trigger for mobile devices
  public triggerHaptic(pattern: number | number[] = 25) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe catch on restricted environments
      }
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Weapon fire sounds
  public playShoot(type: 'BLASTER' | 'SHOTGUN' | 'RAILGUN' | 'VULCAN' | 'MISSILE' = 'BLASTER') {
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    if (type === 'BLASTER') {
      // Dual resonant laser zap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'SHOTGUN') {
      // Heavy shotgun blast (sub-thud + noise)
      this.triggerHaptic(30);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'RAILGUN') {
      // Piercing relativistic beam
      this.triggerHaptic(45);
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2100, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.28);

      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(320, now);
      sub.frequency.exponentialRampToValueAtTime(60, now + 0.28);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.28);
      sub.stop(now + 0.28);
    } else if (type === 'VULCAN') {
      // High-cadence rotary pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else {
      // Micro Missile launch & thruster scream
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.16);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  }

  // Hit impact
  public playHit() {
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.07);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Enemy destroyed explosion
  public playExplosion(isBoss: boolean = false) {
    this.triggerHaptic(isBoss ? [50, 40, 80] : 30);
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = isBoss ? 0.75 : 0.3;

    // Sub-bass crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isBoss ? 190 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration);

    gain.gain.setValueAtTime(isBoss ? 0.7 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Dash sound effect
  public playDash() {
    this.triggerHaptic(20);
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.16);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Powerup collected
  public playPowerup() {
    this.triggerHaptic(25);
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.22, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.14);
    });
  }

  // Player hurt
  public playPlayerHurt() {
    this.triggerHaptic([40, 30, 40]);
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Boss alarm siren
  public playBossAlarm() {
    this.triggerHaptic([80, 50, 80, 50, 120]);
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.25;
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(540, t + 0.15);
      osc.frequency.linearRampToValueAtTime(280, t + 0.24);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.24);
    }
  }

  // Wave start / fanfare
  public playWaveStart() {
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [261.6, 329.6, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.28, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.26);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  }

  // Game over
  public playGameOver() {
    this.triggerHaptic([100, 60, 150]);
    if (this.muted) return;
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [440.0, 392.0, 329.6, 220.0];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.35, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.14 + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.38);
    });
  }
}

export const sounds = new SoundEngine();
