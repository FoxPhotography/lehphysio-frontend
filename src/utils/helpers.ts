// Web Audio API Sound Generator (Zero external dependencies)
let globalAudioCtx: any = null;

export const playChatSound = (type: 'send' | 'receive' | 'react' | 'success' | 'error' | 'start' | 'win' | 'tick' | 'xp_gain' | 'xp_loss') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    const ctx = globalAudioCtx;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.12);
    } else if (type === 'receive') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.06);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.setValueAtTime(0.05, now + 0.06);
      gain.gain.setValueAtTime(0.05, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } else if (type === 'react') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.1, now);
      osc.start();
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.stop(now + 0.4);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start();
      osc.stop(now + 0.3);
    } else if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(261.63, now);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start();
      osc.stop(now + 0.4);
    } else if (type === 'win') {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0.1, startTime);
        g.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.02);
        o.start(startTime);
        o.stop(startTime + duration);
      };
      playTone(261.63, now, 0.15);
      playTone(329.63, now + 0.15, 0.15);
      playTone(392.00, now + 0.3, 0.15);
      playTone(523.25, now + 0.45, 0.4);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'xp_gain') {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0.08, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.02);
        o.start(startTime);
        o.stop(startTime + duration);
      };
      playTone(523.25, now, 0.1);
      playTone(659.25, now + 0.1, 0.1);
      playTone(783.99, now + 0.2, 0.15);
      playTone(1046.50, now + 0.35, 0.3);
    } else if (type === 'xp_loss') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start();
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Audio context blocked
  }
};

export const getNameColor = (username: string) => {
  if (!username) return '#FFB000';
  const colors = ['#FF6A00', '#FFB000', '#3498db', '#9b59b6', '#2ecc71', '#e74c3c', '#1abc9c', '#e67e22', '#e84393', '#00cec9'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  // Use youtube-nocookie.com for privacy-enhanced mode (reduces tracking)
  return (match && match[2].length === 11) ? `https://www.youtube-nocookie.com/embed/${match[2]}?rel=0&modestbranding=1` : '';
};

export const getLocalDateString = () => {
  const d = new Date();
  const options = { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
  const year = parts.find((p: any) => p.type === 'year')?.value;
  const month = parts.find((p: any) => p.type === 'month')?.value;
  const day = parts.find((p: any) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

// Frame image cache (populated by App.tsx on mount)
let framesCache: any[] = [];

export const setFramesCache = (frames: any[]) => {
  framesCache = frames;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
};

export const getFrameImage = (frameId: string | null | undefined): string | null => {
  if (!frameId || frameId === 'none') return null;
  // CSS frame names are not PNG overlays
  if (frameId === 'gold-glow' || frameId === 'neon-ring') return null;
  const numericId = parseInt(frameId, 10);
  if (isNaN(numericId)) return null;
  const frame = framesCache.find((f: any) => f._id === numericId || f.id === numericId);
  return frame?.image_url || null;
};
