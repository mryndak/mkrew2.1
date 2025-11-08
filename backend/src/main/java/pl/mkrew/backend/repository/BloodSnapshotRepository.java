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
}
