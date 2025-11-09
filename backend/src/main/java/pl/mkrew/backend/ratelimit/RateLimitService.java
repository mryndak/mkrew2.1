package pl.mkrew.backend.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.mkrew.backend.exception.RateLimitExceededException;

import java.time.Duration;

/**
 * Service for managing rate limits per IP and per user
 * US-023: API Security and Rate Limiting
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RateLimitService {

    // Cache for IP-based rate limits
    private final Cache<String, Bucket> ipCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(Duration.ofHours(1))
            .build();

    // Cache for user-based rate limits
    private final Cache<String, Bucket> userCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(Duration.ofMinutes(5))
            .build();

    /**
     * Check rate limit for IP address
     *
     * @param ipAddress IP address
     * @param limitType Type of rate limit
     * @throws RateLimitExceededException if rate limit exceeded
     */
    public void checkIpLimit(String ipAddress, RateLimitType limitType) {
        String key = limitType.name() + ":" + ipAddress;
        Bucket bucket = ipCache.get(key, k -> createBucket(limitType));

        consumeOrThrow(bucket, ipAddress, limitType, "IP");
    }

    /**
     * Check rate limit for user
     *
     * @param userId User ID
     * @param limitType Type of rate limit
     * @throws RateLimitExceededException if rate limit exceeded
     */
    public void checkUserLimit(Long userId, RateLimitType limitType) {
        String key = limitType.name() + ":" + userId;
        Bucket bucket = userCache.get(key, k -> createBucket(limitType));

        consumeOrThrow(bucket, userId.toString(), limitType, "User");
    }

    /**
     * Check rate limit for email (used for password reset)
     *
     * @param email Email address
     * @param limitType Type of rate limit
     * @throws RateLimitExceededException if rate limit exceeded
     */
    public void checkEmailLimit(String email, RateLimitType limitType) {
        String key = limitType.name() + ":" + email.toLowerCase();
        Bucket bucket = ipCache.get(key, k -> createBucket(limitType));

        consumeOrThrow(bucket, email, limitType, "Email");
    }

    /**
     * Try to consume a token from bucket, throw exception if not available
     */
    private void consumeOrThrow(Bucket bucket, String identifier, RateLimitType limitType, String identifierType) {
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (!probe.isConsumed()) {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            int retryAfter = (int) Math.max(1, waitForRefill);

            log.warn("Rate limit exceeded for {} {} (type: {}). Retry after {} seconds",
                    identifierType, identifier, limitType, retryAfter);

            throw new RateLimitExceededException(
                    String.format("Too many requests. Please try again in %d seconds.", retryAfter),
                    retryAfter
            );
        }

        log.debug("Rate limit check passed for {} {} (type: {}). Remaining: {}",
                identifierType, identifier, limitType, probe.getRemainingTokens());
    }

    /**
     * Create a new bucket with the specified limit
     */
    private Bucket createBucket(RateLimitType limitType) {
        return Bucket.builder()
                .addLimit(limitType.getLimit())
                .build();
    }

    /**
     * Reset rate limit for specific IP (admin use)
     */
    public void resetIpLimit(String ipAddress, RateLimitType limitType) {
        String key = limitType.name() + ":" + ipAddress;
        ipCache.invalidate(key);
        log.info("Reset rate limit for IP: {} (type: {})", ipAddress, limitType);
    }

    /**
     * Reset rate limit for specific user (admin use)
     */
    public void resetUserLimit(Long userId, RateLimitType limitType) {
        String key = limitType.name() + ":" + userId;
        userCache.invalidate(key);
        log.info("Reset rate limit for user: {} (type: {})", userId, limitType);
    }

    /**
     * Get cache statistics for monitoring
     */
    public String getCacheStats() {
        return String.format("IP cache size: %d, User cache size: %d",
                ipCache.estimatedSize(), userCache.estimatedSize());
    }
}
