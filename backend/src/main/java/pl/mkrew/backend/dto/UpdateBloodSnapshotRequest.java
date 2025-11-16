package pl.mkrew.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for updating manual blood snapshot (US-028)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBloodSnapshotRequest {

    @NotNull(message = "Level percentage is required")
    @DecimalMin(value = "0.00", message = "Level percentage must be at least 0.00")
    @DecimalMax(value = "100.00", message = "Level percentage must be at most 100.00")
    @Digits(integer = 3, fraction = 2, message = "Level percentage must have at most 3 integer digits and 2 decimal places")
    private BigDecimal levelPercentage;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
