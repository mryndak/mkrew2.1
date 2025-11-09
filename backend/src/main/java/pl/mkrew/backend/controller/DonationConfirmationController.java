package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.DonationConfirmationResponse;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.service.DonationService;

@RestController
@RequestMapping("/api/v1/donations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Donation Confirmation", description = "Public endpoint for confirming donations via email link")
public class DonationConfirmationController {

    private final DonationService donationService;

    /**
     * US-027: Confirm donation from email link
     * GET /api/v1/donations/confirm?token=xxx
     *
     * Confirms a donation via one-time token from email.
     * This is a public endpoint (no JWT authentication required).
     * The token is validated and marked as used after successful confirmation.
     *
     * @param token Confirmation token from email
     * @return Donation confirmation response
     */
    @Operation(
            summary = "Confirm donation via email token",
            description = "Confirms a donation using a one-time token sent via email. " +
                    "The token validates the donation, marks it as confirmed, and is then invalidated. " +
                    "This endpoint is idempotent - if the donation is already confirmed, it returns success. " +
                    "No JWT authentication required (public endpoint).",
            tags = {"Donation Confirmation"}
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Donation confirmed successfully",
                    content = @Content(schema = @Schema(implementation = DonationConfirmationResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Invalid or expired token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Token or donation not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/confirm")
    public ResponseEntity<DonationConfirmationResponse> confirmDonation(
            @Parameter(
                    description = "Confirmation token from email",
                    required = true,
                    example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            )
            @RequestParam String token) {

        log.info("GET /api/v1/donations/confirm - Confirming donation with token: {}...",
                token.substring(0, Math.min(8, token.length())));

        DonationConfirmationResponse response = donationService.confirmDonationByToken(token);

        log.info("Donation confirmed successfully - Donation ID: {}", response.getDonation().getId());

        return ResponseEntity.ok(response);
    }
}
