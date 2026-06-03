import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';

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

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px] relative"
    >
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/15 border border-orange-500/30 mb-4 shadow-lg shadow-orange-500/10 overflow-hidden">
          <img src="/favicon.svg" alt="LehPhysio Logo" className="w-9 h-9 object-contain" />
        </div>
        <h1 className="text-[28px] font-black text-white leading-tight">{title}</h1>
        <p className="text-[13px] text-zinc-500 mt-1">{subtitle}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
        {children}
      </div>
    </motion.div>
  </div>
);

// ─── Form Field ────────────────────────────────────────────────────────────────
export const FormField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[12px] font-bold text-zinc-400 uppercase tracking-wider">
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
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-medium"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Auth Success Banner ───────────────────────────────────────────────────────
export const AuthSuccess: React.FC<{ message: string }> = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium"
      >
        {message}
      </motion.div>
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
    className="text-orange-400 font-bold hover:text-orange-300 transition-colors"
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
  <motion.button
    type="submit"
    disabled={disabled}
    onClick={onClick}
    whileHover={disabled ? {} : { scale: 1.02 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-[14px] hover:from-orange-400 hover:to-amber-400 transition-colors shadow-lg shadow-orange-500/15 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
    {icon || <ArrowRight className="w-4 h-4" />}
  </motion.button>
);

// ─── Input Field ───────────────────────────────────────────────────────────────
export const AuthInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
}> = ({ icon, className, ...props }) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">{icon}</div>
    )}
    <input
      {...props}
      className={`w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[14px] focus:outline-none focus:border-orange-500/60 transition-colors ${icon ? 'pl-10 pr-4' : 'px-4'} ${className || ''}`}
    />
  </div>
);
