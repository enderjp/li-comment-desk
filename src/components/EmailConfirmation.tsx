import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2, LogIn } from 'lucide-react';

export function EmailConfirmation() {
  const { user, loading, signOut } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVerifying(false);
      if (!user && !loading) {
        setError(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading]);

  const handleGoToLogin = async () => {
    // Sign out the auto-logged session and redirect to login
    await signOut();
    // Clear the hash from URL
    window.history.replaceState({}, '', window.location.pathname);
    window.location.href = '/';
  };

  if (verifying || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando tu correo...
            </h3>
            <p className="text-gray-600">
              Por favor espera mientras confirmamos tu cuenta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error de verificación
            </h3>
            <p className="text-gray-600 mb-6">
              Hubo un problema al verificar tu correo. El enlace puede haber expirado o ya fue utilizado.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Cuenta confirmada exitosamente
          </h3>
          <p className="text-gray-600 mb-6">
            Tu correo ha sido verificado correctamente. Ya puedes iniciar sesión en la plataforma.
          </p>
          <button
            onClick={handleGoToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Ir al Login
          </button>
        </div>
      </div>
    </div>
  );
}
