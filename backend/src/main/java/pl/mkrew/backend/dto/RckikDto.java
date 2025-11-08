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
 * DTO for RCKiK center information
 * US-019: Admin RCKiK Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "RCKiK center information")
public class RckikDto {

    @Schema(description = "RCKiK ID", example = "1")
    private Long id;

    @Schema(description = "RCKiK center name", example = "RCKiK Warszawa")
    private String name;

    @Schema(description = "Unique RCKiK code", example = "RCKIK-WAW")
    private String code;

    @Schema(description = "City name", example = "Warszawa")
    private String city;

    @Schema(description = "Full address", example = "ul. Kasprzaka 17, 01-211 Warszawa")
    private String address;

    @Schema(description = "Latitude coordinate", example = "52.2319")
    private BigDecimal latitude;

    @Schema(description = "Longitude coordinate", example = "20.9728")
    private BigDecimal longitude;

    @Schema(description = "List of alternative names/aliases")
    private List<String> aliases;

    @Schema(description = "Whether center is active", example = "true")
    private Boolean active;

    @Schema(description = "Timestamp when center was created", example = "2024-01-01T00:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when center was last updated", example = "2025-01-08T10:00:00")
    private LocalDateTime updatedAt;
}
