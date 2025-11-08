package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Privacy policy information")
public class PrivacyPolicyResponse {

    @Schema(description = "Current privacy policy version", example = "1.0")
    private String version;

    @Schema(description = "Last update date of privacy policy", example = "2025-01-01")
    private String lastUpdated;

    @Schema(description = "Privacy policy content in HTML format")
    private String content;

    @Schema(description = "Brief summary of what data is collected")
    private String summary;
}
