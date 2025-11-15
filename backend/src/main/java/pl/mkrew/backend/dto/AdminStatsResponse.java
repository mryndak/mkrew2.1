package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin dashboard statistics
 * Statystyki dla dashboardu panelu administracyjnego
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Admin dashboard statistics")
public class AdminStatsResponse {

    @Schema(
            description = "Total number of active RCKiK centers in the system",
            example = "21"
    )
    private Long totalRckikCenters;

    @Schema(
            description = "Total number of registered users (excluding soft-deleted)",
            example = "1543"
    )
    private Long totalUsers;

    @Schema(
            description = "Total number of verified users",
            example = "1234"
    )
    private Long verifiedUsers;

    @Schema(
            description = "System status",
            example = "OPERATIONAL",
            allowableValues = {"OPERATIONAL", "DEGRADED", "DOWN"}
    )
    private String systemStatus;
}
