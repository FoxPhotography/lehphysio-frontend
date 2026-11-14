import logoUrl from '../assets/logo-wordmark.webp';
import { cld } from './image';
import { getStreakTheme, type StreakTheme } from './streakTheme';

export interface ShareCardData {
  username: string;
  avatarUrl?: string | null;
  rankName: string;
  rankEmoji?: string;
  totalXp: number;
  globalRank?: number | null;
  streak?: number;
  batch?: string | null;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

// Deterministic pseudo-random so the card looks the same every time it's made
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const rgba = (rgbSpace: string, a: number) => `rgba(${rgbSpace.split(' ').join(',')},${a})`;

/** The same three-layer flame as the in-app StreakFlame, drawn on canvas (viewBox 0..100). */
function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: StreakTheme) {
  const s = size / 100;
  const layer = (d: [number, number][][], from: string, mid: string) => {
    ctx.beginPath();
    const [start, ...curves] = d;
    ctx.moveTo(x + start[0][0] * s, y + start[0][1] * s);
    for (const c of curves) ctx.bezierCurveTo(x + c[0][0] * s, y + c[0][1] * s, x + c[1][0] * s, y + c[1][1] * s, x + c[2][0] * s, y + c[2][1] * s);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y + 95 * s, 0, y);
    g.addColorStop(0, from); g.addColorStop(0.6, mid); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fill();
  };
  ctx.save();
  ctx.shadowColor = rgba(t.glow, 0.9); ctx.shadowBlur = size * 0.35;
  layer([[[50, 95]], [[70, 95], [85, 80], [82, 58]], [[80, 38], [65, 30], [50, 2]], [[35, 30], [20, 38], [18, 58]], [[15, 80], [30, 95], [50, 95]]], t.c1, t.c2);
  ctx.shadowBlur = 0;
  layer([[[50, 90]], [[65, 90], [75, 78], [72, 58]], [[70, 40], [60, 32], [50, 15]], [[40, 32], [30, 40], [28, 58]], [[25, 78], [35, 90], [50, 90]]], t.c2, t.c3);
  layer([[[50, 85]], [[60, 85], [68, 75], [66, 58]], [[64, 42], [58, 35], [50, 28]], [[42, 35], [36, 42], [34, 58]], [[32, 75], [40, 85], [50, 85]]], t.c3, '#ffffff');
  ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = r * 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.22;
    const a = (Math.PI / 4) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Draws a 1080×1920 story card (Instagram / WhatsApp status) in the owner's streak colours. */
