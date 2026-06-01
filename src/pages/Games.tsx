import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  ArrowLeft, 
  Trophy, 
  Users, 
  Zap, 
  Hourglass, 
  Check, 
  RefreshCw,
  Gift,
  HelpCircle,
  AlertCircle,
  Play
} from 'lucide-react';

interface GamesProps {
  user: any;
  gameTab: 'single' | 'multiplayer';
  setGameTab: (tab: 'single' | 'multiplayer') => void;
  activeGame: 'memory' | 'spin' | null;
  setActiveGame: (game: 'memory' | 'spin' | null) => void;
  gameFinished: boolean;
  setGameFinished: (val: boolean) => void;
  memoryMoves: number;
  memoryMatches: number;
  gamePlaySuccess: string;
  gamePlayError: string;
  initMemoryGame: () => void;
  memoryCards: any[];
  handleCardClick: (index: number) => void;
  wheelRotation: number;
  handleSpinWheelClick: () => void;
  isSpinning: boolean;
  gameError: string;
  createGameRounds: number;
  setCreateGameRounds: (val: number) => void;
  createGameDuration: number;
  setCreateGameDuration: (val: number) => void;
  handleCreateGameRoom: () => void;
  gameRoomCodeInput: string;
  setGameRoomCodeInput: (val: string) => void;
  handleJoinGameRoom: (code: string) => void;
  isGameLoading: boolean;
  hasSpunToday: boolean;
  xpSettings?: any;
}

