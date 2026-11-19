import { DOMAIN_NODES, type NodeId, type Stratum } from '../domain/model';

const STRATUM_FREQS: Record<Stratum, number> = {
  Intent: 261.63,     // C4
  Content: 293.66,    // D4
  Form: 329.63,       // E4
  Substrate: 392.0,   // G4
  Constraint: 440.0,  // A4
  Outcome: 523.25,    // C5
};

const NODE_OFFSETS: Record<NodeId, number> = {
  intent: 0,
  content: 0,
  ixd: 0,
  vis: 2,
  mot: 4,
  son: 7,
  spa: 9,
  fe: 0,
  gfx: 4,
  xr: 7,
  a11y: 0,
  perf: 3,
  exp: 0,
  eval: -5,
};

function semitone(baseFreq: number, semis: number): number {
  return baseFreq * Math.pow(2, semis / 12);
}

class ProceduralSonicEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private mutedByAblation = false;
  private lastScrollStep = -1;

  public isEnabled(): boolean {
    return this.enabled && !this.mutedByAblation;
  }

  public setMutedByAblation(muted: boolean): void {
    this.mutedByAblation = muted;
  }

  public async toggle(): Promise<boolean> {
    if (!this.enabled) {
      await this.ensureContext();
      this.enabled = true;
      if (!this.mutedByAblation) {
        this.playChord([261.63, 329.63, 392.0], 0.24, 0.04);
      }
    } else {
      this.enabled = false;
    }
    return this.enabled;
  }

  public async setEnabled(next: boolean): Promise<void> {
    if (next) {
      await this.ensureContext();
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  private async ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    gainPeak: number,
    type: OscillatorType = 'sine',
    delaySec = 0
  ): void {
    if (!this.isEnabled() || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + delaySec;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(4800, freq * 5), now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  private playChord(freqs: number[], durationSec: number, gainPerVoice: number): void {
    freqs.forEach((f, idx) => {
      this.playTone(f, durationSec, gainPerVoice, idx === 0 ? 'triangle' : 'sine', idx * 0.028);
    });
  }

  public playNodeSelect(id: NodeId): void {
    const node = DOMAIN_NODES[id];
    const base = STRATUM_FREQS[node.stratum];
    const freq = semitone(base, NODE_OFFSETS[id]);
    this.playTone(freq, 0.22, 0.055, 'triangle');
    this.playTone(freq * 1.5, 0.16, 0.025, 'sine', 0.03);
  }

  public playLensSwitch(index: number): void {
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const freq = scale[index % scale.length];
    this.playTone(freq, 0.12, 0.035, 'sine');
  }

  public playHoverDetent(): void {
    this.playTone(880, 0.045, 0.014, 'sine');
  }

  public playAblate(downstreamCount: number): void {
    // Descending damped interval reflecting causal degradation
    const root = 392.0;
    this.playTone(root, 0.2, 0.045, 'sawtooth', 0);
    const steps = Math.min(4, Math.max(1, downstreamCount));
    for (let i = 1; i <= steps; i++) {
      this.playTone(semitone(root, -i * 2), 0.14, 0.03, 'triangle', i * 0.045);
    }
  }

  public playRestore(): void {
    this.playChord([261.63, 329.63, 392.0, 523.25], 0.28, 0.035);
  }

  public playScrollSync(progress01: number): void {
    const step = Math.floor(progress01 * 12);
    if (step === this.lastScrollStep) return;
    this.lastScrollStep = step;
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const freq = pentatonic[Math.abs(step) % pentatonic.length];
    this.playTone(freq, 0.09, 0.018, 'sine');
  }
}

export const sonicEngine = new ProceduralSonicEngine();
