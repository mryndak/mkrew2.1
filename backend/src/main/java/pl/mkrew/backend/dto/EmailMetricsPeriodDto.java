package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for email metrics period
 * US-022: Email Deliverability Metrics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Period for email metrics query")
public class EmailMetricsPeriodDto {

    @Schema(description = "Start date of the period (inclusive)", example = "2025-01-01")
    private LocalDate from;

    @Schema(description = "End date of the period (inclusive)", example = "2025-01-08")
    private LocalDate to;
}
