package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for email deliverability metrics
 * US-022: Email Deliverability Metrics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Email deliverability metrics response with aggregated data and breakdown by type")
public class EmailMetricsResponse {

    @Schema(description = "Period for which metrics were calculated")
    private EmailMetricsPeriodDto period;

    @Schema(description = "Aggregated metrics for the entire period")
    private EmailMetricsDto metrics;

    @Schema(description = "Metrics grouped by notification type")
    private List<EmailMetricsByTypeDto> byType;
}
