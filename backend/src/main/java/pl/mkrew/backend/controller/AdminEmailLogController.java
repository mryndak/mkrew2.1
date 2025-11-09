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
import pl.mkrew.backend.dto.EmailMetricsResponse;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.service.EmailLogService;

import java.time.LocalDate;

/**
 * Admin controller for email log analytics
 * US-022: Email Deliverability Metrics
 */
@RestController
@RequestMapping("/api/v1/admin/email-logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Email Logs", description = "Admin endpoints for email deliverability metrics and analytics")
public class AdminEmailLogController {

    private final EmailLogService emailLogService;

    /**
     * US-022: Get email deliverability metrics
     * GET /api/v1/admin/email-logs/metrics
     *
     * Returns email deliverability statistics including bounce rate, open rate,
     * and delivery rate for a specified period. Optionally filter by notification
     * type and RCKiK center.
     *
     * @param fromDate         Start date (required, ISO 8601 date format)
     * @param toDate           End date (required, ISO 8601 date format)
     * @param notificationType Notification type filter (optional)
     * @param rckikId          RCKiK ID filter (optional)
     * @return EmailMetricsResponse with aggregated metrics and breakdown by type
     */
    @Operation(
            summary = "Get email deliverability metrics",
            description = "Returns aggregated email deliverability statistics (bounce rate, open rate, delivery rate) " +
                    "for a specified date range. Provides overall metrics and breakdown by notification type. " +
                    "Optionally filter by notification type or RCKiK center. " +
                    "Used by product owners to assess email notification effectiveness.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Email metrics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = EmailMetricsResponse.class))
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
    @GetMapping("/metrics")
    public ResponseEntity<EmailMetricsResponse> getEmailMetrics(
            @Parameter(
                    description = "Start date of the period (ISO 8601 date format, inclusive)",
                    required = true,
                    example = "2025-01-01"
            )
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(
                    description = "End date of the period (ISO 8601 date format, inclusive)",
                    required = true,
                    example = "2025-01-08"
            )
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @Parameter(
                    description = "Filter by notification type (optional). Examples: CRITICAL_ALERT, DAILY_SUMMARY, VERIFICATION, PASSWORD_RESET",
                    example = "CRITICAL_ALERT"
            )
            @RequestParam(required = false)
            String notificationType,

            @Parameter(
                    description = "Filter by RCKiK center ID (optional)",
                    example = "1"
            )
            @RequestParam(required = false)
            Long rckikId
    ) {

        log.info("GET /api/v1/admin/email-logs/metrics - fromDate: {}, toDate: {}, type: {}, rckikId: {}",
                fromDate, toDate, notificationType, rckikId);

        // TODO: Add role-based authorization check
        // For now, any authenticated user can access email metrics
        // Future: Add @PreAuthorize("hasRole('ADMIN')") or configure in SecurityConfig

        // Validate date range
        if (fromDate.isAfter(toDate)) {
            log.warn("Invalid date range: fromDate ({}) is after toDate ({})", fromDate, toDate);
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }

        // Get metrics from service
        EmailMetricsResponse metrics = emailLogService.getEmailMetrics(
                fromDate, toDate, notificationType, rckikId);

        log.info("Email metrics retrieved successfully - Total sent: {}, Delivery rate: {}%",
                metrics.getMetrics().getTotalSent(),
                metrics.getMetrics().getDeliveryRate());

        return ResponseEntity.ok(metrics);
    }
}
