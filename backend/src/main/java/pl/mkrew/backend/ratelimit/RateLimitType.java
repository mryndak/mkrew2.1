package pl.mkrew.backend.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;

import java.time.Duration;

/**
 * Defines rate limit types for different API endpoints
 * US-023: API Security and Rate Limiting
 */
public enum RateLimitType {

    /**
     * Registration endpoint: 5 requests per IP per hour
     */
    REGISTRATION(5, Duration.ofHours(1)),

    /**
     * Password reset request: 3 requests per email per hour
     */
    PASSWORD_RESET(3, Duration.ofHours(1)),

    /**
     * Public API endpoints: 20 requests per IP per minute
     */
    PUBLIC_API(20, Duration.ofMinutes(1)),

    /**
     * Authenticated API endpoints: 100 requests per user per minute
     */
    AUTHENTICATED_API(100, Duration.ofMinutes(1)),

    /**
     * Admin API endpoints: 200 requests per user per minute
     */
    ADMIN_API(200, Duration.ofMinutes(1));

    private final long capacity;
    private final Duration refillDuration;

    RateLimitType(long capacity, Duration refillDuration) {
        this.capacity = capacity;
        this.refillDuration = refillDuration;
    }

    /**
     * Creates a Bandwidth limit for this rate limit type
     *
     * @return Bandwidth configuration
     */
    public Bandwidth getLimit() {
        return Bandwidth.classic(capacity, Refill.intervally(capacity, refillDuration));
    }

    public long getCapacity() {
        return capacity;
    }

    public Duration getRefillDuration() {
        return refillDuration;
    }
}
