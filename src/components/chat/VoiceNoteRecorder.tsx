import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Send, Loader2, Lock, ChevronUp, ChevronRight, Mic } from 'lucide-react';

interface VoiceNoteRecorderProps {
  locked: boolean;
  gestureRef?: React.RefObject<HTMLDivElement | null>;
  actionSignal?: 'send' | 'cancel' | null;
  onCancel: () => void;
  onSend: (audioBlob: Blob, durationSec: number, mimeType: string) => Promise<void>;
  onError?: (msg: string) => void;
}

const NUM_BARS = 20;

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  locked,
  gestureRef,
  actionSignal = null,
  onCancel,
  onSend,
  onError,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const mimeRef = useRef<string>('audio/webm');
  const canceledRef = useRef(false);
  const handledSignalRef = useRef<string | null>(null);

  const cleanupMedia = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted || canceledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const mime = pickSupportedMimeType();
        mimeRef.current = mime || 'audio/webm';
        const recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);

        chunksRef.current = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
        };
        recorder.start(120);
        recorderRef.current = recorder;
        startTimeRef.current = Date.now();
        setReady(true);

        // GPU-only direct DOM scaleY updates (~24fps) -> 0 React re-renders
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let lastDraw = 0;

          const tick = (now: number) => {
            if (!mounted) return;
            if (now - lastDraw >= 42) {
              lastDraw = now;
              analyser.getByteFrequencyData(dataArray);
              for (let i = 0; i < NUM_BARS; i++) {
                const el = barRefs.current[i];
                if (!el) continue;
                const val = dataArray[i % dataArray.length] || 0;
                const scale = Math.max(0.2, Math.min(1, val / 220));
                el.style.transform = `scaleY(${scale.toFixed(2)})`;
              }
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } catch {
          // Visualiser optional
        }
      } catch {
        onError?.('افتح إذن الميكروفون عشان تقدر تسجل فويس نوت 🎤');
        onCancel();
      }
    };

    startRecording();

    const secTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);

    return () => {
      mounted = false;
      clearInterval(secTimer);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      cleanupMedia();
    };
  }, []);

  const handleDiscard = () => {
    if (canceledRef.current) return;
    canceledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupMedia();
    onCancel();
  };

  const handleFinishAndSend = () => {
    const rec = recorderRef.current;
    if (sending || canceledRef.current) return;
    const heldMs = Date.now() - startTimeRef.current;
    if (!rec || !ready || heldMs < 350) {
      canceledRef.current = true;
      cleanupMedia();
      onError?.('اضغط مطولاً للتسجيل أو اسحب لفوق للقفل 🎤');
      onCancel();
      return;
    }

    setSending(true);
    const durationSec = Math.max(1, Math.round(heldMs / 1000));

    rec.onstop = async () => {
      cleanupMedia();
      if (canceledRef.current) return;
      const actualMime = rec.mimeType || mimeRef.current || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: actualMime });
      if (blob.size < 250) {
        setSending(false);
        onError?.('التسجيل قصير جداً، جرب تاني.');
        onCancel();
        return;
      }
      try {
        await onSend(blob, durationSec, actualMime);
      } catch {
        onError?.('معرفناش نبعت الفويس نوت، جرب تاني');
        onCancel();
      } finally {
        setSending(false);
      }
    };

    if (rec.state !== 'inactive') {
      rec.stop();
    } else {
      cleanupMedia();
      setSending(false);
      onCancel();
    }
  };

  useEffect(() => {
    if (!actionSignal || handledSignalRef.current === actionSignal) return;
    handledSignalRef.current = actionSignal;
    if (actionSignal === 'cancel') {
      handleDiscard();
    } else if (actionSignal === 'send') {
      handleFinishAndSend();
    }
  }, [actionSignal, ready]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div ref={gestureRef} className="relative flex items-center gap-2.5 py-2 select-none">
      {/* Lightweight Slide-Up-to-Lock Pill (CSS-driven via --lock-p) */}
      {!locked && !sending && (
        <div
          className="absolute bottom-full end-0 mb-3 flex flex-col items-center gap-1 px-2.5 py-2 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-lg pointer-events-none z-30 transition-transform duration-75 will-change-transform"
          style={{
            transform: 'translateY(calc(var(--lock-p, 0) * -20px)) scale(calc(1 + var(--lock-p, 0) * 0.1))',
          }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-800 text-brand-orange">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      )}

      {/* Trash button when locked */}
      {locked && (
        <button
          type="button"
          onClick={handleDiscard}
          disabled={sending}
          className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer transition-transform duration-100"
          aria-label="إلغاء التسجيل"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      )}

      {/* Recording Pill (CSS-driven --cancel-p, zero React re-renders) */}
      <div
        className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-rose-500/35 min-w-0 will-change-transform"
        style={
          locked
            ? undefined
            : {
                transform: 'translateX(calc(var(--cancel-p, 0) * 32px))',
                opacity: 'calc(1 - var(--cancel-p, 0) * 0.55)',
              }
        }
      >
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />

        <span className="text-xs font-black text-white font-mono tabular-nums shrink-0" dir="ltr">
          {formattedTime}
        </span>

        {/* GPU-only scaleY Waveform Bars */}
        <div className="flex-1 flex items-center justify-center gap-[2.5px] h-6 overflow-hidden" dir="ltr">
          {Array.from({ length: NUM_BARS }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              className="w-[2.5px] h-full rounded-full bg-gradient-to-t from-brand-orange to-rose-400 origin-center will-change-transform"
              style={{ transform: 'scaleY(0.22)' }}
            />
          ))}
        </div>

        {!locked && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 shrink-0">
            <span>اسحب يمين للإلغاء</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Send when locked, pulsing Mic while holding */}
      {locked || sending ? (
        <button
          type="button"
          onClick={handleFinishAndSend}
          disabled={sending}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-amber text-black flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform duration-100 disabled:opacity-60"
          aria-label="إرسال الفويس نوت"
        >
          {sending ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Send className="rtl:-scale-x-100 w-4.5 h-4.5 stroke-[2.5] translate-x-0.5" />
          )}
        </button>
      ) : (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-500 to-brand-orange text-white flex items-center justify-center shrink-0 pointer-events-none">
          <Mic className="w-5 h-5 stroke-[2.4]" />
        </div>
      )}
    </div>
  );
};
