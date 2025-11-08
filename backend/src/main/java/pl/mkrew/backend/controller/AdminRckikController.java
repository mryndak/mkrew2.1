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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.security.SecurityUtils;
import pl.mkrew.backend.service.RckikService;

/**
 * Admin controller for RCKiK management
 * US-019: Zarządzanie kanoniczną listą RCKiK
 */
@RestController
@RequestMapping("/api/v1/admin/rckik")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - RCKiK", description = "Admin endpoints for RCKiK center management")
public class AdminRckikController {

    private final RckikService rckikService;

    /**
     * US-019: List all RCKiK centers (including inactive)
     * GET /api/v1/admin/rckik
     *
     * Returns paginated list of all RCKiK centers for admin management.
     *
     * @param pageable Pagination parameters
     * @return Page of RckikDto
     */
    @Operation(
            summary = "List all RCKiK centers",
            description = "Get paginated list of all RCKiK centers (including inactive) for admin management",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "RCKiK centers retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not have ADMIN role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping
    public ResponseEntity<Page<RckikDto>> listRckiks(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {

        log.info("GET /api/v1/admin/rckik - List RCKiK centers");

        Page<RckikDto> rckiks = rckikService.listAllRckiksForAdmin(pageable);

        log.info("Retrieved {} RCKiK centers", rckiks.getTotalElements());

        return ResponseEntity.ok(rckiks);
    }

    /**
     * US-019: Get RCKiK center by ID
     * GET /api/v1/admin/rckik/{id}
     *
     * Returns detailed information about specific RCKiK center.
     *
     * @param id RCKiK ID
     * @return RckikDto
     */
    @Operation(
            summary = "Get RCKiK center by ID",
            description = "Get detailed information about specific RCKiK center",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "RCKiK center retrieved successfully",
                    content = @Content(schema = @Schema(implementation = RckikDto.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not have ADMIN role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "RCKiK center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<RckikDto> getRckikById(@PathVariable Long id) {

        log.info("GET /api/v1/admin/rckik/{} - Get RCKiK center", id);

        RckikDto rckik = rckikService.getRckikByIdForAdmin(id);

        log.info("Retrieved RCKiK center: {}", id);

        return ResponseEntity.ok(rckik);
    }

    /**
     * US-019: Create new RCKiK center
     * POST /api/v1/admin/rckik
     *
     * Creates new blood donation center with canonical data.
     *
     * @param request Create RCKiK request
     * @return Created RckikDto
     */
    @Operation(
            summary = "Create new RCKiK center",
            description = "Create new blood donation center with canonical data. Creates audit log entry.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "RCKiK center created successfully",
                    content = @Content(schema = @Schema(implementation = RckikDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error - Invalid request data or code already exists",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not have ADMIN role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<RckikDto> createRckik(@Valid @RequestBody CreateRckikRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("POST /api/v1/admin/rckik - Create RCKiK center by user ID: {}", userId);

        RckikDto createdRckik = rckikService.createRckik(request, userId);

        log.info("RCKiK center created successfully - ID: {}", createdRckik.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(createdRckik);
    }

    /**
     * US-019: Update RCKiK center
     * PUT /api/v1/admin/rckik/{id}
     *
     * Updates existing blood donation center information.
     *
     * @param id RCKiK ID
     * @param request Update RCKiK request
     * @return Updated RckikDto
     */
    @Operation(
            summary = "Update RCKiK center",
            description = "Update existing blood donation center information. Creates audit log entry.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "RCKiK center updated successfully",
                    content = @Content(schema = @Schema(implementation = RckikDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error - Invalid request data or code already exists",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not have ADMIN role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "RCKiK center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PutMapping("/{id}")
    public ResponseEntity<RckikDto> updateRckik(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRckikRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("PUT /api/v1/admin/rckik/{} - Update RCKiK center by user ID: {}", id, userId);

        RckikDto updatedRckik = rckikService.updateRckik(id, request, userId);

        log.info("RCKiK center updated successfully - ID: {}", id);

        return ResponseEntity.ok(updatedRckik);
    }

    /**
     * US-019: Delete (deactivate) RCKiK center
     * DELETE /api/v1/admin/rckik/{id}
     *
     * Soft deletes blood donation center (sets active=false).
     *
     * @param id RCKiK ID
     * @return No content
     */
    @Operation(
            summary = "Delete (deactivate) RCKiK center",
            description = "Soft delete blood donation center by setting active=false. Creates audit log entry.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "RCKiK center deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User does not have ADMIN role",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "RCKiK center not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRckik(@PathVariable Long id) {

        Long userId = SecurityUtils.getCurrentUserId();
        log.info("DELETE /api/v1/admin/rckik/{} - Delete RCKiK center by user ID: {}", id, userId);

        rckikService.deleteRckik(id, userId);

        log.info("RCKiK center deleted successfully - ID: {}", id);

        return ResponseEntity.noContent().build();
    }
}