export async function renderShareCard(d: ShareCardData): Promise<Blob | null> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  await document.fonts?.ready;

  const streak = Math.max(0, d.streak || 0);
  const lit = streak > 0;
  // No streak → keep the classic brand orange look
  const t: StreakTheme = lit ? getStreakTheme(streak) : { ...getStreakTheme(1), c1: '#c2410c', c2: '#FF6A00', c3: '#FFB000', glow: '255 106 0', text: '#FFB000' };
  const cx = W / 2, cy = 720, r = 230;

  // ── Background ──
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);
  const top = ctx.createRadialGradient(cx, cy, 40, cx, cy, 980);
  top.addColorStop(0, rgba(t.glow, 0.55));
  top.addColorStop(0.45, rgba(t.glow, 0.16));
  top.addColorStop(1, rgba(t.glow, 0));
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);
  const blob = (x: number, y: number, rad: number, color: string, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  };
  blob(120, 260, 520, t.c1, 0.55);
  blob(W - 80, 1500, 560, t.c1, 0.45);
  blob(W - 160, 380, 360, t.c3, 0.18);

  // Light rays from behind the avatar
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
ti  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12 + rand(i) * 0.2;
    const len = 900 + rand(i + 50) * 400;
    const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    g.addColorStop(0, rgba(t.glow, 0.07 + t.intensity * 0.06));
    g.addColorStop(1, rgba(t.glow, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, len, a - 0.05, a + 0.05);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Embers rising from the bottom
  const emberCount = lit ? 40 + Math.round(t.intensity * 40) : 26;
  for (let i = 0; i < emberCount; i++) {
    const x = rand(i + 1) * W;
    const y = H * (0.35 + Math.pow(rand(i + 200), 0.6) * 0.65);
    const rad = 3 + rand(i + 400) * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 3);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, t.c3);
    g.addColorStop(0.6, rgba(t.glow, 0.5));
    g.addColorStop(1, rgba(t.glow, 0));
    // Softer in the middle band where the text sits
    const inText = x > 150 && x < W - 150 && y > 1000 && y < 1720;
    ctx.globalAlpha = (0.3 + rand(i + 600) * 0.6) * (inText ? 0.35 : 1);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, rad * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (t.key === 'plasma' || t.key === 'supernova' || t.key === 'gold') {
    const n = t.key === 'supernova' ? 18 : t.key === 'plasma' ? 12 : 7;
    for (let i = 0; i < n; i++) {
      // Keep sparkles off the name / rank / stats
      const onLeft = rand(i + 700) < 0.5;
      const x = onLeft ? 70 + rand(i + 800) * 170 : W - 240 + rand(i + 800) * 170;
      const y = 120 + rand(i + 900) * (H - 240);
      drawSparkle(ctx, x, y, 10 + rand(i + 1000) * 18, t.c3);
    }
  }

  // Frame
  ctx.save();
  const frame = ctx.createLinearGradient(0, 0, W, H);
  frame.addColorStop(0, rgba(t.glow, 0.85));
  frame.addColorStop(0.5, rgba(t.glow, 0.12));
  frame.addColorStop(1, rgba(t.glow, 0.85));
  ctx.strokeStyle = frame; ctx.lineWidth = 5;
  roundRect(ctx, 34, 34, W - 68, H - 68, 56); ctx.stroke();
  ctx.restore();

  const [logo, avatar] = await Promise.all([
    loadImage(logoUrl),
    d.avatarUrl ? loadImage(cld(d.avatarUrl, { w: 480, h: 480, crop: 'fill' })) : Promise.resolve(null),
  ]);

  if (logo) {
    const lw = 520, lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 150, lw, lh);
  }

  // ── Avatar with glowing tier ring ──
  ctx.save();
  ctx.shadowColor = rgba(t.glow, 0.95); ctx.shadowBlur = 90;
  ctx.beginPath(); ctx.arc(cx, cy, r + 22, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, t.c3); ring.addColorStop(0.5, t.c2); ring.addColorStop(1, t.c1);
  ctx.fillStyle = ring; ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.fillStyle = '#050505'; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
  } else {
    const fb = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    fb.addColorStop(0, rgba(t.glow, 0.35)); fb.addColorStop(1, '#0b0b0b');
    ctx.fillStyle = fb; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = t.c3; ctx.font = '900 160px Tajawal, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.username.slice(0, 2).toUpperCase(), cx, cy + 8);
  }
  ctx.restore();

  // Flame badge on the ring
  if (lit) {
    const bx = cx + r * 0.72, by = cy + r * 0.72;
    ctx.save();
    ctx.shadowColor = rgba(t.glow, 0.9); ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(bx, by, 62, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a'; ctx.fill();
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = t.c2;
    ctx.beginPath(); ctx.arc(bx, by, 62, 0, Math.PI * 2); ctx.stroke();
    drawFlame(ctx, bx - 40, by - 46, 80, t);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.direction = 'rtl';

  // Username in the tier gradient
  ctx.font = '900 96px Tajawal, sans-serif';
  const nameW = ctx.measureText(d.username).width;
  const ng = ctx.createLinearGradient(cx - nameW / 2, 0, cx + nameW / 2, 0);
  ng.addColorStop(0, lit ? t.c3 : '#ffffff'); ng.addColorStop(0.5, '#ffffff'); ng.addColorStop(1, lit ? t.c2 : '#ffffff');
  ctx.save();
  ctx.shadowColor = rgba(t.glow, 0.6); ctx.shadowBlur = 30;
  ctx.fillStyle = ng;
  ctx.fillText(d.username, cx, 1090);
  ctx.restore();

  if (d.batch) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '700 44px Tajawal, sans-serif';
    ctx.fillText(d.batch, cx, 1158);
  }

  // Rank pill (tier coloured)
  const rankText = `${d.rankEmoji ? d.rankEmoji + ' ' : ''}${d.rankName}`;
  ctx.font = '900 64px Tajawal, sans-serif';
  const pw = ctx.measureText(rankText).width + 130;
  ctx.save();
  ctx.shadowColor = rgba(t.glow, 0.5); ctx.shadowBlur = 40;
  ctx.fillStyle = rgba(t.glow, 0.16);
  roundRect(ctx, cx - pw / 2, 1215, pw, 124, 62); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rgba(t.glow, 0.85); ctx.lineWidth = 4;
  roundRect(ctx, cx - pw / 2, 1215, pw, 124, 62); ctx.stroke();
  ctx.fillStyle = t.text;
  ctx.fillText(rankText, cx, 1300);

  // Streak tier line
  if (lit) {
    ctx.font = '900 50px Tajawal, sans-serif';
    ctx.fillStyle = t.text;
    ctx.save();
    ctx.shadowColor = rgba(t.glow, 0.7); ctx.shadowBlur = 24;
    ctx.fillText(`🔥 ستريك ${t.name}`, cx, 1420);
    ctx.restore();
  }

  // Stats row on a glass panel
  const panelY = 1475, panelH = 220;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  roundRect(ctx, 90, panelY, W - 180, panelH, 44); ctx.fill();
  ctx.strokeStyle = rgba(t.glow, 0.35); ctx.lineWidth = 3;
  roundRect(ctx, 90, panelY, W - 180, panelH, 44); ctx.stroke();
  const stats: [string, string, boolean][] = [
    [d.totalXp.toLocaleString('en-US'), 'XP', false],
    [d.globalRank ? `#${d.globalRank}` : '—', 'الترتيب', false],
    [String(streak), 'يوم ستريك', true],
  ];
  stats.forEach(([value, label, isStreak], i) => {
    const x = W / 2 + (1 - i) * 300; // right-to-left order
    ctx.fillStyle = isStreak && lit ? t.text : '#ffffff';
    ctx.font = '900 80px Tajawal, sans-serif';
    ctx.direction = 'ltr'; ctx.fillText(value, x, panelY + 115);
    ctx.direction = 'rtl'; ctx.fillStyle = '#a1a1aa'; ctx.font = '700 40px Tajawal, sans-serif';
    ctx.fillText(label, x, panelY + 172);
    if (isStreak && lit) {
      ctx.font = '900 80px Tajawal, sans-serif';
      ctx.direction = 'ltr';
      const vw = ctx.measureText(value).width;
      drawFlame(ctx, x - vw / 2 - 64, panelY + 50, 58, t);
    }
  });

  ctx.fillStyle = t.c2;
  ctx.font = '800 46px Tajawal, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText('lehphysio.site', cx, 1800);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Opens the native share sheet with the card, or downloads it where file sharing isn't supported. */
export async function shareCard(d: ShareCardData, profileUrl: string): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await renderShareCard(d);
  if (!blob) return 'failed';
  const file = new File([blob], `lehphysio-${d.username}.png`, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  try {
    if (nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: 'ليه فيزيو؟', text: `بص أنا وصلت لفين على ليه فيزيو 👀\nبقيت ${d.rankName}${d.streak ? ` وعندي ستريك ${d.streak} يوم 🔥` : ''}\nتعالى نافسني 👇\n${profileUrl}` });
      return 'shared';
    }
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return 'shared';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
