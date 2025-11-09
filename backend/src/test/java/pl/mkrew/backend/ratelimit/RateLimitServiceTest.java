package pl.mkrew.backend.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.mkrew.backend.exception.RateLimitExceededException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for RateLimitService
 * US-023: API Security and Rate Limiting
 */
class RateLimitServiceTest {

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitService();
    }

    @Test
    void testIpLimit_WithinLimit_ShouldPass() {
        // Given
        String ipAddress = "192.168.1.1";
        RateLimitType limitType = RateLimitType.PUBLIC_API;

        // When & Then - First request should pass
        assertDoesNotThrow(() -> rateLimitService.checkIpLimit(ipAddress, limitType));
    }

    @Test
    void testIpLimit_ExceedLimit_ShouldThrowException() {
        // Given
        String ipAddress = "192.168.1.2";
        RateLimitType limitType = RateLimitType.REGISTRATION; // 5 requests per hour

        // When - Consume all tokens
        for (int i = 0; i < 5; i++) {
            assertDoesNotThrow(() -> rateLimitService.checkIpLimit(ipAddress, limitType));
        }

        // Then - 6th request should fail
        RateLimitExceededException exception = assertThrows(
                RateLimitExceededException.class,
                () -> rateLimitService.checkIpLimit(ipAddress, limitType)
        );

        assertTrue(exception.getMessage().contains("Too many requests"));
        assertTrue(exception.getRetryAfterSeconds() > 0);
    }

    @Test
    void testUserLimit_WithinLimit_ShouldPass() {
        // Given
        Long userId = 123L;
        RateLimitType limitType = RateLimitType.AUTHENTICATED_API;

        // When & Then - First request should pass
        assertDoesNotThrow(() -> rateLimitService.checkUserLimit(userId, limitType));
    }

    @Test
    void testUserLimit_ExceedLimit_ShouldThrowException() {
        // Given
        Long userId = 456L;
        RateLimitType limitType = RateLimitType.PASSWORD_RESET; // 3 requests per hour

        // When - Consume all tokens
        for (int i = 0; i < 3; i++) {
            assertDoesNotThrow(() -> rateLimitService.checkUserLimit(userId, limitType));
        }

        // Then - 4th request should fail
        RateLimitExceededException exception = assertThrows(
                RateLimitExceededException.class,
                () -> rateLimitService.checkUserLimit(userId, limitType)
        );

        assertTrue(exception.getMessage().contains("Too many requests"));
    }

    @Test
    void testEmailLimit_WithinLimit_ShouldPass() {
        // Given
        String email = "test@example.com";
        RateLimitType limitType = RateLimitType.PASSWORD_RESET;

        // When & Then
        assertDoesNotThrow(() -> rateLimitService.checkEmailLimit(email, limitType));
    }

    @Test
    void testResetIpLimit_ShouldClearLimit() {
        // Given
        String ipAddress = "192.168.1.3";
        RateLimitType limitType = RateLimitType.REGISTRATION;

        // Consume all tokens
        for (int i = 0; i < 5; i++) {
            rateLimitService.checkIpLimit(ipAddress, limitType);
        }

        // Verify limit is exceeded
        assertThrows(RateLimitExceededException.class,
                () -> rateLimitService.checkIpLimit(ipAddress, limitType));

        // When - Reset limit
        rateLimitService.resetIpLimit(ipAddress, limitType);

        // Then - Should be able to make request again
        assertDoesNotThrow(() -> rateLimitService.checkIpLimit(ipAddress, limitType));
    }

    @Test
    void testResetUserLimit_ShouldClearLimit() {
        // Given
        Long userId = 789L;
        RateLimitType limitType = RateLimitType.PASSWORD_RESET;

        // Consume all tokens
        for (int i = 0; i < 3; i++) {
            rateLimitService.checkUserLimit(userId, limitType);
        }

        // Verify limit is exceeded
        assertThrows(RateLimitExceededException.class,
                () -> rateLimitService.checkUserLimit(userId, limitType));

        // When - Reset limit
        rateLimitService.resetUserLimit(userId, limitType);

        // Then - Should be able to make request again
        assertDoesNotThrow(() -> rateLimitService.checkUserLimit(userId, limitType));
    }

    @Test
    void testDifferentIpAddresses_ShouldHaveIndependentLimits() {
        // Given
        String ip1 = "192.168.1.4";
        String ip2 = "192.168.1.5";
        RateLimitType limitType = RateLimitType.REGISTRATION;

        // When - Consume all tokens for IP1
        for (int i = 0; i < 5; i++) {
            rateLimitService.checkIpLimit(ip1, limitType);
        }

        // Then - IP1 should be blocked
        assertThrows(RateLimitExceededException.class,
                () -> rateLimitService.checkIpLimit(ip1, limitType));

        // But IP2 should still work
        assertDoesNotThrow(() -> rateLimitService.checkIpLimit(ip2, limitType));
    }

    @Test
    void testCacheStats_ShouldReturnStats() {
        // Given
        rateLimitService.checkIpLimit("192.168.1.6", RateLimitType.PUBLIC_API);
        rateLimitService.checkUserLimit(999L, RateLimitType.AUTHENTICATED_API);

        // When
        String stats = rateLimitService.getCacheStats();

        // Then
        assertNotNull(stats);
        assertTrue(stats.contains("IP cache size"));
        assertTrue(stats.contains("User cache size"));
    }
}
