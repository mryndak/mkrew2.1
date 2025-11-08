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
 * Request for updating existing RCKiK center
 * US-019: Admin RCKiK Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update RCKiK center")
public class UpdateRckikRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    @Schema(description = "RCKiK center name", example = "RCKiK Warszawa - Updated", required = true)
    private String name;

    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    @Schema(description = "Unique RCKiK code", example = "RCKIK-WAW", required = true)
    private String code;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Schema(description = "City name", example = "Warszawa", required = true)
    private String city;

    @Size(max = 1000, message = "Address must not exceed 1000 characters")
    @Schema(description = "Full address", example = "ul. Kasprzaka 17, 01-211 Warszawa")
    private String address;

    @Schema(description = "Latitude coordinate", example = "52.2319")
    private BigDecimal latitude;

    @Schema(description = "Longitude coordinate", example = "20.9728")
    private BigDecimal longitude;

    @Schema(description = "List of alternative names/aliases", example = "[\"RCKiK Warszawa\", \"RCKIK WAW\"]")
    private List<String> aliases;

    @Schema(description = "Whether center is active", example = "true")
    private Boolean active;
}
