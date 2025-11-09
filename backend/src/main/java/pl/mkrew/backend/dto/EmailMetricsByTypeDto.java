package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for email metrics grouped by notification type
 * US-022: Email Deliverability Metrics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Email metrics grouped by notification type")
public class EmailMetricsByTypeDto {

    @Schema(description = "Notification type", example = "CRITICAL_ALERT")
    private String notificationType;

    @Schema(description = "Total number of emails sent for this type", example = "450")
    private Long totalSent;

    @Schema(description = "Delivery rate for this type as percentage (0-100)", example = "98.0")
    private Double deliveryRate;

    @Schema(description = "Open rate for this type as percentage (0-100)", example = "65.0")
    private Double openRate;
}
