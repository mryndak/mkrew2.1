package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.DonationService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/users/me/donations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Donation Diary", description = "User donation diary management endpoints")
public class DonationController {

    private final DonationService donationService;

    /**
     * US-012: Get user's donation history
     * GET /api/v1/users/me/donations
     *
     * Returns paginated list of user's donations with optional filters.
     * Authentication required.
     *
     * @param fromDate Optional start date filter (ISO 8601)
     * @param toDate Optional end date filter (ISO 8601)
     * @param rckikId Optional RCKiK center filter
     * @param page Page number (zero-based, default: 0)
     * @param size Page size (default: 20, max: 100)
     * @param sortBy Sort field (default: donationDate)
     * @param sortOrder Sort order (ASC or DESC, default: DESC)
     * @return Paginated donation list with statistics
     */
    @Operation(
            summary = "Get donation history",
            description = "Returns paginated list of authenticated user's donation history with statistics. " +
                    "Supports filtering by date range and RCKiK center. " +
                    "Donations are ordered by donation date (descending by default). " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Donation history retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DonationListResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Invalid date range or parameters",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping
    public ResponseEntity<DonationListResponse> getUserDonations(
            @Parameter(description = "Start date for filtering (ISO 8601)", example = "2024-01-01")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(description = "End date for filtering (ISO 8601)", example = "2025-01-31")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @Parameter(description = "Filter by RCKiK center ID", example = "1")
            @RequestParam(required = false)
            Long rckikId,

            @Parameter(description = "Page number (zero-based)", example = "0")
            @RequestParam(defaultValue = "0")
            int page,

            @Parameter(description = "Page size (max 100)", example = "20")
            @RequestParam(defaultValue = "20")
            int size,

            @Parameter(description = "Field to sort by", example = "donationDate")
            @RequestParam(defaultValue = "donationDate")
            String sortBy,

            @Parameter(description = "Sort order (ASC or DESC)", example = "DESC")
            @RequestParam(defaultValue = "DESC")
            String sortOrder) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/donations - Get donations for user ID: {} " +
                        "(fromDate: {}, toDate: {}, rckikId: {}, page: {}, size: {})",
                userId, fromDate, toDate, rckikId, page, size);

