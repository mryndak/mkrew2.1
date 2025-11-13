import { FavoriteCard } from './FavoriteCard';
import type { FavoritesWidgetProps } from '@/types/dashboard';

/**
 * FavoritesWidget - Widget ulubionych centrów na Dashboard
 *
 * Features:
 * - Wyświetla top 3 ulubione centra
 * - EmptyState jeśli brak ulubionych
 * - Link "Zobacz wszystkie" do /dashboard/favorites
 * - Sortowanie według priority lub addedAt
 * - Click handler dla każdego centrum → redirect do /rckik/{id}
 *
 * @example
 * ```tsx
 * <FavoritesWidget
 *   favorites={[...]}
 * />
 * ```
 */
export function FavoritesWidget({ favorites }: FavoritesWidgetProps) {
  const handleCardClick = (rckikId: number) => {
    window.location.href = `/rckik/${rckikId}`;
  };

  // Sort favorites by priority (ascending) or addedAt (newest first)
  const sortedFavorites = [...favorites]
    .sort((a, b) => {
      // If both have priority, sort by priority (lower = higher priority)
      if (a.priority !== null && b.priority !== null) {
        return a.priority - b.priority;
      }
      // If only one has priority, it goes first
      if (a.priority !== null) return -1;
      if (b.priority !== null) return 1;
      // Otherwise sort by addedAt (newest first)
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    })
    .slice(0, 3); // Top 3

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          Ulubione centra
        </h2>
        {favorites.length > 0 && (
          <a
            href="/dashboard/favorites"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Zobacz wszystkie ({favorites.length}) →
          </a>
        )}
      </div>

      {/* Content */}
      {sortedFavorites.length > 0 ? (
        <div className="space-y-4">
          {sortedFavorites.map((favorite) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              onClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-8">
          <div className="mb-4 text-gray-300">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak ulubionych centrów
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Dodaj centra krwiodawstwa do ulubionych, aby szybko śledzić ich stany krwi
          </p>
          <a
            href="/rckik"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Szukaj centrów
          </a>
        </div>
      )}
    </section>
  );
}
