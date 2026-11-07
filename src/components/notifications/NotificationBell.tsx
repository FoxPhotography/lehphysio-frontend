import React, { useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
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

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <button
      id="notification-bell"
      onClick={() => setIsOpen(!isOpen)}
      className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer group notification-bell-btn active:scale-95"
      style={{
        background: isOpen ? 'rgba(242, 101, 34, 0.15)' : 'transparent',
      }}
      aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} جديد)` : ''}`}
    >
      <m.div
        animate={shouldPulse ? {
          rotate: [0, -15, 12, -10, 8, -5, 0],
          scale: [1, 1.15, 1.1, 1.05, 1],
        } : {}}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <Bell
          className="w-5 h-5 transition-colors duration-200"
          style={{
            color: isOpen ? '#FF6A00' : '#d4d4d8',
          }}
          strokeWidth={2.2}
        />
      </m.div>

      {/* Unread badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <m.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="absolute flex items-center justify-center font-black pointer-events-none"
            style={{
              top: '1px',
              insetInlineEnd: '0px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '999px',
              fontSize: '11px',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: '2px solid #09090b',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            {displayCount}
          </m.span>
        )}
      </AnimatePresence>

      {/* Pulse ring on new notification */}
      <AnimatePresence>
        {shouldPulse && (
          <m.span
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: '2px solid #FF6A00',
            }}
          />
        )}
      </AnimatePresence>
    </button>
  );
};
