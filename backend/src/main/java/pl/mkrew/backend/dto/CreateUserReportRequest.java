package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new data quality issue report")
public class CreateUserReportRequest {

    @NotNull(message = "RCKiK ID is required")
    @Schema(description = "Blood donation center ID", example = "1", required = true)
    private Long rckikId;

    @Schema(description = "Optional reference to specific blood snapshot", example = "1001")
    private Long bloodSnapshotId;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Schema(
        description = "Description of the data quality issue",
        example = "The blood level for A+ seems incorrect. Yesterday it was 50%, today it shows 10% which seems unlikely.",
        required = true,
        maxLength = 2000
    )
    private String description;

    @Size(max = 2048, message = "Screenshot URL cannot exceed 2048 characters")
    @Schema(
        description = "Optional URL to screenshot (Cloud Storage URL)",
        example = "https://storage.googleapis.com/mkrew-uploads/screenshots/abc123.png",
        maxLength = 2048
    )
    private String screenshotUrl;
}
