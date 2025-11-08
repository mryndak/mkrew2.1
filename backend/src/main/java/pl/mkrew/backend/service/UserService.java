package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.UpdateProfileRequest;
import pl.mkrew.backend.dto.UserProfileResponse;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get user profile by user ID
     *
     * @param userId User ID from JWT token
     * @return UserProfileResponse with user data
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        log.info("Getting profile for user ID: {}", userId);

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        return mapToProfileResponse(user);
    }

    /**
     * Update user profile
     *
     * @param userId User ID from JWT token
     * @param request Update request with optional fields
     * @return Updated UserProfileResponse
     */
    @Transactional
    public UserProfileResponse updateUserProfile(Long userId, UpdateProfileRequest request) {
        log.info("Updating profile for user ID: {}", userId);

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        // Update only provided fields (partial update)
        boolean updated = false;

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
            updated = true;
            log.debug("Updated firstName for user {}", userId);
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
            updated = true;
            log.debug("Updated lastName for user {}", userId);
        }

        if (request.getBloodGroup() != null) {
            // Allow setting blood group to null (empty string becomes null)
            String bloodGroup = request.getBloodGroup().trim().isEmpty() ? null : request.getBloodGroup();
            user.setBloodGroup(bloodGroup);
            updated = true;
            log.debug("Updated bloodGroup for user {} to: {}", userId, bloodGroup);
        }

        if (updated) {
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            log.info("Profile updated successfully for user ID: {}", userId);
        } else {
            log.info("No changes to save for user ID: {}", userId);
        }

        return mapToProfileResponse(user);
    }

    /**
     * Map User entity to UserProfileResponse DTO
     */
    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .bloodGroup(user.getBloodGroup())
                .emailVerified(user.getEmailVerified())
                .consentTimestamp(user.getConsentTimestamp())
                .consentVersion(user.getConsentVersion())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
