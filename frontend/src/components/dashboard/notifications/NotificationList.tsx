/**
 * NotificationList - Komponent renderujący listę powiadomień z grupowaniem po dniach
 *
 * Features:
 * - Grupowanie powiadomień po dniach (Dzisiaj, Wczoraj, data)
 * - Renderowanie NotificationGroup dla każdego dnia
 * - Loading state
 * - Delegowanie akcji (mark as read) do parent
 *
 * Props:
 * - notifications: InAppNotificationDto[] - lista powiadomień
 * - onMarkAsRead: (notificationId: number) => Promise<void> - callback oznaczania jako przeczytane
 * - isLoading: boolean - stan ładowania
 *
 * @example
 * ```tsx
 * <NotificationList
 *   notifications={notifications}
 *   onMarkAsRead={handleMarkAsRead}
 *   isLoading={false}
 * />
 * ```
 */

import { useMemo } from 'react';
import type { InAppNotificationDto } from '@/types/dashboard';
import { NotificationGroup } from './NotificationGroup';

interface NotificationListProps {
  notifications: InAppNotificationDto[];
  onMarkAsRead: (notificationId: number) => Promise<void>;
  isLoading: boolean;
}

/**
 * Grupowane powiadomienia po dniach
 */
interface GroupedNotifications {
  date: string; // YYYY-MM-DD
  label: string; // "Dzisiaj", "Wczoraj", "5 stycznia 2025"
  notifications: InAppNotificationDto[];
}

/**
 * Helper: Grupuje powiadomienia po dniach
 */
function groupNotificationsByDate(
  notifications: InAppNotificationDto[]
): GroupedNotifications[] {
  // Najpierw grupuj po dacie (YYYY-MM-DD)
  const grouped = notifications.reduce((acc, notification) => {
    const date = new Date(notification.createdAt);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(notification);
    return acc;
  }, {} as Record<string, InAppNotificationDto[]>);

  // Konwertuj do tablicy z labelkami
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  return Object.entries(grouped)
    .map(([dateKey, notifs]) => {
      let label: string;

      if (dateKey === todayKey) {
        label = 'Dzisiaj';
      } else if (dateKey === yesterdayKey) {
        label = 'Wczoraj';
      } else {
        // Format: "5 stycznia 2025"
        const date = new Date(dateKey);
        label = date.toLocaleDateString('pl-PL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      return {
        date: dateKey,
        label,
        notifications: notifs,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Sortuj od najnowszych
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  isLoading,
}: NotificationListProps) {
  // Grupowanie powiadomień po dniach
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications]
  );

  if (isLoading && notifications.length === 0) {
    return null; // Loading skeleton is handled in parent (NotificationsView)
  }

  return (
    <div className="space-y-6" role="list" aria-label="Lista powiadomień" data-test-id="notification-list">
      {groupedNotifications.map((group) => (
        <NotificationGroup
          key={group.date}
          date={group.date}
          label={group.label}
          notifications={group.notifications}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}
