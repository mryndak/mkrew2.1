package pl.mkrew.backend.dto;

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
@Schema(description = "Donation statistics for a user")
public class DonationStatisticsDto {

    @Schema(description = "Total number of donations", example = "12")
    private Long totalDonations;

    @Schema(description = "Total quantity donated in milliliters", example = "5400")
    private Long totalQuantityMl;

    @Schema(description = "Date of last donation", example = "2025-01-05")
    private LocalDate lastDonationDate;
}
