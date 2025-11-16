package pl.mkrew.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.ScraperConfig;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.exception.ValidationException;
import pl.mkrew.backend.parser.Parser;
import pl.mkrew.backend.parser.ParserFactory;
import pl.mkrew.backend.parser.ParsingException;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.ScraperConfigRepository;

import java.util.*;

/**
 * Service for managing parser configurations (US-029, US-030)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ParserConfigService {

    private final ScraperConfigRepository scraperConfigRepository;
    private final RckikRepository rckikRepository;
    private final AuditLogService auditLogService;
    private final ParserFactory parserFactory;
    private final ObjectMapper objectMapper;

    /**
     * Create parser configuration
     * US-029: Implementacja parsera dla RCKiK
     */
    @Transactional
    public ParserConfigResponse createParserConfig(ParserConfigRequest request, String adminEmail) {
        log.info("Creating parser config for RCKiK ID: {}, parser type: {}, admin: {}",
            request.getRckikId(), request.getParserType(), adminEmail);

        // Validate RCKiK exists
        Rckik rckik = rckikRepository.findById(request.getRckikId())
            .orElseThrow(() -> new ResourceNotFoundException("RCKiK not found with id: " + request.getRckikId()));

        // Check for existing active config
        Optional<ScraperConfig> existingConfig = scraperConfigRepository
            .findByRckikIdAndActiveTrue(request.getRckikId());

        if (existingConfig.isPresent()) {
            throw new ValidationException("RCKiK already has an active parser configuration");
        }

        // Validate CSS selectors JSON
        validateCssSelectors(request.getCssSelectors());

        // Create scraper config
        ScraperConfig config = ScraperConfig.builder()
            .rckik(rckik)
            .sourceUrl(request.getSourceUrl())
            .parserType(request.getParserType())
            .cssSelectors(request.getCssSelectors())
            .active(request.getActive())
            .scheduleCron(request.getScheduleCron())
            .timeoutSeconds(request.getTimeoutSeconds())
            .build();

        ScraperConfig savedConfig = scraperConfigRepository.save(config);

        // Create audit log
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("rckikId", request.getRckikId());
        metadata.put("rckikName", rckik.getName());
        metadata.put("parserType", request.getParserType());
        metadata.put("sourceUrl", request.getSourceUrl());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            metadata.put("notes", request.getNotes());
        }

        auditLogService.createAuditLog(
            adminEmail,
            "PARSER_CONFIG_CREATED",
            "ScraperConfig",
            savedConfig.getId(),
            metadata
        );

        log.info("Parser config created successfully with ID: {}", savedConfig.getId());

        return mapToResponse(savedConfig);
    }

    /**
     * List parser configurations
     * US-030: Zarządzanie konfiguracją parserów
     */
    @Transactional(readOnly = true)
    public Page<ParserConfigResponse> listParserConfigs(
            Long rckikId,
            String parserType,
            Boolean active,
            int page,
            int size) {

        log.info("Listing parser configs - rckikId: {}, parserType: {}, active: {}", rckikId, parserType, active);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // TODO: Implement custom query with filtering
        // For now, return all configs
        Page<ScraperConfig> configs = scraperConfigRepository.findAll(pageable);

        return configs.map(this::mapToResponse);
    }

    /**
     * Get parser configuration by ID
     * US-030: Szczegóły konfiguracji
     */
    @Transactional(readOnly = true)
    public ParserConfigResponse getParserConfigById(Long id) {
        log.info("Getting parser config details for ID: {}", id);

        ScraperConfig config = scraperConfigRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Parser config not found with id: " + id));

        return mapToResponseWithDetails(config);
    }

    /**
     * Update parser configuration
     * US-030: Aktualizacja konfiguracji
     */
    @Transactional
    public ParserConfigResponse updateParserConfig(Long id, ParserConfigRequest request, String adminEmail) {
        log.info("Updating parser config ID: {}, admin: {}", id, adminEmail);

        ScraperConfig config = scraperConfigRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Parser config not found with id: " + id));

        // Validate CSS selectors JSON if provided
        if (request.getCssSelectors() != null) {
            validateCssSelectors(request.getCssSelectors());
        }

        // Track changes for audit log
        Map<String, Object> changes = new HashMap<>();

        if (request.getSourceUrl() != null && !request.getSourceUrl().equals(config.getSourceUrl())) {
            changes.put("sourceUrl", Map.of("old", config.getSourceUrl(), "new", request.getSourceUrl()));
            config.setSourceUrl(request.getSourceUrl());
        }

        if (request.getCssSelectors() != null && !request.getCssSelectors().equals(config.getCssSelectors())) {
            changes.put("cssSelectors", Map.of("old", config.getCssSelectors(), "new", request.getCssSelectors()));
            config.setCssSelectors(request.getCssSelectors());
        }

        if (request.getActive() != null && !request.getActive().equals(config.getActive())) {
            changes.put("active", Map.of("old", config.getActive(), "new", request.getActive()));
            config.setActive(request.getActive());
        }

        if (request.getTimeoutSeconds() != null && !request.getTimeoutSeconds().equals(config.getTimeoutSeconds())) {
            changes.put("timeoutSeconds", Map.of("old", config.getTimeoutSeconds(), "new", request.getTimeoutSeconds()));
            config.setTimeoutSeconds(request.getTimeoutSeconds());
        }

        ScraperConfig updatedConfig = scraperConfigRepository.save(config);

        // Create audit log
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("configId", id);
        metadata.put("changes", changes);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            metadata.put("notes", request.getNotes());
        }

        auditLogService.createAuditLog(
            adminEmail,
            "PARSER_CONFIG_UPDATED",
            "ScraperConfig",
            updatedConfig.getId(),
            metadata
        );

        log.info("Parser config updated successfully with ID: {}", updatedConfig.getId());

        return mapToResponse(updatedConfig);
    }

    /**
     * Delete parser configuration (soft delete via active=false)
     * US-030: Usuwanie konfiguracji
     */
    @Transactional
    public void deleteParserConfig(Long id, String adminEmail) {
        log.info("Deleting parser config ID: {}, admin: {}", id, adminEmail);

        ScraperConfig config = scraperConfigRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Parser config not found with id: " + id));

        // Soft delete: Set active=false
        config.setActive(false);
        scraperConfigRepository.save(config);

        // Create audit log
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("configId", id);
        metadata.put("rckikId", config.getRckik().getId());
        metadata.put("rckikName", config.getRckik().getName());
        metadata.put("parserType", config.getParserType());

        auditLogService.createAuditLog(
            adminEmail,
            "PARSER_CONFIG_DELETED",
            "ScraperConfig",
            config.getId(),
            metadata
        );

        log.info("Parser config deactivated successfully with ID: {}", id);
    }

    /**
     * Test parser configuration (dry-run)
     * US-029: Testowanie parsera
     */
    @Transactional(readOnly = true)
    public ParserTestResponse testParserConfig(Long id, ParserTestRequest request, boolean saveResults) {
        log.info("Testing parser config ID: {}, saveResults: {}", id, saveResults);

        ScraperConfig config = scraperConfigRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Parser config not found with id: " + id));

        String testId = "test-" + System.currentTimeMillis();
        String testUrl = request.getTestUrl() != null ? request.getTestUrl() : config.getSourceUrl();

        ParserTestResponse.ParserTestResponseBuilder responseBuilder = ParserTestResponse.builder()
            .testId(testId)
            .configId(config.getId())
            .rckikId(config.getRckik().getId())
            .rckikName(config.getRckik().getName())
            .testUrl(testUrl)
            .parserType(config.getParserType());

        // TODO: Implement actual HTTP fetch and parsing
        // For now, return mock response
        responseBuilder
            .status("SUCCESS")
            .executionTimeMs(1500)
            .httpStatusCode(200)
            .parsedData(Collections.emptyList())
            .warnings(Collections.emptyList())
            .errors(Collections.emptyList())
            .summary(ParserTestResponse.TestSummary.builder()
                .totalGroupsExpected(8)
                .totalGroupsFound(0)
                .successfulParses(0)
                .failedParses(0)
                .saved(false)
                .build());

        return responseBuilder.build();
    }

    /**
     * Validate CSS selectors JSON structure
     */
    private void validateCssSelectors(String cssSelectorsJson) {
        try {
            JsonNode selectorsNode = objectMapper.readTree(cssSelectorsJson);

            // Validate required keys
            if (!selectorsNode.has("bloodGroupRow")) {
                throw new ValidationException("CSS selectors missing required key: bloodGroupRow");
            }
            if (!selectorsNode.has("bloodGroupName")) {
                throw new ValidationException("CSS selectors missing required key: bloodGroupName");
            }
            if (!selectorsNode.has("levelPercentage")) {
                throw new ValidationException("CSS selectors missing required key: levelPercentage");
            }

        } catch (JsonProcessingException e) {
            throw new ValidationException("Invalid JSON format for CSS selectors: " + e.getMessage());
        }
    }

    /**
     * Map ScraperConfig entity to response DTO
     */
    private ParserConfigResponse mapToResponse(ScraperConfig config) {
        try {
            JsonNode selectorsNode = objectMapper.readTree(config.getCssSelectors());

            return ParserConfigResponse.builder()
                .id(config.getId())
                .rckikId(config.getRckik().getId())
                .rckikName(config.getRckik().getName())
                .rckikCode(config.getRckik().getCode())
                .sourceUrl(config.getSourceUrl())
                .parserType(config.getParserType())
                .cssSelectors(selectorsNode)
                .active(config.getActive())
                .scheduleCron(config.getScheduleCron())
                .timeoutSeconds(config.getTimeoutSeconds())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
        } catch (JsonProcessingException e) {
            log.error("Failed to parse CSS selectors JSON for config ID: {}", config.getId(), e);
            throw new RuntimeException("Failed to parse CSS selectors JSON", e);
        }
    }

    /**
     * Map ScraperConfig entity to response DTO with full details
     */
    private ParserConfigResponse mapToResponseWithDetails(ScraperConfig config) {
        ParserConfigResponse response = mapToResponse(config);

        // TODO: Add recent runs and audit trail
        response.setRecentRuns(Collections.emptyList());
        response.setAuditTrail(Collections.emptyList());

        return response;
    }
}
