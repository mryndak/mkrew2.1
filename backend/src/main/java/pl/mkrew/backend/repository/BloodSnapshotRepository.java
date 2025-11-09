package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.BloodSnapshot;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BloodSnapshotRepository extends JpaRepository<BloodSnapshot, Long> {

    /**
     * Find latest blood snapshots for a specific RCKiK center
     * Returns the most recent snapshot for each blood group
     *
     * @param rckikId RCKiK ID
     * @return List of latest blood snapshots
     */
    @Query("""
            SELECT bs FROM BloodSnapshot bs
            WHERE bs.rckik.id = :rckikId
            AND bs.id IN (
                SELECT MAX(bs2.id)
                FROM BloodSnapshot bs2
                WHERE bs2.rckik.id = :rckikId
                GROUP BY bs2.bloodGroup
            )
            ORDER BY bs.bloodGroup ASC
            """)
    List<BloodSnapshot> findLatestByRckikId(@Param("rckikId") Long rckikId);

    /**
     * Find latest blood snapshots for multiple RCKiK centers
     * Returns the most recent snapshot for each blood group for each center
     *
     * @param rckikIds List of RCKiK IDs
     * @return List of latest blood snapshots
     */
    @Query("""
            SELECT bs FROM BloodSnapshot bs
            WHERE bs.rckik.id IN :rckikIds
            AND bs.id IN (
                SELECT MAX(bs2.id)
                FROM BloodSnapshot bs2
                WHERE bs2.rckik.id IN :rckikIds
                GROUP BY bs2.rckik.id, bs2.bloodGroup
            )
            ORDER BY bs.rckik.id ASC, bs.bloodGroup ASC
            """)
    List<BloodSnapshot> findLatestByRckikIds(@Param("rckikIds") List<Long> rckikIds);

    /**
     * Find all blood snapshots for a specific RCKiK center and blood group
     * Ordered by snapshot date descending
     *
     * @param rckikId RCKiK ID
     * @param bloodGroup Blood group
     * @return List of blood snapshots
     */
    List<BloodSnapshot> findByRckikIdAndBloodGroupOrderBySnapshotDateDescScrapedAtDesc(Long rckikId, String bloodGroup);

    /**
     * Find blood snapshots for a specific RCKiK center
     * Ordered by snapshot date descending
     *
     * @param rckikId RCKiK ID
     * @return List of blood snapshots
     */
    List<BloodSnapshot> findByRckikIdOrderBySnapshotDateDescScrapedAtDesc(Long rckikId);

    /**
     * Find blood snapshots for a specific RCKiK center with pagination
     * Ordered by snapshot date descending, then scraped_at descending
     *
     * @param rckikId RCKiK ID
     * @param pageable Pagination parameters
     * @return Page of blood snapshots
     */
    Page<BloodSnapshot> findByRckikIdOrderBySnapshotDateDescScrapedAtDesc(Long rckikId, Pageable pageable);

    /**
     * Find blood snapshots for a specific RCKiK center and blood group with pagination
     *
     * @param rckikId RCKiK ID
     * @param bloodGroup Blood group
     * @param pageable Pagination parameters
     * @return Page of blood snapshots
     */
    Page<BloodSnapshot> findByRckikIdAndBloodGroupOrderBySnapshotDateDescScrapedAtDesc(
            Long rckikId, String bloodGroup, Pageable pageable);

    /**
     * Find blood snapshots for a specific RCKiK center with date range and pagination
     *
     * @param rckikId RCKiK ID
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @param pageable Pagination parameters
     * @return Page of blood snapshots
     */
    Page<BloodSnapshot> findByRckikIdAndSnapshotDateBetweenOrderBySnapshotDateDescScrapedAtDesc(
            Long rckikId, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    /**
     * Find blood snapshots for a specific RCKiK center, blood group, and date range with pagination
     *
     * @param rckikId RCKiK ID
     * @param bloodGroup Blood group
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @param pageable Pagination parameters
     * @return Page of blood snapshots
     */
    Page<BloodSnapshot> findByRckikIdAndBloodGroupAndSnapshotDateBetweenOrderBySnapshotDateDescScrapedAtDesc(
            Long rckikId, String bloodGroup, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    /**
     * Find all critical blood level snapshots across all RCKiK centers
     * Returns the latest snapshot for each blood group that is below the critical threshold
     * US-010: Email Notifications
     *
     * @param criticalThreshold Critical threshold percentage (e.g., 20.0 for 20%)
     * @return List of critical blood snapshots
     */
    @Query("""
            SELECT bs FROM BloodSnapshot bs
            WHERE bs.levelPercentage < :criticalThreshold
            AND bs.id IN (
                SELECT MAX(bs2.id)
                FROM BloodSnapshot bs2
                WHERE bs2.levelPercentage < :criticalThreshold
                GROUP BY bs2.rckik.id, bs2.bloodGroup
            )
            ORDER BY bs.rckik.id ASC, bs.bloodGroup ASC
            """)
    List<BloodSnapshot> findCriticalLevels(@Param("criticalThreshold") java.math.BigDecimal criticalThreshold);

    // ========== US-026: Anonymized Report Queries ==========

    /**
     * US-026: Calculate average blood level percentage by blood group - for anonymized reports
     * Returns list of [bloodGroup, avgLevel] pairs
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of Object arrays [String bloodGroup, Double avgLevel]
     */
    @Query("SELECT bs.bloodGroup, AVG(bs.levelPercentage) FROM BloodSnapshot bs " +
           "WHERE bs.snapshotDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY bs.bloodGroup " +
           "ORDER BY bs.bloodGroup")
    List<Object[]> calculateAverageLevelByBloodGroup(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count snapshots by status (CRITICAL/IMPORTANT/OK) - for anonymized reports
     * Returns list of [status, count] pairs
     * Status is calculated as: CRITICAL (<20%), IMPORTANT (<50%), OK (>=50%)
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of Object arrays [String status, Long count]
     */
    @Query("SELECT CASE " +
           "WHEN bs.levelPercentage < 20 THEN 'CRITICAL' " +
           "WHEN bs.levelPercentage < 50 THEN 'IMPORTANT' " +
           "ELSE 'OK' END, " +
           "COUNT(bs) " +
           "FROM BloodSnapshot bs " +
           "WHERE bs.snapshotDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY CASE " +
           "WHEN bs.levelPercentage < 20 THEN 'CRITICAL' " +
           "WHEN bs.levelPercentage < 50 THEN 'IMPORTANT' " +
           "ELSE 'OK' END " +
           "ORDER BY CASE " +
           "WHEN bs.levelPercentage < 20 THEN 'CRITICAL' " +
           "WHEN bs.levelPercentage < 50 THEN 'IMPORTANT' " +
           "ELSE 'OK' END")
    List<Object[]> countSnapshotsByStatus(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count snapshots by RCKiK center - for anonymized reports
     * Returns list of [rckikName, count] pairs
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return List of Object arrays [String rckikName, Long count]
     */
    @Query("SELECT r.name, COUNT(bs) FROM BloodSnapshot bs " +
           "JOIN bs.rckik r " +
           "WHERE bs.snapshotDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY r.name " +
           "ORDER BY r.name")
    List<Object[]> countSnapshotsByRckik(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count total snapshots in date range - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Total number of snapshots
     */
    @Query("SELECT COUNT(bs) FROM BloodSnapshot bs " +
           "WHERE bs.snapshotDate BETWEEN :fromDate AND :toDate")
    Long countSnapshotsByDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Count manual snapshots in date range - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Number of manual snapshots
     */
    @Query("SELECT COUNT(bs) FROM BloodSnapshot bs " +
           "WHERE bs.snapshotDate BETWEEN :fromDate AND :toDate " +
           "AND bs.isManual = true")
    Long countManualSnapshots(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    /**
     * US-026: Find most frequently critical blood group - for anonymized reports
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Most critical blood group or null if none
     */
    @Query(value = "SELECT bs.blood_group FROM blood_snapshots bs " +
           "WHERE bs.snapshot_date BETWEEN :fromDate AND :toDate " +
           "AND bs.level_percentage < 20 " +
           "GROUP BY bs.blood_group " +
           "ORDER BY COUNT(*) DESC " +
           "LIMIT 1", nativeQuery = true)
    String findMostCriticalBloodGroup(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
