package pl.mkrew.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pl.mkrew.backend.dto.ScraperGlobalStatusDto;
import pl.mkrew.backend.service.CriticalBloodLevelNotificationService;
import pl.mkrew.backend.service.EmailService;
import pl.mkrew.backend.service.ScraperService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Scheduler for automated notification tasks
 * US-010: Email Notifications for Critical Blood Levels
 * US-025: Scraper Failure Monitoring and Alerting
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final CriticalBloodLevelNotificationService notificationService;
    private final ScraperService scraperService;
    private final EmailService emailService;

    @Value("${mkrew.admin.email:admin@mkrew.pl}")
    private String adminEmail;

    @Value("${mkrew.admin.name:System Administrator}")
    private String adminName;

    @Value("${mkrew.base-url:https://mkrew.pl}")
    private String baseUrl;

    // Track last alert timestamp to avoid spamming admins
    private LocalDateTime lastAlertSent = null;

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

    /**
     * Monitor scraper system status and alert admins on prolonged failure
     * US-025: Extreme Mode - No Access to RCKiK Pages
     *
     * Runs every 6 hours to check scraper health.
     * If prolonged failure is detected (3+ consecutive failures),
     * sends alert email to administrators.
     *
     * Default: Every 6 hours (00:00, 06:00, 12:00, 18:00 CET)
     * Cron format: second, minute, hour, day, month, weekday
     */
    @Scheduled(cron = "${mkrew.scheduler.scraper-status-check:0 0 */6 * * *}", zone = "Europe/Warsaw")
    public void checkScraperStatus() {
        log.info("=== Starting scheduled scraper status check ===");

        try {
            // Get global scraper status
            ScraperGlobalStatusDto status = scraperService.getScraperGlobalStatus();

            log.info("Scraper status: {} - Consecutive failures: {} - Last successful: {}",
                    status.getGlobalStatus(),
                    status.getConsecutiveFailures(),
                    status.getLastSuccessfulTimestamp());

            // Check if admin alert is required
            if (status.getRequiresAdminAlert()) {
                // Check if we already sent an alert recently (within last 6 hours)
                // to avoid spamming admins with repeated alerts
                LocalDateTime now = LocalDateTime.now();
                boolean shouldSendAlert = lastAlertSent == null ||
                        lastAlertSent.plusHours(6).isBefore(now);

                if (shouldSendAlert) {
                    log.warn("CRITICAL: Scraper system failure detected. Sending alert to admins...");

                    // Format timestamp for email
                    String lastSuccessfulTimestamp = status.getLastSuccessfulTimestamp() != null
                            ? status.getLastSuccessfulTimestamp().format(
                                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                            : "Never";

                    // Build status URL
                    String statusUrl = baseUrl + "/api/v1/admin/scraper/status";

                    // Send alert email to admins
                    boolean emailSent = emailService.sendScraperFailureAlert(
                            adminEmail,
                            adminName,
                            status.getConsecutiveFailures(),
                            lastSuccessfulTimestamp,
                            statusUrl
                    );

                    if (emailSent) {
                        lastAlertSent = now;
                        log.info("Admin alert email sent successfully to: {}", adminEmail);
                    } else {
                        log.error("Failed to send admin alert email to: {}", adminEmail);
                    }
                } else {
                    log.info("Alert already sent recently (last alert: {}). Skipping duplicate alert.",
                            lastAlertSent);
                }
            } else {
                log.info("Scraper status is {} - No admin alert required", status.getGlobalStatus());
            }

            log.info("=== Scheduled scraper status check completed ===");

        } catch (Exception e) {
            log.error("=== Error during scheduled scraper status check ===", e);
        }
    }
}
