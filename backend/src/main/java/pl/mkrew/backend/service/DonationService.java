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

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final RckikRepository rckikRepository;

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
