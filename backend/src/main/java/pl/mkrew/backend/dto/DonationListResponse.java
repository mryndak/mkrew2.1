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
@Schema(description = "Paginated list of donations with statistics")
public class DonationListResponse {

    @Schema(description = "List of donations for current page")
    private List<DonationResponse> donations;

    @Schema(description = "Current page number (zero-based)", example = "0")
    private Integer page;

    @Schema(description = "Page size", example = "20")
    private Integer size;

    @Schema(description = "Total number of donations", example = "12")
    private Long totalElements;

    @Schema(description = "Total number of pages", example = "1")
    private Integer totalPages;

    @Schema(description = "Whether this is the first page", example = "true")
    private Boolean first;

    @Schema(description = "Whether this is the last page", example = "true")
    private Boolean last;

    @Schema(description = "Donation statistics")
    private DonationStatisticsDto statistics;
}
