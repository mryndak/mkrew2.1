package pl.mkrew.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.mkrew.backend.dto.*;
import pl.mkrew.backend.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "User authentication and authorization endpoints")
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
    @Operation(
            summary = "Register new user",
            description = "Creates a new user account. Generates email verification token and sends verification email. Password is hashed with BCrypt."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = RegisterResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error or email already exists",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
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
    @Operation(
            summary = "Verify email address",
            description = "Verifies user email using token from registration email. Token valid for 24 hours. Idempotent operation."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Email verified successfully",
                    content = @Content(schema = @Schema(implementation = VerifyEmailResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid, expired, or already used token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
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
    @Operation(
            summary = "User login",
            description = "Authenticates user and returns JWT tokens. Requires verified email. Rate limited: 5 attempts per 5 minutes."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Login successful",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid credentials",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Email not verified",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "429",
                    description = "Too many failed attempts - account locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/v1/auth/login - Login request for email: {}", request.getEmail());

        LoginResponse response = authService.login(request);

        log.info("Login successful for user ID: {}", response.getUser().getId());

        return ResponseEntity.ok(response);
    }

    /**
     * US-004: Request Password Reset (Part 1)
     * POST /api/v1/auth/password-reset/request
     *
     * Initiates password reset process by sending reset link to user's email.
     * Generates PASSWORD_RESET token with 1-hour expiration.
     * Always returns success to prevent email enumeration.
     * Invalidates any previous unused PASSWORD_RESET tokens.
     *
     * @param request Password reset request with email
     * @return PasswordResetResponse with generic success message
     */
    @Operation(
            summary = "Request password reset",
            description = "Initiates password reset. Sends reset link to email if account exists. Always returns success to prevent email enumeration."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Password reset request processed",
                    content = @Content(schema = @Schema(implementation = PasswordResetResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/password-reset/request")
    public ResponseEntity<PasswordResetResponse> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequestDto request) {
        log.info("POST /api/v1/auth/password-reset/request - Password reset request for email: {}",
                request.getEmail());

        PasswordResetResponse response = authService.requestPasswordReset(request);

        log.info("Password reset request processed for email: {}", request.getEmail());

        return ResponseEntity.ok(response);
    }

    /**
     * US-004: Confirm Password Reset (Part 2)
     * POST /api/v1/auth/password-reset/confirm
     *
     * Completes password reset using token from email.
     * Validates token exists, not expired (1h), and not already used.
     * Updates user password with BCrypt hash.
     * Marks token as used (used_at=NOW()).
     * Invalidates all existing sessions for security.
     *
     * @param request Password reset confirmation with token and new password
     * @return PasswordResetResponse with success message
     */
    @Operation(
            summary = "Confirm password reset",
            description = "Completes password reset using token from email. Token valid for 1 hour. Password must meet complexity requirements."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Password reset successfully",
                    content = @Content(schema = @Schema(implementation = PasswordResetResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid/expired token or weak password",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<PasswordResetResponse> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmDto request) {
        log.info("POST /api/v1/auth/password-reset/confirm - Password reset confirmation attempt");

        PasswordResetResponse response = authService.confirmPasswordReset(request);

        log.info("Password reset completed successfully");

        return ResponseEntity.ok(response);
    }
}
