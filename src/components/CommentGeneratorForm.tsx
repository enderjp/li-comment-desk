import { useState, useEffect } from 'react';
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  agentCS: string;
  mediaBuyer: string;
  vertical: string;
  language: string;
  adset: string;
  urls: string;
}

interface Agent {
  id: string;
  agent_name: string;
}

interface MediaBuyer {
  id: string;
  media_buyer_name: string;
}

interface Vertical {
  id: string;
  vertical_name: string;
}

interface CommentGeneratorFormProps {
  onNavigateToComments: (adset: string) => void;
}

export function CommentGeneratorForm({ onNavigateToComments }: CommentGeneratorFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    agentCS: '',
    mediaBuyer: '',
    vertical: '',
    language: '',
    adset: '',
    urls: '',
  });
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [loading, setLoading] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [responseCode, setResponseCode] = useState<string | null>(null);
  const [currentAdset, setCurrentAdset] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [mediaBuyers, setMediaBuyers] = useState<MediaBuyer[]>([]);
  const [loadingMediaBuyers, setLoadingMediaBuyers] = useState(true);
  const [mediaBuyersError, setMediaBuyersError] = useState<string | null>(null);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loadingVerticals, setLoadingVerticals] = useState(true);
  const [verticalsError, setVerticalsError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchMediaBuyers();
    fetchVerticals();
    fetchUserRole();
  }, [user]);

  async function fetchAgents() {
    try {
      setLoadingAgents(true);
      setAgentsError(null);

      const { data, error } = await supabase
        .from('customer_service_agents')
        .select('id, agent_name')
        .order('agent_name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Agents loaded:', data);
      setAgents(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading agents';
      setAgentsError(errorMessage);
      console.error('Error fetching agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  }

  async function fetchMediaBuyers() {
    try {
      setLoadingMediaBuyers(true);
      setMediaBuyersError(null);

      const { data, error } = await supabase
        .from('media_buyer')
        .select('id, media_buyer_name')
        .order('media_buyer_name', { ascending: true });

      if (error) {
        console.error('Supabase error (media buyers):', error);
        throw error;
      }

      console.log('Media buyers loaded:', data);
      setMediaBuyers(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading media buyers';
      setMediaBuyersError(errorMessage);
      console.error('Error fetching media buyers:', err);
    } finally {
      setLoadingMediaBuyers(false);
    }
  }

  async function fetchVerticals() {
    try {
      setLoadingVerticals(true);
      setVerticalsError(null);

      const { data, error } = await supabase
        .from('vertical')
        .select('id, vertical_name')
        .order('vertical_name', { ascending: true });

      if (error) {
        console.error('Supabase error (verticals):', error);
        throw error;
      }

      console.log('Verticals loaded:', data);
      setVerticals(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading verticals';
      setVerticalsError(errorMessage);
      console.error('Error fetching verticals:', err);
    } finally {
      setLoadingVerticals(false);
    }
  }

  async function fetchUserRole() {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data?.role || null);
      console.log('User role loaded:', data?.role);
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  }

  const validateUrls = (urlsText: string): { valid: boolean; error?: string } => {
    const urls = urlsText.split('\n').map(url => url.trim()).filter(url => url.length > 0);

    if (urls.length === 0) {
      return { valid: false, error: 'Debe ingresar al menos una URL' };
    }

    const urlPattern = /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!urlPattern.test(url)) {
        return {
          valid: false,
          error: `URL inválida en la línea ${i + 1}: "${url}". Debe comenzar con http:// o https://`
        };
      }
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    const urlValidation = validateUrls(formData.urls);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error!);
      return;
    }

    setLoading(true);
    setShowProcessingModal(true);

    try {
      const visibility = userRole === 'admin' ? 'admin_only' : 'public';

      const payload = {
        userId: user?.id,
        agentCS: formData.agentCS,
        mediaBuyer: formData.mediaBuyer,
        vertical: formData.vertical,
        language: formData.language,
        adset: formData.adset,
        urls: formData.urls,
        visibility: visibility,
        mediaType: mediaType,
      };

      console.log('Sending payload:', payload);

      const response = await fetch('https://enderjp.app.n8n.cloud/webhook/urls-data', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Response from webhook:', result);

      const code = String(result.code || result.status);
      console.log('Code received:', code, 'Type:', typeof code);
      setResponseCode(code);
      setCurrentAdset(formData.adset);

      if (code === '409') {
        console.log('Showing duplicate modal');
        setShowProcessingModal(false);
        setShowDuplicateModal(true);
      } else if (code === '201') {
        console.log('Keeping processing modal open');
        // El modal de procesamiento ya está mostrándose
      }

      setFormData({
        agentCS: '',
        mediaBuyer: '',
        vertical: '',
        language: '',
        adset: '',
        urls: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setShowProcessingModal(false);
      setResponseCode(null);

      let errorMessage = 'Error al enviar el formulario. ';

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage += 'No se pudo conectar con el servidor. Verifica tu conexión a internet o que el webhook esté activo.';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Por favor, intenta de nuevo.';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generador de comentarios para Social Media posts
        </h2>
        <p className="text-gray-500 mb-8">
          Complete el formulario para generar comentarios personalizados
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="agentCS" className="block text-sm font-medium text-gray-700 mb-2">
              Agente CS
            </label>
            {agentsError ? (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{agentsError}</span>
              </div>
            ) : (
              <>
                <select
                  id="agentCS"
                  value={formData.agentCS}
                  onChange={(e) => setFormData({ ...formData, agentCS: e.target.value })}
                  required
                  disabled={loadingAgents}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingAgents ? 'Cargando agentes...' : 'Seleccionar agente...'}
                  </option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.agent_name}>
                      {agent.agent_name}
                    </option>
                  ))}
                </select>
                {!loadingAgents && agents.length === 0 && !agentsError && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay agentes disponibles en la base de datos
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="mediaBuyer" className="block text-sm font-medium text-gray-700 mb-2">
              Media Buyer
            </label>
            {mediaBuyersError ? (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{mediaBuyersError}</span>
              </div>
            ) : (
              <>
                <select
                  id="mediaBuyer"
                  value={formData.mediaBuyer}
                  onChange={(e) => setFormData({ ...formData, mediaBuyer: e.target.value })}
                  required
                  disabled={loadingMediaBuyers}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingMediaBuyers ? 'Cargando media buyers...' : 'Seleccionar media buyer...'}
                  </option>
                  {mediaBuyers.map((buyer) => (
                    <option key={buyer.id} value={buyer.media_buyer_name}>
                      {buyer.media_buyer_name}
                    </option>
                  ))}
                </select>
                {!loadingMediaBuyers && mediaBuyers.length === 0 && !mediaBuyersError && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay media buyers disponibles en la base de datos
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="vertical" className="block text-sm font-medium text-gray-700 mb-2">
              Vertical
            </label>
            {verticalsError ? (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{verticalsError}</span>
              </div>
            ) : (
              <>
                <select
                  id="vertical"
                  value={formData.vertical}
                  onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                  required
                  disabled={loadingVerticals}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingVerticals ? 'Cargando verticals...' : 'Seleccionar vertical...'}
                  </option>
                  {verticals.map((vertical) => (
                    <option key={vertical.id} value={vertical.vertical_name}>
                      {vertical.vertical_name}
                    </option>
                  ))}
                </select>
                {!loadingVerticals && verticals.length === 0 && !verticalsError && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay verticals disponibles en la base de datos
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Idioma
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Seleccionar idioma...</option>
              <option value="Inglés">Inglés</option>
              <option value="Español">Español</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="adset" className="block text-sm font-medium text-gray-700">
                {mediaType === 'video' ? 'Video' : 'Imagen'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all border-2 ${
                    mediaType === 'video'
                      ? 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all border-2 ${
                    mediaType === 'image'
                      ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  Imagen
                </button>
              </div>
            </div>
            <input
              type="text"
              id="adset"
              value={formData.adset}
              onChange={(e) => setFormData({ ...formData, adset: e.target.value })}
              placeholder={mediaType === 'video' ? 'Ingrese el nombre del video' : 'Ingrese el nombre del post/imagen'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
              URLs
            </label>
            <textarea
              id="urls"
              value={formData.urls}
              onChange={(e) => {
                setFormData({ ...formData, urls: e.target.value });
                setUrlError(null);
              }}
              required
              rows={6}
              placeholder="Pegue las URLs aquí, una por línea&#10;https://example.com/post1&#10;https://example.com/post2&#10;https://example.com/post3"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${
                urlError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {urlError ? (
              <div className="flex items-start gap-2 text-red-600 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{urlError}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Ingrese una URL por línea. Cada URL debe comenzar con http:// o https://
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando comentarios...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generar comentarios
              </>
            )}
          </button>
        </form>
      </div>

      {showProcessingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Procesando videos
              </h3>
              <p className="text-gray-600 mb-6">
                Los videos están siendo procesados, por favor espere unos minutos mientras se generan los comentarios
              </p>
              <button
                onClick={() => setShowProcessingModal(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Adset duplicado
              </h3>
              <p className="text-gray-600 mb-6">
                Este adset <span className="font-semibold">"{currentAdset}"</span> ya tiene comentarios generados en la base de datos.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    onNavigateToComments(currentAdset);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ver comentarios
                </button>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
