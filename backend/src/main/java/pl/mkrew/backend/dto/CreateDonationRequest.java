package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new donation entry")
public class CreateDonationRequest {

    @NotNull(message = "RCKiK ID is required")
    @Schema(description = "Blood donation center ID", example = "1", required = true)
    private Long rckikId;

    @NotNull(message = "Donation date is required")
    @PastOrPresent(message = "Donation date cannot be in the future")
    @Schema(description = "Date of donation (ISO 8601 format)", example = "2025-01-08", required = true)
    private LocalDate donationDate;

    @NotNull(message = "Quantity is required")
    @Min(value = 50, message = "Quantity must be at least 50 ml")
    @Max(value = 1000, message = "Quantity cannot exceed 1000 ml")
    @Schema(description = "Quantity donated in milliliters", example = "450", required = true, minimum = "50", maximum = "1000")
    private Integer quantityMl;

    @NotBlank(message = "Donation type is required")
    @Pattern(
        regexp = "FULL_BLOOD|PLASMA|PLATELETS|OTHER",
        message = "Donation type must be one of: FULL_BLOOD, PLASMA, PLATELETS, OTHER"
    )
    @Schema(description = "Type of donation", example = "FULL_BLOOD", required = true, allowableValues = {"FULL_BLOOD", "PLASMA", "PLATELETS", "OTHER"})
    private String donationType;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    @Schema(description = "Optional notes about the donation", example = "Felt great, quick process", maxLength = 1000)
    private String notes;
}
