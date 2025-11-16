package pl.mkrew.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for parser configuration response (US-029, US-030)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParserConfigResponse {

    private Long id;
    private Long rckikId;
    private String rckikName;
    private String rckikCode;
    private String sourceUrl;
    private String parserType;
    private JsonNode cssSelectors; // JSON object
    private Boolean active;
    private String scheduleCron;
    private Integer timeoutSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastSuccessfulRun;
    private String lastRunStatus;
    private List<RecentRunDto> recentRuns;
    private List<AuditTrailEntryDto> auditTrail;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentRunDto {
        private Long runId;
        private LocalDateTime startedAt;
        private String status;
        private Integer recordsParsed;
        private Integer recordsFailed;
        private Integer responseTimeMs;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditTrailEntryDto {
        private String action;
        private String actorId;
        private LocalDateTime timestamp;
        private Object metadata;
    }
}
