package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to update an existing donation entry")
public class UpdateDonationRequest {

    @Min(value = 50, message = "Quantity must be at least 50 ml")
    @Max(value = 1000, message = "Quantity cannot exceed 1000 ml")
    @Schema(description = "Quantity donated in milliliters", example = "500", minimum = "50", maximum = "1000")
    private Integer quantityMl;

    @Pattern(
        regexp = "FULL_BLOOD|PLASMA|PLATELETS|OTHER",
        message = "Donation type must be one of: FULL_BLOOD, PLASMA, PLATELETS, OTHER"
    )
    @Schema(description = "Type of donation", example = "PLASMA", allowableValues = {"FULL_BLOOD", "PLASMA", "PLATELETS", "OTHER"})
    private String donationType;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    @Schema(description = "Optional notes about the donation", example = "Updated notes - felt better than expected", maxLength = 1000)
    private String notes;
}
