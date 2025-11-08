package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.InAppNotificationDto;
import pl.mkrew.backend.dto.InAppNotificationsResponse;
import pl.mkrew.backend.dto.MarkNotificationAsReadRequest;
import pl.mkrew.backend.dto.UnreadCountResponse;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.InAppNotificationService;

/**
 * REST Controller for In-App Notifications
 * US-011: In-App Notifications
 *
 * Endpoints:
 * - GET /api/v1/users/me/notifications - List notifications
 * - PATCH /api/v1/users/me/notifications/{id} - Mark as read
 * - GET /api/v1/users/me/notifications/unread-count - Get unread count
 */
@RestController
@RequestMapping("/api/v1/users/me/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "In-App Notifications", description = "In-app notification management endpoints (US-011)")
@SecurityRequirement(name = "Bearer Authentication")
public class InAppNotificationController {

    private final InAppNotificationService notificationService;

    /**
     * Get user's in-app notifications
     * US-011: View Notifications
     *
     * @param unreadOnly Filter only unread notifications
     * @param page       Page number (default: 0)
     * @param size       Page size (default: 20, max: 100)
     * @return List of notifications with pagination
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(
            summary = "Get user's in-app notifications",
            description = "Retrieve paginated list of in-app notifications for the authenticated user. " +
                    "Can filter to show only unread notifications."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notifications retrieved successfully",
                    content = @Content(schema = @Schema(implementation = InAppNotificationsResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<InAppNotificationsResponse> getNotifications(
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/notifications - User: {}, unreadOnly: {}, page: {}, size: {}",
                userId, unreadOnly, page, size);

        // Enforce max page size
        int effectiveSize = Math.min(size, 100);

        InAppNotificationsResponse response = notificationService.getUserNotifications(
                userId, unreadOnly, page, effectiveSize);

        log.info("Retrieved {} notifications for user {} (total: {}, unread: {})",
                response.getNotifications().size(), userId,
                response.getTotalElements(), response.getUnreadCount());

        return ResponseEntity.ok(response);
    }

    /**
     * Mark notification as read
     * US-011: Mark as Read
     *
     * @param id      Notification ID
     * @param request Read timestamp
     * @return Updated notification
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    @Operation(
            summary = "Mark notification as read",
            description = "Mark a specific in-app notification as read. Only the notification owner can mark it as read."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification marked as read successfully",
                    content = @Content(schema = @Schema(implementation = InAppNotificationDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the owner of the notification",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Notification not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<InAppNotificationDto> markAsRead(
            @PathVariable Long id,
            @Valid @RequestBody MarkNotificationAsReadRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("PATCH /api/v1/users/me/notifications/{} - User: {}, readAt: {}",
                id, userId, request.getReadAt());

        InAppNotificationDto notification = notificationService.markAsRead(
                id, userId, request.getReadAt());

        log.info("Notification {} marked as read for user {}", id, userId);

        return ResponseEntity.ok(notification);
    }

    /**
     * Get unread notification count
     * US-011: Unread Count for Badge
     *
     * @return Unread count
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('USER')")
    @Operation(
            summary = "Get unread notification count",
            description = "Get the count of unread in-app notifications for the authenticated user. " +
                    "Used for displaying notification badge in UI."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unread count retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UnreadCountResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/notifications/unread-count - User: {}", userId);

        UnreadCountResponse response = notificationService.getUnreadCount(userId);

        log.info("User {} has {} unread notifications", userId, response.getUnreadCount());

        return ResponseEntity.ok(response);
    }
}
