package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.ConsentRecord;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.ConsentRecordRepository;
import pl.mkrew.backend.repository.UserRepository;
import pl.mkrew.backend.security.SecurityUtils;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Consent & Privacy Policy", description = "Privacy policy and consent management endpoints")
public class ConsentController {

    private final UserRepository userRepository;
    private final ConsentRecordRepository consentRecordRepository;

    private static final String CURRENT_PRIVACY_POLICY_VERSION = "1.0";
    private static final String PRIVACY_POLICY_LAST_UPDATED = "2025-01-01";

    /**
     * US-015: Get current privacy policy
     * GET /api/v1/privacy-policy
     *
     * Returns current privacy policy content and version.
     * Public endpoint - no authentication required.
     *
     * @return Privacy policy details
     */
    @Operation(
            summary = "Get privacy policy",
            description = "Returns current privacy policy content, version and summary. " +
                    "This endpoint is public and does not require authentication. " +
                    "Should be displayed during registration and accessible from settings."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Privacy policy retrieved successfully",
                    content = @Content(schema = @Schema(implementation = PrivacyPolicyResponse.class))
            )
    })
    @GetMapping("/privacy-policy")
    public ResponseEntity<PrivacyPolicyResponse> getPrivacyPolicy() {
        log.info("GET /api/v1/privacy-policy - Get privacy policy");

        // In production, this would be loaded from database or file
        String content = buildPrivacyPolicyContent();
        String summary = "Przetwarzamy dane osobowe (imię, nazwisko, email, grupa krwi) w celu " +
                "świadczenia usług śledzenia donacji krwi i wysyłania powiadomień o potrzebach krwiodawstwa.";

        PrivacyPolicyResponse response = PrivacyPolicyResponse.builder()
                .version(CURRENT_PRIVACY_POLICY_VERSION)
                .lastUpdated(PRIVACY_POLICY_LAST_UPDATED)
                .content(content)
                .summary(summary)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * US-015: Get user's consent history
     * GET /api/v1/users/me/consents
     *
     * Returns user's consent history.
     * Authentication required.
     *
     * @return List of consent records
     */
    @Operation(
            summary = "Get user consent history",
            description = "Returns authenticated user's consent history including all versions accepted. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Consent history retrieved successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/users/me/consents")
    public ResponseEntity<List<ConsentDto>> getUserConsents() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/consents - Get consents for user ID: {}", userId);

        // Get user to include initial consent from registration
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Get consent records
        List<ConsentRecord> consentRecords = consentRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Map to DTOs
        List<ConsentDto> consents = consentRecords.stream()
                .map(record -> ConsentDto.builder()
                        .consentVersion(record.getConsentVersion())
                        .consentType(record.getConsentType())
                        .accepted(record.getAccepted())
                        .consentTimestamp(record.getCreatedAt())
                        .build())
                .toList();

        // Add initial consent from user registration if not in records
        if (user.getConsentTimestamp() != null) {
            ConsentDto initialConsent = ConsentDto.builder()
                    .consentVersion(user.getConsentVersion())
                    .consentType("PRIVACY_POLICY")
                    .accepted(true)
                    .consentTimestamp(user.getConsentTimestamp())
                    .build();

            // Only add if not duplicate
            boolean exists = consents.stream()
                    .anyMatch(c -> c.getConsentTimestamp().equals(user.getConsentTimestamp()));

            if (!exists) {
                consents = new java.util.ArrayList<>(consents);
                consents.add(initialConsent);
            }
        }

        log.info("Retrieved {} consent records for user ID: {}", consents.size(), userId);

        return ResponseEntity.ok(consents);
    }

    /**
     * US-015: Update user consent (for policy updates)
     * POST /api/v1/users/me/consents
     *
     * Records new consent when privacy policy is updated.
     * Authentication required.
     *
     * @param request Consent update data
     * @return Updated consent information
     */
    @Operation(
            summary = "Update user consent",
            description = "Records new consent when user accepts updated privacy policy. " +
                    "Creates audit trail for consent changes. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Consent updated successfully",
                    content = @Content(schema = @Schema(implementation = ConsentDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Validation errors or consent not accepted",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/users/me/consents")
    public ResponseEntity<ConsentDto> updateConsent(@Valid @RequestBody UpdateConsentRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("POST /api/v1/users/me/consents - Update consent for user ID: {} to version: {}",
                userId, request.getConsentVersion());

        if (!request.getAccepted()) {
            throw new IllegalArgumentException("Consent must be accepted to continue using the service");
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Update user's consent version
        user.setConsentVersion(request.getConsentVersion());
        user.setConsentTimestamp(LocalDateTime.now());
        userRepository.save(user);

        // Create consent record for audit trail
        ConsentRecord consentRecord = ConsentRecord.builder()
                .user(user)
                .consentVersion(request.getConsentVersion())
                .consentType("PRIVACY_POLICY")
                .accepted(request.getAccepted())
                .build();

        consentRecord = consentRecordRepository.save(consentRecord);

        ConsentDto response = ConsentDto.builder()
                .consentVersion(consentRecord.getConsentVersion())
                .consentType(consentRecord.getConsentType())
                .accepted(consentRecord.getAccepted())
                .consentTimestamp(consentRecord.getCreatedAt())
                .build();

        log.info("Updated consent for user ID: {} to version: {}", userId, request.getConsentVersion());

        return ResponseEntity.ok(response);
    }

    /**
     * Build privacy policy content (mock for MVP)
     * In production, this would be loaded from database or CMS
     *
     * @return HTML content of privacy policy
     */
    private String buildPrivacyPolicyContent() {
        return "<h1>Polityka Prywatności mkrew</h1>" +
                "<p><strong>Wersja: " + CURRENT_PRIVACY_POLICY_VERSION + "</strong></p>" +
                "<p><strong>Data aktualizacji: " + PRIVACY_POLICY_LAST_UPDATED + "</strong></p>" +
                "<h2>1. Administrator danych</h2>" +
                "<p>Administratorem danych osobowych jest mkrew.</p>" +
                "<h2>2. Zakres przetwarzanych danych</h2>" +
                "<p>Przetwarzamy następujące dane osobowe:</p>" +
                "<ul>" +
                "<li>Dane identyfikacyjne: imię, nazwisko, adres email</li>" +
                "<li>Dane wrażliwe: grupa krwi (za Twoją wyraźną zgodą)</li>" +
                "<li>Dane dotyczące zdrowia: historia donacji krwi</li>" +
                "<li>Preferencje: ulubione centra krwiodawstwa, preferencje powiadomień</li>" +
                "</ul>" +
                "<h2>3. Cel przetwarzania danych</h2>" +
                "<p>Twoje dane przetwarzamy w celu:</p>" +
                "<ul>" +
                "<li>Świadczenia usług śledzenia donacji krwi</li>" +
                "<li>Wysyłania powiadomień o potrzebach krwiodawstwa</li>" +
                "<li>Prowadzenia dziennika donacji</li>" +
                "<li>Komunikacji z użytkownikami</li>" +
                "</ul>" +
                "<h2>4. Podstawa prawna</h2>" +
                "<p>Przetwarzanie danych odbywa się na podstawie:</p>" +
                "<ul>" +
                "<li>Art. 6 ust. 1 lit. a RODO - zgoda</li>" +
                "<li>Art. 9 ust. 2 lit. a RODO - wyraźna zgoda na przetwarzanie danych wrażliwych</li>" +
                "</ul>" +
                "<h2>5. Twoje prawa</h2>" +
                "<p>Masz prawo do:</p>" +
                "<ul>" +
                "<li>Dostępu do swoich danych</li>" +
                "<li>Sprostowania danych</li>" +
                "<li>Usunięcia danych (prawo do bycia zapomnianym)</li>" +
                "<li>Ograniczenia przetwarzania</li>" +
                "<li>Przenoszenia danych</li>" +
                "<li>Sprzeciwu wobec przetwarzania</li>" +
                "<li>Wycofania zgody w dowolnym momencie</li>" +
                "</ul>" +
                "<h2>6. Bezpieczeństwo danych</h2>" +
                "<p>Stosujemy środki techniczne i organizacyjne zapewniające bezpieczeństwo danych, w tym:</p>" +
                "<ul>" +
                "<li>Szyfrowanie haseł (bcrypt/Argon2)</li>" +
                "<li>Szyfrowanie transmisji (TLS)</li>" +
                "<li>Kontrola dostępu i autoryzacja</li>" +
                "<li>Regularne kopie zapasowe</li>" +
                "</ul>" +
                "<h2>7. Okres przechowywania</h2>" +
                "<p>Dane przechowujemy przez okres niezbędny do świadczenia usług lub do momentu wycofania zgody.</p>" +
                "<h2>8. Kontakt</h2>" +
                "<p>W sprawie ochrony danych osobowych możesz skontaktować się z nami pod adresem: privacy@mkrew.pl</p>";
    }
}
