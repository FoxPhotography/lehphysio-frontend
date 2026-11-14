import React, { useState, useEffect } from 'react';
import { User, Lock, GraduationCap, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import {
  AuthLayout,
  FormField,
  AuthError,
  AuthInput,
  AuthSubmitButton,
  AuthLink,
  GoogleIcon,
} from '../components/AuthComponents';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const BATCHES = [
  { value: 'PT 9',  label: 'PT 9 (سنة سادسة)' },
  { value: 'PT 10', label: 'PT 10 (سنة خامسة)' },
  { value: 'PT 11', label: 'PT 11 (سنة رابعة)' },
  { value: 'PT 12', label: 'PT 12 (سنة تالتة)' },
  { value: 'PT 13', label: 'PT 13 (سنة تانية)' },
  { value: 'PT 14', label: 'PT 14 (سنة أولى)' },
];

export const SocialRegister: React.FC = () => {
  const { setToken, setUser, showToast, setCurrentPage } = useAuth();

  const [regToken, setRegToken] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [username, setUsername] = useState('');
  const [batch, setBatch] = useState('PT 14');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('regToken') || '';
    const emailParam = params.get('email') || '';
    const nameParam = params.get('name') || '';
    const avatarParam = params.get('avatar') || '';

    setRegToken(tokenParam);
    setEmail(emailParam);
    setDisplayName(nameParam);
    setAvatarUrl(avatarParam);

    // Generate smart initial username
    if (nameParam) {
      const sanitized = nameParam.trim().replace(/\s+/g, '_').toLowerCase();
      setUsername(sanitized.slice(0, 20));
    } else if (emailParam) {
      const prefix = emailParam.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      setUsername(prefix.slice(0, 20));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regToken) {
      setError('جلسة التسجيل غير صالحة أو منتهية. يرجى المحاولة مرة أخرى من صفحة تسجيل الدخول.');
      return;
    }

    const cleanUser = username.trim();
    if (!cleanUser || cleanUser.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل.');
      return;
    }

    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.completeGoogleRegistration({
        regToken,
        username: cleanUser,
        batch,
        password,
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast('أهلاً بك في عائلة ليه فيزيو! تم إنشاء حسابك بنجاح 🎉');
        window.history.replaceState({}, document.title, '/');
        setCurrentPage('home');
      } else {
        setError(data.error || 'فشل إكمال إنشاء الحساب.');
      }
    } catch (err: any) {
      setError('حدث خطأ في الاتصال بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  if (!regToken && !loading) {
    return (
      <AuthLayout title="تسجيل الدخول بـ Google" subtitle="انتهت صلاحية جلسة التسجيل">
        <div className="text-center py-6 space-y-4">
          <p className="text-sm text-zinc-400">
            انتهت صلاحية جلسة التحقق من Google أو تم فتح الصفحة بشكل غير صحيح.
          </p>
          <button
            type="button"
            onClick={() => setCurrentPage('login')}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm transition-all"
          >
            العودة لصفحة الدخول
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="كمّل حسابك"
      subtitle="خطوة أخيرة لتأكيد دفعتك وكلمة السر"
    >
      {/* Verified Google Account Badge */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || 'Google User'}
            className="w-10 h-10 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <GoogleIcon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 text-start">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-white truncate">{displayName || 'حساب Google'}</p>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          </div>
          <p className="text-2xs text-zinc-400 truncate">{email}</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          موثّق
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <FormField label="اسم المستخدم" icon={<User className="w-3 h-3" />}>
          <AuthInput
            type="text"
            icon={<User className="w-4 h-4" />}
            placeholder="اختر اسم مستخدم فريد"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </FormField>

        <FormField label="الدفعة الدراسية" icon={<GraduationCap className="w-3 h-3" />}>
          <div className="relative">
            <GraduationCap className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
            <select
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/60 transition-colors appearance-none"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
            >
              {BATCHES.map((b) => (
                <option key={b.value} value={b.value} className="bg-zinc-900">
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </FormField>

        <FormField label="كلمة السر" icon={<Lock className="w-3 h-3" />}>
          <AuthInput
            type="password"
            icon={<Lock className="w-4 h-4" />}
            placeholder="كلمة السر الخاصة بك (6 أحرف فأكثر)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="تأكيد كلمة السر" icon={<Lock className="w-3 h-3" />}>
          <AuthInput
            type="password"
            icon={<Lock className="w-4 h-4" />}
            placeholder="أعد كتابة كلمة السر"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </FormField>

        <p className="text-2xs text-zinc-400 bg-white/5 p-2.5 rounded-xl border border-white/5 text-start leading-relaxed">
          💡 <span className="font-bold text-zinc-300">ملاحظة:</span> كلمة السر دي هتقدر تسجل بيها بعد كدا مع اسم المستخدم، وفي نفس الوقت هتقدر تدخل بضغطة واحدة بحساب Google دايمًا.
        </p>

        <AuthSubmitButton
          label={loading ? 'جاري إنشاء الحساب...' : 'إتمام الحساب والدخول'}
          disabled={loading}
          icon={loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <ArrowRight className="rtl:-scale-x-100 w-4 h-4" />}
        />
      </form>

      <p className="text-center text-[13px] text-zinc-500 mt-5">
        عندك حساب قديم؟{' '}
        <AuthLink onClick={() => setCurrentPage('login')}>سجل دخول</AuthLink>
      </p>
    </AuthLayout>
  );
};
