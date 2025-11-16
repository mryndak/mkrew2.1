package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for blood level data from parser
 * US-029, US-030: Parser output
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodLevelData {

    private String bloodGroup;
    private BigDecimal levelPercentage;
    private String selector; // For debugging - which CSS selector was used
    private String rawText; // For debugging - raw text extracted
}
