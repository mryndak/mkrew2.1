package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for global scraper health status
 * US-025: Extreme Mode - No Access to RCKiK Pages
 *
 * Represents the overall health of the scraping system:
 * - OK: Last scraper run was successful
 * - DEGRADED: Some recent failures but not all
 * - FAILED: Multiple consecutive failures (prolonged failure)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Global scraper system health status")
public class ScraperGlobalStatusDto {

    @Schema(
            description = "Global scraping status",
            example = "OK",
            allowableValues = {"OK", "DEGRADED", "FAILED"}
    )
    private String globalStatus;

    @Schema(
            description = "Timestamp of the last successful scraper run completion",
            example = "2025-01-08T02:30:00"
    )
    private LocalDateTime lastSuccessfulTimestamp;

    @Schema(
            description = "Number of consecutive failed scraper runs",
            example = "0"
    )
    private Integer consecutiveFailures;

    @Schema(
            description = "Total number of recent scraper runs analyzed",
            example = "5"
    )
    private Integer totalRecentRuns;

    @Schema(
            description = "Number of successful runs in recent history",
            example = "5"
    )
    private Integer successfulRecentRuns;

    @Schema(
            description = "Number of failed runs in recent history",
            example = "0"
    )
    private Integer failedRecentRuns;

    @Schema(
            description = "Descriptive message about the current status",
            example = "Scraping system is operating normally"
    )
    private String message;

    @Schema(
            description = "Whether admin notification should be triggered",
            example = "false"
    )
    private Boolean requiresAdminAlert;
}
