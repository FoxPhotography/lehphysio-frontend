import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  Send,
  LogOut,
  Users,
  Copy,
  Link,
  Play,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  XCircle,
  Timer,
  Star,
  Crown,
  RotateCcw,
  Loader2,
  Zap,
  UserMinus,
  Smile,
  Keyboard,
} from 'lucide-react';
import { playChatSound, copyToClipboard } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';
import { EmojiPickerPopover } from '../components/common/EmojiPickerPopover';

// ─── Confetti Particle System ──────────────────────────────────────────────────
const ConfettiEffect: React.FC<{ active: boolean; onComplete: () => void }> = ({
  active,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return () => {};
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles: any[] = [];
    const colors = ['#FF6A00', '#FFB000', '#2ed573', '#ff4757', '#2e90ff', '#eccc68', '#ffa502'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18 - 6,
        radius: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        onComplete();
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
};

interface PlayGameProps {
  activeGameRoom: any;
  user: any;
  handleLeaveGameRoom: () => void;
  handleStartGame: () => void;
  handleSubmitGameAnswer: (e: React.FormEvent) => void;
  submittedGameAnswer: string;
  setSubmittedGameAnswer: (val: string) => void;
  handleNextRound: () => void;
  handlePlayAgain: () => void;
  showToast: (msg: string) => void;
  token: string;
  apiBase: string;
  setActiveGameRoom: (room: any) => void;
}

// ─── Log Color Helper ──────────────────────────────────────────────────────────
const getLogStyle = (type: string): string => {
  switch (type) {
    case 'correct': return 'text-emerald-400';
    case 'wrong':   return 'text-red-400';
    case 'chat':    return 'text-sky-400';
    case 'close':   return 'text-amber-400';
    default:        return 'text-zinc-400';
  }
};

const getLogIcon = (type: string) => {
  switch (type) {
    case 'correct': return <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
    case 'wrong':   return <XCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />;
    case 'chat':    return <MessageSquare className="w-3.5 h-3.5 shrink-0 text-sky-400" />;
    default:        return null;
  }
};

// ─── Question type label ───────────────────────────────────────────────────────
const getTypeLabel = (type: string) => {
  if (type === 'muscle') return 'Muscle';
  if (type === 'bone')   return 'Bone';
  return 'Nerve';
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const PlayGame: React.FC<PlayGameProps> = ({
  activeGameRoom,
  user,
  handleLeaveGameRoom,
  handleStartGame,
  handleSubmitGameAnswer,
  submittedGameAnswer,
  setSubmittedGameAnswer,
  handleNextRound,
  handlePlayAgain,
  showToast,
  token,
  apiBase,
  setActiveGameRoom,
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const prevWinnerRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Local timer ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    let timerId: any;
    if (activeGameRoom?.status === 'playing' && !activeGameRoom?.roundWinner) {
      timerId = setInterval(() => setTick((t) => t + 1), 250);
    }
    return () => { if (timerId) clearInterval(timerId); };
  }, [activeGameRoom?.status, activeGameRoom?.roundWinner]);

  const room = activeGameRoom;
  if (!room) return null;

  const isHost = room.host === user?.username;

  // Timer calculations
  let timeLeft = 0;
  let elapsed = 0;
  if (room.status === 'playing' && room.roundStartTime) {
    elapsed = Math.max(0, (Date.now() - room.roundStartTime) / 1000);
    timeLeft = Math.max(0, Math.ceil(room.roundDuration - elapsed));
  }

  const timerPct = room.roundDuration > 0 ? (timeLeft / room.roundDuration) * 100 : 0;
  const inviteUrl = `${window.location.origin}/game/${room.code}`;

  const handleCopyInviteUrl = async () => {
    try {
      await copyToClipboard(inviteUrl);
      showToast('تم نسخ رابط الدعوة بنجاح! 📋');
      playChatSound('success');
      
      const shareData = {
        title: 'Anatomy Online Challenge 🧠',
        text: `تعال انضم لتحدي التشريح المباشر معي في Leh Physio! كود الغرفة: ${room.code} ⚡`,
        url: inviteUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData).catch(() => {});
      }
    } catch (err) {
      showToast('فشل النسخ تلقائياً.');
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.answersLog]);

  // Confetti and sound triggers
  useEffect(() => {
    if (!room) return;
    const currentWinner = room.roundWinner;
    const prevWinner = prevWinnerRef.current;
    if (currentWinner && currentWinner !== prevWinner && currentWinner !== 'timeout') {
      if (currentWinner === user?.username) {
        setConfettiActive(true);
        playChatSound('success');
      } else {
        playChatSound('receive');
      }
    }
    prevWinnerRef.current = currentWinner;

    const currentStatus = room.status;
    const prevStatus = prevStatusRef.current;
    if (currentStatus === 'finished' && prevStatus === 'playing') {
      if (room.finalWinner === user?.username) {
        setConfettiActive(true);
        playChatSound('win');
      }
    }
    prevStatusRef.current = currentStatus;
  }, [room.status, room.roundWinner, room.finalWinner, user?.username]);

  // Send chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !token) return;
    const msg = chatMessage;
    setChatMessage('');
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
    try {
      const res = await fetch(`${apiBase}/api/games/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomCode: room.code, message: msg }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        playChatSound('send');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickPlayer = async (targetUsername: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/api/games/kick`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ roomCode: room.code, targetUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        showToast(`تم طرد اللاعب @${targetUsername} بنجاح 🚨`);
        playChatSound('error');
      } else {
        showToast(data.error || 'Failed to kick player.');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بالخادم.');
    }
  };

  // ─── Clean Room Chat Box ───────────────────────────────────────────────────────
  const renderChatBox = (maxH = '130px') => (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 backdrop-blur-md p-3 text-left flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Room Chat</span>
        </div>
      </div>

      <div
        className="flex flex-col gap-1.5 overflow-y-auto pr-1 mb-2 scrollbar-thin scrollbar-thumb-white/10"
        style={{ maxHeight: maxH }}
      >
        {(!room.answersLog || room.answersLog.length === 0) ? (
          <div className="text-zinc-600 text-[11px] font-semibold py-2.5 text-center">
            No messages yet. Say hi or guess the structure! 👋
          </div>
        ) : (
          room.answersLog.map((log: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-1.5 text-[12px] leading-relaxed ${getLogStyle(log.type)}`}
            >
              {getLogIcon(log.type)}
              {log.type === 'chat' ? (
                <span>
                  <strong className="text-zinc-200">@{log.text.split(':')[0]}:</strong>
                  {log.text.substring(log.text.indexOf(':'))}
                </span>
              ) : (
                <span>{log.text}</span>
              )}
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendChatMessage} autoComplete="off" data-lpignore="true" data-form-type="other" className="flex gap-2 items-end">
        <div className="flex-1 relative flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-brand-orange/60 rounded-xl px-3 py-1 transition-colors min-h-[44px]">
          <textarea
            ref={chatInputRef}
            dir="auto"
            rows={1}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
            inputMode="text"
            enterKeyHint="send"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            className="w-full bg-transparent text-[14px] text-white placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto leading-relaxed py-1.5 pr-8 min-h-[32px] max-h-[85px] font-medium"
            placeholder={room.status === 'playing' && !room.roundWinner ? "Type your guess or message..." : "Type a message..."}
            value={chatMessage}
            onChange={(e) => {
              setChatMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 85)}px`;
            }}
            onFocus={() => setShowChatEmojiPicker(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
          />
          <div className="absolute right-1.5 bottom-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                if (showChatEmojiPicker) {
                  setShowChatEmojiPicker(false);
                  chatInputRef.current?.focus();
                } else {
                  chatInputRef.current?.blur();
                  setShowChatEmojiPicker(true);
                }
              }}
              className="p-1 text-zinc-400 hover:text-brand-orange cursor-pointer transition-colors"
              title={showChatEmojiPicker ? 'Keyboard' : 'Emoji'}
            >
              {showChatEmojiPicker ? <Keyboard className="w-4 h-4 text-brand-orange" /> : <Smile className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-11 w-11 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-[13px] flex items-center justify-center hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-md mb-0.5"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>

      {/* Inline Drawer below chat input */}
      <EmojiPickerPopover
        isOpen={showChatEmojiPicker}
        onClose={() => setShowChatEmojiPicker(false)}
        onEmojiSelect={(emoji) => {
          if (chatInputRef.current) {
            const input = chatInputRef.current;
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const currentVal = input.value;
            const nextVal = currentVal.substring(0, start) + emoji + currentVal.substring(end);
            input.value = nextVal;
            const newCursor = start + emoji.length;
            input.selectionStart = newCursor;
            input.selectionEnd = newCursor;
            setChatMessage(nextVal);
            input.style.height = 'auto';
            input.style.height = `${Math.min(input.scrollHeight, 85)}px`;
          } else {
            setChatMessage((prev) => prev + emoji);
          }
        }}
        variant="drawer"
        height={260}
      />
    </div>
  );

  // ─── WAITING ROOM / LOBBY (FLAT FULL PAGE) ────────────────────────────────────
  if (room.status === 'waiting') {
    return (
      <div className="w-full min-h-[100dvh] overflow-y-auto pt-20 xl:pt-8 pb-32 px-4 max-w-xl mx-auto text-left space-y-4">
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Waiting for Players</span>
            </div>
            <h2 className="text-xl font-black text-white">Anatomy Online Challenge</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLeaveGameRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 cursor-pointer transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </motion.button>
        </div>

        {/* Room Code Card */}
        <div className="text-center py-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/70">
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mb-1.5">Room Code</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              await copyToClipboard(room.code);
              showToast(`تم نسخ كود الغرفة: ${room.code} 📋`);
              playChatSound('success');
            }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-700/80 hover:border-brand-orange text-white cursor-pointer transition-all shadow-md"
          >
            <span className="text-3xl font-black tracking-[6px] text-brand-orange font-mono">{room.code}</span>
            <Copy className="w-4 h-4 text-zinc-400" />
          </motion.button>
          <p className="text-[11px] text-zinc-500 mt-2 font-medium">Click to copy and share with friends</p>
        </div>

        {/* Invite Link Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/70 min-w-0">
            <Link className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-[11px] text-zinc-400 truncate font-mono">{inviteUrl}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyInviteUrl}
            className="px-4 py-2.5 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-black hover:bg-brand-orange/25 cursor-pointer transition-colors shrink-0"
          >
            Copy
          </motion.button>
        </div>

        {/* Connected Players Section */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-black text-zinc-200">Connected Players ({room.players.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map((p: any) => (
              <motion.div
                key={p.username}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/70"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar 
                    username={p.username} 
                    avatarUrl={p.avatar_url} 
                    equippedFrame={p.equipped_frame} 
                    size={28} 
                  />
                  <span className="text-xs font-extrabold text-white truncate">@{p.username}</span>
                </div>
                {p.username === room.host ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-brand-orange text-black text-[9px] font-black shrink-0">HOST</span>
                ) : (
                  isHost && (
                    <button
                      onClick={() => handleKickPlayer(p.username)}
                      title="Kick Player"
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Room Chat */}
        {renderChatBox('120px')}

        {/* Start Button */}
        <div className="pt-2">
          {isHost ? (
            <motion.button
              whileHover={{ scale: room.players.length < 2 ? 1 : 1.02 }}
              whileTap={{ scale: room.players.length < 2 ? 1 : 0.98 }}
              onClick={() => {
                if (room.players.length < 2) {
                  showToast('You need at least 2 players to start the challenge!');
                  playChatSound('error');
                } else {
                  handleStartGame();
                }
              }}
              disabled={room.players.length < 2}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm md:text-base cursor-pointer transition-all shadow-lg ${
                room.players.length < 2
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-850'
                  : 'bg-gradient-to-r from-brand-orange to-brand-amber text-black shadow-orange-glow hover:shadow-orange-intense'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Challenge</span>
              {room.players.length < 2 && <span className="text-xs font-medium ml-1">(Need 2+ players)</span>}
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
              <span className="text-xs font-bold">Waiting for host to start the challenge...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PLAYING STATE (FLAT FULL PAGE) ───────────────────────────────────────────
  if (room.status === 'playing') {
    const question = room.currentQuestion;
    const myScore = room.players.find((p: any) => p.username === user?.username)?.score || 0;
    const currentHintIdx = Math.min(3, Math.floor(elapsed / (room.roundDuration / 4)));
    const currentHint = question?.hints?.[currentHintIdx] || '';
    const timerColor = timeLeft <= 5 ? 'text-red-400 animate-pulse' : timeLeft <= 10 ? 'text-amber-400' : 'text-white';

    return (
      <div className="w-full max-w-xl mx-auto text-left pt-20 xl:pt-8 pb-8 px-4 flex flex-col space-y-3">
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

        {/* Top Arena Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-wider mb-1">
              Round {room.currentRound} of {room.rounds}
            </div>
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-brand-orange fill-current" />
              <span>Guess the Structure</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Timer */}
            <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 min-w-[54px]">
              <Timer className="w-3.5 h-3.5 text-zinc-500 mb-0.5" />
              <span className={`text-base font-black font-mono leading-none ${timerColor}`}>
                {room.roundWinner ? '—' : `${timeLeft}s`}
              </span>
            </div>
            {/* My Score */}
            <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 min-w-[54px]">
              <Star className="w-3.5 h-3.5 text-brand-amber fill-current mb-0.5" />
              <span className="text-base font-black font-mono text-white leading-none">{myScore}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLeaveGameRoom}
              className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
              title="Leave game"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Timer Progress Bar */}
        {!room.roundWinner && (
          <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
            <motion.div
              className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-brand-orange'}`}
              style={{ width: `${timerPct}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        )}

        {/* Question Card */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 space-y-2">
          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black border border-brand-orange/30 bg-brand-orange/10 text-brand-orange uppercase">
              {getTypeLabel(question?.type)}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-zinc-700/60 bg-zinc-800/60 text-zinc-300">
              Hint {currentHintIdx + 1} / 4
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={room.roundWinner ? 'answer' : currentHintIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm md:text-base font-bold leading-relaxed text-zinc-100"
            >
              {room.roundWinner ? (
                <>
                  <span className="text-zinc-400 font-normal">Answer: </span>
                  <span className="text-emerald-400 font-extrabold text-lg">{question?.structure}</span>
                </>
              ) : currentHint}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Intermission Banner */}
        <AnimatePresence>
          {room.roundWinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-4 text-center space-y-1.5"
            >
              <h4 className="text-sm md:text-base font-black text-brand-amber">
                {room.roundWinner === 'timeout'
                  ? '⏱️ Time is up!'
                  : `🎉 @${room.roundWinner} answered correctly!`}
              </h4>
              <p className="text-xs text-zinc-300">
                Correct answer: <strong className="text-emerald-400 font-extrabold">{question?.structure}</strong>
              </p>
              {isHost && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextRound}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-sm cursor-pointer shadow-md"
                >
                  {room.currentRound < room.rounds ? (
                    <>
                      <span>Next Round</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Final Results</span>
                      <Trophy className="w-4 h-4 fill-current" />
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players Scores Row */}
        <div className="flex flex-wrap gap-2 pt-1">
          {room.players.map((p: any) => (
            <div key={p.username} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <UserAvatar 
                username={p.username} 
                avatarUrl={p.avatar_url} 
                equippedFrame={p.equipped_frame} 
                size={20} 
              />
              <span className="text-xs font-bold text-zinc-300">@{p.username}</span>
              <span className="text-xs font-black text-brand-orange font-mono">{p.score}</span>
            </div>
          ))}
        </div>

        {/* Live Answer Feed & Chat */}
        {renderChatBox('140px')}
      </div>
    );
  }

  // ─── FINISHED STATE (FLAT FULL PAGE) ──────────────────────────────────────────
  if (room.status === 'finished') {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);

    return (
      <div className="w-full min-h-[100dvh] overflow-y-auto pt-20 xl:pt-8 pb-32 px-4 max-w-md mx-auto text-left space-y-4">
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

        {/* Trophy Icon */}
        <div className="text-center pt-2">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-brand-orange/20 border border-amber-500/40 flex items-center justify-center mx-auto shadow-orange-glow mb-3"
          >
            <Trophy className="w-10 h-10 text-brand-amber fill-current" />
          </motion.div>

          <h2 className="text-2xl font-black text-white">Challenge Ended</h2>
          <p className="text-xs text-zinc-400 mt-1">
            <span className="text-brand-amber font-black">@{room.finalWinner || 'Nobody'}</span> was crowned champion! 👑
          </p>
        </div>

        {/* Final Leaderboard */}
        <div className="space-y-2 text-left">
          {sorted.map((p: any, idx: number) => (
            <motion.div
              key={p.username}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.07 }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${
                idx === 0
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-zinc-900/60 border-zinc-800/60'
              }`}
            >
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                idx === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-xs' :
                idx === 1 ? 'bg-zinc-400 text-black' :
                idx === 2 ? 'bg-amber-800 text-white' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {idx === 0 ? <Crown className="w-3.5 h-3.5 fill-current" /> : idx + 1}
              </span>
              <UserAvatar 
                username={p.username} 
                avatarUrl={p.avatar_url} 
                equippedFrame={p.equipped_frame} 
                size={28} 
              />
              <span className="flex-1 text-xs font-black text-white">@{p.username}</span>
              <span className="text-xs font-black text-brand-orange font-mono">{p.score} pts</span>
            </motion.div>
          ))}
        </div>

        {/* Chat in Finished screen */}
        {renderChatBox('100px')}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-2">
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlayAgain}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs md:text-sm hover:bg-emerald-500/25 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again (Same Room)</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeaveGameRoom}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/20 text-red-400 font-black text-xs md:text-sm hover:bg-red-500/10 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
};
