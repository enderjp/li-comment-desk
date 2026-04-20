import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, MessageSquare, Eye, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { Notification } from '../lib/database.types';

interface NotificationBellProps {
  onNavigateToRequest?: (requestId: string) => void;
}

export function NotificationBell({ onNavigateToRequest }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = (await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })) as {
        data: Notification[] | null;
        error: Error | null;
      };

      if (error) throw error;

      const notificationsData = data ?? [];
      const validNotifications: Notification[] = [];

      for (const notif of notificationsData) {
        let commentExists = true;

        if (notif.request_id) {
          const { data: comment } = await supabase
            .from('comments')
            .select('id')
            .eq('request_id', notif.request_id)
            .maybeSingle();

          commentExists = !!comment;
        } else if (notif.adset?.includes('POST_ID:')) {
          const match = notif.adset.match(/POST_ID:(\d+)/);
          if (match) {
            const postId = parseInt(match[1], 10);
            const { data: comment } = await supabase
              .from('comments')
              .select('id')
              .eq('id', postId)
              .maybeSingle();

            commentExists = !!comment;
          }
        }

        if (commentExists) {
          validNotifications.push(notif);
        } else {
          console.log(`🗑️ Eliminando notificación huérfana: ${notif.id}`);
          await supabase
            .from('notifications')
            .delete()
            .eq('id', notif.id);
        }
      }

      setNotifications(validNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const notificationIds = notifications.map(n => n.id);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) throw error;

      setNotifications([]);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Marcando...' : 'Marcar todas como leídas'}
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tienes notificaciones nuevas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {notification.title === 'Script actualizado' ? (
                              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : notification.title === 'Comentarios actualizados' ? (
                              <RefreshCw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mb-3">
                            {new Date(notification.created_at).toLocaleString('es-ES', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {(notification.request_id || notification.adset?.includes('POST_ID:')) && onNavigateToRequest && (
                            <button
                              onClick={async () => {
                                let requestId: string | null = null;

                                if (notification.request_id) {
                                  requestId = notification.request_id.toString();
                                } else if (notification.adset?.includes('POST_ID:')) {
                                  const match = notification.adset.match(/POST_ID:(\d+)/);
                                  if (match) {
                                    const postId = parseInt(match[1], 10);
                                    const { data: comment } = (await supabase
                                      .from('comments')
                                      .select('request_id')
                                      .eq('id', postId)
                                      .maybeSingle()) as {
                                      data: { request_id: number } | null;
                                    };

                                    if (comment) {
                                      requestId = comment.request_id.toString();
                                    }
                                  }
                                }

                                if (requestId) {
                                  console.log('🔔 Navegando a request_id:', requestId);
                                  onNavigateToRequest(requestId);
                                  setShowPanel(false);
                                } else {
                                  console.error('❌ No se pudo obtener el request_id');
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver post
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors flex-shrink-0"
                          title="Marcar como leída"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
