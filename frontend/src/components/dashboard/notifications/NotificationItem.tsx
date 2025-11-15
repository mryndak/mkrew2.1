/**
 * NotificationItem - Pojedyncze powiadomienie na liście
 *
 * Features:
 * - Wyświetlanie ikony typu powiadomienia (NotificationIcon)
 * - Tytuł i treść powiadomienia
 * - Timestamp (relative time format)
 * - Przycisk "Oznacz jako przeczytane" (jeśli nieprzeczytane)
 * - Link do akcji (jeśli linkUrl)
 * - Wizualne wyróżnienie nieprzeczytanych (bold, colored background)
 * - Hover states
 * - Accessibility (semantic HTML, ARIA labels)
 *
 * Props:
 * - notification: InAppNotificationDto - dane powiadomienia
 * - onMarkAsRead: (notificationId: number) => Promise<void> - callback oznaczania jako przeczytane
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   notification={notification}
 *   onMarkAsRead={handleMarkAsRead}
 * />
 * ```
 */

import { useState } from 'react';
import type { InAppNotificationDto } from '@/types/dashboard';
import { NotificationIcon } from './NotificationIcon';
import { NotificationTimestamp } from './NotificationTimestamp';
import { MarkAsReadButton } from './MarkAsReadButton';
import { isNotificationExpired } from '@/lib/utils/dateUtils';

interface NotificationItemProps {
  notification: InAppNotificationDto;
  onMarkAsRead: (notificationId: number) => Promise<void>;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const isUnread = notification.readAt === null;
  const isExpired = isNotificationExpired(notification.expiresAt);
  const hasLink = notification.linkUrl !== null;

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = async () => {
    if (isMarkingAsRead || !isUnread) return;

    setIsMarkingAsRead(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  /**
   * Handle click on notification (navigate to linkUrl)
   */
  const handleNotificationClick = () => {
    if (hasLink && notification.linkUrl) {
      // Mark as read automatically when clicking
      if (isUnread) {
        handleMarkAsRead();
      }
      // Navigate to link
      window.location.href = notification.linkUrl;
    }
  };

  return (
    <div
      className={`
        notification-item
        bg-white rounded-lg shadow-sm border transition-all duration-200
        ${isUnread ? 'border-l-4 border-l-red-500 bg-red-50/30' : 'border-gray-200'}
        ${hasLink ? 'cursor-pointer hover:shadow-md' : ''}
        ${isExpired ? 'opacity-60' : ''}
      `}
      role="listitem"
      aria-label={`Powiadomienie: ${notification.title}`}
      onClick={hasLink ? handleNotificationClick : undefined}
      data-test-id="notification-item"
      data-notification-id={notification.id}
      data-notification-read={!isUnread}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <NotificationIcon type={notification.type} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className={`
                text-base mb-1
                ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}
              `}
              data-test-id="notification-title"
            >
              {notification.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap" data-test-id="notification-message">
              {notification.message}
            </p>

            {/* RCKiK info (if available) */}
            {notification.rckik && (
              <div className="flex items-center gap-2 mb-2" data-test-id="notification-rckik-info">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-500">
                  {notification.rckik.name}
                </span>
              </div>
            )}

            {/* Footer: Timestamp + Actions */}
            <div className="flex items-center justify-between mt-3">
              {/* Timestamp */}
              <NotificationTimestamp timestamp={notification.createdAt} />

              {/* Mark as read button (only if unread) */}
              {isUnread && (
                <MarkAsReadButton
                  notificationId={notification.id}
                  isRead={false}
                  onMarkAsRead={handleMarkAsRead}
                  isLoading={isMarkingAsRead}
                />
              )}

              {/* Read indicator (if read) */}
              {!isUnread && (
                <div className="flex items-center gap-1 text-xs text-gray-400" data-test-id="notification-read-indicator">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Przeczytane</span>
                </div>
              )}
            </div>

            {/* Expired indicator */}
            {isExpired && (
              <div className="mt-2 text-xs text-gray-400 italic" data-test-id="notification-expired-indicator">
                Powiadomienie wygasło
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
