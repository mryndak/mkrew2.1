import { apiClient } from '../client';
import type {
  UserProfileResponse,
  UpdateProfileRequest,
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
  DeleteAccountResponse,
  PasswordResetRequestDto,
  PasswordResetResponse,
} from '@/types/profile';

/**
 * API endpoints dla zarządzania profilem użytkownika
 * Wszystkie endpointy wymagają autoryzacji (Bearer token)
 */

/**
 * GET /api/v1/users/me
 * Pobranie profilu aktualnie zalogowanego użytkownika
 *
 * @returns Promise<UserProfileResponse>
 * @throws 401 Unauthorized - Token invalid lub expired
 * @throws 500 Internal Server Error
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
  const response = await apiClient.get<UserProfileResponse>('/users/me');
  return response.data;
}

/**
 * PATCH /api/v1/users/me
 * Aktualizacja profilu użytkownika (partial update)
 *
 * @param data - Dane do aktualizacji (firstName, lastName, bloodGroup)
 * @returns Promise<UserProfileResponse>
 * @throws 400 Bad Request - Validation error
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function updateUserProfile(
  data: UpdateProfileRequest
): Promise<UserProfileResponse> {
  const response = await apiClient.patch<UserProfileResponse>('/users/me', data);
  return response.data;
}

/**
 * GET /api/v1/users/me/notification-preferences
 * Pobranie preferencji powiadomień użytkownika
 *
 * @returns Promise<NotificationPreferencesResponse>
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Preferencje nie istnieją (auto-create on backend, unlikely)
 * @throws 500 Internal Server Error
 */
export async function getNotificationPreferences(): Promise<NotificationPreferencesResponse> {
  const response = await apiClient.get<NotificationPreferencesResponse>(
    '/users/me/notification-preferences'
  );
  return response.data;
}

/**
 * PUT /api/v1/users/me/notification-preferences
 * Aktualizacja preferencji powiadomień (full replace)
 *
 * @param data - Nowe preferencje powiadomień
 * @returns Promise<NotificationPreferencesResponse>
 * @throws 400 Bad Request - Validation error
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesRequest
): Promise<NotificationPreferencesResponse> {
  const response = await apiClient.put<NotificationPreferencesResponse>(
    '/users/me/notification-preferences',
    data
  );
  return response.data;
}

/**
 * DELETE /api/v1/users/me
 * Usunięcie konta użytkownika (z weryfikacją hasła)
 *
 * @param password - Hasło użytkownika (do potwierdzenia tożsamości)
 * @returns Promise<DeleteAccountResponse>
 * @throws 400 Bad Request - Niepoprawne hasło
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function deleteUserAccount(password: string): Promise<DeleteAccountResponse> {
  const response = await apiClient.delete<DeleteAccountResponse>('/users/me', {
    data: { password },
  });
  return response.data;
}

/**
 * POST /api/v1/auth/password-reset/request
 * Wysłanie żądania resetu hasła (wysyła email z linkiem)
 *
 * @param email - Email użytkownika
 * @returns Promise<PasswordResetResponse>
 * @throws 429 Too Many Requests - Rate limit exceeded
 * @throws 500 Internal Server Error
 *
 * Note: Backend zawsze zwraca sukces (security - nie ujawnia czy email istnieje)
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const response = await apiClient.post<PasswordResetResponse>('/auth/password-reset/request', {
    email,
  });
  return response.data;
}

/**
 * GET /api/v1/users/me/export (future endpoint - eksport danych GDPR)
 * Eksport danych użytkownika w formacie JSON
 *
 * @returns Promise<Blob> - Plik JSON z danymi użytkownika
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 *
 * Note: W MVP może być synchroniczny download. W przyszłości może być async job + email.
 */
export async function exportUserData(): Promise<Blob> {
  const response = await apiClient.get('/users/me/export', {
    responseType: 'blob',
  });
  return response.data;
}
