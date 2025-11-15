package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.mkrew.backend.dto.AdminStatsResponse;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserRepository;

/**
 * Admin Statistics Controller
 * Endpoint for admin dashboard statistics
 *
 * SECURITY: Requires ADMIN role for all endpoints
 */
@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Statistics", description = "Admin dashboard statistics endpoints")
@PreAuthorize("hasRole('ADMIN')") // Require ADMIN role for all methods in this controller
public class AdminStatsController {

    private final RckikRepository rckikRepository;
    private final UserRepository userRepository;

    /**
     * Get admin dashboard statistics
     * GET /api/v1/admin/stats
     *
     * Returns basic statistics for admin dashboard:
     * - Total number of active RCKiK centers
     * - Total number of registered users
     * - Total number of verified users
     * - System status
     *
     * @return AdminStatsResponse
     */
    @Operation(
            summary = "Get admin dashboard statistics",
            description = "Returns basic statistics for admin dashboard including RCKiK centers count, users count, and system status",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Statistics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = AdminStatsResponse.class))
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
    public ResponseEntity<AdminStatsResponse> getAdminStats() {
        log.info("GET /api/v1/admin/stats - Getting admin dashboard statistics");

        // Count active RCKiK centers
        long totalRckikCenters = rckikRepository.countByActiveTrue();
        log.debug("Total active RCKiK centers: {}", totalRckikCenters);

        // Count total users (excluding soft-deleted)
        long totalUsers = userRepository.countActiveUsers();
        log.debug("Total active users: {}", totalUsers);

        // Count verified users
        long verifiedUsers = userRepository.countVerifiedUsers();
        log.debug("Total verified users: {}", verifiedUsers);

        // Build response
        AdminStatsResponse response = AdminStatsResponse.builder()
                .totalRckikCenters(totalRckikCenters)
                .totalUsers(totalUsers)
                .verifiedUsers(verifiedUsers)
                .systemStatus("OPERATIONAL") // For now, always return OPERATIONAL
                .build();

        log.info("Admin stats retrieved successfully");

        return ResponseEntity.ok(response);
    }
}
