package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.EmailLog;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.repository.EmailLogRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    /**
     * Get email deliverability metrics for date range with optional filters
     * US-022: Email Deliverability Metrics
     *
     * @param fromDate         Start date (inclusive)
     * @param toDate           End date (inclusive)
     * @param notificationType Notification type filter (optional)
     * @param rckikId          RCKiK ID filter (optional)
     * @return Email metrics response with aggregated data and breakdown by type
     */
    @Transactional(readOnly = true)
    public EmailMetricsResponse getEmailMetrics(
            LocalDate fromDate,
            LocalDate toDate,
            String notificationType,
            Long rckikId) {

        log.debug("Calculating email metrics from {} to {} - type: {}, rckikId: {}",
                fromDate, toDate, notificationType, rckikId);

        // Convert LocalDate to LocalDateTime (start of day and end of day)
        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59, 999999999);

        // Calculate overall metrics
        long totalSent = emailLogRepository.countTotalSent(fromDateTime, toDateTime, notificationType, rckikId);
        long totalDelivered = emailLogRepository.countTotalDelivered(fromDateTime, toDateTime, notificationType, rckikId);
        long totalBounced = emailLogRepository.countTotalBounced(fromDateTime, toDateTime, notificationType, rckikId);
        long totalOpened = emailLogRepository.countTotalOpened(fromDateTime, toDateTime, notificationType, rckikId);
        long hardBounceCount = emailLogRepository.countHardBounces(fromDateTime, toDateTime, notificationType, rckikId);
        long softBounceCount = emailLogRepository.countSoftBounces(fromDateTime, toDateTime, notificationType, rckikId);

        // Calculate rates
        double deliveryRate = totalSent > 0 ? (totalDelivered * 100.0) / totalSent : 0.0;
        double bounceRate = totalSent > 0 ? (totalBounced * 100.0) / totalSent : 0.0;
        double openRate = totalDelivered > 0 ? (totalOpened * 100.0) / totalDelivered : 0.0;

        // Round to 2 decimal places
        deliveryRate = Math.round(deliveryRate * 100.0) / 100.0;
        bounceRate = Math.round(bounceRate * 100.0) / 100.0;
        openRate = Math.round(openRate * 100.0) / 100.0;

        // Build overall metrics DTO
        EmailMetricsDto metrics = EmailMetricsDto.builder()
                .totalSent(totalSent)
                .totalDelivered(totalDelivered)
                .totalBounced(totalBounced)
                .totalOpened(totalOpened)
                .deliveryRate(deliveryRate)
                .bounceRate(bounceRate)
                .openRate(openRate)
                .hardBounceCount(hardBounceCount)
                .softBounceCount(softBounceCount)
                .build();

        log.info("Email metrics calculated - Total sent: {}, Delivery rate: {}%, Open rate: {}%",
                totalSent, deliveryRate, openRate);

        // Calculate metrics by notification type (only if no type filter was applied)
        List<EmailMetricsByTypeDto> byType = new ArrayList<>();
        if (notificationType == null) {
            List<String> notificationTypes = emailLogRepository.findDistinctNotificationTypes(
                    fromDateTime, toDateTime, rckikId);

            for (String type : notificationTypes) {
                long typeSent = emailLogRepository.countTotalSent(fromDateTime, toDateTime, type, rckikId);
                long typeDelivered = emailLogRepository.countTotalDelivered(fromDateTime, toDateTime, type, rckikId);
                long typeOpened = emailLogRepository.countTotalOpened(fromDateTime, toDateTime, type, rckikId);

                double typeDeliveryRate = typeSent > 0 ? (typeDelivered * 100.0) / typeSent : 0.0;
                double typeOpenRate = typeDelivered > 0 ? (typeOpened * 100.0) / typeDelivered : 0.0;

                // Round to 2 decimal places
                typeDeliveryRate = Math.round(typeDeliveryRate * 100.0) / 100.0;
                typeOpenRate = Math.round(typeOpenRate * 100.0) / 100.0;

                EmailMetricsByTypeDto typeMetrics = EmailMetricsByTypeDto.builder()
                        .notificationType(type)
                        .totalSent(typeSent)
                        .deliveryRate(typeDeliveryRate)
                        .openRate(typeOpenRate)
                        .build();

                byType.add(typeMetrics);

                log.debug("Metrics for type {}: sent={}, deliveryRate={}%, openRate={}%",
                        type, typeSent, typeDeliveryRate, typeOpenRate);
            }
        }

        // Build period DTO
        EmailMetricsPeriodDto period = EmailMetricsPeriodDto.builder()
                .from(fromDate)
                .to(toDate)
                .build();

        // Build response
        return EmailMetricsResponse.builder()
                .period(period)
                .metrics(metrics)
                .byType(byType)
                .build();
    }
}
