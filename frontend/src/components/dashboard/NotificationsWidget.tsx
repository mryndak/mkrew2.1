import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/store';
import {
  markAsRead,
  markAsReadOptimistic,
  rollbackMarkAsRead,
} from '@/lib/store/slices/notificationsSlice';
import { NotificationItem } from './NotificationItem';
import { Badge } from '@/components/ui/Badge';
import type { NotificationsWidgetProps } from '@/types/dashboard';

/**
 * NotificationsWidget - Widget powiadomień na Dashboard
 *
 * Features:
 * - Wyświetla ostatnie 5 powiadomień (najpierw nieprzeczytane)
 * - Badge z liczbą nieprzeczytanych
 * - EmptyState jeśli brak powiadomień
 * - Link "Zobacz wszystkie" do /dashboard/notifications
 * - Optimistic update przy oznaczaniu jako przeczytane
 * - Rollback jeśli API call failed
 *
 * @example
 * ```tsx
 * <NotificationsWidget
 *   notifications={[...]}
 *   unreadCount={3}
 * />
 * ```
 */
export function NotificationsWidget({
  notifications,
  unreadCount,
}: NotificationsWidgetProps) {
  const dispatch = useAppDispatch();

  /**
   * Handle notification read with optimistic update
   */
  const handleNotificationRead = useCallback(
    async (notificationId: number) => {
      // Optimistic update
      dispatch(markAsReadOptimistic(notificationId));

      try {
        // API call
        await dispatch(markAsRead(notificationId)).unwrap();
        // Success - optimistic update was correct
      } catch (error) {
        // Rollback optimistic update
        dispatch(rollbackMarkAsRead(notificationId));
        console.error('Failed to mark notification as read:', error);
      }
    },
    [dispatch]
  );

  // Sort notifications: unread first, then by createdAt desc
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.readAt === null && b.readAt !== null) return -1;
    if (a.readAt !== null && b.readAt === null) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6" data-test-id="notifications-widget">
      {/* Header */}
      <div className="flex items-center justify-between mb-4" data-test-id="notifications-widget-header">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          Powiadomienia
          {unreadCount > 0 && (
            <Badge variant="error" size="small" data-test-id="notifications-widget-badge">
              {unreadCount}
            </Badge>
          )}
        </h2>
        {notifications.length > 0 && (
          <a
            href="/dashboard/notifications"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            data-test-id="notifications-widget-view-all-link"
          >
            Zobacz wszystkie →
          </a>
        )}
      </div>

      {/* Content */}
      {sortedNotifications.length > 0 ? (
        <div className="space-y-3" data-test-id="notifications-widget-list">
          {sortedNotifications.slice(0, 5).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleNotificationRead}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-8" data-test-id="notifications-widget-empty-state">
          <div className="mb-4 text-gray-300">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak nowych powiadomień
          </h3>
          <p className="text-sm text-gray-600">
            Będziesz otrzymywać powiadomienia o krytycznych poziomach krwi w Twoich
            ulubionych centrach
          </p>
        </div>
      )}
    </section>
  );
}
