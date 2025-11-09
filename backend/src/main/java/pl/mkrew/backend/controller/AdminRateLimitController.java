package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.ratelimit.RateLimitService;
import pl.mkrew.backend.ratelimit.RateLimitType;

import java.util.Map;

/**
 * Admin controller for managing rate limits
 * US-023: API Security and Rate Limiting
 */
@RestController
@RequestMapping("/api/v1/admin/rate-limit")
@RequiredArgsConstructor
@Tag(name = "Admin - Rate Limit", description = "Admin endpoints for managing rate limits")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRateLimitController {

    private final RateLimitService rateLimitService;

    /**
     * Reset rate limit for specific IP address
     *
     * @param ipAddress IP address
     * @param limitType Rate limit type
     * @return Success message
     */
    @PostMapping("/reset/ip/{ipAddress}")
    @Operation(summary = "Reset rate limit for IP", description = "Reset rate limit for specific IP address")
    public ResponseEntity<Map<String, String>> resetIpLimit(
            @PathVariable String ipAddress,
            @RequestParam RateLimitType limitType) {

        rateLimitService.resetIpLimit(ipAddress, limitType);

        return ResponseEntity.ok(Map.of(
                "message", "Rate limit reset successfully",
                "ipAddress", ipAddress,
                "limitType", limitType.name()
        ));
    }

    /**
     * Reset rate limit for specific user
     *
     * @param userId User ID
     * @param limitType Rate limit type
     * @return Success message
     */
    @PostMapping("/reset/user/{userId}")
    @Operation(summary = "Reset rate limit for user", description = "Reset rate limit for specific user")
    public ResponseEntity<Map<String, String>> resetUserLimit(
            @PathVariable Long userId,
            @RequestParam RateLimitType limitType) {

        rateLimitService.resetUserLimit(userId, limitType);

        return ResponseEntity.ok(Map.of(
                "message", "Rate limit reset successfully",
                "userId", userId.toString(),
                "limitType", limitType.name()
        ));
    }

    /**
     * Get rate limit cache statistics
     *
     * @return Cache statistics
     */
    @GetMapping("/stats")
    @Operation(summary = "Get rate limit statistics", description = "Get cache statistics for monitoring")
    public ResponseEntity<Map<String, String>> getStats() {
        String stats = rateLimitService.getCacheStats();

        return ResponseEntity.ok(Map.of(
                "stats", stats
        ));
    }
}
