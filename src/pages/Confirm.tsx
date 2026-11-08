import React, { useEffect, useRef } from 'react';
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
  confirmEmail?: string;
  confirmCode: string;
  setConfirmCode: (val: string) => void;
  authError: string;
  authSuccess: string;
  handleConfirm: (e: React.FormEvent) => void;
}

export const Confirm: React.FC<ConfirmProps> = ({
  confirmEmail,
  confirmCode,
  setConfirmCode,
  authError,
  authSuccess,
  handleConfirm,
}) => {
  // Opened from the email's "فعّل حسابي" button: fill the code and submit automatically
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (autoSubmitted.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('code') || '').replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) return;
    autoSubmitted.current = true;
    setConfirmCode(code);
    // Drop the code from the address bar / history
    window.history.replaceState(window.history.state, '', '/confirm');
    setTimeout(() => {
      const form = document.getElementById('verify-form') as HTMLFormElement | null;
      form?.requestSubmit();
    }, 150);
  }, []);

  return (
  <AuthLayout
    title="تأكيد الحساب"
    subtitle={confirmEmail ? `Enter the 6-digit code sent to ${confirmEmail}` : "اكتب الكود المكوّن من 6 أرقام اللي وصلك على الإيميل"}
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

      <AuthSubmitButton label="تأكيد الحساب" />
    </form>
  </AuthLayout>
  );
};
