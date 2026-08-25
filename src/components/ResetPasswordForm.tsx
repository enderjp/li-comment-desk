import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, LogIn } from 'lucide-react';
import logoLi from '../assets/logoli1.png';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { LanguageToggle } from './LanguageToggle';

export function ResetPasswordForm() {
  const { user, loading: authLoading, updatePassword, signOut } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const goToLogin = async () => {
    if (user) {
      await signOut();
    }
    window.history.replaceState({}, '', '/');
    window.location.assign('/');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('login.passwordsDoNotMatch'));
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AE5D]" />
      </div>
    );
  }

  if (!user && !success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#262626] rounded-xl shadow-lg p-8 border border-gray-400 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">{t('login.invalidResetLinkTitle')}</h1>
          <p className="text-gray-300 mb-6">{t('login.invalidResetLinkDescription')}</p>
          <button
            type="button"
            onClick={() => void goToLogin()}
            className="w-full bg-primary text-white py-3 px-4 rounded-sm hover:bg-primary-hover transition-colors font-medium"
          >
            {t('login.backToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#262626] rounded-xl shadow-lg p-8 border border-gray-400 text-center">
          <CheckCircle className="h-12 w-12 text-[#D4AE5D] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">{t('login.passwordUpdatedTitle')}</h1>
          <p className="text-gray-300 mb-6">{t('login.passwordUpdatedDescription')}</p>
          <button
            type="button"
            onClick={() => void goToLogin()}
            className="w-full bg-primary text-white py-3 px-4 rounded-sm hover:bg-primary-hover transition-colors font-medium flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            {t('login.backToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="relative max-w-md w-full bg-[#262626] rounded-xl shadow-lg p-8 border border-gray-400">
        <div className="absolute right-4 top-4">
          <LanguageToggle compact />
        </div>
        <img src={logoLi} alt="Leads Icon Logo" className="w-28 h-auto mx-auto mb-6 object-contain" />
        <h1 className="text-3xl font-bold text-center text-[#D4AE5D] mb-2">
          {t('login.resetPasswordTitle')}
        </h1>
        <p className="text-center text-gray-300 mb-8">{t('login.resetPasswordDescription')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-100 mb-1">
              {t('login.newPassword')}
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-100 mb-1">
              {t('login.confirmPassword')}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-bold font-['Gram'] uppercase border border-gray-500 bg-primary text-white text-2xl py-1.5 px-4 rounded-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? t('login.pleaseWait') : t('login.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
