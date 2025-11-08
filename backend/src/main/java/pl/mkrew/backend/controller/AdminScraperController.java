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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.*;
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

    /**
     * US-018: List scraper runs
     * GET /api/v1/admin/scraper/runs
     *
     * Returns paginated list of scraper execution runs for monitoring.
     *
     * @param pageable Pagination parameters
     * @return Page of ScraperRunDto
     */
    @Operation(
            summary = "List scraper runs",
            description = "Get paginated list of scraper execution runs for monitoring and alerting purposes",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Scraper runs retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))
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
            )
    })
    @GetMapping("/runs")
    public ResponseEntity<Page<ScraperRunDto>> listScraperRuns(
            @PageableDefault(size = 20, sort = "startedAt") Pageable pageable) {

        log.info("GET /api/v1/admin/scraper/runs - List scraper runs");

        Page<ScraperRunDto> runs = scraperService.listScraperRuns(pageable);

        log.info("Retrieved {} scraper runs", runs.getTotalElements());

        return ResponseEntity.ok(runs);
    }

    /**
     * US-018: Get scraper run details
     * GET /api/v1/admin/scraper/runs/{id}
     *
     * Returns detailed information about specific scraper run including logs.
     *
     * @param id Scraper run ID
     * @return ScraperRunDetailsDto
     */
    @Operation(
            summary = "Get scraper run details",
            description = "Get detailed information about specific scraper run including associated logs",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Scraper run details retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ScraperRunDetailsDto.class))
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
                    description = "Scraper run not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/runs/{id}")
    public ResponseEntity<ScraperRunDetailsDto> getScraperRunDetails(@PathVariable Long id) {

        log.info("GET /api/v1/admin/scraper/runs/{} - Get scraper run details", id);

        ScraperRunDetailsDto details = scraperService.getScraperRunDetails(id);

        log.info("Retrieved scraper run details for ID: {}", id);

        return ResponseEntity.ok(details);
    }

    /**
     * US-018: List scraper logs
     * GET /api/v1/admin/scraper/logs
     *
     * Returns paginated list of scraper logs across all runs.
     * Useful for exporting and analyzing scraper errors.
     *
     * @param pageable Pagination parameters
     * @return Page of ScraperLogDto
     */
    @Operation(
            summary = "List scraper logs",
            description = "Get paginated list of scraper logs across all runs for error analysis and export",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Scraper logs retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))
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
            )
    })
    @GetMapping("/logs")
    public ResponseEntity<Page<ScraperLogDto>> listScraperLogs(
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable) {

        log.info("GET /api/v1/admin/scraper/logs - List scraper logs");

        Page<ScraperLogDto> logs = scraperService.listScraperLogs(pageable);

        log.info("Retrieved {} scraper logs", logs.getTotalElements());

        return ResponseEntity.ok(logs);
    }
}
