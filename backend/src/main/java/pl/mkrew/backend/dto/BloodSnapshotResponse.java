package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for blood snapshot response (US-028)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodSnapshotResponse {

    private Long id;
    private Long rckikId;
    private String rckikName;
    private String rckikCode;
    private LocalDate snapshotDate;
    private String bloodGroup;
    private BigDecimal levelPercentage;
    private String levelStatus; // CRITICAL, IMPORTANT, OK
    private String sourceUrl;
    private String parserVersion;
    private LocalDateTime scrapedAt;
    private Boolean isManual;
    private String createdBy;
    private LocalDateTime createdAt;
    private AuditTrailDto auditTrail;

    /**
     * Calculate level status based on percentage
     */
    public static String calculateLevelStatus(BigDecimal levelPercentage) {
        if (levelPercentage == null) {
            return "UNKNOWN";
        }
        if (levelPercentage.compareTo(new BigDecimal("20")) < 0) {
            return "CRITICAL";
        } else if (levelPercentage.compareTo(new BigDecimal("50")) < 0) {
            return "IMPORTANT";
        } else {
            return "OK";
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditTrailDto {
        private String notes;
    }
}
