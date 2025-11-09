package pl.mkrew.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response for donation confirmation from email link")
public class DonationConfirmationResponse {

    @Schema(description = "Success message", example = "Donation confirmed successfully")
    private String message;

    @Schema(description = "Confirmed donation details")
    private DonationConfirmationDto donation;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "Basic donation information for confirmation response")
    public static class DonationConfirmationDto {

        @Schema(description = "Donation unique identifier", example = "502")
        private Long id;

        @Schema(description = "Date of donation", example = "2025-01-08")
        private LocalDate donationDate;

        @Schema(description = "RCKiK center name", example = "RCKiK Warszawa")
        private String rckikName;

        @Schema(description = "Quantity donated in milliliters", example = "450")
        private Integer quantityMl;

        @Schema(description = "Whether donation is confirmed", example = "true")
        private Boolean confirmed;
    }
}
