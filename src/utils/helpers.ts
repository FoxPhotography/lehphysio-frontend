import { playSound, type SoundEvent } from './soundEngine';

const CHAT_SOUND_MAP: Record<string, SoundEvent> = {
  send: 'send',
  receive: 'receive',
  react: 'react',
  success: 'correct',
  error: 'wrong',
  start: 'game_start',
  win: 'game_win',
  tick: 'osce_tick',
  xp_gain: 'xp_gain',
  xp_loss: 'xp_loss',
};

export const playChatSound = (
  type: 'send' | 'receive' | 'react' | 'success' | 'error' | 'start' | 'win' | 'tick' | 'xp_gain' | 'xp_loss'
) => {
  playSound(CHAT_SOUND_MAP[type] || 'tap');
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

export const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  const simpleMatch = url.match(/([a-zA-Z0-9_-]{11})/);
  return simpleMatch ? simpleMatch[1] : null;
};

export const getYoutubeEmbedUrl = (url: string) => {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : '';
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

// Local static frame paths bundled in the frontend for 0 network lag & 0 broken links
export const DEFAULT_LOCAL_FRAMES: Record<number, string> = {
  1: '/frames/1.png',
  4: '/frames/4.png',
  7: '/frames/7.png',
  8: '/frames/8.png',
  9: '/frames/9.png',
  10: '/frames/10.png',
};

// Frame image cache: pre-populated with all bundled frames so it is NEVER empty
let framesCache: any[] = [
  { _id: 9, id: 9, name: 'Cat ears', price: 150, image_url: '/frames/9.png' },
  { _id: 8, id: 8, name: 'Red hooded headband', price: 500, image_url: '/frames/8.png' },
  { _id: 7, id: 7, name: 'Golden starburst', price: 1500, image_url: '/frames/7.png' },
  { _id: 4, id: 4, name: 'Legendary', price: 3000, image_url: '/frames/4.png' },
  { _id: 1, id: 1, name: 'Pookie', price: 6000, image_url: '/frames/1.png' },
  { _id: 10, id: 10, name: 'Yuumi Kitties', price: 0, image_url: '/frames/10.png', exclusive_users: ['sana', 'fox'] },
];

export const setFramesCache = (frames: any[]) => {
  if (Array.isArray(frames) && frames.length) {
    framesCache = frames.map(f => {
      const local = DEFAULT_LOCAL_FRAMES[Number(f._id || f.id)];
      return local ? { ...f, image_url: local } : f;
    });
  }
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
  if (DEFAULT_LOCAL_FRAMES[numericId]) {
    return DEFAULT_LOCAL_FRAMES[numericId];
  }
  const frame = framesCache.find((f: any) => f._id === numericId || f.id === numericId);
  return frame?.image_url || null;
};
