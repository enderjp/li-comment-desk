import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Comment, GeminiComment, GptComment, ClaudeComment } from '../lib/database.types';
import { MessageSquare, ExternalLink, Calendar, User, Tag, X, FileText, Search, Filter, Bot, Sparkles, ChevronDown, ChevronUp, Copy, Check, RefreshCw } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { useAuth } from '../contexts/useAuth';
import { webhookUrls } from '../lib/webhooks';

const PAGE_SIZE = 15;

interface CommentsViewProps {
  prefilterAdset?: string;
  selectedRequestId?: string;
  lightMode?: boolean;
  onClearPrefilter?: () => void;
}

export function CommentsView({ prefilterAdset = '', selectedRequestId = '', lightMode = false, onClearPrefilter }: CommentsViewProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [geminiComments, setGeminiComments] = useState<GeminiComment[]>([]);
  const [gptComments, setGptComments] = useState<GptComment[]>([]);
  const [claudeComments, setClaudeComments] = useState<ClaudeComment[]>([]);
  const [loadingAIComments, setLoadingAIComments] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingComments, setRegeneratingComments] = useState(false);
  const [regeneratingGptComments, setRegeneratingGptComments] = useState(false);
  const [regeneratingClaudeComments, setRegeneratingClaudeComments] = useState(false);
  const [regeneratingScript, setRegeneratingScript] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGptSuccessModal, setShowGptSuccessModal] = useState(false);
  const [showClaudeSuccessModal, setShowClaudeSuccessModal] = useState(false);
  const [showScriptSuccessModal, setShowScriptSuccessModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [agents, setAgents] = useState<string[]>([]);
  const [mediaBuyers, setMediaBuyers] = useState<string[]>([]);
  const [verticals, setVerticals] = useState<string[]>([]);

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedMediaBuyer, setSelectedMediaBuyer] = useState<string>('');
  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [adsetSearch, setAdsetSearch] = useState<string>('');
  const [urlSearch, setUrlSearch] = useState<string>('');
  const [postIdSearch, setPostIdSearch] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lightPage, setLightPage] = useState(1);
  const [pendingAgent, setPendingAgent] = useState<string>('');
  const [pendingMediaBuyer, setPendingMediaBuyer] = useState<string>('');
  const [pendingVertical, setPendingVertical] = useState<string>('');
  const [pendingStartDate, setPendingStartDate] = useState<string>('');
  const [pendingEndDate, setPendingEndDate] = useState<string>('');
  const [pendingAdsetSearch, setPendingAdsetSearch] = useState<string>('');
  const [pendingUrlSearch, setPendingUrlSearch] = useState<string>('');
  const [pendingPostIdSearch, setPendingPostIdSearch] = useState<string>('');
  const prevLightMode = useRef(lightMode);

  useEffect(() => {
    if (prevLightMode.current !== lightMode) {
      prevLightMode.current = lightMode;
      setPendingAgent(selectedAgent);
      setPendingMediaBuyer(selectedMediaBuyer);
      setPendingVertical(selectedVertical);
      setPendingStartDate(startDate);
      setPendingEndDate(endDate);
      setPendingAdsetSearch(adsetSearch);
      setPendingUrlSearch(urlSearch);
      setPendingPostIdSearch(postIdSearch);
      setLightPage(1);
    }
  }, [adsetSearch, endDate, lightMode, postIdSearch, selectedAgent, selectedMediaBuyer, selectedVertical, startDate, urlSearch]);

  useEffect(() => {
    if (prefilterAdset) {
      setAdsetSearch(prefilterAdset);
      if (lightMode) setPendingAdsetSearch(prefilterAdset);
    }
  }, [lightMode, prefilterAdset]);

  useEffect(() => {
    console.log('🔄 useEffect ejecutándose - selectedRequestId:', selectedRequestId, 'comments.length:', comments.length, 'loading:', loading);
    console.log('🔍 selectedComment actual:', selectedComment ? `Post #${selectedComment.request_id}` : 'null');

    // Only try to find and open the comment when:
    // 1. We have a selectedRequestId
    // 2. We have loaded comments (not loading and comments exist)
    // 3. We don't already have a selected comment open
    if (selectedRequestId && !loading && comments.length > 0 && !selectedComment) {
      console.log('🔍 Buscando comentario con request_id:', selectedRequestId);
      console.log('📊 Total de comentarios disponibles:', comments.length);
      console.log('📋 Request IDs disponibles:', comments.map(c => c.request_id).join(', '));

      // selectedRequestId is the request_id from comments table (as a string)
      // Find the comment that matches this request_id
      const comment = comments.find(c => c.request_id.toString() === selectedRequestId);

      if (comment) {
        console.log('✅ Comentario encontrado:', comment);
        console.log('📂 Estableciendo selectedComment para abrir modal...');
        setSelectedComment(comment);
        fetchAIComments(comment.request_id);
        console.log('✅ Modal debería abrirse ahora');
      } else {
        console.warn('❌ No se encontró ningún comentario con request_id:', selectedRequestId);
        console.log('🔍 Intentando búsqueda menos estricta...');
        // Try to find by number comparison
        const commentByNumber = comments.find(c => c.request_id === Number(selectedRequestId));
        if (commentByNumber) {
          console.log('✅ Encontrado con conversión numérica:', commentByNumber);
          setSelectedComment(commentByNumber);
          fetchAIComments(commentByNumber.request_id);
        } else {
          console.error('❌ No se encontró el comentario de ninguna forma');
        }
      }
    } else {
      console.log('⏭️ Saltando búsqueda de comentario. Razones:', {
        'Tiene selectedRequestId': !!selectedRequestId,
        'No está loading': !loading,
        'Tiene comentarios': comments.length > 0,
        'No tiene selectedComment': !selectedComment
      });
    }
  }, [selectedRequestId, comments, loading, selectedComment]);

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
      console.log('User role loaded in CommentsView:', data?.role);
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  }, [user?.id]);

  const fetchComments = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      console.log('📥 Cargando comentarios con userRole:', userRole);

      let query = supabase
        .from('comments')
        .select('*');

      if (userRole === 'agent') {
        console.log('⚠️ Usuario es agent - filtrando solo comentarios públicos');
        query = query.eq('visibility', 'public');
      }

      const { data, error: fetchError } = (await query.order('created_at', { ascending: false })) as {
        data: Comment[] | null;
        error: Error | null;
      };

      if (fetchError) throw fetchError;

      console.log('📊 Comentarios cargados:', data?.length || 0);
      console.log('📋 Request IDs cargados:', data?.map(c => c.request_id).join(', '));

      setComments((data ?? []) as Comment[]);
      extractFilterOptions((data ?? []) as Comment[]);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los comentarios');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    if (userRole !== null) {
      fetchComments();

      const channel = supabase
        .channel('comments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
          },
          () => {
            fetchComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchComments, userRole]);

  const extractFilterOptions = (data: Comment[]) => {
    const uniqueAgents = [...new Set(data.map(c => c.agente_customer_service).filter(Boolean))] as string[];
    const uniqueMediaBuyers = [...new Set(data.map(c => c.media_buyer).filter(Boolean))] as string[];
    const uniqueVerticals = [...new Set(data.map(c => c.vertical).filter(Boolean))] as string[];

    setAgents(uniqueAgents.sort());
    setMediaBuyers(uniqueMediaBuyers.sort());
    setVerticals(uniqueVerticals.sort());
  };

  const runFilter = useCallback((
    data: Comment[],
    agent: string, mediaBuyer: string, vertical: string, mediaType: string,
    sDate: string, eDate: string,
    adset: string, url: string, postId: string
  ) => {
    let filtered = [...data];
    if (agent) filtered = filtered.filter(c => c.agente_customer_service === agent);
    if (mediaBuyer) filtered = filtered.filter(c => c.media_buyer === mediaBuyer);
    if (vertical) filtered = filtered.filter(c => c.vertical === vertical);
    if (mediaType !== 'all') filtered = filtered.filter(c => c.media_type === mediaType);
    if (sDate) {
      const start = new Date(sDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(c => new Date(c.created_at) >= start);
    }
    if (eDate) {
      const end = new Date(eDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => new Date(c.created_at) <= end);
    }
    if (adset) filtered = filtered.filter(c => c.adset?.toLowerCase().includes(adset.toLowerCase()));
    if (url) filtered = filtered.filter(c => c.url?.toLowerCase().includes(url.toLowerCase()));
    if (postId) filtered = filtered.filter(c => c.id.toString().includes(postId));
    return filtered;
  }, []);

  const applyFilters = useCallback(() => {
    const filtered = runFilter(
      comments,
      selectedAgent, selectedMediaBuyer, selectedVertical, selectedMediaType,
      startDate, endDate,
      adsetSearch, urlSearch, postIdSearch
    );
    setFilteredComments(filtered);
  }, [adsetSearch, comments, endDate, postIdSearch, runFilter, selectedAgent, selectedMediaBuyer, selectedMediaType, selectedVertical, startDate, urlSearch]);

  useEffect(() => {
    if (!lightMode) {
      applyFilters();
      setCurrentPage(1);
    }
  }, [applyFilters, lightMode, selectedMediaType]);

  useEffect(() => {
    if (!lightMode) return;
    const filtered = runFilter(
      comments,
      pendingAgent, pendingMediaBuyer, pendingVertical, selectedMediaType,
      pendingStartDate, pendingEndDate,
      pendingAdsetSearch, pendingUrlSearch, pendingPostIdSearch
    );
    setFilteredComments(filtered);
    setLightPage(1);
    setCurrentPage(1);
  }, [comments, lightMode, pendingAdsetSearch, pendingAgent, pendingEndDate, pendingMediaBuyer, selectedMediaType, pendingPostIdSearch, pendingStartDate, pendingUrlSearch, pendingVertical, runFilter]);

  const clearFilters = () => {
    setSelectedAgent('');
    setSelectedMediaBuyer('');
    setSelectedVertical('');
    setStartDate('');
    setEndDate('');
    setAdsetSearch('');
    setUrlSearch('');
    setPostIdSearch('');
    setPendingAgent('');
    setPendingMediaBuyer('');
    setPendingVertical('');
    setPendingStartDate('');
    setPendingEndDate('');
    setPendingAdsetSearch('');
    setPendingUrlSearch('');
    setPendingPostIdSearch('');
    setLightPage(1);
    setCurrentPage(1);
    if (lightMode) setFilteredComments(comments);
    if (onClearPrefilter) {
      onClearPrefilter();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchAIComments = async (requestId: number) => {
    setLoadingAIComments(true);
    try {
      const [geminiResponse, gptResponse, claudeResponse] = await Promise.all([
        supabase
          .from('gemini_comments')
          .select('*')
          .eq('comment_request_id', requestId)
          .order('created_at', { ascending: false }),
        supabase
          .from('gpt_comments')
          .select('*')
          .eq('comment_request_id', requestId)
          .order('created_at', { ascending: false }),
        supabase
          .from('claude_comments')
          .select('*')
          .eq('comment_request_id', requestId)
          .order('created_at', { ascending: false }),
      ]);

      if (geminiResponse.error) throw geminiResponse.error;
      if (gptResponse.error) throw gptResponse.error;
      if (claudeResponse.error) throw claudeResponse.error;

      setGeminiComments((geminiResponse.data ?? []) as GeminiComment[]);
      setGptComments((gptResponse.data ?? []) as GptComment[]);
      setClaudeComments((claudeResponse.data ?? []) as ClaudeComment[]);
    } catch (err) {
      console.error('Error fetching AI comments:', err);
    } finally {
      setLoadingAIComments(false);
    }
  };

  const handleCommentClick = (comment: Comment) => {
    setSelectedComment(comment);
    fetchAIComments(comment.request_id);
  };

  const handleCloseModal = () => {
    setSelectedComment(null);
    setGeminiComments([]);
    setGptComments([]);
    setClaudeComments([]);
    setScriptExpanded(false);
    setCommentsExpanded(false);
    setCopiedId(null);
    // Clear the selectedRequestId filter when closing modal
    if (onClearPrefilter) {
      onClearPrefilter();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleRegenerateComments = async () => {
    if (!selectedComment || regeneratingComments) return;

    setRegeneratingComments(true);

    try {
      const geminiCommentIds = geminiComments.map(comment => comment.id);

      const payload = {
        ids: geminiCommentIds,
        script: selectedComment.script || '',
        Language: selectedComment.language || '',
        PostId: selectedComment.id,
        UserId: user?.id || '',
        vertical: selectedComment.vertical || ''
      };

      const response = await fetch(webhookUrls.regenerateGemini, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error regenerating comments:', err);
      alert('Error al generar nuevos comentarios. Por favor, intente nuevamente.');
      setRegeneratingComments(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setRegeneratingComments(false);
    handleCloseModal();
  };

  const handleRegenerateGptComments = async () => {
    if (!selectedComment || regeneratingGptComments) return;

    setRegeneratingGptComments(true);

    try {
      const gptCommentIds = gptComments.map(comment => comment.id);

      const payload = {
        ids: gptCommentIds,
        script: selectedComment.script || '',
        Language: selectedComment.language || '',
        PostId: selectedComment.id,
        UserId: user?.id || '',
        vertical: selectedComment.vertical || ''
      };

      const response = await fetch(webhookUrls.regenerateGpt, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      setShowGptSuccessModal(true);
    } catch (err) {
      console.error('Error regenerating GPT comments:', err);
      alert('Error al generar nuevos comentarios de GPT. Por favor, intente nuevamente.');
      setRegeneratingGptComments(false);
    }
  };

  const handleGptSuccessModalClose = () => {
    setShowGptSuccessModal(false);
    setRegeneratingGptComments(false);
    handleCloseModal();
  };

  const handleRegenerateClaudeComments = async () => {
    if (!selectedComment || regeneratingClaudeComments) return;

    setRegeneratingClaudeComments(true);

    try {
      const claudeCommentIds = claudeComments.map(comment => comment.id);

      const payload = {
        ids: claudeCommentIds,
        script: selectedComment.script || '',
        Language: selectedComment.language || '',
        PostId: selectedComment.id,
        UserId: user?.id || '',
        vertical: selectedComment.vertical || ''
      };

      const response = await fetch(webhookUrls.regenerateClaude, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      setShowClaudeSuccessModal(true);
    } catch (err) {
      console.error('Error regenerating Claude comments:', err);
      alert('Error al generar nuevos comentarios de Claude. Por favor, intente nuevamente.');
      setRegeneratingClaudeComments(false);
    }
  };

  const handleClaudeSuccessModalClose = () => {
    setShowClaudeSuccessModal(false);
    setRegeneratingClaudeComments(false);
    handleCloseModal();
  };

  const handleRegenerateScript = async () => {
    if (!selectedComment || regeneratingScript) return;

    setRegeneratingScript(true);

    try {
      const payload = {
        agentCS: selectedComment.agente_customer_service || '',
        mediaBuyer: selectedComment.media_buyer || '',
        vertical: selectedComment.vertical || '',
        url: selectedComment.url || '',
        language: selectedComment.language || '',
        adset: selectedComment.adset || '',
        userId: user?.id || '',
        visibility: selectedComment.visibility || 'private',
        PostId: selectedComment.id,
        mediaType: selectedComment.media_type || 'video'
      };

      const response = await fetch(webhookUrls.regenerateScript, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      setShowScriptSuccessModal(true);
    } catch (err) {
      console.error('Error regenerating script:', err);
      alert('Error al regenerar el script. Por favor, intente nuevamente.');
      setRegeneratingScript(false);
    }
  };

  const handleScriptSuccessModalClose = () => {
    setShowScriptSuccessModal(false);
    setRegeneratingScript(false);
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchComments(true)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = selectedAgent || selectedMediaBuyer || selectedVertical || startDate || endDate || adsetSearch || urlSearch || postIdSearch;
  const totalPages = Math.ceil(filteredComments.length / PAGE_SIZE);
  const activePage = lightMode ? lightPage : currentPage;
  const pagedComments = filteredComments.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  if (comments.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay comentarios todavía
          </h3>
          <p className="text-gray-500">
            Los comentarios generados aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Comentarios Generados</h2>
        <p className="text-gray-600">
          {hasActiveFilters
            ? `${filteredComments.length} de ${comments.length} comentarios`
            : `Total: ${comments.length} comentarios`
          }
          {totalPages > 1 && ` — Página ${activePage} de ${totalPages}`}
        </p>
      </div>

      <div className={`bg-white rounded-xl shadow-sm border p-6 mb-8 ${lightMode ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className={`w-5 h-5 ${lightMode ? 'text-amber-600' : 'text-gray-600'}`} />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          {lightMode && (
            <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
              Modo Ligero — filtros en tiempo real
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agente CS
            </label>
            <select
              value={lightMode ? pendingAgent : selectedAgent}
              onChange={(e) => lightMode ? setPendingAgent(e.target.value) : setSelectedAgent(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Todos los agentes</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Buyer
            </label>
            <select
              value={lightMode ? pendingMediaBuyer : selectedMediaBuyer}
              onChange={(e) => lightMode ? setPendingMediaBuyer(e.target.value) : setSelectedMediaBuyer(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Todos los media buyers</option>
              {mediaBuyers.map((buyer) => (
                <option key={buyer} value={buyer}>
                  {buyer}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vertical
            </label>
            <select
              value={lightMode ? pendingVertical : selectedVertical}
              onChange={(e) => lightMode ? setPendingVertical(e.target.value) : setSelectedVertical(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Todas las verticales</option>
              {verticals.map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Post
            </label>
            <select
              value={selectedMediaType}
              onChange={(e) => setSelectedMediaType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Todos los post</option>
              <option value="image">Imagen</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de fechas
            </label>
            <DateRangePicker
              startDate={lightMode ? pendingStartDate : startDate}
              endDate={lightMode ? pendingEndDate : endDate}
              onStartDateChange={lightMode ? setPendingStartDate : setStartDate}
              onEndDateChange={lightMode ? setPendingEndDate : setEndDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por Video
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={lightMode ? pendingAdsetSearch : adsetSearch}
                onChange={(e) => lightMode ? setPendingAdsetSearch(e.target.value) : setAdsetSearch(e.target.value)}
                placeholder="Buscar video..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por URL
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={lightMode ? pendingUrlSearch : urlSearch}
                onChange={(e) => lightMode ? setPendingUrlSearch(e.target.value) : setUrlSearch(e.target.value)}
                placeholder="Buscar URL..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por Número de Post
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={lightMode ? pendingPostIdSearch : postIdSearch}
                onChange={(e) => lightMode ? setPendingPostIdSearch(e.target.value) : setPostIdSearch(e.target.value)}
                placeholder="Buscar post #..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          {(hasActiveFilters || (lightMode && (pendingAgent || pendingMediaBuyer || pendingVertical || pendingStartDate || pendingEndDate || pendingAdsetSearch || pendingUrlSearch || pendingPostIdSearch))) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-500 mb-4">
            No hay comentarios que coincidan con los filtros seleccionados
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className={`grid gap-${lightMode ? '3' : '6'} ${lightMode ? 'md:grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {pagedComments.map((comment) => (
              <div
                key={comment.id}
                onClick={() => handleCommentClick(comment)}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer transition-shadow hover:shadow-md ${lightMode ? 'p-4' : 'p-6'}`}
              >
                <div className={`flex items-center justify-between ${lightMode ? 'mb-2' : 'mb-4'}`}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Post #{comment.id}</span>
                  </div>
                  {lightMode && (
                    <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString('es-ES')}</span>
                  )}
                </div>

                {!lightMode ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {comment.agente_customer_service && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Agente:</span>
                          <span className="font-medium text-gray-900">{comment.agente_customer_service}</span>
                        </div>
                      )}

                      {comment.media_buyer && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Media Buyer:</span>
                          <span className="font-medium text-gray-900">{comment.media_buyer}</span>
                        </div>
                      )}

                      {comment.vertical && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Vertical:</span>
                          <span className="font-medium text-gray-900">{comment.vertical}</span>
                        </div>
                      )}

                      {comment.language && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Idioma:</span>
                          <span className="font-medium text-gray-900">{comment.language}</span>
                        </div>
                      )}

                      {comment.adset && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Video:</span>
                          <span className="font-medium text-gray-900 truncate">{comment.adset}</span>
                        </div>
                      )}

                      {comment.url && (
                        <div className="flex items-start gap-2 text-sm">
                          <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5" />
                          <a
                            href={comment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 hover:underline break-all line-clamp-1"
                          >
                            {comment.url}
                          </a>
                        </div>
                      )}
                    </div>

                    {comment.thumbnail_urls && (
                      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-48">
                        <img
                          src={Array.isArray(comment.thumbnail_urls) ? comment.thumbnail_urls[0] : comment.thumbnail_urls}
                          alt="Thumbnail"
                          className="max-w-full max-h-48 object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {comment.agente_customer_service && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{comment.agente_customer_service}</span>
                      </div>
                    )}

                    {comment.media_buyer && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{comment.media_buyer}</span>
                      </div>
                    )}

                    {comment.vertical && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{comment.vertical}</span>
                      </div>
                    )}

                    {comment.adset && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{comment.adset}</span>
                      </div>
                    )}
                  </div>
                )}

                {!lightMode && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 mt-4 border-t border-gray-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={activePage === 1}
                onClick={() => lightMode ? setLightPage(p => p - 1) : setCurrentPage(p => p - 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - activePage) <= 2)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => lightMode ? setLightPage(item as number) : setCurrentPage(item as number)}
                      className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                        activePage === item
                          ? 'bg-gray-900 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )
              }

              <button
                disabled={activePage === totalPages}
                onClick={() => lightMode ? setLightPage(p => p + 1) : setCurrentPage(p => p + 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Detalles del Post #{selectedComment.request_id}</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Tag className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Vertical</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedComment.vertical || 'No vertical'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(selectedComment.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Media Buyer
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {selectedComment.media_buyer || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Customer Service Agent
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {selectedComment.agente_customer_service || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedComment.language && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Idioma
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {selectedComment.language}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedComment.adset && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-2">
                            Video
                          </p>
                          <p className="text-base font-medium text-gray-900">
                            {selectedComment.adset}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedComment.url && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-2">
                            URL
                          </p>
                          <a
                            href={selectedComment.url.startsWith('http') ? selectedComment.url : `https://${selectedComment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-blue-600 hover:text-blue-800 hover:underline break-all"
                          >
                            {selectedComment.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedComment.thumbnail_urls && (
                  <div className="flex-shrink-0 hidden md:block">
                    <img
                      src={Array.isArray(selectedComment.thumbnail_urls) ? selectedComment.thumbnail_urls[0] : selectedComment.thumbnail_urls}
                      alt="Video Thumbnail"
                      className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Script
                      </p>
                      {selectedComment.script_updated_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Actualizado: {formatDate(selectedComment.script_updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerateScript}
                      disabled={regeneratingScript}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Re-generar script"
                    >
                      <RefreshCw className={`w-4 h-4 ${regeneratingScript ? 'animate-spin' : ''}`} />
                      Re-generar
                    </button>
                    {selectedComment.script && (
                      <>
                        <button
                          onClick={() => copyToClipboard(selectedComment.script!, 'script')}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                          title="Copiar script"
                        >
                          {copiedId === 'script' ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setScriptExpanded(!scriptExpanded)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          {scriptExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Colapsar
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Expandir
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {selectedComment.script ? (
                  <div className="relative">
                    <div className={`${scriptExpanded ? 'max-h-96' : 'max-h-32'} overflow-y-auto transition-all duration-300`}>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pr-2">
                        {selectedComment.script}
                      </p>
                    </div>
                    {!scriptExpanded && selectedComment.script.length > 200 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No hay script todavía</p>
                  </div>
                )}
              </div>

              {selectedComment.Comentarios && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-amber-700 flex-shrink-0" />
                      <p className="text-xs font-medium text-amber-900 uppercase tracking-wide">
                        Comentarios Generados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedComment.Comentarios!, 'comentarios')}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-200 rounded-md transition-colors"
                        title="Copiar comentarios"
                      >
                        {copiedId === 'comentarios' ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setCommentsExpanded(!commentsExpanded)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-200 rounded-md transition-colors"
                      >
                        {commentsExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Colapsar
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Expandir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className={`${commentsExpanded ? 'max-h-96' : 'max-h-32'} overflow-y-auto transition-all duration-300`}>
                      <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap pr-2">
                        {selectedComment.Comentarios}
                      </p>
                    </div>
                    {!commentsExpanded && selectedComment.Comentarios.length > 200 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-100 to-transparent pointer-events-none"></div>
                    )}
                  </div>
                </div>
              )}

              {loadingAIComments && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-3">Cargando comentarios AI...</p>
                </div>
              )}

              {!loadingAIComments && (geminiComments.length > 0 || gptComments.length > 0 || claudeComments.length > 0) && (
                <div className="space-y-6">
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Comentarios Generados por IA
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-green-600" />
                            Gemini Comments ({geminiComments.length})
                          </h4>
                          {geminiComments.length > 0 && (
                            <button
                              onClick={() => {
                                const allComments = geminiComments
                                  .map(c => c.comment_content || '')
                                  .join('\n\n');
                                copyToClipboard(allComments, 'all-gemini');
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 hover:text-green-900 hover:bg-green-100 rounded-md transition-colors"
                              title="Copiar todos los comentarios de Gemini"
                            >
                              {copiedId === 'all-gemini' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar todos
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {geminiComments.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                              No hay comentarios de Gemini
                            </div>
                          ) : (
                            geminiComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-medium text-green-800">
                                    #{comment.id}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => copyToClipboard(comment.comment_content || '', `gemini-${comment.id}`)}
                                      className="p-1 hover:bg-green-200 rounded transition-colors"
                                      title="Copiar comentario"
                                    >
                                      {copiedId === `gemini-${comment.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-700" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-green-600" />
                                      )}
                                    </button>
                                    <span className="text-xs text-green-600">
                                      {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {comment.comment_content || 'Sin comentario'}
                                </p>
                              </div>
                            ))
                          )}
                          <button
                            onClick={handleRegenerateComments}
                            disabled={regeneratingComments}
                            className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="w-4 h-4" />
                            {regeneratingComments ? 'Generando...' : 'Generar nuevos comentarios'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-purple-600" />
                            GPT Comments ({gptComments.length})
                          </h4>
                          {gptComments.length > 0 && (
                            <button
                              onClick={() => {
                                const allComments = gptComments
                                  .map(c => c.comment_content || '')
                                  .join('\n\n');
                                copyToClipboard(allComments, 'all-gpt');
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded-md transition-colors"
                              title="Copiar todos los comentarios de GPT"
                            >
                              {copiedId === 'all-gpt' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar todos
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {gptComments.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                              No hay comentarios de GPT
                            </div>
                          ) : (
                            gptComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-medium text-purple-800">
                                    #{comment.id}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => copyToClipboard(comment.comment_content || '', `gpt-${comment.id}`)}
                                      className="p-1 hover:bg-purple-200 rounded transition-colors"
                                      title="Copiar comentario"
                                    >
                                      {copiedId === `gpt-${comment.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-purple-700" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-purple-600" />
                                      )}
                                    </button>
                                    <span className="text-xs text-purple-600">
                                      {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {comment.comment_content || 'Sin comentario'}
                                </p>
                              </div>
                            ))
                          )}
                          <button
                            onClick={handleRegenerateGptComments}
                            disabled={regeneratingGptComments}
                            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="w-4 h-4" />
                            {regeneratingGptComments ? 'Generando...' : 'Generar nuevos comentarios'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-orange-600" />
                            Claude Comments ({claudeComments.length})
                          </h4>
                          {claudeComments.length > 0 && (
                            <button
                              onClick={() => {
                                const allComments = claudeComments
                                  .map(c => c.comment_content || '')
                                  .join('\n\n');
                                copyToClipboard(allComments, 'all-claude');
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 hover:text-orange-900 hover:bg-orange-100 rounded-md transition-colors"
                              title="Copiar todos los comentarios de Claude"
                            >
                              {copiedId === 'all-claude' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar todos
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {claudeComments.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                              No hay comentarios de Claude
                            </div>
                          ) : (
                            claudeComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-medium text-orange-800">
                                    #{comment.id}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => copyToClipboard(comment.comment_content || '', `claude-${comment.id}`)}
                                      className="p-1 hover:bg-orange-200 rounded transition-colors"
                                      title="Copiar comentario"
                                    >
                                      {copiedId === `claude-${comment.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-orange-700" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-orange-600" />
                                      )}
                                    </button>
                                    <span className="text-xs text-orange-600">
                                      {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {comment.comment_content || 'Sin comentario'}
                                </p>
                              </div>
                            ))
                          )}
                          <button
                            onClick={handleRegenerateClaudeComments}
                            disabled={regeneratingClaudeComments}
                            className="w-full mt-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white py-2.5 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="w-4 h-4" />
                            {regeneratingClaudeComments ? 'Generando...' : 'Generar nuevos comentarios'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <button
                onClick={handleCloseModal}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Check className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Solicitud Enviada!
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Se están generando nuevos comentarios de Gemini para este script. Por favor, espere unos minutos y vuelva a consultar.
              </p>

              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showGptSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Check className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Solicitud Enviada!
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Se están generando nuevos comentarios de GPT para este script. Por favor, espere unos minutos y vuelva a consultar.
              </p>

              <button
                onClick={handleGptSuccessModalClose}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showClaudeSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Check className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Solicitud Enviada!
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Se están generando nuevos comentarios de Claude para este script. Por favor, espere unos minutos y vuelva a consultar.
              </p>

              <button
                onClick={handleClaudeSuccessModalClose}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showScriptSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Check className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Solicitud Enviada!
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Se está regenerando el script para este post. Por favor, espere unos minutos y vuelva a consultar.
              </p>

              <button
                onClick={handleScriptSuccessModalClose}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

