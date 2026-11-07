import React from 'react';
import type { NotificationPreferences } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { m } from 'framer-motion';
import { ArrowLeft, MessageSquare, Reply, AtSign, Users, Shield } from 'lucide-react';

const PREF_OPTIONS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'comments',
    label: 'التعليقات',
    description: 'لما حد يعلّق على بوستاتي',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    key: 'replies',
    label: 'الردود',
    description: 'لما حد يرد على تعليقاتي',
    icon: <Reply className="rtl:-scale-x-100 w-4 h-4" />,
  },
  {
    key: 'mentions',
    label: 'المنشن',
    description: 'لما حد يعملي منشن بـ @',
    icon: <AtSign className="w-4 h-4" />,
  },
  {
    key: 'community',
    label: 'المجتمع',
    description: 'البوستات والحلقات الجديدة',
    icon: <Users className="w-4 h-4" />,
  },
  {
    key: 'moderation',
    label: 'المراجعة',
    description: 'لما بوستاتي تتقبل أو تترفض',
    icon: <Shield className="w-4 h-4" />,
  },
];

export const NotificationPreferencesPanel: React.FC = () => {
  const { preferences, updatePreferences, setShowPreferences } = useNotifications();

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <button
          onClick={() => setShowPreferences(false)}
          className="p-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <ArrowLeft className="rtl:-scale-x-100 w-4 h-4" />
        </button>
        <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
          إعدادات الإشعارات
        </h3>
      </div>

      {/* Preferences list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {PREF_OPTIONS.map(({ key, label, description, icon }) => {
          const isEnabled = preferences[key] !== false;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isEnabled ? 'rgba(242, 101, 34, 0.12)' : 'rgba(255,255,255,0.04)',
                    color: isEnabled ? 'var(--orange)' : 'var(--text-muted)',
                  }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-2xs font-medium" style={{ color: 'var(--text-muted)' }}>{description}</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => updatePreferences({ [key]: !isEnabled })}
                className="relative shrink-0 cursor-pointer"
                style={{ width: '40px', height: '22px' }}
                aria-label={`تفعيل/إيقاف: ${label}`}
              >
                <div
                  className="absolute inset-0 rounded-full transition-colors duration-300"
                  style={{
                    background: isEnabled
                      ? 'linear-gradient(135deg, var(--orange), var(--amber))'
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
                <m.div
                  animate={{ x: isEnabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md"
                />
              </button>
            </div>
          );
        })}
      </div>
    </m.div>
  );
};
