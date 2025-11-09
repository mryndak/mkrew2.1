package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

/**
 * US-026: Anonymized donation statistics report
 * Contains aggregated donation data without exposing PII
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Anonymized donation statistics report - aggregated data without PII")
public class DonationStatisticsReportDto {

    @Schema(description = "Total number of donations in the period", example = "1250")
    private Long totalDonations;

    @Schema(description = "Total volume donated in milliliters", example = "562500")
    private Long totalVolumeMl;

    @Schema(description = "Average volume per donation in milliliters", example = "450.0")
    private Double averageVolumeMl;

    @Schema(description = "Number of donations by blood group (e.g., 'A+': 300)")
    private Map<String, Long> donationsByBloodGroup;

    @Schema(description = "Number of donations by donation type (e.g., 'FULL_BLOOD': 800)")
    private Map<String, Long> donationsByType;

    @Schema(description = "Number of donations by RCKiK center (e.g., 'RCKiK Warszawa': 450)")
    private Map<String, Long> donationsByRckik;

    @Schema(description = "Number of confirmed donations", example = "1100")
    private Long confirmedDonations;

    @Schema(description = "Number of unconfirmed donations", example = "150")
    private Long unconfirmedDonations;

    @Schema(description = "Start date of the reporting period", example = "2024-01-01")
    private LocalDate fromDate;

    @Schema(description = "End date of the reporting period", example = "2025-01-31")
    private LocalDate toDate;

    @Schema(description = "Total number of unique donors (anonymized count)", example = "320")
    private Long uniqueDonorCount;
}
