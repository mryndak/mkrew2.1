package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.ParserConfigRequest;
import pl.mkrew.backend.dto.ParserConfigResponse;
import pl.mkrew.backend.dto.ParserTestRequest;
import pl.mkrew.backend.dto.ParserTestResponse;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.ParserConfigService;

/**
 * Admin Controller for managing parser configurations (US-029, US-030)
 */
@RestController
@RequestMapping("/api/v1/admin/parsers/configs")
@RequiredArgsConstructor
@Tag(name = "Admin Parser Configs", description = "Admin endpoints for parser configuration management")
@SecurityRequirement(name = "bearerAuth")
public class AdminParserController {

    private final ParserConfigService parserConfigService;

    /**
     * Create parser configuration
     * POST /api/v1/admin/parsers/configs
     * US-029: Implementacja parsera dla RCKiK
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create parser configuration",
        description = "Create new parser configuration for RCKiK center"
    )
    public ResponseEntity<ParserConfigResponse> createParserConfig(
            @Valid @RequestBody ParserConfigRequest request) {

        String adminEmail = SecurityUtils.getCurrentUserEmail();
        ParserConfigResponse response = parserConfigService.createParserConfig(request, adminEmail);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * List parser configurations
     * GET /api/v1/admin/parsers/configs
     * US-030: Przegląd konfiguracji parserów
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "List parser configurations",
        description = "Get list of parser configurations with filtering options"
    )
    public ResponseEntity<Page<ParserConfigResponse>> listParserConfigs(
            @RequestParam(required = false) Long rckikId,
            @RequestParam(required = false) String parserType,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<ParserConfigResponse> configs = parserConfigService.listParserConfigs(
            rckikId, parserType, active, page, size
        );

        return ResponseEntity.ok(configs);
    }

    /**
     * Get parser configuration details
     * GET /api/v1/admin/parsers/configs/{id}
     * US-030: Szczegóły konfiguracji
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get parser configuration details",
        description = "Get detailed information about parser configuration with recent runs and audit trail"
    )
    public ResponseEntity<ParserConfigResponse> getParserConfigById(@PathVariable Long id) {
        ParserConfigResponse response = parserConfigService.getParserConfigById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update parser configuration
     * PUT /api/v1/admin/parsers/configs/{id}
     * US-030: Aktualizacja konfiguracji
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update parser configuration",
        description = "Update existing parser configuration (cannot change rckikId or parserType)"
    )
    public ResponseEntity<ParserConfigResponse> updateParserConfig(
            @PathVariable Long id,
            @Valid @RequestBody ParserConfigRequest request) {

        String adminEmail = SecurityUtils.getCurrentUserEmail();
        ParserConfigResponse response = parserConfigService.updateParserConfig(id, request, adminEmail);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete parser configuration
     * DELETE /api/v1/admin/parsers/configs/{id}
     * US-030: Usuwanie konfiguracji
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Delete parser configuration",
        description = "Delete parser configuration (soft delete via active=false)"
    )
    public ResponseEntity<Void> deleteParserConfig(@PathVariable Long id) {
        String adminEmail = SecurityUtils.getCurrentUserEmail();
        parserConfigService.deleteParserConfig(id, adminEmail);

        return ResponseEntity.noContent().build();
    }

    /**
     * Test parser configuration (dry-run)
     * POST /api/v1/admin/parsers/configs/{id}/test
     * US-029: Testowanie parsera
     */
    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Test parser configuration",
        description = "Test parser configuration without saving results (dry-run mode)"
    )
    public ResponseEntity<ParserTestResponse> testParserConfig(
            @PathVariable Long id,
            @RequestBody(required = false) ParserTestRequest request,
            @RequestParam(defaultValue = "false") boolean saveResults) {

        if (request == null) {
            request = new ParserTestRequest();
        }

        ParserTestResponse response = parserConfigService.testParserConfig(id, request, saveResults);

        return ResponseEntity.ok(response);
    }
}
