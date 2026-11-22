// Leh Physio Procedural Web Audio Sound Engine (Zero external assets, hardware-friendly)

export interface AudioSettings {
  master: boolean;
  sfx: boolean;
  sfxVolume: number; // 0..1
  bgm: boolean;
  bgmVolume: number; // 0..1
}

export type SoundEvent =
  | 'tap'
  | 'nav'
  | 'select'
  | 'confirm'
  | 'send'
  | 'receive'
  | 'react'
  | 'correct'
  | 'wrong'
  | 'countdown'
  | 'timer_warn'
  | 'reward'
  | 'xp_gain'
  | 'xp_loss'
  | 'level_up'
  | 'game_start'
  | 'game_win'
  | 'jackpot'
  | 'notification'
  | 'room_join'
  | 'round_start'
  | 'clinic_clue'
  | 'osce_tick'
  | 'muscle_pick'
  | 'sudoku_place'
  | 'wordle_key'
  | 'wordle_flip'
  | 'nerve_pulse'
  | 'match_connect'
  | 'wheel_tick';

const STORAGE_KEY = 'lp:audio-settings';

const DEFAULT_SETTINGS: AudioSettings = {
  master: true,
  sfx: true,
  sfxVolume: 0.75,
  bgm: false,
  bgmVolume: 0.25,
};

let cachedSettings: AudioSettings = loadSettings();
const listeners = new Set<(s: AudioSettings) => void>();
const lastPlayedAt = new Map<string, number>();

let audioCtx: AudioContext | null = null;
let bgmTimer: number | null = null;
let bgmStep = 0;

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      master: typeof parsed.master === 'boolean' ? parsed.master : DEFAULT_SETTINGS.master,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : DEFAULT_SETTINGS.sfx,
      sfxVolume:
        typeof parsed.sfxVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.sfxVolume))
          : DEFAULT_SETTINGS.sfxVolume,
      bgm: typeof parsed.bgm === 'boolean' ? parsed.bgm : DEFAULT_SETTINGS.bgm,
      bgmVolume:
        typeof parsed.bgmVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.bgmVolume))
          : DEFAULT_SETTINGS.bgmVolume,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function getContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number | null,
  delaySec: number,
  durSec: number,
  vol: number,
  type: OscillatorType = 'triangle'
) {
  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, freqStart), start);
  if (freqEnd !== null && freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), start + durSec);
  }
  const safeVol = Math.max(0.002, Math.min(0.45, vol));
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(safeVol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durSec + 0.02);
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // ignore disconnect errors
    }
  };
}

export function getAudioSettings(): AudioSettings {
  return cachedSettings;
}

export function subscribeAudioSettings(fn: (s: AudioSettings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function updateAudioSettings(partial: Partial<AudioSettings>): AudioSettings {
  cachedSettings = { ...cachedSettings, ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSettings));
  } catch {
    // ignore storage limits
  }
  if (!cachedSettings.master || !cachedSettings.bgm) {
    stopAmbient();
  } else {
    startAmbientIfEnabled();
  }
  listeners.forEach((fn) => fn(cachedSettings));
  return cachedSettings;
}

const THROTTLE_MS: Partial<Record<SoundEvent, number>> = {
  tap: 40,
  wordle_key: 25,
  wheel_tick: 28,
  osce_tick: 28,
  nav: 80,
};

