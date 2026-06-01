import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import {
  AuthLayout,
  FormField,
  AuthError,
  AuthSuccess,
  AuthInput,
  AuthSubmitButton,
  AuthLink,
} from '../components/AuthComponents';

interface ForgotPasswordProps {
  authError: string;
  authSuccess: string;
  onSubmit: (email: string) => void;
  setCurrentPage: (page: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  authError,
  authSuccess,
  onSubmit,
  setCurrentPage,
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email to receive a reset code"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={authError} />
        <AuthSuccess message={authSuccess} />

        <FormField label="Email Address" icon={<Mail className="w-3 h-3" />}>
          <AuthInput
            type="email"
            icon={<Mail className="w-4 h-4" />}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </FormField>

        <AuthSubmitButton label="Send Reset Code" />
      </form>

      <p className="text-center text-[13px] text-zinc-500 mt-5">
        Remember your password?{' '}
        <AuthLink onClick={() => setCurrentPage('login')}>Login</AuthLink>
      </p>
    </AuthLayout>
  );
};
