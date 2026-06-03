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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLocalError('');

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(code, newPassword);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={`Code sent to ${email}`}
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={localError || authError} />
        <AuthSuccess message={authSuccess} />

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider text-center block">
            6-Digit Code
          </label>
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={loading}
            onComplete={() => {
              setTimeout(() => {
                const passInput = document.getElementById('new-password-input') as HTMLInputElement;
                if (passInput && !passInput.value) {
                  passInput.focus();
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
            disabled={loading}
          />
        </FormField>

        <FormField label="Confirm New Password" icon={<Lock className="w-3 h-3" />}>
          <AuthInput
            id="confirm-password-input"
            type="password"
            icon={<Lock className="w-4 h-4" />}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />
        </FormField>

        <AuthSubmitButton label={loading ? "Updating..." : "Update Password"} disabled={loading} />
      </form>

      <p className="text-center text-[13px] text-zinc-500 mt-5">
        Remember your password?{' '}
        <AuthLink onClick={() => !loading && setCurrentPage('login')}>Login</AuthLink>
      </p>
    </AuthLayout>
  );
};
