package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.entity.EmailLog;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.repository.EmailLogRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDateTime;

/**
 * Service for managing email logs
 * US-010: Email Notifications
 * US-022: Email Deliverability Metrics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailLogService {

    private final EmailLogRepository emailLogRepository;
    private final UserRepository userRepository;
    private final RckikRepository rckikRepository;

    /**
     * Create email log entry
     *
     * @param userId           User ID (nullable)
     * @param rckikId          RCKiK ID (nullable)
     * @param notificationType Notification type
     * @param recipientEmail   Recipient email
     * @param subject          Email subject
     * @param externalId       External ID from email provider
     * @return Created email log
     */
    @Transactional
    public EmailLog createEmailLog(
            Long userId,
            Long rckikId,
            String notificationType,
            String recipientEmail,
            String subject,
            String externalId) {

        log.debug("Creating email log for recipient: {}, type: {}", recipientEmail, notificationType);

        EmailLog emailLog = new EmailLog();

        // Set user if provided
        if (userId != null) {
            userRepository.findById(userId).ifPresent(emailLog::setUser);
        }

        // Set RCKiK if provided
        if (rckikId != null) {
            rckikRepository.findById(rckikId).ifPresent(emailLog::setRckik);
        }

        emailLog.setNotificationType(notificationType);
        emailLog.setRecipientEmail(recipientEmail);
        emailLog.setSubject(subject);
        emailLog.setSentAt(LocalDateTime.now());
        emailLog.setExternalId(externalId);

        EmailLog savedLog = emailLogRepository.save(emailLog);
        log.info("Email log created with ID: {} for recipient: {}", savedLog.getId(), recipientEmail);

        return savedLog;
    }

    /**
     * Update email log with delivery status
     *
     * @param externalId External ID from email provider
     * @param deliveredAt Delivery timestamp
     */
    @Transactional
    public void updateDeliveryStatus(String externalId, LocalDateTime deliveredAt) {
        emailLogRepository.findByExternalId(externalId).ifPresent(emailLog -> {
            emailLog.setDeliveredAt(deliveredAt);
            emailLogRepository.save(emailLog);
            log.debug("Updated delivery status for email log with external ID: {}", externalId);
        });
    }

    /**
     * Update email log with open status
     *
     * @param externalId External ID from email provider
     * @param openedAt   Open timestamp
     */
    @Transactional
    public void updateOpenStatus(String externalId, LocalDateTime openedAt) {
        emailLogRepository.findByExternalId(externalId).ifPresent(emailLog -> {
            emailLog.setOpenedAt(openedAt);
            emailLogRepository.save(emailLog);
            log.debug("Updated open status for email log with external ID: {}", externalId);
        });
    }

    /**
     * Update email log with bounce status
     *
     * @param externalId External ID from email provider
     * @param bouncedAt  Bounce timestamp
     * @param bounceType Bounce type (HARD/SOFT)
     */
    @Transactional
    public void updateBounceStatus(String externalId, LocalDateTime bouncedAt, String bounceType) {
        emailLogRepository.findByExternalId(externalId).ifPresent(emailLog -> {
            emailLog.setBouncedAt(bouncedAt);
            emailLog.setBounceType(bounceType);
            emailLogRepository.save(emailLog);
            log.warn("Email bounced: external ID: {}, type: {}", externalId, bounceType);
        });
    }

    /**
     * Check if user has exceeded email rate limit
     *
     * @param userId User ID
     * @param limit  Maximum emails per 24 hours
     * @return true if rate limit exceeded
     */
    @Transactional(readOnly = true)
    public boolean isRateLimitExceeded(Long userId, int limit) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long count = emailLogRepository.countByUserIdSince(userId, since);
        boolean exceeded = count >= limit;

        if (exceeded) {
            log.warn("Email rate limit exceeded for user ID: {}. Count: {}, Limit: {}", userId, count, limit);
        }

        return exceeded;
    }

    /**
     * Calculate delivery rate for date range
     *
     * @param fromDate From date
     * @param toDate   To date
     * @return Delivery rate (0-100)
     */
    @Transactional(readOnly = true)
    public Double calculateDeliveryRate(LocalDateTime fromDate, LocalDateTime toDate) {
        Double rate = emailLogRepository.calculateDeliveryRate(fromDate, toDate);
        return rate != null ? rate : 0.0;
    }

    /**
     * Calculate open rate for date range
     *
     * @param fromDate From date
     * @param toDate   To date
     * @return Open rate (0-100)
     */
    @Transactional(readOnly = true)
    public Double calculateOpenRate(LocalDateTime fromDate, LocalDateTime toDate) {
        Double rate = emailLogRepository.calculateOpenRate(fromDate, toDate);
        return rate != null ? rate : 0.0;
    }
}
