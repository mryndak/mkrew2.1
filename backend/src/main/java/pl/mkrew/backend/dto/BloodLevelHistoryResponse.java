package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Paginated list of historical blood level snapshots")
public class BloodLevelHistoryResponse {

    @Schema(description = "RCKiK unique identifier", example = "1")
    private Long rckikId;

    @Schema(description = "RCKiK name", example = "RCKiK Warszawa")
    private String rckikName;

    @Schema(description = "List of blood level snapshots")
    private List<BloodLevelHistoryDto> snapshots;

    @Schema(description = "Current page number (zero-based)", example = "0")
    private Integer page;

    @Schema(description = "Page size", example = "30")
    private Integer size;

    @Schema(description = "Total number of snapshots", example = "240")
    private Long totalElements;

    @Schema(description = "Total number of pages", example = "8")
    private Integer totalPages;

    @Schema(description = "Is this the first page", example = "true")
    private Boolean first;

    @Schema(description = "Is this the last page", example = "false")
    private Boolean last;
}
