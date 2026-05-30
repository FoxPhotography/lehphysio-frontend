import React, { useState, useEffect, useRef } from 'react';
import { playChatSound } from '../utils/helpers';

// High-performance canvas-based Confetti Particle System
const ConfettiEffect: React.FC<{ active: boolean; onComplete: () => void }> = ({ active, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Spawn 120 particles from the center/sides
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 6,
        radius: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008
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
        p.vy += 0.22; // gravity
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
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
  setActiveGameRoom
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [confettiActive, setConfettiActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const prevWinnerRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

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
  
  const inviteUrl = `${window.location.origin}${window.location.pathname}?gameCode=${room.code}`;
  
  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    showToast('Invite link copied! Share it with your colleagues to join immediately 🔗');
    playChatSound('success');
  };

  // Auto-scroll chat log
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [room.answersLog]);

  // Track state changes to trigger confetti and sounds
  useEffect(() => {
    if (!room) return;
    
    // Round Winner Audio/Visual Trigger
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

    // Final Game End Winner Audio/Visual Trigger
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

  // Send a lobby/game chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !token) return;
    const msg = chatMessage;
    setChatMessage('');
    try {
      const res = await fetch(`${apiBase}/api/games/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: room.code, message: msg })
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

  // Get color for log entries
  const getLogColor = (type: string) => {
    switch (type) {
      case 'correct': return '#2ed573'; // Vibrant green
      case 'wrong': return '#ff4757'; // Vibrant red
      case 'chat': return '#3498db'; // Soft blue
      case 'close': return '#ffa502'; // Warning orange
      default: return 'var(--text-secondary)'; // Neutral grey
    }
  };

  // Render chat component
  const renderChatBox = (height = '180px') => {
    return (
      <div className="glass-card" style={{ background: '#070707', border: '1px solid var(--card-border)', padding: '12px', marginTop: '1rem' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Room Chat & Log 💬</span>
        </h4>
        <div style={{ maxHeight: height, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px', marginBottom: '8px' }}>
          {room.answersLog && room.answersLog.map((log: any, idx: number) => (
            <div key={idx} style={{ fontSize: '13px', color: getLogColor(log.type), wordBreak: 'break-word', lineHeight: 1.4 }}>
              {log.type === 'chat' ? (
                <>
                  <strong style={{ color: '#fff' }}>{log.text.split(':')[0]}:</strong>
                  <span>{log.text.substring(log.text.indexOf(':'))}</span>
                </>
              ) : (
                log.text
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="pl-input"
            style={{ padding: '8px 12px', fontSize: '13px', height: '36px', borderRadius: '8px' }}
            placeholder="Type a message to the room..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <button type="submit" className="btn-primary mini" style={{ padding: '0 14px', height: '36px', borderRadius: '8px' }}>Send</button>
        </form>
      </div>
    );
  };

  if (room.status === 'waiting') {
    return (
      <div className="games-panel animate-fade-in" style={{ padding: '1rem', maxWidth: '600px', margin: '1rem auto' }}>
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="badge-tag">Waiting for players ⏳</span>
              <h2 style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>Anatomy Online Challenge</h2>
            </div>
            <button className="btn-outline mini" style={{ color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)', padding: '6px 12px' }} onClick={handleLeaveGameRoom}>
              Leave Room
            </button>
          </div>

          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <div
              className="pl-invite-code-clickable"
              onClick={() => {
                navigator.clipboard.writeText(room.code);
                showToast(`Room code copied: ${room.code} 📋`);
                playChatSound('success');
              }}
              title="Click to copy code"
              style={{ fontSize: '32px', letterSpacing: '4px', padding: '10px 20px' }}
            >
              {room.code}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Click on code to copy and share</p>
          </div>

          <div className="small-invite-row" style={{ marginBottom: '1.5rem' }}>
            <input type="text" readOnly value={inviteUrl} className="small-invite-input" style={{ fontSize: '12px' }} />
            <button className="btn-primary mini-compact" onClick={handleCopyInviteUrl}>Copy Link</button>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '0.75rem' }}>Connected Players ({room.players.length})</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {room.players.map((p: any) => (
                <div key={p.username} className="glass-card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0A0A0A', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{p.username}</span>
                  {p.username === room.host && <span className="badge-tag" style={{ fontSize: '8px', padding: '1px 4px', background: 'var(--orange)', color: '#000' }}>Host</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Lobby chat */}
          {renderChatBox('150px')}

          <div style={{ marginTop: '1.5rem' }}>
            {isHost ? (
              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  opacity: room.players.length < 2 ? 0.5 : 1,
                  cursor: room.players.length < 2 ? 'not-allowed' : 'pointer'
                }}
                onClick={() => {
                  if (room.players.length < 2) {
                    showToast('⚠️ You need at least 2 players in the room to start the game!');
                    playChatSound('error');
                  } else {
                    handleStartGame();
                  }
                }}
              >
                Start Challenge Now! 🚀
              </button>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <div className="skeleton-loader" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '13px' }}>Waiting for host to start the game...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (room.status === 'playing') {
    const question = room.currentQuestion;
    const myScore = room.players.find((p: any) => p.username === user?.username)?.score || 0;
    const currentHintIdx = Math.min(3, Math.floor(elapsed / (room.roundDuration / 4)));
    const currentHint = question.hints[currentHintIdx];

    return (
      <div className="games-panel animate-fade-in" style={{ padding: '0.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          {/* Arena Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'nowrap', gap: '8px' }}>
            <div>
              <span className="badge-tag" style={{ fontSize: '10px' }}>Round {room.currentRound} of {room.rounds}</span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--orange)', marginTop: '2px' }}>Guess the Structure 🤔</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'center', background: 'rgba(255, 106, 0, 0.1)', border: '1px solid var(--orange)', borderRadius: '10px', padding: '4px 10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--amber)', fontFamily: 'monospace' }}>{room.roundWinner ? 'WAIT' : timeLeft}s</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block' }}>My Score</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{myScore}</span>
              </div>
            </div>
          </div>

          {/* Simple Question Card */}
          <div className="glass-card" style={{ background: '#050505', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem' }}>
              <span className="badge-tag" style={{ fontSize: '9px' }}>Type: {question.type === 'muscle' ? 'Muscle 💪' : question.type === 'bone' ? 'Bone 🦴' : 'Nerve ⚡'}</span>
              <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '9px' }}>Hint {currentHintIdx + 1} of 4</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.5, color: '#fff', margin: 0 }}>
              {room.roundWinner ? `Answer revealed: ${question.structure}` : currentHint}
            </p>
          </div>

          {/* Answer Form */}
          {!room.roundWinner && (
            <form onSubmit={handleSubmitGameAnswer} style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
              <input
                type="text"
                className="pl-input"
                style={{ fontSize: '14px', padding: '10px' }}
                placeholder="Type structure name in English..."
                value={submittedGameAnswer}
                onChange={(e) => setSubmittedGameAnswer(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 18px', fontSize: '14px' }}>Submit</button>
            </form>
          )}

          {/* Intermission Row */}
          {room.roundWinner && (
            <div className="glass-card" style={{ background: 'rgba(255, 106, 0, 0.04)', borderColor: 'var(--orange)', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--amber)', fontWeight: 800, fontSize: '14px', margin: 0 }}>
                {room.roundWinner === 'timeout' ? '⏰ Round time ended!' : `🎉 ${room.roundWinner} answered correctly!`}
              </h4>
              <p style={{ margin: '0.25rem 0 0', fontSize: '12px' }}>Correct structure: <strong style={{ color: '#fff' }}>{question.structure}</strong></p>
              {isHost && (
                <button className="btn-primary mini" onClick={handleNextRound} style={{ marginTop: '0.75rem', width: '100%' }}>
                  {room.currentRound < room.rounds ? 'Next Round ➡️' : 'Show Final Results 🏆'}
                </button>
              )}
            </div>
          )}

          {/* Arena chat */}
          {renderChatBox('120px')}
        </div>
      </div>
    );
  }

  if (room.status === 'finished') {
    const sorted = [...room.players].sort((a,b) => b.score - a.score);
    return (
      <div className="games-panel animate-fade-in" style={{ padding: '1rem', maxWidth: '500px', margin: '2rem auto' }}>
        <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <span style={{ fontSize: '48px' }}>🏆</span>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--orange)', marginTop: '0.5rem' }}>Challenge Ended!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0.25rem 0 1.5rem' }}>
            <strong style={{ color: 'var(--amber)' }}>{room.finalWinner || 'Nobody'}</strong> was crowned champion of the room.
          </p>

          <div className="leaderboard-list-container" style={{ margin: '0 auto 1.5rem', width: '100%' }}>
            {sorted.map((p: any, idx: number) => (
              <div key={p.username} className="leaderboard-row-item" style={{ background: '#050505', padding: '8px 12px', borderRadius: '8px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="row-rank-num" style={{ fontSize: '13px', background: idx === 0 ? 'var(--orange)' : 'rgba(255,255,255,0.05)', color: idx === 0 ? '#000' : '#fff' }}>{idx + 1}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{p.username}</span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--orange)', fontWeight: 800 }}>{p.score} pts</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column' }}>
            {isHost && (
              <button className="btn-primary" onClick={handlePlayAgain} style={{ backgroundColor: '#2ed573', color: '#000', padding: '10px' }}>
                Play Again (Same Room) 🔄
              </button>
            )}
            <button className="btn-outline" onClick={handleLeaveGameRoom} style={{ color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)', padding: '10px' }}>
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
