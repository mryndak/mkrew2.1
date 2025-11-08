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
@Schema(description = "User notification preferences response")
public class NotificationPreferencesResponse {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "User ID", example = "123")
    private Long userId;

    @Schema(description = "Email notifications enabled", example = "true")
    private Boolean emailEnabled;

    @Schema(description = "Email notification frequency",
            example = "ONLY_CRITICAL",
            allowableValues = {"DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"})
    private String emailFrequency;

    @Schema(description = "In-app notifications enabled", example = "true")
    private Boolean inAppEnabled;

    @Schema(description = "In-app notification frequency",
            example = "IMMEDIATE",
            allowableValues = {"DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"})
    private String inAppFrequency;

    @Schema(description = "Creation timestamp", example = "2025-01-01T10:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp", example = "2025-01-05T12:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
