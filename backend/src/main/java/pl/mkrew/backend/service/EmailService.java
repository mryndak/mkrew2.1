package pl.mkrew.backend.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.mkrew.backend.dto.EmailNotificationRequest;

import java.io.IOException;

/**
 * Service for sending emails via SendGrid
 * US-010: Email Notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailLogService emailLogService;

    @Value("${mkrew.email.sendgrid.api-key:}")
    private String sendGridApiKey;

    @Value("${mkrew.email.from-email}")
    private String fromEmail;

    @Value("${mkrew.email.from-name}")
    private String fromName;

    @Value("${mkrew.email.enabled:true}")
    private boolean emailEnabled;

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

        if (sendGridApiKey == null || sendGridApiKey.isBlank()) {
            log.warn("SendGrid API key is not configured. Cannot send email to: {}", request.getRecipientEmail());
            return false;
        }

        try {
            // Create email content
            String htmlContent = buildHtmlContent(request);

            // Create SendGrid mail object
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(request.getRecipientEmail(), request.getRecipientName());
            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, request.getSubject(), to, content);

            // Send email via SendGrid
            SendGrid sg = new SendGrid(sendGridApiKey);
            Request sendGridRequest = new Request();
            sendGridRequest.setMethod(Method.POST);
            sendGridRequest.setEndpoint("mail/send");
            sendGridRequest.setBody(mail.build());

            Response response = sg.api(sendGridRequest);

            // Extract message ID from response headers
            String messageId = extractMessageId(response);

            // Log email
            emailLogService.createEmailLog(
                    request.getUserId(),
                    request.getRckikId(),
                    request.getNotificationType(),
                    request.getRecipientEmail(),
                    request.getSubject(),
                    messageId
            );

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to: {}. Status: {}. Message ID: {}",
                        request.getRecipientEmail(), response.getStatusCode(), messageId);
                return true;
            } else {
                log.error("Failed to send email to: {}. Status: {}. Body: {}",
                        request.getRecipientEmail(), response.getStatusCode(), response.getBody());
                return false;
            }

        } catch (IOException e) {
            log.error("Error sending email to: {}", request.getRecipientEmail(), e);
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
     * Extract message ID from SendGrid response headers
     *
     * @param response SendGrid response
     * @return Message ID or null
     */
    private String extractMessageId(Response response) {
        try {
            if (response.getHeaders() != null && response.getHeaders().containsKey("X-Message-Id")) {
                return response.getHeaders().get("X-Message-Id");
            }
        } catch (Exception e) {
            log.debug("Could not extract message ID from SendGrid response", e);
        }
        return null;
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
}
