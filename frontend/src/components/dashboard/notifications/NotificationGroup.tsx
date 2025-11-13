/**
 * NotificationGroup - Grupa powiadomień z tego samego dnia
 *
 * Features:
 * - Nagłówek z datą (np. "Dzisiaj", "Wczoraj", "5 stycznia 2025")
 * - Lista powiadomień z danego dnia
 * - Delegowanie akcji do NotificationItem
 *
 * Props:
 * - date: string - data w formacie YYYY-MM-DD
 * - label: string - label do wyświetlenia (np. "Dzisiaj")
 * - notifications: InAppNotificationDto[] - powiadomienia z tego dnia
 * - onMarkAsRead: (notificationId: number) => Promise<void> - callback oznaczania jako przeczytane
 *
 * @example
 * ```tsx
 * <NotificationGroup
 *   date="2025-01-08"
 *   label="Dzisiaj"
 *   notifications={[...]}
 *   onMarkAsRead={handleMarkAsRead}
 * />
 * ```
 */

import type { InAppNotificationDto } from '@/types/dashboard';
import { NotificationItem } from './NotificationItem';

interface NotificationGroupProps {
  date: string;
  label: string;
  notifications: InAppNotificationDto[];
  onMarkAsRead: (notificationId: number) => Promise<void>;
}

export function NotificationGroup({
  date,
  label,
  notifications,
  onMarkAsRead,
}: NotificationGroupProps) {
  return (
    <div className="notification-group" role="group" aria-labelledby={`group-header-${date}`}>
      {/* Group header - Data */}
      <div
        id={`group-header-${date}`}
        className="mb-3 px-2"
      >
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </h2>
      </div>

      {/* Group items - Lista powiadomień */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
}
