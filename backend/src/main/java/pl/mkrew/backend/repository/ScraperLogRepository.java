package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.ScraperLog;

import java.util.Optional;

@Repository
public interface ScraperLogRepository extends JpaRepository<ScraperLog, Long> {

    /**
     * Find latest scraper log for a specific RCKiK center
     * Returns the most recent log entry
     *
     * @param rckikId RCKiK ID
     * @return Optional<ScraperLog>
     */
    @Query("""
            SELECT sl FROM ScraperLog sl
            WHERE sl.rckik.id = :rckikId
            ORDER BY sl.createdAt DESC
            LIMIT 1
            """)
    Optional<ScraperLog> findLatestByRckikId(@Param("rckikId") Long rckikId);

    /**
     * Find latest successful scraper log for a specific RCKiK center
     * Returns the most recent log entry with status SUCCESS
     *
     * @param rckikId RCKiK ID
     * @return Optional<ScraperLog>
     */
    @Query("""
            SELECT sl FROM ScraperLog sl
            WHERE sl.rckik.id = :rckikId
            AND sl.status = 'SUCCESS'
            ORDER BY sl.createdAt DESC
            LIMIT 1
            """)
    Optional<ScraperLog> findLatestSuccessByRckikId(@Param("rckikId") Long rckikId);
}
