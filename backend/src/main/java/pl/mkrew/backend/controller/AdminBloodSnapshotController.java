package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.BloodSnapshotResponse;
import pl.mkrew.backend.dto.CreateBloodSnapshotRequest;
import pl.mkrew.backend.dto.UpdateBloodSnapshotRequest;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.BloodSnapshotService;

import java.time.LocalDate;

/**
 * Admin Controller for managing blood snapshots (US-028)
 */
@RestController
@RequestMapping("/api/v1/admin/blood-snapshots")
@RequiredArgsConstructor
@Tag(name = "Admin Blood Snapshots", description = "Admin endpoints for manual blood snapshot management")
@SecurityRequirement(name = "bearerAuth")
public class AdminBloodSnapshotController {

    private final BloodSnapshotService bloodSnapshotService;

    /**
     * Create manual blood snapshot
     * POST /api/v1/admin/blood-snapshots
     * US-028: Ręczne wprowadzanie stanów krwi przez administratora
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create manual blood snapshot",
        description = "Manually create blood level snapshot for RCKiK (including historical/backdated data)"
    )
    public ResponseEntity<BloodSnapshotResponse> createManualSnapshot(
            @Valid @RequestBody CreateBloodSnapshotRequest request) {

        String adminEmail = SecurityUtils.getCurrentUserEmail();
        BloodSnapshotResponse response = bloodSnapshotService.createManualSnapshot(request, adminEmail);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * List blood snapshots with filtering
     * GET /api/v1/admin/blood-snapshots
     * US-028: Przegląd snapshotów
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "List blood snapshots",
        description = "Get list of blood snapshots with filtering options (manual/automated)"
    )
    public ResponseEntity<Page<BloodSnapshotResponse>> listSnapshots(
            @RequestParam(required = false) Long rckikId,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "true") Boolean manualOnly,
            @RequestParam(required = false) String createdBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "snapshotDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortOrder) {

        Page<BloodSnapshotResponse> snapshots = bloodSnapshotService.listManualSnapshots(
            rckikId, bloodGroup, fromDate, toDate, manualOnly, page, size, sortBy, sortOrder
        );

        return ResponseEntity.ok(snapshots);
    }

    /**
     * Get blood snapshot details by ID
     * GET /api/v1/admin/blood-snapshots/{id}
     * US-028: Szczegóły snapshotu
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get blood snapshot details",
        description = "Get detailed information about specific blood snapshot with audit trail"
    )
    public ResponseEntity<BloodSnapshotResponse> getSnapshotById(@PathVariable Long id) {
        BloodSnapshotResponse response = bloodSnapshotService.getSnapshotById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update manual blood snapshot
     * PUT /api/v1/admin/blood-snapshots/{id}
     * US-028: Aktualizacja ręcznie wprowadzonego snapshotu
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update manual blood snapshot",
        description = "Update existing manual blood snapshot (level percentage only)"
    )
    public ResponseEntity<BloodSnapshotResponse> updateManualSnapshot(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBloodSnapshotRequest request) {

        String adminEmail = SecurityUtils.getCurrentUserEmail();
        BloodSnapshotResponse response = bloodSnapshotService.updateManualSnapshot(id, request, adminEmail);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete manual blood snapshot
     * DELETE /api/v1/admin/blood-snapshots/{id}
     * US-028: Usuwanie ręcznie wprowadzonego snapshotu
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Delete manual blood snapshot",
        description = "Delete manual blood snapshot (hard delete, use with caution)"
    )
    public ResponseEntity<Void> deleteManualSnapshot(@PathVariable Long id) {
        String adminEmail = SecurityUtils.getCurrentUserEmail();
        bloodSnapshotService.deleteManualSnapshot(id, adminEmail);

        return ResponseEntity.noContent().build();
    }
}
