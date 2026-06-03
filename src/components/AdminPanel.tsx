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

interface ErrorRow {
  id: string | number;
  request_id?: number | null;
  created_at?: string | null;
  media_buyer?: string | null;
  agente_customer_service?: string | null;
  vertical?: string | null;
  url?: string | null;
  script?: string | null;
  Comentarios?: string | null;
  adset?: string | null;
  language?: string | null;
  script_updated_at?: string | null;
  thumbnail_urls?: string[] | string | null;
  visibility?: string | null;
  media_type?: string | null;
  [key: string]: unknown;
}

export function AdminPanel({ isAdmin }: AdminPanelProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [errorsLoadError, setErrorsLoadError] = useState<string | null>(null);
  const [selectedErrorIds, setSelectedErrorIds] = useState<Array<string | number>>([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessStatus, setReprocessStatus] = useState<StatusMessage | null>(null);

  const fetchErrors = async () => {
    setLoadingErrors(true);
    setErrorsLoadError(null);
    try {
      const { data, error } = await supabase
        .from('request_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching request_errors:', error);
        setErrorsLoadError(error.message || 'No se pudieron cargar los errores.');
        setErrors([]);
        setSelectedErrorIds([]);
        return;
      }

      const safeRows = Array.isArray(data) ? (data as ErrorRow[]) : [];
      setErrors(safeRows);
      setSelectedErrorIds((previous) => {
        const validIds = new Set(safeRows.map((row) => row.id));
        return previous.filter((id) => validIds.has(id));
      });
    } catch (err) {
      console.error('Unexpected error fetching request_errors:', err);
      setErrorsLoadError(
        err instanceof Error ? err.message : 'No se pudieron cargar los errores.',
      );
      setErrors([]);
      setSelectedErrorIds([]);
    } finally {
      setLoadingErrors(false);
    }
  };

  const sendReprocessRequest = async (row: ErrorRow) => {
    const payload = {
      ...row,
      errorId: String(row.id),
    };

    const response = await fetch(webhookUrls.reprocessErrors, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
  };

  const handleReprocessRows = async (rows: ErrorRow[]) => {
    if (rows.length === 0 || isReprocessing) return;

    setReprocessStatus(null);
    setIsReprocessing(true);

    let successCount = 0;
    let failureCount = 0;
    const failedIds: Array<string | number> = [];

    for (const row of rows) {
      try {
        await sendReprocessRequest(row);
        successCount += 1;
      } catch (err) {
        console.error('Error reprocessing row:', row.id, err);
        failureCount += 1;
        failedIds.push(row.id);
      }
    }

    setSelectedErrorIds(failedIds);

    const total = rows.length;
    if (failureCount === 0) {
      setReprocessStatus({
        type: 'success',
        message: `Reproceso completado: ${successCount}/${total} enviados correctamente.`,
      });
    } else {
      setReprocessStatus({
        type: 'error',
        message: `Reproceso finalizado: ${successCount} exitosos, ${failureCount} fallidos.`,
      });
    }

    try {
      await fetchErrors();
    } catch (err) {
      console.error('Error refreshing request_errors after reprocess:', err);
    } finally {
      setIsReprocessing(false);
    }
  };

  const toggleErrorSelection = (id: string | number) => {
    setSelectedErrorIds((previous) =>
      previous.includes(id) ? previous.filter((currentId) => currentId !== id) : [...previous, id],
    );
  };

  const allVisibleSelected = errors.length > 0 && selectedErrorIds.length === errors.length;

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedErrorIds([]);
      return;
    }

    setSelectedErrorIds(errors.map((row) => row.id));
  };

  const handleReprocessSelected = async () => {
    const selectedRows = errors.filter((row) => selectedErrorIds.includes(row.id));
    await handleReprocessRows(selectedRows);
  };

  const handleReprocessAll = async () => {
    await handleReprocessRows(errors);
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
    <div className="max-w-6xl mx-auto">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Requests fallidos</h3>
          <p className="text-sm text-gray-600 mb-4">Lista de requests pendientes de ser re-procesadas.</p>

          {reprocessStatus && (
            <div
              className={`mb-4 flex items-start gap-2 text-sm px-4 py-3 rounded-lg ${
                reprocessStatus.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {reprocessStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{reprocessStatus.message}</span>
            </div>
          )}

          <div className="space-y-2">
            {loadingErrors ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : errorsLoadError ? (
              <div className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Error al cargar tabla request_errors: {errorsLoadError}</span>
              </div>
            ) : errors.length === 0 ? (
              <p className="text-sm text-gray-500">No hay URLs pendientes.</p>
            ) : (
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          disabled={isReprocessing}
                          aria-label="Seleccionar todos"
                        />
                      </th>
                      <th className="px-2 py-1">Fecha</th>
                      <th className="px-2 py-1">Agente de CS</th>
                      <th className="px-2 py-1">URL</th>
                      <th className="px-2 py-1">Adset</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {errors.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="px-2 py-2 align-top">
                          <input
                            type="checkbox"
                            checked={selectedErrorIds.includes(e.id)}
                            onChange={() => toggleErrorSelection(e.id)}
                            disabled={isReprocessing}
                            aria-label={`Seleccionar error ${e.id}`}
                          />
                        </td>
                        <td className="px-2 py-2">{e.created_at ? new Date(e.created_at).toLocaleString() : '-'}</td>
                        <td className="px-2 py-2">{e.agente_customer_service ?? '-'}</td>
                        <td className="px-2 py-2 max-w-[30%] truncate">{e.url ?? '-'}</td>
                        <td className="px-2 py-2">{e.adset ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={handleReprocessSelected}
                disabled={loadingErrors || isReprocessing || selectedErrorIds.length === 0}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-60"
              >
                {isReprocessing
                  ? 'Reprocesando...'
                  : `Reprocesar seleccionadas (${selectedErrorIds.length})`}
              </button>
              <button
                type="button"
                onClick={handleReprocessAll}
                disabled={loadingErrors || isReprocessing || errors.length === 0}
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-60"
              >
                {isReprocessing ? 'Reprocesando...' : `Reprocesar todas (${errors.length})`}
              </button>
              <button
                type="button"
                onClick={fetchErrors}
                disabled={loadingErrors || isReprocessing}
                className="px-3 py-1.5 rounded-md bg-primary text-white disabled:opacity-60"
              >
                {loadingErrors ? 'Cargando...' : 'Refrescar'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedErrorIds([])}
                disabled={isReprocessing || selectedErrorIds.length === 0}
                className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700"
              >
                Limpiar seleccion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
