import React from 'react';
import { User, Lock } from 'lucide-react';
import {
  AuthLayout,
  FormField,
  AuthError,
  AuthInput,
  AuthSubmitButton,
  AuthLink,
} from '../components/AuthComponents';

interface LoginProps {
  loginForm: any;
  setLoginForm: React.Dispatch<React.SetStateAction<any>>;
  authError: string;
  handleLogin: (e: React.FormEvent) => void;
  setCurrentPage: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({
  loginForm,
  setLoginForm,
  authError,
  handleLogin,
  setCurrentPage,
}) => (
  <AuthLayout title="Welcome Back" subtitle="Sign in to your Leh Physio? account">
    <form onSubmit={handleLogin} className="space-y-4">
      <AuthError message={authError} />

      <FormField label="Username" icon={<User className="w-3 h-3" />}>
        <AuthInput
          type="text"
          icon={<User className="w-4 h-4" />}
          placeholder="Your username"
          value={loginForm.username}
          onChange={(e) => setLoginForm((prev: any) => ({ ...prev, username: e.target.value }))}
          required
          autoComplete="username"
        />
      </FormField>

      <FormField label="Password" icon={<Lock className="w-3 h-3" />}>
        <AuthInput
          type="password"
          icon={<Lock className="w-4 h-4" />}
          placeholder="Your password"
          value={loginForm.password}
          onChange={(e) => setLoginForm((prev: any) => ({ ...prev, password: e.target.value }))}
          required
          autoComplete="current-password"
        />
      </FormField>

      <div className="text-right -mt-1">
        <AuthLink onClick={() => setCurrentPage('forgot-password')}>
          Forgot Password?
        </AuthLink>
      </div>

      <AuthSubmitButton label="Login" />
    </form>

    <p className="text-center text-[13px] text-zinc-500 mt-5">
      Don't have an account?{' '}
      <AuthLink onClick={() => setCurrentPage('register')}>Register</AuthLink>
    </p>
  </AuthLayout>
);
