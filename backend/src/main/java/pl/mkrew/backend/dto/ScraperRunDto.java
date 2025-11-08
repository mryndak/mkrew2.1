package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for scraper run information
 * US-018: Monitor Scraping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Scraper run information")
public class ScraperRunDto {

    @Schema(description = "Scraper run ID", example = "1001")
    private Long id;

    @Schema(description = "Run type (SCHEDULED or MANUAL)", example = "SCHEDULED")
    private String runType;

    @Schema(description = "Timestamp when scraper run started", example = "2025-01-08T02:00:00")
    private LocalDateTime startedAt;

    @Schema(description = "Timestamp when scraper run completed", example = "2025-01-08T02:15:30")
    private LocalDateTime completedAt;

    @Schema(description = "Total number of RCKiK centers to scrape", example = "52")
    private Integer totalRckiks;

    @Schema(description = "Number of successfully scraped centers", example = "50")
    private Integer successfulCount;

    @Schema(description = "Number of failed scraping attempts", example = "2")
    private Integer failedCount;

    @Schema(description = "Duration of scraping in seconds", example = "930")
    private Integer durationSeconds;

    @Schema(description = "User or system that triggered the run", example = "admin@mkrew.pl")
    private String triggeredBy;

    @Schema(description = "Current status (RUNNING, COMPLETED, FAILED, PARTIAL)", example = "COMPLETED")
    private String status;

    @Schema(description = "Summary of errors (if any)", example = "2 centers failed due to timeout")
    private String errorSummary;
}
