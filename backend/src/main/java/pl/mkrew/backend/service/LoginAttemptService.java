package pl.mkrew.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 5;

    // Map: email -> LoginAttemptInfo
    private final Map<String, LoginAttemptInfo> attemptCache = new ConcurrentHashMap<>();

    /**
     * Record a failed login attempt for the given email
     *
     * @param email User email
     */
    public void recordFailedAttempt(String email) {
        String key = email.toLowerCase();
        LoginAttemptInfo info = attemptCache.computeIfAbsent(key, k -> new LoginAttemptInfo());

        info.failedAttempts++;
        info.lastAttemptTime = LocalDateTime.now();

        if (info.failedAttempts >= MAX_ATTEMPTS) {
            info.lockoutUntil = LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES);
            log.warn("Account locked for email: {} due to {} failed attempts", email, info.failedAttempts);
        }

        log.debug("Failed login attempt #{} for email: {}", info.failedAttempts, email);
    }

    /**
     * Check if the account is locked due to too many failed attempts
     *
     * @param email User email
     * @return true if account is locked, false otherwise
     */
    public boolean isLocked(String email) {
        String key = email.toLowerCase();
        LoginAttemptInfo info = attemptCache.get(key);

        if (info == null) {
            return false;
        }

        // Check if lockout has expired
        if (info.lockoutUntil != null && LocalDateTime.now().isAfter(info.lockoutUntil)) {
            // Lockout expired, reset attempts
            attemptCache.remove(key);
            log.info("Lockout expired for email: {}, attempts reset", email);
            return false;
        }

        return info.failedAttempts >= MAX_ATTEMPTS && info.lockoutUntil != null;
    }

    /**
     * Get the remaining lockout time in seconds
     *
     * @param email User email
     * @return Remaining lockout time in seconds, or 0 if not locked
     */
    public int getLockoutTimeRemaining(String email) {
        String key = email.toLowerCase();
        LoginAttemptInfo info = attemptCache.get(key);

        if (info == null || info.lockoutUntil == null) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(info.lockoutUntil)) {
            return 0;
        }

        return (int) java.time.Duration.between(now, info.lockoutUntil).toSeconds();
    }

    /**
     * Reset failed attempts for the given email (on successful login)
     *
     * @param email User email
     */
    public void resetAttempts(String email) {
        String key = email.toLowerCase();
        attemptCache.remove(key);
        log.debug("Login attempts reset for email: {}", email);
    }

    /**
     * Get the number of failed attempts for the given email
     *
     * @param email User email
     * @return Number of failed attempts
     */
    public int getFailedAttempts(String email) {
        String key = email.toLowerCase();
        LoginAttemptInfo info = attemptCache.get(key);
        return info != null ? info.failedAttempts : 0;
    }

    /**
     * Inner class to hold login attempt information
     */
    private static class LoginAttemptInfo {
        int failedAttempts = 0;
        LocalDateTime lastAttemptTime;
        LocalDateTime lockoutUntil;
    }
}
