import type {
  UserProfileResponse,
  UserProfile,
  NotificationPreferencesResponse,
  NotificationPreferences,
  BloodGroup,
  NotificationFrequency,
} from '@/types/profile';

/**
 * Mappers dla konwersji DTO (z API) na ViewModels (używane w komponentach)
 */

/**
 * Mapuje UserProfileResponse (DTO z backendu) na UserProfile (ViewModel)
 *
 * @param dto - Response z GET /api/v1/users/me
 * @returns UserProfile - ViewModel dla komponentów
 */
export function mapUserProfileResponseToViewModel(dto: UserProfileResponse): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    bloodGroup: dto.bloodGroup as BloodGroup | null,
    emailVerified: dto.emailVerified,
    consentInfo: {
      timestamp: new Date(dto.consentTimestamp),
      version: dto.consentVersion,
    },
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

/**
 * Mapuje NotificationPreferencesResponse (DTO z backendu) na NotificationPreferences (ViewModel)
 *
 * @param dto - Response z GET /api/v1/users/me/notification-preferences
 * @returns NotificationPreferences - ViewModel dla komponentów
 */
export function mapNotificationPreferencesResponseToViewModel(
  dto: NotificationPreferencesResponse
): NotificationPreferences {
  return {
    id: dto.id,
    userId: dto.userId,
    email: {
      enabled: dto.emailEnabled,
      frequency: dto.emailFrequency as NotificationFrequency,
    },
    inApp: {
      enabled: dto.inAppEnabled,
      frequency: dto.inAppFrequency as NotificationFrequency,
    },
    updatedAt: new Date(dto.updatedAt),
  };
}
