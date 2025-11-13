import { apiClient } from '../client';
import type { FavoriteRckikDto } from '../../../types/rckik';

/**
 * Dodanie centrum RCKiK do ulubionych
 * Endpoint: POST /api/v1/users/me/favorites
 * Wymaga uwierzytelnienia (JWT token)
 *
 * @param rckikId - ID centrum RCKiK do dodania
 * @param priority - Opcjonalny priorytet (dla sortowania)
 * @returns Promise z danymi dodanego ulubionego
 */
export async function addFavorite(
  rckikId: number,
  priority?: number
): Promise<FavoriteRckikDto> {
  const response = await apiClient.post<FavoriteRckikDto>('/users/me/favorites', {
    rckikId,
    priority,
  });

  return response.data;
}

/**
 * Usunięcie centrum RCKiK z ulubionych
 * Endpoint: DELETE /api/v1/users/me/favorites/{rckikId}
 * Wymaga uwierzytelnienia (JWT token)
 *
 * @param rckikId - ID centrum RCKiK do usunięcia
 * @returns Promise (void przy sukcesie)
 */
export async function removeFavorite(rckikId: number): Promise<void> {
  await apiClient.delete(`/users/me/favorites/${rckikId}`);
}

/**
 * Fetch listy ulubionych centrów użytkownika
 * Endpoint: GET /api/v1/users/me/favorites
 * Wymaga uwierzytelnienia (JWT token)
 *
 * @returns Promise z tablicą ulubionych centrów
 */
export async function fetchFavorites(): Promise<FavoriteRckikDto[]> {
  const response = await apiClient.get<FavoriteRckikDto[]>('/users/me/favorites');
  return response.data;
}

/**
 * Aktualizacja kolejności ulubionych centrów
 * Endpoint: PATCH /api/v1/users/me/favorites
 * Wymaga uwierzytelnienia (JWT token)
 *
 * @param favorites - Tablica obiektów z id i priority dla każdego ulubionego
 * @returns Promise (void przy sukcesie)
 */
export async function updateFavoritesOrder(
  favorites: Array<{ id: number; priority: number }>
): Promise<void> {
  await apiClient.patch('/users/me/favorites', { favorites });
}

/**
 * Sprawdzenie czy centrum jest w ulubionych
 * Helper function - sprawdza lokalnie w liście pobranych ulubionych
 *
 * @param rckikId - ID centrum RCKiK
 * @param favorites - Lista ulubionych centrów
 * @returns boolean - true jeśli centrum jest w ulubionych
 */
export function isFavorite(rckikId: number, favorites: FavoriteRckikDto[]): boolean {
  return favorites.some(fav => fav.rckikId === rckikId);
}
