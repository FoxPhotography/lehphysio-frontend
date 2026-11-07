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
  <AuthLayout title="أهلًا بيك تاني" subtitle="ادخل على حسابك في ليه فيزيو؟">
    <form onSubmit={handleLogin} className="space-y-4">
      <AuthError message={authError} />

      <FormField label="اسم المستخدم" icon={<User className="w-3 h-3" />}>
        <AuthInput
          type="text"
          icon={<User className="w-4 h-4" />}
          placeholder="اسم المستخدم بتاعك"
          value={loginForm.username}
          onChange={(e) => setLoginForm((prev: any) => ({ ...prev, username: e.target.value }))}
          required
          autoComplete="username"
        />
      </FormField>

      <FormField label="كلمة السر" icon={<Lock className="w-3 h-3" />}>
        <AuthInput
          type="password"
          icon={<Lock className="w-4 h-4" />}
          placeholder="كلمة السر بتاعتك"
          value={loginForm.password}
          onChange={(e) => setLoginForm((prev: any) => ({ ...prev, password: e.target.value }))}
          required
          autoComplete="current-password"
        />
      </FormField>

      <div className="text-end -mt-1">
        <AuthLink onClick={() => setCurrentPage('forgot-password')}>
          نسيت كلمة السر؟
        </AuthLink>
      </div>

      <AuthSubmitButton label="دخول" />
    </form>

    <p className="text-center text-[13px] text-zinc-500 mt-5">
      معندكش حساب؟{' '}
      <AuthLink onClick={() => setCurrentPage('register')}>اعمل حساب</AuthLink>
    </p>
  </AuthLayout>
);
