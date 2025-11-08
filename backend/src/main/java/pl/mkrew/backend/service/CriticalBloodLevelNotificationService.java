package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.CriticalBloodLevelAlertDto;
import pl.mkrew.backend.entity.BloodSnapshot;
import pl.mkrew.backend.entity.NotificationPreference;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.entity.UserFavoriteRckik;
import pl.mkrew.backend.repository.BloodSnapshotRepository;
import pl.mkrew.backend.repository.NotificationPreferenceRepository;
import pl.mkrew.backend.repository.UserFavoriteRckikRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for checking critical blood levels and sending notifications
 * US-010: Email Notifications for Critical Blood Levels
 * US-011: In-App Notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CriticalBloodLevelNotificationService {

    private final UserFavoriteRckikRepository favoriteRckikRepository;
    private final BloodSnapshotRepository bloodSnapshotRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final EmailService emailService;
    private final EmailLogService emailLogService;
    private final InAppNotificationService inAppNotificationService;

    @Value("${mkrew.notification.critical-threshold:20.0}")
    private BigDecimal criticalThreshold;

    @Value("${mkrew.notification.rate-limit:5}")
    private int emailRateLimit;

    @Value("${mkrew.app.base-url:http://localhost:3000}")
    private String baseUrl;

    /**
     * Check critical blood levels and send notifications to affected users
     * Called by scheduled job
     *
     * @return Number of notifications sent
     */
    @Transactional
    public int checkAndNotifyUsers() {
        log.info("Starting critical blood level notification check...");

        // Get all critical blood snapshots
        List<BloodSnapshot> criticalSnapshots = bloodSnapshotRepository.findCriticalLevels(criticalThreshold);

        if (criticalSnapshots.isEmpty()) {
            log.info("No critical blood levels found. No notifications to send.");
            return 0;
        }

        log.info("Found {} critical blood level entries across all centers", criticalSnapshots.size());

        // Group by RCKiK
        Map<Long, List<BloodSnapshot>> criticalByRckik = criticalSnapshots.stream()
                .collect(Collectors.groupingBy(bs -> bs.getRckik().getId()));

        log.info("Critical blood levels found in {} RCKiK centers", criticalByRckik.size());

        int totalNotifications = 0;

        // For each RCKiK with critical levels
        for (Map.Entry<Long, List<BloodSnapshot>> entry : criticalByRckik.entrySet()) {
            Long rckikId = entry.getKey();
            List<BloodSnapshot> snapshots = entry.getValue();

            // Find users who have this RCKiK as favorite
            List<UserFavoriteRckik> favorites = favoriteRckikRepository.findByRckikId(rckikId);

            log.info("Found {} users with RCKiK {} in favorites", favorites.size(), rckikId);

            // Send notification to each eligible user
            for (UserFavoriteRckik favorite : favorites) {
                User user = favorite.getUser();

                // Send email notification if user preferences allow
                if (shouldSendEmailNotification(user)) {
                    boolean sent = sendCriticalAlert(user, favorite.getRckik().getId(),
                            favorite.getRckik().getName(), snapshots);
                    if (sent) {
                        totalNotifications++;
                    }
                }

                // Create in-app notification if user preferences allow
                if (shouldSendInAppNotification(user)) {
                    createInAppNotification(user, favorite.getRckik().getId(),
                            favorite.getRckik().getName(), snapshots);
                }
            }
        }

        log.info("Critical blood level notification check completed. Sent {} notifications", totalNotifications);
        return totalNotifications;
    }

    /**
     * Check if user should receive critical email notification
     *
     * @param user User
     * @return true if email notification should be sent
     */
    private boolean shouldSendEmailNotification(User user) {
        // Check if user is active
        if (user.getDeletedAt() != null) {
            log.debug("User {} is deleted, skipping notification", user.getId());
            return false;
        }

        // Check if email is verified
        if (!user.getEmailVerified()) {
            log.debug("User {} email not verified, skipping notification", user.getId());
            return false;
        }

        // Get notification preferences
        NotificationPreference prefs = notificationPreferenceRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (prefs == null) {
            log.debug("User {} has no notification preferences, skipping notification", user.getId());
            return false;
        }

        // Check if email notifications are enabled
        if (!prefs.getEmailEnabled()) {
            log.debug("User {} has email notifications disabled", user.getId());
            return false;
        }

        // Check email frequency setting
        String frequency = prefs.getEmailFrequency();
        if ("DISABLED".equals(frequency)) {
            log.debug("User {} has email frequency set to DISABLED", user.getId());
            return false;
        }

        // For ONLY_CRITICAL and IMMEDIATE, send notification
        // For DAILY, this would be batched (not in MVP)
        if (!"ONLY_CRITICAL".equals(frequency) && !"IMMEDIATE".equals(frequency)) {
            log.debug("User {} email frequency is {}, not sending individual critical alert",
                    user.getId(), frequency);
            return false;
        }

        // Check rate limit
        if (emailLogService.isRateLimitExceeded(user.getId(), emailRateLimit)) {
            log.warn("User {} has exceeded email rate limit, skipping notification", user.getId());
            return false;
        }

        return true;
    }

    /**
     * Send critical blood level alert to user
     *
     * @param user         User
     * @param rckikId      RCKiK ID
     * @param rckikName    RCKiK name
     * @param snapshots    Critical blood snapshots
     * @return true if sent successfully
     */
    private boolean sendCriticalAlert(User user, Long rckikId, String rckikName,
                                      List<BloodSnapshot> snapshots) {
        try {
            // Build critical blood groups string
            StringBuilder criticalGroupsHtml = new StringBuilder();
            criticalGroupsHtml.append("<ul>");
            for (BloodSnapshot snapshot : snapshots) {
                criticalGroupsHtml.append("<li><strong>")
                        .append(snapshot.getBloodGroup())
                        .append("</strong>: ")
                        .append(snapshot.getLevelPercentage())
                        .append("%</li>");
            }
            criticalGroupsHtml.append("</ul>");

            // Build details URL
            String detailsUrl = baseUrl + "/rckik/" + rckikId;

            // Build recipient name
            String recipientName = user.getFirstName() != null ? user.getFirstName() : "Użytkowniku";

            // Send email
            boolean sent = emailService.sendCriticalBloodLevelAlert(
                    user.getEmail(),
                    recipientName,
                    user.getId(),
                    rckikName,
                    rckikId,
                    criticalGroupsHtml.toString(),
                    detailsUrl
            );

            if (sent) {
                log.info("Critical blood level alert sent to user {} for RCKiK {}",
                        user.getId(), rckikId);
            } else {
                log.warn("Failed to send critical blood level alert to user {} for RCKiK {}",
                        user.getId(), rckikId);
            }

            return sent;

        } catch (Exception e) {
            log.error("Error sending critical blood level alert to user {} for RCKiK {}",
                    user.getId(), rckikId, e);
            return false;
        }
    }

    /**
     * Build alert DTO for a RCKiK with critical levels
     *
     * @param rckikId   RCKiK ID
     * @param snapshots Critical blood snapshots
     * @return Alert DTO
     */
    private CriticalBloodLevelAlertDto buildAlertDto(Long rckikId, List<BloodSnapshot> snapshots) {
        if (snapshots.isEmpty()) {
            return null;
        }

        BloodSnapshot firstSnapshot = snapshots.get(0);

        List<CriticalBloodLevelAlertDto.CriticalBloodGroupDto> criticalGroups = snapshots.stream()
                .map(snapshot -> CriticalBloodLevelAlertDto.CriticalBloodGroupDto.builder()
                        .bloodGroup(snapshot.getBloodGroup())
                        .levelPercentage(snapshot.getLevelPercentage())
                        .levelStatus("CRITICAL")
                        .build())
                .collect(Collectors.toList());

        return CriticalBloodLevelAlertDto.builder()
                .rckikId(rckikId)
                .rckikName(firstSnapshot.getRckik().getName())
                .rckikCode(firstSnapshot.getRckik().getCode())
                .city(firstSnapshot.getRckik().getCity())
                .address(firstSnapshot.getRckik().getAddress())
                .criticalBloodGroups(criticalGroups)
                .snapshotTime(firstSnapshot.getScrapedAt())
                .build();
    }

    /**
     * Check if user should receive in-app notification
     *
     * @param user User
     * @return true if in-app notification should be created
     */
    private boolean shouldSendInAppNotification(User user) {
        // Check if user is active
        if (user.getDeletedAt() != null) {
            log.debug("User {} is deleted, skipping in-app notification", user.getId());
            return false;
        }

        // Get notification preferences
        NotificationPreference prefs = notificationPreferenceRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (prefs == null) {
            log.debug("User {} has no notification preferences, skipping in-app notification", user.getId());
            return false;
        }

        // Check if in-app notifications are enabled
        if (!prefs.getInAppEnabled()) {
            log.debug("User {} has in-app notifications disabled", user.getId());
            return false;
        }

        // Check in-app frequency setting
        String frequency = prefs.getInAppFrequency();
        if ("DISABLED".equals(frequency)) {
            log.debug("User {} has in-app frequency set to DISABLED", user.getId());
            return false;
        }

        // For ONLY_CRITICAL and IMMEDIATE, create notification
        if (!"ONLY_CRITICAL".equals(frequency) && !"IMMEDIATE".equals(frequency)) {
            log.debug("User {} in-app frequency is {}, not creating individual critical alert",
                    user.getId(), frequency);
            return false;
        }

        return true;
    }

    /**
     * Create in-app notification for critical blood level
     *
     * @param user      User
     * @param rckikId   RCKiK ID
     * @param rckikName RCKiK name
     * @param snapshots Critical blood snapshots
     */
    private void createInAppNotification(User user, Long rckikId, String rckikName,
                                         List<BloodSnapshot> snapshots) {
        try {
            // Build critical blood groups message
            StringBuilder messageBuilder = new StringBuilder();
            messageBuilder.append("Krytyczne stany krwi w ").append(rckikName).append(":\n\n");

            for (BloodSnapshot snapshot : snapshots) {
                messageBuilder.append("Grupa ")
                        .append(snapshot.getBloodGroup())
                        .append(": ")
                        .append(snapshot.getLevelPercentage())
                        .append("%\n");
            }

            String title = "Krytyczny stan krwi - " + rckikName;
            String message = messageBuilder.toString();
            String linkUrl = "/rckik/" + rckikId;

            // Set expiration to 7 days from now
            LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

            // Create in-app notification
            inAppNotificationService.createNotification(
                    user.getId(),
                    "CRITICAL_BLOOD_LEVEL",
                    rckikId,
                    title,
                    message,
                    linkUrl,
                    expiresAt
            );

            log.info("Created in-app notification for user {} for RCKiK {}", user.getId(), rckikId);

        } catch (Exception e) {
            log.error("Error creating in-app notification for user {} for RCKiK {}",
                    user.getId(), rckikId, e);
        }
    }

    /**
     * Manually trigger notification check for testing
     *
     * @return Number of notifications sent
     */
    public int triggerManualCheck() {
        log.info("Manual notification check triggered");
        return checkAndNotifyUsers();
    }
}
