package pl.mkrew.backend.dto;

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
@Schema(description = "User consent information")
public class ConsentDto {

    @Schema(description = "Consent version", example = "1.0")
    private String consentVersion;

    @Schema(description = "Consent type", example = "PRIVACY_POLICY")
    private String consentType;

    @Schema(description = "Whether consent was accepted", example = "true")
    private Boolean accepted;

    @Schema(description = "Timestamp when consent was given", example = "2025-01-08T10:30:00Z")
    private LocalDateTime consentTimestamp;
}
