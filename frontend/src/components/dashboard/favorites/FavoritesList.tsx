import type { FavoriteRckikDto } from '@/types/rckik';
import { FavoriteCardItem } from './FavoriteCardItem';

/**
 * FavoritesList - Lista ulubionych centrów
 *
 * Features:
 * - Grid layout responsywny (1/2/3 kolumny)
 * - Renderowanie FavoriteCardItem dla każdego centrum
 * - Przygotowana struktura dla drag-and-drop (będzie dodane w kolejnej fazie)
 * - Empty handling (pokazywany jest EmptyState w parent component)
 *
 * Layout:
 * - Mobile: 1 kolumna
 * - Tablet: 2 kolumny
 * - Desktop: 3 kolumny
 *
 * @example
 * ```tsx
 * <FavoritesList favorites={favoritesData} />
 * ```
 */

interface FavoritesListProps {
  favorites: FavoriteRckikDto[];
}

export function FavoritesList({ favorites }: FavoritesListProps) {
  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((favorite, index) => (
        <FavoriteCardItem
          key={favorite.id}
          favorite={favorite}
          index={index}
        />
      ))}
    </div>
  );
}
