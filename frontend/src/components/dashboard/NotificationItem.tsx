import { memo } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { NotificationItemProps } from '@/types/dashboard';

/**
 * NotificationItem - Pojedyncze powiadomienie Dashboard
 *
 * Features:
 * - Tytuł i treść powiadomienia (skrócona do 100 znaków)
 * - Timestamp (relatywny czas: "2 godziny temu")
 * - Badge "Nowe" jeśli nieprzeczytane
 * - Ikona według typu powiadomienia
 * - Klikalne jeśli ma linkUrl
 * - onClick handler → markAsRead + navigate
 * - Hover state
 * - Memoized dla optymalizacji performance (porównanie po notification.id i readAt)
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   notification={notificationData}
 *   onRead={(id) => console.log('Mark as read:', id)}
 * />
 * ```
 */
function NotificationItemComponent({ notification, onRead }: NotificationItemProps) {
  const { id, type, title, message, linkUrl, readAt, createdAt } = notification;

  const isUnread = !readAt;
  const isClickable = !!linkUrl;

  const handleClick = () => {
    if (!linkUrl) return;

    // Mark as read (optimistic update)
    if (isUnread) {
      onRead(id);
    }

    // Navigate to link
    window.location.href = linkUrl;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  // Truncate message to 100 characters
  const truncatedMessage =
    message.length > 100 ? `${message.substring(0, 100)}...` : message;

  // Format relative time
  const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Teraz';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minutę' : 'minut'} temu`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? 'godzinę' : diffHours < 5 ? 'godziny' : 'godzin'} temu`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} temu`;

    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
    });
  };

  // Icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'CRITICAL_BLOOD_LEVEL':
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'DONATION_REMINDER':
        return (
          <svg
            className="w-5 h-5 text-blue-600"
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
        );
      case 'SYSTEM_ALERT':
        return (
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
    }
  };

  const itemClasses = [
    'flex items-start gap-3 p-4 rounded-lg border transition-all duration-200',
    isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200',
    isClickable
      ? 'cursor-pointer hover:border-primary-300 hover:shadow-sm'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-testid="notification-item"
      className={itemClasses}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable
          ? `${title}. ${truncatedMessage}. Kliknij aby otworzyć.`
          : `${title}. ${truncatedMessage}`
      }
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className={`text-sm font-semibold ${
              isUnread ? 'text-gray-900' : 'text-gray-700'
            }`}
          >
            {title}
          </h4>
          {isUnread && <Badge variant="info" size="small">Nowe</Badge>}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-2">{truncatedMessage}</p>

        {/* Footer with timestamp and RCKiK name */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatRelativeTime(createdAt)}</span>
          {notification.rckik && (
            <>
              <span>•</span>
              <span className="font-medium">{notification.rckik.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator for clickable notifications */}
      {isClickable && (
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Memoized NotificationItem
 * Re-render only if notification.id or notification.readAt changes
 */
export const NotificationItem = memo(
  NotificationItemComponent,
  (prevProps, nextProps) =>
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.readAt === nextProps.notification.readAt
);
