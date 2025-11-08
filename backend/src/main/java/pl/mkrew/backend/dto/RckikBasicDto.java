package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Basic RCKiK center information")
public class RckikBasicDto {

    @Schema(description = "RCKiK center unique identifier", example = "1")
    private Long id;

    @Schema(description = "RCKiK center name", example = "RCKiK Warszawa")
    private String name;

    @Schema(description = "RCKiK center code", example = "RCKIK-WAW")
    private String code;

    @Schema(description = "City where center is located", example = "Warszawa")
    private String city;
}
