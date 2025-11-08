package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.DeleteAccountResponse;
import pl.mkrew.backend.dto.UpdateProfileRequest;
import pl.mkrew.backend.dto.UserProfileResponse;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.UserRepository;
import pl.mkrew.backend.repository.UserSessionRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

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
     * Delete user account (soft delete)
     * US-016: Right to be Forgotten
     *
     * Business Logic:
     * 1. Soft delete: Set deleted_at=NOW()
     * 2. Create audit log entry (ACCOUNT_DELETED)
     * 3. Send confirmation email
     * 4. Cascade deletes: donations, favorites, notifications (ON DELETE CASCADE)
     * 5. Keep audit logs for compliance
     * 6. Invalidate all sessions
     *
     * @param userId User ID from JWT token
     * @return DeleteAccountResponse with confirmation message
     */
    @Transactional
    public DeleteAccountResponse deleteAccount(Long userId) {
        log.info("Initiating account deletion for user ID: {}", userId);

        // 1. Find user
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> {
                    log.warn("User not found or already deleted: {}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        // Save user data for audit log before deletion
        Map<String, Object> userData = new HashMap<>();
        userData.put("email", user.getEmail());
        userData.put("firstName", user.getFirstName());
        userData.put("lastName", user.getLastName());
        userData.put("bloodGroup", user.getBloodGroup());
        userData.put("emailVerified", user.getEmailVerified());
        userData.put("createdAt", user.getCreatedAt().toString());

        // 2. Soft delete user - set deleted_at timestamp
        LocalDateTime deletionTime = LocalDateTime.now();
        user.setDeletedAt(deletionTime);
        userRepository.save(user);
        log.info("User soft deleted: {}", userId);

        // 3. Create audit log entry
        auditLogService.logAccountDeletion(userId, userData);
        log.info("Audit log created for account deletion: {}", userId);

        // 4. Invalidate all user sessions
        int revokedSessions = userSessionRepository.revokeAllSessionsByUserId(userId);
        log.info("Revoked {} active sessions for user: {}", revokedSessions, userId);

        // 5. Send confirmation email
        String recipientName = user.getFirstName() + " " + user.getLastName();
        boolean emailSent = emailService.sendAccountDeletionConfirmation(
                user.getEmail(),
                recipientName,
                userId
        );

        if (emailSent) {
            log.info("Account deletion confirmation email sent to: {}", user.getEmail());
        } else {
            log.warn("Failed to send account deletion confirmation email to: {}", user.getEmail());
        }

        // 6. Return response
        // Note: Cascade deletes (donations, favorites, notifications) are handled automatically
        // by database ON DELETE CASCADE constraints
        return DeleteAccountResponse.builder()
                .message("Account deletion initiated. You will receive confirmation via email.")
                .deletionScheduledAt(deletionTime)
                .build();
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
