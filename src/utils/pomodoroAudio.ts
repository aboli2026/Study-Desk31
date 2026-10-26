import { PomodoroSound } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext not available:', e);
    return null;
  }
}

/**
 * Plays an organic synthesized sound using Web Audio API for timer completion.
 */
export function playMinimalPomodoroSound(
  soundType: PomodoroSound = 'crystal',
  volume: number = 0.65
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    const clampedVol = Math.max(0, Math.min(1, volume));
    masterGain.gain.setValueAtTime(clampedVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (soundType) {
      case 'bell': {
        // Bell chime
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.8);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 1.85);
        });
        break;
      }
      case 'marimba': {
        // Wooden acoustic bounce
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.4, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.65);
        });
        break;
      }
      case 'zen': {
        // Deep singing bowl tone
        const baseFreq = 220;
        [1, 2.76, 5.4].forEach((harmonic, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq * harmonic, now);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.3 / (idx + 1), now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 3.05);
        });
        break;
      }
      case 'soft': {
        // Soft mellow chime
        [587.33, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.15 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 1.25);
        });
        break;
      }
      case 'crystal':
      default: {
        // Sparkly crystal chime
        [659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.5);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 1.55);
        });
        break;
      }
    }
  } catch (e) {
    console.warn('Could not play sound:', e);
  }
}

/**
 * Plays a short, gentle ding for checklist/task completion.
 */
export function playMinimalDingSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(Math.min(1, Math.max(0, volume)), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);
  } catch (e) {
    console.warn('Could not play ding:', e);
  }
}

/**
 * Sends a standard browser notification if permitted.
 */
export function sendBrowserNotification(title: string, message: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/assets/aistudio/image_6b85288b.png',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/assets/aistudio/image_6b85288b.png',
          });
        }
      });
    }
  } catch (e) {
    console.warn('Notification error:', e);
  }
}
