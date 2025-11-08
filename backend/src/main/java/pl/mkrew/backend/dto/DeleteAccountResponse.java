package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response for account deletion request
 * US-016: Right to be Forgotten
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Account deletion response")
public class DeleteAccountResponse {

    @Schema(description = "Confirmation message", example = "Account deletion initiated. You will receive confirmation via email.")
    private String message;

    @Schema(description = "Timestamp when deletion was scheduled", example = "2025-01-08T15:00:00")
    private LocalDateTime deletionScheduledAt;
}
