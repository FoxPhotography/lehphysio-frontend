import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const { unreadCount, isOpen, setIsOpen } = useNotifications();
  const prevCount = useRef(unreadCount);
  const [shouldPulse, setShouldPulse] = React.useState(false);

  // Detect when unread count increases → trigger pulse
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 2000);
      prevCount.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = unreadCount;
    return () => {};
  }, [unreadCount]);

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <button
      id="notification-bell"
      onClick={() => setIsOpen(!isOpen)}
      className="relative p-2 rounded-xl transition-all duration-200 cursor-pointer group notification-bell-btn"
      style={{
        background: isOpen ? 'rgba(242, 101, 34, 0.15)' : 'transparent',
      }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <motion.div
        animate={shouldPulse ? {
          rotate: [0, -15, 12, -10, 8, -5, 0],
          scale: [1, 1.15, 1.1, 1.05, 1],
        } : {}}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <Bell
          className="w-5 h-5 transition-colors duration-200"
          style={{
            color: isOpen ? 'var(--orange)' : 'var(--text-secondary)',
          }}
          strokeWidth={2.2}
        />
      </motion.div>

      {/* Unread badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="absolute flex items-center justify-center font-black pointer-events-none"
            style={{
              top: '2px',
              right: '2px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '999px',
              fontSize: '9px',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: '2px solid var(--bg-primary)',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            {displayCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pulse ring on new notification */}
      <AnimatePresence>
        {shouldPulse && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: '2px solid var(--orange)',
            }}
          />
        )}
      </AnimatePresence>
    </button>
  );
};
