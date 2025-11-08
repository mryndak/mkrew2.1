package pl.mkrew.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.entity.AuditLog;
import pl.mkrew.backend.repository.AuditLogRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Create audit log entry for critical operations
     * US-024: Audit Trail
     * US-013: Log donation deletion
     *
     * @param actorId Actor ID (user ID or "SYSTEM")
     * @param action Action type (e.g., "DONATION_DELETED", "ACCOUNT_DELETED")
     * @param targetType Target entity type (e.g., "donation", "user")
     * @param targetId Target entity ID
     * @param metadata Additional metadata (will be serialized to JSON)
     * @param ipAddress IP address of the actor
     * @param userAgent User agent string
     */
    @Transactional
    public void logAction(
            String actorId,
            String action,
            String targetType,
            Long targetId,
            Map<String, Object> metadata,
            String ipAddress,
            String userAgent) {

        log.debug("Creating audit log - actor: {}, action: {}, targetType: {}, targetId: {}",
                actorId, action, targetType, targetId);

        String metadataJson = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                metadataJson = objectMapper.writeValueAsString(metadata);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize audit log metadata", e);
                metadataJson = "{\"error\": \"Failed to serialize metadata\"}";
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .metadata(metadataJson)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(auditLog);

        log.info("Audit log created - ID: {}, action: {}, actor: {}, target: {}/{}",
                auditLog.getId(), action, actorId, targetType, targetId);
    }

    /**
     * Create audit log entry without HTTP context (for system operations)
     *
     * @param actorId Actor ID
     * @param action Action type
     * @param targetType Target entity type
     * @param targetId Target entity ID
     * @param metadata Additional metadata
     */
    @Transactional
    public void logAction(
            String actorId,
            String action,
            String targetType,
            Long targetId,
            Map<String, Object> metadata) {

        logAction(actorId, action, targetType, targetId, metadata, null, null);
    }

    /**
     * Log donation deletion
     * US-013: Audit trail for donation deletion
     *
     * @param userId User ID who deleted the donation
     * @param donationId Donation ID
     * @param donationData Donation data before deletion
     */
    @Transactional
    public void logDonationDeletion(Long userId, Long donationId, Map<String, Object> donationData) {
        logAction(
                String.valueOf(userId),
                "DONATION_DELETED",
                "donation",
                donationId,
                donationData
        );
    }

    /**
     * Log donation update
     *
     * @param userId User ID who updated the donation
     * @param donationId Donation ID
     * @param changes Map of field changes (old value -> new value)
     */
    @Transactional
    public void logDonationUpdate(Long userId, Long donationId, Map<String, Object> changes) {
        logAction(
                String.valueOf(userId),
                "DONATION_UPDATED",
                "donation",
                donationId,
                changes
        );
    }

    /**
     * Log account deletion
     * US-016: Right to be forgotten
     *
     * @param userId User ID who is being deleted
     * @param userData User data before deletion
     */
    @Transactional
    public void logAccountDeletion(Long userId, Map<String, Object> userData) {
        logAction(
                String.valueOf(userId),
                "ACCOUNT_DELETED",
                "user",
                userId,
                userData
        );
    }

    /**
     * Log RCKiK creation
     * US-019: Admin RCKiK Management
     *
     * @param userId Admin user ID who created the RCKiK
     * @param rckikId RCKiK ID
     * @param metadata RCKiK creation data
     */
    @Transactional
    public void logRckikCreated(Long userId, Long rckikId, Map<String, Object> metadata) {
        logAction(
                String.valueOf(userId),
                "RCKIK_CREATED",
                "rckik",
                rckikId,
                metadata
        );
    }

    /**
     * Log RCKiK update
     * US-019: Admin RCKiK Management
     *
     * @param userId Admin user ID who updated the RCKiK
     * @param rckikId RCKiK ID
     * @param metadata RCKiK update data (old and new values)
     */
    @Transactional
    public void logRckikUpdated(Long userId, Long rckikId, Map<String, Object> metadata) {
        logAction(
                String.valueOf(userId),
                "RCKIK_UPDATED",
                "rckik",
                rckikId,
                metadata
        );
    }

    /**
     * Log RCKiK deletion
     * US-019: Admin RCKiK Management
     *
     * @param userId Admin user ID who deleted the RCKiK
     * @param rckikId RCKiK ID
     * @param metadata RCKiK data before deletion
     */
    @Transactional
    public void logRckikDeleted(Long userId, Long rckikId, Map<String, Object> metadata) {
        logAction(
                String.valueOf(userId),
                "RCKIK_DELETED",
                "rckik",
                rckikId,
                metadata
        );
    }
}
