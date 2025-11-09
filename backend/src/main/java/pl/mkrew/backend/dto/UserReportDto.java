package pl.mkrew.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User report details")
public class UserReportDto {

    @Schema(description = "Report ID", example = "701")
    private Long id;

    @Schema(description = "User who submitted the report")
    private UserSummaryDto user;

    @Schema(description = "Blood donation center ID", example = "1")
    private Long rckikId;

    @Schema(description = "Blood donation center name", example = "RCKiK Warszawa")
    private String rckikName;

    @Schema(description = "Blood snapshot ID reference", example = "1001")
    private Long bloodSnapshotId;

    @Schema(description = "Report description", example = "The blood level for A+ seems incorrect...")
    private String description;

    @Schema(description = "Screenshot URL", example = "https://storage.googleapis.com/...")
    private String screenshotUrl;

    @Schema(
        description = "Report status",
        example = "NEW",
        allowableValues = {"NEW", "IN_REVIEW", "RESOLVED", "REJECTED"}
    )
    private String status;

    @Schema(description = "Admin notes (visible only to admins)")
    private String adminNotes;

    @Schema(description = "Admin who resolved the report")
    private UserSummaryDto resolvedBy;

    @Schema(description = "Resolution timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime resolvedAt;

    @Schema(description = "Creation timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "User summary information")
    public static class UserSummaryDto {
        @Schema(description = "User ID", example = "123")
        private Long id;

        @Schema(description = "User email", example = "user@example.com")
        private String email;

        @Schema(description = "User first name", example = "Jan")
        private String firstName;

        @Schema(description = "User last name", example = "Kowalski")
        private String lastName;
    }
}
