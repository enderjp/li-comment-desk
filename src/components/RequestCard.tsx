import { ExternalLink, User, MessageSquare, Tag, FileText, Calendar } from 'lucide-react';
import type { Comment } from '../lib/database.types';

interface RequestCardProps {
  comment: Comment;
  onClick?: () => void;
}

export function RequestCard({ comment, onClick }: RequestCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-gray-500">
            {comment.vertical || 'No vertical'}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Media Buyer</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {comment.media_buyer || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Customer Service Agent</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {comment.agente_customer_service || 'N/A'}
            </p>
          </div>
        </div>

        {comment.url && (
          <div className="flex items-start gap-3">
            <ExternalLink className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">URL</p>
              <a
                href={comment.url.startsWith('http') ? comment.url : `https://${comment.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-primary hover:text-primary-hover hover:underline truncate block"
              >
                {comment.url}
              </a>
            </div>
          </div>
        )}

        {comment.script && (
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Script</p>
              <p className="text-sm text-gray-700 line-clamp-3">
                {comment.script}
              </p>
            </div>
          </div>
        )}

        {comment.Comentarios && (
          <div className="flex items-start gap-3 bg-accent-soft -mx-6 -mb-6 mt-4 p-4 rounded-b-lg border-t border-accent-soft-border">
            <MessageSquare className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 mb-1">Comentarios</p>
              <p className="text-sm text-gray-900">
                {comment.Comentarios}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
