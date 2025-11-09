package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByIdAndDeletedAtIsNull(Long id);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByIdAndDeletedAtIsNull(Long id);

    // ========== US-026: Anonymized Report Queries ==========

    /**
     * US-026: Count total users (excluding soft-deleted) - for anonymized reports
     *
     * @return Total number of users
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL")
    Long countActiveUsers();

    /**
     * US-026: Count verified users (excluding soft-deleted) - for anonymized reports
     *
     * @return Number of verified users
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL AND u.emailVerified = true")
    Long countVerifiedUsers();

    /**
     * US-026: Count users by blood group (excluding soft-deleted) - for anonymized reports
     * Returns list of [bloodGroup, count] pairs
     *
     * @return List of Object arrays [String bloodGroup, Long count]
     */
    @Query("SELECT u.bloodGroup, COUNT(u) FROM User u " +
           "WHERE u.deletedAt IS NULL " +
           "AND u.bloodGroup IS NOT NULL " +
           "GROUP BY u.bloodGroup " +
           "ORDER BY u.bloodGroup")
    List<Object[]> countUsersByBloodGroup();

    /**
     * US-026: Count users with at least one donation (excluding soft-deleted) - for anonymized reports
     *
     * @return Number of active donors
     */
    @Query("SELECT COUNT(DISTINCT d.user.id) FROM Donation d " +
           "WHERE d.user.deletedAt IS NULL " +
           "AND d.deletedAt IS NULL")
    Long countActiveDonors();

    /**
     * US-026: Count users with email notifications enabled (excluding soft-deleted) - for anonymized reports
     *
     * @return Number of users with email notifications enabled
     */
    @Query("SELECT COUNT(u) FROM User u " +
           "JOIN NotificationPreference np ON np.user.id = u.id " +
           "WHERE u.deletedAt IS NULL " +
           "AND np.emailEnabled = true")
    Long countUsersWithEmailNotifications();

    /**
     * US-026: Count users with in-app notifications enabled (excluding soft-deleted) - for anonymized reports
     *
     * @return Number of users with in-app notifications enabled
     */
    @Query("SELECT COUNT(u) FROM User u " +
           "JOIN NotificationPreference np ON np.user.id = u.id " +
           "WHERE u.deletedAt IS NULL " +
           "AND np.inAppEnabled = true")
    Long countUsersWithInAppNotifications();

    /**
     * US-026: Calculate average number of favorite RCKiK centers per user - for anonymized reports
     *
     * @return Average favorites per user
     */
    @Query("SELECT CAST(COUNT(f) AS double) / CAST(COUNT(DISTINCT u) AS double) FROM User u " +
           "LEFT JOIN UserFavoriteRckik f ON f.user.id = u.id " +
           "WHERE u.deletedAt IS NULL")
    Double calculateAverageFavoritesPerUser();
}
