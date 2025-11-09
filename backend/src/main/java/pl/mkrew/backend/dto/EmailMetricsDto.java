package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for aggregated email deliverability metrics
 * US-022: Email Deliverability Metrics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Aggregated email deliverability metrics")
public class EmailMetricsDto {

    @Schema(description = "Total number of emails sent", example = "1250")
    private Long totalSent;

    @Schema(description = "Total number of emails delivered", example = "1200")
    private Long totalDelivered;

    @Schema(description = "Total number of emails bounced", example = "15")
    private Long totalBounced;

    @Schema(description = "Total number of emails opened", example = "480")
    private Long totalOpened;

    @Schema(description = "Delivery rate as percentage (0-100)", example = "96.0")
    private Double deliveryRate;

    @Schema(description = "Bounce rate as percentage (0-100)", example = "1.2")
    private Double bounceRate;

    @Schema(description = "Open rate as percentage (0-100)", example = "40.0")
    private Double openRate;

    @Schema(description = "Count of hard bounces", example = "8")
    private Long hardBounceCount;

    @Schema(description = "Count of soft bounces", example = "7")
    private Long softBounceCount;
}
