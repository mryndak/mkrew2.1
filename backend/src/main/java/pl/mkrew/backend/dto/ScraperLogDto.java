package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for scraper log information
 * US-018: Monitor Scraping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Scraper log entry")
public class ScraperLogDto {

    @Schema(description = "Scraper log ID", example = "10001")
    private Long id;

    @Schema(description = "Scraper run ID", example = "1001")
    private Long scraperRunId;

    @Schema(description = "RCKiK ID", example = "1")
    private Long rckikId;

    @Schema(description = "RCKiK name", example = "RCKiK Warszawa")
    private String rckikName;

    @Schema(description = "URL that was scraped", example = "https://rckik.warszawa.pl/stany-krwi")
    private String url;

    @Schema(description = "Scraping status (SUCCESS, PARTIAL, FAILED)", example = "SUCCESS")
    private String status;

    @Schema(description = "Error message (if failed)", example = "Connection timeout after 30 seconds")
    private String errorMessage;

    @Schema(description = "Parser version used", example = "1.2.0")
    private String parserVersion;

    @Schema(description = "Response time in milliseconds", example = "1200")
    private Integer responseTimeMs;

    @Schema(description = "HTTP status code", example = "200")
    private Integer httpStatusCode;

    @Schema(description = "Number of records successfully parsed", example = "8")
    private Integer recordsParsed;

    @Schema(description = "Number of records that failed parsing", example = "0")
    private Integer recordsFailed;

    @Schema(description = "Timestamp when log was created", example = "2025-01-08T02:05:00")
    private LocalDateTime createdAt;
}
