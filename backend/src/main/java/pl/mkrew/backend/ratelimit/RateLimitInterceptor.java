package pl.mkrew.backend.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import pl.mkrew.backend.exception.RateLimitExceededException;
import pl.mkrew.backend.security.SecurityUtils;

/**
 * Interceptor for rate limiting HTTP requests
 * US-023: API Security and Rate Limiting
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimitService;
    private final RateLimitAuditService rateLimitAuditService;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {
        String requestUri = request.getRequestURI();
        String method = request.getMethod();
        String ipAddress = getClientIpAddress(request);

        try {
            // Skip rate limiting for health checks and Swagger
            if (shouldSkipRateLimit(requestUri)) {
                return true;
            }

            // Determine rate limit type based on endpoint
            RateLimitType limitType = determineRateLimitType(requestUri, request);

            // Check rate limit based on authentication status
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()
                    && !authentication.getPrincipal().equals("anonymousUser")) {
                // Authenticated user - check user-based limit
                Long userId = SecurityUtils.getCurrentUserId();
                if (userId != null) {
                    rateLimitService.checkUserLimit(userId, limitType);
                }
            } else {
                // Anonymous user - check IP-based limit
                rateLimitService.checkIpLimit(ipAddress, limitType);
            }

            return true;

        } catch (RateLimitExceededException e) {
            // Log rate limit violation
            rateLimitAuditService.logRateLimitViolation(
                    ipAddress,
                    requestUri,
                    method,
                    SecurityUtils.getCurrentUserId()
            );
            throw e;
        }
    }

    /**
     * Determine rate limit type based on request URI
     */
    private RateLimitType determineRateLimitType(String requestUri, HttpServletRequest request) {
        // Registration endpoint
        if (requestUri.equals("/api/v1/auth/register")) {
            return RateLimitType.REGISTRATION;
        }

        // Password reset endpoint
        if (requestUri.equals("/api/v1/auth/password-reset/request")) {
            return RateLimitType.PASSWORD_RESET;
        }

        // Admin endpoints
        if (requestUri.startsWith("/api/v1/admin/")) {
            return RateLimitType.ADMIN_API;
        }

        // Authenticated endpoints
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !authentication.getPrincipal().equals("anonymousUser")) {
            return RateLimitType.AUTHENTICATED_API;
        }

        // Public endpoints (default)
        return RateLimitType.PUBLIC_API;
    }

    /**
     * Check if rate limiting should be skipped for this URI
     */
    private boolean shouldSkipRateLimit(String requestUri) {
        return requestUri.startsWith("/actuator/") ||
               requestUri.startsWith("/swagger-ui") ||
               requestUri.startsWith("/v3/api-docs") ||
               requestUri.equals("/error");
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_X_FORWARDED",
                "HTTP_X_CLUSTER_CLIENT_IP",
                "HTTP_CLIENT_IP",
                "HTTP_FORWARDED_FOR",
                "HTTP_FORWARDED",
                "HTTP_VIA",
                "REMOTE_ADDR"
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }

        return request.getRemoteAddr();
    }
}