export function playSound(event: SoundEvent): void {
  if (!cachedSettings.master || !cachedSettings.sfx || cachedSettings.sfxVolume <= 0) return;

  const nowMs = performance.now();
  const minGap = THROTTLE_MS[event] ?? 65;
  const prevMs = lastPlayedAt.get(event) ?? 0;
  if (nowMs - prevMs < minGap) return;
  lastPlayedAt.set(event, nowMs);

  const ctx = getContext();
  if (!ctx) return;

  const v = cachedSettings.sfxVolume;

  switch (event) {
    case 'tap':
      tone(ctx, 520, 680, 0, 0.045, 0.045 * v, 'sine');
      break;
    case 'nav':
      tone(ctx, 420, 560, 0, 0.06, 0.04 * v, 'triangle');
      break;
    case 'select':
      tone(ctx, 580, 740, 0, 0.065, 0.055 * v, 'sine');
      break;
    case 'confirm':
      tone(ctx, 523.25, 523.25, 0, 0.07, 0.06 * v, 'triangle');
      tone(ctx, 783.99, 783.99, 0.06, 0.11, 0.07 * v, 'triangle');
      break;
    case 'send':
      tone(ctx, 600, 980, 0, 0.1, 0.05 * v, 'sine');
      break;
    case 'receive':
      tone(ctx, 523.25, 523.25, 0, 0.07, 0.055 * v, 'triangle');
      tone(ctx, 659.25, 659.25, 0.06, 0.07, 0.055 * v, 'triangle');
      tone(ctx, 783.99, 783.99, 0.12, 0.16, 0.05 * v, 'triangle');
      break;
    case 'react':
      tone(ctx, 460, 1080, 0, 0.085, 0.055 * v, 'sine');
      break;
    case 'correct':
      tone(ctx, 523.25, 523.25, 0, 0.1, 0.09 * v, 'triangle');
      tone(ctx, 659.25, 659.25, 0.09, 0.1, 0.095 * v, 'triangle');
      tone(ctx, 783.99, 783.99, 0.18, 0.18, 0.1 * v, 'triangle');
      break;
    case 'wrong':
      tone(ctx, 195, 110, 0, 0.22, 0.11 * v, 'sawtooth');
      break;
    case 'countdown':
      tone(ctx, 660, 640, 0, 0.09, 0.07 * v, 'sine');
      break;
    case 'timer_warn':
      tone(ctx, 880, 740, 0, 0.075, 0.08 * v, 'square');
      break;
    case 'reward':
    case 'xp_gain':
      tone(ctx, 523.25, 523.25, 0, 0.09, 0.08 * v, 'triangle');
      tone(ctx, 659.25, 659.25, 0.08, 0.09, 0.08 * v, 'triangle');
      tone(ctx, 783.99, 783.99, 0.16, 0.12, 0.09 * v, 'triangle');
      tone(ctx, 1046.5, 1046.5, 0.26, 0.25, 0.09 * v, 'triangle');
      break;
    case 'xp_loss':
      tone(ctx, 300, 90, 0, 0.28, 0.08 * v, 'sawtooth');
      break;
    case 'level_up':
    case 'game_win':
      tone(ctx, 392.0, 392.0, 0, 0.11, 0.085 * v, 'triangle');
      tone(ctx, 523.25, 523.25, 0.1, 0.11, 0.09 * v, 'triangle');
      tone(ctx, 659.25, 659.25, 0.2, 0.12, 0.095 * v, 'triangle');
      tone(ctx, 783.99, 783.99, 0.31, 0.28, 0.11 * v, 'triangle');
      break;
    case 'jackpot':
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, i) => {
        tone(ctx, freq, freq * 1.01, i * 0.07, 0.28, 0.11 * v, 'triangle');
      });
      break;
    case 'game_start':
      tone(ctx, 293.66, 587.33, 0, 0.22, 0.09 * v, 'sine');
      tone(ctx, 587.33, 880, 0.16, 0.16, 0.08 * v, 'triangle');
      break;
    case 'notification':
      tone(ctx, 783.99, 987.77, 0, 0.11, 0.06 * v, 'sine');
      break;
    case 'room_join':
      tone(ctx, 440, 554.37, 0, 0.08, 0.06 * v, 'triangle');
      tone(ctx, 659.25, 659.25, 0.07, 0.12, 0.065 * v, 'triangle');
      break;
    case 'round_start':
      tone(ctx, 440, 440, 0, 0.08, 0.07 * v, 'sine');
      tone(ctx, 880, 880, 0.11, 0.18, 0.085 * v, 'triangle');
      break;
    // Game-specific signatures
    case 'clinic_clue':
      tone(ctx, 980, 1180, 0, 0.06, 0.055 * v, 'sine');
      tone(ctx, 1180, 1180, 0.08, 0.05, 0.04 * v, 'sine');
      break;
    case 'osce_tick':
      tone(ctx, 950, 820, 0, 0.04, 0.04 * v, 'sine');
      break;
    case 'muscle_pick':
      tone(ctx, 360, 540, 0, 0.075, 0.065 * v, 'triangle');
      break;
    case 'sudoku_place':
      tone(ctx, 620, 740, 0, 0.055, 0.055 * v, 'sine');
      break;
    case 'wordle_key':
      tone(ctx, 340, 390, 0, 0.032, 0.04 * v, 'sine');
      break;
    case 'wordle_flip':
      tone(ctx, 420, 620, 0, 0.08, 0.05 * v, 'triangle');
      break;
    case 'nerve_pulse':
      tone(ctx, 720, 1320, 0, 0.11, 0.055 * v, 'sine');
      break;
    case 'match_connect':
      tone(ctx, 587.33, 880, 0, 0.12, 0.07 * v, 'triangle');
      break;
    case 'wheel_tick':
      tone(ctx, 1120, 780, 0, 0.035, 0.048 * v, 'triangle');
      break;
  }
}

const BGM_CHORDS = [
  [220.0, 277.18, 329.63], // A major subtle warm pad
  [196.0, 246.94, 293.66], // G
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];

export function startAmbientIfEnabled(): void {
  if (typeof window === 'undefined') return;
  if (!cachedSettings.master || !cachedSettings.bgm || cachedSettings.bgmVolume <= 0) return;
  if (document.hidden || bgmTimer !== null) return;

  const playPadChord = () => {
    if (!cachedSettings.master || !cachedSettings.bgm || document.hidden) return;
    const ctx = getContext();
    if (!ctx || ctx.state !== 'running') return;
    const chord = BGM_CHORDS[bgmStep % BGM_CHORDS.length];
    bgmStep += 1;
    const vol = 0.015 * cachedSettings.bgmVolume;
    chord.forEach((freq) => {
      tone(ctx, freq, freq, 0, 2.6, vol, 'sine');
    });
  };

  playPadChord();
  bgmTimer = window.setInterval(playPadChord, 2800);
}

export function stopAmbient(): void {
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAmbient();
    } else if (cachedSettings.master && cachedSettings.bgm) {
      startAmbientIfEnabled();
    }
  });
}
