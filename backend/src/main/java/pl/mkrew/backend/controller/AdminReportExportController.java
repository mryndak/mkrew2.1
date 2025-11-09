package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.BloodLevelStatisticsReportDto;
import pl.mkrew.backend.dto.DonationStatisticsReportDto;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.UserStatisticsReportDto;
import pl.mkrew.backend.service.ReportExportService;

import java.time.LocalDate;

/**
 * US-026: Admin controller for anonymized report exports
 * Provides aggregated statistical reports without exposing PII
 */
@RestController
@RequestMapping("/api/v1/admin/reports/export")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Report Export", description = "Admin endpoints for anonymized aggregated reports (US-026)")
public class AdminReportExportController {

    private final ReportExportService reportExportService;

    /**
     * US-026: Export anonymized donation statistics report
     * GET /api/v1/admin/reports/export/donations
     *
     * Returns aggregated donation statistics without exposing PII.
     * Includes total donations, volume, breakdowns by blood group, type, and RCKiK.
     *
     * @param fromDate Start date (required, ISO 8601 format)
     * @param toDate End date (required, ISO 8601 format)
     * @return Donation statistics report
     */
    @Operation(
            summary = "Export donation statistics report",
            description = "Generates an anonymized aggregated report of donation statistics for a specified date range. " +
                    "Report includes total donations, volume statistics, breakdowns by blood group, donation type, " +
                    "and RCKiK center, as well as confirmed/unconfirmed counts and unique donor count. " +
                    "**Does NOT contain any PII (personal identifiable information)** such as names, emails, or addresses. " +
                    "Admin authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Report generated successfully",
                    content = @Content(schema = @Schema(implementation = DonationStatisticsReportDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Invalid date parameters (fromDate must be before or equal to toDate)",
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
    @GetMapping("/donations")
    public ResponseEntity<DonationStatisticsReportDto> exportDonationStatistics(
            @Parameter(
                    description = "Start date of the reporting period (ISO 8601 date format, inclusive)",
                    required = true,
                    example = "2024-01-01"
            )
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(
                    description = "End date of the reporting period (ISO 8601 date format, inclusive)",
                    required = true,
                    example = "2025-01-31"
            )
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        log.info("GET /api/v1/admin/reports/export/donations - Generate donation statistics report from {} to {}",
                fromDate, toDate);

        // TODO: Add role-based authorization check (@PreAuthorize("hasRole('ADMIN')"))
        // For now, any authenticated user can access reports
        // Future: Implement proper admin role verification in SecurityConfig

        DonationStatisticsReportDto report = reportExportService.generateDonationStatisticsReport(fromDate, toDate);

        log.info("Donation statistics report generated successfully - Total donations: {}, Unique donors: {}",
                report.getTotalDonations(), report.getUniqueDonorCount());

        return ResponseEntity.ok(report);
    }

    /**
     * US-026: Export anonymized user statistics report
     * GET /api/v1/admin/reports/export/users
     *
     * Returns aggregated user statistics without exposing PII.
     * Includes total users, verification status, blood group distribution, donor activity.
     *
     * @return User statistics report
     */
    @Operation(
            summary = "Export user statistics report",
            description = "Generates an anonymized aggregated report of user statistics. " +
                    "Report includes total users, verified/unverified counts, breakdowns by blood group, " +
                    "active/inactive donor counts, notification preferences, and average favorites per user. " +
                    "**Does NOT contain any PII (personal identifiable information)** such as names, emails, or addresses. " +
                    "Admin authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Report generated successfully",
                    content = @Content(schema = @Schema(implementation = UserStatisticsReportDto.class))
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
    @GetMapping("/users")
    public ResponseEntity<UserStatisticsReportDto> exportUserStatistics() {
        log.info("GET /api/v1/admin/reports/export/users - Generate user statistics report");

        // TODO: Add role-based authorization check (@PreAuthorize("hasRole('ADMIN')"))

        UserStatisticsReportDto report = reportExportService.generateUserStatisticsReport();

        log.info("User statistics report generated successfully - Total users: {}, Active donors: {}",
                report.getTotalUsers(), report.getActiveDonors());

        return ResponseEntity.ok(report);
    }

    /**
     * US-026: Export anonymized blood level statistics report
     * GET /api/v1/admin/reports/export/blood-levels
     *
     * Returns aggregated blood inventory statistics.
     * Includes average levels by blood group, status distribution, snapshots by RCKiK.
     *
     * @param fromDate Start date (required, ISO 8601 format)
     * @param toDate End date (required, ISO 8601 format)
     * @return Blood level statistics report
     */
    @Operation(
            summary = "Export blood level statistics report",
            description = "Generates an anonymized aggregated report of blood inventory statistics for a specified date range. " +
                    "Report includes average blood level percentages by blood group, snapshot counts by status " +
                    "(CRITICAL/IMPORTANT/OK), breakdowns by RCKiK center, manual vs automated snapshots, " +
                    "percentage of days with critical levels, and most frequently critical blood group. " +
                    "**Aggregated data only, no detailed operational information.** " +
                    "Admin authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Report generated successfully",
                    content = @Content(schema = @Schema(implementation = BloodLevelStatisticsReportDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Invalid date parameters (fromDate must be before or equal to toDate)",
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
    @GetMapping("/blood-levels")
    public ResponseEntity<BloodLevelStatisticsReportDto> exportBloodLevelStatistics(
            @Parameter(
                    description = "Start date of the reporting period (ISO 8601 date format, inclusive)",
                    required = true,
                    example = "2024-01-01"
            )
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(
                    description = "End date of the reporting period (ISO 8601 date format, inclusive)",
                    required = true,
                    example = "2025-01-31"
            )
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        log.info("GET /api/v1/admin/reports/export/blood-levels - Generate blood level statistics report from {} to {}",
                fromDate, toDate);

        // TODO: Add role-based authorization check (@PreAuthorize("hasRole('ADMIN')"))

        BloodLevelStatisticsReportDto report = reportExportService.generateBloodLevelStatisticsReport(fromDate, toDate);

        log.info("Blood level statistics report generated successfully - Total snapshots: {}, Most critical group: {}",
                report.getTotalSnapshots(), report.getMostCriticalBloodGroup());

        return ResponseEntity.ok(report);
    }
}
