import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../lib/database.types';
import { RequestCard } from './RequestCard';
import { Loader2, AlertCircle, X, ExternalLink, User, MessageSquare, Tag, FileText, Calendar } from 'lucide-react';

export function RequestList() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading comments');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No comments found. Add some data to your Supabase comments table to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comments.map((comment) => (
          <RequestCard
            key={comment.id}
            comment={comment}
            onClick={() => setSelectedComment(comment)}
          />
        ))}
      </div>

      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Detalles del Comentario</h2>
              <button
                onClick={() => setSelectedComment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {selectedComment.script && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Script
                      </p>
                      <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedComment.script}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedComment.Comentarios && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-amber-700 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-900 uppercase tracking-wide mb-3">
                        Comentarios Generados
                      </p>
                      <p className="text-base text-amber-900 leading-relaxed whitespace-pre-wrap">
                        {selectedComment.Comentarios}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <button
                onClick={() => setSelectedComment(null)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
