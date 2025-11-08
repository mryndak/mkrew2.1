package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.EmailLog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for EmailLog entity
 * US-010: Email Notifications
 * US-022: Email Deliverability Metrics
 */
@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    /**
     * Find email logs by user ID
     *
     * @param userId   User ID
     * @param pageable Pagination
     * @return Page of email logs
     */
    Page<EmailLog> findByUserIdOrderBySentAtDesc(Long userId, Pageable pageable);

    /**
     * Find email logs by notification type
     *
     * @param notificationType Notification type
     * @param pageable         Pagination
     * @return Page of email logs
     */
    Page<EmailLog> findByNotificationTypeOrderBySentAtDesc(String notificationType, Pageable pageable);

    /**
     * Find email logs by user and notification type
     *
     * @param userId           User ID
     * @param notificationType Notification type
     * @param pageable         Pagination
     * @return Page of email logs
     */
    Page<EmailLog> findByUserIdAndNotificationTypeOrderBySentAtDesc(
            Long userId, String notificationType, Pageable pageable);

    /**
     * Find email logs by external ID (from SendGrid/Mailgun)
     *
     * @param externalId External ID
     * @return Optional email log
     */
    Optional<EmailLog> findByExternalId(String externalId);

    /**
     * Find email logs by date range
     *
     * @param fromDate From date
     * @param toDate   To date
     * @param pageable Pagination
     * @return Page of email logs
     */
    Page<EmailLog> findBySentAtBetweenOrderBySentAtDesc(
            LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);

    /**
     * Count emails sent to user in last 24 hours (for rate limiting)
     *
     * @param userId User ID
     * @param since  Since timestamp
     * @return Count of emails
     */
    @Query("""
            SELECT COUNT(el) FROM EmailLog el
            WHERE el.user.id = :userId
            AND el.sentAt >= :since
            """)
    long countByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Count emails by notification type in date range
     *
     * @param notificationType Notification type
     * @param fromDate         From date
     * @param toDate           To date
     * @return Count of emails
     */
    long countByNotificationTypeAndSentAtBetween(
            String notificationType, LocalDateTime fromDate, LocalDateTime toDate);

    /**
     * Find bounced emails (for cleanup/analysis)
     *
     * @param pageable Pagination
     * @return Page of bounced email logs
     */
    @Query("""
            SELECT el FROM EmailLog el
            WHERE el.bouncedAt IS NOT NULL
            ORDER BY el.bouncedAt DESC
            """)
    Page<EmailLog> findBouncedEmails(Pageable pageable);

    /**
     * Calculate delivery rate for date range
     *
     * @param fromDate From date
     * @param toDate   To date
     * @return Delivery rate (0-100)
     */
    @Query("""
            SELECT
                CASE
                    WHEN COUNT(el) = 0 THEN 0.0
                    ELSE (COUNT(el) FILTER (WHERE el.deliveredAt IS NOT NULL) * 100.0) / COUNT(el)
                END
            FROM EmailLog el
            WHERE el.sentAt BETWEEN :fromDate AND :toDate
            """)
    Double calculateDeliveryRate(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    /**
     * Calculate open rate for date range
     *
     * @param fromDate From date
     * @param toDate   To date
     * @return Open rate (0-100)
     */
    @Query("""
            SELECT
                CASE
                    WHEN COUNT(el) FILTER (WHERE el.deliveredAt IS NOT NULL) = 0 THEN 0.0
                    ELSE (COUNT(el) FILTER (WHERE el.openedAt IS NOT NULL) * 100.0) /
                         COUNT(el) FILTER (WHERE el.deliveredAt IS NOT NULL)
                END
            FROM EmailLog el
            WHERE el.sentAt BETWEEN :fromDate AND :toDate
            """)
    Double calculateOpenRate(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);
}