export const Games: React.FC<GamesProps> = ({
  user,
  gameTab,
  setGameTab,
  activeGame,
  setActiveGame,
  gameFinished,
  setGameFinished,
  memoryMoves,
  memoryMatches,
  gamePlaySuccess,
  gamePlayError,
  initMemoryGame,
  memoryCards,
  handleCardClick,
  wheelRotation,
  handleSpinWheelClick,
  isSpinning,
  gameError,
  createGameRounds,
  setCreateGameRounds,
  createGameDuration,
  setCreateGameDuration,
  handleCreateGameRoom,
  gameRoomCodeInput,
  setGameRoomCodeInput,
  handleJoinGameRoom,
  isGameLoading,
  hasSpunToday,
  xpSettings = {}
}) => {
  const [showMultiplayerSetup, setShowMultiplayerSetup] = useState(false);

  useEffect(() => {
    setShowMultiplayerSetup(false);
  }, [gameTab]);

  return (
    <div className="space-y-6 py-6 max-w-4xl mx-auto px-4 pb-20 text-left">
      {/* Page Header */}
      <div className="flex items-center gap-2.5">
        <Gamepad2 className="w-6 h-6 text-brand-orange" />
        <h2 className="text-xl md:text-2xl font-black text-white">Interactive Games</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl max-w-sm">
        <button 
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 ${
            gameTab === 'single' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'
          }`} 
          onClick={() => setGameTab('single')}
        >
          Single-player
        </button>
        <button 
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 ${
            gameTab === 'multiplayer' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'
          }`} 
          onClick={() => setGameTab('multiplayer')}
        >
          Multiplayer
        </button>
      </div>

      {gameTab === 'single' ? (
        <div>
          {activeGame ? (
            /* Play Single Player Area */
            <div className="glass-card p-6 md:p-8 space-y-6">
              <button 
                className="flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
                onClick={() => { setActiveGame(null); setGameFinished(false); }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Games</span>
              </button>

              {activeGame === 'memory' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-brand-orange" />
                      <span>Anatomy Match Game</span>
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold">Match identical terms in the fewest moves possible. Moves: {memoryMoves} | Matches: {memoryMatches}/8</p>
                  </div>
                  
                  {gameFinished ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl gap-4"
                    >
                      <Trophy className="w-14 h-14 text-brand-amber fill-brand-amber/10 filter drop-shadow-[0_0_15px_rgba(255,176,0,0.4)]" />
                      <h2 className="text-brand-orange font-black text-lg">Congratulations! Challenge won!</h2>
                      {gamePlaySuccess ? (
                        <div className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center gap-1.5">{gamePlaySuccess}</div>
                      ) : (
                        <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-1.5">{gamePlayError}</div>
                      )}
                      <button 
                        className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-3 px-6 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow mt-2" 
                        onClick={initMemoryGame}
                      >
                        Play Again
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto aspect-square">
                        {memoryCards.map((card, idx) => (
                          <div
                            key={card.id}
                            className={`relative border border-zinc-800 rounded-xl cursor-pointer overflow-hidden aspect-square select-none group [perspective:1000px]`}
                            onClick={() => handleCardClick(idx)}
                          >
                            <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${
                              card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''
                            }`}>
                              {/* Card Back */}
                              <div className="absolute inset-0 bg-zinc-900/80 hover:bg-zinc-800/80 flex items-center justify-center text-brand-orange rounded-xl [backface-visibility:hidden]">
                                <Gamepad2 className="w-5 h-5 opacity-60" />
                              </div>
                              {/* Card Front */}
                              <div className="absolute inset-0 bg-zinc-800 border-2 border-brand-orange/40 text-white rounded-xl flex items-center justify-center text-[10px] md:text-xs font-black [transform:rotateY(180deg)] [backface-visibility:hidden] px-1.5 break-all">
                                {card.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        className="w-full max-w-md mx-auto block border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-3 rounded-xl cursor-pointer active:scale-95 transition-all" 
                        onClick={initMemoryGame}
                      >
                        Reset Game
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeGame === 'spin' && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 text-brand-orange" />
                      <span>Daily Wheel of Fortune</span>
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold">Press the spin button for a chance to win random XP points daily!</p>
                  </div>
                  
                  <div className="relative flex flex-col items-center">
                    {/* pointer */}
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-brand-orange drop-shadow-[0_4px_10px_rgba(255,106,0,0.5)] z-20 absolute -top-1" />
                    
                    <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-zinc-900 bg-zinc-950 shadow-2xl relative overflow-hidden flex items-center justify-center">
                      <svg 
                        className="w-full h-full transition-transform duration-[5000ms] ease-out select-none" 
                        viewBox="0 0 100 100" 
                        style={{ transform: `rotate(${wheelRotation}deg)` }}
                      >
                        {/* segments */}
                        {Array.from({ length: 12 }).map((_, i) => {
                          const angle = 255 + i * 30; 
                          const x1 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
                          const y1 = 50 + 50 * Math.sin((angle * Math.PI) / 180);
                          const x2 = 50 + 50 * Math.cos(((angle + 30) * Math.PI) / 180);
                          const y2 = 50 + 50 * Math.sin(((angle + 30) * Math.PI) / 180);
                          
                          let fillColor = 'rgba(255, 106, 0, 0.1)';
                          if (i === 0) fillColor = 'rgba(255, 215, 0, 0.35)'; // Mystery Gold
                          else if (i === 7) fillColor = 'rgba(255, 106, 0, 0.35)'; // High XP orange
                          else if (i % 3 === 0) fillColor = 'rgba(255, 176, 0, 0.2)';
                          else if (i % 3 === 1) fillColor = 'rgba(255, 255, 255, 0.04)';
                          
                          return (
                            <path
                              key={i}
                              d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                              fill={fillColor}
                              stroke="rgba(255, 106, 0, 0.2)"
                              strokeWidth="0.5"
                            />
                          );
                        })}
                        
                        {/* Text segment labels */}
                        {['MYSTERY', '5 XP', '30 XP', '100 XP', 'FREE SPIN', '15 XP', '5 XP', '50 XP', 'FREE SPIN', '20 XP', '10 XP', '5 XP'].map((lbl, idx) => {
                          const rot = idx * 30; 
                          const isSpecial = lbl === 'MYSTERY' || lbl === 'FREE SPIN';
                          return (
                            <text
                              key={idx}
                              x="50"
                              y="15" 
                              transform={`rotate(${rot} 50 50)`}
                              fill={lbl === 'MYSTERY' ? '#FFD700' : isSpecial ? '#9b9b9f' : '#fff'}
                              className="text-[4.5px] font-black tracking-wide"
                              textAnchor="middle"
                            >
                              {lbl}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <button 
                    className="w-full max-w-xs bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-sm py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow disabled:opacity-60 disabled:cursor-not-allowed" 
                    onClick={handleSpinWheelClick} 
                    disabled={isSpinning || hasSpunToday}
                  >
                    {isSpinning ? 'Spinning...' : hasSpunToday ? 'Already Spun Today' : 'Spin Now!'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Games Menu lists */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="glass-card p-5 text-left flex flex-col justify-between h-64 hover:border-brand-orange/30 group">
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase border border-brand-orange/10 self-start inline-block">
                    Memory Game
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-brand-orange transition-colors">Anatomy Match</h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">Strengthen your anatomical memory and match muscles with medical terms in fewer moves.</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60">
                  <span className="text-[11px] font-extrabold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                    +{xpSettings.game_play || 50} XP
                  </span>
                  <button 
                    className="bg-zinc-900 border border-zinc-800 text-white font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 active:scale-95 transition-all flex items-center gap-1"
                    onClick={() => { setActiveGame('memory'); initMemoryGame(); }}
                  >
                    <Play className="w-3 h-3 fill-current" /> Play
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div 
                className="glass-card p-5 text-left flex flex-col justify-between h-64 hover:border-brand-orange/30 group transition-opacity" 
                style={{ opacity: hasSpunToday ? 0.7 : 1 }}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase border border-brand-orange/10 self-start inline-block">
                    Wheel of Fortune
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-brand-orange transition-colors">Daily Spinner</h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">Spin the golden wheel for a chance to win random free points up to 100 XP.</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60">
                  <span className="text-[11px] font-extrabold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                    {hasSpunToday ? 'Spun Today' : 'Random Prizes'}
                  </span>
                  <button 
                    className="bg-zinc-900 border border-zinc-800 text-white font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 active:scale-95 transition-all flex items-center gap-1"
                    onClick={() => { setActiveGame('spin'); }}
                  >
                    <Play className="w-3 h-3 fill-current" /> Open
                  </button>
                </div>
              </div>

              {/* Card 3 (Coming soon) */}
              <div className="glass-card p-5 text-left flex flex-col justify-between h-64 opacity-50">
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-wider bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md uppercase self-start inline-block">
                    Interactive Quiz
                  </span>
                  <h3 className="text-base font-black text-white">Case Diagnosis</h3>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">Test your clinical diagnosis in orthopedics and neurology with questions of graded difficulty.</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60">
                  <span className="text-[11px] font-extrabold text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Hourglass className="w-3 h-3" /> Coming Soon
                  </span>
                  <button className="border border-zinc-850 text-zinc-600 font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-not-allowed" disabled>Locked</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Multiplayer Lobby Area */
        <div>
          {!showMultiplayerSetup ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-5 text-left flex flex-col justify-between h-64 hover:border-brand-orange/30 group">
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase border border-brand-orange/10 self-start inline-block">
                    Multiplayer Lobby
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-brand-orange transition-colors">Anatomy Challenge Online</h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">Create a challenge room and compete with your colleagues to reveal muscle groups and anatomical structures in real-time!</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60">
                  <span className="text-[11px] font-extrabold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Room Battles
                  </span>
                  <button 
                    className="bg-zinc-900 border border-zinc-800 text-white font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 active:scale-95 transition-all flex items-center gap-1"
                    onClick={() => setShowMultiplayerSetup(true)}
                  >
                    <Play className="w-3 h-3 fill-current" /> Setup Room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 md:p-8 space-y-6">
              <button 
                className="flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
                onClick={() => setShowMultiplayerSetup(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Games</span>
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-orange" />
                  <span>Anatomy Challenge Online</span>
                </h3>
                <p className="text-xs text-zinc-500 font-semibold">Create a challenge room and compete with your colleagues to reveal muscle groups and anatomical structures in real-time!</p>
              </div>

              {gameError && (
                <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gameError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Host setup */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 text-left flex flex-col justify-between gap-4">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider">Host Setup (Create Room)</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>Number of Rounds</span>
                        <span className="text-brand-orange">{createGameRounds}</span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                        min="3"
                        max="10"
                        value={createGameRounds}
                        onChange={(e) => setCreateGameRounds(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>Round Duration</span>
                        <span className="text-brand-orange">{createGameDuration} seconds</span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                        min="15"
                        max="120"
                        value={createGameDuration}
                        onChange={(e) => setCreateGameDuration(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <button 
                    className="w-full bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow mt-4" 
                    onClick={handleCreateGameRoom} 
                    disabled={isGameLoading}
                  >
                    {isGameLoading ? 'Creating room...' : 'Create Challenge Room'}
                  </button>
                </div>

                {/* Join code setup */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 text-left flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider">Join Game (Enter Room)</h4>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-1">Enter the 4-digit code from your colleague's invite to join immediately.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl py-3 text-center text-xl font-black tracking-widest uppercase outline-none transition-all duration-200"
                      placeholder="e.g. ABCD"
                      value={gameRoomCodeInput}
                      onChange={(e) => setGameRoomCodeInput(e.target.value)}
                      maxLength={4}
                    />
                    <button 
                      className="w-full border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-3 rounded-xl cursor-pointer active:scale-95 transition-all" 
                      onClick={() => handleJoinGameRoom(gameRoomCodeInput)} 
                      disabled={isGameLoading}
                    >
                      Join Room Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
