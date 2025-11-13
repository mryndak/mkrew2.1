import { Badge } from '../../ui/Badge';
import type { RckikHeaderProps } from '@/types/rckik';

/**
 * RckikHeader - nagłówek widoku szczegółów centrum RCKiK
 *
 * Zawiera:
 * - Nazwę centrum i kod (h1)
 * - Adres (semantic address tag)
 * - Link do mapy (Google Maps z współrzędnymi)
 * - Badge statusu (Aktywne/Nieaktywne)
 * - FavoriteButton (przekazany jako children lub prop)
 *
 * @example
 * ```tsx
 * <RckikHeader
 *   rckik={rckik}
 *   isFavorite={isFavorite}
 *   isAuthenticated={isAuthenticated}
 *   onToggleFavorite={handleToggleFavorite}
 * />
 * ```
 */
export function RckikHeader({
  rckik,
  isFavorite,
  isAuthenticated,
  onToggleFavorite,
}: RckikHeaderProps) {
  const hasLocation = rckik.latitude !== null && rckik.longitude !== null;

  // Google Maps URL z współrzędnymi
  const mapUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${rckik.latitude},${rckik.longitude}`
    : null;

  return (
    <header className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left side - Main info */}
        <div className="flex-1">
          {/* Title with status badge */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {rckik.name}
            </h1>
            <Badge variant={rckik.active ? 'success' : 'neutral'} size="medium">
              {rckik.active ? 'Aktywne' : 'Nieaktywne'}
            </Badge>
          </div>

          {/* Code */}
          <p className="text-lg text-gray-600 mb-4 font-medium">
            Kod: {rckik.code}
          </p>

          {/* Address */}
          <address className="not-italic text-gray-700 mb-4">
            <div className="flex items-start gap-2">
              {/* Location icon */}
              <svg
                className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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
              <div>
                <p className="font-medium">{rckik.address}</p>
                {hasLocation && (
                  <p className="text-sm text-gray-500 mt-1">
                    {rckik.city} • {rckik.latitude?.toFixed(4)}°N, {rckik.longitude?.toFixed(4)}°E
                  </p>
                )}
              </div>
            </div>
          </address>

          {/* Map link */}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700
                         font-medium transition-colors duration-200"
            >
              {/* Map icon */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span>Zobacz na mapie</span>
              {/* External link icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex flex-row lg:flex-col gap-3">
          {/* Favorite button */}
          {isAuthenticated ? (
            <button
              onClick={onToggleFavorite}
              className={[
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
                'transition-all duration-200 border-2',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isFavorite
                  ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 focus:ring-red-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
              ].join(' ')}
              aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
            >
              {/* Heart icon */}
              {isFavorite ? (
                // Filled heart
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                // Outline heart
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">
                {isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              </span>
            </button>
          ) : (
            <button
              onClick={onToggleFavorite}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                         bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50
                         transition-all duration-200 focus:outline-none focus:ring-2
                         focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Zaloguj się, aby dodać do ulubionych"
            >
              {/* Heart outline icon */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="hidden sm:inline">Dodaj do ulubionych</span>
            </button>
          )}

          {/* Share button (optional - można dodać później) */}
          {/* <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                       bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50
                       transition-all duration-200 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-gray-500"
            aria-label="Udostępnij"
          >
            <ShareIcon />
            <span className="hidden sm:inline">Udostępnij</span>
          </button> */}
        </div>
      </div>

      {/* Aliases (optional - pokazuj tylko jeśli istnieją) */}
      {rckik.aliases && rckik.aliases.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Inne nazwy:</span>{' '}
            {rckik.aliases.join(', ')}
          </p>
        </div>
      )}
    </header>
  );
}
