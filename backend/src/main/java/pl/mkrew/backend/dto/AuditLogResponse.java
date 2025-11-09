package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for paginated audit log results
 * US-024: Audit Trail
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Paginated list of audit log entries")
public class AuditLogResponse {

    @Schema(description = "List of audit log entries for current page")
    private List<AuditLogDto> auditLogs;

    @Schema(description = "Current page number (zero-based)", example = "0")
    private int page;

    @Schema(description = "Page size", example = "50")
    private int size;

    @Schema(description = "Total number of audit logs matching the filters", example = "8945")
    private long totalElements;

    @Schema(description = "Total number of pages", example = "179")
    private int totalPages;

    @Schema(description = "True if this is the first page", example = "true")
    private boolean first;

    @Schema(description = "True if this is the last page", example = "false")
    private boolean last;
}
