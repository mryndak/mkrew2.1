package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for resending email verification
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResendVerificationResponse {

    /**
     * Success message
     */
    private String message;
}
