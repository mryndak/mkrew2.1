package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response for scraper run trigger
 * US-017: Manual Scraping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Scraper run response")
public class ScraperRunResponse {

    @Schema(description = "Scraper run ID", example = "1001")
    private Long scraperId;

    @Schema(description = "Run type (SCHEDULED or MANUAL)", example = "MANUAL")
    private String runType;

    @Schema(description = "Current status (RUNNING, COMPLETED, FAILED, PARTIAL)", example = "RUNNING")
    private String status;

    @Schema(description = "User or system that triggered the run", example = "admin@mkrew.pl")
    private String triggeredBy;

    @Schema(description = "Timestamp when scraper run started", example = "2025-01-08T18:30:00")
    private LocalDateTime startedAt;

    @Schema(description = "URL to check status of this run", example = "/api/v1/admin/scraper/runs/1001")
    private String statusUrl;
}
