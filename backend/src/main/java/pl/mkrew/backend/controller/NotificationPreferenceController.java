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
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.NotificationPreferencesResponse;
import pl.mkrew.backend.dto.UpdateNotificationPreferencesRequest;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.NotificationPreferenceService;

@RestController
@RequestMapping("/api/v1/users/me/notification-preferences")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notification Preferences", description = "User notification preferences management endpoints")
public class NotificationPreferenceController {

    private final NotificationPreferenceService notificationPreferenceService;

    /**
     * US-006: Get notification preferences
     * GET /api/v1/users/me/notification-preferences
     *
     * Returns current user's notification preferences.
     * Auto-creates default preferences if not exists (one-to-one with user).
     *
     * @return NotificationPreferencesResponse
     */
    @Operation(
            summary = "Get notification preferences",
            description = "Returns notification preferences for the currently authenticated user. " +
                    "Auto-creates default preferences if not exists.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Preferences retrieved successfully",
                    content = @Content(schema = @Schema(implementation = NotificationPreferencesResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping
    public ResponseEntity<NotificationPreferencesResponse> getNotificationPreferences() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/notification-preferences - Get preferences request for user ID: {}", userId);

        NotificationPreferencesResponse response = notificationPreferenceService.getNotificationPreferences(userId);

        log.info("Notification preferences retrieved successfully for user ID: {}", userId);

        return ResponseEntity.ok(response);
    }

    /**
     * US-006: Update notification preferences
     * PUT /api/v1/users/me/notification-preferences
     *
     * Updates current user's notification preferences (full update).
     * All fields are required according to PUT semantics.
     *
     * @param request Update request with all required fields
     * @return Updated NotificationPreferencesResponse
     */
    @Operation(
            summary = "Update notification preferences",
            description = "Updates notification preferences for the currently authenticated user. " +
                    "This is a full update (PUT) - all fields are required. " +
                    "If preferences don't exist, they will be created with provided values.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Preferences updated successfully",
                    content = @Content(schema = @Schema(implementation = NotificationPreferencesResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PutMapping
    public ResponseEntity<NotificationPreferencesResponse> updateNotificationPreferences(
            @Valid @RequestBody UpdateNotificationPreferencesRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("PUT /api/v1/users/me/notification-preferences - Update preferences request for user ID: {}", userId);

        NotificationPreferencesResponse response = notificationPreferenceService
                .updateNotificationPreferences(userId, request);

        log.info("Notification preferences updated successfully for user ID: {}", userId);

        return ResponseEntity.ok(response);
    }
}
