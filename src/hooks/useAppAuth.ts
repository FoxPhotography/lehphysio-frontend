import { authService } from '../services/authService';

interface UseAppAuthProps {
  token: string | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  confirmEmail: string;
  setConfirmEmail: (email: string) => void;
  setForgotEmail: (email: string) => void;
  forgotEmail: string;
  loginForm: any;
  setLoginForm: any;
  registerForm: any;
  setRegisterForm: any;
  confirmCode: string;
  setConfirmCode: (code: string) => void;
  setAuthError: (err: string) => void;
  setAuthSuccess: (succ: string) => void;
  setStreakOverlay: (overlay: any) => void;
  xpSettings: any;
  playChatSound: (type: 'start' | 'success' | 'win' | 'error' | 'tick') => void;
  setCurrentPage: (page: string) => void;
  fetchUserProfile: () => void;
  fetchLeaderboard: () => void;
  showToast: (msg: string) => void;
}

export const useAppAuth = ({
  token,
  setToken,
  setUser,
  confirmEmail,
  setConfirmEmail,
  setForgotEmail,
  forgotEmail,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  confirmCode,
  setConfirmCode,
  setAuthError,
  setAuthSuccess,
  setStreakOverlay,
  xpSettings,
  playChatSound,
  setCurrentPage,
  fetchUserProfile,
  fetchLeaderboard,
  showToast,
}: UseAppAuthProps) => {
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.login(loginForm);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess('');
        setToken(data.token);
        setUser(data.user);
        setLoginForm({ username: '', password: '' });
        playChatSound('success');
        if (data.rewards) {
          const totalXpEarned = (data.rewards.daily_login ? (xpSettings.daily_login || 10) : 0) + 
                               (data.rewards.streak_bonus ? (xpSettings.streak_bonus || 70) : 0);
          
          if (data.rewards.daily_login || data.rewards.streak_bonus) {
            setStreakOverlay({
              show: true,
              days: data.user.streak_count || 1,
              xpEarned: totalXpEarned,
              hasStreakBonus: !!data.rewards.streak_bonus
            });
            playChatSound('win');
          }
        }
        if (!sessionStorage.getItem('pendingGameCode')) {
          setCurrentPage('home');
        }
      } else {
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.register(registerForm);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess(data.message);
        setConfirmEmail(registerForm.email);
        localStorage.setItem('confirmEmail', registerForm.email);
        setTimeout(() => {
          setCurrentPage('confirm');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthSuccess('');
        setAuthError(data.error || 'Failed to register.');
      }
    } catch (err) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const handleConfirm = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.confirmCode(confirmEmail, confirmCode);
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('confirmEmail');
        setAuthError('');
        setAuthSuccess(data.message);
        setToken(data.token);
        setUser(data.user);
        setConfirmCode('');

        if (data.rewards) {
          const totalXpEarned = (data.rewards.daily_login ? (xpSettings.daily_login || 10) : 0) + 
                               (data.rewards.streak_bonus ? (xpSettings.streak_bonus || 70) : 0);
          
          if (data.rewards.daily_login || data.rewards.streak_bonus) {
            setStreakOverlay({
              show: true,
              days: data.user.streak_count || 1,
              xpEarned: totalXpEarned,
              hasStreakBonus: !!data.rewards.streak_bonus
            });
            playChatSound('win');
          }
        }

        setTimeout(() => {
          if (!sessionStorage.getItem('pendingGameCode')) {
            setCurrentPage('home');
          }
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthSuccess('');
      setAuthError('Failed to activate account.');
    }
  };

  const handleForgotPassword = async (email: string) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.forgotPassword(email);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess(data.message);
        setForgotEmail(email);
        setTimeout(() => {
          setCurrentPage('reset-password');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  const handleResetPassword = async (code: string, newPassword: string) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await authService.resetPassword(forgotEmail, code, newPassword);
      const data = await res.json();
      if (res.ok) {
        setAuthError('');
        setAuthSuccess(data.message);
        setTimeout(() => {
          setCurrentPage('login');
          setAuthSuccess('');
        }, 2000);
      } else {
        setAuthSuccess('');
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthSuccess('');
      setAuthError('Connection error occurred.');
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleConfirm,
    handleForgotPassword,
    handleResetPassword,
  };
};
