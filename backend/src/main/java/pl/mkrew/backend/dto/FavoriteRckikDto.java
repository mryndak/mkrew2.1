package pl.mkrew.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Favorite RCKiK blood donation center")
public class FavoriteRckikDto {

    @Schema(description = "Favorite entry unique identifier", example = "1")
    private Long id;

    @Schema(description = "RCKiK unique identifier", example = "5")
    private Long rckikId;

    @Schema(description = "RCKiK name", example = "RCKiK Warszawa")
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

    @Schema(description = "Priority (optional ordering)", example = "1")
    private Integer priority;

    @Schema(description = "When favorite was added", example = "2025-01-01T10:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime addedAt;

    @Schema(description = "Current blood levels for this center")
    private List<BloodLevelDto> currentBloodLevels;
}
