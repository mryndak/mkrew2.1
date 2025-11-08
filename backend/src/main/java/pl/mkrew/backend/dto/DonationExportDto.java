package pl.mkrew.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Donation data for export (simplified format)")
public class DonationExportDto {

    @Schema(description = "Date of donation", example = "2025-01-08")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate donationDate;

    @Schema(description = "RCKiK center name", example = "RCKiK Warszawa")
    private String rckikName;

    @Schema(description = "City where center is located", example = "Warszawa")
    private String rckikCity;

    @Schema(description = "Quantity donated in milliliters", example = "450")
    private Integer quantityMl;

    @Schema(description = "Type of donation", example = "FULL_BLOOD")
    private String donationType;

    @Schema(description = "Optional notes", example = "Felt great")
    private String notes;

    @Schema(description = "Whether donation is confirmed", example = "true")
    private Boolean confirmed;
}
