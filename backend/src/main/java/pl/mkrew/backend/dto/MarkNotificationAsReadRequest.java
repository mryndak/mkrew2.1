package pl.mkrew.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for marking notification as read
 * US-011: In-App Notifications
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkNotificationAsReadRequest {

    @NotNull(message = "readAt timestamp is required")
    private LocalDateTime readAt;
}
