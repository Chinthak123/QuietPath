// Web Audio API Ambient Soundscape Generator
// Creates realistic, calming park wind / gentle rustle for serene zones,
// or low-frequency urban traffic rumble for noisy zones.

export class SoundscapeSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private targetDb = 45;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate 5 seconds of procedural looping pink/brown noise buffer
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration (smooth and warm like wind or distant road)
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  start(initialDb: number = 42) {
    if (this.isPlaying) return;
    this.targetDb = initialDb;

    try {
      this.initContext();
      if (!this.ctx) return;

      const buffer = this.createNoiseBuffer();
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.gainNode = this.ctx.createGain();

      this.updateAcousticTuning(initialDb);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start(0);
      this.isPlaying = true;
    } catch (err) {
      console.warn('Audio Synthesizer start error:', err);
    }
  }

  updateAcousticTuning(db: number) {
    this.targetDb = db;
    if (!this.filterNode || !this.gainNode || !this.ctx) return;

    const now = this.ctx.currentTime;

    if (db < 50) {
      // Serene Sanctuary: Low-pass filtered gentle breeze
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setTargetAtTime(280, now, 0.4);
      this.filterNode.Q.setTargetAtTime(1.0, now, 0.4);
      this.gainNode.gain.setTargetAtTime(0.08, now, 0.4);
    } else if (db < 65) {
      // Moderate: Slightly brighter ambient hum
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setTargetAtTime(450, now, 0.4);
      this.filterNode.Q.setTargetAtTime(1.5, now, 0.4);
      this.gainNode.gain.setTargetAtTime(0.12, now, 0.4);
    } else {
      // Loud: Deep low rumble + high frequency friction
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setTargetAtTime(750, now, 0.4);
      this.filterNode.Q.setTargetAtTime(2.0, now, 0.4);
      this.gainNode.gain.setTargetAtTime(0.18, now, 0.4);
    }
  }

  setVolume(vol: number) {
    if (!this.gainNode || !this.ctx) return;
    this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.1);
  }

  stop() {
    if (!this.isPlaying) return;
    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.isPlaying = false;
    } catch (_) {}
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundscape = new SoundscapeSynthesizer();
