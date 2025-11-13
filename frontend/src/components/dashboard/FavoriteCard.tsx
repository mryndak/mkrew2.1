import { memo } from 'react';
import { BloodLevelBadge } from '@/components/rckik/BloodLevelBadge';
import type { FavoriteCardProps } from '@/types/dashboard';

/**
 * FavoriteCard - Karta pojedynczego ulubionego centrum na Dashboard
 *
 * Features:
 * - Nazwa centrum i miasto
 * - Adres centrum
 * - Aktualne poziomy krwi (BloodLevelBadge)
 * - Klikalna karta → redirect do szczegółów centrum
 * - Hover state
 * - Wyróżnienie poziomów CRITICAL
 * - Memoized dla optymalizacji performance (porównanie po favorite.id)
 *
 * @example
 * ```tsx
 * <FavoriteCard
 *   favorite={favoriteData}
 *   onClick={(rckikId) => console.log('Clicked:', rckikId)}
 * />
 * ```
 */
function FavoriteCardComponent({ favorite, onClick }: FavoriteCardProps) {
  const { rckikId, name, city, address, currentBloodLevels } = favorite;

  const handleClick = () => {
    onClick(rckikId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(rckikId);
    }
  };

  // Check if there are any CRITICAL blood levels
  const hasCriticalLevels = currentBloodLevels.some(
    (level) => level.levelStatus === 'CRITICAL'
  );

  return (
    <div
      className={`bg-white rounded-lg border ${
        hasCriticalLevels ? 'border-red-300' : 'border-gray-200'
      } p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${name} w ${city}. Kliknij aby zobaczyć szczegóły.`}
    >
      {/* Critical alert banner */}
      {hasCriticalLevels && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <svg
            className="w-4 h-4 text-red-600 flex-shrink-0"
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
          <p className="text-xs font-medium text-red-800">
            Krytyczny poziom krwi!
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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
          {city}
        </p>
        <p className="text-xs text-gray-500 mt-1">{address}</p>
      </div>

      {/* Blood Levels */}
      {currentBloodLevels.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">
            Aktualne stany krwi:
          </p>
          <div className="flex flex-wrap gap-2">
            {currentBloodLevels.map((level) => (
              <BloodLevelBadge
                key={level.bloodGroup}
                bloodLevel={level}
                size="small"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">Brak danych o stanach krwi</p>
        </div>
      )}

      {/* Last update timestamp */}
      {currentBloodLevels.length > 0 && currentBloodLevels[0].lastUpdate && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Aktualizacja:{' '}
            {new Date(currentBloodLevels[0].lastUpdate).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Arrow indicator */}
      <div className="mt-3 flex items-center justify-end text-primary-600 text-sm font-medium">
        Zobacz szczegóły
        <svg
          className="w-4 h-4 ml-1"
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
    </div>
  );
}

/**
 * Memoized FavoriteCard
 * Re-render only if favorite.id or blood levels change
 */
export const FavoriteCard = memo(
  FavoriteCardComponent,
  (prevProps, nextProps) => {
    // Compare favorite.id
    if (prevProps.favorite.id !== nextProps.favorite.id) return false;

    // Compare blood levels (deep comparison of levelStatus which is most important)
    const prevLevels = prevProps.favorite.currentBloodLevels;
    const nextLevels = nextProps.favorite.currentBloodLevels;

    if (prevLevels.length !== nextLevels.length) return false;

    return prevLevels.every(
      (level, index) =>
        level.bloodGroup === nextLevels[index]?.bloodGroup &&
        level.levelStatus === nextLevels[index]?.levelStatus
    );
  }
);
