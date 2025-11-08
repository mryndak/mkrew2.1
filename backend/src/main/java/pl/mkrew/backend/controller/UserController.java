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
import pl.mkrew.backend.dto.UpdateProfileRequest;
import pl.mkrew.backend.dto.UserProfileResponse;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.UserService;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Profile", description = "User profile management endpoints")
public class UserController {

    private final UserService userService;

    /**
     * US-005: Get current user profile
     * GET /api/v1/users/me
     *
     * Returns current authenticated user's profile information.
     *
     * @return UserProfileResponse with user data
     */
    @Operation(
            summary = "Get current user profile",
            description = "Returns profile information for the currently authenticated user",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))
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
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me - Get profile request for user ID: {}", userId);

        UserProfileResponse response = userService.getUserProfile(userId);

        log.info("Profile retrieved successfully for user ID: {}", userId);

        return ResponseEntity.ok(response);
    }

    /**
     * US-005: Update current user profile
     * PATCH /api/v1/users/me
     *
     * Updates current authenticated user's profile.
     * Only provided fields are updated (partial update).
     * Email cannot be changed via this endpoint.
     *
     * @param request Update request with optional fields
     * @return Updated UserProfileResponse
     */
    @Operation(
            summary = "Update current user profile",
            description = "Updates profile information for the currently authenticated user. Only provided fields are updated. Email cannot be changed via this endpoint.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))
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
    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUserProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("PATCH /api/v1/users/me - Update profile request for user ID: {}", userId);

        UserProfileResponse response = userService.updateUserProfile(userId, request);

        log.info("Profile updated successfully for user ID: {}", userId);

        return ResponseEntity.ok(response);
    }
}
