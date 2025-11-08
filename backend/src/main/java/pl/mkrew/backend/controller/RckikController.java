package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.BloodLevelHistoryResponse;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.RckikDetailDto;
import pl.mkrew.backend.dto.RckikListResponse;
import pl.mkrew.backend.service.RckikService;

@RestController
@RequestMapping("/api/v1/rckik")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "RCKiK Blood Centers", description = "Public endpoints for blood donation centers and blood levels")
public class RckikController {

    private final RckikService rckikService;

    /**
     * US-007: List RCKiK Centers with current blood levels
     * GET /api/v1/rckik
     *
     * Returns paginated list of blood donation centers with current blood levels.
     * Public endpoint - no authentication required.
     *
     * @param page Page number (zero-based, default: 0)
     * @param size Page size (default: 20, max: 100)
     * @param city Optional city filter
     * @param active Optional active status filter (default: true)
     * @param sortBy Sort field (name, city, code, default: name)
     * @param sortOrder Sort order (ASC, DESC, default: ASC)
     * @return RckikListResponse with pagination
     */
    @Operation(
            summary = "List blood donation centers",
            description = "Returns paginated list of RCKiK blood donation centers with current blood levels. " +
                    "Public endpoint - no authentication required. " +
                    "Blood level status: CRITICAL (<20%), IMPORTANT (<50%), OK (>=50%). " +
                    "Data comes from latest daily snapshot."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "List retrieved successfully",
                    content = @Content(schema = @Schema(implementation = RckikListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request parameters",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping
    public ResponseEntity<RckikListResponse> listRckikCenters(
            @Parameter(description = "Page number (zero-based)", example = "0")
            @RequestParam(required = false, defaultValue = "0") Integer page,

            @Parameter(description = "Page size (max 100)", example = "20")
            @RequestParam(required = false, defaultValue = "20") Integer size,

            @Parameter(description = "Filter by city", example = "Warszawa")
            @RequestParam(required = false) String city,

            @Parameter(description = "Filter by active status (default: true)", example = "true")
            @RequestParam(required = false, defaultValue = "true") Boolean active,

            @Parameter(description = "Sort field (name, city, code)", example = "name")
            @RequestParam(required = false, defaultValue = "name") String sortBy,

            @Parameter(description = "Sort order (ASC, DESC)", example = "ASC")
            @RequestParam(required = false, defaultValue = "ASC") String sortOrder) {

        log.info("GET /api/v1/rckik - List RCKiK centers request - page: {}, size: {}, city: {}, active: {}, sortBy: {}, sortOrder: {}",
                page, size, city, active, sortBy, sortOrder);

        RckikListResponse response = rckikService.getRckikList(page, size, city, active, sortBy, sortOrder);

        log.info("RCKiK list retrieved successfully - {} centers on page {}",
                response.getContent().size(), page);

        return ResponseEntity.ok(response);
    }

    /**
     * US-008: Get RCKiK Center Details
     * GET /api/v1/rckik/{id}
     *
     * Returns detailed information about specific blood donation center including
     * current blood levels, scraping status, and metadata.
     * Public endpoint - no authentication required.
     *
     * @param id RCKiK ID
     * @return RckikDetailDto
     */
    @Operation(
            summary = "Get blood center details",
            description = "Returns detailed information about specific RCKiK blood donation center including " +
                    "current blood levels for all blood groups, scraping status, location, and metadata. " +
                    "Public endpoint - no authentication required."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Center details retrieved successfully",
                    content = @Content(schema = @Schema(implementation = RckikDetailDto.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<RckikDetailDto> getRckikDetail(
            @Parameter(description = "RCKiK center ID", example = "1")
            @PathVariable Long id) {

        log.info("GET /api/v1/rckik/{} - Get RCKiK center details", id);

        RckikDetailDto response = rckikService.getRckikDetail(id);

        log.info("RCKiK center details retrieved successfully for ID: {}", id);

        return ResponseEntity.ok(response);
    }

    /**
     * US-008: Get Blood Level History for RCKiK Center
     * GET /api/v1/rckik/{id}/blood-levels
     *
     * Returns historical blood level snapshots for a specific center with optional filters.
     * Supports filtering by blood group and date range, with pagination.
     * Public endpoint - no authentication required.
     *
     * @param id RCKiK ID
     * @param bloodGroup Optional blood group filter
     * @param fromDate Optional start date (ISO 8601 format)
     * @param toDate Optional end date (ISO 8601 format)
     * @param page Page number (zero-based, default: 0)
     * @param size Page size (default: 30, max: 100)
     * @return BloodLevelHistoryResponse with pagination
     */
    @Operation(
            summary = "Get blood level history",
            description = "Returns historical blood level snapshots for a specific RCKiK center. " +
                    "Supports filtering by blood group and date range. " +
                    "Results are paginated and ordered by snapshot date descending. " +
                    "Public endpoint - no authentication required."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "History retrieved successfully",
                    content = @Content(schema = @Schema(implementation = BloodLevelHistoryResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request parameters",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}/blood-levels")
    public ResponseEntity<BloodLevelHistoryResponse> getBloodLevelHistory(
            @Parameter(description = "RCKiK center ID", example = "1")
            @PathVariable Long id,

            @Parameter(description = "Filter by blood group", example = "A+")
            @RequestParam(required = false) String bloodGroup,

            @Parameter(description = "Start date (ISO 8601 format: YYYY-MM-DD)", example = "2024-12-01")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate fromDate,

            @Parameter(description = "End date (ISO 8601 format: YYYY-MM-DD)", example = "2025-01-08")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate toDate,

            @Parameter(description = "Page number (zero-based)", example = "0")
            @RequestParam(required = false, defaultValue = "0") Integer page,

            @Parameter(description = "Page size (max 100)", example = "30")
            @RequestParam(required = false, defaultValue = "30") Integer size) {

        log.info("GET /api/v1/rckik/{}/blood-levels - bloodGroup: {}, fromDate: {}, toDate: {}, page: {}, size: {}",
                id, bloodGroup, fromDate, toDate, page, size);

        BloodLevelHistoryResponse response = rckikService.getBloodLevelHistory(
                id, bloodGroup, fromDate, toDate, page, size);

        log.info("Blood level history retrieved successfully for RCKiK ID: {} - {} snapshots on page {}",
                id, response.getSnapshots().size(), page);

        return ResponseEntity.ok(response);
    }
}