        // Validate parameters
        if (size > 100) {
            size = 100;
            log.warn("Page size exceeds maximum (100), adjusted to 100");
        }

        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate");
        }

        // Create pageable with sorting
        Sort.Direction direction = sortOrder.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        DonationListResponse response = donationService.getUserDonations(userId, fromDate, toDate, rckikId, pageable);

        log.info("Retrieved {} donations for user ID: {} (page {}/{})",
                response.getDonations().size(), userId, page + 1, response.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * US-012: Create new donation entry
     * POST /api/v1/users/me/donations
     *
     * Adds a new donation entry to user's diary.
     * Authentication required.
     *
     * @param request Donation data
     * @return Created donation
     */
    @Operation(
            summary = "Create donation entry",
            description = "Adds a new donation entry to authenticated user's diary. " +
                    "Donation is created with confirmed=false by default. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Donation created successfully",
                    content = @Content(schema = @Schema(implementation = DonationResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Validation errors or invalid data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User or RCKiK center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<DonationResponse> createDonation(
            @Parameter(description = "Donation entry data", required = true)
            @Valid @RequestBody CreateDonationRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("POST /api/v1/users/me/donations - Create donation for user ID: {} at RCKiK ID: {} on date: {}",
                userId, request.getRckikId(), request.getDonationDate());

        DonationResponse response = donationService.createDonation(userId, request);

        log.info("Created donation ID: {} for user ID: {}", response.getId(), userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get single donation by ID
     * GET /api/v1/users/me/donations/{id}
     *
     * Returns details of a specific donation.
     * Authentication required. User must own the donation.
     *
     * @param id Donation ID
     * @return Donation details
     */
    @Operation(
            summary = "Get donation by ID",
            description = "Returns details of a specific donation. " +
                    "User must be the owner of the donation. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Donation retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DonationResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not own this donation",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Donation not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<DonationResponse> getDonationById(
            @Parameter(description = "Donation ID", example = "501")
            @PathVariable Long id) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/donations/{} - Get donation for user ID: {}", id, userId);

        DonationResponse response = donationService.getDonationById(userId, id);

        log.info("Retrieved donation ID: {} for user ID: {}", id, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * US-013: Update donation entry
     * PATCH /api/v1/users/me/donations/{id}
     *
     * Updates an existing donation entry (partial update).
     * Authentication required. User must own the donation.
     *
     * @param id Donation ID
     * @param request Update data (only provided fields will be updated)
     * @return Updated donation
     */
    @Operation(
            summary = "Update donation entry",
            description = "Updates an existing donation entry. Only provided fields will be updated (partial update). " +
                    "User must be the owner of the donation. " +
                    "Cannot change rckikId or donationDate per business rules. " +
                    "Creates audit log entry for tracking changes. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Donation updated successfully",
                    content = @Content(schema = @Schema(implementation = DonationResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Validation errors",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not own this donation",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Donation not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PatchMapping("/{id}")
    public ResponseEntity<DonationResponse> updateDonation(
            @Parameter(description = "Donation ID to update", example = "502")
            @PathVariable Long id,

            @Parameter(description = "Donation update data", required = true)
            @Valid @RequestBody UpdateDonationRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("PATCH /api/v1/users/me/donations/{} - Update donation for user ID: {}", id, userId);

        DonationResponse response = donationService.updateDonation(userId, id, request);

        log.info("Updated donation ID: {} for user ID: {}", id, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * US-013: Delete donation entry
     * DELETE /api/v1/users/me/donations/{id}
     *
     * Soft deletes a donation entry.
     * Authentication required. User must own the donation.
     *
     * @param id Donation ID
     * @return No content
     */
    @Operation(
            summary = "Delete donation entry",
            description = "Soft deletes a donation entry by setting deleted_at timestamp. " +
                    "User must be the owner of the donation. " +
                    "Creates audit log entry with donation data before deletion. " +
                    "This operation should require confirmation in the UI. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Donation deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not own this donation",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Donation not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDonation(
            @Parameter(description = "Donation ID to delete", example = "502")
            @PathVariable Long id) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("DELETE /api/v1/users/me/donations/{} - Delete donation for user ID: {}", id, userId);

        donationService.deleteDonation(userId, id);

        log.info("Deleted donation ID: {} for user ID: {}", id, userId);

        return ResponseEntity.noContent().build();
    }

    /**
     * US-014: Export donation history
     * GET /api/v1/users/me/donations/export
     *
     * Exports user's donation history to CSV or JSON format.
     * Authentication required.
     *
     * @param format Export format (csv or json)
     * @param fromDate Optional start date filter
     * @param toDate Optional end date filter
     * @return Exported data
     */
    @Operation(
            summary = "Export donation history",
            description = "Exports authenticated user's donation history to CSV or JSON format. " +
                    "Supports filtering by date range. " +
                    "For MVP: synchronous generation. " +
                    "Future: async with download link for large datasets. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Export generated successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Invalid format parameter",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/export")
    public ResponseEntity<?> exportDonations(
            @Parameter(description = "Export format (csv or json)", example = "csv", required = true)
            @RequestParam String format,

            @Parameter(description = "Start date for filtering (ISO 8601)", example = "2024-01-01")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(description = "End date for filtering (ISO 8601)", example = "2025-01-31")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/donations/export?format={} - Export donations for user ID: {} " +
                        "(fromDate: {}, toDate: {})",
                format, userId, fromDate, toDate);

        // Validate format parameter
        if (!format.equalsIgnoreCase("csv") && !format.equalsIgnoreCase("json")) {
            throw new IllegalArgumentException("Invalid format parameter. Must be 'csv' or 'json'");
        }

        // Validate date range
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate");
        }

        String timestamp = LocalDate.now().toString().replace("-", "");

        if (format.equalsIgnoreCase("csv")) {
            // Export to CSV
            String csvData = donationService.exportDonationsToCsv(userId, fromDate, toDate);

            String filename = "donations_export_" + timestamp + ".csv";

            log.info("Exported donations to CSV for user ID: {} - filename: {}", userId, filename);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvData);
        } else {
            // Export to JSON
            DonationExportResponse jsonData = donationService.exportDonationsToJson(userId, fromDate, toDate);

            String filename = "donations_export_" + timestamp + ".json";

            log.info("Exported donations to JSON for user ID: {} - filename: {}", userId, filename);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonData);
        }
    }
}
