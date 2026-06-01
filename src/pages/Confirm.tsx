import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { OtpInput } from '../components/OtpInput';
import {
  AuthLayout,
  AuthError,
  AuthSuccess,
  AuthSubmitButton,
  AuthLink,
} from '../components/AuthComponents';

interface ConfirmProps {
  confirmCode: string;
  setConfirmCode: (val: string) => void;
  authError: string;
  authSuccess: string;
  handleConfirm: (e: React.FormEvent) => void;
}

export const Confirm: React.FC<ConfirmProps> = ({
  confirmCode,
  setConfirmCode,
  authError,
  authSuccess,
  handleConfirm,
}) => (
  <AuthLayout
    title="Verify Account"
    subtitle="Enter the 6-digit code sent to your email"
  >
    <form id="verify-form" onSubmit={handleConfirm} className="space-y-5">
      <AuthError message={authError} />
      <AuthSuccess message={authSuccess} />

      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-2">
          <ShieldCheck className="w-7 h-7 text-orange-400" />
        </div>
      </div>

      <OtpInput
        value={confirmCode}
        onChange={setConfirmCode}
        onComplete={() => {
          setTimeout(() => {
            const form = document.getElementById('verify-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }, 50);
        }}
      />

      <AuthSubmitButton label="Verify Account" />
    </form>
  </AuthLayout>
);
