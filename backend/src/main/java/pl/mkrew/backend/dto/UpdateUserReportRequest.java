package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to update report status (admin only)")
public class UpdateUserReportRequest {

    @Pattern(
        regexp = "NEW|IN_REVIEW|RESOLVED|REJECTED",
        message = "Status must be one of: NEW, IN_REVIEW, RESOLVED, REJECTED"
    )
    @Schema(
        description = "Report status",
        example = "RESOLVED",
        allowableValues = {"NEW", "IN_REVIEW", "RESOLVED", "REJECTED"}
    )
    private String status;

    @Size(max = 2000, message = "Admin notes cannot exceed 2000 characters")
    @Schema(
        description = "Admin notes about the report resolution",
        example = "Verified with RCKiK. Data was correct, updated scraper to better handle edge cases.",
        maxLength = 2000
    )
    private String adminNotes;
}
