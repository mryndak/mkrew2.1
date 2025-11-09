package pl.mkrew.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.AuditLogDto;
import pl.mkrew.backend.dto.AuditLogResponse;
import pl.mkrew.backend.entity.AuditLog;
import pl.mkrew.backend.repository.AuditLogRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    /**
     * Get audit logs with optional filters
     * US-024: Audit Trail - Read Access
     *
     * @param actorId Actor ID filter (optional)
     * @param action Action type filter (optional)
     * @param targetType Target type filter (optional)
     * @param targetId Target ID filter (optional)
     * @param fromDate Start date filter (optional)
     * @param toDate End date filter (optional)
     * @param page Page number (zero-based)
     * @param size Page size
     * @return Paginated audit log response
     */
    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLogs(
            String actorId,
            String action,
            String targetType,
            Long targetId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size) {

        log.debug("Getting audit logs - actor: {}, action: {}, targetType: {}, targetId: {}, fromDate: {}, toDate: {}, page: {}, size: {}",
                actorId, action, targetType, targetId, fromDate, toDate, page, size);

        // Convert LocalDate to LocalDateTime (start of day for fromDate, end of day for toDate)
        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = toDate != null ? toDate.plusDays(1).atStartOfDay().minusNanos(1) : null;

        // Create pageable
        Pageable pageable = PageRequest.of(page, size);

        // Query with filters
        Page<AuditLog> auditLogPage = auditLogRepository.findWithFilters(
                actorId,
                action,
                targetType,
                targetId,
                fromDateTime,
                toDateTime,
                pageable
        );

        // Convert to DTOs
        List<AuditLogDto> auditLogDtos = auditLogPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        log.info("Retrieved {} audit logs (page {}/{}, total: {})",
                auditLogDtos.size(),
                auditLogPage.getNumber() + 1,
                auditLogPage.getTotalPages(),
                auditLogPage.getTotalElements());

        return AuditLogResponse.builder()
                .auditLogs(auditLogDtos)
                .page(auditLogPage.getNumber())
                .size(auditLogPage.getSize())
                .totalElements(auditLogPage.getTotalElements())
                .totalPages(auditLogPage.getTotalPages())
                .first(auditLogPage.isFirst())
                .last(auditLogPage.isLast())
                .build();
    }

    /**
     * Convert AuditLog entity to DTO
     *
     * @param auditLog AuditLog entity
     * @return AuditLogDto
     */
    private AuditLogDto convertToDto(AuditLog auditLog) {
        JsonNode metadataNode = null;
        if (auditLog.getMetadata() != null) {
            try {
                metadataNode = objectMapper.readTree(auditLog.getMetadata());
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse audit log metadata for ID {}", auditLog.getId(), e);
                // Return null or empty object node
                metadataNode = objectMapper.createObjectNode();
            }
        }

        return AuditLogDto.builder()
                .id(auditLog.getId())
                .actorId(auditLog.getActorId())
                .action(auditLog.getAction())
                .targetType(auditLog.getTargetType())
                .targetId(auditLog.getTargetId())
                .metadata(metadataNode)
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
