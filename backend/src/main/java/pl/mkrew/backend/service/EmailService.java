package pl.mkrew.backend.service;

import com.mailersend.sdk.MailerSend;
import com.mailersend.sdk.MailerSendResponse;
import com.mailersend.sdk.emails.Email;
import com.mailersend.sdk.exceptions.MailerSendException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.mkrew.backend.dto.EmailNotificationRequest;

/**
 * Service for sending emails via MailerSend
 * US-010: Email Notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailLogService emailLogService;

    @Value("${mkrew.email.mailersend.api-key:}")
    private String mailerSendApiKey;

    @Value("${mkrew.email.from-email}")
    private String fromEmail;

    @Value("${mkrew.email.from-name}")
    private String fromName;

    @Value("${mkrew.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${mkrew.app.base-url}")
    private String appBaseUrl;

    /**
     * Send email notification
     *
     * @param request Email notification request
     * @return true if sent successfully, false otherwise
     */
    public boolean sendEmail(EmailNotificationRequest request) {
        if (!emailEnabled) {
            log.info("Email sending is disabled. Skipping email to: {}", request.getRecipientEmail());
            return false;
        }

        if (mailerSendApiKey == null || mailerSendApiKey.isBlank()) {
            log.warn("MailerSend API key is not configured. Cannot send email to: {}", request.getRecipientEmail());
            return false;
        }

        try {
            // Create email content
            String htmlContent = buildHtmlContent(request);

            // Initialize MailerSend client
            MailerSend ms = new MailerSend();
            ms.setToken(mailerSendApiKey);

            // Create email
            Email email = new Email();
            email.setFrom(fromName, fromEmail);
            email.addRecipient(request.getRecipientName(), request.getRecipientEmail());
            email.setSubject(request.getSubject());
            email.setHtml(htmlContent);

            // Send email via MailerSend
            MailerSendResponse response = ms.emails().send(email);

            // Extract message ID from response
            String messageId = response.messageId;

            // Log email
            emailLogService.createEmailLog(
                    request.getUserId(),
                    request.getRckikId(),
                    request.getNotificationType(),
                    request.getRecipientEmail(),
                    request.getSubject(),
                    messageId
            );

            log.info("Email sent successfully to: {}. Message ID: {}",
                    request.getRecipientEmail(), messageId);
            return true;

        } catch (MailerSendException e) {
            log.error("Error sending email to: {}. Error: {}",
                    request.getRecipientEmail(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Build HTML content from template and variables
     *
     * @param request Email notification request
     * @return HTML content
     */
    private String buildHtmlContent(EmailNotificationRequest request) {
        // For MVP: Simple template substitution
        // Future: Use template engine like Thymeleaf or Freemarker

        if (request.getTemplateVariables() != null && !request.getTemplateVariables().isEmpty()) {
            String template = request.getTemplateName();
            for (var entry : request.getTemplateVariables().entrySet()) {
                String placeholder = "{{" + entry.getKey() + "}}";
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                template = template.replace(placeholder, value);
            }
            return template;
        }

        return request.getTemplateName();
    }


    /**
     * Send critical blood level alert email
     *
     * @param recipientEmail Recipient email
     * @param recipientName  Recipient name
     * @param userId         User ID
     * @param rckikName      RCKiK name
     * @param rckikId        RCKiK ID
     * @param criticalGroups Critical blood groups (formatted string)
     * @param detailsUrl     URL to RCKiK details
     * @return true if sent successfully
     */
    public boolean sendCriticalBloodLevelAlert(
            String recipientEmail,
            String recipientName,
            Long userId,
            String rckikName,
            Long rckikId,
            String criticalGroups,
            String detailsUrl) {

        String subject = "Krytyczny poziom krwi - " + rckikName;

        String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Krytyczny poziom krwi</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #d32f2f;">⚠️ Pilne: Krytyczny poziom krwi</h2>
                        <p>Witaj {{recipientName}},</p>
                        <p>W jednym z Twoich ulubionych centrów krwiodawstwa został wykryty <strong>krytyczny poziom zapasów krwi</strong>.</p>
                        <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">{{rckikName}}</h3>
                            <p><strong>Krytyczne grupy krwi:</strong></p>
                            <p>{{criticalGroups}}</p>
                        </div>
                        <p>Twoja krew może uratować życie! Jeśli jesteś w stanie oddać krew, każda donacja ma znaczenie.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{detailsUrl}}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Zobacz szczegóły
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #666; margin-top: 30px;">
                            To powiadomienie zostało wysłane, ponieważ masz zapisane {{rckikName}} jako ulubione centrum krwiodawstwa.
                            Możesz zmienić swoje preferencje powiadomień w ustawieniach konta.
                        </p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">
                            mkrew - Platforma dla dawców krwi<br>
                            <a href="https://mkrew.pl" style="color: #d32f2f;">mkrew.pl</a>
                        </p>
                    </div>
                </body>
                </html>
                """;

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .subject(subject)
                .notificationType("CRITICAL_ALERT")
                .templateName(htmlTemplate)
                .templateVariables(java.util.Map.of(
                        "recipientName", recipientName,
                        "rckikName", rckikName,
                        "criticalGroups", criticalGroups,
                        "detailsUrl", detailsUrl
                ))
                .userId(userId)
                .rckikId(rckikId)
                .build();

        return sendEmail(request);
    }

    /**
     * Send account deletion confirmation email
     * US-016: Right to be Forgotten
     *
     * @param recipientEmail Recipient email
     * @param recipientName  Recipient name
     * @param userId         User ID
     * @return true if sent successfully
     */
    public boolean sendAccountDeletionConfirmation(
            String recipientEmail,
            String recipientName,
            Long userId) {

        String subject = "Potwierdzenie usunięcia konta - mkrew";

        String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Potwierdzenie usunięcia konta</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #d32f2f;">Usunięcie konta</h2>
                        <p>Witaj {{recipientName}},</p>
                        <p>Potwierdzamy, że Twoje konto w serwisie mkrew zostało oznaczone do usunięcia.</p>
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Co zostało usunięte?</h3>
                            <ul>
                                <li>Dane profilowe (imię, nazwisko, grupa krwi)</li>
                                <li>Historia donacji</li>
                                <li>Ulubione centra krwiodawstwa</li>
                                <li>Preferencje powiadomień</li>
                                <li>Wszystkie sesje (zostałeś/aś automatycznie wylogowany/a)</li>
                            </ul>
                        </div>
                        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Co zachowujemy?</h3>
                            <p>Zgodnie z obowiązującymi przepisami prawa, zachowujemy:</p>
                            <ul>
                                <li>Logi audytowe (wymagane prawnie)</li>
                                <li>Dane niezbędne do wypełnienia obowiązków prawnych</li>
                            </ul>
                            <p style="font-size: 14px; color: #666;">
                                Dane te są przechowywane w formie zanonimizowanej i nie są wykorzystywane do żadnych innych celów.
                            </p>
                        </div>
                        <p>Jeśli to nie Ty zażądałeś/aś usunięcia konta lub masz jakiekolwiek pytania, skontaktuj się z nami jak najszybciej.</p>
                        <p>Dziękujemy za korzystanie z naszej platformy i wspieranie dawstwa krwi!</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">
                            mkrew - Platforma dla dawców krwi<br>
                            <a href="https://mkrew.pl" style="color: #d32f2f;">mkrew.pl</a>
                        </p>
                    </div>
                </body>
                </html>
                """;

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .subject(subject)
                .notificationType("OTHER")
                .templateName(htmlTemplate)
                .templateVariables(java.util.Map.of(
                        "recipientName", recipientName
                ))
                .userId(userId)
                .rckikId(null)
                .build();

        return sendEmail(request);
    }

    /**
     * Send scraper failure alert email to administrators
     * US-025: Extreme Mode - Notify admins about prolonged scraper failures
     *
     * @param adminEmail        Administrator email
     * @param adminName         Administrator name
     * @param consecutiveFailures Number of consecutive failures
     * @param lastSuccessfulTimestamp Last successful scraper run timestamp
     * @param statusUrl         URL to check scraper status
     * @return true if sent successfully
     */
    public boolean sendScraperFailureAlert(
            String adminEmail,
            String adminName,
            int consecutiveFailures,
            String lastSuccessfulTimestamp,
            String statusUrl) {

        String subject = "CRITICAL: Scraping System Failure - Manual Intervention Required";

        String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Scraping System Failure Alert</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #d32f2f;">🚨 CRITICAL ALERT: Scraping System Failure</h2>
                        <p>Hello {{adminName}},</p>
                        <p>The mkrew blood donation scraping system has experienced a <strong>prolonged failure</strong> and requires immediate manual intervention.</p>
                        <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Failure Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0;"><strong>Consecutive Failures:</strong></td>
                                    <td style="padding: 8px 0;">{{consecutiveFailures}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>Last Successful Run:</strong></td>
                                    <td style="padding: 8px 0;">{{lastSuccessfulTimestamp}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>Status:</strong></td>
                                    <td style="padding: 8px 0; color: #d32f2f;"><strong>FAILED</strong></td>
                                </tr>
                            </table>
                        </div>
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">⚠️ Recommended Actions</h3>
                            <ol>
                                <li><strong>Check RCKiK websites</strong> - Verify if the source websites are accessible</li>
                                <li><strong>Review scraper logs</strong> - Check for error messages and patterns</li>
                                <li><strong>Consider manual data import</strong> - If websites have changed structure, update parsers or import data manually</li>
                                <li><strong>Notify users</strong> - If data will be stale for extended period, inform users about the situation</li>
                            </ol>
                        </div>
                        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">📋 Next Steps</h3>
                            <p>1. <strong>Review System Status:</strong></p>
                            <div style="text-align: center; margin: 15px 0;">
                                <a href="{{statusUrl}}" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                    View Scraper Status Dashboard
                                </a>
                            </div>
                            <p>2. <strong>Check Scraper Logs:</strong></p>
                            <p style="font-size: 14px; color: #666;">Review detailed logs in the admin panel to identify the root cause</p>
                            <p>3. <strong>Manual Scraper Trigger:</strong></p>
                            <p style="font-size: 14px; color: #666;">Try triggering a manual scraper run via the admin API to test if the issue persists</p>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-top: 30px;">
                            <strong>Note:</strong> This alert is triggered when the scraping system experiences 3 or more consecutive failures.
                            Immediate action is recommended to maintain data freshness for users.
                        </p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">
                            mkrew Admin Alert System<br>
                            <a href="https://mkrew.pl/admin" style="color: #d32f2f;">Admin Dashboard</a>
                        </p>
                    </div>
                </body>
                </html>
                """;

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .recipientEmail(adminEmail)
                .recipientName(adminName)
                .subject(subject)
                .notificationType("SYSTEM_ALERT")
                .templateName(htmlTemplate)
                .templateVariables(java.util.Map.of(
                        "adminName", adminName,
                        "consecutiveFailures", String.valueOf(consecutiveFailures),
                        "lastSuccessfulTimestamp", lastSuccessfulTimestamp != null ? lastSuccessfulTimestamp : "Never",
                        "statusUrl", statusUrl
                ))
                .userId(null)
                .rckikId(null)
                .build();

        return sendEmail(request);
    }

    /**
     * Send email verification email with token
     * US-001: User Registration
     *
     * @param recipientEmail Recipient email
     * @param firstName      Recipient first name
     * @param verificationToken Email verification token
     * @return true if sent successfully
     */
    public boolean sendVerificationEmail(
            String recipientEmail,
            String firstName,
            String verificationToken) {

        String subject = "Potwierdź swój adres email - mkrew";

        // Build verification URL
        String verificationUrl = appBaseUrl + "/verify-email?token=" + verificationToken;

        String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Weryfikacja adresu email</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #d32f2f; margin: 0;">mkrew</h1>
                            <p style="color: #666; font-size: 14px; margin: 5px 0;">Platforma dla dawców krwi</p>
                        </div>

                        <h2 style="color: #333;">Witaj {{firstName}}! 👋</h2>
                        <p>Dziękujemy za rejestrację w serwisie mkrew!</p>
                        <p>Aby dokończyć proces rejestracji i aktywować swoje konto, musisz potwierdzić swój adres email.</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{verificationUrl}}" style="background-color: #d32f2f; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px;">
                                Potwierdź adres email
                            </a>
                        </div>

                        <div style="background-color: #f5f5f5; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #666;">
                                <strong>Ważne:</strong> Link weryfikacyjny jest ważny przez <strong>24 godziny</strong>.
                            </p>
                        </div>

                        <p style="font-size: 14px; color: #666;">
                            Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
                        </p>
                        <p style="font-size: 12px; word-break: break-all; color: #2196f3; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                            {{verificationUrl}}
                        </p>

                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999;">
                            Jeśli to nie Ty zarejestrowałeś/aś to konto, zignoruj tę wiadomość.
                        </p>

                        <p style="font-size: 12px; color: #999; margin-top: 30px;">
                            mkrew - Platforma dla dawców krwi<br>
                            <a href="https://mkrew.pl" style="color: #d32f2f;">mkrew.pl</a>
                        </p>
                    </div>
                </body>
                </html>
                """;

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .recipientEmail(recipientEmail)
                .recipientName(firstName)
                .subject(subject)
                .notificationType("OTHER")
                .templateName(htmlTemplate)
                .templateVariables(java.util.Map.of(
                        "firstName", firstName,
                        "verificationUrl", verificationUrl
                ))
                .userId(null)
                .rckikId(null)
                .build();

        return sendEmail(request);
    }

    /**
     * Send welcome email after successful email verification
     * US-002: Email Verification
     *
     * @param recipientEmail Recipient email
     * @param firstName      Recipient first name
     * @return true if sent successfully
     */
    public boolean sendWelcomeEmail(
            String recipientEmail,
            String firstName) {

        String subject = "Witamy w mkrew! 🩸";

        String loginUrl = appBaseUrl + "/login";
        String dashboardUrl = appBaseUrl + "/dashboard";

        String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Witamy w mkrew</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #d32f2f; margin: 0;">mkrew</h1>
                            <p style="color: #666; font-size: 14px; margin: 5px 0;">Platforma dla dawców krwi</p>
                        </div>

                        <h2 style="color: #333;">Witamy, {{firstName}}! 🎉</h2>
                        <p>Twoje konto zostało pomyślnie aktywowane!</p>
                        <p>Jesteś teraz częścią społeczności mkrew - platformy wspierającej dawców krwi w Polsce.</p>

                        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1976d2;">Co możesz teraz zrobić?</h3>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>📍 Sprawdź aktualne poziomy krwi w centrach krwiodawstwa</li>
                                <li>⭐ Dodaj swoje ulubione centra do obserwowanych</li>
                                <li>📝 Prowadź dziennik swoich donacji</li>
                                <li>🔔 Otrzymuj powiadomienia o krytycznych poziomach krwi</li>
                                <li>👤 Uzupełnij swój profil i ustawienia powiadomień</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{loginUrl}}" style="background-color: #d32f2f; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px; margin: 0 5px;">
                                Zaloguj się
                            </a>
                            <a href="{{dashboardUrl}}" style="background-color: #2196f3; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px; margin: 0 5px;">
                                Zobacz poziomy krwi
                            </a>
                        </div>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #f57f17;">💡 Wskazówka</h3>
                            <p style="margin: 0; font-size: 14px;">
                                Jeśli chcesz otrzymywać powiadomienia o krytycznych poziomach krwi w swoich ulubionych centrach,
                                przejdź do <strong>Ustawień > Powiadomienia</strong> i dostosuj swoje preferencje.
                            </p>
                        </div>

                        <p style="margin-top: 30px;">
                            Dziękujemy za dołączenie do nas i wspieranie dawstwa krwi w Polsce! 🇵🇱
                        </p>

                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999;">
                            Jeśli masz jakiekolwiek pytania, skontaktuj się z nami poprzez formularz kontaktowy na stronie.
                        </p>

                        <p style="font-size: 12px; color: #999; margin-top: 30px;">
                            mkrew - Platforma dla dawców krwi<br>
                            <a href="https://mkrew.pl" style="color: #d32f2f;">mkrew.pl</a>
                        </p>
                    </div>
                </body>
                </html>
                """;

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .recipientEmail(recipientEmail)
                .recipientName(firstName)
                .subject(subject)
                .notificationType("OTHER")
                .templateName(htmlTemplate)
                .templateVariables(java.util.Map.of(
                        "firstName", firstName,
                        "loginUrl", loginUrl,
                        "dashboardUrl", dashboardUrl
                ))
                .userId(null)
                .rckikId(null)
                .build();

        return sendEmail(request);
    }
}
