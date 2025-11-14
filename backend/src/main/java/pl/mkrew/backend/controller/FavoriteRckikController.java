package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.ErrorResponse;
import pl.mkrew.backend.dto.FavoriteRckikDto;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.FavoriteRckikService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me/favorites")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Favorite RCKiK", description = "User's favorite blood donation centers management")
@PreAuthorize("hasRole('USER')")
public class FavoriteRckikController {

    private final FavoriteRckikService favoriteRckikService;

    /**
     * US-009: Get user's favorite RCKiK centers
     * GET /api/v1/users/me/favorites
     *
     * Returns list of user's favorite blood donation centers with current blood levels.
     * Authentication required.
     *
     * @return List of FavoriteRckikDto
     */
    @Operation(
            summary = "Get favorite blood centers",
            description = "Returns list of authenticated user's favorite blood donation centers " +
                    "with current blood levels. Centers are ordered by priority (if set) then by date added. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Favorites retrieved successfully (may be empty list)",
                    content = @Content(schema = @Schema(implementation = FavoriteRckikDto.class))
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
    public ResponseEntity<List<FavoriteRckikDto>> getUserFavorites() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("GET /api/v1/users/me/favorites - Get favorites for user ID: {}", userId);

        List<FavoriteRckikDto> favorites = favoriteRckikService.getUserFavorites(userId);

        log.info("Retrieved {} favorites for user ID: {}", favorites.size(), userId);

        return ResponseEntity.ok(favorites);
    }

    /**
     * US-009: Add RCKiK center to favorites
     * POST /api/v1/users/me/favorites/{rckikId}
     *
     * Adds a blood donation center to user's favorites.
     * Authentication required.
     *
     * @param rckikId RCKiK center ID
     * @param priority Optional priority for ordering
     * @return Created favorite entry
     */
    @Operation(
            summary = "Add blood center to favorites",
            description = "Adds a blood donation center to authenticated user's favorites. " +
                    "Optional priority parameter can be used to order favorites. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Favorite added successfully",
                    content = @Content(schema = @Schema(implementation = FavoriteRckikDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad request - Center already in favorites",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User or RCKiK center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/{rckikId}")
    public ResponseEntity<FavoriteRckikDto> addFavorite(
            @Parameter(description = "RCKiK center ID to add", example = "5")
            @PathVariable Long rckikId,

            @Parameter(description = "Optional priority for ordering (lower number = higher priority)", example = "1")
            @RequestParam(required = false) Integer priority) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("POST /api/v1/users/me/favorites/{} - Add favorite for user ID: {}, priority: {}",
                rckikId, userId, priority);

        FavoriteRckikDto favorite = favoriteRckikService.addFavorite(userId, rckikId, priority);

        log.info("Added RCKiK {} to favorites for user ID: {}", rckikId, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(favorite);
    }

    /**
     * US-009: Remove RCKiK center from favorites
     * DELETE /api/v1/users/me/favorites/{rckikId}
     *
     * Removes a blood donation center from user's favorites.
     * Authentication required.
     *
     * @param rckikId RCKiK center ID
     * @return No content
     */
    @Operation(
            summary = "Remove blood center from favorites",
            description = "Removes a blood donation center from authenticated user's favorites. " +
                    "JWT authentication required.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Favorite removed successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User or favorite not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{rckikId}")
    public ResponseEntity<Void> removeFavorite(
            @Parameter(description = "RCKiK center ID to remove", example = "5")
            @PathVariable Long rckikId) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("DELETE /api/v1/users/me/favorites/{} - Remove favorite for user ID: {}", rckikId, userId);

        favoriteRckikService.removeFavorite(userId, rckikId);

        log.info("Removed RCKiK {} from favorites for user ID: {}", rckikId, userId);

        return ResponseEntity.noContent().build();
    }
}
