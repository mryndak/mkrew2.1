package pl.mkrew.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Historical blood level snapshot")
public class BloodLevelHistoryDto {

    @Schema(description = "Blood snapshot unique identifier", example = "1001")
    private Long id;

    @Schema(description = "Snapshot date", example = "2025-01-08")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate snapshotDate;

    @Schema(description = "Blood group", example = "A+")
    private String bloodGroup;

    @Schema(description = "Blood level percentage", example = "45.50")
    private BigDecimal levelPercentage;

    @Schema(description = "Blood level status (CRITICAL <20%, IMPORTANT <50%, OK >=50%)",
            example = "IMPORTANT",
            allowableValues = {"CRITICAL", "IMPORTANT", "OK"})
    private String levelStatus;

    @Schema(description = "Timestamp when data was scraped", example = "2025-01-08T02:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime scrapedAt;

    @Schema(description = "Whether snapshot was created manually", example = "false")
    private Boolean isManual;
}
