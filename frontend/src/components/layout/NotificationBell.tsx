/**
 * NotificationBell - Badge z licznikiem nieprzeczytanych powiadomień w navbar
 *
 * Features:
 * - Ikona dzwonka z badge pokazującym liczbę nieprzeczytanych
 * - Link do /dashboard/notifications
 * - Badge ukryty gdy unreadCount === 0
 * - Animacja pulse dla nowych powiadomień
 * - Polling dla automatycznego odświeżania licznika (co 30s)
 * - Accessibility (ARIA labels)
 * - Responsywny design
 *
 * Props:
 * - initialUnreadCount?: number - początkowa liczba nieprzeczytanych (z SSR)
 *
 * @example
 * ```tsx
 * <NotificationBell initialUnreadCount={5} />
 * ```
 */

import { useState, useEffect } from 'react';
import { getUnreadNotificationsCount } from '@/lib/api/endpoints/notifications';

interface NotificationBellProps {
  initialUnreadCount?: number;
}

export function NotificationBell({ initialUnreadCount = 0 }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch unread count from API
   */
  const fetchUnreadCount = async () => {
    try {
      setIsLoading(true);
      const response = await getUnreadNotificationsCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread notifications count:', error);
      // Silently fail - don't show error to user
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Polling: fetch unread count every 30 seconds
   */
  useEffect(() => {
    // Initial fetch (skip if we have initial count from SSR)
    if (initialUnreadCount === 0) {
      fetchUnreadCount();
    }

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [initialUnreadCount]);

  /**
   * Refresh count when page gains focus (user returns to tab)
   */
  useEffect(() => {
    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <a
      href="/dashboard/notifications"
      className="relative p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
      aria-label={`Powiadomienia${unreadCount > 0 ? ` - ${unreadCount} nieprzeczytanych` : ''}`}
    >
      {/* Bell icon */}
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

      {/* Badge with unread count */}
      {unreadCount > 0 && (
        <span
          className={`
            absolute -top-1 -right-1
            min-w-[20px] h-5 px-1.5
            flex items-center justify-center
            text-xs font-bold text-white
            bg-red-600 rounded-full
            border-2 border-white
            ${!isLoading && 'animate-pulse'}
          `}
          aria-label={`${unreadCount} nieprzeczytanych powiadomień`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Loading indicator (subtle) */}
      {isLoading && unreadCount === 0 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
      )}
    </a>
  );
}
