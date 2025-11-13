/**
 * NotificationIcon - Ikona reprezentująca typ powiadomienia
 *
 * Features:
 * - Mapowanie typów powiadomień na odpowiednie ikony
 * - Kolorowe tła dla różnych typów
 * - Accessibility (aria-hidden dla decorative icons)
 *
 * Mapowanie typów:
 * - CRITICAL_BLOOD_LEVEL → Alert icon (red/warning)
 * - DONATION_REMINDER → Calendar icon (blue/info)
 * - SYSTEM_ALERT → Info icon (yellow/warning)
 * - OTHER → Bell icon (gray/neutral)
 *
 * Props:
 * - type: string - typ powiadomienia z backendu
 *
 * @example
 * ```tsx
 * <NotificationIcon type="CRITICAL_BLOOD_LEVEL" />
 * ```
 */

import type { NotificationType } from '@/types/dashboard';

interface NotificationIconProps {
  type: string;
}

/**
 * Config dla ikon i kolorów
 */
const iconConfig: Record<
  NotificationType,
  {
    bgColor: string;
    iconColor: string;
    icon: React.ReactNode;
  }
> = {
  CRITICAL_BLOOD_LEVEL: {
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  DONATION_REMINDER: {
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  SYSTEM_ALERT: {
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  OTHER: {
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
};

export function NotificationIcon({ type }: NotificationIconProps) {
  // Normalizacja typu (fallback do OTHER jeśli nieznany)
  const normalizedType = (type in iconConfig ? type : 'OTHER') as NotificationType;
  const config = iconConfig[normalizedType];

  return (
    <div
      className={`
        w-12 h-12 rounded-full flex items-center justify-center
        ${config.bgColor} ${config.iconColor}
      `}
      aria-hidden="true"
    >
      {config.icon}
    </div>
  );
}
