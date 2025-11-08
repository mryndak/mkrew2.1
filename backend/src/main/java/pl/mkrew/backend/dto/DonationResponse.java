package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Donation entry details")
public class DonationResponse {

    @Schema(description = "Donation unique identifier", example = "501")
    private Long id;

    @Schema(description = "Blood donation center where donation occurred")
    private RckikBasicDto rckik;

    @Schema(description = "Date of donation", example = "2025-01-05")
    private LocalDate donationDate;

    @Schema(description = "Quantity donated in milliliters", example = "450")
    private Integer quantityMl;

    @Schema(description = "Type of donation", example = "FULL_BLOOD", allowableValues = {"FULL_BLOOD", "PLASMA", "PLATELETS", "OTHER"})
    private String donationType;

    @Schema(description = "Optional notes about the donation", example = "Czułem się dobrze po donacji")
    private String notes;

    @Schema(description = "Whether donation is confirmed", example = "true")
    private Boolean confirmed;

    @Schema(description = "Timestamp when donation entry was created", example = "2025-01-05T14:30:00Z")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when donation entry was last updated", example = "2025-01-05T14:30:00Z")
    private LocalDateTime updatedAt;
}
