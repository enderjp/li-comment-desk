import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Shield, Upload } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { webhookUrls } from '../lib/webhooks';
import { supabase } from '../lib/supabase';

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
  const [errors, setErrors] = useState<any[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const fetchErrors = async () => {
    setLoadingErrors(true);
    try {
      const { data, error } = await supabase
        .from('errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching errors:', error);
        setErrors([]);
        return;
      }

      setErrors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Unexpected error fetching errors:', err);
      setErrors([]);
    } finally {
      setLoadingErrors(false);
    }
  };

  const markProcessed = async (id: string) => {
    try {
      const { error } = await supabase.from('errors').update({ processed: true }).eq('id', id);
      if (error) throw error;
      await fetchErrors();
    } catch (err) {
      console.error('Error marking processed:', err);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

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
          Herramientas para administradores.
        </p>

        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Actualizar cookies de Facebook</h3>
          <p className="text-sm text-gray-600 mb-5">
            Sube un archivo <span className="font-medium">.txt</span> con las cookies actualizadas
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
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
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

        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Url no procesados</h3>
          <p className="text-sm text-gray-600 mb-4">Lista de URLs pendientes de ser procesadas.</p>

          <div className="space-y-2">
            {loadingErrors ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : errors.length === 0 ? (
              <p className="text-sm text-gray-500">No hay URLs pendientes.</p>
            ) : (
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="px-2 py-1">Fecha</th>
                      <th className="px-2 py-1">Agente de CS</th>
                      <th className="px-2 py-1">URL</th>
                      <th className="px-2 py-1">Adset</th>
                      <th className="px-2 py-1">Procesada</th>
                      <th className="px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {errors.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="px-2 py-2">{e.created_at ? new Date(e.created_at).toLocaleString() : '-'}</td>
                        <td className="px-2 py-2">{e.agente_customer_service ?? '-'}</td>
                        <td className="px-2 py-2 max-w-[30%] truncate">{e.url ?? '-'}</td>
                        <td className="px-2 py-2">{e.adset ?? '-'}</td>
                        <td className="px-2 py-2">{e.processed ? 'Sí' : 'No'}</td>
                        <td className="px-2 py-2">
                          {!e.processed && (
                            <button
                              onClick={() => markProcessed(e.id)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Marcar procesada
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={fetchErrors}
                disabled={loadingErrors}
                className="px-3 py-1.5 rounded-md bg-primary text-white disabled:opacity-60"
              >
                {loadingErrors ? 'Cargando...' : 'Refrescar'}
              </button>
              <button
                type="button"
                onClick={() => setErrors([])}
                className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
