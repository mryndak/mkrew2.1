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
@Schema(description = "Request to update user consent")
public class UpdateConsentRequest {

    @NotBlank(message = "Consent version is required")
    @Size(max = 20, message = "Consent version must not exceed 20 characters")
    @Schema(description = "Privacy policy version being accepted", example = "1.1", required = true)
    private String consentVersion;

    @NotNull(message = "Consent acceptance is required")
    @Schema(description = "Whether user accepts the privacy policy", example = "true", required = true)
    private Boolean accepted;
}
