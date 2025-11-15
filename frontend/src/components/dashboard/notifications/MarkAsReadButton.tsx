/**
 * MarkAsReadButton - Przycisk oznaczania pojedynczego powiadomienia jako przeczytane
 *
 * Features:
 * - Kompaktowy przycisk dla pojedynczego powiadomienia
 * - Loading state z spinner
 * - Disabled state jeśli już przeczytane
 * - Accessibility (ARIA labels)
 *
 * Props:
 * - notificationId: number - ID powiadomienia
 * - isRead: boolean - czy powiadomienie jest przeczytane
 * - onMarkAsRead: (id: number) => Promise<void> - callback oznaczania jako przeczytane
 * - isLoading?: boolean - stan ładowania
 *
 * @example
 * ```tsx
 * <MarkAsReadButton
 *   notificationId={123}
 *   isRead={false}
 *   onMarkAsRead={handleMarkAsRead}
 *   isLoading={false}
 * />
 * ```
 */

interface MarkAsReadButtonProps {
  notificationId: number;
  isRead: boolean;
  onMarkAsRead: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export function MarkAsReadButton({
  notificationId,
  isRead,
  onMarkAsRead,
  isLoading = false,
}: MarkAsReadButtonProps) {
  const handleClick = async (e: React.MouseEvent) => {
    // Prevent event bubbling (jeśli NotificationItem ma onClick)
    e.stopPropagation();

    if (isLoading || isRead) return;
    await onMarkAsRead(notificationId);
  };

  if (isRead) {
    return null; // Don't render if already read
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        ${
          isLoading
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : 'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200'
        }
      `}
      aria-label="Oznacz jako przeczytane"
      aria-disabled={isLoading}
      data-test-id="mark-as-read-button"
      data-notification-id={notificationId}
    >
      {/* Loading spinner or checkmark icon */}
      {isLoading ? (
        <svg
          className="animate-spin h-3.5 w-3.5"
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
        <svg
          className="w-3.5 h-3.5"
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
      )}

      {/* Button text */}
      <span>{isLoading ? 'Oznaczanie...' : 'Oznacz'}</span>
    </button>
  );
}
