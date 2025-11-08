package pl.mkrew.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pl.mkrew.backend.service.CriticalBloodLevelNotificationService;

/**
 * Scheduler for automated notification tasks
 * US-010: Email Notifications for Critical Blood Levels
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final CriticalBloodLevelNotificationService notificationService;

    /**
     * Check for critical blood levels and send notifications
     * Runs after each scraping job completes (configured via cron)
     *
     * Default: Every day at 03:00 CET (after scraping at 02:00)
     * Cron format: second, minute, hour, day, month, weekday
     */
    @Scheduled(cron = "${mkrew.scheduler.notification-check:0 0 3 * * *}", zone = "Europe/Warsaw")
    public void checkCriticalBloodLevels() {
        log.info("=== Starting scheduled critical blood level check ===");

        try {
            int notificationsSent = notificationService.checkAndNotifyUsers();
            log.info("=== Scheduled critical blood level check completed. Sent {} notifications ===",
                    notificationsSent);
        } catch (Exception e) {
            log.error("=== Error during scheduled critical blood level check ===", e);
        }
    }

    /**
     * Health check to verify scheduler is working
     * Runs every hour to confirm the scheduler is active
     */
    @Scheduled(cron = "${mkrew.scheduler.health-check:0 0 * * * *}", zone = "Europe/Warsaw")
    public void healthCheck() {
        log.debug("Notification scheduler health check - OK");
    }
}
