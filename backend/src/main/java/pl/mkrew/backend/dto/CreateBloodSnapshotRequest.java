package pl.mkrew.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for creating manual blood snapshot (US-028)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBloodSnapshotRequest {

    @NotNull(message = "RCKiK ID is required")
    @Positive(message = "RCKiK ID must be positive")
    private Long rckikId;

    @NotNull(message = "Snapshot date is required")
    @PastOrPresent(message = "Snapshot date cannot be in the future")
    private LocalDate snapshotDate;

    @NotBlank(message = "Blood group is required")
    @Pattern(
        regexp = "^(0[+-]|A[+-]|B[+-]|AB[+-])$",
        message = "Blood group must be one of: 0+, 0-, A+, A-, B+, B-, AB+, AB-"
    )
    private String bloodGroup;

    @NotNull(message = "Level percentage is required")
    @DecimalMin(value = "0.00", message = "Level percentage must be at least 0.00")
    @DecimalMax(value = "100.00", message = "Level percentage must be at most 100.00")
    @Digits(integer = 3, fraction = 2, message = "Level percentage must have at most 3 integer digits and 2 decimal places")
    private BigDecimal levelPercentage;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
