package pl.mkrew.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Blood level information for a specific blood group")
public class BloodLevelDto {

    @Schema(description = "Blood group", example = "A+")
    private String bloodGroup;

    @Schema(description = "Blood level percentage", example = "45.50")
    private BigDecimal levelPercentage;

    @Schema(description = "Blood level status (CRITICAL <20%, IMPORTANT <50%, OK >=50%)",
            example = "IMPORTANT",
            allowableValues = {"CRITICAL", "IMPORTANT", "OK"})
    private String levelStatus;

    @Schema(description = "Last update timestamp", example = "2025-01-08T02:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastUpdate;
}
