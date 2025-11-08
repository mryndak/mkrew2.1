package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.ScraperRun;

@Repository
public interface ScraperRunRepository extends JpaRepository<ScraperRun, Long> {
    // Basic CRUD operations provided by JpaRepository
}
