package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.ScraperConfig;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScraperConfigRepository extends JpaRepository<ScraperConfig, Long> {

    /**
     * Find scraper config by RCKiK ID
     *
     * @param rckikId RCKiK ID
     * @return Optional<ScraperConfig>
     */
    @Query("SELECT sc FROM ScraperConfig sc WHERE sc.rckik.id = :rckikId AND sc.active = true")
    Optional<ScraperConfig> findByRckikIdAndActiveTrue(@Param("rckikId") Long rckikId);

    /**
     * Find all active scraper configs
     *
     * @return List of active ScraperConfig
     */
    @Query("SELECT sc FROM ScraperConfig sc WHERE sc.active = true")
    List<ScraperConfig> findAllActive();
}
