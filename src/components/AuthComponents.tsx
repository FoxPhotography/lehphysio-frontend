import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

// ─── Reusable Auth Layout ──────────────────────────────────────────────────────
export const AuthLayout: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-zinc-950">
    {/* Ambient glow */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
    </div>

    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px] relative"
    >
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/15 border border-orange-500/30 mb-4 shadow-lg shadow-orange-500/10 overflow-hidden">
          <img src="/icon-192.webp" width={96} height={96} alt="ليه فيزيو" className="w-9 h-9 object-contain" />
        </div>
        <h1 className="text-[28px] font-black text-white leading-tight">{title}</h1>
        <p className="text-[13px] text-zinc-500 mt-1">{subtitle}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-zinc-900/80 p-6 shadow-2xl">
        {children}
      </div>
    </m.div>
  </div>
);

// ─── Form Field ────────────────────────────────────────────────────────────────
export const FormField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

// ─── Auth Error Banner ─────────────────────────────────────────────────────────
export const AuthError: React.FC<{ message: string }> = ({ message }) => (
  <AnimatePresence>
    {message && (
      <m.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {message}
      </m.div>
    )}
  </AnimatePresence>
);

// ─── Auth Success Banner ───────────────────────────────────────────────────────
export const AuthSuccess: React.FC<{ message: string }> = ({ message }) => (
  <AnimatePresence>
    {message && (
      <m.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
      >
        {message}
      </m.div>
    )}
  </AnimatePresence>
);

// ─── Auth Link Button ──────────────────────────────────────────────────────────
export const AuthLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick, children
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-orange-400 font-bold hover:text-orange-300 transition-colors cursor-pointer"
  >
    {children}
  </button>
);

// ─── Submit Button ─────────────────────────────────────────────────────────────
export const AuthSubmitButton: React.FC<{
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ label, icon, disabled, onClick }) => (
  <m.button
    type="submit"
    disabled={disabled}
    onClick={onClick}
    whileHover={disabled ? {} : { scale: 1.02 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-sm hover:from-orange-400 hover:to-amber-400 transition-colors shadow-lg shadow-orange-500/15 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
    {icon || <ArrowRight className="rtl:-scale-x-100 w-4 h-4" />}
  </m.button>
);

// ─── Input Field ───────────────────────────────────────────────────────────────
export const AuthInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
}> = ({ icon, className, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">{icon}</div>
      )}
      <input
        type={effectiveType}
        // Emails, passwords and codes are Latin: type them left-to-right; names pick their own direction
        dir={type === 'email' || isPassword ? 'ltr' : 'auto'}
        {...props}
        className={`w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all ${
          icon ? 'ps-10' : 'ps-4'
        } ${isPassword ? 'pe-11' : 'pe-4'} ${className || ''}`}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-400 focus:text-orange-400 transition-colors p-1 rounded-lg cursor-pointer flex items-center justify-center"
          title={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
          aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

// ─── Google SVG Icon ─────────────────────────────────────────────────────────────
export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

// ─── Google Auth Button ─────────────────────────────────────────────────────────
export const GoogleAuthButton: React.FC<{
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label = 'المتابعة باستخدام Google', onClick, disabled }) => (
  <m.button
    type="button"
    disabled={disabled}
    onClick={onClick}
    whileHover={disabled ? {} : { scale: 1.01 }}
    whileTap={disabled ? {} : { scale: 0.99 }}
    className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    <GoogleIcon className="w-4.5 h-4.5 flex-shrink-0" />
    <span>{label}</span>
  </m.button>
);

// ─── Auth Divider ───────────────────────────────────────────────────────────────
export const AuthDivider: React.FC<{ text?: string }> = ({ text = 'أو' }) => (
  <div className="relative my-4">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-white/10" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="bg-zinc-900 px-3 text-zinc-500 font-medium">{text}</span>
    </div>
  </div>
);
