import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { MobileHeader } from '../components/MobileHeader';
import { BottomNav } from '../components/BottomNav';
import { CustomModal } from '../components/CustomModal';
import { XPPopup } from '../components/XPPopup';
import { Toast } from '../components/Toast';

interface MainLayoutProps {
  children: React.ReactNode;
  unseenCount: number;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, unseenCount, setCommunityTab }) => {
  const {
    currentPage,
    setCurrentPage,
    user,
    equippedTitle,
    getAvatarFrameClass,
    xpPopups,
    customModal,
    toastMessage,
    // PWA banner states
    showInstallBanner,
    deferredPrompt,
    isStandalone,
    handleInstallPWA,
    dismissInstallBanner,
    // iOS banner
    showIOSInstall,
    dismissIOSInstall,
    // StreakCelebration
    streakOverlay,
    setStreakOverlay,
    getFlameTier,
    triggerXpPopup
  } = useAuth();

  return (
    <div className="app-layout">
      {/* Background Watermark/Reflections */}
      <div className="ambient-glow-bg"></div>

      {/* Floating XP Popups */}
      <XPPopup popups={xpPopups} />

      {/* Desktop Sticky Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setCommunityTab={setCommunityTab}
        unseenCount={unseenCount}
        user={user}
        equippedTitle={equippedTitle}
        getAvatarFrameClass={getAvatarFrameClass}
      />

      {/* Main Column Wrapper */}
      <div className="app-body-wrapper">
        {/* Mobile Header */}
        <MobileHeader
          setCurrentPage={setCurrentPage}
          user={user}
          getAvatarFrameClass={getAvatarFrameClass}
        />

        {/* Main Content Router */}
        <main className="app-main">
          {children}
        </main>

        {/* Mobile sticky bottom navigation */}
        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setCommunityTab={setCommunityTab}
          unseenCount={unseenCount}
          user={user}
        />
      </div>

      {/* Global alert/confirm overlay */}
      <CustomModal modal={customModal} />

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && deferredPrompt && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[400px] z-[9999] rounded-2xl border border-brand-orange/25 bg-zinc-950/95 backdrop-blur-2xl p-5 shadow-[0_8px_40px_rgba(242,101,34,0.15)] flex flex-col gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-orange/[0.03] to-transparent animate-shimmer pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-orange/30 shadow-lg shadow-brand-orange/10 shrink-0 bg-brand-orange">
                <img src="/favicon.svg" alt="Leh Physio" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white leading-tight">Leh Physio</h4>
                  <button 
                    onClick={dismissInstallBanner}
                    className="text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors p-0.5 -mt-1 -mr-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-1">
                  Install Leh Physio? Now!
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 relative z-10">
              <button 
                onClick={handleInstallPWA}
                className="flex-1 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-[0.97] transition-all shadow-orange-glow flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Install App</span>
              </button>
              <button 
                onClick={dismissInstallBanner}
                className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-400 font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.97]"
              >
                Later
              </button>
            </div>
          </motion.div>
        )}

        {showIOSInstall && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[420px] z-[9999] rounded-3xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-6 shadow-[0_12px_45px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-left font-sans"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-orange/30 shadow-lg shadow-brand-orange/10 shrink-0 bg-brand-orange">
                <img src="/favicon.svg" alt="LehPhysio" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white leading-tight">LehPhysio? - ليه فيزيو؟</h4>
                  <button 
                    onClick={dismissIOSInstall}
                    className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors p-0.5 -mt-1 -mr-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 font-bold leading-relaxed mt-1">
                  Install Leh Physio? Now!
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/60 space-y-3.5 text-xs text-zinc-200">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-orange/15 border border-brand-orange/20 text-brand-orange text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                <p className="leading-relaxed">
                  اضغط على زر المشاركة <span className="inline-flex items-center justify-center bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-lg font-black shrink-0 mx-1"><i className="ti ti-share text-xs"></i></span> أسفل شاشة المتصفح Safari.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-orange/15 border border-brand-orange/20 text-brand-orange text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                <p className="leading-relaxed">
                  مرر القائمة لأسفل ثم اختر <strong className="text-white">"إضافة إلى الشاشة الرئيسية"</strong> أو <strong className="text-white">"Add to Home Screen"</strong> <span className="inline-flex items-center justify-center bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-lg font-black shrink-0 mx-1"><i className="ti ti-square-plus text-xs"></i></span>.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={dismissIOSInstall}
                className="flex-1 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-[0.97] transition-all shadow-orange-glow text-center"
              >
                فهمت ذلك
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Celebratory Overlay */}
      <AnimatePresence>
        {streakOverlay.show && (() => {
          const tier = getFlameTier(streakOverlay.days);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl overflow-hidden px-6"
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * window.innerWidth, 
                      y: window.innerHeight + 100, 
                      scale: Math.random() * 0.8 + 0.4, 
                      opacity: Math.random() * 0.6 + 0.2 
                    }}
                    animate={{ 
                      y: -100, 
                      x: `calc(50% + ${Math.sin(i) * 100}px)`,
                      opacity: 0 
                    }}
                    transition={{ 
                      duration: Math.random() * 3 + 2, 
                      repeat: Infinity, 
                      delay: Math.random() * 2 
                    }}
                    className={`absolute w-5 h-5 rounded-full bg-gradient-to-t ${tier.particleColor} blur-[2px]`}
                  />
                ))}
              </div>

              <div className={`w-80 h-80 rounded-full ${tier.ambientGlow} blur-[100px] absolute z-0 pointer-events-none animate-pulse`} />

              <div className="relative z-10 text-center flex flex-col items-center gap-6 max-w-sm">
                <span className={`text-[10px] font-black tracking-widest px-3.5 py-1.5 rounded-full uppercase border shadow-ambient ${
                  streakOverlay.days >= 15 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/25' :
                  streakOverlay.days >= 7 ? 'bg-purple-500/20 text-purple-300 border-purple-500/25' :
                  streakOverlay.days >= 3 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/25' :
                  'bg-brand-orange/20 text-brand-orange border-brand-orange/25'
                }`}>
                  {tier.badge}
                </span>

                <motion.div
                  initial={{ scale: 0.2, y: 180, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                  className={`w-48 h-48 filter ${tier.shadow} flex items-center justify-center relative select-none`}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="outerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={tier.outer[0]} stopOpacity="0.9" />
                        <stop offset="60%" stopColor={tier.outer[1]} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={tier.outer[2]} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="midFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={tier.mid[0]} stopOpacity="0.95" />
                        <stop offset="50%" stopColor={tier.mid[1]} stopOpacity="0.85" />
                        <stop offset="100%" stopColor={tier.mid[2]} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="innerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={tier.inner[0]} stopOpacity="1" />
                        <stop offset="50%" stopColor={tier.inner[1]} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={tier.inner[2]} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <motion.path
                      d="M50,95 C70,95 85,80 82,58 C80,38 65,30 50,2 C35,30 20,38 18,58 C15,80 30,95 50,95 Z"
                      fill="url(#outerFlame)"
                      animate={{
                        scaleY: [1, 1.08, 0.96, 1.05, 1],
                        scaleX: [1, 0.95, 1.05, 0.98, 1],
                        skewX: [0, -3, 3, -2, 0],
                        y: [0, -4, 2, -3, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ transformOrigin: "50px 95px" }}
                    />

                    <motion.path
                      d="M50,90 C65,90 75,78 72,58 C70,40 60,32 50,15 C40,32 30,40 28,58 C25,78 35,90 50,90 Z"
                      fill="url(#midFlame)"
                      animate={{
                        scaleY: [1, 0.93, 1.1, 0.97, 1],
                        scaleX: [1, 1.08, 0.92, 1.03, 1],
                        skewX: [0, 4, -4, 2, 0],
                        y: [0, 3, -5, 2, 0]
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ transformOrigin: "50px 90px" }}
                    />

                    <motion.path
                      d="M50,85 C60,85 68,75 66,58 C64,42 58,35 50,28 C42,35 36,42 34,58 C32,75 40,85 50,85 Z"
                      fill="url(#innerFlame)"
                      animate={{
                        scaleY: [1, 1.12, 0.9, 1.08, 1],
                        scaleX: [1, 0.9, 1.1, 0.95, 1],
                        y: [0, -2, 1, -1, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ transformOrigin: "50px 85px" }}
                    />
                  </svg>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="space-y-1.5"
                >
                  <h1 className={`text-4xl ${tier.textClass} tracking-tighter leading-none select-none`}>
                    {streakOverlay.days} {streakOverlay.days > 10 ? 'يوماً' : 'أيام'} متتالية!
                  </h1>
                  <p className="text-sm font-bold text-zinc-400 select-none uppercase tracking-wide">
                    Your Current Active Streak
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 shadow-lg text-white"
                >
                  <div className="w-5 h-5 rounded-full bg-green-500 text-black flex items-center justify-center font-black text-[10px]">✓</div>
                  <span className="text-xs font-black select-none">
                    كسبت <strong className="text-green-400">+{streakOverlay.xpEarned} XP</strong> بنجاح!
                  </span>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => {
                    setStreakOverlay(prev => ({ ...prev, show: false }));
                    triggerXpPopup(streakOverlay.xpEarned);
                  }}
                  className={`w-full font-black text-sm py-4 rounded-2xl cursor-pointer active:scale-97 transition-all mt-2.5 text-center flex items-center justify-center gap-2 ${
                    streakOverlay.days >= 15 ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-cyan-glow hover:shadow-cyan-intense' :
                    streakOverlay.days >= 7 ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-pink-glow hover:shadow-pink-intense' :
                    streakOverlay.days >= 3 ? 'bg-gradient-to-r from-yellow-600 to-amber-500 text-black shadow-yellow-glow hover:shadow-yellow-intense' :
                    'bg-gradient-to-r from-brand-orange to-brand-amber text-black shadow-orange-glow hover:shadow-orange-intense'
                  }`}
                >
                  <span>Keep Grinding!</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Toast Notification element */}
      <Toast message={toastMessage} />
    </div>
  );
};
