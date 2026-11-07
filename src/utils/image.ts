/**
 * Cloudinary delivery helper.
 * Adds automatic format (AVIF/WebP), automatic quality and a width cap to any
 * res.cloudinary.com upload URL, so a 1024px frame shown at 46px is no longer
 * downloaded at full size. Non-Cloudinary URLs are returned untouched.
 *
 * `w` is the CSS width the image is shown at; it is doubled for retina screens.
 */
const UPLOAD_SEGMENT = '/image/upload/';

export interface CldOptions {
  w: number;
  h?: number;
  /** 'fill' crops to the exact box (avatars, thumbnails); 'limit' only shrinks (post images, frames). */
  crop?: 'fill' | 'limit';
}

export function cld(url: string | null | undefined, { w, h, crop = 'limit' }: CldOptions): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes(UPLOAD_SEGMENT)) return url;

  const [base, rest] = url.split(UPLOAD_SEGMENT);
  // Already transformed (first path segment holds a transformation like "w_200,c_fill")
  const firstSegment = rest.split('/')[0];
  if (/(^|,)(w|h|c|q|f)_/.test(firstSegment)) return url;

  const dpr = 2;
  const parts = ['f_auto', 'q_auto', `c_${crop}`, `w_${Math.round(w * dpr)}`];
  if (h) parts.push(`h_${Math.round(h * dpr)}`);
  if (crop === 'fill') parts.push('g_auto');
  return `${base}${UPLOAD_SEGMENT}${parts.join(',')}/${rest}`;
}
