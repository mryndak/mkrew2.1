/**
 * NotificationTimestamp - Wyświetla timestamp powiadomienia w formacie względnym
 *
 * Features:
 * - Format względny (np. "5 minut temu", "2 godziny temu")
 * - Tooltip z pełną datą przy hover
 * - Semantic HTML (<time> element)
 * - Accessibility (datetime attribute)
 *
 * Props:
 * - timestamp: string - ISO 8601 timestamp
 *
 * @example
 * ```tsx
 * <NotificationTimestamp timestamp="2025-01-08T12:30:00Z" />
 * ```
 */

import { formatRelativeTime, formatFullDateTime } from '@/lib/utils/dateUtils';

interface NotificationTimestampProps {
  timestamp: string;
}

export function NotificationTimestamp({ timestamp }: NotificationTimestampProps) {
  const relativeTime = formatRelativeTime(timestamp);
  const fullDateTime = formatFullDateTime(timestamp);

  return (
    <time
      className="text-xs text-gray-500"
      dateTime={timestamp}
      title={fullDateTime}
    >
      {relativeTime}
    </time>
  );
}
