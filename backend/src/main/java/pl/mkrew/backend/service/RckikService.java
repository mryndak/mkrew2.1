package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.BloodSnapshot;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.ScraperLog;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.BloodSnapshotRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.ScraperLogRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RckikService {

    private final RckikRepository rckikRepository;
    private final BloodSnapshotRepository bloodSnapshotRepository;
    private final ScraperLogRepository scraperLogRepository;

    /**
     * Get list of RCKiK centers with current blood levels
     * US-007: Browse Blood Centers
     *
     * @param page Page number (zero-based)
     * @param size Page size
     * @param city Optional city filter
     * @param active Optional active status filter (default: true)
     * @param sortBy Sort field (default: "name")
     * @param sortOrder Sort order (default: "ASC")
     * @return RckikListResponse with pagination
     */
    @Transactional(readOnly = true)
    public RckikListResponse getRckikList(
            Integer page,
            Integer size,
            String city,
            Boolean active,
            String sortBy,
            String sortOrder) {

        log.debug("Getting RCKiK list - page: {}, size: {}, city: {}, active: {}, sortBy: {}, sortOrder: {}",
                page, size, city, active, sortBy, sortOrder);

        // Validate and set defaults
        int pageNumber = (page != null && page >= 0) ? page : 0;
        int pageSize = (size != null && size > 0 && size <= 100) ? size : 20;
        String sortField = (sortBy != null && isValidSortField(sortBy)) ? sortBy : "name";
        Sort.Direction direction = "DESC".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Boolean activeFilter = (active != null) ? active : true;

        // Create pageable
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, sortField));

        // Query RCKiK centers with filters
        Page<Rckik> rckikPage;
        if (city != null && !city.trim().isEmpty()) {
            if (activeFilter != null) {
                rckikPage = rckikRepository.findByCityAndActive(city.trim(), activeFilter, pageable);
            } else {
                rckikPage = rckikRepository.findByCity(city.trim(), pageable);
            }
        } else {
            if (activeFilter != null) {
                rckikPage = rckikRepository.findByActive(activeFilter, pageable);
            } else {
                rckikPage = rckikRepository.findAll(pageable);
            }
        }

        // Get RCKiK IDs from page
        List<Long> rckikIds = rckikPage.getContent().stream()
                .map(Rckik::getId)
                .collect(Collectors.toList());

        // Fetch latest blood snapshots for all RCKiK centers on this page
        Map<Long, List<BloodSnapshot>> snapshotsByRckikId = new java.util.HashMap<>();
        if (!rckikIds.isEmpty()) {
            List<BloodSnapshot> snapshots = bloodSnapshotRepository.findLatestByRckikIds(rckikIds);
            snapshotsByRckikId = snapshots.stream()
                    .collect(Collectors.groupingBy(bs -> bs.getRckik().getId()));
        }

        // Map to DTOs
        List<RckikSummaryDto> content = new ArrayList<>();
        for (Rckik rckik : rckikPage.getContent()) {
            List<BloodSnapshot> rckikSnapshots = snapshotsByRckikId.getOrDefault(rckik.getId(), List.of());
            RckikSummaryDto dto = mapToSummaryDto(rckik, rckikSnapshots);
            content.add(dto);
        }

        log.info("Retrieved {} RCKiK centers (page {}/{}, total: {})",
                content.size(), pageNumber + 1, rckikPage.getTotalPages(), rckikPage.getTotalElements());

        return RckikListResponse.builder()
                .content(content)
                .page(pageNumber)
                .size(pageSize)
                .totalElements(rckikPage.getTotalElements())
                .totalPages(rckikPage.getTotalPages())
                .first(rckikPage.isFirst())
                .last(rckikPage.isLast())
                .build();
    }

    /**
     * Map Rckik entity to RckikSummaryDto with blood levels
     *
     * @param rckik Rckik entity
     * @param snapshots List of blood snapshots (latest for each blood group)
     * @return RckikSummaryDto
     */
    private RckikSummaryDto mapToSummaryDto(Rckik rckik, List<BloodSnapshot> snapshots) {
        List<BloodLevelDto> bloodLevels = snapshots.stream()
                .map(this::mapToBloodLevelDto)
                .collect(Collectors.toList());

        return RckikSummaryDto.builder()
                .id(rckik.getId())
                .name(rckik.getName())
                .code(rckik.getCode())
                .city(rckik.getCity())
                .address(rckik.getAddress())
                .latitude(rckik.getLatitude())
                .longitude(rckik.getLongitude())
                .active(rckik.getActive())
                .bloodLevels(bloodLevels)
                .build();
    }

    /**
     * Map BloodSnapshot entity to BloodLevelDto with calculated status
     *
     * @param snapshot BloodSnapshot entity
     * @return BloodLevelDto
     */
    private BloodLevelDto mapToBloodLevelDto(BloodSnapshot snapshot) {
        String levelStatus = calculateLevelStatus(snapshot.getLevelPercentage());

        return BloodLevelDto.builder()
                .bloodGroup(snapshot.getBloodGroup())
                .levelPercentage(snapshot.getLevelPercentage())
                .levelStatus(levelStatus)
                .lastUpdate(snapshot.getScrapedAt())
                .build();
    }

    /**
     * Calculate blood level status based on percentage
     * CRITICAL: <20%
     * IMPORTANT: <50%
     * OK: >=50%
     *
     * @param levelPercentage Blood level percentage
     * @return Status string (CRITICAL, IMPORTANT, OK)
     */
    private String calculateLevelStatus(BigDecimal levelPercentage) {
        if (levelPercentage == null) {
            return "UNKNOWN";
        }

        if (levelPercentage.compareTo(new BigDecimal("20")) < 0) {
            return "CRITICAL";
        } else if (levelPercentage.compareTo(new BigDecimal("50")) < 0) {
            return "IMPORTANT";
        } else {
            return "OK";
        }
    }

    /**
     * Validate sort field to prevent SQL injection
     *
     * @param sortBy Sort field name
     * @return true if valid, false otherwise
     */
    private boolean isValidSortField(String sortBy) {
        return List.of("id", "name", "code", "city").contains(sortBy.toLowerCase());
    }

    /**
     * Get detailed information about specific RCKiK center
     * US-008: View Center Details
     *
     * @param id RCKiK ID
     * @return RckikDetailDto
     */
    @Transactional(readOnly = true)
    public RckikDetailDto getRckikDetail(Long id) {
        log.debug("Getting RCKiK detail for ID: {}", id);

        // Find RCKiK center
        Rckik rckik = rckikRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RCKiK center not found with ID: " + id));

        // Get latest blood snapshots
        List<BloodSnapshot> latestSnapshots = bloodSnapshotRepository.findLatestByRckikId(id);
        List<BloodLevelDto> currentBloodLevels = latestSnapshots.stream()
                .map(this::mapToBloodLevelDto)
                .collect(Collectors.toList());

        // Get scraping status
        ScraperLog latestSuccessLog = scraperLogRepository.findLatestSuccessByRckikId(id).orElse(null);
        ScraperLog latestLog = scraperLogRepository.findLatestByRckikId(id).orElse(null);

        String scrapingStatus = determineScrapingStatus(latestLog);

        log.info("Retrieved RCKiK detail for ID: {} - {} blood levels, scraping status: {}",
                id, currentBloodLevels.size(), scrapingStatus);

        return RckikDetailDto.builder()
                .id(rckik.getId())
                .name(rckik.getName())
                .code(rckik.getCode())
                .city(rckik.getCity())
                .address(rckik.getAddress())
                .latitude(rckik.getLatitude())
                .longitude(rckik.getLongitude())
                .aliases(rckik.getAliases())
                .active(rckik.getActive())
                .createdAt(rckik.getCreatedAt())
                .updatedAt(rckik.getUpdatedAt())
                .currentBloodLevels(currentBloodLevels)
                .lastSuccessfulScrape(latestSuccessLog != null ? latestSuccessLog.getCreatedAt() : null)
                .scrapingStatus(scrapingStatus)
                .build();
    }

    /**
     * Get historical blood level snapshots for a RCKiK center
     * US-008: View Trends
     *
     * @param id RCKiK ID
     * @param bloodGroup Optional blood group filter
     * @param fromDate Optional start date filter
     * @param toDate Optional end date filter
     * @param page Page number (zero-based)
     * @param size Page size
     * @return BloodLevelHistoryResponse with pagination
     */
    @Transactional(readOnly = true)
    public BloodLevelHistoryResponse getBloodLevelHistory(
            Long id,
            String bloodGroup,
            LocalDate fromDate,
            LocalDate toDate,
            Integer page,
            Integer size) {

        log.debug("Getting blood level history for RCKiK ID: {} - bloodGroup: {}, fromDate: {}, toDate: {}, page: {}, size: {}",
                id, bloodGroup, fromDate, toDate, page, size);

        // Find RCKiK center
        Rckik rckik = rckikRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RCKiK center not found with ID: " + id));

        // Validate and set defaults
        int pageNumber = (page != null && page >= 0) ? page : 0;
        int pageSize = (size != null && size > 0 && size <= 100) ? size : 30;

        // Create pageable (descending by snapshot_date, then scraped_at)
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        // Query based on filters
        Page<BloodSnapshot> snapshotPage;
        if (bloodGroup != null && !bloodGroup.trim().isEmpty()) {
            if (fromDate != null && toDate != null) {
                // Blood group + date range
                snapshotPage = bloodSnapshotRepository
                        .findByRckikIdAndBloodGroupAndSnapshotDateBetweenOrderBySnapshotDateDescScrapedAtDesc(
                                id, bloodGroup.trim(), fromDate, toDate, pageable);
            } else {
                // Blood group only
                snapshotPage = bloodSnapshotRepository
                        .findByRckikIdAndBloodGroupOrderBySnapshotDateDescScrapedAtDesc(
                                id, bloodGroup.trim(), pageable);
            }
        } else {
            if (fromDate != null && toDate != null) {
                // Date range only
                snapshotPage = bloodSnapshotRepository
                        .findByRckikIdAndSnapshotDateBetweenOrderBySnapshotDateDescScrapedAtDesc(
                                id, fromDate, toDate, pageable);
            } else {
                // No filters
                snapshotPage = bloodSnapshotRepository
                        .findByRckikIdOrderBySnapshotDateDescScrapedAtDesc(id, pageable);
            }
        }

        // Map to DTOs
        List<BloodLevelHistoryDto> snapshots = snapshotPage.getContent().stream()
                .map(this::mapToHistoryDto)
                .collect(Collectors.toList());

        log.info("Retrieved {} blood level snapshots for RCKiK ID: {} (page {}/{}, total: {})",
                snapshots.size(), id, pageNumber + 1, snapshotPage.getTotalPages(), snapshotPage.getTotalElements());

        return BloodLevelHistoryResponse.builder()
                .rckikId(rckik.getId())
                .rckikName(rckik.getName())
                .snapshots(snapshots)
                .page(pageNumber)
                .size(pageSize)
                .totalElements(snapshotPage.getTotalElements())
                .totalPages(snapshotPage.getTotalPages())
                .first(snapshotPage.isFirst())
                .last(snapshotPage.isLast())
                .build();
    }

    /**
     * Map BloodSnapshot to BloodLevelHistoryDto
     *
     * @param snapshot BloodSnapshot entity
     * @return BloodLevelHistoryDto
     */
    private BloodLevelHistoryDto mapToHistoryDto(BloodSnapshot snapshot) {
        String levelStatus = calculateLevelStatus(snapshot.getLevelPercentage());

        return BloodLevelHistoryDto.builder()
                .id(snapshot.getId())
                .snapshotDate(snapshot.getSnapshotDate())
                .bloodGroup(snapshot.getBloodGroup())
                .levelPercentage(snapshot.getLevelPercentage())
                .levelStatus(levelStatus)
                .scrapedAt(snapshot.getScrapedAt())
                .isManual(snapshot.getIsManual())
                .build();
    }

    /**
     * Determine scraping status based on latest log
     *
     * @param latestLog Latest scraper log (may be null)
     * @return Status string (OK, DEGRADED, FAILED, UNKNOWN)
     */
    private String determineScrapingStatus(ScraperLog latestLog) {
        if (latestLog == null) {
            return "UNKNOWN";
        }

        String status = latestLog.getStatus();
        if ("SUCCESS".equals(status)) {
            return "OK";
        } else if ("PARTIAL".equals(status)) {
            return "DEGRADED";
        } else if ("FAILED".equals(status)) {
            return "FAILED";
        } else {
            return "UNKNOWN";
        }
    }
}
