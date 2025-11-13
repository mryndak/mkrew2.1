package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for email availability check
 * US-001: User Registration - Email Uniqueness Check
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailAvailabilityResponse {

    /**
     * Whether the email is available for registration
     * true = available (email does not exist)
     * false = not available (email already exists)
     */
    private Boolean available;
}
