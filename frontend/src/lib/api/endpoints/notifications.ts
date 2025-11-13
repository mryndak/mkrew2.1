import { apiClient } from '../client';
import type {
  InAppNotificationsResponse,
  InAppNotificationDto,
  UnreadCountResponse,
} from '@/types/dashboard';

/**
 * API endpoints dla powiadomień in-app
 * Wszystkie endpointy wymagają autoryzacji (Bearer token)
 */

/**
 * GET /api/v1/users/me/notifications
 * Pobiera listę powiadomień użytkownika z paginacją
 *
 * @param params - Parametry zapytania
 * @param params.unreadOnly - Pokaż tylko nieprzeczytane (default: false)
 * @param params.page - Numer strony (zero-based, default: 0)
 * @param params.size - Rozmiar strony (default: 20)
 * @returns Promise<InAppNotificationsResponse>
 * @throws 401 Unauthorized - Token invalid lub expired
 * @throws 500 Internal Server Error
 */
export async function getUserNotifications(params?: {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}): Promise<InAppNotificationsResponse> {
  const response = await apiClient.get<InAppNotificationsResponse>('/users/me/notifications', {
    params: {
      unreadOnly: params?.unreadOnly ?? false,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  return response.data;
}

/**
 * GET /api/v1/users/me/notifications/recent
 * Pobiera ostatnie N powiadomień (najpierw nieprzeczytane)
 *
 * @param limit - Liczba powiadomień do pobrania (default: 5)
 * @returns Promise<InAppNotificationDto[]>
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function getRecentNotifications(
  limit: number = 5
): Promise<InAppNotificationDto[]> {
  const response = await getUserNotifications({ unreadOnly: false, page: 0, size: limit });
  return response.notifications;
}

/**
 * GET /api/v1/users/me/notifications/unread-count
 * Pobiera liczbę nieprzeczytanych powiadomień
 *
 * @returns Promise<UnreadCountResponse>
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
  const response = await apiClient.get<UnreadCountResponse>(
    '/users/me/notifications/unread-count'
  );
  return response.data;
}

/**
 * GET /api/v1/users/me/notifications/{id}
 * Pobiera szczegóły pojedynczego powiadomienia
 *
 * @param notificationId - ID powiadomienia
 * @returns Promise<InAppNotificationDto>
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Powiadomienie nie istnieje lub nie należy do użytkownika
 * @throws 500 Internal Server Error
 */
export async function getNotificationById(
  notificationId: number
): Promise<InAppNotificationDto> {
  const response = await apiClient.get<InAppNotificationDto>(
    `/users/me/notifications/${notificationId}`
  );
  return response.data;
}

/**
 * PATCH /api/v1/users/me/notifications/{id}
 * Oznacza powiadomienie jako przeczytane
 *
 * @param notificationId - ID powiadomienia
 * @returns Promise<InAppNotificationDto>
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Powiadomienie nie istnieje
 * @throws 500 Internal Server Error
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<InAppNotificationDto> {
  const response = await apiClient.patch<InAppNotificationDto>(
    `/users/me/notifications/${notificationId}`,
    {
      readAt: new Date().toISOString(),
    }
  );
  return response.data;
}

/**
 * PATCH /api/v1/users/me/notifications/mark-all-read
 * Oznacza wszystkie powiadomienia jako przeczytane
 *
 * @returns Promise<{ markedCount: number }>
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function markAllNotificationsAsRead(): Promise<{ markedCount: number }> {
  const response = await apiClient.patch<{ markedCount: number }>(
    '/users/me/notifications/mark-all-read'
  );
  return response.data;
}

/**
 * DELETE /api/v1/users/me/notifications/{id}
 * Usuwa powiadomienie
 *
 * @param notificationId - ID powiadomienia do usunięcia
 * @returns Promise<void>
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Powiadomienie nie istnieje
 * @throws 500 Internal Server Error
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  await apiClient.delete(`/users/me/notifications/${notificationId}`);
}
