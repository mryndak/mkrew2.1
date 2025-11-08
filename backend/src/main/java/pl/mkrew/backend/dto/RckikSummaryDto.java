package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "RCKiK blood donation center summary with current blood levels")
public class RckikSummaryDto {

    @Schema(description = "RCKiK unique identifier", example = "1")
    private Long id;

    @Schema(description = "RCKiK name", example = "Regionalne Centrum Krwiodawstwa i Krwiolecznictwa w Warszawie")
    private String name;

    @Schema(description = "RCKiK code", example = "RCKIK-WAW")
    private String code;

    @Schema(description = "City", example = "Warszawa")
    private String city;

    @Schema(description = "Full address", example = "ul. Kasprzaka 17, 01-211 Warszawa")
    private String address;

    @Schema(description = "Latitude", example = "52.2319")
    private BigDecimal latitude;

    @Schema(description = "Longitude", example = "20.9728")
    private BigDecimal longitude;

    @Schema(description = "Active status", example = "true")
    private Boolean active;

    @Schema(description = "Current blood levels for all blood groups")
    private List<BloodLevelDto> bloodLevels;
}
