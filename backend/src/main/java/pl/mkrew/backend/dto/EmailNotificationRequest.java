package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for email notification request
 * Internal use for EmailService
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailNotificationRequest {

    /**
     * Recipient email address
     */
    private String recipientEmail;

    /**
     * Recipient name
     */
    private String recipientName;

    /**
     * Email subject
     */
    private String subject;

    /**
     * Email notification type
     * Corresponds to email_logs.notification_type
     */
    private String notificationType;

    /**
     * Template name or email body (HTML)
     */
    private String templateName;

    /**
     * Template variables
     */
    private Map<String, Object> templateVariables;

    /**
     * RCKiK ID (optional, for logging)
     */
    private Long rckikId;

    /**
     * User ID (optional, for logging)
     */
    private Long userId;
}
