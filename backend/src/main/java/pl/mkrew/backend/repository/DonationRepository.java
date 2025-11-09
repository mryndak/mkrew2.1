package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.Donation;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    /**
     * Find all donations for a user (excluding soft-deleted)
     * US-012: View Donation History
     *
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Page of donations
     */
    Page<Donation> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    /**
     * Find donations for a user within date range (excluding soft-deleted)
     *
     * @param userId User ID
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @param pageable Pagination parameters
     * @return Page of donations
     */
    Page<Donation> findByUserIdAndDonationDateBetweenAndDeletedAtIsNull(
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    );

    /**
     * Find donations for a user at specific RCKiK (excluding soft-deleted)
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     * @param pageable Pagination parameters
     * @return Page of donations
     */
    Page<Donation> findByUserIdAndRckikIdAndDeletedAtIsNull(
            Long userId,
            Long rckikId,
            Pageable pageable
    );

    /**
     * Find donations for a user at specific RCKiK within date range (excluding soft-deleted)
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @param pageable Pagination parameters
     * @return Page of donations
     */
    Page<Donation> findByUserIdAndRckikIdAndDonationDateBetweenAndDeletedAtIsNull(
            Long userId,
            Long rckikId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    );

    /**
     * Find donation by ID and user (excluding soft-deleted)
     *
     * @param id Donation ID
     * @param userId User ID
     * @return Optional donation
     */
    Optional<Donation> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /**
     * Count total donations for a user (excluding soft-deleted)
     *
     * @param userId User ID
     * @return Number of donations
     */
    long countByUserIdAndDeletedAtIsNull(Long userId);

    /**
     * Calculate total quantity donated by user (excluding soft-deleted)
     *
     * @param userId User ID
     * @return Total quantity in ml
     */
    @Query("SELECT COALESCE(SUM(d.quantityMl), 0) FROM Donation d " +
           "WHERE d.user.id = :userId AND d.deletedAt IS NULL")
    Long sumQuantityByUserId(@Param("userId") Long userId);

    /**
     * Find latest donation date for a user (excluding soft-deleted)
     *
     * @param userId User ID
     * @return Latest donation date or null if no donations
     */
    @Query("SELECT MAX(d.donationDate) FROM Donation d " +
           "WHERE d.user.id = :userId AND d.deletedAt IS NULL")
    LocalDate findLatestDonationDateByUserId(@Param("userId") Long userId);

    /**
     * Find all donations for a user (excluding soft-deleted) - for export
     *
     * @param userId User ID
     * @return List of donations
     */
    List<Donation> findByUserIdAndDeletedAtIsNullOrderByDonationDateDesc(Long userId);

    /**
     * Find donations for a user within date range (excluding soft-deleted) - for export
     *
     * @param userId User ID
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of donations
     */
    List<Donation> findByUserIdAndDonationDateBetweenAndDeletedAtIsNullOrderByDonationDateDesc(
            Long userId,
            LocalDate fromDate,
            LocalDate toDate
    );

    /**
     * Check if user owns donation (excluding soft-deleted)
     *
     * @param id Donation ID
     * @param userId User ID
     * @return true if owned by user, false otherwise
     */
    boolean existsByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    // ========== US-026: Anonymized Report Queries ==========

    /**
     * US-026: Count total donations (excluding soft-deleted) - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Total number of donations
     */
    @Query("SELECT COUNT(d) FROM Donation d " +
           "WHERE d.deletedAt IS NULL " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate")
    Long countDonationsByDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Sum total volume donated (excluding soft-deleted) - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Total volume in ml
     */
    @Query("SELECT COALESCE(SUM(d.quantityMl), 0) FROM Donation d " +
           "WHERE d.deletedAt IS NULL " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate")
    Long sumVolumeByDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count donations by blood group (excluding soft-deleted) - for anonymized reports
     * Returns list of [bloodGroup, count] pairs
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of Object arrays [String bloodGroup, Long count]
     */
    @Query("SELECT u.bloodGroup, COUNT(d) FROM Donation d " +
           "JOIN d.user u " +
           "WHERE d.deletedAt IS NULL " +
           "AND u.bloodGroup IS NOT NULL " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY u.bloodGroup " +
           "ORDER BY u.bloodGroup")
    List<Object[]> countDonationsByBloodGroup(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count donations by donation type (excluding soft-deleted) - for anonymized reports
     * Returns list of [donationType, count] pairs
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of Object arrays [String donationType, Long count]
     */
    @Query("SELECT d.donationType, COUNT(d) FROM Donation d " +
           "WHERE d.deletedAt IS NULL " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY d.donationType " +
           "ORDER BY d.donationType")
    List<Object[]> countDonationsByType(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count donations by RCKiK center (excluding soft-deleted) - for anonymized reports
     * Returns list of [rckikName, count] pairs
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of Object arrays [String rckikName, Long count]
     */
    @Query("SELECT r.name, COUNT(d) FROM Donation d " +
           "JOIN d.rckik r " +
           "WHERE d.deletedAt IS NULL " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY r.name " +
           "ORDER BY r.name")
    List<Object[]> countDonationsByRckik(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count confirmed donations (excluding soft-deleted) - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Number of confirmed donations
     */
    @Query("SELECT COUNT(d) FROM Donation d " +
           "WHERE d.deletedAt IS NULL " +
           "AND d.confirmed = true " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate")
    Long countConfirmedDonations(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count unique donors (excluding soft-deleted) - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Number of unique donors
     */
    @Query("SELECT COUNT(DISTINCT d.user.id) FROM Donation d " +
           "WHERE d.deletedAt IS NULL " +
           "AND d.donationDate BETWEEN :fromDate AND :toDate")
    Long countUniqueDonors(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
