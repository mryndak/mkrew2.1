package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Update notification preferences request")
public class UpdateNotificationPreferencesRequest {

    @NotNull(message = "Email enabled flag is required")
    @Schema(description = "Email notifications enabled", example = "true", required = true)
    private Boolean emailEnabled;

    @NotNull(message = "Email frequency is required")
    @Pattern(
            regexp = "^(DISABLED|ONLY_CRITICAL|DAILY|IMMEDIATE)$",
            message = "Email frequency must be one of: DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE"
    )
    @Schema(description = "Email notification frequency",
            example = "DAILY",
            allowableValues = {"DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"},
            required = true)
    private String emailFrequency;

    @NotNull(message = "In-app enabled flag is required")
    @Schema(description = "In-app notifications enabled", example = "true", required = true)
    private Boolean inAppEnabled;

    @NotNull(message = "In-app frequency is required")
    @Pattern(
            regexp = "^(DISABLED|ONLY_CRITICAL|DAILY|IMMEDIATE)$",
            message = "In-app frequency must be one of: DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE"
    )
    @Schema(description = "In-app notification frequency",
            example = "IMMEDIATE",
            allowableValues = {"DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"},
            required = true)
    private String inAppFrequency;
}
