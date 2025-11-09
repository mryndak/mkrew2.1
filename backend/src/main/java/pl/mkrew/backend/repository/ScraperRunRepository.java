package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.ScraperRun;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScraperRunRepository extends JpaRepository<ScraperRun, Long> {
    // Basic CRUD operations provided by JpaRepository

    /**
     * Find the most recent scraper run with COMPLETED status
     * US-025: Get last successful scraper run for global status
     *
     * @return Optional of the most recent successful scraper run
     */
    Optional<ScraperRun> findFirstByStatusOrderByCompletedAtDesc(String status);

    /**
     * Find the N most recent scraper runs ordered by start time
     * US-025: Analyze recent scraper runs for trend detection
     *
     * @param pageable Pagination parameters (use PageRequest.of(0, N))
     * @return Page of scraper runs
     */
    Page<ScraperRun> findAllByOrderByStartedAtDesc(Pageable pageable);

    /**
     * Find all scraper runs with specific status, ordered by start time
     * Useful for counting consecutive failures
     *
     * @param status Status to filter by (e.g., "FAILED", "COMPLETED")
     * @param pageable Pagination parameters
     * @return Page of scraper runs with the specified status
     */
    Page<ScraperRun> findByStatusOrderByStartedAtDesc(String status, Pageable pageable);

    /**
     * Custom query to get consecutive failed runs
     * US-025: Count consecutive failures for prolonged failure detection
     *
     * This query finds consecutive failed runs starting from the most recent run.
     * It stops counting once a non-FAILED status is encountered.
     *
     * @return List of consecutive failed scraper runs
     */
    @Query(value = """
            WITH recent_runs AS (
                SELECT id, status, started_at, completed_at,
                       ROW_NUMBER() OVER (ORDER BY started_at DESC) AS rn
                FROM scraper_runs
                WHERE completed_at IS NOT NULL
                ORDER BY started_at DESC
                LIMIT 10
            )
            SELECT * FROM scraper_runs sr
            WHERE sr.id IN (
                SELECT id FROM recent_runs
                WHERE rn <= (
                    SELECT COALESCE(MIN(rn) - 1, 10)
                    FROM recent_runs
                    WHERE status != 'FAILED'
                )
            )
            AND sr.status = 'FAILED'
            ORDER BY sr.started_at DESC
            """, nativeQuery = true)
    List<ScraperRun> findConsecutiveFailedRuns();
}
