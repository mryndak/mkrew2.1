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
@Schema(description = "Paginated list of RCKiK blood donation centers")
public class RckikListResponse {

    @Schema(description = "List of RCKiK centers with blood levels")
    private List<RckikSummaryDto> content;

    @Schema(description = "Current page number (zero-based)", example = "0")
    private Integer page;

    @Schema(description = "Page size", example = "20")
    private Integer size;

    @Schema(description = "Total number of elements", example = "45")
    private Long totalElements;

    @Schema(description = "Total number of pages", example = "3")
    private Integer totalPages;

    @Schema(description = "Is this the first page", example = "true")
    private Boolean first;

    @Schema(description = "Is this the last page", example = "false")
    private Boolean last;
}
