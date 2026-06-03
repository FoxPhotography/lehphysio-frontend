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
  { value: 'PT 9',  label: 'PT 9 (Year 6)' },
  { value: 'PT 10', label: 'PT 10 (Year 5)' },
  { value: 'PT 11', label: 'PT 11 (Year 4)' },
  { value: 'PT 12', label: 'PT 12 (Year 3)' },
  { value: 'PT 13', label: 'PT 13 (Year 2)' },
  { value: 'PT 14', label: 'PT 14 (Year 1)' },
];

export const Register: React.FC<RegisterProps> = ({
  registerForm,
  setRegisterForm,
  authError,
  authSuccess,
  handleRegister,
  setCurrentPage,
}) => (
  <AuthLayout title="Join the League" subtitle="Compete with your colleagues on the leaderboard">
    <form onSubmit={handleRegister} className="space-y-4">
      <AuthError message={authError} />
      <AuthSuccess message={authSuccess} />

      {authSuccess && (
        <button
          type="button"
          onClick={() => setCurrentPage('confirm')}
          className="w-full bg-brand-orange hover:bg-brand-amber text-black font-black text-xs py-3 rounded-xl cursor-pointer transition-all shadow-md text-center"
        >
          Go To Verification Page
        </button>
      )}

      <FormField label="Username" icon={<User className="w-3 h-3" />}>
        <AuthInput
          type="text"
          icon={<User className="w-4 h-4" />}
          placeholder="Choose a username"
          value={registerForm.username}
          onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, username: e.target.value }))}
          required
          autoComplete="username"
        />
      </FormField>

      <FormField label="Email" icon={<Mail className="w-3 h-3" />}>
        <AuthInput
          type="email"
          icon={<Mail className="w-4 h-4" />}
          placeholder="Your email address"
          value={registerForm.email}
          onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, email: e.target.value }))}
          required
          autoComplete="email"
        />
      </FormField>

      <FormField label="Password" icon={<Lock className="w-3 h-3" />}>
        <AuthInput
          type="password"
          icon={<Lock className="w-4 h-4" />}
          placeholder="Create a password"
          value={registerForm.password}
          onChange={(e) => setRegisterForm((prev: any) => ({ ...prev, password: e.target.value }))}
          required
          autoComplete="new-password"
        />
      </FormField>

      <FormField label="Academic Batch" icon={<GraduationCap className="w-3 h-3" />}>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
          <select
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[14px] focus:outline-none focus:border-orange-500/60 transition-colors appearance-none"
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

      <AuthSubmitButton label="Create Account" />
    </form>

    <p className="text-center text-[13px] text-zinc-500 mt-5">
      Already have an account?{' '}
      <AuthLink onClick={() => setCurrentPage('login')}>Login</AuthLink>
    </p>
  </AuthLayout>
);
