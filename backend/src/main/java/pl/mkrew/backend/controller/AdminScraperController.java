package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.ScraperRunResponse;
import pl.mkrew.backend.dto.TriggerScraperRequest;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.ScraperService;

/**
 * Admin controller for scraper management
 * US-017: Manual Scraping
 * US-018: Monitoring scraper errors
 */
@RestController
@RequestMapping("/api/v1/admin/scraper")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Scraper", description = "Admin endpoints for scraper management")
public class AdminScraperController {

    private final ScraperService scraperService;

    /**
     * US-017: Trigger manual scraper run
     * POST /api/v1/admin/scraper/runs
     *
     * Manually triggers scraping for specific RCKiK or all active centers.
     * Creates a scraper_run record and queues the scraping job (async).
     * Returns immediately with run ID for status polling.
     *
     * @param request Trigger scraper request
     * @return ScraperRunResponse with run details
     */
    @Operation(
            summary = "Trigger manual scraper run",
            description = "Manually trigger scraping for specific RCKiK center or all active centers. " +
                    "Creates a scraper run and queues the job for asynchronous execution. " +
                    "Returns immediately with run ID for status polling.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "202",
                    description = "Scraper run initiated successfully (Accepted)",
                    content = @Content(schema = @Schema(implementation = ScraperRunResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error - Invalid request parameters",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not have ADMIN role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "RCKiK not found (if rckikId provided)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/runs")
    public ResponseEntity<ScraperRunResponse> triggerManualScraping(
            @Valid @RequestBody TriggerScraperRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("POST /api/v1/admin/scraper/runs - Trigger scraper request from user ID: {}", userId);

        // TODO: Add role-based authorization check
        // For now, any authenticated user can trigger scraper
        // Future: Add @PreAuthorize("hasRole('ADMIN')") or similar

        ScraperRunResponse response = scraperService.triggerManualScraping(request, userId);

        log.info("Scraper run initiated successfully - run ID: {}", response.getScraperId());

        // Return 202 Accepted (async operation)
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
