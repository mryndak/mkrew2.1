package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for list of in-app notifications
 * US-011: In-App Notifications
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InAppNotificationsResponse {

    private List<InAppNotificationDto> notifications;
    private int page;
    private int size;
    private long totalElements;
    private long unreadCount;
}
