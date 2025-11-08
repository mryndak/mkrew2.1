package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.Donation;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.DonationRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final RckikRepository rckikRepository;
    private final AuditLogService auditLogService;

    /**
     * Get user's donation history with pagination and filtering
     * US-012: View Donation History
     *
     * @param userId User ID
     * @param fromDate Optional start date filter
     * @param toDate Optional end date filter
     * @param rckikId Optional RCKiK filter
     * @param pageable Pagination parameters
     * @return Paginated donation list with statistics
     */
    @Transactional(readOnly = true)
    public DonationListResponse getUserDonations(
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            Long rckikId,
            Pageable pageable) {

        log.debug("Getting donations for user ID: {} with filters - fromDate: {}, toDate: {}, rckikId: {}",
                userId, fromDate, toDate, rckikId);

        // Verify user exists and is active
        if (!userRepository.existsByIdAndDeletedAtIsNull(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        // Query donations based on filters
        Page<Donation> donationPage = queryDonationsWithFilters(userId, fromDate, toDate, rckikId, pageable);

        // Calculate statistics
        DonationStatisticsDto statistics = calculateStatistics(userId);

        // Map to response
        DonationListResponse response = DonationListResponse.builder()
                .donations(donationPage.getContent().stream()
                        .map(this::mapToDonationResponse)
                        .toList())
                .page(donationPage.getNumber())
                .size(donationPage.getSize())
                .totalElements(donationPage.getTotalElements())
                .totalPages(donationPage.getTotalPages())
                .first(donationPage.isFirst())
                .last(donationPage.isLast())
                .statistics(statistics)
                .build();

        log.info("Retrieved {} donations for user ID: {} (page {}/{})",
                donationPage.getNumberOfElements(), userId, donationPage.getNumber() + 1, donationPage.getTotalPages());

        return response;
    }

    /**
     * Create new donation entry
     * US-012: Add Donation Entry
     *
     * @param userId User ID
     * @param request Donation data
     * @return Created donation
     */
    @Transactional
    public DonationResponse createDonation(Long userId, CreateDonationRequest request) {
        log.debug("Creating donation for user ID: {} at RCKiK ID: {} on date: {}",
                userId, request.getRckikId(), request.getDonationDate());

        // Verify user exists and is active
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify RCKiK exists
        Rckik rckik = rckikRepository.findById(request.getRckikId())
                .orElseThrow(() -> new ResourceNotFoundException("RCKiK center not found with ID: " + request.getRckikId()));

        // Additional validation: donation date cannot be more than 5 years in the past
        LocalDate fiveYearsAgo = LocalDate.now().minusYears(5);
        if (request.getDonationDate().isBefore(fiveYearsAgo)) {
            throw new IllegalArgumentException("Donation date cannot be more than 5 years in the past");
        }

        // Create donation entity
        Donation donation = Donation.builder()
                .user(user)
                .rckik(rckik)
                .donationDate(request.getDonationDate())
                .quantityMl(request.getQuantityMl())
                .donationType(request.getDonationType())
                .notes(request.getNotes())
                .confirmed(false) // Default to false per US-012 business logic
                .build();

        Donation savedDonation = donationRepository.save(donation);

        log.info("Created donation ID: {} for user ID: {} at RCKiK ID: {}",
                savedDonation.getId(), userId, request.getRckikId());

        return mapToDonationResponse(savedDonation);
    }

    /**
     * Get single donation by ID
     *
     * @param userId User ID (for ownership verification)
     * @param donationId Donation ID
     * @return Donation details
     */
    @Transactional(readOnly = true)
    public DonationResponse getDonationById(Long userId, Long donationId) {
        log.debug("Getting donation ID: {} for user ID: {}", donationId, userId);

        Donation donation = donationRepository.findByIdAndUserIdAndDeletedAtIsNull(donationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found with ID: " + donationId + " for user: " + userId));

        return mapToDonationResponse(donation);
    }

    /**
     * Update existing donation entry
     * US-013: Edit Donation
     *
     * @param userId User ID (for ownership verification)
     * @param donationId Donation ID
     * @param request Update data
     * @return Updated donation
     */
    @Transactional
    public DonationResponse updateDonation(Long userId, Long donationId, UpdateDonationRequest request) {
        log.debug("Updating donation ID: {} for user ID: {}", donationId, userId);

        // Fetch donation and verify ownership
        Donation donation = donationRepository.findByIdAndUserIdAndDeletedAtIsNull(donationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found with ID: " + donationId + " for user: " + userId));

        // Track changes for audit log
        Map<String, Object> changes = new HashMap<>();
        boolean hasChanges = false;

        // Update only provided fields (partial update)
        if (request.getQuantityMl() != null && !request.getQuantityMl().equals(donation.getQuantityMl())) {
            changes.put("quantityMl", Map.of("old", donation.getQuantityMl(), "new", request.getQuantityMl()));
            donation.setQuantityMl(request.getQuantityMl());
            hasChanges = true;
        }

        if (request.getDonationType() != null && !request.getDonationType().equals(donation.getDonationType())) {
            changes.put("donationType", Map.of("old", donation.getDonationType(), "new", request.getDonationType()));
            donation.setDonationType(request.getDonationType());
            hasChanges = true;
        }

        if (request.getNotes() != null && !request.getNotes().equals(donation.getNotes())) {
            changes.put("notes", Map.of("old", donation.getNotes() != null ? donation.getNotes() : "", "new", request.getNotes()));
            donation.setNotes(request.getNotes());
            hasChanges = true;
        }

        if (!hasChanges) {
            log.debug("No changes detected for donation ID: {}", donationId);
            return mapToDonationResponse(donation);
        }

        // Save updated donation (updatedAt will be automatically updated by @UpdateTimestamp)
        Donation updatedDonation = donationRepository.save(donation);

        // Create audit log entry
        auditLogService.logDonationUpdate(userId, donationId, changes);

        log.info("Updated donation ID: {} for user ID: {} - {} field(s) changed",
                donationId, userId, changes.size());

        return mapToDonationResponse(updatedDonation);
    }

    /**
     * Delete donation entry (soft delete)
     * US-013: Remove Donation
     *
     * @param userId User ID (for ownership verification)
     * @param donationId Donation ID
     */
    @Transactional
    public void deleteDonation(Long userId, Long donationId) {
        log.debug("Deleting donation ID: {} for user ID: {}", donationId, userId);

        // Fetch donation and verify ownership
        Donation donation = donationRepository.findByIdAndUserIdAndDeletedAtIsNull(donationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found with ID: " + donationId + " for user: " + userId));

        // Prepare data for audit log before deletion
        Map<String, Object> donationData = new HashMap<>();
        donationData.put("donationId", donation.getId());
        donationData.put("rckikId", donation.getRckik().getId());
        donationData.put("rckikName", donation.getRckik().getName());
        donationData.put("donationDate", donation.getDonationDate().toString());
        donationData.put("quantityMl", donation.getQuantityMl());
        donationData.put("donationType", donation.getDonationType());
        donationData.put("notes", donation.getNotes());
        donationData.put("confirmed", donation.getConfirmed());
        donationData.put("createdAt", donation.getCreatedAt().toString());

        // Soft delete: Set deleted_at timestamp
        donation.setDeletedAt(LocalDateTime.now());
        donationRepository.save(donation);

        // Create audit log entry (US-013 requirement)
        auditLogService.logDonationDeletion(userId, donationId, donationData);

        log.info("Deleted (soft) donation ID: {} for user ID: {}", donationId, userId);
    }

    /**
     * Export user's donation history to JSON format
     * US-014: Export to JSON
     *
     * @param userId User ID
     * @param fromDate Optional start date filter
     * @param toDate Optional end date filter
     * @return Export response with donation data
     */
    @Transactional(readOnly = true)
    public DonationExportResponse exportDonationsToJson(Long userId, LocalDate fromDate, LocalDate toDate) {
        log.debug("Exporting donations to JSON for user ID: {} (fromDate: {}, toDate: {})",
                userId, fromDate, toDate);

        // Verify user exists
        if (!userRepository.existsByIdAndDeletedAtIsNull(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        // Get donations based on filters
        List<Donation> donations = queryDonationsForExport(userId, fromDate, toDate);

        // Calculate totals
        long totalDonations = donations.size();
        long totalQuantityMl = donations.stream()
                .mapToLong(Donation::getQuantityMl)
                .sum();

        // Map to export DTOs
        List<DonationExportDto> exportDonations = donations.stream()
                .map(this::mapToDonationExportDto)
                .collect(Collectors.toList());

        DonationExportResponse response = DonationExportResponse.builder()
                .userId(userId)
                .exportDate(LocalDateTime.now())
                .donations(exportDonations)
                .totalDonations(totalDonations)
                .totalQuantityMl(totalQuantityMl)
                .build();

        log.info("Exported {} donations to JSON for user ID: {}", totalDonations, userId);

        return response;
    }

    /**
     * Export user's donation history to CSV format
     * US-014: Export to CSV
     *
     * @param userId User ID
     * @param fromDate Optional start date filter
     * @param toDate Optional end date filter
     * @return CSV string
     */
    @Transactional(readOnly = true)
    public String exportDonationsToCsv(Long userId, LocalDate fromDate, LocalDate toDate) {
        log.debug("Exporting donations to CSV for user ID: {} (fromDate: {}, toDate: {})",
                userId, fromDate, toDate);

        // Verify user exists
        if (!userRepository.existsByIdAndDeletedAtIsNull(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        // Get donations based on filters
        List<Donation> donations = queryDonationsForExport(userId, fromDate, toDate);

        // Build CSV
        StringBuilder csv = new StringBuilder();

        // Header
        csv.append("Donation Date,RCKiK Name,RCKiK City,Quantity (ml),Donation Type,Notes,Confirmed\n");

        // Rows
        for (Donation donation : donations) {
            Rckik rckik = donation.getRckik();
            csv.append(escapeCSV(donation.getDonationDate().toString())).append(",");
            csv.append(escapeCSV(rckik.getName())).append(",");
            csv.append(escapeCSV(rckik.getCity())).append(",");
            csv.append(donation.getQuantityMl()).append(",");
            csv.append(escapeCSV(donation.getDonationType())).append(",");
            csv.append(escapeCSV(donation.getNotes() != null ? donation.getNotes() : "")).append(",");
            csv.append(donation.getConfirmed()).append("\n");
        }

        log.info("Exported {} donations to CSV for user ID: {}", donations.size(), userId);

        return csv.toString();
    }

    /**
     * Query donations for export (no pagination)
     *
     * @param userId User ID
     * @param fromDate Optional start date
     * @param toDate Optional end date
     * @return List of donations
     */
    private List<Donation> queryDonationsForExport(Long userId, LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null) {
            return donationRepository.findByUserIdAndDonationDateBetweenAndDeletedAtIsNullOrderByDonationDateDesc(
                    userId, fromDate, toDate);
        }
        return donationRepository.findByUserIdAndDeletedAtIsNullOrderByDonationDateDesc(userId);
    }

    /**
     * Map Donation entity to DonationExportDto
     *
     * @param donation Donation entity
     * @return DonationExportDto
     */
    private DonationExportDto mapToDonationExportDto(Donation donation) {
        Rckik rckik = donation.getRckik();

        return DonationExportDto.builder()
                .donationDate(donation.getDonationDate())
                .rckikName(rckik.getName())
                .rckikCity(rckik.getCity())
                .quantityMl(donation.getQuantityMl())
                .donationType(donation.getDonationType())
                .notes(donation.getNotes())
                .confirmed(donation.getConfirmed())
                .build();
    }

    /**
     * Escape CSV field (handle commas, quotes, newlines)
     *
     * @param value Field value
     * @return Escaped value
     */
    private String escapeCSV(String value) {
        if (value == null) {
            return "";
        }

        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }

        return value;
    }

    /**
     * Query donations with optional filters
     *
     * @param userId User ID
     * @param fromDate Optional start date
     * @param toDate Optional end date
     * @param rckikId Optional RCKiK ID
     * @param pageable Pagination parameters
     * @return Page of donations
     */
    private Page<Donation> queryDonationsWithFilters(
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            Long rckikId,
            Pageable pageable) {

        // Both date filters and RCKiK filter
        if (fromDate != null && toDate != null && rckikId != null) {
            return donationRepository.findByUserIdAndRckikIdAndDonationDateBetweenAndDeletedAtIsNull(
                    userId, rckikId, fromDate, toDate, pageable);
        }

        // Date filters only
        if (fromDate != null && toDate != null) {
            return donationRepository.findByUserIdAndDonationDateBetweenAndDeletedAtIsNull(
                    userId, fromDate, toDate, pageable);
        }

        // RCKiK filter only
        if (rckikId != null) {
            return donationRepository.findByUserIdAndRckikIdAndDeletedAtIsNull(userId, rckikId, pageable);
        }

        // No filters
        return donationRepository.findByUserIdAndDeletedAtIsNull(userId, pageable);
    }

    /**
     * Calculate donation statistics for user
     *
     * @param userId User ID
     * @return Statistics
     */
    private DonationStatisticsDto calculateStatistics(Long userId) {
        long totalDonations = donationRepository.countByUserIdAndDeletedAtIsNull(userId);
        Long totalQuantity = donationRepository.sumQuantityByUserId(userId);
        LocalDate lastDonationDate = donationRepository.findLatestDonationDateByUserId(userId);

        return DonationStatisticsDto.builder()
                .totalDonations(totalDonations)
                .totalQuantityMl(totalQuantity != null ? totalQuantity : 0L)
                .lastDonationDate(lastDonationDate)
                .build();
    }

    /**
     * Map Donation entity to DonationResponse DTO
     *
     * @param donation Donation entity
     * @return DonationResponse DTO
     */
    private DonationResponse mapToDonationResponse(Donation donation) {
        Rckik rckik = donation.getRckik();

        RckikBasicDto rckikDto = RckikBasicDto.builder()
                .id(rckik.getId())
                .name(rckik.getName())
                .code(rckik.getCode())
                .city(rckik.getCity())
                .build();

        return DonationResponse.builder()
                .id(donation.getId())
                .rckik(rckikDto)
                .donationDate(donation.getDonationDate())
                .quantityMl(donation.getQuantityMl())
                .donationType(donation.getDonationType())
                .notes(donation.getNotes())
                .confirmed(donation.getConfirmed())
                .createdAt(donation.getCreatedAt())
                .updatedAt(donation.getUpdatedAt())
                .build();
    }
}
