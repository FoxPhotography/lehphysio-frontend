import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Mail, CheckCircle, Loader2, UserCog } from 'lucide-react';
import { GoogleIcon } from '../AuthComponents';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export type UsernameAuthMethod = 'password' | '2fa' | 'google';

interface ChangeUsernameModalProps {
  open: boolean;
  currentUsername: string;
  initialMethod?: UsernameAuthMethod;
  initialReauthToken?: string | null;
  onClose: () => void;
}

export const ChangeUsernameModal: React.FC<ChangeUsernameModalProps> = ({
  open,
  currentUsername,
  initialMethod = 'password',
  initialReauthToken = null,
  onClose,
}) => {
  const { token, setToken, fetchUserProfile, showToast } = useAuth();
  const [method, setMethod] = useState<UsernameAuthMethod>(initialMethod);
  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [reauthToken, setReauthToken] = useState<string | null>(initialReauthToken);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMethod(initialMethod);
      setReauthToken(initialReauthToken);
      const pending = sessionStorage.getItem('pending_new_username');
      if (pending && initialReauthToken) {
        setNewUsername(pending);
      } else if (!initialReauthToken) {
        setNewUsername('');
      }
      setPassword('');
      setCode('');
      setCodeSentTo(null);
      setError('');
    }
  }, [open, initialMethod, initialReauthToken]);

  const handleRequest2FA = async () => {
    if (!token || sendingCode) return;
    setError('');
    setSendingCode(true);
    try {
      const res = await authService.requestUsername2FA(token);
      setCodeSentTo(res.maskedEmail || 'بريدك الإلكتروني');
      showToast('تم إرسال كود التحقق إلى بريدك الإلكتروني ✉️');
    } catch (err: any) {
      setError(err?.message || 'تعذر إرسال كود التحقق.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleGoogleVerify = () => {
    if (!token) return;
    const trimmed = newUsername.trim();
    if (trimmed) {
      sessionStorage.setItem('pending_new_username', trimmed);
    }
    window.location.href = authService.getGoogleVerifyUsernameUrl(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submitting) return;
    setError('');

    const cleanName = newUsername.trim();
    if (cleanName.length < 3 || cleanName.length > 30) {
      setError('اسم المستخدم لازم يكون بين 3 و 30 حرف.');
      return;
    }
    if (cleanName === currentUsername) {
      setError('الاسم الجديد هو نفس اسمك الحالي.');
      return;
    }
    if (method === 'password' && !password) {
      setError('اكتب كلمة المرور الحالية.');
      return;
    }
    if (method === '2fa' && !code.trim()) {
      setError('اكتب كود التحقق المكون من 6 أرقام.');
      return;
    }
    if (method === 'google' && !reauthToken) {
      setError('اضغط على زر التحقق بحساب Google الأول.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.changeUsername(
        {
          newUsername: cleanName,
          method,
          password: method === 'password' ? password : undefined,
          code: method === '2fa' ? code.trim() : undefined,
          reauthToken: method === 'google' ? reauthToken || undefined : undefined,
        },
        token
      );

      if (res?.token) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
      }
      sessionStorage.removeItem('username_reauth_token');
      sessionStorage.removeItem('pending_new_username');
      await fetchUserProfile();
      showToast(res?.message || 'تم تغيير اسم المستخدم بنجاح! 🎉');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تغيير اسم المستخدم.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: UsernameAuthMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'password', label: 'كلمة المرور', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: '2fa', label: 'كود 2FA', icon: <Mail className="w-3.5 h-3.5" /> },
    { id: 'google', label: 'Google', icon: <GoogleIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl text-start"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
                  <UserCog className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">تغيير اسم المستخدم</h3>
                  <p className="text-2xs text-zinc-500">الاسم الحالي: <span dir="ltr" className="text-zinc-300 font-bold">@{currentUsername}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* New Username Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  اسم المستخدم الجديد
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="new_username"
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 focus:border-brand-orange/60 outline-none text-sm font-bold text-white placeholder:text-zinc-600 transition-colors"
                />
              </div>

              {/* Verification Method Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  تأكيد الهوية عبر
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {tabs.map((t) => {
                    const active = method === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setMethod(t.id);
                          setError('');
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          active
                            ? 'bg-brand-orange/15 border-brand-orange/60 text-brand-orange'
                            : 'bg-zinc-900/70 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method-specific verification UI */}
              {method === 'password' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 focus:border-brand-orange/60 outline-none text-sm font-bold text-white placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              )}

              {method === '2fa' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-300">كود التحقق (2FA)</span>
                    <button
                      type="button"
                      onClick={handleRequest2FA}
                      disabled={sendingCode}
                      className="text-xs font-extrabold text-brand-orange hover:text-brand-amber transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {sendingCode ? 'جاري الإرسال…' : codeSentTo ? 'إعادة إرسال الكود' : 'ابعت الكود على إيميلي'}
                    </button>
                  </div>
                  {codeSentTo && (
                    <p className="text-2xs text-emerald-400 font-semibold">
                      اتبعث كود من 6 أرقام إلى <span dir="ltr">{codeSentTo}</span>
                    </p>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 focus:border-brand-orange/60 outline-none text-sm font-black tracking-widest text-center text-white placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              )}

              {method === 'google' && (
                <div className="p-3 rounded-xl border border-white/10 bg-zinc-900/60">
                  {reauthToken ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>تم تأكيد هويتك بحساب Google بنجاح!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-400 font-semibold">
                        أكّد هويتك بتسجيل دخول سريع عبر Google
                      </span>
                      <button
                        type="button"
                        onClick={handleGoogleVerify}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black text-xs font-black hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        <GoogleIcon className="w-4 h-4" />
                        <span>تحقق بـ Google</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || (method === 'google' && !reauthToken)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-sm flex items-center justify-center gap-2 hover:shadow-orange-glow active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'جاري التغيير…' : 'تأكيد تغيير الاسم'}</span>
              </button>
            </form>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
