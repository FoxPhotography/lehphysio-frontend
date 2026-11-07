import logoUrl from '../assets/logo-wordmark.webp';
import { cld } from './image';

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

/** Draws a 1080×1920 story card (Instagram / WhatsApp status) and returns it as a PNG blob. */
export async function renderShareCard(d: ShareCardData): Promise<Blob | null> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  await document.fonts?.ready;

  // Background: near-black with one warm glow
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 760, 40, W / 2, 760, 820);
  glow.addColorStop(0, 'rgba(255,106,0,0.35)');
  glow.addColorStop(1, 'rgba(255,106,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const [logo, avatar] = await Promise.all([
    loadImage(logoUrl),
    d.avatarUrl ? loadImage(cld(d.avatarUrl, { w: 260, h: 260, crop: 'fill' })) : Promise.resolve(null),
  ]);

  if (logo) {
    const lw = 520, lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 170, lw, lh);
  }

  // Avatar with orange ring
  const cx = W / 2, cy = 720, r = 230;
  ctx.beginPath(); ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, '#FF6A00'); ring.addColorStop(1, '#FFB000');
  ctx.fillStyle = ring; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#1a1208'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#FF6A00'; ctx.font = '900 160px Tajawal, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.username.slice(0, 2).toUpperCase(), cx, cy + 8);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.direction = 'rtl';

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 92px Tajawal, sans-serif';
  ctx.fillText(d.username, cx, 1080);

  if (d.batch) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '700 44px Tajawal, sans-serif';
    ctx.fillText(d.batch, cx, 1150);
  }

  // Rank pill
  const rankText = `${d.rankEmoji ? d.rankEmoji + ' ' : ''}${d.rankName}`;
  ctx.font = '900 64px Tajawal, sans-serif';
  const pw = ctx.measureText(rankText).width + 120;
  ctx.fillStyle = 'rgba(255,106,0,0.14)';
  ctx.strokeStyle = 'rgba(255,106,0,0.6)'; ctx.lineWidth = 4;
  roundRect(ctx, cx - pw / 2, 1210, pw, 120, 60); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFB000';
  ctx.fillText(rankText, cx, 1293);

  // Stats row
  const stats: [string, string][] = [
    [d.totalXp.toLocaleString('en-US'), 'XP'],
    [d.globalRank ? `#${d.globalRank}` : '—', 'الترتيب'],
    [String(d.streak ?? 0), 'أيام متتالية'],
  ];
  stats.forEach(([value, label], i) => {
    const x = W / 2 + (1 - i) * 320; // right-to-left order
    ctx.fillStyle = '#ffffff'; ctx.font = '900 78px Tajawal, sans-serif';
    ctx.direction = 'ltr'; ctx.fillText(value, x, 1520);
    ctx.direction = 'rtl'; ctx.fillStyle = '#71717a'; ctx.font = '700 40px Tajawal, sans-serif';
    ctx.fillText(label, x, 1580);
  });

  ctx.fillStyle = '#FF6A00';
  ctx.font = '800 46px Tajawal, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText('lehphysio.site', cx, 1780);

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
      await nav.share({ files: [file], title: 'ليه فيزيو؟', text: `رتبتي على ليه فيزيو: ${d.rankName} 🔥\n${profileUrl}` });
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
