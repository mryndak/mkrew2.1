package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.NotificationPreference;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    /**
     * Find notification preferences by user ID
     *
     * @param userId User ID
     * @return Optional<NotificationPreference>
     */
    Optional<NotificationPreference> findByUserId(Long userId);

    /**
     * Check if notification preferences exist for user
     *
     * @param userId User ID
     * @return true if exists, false otherwise
     */
    boolean existsByUserId(Long userId);
}
