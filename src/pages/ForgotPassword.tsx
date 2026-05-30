import React, { useState } from 'react';

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
  setCurrentPage
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', fontFamily: 'Cairo, sans-serif' }}>نسيت كلمة المرور</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontFamily: 'Cairo, sans-serif' }}>أدخل بريدك الإلكتروني لتلقي رمز إعادة التعيين</p>
        {authError && <div className="pl-form-error" style={{ fontFamily: 'Cairo, sans-serif' }}>{authError}</div>}
        {authSuccess && <div className="pl-form-success" style={{ fontFamily: 'Cairo, sans-serif' }}>{authSuccess}</div>}
        <form onSubmit={handleSubmit}>
          <div className="pl-form-group">
            <label style={{ fontFamily: 'Cairo, sans-serif' }}>البريد الإلكتروني</label>
            <input
              type="email"
              className="pl-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', fontFamily: 'Cairo, sans-serif' }}>إرسال الرمز</button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '1.5rem', color: 'var(--text-secondary)', fontFamily: 'Cairo, sans-serif' }}>
          تذكرت كلمة المرور؟ <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>تسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
};
