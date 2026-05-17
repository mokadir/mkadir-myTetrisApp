/**
 * SoundManager - Arcade-style sound effects using Web Audio API
 *
 * Generates retro game sounds procedurally using oscillators and noise.
 * No external audio files needed - all sounds are synthesized.
 * Includes optional background music with mute toggle.
 */

import { SoundEffect } from '../types';

type OscillatorNodeType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorNodeType;
  volume?: number;
  slide?: number; // frequency slide
  noise?: boolean; // add noise
  square2?: boolean; // second square wave for richness
}

/** Sound configurations for each game event */
const SOUND_CONFIGS: Record<SoundEffect, SoundConfig> = {
  move: {
    frequency: 200,
    duration: 0.05,
    type: 'square',
    volume: 0.1,
  },
  rotate: {
    frequency: 300,
    duration: 0.08,
    type: 'square',
    volume: 0.12,
    slide: 400,
  },
  drop: {
    frequency: 150,
    duration: 0.15,
    type: 'square',
    volume: 0.15,
    slide: 80,
  },
  lineClear: {
    frequency: 523,
    duration: 0.3,
    type: 'square',
    volume: 0.15,
    slide: 800,
    square2: true,
  },
  tetris: {
    frequency: 523,
    duration: 0.6,
    type: 'square',
    volume: 0.2,
    slide: 1047,
    square2: true,
  },
  gameOver: {
    frequency: 400,
    duration: 0.8,
    type: 'sawtooth',
    volume: 0.2,
    slide: 80,
  },
  levelUp: {
    frequency: 440,
    duration: 0.4,
    type: 'square',
    volume: 0.18,
    slide: 880,
    square2: true,
  },
  hold: {
    frequency: 250,
    duration: 0.1,
    type: 'square',
    volume: 0.1,
    slide: 350,
  },
};

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicInterval: NodeJS.Timeout | null = null;
  private musicPlaying: boolean = false;

  /** Initialize the audio context (must be called after user interaction) */
  init(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  /** Toggle mute state */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
    }
    if (this.isMuted && this.musicPlaying) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  /** Get current mute state */
  getMuted(): boolean {
    return this.isMuted;
  }

  /** Play a sound effect */
  play(sound: SoundEffect): void {
    if (this.isMuted || !this.audioContext || !this.masterGain) return;

    const config = SOUND_CONFIGS[sound];
    if (!config) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, now);
    if (config.slide) {
      osc.frequency.linearRampToValueAtTime(config.slide, now + config.duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(config.volume || 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + config.duration);

    // Second oscillator for richer sound
    if (config.square2) {
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(config.frequency * 1.5, now);
      if (config.slide) {
        osc2.frequency.linearRampToValueAtTime(config.slide * 1.5, now + config.duration);
      }
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime((config.volume || 0.15) * 0.5, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now);
      osc2.stop(now + config.duration);
    }
  }

  /** Generate a simple procedural music loop (Tetris-inspired melody) */
  private melodyNotes: number[] = [
    // Simple melodic pattern using pentatonic scale
    262, 294, 330, 349, 392, 349, 330, 294, // C D E F G F E D
    262, 330, 392, 440, 392, 330, 262, 294, // C E G A G E C D
    330, 392, 523, 392, 330, 294, 262, 294, // E G C G E D C D
    330, 349, 392, 523, 392, 349, 330, 294, // E F G C G F E D
  ];

  /** Start background music */
  startMusic(): void {
    if (this.isMuted || this.musicPlaying || !this.audioContext) return;
    this.musicPlaying = true;
    this.playMusicSequence();
  }

  private musicIndex = 0;

  private playMusicSequence(): void {
    if (!this.musicPlaying || !this.audioContext || this.isMuted) return;

    const ctx = this.audioContext;
    const note = this.melodyNotes[this.musicIndex];
    const now = ctx.currentTime;
    const duration = 0.15;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(note, now);
    // Add a bit of vibrato
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 6;
    vibrato.type = 'sine';
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = 3;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);

    this.musicIndex = (this.musicIndex + 1) % this.melodyNotes.length;

    // Schedule next note
    this.musicInterval = setTimeout(() => this.playMusicSequence(), duration * 1000 * 1.3);
  }

  /** Stop background music */
  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /** Clean up resources */
  destroy(): void {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/** Singleton instance */
export const soundManager = new SoundManager();
export default soundManager;
