package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for triggering manual scraper run
 * US-017: Manual Scraping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to trigger manual scraper run")
public class TriggerScraperRequest {

    @Schema(
            description = "RCKiK ID to scrape (optional, if not provided scrapes all active centers)",
            example = "1"
    )
    private Long rckikId;

    @Schema(
            description = "Custom URL to scrape (optional, used for manual override)",
            example = "https://rckik.warszawa.pl/stany-krwi"
    )
    @Pattern(
            regexp = "^https?://.*",
            message = "URL must start with http:// or https://"
    )
    private String url;
}
