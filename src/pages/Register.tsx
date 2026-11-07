import React from 'react';
import { User, Mail, Lock, GraduationCap } from 'lucide-react';
import {
  AuthLayout,
  FormField,
  AuthError,
  AuthSuccess,
  AuthInput,
  AuthSubmitButton,
  AuthLink,
} from '../components/AuthComponents';

interface RegisterProps {
  registerForm: any;
  setRegisterForm: React.Dispatch<React.SetStateAction<any>>;
  authError: string;
  authSuccess: string;
  handleRegister: (e: React.FormEvent) => void;
  setCurrentPage: (page: string) => void;
}

const BATCHES = [
  { value: 'PT 9',  label: 'PT 9 (سنة سادسة)' },
  { value: 'PT 10', label: 'PT 10 (سنة خامسة)' },
  { value: 'PT 11', label: 'PT 11 (سنة رابعة)' },
  { value: 'PT 12', label: 'PT 12 (سنة تالتة)' },
  { value: 'PT 13', label: 'PT 13 (سنة تانية)' },
  { value: 'PT 14', label: 'PT 14 (سنة أولى)' },
];

export const Register: React.FC<RegisterProps> = ({
  registerForm,
  setRegisterForm,
  authError,
  authSuccess,
  handleRegister,
  setCurrentPage,
}) => (
  <AuthLayout title="انضم للدوري" subtitle="نافس زمايلك على لوحة الترتيب">
    <form onSubmit={handleRegister} className="space-y-4">
      <AuthError message={authError} />
      <AuthSuccess message={authSuccess} />

      {authSuccess && (
        <button
          type="button"
          onClick={() => setCurrentPage('confirm')}
          className="w-full bg-brand-orange hover:bg-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer transition-all shadow-md text-center"
        >
          روح لصفحة التأكيد
        </button>
      )}

      <FormField label="اسم المستخدم" icon={<User className="w-3 h-3" />}>
        <AuthInput
          type="text"
          icon={<User className="w-4 h-4" />}
          placeholder="اختار اسم مستخدم"
          value={registerForm.username}
          onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, username: e.target.value }))}
          required
          autoComplete="username"
        />
      </FormField>

      <FormField label="الإيميل" icon={<Mail className="w-3 h-3" />}>
        <AuthInput
          type="email"
          icon={<Mail className="w-4 h-4" />}
          placeholder="الإيميل بتاعك"
          value={registerForm.email}
          onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, email: e.target.value }))}
          required
          autoComplete="email"
        />
      </FormField>

      <FormField label="كلمة السر" icon={<Lock className="w-3 h-3" />}>
        <AuthInput
          type="password"
          icon={<Lock className="w-4 h-4" />}
          placeholder="اختار كلمة سر"
          value={registerForm.password}
          onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, password: e.target.value }))}
          required
          autoComplete="new-password"
        />
      </FormField>

      <FormField label="الدفعة" icon={<GraduationCap className="w-3 h-3" />}>
        <div className="relative">
          <GraduationCap className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
          <select
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/60 transition-colors appearance-none"
            value={registerForm.batch}
            onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, batch: e.target.value }))}
          >
            {BATCHES.map(b => (
              <option key={b.value} value={b.value} className="bg-zinc-900">
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </FormField>

      <AuthSubmitButton label="اعمل الحساب" />
    </form>

    <p className="text-center text-[13px] text-zinc-500 mt-5">
      عندك حساب؟{' '}
      <AuthLink onClick={() => setCurrentPage('login')}>دخول</AuthLink>
    </p>
  </AuthLayout>
);
