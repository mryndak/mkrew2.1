import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  fetchFavorites,
  selectFavorites,
  selectFavoritesLoading,
  selectFavoritesError,
} from '@/lib/store/slices/favoritesSlice';
import { FavoritesList } from './FavoritesList';
import { EmptyState } from './EmptyState';
import { FavoritesHeader } from './FavoritesHeader';
import { Toaster } from 'sonner';

/**
 * FavoritesView - Główny widok ulubionych centrów krwiodawstwa
 *
 * Features:
 * - Automatyczne pobieranie listy ulubionych z Redux
 * - Drag-and-drop reordering
 * - Usuwanie z potwierdzeniem
 * - Empty state dla użytkowników bez ulubionych
 * - Loading skeleton
 * - Error handling z możliwością retry
 * - Toast notifications (success/error)
 * - Responsywny design
 *
 * Data Flow:
 * - Mount → fetchFavorites() z Redux thunk
 * - Redux store → favorites, loading, error states
 * - Child components → FavoritesList lub EmptyState
 *
 * @example
 * ```tsx
 * <FavoritesView />
 * ```
 */
export function FavoritesView() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  const isLoading = useAppSelector(selectFavoritesLoading);
  const error = useAppSelector(selectFavoritesError);

  // Fetch favorites on mount
  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  // Loading state - show skeleton only on initial load
  if (isLoading && favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FavoritesLoadingSkeleton />
      </div>
    );
  }

  // Error state - only if we have no favorites to show
  if (error && favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FavoritesErrorState
          message={error}
          onRetry={() => dispatch(fetchFavorites())}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with title and add button */}
      <FavoritesHeader favoritesCount={favorites.length} />

      {/* Main content - Empty state or Favorites list */}
      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <FavoritesList favorites={favorites} />
      )}

      {/* Toast notifications container */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

/**
 * Loading Skeleton for Favorites View
 * Shows while fetching initial data
 */
function FavoritesLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-9 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error State for Favorites View
 * Shows when initial fetch fails
 */
interface FavoritesErrorStateProps {
  message: string;
  onRetry: () => void;
}

function FavoritesErrorState({ message, onRetry }: FavoritesErrorStateProps) {
  return (
    <div className="bg-white rounded-lg border border-red-200 p-8">
      <div className="flex flex-col items-center text-center">
        <svg
          className="w-16 h-16 text-red-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Błąd ładowania ulubionych
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {message || 'Nie udało się pobrać listy ulubionych centrów. Spróbuj ponownie.'}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
