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
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.UpdateUserReportRequest;
import pl.mkrew.backend.dto.UserReportDto;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.UserReportService;

/**
 * Admin controller for user report management
 * US-021: Zarządzanie zgłoszeniami problemów z danymi
 *
 * SECURITY: Requires ADMIN role for all endpoints
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Reports", description = "Admin endpoints for user report management")
@PreAuthorize("hasRole('ADMIN')") // Require ADMIN role for all methods in this controller
public class AdminReportController {

    private final UserReportService userReportService;

    /**
     * US-021: List all user reports
     * GET /api/v1/admin/reports
     *
     * Returns paginated list of user-submitted data quality reports with optional filters.
     * Admin only.
     *
     * @param status Optional status filter (NEW, IN_REVIEW, RESOLVED, REJECTED)
     * @param rckikId Optional RCKiK ID filter
     * @param pageable Pagination parameters
     * @return Page of UserReportDto
     */
    @Operation(
            summary = "List all user reports",
            description = "Get paginated list of user-submitted data quality reports. " +
                    "Supports filtering by status and RCKiK center. " +
                    "Admin authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Reports retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Invalid status value",
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
            )
    })
    @GetMapping
    public ResponseEntity<Page<UserReportDto>> listReports(
            @Parameter(description = "Filter by status", example = "NEW")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by RCKiK ID", example = "1")
            @RequestParam(required = false) Long rckikId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        log.info("GET /api/v1/admin/reports - List user reports (status: {}, rckikId: {})",
                status, rckikId);

        Page<UserReportDto> reports = userReportService.listReportsForAdmin(status, rckikId, pageable);

        log.info("Retrieved {} user reports (total: {})",
                reports.getNumberOfElements(), reports.getTotalElements());

        return ResponseEntity.ok(reports);
    }

    /**
     * US-021: Get user report details
     * GET /api/v1/admin/reports/{id}
     *
     * Returns detailed information about specific user report.
     * Admin only.
     *
     * @param id Report ID
     * @return UserReportDto
     */
    @Operation(
            summary = "Get user report details",
            description = "Get detailed information about specific user-submitted report. " +
                    "Includes user information, RCKiK details, description, screenshots, and admin notes. " +
                    "Admin authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Report retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserReportDto.class))
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
                    description = "Report not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserReportDto> getReportDetails(
            @Parameter(description = "Report ID", example = "701")
            @PathVariable Long id) {

        log.info("GET /api/v1/admin/reports/{} - Get report details", id);

        UserReportDto report = userReportService.getReportDetails(id);

        return ResponseEntity.ok(report);
    }

    /**
     * US-021: Update user report status
     * PATCH /api/v1/admin/reports/{id}
     *
     * Updates report status and adds admin notes.
     * Admin only.
     *
     * @param id Report ID
     * @param request Update data (status and/or adminNotes)
     * @return Updated UserReportDto
     */
    @Operation(
            summary = "Update report status",
            description = "Update report status and add admin notes. " +
                    "Status can be: NEW, IN_REVIEW, RESOLVED, or REJECTED. " +
                    "When status is changed to RESOLVED or REJECTED, resolvedBy and resolvedAt fields are automatically set. " +
                    "Admin authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Report updated successfully",
                    content = @Content(schema = @Schema(implementation = UserReportDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Invalid status or validation errors",
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
                    description = "Report not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PatchMapping("/{id}")
    public ResponseEntity<UserReportDto> updateReportStatus(
            @Parameter(description = "Report ID", example = "701")
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserReportRequest request) {

        Long adminUserId = SecurityUtils.getCurrentUserId();

        log.info("PATCH /api/v1/admin/reports/{} - Update report status to: {} by admin ID: {}",
                id, request.getStatus(), adminUserId);

        UserReportDto updatedReport = userReportService.updateReportStatus(id, request, adminUserId);

        log.info("Report ID: {} updated successfully to status: {}", id, updatedReport.getStatus());

        return ResponseEntity.ok(updatedReport);
    }
}
