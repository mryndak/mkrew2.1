package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for InAppNotification
 * US-011: In-App Notifications
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InAppNotificationDto {

    private Long id;
    private String type;
    private RckikDto rckik;
    private String title;
    private String message;
    private String linkUrl;
    private LocalDateTime readAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RckikDto {
        private Long id;
        private String name;
    }
}
