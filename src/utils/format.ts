/** Arabic (Egypt) formatting with Latin digits, which read better next to "XP" and usernames. */
export const LOCALE = 'ar-EG-u-nu-latn';

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' });

export function timeAgo(date: string | number | Date): string {
  const diffSec = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return 'دلوقتي';
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (abs < 2629800) return rtf.format(Math.round(diffSec / 604800), 'week');
  return formatDate(date);
}

export function formatDate(date: string | number | Date, withTime = false): string {
  return new Date(date).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: new Date(date).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function formatTime(date: string | number | Date): string {
  return new Date(date).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
}

export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

/** "1 يوم" / "2 يوم" / "11 يوم" – simple, natural Egyptian counting for streak days. */
export const daysLabel = (n: number) => (n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : `${n} أيام`);

/**
 * Direction for a message that may start with @mentions or emoji: decided by the first
 * strong letter *after* removing mentions, so "@Mai أهلا" reads right-to-left.
 */
export function textDir(text: string | null | undefined): 'rtl' | 'ltr' | 'auto' {
  if (!text) return 'auto';
  const stripped = text.replace(/@[^\s@]+(?:\s[A-Z][\w-]*)*/g, ' ');
  const m = stripped.match(/[A-Za-zÀ-ɏ]|[֐-ࣿיִ-﷿ﹰ-﻿]/);
  if (!m) return 'auto';
  return /[A-Za-zÀ-ɏ]/.test(m[0]) ? 'ltr' : 'rtl';
}
