package pl.mkrew.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Donation export response in JSON format")
public class DonationExportResponse {

    @Schema(description = "User ID who exported the data", example = "123")
    private Long userId;

    @Schema(description = "Timestamp when export was generated", example = "2025-01-08T16:45:00Z")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime exportDate;

    @Schema(description = "List of exported donations")
    private List<DonationExportDto> donations;

    @Schema(description = "Total number of donations", example = "12")
    private Long totalDonations;

    @Schema(description = "Total quantity donated in milliliters", example = "5400")
    private Long totalQuantityMl;
}
