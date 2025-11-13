/**
 * MarkAllAsReadButton - Przycisk masowego oznaczania powiadomień jako przeczytane
 *
 * Features:
 * - Oznaczanie wszystkich nieprzeczytanych powiadomień jednym kliknięciem
 * - Loading state podczas operacji
 * - Disabled state gdy brak nieprzeczytanych
 * - Ikona (double checkmark)
 * - Accessibility (ARIA labels, disabled state)
 * - Responsywny design
 *
 * Props:
 * - unreadCount: number - liczba nieprzeczytanych powiadomień
 * - onMarkAllAsRead: () => Promise<void> - callback do oznaczania wszystkich
 *
 * @example
 * ```tsx
 * <MarkAllAsReadButton
 *   unreadCount={5}
 *   onMarkAllAsRead={async () => { ... }}
 * />
 * ```
 */

import { useState } from 'react';

interface MarkAllAsReadButtonProps {
  unreadCount: number;
  onMarkAllAsRead: () => Promise<void>;
}

export function MarkAllAsReadButton({
  unreadCount,
  onMarkAllAsRead,
}: MarkAllAsReadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || unreadCount === 0) return;

    setIsLoading(true);
    try {
      await onMarkAllAsRead();
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = unreadCount === 0 || isLoading;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        ${
          isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
        }
      `}
      aria-label={`Oznacz wszystkie ${unreadCount} powiadomień jako przeczytane`}
      aria-disabled={isDisabled}
    >
      {/* Loading spinner */}
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        // Double checkmark icon
        <svg
          className="w-5 h-5"
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13l4 4L23 7"
            opacity="0.5"
          />
        </svg>
      )}

      {/* Button text */}
      <span>
        {isLoading ? 'Oznaczanie...' : 'Oznacz wszystkie jako przeczytane'}
      </span>
    </button>
  );
}
