import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Shield, Upload } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { webhookUrls } from '../lib/webhooks';

interface AdminPanelProps {
  isAdmin: boolean;
}

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
};

export function AdminPanel({ isAdmin }: AdminPanelProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
          </div>
          <p className="text-sm text-red-600 mt-2">
            Esta seccion solo esta disponible para usuarios con rol admin.
          </p>
        </div>
      </div>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setStatus(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.txt')) {
      setFile(null);
      setStatus({
        type: 'error',
        message: 'El archivo debe tener extension .txt',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!file) {
      setStatus({
        type: 'error',
        message: 'Selecciona un archivo .txt antes de enviar.',
      });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setStatus({
        type: 'error',
        message: 'El archivo debe tener extension .txt',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id ?? '');

      const response = await fetch(webhookUrls.updateFacebookCookies, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      setStatus({
        type: 'success',
        message: 'Cookies enviadas correctamente. n8n procesara la actualizacion.',
      });
      setFile(null);
    } catch (error) {
      console.error('Error uploading Facebook cookies:', error);

      setStatus({
        type: 'error',
        message: 'No se pudo enviar el archivo. Verifica el endpoint e intenta nuevamente.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Panel de Administracion</h2>
        </div>
        <p className="text-gray-500 mb-8">
          Herramientas exclusivas para usuarios admin.
        </p>

        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Actualizar cookies de Facebook</h3>
          <p className="text-sm text-gray-600 mb-5">
            Sube un archivo <span className="font-medium">.txt</span> con las cookies para enviarlo al webhook de n8n.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="facebook-cookies-file" className="block text-sm font-medium text-gray-700 mb-2">
                Archivo de cookies (.txt)
              </label>
              <input
                id="facebook-cookies-file"
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {file && (
                <p className="text-xs text-gray-500 mt-2">
                  Archivo seleccionado: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            {status && (
              <div
                className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full sm:w-auto bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar archivo
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
