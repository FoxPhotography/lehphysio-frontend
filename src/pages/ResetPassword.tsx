import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { OtpInput } from '../components/OtpInput';
import {
  AuthLayout,
  FormField,
  AuthError,
  AuthSuccess,
  AuthInput,
  AuthSubmitButton,
  AuthLink,
} from '../components/AuthComponents';

interface ResetPasswordProps {
  email: string;
  authError: string;
  authSuccess: string;
  onSubmit: (code: string, newPassword: string) => void;
  setCurrentPage: (page: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  email,
  authError,
  authSuccess,
  onSubmit,
  setCurrentPage,
}) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code, newPassword);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={`Code sent to ${email}`}
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={authError} />
        <AuthSuccess message={authSuccess} />

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider text-center block">
            6-Digit Code
          </label>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={() => {
              setTimeout(() => {
                const passInput = document.getElementById('new-password-input') as HTMLInputElement;
                if (passInput && !passInput.value) {
                  passInput.focus();
                } else {
                  const form = document.getElementById('reset-password-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }
              }, 50);
            }}
          />
        </div>

        <FormField label="New Password" icon={<Lock className="w-3 h-3" />}>
          <AuthInput
            id="new-password-input"
            type="password"
            icon={<Lock className="w-4 h-4" />}
            placeholder="Your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </FormField>

        <AuthSubmitButton label="Update Password" />
      </form>

      <p className="text-center text-[13px] text-zinc-500 mt-5">
        Remember your password?{' '}
        <AuthLink onClick={() => setCurrentPage('login')}>Login</AuthLink>
      </p>
    </AuthLayout>
  );
};
