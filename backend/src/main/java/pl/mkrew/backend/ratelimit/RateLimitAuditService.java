package pl.mkrew.backend.ratelimit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.mkrew.backend.entity.AuditLog;
import pl.mkrew.backend.repository.AuditLogRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for logging rate limit violations to audit log
 * US-023: API Security and Rate Limiting
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RateLimitAuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Log rate limit violation to audit log
     *
     * @param ipAddress Client IP address
     * @param requestUri Request URI
     * @param method HTTP method
     * @param userId User ID (null if anonymous)
     */
    public void logRateLimitViolation(String ipAddress, String requestUri, String method, Long userId) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("requestUri", requestUri);
            metadata.put("method", method);
            metadata.put("timestamp", LocalDateTime.now().toString());

            AuditLog auditLog = new AuditLog();
            auditLog.setActorId(userId != null ? userId.toString() : "ANONYMOUS");
            auditLog.setAction("RATE_LIMIT_EXCEEDED");
            auditLog.setTargetType("api_request");
            auditLog.setTargetId(null);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(null); // Can be enhanced to capture user agent
            auditLog.setCreatedAt(LocalDateTime.now());

            try {
                auditLog.setMetadata(objectMapper.writeValueAsString(metadata));
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize metadata for audit log", e);
                auditLog.setMetadata("{}");
            }

            auditLogRepository.save(auditLog);

            log.info("Logged rate limit violation: IP={}, URI={}, User={}", ipAddress, requestUri, userId);

        } catch (Exception e) {
            log.error("Failed to log rate limit violation to audit log", e);
        }
    }
}
