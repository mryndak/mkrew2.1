package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * US-026: Anonymized user statistics report
 * Contains aggregated user data without exposing PII
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Anonymized user statistics report - aggregated data without PII")
public class UserStatisticsReportDto {

    @Schema(description = "Total number of registered users", example = "1500")
    private Long totalUsers;

    @Schema(description = "Number of users with verified email", example = "1350")
    private Long verifiedUsers;

    @Schema(description = "Number of unverified users", example = "150")
    private Long unverifiedUsers;

    @Schema(description = "Number of users by blood group (e.g., 'A+': 450)", example = "{'A+': 450, '0+': 500}")
    private Map<String, Long> usersByBloodGroup;

    @Schema(description = "Number of users with at least one donation", example = "800")
    private Long activeDonors;

    @Schema(description = "Number of users with no donations yet", example = "700")
    private Long inactiveDonors;

    @Schema(description = "Number of users with email notifications enabled", example = "1200")
    private Long usersWithEmailNotifications;

    @Schema(description = "Number of users with in-app notifications enabled", example = "1400")
    private Long usersWithInAppNotifications;

    @Schema(description = "Average number of favorite RCKiK centers per user", example = "2.3")
    private Double averageFavoritesPerUser;
}
