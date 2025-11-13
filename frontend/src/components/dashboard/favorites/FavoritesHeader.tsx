/**
 * FavoritesHeader - Nagłówek widoku ulubionych
 *
 * Features:
 * - Tytuł "Ulubione centra"
 * - Licznik ulubionych z odpowiednią formą gramatyczną
 * - Przycisk "Dodaj centrum" linkujący do /rckik
 * - Obsługa limitu maksymalnego (10 centrów)
 * - Dezaktywacja przycisku po osiągnięciu limitu
 * - Tooltip z informacją o limicie
 * - Responsywny layout (column na mobile, row na desktop)
 *
 * @example
 * ```tsx
 * <FavoritesHeader favoritesCount={5} />
 * ```
 */

interface FavoritesHeaderProps {
  favoritesCount: number;
  maxLimit?: number;
}

export function FavoritesHeader({
  favoritesCount,
  maxLimit = 10
}: FavoritesHeaderProps) {
  const isMaxReached = favoritesCount >= maxLimit;

  // Grammatically correct Polish form
  const getCenterLabel = (count: number) => {
    if (count === 1) return 'centrum';
    if (count >= 2 && count <= 4) return 'centra';
    return 'centrów';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Title and counter */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Ulubione centra
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {favoritesCount} {getCenterLabel(favoritesCount)}
          {isMaxReached && (
            <span className="ml-2 text-xs text-amber-600 font-medium">
              • Limit osiągnięty
            </span>
          )}
        </p>
      </div>

      {/* Add button */}
      <a
        href="/rckik"
        className={`
          inline-flex items-center justify-center gap-2 px-5 py-2.5
          font-medium rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            isMaxReached
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
          }
        `}
        aria-disabled={isMaxReached}
        onClick={(e) => {
          if (isMaxReached) {
            e.preventDefault();
          }
        }}
        title={isMaxReached ? `Osiągnięto limit ${maxLimit} centrów` : 'Przejdź do listy centrów krwiodawstwa'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {isMaxReached ? `Limit (${maxLimit})` : 'Dodaj centrum'}
      </a>
    </div>
  );
}
