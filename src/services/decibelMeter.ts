export class LiveDecibelMeter {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private isSimulated = false;
  private simInterval: any = null;

  private onUpdateCallback: ((data: {
    currentDb: number;
    peakDb: number;
    averageDb: number;
    frequencyData: Uint8Array;
  }) => void) | null = null;

  private samples: number[] = [];
  private peak = 0;

  async start(
    onUpdate: (data: {
      currentDb: number;
      peakDb: number;
      averageDb: number;
      frequencyData: Uint8Array;
    }) => void
  ): Promise<{ success: boolean; simulated: boolean }> {
    this.onUpdateCallback = onUpdate;
    this.samples = [];
    this.peak = 0;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Web Audio mediaDevices not supported');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source.connect(this.analyser);
      this.isSimulated = false;

      this.processAudio();
      return { success: true, simulated: false };
    } catch (err) {
      console.warn('Microphone access denied or unavailable, switching to realistic simulation:', err);
      this.startSimulation();
      return { success: true, simulated: true };
    }
  }

  private processAudio = () => {
    if (!this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const timeDomain = new Float32Array(bufferLength);
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getFloatTimeDomainData(timeDomain);
    this.analyser.getByteFrequencyData(freqData);

    // Compute RMS
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += timeDomain[i] * timeDomain[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);

    // Calibrated dB relative to 20uPa reference (approx baseline offset ~90)
    let db = rms > 0.00001 ? 20 * Math.log10(rms) + 94 : 32;
    db = Math.max(30, Math.min(105, Math.round(db)));

    this.recordSample(db, freqData);

    this.animFrameId = requestAnimationFrame(this.processAudio);
  };

  private startSimulation() {
    this.isSimulated = true;
    let current = 48;
    const freqData = new Uint8Array(256);

    this.simInterval = setInterval(() => {
      // Gentle realistic random walk
      current += (Math.random() - 0.48) * 4;
      current = Math.max(34, Math.min(84, Math.round(current)));

      // Generate fake frequencies
      for (let i = 0; i < 256; i++) {
        freqData[i] = Math.max(0, Math.min(255, Math.floor(Math.sin(i * 0.1 + Date.now() * 0.005) * 50 + current * 1.5)));
      }

      this.recordSample(current, freqData);
    }, 120);
  }

  private recordSample(db: number, freqData: Uint8Array) {
    if (db > this.peak) this.peak = db;
    this.samples.push(db);
    if (this.samples.length > 50) this.samples.shift();

    const sum = this.samples.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / this.samples.length);

    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        currentDb: db,
        peakDb: this.peak,
        averageDb: avg,
        frequencyData: freqData
      });
    }
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch (_) {}
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (_) {}
      this.audioCtx = null;
    }
  }
}
