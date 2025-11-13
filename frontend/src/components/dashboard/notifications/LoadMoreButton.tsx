/**
 * LoadMoreButton - Przycisk ładowania kolejnych stron powiadomień
 *
 * Features:
 * - Ładowanie kolejnych stron (paginacja)
 * - Loading state z spinner
 * - Disabled state gdy brak kolejnych stron
 * - Accessibility (ARIA labels)
 * - Responsywny design
 *
 * Props:
 * - onLoadMore: () => Promise<void> - callback do ładowania kolejnej strony
 * - hasMore: boolean - czy są dostępne kolejne strony
 * - isLoading: boolean - czy trwa ładowanie
 *
 * @example
 * ```tsx
 * <LoadMoreButton
 *   onLoadMore={async () => { ... }}
 *   hasMore={true}
 *   isLoading={false}
 * />
 * ```
 */

interface LoadMoreButtonProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

export function LoadMoreButton({
  onLoadMore,
  hasMore,
  isLoading,
}: LoadMoreButtonProps) {
  // Don't render if no more pages
  if (!hasMore) {
    return null;
  }

  const handleClick = async () => {
    if (isLoading) return;
    await onLoadMore();
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          ${
            isLoading
              ? 'bg-gray-100 text-gray-400 cursor-wait'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
          }
        `}
        aria-label="Załaduj więcej powiadomień"
        aria-disabled={isLoading}
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
          // Arrow down icon
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}

        {/* Button text */}
        <span>{isLoading ? 'Ładowanie...' : 'Załaduj więcej'}</span>
      </button>
    </div>
  );
}
