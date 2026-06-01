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
} from 'lucide-react';
import { playChatSound } from '../utils/helpers';

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
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
};

// ─── Types ─────────────────────────────────────────────────────────────────────
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
    case 'correct': return <CheckCircle className="w-3 h-3 flex-shrink-0 text-emerald-400" />;
    case 'wrong':   return <XCircle className="w-3 h-3 flex-shrink-0 text-red-400" />;
    case 'chat':    return <MessageSquare className="w-3 h-3 flex-shrink-0 text-sky-400" />;
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
  const [confettiActive, setConfettiActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const prevWinnerRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Local timer ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    let timerId: any;
    if (activeGameRoom?.status === 'playing' && !activeGameRoom?.roundWinner) {
      timerId = setInterval(() => setTick(t => t + 1), 250);
    }
    return () => { if (timerId) clearInterval(timerId); };
  }, [activeGameRoom?.status, activeGameRoom?.roundWinner]);

  if (!activeGameRoom) return null;
  const room = activeGameRoom;
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

  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    showToast('Invite link copied! Share it with your colleagues.');
    playChatSound('success');
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

  // ─── Chat Box ─────────────────────────────────────────────────────────────────
  const renderChatBox = (maxH = '160px') => (
    <div className="mt-4 rounded-xl border border-white/8 bg-black/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Room Chat</span>
      </div>
      <div
        className="flex flex-col gap-1.5 overflow-y-auto pr-1 mb-2 scrollbar-thin scrollbar-thumb-white/10"
        style={{ maxHeight: maxH }}
      >
        {room.answersLog?.map((log: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-1.5 text-[12px] leading-relaxed ${getLogStyle(log.type)}`}
          >
            {getLogIcon(log.type)}
            {log.type === 'chat' ? (
              <span>
                <strong className="text-white">{log.text.split(':')[0]}:</strong>
                {log.text.substring(log.text.indexOf(':'))}
              </span>
            ) : (
              <span>{log.text}</span>
            )}
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendChatMessage} className="flex gap-2">
        <input
          type="text"
          className="flex-1 min-w-0 px-3 py-2 text-[13px] rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-colors"
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-2 rounded-lg bg-orange-500 text-black font-bold text-[13px] flex items-center gap-1.5 hover:bg-orange-400 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </motion.button>
      </form>
    </div>
  );

  // ─── WAITING ROOM ─────────────────────────────────────────────────────────────
  if (room.status === 'waiting') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto px-4 pt-20 md:pt-6 pb-6"
      >
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

        <div className="rounded-2xl border border-white/8 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for Players
              </div>
              <h2 className="text-xl font-black text-white">Anatomy Online Challenge</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLeaveGameRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-[12px] font-bold hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </motion.button>
          </div>

          {/* Room Code */}
          <div className="text-center my-6">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Room Code</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                navigator.clipboard.writeText(room.code);
                showToast(`Room code copied: ${room.code}`);
                playChatSound('success');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
            >
              <span className="text-3xl font-black tracking-[6px] text-white font-mono">{room.code}</span>
              <Copy className="w-4 h-4 text-zinc-500" />
            </motion.button>
            <p className="text-[11px] text-zinc-600 mt-2">Click to copy and share with friends</p>
          </div>

          {/* Invite Link */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 min-w-0">
              <Link className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
              <span className="text-[11px] text-zinc-500 truncate font-mono">{inviteUrl}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyInviteUrl}
              className="px-3 py-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[12px] font-bold hover:bg-orange-500/25 transition-colors flex-shrink-0"
            >
              Copy
            </motion.button>
          </div>

          {/* Players */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="text-[13px] font-bold text-white">Connected Players ({room.players.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.players.map((p: any) => (
                <motion.div
                  key={p.username}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-[10px] font-black text-orange-400">{p.username[0].toUpperCase()}</span>
                  </div>
                  <span className="text-[12px] font-bold text-white">{p.username}</span>
                  {p.username === room.host && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500 text-black text-[9px] font-black">HOST</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Lobby Chat */}
          {renderChatBox('120px')}

          {/* Start Button */}
          <div className="mt-5">
            {isHost ? (
              <motion.button
                whileHover={{ scale: room.players.length < 2 ? 1 : 1.02 }}
                whileTap={{ scale: room.players.length < 2 ? 1 : 0.98 }}
                onClick={() => {
                  if (room.players.length < 2) {
                    showToast('You need at least 2 players to start the game!');
                    playChatSound('error');
                  } else {
                    handleStartGame();
                  }
                }}
                disabled={room.players.length < 2}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[15px] transition-all ${
                  room.players.length < 2
                    ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/8'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20'
                }`}
              >
                <Play className="w-4.5 h-4.5" />
                Start Challenge
                {room.players.length < 2 && <span className="text-[12px] font-normal ml-1">(Need 2+ players)</span>}
              </motion.button>
            ) : (
              <div className="flex items-center justify-center gap-2.5 py-4 text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Waiting for host to start...</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── PLAYING STATE ────────────────────────────────────────────────────────────
  if (room.status === 'playing') {
    const question = room.currentQuestion;
    const myScore = room.players.find((p: any) => p.username === user?.username)?.score || 0;
    const currentHintIdx = Math.min(3, Math.floor(elapsed / (room.roundDuration / 4)));
    const currentHint = question.hints[currentHintIdx];
    const timerColor = timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-white';

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto px-3 pt-20 md:pt-4 pb-4"
      >
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

        <div className="rounded-2xl border border-white/8 bg-zinc-900/80 backdrop-blur-xl p-4 shadow-2xl">
          {/* Arena Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/8 gap-2 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Round {room.currentRound} of {room.rounds}
              </div>
              <h3 className="text-[14px] font-black text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-400" />
                Guess the Structure
              </h3>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Timer */}
              <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Timer className="w-3.5 h-3.5 text-zinc-500 mb-0.5" />
                <span className={`text-[16px] font-black font-mono leading-none ${timerColor}`}>
                  {room.roundWinner ? '—' : `${timeLeft}s`}
                </span>
              </div>
              {/* Score */}
              <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Star className="w-3.5 h-3.5 text-zinc-500 mb-0.5" />
                <span className="text-[16px] font-black font-mono text-white leading-none">{myScore}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeaveGameRoom}
                className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label="Leave game"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Timer Progress Bar */}
          {!room.roundWinner && (
            <div className="h-1 rounded-full bg-white/8 mb-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-orange-500'}`}
                style={{ width: `${timerPct}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
          )}

          {/* Question Card */}
          <div className="rounded-xl bg-black/40 border border-white/8 p-4 mb-4">
            <div className="flex gap-2 mb-2.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/30 bg-orange-500/10 text-orange-400">
                {getTypeLabel(question.type)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 text-zinc-400">
                Hint {currentHintIdx + 1} / 4
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={room.roundWinner ? 'answer' : currentHintIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[14px] font-bold leading-relaxed text-white"
              >
                {room.roundWinner ? (
                  <>
                    <span className="text-zinc-400 font-normal">Answer: </span>
                    <span className="text-emerald-400">{question.structure}</span>
                  </>
                ) : currentHint}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Answer Form */}
          <AnimatePresence>
            {!room.roundWinner && (
              <motion.form
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitGameAnswer}
                className="flex gap-2 mb-4"
              >
                <input
                  type="text"
                  autoFocus
                  className="flex-1 min-w-0 px-3 py-2.5 text-[14px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                  placeholder="Type structure name in English..."
                  value={submittedGameAnswer}
                  onChange={(e) => setSubmittedGameAnswer(e.target.value)}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-[13px] hover:bg-orange-400 transition-colors flex-shrink-0"
                >
                  Submit
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Intermission Banner */}
          <AnimatePresence>
            {room.roundWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 mb-4 text-center"
              >
                <h4 className="text-[14px] font-black text-amber-400 mb-1">
                  {room.roundWinner === 'timeout'
                    ? 'Time is up!'
                    : `${room.roundWinner} answered correctly!`}
                </h4>
                <p className="text-[12px] text-zinc-400">
                  Correct answer: <strong className="text-white">{question.structure}</strong>
                </p>
                {isHost && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextRound}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-[13px]"
                  >
                    {room.currentRound < room.rounds ? (
                      <>Next Round <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>Final Results <Trophy className="w-4 h-4" /></>
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Players Scores Row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {room.players.map((p: any) => (
              <div key={p.username} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8">
                <span className="text-[11px] font-bold text-zinc-300">{p.username}</span>
                <span className="text-[11px] font-black text-orange-400">{p.score}</span>
              </div>
            ))}
          </div>

          {/* Arena Chat */}
          {renderChatBox('100px')}
        </div>
      </motion.div>
    );
  }

  // ─── FINISHED STATE ───────────────────────────────────────────────────────────
  if (room.status === 'finished') {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto px-4 pt-20 md:pt-8 pb-8"
      >
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

        <div className="rounded-2xl border border-white/8 bg-zinc-900/80 backdrop-blur-xl p-6 text-center shadow-2xl">
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4"
          >
            <Trophy className="w-10 h-10 text-amber-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-1"
          >
            Challenge Ended
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] text-zinc-400 mb-6"
          >
            <span className="text-amber-400 font-bold">{room.finalWinner || 'Nobody'}</span> was crowned champion!
          </motion.p>

          {/* Final Leaderboard */}
          <div className="space-y-2 mb-6 text-left">
            {sorted.map((p: any, idx: number) => (
              <motion.div
                key={p.username}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.07 }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${
                  idx === 0
                    ? 'bg-amber-500/8 border-amber-500/25'
                    : 'bg-white/3 border-white/8'
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black flex-shrink-0 ${
                  idx === 0 ? 'bg-amber-500 text-black' :
                  idx === 1 ? 'bg-zinc-400 text-black' :
                  idx === 2 ? 'bg-amber-700 text-white' :
                  'bg-white/8 text-zinc-400'
                }`}>
                  {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <span className="flex-1 text-[13px] font-bold text-white">{p.username}</span>
                <span className="text-[13px] font-black text-orange-400">{p.score} pts</span>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {isHost && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlayAgain}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[14px] hover:bg-emerald-500/25 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again (Same Room)
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLeaveGameRoom}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-400 font-bold text-[14px] hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
