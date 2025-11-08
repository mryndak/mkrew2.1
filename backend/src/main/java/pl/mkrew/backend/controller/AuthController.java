package pl.mkrew.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.LoginRequest;
import pl.mkrew.backend.dto.LoginResponse;
import pl.mkrew.backend.dto.RegisterRequest;
import pl.mkrew.backend.dto.RegisterResponse;
import pl.mkrew.backend.dto.VerifyEmailResponse;
import pl.mkrew.backend.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * US-001: Register new user
     * POST /api/v1/auth/register
     *
     * Creates a new user account with email verification flow.
     * Password is hashed using BCrypt.
     * User is created with email_verified=false.
     * Verification token is generated and sent via email.
     *
     * @param request Registration details
     * @return RegisterResponse with userId, email, and verification message
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /api/v1/auth/register - Registration request for email: {}", request.getEmail());

        RegisterResponse response = authService.register(request);

        log.info("Registration successful for user ID: {}", response.getUserId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * US-002: Verify email address
     * GET /api/v1/auth/verify-email?token={token}
     *
     * Verifies user email address using token from registration email.
     * Validates token exists, not expired (24h), and not already used.
     * Marks user as email_verified=true.
     * Marks token as used (used_at=NOW()).
     * Idempotent: Returns success if email already verified.
     *
     * @param token Verification token from email
     * @return VerifyEmailResponse with success message and user email
     */
    @GetMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@RequestParam("token") String token) {
        log.info("GET /api/v1/auth/verify-email - Email verification request");

        VerifyEmailResponse response = authService.verifyEmail(token);

        log.info("Email verification successful for: {}", response.getEmail());

        return ResponseEntity.ok(response);
    }

    /**
     * US-003: User Login
     * POST /api/v1/auth/login
     *
     * Authenticates user with email and password.
     * Returns JWT access token and refresh token on success.
     * Validates email is verified and tracks failed login attempts.
     * Account is temporarily locked after 5 failed attempts (5 minutes).
     *
     * @param request Login credentials (email and password)
     * @return LoginResponse with JWT tokens and user details
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/v1/auth/login - Login request for email: {}", request.getEmail());

        LoginResponse response = authService.login(request);

        log.info("Login successful for user ID: {}", response.getUser().getId());

        return ResponseEntity.ok(response);
    }
}
