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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.CreateUserReportRequest;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.UserReportDto;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.UserReportService;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Reports", description = "Data quality issue reporting endpoints")
public class UserReportController {

    private final UserReportService userReportService;

    /**
     * US-021: Submit data quality issue report
     * POST /api/v1/reports
     *
     * Allows authenticated users to report data quality issues for RCKiK centers.
     * Reports can optionally reference specific blood snapshots and include screenshots.
     *
     * @param request Report data
     * @return Created report details
     */
    @Operation(
            summary = "Submit data quality report",
            description = "Submit a report about data quality issues with RCKiK blood level data. " +
                    "Users can report incorrect, missing, or suspicious data. " +
                    "Optional screenshot URL can be provided (must be uploaded to Cloud Storage first). " +
                    "Report is created with status 'NEW' and admin team will be notified. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Report created successfully",
                    content = @Content(schema = @Schema(implementation = UserReportDto.class))
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
                    description = "RCKiK or blood snapshot not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<UserReportDto> createReport(
            @Valid @RequestBody CreateUserReportRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("User ID: {} creating data quality report for RCKiK ID: {}", userId, request.getRckikId());

        UserReportDto createdReport = userReportService.createReport(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdReport);
    }

    /**
     * Get user's own reports
     * GET /api/v1/reports
     *
     * Returns paginated list of reports created by the authenticated user.
     *
     * @param page Page number (zero-based, default: 0)
     * @param size Page size (default: 20, max: 100)
     * @return Paginated list of user's reports
     */
    @Operation(
            summary = "Get user's own reports",
            description = "Returns paginated list of reports created by the authenticated user. " +
                    "Users can view status and admin responses to their reports. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Reports retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))
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
    public ResponseEntity<Page<UserReportDto>> getUserReports(
            @Parameter(description = "Page number (zero-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("User ID: {} retrieving their reports", userId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserReportDto> reports = userReportService.listUserReports(userId, pageable);

        return ResponseEntity.ok(reports);
    }
}
