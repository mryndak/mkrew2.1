package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

/**
 * US-026: Anonymized blood level statistics report
 * Contains aggregated blood inventory data without exposing sensitive operational details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Anonymized blood level statistics report - aggregated blood inventory data")
public class BloodLevelStatisticsReportDto {

    @Schema(description = "Average blood level percentage by blood group", example = "{'A+': 45.5, '0-': 22.3}")
    private Map<String, Double> averageLevelByBloodGroup;

    @Schema(description = "Number of snapshots by status (CRITICAL/IMPORTANT/OK)", example = "{'CRITICAL': 50, 'IMPORTANT': 120, 'OK': 200}")
    private Map<String, Long> snapshotsByStatus;

    @Schema(description = "Number of snapshots by RCKiK center", example = "{'RCKiK Warszawa': 80, 'RCKiK Kraków': 65}")
    private Map<String, Long> snapshotsByRckik;

    @Schema(description = "Total number of blood snapshots in the period", example = "370")
    private Long totalSnapshots;

    @Schema(description = "Number of manual snapshots (admin-created)", example = "15")
    private Long manualSnapshots;

    @Schema(description = "Number of automated snapshots (scraped)", example = "355")
    private Long automatedSnapshots;

    @Schema(description = "Start date of the reporting period", example = "2024-01-01")
    private LocalDate fromDate;

    @Schema(description = "End date of the reporting period", example = "2025-01-31")
    private LocalDate toDate;

    @Schema(description = "Percentage of days with at least one CRITICAL level", example = "35.5")
    private Double percentageDaysWithCritical;

    @Schema(description = "Most frequently critical blood group", example = "0-")
    private String mostCriticalBloodGroup;
}
