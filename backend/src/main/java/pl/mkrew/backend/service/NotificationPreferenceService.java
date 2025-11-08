package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.NotificationPreferencesResponse;
import pl.mkrew.backend.dto.UpdateNotificationPreferencesRequest;
import pl.mkrew.backend.entity.NotificationPreference;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.NotificationPreferenceRepository;
import pl.mkrew.backend.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserRepository userRepository;

    /**
     * Get notification preferences for user
     * Auto-creates default preferences if not exists (one-to-one relationship)
     *
     * @param userId User ID
     * @return NotificationPreferencesResponse
     */
    @Transactional
    public NotificationPreferencesResponse getNotificationPreferences(Long userId) {
        log.debug("Getting notification preferences for user ID: {}", userId);

        // Verify user exists
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get or create notification preferences
        NotificationPreference preferences = notificationPreferenceRepository
                .findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(user));

        log.info("Retrieved notification preferences for user ID: {}", userId);

        return mapToResponse(preferences);
    }

    /**
     * Update notification preferences for user
     *
     * @param userId User ID
     * @param request Update request
     * @return Updated NotificationPreferencesResponse
     */
    @Transactional
    public NotificationPreferencesResponse updateNotificationPreferences(
            Long userId,
            UpdateNotificationPreferencesRequest request) {
        log.debug("Updating notification preferences for user ID: {}", userId);

        // Verify user exists
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get or create notification preferences
        NotificationPreference preferences = notificationPreferenceRepository
                .findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(user));

        // Update fields (full update according to API spec - PUT method)
        preferences.setEmailEnabled(request.getEmailEnabled());
        preferences.setEmailFrequency(request.getEmailFrequency());
        preferences.setInAppEnabled(request.getInAppEnabled());
        preferences.setInAppFrequency(request.getInAppFrequency());

        // Save changes (updated_at will be automatically set by @UpdateTimestamp)
        NotificationPreference savedPreferences = notificationPreferenceRepository.save(preferences);

        log.info("Updated notification preferences for user ID: {} - Email: {}/{}, InApp: {}/{}",
                userId,
                savedPreferences.getEmailEnabled(),
                savedPreferences.getEmailFrequency(),
                savedPreferences.getInAppEnabled(),
                savedPreferences.getInAppFrequency());

        return mapToResponse(savedPreferences);
    }

    /**
     * Create default notification preferences for user
     *
     * @param user User entity
     * @return Created NotificationPreference
     */
    private NotificationPreference createDefaultPreferences(User user) {
        log.info("Creating default notification preferences for user ID: {}", user.getId());

        NotificationPreference preferences = NotificationPreference.builder()
                .user(user)
                .emailEnabled(true)
                .emailFrequency("ONLY_CRITICAL")
                .inAppEnabled(true)
                .inAppFrequency("IMMEDIATE")
                .build();

        return notificationPreferenceRepository.save(preferences);
    }

    /**
     * Map NotificationPreference entity to response DTO
     *
     * @param preferences NotificationPreference entity
     * @return NotificationPreferencesResponse
     */
    private NotificationPreferencesResponse mapToResponse(NotificationPreference preferences) {
        return NotificationPreferencesResponse.builder()
                .id(preferences.getId())
                .userId(preferences.getUser().getId())
                .emailEnabled(preferences.getEmailEnabled())
                .emailFrequency(preferences.getEmailFrequency())
                .inAppEnabled(preferences.getInAppEnabled())
                .inAppFrequency(preferences.getInAppFrequency())
                .createdAt(preferences.getCreatedAt())
                .updatedAt(preferences.getUpdatedAt())
                .build();
    }
}
