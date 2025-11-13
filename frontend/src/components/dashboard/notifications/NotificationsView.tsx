import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast, Toaster } from 'sonner';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from '@/lib/api/endpoints/notifications';
import type {
  InAppNotificationsResponse,
  InAppNotificationDto,
} from '@/types/dashboard';
import { NotificationTabs } from './NotificationTabs';
import { NotificationList } from './NotificationList';
import { LoadMoreButton } from './LoadMoreButton';
import { MarkAllAsReadButton } from './MarkAllAsReadButton';
import { EmptyState } from './EmptyState';

/**
 * TabType - typ taba (wszystkie lub nieprzeczytane)
 */
type TabType = 'all' | 'unread';

/**
 * NotificationsView - Główny widok powiadomień in-app
 *
 * Features:
 * - Automatyczne pobieranie listy powiadomień z API
 * - Przełączanie między tabami "Wszystkie" i "Nieprzeczytane"
 * - Oznaczanie powiadomień jako przeczytane (pojedynczo i masowo)
 * - Paginacja (Load More)
 * - Optimistic updates dla lepszego UX
 * - Grupowanie powiadomień po dniach
 * - Empty state dla pustych list
 * - Loading skeleton
 * - Error handling z toast notifications
 * - Responsywny design
 *
 * Data Flow:
 * - Mount → fetchNotifications() z API
 * - Tab change → refetch z filtrem unreadOnly
 * - Mark as read → optimistic update + API call + rollback on error
 * - Load more → append kolejne strony
 *
 * @example
 * ```tsx
 * <NotificationsView />
 * ```
 */
export function NotificationsView() {
  // State
  const [notifications, setNotifications] = useState<InAppNotificationDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(
    async (page: number = 0, append: boolean = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response: InAppNotificationsResponse = await getUserNotifications({
          unreadOnly: activeTab === 'unread',
          page,
          size: 20,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...response.notifications]);
        } else {
          setNotifications(response.notifications);
        }

        setCurrentPage(response.page);
        setTotalElements(response.totalElements);
        setUnreadCount(response.unreadCount);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Nie udało się pobrać powiadomień');
        toast.error('Nie udało się pobrać powiadomień');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeTab]
  );

  /**
   * Fetch unread count (for badge update)
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationsCount();
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  /**
   * Mark notification as read
   * Uses optimistic update for better UX
   */
  const handleMarkAsRead = useCallback(
    async (notificationId: number) => {
      // Find notification
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification || notification.readAt !== null) {
        return; // Already read or not found
      }

      // Optimistic update
      const previousNotifications = [...notifications];
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId
          ? { ...n, readAt: new Date().toISOString() }
          : n
      );
      setNotifications(updatedNotifications);
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markNotificationAsRead(notificationId);

        // Refresh unread count to be sure
        await fetchUnreadCount();

        toast.success('Powiadomienie oznaczone jako przeczytane');
      } catch (err) {
        console.error('Failed to mark as read:', err);

        // Rollback on error
        setNotifications(previousNotifications);
        setUnreadCount((prev) => prev + 1);

        toast.error('Nie udało się oznaczyć powiadomienia');
      }
    },
    [notifications, fetchUnreadCount]
  );

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => n.readAt === null);

    if (unreadNotifications.length === 0) {
      toast.info('Wszystkie powiadomienia są już przeczytane');
      return;
    }

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    const updatedNotifications = notifications.map((n) =>
      n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n
    );
    setNotifications(updatedNotifications);
    setUnreadCount(0);

    try {
      const result = await markAllNotificationsAsRead();

      // Refresh to be sure
      await fetchUnreadCount();

      toast.success(`${result.markedCount} powiadomień oznaczonych jako przeczytane`);
    } catch (err) {
      console.error('Failed to mark all as read:', err);

      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);

      toast.error('Nie udało się oznaczyć wszystkich powiadomień');
    }
  }, [notifications, unreadCount, fetchUnreadCount]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (tab === activeTab) return;

      setActiveTab(tab);
      setCurrentPage(0);
      setNotifications([]);
    },
    [activeTab]
  );

  /**
   * Handle load more (pagination)
   */
  const handleLoadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    await fetchNotifications(nextPage, true);
  }, [currentPage, fetchNotifications]);

  /**
   * Initial fetch on mount or tab change
   */
  useEffect(() => {
    fetchNotifications(0, false);
  }, [fetchNotifications]);

  /**
   * Filter notifications by active tab (client-side)
   * This is for display purposes - API already filters
   */
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => n.readAt === null);
    }
    return notifications;
  }, [notifications, activeTab]);

  /**
   * Check if there are more pages to load
   */
  const hasMore = useMemo(() => {
    const pageSize = 20;
    const totalPages = Math.ceil(totalElements / pageSize);
    return currentPage < totalPages - 1;
  }, [currentPage, totalElements]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Powiadomienia</h1>
        <p className="mt-2 text-gray-600">
          Przeglądaj alerty o krytycznych stanach krwi i inne powiadomienia
        </p>
      </div>

      {/* Tabs */}
      <NotificationTabs
        activeTab={activeTab}
        unreadCount={unreadCount}
        onTabChange={handleTabChange}
      />

      {/* Mark all as read button (only show if there are unread notifications) */}
      {unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <MarkAllAsReadButton
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && notifications.length === 0 ? (
        <NotificationsLoadingSkeleton />
      ) : null}

      {/* Error state */}
      {error && notifications.length === 0 ? (
        <NotificationsErrorState message={error} onRetry={() => fetchNotifications(0, false)} />
      ) : null}

      {/* Empty state */}
      {!isLoading && filteredNotifications.length === 0 ? (
        <EmptyState
          message={
            activeTab === 'unread'
              ? 'Wszystkie powiadomienia przeczytane'
              : 'Brak powiadomień'
          }
          description={
            activeTab === 'unread'
              ? 'Nie masz żadnych nieprzeczytanych powiadomień'
              : 'Nie masz jeszcze żadnych powiadomień. Gdy pojawią się nowe alerty, zobaczysz je tutaj.'
          }
        />
      ) : null}

      {/* Notifications list */}
      {filteredNotifications.length > 0 ? (
        <>
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
          />

          {/* Load more button */}
          {hasMore && (
            <div className="mt-6">
              <LoadMoreButton
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

/**
 * Loading skeleton for notifications
 */
function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Ładowanie powiadomień">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow p-6 animate-pulse"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error state component
 */
function NotificationsErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Błąd</h3>
        <p className="text-gray-600">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
