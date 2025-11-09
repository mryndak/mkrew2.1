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
import pl.mkrew.backend.dto.AuditLogResponse;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.service.AuditLogService;

import java.time.LocalDate;

/**
 * Admin controller for audit log management
 * US-024: Audit Trail
 */
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Audit Logs", description = "Admin endpoints for viewing immutable audit trail of critical operations")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    /**
     * US-024: Get immutable audit log entries for critical operations
     * GET /api/v1/admin/audit-logs
     *
     * Returns paginated list of audit logs with optional filters. Audit logs are
     * immutable records of critical operations such as account deletion, donation
     * deletion, and RCKiK management. Used for compliance and accountability.
     *
     * @param actorId Filter by actor ID (user ID or "SYSTEM") - optional
     * @param action Filter by action type (e.g., "DONATION_DELETED", "RCKIK_UPDATED") - optional
     * @param targetType Filter by target entity type (e.g., "donation", "user", "rckik") - optional
     * @param targetId Filter by target entity ID - optional
     * @param fromDate Filter by start date (inclusive) - optional
     * @param toDate Filter by end date (inclusive) - optional
     * @param page Page number (zero-based, default: 0)
     * @param size Page size (default: 50, max: 100)
     * @return Paginated audit log response
     */
    @Operation(
            summary = "List audit logs with optional filters",
            description = "Get immutable audit log entries for critical operations. " +
                    "Supports filtering by actor, action type, target type/ID, and date range. " +
                    "Audit logs track critical operations like account deletion, donation deletion, " +
                    "and RCKiK management for compliance and accountability. " +
                    "Results are paginated and sorted by creation date (newest first).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Audit logs retrieved successfully",
                    content = @Content(schema = @Schema(implementation = AuditLogResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Invalid query parameters (e.g., fromDate after toDate, invalid page/size)",
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
    public ResponseEntity<AuditLogResponse> getAuditLogs(
            @Parameter(
                    description = "Filter by actor ID (user ID or 'SYSTEM')",
                    example = "admin@mkrew.pl"
            )
            @RequestParam(required = false)
            String actorId,

            @Parameter(
                    description = "Filter by action type. Common actions: DONATION_DELETED, ACCOUNT_DELETED, " +
                            "RCKIK_CREATED, RCKIK_UPDATED, RCKIK_DELETED, DONATION_UPDATED",
                    example = "RCKIK_UPDATED"
            )
            @RequestParam(required = false)
            String action,

            @Parameter(
                    description = "Filter by target entity type. Common types: donation, user, rckik",
                    example = "rckik"
            )
            @RequestParam(required = false)
            String targetType,

            @Parameter(
                    description = "Filter by target entity ID",
                    example = "1"
            )
            @RequestParam(required = false)
            Long targetId,

            @Parameter(
                    description = "Filter by start date (ISO 8601 date format, inclusive)",
                    example = "2025-01-01"
            )
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(
                    description = "Filter by end date (ISO 8601 date format, inclusive)",
                    example = "2025-01-08"
            )
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @Parameter(
                    description = "Page number (zero-based)",
                    example = "0"
            )
            @RequestParam(defaultValue = "0")
            int page,

            @Parameter(
                    description = "Page size (max: 100)",
                    example = "50"
            )
            @RequestParam(defaultValue = "50")
            int size
    ) {

        log.info("GET /api/v1/admin/audit-logs - actorId: {}, action: {}, targetType: {}, " +
                        "targetId: {}, fromDate: {}, toDate: {}, page: {}, size: {}",
                actorId, action, targetType, targetId, fromDate, toDate, page, size);

        // TODO: Add role-based authorization check
        // For now, any authenticated user can access audit logs
        // Future: Add @PreAuthorize("hasRole('ADMIN')") or configure in SecurityConfig

        // Validate page and size
        if (page < 0) {
            log.warn("Invalid page number: {}", page);
            throw new IllegalArgumentException("Page number must be >= 0");
        }

        if (size <= 0 || size > 100) {
            log.warn("Invalid page size: {}", size);
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }

        // Validate date range
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            log.warn("Invalid date range: fromDate ({}) is after toDate ({})", fromDate, toDate);
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }

        // Get audit logs from service
        AuditLogResponse response = auditLogService.getAuditLogs(
                actorId,
                action,
                targetType,
                targetId,
                fromDate,
                toDate,
                page,
                size
        );

        log.info("Audit logs retrieved successfully - Total: {}, Page: {}/{}",
                response.getTotalElements(),
                response.getPage() + 1,
                response.getTotalPages());

        return ResponseEntity.ok(response);
    }
}
