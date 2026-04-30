import { useState, useEffect, useCallback } from 'react';
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { webhookUrls } from '../lib/webhooks';

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

const CONTENT_LANGUAGE_OPTIONS = [
  { value: 'Ingl\u00E9s', labelKey: 'generator.englishOption' },
  { value: 'Espa\u00F1ol', labelKey: 'generator.spanishOption' },
] as const;

export function CommentGeneratorForm({ onNavigateToComments }: CommentGeneratorFormProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
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

  const fetchAgents = useCallback(async () => {
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
      const errorMessage = err instanceof Error ? err.message : t('generator.loadingAgentsError');
      setAgentsError(errorMessage);
      console.error('Error fetching agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  }, [t]);

  const fetchMediaBuyers = useCallback(async () => {
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
      const errorMessage =
        err instanceof Error ? err.message : t('generator.loadingMediaBuyersError');
      setMediaBuyersError(errorMessage);
      console.error('Error fetching media buyers:', err);
    } finally {
      setLoadingMediaBuyers(false);
    }
  }, [t]);

  const fetchVerticals = useCallback(async () => {
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
      const errorMessage = err instanceof Error ? err.message : t('generator.loadingVerticalsError');
      setVerticalsError(errorMessage);
      console.error('Error fetching verticals:', err);
    } finally {
      setLoadingVerticals(false);
    }
  }, [t]);

  const fetchUserRole = useCallback(async () => {
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

      setUserRole(data?.role ?? null);
      console.log('User role loaded:', data?.role);
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAgents();
    fetchMediaBuyers();
    fetchVerticals();
    fetchUserRole();
  }, [fetchAgents, fetchMediaBuyers, fetchUserRole, fetchVerticals]);

  const validateUrls = (urlsText: string): { valid: boolean; error?: string } => {
    const urls = urlsText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      return { valid: false, error: t('generator.minOneUrl') };
    }

    const urlPattern = /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      if (!urlPattern.test(url)) {
        return {
          valid: false,
          error: t('generator.invalidUrlLine', { line: String(i + 1), url }),
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
        visibility,
        mediaType,
      };

      console.log('Sending payload:', payload);

      const response = await fetch(webhookUrls.createComments, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
      setCurrentAdset(formData.adset);

      if (code === '409') {
        console.log('Showing duplicate modal');
        setShowProcessingModal(false);
        setShowDuplicateModal(true);
      } else if (code === '201') {
        console.log('Keeping processing modal open');
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

      let errorMessage = t('generator.submitError');

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage += t('generator.submitNetworkError');
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += t('generator.submitRetry');
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#FFFFFF] rounded-xl shadow-sm border border-[#D4AE5D]/30 p-8">
        <h2 className="text-[2rem] font-bold text-accent-gram mb-2">{t('generator.title')}</h2>
        <p className="text-[#517267] mb-8">{t('generator.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="agentCS" className="block text-sm font-medium text-primary mb-2">
              {t('generator.agent')}
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
                  className="w-full px-4 py-2.5 border border-[#D4AE5D]/40 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-[#fffdf7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingAgents ? t('generator.loadingAgents') : t('generator.selectAgent')}
                  </option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.agent_name}>
                      {agent.agent_name}
                    </option>
                  ))}
                </select>
                {!loadingAgents && agents.length === 0 && !agentsError && (
                  <p className="text-xs text-accent mt-1">{t('generator.noAgents')}</p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="mediaBuyer" className="block text-sm font-medium text-primary mb-2">
              {t('generator.mediaBuyer')}
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
                  className="w-full px-4 py-2.5 border border-[#D4AE5D]/40 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-[#fffdf7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingMediaBuyers
                      ? t('generator.loadingMediaBuyers')
                      : t('generator.selectMediaBuyer')}
                  </option>
                  {mediaBuyers.map((buyer) => (
                    <option key={buyer.id} value={buyer.media_buyer_name}>
                      {buyer.media_buyer_name}
                    </option>
                  ))}
                </select>
                {!loadingMediaBuyers && mediaBuyers.length === 0 && !mediaBuyersError && (
                  <p className="text-xs text-accent mt-1">{t('generator.noMediaBuyers')}</p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="vertical" className="block text-sm font-medium text-primary mb-2">
              {t('generator.vertical')}
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
                  className="w-full px-4 py-2.5 border border-[#D4AE5D]/40 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-[#fffdf7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingVerticals
                      ? t('generator.loadingVerticals')
                      : t('generator.selectVertical')}
                  </option>
                  {verticals.map((vertical) => (
                    <option key={vertical.id} value={vertical.vertical_name}>
                      {vertical.vertical_name}
                    </option>
                  ))}
                </select>
                {!loadingVerticals && verticals.length === 0 && !verticalsError && (
                  <p className="text-xs text-accent mt-1">{t('generator.noVerticals')}</p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-primary mb-2">
              {t('generator.language')}
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-[#D4AE5D]/40 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-[#fffdf7]"
            >
              <option value="">{t('generator.selectLanguage')}</option>
              {CONTENT_LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="adset" className="block text-sm font-medium text-primary">
                {mediaType === 'video' ? t('generator.video') : t('generator.image')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all border-2 ${
                    mediaType === 'video'
                      ? 'bg-primary-soft text-primary border-primary/30 shadow-sm'
                      : 'bg-[#F8F4E7] text-[#294038] border-[#E6D5AC] hover:bg-[#E8D9B5] hover:border-[#D4AE5D]'
                  }`}
                >
                  {t('generator.video')}
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all border-2 ${
                    mediaType === 'image'
                      ? 'bg-primary-soft text-primary border-primary/30 shadow-sm'
                      : 'bg-[#F8F4E7] text-[#294038] border-[#E6D5AC] hover:bg-[#E8D9B5] hover:border-[#D4AE5D]'
                  }`}
                >
                  {t('generator.image')}
                </button>
              </div>
            </div>
            <input
              type="text"
              id="adset"
              value={formData.adset}
              onChange={(e) => setFormData({ ...formData, adset: e.target.value })}
              placeholder={
                mediaType === 'video'
                  ? t('generator.videoPlaceholder')
                  : t('generator.imagePlaceholder')
              }
              className="w-full px-4 py-2.5 border border-[#D4AE5D]/40 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="urls" className="block text-sm font-medium text-primary mb-2">
              {t('generator.urls')}
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
              placeholder={t('generator.urlsPlaceholder')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm ${
                urlError ? 'border-red-300 bg-red-50' : 'border-[#D4AE5D]/40'
              }`}
            />
            {urlError ? (
              <div className="flex items-start gap-2 text-red-600 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{urlError}</span>
              </div>
            ) : (
              <p className="text-xs text-[#517267] mt-1">{t('generator.urlsHelp')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('generator.submitting')}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('generator.submit')}
              </>
            )}
          </button>
        </form>
      </div>

      {showProcessingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#f8f4e7] rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#D4AE5D]/20 mb-4">
                <CheckCircle className="h-8 w-8 text-[#294038]" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                {t('generator.processingTitle')}
              </h3>
              <p className="text-[#517267] mb-6">{t('generator.processingDescription')}</p>
              <button
                onClick={() => setShowProcessingModal(false)}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                {t('generator.ready')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#f8f4e7] rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#D4AE5D]/20 mb-4">
                <AlertCircle className="h-8 w-8 text-[#294038]" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                {t('generator.duplicateTitle')}
              </h3>
              <p className="text-[#517267] mb-6">
                {t('generator.duplicateDescription', { currentAdset })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    onNavigateToComments(currentAdset);
                  }}
                  className="flex-1 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  {t('generator.viewComments')}
                </button>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="flex-1 bg-[#D9D9D9] text-[#294038] py-3 px-4 rounded-lg hover:bg-[#bfbfbf] transition-colors font-medium"
                >
                  {t('generator.exit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
