import { useEffect, useRef } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import type { Comment } from '../lib/database.types';

interface DeletePostDialogProps {
  post: Comment;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeletePostDialog({ post, deleting, error, onCancel, onConfirm }: DeletePostDialogProps) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    cancelRef.current?.focus();

    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus();
      } else {
        document.getElementById('comments-view-heading')?.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-post-title"
      aria-describedby="delete-post-description"
      aria-busy={deleting}
      onCancel={(event) => {
        event.preventDefault();
        if (!deleting) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first) {
          event.preventDefault();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-xl bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/50"
    >
      <h2 id="delete-post-title" className="text-xl font-bold">
        {t('commentsView.deleteTitle', { id: String(post.id) })}
      </h2>
      {post.adset && <p className="mt-2 break-words text-sm text-gray-600">{post.adset}</p>}
      <p id="delete-post-description" className="mt-4 text-gray-700">
        {t('commentsView.deleteDescription')}
      </p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          ref={cancelRef}
          type="button"
          disabled={deleting}
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50"
        >
          {t('commentsView.deleteCancel')}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onConfirm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
        >
          {deleting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
          {t(deleting ? 'commentsView.deleting' : error ? 'commentsView.deleteRetry' : 'commentsView.deleteConfirm')}
        </button>
      </div>
    </dialog>
  );
}
