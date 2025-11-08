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
import pl.mkrew.backend.dto.CreateDonationRequest;
import pl.mkrew.backend.dto.DonationListResponse;
import pl.mkrew.backend.dto.DonationResponse;
import pl.mkrew.backend.dto.ErrorResponse;
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
}
