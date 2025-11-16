package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.BloodSnapshotResponse;
import pl.mkrew.backend.dto.CreateBloodSnapshotRequest;
import pl.mkrew.backend.dto.UpdateBloodSnapshotRequest;
import pl.mkrew.backend.entity.BloodSnapshot;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.exception.ValidationException;
import pl.mkrew.backend.repository.BloodSnapshotRepository;
import pl.mkrew.backend.repository.RckikRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing blood snapshots (US-028)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BloodSnapshotService {

    private final BloodSnapshotRepository bloodSnapshotRepository;
    private final RckikRepository rckikRepository;
    private final AuditLogService auditLogService;

    /**
     * Create manual blood snapshot
     * US-028: Ręczne wprowadzanie stanów krwi przez administratora
     */
    @Transactional
    public BloodSnapshotResponse createManualSnapshot(CreateBloodSnapshotRequest request, Long userId) {
        log.info("Creating manual blood snapshot for RCKiK ID: {}, blood group: {}, date: {}, userId: {}",
            request.getRckikId(), request.getBloodGroup(), request.getSnapshotDate(), userId);

        // Validate RCKiK exists and is active
        Rckik rckik = rckikRepository.findById(request.getRckikId())
            .orElseThrow(() -> new ResourceNotFoundException("RCKiK not found with id: " + request.getRckikId()));

        if (!rckik.getActive()) {
            throw new ValidationException("Cannot create snapshot for inactive RCKiK center");
        }

        // Validate snapshot date (cannot be more than 2 years in the past)
        LocalDate twoYearsAgo = LocalDate.now().minusYears(2);
        if (request.getSnapshotDate().isBefore(twoYearsAgo)) {
            throw new ValidationException("Snapshot date cannot be older than 2 years");
        }

        // Create blood snapshot
        BloodSnapshot snapshot = BloodSnapshot.builder()
            .rckik(rckik)
            .snapshotDate(request.getSnapshotDate())
            .bloodGroup(request.getBloodGroup())
            .levelPercentage(request.getLevelPercentage())
            .isManual(true)
            .sourceUrl(null)
            .parserVersion(null)
            .build();

        BloodSnapshot savedSnapshot = bloodSnapshotRepository.save(snapshot);

        // Create audit log
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("rckikId", request.getRckikId());
        metadata.put("rckikName", rckik.getName());
        metadata.put("bloodGroup", request.getBloodGroup());
        metadata.put("levelPercentage", request.getLevelPercentage());
        metadata.put("snapshotDate", request.getSnapshotDate().toString());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            metadata.put("notes", request.getNotes());
        }

        auditLogService.logAction(
            String.valueOf(userId),
            "MANUAL_SNAPSHOT_CREATED",
            "BloodSnapshot",
            savedSnapshot.getId(),
            metadata
        );

        log.info("Manual blood snapshot created successfully with ID: {}", savedSnapshot.getId());

        return mapToResponse(savedSnapshot, null, request.getNotes());
    }

    /**
     * List manual blood snapshots with filtering
     * US-028: Przegląd ręcznie wprowadzonych snapshotów
     */
    @Transactional(readOnly = true)
    public Page<BloodSnapshotResponse> listManualSnapshots(
            Long rckikId,
            String bloodGroup,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean manualOnly,
            int page,
            int size,
            String sortBy,
            String sortOrder) {

        log.info("Listing blood snapshots - rckikId: {}, bloodGroup: {}, manualOnly: {}", rckikId, bloodGroup, manualOnly);

        Sort sort = sortOrder.equalsIgnoreCase("DESC")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        // TODO: Implement custom query with filtering
        // For now, return all snapshots and filter in memory (not optimal for production)
        Page<BloodSnapshot> snapshots = bloodSnapshotRepository.findAll(pageable);

        return snapshots.map(snapshot -> mapToResponse(snapshot, null, null));
    }

    /**
     * Get blood snapshot details by ID
     * US-028: Szczegóły snapshotu
     */
    @Transactional(readOnly = true)
    public BloodSnapshotResponse getSnapshotById(Long id) {
        log.info("Getting blood snapshot details for ID: {}", id);

        BloodSnapshot snapshot = bloodSnapshotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blood snapshot not found with id: " + id));

        return mapToResponseWithAuditTrail(snapshot);
    }

    /**
     * Update manual blood snapshot
     * US-028: Aktualizacja ręcznie wprowadzonego snapshotu
     */
    @Transactional
    public BloodSnapshotResponse updateManualSnapshot(Long id, UpdateBloodSnapshotRequest request, Long userId) {
        log.info("Updating manual blood snapshot ID: {}, userId: {}", id, userId);

        BloodSnapshot snapshot = bloodSnapshotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blood snapshot not found with id: " + id));

        if (!snapshot.getIsManual()) {
            throw new ValidationException("Cannot update automated snapshot. Only manual snapshots can be edited.");
        }

        BigDecimal oldLevel = snapshot.getLevelPercentage();
        snapshot.setLevelPercentage(request.getLevelPercentage());

        BloodSnapshot updatedSnapshot = bloodSnapshotRepository.save(snapshot);

        // Create audit log
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("snapshotId", id);
        metadata.put("bloodGroup", snapshot.getBloodGroup());
        metadata.put("oldLevelPercentage", oldLevel);
        metadata.put("newLevelPercentage", request.getLevelPercentage());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            metadata.put("notes", request.getNotes());
        }

        auditLogService.logAction(
            String.valueOf(userId),
            "MANUAL_SNAPSHOT_UPDATED",
            "BloodSnapshot",
            updatedSnapshot.getId(),
            metadata
        );

        log.info("Manual blood snapshot updated successfully with ID: {}", updatedSnapshot.getId());

        return mapToResponse(updatedSnapshot, null, request.getNotes());
    }

    /**
     * Delete manual blood snapshot
     * US-028: Usuwanie ręcznie wprowadzonego snapshotu
     */
    @Transactional
    public void deleteManualSnapshot(Long id, Long userId) {
        log.info("Deleting manual blood snapshot ID: {}, userId: {}", id, userId);

        BloodSnapshot snapshot = bloodSnapshotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Blood snapshot not found with id: " + id));

        if (!snapshot.getIsManual()) {
            throw new ValidationException("Cannot delete automated snapshot. Only manual snapshots can be deleted.");
        }

        // Create audit log before deletion
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("snapshotId", id);
        metadata.put("rckikId", snapshot.getRckik().getId());
        metadata.put("rckikName", snapshot.getRckik().getName());
        metadata.put("bloodGroup", snapshot.getBloodGroup());
        metadata.put("levelPercentage", snapshot.getLevelPercentage());
        metadata.put("snapshotDate", snapshot.getSnapshotDate().toString());

        auditLogService.logAction(
            String.valueOf(userId),
            "MANUAL_SNAPSHOT_DELETED",
            "BloodSnapshot",
            snapshot.getId(),
            metadata
        );

        bloodSnapshotRepository.delete(snapshot);

        log.info("Manual blood snapshot deleted successfully with ID: {}", id);
    }

    /**
     * Map BloodSnapshot entity to response DTO
     */
    private BloodSnapshotResponse mapToResponse(BloodSnapshot snapshot, String createdBy, String notes) {
        return BloodSnapshotResponse.builder()
            .id(snapshot.getId())
            .rckikId(snapshot.getRckik().getId())
            .rckikName(snapshot.getRckik().getName())
            .rckikCode(snapshot.getRckik().getCode())
            .snapshotDate(snapshot.getSnapshotDate())
            .bloodGroup(snapshot.getBloodGroup())
            .levelPercentage(snapshot.getLevelPercentage())
            .levelStatus(BloodSnapshotResponse.calculateLevelStatus(snapshot.getLevelPercentage()))
            .sourceUrl(snapshot.getSourceUrl())
            .parserVersion(snapshot.getParserVersion())
            .scrapedAt(snapshot.getScrapedAt())
            .isManual(snapshot.getIsManual())
            .createdBy(createdBy)
            .createdAt(snapshot.getScrapedAt())
            .auditTrail(notes != null ? BloodSnapshotResponse.AuditTrailDto.builder()
                .notes(notes)
                .build() : null)
            .build();
    }

    /**
     * Map BloodSnapshot entity to response DTO with full audit trail
     */
    private BloodSnapshotResponse mapToResponseWithAuditTrail(BloodSnapshot snapshot) {
        // TODO: Fetch audit trail from AuditLogService
        return mapToResponse(snapshot, null, null);
    }
}
