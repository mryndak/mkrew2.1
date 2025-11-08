package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request for creating new RCKiK center
 * US-019: Admin RCKiK Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create new RCKiK center")
public class CreateRckikRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    @Schema(description = "RCKiK center name", example = "RCKiK Gdańsk", required = true)
    private String name;

    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    @Schema(description = "Unique RCKiK code", example = "RCKIK-GDA", required = true)
    private String code;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Schema(description = "City name", example = "Gdańsk", required = true)
    private String city;

    @Size(max = 1000, message = "Address must not exceed 1000 characters")
    @Schema(description = "Full address", example = "ul. Przykładowa 10, 80-001 Gdańsk")
    private String address;

    @Schema(description = "Latitude coordinate", example = "54.3520")
    private BigDecimal latitude;

    @Schema(description = "Longitude coordinate", example = "18.6466")
    private BigDecimal longitude;

    @Schema(description = "List of alternative names/aliases", example = "[\"RCKiK Gdańsk\", \"RCKIK GDA\"]")
    private List<String> aliases;

    @Schema(description = "Whether center is active", example = "true", defaultValue = "true")
    private Boolean active = true;
}
