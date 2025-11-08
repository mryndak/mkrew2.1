package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.Rckik;

import java.util.List;
import java.util.Optional;

@Repository
public interface RckikRepository extends JpaRepository<Rckik, Long>, JpaSpecificationExecutor<Rckik> {

    /**
     * Find RCKiK by code
     *
     * @param code RCKiK code
     * @return Optional<Rckik>
     */
    Optional<Rckik> findByCode(String code);

    /**
     * Find all active RCKiK centers
     *
     * @return List of active RCKiK centers
     */
    List<Rckik> findByActiveTrue();

    /**
     * Find RCKiK centers by IDs
     *
     * @param ids List of IDs
     * @return List of RCKiK centers
     */
    List<Rckik> findByIdIn(List<Long> ids);

    /**
     * Find RCKiK centers with pagination and filtering
     *
     * @param active Active status filter
     * @param pageable Pagination parameters
     * @return Page of RCKiK centers
     */
    Page<Rckik> findByActive(Boolean active, Pageable pageable);

    /**
     * Find RCKiK centers by city and active status with pagination
     *
     * @param city City name
     * @param active Active status filter
     * @param pageable Pagination parameters
     * @return Page of RCKiK centers
     */
    Page<Rckik> findByCityAndActive(String city, Boolean active, Pageable pageable);

    /**
     * Find RCKiK centers by city with pagination
     *
     * @param city City name
     * @param pageable Pagination parameters
     * @return Page of RCKiK centers
     */
    Page<Rckik> findByCity(String city, Pageable pageable);
}
