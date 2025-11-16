package pl.mkrew.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating/updating parser configuration (US-029, US-030)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParserConfigRequest {

    @NotNull(message = "RCKiK ID is required")
    @Positive(message = "RCKiK ID must be positive")
    private Long rckikId;

    @NotBlank(message = "Source URL is required")
    @Size(max = 2000, message = "Source URL must not exceed 2000 characters")
    @Pattern(regexp = "^https://.*", message = "Source URL must start with https://")
    private String sourceUrl;

    @NotBlank(message = "Parser type is required")
    @Pattern(regexp = "^(JSOUP|SELENIUM|CUSTOM)$", message = "Parser type must be one of: JSOUP, SELENIUM, CUSTOM")
    private String parserType;

    @NotBlank(message = "CSS selectors are required")
    private String cssSelectors; // JSON string

    @Builder.Default
    private Boolean active = true;

    @Pattern(
        regexp = "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\\d+(ns|us|µs|ms|s|m|h))+)|(((\\d+,)*\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*) ){4}((\\d+,)*\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*)$",
        message = "Invalid cron expression"
    )
    @Builder.Default
    private String scheduleCron = "0 2 * * *";

    @Min(value = 10, message = "Timeout must be at least 10 seconds")
    @Max(value = 120, message = "Timeout must be at most 120 seconds")
    @Builder.Default
    private Integer timeoutSeconds = 30;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
