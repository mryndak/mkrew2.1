package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.entity.UserFavoriteRckik;
import pl.mkrew.backend.entity.UserToken;
import pl.mkrew.backend.exception.*;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserFavoriteRckikRepository;
import pl.mkrew.backend.repository.UserRepository;
import pl.mkrew.backend.repository.UserTokenRepository;
import pl.mkrew.backend.security.JwtTokenProvider;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserTokenRepository userTokenRepository;
    private final RckikRepository rckikRepository;
    private final UserFavoriteRckikRepository userFavoriteRckikRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;

    private static final int TOKEN_VALIDITY_HOURS = 24;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        log.info("Starting registration for email: {}", request.getEmail());

        // 1. Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: Email already exists - {}", request.getEmail());
            throw new EmailAlreadyExistsException("Email is already registered");
        }

        // 2. Hash password using BCrypt (via PasswordEncoder)
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        log.debug("Password hashed successfully");

        // 3. Create user with email_verified=false
        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(hashedPassword)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .bloodGroup(request.getBloodGroup())
                .emailVerified(false)
                .consentTimestamp(LocalDateTime.now())
                .consentVersion(request.getConsentVersion())
                .build();

        user = userRepository.save(user);
        log.info("User created with ID: {}", user.getId());

        // 4. Add favorite RCKiK centers if provided
        if (request.getFavoriteRckikIds() != null && !request.getFavoriteRckikIds().isEmpty()) {
            addFavoriteRckiks(user, request.getFavoriteRckikIds());
        }

        // 5. Generate EMAIL_VERIFICATION token (24h TTL)
        String verificationToken = generateVerificationToken(user);
        log.info("Verification token generated for user: {}", user.getId());

        // 6. TODO: Send verification email (mock for now)
        // emailService.sendVerificationEmail(user.getEmail(), verificationToken);
        log.info("Verification email would be sent to: {} with token: {}", user.getEmail(), verificationToken);

        // 7. Return response
        return RegisterResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .message("Registration successful. Please check your email to verify your account.")
                .build();
    }

    private void addFavoriteRckiks(User user, List<Long> rckikIds) {
        List<Rckik> rckiks = rckikRepository.findByIdIn(rckikIds);

        if (rckiks.size() != rckikIds.size()) {
            log.warn("Some RCKiK IDs not found. Requested: {}, Found: {}", rckikIds.size(), rckiks.size());
            throw new ResourceNotFoundException("One or more RCKiK centers not found");
        }

        int priority = 1;
        for (Rckik rckik : rckiks) {
            UserFavoriteRckik favorite = UserFavoriteRckik.builder()
                    .user(user)
                    .rckik(rckik)
                    .priority(priority++)
                    .build();

            userFavoriteRckikRepository.save(favorite);
        }

        log.info("Added {} favorite RCKiK centers for user: {}", rckiks.size(), user.getId());
    }

    private String generateVerificationToken(User user) {
        // Generate secure random token
        String token = UUID.randomUUID().toString();

        // Calculate expiration time (24 hours from now)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(TOKEN_VALIDITY_HOURS);

        // Create and save token
        UserToken userToken = UserToken.builder()
                .user(user)
                .token(token)
                .tokenType("EMAIL_VERIFICATION")
                .expiresAt(expiresAt)
                .build();

        userTokenRepository.save(userToken);

        return token;
    }

    @Transactional
    public VerifyEmailResponse verifyEmail(String token) {
        log.info("Starting email verification for token: {}", token.substring(0, 8) + "...");

        // 1. Find token by token value and type
        UserToken userToken = userTokenRepository.findByTokenAndTokenType(token, "EMAIL_VERIFICATION")
                .orElseThrow(() -> {
                    log.warn("Verification failed: Token not found");
                    return new InvalidTokenException("Verification token is invalid or has expired");
                });

        // 2. Check if token has expired
        if (userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Verification failed: Token expired at {}", userToken.getExpiresAt());
            throw new TokenExpiredException("Verification token has expired");
        }

        // 3. Check if token has already been used
        if (userToken.getUsedAt() != null) {
            log.warn("Verification failed: Token already used at {}", userToken.getUsedAt());
            throw new InvalidTokenException("Verification token has already been used");
        }

        // 4. Get user
        User user = userToken.getUser();

        // 5. Idempotent check: If user is already verified, return success
        if (user.getEmailVerified()) {
            log.info("User {} already verified, returning success", user.getEmail());
            return VerifyEmailResponse.builder()
                    .message("Email verified successfully. You can now log in.")
                    .email(user.getEmail())
                    .build();
        }

        // 6. Mark user as email_verified=true
        user.setEmailVerified(true);
        userRepository.save(user);
        log.info("User {} email verified successfully", user.getEmail());

        // 7. Mark token as used (used_at=NOW())
        userToken.setUsedAt(LocalDateTime.now());
        userTokenRepository.save(userToken);
        log.info("Verification token marked as used");

        return VerifyEmailResponse.builder()
                .message("Email verified successfully. You can now log in.")
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase();
        log.info("Login attempt for email: {}", email);

        // 1. Check if account is locked due to too many failed attempts
        if (loginAttemptService.isLocked(email)) {
            int retryAfter = loginAttemptService.getLockoutTimeRemaining(email);
            log.warn("Login blocked: Account locked for email: {}, retry after {} seconds", email, retryAfter);
            throw new AccountLockedException(
                    "Account temporarily locked. Please try again in " + retryAfter / 60 + " minutes.",
                    retryAfter
            );
        }

        // 2. Find user by email (active users only)
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> {
                    loginAttemptService.recordFailedAttempt(email);
                    log.warn("Login failed: User not found for email: {}", email);
                    return new InvalidCredentialsException("Invalid email or password");
                });

        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            loginAttemptService.recordFailedAttempt(email);
            log.warn("Login failed: Invalid password for email: {}", email);
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // 4. Check if email is verified
        if (!user.getEmailVerified()) {
            log.warn("Login failed: Email not verified for: {}", email);
            throw new EmailNotVerifiedException("Please verify your email before logging in");
        }

        // 5. Reset failed attempts counter on successful authentication
        loginAttemptService.resetAttempts(email);

        // 6. Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        log.info("Login successful for user ID: {}, email: {}", user.getId(), email);

        // 7. Build user DTO
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .bloodGroup(user.getBloodGroup())
                .emailVerified(user.getEmailVerified())
                .role("USER") // Default role for MVP
                .build();

        // 8. Return login response
        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationInSeconds())
                .refreshToken(refreshToken)
                .user(userDto)
                .build();
    }
}
