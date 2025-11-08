package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.UserFavoriteRckik;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFavoriteRckikRepository extends JpaRepository<UserFavoriteRckik, Long> {

    /**
     * Find all favorite RCKiK centers for a user
     * Ordered by priority (ascending, nulls last) then created_at (descending)
     *
     * @param userId User ID
     * @return List of user's favorite centers
     */
    List<UserFavoriteRckik> findByUserIdOrderByPriorityAscCreatedAtDesc(Long userId);

    /**
     * Find favorite entry by user and RCKiK
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     * @return Optional favorite entry
     */
    Optional<UserFavoriteRckik> findByUserIdAndRckikId(Long userId, Long rckikId);

    /**
     * Check if user has favorited specific RCKiK
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     * @return true if favorited, false otherwise
     */
    boolean existsByUserIdAndRckikId(Long userId, Long rckikId);

    /**
     * Delete favorite entry by user and RCKiK
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     */
    void deleteByUserIdAndRckikId(Long userId, Long rckikId);

    /**
     * Count number of favorites for a user
     *
     * @param userId User ID
     * @return Number of favorites
     */
    long countByUserId(Long userId);

    /**
     * Find all users who have favorited a specific RCKiK center
     * US-010: Email Notifications - find users to notify
     *
     * @param rckikId RCKiK ID
     * @return List of favorite entries
     */
    List<UserFavoriteRckik> findByRckikId(Long rckikId);
}
