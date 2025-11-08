package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.InAppNotification;

import java.util.Optional;

/**
 * Repository for InAppNotification entity
 * US-011: In-App Notifications
 */
@Repository
public interface InAppNotificationRepository extends JpaRepository<InAppNotification, Long> {

    /**
     * Find all notifications for a user, paginated
     *
     * @param userId   User ID
     * @param pageable Pagination
     * @return Page of notifications
     */
    Page<InAppNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find unread notifications for a user, paginated
     *
     * @param userId   User ID
     * @param pageable Pagination
     * @return Page of unread notifications
     */
    @Query("SELECT n FROM InAppNotification n WHERE n.user.id = :userId AND n.readAt IS NULL ORDER BY n.createdAt DESC")
    Page<InAppNotification> findUnreadByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Count unread notifications for a user
     *
     * @param userId User ID
     * @return Count of unread notifications
     */
    @Query("SELECT COUNT(n) FROM InAppNotification n WHERE n.user.id = :userId AND n.readAt IS NULL")
    long countUnreadByUserId(@Param("userId") Long userId);

    /**
     * Find notification by ID and user ID (for ownership validation)
     *
     * @param id     Notification ID
     * @param userId User ID
     * @return Optional notification
     */
    Optional<InAppNotification> findByIdAndUserId(Long id, Long userId);
}
