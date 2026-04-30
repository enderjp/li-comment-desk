import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import logoLi from '../assets/logoli1.png';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { LanguageToggle } from './LanguageToggle';

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailSent, setShowEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        setShowEmailSent(true);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black from-primary-soft to-slate-100 flex items-center justify-center px-4">
      <div className="relative max-w-md w-full bg-[#262626] rounded-xl shadow-lg p-8 border border-gray-400">
        <div className="absolute right-4 top-4">
          <LanguageToggle compact />
        </div>

        <div className="flex items-center justify-center mb-8">
          <img
            src={logoLi}
            alt="Leads Icon Logo"
            className="w-28 h-auto mb-4 object-contain hover:scale-105 transition-transform"
          />
        </div>

        <h1 className="text-3xl font-bold text-center text-[#D4AE5D] mb-2">
          {t('common.appName')}
        </h1>
        <p className="text-center text-gray-300 mb-8">
          {isSignUp ? t('login.subtitleSignUp') : t('login.subtitleSignIn')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-100 mb-1">
                {t('login.fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('login.fullNamePlaceholder')}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-1">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('login.emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-100 mb-1">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold font-['Gram'] uppercase border border-gray-500 bg-primary text-white text-2xl py-1.5 px-4 rounded-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('login.pleaseWait')}
              </>
            ) : isSignUp ? (
              t('login.signUp')
            ) : (
              t('login.signIn')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setShowEmailSent(false);
            }}
            className="text-sm text-[#D4AE5D] hover:text-[#F2D39A]"
          >
            {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
          </button>
        </div>
      </div>

      {showEmailSent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-soft mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('login.verifyTitle')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('login.verifyDescription', { email })}
              </p>
              <button
                onClick={() => {
                  setShowEmailSent(false);
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setIsSignUp(false);
                }}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                {t('login.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
