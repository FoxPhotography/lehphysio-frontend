import React from 'react';
import { m } from 'framer-motion';
import { ArrowRight, MessageCircle, Reply, AtSign, Users, Shield, Smartphone, SmilePlus } from 'lucide-react';
import type { NotificationPreferences } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const PREF_OPTIONS: { key: keyof NotificationPreferences; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'comments', label: 'التعليقات', description: 'لما حد يعلّق على بوستاتك', icon: MessageCircle },
  { key: 'replies', label: 'الردود', description: 'لما حد يرد على تعليقاتك أو رسايلك في الشات', icon: Reply },
  { key: 'mentions', label: 'المنشن', description: 'لما حد يكتب @اسمك', icon: AtSign },
  { key: 'reactions', label: 'التفاعلات', description: 'لما حد يتفاعل بإيموجي على رسايلك في الشات', icon: SmilePlus },
  { key: 'community', label: 'المحتوى الجديد', description: 'الحلقات والبوستات الجديدة', icon: Users },
  { key: 'moderation', label: 'حالة بوستاتك', description: 'لما بوستاتك أو اقتراحاتك تتقبل أو تترفض', icon: Shield },
];

/** iOS-style switch that also works right-to-left. */
const Switch: React.FC<{ on: boolean; onChange: () => void; label: string; disabled?: boolean }> = ({ on, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative shrink-0 w-[51px] h-[31px] rounded-full transition-colors duration-200 disabled:opacity-50 ${on ? 'bg-brand-orange' : 'bg-zinc-700'}`}
  >
    <span
      className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-[inset-inline-start] duration-200"
      style={{ insetInlineStart: on ? 22 : 2 }}
    />
  </button>
);

export const NotificationPreferencesPanel: React.FC = () => {
  const { preferences, updatePreferences, setShowPreferences } = useNotifications();
  const { isSubscribed, pushLoading, handleTogglePushNotifications } = useAuth();
  const pushSupported = typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="flex flex-col h-full min-h-0"
    >
      <header className="flex items-center gap-2 px-2 h-14 shrink-0">
        <button onClick={() => setShowPreferences(false)} aria-label="رجوع" className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:bg-white/5">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-black text-white">إعدادات الإشعارات</h2>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-6">
        {pushSupported && (
          <section>
            <h3 className="text-xs font-bold text-zinc-500 px-1 mb-2">على الموبايل</h3>
            <div className="rounded-2xl bg-zinc-900/70 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="w-9 h-9 rounded-xl bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
                  <Smartphone className="w-[18px] h-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-white">إشعارات الموبايل</p>
                  <p className="text-xs text-zinc-500 mt-0.5">توصلك حتى والتطبيق مقفول</p>
                </div>
                <Switch on={!!isSubscribed} onChange={handleTogglePushNotifications} label="إشعارات الموبايل" disabled={pushLoading} />
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-zinc-500 px-1 mb-2">بلّغني لما</h3>
          <div className="rounded-2xl bg-zinc-900/70 divide-y divide-white/[0.06] overflow-hidden">
            {PREF_OPTIONS.map(({ key, label, description, icon: Icon }) => {
              const on = preferences[key] !== false;
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${on ? 'bg-white/10 text-white' : 'bg-white/5 text-zinc-600'}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-white">{label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                  </div>
                  <Switch on={on} onChange={() => updatePreferences({ [key]: !on })} label={label} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </m.div>
  );
};
