package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for critical blood level alert
 * US-010: Email Notifications for Critical Blood Levels
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Critical blood level alert information")
public class CriticalBloodLevelAlertDto {

    @Schema(description = "RCKiK center ID", example = "1")
    private Long rckikId;

    @Schema(description = "RCKiK center name", example = "RCKiK Warszawa")
    private String rckikName;

    @Schema(description = "RCKiK center code", example = "RCKIK-WAW")
    private String rckikCode;

    @Schema(description = "City", example = "Warszawa")
    private String city;

    @Schema(description = "Address", example = "ul. Kasprzaka 17, 01-211 Warszawa")
    private String address;

    @Schema(description = "List of critical blood levels")
    private List<CriticalBloodGroupDto> criticalBloodGroups;

    @Schema(description = "Snapshot timestamp")
    private LocalDateTime snapshotTime;

    /**
     * DTO for critical blood group information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "Critical blood group information")
    public static class CriticalBloodGroupDto {

        @Schema(description = "Blood group", example = "0-")
        private String bloodGroup;

        @Schema(description = "Blood level percentage", example = "15.00")
        private BigDecimal levelPercentage;

        @Schema(description = "Blood level status", example = "CRITICAL")
        private String levelStatus;
    }
}
