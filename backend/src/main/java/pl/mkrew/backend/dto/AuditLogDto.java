package pl.mkrew.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for single audit log entry
 * US-024: Audit Trail
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Single audit log entry with details about a critical operation")
public class AuditLogDto {

    @Schema(description = "Unique audit log ID", example = "9001")
    private Long id;

    @Schema(description = "Actor ID (user ID or 'SYSTEM')", example = "admin@mkrew.pl")
    private String actorId;

    @Schema(description = "Action performed", example = "RCKIK_UPDATED")
    private String action;

    @Schema(description = "Type of target entity", example = "rckik")
    private String targetType;

    @Schema(description = "ID of target entity", example = "1")
    private Long targetId;

    @Schema(description = "Additional metadata in JSON format (changes, context, etc.)")
    private JsonNode metadata;

    @Schema(description = "IP address of the actor", example = "192.168.1.100")
    private String ipAddress;

    @Schema(description = "User agent of the actor", example = "Mozilla/5.0...")
    private String userAgent;

    @Schema(description = "Timestamp when the action was performed", example = "2025-01-08T18:15:00")
    private LocalDateTime createdAt;
}
