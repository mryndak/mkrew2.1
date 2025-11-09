package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.ScraperConfig;
import pl.mkrew.backend.entity.ScraperLog;
import pl.mkrew.backend.entity.ScraperRun;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.exception.ValidationException;
import pl.mkrew.backend.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing scraper operations
 * US-017: Manual Scraping
 * US-018: Monitoring and alerting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScraperService {

    private final ScraperRunRepository scraperRunRepository;
    private final ScraperConfigRepository scraperConfigRepository;
    private final ScraperLogRepository scraperLogRepository;
    private final RckikRepository rckikRepository;
    private final UserRepository userRepository;

    /**
     * Trigger manual scraper run
     * US-017: Manual Scraping
     *
     * Business Logic:
     * 1. Validate request (RCKiK exists if provided)
     * 2. Get user email for audit trail
     * 3. Create ScraperRun with run_type=MANUAL
     * 4. Set triggered_by from authenticated user
     * 5. Queue scraping job (async) - for MVP: create run record only
     * 6. Return immediately with run ID for status polling
     *
     * @param request Trigger scraper request
     * @param userId User ID of admin who triggered the run
     * @return ScraperRunResponse with run details
     */
    @Transactional
    public ScraperRunResponse triggerManualScraping(TriggerScraperRequest request, Long userId) {
        log.info("Triggering manual scraper run - rckikId: {}, url: {}, userId: {}",
                request.getRckikId(), request.getUrl(), userId);

        // 1. Get user email for audit trail
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String triggeredBy = user.getEmail();

        // 2. Validate request
        validateRequest(request);

        // 2. Determine number of RCKiK to scrape
        Integer totalRckiks = determineRckikCount(request);

        // 3. Create ScraperRun with MANUAL type and RUNNING status
        ScraperRun scraperRun = ScraperRun.builder()
                .runType("MANUAL")
                .status("RUNNING")
                .triggeredBy(triggeredBy)
                .totalRckiks(totalRckiks)
                .successfulCount(0)
                .failedCount(0)
                .build();
        // Note: startedAt is auto-set by @CreationTimestamp

        ScraperRun savedRun = scraperRunRepository.save(scraperRun);
        log.info("Created manual scraper run with ID: {}", savedRun.getId());

        // 4. Queue scraping job (async)
        // TODO: For MVP, we just create the run record.
        // In the future, implement actual scraping logic:
        // - If rckikId is provided: scrape single RCKiK
        // - If url is provided: use custom URL instead of config
        // - If neither provided: scrape all active RCKiK
        // Example: scraperExecutor.execute(() -> performScraping(savedRun.getId(), request));

        log.warn("Scraper execution not yet implemented - run created with ID: {} but no actual scraping will occur",
                savedRun.getId());

        // 5. Return response
        return buildScraperRunResponse(savedRun);
    }

    /**
     * Validate trigger scraper request
     */
    private void validateRequest(TriggerScraperRequest request) {
        // If rckikId is provided, validate it exists and is active
        if (request.getRckikId() != null) {
            Rckik rckik = rckikRepository.findById(request.getRckikId())
                    .orElseThrow(() -> {
                        log.warn("RCKiK not found: {}", request.getRckikId());
                        return new ResourceNotFoundException("RCKiK not found with ID: " + request.getRckikId());
                    });

            if (!rckik.getActive()) {
                log.warn("Attempted to scrape inactive RCKiK: {}", request.getRckikId());
                throw new ValidationException("RCKiK is not active: " + request.getRckikId());
            }

            log.debug("Validated RCKiK: {} - {}", rckik.getId(), rckik.getName());
        }

        // If custom URL is provided, validate format (already done by @Pattern in DTO)
        if (request.getUrl() != null && !request.getUrl().isBlank()) {
            log.debug("Custom URL provided: {}", request.getUrl());
        }
    }

    /**
     * Determine number of RCKiK centers to scrape
     */
    private Integer determineRckikCount(TriggerScraperRequest request) {
        if (request.getRckikId() != null) {
            // Single RCKiK
            return 1;
        } else {
            // All active RCKiK
            long activeCount = rckikRepository.countByActiveTrue();
            log.debug("Will scrape {} active RCKiK centers", activeCount);
            return (int) activeCount;
        }
    }

    /**
     * Build ScraperRunResponse from ScraperRun entity
     */
    private ScraperRunResponse buildScraperRunResponse(ScraperRun scraperRun) {
        return ScraperRunResponse.builder()
                .scraperId(scraperRun.getId())
                .runType(scraperRun.getRunType())
                .status(scraperRun.getStatus())
                .triggeredBy(scraperRun.getTriggeredBy())
                .startedAt(scraperRun.getStartedAt())
                .statusUrl("/api/v1/admin/scraper/runs/" + scraperRun.getId())
                .build();
    }

    /**
     * Get scraper run by ID
     * For future endpoint: GET /api/v1/admin/scraper/runs/{id}
     *
     * @param runId Scraper run ID
     * @return ScraperRun entity
     */
    @Transactional(readOnly = true)
    public ScraperRun getScraperRun(Long runId) {
        log.info("Getting scraper run: {}", runId);

        return scraperRunRepository.findById(runId)
                .orElseThrow(() -> {
                    log.warn("Scraper run not found: {}", runId);
                    return new ResourceNotFoundException("Scraper run not found with ID: " + runId);
                });
    }

    /**
     * List scraper runs with pagination
     * US-018: Monitor Scraping
     *
     * @param pageable Pagination parameters
     * @return Page of ScraperRunDto
     */
    @Transactional(readOnly = true)
    public Page<ScraperRunDto> listScraperRuns(Pageable pageable) {
        log.info("Listing scraper runs - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());

        Page<ScraperRun> runs = scraperRunRepository.findAll(pageable);

        return runs.map(this::mapToScraperRunDto);
    }

    /**
     * Get scraper run details with logs
     * US-018: Monitor Scraping
     *
     * @param runId Scraper run ID
     * @return ScraperRunDetailsDto with logs
     */
    @Transactional(readOnly = true)
    public ScraperRunDetailsDto getScraperRunDetails(Long runId) {
        log.info("Getting scraper run details: {}", runId);

        ScraperRun run = getScraperRun(runId);

        // Get logs for this run (placeholder - need to add query method)
        // For now, return empty list
        List<ScraperLogDto> logs = List.of();

        return ScraperRunDetailsDto.builder()
                .id(run.getId())
                .runType(run.getRunType())
                .startedAt(run.getStartedAt())
                .completedAt(run.getCompletedAt())
                .totalRckiks(run.getTotalRckiks())
                .successfulCount(run.getSuccessfulCount())
                .failedCount(run.getFailedCount())
                .durationSeconds(run.getDurationSeconds())
                .triggeredBy(run.getTriggeredBy())
                .status(run.getStatus())
                .errorSummary(run.getErrorSummary())
                .logs(logs)
                .build();
    }

    /**
     * List scraper logs with pagination
     * US-018: Export Logs
     *
     * @param pageable Pagination parameters
     * @return Page of ScraperLogDto
     */
    @Transactional(readOnly = true)
    public Page<ScraperLogDto> listScraperLogs(Pageable pageable) {
        log.info("Listing scraper logs - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());

        Page<ScraperLog> logs = scraperLogRepository.findAll(pageable);

        return logs.map(this::mapToScraperLogDto);
    }

    /**
     * Map ScraperRun entity to ScraperRunDto
     */
    private ScraperRunDto mapToScraperRunDto(ScraperRun run) {
        return ScraperRunDto.builder()
                .id(run.getId())
                .runType(run.getRunType())
                .startedAt(run.getStartedAt())
                .completedAt(run.getCompletedAt())
                .totalRckiks(run.getTotalRckiks())
                .successfulCount(run.getSuccessfulCount())
                .failedCount(run.getFailedCount())
                .durationSeconds(run.getDurationSeconds())
                .triggeredBy(run.getTriggeredBy())
                .status(run.getStatus())
                .errorSummary(run.getErrorSummary())
                .build();
    }

    /**
     * Map ScraperLog entity to ScraperLogDto
     */
    private ScraperLogDto mapToScraperLogDto(ScraperLog log) {
        return ScraperLogDto.builder()
                .id(log.getId())
                .scraperRunId(log.getScraperRun() != null ? log.getScraperRun().getId() : null)
                .rckikId(log.getRckik() != null ? log.getRckik().getId() : null)
                .rckikName(log.getRckik() != null ? log.getRckik().getName() : null)
                .url(log.getUrl())
                .status(log.getStatus())
                .errorMessage(log.getErrorMessage())
                .parserVersion(log.getParserVersion())
                .responseTimeMs(log.getResponseTimeMs())
                .httpStatusCode(log.getHttpStatusCode())
                .recordsParsed(log.getRecordsParsed())
                .recordsFailed(log.getRecordsFailed())
                .createdAt(log.getCreatedAt())
                .build();
    }

    /**
     * Get global scraper system status
     * US-025: Extreme Mode - No Access to RCKiK Pages
     *
     * This method analyzes recent scraper runs to determine the overall health
     * of the scraping system and provides information for monitoring and alerting.
     *
     * Status determination:
     * - OK: Last run was successful (COMPLETED), or at most 1 failure in recent runs
     * - DEGRADED: 2 consecutive failures, but not all recent runs failed
     * - FAILED: 3+ consecutive failures (prolonged failure requiring admin intervention)
     *
     * @return ScraperGlobalStatusDto with system health information
     */
    @Transactional(readOnly = true)
    public ScraperGlobalStatusDto getScraperGlobalStatus() {
        log.info("Calculating global scraper status");

        // 1. Get recent scraper runs (last 5 completed runs)
        org.springframework.data.domain.PageRequest pageRequest =
                org.springframework.data.domain.PageRequest.of(0, 5);
        Page<ScraperRun> recentRunsPage = scraperRunRepository.findAllByOrderByStartedAtDesc(pageRequest);
        List<ScraperRun> recentRuns = recentRunsPage.getContent();

        // Filter only completed runs (exclude RUNNING status)
        List<ScraperRun> completedRuns = recentRuns.stream()
                .filter(run -> run.getCompletedAt() != null)
                .collect(Collectors.toList());

        log.debug("Found {} completed scraper runs in recent history", completedRuns.size());

        // 2. Find last successful run
        Optional<ScraperRun> lastSuccessful = scraperRunRepository
                .findFirstByStatusOrderByCompletedAtDesc("COMPLETED");

        LocalDateTime lastSuccessfulTimestamp = lastSuccessful
                .map(ScraperRun::getCompletedAt)
                .orElse(null);

        // 3. Count consecutive failures
        List<ScraperRun> consecutiveFailedRuns = scraperRunRepository.findConsecutiveFailedRuns();
        int consecutiveFailures = consecutiveFailedRuns.size();

        log.debug("Consecutive failures: {}", consecutiveFailures);

        // 4. Count successful and failed runs in recent history
        long successfulCount = completedRuns.stream()
                .filter(run -> "COMPLETED".equals(run.getStatus()))
                .count();

        long failedCount = completedRuns.stream()
                .filter(run -> "FAILED".equals(run.getStatus()) || "PARTIAL".equals(run.getStatus()))
                .count();

        log.debug("Recent runs - Successful: {}, Failed: {}", successfulCount, failedCount);

        // 5. Determine global status
        String globalStatus;
        String message;
        boolean requiresAdminAlert;

        if (consecutiveFailures >= 3) {
            // FAILED: Prolonged failure - 3+ consecutive failures
            globalStatus = "FAILED";
            message = String.format(
                    "Critical: Scraping system has experienced %d consecutive failures. " +
                    "Manual intervention required. Consider manual data import.",
                    consecutiveFailures
            );
            requiresAdminAlert = true;
            log.warn("Scraper status: FAILED - {} consecutive failures", consecutiveFailures);

        } else if (consecutiveFailures == 2) {
            // DEGRADED: Warning state - 2 consecutive failures
            globalStatus = "DEGRADED";
            message = String.format(
                    "Warning: Scraping system has experienced %d consecutive failures. " +
                    "Monitoring closely for potential prolonged failure.",
                    consecutiveFailures
            );
            requiresAdminAlert = false;
            log.info("Scraper status: DEGRADED - {} consecutive failures", consecutiveFailures);

        } else if (consecutiveFailures == 1 && failedCount > 1) {
            // DEGRADED: Some recent failures but not consecutive
            globalStatus = "DEGRADED";
            message = String.format(
                    "Scraping system experiencing intermittent failures. " +
                    "%d out of %d recent runs failed.",
                    failedCount, completedRuns.size()
            );
            requiresAdminAlert = false;
            log.info("Scraper status: DEGRADED - intermittent failures");

        } else {
            // OK: System operating normally
            globalStatus = "OK";
            message = "Scraping system is operating normally.";
            requiresAdminAlert = false;
            log.info("Scraper status: OK");
        }

        // 6. Build and return DTO
        return ScraperGlobalStatusDto.builder()
                .globalStatus(globalStatus)
                .lastSuccessfulTimestamp(lastSuccessfulTimestamp)
                .consecutiveFailures(consecutiveFailures)
                .totalRecentRuns(completedRuns.size())
                .successfulRecentRuns((int) successfulCount)
                .failedRecentRuns((int) failedCount)
                .message(message)
                .requiresAdminAlert(requiresAdminAlert)
                .build();
    }
}
