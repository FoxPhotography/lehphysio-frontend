import React, { useState } from 'react';

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
  setCurrentPage
}) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code, newPassword);
  };

  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', fontFamily: 'Cairo, sans-serif' }}>إعادة تعيين كلمة المرور</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontFamily: 'Cairo, sans-serif' }}>
          تم إرسال رمز إعادة التعيين إلى <strong style={{ color: 'var(--orange)' }}>{email}</strong>
        </p>
        {authError && <div className="pl-form-error" style={{ fontFamily: 'Cairo, sans-serif' }}>{authError}</div>}
        {authSuccess && <div className="pl-form-success" style={{ fontFamily: 'Cairo, sans-serif' }}>{authSuccess}</div>}
        <form onSubmit={handleSubmit}>
          <div className="pl-form-group">
            <label style={{ fontFamily: 'Cairo, sans-serif' }}>الرمز المكون من 6 أرقام</label>
            <input
              type="text"
              className="pl-input"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: 900 }}
              required
            />
          </div>
          <div className="pl-form-group">
            <label style={{ fontFamily: 'Cairo, sans-serif' }}>كلمة المرور الجديدة</label>
            <input
              type="password"
              className="pl-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', fontFamily: 'Cairo, sans-serif' }}>تحديث كلمة المرور</button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '1.5rem', color: 'var(--text-secondary)', fontFamily: 'Cairo, sans-serif' }}>
          تذكرت كلمة المرور؟ <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>تسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
};
