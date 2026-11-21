import { useEffect, useRef, useState } from 'react';

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  formatted: string;
}

export function useCountdown(targetIso?: string | null, onExpire?: () => void): CountdownState {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const firedRef = useRef(false);

  const calc = (): CountdownState => {
    if (!targetIso) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, formatted: '' };
    }
    const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, formatted: '00:00:00' };
    }
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    const formatted = days > 0 ? `${days} يوم · ${timeStr}` : timeStr;
    return { days, hours, minutes, seconds, expired: false, formatted };
  };

  const [state, setState] = useState<CountdownState>(calc);

  useEffect(() => {
    firedRef.current = false;
    setState(calc());
    if (!targetIso) return undefined;

    const id = setInterval(() => {
      const next = calc();
      setState(next);
      if (next.expired && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);

  return state;
}

export function getOrCreateDeviceId(): string {
  try {
    const key = 'lehphysio_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return '';
  }
}
